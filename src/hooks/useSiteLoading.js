import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { flavours } from '../data/flavours';
import { media } from '../data/media';
import { introTime } from '../lib/loadingTimeline';

const placeholderSource = flavours[0].image;
const heroSources = [
  ...Object.values(media.canDetails),
  flavours[0].texture,
];
const backgroundSources = [
  media.mascot,
  media.firstTileDesktopPoster,
  media.firstTileMobilePoster,
  media.poster,
  media.lifestylePoster,
  ...flavours.flatMap((flavour) => [
    media.cutaways[flavour.id],
    media.fruit[flavour.id],
  ]),
  ...flavours.map((flavour) => media.can[flavour.id]),
];
const backgroundConcurrency = 2;
const fontTimeout = 3000;
const entranceDuration = 700;
const softDeadline = 2200;
const loadingDeadline = 8000;
const introFallbackDelay = introTime * 1000 + 1000;

const prefetchedImages = new Set();

function prefetchImage(source, priority) {
  return new Promise((resolve) => {
    const image = new Image();
    image.fetchPriority = priority;
    image.onload = () => resolve(true);
    image.onerror = () => resolve(false);
    image.src = source;
    prefetchedImages.add(image);
  });
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
  const [placeholderReady, setPlaceholderReady] = useState(false);
  const [softDeadlineReached, setSoftDeadlineReached] = useState(false);
  const [deadlineReached, setDeadlineReached] = useState(false);
  const [introEnded, setIntroEnded] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [finished, setFinished] = useState(false);

  useEffect(function startLoading() {
    let cancelled = false;
    const timers = [
      window.setTimeout(() => setEntranceComplete(true), entranceDuration),
      window.setTimeout(() => setIntroEnded(true), introFallbackDelay),
      window.setTimeout(() => setSoftDeadlineReached(true), softDeadline),
      window.setTimeout(() => setDeadlineReached(true), loadingDeadline),
    ];

    prefetchImage(placeholderSource, 'high').then((loaded) => {
      if (!cancelled && loaded) setPlaceholderReady(true);
    });
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
    let cancelled = false;
    const queue = [...backgroundSources];

    async function worker() {
      while (!cancelled && queue.length > 0) {
        await prefetchImage(queue.shift(), 'low');
      }
    }

    for (let lane = 0; lane < backgroundConcurrency; lane += 1) worker();
    return function stopWarming() {
      cancelled = true;
    };
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

  const canVisible = canSettled || (softDeadlineReached && placeholderReady);
  const heroReady = fontsSettled && canVisible;
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