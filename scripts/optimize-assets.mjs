import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'public/media/source');
const destination = path.join(root, 'public/media');
await fs.mkdir(source, { recursive: true });
const files = (await fs.readdir(source)).filter((name) => /\.(png|jpe?g|tiff?|webp)$/i.test(name));

if (!files.length) {
  console.log('Add your images to public/media/source first. Use the filenames in ASSET_PROMPTS.md.');
  process.exit(0);
}

function outputWidth(stem) {
  if (stem.endsWith('-wrap')) return 2048;
  if (stem === 'pour-poster') return 1920;
  if (stem.includes('fruit')) return 800;
  return 1200;
}

for (const filename of files) {
  const stem = path.parse(filename).name;
  const width = outputWidth(stem);
  const output = path.join(destination, `${stem}.webp`);
  await sharp(path.join(source, filename))
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 90, alphaQuality: 100 })
    .toFile(output);
  console.log(`Optimized ${filename} → ${path.relative(root, output)}`);
}
