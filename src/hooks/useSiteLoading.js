import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { flavours } from '../data/flavours';
import { media } from '../data/media';
import { introTime } from '../lib/loadingTimeline';

const heroSources = [
  ...Object.values(media.canDetails),
  flavours[0].texture,
];
const fontTimeout = 3000;
const entranceDuration = 700;
const loadingDeadline = 8000;
const introFallbackDelay = introTime * 1000 + 1000;

function prefetchImage(source, priority) {
  const image = new Image();
  image.fetchPriority = priority;
  image.src = source;
}

export function useSiteLoading() {
  const [fontsSettled, setFontsSettled] = useState(false);
  const [canSettled, setCanSettled] = useState(false);
  const [entranceComplete, setEntranceComplete] = useState(false);
  const [deadlineReached, setDeadlineReached] = useState(false);
  const [introEnded, setIntroEnded] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [finished, setFinished] = useState(false);

  useEffect(function startLoading() {
    let cancelled = false;
    const fontTimer = window.setTimeout(() => setFontsSettled(true), fontTimeout);
    const timers = [
      fontTimer,
      window.setTimeout(() => setEntranceComplete(true), entranceDuration),
      window.setTimeout(() => setIntroEnded(true), introFallbackDelay),
      window.setTimeout(() => setDeadlineReached(true), loadingDeadline),
    ];

    for (const source of heroSources) prefetchImage(source, 'high');
    document.fonts.ready.then(() => {
      window.clearTimeout(fontTimer);
      if (!cancelled) setFontsSettled(true);
    });

    return function stopLoading() {
      cancelled = true;
      for (const timer of timers) window.clearTimeout(timer);
    };
  }, []);

  useLayoutEffect(function syncLoadingState() {
    document.documentElement.dataset.loading = String(!revealed);
    return function clearLoadingState() {
      delete document.documentElement.dataset.loading;
    };
  }, [revealed]);

  const markCanReady = useCallback(function markCanReady() {
    setCanSettled(true);
  }, []);

  const endIntro = useCallback(function endIntro() {
    setIntroEnded(true);
  }, []);

  const revealSite = useCallback(function revealSite() {
    setRevealed(true);
  }, []);

  const finishLoading = useCallback(function finishLoading() {
    setFinished(true);
  }, []);

  const heroReady = fontsSettled && canSettled;
  const ready = entranceComplete && (heroReady || deadlineReached);

  return {
    ready,
    introEnded,
    revealed,
    finished,
    markCanReady,
    endIntro,
    revealSite,
    finishLoading,
  };
}
