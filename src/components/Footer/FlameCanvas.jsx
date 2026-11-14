import './FlameCanvas.css';
import { useEffect, useRef } from 'react';
import { createFlameRenderer } from './createFlameRenderer';

const INITIAL_TIME = 14;

export function FlameCanvas() {
  const canvasRef = useRef(null);
  const generationRef = useRef(0);

  useEffect(function initializeFlames() {
    const canvas = canvasRef.current;
    const generation = ++generationRef.current;
    canvas.hidden = true;
    let gl;

    try {
      gl = canvas.getContext('webgl2', { antialias: false, alpha: false });
    } catch (error) {
      console.error('PULP footer: WebGL2 initialization failed.', error);
    }
    if (!gl) return;

    let renderer;
    let frame = 0;
    let visible = false;
    let disposed = false;
    let elapsed = 0;
    let previousTime = null;
    let resizeObserver = null;
    let intersectionObserver = null;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');

    function stopAnimation() {
      window.cancelAnimationFrame(frame);
      frame = 0;
      previousTime = null;
    }

    function handleContextLoss() {
      stopAnimation();
      canvas.hidden = true;
    }

    function dispose() {
      disposed = true;
      stopAnimation();
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      document.removeEventListener('visibilitychange', synchronizeAnimation);
      motion.removeEventListener('change', synchronizeAnimation);
      canvas.removeEventListener('webglcontextlost', handleContextLoss);
      renderer?.dispose();
      queueMicrotask(function releaseContext() {
        if (generationRef.current === generation) gl.getExtension('WEBGL_lose_context')?.loseContext();
      });
    }

    try {
      renderer = createFlameRenderer(gl, canvas);
    } catch (error) {
      console.error('PULP footer:', error);
      dispose();
      return;
    }

    function canDraw() {
      return !disposed && visible && !document.hidden && !gl.isContextLost();
    }

    function draw(time) {
      renderer.draw(time);
      canvas.hidden = false;
    }

    function animate(now) {
      frame = 0;
      if (!canDraw()) return;
      if (previousTime !== null) elapsed += (now - previousTime) / 1000;
      previousTime = now;
      draw(INITIAL_TIME + elapsed);
      frame = window.requestAnimationFrame(animate);
    }

    function synchronizeAnimation() {
      stopAnimation();
      if (!canDraw()) return;
      if (motion.matches) draw(INITIAL_TIME);
      else frame = window.requestAnimationFrame(animate);
    }

    function resize() {
      if (disposed || gl.isContextLost()) return;
      const bounds = canvas.parentElement.getBoundingClientRect();
      const resized = renderer.resize(bounds.width, bounds.height);
      if (resized && canDraw()) draw(motion.matches ? INITIAL_TIME : INITIAL_TIME + elapsed);
    }

    resize();
    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas.parentElement);
    intersectionObserver = new IntersectionObserver(function updateVisibility([entry]) {
      visible = entry.isIntersecting;
      synchronizeAnimation();
    });
    intersectionObserver.observe(canvas.parentElement);
    document.addEventListener('visibilitychange', synchronizeAnimation);
    motion.addEventListener('change', synchronizeAnimation);
    canvas.addEventListener('webglcontextlost', handleContextLoss);

    return dispose;
  }, []);

  return <canvas ref={canvasRef} className="footer-flames" aria-hidden="true" />;
}
