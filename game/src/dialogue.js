// dialogue.js: dialogue and scene runners over data (DATA_SPEC §5), and the
// shared numbered-choice prompt (dialogue replies, "Which…?", game prompts).

import { DB, S, R } from './state.js';
import { check, run, text as resolveText, hooks } from './conditions.js';
import * as UI from './ui.js';
import * as Scene from './scene.js';

let pendingChoice = null;   // {resolve, options}

// Shows numbered options in the tray; resolves with the chosen index
// (or null if cancelled). Taps, digit keys and typed numbers all work.
export function choose(labels, opts = {}) {
  return new Promise(resolve => {
    const prevMode = R.mode;
    if (opts.mode) R.mode = opts.mode;
    const finish = (i) => {
      if (pendingChoice?.resolve !== resolve) return;
      pendingChoice = null;
      if (opts.mode) R.mode = prevMode;
      resolve(i);
    };
    pendingChoice = { resolve, labels, finish };
    const buttons = labels.map((l, i) => ({ label: l, leave: i === opts.leave, cost: !!opts.costs?.[i], onClick: () => finish(i) }));
    if (opts.cancel) buttons.push({ label: opts.cancel, cls: 'cancel', onClick: () => finish(null) });
    UI.setTray({ buttons, numbered: true, chips: [] });
    UI.layout();
  });
}
export function choosing() { return !!pendingChoice; }
export function cancelChoice() { if (pendingChoice) pendingChoice.finish(null); }
export function pickChoice(n) {
  if (!pendingChoice) return false;
  const btns = UI.trayButtons();
  if (n < 0 || n >= btns.length) return false;
  btns[n].onClick();
  return true;
}

// Waits for a tap on Continue / the story / Enter / Space.
let pendingContinue = null;
export function waitContinue(label = 'Continue ▸') {
  return new Promise(resolve => {
    pendingContinue = () => { pendingContinue = null; resolve(); };
    UI.setTray({ buttons: [{ label, cls: 'continue wide', onClick: () => pendingContinue?.() }], numbered: false, chips: [] });
  });
}
export function continuePending() { if (pendingContinue) { pendingContinue(); return true; } return false; }
export function waitingContinue() { return !!pendingContinue; }

export async function runDialogue(id) {
  const d = DB.dialogues[id];
  if (!d) { console.warn('missing dialogue', id); return; }
  const prev = R.mode; R.mode = 'dialogue'; UI.layout();
  const epoch = R.epoch;
  let nodeId = d.start || Object.keys(d.nodes)[0];
  let guard = 0;
  const seen = new Set();   // nodes already shown in this conversation (for `again`)
  try {
    while (nodeId && guard++ < 400) {
      if (R.epoch !== epoch) return;
      const node = d.nodes[nodeId];
      if (!node) { console.warn('missing node', id, nodeId); break; }
      if (node.cond && !check(node.cond)) { nodeId = node.else ?? null; continue; }
      const again = seen.has(nodeId) && node.again != null;
      seen.add(nodeId);
      const t = resolveText(again ? node.again : node.text);
      if (t) await UI.log({ speaker: node.speaker || 'narrator', text: t });
      if (R.epoch !== epoch) return;
      // a text variant may carry its own effects (e.g. set a "met" flag)
      const variant = !again && Array.isArray(node.text) ? node.text.find(v => typeof v === 'string' || check(v.cond)) : null;
      if (variant?.effects) { R.mode = 'dialogue'; const ok = await run(variant.effects); R.mode = 'dialogue'; if (!ok) return; }
      if (node.effects) { R.mode = 'dialogue'; const ok = await run(node.effects); R.mode = 'dialogue'; if (!ok) return; }
      if (R.epoch !== epoch) return;
      const all = node.choices || [];
      const shown = all.map((c, i) => ({ c, i })).filter(({ c, i }) => check(c.cond) && !(c.hideIfDone && S.choicesDone[`${id}.${nodeId}.${i}`]));
      if (shown.length) {
        UI.layout();
        // the reply that just ends the talk (typed "bye" / "out" / a direction picks it)
        const leave = shown.findLastIndex(({ c }) => c.next == null && !c.effects && !c.say);
        const costs = shown.map(({ c }) => (c.effects || []).some(e => e && e.gold < 0));   // typed text never buys by accident
        const pick = await choose(shown.map(({ c }) => resolveText(c.text)), { leave, costs });
        if (R.epoch !== epoch) return;
        if (pick == null) { nodeId = null; break; }
        const { c, i } = shown[pick];
        UI.log({ text: resolveText(c.text), cls: 'ln-choice', instant: true });
        if (c.hideIfDone) S.choicesDone[`${id}.${nodeId}.${i}`] = true;
        if (c.effects) { const ok = await run(c.effects); R.mode = 'dialogue'; if (!ok) return; }
        if (c.say && hooks.say) await hooks.say(c.say);
        nodeId = c.next ?? null;
      } else {
        nodeId = node.next ?? null;
        if (nodeId) await sleep(180);
      }
    }
  } finally {
    if (R.epoch === epoch) { R.mode = prev === 'dialogue' ? 'explore' : prev; UI.layout(); hooks.refresh(); }
  }
}

export async function runScene(id) {
  const lines = DB.scenes[id];
  if (!lines) { console.warn('missing scene', id); return; }
  const prev = R.mode; R.mode = 'scene'; UI.layout();
  const epoch = R.epoch;
  let artOn = false;
  try {
    for (const ln of lines) {
      if (R.epoch !== epoch) return;
      if (ln.cond && !check(ln.cond)) continue;
      if ('art' in ln) {
        if (ln.art) { await Scene.fadeTo(1, 200); Scene.setArt(ln.art, ln.caption); artOn = true; await Scene.fadeTo(0, 300); }
        else if (artOn) { Scene.setArt(null); artOn = false; }
      }
      const t = resolveText(ln.text);
      if (t) await UI.log({ speaker: ln.speaker || 'narrator', text: t });
      if (R.epoch !== epoch) return;
      if (ln.effects) { const ok = await run(ln.effects); R.mode = 'scene'; if (!ok) return; }
      if (R.epoch !== epoch) return;
      if (t && !ln.noWait) await waitContinue();
      if (R.epoch !== epoch) return;
    }
  } finally {
    if (artOn) Scene.setArt(null);
    if (R.epoch === epoch) { R.mode = prev === 'scene' ? 'explore' : prev; UI.layout(); hooks.refresh(); }
  }
}

export function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
