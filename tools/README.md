# Tools

None of these are needed to run the order page. They prepare photos and drawings for it, and check it.

- `smoke-test.js`: the automated check described in CLAUDE.md (Test). Needs Playwright.
- `frame-cutouts.js`: frames a see-through product photo for the menu like the others (donut 88% of the width, centered a little below the middle) and writes the 400 and 800 px WebP files: `node tools/frame-cutouts.js <cutout.png> assets/menu/<name>`. Add `--mirror` for a flipped copy (variety on the trays). Needs Playwright.
- `pack-art.js`: draws the packaging (box of 6, box of 9, cup) into the SVG sprite in `index.html`, seen from the same angle as the donut photos. Run `node tools/pack-art.js` from the repo folder; it also prints suggested `spots` for `config.js`.
- `donuts/`: renders 3D placeholder donut photos with three.js in headless Chromium (the menu now uses real photos; this is for trying a flavor before it has photos).
  1. `cd tools/donuts && npm install`
  2. Serve that folder: `python3 -m http.server 8766`
  3. `node render.js out glazed:101:glazed-1,cream:111:cream-1` (flavor : seed : file name). It writes `-640.webp` and `-288.webp` files plus a contact sheet (`out/sheet.png`).
  4. Copy the ones you like into `assets/menu/` and point the flavor's photos at them in `config.js`.

  Flavors, toppings and colors are set near the bottom of `donut.js`. The earlier placeholders used seeds glazed 101/202/303, cream 111/212/313, matcha 121/222/323 and pumpkin 131/232/333.
