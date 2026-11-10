import { useEffect, useRef, useState } from 'react';
import { useSceneStartAllowed } from '../context/SceneStartContext';
import { flavours } from '../data/flavours';

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
      window.clearTimeout(watchdog);
      disposeScene();

      if (attempt < retryDelays.length) {
        retryTimer = window.setTimeout(loadScene, retryDelays[attempt]);
        attempt += 1;
        return;
      }

      cancelled = true;
      stopWatching();
      setStatus('failed');
    }

    function finishRender() {
      if (cancelled) return;
      awaitingFrame = false;
      stopWatching();
      setStatus('ready');
    }

    async function loadScene() {
      armWatchdog(textureTimeout);

      try {
        const { createCanScene } = await import('../three/createCanScene');
        if (cancelled) return;

        const sceneFlavours = allFlavours ? flavours : [flavours[0]];
        const created = createCanScene(hostRef.current, sceneFlavours, {
          onPrepared: () => armWatchdog(firstFrameTimeout),
          onReady: finishRender,
          onError: handleFailure,
        });
        scene = created;

        if (cancelled) {
          disposeScene();
          return;
        }

        const pose = poseRef.current;
        sceneRef.current = created;
        created.setRotation(pose.rotation + pose.spin);
        created.setTilt(pose.tilt);
        created.setFlavourBlend(pose.blend.from, pose.blend.to, pose.blend.amount);
        created.setPointer(...pose.pointer);
      } catch {
        handleFailure();
      }
    }

    document.addEventListener('visibilitychange', rearmWatchdog);
    loadScene();

    return () => {
      cancelled = true;
      window.clearTimeout(retryTimer);
      stopWatching();
      disposeScene();
    };
  }, [allFlavours, hostRef, poseRef, requested, startAllowed]);

  return { sceneRef, status };
}