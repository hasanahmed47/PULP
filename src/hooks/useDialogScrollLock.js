import { useLayoutEffect } from 'react';
import { useScroll } from '../context/ScrollContext';

export function useDialogScrollLock(open) {
  const { lockScroll } = useScroll();

  useLayoutEffect(function synchronizeScrollLock() {
    if (!open) return;
    return lockScroll();
  }, [open, lockScroll]);
}
