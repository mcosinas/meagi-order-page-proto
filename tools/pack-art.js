// Draws the packaging art (SVG <symbol>s in index.html) and suggests the donut spots for config.js.
// Boxes come from a small 3D model seen from 38 degrees above, the same angle as the donut photos.
// Usage (from the repo folder):  node tools/pack-art.js
//   Replaces the box6-*, box9-* and cup-* symbols in index.html and prints suggested spots.
//   The spots in config.js were then made a little bigger by hand, so donuts look packed.
const fs = require('fs');
const path = require('path');

const INK = '#3B2216';
const f = (n) => Number(n.toFixed(2));
const pts = (a) => a.map((p) => `${f(p[0])},${f(p[1])}`).join(' ');

function camera(elevDeg, L) {
  const a = (elevDeg * Math.PI) / 180;
  const sa = Math.sin(a), ca = Math.cos(a);
  return (x, y, z) => {
    const depth = L - (y * sa + z * ca);
    const s = L / depth;
    return [x * s, -(y * ca - z * sa) * s, s];
  };
}

function box({ id, cols, rows, cell = 50, H = 21, t = 3.2, lidDeg = 100, elev = 38, L = 720, donut = 0.9 }) {
  const P = camera(elev, L);
  const W = cols * cell, D = rows * cell;
  const w = W / 2, d = D / 2, wo = w + t, dout = d + t;
  // lid (open): hinge on the back top outer edge
  const b = (lidDeg * Math.PI) / 180;
  const lidD = D + 2 * t;
  const lid = (x, s) => P(x, H + s * Math.sin(b), -dout + s * Math.cos(b));
  // closed lid sits on the rim
  const LT = 2.4;
  const shapes = {};

  // ---------- back layer: open lid (separate), interior walls, floor, rim frame
  const lidOpen = [lid(-wo, 0), lid(wo, 0), lid(wo, lidD), lid(-wo, lidD)];
  const lidEdge = [lid(-wo, lidD), lid(wo, lidD), (() => { const p = P(wo, H + lidD * Math.sin(b) - LT * Math.cos(b) * 0, -dout + lidD * Math.cos(b)); return p; })()];
  // lid wordmark frame: centered on the lid, local x along the width, local "down" toward the hinge
  const lc = lid(0, lidD * 0.52);
  const lx = lid(1, lidD * 0.52); const lu = lid(0, lidD * 0.52 + 1);
  const exL = [lx[0] - lc[0], lx[1] - lc[1]], eyL = [lc[0] - lu[0], lc[1] - lu[1]];
  const wmW = W * 0.62, wmH = wmW * (237.2 / 526);
  const lidMark = `<g transform="matrix(${f(exL[0])} ${f(exL[1])} ${f(eyL[0])} ${f(eyL[1])} ${f(lc[0])} ${f(lc[1])})"><use href="#wm-ink" x="${f(-wmW / 2)}" y="${f(-wmH / 2)}" width="${f(wmW)}" height="${f(wmH)}"/></g>`;

  const floor = [P(-w, 0, -d), P(w, 0, -d), P(w, 0, d), P(-w, 0, d)];
  const backWall = [P(-w, H, -d), P(w, H, -d), P(w, 0, -d), P(-w, 0, -d)];
  const leftWall = [P(-w, H, -d), P(-w, H, d), P(-w, 0, d), P(-w, 0, -d)];
  const rightWall = [P(w, H, -d), P(w, H, d), P(w, 0, d), P(w, 0, -d)];
  // rim: outer top ring minus inner opening (even-odd)
  const outerTop = [P(-wo, H, -dout), P(wo, H, -dout), P(wo, H, dout), P(-wo, H, dout)];
  const innerTop = [P(-w, H, -d), P(w, H, -d), P(w, H, d), P(-w, H, d)];
  const rimPath = `M${pts(outerTop).replace(/ /g, ' L')} Z M${pts(innerTop).replace(/ /g, ' L')} Z`;

  const lidOpenSvg = [
    `<polygon points="${pts(lidOpen)}" fill="url(#pkLidIn)"/>`,
    lidMark,
    `<polygon points="${pts(lidOpen)}" fill="none" stroke="${INK}" stroke-opacity=".55" stroke-width="1.5" stroke-linejoin="round"/>`,
    // the lid's far edge shows its teal outside as a thin band
    `<path d="M${pts([lid(-wo, lidD), lid(wo, lidD)])}" stroke="#14A6A0" stroke-width="3.2" stroke-linecap="round"/>`,
    `<path d="M${pts([lid(-wo, lidD), lid(wo, lidD)])}" stroke="${INK}" stroke-opacity=".5" stroke-width="1" fill="none"/>`,
  ].join('');

  const backSvg = [
    `<polygon points="${pts(floor)}" fill="#FFF0D8"/>`,
    `<polygon points="${pts(backWall)}" fill="#F0DAB6"/>`,
    `<polygon points="${pts(leftWall)}" fill="#E6CBA0"/>`,
    `<polygon points="${pts(rightWall)}" fill="#F7E6C9"/>`,
    `<path d="M${pts([P(-w, 0, -d), P(w, 0, -d)])}" stroke="${INK}" stroke-opacity=".18" stroke-width="1"/>`,
    `<path d="${rimPath}" fill="#FFFAF2" fill-rule="evenodd"/>`,
    `<path d="${rimPath}" fill="none" stroke="${INK}" stroke-opacity=".45" stroke-width="1.2" stroke-linejoin="round"/>`,
  ].join('');

  // ---------- front layer: front outer wall (teal) + its rim
  const frontWall = [P(-wo, H, dout), P(wo, H, dout), P(wo, 0, dout), P(-wo, 0, dout)];
  const frontRim = [P(-wo, H, d), P(wo, H, d), P(wo, H, dout), P(-wo, H, dout)];
  const frontSvg = [
    `<polygon points="${pts(frontWall)}" fill="url(#pkTeal)"/>`,
    `<path d="M${pts([P(-wo + 7, H * 0.72, dout), P(-wo + 7, H * 0.22, dout)])}" stroke="#fff" stroke-opacity=".25" stroke-width="3.2" stroke-linecap="round"/>`,
    `<polygon points="${pts(frontRim)}" fill="#FFFAF2"/>`,
    `<polygon points="${pts(frontWall)}" fill="none" stroke="${INK}" stroke-opacity=".6" stroke-width="1.5" stroke-linejoin="round"/>`,
    `<polygon points="${pts(frontRim)}" fill="none" stroke="${INK}" stroke-opacity=".45" stroke-width="1.1" stroke-linejoin="round"/>`,
  ].join('');

  // ---------- closed lid (shown when the box is full)
  const lidTop = [P(-wo, H + LT, -dout), P(wo, H + LT, -dout), P(wo, H + LT, dout), P(-wo, H + LT, dout)];
  const lidFront = [P(-wo, H + LT, dout), P(wo, H + LT, dout), P(wo, H - 3, dout + 0.4), P(-wo, H - 3, dout + 0.4)];
  const cc = P(0, H + LT, 0), cx = P(1, H + LT, 0), cz = P(0, H + LT, 1);
  const ex = [cx[0] - cc[0], cx[1] - cc[1]], ez = [cz[0] - cc[0], cz[1] - cc[1]];
  const wm2 = W * 0.6, hm2 = wm2 * (237.2 / 526);
  const lidSvg = [
    `<polygon points="${pts(lidTop)}" fill="url(#pkLidTop)"/>`,
    `<g transform="matrix(${f(ex[0])} ${f(ex[1])} ${f(ez[0])} ${f(ez[1])} ${f(cc[0])} ${f(cc[1])})"><use href="#wm-white" x="${f(-wm2 / 2)}" y="${f(-hm2 / 2)}" width="${f(wm2)}" height="${f(hm2)}"/></g>`,
    `<polygon points="${pts(lidFront)}" fill="#0E8A85"/>`,
    `<polygon points="${pts(lidTop)}" fill="none" stroke="${INK}" stroke-opacity=".6" stroke-width="1.5" stroke-linejoin="round"/>`,
    `<polygon points="${pts(lidFront)}" fill="none" stroke="${INK}" stroke-opacity=".6" stroke-width="1.3" stroke-linejoin="round"/>`,
  ].join('');

  // ---------- donut spots
  const spots = [];
  let rnd = 7;
  const jitter = () => { rnd = (rnd * 16807) % 2147483647; return (rnd / 2147483647) - 0.5; };
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = -w + cell * (c + 0.5), z = -d + cell * (r + 0.5);
      const p = P(x, cell * 0.2, z);
      spots.push({ p, s: cell * donut * p[2], z: r + 2, r: Math.round(jitter() * 6) });
    }
  }
  // front row first in the list? No: fill back to front, left to right, so new donuts land in front.

  // ---------- bounds + viewBox
  const all = [...lidOpen, ...floor, ...frontWall, ...lidTop, ...lidFront, ...outerTop];
  for (const s of spots) { all.push([s.p[0] - s.s / 2, s.p[1] - s.s / 2]); all.push([s.p[0] + s.s / 2, s.p[1] + s.s / 2]); }
  const m = 3;
  const x0 = Math.min(...all.map((q) => q[0])) - m, x1 = Math.max(...all.map((q) => q[0])) + m;
  const y0 = Math.min(...all.map((q) => q[1])) - m, y1 = Math.max(...all.map((q) => q[1])) + m;
  const VW = x1 - x0, VH = y1 - y0;
  const hingeY = (lid(0, 0)[1] - y0) / VH;
  const vb = `0 0 ${f(VW)} ${f(VH)}`;
  const sym = (name, body) => `<symbol id="${id}-${name}" viewBox="${vb}" overflow="visible"><g transform="translate(${f(-x0)} ${f(-y0)})">${body}</g></symbol>`;
  return {
    id,
    symbols: [sym('lid-open', lidOpenSvg), sym('back', backSvg), sym('front', frontSvg), sym('lid', lidSvg).replace('<symbol ', `<symbol data-hinge="${f(hingeY * 100)}" `)].join('\n'),
    ratio: f(VH / VW),
    hinge: f(hingeY * 100),
    slots: spots.map((s) => ({ x: f((s.p[0] - x0) / VW), y: f((s.p[1] - y0) / VH), s: f(s.s / VW), z: s.z, r: s.r })),
  };
}

function cup() {
  const id = 'cup';
  const vb = '0 12 120 136';
  const rim = { cx: 60, cy: 26, rx: 50, ry: 9 };
  const bot = { cx: 60, cy: 138, rx: 35, ry: 6.5 };
  const body = `M${rim.cx - rim.rx},${rim.cy} A${rim.rx},${rim.ry} 0 0 0 ${rim.cx + rim.rx},${rim.cy} L${bot.cx + bot.rx},${bot.cy} A${bot.rx},${bot.ry} 0 0 1 ${bot.cx - bot.rx},${bot.cy} Z`;
  const back = [
    `<path d="M${rim.cx - rim.rx},${rim.cy} L${bot.cx - bot.rx},${bot.cy} A${bot.rx},${bot.ry} 0 0 0 ${bot.cx + bot.rx},${bot.cy} L${rim.cx + rim.rx},${rim.cy} A${rim.rx},${rim.ry} 0 0 0 ${rim.cx - rim.rx},${rim.cy} Z" fill="#FFFFFF" fill-opacity=".22"/>`,
    `<ellipse cx="${bot.cx}" cy="${bot.cy}" rx="${bot.rx}" ry="${bot.ry}" fill="#FFFFFF" fill-opacity=".3"/>`,
    `<path d="M${rim.cx - rim.rx},${rim.cy} A${rim.rx},${rim.ry} 0 0 1 ${rim.cx + rim.rx},${rim.cy}" fill="none" stroke="#FFFFFF" stroke-opacity=".85" stroke-width="4.4" stroke-linecap="round"/>`,
    `<path d="M${rim.cx - rim.rx},${rim.cy} A${rim.rx},${rim.ry} 0 0 1 ${rim.cx + rim.rx},${rim.cy}" fill="none" stroke="${INK}" stroke-opacity=".3" stroke-width="1"/>`,
  ].join('');
  const front = [
    `<path d="${body}" fill="#FFFFFF" fill-opacity=".16"/>`,
    `<path d="M22,44 L31,126" stroke="#FFFFFF" stroke-opacity=".55" stroke-width="5.5" stroke-linecap="round"/>`,
    `<path d="M101,48 L94,118" stroke="#FFFFFF" stroke-opacity=".35" stroke-width="2.6" stroke-linecap="round"/>`,
    `<path d="M28.5,118 A31.5,5.4 0 0 0 91.5,118" fill="none" stroke="#FFFFFF" stroke-opacity=".45" stroke-width="1.6"/>`,
    `<path d="M27.4,127.5 A32.6,5.6 0 0 0 92.6,127.5" fill="none" stroke="#FFFFFF" stroke-opacity=".45" stroke-width="1.6"/>`,
    `<path d="${body}" fill="none" stroke="${INK}" stroke-opacity=".5" stroke-width="1.4" stroke-linejoin="round"/>`,
    `<path d="M${rim.cx - rim.rx},${rim.cy} A${rim.rx},${rim.ry} 0 0 0 ${rim.cx + rim.rx},${rim.cy}" fill="none" stroke="#FFFFFF" stroke-width="5.2" stroke-linecap="round"/>`,
    `<path d="M${rim.cx - rim.rx + 1},${rim.cy + 3.2} A${rim.rx - 1},${rim.ry - 0.6} 0 0 0 ${rim.cx + rim.rx - 1},${rim.cy + 3.2}" fill="none" stroke="${INK}" stroke-opacity=".3" stroke-width="1.1"/>`,
    `<path d="M${rim.cx - rim.rx},${rim.cy} A${rim.rx},${rim.ry} 0 0 1 ${rim.cx + rim.rx},${rim.cy}" fill="none" stroke="${INK}" stroke-opacity=".35" stroke-width="1"/>`,
    `<circle cx="60" cy="106" r="12.5" fill="#14A6A0" stroke="${INK}" stroke-opacity=".6" stroke-width="1.2"/>`,
    `<use href="#wm-white" x="48.6" y="100.9" width="22.8" height="10.3"/>`,
  ].join('');
  const topper = [
    `<path d="M64,34 L100,-30" stroke="${INK}" stroke-width="6.2" stroke-linecap="round"/>`,
    `<path d="M64,34 L100,-30" stroke="#E2B878" stroke-width="3.6" stroke-linecap="round"/>`,
    `<circle cx="100" cy="-30" r="4.6" fill="#FF6B5A" stroke="${INK}" stroke-width="1.6"/>`,
  ].join('');
  const [vx, vy, vw, vh] = vb.split(' ').map(Number);
  const sym = (name, bodySvg) => `<symbol id="${id}-${name}" viewBox="0 0 ${vw} ${vh}" overflow="visible"><g transform="translate(${-vx} ${-vy})">${bodySvg}</g></symbol>`;
  const S = (x, y, s, z, r) => ({ x: f((x - vx) / vw), y: f((y - vy) / vh), s: f(s / vw), z, r });
  return {
    id,
    symbols: [sym('back', back), sym('front', front), sym('topper', topper)].join('\n'),
    ratio: f(vh / vw),
    slots: [
      S(60, 116, 40, 2, -6), S(43, 93, 40, 3, 10), S(77, 91, 40, 4, -12),
      S(46, 64, 41, 5, 14), S(74, 60, 41, 6, -8), S(60, 34, 42, 7, 4),
    ],
  };
}

const out = {
  box6: box({ id: 'box6', cols: 3, rows: 2 }),
  box9: box({ id: 'box9', cols: 3, rows: 3 }),
  cup: cup(),
};
const file = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(file, 'utf8');
for (const a of Object.values(out)) {
  for (const symbol of a.symbols.split('\n')) {
    const id = symbol.match(/id="([^"]+)"/)[1];
    const re = new RegExp(`<symbol[^>]*id="${id}"[\\s\\S]*?</symbol>`);
    if (!re.test(html)) throw new Error(`index.html has no symbol ${id}`);
    html = html.replace(re, symbol);
  }
}
fs.writeFileSync(file, html);
for (const [k, a] of Object.entries(out)) {
  console.log(`${k}: suggested spots`);
  for (const s of a.slots) console.log(`  { x: ${s.x}, y: ${s.y}, size: ${s.s}, z: ${s.z}, tilt: ${s.r} },`);
}
