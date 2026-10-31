// scene.js: the 320×180 picture. Background, props, NPC sprites, tap boxes,
// code glints, ambient fx, mosaic and fade, key art, the battle stub view,
// and placeholder art for any asset file that doesn't exist yet.
// Drawn at 320×180, blitted to a backing canvas at an integer scale k with
// smoothing off; CSS shows it at its layout size (image-rendering:auto).

export const W = 320, H = 180;

// ---------------------------------------------------------------- assets
const DIRS = { bg: 'bg', npc: 'sprites/npc', enemy: 'sprites/enemy', party: 'sprites/party',
  portrait: 'portraits', prop: 'props', keyart: 'keyart', icon: 'icons' };
const ID_RE = /^(bg|npc|enemy|party|portrait|prop|keyart|icon)\/[\w.-]+$/;
let available = null;   // Map id -> path (from assets/manifest.json), or null
let probeAll = false;   // ?probe=1: try every asset by convention
const images = new Map();

export function assetPath(id) {
  if (available && typeof available.get(id) === 'string') return available.get(id);
  const [k, ...rest] = String(id).split('/');
  const d = DIRS[k];
  return d ? `assets/${d}/${rest.join('/')}.png` : `assets/${id}.png`;
}

export async function initAssets() {
  probeAll = new URLSearchParams(location.search).has('probe');
  try {
    const res = await fetch('assets/manifest.json', { cache: 'no-cache' });
    if (res.ok) {
      const m = await res.json();
      available = new Map();
      const take = (key, val) => {
        if (!ID_RE.test(key)) return;
        let p = null;
        if (typeof val === 'string' && /\.(png|webp|jpg)$/i.test(val)) p = val.startsWith('assets/') ? val : 'assets/' + val;
        else if (val && typeof val === 'object' && typeof val.file === 'string') p = val.file.startsWith('assets/') ? val.file : 'assets/' + val.file;
        if (p || !available.has(key)) available.set(key, p || true);
      };
      const walk = (o, depth) => {
        if (!o || depth > 3) return;
        if (Array.isArray(o)) { for (const x of o) { if (typeof x === 'string') take(x, null); else if (x && x.id) take(x.id, x); } return; }
        if (typeof o === 'object') for (const [k, v] of Object.entries(o)) { if (ID_RE.test(k)) take(k, v); else walk(v, depth + 1); }
      };
      walk(m, 0);
      for (const [k, v] of available) if (v === true) available.set(k, null);
    }
  } catch (e) { /* no art yet: placeholders */ }
}

export function hasAsset(id) { return !!id && (probeAll || (available && available.has(id))); }

// Returns a loaded image or null (and starts loading when the asset exists).
export function image(id) {
  if (!id || !hasAsset(id)) return null;
  let rec = images.get(id);
  if (!rec) {
    rec = { img: new Image(), ok: false, failed: false };
    rec.img.onload = () => { rec.ok = true; dirty = true; };
    rec.img.onerror = () => { rec.failed = true; };
    rec.img.src = assetPath(id);
    images.set(id, rec);
  }
  return rec.ok ? rec.img : null;
}

export function preload(ids) { for (const id of ids) image(id); }

// ---------------------------------------------------------------- palette
export const TEAL = '#3fe0c8';
const MOODS = [
  ['#2a1a3a', '#120a18', '#3a2414'], ['#3b1d12', '#160b08', '#4a2a16'], ['#14223a', '#080d18', '#202a36'],
  ['#2c2a14', '#100f06', '#3a3218'], ['#1a2e22', '#08120c', '#24301e'], ['#3a1418', '#140608', '#3a1a14'],
];
function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

// ---------------------------------------------------------------- state
let cv = null, cx = null, lo = null, lx = null, tiny = null, tx = null, bgCv = null, bgx = null;
let k = 1, cssW = W, cssH = H, dpr = 1;
let model = { bg: null, name: '', things: [], glints: [], fx: [], machine: false };
let art = null, battle = null;
let fade = 0, mosaicN = 1, tintRed = 0;
let targets = new Set(), showHot = false, hovered = null, glowing = new Map();
let t = 0, dirty = true, running = false, lastTs = 0, acc = 0;
let particles = [];
let onTapCb = () => {};
let hotspots = [];
let bgKey = '';

export function init(canvas, onTap) {
  cv = canvas; cx = cv.getContext('2d');
  lo = document.createElement('canvas'); lo.width = W; lo.height = H; lx = lo.getContext('2d');
  bgCv = document.createElement('canvas'); bgCv.width = W; bgCv.height = H; bgx = bgCv.getContext('2d');
  tiny = document.createElement('canvas'); tx = tiny.getContext('2d');
  onTapCb = onTap || onTapCb;
  cv.addEventListener('pointerup', ev => {
    const p = toLogical(ev); if (!p) return;
    const h = hitTest(p.x, p.y);
    if (battle && battle.onTap) { battle.onTap(h ? h.id : null, h, ev); return; }
    onTapCb(h ? h.id : null, h, ev);
  });
  cv.addEventListener('pointermove', ev => {
    if (ev.pointerType !== 'mouse') return;
    const p = toLogical(ev); const h = p && hitTest(p.x, p.y);
    const id = h ? h.id : null;
    if (id !== hovered) { hovered = id; cv.style.cursor = id ? 'pointer' : 'default'; dirty = true; }
  });
  cv.addEventListener('pointerleave', () => { hovered = null; dirty = true; });
  start();
}

function toLogical(ev) {
  const r = cv.getBoundingClientRect();
  if (!r.width) return null;
  return { x: (ev.clientX - r.left) / r.width * W, y: (ev.clientY - r.top) / r.height * H };
}

export function resize(w, h) {
  dpr = window.devicePixelRatio || 1;
  cssW = w; cssH = h;
  k = Math.max(1, Math.ceil(w * dpr / W));
  cv.width = W * k; cv.height = H * k;
  cv.style.width = w + 'px'; cv.style.height = h + 'px';
  dirty = true;
}
export function scale() { return { k, cssW, cssH, css: cssW / W }; }

export function setModel(m) {
  model = Object.assign({ bg: null, name: '', things: [], glints: [], fx: [], machine: false }, m);
  const key = (model.bg || '') + '|' + model.name;
  if (key !== bgKey) { bgKey = key; buildBg(); resetParticles(); }
  preload(model.things.map(t => t.sprite?.id).filter(Boolean));
  dirty = true;
}

export function setArt(id, caption) { art = id ? { id, caption: caption || '' } : null; if (id) image(id); dirty = true; }
// setBattle(model): the stub view ({enemies, party}) or a custom renderer
// {render(lx, ctx) -> hotspots, overlay(cx, k), onTap(id)} (battle-ui.js).
export function setBattle(b) { battle = b; dirty = true; }
export function inArt() { return !!art; }
export function setTargets(ids) { targets = new Set(ids || []); dirty = true; }
export function setShowHotspots(on) { showHot = !!on; dirty = true; }
export function setTint(v) { tintRed = v; dirty = true; }
export function glow(id) { glowing.set(id, t + 90); dirty = true; }

export function fadeTo(target, ms = 250) {
  return animate(ms, f => { fade = target === 1 ? f : 1 - f; }).then(() => { fade = target; });
}
export function mosaic(out, ms = 450) {
  return animate(ms, f => { const p = out ? f : 1 - f; mosaicN = Math.max(1, Math.round(1 + p * 15)); })
    .then(() => { mosaicN = out ? 16 : 1; });
}
function animate(ms, step) {
  return new Promise(res => {
    const t0 = performance.now();
    const f = () => {
      const p = Math.min(1, (performance.now() - t0) / ms);
      step(p); dirty = true;
      if (p < 1 && !document.hidden) requestAnimationFrame(f); else { step(1); res(); }
    };
    requestAnimationFrame(f);
  });
}

// ---------------------------------------------------------------- loop
function start() {
  if (running) return; running = true;
  const frame = ts => {
    if (!lastTs) lastTs = ts;
    let dt = ts - lastTs; lastTs = ts;
    if (dt > 250) dt = 250;
    acc += dt;
    let stepped = false;
    while (acc >= 1000 / 60) { update(); acc -= 1000 / 60; stepped = true; }
    if (stepped || dirty) draw();
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

function update() {
  t++;
  for (const p of particles) {
    p.x += p.vx; p.y += p.vy;
    if (p.kind === 'dust') { p.vx += (Math.sin((t + p.seed) * 0.013) * 0.002); }
    if (p.y > H + 4) { p.y = -4; p.x = Math.random() * W; }
    if (p.y < -6) { p.y = H + 4; p.x = Math.random() * W; }
    if (p.x > W + 4) p.x = -4; if (p.x < -4) p.x = W + 4;
  }
}

function resetParticles() {
  particles = [];
  for (const f of model.fx || []) {
    const type = typeof f === 'string' ? f : f.type;
    if (type === 'dust') for (let i = 0; i < (f.n || 26); i++) particles.push({ kind: 'dust', x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 0.06, vy: 0.02 + Math.random() * 0.05, seed: Math.random() * 999, a: 0.15 + Math.random() * 0.3 });
    if (type === 'rain') for (let i = 0; i < (f.n || 70); i++) particles.push({ kind: 'rain', x: Math.random() * W, y: Math.random() * H, vx: -0.9, vy: 4 + Math.random() * 2, seed: 0, a: 0.25 + Math.random() * 0.3 });
    if (type === 'motes') for (let i = 0; i < (f.n || 20); i++) particles.push({ kind: 'motes', x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 0.1, vy: -0.08 - Math.random() * 0.12, seed: Math.random() * 999, a: 0.3 + Math.random() * 0.5 });
    if (type === 'spray') for (let i = 0; i < (f.n || 30); i++) particles.push({ kind: 'dust', x: Math.random() * W, y: Math.random() * H, vx: 0.15 + Math.random() * 0.1, vy: -0.03, seed: Math.random() * 999, a: 0.2 + Math.random() * 0.3, col: '#c8d0d8' });
  }
}

// ---------------------------------------------------------------- drawing
function buildBg() {
  const img = image(model.bg);
  if (img) { bgx.clearRect(0, 0, W, H); bgx.drawImage(img, 0, 0, W, H); bgCv.placeholder = false; return; }
  bgCv.placeholder = true;
  const h = hash(model.bg || model.name || 'x');
  const mood = MOODS[h % MOODS.length];
  const g = bgx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, mood[0]); g.addColorStop(0.62, mood[1]); g.addColorStop(1, mood[2]);
  bgx.fillStyle = g; bgx.fillRect(0, 0, W, H);
  // a few dark shapes so it reads as a place
  const r = (n) => { let x = (h ^ (n * 2654435761)) >>> 0; x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return (x >>> 0) / 4294967296; };
  bgx.fillStyle = 'rgba(0,0,0,0.35)';
  for (let i = 0; i < 6; i++) {
    const x = Math.floor(r(i + 1) * W), w = 14 + Math.floor(r(i + 9) * 40), top = 30 + Math.floor(r(i + 20) * 60);
    bgx.fillRect(x, top, w, 120 - top);
  }
  bgx.fillStyle = 'rgba(0,0,0,0.28)'; bgx.fillRect(0, 120, W, 60);
  bgx.fillStyle = 'rgba(255,220,160,0.06)'; bgx.fillRect(0, 120, W, 1);
}

function placeholderSize(th) {
  const s = th.sprite || {};
  if (s.w && s.h) return { w: s.w, h: s.h };
  const id = s.id || '';
  if (id.startsWith('npc/') || th.kind === 'npc') return { w: 22, h: 48 };
  return { w: 24, h: 24 };
}

function thingBox(th) {
  if (th.sprite) {
    const img = image(th.sprite.id);
    const sz = img ? { w: img.naturalWidth, h: img.naturalHeight } : placeholderSize(th);
    return { x: th.sprite.x, y: th.sprite.y, w: sz.w, h: sz.h, img };
  }
  if (th.hotspot) return { ...th.hotspot, img: null, painted: true };
  return null;
}

function draw() {
  dirty = false;
  if (!cx) return;
  if (bgCv.placeholder && image(model.bg)) buildBg();
  lx.save();
  lx.imageSmoothingEnabled = false;
  const labels = [];
  hotspots = [];
  if (art) drawArt(labels);
  else if (battle && battle.render) hotspots = battle.render(lx, { t, padBox, labels }) || [];
  else if (battle) drawBattle(labels);
  else drawRoom(labels);
  if (tintRed > 0) { lx.fillStyle = `rgba(180,20,10,${0.25 * tintRed})`; lx.fillRect(0, 0, W, H); }
  lx.restore();
  // mosaic
  let src = lo;
  if (mosaicN > 1) {
    const tw = Math.max(1, Math.round(W / mosaicN)), th = Math.max(1, Math.round(H / mosaicN));
    tiny.width = tw; tiny.height = th;
    tx.imageSmoothingEnabled = false; tx.drawImage(lo, 0, 0, tw, th);
    src = tiny;
  }
  cx.imageSmoothingEnabled = false;
  cx.clearRect(0, 0, cv.width, cv.height);
  cx.drawImage(src, 0, 0, src.width, src.height, 0, 0, W * k, H * k);
  // crisp labels at backing resolution
  if (mosaicN <= 2 && fade < 0.5) for (const L of labels) drawLabel(L);
  if (battle && battle.overlay && !art && mosaicN <= 2) battle.overlay(cx, k);
  if (fade > 0) { cx.fillStyle = `rgba(0,0,0,${fade})`; cx.fillRect(0, 0, cv.width, cv.height); }
}

function drawRoom(labels) {
  // background (with heat shimmer if asked)
  const fx = (model.fx || []).map(f => typeof f === 'string' ? { type: f } : f);
  const heat = fx.find(f => f.type === 'heat');
  lx.drawImage(bgCv, 0, 0);
  if (heat) {
    const y0 = heat.y ?? 90;
    for (let y = y0; y < H; y += 2) {
      const off = Math.round(Math.sin(t * 0.08 + y * 0.35) * 0.9);
      if (off) lx.drawImage(bgCv, 0, y, W, 2, off, y, W, 2);
    }
  }
  if (bgCv.placeholder) labels.push({ text: model.name, x: W / 2, y: 22, size: 11, font: 'display', color: 'rgba(240,220,180,0.55)' });
  // torches under the sprites
  for (const f of fx) if (f.type === 'torch') drawTorch(f);
  // things
  for (const th of model.things) {
    const box = thingBox(th); if (!box) continue;
    const bob = th.kind === 'npc' && !th.still && th.tint !== 'stilled' ? (Math.sin((t + (hash(th.id) % 200)) * 0.05) > 0.6 ? -1 : 0) : 0;
    if (!box.painted) {
      if (box.img) lx.drawImage(th.tint === 'stilled' ? stilledCopy(th.sprite.id, box.img) : box.img, box.x, box.y + bob);
      else drawSilhouette(th, box, bob, labels);
    }
    const g = glowing.get(th.id);
    if (g && g > t) { lx.save(); lx.globalCompositeOperation = 'lighter'; lx.fillStyle = `rgba(255,210,120,${0.25 * (g - t) / 90})`; lx.fillRect(box.x - 2, box.y - 2, box.w + 4, box.h + 4); lx.restore(); }
    const hb = padBox(box);
    hotspots.push({ id: th.id, kind: th.kind, name: th.name, ...hb, box });
    if (targets.has(th.id)) {
      const a = 0.45 + 0.35 * Math.sin(t * 0.15);
      outline(box, `rgba(255,214,120,${a})`);
    } else if (showHot || hovered === th.id) {
      outline(box, hovered === th.id ? 'rgba(255,230,170,0.85)' : 'rgba(255,230,170,0.45)');
    }
    if (hovered === th.id || showHot) labels.push({ text: th.name, x: box.x + box.w / 2, y: Math.max(8, box.y - 3), size: 7, color: '#ffe9b8' });
  }
  // particles and glints over the sprites
  for (const p of particles) {
    if (p.kind === 'dust') { lx.fillStyle = p.col ? hexA(p.col, p.a) : `rgba(255,228,180,${p.a})`; lx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1); }
    else if (p.kind === 'rain') { lx.strokeStyle = `rgba(170,180,200,${p.a})`; lx.beginPath(); lx.moveTo(Math.round(p.x) + 0.5, Math.round(p.y)); lx.lineTo(Math.round(p.x - 1) + 0.5, Math.round(p.y + 4)); lx.stroke(); }
    else if (p.kind === 'motes') { const a = p.a * (0.6 + 0.4 * Math.sin((t + p.seed) * 0.05)); lx.fillStyle = hexA(TEAL, a); lx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1); }
  }
  for (const gl of model.glints || []) drawGlint(gl);
  for (const f of fx) if (f.type === 'glow') glowBand(f);
  for (const f of fx) if (f.type === 'vignette') vignette(f.a ?? 0.35);
}

// thing.tint 'stilled': a grey, slightly blue copy of the sprite (made once)
const stillCache = new Map();
function stilledCopy(id, img) {
  if (stillCache.has(id)) return stillCache.get(id);
  const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
  const x = c.getContext('2d'); x.drawImage(img, 0, 0);
  try {
    const d = x.getImageData(0, 0, c.width, c.height); const p = d.data;
    for (let i = 0; i < p.length; i += 4) { const l = 0.3 * p[i] + 0.59 * p[i + 1] + 0.11 * p[i + 2]; p[i] = l * 0.72 + 14; p[i + 1] = l * 0.78 + 18; p[i + 2] = l * 0.86 + 26; }
    x.putImageData(d, 0, 0);
  } catch (e) { /* tainted: keep colour */ }
  stillCache.set(id, c);
  return c;
}

function drawTorch(f) {
  const fl = 0.75 + 0.12 * Math.sin(t * 0.21 + f.x) + 0.08 * Math.sin(t * 0.53 + f.y) + 0.05 * Math.sin(t * 1.7);
  const r = (f.r || 40) * (0.95 + 0.05 * fl);
  const g = lx.createRadialGradient(f.x, f.y, 0, f.x, f.y, r);
  g.addColorStop(0, `rgba(255,170,70,${0.30 * fl})`);
  g.addColorStop(0.5, `rgba(220,110,40,${0.12 * fl})`);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  lx.save(); lx.globalCompositeOperation = 'lighter'; lx.fillStyle = g;
  lx.fillRect(f.x - r, f.y - r, r * 2, r * 2); lx.restore();
}

function drawGlint(gl) {
  const period = gl.period || 150;
  const ph = ((t + (gl.phase || 0)) % period) / period;
  const a = gl.steady ? (gl.a ?? 1) : Math.max(0, Math.sin(ph * Math.PI * 2)) * (gl.a ?? 1);
  if (a <= 0.02) return;
  const col = gl.color || TEAL;
  lx.save(); lx.globalCompositeOperation = 'lighter';
  const g = lx.createRadialGradient(gl.x + 0.5, gl.y + 0.5, 0, gl.x + 0.5, gl.y + 0.5, gl.r || 6);
  g.addColorStop(0, hexA(col, 0.55 * a)); g.addColorStop(1, hexA(col, 0));
  lx.fillStyle = g; lx.fillRect(gl.x - 8, gl.y - 8, 17, 17);
  lx.fillStyle = hexA(col, a);
  lx.fillRect(gl.x, gl.y, 1, 1);
  if (a > 0.5 && !gl.small) { lx.fillStyle = hexA(col, a * 0.6); lx.fillRect(gl.x - 1, gl.y, 3, 1); lx.fillRect(gl.x, gl.y - 1, 1, 3); }
  if (gl.pair) { lx.fillStyle = hexA(col, a); lx.fillRect(gl.x + gl.pair, gl.y, 1, 1); }
  lx.restore();
}

// fx {type:'glow', y0, y1, color?, a?}: a pulsing additive band (the teal sea glow)
function glowBand(f) {
  const y0 = f.y0 ?? 60, y1 = f.y1 ?? 110, mid = (y0 + y1) / 2;
  const a = (f.a ?? 0.3) * (0.75 + 0.25 * Math.sin(t * 0.03));
  const g = lx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, hexA(f.color || TEAL, 0)); g.addColorStop((mid - y0) / Math.max(1, y1 - y0), hexA(f.color || TEAL, a)); g.addColorStop(1, hexA(f.color || TEAL, 0));
  lx.save(); lx.globalCompositeOperation = 'lighter'; lx.fillStyle = g; lx.fillRect(0, y0, W, y1 - y0); lx.restore();
}

function vignette(a) {
  const g = lx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.95);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${a})`);
  lx.fillStyle = g; lx.fillRect(0, 0, W, H);
}

function drawSilhouette(th, box, bob, labels) {
  const { x, w, h } = box; const y = box.y + bob;
  const isNpc = th.kind === 'npc' || (th.sprite?.id || '').startsWith('npc/') || (th.sprite?.id || '').startsWith('enemy/');
  lx.save();
  if (isNpc) {
    const cxm = x + w / 2;
    const hr = Math.max(3, Math.round(w * 0.22));
    lx.fillStyle = '#0c0806';
    lx.beginPath(); lx.arc(cxm, y + hr + 1, hr, 0, Math.PI * 2); lx.fill();
    lx.beginPath();
    lx.moveTo(cxm - w * 0.28, y + hr * 2 + 2); lx.lineTo(cxm + w * 0.28, y + hr * 2 + 2);
    lx.lineTo(x + w, y + h); lx.lineTo(x, y + h); lx.closePath(); lx.fill();
    lx.strokeStyle = th.machine ? hexA(TEAL, 0.5) : 'rgba(255,200,140,0.35)'; lx.lineWidth = 1;
    lx.stroke();
    lx.beginPath(); lx.arc(cxm, y + hr + 1, hr, 0, Math.PI * 2); lx.stroke();
  } else {
    lx.fillStyle = 'rgba(16,10,6,0.85)';
    lx.fillRect(x, y, w, h);
    lx.strokeStyle = 'rgba(255,200,140,0.4)'; lx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  }
  lx.restore();
  if (!showHot && hovered !== th.id) labels.push({ text: th.name, x: x + w / 2, y: y + (isNpc ? -3 : h / 2 + 3), size: 6.5, color: 'rgba(255,233,184,0.8)' });
}

function outline(b, col) {
  lx.strokeStyle = col; lx.lineWidth = 1;
  lx.strokeRect(Math.round(b.x) - 1.5, Math.round(b.y) - 1.5, b.w + 3, b.h + 3);
}

function padBox(b) {
  const min = 44 / (cssW / W);   // 44 CSS px in logical units
  const w = Math.max(b.w, min), h = Math.max(b.h, min);
  return { x: b.x + b.w / 2 - w / 2, y: b.y + b.h / 2 - h / 2, w, h };
}

function hitTest(x, y) {
  let best = null, bestD = Infinity;
  for (let i = hotspots.length - 1; i >= 0; i--) {
    const h = hotspots[i];
    if (x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h) {
      const b = h.box;
      const inside = x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
      if (inside) return h;   // topmost real box wins
      const d = Math.hypot(x - (b.x + b.w / 2), y - (b.y + b.h / 2));
      if (d < bestD) { bestD = d; best = h; }
    }
  }
  return best;
}

export function hotspotList() { return hotspots.map(h => ({ id: h.id, x: h.x, y: h.y, w: h.w, h: h.h, box: { x: h.box.x, y: h.box.y, w: h.box.w, h: h.box.h } })); }

// Client coordinates of a thing's tap box centre (for tests and tips).
export function clientPointOf(id) {
  const h = hotspots.find(h => h.id === id); if (!h || !cv) return null;
  const r = cv.getBoundingClientRect();
  return { x: r.left + (h.box.x + h.box.w / 2) / W * r.width, y: r.top + (h.box.y + h.box.h / 2) / H * r.height };
}

function drawLabel(L) {
  const s = k;
  const size = Math.max(9, L.size * s * (L.font === 'display' ? 1 : 1));
  cx.save();
  cx.font = `${L.font === 'display' ? '' : ''}${Math.round(size)}px ${L.font === 'display' ? 'Metamorphous, serif' : 'PixelifySans, monospace'}`;
  cx.textAlign = 'center'; cx.textBaseline = 'bottom';
  cx.lineWidth = Math.max(2, s * 0.9); cx.strokeStyle = 'rgba(0,0,0,0.8)';
  cx.strokeText(L.text, L.x * s, L.y * s);
  cx.fillStyle = L.color || '#fff';
  cx.fillText(L.text, L.x * s, L.y * s);
  cx.restore();
}

function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${Math.max(0, Math.min(1, a))})`;
}

// ---------------------------------------------------------------- key art
function drawArt(labels) {
  const img = image(art.id);
  if (img) { lx.drawImage(img, 0, 0, W, H); }
  else {
    const h = hash(art.id);
    const mood = MOODS[h % MOODS.length];
    const g = lx.createRadialGradient(W / 2, H * 0.45, 10, W / 2, H / 2, W * 0.7);
    g.addColorStop(0, mood[2]); g.addColorStop(0.5, mood[0]); g.addColorStop(1, '#050304');
    lx.fillStyle = g; lx.fillRect(0, 0, W, H);
    if (/godstone|ouroboros|serpent|teal|last-page|wyrm/.test(art.id)) drawGlint({ x: 160, y: 86, r: 18, period: 120 });
    labels.push({ text: art.caption || '', x: W / 2, y: H - 10, size: 8, font: 'display', color: 'rgba(240,220,180,0.7)' });
  }
}

// ---------------------------------------------------------------- battle stub view
function drawBattle(labels) {
  lx.save();
  try { lx.filter = 'grayscale(40%) brightness(66%)'; } catch (e) { /* */ }
  lx.drawImage(bgCv, 0, 0);
  lx.filter = 'none';
  lx.restore();
  if (lx.filter === undefined) { lx.fillStyle = 'rgba(0,0,0,0.33)'; lx.fillRect(0, 0, W, H); }
  lx.fillStyle = 'rgba(255,230,190,0.08)'; lx.fillRect(0, 118, W, 40);
  const en = battle.enemies || [];
  en.forEach((e, i) => {
    const img = image(e.sprite);
    const h = img ? img.naturalHeight : (e.h || 46), w = img ? img.naturalWidth : (e.w || 22);
    const x = 30 + (i % 3) * 44 + (i >= 3 ? 20 : 0), y = 150 - h - (i % 2) * 8;
    if (img) lx.drawImage(img, x, y);
    else drawSilhouette({ id: e.name, kind: 'npc', name: e.name, machine: e.machine }, { x, y, w, h }, 0, labels);
  });
  (battle.party || []).forEach((p, i) => {
    const img = image(p.sprite);
    const h = img ? img.naturalHeight : 48, w = img ? img.naturalWidth : 22;
    const x = 250 - (i % 2) * 18 + (i >= 2 ? 30 : 0), y = 150 - h - i * 3;
    if (img) lx.drawImage(img, x, y);
    else drawSilhouette({ id: p.name, kind: 'npc', name: p.name }, { x, y, w, h }, 0, labels);
  });
}

// ---------------------------------------------------------------- title art
// Ashkarran's tower at night with one teal glint at a window. Used when
// keyart/title-tower is missing; the glint is always drawn in code.
export function drawTitle(canvas, frame) {
  const c = canvas.getContext('2d');
  if (canvas.width !== W) { canvas.width = W; canvas.height = H; }
  c.imageSmoothingEnabled = false;
  const img = image('keyart/title-tower');
  let win = { x: 205, y: 46 };
  if (img) { c.drawImage(img, 0, 0, W, H); win = { x: 201, y: 42 }; }
  else {
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0a0c22'); g.addColorStop(0.55, '#1b1530'); g.addColorStop(1, '#2a1610');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    // stars
    for (let i = 0; i < 60; i++) {
      const x = (i * 97) % W, y = (i * 53) % 90;
      const tw = 0.4 + 0.4 * Math.sin(frame * 0.03 + i);
      c.fillStyle = `rgba(230,220,255,${tw * 0.6})`; c.fillRect(x, y, 1, 1);
    }
    // moon
    c.fillStyle = '#e8dcc0'; c.beginPath(); c.arc(70, 40, 14, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#0f1028'; c.beginPath(); c.arc(76, 36, 13, 0, Math.PI * 2); c.fill();
    // tower
    c.fillStyle = '#07060c';
    c.fillRect(196, 30, 20, 150); c.fillRect(190, 24, 32, 8);
    c.beginPath(); c.moveTo(188, 24); c.lineTo(206, 4); c.lineTo(224, 24); c.fill();
    for (let i = 0; i < 4; i++) c.fillRect(190 + i * 9, 20, 5, 5);
    // rooftops
    c.fillStyle = '#0b0810';
    const roofs = [[0, 132, 60], [50, 140, 50], [96, 126, 40], [130, 138, 60], [226, 130, 50], [270, 136, 50]];
    for (const [x, y, w] of roofs) { c.fillRect(x, y, w, H - y); c.beginPath(); c.arc(x + w / 2, y, w / 4, Math.PI, 0); c.fill(); }
    // warm windows
    c.fillStyle = 'rgba(255,170,70,0.7)';
    for (const [x, y] of [[20, 150], [70, 156], [110, 140], [150, 152], [240, 146], [290, 150], [200, 120]]) c.fillRect(x, y, 2, 3);
  }
  // the teal glint (code)
  const a = 0.5 + 0.5 * Math.sin(frame * 0.04);
  c.save(); c.globalCompositeOperation = 'lighter';
  const gg = c.createRadialGradient(win.x + 0.5, win.y + 0.5, 0, win.x + 0.5, win.y + 0.5, 7);
  gg.addColorStop(0, hexA(TEAL, 0.6 * a)); gg.addColorStop(1, hexA(TEAL, 0));
  c.fillStyle = gg; c.fillRect(win.x - 8, win.y - 8, 17, 17);
  c.fillStyle = hexA(TEAL, 0.5 + 0.5 * a); c.fillRect(win.x, win.y, 1, 2);
  c.restore();
}

// Placeholder portrait (silhouette bust with initial) as a data URL.
const portraitCache = new Map();
export function portraitURL(id, name, teal, forceCode) {
  if (!forceCode && hasAsset(id)) return assetPath(id);
  const key = id + '|' + name;
  if (portraitCache.has(key)) return portraitCache.get(key);
  const c = document.createElement('canvas'); c.width = 64; c.height = 64;
  const x = c.getContext('2d');
  const h = hash(id || name);
  const mood = MOODS[h % MOODS.length];
  const g = x.createLinearGradient(0, 0, 0, 64); g.addColorStop(0, mood[0]); g.addColorStop(1, mood[1]);
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  x.fillStyle = teal ? '#0d2a2a' : '#120c08';
  x.beginPath(); x.arc(32, 26, 12, 0, Math.PI * 2); x.fill();
  x.beginPath(); x.moveTo(12, 64); x.quadraticCurveTo(32, 30, 52, 64); x.fill();
  if (teal) { x.fillStyle = TEAL; x.fillRect(27, 25, 2, 1); x.fillRect(35, 25, 2, 1); }
  x.font = '14px Metamorphous, serif'; x.textAlign = 'center';
  x.fillStyle = 'rgba(255,230,190,0.75)'; x.fillText((name || '?')[0], 32, 60);
  const url = c.toDataURL();
  portraitCache.set(key, url);
  return url;
}
