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
  // In the order they appear on the page. The first 4 also float at the top of the page.
  // shape: 'with-hole' (a donut with a hole), 'no-hole' (a donut without a hole) or 'ball' (a donut ball).
  // photos: square pictures, about 288 px, transparent background, donut in the middle filling about
  //   90% of the width. Used on the trays and in the packaging, one after the other.
  // heroPhoto / shelfPhoto: the same kind of picture at about 640 px, for the big spots.
  // Donut ball pictures (for shape 'ball' and the cup) are in assets/balls/, named the same way.
  flavors: [
    {
      id: 'glazed',                     // short code: small letters, no spaces
      name: 'Golden Hour',              // fun name
      what: 'Classic glazed',           // what it is (small line above the name)
      word: 'Golden',                   // big faded word behind the shelf photo
      desc: 'Our classic glazed. Soft, fluffy and shiny all over.',
      price: 10,                        // pesos per piece
      shape: 'with-hole',
      color: '#D9953F',                 // this flavor's dot in the counter bar
      photos: [
        'assets/donuts/glazed-1-288.webp',
        'assets/donuts/glazed-2-288.webp',
        'assets/donuts/glazed-3-288.webp',
      ],
      heroPhoto: 'assets/donuts/glazed-1-640.webp',
      shelfPhoto: 'assets/donuts/glazed-3-640.webp',
    },
    {
      id: 'cream',
      name: 'Cream Cheese',
      what: 'Tangy and creamy',
      word: 'Cream',
      desc: 'Loaded with smooth, tangy cream cheese.',
      price: 14,
      shape: 'no-hole',
      color: '#FFF6E8',
      photos: [
        'assets/donuts/cream-1-288.webp',
        'assets/donuts/cream-2-288.webp',
        'assets/donuts/cream-3-288.webp',
      ],
      heroPhoto: 'assets/donuts/cream-1-640.webp',
      shelfPhoto: 'assets/donuts/cream-3-640.webp',
    },
    {
      id: 'matcha',
      name: 'Matcha Cream Cheese',
      what: 'Matcha + cream cheese',
      word: 'Matcha',
      desc: 'Earthy matcha meets tangy cream cheese.',
      price: 16,
      shape: 'no-hole',
      color: '#86A94A',
      photos: [
        'assets/donuts/matcha-1-288.webp',
        'assets/donuts/matcha-2-288.webp',
        'assets/donuts/matcha-3-288.webp',
      ],
      heroPhoto: 'assets/donuts/matcha-1-640.webp',
      shelfPhoto: 'assets/donuts/matcha-3-640.webp',
    },
    {
      id: 'pumpkin',
      name: 'Pumpkin Spice Cream Cheese',
      what: 'Pumpkin spice + cream cheese',
      word: 'Pumpkin',
      desc: 'Warm pumpkin spice with tangy cream cheese.',
      price: 16,
      shape: 'no-hole',
      color: '#EFA052',
      photos: [
        'assets/donuts/pumpkin-1-288.webp',
        'assets/donuts/pumpkin-2-288.webp',
        'assets/donuts/pumpkin-3-288.webp',
      ],
      heroPhoto: 'assets/donuts/pumpkin-1-640.webp',
      shelfPhoto: 'assets/donuts/pumpkin-3-640.webp',
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
      holds: ['with-hole', 'no-hole'],
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
      holds: ['with-hole', 'no-hole'],
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
