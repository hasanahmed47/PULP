import { test, expect } from '@playwright/test';
import { vertexShader, fragmentShader } from '../../src/components/Footer/flameShader.js';

async function renderFlameFrames(page) {
  const viewport = page.viewportSize();
  return page.evaluate(({ vertex, fragment, aspect }) => {
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(80 * aspect);
    canvas.height = 80;
    const gl = canvas.getContext('webgl2');
    if (!gl) throw new Error('WebGL2 is required to verify the flame.');
    const shaders = [];
    const program = gl.createProgram();

    function compileShader(type, source) {
      const shader = gl.createShader(type);
      shaders.push(shader);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(shader));
      }
      gl.attachShader(program, shader);
    }

    function renderFrame(time, frameAspect = aspect) {
      canvas.width = Math.round(80 * frameAspect);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(gl.getUniformLocation(program, 'uResolution'), canvas.width, canvas.height);
      gl.uniform1f(gl.getUniformLocation(program, 'uTime'), time);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      const pixels = new Uint8Array(canvas.width * canvas.height * 4);
      gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      return [...pixels];
    }

    try {
      compileShader(gl.VERTEX_SHADER, vertex);
      compileShader(gl.FRAGMENT_SHADER, fragment);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program));
      }
      gl.useProgram(program);
      gl.disable(gl.DITHER);
      return {
        width: canvas.width,
        first: renderFrame(14),
        later: renderFrame(18),
        samples: [30, 60, 120, 300, 600].map((time) => renderFrame(time)),
        repeated: renderFrame(14),
        desktop: renderFrame(14, 1.44),
        desktopWidth: canvas.width,
        error: gl.getError(),
      };
    } finally {
      gl.deleteProgram(program);
      shaders.forEach((shader) => gl.deleteShader(shader));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
  }, { vertex: vertexShader, fragment: fragmentShader, aspect: viewport.width / viewport.height });
}

function plumeHeight(pixels, width, horizontalPosition) {
  const height = pixels.length / (width * 4);
  const column = Math.floor(horizontalPosition * width);
  for (let row = height - 1; row >= 0; row--) {
    const offset = (row * width + column) * 4;
    if (pixels[offset + 2] > pixels[offset] + 40) return (row + 1) / height;
  }
  return 0;
}

test('flame retains desktop composition, animates and keeps text areas clear', async ({ page }) => {
  const { width, first, later, repeated, samples, desktop, desktopWidth, error } = await renderFlameFrames(page);
  expect(error).toBe(0);
  expect(repeated).toEqual(first);
  expect(later).not.toEqual(first);
  for (const pixels of [first, later, ...samples]) {
    const base = pixels.slice(0, width * 4 * 8);
    for (let offset = 0; offset < base.length; offset += 4) {
      expect(base[offset + 2]).toBeGreaterThan(base[offset] + 40);
    }
    const top = pixels.slice(-width * 4);
    for (let offset = 0; offset < top.length; offset += 4) {
      expect(top.slice(offset, offset + 4)).toEqual([253, 248, 243, 255]);
    }
  }
  let bluePixels = 0;
  for (let offset = 0; offset < first.length; offset += 4) {
    if (first[offset + 2] > first[offset] + 40) bluePixels += 1;
    expect(first[offset + 3]).toBe(255);
  }
  expect(bluePixels).toBeGreaterThan(width * 4);

  let silhouetteDifference = 0;
  for (let sample = 0; sample < 24; sample++) {
    const position = (sample + 0.5) / 24;
    silhouetteDifference += Math.abs(
      plumeHeight(first, width, position) - plumeHeight(desktop, desktopWidth, position),
    );
  }
  expect(silhouetteDifference / 24).toBeLessThan(0.025);
});
