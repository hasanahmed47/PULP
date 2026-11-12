import { readdir, stat} from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const mediaDirectory = path.resolve(process.argv[2] ?? 'public/media');

const sizeLimits = [
  { pattern: /-wrap\.png$/, width: 2048 },
  { pattern: /-cutaway\.png$/, height: 2400 },
  { pattern: /-can\.png$/, height: 1800 },
  { pattern: /-fruit\.png$/, width: 1200 },
];

const webpOptions = { quality: 90, alphaQuality: 95, effort: 5 };

function limitsFor(filename) {
  const match = sizeLimits.find(({ pattern }) => pattern.test(filename));
  return match ?? {};
}

function formatKilobytes(bytes) {
  return `${Math.round(bytes / 1024)} KB`;
}

async function convert(filename) {
  const source = path.join(mediaDirectory, filename);
  const target = source.replace(/\.png$/, '.webp');
  const { width, height } = limitsFor(filename);

  const original = await sharp(source).metadata();
  const output = await sharp(source)
    .resize({ width, height, fit: 'inside', withoutEnlargement: true })
    .webp(webpOptions)
    .toFile(target);

  const [before, after] = await Promise.all([stat(source), stat(target)]);
  const resized = original.width !== output.width || original.height !== output.height;
  console.log(
    `${filename}: ${original.width}x${original.height}${resized ? ` -> ${output.width}x${output.height} (resized)` : ' (same size)'}, `
    + `${formatKilobytes(before.size)} -> ${formatKilobytes(after.size)}`,
  );
  return { before: before.size, after: after.size };
}

const filenames = (await readdir(mediaDirectory)).filter((name) => name.endsWith('.png'));
const totals = { before: 0, after: 0 };

for (const filename of filenames) {
  const result = await convert(filename);
  totals.before += result.before;
  totals.after += result.after;
}

console.log(`Total: ${formatKilobytes(totals.before)} -> ${formatKilobytes(totals.after)}`);
