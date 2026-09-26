# Meagi order page prototype: notes for Claude

Mobile-first order page for Meagi donut balls, built 26 Sep 2026 in a Claude Cowork session. Customers pick donut balls from stall trays (tap, or press-and-hold and drag), drop them into a paper cup, then check out with first name, last name and a PH mobile number. It is a front-end prototype: nothing is sent anywhere yet.

## Who it's for
Meagi (said mee-AH-ghee) is a small pastry business run by teen girls (12–17) in the Philippines. Maai is the adult who runs the project. She wants plain words, short explanations, and questions asked in chat before assumptions are made.

## Decisions
- 6 donut balls per cup, any mix. When a cup is full, a skewer pops in and a fresh cup slides in.
- Sample prices per piece: Golden Hour ₱10, Cream Cheese ₱14, Matcha Cream Cheese ₱16, Pumpkin Spice Cream Cheese ₱16.
- "Golden Hour" is the fancy name for the classic glazed flavor.
- Public repo, published with GitHub Pages.

## Brand rules (Meagi Brand Kit v1.0)
- Colors: Cream #FFF4E3 base (~60%), Meagi Teal #14A6A0 signature (~30%), Chocolate #3B2216 text, Deep Teal #0B6E69 for teal text on cream, Coral Pop #FF6B5A for ONE key thing per screen (here: the Checkout / Place my order button). Sprinkle colors #FFC93C #B49CF4 #FF9EC4 #FFFFFF are for illustrations only.
- Readable pairs: chocolate or deep teal on cream, chocolate on teal, white on teal (big headlines only). Avoid teal, coral or cream text on cream/teal.
- Fonts: Fredoka (headlines), Nunito (text). Prices always in Nunito: Fredoka has no ₱ glyph.
- Mea the mascot: glaze always teal, never sad or angry, never eats donuts. Expressions: happy (everyday), wink (fun), wow (surprises), love (thank-yous). Mea is the brand's face, so no photos of the girls.
- Voice: a fun friend who bakes, playful, warm and clear. Flavor names = fun name + what it is. Max 2 emojis. Always give the facts: price, what's in it, how to order.
- Max 7 sprinkles as decoration on a screen.

## Code map
- `index.html`: all markup. Near the top: an inline SVG sprite (Mea parts, paper cup, wordmark, skewer) and the menu JSON (`id="menu-data"`: flavors, prices, cup size). `app.js` fills the shelf names and prices from that JSON. Edit `index.html` directly; it was generated once from a template, and that build script is not in this repo.
- `styles.css`: design tokens at the top, then sections: buttons, donut ball buttons, hero, marquee, stall/shelves/trays, cup, dock (counter bar), fly layer, order, footer, thank-you, states, responsive.
- `app.js`: one IIFE. Sections: helpers, state, frame loop, cup placement (hero to counter bar by scroll), hero/shelf/marquee scroll effects, Mea eye tracking and speech bubbles, cup rendering, pick + fly + land, full-cup celebration, drag (mouse via pointer events, touch via long-press), UI + order summary, form + thank-you, reveal observers, boot.
- `assets/balls/{glazed|cream|matcha|pumpkin}-{1|2|3}-{640|288}.webp`: 3D-rendered placeholder donut balls (square, transparent, ball about 92% of the frame). Variant 2 has no 640 size.

## Gotchas
- The frame loop sleeps when idle. `tick()` can call `wake()`, so `frame()` must never queue a second requestAnimationFrame (it checks `if (raf) return`).
- Touch drag: a 200 ms press-and-hold starts the drag; `touchmove` listeners on the ball buttons are non-passive so the page doesn't scroll mid-drag. A quick swipe on a ball must still scroll the page.
- Field validation on blur waits 260 ms, so an error line doesn't push the submit button down while it's being tapped.
- The cup pile layout (`SLOTS` in app.js) is designed for exactly 6 balls.
- Respect `prefers-reduced-motion` (the cup starts docked and animations are skipped).

## Test
Serve the folder (`python3 -m http.server`) and check phone widths 360, 390 and 430 px plus desktop: tap, hold-and-drag, swipe on a ball (scrolls, doesn't pick), a two-cup order, form errors, thank-you, "Start a new order". There should be no console errors and no sideways scroll.

## Next steps
- Send orders somewhere (for example a Google Sheet) and show real pickup days and times.
- Swap in real photos and real prices.
- A parent or guardian owns the page and the order inbox.
