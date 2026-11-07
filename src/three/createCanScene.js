import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createCanModel } from './createCanModel';
import { media } from '../data/media';
import { clampBlend } from '../lib/flavourBlend';

function configureRenderer(renderer, host) {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.setClearColor(0xffffff, 0);
  renderer.domElement.setAttribute('aria-hidden', 'true');
  host.append(renderer.domElement);
}

function createEnvironment(renderer) {
  const generator = new THREE.PMREMGenerator(renderer);
  let room;

  try {
    room = new RoomEnvironment();
    return generator.fromScene(room, 0.04);
  } finally {
    room?.dispose();
    generator.dispose();
  }
}

function createCamera() {
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 30);
  camera.position.set(0, 0.45, 7.3);
  camera.lookAt(0, -0.04, 0);
  return camera;
}

function addLights(scene) {
  const ambientLight = new THREE.HemisphereLight(0xffffff, 0xeee6db, 2.2);
  const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
  keyLight.position.set(-3, 5, 5);

  const fillLight = new THREE.DirectionalLight(0xffffff, 1.8);
  fillLight.position.set(4, 1, 3);

  scene.add(ambientLight, keyLight, fillLight);
  return keyLight;
}

function createShadow(track) {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;

  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D context is unavailable.');

  const gradient = context.createRadialGradient(64, 64, 3, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(30,20,10,.24)');
  gradient.addColorStop(1, 'rgba(30,20,10,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);

  const texture = track(new THREE.CanvasTexture(canvas));
  const material = track(new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
  }));
  const geometry = track(new THREE.PlaneGeometry(2.7, 1.5));
  const shadow = new THREE.Mesh(geometry, material);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -1.82;
  return shadow;
}

export function createCanScene(host, flavours, { onReady, onError }) {
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    preserveDrawingBuffer: true,
    powerPreference: 'low-power',
  });
  const resources = new Set();
  let disposed = false;
  let frame = 0;
  let resizeObserver;
  let requestRender;

  function track(resource) {
    resources.add(resource);
    return resource;
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frame);
    resizeObserver?.disconnect();
    document.removeEventListener('visibilitychange', requestRender);
    renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);

    for (const resource of resources) resource.dispose();
    resources.clear();
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
  }

  function fail(error) {
    if (disposed) return;
    dispose();
    onError(error);
  }

  function handleContextLost(event) {
    event.preventDefault();
    fail(new Error('WebGL context was lost.'));
  }

  try {
    configureRenderer(renderer, host);
    const scene = new THREE.Scene();
    const camera = createCamera();
    const environment = track(createEnvironment(renderer));
    scene.environment = environment.texture;

    const keyLight = addLights(scene);
    const model = createCanModel(track);
    scene.add(model.group, createShadow(track));

    let visible = true;
    let prepared = false;
    let ready = false;
    let width = 0;
    let height = 0;
    const renderedSize = new THREE.Vector2();
    let blend = { from: 0, to: 0, amount: 0 };
    const textures = [];
    const lastFlavour = flavours.length - 1;

    function render() {
      frame = 0;
      if (disposed || !prepared || !visible || document.hidden) return;
      if (!width || !height) return;

      try {
        renderer.getSize(renderedSize);
        if (renderedSize.x !== width || renderedSize.y !== height) {
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          renderer.setSize(width, height, false);
        }
        renderer.render(scene, camera);
      } catch (error) {
        fail(error);
        return;
      }

      if (!ready) {
        ready = true;
        onReady();
      }
    }

    requestRender = function invalidate() {
      if (frame || disposed || !prepared || !visible || document.hidden) return;
      frame = requestAnimationFrame(render);
    };

    function applyFlavourBlend() {
      const { from, to, amount } = blend;
      model.setFlavour(flavours[from], flavours[to], textures[from], textures[to], amount);
      requestRender();
    }

    function setFlavourBlend(from, to, amount) {
      if (disposed) return;
      blend = clampBlend({ from, to, amount }, lastFlavour);
      applyFlavourBlend();
    }

    async function prepareScene() {
      const loader = new THREE.TextureLoader();

      async function loadTexture(source) {
        const texture = await loader.loadAsync(source);
        if (disposed) {
          texture.dispose();
          return null;
        }

        track(texture);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
        renderer.initTexture(texture);
        return texture;
      }

      const endTextures = Object.entries(media.canDetails).map(async ([side, source]) => {
        const texture = await loadTexture(source);
        if (texture && !disposed) model.setEndTexture(side, texture);
      });
      const flavourTextures = flavours.map(async (flavour, index) => {
        const texture = await loadTexture(flavour.texture);
        if (texture && !disposed) textures[index] = texture;
      });

      await Promise.all([...endTextures, ...flavourTextures]);
      if (disposed) return;
      applyFlavourBlend();
      prepared = true;
      requestRender();
    }

    function resize() {
      if (disposed) return;
      const nextWidth = host.clientWidth;
      const nextHeight = host.clientHeight;
      if (!nextWidth || !nextHeight) return;
      if (nextWidth === width && nextHeight === height) return;

      width = nextWidth;
      height = nextHeight;
      requestRender();
    }

    function setRotation(rotation) {
      model.group.rotation.y = rotation;
      requestRender();
    }

    function setTilt(tilt) {
      model.group.rotation.x = tilt;
      requestRender();
    }

    function setPointer(x, y) {
      keyLight.position.set(-3 + x * 2, 5 - y, 5);
      requestRender();
    }

    function setVisible(value) {
      visible = value;
      if (!value && frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
      requestRender();
    }

    prepareScene().catch(fail);
    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
    document.addEventListener('visibilitychange', requestRender);

    return { setFlavourBlend, setRotation, setTilt, setPointer, setVisible, dispose };
  } catch (error) {
    dispose();
    throw error;
  }
}
