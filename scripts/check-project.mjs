import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const assetPath = (name) => path.join(root, 'public/media', name);
const read = (name) => fs.readFile(path.join(root, name), 'utf8');
const flavours = ['blood-orange', 'passionfruit-yuzu', 'blueberry', 'lime-basil'];

for (const flavour of flavours) {
  for (const type of ['can', 'fruit', 'wrap', 'cutaway']) {
    const name = `${flavour}-${type}.png`;
    const info = await sharp(assetPath(name)).metadata();
    assert(info.width >= 500 && info.height >= 500, `${name} is too small.`);
    if (type !== 'wrap') assert(info.hasAlpha, `${name} needs real transparency.`);
  }
}
const mediaSource = await read('src/data/media.js');
for (const [, name] of mediaSource.matchAll(/asset\('([^']+)'\)/g)) {
  await fs.access(assetPath(name));
}
console.log('PASS: every bundled media path exists; cans, fruits and cutaways have alpha.');

for (const flavour of flavours) {
  const intact = await sharp(assetPath(`${flavour}-can.png`)).metadata();
  const inside = await sharp(assetPath(`${flavour}-cutaway.png`)).metadata();
  assert.equal(intact.width, inside.width, `${flavour}: cutaway width must match the intact image.`);
  assert.equal(intact.height, inside.height, `${flavour}: cutaway height must match the intact image.`);
  const intactAlpha = await sharp(assetPath(`${flavour}-can.png`)).extractChannel('alpha').raw().toBuffer();
  const insideAlpha = await sharp(assetPath(`${flavour}-cutaway.png`)).extractChannel('alpha').raw().toBuffer();
  let totalDifference = 0;
  for (let i = 0; i < intactAlpha.length; i++) totalDifference += Math.abs(intactAlpha[i] - insideAlpha[i]);
  assert(totalDifference / intactAlpha.length < 1, `${flavour}: cutaway silhouette must match the intact image.`);
}
console.log('PASS: all four cutaway dimensions and alpha silhouettes match their intact cans.');

const app = await read('src/App.jsx');
const order = ['Hero', 'GoodInsides', 'HighlightsCarousel', 'Cutaway', 'FlavourRotation', 'FlavourCards', 'PickYourPulp', 'Footer'];
const positions = order.map((section) => app.search(new RegExp(`<${section}\\b`)));
assert(positions.every((position, index) => position >= 0 && (!index || position > positions[index - 1])), 'Section order has changed.');
console.log('PASS: all eight sections are in the required order.');

const sectionFiles = await fs.readdir(path.join(root, 'src/sections'));
const componentFiles = await fs.readdir(path.join(root, 'src/components'));
const sources = await Promise.all([
  ...sectionFiles.filter((file) => file.endsWith('.jsx')).map((file) => read(`src/sections/${file}`)),
  ...componentFiles.filter((file) => file.endsWith('.jsx')).map((file) => read(`src/components/${file}`)),
  Promise.resolve(app),
]);
const combined = sources.join('\n');
const ids = new Set([...combined.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]));
for (const [, target] of combined.matchAll(/href="#([^"]+)"/g)) assert(ids.has(target), `Missing link target: #${target}`);
console.log('PASS: every section navigation link has a destination.');

if (process.argv.includes('--release')) {
  const film = mediaSource.match(/\bfilm:\s*asset\(['"]([^'"]+)['"]\)/)?.[1];
  assert(film, 'Final film not configured. Add your H264 MP4 and set media.film. The included animated illustration is not a native 4K video.');
  await fs.access(assetPath(film));
  const probe = spawnSync('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', assetPath(film)], { encoding: 'utf8' });
  assert.equal(probe.status, 0, 'Install FFmpeg/ffprobe to validate the release video.');
  const info = JSON.parse(probe.stdout);
  const video = info.streams.find((stream) => stream.codec_type === 'video');
  assert.equal(video?.codec_name, 'h264', 'Film must be H264.');
  assert.equal(video?.pix_fmt, 'yuv420p', 'Use yuv420p for browser compatibility.');
  assert.equal(video?.width, 3840, 'Master film must be 3840 pixels wide.');
  assert.equal(video?.height, 2160, 'Master film must be 2160 pixels tall.');
  assert(!info.streams.some((stream) => stream.codec_type === 'audio'), 'Export the film without audio.');
  const duration = Number(info.format.duration);
  assert(duration >= 5 && duration <= 8.5, 'Expected an approximately six-second film.');
  console.log('PASS: configured film is silent 3840×2160 H264/yuv420p. Verify native generation and visual consistency manually.');
} else {
  console.log('PASS: every configured runtime media file exists. Use check:release to validate the film master.');
}
