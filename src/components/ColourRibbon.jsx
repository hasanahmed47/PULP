import { useLayoutEffect, useRef } from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { gsap } from '../lib/animation';
import '../styles/ColourRibbon.css'

const drawDuration = 1.6;
const drawEase = 'power2.inOut';
const drawStagger = 0.12;

const ribbons = {
  hero: {
    path: 'M390 -90 C470 140 1020 180 810 570 S460 810 530 1130',
    viewBox: '0 0 1000 1100',
    aspectRatio: 'none',
    stripeOffset: { x: -18, y: 0 },
  },
  'hero-mobile': {
    path: 'M450 -50 C380 70 440 190 340 290 C250 380 120 430 130 540 C140 640 300 650 330 760 C345 815 360 850 372 900',
    viewBox: '0 0 390 844',
    aspectRatio: 'xMidYMid slice',
    stripeOffset: { x: -14, y: 0 },
  },
  footer: {
    path: 'M-120 650 Q720 -170 1560 650',
    viewBox: '0 0 1440 650',
    aspectRatio: 'none',
    stripeOffset: { x: 0, y: 23 },
  },
};

export function ColourRibbon({ variant = 'hero', animate = false }) {
  const svgRef = useRef(null);
  const reducedMotion = useReducedMotion();
  const drawsIn = animate && !reducedMotion;
  const { path, viewBox, aspectRatio, stripeOffset } = ribbons[variant];

  useLayoutEffect(function drawRibbon() {
    if (!drawsIn) {
      return;
    }

    const ctx = gsap.context(function animateStripes() {
      gsap.fromTo(
        'path',
        { attr: { 'stroke-dasharray': 1, 'stroke-dashoffset': 1 } },
        {
          attr: { 'stroke-dasharray': 1, 'stroke-dashoffset': 0 },
          duration: drawDuration,
          ease: drawEase,
          stagger: drawStagger,
        },
      );
    }, svgRef);

    return function resetRibbon() {
      ctx.revert();
    };
  }, [drawsIn]);

  function renderStripe(index) {
    const offsetX = index * stripeOffset.x;
    const offsetY = index * stripeOffset.y;

    return (
      <path
        key={index}
        d={path}
        pathLength="1"
        transform={`translate(${offsetX} ${offsetY})`}
      />
    );
  }

  return (
    <svg
      ref={svgRef}
      className={`colour-ribbon colour-ribbon--${variant}`}
      data-animated={drawsIn}
      viewBox={viewBox}
      fill="none"
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio={aspectRatio}
    >
      {[0, 1, 2, 3].map(renderStripe)}
    </svg>
  );
}
