// main.js: boot, screen router, room travel, refresh, the battle adapter,
// autosave, keyboard, idle triggers, menus, visibility pause, debug hook.

import { DB, S, R, SETTINGS, loadData, loadSettings, saveSettings, freshGame, isRest, serialize, writeSlot,
  loadFromSlot, slotMeta, SLOTS, resetState, partyLevel, levelFromXp, fullHeal, gearStats } from './state.js';
import { hooks, check, run, text as resolveText } from './conditions.js';
import * as Inv from './inventory.js';
import * as UI from './ui.js';
import * as Scene from './scene.js';
import * as Audio from './audio.js';
import * as A from './actions.js';
import * as P from './parser.js';
import * as D from './dialogue.js';

const $ = s => document.querySelector(s);
const el = UI.el;

// The battle UI module plugs in here (see design/ENGINE_NOTES.md, "Battle
// adapter"). Set to true once game/src/battle-ui.js exists.
const BATTLE_UI_READY = true;
let BattleUI = null;

const DIR_LABEL = { n: 'N', s: 'S', e: 'E', w: 'W', u: 'Up', d: 'Down', in: 'In', out: 'Out' };

// ---------------------------------------------------------------- boot
async function boot() {
  loadSettings();
  applySettings();
  await Promise.all([loadData(), Scene.initAssets(), Audio.init()]);
  if (BATTLE_UI_READY) { try { BattleUI = await import('./battle-ui.js'); } catch (e) { console.warn('battle-ui failed to load', e); } }
  Scene.init($('#scene'), onSceneTap);
  UI.initLog();
  bindHooks(); bindACT(); bindChrome(); bindKeys();
  const relayout = () => UI.layout();
  addEventListener('resize', relayout);
  addEventListener('orientationchange', () => setTimeout(relayout, 120));
  if (window.visualViewport) { visualViewport.addEventListener('resize', relayout); visualViewport.addEventListener('scroll', relayout); }
  document.addEventListener('visibilitychange', () => { Audio.suspend(document.hidden); });
  setInterval(idleTick, 1000);
  installDebugHook();
  registerSW();
  showTitle();
  UI.layout();
}

function registerSW() {
  const local = ['localhost', '127.0.0.1'].includes(location.hostname);
  if ('serviceWorker' in navigator && (!local || new URLSearchParams(location.search).has('sw'))) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

function applySettings() {
  document.body.classList.remove('font-s', 'font-m', 'font-l');
  document.body.classList.add('font-' + (SETTINGS.fontSize || 'm'));
  Scene.setShowHotspots?.(SETTINGS.showHotspots);
  Audio.applyVolumes();
}

// first input anywhere unlocks audio
let unlocked = false;
function unlockOnce() {
  if (unlocked) return; unlocked = true;
  Audio.unlock();
}
['pointerdown', 'keydown', 'touchstart'].forEach(ev => addEventListener(ev, unlockOnce, { capture: true, passive: true }));
// touchstart/pointerdown don't count as a gesture on every phone browser:
// retry on the ones that do, and after any interruption
['pointerup', 'touchend', 'click', 'keydown'].forEach(ev => addEventListener(ev, () => { if (unlocked) Audio.nudge(); }, { capture: true, passive: true }));

// ---------------------------------------------------------------- title
let titleRAF = 0;
function showTitle() {
  abortBattle();
  resetFlow();
  Audio.playAmbience(null);
  R.screen = 'title';
  UI.closeAllModals();
  UI.showScreen('title');
  const cv = $('#title-art'); let f = 0;
  cancelAnimationFrame(titleRAF);
  const loop = () => { if (R.screen !== 'title') return; Scene.drawTitle(cv, f++); titleRAF = requestAnimationFrame(loop); };
  loop();
  const autoMeta = slotMeta('auto');
  const hasAuto = !!autoMeta && !autoMeta.corrupt;
  $('#t-continue').hidden = !hasAuto;
  $('#t-menu').hidden = !unlocked;
  $('#t-tap').hidden = unlocked;
  if (unlocked) Audio.playMusic('title');
}

function titleBegin() {
  unlockOnce();
  $('#t-tap').hidden = true; $('#t-menu').hidden = false;
  Audio.playMusic('title');
  Audio.sfx('tap');
  ($('#t-continue').hidden ? $('#t-new') : $('#t-continue')).focus({ preventScroll: true });
}

async function newGame() {
  if (slotMeta('auto') && !(await UI.confirm('New game', 'Start a new chronicle? Your autosave will be replaced as soon as it begins; saved slots are kept.', 'Begin', 'Back'))) return;
  resetFlow();
  freshGame(1);
  await chapterCard(1, true);
  startPlaying();
}

// drop any conversation, cutscene or targeting still waiting from the old game
// (load, quit to title, new game): bump the epoch first so they end silently
function resetFlow() {
  R.epoch++;
  D.cancelChoice(); D.continuePending(); R.checkpointPending = null;
  UI.clearLog(true);
  closePopover();
  R.mode = 'explore'; R.targeting = null; R.acting = false;
}

// leave a battle that is still running (chapter jump, load, quit)
function abortBattle() {
  if (!R.inBattle) return;
  BattleUI?.abort?.();
  hooks.battleCommand = null;
  Scene.setBattle(null);
  Scene.mosaic(false, 1);
  R.inBattle = false; R.battle = null; R.transition = false; R.mode = 'explore';
}

function startPlaying(opts = {}) {
  abortBattle();
  R.screen = 'game'; R.mode = 'explore'; R.inBattle = false; R.targeting = null; R.battle = null; R.battleResult = null;
  R.actionCount = {}; R.fired = {}; R.idleSeconds = 0; R.chipRoom = null;
  UI.showScreen('game');
  UI.clearLog();
  UI.setBanner(null);
  UI.setPanel(UI.getLayout() === 'desktop' ? 'party' : 'play');
  UI.layout();
  enterRoom(S.room, { initial: true, message: opts.message });
}

// Chapter card (and for chapter I, the opening chronicle paragraph).
function chapterCard(n, opening) {
  return new Promise(resolve => {
    const ch = DB.chapters[n] || { name: '' };
    R.screen = 'card';
    UI.showScreen('card');
    const cv = $('#card-art');
    Scene.drawTitle(cv, 0);
    let f = 0;
    const artId = ch.card || 'keyart/title-tower';
    const draw = () => {
      if (R.screen !== 'card') return;
      const img = Scene.image(artId);
      if (img) { const c = cv.getContext('2d'); c.imageSmoothingEnabled = false; c.drawImage(img, 0, 0, 320, 180); }
      else Scene.drawTitle(cv, f++);
      requestAnimationFrame(draw);
    };
    draw();
    $('#card-num').textContent = 'Chapter ' + UI.roman(n);
    $('#card-name').textContent = ch.name || '';
    const op = $('#card-text');
    op.textContent = opening ? resolveText(ch.opening || '') : '';
    op.hidden = !op.textContent;
    Audio.sfx('chapter');
    const scr = $('#scr-card');
    const done = () => { scr.removeEventListener('click', done); removeEventListener('keydown', key); resolve(); };
    const key = (e) => { if (['Enter', ' ', 'Escape'].includes(e.key)) { e.preventDefault(); done(); } };
    setTimeout(() => { scr.addEventListener('click', done); addEventListener('keydown', key); }, 400);
  });
}

// ---------------------------------------------------------------- rooms
async function enterRoom(id, opts = {}) {
  const room = DB.rooms[id];
  if (!room) { console.warn('no room', id); return; }
  const epoch = R.epoch;
  const prev = S.room;
  R.transition = true;
  if (!opts.initial && prev && prev !== id) {
    revertTransients('leaveRoom');
    R.lastRoom = prev;
    Audio.sfx('door');
    await Scene.fadeTo(1, 220);
  } else if (opts.initial) { Scene.fadeTo(1, 1); }
  if (R.epoch !== epoch) return;
  const first = !S.visited[id];
  S.room = id; S.visited[id] = true;
  if (room.chapter && room.chapter !== S.chapter && DB.chapters[room.chapter]) S.chapter = room.chapter;
  R.idleSeconds = 0;
  Audio.playMusic(roomAudio(room.music)); Audio.playAmbience(roomAudio(room.ambience));
  refresh();
  UI.logHeading(room.name);
  await Scene.fadeTo(0, 280);
  R.transition = false;
  R.acting = true;   // until onEnter and the room's encounters have run (input meanwhile only skips text)
  if (opts.message) await A.say({ text: opts.message, cls: 'ln-sys' });
  const desc = first || opts.initial ? resolveText(room.desc) : (resolveText(room.short) || resolveText(room.desc));
  await A.say(desc);
  if (R.epoch !== epoch) return;
  if (first && Object.keys(S.visited).length === 1) UI.tip('tap');
  if (Object.keys(S.visited).length === 2) UI.tip('exit');
  // a fight on entry that is fled sends the party back the way it came (or,
  // with no way back, leaves the encounter as a tray button); the room's own
  // exits are gated on winning it, so neither path skips the fight
  let fled = false;
  try {
    R.battleResult = null;
    if (room.onEnter) {
      const ok = await run(room.onEnter);
      if (R.epoch !== epoch) return;
      if (!ok) { if (R.battleResult !== 'fled') return; fled = true; }
    }
    for (const enc of fled ? [] : room.encounters || []) {
      if (R.epoch !== epoch) return;
      if (enc.auto && check(enc.cond) && !S.won[enc.id]) {
        const res = await startBattle(enc.id);
        if (res === 'fled') { fled = true; break; }
        if (res !== 'won') return;
      }
    }
  } finally { if (R.epoch === epoch) R.acting = false; }
  if (R.epoch !== epoch) return;
  if (fled && await fallBack(room, prev)) return;
  refresh();
  autosave();
}

// room.music / room.ambience: an id, or variants [{cond, id}] (first match wins)
function roomAudio(v) {
  if (!Array.isArray(v)) return v;
  const hit = v.find(x => check(x.cond));
  return hit ? hit.id ?? null : null;
}

// After fleeing a fight on entry: retreat through the exit that leads back to
// the previous room, if there is one and it is open.
async function fallBack(room, prev) {
  const back = prev && prev !== room.id && A.exits(room).find(e => e.to === prev && A.exitOpen(room, e));
  if (!back || !DB.rooms[prev]) return false;
  R.autosavePending = false;   // the save is made in the room they fall back to
  R.acting = true;
  const epoch = R.epoch;
  try { await A.say({ text: 'Kord gives ground, step by step, and backs out the way he came. Whatever was in there is still in there.', cls: 'ln-sys' }); }
  finally { if (R.epoch === epoch) R.acting = false; }
  if (R.epoch !== epoch) return true;
  await enterRoom(prev);
  return true;
}

async function go(ex) {
  const room = A.curRoom();
  if (!room) return;
  if (R.targeting) A.cancelTargeting();
  if (!A.exitOpen(room, ex)) {
    await A.say(resolveText(ex.blocked) || 'That way is shut.');
    if (!(ex.seemsOpen && check(ex.seemsOpen))) Audio.sfx('error');
    if (ex.blockedEffects) await run(ex.blockedEffects);
    return;
  }
  await enterRoom(ex.to);
}

function revertTransients(on) {
  for (const id of Object.keys(S.items)) {
    const tr = DB.items[id]?.transient;
    if (tr && (tr.on === on || on === 'save' || (on === 'leaveRoom' && !tr.on))) {
      Inv.transform(id, tr.revertsTo);
      delete S.newItems[tr.revertsTo];
      if (tr.text) A.say({ text: resolveText(tr.text), cls: 'ln-sys' });
    }
  }
}

// ---------------------------------------------------------------- refresh
function sceneModel() {
  const room = A.curRoom(); if (!room) return null;
  return {
    bg: room.bg, name: room.name, machine: room.machine,
    // sprite.hideWhen: draw nothing but keep the tap box (e.g. the stocks while Toktai's stocks sprite shows them)
    things: A.things(room).filter(t => t.sprite || t.hotspot).map(t => t.sprite?.hideWhen && check(t.sprite.hideWhen)
      ? { ...t, sprite: null, hotspot: { x: t.sprite.x, y: t.sprite.y, w: t.sprite.w || 24, h: t.sprite.h || 24 } } : t),
    glints: (room.glints || []).filter(g => check(g.cond)),
    fx: (room.fx || []).filter(f => typeof f === 'string' || check(f.cond)),
  };
}

function refresh() {
  if (R.screen !== 'game') return;
  UI.renderTop();
  const m = sceneModel(); if (m) Scene.setModel(m);
  Scene.setTargets(R.targeting ? A.things().map(t => t.id) : []);
  if (R.mode === 'explore' && !R.inBattle && !D.choosing() && !D.waitingContinue()) renderExploreTray();
  if (UI.getLayout() === 'desktop' || UI.panelName !== 'play') UI.renderPanel();
  if (R.autosavePending && isRest() && !R.acting) { R.autosavePending = false; autosave(); }
  if (R.checkpointPending && isRest() && !R.acting) { const id = R.checkpointPending; R.checkpointPending = null; revertTransients('save'); writeSlot('cp_' + id, serialize()); }
}

function shopsHere() {
  const ids = new Set(A.things().filter(t => t.kind === 'npc').map(t => t.npc || t.id));
  const out = [];
  for (const [sid, sh] of Object.entries(DB.shops)) if (check(sh.cond) && ((sh.npc && ids.has(sh.npc) && (!sh.room || sh.room === S.room)) || (!sh.npc && sh.room === S.room))) out.push(sid);
  return out;
}
function shopHere() { return shopsHere()[0] || null; }

function renderExploreTray() {
  const room = A.curRoom(); if (!room) return;
  const tg = R.targeting;
  // people first, then things that appeared since the party came in (the Lady
  // after the brawl), then the rest in room order: on a phone the row scrolls
  // sideways and only the first few chips show
  const list = A.things().filter(t => t.chip !== false);
  if (R.chipRoom !== room.id) { R.chipRoom = room.id; R.chipSeen = new Set(list.map(t => t.id)); }
  const rank = (t) => (t.kind === 'npc' ? 0 : 2) - (R.chipSeen.has(t.id) ? 0 : 1);
  const chips = list.map((t, i) => ({ t, i })).sort((a, b) => rank(a.t) - rank(b.t) || a.i - b.i)
    .map(({ t }) => ({ id: t.id, label: t.name, kind: t.kind === 'npc' ? 'npc' : 'thing', pulse: !!tg, fresh: !R.chipSeen.has(t.id) }));
  if (tg) for (const p of S.party) if (!p.frozen && p.id !== tg.item) chips.push({ id: '@' + p.id, label: DB.members[p.id]?.name || p.id, kind: 'member', pulse: true });
  const buttons = [];
  for (const ex of A.exits(room)) {
    const open = A.exitOpen(room, ex);
    buttons.push({ label: `${DIR_LABEL[ex.dir] || ex.dir} · ${ex.label}`, cls: 'exit' + (open || (ex.seemsOpen && check(ex.seemsOpen)) ? '' : ' shut'), onClick: () => act(() => go(ex)) });
  }
  if (room.inn) buttons.push({ label: `Rest (${room.inn.price} silver)`, cls: 'act', onClick: () => act(() => A.rest()) });
  for (const sh of shopsHere()) buttons.push({ label: `Trade · ${DB.shops[sh].short || DB.npcs[DB.shops[sh].npc]?.name || DB.shops[sh].name || 'Shop'}`, cls: 'act', onClick: () => act(() => A.openShop(sh)) });
  // auto encounters are only still here after a flee with no way back: offer them again
  for (const enc of room.encounters || []) if ((!enc.auto || !R.acting) && check(enc.cond) && !S.won[enc.id]) buttons.push({ label: enc.label || '⚔ Fight', cls: 'act fight', onClick: () => act(() => startBattle(enc.id)) });
  if (room.seekTrouble && DB.seekTrouble[S.chapter]?.[room.seekTrouble]) buttons.push({ label: '⚔ Seek trouble', cls: 'act', onClick: () => act(() => seekTrouble()) });
  UI.setTray({ chips, buttons, bag: true, chipsLabel: chips.length ? '' : '' });
}

// Serialises world actions: while one runs, a tap only skips its text.
async function act(fn) {
  if (R.screen !== 'game') return;
  if (R.acting) { UI.skip(); return; }
  if (R.mode !== 'explore' || R.inBattle) return;
  R.acting = true;
  const epoch = R.epoch;
  try { await fn(); }
  catch (e) { console.error(e); }
  finally { if (R.epoch === epoch) { R.acting = false; refresh(); } }
}

async function seekTrouble() {
  const enc = A.seekTroubleEncounter();
  if (!enc) return;
  await A.say('Kord goes looking for trouble. It is never far.');
  await startBattle(enc);
}

// ---------------------------------------------------------------- autosave
function autosave(force) {
  if (R.screen !== 'game') return false;
  if (!isRest() || (R.acting && !force)) { R.autosavePending = true; return false; }
  revertTransients('save');
  const ok = writeSlot('auto', serialize());
  if (!ok && !R.autosaveWarned) { R.autosaveWarned = true; UI.toast('Autosave failed (storage full or blocked). Save to a slot from the menu.', 'warn'); }
  return ok;
}

function saveTo(slot) {
  if (!isRest()) { UI.toast('You can save when nothing is happening.', 'warn'); Audio.sfx('error'); return false; }
  revertTransients('save');
  const ok = writeSlot(slot, serialize());
  if (ok) { Audio.sfx('save'); UI.toast(`Saved to slot ${slot}`, 'save'); }
  else UI.toast('Saving failed (storage full or blocked).', 'warn');
  return ok;
}

function loadSlot(slot) {
  const res = loadFromSlot(slot);
  if (!res.ok) { UI.toast(res.message, 'warn'); return; }
  resetFlow();
  UI.closeAllModals();
  Audio.sfx('save');
  startPlaying({ message: res.message });
}

// ---------------------------------------------------------------- battle adapter
// startBattle(encounterId | encounterObject) -> Promise<'won'|'lost'|'fled'>
async function startBattle(ref) {
  const id = typeof ref === 'string' ? ref : ref?.id || 'battle';
  const enc = (typeof ref === 'string' ? DB.encounters[ref] : ref) || { id, enemies: [], xp: 0, gold: 0, missing: true };
  revertTransients('battleStart');
  R.attempts = R.attempts || {};
  const snapshot = serialize();
  R.preBattleSnapshot = snapshot;
  const prevMode = R.mode;
  const epoch = R.epoch;
  const useUI = !!(BattleUI && BattleUI.runBattle && !enc.missing);
  for (;;) {
    R.attempts[id] = (R.attempts[id] || 0) + 1;
    R.inBattle = true; R.battleResult = null; R.mode = 'battle';
    R.battle = { id, round: 1, phase: 1, awaiting: null, telegraph: false, eyeOpen: false, enemies: battleEnemies(enc), party: [], lastCommand: null };
    UI.setPanel('play');
    Audio.sfx('swoosh');
    R.transition = true;
    await Scene.mosaic(true);
    const api = battleApi(enc, id);
    let prepared = false;
    if (useUI && BattleUI.prepare) { try { await BattleUI.prepare(id, enc, api); prepared = true; } catch (e) { console.error('battle prepare failed', e); } }
    if (!prepared) Scene.setBattle({ enemies: R.battle.enemies.map(e => ({ name: e.name, sprite: e.sprite, machine: (DB.enemies[e.id]?.tags || []).includes('machine') })),
      party: S.party.filter(p => !p.frozen && (!enc.party || enc.party.includes(p.id))).map(p => ({ name: DB.members[p.id]?.name, sprite: DB.members[p.id]?.sprite })) });
    Audio.playMusic(enc.music || 'battle');
    UI.layout();
    await Scene.mosaic(false);
    R.transition = false;
    UI.layout();
    UI.tip('battle');
    let result;
    if (prepared) {
      try { result = await BattleUI.runBattle(id, enc, api); }
      catch (e) { console.error('battle failed', e); result = { result: 'won' }; }
    } else result = await stubBattle(id, enc);
    if (R.epoch !== epoch) return 'lost';
    result = typeof result === 'string' ? { result } : (result || { result: 'won' });
    if (!result.settled) settleSimple(id, enc, result);
    Audio.sfx('swoosh');
    R.transition = true;
    await Scene.mosaic(true);
    Scene.setBattle(null);
    R.inBattle = false; R.battle = null; R.mode = prevMode === 'battle' ? 'explore' : prevMode;
    R.battleResult = result.result;
    hooks.battleCommand = null;
    const room = A.curRoom();
    if (result.result !== 'lost' || Array.isArray(enc.onLose)) Audio.playMusic(roomAudio(room?.music));
    refresh();
    await Scene.mosaic(false);
    R.transition = false;
    UI.layout();
    for (const it of result.loot || []) { const up = Inv.upgradeFor(it.item); if (up) A.offerEquip(up, it.item); }
    if (result.result === 'won') {
      if (Array.isArray(enc.onWin) && enc.onWin.length) await run(enc.onWin);
      R.autosavePending = true;
      refresh();
      return 'won';
    }
    if (result.result === 'fled') { refresh(); return 'fled'; }
    // lost
    if (Array.isArray(enc.onLose)) { await run(enc.onLose); R.autosavePending = true; refresh(); return 'lost'; }
    const choice = await gameOver(enc);
    if (choice === 'retry' || choice === 'saga') {
      if (choice === 'saga') { SETTINGS.difficulty = 'saga'; saveSettings(); UI.toast('Saga difficulty: enemies are weaker, gold richer.', 'info'); }
      resetState(JSON.parse(JSON.stringify(snapshot)));
      // a second try starts rested, so a fight entered half-dead isn't a trap
      for (const pm of S.party) if (!pm.frozen) fullHeal(pm);
      UI.toast('The party catches its breath.', 'info');
      Audio.playAmbience(roomAudio(DB.rooms[S.room]?.ambience));
      UI.showScreen('game'); R.screen = 'game';
      refresh();
      continue;
    }
    return 'lost';
  }
}

function battleEnemies(enc) {
  const counts = {};
  for (const e of enc.enemies || []) counts[e.enemy] = (counts[e.enemy] || 0) + 1;
  const seen = {};
  return (enc.enemies || []).map(e => {
    const def = DB.enemies[e.enemy] || {};
    const spriteId = def.sprite || 'enemy/' + e.enemy.replace(/_/g, '-');
    const base = spriteId.split('/').pop();
    let name = base;
    if (counts[e.enemy] > 1) { seen[e.enemy] = (seen[e.enemy] || 0) + 1; name = base + '-' + 'abcdefgh'[seen[e.enemy] - 1]; }
    return { name, id: e.enemy, title: def.name || Inv.prettify(e.enemy), sprite: spriteId, hp: null, maxHp: null, statuses: [] };
  });
}

// What the battle UI gets from the engine. battle.js seeds itself from
// (encounter id, attempt); `settle(b)` applies a finished battle to the save.
function battleApi(enc, id) {
  return {
    S, R, DB, Scene, Audio, UI,
    log: (entry) => UI.log(typeof entry === 'string' ? { text: entry } : entry),
    setTray: UI.setTray, layout: UI.layout, toast: UI.toast,
    attempt: R.attempts[id],
    difficulty: SETTINGS.difficulty, auto: !!R.autoBattle,
    stats: (mid) => { const p = S.party.find(p => p.id === mid); return p ? gearStats(p) : null; },
    level: partyLevel(),
    flags: Object.keys(S.flags || {}).filter(f => S.flags[f]),
    setState: (b) => { R.battle = b; },
    bestiary: (enemyId, info) => { S.bestiary[enemyId] = { ...(S.bestiary[enemyId] || {}), ...info }; },
    settle: (b, Battle) => settleBattle(id, enc, b, Battle),
    setAutoFlag: (on) => { R.autoBattle = !!on; },
  };
}

// Applies a finished battle (BATTLE_API §1, "After the battle"): HP/MP and
// carried statuses, the bag (items used, steals always, drops on a win), XP
// and gold once per encounter (the engine already applies Saga gold and
// paysOnLose), level-ups (full heal), bestiary. Returns a summary for the
// victory / level-up panels.
function settleBattle(id, enc, b, Battle) {
  const result = b.result;
  const rw = b.rewards || { xp: 0, gold: 0, items: [], itemsUsed: {} };
  for (const q of Battle.partyAfter(b)) {
    const p = S.party.find(p => p.id === q.id); if (!p) continue;
    p.hp = Math.max(0, q.hp); p.mp = Math.max(0, q.mp); p.statuses = q.statuses || [];
  }
  if (result === 'won') for (const p of S.party) if (!p.frozen && p.hp <= 0) p.hp = 1;
  for (const [it, n] of Object.entries(rw.itemsUsed || {})) Inv.remove(it, n, true);
  const loot = [];
  for (const it of rw.items || []) { Inv.add(it, 1); const l = loot.find(x => x.item === it); if (l) l.n++; else loot.push({ item: it, n: 1 }); }
  const seek = typeof id === 'string' && id.startsWith('seek_');
  const pays = result === 'won' || (result === 'lost' && enc.paysOnLose);
  const first = pays && (seek || !S.won[id]);
  if (pays && !seek) S.won[id] = true;
  const xp = first ? rw.xp || 0 : 0;
  // gold: the encounter's purse once; gold picked up mid-fight (rewards.gold beyond the purse) always
  const purse = Math.round((enc.gold || 0) * (b.difficulty === 'saga' ? 1.25 : 1));
  const gold = first ? rw.gold || 0 : Math.max(0, (rw.gold || 0) - (pays ? purse : 0));
  const before = partyLevel();
  const statsBefore = Object.fromEntries(S.party.map(p => [p.id, gearStats(p)]));
  const flags = Object.keys(S.flags || {}).filter(f => S.flags[f]);
  S.xp += xp; S.gold += gold;
  const after = partyLevel();
  const members = [];
  if (after > before) {
    for (const p of S.party) {
      if (!p.frozen) fullHeal(p);
      const st = gearStats(p), sb = statsBefore[p.id];
      const known = (L) => (DB.members[p.id]?.skills || []).filter(sk => { const d = DB.skills?.[sk] || Battle.SKILLS?.[sk]; return d && d.learn && ((d.learn.level && d.learn.level <= L) || (d.learn.flag && flags.includes(d.learn.flag))) ; });
      const kb = known(before), ka = known(after);
      members.push({ id: p.id, name: DB.members[p.id]?.name || p.id, frozen: !!p.frozen,
        before: { hp: sb.hp, mp: sb.mp, atk: sb.atk + sb.power, def: sb.def, agi: sb.agi, wil: sb.wil },
        after: { hp: st.hp, mp: st.mp, atk: st.atk + st.power, def: st.def, agi: st.agi, wil: st.wil },
        skills: ka.filter(x => !kb.includes(x)).map(x => (DB.skills?.[x] || Battle.SKILLS?.[x])?.name || x) });
    }
  }
  // a guest who joined mid-fight (the Steward's phase 3 Roar fetches Bakari) stays with the party
  const g = (b.party || []).find(u => u.guest);
  if (g && !b.encounter?.guest && S.guest?.id !== g.id) S.guest = { id: g.id, level: g.level };
  for (const [eid, info] of Object.entries(b.scanned || {})) S.bestiary[eid] = { ...(S.bestiary[eid] || {}), ...info };
  for (const e of b.enemies || []) if (!S.bestiary[e.id]) S.bestiary[e.id] = {};
  R.autosavePending = true;
  return { result, xp, gold, loot, levelBefore: before, levelAfter: after, members, first };
}

// Stub results (no battle-ui): HP write-back, XP/gold and chance-1 drops.
function settleSimple(id, enc, result) {
  for (const q of result.party || []) {
    const p = S.party.find(p => p.id === q.id); if (!p) continue;
    if (q.hp != null) p.hp = Math.max(0, q.hp);
    if (q.mp != null) p.mp = Math.max(0, q.mp);
  }
  if (result.result === 'won') for (const p of S.party) if (p.hp <= 0) p.hp = 1;
  for (const p of S.party) p.statuses = [];
  const pays = result.result === 'won' || (result.result === 'lost' && enc.paysOnLose);
  if (pays && !S.won[id]) {
    S.won[id] = true;
    const before = partyLevel();
    let gold = enc.gold || 0;
    if (SETTINGS.difficulty === 'saga') gold = Math.round(gold * 1.25);
    S.xp += enc.xp || 0; S.gold += gold;
    if (partyLevel() > before) { for (const p of S.party) fullHeal(p); Audio.sfx('levelup'); UI.toast(`Level up! The party is now level ${partyLevel()}.`, 'level', { ms: 3200 }); }
  }
  if (result.result === 'won') for (const l of result.loot || []) Inv.add(l.item, l.n || 1);
  for (const e of enc.enemies || []) if (!S.bestiary[e.enemy]) S.bestiary[e.enemy] = {};
}

// The stand-in until battle-ui.js lands: Win / Lose apply the encounter's effects.
function stubBattle(id, enc) {
  return new Promise(resolve => {
    const groups = {};
    for (const e of R.battle.enemies) groups[e.title] = (groups[e.title] || 0) + 1;
    const names = Object.entries(groups).map(([n, c]) => c > 1 ? `${n} ×${c}` : n).join(', ') || id;
    UI.log({ text: `Battle: ${names} (battle system coming)`, cls: 'ln-sys ln-battle' });
    R.battle.awaiting = S.party.find(p => !p.frozen)?.id || 'kord';
    // guaranteed drops (chance 1) so story items still arrive through the stub
    const loot = [];
    for (const e of enc.enemies || []) for (const d of DB.enemies[e.enemy]?.drops || []) if (d.chance >= 1) loot.push({ item: d.item, n: 1 });
    const finish = (r) => { hooks.battleCommand = null; resolve({ result: r, loot: r === 'won' ? loot : [] }); };
    hooks.battleCommand = async (input) => {
      if (/^(1|win)$/.test(input)) return finish('won');
      if (/^(2|lose)$/.test(input)) return finish('lost');
      if (/^auto/.test(input)) { R.autoBattle = /on/.test(input); return finish('won'); }
      UI.log({ text: '(The battle system is coming. Choose Win or Lose.)', cls: 'ln-sys' });
    };
    UI.setTray({ numbered: true, chips: [], buttons: [
      { label: 'Win', cls: 'win', onClick: () => finish('won') },
      { label: 'Lose', cls: 'lose', onClick: () => finish('lost') }] });
  });
}

// A short hint for the fight just lost: the encounter's own `loseHint`, else
// a line from what its enemies fear.
const WEAK_HINT = {
  crush: 'Edges skate off it. Blunt iron, a mace or a club, does what a sword cannot.',
  slash: 'A good edge bites deepest here.',
  pierce: 'Points and arrows find the gaps.',
  fire: 'It fears fire: a torch, an oily rag, a scroll that burns.',
  shock: 'Lightning finds it out.',
};
function loseHint(enc) {
  if (enc?.loseHint) return enc.loseHint;
  for (const e of enc?.enemies || []) for (const w of DB.enemies[e.enemy]?.weak || []) if (WEAK_HINT[w]) return WEAK_HINT[w];
  return 'Rest and heal before the fight, Defend when an enemy winds up, and spend the potions: the dead carry nothing.';
}

function gameOver(enc) {
  return new Promise(resolve => {
    Audio.sfx('gameover');
    const hint = $('#go-hint');
    hint.textContent = loseHint(enc);
    hint.hidden = false;
    Audio.playMusic(null); Audio.playAmbience(null);
    UI.showScreen('gameover');
    R.screen = 'gameover';
    $('#go-saga').hidden = SETTINGS.difficulty === 'saga';
    $('#go-load').disabled = !SLOTS.some(s => { const m = slotMeta(s); return m && !m.corrupt; });
    const done = (c) => {
      if (c === 'load') { openLoadMenu(); return; }   // loading starts afresh; this battle is abandoned
      $('#go-retry').onclick = $('#go-load').onclick = $('#go-saga').onclick = null;
      R.screen = 'game'; UI.showScreen('game');
      resolve(c);
    };
    $('#go-retry').onclick = () => done('retry');
    $('#go-load').onclick = () => done('load');
    $('#go-saga').onclick = () => done('saga');
    setTimeout(() => $('#go-retry').focus({ preventScroll: true }), 50);
  });
}

// ---------------------------------------------------------------- chapter end
async function chapterEnd(n) {
  if (!S.chapterComplete.includes(n)) S.chapterComplete.push(n);
  const next = DB.chapters[n + 1];
  if (next) {
    await chapterCard(n + 1, false);
    S.chapter = n + 1;
    for (const p of S.party) if (!p.frozen) fullHeal(p);
    R.screen = 'game'; UI.showScreen('game');
    await enterRoom(next.start);
  } else if (n >= 5) {
    // the end of the game: which ending (old saves without one had the Long Watch)
    S.ending = ENDINGS.find(e => S.flags['ch5.end_' + e.id])?.id || 'watch';
    SETTINGS.endings[S.ending] = true; saveSettings();
    S.gameWon = true;
    R.autosavePending = true;
    autosave(true);
    showEnd();
  } else {
    await A.say({ text: `✦ End of Chapter ${UI.roman(n)}. The chronicle continues in a later telling.`, cls: 'ln-sys' });
    R.autosavePending = true;
  }
}

const DEFAULT_CREDITS = [
  { role: 'Original idea and request', who: 'the player' },
  { role: 'Story, code and design', who: 'Claude, via gamegen' },
  { role: 'Art', who: 'imagegen2, nanogen, anim8gen' },
  { role: 'Music and sound', who: 'audiogen (ElevenLabs)' },
  { role: 'Fonts (SIL OFL)', who: 'Alegreya, Pixelify Sans, Metamorphous, Cinzel Decorative' },
  { role: 'Inspired by', who: 'the Hyborian Age of Robert E. Howard' },
];
function creditsList() { const c = DB.chapters[5]?.credits; return Array.isArray(c) && c.length ? c : DEFAULT_CREDITS; }

// The three endings (design/ENDINGS.md), in the order the final choice lists them.
const ENDINGS = [
  { id: 'watch', name: 'The Long Watch', hint: 'Ain offered to go home. Kord could have let it.' },
  { id: 'hound', name: 'The Hound of Hours', hint: 'A mercy shown in the belly of the Wyrm is repaid at the very end.' },
  { id: 'answer', name: 'The Barbarian\'s Answer', hint: 'Kord\'s sword had one more stroke in it.' },
];

function showEnd() {
  R.screen = 'end';
  UI.showScreen('end');
  const cur = ENDINGS.find(e => e.id === S.ending) || ENDINGS[0];
  const found = ENDINGS.filter(e => SETTINGS.endings[e.id]);
  $('#end-ending').textContent = `Ending: ${cur.name}`;
  $('#end-found').textContent = `Endings found: ${found.length} of ${ENDINGS.length}`;
  const hints = $('#end-hints'); hints.innerHTML = '';
  for (const e of ENDINGS) if (!SETTINGS.endings[e.id]) hints.append(el('li', {}, e.hint));
  hints.hidden = !hints.children.length;
  const cp = (id) => { const m = slotMeta('cp_' + id); return m && !m.corrupt; };
  $('#end-core').hidden = !cp('core');
  $('#end-wyrm').hidden = !cp('wyrm') || !!SETTINGS.endings.hound;
  $('#end-core').onclick = () => loadSlot('cp_core');
  $('#end-wyrm').onclick = () => loadSlot('cp_wyrm');
  const dl = $('#end-credits'); dl.innerHTML = '';
  for (const c of creditsList()) dl.append(el('dt', {}, c.role), el('dd', {}, c.who));
  Audio.playMusic('ending');
  $('#end-title').onclick = () => showTitle();
  $('#end-credits-btn').onclick = () => openCredits();
  setTimeout(() => $('#end-title').focus({ preventScroll: true }), 50);
}

// ---------------------------------------------------------------- hooks
function bindHooks() {
  hooks.toast = (t, k) => UI.toast(t, k);
  hooks.log = (e) => A.say(e);
  hooks.sfx = (id) => Audio.sfx(id);
  hooks.music = (id) => Audio.playMusic(id);
  hooks.ambience = (id) => Audio.playAmbience(id);
  hooks.checkpoint = (id) => { R.checkpointPending = id; };
  hooks.fx = (kind, e) => {
    if (kind === 'shake') { const p = $('#picture'); p.classList.remove('shake'); void p.offsetWidth; p.classList.add('shake'); }
    else if (kind === 'flash') { const p = $('#picture'); p.classList.remove('flash'); void p.offsetWidth; p.classList.add('flash'); }
    else if (kind === 'glow' && e.target) Scene.glow(e.target);
    else if (kind === 'glint') Scene.glow(e.target || '');
  };
  hooks.battle = (id) => startBattle(id);
  hooks.scene = (id) => D.runScene(id);
  hooks.dialogue = (id) => D.runDialogue(id);
  hooks.goto = (id) => enterRoom(id);
  hooks.go = (ex) => go(ex);
  hooks.autosave = (force) => autosave(force);
  hooks.chapterEnd = (n) => chapterEnd(n);
  hooks.shop = (id) => A.openShop(id);
  hooks.tip = (id) => UI.tip(id);
  hooks.refresh = () => refresh();
  hooks.say = (words) => A.sayWords(words);
  hooks.openPanel = (n) => UI.setPanel(n);
  hooks.openMenu = (sub) => sub === 'save' ? openSaveMenu() : sub === 'load' ? openLoadMenu() : openPauseMenu();
  hooks.toggleMute = () => toggleMute();
  hooks.shopHere = () => shopHere();
  hooks.shopsHere = () => shopsHere();
  hooks.seekTrouble = () => seekTrouble();
  hooks.bestGearParty = () => ACT_bestParty();
  hooks.objectiveChanged = () => { if (UI.panelName === 'journal' || UI.getLayout() === 'desktop') UI.renderPanel(); };
}

function ACT_bestParty() {
  const ch = Inv.bestGearParty();
  if (ch.length) { Audio.sfx('equip'); UI.toast(`Best gear: ${ch.map(c => `${DB.members[c.mid]?.name} ← ${Inv.itemName(c.id)}`).join(', ')}`, 'item', { ms: 3200 }); }
  else UI.toast('Everyone already wears the best they have.', 'info');
  refresh();
}

function bindACT() {
  UI.ACT.nameOf = (id) => A.nameOf(id);
  UI.ACT.speakerInfo = (id) => A.speakerInfo(id);
  UI.ACT.keyword = (id, anchor) => targetOrMenu(id, anchor);
  UI.ACT.chip = (id, anchor) => targetOrMenu(id, anchor);
  UI.ACT.storyTap = () => { D.continuePending(); };
  UI.ACT.openPanel = (n) => UI.setPanel(n);
  UI.ACT.quickBag = () => quickBag();
  UI.ACT.startUse = (id) => { if (R.mode !== 'explore' || R.inBattle) return; UI.closeAllModals(); A.startTargeting(id, 'use'); };
  UI.ACT.startCombine = (id) => startCombine(id);
  UI.ACT.drink = (id) => { UI.closeAllModals(); if (UI.getLayout() !== 'desktop') UI.setPanel('play'); act(() => A.drink(id)); };
  UI.ACT.lookItem = (id) => { UI.closeAllModals(); if (UI.getLayout() !== 'desktop') UI.setPanel('play'); act(() => A.counted(() => A.lookItem(id))); };
  UI.ACT.equip = (mid, id, slot) => { A.equipItem(mid, id, slot); };
  UI.ACT.unequip = (mid, slot) => { Inv.unequip(mid, slot); Audio.sfx('equip'); refresh(); };
  UI.ACT.bestGear = (mid) => {
    const ch = Inv.bestGear(mid);
    if (ch.length) { Audio.sfx('equip'); UI.toast(`${DB.members[mid]?.name}: ${ch.map(i => Inv.itemName(i)).join(', ')}`, 'item'); }
    else UI.toast(`${DB.members[mid]?.name} already wears the best there is.`, 'info');
    refresh();
  };
  UI.ACT.bestGearParty = () => ACT_bestParty();
  UI.ACT.hint = (id) => A.hint(id);
  UI.ACT.askParty = (id) => act(() => A.askParty(id));
  UI.ACT.canTravel = () => isRest();
  UI.ACT.travel = (id) => {
    if (!isRest() || R.acting) { UI.toast('Not now.', 'warn'); return; }
    if (UI.getLayout() !== 'desktop') UI.setPanel('play');
    act(() => enterRoom(id));
  };
}

// keyword / chip / picture tap → targeting or the action menu
function targetOrMenu(id, anchor) {
  if (R.screen !== 'game' || R.inBattle) return;
  if (id && id.startsWith('@')) { if (R.targeting) act(() => A.targetChosen({ type: 'member', id: id.slice(1) })); return; }
  const t = A.thing(id);
  if (R.targeting) {
    if (t) { act(() => A.targetChosen({ type: 'thing', id, thing: t })); return; }
    if (S.party.some(p => p.id === id)) { act(() => A.targetChosen({ type: 'member', id })); return; }
  }
  if (R.mode !== 'explore' || R.acting) { if (R.acting) UI.skip(); return; }
  if (t) { actionMenu(t, anchor); return; }
  const ex = A.exits().find(e => e.dir === id || e.to === id);
  if (ex) { act(() => go(ex)); return; }
  if (Inv.count(id, true) > 0 && DB.items[id]) { itemMenu(id, anchor); return; }
  if (S.party.some(p => p.id === id)) { act(() => A.counted(() => A.banter(id))); return; }
  act(() => A.say('That is no longer here.'));
}

function onSceneTap(id) {
  if (R.screen !== 'game' || R.inBattle) return;
  if (R.targeting) {
    if (!id) { A.cancelTargeting(); return; }
    const t = A.thing(id); if (t) act(() => A.targetChosen({ type: 'thing', id, thing: t }));
    return;
  }
  if (!id) return;
  const t = A.thing(id); if (!t) return;
  if (R.mode !== 'explore') return;
  const pt = Scene.clientPointOf(id);
  actionMenu(t, null, pt);
}

// small popover with the verbs that make sense for a thing
function actionMenu(t, anchor, point) {
  const verbs = [['Look', () => A.look({ type: 'thing', id: t.id, thing: t })]];
  // Talk for people, and for things that hold a conversation (the brass mouth's password)
  if (t.kind === 'npc' || (typeof t.talk === 'string' && DB.dialogues[t.talk])) verbs.push(['Talk', () => A.talk({ type: 'thing', id: t.id, thing: t })]);
  if (t.kind !== 'npc' || t.take) verbs.push(['Take', () => A.take({ type: 'thing', id: t.id, thing: t })]);
  verbs.push([t.kind === 'npc' ? 'Give / Use…' : 'Use…', null]);
  verbs.push(['Hit', () => A.hit({ type: 'thing', id: t.id, thing: t })]);
  popover(t.name, verbs.map(([label, fn]) => ({ label, fn: fn ? () => act(() => A.counted(fn)) : () => usePicker(t) })), anchor, point);
}

function itemMenu(id, anchor) {
  popover(Inv.itemName(id), [
    { label: 'Look', fn: () => act(() => A.counted(() => A.lookItem(id))) },
    { label: 'Use…', fn: () => A.startTargeting(id, 'use') },
    { label: 'Combine…', fn: () => startCombine(id) },
  ], anchor);
}

let popEl = null;
function closePopover() { if (popEl) { popEl.remove(); popEl = null; } }
function popover(title, items, anchor, point) {
  closePopover();
  Audio.sfx('tap');
  const box = el('div', { class: 'popover', role: 'menu' }, el('div', { class: 'pop-t' }, title),
    ...items.map(it => el('button', { class: 'pop-b', role: 'menuitem', onclick: (e) => { e.stopPropagation(); closePopover(); it.fn(); } }, it.label)));
  document.body.append(box);
  popEl = box;
  const r = anchor ? anchor.getBoundingClientRect() : point ? { left: point.x - 1, right: point.x + 1, top: point.y - 1, bottom: point.y + 1 } : { left: innerWidth / 2, right: innerWidth / 2, top: innerHeight / 2, bottom: innerHeight / 2 };
  const bw = box.offsetWidth, bh = box.offsetHeight;
  const vw = visualViewport ? visualViewport.width : innerWidth, vh = visualViewport ? visualViewport.height : innerHeight;
  let x = (r.left + r.right) / 2 - bw / 2, y = r.bottom + 6;
  if (y + bh > vh - 8) y = r.top - bh - 6;
  x = Math.max(8, Math.min(vw - bw - 8, x)); y = Math.max(8, Math.min(vh - bh - 8, y));
  box.style.left = x + 'px'; box.style.top = y + 'px';
  setTimeout(() => box.querySelector('.pop-b')?.focus({ preventScroll: true }), 0);
}
addEventListener('pointerdown', e => { if (popEl && !popEl.contains(e.target)) closePopover(); }, true);

function usePicker(t) {
  const list = Inv.list('all', 'type').filter(e => !(e.companion && e.id === 'kord'));
  UI.openModal({ title: `Use on ${t.name}`, sheet: true, body: (b, close) => {
    if (t.use?.self) b.append(el('button', { class: 'row', onclick: () => { close(true); act(() => A.counted(() => A.useBare({ type: 'thing', id: t.id, thing: t }))); } }, el('span', { class: 'grow' }, `Use the ${t.name} itself`)));
    if (!list.length) b.append(el('p', { class: 'muted' }, 'The bag is empty.'));
    for (const e of list) b.append(el('button', { class: 'row', onclick: () => {
      close(true);
      act(() => A.counted(() => t.kind === 'npc' ? A.use(e.id, { type: 'thing', id: t.id, thing: t }, 'tap') : A.use(e.id, { type: 'thing', id: t.id, thing: t })));
    } }, UI.iconImg(e.id), el('span', { class: 'grow' }, Inv.itemName(e.id)), e.n > 1 ? el('span', { class: 'cnt' }, '×' + e.n) : null));
  } });
}

function quickBag() {
  const list = Inv.list('all', 'newest').filter(e => !e.equippedBy || e.it?.kind !== 'consumable');
  UI.openModal({ title: 'Bag', sheet: true, body: (b, close) => {
    if (!list.length) b.append(el('p', { class: 'muted' }, 'The bag is empty. Kord travels light, mostly by necessity.'));
    for (const e of list) {
      b.append(el('div', { class: 'row qb' }, UI.iconImg(e.id), el('span', { class: 'grow' }, Inv.itemName(e.id), e.isNew ? el('span', { class: 'new' }, 'NEW') : null),
        e.n > 1 ? el('span', { class: 'cnt' }, '×' + e.n) : null,
        el('button', { class: 'btn small', onclick: () => { close(true); act(() => A.counted(() => A.lookItem(e.id))); } }, 'Look'),
        el('button', { class: 'btn small primary', onclick: () => { close(true); A.startTargeting(e.id, 'use'); } }, 'Use')));
    }
    b.append(el('button', { class: 'btn', onclick: () => { close(true); UI.setPanel('items'); } }, 'Open Items'));
  } });
}

function startCombine(id) {
  const others = Inv.list('all', 'type').filter(e => e.id !== id && !e.companion);
  UI.closeAllModals();
  UI.tip('combine');
  UI.openModal({ title: `Combine ${Inv.itemName(id)} with…`, sheet: true, body: (b, close) => {
    if (!others.length) b.append(el('p', { class: 'muted' }, 'Nothing else in the bag.'));
    for (const e of others) b.append(el('button', { class: 'row', onclick: () => { close(true); if (UI.getLayout() !== 'desktop') UI.setPanel('play'); act(() => A.counted(() => A.combine(id, e.id))); } },
      UI.iconImg(e.id), el('span', { class: 'grow' }, Inv.itemName(e.id))));
  } });
}

// ---------------------------------------------------------------- chrome (buttons, tabs, cmd)
function bindChrome() {
  $('#t-tap').textContent = UI.tapWords('Tap to begin');
  document.querySelector('.card-tap').textContent = UI.tapWords('tap to continue');
  $('#t-tap').addEventListener('click', titleBegin);
  $('#scr-title').addEventListener('click', e => { if (!$('#t-tap').hidden && !e.target.closest('button')) titleBegin(); });
  $('#t-continue').addEventListener('click', () => loadSlot('auto'));
  $('#t-new').addEventListener('click', () => newGame());
  $('#t-load').addEventListener('click', () => openLoadMenu());
  $('#t-settings').addEventListener('click', () => openSettings());
  $('#t-credits').addEventListener('click', () => openCredits());
  $('#btn-menu').addEventListener('click', () => openPauseMenu());
  $('#btn-mute').addEventListener('click', () => toggleMute());
  $('#btn-kbd').addEventListener('click', () => toggleKbd());
  $('#banner-x').addEventListener('click', () => A.cancelTargeting());
  document.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => {
    Audio.sfx('tap');
    const t = b.dataset.tab;
    if (R.targeting && t !== 'play') A.cancelTargeting();
    if (R.inBattle && t !== 'play') { UI.toast('Not in the middle of a fight!', 'warn'); return; }
    UI.setPanel(UI.panelName === t && UI.getLayout() !== 'desktop' ? 'play' : t);
    UI.layout();
  }));
  $('#cmdform').addEventListener('submit', e => {
    e.preventDefault();
    const inp = $('#cmd'); const v = inp.value; inp.value = '';
    if (!v.trim()) {
      // an empty Enter in the box does what Enter does outside it (but "2⏎" picks reply 2 once)
      if (R.screen !== 'game') return;
      if (digitPickAt && performance.now() - digitPickAt < 1500) { digitPickAt = 0; return; }
      if (UI.isTyping()) UI.skip();
      else if (R.inBattle) BattleUI?.onKey?.({ key: 'Enter' });
      else if (!D.continuePending() && D.choosing()) UI.pressChoice(UI.choiceHighlight);
      return;
    }
    if (UI.isTyping()) UI.skip();
    if (R.screen !== 'game') return;
    if (UI.getLayout() !== 'desktop' && UI.panelName !== 'play') UI.setPanel('play');
    if (D.choosing() || D.waitingContinue() || R.inBattle) { P.execute(v); return; }
    if (R.acting) { P.execute(v); return; }
    R.acting = true; const epoch = R.epoch;
    Promise.resolve(P.execute(v)).catch(err => console.error(err)).finally(() => { if (R.epoch === epoch) { R.acting = false; refresh(); } });
  });
  $('#cmd').addEventListener('focus', () => { UI.layout(); setTimeout(UI.layout, 300); });
  $('#cmd').addEventListener('blur', () => { setTimeout(UI.layout, 50); });
}

function toggleMute() {
  const m = Audio.toggleMute();
  UI.renderTop();
  UI.toast(m ? 'Sound off' : 'Sound on', 'info');
}

function toggleKbd() {
  const on = !document.body.classList.contains('kb-open');
  document.body.classList.toggle('kb-open', on);
  if (on) $('#cmd').focus(); else $('#cmd').blur();
  UI.layout();
}

// ---------------------------------------------------------------- keyboard
let digitPickAt = 0;   // a digit in the empty command box just picked a reply
function bindKeys() {
  addEventListener('keydown', e => {
    if (e.ctrlKey && (e.key === 'm' || e.key === 'M')) { e.preventDefault(); toggleMute(); return; }
    const inCmd = document.activeElement === $('#cmd');
    if (R.screen === 'title') {
      if (!$('#t-tap').hidden && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); titleBegin(); }
      if (e.key === 'Escape') UI.closeTopModal();
      return;
    }
    if (UI.modalOpen()) {
      if (e.key === 'Escape') { e.preventDefault(); UI.closeTopModal(); }
      return;
    }
    if (popEl) { if (e.key === 'Escape') { e.preventDefault(); closePopover(); } return; }
    if (R.screen !== 'game') return;
    if (inCmd) {
      if (e.key === 'Escape') { $('#cmd').blur(); document.body.classList.remove('kb-open'); UI.layout(); }
      // with the box empty, digits pick numbered replies (as outside the box)
      if (/^[1-9]$/.test(e.key) && !$('#cmd').value && !e.altKey && !e.metaKey) {
        if (R.inBattle && BattleUI?.onKey && BattleUI.onKey(e)) { e.preventDefault(); return; }
        if (D.choosing() || R.inBattle) { e.preventDefault(); if (UI.isTyping()) UI.skip(); UI.pressChoice(+e.key - 1); digitPickAt = performance.now(); return; }
      }
      if (e.key !== 'Enter') digitPickAt = 0;
      return;   // Enter submits the form (DATA_SPEC §15)
    }
    if (e.target && e.target.tagName === 'INPUT') return;
    if (R.inBattle && BattleUI?.onKey && BattleUI.onKey(e)) { e.preventDefault(); return; }
    const k = e.key;
    if (k === ' ') { e.preventDefault(); if (UI.isTyping()) UI.skip(); else D.continuePending(); return; }
    if (k === 'Enter') {
      e.preventDefault();
      if (UI.isTyping()) { UI.skip(); return; }
      if (D.continuePending()) return;
      if (D.choosing()) { UI.pressChoice(UI.choiceHighlight); return; }
      $('#cmd').focus(); return;
    }
    if (/^[1-9]$/.test(k)) {
      const n = parseInt(k, 10) - 1;
      if (D.choosing() || R.inBattle) { e.preventDefault(); if (UI.isTyping()) UI.skip(); UI.pressChoice(n); }
      return;
    }
    if (k === 'Escape') {
      e.preventDefault();
      if (R.targeting) { A.cancelTargeting(); return; }
      if (UI.getLayout() !== 'desktop' && UI.panelName !== 'play') { UI.setPanel('play'); UI.layout(); return; }
      openPauseMenu(); return;
    }
    if (k === '/') { e.preventDefault(); $('#cmd').focus(); return; }
    if (D.choosing() && (k === 'ArrowUp' || k === 'ArrowDown')) { e.preventDefault(); UI.highlightChoice(UI.choiceHighlight + (k === 'ArrowDown' ? 1 : -1)); return; }
    const arrows = { ArrowUp: 'n', ArrowDown: 's', ArrowLeft: 'w', ArrowRight: 'e' };
    if (arrows[k] && R.mode === 'explore' && !R.inBattle) {
      e.preventDefault();
      const ex = A.findExit(arrows[k]);
      if (ex) act(() => go(ex));
      return;
    }
    const panels = { i: 'items', p: 'party', j: 'journal', m: 'map' };
    const pk = panels[k.toLowerCase()];
    if (pk && !e.ctrlKey && !e.metaKey && !e.altKey) {
      if (R.inBattle) return;
      e.preventDefault();
      UI.setPanel(UI.panelName === pk && UI.getLayout() !== 'desktop' ? 'play' : pk); UI.layout();
    }
  });
}

// ---------------------------------------------------------------- idle trigger
function idleTick() {
  if (R.screen !== 'game' || document.hidden) return;
  if (!isRest() || R.acting || UI.isTyping() || UI.modalOpen() || popEl) return;
  R.idleSeconds++;
  const room = A.curRoom();
  const oi = room?.onIdle;
  if (oi && !R.fired[room.id + '.idle'] && R.idleSeconds >= oi.seconds && check(oi.cond)) {
    R.fired[room.id + '.idle'] = true;
    act(() => run(oi.effects));
  }
}
['pointerdown', 'keydown'].forEach(ev => addEventListener(ev, () => { R.idleSeconds = 0; }, { passive: true }));

// ---------------------------------------------------------------- menus
function openPauseMenu() {
  if (R.screen !== 'game') return;
  closePopover();
  UI.openModal({ title: 'Paused', cls: 'pause', body: (b, close) => {
    const btn = (label, fn, dis) => el('button', { class: 'btn wide', disabled: dis, onclick: () => fn(close) }, label);
    b.append(
      btn('Resume', c => c()),
      btn('Save', () => openSaveMenu()),
      btn('Load', () => openLoadMenu()),
      btn('Settings', () => openSettings()),
      btn('How to play', () => openHowTo()),
      btn('Quit to title', async c => { if (await UI.confirm('Quit', 'Return to the title screen? Unsaved progress since your last save or room change is lost.', 'Quit', 'Stay')) { UI.closeAllModals(); showTitle(); } }),
    );
  } });
}

function slotLabel(meta, slot) {
  if (!meta) return el('span', { class: 'muted' }, 'Empty');
  if (meta.corrupt) return el('span', { class: 'muted' }, 'Unreadable');
  const d = new Date(meta.savedAt || 0);
  return el('span', {}, el('b', {}, `Ch ${UI.roman(meta.chapter)} · ${meta.room}`), el('br'), el('small', {}, `Lv ${meta.level} · ${meta.gold} silver · ${d.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}`));
}

function openSaveMenu() {
  const can = isRest();
  UI.openModal({ title: 'Save', body: (b, close) => {
    if (!can) b.append(el('p', { class: 'warn' }, 'You can save when nothing is happening: no dialogue, battle or item targeting.'));
    for (const s of ['1', '2', '3']) {
      b.append(el('button', { class: 'row slot', disabled: !can, onclick: async () => {
        if (slotMeta(s) && !(await UI.confirm('Overwrite', `Overwrite slot ${s}?`, 'Overwrite', 'Cancel'))) return;
        if (saveTo(s)) { close(true); }
      } }, el('span', { class: 'slot-no' }, s), slotLabel(slotMeta(s), s)));
    }
  } });
}

function openLoadMenu() {
  UI.openModal({ title: 'Load', body: (b) => {
    for (const s of SLOTS) {
      const meta = slotMeta(s);
      b.append(el('button', { class: 'row slot', disabled: !meta || meta.corrupt, onclick: async () => {
        if (R.screen === 'game' && !(await UI.confirm('Load', 'Load this save? Progress since your last save is lost.', 'Load', 'Cancel'))) return;
        loadSlot(s);
      } }, el('span', { class: 'slot-no' }, s === 'auto' ? 'A' : s), slotLabel(meta, s)));
    }
  } });
}

function openSettings() {
  UI.openModal({ title: 'Settings', cls: 'settings', body: (b) => {
    const row = (label, ctl) => el('label', { class: 'set-row' }, el('span', {}, label), ctl);
    const slider = (key) => {
      const i = el('input', { type: 'range', min: 0, max: 100, value: Math.round(SETTINGS[key] * 100), 'aria-label': key });
      i.addEventListener('input', () => { SETTINGS[key] = i.value / 100; saveSettings(); Audio.applyVolumes(); });
      i.addEventListener('change', () => Audio.sfx('tap'));
      return i;
    };
    const seg = (key, opts, after) => el('span', { class: 'seg' }, opts.map(([v, l]) => el('button', { class: 'seg-b' + (SETTINGS[key] === v ? ' on' : ''), onclick: (e) => {
      SETTINGS[key] = v; saveSettings(); e.currentTarget.parentElement.querySelectorAll('.seg-b').forEach(x => x.classList.toggle('on', x === e.currentTarget)); Audio.sfx('tap'); after?.();
    } }, l)));
    const tog = (key, after) => { const c = el('input', { type: 'checkbox' }); c.checked = !!SETTINGS[key]; c.addEventListener('change', () => { SETTINGS[key] = c.checked; saveSettings(); after?.(); Audio.sfx('tap'); }); return c; };
    b.append(
      row('Music', slider('music')),
      row('Sound', slider('sfx')),
      row('Mute all', tog('mute', () => { Audio.applyVolumes(); UI.renderTop(); })),
      row('Typing sound', tog('typingSound')),
      row('Text speed', seg('textSpeed', [['slow', 'Slow'], ['normal', 'Normal'], ['fast', 'Fast'], ['instant', 'Instant']])),
      row('Difficulty', seg('difficulty', [['saga', 'Saga'], ['warrior', 'Warrior']])),
      el('p', { class: 'muted small' }, 'Saga: story mode, enemies at 70% HP and damage, 25% more gold. Change any time.'),
      row('Show hotspots', tog('showHotspots', applySettings)),
      row('Text size', seg('fontSize', [['s', 'S'], ['m', 'M'], ['l', 'L']], () => { applySettings(); UI.layout(); })),
    );
  } });
}

function openHowTo() {
  UI.openModal({ title: 'How to play', cls: 'howto', body: (b) => {
    const card = (icon, title, txt) => el('div', { class: 'how' }, el('img', { class: 'how-i', alt: '', src: icon }), el('div', {}, el('b', {}, title), el('p', {}, txt)));
    b.append(
      card(Scene.portraitURL('portrait/kord', 'Kord'), UI.tapWords('Tap the glowing words'), 'Highlighted words, the "Things here" chips and the people and objects in the picture all open a small menu: Look, Talk, Take, Use, Hit.'),
      card(UI.iconURL('key'), 'Use items', UI.tapWords('Open Items (or the bag button), pick something, then Use and tap a target. Combine joins two items into one. Equipped gear counts as held.')),
      card(UI.iconURL('sword'), 'Fight', 'Battles are turn-based. Every command acts on the target named on the button. Defend when a foe announces a big move. Auto fights for you.'),
      card(UI.iconURL('scroll'), 'Stuck?', 'The Journal lists your goals with three hints each, and "Ask the party" gets an opinion. Wrong ideas never kill you; they just get you a remark.'),
      card(UI.iconURL('document'), 'Keyboard', 'Type commands like "look lamp", "use oil on rag", "give wine to bolo", "n". Numbers pick choices. I/P/J/M open panels, / focuses the command line, Esc pauses, Ctrl+M mutes.'),
    );
  } });
}

function openCredits() {
  UI.openModal({ title: 'Credits', body: (b) => {
    b.append(el('p', {}, 'BarbarAIn: a sword-and-sorcery text adventure in the spirit of Robert E. Howard\'s Hyborian Age. An original story; no text of Howard\'s is quoted.'),
      el('dl', { class: 'end-credits' }, creditsList().map(c => [el('dt', {}, c.role), el('dd', {}, c.who)])),
      el('p', {}, 'Fonts (SIL Open Font License): Alegreya by Juan Pablo del Peral, Pixelify Sans by Stefie Justprince, Metamorphous by James Grieshaber, Cinzel Decorative by Natanael Gama.'),
      el('p', { class: 'muted' }, 'Made with plain HTML, CSS and JavaScript.'));
  } });
}

// ---------------------------------------------------------------- debug hook
function installDebugHook() {
  window.__game = {
    state: () => ({
      screen: R.screen, chapter: S.chapter, chapterComplete: [...(S.chapterComplete || [])], room: S.room,
      rest: R.screen === 'game' ? isRest() && !R.acting : false,
      busy: !!(UI.isTyping() || R.transition || R.busyCount > 0 || (R.acting && !D.choosing() && !D.waitingContinue() && !R.inBattle && !UI.modalOpen())),
      mode: R.mode, flags: { ...(S.flags || {}) },
      objectives: Object.entries(S.journal?.obj || {}).map(([id, status]) => ({ id, status })),
      party: (S.party || []).map(p => { const st = gearStats(p); return { id: p.id, level: partyLevel(), hp: p.hp, mp: p.mp, maxHp: st.hp, maxMp: st.mp, frozen: !!p.frozen, statuses: (p.statuses || []).map(x => x.id || x), equip: { ...p.equip } }; }),
      guest: S.guest || null, items: { ...(S.items || {}) }, gold: S.gold, xp: S.xp, level: S.party ? partyLevel() : 1,
      inBattle: !!R.inBattle, battle: R.battle ? (BattleUI?.state ? BattleUI.state() : R.battle) : null,
      battleResult: R.battleResult, gameWon: !!S.gameWon,
      targeting: R.targeting ? R.targeting.item : null,
      choices: D.choosing() || R.inBattle ? UI.trayButtons().map(b => b.text || (typeof b.label === 'string' ? b.label : b.label?.textContent || '')) : [],
      waitingContinue: D.waitingContinue(),
      things: R.screen === 'game' ? A.things().map(t => t.id) : [],
      exits: R.screen === 'game' ? A.exits().map(e => ({ dir: e.dir, to: e.to, open: A.exitOpen(A.curRoom(), e) })) : [],
      layout: UI.getLayout(), panel: UI.panelName,
    }),
    levels: () => 5,
    goToLevel: (n, opts = {}) => {
      if (!DB.chapters[n] || !DB.rooms[DB.snapshots[n]?.room || DB.chapters[n].start]) { console.warn(`goToLevel(${n}): chapter ${n} is not written yet`); return false; }
      resetFlow(); UI.closeAllModals();
      R.attempts = {};
      unlockOnce();
      freshGame(n);
      for (const [k, v] of Object.entries(opts.flags || {})) S.flags[k] = v;
      startPlaying();
      return true;
    },
    setFlag: (k, v = true) => { if (v === null) delete S.flags[k]; else S.flags[k] = v; refresh(); return true; },
    endings: () => ({ ...SETTINGS.endings }),
    goToRoom: (id) => {
      if (!DB.rooms[id]) return false;
      if (R.screen !== 'game') { if (!S.party || !S.party.length) freshGame(DB.rooms[id].chapter || 1); S.room = id; startPlaying(); return true; }
      abortBattle();
      R.epoch++; D.cancelChoice(); D.continuePending(); R.acting = false; R.mode = 'explore'; R.targeting = null; UI.setBanner(null);
      enterRoom(id);
      return true;
    },
    // fight(encounterId): start a placed encounter from the current room (testing)
    fight: (id) => { if (R.screen !== 'game' || R.inBattle || !DB.encounters[id] || !isRest() || R.acting || UI.isTyping()) return false; act(() => startBattle(id)); return true; },
    audioState: () => Audio.state(),
    setAuto: (on) => { R.autoBattle = !!on; BattleUI?.setAuto?.(!!on); return R.autoBattle; },
    // policyCommand(policy): what a battle policy (tools/solutions/policies) would do for the member whose turn it is (read-only advice for replays)
    policyCommand: async (policy) => { const B = BattleUI?._debug?.().B; if (!B || !B.awaiting || B.over) return null; const Battle = await import('./battle.js'); return Battle.policyCommand(B, policy, B.awaiting); },
    hotspots: () => Scene.hotspotList(),
    clientPointOf: (id) => Scene.clientPointOf(id),
    data: DB,
  };
}

boot().catch(e => { console.error(e); document.body.append(Object.assign(document.createElement('pre'), { textContent: 'Boot failed: ' + e.message, className: 'boot-error' })); });
