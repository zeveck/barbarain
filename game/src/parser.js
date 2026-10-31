// parser.js: the command line. Tokenizes, strips articles, resolves nouns
// against things, NPCs, held items, companions, party members and exits in
// scope (synonyms, whole-word partial matches, "Which…?" prompts), and
// dispatches to the same action functions the buttons use. Battle verbs go
// to the battle adapter; bare numbers pick numbered choices.

import { DB, S, R } from './state.js';
import { hooks } from './conditions.js';
import * as A from './actions.js';
import * as Inv from './inventory.js';
import * as UI from './ui.js';
import { choose, choosing, pickChoice, continuePending, waitingContinue } from './dialogue.js';

const VERBS = {
  look: ['look', 'l', 'examine', 'x', 'inspect', 'check', 'read', 'search', 'study', 'view', 'watch', 'describe', 'observe'],
  take: ['take', 'get', 'grab', 'pick', 'steal', 'pocket', 'collect', 'lift'],
  use: ['use', 'apply', 'light', 'put', 'pour', 'burn', 'throw', 'unlock', 'open', 'pull', 'push', 'press', 'turn', 'kick-open', 'wave', 'show', 'shake', 'wake', 'nudge', 'touch'],
  give: ['give', 'offer', 'hand', 'feed', 'pay', 'bribe'],
  combine: ['combine', 'mix', 'soak', 'dip', 'merge', 'attach', 'tie'],
  talk: ['talk', 'speak', 'ask', 'chat', 'greet', 'hail', 'question'],
  hit: ['hit', 'punch', 'kick', 'kill', 'strike', 'smash', 'break', 'slap', 'fight', 'stab', 'slash', 'cut', 'bash', 'headbutt', 'ring', 'bang'],
  go: ['go', 'walk', 'run', 'move', 'enter', 'leave', 'exit', 'head', 'travel', 'climb', 'descend'],
  say: ['say', 'tell', 'whisper', 'answer', 'reply'],
  shout: ['shout', 'roar', 'yell', 'scream', 'bellow', 'howl'],
  drink: ['drink', 'eat', 'quaff', 'consume', 'swig', 'gulp'],
  equip: ['equip', 'wear', 'wield', 'don', 'hold'],
  unequip: ['unequip', 'remove', 'doff', 'unwield'],
  inventory: ['i', 'inv', 'inventory', 'bag', 'items'],
  party: ['p', 'party', 'stats', 'status', 'equipment', 'gear'],
  journal: ['j', 'journal', 'goals', 'quests', 'objectives', 'tasks'],
  map: ['m', 'map'],
  help: ['help', '?', 'commands', 'verbs'],
  hint: ['hint', 'hints', 'clue', 'stuck'],
  rest: ['rest', 'sleep', 'inn', 'bed'],
  shop: ['buy', 'shop', 'trade', 'browse', 'purchase', 'sell'],
  wait: ['wait', 'z', 'sit'],
  save: ['save'], load: ['load', 'restore'], menu: ['menu', 'pause', 'settings', 'options'],
  seek: ['seek'],
  bestgear: ['best'],
  mute: ['mute', 'unmute'],
};
const VERB_OF = {};
for (const [v, list] of Object.entries(VERBS)) for (const w of list) VERB_OF[w] = VERB_OF[w] || v;
const BATTLE_VERBS = ['attack', 'skill', 'item', 'defend', 'flee', 'auto', 'repeat', 'run'];
const DIRS = { n: 'n', north: 'n', s: 's', south: 's', e: 'e', east: 'e', w: 'w', west: 'w', u: 'u', up: 'u', d: 'd', down: 'd', in: 'in', inside: 'in', out: 'out', outside: 'out', back: 'back' };
const ARTICLES = new Set(['the', 'a', 'an', 'some', 'my', 'his', 'her', 'its', 'that', 'this', 'those', 'these', 'to', 'at']);

function norm(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9' -]+/g, ' ').replace(/\s+/g, ' ').trim(); }
function stripArticles(s) { return norm(s).split(' ').filter(w => w && !ARTICLES.has(w)).join(' '); }

// ---------------------------------------------------------------- scope
function candidates() {
  const out = [];
  for (const t of A.things()) out.push({ type: 'thing', id: t.id, thing: t, label: t.name, where: 'here', names: [t.name, t.id.replace(/_/g, ' '), ...(t.names || [])] });
  const held = new Set([...Object.keys(S.items).filter(k => S.items[k] > 0)]);
  for (const p of S.party) for (const v of Object.values(p.equip)) if (v) held.add(v);
  for (const id of held) {
    const it = DB.items[id];
    out.push({ type: 'item', id, label: it?.name || Inv.prettify(id), where: Inv.equippedBy(id) ? 'worn' : 'bag', names: [it?.name || '', id.replace(/_/g, ' '), ...(it?.names || []), ...(DB.itemNames[id] || [])] });
  }
  for (const p of S.party) {
    if (p.frozen) continue;
    const m = DB.members[p.id];
    out.push({ type: 'member', id: p.id, label: m?.name || p.id, where: 'party', names: [m?.name || p.id, p.id, ...(m?.names || [])] });
  }
  for (const ex of A.exits()) {
    const to = DB.rooms[ex.to];
    out.push({ type: 'exit', id: ex.dir, exit: ex, label: ex.label, where: 'exit', names: [ex.label, to?.name || '', ex.to.replace(/_/g, ' '), ...(ex.names || [])] });
  }
  return out;
}

function scoreName(phrase, name) {
  const n = stripArticles(name);
  if (!n) return 0;
  if (n === phrase) return 3;
  const pw = phrase.split(' '), nw = n.split(' ');
  if (pw.every(w => nw.includes(w))) return 2;
  if (pw.length === 1 && pw[0].length >= 3 && nw.some(w => w.startsWith(pw[0]) || w.endsWith(pw[0]))) return 1;
  return 0;
}

// -> {list: [cand]} best matches (possibly several)
export function resolve(phrase, prefer = null) {
  const p = stripArticles(phrase);
  if (!p) return [];
  let cands = candidates().map(c => ({ c, s: Math.max(...c.names.map(n => scoreName(p, n))) })).filter(x => x.s > 0);
  if (!cands.length) return [];
  const top = Math.max(...cands.map(x => x.s));
  cands = cands.filter(x => x.s === top).map(x => x.c);
  // a companion in the party is both a member and (for Ain/Toktai) an item-like target: keep one
  const seen = new Set();
  cands = cands.filter(c => { const k = c.type + ':' + c.id; if (seen.has(k)) return false; seen.add(k); return true; });
  if (prefer && cands.length > 1) {
    const pref = cands.filter(c => prefer.includes(c.type));
    if (pref.length) cands = pref;
  }
  // an exact name of something in the room beats the same word on a carried item ("ring" in the Window of Years)
  if (top === 3 && cands.length > 1 && cands.some(c => c.type === 'thing') && cands.some(c => c.type === 'item')) cands = cands.filter(c => c.type !== 'item');
  // the same NPC id reached as a thing and as a member: prefer the thing
  return cands;
}

async function pickOne(phrase, prefer, verbWord) {
  const list = resolve(phrase, prefer);
  if (!list.length) {
    await A.say(`Kord sees no "${phrase}" here.`);
    return null;
  }
  if (list.length === 1) return list[0];
  const labels = list.map(c => `the ${c.label.replace(/^the /i, '')}${c.where === 'here' ? '' : ' (' + c.where + ')'}`);
  await A.say(`Which: ${labels.join(' or ')}?`);
  const i = await choose(labels, { cancel: 'Never mind', mode: 'which' });
  hooks.refresh();
  if (i == null) return null;
  return list[i];
}

function asTarget(c) {
  if (!c) return null;
  if (c.type === 'thing') return { type: 'thing', id: c.id, thing: c.thing, name: c.label };
  if (c.type === 'item') return { type: 'item', id: c.id, name: c.label };
  if (c.type === 'member') {
    // companions can be used like items (use ain on scale) and talked to
    return { type: 'member', id: c.id, name: c.label };
  }
  if (c.type === 'exit') return { type: 'exit', id: c.id, exit: c.exit, name: c.label };
  return null;
}

function splitOn(rest, preps) {
  const words = rest.split(' ');
  for (let i = 1; i < words.length; i++) if (preps.includes(words[i])) return [words.slice(0, i).join(' '), words.slice(i + 1).join(' ')];
  return [rest, null];
}

// ---------------------------------------------------------------- typed replies
// Typed text against numbered replies. Movement and farewell words pick the
// Leave / Nothing reply; otherwise whole words at the start of a reply (3+
// letters, exactly one match; outside dialogue a whole word anywhere). A reply
// that costs silver is only picked by its full text (or its number).
const LEAVE_WORDS = new Set(['leave', 'bye', 'goodbye', 'farewell', 'out', 'nothing', 'exit', 'nevermind', 'cancel']);
const LEAVE_REPLY = /^(leave|nothing|goodbye|good bye|farewell|never mind|thats all|that is all|enough|walk away|cancel|bye|not now|not tonight|later|no thanks)\b/;
const COST = /\s*\d+\s+silver\s*$/;   // labels are normalised: "(5 silver)" → "5 silver"
function matchChoice(input, buttons, strict) {
  const strip = (t) => stripArticles(t.replace(COST, '')).replace(/'s\b/g, '').replace(/'/g, '');   // "slaver's" ~ "slaver"
  const labels = buttons.map(b => norm(b.label));
  const words = input.split(' ');
  const exact = labels.findIndex(l => l === input || strip(l) === strip(input));
  if (exact >= 0) return exact;
  if (LEAVE_WORDS.has(words[0]) || DIRS[input] || input === 'never mind') {
    let k = buttons.findIndex(b => b.leave || b.cls === 'cancel');
    if (k < 0) k = labels.findIndex(l => LEAVE_REPLY.test(strip(l)));
    if (k >= 0) return k;
  }
  if (input.replace(/[^a-z]/g, '').length < 3) return -1;
  const want = strip(input).split(' ').filter(Boolean);
  if (!want.length) return -1;
  const hits = [];
  labels.forEach((l, j) => {
    if (buttons[j].cost) return;   // never spend silver on partial text
    const lw = strip(l).split(' ');
    const ok = strict ? want.every((w, k) => lw[k] === w)
      : lw.some((_, k) => want.every((w, m) => lw[k + m] === w));
    if (ok) hits.push(j);
  });
  return hits.length === 1 ? hits[0] : -1;
}

// ---------------------------------------------------------------- entry point
export async function execute(raw) {
  const input = norm(raw);
  if (!input) return;
  UI.log({ text: '› ' + raw.trim(), cls: 'ln-cmd', instant: true });
  R.idleSeconds = 0;

  // numbers pick numbered choices
  if (/^\d+$/.test(input)) {
    const n = parseInt(input, 10) - 1;
    if (choosing() && pickChoice(n)) return;
    if (R.inBattle && hooks.battleCommand) { await hooks.battleCommand(input); return; }
    await A.say(choosing() ? 'There is no choice with that number.' : 'There is nothing to choose right now.');
    return;
  }
  if (waitingContinue() && ['continue', 'next', 'ok', 'c'].includes(input)) { continuePending(); return; }
  if (choosing()) {
    const i = matchChoice(input, UI.trayButtons(), R.mode === 'dialogue');
    if (i >= 0 && pickChoice(i)) return;
    await A.say(UI.tapWords('Pick one of the numbered replies (type its number, or tap it).'));
    return;
  }

  const words = input.split(' ');
  let w0 = words[0];
  let rest = words.slice(1).join(' ');

  // battle verbs go to the battle adapter while fighting
  if (R.inBattle) {
    if (hooks.battleCommand) { await hooks.battleCommand(input); return; }
    await A.say({ text: '(The fight is about to begin. Wait for your turn.)', cls: 'ln-sys' }); return;
  }
  if (R.mode === 'scene') { if (!continuePending()) await A.say(UI.tapWords('The tale is still being told. Tap Continue.')); return; }
  if (R.mode === 'dialogue') { await A.say('Pick one of the replies.'); return; }

  // directions
  if (DIRS[w0] && !rest) return go(w0);
  if (w0 === 'go' || w0 === 'walk' || w0 === 'run' || w0 === 'head' || w0 === 'travel' || w0 === 'climb' || w0 === 'enter' || w0 === 'leave' || w0 === 'exit' || w0 === 'descend') {
    const t = stripArticles(rest.replace(/^(to|towards|into|through)\s+/, ''));
    if (!t) { if (w0 === 'leave' || w0 === 'exit') return go('out'); if (w0 === 'climb') return go('u'); if (w0 === 'descend') return go('d'); await A.say('Go where?'); return; }
    return go(t);
  }
  if (w0 === 'pick' && words[1] === 'up') rest = words.slice(2).join(' ');
  if (w0 === 'look' && (words[1] === 'at' || words[1] === 'in' || words[1] === 'into' || words[1] === 'under')) rest = words.slice(2).join(' ');
  if (w0 === 'talk' || w0 === 'speak') rest = rest.replace(/^(to|with)\s+/, '');
  if (w0 === 'seek' && /trouble/.test(rest)) { await hooks.seekTrouble?.(); return; }
  if (w0 === 'best' && /gear/.test(rest)) { hooks.bestGearParty?.(); return; }
  if (w0 === 'auto' && !R.inBattle) { R.autoBattle = /on/.test(rest); await A.say(`Auto battle ${R.autoBattle ? 'on' : 'off'}.`); return; }
  if (BATTLE_VERBS.includes(w0) && w0 !== 'attack' && w0 !== 'run' && !R.inBattle && !VERB_OF[w0]) { await A.say('There is nothing to fight here. Yet.'); return; }

  let verb = VERB_OF[w0];
  if (w0 === 'attack') verb = 'hit';
  if (!verb) {
    // a bare noun: an exit goes there, anything else is looked at
    const list = resolve(input);
    if (list.length === 1) {
      const c = list[0];
      if (c.type === 'exit') return go(c.exit.dir);
      return A.counted(() => A.look(asTarget(c)));
    }
    if (list.length > 1) { const c = await pickOne(input); if (c) return c.type === 'exit' ? go(c.exit.dir) : A.counted(() => A.look(asTarget(c))); return; }
    return unknown(raw);
  }
  return dispatch(verb, rest, w0);
}

async function go(word) {
  if (word === 'back' && R.lastRoom) {
    const ex = A.exits().find(e => e.to === R.lastRoom);
    if (ex) return hooks.go(ex);
  }
  const d = DIRS[word] || word;
  let ex = A.findExit(d);
  if (!ex) {
    const list = resolve(word, ['exit']).filter(c => c.type === 'exit');
    if (list.length === 1) ex = list[0].exit;
    else if (list.length > 1) { const c = await pickOne(word, ['exit']); if (!c) return; ex = c.exit; }
  }
  if (!ex) {
    const any = (A.curRoom()?.exits || []).find(e => e.dir === d || (e.names || []).includes(word));
    if (any) return hooks.go(any);
    await A.say(pickNowhere());
    return;
  }
  return hooks.go(ex);
}
function pickNowhere() {
  const p = DB.defaults.goNowhere;
  return p && p.length ? p[Math.floor(Math.random() * p.length)] : 'There is no way out in that direction.';
}

async function dispatch(verb, rest, w0) {
  switch (verb) {
    case 'inventory': return hooks.openPanel?.('items');
    case 'party': return hooks.openPanel?.('party');
    case 'journal': return hooks.openPanel?.('journal');
    case 'map': return hooks.openPanel?.('map');
    case 'menu': return hooks.openMenu?.();
    case 'save': return hooks.openMenu?.('save');
    case 'load': return hooks.openMenu?.('load');
    case 'mute': return hooks.toggleMute?.();
    case 'help': return help();
    case 'hint': {
      const o = Object.values(DB.objectives).find(o => S.journal.obj[o.id] === 'active');
      if (!o) { await A.say('Nothing is pressing. Look around; trouble will find Kord soon enough.'); return; }
      await A.hint(o.id);
      const lvl = S.journal.hints[o.id];
      await A.say(`Hint (${o.text}): ${o.hints[lvl - 1]}`);
      return;
    }
    case 'rest': if (A.curRoom()?.inn) return A.rest(); await A.say('There is no bed here worth the name.'); return;
    case 'shop': {
      const shops = hooks.shopsHere?.() || [];
      if (!shops.length) { await A.say('No one here is selling.'); return; }
      if (rest && ['buy', 'purchase', 'sell'].includes(w0)) return A.tradeTyped(w0 === 'sell' ? 'sell' : 'buy', rest, shops);
      return A.openShop(shops[0]);
    }
    case 'wait': await A.say('Time passes, as it does in Shadizar: slowly, and with someone watching.'); return;
    case 'shout': return A.counted(() => A.shout());
    case 'say': {
      const [words, to] = splitOn(rest, ['to']);
      let target = null;
      if (to) { const c = await pickOne(to, ['thing', 'member']); if (!c) return; target = asTarget(c); }
      if (!words) { await A.say('Say what?'); return; }
      return A.counted(() => A.sayWords(words, target));
    }
    case 'look': {
      if (!rest || rest === 'around' || rest === 'room' || rest === 'here') return A.look({ type: 'room' });
      const c = await pickOne(rest, ['thing', 'item', 'member', 'exit']); if (!c) return;
      return A.counted(() => A.look(asTarget(c)));
    }
    case 'take': {
      if (!rest) { await A.say('Take what?'); return; }
      if (/^(all|everything)$/.test(rest)) { await A.say('Kord is a thief, not a locust. One thing at a time.'); return; }
      const c = await pickOne(rest, ['thing', 'member', 'item']); if (!c) return;
      return A.counted(() => A.take(asTarget(c)));
    }
    case 'talk': {
      if (!rest) { await A.say('Talk to whom?'); return; }
      const [who] = splitOn(rest, ['about']);
      const c = await pickOne(who, ['thing', 'member']); if (!c) return;
      return A.counted(() => A.talk(asTarget(c)));
    }
    case 'hit': {
      if (!rest) { await A.say('Hit what? Kord has many candidates.'); return; }
      const [what] = splitOn(rest, ['with']);
      const c = await pickOne(what, ['thing', 'member']); if (!c) return;
      return A.counted(() => A.hit(asTarget(c)));
    }
    case 'drink': {
      const [what, on] = splitOn(rest, ['on', 'to', 'for']);
      const c = await pickOne(what, ['item']); if (!c) return;
      if (c.type !== 'item') { await A.say(`Kord is not going to ${w0} that.`); return; }
      let mid = null;
      if (on) { const m = await pickOne(on, ['member']); if (!m) return; mid = m.id; }
      return A.drink(c.id, mid);
    }
    case 'equip': {
      const [what, on] = splitOn(rest, ['on', 'to', 'for']);
      const c = await pickOne(what, ['item']); if (!c || c.type !== 'item') { if (c) await A.say('That is not something to wear.'); return; }
      let mid = 'kord';
      if (on) { const m = await pickOne(on, ['member']); if (!m) return; mid = m.id; }
      else { const e = Inv.eligibleMembers(c.id); if (e.length && !e.includes('kord')) mid = e[0]; }
      A.equipItem(mid, c.id);
      return;
    }
    case 'unequip': {
      const c = await pickOne(rest, ['item']); if (!c || c.type !== 'item') return;
      const w = Inv.equippedBy(c.id); if (!w) { await A.say('Nobody is wearing that.'); return; }
      Inv.unequip(w.member, w.slot); hooks.refresh(); await A.say(`${DB.members[w.member]?.name} takes off the ${Inv.itemName(c.id)}.`); return;
    }
    case 'combine': {
      const [a, b] = splitOn(rest, ['with', 'and', 'in', 'into', 'to', 'onto', 'on']);
      if (!a || !b) { await A.say('Combine what with what?'); return; }
      const ca = await pickOne(a, ['item']); if (!ca) return;
      const cb = await pickOne(b, ['item']); if (!cb) return;
      if (ca.type !== 'item' || cb.type !== 'item') return A.counted(() => A.use(ca.id, asTarget(cb)));
      return A.counted(() => A.combine(ca.id, cb.id));
    }
    case 'give': {
      const [x, y] = splitOn(rest, ['to']);
      if (!x) { await A.say('Give what?'); return; }
      if (!y) {
        // "give bolo wine": try "<npc> <item>"
        const ws = x.split(' ');
        for (let i = 1; i < ws.length; i++) {
          const who = resolve(ws.slice(0, i).join(' '), ['thing', 'member']), what = resolve(ws.slice(i).join(' '), ['item']);
          if (who.length === 1 && what.length >= 1 && who[0].type !== 'item') { const it = what.length === 1 ? what[0] : await pickOne(ws.slice(i).join(' '), ['item']); if (!it) return; return A.counted(() => A.give(it.id, asTarget(who[0]))); }
        }
        const ci = await pickOne(x, ['item']); if (!ci) return;
        if (ci.type !== 'item') { await A.say('Give what?'); return; }
        A.startTargeting(ci.id, 'give'); return;
      }
      const ci = await pickOne(x, ['item']); if (!ci) return;
      if (ci.type !== 'item' && !(ci.type === 'member' && Inv.isCompanion(ci.id))) { await A.say(`Kord does not have ${ci.label}.`); return; }
      const ct = await pickOne(y, ['thing', 'member']); if (!ct) return;
      return A.counted(() => A.give(ci.id, asTarget(ct)));
    }
    case 'use': {
      if (!rest) { await A.say(`${w0[0].toUpperCase() + w0.slice(1)} what?`); return; }
      const [x, y] = splitOn(rest, ['on', 'with', 'in', 'into', 'at', 'to', 'onto', 'from', 'over']);
      // "unlock stocks with key" / "light rag with brazier": the tool comes second
      const toolSecond = (w0 === 'unlock' || w0 === 'light' || w0 === 'open' || w0 === 'burn') && y && rest.includes(' with ');
      const first = toolSecond ? y : x, second = toolSecond ? x : y;
      const ci = await pickOne(first, ['item', 'member', 'thing']); if (!ci) return;
      if (!second) {
        if (ci.type === 'item') return A.counted(() => A.use(ci.id, null));
        if (ci.type === 'member' && Inv.isCompanion(ci.id)) { A.startTargeting(ci.id, 'use'); return; }
        if (ci.type === 'exit') return go(ci.exit.dir);
        return A.counted(() => A.useBare(asTarget(ci)));
      }
      const ct = await pickOne(second, ['thing', 'member', 'item', 'exit']); if (!ct) return;
      if (ci.type === 'thing' && ct.type === 'item') return A.counted(() => A.use(ct.id, asTarget(ci)));   // "use stocks with key"
      if (ci.type !== 'item' && !(ci.type === 'member' && Inv.isCompanion(ci.id))) { await A.say(`Kord has no ${ci.label} to use.`); return; }
      return A.counted(() => A.use(ci.id, asTarget(ct)));
    }
  }
  return unknown(rest);
}

async function help() {
  await A.say('Commands: *look* (at something), *take*, *use X on Y*, *give X to Y*, *combine X with Y*, *talk to*, *hit*, *say …*, *shout*, *go* or a direction (n, s, e, w, up, down, in, out), *drink*, *equip*, *rest*, *buy*, *hint*. Panels: *i* items, *p* party, *j* journal, *m* map. A number picks a numbered choice.');
}

async function unknown(raw) {
  const here = A.things().map(t => t.name).slice(0, 6);
  const ex = A.exits().map(e => e.label).slice(0, 5);
  await A.say(`Kord frowns at "${raw.trim()}". Try *look*, *take*, *use*, *talk*, *go*.${here.length ? ' Here: ' + here.join(', ') + '.' : ''}${ex.length ? ' Ways out: ' + ex.join(', ') + '.' : ''}`);
}
