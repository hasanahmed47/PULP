import { test, expect } from '@playwright/test';
import { vertexShader, fragmentShader } from '../../src/components/Footer/flameShader.js';

async function renderShaderFrames(page, { width, height, fragment = fragmentShader, frames }) {
  return page.evaluate(({ vertex, fragment, width, height, frames }) => {
    const canvas = document.createElement('canvas');
    canvas.height = height;
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

    function renderFrame({ time, width: frameWidth = width }) {
      canvas.width = frameWidth;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(gl.getUniformLocation(program, 'uResolution'), canvas.width, canvas.height);
      gl.uniform1f(gl.getUniformLocation(program, 'uTime'), time);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      const pixels = new Uint8Array(canvas.width * canvas.height * 4);
      gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      return { width: canvas.width, pixels: [...pixels] };
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
        frames: frames.map(renderFrame),
        error: gl.getError(),
      };
    } finally {
      gl.deleteProgram(program);
      shaders.forEach((shader) => gl.deleteShader(shader));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
  }, { vertex: vertexShader, fragment, width, height, frames });
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
  const viewport = page.viewportSize();
  const width = Math.round(80 * viewport.width / viewport.height);
  const { frames, error } = await renderShaderFrames(page, {
    width,
    height: 80,
    frames: [
      ...[14, 18, 30, 60, 120, 300, 600, 14].map((time) => ({ time })),
      { time: 14, width: Math.round(80 * 1.44) },
    ],
  });
  const first = frames[0].pixels;
  const desktop = frames.at(-1);
  expect(error).toBe(0);
  expect(frames.at(-2).pixels).toEqual(first);
  expect(frames[1].pixels).not.toEqual(first);
  for (const { pixels } of frames.slice(0, 7)) {
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
      plumeHeight(first, width, position) - plumeHeight(desktop.pixels, desktop.width, position),
    );
  }
  expect(silhouetteDifference / 24).toBeLessThan(0.025);
});

test('noise seeds survive lower float precision and noise stays continuous at lattice boundaries', async ({ page }) => {
  const functions = fragmentShader.slice(0, fragmentShader.lastIndexOf('void main()'));
  const probe = `${functions}
void main() {
  vec2 cell = floor(gl_FragCoord.xy) - vec2(16.0);
  fragmentColor = vec4(vec3(randomValue(cell)), 1.0);
}`;
  const settings = { width: 32, height: 32, frames: [{ time: 14 }] };
  const normal = await renderShaderFrames(page, { ...settings, fragment: probe });
  const lowerPrecision = await renderShaderFrames(page, {
    ...settings,
    fragment: probe.replace('precision highp float;', 'precision mediump float;'),
  });
  expect(normal.error).toBe(0);
  expect(lowerPrecision.error).toBe(0);
  const seedSamples = [
    { x: -16, y: -16, value: 20 },
    { x: 15, y: -16, value: 46 },
    { x: -16, y: 15, value: 24 },
    { x: 15, y: 15, value: 80 },
    { x: -3, y: 7, value: 172 },
    { x: 0, y: 0, value: 0 },
  ];
  for (const { x, y, value } of seedSamples) {
    const offset = ((y + 16) * 32 + x + 16) * 4;
    expect(Math.abs(normal.frames[0].pixels[offset] - value)).toBeLessThanOrEqual(1);
  }
  let largestDifference = 0;
  for (let index = 0; index < normal.frames[0].pixels.length; index++) {
    const difference = Math.abs(normal.frames[0].pixels[index] - lowerPrecision.frames[0].pixels[index]);
    largestDifference = Math.max(largestDifference, difference);
  }
  expect(largestDifference).toBeLessThanOrEqual(1);

  const boundaryProbe = `${functions}
void main() {
  vec2 position = floor(gl_FragCoord.xy) - vec2(16.0);
  position.y += 0.37;
  float center = smoothNoise(position);
  float before = smoothNoise(position - vec2(0.001, 0.0));
  float after = smoothNoise(position + vec2(0.001, 0.0));
  fragmentColor = vec4(center, before, after, 1.0);
}`;
  const boundary = await renderShaderFrames(page, { ...settings, fragment: boundaryProbe });
  expect(boundary.error).toBe(0);
  const pixels = boundary.frames[0].pixels;
  for (let offset = 0; offset < pixels.length; offset += 4) {
    expect(Math.abs(pixels[offset] - pixels[offset + 1])).toBeLessThanOrEqual(1);
    expect(Math.abs(pixels[offset] - pixels[offset + 2])).toBeLessThanOrEqual(1);
  }
});
