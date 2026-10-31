// battle-ui.js: the battle screen on top of the pure engine (battle.js).
// The picture becomes the battlefield (enemies left facing right, party right
// facing left, guest behind), the tray holds two rows of commands, the story
// log gets the engine's lines, and every event is animated (steps, attack
// frames, hit flash, shakes, damage numbers, dissolves, telegraphs, phases,
// summons). Contract: design/ENGINE_NOTES.md "Battle adapter" and
// design/BATTLE_API.md.

import * as Battle from './battle.js';
import { SKILLS, MEMBERS } from './data/party.js';
import { ITEMS } from './data/items.js';
import { ENEMIES, MOVES } from './data/enemies.js';
import { hooks } from './conditions.js';
import { SETTINGS } from './state.js';

const W = 320, H = 180;
const TEAL = '#3fe0c8';
const $ = (s) => document.querySelector(s);

let A = null;          // the adapter api
let B = null;          // current battle state (engine)
let V = null;          // visual state
let auto = false;
let busy = false;
let inputResolve = null;
let pendingChoices = null;
let continueResolve = null;
let selTarget = null;  // the UI's current target (last tapped / chosen enemy)
let stripEl = null;
let animData = null;   // assets/manifest.json "anims"
let ended = false;
let runId = 0;          // bumps on every run and on abort(): a stale loop stops     // the fight is over and handed back (still drawn during the mosaic out)

// ================================================================ timing
const now = () => performance.now();
const spd = () => (auto ? 0.75 : 1) * (SETTINGS.textSpeed === 'instant' ? 0.7 : SETTINGS.textSpeed === 'slow' ? 1.25 : 1);
const wait = (ms) => new Promise((r) => setTimeout(r, Math.max(0, ms * spd())));
const tweens = [];
function tween(obj, key, to, ms, ease = (p) => p) {
  const d = ms * spd();
  const tw = { obj, key, from: obj[key] ?? 0, to, t0: now(), d, ease };
  for (let i = tweens.length - 1; i >= 0; i--) if (tweens[i].obj === obj && tweens[i].key === key) tweens.splice(i, 1);
  tweens.push(tw);
  return new Promise((res) => setTimeout(() => { const i = tweens.indexOf(tw); if (i >= 0) { tweens.splice(i, 1); obj[key] = to; } res(); }, d));
}
function stepTweens() {
  const t = now();
  for (const tw of tweens) {
    const p = Math.min(1, (t - tw.t0) / tw.d);
    tw.obj[tw.key] = tw.from + (tw.to - tw.from) * tw.ease(p);
  }
}
const easeOut = (p) => 1 - (1 - p) * (1 - p);
const easeInOut = (p) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2);

// ================================================================ images
const imgs = new Map();
function loadImg(id) {
  if (!id) return Promise.resolve(null);
  if (imgs.has(id)) return imgs.get(id).p;
  const rec = { img: null, ok: false, p: null };
  rec.p = new Promise((res) => {
    if (!A.Scene.hasAsset(id)) { res(null); return; }
    const im = new Image();
    im.onload = () => { rec.img = im; rec.ok = true; res(im); };
    im.onerror = () => res(null);
    im.src = A.Scene.assetPath(id);
  });
  imgs.set(id, rec);
  return rec.p;
}
function img(id) { const r = imgs.get(id); if (!r) { if (A) loadImg(id); return null; } return r.ok ? r.img : null; }

function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

// Variants made once per sprite: rim (1px light outline), glow (2px soft
// outline), white (hit flash), grey (stilled / fallen), elite (recolour).
const vcache = new Map();
function variant(id, kind, color) {
  const key = id + '|' + kind + '|' + (color || '');
  if (vcache.has(key)) return vcache.get(key);
  const im = img(id); if (!im) return null;
  const w = im.naturalWidth, h = im.naturalHeight;
  const src = canvas(w, h); const sx = src.getContext('2d'); sx.drawImage(im, 0, 0);
  const sd = sx.getImageData(0, 0, w, h).data;
  const A_ = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : sd[(y * w + x) * 4 + 3]);
  let out;
  if (kind === 'rim' || kind === 'glow') {
    const pad = kind === 'rim' ? 1 : 2;
    out = canvas(w + pad * 2, h + pad * 2);
    const ox = out.getContext('2d'); const od = ox.createImageData(out.width, out.height);
    const [r, g, b, a] = hexRGBA(color || (kind === 'rim' ? '#fff0d2c0' : '#a070ffff'));
    for (let y = -pad; y < h + pad; y++) for (let x = -pad; x < w + pad; x++) {
      if (A_(x, y) > 127) continue;
      let best = 99;
      for (let dy = -pad; dy <= pad; dy++) for (let dx = -pad; dx <= pad; dx++) {
        if (kind === 'rim' && Math.abs(dx) + Math.abs(dy) !== 1) continue;
        if (A_(x + dx, y + dy) > 127) best = Math.min(best, Math.hypot(dx, dy));
      }
      if (best === 99) continue;
      const i = ((y + pad) * out.width + (x + pad)) * 4;
      od.data[i] = r; od.data[i + 1] = g; od.data[i + 2] = b;
      od.data[i + 3] = kind === 'rim' ? a : Math.round(a * (best <= 1 ? 0.85 : 0.4));
    }
    ox.putImageData(od, 0, 0);
  } else {
    out = canvas(w, h);
    const ox = out.getContext('2d'); const od = ox.createImageData(w, h); const d = od.data;
    for (let i = 0; i < sd.length; i += 4) {
      const r = sd[i], g = sd[i + 1], b = sd[i + 2], a = sd[i + 3];
      if (a < 128) continue;
      d[i + 3] = 255;
      if (kind === 'white') { d[i] = d[i + 1] = d[i + 2] = 255; }
      else if (kind === 'grey') { const l = 0.3 * r + 0.59 * g + 0.11 * b; d[i] = l * 0.7 + 20; d[i + 1] = l * 0.8 + 26; d[i + 2] = l * 0.9 + 40; }
      else if (kind === 'red') { d[i] = 255; d[i + 1] = 60; d[i + 2] = 40; }
      else if (kind === 'elite') {
        const teal = g > r + 30 && b > r + 20;
        if (teal) { d[i] = Math.min(255, g + 40); d[i + 1] = r * 0.5; d[i + 2] = r * 0.4; }
        else { const l = 0.3 * r + 0.59 * g + 0.11 * b; d[i] = Math.min(255, l * 0.55 + r * 0.25 + 10); d[i + 1] = l * 0.42; d[i + 2] = l * 0.5 + 8; }
      }
    }
    ox.putImageData(od, 0, 0);
  }
  vcache.set(key, out);
  return out;
}
function hexRGBA(hex) {
  const h = hex.replace('#', '');
  const n = (i) => parseInt(h.slice(i, i + 2), 16);
  return [n(0), n(2), n(4), h.length >= 8 ? n(6) : 255];
}
function rgba(hex, a) { const [r, g, b] = hexRGBA(hex); return `rgba(${r},${g},${b},${Math.max(0, Math.min(1, a))})`; }

// The battlefield background: darkened ~33%, desaturated ~40%, lighter floor band.
function buildBg(bgId) {
  const c = canvas(W, H); const x = c.getContext('2d');
  const im = img(bgId);
  if (im) {
    x.drawImage(im, 0, 0, W, H);
    const d = x.getImageData(0, 0, W, H); const p = d.data;
    for (let i = 0; i < p.length; i += 4) {
      const l = 0.3 * p[i] + 0.59 * p[i + 1] + 0.11 * p[i + 2];
      for (let k = 0; k < 3; k++) p[i + k] = (p[i + k] + (l - p[i + k]) * 0.4) * 0.67;
    }
    x.putImageData(d, 0, 0);
  } else {
    const g = x.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#1c1220'); g.addColorStop(0.6, '#0e0a0c'); g.addColorStop(1, '#22160e');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
  }
  const f = x.createLinearGradient(0, 112, 0, 176);
  f.addColorStop(0, 'rgba(255,232,196,0)'); f.addColorStop(0.3, 'rgba(255,232,196,0.10)');
  f.addColorStop(0.75, 'rgba(255,232,196,0.08)'); f.addColorStop(1, 'rgba(255,232,196,0)');
  x.fillStyle = f; x.fillRect(0, 112, W, 64);
  x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillRect(0, 0, W, 14);
  return c;
}

// ================================================================ code-drawn icons (12×12 statuses, 16×16 types)
const GLYPH = {
  drop: ['...#....', '...#....', '..###...', '.#####..', '.#####..', '.#####..', '..###...', '........'],
  star: ['...#....', '..###...', '#######.', '.#####..', '..###...', '.##.##..', '.#...#..', '........'],
  eye: ['........', '..###...', '.#...#..', '#..#..#.', '.#...#..', '..###...', '........', '........'],
  z: ['#####...', '...#....', '..#.....', '#####...', '....###.', '.....#..', '....###.', '........'],
  glass: ['#######.', '.#...#..', '..#.#...', '...#....', '..#.#...', '.#...#..', '#######.', '........'],
  crack: ['#######.', '#..#..#.', '#.#...#.', '#..#..#.', '.#.#.#..', '..#.#...', '...#....', '........'],
  down: ['..###...', '..###...', '..###...', '#######.', '.#####..', '..###...', '...#....', '........'],
  up: ['...#....', '..###...', '.#####..', '#######.', '..###...', '..###...', '..###...', '........'],
  shield: ['#######.', '#.....#.', '#.....#.', '#.....#.', '.#...#..', '..#.#...', '...#....', '........'],
  swords: ['#.....#.', '.#...#..', '..#.#...', '...#....', '..#.#...', '##...##.', '#.....#.', '........'],
  bang: ['...#....', '...#....', '...#....', '...#....', '...#....', '........', '...#....', '........'],
  wave: ['........', '.##..#..', '#..##...', '........', '.##..#..', '#..##...', '........', '........'],
  cloud: ['........', '..##....', '.####.#.', '########', '########', '.######.', '........', '........'],
  note: ['...####.', '...#..#.', '...#..#.', '...#..#.', '.###.##.', '####..##', '.##.....', '........'],
  slash: ['......#.', '.....#..', '....#...', '...#....', '..#.....', '.#......', '#.......', '........'],
  arrow: ['....###.', '.....##.', '....#.#.', '...#....', '..#.....', '##......', '#.......', '........'],
  hammer: ['.#####..', '.#####..', '.#####..', '...#....', '...#....', '...#....', '...#....', '........'],
  bolt: ['....##..', '...##...', '..##....', '.#####..', '...##...', '..##....', '.##.....', '........'],
  flame: ['...#....', '..##....', '..###...', '.####.#.', '.######.', '.######.', '..####..', '........'],
  cross: ['..###...', '..###...', '#######.', '#######.', '#######.', '..###...', '..###...', '........'],
  coin: ['..###...', '.#####..', '##.#.##.', '##.#.##.', '##.#.##.', '.#####..', '..###...', '........'],
};
const STATUS_ICON = {
  poison: ['drop', '#6ad04a', 1], bleed: ['drop', '#e03a2a', 1], stun: ['star', '#ffd040', 1], blind: ['eye', '#c0b0a0', 1],
  drowsy: ['z', '#8ab4ff', 1], stilled: ['glass', TEAL, 1], sunder: ['crack', '#ff7050', 1], weigh: ['down', '#c8b090', 1],
  guard: ['shield', '#9cc8ff', 0], riposte: ['swords', '#ffd890', 0], taunt: ['bang', '#ff6040', 0], aegis: ['shield', TEAL, 0],
  mirage: ['wave', '#c8a0ff', 0], smoke: ['cloud', '#b8b8b8', 0], rage: ['up', '#ff5a3a', 0], song: ['note', '#ffd040', 0],
};
const icache = new Map();
function statusIcon(id) {
  if (icache.has(id)) return icache.get(id);
  const [g, col, bad] = STATUS_ICON[id] || ['bang', '#ffffff', 0];
  const c = canvas(12, 12); const x = c.getContext('2d');
  x.fillStyle = '#120c08'; x.fillRect(1, 1, 10, 10);
  x.fillStyle = bad ? '#a8322a' : '#3a78a8';
  x.fillRect(1, 0, 10, 1); x.fillRect(1, 11, 10, 1); x.fillRect(0, 1, 1, 10); x.fillRect(11, 1, 1, 10);
  x.fillStyle = col;
  GLYPH[g].forEach((row, y) => { for (let i = 0; i < 8; i++) if (row[i] === '#') x.fillRect(2 + i, 2 + y, 1, 1); });
  icache.set(id, c);
  return c;
}
const turlCache = new Map();
function typeIconURL(kind) {
  if (turlCache.has(kind)) return turlCache.get(kind);
  const map = { slash: ['slash', '#e8e0d0'], pierce: ['arrow', '#d8c8a0'], crush: ['hammer', '#c89060'], shock: ['bolt', '#8ad8ff'],
    fire: ['flame', '#ff8a30'], heal: ['cross', '#6ad04a'], buff: ['up', '#ffd040'], debuff: ['down', '#ff7050'], status: ['drop', '#a070ff'],
    steal: ['coin', '#ffd040'], scan: ['eye', TEAL], guard: ['shield', '#9cc8ff'], wonder: ['star', '#c8a0ff'] };
  const [g, col] = map[kind] || ['star', '#e8e0d0'];
  const c = canvas(10, 10); const x = c.getContext('2d');
  x.fillStyle = col;
  GLYPH[g].forEach((row, y) => { for (let i = 0; i < 8; i++) if (row[i] === '#') x.fillRect(1 + i, 1 + y, 1, 1); });
  const url = c.toDataURL(); turlCache.set(kind, url); return url;
}

// ================================================================ units on screen
// party formation: front row Kord and Valka, Toktai behind between them, Ain
// floating, the guest behind everyone
function partySlot(id, ids, guest) {
  if (ids.length === 1) return [234, 165];
  const hasV = ids.includes('valka'), hasT = ids.includes('toktai');
  switch (id) {
    case 'kord': return [hasV ? 196 : 206, 168];
    case 'valka': return [252, 168];
    case 'toktai': return hasV ? [232, 149] : [252, 162];
    case 'ain': return guest ? [302, 122] : hasV ? [298, 138] : hasT ? [242, 106] : [258, 140];
    default: return [240, 160];
  }
}
const SHADOWY = ['shadow_cat', 'summoned_shadow', 'shadow_of_set'];

function newVis(u) {
  return { name: u.name, side: u.side, id: u.id, sprite: u.sprite, mirror: !!u.mirror, guest: !!u.guest,
    x: null, base: null, tx: 0, tbase: 0, step: 0, alpha: 1, flashT: 0, shakeT: 0, anim: null, dissolve: null, gone: false,
    hp: u.hp, maxHp: u.maxHp, mp: u.mp, maxMp: u.maxMp, alive: u.alive, statuses: u.statuses.map((s) => s.id), cast: 0, slide: 0,
    fled: false, yielded: false, recolour: u.side === 'enemy' ? ENEMIES[u.id]?.recolour : null };
}
function vis(name) { return V.u[name]; }
function unitOf(name) { return B.party.find((u) => u.name === name) || B.enemies.find((u) => u.name === name) || null; }
function sizeOf(v) {
  const im = img(v.sprite);
  if (im) return { w: im.naturalWidth, h: im.naturalHeight };
  if (v.id === 'ain') return { w: 10, h: 20 };
  return { w: 24, h: 46 };
}

function layout() {
  // enemies: roots with their parts around them, left area x 6..192
  const order = [];
  const enemies = B.enemies.filter((u) => vis(u.name) && !vis(u.name).gone);
  const placed = new Set();
  for (const u of enemies) {
    if (placed.has(u.name) || u.partOf && enemies.some((r) => r.name === u.partOf)) continue;
    const parts = enemies.filter((p) => p.partOf === u.name);
    if (parts.length) { order.push(parts[0].name); placed.add(parts[0].name); }
    order.push(u.name); placed.add(u.name);
    for (const p of parts.slice(1)) { order.push(p.name); placed.add(p.name); }
  }
  for (const u of enemies) if (!placed.has(u.name)) order.push(u.name);
  const sizes = order.map((n) => sizeOf(vis(n)));
  const L = 8, R_ = 194, avail = R_ - L;
  const total = sizes.reduce((a, s) => a + s.w, 0);
  const gap = order.length > 1 ? Math.min(10, (avail - total) / (order.length - 1)) : 0;
  const used = total + gap * Math.max(0, order.length - 1);
  let x = L + Math.max(0, (avail - used) / 2);
  let rootBase = 164;
  order.forEach((n, i) => {
    const v = vis(n), s = sizes[i], u = unitOf(n);
    let base;
    if (s.h >= 80) base = 166;
    else if (u?.partOf) { const r = vis(u.partOf); const rs = r ? sizeOf(r) : { h: 100 }; base = rootBase - Math.round(rs.h * 0.22); }
    else base = (order.length > 2 && i % 2 === 1) ? 150 : 162;
    if (s.h >= 80) rootBase = base;
    v.tx = Math.round(x); v.tbase = base;
    if (v.x == null) { v.x = v.tx; v.base = v.tbase; }
    x += s.w + gap;
  });
  // the root of parts: fix arm bases after the root was placed
  for (const n of order) { const u = unitOf(n); if (u?.partOf) { const r = vis(u.partOf); if (r) { const rs = sizeOf(r); vis(n).tbase = r.tbase - Math.round(rs.h * 0.22); if (vis(n).base == null) vis(n).base = vis(n).tbase; } } }
  // party
  const members = B.party.filter((u) => !u.guest && vis(u.name));
  const ids = members.map((u) => u.id);
  const hasGuest = B.party.some((u) => u.guest && vis(u.name));
  members.forEach((u) => {
    const v = vis(u.name);
    const [sx, sb] = partySlot(u.id, ids, hasGuest);
    v.tx = sx; v.tbase = sb;
    if (v.x == null) { v.x = sx; v.base = sb; }
  });
  for (const u of B.party.filter((u) => u.guest && vis(u.name))) {
    const v = vis(u.name); const s = sizeOf(v);
    v.tx = Math.min(W - s.w - 2, 262); v.tbase = 140;
    if (v.x == null) { v.x = W + 10; v.base = v.tbase; }
  }
}

// ================================================================ numbers, pops, particles
function addNum(name, text, color, opts = {}) {
  const v = vis(name); if (!v) return;
  const s = sizeOf(v);
  const stack = V.nums.filter((n) => n.name === name && now() - n.t0 < 300).length;
  V.nums.push({ name, text, color, size: opts.size || 9, tag: opts.tag || null, tagColor: opts.tagColor,
    x: v.x + s.w / 2 + (stack % 2 ? 7 : -7) * (stack ? 1 : 0), y: v.base - s.h - 2 + Math.min(14, s.h * 0.25) + stack * 4,
    t0: now(), dur: (opts.dur || 950) * spd(), crit: !!opts.crit });
}
function pop(name, text, color = '#ffe9b8', size = 7) { addNum(name, text, color, { size, dur: 900 }); }

function burst(x, y, col, n = 10, spread = 1.2) {
  for (let i = 0; i < n; i++) V.parts.push({ x, y, vx: (Math.random() - 0.5) * spread * 2, vy: -Math.random() * spread * 1.6 - 0.2, col, t0: now(), life: 500 + Math.random() * 400, g: 0.05 });
}

// ================================================================ rendering
const renderer = {
  render(lx, ctx) { try { return draw(lx, ctx); } catch (e) { console.error(e); return []; } },
  overlay(cx, k) { try { drawOverlay(cx, k); } catch (e) { console.error(e); } },
  onTap(id) { onTap(id); },
};

function shakeOffset(t) {
  if (t < V.shakeUntil) {
    const a = V.shakeAmp * ((V.shakeUntil - t) / 400);
    return [Math.round(Math.sin(t * 0.09) * a), Math.round(Math.cos(t * 0.13) * a * 0.6)];
  }
  return [0, 0];
}

function draw(lx, ctx) {
  stepTweens();
  const t = now();
  const [sx, sy] = shakeOffset(t);
  lx.save();
  lx.translate(sx, sy);
  lx.fillStyle = '#000'; lx.fillRect(-4, -4, W + 8, H + 8);
  if (V.bg) lx.drawImage(V.bg, 0, 0);
  // Steward / phase backdrop glow
  const hot = [];
  const list = Object.values(V.u).filter((v) => !v.gone);
  for (const v of list) { v.x += (v.tx - v.x) * 0.18; v.base += (v.tbase - v.base) * 0.18; if (Math.abs(v.tx - v.x) < 0.3) v.x = v.tx; if (Math.abs(v.tbase - v.base) < 0.3) v.base = v.tbase; }
  list.sort((a, b) => a.base - b.base);
  // shadows first
  for (const v of list) {
    if (v.id === 'ain' || v.fled) continue;
    const s = sizeOf(v);
    lx.fillStyle = `rgba(0,0,0,${0.32 * v.alpha})`;
    lx.beginPath(); lx.ellipse(Math.round(v.x + s.w / 2 + stepDx(v)), Math.round(v.base) - 1, Math.max(6, s.w * 0.38), 2.5, 0, 0, Math.PI * 2); lx.fill();
  }
  for (const v of list) drawUnit(lx, v, t, hot, ctx);
  for (const v of list) drawBars(lx, v, t);
  // projectiles
  for (const p of V.proj) {
    const q = Math.min(1, (t - p.t0) / p.d);
    const x = p.x0 + (p.x1 - p.x0) * q, y = p.y0 + (p.y1 - p.y0) * q - Math.sin(q * Math.PI) * (p.arc || 0);
    if (p.kind === 'arrow') {
      lx.strokeStyle = '#e8dcc0'; lx.lineWidth = 1; lx.beginPath();
      const dx = (p.x1 - p.x0) > 0 ? 1 : -1;
      lx.moveTo(Math.round(x) + 0.5, Math.round(y) + 0.5); lx.lineTo(Math.round(x - dx * 6) + 0.5, Math.round(y) + 0.5); lx.stroke();
    } else {
      lx.save(); lx.globalCompositeOperation = 'lighter';
      const g = lx.createRadialGradient(x, y, 0, x, y, 6);
      g.addColorStop(0, rgba(p.col, 0.95)); g.addColorStop(1, rgba(p.col, 0));
      lx.fillStyle = g; lx.fillRect(x - 6, y - 6, 12, 12); lx.restore();
    }
  }
  V.proj = V.proj.filter((p) => t - p.t0 < p.d);
  // particles
  for (const p of V.parts) {
    const age = t - p.t0; const f = age / 16.7;
    const x = p.x + p.vx * f, y = p.y + p.vy * f + p.g * f * f * 0.5;
    lx.fillStyle = rgba(p.col, 1 - age / p.life);
    lx.fillRect(Math.round(x), Math.round(y), 1, 1);
  }
  V.parts = V.parts.filter((p) => t - p.t0 < p.life);
  // telegraph: the picture tints red and pulses
  if (V.telegraph) { lx.fillStyle = `rgba(170,16,8,${0.10 + 0.07 * Math.sin(t * 0.008)})`; lx.fillRect(-4, -4, W + 8, H + 8); }
  if (V.flashUntil > t) { lx.fillStyle = rgba(V.flashCol || '#ffffff', 0.7 * (V.flashUntil - t) / 250); lx.fillRect(-4, -4, W + 8, H + 8); }
  lx.restore();
  return hot;
}

function stepDx(v) { const dir = v.side === 'party' ? -1 : 1; return Math.round(v.step * (v.stepLen || 14) * dir + (v.slide || 0)); }

function drawUnit(lx, v, t, hot, ctx) {
  const im = img(v.sprite);
  const s = sizeOf(v);
  let x = Math.round(v.x + stepDx(v));
  let y = Math.round(v.base - s.h);
  if (v.id === 'ain') y += Math.round(Math.sin(t * 0.004) * 2);
  if (V.victory && v.side === 'party' && v.alive) y -= Math.max(0, Math.round(Math.sin(t * 0.012 + v.x) * 3));
  if (t < v.shakeT) x += Math.round(Math.sin(t * 0.7) * 2);
  if (!v.alive && v.side === 'party') y += 4;
  const box = { x, y, w: s.w, h: s.h };
  // Ain's halo
  if (v.id === 'ain' && v.alive) {
    lx.save(); lx.globalCompositeOperation = 'lighter';
    const r = 13 + Math.sin(t * 0.005) * 1.5;
    const g = lx.createRadialGradient(x + s.w / 2, y + s.h / 2, 1, x + s.w / 2, y + s.h / 2, r);
    g.addColorStop(0, rgba(TEAL, 0.45 + v.cast * 0.4)); g.addColorStop(1, rgba(TEAL, 0));
    lx.fillStyle = g; lx.fillRect(x + s.w / 2 - r, y + s.h / 2 - r, r * 2, r * 2);
    lx.restore();
  } else if (v.cast > 0) {
    lx.save(); lx.globalCompositeOperation = 'lighter';
    const g = lx.createRadialGradient(x + s.w / 2, y + s.h / 2, 2, x + s.w / 2, y + s.h / 2, s.h * 0.7);
    g.addColorStop(0, rgba(v.castCol || '#ffd890', 0.35 * v.cast)); g.addColorStop(1, rgba(v.castCol || '#ffd890', 0));
    lx.fillStyle = g; lx.fillRect(x - s.h, y - s.h * 0.3, s.w + s.h * 2, s.h * 1.6); lx.restore();
  }
  const mirror = v.mirror;
  const blit = (c, dx, dy, alpha = 1) => {
    if (!c) return;
    lx.save(); lx.globalAlpha = alpha * v.alpha;
    if (mirror) { lx.translate(x + s.w / 2, 0); lx.scale(-1, 1); lx.translate(-(x + s.w / 2), 0); }
    lx.drawImage(c, dx, dy); lx.restore();
  };
  if (!im) {
    // placeholder silhouette
    lx.fillStyle = `rgba(12,8,6,${v.alpha})`; lx.fillRect(x, y, s.w, s.h);
    lx.strokeStyle = 'rgba(255,220,170,0.5)'; lx.strokeRect(x + 0.5, y + 0.5, s.w - 1, s.h - 1);
  } else if (v.dissolve) {
    drawDissolve(lx, v, im, x, y, t);
  } else {
    const enemy = v.side === 'enemy';
    const telegraphing = enemy && V.telegraphUnits.has(v.name);
    if (enemy && SHADOWY.includes(v.id)) blit(variant(v.sprite, 'glow', '#9a6affff'), x - 2, y - 2, 0.55 + 0.35 * Math.sin(t * 0.006));
    if (v.id === 'steward' && V.phase >= 3) blit(variant(v.sprite, 'glow', '#3fe0c8ff'), x - 2, y - 2, 0.4 + 0.3 * Math.sin(t * 0.007));
    if (enemy) blit(variant(v.sprite, 'rim', telegraphing ? '#ff4030ff' : '#fff0d2b0'), x - 1, y - 1, telegraphing ? 0.6 + 0.4 * Math.sin(t * 0.012) : 1);
    const stilled = v.statuses.includes('stilled');
    let base = im;
    if (v.recolour === 'elite') base = variant(v.sprite, 'elite') || im;
    if ((!v.alive && v.side === 'party') || stilled) base = variant(v.sprite, 'grey') || im;
    // attack frames replace the idle sprite
    const fr = v.anim && animFrame(v, t);
    if (fr) {
      lx.save(); lx.globalAlpha = v.alpha; lx.drawImage(fr.img, x - fr.ox, y - fr.oy); lx.restore();
    } else blit(base, x, y, !v.alive && v.side === 'party' ? 0.65 : 1);
    if (t < v.flashT) blit(variant(v.sprite, 'white'), x, y, 1);
    if (stilled && v.alive) { lx.fillStyle = rgba(TEAL, 0.10 + 0.05 * Math.sin(t * 0.004)); lx.fillRect(x, y, s.w, s.h); }
    if (v.id === 'steward') drawStewardFx(lx, v, x, y, s, t);
  }
  v._bx = x; v._by = y;
  // target marker and turn marker
  if (v.alive && !v.dissolve && !V.victory) {
    const bob = Math.round(Math.sin(t * 0.008) * 1.5);
    if (v.side === 'enemy' && v.name === currentTarget() && B.awaiting && !busy) tri(lx, x + Math.round(s.w / 2), Math.max(17, y - 4 + bob), '#ffd060');
    if (v.side === 'party' && v.name === B.awaiting && !busy) tri(lx, x + Math.round(s.w / 2), Math.max(17, y - 4 + bob), '#ffffff');
  }
  if (!v.gone && !v.fled && (v.alive || v.side === 'party')) {
    const hb = ctx.padBox(box);
    hot.push({ id: v.name, kind: v.side, name: v.name, ...hb, box });
  }
}

function drawBars(lx, v, t) {
  if (v.gone) return;
  const s = sizeOf(v); const x = v._bx ?? Math.round(v.x);
  if (!v.dissolve && !v.fled && (v.alive || v.side === 'party')) {
    const bw = Math.max(18, Math.min(40, Math.round(s.w * 0.8)));
    const bx = Math.round(x + s.w / 2 - bw / 2), by = Math.min(H - 4, Math.round(v.base) + 2 + (!v.alive && v.side === 'party' ? 0 : 0));
    const f = v.maxHp ? Math.max(0, Math.min(1, v.hp / v.maxHp)) : 0;
    lx.fillStyle = 'rgba(0,0,0,0.75)'; lx.fillRect(bx - 1, by - 1, bw + 2, v.side === 'party' && v.maxMp ? 5 : 4);
    lx.fillStyle = v.side === 'party' ? (f < 0.3 ? '#e0b030' : '#58c058') : '#d84030';
    lx.fillRect(bx, by, Math.round(bw * f), 2);
    if (v.side === 'party' && v.maxMp) { lx.fillStyle = '#4a8ae0'; lx.fillRect(bx, by + 3, Math.round(bw * Math.max(0, Math.min(1, v.mp / v.maxMp))), 1); }
    const sts = [...new Set(v.statuses)].slice(0, 3);
    sts.forEach((id, i) => {
      const ix = bx + bw + 2 + i * 11;
      const iy = Math.min(H - 12, by - 5);
      if (ix + 12 <= W) lx.drawImage(statusIcon(id), ix, iy);
      else lx.drawImage(statusIcon(id), bx - 13 - i * 11, iy);
    });
  }
}

function tri(lx, cx, y, col) {
  lx.fillStyle = '#000';
  lx.fillRect(cx - 3, y - 5, 7, 1); lx.fillRect(cx - 3, y - 4, 7, 1);
  lx.fillStyle = col;
  lx.fillRect(cx - 2, y - 4, 5, 1); lx.fillRect(cx - 1, y - 3, 3, 1); lx.fillRect(cx, y - 2, 1, 1);
}

function animFrame(v, t) {
  const a = v.anim; const meta = animData?.[a.id]; if (!meta) return null;
  const i = Math.floor((t - a.t0) / (1000 / meta.fps) / spd());
  if (i >= meta.frames) return null;
  const im = img(meta.frameIds[i]); if (!im) return null;
  return { img: im, ox: meta.idleOffsetX, oy: meta.idleOffsetY };
}

// pixel dissolve (out: pixels vanish and drift up; in: they appear)
function drawDissolve(lx, v, im, x, y, t) {
  const d = v.dissolve;
  if (!d.noise) {
    const w = im.naturalWidth, h = im.naturalHeight;
    const c = canvas(w, h); const cx = c.getContext('2d');
    let base = im; if (v.recolour === 'elite') base = variant(v.sprite, 'elite') || im;
    cx.drawImage(base, 0, 0);
    d.src = cx.getImageData(0, 0, w, h); d.w = w; d.h = h;
    d.noise = new Float32Array(w * h);
    for (let i = 0; i < d.noise.length; i++) d.noise[i] = Math.random() * 0.75 + (d.out ? (1 - Math.floor(i / w) / h) * 0.25 : 0);
    d.c = canvas(w, h); d.cx = d.c.getContext('2d'); d.lastP = 0;
  }
  const p = Math.min(1, (t - d.t0) / d.dur);
  const img2 = d.cx.createImageData(d.w, d.h); const o = img2.data, s = d.src.data;
  for (let i = 0; i < d.noise.length; i++) {
    const vis_ = d.out ? d.noise[i] >= p : d.noise[i] < p;
    if (!vis_ || s[i * 4 + 3] < 128) continue;
    o[i * 4] = s[i * 4]; o[i * 4 + 1] = s[i * 4 + 1]; o[i * 4 + 2] = s[i * 4 + 2]; o[i * 4 + 3] = 255;
    if (d.out && d.noise[i] < p + 0.06) { o[i * 4] = 255; o[i * 4 + 1] = 240; o[i * 4 + 2] = 220; }
    if (d.out && d.noise[i] >= d.lastP && d.noise[i] < p && Math.random() < 0.12 && V.parts.length < 600) {
      const px = i % d.w, py = Math.floor(i / d.w);
      V.parts.push({ x: x + px, y: y + py, vx: (Math.random() - 0.5) * 0.4, vy: -0.3 - Math.random() * 0.5, g: -0.004, col: '#ffe8c8', t0: t, life: 500 + Math.random() * 300 });
    }
  }
  d.lastP = p;
  d.cx.putImageData(img2, 0, 0);
  lx.save();
  if (v.mirror) { lx.translate(x + d.w / 2, 0); lx.scale(-1, 1); lx.translate(-(x + d.w / 2), 0); }
  lx.drawImage(d.c, x, y); lx.restore();
}

// The Steward: teal code cracks per phase, glowing; the Eye when it opens.
function drawStewardFx(lx, v, x, y, s, t) {
  const n = V.phase >= 3 ? 9 : V.phase >= 2 ? 5 : 0;
  lx.save(); lx.globalCompositeOperation = 'lighter';
  if (n) {
    let seed = 1234;
    const r = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    const a = 0.55 + 0.35 * Math.sin(t * 0.006);
    lx.strokeStyle = rgba(TEAL, a); lx.lineWidth = 1;
    for (let i = 0; i < n; i++) {
      let px = x + s.w * (0.3 + r() * 0.45), py = y + s.h * (0.2 + r() * 0.7);
      lx.beginPath(); lx.moveTo(Math.round(px) + 0.5, Math.round(py) + 0.5);
      for (let j = 0; j < 4; j++) { px += (r() - 0.5) * 8; py += 2 + r() * 5; lx.lineTo(Math.round(px) + 0.5, Math.round(py) + 0.5); }
      lx.stroke();
    }
  }
  if (V.eyeOpen) {
    const ex = x + s.w * 0.5, ey = y + s.h * 0.15;
    const r = 10 + 3 * Math.sin(t * 0.012);
    const g = lx.createRadialGradient(ex, ey, 0, ex, ey, r);
    g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(0.25, rgba(TEAL, 0.9)); g.addColorStop(1, rgba(TEAL, 0));
    lx.fillStyle = g; lx.fillRect(ex - r, ey - r, r * 2, r * 2);
  }
  lx.restore();
}

function drawOverlay(cx, k) {
  const t = now();
  const [sx, sy] = shakeOffset(t);
  cx.save();
  cx.textAlign = 'center'; cx.textBaseline = 'middle';
  V.nums = V.nums.filter((n) => t - n.t0 < n.dur);
  for (const n of V.nums) {
    const p = (t - n.t0) / n.dur;
    const y = n.y - 40 * p + 50 * p * p;
    const sc = p < 0.12 ? 1 + (1 - p / 0.12) * (n.crit ? 0.9 : 0.5) : 1;
    const a = p > 0.7 ? 1 - (p - 0.7) / 0.3 : 1;
    const size = Math.round(n.size * k * sc);
    cx.font = `${size}px PixelifySans, monospace`;
    cx.lineWidth = Math.max(2, k * 1.2); cx.strokeStyle = `rgba(0,0,0,${0.85 * a})`; cx.lineJoin = 'round';
    const X = (n.x + sx) * k, Y = (y + sy) * k;
    cx.globalAlpha = a;
    cx.strokeText(n.text, X, Y); cx.fillStyle = n.color; cx.fillText(n.text, X, Y);
    if (n.tag) {
      cx.font = `${Math.round(6 * k)}px PixelifySans, monospace`;
      cx.strokeText(n.tag, X, Y - size * 0.75); cx.fillStyle = n.tagColor || '#ffb040'; cx.fillText(n.tag, X, Y - size * 0.75);
    }
    cx.globalAlpha = 1;
  }
  // the current target's name over it (crisp), when a command is wanted
  const tg = currentTarget();
  if (tg && B.awaiting && !busy && !V.victory) {
    const v = vis(tg), u = unitOf(tg);
    if (v && u && !v.dissolve) {
      const s = sizeOf(v);
      const css = (cx.canvas.getBoundingClientRect().width || W) / W;   // CSS px per picture px
      const stripB = stripEl ? Math.ceil(stripEl.offsetHeight / css) : 18;   // keep clear of the turn-order row (tall foes: the Steward)
      const ty = Math.max(24, stripB + 9, Math.round(v.base - s.h) - 12);
      const fpx = Math.max(6.5, 11 / css);   // never under 11 CSS px, so it reads on a phone
      cx.font = `${Math.round(fpx * k)}px PixelifySans, monospace`;
      if ('wordSpacing' in cx) cx.wordSpacing = `${Math.round(fpx * k * 0.25)}px`;   // the pixel font's own space nearly vanishes when small
      cx.lineWidth = Math.max(2, k); cx.strokeStyle = 'rgba(0,0,0,0.85)';
      const half = Math.max(30, cx.measureText(u.label).width / k / 2 + 3);
      const X = Math.max(half, Math.min(W - half, v.x + s.w / 2)) * k;
      cx.strokeText(u.label, X, ty * k); cx.fillStyle = '#ffe2a0'; cx.fillText(u.label, X, ty * k);
      if ('wordSpacing' in cx) cx.wordSpacing = '0px';
    }
  }
  if (V.banner) {
    const p = Math.min(1, (t - V.banner.t0) / 400);
    const sc = 0.6 + 0.4 * easeOut(p);
    cx.font = `${Math.round(22 * k * sc)}px Metamorphous, serif`;
    cx.lineWidth = Math.max(3, k * 2); cx.strokeStyle = 'rgba(0,0,0,0.9)';
    cx.globalAlpha = p;
    cx.strokeText(V.banner.text, W / 2 * k, 62 * k); cx.fillStyle = V.banner.color || '#ffd060'; cx.fillText(V.banner.text, W / 2 * k, 62 * k);
    cx.globalAlpha = 1;
  }
  cx.restore();
}

// ================================================================ the turn-order strip (DOM) + Auto toggle
function buildStrip() {
  removeStrip();
  stripEl = document.createElement('div');
  stripEl.id = 'bt-strip';
  stripEl.innerHTML = '<div class="bt-order"></div><button class="bt-auto" type="button" aria-pressed="false" title="Auto battle (A)">AUTO</button>';
  stripEl.querySelector('.bt-auto').addEventListener('click', (e) => { e.stopPropagation(); A.Audio.sfx('tap'); setAuto(!auto); });
  $('#picture').append(stripEl);
  renderStrip();
}
function removeStrip() { document.getElementById('bt-strip')?.remove(); stripEl = null; }
function renderStrip() {
  if (!stripEl || !B) return;
  const ord = stripEl.querySelector('.bt-order');
  ord.innerHTML = '';
  if (B.awaiting && !busy) { const t = document.createElement('span'); t.className = 'bt-turn'; t.textContent = memberName(unitOf(B.awaiting)?.id || B.awaiting); ord.append(t); }
  const view = Battle.battleView(B);
  const names = B.awaiting ? [B.awaiting, ...view.turnOrder.filter((n) => n !== B.awaiting)].slice(0, 6) : view.turnOrder;
  names.forEach((n, i) => {
    const u = unitOf(n); if (!u) return;
    const d = document.createElement('span');
    d.className = 'bt-chip ' + (u.side === 'party' ? 'p' : 'e') + (n === B.awaiting ? ' now' : '');
    d.title = u.label;
    const im = document.createElement('img');
    im.alt = '';
    if (u.side === 'party') im.src = A.Scene.portraitURL((MEMBERS[u.id]?.portrait) || 'portrait/' + u.id, u.label, u.id === 'ain');
    else if (A.Scene.hasAsset(u.sprite)) im.src = A.Scene.assetPath(u.sprite);
    else im.src = A.Scene.portraitURL('', u.label, false, true);
    d.append(im);
    ord.append(d);
  });
  const b = stripEl.querySelector('.bt-auto');
  b.classList.toggle('on', auto); b.setAttribute('aria-pressed', auto ? 'true' : 'false');
}

// ================================================================ targets
function livingEnemies() { return B.enemies.filter((u) => u.alive && !u.fled); }
function currentTarget() {
  if (!B || B.over) return null;
  const ok = (n) => { const u = n && unitOf(n); return u && u.side === 'enemy' && u.alive && !u.fled; };
  if (ok(selTarget)) return selTarget;
  const who = B.awaiting;
  if (who && ok(B.currentTarget[who])) return B.currentTarget[who];
  if (who) { try { const c = Battle.autoCommand(B, who); if (c && ok(c.target)) return c.target; } catch (e) { /* */ } }
  const le = livingEnemies();
  const pri = le.find((u) => u.partOf) || le[0];
  return pri ? pri.name : null;
}
function shortLabel(u) {
  if (!u) return '—';
  let l = u.label;
  if (/^(Left|Right) Arm$/.test(l)) return 'Arm ' + l[0];
  l = l.replace(/^The /, '');
  const m = l.match(/^(.*) ([A-F])$/);
  let letter = '';
  if (m) { l = m[1]; letter = ' ' + m[2]; }
  if (/ the /.test(l)) l = l.split(' the ')[0];
  if (l.length > 11) l = l.split(' ').pop();
  return l + letter;
}
function cycleTarget(d) {
  const le = livingEnemies(); if (!le.length) return;
  const cur = currentTarget();
  const order = le.map((u) => u.name).sort((a, b) => (vis(a)?.tx || 0) - (vis(b)?.tx || 0));
  let i = order.indexOf(cur); i = (i + d + order.length) % order.length;
  selTarget = order[i];
  A.Audio.sfx('tap');
  renderTray();
}

function onTap(id) {
  if (!B || ended) return;
  if (V.picking) {
    const u = id && unitOf(id);
    if (u && u.side === 'party' && V.picking.ok(u)) { const p = V.picking; V.picking = null; p.resolve(u.name); }
    return;
  }
  if (continueResolve) { doContinue(); return; }
  if (!id) return;
  const u = unitOf(id);
  if (u && u.side === 'enemy' && u.alive) {
    selTarget = id; A.Audio.sfx('tap');
    if (!busy) renderTray();
  }
}

// ================================================================ the tray
function memberName(id) { const n = MEMBERS[id]?.name || id; return n.startsWith('Red ') ? n.slice(4) : n; }

function attackLabel() {
  const u = unitOf(currentTarget());
  const box = document.createElement('span');
  box.className = 'bt-lbl';
  box.innerHTML = `<b>Attack</b><small>▸ ${escapeHtml(shortLabel(u))}</small>`;
  return box;
}
function escapeHtml(s) { return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

function renderTray() {
  if (!B || B.over || busy) return;
  const who = B.awaiting; if (!who) return;
  pendingChoices = null;
  const skills = Battle.availableSkills(B, who);
  const items = usableItems();
  const tgt = currentTarget();
  const tu = unitOf(tgt);
  const btns = [
    { label: attackLabel(), text: `Attack ▸ ${shortLabel(tu)}`, cls: 'bt-atk', onClick: () => send({ act: 'attack', target: tgt }) },
    { label: 'Skill', text: 'Skill', cls: 'bt-skill', disabled: !skills.length, onClick: () => openSkills() },
    { label: 'Item', text: 'Item', cls: 'bt-item', disabled: !items.length, onClick: () => openItems() },
    { label: 'Defend', text: 'Defend', cls: 'bt-def', onClick: () => send({ act: 'defend' }) },
    { label: 'Flee', text: 'Flee', cls: 'bt-flee', disabled: !!B.encounter.noFlee, title: B.encounter.noFlee ? 'There is no running from this one.' : '', onClick: () => send({ act: 'flee' }) },
    { label: 'Repeat', text: 'Repeat', cls: 'bt-rep', disabled: !B.lastCommands[who], title: B.lastCommands[who] ? cmdText(B.lastCommands[who]) : 'Nothing to repeat yet', onClick: () => send({ act: 'repeat' }) },
  ];
  A.UI.setTray({ buttons: btns, numbered: true, chips: [], cls: 'battle', head: `${memberName(who)}'s turn` });
  renderStrip();
}
function trayBusy() {
  A.UI.setTray({ buttons: ['Attack', 'Skill', 'Item', 'Defend', 'Flee', 'Repeat'].map((l) => ({ label: l, text: l, disabled: true, onClick: () => {} })), numbered: true, chips: [], cls: 'battle busy', head: '…' });
}
function cmdText(c) {
  if (!c) return '';
  if (c.act === 'skill') return SKILLS[c.skill]?.name || c.skill;
  if (c.act === 'item') return ITEMS[c.item]?.name || c.item;
  return c.act[0].toUpperCase() + c.act.slice(1);
}

function usableItems() {
  return Object.entries(B.items).filter(([id, n]) => n > 0 && ITEMS[id]?.kind === 'consumable' && ITEMS[id].battle !== false).map(([id]) => id);
}

function skillKind(sk, u) {
  if (sk.steal) return 'steal';
  if (sk.scan) return 'scan';
  if (sk.heal || sk.revive || sk.healPct) return 'heal';
  if (sk.mult || sk.spellPower != null) { const t = sk.type === 'weapon' ? (u.weapon?.type || 'slash') : sk.type; return ['slash', 'pierce', 'crush', 'shock', 'fire'].includes(t) ? t : 'wonder'; }
  if (sk.buff) return sk.buff.pct < 0 ? 'debuff' : 'buff';
  if (sk.status) return 'status';
  if (sk.target === 'self') return 'guard';
  return 'buff';
}
function itemKind(it) {
  const e = it.effect || {};
  if (e.damage) return e.damage.type;
  if (e.move) return 'fire';
  if (e.heal || e.revive || e.mp) return 'heal';
  if (e.cure) return 'status';
  return 'buff';
}

function openSkills() {
  const who = B.awaiting; const u = unitOf(who);
  const ids = Battle.availableSkills(B, who);
  A.UI.openModal({ title: `${memberName(who)}: Skills`, sheet: true, cls: 'bt-sheet', body: (b, close) => {
    const grid = document.createElement('div'); grid.className = 'bt-grid';
    for (const id of ids) {
      const sk = SKILLS[id]; if (!sk) continue;
      const err = Battle.validateCommand(B, { act: 'skill', skill: id });
      const btn = document.createElement('button');
      btn.className = 'bt-opt'; btn.disabled = !!err; btn.title = err || sk.desc || '';
      btn.innerHTML = `<img class="bt-ti" alt="" src="${typeIconURL(skillKind(sk, u))}"><span class="bt-on">${escapeHtml(sk.name)}</span><span class="bt-mp">${sk.mp ? sk.mp + ' MP' : ''}${sk.hpPct ? ' +HP' : ''}</span>`;
      btn.addEventListener('click', async () => { close(true); await chooseSkill(id); });
      grid.append(btn);
    }
    if (!ids.length) grid.append(Object.assign(document.createElement('p'), { className: 'muted', textContent: 'No skills yet.' }));
    b.append(grid);
    const d = document.createElement('p'); d.className = 'bt-desc muted small'; d.textContent = `${memberName(who)}: ${u.mp}/${u.maxMp} MP`; b.append(d);
  } });
}
async function chooseSkill(id) {
  const sk = SKILLS[id];
  if (sk.target === 'ally' || sk.target === 'ally_down') {
    const t = await pickAlly(sk.name, sk.target === 'ally_down');
    if (!t) return;
    send({ act: 'skill', skill: id, target: t });
  } else if (sk.target === 'one') send({ act: 'skill', skill: id, target: currentTarget() });
  else send({ act: 'skill', skill: id });
}

function openItems() {
  const who = B.awaiting;
  const ids = usableItems();
  A.UI.openModal({ title: `${memberName(who)}: Items`, sheet: true, cls: 'bt-sheet', body: (b, close) => {
    const grid = document.createElement('div'); grid.className = 'bt-grid';
    for (const id of ids) {
      const it = ITEMS[id];
      const err = Battle.validateCommand(B, { act: 'item', item: id });
      const btn = document.createElement('button');
      btn.className = 'bt-opt'; btn.disabled = !!err; btn.title = err || it.desc || '';
      const icon = A.UI.iconImg(id); icon.classList.add('bt-ii');
      btn.append(icon);
      btn.insertAdjacentHTML('beforeend', `<span class="bt-on">${escapeHtml(it.name)}</span><span class="bt-mp">×${B.items[id]}</span><img class="bt-ti" alt="" src="${typeIconURL(itemKind(it))}">`);
      btn.addEventListener('click', async () => { close(true); await chooseItem(id); });
      grid.append(btn);
    }
    b.append(grid);
  } });
}
async function chooseItem(id) {
  const it = ITEMS[id];
  if (it.target === 'ally' || it.target === 'ally_down') {
    const t = await pickAlly(it.name, it.target === 'ally_down', it.targetOnly);
    if (!t) return;
    send({ act: 'item', item: id, target: t });
  } else if (it.target === 'one' || (it.effect?.damage && it.target !== 'all_enemies')) send({ act: 'item', item: id, target: currentTarget() });
  else send({ act: 'item', item: id });
}

// ally target picker: party portraits in a sheet (tapping a party sprite works too)
function pickAlly(what, down, only) {
  return new Promise((resolve) => {
    const ok = (u) => !u.guest && (down ? !u.alive : u.alive) && (!only || only.includes(u.id));
    let m = null;
    V.picking = { ok, resolve: (n) => { m?.close(true); resolve(n); } };
    m = A.UI.openModal({ title: `${what}: on whom?`, sheet: true, cls: 'bt-sheet bt-allies', onClose: () => { if (V.picking) { V.picking = null; resolve(null); } }, body: (b, close) => {
      const grid = document.createElement('div'); grid.className = 'bt-allies-row';
      for (const u of B.party.filter((u) => !u.guest)) {
        const btn = document.createElement('button');
        btn.className = 'bt-ally'; btn.disabled = !ok(u);
        const f = u.maxHp ? Math.max(0, u.hp / u.maxHp) : 0;
        btn.innerHTML = `<img class="portrait" alt="" src="${A.Scene.portraitURL(MEMBERS[u.id]?.portrait || 'portrait/' + u.id, u.label, u.id === 'ain')}"><span class="bt-an">${escapeHtml(u.label)}</span><span class="bar hp"><i style="width:${f * 100}%"></i></span><span class="bt-hp">${u.hp}/${u.maxHp}</span>`;
        btn.addEventListener('click', () => { const n = u.name; V.picking = null; close(true); resolve(n); });
        grid.append(btn);
      }
      b.append(grid);
    } });
  });
}

// ================================================================ input
function send(cmd) {
  if (busy || !B || B.over || !inputResolve) return;
  const r = Battle.command(B, cmd);
  if (r.error) { A.UI.log({ text: r.error, cls: 'ln-sys', instant: true }); A.Audio.sfx('error'); return; }
  if (r.choices) { showChoices(r); return; }
  const res = inputResolve; inputResolve = null; res(r);
}
function showChoices(r) {
  pendingChoices = r.choices;
  A.UI.log({ text: r.prompt || 'Which?', cls: 'ln-sys', instant: true });
  A.UI.setTray({ numbered: true, chips: [], cls: 'battle-choices', buttons: [
    ...r.choices.map((c) => {
      const u = c.cmd?.target && unitOf(c.cmd.target);
      const label = u ? `${u.label} (${u.name})` : (c.text || String(c.cmd?.skill || c.cmd?.item || c.cmd?.act || '?'));
      return { label, text: label, onClick: () => {
        pendingChoices = null;
        const cmd = c.cmd;
        if (cmd.act === 'skill' && !cmd.target) chooseSkill(cmd.skill);
        else if (cmd.act === 'item' && !cmd.target) chooseItem(cmd.item);
        else { if (u && u.side === 'enemy') selTarget = u.name; send(cmd); }
      } };
    }),
    { label: 'Back', text: 'Back', cls: 'cancel', onClick: () => { pendingChoices = null; renderTray(); } }] });
}

async function typed(raw) {
  const t = String(raw || '').trim().toLowerCase();
  if (!t) return;
  if (continueResolve) { doContinue(); return; }
  const am = t.match(/^auto(?:\s+(on|off))?$/);
  if (am) { setAuto(am[1] ? am[1] === 'on' : !auto); A.UI.log({ text: `Auto battle ${auto ? 'on' : 'off'}.`, cls: 'ln-sys', instant: true }); return; }
  if (busy || !inputResolve) { A.UI.log({ text: '(Wait for your turn.)', cls: 'ln-sys', instant: true }); return; }
  if (/^\d+$/.test(t)) { const n = parseInt(t, 10) - 1; if (!A.UI.pressChoice(n)) A.UI.log({ text: 'There is no command with that number.', cls: 'ln-sys', instant: true }); return; }
  const p = Battle.parseCommand(B, t);
  if (p.error) { A.UI.log({ text: p.error, cls: 'ln-sys', instant: true }); A.Audio.sfx('error'); return; }
  if (p.choices) { showChoices(p); return; }
  const cmd = { ...p.cmd };
  if (cmd.act === 'attack' && !cmd.target) cmd.target = currentTarget();
  if (cmd.target && unitOf(cmd.target)?.side === 'enemy') selTarget = cmd.target;
  send(cmd);
}

export function onKey(e) {
  if (!B || ended) return false;
  const k = e.key;
  if (continueResolve && (k === 'Enter' || k === ' ' || k === '1')) { doContinue(); return true; }
  if (k === 'a' || k === 'A') { if (e.ctrlKey || e.metaKey || e.altKey) return false; A.Audio.sfx('tap'); setAuto(!auto); return true; }
  if (busy || !inputResolve || pendingChoices) return false;
  if (k === 'r' || k === 'R') { if (B.lastCommands[B.awaiting]) send({ act: 'repeat' }); return true; }
  if (k === 'ArrowLeft' || k === 'ArrowUp') { cycleTarget(-1); return true; }
  if (k === 'ArrowRight' || k === 'ArrowDown') { cycleTarget(1); return true; }
  if (k === 'Enter') { send({ act: 'attack', target: currentTarget() }); return true; }
  return false;
}

export function setAuto(on) {
  auto = !!on;
  A?.setAutoFlag?.(auto);
  renderStrip();
  if (auto && inputResolve) { const r = inputResolve; inputResolve = null; r('auto'); }
}

export function _debug() { return { B, V }; }

// The game left the battle without finishing it (goToLevel, load, quit to title).
export function abort() {
  runId++;
  ended = true;
  hooks.battleCommand = null;
  removeStrip();
  const r = inputResolve; inputResolve = null; if (r) r('abort');
  const c = continueResolve; continueResolve = null; if (c) c();
  if (V) V.picking = null;
  if (busy) { busy = false; if (A) A.R.busyCount = Math.max(0, (A.R.busyCount || 1) - 1); }
}

export function state() {
  if (!B || ended) return null;
  return { ...Battle.battleView(B), busy, auto, victory: !!continueResolve, input: !!(inputResolve || continueResolve) };
}

// ================================================================ sfx helpers
function sfx(id) { if (id) A.Audio.sfx(id); }
function attackSfx(u, kind, type, crit) {
  if (crit) return 'heavy-hit';
  if (u.side === 'party') {
    if (u.id === 'ain') return 'shock';
    if (u.weapon?.flyers || (u.id === 'toktai' && /pierce/.test(type) && u.weapon?.id && ITEMS[u.weapon.id]?.class === 'bow')) return 'arrow';
    if (type === 'crush') return 'heavy-hit';
    if (type === 'shock') return 'shock';
    if (type === 'fire') return 'fire';
    return 'sword-slash';
  }
  if (type === 'shock') return 'shock';
  if (type === 'fire') return 'fire';
  if (u.tags?.includes('machine')) return type === 'crush' ? 'heavy-hit' : 'servo';
  if (/asp|python|serpent|steward/.test(u.id) || u.sprite?.includes('serpent')) return 'serpent-hiss';
  if (type === 'crush') return 'heavy-hit';
  if (type === 'pierce') return 'arrow';
  return 'sword-slash';
}

// ================================================================ playing events
function logEvent(e) {
  if (!e.text || (e.type === 'end' && e.text === 'Victory.')) return;
  let cls = 'ln-battle';
  if (e.type === 'round') cls = 'ln-sys bt-round';
  else if (e.type === 'telegraph') cls = 'ln-warn';
  else if (e.type === 'tutorial') cls = 'ln-sys bt-tut';
  else if (e.type === 'end') cls = 'ln-sys bt-end';
  if (e.speaker === 'ain') { cls += ' bt-ain'; A.Audio.sfx('ain'); }
  A.UI.log({ text: e.type === 'tutorial' && A.UI.tapWords ? A.UI.tapWords(e.text) : e.text, cls, instant: true });
}

async function playEvents(events) {
  const my = runId;
  for (const e of events) {
    if (!B || ended || my !== runId) return;
    try { await playEvent(e); } catch (err) { console.error('battle event', e, err); }
  }
  sync();
}

function centre(v) { const s = sizeOf(v); return { x: v.x + s.w / 2, y: v.base - s.h / 2, top: v.base - s.h }; }
function shake(amp = 3, ms = 380) { V.shakeAmp = amp; V.shakeUntil = now() + ms; }
function flashScreen(col = '#ffffff', ms = 250) { V.flashCol = col; V.flashUntil = now() + ms; }

async function playEvent(e) {
  if (e.type !== 'action') logEvent(e);
  switch (e.type) {
    case 'round':
      V.round = e.round;
      V.eyeOpen = false;
      await wait(120); break;
    case 'action': await playAction(e); break;
    case 'hook': {
      sfx(e.effect === 'ain_breaks_through' ? 'ain-cast' : 'heal');
      if (e.effect === 'ain_breaks_through') flashScreen(TEAL, 300);
      for (const tg of e.targets || []) {
        const v = vis(tg.unit); if (!v) continue;
        if (tg.heal) addNum(tg.unit, '+' + tg.heal, '#70e070');
        if (tg.statusesRemoved?.length) { v.statuses = v.statuses.filter((s) => !tg.statusesRemoved.includes(s)); pop(tg.unit, 'Cured', TEAL); }
        if (tg.hp != null) setHp(tg.unit, tg.hp);
        v.cast = 1; tween(v, 'cast', 0, 600);
      }
      await wait(600); break;
    }
    case 'aura':
      for (const tg of e.targets || []) {
        const v = vis(tg.unit); if (!v) continue;
        if (tg.added) { v.statuses.push(e.status); pop(tg.unit, Battle.STATUS_INFO[e.status]?.label || e.status, '#a8c8ff'); }
        else if (tg.unaffected) pop(tg.unit, 'unaffected', '#cccccc');
      }
      { const a = vis(e.actor); if (a) { a.cast = 1; tween(a, 'cast', 0, 500); a.castCol = '#a8c8ff'; } }
      await wait(450); break;
    case 'eye':
      V.eyeOpen = true; sfx('shock'); flashScreen(TEAL, 350);
      await wait(600); break;
    case 'tutorial': await wait(200); break;
    case 'skip': pop(e.unit, e.reason === 'stun' ? 'Stunned' : 'Stilled', e.reason === 'stun' ? '#ffd040' : TEAL); await wait(380); break;
    case 'tick': {
      const col = e.status === 'poison' ? '#b070ff' : e.status === 'bleed' ? '#ff5040' : '#70e070';
      if (e.damage) { addNum(e.unit, String(e.damage), col); const v = vis(e.unit); if (v) v.shakeT = now() + 200; }
      if (e.heal) addNum(e.unit, '+' + e.heal, '#70e070');
      const u = unitOf(e.unit); if (u) setHp(e.unit, Math.max(0, (vis(e.unit)?.hp ?? u.hp) - (e.damage || 0) + (e.heal || 0)));
      await wait(320); break;
    }
    case 'status': { const v = vis(e.unit); if (v) v.statuses = v.statuses.filter((s) => !(e.removed || []).includes(s)); break; }
    case 'telegraph': {
      V.telegraph = true; V.telegraphUnits.add(e.actor);
      const a = unitOf(e.actor);
      sfx(/serpent|steward|thulamon|python/.test(a?.id || '') ? 'serpent-hiss' : 'heartbeat');
      await wait(650); break;
    }
    case 'summon': {
      sfx(/asp/.test(e.units?.[0] || '') ? 'serpent-hiss' : 'battle-swoosh');
      const a = vis(e.actor); if (a) { a.cast = 1; a.castCol = '#a070ff'; tween(a, 'cast', 0, 600); }
      for (const n of e.units || []) {
        const u = unitOf(n); if (!u) continue;
        const v = newVis(u); V.u[n] = v; await loadImg(u.sprite);
        v.dissolve = { t0: now(), dur: 600 * spd(), out: false };
      }
      layout();
      for (const n of e.units || []) { const v = vis(n); if (v) { v.x = v.tx; v.base = v.tbase; const c = centre(v); burst(c.x, v.base - 4, '#a070ff', 14); } }
      await wait(650);
      for (const n of e.units || []) { const v = vis(n); if (v) v.dissolve = null; }
      break;
    }
    case 'phase': {
      const v = vis(e.unit); const u = unitOf(e.unit);
      flashScreen('#ffffff', 300); shake(4, 600);
      V.phase = e.phase;
      sfx(/steward|thulamon/.test(u?.id || '') ? 'wyrm-roar' : 'heavy-hit');
      if (v && e.sprite && e.sprite !== v.sprite) { await loadImg(e.sprite); v.sprite = e.sprite; layout(); }
      if (v) { const c = centre(v); burst(c.x, c.y, u?.tags?.includes('machine') ? TEAL : '#ffd890', 24, 2); }
      await wait(800); break;
    }
    case 'death': {
      const v = vis(e.unit); if (!v) break;
      v.alive = false; setHp(e.unit, 0);
      if (v.side === 'enemy') {
        sfx('enemy-death');
        const u = unitOf(e.unit);
        if (u && ['boss', 'mini'].includes(u.role) && !u.partOf) shake(4, 500);
        v.dissolve = { t0: now(), dur: 650 * spd(), out: true };
        await wait(700);
        v.gone = true; v.dissolve = null;
        if (selTarget === e.unit) selTarget = null;
        layout();
      } else { sfx('ally-fall'); v.statuses = []; await wait(450); }
      break;
    }
    case 'yield': { const v = vis(e.unit); if (v) { v.yielded = true; pop(e.unit, 'Yields', '#ffe9b8'); await tween(v, 'slide', -30, 500, easeInOut); await tween(v, 'alpha', 0, 300); v.gone = true; if (selTarget === e.unit) selTarget = null; layout(); } break; }
    case 'flee': {
      if (e.party) { for (const v of Object.values(V.u)) if (v.side === 'party') tween(v, 'slide', 90, 500, easeInOut); sfx('battle-swoosh'); await wait(550); break; }
      const v = vis(e.unit); if (v) { v.fled = true; tween(v, 'slide', -140, 600, easeInOut); await wait(620); v.gone = true; layout(); }
      break;
    }
    case 'drop': case 'steal': {
      const who = e.type === 'steal' ? (e.target || e.unit) : e.unit;
      if (e.item) { pop(who, '+' + (ITEMS[e.item]?.name || e.item), '#ffd060', 6.5); sfx('pickup'); }
      else pop(who, 'Nothing', '#cccccc', 6.5);
      await wait(450); break;
    }
    case 'scan': pop(e.target, 'Scanned', TEAL, 6.5); sfx('ain-cast'); await wait(450); break;
    case 'guest': {
      const u = unitOf(e.unit); if (!u) break;
      await loadImg(u.sprite);
      const v = newVis(u); V.u[u.name] = v; layout();
      sfx('war-cry'); flashScreen('#ffd890', 250);
      await wait(700); break;
    }
    case 'fizzle': pop(e.unit, 'Fizzle', '#cccccc'); await wait(350); break;
    case 'end': break;
    default: await wait(80);
  }
}

function setHp(name, hp) {
  const v = vis(name); if (!v) return;
  v.hp = hp;
  if (v.side === 'party') {
    const p = A.S.party.find((p) => p.id === v.id);
    if (p) { p.hp = Math.max(0, hp); }
    V.partyDirty = true;
  }
}

async function playAction(e) {
  const a = vis(e.actor); const au = unitOf(e.actor);
  const act = e.action || {};
  if (!a || !au) { logEvent(e); return; }
  if (act.kind === 'defend') {
    logEvent(e); sfx('clang');
    a.statuses.push('guard'); pop(e.actor, 'Guard', '#9cc8ff');
    await wait(280); return;
  }
  const targets = e.targets || [];
  const tvis = targets.map((r) => vis(r.unit)).filter(Boolean);
  const hostile = targets.some((r) => r.damage != null || r.miss || (r.statusesAdded?.length && unitOf(r.unit)?.side !== au.side));
  const onFoes = targets.some((r) => unitOf(r.unit)?.side !== au.side);
  const sk = act.kind === 'skill' ? SKILLS[act.id] : act.kind === 'move' ? MOVES[act.id] : null;
  const type = act.kind === 'item' ? (ITEMS[act.id]?.effect?.damage?.type || (ITEMS[act.id]?.effect?.move ? 'fire' : null))
    : sk ? (sk.type === 'weapon' || !sk.type ? (au.side === 'party' ? (au.weapon?.type || 'slash') : au.attackType) : sk.type) : (au.side === 'party' ? (au.weapon?.type || (au.id === 'ain' ? 'shock' : 'slash')) : au.attackType);
  const crit = targets.some((r) => r.crit || r.hits?.some((h) => h.crit));
  const ranged = au.id === 'ain' || (au.side === 'party' && !!au.weapon?.flyers) || act.kind === 'item' || ['shock', 'fire', 'wonder'].includes(type) || (sk && sk.mult == null && !onFoes);
  logEvent(e);
  if (V.telegraphUnits.has(e.actor) && act.kind === 'move' && MOVES[act.id]?.telegraph) { V.telegraphUnits.delete(e.actor); V.telegraph = V.telegraphUnits.size > 0; }
  // support (heals, buffs on own side): cast glow, numbers on targets
  if (!onFoes) {
    a.cast = 1; a.castCol = au.id === 'ain' ? TEAL : '#ffd890'; tween(a, 'cast', 0, 600);
    if (act.kind === 'item') sfx('potion');
    else if (au.id === 'ain') sfx('ain-cast');
    else if (act.id === 'croms_roar' || act.id === 'lions_song' || act.id === 'rally') sfx('war-cry');
    else if (targets.some((r) => r.heal)) sfx('heal');
    else sfx('clang');
    await wait(220);
    applyResults(e, au);
    await wait(420);
    return;
  }
  // attack: step forward with the attack frames, impact, step back
  const animId = au.side === 'party' ? { kord: 'kord-attack', toktai: 'toktai-shoot', valka: 'valka-lunge' }[au.id] : null;
  const big = ['boss', 'mini'].includes(au.role);
  a.stepLen = ranged ? 5 : au.side === 'party' ? 16 : 18;
  if (animId && animData?.[animId]) a.anim = { id: animId, t0: now() };
  if (au.id === 'ain' || (ranged && au.side === 'enemy')) { a.cast = 1; a.castCol = type === 'fire' ? '#ff8a30' : TEAL; tween(a, 'cast', 0, 500); }
  await tween(a, 'step', 1, 150, easeOut);
  const snd = act.kind === 'item' ? (type === 'fire' ? 'fire' : 'arrow') : attackSfx(au, act.kind, type, false);
  // projectile for bows, spells and thrown items
  if (ranged && tvis.length) {
    const c = centre(a);
    const kind = (au.id === 'toktai' || act.id === 'throwing_knives') && type === 'pierce' ? 'arrow' : 'orb';
    const col = type === 'fire' ? '#ff8a30' : type === 'shock' ? (au.id === 'ain' || au.tags?.includes('machine') ? TEAL : '#a8d8ff') : type === 'wonder' ? '#c070ff' : '#e8dcc0';
    sfx(snd);
    for (const tv of tvis) { const tc = centre(tv); V.proj.push({ kind, col, x0: c.x, y0: c.y - 4, x1: tc.x, y1: tc.y, t0: now(), d: 200 * spd(), arc: kind === 'arrow' ? 8 : 4 }); }
    await wait(200);
  } else { await wait(40); sfx(snd); }
  if (crit) sfx('heavy-hit');
  applyResults(e, au);
  if (crit || (big && au.side === 'enemy' && targets.some((r) => r.damage > 0))) shake(crit ? 4 : 3, 420);
  await wait(260);
  await tween(a, 'step', 0, 170, easeInOut);
  a.anim = null;
  await wait(120);
}

function applyResults(e, au) {
  let missed = false;
  for (const r of e.targets || []) {
    const v = vis(r.unit); if (!v) continue;
    const tu = unitOf(r.unit);
    const tag = r.weak ? 'WEAK!' : r.resist ? 'RESIST' : null;
    const tagColor = r.weak ? '#ffb040' : '#b8b8b8';
    if (r.miss && !r.damage) { pop(r.unit, 'MISS', '#d8d8d8', 8); missed = true; }
    else if (r.immune && !r.damage) pop(r.unit, 'IMMUNE', '#b8b8b8', 7);
    else if (r.damage != null && r.damage > 0) {
      v.flashT = now() + 70; v.shakeT = now() + 240;
      const hits = (r.hits || []).filter((h) => h.damage != null || h.miss);
      if (hits.length > 1) {
        hits.forEach((h, i) => setTimeout(() => {
          if (!V) return;
          if (h.miss) pop(r.unit, 'MISS', '#d8d8d8', 7);
          else { addNum(r.unit, String(h.damage), h.crit ? '#ffd040' : '#ffffff', { size: h.crit ? 13 : 9, crit: h.crit, tag: i === 0 ? tag : null, tagColor }); v.flashT = now() + 70; }
        }, i * 140 * spd()));
      } else addNum(r.unit, String(r.damage), r.crit ? '#ffd040' : '#ffffff', { size: r.crit ? 13 : 9, crit: r.crit, tag, tagColor, dur: r.crit ? 1150 : 950 });
      const c = centre(v); burst(c.x, c.y, tu?.side === 'party' ? '#ff6040' : '#ffe0a0', 6, 0.9);
    }
    if (r.heal) { addNum(r.unit, '+' + r.heal, '#70e070'); v.cast = 1; v.castCol = '#70e070'; tween(v, 'cast', 0, 500); }
    if (r.mp) addNum(r.unit, '+' + r.mp + ' MP', '#70a8ff', { size: 7 });
    if (r.revived) { v.alive = true; pop(r.unit, 'Revived', '#70e070'); }
    if (r.drained && au) addNum(au.name, '+' + r.drained, '#70e070', { size: 7 });
    if (r.statusesAdded?.length) {
      for (const s of r.statusesAdded) if (!v.statuses.includes(s)) v.statuses.push(s);
      const labels = r.statusesAdded.filter((s) => s !== 'guard').map((s) => Battle.STATUS_INFO[s]?.label || s);
      if (labels.length) setTimeout(() => V && pop(r.unit, labels.join(' '), '#ffe070', 6.5), 260 * spd());
    }
    if (r.statusesRemoved?.length) v.statuses = v.statuses.filter((s) => !r.statusesRemoved.includes(s));
    if (r.unaffected?.length) setTimeout(() => V && pop(r.unit, 'unaffected', '#cccccc', 6.5), 300 * spd());
    if (r.hp != null) setHp(r.unit, r.hp);
  }
  if (missed) sfx('miss');
}

// bring the visuals in line with the engine state after a batch of events
function sync() {
  if (!B) return;
  for (const u of [...B.party, ...B.enemies]) {
    let v = vis(u.name);
    if (!v) { if (!u.alive || u.fled) continue; v = V.u[u.name] = newVis(u); loadImg(u.sprite); }
    v.hp = u.hp; v.maxHp = u.maxHp; v.mp = u.mp; v.maxMp = u.maxMp;
    v.statuses = u.statuses.map((s) => s.id);
    if (u.side === 'party') v.alive = u.alive;
    else if (!u.alive && !v.gone && !v.dissolve) { v.gone = true; }
    if (u.sprite && u.sprite !== v.sprite && !v.dissolve) { v.sprite = u.sprite; loadImg(u.sprite); }
  }
  V.eyeOpen = !!B.flags?.eyeOpen;
  V.telegraph = !!B.telegraph || B.enemies.some((u) => u.alive && u.pending);
  V.telegraphUnits = new Set(B.enemies.filter((u) => u.alive && (u.pending || (u.plan && u.plan.telegraphed && !u.plan.done))).map((u) => u.name));
  if (!V.telegraphUnits.size) V.telegraph = !!B.telegraph;
  const root = B.enemies.find((u) => u.phaseIdx != null && ENEMIES[u.id]?.phases && !u.partOf);
  if (root) V.phase = root.phaseIdx + 1;
  for (const u of B.party) { const p = A.S.party.find((p) => p.id === u.id); if (p) { p.hp = u.hp; p.mp = u.mp; } }
  layout();
  A.setState(Battle.battleView(B));
  A.UI.renderTop();
  if (A.UI.getLayout() === 'desktop') A.UI.renderPanel();
  renderStrip();
}

// ================================================================ victory / defeat
function waitContinue(autoMs) {
  return new Promise((res) => {
    continueResolve = res;
    A.UI.setTray({ numbered: true, chips: [], cls: 'battle-cont', buttons: [{ label: 'Continue', text: 'Continue', cls: 'continue', onClick: () => doContinue() }] });
    if (autoMs != null) setTimeout(() => { if (continueResolve === res) doContinue(); }, autoMs);
  });
}
function doContinue() { const r = continueResolve; if (!r) return; continueResolve = null; r(); }

function countUp(elm, from, to, ms) {
  const t0 = now();
  const step = () => { const p = Math.min(1, (now() - t0) / ms); elm.textContent = Math.round(from + (to - from) * easeOut(p)); if (p < 1) requestAnimationFrame(step); };
  if (document.hidden) { elm.textContent = to; return; }
  requestAnimationFrame(step);
  setTimeout(() => { elm.textContent = to; }, ms + 50);
}

function card(cls, html) {
  const d = document.createElement('div');
  d.className = 'ln bt-card ' + cls;
  d.innerHTML = html;
  A.UI.logNode(d);
  return d;
}

async function victory(sum) {
  V.victory = true;
  A.Audio.playMusic(null);
  sfx('victory');
  V.banner = { text: B.encounter.endsWhen === 'anyBelowPct' && B.result === 'lost' ? 'Well fought' : 'Victory', t0: now(), color: '#ffd060' };
  const loot = (sum.loot || []).map((l) => `<li>${A.UI.iconImg(l.item).outerHTML}<span>${escapeHtml(ITEMS[l.item]?.name || l.item)}${l.n > 1 ? ' ×' + l.n : ''}</span></li>`).join('');
  const c = card('bt-victory', `<h3>${V.banner.text}</h3>
    <div class="bt-rows"><span>XP</span><b class="cnt" data-to="${sum.xp}">0</b>${sum.gold ? `<span>Silver</span><b class="cnt gold" data-to="${sum.gold}">0</b>` : ''}</div>
    ${loot ? `<ul class="bt-loot">${loot}</ul>` : ''}`);
  c.querySelectorAll('.cnt').forEach((e) => countUp(e, 0, +e.dataset.to, 900));
  if (sum.gold) setTimeout(() => sfx('coins'), 500);
  A.UI.renderTop();
  if (sum.levelAfter > sum.levelBefore) {
    await wait(1100);
    sfx('level-up');
    V.banner = { text: `Level ${sum.levelAfter}!`, t0: now(), color: '#ffe9a0' };
    const rows = sum.members.filter((m) => !m.frozen).map((m) => {
      const st = ['hp', 'mp', 'atk', 'def', 'agi', 'wil'].filter((k) => m.after[k] !== m.before[k] || k === 'hp')
        .map((k) => `<span class="st"><i>${k.toUpperCase()}</i> ${m.before[k]} → <b class="cnt" data-from="${m.before[k]}" data-to="${m.after[k]}">${m.before[k]}</b></span>`).join('');
      const sk = m.skills.length ? `<div class="bt-new">New skill: ${m.skills.map(escapeHtml).join(', ')}</div>` : '';
      return `<div class="bt-lv"><b class="who">${escapeHtml(m.name)}</b><div class="sts">${st}</div>${sk}</div>`;
    }).join('');
    const lc = card('bt-levelup', `<h3>Level up! Party level ${sum.levelAfter}</h3>${rows}<p class="muted small">Wounds close; breath returns.</p>`);
    lc.querySelectorAll('.cnt').forEach((e) => countUp(e, +e.dataset.from, +e.dataset.to, 1000));
    A.UI.renderTop();
    if (A.UI.getLayout() === 'desktop') A.UI.renderPanel();
  }
  await wait(500);
  await waitContinue(auto ? 2200 : null);
}

// ================================================================ lifecycle
export async function prepare(id, enc, api) {
  A = api;
  if (!animData) {
    try { const r = await fetch('assets/manifest.json', { cache: 'no-cache' }); animData = r.ok ? ((await r.json()).anims || {}) : {}; } catch (e) { animData = {}; }
  }
  const S = api.S;
  const known = ENEMIES && api.DB.encounters?.[id];
  const bestiary = {};
  for (const [k, v] of Object.entries(S.bestiary || {})) if (v && (v.weak || v.resist || v.immune)) bestiary[k] = { weak: [...(v.weak || [])], resist: [...(v.resist || [])], immune: [...(v.immune || [])], full: !!v.full };
  B = Battle.createBattle({
    encounterId: id, encounter: known ? undefined : enc,
    party: S.party.map((p) => ({ id: p.id, hp: p.hp, mp: p.mp, equip: { ...p.equip }, frozen: !!p.frozen, statuses: (p.statuses || []).filter((s) => s && s.id) })),
    level: api.level, items: { ...S.items }, flags: api.flags, chapter: S.chapter || enc.chapter || 1,
    difficulty: api.difficulty, attempt: api.attempt || 1, bestiary,
  });
  auto = !!api.auto; ended = false;
  busy = false; inputResolve = null; pendingChoices = null; continueResolve = null; selTarget = null;
  if (B.encounter.firstTarget) selTarget = B.enemies.find((u) => u.id === B.encounter.firstTarget)?.name || null;   // the tutorial's Gorm
  V = { u: {}, nums: [], parts: [], proj: [], bg: null, shakeUntil: 0, shakeAmp: 0, flashUntil: 0, telegraph: false, telegraphUnits: new Set(),
    eyeOpen: false, phase: 1, round: 0, banner: null, victory: false, picking: null };
  const ids = new Set([B.encounter.bg || api.DB.rooms?.[S.room]?.bg]);
  for (const u of [...B.party, ...B.enemies]) ids.add(u.sprite);
  for (const ph of B.enemies.flatMap((u) => ENEMIES[u.id]?.phases || [])) ids.add(ph.sprite);
  if (B.encounter.guest) ids.add(MEMBERS[B.encounter.guest.id]?.sprite);
  for (const p of B.encounter.onPlayerSkill || []) for (const ef of p.effects || []) if (ef.guest) ids.add(MEMBERS[ef.guest]?.sprite);
  for (const a of Object.values(animData)) for (const f of a.frameIds || []) ids.add(f);
  await Promise.race([Promise.all([...ids].filter(Boolean).map(loadImg)), new Promise((r) => setTimeout(r, 2500))]);
  V.bg = buildBg(B.encounter.bg || api.DB.rooms?.[S.room]?.bg);
  for (const u of [...B.party, ...B.enemies]) V.u[u.name] = newVis(u);
  for (const u of B.party.filter((u) => u.guest)) V.u[u.name].x = null;
  layout();
  for (const v of Object.values(V.u)) if (v.guest) { v.x = v.tx; }
  sync();
  api.Scene.setBattle(renderer);
  buildStrip();
  trayBusy();
}

export async function runBattle(id, enc, api) {
  if (!B || A !== api) await prepare(id, enc, api);
  const my = ++runId;
  hooks.battleCommand = typed;
  const R = api.R;
  const busyOn = () => { if (!busy) { busy = true; R.busyCount = (R.busyCount || 0) + 1; } };
  const busyOff = () => { if (busy) { busy = false; R.busyCount = Math.max(0, (R.busyCount || 1) - 1); } };
  try {
    busyOn();
    await playEvents(B.lastEvents || []);
    busyOff();
    let guard = 0;
    while (!B.over && my === runId && guard++ < 5000) {
      let r;
      if (auto) {
        renderStrip();
        await wait(160);
        if (!auto || my !== runId) continue;
        if (A.UI.modalOpen()) { await new Promise((res) => setTimeout(res, 250)); continue; }
        r = Battle.command(B, Battle.autoCommand(B, B.awaiting));
        if (r.error) r = Battle.command(B, { act: 'defend' });
      } else {
        renderTray();
        r = await new Promise((res) => { inputResolve = res; });
        inputResolve = null;
        if (r === 'auto' || r === 'abort') continue;
      }
      if (!r || r.error || !r.state) continue;
      B = r.state;
      api.setState(Battle.battleView(B));
      busyOn(); trayBusy();
      await playEvents(r.events || []);
      busyOff();
    }
    if (my !== runId) return { result: 'lost', aborted: true, settled: true };
    // the end
    busyOn();
    const res = B.result;
    const sum = api.settle(B, Battle);
    V.telegraph = false;
    if (res === 'won' || (res === 'lost' && B.encounter.paysOnLose && (sum.xp || sum.gold))) {
      busyOff();
      await victory(sum);
      busyOn();
    } else if (res === 'fled') {
      await wait(500);
    } else {
      sfx('ally-fall');
      V.banner = Array.isArray(B.encounter.onLose) ? null : { text: 'Fallen', t0: now(), color: '#ff6a50' };
      await wait(1300);
    }
    busyOff();
    return { result: res, settled: true, loot: sum.loot, summary: sum, party: Battle.partyAfter(B) };
  } finally {
    busyOff();
    if (my !== runId) return;   // aborted: a newer battle may own the screen now
    hooks.battleCommand = null;
    removeStrip();
    A.UI.closeAllModals();
    A.UI.setTray({ buttons: [], chips: [] });
    ended = true;   // B stays for the mosaic out; the next prepare() replaces it
  }
}
