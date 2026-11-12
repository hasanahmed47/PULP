import { lazy, Suspense, useRef } from 'react';
import { CirclePlay } from 'lucide-react';
import { useVisibleOnce } from '../hooks/useVisibleOnce';
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

  return (
    <div ref={sectionRef} className="deferred-highlights">
      <Suspense fallback={<HighlightsPlaceholder />}>
        {approaching ? <HighlightsCarousel /> : <HighlightsPlaceholder />}
      </Suspense>
    </div>
  );
}
