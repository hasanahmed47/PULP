function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
}

export function clampBlend({ from, to, amount }, lastIndex) {
  return {
    from: Math.round(clamp(from, 0, lastIndex)),
    to: Math.round(clamp(to, 0, lastIndex)),
    amount: clamp(amount, 0, 1),
  };
}

export function blendFromPosition(position, lastIndex) {
  const clamped = clamp(position, 0, lastIndex);
  const from = Math.floor(clamped);
  return { from, to: Math.min(from + 1, lastIndex), amount: clamped - from };
}

export function planFlavourBlend({ from, to, amount }, next) {
  if (next === to) return { start: { from, to, amount }, target: 1 };
  if (next === from) return { start: { from, to, amount }, target: 0 };

  const shown = amount < 0.5 ? from : to;
  return { start: { from: shown, to: next, amount: 0 }, target: 1 };
}
