export function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

export function lerp(from, to, amount) {
  return from + (to - from) * amount;
}

export function progressBetween(time, start, duration) {
  return clamp((time - start) / duration);
}

export function easeOutCubic(amount) {
  return 1 - Math.pow(1 - amount, 3);
}

export function easeOutQuart(amount) {
  return 1 - Math.pow(1 - amount, 4);
}

export function easeInOutQuad(amount) {
  return amount < 0.5 ? 2 * amount * amount : 1 - Math.pow(-2 * amount + 2, 2) / 2;
}

export function easeInOutCubic(amount) {
  return amount < 0.5 ? 4 * amount ** 3 : 1 - Math.pow(-2 * amount + 2, 3) / 2;
}
