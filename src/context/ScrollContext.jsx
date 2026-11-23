import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import Lenis from 'lenis';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { gsap, ScrollTrigger } from '../lib/animation';

const ScrollContext = createContext(null);
const smoothScrollDuration = 1.05;
const anchorScrollDuration = 1.2;
const millisecondsPerSecond = 1000;

function resolveScrollTarget(target) {
  if (typeof target !== 'string') return target;

  try {
    return document.querySelector(target);
  } catch {
    return null;
  }
}

function getScrollPosition(destination) {
  if (typeof destination === 'number') return destination;

  const pinnedTrigger = ScrollTrigger.getAll().find((trigger) => trigger.pin === destination);
  if (pinnedTrigger) return Math.max(0, pinnedTrigger.start);

  const margin = parseFloat(getComputedStyle(destination).scrollMarginTop) || 0;
  return Math.max(0, destination.getBoundingClientRect().top + window.scrollY - margin);
}

export function ScrollProvider({ children, suspended = false }) {
  const reducedMotion = useReducedMotion();
  const lenisRef = useRef(null);
  const locksRef = useRef(new Set());
  const refreshFrame = useRef(0);

  const refreshScroll = useCallback(function scheduleRefresh() {
    if (refreshFrame.current) return;

    refreshFrame.current = requestAnimationFrame(() => {
      refreshFrame.current = 0;
      ScrollTrigger.refresh(true);
    });
  }, []);

  const lockScroll = useCallback(function acquireScrollLock() {
    const lock = Symbol('dialog');
    const locks = locksRef.current;
    locks.add(lock);
    document.documentElement.setAttribute('data-scroll-locked', '');
    lenisRef.current?.stop();

    return function releaseScrollLock() {
      if (!locks.delete(lock) || locks.size > 0) return;
      document.documentElement.removeAttribute('data-scroll-locked');
      if (!document.hidden) lenisRef.current?.start();
    };
  }, []);

  useEffect(function connectSmoothScroll() {
    if (reducedMotion || suspended) return;

    const lenis = new Lenis({
      duration: smoothScrollDuration,
      smoothWheel: true,
      syncTouch: false,
    });
    lenisRef.current = lenis;
    lenis.on('scroll', ScrollTrigger.update);

    function tick(seconds) {
      lenis.raf(seconds * millisecondsPerSecond);
    }

    function handleVisibility() {
      if (document.hidden || locksRef.current.size > 0) {
        lenis.stop();
        return;
      }
      lenis.start();
    }

    gsap.ticker.add(tick);
    handleVisibility();
    document.addEventListener('visibilitychange', handleVisibility);

    return function disconnectSmoothScroll() {
      document.removeEventListener('visibilitychange', handleVisibility);
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [reducedMotion, suspended]);

  const scrollTo = useCallback(function scrollToTarget(target, { immediate = false } = {}) {
    const destination = resolveScrollTarget(target);
    if (destination === null || destination === undefined || locksRef.current.size > 0) return;
    const top = getScrollPosition(destination);

    if (lenisRef.current) {
      lenisRef.current.scrollTo(top, { immediate, duration: anchorScrollDuration });
      return;
    }

    window.scrollTo({ top, behavior: 'instant' });
  }, []);

  useEffect(function refreshScrollMeasurements() {
    if (suspended) return;
    let cancelled = false;

    function refresh() {
      if (!cancelled) refreshScroll();
    }

    document.fonts.ready.then(refresh);
    refresh();

    return function cancelRefresh() {
      cancelled = true;
    };
  }, [reducedMotion, suspended, refreshScroll]);

  useEffect(function synchronizeScrollDimensions() {
    function resizeScroller() {
      lenisRef.current?.resize();
    }

    ScrollTrigger.addEventListener('refresh', resizeScroller);
    return function disconnectMeasurements() {
      ScrollTrigger.removeEventListener('refresh', resizeScroller);
      cancelAnimationFrame(refreshFrame.current);
      refreshFrame.current = 0;
    };
  }, []);

  useEffect(function synchronizeHashNavigation() {
    if (suspended) return;
    let frame = 0;

    function followHash() {
      cancelAnimationFrame(frame);
      if (!window.location.hash) return;

      frame = requestAnimationFrame(() => {
        let id = window.location.hash.slice(1);
        try {
          id = decodeURIComponent(id);
        } catch {
          return;
        }

        const destination = document.getElementById(id);
        if (!destination) return;
        ScrollTrigger.refresh();
        scrollTo(destination, { immediate: true });
      });
    }

    followHash();
    window.addEventListener('popstate', followHash);
    window.addEventListener('hashchange', followHash);

    return function disconnectHashNavigation() {
      cancelAnimationFrame(frame);
      window.removeEventListener('popstate', followHash);
      window.removeEventListener('hashchange', followHash);
    };
  }, [suspended, scrollTo]);

  const value = useMemo(() => ({ scrollTo, refreshScroll, lockScroll }), [scrollTo, refreshScroll, lockScroll]);

  return (
    <ScrollContext.Provider value={value}>
      {children}
    </ScrollContext.Provider>
  );
}

export function useScroll() {
  const context = useContext(ScrollContext);
  if (!context) {
    throw new Error('useScroll must be used inside ScrollProvider.');
  }
  return context;
}
