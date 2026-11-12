import { useEffect, useState } from 'react';

export function useVisibility(ref, rootMargin = '0px', { enterRatio = 0, exitRatio = 0, exitDelay = 0 } = {}) {
  const [visible, setVisible] = useState(false);

  useEffect(function observeVisibility() {
    const element = ref.current;
    if (!element) return;
    let intersects = false;
    let exitTimer;

    function updateVisibility() {
      setVisible(intersects && !document.hidden);
    }

    function handleIntersection([entry]) {
      window.clearTimeout(exitTimer);
      const threshold = intersects ? exitRatio : enterRatio;
      const next = entry.isIntersecting && entry.intersectionRatio >= threshold;
      if (next) {
        intersects = true;
        updateVisibility();
        return;
      }
      exitTimer = window.setTimeout(() => {
        intersects = false;
        updateVisibility();
      }, exitDelay);
    }

    const observer = new IntersectionObserver(handleIntersection, {
      rootMargin,
      threshold: [...new Set([0, enterRatio, exitRatio])],
    });
    observer.observe(element);
    document.addEventListener('visibilitychange', updateVisibility);

    return function stopObservingVisibility() {
      observer.disconnect();
      window.clearTimeout(exitTimer);
      document.removeEventListener('visibilitychange', updateVisibility);
    };
  }, [ref, rootMargin, enterRatio, exitRatio, exitDelay]);

  return visible;
}
