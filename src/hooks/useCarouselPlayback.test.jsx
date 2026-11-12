import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useCarouselPlayback } from './useCarouselPlayback';

let video;
let videos;
let onBlocked;
let onFailure;

beforeEach(() => {
  vi.useFakeTimers();
  video = document.createElement('video');
  vi.spyOn(video, 'play').mockResolvedValue();
  vi.spyOn(video, 'pause').mockImplementation(() => {});
  videos = { current: [video] };
  onBlocked = vi.fn();
  onFailure = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

function usePlayback({ source = '/clip.mp4', running = true } = {}) {
  useCarouselPlayback(videos, 0, source, running, onBlocked, onFailure);
}

it('waits for a lazy source and ignores duplicate canplay while play is pending', async () => {
  let resolvePlay;
  video.play.mockImplementation(() => new Promise((resolve) => { resolvePlay = resolve; }));
  const { rerender } = renderHook(usePlayback, { initialProps: { source: '' } });
  expect(video.play).not.toHaveBeenCalled();
  rerender({ source: '/clip.mp4' });
  act(() => video.dispatchEvent(new Event('canplay')));
  expect(video.play).toHaveBeenCalledTimes(1);
  expect(video.muted).toBe(true);
  await act(async () => resolvePlay());
});

it('retries interrupted play at most twice and cancels pending retries on pause', async () => {
  video.play.mockRejectedValue(new DOMException('Interrupted', 'AbortError'));
  const { rerender } = renderHook(usePlayback);
  await act(async () => vi.advanceTimersByTimeAsync(450));
  expect(video.play).toHaveBeenCalledTimes(3);
  expect(onFailure).not.toHaveBeenCalled();

  rerender({ source: '/other.mp4' });
  await act(async () => {});
  rerender({ source: '/other.mp4', running: false });
  const attempts = video.play.mock.calls.length;
  await act(async () => vi.advanceTimersByTimeAsync(450));
  expect(video.play).toHaveBeenCalledTimes(attempts);
  expect(video.pause).toHaveBeenCalled();
});

it('surfaces autoplay denial and media failure without unhandled rejections', async () => {
  video.play.mockRejectedValueOnce(new DOMException('Denied', 'NotAllowedError'));
  const { rerender } = renderHook(usePlayback);
  await act(async () => {});
  expect(onBlocked).toHaveBeenCalledTimes(1);
  expect(onFailure).not.toHaveBeenCalled();

  video.play.mockRejectedValueOnce(new DOMException('Unsupported', 'NotSupportedError'));
  rerender({ source: '/broken.mp4' });
  await act(async () => {});
  expect(onFailure).toHaveBeenCalledWith('/broken.mp4');
});

it('ignores late rejections after unmount and removes media listeners', async () => {
  const playback = Promise.withResolvers();
  video.play.mockReturnValue(playback.promise);
  const { unmount } = renderHook(usePlayback);
  unmount();
  await act(async () => playback.reject(new DOMException('Denied', 'NotAllowedError')));
  video.dispatchEvent(new Event('canplay'));
  expect(video.play).toHaveBeenCalledTimes(1);
  expect(onBlocked).not.toHaveBeenCalled();
  expect(onFailure).not.toHaveBeenCalled();
});
