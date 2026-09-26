# Meagi order page prototype: notes for Claude

Mobile-first order page for Meagi donuts, built 26 Sep 2026 in a Claude Cowork session, then moved to this repo. Customers pick donuts from stall trays (tap, or press-and-hold and drag), drop them into a box, then check out with first name, last name and a PH mobile number. It is a front-end prototype: nothing is sent anywhere yet. Live at https://mcosinas.github.io/meagi-order-page-proto/ (GitHub Pages, from `main`).

## Who it's for
Meagi (said mee-AH-ghee) is a small pastry business run by teen girls (12–17) in the Philippines. Maai is the adult who runs the project. She wants plain words, short explanations, and questions asked in chat before assumptions are made.

## Brand kit
The full kit is in Maai's Google Drive, in the folder "Meagi Brand Kit": 00 Approach & Plan, 01 Findings, 02 Brand Core, 03 Brand Voice and 04 Style Guide (the rules). The logo files, the Mea files and the picture version (Meagi_Brand_Guide.pdf) are in a separate Brand Kit zip that is not in Drive; ask Maai for it when a change needs them. The rules below are the parts this page uses.

## Decisions
- Everything the shop sells is set in `config.js`: per flavor the name, what it is, word, description, price, shape, dot color and photos; the words for each shape; the packaging types; the mascot switch. Keep it editable by a non-developer: plain comments, no logic.
- Shapes: `with-hole`, `no-hole` and `ball`.
- Menu (27 Sep): Maai's real donuts from the photo shoot, in this order: Cream Meringue Donut (`no-hole`, yellow cream + crisp lattice meringue), Sugar-Coated Donut (`with-hole`, rolled in sugar) and Chocolate Donut Ball (`ball`, rolled in sugar, chocolate drizzle). Maai chose to let the donut ball go in the box too, so both boxes hold `ball`. The names are working names; descriptions only say what the photos show.
- Packaging: `box6` (rectangular, 6 donuts, used now), `box9` (square, 9 donuts) and `cup` (clear plastic iced-coffee cup, 6 donut balls). A packaging holds as many pieces as it has `spots`. When it is full, a box closes its lid (the cup gets a skewer), then a fresh one slides in.
- The page's words ("box", "donuts", "Fill your box", "Every box holds 6 donuts") come from config through `data-t` spans and app.js, so switching packaging or shapes needs no copy edits.
- Sample prices per piece: Cream Meringue Donut ₱16, Sugar-Coated Donut ₱10, Chocolate Donut Ball ₱12 (real prices to come).
- Mea is switched off (`mascot: false`) while the new Mea is designed. While it is off, Mea must not show anywhere: that includes the logo (wordmark only) and the tab and home-screen icons (the coral mini donut from the wordmark). All Mea code and art stays for the return: swap the Mea symbols in index.html and the icons in `assets/brand/mea/`, then set `mascot: true`.
- Public repo, published with GitHub Pages from `main`.

## Photos (Meagi Web Photos v3, 27 Sep)
- The donuts are real photos from the 13 Sep shoot; the tables, walls and baking tools are computer-made (3D). No toppings were added, so the photos only promise what customers get. Keep it that way: never describe or show a topping a donut doesn't have.
- Hands only, no faces. No coral in the photos (coral stays for the one key button).
- Menu photos: the pack's see-through cutouts, re-framed with `tools/frame-cutouts.js` into `assets/menu/` (400 and 800 px). Flavors with one photo also get a mirrored copy for variety on the trays.
- `assets/photos/`: the bakery lineup scene (cream) behind "At the stall today", the "Made by hand" strip before the order form (three real process photos and the cooling rack scene), and the link-preview image (`og:image`).
- The rest of the pack (studio shots, teal versions, the sugar-dusting scene) is not in the repo yet; ask Maai for the zip if a change needs it.

## Brand rules (Meagi Brand Kit v1.0)
- Colors: Cream #FFF4E3 base (~60%), Meagi Teal #14A6A0 signature (~30%), Chocolate #3B2216 text, Deep Teal #0B6E69 for teal text on cream, Coral Pop #FF6B5A for ONE key thing per screen (here: the Checkout / Place my order button). Sprinkle colors #FFC93C #B49CF4 #FF9EC4 #FFFFFF are for illustrations only.
- Readable pairs: chocolate or deep teal on cream, chocolate on teal, white on teal (big headlines only). Avoid teal, coral or cream text on cream/teal.
- Fonts: Fredoka (headlines), Nunito (text). Prices always in Nunito Black: Fredoka has no ₱ glyph.
- Logo: use the kit's drawings (the wordmarks are in the sprite); never retype "meagi" in a font. Main logo at least 140 px wide on screens.
- Mea the mascot: glaze always teal, never sad or angry, never eats donuts. Expressions: happy (everyday), wink (fun), wow (surprises), love (thank-yous). Mea is the brand's face, so no photos of the girls.
- Voice: a fun friend who bakes, playful, warm and clear. Flavor names = fun name + what it is. Max 2 emojis (🍩 ✨ 🩵). Always give the facts: price, what's in it, how to order. Use: soft, fluffy, loaded, fresh, made by hand, merienda, a little surprising. Avoid: "cheap" (say "sulit" or "great value"), ALL CAPS, "best in the world", "DM for price".
- Safety: never show a home address, school, uniform or the girls' full names.
- Max 7 sprinkles as decoration on a screen.

## Code map
- `config.js`: the settings above. Loaded in `<head>` without `defer`, so the mascot class, the mascot icons and the photo preloads are set before the page draws.
- `index.html`: markup, plus link-preview tags in `<head>`. Near the top: an inline SVG sprite (Mea parts, wordmarks `wm-ink` and `wm-white`, mini donut, icons, and the packaging drawings `box6-*`, `box9-*`, `cup-*`). The floating hero donuts and the shelves with their trays are built by app.js from config (with fewer than 4 flavors, the extra hero donuts use each flavor's next photo). Static photo sections: `.stall-intro` (photo behind the stall heading) and `.made` ("Made by hand"). `data-t` spans (`pack`, `packs`, `item`, `items`, `size`, `count`, `countword`) get their words from config; a capitalized key gives a capitalized word. `data-mascot` elements show only with the mascot on, `data-no-mascot` only with it off.
- `styles.css`: design tokens at the top, then sections: buttons, pickable donuts, hero, marquee, stall (photo intro, shelves, trays), packaging, dock (counter bar) with bubbles and tips, fly layer, made by hand, order, footer, thank-you, states, responsive. `--pack-ratio`, `--pack-w` and `--hinge` are set by app.js.
- `app.js`: one IIFE. Sections: helpers, settings, build the page from config, state, frame loop, packaging placement (hero to counter bar by scroll), hero/shelf/marquee scroll effects, Mea eye tracking and speech (tips when the mascot is off), packaging rendering, pick + fly + land, full packaging (lid or skewer, then the swap), drag (mouse via pointer events, touch via long-press), UI + order summary, form + thank-you, reveal observers, boot.
- Packaging drawings are layers: `*-lid-open` (boxes), `*-back`, the pieces, `*-front`, then `*-lid` (boxes) or `*-topper` (cup). The symbol's viewBox gives the shape; `data-hinge` on `*-lid` is where the lid folds (percent from the top).
- `assets/menu/`: the menu photos (square, see-through, donut 88% of the width, centered a little below the middle). `assets/photos/`: the scene and process photos.
- `assets/brand/`: tab and home-screen icons (coral mini donut); `assets/brand/mea/`: the Mea versions.
- `tools/`: `frame-cutouts.js` frames a new cutout for the menu, `pack-art.js` draws the packaging symbols into index.html, `smoke-test.js` is the automated test below, `donuts/` renders 3D placeholder donuts (for trying a flavor before it has photos). See `tools/README.md`.

## Gotchas
- The frame loop sleeps when idle. `tick()` can call `wake()`, so `frame()` must never queue a second requestAnimationFrame (it checks `if (raf) return`).
- Touch drag: a 200 ms press-and-hold starts the drag; `touchmove` listeners on the donut buttons are non-passive so the page doesn't scroll mid-drag. A quick swipe on a donut must still scroll the page.
- Field validation on blur waits 260 ms, so an error line doesn't push the submit button down while it's being tapped.
- Menu photos must be framed like the others (`tools/frame-cutouts.js`): the box spots assume the donut is centered in its square; a donut sitting low hides behind the box's front wall.
- `.stall-intro` gets an explicit `height`. With `aspect-ratio` plus `max-height`, the browser narrows the section instead and the photo stops short of the right edge.
- `spots` are designed for their drawing. If a packaging drawing changes, re-check its spots (`node tools/pack-art.js` prints suggestions; the ones in config are a little bigger so the donuts look packed).
- `.pack-items` has `isolation: isolate`, so the front of the packaging stays in front of the pieces (pieces carry z-indexes).
- When a full box is swapped for a fresh one, `.is-swapping` turns transitions off so the new lid doesn't animate open.
- A `data-t` span inside a flex container (like `.hint`) must sit inside one wrapping span, or each bit of text becomes its own flex item.
- Respect `prefers-reduced-motion` (the packaging starts docked and animations are skipped).

## Test
Serve the folder (`python3 -m http.server 8765`) and run `node tools/smoke-test.js` (needs Playwright), then `box9`, `cup` and `mascot` for the other settings. It checks phone widths 360, 390 and 430 px plus desktop: tap, touch hold-and-drag, a swipe on a donut (must not pick it), keyboard, mouse drag, a full box plus one more, form errors, thank-you, "Start a new order", reduced motion, no console errors and no sideways scroll. A look on a real phone is still worth it.

## Next steps
- The new Mea, then `mascot: true`.
- Send orders somewhere (for example a Google Sheet) and show real pickup days and times.
- Final flavor names and real prices.
- A parent or guardian owns the page and the order inbox.
