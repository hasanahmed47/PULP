import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { media } from '../data/media';

const imageSources = [
  ...Object.values(media.can),
  ...Object.values(media.cutaways),
  ...Object.values(media.wrap),
  ...Object.values(media.fruit),
  media.mascot,
  media.poster,
];
const totalAssets = imageSources.length + 3;
const assetTimeout = 12000;
const entranceDuration = 700;

function preloadImage(source) {
  const image = new Image();
  image.src = source;
  return image.decode();
}

export function useSiteLoading() {
  const [settledAssets, setSettledAssets] = useState(0);
  const [canSettled, setCanSettled] = useState(false);
  const [rotationSettled, setRotationSettled] = useState(false);
  const [entranceComplete, setEntranceComplete] = useState(false);
  const [revealed, setRevealed] = useState(false);

  useEffect(function preloadSiteAssets() {
    let cancelled = false;
    const timers = new Set();

    function trackAsset(promise) {
      let settled = false;
      const timeout = window.setTimeout(finishAsset, assetTimeout);
      timers.add(timeout);

      function finishAsset() {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeout);
        timers.delete(timeout);
        if (!cancelled) setSettledAssets((count) => count + 1);
      }

      promise.then(finishAsset, finishAsset);
    }

    function finishEntrance() {
      if (!cancelled) setEntranceComplete(true);
    }

    for (const source of imageSources) trackAsset(preloadImage(source));
    trackAsset(document.fonts.ready);
    timers.add(window.setTimeout(finishEntrance, entranceDuration));

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

  const revealSite = useCallback(function revealSite() {
    setRevealed(true);
  }, []);
  const completedAssets = settledAssets + Number(canSettled) + Number(rotationSettled);
  const progress = Math.round(completedAssets / totalAssets * 100);
  const ready = completedAssets === totalAssets && entranceComplete;

  return { progress, ready, revealed, markCanReady, markRotationReady, revealSite };
}
