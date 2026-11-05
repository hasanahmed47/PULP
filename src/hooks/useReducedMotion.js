import { useSyncExternalStore } from 'react';

const mediaQuery = '(prefers-reduced-motion: reduce)';

function subscribe(onChange) {
  const query = window.matchMedia(mediaQuery);
  query.addEventListener('change', onChange);

  return function unsubscribe() {
    query.removeEventListener('change', onChange);
  };
}

function readReducedMotion() {
  return window.matchMedia(mediaQuery).matches;
}

export function useReducedMotion() {
  return useSyncExternalStore(subscribe, readReducedMotion);
}
