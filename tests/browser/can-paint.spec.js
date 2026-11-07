import { test, expect } from '@playwright/test';

async function waitForPaint(page) {
  await page.evaluate(async () => {
    for (let frame = 0; frame < 4; frame += 1) {
      await new Promise(requestAnimationFrame);
    }
  });
}

async function expectRetainedCan(canvas) {
  const alpha = await canvas.evaluate((element) => {
    const context = element.getContext('webgl2');
    const pixel = new Uint8Array(4);
    const x = Math.floor(element.width / 2);
    const y = Math.floor(element.height / 2);
    context.readPixels(x, y, 1, 1, context.RGBA, context.UNSIGNED_BYTE, pixel);
    return pixel[3];
  });
  expect(alpha, 'The idle canvas must retain the opaque centre of the can').toBe(255);
}

test('can frames survive idle pin transitions and offscreen resizing', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('.loading-screen')).toHaveCount(0, { timeout: 25000 });
  const viewport = page.viewportSize();

  for (const selector of ['.hero', '.rotation-section']) {
    const section = page.locator(selector);
    const canvas = section.locator('canvas');
    const range = await section.evaluate((element) => {
      const spacer = element.closest('.pin-spacer');
      const start = spacer.getBoundingClientRect().top + window.scrollY;
      return { start, end: start + spacer.offsetHeight - element.offsetHeight };
    });
    const boundary = selector === '.hero' ? range.end : range.start;

    for (const offset of [-100, -2, 2, 100, 2, -2]) {
      await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), boundary + offset);
      await waitForPaint(page);
      await expectRetainedCan(canvas);
    }

    await page.screenshot({ path: testInfo.outputPath(`${selector.slice(1)}-boundary.png`) });
    await page.locator('.site-footer').scrollIntoViewIfNeeded();
    await waitForPaint(page);
    const beforeResize = await canvas.evaluate((element) => [element.width, element.height]);
    await page.setViewportSize({ width: viewport.width + 3, height: viewport.height + 3 });
    await waitForPaint(page);
    expect(await canvas.evaluate((element) => [element.width, element.height])).toEqual(beforeResize);
    await expectRetainedCan(canvas);

    await page.setViewportSize(viewport);
    await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), boundary + 2);
    await waitForPaint(page);
    await expectRetainedCan(canvas);
  }

  expect(errors).toEqual([]);
});
