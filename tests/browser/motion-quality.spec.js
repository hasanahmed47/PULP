import { test, expect } from '@playwright/test';

async function openCutaway(page) {
  await page.goto('/');
  await expect(page.locator('.loading-screen')).toHaveCount(0, { timeout: 25000 });
  await page.locator('#good-stuff').scrollIntoViewIfNeeded();
  await expect(page.locator('#good-stuff')).toHaveAttribute('data-visible', 'true');
}

async function readLens(can) {
  return can.locator('.peek-can__lens').evaluate((circle) => ({
    x: circle.getAttribute('cx'),
    y: circle.getAttribute('cy'),
  }));
}

test('pointer bursts update the lens once per frame and cancellation discards queued work', async ({ page }) => {
  await openCutaway(page);
  const can = page.locator('.peek-can').first();
  await expect.poll(() => can.evaluate(element => element.getAnimations().every(animation => animation.playState === 'finished'))).toBe(true);

  const result = await can.evaluate(async button => {
    const image = button.querySelector('svg');
    const matrix = image.getScreenCTM();
    const target = new DOMPoint(420, 720).matrixTransform(matrix);
    const original = image.getScreenCTM.bind(image);
    let reads = 0;
    image.getScreenCTM = () => {
      reads++;
      return original();
    };

    function dispatchMoves() {
      for (let index = 0; index < 40; index++) {
        image.dispatchEvent(new PointerEvent('pointermove', {
          bubbles: true, pointerType: 'mouse', clientX: target.x, clientY: target.y,
        }));
      }
    }

    function nextPaint() {
      return new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    }

    dispatchMoves();
    await nextPaint();
    const lens = button.querySelector('.peek-can__lens');
    const moved = { reads, x: Number(lens.getAttribute('cx')), y: Number(lens.getAttribute('cy')) };
    reads = 0;
    dispatchMoves();
    button.dispatchEvent(new PointerEvent('pointercancel', { bubbles: true, pointerType: 'mouse' }));
    await nextPaint();
    delete image.getScreenCTM;
    return { moved, cancelledReads: reads, peeking: button.dataset.peeking };
  });

  expect(result.moved.reads).toBe(1);
  expect(result.moved.x).toBeCloseTo(420, 1);
  expect(result.moved.y).toBeCloseTo(720, 1);
  expect(result.cancelledReads).toBe(0);
  expect(result.peeking).toBe('false');
});

test('cutaway stagger runs once and lens stays aligned through selection', async ({ page }, testInfo) => {
  await openCutaway(page);
  const cans = page.locator('.peek-can');
  const delays = await cans.evaluateAll((elements) => elements.map((element) => getComputedStyle(element).animationDelay));
  expect(delays).toEqual(['0s', '0.06s', '0.12s', '0.18s']);
  await expect.poll(() => cans.first().evaluate((element) => element.getAnimations().every((animation) => animation.playState === 'finished'))).toBe(true);
  await page.locator('#pick-your-pulp').scrollIntoViewIfNeeded();
  await page.locator('#good-stuff').scrollIntoViewIfNeeded();
  expect(await cans.first().evaluate((element) => element.getAnimations().every((animation) => animation.playState === 'finished'))).toBe(true);

  const can = cans.nth(1);
  await can.locator('svg').dispatchEvent('pointermove', {
    pointerType: 'mouse',
    clientX: (await can.boundingBox()).x + 30,
    clientY: (await can.boundingBox()).y + 60,
  });
  await expect(can).toHaveAttribute('data-peeking', 'true');
  const position = await readLens(can);
  await can.press('Space');
  await expect(can).toHaveAttribute('aria-pressed', 'true');
  expect(await can.evaluate((element) => {
    const clip = element.querySelector('clipPath circle');
    const lens = element.querySelector('.peek-can__lens');
    return clip.getAttribute('cx') === lens.getAttribute('cx')
      && clip.getAttribute('cy') === lens.getAttribute('cy');
  })).toBe(true);
  expect(Number(position.x)).toBeGreaterThanOrEqual(140);
  expect(Number(position.y)).toBeGreaterThanOrEqual(150);
  await page.locator('#good-stuff').screenshot({ path: testInfo.outputPath('cutaway.png') });
});

test('enabling reduced motion stops a running lens glide', async ({ page }) => {
  await openCutaway(page);
  const can = page.locator('.peek-can').nth(1);
  const svg = can.locator('svg');
  const bounds = await svg.boundingBox();
  await svg.dispatchEvent('pointermove', {
    pointerType: 'mouse', clientX: bounds.x + bounds.width / 2, clientY: bounds.y + bounds.height / 3,
  });
  await expect(can).toHaveAttribute('data-peeking', 'true');
  const initial = await readLens(can);
  await svg.dispatchEvent('pointerup', {
    pointerType: 'touch', clientX: bounds.x + bounds.width / 2, clientY: bounds.y + bounds.height * 0.8,
  });
  await expect.poll(() => readLens(can)).not.toEqual(initial);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const stopped = await readLens(can);
  await page.waitForTimeout(500);
  expect(await readLens(can)).toEqual(stopped);
});

test('short phone rotation controls remain reachable', async ({ page, isMobile }, testInfo) => {
  test.skip(!isMobile, 'Short phone layout check');
  await page.setViewportSize({ width: 390, height: 667 });
  await page.goto('/');
  await expect(page.locator('.loading-screen')).toHaveCount(0, { timeout: 25000 });
  const section = page.locator('.rotation-section');
  await expect.poll(() => section.evaluate((element) => Boolean(element.closest('.pin-spacer')))).toBe(false);
  await section.scrollIntoViewIfNeeded();
  await section.locator('.flavour-dot').last().click();
  await expect(section).toHaveAttribute('data-flavour', 'lime-basil');
  await page.screenshot({ path: testInfo.outputPath('short-rotation.png') });
  for (const card of await page.locator('.flavour-card').all()) {
    const link = card.getByRole('link', { name: /Pick this flavour/ });
    await link.scrollIntoViewIfNeeded();
    await link.click({ trial: true });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => section.evaluate((element) => Boolean(element.closest('.pin-spacer')))).toBe(true);
  await page.setViewportSize({ width: 390, height: 667 });
  await expect.poll(() => section.evaluate((element) => Boolean(element.closest('.pin-spacer')))).toBe(false);
  await section.locator('.flavour-dot').first().click();
  await expect(section).toHaveAttribute('data-flavour', 'blood-orange');
});

test('short hero keeps complete flavour targets reachable through resizing', async ({ page, isMobile }, testInfo) => {
  test.skip(!isMobile, 'Short phone layout check');
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/');
  await expect(page.locator('.loading-screen')).toHaveCount(0, { timeout: 25000 });
  const hero = page.locator('.hero');
  const picker = hero.locator('.hero-flavour-picker');
  const lastFlavour = picker.getByRole('button').last();
  await lastFlavour.scrollIntoViewIfNeeded();
  await expect(lastFlavour).toBeInViewport({ ratio: 1 });
  await lastFlavour.click();
  await expect(hero).toHaveAttribute('data-flavour', 'lime-basil');
  await expect(picker).toHaveCSS('opacity', '1');
  await page.screenshot({ path: testInfo.outputPath('short-hero-controls.png') });

  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('.pin-spacer > .hero')).toHaveCount(1);
  await page.evaluate(() => window.scrollTo({ top: 100, behavior: 'instant' }));
  await expect.poll(() => picker.evaluate(element => Number(getComputedStyle(element).opacity))).toBeLessThan(1);
  await page.setViewportSize({ width: 320, height: 568 });
  await expect(page.locator('.pin-spacer > .hero')).toHaveCount(0);
  await expect(picker).toHaveCSS('opacity', '1');
  await lastFlavour.scrollIntoViewIfNeeded();
  await expect(lastFlavour).toBeInViewport({ ratio: 1 });
  await lastFlavour.click();
  await expect(hero).toHaveAttribute('data-flavour', 'lime-basil');
});
