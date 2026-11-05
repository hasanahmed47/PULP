# Validation record

## Current: remove the hero's moving background

Verified on 30 October 2026 after visual feedback. The pink blob element, its CSS rule and reduced-motion selector were deleted. Hero's pale tint and background transition were also removed; its background is now plain paper white. Existing text/CTA accents remain. This feedback supersedes the blob/tint portion of the original hero upgrade plan; later steps should not restore them.

`npm.cmd run build`, `npm.cmd run lint` and all 6 existing component tests passed. Chrome/Playwright verified 390/768/1440px at scroll start and just after the hero pin ends: white hero background, no blob element, ready canvas, no horizontal overflow or page errors. Reduced-motion checks also kept the white background. Screenshots and results are in `test-results/hero-background-removal/`.

Changed: `src/sections/Hero.jsx`, `src/sections/Hero.css`, `docs/FILES.md`, this record. No renderer, scroll or tests/ files changed.

## Earlier: hero upgrade, step 1 of 4 — initial colour system

Verified on 30 October 2026. This is the colour foundation only; the agreed next steps are chips/layout, bubbles, then intro/splash. Hero chips, their component test and the final motion/performance gates are pending those steps.

- Hero uses the existing flavour token blocks through a local `data-flavour`. Pale blob, very light background tint, readable punctuation, text selection and the dark Explore flavours pill share the theme. The nav CTA remains yellow; focus stays blue. CSS transitions take 400ms and switch off under reduced motion.
- Scope decision: hero scroll currently owns rotation/stage movement only. Future hero chips will own its flavour; the later FlavourRotation component owns a different can/ref, so no shared texture writer or scroll handoff is needed. Intro will wait for both CanScene readiness and loader reveal, using a separate transform wrapper.
- `npm.cmd run build`, `npm.cmd run lint`, and `npx.cmd vitest run` passed (6 existing component tests). No files under `tests/` changed.
- Chrome/Playwright passed all 18 combinations of widths 390/768/1440, zoom equivalents 80%/100%/125%, and reduced motion on/off. Every flavour's text, punctuation, hover and selection contrast passed 4.5:1; theme changes recorded zero layout-shift value, no horizontal overflow and no page warnings/errors. Blue focus ring and yellow nav CTA remain present. Desktop/mobile screenshots visually inspected.
- Production delta against the completed Blood Orange replacement: JavaScript +101 bytes (+15 gzip), CSS +785 bytes (+155 gzip). Net production source change: 40 lines. Baseline and exact totals: `test-results/hero-upgrade/baseline.json` and `phase1-bundle.json`.
- Details: `test-results/hero-upgrade/colour-results.json`. Theme variants were exercised by changing the hero attribute directly because chips are not implemented yet. The zoom matrix uses viewport/DPR emulation, not Chrome's native zoom menu; native zoom and final intro/chip/unpin frame/performance claims remain unverified until the later steps. An initial harness run produced its own Canvas2D readback warning; setting willReadFrequently on the diagnostic canvas removed it, and the full matrix passed cleanly.

Changed source: `src/sections/Hero.jsx`, `src/sections/Hero.css`. Documentation: `docs/FILES.md`, this record.

## Earlier: supplied Blood Orange wrap and can inspection

Verified on 30 October 2026.

- Latest supplied flat artwork is mapped directly onto a curved 3D body with continuous label coordinates. Supplied top/bottom photographs are mapped to circular end surfaces; their white surrounds are excluded by texture coordinates. Static product and matching conceptual interior images are exported from the same model; the original black-background front photo is not used as an exact cutout.
- Accessible Top/Front/Bottom buttons change tilt independently of drag/scroll rotation. Tween cleanup, keyboard access, reduced motion, horizontal dragging and vertical touch scrolling passed Chrome/Playwright checks at 390, 768 and 1440px. Evidence: `test-results/can-artwork/`.
- Additional probes passed: failed top-image request exits the loader into the fallback image and disables view buttons; Inside/shop fit at 390/1440 under reduced motion. At DPR1.25, 54 sampled forward/reverse unpin observations retained the same visible, ready canvas and unchanged CSS/buffer dimensions. These DOM observations alone are not a pixel-by-pixel proof of every compositor frame.
- Build, lint, 6 component tests, 9 existing unit tests and asset checks passed. All four cutaway alpha silhouettes match their intact cans. Existing synchronous render after renderer.setSize was preserved.
- Replaced Blood Orange can/wrap/cutaway assets and pouring poster; removed the three obsolete Blood Orange SVG originals. The generator now protects supplied Blood Orange artwork and supports poster-only regeneration. The poster embeds a PNG representation of the current can for librsvg compatibility. No dependencies or tests/ files changed.
- Supplied small-print errors remain in the artwork. Remaining flavours retain illustrated labels, with the common updated can geometry and metal end surfaces. The final pouring video is separate work.

Changed source: `src/components/CanScene.jsx`, `src/components/CanScene.css`, `src/hooks/useCanSpin.js`, `src/hooks/useCanRenderer.js`, `src/three/createCanModel.js`, `src/three/createCanScene.js`, `src/data/media.js`, `src/data/flavours.js`. Tooling: `scripts/create-artwork.mjs`, new `scripts/export-blood-orange.mjs`. Media and source documentation updated.

## Earlier: footer clock and section navigation

Verified on 29 October 2026.

- Footer mein Pulp o’clock visitor ka local time dikhata hai. Native time element minute boundary par update hota hai; component unmount par timer clear hota hai. Existing invitation, artwork aur navigation preserve hain.
- Custom animation preference UI, persistence, root attributes aur related CSS branches remove hue. `ScrollContext` sirf scrolling own karta hai; `useReducedMotion` native OS preference subscribe karta hai. CSS native media queries use karti hai. User-initiated can rotation aur section-specific media playback controls available hain.
- AnchorLink browser-resolved URL properties use karta hai. Changed destination par history entry add hoti hai; same destination repeat karne se duplicate entry nahi banti. Keyboard focus ke temporary tabindex blur par remove hote hain, aur existing tabindex preserve rehta hai. Modified, cancelled, download, alternate-target, external aur missing-destination cases native rehte hain.
- `npm.cmd run lint`, 9 existing unit tests aur `npm.cmd run check` passed. Production build passed with 107 transformed modules. Three.js ka existing approximately 516kB minified chunk warning remain karta hai. Vite/esbuild ko sandbox directory restriction ki wajah se build aur browser execution approved escalation ke saath run hue.
- Final Playwright run: 33 tests passed in installed Microsoft Edge at 1440×1000, 768×1000 and mobile/touch 390×844. Coverage includes loading, manual rotation, all four interiors, shopping persistence/review, live OS preference changes, blocked storage/WebGL fallback, section framing, clock minute updates, browser history, keyboard focus cleanup and native click cases. Uncaught page errors are checked by the automatic fixture.
- Footer screenshots at all three widths visually inspected; clock, CTA and navigation fit, with no horizontal overflow in the layout checks. Evidence: `test-results/footer-anchor-final/`. An earlier run found an ambiguous shopping status locator because quantity outputs also have the status role; the assertion now targets the actual shopping announcement.
- Source, generated assets and current documentation scans found no obsolete custom preference identifiers. No dependency was added. Project source remains JavaScript/JSX; this change does not introduce static TypeScript checking.

Changed source: `src/App.jsx`, `src/styles.css`, `src/context/ScrollContext.jsx` (new), `src/hooks/useReducedMotion.js` (new), `src/hooks/useFruitParallax.js`; component files `AnchorLink.jsx`, `AnchorLink.css`, `CanScene.css`, `FlavourCard.jsx`, `FlavourCard.css`, `FloatingFruit.css`, `LoadingScreen.css`, `PeekCan.css`; section files `Cutaway.css`, `FlavourRotation.jsx`, `FlavourRotation.css`, `Footer.jsx`, `Footer.css`, `Hero.jsx`, `Hero.css`, `Mascot.jsx`, `PeoplePulp.jsx`, `PeoplePulp.css`, `PickYourPulp.css`, `PouringFilm.jsx`, `PouringFilm.css`. The previous combined preference/scroll provider was removed. Supporting changes: `tests/browser/website.spec.js`, `README.md`, `docs/FILES.md`, `docs/AUDIT_MOTION.md`, `docs/AUDIT_UI.md` and this record.

Physical devices, Firefox and WebKit were not tested. Final media and checkout remain outside this change. No deployment was performed.

## Earlier: viewport framing and four-flavour peek inside

Verified on 27 October 2026. The Inside gallery now restores cutaway interaction for every flavour; older records describing its static-only behavior are historical.

- Mascot uses a viewport-height grid instead of fixed padding plus a 570px stage. Heading size, artwork and spacing account for both viewport width and height. Desktop hero, pouring and flavour-rotation headings/minimum heights also adapt to shorter viewports.
- Inside keeps four columns above 900px and two columns below. Its heading, all four cans, labels, notes and CTA fit the tested section-start frames without clipping. Normal scrolling remains available; no scroll snapping was added.
- Playwright/Chrome checked 1280×620, 1366×650, 1536×735, 1920×910, 1440×1000, 768×1000 and 390×844. Mascot heading/character/fruit bounds and hero text/CTA/footer passed. Pouring and rotation compositions also passed at 1280×620 and 1920×910.
- Each Inside can has an independent circular hover lens. Tests checked coordinate tracking/clamping, visible pixel changes and all four unique cutaway URLs. Click/tap opens and closes the complete interior; Enter/Space use the same native button action. Open-view opacity was checked after its fade, and desktop/mobile open screenshots were visually reviewed.
- Mobile taps opened every flavour, and a vertical swipe over a can still scrolled. Flavour notes updated correctly; Pick this flavour selected the matching shop radio and navigated to the shop. Resize from 1280×620 to 1920×910 and reduced-motion interaction passed.
- No horizontal overflow, uncaught page errors or HTTP failures were recorded in the Inside checks. Desktop, tablet and mobile screenshots were visually reviewed.
- Added three matching cutaway WebP/SVG pairs for Passionfruit Yuzu, Blueberry and Lime Basil. Existing Blood Orange cutaway and intact artwork remain. All four dimensions and alpha silhouettes pass `npm.cmd run check`; the loader preloads their interiors as part of its 18 images/20 tasks.
- Final `npm.cmd run build` passed with 98 transformed modules. The existing Three.js size advisory remains. All 57 source files are documented in `docs/FILES.md`; no JSX inline styles or direct DOM style assignments were introduced.
- Evidence: `C:/Users/stark/AppData/Local/Temp/pulp-viewport-fit/` and `C:/Users/stark/AppData/Local/Temp/pulp-inside-fit/`, including the full viewport results and separate settled-open preview results.

The viewport sizes represent browser content areas, not physical display inches. Very short windows retain normal document scrolling rather than shrinking content below readable sizes. Touch was emulated in Chrome; physical phones and other browser engines were not tested. Interiors remain conceptual illustrations, not verified ingredient/recipe information or final photography.

Files changed in this phase: `PeekCan.jsx`/`PeekCan.css` (new), `Cutaway.jsx`/`Cutaway.css`, `Mascot.css`, `Hero.css`, `PouringFilm.css`, `FlavourRotation.css`, `media.js`, `flavours.js`, `useSiteLoading.js`, `create-artwork.mjs`, `check-project.mjs`, three new cutaway WebP/SVG pairs, `README.md`, `docs/FILES.md` and this record.

## Earlier: loading screen, typography and pointer-only spin

Verified on 27 October 2026. This record supersedes earlier keyboard-rotation and loading behavior below.

- Loader lettering uses the same shared wordmark as the header, with natural letter spacing, smaller responsive sizing and an unclipped line height. The progress number uses DM Sans instead of the heavy display font. No font or dependency was added.
- `npm.cmd run build` passed: 96 modules transformed. The existing Three.js chunk-size advisory remains.
- `npm.cmd run check` passed: media paths/dimensions/alpha, preserved legacy cutaway alignment, section order and navigation targets.
- All 55 source files are represented in `docs/FILES.md`. Source scan found no JSX inline style attributes or direct DOM style assignments.
- Playwright ran in installed Chrome at 1440×1000, 768×1000 and 390×844. It deliberately delayed the hero wrap texture at each width. The loader stayed visible below 100%, background controls remained inert, and scrolling stayed locked. After releasing the request, fonts and the hero were ready before the overlay exited and the page unlocked.
- Computed loader/header font family, weight and proportional tracking matched at all three widths. The wordmark was unclipped, and no horizontal overflow or uncaught page errors occurred in normal contexts. Reload passed at every width.
- Mouse dragging changed the rendered can. Mobile horizontal touch dragging also changed it, while vertical touch swipes still scrolled the page. Neither interaction produced an outline. Source and DOM checks confirmed no can keyboard handler, tab stop or slider attributes; an exact keyboard pixel comparison was discarded because renderer/lighting settling made it unreliable.
- Reduced-motion dismissal, deep-link/offscreen reload readiness and explicit WebGL failure passed. The failure case revealed the static fallback before dismissing the loader. Timeout behavior is documented from source; no additional timeout-duration test was run.
- Loader screenshots were visually reviewed at all three widths, plus desktop/mobile reveal screenshots. Evidence and `results.json` are in `C:/Users/stark/AppData/Local/Temp/pulp-loading-review/`. Touch used Chrome emulation, not a physical device; other browser engines were not tested.

Earlier phase records follow for historical context; their keyboard-control claims no longer describe the current can interaction.

## Earlier: consistent can loading and drag focus

Verified on 27 October 2026 after the can-loading and focus fix.

- Normal loading renders only the actual 3D can once its first frame is ready. The alternate static can is now reserved for renderer/texture failure, so it no longer flashes before the 3D model.
- The interactive hero starts loading at mount. `aria-busy` reflects loading until the first frame or a failure.
- Pointer dragging no longer forces programmatic focus. The large scene outline is disabled only for this component; keyboard focus is shown as a small dark outline around the drag hint.
- Playwright delayed the can texture deliberately at 1440, 768 and 390px. No fallback image existed during loading or appeared during the loading-to-ready transition; reload also retained only one rendered 3D can.
- Mouse/touch drags changed the rotation without any scene outline or pointer-triggered hint outline. Native vertical touch scrolling still worked at 390px.
- Keyboard Tab reached the slider, its compact focus indicator appeared, ArrowRight moved 15 degrees and Home reset the angle.
- Explicit WebGL failure still showed the static fallback. No horizontal overflow or uncaught page errors occurred in the normal test contexts.
- Updated production build and `npm.cmd run check` both passed. The existing Three.js chunk-size advisory remains.
- Screenshots were visually reviewed at all three widths. Evidence: `C:/Users/stark/AppData/Local/Temp/pulp-can-fix/`.

The browser checks below describe the earlier section/shopping phase; this follow-up supersedes its normal-loading fallback behavior.

## Build and source checks

- `npm.cmd run build` passed after the final source changes: 92 modules transformed and production assets generated in `dist/`.
- `npm.cmd run check` passed: bundled image paths/dimensions/alpha, preserved legacy cutaway alignment, all nine sections in order, and all internal navigation targets.
- Source scan found no JSX `style` attributes or direct DOM `.style` mutations in `src`.
- All 51 files in `src` are covered by `docs/FILES.md`. Each visual component owns adjacent CSS; shared design tokens are in `src/tokens.css`.
- No project dependency was added. Browser verification used the temporary Playwright installation already available in the local npm cache.

## Browser validation

Playwright ran against local Vite in installed Chrome. Viewports were 1440×1000, 768×1000 and 390×844. The 390px context enabled mobile/touch emulation. Section screenshots were visually reviewed.

- Hero: mouse drag changed the accessible angle and the actual rendered canvas. ArrowRight moved 15 degrees; Home reset to zero. The fallback image was absent after WebGL became ready.
- Hero after scrolling: drag still worked after the pinned timeline moved the can left under the hidden intro. The intro now stops intercepting pointer input when hidden.
- Touch: native Chromium CDP touch events rotated the can with a horizontal swipe. A vertical swipe over the same area still scrolled the page.
- Inside: all four cans rendered. Desktop and tablet use four columns; mobile uses two columns. Selecting a flavour updated its notes; Pick this flavour selected that same flavour in the shop and navigated there.
- Shopping: flavour selection, incrementing quantity, adding multiple flavours, decreasing bag quantities and removing items passed.
- Wishlist: favourite save, reload persistence, Wishlist tab, moving a saved flavour into the bag and resulting counts passed.
- Buy now: the selected flavour/quantity opened in the native review dialog. Escape and close actions worked, and focus returned to the invoking control. Bag review showed the correct total.
- Accessibility: native radio inputs and keyboard bag/wishlist tabs worked; modal focus/inert behavior was exercised. This was targeted interaction testing, not a full accessibility audit.
- Persistence: the bag survived reload. Malformed saved JSON recovered to an empty usable bag.
- People Pulp: the preview pause control stopped its animation. The frame fits all three tested widths.
- Reduced motion: the page had no ScrollTrigger pin wrappers; explicit keyboard rotation still worked.
- WebGL unavailable: a separate browser context denied WebGL initialization. The static can stayed visible and the hint reported that the 360 view was unavailable.
- Horizontal overflow: none at the three tested widths after fixing the People Pulp frame's explicit width.
- Normal-flow browser result: zero uncaught page errors and zero HTTP asset failures.

Browser evidence for this session is in `C:/Users/stark/AppData/Local/Temp/pulp-review/`, including `results.json`, hero/Inside/shop/People screenshots and a mobile order-review screenshot. These temporary files are not runtime dependencies.

## Current limits

- The People Pulp section currently uses an animated arrangement of existing cans. It does not yet contain the lifestyle video shown in the reference. Its film-coming-soon label makes that clear.
- Existing vector-derived can/fruit images and pouring preview remain. Final photography and both video treatments are intentionally deferred to the next media phase.
- Buy now opens a local order review. There are no fabricated prices, payment transactions or placed orders. No backend checkout/account synchronization is connected.
- Touch was tested with browser emulation, not on a physical phone. Other browser engines and device-specific GPU behavior were not tested.
- Vite reports its existing size advisory for the separate Three.js chunk: approximately 516 kB minified / 131 kB gzip. The build succeeds and the renderer is dynamically loaded.
- `check:release` was not run as a successful release gate: it requires the final pouring MP4 and FFmpeg checks. No live deployment was performed.
