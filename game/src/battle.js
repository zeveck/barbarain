// BarbarAIn — battle engine. Pure functions over a plain battle state with a
// seeded RNG (seed = encounter id + attempt number). No DOM access: runs in
// node (tools/sim.mjs, tools/battle-test.mjs) and in the browser.
// Contract: design/BATTLE_API.md.

import { ITEMS } from './data/items.js';
import { MEMBERS, SKILLS, baseStats, xpToReach, levelForXp, knownSkills } from './data/party.js';
import { ENEMIES, MOVES, ENCOUNTERS, TIER_RULES } from './data/enemies.js';

// ───────────────────────── constants ─────────────────────────
export const DAMAGE_TYPES = ['slash', 'pierce', 'crush', 'shock', 'fire'];
const ROLE_MULT = TIER_RULES.roles;
const PARTY_FACTOR = TIER_RULES.partySize;
const SAGA = TIER_RULES.saga;
const PARTY_ORDER = ['kord', 'toktai', 'ain', 'valka'];
const HEALERS = ['ain'];
const STATUS_RESIST_IDS = ['poison', 'bleed', 'stun', 'blind', 'drowsy', 'stilled'];
const BIG_ROLES = ['boss', 'mini'];
export const STATUS_INFO = {
  poison: { label: 'Poison', bad: true }, bleed: { label: 'Bleed', bad: true }, stun: { label: 'Stun', bad: true },
  blind: { label: 'Blind', bad: true }, drowsy: { label: 'Drowsy', bad: true }, stilled: { label: 'Stilled', bad: true },
  sunder: { label: 'Sundered', bad: true, stat: 'def', pct: -30 }, weigh: { label: 'Weighed', bad: true },
  guard: { label: 'Guard' }, riposte: { label: 'Riposte' }, taunt: { label: 'Taunt' },
  aegis: { label: 'Aegis' }, mirage: { label: 'Mirage' }, smoke: { label: 'Smoke' }, rage: { label: 'Rage' }, song: { label: "Lion's Song" },
};
const AIN_LINES = [
  'Kord… I am here… hold…', 'Kord… I can still reach you… hold on…', '…the song needs stillness… break it…',
  'Kord… not yet… I have you…', '…be the noise, Kord… I am with you…',
];

// ───────────────────────── RNG ─────────────────────────
export function hashSeed(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h >>> 0;
}
export function battleSeed(encounterId, attempt = 1) { return hashSeed(`${encounterId}#${attempt}`); }
function rnd(s) {
  s.rng = (s.rng + 0x6D2B79F5) >>> 0;
  let t = s.rng;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const pick = (s, arr) => arr[Math.floor(rnd(s) * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const clone = (o) => (typeof structuredClone === 'function' ? structuredClone(o) : JSON.parse(JSON.stringify(o)));

// ───────────────────────── stats ─────────────────────────
// Party member's battle stats from level and equipment (BALANCE §2, GAME_DESIGN "Stats and formulas").
export function memberStats(id, level, equip = {}) {
  const m = MEMBERS[id];
  const b = baseStats(id, level);
  const out = { ...b, crit: 0, evasion: 0, immune: [...(m.immune || [])], resist: [], resistTypes: [], regenPct: 0,
    startAegis: false, scanFree: false };
  let weapon = null;
  if (m.weapon) weapon = { power: m.weapon.power, type: m.weapon.type, actsFirst: false, flyers: false, procs: [], vs: null, crit: 0, name: m.weapon.name };
  const w = equip.weapon && ITEMS[equip.weapon];
  if (w && w.kind === 'weapon') weapon = { power: w.power, type: w.type, actsFirst: !!w.actsFirst, flyers: !!w.flyers, procs: w.procs || [], vs: w.vs, crit: w.crit || 0, name: w.name, id: equip.weapon };
  if (!weapon) weapon = { power: 0, type: m.attackType || 'crush', actsFirst: false, flyers: false, procs: [], vs: null, crit: 0, name: 'bare hands' };
  out.crit += weapon.crit;
  let hpPct = 0, mpPct = 0;
  const slots = ['off', 'body', 'head', 'charm'];
  for (const sl of slots) {
    const it = equip[sl] && ITEMS[equip[sl]];
    if (!it) continue;
    if (sl === 'off' && w && w.twoHanded) continue;
    if (it.kind === 'armor') {
      out.def += it.def || 0; out.agi += it.agi || 0;
      for (const r of it.resist || []) (DAMAGE_TYPES.includes(r) ? out.resistTypes : out.resist).push(r);
    } else if (it.kind === 'weapon' && sl === 'off') { // off-hand dagger: DEF bonus + half its crit, no second attack
      out.def += it.offhandDef || 0; out.crit += Math.floor((it.crit || 0) / 2);
    } else if (it.kind === 'charm') {
      if (m.refusesSorcerous && it.sorcerous) continue;
      const st = it.stats || {};
      out.atk += st.atk || 0; out.agi += st.agi || 0; out.wil += st.wil || 0; out.def += st.def || 0;
      out.crit += st.crit || 0; out.evasion += st.evasion || 0; out.regenPct += st.regenPct || 0;
      hpPct += st.hpPct || 0; mpPct += st.mpPct || 0;
      if (st.startAegis) out.startAegis = true; if (st.scanFree) out.scanFree = true;
      out.immune.push(...(it.immune || []));
      for (const r of it.resist || []) (DAMAGE_TYPES.includes(r) ? out.resistTypes : out.resist).push(r);
    }
  }
  out.hp = Math.round(out.hp * (1 + hpPct / 100));
  out.mp = Math.round(out.mp * (1 + mpPct / 100));
  out.weapon = weapon;
  return out;
}

// Enemy stats from the tier formula (BALANCE §4). Returns unrounded `base` too (phases multiply it).
export function enemyStats(enemyId, entry = {}, partySize = 4, difficulty = 'warrior') {
  const e = ENEMIES[enemyId];
  const T = entry.tier;
  const role = entry.role || e.role;
  const rm = ROLE_MULT[role];
  const pf = PARTY_FACTOR[partySize] || PARTY_FACTOR[4];
  const m = entry.mult || e.mult || {};
  const saga = difficulty === 'saga';
  const base = {
    hp: (20 + 10 * T + T * T) * rm.hp * pf.hp * (m.hp ?? 1) * (saga ? SAGA.hp : 1),
    atk: (10 + 5 * T) * rm.atk * pf.atk * (m.atk ?? 1) * (saga ? SAGA.atk : 1),
    def: (3 + 1.7 * T) * rm.def * (m.def ?? 1),
    agi: (6 + 1.6 * T) * (m.agi ?? 1),
    wil: (3 + 2 * T) * (m.wil ?? 1),
  };
  const r = {}; for (const k in base) r[k] = Math.round(base[k]);
  return { ...r, base, role, tier: T };
}

// ───────────────────────── units ─────────────────────────
function shortName(id) { const n = MEMBERS[id].name; return n.startsWith('Red ') ? n.slice(4) : n; }

function makePartyUnit(p, level) {
  const st = memberStats(p.id, p.level ?? level, p.equip || {});
  const m = MEMBERS[p.id];
  const u = {
    key: p.id, name: p.id, id: p.id, side: 'party', label: shortName(p.id), sprite: m.sprite, guest: !!m.guest,
    level: p.level ?? level, maxHp: st.hp, maxMp: st.mp,
    hp: p.hp == null ? st.hp : clamp(p.hp, 0, st.hp), mp: p.mp == null ? st.mp : clamp(p.mp, 0, st.mp),
    atk: st.atk, def: st.def, agi: st.agi, wil: st.wil, crit: st.crit, evasion: st.evasion,
    weapon: st.weapon, immune: st.immune, resist: st.resist, resistTypes: st.resistTypes, weak: [], tags: ['human'],
    regenPct: st.regenPct, scanFree: st.scanFree, statuses: clone(p.statuses || []).filter((x) => STATUS_RESIST_IDS.includes(x.id)),
    alive: true, ownTurns: 0,
  };
  if (u.hp <= 0) { u.hp = 0; u.alive = false; }
  if (st.startAegis) u.statuses.push({ id: 'aegis', rounds: 3, stat: 'def', pct: 40 });
  return u;
}

function makeGuestUnit(id, level) {
  const u = makePartyUnit({ id, level, equip: {} }, level);
  u.guest = true;
  return u;
}

function spriteBase(sprite) { return sprite.split('/').pop(); }

function makeEnemyUnit(s, enemyId, entry, name, extra = {}) {
  const e = ENEMIES[enemyId];
  const st = enemyStats(enemyId, entry, s.partySize, s.difficulty);
  const u = {
    key: name, name, id: enemyId, side: 'enemy', label: enemyLabel(e, name), sprite: extra.sprite || e.sprite, mirror: !!(extra.mirror || e.mirror),
    role: st.role, tier: st.tier, entry: { tier: entry.tier, role: entry.role, mult: entry.mult },
    maxHp: st.hp, hp: st.hp, mp: 0, maxMp: 0, atk: st.atk, def: st.def, agi: st.agi, wil: st.wil, base: st.base,
    crit: 0, evasion: 0, weapon: null, attackType: e.attackType || 'slash',
    tags: [...e.tags], weak: [...e.weak], resist: [...e.resist], immune: [...e.immune], resistTypes: [],
    aiRole: e.aiRole, statuses: [], alive: true, ownTurns: 0, phaseIdx: 0, parts: [], partOf: extra.partOf || null,
    summonedBy: extra.summonedBy || null, firedRules: [], pending: null, telegraphedLastRound: false, stolen: false,
  };
  return u;
}

function enemyLabel(e, name) {
  const m = name.match(/-([a-f])$/);
  const letter = m && !name.includes('arm') ? ' ' + m[1].toUpperCase() : '';
  let label = e.name;
  if (name.endsWith('-l') && e.name.includes('Arm')) label = 'Left Arm';
  if (name.endsWith('-r') && e.name.includes('Arm')) label = 'Right Arm';
  return label + letter;
}

function isProper(u) {
  return u.side === 'party' || u.guest || /^(Gorm|Ashkarran|Red Valka|Black Ortho|Thulamon|Uzzah|The |Left Arm|Right Arm)/.test(u.label);
}
function the(u, cap = false) {
  if (u.side === 'party') return u.label;
  let t = isProper(u) ? u.label : 'the ' + u.label;
  if (/^(Left|Right) Arm/.test(u.label)) t = "the Warden's " + u.label.toLowerCase();
  if (t.startsWith('The ') && !cap) t = 'the ' + t.slice(4);
  return cap ? t[0].toUpperCase() + t.slice(1) : t;
}

// ───────────────────────── battle creation ─────────────────────────
// opts: { encounterId, encounter?, party:[{id, level?, hp?, mp?, equip, frozen?, statuses?}], level,
//         items:{id:n}, flags, chapter, difficulty:'warrior'|'saga', attempt, seed?, bestiary? }
export function createBattle(opts) {
  const enc = opts.encounter || ENCOUNTERS[opts.encounterId];
  if (!enc) throw new Error('Unknown encounter ' + opts.encounterId);
  const s = {
    v: 1, encounterId: opts.encounterId, attempt: opts.attempt || 1,
    seed: opts.seed != null ? opts.seed >>> 0 : battleSeed(opts.encounterId, opts.attempt || 1),
    rng: 0, chapter: opts.chapter || enc.chapter || 1, difficulty: opts.difficulty || 'warrior',
    level: opts.level || 1, partySize: enc.partySize || 4, flagsKnown: opts.flags || [],
    encounter: clone(enc), round: 0, stage: 'command', over: false, result: null, scripted: false,
    party: [], enemies: [], items: { ...(opts.items || {}) }, itemsUsed: {},
    flags: { eyeOpen: false }, commands: {}, queue: [], awaiting: null, claims: {},
    lastCommands: {}, lastCommand: null, currentTarget: {}, initRoll: {}, letters: {}, firedHooks: [],
    scanned: { ...(opts.bestiary || {}) }, loot: { stolen: [], drops: [], gold: 0 }, rewards: null,
    log: [], lastEvents: [], eyeLog: [], round1Down: [], stats: { damageTaken: 0, damageDealt: 0 },
  };
  s.rng = s.seed;
  __s = s;
  const level = s.level;
  const members = (opts.party || []).filter((p) => !p.frozen && !MEMBERS[p.id].guest && (!enc.party || enc.party.includes(p.id)));
  members.sort((a, b) => PARTY_ORDER.indexOf(a.id) - PARTY_ORDER.indexOf(b.id));
  for (const p of members) s.party.push(makePartyUnit(p, level));
  if (enc.guest) s.party.push(makeGuestUnit(enc.guest.id, enc.guest.level));
  // instance names: sprite base, lettered when an enemy id appears more than once
  const counts = {};
  for (const en of enc.enemies) counts[en.enemy] = (counts[en.enemy] || 0) + 1;
  for (const en of enc.enemies) {
    const base = spriteBase(ENEMIES[en.enemy].sprite);
    let name = base;
    if (counts[en.enemy] > 1) name = base + '-' + nextLetter(s, base);
    const u = makeEnemyUnit(s, en.enemy, en, name);
    s.enemies.push(u);
    for (const part of ENEMIES[en.enemy].parts || []) {
      const pu = makeEnemyUnit(s, part.enemy, { tier: en.tier, role: part.role, mult: part.mult }, part.name, { sprite: part.sprite, mirror: part.mirror, partOf: u.key });
      u.parts.push(pu.key);
      s.enemies.push(pu);
    }
  }
  for (const u of s.enemies) applyPhase(s, u, 0, null);
  const ev = [];
  if (enc.tutorial) s.tutorial = enc.tutorial;
  beginRound(s, ev);
  s.lastEvents = ev; s.log.push(...ev);
  return s;
}

function nextLetter(s, base) {
  const i = s.letters[base] || 0;
  s.letters[base] = i + 1;
  return 'abcdefghij'[i];
}

// ───────────────────────── queries ─────────────────────────
const living = (arr) => arr.filter((u) => u.alive && !u.fled);
const nonGuest = (s) => s.party.filter((u) => !u.guest);
export function unitByName(s, name) { return s.party.find((u) => u.name === name) || s.enemies.find((u) => u.name === name) || null; }
const has = (u, id) => u.statuses.some((x) => x.id === id);
const getStatus = (u, id) => u.statuses.find((x) => x.id === id);
const hpPct = (u) => (u.maxHp ? (u.hp / u.maxHp) * 100 : 0);
function rootBoss(s) { return s.enemies.find((u) => !u.partOf && !u.summonedBy && ENEMIES[u.id].phases) || s.enemies.find((u) => !u.partOf && !u.summonedBy && u.role === 'boss'); }

function effAtk(u) {
  let pct = 0;
  for (const x of u.statuses) if (x.stat === 'atk') pct += x.pct;
  return u.atk * (1 + pct / 100);
}
function effDef(u) {
  let pct = 0;
  for (const x of u.statuses) { const p = x.stat === 'def' ? x.pct : (STATUS_INFO[x.id]?.stat === 'def' ? STATUS_INFO[x.id].pct : 0); pct += p; }
  return Math.max(0, u.def * (1 + pct / 100));
}
function effAgi(u) { return u.agi * (has(u, 'drowsy') ? 0.5 : 1); }
function effEvasion(u) {
  let best = 0;
  for (const x of u.statuses) if (x.stat === 'evasion') best = Math.max(best, x.pct);
  return (u.evasion || 0) + best;
}
function canAct(u) { return u.alive && !u.fled && !has(u, 'stilled') && !has(u, 'stun'); }

// ───────────────────────── round flow ─────────────────────────
function beginRound(s, ev) {
  if (s.over) return;
  s.round += 1;
  s.flags.eyeOpen = false;
  s.commands = {}; s.claims = {}; s.hitThisRound = {};
  s.stage = 'command';
  ev.push({ type: 'round', round: s.round, text: `Round ${s.round}.` });
  if (s.round === 1) s.fullAtStart = s.party.filter((u) => u.alive && u.hp >= u.maxHp).map((u) => u.key);
  // round hooks (start of round, before turns)
  for (const h of s.encounter.roundHooks || []) {
    const fire = (h.every && s.round % h.every === 0) || (h.rounds && h.rounds.includes(s.round));
    if (fire) runHook(s, ev, h.effect);
  }
  // auras
  for (const u of living(s.enemies)) {
    const a = ENEMIES[u.id].aura;
    if (!a) continue;
    const targets = a.target === 'party' ? living(s.party) : living(s.enemies);
    const res = [];
    for (const t of targets) {
      if (a.chance != null && rnd(s) >= a.chance) continue;
      res.push({ unit: t.name, ...applyStatus(s, t, { id: a.status, chance: 1, rounds: a.rounds || 2 }, u, true) });
    }
    ev.push({ type: 'aura', actor: u.name, status: a.status, targets: res,
      text: a.status === 'drowsy' ? 'The hum crawls into every skull. Eyelids droop.' + (res.some((r) => r.unaffected) ? ' Kord hears nothing at all.' : '') : `${the(u, true)} radiates ${a.status}.` });
  }
  // enemy plans
  for (const u of living(s.enemies)) {
    u.plan = null;
    if (u.pending) { u.plan = { move: u.pending.move, target: u.pending.target, telegraphed: true }; u.pending = null; u.telegraphedLastRound = true; }
    else { u.telegraphedLastRound = false; const c = chooseMove(s, u, s.round, false); if (c) { u.plan = c; if (c.ruleIdx != null && c.once) u.firedRules.push(c.ruleIdx); } }
    // moves that set a flag (the Eye) resolve at once so commands can see them
    if (u.plan && MOVES[u.plan.move].setFlag) { doSetFlag(s, ev, u, MOVES[u.plan.move]); u.plan.done = true; }
  }
  if (s.flags.eyeOpen) s.eyeLog.push({ round: s.round, stilled: nonGuest(s).filter((u) => u.alive && has(u, 'stilled')).map((u) => u.key) });
  // turn-order rolls (AGI + seeded 0..3)
  for (const u of [...s.party, ...s.enemies]) s.initRoll[u.key] = rnd(s) * 3;
  // tutorial prompt
  if (s.tutorial) { const t = s.tutorial.find((x) => x.round === s.round); if (t) ev.push({ type: 'tutorial', text: t.text }); }
  // command queue: non-guest members able to act; the guest picks by itself
  s.queue = s.party.filter((u) => !u.guest && u.alive).map((u) => u.key);
  for (const u of s.party) {
    if (!u.alive) continue;
    if (has(u, 'stilled') || has(u, 'stun')) { s.queue = s.queue.filter((k) => k !== u.key); continue; }
    if (u.guest) s.commands[u.key] = guestCommand(s, u);
  }
  s.telegraph = s.enemies.some((u) => u.alive && u.plan && u.plan.telegraphed);
  advanceQueue(s, ev);
}

function advanceQueue(s, ev) {
  while (s.queue.length && !s.over) {
    const k = s.queue[0];
    const u = unitByName(s, k);
    if (!u || !canAct(u)) { s.queue.shift(); continue; }
    s.awaiting = k;
    return;
  }
  s.awaiting = null;
  if (!s.over) resolveRound(s, ev);
}

function actionActsFirst(s, u, cmd) {
  if (!cmd) return false;
  if (cmd.act === 'attack') return !!(u.weapon && u.weapon.actsFirst);
  if (cmd.act === 'skill') return !!SKILLS[cmd.skill]?.actsFirst;
  if (cmd.act === 'move') return !!MOVES[cmd.move]?.actsFirst;
  return false;
}

export function turnOrder(s) {
  const entries = [];
  for (const u of living(s.party)) {
    const cmd = s.commands[u.key];
    entries.push({ u, group: actionActsFirst(s, u, cmd) ? 0 : 1 });
  }
  for (const u of living(s.enemies)) {
    if (!u.plan || u.plan.done) { entries.push({ u, group: 1 }); continue; }
    const mv = MOVES[u.plan.move];
    entries.push({ u, group: u.plan.telegraphed ? 2 : mv.actsFirst ? 0 : 1 });
  }
  entries.sort((a, b) => a.group - b.group || (effAgi(b.u) + (a.group === 1 ? s.initRoll[b.u.key] || 0 : 0)) - (effAgi(a.u) + (a.group === 1 ? s.initRoll[a.u.key] || 0 : 0)) || (a.u.side === 'party' ? -1 : 1));
  return entries.map((e) => e.u.name);
}

function resolveRound(s, ev) {
  s.stage = 'resolve';
  const order = turnOrder(s);
  for (const name of order) {
    if (s.over) break;
    const u = unitByName(s, name);
    if (!u || !u.alive || u.fled) continue;
    if (has(u, 'stilled')) { ev.push({ type: 'skip', unit: u.name, reason: 'stilled', text: `${the(u, true)} stands frozen, eyes open.` }); continue; }
    if (has(u, 'stun')) {
      u.statuses = u.statuses.filter((x) => x.id !== 'stun');
      if (u.side === 'enemy' && u.plan && u.plan.telegraphed) ev.push({ type: 'skip', unit: u.name, reason: 'stun', text: `${the(u, true)} is stunned. The big move fizzles!` });
      else ev.push({ type: 'skip', unit: u.name, reason: 'stun', text: `${the(u, true)} is stunned and loses the turn.` });
      continue;
    }
    if (u.side === 'party') {
      const cmd = s.commands[u.key];
      if (!cmd) continue;
      u.ownTurns++;
      executePartyCommand(s, ev, u, cmd);
    } else {
      if (!u.plan || u.plan.done) continue;
      u.ownTurns++;
      executeEnemyMove(s, ev, u, u.plan);
    }
    if (s.over) break;
    // bleed: damage when acting
    if (u.alive && has(u, 'bleed') && !(cmdIsPassive(s, u))) {
      const d = Math.max(1, Math.round(u.maxHp * (BIG_ROLES.includes(u.role) ? 0.01 : 0.05)));
      const r = dealDamage(s, ev, u, d, null);
      ev.push({ type: 'tick', unit: u.name, status: 'bleed', damage: d, died: r.died, text: `${the(u, true)} bleeds for ${d}.` });
      checkEnd(s, ev);
    }
  }
  if (!s.over) endRound(s, ev);
}
function cmdIsPassive(s, u) { const c = s.commands[u.key]; return u.side === 'party' && c && c.act === 'defend'; }

function endRound(s, ev) {
  // poison and regen
  for (const u of [...s.party, ...s.enemies]) {
    if (!u.alive || u.fled) continue;
    if (has(u, 'poison')) {
      const d = Math.max(1, Math.round(u.maxHp * (BIG_ROLES.includes(u.role) ? 0.01 : 0.05)));
      const r = dealDamage(s, ev, u, d, null);
      ev.push({ type: 'tick', unit: u.name, status: 'poison', damage: d, died: r.died, text: `Poison burns ${the(u)} for ${d}.` });
    }
    if (u.alive && u.regenPct) {
      const h = heal(u, Math.round(u.maxHp * u.regenPct / 100));
      if (h) ev.push({ type: 'tick', unit: u.name, status: 'regen', heal: h, text: `The scarab pulses: ${the(u)} regains ${h}.` });
    }
  }
  checkEnd(s, ev);
  if (s.over) return;
  // status timers (stun is consumed by skipping, stilled lasts until cured)
  for (const u of [...s.party, ...s.enemies]) {
    const before = u.statuses.map((x) => x.id);
    u.statuses = u.statuses.filter((x) => {
      if (x.id === 'guard') return false;
      if (x.id === 'stun' || x.id === 'stilled') return true;
      x.rounds -= 1;
      return x.rounds > 0;
    });
    const gone = before.filter((id) => id !== 'guard' && !u.statuses.some((x) => x.id === id));
    if (gone.length && u.alive) ev.push({ type: 'status', unit: u.name, removed: gone, text: '' });
  }
  s.flags.eyeOpen = false;
  // telegraphs: decided now, announced, used next round (and last in it)
  for (const u of living(s.enemies)) {
    const c = chooseMove(s, u, s.round + 1, true);
    if (c && MOVES[c.move].telegraph) {
      u.pending = c;
      if (c.ruleIdx != null && c.once) u.firedRules.push(c.ruleIdx);
      ev.push({ type: 'telegraph', actor: u.name, move: c.move, text: MOVES[c.move].telegraph });
    }
  }
  if (s.round >= 60) { finish(s, ev, 'lost', 'The fight drags on until no one can lift an arm.'); return; }
  beginRound(s, ev);
}

// ───────────────────────── enemy AI ─────────────────────────
function phaseMoves(u) {
  const ph = ENEMIES[u.id].phases;
  return ph ? ph[u.phaseIdx].moves : null;
}
function chooseMove(s, u, round, allowTelegraph) {
  const e = ENEMIES[u.id];
  if (e.flags.noAttack) return { move: e.ai[0]?.move || 'hum', target: 'self' };
  const pm = phaseMoves(u);
  for (let i = 0; i < e.ai.length; i++) {
    const r = e.ai[i];
    const mv = MOVES[r.move];
    if (!mv) continue;
    if (pm && !pm.includes(r.move)) continue;
    if (mv.telegraph && !allowTelegraph) continue;
    const once = r.when && whenHasOnce(r.when);
    if (once && u.firedRules.includes(i)) continue;
    if (mv.summon && summonCount(s, u, mv.summon.enemy) >= mv.summon.max) continue;
    if ((r.target || mv.target) === 'one_nonimmune' && !nonImmuneTargets(s, u, mv).length) continue;
    if (r.move === 'heal_ally' && !living(s.enemies).some((x) => hpPct(x) < 100)) continue;
    if (r.when && !evalWhen(s, r.when, { unit: u, side: 'enemy', round })) continue;
    return { move: r.move, target: r.target || mv.target, ruleIdx: i, once };
  }
  return null;
}
function whenHasOnce(w) {
  if (!w || typeof w !== 'object') return false;
  if (w.once) return true;
  return ['all', 'any'].some((k) => Array.isArray(w[k]) && w[k].some(whenHasOnce)) || (w.not ? whenHasOnce(w.not) : false);
}
function summonCount(s, u, enemyId) { return living(s.enemies).filter((x) => x.summonedBy === u.key && x.id === enemyId).length; }

const CMP = (v, c) => (c.lt != null ? v < c.lt : true) && (c.lte != null ? v <= c.lte : true) && (c.gt != null ? v > c.gt : true)
  && (c.gte != null ? v >= c.gte : true) && (c.eq != null ? v === c.eq : true);

// The closed `when` vocabulary (DATA_SPEC §10). ctx: {unit, side:'enemy'|'party', round}
export function evalWhen(s, w, ctx) {
  if (!w) return true;
  const u = ctx.unit;
  const round = ctx.round ?? s.round;
  const mine = ctx.side === 'enemy' ? s.enemies : s.party;
  const theirs = ctx.side === 'enemy' ? s.party : s.enemies;
  for (const k of Object.keys(w)) {
    const v = w[k];
    let ok = true;
    switch (k) {
      case 'once': break;
      case 'all': ok = v.every((x) => evalWhen(s, x, ctx)); break;
      case 'any': ok = v.some((x) => evalWhen(s, x, ctx)); break;
      case 'not': ok = !evalWhen(s, v, ctx); break;
      case 'every': ok = round % v === 0; break;
      case 'rounds': ok = v.includes(round); break;
      case 'notOnRounds': ok = !v.includes(round); break;
      case 'hpPctBelow': ok = u ? hpPct(u) < v : false; break;
      case 'allyHpBelow': ok = living(mine).filter((x) => ctx.side === 'enemy' || !x.guest).some((x) => hpPct(x) < v); break;
      case 'alliesAlive': ok = CMP(living(mine).filter((x) => x !== u).length, v); break;
      case 'partsAlive': {
        const n = ctx.side === 'enemy' && u ? u.parts.filter((p) => { const x = unitByName(s, p); return x && x.alive; }).length
          : living(s.enemies).filter((x) => x.partOf).length;
        ok = CMP(n, v); break;
      }
      case 'phase': {
        const b = ctx.side === 'enemy' ? u : rootBoss(s);
        ok = b ? b.phaseIdx + 1 === v : v === 1; break;
      }
      case 'afterTelegraph': ok = !!(u && u.telegraphedLastRound) === !!v; break;
      case 'targetHas': ok = living(theirs).some((x) => has(x, v)); break;
      case 'chance': ok = rnd(s) < v; break;
      case 'telegraph': ok = !!s.telegraph === !!v; break;
      case 'eyeOpen': ok = !!s.flags.eyeOpen === !!v; break;
      case 'allyHas': ok = living(s.party).some((x) => has(x, v)); break;
      case 'allyDown': ok = s.party.some((x) => !x.guest && !x.alive) === !!v; break;
      case 'enemyHas': ok = living(s.enemies).some((x) => (v.aiRole ? x.aiRole === v.aiRole : true) && (v.status ? has(x, v.status) : true) && (v.id ? x.id === v.id : true)); break;
      default: throw new Error('Unknown when form: ' + k);
    }
    if (!ok) return false;
  }
  return true;
}

function partyTargetsFor(s, actor) {
  const nt = ENEMIES[actor.id]?.flags?.neverTarget || [];
  const pool = living(s.party).filter((x) => !nt.includes(x.id));
  // nobody else left standing: neverTarget gives way (else the fight can stall with only Ain up)
  return pool.length ? pool : living(s.party);
}
function nonImmuneTargets(s, actor, mv) {
  const sid = mv.status?.id;
  return partyTargetsFor(s, actor).filter((x) => !x.immune.includes(sid) && !has(x, sid));
}
function pickEnemyTargets(s, u, plan) {
  const mv = MOVES[plan.move];
  const shape = plan.target || mv.target;
  const pool = partyTargetsFor(s, u);
  if (!pool.length && !['self', 'ally', 'ally_lowest_hp'].includes(shape)) return [];
  const taunter = pool.find((x) => has(x, 'taunt'));
  const single = (list) => (mv.mult != null && taunter ? [taunter] : list);
  switch (shape) {
    case 'all': return pool;
    case 'party': return living(s.enemies);
    case 'self': return [u];
    case 'ally': return [pick(s, living(s.enemies))];
    case 'ally_lowest_hp': return [living(s.enemies).reduce((a, b) => (hpPct(b) < hpPct(a) ? b : a))];
    case 'highest_hp': return single([pool.reduce((a, b) => (b.hp > a.hp ? b : a))]);
    case 'lowest_hp': return single([pool.reduce((a, b) => (b.hp < a.hp ? b : a))]);
    case 'one_nonimmune': { const l = nonImmuneTargets(s, u, mv); return l.length ? [pick(s, l)] : []; }
    default: return single([spreadPick(s, pool)]);
  }
}
// Random single targets prefer members not yet attacked this round (no freak focus-fire).
function spreadPick(s, pool) {
  const w = pool.map((x) => ((s.hitThisRound || {})[x.key] ? (s.round === 1 ? 0 : 0.3) : 1));
  if (!w.some((x) => x > 0)) w.fill(1);
  let r = rnd(s) * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < pool.length; i++) { r -= w[i]; if (r <= 0) return pool[i]; }
  return pool[pool.length - 1];
}

function executeEnemyMove(s, ev, u, plan) {
  const mv = MOVES[plan.move];
  const targets = pickEnemyTargets(s, u, plan);
  s.hitThisRound = s.hitThisRound || {};
  if (mv.mult != null && targets.length === 1) s.hitThisRound[targets[0].key] = true;
  performMove(s, ev, u, { ...mv, id: plan.move }, targets, { source: 'enemy' });
}

function doSetFlag(s, ev, u, mv) {
  s.flags[mv.setFlag] = true;
  ev.push({ type: 'eye', actor: u.name, flag: mv.setFlag, open: true, speaker: mv.speaker || null, text: mv.text || '' });
}

// ───────────────────────── hooks ─────────────────────────
function runHook(s, ev, effect) {
  if (effect === 'stone_heals' || effect === 'ain_breaks_through') {
    const res = [];
    for (const t of living(s.party)) {
      const h = heal(t, Math.round(t.maxHp * 0.2));
      const removed = [];
      if (effect === 'ain_breaks_through' && has(t, 'stilled')) { t.statuses = t.statuses.filter((x) => x.id !== 'stilled'); removed.push('stilled'); }
      res.push({ unit: t.name, heal: h, statusesRemoved: removed, hp: t.hp, maxHp: t.maxHp });
    }
    const n = s.firedHooks.filter((x) => x === effect).length;
    s.firedHooks.push(effect);
    const text = effect === 'stone_heals'
      ? '"Hold, thief." A woman\'s voice from the cage of blue fire; a teal pulse washes over the party.'
      : AIN_LINES[n % AIN_LINES.length];
    ev.push({ type: 'hook', effect, speaker: 'ain', targets: res, text });
  }
}

// ───────────────────────── damage, statuses, healing ─────────────────────────
function typeMult(target, type) {
  if (!type || type === 'weapon' || type === 'wonder') return { m: 1, tag: null };
  if (target.immune.includes(type)) return { m: 0, tag: 'immune' };
  if (target.weak.includes(type)) return { m: 1.5, tag: 'weak' };
  if (target.resist.includes(type) || target.resistTypes.includes(type)) return { m: 0.5, tag: 'resist' };
  return { m: 1, tag: null };
}
function hitChance(att, tgt) {
  let h = clamp(95 - (effAgi(tgt) - effAgi(att)) / 2, 70, 99);
  if (has(att, 'blind')) h -= 40;
  h -= effEvasion(tgt);
  return clamp(h, 10, 99) / 100;
}
function critChance(att) {
  const base = att.side === 'enemy' ? 5 + effAgi(att) / 8 : 5 + effAgi(att) / 4;
  return (base + (att.crit || 0)) / 100;
}

// One physical hit (or the expected value of one when est=true).
function physicalHit(s, att, tgt, mv, est = false) {
  const power = att.weapon ? att.weapon.power : 0;
  let type = mv.type === 'weapon' || !mv.type ? (att.weapon ? att.weapon.type : att.attackType) : mv.type;
  const tm = typeMult(tgt, type);
  let dmg = (effAtk(att) + power) * mv.mult - effDef(tgt) * 0.5;
  dmg = Math.max(1, dmg) * tm.m;
  if (att.weapon && att.weapon.vs && tgt.tags.includes(att.weapon.vs.tag)) dmg *= 1 + att.weapon.vs.pct / 100;
  if (att.side === 'party' && tgt.tags.includes('flyer') && !(att.weapon && att.weapon.flyers) && !mv.flyers) dmg *= 0.5;
  if (s.flags.eyeOpen && att.side === 'party' && tgt.side === 'enemy') dmg *= 3;
  if (has(tgt, 'guard')) dmg *= 0.5;
  const hc = mv.noMiss ? 1 : hitChance(att, tgt);
  const cc = critChance(att);
  if (est) return { dmg: tm.m === 0 ? 0 : dmg * hc * (1 + cc * 0.75), type, tag: tm.tag };
  if (rnd(s) >= hc) return { miss: true, type, tag: tm.tag };
  dmg *= 0.9 + rnd(s) * 0.2;
  const crit = tm.m > 0 && rnd(s) < cc;
  if (crit) dmg *= 1.75;
  const out = tm.m === 0 ? 0 : Math.max(1, Math.round(dmg));
  return { dmg: out, crit, type, tag: tm.tag };
}
function wonderHit(s, att, tgt, mv, est = false) {
  const type = mv.type === 'wonder' ? null : mv.type;
  const tm = typeMult(tgt, type);
  let dmg = (att.wil * 1.6 + (mv.spellPower || 0)) * (mv.side === 'enemy' ? mv.mult || 1 : 1) * tm.m - tgt.wil * 0.4;
  dmg = Math.max(1, dmg) * (mv.perTarget && mv.target === 'all' ? mv.perTarget : 1);
  if (s.flags.eyeOpen && att.side === 'party' && tgt.side === 'enemy') dmg *= 3;
  if (has(tgt, 'guard')) dmg *= 0.5;
  if (est) return { dmg: tm.m === 0 ? 0 : dmg, type, tag: tm.tag };
  dmg *= 0.9 + rnd(s) * 0.2;
  return { dmg: tm.m === 0 ? 0 : Math.max(1, Math.round(dmg)), crit: false, type, tag: tm.tag };
}

function heal(u, amount) {
  if (!u.alive) return 0;
  const before = u.hp;
  u.hp = Math.min(u.maxHp, u.hp + Math.max(0, Math.round(amount)));
  return u.hp - before;
}

// Apply damage; handles floors (duel), yields, flight, death, phases, parts and summons falling.
function dealDamage(s, ev, u, amount, source) {
  const r = { died: false, fled: false, yielded: false };
  if (!u.alive) return r;
  const floor1 = (s.encounter.endsWhen === 'anyBelowPct' && u.side === 'party') || (u.side === 'enemy' && ENEMIES[u.id].flags.endsAtPct != null);
  u.hp = Math.max(floor1 ? 1 : 0, u.hp - amount);
  if (u.side === 'party') s.stats.damageTaken += amount; else s.stats.damageDealt += amount;
  if (u.side === 'enemy') {
    const fl = ENEMIES[u.id].flags;
    if (fl.yieldsAt != null && hpPct(u) <= fl.yieldsAt) {
      u.hp = 0; u.alive = false; u.yielded = true; r.yielded = true;
      ev.push({ type: 'yield', unit: u.name, text: ENEMIES[u.id].yieldText || `${the(u, true)} gives up.` });
      return r;
    }
    if (fl.fleesAt != null && u.hp > 0 && hpPct(u) < fl.fleesAt) {
      u.fled = true; u.alive = false; r.fled = true;
      ev.push({ type: 'flee', unit: u.name, text: ENEMIES[u.id].fleeText || `${the(u, true)} runs for it!` });
      if (s.encounter.endsWhen === 'enemyFlees') finish(s, ev, 'won', null);
      return r;
    }
  }
  if (u.hp <= 0) {
    u.alive = false; u.hp = 0; r.died = true; u.statuses = [];
    if (u.side === 'party') {
      ev.push({ type: 'death', unit: u.name, text: u.guest ? `${u.label} goes down on one knee, still humming.` : `${u.label} falls!` });
      if (s.round === 1 && (s.fullAtStart || []).includes(u.key)) s.round1Down.push(u.key);
    } else {
      ev.push({ type: 'death', unit: u.name, text: deathLine(u) });
      rollDrops(s, ev, u);
      // parts fall with the root; summons fade with the summoner
      for (const x of s.enemies) {
        if (x.alive && (x.partOf === u.key || x.summonedBy === u.key)) {
          x.alive = false; x.hp = 0;
          ev.push({ type: 'death', unit: x.name, text: x.partOf ? `${the(x, true)} crashes to the floor, lifeless.` : `${the(x, true)} comes apart like smoke.` });
        }
      }
    }
  } else if (u.side === 'enemy') {
    checkPhase(s, ev, u);
  }
  return r;
}
function deathLine(u) {
  const t = u.tags;
  if (t.includes('machine')) return `${the(u, true)} grinds to a halt and topples.`;
  if (t.includes('spirit')) return `${the(u, true)} tears apart into nothing.`;
  if (t.includes('undead')) return `${the(u, true)} falls to dust and rags.`;
  if (t.includes('beast')) return `${the(u, true)} shudders and lies still.`;
  return `${the(u, true)} goes down and stays down.`;
}
function rollDrops(s, ev, u) {
  for (const d of ENEMIES[u.id].drops || []) {
    if (u.summonedBy) continue;
    if (rnd(s) < d.chance) {
      s.loot.drops.push(d.item);
      ev.push({ type: 'drop', unit: u.name, item: d.item, text: `${the(u, true)} drops ${ITEMS[d.item]?.name || d.item}.` });
    }
  }
}

function checkPhase(s, ev, u) {
  const ph = ENEMIES[u.id].phases;
  if (!ph) return;
  let idx = 0;
  for (let i = 0; i < ph.length; i++) if (i === 0 || hpPct(u) <= ph[i].atHpPct) idx = i;
  if (idx > u.phaseIdx) applyPhase(s, u, idx, ev);
}
function applyPhase(s, u, idx, ev) {
  const e = ENEMIES[u.id];
  const ph = e.phases ? e.phases[idx] : null;
  u.phaseIdx = idx;
  if (!ph) return;
  const m = ph.mult || {};
  u.atk = Math.round(u.base.atk * (m.atk ?? 1));
  u.def = Math.round(u.base.def * (m.def ?? 1));
  u.agi = Math.round(u.base.agi * (m.agi ?? 1));
  u.wil = Math.round(u.base.wil * (m.wil ?? 1));
  if (ph.sprite) u.sprite = ph.sprite;
  u.tags = ph.tags ? [...new Set([...e.tags.filter((t) => t === 'flyer'), ...ph.tags])] : [...e.tags];
  u.weak = ph.weak ? [...ph.weak] : [...e.weak];
  u.resist = ph.resist ? [...ph.resist] : [...e.resist];
  u.immune = ph.immune ? [...ph.immune] : [...e.immune];
  if (u.pending && !ph.moves.includes(u.pending.move)) u.pending = null;
  if (u.plan && !u.plan.done && !ph.moves.includes(u.plan.move)) u.plan = null;
  if (ev && idx > 0) ev.push({ type: 'phase', unit: u.name, phase: idx + 1, sprite: u.sprite, text: ph.text || `${the(u, true)} changes!` });
}

// Apply a status (returns {added, unaffected, resisted}).
function applyStatus(s, t, st, source, silentFail = false) {
  if (!t.alive) return {};
  if (t.immune.includes(st.id)) return { unaffected: st.id };
  let chance = st.chance ?? 1;
  if (t.resist.includes(st.id)) chance *= 0.5;
  if (st.id === 'stun' && BIG_ROLES.includes(t.role)) chance *= 0.5;
  if (rnd(s) >= chance) return { resisted: st.id };
  const ex = getStatus(t, st.id);
  if (ex) { ex.rounds = Math.max(ex.rounds, st.rounds || 1); if (st.counters) ex.counters = st.counters; return { added: st.id, refreshed: true }; }
  const x = { id: st.id, rounds: st.rounds || 1 };
  if (st.counters) x.counters = st.counters;
  t.statuses.push(x);
  return { added: st.id };
}
function applyBuff(t, b) {
  const id = b.id || (b.stat === 'atk' ? 'rage' : b.stat === 'def' ? (b.pct > 0 ? 'aegis' : 'weigh') : 'mirage');
  const ex = getStatus(t, id);
  if (ex) { ex.rounds = Math.max(ex.rounds, b.rounds); ex.pct = b.pct; return id; }
  t.statuses.push({ id, rounds: b.rounds, stat: b.stat, pct: b.pct });
  return id;
}

// ───────────────────────── the generic move resolver ─────────────────────────
// Used by enemy moves, guest moves, party skills and scroll items. mv carries MOVES/SKILLS fields.
function performMove(s, ev, actor, mv, targets, opts = {}) {
  const results = [];
  const e = { type: 'action', actor: actor.name, action: { kind: opts.kind || (actor.side === 'enemy' ? 'move' : 'skill'), id: mv.id, name: mv.name },
    targets: results, text: '' };
  if (opts.counter) e.counter = true;
  ev.push(e);
  const extra = [];
  // damage
  if (mv.mult != null || mv.spellPower != null || mv.type === 'wonder') {
    const wonder = mv.spellPower != null || mv.type === 'wonder';
    let total = 0;
    for (const t of targets) {
      if (!t.alive) continue;
      const hits = mv.hits || 1;
      const r = { unit: t.name, damage: 0, hits: [], weak: false, resist: false, immune: false, miss: false, crit: false, statusesAdded: [], unaffected: [] };
      results.push(r);
      for (let h = 0; h < hits && t.alive; h++) {
        const res = wonder ? wonderHit(s, actor, t, { ...mv, side: actor.side }) : physicalHit(s, actor, t, mv);
        if (res.miss) { r.hits.push({ miss: true }); if (hits === 1) r.miss = true; continue; }
        r.hits.push({ damage: res.dmg, crit: res.crit });
        r.damage += res.dmg; total += res.dmg;
        if (res.crit) r.crit = true;
        if (res.tag === 'weak') r.weak = true; if (res.tag === 'resist') r.resist = true; if (res.tag === 'immune') r.immune = true;
        if (res.type && actor.side === 'party' && t.side === 'enemy' && res.dmg >= 0) learn(s, t, res.type, res.tag);
        const dr = dealDamage(s, ev, t, res.dmg, actor);
        if (dr.died) r.died = true; if (dr.fled) r.fled = true; if (dr.yielded) r.yielded = true;
        if (!t.alive) break;
        // weapon procs / enemy procs on physical hits
        if (!wonder && res.dmg > 0) {
          const procs = actor.side === 'party' ? (mv.type === 'weapon' || mv.isAttack ? actor.weapon?.procs || [] : []) : (mv.type === 'weapon' || mv.isAttack || ['strike', 'cut', 'claw', 'bite'].includes(mv.id) ? ENEMIES[actor.id]?.procs || [] : []);
          for (const p of procs) { const sr = applyStatus(s, t, { id: p.status, chance: p.chance, rounds: p.rounds || 3 }, actor); if (sr.added) r.statusesAdded.push(sr.added); }
          // counters (Riposte) against single-target physical hits
          if (!opts.counter && mv.target !== 'all' && has(t, 'riposte') && actor.alive && t.alive && !has(t, 'stilled') && !has(t, 'stun')) {
            const rp = getStatus(t, 'riposte');
            rp.counters = (rp.counters || 1) - 1;
            if (rp.counters <= 0) t.statuses = t.statuses.filter((x) => x !== rp);
            extra.push(() => {
              if (!t.alive || !actor.alive || s.over) return;
              const cm = { id: 'riposte_counter', name: 'Riposte', mult: 1.0, type: 'weapon', target: 'one', isAttack: true, noMiss: false };
              const before = ev.length;
              performMove(s, ev, t, cm, [actor], { counter: true, kind: 'counter' });
              const ce = ev[before];
              const cr = ce.targets[0];
              ce.text = cr && !cr.miss ? `${the(t, true)} turns the blow and ripostes: ${cr.damage} to ${the(actor)}!` : `${the(t, true)} ripostes, but ${the(actor)} twists away.`;
            });
          }
        }
        if (mv.drain && res.dmg > 0) { const hh = heal(actor, res.dmg * mv.drain); if (hh) r.drained = hh; }
      }
      if (t.alive && mv.status && !r.miss && !r.immune) {
        const sr = applyStatus(s, t, mv.status, actor);
        if (sr.added) r.statusesAdded.push(sr.added); if (sr.unaffected) r.unaffected.push(sr.unaffected);
      }
      r.hp = t.hp; r.maxHp = t.maxHp;
    }
    e.text = actionText(actor, mv, results, opts);
  } else {
    // non-damage effects
    for (const t of targets) {
      const r = { unit: t.name, statusesAdded: [], statusesRemoved: [], unaffected: [] };
      results.push(r);
      if (mv.revive != null) {
        if (!t.alive && !t.fled) { t.alive = true; t.hp = Math.max(1, Math.round(t.maxHp * mv.revive / 100)); t.statuses = []; r.revived = true; r.heal = t.hp; }
      }
      if (mv.heal && t.alive && !r.revived) {
        let amt = 0;
        if (mv.heal.pctMax) amt += t.maxHp * mv.heal.pctMax / 100;
        if (mv.heal.wilMult) amt += actor.wil * mv.heal.wilMult;
        if (mv.heal.flat) amt += mv.heal.flat;
        r.heal = heal(t, amt);
      }
      if (mv.cure && t.alive) {
        for (const c of mv.cure) if (has(t, c)) { t.statuses = t.statuses.filter((x) => x.id !== c); r.statusesRemoved.push(c); }
      }
      if (mv.buff && t.alive) r.statusesAdded.push(applyBuff(t, mv.buff));
      if (mv.status && t.alive) {
        const sr = applyStatus(s, t, mv.status, actor);
        if (sr.added) r.statusesAdded.push(sr.added); if (sr.unaffected) r.unaffected.push(sr.unaffected); if (sr.resisted) r.resisted = sr.resisted;
      }
      if (mv.restoreMp && t.alive) { const b = t.mp; t.mp = Math.min(t.maxMp, t.mp + mv.restoreMp); r.mp = t.mp - b; }
      if (mv.mpFull && t.alive) { r.mp = t.maxMp - t.mp; t.mp = t.maxMp; }
      r.hp = t.hp; r.maxHp = t.maxHp;
    }
    if (mv.taunt) { const x = applyStatus(s, actor, { id: 'taunt', chance: 1, rounds: mv.taunt }, actor); if (x.added && !results.some((r) => r.unit === actor.name)) results.push({ unit: actor.name, statusesAdded: ['taunt'] }); }
    if (mv.summon) doSummon(s, ev, actor, mv, e);
    if (mv.setFlag) { s.flags[mv.setFlag] = true; }
    e.text = actionText(actor, mv, results, opts);
  }
  for (const f of extra) f();
  checkEnd(s, ev);
  return e;
}

function learn(s, t, type, tag) {
  const k = t.id;
  const b = s.scanned[k] || (s.scanned[k] = { weak: [], resist: [], immune: [], full: false });
  if (tag && !b[tag].includes(type)) b[tag].push(type);
}

function doSummon(s, ev, actor, mv, e) {
  const sm = mv.summon;
  const room = Math.min(sm.n, sm.max - summonCount(s, actor, sm.enemy), 6 - living(s.enemies).length);
  const names = [];
  for (let i = 0; i < room; i++) {
    const base = spriteBase(ENEMIES[sm.enemy].sprite);
    // continue the letters of an enemy already lettered at battle start
    if (s.letters[base] == null) s.letters[base] = s.enemies.filter((x) => spriteBase(ENEMIES[x.id].sprite) === base).length;
    const name = base + '-' + nextLetter(s, base);
    const tier = sm.tier === 'same' ? actor.tier : sm.tier;
    const u = makeEnemyUnit(s, sm.enemy, { tier }, name, { summonedBy: actor.key });
    applyPhase(s, u, 0, null);
    s.enemies.push(u);
    names.push(name);
  }
  ev.push({ type: 'summon', actor: actor.name, units: names, text: '' });
  e.summoned = names;
}

function actionText(actor, mv, results, opts) {
  const A = the(actor, true);
  const T = (r) => the(unitByName0(r.unit));
  const isDamage = mv.mult != null || mv.spellPower != null || mv.type === 'wonder';
  if (!isDamage) {
    const parts = results.map((r) => {
      const t = unitByName0(r.unit);
      const bits = [];
      if (r.revived) bits.push(`${the(t, true)} is back on their feet (${r.heal} HP)`);
      else if (r.heal) bits.push(`${the(t, true)} +${r.heal} HP`);
      if (r.mp) bits.push(`${the(t, true)} +${r.mp} MP`);
      if (r.statusesRemoved?.length) bits.push(`${the(t, true)} shakes off ${r.statusesRemoved.join(' and ')}`);
      if (r.statusesAdded?.length && mv.status) bits.push(`${the(t, true)}: ${r.statusesAdded.join(', ')}`);
      if (r.unaffected?.length) bits.push(`${the(t, true)}: unaffected`);
      if (r.resisted) bits.push(`${the(t, true)} resists`);
      return bits.join(', ');
    }).filter(Boolean);
    let head;
    if (mv.text) head = mv.text;
    else if (mv.verb && results.length) head = `${A} ${mv.verb} ${results.map(T).join(' and ')}.`;
    else head = `${A} uses ${mv.name}.`;
    return head + (parts.length ? ' ' + parts.join('; ') + '.' : '');
  }
  const verb = opts.kind === 'attack' || opts.kind === 'counter' ? attackVerb(actor) : mv.verb || `uses ${mv.name} on`;
  const phrase = (r) => {
    if (r.miss) return 'but misses';
    if (r.immune) return 'to no effect';
    const hits = r.hits.filter((h) => !h.miss).map((h) => h.damage);
    let p = 'for ' + (hits.length > 1 ? hits.join(' + ') : String(r.damage));
    const tags = [];
    if (r.crit) tags.push('a crit!');
    if (r.weak) tags.push('weak spot');
    if (r.resist) tags.push('resisted');
    if (tags.length) p += ` (${tags.join(', ')})`;
    if (r.statusesAdded?.length) p += `, inflicting ${r.statusesAdded.join(' and ')}`;
    if (r.unaffected?.length) p += ` (unaffected by ${r.unaffected.join(', ')})`;
    if (r.drained) p += `, drinking ${r.drained} HP`;
    return p;
  };
  if (results.length === 1) {
    const r = results[0];
    return `${A} ${verb} ${T(r)}${r.miss ? ',' : ''} ${phrase(r)}.`;
  }
  const v = opts.kind === 'attack' ? attackVerb(actor) : mv.verb ? mv.verb : `uses ${mv.name} on`;
  return `${A} ${v} everyone: ${results.map((r) => `${T(r)} ${r.miss ? 'dodges' : phrase(r).replace(/^for /, '')}`).join('; ')}.`;
}
let __s = null; // the state being resolved (for log text lookups only)
function unitByName0(n) { return unitByName(__s, n) || { label: n, side: 'enemy', tags: [] }; }
const cap = (t) => (t ? t[0].toUpperCase() + t.slice(1) : t);
function attackVerb(u) {
  if (u.side === 'enemy') return 'attacks';
  const t = u.weapon?.type;
  if (u.id === 'ain') return 'pulses a spark at';
  if (u.guest) return 'swings the Kushite maul at';
  return { slash: 'slashes', pierce: u.weapon?.flyers ? 'looses an arrow at' : 'runs through', crush: 'smashes', shock: 'shocks', fire: 'scorches' }[t] || 'attacks';
}

// ───────────────────────── party commands ─────────────────────────
// cmd: {act:'attack'|'skill'|'item'|'defend'|'flee', target?, skill?, item?}
function executePartyCommand(s, ev, u, cmd) {
  if (cmd.act === 'defend') return; // took effect when chosen
  if (cmd.act === 'flee') return doFlee(s, ev, u);
  if (cmd.act === 'attack') {
    const t = resolveEnemyTarget(s, u, cmd.target);
    if (!t) return;
    const mv = u.guest ? { ...MOVES.maul_swing, id: 'maul_swing' } : { id: 'attack', name: 'Attack', mult: 1.0, type: 'weapon', target: 'one', isAttack: true };
    if (u.id === 'ain' && !u.guest) mv.type = 'shock';
    performMove(s, ev, u, mv, [t], { kind: u.guest ? 'skill' : 'attack' });
    return;
  }
  if (cmd.act === 'move') { // guest moves
    const mv = { ...MOVES[cmd.move], id: cmd.move };
    const targets = mv.target === 'party' ? living(s.party) : [resolveEnemyTarget(s, u, cmd.target)].filter(Boolean);
    performMove(s, ev, u, mv, targets, { kind: 'skill' });
    return;
  }
  if (cmd.act === 'skill') return doSkill(s, ev, u, cmd);
  if (cmd.act === 'item') return doItem(s, ev, u, cmd);
}

function resolveEnemyTarget(s, u, name) {
  let t = name && unitByName(s, name);
  if (t && t.side === 'enemy' && t.alive) return t;
  const alive = living(s.enemies);
  if (!alive.length) return null;
  return autoEnemyTarget(s, u) || alive[0];
}
function resolveAllyTarget(s, u, name, wantDown = false) {
  let t = name && unitByName(s, name);
  if (t && t.side === 'party' && (wantDown ? !t.alive : t.alive)) return t;
  if (wantDown) return s.party.find((x) => !x.alive && !x.guest) || null;
  const al = living(s.party);
  return al.reduce((a, b) => (hpPct(b) < hpPct(a) ? b : a), al[0]);
}

function skillCost(u, sk) {
  if (sk.scan && u.scanFree) return 0;
  return sk.mp;
}

function doSkill(s, ev, u, cmd) {
  const sk = SKILLS[cmd.skill];
  const cost = skillCost(u, sk);
  if (u.mp < cost) { ev.push({ type: 'fizzle', unit: u.name, text: `${u.label} has no strength left for ${sk.name}.` }); return; }
  u.mp -= cost;
  if (sk.hpPct) u.hp = Math.max(1, u.hp - Math.round(u.maxHp * sk.hpPct / 100));
  const mv = { ...sk, id: cmd.skill };
  let targets = [];
  switch (sk.target) {
    case 'one': targets = [resolveEnemyTarget(s, u, cmd.target)].filter(Boolean); break;
    case 'all': targets = living(s.enemies); break;
    case 'self': targets = [u]; break;
    case 'ally': targets = [resolveAllyTarget(s, u, cmd.target)].filter(Boolean); break;
    case 'ally_down': targets = [resolveAllyTarget(s, u, cmd.target, true)].filter(Boolean); break;
    case 'party': targets = living(s.party); break;
    default: targets = [];
  }
  if (sk.steal) doSteal(s, ev, u, targets[0]);
  else if (sk.scan) doScan(s, ev, u, targets[0]);
  else if (sk.gambit) doGambit(s, ev, u);
  else {
    if (sk.target === 'ally_down' && !targets.length) { ev.push({ type: 'fizzle', unit: u.name, text: `${u.label} reaches for the fallen, but no one has fallen.` }); u.mp += cost; return; }
    const e = performMove(s, ev, u, mv, targets, { kind: 'skill' });
    if (sk.id === undefined) e.action.id = cmd.skill;
  }
  // onPlayerSkill hooks
  for (let i = 0; i < (s.encounter.onPlayerSkill || []).length; i++) {
    const h = s.encounter.onPlayerSkill[i];
    if (h.skill !== cmd.skill) continue;
    const boss = rootBoss(s);
    if (h.phase && (!boss || boss.phaseIdx + 1 !== h.phase)) continue;
    const key = 'ops' + i;
    if (h.once && s.firedHooks.includes(key)) continue;
    s.firedHooks.push(key);
    for (const eff of h.effects || []) {
      if (eff.guest && !s.party.some((x) => x.id === eff.guest)) {
        const g = makeGuestUnit(eff.guest, eff.level);
        s.party.push(g);
        s.initRoll[g.key] = 0;
        ev.push({ type: 'guest', unit: g.name, id: eff.guest, level: eff.level, speaker: eff.guest, text: h.text || `${g.label} joins the fight!` });
      }
    }
  }
}

function doSteal(s, ev, u, t) {
  if (!t) return;
  const st = ENEMIES[t.id].steal;
  const e = { type: 'steal', actor: u.name, target: t.name, item: null, text: '' };
  if (!st || t.stolen) { e.text = `${u.label} pats ${the(t)} down. Nothing worth taking.`; ev.push(e); return; }
  const chance = clamp(50 + (effAgi(u) - effAgi(t)), 20, 90) / 100 * (st.chance ?? 1);
  if (rnd(s) < chance) {
    t.stolen = true; e.item = st.item;
    s.items[st.item] = (s.items[st.item] || 0) + 1;
    s.loot.stolen.push(st.item);
    e.text = `${u.label} lifts ${ITEMS[st.item]?.name || st.item} off ${the(t)}. Neat.`;
  } else e.text = `${u.label} grabs at ${the(t)} and comes away with nothing.`;
  ev.push(e);
}
function doScan(s, ev, u, t) {
  if (!t) return;
  const b = s.scanned[t.id] = { weak: [...t.weak], resist: [...t.resist], immune: [...t.immune], full: true };
  const bits = [`${t.hp}/${t.maxHp} HP`];
  if (b.weak.length) bits.push(`weak to ${b.weak.join(', ')}`);
  if (b.resist.length) bits.push(`resists ${b.resist.join(', ')}`);
  if (b.immune.length) bits.push(`immune to ${b.immune.join(', ')}`);
  ev.push({ type: 'scan', actor: u.name, target: t.name, enemy: t.id, hp: t.hp, maxHp: t.maxHp, weak: b.weak, resist: b.resist, immune: b.immune,
    speaker: 'ain', text: `Ain looks ${the(t)} over: ${bits.join('; ')}.` });
}
function doGambit(s, ev, u) {
  const roll = Math.floor(rnd(s) * 5);
  if (roll === 0) {
    const t = pick(s, living(s.enemies));
    const e = performMove(s, ev, u, { id: 'corsairs_gambit', name: "Corsair's Gambit", mult: 3.0, type: 'weapon', target: 'one', noMiss: true }, [t], { kind: 'skill' });
    e.text = `Valka throws everything into one cut. ` + e.text; e.gambit = 'strike';
  } else if (roll === 1) {
    const e = performMove(s, ev, u, { id: 'corsairs_gambit', name: "Corsair's Gambit", heal: { pctMax: 30 }, target: 'party' }, living(s.party), { kind: 'skill' });
    e.text = 'Valka tosses a flask round. "Drink, you dogs!" ' + e.text; e.gambit = 'heal';
  } else if (roll === 2) {
    const e = performMove(s, ev, u, { id: 'corsairs_gambit', name: "Corsair's Gambit", status: { id: 'blind', chance: 1, rounds: 2 }, target: 'all' }, living(s.enemies), { kind: 'skill' });
    e.text = 'Valka flings a fistful of pepper and powder. ' + e.text; e.gambit = 'blind';
  } else if (roll === 3) {
    s.loot.gold += 50;
    ev.push({ type: 'action', actor: u.name, action: { kind: 'skill', id: 'corsairs_gambit', name: "Corsair's Gambit" }, targets: [], gambit: 'gold', gold: 50,
      text: 'Valka cuts a purse off a belt mid-fight. +50 silver.' });
  } else {
    ev.push({ type: 'action', actor: u.name, action: { kind: 'skill', id: 'corsairs_gambit', name: "Corsair's Gambit" }, targets: [], gambit: 'nothing', text: 'Valka tries something clever. Nothing happens. "Bah."' });
  }
}

function doItem(s, ev, u, cmd) {
  const it = ITEMS[cmd.item];
  if (!s.items[cmd.item]) { ev.push({ type: 'fizzle', unit: u.name, text: `The bag holds no ${it?.name || cmd.item}.` }); return; }
  s.items[cmd.item] -= 1;
  s.itemsUsed[cmd.item] = (s.itemsUsed[cmd.item] || 0) + 1;
  const ef = it.effect;
  if (ef.damage) {
    const targets = it.target === 'all_enemies' ? living(s.enemies) : [resolveEnemyTarget(s, u, cmd.target)].filter(Boolean);
    const results = [];
    const e = { type: 'action', actor: u.name, action: { kind: 'item', id: cmd.item, name: it.name }, targets: results, text: '' };
    ev.push(e);
    for (const t of targets) {
      const tm = typeMult(t, ef.damage.type);
      let d = (ef.damage.base + (ef.damage.perChapter || 0) * (s.chapter - 1)) * tm.m * (0.9 + rnd(s) * 0.2);
      if (s.flags.eyeOpen) d *= 3;
      d = tm.m === 0 ? 0 : Math.max(1, Math.round(d));
      const r = { unit: t.name, damage: d, weak: tm.tag === 'weak', resist: tm.tag === 'resist', immune: tm.tag === 'immune', hits: [{ damage: d }] };
      results.push(r);
      learn(s, t, ef.damage.type, tm.tag);
      const dr = dealDamage(s, ev, t, d, u);
      if (dr.died) r.died = true;
      r.hp = t.hp; r.maxHp = t.maxHp;
    }
    e.text = `${u.label} throws ${it.name.toLowerCase().startsWith('throwing') ? 'a fan of knives' : 'the ' + it.name.toLowerCase()}. ` + cap(results.map((r) => `${the(unitByName0(r.unit))} takes ${r.damage}${r.weak ? ' (weak spot)' : r.resist ? ' (resisted)' : ''}`).join('; ')) + '.';
    checkEnd(s, ev);
    return;
  }
  if (ef.move) {
    const mv = { ...SKILLS[ef.move], id: ef.move };
    const e = performMove(s, ev, u, mv, living(s.enemies), { kind: 'item' });
    e.action = { kind: 'item', id: cmd.item, name: it.name };
    e.text = `${u.label} reads the scroll aloud. Fire answers. ` + e.text.replace(/^[^.]*uses [^.]*\.\s*/, '');
    return;
  }
  const down = it.target === 'ally_down';
  const t = resolveAllyTarget(s, u, cmd.target, down);
  if (!t) { ev.push({ type: 'fizzle', unit: u.name, text: 'No one needs that.' }); s.items[cmd.item] += 1; s.itemsUsed[cmd.item] -= 1; return; }
  const mv = { id: cmd.item, name: it.name };
  if (ef.heal) mv.heal = { flat: ef.heal };
  if (ef.revive) mv.revive = ef.revive;
  if (ef.cure) mv.cure = ef.cure;
  if (ef.mp) mv.restoreMp = ef.mp;
  if (ef.mpFull) mv.mpFull = true;
  const e = performMove(s, ev, u, mv, [t], { kind: 'item' });
  e.action = { kind: 'item', id: cmd.item, name: it.name };
  e.text = (u === t ? `${u.label} uses ${it.name}.` : `${u.label} gives ${it.name} to ${t.label}.`) + e.text.replace(/^[^.]*uses [^.]*\./, '');
}

function doFlee(s, ev, u) {
  const pa = living(s.party).reduce((a, b) => a + effAgi(b), 0) / Math.max(1, living(s.party).length);
  const ea = living(s.enemies).reduce((a, b) => a + effAgi(b), 0) / Math.max(1, living(s.enemies).length);
  const chance = clamp(50 + (pa - ea) * 2, 10, 90) / 100;
  if (rnd(s) < chance) { ev.push({ type: 'flee', unit: u.name, party: true, text: 'The party breaks and runs. No shame in it. Some shame in it.' }); finish(s, ev, 'fled', null); }
  else ev.push({ type: 'fizzle', unit: u.name, text: `${u.label} makes a run for it, and the enemy heads them off. Bad luck: it may go better next time.` });
}

// ───────────────────────── end of battle ─────────────────────────
function checkEnd(s, ev) {
  if (s.over) return;
  const enc = s.encounter;
  // duel: anyone below 25%
  if (enc.endsWhen === 'anyBelowPct') {
    const pct = 25;
    if (s.enemies.some((u) => u.alive && hpPct(u) < (ENEMIES[u.id].flags.endsAtPct ?? pct))) return finish(s, ev, 'won', null);
    if (nonGuest(s).some((u) => u.alive && hpPct(u) < pct)) { s.scripted = true; return finish(s, ev, 'lost', null); }
  }
  for (const u of s.enemies) if (u.alive && ENEMIES[u.id].flags.endsAtPct != null && hpPct(u) < ENEMIES[u.id].flags.endsAtPct) return finish(s, ev, 'won', null);
  if (!s.enemies.some((u) => u.alive && !u.fled)) return finish(s, ev, 'won', null);
  if (!nonGuest(s).some((u) => u.alive)) return finish(s, ev, 'lost', null);
}

function finish(s, ev, result, text) {
  if (s.over) return;
  s.over = true; s.result = result; s.awaiting = null; s.queue = []; s.stage = 'over';
  const enc = s.encounter;
  const pays = result === 'won' || (result === 'lost' && enc.paysOnLose);
  const gold = pays ? Math.round((enc.gold || 0) * (s.difficulty === 'saga' ? SAGA.gold : 1)) + s.loot.gold : s.loot.gold;
  s.rewards = { xp: pays ? enc.xp || 0 : 0, gold, items: [...s.loot.stolen, ...(result === 'won' ? s.loot.drops : [])], drops: result === 'won' ? s.loot.drops : [],
    stolen: s.loot.stolen, itemsUsed: s.itemsUsed, effects: result === 'won' ? enc.onWin || [] : result === 'lost' ? enc.onLose : [] };
  let line = text;
  if (!line) {
    if (result === 'won') line = enc.winText || (s.scripted ? '' : 'Victory.');
    else if (result === 'lost') line = enc.endsWhen === 'anyBelowPct' ? 'Valka lowers her blade, grinning. "Enough. You\'ll do."' : 'Crom does not answer. He never does.';
  }
  if (result === 'won' && enc.endsWhen === 'anyBelowPct') line = 'Valka steps back and laughs, breathing hard. "Cimmeria breeds men after all."';
  ev.push({ type: 'end', result, scripted: s.scripted || enc.endsWhen != null, xp: s.rewards.xp, gold: s.rewards.gold, items: s.rewards.items, text: line || '' });
}

// ───────────────────────── guest AI (Bakari) ─────────────────────────
function guestCommand(s, u) {
  const every = MEMBERS[u.id].songEvery || 3;
  if ((u.ownTurns + 1) % every === 0) return { act: 'move', move: 'lions_song' };
  const t = autoEnemyTarget(s, u);
  return { act: 'attack', target: t ? t.name : null };
}

// ───────────────────────── Auto (GAME_DESIGN priority list) ─────────────────────────
function autoEnemyTarget(s, u) {
  const alive = living(s.enemies);
  if (!alive.length) return null;
  const pri = new Set(alive.flatMap((x) => ENEMIES[x.id].autoHints?.priorityTargets || []));
  let pool = alive.filter((x) => pri.has(x.id));
  if (!pool.length) pool = alive.filter((x) => x.aiRole === 'healer');
  if (!pool.length) pool = alive.filter((x) => x.aiRole === 'summoner' && alive.length === 1);
  if (!pool.length) pool = alive;
  return pool.reduce((a, b) => (b.hp < a.hp ? b : a));
}

function estAction(s, u, t, mv) {
  if (!t) return 0;
  if (mv.spellPower != null) {
    const targets = mv.target === 'all' ? living(s.enemies) : [t];
    return targets.reduce((a, x) => a + Math.min(x.hp, wonderHit(s, u, x, mv, true).dmg), 0);
  }
  if (mv.mult == null) return 0;
  const targets = mv.target === 'all' ? living(s.enemies) : [t];
  let total = 0;
  for (const x of targets) {
    let d = physicalHit(s, u, x, mv, true).dmg * (mv.hits || 1);
    if (mv.status && ['poison', 'bleed'].includes(mv.status.id) && !has(x, mv.status.id) && !x.immune.includes(mv.status.id)) {
      d += mv.status.chance * x.maxHp * (BIG_ROLES.includes(x.role) ? 0.01 : 0.05) * 3;
    }
    total += Math.min(x.hp, d);
  }
  return total;
}

function canUseItem(s, u, id) {
  const it = ITEMS[id];
  return it && s.items[id] > 0 && it.battle !== false && !(it.notUsableBy || []).includes(u.id);
}
function knows(s, u, sk) {
  return knownSkills(u.id, u.level, s.flagsKnown).includes(sk);
}
function affordable(s, u, sk) { return knows(s, u, sk) && u.mp >= skillCost(u, SKILLS[sk]) && !(SKILLS[sk].hpPct && u.hp <= u.maxHp * 0.5); }

// Auto's pick for member `who` (or Bakari). opts.target forces the enemy target ("best" in policies).
export function autoCommand(s, who, opts = {}) {
  const u = unitByName(s, who);
  if (!u) return { act: 'defend' };
  if (u.guest) return guestCommand(s, u);
  const allies = s.party.filter((x) => !x.guest);
  const claim = (k) => { s.claims[k] = true; };
  const isBossFight = s.enemies.some((x) => x.role === 'boss' || x.role === 'mini');
  if (!opts.target) {
    // 1. Stilled ally
    const stilled = living(allies).filter((x) => has(x, 'stilled') && !s.claims['cure:' + x.key]);
    if (stilled.length) {
      if (affordable(s, u, 'croms_roar') && !s.claims.roar) { claim('roar'); stilled.forEach((x) => claim('cure:' + x.key)); return { act: 'skill', skill: 'croms_roar' }; }
      if (canUseItem(s, u, 'smelling_salts')) { claim('cure:' + stilled[0].key); return { act: 'item', item: 'smelling_salts', target: stilled[0].name }; }
    }
    // 2. Fallen ally → revive; ally under 35% → heal
    const down = allies.filter((x) => !x.alive && !s.claims['heal:' + x.key]);
    if (down.length && living(s.enemies).length) {
      const t = down[0];
      if (affordable(s, u, 'rekindle')) { claim('heal:' + t.key); return { act: 'skill', skill: 'rekindle', target: t.name }; }
      if (canUseItem(s, u, 'kothian_fire_wine') && (u.id !== 'ain' || !knows(s, u, 'rekindle'))) { claim('heal:' + t.key); return { act: 'item', item: 'kothian_fire_wine', target: t.name }; }
    }
    const low = living(allies).filter((x) => hpPct(x) < 35 && !s.claims['heal:' + x.key]).sort((a, b) => hpPct(a) - hpPct(b));
    if (low.length) {
      const t = low[0];
      const hurt = living(allies).filter((x) => hpPct(x) < 50).length;
      if (HEALERS.includes(u.id)) {
        if (hurt >= 2 && affordable(s, u, 'mend_all')) { living(allies).forEach((x) => claim('heal:' + x.key)); return { act: 'skill', skill: 'mend_all' }; }
        if (affordable(s, u, 'mend')) { claim('heal:' + t.key); return { act: 'skill', skill: 'mend', target: t.name }; }
      }
      if (u.id === 'valka' && hurt >= 2 && affordable(s, u, 'rally')) { living(allies).forEach((x) => claim('heal:' + x.key)); return { act: 'skill', skill: 'rally' }; }
      // a healer who can still act gets first call on the heal (unless it's the healer who is low)
      const healer = living(allies).find((x) => HEALERS.includes(x.id) && canAct(x) && x.mp >= 5 && s.queue.includes(x.key) && x.key !== u.key);
      if (!healer || t.key === u.key && hpPct(u) < 20) {
        const missing = t.maxHp - t.hp;
        const opts2 = ['greater_draught', 'healing_draught', 'bread_and_dates'].filter((i) => canUseItem(s, u, i));
        if (opts2.length) {
          let best = opts2.find((i) => ITEMS[i].effect.heal <= missing * 1.2) || opts2[opts2.length - 1];
          if (missing > 150 && canUseItem(s, u, 'greater_draught')) best = 'greater_draught';
          claim('heal:' + t.key);
          return { act: 'item', item: best, target: t.name };
        }
      }
    }
    // 3. Telegraphed big move → Defend (the healer heals instead)
    const tele = living(s.enemies).filter((x) => x.plan && x.plan.telegraphed && !x.plan.done && MOVES[x.plan.move].mult != null && ENEMIES[x.id].autoHints?.defendOnTelegraph !== false);
    if (tele.length) {
      const threat = tele.reduce((a, x) => {
        const mv = MOVES[x.plan.move];
        const shape = mv.target;
        const pool = partyTargetsFor(s, x);
        let targeted = shape === 'all' ? 1 : shape === 'highest_hp' ? (pool.reduce((p, q) => (q.hp > p.hp ? q : p), pool[0]) === u ? 1 : 0) : 1 / Math.max(1, pool.length);
        if (!pool.includes(u)) targeted = 0;
        return a + physicalHit(s, x, u, mv, true).dmg * (mv.hits || 1) * targeted;
      }, 0);
      if (HEALERS.includes(u.id)) {
        const hurt = living(allies).filter((x) => hpPct(x) < 70).sort((a, b) => hpPct(a) - hpPct(b));
        if (hurt.length && affordable(s, u, 'mend') && !s.claims['heal:' + hurt[0].key]) { claim('heal:' + hurt[0].key); return { act: 'skill', skill: 'mend', target: hurt[0].name }; }
        if (affordable(s, u, 'aegis') && !living(allies).some((x) => has(x, 'aegis'))) return { act: 'skill', skill: 'aegis' };
      }
      if (threat >= u.hp * 0.25) return { act: 'defend' };
    }
  }
  // 4–6. Damage
  let target = opts.target ? unitByName(s, opts.target) : null;
  if (!target || !target.alive) target = null;
  if (s.flags.eyeOpen && !target) target = rootBoss(s);
  if (!target) target = autoEnemyTarget(s, u);
  if (!target) return { act: 'defend' };
  // Ain: Scan an unknown boss once
  if (u.id === 'ain' && (target.role === 'boss' || target.role === 'mini') && !s.scanned[target.id]?.full && !s.claims.scan && affordable(s, u, 'scan') && !s.flags.eyeOpen) {
    claim('scan'); return { act: 'skill', skill: 'scan', target: target.name };
  }
  const attackMv = { mult: 1.0, type: u.id === 'ain' ? 'shock' : 'weapon', target: 'one', isAttack: true };
  let best = { cmd: { act: 'attack', target: target.name }, val: estAction(s, u, target, attackMv) };
  const multi = living(s.enemies).length;
  const reserveFor = (sk) => {
    if (s.flags.eyeOpen) return 0;
    if (u.id === 'ain') return isBossFight ? SKILLS.mend.mp * 2 : SKILLS.mend.mp * 3;
    if (u.id === 'kord' && knows(s, u, 'croms_roar')) return SKILLS.croms_roar.mp;
    if (u.id === 'valka' && knows(s, u, 'rally')) return isBossFight ? SKILLS.rally.mp : 0;
    return 0;
  };
  for (const sk of MEMBERS[u.id].skills) {
    const d = SKILLS[sk];
    if (!affordable(s, u, sk)) continue;
    if (d.mult == null && d.spellPower == null) continue;
    if (u.mp - skillCost(u, d) < reserveFor(sk)) continue;
    if (d.hpPct && !isBossFight) continue; // Crom's Fury is for bosses
    let val = estAction(s, u, target, { ...d });
    if (d.status && d.status.id === 'sunder') {
      const big = target.hp > 3 * best.val && !has(target, 'sunder');
      val = big ? best.val * 1.6 : val * 0.8;
    }
    if (d.status && d.status.id === 'stun') val *= 1.05;
    if (d.target === 'all' && multi < 2) val *= 0.95;
    // MP is worth something outside boss fights: demand a real gain
    const need = isBossFight || s.flags.eyeOpen ? 1.08 : 1.3;
    if (val > best.val * need) best = { cmd: { act: 'skill', skill: sk, target: d.target === 'one' ? target.name : undefined }, val };
  }
  if (u.id === 'ain' && best.cmd.act === 'attack') {
    // nothing worth casting: support instead of a feeble pulse
    const hurt = living(allies).filter((x) => hpPct(x) < 70 && !s.claims['heal:' + x.key]).sort((a, b) => hpPct(a) - hpPct(b));
    if (hurt.length && affordable(s, u, 'mend')) { claim('heal:' + hurt[0].key); return { act: 'skill', skill: 'mend', target: hurt[0].name }; }
  }
  return best.cmd;
}

// ───────────────────────── battle policies (BALANCE §8) ─────────────────────────
export function policyCommand(s, policy, who) {
  const u = unitByName(s, who);
  for (const rule of policy.rules || []) {
    if (rule.who && rule.who !== u.id) continue;
    if (rule.if && !evalWhen(s, rule.if, { unit: u, side: 'party', round: s.round })) continue;
    const d = HEALERS.includes(u.id) && rule.healer ? rule.healer : rule.do;
    if (!d) continue;
    const cmd = policyDo(s, u, d);
    if (cmd) return cmd;
  }
  return autoCommand(s, who);
}
function policyTarget(s, u, spec, kind) {
  if (!spec) return null;
  if (spec === 'self') return u;
  if (spec === 'ally_lowest_hp') { const al = living(s.party).filter((x) => !x.guest); return al.reduce((a, b) => (hpPct(b) < hpPct(a) ? b : a), al[0]); }
  if (spec === 'ally_stilled') return living(s.party).find((x) => has(x, 'stilled') && !s.claims['cure:' + x.key]) || null;
  if (spec === 'ally_down') return s.party.find((x) => !x.alive && !x.guest) || null;
  if (spec.startsWith('lowest:')) {
    const id = spec.slice(7);
    const l = living(s.enemies).filter((x) => x.id === id);
    return l.length ? l.reduce((a, b) => (b.hp < a.hp ? b : a)) : null;
  }
  const byName = unitByName(s, spec);
  if (byName) return byName.alive || kind === 'down' ? byName : null;
  const byId = living(s.enemies).find((x) => x.id === spec);
  return byId || null;
}
function skillHookPending(s, skill) {
  const boss = rootBoss(s);
  return (s.encounter.onPlayerSkill || []).some((h, i) => h.skill === skill && (!h.phase || (boss && boss.phaseIdx + 1 === h.phase)) && !(h.once && s.firedHooks.includes('ops' + i)));
}
function policyDo(s, u, d) {
  if (d.act === 'defend') return { act: 'defend' };
  if (d.act === 'best') {
    const t = d.target ? policyTarget(s, u, d.target) : null;
    if (d.target && !t) return null;
    return autoCommand(s, u.name, { target: t ? t.name : undefined });
  }
  if (d.act === 'attack') {
    const t = d.target ? policyTarget(s, u, d.target) : autoEnemyTarget(s, u);
    if (!t || t.side !== 'enemy') return null;
    return { act: 'attack', target: t.name };
  }
  if (d.act === 'skill') {
    const sk = SKILLS[d.skill];
    if (!sk || !affordable(s, u, d.skill)) return null;
    if (d.target === 'ally_down' || sk.target === 'ally_down') { const t = policyTarget(s, u, 'ally_down', 'down'); return t ? { act: 'skill', skill: d.skill, target: t.name } : null; }
    let t = d.target ? policyTarget(s, u, d.target) : null;
    if (d.target && !t) return null;
    const needCure = sk.cure ? living(s.party).filter((x) => sk.cure.some((c) => has(x, c)) && !s.claims['cure:' + x.key]) : [];
    if (sk.cure && !needCure.length && !sk.buff) return null;
    if (sk.buff && !needCure.length && !skillHookPending(s, d.skill) && living(s.party).some((x) => has(x, sk.buff.id))) return null;
    if (sk.cure && s.claims['skill:' + d.skill]) return null;
    for (const x of needCure) s.claims['cure:' + x.key] = true;
    if (sk.cure) { s.claims['skill:' + d.skill] = true; if (d.skill === 'croms_roar') s.claims.roar = true; }
    if (sk.heal && t) s.claims['heal:' + t.key] = true;
    return { act: 'skill', skill: d.skill, target: t ? t.name : undefined };
  }
  if (d.act === 'item') {
    if (!canUseItem(s, u, d.item)) return null;
    const it = ITEMS[d.item];
    let t = d.target ? policyTarget(s, u, d.target, it.target === 'ally_down' ? 'down' : null) : null;
    if (d.target && !t) return null;
    if (it.effect.cure && t && (!it.effect.cure.some((c) => has(t, c)) || s.claims['cure:' + t.key])) return null;
    if (it.effect.cure && t) s.claims['cure:' + t.key] = true;
    if ((it.effect.heal || it.effect.revive) && t) { if (s.claims['heal:' + t.key]) return null; s.claims['heal:' + t.key] = true; }
    return { act: 'item', item: d.item, target: t ? t.name : undefined };
  }
  return null;
}

// ───────────────────────── commands and parsing ─────────────────────────
function norm(t) { return String(t || '').toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9\- ]+/g, ' ').replace(/\s+/g, ' ').trim(); }

function matchUnits(s, q, side) {
  q = norm(q);
  if (!q) return [];
  const pool = side === 'party' ? s.party : living(s.enemies);
  const exact = pool.filter((u) => u.name === q || norm(u.label) === q || u.id === q);
  if (exact.length) return exact;
  return pool.filter((u) => u.name.startsWith(q) || u.name.split('-').some((seg) => seg.startsWith(q)) || norm(u.label).split(' ').some((w) => w.startsWith(q)));
}

function matchSkill(u, q) {
  q = norm(q).replace(/ /g, '_');
  const list = MEMBERS[u.id].skills || [];
  const ex = list.filter((k) => k === q || norm(SKILLS[k].name).replace(/ /g, '_') === q);
  if (ex.length) return ex;
  const words = q.split('_');
  return list.filter((k) => { const kw = [...k.split('_'), ...norm(SKILLS[k].name).split(' ')]; return words.every((w) => kw.some((x) => x.startsWith(w))); });
}

function matchItemPrefix(s, tokens) {
  // longest leading run of tokens naming an item in the bag
  for (let n = tokens.length; n >= 1; n--) {
    const q = tokens.slice(0, n).join(' ');
    const ids = Object.keys(s.items).filter((id) => s.items[id] > 0 && ITEMS[id]?.kind === 'consumable');
    const ex = ids.filter((id) => id === q.replace(/ /g, '_') || norm(ITEMS[id].name) === q);
    if (ex.length) return { ids: ex, rest: tokens.slice(n) };
    const pre = ids.filter((id) => { const w = [...id.split('_'), ...norm(ITEMS[id].name).split(' ')]; return q.split(' ').every((x) => w.some((y) => y.startsWith(x))); });
    if (pre.length) return { ids: pre, rest: tokens.slice(n) };
  }
  return { ids: [], rest: tokens };
}

// Parse a typed command for the member whose turn it is. Returns {cmd} | {error} | {choices, prompt}.
export function parseCommand(s, text) {
  const who = s.awaiting;
  if (!who) return { error: 'Not now.' };
  const u = unitByName(s, who);
  let tokens = norm(text).split(' ').filter(Boolean);
  if (!tokens.length) return { error: 'Attack, skill, item, defend or flee?' };
  let verb = tokens.shift();
  const VERBS = { a: 'attack', attack: 'attack', hit: 'attack', fight: 'attack', s: 'skill', skill: 'skill', cast: 'skill', i: 'item', item: 'item', use: 'item',
    d: 'defend', defend: 'defend', guard: 'defend', block: 'defend', f: 'flee', flee: 'flee', run: 'flee', r: 'repeat', repeat: 'repeat' };
  verb = VERBS[verb];
  if (!verb) return { error: 'In battle: attack, skill, item, defend, flee or repeat.' };
  // a member name is only a check
  if (tokens.length && (verb === 'skill' || verb === 'item' || verb === 'attack')) {
    const m = Object.keys(MEMBERS).find((id) => id === tokens[0] || norm(MEMBERS[id].name) === tokens[0] || shortName(id).toLowerCase() === tokens[0]);
    if (m && s.party.some((x) => x.id === m) && (verb === 'skill' || tokens.length > 1 || verb === 'attack' && false)) {
      if (m !== u.id) return { error: `It is ${u.label}'s turn.` };
      tokens.shift();
    }
  }
  if (verb === 'defend') return { cmd: { act: 'defend' } };
  if (verb === 'flee') return { cmd: { act: 'flee' } };
  if (verb === 'repeat') {
    const last = s.lastCommands[u.key];
    if (!last) return { cmd: { act: 'attack', target: s.currentTarget[u.key] } };
    return { cmd: { ...last } };
  }
  if (verb === 'attack') {
    if (!tokens.length) return { cmd: { act: 'attack', target: currentTargetFor(s, u) } };
    const ms = matchUnits(s, tokens.join(' '), 'enemy');
    if (!ms.length) return { error: `There is no "${tokens.join(' ')}" to attack.` };
    if (ms.length > 1) return { choices: ms.map((m) => ({ text: m.name, cmd: { act: 'attack', target: m.name } })), prompt: `Which: ${ms.map((m) => m.name).join(' or ')}?` };
    return { cmd: { act: 'attack', target: ms[0].name } };
  }
  if (verb === 'skill') {
    if (!tokens.length) return { error: `Which skill? ${availableSkills(s, u).map((k) => SKILLS[k].name).join(', ') || 'None yet.'}` };
    // longest skill-name prefix, rest is target
    for (let n = tokens.length; n >= 1; n--) {
      const ks = matchSkill(u, tokens.slice(0, n).join(' ')).filter((k) => availableSkills(s, u).includes(k));
      if (!ks.length) continue;
      if (ks.length > 1) return { choices: ks.map((k) => ({ text: SKILLS[k].name, cmd: { act: 'skill', skill: k } })), prompt: `Which: ${ks.map((k) => SKILLS[k].name).join(' or ')}?` };
      return targetFor(s, u, { act: 'skill', skill: ks[0] }, tokens.slice(n), SKILLS[ks[0]].target);
    }
    return { error: `${u.label} doesn't know "${tokens.join(' ')}".` };
  }
  if (verb === 'item') {
    if (!tokens.length) return { error: 'Which item?' };
    const { ids, rest } = matchItemPrefix(s, tokens);
    if (!ids.length) return { error: `The bag holds no "${tokens.join(' ')}".` };
    if (ids.length > 1) return { choices: ids.map((id) => ({ text: ITEMS[id].name, cmd: { act: 'item', item: id } })), prompt: `Which: ${ids.map((id) => ITEMS[id].name).join(' or ')}?` };
    const it = ITEMS[ids[0]];
    const shape = it.target === 'all_enemies' ? 'all' : it.target === 'one' ? 'one' : it.target;
    return targetFor(s, u, { act: 'item', item: ids[0] }, rest, shape);
  }
  return { error: 'Not now.' };
}
function targetFor(s, u, cmd, rest, shape) {
  const q = rest.join(' ');
  if (shape === 'one') {
    if (!q) return { cmd: { ...cmd, target: currentTargetFor(s, u) } };
    const ms = matchUnits(s, q, 'enemy');
    if (!ms.length) return { error: `There is no "${q}" here.` };
    if (ms.length > 1) return { choices: ms.map((m) => ({ text: m.name, cmd: { ...cmd, target: m.name } })), prompt: `Which: ${ms.map((m) => m.name).join(' or ')}?` };
    return { cmd: { ...cmd, target: ms[0].name } };
  }
  if (shape === 'ally' || shape === 'ally_down') {
    if (!q) { const t = resolveAllyTarget(s, u, null, shape === 'ally_down'); return { cmd: { ...cmd, target: t ? t.name : u.name } }; }
    const ms = matchUnits(s, q, 'party');
    if (!ms.length) return { error: `"${q}" isn't in the party.` };
    return { cmd: { ...cmd, target: ms[0].name } };
  }
  return { cmd };
}
function currentTargetFor(s, u) {
  const t = s.currentTarget[u.key] && unitByName(s, s.currentTarget[u.key]);
  if (t && t.alive) return t.name;
  const a = autoEnemyTarget(s, u);
  return a ? a.name : null;
}

export function availableSkills(s, u) {
  if (typeof u === 'string') u = unitByName(s, u);
  return knownSkills(u.id, u.level, s.flagsKnown);
}

// Validate a command object for the awaiting member; returns an error string or null.
export function validateCommand(s, cmd) {
  const u = unitByName(s, s.awaiting);
  if (!u) return 'Not now.';
  if (cmd.act === 'flee' && s.encounter.noFlee) return 'There is no running from this one.';
  if (cmd.act === 'skill') {
    const sk = SKILLS[cmd.skill];
    if (!sk || sk.who !== u.id) return `${u.label} doesn't know that.`;
    if (!availableSkills(s, u).includes(cmd.skill)) return `${u.label} hasn't learned ${sk.name} yet.`;
    if (u.mp < skillCost(u, sk)) return `Not enough MP for ${sk.name}.`;
    if (sk.hpPct && u.hp <= Math.round(u.maxHp * sk.hpPct / 100)) return `${u.label} is too hurt for ${sk.name}.`;
    if (sk.target === 'ally_down' && !s.party.some((x) => !x.alive && !x.guest)) return 'No one has fallen.';
  }
  if (cmd.act === 'item') {
    const it = ITEMS[cmd.item];
    if (!it || it.kind !== 'consumable' || !s.items[cmd.item]) return 'The bag holds none of that.';
    if (it.battle === false) return `${it.name} is no use in a fight.`;
    if ((it.notUsableBy || []).includes(u.id)) return u.id === 'kord' ? '"Sorcery. Keep it away from me."' : `${u.label} can't use that.`;
    if (it.targetOnly && cmd.target && !it.targetOnly.includes(cmd.target)) return `Only ${it.targetOnly.map(shortName).join(', ')} can use ${it.name}.`;
  }
  return null;
}

// Main entry. input: a typed string or a command object. Returns {state, events, error?, choices?, prompt?}.
export function command(state, input) {
  if (state.over) return { state, events: [], error: 'The fight is over.' };
  const s = clone(state);
  __s = s;
  let cmd = input;
  if (typeof input === 'string') {
    const p = parseCommand(s, input);
    if (p.error) return { state, events: [], error: p.error };
    if (p.choices) return { state, events: [], choices: p.choices, prompt: p.prompt };
    cmd = p.cmd;
  }
  if (cmd.act === 'repeat') cmd = s.lastCommands[s.awaiting] || { act: 'attack' };
  if (cmd.act === 'auto') cmd = autoCommand(s, s.awaiting);
  // fill in default targets
  const u = unitByName(s, s.awaiting);
  if (cmd.act === 'attack' && !(cmd.target && unitByName(s, cmd.target)?.alive)) cmd = { ...cmd, target: currentTargetFor(s, u) };
  const err = validateCommand(s, cmd);
  if (err) return { state, events: [], error: err };
  const ev = [];
  s.commands[u.key] = cmd;
  s.lastCommands[u.key] = cmd; s.lastCommand = { who: u.key, ...cmd };
  if (cmd.target && unitByName(s, cmd.target)?.side === 'enemy') s.currentTarget[u.key] = cmd.target;
  if (cmd.act === 'defend') {
    u.statuses.push({ id: 'guard', rounds: 1 });
    ev.push({ type: 'action', actor: u.name, action: { kind: 'defend', id: 'defend', name: 'Defend' }, targets: [{ unit: u.name, statusesAdded: ['guard'] }],
      text: { kord: 'Kord sets his feet and raises his guard.', toktai: 'Toktai crouches low behind cover.', ain: 'Ain dims and draws its light in close.', valka: 'Valka drops into a guard, blade up.' }[u.id] || `${u.label} defends.` });
  }
  s.queue.shift();
  advanceQueue(s, ev);
  s.lastEvents = ev; s.log.push(...ev);
  if (s.log.length > 400) s.log = s.log.slice(-400);
  return { state: s, events: ev };
}

// Run a whole battle with Auto (or a policy) for every member. For the sim and tests.
export function runBattle(state, { policy = null, maxSteps = 2000, onStep = null } = {}) {
  let s = state;
  let steps = 0;
  while (!s.over && steps++ < maxSteps) {
    __s = s;
    const cmd = policy ? policyCommand(s, policy, s.awaiting) : autoCommand(s, s.awaiting);
    let r = command(s, cmd);
    if (r.error) r = command(s, { act: 'defend' });
    s = r.state;
    if (onStep) onStep(s, r.events);
  }
  return s;
}

// Expected damage of one plain attack (or a skill) from one unit to another, for UI previews and tests.
export function previewDamage(s, attackerName, targetName, skill = null) {
  const a = unitByName(s, attackerName), t = unitByName(s, targetName);
  if (!a || !t) return 0;
  const mv = skill ? { ...SKILLS[skill] } : { mult: 1.0, type: a.id === 'ain' ? 'shock' : 'weapon', target: 'one', isAttack: true, noMiss: true };
  if (mv.spellPower != null) return Math.round(wonderHit(s, a, t, mv, true).dmg);
  const r = physicalHit(s, a, t, { ...mv, noMiss: true }, true);
  return Math.round(r.dmg / (1 + critChance(a) * 0.75)) * (mv.hits || 1);
}

// ───────────────────────── views and rewards ─────────────────────────
// The fields `window.__game.state().battle` exposes (DATA_SPEC §10).
export function battleView(s) {
  const boss = rootBoss(s);
  return {
    encounter: s.encounterId, round: s.round, phase: boss ? boss.phaseIdx + 1 : 1, awaiting: s.awaiting,
    telegraph: !!s.telegraph, eyeOpen: !!s.flags.eyeOpen, over: s.over, result: s.result,
    enemies: s.enemies.filter((u) => u.alive && !u.fled).map((u) => ({ name: u.name, id: u.id, label: u.label, hp: u.hp, maxHp: u.maxHp, sprite: u.sprite,
      statuses: u.statuses.map((x) => x.id), part: !!u.partOf, telegraph: !!(u.plan && u.plan.telegraphed && !u.plan.done) })),
    party: s.party.map((u) => ({ id: u.id, hp: u.hp, mp: u.mp, maxHp: u.maxHp, maxMp: u.maxMp, alive: u.alive, guest: !!u.guest, statuses: u.statuses.map((x) => x.id) })),
    guest: s.party.find((u) => u.guest)?.id || null,
    turnOrder: s.over ? [] : turnOrder(s).slice(0, 6),
    lastCommand: s.lastCommand,
  };
}

// Apply a finished battle's rewards to the party's progress {level, xp}. Shared party level (BALANCE §1).
export function applyRewards(progress, rewards) {
  const xp = (progress.xp || 0) + (rewards?.xp || 0);
  const level = Math.max(progress.level || 1, levelForXp(xp));
  const levelUps = [];
  for (let l = (progress.level || 1) + 1; l <= level; l++) levelUps.push(l);
  return { xp, level, levelUps, gold: rewards?.gold || 0, fullHeal: levelUps.length > 0 };
}

// Party HP/MP after the battle, to write back into the game state.
export function partyAfter(s) {
  return s.party.filter((u) => !u.guest).map((u) => ({ id: u.id, hp: u.alive ? u.hp : 0, mp: u.mp, statuses: u.statuses.filter((x) => ['poison', 'bleed'].includes(x.id)).map((x) => ({ ...x })) }));
}

// Seek trouble: an optional fight from a chapter table (DATA_SPEC §14 seekTrouble).
export function makeSeekTroubleEncounter(table, { level, partySize, seed = 1 }) {
  const s = { rng: seed >>> 0 };
  const n = table.size[0] + Math.floor(rnd(s) * (table.size[1] - table.size[0] + 1));
  const from = ENCOUNTERS[table.rewardFrom];
  const enemies = [];
  for (let i = 0; i < n; i++) enemies.push({ enemy: table.pool[Math.floor(rnd(s) * table.pool.length)], tier: table.tier === 'party' ? level : table.tier });
  return { chapter: from?.chapter, enemies, partySize: partySize || 4, party: null, guest: null, optional: true, noFlee: false, roundHooks: [], onPlayerSkill: [],
    xp: Math.round((from?.xp || 0) * (table.pct || 25) / 100), gold: Math.round((from?.gold || 0) * (table.pct || 25) / 100), onWin: [], onLose: 'gameover', endsWhen: null, music: 'battle', bg: from?.bg };
}

export { xpToReach, levelForXp };
