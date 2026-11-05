import { useId, useRef, useState } from 'react';
import './PeekCan.css';

const defaultLensPosition = { x: 300, y: 560 };

function getLensPosition(image, event) {
  const matrix = image?.getScreenCTM();
  if (!matrix) return null;

  const cursor = new DOMPoint(event.clientX, event.clientY);
  const position = cursor.matrixTransform(matrix.inverse());

  return {
    x: Math.max(140, Math.min(460, position.x)),
    y: Math.max(150, Math.min(850, position.y)),
  };
}

export function PeekCan({ flavour, selected, onSelect }) {
  const clipId = useId();
  const imageRef = useRef(null);
  const [lens, setLens] = useState(null);
  const lensPosition = lens ?? defaultLensPosition;
  const peeking = Boolean(lens);

  function moveLens(event) {
    if (event.pointerType === 'touch') return;
    setLens(getLensPosition(imageRef.current, event));
  }

  function focusLens(event) {
    if (!event.currentTarget.matches(':focus-visible')) return;
    setLens(defaultLensPosition);
  }

  function clearLens() {
    setLens(null);
  }

  function selectFlavour() {
    onSelect(flavour);
  }

  return (
    <button
      className="peek-can"
      type="button"
      data-flavour={flavour.id}
      data-selected={selected}
      data-peeking={peeking}
      aria-label={`Select ${flavour.name}`}
      aria-pressed={selected}
      aria-controls="inside-detail"
      onClick={selectFlavour}
      onFocus={focusLens}
      onBlur={clearLens}
      onPointerLeave={clearLens}
    >
      <svg
        ref={imageRef}
        className="peek-can__image"
        viewBox="0 0 600 1000"
        aria-hidden="true"
        onPointerMove={moveLens}
      >
        <defs>
          <clipPath id={clipId}>
            <circle cx={lensPosition.x} cy={lensPosition.y} r="150" />
          </clipPath>
        </defs>
        <image href={flavour.image} width="600" height="1000" />
        <image
          className="peek-can__interior"
          href={flavour.interior}
          width="600"
          height="1000"
          clipPath={`url(#${clipId})`}
        />
        <circle
          className="peek-can__lens"
          cx={lensPosition.x}
          cy={lensPosition.y}
          r="150"
        />
      </svg>
      <span className="peek-can__label">
        <span className="peek-can__name">{flavour.name}</span>
        <span className="peek-can__action">Peek inside</span>
      </span>
    </button>
  );
}