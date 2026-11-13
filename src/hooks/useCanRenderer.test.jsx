import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { loadCanSceneModule } from '../three/loadCanScene';
import { useCanRenderer } from './useCanRenderer';

vi.mock('../context/SceneStartContext', () => ({ useSceneStartAllowed: () => true }));
vi.mock('../three/loadCanScene', () => ({ loadCanSceneModule: vi.fn() }));

let hostRef;
let poseRef;
let createCanScene;
let scenes;

beforeEach(() => {
  vi.useFakeTimers();
  hostRef = { current: document.createElement('div') };
  poseRef = { current: { rotation: 0, spin: 0, tilt: 0, blend: { from: 0, to: 0, amount: 0 }, pointer: [0, 0] } };
  scenes = [];
  createCanScene = vi.fn((...args) => {
    const callbacks = args[2];
    const scene = {
      dispose: vi.fn(), setVisible: vi.fn(), setRotation: vi.fn(),
      setTilt: vi.fn(), setFlavourBlend: vi.fn(), setPointer: vi.fn(),
    };
    scenes.push({ scene, callbacks });
    return scene;
  });
  loadCanSceneModule.mockResolvedValue({ createCanScene });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.resetAllMocks();
});

function useRenderer() {
  return useCanRenderer(hostRef, poseRef, { interactive: true, visible: true });
}

it('creates only the current scene when a module resolves after a retry', async () => {
  const module = Promise.withResolvers();
  loadCanSceneModule.mockReturnValue(module.promise);
  const { result, unmount } = renderHook(useRenderer);
  await act(async () => vi.advanceTimersByTimeAsync(61000));
  expect(loadCanSceneModule).toHaveBeenCalledTimes(2);
  await act(async () => module.resolve({ createCanScene }));
  expect(createCanScene).toHaveBeenCalledTimes(1);
  expect(result.current.sceneRef.current).toBe(scenes[0].scene);
  unmount();
  expect(scenes[0].scene.dispose).toHaveBeenCalledTimes(1);
  expect(vi.getTimerCount()).toBe(0);
});

it('restarts first-frame monitoring after context loss and ignores obsolete callbacks', async () => {
  const { result, unmount } = renderHook(useRenderer);
  await act(async () => {});
  act(() => scenes[0].callbacks.onReady());
  expect(result.current.status).toBe('ready');
  act(() => scenes[0].callbacks.onError());
  expect(result.current.status).toBe('loading');
  expect(scenes[0].scene.dispose).toHaveBeenCalledTimes(1);
  await act(async () => vi.advanceTimersByTimeAsync(1000));
  act(() => {
    scenes[0].callbacks.onReady();
    scenes[0].callbacks.onError();
    scenes[1].callbacks.onPrepared();
  });
  expect(result.current.status).toBe('loading');
  expect(scenes[1].scene.dispose).not.toHaveBeenCalled();
  await act(async () => vi.advanceTimersByTimeAsync(12000));
  expect(scenes[1].scene.dispose).toHaveBeenCalledTimes(1);
  unmount();
  await act(async () => vi.advanceTimersByTimeAsync(2500));
  expect(createCanScene).toHaveBeenCalledTimes(2);
  expect(vi.getTimerCount()).toBe(0);
});

it('does not create a scene from a module that finishes after unmount', async () => {
  const module = Promise.withResolvers();
  loadCanSceneModule.mockReturnValue(module.promise);
  const { unmount } = renderHook(useRenderer);
  unmount();
  await act(async () => module.resolve({ createCanScene }));
  expect(createCanScene).not.toHaveBeenCalled();
  expect(vi.getTimerCount()).toBe(0);
});
