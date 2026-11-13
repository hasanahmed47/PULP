import { test, expect } from '@playwright/test';

async function openFooter(page) {
  await page.goto('/');
  await expect(page.locator('.loading-screen')).toHaveCount(0, { timeout: 25000 });
  await page.evaluate(() => document.fonts.ready);
  const footer = page.getByRole('contentinfo');
  await footer.scrollIntoViewIfNeeded();
  return footer;
}

test('prototype layout fits, links resolve and reduced-motion flames ignore the cursor', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const footer = await openFooter(page);
  const canvas = footer.locator('canvas');
  await expect(canvas).toBeVisible();
  await expect(footer.getByRole('link', { name: 'Get in touch', exact: true }))
    .toHaveAttribute('href', 'mailto:hasanmuhammad2004@gmail.com');
  const layout = await footer.evaluate((element) => {
    const headline = element.querySelector('.footer-headline');
    const text = headline.firstElementChild.getBoundingClientRect();
    const content = headline.getBoundingClientRect();
    const bounds = element.getBoundingClientRect();
    return {
      fit: text.width / content.width,
      height: bounds.height,
      viewportHeight: innerHeight,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      anchorsExist: [...element.querySelectorAll('a[href^="#"]')]
        .every((link) => document.querySelector(link.getAttribute('href'))),
      linksInside: [...element.querySelectorAll('a')].every((link) => {
        const box = link.getBoundingClientRect();
        return box.left >= bounds.left - 1 && box.right <= bounds.right + 1;
      }),
    };
  });
  expect(layout.fit).toBeCloseTo(.995, 2);
  expect(layout.height).toBeGreaterThanOrEqual(layout.viewportHeight);
  expect(layout.overflow).toBeLessThanOrEqual(1);
  expect(layout.anchorsExist).toBe(true);
  expect(layout.linksInside).toBe(true);
  const before = await canvas.screenshot();
  await page.mouse.move(30, 200);
  await page.mouse.move(300, 400);
  const after = await canvas.screenshot();
  expect(after.equals(before)).toBe(true);
  await footer.screenshot({ path: testInfo.outputPath('footer.png') });
  for (const link of await footer.locator('.footer-nav a, .footer-cta').all()) {
    const href = await link.getAttribute('href');
    await link.click();
    expect(new URL(page.url()).hash).toBe(href);
    await expect(page.locator(href)).toBeInViewport();
  }
  expect(errors).toEqual([]);
});

test('flames render only in view and stop immediately when reduced motion is enabled', async ({ page }) => {
  await page.addInitScript(() => {
    window.footerDraws = 0;
    const draw = WebGL2RenderingContext.prototype.drawArrays;
    WebGL2RenderingContext.prototype.drawArrays = function (...args) {
      if (this.canvas.classList.contains('footer-flames')) window.footerDraws += 1;
      return draw.apply(this, args);
    };
  });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await expect(page.locator('.loading-screen')).toHaveCount(0, { timeout: 25000 });
  expect(await page.evaluate(() => window.footerDraws)).toBe(0);
  const footer = page.getByRole('contentinfo');
  await footer.scrollIntoViewIfNeeded();
  await expect.poll(() => page.evaluate(() => window.footerDraws)).toBeGreaterThan(2);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await footer.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  const stopped = await page.evaluate(() => window.footerDraws);
  await page.waitForTimeout(250);
  expect(await page.evaluate(() => window.footerDraws)).toBe(stopped);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await footer.scrollIntoViewIfNeeded();
  await expect.poll(() => page.evaluate(() => window.footerDraws)).toBeGreaterThan(stopped + 2);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await expect(footer).not.toBeInViewport();
  await page.waitForTimeout(150);
  const offscreen = await page.evaluate(() => window.footerDraws);
  await page.waitForTimeout(250);
  expect(await page.evaluate(() => window.footerDraws)).toBe(offscreen);
});

test('WebGL2 fallback preserves the gradient, contact and navigation', async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (...args) {
      if (this.classList.contains('footer-flames')) return null;
      return original.apply(this, args);
    };
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const footer = await openFooter(page);
  await expect(footer.locator('canvas')).toBeHidden();
  expect(await footer.evaluate((element) => getComputedStyle(element).backgroundImage)).toContain('radial-gradient');
  await expect(footer.getByRole('link', { name: 'Get in touch', exact: true })).toBeVisible();
  await footer.screenshot({ path: testInfo.outputPath('footer-fallback.png') });
  await footer.getByRole('link', { name: 'Back to top' }).click();
  await expect(page.locator('#top')).toBeInViewport();
});
