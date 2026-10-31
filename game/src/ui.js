// ui.js: everything DOM. Layout (visualViewport, phone budgets), story log
// with typewriter and keyword links, Things-here chips, action tray,
// targeting banner, tabs and panels (Party / Items / Journal / Map), toasts,
// modals and sheets, first-time tips, the title / chapter / game-over screens.
// Game logic is reached through the ACT callbacks main.js binds.

import { DB, S, R, SETTINGS, saveSettings, partyLevel, gearStats, levelFromXp, cumulativeXp, xpToNext } from './state.js';
import * as Inv from './inventory.js';
import * as Scene from './scene.js';
import * as Audio from './audio.js';
import { text as resolveText, check } from './conditions.js';

const ICONS = {
  bag: '<path d="M5 9h14l-1.2 11H6.2z"/><path d="M9 9V7a3 3 0 0 1 6 0v2"/>',
  sound: '<path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z"/><path d="M15.5 9.5a3.5 3.5 0 0 1 0 5"/><path d="M18 7a7 7 0 0 1 0 10"/>',
  muted: '<path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z"/><path d="M15.5 9.5l5 5M20.5 9.5l-5 5"/>'
};
export function icon(k) { const t = document.createElement('template'); t.innerHTML = `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${ICONS[k]}</svg>`; return t.content.firstChild; }
export const ACT = {};          // bound by main.js
const $ = (sel, root = document) => root.querySelector(sel);
export function el(tag, attrs = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat(Infinity)) if (kid != null && kid !== false) e.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  return e;
}
export function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V'];
export function roman(n) { return ROMAN[n] || String(n); }

// ---------------------------------------------------------------- layout
let layoutMode = '';
export function getLayout() { return layoutMode; }

const fullH = { w: 0, h: 0 };
export function layout() {
  const vv = window.visualViewport;
  const W = Math.round(vv ? vv.width : innerWidth), H = Math.round(vv ? vv.height : innerHeight);
  const app = $('#app');
  const mode = (H < 500 && W > H) ? 'landscape' : (W >= 900 && H >= 540) ? 'desktop' : 'portrait';
  if (mode !== layoutMode) {
    document.body.classList.remove('layout-desktop', 'layout-portrait', 'layout-landscape');
    document.body.classList.add('layout-' + mode);
    layoutMode = mode;
  }
  document.documentElement.style.setProperty('--app-h', H + 'px');
  document.documentElement.style.setProperty('--app-w', W + 'px');
  const busy = R.mode === 'dialogue' || R.mode === 'scene' || R.inBattle || R.mode === 'which';
  document.body.classList.toggle('busy-mode', busy);
  document.body.classList.toggle('in-battle', !!R.inBattle);
  // Android's Back hides the keyboard without blurring the input: also ask
  // whether the visible area is really shorter than the tallest seen at this width
  const vw = Math.round(innerWidth);
  if (vv) { if (fullH.w !== vw) { fullH.w = vw; fullH.h = 0; } fullH.h = Math.max(fullH.h, vv.height); }
  const shrunk = !vv || vv.height < fullH.h * 0.8;
  const kb = shrunk && document.body.classList.contains('kb-open') && document.activeElement === $('#cmd') && mode !== 'desktop' && matchMedia('(pointer: coarse)').matches;   // only an on-screen keyboard needs the picture's room
  document.body.classList.toggle('kb-up', kb);
  const cs = getComputedStyle($('#scr-game'));   // its padding is env(safe-area-inset-*)
  const safeT = parseFloat(cs.paddingTop) || 0, safeB = parseFloat(cs.paddingBottom) || 0;
  const safeL = parseFloat(cs.paddingLeft) || 0, safeR = parseFloat(cs.paddingRight) || 0;
  let picW = 320, picH = 180;
  const tray = $('#tray');
  // numbered replies (dialogue, "Which…?") may take up to ~58% of the story +
  // tray area, so a six-reply menu is not a two-line strip; the story keeps the rest
  const replies = !!traySpec.numbered && !R.inBattle && (traySpec.buttons || []).length > 1;
  if (mode === 'portrait') {
    const innerW = W - safeL - safeR;
    const banner = $('#banner').hidden ? 0 : $('#banner').offsetHeight;
    const cmd = $('#cmdform').offsetHeight;
    const tabs = R.inBattle ? 0 : 52;
    const area = H - safeT - safeB - 36 - (kb ? 0 : 180) - banner - cmd - tabs;
    const cap = replies ? Math.max(112, Math.floor(area * 0.58)) : busy ? 112 : 140;
    tray.style.maxHeight = cap + 'px';
    const trayH = Math.min(cap, tray.scrollHeight);
    const party = busy || kb ? 0 : 32;
    const full = Math.max(180, Math.floor(innerW * 9 / 16));
    picW = innerW >= 320 ? innerW : 320; picH = Math.max(180, Math.round(picW * 9 / 16));
    const story = H - safeT - safeB - 36 - picH - party - trayH - banner - cmd - tabs;
    if (busy || story < 178 || full === 180) { picW = 320; picH = 180; }
    if (kb) { picH = 0; }
    document.documentElement.style.setProperty('--party-h', party + 'px');
  } else if (mode === 'landscape') {
    const base = H >= 330 && !R.inBattle ? 140 : 112;   // room for two rows of exits under the chips
    tray.style.maxHeight = (replies ? Math.max(base, Math.floor((H - safeT - safeB - 36) * 0.58)) : base) + 'px';
    picW = 320; picH = 180;
  } else {
    const panelW = Math.max(340, Math.min(440, Math.round(W * 0.31)));
    const colW = W - panelW - 32;
    // whole-number scale: 2× (640×360) when the window is tall enough to keep
    // a readable story + tray under it (≥ ~760 px), else 1×
    const fixed = safeT + safeB + 44 + 34 + 20 + 46;   // top bar, party strip, picture padding, command line
    const room = H - fixed - 250;                      // keep ≥ 250 px for story + tray
    const k = Math.max(1, Math.min(Math.floor(colW / 320), Math.floor(room / 180), 3));
    picW = 320 * k; picH = 180 * k;
    tray.style.maxHeight = Math.max(112, Math.min(220, H - fixed - picH - 130)) + 'px';
    document.documentElement.style.setProperty('--panel-w', panelW + 'px');
    document.documentElement.style.setProperty('--party-h', '32px');
  }
  document.documentElement.style.setProperty('--pic-h', picH + 'px');
  document.documentElement.style.setProperty('--pic-w', picW + 'px');
  if (picH > 0) Scene.resize(picW, picH);
  keepLogBottom();
  trayMore();
}

// "more below" fade on the tray while it still scrolls
export function trayMore() {
  const tray = $('#tray'); if (!tray) return;
  requestAnimationFrame(() => tray.classList.toggle('more', tray.scrollHeight - tray.scrollTop - tray.clientHeight > 6));
}

// ---------------------------------------------------------------- story log
const SPEEDS = { slow: 35, normal: 65, fast: 140, instant: Infinity };
const queue = [];
let typing = null;      // {nodes, idx, pos, links, done, resolve}
let logEl = null;

// a portrait or icon file that fails to load falls back to code art
document.addEventListener('error', (e) => {
  const t = e.target;
  if (t && t.tagName === 'IMG' && !t.dataset.fallback && (t.classList.contains('portrait') || t.classList.contains('pm-face') || t.classList.contains('how-i'))) {
    t.dataset.fallback = '1'; t.src = Scene.portraitURL('', t.alt || '?', false, true);
  }
}, true);

export function initLog() {
  logEl = $('#log');
  $('#tray').addEventListener('scroll', trayMore, { passive: true });
  $('#story').addEventListener('click', ev => {
    const a = ev.target.closest('.kw');
    if (a) { ev.stopPropagation(); if (typing) skip(); ACT.keyword?.(a.dataset.id, a); return; }
    if (typing || queue.length) { skip(); return; }
    ACT.storyTap?.();
  });
}

export function isTyping() { return !!typing || queue.length > 0; }

export function markup(t, nameOf) {
  let s = esc(t);
  s = s.replace(/\[\[([\w.-]+)(?:\|([^\]]+))?\]\]/g, (m, id, shown) => `<a class="kw" data-id="${id}" role="button" tabindex="-1">${shown ? shown : esc(nameOf ? nameOf(id) : id)}</a>`);
  s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  return s;
}

// drop: leave the waiting promises unresolved, so whatever was queued behind a
// line of the old game (load, quit to title) never runs
export function clearLog(drop) {
  if (logEl) logEl.innerHTML = '';
  const pending = queue.splice(0);
  const tp = typing; typing = null; R.typing = false;
  if (drop) return;
  pending.forEach(q => q.resolve());
  tp?.resolve();
}

export function logHeading(title) {
  const h = el('div', { class: 'ln ln-head' }, title);
  logEl.append(h); trimLog(); keepLogBottom();
}

// entry: {speaker, text, cls, nameOf, instant}
export function log(entry) {
  return new Promise(resolve => {
    const node = buildLine(entry);
    queue.push({ node, entry, resolve });
    pump();
  });
}

const capFirst = (s) => String(s || '').replace(/^./, c => c.toUpperCase());   // "the Lady in Grey" → "The Lady in Grey" at the start of a label

function buildLine(entry) {
  const sp = entry.speaker && entry.speaker !== 'narrator' ? entry.speaker : null;
  const html = String(entry.text || '').split(/\n\n+/).map(p => `<p>${markup(p, entry.nameOf || ACT.nameOf)}</p>`).join('');
  if (!sp) return el('div', { class: 'ln ln-narr ' + (entry.cls || ''), html });
  const info = ACT.speakerInfo ? ACT.speakerInfo(sp) : { name: sp, portrait: null };
  const img = el('img', { class: 'portrait', alt: '', src: Scene.portraitURL(info.portrait || 'portrait/' + sp, info.name, sp === 'ain' || info.machine), draggable: 'false' });
  return el('div', { class: `ln ln-say sp-${sp} ${entry.cls || ''}` }, img,
    el('div', { class: 'say' }, el('span', { class: 'who' }, capFirst(info.name)), el('div', { class: 'txt', html })));
}

function pump() {
  if (typing || !queue.length) return;
  const { node, entry, resolve } = queue.shift();
  logEl.append(node); trimLog();
  const speed = entry.instant ? Infinity : SPEEDS[SETTINGS.textSpeed] ?? SPEEDS.fast;
  if (entry.speaker === 'ain') Audio.sfx('ain');
  if (speed === Infinity) { node.querySelectorAll('.kw').forEach(a => a.classList.add('kw-in')); keepLogBottom(); resolve(); pump(); return; }
  const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) { const n = walker.currentNode; if (n.parentElement.closest('.who')) continue; nodes.push({ n, full: n.nodeValue }); n.nodeValue = ''; }
  node.querySelectorAll('.kw').forEach(a => a.classList.add('kw-hidden'));
  typing = { nodes, idx: 0, pos: 0, resolve, speed, acc: 0, last: performance.now(), node };
  R.typing = true;
  requestAnimationFrame(typeStep);
}

function typeStep(now) {
  if (!typing) return;
  const tp = typing;
  const dt = Math.min(100, now - tp.last); tp.last = now;
  tp.acc += dt * tp.speed / 1000;
  let n = Math.floor(tp.acc); tp.acc -= n;
  let ticks = 0;
  while (n-- > 0 && tp.idx < tp.nodes.length) {
    const cur = tp.nodes[tp.idx];
    tp.pos++;
    cur.n.nodeValue = cur.full.slice(0, tp.pos);
    const a = cur.n.parentElement.closest('.kw'); if (a && a.classList.contains('kw-hidden')) { a.classList.remove('kw-hidden'); a.classList.add('kw-in'); }
    if (tp.pos >= cur.full.length) { tp.idx++; tp.pos = 0; }
    ticks++;
  }
  if (ticks) { Audio.tick(); keepLogBottom(); }
  if (tp.idx >= tp.nodes.length) { finishTyping(); return; }
  requestAnimationFrame(typeStep);
}

function finishTyping() {
  const tp = typing; if (!tp) return;
  for (const x of tp.nodes) x.n.nodeValue = x.full;
  tp.node.querySelectorAll('.kw').forEach(a => { a.classList.remove('kw-hidden'); a.classList.add('kw-in'); });
  typing = null; R.typing = false;
  keepLogBottom();
  tp.resolve();
  pump();
  if (!typing && !queue.length) ACT.typingDone?.();
}

export function skip() {
  let guard = 0;
  while ((typing || queue.length) && guard++ < 200) {
    if (!typing) pumpInstant();
    else finishTypingInstantAll();
  }
}
function finishTypingInstantAll() { finishTyping(); }
function pumpInstant() {
  const q = queue.shift(); if (!q) return;
  logEl.append(q.node); q.node.querySelectorAll('.kw').forEach(a => a.classList.add('kw-in'));
  q.resolve(); trimLog(); keepLogBottom();
}

// a ready-made node (battle victory / level-up cards) after any queued lines
export function logNode(node) {
  skip();
  logEl.append(node); trimLog(); keepLogBottom();
  return node;
}

function trimLog() { while (logEl.children.length > 160) logEl.firstElementChild.remove(); }
export function keepLogBottom() { const s = $('#story'); if (s) s.scrollTop = s.scrollHeight; }

// ---------------------------------------------------------------- top bar, party strip
// Shrink a long room name to fit the top bar before falling back to "…".
export function fitRoomName(e = $("#tb-room")) {
  e.style.fontSize = ''; e.style.visibility = ''; e.classList.remove('two');
  const room = DB.rooms[S.room]; if (room) e.textContent = room.name;
  let px = parseFloat(getComputedStyle(e).fontSize);
  while (e.scrollWidth > e.clientWidth + 1 && px > 13) { px -= 1; e.style.fontSize = px + 'px'; }
  // Still too long (the busy bar on a phone): two short lines rather than "Gallows B…".
  if (e.scrollWidth > e.clientWidth + 1) { e.classList.add('two'); e.style.fontSize = '12px'; e.textContent = e.textContent.replace(/^The /, ''); }
  if (e.classList.contains('two') && e.scrollWidth > e.clientWidth + 1) e.style.fontSize = '11px';
  // Hopeless even so (a word that won't fit, or more than two lines): leave it out rather than show a stub.
  if (e.classList.contains('two') && (e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 2)) e.style.visibility = 'hidden';
  e.title = room ? room.name : e.textContent;
}

export function renderTop() {
  const room = DB.rooms[S.room];
  $('#tb-chapter').textContent = roman(S.chapter);
  const tbr = $('#tb-room');
  tbr.textContent = room ? room.name : '';
  $('#tb-gold').textContent = S.gold;
  $('#btn-mute').replaceChildren(icon(SETTINGS.mute ? 'muted' : 'sound'));
  $('#btn-mute').setAttribute('aria-label', SETTINGS.mute ? 'Unmute' : 'Mute');
  const strip = $('#partystrip'), mini = $('#tb-mini');
  strip.innerHTML = ''; mini.innerHTML = '';
  const members = [...S.party];
  for (const p of members) {
    const m = DB.members[p.id] || { name: p.id };
    const st = gearStats(p);
    const hp = Math.max(0, Math.min(1, p.hp / st.hp)), mp = st.mp ? Math.max(0, Math.min(1, p.mp / st.mp)) : 0;
    const card = el('button', { class: 'pm' + (p.frozen ? ' frozen' : ''), 'aria-label': `${m.name} ${p.hp}/${st.hp} HP`, onclick: () => ACT.openPanel?.('party') },
      el('img', { class: 'pm-face', alt: '', src: Scene.portraitURL(m.portrait || 'portrait/' + p.id, m.name, p.id === 'ain') }),
      el('span', { class: 'pm-bars' }, el('span', { class: 'pm-name' }, m.short || m.name.split(' ').pop()),
        el('span', { class: 'bar hp' }, el('i', { style: { width: (hp * 100) + '%' } })),
        el('span', { class: 'bar mp' }, el('i', { style: { width: (mp * 100) + '%' } }))));
    strip.append(card);
    mini.append(el('span', { class: 'mini-pm', title: m.name }, el('span', { class: 'bar hp' }, el('i', { style: { width: (hp * 100) + '%' } })), el('span', { class: 'bar mp' }, el('i', { style: { width: (mp * 100) + '%' } }))));
  }
  strip.append(el('span', { class: 'pm-lv' }, 'Lv ' + partyLevel()));
  fitRoomName(tbr);   // last: the mini bars above take room from it
}

// ---------------------------------------------------------------- tray
// spec: {chips:[{id,label,kind,pulse}], buttons:[{label,onClick,cls,disabled,title,num}], numbered:bool, bag:bool}
let traySpec = { chips: [], buttons: [] };
let lastFirstChip = null;
export let choiceHighlight = 0;
export function setTray(spec) {
  traySpec = spec;
  const chips = $('#chips'), btns = $('#buttons');
  chips.innerHTML = ''; btns.innerHTML = '';
  if (spec.chips && spec.chips.length || spec.bag) {
    chips.hidden = false;
    if (spec.bag) chips.append(el('button', { class: 'chip chip-bag', 'aria-label': 'Bag', title: 'Bag (quick use)', onclick: () => ACT.quickBag?.() }, icon('bag')));
    if (spec.chipsLabel) chips.append(el('span', { class: 'chips-label' }, spec.chipsLabel));
    for (const c of spec.chips || []) {
      chips.append(el('button', { class: 'chip chip-' + (c.kind || 'thing') + (c.pulse ? ' pulse' : '') + (c.fresh ? ' fresh' : ''), 'data-id': c.id, onclick: ev => ACT.chip?.(c.id, ev.currentTarget) }, c.label));
    }
    const first = spec.chips?.[0]?.id || null;   // a new chip at the front: scroll the row back to show it
    if (first !== lastFirstChip) { chips.scrollLeft = 0; lastFirstChip = first; }
  } else chips.hidden = true;
  btns.className = 'buttons' + (spec.cls ? ' ' + spec.cls : '');
  btns.classList.toggle('numbered', !!spec.numbered);
  choiceHighlight = 0;
  (spec.buttons || []).forEach((b, i) => {
    const btn = el('button', { class: 'tbtn ' + (b.cls || ''), disabled: b.disabled, title: b.title, 'data-idx': i, onclick: () => { Audio.sfx('tap'); b.onClick(); } },
      spec.numbered ? el('span', { class: 'num' }, (i + 1) + '') : null, el('span', { class: 'lbl' }, b.label));
    btns.append(btn);
  });
  highlightChoice(0);
  $('#tray').scrollTop = 0;
  layout();
}
export function trayButtons() { return traySpec.buttons || []; }
export function highlightChoice(i) {
  const list = [...document.querySelectorAll('#buttons .tbtn')];
  choiceHighlight = Math.max(0, Math.min(list.length - 1, i));
  list.forEach((b, j) => b.classList.toggle('hl', traySpec.numbered && j === choiceHighlight));
  if (i > 0) list[choiceHighlight]?.scrollIntoView({ block: 'nearest' });
}
export function pressChoice(n) {
  const b = (traySpec.buttons || [])[n];
  if (!b || b.disabled) return false;
  Audio.sfx('tap'); b.onClick(); return true;
}

// ---------------------------------------------------------------- banner (targeting)
export function setBanner(textOrNull) {
  const b = $('#banner');
  if (!textOrNull) { b.hidden = true; layout(); return; }
  b.hidden = false;
  $('#banner-text').innerHTML = textOrNull;
  layout();
}

// ---------------------------------------------------------------- toasts
export function toast(text, kind = 'info', opts = {}) {
  const box = $('#toasts');
  // Several things found at once read as one note ("+ Slaver's writ, Open shackles"), not a pile.
  const last = box.lastElementChild;
  if (!opts.action && (kind === 'item' || kind === 'gold') && last && last.dataset.kind === kind && !last.classList.contains('out') && Date.now() - last.dataset.t < 1500 && !last.querySelector('.toast-act')) {
    const sp = last.firstElementChild;
    sp.textContent += ', ' + (kind === 'item' ? String(text).replace(/^\+\s*/, '') : text);
    return;
  }
  const t = el('div', { class: 'toast toast-' + kind, 'data-kind': kind, 'data-t': Date.now() }, el('span', {}, text));
  if (opts.action) t.append(el('button', { class: 'toast-act', onclick: () => { opts.action.fn(); t.remove(); } }, opts.action.label));
  box.append(t);
  while (box.children.length > (layoutMode === 'desktop' ? 4 : layoutMode === 'landscape' ? 2 : 3)) box.firstElementChild.remove();
  placeNotes();
  setTimeout(() => t.classList.add('out'), opts.ms || (opts.action ? 5200 : 2400));
  setTimeout(() => t.remove(), (opts.ms || (opts.action ? 5200 : 2400)) + 400);
}

// ---------------------------------------------------------------- tips
const TIPS = {
  tap: 'Tap a glowing word to act on it.',
  exit: () => 'Exits are in the tray below the story.' + (matchMedia('(pointer: coarse)').matches ? '' : ' Arrow keys move too.'),
  item: 'New things go in your bag: open Items to look, use or equip them.',
  battle: 'Battle! Each command hits the target named on its button.',
  use: 'Using an item: tap a person, a thing, or a chip. ✕ cancels.',
  shop: 'Tap an item to compare it with what your party wears.',
  equip: 'Items → tap a piece of gear → Equip. Or try Best gear in the Party tab.',
  combine: 'Combine: pick an item, then Combine, then the second item.',
  hint: 'Stuck? The Journal has hints, and the party has opinions.',
};
// UI wording for the pointer in use: "Tap" on touch screens, "Click" with a mouse.
export function tapWords(s) {
  if (matchMedia('(pointer: coarse)').matches) return s;
  return String(s).replace(/\b([Tt])ap(s|ped|ping)?\b/g, (m, t, end) => (t === 'T' ? 'Click' : 'click') + ({ s: 's', ped: 'ed', ping: 'ing' }[end] || ''));
}
export function tip(id) {
  if (!TIPS[id] || SETTINGS.tips[id]) return;
  SETTINGS.tips[id] = true; saveSettings();
  const box = $('#tips');
  const t = el('div', { class: 'tip', role: 'status' }, el('span', { class: 'tip-i' }, '?'), el('span', {}, tapWords(typeof TIPS[id] === 'function' ? TIPS[id]() : TIPS[id])),
    el('button', { class: 'tip-x', 'aria-label': 'Dismiss', onclick: () => { t.remove(); placeNotes(); } }, '✕'));
  box.innerHTML = ''; box.append(t);
  box.classList.toggle('in-modal', modals.length > 0);   // a tip about a modal (the shop's) shows over it; others wait hidden until it closes
  box.classList.toggle('below', id === 'battle');   // on phones the battle tip sits under the battlefield, not on it (any tip does while in battle: style.css)
  setTimeout(() => t.classList.add('out'), 7000);
  setTimeout(() => { t.remove(); placeNotes(); }, 7600);
  placeNotes();
}

// Toasts stack under a showing tip instead of on top of it.
function placeNotes() {
  const box = $('#toasts'); box.style.top = '';
  const tipEl = $('#tips .tip');
  if (!tipEl || !tipEl.offsetParent) return;
  const tb = tipEl.getBoundingClientRect(), top = box.getBoundingClientRect().top;
  if (top < tb.bottom + 6 && top + 4 > tb.top - box.offsetHeight - 40) box.style.top = (tb.bottom + 6) + 'px';
}

// ---------------------------------------------------------------- modals and sheets
const modals = [];
export function openModal({ title, body, buttons = [], cls = '', onClose, closable = true, sheet = false }) {
  const root = $('#overlay');
  const close = (silent) => {
    const i = modals.indexOf(rec); if (i < 0) return;
    modals.splice(i, 1); wrap.remove();
    root.hidden = modals.length === 0;
    R.menuOpen = modals.length > 0;
    if (!silent) Audio.sfx('back');
    onClose?.();
  };
  const head = el('div', { class: 'm-head' }, el('h2', {}, title || ''),
    closable ? el('button', { class: 'm-x', 'aria-label': 'Close', onclick: () => close() }, '✕') : null);
  const bodyEl = el('div', { class: 'm-body' });
  if (typeof body === 'function') body(bodyEl, close); else if (body) bodyEl.append(body);
  const foot = buttons.length ? el('div', { class: 'm-foot' }, buttons.map(b => el('button', { class: 'btn ' + (b.cls || ''), disabled: b.disabled, onclick: () => { Audio.sfx('tap'); b.onClick(close); } }, b.label))) : null;
  const box = el('div', { class: 'modal ' + cls + (sheet ? ' sheet' : ''), role: 'dialog', 'aria-label': title || '' }, head, bodyEl, foot);
  const wrap = el('div', { class: 'm-wrap' + (sheet ? ' m-sheet' : ''), onclick: ev => { if (ev.target === wrap && closable) close(); } }, box);
  root.append(wrap); root.hidden = false;
  const rec = { close, closable, wrap };
  modals.push(rec);
  R.menuOpen = true;
  return { close, body: bodyEl, box };
}
export function closeTopModal() {
  const m = modals[modals.length - 1];
  if (m && m.closable) { m.close(); return true; }
  return !!m;
}
export function closeAllModals() { while (modals.length) modals[modals.length - 1].close(true); }
export function modalOpen() { return modals.length > 0; }

export function confirm(title, msg, yes = 'Yes', no = 'No') {
  return new Promise(res => {
    openModal({ title, body: el('p', {}, msg), cls: 'small', onClose: () => res(false),
      buttons: [{ label: no, onClick: c => { c(); res(false); } }, { label: yes, cls: 'primary', onClick: c => { res(true); c(true); } }] });
  });
}

// ---------------------------------------------------------------- tabs and panels
export let panelName = 'play';
let itemTab = 'all', itemSort = 'type', selItem = null;

export function setPanel(name) {
  // desktop: the side panel always shows one of party/items/journal/map
  if (layoutMode === 'desktop' && name === 'play') name = panelName === 'play' ? 'party' : panelName;
  panelName = name; R.panel = name;
  document.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === name));
  document.body.classList.toggle('panel-open', name !== 'play');
  renderPanel();
}

export function renderPanel() {
  const body = $('#panel-body'); if (!body) return;
  const name = panelName === 'play' ? (layoutMode === 'desktop' ? 'party' : null) : panelName;
  if (!name) return;
  if (layoutMode === 'desktop') document.querySelectorAll('#panel [data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === name));
  const scroll = body.scrollTop;
  body.innerHTML = '';
  if (name === 'party') renderParty(body);
  else if (name === 'items') renderItems(body);
  else if (name === 'journal') renderJournal(body);
  else if (name === 'map') renderMap(body);
  body.scrollTop = scroll;
}

// ---- party
function statRow(label, v, extra = '') { return el('span', { class: 'st' }, el('b', {}, label), ' ' + v + extra); }
function renderParty(body) {
  body.append(el('div', { class: 'p-head' }, el('span', {}, `Party level ${partyLevel()}`),
    el('span', { class: 'xp' }, xpLine()),
    el('button', { class: 'btn small', onclick: () => ACT.bestGearParty?.() }, 'Best gear: all')));
  for (const p of S.party) {
    const m = DB.members[p.id] || { name: p.id };
    const st = gearStats(p);
    const card = el('div', { class: 'card member' + (p.frozen ? ' frozen' : '') });
    card.append(el('div', { class: 'mc-top' },
      el('img', { class: 'portrait big', alt: '', src: Scene.portraitURL(m.portrait || 'portrait/' + p.id, m.name, p.id === 'ain') }),
      el('div', { class: 'mc-info' }, el('h3', {}, m.name),
        el('div', { class: 'bars' }, bar('HP', p.hp, st.hp, 'hp'), bar('MP', p.mp, st.mp, 'mp')),
        el('div', { class: 'stats' }, statRow('ATK', st.atk + st.power), statRow('DEF', st.def), statRow('AGI', st.agi), statRow('WIL', st.wil), st.crit ? statRow('CRIT', st.crit, '%') : null))));
    const slots = el('div', { class: 'slots' });
    for (const s of (m.slots || Inv.SLOTS)) {
      const id = p.equip[s];
      slots.append(el('button', { class: 'slot' + (id ? '' : ' empty'), onclick: () => slotPicker(p.id, s) },
        el('span', { class: 'slot-n' }, Inv.SLOT_NAMES[s]),
        id ? el('span', { class: 'slot-i' }, iconImg(id), Inv.itemName(id)) : el('span', { class: 'slot-i' }, '—')));
    }
    card.append(slots);
    card.append(el('div', { class: 'mc-foot' }, el('button', { class: 'btn small', onclick: () => ACT.bestGear?.(p.id) }, `Best gear: ${m.name}`)));
    body.append(card);
  }
  if (S.guest) body.append(el('div', { class: 'card' }, el('h3', {}, (DB.members[S.guest.id]?.name || DB.npcs[S.guest.id]?.name || S.guest.id) + ' (guest)')));
}
function xpLine() {
  const L = partyLevel(); if (L >= 20) return 'max level';
  const need = cumulativeXp(L + 1) - S.xp;
  return `${need} XP to Lv ${L + 1}`;
}
function bar(label, v, max, cls) {
  const f = max ? Math.max(0, Math.min(1, v / max)) : 0;
  return el('div', { class: 'lbar ' + cls }, el('span', { class: 'l' }, label), el('span', { class: 'track' }, el('i', { style: { width: f * 100 + '%' } })), el('span', { class: 'v' }, `${v}/${max}`));
}
function slotPicker(mid, slot) {
  const pm = S.party.find(p => p.id === mid);
  const cur = pm.equip[slot];
  const opts = Object.keys(S.items).filter(id => {
    const it = Inv.item(id); if (!it) return false;
    const want = Inv.slotFor(it, slot === 'off');
    return want === slot && Inv.canEquip(mid, id, slot).ok;
  });
  const m = openModal({ title: `${DB.members[mid]?.name}: ${Inv.SLOT_NAMES[slot]}`, sheet: true, body: (b, close) => {
    if (cur) b.append(el('button', { class: 'row', onclick: () => { ACT.unequip?.(mid, slot); close(true); } }, el('span', {}, 'Take off ' + Inv.itemName(cur))));
    if (!opts.length) b.append(el('p', { class: 'muted' }, 'Nothing in the bag fits here.'));
    for (const id of opts) {
      const c = Inv.compare(mid, id);
      b.append(el('button', { class: 'row', onclick: () => { ACT.equip?.(mid, id, slot); close(true); } }, iconImg(id), el('span', { class: 'grow' }, Inv.itemName(id)), deltas(c)));
    }
  } });
  return m;
}

// ---- items
export function iconImg(id) {
  if (Inv.isCompanion(id)) {   // companions are listed with Items so they can be used on things: show their face
    const m = DB.members[id];
    return el('img', { class: 'icon portrait-icon', alt: '', src: Scene.portraitURL(m?.portrait || 'portrait/' + id, m?.name || id, id === 'ain'), draggable: 'false' });
  }
  const it = Inv.item(id);
  const name = it?.icon || (Inv.isCompanion(id) ? 'companion' : it?.kind || 'misc');
  const img = el('img', { class: 'icon', alt: '', src: iconURL(name, id) });
  img.onerror = () => { img.onerror = null; img.src = codeIcon(name); };
  return img;
}

function renderItems(body) {
  const tabs = el('div', { class: 'subtabs' }, Inv.TABS.map(t => el('button', { class: 'st-b' + (itemTab === t ? ' on' : ''), onclick: () => { itemTab = t; selItem = null; renderPanel(); } }, Inv.TAB_NAMES[t])));
  const sorts = ['type', 'power', 'value', 'newest'];
  const sortBtn = el('button', { class: 'btn small', title: 'Sort', onclick: () => { itemSort = sorts[(sorts.indexOf(itemSort) + 1) % sorts.length]; renderPanel(); } }, 'Sort: ' + itemSort);
  body.append(el('div', { class: 'i-head' }, tabs, el('div', { class: 'i-tools' }, el('span', { class: 'gold' }, `◈ ${S.gold} silver`), sortBtn)));
  const list = Inv.list(itemTab, itemSort);
  if (!list.length) body.append(el('p', { class: 'muted' }, itemTab === 'all' ? 'The bag is empty. Kord travels light, mostly by necessity.' : 'Nothing here.'));
  const ul = el('div', { class: 'ilist' });
  for (const e of list) {
    const key = e.id + (e.equippedBy ? '@' + e.equippedBy + e.slot : '');
    const row = el('button', { class: 'irow' + (selItem === key ? ' sel' : ''), onclick: () => { selItem = selItem === key ? null : key; if (!e.equippedBy) Inv.markSeen(e.id); renderPanel(); } },
      iconImg(e.id), el('span', { class: 'grow' }, Inv.itemName(e.id)),
      e.isNew ? el('span', { class: 'new' }, 'NEW') : null,
      e.equippedBy ? el('span', { class: 'eq' }, 'E: ' + (DB.members[e.equippedBy]?.name || e.equippedBy)) : null,
      e.n > 1 ? el('span', { class: 'cnt' }, '×' + e.n) : null);
    ul.append(row);
    if (selItem === key) ul.append(itemCard(e));
  }
  body.append(ul);
}

export function itemDesc(id) {
  const it = Inv.item(id);
  if (Inv.isCompanion(id)) return DB.members[id]?.blurb || DB.members[id]?.desc || '';
  return it ? resolveText(it.desc || it.look || '') : '';
}

function itemCard(e) {
  const id = e.id, it = Inv.item(id);
  const card = el('div', { class: 'icard' });
  const lines = [];
  if (it) {
    if (it.kind === 'weapon') lines.push(`${cap(it.class || 'weapon')} · power ${it.power} · ${it.type}${it.twoHanded ? ' · two-handed' : ''}${it.actsFirst ? ' · acts first' : ''}${it.flyers ? ' · full damage to flyers' : ''}${it.crit ? ` · crit +${it.crit}` : ''}`);
    if (it.kind === 'armor') lines.push(`${Inv.SLOT_NAMES[it.slot] || it.slot} · DEF ${it.def}${it.agi ? ` · AGI ${it.agi > 0 ? '+' : ''}${it.agi}` : ''}${(it.resist || []).length ? ' · resists ' + it.resist.join(', ') : ''}`);
    if (it.kind === 'charm') lines.push('Charm' + (it.sorcerous ? ' · sorcerous' : '') + statsText(it));
    if (it.kind === 'consumable') lines.push(effectText(it));
    if (it.kind === 'treasure') lines.push(`Treasure · worth ${it.value} silver`);
    if (it.procs && it.procs.length) lines.push(it.procs.map(p => `${Math.round(p.chance * 100)}% ${p.status}`).join(', '));
    if (it.vs) lines.push(`+${it.vs.pct}% vs ${it.vs.tag}s`);
    if (it.users && it.users !== 'any') lines.push('Used by: ' + [].concat(it.users).map(u => DB.members[u]?.name || cap(u)).join(', '));
    if (it.kind === 'key' && it.hintOnceLearned && (!it.learnedBy || S.flags[it.learnedBy])) lines.push('✦ ' + it.hintOnceLearned);
  }
  const d = itemDesc(id);
  if (d) card.append(el('p', { class: 'desc', html: markup(d) }));
  for (const l of lines) card.append(el('p', { class: 'meta' }, l));
  // comparison rows for gear
  if (it && ['weapon', 'armor', 'charm'].includes(it.kind)) {
    const cmp = el('div', { class: 'cmp' });
    for (const p of S.party) {
      if (p.frozen) continue;
      const c = Inv.compare(p.id, id);
      if (!c || !c.ok) continue;
      cmp.append(el('div', { class: 'cmp-row' }, el('span', { class: 'who' }, DB.members[p.id]?.name),
        c.worn ? el('span', { class: 'muted' }, 'wearing it') : deltas(c),
        c.worn ? null : el('button', { class: 'btn small', onclick: () => ACT.equip?.(p.id, id, c.slot) }, 'Equip')));
    }
    if (cmp.children.length) card.append(cmp); else card.append(el('p', { class: 'muted' }, 'No one here can use it.'));
  }
  const acts = el('div', { class: 'acts' });
  if (it?.kind === 'consumable' && it.field !== false && !(it.effect && (it.effect.damage || it.effect.move))) acts.append(el('button', { class: 'btn small', onclick: () => ACT.drink?.(id) }, it.icon === 'food' ? 'Eat' : 'Drink'));
  if (!e.equippedBy || it?.kind !== 'consumable') acts.append(el('button', { class: 'btn small', onclick: () => ACT.startUse?.(id) }, 'Use'));
  if (!Inv.isCompanion(id)) acts.append(el('button', { class: 'btn small', onclick: () => ACT.startCombine?.(id) }, 'Combine'));
  acts.append(el('button', { class: 'btn small', onclick: () => ACT.lookItem?.(id) }, 'Look'));
  if (e.equippedBy) acts.append(el('button', { class: 'btn small', onclick: () => ACT.unequip?.(e.equippedBy, e.slot) }, 'Take off'));
  card.append(acts);
  return card;
}
function cap(s) { return s ? s[0].toUpperCase() + s.slice(1) : ''; }
function statsText(it) {
  const s = it.stats || {}; const out = [];
  for (const [k, v] of Object.entries(s)) out.push(`${k.replace('Pct', '%').toUpperCase()} +${v}`);
  if ((it.immune || []).length) out.push('immune to ' + it.immune.join(', '));
  return out.length ? ' · ' + out.join(' · ') : '';
}
function effectText(it) {
  const e = it.effect || {};
  if (e.heal) return `Restores ${e.heal} HP`;
  if (e.mp) return `Restores ${e.mp} MP`;
  if (e.mpFull) return 'Restores all MP';
  if (e.revive) return `Revives a fallen ally`;
  if (e.cure) return 'Cures ' + e.cure.join(', ');
  if (e.damage) return `${e.damage.type} damage (battle)`;
  if (e.move) return 'A battle spell';
  return 'Consumable';
}
export function deltas(c) {
  const box = el('span', { class: 'deltas' });
  if (!c) return box;
  if (!c.ok) { box.append(el('span', { class: 'muted' }, c.reason || '')); return box; }
  const names = { attack: 'ATK', def: 'DEF', agi: 'AGI', wil: 'WIL', hp: 'HP', mp: 'MP', crit: 'CRIT' };
  const d = c.deltas || {};
  if (!Object.keys(d).length) box.append(el('span', { class: 'muted' }, '='));
  for (const [k, v] of Object.entries(d)) box.append(el('span', { class: v > 0 ? 'up' : 'down' }, `${v > 0 ? '▲' : '▼'}${names[k]} ${v > 0 ? '+' : ''}${v}`));
  return box;
}

// ---- journal
function renderJournal(body) {
  const objs = Object.values(DB.objectives).filter(o => S.journal.obj[o.id]);
  const active = objs.filter(o => S.journal.obj[o.id] === 'active' && !o.side);
  const sideOpen = objs.filter(o => S.journal.obj[o.id] === 'active' && o.side);
  const sideShut = objs.filter(o => o.side && ['done', 'closed'].includes(S.journal.obj[o.id]));
  const done = objs.filter(o => S.journal.obj[o.id] === 'done' && !o.side);
  body.append(el('h3', { class: 'j-h' }, `Chapter ${roman(S.chapter)}: ${DB.chapters[S.chapter]?.name || ''}`));
  if (!active.length) body.append(el('p', { class: 'muted' }, objs.length ? 'Nothing pressing. Enjoy it; it will not last.' : 'No goals yet. Look around.'));
  const objCard = (o) => {
    const lvl = S.journal.hints[o.id] || 0;
    const card = el('div', { class: 'card obj' }, el('p', { class: 'obj-t' }, '◆ ' + o.text));
    for (let i = 0; i < lvl; i++) card.append(el('p', { class: 'hint' }, `Hint ${i + 1}: ${o.hints[i]}`));
    card.append(el('div', { class: 'acts' },
      lvl < 3 ? el('button', { class: 'btn small', onclick: () => ACT.hint?.(o.id) }, lvl ? 'Another hint' : 'Hint') : null,
      el('button', { class: 'btn small', onclick: () => ACT.askParty?.(o.id) }, 'Ask the party')));
    return card;
  };
  for (const o of active) body.append(objCard(o));
  if (sideOpen.length || sideShut.length) {
    body.append(el('h4', { class: 'j-side' }, 'Side quests'));
    for (const o of sideOpen) { const c = objCard(o); c.classList.add('side'); if (o.lock) c.insertBefore(el('p', { class: 'obj-lock' }, o.lock), c.children[1] || null); body.append(c); }
    for (const o of sideShut) body.append(el('p', { class: S.journal.obj[o.id] === 'done' ? 'obj-done' : 'obj-closed' }, S.journal.obj[o.id] === 'done' ? '✦ ' + o.text : `✧ ${String(o.text).replace(/[.!]$/, '')}: lost to time`));
  }
  if (done.length) {
    body.append(el('h4', {}, 'Done'));
    for (const o of done) body.append(el('p', { class: 'obj-done' }, '✦ ' + o.text));
  }
  body.append(el('h4', {}, 'Bestiary'));
  const seen = Object.keys(S.bestiary || {});
  if (!seen.length) body.append(el('p', { class: 'muted' }, 'Foes you meet are recorded here, with what hurts them once you find out.'));
  for (const id of seen) {
    const e = DB.enemies[id]; const b = S.bestiary[id] || {};
    body.append(el('div', { class: 'best' }, el('b', {}, e?.name || id), b.weak?.length ? ` · weak: ${b.weak.join(', ')}` : '', b.resist?.length ? ` · resists: ${b.resist.join(', ')}` : ''));
  }
}

// ---- map (node map drawn in code)
function renderMap(body) {
  const rooms = Object.values(DB.rooms).filter(r => r.chapter === S.chapter && r.map);
  const known = new Set(rooms.filter(r => S.visited[r.id]).map(r => r.id));
  const shown = new Set(known);
  for (const id of known) for (const ex of DB.rooms[id].exits || []) if (DB.rooms[ex.to]?.map && DB.rooms[ex.to].chapter === S.chapter) shown.add(ex.to);
  const xs = rooms.map(r => r.map.x), ys = rooms.map(r => r.map.y);
  const minX = Math.min(...xs, 0), maxX = Math.max(...xs, 1), minY = Math.min(...ys, 0), maxY = Math.max(...ys, 1);
  const U = 74, pad = 46;
  const w = (maxX - minX) * U + pad * 2, h = (maxY - minY) * U + pad * 2;
  const P = r => [(r.map.x - minX) * U + pad, (r.map.y - minY) * U + pad];
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`); svg.setAttribute('class', 'map');
  const mk = (tag, attrs) => { const e = document.createElementNS(ns, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); return e; };
  const drawn = new Set();
  for (const id of shown) for (const ex of DB.rooms[id].exits || []) {
    const to = DB.rooms[ex.to]; if (!to?.map || !shown.has(to.id)) continue;
    const key = [id, to.id].sort().join('|'); if (drawn.has(key)) continue; drawn.add(key);
    const [x1, y1] = P(DB.rooms[id]), [x2, y2] = P(to);
    svg.append(mk('line', { x1, y1, x2, y2, class: 'm-edge' + (known.has(id) && known.has(to.id) ? '' : ' faint') }));
  }
  const canTravel = ACT.canTravel ? ACT.canTravel() : false;
  for (const id of shown) {
    const r = DB.rooms[id]; const [x, y] = P(r);
    const g = mk('g', { class: 'm-node' + (id === S.room ? ' here' : '') + (known.has(id) ? ' known' : ' unknown') + (r.dungeon ? ' dungeon' : '') });
    // The name on one or two lines inside its box; a long word is squeezed to fit, never spills out.
    const nm = r.mapName || r.name.replace(/^The /, '');
    const lines = [];
    if (known.has(id)) for (const word of nm.split(' ')) { const l = lines.length - 1; if (l >= 0 && (lines[l] + ' ' + word).length <= 10) lines[l] += ' ' + word; else lines.push(word); }
    else lines.push('?');
    if (lines.length > 2) lines.splice(1, lines.length, lines.slice(1).join(' '));
    const bh = lines.length > 1 ? 34 : 24;
    g.append(mk('rect', { x: x - 33, y: y - bh / 2, width: 66, height: bh, rx: 4 }));
    lines.forEach((line, i) => {
      const t = mk('text', { x, y: y + 4 + (lines.length > 1 ? (i ? 7 : -6) : 0), 'text-anchor': 'middle' });
      if (line.length > 10) { t.setAttribute('textLength', 60); t.setAttribute('lengthAdjust', 'spacingAndGlyphs'); }
      t.textContent = line; g.append(t);
    });
    if (id === S.room) g.append(mk('circle', { cx: x + 30, cy: y - 12, r: 4, class: 'm-here' }));
    const travelOk = canTravel && known.has(id) && id !== S.room && !r.dungeon && !DB.rooms[S.room]?.dungeon;
    if (travelOk) { g.classList.add('travel'); g.addEventListener('click', () => ACT.travel?.(id)); g.setAttribute('role', 'button'); }
    svg.append(g);
  }
  body.append(el('div', { class: 'map-wrap' }, svg));
  body.append(el('p', { class: 'muted small' }, DB.rooms[S.room]?.dungeon ? 'No fast travel from here: find your own way out.' : tapWords('Tap a place you have been to travel there.')));
}

// ---------------------------------------------------------------- code-drawn item icons (16×16)
const iconCache = new Map();
export function iconURL(name, id) {
  if (Scene.hasAsset('icon/' + name)) return Scene.assetPath('icon/' + name);
  return codeIcon(name);
}
export function codeIcon(name) {
  if (iconCache.has(name)) return iconCache.get(name);
  const c = document.createElement('canvas'); c.width = 16; c.height = 16;
  const x = c.getContext('2d');
  const px = (col, pts) => { x.fillStyle = col; for (const [a, b, w = 1, h = 1] of pts) x.fillRect(a, b, w, h); };
  const steel = '#c9c4b8', dark = '#3a2a1c', brown = '#7a4a22', gold = '#d8a33a', red = '#b8322a', blue = '#3a5ab8';
  const diag = (col, x0, y0, n) => { for (let i = 0; i < n; i++) px(col, [[x0 + i, y0 - i]]); };
  switch (name) {
    case 'sword': case 'greatsword': case 'future': case 'sabre': case 'rapier':
      diag(name === 'future' ? '#9fe8dc' : steel, 4, 11, 9); diag('#fff', 5, 11, 8); px(gold, [[2, 10, 4, 1], [3, 9, 1, 3]]); px(brown, [[2, 12], [1, 13]]); break;
    case 'dagger': case 'knives': diag(steel, 6, 10, 6); px(gold, [[4, 9, 3, 1]]); px(brown, [[4, 11], [3, 12]]); if (name === 'knives') diag(steel, 9, 12, 5); break;
    case 'axe': diag(brown, 3, 13, 10); px(steel, [[9, 2, 4, 5], [8, 3, 1, 3]]); break;
    case 'mace': diag(brown, 3, 13, 8); px(steel, [[9, 2, 5, 5]]); px(dark, [[10, 3], [12, 5]]); break;
    case 'spear': diag(brown, 2, 14, 11); px(steel, [[12, 1, 3, 3]]); break;
    case 'bow': x.strokeStyle = brown; x.lineWidth = 1.5; x.beginPath(); x.arc(4, 8, 7, -1.2, 1.2); x.stroke(); px('#ddd', [[6, 2, 1, 12]]); break;
    case 'shield': px(brown, [[3, 2, 10, 9], [4, 11, 8, 2], [6, 13, 4, 1]]); px(steel, [[7, 3, 2, 9]]); break;
    case 'body': case 'armor': px(brown, [[3, 3, 10, 10]]); px(dark, [[6, 3, 4, 2]]); px(steel, [[4, 6, 8, 1], [4, 9, 8, 1]]); break;
    case 'helm': px(steel, [[4, 6, 8, 6], [5, 5, 6, 1]]); px('#e8e0d0', [[2, 3, 1, 4], [13, 3, 1, 4], [3, 6], [12, 6]]); px(dark, [[6, 9, 4, 1]]); break;
    case 'charm': case 'ring': x.strokeStyle = gold; x.lineWidth = 2; x.beginPath(); x.arc(8, 9, 4, 0, 7); x.stroke(); px('#d33', [[7, 3, 2, 2]]); break;
    case 'amulet': x.strokeStyle = gold; x.beginPath(); x.moveTo(3, 2); x.lineTo(8, 9); x.lineTo(13, 2); x.stroke(); px(gold, [[6, 9, 4, 4]]); px(red, [[7, 10, 2, 2]]); break;
    case 'potion_red': case 'potion_blue': case 'consumable':
      px(dark, [[7, 2, 2, 2]]); px('#ccc', [[6, 4, 4, 1]]); px(name === 'potion_blue' ? blue : red, [[4, 6, 8, 7], [5, 5, 6, 1], [5, 13, 6, 1]]); px('#fff', [[5, 7, 1, 2]]); break;
    case 'wine': px('#5a1020', [[6, 5, 4, 8]]); px('#5a1020', [[7, 2, 2, 3]]); px(gold, [[6, 8, 4, 2]]); break;
    case 'food': px('#c89048', [[3, 6, 10, 6]]); px('#e0b070', [[4, 5, 8, 1]]); px('#6a2a10', [[5, 8], [8, 9], [10, 7]]); break;
    case 'bomb': px('#333', [[4, 6, 8, 8]]); px(brown, [[7, 3, 2, 3]]); px('#f90', [[9, 2]]); break;
    case 'scroll': case 'document': px('#e8d8b0', [[3, 3, 10, 10]]); px(brown, [[2, 3, 1, 10], [13, 3, 1, 10]]); px('#7a6a50', [[5, 6, 6, 1], [5, 8, 6, 1], [5, 10, 4, 1]]); break;
    case 'key': px(gold, [[3, 5, 4, 4], [7, 6, 7, 2], [11, 8, 1, 2], [13, 8, 1, 2]]); px(dark, [[4, 6, 2, 2]]); break;
    case 'gem': case 'treasure': px(gold, [[4, 9, 8, 4], [5, 8, 6, 1]]); px('#e8d070', [[5, 10, 6, 1]]); px('#b0b0c8', [[6, 4, 4, 4]]); break;
    case 'rag': px(red, [[3, 5, 10, 6], [4, 11, 3, 2], [10, 4, 2, 1]]); px('#7a1a14', [[5, 7, 6, 1]]); break;
    case 'oil': px('#8a6a3a', [[5, 5, 6, 8], [6, 4, 4, 1]]); px(dark, [[6, 2, 4, 2]]); px('#d8b050', [[6, 8, 4, 3]]); break;
    case 'companion': px('#ffe0b0', [[6, 3, 4, 4]]); px('#7a4a22', [[4, 8, 8, 6]]); break;
    default: px(brown, [[4, 4, 8, 8]]); px(gold, [[6, 6, 4, 4]]);
  }
  const url = c.toDataURL(); iconCache.set(name, url); return url;
}

// ---------------------------------------------------------------- screens
export function showScreen(name) {
  for (const s of document.querySelectorAll('.screen')) s.hidden = s.id !== 'scr-' + name;
  document.body.dataset.screen = name;
}
