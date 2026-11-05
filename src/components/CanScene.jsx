import { useCallback, useEffect, useId, useImperativeHandle, useRef, useState } from 'react';
import { flavours } from '../data/flavours';
import { useCanFallback } from '../hooks/useCanFallback';
import { useCanRenderer } from '../hooks/useCanRenderer';
import { useCanSpin } from '../hooks/useCanSpin';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useVisibility } from '../hooks/useVisibility';
import { gsap } from '../lib/animation';
import { blendFromPosition, clampBlend } from '../lib/flavourBlend';
import './CanScene.css';

const views = [
  { id: 'top', label: 'Top', tilt: Math.PI * 0.42 },
  { id: 'front', label: 'Front', tilt: 0 },
  { id: 'bottom', label: 'Bottom', tilt: -Math.PI * 0.42 },
];
const viewMotion = { duration: 0.45, ease: 'power2.out' };

function getSpinHint(status, canSpin) {
  if (canSpin) return '↔ Drag to spin · 360°';
  if (status === 'failed') return '360° view unavailable';
  return 'Preparing 360° view';
}

export function CanScene({
  allFlavours = false,
  interactive = false,
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
  const poseRef = useRef({ rotation: 0, spin: 0, tilt: 0, blend: { from: 0, to: 0, amount: 0 }, pointer: [0, 0] });
  const [active, setActive] = useState(0);
  const [view, setView] = useState('front');
  const helpId = useId();
  const reducedMotion = useReducedMotion();
  const visible = useVisibility(wrapperRef);
  const { sceneRef, status } = useCanRenderer(canvasRef, poseRef, { allFlavours, interactive, visible });

  const flavour = flavours[active];
  const failed = status === 'failed';
  const ready = status === 'ready';
  const fallbackStatus = useCanFallback(fallbackRef, flavour.image, failed);
  const settled = ready || (failed && fallbackStatus !== 'loading');
  const canSpin = interactive && ready;
  const lastFlavour = allFlavours ? flavours.length - 1 : 0;
  const hint = getSpinHint(status, canSpin);

  const rotate = useCallback((rotation) => {
    const pose = poseRef.current;
    pose.spin = rotation;
    sceneRef.current?.setRotation(pose.rotation + rotation);
  }, [sceneRef]);
  const spin = useCanSpin(rotate, canSpin);

  useEffect(function changeCanView() {
    if (!interactive) return;
    const pose = poseRef.current;
    const selected = views.find((item) => item.id === view);
    if (pose.tilt === selected.tilt) return;

    function updateTilt() {
      sceneRef.current?.setTilt(pose.tilt);
    }

    if (reducedMotion) {
      pose.tilt = selected.tilt;
      updateTilt();
      return;
    }

    const tween = gsap.to(pose, {
      tilt: selected.tilt,
      ...viewMotion,
      onUpdate: updateTilt,
    });

    return function stopViewChange() {
      tween.kill();
    };
  }, [interactive, reducedMotion, sceneRef, view]);

  useImperativeHandle(ref, () => {
    function setFlavourBlend(from, to, amount) {
      const blend = clampBlend({ from, to, amount }, lastFlavour);
      poseRef.current.blend = blend;
      setActive(blend.amount < 0.5 ? blend.from : blend.to);
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
        const { from, to, amount } = blendFromPosition(value, lastFlavour);
        setFlavourBlend(from, to, amount);
      },
      setPointer(x, y) {
        poseRef.current.pointer = [x, y];
        sceneRef.current?.setPointer(x, y);
      },
    };
  }, [lastFlavour, sceneRef]);

  useEffect(() => {
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
        {failed && (
          <img
            ref={fallbackRef}
            className="can-scene__fallback"
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
      {interactive && (
        <>
          <div ref={controlsRef} className="can-scene__controls">
            <span className="can-scene__hint" aria-hidden="true">
              {hint}
            </span>
            <div className="can-scene__views" role="group" aria-label="Can viewing angle">
              {views.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="can-scene__view"
                  aria-label={`View ${item.id} of can`}
                  aria-pressed={view === item.id}
                  disabled={!canSpin}
                  onClick={() => setView(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <span id={helpId} className="sr-only">
            {canSpin ? 'Drag left or right to rotate. Swipe vertically to scroll.' : hint}
          </span>
        </>
      )}
    </div>
  );
}
