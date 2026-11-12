import { useEffect, useRef } from 'react';
import { gsap } from '../lib/animation';
import { useReducedMotion } from './useReducedMotion';

function createFruitMotion(element, index) {
  return {
    element,
    depth: 8 + index * 6,
    x: gsap.quickTo(element, 'x', { duration: 0.65, ease: 'power2.out' }),
    y: gsap.quickTo(element, 'y', { duration: 0.65, ease: 'power2.out' }),
  };
}

function getRepulsion(element, pointerX, pointerY) {
  const bounds = element.getBoundingClientRect();
  const offsetX = bounds.left + bounds.width / 2 - pointerX;
  const offsetY = bounds.top + bounds.height / 2 - pointerY;
  const distance = Math.hypot(offsetX, offsetY) || 1;
  const force = Math.max(0, 1 - distance / 250) * 65;

  return {
    x: offsetX / distance * force,
    y: offsetY / distance * force,
  };
}

export function useFruitParallax(sectionRef, { repel = false } = {}) {
  const reducedMotion = useReducedMotion();
  const motionRef = useRef([]);

  useEffect(function createParallax() {
    const section = sectionRef.current;
    if (reducedMotion || !section) return;

    const fruit = Array.from(section.querySelectorAll('[data-fruit]'));
    const controls = fruit.map(createFruitMotion);
    motionRef.current = controls;

    return function destroyParallax() {
      for (const { element, x, y } of controls) {
        x.tween.kill();
        y.tween.kill();
        gsap.set(element, { clearProps: 'transform' });
      }
      motionRef.current = [];
    };
  }, [reducedMotion, sectionRef]);

  function onPointerMove(event) {
    if (reducedMotion || event.pointerType === 'touch') return;
    const section = sectionRef.current;
    if (!section) return;

    const bounds = section.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;

    const pointerX = (event.clientX - bounds.left) / bounds.width - 0.5;
    const pointerY = (event.clientY - bounds.top) / bounds.height - 0.5;

    for (const { element, depth, x, y } of motionRef.current) {
      let offsetX = pointerX * depth;
      let offsetY = pointerY * depth;

      if (repel) {
        const repulsion = getRepulsion(element, event.clientX, event.clientY);
        offsetX += repulsion.x;
        offsetY += repulsion.y;
      }

      x(offsetX);
      y(offsetY);
    }
  }

  function onPointerLeave() {
    for (const { x, y } of motionRef.current) {
      x(0);
      y(0);
    }
  }

  return { onPointerMove, onPointerLeave };
}
