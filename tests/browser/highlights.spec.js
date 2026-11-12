import { test, expect } from '@playwright/test';

async function openCarousel(page) {
  await page.goto('/');
  await expect(page.locator('.site-content')).toHaveAttribute('aria-hidden', 'false', { timeout: 25000 });
  await page.locator('.deferred-highlights').scrollIntoViewIfNeeded();
  await expect(page.locator('.hl__stage')).toBeAttached();
  await page.locator('.hl__stage').evaluate((stage) => {
    const bounds = stage.getBoundingClientRect();
    window.scrollTo({ top: window.scrollY + bounds.top, behavior: 'instant' });
  });
  await expect(page.locator('.hl__controls')).toHaveClass(/is-visible/);
}

async function showRemainingPortion(page, portion) {
  await page.locator('.hl__stage').evaluate((stage, visiblePortion) => {
    const bounds = stage.getBoundingClientRect();
    window.scrollTo({
      top: window.scrollY + bounds.top + bounds.height * (1 - visiblePortion),
      behavior: 'instant',
    });
  }, portion);
}

test('completed videos advance automatically and wrap to the first slide', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await openCarousel(page);
  await showRemainingPortion(page, 0.18);
  for (const nextIndex of [1, 2, 0]) {
    const activeVideo = page.locator('.hl__slide.is-active video');
    await expect.poll(() => activeVideo.evaluate((video) => video.readyState)).toBeGreaterThanOrEqual(2);
    await expect.poll(() => activeVideo.evaluate((video) => video.paused)).toBe(false);
    await activeVideo.evaluate((video) => { video.currentTime = video.duration - 0.25; });
    await expect(page.locator('.hl__track')).toHaveAttribute('data-index', String(nextIndex));
  }
  await expect.poll(() => page.locator('.hl__slide.is-active video').evaluate((video) => video.paused)).toBe(false);
  await page.getByRole('button', { name: 'Pause carousel', exact: true }).click();
  await expect.poll(() => page.locator('.hl__slide.is-active video').evaluate((video) => video.paused)).toBe(true);
  expect(errors).toEqual([]);
});

test('playback tolerates small scrolls and preserves manual pause', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await openCarousel(page);
  await page.locator('.hl__dot').first().click();
  const video = page.locator('.hl__slide.is-active video');
  await video.evaluate((element) => {
    element.currentTime = 0;
    element.playbackRate = 0.1;
  });
  await page.getByRole('button', { name: 'Play carousel', exact: true }).click();
  await expect.poll(() => video.evaluate((element) => element.paused)).toBe(false);

  await showRemainingPortion(page, 0.22);
  await expect(page.locator('.hl__controls')).toHaveClass(/is-visible/);
  const before = await video.evaluate((element) => element.currentTime);
  await expect.poll(() => video.evaluate((element) => element.currentTime)).toBeGreaterThan(before);

  await showRemainingPortion(page, 0.18);
  await expect(page.locator('.hl__controls')).toHaveClass(/is-visible/);
  await expect.poll(() => video.evaluate((element) => element.currentTime)).toBeGreaterThan(before + 0.3);
  await expect.poll(() => video.evaluate((element) => element.paused)).toBe(false);

  await showRemainingPortion(page, 0.02);
  await expect.poll(() => video.evaluate((element) => element.paused)).toBe(true);
  await expect(page.locator('.hl__controls')).not.toHaveClass(/is-visible/);

  await showRemainingPortion(page, 0.12);
  await expect(page.locator('.hl__controls')).not.toHaveClass(/is-visible/);
  await showRemainingPortion(page, 0.22);
  await expect.poll(() => video.evaluate((element) => element.paused)).toBe(false);
  await showRemainingPortion(page, 1);
  await page.getByRole('button', { name: 'Pause carousel', exact: true }).click();
  await showRemainingPortion(page, 0.02);
  await expect(page.locator('.hl__controls')).not.toHaveClass(/is-visible/);
  await showRemainingPortion(page, 1);
  await expect(page.getByRole('button', { name: 'Play carousel', exact: true })).toBeVisible();
  await expect.poll(() => video.evaluate((element) => element.paused)).toBe(true);

  await page.getByRole('button', { name: 'Next slide', exact: true }).click();
  await expect(page.locator('.hl__track')).toHaveAttribute('data-index', '1');
  await expect.poll(() => page.locator('.hl__slide.is-active').evaluate((slide) => {
    const card = slide.getBoundingClientRect();
    const viewport = slide.closest('.hl__viewport').getBoundingClientRect();
    return Math.abs(card.left + card.width / 2 - viewport.left - viewport.width / 2);
  })).toBeLessThan(2);
  await expect.poll(() => video.evaluate((element) => element.paused)).toBe(true);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await page.screenshot({ path: testInfo.outputPath('highlights-refactor.png') });
  expect(errors).toEqual([]);
});
