import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useVisibility } from './useVisibility';

let emit;
let disconnect;
const ref = { current: document.createElement('div') };
const options = { enterRatio: 0.2, exitRatio: 0.05, exitDelay: 250 };

beforeEach(() => {
  vi.useFakeTimers();
  disconnect = vi.fn();
  vi.stubGlobal('IntersectionObserver', class {
    constructor(callback) { emit = callback; }
    observe() {}
    disconnect() { disconnect(); }
  });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function intersect(ratio) {
  act(() => emit([{ isIntersecting: ratio > 0, intersectionRatio: ratio }]));
}

it('holds playback across small scrolls, cancels brief exits and requires reentry', () => {
  const { result } = renderHook(() => useVisibility(ref, '0px', options));
  intersect(0.18);
  expect(result.current).toBe(false);
  intersect(0.22);
  intersect(0.18);
  expect(result.current).toBe(true);
  intersect(0.02);
  act(() => vi.advanceTimersByTime(200));
  expect(result.current).toBe(true);
  intersect(0.18);
  act(() => vi.advanceTimersByTime(300));
  expect(result.current).toBe(true);
  intersect(0.02);
  act(() => vi.advanceTimersByTime(250));
  expect(result.current).toBe(false);
  intersect(0.12);
  expect(result.current).toBe(false);
  intersect(0.22);
  expect(result.current).toBe(true);
});

it('hides immediately with the document and releases delayed work on unmount', () => {
  const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
  const { result, unmount } = renderHook(() => useVisibility(ref, '0px', options));
  intersect(1);
  hidden.mockReturnValue(true);
  act(() => document.dispatchEvent(new Event('visibilitychange')));
  expect(result.current).toBe(false);
  hidden.mockReturnValue(false);
  act(() => document.dispatchEvent(new Event('visibilitychange')));
  expect(result.current).toBe(true);
  intersect(0);
  unmount();
  expect(disconnect).toHaveBeenCalledOnce();
  expect(vi.getTimerCount()).toBe(0);
});
