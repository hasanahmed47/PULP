import { test, expect } from '@playwright/test';

async function expectSharedStage(page) {
  const scene = page.locator('.hero .can-scene');
  await expect(scene.locator('.can-scene__stage')).toHaveCSS('position', 'relative');
  await expect.poll(() => scene.evaluate((element) => {
    const bounds = element.querySelector('.can-scene__stage').getBoundingClientRect();
    const errors = [];
    if (bounds.width <= 0 || bounds.height <= 100) errors.push('stage collapsed');

    for (const selector of ['.can-scene__canvas', '.can-splash--back', '.can-splash--front']) {
      const layer = element.querySelector(selector).getBoundingClientRect();
      for (const axis of ['x', 'y', 'width', 'height']) {
        if (Math.abs(layer[axis] - bounds[axis]) > 1) errors.push(`${selector} ${axis}`);
      }
    }

    const ground = element.querySelector('.can-splash--back .can-splash__ground').getBoundingClientRect();
    if (Math.abs(ground.x - bounds.x - bounds.width / 2) > 1) errors.push('ground x');
    if (Math.abs(ground.y - bounds.y - bounds.height * 0.86) > 1) errors.push('ground y');
    const controls = element.querySelector('.can-scene__controls').getBoundingClientRect();
    if (bounds.bottom > controls.top + 1) errors.push('controls overlap');
    return errors;
  })).toEqual([]);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

test('can and splash share bounds through replay, resizing and larger text', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('.site-content')).toHaveAttribute('aria-hidden', 'false', { timeout: 25000 });
  await expect(page.locator('.loading-screen')).toHaveCount(0, { timeout: 25000 });
  const scene = page.locator('.hero .can-scene');
  await expect(scene).toHaveAttribute('data-ready', 'true', { timeout: 30000 });
  await expect(scene).toHaveAttribute('data-drop', 'landed');
  await expectSharedStage(page);
  const coverage = await scene.locator('canvas').evaluate((canvas) => {
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
    return { height: (top - bottom) / canvas.height, ground: 1 - bottom / canvas.height };
  });
  expect(coverage.height).toBeGreaterThan(0.7);
  expect(coverage.height).toBeLessThan(0.85);
  expect(Math.abs(coverage.ground - 0.86)).toBeLessThan(0.04);
  await page.screenshot({ path: testInfo.outputPath('hero.png') });

  const replay = page.getByRole('button', { name: 'Replay can drop' });
  await replay.filter({ visible: true }).click();
  await expect(scene).toHaveAttribute('data-drop', 'playing');
  await scene.evaluate((element) => {
    for (const animation of element.getAnimations({ subtree: true })) {
      animation.pause();
      animation.currentTime = 700;
    }
  });
  await page.screenshot({ path: testInfo.outputPath('hero-splash.png') });
  await scene.evaluate((element) => {
    for (const animation of element.getAnimations({ subtree: true })) animation.play();
  });
  await expect(scene).toHaveAttribute('data-drop', 'landed');
  await expectSharedStage(page);

  const viewport = page.viewportSize();
  await page.setViewportSize({ width: viewport.width, height: viewport.height - 100 });
  await expectSharedStage(page);
  await page.screenshot({ path: testInfo.outputPath('hero-short.png') });

  await page.setViewportSize(viewport);
  await page.addStyleTag({ content: 'html { font-size: 125%; }' });
  await expectSharedStage(page);
  await page.screenshot({ path: testInfo.outputPath('hero-large-text.png') });
  expect(errors).toEqual([]);
});
