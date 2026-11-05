import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'public/media');
const origin = process.env.PULP_PREVIEW_URL || 'http://127.0.0.1:5173';
const browserOptions = { headless: true };
if (process.env.PULP_CHROME_PATH) browserOptions.executablePath = process.env.PULP_CHROME_PATH;

function createInterior(fruit) {
  const ice = [...Array(7).keys()].map((index) => {
    const x = 820 + index % 3 * 145;
    const y = 170 + Math.floor(index / 3) * 190;
    return `<rect x="${x}" y="${y}" width="180" height="170" rx="28" fill="white" fill-opacity=".65" stroke="#c0dbde" stroke-width="8" transform="rotate(${index % 2 ? 14 : -12} ${x + 90} ${y + 85})"/>`;
  }).join('');
  const pulp = [...Array(36).keys()].map((index) => `<ellipse cx="${740 + index * 73 % 600}" cy="${800 + index * 109 % 610}" rx="5" ry="12" fill="#ffc56d"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="2048" height="1424"><rect width="2048" height="1424" fill="#e0edf0"/><path d="M0 680Q256 630 512 680T1024 680T1536 680T2048 680V1424H0Z" fill="#ee772b"/>${ice}${pulp}<image href="data:image/webp;base64,${fruit}" x="810" y="780" width="450" height="450"/></svg>`;
}

const fruit = await fs.readFile(path.join(output, 'blood-orange-fruit.webp'), 'base64');
const interior = `data:image/svg+xml;base64,${Buffer.from(createInterior(fruit)).toString('base64')}`;
const browser = await chromium.launch(browserOptions);

try {
  const page = await browser.newPage();
  await page.goto(`${origin}/media/blood-orange-wrap.webp`);
  const images = await page.evaluate(async (interiorSource) => {
    const THREE = await import('/node_modules/.vite/deps/three.js');
    const { RoomEnvironment } = await import('/node_modules/three/examples/jsm/environments/RoomEnvironment.js');
    const { createCanModel } = await import('/src/three/createCanModel.js');
    const { flavours } = await import('/src/data/flavours.js');
    const { media } = await import('/src/data/media.js');
    const resources = new Set();
    const track = (resource) => { resources.add(resource); return resource; };
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(900, 1500, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.setClearColor(0xffffff, 0);
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1.14, 1.14, 1.9, -1.9, 0.1, 30);
    camera.position.set(0, 0.45, 7.3);
    camera.lookAt(0, 0, 0);
    const generator = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const environment = track(generator.fromScene(room, 0.04));
    room.dispose();
    generator.dispose();
    scene.environment = environment.texture;
    const key = new THREE.DirectionalLight(0xffffff, 3.2);
    key.position.set(-3, 5, 5);
    const fill = new THREE.DirectionalLight(0xffffff, 1.8);
    fill.position.set(4, 1, 3);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xeee6db, 2.2), key, fill);
    const flavour = flavours[0];
    const model = createCanModel(track);
    model.group.rotation.z = 0;
    scene.add(model.group);
    const loader = new THREE.TextureLoader();

    async function loadTexture(source) {
      const texture = track(await loader.loadAsync(source));
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      return texture;
    }

    function capture() {
      renderer.render(scene, camera);
      return renderer.domElement.toDataURL('image/png').split(',')[1];
    }

    try {
      const [wrap, top, bottom, inside] = await Promise.all([
        loadTexture(flavour.texture), loadTexture(media.canDetails.top),
        loadTexture(media.canDetails.bottom), loadTexture(interiorSource),
      ]);
      model.setEndTexture('top', top);
      model.setEndTexture('bottom', bottom);
      model.setFlavour(flavour, flavour, wrap, wrap, 0);
      const can = capture();
      model.setFlavour(flavour, flavour, inside, inside, 0);
      return { can, cutaway: capture() };
    } finally {
      for (const resource of resources) resource.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    }
  }, interior);

  for (const [name, data] of Object.entries(images)) {
    await sharp(Buffer.from(data, 'base64')).webp({ quality: 94, alphaQuality: 100 }).toFile(path.join(output, `blood-orange-${name}.webp`));
  }
  console.log('Exported matching Blood Orange can and interior from the current 3D model.');
} finally {
  await browser.close();
}
