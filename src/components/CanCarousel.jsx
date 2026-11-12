import { Eye } from 'lucide-react';
import '../styles/CanCarousel.css';

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
  return (
    <div className={`can-carousel ${className}`.trim()}>
      <div className="can-carousel__cans">
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
                key={shakeCount}
                data-shaking={shakeCount > 0 && isActive}
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
