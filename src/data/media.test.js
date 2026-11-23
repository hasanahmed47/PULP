import { join } from 'node:path';
import { readFile } from 'node:fs/promises';
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

describe('video delivery', () => {
  it.each([
    ['brand film', media.film],
    ['desktop highlight', media.firstTileDesktopFilm],
    ['mobile highlight', media.firstTileMobileFilm],
    ['lifestyle highlight', media.lifestyleFilm],
  ])('%s places playback metadata before video data', async (name, url) => {
    const relativePath = url.slice(import.meta.env.BASE_URL.length);
    const file = await readFile(join(cwd(), 'public', relativePath));
    const boxes = [];

    for (let offset = 0; offset < file.length;) {
      expect(offset + 8, `${name}: complete box header`).toBeLessThanOrEqual(file.length);
      let size = file.readUInt32BE(offset);
      let headerSize = 8;
      if (size === 1) {
        headerSize = 16;
        expect(offset + headerSize, `${name}: extended box header`).toBeLessThanOrEqual(file.length);
        size = Number(file.readBigUInt64BE(offset + 8));
        expect(Number.isSafeInteger(size), `${name}: supported box size`).toBe(true);
      } else if (size === 0) {
        size = file.length - offset;
      }
      expect(size, `${name}: valid MP4 box size`).toBeGreaterThanOrEqual(headerSize);
      expect(offset + size, `${name}: complete box payload`).toBeLessThanOrEqual(file.length);
      boxes.push(file.toString('ascii', offset + 4, offset + 8));
      offset += size;
    }

    expect(boxes[0]).toBe('ftyp');
    expect(boxes.filter(type => type === 'moov')).toHaveLength(1);
    expect(boxes).toContain('mdat');
    expect(boxes.indexOf('moov')).toBeLessThan(boxes.indexOf('mdat'));
  });
});
