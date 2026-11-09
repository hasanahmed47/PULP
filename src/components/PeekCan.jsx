import { useEffect, useId, useRef } from 'react';
import { useHoverless } from '../hooks/useHoverless';
import { defaultLensPosition, lensBounds, usePeekLens } from '../hooks/usePeekLens';
import { useVisibility } from '../hooks/useVisibility';
import '../styles/PeekCan.css'

const hintViewMargin = '-30% 0px';

function getLensPosition(image, event) {
  const matrix = image?.getScreenCTM();
  if (!matrix) return null;

  const pointer = new DOMPoint(event.clientX, event.clientY);
  const position = pointer.matrixTransform(matrix.inverse());

  return {
    x: Math.max(lensBounds.minX, Math.min(lensBounds.maxX, position.x)),
    y: Math.max(lensBounds.minY, Math.min(lensBounds.maxY, position.y)),
  };
}

export function PeekCan({ flavour, selected, onSelect }) {
  const clipId = useId();
  const buttonRef = useRef(null);
  const imageRef = useRef(null);
  const hoverless = useHoverless();
  const inView = useVisibility(buttonRef, hintViewMargin);
  const { lens, placeLens, glideLens, hideLens, hintLens, cancelHint } = usePeekLens();
  const lensPosition = lens ?? defaultLensPosition;
  const peeking = Boolean(lens);

  useEffect(function hintLensOnTouchDevices() {
    if (!hoverless || !selected || !inView) return;

    hintLens();
    return cancelHint;
  }, [cancelHint, hintLens, hoverless, inView, selected]);

  useEffect(function hideLensWhenDeselected() {
    if (hoverless && !selected) hideLens();
  }, [hideLens, hoverless, selected]);

  function followPointer(event) {
    if (event.pointerType === 'touch') return;

    const position = getLensPosition(imageRef.current, event);
    if (position) placeLens(position);
  }

  function moveLensToTap(event) {
    if (event.pointerType === 'mouse') return;

    const position = getLensPosition(imageRef.current, event);
    if (position) glideLens(position);
  }

  function focusLens(event) {
    if (!event.currentTarget.matches(':focus-visible')) return;
    placeLens(defaultLensPosition);
  }

  function releasePointer(event) {
    if (event.pointerType === 'touch') return;
    hideLens();
  }

  function releaseFocus() {
    if (hoverless) return;
    hideLens();
  }

  function selectFlavour() {
    onSelect(flavour);
  }

  return (
    <button
      ref={buttonRef}
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
      onBlur={releaseFocus}
      onPointerLeave={releasePointer}
    >
      <svg
        ref={imageRef}
        className="peek-can__image"
        viewBox="0 0 600 1000"
        aria-hidden="true"
        onPointerMove={followPointer}
        onPointerUp={moveLensToTap}
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