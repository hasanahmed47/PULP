import { join } from 'node:path';
import { cwd } from 'node:process';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { media } from './media';

const canvasRatio = 3 / 5;

function readImageMetadata(url) {
  const relativePath = url.slice(import.meta.env.BASE_URL.length);
  return sharp(join(cwd(), 'public', relativePath)).metadata();
}

describe('interior pictures', () => {
  it.each(Object.entries(media.cutaways))(
    '%s cutaway uses a 3:5 canvas',
    async (flavourId, url) => {
      const { width, height } = await readImageMetadata(url);

      expect(width / height, `${flavourId} cutaway canvas ratio`).toBeCloseTo(canvasRatio, 2);
    },
  );
});
