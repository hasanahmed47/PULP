import { useEffect, useState } from 'react';

export function useVisibility(ref, rootMargin = '0px') {
  const [visible, setVisible] = useState(false);

  useEffect(function observeVisibility() {
    const element = ref.current;
    if (!element) return;
    let intersects = false;

    function updateVisibility() {
      setVisible(intersects && !document.hidden);
    }

    function handleIntersection([entry]) {
      intersects = entry.isIntersecting;
      updateVisibility();
    }

    const observer = new IntersectionObserver(handleIntersection, { rootMargin });
    observer.observe(element);
    document.addEventListener('visibilitychange', updateVisibility);

    return function stopObservingVisibility() {
      observer.disconnect();
      document.removeEventListener('visibilitychange', updateVisibility);
    };
  }, [ref, rootMargin]);

  return visible;
}
