// audio.js: Web Audio. Music with per-track loop points and a two-source
// crossfade (from assets/audio/manifest.json), 1 s crossfade between tracks,
// never two copies of a track; sfx; ambience loops; code-made blips; mute.

import { SETTINGS, saveSettings } from './state.js';

const BASE = 'assets/audio/';
let ctx = null, master = null, musicBus = null, sfxBus = null, ambBus = null;
let manifest = { music: {}, sfx: {} };
const buffers = new Map();      // file -> Promise<AudioBuffer|null>
let music = null;               // {id, gain, timer, sources:[]}
let ambience = null;            // {id, gain, src}
let wantMusic = null, wantAmb = null;

export async function init() {
  try {
    const res = await fetch(BASE + 'manifest.json', { cache: 'no-cache' });
    if (res.ok) {
      const m = await res.json();
      manifest = { music: m.music || {}, sfx: m.sfx || {} };
    }
  } catch (e) { /* no audio yet: code blips only */ }
}

export function hasMusic(id) { return !!manifest.music[id]; }

export function unlock() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.connect(ctx.destination);
    musicBus = ctx.createGain(); musicBus.connect(master);
    sfxBus = ctx.createGain(); sfxBus.connect(master);
    ambBus = ctx.createGain(); ambBus.connect(sfxBus);
    applyVolumes();
  }
  if (ctx.state === 'suspended') ctx.resume();
  if (wantMusic && !music) playMusic(wantMusic);
  if (wantAmb && !ambience) playAmbience(wantAmb);
}

// every user gesture: wake a context the browser refused to start, or that
// the phone interrupted (a call, Siri) or left suspended after the tab came back
export function nudge() {
  if (!ctx || document.hidden || ctx.state === 'running') return;
  ctx.resume().then(() => {
    if (wantMusic && !music) playMusic(wantMusic);
    if (wantAmb && !ambience) playAmbience(wantAmb);
  }).catch(() => {});
}

export function suspend(on) {
  if (!ctx) return;
  if (on) ctx.suspend(); else ctx.resume();
}

export function applyVolumes() {
  if (!ctx) return;
  const t = ctx.currentTime;
  master.gain.setTargetAtTime(SETTINGS.mute ? 0 : 1, t, 0.02);
  musicBus.gain.setTargetAtTime(SETTINGS.music, t, 0.02);
  sfxBus.gain.setTargetAtTime(SETTINGS.sfx, t, 0.02);
}

export function toggleMute() {
  SETTINGS.mute = !SETTINGS.mute; saveSettings(); applyVolumes();
  return SETTINGS.mute;
}

function load(file) {
  if (!ctx) return Promise.resolve(null);
  if (!buffers.has(file)) {
    buffers.set(file, fetch(BASE + file).then(r => r.ok ? r.arrayBuffer() : null)
      .then(ab => ab ? ctx.decodeAudioData(ab) : null).catch(() => null));
  }
  return buffers.get(file);
}

// ---------------------------------------------------------------- music
export function playMusic(id) {
  wantMusic = id || null;
  if (!ctx) return;
  if (music && music.id === id) return;           // never two copies
  const old = music; music = null;
  if (old) fadeOutTrack(old, 1.0);
  if (!id || !manifest.music[id]) return;
  const def = manifest.music[id];
  const track = { id, gain: ctx.createGain(), timer: null, sources: [], stopped: false };
  track.gain.connect(musicBus);
  track.gain.gain.setValueAtTime(0, ctx.currentTime);
  track.gain.gain.linearRampToValueAtTime(1, ctx.currentTime + (old ? 1.0 : 0.3));
  music = track;
  load(def.file).then(buf => {
    if (!buf || track.stopped || music !== track) return;
    const loopEnd = Math.min(def.loopEnd || buf.duration, buf.duration);
    const loopStart = Math.max(0, Math.min(def.loopStart || 0, loopEnd - 1));
    const xf = Math.max(0.05, Math.min(def.crossfade ?? 1.5, (loopEnd - loopStart) / 3));
    const once = def.once === true;
    scheduleSegment(track, buf, 0, ctx.currentTime + 0.02, { loopStart, loopEnd, xf, once, first: true });
  });
}

// One segment plays [offset, loopEnd]; the next starts xf before its end
// at loopStart - xf so both meet at the seam.
function scheduleSegment(track, buf, offset, when, o) {
  if (track.stopped) return;
  const src = ctx.createBufferSource(); src.buffer = buf;
  const g = ctx.createGain(); src.connect(g); g.connect(track.gain);
  const segDur = o.loopEnd - offset;
  if (o.first) g.gain.setValueAtTime(1, when);
  else { g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(1, when + o.xf); }
  src.start(when, offset, o.once ? undefined : segDur);
  track.sources.push(src);
  src.onended = () => { track.sources = track.sources.filter(s => s !== src); };
  if (o.once) { track.timer = setTimeout(() => { if (music === track && track.onDone) track.onDone(); }, (buf.duration - offset) * 1000); return; }
  const endAt = when + segDur;
  g.gain.setValueAtTime(1, Math.max(when + 0.01, endAt - o.xf));
  g.gain.linearRampToValueAtTime(0, endAt);
  const nextAt = endAt - o.xf;
  const nextOffset = Math.max(0, o.loopStart - o.xf);
  const lead = Math.max(0, (nextAt - ctx.currentTime - 0.5) * 1000);
  track.timer = setTimeout(() => scheduleSegment(track, buf, nextOffset, Math.max(nextAt, ctx.currentTime + 0.01), { ...o, first: false }), lead);
}

function fadeOutTrack(track, secs) {
  track.stopped = true;
  clearTimeout(track.timer);
  const t = ctx.currentTime;
  track.gain.gain.cancelScheduledValues(t);
  track.gain.gain.setValueAtTime(track.gain.gain.value, t);
  track.gain.gain.linearRampToValueAtTime(0, t + secs);
  for (const s of track.sources) { try { s.stop(t + secs + 0.05); } catch (e) { /* already stopped */ } }
  setTimeout(() => { try { track.gain.disconnect(); } catch (e) { /* gone */ } }, (secs + 0.2) * 1000);
}

export function stopMusic() { playMusic(null); }

// ---------------------------------------------------------------- ambience loops
export function playAmbience(id) {
  wantAmb = id || null;
  if (!ctx) return;
  if (ambience && ambience.id === id) return;
  const old = ambience; ambience = null;
  if (old) { const t = ctx.currentTime; old.gain.gain.setTargetAtTime(0, t, 0.3); setTimeout(() => { try { old.src?.stop(); } catch (e) { /* */ } }, 1500); }
  const def = id && manifest.sfx[resolveSfx(id)];
  if (!def) return;
  const amb = { id, gain: ctx.createGain(), src: null };
  amb.gain.connect(ambBus); amb.gain.gain.value = 0;
  ambience = amb;
  load(def.file).then(buf => {
    if (!buf || ambience !== amb) return;
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    src.connect(amb.gain); src.start();
    amb.src = src;
    amb.gain.gain.setTargetAtTime(def.volume ?? 0.5, ctx.currentTime, 0.4);
  });
}

// ---------------------------------------------------------------- sfx
const CODE_SFX = {
  tick: () => blip(880 + Math.random() * 60, 0.025, 'sine', 0.025),   // soft, slightly varied
  tap: () => blip(660, 0.04, 'triangle', 0.18),
  back: () => { blip(520, 0.05, 'triangle', 0.15); blip(390, 0.06, 'triangle', 0.12, 0.05); },
  error: () => blip(160, 0.12, 'sawtooth', 0.12),
  ain: () => { blip(1320, 0.05, 'sine', 0.12); blip(1760, 0.06, 'sine', 0.08, 0.05); },
  save: () => { blip(880, 0.06, 'sine', 0.15); blip(1320, 0.1, 'sine', 0.15, 0.07); },
  heartbeat: () => { blip(55, 0.12, 'sine', 0.5); blip(50, 0.14, 'sine', 0.4, 0.18); },
  // stand-ins until the generated sfx land
  pickup: () => { blip(740, 0.05, 'square', 0.1); blip(990, 0.07, 'square', 0.1, 0.05); },
  coins: () => { for (let i = 0; i < 4; i++) blip(1500 + i * 220, 0.04, 'square', 0.07, i * 0.05); },
  solve: () => { [784, 988, 1175, 1568].forEach((f, i) => blip(f, 0.18, 'sine', 0.12, i * 0.08)); },
  join: () => { [523, 659, 784].forEach((f, i) => blip(f, 0.15, 'triangle', 0.14, i * 0.09)); },
  heal: () => { [660, 880, 1100].forEach((f, i) => blip(f, 0.2, 'sine', 0.1, i * 0.06)); },
  door: () => noise(0.25, 300, 0.25),
  equip: () => { noise(0.08, 3000, 0.2); blip(220, 0.08, 'square', 0.1); },
  swoosh: () => noise(0.35, 1200, 0.25),
  levelup: () => { [523, 659, 784, 1047].forEach((f, i) => blip(f, 0.22, 'square', 0.1, i * 0.1)); },
  gameover: () => { [392, 330, 262, 196].forEach((f, i) => blip(f, 0.35, 'triangle', 0.15, i * 0.25)); },
  chapter: () => { [294, 440, 587].forEach((f, i) => blip(f, 0.5, 'triangle', 0.12, i * 0.18)); },
};

// engine names -> generated sfx ids (assets/audio/manifest.json)
const ALIAS = { door: 'door-creak', solve: 'puzzle', swoosh: 'battle-swoosh', levelup: 'level-up', gameover: 'game-over',
  equip: 'clang', join: 'puzzle', chest: 'chest', victory: 'victory', tavern: 'loop-tavern', crowd: 'loop-crowd', drip: 'loop-dungeon' };
export function resolveSfx(id) { return manifest.sfx[id] ? id : (ALIAS[id] && manifest.sfx[ALIAS[id]] ? ALIAS[id] : id); }

export function sfx(id) {
  if (!ctx || !id) return;
  const def = manifest.sfx[resolveSfx(id)];
  if (def) {
    load(def.file).then(buf => {
      if (!buf) { CODE_SFX[id]?.(); return; }
      const src = ctx.createBufferSource(); src.buffer = buf;
      const g = ctx.createGain(); g.gain.value = def.volume ?? 1;   // per-sfx manifest gain; sfxBus applies the sfx setting
      if (def.rate) src.playbackRate.value = def.rate;
      src.connect(g); g.connect(sfxBus); src.start();
    });
    return;
  }
  CODE_SFX[id]?.();
}

function blip(freq, dur, type = 'square', vol = 0.1, delay = 0) {
  if (!ctx) return;
  const t = ctx.currentTime + delay;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(sfxBus);
  o.start(t); o.stop(t + dur + 0.02);
}

let noiseBuf = null;
function noise(dur, cutoff, vol) {
  if (!ctx) return;
  if (!noiseBuf) {
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const t = ctx.currentTime;
  const s = ctx.createBufferSource(); s.buffer = noiseBuf;
  const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = cutoff;
  const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(sfxBus);
  s.start(t); s.stop(t + dur);
}

let lastTick = 0;
export function tick() {
  if (SETTINGS.typingSound === false) return;
  const now = performance.now();
  if (now - lastTick < 45) return;
  lastTick = now; sfx('tick');
}

export function state() {
  return {
    context: ctx ? ctx.state : 'none',
    music: music ? music.id : null,
    wantMusic,
    musicTracksPlaying: music ? 1 : 0,
    ambience: ambience ? ambience.id : null,
    muted: !!SETTINGS.mute,
    musicMuted: !!SETTINGS.mute || SETTINGS.music === 0,
    sfxMuted: !!SETTINGS.mute || SETTINGS.sfx === 0,
    musicVolume: SETTINGS.music, sfxVolume: SETTINGS.sfx,
    manifest: { music: Object.keys(manifest.music).length, sfx: Object.keys(manifest.sfx).length },
  };
}
