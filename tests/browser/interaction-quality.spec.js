import { test, expect } from '@playwright/test';

async function openWebsite(page) {
  await page.goto('/');
  await expect(page.locator('.loading-screen')).toHaveCount(0, { timeout: 25000 });
}

async function isFlat(product) {
  return product.evaluate((element) => new DOMMatrix(getComputedStyle(element).transform).isIdentity);
}

async function moveAcrossCard(card) {
  const bounds = await card.boundingBox();
  await card.dispatchEvent('pointermove', {
    pointerType: 'mouse',
    clientX: bounds.x + bounds.width * 0.8,
    clientY: bounds.y + bounds.height * 0.2,
  });
}

test('card tilt respects pointer capability, cancellation and live motion preferences', async ({ page, isMobile }) => {
  await openWebsite(page);
  const card = page.locator('.flavour-card').first();
  const product = card.locator('.card-product-tilt');
  await card.scrollIntoViewIfNeeded();
  await moveAcrossCard(card);

  if (isMobile) {
    await expect.poll(() => isFlat(product)).toBe(true);
    return;
  }

  await expect.poll(() => isFlat(product)).toBe(false);
  await card.dispatchEvent('pointercancel', { pointerType: 'mouse' });
  await expect.poll(() => isFlat(product)).toBe(true);
  await moveAcrossCard(card);
  await expect.poll(() => isFlat(product)).toBe(false);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(() => isFlat(product)).toBe(true);
  await moveAcrossCard(card);
  expect(await isFlat(product)).toBe(true);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await moveAcrossCard(card);
  await expect.poll(() => isFlat(product)).toBe(false);
});

test('keyboard CTA feedback follows its arrow and remains usable without motion', async ({ page }, testInfo) => {
  await openWebsite(page);
  const link = page.getByRole('link', { name: 'The juicy bit' });
  const arrow = link.locator('[aria-hidden="true"]');
  await page.keyboard.press('Tab');
  await link.focus();
  await expect(link).toBeFocused();
  expect(await link.evaluate((element) => element.matches(':focus-visible'))).toBe(true);
  await expect.poll(() => arrow.evaluate((element) => {
    const matrix = new DOMMatrix(getComputedStyle(element).transform);
    return { x: matrix.m41, y: matrix.m42 };
  })).toEqual({ x: 0, y: 3 });
  const width = await link.evaluate((element) => element.offsetWidth);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(arrow).toHaveCSS('transform', 'none');
  expect(await link.evaluate((element) => element.offsetWidth)).toBe(width);
  await link.press('Enter');
  await expect(page.locator('#good-insides')).toBeFocused();
  await expect(page.locator('#good-insides')).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  await page.screenshot({ path: testInfo.outputPath('keyboard-destination.png') });
});

test('dialogs enter smoothly and release focus and scroll locks when dismissed', async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    window.dialogTransitions = [];
    document.addEventListener('transitionrun', (event) => {
      if (!event.target.matches('.order-review, .hl__dialog') || event.pseudoElement) return;
      window.dialogTransitions.push(event.propertyName);
    });
  });
  await openWebsite(page);
  const buy = page.getByRole('button', { name: 'Buy now', exact: true });
  await buy.scrollIntoViewIfNeeded();
  await buy.focus();
  await buy.press('Enter');
  const dialog = page.locator('.order-review');
  await expect.poll(() => page.evaluate(() => window.dialogTransitions.includes('transform'))).toBe(true);
  await expect(page.getByRole('button', { name: 'Close order review' })).toBeFocused();
  await expect(dialog).toHaveCSS('opacity', '1');
  await page.screenshot({ path: testInfo.outputPath('order-entry.png') });
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(buy).toBeFocused();
  await expect(page.locator('html')).not.toHaveAttribute('data-scroll-locked');

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.evaluate(() => { window.dialogTransitions = []; });
  await buy.press('Enter');
  await expect(dialog).toHaveCSS('transform', 'none');
  await expect(dialog).toHaveCSS('transition-duration', '0s');
  await page.keyboard.press('Escape');
  expect(await page.evaluate(() => window.dialogTransitions)).toEqual([]);
  await expect(buy).toBeFocused();
  await expect(page.locator('html')).not.toHaveAttribute('data-scroll-locked');
});

test('reduced motion keeps shop hover and pressed states stationary', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openWebsite(page);
  const shop = page.locator('.pulp-shop');
  await shop.scrollIntoViewIfNeeded();
  const can = shop.locator('.pulp-shop__can');
  const originalPose = await can.evaluate((element) => getComputedStyle(element).transform);
  await shop.locator('.pulp-shop__art').hover();
  await expect(can).toHaveCSS('transform', originalPose);
  const add = shop.getByRole('button', { name: 'Add to bag', exact: true });
  await add.hover();
  await expect(add).toHaveCSS('transform', 'none');
  await page.mouse.down();
  await expect(add).toHaveCSS('transform', 'none');
  await page.mouse.up();
  await expect(shop.locator('.pulp-shop__status')).toContainText('added');
});
