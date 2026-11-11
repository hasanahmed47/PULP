import { useEffect, useRef } from 'react';
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
const SHAKE_OPTIONS = { duration: 650, easing: 'ease-in-out' };

function getCanState(index, activeIndex) {
  if (index === activeIndex) return 'active';
  return index < activeIndex ? 'before' : 'after';
}

// Cans slide past each other in a row. The eye under them glides to the dot of the can in view.
export function CanCarousel({ flavours, activeIndex, onSelect, shakeCount = 0, className = '' }) {
  const stageRef = useRef(null);
  const reducedMotion = useReducedMotion();

  useEffect(function shakeActiveCan() {
    if (!shakeCount || reducedMotion) return;
    stageRef.current.querySelector('[data-state="active"] img')?.animate(SHAKE_KEYFRAMES, SHAKE_OPTIONS);
  }, [shakeCount, reducedMotion]);

  return (
    <div className={`can-carousel ${className}`}>
      <div ref={stageRef} className="can-carousel__cans">
        {flavours.map((flavour, index) => {
          const state = getCanState(index, activeIndex);
          const active = state === 'active';

          return (
            <div key={flavour.id} className="can-carousel__can" data-state={state} aria-hidden={!active}>
              <img
                src={flavour.image}
                alt={active ? `${flavour.name} PULP can` : ''}
                width="600"
                height="1000"
                loading="lazy"
                decoding="async"
                draggable="false"
              />
            </div>
          );
        })}
      </div>

      <div className="can-carousel__dots" role="group" aria-label="Choose a can" style={{ '--count': flavours.length }}>
        <span className="can-carousel__eye" style={{ '--index': activeIndex }} aria-hidden="true">
          <svg key={activeIndex} viewBox="0 0 44 26" focusable="false">
            <path d="M2 13C9 4 15 2 22 2s13 2 20 11c-7 9-13 11-20 11S9 22 2 13Z" />
            <circle className="can-carousel__iris" cx="22" cy="13" r="7.5" />
            <circle className="can-carousel__pupil" cx="22" cy="13" r="3.2" />
          </svg>
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
