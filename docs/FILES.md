# PULP source guide

Yeh guide har source file ka role, input/output aur dependencies explain karti hai. JSX mein markup aur interaction logic hai; component ki appearance uske saath wali CSS file mein hai. Shared colours, fonts aur spacing `src/tokens.css` mein hain. GSAP sirf runtime animation control karta hai.

## Entry aur configuration

### `index.html`

Browser ka entry document hai. Metadata, favicon, `#root` mount point aur JavaScript-disabled message rakhta hai. `src/main.jsx` ko module ke taur par load karta hai. Koi function ya input nahi; output initial HTML document hai.

### `vite.config.js`

`defineConfig` React aur Tailwind plugins, relative asset base aur dev-server host allowlist configure karta hai. Production build ES2022 target karta hai; Three.js aur GSAP/Lenis alag chunks mein jaate hain. Input Vite build/dev command; output Vite configuration. Dependencies: Vite, React plugin, Tailwind plugin.

### `package.json` / `package-lock.json`

Package metadata, Node version aur npm commands define karte hain. `dev`, `build`, `preview` Vite chalate hain; `check` aur `check:release` asset checks; `assets:optimize` image export chalata hai. Lockfile exact installed dependency versions rakhti hai. Koi application function nahi.

### `playwright.config.js`

`defineConfig` browser test directory, single-worker execution, CI retries aur failure evidence configure karta hai. Three projects 1440×1000, 768×1000 aur mobile/touch 390×844 viewports use karte hain. `PLAYWRIGHT_CHANNEL` installed browser choose kar sakta hai; default Chromium hai. Web-server block strict port 4173 par local Vite start karta hai. Input Playwright command/environment; output browser-run configuration. Dependency: `@playwright/test`.

### `src/main.jsx`

Local fonts, Lenis CSS aur global styles load karta hai. `createRoot` ko HTML ka `#root` milta hai aur woh `App` ko React StrictMode mein render karta hai. StrictMode development mein effect setup/cleanup dobara chala sakta hai, isliye scene aur modal cleanup zaroori hai.

### `src/App.jsx` / `App.css`

`App()` koi props nahi leta. `useSiteLoading` se loading state leta aur `ScrollProvider`, skip link, header aur nine sections return karta hai: Hero, Mascot, HighlightsCarousel, Cutaway, FlavourRotation, FlavourCards, PickYourPulp, PeoplePulp, Footer. Site loader ke peeche mounted rehti hai, taake images, fonts aur can scene prepare ho sakein. `site-content` wrapper reveal tak `inert` aur `aria-hidden` rehta hai; is se covered controls focus/click receive nahi karte. Hero ka readiness callback hook ko aur LoadingScreen ka exit callback reveal action ko milta hai. Reveal tak ScrollProvider ka smooth scroll suspended rehta hai. Selected flavour ID App own karta hai aur Inside/cards ke selection callbacks ko shop se connect karta hai. `App.css` stable scrollbar space reserve karti aur root ke loading attribute par native scrolling rok deti hai. Dependencies: page sections, shared components, ScrollProvider, useSiteLoading aur flavour records.

### `src/tokens.css`

Tailwind font/theme names aur plain CSS variables ka central source hai. Ink, paper, blue/yellow accents, four flavour palettes, typography, panel radius aur spacing define karta hai. `[data-flavour]` blocks se accent, pale colour aur can tilt inherit hote hain. Mobile media query page gutter adjust karti hai. Input DOM theme attributes/viewport; output shared computed CSS values.

### `src/styles.css`

Tailwind aur tokens import karta hai. Reset, base font, focus outline, shared headline/wordmark/pill styles aur subtle background texture rakhta hai. Shared organic shape aur reduced-motion scroll rule bhi yahin hain. Section-specific layout adjacent CSS files mein hai.

## Data aur motion

### `src/data/media.js`

`asset(filename)` filename leta hai aur Vite base ke saath public media URL return karta hai. `media` object cans, cylindrical wrap textures, fruit, mascot aur film assets map karta hai. `canDetails.top` aur `canDetails.bottom` supplied lid/base photographs ke WebP URLs hain; shared 3D model inko circular end surfaces par use karta hai. `cutaways` har flavour ID ko matching conceptual interior URL deta hai; Inside viewer aur loader isi map ko use karte hain. `film` supplied `pulp-film.mp4` ka URL aur `poster` usi video ke first frame ka `pour-poster.webp` URL deta hai; desktop/mobile same source use karte hain. `mascotInteractiveEyes` batata hai ke HTML pupils render hon ya artwork ke painted pupils use hon. Dependencies: Vite `BASE_URL`, `public/media`.

### `src/data/flavours.js`

Four flavour records export karta hai: ID, name, heading lines, description aur renderer colours. Blood Orange ka optional `printBrightness` existing bright scene lights ke andar supplied red print ki appearance tune karta hai; baqi flavours default multiplier 1 use karte hain. Isse page ki theme palette change nahi hoti. Final map `media` se matching can, wrap, fruit aur `interior` URLs attach karta hai. `interior` PeekCan ke cutaway layer ka source hai. Input static records; output reusable `flavours` array. Dependencies: media map; DOM colours central CSS tokens se aate hain.

### `src/lib/animation.js`

GSAP aur ScrollTrigger import/register karta hai, mobile address-bar resize noise ignore karne ki setting lagata hai, aur dono objects export karta hai. Is file ka koi custom function nahi. Baqi motion code isi shared registered instance par depend karta hai.

### `src/context/ScrollContext.jsx`

- Top-level constants wheel scrolling ki duration, anchor scrolling ki duration aur seconds-to-milliseconds conversion define karte hain.
- `resolveScrollTarget(target)` element ya numeric document offset ko unchanged return karta hai. String selector ko DOM element mein resolve karta hai; invalid ya missing selector par `null` return hota hai.
- `ScrollProvider({ children, suspended = false })` Lenis instance own karta aur children ko `{ scrollTo }` service provide karta hai. Loader ke dauran `suspended` startup rokta hai; native OS reduced-motion preference par scrolling instant rehti hai.
- `connectSmoothScroll()` effect zarurat par Lenis create karta aur ScrollTrigger ko scroll events se connect karta hai. `tick(seconds)` GSAP time ko milliseconds mein convert karke Lenis advance karta hai. `handleVisibility()` hidden tab mein Lenis stop aur visible tab mein start karta hai. `disconnectSmoothScroll()` listener, ticker callback aur Lenis release karta hai.
- `scrollToTarget(target, { immediate = false })` resolved target par Lenis se scroll karta hai. Lenis unavailable ho ya OS reduction request kare to native instant scroll use hota hai. Missing destination ignore hoti hai; return value nahi.
- `refreshScrollMeasurements()` fonts ready hone aur next animation frame par measurements refresh karta hai. Inner `refresh()` sirf active effect ke liye ScrollTrigger chalata hai; `cancelRefresh()` pending frame cancel aur late font completion ignore karwata hai.
- Context value memo `scrollTo` stable rehne tak same object rakhta hai. `useScroll()` yeh object return karta hai; provider absent ho to clear error throw karta hai.

Dependencies: React context/hooks, Lenis, `useReducedMotion`, shared GSAP/ScrollTrigger, DOM queries, fonts aur document visibility. Provider visual DOM wrapper render nahi karta, isliye empty CSS file nahi hai.

### `src/hooks/useReducedMotion.js`

- `mediaQuery` native `prefers-reduced-motion: reduce` condition hai.
- `subscribe(onChange)` browser MediaQueryList ke change events ko React callback se connect karta aur `unsubscribe()` cleanup return karta hai.
- `readReducedMotion()` current browser preference ka boolean snapshot return karta hai.
- `useReducedMotion()` bina props ke `useSyncExternalStore` se snapshot aur live changes return karta hai. Stable subscription functions module scope mein hain; hook storage ya DOM attributes mutate nahi karta.

Dependencies: React `useSyncExternalStore` aur browser `matchMedia`. Yeh client-rendered app ka shared accessibility hook hai; CSS wahi native media query directly use karti hai.

### `src/hooks/useVisibility.js`

`useVisibility(ref, rootMargin = '0px')` element ref leta aur boolean visibility return karta hai. IntersectionObserver viewport intersection record karta hai; `update()` isko document visibility ke saath combine karta hai. Effect cleanup observer aur tab-visibility listener remove karta hai. Sections is value se offscreen animation rok sakte hain. Dependencies: React, IntersectionObserver, document visibility API.

### `src/hooks/useFruitParallax.js`

- `createFruitMotion(element, index)` fruit element, depth aur reusable X/Y quick setters ka object return karta hai. `getRepulsion(element, pointerX, pointerY)` pointer se fruit ki distance calculate karke bounded X/Y offset return karta hai.
- `useFruitParallax(sectionRef, { repel = false })` section ref/options leta aur `onPointerMove`, `onPointerLeave` handlers return karta hai.
- `createParallax()` effect OS reduction request na ho to `[data-fruit]` elements ke liye controls banata hai. `destroyParallax()` usi setup ke tweens kill, transforms reset aur ref clear karta hai.
- `onPointerMove(event)` mouse position ko section-relative offset mein convert karta hai. Optional repel mode cursor ke qareeb fruit ko door karta hai. Touch, OS reduced motion, missing section ya zero-size bounds ignore hote hain.
- `onPointerLeave()` fruit offsets ko zero par ease karta hai.

Dependencies: React, `useReducedMotion`, GSAP aur DOM measurements. Decorative movement hai; app state ko mutate nahi karta.

### `src/hooks/useCanSpin.js`

- `useCanSpin(onRotate, enabled)` rotation callback aur availability leta hai. `dragging` boolean aur pointer handlers return karta hai; angle/gesture details refs mein rehti hain.
- `releasePointer(gesture)` existing capture safely release karta hai. `normalizeRotation(rotation)` radians ko one-turn range mein return karta hai; `rotateTo(rotation)` is value ko ref mein save karke `onRotate` ko deta hai.
- Availability effect disabled state par dragging clear karta hai; cleanup pending gesture/capture release karti hai.
- `startDrag(event)` primary left-button/touch pointer ka origin, can width aur starting rotation save karta hai. View buttons se aane wale events ignore karta hai, taake button activation drag capture na kare. Baqi valid gesture par capture set karta hai; programmatic focus nahi karta.
- `moveDrag(event)` horizontal distance ko can width ke mutabiq full-turn fraction banata hai. Small jitter ignore karta hai; vertical touch gesture ko page scrolling ke liye chhor deta hai.
- `endDrag(event)` matching pointer ka capture aur dragging state release karta hai; cancel/lost capture par bhi use hota hai.

Dependencies: React refs/state aur Pointer Events. Free horizontal spin mouse/touch drag se hoti hai; is hook mein keyboard spin handler nahi hai. CanScene ke separate view buttons native keyboard activation support karte hain. OS reduced-motion preference par bhi explicit manual spin available rehti hai.

### `src/hooks/useCanRenderer.js`

- `useCanRenderer(hostRef, poseRef, { allFlavours, interactive, visible })` canvas host, saved pose aur loading options leta hai; `{ sceneRef, status }` return karta hai. Status `loading`, `ready` ya `failed` hota hai.
- Visibility effect active scene ko visibility forward karta hai aur first visit par loading request latch karta hai. Interactive hero immediately load hota hai; first frame offscreen bhi prepare hota hai, taake restored scroll loader ko block na kare.
- Scene effect `loadScene()` ko chalata hai. Yeh factory dynamically import karke one/all flavour records ke saath scene banata hai; saved scroll-plus-drag rotation, tilt, flavour position aur pointer lighting apply karta hai. Cancelled import ka late result ignore hota hai.
- `watchVisibility()` visible tab mein first-frame timeout start karta hai; hidden tab mein timer pause rehta hai. `stopReadinessWatch()` timer aur visibility listener remove karta hai.
- `finishRender()` successful frame par readiness watch stop aur status ready karta hai. `fail()` timeout/import/texture/render failure par setup cancel, GPU scene dispose aur failed status set karta hai.
- `disposeScene()` scene resources release aur matching ref clear karta hai. Effect cleanup pending import/result cancel karke watch aur scene dono release karti hai. Scene instance sirf request/flavour options badalne par recreate hota hai; drag state ya view selection se nahi.

Dependencies: React effects/refs/state, flavour data, dynamic `createCanScene` import, browser timers aur document visibility. Helper callbacks return value nahi dete; `loadScene()` Promise return karta hai.

### `src/hooks/useCanFallback.js`

- `useCanFallback(imageRef, source, enabled)` image ref, current URL aur fallback availability leta hai; `loading`, `ready` ya `unavailable` status return karta hai.
- Enabled effect image load/error listeners aur four-second timeout attach karta hai. Already cached image ki dimensions check karke same readiness path chalata hai.
- `handleLoad()` image decode Promise await karta hai; `handleError()` unavailable result deta hai. `finish(nextStatus)` result exactly once save aur timeout clear karta hai.
- Cleanup listeners/timer remove karti hai aur late decode completion ignore karwati hai.

Dependencies: React effect/state, browser Image decoding aur timers. Yeh hook renderer create ya pose update nahi karta.

### `src/hooks/useSiteLoading.js`

- `imageSources` current cans, four cutaways, wrap textures, fruits, mascot aur pouring poster ke 18 URLs rakhta hai. `totalAssets` inke saath font set aur hero readiness ko mila kar 20 tasks count karta hai. Lid/base photos scene khud load karta hai; hero readiness dono photos ke saath completed frame ka wait karti hai. Cutaways pehle decode hone se initial hover/tap par interior image ka alag fetch wait nahi aata. Video preload list mein nahi hai.
- `preloadImage(source)` URL se browser Image banata aur `decode()` Promise return karta hai, taake asset fetch ke saath display ke liye decode bhi ho.
- `useSiteLoading()` props nahi leta. Settled asset count, hero readiness, short entrance completion aur final reveal state own karta hai.
- Asset effect har image aur `document.fonts.ready` ko `trackAsset(promise)` deta hai. Uska inner `finish()` success, failure ya 12-second timeout par task ko exactly once count karta hai. Percentage completed tasks ka ratio hai, transferred bytes ya successful downloads ka estimate nahi.
- Wahi effect 700ms ki minimum entrance window rakhta hai. Cleanup pending timers clear aur cancelled effect ke late results ignore karta hai; StrictMode remount par count duplicate nahi hota.
- Layout effect root ka `data-loading` attribute reveal state se sync karta hai; App.css is attribute se scroll lock apply karti hai. Cleanup attribute remove karta hai.
- `markCanReady()` hero ke rendered frame ya settled fallback ko record karta hai. `revealSite()` loader ka exit finish hone par final reveal state set karta hai. Dono stable callbacks hain aur return value nahi dete.
- Hook `{ progress, ready, revealed, markCanReady, revealSite }` return karta hai. `ready` tab true hota hai jab saare tracked tasks settle aur minimum entrance complete ho. Failed assets bounded wait ke baad site ko permanently block nahi karte.

Dependencies: React hooks, media URL map, Image decoding, FontFaceSet, browser timers aur document root.

### `src/hooks/useShoppingBag.js`

- `readShoppingBag()` `pulp-shopping` JSON read karta hai. Unknown flavours, non-integer/negative quantities aur invalid wishlist entries drop karta hai; quantities 99 tak clamp aur wishlist deduplicate karta hai. Invalid JSON/storage failure par empty bag return hota hai.
- `useShoppingBag()` state own karta hai; persistence effect har change ko localStorage mein save karta hai. Storage fail ho to current session ka state kaam karta rehta hai.
- `addItem(id, quantity = 1)` valid flavour ki positive integer quantity add karta hai, maximum 99.
- `updateQuantity(id, quantity)` existing quantity replace karta hai; zero/negative par item remove karta hai.
- `toggleFavourite(id)` same canonical wishlist mein flavour add/remove karta hai. Heart aur Wishlist isi state par depend karte hain.
- `moveToBag(id)` saved flavour ka one can bag mein add karta aur wishlist se remove karta hai.
- Derived `totalQuantity` all item counts ka sum hai. Hook items, wishlist, total aur action functions return karta hai; actions return value nahi dete.

Dependencies: React, flavour IDs, localStorage. Backend, payment aur prices is hook ka part nahi hain.

## Shared components

### `src/components/LoadingScreen.jsx` / `LoadingScreen.css`

- `LoadingScreen({ progress, ready, onComplete })` numeric task percentage, readiness flag aur completion callback leta hai; full-screen branded loading overlay return karta hai. Percentage 0–100 range mein clamp/round hoti hai, phir native progress element aur visual count ko milti hai.
- Readiness effect two animation frames ke baad `exiting` set karta hai, taake initial overlay paint ho aur CSS exit transition reliably start ho. Cleanup pending frames cancel karta hai.
- `finishExit(event)` sirf overlay ki own transform/opacity transition completion accept karta hai. Child transitions aur duplicate events ignore karke `onComplete()` exactly once call karta hai; yeh callback overlay unmount aur site unlock karwata hai.
- Markup mein brand artwork, flavour palette, loading status aur progress hain. Decorative content assistive technology se hidden hai; status text readiness par badalta hai, har percentage par announce nahi hota.
- Wordmark header wali shared `wordmark` class aur single PULP text use karta hai. Alag letter wrappers/stagger nahi hain; CSS logo ko smaller responsive size, clear line height aur whole-word opacity entrance deti hai. Percentage body font DM Sans mein hai.
- CSS layout, decorative citrus animation, progress line aur responsive spacing own karti hai. Exit screen ko slide up karta hai; native reduced-motion media query par short opacity transition use hoti hai. Progress data parent deta hai, component fake counter ya extra loading delay create nahi karta.

Dependencies: React refs/state/effects, browser animation frames/transition events, shared design tokens. Loader website readiness decide nahi karta; woh useSiteLoading ka responsibility hai.

### `src/components/AnchorLink.jsx`

- `isModifiedClick(event)` modifier keys ka boolean return karta hai. `opensElsewhere(link)` download ya alternate browsing target detect karta hai; target case-insensitive hai, isliye `_SELF` same page par handle hota hai.
- `decodeId(value)` fragment decode karta hai; malformed escapes par original value return hoti hai. `findDestination(link)` browser-resolved anchor ki origin/path/query ko current page se compare karta hai; matching fragment ID ka element ya `null` return hota hai. URL parsing ke liye duplicate `new URL` object nahi banta.
- `focusDestination(element)` pehle native focus try karta hai. Naturally focusable ya existing `tabindex` wale target ka attribute preserve hota hai. Zarurat par temporary `tabindex="-1"` add hota hai; inner `restoreTabIndex()` blur par is temporary value ko remove karta hai. Focus fail ho to cleanup foran hoti hai; function return value nahi deta.
- `AnchorLink({ href, children, onClick, onNavigate, ...props })` native anchor return karta aur extra HTML props forward karta hai. Inner `handleClick(event)` pehle caller ka `onClick` chalata hai; cancelled, modified, non-primary ya alternate-target navigation native rehti hai. `event.currentTarget` se actual destination read hoti hai. Handled same-page navigation par default cancel, `onNavigate()` call aur ScrollContext se scroll hota hai. URL different ho to `pushState` history entry add karta hai; same destination dobara activate karne se duplicate entry nahi banti. Keyboard activation destination ko focus karti hai.

Dependencies: `AnchorLink.css`, `useScroll`, native anchor URL properties aur browser history/DOM/focus APIs. Koi HTTP request, repository ya user-provided HTML rendering nahi.

### `src/components/AnchorLink.css`

- Shared `.text-link` aur `.underlined-link` block inline flex alignment, medium font weight aur 44px minimum target height define karta hai. Variant blocks apna gap, font size aur underline appearance rakhte hain.
- Direct child spans inline blocks hain. Arrow transition aur hover transform tab apply hote hain jab primary input hover support kare aur OS reduced-motion request na kare.
- `.skip-link` fixed navigation link ko default mein viewport ke upar rakhta hai. `:focus` usko foran visible karta hai; colours central `--paper` aur `--blue` tokens se aate hain. Keyboard outline global `src/styles.css` provide karti hai.
- Mobile media query 767px tak underlined links ka font size 14px karti hai. Baqi dimensions existing visual design preserve karti hain.

Input DOM classes, focus/hover state, native media queries aur viewport hain; output computed presentation hai. Koi function, hook, network request ya data mutation nahi. Dependencies: `AnchorLink.jsx` ka CSS import, `src/tokens.css` aur global styles. Hover capability ka behaviour [CSS Media Queries](https://www.w3.org/TR/mediaqueries-4/#hover) mein defined hai; Context7 is session mein available nahi tha. Current verification results `VALIDATION.md` mein record hote hain.

### `src/components/Header.jsx` / `Header.css`

`Header()` props ke baghair home logo, The good stuff link aur yellow Pick your Pulp shop action return karta hai. Duplicate Our flavours link remove hai; hero ka Explore flavours action catalogue navigation deta hai. CSS absolute top positioning, logo size, yellow shop action aur mobile navigation visibility handle karti hai. Dependencies: AnchorLink, shared wordmark/pill tokens.

### `src/components/ColourRibbon.jsx` / `ColourRibbon.css`

`ColourRibbon({ variant = 'hero' })` hero/mascot/footer SVG path select karta hai. Palette map four offset strokes return karta hai; SVG purely decorative hai. CSS har variant ka position, dimensions, opacity aur mobile sizing own karti hai. Input variant; output inaccessible decorative SVG. Dependencies: static vector paths, shared section positioning.

### `src/components/FloatingFruit.jsx` / `FloatingFruit.css`

`FloatingFruit({ flavour, className = '', eager = false })` mapped fruit image return karta hai. `eager` loading mode control karta hai; wrapper `data-fruit` se parallax hook ko milta hai. Image decorative aur non-draggable hai. CSS fruit drift, offscreen pause aur native reduced-motion rules own karti hai. Dependencies: media map, parent visibility attribute aur browser media queries.

### `src/components/CanScene.jsx` / `CanScene.css`

- `CanScene({ allFlavours = false, interactive = false, className = '', onReady, ref })` 3D scene render karta hai. Interactive hero mount par loading start karta hai; doosri scenes viewport mein aane par load hoti hain. First completed 3D frame visible can banti hai; static image sirf renderer/texture failure par fallback hai. `poseRef` scroll rotation, manual spin, inspection tilt, flavour position aur lighting pointer alag store karta hai.
- `views` Top/Front/Bottom labels aur target X-axis tilt radians define karta hai; `viewMotion` tween duration aur easing rakhta hai. `getSpinHint(status, canSpin)` readiness ke mutabiq one-line drag/loading/unavailable text return karta hai.
- `rotate(rotation)` manual angle save karke base scroll angle ke saath scene ko bhejta hai.
- `changeCanView()` effect selected button ke tilt tak saved pose ko 0.45 seconds mein GSAP se ease karta hai. Inner `updateTilt()` current radians internal scene method ko bhejta hai. Native reduced-motion preference par angle instantly apply hota hai; `stopViewChange()` interrupted/unmounted tween kill karta hai. User selection ke waqt `setView(id)` state change hoti hai; drag aur scroll ke Y-axis angle preserve rehte hain.
- Imperative `setRotation(value)` base angle update karta hai; user spin add rehta hai. `setFlavourPosition(value)` valid range clamp karta aur matching fallback record select karta hai. `setPointer(x, y)` lighting input save/forward karta hai. In methods ka return value nahi.
- Renderer loading/visibility `useCanRenderer` own karta hai; fallback image decoding `useCanFallback` own karta hai. Unavailable fallback CSS se hidden rehta hai.
- Readiness effect rendered canvas ya settled fallback ke baad optional `onReady()` once notify karta hai. `aria-busy` tab tak true rehta hai. Failure ka settled result bhi loader ko exit karne deta hai; readiness hamesha successful WebGL ka claim nahi hai.
- Interactive wrapper labelled group hai, taake native view buttons assistive technology ko available rahein. Noninteractive wrapper labelled image hai. Buttons ready hone tak disabled rehte hain; `aria-pressed` selection batata hai aur keyboard activation native hai. `useCanSpin` horizontal mouse/touch drag deta hai; hidden instructions horizontal drag aur vertical page swipe explain karti hain.
- Hint aur Top/Front/Bottom buttons ek bordered horizontal control bar mein hain. Hint 12px uppercase aur letter-spaced hai; view buttons minimum 44px targets hain. CSS canvas/fallback ke neeche fixed control space reserve karti hai aur blue focus outline, grab/grabbing cursor aur selected view style own karti hai.
- Interactive scene named inline-size container hai. Uski width 420px ya kam ho to container query view buttons hide karti, hint-only bar compact karti aur reserved space reduce karti hai. Noninteractive scenes containment use nahi kartin. `touch-action: pan-y pinch-zoom` native vertical page scroll preserve karta hai. Ready attribute canvas show karta hai; reduced-motion media query transitions disable karti hai.

Dependencies: React, useVisibility, useCanSpin, useCanRenderer, useCanFallback, useReducedMotion, shared GSAP, flavour data aur CSS tokens. Returns JSX plus unchanged optional imperative ref API; inspection tilt scene ka internal control hai.

### `src/components/HeroFlavourPicker.jsx` / `HeroFlavourPicker.css`

- `HeroFlavourPicker({ selectedIndex, onSelect })` selected flavour index aur parent callback leta hai. Four native buttons aur visually hidden live announcement return karta hai; apni selection state nahi rakhta.
- `flavours.map()` har record ka name, flavour-token attribute aur decorative colour dot render karta hai. Button click `onSelect(index)` call karta hai; `aria-pressed` selected index se derive hota hai. Buttons named Choose a flavour group mein hain aur native Enter/Space activation support karte hain.
- Polite, atomic live region current record ka name aur selected message announce karti hai. Iska text wahi selected index use karta hai jo button state ko milta hai.
- CSS centred two-column grid, minimum 44px targets, round dots aur dark-fill/white-text selected state own karti hai. Name aur pressed state colour ke ilawa selection identify karte hain. Foreground/background selection immediately switch hoti hai, taake transition ke darmiyan contrast kam na ho; border 400ms transition use karta hai. Hover pale flavour token use karta hai; reduced motion border transition skip karti hai. Global blue focus ring inherited hai.

Dependencies: flavour records, shared colour/spacing tokens aur parent selection callback. Output JSX hai; renderer, scroll aur tween ownership parent Hero ke paas rehti hai.

### `src/components/FlavourPicker.jsx` / `FlavourPicker.css`

- `FlavourPicker({ selectedId, onSelect })` shop ka selected flavour ID aur parent callback leta hai. Choose your flavour fieldset mein four labelled native radios return karta hai; hero chips se separate component aur CSS classes hain.
- `selectFlavour(event)` changed radio ka string value `onSelect()` ko deta hai; return value nahi. Checked state parent ID se derive hoti hai, isliye shop image aur cart selection same App-owned record use karte hain.
- Har option flavour name, theme attribute aur colour swatch render karta hai. Selected swatch mein ShopIcon check aata hai, taake state colour ke ilawa symbol se bhi clear ho.
- CSS two-column options, selected pale background/border, visually hidden native radios, visible keyboard-focus outline aur responsive label spacing own karti hai. Yellow swatch ka check dark ink use karta hai.

Dependencies: flavour records, ShopIcon, shared tokens aur parent callback. Shop selection IDs send karti hai; HeroFlavourPicker ke numeric renderer indices is contract ko replace nahi karte.

### `src/components/FlavourCard.jsx` / `FlavourCard.css`

- `getPointerTilt(event)` card-relative pointer coordinates se X/Y rotation return karta hai; zero-size card par `null` milta hai.
- `FlavourCard({ flavour, onPickFlavour })` catalogue record aur selection callback leta aur single product card return karta hai. Native reduced-motion request par tilt setup skip hota hai. Effect two GSAP quick setters banata hai; cleanup exact tweens kill, transform clear aur control ref reset karta hai.
- `handlePointerMove(event)` touch/unavailable controls ignore karke calculated tilt apply karta hai. `resetTilt()` dono axes ko zero par ease karta hai. `pickFlavour()` handled AnchorLink navigation par current flavour ID callback ko deta hai; handlers ki return value nahi.
- CSS `nth-of-type` se stack offsets, product/fruit arrangement, theme attributes, mobile layout aur OS reduction par nonsticky positioning own karti hai.

Dependencies: React refs/effects, FloatingFruit, AnchorLink, `useReducedMotion`, `useVisibility`, GSAP aur flavour record.

### `src/components/PeekCan.jsx` / `PeekCan.css`

- `PeekCan({ flavour, selected, onSelect })` flavour record, current selection flag aur selection callback leta hai; native button ke andar SVG can viewer aur label return karta hai. `opened` full interior visibility own karta hai; `lens` temporary hover/focus position hai. Har instance ka `useId()` clip-path ID unique rakhta hai.
- SVG ki 600×1000 coordinate space mein intact image neeche aur matching interior image upar aligned hain. Closed view mein interior circular `clipPath` se limited hota hai; full-open view clip remove karta hai. Lens absent ho to closed interior CSS se invisible rehta hai. Default lens centre `(300, 560)` hai.
- `moveLens(event)` touch ya already opened can ignore karta hai. SVG ka `getScreenCTM()` inverse aur `DOMPoint` screen pointer ko artwork coordinates mein convert karte hain, isliye responsive sizes par reveal cursor ke saath aligned rehta hai. X/Y bounded range mein clamp hote hain; unavailable matrix par update skip hoti hai.
- `focusLens(event)` native `:focus-visible` focus par centre lens show karta hai. `clearLens()` hover/focus preview clear karta hai; pointer leave, blur aur full-view toggle isko call karte hain.
- `toggleInterior()` local open state reverse, lens clear aur `onSelect(flavour)` call karta hai. Mouse click, touch tap, Enter aur Space native button activation se same path use karte hain. Har can independently open reh sakta hai; selected record parent ke notes/CTA control karta hai.
- Button ka action label aur `aria-pressed` open state reflect karte hain; `aria-controls` shared flavour notes se relation deta hai. SVG decorative hai. Label name, Peek inside/Close view action aur plus/minus icon show karta hai.
- CSS section-provided `--inside-can-height` ke andar 3:5 image ratio preserve karti hai. Lens outline, reveal opacity, selected flavour underline, button states, touch scrolling aur visible keyboard focus bhi yahin hain. Native reduced-motion media query par transitions disabled hain.

Dependencies: React ID/ref/state hooks, SVG image/clipPath, DOMPoint and SVG coordinate transform APIs, flavour media record, parent callback aur shared tokens. Cutaway conceptual artwork hai; actual recipe ya ingredients ki verification nahi.

### `src/components/ShopIcon.jsx` / `ShopIcon.css`

`ShopIcon({ name })` static path map se bag, heart, arrow, check ya close SVG return karta hai. Input icon key; output decorative SVG. CSS common size, stroke aur layout behavior define karti hai. No network, icon library ya state dependency.

### `src/components/QuantityControl.jsx` / `QuantityControl.css`

`QuantityControl({ quantity, onChange, label = 'Quantity' })` decrease button, count output aur increase button return karta hai. Click handlers parent ko next integer dete hain; boundary 1 aur 99 par relevant button disable hota hai. CSS pill stepper, target sizes aur disabled colours own karti hai. Dependencies: `maximumQuantity`, parent callback. State parent ke paas hai.

### `src/components/ShoppingBag.jsx` / `ShoppingBag.css`

- `ShoppingBag({ bag, onReview, onStatus })` bag/wishlist tabs, visible item list aur footer return karta hai. `bag` hook ka state/actions object hai; callbacks review open aur status announce karte hain.
- Derived flavour lists current bag quantities/wishlist IDs ko full flavour records se match karti hain.
- `changeTab(event)` arrow/Home/End keys se selected tab aur keyboard focus update karta hai.
- `removeFlavour(flavour)` current tab ke mutabiq bag item ya favourite remove karta hai, status announce aur relevant tab focus karta hai.
- `moveFlavour(flavour)` bag cap check karta hai, wishlist se one can bag mein move karta hai aur bag tab focus karta hai.
- Quantity callbacks same hook ko updated item counts dete hain. Empty panels honest empty-state copy dikhate hain.
- CSS tabs, product rows, empty state, action controls aur mobile stacking own karti hai.

Dependencies: React refs/state, flavours, QuantityControl, ShopIcon, shopping hook contract. No separate duplicate wishlist state.

### `src/components/OrderReview.jsx` / `OrderReview.css`

`OrderReview({ items, onClose })` selected `{ flavour, quantity }` records leta hai aur native modal dialog return karta hai. Derived total quantities sum karta hai. Effect `showModal()` se dialog kholta aur cleanup mein close karta hai. `closeReview()` pehle native dialog close karta hai taake opener ka focus restore ho, phir parent callback ko state clear karne deta hai. `cancelReview(event)` Escape ka default intercept karke wahi close path use karta hai. `data-lenis-prevent` dialog scrolling ko background smooth scroll se isolate karta hai. CSS dialog/backdrop, selected items, summary aur mobile dimensions style karti hai. Dependencies: React, HTMLDialogElement, ShopIcon. Yeh review hai; payment, price ya placed-order result invent nahi karta.

## Page sections

### `src/sections/Hero.jsx` / `Hero.css`

- `heroMotion` flavour tween timing/easing, responsive travel ratios, scroll distance, one-turn radians aur text transition timing ko ek named block mein rakhta hai.
- `Hero({ onReady })` intro, second statement, exactly one interactive can, four flavour chips aur decorative rainbow return karta hai. Optional readiness callback CanScene ko forward hota hai; refs section, product, can handle aur current fractional flavour position track karte hain. `active` state root `data-flavour`, selected chip aur announcement ka source hai. CanScene ko `allFlavours` milta hai, taake ref indices 0 se 3 accept kare.
- `changeHeroFlavour()` layout effect current fractional position ko selected index tak 600ms mein tween karta hai. Inner `updateFlavour()` current value existing `setFlavourPosition()` ref method ko bhejta hai, jisse renderer adjacent textures cross-fade karta hai. Reduced motion ya already-matching position par value immediately apply hoti hai. Cleanup previous tween kill karti hai; rapid click naya tween current position se start karta hai.
- Chips hero flavour ke sole owner hain, including scroll ke dauran. `animateHeroOnScroll()` sirf stage movement, base Y rotation aur text visibility own karta hai; flavour position write nahi karta. Later FlavourRotation apni separate CanScene/ref own karta hai, isliye hero selection ko overwrite nahi karta.
- `animateHeroOnScroll()` OS reduction par pointer lighting centre karke timeline skip karta hai. Default mein pinned timeline can ko move/spin, intro ko hide aur second statement ko reveal karti hai. Inner `getProductOffset()` responsive travel ko available left space tak clamp karke pixel offset return karta hai, taake chips scroll end par page gutter ke bahar na niklein. `updateCanRotation()` current tween angle scene ko bhejta hai.
- `resetHeroAnimation()` GSAP context revert aur base can rotation reset karta hai. `handlePointerMove(event)` mouse/pen-relative can lighting apply karta hai; touch, reduced motion aur zero-size section ignore hote hain. `handlePointerLeave()` lighting centre karta hai. Hero se floating fruits aur unka parallax wiring remove hain; shared fruit component doosre sections mein rehta hai.
- CSS responsive framing, can-plus-picker grid aur noninteractive second heading own karti hai. Native reduced-motion media query fixed static positions mein dono messages ke liye taller hero reserve karti hai. Mobile spacing can controls/chips aur footer ko alag jagah deti hai; width aur `svh` font caps responsive headline size control karte hain.
- Colour rules existing `--flavour-colour`/`--flavour-pale` tokens consume karti hain. `--hero-accent` 40% flavour aur 60% ink mix karta hai, taake yellow flavour par bhi punctuation aur white CTA text readable rahein. Dark Explore flavours pill ka hover theme follow karta hai. Hero-scoped selection pale background aur dark text use karti hai; nav colours, blue focus ring aur rainbow palette unaffected hain. User feedback ke baad hero background plain paper white hai; moving blob ka markup aur CSS remove hain.
- Punctuation aur CTA ke colour/border changes shared 400ms duration se transition hote hain; reduced motion mein immediate hain. Hero background animate nahi hota.

Dependencies: CanScene, HeroFlavourPicker, ColourRibbon, AnchorLink, flavours, React state/refs/layout effects, `useReducedMotion`, `useVisibility` aur GSAP. Component JSX return karta hai; interaction/update handlers return value nahi dete. Canvas resize/render logic is section mein change nahi hoti.

### `src/sections/Mascot.jsx` / `Mascot.css`

- `createEyeMotion(pupil)` GSAP X/Y quick setters return karta hai. `getPointerOffset(pointer, start, size)` face-relative distance ko -1 se 1 range mein clamp karke number return karta hai.
- `Mascot()` bina props ke heading, smiling character, optional pupils aur fruits return karta hai. `createMascotMotion()` OS reduced-motion request na ho to head/eye controls create karta hai; `destroyMascotMotion()` exact tweens aur transforms cleanup karta hai.
- `handlePointerMove(event)` fruit repulsion chalata aur available controls par head/eye positions update karta hai; touch ignore hoti hai. `handlePointerLeave()` fruit, head aur pupils ko centre karta hai. Handlers return value nahi dete.
- CSS heading/stage ki two-row grid, viewport-aware character size, capped heading, fruit placement aur mobile spacing own karti hai.

Dependencies: media paths, shared fruit/ribbon components, `useReducedMotion`, visibility/parallax hooks aur GSAP.

### `src/sections/HighlightsCarousel.jsx`

- `defaultSlides` existing four IDs, headings aur video/poster URLs ka fallback array hai. Filhaal har card `media.film` aur `media.poster` use karta hai. `FAILED_VIDEO_DELAY_MS` failed-video skip delay, `MIN_VISIBLE_RATIO` minimum playback visibility aur `VISIBILITY_THRESHOLDS` observer ke five crossing points define karte hain.
- `HighlightsCarousel({ slides })` optional non-empty array leta hai; har record ka unique `id`, `title`, `videoSrc` aur optional `posterSrc` hota hai. Omitted ya empty array par `defaultSlides` use hota hai. Component heading, supplied video cards, controls, status aur film dialog return karta hai. `selectedIndex` requested selection hai; derived `index` list shrink par available last item tak clamp hota hai. `playing` playback intent, `inView` viewport eligibility, reveal flags entrance, `filmOpen` dialog aur `failed` video URLs ki failure state hain. Refs DOM elements aur previous index rakhte hain; gesture state `useCarouselDrag` own karta hai.
- `running` tab true hai jab playback requested ho, carousel ka kam az kam 20% actual viewport mein ho, section/tab visible ho aur film dialog band ho. `controlsVisible` wahi conditions playback intent ke baghair use karta hai, isliye Pause karne ke baad controls available rehte hain.
- `advanceSlide(direction)` positive/negative step leta aur functional state update se next index wrap karta hai. List shrink ke baad current index pehle clamp hota hai. Yeh automatic video-end path hai; playback intent change nahi karta. `useCallback` function identity ko `slideCount` badalne tak stable rakhta hai. Return value nahi.
- `respectMotionPreference()` effect native reduced-motion boolean badalne par autoplay intent reset karta hai. Reduced motion mein initial video paused hai; user Play se explicitly chala sakta hai.
- `revealContent()` effect heading aur stage ko IntersectionObserver se observe karta hai. Lower viewport boundary 12% inset aur threshold `0.1` hain. Intersecting target ka reveal flag true karke us target ko unobserve karta hai; isliye entrance har scroll par repeat nahi hoti. Cleanup observer disconnect karta hai.
- `observeCarouselVisibility()` stage ko `rootMargin: '0px'` aur `[0, 0.2, 0.5, 0.8, 1]` thresholds se observe karta hai. Callback `isIntersecting` aur `intersectionRatio >= 0.2` se `inView` update karta hai; height calculation, threshold-building loop aur window resize listener nahi hain. Cleanup observer disconnect karta hai. Browser viewport resizing khud observer mein reflect karta hai.
- `centerActiveSlide()` effect current card ko horizontal viewport mein centre karta hai, isliye slide count four tak limited nahi. Inner `centerSlide(behavior)` card offset aur viewport/card widths se scroll offset nikal kar native `scrollTo` call karta hai. Normal navigation browser-managed smooth scroll aur reduced motion instant scroll use karti hai. `handleResize()` width actually badalne par instant recenter karta hai; ResizeObserver ki initial notification smooth navigation interrupt nahi karti. Cleanup resize observer disconnect karta hai. Input selected index, count aur motion preference; output DOM scroll position hai, inline CSS nahi.
- `synchronizePlayback()` effect current index, `running` aur active record ke ID/source se native videos sync karta hai. Isliye same index par prop ka video replace hone par bhi playback synchronize hoti hai. Inactive videos pause hote hain; newly selected card time zero se start hota hai. Active video sirf `running` par play hoti hai; blocked autoplay ke current `NotAllowedError` par intent false hota hai. `stopPlayback()` late rejected request ignore karwata aur active video pause karta hai. Manual pause/resume same card ki current position retain karta hai.
- `synchronizeProgress()` effect ka `updateProgress()` active video's `currentTime / duration` native progress element ki value mein likhta hai; inactive ya unknown-duration value zero hai. Playing ke dauran next animation frame request hota hai. Cleanup pending frame cancel karta hai; React ko har video frame par rerender nahi karwata.
- `skipFailedVideo()` effect failed active URL ko running state mein `FAILED_VIDEO_DELAY_MS` (2500ms) ke baad `advanceSlide(1)` deta hai. Pause par timer nahi chalta; current list ke saare sources failed hon to skipping rukti hai. URL-based failure records prop reorder/replacement ko unrelated index ki failure inherit nahi karwate. Cleanup timer clear karta hai.
- `synchronizeFilmDialog()` effect `filmOpen` ko native `showModal()`/`close()` se sync karta hai. Film khulne par carousel ka derived `running` false ho jata hai; close hone par pehle wala playback intent apply hota hai.
- `chooseSlide(nextIndex)` requested numeric index ko positive modulo se wrap karta aur `playing` false karta hai. Arrows, dots, neighboring card click, keyboard aur extracted swipe hook isi manual path par hain. `useCallback` identity `slideCount` par depend karti hai; memoization khud DOM children ke rerenders guarantee nahi rokti. Return value nahi.
- `handleKeyDown(event)` focused carousel par ArrowLeft/ArrowRight ko previous/next selection mein convert karta aur browser ka default horizontal action rokta hai. Baqi keys unchanged rehti hain; return value nahi.
- `preloadFor(slideIndex)` card index leta aur preload string return karta hai: revealed active card ke liye `auto`, active/adjacent cards ke liye `metadata`, baqi ke liye `none`.
- Heading block film-open action deta hai. Stage focusable carousel region hai; track ka `data-index` selected position expose karta hai. Slide map native muted inline videos, posters aur headings banata hai. Video/progress ref callbacks element save karke cleanup function return karte hain; cleanup corresponding array slot null karta hai, including StrictMode replay aur removed items. `onEnded` sirf running active slide advance karta, `onError` failed source URL record karta hai. Neighbor click hook ke `hasDragged()` se accidental swipe-click ignore karta hai.
- Controls block Pause/Play intent toggle, direct slide buttons aur previous/next arrows deta hai. Hidden controls `inert` hain, isliye invisible buttons Tab order mein nahi aate. Status manual navigation par politely announce hota hai; autoplay mein repeated announcements off hain. Video failure par status alternate card choose karne ko kehta hai.
- Dialog block close button, backdrop click aur native close/Escape se state clear karta hai. Film open ho tabhi native controls wali video mount hoti hai; close par unmount se playback stop hoti hai.

Dependencies: React state/ref/effect/callback hooks, `media`, `useCarouselDrag`, `useReducedMotion`, `useVisibility`, adjacent CSS, IntersectionObserver, ResizeObserver, HTMLMediaElement, HTMLDialogElement aur browser animation frames/timers. Component JSX return karta hai; effects cleanup functions return karte hain jahan resources attach hue hain. [React ref callback cleanup](https://react.dev/reference/react-dom/components/common#ref-callback), [useCallback](https://react.dev/reference/react/useCallback) aur [MDN IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver) official references hain; Context7 is session mein available nahi tha.

### `src/hooks/useCarouselDrag.js`

- `SWIPE_THRESHOLD_PX` (50) completed swipe ki minimum travel aur `DRAG_ACTIVATION_DISTANCE_PX` (10) horizontal gesture activation define karte hain.
- `useCarouselDrag(index, chooseSlide)` current index aur manual selection callback leta hai. Internal ref pointer ID, origin, active flag aur movement flag store karta hai; pointer movement React rerenders nahi karwata. Output memoized handlers aur `hasDragged` query ka object hai.
- `startDrag(event)` primary left-button/touch pointer ka origin save karta hai. `moveDrag(event)` same active pointer ki horizontal travel check karta hai; released pointer aur vertical/small movement ignore hote hain. Valid drag pointer capture karta hai.
- `endDrag(event)` gesture finish karta hai. Threshold cross hone par direction ke mutabiq index plus/minus one `chooseSlide` ko deta hai aur capture release karta hai. Callback current index aur selection function par depend karta hai.
- `cancelDrag(event)` stored gesture clear aur remaining capture release karta hai. `hasDragged()` movement flag ka boolean return karta hai taake swipe ke baad neighbor click suppress ho. Baqi handlers ki return value nahi.

Dependencies: React `useRef`/`useCallback` aur browser Pointer Events. Hook DOM markup ya styling return nahi karta.

### `src/sections/HighlightsCarousel.css`

`.hl` ke top par tuning values hain. Input component classes, viewport aur OS motion preference; output responsive layout aur transitions hain. Shared colours/fonts/spacing `src/tokens.css` se aate hain; file mein application functions nahi.

| Variable | Kya control karti hai |
| --- | --- |
| `--hl-space-top` | Highlights section ke upar ka padding. |
| `--hl-space-bottom` | Video section ke baad ka padding input; local spacing edits retained hain. Chhota gap tune karne ke liye `.hl` mein `32px` set kar sakte ho. |
| `--hl-heading-gap` | Heading aur video ke darmiyan vertical distance. |
| `--hl-card-w`, `--hl-card-h` | Card width/height; width se neighboring cards ka visible peek bhi change hota hai. |
| `--hl-gap` | Cards ke darmiyan horizontal gap; next section ka vertical gap nahi. |
| `--hl-radius` | Video card corner radius. |
| `--hl-ctl` | Pause button aur control pills ki height. |
| `--hl-pip`, `--hl-pip-active` | Normal dot ka size aur selected progress pill ki width. |
| `--hl-heading-duration` | Heading fade/rise, current `700ms`. |
| `--hl-card-duration`, `--hl-card-delay` | Cards fade/rise `850ms`, entrance delay `220ms`. |
| `--hl-chip-duration` | Control chip fade/rise/scale, current `700ms`. |
| `--hl-ease` | Main transform transitions ka easing curve. |

- Heading block layout, responsive typography aur 32px fade/rise define karta hai; `is-visible` ya keyboard focus par reveal hota hai. Film action orange theme token aur hover underline use karta hai.
- Stage relative positioning rakhta hai. Viewport block overflow clip, native vertical touch scrolling/pinch zoom aur 40px card fade/rise handle karta hai. Track relative flex row hai; before/after spacer pseudo-elements first aur last card ko centre tak scroll hone ki jagah dete hain. Positioning native horizontal scroll offset se hoti hai; per-index CSS selectors aur inline styles nahi. Smooth-scroll duration browser choose karta hai, old fixed 900ms transform duration ab apply nahi hoti.
- Slide/video blocks rounded crop, full-cover video aur heading contrast gradient own karte hain. Sirf active slide ki title visible rehti hai; neighbors click targets hain.
- Desktop controls viewport ke bottom par fixed, centred aur safe-area aware hain; tablet/mobile par neeche wali media query unko video ke andar bound karti hai. Hidden state 28px lower, scale `0.88`, invisible aur noninteractive hai. Visible state 80ms delay ke baad ease hoti hai; frosted backgrounds pehle aur icons/dots baad mein show hote hain. Dot stagger `180ms`, `250ms`, `320ms`, `390ms` hai; pause/arrow icons `180ms` par enter hote hain. Hide opacity shorter `250ms` hai.
- Button/pill blocks blur, hover, press feedback aur touch target sizes set karte hain. Selected pip wider hota hai; native progress pseudo-elements Chrome aur Firefox mein actual media progress draw karte hain. `hl__status` visually hidden announcement ko layout se bahar rakhta hai.
- Dialog blocks video sizing, dimmed blurred backdrop aur close target style karte hain. Focus-visible rules stage aur buttons ko visible keyboard outline deti hain.
- 1024px media query card dimensions, gap, radius aur controls adjust karti hai. Stage grid ban jata hai aur viewport/controls same cell share karte hain. Chip `position: sticky`, `align-self: end` aur `--space-md` bottom margin use karta hai; inherited bottom inset `24px` plus safe area rehta hai. Is se tablet/mobile chip video ke andar rehta aur next heading cover nahi karta. 640px query taller portrait cards, smaller control pills, stacked header aur narrow spacing use karti hai. Native reduced-motion query durations ko `1ms`, delays ko zero aur content reveal ko immediately visible karti hai.

Gap ka remaining hissa next `Cutaway.css` ki `.inside-section` se bhi aata hai: `min-height: 100svh` aur `justify-content: center` content ko full viewport height mein vertically centre karte hain. Sirf `--hl-space-bottom` kam karne se woh centring space remove nahi hoti. Cutaway layout is update mein change nahi hua.

Motion timing supplied Apple recording ke sampled frames se approximate ki gayi hai: chip roughly `0.7s`, heading `0.6–0.7s`, aur next card heading ke around `200–300ms` baad reveal hota hai. Yeh observed visual estimates hain, Apple source ke exact values nahi. Reference ka “Take a closer look” pattern yahan Highlights heading aur uske cards par apply hai.

### `src/sections/PouringFilm.jsx` / `PouringFilm.css`

Legacy section hai; current `App.jsx` isko mount nahi karta. Mounted film carousel ab `HighlightsCarousel` hai. Neeche retained implementation ka behavior documented hai.

- `filmMotion` scroll distance, frame expansion duration aur heading travel/duration ke constants rakhta hai.
- `PouringFilm()` bina props ke supplied can-opening video, headings aur playback button return karta hai. `running` viewport/tab visibility aur requested playback ka combination hai; `videoPlaying` actual native playback events se aata hai. Video muted, inline aur looping hai; `preload="none"` offscreen film ka initial download avoid karta hai. First-frame poster site loader ki image list mein hai, video nahi.
- `resetPlaybackPreference()` OS preference badalne par autoplay intent sync karta hai. Reduced motion par film poster par rukti hai; user Play film se playback start kar sakta hai. `requestPlayback(video)` native play request deta hai; inner `handleRejection()` superseded request ignore karta aur current rejection par playing state clear karta hai. `pausePlayback(video)` pending request invalidate aur video pause karta hai.
- `synchronizePlayback()` visible playback intent ko video se sync karta hai; section offscreen ya tab hidden hone par playback pause hoti hai. `preparePlaybackCleanup()` mounted video capture karta aur `stopPlayback()` replacement/unmount par usko pause karta hai.
- `animateFilmOnScroll()` OS reduction par skip hota hai; existing pinned timeline frame expand aur headings move karti hai. `resetFilmAnimation()` timeline revert karta hai.
- `togglePlayback()` actual paused state ke mutabiq user gesture mein video start/pause aur intent update karta hai. `handlePlay()` aur `handlePause()` native events ko button label/pressed state mein reflect karte hain. `handleVideoError()` pending requests invalidate karke same film ke poster aur `Film unavailable` status ko show karta hai. In handlers ki return value nahi.
- CSS window/headings, controls, responsive dimensions aur native reduced-motion layout own karti hai. `object-fit: contain` complete landscape film aur uska text mobile par bhi visible rakhta hai; spare frame space dark rehti hai. Illustrated can/glass fallback aur decorative droplets/ripple remove hain. Title ke width/height caps short viewports mein frame ke liye space rakhte hain.

Dependencies: React hooks, media paths, `useReducedMotion`, `useVisibility`, GSAP aur browser video API. Visibility hook viewport intersection aur `document.hidden` dono handle karta hai; component separate tab listener nahi banata.

### `src/sections/Cutaway.jsx` / `Cutaway.css`

- `Cutaway()` four-flavour Inside gallery return karta hai. Selected flavour state Blood Orange se start hoti hai. Har `PeekCan` ko flavour, matching selection flag aur `setSelectedFlavour` callback milta hai; can open/close action notes aur CTA ka current record update karta hai. Visibility hook section entrance animation control karta hai.
- `pickFlavour(event)` modified clicks ignore karta hai, otherwise `pulp:select-flavour` event mein selected ID dispatch karta hai. AnchorLink phir shop tak scroll karta hai. Live notes selected flavour ka existing name/description show karti hain.
- CSS centered heading/instructions, can gallery aur notes/CTA row own karti hai. Desktop four columns hain; 900px aur neeche two columns. Title, spacing aur `--inside-can-height` viewport height se limited hain. Section minimum height one small viewport hai; content ko fixed height mein crop nahi karta.
- Circular hover reveal aur click/tap/keyboard full interior view har flavour ke PeekCan mein hai. Existing Blood Orange cutaway aur three added matching illustrations use hoti hain. Yeh conceptual visuals hain, verified formulation ya ingredient information nahi.

Dependencies: React refs/state, flavours, PeekCan, AnchorLink, useVisibility. No props; output Inside section aur selected-flavour notes hain.

### `src/sections/FlavourRotation.jsx` / `FlavourRotation.css`

- `getFlavourScrollPosition(trigger, index)` current trigger range se flavour ka document offset return karta hai. First/last offsets pin interval ke ek pixel andar rehte hain.
- `FlavourRotation()` bina props ke current flavour, can, fruit aur selection buttons return karta hai. Active record/state, scene handle aur ScrollTrigger refs own karta hai.
- `animateFlavoursOnScroll()` default mein progress ko flavour position aur rotations se map karta hai. Inner `updateCan()` tween se scene update karta aur rounded index change par React label update karta hai. Native OS reduction par current flavour seedha scene ko milta aur rotation reset hoti hai.
- `stopFlavourAnimation()` disposed flag set, trigger ref clear aur timeline revert karta hai. `chooseFlavour(index)` active timeline ke matching position par `scrollTo` call karta hai; reduced-motion layout mein state aur scene seedha update hote hain. Handlers ki return value nahi.
- CSS theme blob, scene, heading/counter, fruit aur controls own karti hai. Hover animation native media queries se gated hai; desktop/tablet title height cap can controls ke liye jagah rakhti hai.

Dependencies: flavour data, CanScene, FloatingFruit, `useScroll`, `useReducedMotion`, `useVisibility` aur GSAP. Current catalogue mein four flavours hain.

### `src/sections/FlavourCards.jsx` / `FlavourCards.css`

`FlavourCards()` no props leta hai; `flavours` ko individual `FlavourCard` components mein map karta hai. Section `#flavours` navigation destination hai. CSS sirf section spacing own karti hai; each card ka behavior/appearance FlavourCard pair mein hai.

### `src/sections/PickYourPulp.jsx` / `PickYourPulp.css`

- `PickYourPulp()` selected flavour ID, picker quantity, status message aur optional review snapshot own karta hai. `useShoppingBag` se persistent collection milti hai. Returns full shopping section.
- Selection effect ka `receiveFlavour(event)` valid external flavour ID accept karta hai; quantity one aur status empty reset karta hai. Cleanup listener remove karta hai.
- `chooseFlavour(id)` radio selection update aur picker reset karta hai.
- `addToBag()` remaining per-flavour capacity calculate karta hai, correct quantity add karta hai aur exact result announce karta hai.
- `toggleFavourite()` same wishlist toggle karta hai aur resulting save/remove status batata hai.
- `reviewBag()` current bag records ka snapshot banata hai; `buyNow()` only selected flavour/quantity ka snapshot banata hai. Dono modal state set karte hain, order submit nahi karte.
- JSX large product image/fruit, native flavour radio labels, quantity, cart/favourite actions, ShoppingBag aur optional OrderReview compose karta hai.
- CSS reference-inspired two-column layout, pale circle, theme selection states, product entrance, pill buttons aur mobile stacking own karti hai.

Dependencies: React, flavours, useShoppingBag, AnchorLink, quantity/bag/review/icon components. No required props, no external commerce integration.

### `src/sections/PeoplePulp.jsx` / `PeoplePulp.css`

`PeoplePulp()` bina props ke heading, rounded preview frame, four can images aur caption return karta hai. `paused` local playback control hai; `playing` OS reduced-motion preference, section visibility aur pause state combine karta hai. `playbackAction` button label deta hai. `togglePlayback()` pause state reverse karta hai aur return value nahi deta. OS reduction par automatic preview playback aur uska decorative control render nahi hote. CSS staggered can sway, green frame, typography aur mobile composition own karti hai; hidden/paused preview animate nahi hota. Dependencies: React, flavours, `useReducedMotion`, `useVisibility`. Supplied lifestyle video abhi pending hai; current frame artwork preview hai.

### `src/sections/Footer.jsx` / `Footer.css`

- `minuteInMilliseconds` timer interval ka named constant hai. Module-level `clockFormatter` visitor ke local timezone mein hour/minute ko 12-hour format mein convert karta hai.
- `Footer()` bina props ke invitation, shop CTA, wordmark, fruit, copyright year, Pulp o'clock local-time display aur back-to-top link return karta hai. `now` current Date state hai; formatted time aur year isi snapshot se derive hote hain. `useVisibility` fruit animation ke liye footer visibility deta hai.
- `syncClock()` effect single recursive timeout start karta hai. Inner `scheduleTick()` next minute boundary ka delay calculate karta hai. Timeout ka `updateClock()` fresh Date set karke agla tick schedule karta hai; `stopClock()` unmount par pending timeout clear karta hai. Functions return value nahi dete.
- Native `time` element readable local time, ISO `dateTime` aur descriptive accessible label rakhta hai. Har minute screen-reader announcement force nahi hoti. CSS local-time digits ke liye tabular numerals aur shared colour/spacing tokens use karti hai; narrow screens par bottom row two columns mein fit hoti hai.
- Footer CTA ka hover displacement hover-capable input aur default OS animation preference par available hai; native reduced-motion query transitions remove karti hai.

Dependencies: React state/effect/ref hooks, Intl.DateTimeFormat, Date/browser timers, AnchorLink, FloatingFruit, ColourRibbon aur `useVisibility`.

## Three.js renderer

### `src/three/createCanScene.js`

- `createCanScene(host, flavours, { onReady, onError })` host element, supported flavour records aur lifecycle callbacks leta hai. Renderer, scene, lighting, model aur contact shadow assemble karta hai; control methods aur `dispose` ka object return karta hai. Mesh/material construction `createCanModel` mein hai.
- `configureRenderer(renderer, host)` capped pixel ratio, transparent output, colour space aur tone mapping set karke canvas host mein append karta hai; return value nahi. `createCamera()` configured perspective camera return karta hai.
- `createEnvironment(renderer)` RoomEnvironment se PMREM lighting texture target return karta hai; temporary room/generator finally block mein dispose hote hain. `addLights(scene)` hemisphere aur directional lights attach karke movable key light return karta hai.
- `createShadow(track)` small radial CanvasTexture, material aur plane geometry tracker ko deta hai; horizontal soft-shadow mesh return karta hai. Missing 2D context par error throw karta hai.
- `track(resource)` disposable resource register karke wahi resource return karta hai. `dispose()` pending frame, observer, listeners, all tracked GPU resources, renderer aur canvas release karta hai; repeat disposal safely ignore hoti hai.
- `fail(error)` scene dispose karke `onError(error)` call karta hai. `handleContextLost(event)` browser event prevent karke same failure path use karta hai.
- `render()` pending frame clear karta hai; disposed/offscreen/hidden scene ya missing wrap/lid/base textures par draw skip karta hai. Successful complete first frame `onReady()` exactly once call karta hai.
- `invalidate()` zarurat par single animation frame schedule karta hai; permanent idle render loop nahi hai.
- `setFlavourPosition(nextPosition)` valid range clamp karke neighboring records/textures aur blend amount model ko deta hai, phir redraw request karta hai.
- `loadTextures()` shared `media.canDetails` photographs aur supported flavour wraps load karta hai. End-photo callbacks sRGB/anisotropy set karke `model.setEndTexture(side, texture)` call karte hain. Per-flavour `finishTexture(texture)` wrap save karke current blend dobara apply karta hai. Late texture disposed scene mein release hoti hai; any load failure same `fail` path use karti hai.
- `resize()` host dimensions se camera aspect/render size update karta hai; ResizeObserver isko call karta hai. Canvas resize purana drawing buffer clear karta hai, isliye pending animation frame cancel karke `render()` isi callback mein draw karta hai. Pin/unpin par fractional dimensions badlein to browser ko beech mein blank canvas paint karne ka gap nahi milta. Disposed, hidden aur texture-loading checks `render()` mein rehte hain; function koi argument ya return value nahi rakhta.
- `setRotation(rotation)` model ka Y angle aur `setTilt(tilt)` X angle radians mein set karte hain. `setPointer(x, y)` key-light position change karta hai. `setVisible(value)` offscreen pending frame cancel ya redraw request karta hai. In setters ki return value nahi; document visible hone par bhi redraw request hoti hai.

Dependencies: Three.js, RoomEnvironment, createCanModel, media map, browser Canvas/WebGL/ResizeObserver. Scene graphics values renderer ka part hain; page CSS-in-JS nahi.

### `src/three/createCanModel.js`

- `createLabelMaterial(track)` tracked MeshStandardMaterial aur shared blend uniforms return karta hai. `blendFlavourLabels(shader)` shader compilation par current/next wrap samplers aur blend amount attach karta hai; `flavourShader` dono texture colours mix karta hai. Cache-key callback is shader variant ka stable ID return karta hai.
- `addCanEnds(addMesh, silver, endMaterials)` silver side walls/rims aur top/bottom CircleGeometry surfaces add karta hai; return value nahi. Dono end faces opposite outward directions mein rotate hote hain.
- `createBodyGeometry()` radius/height profile ko LatheGeometry mein revolve karke continuous body aur curved shoulders banata hai. UV ki vertical coordinate actual vertex height se normalize hoti hai, taake wrap shoulder aur straight body par continuous rahe; solid-colour shoulder bands ki zarurat nahi. Input nahi; output geometry hai.
- `createCanModel(track)` resource-tracking callback leta hai. Continuous printed body, silver rims aur photographic ends ka group banata hai; `{ group, setFlavour, setEndTexture, hasLabel }` return karta hai.
- Inner `addMesh(geometry, material, height = 0)` geometry track karke mesh group mein add karta aur mesh return karta hai. Body UV orientation flat wrap ka centre logo front par rakhti hai. Group ka starting Z tilt presentation pose deta hai.
- `setEndTexture(side, texture)` supplied top/bottom image ki centre-circle region ko UV repeat/offset se select karta hai. White background circular geometry ke bahar sample nahi hota. End material par map assign karke update request karta hai; photograph ki existing metallic shading MeshBasicMaterial aur disabled tone mapping se preserve hoti hai. Yeh end detail photo hai, raised pull-tab geometry nahi.
- `setFlavour(currentFlavour, nextFlavour, currentTexture, nextTexture, amount)` available wrap maps/uniforms update karta hai; first map par material compilation request hoti hai. Dono records ka `printBrightness` (default 1) interpolate karke material colour multiplier aur environment intensity set karta hai. Missing next texture par current texture retained rehti hai.
- `hasLabel()` true tab return karta hai jab body map aur dono end maps assigned hon. Yeh first frame ko partly textured can dikhane se rokta hai.

Dependencies: Three.js geometry/material/colour types, caller ka disposable-resource tracker, supplied wrap/end textures aur flavour records. Lighting, texture downloads, RAF scheduling aur renderer lifecycle is module ke bahar hain.

## Asset aur validation scripts

### `src/components/HeroFlavourPicker.test.jsx`

- Single Vitest/Testing Library integration test actual Hero ko React StrictMode mein render karta hai. Scene mock same three ref methods expose karta hai aur `allFlavours` input record karta hai; reduced motion aur visibility mocks test ko deterministic banate hain. AnchorLink native anchor mock use karta hai; animation module stub unused scroll setup ko load karne se rokta hai.
- `expectSelection(index, id, name)` all four pressed states, hero `data-flavour` aur live-region text compare karta hai. Test initial selection ke baad pointer click, Tab/Enter aur Tab/Space se remaining flavours choose karta aur renderer ref ko matching index milna assert karta hai.
- Console warn/error guards test ke dauran unexpected diagnostics reject karte hain. `afterEach()` rendered tree clean karta aur spies/call history restore karta hai.

Input mocked browser hooks aur user interactions; output assertions hain. Dependencies: Vitest, Testing Library, user-event, React StrictMode aur Hero. Yeh test `src` component-test suite mein hai; `tests/` change nahi hota.

### `tests/browser/website.spec.js`

- Extended `test` fixture ka `watchPageErrors({ page }, use, testInfo)` page errors collect karta hai, test body ko `use()` se run karwata hai aur otherwise-successful test par empty error list assert karta hai. Fixture har test par automatically apply hoti hai.
- `openWebsite(page)` local page load karke loader exit aur interactive content ka wait karta hai. `expectNoHorizontalOverflow(page)` document scroll/client widths compare karke one-pixel tolerance assert karta hai. Dono helpers Promise return karte hain jo successful completion par resolve hoti hai.
- Loading block texture request ko temporary gate karta hai, background inertness check karta hai aur disabled CSS transitions ke saath eventual reveal exercise karta hai. Manual-rotation block desktop mouse ya mobile CDP touch input se canvas change aur pointer cleanup verify karta hai.
- Interior block four cans ki hover/click/keyboard interaction aur matching shop selection exercise karta hai. Shopping block quantities, localStorage reload, wishlist tabs, move-to-bag aur dialog close/focus return check karta hai; status assertion explicit shopping message ko target karti hai.
- OS-preference block native media emulation se static/pinned layouts ki live cleanup/recreation aur shopping usability check karta hai. Failure block storage access aur WebGL initialization deny karke fallback/readiness aur shopping exercise karta hai.
- Viewport block skip-link focus, section heights, overflow aur section screenshots handle karta hai. Footer block deterministic browser clock se displayed local time, minute update, semantic timestamp, layout aur footer screenshot check karta hai.
- Anchor blocks browser Back/Forward, duplicate-entry avoidance, temporary tabindex cleanup, supplied tabindex preservation aur native navigation cases exercise karte hain. Synthetic click cases modifier keys, alternate targets, downloads, external/missing destinations, uppercase `_SELF` aur cancelled clicks cover karte hain.

Input configured Playwright page/context/viewport fixtures; output assertions aur test artifacts hain. Dependencies: `@playwright/test`, local Vite app, native browser APIs. Yeh source guide coverage describe karti hai; actual run results `VALIDATION.md` mein hain.

### `scripts/check-project.mjs`

Command-line validation script hai. `assetPath(name)` media absolute path return karta hai; `read(name)` project text read karne ka Promise return karta hai. Main blocks four flavours ke can/fruit/wrap/cutaway dimensions aur required transparency verify karte hain. Har cutaway ki width/height matching intact can se equal honi chahiye; extracted alpha pixels ka mean absolute difference one level se kam hona chahiye, taake SVG overlay silhouette align rahe. Baqi blocks nine-section order aur internal navigation targets validate karte hain. Section lookup component name ki boundary match karta hai, isliye Hero jaise section ke props order check ko break nahi karte. `--release` block configured pouring film ka ffprobe data validate karta hai: H264, yuv420p, 3840×2160, expected duration aur no audio. Output console PASS/NOTE ya assertion failure hai. Dependencies: Node fs/path/assert/child_process, sharp; release ke liye FFmpeg. Real video absent hone par release check intentionally fail karega.

### `scripts/optimize-assets.mjs`

Main block `public/media/source` ke supported image files read karta hai. Per-file loop filename se export width choose karke rotation metadata normalize aur high-quality WebP write karta hai. Canvas trim/crop nahi hoti, isliye can/cutaway alignment preserved rehti hai. Input source images; output public media WebPs aur console paths. Dependencies: Node fs/path/url, sharp. Yeh runtime app ka part nahi.

### `scripts/create-artwork.mjs`

Bundled illustrations generate/regenerate karne ka utility hai. Har mode supplied Blood Orange can, full wrap, model-exported cutaway aur film poster preserve karta hai; inki old vector illustrations regenerate nahi hoti.

- `wordmark(x, y, width, height, colour)` lettering SVG ko requested box/colour mein wrap karke SVG string return karta hai.
- `svg(width, height, contents)` artwork contents ko complete SVG document string mein wrap karta hai.
- `citrus(x, y, radius, lime, id)` orange/lime slice ke segmented vector paths return karta hai.
- `berry(x, y, r, id)` shaded blueberry vector group return karta hai.
- `leaf(x, y, scale, rotation)` positioned leaf vector group return karta hai.
- `passion(x, y, r, id)` seeded passionfruit cut-face return karta hai.
- `fruitGroup(slug)` flavour ID ke mutabiq combined fruit vectors return karta hai.
- `interiorColours` three illustrated flavours ke conceptual liquid, surface aur pulp colours map karta hai; yeh product formulation data nahi.
- `canContents(slug, name, colour, ink, interior = false)` Passionfruit Yuzu, Blueberry aur Lime Basil ka can artwork ya conceptual interior SVG contents return karta hai. Interior branch flavour palette, ice-like shapes aur matching fruit artwork compose karti hai. Intact aur interior same body clip/rims use karte hain, taake reveal edges align rahein.
- `save(name, artwork, width)` original SVG aur resized transparent WebP disk par write karta hai; Promise return karta hai.
- `--cutaways-only` mode sirf three illustrated flavour interiors export karke exit hota hai. Full mode mein bhi Blood Orange cutaway skip rehta hai.
- Full mode three illustrated cans/wraps/cutaways, all four floating-fruit images, mascot aur favicon export karta hai. Blood Orange fruit illustration preserve nahi, regenerate hoti hai; yeh flat supplied can artwork se alag decorative asset hai. Film poster generation aur `--poster-only` mode remove hain, isliye generator chalane se supplied film ka first-frame poster replace nahi hota.

Dependencies: Node fs/path/url, sharp aur `scripts/pulp-lettering.svg`. Output SVG/WebP files aur console status hain.

### `scripts/export-blood-orange.mjs`

- Command-line script current 3D model se 900x1500 transparent Blood Orange can aur matching conceptual interior WebPs export karta hai. `PULP_PREVIEW_URL` running Vite server choose karta hai; default localhost port 5173 hai. Optional `PULP_CHROME_PATH` installed browser executable choose karta hai.
- `createInterior(fruit)` base64 floating-fruit image leta hai aur ice shapes, orange liquid aur pulp marks ka SVG wrap string return karta hai. Yeh conceptual inside artwork hai; original supplied can photograph ka edit ya real recipe scan nahi.
- Main block fruit read karta, interior data URL banata, headless browser launch karke Vite page open karta hai. `page.evaluate(interiorSource)` current Three.js, RoomEnvironment, model, flavours aur media modules browser mein load karta hai.
- Browser setup transparent renderer, fixed orthographic camera, same environment/lights aur upright model banata hai. Local `track(resource)` resources register karke wahi object return karta hai.
- `loadTexture(source)` URL/data URL ko sRGB texture mein load karta, anisotropy configure karta aur tracked texture ka Promise return karta hai. Body, top, bottom aur conceptual interior concurrently load hote hain.
- `capture()` synchronous render karke canvas PNG ka base64 payload return karta hai. Pehli capture supplied full wrap use karti hai; doosri sirf body map ko conceptual interior se replace karti hai. Geometry, camera aur end surfaces same rehne se dimensions aur alpha silhouette aligned rehti hain.
- Browser `finally` GPU resources release karta hai. Node export loop PNG payloads ko high-quality WebP mein `blood-orange-can.webp` aur `blood-orange-cutaway.webp` par write karta hai. Outer `finally` browser close karta hai, including failed export.

Dependencies: Node fs/path/url, Playwright Chromium, sharp, running Vite server, current createCanModel/flavours/media modules aur supplied runtime textures. Output static can/cutaway files hain; script website bundle ka hissa nahi. Actual dimension/alpha checks `scripts/check-project.mjs` mein hain.

### `scripts/pulp-lettering.svg`

Vector PULP wordmark paths hain. Generator inko scalable lettering ke taur par embed karta hai. Koi functions nahi; input SVG consumer ka requested box/colour, output rendered wordmark geometry.

### `public/favicon.svg` aur `public/media/vectors/*.svg`

Favicon tab icon hai. Media vectors three illustrated flavours ke cans/wraps/cutaways, all four floating-fruit groups aur mascot ke editable originals hain. Old Blood Orange can/wrap/cutaway vectors aur illustrated pouring-poster vector current design ka source nahi hain aur remove kiye gaye hain. In files mein application functions/hooks nahi; SVG elements artwork describe karte hain.

### `public/media/blood-orange-*.webp`, `can-top.webp` aur `can-bottom.webp`

`blood-orange-wrap.webp` latest supplied full flat artwork ka optimized export hai: centred PULP front aur side/rear product panels ek cylindrical texture mein hain. Text as supplied retained hai, including small generated copy errors; yeh verified packaging data nahi. Earlier plain front-only wrap aur standalone rear mockup runtime sources nahi hain. Lid/base WebPs supplied straight-on photographs ke optimized exports hain; model UV selection white backgrounds ko circular surfaces se bahar rakhti hai.

`blood-orange-can.webp` aur `blood-orange-cutaway.webp` current textured 3D model se export hote hain. Static can first black-background front photograph ka exact cutout nahi hai; latest flat wrap, shared geometry aur supplied end photos se bana render hai. Dono exports same camera/geometry use karte hain, isliye Inside viewer mein silhouettes match karti hain. `blood-orange-fruit.webp` separate decorative vector export rehta hai. Other flavours ke WebPs existing illustration generator se aate hain. Koi application function nahi; media map in assets ko consume karta hai.

### `public/media/pulp-film.mp4` aur `pour-poster.webp`

`pulp-film.mp4` supplied can-opening/splash clip ki unchanged copy hai: 1920x1080, lagbhag 5.97 seconds aur 5,117,528 bytes. Original audio track file mein retained hai; carousel videos muted hain aur separately opened film dialog native playback/audio controls deta hai. `pour-poster.webp` isi film ka 1920x1080 first-frame export hai; loading, reduced-motion initial state aur video failure par same visual identity rakhta hai. Yeh real media assets hain, generator ki can/glass illustration nahi. Koi application functions nahi; `media` map, mounted HighlightsCarousel aur retained legacy PouringFilm inko consume karte hain.

## References aur current limits

Can texture mapping ke liye official [Texture](https://threejs.org/docs/pages/Texture.html), [CircleGeometry](https://threejs.org/docs/pages/CircleGeometry.html) aur [MeshStandardMaterial](https://threejs.org/docs/pages/MeshStandardMaterial.html) references use hue. Photo UV selection texture offset/repeat se hoti hai; body label physically lit material par render hoti hai.

Context7 is session mein available nahi tha; APIs official docs se verify ki gayi: [React effect setup/cleanup](https://react.dev/reference/react/useEffect), [native modal dialogs](https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/showModal), [pointer capture](https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture), [touch-action](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/touch-action), aur [Playwright viewport/touch emulation](https://playwright.dev/docs/emulation).

Cart/wishlist local browser mein save hote hain; account sync, prices, checkout/payment aur real order submission configured nahi. Blood Orange supplied artwork ab model aur static exports mein integrated hai; remaining flavours illustrated assets use karte hain. Supplied can-opening film HighlightsCarousel ke current four records mein shared source hai. Actual verification results `VALIDATION.md` mein hain.

Loading lifecycle ke liye [image decoding](https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/decode), [font readiness](https://developer.mozilla.org/en-US/docs/Web/API/FontFaceSet/ready) aur [inert content](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inert) official references hain. Can ka free horizontal spin [Pointer Events](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events) use karta hai; Top/Front/Bottom native buttons keyboard se bhi activate hote hain. Browser ka normal keyboard page scroll existing scroll-driven animation ko still update kar sakta hai.

Peek viewer ke coordinate conversion aur masking ke liye [SVG getScreenCTM](https://developer.mozilla.org/en-US/docs/Web/API/SVGGraphicsElement/getScreenCTM) aur [SVG clipPath](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/clipPath) use hue. Viewport sizing ke [CSS length units](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/length) reference mein `svh` small viewport height represent karta hai. Interior art conceptual hai; actual ingredients, quantities ya recipe ka claim nahi karta.
