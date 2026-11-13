import { test, expect } from '@playwright/test';

test('a failed scene download keeps the page usable without unhandled errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route(/\/(?:assets\/createCanScene-[^/]+\.js|src\/three\/createCanScene\.js)/, (route) => route.abort());
  await page.goto('/');
  await expect(page.locator('.loading-screen')).toHaveCount(0, { timeout: 25000 });
  const scene = page.locator('.hero .can-scene');
  await expect(scene).toHaveAttribute('aria-busy', 'false');
  await expect(scene).toHaveAttribute('data-ready', 'false');
  await expect(scene.locator('.can-scene__fallback')).toBeVisible();
  await expect(scene.locator('.can-scene__hint')).toHaveText('360° view unavailable');
  await expect(page.getByRole('link', { name: 'Explore flavours' })).toBeVisible();
  expect(errors).toEqual([]);
});
