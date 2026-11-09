import {
  clamp,
  easeInOutCubic,
  easeInOutQuad,
  easeOutCubic,
  easeOutQuart,
  lerp,
  progressBetween,
} from './easing';
import {
  createGlyphPath,
  createPillPath,
  createWordmarkLayout,
  wordmarkHeight,
} from './wordmark';

export const loadingTimeline = {
  bars: { start: 0, stagger: 0.12, duration: 0.6 },
  carve: { start: 0.92, stagger: 0.06, duration: 0.5 },
  merge: { start: 1.85, duration: 0.65 },
  zoom: { start: 2.55, duration: 0.95 },
  revealDelay: 0.45,
  dim: { peak: 0.5, riseDelay: 0.3, riseDuration: 0.65, fadeDuration: 1.5 },
};

export const holdTime = loadingTimeline.merge.start;
export const revealTime = loadingTimeline.zoom.start + loadingTimeline.revealDelay;
export const endTime = loadingTimeline.zoom.start
  + loadingTimeline.zoom.duration
  + loadingTimeline.dim.fadeDuration;

const wordmarkWidthShare = { regular: 0.86, compact: 0.94 };
const zoomGrowth = 1.05;
const coverMargin = 1.08;
const mergeSqueezeShare = 0.4;
const squeezedLetterLimit = 0.08;
const zoomCurve = 1.25;

const layout = createWordmarkLayout();
const lastLetter = layout.letters.length - 1;

export const introTime = loadingTimeline.carve.start
  + loadingTimeline.carve.stagger * lastLetter
  + loadingTimeline.carve.duration;

function findCoverZoom(width, height, unit) {
  const { counter } = layout;

  function coversViewport(zoom) {
    const scale = unit * zoom;
    const radius = (counter.height * scale) / 2;
    const straightReach = Math.max((counter.width * scale) / 2 - radius, 0);
    const cornerDistance = Math.hypot(Math.max(width / 2 - straightReach, 0), height / 2);
    return cornerDistance <= radius / coverMargin;
  }

  let zoom = 1;
  while (!coversViewport(zoom)) zoom *= zoomGrowth;
  return zoom;
}

export function createLoadingMetrics({ width, height, compact }) {
  const share = compact ? wordmarkWidthShare.compact : wordmarkWidthShare.regular;
  const unit = (width * share) / layout.totalWidth;

  return { width, height, unit, maxZoom: findCoverZoom(width, height, unit) };
}

function createGlyphFrame(letter, index, time) {
  const { bars, carve, merge } = loadingTimeline;
  const mergeProgress = progressBetween(time, merge.start, merge.duration);
  const isEdgeLetter = index === 0 || index === lastLetter;

  const grow = easeOutCubic(progressBetween(time, bars.start + index * bars.stagger, bars.duration));
  const carved = easeOutCubic(progressBetween(time, carve.start + index * carve.stagger, carve.duration));
  const squeeze = isEdgeLetter
    ? 1
    : 1 - easeInOutCubic(clamp(mergeProgress / mergeSqueezeShare));
  const centre = lerp(letter.centre, 0, easeOutQuart(mergeProgress));

  const transform = [
    `translate(${centre} ${-wordmarkHeight / 2})`,
    `scale(${squeeze} 1)`,
    `translate(${-letter.width / 2} 0)`,
    `translate(0 ${wordmarkHeight})`,
    `scale(1 ${grow})`,
    `translate(0 ${-wordmarkHeight})`,
  ].join(' ');

  return {
    visible: squeeze >= squeezedLetterLimit,
    path: createGlyphPath(letter.glyph, carved, letter.width),
    transform,
  };
}

function getDimOpacity(time) {
  const { zoom, dim } = loadingTimeline;
  const zoomEnd = zoom.start + zoom.duration;

  if (time < zoomEnd) {
    const rise = progressBetween(time, zoom.start + dim.riseDelay, dim.riseDuration);
    return dim.peak * easeInOutQuad(rise);
  }

  return dim.peak * (1 - easeOutCubic(progressBetween(time, zoomEnd, dim.fadeDuration)));
}

export function getLoadingFrame(time, metrics) {
  const { merge, zoom } = loadingTimeline;
  const { width, height, unit, maxZoom } = metrics;
  const { counter } = layout;

  const merged = progressBetween(time, merge.start, merge.duration) === 1;
  const zoomProgress = progressBetween(time, zoom.start, zoom.duration);

  const zoomFactor = Math.exp(Math.log(maxZoom) * Math.pow(zoomProgress, zoomCurve));
  const focusY = counter.y * easeInOutQuad(zoomProgress);
  const scale = unit * zoomFactor;
  const originX = width / 2;
  const originY = height / 2 - scale * focusY;

  const viewportHole = merged
    ? createPillPath(originX, originY + scale * counter.y, counter.width * scale, counter.height * scale)
    : '';

  return {
    glyphs: layout.letters.map((letter, index) => createGlyphFrame(letter, index, time)),
    group: `translate(${originX} ${originY}) scale(${scale})`,
    sheet: `M0 0H${width}V${height}H0Z${viewportHole}`,
    dimOpacity: getDimOpacity(time),
    covered: zoomProgress === 1,
  };
}