import { useEffect, useRef } from 'react';
import './Magnet.css';

const spring = { stiffness: 170, damping: 16, mass: 1 };
const motionQuery = '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)';

export function Magnet({ children }) {
  const wrapperRef = useRef(null);
  const innerRef = useRef(null);

  useEffect(function connectMagnet() {
    const wrapper = wrapperRef.current;
    const inner = innerRef.current;
    const control = wrapper.closest('a, button');
    if (!control) return;

    const query = window.matchMedia(motionQuery);
    const current = { x: 0, y: 0 };
    const velocity = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };
    let frame = 0;
    let last = 0;

    function solve(dt) {
      let resting = true;
      for (const axis of ['x', 'y']) {
        const force = spring.stiffness * (target[axis] - current[axis]) - spring.damping * velocity[axis];
        velocity[axis] += (force / spring.mass) * dt;
        current[axis] += velocity[axis] * dt;
        if (Math.abs(target[axis] - current[axis]) > 0.05 || Math.abs(velocity[axis]) > 0.05) resting = false;
      }
      return resting;
    }

    function animate(now) {
      frame = 0;
      const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
      last = now;
      const steps = Math.ceil(dt / (1 / 120));
      let resting = true;
      for (let step = 0; step < steps; step++) resting = solve(dt / steps);
      if (resting) {
        Object.assign(current, target);
        velocity.x = 0;
        velocity.y = 0;
      }
      inner.style.translate = `${current.x.toFixed(2)}px ${current.y.toFixed(2)}px`;
      if (!resting) frame = requestAnimationFrame(animate);
      else last = 0;
    }

    function wake() {
      if (!frame) frame = requestAnimationFrame(animate);
    }

    function move(event) {
      if (!query.matches || event.pointerType === 'touch' || control.matches(':focus-visible')) return;
      const bounds = control.getBoundingClientRect();
      const x = (event.clientX - bounds.left - bounds.width / 2) / 4;
      const y = (event.clientY - bounds.top - bounds.height / 2) / 4;
      const length = Math.hypot(x, y);
      const limit = Math.min(1, 6 / Math.max(length, 1));
      target.x = x * limit;
      target.y = y * limit;
      wake();
    }

    function settle() {
      target.x = 0;
      target.y = 0;
      if (last || current.x || current.y || frame) wake();
    }

    function reset() {
      cancelAnimationFrame(frame);
      frame = 0;
      last = 0;
      for (const value of [current, velocity, target]) Object.assign(value, { x: 0, y: 0 });
      inner.style.removeProperty('translate');
    }

    control.addEventListener('pointermove', move);
    control.addEventListener('pointerleave', settle);
    control.addEventListener('pointercancel', reset);
    control.addEventListener('focus', reset);
    query.addEventListener('change', reset);
    window.addEventListener('blur', reset);
    window.addEventListener('scroll', reset, { passive: true });
    document.addEventListener('visibilitychange', reset);

    return function disconnectMagnet() {
      reset();
      control.removeEventListener('pointermove', move);
      control.removeEventListener('pointerleave', settle);
      control.removeEventListener('pointercancel', reset);
      control.removeEventListener('focus', reset);
      query.removeEventListener('change', reset);
      window.removeEventListener('blur', reset);
      window.removeEventListener('scroll', reset);
      document.removeEventListener('visibilitychange', reset);
    };
  }, []);

  return (
    <span ref={wrapperRef} className="magnet">
      <span ref={innerRef} className="magnet__content">{children}</span>
    </span>
  );
}
