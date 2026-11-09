import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { media } from '../data/media';
import { introTime } from '../lib/loadingTimeline';

const imageSources = [
  ...Object.values(media.can),
  ...Object.values(media.cutaways),
  ...Object.values(media.wrap),
  ...Object.values(media.fruit),
  media.mascot,
  media.poster,
];
const preloadCount = imageSources.length + 1;
const assetTimeout = 12000;
const entranceDuration = 700;
const introFallbackDelay = introTime * 1000 + 1000;

function preloadImage(source) {
  const image = new Image();
  image.src = source;
  return image.decode();
}

export function useSiteLoading() {
  const [assetsSettled, setAssetsSettled] = useState(false);
  const [canSettled, setCanSettled] = useState(false);
  const [rotationSettled, setRotationSettled] = useState(false);
  const [entranceComplete, setEntranceComplete] = useState(false);
  const [introEnded, setIntroEnded] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [finished, setFinished] = useState(false);

  useEffect(function preloadSiteAssets() {
    let cancelled = false;
    const timers = new Set();
    let pending = preloadCount;

    function trackAsset(promise) {
      let settled = false;
      const timeout = window.setTimeout(finishAsset, assetTimeout);
      timers.add(timeout);

      function finishAsset() {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeout);
        timers.delete(timeout);
        pending -= 1;
        if (pending === 0 && !cancelled) setAssetsSettled(true);
      }

      promise.then(finishAsset, finishAsset);
    }

    function finishEntrance() {
      if (!cancelled) setEntranceComplete(true);
    }

    function finishIntroFallback() {
      if (!cancelled) setIntroEnded(true);
    }

    for (const source of imageSources) trackAsset(preloadImage(source));
    trackAsset(document.fonts.ready);
    timers.add(window.setTimeout(finishEntrance, entranceDuration));
    timers.add(window.setTimeout(finishIntroFallback, introFallbackDelay));

    return function cancelPreloading() {
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

  const markRotationReady = useCallback(function markRotationReady() {
    setRotationSettled(true);
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

  const ready = assetsSettled && canSettled && rotationSettled && entranceComplete;

  return {
    ready,
    introEnded,
    revealed,
    finished,
    markCanReady,
    markRotationReady,
    endIntro,
    revealSite,
    finishLoading,
  };
}