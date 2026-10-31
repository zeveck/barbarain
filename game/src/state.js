// state.js: data registry (DB), game state (S), runtime state (R), settings,
// levels, seeded RNG, saves (slots, migrations, reference check).
// Data modules are imported with guards so the engine runs while other
// people's files (items, party, enemies, snapshots) are still being written.

export const SAVE_VERSION = 1;
export const SAVE_KEY = 'barbarain.save.';
export const SETTINGS_KEY = 'barbarain.settings';
export const SLOTS = ['auto', '1', '2', '3'];

// Chapter files that exist. Add 'ch2' … here when a chapter file lands
// (a missing file would show a 404 in the console).
export const CHAPTER_FILES = ['ch1', 'ch2', 'ch3', 'ch4', 'ch5'];

// ---------------------------------------------------------------- registry
export const DB = {
  items: {}, enemies: {}, moves: {}, encounters: {}, members: {}, skills: {},
  snapshots: {}, recipes: [], defaults: {}, scripts: {},
  chapters: {}, rooms: {}, npcs: {}, dialogues: {}, scenes: {},
  objectives: {}, shops: {}, threats: {}, seekTrouble: {}, banter: {}, itemNames: {},
  loaded: [], missing: [],
};

// Minimal fallbacks so a new game can start before party.js exists.
const FALLBACK_MEMBERS = {
  kord: { name: 'Kord', sprite: 'party/kord', portrait: 'portrait/kord',
    lv1: { hp: 60, mp: 8, atk: 12, def: 6, agi: 7, wil: 3 },
    lv17: { hp: 520, mp: 60, atk: 62, def: 34, agi: 22, wil: 12 },
    classes: ['sword', 'greatsword', 'axe', 'mace', 'spear', 'dagger'], shields: true,
    slots: ['weapon', 'off', 'body', 'head', 'charm'], refusesSorcerous: true,
    immune: ['stilled', 'drowsy'], skills: [], start: { weapon: 'rusty_broadsword', body: 'leather_harness' } },
};

async function tryImport(path) {
  try { return await import(path); } catch (e) { return null; }
}

export async function loadData(base = './data/') {
  const items = await tryImport(base + 'items.js');
  const enemies = await tryImport(base + 'enemies.js');
  const party = await tryImport(base + 'party.js');
  const snaps = await tryImport(base + 'snapshots.js');
  const recipes = await tryImport(base + 'recipes.js');
  const defaults = await tryImport(base + 'defaults.js');
  const scripts = await tryImport(base + 'scripts.js');
  const note = (name, m) => (m ? DB.loaded : DB.missing).push(name);
  note('items', items); note('enemies', enemies); note('party', party); note('snapshots', snaps);
  DB.items = items?.ITEMS || {};
  DB.enemies = enemies?.ENEMIES || {};
  DB.moves = enemies?.MOVES || {};
  DB.encounters = enemies?.ENCOUNTERS || {};
  DB.members = party?.MEMBERS || FALLBACK_MEMBERS;
  DB.skills = party?.SKILLS || {};
  DB.snapshots = snaps?.SNAPSHOTS || {};
  DB.recipes = recipes?.RECIPES || [];
  DB.defaults = defaults?.DEFAULTS || {};
  DB.scripts = scripts?.SCRIPTS || {};
  for (const f of CHAPTER_FILES) {
    const m = await tryImport(base + f + '.js');
    if (!m) { DB.missing.push(f); continue; }
    addChapter(m);
  }
  return DB;
}

export function addChapter(m) {
  const ch = typeof m.chapter === 'object' ? m.chapter : { n: m.chapter };
  const n = ch.n;
  DB.chapters[n] = { ...ch, module: m };
  for (const [id, room] of Object.entries(m.rooms || {})) {
    room.id = room.id || id; room.chapter = room.chapter || n;
    DB.rooms[room.id] = room;
  }
  Object.assign(DB.npcs, m.npcs || {});
  Object.assign(DB.dialogues, m.dialogues || {});
  Object.assign(DB.scenes, m.scenes || {});
  Object.assign(DB.shops, m.shops || {});
  for (const o of m.objectives || []) DB.objectives[o.id] = { ...o, chapter: n };
  DB.threats[n] = m.threats || [];
  DB.seekTrouble[n] = m.seekTrouble || {};
  DB.banter[n] = m.banter || {};
  for (const [id, words] of Object.entries(m.itemNames || {})) DB.itemNames[id] = [...new Set([...(DB.itemNames[id] || []), ...words])];
}

// ---------------------------------------------------------------- state
export const S = {};      // saved game state (replaced in place on load)
export const R = {        // runtime only
  screen: 'boot', mode: 'explore', busyCount: 0, typing: false,
  transition: false, inBattle: false, battle: null, battleResult: null,
  targeting: null, pending: null, preBattleSnapshot: null, epoch: 0,
  actionCount: {}, fired: {}, idleSeconds: 0, menuOpen: false, panel: 'play',
  lastRefusal: {}, rngCounter: 0, autoBattle: false, gameWon: false,
};

export function resetState(obj) {
  for (const k of Object.keys(S)) delete S[k];
  Object.assign(S, obj);
}

export function blankState() {
  return {
    v: SAVE_VERSION, chapter: 1, room: null, flags: {}, party: [], guest: null,
    items: {}, newItems: {}, gold: 0, xp: 0,
    journal: { obj: {}, hints: {} }, bestiary: {}, visited: {}, seed: 1729,
    chapterComplete: [], exits: {}, choicesDone: {}, won: {}, gameWon: false,
    savedAt: 0,
  };
}

export function member(id) { return DB.members[id] || null; }

export function makeMember(id, equip) {
  const m = member(id);
  const e = { weapon: null, off: null, body: null, head: null, charm: null };
  Object.assign(e, equip || (m && m.start) || {});
  const pm = { id, hp: 1, mp: 0, equip: e, frozen: false, statuses: [], skills: [] };
  return pm;
}

export function freshGame(chapter = 1) {
  const snap = DB.snapshots[chapter];
  const s = blankState();
  if (snap) applySnapshot(s, snap, chapter);
  else {
    s.chapter = chapter;
    s.room = DB.chapters[chapter]?.start || Object.keys(DB.rooms)[0];
    s.party = [makeMember('kord')];
  }
  resetState(s);
  for (const p of S.party) fullHeal(p);
  return S;
}

export function applySnapshot(s, snap, chapter) {
  s.chapter = chapter;
  s.room = snap.room || DB.chapters[chapter]?.start;
  s.xp = snap.xp ?? cumulativeXp(snap.level || 1);
  s.gold = snap.gold || 0;
  s.party = (snap.party || [{ id: 'kord' }]).map(p => Object.assign(makeMember(p.id, p.equip), { frozen: !!p.frozen }));
  s.items = { ...(snap.items || {}) };
  s.flags = {};
  for (const f of snap.flags || []) {
    if (typeof f === 'string') s.flags[f] = true; else if (f && f.id) s.flags[f.id] = f.value ?? true;
  }
  if (snap.flags && !Array.isArray(snap.flags)) Object.assign(s.flags, snap.flags);
  s.journal = { obj: {}, hints: {} };
  for (const o of snap.objectives || []) {
    if (typeof o === 'string') s.journal.obj[o] = 'active';
    else if (o && o.id) s.journal.obj[o.id] = o.status || o.is || 'active';
  }
  for (let c = 1; c < chapter; c++) s.chapterComplete.push(c);
  if (snap.guest) s.guest = { ...snap.guest };
}

// ---------------------------------------------------------------- levels
export function xpToNext(L) { return Math.round(18 * Math.pow(L, 1.55)); }
export function cumulativeXp(level) { let c = 0; for (let L = 1; L < level; L++) c += xpToNext(L); return c; }
export function levelFromXp(xp) {
  let L = 1, c = 0;
  while (L < 20 && xp >= c + xpToNext(L)) { c += xpToNext(L); L++; }
  return L;
}
export function partyLevel() { return levelFromXp(S.xp || 0); }

export function baseStats(id, L = partyLevel()) {
  const m = member(id); if (!m) return { hp: 1, mp: 0, atk: 0, def: 0, agi: 0, wil: 0 };
  const out = {};
  for (const k of ['hp', 'mp', 'atk', 'def', 'agi', 'wil']) {
    const a = m.lv1?.[k] ?? 0, b = m.lv17?.[k] ?? a;
    out[k] = Math.round(a + (b - a) * (L - 1) / 16);
  }
  return out;
}

export function fullHeal(pm) {
  const st = gearStats(pm);
  pm.hp = st.hp; pm.mp = st.mp;
  pm.statuses = [];
}

// Final stats with gear (weapon power counted as ATK).
export function gearStats(pm, equipOverride) {
  const b = baseStats(pm.id);
  const eq = equipOverride || pm.equip || {};
  const st = { ...b, crit: 0, evasion: 0, power: 0, hpPct: 0, mpPct: 0, immune: [], resist: [] };
  for (const slot of ['weapon', 'off', 'body', 'head', 'charm']) {
    const it = DB.items[eq[slot]]; if (!it) continue;
    if (it.kind === 'weapon') {
      if (slot === 'weapon') { st.power += it.power || 0; st.crit += it.crit || 0; }
      else { st.def += it.offhandDef || 0; st.crit += Math.floor((it.crit || 0) / 2); }
    } else if (it.kind === 'armor') {
      st.def += it.def || 0; st.agi += it.agi || 0;
      st.resist.push(...(it.resist || []));
    } else if (it.kind === 'charm') {
      const s = it.stats || {};
      st.atk += s.atk || 0; st.def += s.def || 0; st.agi += s.agi || 0; st.wil += s.wil || 0;
      st.crit += s.crit || 0; st.evasion += s.evasion || 0;
      st.hpPct += s.hpPct || 0; st.mpPct += s.mpPct || 0;
      st.immune.push(...(it.immune || []));
    }
  }
  st.hp = Math.round(st.hp * (1 + st.hpPct / 100));
  st.mp = Math.round(st.mp * (1 + st.mpPct / 100));
  st.attack = st.atk + st.power;
  return st;
}

// ---------------------------------------------------------------- rng
export function hashStr(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
export function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// Seeded pick from a pool, never the same index twice in a row per pool.
export function pickFrom(pool, key) {
  if (!pool || !pool.length) return null;
  if (pool.length === 1) return pool[0];
  const r = mulberry32(hashStr(key + ':' + (S.seed || 1) + ':' + (R.rngCounter++)))();
  let i = Math.floor(r * pool.length);
  if (R.lastRefusal[key] === i) i = (i + 1) % pool.length;
  R.lastRefusal[key] = i;
  return pool[i];
}

// ---------------------------------------------------------------- settings
export const SETTINGS = {
  music: 0.7, sfx: 0.8, mute: false, textSpeed: 'fast', difficulty: 'warrior',
  showHotspots: false, fontSize: 'm', typingSound: true, tips: {},
  endings: {},   // ending id -> true, across every save and new game (design/ENDINGS.md)
};
export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) Object.assign(SETTINGS, JSON.parse(raw));
  } catch (e) { /* defaults */ }
  if (!SETTINGS.tips || typeof SETTINGS.tips !== 'object') SETTINGS.tips = {};   // a hand-edited or broken value
  if (!SETTINGS.endings || typeof SETTINGS.endings !== 'object' || Array.isArray(SETTINGS.endings)) SETTINGS.endings = {};
  return SETTINGS;
}
export function saveSettings() {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(SETTINGS)); } catch (e) { /* ignore */ }
}

// ---------------------------------------------------------------- saves
// MIGRATIONS[n] upgrades a version-n save to version n+1.
export const MIGRATIONS = {
  // 1: s => { s.newField = …; return s; },
};

export function migrate(s) {
  let guard = 0;
  while ((s.v || 0) < SAVE_VERSION && guard++ < 50) {
    const f = MIGRATIONS[s.v || 0];
    if (!f) throw new Error('no migration from v' + s.v);
    s = f(s); s.v = (s.v || 0) + 1;
  }
  return s;
}

// Reference check: every id in the save must exist in the data.
export function checkRefs(s) {
  const bad = [];
  if (!DB.rooms[s.room]) bad.push('room ' + s.room);
  const haveItems = Object.keys(DB.items).length > 0;
  if (haveItems) for (const id of Object.keys(s.items || {})) if (!DB.items[id]) bad.push('item ' + id);
  for (const p of s.party || []) {
    if (!DB.members[p.id]) bad.push('member ' + p.id);
    if (haveItems) for (const it of Object.values(p.equip || {})) if (it && !DB.items[it]) bad.push('item ' + it);
  }
  for (const id of Object.keys(s.journal?.obj || {})) if (!DB.objectives[id]) bad.push('objective ' + id);
  for (const id of Object.keys(s.visited || {})) if (!DB.rooms[id]) bad.push('room ' + id);
  const known = knownFlags();
  if (known.size) for (const f of Object.keys(s.flags || {})) if (!known.has(f)) bad.push('flag ' + f);
  return bad;
}

let _knownFlags = null;
export function knownFlags() {
  if (_knownFlags) return _knownFlags;
  const set = new Set();
  const walk = (o) => {
    if (!o || typeof o !== 'object') return;
    if (Array.isArray(o)) { o.forEach(walk); return; }
    for (const [k, v] of Object.entries(o)) {
      if ((k === 'set' || k === 'clear' || k === 'flag') && typeof v === 'string') set.add(v);
      else walk(v);
    }
  };
  for (const ch of Object.values(DB.chapters)) walk(ch.module);
  walk(DB.encounters);
  for (const snap of Object.values(DB.snapshots)) for (const f of snap.flags || []) set.add(typeof f === 'string' ? f : f.id);
  _knownFlags = set;
  return set;
}

export function isRest() {
  if (R.screen !== 'game') return false;
  if (R.mode !== 'explore') return false;
  if (R.inBattle || R.targeting || R.transition || R.pending) return false;
  const room = DB.rooms[S.room];
  if (room && room.rest === false) return false;
  return true;
}

export function serialize() {
  const s = JSON.parse(JSON.stringify(S));
  s.v = SAVE_VERSION; s.savedAt = Date.now();
  return s;
}

export function writeSlot(slot, data) {
  try { localStorage.setItem(SAVE_KEY + slot, JSON.stringify(data)); return true; }
  catch (e) { return false; }
}

export function readSlot(slot) {
  try {
    const raw = localStorage.getItem(SAVE_KEY + slot);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) { return { corrupt: true }; }
}

export function slotMeta(slot) {
  const s = readSlot(slot);
  if (!s) return null;
  if (s.corrupt) return { slot, corrupt: true };
  return { slot, chapter: s.chapter, room: DB.rooms[s.room]?.name || s.room, level: levelFromXp(s.xp || 0), savedAt: s.savedAt, gold: s.gold };
}

// Returns {ok, message}. On bad refs falls back to the chapter snapshot.
export function loadFromSlot(slot) {
  let s = readSlot(slot);
  if (!s) return { ok: false, message: 'That slot is empty.' };
  const rewritten = 'The chronicle has been rewritten since you last read it; you begin this chapter afresh.';
  if (s.corrupt) return { ok: false, message: 'That save could not be read.' };
  try {
    s = migrate(s);
    const bad = checkRefs(s);
    if (bad.length) {
      console.warn('save reference check failed:', bad);
      freshGame(s.chapter || 1);
      return { ok: true, message: rewritten };
    }
    const base = blankState();
    resetState(Object.assign(base, s));
    for (const p of S.party) {
      p.equip = Object.assign({ weapon: null, off: null, body: null, head: null, charm: null }, p.equip || {});
      p.statuses = p.statuses || []; p.skills = p.skills || [];
    }
    return { ok: true, message: null };
  } catch (e) {
    console.warn('save load failed', e);
    freshGame(s.chapter || 1);
    return { ok: true, message: rewritten };
  }
}
