import { lazy, Suspense, useEffect, useRef } from 'react';
import { CirclePlay } from 'lucide-react';
import { useVisibleOnce } from '../hooks/useVisibleOnce';
import { useScroll } from '../context/ScrollContext';
import '../styles/HighlightsCarousel.css';
import '../styles/DeferredHighlights.css';

const HighlightsCarousel = lazy(() => import('../sections/HighlightsCarousel'));

function HighlightsPlaceholder() {
  return (
    <section className="hl" aria-label="Loading highlights" aria-busy="true">
      <header className="hl__head" aria-hidden="true">
        <h2 className="hl__heading">GET THE HIGHLIGHTS.</h2>
        <span className="hl__film">Watch the film <CirclePlay /></span>
      </header>
      <div className="deferred-highlights__placeholder" />
    </section>
  );
}

export default function DeferredHighlights() {
  const sectionRef = useRef(null);
  const approaching = useVisibleOnce(sectionRef, '1000px 0px');
  const { refreshScroll } = useScroll();

  useEffect(function trackHighlightsSize() {
    const section = sectionRef.current;
    let height = section.offsetHeight;

    const observer = new ResizeObserver(() => {
      const nextHeight = section.offsetHeight;
      if (nextHeight === height) return;
      height = nextHeight;
      refreshScroll();
    });

    observer.observe(section);
    return () => observer.disconnect();
  }, [refreshScroll]);

  return (
    <div ref={sectionRef} className="deferred-highlights">
      <Suspense fallback={<HighlightsPlaceholder />}>
        {approaching ? <HighlightsCarousel /> : <HighlightsPlaceholder />}
      </Suspense>
    </div>
  );
}
