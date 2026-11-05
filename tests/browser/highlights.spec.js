import { test, expect } from '@playwright/test';

async function openCarousel(page) {
  await page.goto('/');
  await expect(page.locator('.loading-screen')).toHaveCount(0, { timeout: 25000 });
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

test('playback crosses the 20% visibility boundary and preserves manual pause', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await openCarousel(page);
  const video = page.locator('.hl__slide.is-active video');
  await expect.poll(() => video.evaluate((element) => element.paused)).toBe(false);

  await showRemainingPortion(page, 0.22);
  await expect(page.locator('.hl__controls')).toHaveClass(/is-visible/);
  const before = await video.evaluate((element) => element.currentTime);
  await expect.poll(() => video.evaluate((element) => element.currentTime)).toBeGreaterThan(before);

  await showRemainingPortion(page, 0.18);
  await expect.poll(() => video.evaluate((element) => element.paused)).toBe(true);
  await expect(page.locator('.hl__controls')).not.toHaveClass(/is-visible/);

  await showRemainingPortion(page, 0.22);
  await expect.poll(() => video.evaluate((element) => element.paused)).toBe(false);
  await showRemainingPortion(page, 1);
  await page.getByRole('button', { name: 'Pause carousel', exact: true }).click();
  await showRemainingPortion(page, 0.18);
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
