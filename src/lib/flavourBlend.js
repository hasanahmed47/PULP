/**
 * Pure helpers for blending two can labels.
 *
 * A "blend" is { from, to, amount }: `from` and `to` are indices into the flavour list and
 * `amount` goes from 0 (all `from`) to 1 (all `to`). The renderer can mix ANY two labels,
 * so a chip click can fade straight from one flavour to another without passing through
 * the flavours in between.
 */

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
}

/** Keeps indices whole and inside the list, and amount inside 0..1. */
export function clampBlend({ from, to, amount }, lastIndex) {
  return {
    from: Math.round(clamp(from, 0, lastIndex)),
    to: Math.round(clamp(to, 0, lastIndex)),
    amount: clamp(amount, 0, 1),
  };
}

/** Scroll-style position (0, 0.5, 1.5 ...) to a blend between neighbouring flavours. */
export function blendFromPosition(position, lastIndex) {
  const clamped = clamp(position, 0, lastIndex);
  const from = Math.floor(clamped);
  return { from, to: Math.min(from + 1, lastIndex), amount: clamped - from };
}

/**
 * Plans the move from what is currently shown to flavour `next`.
 * Returns the blend to start from and the `amount` to animate to.
 *
 * - `next` is one of the two flavours on screen: no jump, just fade toward it.
 * - `next` is a third flavour: restart from whichever flavour dominates right now.
 *   Only this case can show a small pop, and only when a chip is clicked mid-fade.
 */
export function planFlavourBlend({ from, to, amount }, next) {
  if (next === to) return { start: { from, to, amount }, target: 1 };
  if (next === from) return { start: { from, to, amount }, target: 0 };

  const shown = amount < 0.5 ? from : to;
  return { start: { from: shown, to: next, amount: 0 }, target: 1 };
}
