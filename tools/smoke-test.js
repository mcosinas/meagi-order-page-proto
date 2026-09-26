// Smoke test for the order page, following the "Test" list in CLAUDE.md. Needs Playwright.
// 1. Serve the repo folder:            python3 -m http.server 8765
// 2. Run (default settings):            node tools/smoke-test.js
//    Try other settings from config.js: node tools/smoke-test.js box9 | cup | mascot
const { chromium, devices } = require('playwright');

const BASE = process.env.BASE || 'http://127.0.0.1:8765/';
const VARIANTS = {
  default: '',
  box9: "window.MEAGI.packaging = 'box9';",
  mascot: 'window.MEAGI.mascot = true;',
  cup: "window.MEAGI.packaging = 'cup'; window.MEAGI.flavors.forEach(function (f) { f.shape = 'ball'; });",
};
const variant = process.argv[2] || 'default';
const patch = VARIANTS[variant];
if (patch === undefined) { console.error('unknown variant ' + variant); process.exit(2); }

const results = [];
const ok = (name, pass, detail = '') => results.push({ name, pass: !!pass, detail });

async function open(browser, opts) {
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('requestfailed', (r) => { if (!/fonts\./.test(r.url())) errors.push('requestfailed: ' + r.url()); });
  // fonts from Google may be blocked where this runs; they are not part of the test
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  if (patch) {
    await page.route(/config\.js/, async (r) => {
      const resp = await r.fetch();
      r.fulfill({ response: resp, body: (await resp.text()) + '\n' + patch });
    });
  }
  await page.goto(BASE, { waitUntil: 'load' });
  await page.waitForTimeout(700);
  return { ctx, page, errors };
}

const noSideScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
const scrollThrough = (page) => page.evaluate(async () => {
  const step = Math.round(window.innerHeight * 0.6);
  for (let y = 0; y < document.documentElement.scrollHeight; y += step) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 50)); }
  window.scrollTo(0, 0);
});
const inPack = (page) => page.$eval('#pack-count b', (b) => Number(b.textContent));
const summaryCount = (page) => page.$$eval('#order-packs .cb', (els) => els.length);
const center = (page, sel) => page.$eval(sel, (el) => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });

async function touch(client, type, pts) {
  await client.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map((p) => ({ x: Math.round(p.x), y: Math.round(p.y) })) });
}

(async () => {
  const browser = await chromium.launch();
  const N = await (async () => { const { ctx, page } = await open(browser, { viewport: { width: 390, height: 844 } }); const n = await page.evaluate(() => window.MEAGI.packagingTypes[window.MEAGI.packaging].spots.length); await ctx.close(); return n; })();
  const word = await (async () => { const { ctx, page } = await open(browser, { viewport: { width: 390, height: 844 } }); const w = await page.evaluate(() => window.MEAGI.packagingTypes[window.MEAGI.packaging].name); await ctx.close(); return w; })();
  const Word = word[0].toUpperCase() + word.slice(1);

  // ---- phone widths: loads clean, no sideways scroll
  for (const w of [360, 390, 430]) {
    const { ctx, page, errors } = await open(browser, { viewport: { width: w, height: 800 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
    ok(`${w}px: no sideways scroll`, await noSideScroll(page));
    await scrollThrough(page);
    await page.waitForTimeout(300);
    ok(`${w}px: no sideways scroll after scrolling through`, await noSideScroll(page));
    ok(`${w}px: no console errors`, errors.length === 0, errors.join(' | '));
    await ctx.close();
  }

  // ---- 390px phone: tap, fill a whole packaging and start another, form, thank-you, new order
  {
    const { ctx, page, errors } = await open(browser, { ...devices['iPhone 13'], viewport: { width: 390, height: 844 } });
    const mascotShown = await page.evaluate(() => [...document.querySelectorAll('[data-mascot]')].some((el) => el.getBoundingClientRect().width > 0));
    ok(`mascot ${variant === 'mascot' ? 'shows' : 'is hidden'}`, variant === 'mascot' ? mascotShown : !mascotShown);
    const hint = await page.textContent('.hint');
    ok('header words follow the packaging', hint.includes(`your ${word}`), hint.trim());
    await page.tap('.hero-item.hi-1');
    await page.waitForTimeout(1200);
    ok('tap: one piece lands', (await inPack(page)) === 1, `in pack: ${await inPack(page)}`);
    for (let i = 0; i < N; i++) { await page.tap(`.hero-item.hi-${(i % 4) + 1}`); await page.waitForTimeout(170); }
    await page.waitForTimeout(3600);
    ok(`full: a fresh ${word} after ${N}`, (await page.textContent('#dock-pack')).trim() === `${Word} 2`, await page.textContent('#dock-pack'));
    ok(`summary shows ${N + 1} pieces in 2 ${word}s`, (await summaryCount(page)) === N + 1 && (await page.$$eval('#order-packs figure', (f) => f.length)) === 2);
    await page.fill('#first', '');
    await page.fill('#phone', '12345');
    await page.click('#submit');
    await page.waitForTimeout(300);
    ok('form: missing name and bad number show errors', (await page.textContent('#first-err')).includes('first name') && (await page.textContent('#phone-err')).includes('PH mobile'));
    await page.fill('#first', 'Ana');
    await page.fill('#last', 'Reyes');
    await page.fill('#phone', '+63 917 123 4567');
    await page.click('#submit');
    await page.waitForTimeout(1500);
    ok('thank-you shows with name and number', !(await page.$eval('#thanks', (el) => el.hidden)) && (await page.textContent('#t-name')) === 'Ana' && (await page.textContent('#t-phone')) === '0917 123 4567');
    await page.click('#t-again');
    await page.waitForTimeout(600);
    ok('"Start a new order" empties everything', (await inPack(page)) === 0 && (await page.$eval('#thanks', (el) => el.hidden)) && (await summaryCount(page)) === 0);
    ok('390px flow: no console errors', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }

  // ---- touch: hold and drag into the packaging; a quick swipe on a piece must not pick it
  {
    const { ctx, page, errors } = await open(browser, { ...devices['iPhone 13'], viewport: { width: 390, height: 844 } });
    const client = await ctx.newCDPSession(page);
    const a = await center(page, '.hero-item.hi-2 img');
    const b = await center(page, '#pack');
    await touch(client, 'touchStart', [a]);
    await page.waitForTimeout(320);
    for (let i = 1; i <= 12; i++) { await touch(client, 'touchMove', [{ x: a.x + ((b.x - a.x) * i) / 12, y: a.y + ((b.y - a.y) * i) / 12 }]); await page.waitForTimeout(16); }
    await page.waitForTimeout(200);
    await touch(client, 'touchEnd', []);
    await page.waitForTimeout(1300);
    ok('touch: hold and drag drops a piece in', (await inPack(page)) === 1, `in pack: ${await inPack(page)}`);
    const c = await center(page, '.hero-item.hi-3 img');
    await touch(client, 'touchStart', [c]);
    for (let i = 1; i <= 6; i++) { await touch(client, 'touchMove', [{ x: c.x, y: c.y - i * 14 }]); await page.waitForTimeout(12); }
    await touch(client, 'touchEnd', []);
    await page.waitForTimeout(1200);
    ok('touch: a quick swipe on a piece does not pick it', (await inPack(page)) === 1, `in pack: ${await inPack(page)}`);
    await page.focus('.hero-item.hi-4');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1300);
    ok('keyboard: Enter on a piece adds it', (await inPack(page)) === 2, `in pack: ${await inPack(page)}`);
    ok('touch/keyboard: no console errors', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }

  // ---- desktop: mouse drag into the packaging, no sideways scroll
  {
    const { ctx, page, errors } = await open(browser, { viewport: { width: 1280, height: 800 } });
    ok('desktop: no sideways scroll', await noSideScroll(page));
    const a = await center(page, '.hero-item.hi-2 img');
    const b = await center(page, '#pack');
    await page.mouse.move(a.x, a.y);
    await page.mouse.down();
    await page.mouse.move(b.x, b.y, { steps: 20 });
    await page.waitForTimeout(250);
    await page.mouse.up();
    await page.waitForTimeout(1300);
    ok('desktop: drag a piece in with the mouse', (await inPack(page)) === 1, `in pack: ${await inPack(page)}`);
    ok('desktop: no console errors', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }

  // ---- reduced motion: starts docked, taps still work
  {
    const { ctx, page, errors } = await open(browser, { ...devices['iPhone 13'], viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    await page.tap('.hero-item.hi-1');
    await page.waitForTimeout(600);
    ok('reduced motion: tap still adds', (await inPack(page)) === 1);
    ok('reduced motion: no console errors', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }

  await browser.close();
  const failed = results.filter((r) => !r.pass);
  for (const r of results) console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name}${!r.pass && r.detail ? '  -> ' + r.detail : ''}`);
  console.log(`\n[${variant}] ${results.length - failed.length}/${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
