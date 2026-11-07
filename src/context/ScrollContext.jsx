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

  return destination.getBoundingClientRect().top + window.scrollY;
}

export function ScrollProvider({ children, suspended = false }) {
  const reducedMotion = useReducedMotion();
  const lenisRef = useRef(null);

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
      if (document.hidden) {
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
    if (destination === null || destination === undefined) return;
    const top = getScrollPosition(destination);

    if (lenisRef.current && !reducedMotion) {
      lenisRef.current.scrollTo(top, { immediate, duration: anchorScrollDuration });
      return;
    }

    window.scrollTo({ top, behavior: 'instant' });
  }, [reducedMotion]);

  useEffect(function refreshScrollMeasurements() {
    let cancelled = false;

    function refresh() {
      if (!cancelled) ScrollTrigger.refresh();
    }

    document.fonts.ready.then(refresh);
    const frame = requestAnimationFrame(refresh);

    return function cancelRefresh() {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [reducedMotion]);

  const value = useMemo(() => ({ scrollTo }), [scrollTo]);

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
