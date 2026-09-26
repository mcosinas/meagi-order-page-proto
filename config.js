/* Meagi order page: settings.
   Everything you can change without touching the rest of the code lives here:
   the flavors (name, description, price, photos, shape), the packaging, and the mascot.
   Edit, save, then refresh the page. Keep the quotes and commas as they are. */
window.MEAGI = {

  // Show Mea the mascot? false while the new Mea is being designed.
  // Set it to true to bring Mea back everywhere: the header, the counter bar, the empty order,
  // the thank-you screen, the logo and the speech bubbles.
  mascot: false,

  // The packaging this page sells in: 'box6', 'box9' or 'cup' (see packagingTypes below).
  packaging: 'box6',

  // ------------------------------------------------------------------ flavors
  // In the order they appear on the page. The first ones also float at the top of the page.
  // The names are working names and the prices are samples: change them here.
  // shape: 'with-hole' (a donut with a hole), 'no-hole' (a donut without a hole) or 'ball' (a donut ball).
  // photos: square pictures, about 400 px, see-through background, donut in the middle filling about
  //   90% of the width with its bottom near the bottom edge. Used on the trays and in the box, in turn.
  // heroPhoto / shelfPhoto: the same kind of picture at about 800 px, for the big spots.
  // The photos are the real donuts from the photo shoot (Meagi Web Photos v3), framed alike in assets/menu/.
  flavors: [
    {
      id: 'meringue',                   // short code: small letters, no spaces
      name: 'Cream Meringue Donut',     // name (working name)
      what: 'Yellow cream + meringue',  // what it is (small line above the name)
      word: 'Meringue',                 // big faded word behind the shelf photo
      desc: 'A soft donut topped with yellow cream and a crisp lattice meringue.',
      price: 16,                        // pesos per piece (sample)
      shape: 'no-hole',
      color: '#F4C542',                 // this flavor's dot in the counter bar
      photos: [
        'assets/menu/cream-meringue-1-400.webp',
        'assets/menu/cream-meringue-2-400.webp',
      ],
      heroPhoto: 'assets/menu/cream-meringue-1-800.webp',
      shelfPhoto: 'assets/menu/cream-meringue-2-800.webp',
    },
    {
      id: 'sugar',
      name: 'Sugar-Coated Donut',
      what: 'Classic, rolled in sugar',
      word: 'Sugar',
      desc: 'A soft donut rolled in sugar all over.',
      price: 10,
      shape: 'with-hole',
      color: '#9A5B2E',
      photos: [
        'assets/menu/sugar-donut-1-400.webp',
        'assets/menu/sugar-donut-2-400.webp',
      ],
      heroPhoto: 'assets/menu/sugar-donut-1-800.webp',
      shelfPhoto: 'assets/menu/sugar-donut-trio-800.webp',
    },
    {
      id: 'choco',
      name: 'Chocolate Donut Ball',
      what: 'Chocolate + sugar',
      word: 'Choco',
      desc: 'A chocolate donut ball rolled in sugar, with a chocolate drizzle.',
      price: 12,
      shape: 'ball',
      color: '#4B2A1E',
      photos: [
        'assets/menu/chocolate-ball-1-400.webp',
        'assets/menu/chocolate-ball-2-400.webp',
      ],
      heroPhoto: 'assets/menu/chocolate-ball-1-800.webp',
      shelfPhoto: 'assets/menu/chocolate-ball-1-800.webp',
    },
  ],

  // ------------------------------------------------------------------ shapes
  // What the page calls each shape ("Tap a donut", "Pick 6 donut balls" ...).
  shapes: {
    'with-hole': { one: 'donut', many: 'donuts' },
    'no-hole': { one: 'donut', many: 'donuts' },
    'ball': { one: 'donut ball', many: 'donut balls' },
  },

  // ------------------------------------------------------------------ packaging
  // name / plural: what the page calls it ("Fill your box", "2 boxes").
  // holds: the shapes that belong in it.
  // art: the drawing in index.html (the symbols named art-back, art-front, and art-lid / art-topper).
  // heroWidth: its width at the top of the page, as a share of the picture area (0.5 = half).
  // dockWidth: its largest width in the counter bar at the bottom, in pixels.
  // spots: where each piece sits in the drawing. It holds as many pieces as it has spots.
  //   x, y = middle of the piece (0 to 1, across and down the drawing), size = piece width
  //   (share of the drawing's width), z = which piece is in front (bigger is in front),
  //   tilt = turn in degrees. Pieces fill the spots in this order.
  packagingTypes: {
    box6: {
      name: 'box',
      plural: 'boxes',
      holds: ['with-hole', 'no-hole', 'ball'],
      art: 'box6',
      heroWidth: 0.56,
      dockWidth: 78,
      spots: [
        { x: 0.22, y: 0.68, size: 0.28, z: 2, tilt: -3 },
        { x: 0.50, y: 0.68, size: 0.28, z: 2, tilt: 3 },
        { x: 0.78, y: 0.68, size: 0.28, z: 2, tilt: -1 },
        { x: 0.20, y: 0.84, size: 0.30, z: 3, tilt: -2 },
        { x: 0.50, y: 0.84, size: 0.30, z: 3, tilt: 1 },
        { x: 0.80, y: 0.84, size: 0.30, z: 3, tilt: 0 },
      ],
    },
    box9: {
      name: 'box',
      plural: 'boxes',
      holds: ['with-hole', 'no-hole', 'ball'],
      art: 'box9',
      heroWidth: 0.46,
      dockWidth: 70,
      spots: [
        { x: 0.24, y: 0.66, size: 0.27, z: 2, tilt: -3 },
        { x: 0.50, y: 0.66, size: 0.27, z: 2, tilt: 3 },
        { x: 0.76, y: 0.66, size: 0.27, z: 2, tilt: -1 },
        { x: 0.22, y: 0.76, size: 0.28, z: 3, tilt: -2 },
        { x: 0.50, y: 0.76, size: 0.28, z: 3, tilt: 1 },
        { x: 0.78, y: 0.76, size: 0.28, z: 3, tilt: 0 },
        { x: 0.20, y: 0.88, size: 0.30, z: 4, tilt: -1 },
        { x: 0.50, y: 0.88, size: 0.30, z: 4, tilt: 2 },
        { x: 0.80, y: 0.88, size: 0.30, z: 4, tilt: 2 },
      ],
    },
    cup: {
      name: 'cup',
      plural: 'cups',
      holds: ['ball'],
      art: 'cup',
      heroWidth: 0.44,
      dockWidth: 74,
      spots: [
        { x: 0.50, y: 0.76, size: 0.33, z: 2, tilt: -6 },
        { x: 0.36, y: 0.60, size: 0.33, z: 3, tilt: 10 },
        { x: 0.64, y: 0.58, size: 0.33, z: 4, tilt: -12 },
        { x: 0.38, y: 0.38, size: 0.34, z: 5, tilt: 14 },
        { x: 0.62, y: 0.35, size: 0.34, z: 6, tilt: -8 },
        { x: 0.50, y: 0.16, size: 0.35, z: 7, tilt: 4 },
      ],
    },
  },
};
