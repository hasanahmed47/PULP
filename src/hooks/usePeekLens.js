import { useCallback, useEffect, useRef, useState } from 'react';
import { gsap } from '../lib/animation';
import { useReducedMotion } from './useReducedMotion';

export const defaultLensPosition = { x: 300, y: 560 };
export const lensBounds = { minX: 140, maxX: 460, minY: 150, maxY: 850 };

const lensMotion = {
  glide: { duration: 0.45, ease: 'power3.out' },
  sweep: {
    start: { x: 300, y: lensBounds.minY },
    endY: lensBounds.maxY,
    sway: 60,
    duration: 1.6,
    ease: 'sine.inOut',
    settleDuration: 0.7,
    settleEase: 'power2.out',
  },
};

export function usePeekLens() {
  const [lens, setLens] = useState(null);
  const position = useRef({ ...defaultLensPosition });
  const motion = useRef(null);
  const hintSettled = useRef(false);
  const reducedMotion = useReducedMotion();

  const stopMotion = useCallback(function stopMotion() {
    motion.current?.kill();
    motion.current = null;
  }, []);

  const showPosition = useCallback(function showPosition() {
    setLens({ x: position.current.x, y: position.current.y });
  }, []);

  const placeLens = useCallback(function placeLens(target) {
    stopMotion();
    Object.assign(position.current, target);
    showPosition();
  }, [showPosition, stopMotion]);

  const hideLens = useCallback(function hideLens() {
    stopMotion();
    setLens(null);
  }, [stopMotion]);

  const glideLens = useCallback(function glideLens(target) {
    hintSettled.current = true;

    if (!lens || reducedMotion) {
      placeLens(target);
      return;
    }

    stopMotion();
    motion.current = gsap.to(position.current, {
      x: target.x,
      y: target.y,
      ...lensMotion.glide,
      onUpdate: showPosition,
    });
  }, [lens, placeLens, reducedMotion, showPosition, stopMotion]);

  const hintLens = useCallback(function hintLens() {
    if (hintSettled.current) return;

    if (reducedMotion) {
      hintSettled.current = true;
      placeLens(defaultLensPosition);
      return;
    }

    function settleHint() {
      hintSettled.current = true;
    }

    const { sweep } = lensMotion;
    stopMotion();
    Object.assign(position.current, sweep.start);
    showPosition();

    motion.current = gsap.timeline({ onUpdate: showPosition, onComplete: settleHint })
      .to(position.current, { y: sweep.endY, duration: sweep.duration, ease: sweep.ease }, 0)
      .to(position.current, {
        x: sweep.start.x + sweep.sway,
        duration: sweep.duration / 2,
        ease: sweep.ease,
        yoyo: true,
        repeat: 1,
      }, 0)
      .to(position.current, {
        ...defaultLensPosition,
        duration: sweep.settleDuration,
        ease: sweep.settleEase,
      });
  }, [placeLens, reducedMotion, showPosition, stopMotion]);

  const cancelHint = useCallback(function cancelHint() {
    if (!hintSettled.current) stopMotion();
  }, [stopMotion]);

  useEffect(function stopMotionOnUnmount() {
    return stopMotion;
  }, [stopMotion]);

  return { lens, placeLens, glideLens, hideLens, hintLens, cancelHint };
}