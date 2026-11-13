import { useEffect, useRef, useState } from 'react';
import { useSceneStartAllowed } from '../context/SceneStartContext';
import { flavours } from '../data/flavours';
import { loadCanSceneModule } from '../three/loadCanScene';

const textureTimeout = 60000;
const firstFrameTimeout = 12000;
const retryDelays = [1000, 2500];

export function useCanRenderer(hostRef, poseRef, { allFlavours, interactive, preload, visible }) {
  const sceneRef = useRef(null);
  const [requested, setRequested] = useState(interactive || preload);
  const [status, setStatus] = useState('loading');
  const startAllowed = useSceneStartAllowed();

  useEffect(() => {
    const needsFirstFrame = status === 'loading';
    sceneRef.current?.setVisible(visible || needsFirstFrame);
    if (visible || interactive || preload) setRequested(true);
  }, [interactive, preload, status, visible]);

  useEffect(() => {
    if (!requested || !startAllowed) return;
    let cancelled = false;
    let awaitingFrame = true;
    let attempt = 0;
    let generation = 0;
    let watchdogDelay = textureTimeout;
    let scene;
    let watchdog;
    let retryTimer;
    setStatus('loading');

    function armWatchdog(delay) {
      watchdogDelay = delay;
      window.clearTimeout(watchdog);
      if (document.hidden || !awaitingFrame || cancelled) return;
      watchdog = window.setTimeout(handleFailure, watchdogDelay);
    }

    function rearmWatchdog() {
      armWatchdog(watchdogDelay);
    }

    function stopWatching() {
      window.clearTimeout(watchdog);
      document.removeEventListener('visibilitychange', rearmWatchdog);
    }

    function disposeScene() {
      scene?.dispose();
      if (sceneRef.current === scene) sceneRef.current = null;
      scene = null;
    }

    function handleFailure() {
      if (cancelled) return;
      generation += 1;
      stopWatching();
      window.clearTimeout(retryTimer);
      disposeScene();

      if (attempt < retryDelays.length) {
        setStatus('loading');
        retryTimer = window.setTimeout(loadScene, retryDelays[attempt]);
        attempt += 1;
        return;
      }

      cancelled = true;
      setStatus('failed');
    }

    function finishRender() {
      if (cancelled) return;
      awaitingFrame = false;
      stopWatching();
      setStatus('ready');
    }

    async function loadScene() {
      const currentGeneration = ++generation;
      awaitingFrame = true;
      document.addEventListener('visibilitychange', rearmWatchdog);
      armWatchdog(textureTimeout);

      function isCurrentAttempt() {
        return !cancelled && generation === currentGeneration;
      }

      try {
        const { createCanScene } = await loadCanSceneModule();
        if (!isCurrentAttempt()) return;

        const sceneFlavours = allFlavours ? flavours : [flavours[0]];
        const created = createCanScene(hostRef.current, sceneFlavours, {
          onPrepared: () => {
            if (isCurrentAttempt()) armWatchdog(firstFrameTimeout);
          },
          onReady: () => {
            if (isCurrentAttempt()) finishRender();
          },
          onError: () => {
            if (isCurrentAttempt()) handleFailure();
          },
        });

        if (!isCurrentAttempt()) {
          created.dispose();
          return;
        }

        const pose = poseRef.current;
        scene = created;
        sceneRef.current = created;
        created.setRotation(pose.rotation + pose.spin);
        created.setTilt(pose.tilt);
        created.setFlavourBlend(pose.blend.from, pose.blend.to, pose.blend.amount);
        created.setPointer(...pose.pointer);
      } catch {
        if (isCurrentAttempt()) handleFailure();
      }
    }

    loadScene();

    return () => {
      cancelled = true;
      generation += 1;
      window.clearTimeout(retryTimer);
      stopWatching();
      disposeScene();
    };
  }, [allFlavours, hostRef, poseRef, requested, startAllowed]);

  return { sceneRef, status };
}
