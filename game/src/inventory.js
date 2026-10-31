// inventory.js: the shared bag, equipment, comparisons, Best gear
// (BALANCE §6), field use of consumables and shop prices.

import { DB, S, gearStats, member } from './state.js';

export const SLOTS = ['weapon', 'off', 'body', 'head', 'charm'];
export const SLOT_NAMES = { weapon: 'Weapon', off: 'Off-hand', body: 'Body', head: 'Head', charm: 'Charm' };
export const TABS = ['all', 'weapon', 'armor', 'charm', 'use', 'key'];
export const TAB_NAMES = { all: 'All', weapon: 'Weapons', armor: 'Armor', charm: 'Charms', use: 'Use', key: 'Key' };

export function item(id) { return DB.items[id] || null; }
export function itemName(id) { return DB.items[id]?.name || DB.members[id]?.name || prettify(id); }
export function prettify(id) { return String(id).replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase()); }

export function companions() {
  return S.party.filter(p => p.id !== 'kord' && !p.frozen).map(p => p.id);
}
export function isCompanion(id) { return companions().includes(id); }

export function equippedBy(id) {
  for (const p of S.party) for (const s of SLOTS) if (p.equip[s] === id) return { member: p.id, slot: s };
  return null;
}

// count in bag (+ equipped when includeEquipped). Companions count as held.
export function count(id, includeEquipped = true) {
  if (isCompanion(id)) return 1;
  let n = S.items[id] || 0;
  if (includeEquipped) for (const p of S.party) for (const s of SLOTS) if (p.equip[s] === id) n++;
  return n;
}

export function add(id, n = 1) {
  S.items[id] = (S.items[id] || 0) + n;
  S.newItems[id] = true;
}

export function remove(id, n = 1, allowEquipped = false) {
  let left = n;
  const inBag = Math.min(S.items[id] || 0, left);
  if (inBag) { S.items[id] -= inBag; left -= inBag; if (S.items[id] <= 0) delete S.items[id]; }
  if (left > 0 && allowEquipped) {
    for (const p of S.party) for (const s of SLOTS) if (left > 0 && p.equip[s] === id) { p.equip[s] = null; left--; }
  }
  return n - left;
}

export function transform(from, to) {
  if (S.items[from]) { const n = S.items[from]; delete S.items[from]; S.items[to] = (S.items[to] || 0) + n; S.newItems[to] = true; }
  else add(to, 1);
}

export function tabOf(id) {
  if (isCompanion(id)) return 'key';
  const it = item(id); if (!it) return 'key';
  if (it.kind === 'weapon') return 'weapon';
  if (it.kind === 'armor') return 'armor';
  if (it.kind === 'charm') return 'charm';
  if (it.kind === 'consumable') return 'use';
  if (it.kind === 'treasure') return 'use';
  return 'key';
}

const KIND_ORDER = { weapon: 0, armor: 1, charm: 2, consumable: 3, treasure: 4, key: 5 };
export function list(tab = 'all', sort = 'type') {
  const out = [];
  for (const [id, n] of Object.entries(S.items)) if (n > 0) out.push({ id, n, it: item(id), equippedBy: null, isNew: !!S.newItems[id] });
  for (const p of S.party) for (const s of SLOTS) {
    const id = p.equip[s]; if (!id) continue;
    out.push({ id, n: 1, it: item(id), equippedBy: p.id, slot: s, isNew: false });
  }
  for (const c of companions()) out.push({ id: c, n: 1, it: null, companion: true, isNew: false });
  const filtered = out.filter(e => tab === 'all' || tabOf(e.id) === tab);
  const power = e => e.it ? (e.it.power || e.it.def || 0) : -1;
  const value = e => e.it ? (e.it.value || e.it.price || e.it.sell || 0) : -1;
  const order = Object.keys(S.items);
  const sorters = {
    type: (a, b) => (KIND_ORDER[a.it?.kind] ?? 9) - (KIND_ORDER[b.it?.kind] ?? 9) || itemName(a.id).localeCompare(itemName(b.id)),
    power: (a, b) => power(b) - power(a),
    value: (a, b) => value(b) - value(a),
    newest: (a, b) => (b.isNew - a.isNew) || (order.indexOf(b.id) - order.indexOf(a.id)),
  };
  filtered.sort(sorters[sort] || sorters.type);
  return filtered;
}

export function markSeen(id) { delete S.newItems[id]; }

// ---------------------------------------------------------------- equipping
export function slotFor(it, wantOff = false) {
  if (!it) return null;
  if (it.kind === 'weapon') return wantOff && it.offhand ? 'off' : 'weapon';
  if (it.kind === 'armor') return it.slot;
  if (it.kind === 'charm') return 'charm';
  return null;
}

function usersOk(it, mid) {
  const u = it.users;
  if (!u || u === 'any') return true;
  return Array.isArray(u) ? u.includes(mid) : u === mid;
}

export function canEquip(mid, id, slot) {
  const it = item(id), m = member(mid);
  if (!it || !m) return { ok: false, reason: 'That is not something to wear.' };
  slot = slot || slotFor(it);
  if (!slot) return { ok: false, reason: 'That is not something to wear.' };
  const slots = m.slots || SLOTS;
  if (!slots.includes(slot)) return { ok: false, reason: `${m.name} has no ${SLOT_NAMES[slot].toLowerCase()} slot.` };
  if (it.kind === 'charm' && it.sorcerous && m.refusesSorcerous) return { ok: false, reason: '"Sorcery. Keep it away from me."' };
  if (!usersOk(it, mid)) return { ok: false, reason: `${m.name} can't use that.` };
  if (it.kind === 'weapon') {
    if (m.classes && it.class && !m.classes.includes(it.class)) return { ok: false, reason: `${m.name} can't use that.` };
    if (slot === 'off') {
      if (!it.offhand) return { ok: false, reason: 'That needs both hands, or at least the main one.' };
      const w = item(S.party.find(p => p.id === mid)?.equip.weapon);
      if (w && (w.twoHanded || w.class === 'bow')) return { ok: false, reason: 'Both hands are busy.' };
    }
  }
  if (slot === 'off' && it.kind === 'armor' && m.shields === false) return { ok: false, reason: `${m.name} doesn't carry a shield.` };
  return { ok: true, slot };
}

export function equip(mid, id, opts = {}) {
  const pm = S.party.find(p => p.id === mid);
  if (!pm) return { ok: false, reason: 'Not in the party.' };
  const chk = canEquip(mid, id, opts.slot);
  if (!chk.ok && !opts.force) return chk;
  const slot = chk.slot || opts.slot || slotFor(item(id));
  // take the item from wherever it is: bag first, else another wearer
  if ((S.items[id] || 0) > 0) remove(id, 1);
  else {
    const w = equippedBy(id);
    if (w && !(w.member === mid && w.slot === slot)) { S.party.find(p => p.id === w.member).equip[w.slot] = null; }
    else if (!w && !opts.force) return { ok: false, reason: 'You do not have that.' };
    else if (w) return { ok: true, slot };
  }
  const prev = pm.equip[slot];
  if (prev) add(prev, 1), delete S.newItems[prev];
  pm.equip[slot] = id;
  const it = item(id);
  if (slot === 'weapon' && it && (it.twoHanded || it.class === 'bow') && pm.equip.off) {
    add(pm.equip.off, 1); delete S.newItems[pm.equip.off]; pm.equip.off = null;
  }
  markSeen(id);
  clampHp(pm);
  return { ok: true, slot };
}

export function unequip(mid, slot) {
  const pm = S.party.find(p => p.id === mid);
  if (!pm || !pm.equip[slot]) return false;
  add(pm.equip[slot], 1); delete S.newItems[pm.equip[slot]];
  pm.equip[slot] = null;
  clampHp(pm);
  return true;
}

function clampHp(pm) {
  const st = gearStats(pm);
  pm.hp = Math.min(pm.hp, st.hp); pm.mp = Math.min(pm.mp, st.mp);
}

// ---------------------------------------------------------------- scoring (BALANCE §6)
function threats() { return DB.threats[S.chapter] || []; }

export function score(mid, equip) {
  const pm = S.party.find(p => p.id === mid) || { id: mid, equip: {} };
  const st = gearStats(pm, equip);
  const atk = st.atk + st.power;
  let base;
  switch (mid) {
    case 'toktai': {
      base = atk * 0.8 + st.agi * 1.0 + st.def * 0.6 + st.crit * 0.5;
      // the bow is his trade: his shooting skills, full damage to flyers, and
      // he fights from the back. Count its power double plus a flat bonus, so a
      // pair of daggers (crit + off-hand) never beats a comparable bow.
      const w = item(equip.weapon);
      if (w && w.class === 'bow') base += (w.power || 0) * 0.8 + 6 + (threats().includes('flyer') ? 4 : 0);
      break;
    }
    case 'valka': base = atk * 1.0 + st.agi * 0.8 + st.def * 0.7 + st.crit * 0.4; break;
    case 'ain': base = st.wil * 1.0 + st.mpPct * 0.5 + st.def * 0.5; break;
    default: base = atk * 1.0 + st.def * 0.8 + st.agi * 0.5 + st.hpPct * 0.5;
  }
  const th = threats();
  for (const s of SLOTS) {
    const it = item(equip[s]); if (!it) continue;
    for (const x of [...(it.immune || []), ...(it.resist || [])]) base += th.includes(x) ? 6 : 1;
    if (it.vs && th.includes(it.vs.tag)) base += atk * 0.10;
  }
  return base;
}

function candidates(mid, slot, includeWorn) {
  const ids = new Set();
  for (const [id, n] of Object.entries(S.items)) if (n > 0) ids.add(id);
  if (includeWorn) for (const p of S.party) for (const s of SLOTS) if (p.equip[s]) ids.add(p.equip[s]);
  const pm = S.party.find(p => p.id === mid);
  for (const s of SLOTS) if (pm.equip[s]) ids.add(pm.equip[s]);
  return [...ids].filter(id => {
    const it = item(id); if (!it) return false;
    if (it.kind === 'charm' && it.sorcerous && member(mid)?.refusesSorcerous) return false;
    if (slot === 'weapon') return it.kind === 'weapon' && canEquipLoose(mid, id, 'weapon');
    if (slot === 'off') return (it.kind === 'weapon' ? it.offhand : it.kind === 'armor' && it.slot === 'off') && canEquipLoose(mid, id, 'off');
    if (slot === 'charm') return it.kind === 'charm' && canEquipLoose(mid, id, 'charm');
    return it.kind === 'armor' && it.slot === slot && canEquipLoose(mid, id, slot);
  });
}
function canEquipLoose(mid, id, slot) {
  const it = item(id), m = member(mid);
  if (!it || !m) return false;
  if (!(m.slots || SLOTS).includes(slot)) return false;
  if (!usersOk(it, mid)) return false;
  if (it.kind === 'weapon' && m.classes && it.class && !m.classes.includes(it.class)) return false;
  if (slot === 'off' && it.kind === 'armor' && m.shields === false) return false;
  return true;
}

// Best loadout for one member using what's in the bag and what they wear.
export function bestFor(mid, includeWorn = false) {
  const pm = S.party.find(p => p.id === mid); if (!pm) return null;
  const cur = { ...pm.equip };
  let best = { ...cur }, bestScore = score(mid, cur);
  const m = member(mid), slots = m?.slots || SLOTS;
  // weapon + off together (two-handers compared against main + off-hand)
  if (slots.includes('weapon')) {
    const ws = [null, ...candidates(mid, 'weapon', includeWorn)];
    const os = slots.includes('off') ? [null, ...candidates(mid, 'off', includeWorn)] : [null];
    for (const w of ws) for (const o of os) {
      if (w && o && w === o && count(w, true) < 2) continue;
      const wi = item(w);
      if (o && wi && (wi.twoHanded || wi.class === 'bow')) continue;
      const trial = { ...best, weapon: w, off: o };
      const sc = score(mid, trial);
      if (sc > bestScore + 1e-9) { best = trial; bestScore = sc; }
    }
  }
  for (const s of ['body', 'head', 'charm']) {
    if (!slots.includes(s)) continue;
    for (const id of [null, ...candidates(mid, s, includeWorn)]) {
      const trial = { ...best, [s]: id };
      const sc = score(mid, trial);
      if (sc > bestScore + 1e-9) { best = trial; bestScore = sc; }
    }
  }
  return best;
}

function applyLoadout(mid, eq) {
  const pm = S.party.find(p => p.id === mid);
  const changes = [];
  for (const s of SLOTS) {
    if (pm.equip[s] === eq[s]) continue;
    if (pm.equip[s]) unequip(mid, s);
  }
  for (const s of SLOTS) {
    if (eq[s] && pm.equip[s] !== eq[s]) { equip(mid, eq[s], { slot: s }); changes.push(eq[s]); }
  }
  return changes;
}

export function bestGear(mid) {
  const eq = bestFor(mid, false);
  if (!eq) return [];
  return applyLoadout(mid, eq);
}

// Whole party: slot by slot, each piece to the member who gains the most;
// a worn piece only moves when the new wearer gains more than the old loses.
export function bestGearParty() {
  const members = S.party.filter(p => !p.frozen).map(p => p.id);
  const changed = [];
  for (const slot of SLOTS) {
    for (let guard = 0; guard < 12; guard++) {
      let bestMove = null;
      for (const mid of members) {
        const pm = S.party.find(p => p.id === mid);
        if (!(member(mid)?.slots || SLOTS).includes(slot)) continue;
        const cur = score(mid, pm.equip);
        for (const id of candidates(mid, slot, true)) {
          if (pm.equip[slot] === id) continue;
          const trial = { ...pm.equip, [slot]: id };
          const it = item(id);
          if (slot === 'weapon' && it && (it.twoHanded || it.class === 'bow')) trial.off = null;
          if (slot === 'off') { const w = item(pm.equip.weapon); if (w && (w.twoHanded || w.class === 'bow')) continue; }
          const w = (S.items[id] || 0) > 0 ? null : equippedBy(id);
          if (w && w.member === mid) trial[w.slot] = null;   // moving a piece between own slots
          let gain = score(mid, trial) - cur;
          if (w && w.member !== mid) {
            const other = S.party.find(p => p.id === w.member);
            gain -= score(other.id, other.equip) - score(other.id, { ...other.equip, [w.slot]: null });
          }
          if (gain > 1e-9 && (!bestMove || gain > bestMove.gain)) bestMove = { mid, id, gain };
        }
      }
      if (!bestMove) break;
      equip(bestMove.mid, bestMove.id, { slot, force: true });
      changed.push(bestMove);
    }
  }
  return changed;
}

// Stat deltas if member wore id instead of what they wear now.
export function compare(mid, id) {
  const pm = S.party.find(p => p.id === mid); if (!pm) return null;
  const it = item(id);
  const slot = slotFor(it, it?.kind === 'weapon' && it.offhand && !canEquip(mid, id, 'weapon').ok);
  if (!slot) return null;
  const chk = canEquip(mid, id, slot);
  if (!chk.ok) return { ok: false, reason: chk.reason };
  const trial = { ...pm.equip, [slot]: id };
  if (slot === 'weapon' && it && (it.twoHanded || it.class === 'bow')) trial.off = null;
  const a = gearStats(pm), b = gearStats(pm, trial);
  const d = {};
  for (const k of ['attack', 'def', 'agi', 'wil', 'hp', 'mp', 'crit']) if (b[k] !== a[k]) d[k] = b[k] - a[k];
  return { ok: true, slot, deltas: d, worn: pm.equip[slot] === id, current: pm.equip[slot], score: score(mid, trial) - score(mid, pm.equip) };
}

export function eligibleMembers(id) {
  return S.party.filter(p => !p.frozen && canEquip(p.id, id).ok || (!p.frozen && item(id)?.offhand && canEquip(p.id, id, 'off').ok)).map(p => p.id);
}

// ---------------------------------------------------------------- field use
export function useConsumable(id, mid) {
  const it = item(id); const pm = S.party.find(p => p.id === mid);
  if (!it || it.kind !== 'consumable') return { ok: false, text: 'That is not for drinking or eating.' };
  if (it.field === false) return { ok: false, text: 'That is for battle.' };
  if (!pm) return { ok: false, text: 'Use it on whom?' };
  const eff = it.effect || {};
  const st = gearStats(pm);
  if (eff.damage || eff.move) return { ok: false, text: 'Save that for an enemy.' };
  let msg = '';
  if (eff.heal) { const before = pm.hp; pm.hp = Math.min(st.hp, pm.hp + eff.heal); msg = `${member(mid)?.name} recovers ${pm.hp - before} HP.`; }
  if (eff.mp || eff.mpFull) { const before = pm.mp; pm.mp = eff.mpFull ? st.mp : Math.min(st.mp, pm.mp + eff.mp); msg += ` ${member(mid)?.name} recovers ${pm.mp - before} MP.`; }
  if (eff.cure) { pm.statuses = (pm.statuses || []).filter(s => !eff.cure.includes(s.id || s)); msg += ' Cured.'; }
  if (eff.revive && pm.hp <= 0) { pm.hp = Math.round(st.hp * (eff.revive / 100 || 0.3)); msg = `${member(mid)?.name} rises again.`; }
  if (!msg) msg = 'Nothing much happens.';
  remove(id, 1);
  return { ok: true, text: msg.trim() };
}

// ---------------------------------------------------------------- shops
export function buyPrice(entry) { return entry.price ?? item(entry.item)?.price ?? 0; }

export function sellPrice(id) {
  const it = item(id);
  if (!it || it.kind === 'key') return null;
  if (it.kind === 'treasure') return it.value ?? null;
  if (it.sell != null) return it.sell;
  if (it.price == null) return null;
  return Math.floor(it.price / 2);
}

export function canSellTo(shop, id) {
  const it = item(id); if (!it || !shop.buys) return false;
  if (sellPrice(id) == null) return false;
  return !shop.buysKinds || shop.buysKinds.includes(it.kind);
}

export function sell(shop, id, n = 1) {
  if (!canSellTo(shop, id)) return 0;
  const have = S.items[id] || 0; n = Math.min(n, have);
  if (n <= 0) return 0;
  remove(id, n);
  const g = sellPrice(id) * n; S.gold += g;
  return g;
}

export function buy(entry, n = 1) {
  const p = buyPrice(entry) * n;
  if (S.gold < p) return false;
  S.gold -= p; add(entry.item, n);
  return true;
}

export function sellAllTreasures(shop) {
  let g = 0;
  for (const [id, n] of Object.entries(S.items)) if (item(id)?.kind === 'treasure' && canSellTo(shop, id)) g += sell(shop, id, n);
  return g;
}

// Who'd gain from a new piece (for the "Equip now" toast).
export function upgradeFor(id) {
  for (const p of S.party) {
    if (p.frozen) continue;
    const c = compare(p.id, id);
    if (c && c.ok && !c.worn && c.score > 0.5) return p.id;
  }
  return null;
}
