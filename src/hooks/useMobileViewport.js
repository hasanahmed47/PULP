import { useSyncExternalStore } from 'react';

const mediaQuery = '(max-width: 40rem)';

function subscribe(onChange) {
  const query = window.matchMedia(mediaQuery);
  query.addEventListener('change', onChange);

  return function unsubscribe() {
    query.removeEventListener('change', onChange);
  };
}

function readMobileViewport() {
  return window.matchMedia(mediaQuery).matches;
}

export function useMobileViewport() {
  return useSyncExternalStore(subscribe, readMobileViewport);
}
