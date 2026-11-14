export const vertexShader = `#version 300 es
void main() {
  vec2 corner = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  gl_Position = vec4(corner * 2.0 - 1.0, 0.0, 1.0);
}`;

export const fragmentShader = `#version 300 es
precision highp float;
precision highp int;

uniform vec2 uResolution;
uniform float uTime;
out vec4 fragmentColor;

const vec3 BACKGROUND = vec3(0.992, 0.973, 0.953);
const vec3 DEEP_BLUE = vec3(0.025, 0.06, 0.38);
const vec3 FLAME_BLUE = vec3(0.08, 0.25, 1.0);
const vec3 HIGHLIGHT = vec3(0.24, 0.45, 1.0);
const float FLOW_SPEED = 0.34;
const float FIELD_HEIGHT = 2.6;

float randomValue(vec2 cell) {
  uvec2 grid = uvec2(ivec2(cell));
  uint seed = (grid.x * 1597334677u) ^ (grid.y * 3812015801u);
  seed = (seed ^ (seed >> 16u)) * 0x7feb352du;
  seed = (seed ^ (seed >> 15u)) * 0x846ca68bu;
  seed ^= seed >> 16u;
  return float(seed >> 8u) / 16777216.0;
}

float smoothNoise(vec2 position) {
  vec2 cell = floor(position);
  vec2 blend = fract(position);
  blend = blend * blend * blend * (blend * (blend * 6.0 - 15.0) + 10.0);

  float lower = mix(randomValue(cell), randomValue(cell + vec2(1.0, 0.0)), blend.x);
  float upper = mix(randomValue(cell + vec2(0.0, 1.0)), randomValue(cell + vec2(1.0, 1.0)), blend.x);
  return mix(lower, upper, blend.y);
}

vec2 warpFlow(vec2 position, float time) {
  position.x += time * 0.3;
  vec2 drift = vec2(-0.18, 0.12) * time;
  vec2 turbulence = vec2(
    smoothNoise(position * 0.85 + drift),
    smoothNoise(position * 0.85 + vec2(5.2, 1.3) - drift)
  );
  position += (turbulence - 0.5) * 0.45;

  for (int layer = 0; layer < 5; layer++) {
    float order = float(layer);
    float frequency = 1.0 + order * 0.7;
    float strength = 0.68 / (1.0 + order);
    vec2 bend = vec2(
      sin(position.y * frequency + time + order * 1.3),
      cos(position.x * frequency - time * 0.7 + order * 0.8)
    );
    position += bend * strength;
  }

  return position;
}

vec3 ribbonColor(vec2 flow, float depth, float time) {
  float fold = 0.5 + 0.5 * sin(flow.x * 0.9 + flow.y * 3.8 - time * 0.4);
  float light = smoothstep(0.1, 0.9, fold);
  vec3 color = mix(DEEP_BLUE, FLAME_BLUE, light);
  float crest = exp(-depth * depth * 5.0);
  return mix(color, HIGHLIGHT, crest * 0.2);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  float aspect = max(uResolution.x / uResolution.y, 0.7);
  vec2 position = (uv - vec2(0.5, 0.0)) * vec2(aspect, 1.0) * FIELD_HEIGHT;
  float time = uTime * FLOW_SPEED;
  vec2 flow = warpFlow(position, time);
  float depth = 0.46 * FIELD_HEIGHT - flow.y;
  float coverage = smoothstep(-0.22, 0.26, depth);
  coverage *= 1.0 - smoothstep(0.55, 0.70, uv.y);
  coverage = mix(1.0, coverage, smoothstep(0.08, 0.22, uv.y));

  vec3 color = ribbonColor(flow, depth, time);
  fragmentColor = vec4(mix(BACKGROUND, color, coverage), 1.0);
}
`;
