import { useEffect, useRef } from 'react';

const retryDelay = 150;
const maximumRetries = 2;

export function useCarouselPlayback(videos, index, source, running, onBlocked, onFailure) {
  const previousIndex = useRef(index);

  useEffect(function synchronizePlayback() {
    const activeVideo = videos.current[index];
    for (const video of videos.current) {
      if (video && video !== activeVideo) video.pause();
    }
    if (!activeVideo) return;
    if (previousIndex.current !== index) activeVideo.currentTime = 0;
    previousIndex.current = index;

    let cancelled = false;
    let pending = false;
    let retries = 0;
    let retryTimer;

    async function requestPlayback() {
      if (cancelled || pending || !running || !source || !activeVideo.paused) return;
      pending = true;
      try {
        activeVideo.muted = true;
        await activeVideo.play();
      } catch (error) {
        if (cancelled) return;
        if (error.name === 'NotAllowedError') {
          onBlocked();
        } else if (error.name === 'AbortError' && retries < maximumRetries) {
          retries += 1;
          retryTimer = window.setTimeout(requestPlayback, retryDelay);
        } else if (error.name !== 'AbortError') {
          onFailure(source);
        }
      } finally {
        pending = false;
      }
    }

    activeVideo.addEventListener('canplay', requestPlayback);
    if (running && source) requestPlayback();
    else activeVideo.pause();

    return function stopPlayback() {
      cancelled = true;
      window.clearTimeout(retryTimer);
      activeVideo.removeEventListener('canplay', requestPlayback);
      activeVideo.pause();
    };
  }, [videos, index, source, running, onBlocked, onFailure]);
}
