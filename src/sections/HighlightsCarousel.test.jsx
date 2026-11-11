import { StrictMode } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { media } from '../data/media';
import HighlightsCarousel from './HighlightsCarousel';

vi.mock('../hooks/useReducedMotion', () => ({ useReducedMotion: () => true }));
vi.mock('../hooks/useVisibility', () => ({ useVisibility: () => true }));

const customSlides = [0, 1, 2, 3, 4].map((index) => ({
  id: `custom-${index}`,
  title: `Custom film ${index + 1}`,
  videoSrc: `/custom-${index}.mp4`,
  posterSrc: `/custom-${index}.webp`,
}));

beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn(() => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })));
  vi.stubGlobal('IntersectionObserver', class {
    constructor(callback) { this.callback = callback; }
    observe(target) {
      this.callback([{ target, isIntersecting: true, intersectionRatio: 1 }]);
    }
    unobserve() {}
    disconnect() {}
  });
  vi.stubGlobal('ResizeObserver', class {
    observe() {}
    disconnect() {}
  });
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
  vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1));
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  Element.prototype.scrollTo = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  delete Element.prototype.scrollTo;
});

it('uses custom slides, wraps across five items and survives list shrink in StrictMode', () => {
  const { container, rerender, unmount } = render(
    <StrictMode><HighlightsCarousel slides={customSlides} /></StrictMode>,
  );
  expect(container.querySelectorAll('.hl__slide')).toHaveLength(5);
  fireEvent.click(screen.getByRole('button', { name: 'Previous slide' }));
  expect(container.querySelector('.hl__slide.is-active video').getAttribute('src')).toBe('/custom-4.mp4');
  fireEvent.click(screen.getByRole('button', { name: 'Next slide' }));
  expect(container.querySelector('.hl__track').dataset.index).toBe('0');
  fireEvent.click(screen.getByRole('button', { name: 'Go to slide 5: Custom film 5' }));

  const removedVideo = container.querySelector('.hl__slide.is-active video');
  rerender(<StrictMode><HighlightsCarousel slides={customSlides.slice(0, 2)} /></StrictMode>);
  expect(container.querySelectorAll('.hl__slide')).toHaveLength(2);
  expect(container.querySelector('.hl__track').dataset.index).toBe('1');
  expect(removedVideo.isConnected).toBe(false);
  fireEvent.click(screen.getByRole('button', { name: 'Next slide' }));
  expect(container.querySelector('.hl__track').dataset.index).toBe('0');

  unmount();
  expect(container.querySelector('video')).toBeNull();
});

it('uses the existing fallback when slides are omitted or empty', () => {
  const { container, rerender } = render(<HighlightsCarousel />);
  expect(container.querySelectorAll('.hl__slide')).toHaveLength(3);
  expect(container.querySelector('.hl__slide.is-active video').getAttribute('src')).toBe(media.firstTileDesktopFilm);
  rerender(<HighlightsCarousel slides={[]} />);
  expect(container.querySelectorAll('.hl__slide')).toHaveLength(3);
});