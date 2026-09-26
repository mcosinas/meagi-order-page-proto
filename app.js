/* Meagi · donut ball stall — order page prototype.
   Plain JavaScript, no libraries. Pick donut balls (tap, or hold and drag), drop them into the
   paper cup (6 per cup), then check out. Nothing is sent anywhere: this is a front-end prototype. */
(() => {
  'use strict';

  // ------------------------------------------------------------------ helpers
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const MENU = JSON.parse($('#menu-data').textContent);
  const CUP = MENU.cupSize;
  const FL = {};
  MENU.flavors.forEach((f) => { FL[f.id] = f; });
  const REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const peso = (n) => '₱' + n.toLocaleString('en-PH');
  const src = (flavor, variant, size) => `assets/balls/${flavor}-${variant}-${size}.webp`;
  const chunk = (a, n) => { const out = []; for (let i = 0; i < a.length; i += n) out.push(a.slice(i, i + n)); return out; };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const haptic = (p) => { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) { /* not allowed here */ } };

  // Where the 6 donut balls sit in a 120 x 130 paper cup (fractions of the cup box). z = stacking order.
  const SLOTS = [
    { x: 0.5, y: 0.335, z: 6, r: -6 },
    { x: 0.285, y: 0.29, z: 2, r: 10 },
    { x: 0.715, y: 0.29, z: 3, r: -12 },
    { x: 0.395, y: 0.168, z: 4, r: 14 },
    { x: 0.625, y: 0.158, z: 5, r: -8 },
    { x: 0.515, y: 0.05, z: 7, r: 4 },
  ];
  const BALL_W = 0.37; // ball width as a fraction of the cup width

  // ------------------------------------------------------------------ state
  const state = { items: [], display: 0, swapping: false, uid: 0, flying: 0, saidFirst: false, saidDrag: false, open: false };
  const queue = [];
  const landedItems = () => state.items.filter((i) => i.landed);
  const settleIndex = () => { const n = state.items.length; return n % CUP === 0 ? n / CUP : Math.floor(n / CUP); };
  const canAccept = () => !state.swapping && !state.open && state.items.length < (state.display + 1) * CUP;
  const totalOf = (items) => items.reduce((s, i) => s + FL[i.flavor].price, 0);

  // ------------------------------------------------------------------ elements
  const root = document.documentElement;
  const cup = $('#cup');
  const cupBody = $('#cup-body');
  const cupBalls = $('#cup-balls');
  const cupCount = $('#cup-count');
  const anchor = $('#cup-anchor');
  const dock = $('#dock');
  const slot = $('#dock-slot');
  const dockCup = $('#dock-cup');
  const dockDots = $('#dock-dots');
  const dockSub = $('#dock-sub');
  const dockCta = $('#dock-cta');
  const dockMea = $('#dock-mea');
  const bubbleDock = $('#bubble-dock');
  const bubbleHero = $('#bubble-hero');
  const heroMeaSvg = $('.mea-hero');
  const dockMeaSvg = $('.mea-dock');
  const flyLayer = $('#fly-layer');
  const live = $('#live');
  const heroCircle = $('.hero-circle');
  const heroBalls = $$('.hero-ball');
  const sprinkles = $$('.spr');
  const awning = $('.awning-stripes');
  const orderEmpty = $('#order-empty');
  const orderSummary = $('#order-summary');
  const orderCups = $('#order-cups');
  const orderLines = $('#order-lines');
  const orderTotal = $('#order-total');
  const submitTotal = $('#submit-total');
  const thanks = $('#thanks');

  const shelves = $$('.shelf').map((el) => ({
    el, tray: $('.tray', el), dir: el.classList.contains('shelf-l') ? -1 : 1, top: 0, h: 1, jy: 0, jv: 0,
  }));
  const marquees = $$('.marquee').map((el) => ({
    el, boost: $('.marquee-boost', el), track: $('.marquee-track', el), off: 0, half: 1,
    dir: el.classList.contains('marquee-2') ? 1 : -1, top: 0, h: 1,
  }));
  const meas = $$('svg.mea').map((svg) => ({ svg, look: $('.mea-look', svg), x: 0, y: 0 }));

  // per-ball wobble strength so the trays don't jiggle in lockstep
  $$('.tray-ball').forEach((b, i) => { b.style.setProperty('--k', (0.7 + ((i * 37) % 11) / 18).toFixed(2)); });

  // ------------------------------------------------------------------ layout measurements
  let vw = window.innerWidth;
  let vh = window.innerHeight;
  let cupW = 180;
  let cupScale = 1;
  function measure() {
    vw = window.innerWidth;
    vh = window.innerHeight;
    cupW = anchor.getBoundingClientRect().width || 180;
    cup.style.width = cupW + 'px';
    const sy = window.scrollY;
    shelves.forEach((s) => { const r = s.el.getBoundingClientRect(); s.top = r.top + sy; s.h = r.height || 1; });
    marquees.forEach((m) => {
      const r = m.el.getBoundingClientRect();
      m.top = r.top + sy; m.h = r.height; m.half = Math.max(1, m.track.scrollWidth / 2);
    });
    wake(300);
  }

  // ------------------------------------------------------------------ the frame loop (sleeps when idle)
  let raf = 0;
  let lastT = 0;
  let awakeUntil = 0;
  let lastScroll = window.scrollY;
  let vel = 0;
  let dockP = REDUCE ? 1 : 0;
  let dockHide = 0;
  let dockHideTarget = 0;
  let flap = 0;
  let lookTarget = null;

  function wake(ms) {
    awakeUntil = Math.max(awakeUntil, performance.now() + (ms || 300));
    if (!raf) raf = requestAnimationFrame(frame);
  }
  function frame(t) {
    raf = 0;
    const dt = lastT ? Math.min(0.05, (t - lastT) / 1000) : 1 / 60;
    lastT = t;
    const y = window.scrollY;
    vel = lerp(vel, (y - lastScroll) / dt, 0.3);
    lastScroll = y;
    tick(dt, y);
    const moving = Math.abs(vel) > 2 || shelves.some((s) => Math.abs(s.jy) > 0.05 || Math.abs(s.jv) > 0.5) || Math.abs(dockHide - dockHideTarget) > 0.002 || drag;
    // tick() may already have queued the next frame through wake(); never queue two
    if (raf) return;
    if (t < awakeUntil || moving) raf = requestAnimationFrame(frame);
    else { lastT = 0; vel = 0; }
  }

  function tick(dt, y) {
    if (!REDUCE) dockP = clamp(y / (vh * 0.5), 0, 1);
    dockHide = lerp(dockHide, dockHideTarget, 1 - Math.exp(-dt * 9));
    const dh = Math.max(1 - smooth(0.35, 0.95, dockP), dockHide);
    dock.style.setProperty('--dh', dh.toFixed(4));
    dock.classList.toggle('is-off', dh > 0.985);
    placeCup();

    if (!REDUCE) {
      if (y < vh * 1.4) heroTick(y, dt);
      shelvesTick(y, dt);
      marqueesTick(y, dt);
    }
    if (drag) dragTick(dt);
    meaTick(dt);
  }

  // ------------------------------------------------------------------ the cup: hero -> counter bar
  function placeCup() {
    const a = anchor.getBoundingClientRect();
    const s = slot.getBoundingClientRect();
    const dw = Math.min(s.width * 0.94, 74);
    const dx = s.left + (s.width - dw) / 2;
    const dy = s.bottom - dw * (130 / 120) + 8;
    const e = easeInOut(dockP);
    const w = lerp(a.width, dw, e);
    const x = lerp(a.left, dx, e);
    const yy = lerp(a.top, dy, e) - Math.sin(Math.PI * e) * 36;
    cupScale = w / cupW;
    cup.style.transform = `translate3d(${x.toFixed(2)}px, ${yy.toFixed(2)}px, 0) scale(${cupScale.toFixed(4)})`;
    cup.style.setProperty('--co', clamp(1 - dockP * 3, 0, 1).toFixed(3));
  }

  function heroTick(y, dt) {
    const p = clamp(y / (vh * 0.62), 0, 1);
    const drift = [[-70, -30, -40], [-30, -110, 25], [40, -110, -30], [80, -20, 45]];
    heroBalls.forEach((b, i) => {
      const d = drift[i % 4];
      b.style.setProperty('--dx', (d[0] * p).toFixed(1) + 'px');
      b.style.setProperty('--dy', (d[1] * p).toFixed(1) + 'px');
      b.style.setProperty('--dr', (d[2] * p).toFixed(1) + 'deg');
    });
    heroCircle.style.setProperty('--cs', (1 + p * 0.28).toFixed(3));
    sprinkles.forEach((s, i) => s.style.setProperty('--py', (-y * (0.12 + i * 0.07)).toFixed(1) + 'px'));
    flap = lerp(flap, clamp(Math.abs(vel) / 16000, 0, 0.14), 1 - Math.exp(-dt * 8));
    awning.style.setProperty('--flap', flap.toFixed(4));
  }

  function shelvesTick(y, dt) {
    const target = clamp(vel * 0.0055, -11, 11);
    for (const s of shelves) {
      const q = (y + vh - s.top) / (vh + s.h);
      if (q < -0.05 || q > 1.05) { s.jy = 0; s.jv = 0; continue; }
      const c = q - 0.5;
      const st = s.el.style;
      st.setProperty('--hx', (-c * 80 * s.dir).toFixed(1) + 'px');
      st.setProperty('--hy', (-c * 50).toFixed(1) + 'px');
      st.setProperty('--hr', (c * 46 * s.dir).toFixed(1) + 'deg');
      st.setProperty('--wx', (c * 240 * s.dir).toFixed(1) + 'px');
      st.setProperty('--cs', (0.84 + 0.22 * Math.sin(clamp(q, 0, 1) * Math.PI)).toFixed(3));
      // soft & fluffy: the tray's donut balls wobble on a spring when you scroll
      s.jv += (-(s.jy - target) * 190 - s.jv * 12) * dt;
      s.jy += s.jv * dt;
      s.tray.style.setProperty('--jy', s.jy.toFixed(2));
      s.tray.style.setProperty('--sq', (s.jy * 0.0065).toFixed(4));
    }
  }

  function marqueesTick(y, dt) {
    for (const m of marquees) {
      if (y + vh < m.top - 50 || y > m.top + m.h + 50) continue;
      m.off = (m.off + m.dir * vel * dt * 0.45) % m.half;
      m.boost.style.setProperty('--mb', m.off.toFixed(1) + 'px');
    }
  }

  // ------------------------------------------------------------------ Mea looks at the donut balls
  function lookAt(x, y) { lookTarget = { x, y, t: performance.now() }; wake(700); }
  function meaTick(dt) {
    if (lookTarget && performance.now() - lookTarget.t > 2600) lookTarget = null;
    const k = 1 - Math.exp(-dt * 12);
    for (const m of meas) {
      const r = m.svg.getBoundingClientRect();
      if (!r.width || r.bottom < 0 || r.top > vh) continue;
      let tx = 0;
      let ty = 0;
      if (lookTarget) {
        const dx = lookTarget.x - (r.left + r.width * 0.5);
        const dy = lookTarget.y - (r.top + r.height * 0.64);
        const d = Math.hypot(dx, dy) || 1;
        const m2 = Math.min(1, d / 90);
        tx = (dx / d) * 13 * m2;
        ty = (dy / d) * 9 * m2;
      }
      m.x = lerp(m.x, tx, k);
      m.y = lerp(m.y, ty, k);
      m.look.style.transform = `translate(${m.x.toFixed(2)}px, ${m.y.toFixed(2)}px)`;
    }
  }
  function setExpr(svg, e) {
    if (!svg) return;
    svg.dataset.expr = e;
    $('.mea-eyes', svg).setAttribute('href', '#mea-eyes-' + e);
    $('.mea-mouth', svg).setAttribute('href', '#mea-mouth-' + e);
  }
  let sayTimer = 0;
  function say(expr, text) {
    const docked = dockP > 0.5;
    const bubble = docked ? bubbleDock : bubbleHero;
    (docked ? bubbleHero : bubbleDock).hidden = true;
    setExpr(docked ? dockMeaSvg : heroMeaSvg, expr);
    bubble.textContent = text;
    bubble.hidden = false;
    bubble.style.animation = 'none';
    void bubble.offsetWidth;
    bubble.style.animation = '';
    dockMea.classList.toggle('is-on', docked);
    clearTimeout(sayTimer);
    sayTimer = setTimeout(() => {
      bubbleDock.hidden = true;
      bubbleHero.hidden = true;
      dockMea.classList.remove('is-on');
      setExpr(heroMeaSvg, 'happy');
      setExpr(dockMeaSvg, 'happy');
    }, 2400);
  }

  // ------------------------------------------------------------------ cup rendering
  function slotPoint(si) {
    const r = cup.getBoundingClientRect();
    const S = SLOTS[si];
    return { x: r.left + r.width * S.x, y: r.top + r.height * S.y, size: r.width * BALL_W };
  }
  function renderSlot(item, si) {
    let img = cupBalls.querySelector(`[data-slot="${si}"]`);
    if (!img) {
      img = document.createElement('img');
      img.className = 'cup-ball';
      img.alt = '';
      img.draggable = false;
      img.dataset.slot = si;
      cupBalls.appendChild(img);
    }
    img.src = src(item.flavor, item.variant, 288);
    const S = SLOTS[si];
    img.style.left = S.x * 100 + '%';
    img.style.top = S.y * 100 + '%';
    img.style.zIndex = S.z;
    img.style.setProperty('--r', S.r + 'deg');
    return img;
  }
  function renderCup() {
    cupBalls.textContent = '';
    const start = state.display * CUP;
    state.items.slice(start, start + CUP).forEach((it, i) => { if (it.landed) renderSlot(it, i); });
    const inCup = state.items.slice(start, start + CUP).filter((i) => i.landed).length;
    cup.classList.toggle('is-full', inCup === CUP);
  }
  function bumpCup() {
    if (REDUCE) return;
    cupBody.animate([
      { transform: 'scale(1, 1)' },
      { transform: 'scale(1.07, .92)', offset: 0.3 },
      { transform: 'scale(.97, 1.04)', offset: 0.65 },
      { transform: 'scale(1, 1)' },
    ], { duration: 440, easing: 'ease-out' });
  }
  function sparkle(n) {
    if (REDUCE) return;
    const r = cup.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height * 0.15;
    const colors = ['#FFC93C', '#B49CF4', '#FF9EC4', '#FFFFFF', '#14A6A0'];
    for (let i = 0; i < n; i++) {
      const s = document.createElement('i');
      s.className = 'spark';
      s.style.background = colors[i % colors.length];
      flyLayer.appendChild(s);
      const a = -Math.PI / 2 + (i / (n - 1) - 0.5) * 2.6;
      const d = 50 + Math.random() * 50 + r.width * 0.3;
      const rot = Math.random() * 540 - 270;
      s.animate([
        { transform: `translate(${cx}px, ${cy}px) rotate(0deg) scale(.4)`, opacity: 1 },
        { transform: `translate(${cx + Math.cos(a) * d}px, ${cy + Math.sin(a) * d}px) rotate(${rot}deg) scale(1)`, opacity: 1, offset: 0.55 },
        { transform: `translate(${cx + Math.cos(a) * d * 1.15}px, ${cy + Math.sin(a) * d + 70}px) rotate(${rot * 1.4}deg) scale(.9)`, opacity: 0 },
      ], { duration: 900 + Math.random() * 300, easing: 'cubic-bezier(.2,.8,.3,1)' }).finished.then(() => s.remove());
    }
  }

  // ------------------------------------------------------------------ picking + flying
  function makeFlyer(flavor, variant, size, ghost) {
    const el = document.createElement('div');
    el.className = ghost ? 'flyer ghost' : 'flyer';
    el.style.width = size + 'px';
    el.style.height = size + 'px';
    const img = document.createElement('img');
    img.src = src(flavor, variant, 288);
    img.alt = '';
    img.draggable = false;
    el.appendChild(img);
    flyLayer.appendChild(el);
    return el;
  }
  function popHeroBall(btn) {
    if (REDUCE) return;
    $('img', btn).animate([
      { transform: 'scale(.55)', opacity: 0.25 },
      { transform: 'scale(1.08)', opacity: 1, offset: 0.7 },
      { transform: 'scale(1)', opacity: 1 },
    ], { duration: 520, delay: 140, easing: 'ease-out', fill: 'backwards' });
  }
  function refill(btn) {
    const img = $('img', btn);
    setTimeout(() => {
      const v = 1 + (Number(btn.dataset.variant) % 3);
      btn.dataset.variant = v;
      img.src = src(btn.dataset.flavor, v, 288);
      btn.classList.remove('is-taken');
      if (!REDUCE) {
        img.animate([
          { transform: 'translateX(140%) rotate(260deg)' },
          { transform: 'translateX(-7%) rotate(-14deg)', offset: 0.72 },
          { transform: 'translateX(0) rotate(0deg)' },
        ], { duration: 580, easing: 'cubic-bezier(.25,.8,.35,1)' });
      }
    }, 420);
  }
  function nudgeCup() {
    if (REDUCE) return;
    cupBody.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(-7deg)' }, { transform: 'rotate(6deg)' }, { transform: 'rotate(0)' }], { duration: 360 });
  }

  function pickFrom(btn, ghost) {
    const flavor = btn.dataset.flavor;
    const variant = Number(btn.dataset.variant);
    const isTray = btn.classList.contains('tray-ball');
    if (!canAccept()) {
      if (state.open) return;
      if (queue.length < 12) queue.push(btn);
      if (ghost) returnHome(ghost);
      nudgeCup();
      return;
    }
    const item = { id: ++state.uid, flavor, variant, landed: false };
    state.items.push(item);
    const si = state.items.length - 1 - state.display * CUP;
    let from;
    if (ghost) {
      from = { el: ghost.el, x: ghost.x, y: ghost.y, base: ghost.size, scale: 1.18, tilt: ghost.tilt || 0 };
    } else {
      const r = $('img', btn).getBoundingClientRect();
      from = { x: r.left + r.width / 2, y: r.top + r.height / 2, base: r.width, scale: 1 };
      if (isTray) btn.classList.add('is-taken');
      else popHeroBall(btn);
    }
    if (isTray) refill(btn);
    fly(item, si, from);
    haptic(10);
  }

  function fly(item, si, from) {
    const el = from.el || makeFlyer(item.flavor, item.variant, from.base, false);
    const s0 = from.base;
    const x0 = from.x;
    const y0 = from.y;
    const first = slotPoint(si);
    const dist = Math.hypot(first.x - x0, first.y - y0);
    const dur = REDUCE ? 160 : clamp(360 + dist * 0.42, 440, 760);
    const spin = from.el ? 0 : (Math.random() < 0.5 ? -360 : 360);
    const tilt0 = from.tilt || 0;
    const t0 = performance.now();
    state.flying++;
    wake(dur + 200);
    const step = (now) => {
      const t = clamp((now - t0) / dur, 0, 1);
      const e = easeInOut(t);
      const s = slotPoint(si);
      const hover = s.size * 0.95;
      const tx = s.x;
      const ty = s.y - hover;
      const lift = from.el ? 26 : clamp(60 + Math.abs(x0 - tx) * 0.2 + Math.max(0, ty - y0) * 0.12, 60, 170);
      const x = lerp(x0, tx, e);
      const y = lerp(y0, ty, e) - lift * 4 * e * (1 - e);
      const k = lerp(from.scale, s.size / s0, easeOut(t)) * (1 + (from.el ? 0 : 0.16) * Math.sin(Math.PI * t));
      const rot = tilt0 * (1 - e) + spin * e;
      el.style.transform = `translate3d(${(x - s0 / 2).toFixed(1)}px, ${(y - s0 / 2).toFixed(1)}px, 0) rotate(${rot.toFixed(1)}deg) scale(${k.toFixed(3)})`;
      lookAt(x, y);
      if (t < 1) requestAnimationFrame(step);
      else {
        el.remove();
        state.flying--;
        land(item, si, hover);
      }
    };
    requestAnimationFrame(step);
  }

  function land(item, si, hoverPx) {
    // the cup may have been reset while this ball was in the air
    if (!state.items.includes(item)) return;
    item.landed = true;
    const img = renderSlot(item, si);
    const r = SLOTS[si].r;
    if (!REDUCE) {
      const off = hoverPx / Math.max(0.05, cupScale);
      img.animate([
        { transform: `translate(-50%, -50%) translateY(${-off}px) rotate(${r - 24}deg)`, easing: 'cubic-bezier(.55,0,1,.45)' },
        { transform: `translate(-50%, -50%) rotate(${r}deg) scale(1.15, .84)`, offset: 0.58, easing: 'cubic-bezier(0,.55,.45,1)' },
        { transform: `translate(-50%, -50%) translateY(${-off * 0.14}px) rotate(${r}deg) scale(.95, 1.06)`, offset: 0.8 },
        { transform: `translate(-50%, -50%) rotate(${r}deg)` },
      ], { duration: 460 });
      setTimeout(bumpCup, 250);
    }
    haptic(8);
    updateUI();
    const start = state.display * CUP;
    const inCup = state.items.slice(start, start + CUP);
    const count = inCup.filter((i) => i.landed).length;
    live.textContent = `${FL[item.flavor].name} added. Cup ${state.display + 1}: ${count} of ${CUP}.`;
    if (inCup.length === CUP && count === CUP) {
      celebrate();
    } else if (!state.saidFirst) {
      state.saidFirst = true;
      say('happy', `Good pick! ${CUP - count} more fit.`);
    }
  }

  async function celebrate() {
    state.swapping = true;
    cup.classList.add('is-full');
    haptic([12, 50, 12]);
    sparkle(9);
    say('wink', state.display === 0 ? 'Cup full! Here’s a fresh one.' : `Cup ${state.display + 1} is full!`);
    await wait(REDUCE ? 400 : 1000);
    if (state.open) { state.swapping = false; return; }
    if (!REDUCE) {
      const r = cup.getBoundingClientRect();
      const wrap = document.createElement('div');
      wrap.className = 'flyer cup-clone';
      wrap.style.width = cupW + 'px';
      wrap.style.height = cupW * (130 / 120) + 'px';
      wrap.style.transformOrigin = '0 0';
      const clone = cupBody.cloneNode(true);
      clone.removeAttribute('id');
      wrap.appendChild(clone);
      flyLayer.appendChild(wrap);
      wrap.animate([
        { transform: `translate3d(${r.left}px, ${r.top}px, 0) scale(${cupScale})`, opacity: 1 },
        { transform: `translate3d(${r.left - r.width * 0.25}px, ${r.top - r.height * 0.5}px, 0) scale(${cupScale * 0.9}) rotate(-8deg)`, opacity: 1, offset: 0.35 },
        { transform: `translate3d(${r.left - r.width * 1.4}px, ${r.top - r.height * 0.2}px, 0) scale(${cupScale * 0.55}) rotate(-24deg)`, opacity: 0 },
      ], { duration: 620, easing: 'cubic-bezier(.45,0,.7,.4)' }).finished.then(() => wrap.remove());
    }
    state.display = settleIndex();
    renderCup();
    updateUI();
    if (!REDUCE) {
      cupBody.animate([
        { transform: 'translateY(-70%) scale(.9)', opacity: 0 },
        { transform: 'translateY(5%) scale(1.03, .97)', opacity: 1, offset: 0.7 },
        { transform: 'none', opacity: 1 },
      ], { duration: 460, delay: 120, easing: 'ease-out', fill: 'backwards' });
    }
    await wait(REDUCE ? 50 : 560);
    state.swapping = false;
    drainQueue();
  }

  async function drainQueue() {
    while (queue.length && canAccept()) {
      pickFrom(queue.shift());
      await wait(110);
    }
  }

  // ------------------------------------------------------------------ drag (hold + drag on touch, drag on mouse)
  let drag = null;
  let press = null;
  let touch = null;

  function startDrag(btn, x, y, isTouch) {
    const img = $('img', btn);
    const r = img.getBoundingClientRect();
    const size = r.width;
    const el = makeFlyer(btn.dataset.flavor, btn.dataset.variant, size, true);
    const offY = isTouch ? size * 0.42 : 0;
    drag = { btn, el, size, x: r.left + size / 2, y: r.top + size / 2, tx: x, ty: y - offY, offY, vx: 0, tilt: 0, over: false };
    if (btn.classList.contains('tray-ball')) btn.classList.add('is-taken');
    else popHeroBall(btn);
    root.classList.add('is-dragging');
    dragTick(1 / 60);
    wake(1000);
    haptic(12);
    if (!state.saidDrag) { state.saidDrag = true; say('wow', 'Drop it in the cup!'); }
  }
  function moveDrag(x, y) {
    if (!drag) return;
    drag.tx = x;
    drag.ty = y - drag.offY;
    wake(400);
  }
  function overCup(x, y) {
    const r = cup.getBoundingClientRect();
    const pad = Math.max(26, r.width * 0.28);
    return x > r.left - pad && x < r.right + pad && y > r.top - pad * 1.7 && y < r.bottom + pad * 0.4;
  }
  function dragTick(dt) {
    const k = 1 - Math.exp(-dt * 24);
    const px = drag.x;
    drag.x = lerp(drag.x, drag.tx, k);
    drag.y = lerp(drag.y, drag.ty, k);
    drag.vx = lerp(drag.vx, (drag.x - px) / Math.max(dt, 0.001), 0.25);
    drag.tilt = clamp(drag.vx * 0.035, -30, 30);
    drag.el.style.transform = `translate3d(${(drag.x - drag.size / 2).toFixed(1)}px, ${(drag.y - drag.size / 2).toFixed(1)}px, 0) rotate(${drag.tilt.toFixed(1)}deg) scale(1.18)`;
    lookAt(drag.x, drag.y);
    const over = overCup(drag.x, drag.y);
    if (over !== drag.over) {
      drag.over = over;
      cup.classList.toggle('is-ready', over);
      if (over) haptic(6);
    }
  }
  function endDrag() {
    if (!drag) return;
    const d = drag;
    drag = null;
    root.classList.remove('is-dragging');
    cup.classList.remove('is-ready');
    wake(600);
    if (overCup(d.x, d.y)) pickFrom(d.btn, d);
    else returnHome(d);
  }
  function returnHome(d) {
    const r = $('img', d.btn).getBoundingClientRect();
    const tx = r.left + r.width / 2;
    const ty = r.top + r.height / 2;
    const x0 = d.x;
    const y0 = d.y;
    const t0 = performance.now();
    const dur = REDUCE ? 1 : 360;
    const step = (now) => {
      const t = clamp((now - t0) / dur, 0, 1);
      const e = easeOut(t);
      const x = lerp(x0, tx, e);
      const y = lerp(y0, ty, e) - 40 * Math.sin(Math.PI * t);
      d.el.style.transform = `translate3d(${(x - d.size / 2).toFixed(1)}px, ${(y - d.size / 2).toFixed(1)}px, 0) rotate(${(d.tilt * (1 - e)).toFixed(1)}deg) scale(${lerp(1.18, 1, e).toFixed(3)})`;
      if (t < 1) requestAnimationFrame(step);
      else { d.el.remove(); d.btn.classList.remove('is-taken'); }
    };
    requestAnimationFrame(step);
  }
  function cancelDrag() {
    if (!drag) return;
    const d = drag;
    drag = null;
    root.classList.remove('is-dragging');
    cup.classList.remove('is-ready');
    returnHome(d);
  }

  // mouse and pen
  function onPointerDown(e) {
    if (e.pointerType === 'touch' || e.button !== 0 || state.open) return;
    e.preventDefault();
    press = { btn: e.currentTarget, x0: e.clientX, y0: e.clientY, id: e.pointerId, dragging: false };
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerCancel);
  }
  function stopPointer() {
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointercancel', onPointerCancel);
  }
  function onPointerMove(e) {
    if (!press || e.pointerId !== press.id) return;
    if (!press.dragging) {
      if (Math.hypot(e.clientX - press.x0, e.clientY - press.y0) > 6) {
        press.dragging = true;
        startDrag(press.btn, e.clientX, e.clientY, false);
      }
    } else moveDrag(e.clientX, e.clientY);
  }
  function onPointerUp(e) {
    if (!press || e.pointerId !== press.id) return;
    const p = press;
    press = null;
    stopPointer();
    if (p.dragging) endDrag();
    else pickFrom(p.btn);
  }
  function onPointerCancel() {
    const p = press;
    press = null;
    stopPointer();
    if (p && p.dragging) cancelDrag();
  }

  // touch: a quick tap adds the ball; press and hold (about 0.2 s) picks it up to drag
  const findTouch = (list, id) => { for (let i = 0; i < list.length; i++) if (list[i].identifier === id) return list[i]; return null; };
  function onTouchStart(e) {
    if (touch || e.touches.length > 1 || state.open) return;
    const t = e.changedTouches[0];
    const btn = e.currentTarget;
    touch = { btn, id: t.identifier, x0: t.clientX, y0: t.clientY, x: t.clientX, y: t.clientY, dragging: false, cancelled: false };
    lookAt(t.clientX, t.clientY);
    touch.hold = setTimeout(() => {
      if (touch && !touch.cancelled && !touch.dragging) {
        touch.dragging = true;
        startDrag(touch.btn, touch.x, touch.y, true);
      }
    }, 200);
  }
  function onTouchMove(e) {
    if (!touch) return;
    const t = findTouch(e.changedTouches, touch.id);
    if (!t) return;
    touch.x = t.clientX;
    touch.y = t.clientY;
    if (touch.dragging) {
      if (e.cancelable) e.preventDefault();
      moveDrag(t.clientX, t.clientY);
    } else if (!touch.cancelled && Math.hypot(t.clientX - touch.x0, t.clientY - touch.y0) > 10) {
      touch.cancelled = true;
      clearTimeout(touch.hold);
    }
  }
  function onTouchEnd(e) {
    if (!touch) return;
    const t = findTouch(e.changedTouches, touch.id);
    if (!t) return;
    const T = touch;
    touch = null;
    clearTimeout(T.hold);
    if (T.dragging) {
      if (e.cancelable) e.preventDefault();
      endDrag();
    } else if (!T.cancelled) {
      if (e.cancelable) e.preventDefault();
      pickFrom(T.btn);
    }
  }
  function onTouchCancel() {
    if (!touch) return;
    const T = touch;
    touch = null;
    clearTimeout(T.hold);
    if (T.dragging) cancelDrag();
  }

  $$('.ball').forEach((btn) => {
    btn.addEventListener('contextmenu', (e) => e.preventDefault());
    btn.addEventListener('dragstart', (e) => e.preventDefault());
    btn.addEventListener('pointerdown', onPointerDown);
    btn.addEventListener('touchstart', onTouchStart, { passive: true });
    btn.addEventListener('touchmove', onTouchMove, { passive: false });
    btn.addEventListener('touchend', onTouchEnd, { passive: false });
    btn.addEventListener('touchcancel', onTouchCancel, { passive: true });
    // keyboard (Enter / Space) arrives as a click with detail 0
    btn.addEventListener('click', (e) => { if (e.detail === 0) pickFrom(btn); });
  });

  // ------------------------------------------------------------------ UI: counter bar, cup label, order summary
  function updateUI() {
    const landed = landedItems();
    const total = totalOf(landed);
    const start = state.display * CUP;
    const inCup = state.items.slice(start, start + CUP).filter((i) => i.landed);
    cupCount.innerHTML = `<b>${inCup.length}</b> of ${CUP}` + (state.display ? ` · cup ${state.display + 1}` : '');
    dockCup.textContent = `Cup ${state.display + 1}`;
    let dots = '';
    for (let i = 0; i < CUP; i++) {
      const it = inCup[i];
      dots += it ? `<i class="on" style="background:${FL[it.flavor].dot}"></i>` : '<i></i>';
    }
    dockDots.innerHTML = dots;
    dockSub.textContent = landed.length
      ? `${landed.length} pc${landed.length === 1 ? '' : 's'} · ${peso(total)}`
      : 'Tap a donut ball to start';
    dockCta.hidden = landed.length === 0;
    renderOrder();
  }

  function miniCup(items, ci, interactive) {
    const balls = items.map((it, i) => {
      const S = SLOTS[i];
      const style = `left:${S.x * 100}%;top:${S.y * 100}%;z-index:${S.z};--r:${S.r}deg`;
      const img = `<img src="${src(it.flavor, it.variant, 288)}" alt="" width="288" height="288" draggable="false">`;
      return interactive
        ? `<button class="cb" type="button" style="${style}" data-remove="${it.id}" aria-label="Take out one ${esc(FL[it.flavor].name)} from cup ${ci + 1}">${img}</button>`
        : `<span class="cb" style="${style}">${img}</span>`;
    }).join('');
    const full = items.length === CUP;
    return `<figure class="mcup"><div class="mcup-box">`
      + `<svg class="cup-svg" viewBox="0 0 120 130" aria-hidden="true"><use href="#cup-back"/></svg>`
      + `<div class="cup-balls">${balls}</div>`
      + `<svg class="cup-svg" viewBox="0 0 120 130" aria-hidden="true"><use href="#cup-front"/></svg>`
      + (full ? `<svg class="cup-svg cup-skewer" viewBox="0 0 120 130" aria-hidden="true"><use href="#skewer"/></svg>` : '')
      + `</div><figcaption>Cup ${ci + 1}<span>${full ? 'Full' : `${items.length} of ${CUP}`}</span></figcaption></figure>`;
  }
  function counts(items) {
    const c = {};
    items.forEach((i) => { c[i.flavor] = (c[i.flavor] || 0) + 1; });
    return c;
  }
  function lineHTML(f, n, interactive) {
    const img = `<img src="${src(f.id, 1, 288)}" alt="" width="50" height="50">`;
    if (!interactive) {
      return `<li class="line">${img}<div><p class="line-name">${esc(f.name)}</p><p class="line-meta">${peso(f.price)} each · <span class="price">${peso(f.price * n)}</span></p></div><span class="line-qty">× ${n}</span></li>`;
    }
    return `<li class="line">${img}<div><p class="line-name">${esc(f.name)}</p><p class="line-meta">${peso(f.price)} each · <span class="price">${peso(f.price * n)}</span></p></div>`
      + `<div class="stepper"><button type="button" data-step="-" data-flavor="${f.id}" aria-label="Remove one ${esc(f.name)}">−</button>`
      + `<output aria-label="${esc(f.name)} count">${n}</output>`
      + `<button type="button" data-step="+" data-flavor="${f.id}" aria-label="Add one ${esc(f.name)}">+</button></div></li>`;
  }
  function renderOrder() {
    const items = landedItems();
    const n = items.length;
    orderEmpty.hidden = n > 0;
    orderSummary.hidden = n === 0;
    const total = totalOf(items);
    submitTotal.textContent = n ? peso(total) : '';
    if (!n) { orderCups.textContent = ''; orderLines.textContent = ''; return; }
    const focusKey = document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.step + (document.activeElement.dataset.flavor || '') : '';
    orderCups.innerHTML = chunk(items, CUP).map((c, i) => miniCup(c, i, true)).join('');
    const c = counts(items);
    orderLines.innerHTML = MENU.flavors.filter((f) => c[f.id]).map((f) => lineHTML(f, c[f.id], true)).join('');
    orderTotal.textContent = peso(total);
    if (focusKey && focusKey !== 'undefined') {
      const again = orderLines.querySelector(`[data-step="${focusKey[0]}"][data-flavor="${focusKey.slice(1)}"]`);
      if (again) again.focus({ preventScroll: true });
    }
  }

  function resync() {
    state.items = state.items.filter((i) => i.landed);
    state.display = settleIndex();
    renderCup();
    updateUI();
  }

  orderCups.addEventListener('click', (e) => {
    const b = e.target.closest('[data-remove]');
    if (!b || b.dataset.gone) return;
    b.dataset.gone = '1';
    const id = Number(b.dataset.remove);
    const done = () => { state.items = state.items.filter((i) => i.id !== id); resync(); live.textContent = 'Removed one donut ball.'; };
    if (REDUCE) return done();
    const S = b.style.getPropertyValue('--r') || '0deg';
    b.animate([
      { transform: `translate(-50%, -50%) rotate(${S})` },
      { transform: `translate(-50%, -150%) rotate(${S}) scale(1.15)`, opacity: 1, offset: 0.5 },
      { transform: `translate(-50%, -120%) rotate(${S}) scale(.4)`, opacity: 0 },
    ], { duration: 320, easing: 'ease-in' }).finished.then(done);
  });
  orderLines.addEventListener('click', (e) => {
    const b = e.target.closest('[data-step]');
    if (!b) return;
    const f = b.dataset.flavor;
    if (b.dataset.step === '-') {
      for (let i = state.items.length - 1; i >= 0; i--) {
        if (state.items[i].flavor === f) { state.items.splice(i, 1); break; }
      }
    } else {
      state.uid++;
      state.items.push({ id: state.uid, flavor: f, variant: 1 + (state.uid % 3), landed: true });
    }
    resync();
  });

  // ------------------------------------------------------------------ form + thank-you
  const form = $('#order-form');
  const fields = { first: $('#first'), last: $('#last'), phone: $('#phone') };
  const submitBtn = $('#submit');
  const formErr = $('#form-err');
  function normPhone(v) {
    let d = String(v).replace(/[^\d+]/g, '');
    if (d.startsWith('+63')) d = '0' + d.slice(3);
    else if (d.startsWith('63') && d.length === 12) d = '0' + d.slice(2);
    else if (d.startsWith('9') && d.length === 10) d = '0' + d;
    d = d.replace(/\D/g, '');
    return /^09\d{9}$/.test(d) ? d : null;
  }
  const fmtPhone = (d) => `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}`;
  function setErr(name, msg) {
    $('#f-' + name).classList.toggle('invalid', !!msg);
    $('#' + name + '-err').textContent = msg || '';
    fields[name].setAttribute('aria-invalid', msg ? 'true' : 'false');
  }
  function check(name) {
    const v = fields[name].value.trim();
    if (name === 'first') return v ? '' : 'Please enter your first name.';
    if (name === 'last') return v ? '' : 'Please enter your last name.';
    if (!v) return 'Please enter your mobile number.';
    return normPhone(v) ? '' : 'Enter a PH mobile number, like 0917 123 4567.';
  }
  Object.keys(fields).forEach((name) => {
    fields[name].addEventListener('input', () => { if ($('#f-' + name).classList.contains('invalid')) setErr(name, check(name)); });
    // Check on blur, but a moment later: an error line appearing right away would push the
    // submit button down while it is being tapped.
    fields[name].addEventListener('blur', () => {
      setTimeout(() => {
        if (submitBtn.classList.contains('is-busy') || state.open) return;
        if (fields[name].value.trim()) setErr(name, check(name));
        if (name === 'phone') { const p = normPhone(fields.phone.value); if (p) fields.phone.value = fmtPhone(p); }
      }, 260);
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (submitBtn.classList.contains('is-busy')) return;
    const errs = {};
    Object.keys(fields).forEach((n) => { errs[n] = check(n); setErr(n, errs[n]); });
    const items = landedItems();
    formErr.textContent = items.length ? '' : 'Your cup is empty. Add at least 1 donut ball first.';
    const bad = Object.keys(fields).find((n) => errs[n]);
    if (!items.length) {
      document.getElementById('stall').scrollIntoView({ behavior: REDUCE ? 'auto' : 'smooth', block: 'start' });
      return;
    }
    if (bad) { fields[bad].focus(); return; }
    submitBtn.classList.add('is-busy');
    $('.btn-label', submitBtn).textContent = 'Placing your order';
    await wait(REDUCE ? 50 : 700);
    submitBtn.classList.remove('is-busy');
    $('.btn-label', submitBtn).textContent = 'Place my order';
    showThanks(fields.first.value.trim(), normPhone(fields.phone.value));
  });

  function burst() {
    if (REDUCE) return;
    const layer = document.createElement('div');
    layer.className = 'fly-layer burst-layer';
    document.body.appendChild(layer);
    const colors = ['#FFC93C', '#B49CF4', '#FF9EC4', '#FFFFFF', '#FF6B5A', '#FFF4E3'];
    const cx = vw / 2;
    const cy = Math.min(vh * 0.22, 190);
    const anims = [];
    for (let i = 0; i < 30; i++) {
      const s = document.createElement('i');
      s.className = 'spark';
      s.style.background = colors[i % colors.length];
      layer.appendChild(s);
      const a = Math.random() * Math.PI * 2;
      const sp = 110 + Math.random() * Math.min(vw * 0.45, 260);
      const dx = Math.cos(a) * sp;
      const dy = Math.sin(a) * sp * 0.75 - 90;
      const rot = Math.random() * 900 - 450;
      anims.push(s.animate([
        { transform: `translate(${cx}px, ${cy}px) rotate(0deg) scale(.3)`, opacity: 1 },
        { transform: `translate(${cx + dx}px, ${cy + dy}px) rotate(${rot / 2}deg) scale(1.2)`, opacity: 1, offset: 0.4, easing: 'cubic-bezier(.3,0,.8,.6)' },
        { transform: `translate(${cx + dx * 1.25}px, ${cy + dy + vh * 0.7}px) rotate(${rot}deg) scale(1)`, opacity: 0.2 },
      ], { duration: 1700 + Math.random() * 800, delay: 260 + Math.random() * 140, easing: 'cubic-bezier(.15,.7,.35,1)', fill: 'backwards' }).finished);
    }
    Promise.all(anims).then(() => layer.remove());
  }

  function showThanks(first, phone) {
    const items = landedItems();
    state.open = true;
    $('#t-name').textContent = first;
    $('#t-phone').textContent = fmtPhone(phone);
    $('#t-no').textContent = 'MG-' + String(1000 + Math.floor(Math.random() * 9000));
    $('#t-cups').innerHTML = chunk(items, CUP).map((c, i) => miniCup(c, i, false)).join('');
    const c = counts(items);
    $('#t-lines').innerHTML = MENU.flavors.filter((f) => c[f.id]).map((f) => lineHTML(f, c[f.id], false)).join('');
    $('#t-total').textContent = peso(totalOf(items));
    thanks.hidden = false;
    thanks.scrollTop = 0;
    thanks.classList.remove('is-in');
    void thanks.offsetWidth;
    thanks.classList.add('is-in');
    root.classList.add('is-thanks');
    setTimeout(() => $('#thanks-title').focus({ preventScroll: true }), 60);
    burst();
    haptic([10, 70, 10]);
  }

  $('#t-again').addEventListener('click', () => {
    state.items = [];
    state.display = 0;
    state.saidFirst = false;
    queue.length = 0;
    form.reset();
    Object.keys(fields).forEach((n) => setErr(n, ''));
    formErr.textContent = '';
    thanks.hidden = true;
    thanks.classList.remove('is-in');
    root.classList.remove('is-thanks');
    state.open = false;
    renderCup();
    updateUI();
    window.scrollTo({ top: 0, behavior: 'auto' });
    measure();
  });

  // ------------------------------------------------------------------ reveal: tray balls roll in the first time you reach them
  if (!REDUCE && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        const tray = en.target;
        $$('.tray-ball img', tray).forEach((img, i) => {
          img.animate([
            { transform: 'translateX(-170%) rotate(-340deg)' },
            { transform: 'translateX(7%) rotate(14deg)', offset: 0.74 },
            { transform: 'translateX(0) rotate(0deg)' },
          ], { duration: 760, delay: i * 70, easing: 'cubic-bezier(.2,.75,.3,1)', fill: 'backwards' });
        });
        tray.classList.remove('pre');
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.15 });
    shelves.forEach((s) => {
      if (s.tray.getBoundingClientRect().top > window.innerHeight) { s.tray.classList.add('pre'); io.observe(s.tray); }
    });
  }
  // hide the counter bar while the order form is on screen (the form has its own button)
  if ('IntersectionObserver' in window) {
    const formIO = new IntersectionObserver((entries) => {
      entries.forEach((en) => { dockHideTarget = en.isIntersecting ? 1 : 0; wake(900); });
    }, { threshold: 0.12 });
    formIO.observe(form);
  }

  // ------------------------------------------------------------------ menu text
  // Names, descriptions and prices come from the menu block in index.html (id="menu-data"),
  // so a price change only needs to be made there.
  shelves.forEach((s) => {
    const f = FL[s.el.dataset.flavor];
    if (!f) return;
    $('.shelf-name', s.el).textContent = f.name;
    $('.shelf-copy .eyebrow', s.el).textContent = f.what;
    $('.shelf-desc', s.el).textContent = f.desc;
    $('.shelf-price .price', s.el).textContent = peso(f.price);
    s.tray.setAttribute('aria-label', f.name + ' tray');
  });
  $$('.ball').forEach((b) => {
    const f = FL[b.dataset.flavor];
    if (f) b.setAttribute('aria-label', `Add a ${f.name} donut ball to your cup`);
  });

  // ------------------------------------------------------------------ boot
  window.addEventListener('scroll', () => wake(450), { passive: true });
  window.addEventListener('resize', () => { measure(); wake(400); });
  window.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse' && !drag) lookAt(e.clientX, e.clientY); }, { passive: true });
  if ('ResizeObserver' in window) {
    let pending = 0;
    new ResizeObserver(() => { if (!pending) pending = requestAnimationFrame(() => { pending = 0; measure(); }); }).observe(document.body);
  }
  window.addEventListener('load', measure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);

  measure();
  renderCup();
  updateUI();
  root.classList.add('js-ready');
  wake(600);
})();
