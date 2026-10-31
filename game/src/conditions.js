// conditions.js: the condition and effect interpreters (DATA_SPEC §4).
// Presentation and flow (toasts, battles, scenes, travel) go through `hooks`,
// which main.js fills, so this module has no UI dependencies.

import { DB, S, R, partyLevel, fullHeal, makeMember } from './state.js';
import * as Inv from './inventory.js';

export const hooks = {
  toast: () => {}, log: () => {}, sfx: () => {}, music: () => {}, fx: () => {},
  battle: async () => 'won', scene: async () => {}, dialogue: async () => {},
  goto: async () => {}, autosave: () => {}, chapterEnd: async () => {},
  shop: async () => {}, tip: () => {}, refresh: () => {}, objectiveChanged: () => {},
};

// ---------------------------------------------------------------- conditions
export function check(c) {
  if (c == null) return true;
  if (typeof c !== 'object') return !!c;
  if ('flag' in c) {
    const v = S.flags[c.flag];
    if ('eq' in c) return v === c.eq || (c.eq === true && v === true);
    if ('gte' in c) return (typeof v === 'number' ? v : (v ? 1 : 0)) >= c.gte;
    return !!v;
  }
  if ('not' in c) return !check(c.not);
  if ('all' in c) return c.all.every(check);
  if ('any' in c) return c.any.some(check);
  if ('has' in c) return Inv.count(c.has, true) >= (c.n || 1);
  if ('inParty' in c) return S.party.some(p => p.id === c.inParty && !p.frozen);
  if ('guest' in c) return S.guest?.id === c.guest;
  if ('visited' in c) return !!S.visited[c.visited];
  if ('inRoom' in c) return S.room === c.inRoom;
  if ('gold' in c) return cmp(S.gold, c.gold);
  if ('objective' in c) return (S.journal.obj[c.objective] || 'none') === (c.is || 'active');
  if ('level' in c) return cmp(partyLevel(), c.level);
  if ('script' in c) { const f = DB.scripts[c.script]; return f ? !!f(api(), 'cond') : false; }
  console.warn('unknown condition', c);
  return false;
}

function cmp(v, o) {
  if (typeof o === 'number') return v === o;
  if ('gte' in o && !(v >= o.gte)) return false;
  if ('gt' in o && !(v > o.gt)) return false;
  if ('lte' in o && !(v <= o.lte)) return false;
  if ('lt' in o && !(v < o.lt)) return false;
  if ('eq' in o && v !== o.eq) return false;
  return true;
}

// Text: a string or variants [{cond, text}, …, {text}].
export function text(t) {
  if (t == null) return '';
  if (typeof t === 'string') return t;
  if (Array.isArray(t)) {
    for (const v of t) {
      if (typeof v === 'string') return v;
      if (check(v.cond)) return v.text ?? '';
    }
    return '';
  }
  if (typeof t === 'object' && 'text' in t) return check(t.cond) ? text(t.text) : '';
  return String(t);
}

// Response: {cond?, text, effects?, sfx?} or a list (first passing) or a string.
export function pickResponse(r) {
  if (r == null) return null;
  if (typeof r === 'string') return { text: r };
  if (Array.isArray(r)) {
    for (const x of r) {
      if (typeof x === 'string') return { text: x };
      if (check(x.cond)) return x;
    }
    return null;
  }
  return check(r.cond) ? r : null;
}

// ---------------------------------------------------------------- effects
export function api() {
  return { S, R, DB, check, run, hooks, Inv };
}

// Runs effects in order. Returns false if the chain was cut (lost battle,
// a load happened meanwhile), true otherwise.
export async function run(effects, ctx = {}) {
  if (!effects) return true;
  const list = Array.isArray(effects) ? effects : [effects];
  const epoch = R.epoch;
  for (const e of list) {
    if (R.epoch !== epoch) return false;
    if (!e || typeof e !== 'object') continue;
    if ('cond' in e && !check(e.cond)) continue;
    const ok = await runOne(e, ctx);
    if (ok === false) return false;
  }
  hooks.refresh();
  return true;
}

async function runOne(e, ctx) {
  if ('effects' in e && !('battle' in e)) return run(e.effects, ctx);          // effect group {cond, effects:[…]}
  if ('set' in e) { S.flags[e.set] = 'to' in e ? e.to : true; return; }
  if ('clear' in e) { delete S.flags[e.clear]; return; }
  if ('text' in e) { hooks.log({ speaker: e.speaker || 'narrator', text: text(e.text) }); return; }
  if ('give' in e) {
    const n = e.n || 1; Inv.add(e.give, n);
    const it = DB.items[e.give];
    hooks.toast(`+ ${it?.name || e.give}${n > 1 ? ' ×' + n : ''}`, 'item');
    hooks.sfx(e.sfx || 'pickup');
    if (!e.quiet) hooks.tip('item');
    return;
  }
  if ('take' in e) {
    const n = e.n || 1; Inv.remove(e.take, n, true);
    if (!e.quiet) hooks.toast(`− ${DB.items[e.take]?.name || e.take}${n > 1 ? ' ×' + n : ''}`, 'item');
    return;
  }
  if ('gold' in e) {
    S.gold = Math.max(0, S.gold + e.gold);
    hooks.toast(`${e.gold >= 0 ? '+' : '−'}${Math.abs(e.gold)} silver`, 'gold');
    hooks.sfx('coins');
    return;
  }
  if ('join' in e) {
    if (!S.party.some(p => p.id === e.join)) {
      const pm = makeMember(e.join); fullHeal(pm); S.party.push(pm);
      for (const [id, n] of Object.entries(DB.members[e.join]?.startItems || {})) Inv.add(id, n);
      hooks.toast(`${DB.members[e.join]?.name || e.join} joins the party`, 'join');
      hooks.sfx('join');
    }
    return;
  }
  if ('leave' in e) {
    const pm = S.party.find(p => p.id === e.leave);
    if (pm) for (const [slot, id] of Object.entries(pm.equip || {})) if (id) { S.items[id] = (S.items[id] || 0) + 1; pm.equip[slot] = null; }
    S.party = S.party.filter(p => p.id !== e.leave); return;
  }
  if ('freeze' in e) { const p = S.party.find(p => p.id === e.freeze); if (p) p.frozen = true; return; }
  if ('unfreeze' in e) { const p = S.party.find(p => p.id === e.unfreeze); if (p) p.frozen = false; return; }
  if ('guest' in e) { S.guest = { id: e.guest, level: e.level || partyLevel() }; return; }
  if ('guestLeave' in e) { S.guest = null; return; }
  if ('learn' in e) {
    const p = S.party.find(p => p.id === e.learn.who);
    if (p && !p.skills.includes(e.learn.skill)) p.skills.push(e.learn.skill);
    hooks.toast(`${DB.members[e.learn.who]?.name || e.learn.who} learns ${DB.skills[e.learn.skill]?.name || e.learn.skill}`, 'skill');
    return;
  }
  if ('battle' in e) {
    // the chain continues after a win, or after a scripted loss (encounter
    // onLose is a list of effects: tutorial, duel); it stops on a game over
    const res = await hooks.battle(e.battle, e);
    if (res === 'won') return true;
    const enc = DB.encounters[e.battle];
    return res === 'lost' && Array.isArray(enc?.onLose) && R.epoch !== undefined;
  }
  if ('goto' in e) { await hooks.goto(e.goto, { quiet: e.quiet }); return; }
  if ('openExit' in e) { S.exits[e.openExit.room + '.' + e.openExit.dir] = true; return; }
  if ('closeExit' in e) { S.exits[e.closeExit.room + '.' + e.closeExit.dir] = false; return; }
  if ('objective' in e) {
    const { id, to } = e.objective;
    const prev = S.journal.obj[id];
    if (prev === to) return;
    if (to === 'active' && prev === 'done') return;
    if (to === 'closed' && (prev === 'done' || !prev)) return;   // only an open quest can be lost
    if (prev === 'closed') return;
    S.journal.obj[id] = to;
    const o = DB.objectives[id];
    if (to === 'done') { hooks.toast(`✦ ${o?.text || id}`, 'done'); hooks.sfx('solve'); }
    else if (to === 'closed') hooks.toast(`Lost to time: ${o?.text || id}`, 'info');
    else hooks.toast(`${o?.side ? 'Side quest' : 'New goal'}: ${o?.text || id}`, 'goal');
    hooks.objectiveChanged(id, to);
    return;
  }
  if ('scene' in e) { await hooks.scene(e.scene); return; }
  if ('dialogue' in e) { await hooks.dialogue(e.dialogue); return; }
  if ('heal' in e) { for (const p of S.party) if (!p.frozen) fullHeal(p); hooks.toast('The party is restored', 'heal'); hooks.sfx('heal'); return; }
  if ('autosave' in e) { hooks.autosave(true); return; }
  if ('chapterEnd' in e) { await hooks.chapterEnd(e.chapterEnd); return; }
  if ('transform' in e) { Inv.transform(e.transform.from, e.transform.to); return; }
  if ('sfx' in e) { hooks.sfx(e.sfx); return; }
  if ('music' in e) { hooks.music(e.music); return; }
  if ('ambience' in e) { hooks.ambience(e.ambience); return; }
  if ('checkpoint' in e) { hooks.checkpoint(e.checkpoint); return; }
  if ('fx' in e) { hooks.fx(e.fx, e); return; }
  if ('shop' in e) { await hooks.shop(e.shop); return; }
  if ('tip' in e) { hooks.tip(e.tip); return; }
  if ('equip' in e) { Inv.equip(e.equip.who, e.equip.item, { force: true }); return; }
  if ('script' in e) {
    const f = DB.scripts[e.script];
    if (f) await f(api(), 'effect', e);
    else console.warn('missing script', e.script);
    return;
  }
  console.warn('unknown effect', e);
}
