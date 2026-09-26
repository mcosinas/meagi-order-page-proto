// Frames a see-through product photo (a cutout) for the menu, the same way as the photos in assets/menu:
// the donut 88% as wide as the square, centered a little below the middle, so it sits right on the trays
// and in the box spots. Writes <name>-400.webp and <name>-800.webp. Needs Playwright.
// Usage: node tools/frame-cutouts.js <cutout.png> assets/menu/<name> [--mirror]
//   --mirror flips it left to right (a second photo for variety when a flavor has only one).
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const mirror = args.includes('--mirror');
const [src, outBase] = args.filter((a) => a !== '--mirror');
if (!src || !outBase) {
  console.error('usage: node tools/frame-cutouts.js <cutout.png> <output name without size> [--mirror]');
  process.exit(2);
}
const SIZES = [400, 800];

(async () => {
  const type = src.toLowerCase().endsWith('.png') ? 'png' : 'webp';
  const data = `data:image/${type};base64,` + fs.readFileSync(src).toString('base64');
  const b = await chromium.launch();
  const p = await b.newPage();
  const outs = await p.evaluate(async ({ data, sizes, mirror }) => {
    const img = new Image(); img.src = data; await img.decode();
    const c0 = document.createElement('canvas'); c0.width = img.width; c0.height = img.height;
    const x0c = c0.getContext('2d'); x0c.drawImage(img, 0, 0);
    const d = x0c.getImageData(0, 0, c0.width, c0.height).data;
    let x0 = c0.width, x1 = 0, y0 = c0.height, y1 = 0;
    for (let y = 0; y < c0.height; y++) for (let i = 0; i < c0.width; i++) if (d[(y * c0.width + i) * 4 + 3] > 16) { if (i < x0) x0 = i; if (i > x1) x1 = i; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
    const res = {};
    for (const S of sizes) {
      const k = (0.88 * S) / bw;
      const w = bw * k, h = bh * k;
      const dx = (S - w) / 2, dy = Math.min(Math.max(0.54 * S - h / 2, 0.03 * S), 0.97 * S - h);
      const c = document.createElement('canvas'); c.width = c.height = S;
      const x = c.getContext('2d');
      x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
      if (mirror) { x.translate(S, 0); x.scale(-1, 1); }
      x.drawImage(img, x0, y0, bw, bh, dx, dy, w, h);
      res[S] = c.toDataURL('image/webp', 0.86);
    }
    return res;
  }, { data, sizes: SIZES, mirror });
  fs.mkdirSync(path.dirname(outBase), { recursive: true });
  for (const S of SIZES) {
    const f = `${outBase}-${S}.webp`;
    fs.writeFileSync(f, Buffer.from(outs[S].split(',')[1], 'base64'));
    console.log(`${f}  ${(fs.statSync(f).size / 1024).toFixed(1)} KB`);
  }
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
