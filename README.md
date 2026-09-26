# Meagi · Donut Stall

A mobile-first order page prototype for Meagi donuts. Customers "pick up" donuts from the stall trays, drop them into a box (6 per box), then leave their name and mobile number to place a pre-order.

**Live page:** https://mcosinas.github.io/meagi-order-page-proto/

![Three phone screens: the stall with the open Meagi box, a cream meringue donut being dragged into the box, and the thank-you screen](assets/preview.jpg)

**This is a prototype.** The flavor names are working names, the prices are samples, and the form doesn't send orders anywhere yet.

## How it works

- **Tap** a donut and it flies into your box.
- Or **press and hold** a donut, then **drag** it into the box (on a computer, just drag it).
- Each box holds 6. When a box is full, the lid closes and a fresh box slides in.
- Tap **Checkout**, check your boxes (tap a donut to take it out, or use − and +), enter your name and mobile number, then tap **Place my order**.

The donuts: **Cream Meringue Donut** (yellow cream and a crisp lattice meringue), **Sugar-Coated Donut** (a donut with a hole, rolled in sugar) and **Chocolate Donut Ball** (rolled in sugar, with a chocolate drizzle).

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

**Packaging.** A box holds as many donuts as it has `spots` in `config.js`. The drawings of the boxes and the cup are in `index.html`.

## Photos

The page uses **Meagi Web Photos v3**: your real donuts from the photo shoot.

- **Menu** (the trays, the box, the shelves): the see-through cutouts, framed alike in `assets/menu/`, 400 and 800 px. For a new donut, run `node tools/frame-cutouts.js <cutout.png> assets/menu/<name>` so it sits in the trays and the box like the others.
- **"At the stall today"** sits on the bakery lineup scene (the cream one), whose wall matches the page.
- **"Made by hand"**, just before the order form, shows the real hands-at-work photos and the cooling rack scene.
- **Link previews** (Messenger, Facebook) show the cooling rack photo.

These are in `assets/photos/`. The other photos in the pack (studio shots, the teal versions, the sugar-dusting scene) are ready for later.

## Mea, the mascot

Mea is switched off (`mascot: false`) while the new Mea is being designed, so people who see the page now won't remember the old one. The logo shows just the "meagi" wordmark, the browser icon is the little coral donut from the wordmark, and short tips next to the box stand in for Mea's speech bubbles.

Everything Mea does is still in the code. When the new Mea is ready, swap the Mea drawings in `index.html` (and the icons in `assets/brand/mea/`), then set `mascot: true`.

## Publishing

GitHub Pages publishes the `main` branch to the link above. A change on `main` shows up about a minute later. Your browser may keep the old version for a few minutes, so refresh if you don't see it.

## Brand

Built with the Meagi Brand Kit v1.0: a cream base, Meagi Teal as the signature, chocolate text, and one coral pop per screen (the checkout button). Headlines use Fredoka; text and prices use Nunito, because Fredoka has no ₱ sign.

## Before going live

- Final flavor names and real prices.
- Send orders somewhere (for example a Google Sheet) and show real pickup days and times.
- A parent or guardian should own the page and the order inbox.
