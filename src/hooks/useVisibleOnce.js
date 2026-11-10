import { useEffect, useState } from 'react';

export function useVisibleOnce(ref, rootMargin = '0px') {
  const [seen, setSeen] = useState(false);

  useEffect(function watchUntilSeen() {
    const element = ref.current;
    if (!element || seen) return;

    function handleIntersection([entry]) {
      if (entry.isIntersecting) setSeen(true);
    }

    const observer = new IntersectionObserver(handleIntersection, { rootMargin });
    observer.observe(element);

    return function stopWatching() {
      observer.disconnect();
    };
  }, [ref, rootMargin, seen]);

  return seen;
}