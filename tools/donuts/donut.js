// Procedural placeholder donut renders for the Meagi order page.
// Shapes: 'with-hole' (glazed ring) and 'no-hole' (filled donut with a frosting cap).
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { SimplexNoise } from 'three/addons/math/SimplexNoise.js';

const SIZE = 1280;
const ELEV = THREE.MathUtils.degToRad(38);

function rng(seed) { // mulberry32
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ------------------------------------------------------------------ renderer + scene
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(SIZE, SIZE);
renderer.setClearColor(0x000000, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.toneMappingExposure = 0.9;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
document.body.appendChild(renderer.domElement);

const pmrem = new THREE.PMREMGenerator(renderer);
const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

// ------------------------------------------------------------------ GLSL
const NOISE = /* glsl */`
vec3 dn_mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 dn_mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 dn_permute(vec4 x) { return dn_mod289(((x * 34.0) + 10.0) * x); }
vec4 dn_tis(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
float dn_snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = dn_mod289(i);
  vec4 p = dn_permute(dn_permute(dn_permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = dn_tis(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.5 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 105.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
vec3 dn_perturb(vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDir) {
  vec3 vSigmaX = normalize(dFdx(surf_pos.xyz));
  vec3 vSigmaY = normalize(dFdy(surf_pos.xyz));
  vec3 R1 = cross(vSigmaY, surf_norm);
  vec3 R2 = cross(surf_norm, vSigmaX);
  float fDet = dot(vSigmaX, R1) * faceDir;
  vec3 vGrad = sign(fDet) * (dHdxy.x * R1 + dHdxy.y * R2);
  return normalize(abs(fDet) * surf_norm - vGrad);
}
`;

const DOUGH_PARS = /* glsl */`
varying vec3 vPos;
uniform vec3 uBase; uniform vec3 uDark; uniform vec3 uPale;
uniform float uBandY; uniform float uBandW; uniform float uBandAmt;
uniform vec3 uSeed; uniform float uBump;
${NOISE}
`;
const DOUGH_COLOR = /* glsl */`
{
  vec3 q = vPos + uSeed;
  float n1 = dn_snoise(q * 2.2);
  float n2 = dn_snoise(q * 7.5 + 3.0);
  float n3 = dn_snoise(q * 34.0 + 11.0);
  float toast = 0.5 + 0.22 * n1 + 0.12 * n2;
  vec3 col = mix(uBase, uDark, smoothstep(0.35, 1.05, toast) * 0.8);
  // the pale band around the middle, where the dough floated in the oil
  float bw = uBandW * (1.0 + 0.45 * dn_snoise(q * 5.0 + 7.0));
  float band = 1.0 - smoothstep(bw * 0.45, bw, abs(vPos.y - uBandY - 0.025 * n2));
  col = mix(col, uPale, band * uBandAmt);
  col *= 1.0 - 0.13 * smoothstep(0.35, 0.95, n3);
  diffuseColor.rgb *= col;
}
`;
const DOUGH_NORMAL = /* glsl */`
{
  vec3 q = vPos + uSeed;
  float h = 0.50 * dn_snoise(q * 20.0) + 0.30 * dn_snoise(q * 48.0 + 5.0) + 0.16 * dn_snoise(q * 105.0 + 9.0);
  h -= 0.55 * smoothstep(0.55, 0.9, dn_snoise(q * 64.0 + 2.0)); // little pores
  vec2 dHdxy = vec2(dFdx(h), dFdy(h)) * uBump;
  normal = dn_perturb(-vViewPosition, normal, dHdxy, faceDirection);
}
`;

const FROST_PARS = /* glsl */`
varying vec3 vPos;
uniform vec3 uSeed; uniform float uBump; uniform float uSpeck; uniform vec3 uSpeckColor; uniform float uDust;
${NOISE}
`;
const FROST_COLOR = /* glsl */`
{
  vec3 q = vPos + uSeed;
  float r = 0.5 * dn_snoise(q * 6.0) + 0.25 * dn_snoise(q * 15.0 + 4.0);
  diffuseColor.rgb *= 1.0 + 0.035 * r;
  float sp = smoothstep(0.72, 0.84, dn_snoise(q * 30.0 + 3.1));
  float sp2 = smoothstep(0.76, 0.88, dn_snoise(q * 62.0 + 9.7));
  diffuseColor.rgb = mix(diffuseColor.rgb, uSpeckColor, uSpeck * max(sp, sp2 * 0.85));
  float dust = smoothstep(0.1, 0.9, dn_snoise(q * 140.0 + 1.7));
  diffuseColor.rgb *= 1.0 - uDust * 0.12 * dust;
}
`;
const FROST_NORMAL = /* glsl */`
{
  vec3 q = vPos + uSeed;
  float h = 0.6 * dn_snoise(q * 8.0) + 0.3 * dn_snoise(q * 21.0 + 2.0) + uDust * 0.25 * dn_snoise(q * 140.0 + 1.7);
  vec2 dHdxy = vec2(dFdx(h), dFdy(h)) * uBump;
  normal = dn_perturb(-vViewPosition, normal, dHdxy, faceDirection);
}
`;

function inject(mat, key, uniforms, pars, color, normal) {
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vPos;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvPos = transformed;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\n' + pars)
      .replace('#include <color_fragment>', '#include <color_fragment>\n' + color)
      .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n' + normal);
  };
  mat.customProgramCacheKey = () => key;
  return mat;
}

function doughMaterial(o, rnd) {
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, roughness: o.roughness, metalness: 0,
    clearcoat: o.clearcoat, clearcoatRoughness: o.clearcoatRoughness,
    sheen: 0.2, sheenRoughness: 0.55, sheenColor: new THREE.Color('#FFE3BF'),
    envMapIntensity: 1.0,
  });
  return inject(mat, 'dough', {
    uBase: { value: new THREE.Color(o.base) },
    uDark: { value: new THREE.Color(o.dark) },
    uPale: { value: new THREE.Color(o.pale) },
    uBandY: { value: o.bandY }, uBandW: { value: o.bandW }, uBandAmt: { value: o.bandAmt },
    uSeed: { value: new THREE.Vector3(rnd() * 50, rnd() * 50, rnd() * 50) },
    uBump: { value: o.bump },
  }, DOUGH_PARS, DOUGH_COLOR, DOUGH_NORMAL);
}

function frostMaterial(o, rnd) {
  const mat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(o.color), roughness: o.roughness ?? 0.3, metalness: 0,
    clearcoat: o.clearcoat ?? 0.55, clearcoatRoughness: o.clearcoatRoughness ?? 0.12,
    sheen: o.sheen ?? 0, sheenRoughness: 0.5, sheenColor: new THREE.Color(o.sheenColor || '#ffffff'),
  });
  return inject(mat, 'frost', {
    uSeed: { value: new THREE.Vector3(rnd() * 50, rnd() * 50, rnd() * 50) },
    uBump: { value: o.bump ?? 0.012 },
    uSpeck: { value: o.speck ?? 0 },
    uSpeckColor: { value: new THREE.Color(o.speckColor || '#7A3E1A') },
    uDust: { value: o.dust ?? 0 },
  }, FROST_PARS, FROST_COLOR, FROST_NORMAL);
}

// ------------------------------------------------------------------ geometry helpers
function finish(pos, idx, probe) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  // make sure the faces point outward: check one vertex whose outward direction we know
  if (probe) {
    const n = g.attributes.normal;
    const d = n.getX(probe.i) * probe.dir[0] + n.getY(probe.i) * probe.dir[1] + n.getZ(probe.i) * probe.dir[2];
    if (d < 0) {
      for (let k = 0; k < idx.length; k += 3) { const t = idx[k + 1]; idx[k + 1] = idx[k + 2]; idx[k + 2] = t; }
      g.setIndex(idx);
      g.computeVertexNormals();
    }
  }
  return g;
}

// A donut with a hole (torus with a flatter bottom, puffier outside, organic lumps).
function ringGeometry(rnd) {
  const noise = new SimplexNoise({ random: rnd });
  const NU = 360, NV = 180;
  const R = 0.625, r = 0.375;
  const ex = 1 + (rnd() - 0.5) * 0.05;
  const pos = new Float32Array(NU * NV * 3);
  for (let i = 0; i < NU; i++) {
    const u = (i / NU) * Math.PI * 2;
    const cu = Math.cos(u), su = Math.sin(u);
    for (let j = 0; j < NV; j++) {
      const v = (j / NV) * Math.PI * 2;
      const cv = Math.cos(v), sv = Math.sin(v);
      let px = cv * r * (cv > 0 ? 1.04 : 0.96);
      const py = sv * r * (sv > 0 ? 0.86 : 0.64);
      let x = cu * (R + px), z = su * (R + px) * ex, y = py;
      const nx = cu * cv, ny = sv, nz = su * cv;
      const d = 0.03 * noise.noise3d(x * 1.5 + 10, y * 1.5, z * 1.5) + 0.011 * noise.noise3d(x * 4 + 3, y * 4 + 5, z * 4);
      x += nx * d; y += ny * d * 0.8; z += nz * d;
      const k = (i * NV + j) * 3;
      pos[k] = x; pos[k + 1] = y; pos[k + 2] = z;
    }
  }
  const idx = [];
  for (let i = 0; i < NU; i++) for (let j = 0; j < NV; j++) {
    const a = i * NV + j, b = ((i + 1) % NU) * NV + j, c = ((i + 1) % NU) * NV + ((j + 1) % NV), d = i * NV + ((j + 1) % NV);
    idx.push(a, b, d, b, c, d);
  }
  return finish(pos, idx, { i: 0, dir: [1, 0, 0] });
}

// A round donut without a hole: a puffy superellipse bun.
function makeBun(rnd, P) {
  const noise = new SimplexNoise({ random: rnd });
  const n = P.n;
  // position + normal on the bun surface at (theta from the top pole, phi around)
  function at(theta, phi) {
    const s = Math.sin(theta), c = Math.cos(theta);
    const rad = Math.pow(Math.abs(s), 2 / n);
    const h = c >= 0 ? P.topH : P.botH;
    const yy = Math.sign(c) * Math.pow(Math.abs(c), 2 / n) * h;
    const cp = Math.cos(phi), sp = Math.sin(phi);
    let x = rad * cp, z = rad * sp * P.ex, y = yy;
    // normal of the superellipse (x^n + (y/h)^n = 1)
    let nr = Math.pow(Math.max(rad, 1e-6), n - 1);
    let ny = Math.sign(yy) * Math.pow(Math.abs(yy) / h, n - 1) / h;
    const len = Math.hypot(nr, ny) || 1;
    nr /= len; ny /= len;
    const nx = nr * cp, nz = nr * sp;
    const d = 0.028 * noise.noise3d(x * 1.5 + 10, y * 1.5, z * 1.5) + 0.01 * noise.noise3d(x * 4 + 3, y * 4 + 5, z * 4);
    return [x + nx * d, y + ny * d * 0.8, z + nz * d, nx, ny, nz];
  }
  // polar mesh: pole vertex at theta=0, rings, pole at theta=PI
  const NR = 200, NS = 360;
  const pos = new Float32Array((2 + NR * NS) * 3);
  let w = 0;
  const put = (p) => { pos[w++] = p[0]; pos[w++] = p[1]; pos[w++] = p[2]; };
  put(at(0, 0));
  for (let i = 1; i <= NR; i++) {
    const th = (i / (NR + 1)) * Math.PI;
    for (let j = 0; j < NS; j++) put(at(th, (j / NS) * Math.PI * 2));
  }
  put(at(Math.PI, 0));
  const idx = [];
  const ring = (i, j) => 1 + (i - 1) * NS + (j % NS);
  for (let j = 0; j < NS; j++) idx.push(0, ring(1, j), ring(1, j + 1));
  for (let i = 1; i < NR; i++) for (let j = 0; j < NS; j++) {
    const a = ring(i, j), b = ring(i + 1, j), c = ring(i + 1, j + 1), d = ring(i, j + 1);
    idx.push(a, b, d, b, c, d);
  }
  const last = 1 + NR * NS;
  for (let j = 0; j < NS; j++) idx.push(ring(NR, j), last, ring(NR, j + 1));
  const geo = finish(pos, idx, { i: ring(NR / 2, 0), dir: [1, 0, 0] });
  return { geo, at };
}

// Frosting cap on the bun, with drips. Returns the mesh geometry and a surface function.
function makeFrosting(rnd, bun, F) {
  const drips = [];
  const count = F.drips[0] + Math.floor(rnd() * (F.drips[1] - F.drips[0] + 1));
  const base = rnd() * Math.PI * 2;
  for (let k = 0; k < count; k++) {
    drips.push({
      phi: base + (k + (rnd() - 0.5) * 0.7) * (Math.PI * 2 / count),
      w: 0.06 + rnd() * 0.09,
      len: F.dripLen[0] + rnd() * (F.dripLen[1] - F.dripLen[0]),
    });
  }
  const w1 = rnd() * 6.28, w2 = rnd() * 6.28;
  function edge(phi) {
    let t = F.theta0 * (1 + 0.045 * Math.sin(3 * phi + w1) + 0.03 * Math.sin(5 * phi + w2));
    for (const d of drips) {
      let dp = Math.abs(((phi - d.phi) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI);
      t += d.len * Math.exp(-((dp / d.w) ** 2));
    }
    return t;
  }
  function thick(u) {
    const u0 = 0.84;
    let t = u <= u0 ? 1 : Math.sqrt(Math.max(0, 1 - ((u - u0) / (1 - u0)) ** 2));
    t *= 1 + 0.22 * Math.exp(-(((u - 0.9) / 0.05) ** 2));
    return F.thick * t;
  }
  // surface point at polar coords (u in 0..1 inside the frosting)
  function surf(u, phi, extra = 0) {
    const th = u * edge(phi);
    const p = bun.at(Math.max(th, 1e-4), phi);
    const t = thick(Math.min(u, 1)) + extra;
    return [p[0] + p[3] * t, p[1] + p[4] * t, p[2] + p[5] * t, p[3], p[4], p[5]];
  }
  const NR = 150, NS = 720;
  const pos = new Float32Array((1 + NR * NS) * 3);
  let w = 0;
  const top = surf(0, 0);
  pos[w++] = top[0]; pos[w++] = top[1]; pos[w++] = top[2];
  for (let i = 1; i <= NR; i++) {
    const u = 1 - Math.pow(1 - i / NR, 1.7);
    for (let j = 0; j < NS; j++) {
      const p = surf(u, (j / NS) * Math.PI * 2);
      pos[w++] = p[0]; pos[w++] = p[1]; pos[w++] = p[2];
    }
  }
  const idx = [];
  const ring = (i, j) => 1 + (i - 1) * NS + (j % NS);
  for (let j = 0; j < NS; j++) idx.push(0, ring(1, j), ring(1, j + 1));
  for (let i = 1; i < NR; i++) for (let j = 0; j < NS; j++) {
    const a = ring(i, j), b = ring(i + 1, j), c = ring(i + 1, j + 1), d = ring(i, j + 1);
    idx.push(a, b, d, b, c, d);
  }
  const geo = finish(pos, idx, { i: ring(Math.floor(NR / 2), 0), dir: [0.5, 0.8, 0] });
  return { geo, edge, surf };
}

// Tube with a radius that changes along its length.
function varTube(points, radiusAt, radial = 14, segs = 400) {
  const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
  const frames = curve.computeFrenetFrames(segs, false);
  const pos = new Float32Array((segs + 1) * radial * 3);
  let w = 0;
  const P = new THREE.Vector3();
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    curve.getPointAt(t, P);
    const N = frames.normals[i], B = frames.binormals[i];
    const r = radiusAt(t);
    for (let j = 0; j < radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      const ca = Math.cos(a), sa = Math.sin(a);
      pos[w++] = P.x + r * (ca * N.x + sa * B.x);
      pos[w++] = P.y + r * (ca * N.y + sa * B.y);
      pos[w++] = P.z + r * (ca * N.z + sa * B.z);
    }
  }
  const idx = [];
  for (let i = 0; i < segs; i++) for (let j = 0; j < radial; j++) {
    const a = i * radial + j, b = (i + 1) * radial + j, c = (i + 1) * radial + ((j + 1) % radial), d = i * radial + ((j + 1) % radial);
    idx.push(a, b, d, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  // outward check on the middle ring
  const mid = Math.floor(segs / 2) * radial;
  curve.getPointAt(0.5, P);
  const v = new THREE.Vector3().fromBufferAttribute(g.attributes.position, mid).sub(P);
  const nn = new THREE.Vector3().fromBufferAttribute(g.attributes.normal, mid);
  if (v.dot(nn) < 0) {
    for (let k = 0; k < idx.length; k += 3) { const t = idx[k + 1]; idx[k + 1] = idx[k + 2]; idx[k + 2] = t; }
    g.setIndex(idx);
    g.computeVertexNormals();
  }
  return g;
}

// Drizzle: a few wavy strokes across the top, lying on the frosting (or dough past its edge).
function drizzleStrokes(rnd, bun, frost, P, R) {
  const ang = rnd() * Math.PI;
  const ca = Math.cos(ang), sa = Math.sin(ang);
  const passes = 5 + Math.floor(rnd() * 2);
  const n = P.n;
  const strokes = [];
  for (let k = 0; k < passes; k++) {
    const a = -0.72 + (1.44 * k) / (passes - 1) + (rnd() - 0.5) * 0.08;
    const tilt = (rnd() - 0.5) * 0.35;
    const wav = 0.03 + rnd() * 0.03, ph = rnd() * 6.28;
    const pts = [];
    for (let i = 0; i <= 120; i++) {
      const b = -1 + (2 * i) / 120;
      const qa = a + tilt * b + wav * Math.sin(b * 5 + ph);
      const x = qa * ca - b * sa, z = qa * sa + b * ca;
      const rho = Math.hypot(x, z / P.ex);
      if (rho > 0.93) continue;
      const phi = Math.atan2(z / P.ex, x);
      const th = Math.asin(Math.min(1, Math.pow(rho, n / 2)));
      const e = frost.edge(phi);
      let p;
      if (th <= e) p = frost.surf(th / e, phi, R * 0.5);
      else { const q = bun.at(th, phi); p = [q[0] + q[3] * R * 0.5, q[1] + q[4] * R * 0.5, q[2] + q[5] * R * 0.5]; }
      pts.push(new THREE.Vector3(p[0], p[1], p[2]));
    }
    if (pts.length > 6) strokes.push(pts);
  }
  return strokes;
}

// A piped cream cheese swirl on top.
function swirlGeometry(rnd, frost) {
  const top = frost.surf(0, 0);
  const turns = 1.9;
  const pts = [];
  const a0 = rnd() * Math.PI * 2;
  for (let i = 0; i <= 240; i++) {
    const t = i / 240;
    const rho = 0.24 * Math.pow(1 - t, 0.8);
    const ang = a0 + t * turns * Math.PI * 2;
    pts.push(new THREE.Vector3(rho * Math.cos(ang), top[1] + 0.06 + 0.32 * Math.pow(t, 0.85), rho * Math.sin(ang)));
  }
  return varTube(pts, (t) => 0.1 * Math.pow(1 - t, 0.5) + 0.006, 18, 500);
}

// ------------------------------------------------------------------ flavors
const DOUGH_RING = { base: '#B06E2E', dark: '#86491A', pale: '#E4B878', bandY: 0.0, bandW: 0.085, bandAmt: 0.85, bump: 0.0085, roughness: 0.5, clearcoat: 1.0, clearcoatRoughness: 0.05 };
const DOUGH_BUN = { base: '#B2702F', dark: '#8A4B1B', pale: '#EBC68C', bandY: -0.02, bandW: 0.09, bandAmt: 0.95, bump: 0.0095, roughness: 0.58, clearcoat: 0.15, clearcoatRoughness: 0.35 };
const BUN = { n: 2.3, topH: 0.55, botH: 0.42, ex: 1 };

const FLAVORS = {
  glazed: { shape: 'with-hole' },
  cream: { shape: 'no-hole', frost: { color: '#FBF3E6', roughness: 0.34, clearcoat: 0.5, bump: 0.014 }, swirl: true },
  matcha: { shape: 'no-hole', frost: { color: '#88A957', roughness: 0.38, clearcoat: 0.35, bump: 0.012, dust: 0.6 }, drizzle: true },
  pumpkin: { shape: 'no-hole', frost: { color: '#F2BD86', roughness: 0.36, clearcoat: 0.45, bump: 0.012, speck: 1.0, speckColor: '#6E3312' }, drizzle: true },
};
const DRIZZLE = { color: '#FFF7EC', roughness: 0.28, clearcoat: 0.6, bump: 0.006 };

// ------------------------------------------------------------------ scene per donut
function buildDonut(flavor, seed) {
  const rnd = rng(seed);
  const F = FLAVORS[flavor];
  const group = new THREE.Group();
  const meshes = [];
  const add = (geo, mat) => { const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true; group.add(m); meshes.push(m); return m; };
  if (F.shape === 'with-hole') {
    add(ringGeometry(rnd), doughMaterial(DOUGH_RING, rnd));
  } else {
    const P = { ...BUN, ex: 1 + (rnd() - 0.5) * 0.05 };
    const bun = makeBun(rnd, P);
    add(bun.geo, doughMaterial(DOUGH_BUN, rnd));
    const frost = makeFrosting(rnd, bun, { theta0: 1.02 + rnd() * 0.08, thick: 0.05, drips: [7, 10], dripLen: [0.1, 0.34] });
    add(frost.geo, frostMaterial(F.frost, rnd));
    if (F.drizzle) {
      const R = 0.018;
      const mat = frostMaterial(DRIZZLE, rnd);
      for (const pts of drizzleStrokes(rnd, bun, frost, P, R)) {
        const ph = rnd() * 6.28;
        add(varTube(pts, (t) => R * Math.min(1, t * 9, (1 - t) * 9) * (0.85 + 0.25 * Math.sin(t * 13 + ph)) + 0.002, 12, 240), mat);
      }
    }
    if (F.swirl) add(swirlGeometry(rnd, frost), frostMaterial({ ...F.frost, bump: 0.01 }, rnd));
  }
  group.rotation.y = rnd() * Math.PI * 2;
  return { group, meshes };
}

const scene = new THREE.Scene();
scene.environment = envTex;
scene.environmentIntensity = 0.55;
const key = new THREE.DirectionalLight(0xfff1dd, 2.6);
key.position.set(-2.6, 4.2, 2.6);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.left = -1.4; key.shadow.camera.right = 1.4; key.shadow.camera.top = 1.4; key.shadow.camera.bottom = -1.4;
key.shadow.camera.near = 0.5; key.shadow.camera.far = 12;
key.shadow.bias = -0.0004; key.shadow.normalBias = 0.012; key.shadow.radius = 6;
scene.add(key);
const rim = new THREE.DirectionalLight(0xffe2c0, 0.7);
rim.position.set(3, 1.6, -3);
scene.add(rim);
scene.add(new THREE.HemisphereLight(0xfff6ea, 0x6b4a3a, 0.35));

const camera = new THREE.PerspectiveCamera(20, 1, 0.1, 100);

function frameCamera(meshes) {
  const dist = 9;
  camera.position.set(0, dist * Math.sin(ELEV), dist * Math.cos(ELEV));
  const target = new THREE.Vector3(0, 0, 0);
  camera.zoom = 1;
  camera.lookAt(target);
  camera.updateProjectionMatrix();
  const v = new THREE.Vector3();
  for (let iter = 0; iter < 4; iter++) {
    camera.updateMatrixWorld();
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const m of meshes) {
      m.updateMatrixWorld(true);
      const p = m.geometry.attributes.position;
      for (let i = 0; i < p.count; i += 2) {
        v.fromBufferAttribute(p, i).applyMatrix4(m.matrixWorld).project(camera);
        if (v.x < x0) x0 = v.x; if (v.x > x1) x1 = v.x; if (v.y < y0) y0 = v.y; if (v.y > y1) y1 = v.y;
      }
    }
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, w = x1 - x0;
    const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.distanceTo(target) / camera.zoom;
    const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
    const up = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
    const shift = right.multiplyScalar(cx * halfH).add(up.multiplyScalar(cy * halfH));
    camera.position.add(shift); target.add(shift);
    camera.lookAt(target);
    camera.zoom *= 1.84 / w;
    camera.updateProjectionMatrix();
  }
}

function toWebp(src, size, q) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(src, 0, 0, size, size);
  return { canvas: c, url: c.toDataURL('image/webp', q) };
}

window.renderDonut = async ({ flavor, seed }) => {
  for (const o of [...scene.children]) if (o.isGroup) { scene.remove(o); o.traverse((m) => { if (m.isMesh) { m.geometry.dispose(); m.material.dispose(); } }); }
  const { group, meshes } = buildDonut(flavor, seed);
  scene.add(group);
  frameCamera(meshes);
  renderer.render(scene, camera);
  const lg = toWebp(renderer.domElement, 640, 0.86);
  const sm = toWebp(lg.canvas, 288, 0.86);
  return { lg: lg.url, sm: sm.url };
};
window.ready = true;
