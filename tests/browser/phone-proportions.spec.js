import { test, expect } from '@playwright/test';

test.use({ isMobile: true, hasTouch: true });

const phoneSizes = [[320, 568], [360, 640], [375, 667], [375, 700], [375, 701], [390, 844], [412, 732], [414, 736], [412, 915], [430, 932]];

test('phone layouts keep the can prominent and touch targets separate', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Run the phone matrix once.');
  test.setTimeout(180000);
  const measurements = [];
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));

  for (const [width, height] of phoneSizes) {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await expect(page.locator('.loading-screen')).toHaveCount(0, { timeout: 25000 });
    const scene = page.locator('.hero .can-scene');
    await expect(scene).toHaveAttribute('data-ready', 'true', { timeout: 30000 });
    await expect(scene).toHaveAttribute('data-drop', 'landed');
    const geometry = await page.evaluate(() => {
      const bounds = (selector) => document.querySelector(selector).getBoundingClientRect().toJSON();
      const canvas = document.querySelector('.hero canvas');
      const context = canvas.getContext('webgl2');
      const pixels = new Uint8Array(canvas.width * canvas.height * 4);
      context.readPixels(0, 0, canvas.width, canvas.height, context.RGBA, context.UNSIGNED_BYTE, pixels);
      let bottom = canvas.height;
      let top = 0;
      for (let y = 0; y < canvas.height; y += 1) {
        for (let x = 0; x < canvas.width; x += 1) {
          if (pixels[(y * canvas.width + x) * 4 + 3] < 240) continue;
          bottom = Math.min(bottom, y);
          top = Math.max(top, y);
        }
      }
      return {
        canHeight: (top - bottom) / canvas.height * canvas.getBoundingClientRect().height,
        title: bounds('.hero-title'), picker: bounds('.hero-flavour-picker'),
        bottom: bounds('.hero-bottom'), hero: bounds('.hero'),
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });
    measurements.push({ width, height, ...geometry });
    const label = `${width}x${height}`;
    expect(geometry.canHeight / geometry.title.height, label).toBeGreaterThan(1.8);
    expect(geometry.canHeight / geometry.title.height, label).toBeLessThan(3.2);
    expect(geometry.picker.bottom, label).toBeLessThanOrEqual(geometry.bottom.top);
    expect(geometry.bottom.bottom, label).toBeLessThanOrEqual(geometry.hero.bottom);
    expect(geometry.overflow, label).toBeLessThanOrEqual(1);
    await page.screenshot({ path: testInfo.outputPath(`${label}.png`) });
  }

  const before = measurements.find(({ height }) => height === 700);
  const after = measurements.find(({ height }) => height === 701);
  expect(Math.abs(after.canHeight - before.canHeight)).toBeLessThan(2);
  expect(Math.abs(after.title.height - before.title.height)).toBeLessThan(1);
  expect(errors).toEqual([]);
  await testInfo.attach('phone-measurements', { body: JSON.stringify(measurements, null, 2), contentType: 'application/json' });
});
