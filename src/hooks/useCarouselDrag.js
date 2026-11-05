import { useCallback, useRef } from 'react';

const SWIPE_THRESHOLD_PX = 50;
const DRAG_ACTIVATION_DISTANCE_PX = 10;

export function useCarouselDrag(index, chooseSlide) {
  const drag = useRef(null);

  const startDrag = useCallback(function startDrag(event) {
    if (!event.isPrimary || event.button !== 0) return;
    drag.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      active: true,
      moved: false,
    };
  }, []);

  const moveDrag = useCallback(function moveDrag(event) {
    const gesture = drag.current;
    if (!gesture?.active || gesture.pointerId !== event.pointerId) return;
    if (event.buttons === 0) {
      gesture.active = false;
      return;
    }
    const horizontalDistance = Math.abs(event.clientX - gesture.x);
    const verticalDistance = Math.abs(event.clientY - gesture.y);
    if (horizontalDistance < DRAG_ACTIVATION_DISTANCE_PX || horizontalDistance < verticalDistance) return;
    gesture.moved = true;
    event.currentTarget.setPointerCapture(event.pointerId);
  }, []);

  const endDrag = useCallback(function endDrag(event) {
    const gesture = drag.current;
    if (!gesture?.active || gesture.pointerId !== event.pointerId) return;
    gesture.active = false;
    const distance = event.clientX - gesture.x;
    if (gesture.moved && Math.abs(distance) > SWIPE_THRESHOLD_PX) {
      chooseSlide(index + (distance < 0 ? 1 : -1));
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, [index, chooseSlide]);

  const cancelDrag = useCallback(function cancelDrag(event) {
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);

  const hasDragged = useCallback(function hasDragged() {
    return Boolean(drag.current?.moved);
  }, []);

  return { startDrag, moveDrag, endDrag, cancelDrag, hasDragged };
}
