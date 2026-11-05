import { useCallback, useEffect, useRef, useState } from 'react';

const playback = {
  stallTimeout: 10000,
  progressDuration: 1,
  loading: 'Loading highlight…',
  buffering: 'Buffering highlight…',
  unavailable: 'Film unavailable. Choose another highlight.',
  blocked: 'Press Play to start this highlight.',
};

export function useFilmPlayback({ videoRefs, progressRefs, active, enabled, onAdvance, onBlocked }) {
  const previousActive = useRef(null);
  const failedRef = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [status, setStatus] = useState('');
  const [failed, setFailed] = useState(false);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    const videos = videoRefs.current;
    const video = videos[active];
    const progress = progressRefs.current[active];
    if (!video) return;

    let disposed = false;
    let advanced = false;
    let frame = 0;
    let lastTime = video.currentTime;
    const startedAt = performance.now();
    let advancedAt = startedAt;

    for (const item of videos) item?.pause();
    setPlaying(false);

    if (previousActive.current !== active) {
      previousActive.current = active;
      video.currentTime = 0;
      lastTime = 0;
      failedRef.current = false;
      setFailed(false);
      setStatus('');
    }

    const animation = progress?.animate(
      [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }],
      { duration: playback.progressDuration, fill: 'both' },
    );
    animation?.pause();

    function updateProgress() {
      const duration = video.duration;
      const ratio = Number.isFinite(duration) && duration > 0 ? video.currentTime / duration : 0;
      if (animation) animation.currentTime = Math.min(1, Math.max(0, ratio));
    }

    function failPlayback() {
      if (disposed || failedRef.current) return;
      failedRef.current = true;
      setFailed(true);
      setPlaying(false);
      setStatus(playback.unavailable);
      video.pause();
      onBlocked();
    }

    function sampleProgress(now) {
      if (disposed || !enabled || failedRef.current) return;
      updateProgress();
      if (video.currentTime !== lastTime) {
        lastTime = video.currentTime;
        advancedAt = now;
      }
      const stalled = now - advancedAt >= playback.stallTimeout;
      const missingDuration = !Number.isFinite(video.duration) && now - startedAt >= playback.stallTimeout;
      if (stalled || missingDuration) {
        failPlayback();
        return;
      }
      frame = requestAnimationFrame(sampleProgress);
    }

    function handlePlaying() {
      if (disposed || !enabled || failedRef.current) {
        video.pause();
        return;
      }
      setPlaying(true);
      setStatus('');
    }

    function handlePause() {
      setPlaying(false);
      updateProgress();
    }

    function handleWaiting() {
      if (!enabled || failedRef.current) return;
      setPlaying(false);
      setStatus(playback.buffering);
    }

    function handleEnded() {
      updateProgress();
      setPlaying(false);
      if (!enabled || disposed || advanced || failedRef.current) return;
      advanced = true;
      onAdvance();
    }

    const listeners = {
      playing: handlePlaying,
      pause: handlePause,
      waiting: handleWaiting,
      stalled: handleWaiting,
      timeupdate: updateProgress,
      durationchange: updateProgress,
      seeking: updateProgress,
      ended: handleEnded,
      error: failPlayback,
    };
    for (const [name, listener] of Object.entries(listeners)) video.addEventListener(name, listener);
    updateProgress();

    if (enabled && !failedRef.current) {
      setStatus(playback.loading);
      if (video.ended) video.currentTime = 0;
      frame = requestAnimationFrame(sampleProgress);
      video.play().catch((error) => {
        if (disposed || error.name === 'AbortError') return;
        if (error.name === 'NotAllowedError') {
          setPlaying(false);
          setStatus(playback.blocked);
          onBlocked();
        } else {
          failPlayback();
        }
      });
    }

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      for (const [name, listener] of Object.entries(listeners)) video.removeEventListener(name, listener);
      for (const item of videos) item?.pause();
      animation?.cancel();
    };
  }, [active, enabled, onAdvance, onBlocked, progressRefs, retryToken, videoRefs]);

  const retry = useCallback(() => {
    failedRef.current = false;
    setFailed(false);
    setStatus('');
    videoRefs.current[active]?.load();
    setRetryToken((token) => token + 1);
  }, [active, videoRefs]);

  return { playing, status, failed, retry };
}
