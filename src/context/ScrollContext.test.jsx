import { StrictMode } from 'react';
import { act, cleanup, render, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { ScrollProvider, useScroll } from './ScrollContext';
import { useDialogScrollLock } from '../hooks/useDialogScrollLock';

const mocks = vi.hoisted(() => ({
  instances: [],
  reduced: false,
  refresh: vi.fn(),
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addTick: vi.fn(),
  removeTick: vi.fn(),
}));

vi.mock('lenis', () => ({
  default: class {
    constructor() {
      this.on = vi.fn();
      this.raf = vi.fn();
      this.stop = vi.fn();
      this.start = vi.fn();
      this.resize = vi.fn();
      this.scrollTo = vi.fn();
      this.destroy = vi.fn();
      mocks.instances.push(this);
    }
  },
}));

vi.mock('../hooks/useReducedMotion', () => ({ useReducedMotion: () => mocks.reduced }));
vi.mock('../lib/animation', () => ({
  gsap: { ticker: { add: mocks.addTick, remove: mocks.removeTick } },
  ScrollTrigger: {
    getAll: () => [],
    update: vi.fn(),
    refresh: mocks.refresh,
    addEventListener: mocks.addListener,
    removeEventListener: mocks.removeListener,
  },
}));

beforeEach(() => {
  vi.useFakeTimers();
  mocks.instances.length = 0;
  mocks.reduced = false;
  vi.stubGlobal('requestAnimationFrame', (callback) => setTimeout(callback, 16));
  vi.stubGlobal('cancelAnimationFrame', clearTimeout);
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
  Object.defineProperty(document, 'fonts', { configurable: true, value: { ready: Promise.resolve() } });
  window.history.replaceState(null, '', '/');
  window.scrollTo = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

function Wrapper({ children }) {
  return <ScrollProvider>{children}</ScrollProvider>;
}

function Modal({ open }) {
  useDialogScrollLock(open);
  return null;
}

it('keeps scrolling locked until the last dialog closes, including after a visibility change', () => {
  const { result } = renderHook(useScroll, { wrapper: Wrapper });
  const lenis = mocks.instances[0];
  lenis.start.mockClear();
  let releaseFirst;
  let releaseSecond;

  act(() => {
    releaseFirst = result.current.lockScroll();
    releaseSecond = result.current.lockScroll();
    document.dispatchEvent(new Event('visibilitychange'));
    result.current.scrollTo(400);
  });
  expect(document.documentElement.hasAttribute('data-scroll-locked')).toBe(true);
  expect(lenis.start).not.toHaveBeenCalled();
  expect(lenis.scrollTo).not.toHaveBeenCalled();

  act(() => { releaseFirst(); releaseFirst(); });
  expect(document.documentElement.hasAttribute('data-scroll-locked')).toBe(true);
  act(() => releaseSecond());
  expect(document.documentElement.hasAttribute('data-scroll-locked')).toBe(false);
  expect(lenis.start).toHaveBeenCalledOnce();
});

it('releases dialog locks after StrictMode cleanup and retains them when reduced motion changes', () => {
  const { rerender, unmount } = render(
    <StrictMode><ScrollProvider><Modal open /></ScrollProvider></StrictMode>,
  );
  expect(document.documentElement.hasAttribute('data-scroll-locked')).toBe(true);
  expect(mocks.instances.at(-1).start).not.toHaveBeenCalled();

  mocks.reduced = true;
  rerender(<StrictMode><ScrollProvider><Modal open /></ScrollProvider></StrictMode>);
  expect(document.documentElement.hasAttribute('data-scroll-locked')).toBe(true);
  expect(mocks.instances.at(-1).destroy).toHaveBeenCalledOnce();
  unmount();
  expect(document.documentElement.hasAttribute('data-scroll-locked')).toBe(false);
});

it('coalesces layout refreshes, resizes Lenis after pin measurement and cancels queued work on unmount', async () => {
  const { result, unmount } = renderHook(useScroll, { wrapper: Wrapper });
  await act(async () => {});
  act(() => {
    result.current.refreshScroll();
    result.current.refreshScroll();
    vi.advanceTimersByTime(16);
  });
  expect(mocks.refresh).toHaveBeenCalledExactlyOnceWith(true);
  const onRefresh = mocks.addListener.mock.calls.find(([event]) => event === 'refresh')[1];
  onRefresh();
  expect(mocks.instances[0].resize).toHaveBeenCalledOnce();
  result.current.refreshScroll();
  unmount();
  act(() => vi.advanceTimersByTime(100));
  expect(mocks.refresh).toHaveBeenCalledTimes(1);
  expect(mocks.removeListener).toHaveBeenCalledWith('refresh', onRefresh);
});

it('honours section scroll margins while leaving numeric animation destinations unchanged', () => {
  const { result } = renderHook(useScroll, { wrapper: Wrapper });
  const target = document.createElement('section');
  target.getBoundingClientRect = () => ({ top: 500 });
  vi.spyOn(window, 'getComputedStyle').mockReturnValue({ scrollMarginTop: '24px' });
  act(() => result.current.scrollTo(target));
  expect(mocks.instances[0].scrollTo).toHaveBeenLastCalledWith(476, { immediate: false, duration: 1.2 });
  act(() => result.current.scrollTo(500, { immediate: true }));
  expect(mocks.instances[0].scrollTo).toHaveBeenLastCalledWith(500, { immediate: true, duration: 1.2 });
});
