# PULP

React, Vite, Three.js, GSAP aur Lenis par built fruit-forward cocktail website.

## Local run

Node.js 22.12+ use karo. Project folder mein:

```bash
npm install
npm run dev
```

PowerShell `npm.ps1` block kare to `npm.cmd` use karo. Vite ka printed local URL kholo; `index.html` directly open mat karo.

## Current experience

Page order: Hero → Mascot → HighlightsCarousel → Inside → FlavourRotation → FlavourCards → PickYourPulp → Footer.

- Branded loading screen ke peeche website mount hoti hai. Current images, fonts aur hero/rotation cans ke first 3D frames ready hone par overlay exit hoti hai; exit complete hone tak covered page controls aur scrolling locked rehte hain. Dono scenes ke saare flavour textures pehle GPU par prepare hote hain. Progress settled loading tasks ka count hai. Failed/stalled assets bounded timeout ke baad site ko permanently block nahi karte.
- Hero ka actual 3D can mouse ya horizontal touch drag se 360 rotate hota hai. Direct keyboard rotation removed hai. Vertical touch gesture page scroll karti hai.
- Scroll rotation aur manual rotation add hote hain. WebGL unavailable ho to static can aur availability message aata hai.
- Inside mein all four flavours desktop par row aur 900px/neeche 2×2 grid mein dikhte hain. Hover circular lens se interior reveal karta hai; click, tap, Enter ya Space full interior open/close karte hain. Selection flavour notes update karti hai; Pick this flavour shop mein wahi flavour select karta hai. Interior images conceptual illustrations hain, verified recipe/ingredient information nahi.
- Mascot section ka heading aur character viewport height ke mutabiq fit hote hain. Hero, pouring aur flavour-rotation headings bhi short desktop screens ke liye height caps use karti hain; Inside cans aur spacing width/height dono se size lete hain.
- Pick Your Pulp mein flavour selection, quantity, Add to bag, Buy now review aur favourite heart hain. Your bag/Wishlist tabs item removal, quantity updates aur move-to-bag support karte hain.
- Cart aur wishlist `pulp-shopping` localStorage key mein save hote hain. Invalid stored data safely reset/sanitize hota hai. Per flavour maximum 99 cans hain.
- Buy now native order-review dialog kholta hai. Prices, payment aur actual order submission configured nahi hain.
- Highlights carousel mein three cards hain. First card 640px tak `1st tile mobile.mp4` aur bari screen par `1st tile laptop.mp4` use karta hai, dono ke matching posters ke saath. Second card friends/lifestyle clip `footer-video.mp4` aur third card pehle wali can-opening film `pulp-film.mp4` use karta hai.
- Animations OS ki reduced-motion preference respect karti hain. Explicit manual can rotation available rehti hai.
- Footer ka Pulp o’clock visitor ka local time dikhata hai aur har minute update hota hai.

## Code ownership

Har visual component ki adjacent CSS file hai. Shared colours, fonts aur spacing `src/tokens.css` mein hain. `src/styles.css` global reset/shared primitives rakhti hai. JSX inline style objects use nahi karta; runtime animations GSAP/Three.js control karte hain.

[docs/FILES.md](docs/FILES.md) mein har source file, function/hook, input/output aur dependency ka explanation hai. [VALIDATION.md](VALIDATION.md) current checks aur verification limits record karta hai.

## Media phase

Runtime media paths `src/data/media.js` mein hain. Can/fruit artwork local PNG/WebP files hain; supplied highlights aur footer videos MP4 hain.

- Same filename replace karoge to matching component automatically naya asset use karega.
- Transparent source images `public/media/source` mein rakh kar `npm run assets:optimize` chala sakte ho.
- First Highlights card `media.firstTileDesktopFilm`/`media.firstTileDesktopPoster` aur mobile layout mein `media.firstTileMobileFilm`/`media.firstTileMobilePoster` use karta hai. Breakpoint carousel CSS ke 640px mobile layout se match karta hai; resize par selected source update hota hai.
- Third Highlights card aur film dialog `media.film` use karte hain; card ka preview `media.poster` hai.
- Second Highlights card `media.lifestyleFilm` aur `media.lifestylePoster` use karta hai; video replace karte waqt matching still poster bhi update karo.
- `media.cutaways` har flavour ka interior map karta hai; matching intact aur cutaway canvas dimensions/alpha silhouette same rakhna. Loader four cutaways ko bhi preload karta hai: current total 18 images, font set aur two can scenes mila kar 21 tasks hain.
- `node scripts/create-artwork.mjs --cutaways-only` three added interiors regenerate karta hai aur existing Blood Orange/baqi artwork preserve karta hai. Flag ke baghair script poora bundled artwork regenerate karta hai. Final images add karne ke baad isko casually run mat karna, kyunke generated files replace hote hain.

Detailed media direction [ASSET_PROMPTS.md](ASSET_PROMPTS.md) mein preserved hai.

## Verification and build

```bash
npm run check
npm run build
npm run preview
```

`check` assets, all four intact/cutaway dimension and alpha alignment, eight-section order aur navigation targets validate karta hai. `build` static production files `dist/` mein banata hai. Three.js separate lazy chunk hai; size advisory build failure nahi hai.

`npm run check:release` real pouring film aur FFmpeg/ffprobe require karta hai. Film absent hone ki wajah se is phase mein release check complete nahi hai.

Playwright browser checks 390, 768 aur 1440px par kiye jaate hain. Physical phone testing aur live checkout integration separate work hain. Website deploy karne ke liye Vite build command aur `dist` output directory use karo.
