import { test as base, expect } from '@playwright/test';

const test = base.extend({
  watchPageErrors: [async ({ page }, use, testInfo) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await use();
    if (testInfo.status === testInfo.expectedStatus) expect(errors).toEqual([]);
  }, { auto: true }],
});

async function openWebsite(page) {
  await page.goto('/');
  await expect(page.locator('.loading-screen')).toHaveCount(0, { timeout: 20000 });
  await expect(page.locator('.site-content')).not.toHaveAttribute('inert');
}

async function expectNoHorizontalOverflow(page) {
  const overflow = await page.evaluate(() => (
    document.documentElement.scrollWidth - document.documentElement.clientWidth
  ));
  expect(overflow).toBeLessThanOrEqual(1);
}

test('slow can textures do not hold the loader and a placeholder covers the gap', async ({ page }) => {
  let releaseTexture;
  const textureGate = new Promise((resolve) => { releaseTexture = resolve; });
  await page.route('**/blood-orange-wrap.webp', async (route) => {
    await textureGate;
    await route.continue();
  });

  try {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.addStyleTag({ content: '.loading-screen { transition: none !important; }' });
    await expect(page.locator('.site-content')).toHaveAttribute('inert');
    await expect(page.locator('.loading-screen')).toHaveCount(0, { timeout: 15000 });
    await expect(page.locator('.site-content')).not.toHaveAttribute('inert');
    await expect(page.locator('.hero .can-scene__fallback')).toBeVisible();
    await expect(page.locator('.hero .can-scene')).not.toHaveAttribute('data-ready', 'true');
  } finally {
    releaseTexture();
  }

  await expect(page.locator('.hero .can-scene')).toHaveAttribute('data-ready', 'true', { timeout: 20000 });
  await expect(page.locator('.hero .can-scene__fallback')).toHaveCount(0);
});

test('manual can rotation works with reduced motion', async ({ page, isMobile }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openWebsite(page);
  const can = page.locator('.hero .can-scene');
  await can.scrollIntoViewIfNeeded();
  await expect(can).toHaveAttribute('data-ready', 'true');
  const canvas = can.locator('canvas');
  const before = await canvas.screenshot();
  const bounds = await can.boundingBox();
  const x = bounds.x + bounds.width * 0.35;
  const y = bounds.y + bounds.height * 0.5;
  const endX = x + bounds.width * 0.3;

  if (isMobile) {
    const session = await page.context().newCDPSession(page);
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchStart', touchPoints: [{ x, y }],
    });
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchMove', touchPoints: [{ x: endX, y }],
    });
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await session.detach();
  } else {
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(endX, y, { steps: 8 });
    await page.mouse.up();
  }

  await expect(can).toHaveAttribute('data-dragging', 'false');
  const after = await canvas.screenshot();
  expect(before.equals(after)).toBe(false);
  expect(await can.evaluate((element) => getComputedStyle(element).outlineStyle)).toBe('none');
  await expect(can).not.toHaveAttribute('tabindex');
});

test('all interiors open and select the matching shop flavour', async ({ page, isMobile }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openWebsite(page);
  const inside = page.locator('#good-stuff');
  await inside.scrollIntoViewIfNeeded();
  const cans = inside.locator('.peek-can');
  await expect(cans).toHaveCount(4);

  for (const can of await cans.all()) {
    const name = await can.locator('.peek-can__name').innerText();
    if (!isMobile) {
      await can.locator('svg').hover();
      await expect(can).toHaveAttribute('data-peeking', 'true');
    }
    await can.press('Space');
    await expect(can).toHaveAttribute('aria-pressed', 'true');
    await expect(inside.locator('.peek-can[aria-pressed="true"]')).toHaveCount(1);
    await expect(inside.locator('#inside-detail')).toContainText(name);
    await can.click();
    await expect(inside.locator('.peek-can[aria-pressed="true"]')).toHaveCount(1);
    await expect(can).toHaveAttribute('aria-pressed', 'true');
  }

  await inside.getByRole('link', { name: /Pick this flavour/ }).click();
  await expect(page.locator('.pulp-shop')).toHaveAttribute('data-flavour', 'lime-basil');
  await expect(page.getByRole('radio', { name: 'Lime Basil' })).toBeChecked();
  await expectNoHorizontalOverflow(page);
  await inside.screenshot({ path: testInfo.outputPath('inside.png') });
});

test('shopping, wishlist, tabs and review survive selection changes and reload', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openWebsite(page);
  const shop = page.locator('.pulp-shop');
  await shop.getByRole('button', { name: 'Increase quantity', exact: true }).click();
  await shop.getByRole('button', { name: 'Add to bag' }).click();
  await expect(shop.locator('.pulp-shop__status')).toContainText('2 Blood Orange cans added');
  await shop.getByRole('button', { name: 'Save Blood Orange to wishlist' }).click();
  await shop.getByText('Blueberry', { exact: true }).click();
  await expect(shop.getByRole('group', { name: 'Quantity', exact: true }).locator('output')).toHaveText('1');
  await shop.getByRole('button', { name: 'Add to bag' }).click();
  await page.reload();
  await expect(page.locator('.loading-screen')).toHaveCount(0, { timeout: 20000 });
  await expect(shop.locator('.pulp-shop__bag-count')).toContainText('3 cans');
  const bagTab = page.getByRole('tab', { name: /Your bag/ });
  await bagTab.focus();
  await bagTab.press('ArrowRight');
  await expect(page.getByRole('tab', { name: /Wishlist/ })).toBeFocused();
  await page.getByRole('button', { name: 'Move to bag' }).click();
  await expect(bagTab).toHaveAttribute('aria-selected', 'true');
  await expect(shop.locator('.pulp-shop__bag-count')).toContainText('4 cans');
  const reviewButton = page.getByRole('button', { name: 'Review your bag' });
  await reviewButton.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.locator('.order-review__total')).toContainText('4 cans');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(reviewButton).toBeFocused();
});

test('system reduced-motion changes update animations and preserve shopping', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('pulp-shopping', '{invalid');
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openWebsite(page);
  await expect(page.locator('.pulp-shop__bag-count')).toContainText('0 cans');
  await expect(page.locator('.flavour-card').first()).toHaveCSS('position', 'relative');
  await expect(page.locator('.pin-spacer > .hero')).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(page.locator('.flavour-card').first()).toHaveCSS('position', 'sticky');
  await expect(page.locator('.pin-spacer > .hero')).toHaveCount(1);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.flavour-card').first()).toHaveCSS('position', 'relative');
  await expect(page.locator('.pin-spacer > .hero')).toHaveCount(0);
  for (const id of ['blood-orange', 'passionfruit-yuzu', 'blueberry', 'lime-basil']) {
    await page.locator(`.flavour-dot[data-flavour="${id}"]`).click();
    await expect(page.locator('.rotation-section')).toHaveAttribute('data-flavour', id);
  }
});

test('blocked storage and unavailable WebGL still allow shopping', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() { throw new DOMException('Storage blocked', 'SecurityError'); },
    });
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...options) {
      if (type === 'webgl' || type === 'webgl2') return null;
      return original.call(this, type, ...options);
    };
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openWebsite(page);
  await expect(page.locator('.hero .can-scene__fallback')).toBeVisible();
  await expect(page.locator('.hero .can-scene')).toHaveAttribute('aria-busy', 'false');
  await page.getByRole('button', { name: 'Add to bag' }).click();
  await expect(page.locator('.pulp-shop__bag-count')).toContainText('1 can');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(page.locator('.pin-spacer > .hero')).toHaveCount(1);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.pin-spacer > .hero')).toHaveCount(0);
  await expect(page.locator('.pulp-shop__bag-count')).toContainText('1 can');
});

test('section framing and keyboard navigation fit the viewport', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openWebsite(page);
  await page.locator('.skip-link').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#flavours')).toBeFocused();
  for (const selector of ['#good-insides', '#good-stuff']) {
    const section = page.locator(selector);
    const bounds = await section.boundingBox();
    if (selector === '#good-insides' && page.viewportSize().width < 1024) {
      const serve = section.getByRole('button', { name: /Shake for a serve/ });
      await serve.scrollIntoViewIfNeeded();
      await expect(serve).toBeInViewport();
      const clipped = await section.evaluate((element) => element.scrollHeight - element.clientHeight);
      expect(clipped).toBeLessThanOrEqual(1);
    } else {
      expect(bounds.height).toBeLessThanOrEqual(page.viewportSize().height + 2);
    }
    await section.screenshot({ path: testInfo.outputPath(`${selector.slice(1)}.png`) });
  }
  await expectNoHorizontalOverflow(page);
});

test('footer shows a live local clock and fits the viewport', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.install({ time: new Date('2026-10-28T12:00:30Z') });
  await openWebsite(page);
  const footer = page.locator('.site-footer');
  const clock = footer.locator('.footer-clock time');
  await expect(footer.getByRole('switch')).toHaveCount(0);
  await expect(footer.locator('.footer-clock')).toContainText(/Pulp o['’]clock/);
  await footer.scrollIntoViewIfNeeded();
  await expect(clock).toBeVisible();
  const before = await clock.innerText();
  expect(before).toMatch(/^\d{2}:\d{2}\s[ap]m$/i);
  await expect(clock).toHaveAttribute('datetime', /^2026-10-28T12:00:/);
  await page.clock.fastForward('01:00');
  await expect(clock).not.toHaveText(before);
  await expect(clock).toHaveAttribute('datetime', /^2026-10-28T12:01:/);
  await expectNoHorizontalOverflow(page);
  await footer.screenshot({ path: testInfo.outputPath('footer.png') });
});

test('anchor navigation preserves browser history and avoids duplicate entries', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openWebsite(page);
  await page.getByRole('link', { name: 'Explore flavours' }).click();
  await expect(page).toHaveURL(/#flavours$/);
  const backToTop = page.locator('.footer-bottom .text-link');
  await backToTop.click();
  await expect(page).toHaveURL(/#top$/);
  const historyLength = await page.evaluate(() => history.length);
  await backToTop.click();
  expect(await page.evaluate(() => history.length)).toBe(historyLength);
  await page.goBack();
  await expect(page).toHaveURL(/#flavours$/);
  await page.goForward();
  await expect(page).toHaveURL(/#top$/);
});

test('keyboard anchor navigation cleans up temporary focus attributes', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openWebsite(page);
  await page.locator('.deferred-highlights').scrollIntoViewIfNeeded();
  await expect(page.locator('#hl-heading')).toBeAttached();
  const link = page.locator('.hero-bottom .text-link');
  const target = page.locator('#hl-heading');
  await expect(target).not.toHaveAttribute('tabindex');
  await link.evaluate((element) => element.setAttribute('href', '#hl-heading'));
  await link.focus();
  await link.press('Enter');
  await expect(target).toBeFocused();
  await expect(target).toHaveAttribute('tabindex', '-1');
  await expect(page).toHaveURL(/#hl-heading$/);
  await page.keyboard.press('Tab');
  await expect(target).not.toHaveAttribute('tabindex');
  await page.locator('.skip-link').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#flavours')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#flavours')).toHaveAttribute('tabindex', '-1');
});

test('anchor click interception preserves native navigation cases', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openWebsite(page);
  const results = await page.getByRole('link', { name: 'Explore flavours' }).evaluate((link) => {
    const cases = [
      { name: 'control click', event: { ctrlKey: true } },
      { name: 'command click', event: { metaKey: true } },
      { name: 'shift click', event: { shiftKey: true } },
      { name: 'alt click', event: { altKey: true } },
      { name: 'middle click', event: { button: 1 } },
      { name: 'alternate target', target: '_blank' },
      { name: 'download', download: true },
      { name: 'external URL', href: 'https://example.test/#flavours' },
      { name: 'missing target', href: '#unknown-section' },
      { name: 'case-insensitive self target', target: '_SELF', intercepted: true },
      { name: 'cancelled click', href: '#good-insides', cancelled: true, intercepted: true },
    ];

    return cases.map((entry) => {
      link.setAttribute('href', entry.href ?? '#flavours');
      link.removeAttribute('target');
      link.removeAttribute('download');
      if (entry.target) link.setAttribute('target', entry.target);
      if (entry.download) link.setAttribute('download', 'flavours');
      const previousUrl = window.location.href;
      const event = new MouseEvent('click', { bubbles: true, cancelable: true, ...entry.event });
      if (entry.cancelled) event.preventDefault();
      let intercepted;
      document.addEventListener('click', (click) => {
        intercepted = click.defaultPrevented;
        click.preventDefault();
      }, { once: true });
      link.dispatchEvent(event);
      return {
        name: entry.name,
        intercepted,
        expected: entry.intercepted ?? false,
        navigated: window.location.href !== previousUrl,
        shouldNavigate: Boolean(entry.intercepted && !entry.cancelled),
      };
    });
  });

  for (const result of results) {
    expect(result.intercepted, result.name).toBe(result.expected);
    expect(result.navigated, result.name).toBe(result.shouldNavigate);
  }
});
