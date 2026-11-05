import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { media } from '../data/media';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useVisibility } from '../hooks/useVisibility';
import { gsap } from '../lib/animation';
import './PouringFilm.css';

const filmMotion = {
  scrollDistance: 1.2,
  expandDuration: 1,
  titleTravel: 170,
  titleDuration: 0.55,
};

export function PouringFilm() {
  const sectionRef = useRef(null);
  const videoRef = useRef(null);
  const playbackRequestRef = useRef(0);
  const reducedMotion = useReducedMotion();
  const visible = useVisibility(sectionRef);
  const [wantsPlayback, setWantsPlayback] = useState(!reducedMotion);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const running = visible && wantsPlayback;

  useEffect(function resetPlaybackPreference() {
    setWantsPlayback(!reducedMotion);
  }, [reducedMotion]);

  const playVideo = useCallback(function requestPlayback(video) {
    if (!video.paused) return;

    const request = ++playbackRequestRef.current;

    function handleRejection() {
      if (request !== playbackRequestRef.current) return;
      setVideoPlaying(false);
    }

    video.play().catch(handleRejection);
  }, []);

  const pauseVideo = useCallback(function pausePlayback(video) {
    playbackRequestRef.current += 1;
    video.pause();
  }, []);

  useEffect(function synchronizePlayback() {
    const video = videoRef.current;
    if (!video || videoFailed) return;
    if (running) {
      playVideo(video);
      return;
    }
    pauseVideo(video);
  }, [running, videoFailed, playVideo, pauseVideo]);

  useEffect(function preparePlaybackCleanup() {
    const video = videoRef.current;
    if (!video) return;
    return function stopPlayback() {
      pauseVideo(video);
    };
  }, [videoFailed, pauseVideo]);

  useLayoutEffect(function animateFilmOnScroll() {
    if (reducedMotion) return;
    const context = gsap.context(() => {
      const timeline = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: () => `+=${window.innerHeight * filmMotion.scrollDistance}`,
          pin: true,
          scrub: true,
          invalidateOnRefresh: true,
        },
      });

      timeline.to('.film-window', { width: '100%', height: '100%', borderRadius: 0, duration: filmMotion.expandDuration }, 0);
      timeline.to('.film-title--top', { yPercent: -filmMotion.titleTravel, opacity: 0, duration: filmMotion.titleDuration }, 0);
      timeline.to('.film-title--bottom', { yPercent: filmMotion.titleTravel, opacity: 0, duration: filmMotion.titleDuration }, 0);
    }, sectionRef);

    return function resetFilmAnimation() {
      context.revert();
    };
  }, [reducedMotion]);

  function togglePlayback() {
    const video = videoRef.current;
    if (!video) return;

    const shouldPlay = video.paused;
    setWantsPlayback(shouldPlay);
    if (shouldPlay) {
      playVideo(video);
      return;
    }
    pauseVideo(video);
  }

  function handlePlay() {
    setVideoPlaying(true);
  }

  function handlePause() {
    setVideoPlaying(false);
  }

  function handleVideoError() {
    playbackRequestRef.current += 1;
    setVideoFailed(true);
    setVideoPlaying(false);
  }

  return (
    <section ref={sectionRef} className="film-section" aria-labelledby="film-title">
      <h2 id="film-title" className="sr-only">Taste the flavour</h2>
      <div className="film-title film-title--top headline" aria-hidden="true">
        TASTE THE
      </div>
      <div className="film-window">
        {!videoFailed ? (
          <video
            ref={videoRef}
            className="pour-video"
            muted
            playsInline
            loop
            preload="none"
            poster={media.poster}
            src={media.film}
            onPlay={handlePlay}
            onPause={handlePause}
            onError={handleVideoError}
            aria-label="A PULP Blood Orange can opening with splashing juice, orange slices and ice"
          />
        ) : (
          <img className="pour-poster" src={media.poster} alt="PULP Blood Orange can covered in cold droplets" width="1920" height="1080" />
        )}
        {videoFailed ? (
          <span className="pill film-control" role="status">Film unavailable</span>
        ) : (
          <button
            className="pill film-control"
            type="button"
            onClick={togglePlayback}
            aria-pressed={videoPlaying}
          >
            <span className="play-symbol" aria-hidden="true">
              {videoPlaying ? 'Ⅱ' : '▶'}
            </span>
            {videoPlaying ? 'Pause film' : 'Play film'}
          </button>
        )}
      </div>
      <div className="film-title film-title--bottom headline" aria-hidden="true">
        FLAVOUR
      </div>
    </section>
  );
}
