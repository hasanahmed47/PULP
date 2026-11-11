import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { flavours } from '../data/flavours';
import { media } from '../data/media';
import { introTime } from '../lib/loadingTimeline';
import { loadCanSceneModule } from '../three/loadCanScene';

const heroSources = [
  ...Object.values(media.canDetails),
  flavours[0].texture,
];
const backgroundSources = [
  ...Object.values(media.can),
  ...Object.values(media.cutaways),
  ...Object.values(media.fruit),
  media.mascot,
  media.poster,
];
const fontTimeout = 3000;
const entranceDuration = 700;
const sceneModuleDelay = 300;
const loadingDeadline = 10000;
const introFallbackDelay = introTime * 1000 + 1000;

const prefetchedImages = new Set();

function prefetchImage(source, priority) {
  const image = new Image();
  image.fetchPriority = priority;
  image.src = source;
  prefetchedImages.add(image);
}

function waitForFonts() {
  return Promise.race([
    document.fonts.ready,
    new Promise((resolve) => window.setTimeout(resolve, fontTimeout)),
  ]);
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
    const timers = [
      window.setTimeout(() => setEntranceComplete(true), entranceDuration),
      window.setTimeout(() => setIntroEnded(true), introFallbackDelay),
      window.setTimeout(() => setDeadlineReached(true), loadingDeadline),
      window.setTimeout(loadCanSceneModule, sceneModuleDelay),
    ];

    for (const source of heroSources) prefetchImage(source, 'high');
    waitForFonts().then(() => {
      if (!cancelled) setFontsSettled(true);
    });

    return function stopLoading() {
      cancelled = true;
      for (const timer of timers) window.clearTimeout(timer);
    };
  }, []);

  useEffect(function warmBackgroundImages() {
    if (!finished) return;
    for (const source of backgroundSources) prefetchImage(source, 'low');
  }, [finished]);

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