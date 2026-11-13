export const vertexShader = '#version 300 es\nvoid main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);gl_Position=vec4(p*2.-1.,0.,1.);}';
export const fragmentShader = `#version 300 es
precision highp float;
precision highp int;
uniform vec2 r;
uniform float t;
const vec3 uBg = vec3(.015, .05, .42);
const vec3 uDeep = vec3(.01, .04, .32);
const vec3 uBlue = vec3(.16, .42, 1.);
const vec3 uHi = vec3(.7, .82, 1.);
out vec4 o;

float hash(ivec2 p){
  uvec2 cell = uvec2(p);
  uint value = (cell.x * 0x9e3779b9u) ^ (cell.y * 0x85ebca6bu);
  value ^= value >> 16u;
  value *= 0x7feb352du;
  value ^= value >> 15u;
  value *= 0x846ca68bu;
  value ^= value >> 16u;
  return float(value >> 8u) * (1. / 16777216.);
}
float noise(vec2 p){
  ivec2 i = ivec2(floor(p));
  vec2 f = fract(p);
  vec2 edge = min(f, 1. - f);
  vec2 curve = edge*edge*edge*(edge*(edge*6. - 15.) + 10.);
  f = mix(curve, 1. - curve, step(.5, f));
  return mix(mix(hash(i), hash(i + ivec2(1,0)), f.x),
             mix(hash(i + ivec2(0,1)), hash(i + ivec2(1,1)), f.x), f.y);
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
