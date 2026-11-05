import { useEffect, useRef, useState } from 'react';

const fullTurn = Math.PI * 2;
const dragThreshold = 6;

function releasePointer(gesture) {
  if (!gesture?.element.hasPointerCapture(gesture.pointerId)) return;
  gesture.element.releasePointerCapture(gesture.pointerId);
}

function normalizeRotation(rotation) {
  return ((rotation % fullTurn) + fullTurn) % fullTurn;
}

export function useCanSpin(onRotate, enabled) {
  const rotationRef = useRef(0);
  const gestureRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!enabled) setDragging(false);

    return () => {
      const gesture = gestureRef.current;
      gestureRef.current = null;
      releasePointer(gesture);
    };
  }, [enabled]);

  function rotateTo(rotation) {
    const next = normalizeRotation(rotation);
    rotationRef.current = next;
    onRotate(next);
  }

  function startDrag(event) {
    if (!enabled || !event.isPrimary || event.button !== 0) return;
    if (event.target.closest('button')) return;
    const width = event.currentTarget.getBoundingClientRect().width;
    if (!width) return;

    gestureRef.current = {
      element: event.currentTarget,
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      rotation: rotationRef.current,
      width,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function endDrag(event) {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    gestureRef.current = null;
    setDragging(false);
    releasePointer(gesture);
  }

  function moveDrag(event) {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;

    if (!enabled) {
      endDrag(event);
      return;
    }
    const distanceX = event.clientX - gesture.x;
    const distanceY = event.clientY - gesture.y;
    if (!gesture.moved && Math.hypot(distanceX, distanceY) < dragThreshold) return;

    const isVerticalTouch = event.pointerType === 'touch' && Math.abs(distanceY) > Math.abs(distanceX);
    if (!gesture.moved && isVerticalTouch) {
      endDrag(event);
      return;
    }

    if (!gesture.moved) {
      gesture.moved = true;
      setDragging(true);
    }

    rotateTo(gesture.rotation + distanceX / gesture.width * fullTurn);
  }

  return {
    dragging,
    handlers: {
      onPointerDown: startDrag,
      onPointerMove: moveDrag,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
      onLostPointerCapture: endDrag,
    },
  };
}
