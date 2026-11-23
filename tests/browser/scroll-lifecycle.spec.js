import { test, expect } from '@playwright/test';

async function waitForReveal(page) {
  await expect(page.locator('.loading-screen')).toHaveCount(0, { timeout: 25000 });
}

async function expectAnchorPosition(page, selector) {
  await expect.poll(() => page.locator(selector).evaluate((element) => {
    const margin = parseFloat(getComputedStyle(element).scrollMarginTop) || 0;
    return Math.abs(element.getBoundingClientRect().top - margin);
  })).toBeLessThanOrEqual(2);
}

for (const reducedMotion of ['no-preference', 'reduce']) {
  test(`direct links and browser history align sections with ${reducedMotion} motion`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion });
    await page.goto('/#pick-your-pulp');
    await waitForReveal(page);
    await expectAnchorPosition(page, '#pick-your-pulp');
    await page.locator('.footer-up').click();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    await page.goBack();
    await expectAnchorPosition(page, '#pick-your-pulp');
    await page.goForward();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  });

  test(`film and order dialogs contain scrolling with ${reducedMotion} motion`, async ({ page }, testInfo) => {
    await page.emulateMedia({ reducedMotion });
    await page.goto('/');
    await waitForReveal(page);
    await page.locator('.deferred-highlights').scrollIntoViewIfNeeded();
    const filmButton = page.getByRole('button', { name: 'Watch the film' });
    await filmButton.click();
    await expect(page.getByRole('dialog', { name: 'PULP film' })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-scroll-locked', '');
    const filmTop = await page.evaluate(() => window.scrollY);
    await page.mouse.wheel(0, 700);
    await page.waitForTimeout(350);
    expect(await page.evaluate(() => window.scrollY)).toBe(filmTop);
    await page.keyboard.press('Escape');
    await expect(page.locator('html')).not.toHaveAttribute('data-scroll-locked');
    await expect(filmButton).toBeFocused();

    const buyButton = page.getByRole('button', { name: 'Buy now' });
    await buyButton.click();
    const review = page.getByRole('dialog', { name: 'YOUR FRUITY MIX.' });
    await expect(review).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-scroll-locked', '');
    const orderTop = await page.evaluate(() => window.scrollY);
    await page.mouse.wheel(0, 700);
    await page.waitForTimeout(350);
    expect(await page.evaluate(() => window.scrollY)).toBe(orderTop);
    await page.screenshot({ path: testInfo.outputPath(`order-${reducedMotion}.png`) });
    await page.keyboard.press('Escape');
    await expect(page.locator('html')).not.toHaveAttribute('data-scroll-locked');
    await expect(buyButton).toBeFocused();
    await page.locator('.footer-up').click();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  });
}
