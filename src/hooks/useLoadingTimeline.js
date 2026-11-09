import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { gsap } from '../lib/animation';
import {
  createLoadingMetrics,
  endTime,
  getLoadingFrame,
  holdTime,
  introTime,
  revealTime,
} from '../lib/loadingTimeline';

const settleFrames = 2;

function applyFrame(frame, nodes) {
  nodes.sheet.setAttribute('d', frame.sheet);
  nodes.letters.setAttribute('transform', frame.group);
  nodes.dim.setAttribute('fill-opacity', frame.dimOpacity);
  nodes.stage.dataset.covered = frame.covered;

  frame.glyphs.forEach((glyph, index) => {
    const node = nodes.glyphs[index];
    node.setAttribute('d', glyph.path);
    node.setAttribute('transform', glyph.transform);
    node.dataset.visible = glyph.visible;
  });
}

export function useLoadingTimeline({
  ready,
  compact,
  reducedMotion,
  onIntroEnd,
  onReveal,
  onComplete,
}) {
  const stageRef = useRef(null);
  const sheetRef = useRef(null);
  const lettersRef = useRef(null);
  const dimRef = useRef(null);
  const glyphRefs = useRef([]);

  const clock = useRef({ time: 0 });
  const metrics = useRef(null);
  const timeline = useRef(null);
  const readyRef = useRef(ready);
  const introEnded = useRef(false);
  const revealed = useRef(false);

  const paint = useCallback(function paint() {
    if (!metrics.current) return;

    const frame = getLoadingFrame(clock.current.time, metrics.current);
    applyFrame(frame, {
      stage: stageRef.current,
      sheet: sheetRef.current,
      letters: lettersRef.current,
      dim: dimRef.current,
      glyphs: glyphRefs.current,
    });
  }, []);

  
const fireDueMilestones = useCallback(function fireDueMilestones() {
  const { time } = clock.current;

  if (!introEnded.current && time >= introTime) {
    introEnded.current = true;
    onIntroEnd();
  }

  if (!revealed.current && time >= revealTime) {
    revealed.current = true;

    // Mark the loading screen as exiting before revealing the site.
    const loadingScreen = stageRef.current?.closest('.loading-screen');
    loadingScreen?.setAttribute('data-exiting', 'true');

    onReveal();
  }
}, [onIntroEnd, onReveal]);


  useLayoutEffect(function trackViewport() {
    const stage = stageRef.current;

    function measureViewport() {
      const { width, height } = stage.getBoundingClientRect();
      metrics.current = createLoadingMetrics({ width, height, compact });
      stage.setAttribute('viewBox', `0 0 ${width} ${height}`);
      paint();
    }

    measureViewport();
    const observer = new ResizeObserver(measureViewport);
    observer.observe(stage);

    return function stopTrackingViewport() {
      observer.disconnect();
    };
  }, [compact, paint]);

  useEffect(function playTimeline() {
    clock.current.time = reducedMotion ? holdTime : 0;
    introEnded.current = false;
    revealed.current = false;
    paint();

    if (reducedMotion) {
      onIntroEnd();
      return;
    }

    function resumeWhenReady() {
      if (readyRef.current) timeline.current.play();
    }

    function updateFrame() {
      paint();
      fireDueMilestones();
    }

    timeline.current = gsap.timeline({ paused: true, onUpdate: updateFrame, onComplete })
      .to(clock.current, { time: holdTime, duration: holdTime, ease: 'none' })
      .addPause(holdTime, resumeWhenReady)
      .to(clock.current, { time: endTime, duration: endTime - holdTime, ease: 'none' });

    let framesLeft = settleFrames;
    let frame = 0;

    function startAfterMountWork() {
      framesLeft -= 1;
      if (framesLeft > 0) {
        frame = requestAnimationFrame(startAfterMountWork);
        return;
      }
      timeline.current.play();
    }

    frame = requestAnimationFrame(startAfterMountWork);

    return function stopTimeline() {
      cancelAnimationFrame(frame);
      timeline.current.kill();
      timeline.current = null;
    };
  }, [fireDueMilestones, onComplete, onIntroEnd, paint, reducedMotion]);

  useEffect(function continueWhenReady() {
    readyRef.current = ready;
    if (!ready) return;

    if (reducedMotion) {
      onReveal();
      onComplete();
      return;
    }

    const paused = timeline.current?.paused();
    if (paused && clock.current.time >= holdTime) timeline.current.play();
  }, [onComplete, onReveal, ready, reducedMotion]);

  return { stageRef, sheetRef, lettersRef, dimRef, glyphRefs };
}