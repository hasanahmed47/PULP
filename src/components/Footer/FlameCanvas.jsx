import './FlameCanvas.css';
import { useEffect, useRef } from 'react';

const vertexShader = '#version 300 es\nvoid main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);gl_Position=vec4(p*2.-1.,0.,1.);}';
const fragmentShader = `#version 300 es
precision highp float;
uniform vec2 r;
uniform float t;
const vec3 uBg = vec3(.015, .05, .42);
const vec3 uDeep = vec3(.01, .04, .32);
const vec3 uBlue = vec3(.16, .42, 1.);
const vec3 uHi = vec3(.7, .82, 1.);
out vec4 o;

float hash(vec2 p){
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f*f*f*(f*(f*6. - 15.) + 10.);
  return mix(mix(hash(i), hash(i + vec2(1,0)), f.x),
             mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x), f.y);
}
float fbm(vec2 p){
  float v = 0., a = .5;
  for(int i = 0; i < 3; i++){
    v += a * noise(p);
    p = p * 2.03 + vec2(3.1, 1.7);
    a *= .5;
  }
  return v;
}
float H(vec2 p){
  float T = t * .05;
  vec2 q = vec2(fbm(p*.55 + vec2(0., T)), fbm(p*.55 + vec2(5.2, 1.3) - T));
  vec2 w = p + 1.5 * q;
  float d = dot(w, vec2(-.5, .866));
  return .5 + .5*sin(d*9. + fbm(w*.9 + T)*6. - T*3.) + .25*fbm(w*1.3 - T);
}
void main(){
  vec2 uv = gl_FragCoord.xy / r;
  float asp = r.x / r.y;
  float zoom = 1. + max(0., 1.2 - asp) * .9;
  vec2 p = (uv - .5) * vec2(asp, 1.) * zoom;
  float rise = t * .05;
  vec2 pf = vec2(p.x, p.y - rise);

  float e = .006;
  float h = H(pf);
  float hx = (H(pf + vec2(e, 0.)) - h) / e;
  float hy = (H(pf + vec2(0., e)) - h) / e;
  vec3 n = normalize(vec3(-hx*.22, -hy*.22, 1.));
  vec3 L = normalize(vec3(-.45, .55, .7));
  float dif = dot(n, L);
  float lit = mix(smoothstep(.5, .74, dif), smoothstep(.28, .95, dif), .45);
  float spec = pow(max(dot(reflect(-L, n), vec3(0., 0., 1.)), 0.), 18.);

  float tn = fbm(vec2(p.x*1.7 + .4*sin(t*.07), (p.y - rise*2.6)*.6));
  float tn2 = fbm(vec2(p.x*3.0 - 4., (p.y - rise*3.8)*1.2));
  float top = .34 + .55*tn + .08*tn2;
  float body = 1. - smoothstep(top - .17, top + .02, uv.y);
  body = pow(body, 1.15);

  float base = 1. - smoothstep(.0, .6, uv.y);
  float shade = mix(lit, 1., .8 * base);
  shade = .32 + .68 * shade;
  float tip = mix(.55, 1., 1. - smoothstep(top - .32, top, uv.y));

  vec3 flame = mix(uDeep, uBlue, clamp(shade, 0., 1.)) + uHi * spec * .4 * lit;
  o = vec4(mix(uBg, flame, body * tip), 1.);
}`;

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
