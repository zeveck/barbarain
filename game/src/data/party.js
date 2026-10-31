// BarbarAIn — MEMBERS and SKILLS (DATA_SPEC §14, BALANCE §1–§3).
// Plain data plus three tiny pure helpers (stat lines and the XP curve) that
// the inventory, the battle engine and the sim all share.

export const MEMBERS = {
  kord: {
    name: 'Kord', sprite: 'party/kord', portrait: 'portrait/kord',
    lv1: { hp: 60, mp: 8, atk: 12, def: 6, agi: 7, wil: 3 },
    lv17: { hp: 520, mp: 60, atk: 62, def: 34, agi: 22, wil: 12 },
    classes: ['sword', 'greatsword', 'axe', 'mace', 'spear', 'dagger', 'sabre', 'future'], shields: true,
    slots: ['weapon', 'off', 'body', 'head', 'charm'], refusesSorcerous: true,
    immune: ['stilled', 'drowsy'],
    skills: ['cleave', 'sunder', 'whirlwind', 'croms_fury', 'croms_roar'],
    start: { weapon: 'rusty_broadsword', body: 'leather_harness' },
  },
  toktai: {
    name: 'Toktai', sprite: 'party/toktai', portrait: 'portrait/toktai',
    lv1: { hp: 42, mp: 12, atk: 9, def: 4, agi: 12, wil: 5 },
    lv17: { hp: 360, mp: 90, atk: 48, def: 24, agi: 40, wil: 18 },
    classes: ['bow', 'dagger'], shields: false,
    slots: ['weapon', 'off', 'body', 'head', 'charm'], refusesSorcerous: false,
    immune: [],
    skills: ['twin_shot', 'pilfer', 'pinning_shot', 'smoke_pot', 'poison_arrow', 'arrow_storm'],
    start: { weapon: 'hyrkanian_shortbow', body: 'hyrkanian_jerkin' }, startItems: { thiefs_dirk: 1 },
  },
  ain: {
    name: 'Ain', sprite: 'party/ain', portrait: 'portrait/ain',
    lv1: { hp: 30, mp: 30, atk: 2, def: 5, agi: 9, wil: 12 },
    lv17: { hp: 280, mp: 240, atk: 8, def: 26, agi: 28, wil: 64 },
    classes: [], shields: false,
    slots: ['charm'], refusesSorcerous: false,
    immune: [],
    skills: ['spark', 'mend', 'scan', 'aegis', 'flare', 'mirage', 'rekindle', 'mend_all', 'overload'],
    start: {},
    attackType: 'shock', // Ain's plain "attack" is a tiny shock pulse (no weapon)
  },
  valka: {
    name: 'Red Valka', sprite: 'party/valka', portrait: 'portrait/valka',
    lv1: { hp: 50, mp: 14, atk: 11, def: 5, agi: 11, wil: 6 },
    lv17: { hp: 430, mp: 110, atk: 56, def: 28, agi: 34, wil: 20 },
    classes: ['sword', 'sabre', 'rapier', 'dagger', 'spear', 'future'], shields: true,
    slots: ['weapon', 'off', 'body', 'head', 'charm'], refusesSorcerous: false,
    immune: [],
    skills: ['riposte', 'taunt', 'bleeding_cut', 'rally', 'corsairs_gambit'],
    start: { weapon: 'barachan_cutlass', body: 'sea_wolf_coat' },
  },
  // Guest (5th battle slot): fixed stats per level, no gear, no XP, AI-controlled.
  bakari: {
    name: 'Bakari', sprite: 'party/bakari-guest', portrait: 'portrait/bakari', guest: true,
    fixed: {
      13: { hp: 520, mp: 0, atk: 60, def: 30, agi: 18, wil: 10 },
      17: { hp: 700, mp: 0, atk: 78, def: 38, agi: 22, wil: 12 },
    },
    weapon: { name: 'Kushite Maul', power: 34, type: 'crush' },
    classes: [], slots: [], immune: [],
    moves: ['maul_swing', 'lions_song'],
    songEvery: 3, // every 3rd of his own turns: Lion's Song; otherwise Maul Swing on Auto's target
  },
};

// Skills. Same effect fields as MOVES (DATA_SPEC §10) plus cost and learning.
// target: one (enemy) | all (enemies) | self | ally | ally_down | party | none
export const SKILLS = {
  // Kord
  cleave: { name: 'Cleave', who: 'kord', mp: 4, hpPct: 0, target: 'one', mult: 1.5, type: 'weapon', learn: { level: 1 },
    desc: '1.5× physical on one enemy.' },
  sunder: { name: 'Sunder', who: 'kord', mp: 5, target: 'one', mult: 1.0, type: 'weapon',
    status: { id: 'sunder', chance: 1, rounds: 3 }, learn: { level: 3 }, desc: '1.0× hit; target DEF −30% for 3 rounds.' },
  whirlwind: { name: 'Whirlwind', who: 'kord', mp: 10, target: 'all', mult: 0.8, type: 'weapon', learn: { level: 7 },
    desc: '0.8× to every enemy.' },
  croms_fury: { name: "Crom's Fury", who: 'kord', mp: 12, hpPct: 10, target: 'one', mult: 3.0, type: 'weapon', noMiss: true,
    learn: { level: 11 }, desc: '3.0×, cannot miss. Costs 10% of max HP too.' },
  croms_roar: { name: "Crom's Roar", who: 'kord', mp: 8, target: 'party', actsFirst: true, cure: ['stilled', 'drowsy'],
    buff: { stat: 'atk', pct: 25, rounds: 3, id: 'rage' }, learn: { flag: 'ch5.gong_struck' },
    desc: 'Acts first. Party ATK +25% for 3 rounds; wakes the Stilled and the Drowsy.' },
  // Toktai
  twin_shot: { name: 'Twin Shot', who: 'toktai', mp: 4, target: 'one', mult: 0.75, hits: 2, type: 'weapon', learn: { level: 1 },
    desc: 'Two shots at 0.75×.' },
  pilfer: { name: 'Pilfer', who: 'toktai', mp: 3, target: 'one', steal: true, learn: { level: 2 },
    desc: 'Steal from one enemy (50% + AGI difference, 20–90%).' },
  pinning_shot: { name: 'Pinning Shot', who: 'toktai', mp: 6, target: 'one', mult: 0.8, type: 'weapon',
    status: { id: 'stun', chance: 0.4, rounds: 1 }, learn: { level: 5 }, desc: '0.8×, 40% stun.' },
  smoke_pot: { name: 'Smoke Pot', who: 'toktai', mp: 8, target: 'party', buff: { stat: 'evasion', pct: 25, rounds: 3, id: 'smoke' },
    learn: { level: 7 }, desc: 'Party evasion +25% for 3 rounds.' },
  poison_arrow: { name: 'Poison Arrow', who: 'toktai', mp: 7, target: 'one', mult: 1.0, type: 'weapon',
    status: { id: 'poison', chance: 0.6, rounds: 4 }, learn: { level: 10 }, desc: '1.0×, 60% poison.' },
  arrow_storm: { name: 'Arrow Storm', who: 'toktai', mp: 16, target: 'all', mult: 0.9, type: 'pierce', flyers: true,
    learn: { level: 13 }, desc: '0.9× pierce to every enemy; full damage to flyers.' },
  // Ain
  spark: { name: 'Spark', who: 'ain', mp: 4, target: 'one', type: 'shock', spellPower: 10, learn: { flag: 'ch1.ain_joined' },
    desc: 'Shock, spell power 10.' },
  mend: { name: 'Mend', who: 'ain', mp: 5, target: 'ally', heal: { wilMult: 2, flat: 20 }, learn: { flag: 'ch1.ain_joined' },
    desc: 'Heal one ally WIL×2 + 20.' },
  scan: { name: 'Scan', who: 'ain', mp: 2, target: 'one', scan: true, learn: { flag: 'ch1.ain_joined' },
    desc: 'Reveal HP, weaknesses and resistances (saved to the Bestiary). Free with the Seer\'s Lens.' },
  aegis: { name: 'Aegis', who: 'ain', mp: 10, target: 'party', buff: { stat: 'def', pct: 40, rounds: 3, id: 'aegis' },
    learn: { flag: 'ch2.ain_woken' }, desc: 'Party DEF +40% for 3 rounds.' },
  flare: { name: 'Flare', who: 'ain', mp: 12, target: 'all', type: 'fire', spellPower: 14, perTarget: 0.8,
    learn: { flag: 'ch2.ain_woken' }, desc: 'Fire on every enemy, spell power 14 (×0.8 each).' },
  mirage: { name: 'Mirage', who: 'ain', mp: 9, target: 'party', buff: { stat: 'evasion', pct: 20, rounds: 3, id: 'mirage' },
    learn: { flag: 'ch2.ain_woken' }, desc: 'Party evasion +20% for 3 rounds.' },
  rekindle: { name: 'Rekindle', who: 'ain', mp: 18, target: 'ally_down', revive: 40, learn: { level: 11 },
    desc: 'Revive a fallen ally at 40% HP.' },
  mend_all: { name: 'Mend All', who: 'ain', mp: 16, target: 'party', heal: { wilMult: 1.3, flat: 15 }, learn: { level: 13 },
    desc: 'Heal every ally WIL×1.3 + 15.' },
  overload: { name: 'Overload', who: 'ain', mp: 26, target: 'all', type: 'shock', spellPower: 34, perTarget: 0.8,
    learn: { level: 14 }, desc: 'Shock on every enemy, spell power 34 (×0.8 each).' },
  // Valka
  riposte: { name: 'Riposte', who: 'valka', mp: 5, target: 'self', status: { id: 'riposte', chance: 1, rounds: 3, counters: 2 },
    learn: { level: 1 }, desc: 'Counter the next 2 physical hits at 1.0×.' },
  taunt: { name: 'Taunt', who: 'valka', mp: 4, target: 'self', taunt: 2, learn: { level: 1 },
    desc: 'Enemies target Valka for 2 rounds.' },
  bleeding_cut: { name: 'Bleeding Cut', who: 'valka', mp: 6, target: 'one', mult: 1.1, type: 'weapon',
    status: { id: 'bleed', chance: 0.7, rounds: 3 }, learn: { level: 6 }, desc: '1.1×, 70% bleed.' },
  rally: { name: 'Rally', who: 'valka', mp: 12, target: 'party', heal: { pctMax: 15 }, learn: { level: 9 },
    desc: 'Heal every ally 15% of max HP.' },
  corsairs_gambit: { name: "Corsair's Gambit", who: 'valka', mp: 8, target: 'none', gambit: true, learn: { level: 12 },
    desc: 'Anything can happen. Usually something good. Sometimes "Bah."' },
};

// ───────── helpers (pure) ─────────

// Stat line before gear: linear between lv1 and lv17 (BALANCE §2), extended past 17.
export function baseStats(id, level) {
  const m = MEMBERS[id];
  if (m.fixed) {
    const lv = m.fixed[level] ? level : Object.keys(m.fixed).map(Number).reduce((a, b) => (Math.abs(b - level) < Math.abs(a - level) ? b : a));
    return { ...m.fixed[lv] };
  }
  const out = {};
  for (const k of Object.keys(m.lv1)) out[k] = Math.round(m.lv1[k] + (m.lv17[k] - m.lv1[k]) * (level - 1) / 16);
  return out;
}

// XP to go from level L to L+1 = round(18 × L^1.55); cumulative XP to reach a level.
export const MAX_LEVEL = 20;
export function xpToNext(level) { return Math.round(18 * Math.pow(level, 1.55)); }
export function xpToReach(level) { let s = 0; for (let l = 1; l < level; l++) s += xpToNext(l); return s; }
export function levelForXp(xp) { let l = 1; while (l < MAX_LEVEL && xp >= xpToReach(l + 1)) l++; return l; }

// Skills a member knows: learn.level ≤ party level, or learn.flag set (flags: a Set, array or object).
export function knownSkills(id, level, flags) {
  const has = (f) => (flags instanceof Set ? flags.has(f) : Array.isArray(flags) ? flags.includes(f) : !!(flags && flags[f]));
  return (MEMBERS[id].skills || []).filter((s) => {
    const l = SKILLS[s].learn;
    return (l.level != null && level >= l.level) || (l.flag && has(l.flag));
  });
}
