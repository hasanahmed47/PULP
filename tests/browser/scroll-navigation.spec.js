import { test, expect } from '@playwright/test';

for (const reducedMotion of ['no-preference', 'reduce']) {
  test(`back to top restores the opening hero with ${reducedMotion} motion`, async ({ page }, testInfo) => {
    await page.emulateMedia({ reducedMotion });
    await page.goto('/');
    await expect(page.locator('.loading-screen')).toHaveCount(0, { timeout: 25000 });
    await expect(page.locator('.site-content')).not.toHaveAttribute('inert');

    const hero = page.locator('#top');
    const intro = hero.locator('.hero-intro');
    // The shorter loader can finish before the hero entrance animations do.
    await expect(hero.locator('.hero-line__text').first()).toHaveCSS(
      'transform', 'none', { timeout: 8000 },
    );
    const initialIntro = await intro.boundingBox();

    await hero.getByRole('link', { name: 'Explore flavours' }).click();
    await expect(page).toHaveURL(/#flavours$/);
    await expect.poll(() => page.locator('#flavours').evaluate((element) => (
      Math.abs(element.getBoundingClientRect().top)
    ))).toBeLessThanOrEqual(1);

    const backToTop = page.getByRole('link', { name: 'Back to top' });

    for (const input of ['pointer', 'keyboard']) {
      await backToTop.scrollIntoViewIfNeeded();
      expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);

      if (input === 'keyboard') {
        await backToTop.focus();
        await backToTop.press('Enter');
        await expect(hero).toBeFocused();
      } else {
        await backToTop.click();
      }

      await expect(page).toHaveURL(/#top$/);
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
      await expect(intro).toHaveCSS('opacity', '1');
      await expect(hero.locator('.can-scene__controls')).toHaveCSS('opacity', '1');
      await expect(page.locator('.site-header')).toBeInViewport();
      const returnedIntro = await intro.boundingBox();
      expect(Math.abs(returnedIntro.y - initialIntro.y)).toBeLessThanOrEqual(1);

      if (reducedMotion === 'no-preference') {
        await expect(hero.locator('.hero-second')).toHaveCSS('opacity', '0');
        const canOffset = await hero.locator('.can-scene__stage').evaluate((element) => {
          const transform = getComputedStyle(element).transform;
          return new DOMMatrixReadOnly(transform).m41;
        });
        expect(Math.abs(canOffset)).toBeLessThanOrEqual(1);
      }
    }

    const overflow = await page.evaluate(() => (
      document.documentElement.scrollWidth - document.documentElement.clientWidth
    ));
    expect(overflow).toBeLessThanOrEqual(1);
    await page.screenshot({ path: testInfo.outputPath(`back-to-top-${reducedMotion}.png`) });
  });
}

// Regression: the mobile browser's visible height can grow when its toolbar
// collapses. A pinned hero must not leave an exposed blank strip underneath.
test('pinned hero covers the visible viewport without an extra spacer gap', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.loading-screen')).toHaveCount(0, { timeout: 20000 });

  const hero = page.locator('.hero');
  const start = await hero.evaluate((element) => {
    const spacer = element.closest('.pin-spacer');
    return spacer.getBoundingClientRect().top + window.scrollY;
  });

  await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), start + 3);
  await expect(hero).toHaveCSS('position', 'fixed');

  const bounds = await hero.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return {
      top: rect.top,
      bottom: rect.bottom,
      viewport: window.visualViewport?.height || window.innerHeight,
    };
  });

  expect(bounds.top).toBeLessThanOrEqual(2);
  expect(bounds.bottom).toBeGreaterThanOrEqual(bounds.viewport - 2);

  const seam = await hero.evaluate((element) => {
    const spacer = element.closest('.pin-spacer');
    const next = spacer?.nextElementSibling;
    return next ? next.getBoundingClientRect().top - spacer.getBoundingClientRect().bottom : null;
  });
  expect(seam).not.toBeNull();
  expect(Math.abs(seam)).toBeLessThanOrEqual(2);
});
