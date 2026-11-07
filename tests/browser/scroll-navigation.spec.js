import { test, expect } from '@playwright/test';

for (const reducedMotion of ['no-preference', 'reduce']) {
  test(`back to top restores the opening hero with ${reducedMotion} motion`, async ({ page }, testInfo) => {
    await page.emulateMedia({ reducedMotion });
    await page.goto('/');
    await expect(page.locator('.loading-screen')).toHaveCount(0, { timeout: 25000 });
    await expect(page.locator('.site-content')).not.toHaveAttribute('inert');

    const hero = page.locator('#top');
    const intro = hero.locator('.hero-intro');
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
