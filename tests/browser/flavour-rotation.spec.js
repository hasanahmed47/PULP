import { test, expect } from '@playwright/test';

/**
 * Track WebGL initialization and record which scenes
 * are ready when the loading screen begins exiting.
 */
async function observeSceneStartup(page) {
  await page.addInitScript(() => {
    const contexts = new WeakSet();
    const getContext = HTMLCanvasElement.prototype.getContext;

    window.rotationProbe = {
      contexts: 0,
      readyAtExit: null,
    };

    HTMLCanvasElement.prototype.getContext = function (type, ...options) {
      const context = getContext.call(this, type, ...options);
      const isWebGL = type === 'webgl' || type === 'webgl2';

      if (isWebGL && context && !contexts.has(context)) {
        contexts.add(context);
        window.rotationProbe.contexts += 1;
      }

      return context;
    };

    const observer = new MutationObserver(() => {
      const exiting = document.querySelector(
        '.loading-screen[data-exiting="true"]',
      );

      if (!exiting || window.rotationProbe.readyAtExit) return;

      window.rotationProbe.readyAtExit = {
        hero: document.querySelector('.hero .can-scene')?.dataset.ready,
        rotation: document.querySelector('.rotation-section .can-scene')?.dataset.ready,
      };

      observer.disconnect();
    });

    observer.observe(document, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['data-exiting'],
    });
  });
}

/**
 * Scroll to a specific position and confirm the
 * browser has completed the scroll.
 */
async function scrollToPosition(page, top) {
  await page.evaluate((position) => {
    window.scrollTo({
      top: position,
      behavior: 'instant',
    });
  }, top);

  await expect.poll(
    () => page.evaluate(() => window.scrollY),
  ).toBeCloseTo(top, 0);
}

/**
 * Capture both canvas resolution and displayed size.
 */
async function readCanvasSize(canvas) {
  return canvas.evaluate((element) => {
    const bounds = element.getBoundingClientRect();

    return {
      width: element.width,
      height: element.height,
      displayWidth: bounds.width,
      displayHeight: bounds.height,
    };
  });
}

test(
  'hero is ready before reveal and rotation initializes on approach',
  async ({ page }, testInfo) => {
    const errors = [];

    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.emulateMedia({
      reducedMotion: 'no-preference',
    });

    await observeSceneStartup(page);
    await page.goto('/');

    // The loading screen must finish before interaction.
    await expect(
      page.locator('.loading-screen'),
    ).toHaveCount(0, { timeout: 20000 });

    await expect(
      page.locator('.site-content'),
    ).not.toHaveAttribute('inert');

    const startup = await page.evaluate(
      () => window.rotationProbe,
    );

    // Flavour Rotation is intentionally loaded after the reveal.
    // The Hero can may finish a moment after it on a slow runner,
    // because the loading screen only waits a limited time.
    expect(startup.readyAtExit?.rotation).not.toBe('true');

    await expect(
      page.locator('.hero .can-scene'),
    ).toHaveAttribute('data-ready', 'true', { timeout: 30000 });

    const section = page.locator('.rotation-section');
    const viewport = page.viewportSize();

    const start = await section.evaluate((element) => {
      const spacer = element.closest('.pin-spacer');

      return (
        spacer.getBoundingClientRect().top +
        window.scrollY
      );
    });

    // Approach the rotation section to activate it.
    await scrollToPosition(
      page,
      Math.round(start - viewport.height * 0.3),
    );

    await expect(section).toHaveAttribute(
      'data-visible',
      'true',
    );

    // The rotation scene must become ready when needed,
    // rather than blocking the initial website reveal.
    const rotationScene = section.locator('.can-scene');

    await expect(rotationScene).toHaveAttribute(
      'data-ready',
      'true',
      { timeout: 30000 },
    );

    // Both scenes should now have initialized canvases.
    await expect(
      page.locator('.can-scene canvas'),
    ).toHaveCount(2);

    const initializedContexts = await page.evaluate(
      () => window.rotationProbe.contexts,
    );

    expect(initializedContexts).toBeGreaterThanOrEqual(2);

    const canvas = section.locator('canvas');
    const initialSize = await readCanvasSize(canvas);

    await page.screenshot({
      path: testInfo.outputPath('rotation-entry.png'),
    });

    // Verify the pinned section preserves canvas sizing.
    await scrollToPosition(page, Math.round(start + 2));

    await expect(section).toHaveCSS(
      'position',
      'fixed',
    );

    expect(await readCanvasSize(canvas)).toEqual(initialSize);

    // Verify that scrolling changes the rendered can.
    const front = await canvas.screenshot();

    await scrollToPosition(
      page,
      Math.round(start + viewport.height * 0.25),
    );

    const turning = await canvas.screenshot();

    expect(front.equals(turning)).toBe(false);

    // Verify flavour navigation and scroll synchronization.
    const flavours = [
      'blood-orange',
      'passionfruit-yuzu',
      'blueberry',
      'lime-basil',
    ];

    for (const [index, flavour] of flavours.entries()) {
      const dot = section.locator(
        `.flavour-dot[data-flavour="${flavour}"]`,
      );

      await dot.click();

      await expect(section).toHaveAttribute(
        'data-flavour',
        flavour,
      );

      await expect(dot).toHaveAttribute(
        'aria-pressed',
        'true',
      );

      const destination = start + viewport.height * index;

      await expect.poll(
        () => page.evaluate(
          (top) => Math.abs(window.scrollY - top),
          destination,
        ),
      ).toBeLessThanOrEqual(2);

      expect(await readCanvasSize(canvas)).toEqual(
        initialSize,
      );
    }

    // No additional WebGL contexts should be created
    // after both scenes finish initialization.
    const finalContexts = await page.evaluate(
      () => window.rotationProbe.contexts,
    );

    expect(finalContexts).toBe(initializedContexts);

    expect(
      await page.evaluate(() => (
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth
      )),
    ).toBeLessThanOrEqual(1);

    await page.screenshot({
      path: testInfo.outputPath('rotation-lime-basil.png'),
    });

    expect(errors).toEqual([]);
  },
);