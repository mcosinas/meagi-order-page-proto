// Renders placeholder donut photos with three.js in headless Chromium (see tools/README.md).
// usage: node render.js <outdir> <flavor:seed:name,...>   e.g.  node render.js out glazed:101:glazed-1
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const out = process.argv[2];
const jobs = process.argv[3].split(',').map((s) => { const [flavor, seed, name] = s.split(':'); return { flavor, seed: Number(seed), name: name || `${flavor}-${seed}` }; });
fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1400, height: 1400 } });
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log('[page]', m.text().slice(0, 400)); });
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await page.goto(`http://127.0.0.1:${process.env.PORT || 8766}/render.html`);
  await page.waitForFunction(() => window.ready === true, null, { timeout: 60000 });
  for (const j of jobs) {
    const t0 = Date.now();
    const r = await page.evaluate((o) => window.renderDonut(o), j);
    fs.writeFileSync(path.join(out, `${j.name}-640.webp`), Buffer.from(r.lg.split(',')[1], 'base64'));
    fs.writeFileSync(path.join(out, `${j.name}-288.webp`), Buffer.from(r.sm.split(',')[1], 'base64'));
    console.log(`${j.name}: ${Date.now() - t0} ms`);
  }
  // contact sheet: each image on cream and on teal
  const files = jobs.map((j) => `${j.name}-640.webp`);
  const sheet = `<!doctype html><html><body style="margin:0;background:#FFF4E3;font:14px sans-serif">
  <div style="display:flex;flex-wrap:wrap;gap:0">${files.map((f) => `<div style="width:320px;text-align:center"><img src="${f}" style="width:300px;display:block;margin:10px auto 0"><div>${f}</div></div>`).join('')}</div>
  <div style="display:flex;flex-wrap:wrap;background:#14A6A0">${files.map((f) => `<img src="${f.replace('-640', '-288')}" style="width:150px;margin:8px">`).join('')}</div></body></html>`;
  fs.writeFileSync(path.join(out, 'sheet.html'), sheet);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('file://' + path.resolve(out, 'sheet.html'));
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(out, 'sheet.png'), fullPage: true });
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
