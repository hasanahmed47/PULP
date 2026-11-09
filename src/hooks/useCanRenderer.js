import { useEffect, useRef, useState } from 'react';
import { useSceneStartAllowed } from '../context/SceneStartContext';
import { flavours } from '../data/flavours';

const firstFrameTimeout = 12000;

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
    let scene;
    let timeout;
    setStatus('loading');

    function watchVisibility() {
      window.clearTimeout(timeout);
      if (document.hidden || !awaitingFrame || cancelled) return;
      timeout = window.setTimeout(fail, firstFrameTimeout);
    }

    function stopReadinessWatch() {
      window.clearTimeout(timeout);
      document.removeEventListener('visibilitychange', watchVisibility);
    }

    function disposeScene() {
      scene?.dispose();
      if (sceneRef.current === scene) sceneRef.current = null;
      scene = null;
    }

    function fail() {
      if (cancelled) return;
      cancelled = true;
      stopReadinessWatch();
      disposeScene();
      setStatus('failed');
    }

    function finishRender() {
      if (cancelled) return;
      awaitingFrame = false;
      stopReadinessWatch();
      setStatus('ready');
    }

    async function loadScene() {
      try {
        const { createCanScene } = await import('../three/createCanScene');
        if (cancelled) return;

        const sceneFlavours = allFlavours ? flavours : [flavours[0]];
        scene = createCanScene(hostRef.current, sceneFlavours, {
          onReady: finishRender,
          onError: fail,
        });

        if (cancelled) {
          disposeScene();
          return;
        }

        const pose = poseRef.current;
        sceneRef.current = scene;
        scene.setRotation(pose.rotation + pose.spin);
        scene.setTilt(pose.tilt);
        scene.setFlavourBlend(pose.blend.from, pose.blend.to, pose.blend.amount);
        scene.setPointer(...pose.pointer);
      } catch {
        fail();
      }
    }

    document.addEventListener('visibilitychange', watchVisibility);
    watchVisibility();
    loadScene();

    return () => {
      cancelled = true;
      stopReadinessWatch();
      disposeScene();
    };
  }, [allFlavours, hostRef, poseRef, requested, startAllowed]);

  return { sceneRef, status };
}