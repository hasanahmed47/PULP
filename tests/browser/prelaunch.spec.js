import { test, expect } from '@playwright/test';

test.use({ deviceScaleFactor: 3 });

test('defers offscreen work, reserves media space and keeps controls reachable', async ({ page, isMobile }, testInfo) => {
  const errors = [];
  const videoRequests = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => {
    if (request.url().includes('.mp4')) videoRequests.push(request.url());
  });
  await page.addInitScript(() => {
    window.initialLayoutShift = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) window.initialLayoutShift += entry.value;
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });
  await page.goto('/');
  await expect(page.locator('.site-content')).toHaveAttribute('aria-hidden', 'false', { timeout: 25000 });
  await expect(page.locator('.hero .can-scene')).toHaveAttribute('data-ready', 'true', { timeout: 30000 });
  await expect(page.locator('.loading-screen')).toHaveCount(0);
  const initialLayoutShift = await page.evaluate(() => window.initialLayoutShift);
  expect(initialLayoutShift).toBeLessThanOrEqual(0.1);
  await testInfo.attach('initial-layout-shift.json', {
    body: JSON.stringify({ initialLayoutShift }),
    contentType: 'application/json',
  });
  expect(videoRequests).toEqual([]);
  await expect(page.locator('.rotation-section canvas')).toHaveCount(0);
  await expect(page.locator('main')).toHaveCount(1);
  await expect(page.getByRole('banner')).toHaveCount(1);
  await expect(page.getByRole('contentinfo')).toHaveCount(1);

  const ratio = await page.locator('.hero canvas').evaluate((canvas) => canvas.width / canvas.clientWidth);
  expect(ratio).toBeLessThanOrEqual(isMobile ? 1.51 : 1.76);

  for (const selector of ['.site-header', '.spot', '.deferred-highlights']) {
    const section = page.locator(selector);
    await section.scrollIntoViewIfNeeded();
    if (selector === '.deferred-highlights') {
      await expect(page.locator('.hl__stage')).toBeAttached();
      await page.locator('.hl__stage').scrollIntoViewIfNeeded();
      await expect(page.locator('.hl__controls')).toHaveClass(/is-visible/);
      await expect.poll(() => page.locator('.hl__slide.is-active video').evaluate((video) => video.readyState)).toBeGreaterThanOrEqual(2);
    }
    await expect.poll(() => section.evaluate((element) => {
      return [...element.querySelectorAll('a, button')].filter((control) => {
        const bounds = control.getBoundingClientRect();
        return bounds.width > 0 && bounds.height > 0 && !control.closest('[inert]')
          && (bounds.width < 43.9 || bounds.height < 43.9);
      }).map((control) => control.getAttribute('aria-label') || control.textContent.trim());
    })).toEqual([]);
    if (selector === '.spot') {
      expect(await section.locator('.can-carousel').evaluate((carousel) => {
        const bounds = carousel.getBoundingClientRect();
        return [...carousel.querySelectorAll('button')].every((button) => {
          const target = button.getBoundingClientRect();
          return target.left >= bounds.left - 1 && target.right <= bounds.right + 1;
        });
      })).toBe(true);
    }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    await section.screenshot({ path: testInfo.outputPath(`${selector.slice(1)}.png`) });
  }
  expect(errors).toEqual([]);
});

test('lazy highlights preserve section height before and after media loads', async ({ page }) => {
  const highlightsDownload = Promise.withResolvers();
  await page.route(/\/(assets\/HighlightsCarousel-[^/]+\.js|src\/sections\/HighlightsCarousel\.jsx)(\?.*)?$/, async (route) => {
    await highlightsDownload.promise;
    await route.continue();
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('.site-content')).toHaveAttribute('aria-hidden', 'false', { timeout: 25000 });
  const section = page.locator('.deferred-highlights');
  await expect(section.getByRole('region', { name: 'Loading highlights' })).toBeVisible();
  const before = await section.evaluate((element) => element.getBoundingClientRect().height);
  await section.scrollIntoViewIfNeeded();
  highlightsDownload.resolve();
  await expect(section.locator('.hl__stage')).toBeAttached();
  await expect.poll(() => section.evaluate((element) => element.getBoundingClientRect().height)).toBeCloseTo(before, 0);
  const video = section.locator('.hl__video').first();
  await expect(video).toHaveAttribute('preload', 'metadata');
  await expect(video).toHaveAttribute('playsinline', '');
  await expect(video).not.toHaveAttribute('loop');
  expect(await video.evaluate((element) => element.muted)).toBe(true);
});
