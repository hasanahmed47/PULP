import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { media } from './media';

const canvasRatio = 3 / 5;

function readWebpSize(buffer) {
  const format = buffer.toString('ascii', 12, 16);

  if (format === 'VP8X') {
    return { width: 1 + buffer.readUIntLE(24, 3), height: 1 + buffer.readUIntLE(27, 3) };
  }

  if (format === 'VP8L') {
    const bits = buffer.readUInt32LE(21);
    return { width: 1 + (bits & 0x3fff), height: 1 + ((bits >> 14) & 0x3fff) };
  }

  if (format === 'VP8 ') {
    return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff };
  }

  throw new Error(`Unsupported WebP format "${format}".`);
}

function readPublicFile(url) {
  const relativePath = url.slice(import.meta.env.BASE_URL.length);
  return readFileSync(join(process.cwd(), 'public', relativePath));
}

describe('interior pictures', () => {
  it.each(Object.entries(media.cutaways))(
    '%s cutaway is drawn on the same 3:5 canvas as its can',
    (flavourId, url) => {
      const { width, height } = readWebpSize(readPublicFile(url));

      expect(width / height).toBeCloseTo(canvasRatio, 2);
    },
  );
});