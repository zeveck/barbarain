// actions.js: look / take / use / give / combine / talk / hit / go / say /
// shout, the fallback chains (DATA_SPEC §6), targeting mode, onAction
// counting, room travel, inns, shops, hints, and Seek trouble.

import { DB, S, R, SETTINGS, pickFrom, partyLevel, fullHeal, gearStats } from './state.js';
import { check, run, text as resolveText, pickResponse, hooks } from './conditions.js';
import * as Inv from './inventory.js';
import * as UI from './ui.js';
import * as Scene from './scene.js';
import * as Audio from './audio.js';
import { runDialogue } from './dialogue.js';
import { makeSeekTroubleEncounter } from './battle.js';

const el = UI.el;

// ---------------------------------------------------------------- scope
export function curRoom() { return DB.rooms[S.room]; }

// A thing as the engine sees it (NPC registry merged in).
export function view(t) {
  if (!t) return null;
  if (t.kind === 'npc' && t.npc) {
    const reg = DB.npcs[t.npc] || {};
    const sprite = t.sprite || reg.sprite ? { id: reg.sprite, ...(typeof t.sprite === 'object' ? t.sprite : {}) } : null;
    return { ...reg, ...t, name: t.name || reg.name || t.id, names: [...(reg.names || []), ...(t.names || [])], portrait: reg.portrait, sprite, machine: reg.machine };
  }
  return { ...t, name: t.name || Inv.prettify(t.id), names: t.names || [] };
}

export function things(room = curRoom()) {
  if (!room) return [];
  return (room.things || []).filter(t => check(t.cond)).map(view);
}
export function thing(id, room = curRoom()) { return things(room).find(t => t.id === id) || null; }

export function exitOpen(room, ex) {
  const o = S.exits[room.id + '.' + ex.dir];
  if (o === true) return true;
  if (o === false) return false;
  return check(ex.cond);
}
export function exits(room = curRoom()) {
  return (room?.exits || []).filter(ex => !ex.hidden || exitOpen(room, ex)).filter(ex => !ex.hideWhenClosed || exitOpen(room, ex));
}
export function findExit(word, room = curRoom()) {
  const w = String(word).toLowerCase();
  const dirs = { north: 'n', south: 's', east: 'e', west: 'w', up: 'u', down: 'd', inside: 'in', outside: 'out' };
  const d = dirs[w] || w;
  return exits(room).find(ex => ex.dir === d || ex.to === w || (ex.names || []).includes(w) || ex.label.toLowerCase() === w) || null;
}

export function speakerInfo(id) {
  const m = DB.members[id];
  if (m) return { name: m.name, portrait: m.portrait, machine: id === 'ain' };
  const n = DB.npcs[id];
  if (n) return { name: n.name, portrait: n.portrait || (n.sprite ? n.sprite : null), machine: !!n.machine };
  return { name: Inv.prettify(id), portrait: null };
}

export function nameOf(id) {
  const t = thing(id); if (t) return t.name;
  if (DB.items[id]) return DB.items[id].name;
  const ex = exits().find(e => e.dir === id || e.to === id); if (ex) return DB.rooms[ex.to]?.name || ex.label;
  if (DB.members[id]) return DB.members[id].name;
  if (DB.npcs[id]) return DB.npcs[id].name;
  return Inv.prettify(id);
}

// ---------------------------------------------------------------- output
function sub(t, vars) { return String(t).replace(/\{(item|target)\}/g, (m, k) => vars?.[k] ?? m); }

export async function say(textOrEntry) {
  const e = typeof textOrEntry === 'string' ? { text: textOrEntry } : textOrEntry;
  return UI.log({ ...e, nameOf });
}

// Print a response (object/list/string) and run its effects. Returns true if one existed.
export async function respond(r, vars) {
  const x = pickResponse(r);
  if (!x) return false;
  const t = resolveText(x.text);
  const epoch = R.epoch;
  if (t) await say({ speaker: x.speaker || 'narrator', text: sub(t, vars) });
  if (R.epoch !== epoch) return true;
  if (x.sfx) Audio.sfx(x.sfx);
  if (x.effects) await run(x.effects);
  return true;
}

function pool(name, key) {
  const d = DB.defaults || {};
  const p = name.split('.').reduce((o, k) => o?.[k], d);
  return Array.isArray(p) && p.length ? pickFrom(p, key || name) : null;
}
async function fallback(names, vars) {
  for (const n of names) {
    const line = pool(n);
    if (line) { await respond(line, vars); return true; }
  }
  await say(sub('Kord considers it. Nothing comes of it.', vars));
  return true;
}

function kindKey(id) {
  if (Inv.isCompanion(id)) return 'companion';
  const it = DB.items[id]; if (!it) return 'key';
  if (it.kind === 'consumable') return ['food'].includes(it.icon) ? 'food' : ['potion_red', 'potion_blue', 'wine'].includes(it.icon) ? 'potion' : 'consumable';
  if (it.kind === 'key' && ['document', 'scroll'].includes(it.icon)) return 'document';
  return it.kind;
}

// ---------------------------------------------------------------- action counting / onAction
export async function counted(fn) {
  R.battleResult = null;
  await fn();
  const room = curRoom(); if (!room) return;
  const fledNow = R.battleResult === 'fled';   // don't throw the party straight into a second fight
  R.actionCount[room.id] = (R.actionCount[room.id] || 0) + 1;
  R.idleSeconds = 0;
  const oa = room.onAction;
  if (oa && !fledNow && !R.fired[room.id + '.action'] && R.actionCount[room.id] >= oa.count && check(oa.cond)) {
    R.fired[room.id + '.action'] = true;
    R.battleResult = null;
    // a fled ambush comes again on the next action
    if (!(await run(oa.effects)) && R.battleResult === 'fled') delete R.fired[room.id + '.action'];
  }
}

// ---------------------------------------------------------------- verbs
export async function look(target) {
  if (!target || target.type === 'room') {
    const room = curRoom();
    await say({ text: resolveText(room.desc) });
    return;
  }
  if (target.type === 'thing') {
    const t = target.thing;
    if (!(await respond(t.look))) await fallback(['look'], { target: t.name });
    return;
  }
  if (target.type === 'item') return lookItem(target.id);
  if (target.type === 'exit') { const ex = target.exit; await say(ex.look ? resolveText(ex.look) : `The way ${dirWord(ex.dir)}: ${DB.rooms[ex.to]?.name || ex.label}.`); return; }
  if (target.type === 'member') {
    const m = DB.members[target.id];
    await say(resolveText(m?.look || m?.desc || m?.blurb || `${m?.name || target.id}. Still here.`));
  }
}
export async function lookItem(id) {
  if (Inv.isCompanion(id)) { const m = DB.members[id]; await say(resolveText(m?.look || m?.desc || m?.blurb || m?.name)); return; }
  const it = DB.items[id];
  const d = it ? resolveText(it.look || it.desc) : '';
  await say(d || `${Inv.itemName(id)}. It is what it is.`);
  Inv.markSeen(id);
}
function dirWord(d) { return { n: 'north', s: 'south', e: 'east', w: 'west', u: 'up', d: 'down', in: 'in', out: 'out' }[d] || d; }

export async function take(target) {
  if (target.type === 'item') {
    await say(Inv.equippedBy(target.id) ? 'Kord is already wearing it.' : 'Kord already has it.');
    return;
  }
  if (target.type === 'thing') {
    const t = target.thing;
    if (!(await respond(t.take, { target: t.name }))) await fallback(t.kind === 'npc' ? ['takeNpc', 'take'] : ['take'], { target: t.name });
    return;
  }
  if (target.type === 'member') { await say('Kord does not carry his friends. Not unless they are bleeding.'); return; }
  await fallback(['take'], { target: target.name || 'that' });
}

export async function talk(target) {
  if (target.type === 'member') return banter(target.id);
  if (target.type === 'thing') {
    const t = target.thing;
    if (typeof t.talk === 'string' && DB.dialogues[t.talk]) { await runDialogue(t.talk); return; }
    if (!(await respond(t.talk, { target: t.name }))) await fallback(t.kind === 'npc' ? ['talk'] : ['talkThing', 'talk'], { target: t.name });
    return;
  }
  if (target.type === 'item') {
    const it = DB.items[target.id];
    if (!(await respond(it?.talk, { target: Inv.itemName(target.id) }))) await fallback(['talkThing', 'talk'], { target: Inv.itemName(target.id) });
  }
}

// main-story goals before side quests (their party lines are the hints players lean on)
const mainFirst = (list) => [...list.filter(o => !o.side), ...list.filter(o => o.side)];

export async function banter(mid) {
  const room = curRoom();
  const m = DB.members[mid];
  const roomLine = room?.banter?.[mid];
  if (mid === 'kord') {
    if (roomLine && await respond(roomLine)) return;
    const act = mainFirst(Object.values(DB.objectives)).find(o => S.journal.obj[o.id] === 'active' && o.party?.kord);
    const opts = [...(DB.banter[S.chapter]?.kord || []), ...(act ? [act.party.kord] : [])];
    const self = pool('kordSelf');
    if (self) opts.push(self);
    const line = opts.length ? pickFrom(opts, 'banter.kord') : '"Crom."';
    await respond(typeof line === 'string' ? { speaker: 'kord', text: line } : { speaker: 'kord', ...line });
    return;
  }
  if (roomLine && await respond(roomLine)) return;
  const active = mainFirst(Object.values(DB.objectives)).find(o => S.journal.obj[o.id] === 'active' && o.party?.[mid]);
  const chPool = DB.banter[S.chapter]?.[mid] || [];
  const opts = [...chPool];
  if (active) opts.push(active.party[mid]);
  if (!opts.length) { await say({ speaker: mid, text: `${m?.name || mid} shrugs.` }); return; }
  const line = pickFrom(opts, 'banter.' + mid);
  await respond(typeof line === 'string' ? { speaker: mid, text: line } : { speaker: mid, ...line });
}

export async function hit(target) {
  if (target.type === 'thing') {
    const t = target.thing;
    if (!(await respond(t.hit, { target: t.name }))) await fallback(t.kind === 'npc' ? ['hitNpc', 'hit'] : ['hit'], { target: t.name });
    return;
  }
  if (target.type === 'member') { await say({ speaker: target.id === 'ain' ? 'ain' : target.id, text: target.id === 'ain' ? '"I would prefer you did not. It accomplishes nothing and I can feel it."' : '"Try it, Cimmerian."' }); return; }
  await fallback(['hit'], { target: target.name || 'that' });
}

// use X (item id) on target. how: 'typed' | 'tap'
export async function use(itemId, target, how = 'typed') {
  const it = DB.items[itemId];
  const vars = { item: Inv.itemName(itemId), target: target?.thing?.name || target?.name || '' };
  if (!target) {
    // bare use: consumables are drunk or eaten, the rest asks for a target
    if (it?.kind === 'consumable') return drink(itemId);
    startTargeting(itemId, 'use');
    return;
  }
  if (target.type === 'member') {
    if (memberRecipe(itemId, target.id)) return combine(itemId, target.id);   // "use candle on toktai": a companion's craft
    if (it?.kind === 'consumable') return drink(itemId, target.id);
    if (it && ['weapon', 'armor', 'charm'].includes(it.kind)) { equipItem(target.id, itemId); return; }
    await fallback(['byKind.' + kindKey(itemId), 'kordRefusals'], vars);
    return;
  }
  if (target.type === 'item') return combine(itemId, target.id);
  if (target.type === 'exit') { await fallback(['byKind.' + kindKey(itemId), 'kordRefusals'], vars); return; }
  if (target.type !== 'thing') return;
  const t = target.thing;
  const tryUse = async () => {
    if (t.use && t.use[itemId] && await respond(t.use[itemId], vars)) return true;
    if (it?.kind === 'weapon' && t.hit && await respond(t.hit, vars)) return true;
    return false;
  };
  const tryGive = async () => t.kind === 'npc' && t.give && t.give[itemId] && await respond(t.give[itemId], vars);
  if (how === 'tap' && t.kind === 'npc') {
    // tap an NPC while targeting: give[X] → use[X] → rest of the give chain
    if (await tryGive()) return;
    if (await tryUse()) return;
    return giveRest(t, itemId, vars);
  }
  if (await tryUse()) return;
  if (t.use && t.use['*'] && await respond(t.use['*'], vars)) return;
  if (await tryGive()) return;
  if (it?.useDefault && await respond(it.useDefault, vars)) return;
  await fallback(['byKind.' + kindKey(itemId), 'kordRefusals'], vars);
}

export async function useBare(target) {
  // "use stocks", "open gate": the thing's own `use.self` reply
  const t = target.thing;
  if (t?.use?.self && await respond(t.use.self)) return;
  if (t?.kind === 'npc') return talk(target);
  await fallback(['useBare', 'kordRefusals'], { target: t?.name || 'it' });
}

export async function give(itemId, target) {
  const vars = { item: Inv.itemName(itemId), target: target?.thing?.name || '' };
  if (!target || target.type !== 'thing' || target.thing.kind !== 'npc') {
    if (target?.type === 'member') {
      if (memberRecipe(itemId, target.id)) return combine(itemId, target.id);
      const it = DB.items[itemId];
      if (it?.kind === 'consumable') return drink(itemId, target.id);
      if (it && ['weapon', 'armor', 'charm'].includes(it.kind)) return equipItem(target.id, itemId);
    }
    await say("Kord can't give things to that.");
    return;
  }
  const t = target.thing;
  if (t.give && t.give[itemId] && await respond(t.give[itemId], vars)) return;
  return giveRest(t, itemId, vars);
}
async function giveRest(t, itemId, vars) {
  if (t.give && t.give['*'] && await respond(t.give['*'], vars)) return;
  const it = DB.items[itemId];
  if (it?.giveDefault && await respond(it.giveDefault, vars)) return;
  await fallback(['give', 'kordRefusals'], vars);
}

// a recipe whose other half is a party member (DATA_SPEC §14: companions combine like items)
const memberRecipe = (itemId, mid) => DB.recipes.some(x => ((x.a === itemId && x.b === mid) || (x.b === itemId && x.a === mid)) && check(x.cond));

export async function combine(a, b) {
  const va = { item: Inv.itemName(a), target: Inv.itemName(b) };
  if (a === b) { await say('One of them is plenty.'); return; }
  const r = DB.recipes.find(x => (x.a === a && x.b === b) || (x.a === b && x.b === a));
  if (r && check(r.cond)) {
    const consumes = r.consumes || ['a', 'b'];
    for (const c of consumes) Inv.remove(r[c], 1, true);
    if (r.result) Inv.add(r.result, r.n || 1);
    await say(resolveText(r.text) || `${Inv.itemName(a)} and ${Inv.itemName(b)} become ${Inv.itemName(r.result)}.`);
    UI.toast(`+ ${Inv.itemName(r.result)}`, 'item');
    Audio.sfx('solve');
    if (r.effects) await run(r.effects);
    return;
  }
  if (DB.items[a]?.combineDefault && await respond(DB.items[a].combineDefault, va)) return;
  if (DB.items[b]?.combineDefault && await respond(DB.items[b].combineDefault, va)) return;
  await fallback(['combine'], va);
}

export async function sayWords(words, target) {
  const norm = normalise(words);
  const room = curRoom();
  const match = (list) => (list || []).find(s => normalise(s.match) === norm) || (list || []).find(s => norm.includes(normalise(s.match)));
  if (target?.type === 'thing') {
    const m = match(target.thing.say);
    if (m && await respond(m.response)) return;
  }
  const m = match(room?.say);
  if (m && await respond(m.response)) return;
  for (const t of things()) { const mm = match(t.say); if (mm && await respond(mm.response)) return; }
  await fallback(['say'], { target: words });
}
export function normalise(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').replace(/\b(the|a|an)\b/g, ' ').replace(/\s+/g, ' ').trim();
}

export async function shout() {
  const room = curRoom();
  if (room?.shout && await respond(room.shout)) return;
  await fallback(['shout']);
}

// ---------------------------------------------------------------- consumables and gear
export async function drink(itemId, mid) {
  const it = DB.items[itemId];
  if (!it || it.kind !== 'consumable') { await say(`${Inv.itemName(itemId)} is not for drinking.`); return; }
  if (it.effect && (it.effect.damage || it.effect.move)) { await say('Save that for an enemy.'); return; }
  if (!mid) {
    const alive = S.party.filter(p => !p.frozen);
    if (alive.length === 1) mid = alive[0].id;
    else {
      const { choose } = await import('./dialogue.js');
      const i = await choose(alive.map(p => `${DB.members[p.id]?.name} (${p.hp}/${gearStats(p).hp} HP)`), { cancel: 'Never mind', mode: 'which' });
      hooks.refresh();
      if (i == null) return;
      mid = alive[i].id;
    }
  }
  const res = Inv.useConsumable(itemId, mid);
  await say(res.text);
  if (res.ok) Audio.sfx('heal');
  hooks.refresh();
}

export function equipItem(mid, itemId, slot) {
  const r = Inv.equip(mid, itemId, { slot });
  if (!r.ok) { UI.toast(r.reason, 'warn'); Audio.sfx('error'); return false; }
  Audio.sfx('equip');
  UI.toast(`${DB.members[mid]?.name} equips ${Inv.itemName(itemId)}`, 'item');
  hooks.refresh();
  return true;
}

// ---------------------------------------------------------------- targeting mode
export function startTargeting(itemId, verb = 'use') {
  R.targeting = { item: itemId, verb };
  UI.setPanel('play');
  UI.setBanner(UI.tapWords(`${verb === 'give' ? 'Giving' : 'Using'}: <b>${UI.esc(Inv.itemName(itemId))}</b> · tap a target`));
  UI.tip('use');
  hooks.refresh();
}
export function cancelTargeting() {
  if (!R.targeting) return false;
  R.targeting = null;
  UI.setBanner(null);
  Audio.sfx('back');
  hooks.refresh();
  return true;
}
export async function targetChosen(target) {
  const tg = R.targeting; if (!tg) return;
  R.targeting = null; UI.setBanner(null); hooks.refresh();
  await counted(async () => {
    if (tg.verb === 'give') await give(tg.item, target);
    else await use(tg.item, target, 'tap');
  });
  hooks.refresh();
}

// ---------------------------------------------------------------- inn
export async function rest() {
  const room = curRoom(); const inn = room?.inn; if (!inn) return;
  if (S.gold < inn.price) { await say(resolveText(inn.broke) || `A bed costs ${inn.price} silver. Kord has ${S.gold}.`); Audio.sfx('error'); return; }
  S.gold -= inn.price;
  for (const p of S.party) if (!p.frozen) fullHeal(p);
  Audio.sfx('heal');
  await say(resolveText(inn.text) || 'The party rests and wakes restored.');
  UI.toast(`−${inn.price} silver · the party is restored`, 'heal');
  hooks.autosave(true);
  hooks.refresh();
}

// ---------------------------------------------------------------- hints
export async function hint(objId) {
  const o = DB.objectives[objId]; if (!o) return;
  const lvl = Math.min(3, (S.journal.hints[objId] || 0) + 1);
  S.journal.hints[objId] = lvl;
  UI.renderPanel();
}
export async function askParty(objId) {
  const o = DB.objectives[objId]; if (!o || !o.party) return;
  const present = S.party.filter(p => !p.frozen && o.party[p.id]).map(p => p.id);
  if (!present.length) return;
  const mid = pickFrom(present, 'ask.' + objId);
  UI.setPanel('play');
  await say({ speaker: mid, text: o.party[mid] });
}

// ---------------------------------------------------------------- shops
// typed "buy <item>" / "sell <item>" (same effects as the shop modal)
export async function tradeTyped(mode, words, shops) {
  const q = String(words).toLowerCase().replace(/^(a|an|the|some)\s+/, '').trim();
  const matches = (id) => { const n = Inv.itemName(id).toLowerCase(); const syn = (DB.itemNames?.[id] || []).map(x => String(x).toLowerCase());
    return n === q || syn.includes(q) || n.split(/\s+/).some(w => w.startsWith(q)) || n.startsWith(q); };
  if (mode === 'buy') {
    for (const sid of shops) for (const entry of DB.shops[sid]?.stock || []) {
      if (entry.cond && !check(entry.cond)) continue;
      if (!matches(entry.item)) continue;
      const price = Inv.buyPrice(entry);
      if (price > S.gold) { await say({ text: `${Inv.itemName(entry.item)} costs ${price} silver. Kord has ${S.gold}.`, cls: 'ln-sys' }); Audio.sfx('error'); return; }
      if (Inv.buy(entry, 1)) { Audio.sfx('coins'); UI.toast(`Bought ${Inv.itemName(entry.item)}`, 'gold'); await say({ text: `Bought ${Inv.itemName(entry.item)} for ${price} silver.`, cls: 'ln-sys' }); const up = Inv.upgradeFor(entry.item); if (up) offerEquip(up, entry.item); hooks.refresh(); return; }
    }
    await say('Nobody here sells that.'); return;
  }
  const ids = Object.keys(S.items).filter(id => S.items[id] > 0 && matches(id));
  for (const sid of shops) for (const id of ids) {
    if (!Inv.canSellTo(DB.shops[sid], id)) continue;
    const g = Inv.sell(DB.shops[sid], id, 1);
    if (g) { Audio.sfx('coins'); UI.toast(`Sold ${Inv.itemName(id)} (+${g})`, 'gold'); await say({ text: `Sold ${Inv.itemName(id)} for ${g} silver.`, cls: 'ln-sys' }); hooks.refresh(); return; }
  }
  await say(ids.length ? 'Nobody here will buy that.' : 'Kord has nothing like that to sell.');
}

export function openShop(shopId) {
  const shop = DB.shops[shopId]; if (!shop) return Promise.resolve();
  UI.tip('shop');
  return new Promise(resolve => {
    let tab = 'buy', sel = null, body = null; const qty = {};
    UI.openModal({ title: shop.name || 'Shop', cls: 'shop', onClose: () => { hooks.refresh(); resolve(); }, body: (b) => { body = b; draw(); } });
    function draw() {
      body.innerHTML = '';
      body.append(el('div', { class: 'shop-head' },
        el('div', { class: 'subtabs' }, el('button', { class: 'st-b' + (tab === 'buy' ? ' on' : ''), onclick: () => { tab = 'buy'; sel = null; draw(); } }, 'Buy'),
          shop.buys ? el('button', { class: 'st-b' + (tab === 'sell' ? ' on' : ''), onclick: () => { tab = 'sell'; sel = null; draw(); } }, 'Sell') : null),
        el('span', { class: 'gold' }, `◈ ${S.gold} silver`)));
      if (shop.greeting) body.append(el('p', { class: 'shop-greet', html: UI.markup(resolveText(shop.greeting)) }));
      const list = el('div', { class: 'ilist' });
      if (tab === 'buy') {
        for (const entry of shop.stock || []) {
          if (entry.cond && !check(entry.cond)) continue;
          const id = entry.item, price = Inv.buyPrice(entry);
          const n = qty[id] || 1;
          const row = el('button', { class: 'irow' + (sel === id ? ' sel' : ''), onclick: () => { sel = sel === id ? null : id; draw(); } },
            UI.iconImg(id), el('span', { class: 'grow' }, Inv.itemName(id)), el('span', { class: 'price' + (price > S.gold ? ' dear' : '') }, `${price}`));
          list.append(row);
          if (sel === id) {
            const card = el('div', { class: 'icard' });
            const d = UI.itemDesc(id); if (d) card.append(el('p', { class: 'desc', html: UI.markup(d) }));
            appendCompare(card, id);
            const stack = DB.items[id]?.kind === 'consumable' || entry.qty === null;
            card.append(el('div', { class: 'acts' },
              stack ? el('span', { class: 'stepper' }, el('button', { class: 'btn small', 'aria-label': 'Fewer', onclick: () => { qty[id] = Math.max(1, n - 1); draw(); } }, '−'), el('b', {}, ' ' + n + ' '), el('button', { class: 'btn small', 'aria-label': 'More', onclick: () => { qty[id] = Math.min(99, n + 1); draw(); } }, '+')) : null,
              el('button', { class: 'btn small primary', disabled: price * n > S.gold, onclick: () => {
                if (Inv.buy(entry, n)) { Audio.sfx('coins'); UI.toast(`Bought ${Inv.itemName(id)}${n > 1 ? ' ×' + n : ''}`, 'gold'); const up = Inv.upgradeFor(id); if (up) offerEquip(up, id); qty[id] = 1; draw(); hooks.refresh(); }
              } }, `Buy for ${price * n}`)));
            list.append(card);
          }
        }
      } else {
        const ids = Object.keys(S.items).filter(id => S.items[id] > 0);
        const sellable = ids.filter(id => Inv.canSellTo(shop, id));
        if (!sellable.length) list.append(el('p', { class: 'muted' }, 'Nothing here this merchant wants.'));
        for (const id of sellable) {
          const price = Inv.sellPrice(id);
          const row = el('button', { class: 'irow' + (sel === id ? ' sel' : ''), onclick: () => { sel = sel === id ? null : id; draw(); } },
            UI.iconImg(id), el('span', { class: 'grow' }, Inv.itemName(id)), S.items[id] > 1 ? el('span', { class: 'cnt' }, '×' + S.items[id]) : null, el('span', { class: 'price' }, `${price}`));
          list.append(row);
          if (sel === id) list.append(el('div', { class: 'icard' }, el('div', { class: 'acts' },
            el('button', { class: 'btn small primary', onclick: () => { const g = Inv.sell(shop, id, 1); if (g) { Audio.sfx('coins'); UI.toast(`Sold for ${g} silver`, 'gold'); hooks.onSell?.(id); } sel = S.items[id] ? id : null; draw(); hooks.refresh(); } }, `Sell for ${price}`))));
        }
        const treasures = sellable.filter(id => DB.items[id]?.kind === 'treasure');
        if (treasures.length) body.append(el('button', { class: 'btn', onclick: () => { const g = Inv.sellAllTreasures(shop); if (g) { Audio.sfx('coins'); UI.toast(`Treasures sold: +${g} silver`, 'gold'); } draw(); hooks.refresh(); } }, 'Sell all treasures'));
      }
      body.append(list);
    }
  });
}
function appendCompare(card, id) {
  const it = DB.items[id];
  if (!it || !['weapon', 'armor', 'charm'].includes(it.kind)) return;
  const cmp = el('div', { class: 'cmp' });
  for (const p of S.party) {
    if (p.frozen) continue;
    const c = Inv.compare(p.id, id);
    if (!c || !c.ok) continue;
    cmp.append(el('div', { class: 'cmp-row' }, el('span', { class: 'who' }, DB.members[p.id]?.name), UI.deltas(c)));
  }
  card.append(cmp.children.length ? cmp : el('p', { class: 'muted' }, 'No one in the party can use it.'));
}
export function offerEquip(mid, id) {
  UI.toast(`${Inv.itemName(id)} is an upgrade for ${DB.members[mid]?.name}`, 'item', { action: { label: 'Equip now', fn: () => equipItem(mid, id) } });
}

// ---------------------------------------------------------------- seek trouble
export function seekTroubleEncounter() {
  const room = curRoom();
  const table = DB.seekTrouble[S.chapter]?.[room?.seekTrouble];
  if (!table) return null;
  R.seekCount = (R.seekCount || 0) + 1;
  const seed = (Date.now() ^ (R.seekCount * 2654435761)) >>> 0;
  const enc = makeSeekTroubleEncounter(table, { level: partyLevel(), partySize: S.party.filter(p => !p.frozen).length, seed });
  if (!enc.bg) enc.bg = room.bg;
  return { ...enc, id: 'seek_' + room.id };
}
