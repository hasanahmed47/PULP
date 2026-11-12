import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { media } from '../data/media';
import { useCarouselDrag } from '../hooks/useCarouselDrag';
import { useCarouselPlayback } from '../hooks/useCarouselPlayback';
import { useMobileViewport } from '../hooks/useMobileViewport';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useVisibleOnce } from '../hooks/useVisibleOnce';
import { useVisibility } from '../hooks/useVisibility';
import '../styles/HighlightsCarousel.css';

const FAILED_VIDEO_DELAY_MS = 2500;
const MEDIA_LOAD_MARGIN = '600px 0px';
const playbackVisibility = { enterRatio: 0.2, exitRatio: 0.05, exitDelay: 250 };

const defaultSlides = [
  {
    id: 'bold',
    title: 'BOLD FRUIT. BIG FLAVOUR.',
    hideTitle: true,
    videoSrc: media.firstTileDesktopFilm,
    posterSrc: media.firstTileDesktopPoster,
    mobileVideoSrc: media.firstTileMobileFilm,
    mobilePosterSrc: media.firstTileMobilePoster,
  },
  { id: 'fruit', title: 'GOOD TIME, GREAT TASTE.', videoSrc: media.lifestyleFilm, posterSrc: media.lifestylePoster },
  { id: 'chill', title: 'CHILL. SIP. REPEAT.', videoSrc: media.film, posterSrc: media.poster },
];

export default function HighlightsCarousel({ slides: suppliedSlides = defaultSlides }) {
  const mobileViewport = useMobileViewport();
  const slides = useMemo(function selectVideoSources() {
    const sourceSlides = suppliedSlides.length > 0 ? suppliedSlides : defaultSlides;
    if (!mobileViewport) return sourceSlides;

    return sourceSlides.map((slide) => {
      if (!slide.mobileVideoSrc) return slide;
      return {
        ...slide,
        videoSrc: slide.mobileVideoSrc,
        posterSrc: slide.mobilePosterSrc,
      };
    });
  }, [suppliedSlides, mobileViewport]);
  const slideCount = slides.length;
  const reducedMotion = useReducedMotion();
  const [selectedIndex, setIndex] = useState(0);
  const index = Math.min(selectedIndex, slideCount - 1);
  const activeSlide = slides[index];
  const [playing, setPlaying] = useState(() => !reducedMotion);
  const [headingRevealed, setHeadingRevealed] = useState(false);
  const [cardsRevealed, setCardsRevealed] = useState(false);
  const [filmOpen, setFilmOpen] = useState(false);
  const [failed, setFailed] = useState({});
  const headingRef = useRef(null);
  const stageRef = useRef(null);
  const viewportRef = useRef(null);
  const dialogRef = useRef(null);
  const videos = useRef([]);
  const progressBars = useRef([]);
  const visible = useVisibility(stageRef, '0px', playbackVisibility);
  const mediaEnabled = useVisibleOnce(stageRef, MEDIA_LOAD_MARGIN);
  const running = playing && visible && !filmOpen;
  const controlsVisible = visible && !filmOpen;

  const handleBlockedPlayback = useCallback(() => setPlaying(false), []);
  const handleVideoFailure = useCallback((source) => {
    setFailed((current) => ({ ...current, [source]: true }));
  }, []);

  useCarouselPlayback(
    videos,
    index,
    mediaEnabled ? activeSlide.videoSrc : undefined,
    running,
    handleBlockedPlayback,
    handleVideoFailure,
  );

  const advanceSlide = useCallback(function advanceSlide(direction) {
    setIndex((current) => (Math.min(current, slideCount - 1) + direction + slideCount) % slideCount);
  }, [slideCount]);

  const chooseSlide = useCallback(function chooseSlide(nextIndex) {
    setPlaying(false);
    setIndex(((nextIndex % slideCount) + slideCount) % slideCount);
  }, [slideCount]);

  const { startDrag, moveDrag, endDrag, cancelDrag, hasDragged } = useCarouselDrag(index, chooseSlide);

  useEffect(function respectMotionPreference() {
    setPlaying(!reducedMotion);
  }, [reducedMotion]);

  useEffect(function revealContent() {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        if (entry.target === headingRef.current) setHeadingRevealed(true);
        if (entry.target === stageRef.current) setCardsRevealed(true);
        observer.unobserve(entry.target);
      }
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.1 });

    observer.observe(headingRef.current);
    observer.observe(stageRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(function centerActiveSlide() {
    const viewport = viewportRef.current;
    let previousWidth = viewport.clientWidth;

    function centerSlide(behavior) {
      const card = videos.current[index]?.parentElement;
      if (!card) return;
      const left = card.offsetLeft - (viewport.clientWidth - card.offsetWidth) / 2;
      viewport.scrollTo({ left, behavior });
    }

    function handleResize() {
      if (viewport.clientWidth === previousWidth) return;
      previousWidth = viewport.clientWidth;
      centerSlide('instant');
    }

    centerSlide(reducedMotion ? 'instant' : 'smooth');
    const observer = new ResizeObserver(handleResize);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [index, slideCount, reducedMotion]);

  useEffect(function synchronizeProgress() {
    let frame;

    function updateProgress() {
      progressBars.current.forEach((progress, slideIndex) => {
        if (!progress) return;
        const video = videos.current[slideIndex];
        let value = 0;
        if (slideIndex === index && Number.isFinite(video?.duration) && video.duration > 0) {
          value = video.currentTime / video.duration;
        }
        progress.value = value;
      });
      if (running) frame = requestAnimationFrame(updateProgress);
    }

    updateProgress();
    return () => cancelAnimationFrame(frame);
  }, [index, running, activeSlide.videoSrc]);

  useEffect(function skipFailedVideo() {
    if (!failed[activeSlide.videoSrc] || !running || slides.every((slide) => failed[slide.videoSrc])) return;
    const timeout = setTimeout(() => advanceSlide(1), FAILED_VIDEO_DELAY_MS);
    return () => clearTimeout(timeout);
  }, [failed, activeSlide.videoSrc, slides, running, advanceSlide]);

  useEffect(function synchronizeFilmDialog() {
    const dialog = dialogRef.current;
    if (filmOpen && !dialog.open) dialog.showModal();
    if (!filmOpen && dialog.open) dialog.close();
  }, [filmOpen]);

  function handleKeyDown(event) {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    chooseSlide(index + (event.key === 'ArrowRight' ? 1 : -1));
  }

  return (
    <section className="hl" aria-labelledby="hl-heading">
      <header ref={headingRef} className={`hl__head${headingRevealed ? ' is-visible' : ''}`}>
        <h2 id="hl-heading" className="hl__heading">GET THE HIGHLIGHTS.</h2>
        <button type="button" className="hl__film" onClick={() => setFilmOpen(true)}>
          Watch the film
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <circle cx="10" cy="10" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <path d="M8 6.6v6.8l5.6-3.4z" fill="currentColor" />
          </svg>
        </button>
      </header>

      <div
        ref={stageRef}
        className={`hl__stage${cardsRevealed ? ' is-visible' : ''}`}
        role="region"
        aria-roledescription="carousel"
        aria-label="PULP highlights"
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        <div
          ref={viewportRef}
          className="hl__viewport"
          onPointerDown={startDrag}
          onPointerMove={moveDrag}
          onPointerUp={endDrag}
          onPointerCancel={cancelDrag}
        >
          <div className="hl__track" data-index={index}>
            {slides.map((slide, slideIndex) => (
              <article
                key={slide.id}
                className={`hl__slide${slideIndex === index ? ' is-active' : ''}`}
                role="group"
                aria-roledescription="slide"
                aria-label={`${slideIndex + 1} of ${slides.length}: ${slide.title}`}
                aria-hidden={slideIndex !== index}
                onClick={() => {
                  if (slideIndex !== index && !hasDragged()) chooseSlide(slideIndex);
                }}
              >
                <video
                  className="hl__video"
                  ref={(element) => {
                    if (!element) return;
                    videos.current[slideIndex] = element;
                    return () => { videos.current[slideIndex] = null; };
                  }}
                  src={mediaEnabled ? slide.videoSrc : undefined}
                  poster={mediaEnabled ? slide.posterSrc : undefined}
                  muted
                  playsInline
                  loop={slideCount === 1}
                  disablePictureInPicture
                  preload="metadata"
                  onEnded={() => {
                    if (slideIndex === index && running) advanceSlide(1);
                  }}
                  onError={() => handleVideoFailure(slide.videoSrc)}
                />
                {!slide.hideTitle && <h3 className="hl__title">{slide.title}</h3>}
              </article>
            ))}
          </div>
        </div>

        <div className={`hl__controls${controlsVisible ? ' is-visible' : ''}`} inert={!controlsVisible}>
          <button
            type="button"
            className="hl__btn"
            aria-label={playing ? 'Pause carousel' : 'Play carousel'}
            onClick={() => setPlaying((current) => !current)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              {playing ? (
                <path d="M6 5h4v14H6zm8 0h4v14h-4z" fill="currentColor" />
              ) : (
                <path d="M8 5v14l11-7z" fill="currentColor" />
              )}
            </svg>
          </button>

          <div className="hl__dots" role="group" aria-label="Choose slide">
            {slides.map((slide, slideIndex) => (
              <button
                key={slide.id}
                type="button"
                className={`hl__dot${slideIndex === index ? ' is-active' : ''}`}
                aria-label={`Go to slide ${slideIndex + 1}: ${slide.title}`}
                aria-current={slideIndex === index}
                onClick={() => chooseSlide(slideIndex)}
              >
                <span className="hl__pip">
                  <progress
                    className="hl__progress"
                    ref={(element) => {
                      if (!element) return;
                      progressBars.current[slideIndex] = element;
                      return () => { progressBars.current[slideIndex] = null; };
                    }}
                    value={0}
                    max={1}
                    aria-hidden="true"
                  />
                </span>
              </button>
            ))}
          </div>

          <div className="hl__arrows" role="group" aria-label="Slide navigation">
            <button type="button" className="hl__arrow" aria-label="Previous slide" onClick={() => chooseSlide(index - 1)}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 6-6 6 6 6" /></svg>
            </button>
            <button type="button" className="hl__arrow" aria-label="Next slide" onClick={() => chooseSlide(index + 1)}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m10 6 6 6-6 6" /></svg>
            </button>
          </div>
        </div>
        <p className="hl__status" aria-live={playing ? 'off' : 'polite'} aria-atomic="true">
          Slide {index + 1} of {slides.length}: {slides[index].title}
          {failed[activeSlide.videoSrc] && ' Video unavailable. Choose another slide.'}
        </p>
      </div>

      <dialog
        ref={dialogRef}
        className="hl__dialog"
        aria-label="PULP film"
        onClose={() => setFilmOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setFilmOpen(false);
        }}
      >
        {filmOpen && (
          <>
            <button type="button" className="hl__close" aria-label="Close film" onClick={() => setFilmOpen(false)}>
              &times;
            </button>
            <video src={media.film} controls autoPlay playsInline muted loop preload="metadata" aria-label="PULP brand film" />
          </>
        )}
      </dialog>
    </section>
  );
}
