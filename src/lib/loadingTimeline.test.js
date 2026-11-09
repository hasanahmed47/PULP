import { describe, expect, it } from 'vitest';
import {
  createLoadingMetrics,
  endTime,
  getLoadingFrame,
  holdTime,
  introTime,
  loadingTimeline,
  revealTime,
} from './loadingTimeline';

const mergeEnd = loadingTimeline.merge.start + loadingTimeline.merge.duration + 0.001;
const zoomEnd = loadingTimeline.zoom.start + loadingTimeline.zoom.duration;

const desktop = createLoadingMetrics({ width: 1440, height: 900, compact: false });
const phone = createLoadingMetrics({ width: 390, height: 844, compact: true });

describe('loading timeline', () => {
  it('holds on the finished wordmark before the letters merge', () => {
    expect(holdTime).toBe(loadingTimeline.merge.start);
    expect(introTime).toBeGreaterThan(loadingTimeline.bars.duration);
    expect(introTime).toBeLessThan(holdTime);
    expect(revealTime).toBeGreaterThan(loadingTimeline.zoom.start);
    expect(endTime).toBeGreaterThan(revealTime);
  });

  it('starts with every letter collapsed to nothing', () => {
    const frame = getLoadingFrame(0, desktop);

    expect(frame.covered).toBe(false);
    expect(frame.dimOpacity).toBe(0);
    for (const glyph of frame.glyphs) expect(glyph.transform).toContain('scale(1 0)');
  });

  it('keeps the page sheet solid until the two P letters have merged', () => {
    const beforeMerge = getLoadingFrame(holdTime, desktop);
    const afterMerge = getLoadingFrame(mergeEnd, desktop);

    expect(beforeMerge.sheet.match(/M/g)).toHaveLength(1);
    expect(afterMerge.sheet.match(/M/g)).toHaveLength(2);
  });

  it('squeezes the middle letters away while the outer letters stay', () => {
    const merged = getLoadingFrame(mergeEnd, desktop);

    expect(merged.glyphs.map((glyph) => glyph.visible)).toEqual([true, false, false, true]);
  });

  it('zooms until the counter covers the whole viewport', () => {
    for (const metrics of [desktop, phone]) {
      const frame = getLoadingFrame(zoomEnd, metrics);
      expect(frame.covered).toBe(true);
    }
    expect(phone.maxZoom).toBeGreaterThan(desktop.maxZoom);
  });

  it('fades the dim layer back to nothing by the end', () => {
    const peak = getLoadingFrame(zoomEnd, desktop);
    const end = getLoadingFrame(endTime, desktop);

    expect(peak.dimOpacity).toBeCloseTo(loadingTimeline.dim.peak);
    expect(end.dimOpacity).toBe(0);
  });
});