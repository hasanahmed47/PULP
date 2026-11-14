export const vertexShader = `#version 300 es
void main(){
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  gl_Position = vec4(p * 2. - 1., 0., 1.);
}`;

export const fragmentShader = `#version 300 es
precision highp float;
uniform vec2 r;
uniform float t;
const vec3 uBg = vec3(.992, .973, .953);
const vec3 uDeep = vec3(.06, .12, .62);
const vec3 uBlue = vec3(.10, .32, 1.);
const vec3 uHi = vec3(.55, .72, 1.);
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

float D(vec2 p, vec2 q, float uvy, float asp){
  float T = t * .22;
  vec2  w = p + vec2(.85, .3) * (q - .5);
  float n = fbm(vec2(w.x * 1.45, w.y * .8 - T));
  float c1 = asp * (.17 * sin(t*.11) + .07 * sin(t*.23 + 1.7)) - .12 * asp;
  float c2 = asp * (.30 + .10 * sin(t*.08 + 2.));
  float fade = 1. - smoothstep(.08, .85, uvy);
  float col = .5 * exp(-pow((w.x - c1) / .2, 2.)) + .26 * exp(-pow((w.x - c2) / .16, 2.));
  return .9 * n + .58 * (1. - uvy) + col * fade - .8;
}

void main(){
  vec2 uv = gl_FragCoord.xy / r;
  float asp = r.x / r.y;

  float zoom = 1. + max(0., 1.2 - asp) * .9;
  vec2 p = (uv - .5) * vec2(asp, 1.) * zoom;

  float T = t * .22;
  vec2 q = vec2(fbm(p * .9 + vec2(0., -T * .6)), fbm(p * .9 + vec2(5.2, 1.3 - T * .8)));

  float e = .01;
  float d  = D(p, q, uv.y, asp);
  float dx = (D(p + vec2(e, 0.), q, uv.y, asp) - d) / e;
  float dy = (D(p + vec2(0., e), q, uv.y, asp) - d) / e;

  float body = smoothstep(.0, .1, d);

  vec3 n3 = normalize(vec3(-dx * .9, -dy * .9, 1.));
  vec3 L = normalize(vec3(-.4, .6, .7));
  float dif = dot(n3, L);
  float lit = smoothstep(.5, .95, dif);
  float spec = pow(max(dot(reflect(-L, n3), vec3(0., 0., 1.)), 0.), 22.);
  float core = smoothstep(.0, .55, d);
  float shade = .55 + .45 * mix(lit, 1., .35 * core);
  shade *= mix(.82, 1., core);

  vec3 flame = mix(uDeep, uBlue, clamp(shade, 0., 1.)) + uHi * spec * .35 * lit;
  o = vec4(mix(uBg, flame, body), 1.);
}`;
