export const vertexShader = `#version 300 es
void main() {
  vec2 corner = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  gl_Position = vec4(corner * 2.0 - 1.0, 0.0, 1.0);
}`;

export const fragmentShader = `#version 300 es
precision highp float;

uniform vec2 uResolution;
uniform float uTime;
out vec4 fragmentColor;

const vec3 BACKGROUND = vec3(0.992, 0.973, 0.953);
const vec3 DEEP_BLUE = vec3(0.06, 0.12, 0.62);
const vec3 FLAME_BLUE = vec3(0.10, 0.32, 1.0);
const vec3 HIGHLIGHT = vec3(0.55, 0.72, 1.0);
const float MIN_COMPOSITION_WIDTH = 1.44;
const float FLOW_SPEED = 0.22;
const float SLOPE_STEP = 0.01;

float randomValue(vec2 cell) {
  cell = fract(cell * vec2(123.34, 456.21));
  cell += dot(cell, cell + 45.32);
  return fract(cell.x * cell.y);
}

float smoothNoise(vec2 position) {
  vec2 cell = floor(position);
  vec2 blend = fract(position);
  blend = blend * blend * blend * (blend * (blend * 6.0 - 15.0) + 10.0);

  float lower = mix(randomValue(cell), randomValue(cell + vec2(1.0, 0.0)), blend.x);
  float upper = mix(randomValue(cell + vec2(0.0, 1.0)), randomValue(cell + vec2(1.0, 1.0)), blend.x);
  return mix(lower, upper, blend.y);
}

float layeredNoise(vec2 position) {
  float value = 0.0;
  float amplitude = 0.5;

  for (int octave = 0; octave < 3; octave++) {
    value += amplitude * smoothNoise(position);
    position = position * 2.03 + vec2(3.1, 1.7);
    amplitude *= 0.5;
  }

  return value;
}

float plumeProfile(float position, float center, float width) {
  float distanceFromCenter = (position - center) / width;
  return exp(-distanceFromCenter * distanceFromCenter);
}

float sampleDensity(vec2 position, vec2 displacement, float height, float compositionWidth) {
  float flow = uTime * FLOW_SPEED;
  vec2 warped = position + vec2(0.85, 0.3) * (displacement - 0.5);
  float texture = layeredNoise(vec2(warped.x * 1.45, warped.y * 0.8 - flow));
  float mainCenter = compositionWidth * (0.17 * sin(uTime * 0.11) + 0.07 * sin(uTime * 0.23 + 1.7) - 0.12);
  float sideCenter = compositionWidth * (0.30 + 0.10 * sin(uTime * 0.08 + 2.0));
  float tipFade = 1.0 - smoothstep(0.08, 0.85, height);
  float plumes = 0.5 * plumeProfile(warped.x, mainCenter, 0.2);
  plumes += 0.26 * plumeProfile(warped.x, sideCenter, 0.16);

  float density = 0.9 * texture + 0.58 * (1.0 - height) + plumes * tipFade - 0.8;
  float baseGlow = 0.4 * (1.0 - smoothstep(0.10, 0.24, height));
  return density + baseGlow;
}

vec3 shadeFlame(float density, vec2 slope) {
  vec3 normal = normalize(vec3(-slope * 0.9, 1.0));
  vec3 lightDirection = normalize(vec3(-0.4, 0.6, 0.7));
  float light = smoothstep(0.5, 0.95, dot(normal, lightDirection));
  float reflection = max(dot(reflect(-lightDirection, normal), vec3(0.0, 0.0, 1.0)), 0.0);
  float specular = pow(reflection, 22.0);
  float core = smoothstep(0.0, 0.55, density);
  float shade = 0.55 + 0.45 * mix(light, 1.0, 0.35 * core);
  shade *= mix(0.82, 1.0, core);

  return mix(DEEP_BLUE, FLAME_BLUE, clamp(shade, 0.0, 1.0)) + HIGHLIGHT * specular * 0.35 * light;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  float compositionWidth = max(uResolution.x / uResolution.y, MIN_COMPOSITION_WIDTH);
  vec2 position = (uv - 0.5) * vec2(compositionWidth, 1.0);
  float flow = uTime * FLOW_SPEED;
  vec2 displacement = vec2(
    layeredNoise(position * 0.9 + vec2(0.0, -flow * 0.6)),
    layeredNoise(position * 0.9 + vec2(5.2, 1.3 - flow * 0.8))
  );

  float density = sampleDensity(position, displacement, uv.y, compositionWidth);
  float horizontal = sampleDensity(position + vec2(SLOPE_STEP, 0.0), displacement, uv.y, compositionWidth);
  float vertical = sampleDensity(position + vec2(0.0, SLOPE_STEP), displacement, uv.y, compositionWidth);
  vec2 slope = (vec2(horizontal, vertical) - density) / SLOPE_STEP;
  float body = smoothstep(0.0, 0.1, density);

  fragmentColor = vec4(mix(BACKGROUND, shadeFlame(density, slope), body), 1.0);
}`;
