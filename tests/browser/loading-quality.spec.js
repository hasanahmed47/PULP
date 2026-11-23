import { test, expect } from '@playwright/test';

async function openRotation(page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('.loading-screen')).toHaveCount(0, { timeout: 25000 });
  const section = page.locator('.rotation-section');
  await section.scrollIntoViewIfNeeded();
  await expect(section.locator('.can-scene')).toHaveAttribute('data-ready', 'true', { timeout: 30000 });
  return section;
}

test('selected textures bypass stalled idle loads and show the matching fallback', async ({ page }, testInfo) => {
  const yuzu = Promise.withResolvers();
  const lime = Promise.withResolvers();
  let yuzuRequested = false;
  let limeRequests = 0;
  await page.route('**/passionfruit-yuzu-wrap.webp', async (route) => {
    yuzuRequested = true;
    await yuzu.promise;
    await route.continue();
  });
  await page.route('**/lime-basil-wrap.webp', async (route) => {
    limeRequests += 1;
    await lime.promise;
    await route.continue();
  });

  try {
    const section = await openRotation(page);
    const scene = section.locator('.can-scene');
    await expect.poll(() => yuzuRequested).toBe(true);
    await section.getByRole('button', { name: 'Show Lime Basil' }).click();
    await expect.poll(() => limeRequests).toBe(1);
    await expect(scene).toHaveAttribute('data-ready', 'false');
    await expect(scene.locator('.can-scene__canvas')).toBeHidden();
    await expect(scene.locator('.can-scene__fallback')).toHaveAttribute('src', /lime-basil-can.webp$/);
    await expect.poll(() => scene.locator('img').evaluate((image) => image.complete && image.naturalWidth > 0)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath('selected-texture-pending.png') });

    await section.locator('.flavour-dot').first().click();
    await expect(scene).toHaveAttribute('data-ready', 'true');
    await section.locator('.flavour-dot').last().click();
    await expect(scene).toHaveAttribute('data-ready', 'false');
    lime.resolve();
    await expect(scene).toHaveAttribute('data-ready', 'true', { timeout: 15000 });
    expect(limeRequests).toBe(1);
    await expect(scene.locator('.can-scene__fallback')).toHaveCount(0);
    const painted = await scene.locator('canvas').screenshot();
    const yuzuResponse = page.waitForResponse('**/passionfruit-yuzu-wrap.webp');
    yuzu.resolve();
    await yuzuResponse;
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    expect(await scene.locator('canvas').screenshot()).toEqual(painted);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    await page.screenshot({ path: testInfo.outputPath('selected-texture-ready.png') });
  } finally {
    yuzu.resolve();
    lime.resolve();
  }
});

test('a failed optional texture keeps the selected fallback and other flavours usable', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('**/blueberry-wrap.webp', (route) => route.abort());
  const section = await openRotation(page);
  const scene = section.locator('.can-scene');
  await section.locator('.flavour-dot').nth(2).click();
  await expect(scene).toHaveAttribute('data-ready', 'false');
  await expect(scene.locator('.can-scene__fallback')).toHaveAttribute('src', /blueberry-can.webp$/);
  await expect(scene.locator('.can-scene__fallback')).toBeVisible();
  await expect(scene).toHaveAttribute('aria-busy', 'false');
  await section.locator('.flavour-dot').first().click();
  await expect(scene).toHaveAttribute('data-ready', 'true');
  expect(errors).toEqual([]);
});

test('highlights request only the selected clip and keep adjacent posters visible', async ({ page }, testInfo) => {
  const videosRequested = new Set();
  page.on('request', (request) => {
    const path = new URL(request.url()).pathname;
    if (path.endsWith('.mp4')) videosRequested.add(path);
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('.loading-screen')).toHaveCount(0, { timeout: 25000 });
  await page.locator('.deferred-highlights').scrollIntoViewIfNeeded();
  const stage = page.locator('.hl__stage');
  await expect(stage).toBeAttached();
  await stage.scrollIntoViewIfNeeded();
  await expect(page.locator('.hl__controls')).toHaveClass(/is-visible/);
  await expect.poll(() => videosRequested.size).toBe(1);
  await expect(stage.locator('video[src]')).toHaveCount(1);
  await expect(stage.locator('video[poster]')).toHaveCount(3);
  await page.getByRole('button', { name: 'Next slide', exact: true }).click();
  await expect(stage.locator('video[src]')).toHaveCount(1);
  await expect(stage.locator('.is-active video')).toHaveAttribute('src', /footer-video.mp4$/);
  await expect.poll(() => videosRequested.size).toBe(2);
  expect([...videosRequested].some((path) => path.endsWith('/pulp-film.mp4'))).toBe(false);
  expect(await stage.locator('.is-active video').evaluate((video) => video.paused)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('selected-video.png') });
});
