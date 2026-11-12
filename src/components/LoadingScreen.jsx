import { useLoadingTimeline } from '../hooks/useLoadingTimeline';
import { useMobileViewport } from '../hooks/useMobileViewport';
import { useReducedMotion } from '../hooks/useReducedMotion';

import '../styles/LoadingScreen.css';

const GLYPH_INDICES = [0, 1, 2, 3];

export function LoadingScreen({
  ready,
  onIntroEnd,
  onReveal,
  onComplete,
}) {
  const isMobile = useMobileViewport();
  const prefersReducedMotion = useReducedMotion();

  const {
    stageRef,
    sheetRef,
    lettersRef,
    dimRef,
    glyphRefs,
  } = useLoadingTimeline({
    ready,
    compact: isMobile,
    reducedMotion: prefersReducedMotion,
    onIntroEnd,
    onReveal,
    onComplete,
  });

  return (
    <div className="loading-screen">
      <svg
        ref={stageRef}
        className="loading-screen__stage"
        aria-hidden="true"
        focusable="false"
      >
        <rect
          ref={dimRef}
          className="loading-screen__dim"
          width="100%"
          height="100%"
          fillOpacity="0"
        />

        <path
          ref={sheetRef}
          className="loading-screen__sheet"
          fillRule="evenodd"
        />

        <g
          ref={lettersRef}
          className="loading-screen__letters"
        >
          {GLYPH_INDICES.map((index) => (
            <path
              key={index}
              ref={(element) => {
                glyphRefs.current[index] = element;
              }}
              className="loading-screen__glyph"
              fillRule="evenodd"
            />
          ))}
        </g>
      </svg>

      <p className="loading-screen__status" role="status">
        {ready ? 'PULP is ready.' : 'Loading PULP.'}
      </p>
    </div>
  );
}
