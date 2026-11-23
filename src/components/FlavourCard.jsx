import '../styles/FlavourCard.css';
import { useEffect, useRef } from 'react';
import { FloatingFruit } from './FloatingFruit';
import { AnchorLink } from './AnchorLink';
import { Magnet } from './react-bits/Magnet';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useVisibility } from '../hooks/useVisibility';
import { gsap } from '../lib/animation';

function getPointerTilt(event) {
  const bounds = event.currentTarget.getBoundingClientRect();
  if (!bounds.width || !bounds.height) return null;

  const horizontalPosition = (event.clientX - bounds.left) / bounds.width - 0.5;
  const verticalPosition = (event.clientY - bounds.top) / bounds.height - 0.5;

  return {
    x: -verticalPosition * 9,
    y: horizontalPosition * 9,
  };
}

export function FlavourCard({ flavour, onPickFlavour }) {
  const cardRef = useRef(null);
  const productRef = useRef(null);
  const tiltRef = useRef(null);
  const reducedMotion = useReducedMotion();
  const visible = useVisibility(cardRef);

  useEffect(function enablePointerTilt() {
    if (reducedMotion) return;
    const product = productRef.current;
    const media = gsap.matchMedia();

    media.add('(hover: hover) and (pointer: fine)', () => {
      tiltRef.current = {
        x: gsap.quickTo(product, 'rotationX', { duration: .65, ease: 'power2.out' }),
        y: gsap.quickTo(product, 'rotationY', { duration: .65, ease: 'power2.out' }),
      };

      return function clearTiltControls() {
        tiltRef.current = null;
      };
    });

    return function stopPointerTilt() {
      media.revert();
    };
  }, [reducedMotion]);

  function handlePointerMove(event) {
    if (!tiltRef.current || event.pointerType === 'touch') return;

    const rotation = getPointerTilt(event);
    if (!rotation) return;

    tiltRef.current.x(rotation.x);
    tiltRef.current.y(rotation.y);
  }

  function resetTilt() {
    tiltRef.current?.x(0);
    tiltRef.current?.y(0);
  }

  function pickFlavour() {
    onPickFlavour(flavour.id);
  }

  return (
    <article
      ref={cardRef}
      className="flavour-card"
      data-visible={visible}
      data-flavour={flavour.id}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetTilt}
      onPointerCancel={resetTilt}
      aria-labelledby={`${flavour.id}-title`}
    >
      <div className="card-copy">
        <h3 id={`${flavour.id}-title`} className="headline">
          {flavour.lines.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </h3>
        <p>{flavour.description}</p>
        <AnchorLink
          className="underlined-link card-shop-link"
          href="#pick-your-pulp"
          onNavigate={pickFlavour}
        >
          <Magnet>Pick this flavour <span aria-hidden="true">↗</span></Magnet>
        </AnchorLink>
      </div>
      <div className="card-art">
        <div className="organic-shape card-blob" aria-hidden="true" />
        <div className="card-product-tilt" ref={productRef}>
          <img
            className="card-can"
            src={flavour.image}
            alt={`${flavour.name} PULP can`}
            width="600"
            height="1000"
            loading="lazy"
            draggable="false"
          />
        </div>
        <FloatingFruit flavour={flavour.id} className="card-fruit--top" />
        <FloatingFruit flavour={flavour.id} className="card-fruit--bottom" />
      </div>
    </article>
  );
}

