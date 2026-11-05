import { useEffect, useState } from 'react';

const fallbackTimeout = 4000;

export function useCanFallback(imageRef, source, enabled) {
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    if (!enabled) return;
    const image = imageRef.current;
    let finished = false;
    const timeout = window.setTimeout(handleError, fallbackTimeout);
    setStatus('loading');

    function finish(nextStatus) {
      if (finished) return;
      finished = true;
      window.clearTimeout(timeout);
      setStatus(nextStatus);
    }

    async function handleLoad() {
      try {
        await image.decode();
        finish('ready');
      } catch {
        handleError();
      }
    }

    function handleError() {
      finish('unavailable');
    }

    image.addEventListener('load', handleLoad);
    image.addEventListener('error', handleError);

    if (image.complete) {
      if (image.naturalWidth) handleLoad();
      else handleError();
    }

    return () => {
      finished = true;
      window.clearTimeout(timeout);
      image.removeEventListener('load', handleLoad);
      image.removeEventListener('error', handleError);
    };
  }, [enabled, imageRef, source]);

  return status;
}
