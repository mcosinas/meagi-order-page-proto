# Meagi · Donut Stall

A mobile-first order page prototype for Meagi donuts. Customers "pick up" donuts from the stall trays, drop them into a box (6 per box), then leave their name and mobile number to place a pre-order.

**Live page:** https://mcosinas.github.io/meagi-order-page-proto/

![Three phone screens: the stall with the open Meagi box, a matcha donut being dragged into the box, and the thank-you screen](assets/preview.jpg)

**This is a prototype.** Prices are samples, the donut pictures are 3D-rendered placeholders, and the form doesn't send orders anywhere yet.

## How it works

- **Tap** a donut and it flies into your box.
- Or **press and hold** a donut, then **drag** it into the box (on a computer, just drag it).
- Each box holds 6. When a box is full, the lid closes and a fresh box slides in.
- Tap **Checkout**, check your boxes (tap a donut to take it out, or use − and +), enter your name and mobile number, then tap **Place my order**.

The flavors: **Golden Hour** (classic glazed, a donut with a hole), **Cream Cheese**, **Matcha Cream Cheese** and **Pumpkin Spice Cream Cheese** (donuts without a hole).

## Change things

Almost everything is in **`config.js`**. Open it, change the words or numbers, save, and refresh the page. Keep the quotes and commas as they are.

| What | Where in `config.js` |
|---|---|
| Flavor names, descriptions, prices | `flavors` |
| Donut photos | `flavors` → `photos`, `heroPhoto`, `shelfPhoto` |
| Donut shape: with a hole, without a hole, or donut ball | `flavors` → `shape`: `'with-hole'`, `'no-hole'` or `'ball'` |
| Packaging: box of 6, box of 9, or cup of donut balls | `packaging`: `'box6'`, `'box9'` or `'cup'` |
| Show or hide Mea the mascot | `mascot`: `true` or `false` |
| Colors and fonts | `styles.css`, in the list at the top |

The words on the page follow the packaging and the shapes by themselves. With the cup it says "Fill your cup" and "donut balls"; with a box it says "Fill your box" and "donuts".

**Donut photos.** Square pictures with a transparent background, the donut in the middle filling about 90% of the width. Each flavor has 3 small ones (288 px, for the trays and the box) and 2 big ones (640 px). The placeholders are in `assets/donuts/`, and the donut ball ones are in `assets/balls/`.

**Packaging.** A box holds as many donuts as it has `spots` in `config.js`. The drawings of the boxes and the cup are in `index.html`.

## Mea, the mascot

Mea is switched off (`mascot: false`) while the new Mea is being designed, so people who see the page now won't remember the old one. The logo shows just the "meagi" wordmark, the browser icon is the little coral donut from the wordmark, and short tips next to the box stand in for Mea's speech bubbles.

Everything Mea does is still in the code. When the new Mea is ready, swap the Mea drawings in `index.html` (and the icons in `assets/brand/mea/`), then set `mascot: true`.

## Publishing

GitHub Pages publishes the `main` branch to the link above. A change on `main` shows up about a minute later. Your browser may keep the old version for a few minutes, so refresh if you don't see it.

## Brand

Built with the Meagi Brand Kit v1.0: a cream base, Meagi Teal as the signature, chocolate text, and one coral pop per screen (the checkout button). Headlines use Fredoka; text and prices use Nunito, because Fredoka has no ₱ sign.

## Before going live

- Send orders somewhere (for example a Google Sheet) and show real pickup days and times.
- Swap in real photos and real prices.
- A parent or guardian should own the page and the order inbox.
