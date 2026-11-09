import { useCallback, useEffect, useRef, useState } from 'react';
import '../styles/LoadingScreen.css'

const exitTimeout = 1200;

export function LoadingScreen({ progress, ready, onComplete }) {
  const [exiting, setExiting] = useState(false);
  const completedRef = useRef(false);
  const percentage = Math.max(0, Math.min(100, Math.round(progress)));

  const complete = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    if (!ready) return;
    let exitFrame;
    const paintFrame = requestAnimationFrame(() => {
      exitFrame = requestAnimationFrame(() => setExiting(true));
    });
    return () => {
      cancelAnimationFrame(paintFrame);
      cancelAnimationFrame(exitFrame);
    };
  }, [ready]);

  useEffect(() => {
    if (!exiting) return;
    const timeout = window.setTimeout(complete, exitTimeout);
    return () => window.clearTimeout(timeout);
  }, [complete, exiting]);

  function finishExit(event) {
    if (event.target !== event.currentTarget || !exiting) return;
    if (event.propertyName !== 'transform' && event.propertyName !== 'opacity') return;
    complete();
  }

  return (
    <div
      className="loading-screen"
      data-exiting={exiting}
      onTransitionEnd={finishExit}
    >
      <div className="loading-screen__top" aria-hidden="true">
        <span>THE FRUITY COLLECTION</span>
        <span>
          SMALL CAN.<br />
          BIG FRUIT ENERGY.
        </span>
      </div>
      <div className="loading-screen__art" aria-hidden="true">
        <span className="loading-screen__citrus" />
        <div className="wordmark loading-screen__wordmark">
          PULP<span>®</span>
        </div>
        <p>FOUR FLAVOURS. ONE GOOD TIME.</p>
      </div>
      <div className="loading-screen__bottom">
        <div className="loading-screen__meta">
          <div className="loading-screen__palette" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </div>
          <p role="status">
            {ready ? 'Your fruity mood is ready.' : 'Loading a little fruit energy.'}
          </p>
        </div>
        <span className="loading-screen__number" aria-hidden="true">
          {String(percentage).padStart(2, '0')}<span>%</span>
        </span>
        <progress
          className="loading-screen__progress"
          value={percentage}
          max="100"
          aria-label="Loading PULP"
        />
      </div>
    </div>
  );
}
