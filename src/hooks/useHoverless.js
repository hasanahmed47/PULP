import { useSyncExternalStore } from 'react';

const mediaQuery = '(hover: none)';

function subscribe(onChange) {
  const query = window.matchMedia(mediaQuery);
  query.addEventListener('change', onChange);

  return function unsubscribe() {
    query.removeEventListener('change', onChange);
  };
}

function readHoverless() {
  return window.matchMedia(mediaQuery).matches;
}

export function useHoverless() {
  return useSyncExternalStore(subscribe, readHoverless);
}