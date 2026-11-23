import { test, expect } from '@playwright/test';

async function openWebsite(page) {
  await page.goto('/');
  await expect(page.locator('.loading-screen')).toHaveCount(0, { timeout: 25000 });
}

async function offset(content) {
  return content.evaluate((element) => {
    const values = getComputedStyle(element).translate.split(' ').map(Number.parseFloat);
    return Math.hypot(values[0] || 0, values[1] || 0);
  });
}

test('Magnet moves CTA content while preserving its hit target and motion preferences', async ({ page, isMobile }) => {
  await openWebsite(page);
  const link = page.getByRole('link', { name: 'Explore flavours' });
  const content = link.locator('.magnet__content');
  await expect(link).toBeVisible();
  await expect.poll(() => link.evaluate((element) => getComputedStyle(element).opacity)).toBe('1');
  const bounds = await link.boundingBox();
  async function move() {
    await link.dispatchEvent('pointermove', {
      pointerType: 'mouse',
      clientX: bounds.x + bounds.width * 0.8,
      clientY: bounds.y + bounds.height / 2,
    });
  }
  await move();
  if (isMobile) {
    await page.evaluate(() => new Promise(resolve => {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    }));
    expect(await offset(content)).toBe(0);
    return;
  }
  await expect.poll(() => offset(content)).toBeGreaterThan(1);
  expect(await link.boundingBox()).toEqual(bounds);
  await link.dispatchEvent('pointerleave', { pointerType: 'mouse' });
  await expect.poll(() => offset(content)).toBe(0);
  await move();
  await expect.poll(() => offset(content)).toBeGreaterThan(1);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(() => offset(content)).toBe(0);
  await move();
  expect(await offset(content)).toBe(0);
  await link.focus();
  await link.press('Enter');
  await expect(page.locator('#flavours')).toBeFocused();
});

test('SplitText reveals once, preserves heading layout and restores plain text on reduced motion', async ({ page }, testInfo) => {
  await openWebsite(page);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const sizes = new Map();
  for (const id of ['inside-title', 'hl-heading']) {
    if (id === 'hl-heading') await page.locator('.deferred-highlights').scrollIntoViewIfNeeded();
    const heading = page.locator(`#${id}`);
    await heading.scrollIntoViewIfNeeded();
    await expect(heading.locator('.split-text__char').first()).toBeAttached();
    await expect(heading).toHaveAttribute('data-reveal', 'complete');
    sizes.set(id, await heading.evaluate(element => ({ width: element.offsetWidth, height: element.offsetHeight })));
    await expect(heading).toHaveAccessibleName(id === 'inside-title' ? "IT'S WHAT'S INSIDE." : 'GET THE HIGHLIGHTS.');
    await page.screenshot({ path: testInfo.outputPath(`${id}.png`) });
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const [id, size] of sizes) {
    const heading = page.locator(`#${id}`);
    await expect(heading.locator('.split-text__char')).toHaveCount(0);
    const restored = await heading.evaluate(element => ({ width: element.offsetWidth, height: element.offsetHeight }));
    expect(restored.height).toBe(size.height);
    expect(Math.abs(restored.width - size.width)).toBeLessThanOrEqual(1);
  }
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  for (const id of sizes.keys()) {
    const heading = page.locator(`#${id}`);
    await expect(heading).toHaveAttribute('data-reveal', 'complete');
    await expect(heading.locator('.split-text__char')).toHaveCount(0);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});

test('SplitText chunk failure leaves readable headings', async ({ page }) => {
  await page.route('**/assets/SplitText-*.js', route => route.abort());
  await openWebsite(page);
  const heading = page.locator('#inside-title');
  await heading.scrollIntoViewIfNeeded();
  await expect(heading).toHaveAttribute('data-reveal', 'complete');
  await expect(heading.locator('.split-text__char')).toHaveCount(0);
  await expect(heading).toBeVisible();
  await expect(heading).toHaveAccessibleName("IT'S WHAT'S INSIDE.");
});
