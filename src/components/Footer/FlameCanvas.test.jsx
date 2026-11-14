import { StrictMode } from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { FlameCanvas } from './FlameCanvas';

let gl;
let motion;
let observers;
let frames;
let nextFrame;
let bounds;
let hidden;
let loseContext;

beforeEach(() => {
  observers = [];
  frames = new Map();
  nextFrame = 0;
  bounds = { width: 1000, height: 800 };
  hidden = false;
  loseContext = vi.fn();
  motion = new EventTarget();
  motion.matches = false;
  gl = {
    VERTEX_SHADER: 35633, FRAGMENT_SHADER: 35632, COMPILE_STATUS: 35713, LINK_STATUS: 35714, TRIANGLES: 4,
    createShader: vi.fn(() => ({})), shaderSource: vi.fn(), compileShader: vi.fn(),
    getShaderParameter: vi.fn(() => true), getShaderInfoLog: vi.fn(() => 'Compile diagnostic'),
    createProgram: vi.fn(() => ({})), attachShader: vi.fn(), linkProgram: vi.fn(),
    getProgramParameter: vi.fn(() => true), getProgramInfoLog: vi.fn(() => 'Link diagnostic'),
    useProgram: vi.fn(), getUniformLocation: vi.fn((...parameters) => parameters[1]),
    uniform2f: vi.fn(), uniform1f: vi.fn(), drawArrays: vi.fn(), viewport: vi.fn(),
    deleteShader: vi.fn(), deleteProgram: vi.fn(), isContextLost: vi.fn(() => false),
    getExtension: vi.fn(() => ({ loseContext })),
  };
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(gl);
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => bounds);
  vi.spyOn(document, 'hidden', 'get').mockImplementation(() => hidden);
  vi.stubGlobal('matchMedia', () => motion);
  vi.stubGlobal('innerWidth', 1000);
  vi.stubGlobal('devicePixelRatio', 3);
  vi.spyOn(navigator, 'hardwareConcurrency', 'get').mockReturnValue(8);
  vi.stubGlobal('requestAnimationFrame', (callback) => {
    frames.set(++nextFrame, callback);
    return nextFrame;
  });
  vi.stubGlobal('cancelAnimationFrame', (id) => frames.delete(id));
  class Observer {
    constructor(callback) {
      this.callback = callback;
      this.observe = vi.fn();
      this.disconnect = vi.fn();
      observers.push(this);
    }
  }
  vi.stubGlobal('ResizeObserver', Observer);
  vi.stubGlobal('IntersectionObserver', Observer);
});

afterEach(async () => {
  cleanup();
  await Promise.resolve();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function stepFrame(now) {
  const callbacks = [...frames.values()];
  frames.clear();
  callbacks.forEach((callback) => callback(now));
}

function setVisible(visible) {
  observers.at(-1).callback([{ isIntersecting: visible }]);
}

it('survives StrictMode replay and releases all resources on actual unmount', async () => {
  const { unmount } = render(<StrictMode><FlameCanvas /></StrictMode>);
  await Promise.resolve();
  expect(loseContext).not.toHaveBeenCalled();
  expect(gl.deleteProgram).toHaveBeenCalledTimes(1);
  expect(gl.deleteShader).toHaveBeenCalledTimes(2);
  setVisible(true);
  stepFrame(100);
  expect(gl.drawArrays).toHaveBeenCalledWith(gl.TRIANGLES, 0, 3);
  expect(frames.size).toBe(1);
  unmount();
  await Promise.resolve();
  expect(frames.size).toBe(0);
  expect(gl.deleteProgram).toHaveBeenCalledTimes(2);
  expect(gl.deleteShader).toHaveBeenCalledTimes(4);
  expect(loseContext).toHaveBeenCalledTimes(1);
  observers.forEach((observer) => expect(observer.disconnect).toHaveBeenCalledTimes(1));
  motion.dispatchEvent(new Event('change'));
  document.dispatchEvent(new Event('visibilitychange'));
  expect(frames.size).toBe(0);
});

it('pauses offscreen and in hidden tabs without accumulating elapsed time', () => {
  render(<FlameCanvas />);
  expect(frames.size).toBe(0);
  setVisible(true);
  stepFrame(1000);
  stepFrame(2000);
  expect(gl.uniform1f).toHaveBeenLastCalledWith('uTime', 15);
  setVisible(false);
  expect(frames.size).toBe(0);
  setVisible(true);
  hidden = true;
  document.dispatchEvent(new Event('visibilitychange'));
  expect(frames.size).toBe(0);
  hidden = false;
  document.dispatchEvent(new Event('visibilitychange'));
  stepFrame(10000);
  expect(gl.uniform1f).toHaveBeenLastCalledWith('uTime', 15);
  expect(frames.size).toBe(1);
});

it('draws reduced motion once at time 14, redraws on parent resize and handles live preference changes', () => {
  motion.matches = true;
  const { container } = render(<FlameCanvas />);
  const canvas = container.querySelector('canvas');
  expect(canvas.width).toBe(1500);
  expect(observers[0].observe).toHaveBeenCalledWith(canvas.parentElement);
  setVisible(true);
  expect(gl.uniform1f).toHaveBeenLastCalledWith('uTime', 14);
  expect(gl.drawArrays).toHaveBeenCalledTimes(1);
  expect(frames.size).toBe(0);
  bounds = { width: 500, height: 700 };
  vi.stubGlobal('innerWidth', 500);
  observers[0].callback();
  expect(canvas.width).toBe(750);
  expect(canvas.height).toBe(1050);
  expect(gl.drawArrays).toHaveBeenCalledTimes(2);
  expect(frames.size).toBe(0);
  motion.matches = false;
  motion.dispatchEvent(new Event('change'));
  expect(frames.size).toBe(1);
  motion.matches = true;
  motion.dispatchEvent(new Event('change'));
  expect(frames.size).toBe(0);
  expect(gl.uniform1f).toHaveBeenLastCalledWith('uTime', 14);
});

it('caps low-power rendering at native CSS resolution', () => {
  vi.spyOn(navigator, 'hardwareConcurrency', 'get').mockReturnValue(4);
  const { container } = render(<FlameCanvas />);
  expect(container.querySelector('canvas').width).toBe(1000);
});

it('keeps phone detail at high DPR and limits the pixel cost of large screens', () => {
  bounds = { width: 390, height: 844 };
  const { container } = render(<FlameCanvas />);
  const canvas = container.querySelector('canvas');
  expect(canvas.width).toBe(585);
  expect(canvas.height).toBe(1266);

  bounds = { width: 3840, height: 2160 };
  observers[0].callback();
  expect(canvas.width * canvas.height).toBeLessThanOrEqual(1_800_000);
  expect(canvas.width / canvas.height).toBeCloseTo(3840 / 2160, 2);
});

it.each(['unavailable', 'compile', 'link'])('keeps the gradient visible after %s failure', async (failure) => {
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});
  if (failure === 'unavailable') HTMLCanvasElement.prototype.getContext.mockReturnValue(null);
  if (failure === 'compile') gl.getShaderParameter.mockReturnValue(false);
  if (failure === 'link') gl.getProgramParameter.mockReturnValue(false);
  const { container } = render(<FlameCanvas />);
  await Promise.resolve();
  expect(container.querySelector('canvas').hidden).toBe(true);
  expect(frames.size).toBe(0);
  expect(observers).toHaveLength(0);
  if (failure === 'unavailable') {
    expect(log).not.toHaveBeenCalled();
  } else {
    expect(log).toHaveBeenCalledWith('PULP footer:', expect.objectContaining({
      message: failure === 'compile' ? 'Compile diagnostic' : 'Link diagnostic',
    }));
    expect(gl.deleteShader).toHaveBeenCalledTimes(failure === 'compile' ? 1 : 2);
    expect(loseContext).toHaveBeenCalledTimes(1);
  }
});

it('reveals the fallback and stops rendering after context loss', () => {
  const { container } = render(<FlameCanvas />);
  setVisible(true);
  stepFrame(100);
  const canvas = container.querySelector('canvas');
  expect(canvas.hidden).toBe(false);
  gl.isContextLost.mockReturnValue(true);
  canvas.dispatchEvent(new Event('webglcontextlost'));
  expect(canvas.hidden).toBe(true);
  expect(frames.size).toBe(0);
  setVisible(true);
  expect(frames.size).toBe(0);
});
