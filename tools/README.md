# Tools

None of these are needed to run the order page. They make placeholder art and check the page.

- `smoke-test.js`: the automated check described in CLAUDE.md (Test). Needs Playwright.
- `pack-art.js`: draws the packaging (box of 6, box of 9, cup) into the SVG sprite in `index.html`, seen from the same angle as the donut photos. Run `node tools/pack-art.js` from the repo folder; it also prints suggested `spots` for `config.js`.
- `donuts/`: renders the placeholder donut photos with three.js in headless Chromium.
  1. `cd tools/donuts && npm install`
  2. Serve that folder: `python3 -m http.server 8766`
  3. `node render.js out glazed:101:glazed-1,cream:111:cream-1` (flavor : seed : file name). It writes `-640.webp` and `-288.webp` files plus a contact sheet (`out/sheet.png`).
  4. Copy the ones you like into `assets/donuts/`.

  Flavors, toppings and colors are set near the bottom of `donut.js`. The current photos use seeds glazed 101/202/303, cream 111/212/313, matcha 121/222/323 and pumpkin 131/232/333.
