import { test, expect } from '@playwright/test';

async function observeSceneStartup(page) {
  await page.addInitScript(() => {
    const contexts = new WeakSet();
    const getContext = HTMLCanvasElement.prototype.getContext;
    window.rotationProbe = { contexts: 0, readyAtExit: null };

    HTMLCanvasElement.prototype.getContext = function (type, ...options) {
      const context = getContext.call(this, type, ...options);
      const isWebGL = type === 'webgl' || type === 'webgl2';
      if (isWebGL && context && !contexts.has(context)) {
        contexts.add(context);
        window.rotationProbe.contexts += 1;
      }
      return context;
    };

    const observer = new MutationObserver(() => {
      const exiting = document.querySelector('.loading-screen[data-exiting="true"]');
      if (!exiting || window.rotationProbe.readyAtExit) return;
      window.rotationProbe.readyAtExit = {
        hero: document.querySelector('.hero .can-scene')?.dataset.ready,
        rotation: document.querySelector('.rotation-section .can-scene')?.dataset.ready,
      };
      observer.disconnect();
    });
    observer.observe(document, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['data-exiting'],
    });
  });
}

async function scrollToPosition(page, top) {
  await page.evaluate((position) => {
    window.scrollTo({ top: position, behavior: 'instant' });
  }, top);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeCloseTo(top, 0);
}

async function readCanvasSize(canvas) {
  return canvas.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    return {
      width: element.width,
      height: element.height,
      displayWidth: bounds.width,
      displayHeight: bounds.height,
    };
  });
}

test('rotation is ready before reveal and stays stable through pinning and flavour navigation', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await observeSceneStartup(page);
  await page.goto('/');
  await expect(page.locator('.loading-screen')).toHaveCount(0, { timeout: 20000 });
  await expect(page.locator('.site-content')).not.toHaveAttribute('inert');

  const startup = await page.evaluate(() => window.rotationProbe);
  expect(startup.readyAtExit).toEqual({ hero: 'true', rotation: 'true' });
  expect(startup.contexts).toBeGreaterThanOrEqual(2);
  await expect(page.locator('.can-scene canvas')).toHaveCount(2);

  const section = page.locator('.rotation-section');
  const canvas = section.locator('canvas');
  const initialSize = await readCanvasSize(canvas);
  const start = await section.evaluate((element) => (
    element.closest('.pin-spacer').getBoundingClientRect().top + window.scrollY
  ));
  const viewport = page.viewportSize();

  await scrollToPosition(page, Math.round(start - viewport.height * 0.3));
  await expect(section).toHaveAttribute('data-visible', 'true');
  await page.screenshot({ path: testInfo.outputPath('rotation-entry.png') });
  await scrollToPosition(page, Math.round(start + 2));
  await expect(section).toHaveCSS('position', 'fixed');
  expect(await readCanvasSize(canvas)).toEqual(initialSize);

  const front = await canvas.screenshot();
  await scrollToPosition(page, Math.round(start + viewport.height * 0.25));
  const turning = await canvas.screenshot();
  expect(front.equals(turning)).toBe(false);

  const flavours = ['blood-orange', 'passionfruit-yuzu', 'blueberry', 'lime-basil'];
  for (const [index, flavour] of flavours.entries()) {
    const dot = section.locator(`.flavour-dot[data-flavour="${flavour}"]`);
    await dot.click();
    await expect(section).toHaveAttribute('data-flavour', flavour);
    await expect(dot).toHaveAttribute('aria-pressed', 'true');
    const destination = start + viewport.height * index;
    await expect.poll(() => page.evaluate((top) => (
      Math.abs(window.scrollY - top)
    ), destination)).toBeLessThanOrEqual(2);
    expect(await readCanvasSize(canvas)).toEqual(initialSize);
  }

  expect(await page.evaluate(() => window.rotationProbe.contexts)).toBe(startup.contexts);
  expect(await page.evaluate(() => (
    document.documentElement.scrollWidth - document.documentElement.clientWidth
  ))).toBeLessThanOrEqual(1);
  await page.screenshot({ path: testInfo.outputPath('rotation-lime-basil.png') });
  expect(errors).toEqual([]);
});
