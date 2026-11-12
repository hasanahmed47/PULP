import { useEffect, useRef } from 'react';
import { Eye } from 'lucide-react';
import { useReducedMotion } from '../hooks/useReducedMotion';
import '../styles/CanCarousel.css';

const SHAKE_KEYFRAMES = [
  { transform: 'rotate(0deg)' },
  { transform: 'translateX(-3%) rotate(-5deg)', offset: 0.2 },
  { transform: 'translateX(3%) rotate(5deg)', offset: 0.4 },
  { transform: 'translateX(-2%) rotate(-3deg)', offset: 0.6 },
  { transform: 'translateX(1%) rotate(2deg)', offset: 0.8 },
  { transform: 'rotate(0deg)' },
];

const SHAKE_OPTIONS = {
  duration: 650,
  easing: 'ease-in-out',
};

function getCanState(index, activeIndex) {
  if (index === activeIndex) return 'active';
  return index < activeIndex ? 'before' : 'after';
}

export function CanCarousel({
  flavours,
  activeIndex,
  onSelect,
  shakeCount = 0,
  className = '',
}) {
  const stageRef = useRef(null);
  const reducedMotion = useReducedMotion();

  // Animate the selected can when a shake is requested.
  useEffect(() => {
    if (!shakeCount || reducedMotion) return undefined;

    const activeCan = stageRef.current?.querySelector(
      '[data-state="active"] img'
    );

    if (!activeCan?.animate) return undefined;

    const animation = activeCan.animate(
      SHAKE_KEYFRAMES,
      SHAKE_OPTIONS
    );

    return () => animation.cancel();
  }, [shakeCount, reducedMotion]);

  return (
    <div className={`can-carousel ${className}`.trim()}>
      {/* Can display */}
      <div ref={stageRef} className="can-carousel__cans">
        {flavours.map((flavour, index) => {
          const state = getCanState(index, activeIndex);
          const isActive = state === 'active';

          return (
            <div
              key={flavour.id}
              className="can-carousel__can"
              data-state={state}
              aria-hidden={!isActive}
            >
              <img
                src={flavour.image}
                alt={isActive ? `${flavour.name} PULP can` : ''}
                width={600}
                height={1000}
                loading={isActive ? 'eager' : 'lazy'}
                decoding="async"
                draggable={false}
              />
            </div>
          );
        })}
      </div>

      {/* Eye indicator and flavour navigation */}
      <div
        className="can-carousel__dots"
        role="group"
        aria-label="Choose a can"
      >
        <span
          className="can-carousel__eye"
          data-index={activeIndex}
          aria-hidden="true"
        >
          <Eye
         key={activeIndex}
       className="can-carousel__eye-icon"
      size={44}
      strokeWidth={1.75}
     aria-hidden="true"
/>
        </span>

        {flavours.map((flavour, index) => (
          <button
            key={flavour.id}
            type="button"
            className="can-carousel__dot"
            aria-label={`Show ${flavour.name}`}
            aria-pressed={index === activeIndex}
            onClick={() => onSelect(index)}
          />
        ))}
      </div>
    </div>
  );
}
