import {
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import { CanSplash } from './CanSplash';
import { flavours } from '../data/flavours';
import { useCanFallback } from '../hooks/useCanFallback';
import { useCanRenderer } from '../hooks/useCanRenderer';
import { useCanSpin } from '../hooks/useCanSpin';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useVisibility } from '../hooks/useVisibility';
import { useVisibleOnce } from '../hooks/useVisibleOnce';
import { gsap } from '../lib/animation';
import { blendFromPosition, clampBlend } from '../lib/flavourBlend';
import '../styles/CanScene.css';

const CAN_VIEWS = [
  { id: 'top', label: 'Top', tilt: Math.PI * 0.42 },
  { id: 'front', label: 'Front', tilt: 0 },
  { id: 'bottom', label: 'Bottom', tilt: -Math.PI * 0.42 },
];

const FALLBACK_LEAVE_DELAY = 500;
const VIEW_ANIMATION = { duration: 0.45, ease: 'power2.out' };

function getSpinHint(status, canSpin) {
  if (canSpin) return '↔ Drag to spin · 360°';
  if (status === 'failed') return '360° view unavailable';
  return 'Preparing 360° view';
}

function useFallbackVisibility(ready) {
  const [mounted, setMounted] = useState(true);

  useEffect(function unmountAfterCrossfade() {
    if (!ready) {
      setMounted(true);
      return;
    }
    const timer = window.setTimeout(() => setMounted(false), FALLBACK_LEAVE_DELAY);
    return () => window.clearTimeout(timer);
  }, [ready]);

  return mounted;
}

function CanSceneControls({ controlsRef, hint, helpId, canSpin, view, onViewChange }) {
  return (
    <>
      <div ref={controlsRef} className="can-scene__controls">
        <span className="can-scene__hint" aria-hidden="true">
          {hint}
        </span>

        <div className="can-scene__views" role="group" aria-label="Can viewing angle">
          {CAN_VIEWS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              className="can-scene__view"
              aria-label={`View ${id} of can`}
              aria-pressed={view === id}
              disabled={!canSpin}
              onClick={() => onViewChange(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <span id={helpId} className="sr-only">
        {canSpin ? 'Drag left or right to rotate. Swipe vertically to scroll.' : hint}
      </span>
    </>
  );
}

export function CanScene({
  allFlavours = false,
  interactive = false,
  dropRun = null,
  preload = false,
  className = '',
  onReady,
  stageRef,
  controlsRef,
  ref,
}) {
  const wrapperRef = useRef(null);
  const canvasRef = useRef(null);
  const fallbackRef = useRef(null);
  const notifiedRef = useRef(false);
  const poseRef = useRef({
    rotation: 0,
    spin: 0,
    tilt: 0,
    blend: { from: 0, to: 0, amount: 0 },
    pointer: [0, 0],
  });

  const [activeFlavourIndex, setActiveFlavourIndex] = useState(0);
  const [view, setView] = useState('front');
  const helpId = useId();

  const reducedMotion = useReducedMotion();
  const visible = useVisibility(wrapperRef);
  const approaching = useVisibleOnce(wrapperRef, '600px 0px');
  const { sceneRef, status } = useCanRenderer(canvasRef, poseRef, {
    allFlavours,
    interactive,
    preload: preload || approaching,
    visible,
  });

  const flavour = flavours[activeFlavourIndex];
  const failed = status === 'failed';
  const ready = status === 'ready';
  const showFallback = useFallbackVisibility(ready);
  const fallbackStatus = useCanFallback(fallbackRef, flavour.image, showFallback);
  const settled = ready || (failed && fallbackStatus !== 'loading');
  const canSpin = interactive && ready;
  const hasDrop = dropRun != null;
  const lastFlavourIndex = allFlavours ? flavours.length - 1 : 0;
  const spinHint = getSpinHint(status, canSpin);

  const rotate = useCallback((rotation) => {
    const pose = poseRef.current;
    pose.spin = rotation;
    sceneRef.current?.setRotation(pose.rotation + rotation);
  }, [sceneRef]);

  const spin = useCanSpin(rotate, canSpin);

  useLayoutEffect(function playCanDrop() {
    const scene = wrapperRef.current;
    if (!scene) return;

    if (dropRun == null) {
      scene.removeAttribute('data-drop');
      return;
    }

    scene.dataset.drop = 'waiting';
    if (dropRun === 0) return;

    void scene.offsetWidth;
    scene.dataset.drop = 'playing';
  }, [dropRun]);

  function finishCanDrop(event) {
    if (event.target !== event.currentTarget) return;
    wrapperRef.current.dataset.drop = 'landed';
  }

  useEffect(function animateSelectedView() {
    if (!interactive) return;

    const selectedView = CAN_VIEWS.find((item) => item.id === view);
    if (!selectedView) return;

    const pose = poseRef.current;
    if (pose.tilt === selectedView.tilt) return;

    function updateTilt() {
      sceneRef.current?.setTilt(pose.tilt);
    }

    if (reducedMotion) {
      pose.tilt = selectedView.tilt;
      updateTilt();
      return;
    }

    const tween = gsap.to(pose, {
      tilt: selectedView.tilt,
      ...VIEW_ANIMATION,
      onUpdate: updateTilt,
    });

    return () => tween.kill();
  }, [interactive, reducedMotion, sceneRef, view]);

  useImperativeHandle(ref, () => {
    function setFlavourBlend(from, to, amount) {
      const blend = clampBlend({ from, to, amount }, lastFlavourIndex);
      poseRef.current.blend = blend;
      setActiveFlavourIndex(blend.amount < 0.5 ? blend.from : blend.to);
      sceneRef.current?.setFlavourBlend(blend.from, blend.to, blend.amount);
    }

    return {
      setRotation(rotation) {
        const pose = poseRef.current;
        pose.rotation = rotation;
        sceneRef.current?.setRotation(rotation + pose.spin);
      },
      setFlavourBlend,
      setFlavourPosition(value) {
        const { from, to, amount } = blendFromPosition(value, lastFlavourIndex);
        setFlavourBlend(from, to, amount);
      },
      setPointer(x, y) {
        poseRef.current.pointer = [x, y];
        sceneRef.current?.setPointer(x, y);
      },
    };
  }, [lastFlavourIndex, sceneRef]);

  useEffect(function notifyWhenReady() {
    if (!settled || notifiedRef.current || !onReady) return;
    notifiedRef.current = true;
    onReady();
  }, [onReady, settled]);

  return (
    <div
      ref={wrapperRef}
      className={`can-scene ${className}`}
      data-controls={interactive}
      data-interactive={canSpin}
      data-dragging={spin.dragging}
      data-ready={ready}
      aria-busy={!settled}
      role={interactive ? 'group' : 'img'}
      aria-label={`${flavour.name} PULP can`}
      aria-describedby={interactive ? helpId : undefined}
    >
      <div ref={stageRef} className="can-scene__stage" {...spin.handlers}>
        {hasDrop && <CanSplash layer="back" />}

        <div className="can-scene__drop" onAnimationEnd={finishCanDrop}>
          {showFallback && (
            <img
              ref={fallbackRef}
              className="can-scene__fallback"
              data-leaving={ready}
              data-unavailable={fallbackStatus === 'unavailable'}
              src={flavour.image}
              alt=""
              width="600"
              height="1000"
              draggable="false"
            />
          )}
          <div ref={canvasRef} className="can-scene__canvas" aria-hidden="true" />
        </div>

        {hasDrop && <CanSplash layer="front" />}
      </div>

      {interactive && (
        <CanSceneControls
          controlsRef={controlsRef}
          hint={spinHint}
          helpId={helpId}
          canSpin={canSpin}
          view={view}
          onViewChange={setView}
        />
      )}
    </div>
  );
}
