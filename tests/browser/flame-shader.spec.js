import { test, expect } from '@playwright/test';
import { vertexShader, fragmentShader } from '../../src/components/Footer/flameShader.js';

async function readNoiseSamples(page, cells, expression) {
  const probe = fragmentShader.slice(0, fragmentShader.indexOf('void main()')) + `
uniform ivec2 cells[8];
void main(){
  ivec2 cell = cells[int(gl_FragCoord.x)];
  uint value = uint((${expression}) * 16777216.);
  o = vec4(vec3((value >> 16u) & 255u, (value >> 8u) & 255u, value & 255u) / 255., 1.);
}`;
  return page.evaluate(({ vertex, fragment, cells }) => {
    const canvas = document.createElement('canvas');
    canvas.width = cells.length;
    canvas.height = 1;
    const gl = canvas.getContext('webgl2');
    if (!gl) throw new Error('WebGL2 is required to verify the flame hash.');
    const shaders = [];
    const program = gl.createProgram();

    function compile(type, source) {
      const shader = gl.createShader(type);
      shaders.push(shader);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(shader));
      }
      gl.attachShader(program, shader);
    }

    try {
      compile(gl.VERTEX_SHADER, vertex);
      compile(gl.FRAGMENT_SHADER, fragment);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program));
      }
      gl.useProgram(program);
      gl.disable(gl.DITHER);
      gl.uniform2iv(gl.getUniformLocation(program, 'cells[0]'), cells.flat());
      gl.viewport(0, 0, cells.length, 1);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      const pixels = new Uint8Array(cells.length * 4);
      gl.readPixels(0, 0, cells.length, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      return Array.from(cells.keys(), (index) => {
        const offset = index * 4;
        return pixels[offset] * 65536 + pixels[offset + 1] * 256 + pixels[offset + 2];
      });
    } finally {
      gl.deleteProgram(program);
      shaders.forEach((shader) => gl.deleteShader(shader));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
  }, { vertex: vertexShader, fragment: probe, cells });
}

test('flame hash preserves reference values for positive and negative lattice cells', async ({ page }) => {
  const cells = [[0, 0], [1, 0], [0, 1], [-1, 0], [0, -1], [-13, 27], [255, -511], [4096, 8192]];
  const values = await readNoiseSamples(page, cells, 'hash(cell)');
  expect(values).toEqual([0, 130277, 2031336, 8311929, 12099585, 395242, 6770716, 1747562]);
});

test('flame noise stays smooth across a negative-to-positive cell boundary', async ({ page }) => {
  const cells = [-10, -5, -2, -1, 0, 1, 5, 10].map((x) => [x, 0]);
  const values = await readNoiseSamples(page, cells, 'noise(vec2(float(cell.x) * .00001, .37))');
  expect(Math.max(...values) - Math.min(...values)).toBeLessThanOrEqual(1);
});
