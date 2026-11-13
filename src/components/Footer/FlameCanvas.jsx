import './FlameCanvas.css';
import { useEffect, useRef } from 'react';
import { vertexShader, fragmentShader } from './flameShader';

function resolutionScale() {
  const lowPower = navigator.hardwareConcurrency <= 4 || navigator.deviceMemory <= 4 || navigator.connection?.saveData;
  const scale = window.innerWidth < 760 || lowPower ? .6 : .9;
  return Math.min(window.devicePixelRatio || 1, 1.5) * scale;
}

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

    const shaders = [];
    let program;
    let frame = 0;
    let visible = false;
    let disposed = false;
    let elapsed = 0;
    let previousTime = null;
    let resizeObserver = null;
    let intersectionObserver = null;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');

    function compileShader(type, source) {
      const shader = gl.createShader(type);
      if (!shader) throw new Error('Unable to allocate a footer shader.');
      shaders.push(shader);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(shader) || 'Footer shader compilation failed.');
      }
      return shader;
    }

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
      if (program) gl.deleteProgram(program);
      shaders.forEach((shader) => gl.deleteShader(shader));
      queueMicrotask(function releaseContext() {
        if (generationRef.current === generation) gl.getExtension('WEBGL_lose_context')?.loseContext();
      });
    }

    let resolutionUniform;
    let timeUniform;
    try {
      const vertex = compileShader(gl.VERTEX_SHADER, vertexShader);
      const fragment = compileShader(gl.FRAGMENT_SHADER, fragmentShader);
      program = gl.createProgram();
      if (!program) throw new Error('Unable to allocate the footer program.');
      gl.attachShader(program, vertex);
      gl.attachShader(program, fragment);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program) || 'Footer shader linking failed.');
      }
      gl.useProgram(program);
      resolutionUniform = gl.getUniformLocation(program, 'r');
      timeUniform = gl.getUniformLocation(program, 't');
    } catch (error) {
      console.error('PULP footer:', error);
      dispose();
      return;
    }

    function canDraw() {
      return !disposed && visible && !document.hidden && !gl.isContextLost();
    }

    function draw(time) {
      gl.uniform2f(resolutionUniform, canvas.width, canvas.height);
      gl.uniform1f(timeUniform, time);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      canvas.hidden = false;
    }

    function animate(now) {
      frame = 0;
      if (!canDraw()) return;
      if (previousTime !== null) elapsed += (now - previousTime) / 1000;
      previousTime = now;
      draw(14 + elapsed);
      frame = window.requestAnimationFrame(animate);
    }

    function synchronizeAnimation() {
      stopAnimation();
      if (!canDraw()) return;
      if (motion.matches) draw(14);
      else frame = window.requestAnimationFrame(animate);
    }

    function resize() {
      if (disposed || gl.isContextLost()) return;
      const bounds = canvas.parentElement.getBoundingClientRect();
      const scale = resolutionScale();
      const width = Math.max(2, Math.floor(bounds.width * scale));
      const height = Math.max(2, Math.floor(bounds.height * scale));
      if (canvas.width === width && canvas.height === height) return;
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
      if (canDraw()) draw(motion.matches ? 14 : 14 + elapsed);
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
