# BarbarAIn — engine notes

The reference for anyone adding content or plugging in a system. The data
format itself is `design/DATA_SPEC.md`; this file covers how the engine reads
it, the extensions it adds, asset conventions, the battle adapter and testing.

## Run it

```bash
python3 -m http.server 8123 --bind 127.0.0.1 --directory game   # then open http://127.0.0.1:8123/
node tools/validate.mjs            # content check; must print 0 error(s)
node tools/validate.mjs --strict   # missing / unindexed asset files become errors
node tools/validate.mjs --tests    # also checks tools/solutions/*.json fixtures
```

URL flags: `?sw=1` registers the service worker on localhost (offline test);
`?probe=1` loads every image by its conventional path even if
`assets/manifest.json` doesn't list it (useful while art lands; missing files
then show as 404s in the console).

## Module map (`game/src/`)

| File | Job |
|---|---|
| `main.js` | boot, screens (title, chapter card, play, game over), room travel (`enterRoom`/`go`), `refresh()` (top bar, picture model, tray, panel), action serialising (`act`), **battle adapter**, autosave, keyboard, idle trigger, pause/save/load/settings/how-to/credits menus, debug hook, SW registration |
| `state.js` | `DB` registry + `loadData()` (guarded imports), `S` (saved state), `R` (runtime), `SETTINGS`, levels/XP, `gearStats`, seeded RNG + `pickFrom`, saves (slots, `MIGRATIONS`, reference check, snapshot fallback), `isRest()`. **`CHAPTER_FILES`** lists the chapter files to load |
| `conditions.js` | condition checker `check()`, text variants `text()`, `pickResponse()`, effect runner `run()` (async; returns false when the chain is cut). UI/flow reached through `hooks` (filled by main.js) |
| `actions.js` | verbs (look/take/use/give/combine/talk/hit/say/shout), the DATA_SPEC §6 fallback chains, targeting mode, `counted()` (onAction), banter, drink/equip, inn, hints/Ask the party, shop modal, Seek trouble |
| `parser.js` | command line: verbs + synonyms, noun resolution (things, NPCs, held items, companions, members, exits; exact then whole-word/partial), "Which…?" prompt, battle passthrough, bare numbers, help |
| `dialogue.js` | `runDialogue`, `runScene`, the shared numbered `choose()` prompt, `waitContinue()` |
| `ui.js` | layout (visualViewport, the phone budgets; desktop picture at a whole-number scale: 2× when the window leaves ≥ 250 px for story + tray, i.e. heights ≥ ~760 px, else 1×; first-time tips sit at the bottom edge of the picture on phones), story log + typewriter + `[[id|text]]` links, top bar/party strip, tray, banner, toasts, tips, modals/sheets, panels (Party / Items / Journal / Map), code-drawn item icons |
| `scene.js` | the 320×180 canvas: bg, props, NPCs, tap boxes (≥44 CSS px), glints, ambient fx, mosaic/fade, key art, battle stub view, title art, placeholder art, portrait placeholders, asset index |
| `inventory.js` | bag, equip rules, compare, Best gear (BALANCE §6, per member and whole party), consumables in the field, shop prices |
| `battle.js` | the pure battle engine (design/BATTLE_API.md) |
| `battle-ui.js` | the battle screen: battlefield renderer, event animation, tray / sheets / ally picker, keyboard and typed commands, victory and level-up cards |
| `audio.js` | Web Audio: music loop table with two-source crossfade, 1 s track crossfade, ambience loops, sfx (+ code blips and stand-ins), mute/volumes |

## Asset ids → files

`kind/name` → `game/assets/<dir>/<name>.png`:

| kind | dir | example |
|---|---|---|
| `bg` | `bg/` | `bg/shz-tavern` → `assets/bg/shz-tavern.png` |
| `npc` | `sprites/npc/` | `npc/oyuk` → `assets/sprites/npc/oyuk.png` |
| `enemy` | `sprites/enemy/` | `enemy/turanian-merc` |
| `party` | `sprites/party/` | `party/kord` (battle sprite; `party/kord-attack-1..4` frames) |
| `portrait` | `portraits/` | `portrait/kord` |
| `prop` | `props/` | `prop/stocks` |
| `keyart` | `keyart/` | `keyart/title-tower` |
| `icon` | `icons/` | `icon/sword` (item `icon` field) |

**The image index.** To keep the console free of 404s, the game loads only
images listed in **`game/assets/manifest.json`**, written by
**`node tools/build-assets-manifest.mjs`** (run it after adding or renaming art;
`--check` exits 1 when it is stale). It lists every PNG under `bg/`,
`sprites/{party,enemy,npc}/`, `portraits/`, `props/`, `keyart/`, `icons/` by
its conventional id, a few aliases (`prop/diary` → `props/diary-lectern.png`,
the old `party/<id>-battle` ids), and an `anims` block with the attack
animations (`kord-attack`, `toktai-shoot`, `valka-lunge`: frame ids, fps,
`idleOffsetX/Y`) that `battle-ui.js` plays. Any JSON shape works as long
as asset ids appear as keys or list entries, e.g.
`{"images": {"bg/shz-tavern": "bg/shz-tavern.png", "npc/oyuk": {}}}` or
`{"images": ["bg/shz-tavern", "npc/oyuk"]}` (a string value ending in `.png`
overrides the path). Everything else is drawn as placeholder art (moody
gradient + room name; labelled silhouettes for NPCs/props; initial-letter
portraits; code-drawn 16×16 icons). `validate.mjs` warns about files that exist
but aren't indexed, and errors on manifest entries whose file is missing.

Sprites are drawn at their natural size at `thing.sprite.x/y` (top-left, in
320×180 units). `sprite.w/h` are only the placeholder size (NPC default 22×48,
prop 24×24); the tap box is the real image box padded to 44 CSS px.

Audio comes from `game/assets/audio/manifest.json`
(`{music:{id:{file,loopStart,loopEnd,crossfade,once}}, sfx:{id:{file,volume?}}}`).
Room `music` / `ambience` and effect `sfx` use those ids (`loop-tavern`,
`loop-crowd`, `loop-dungeon`, `water-rush`…). Engine names alias to them:
door→door-creak, solve→puzzle, swoosh→battle-swoosh, levelup→level-up,
gameover→game-over, equip→clang. Missing sfx fall back to code blips; code-only
sounds: tick, tap, back, error, ain, save, heartbeat.

## Adding content

1. Write `game/src/data/chN.js` exporting `{chapter, rooms, npcs, dialogues,
   scenes, objectives, shops, threats, seekTrouble}` (+ optional `banter`,
   `itemNames`). Copy the shape of `ch1.js`.
2. Add `'chN'` to `CHAPTER_FILES` in `game/src/state.js` (validate errors if you forget).
3. `node tools/validate.mjs` until it prints `0 error(s)`.

`CHAPTER_FILES` now lists ch1 … ch5. Older note: `ch1.js`: tavern, street and market are the finished pattern; bazaar, alley and
garden are working (puzzles A and B play end to end); rooms marked `stub: true`
(tower ×4, sewers, road) have placeholder writing, the placed fights, a minimal
way through and the flags `SNAPSHOTS[2]` expects (`ch1.toktai_free`,
`ch1.ain_joined`, `ch1.ashkarran_dead`). `sc_twist1` and `sc_road` are short
stubs of the STORY scenes. Validate lists remaining stubs as a warning.

### Engine extensions to DATA_SPEC (all validated)

| Where | Field | Meaning |
|---|---|---|
| `chapter` | `{n, name, start, card, opening, party}` | number, title, start room, chapter-card art, opening paragraph (chapter I), members who can appear (for objective party-line checks) |
| chapter file | `itemNames: {itemId: [words]}` | extra parser synonyms for items (items.js has names only) |
| chapter file | `banter: {member: [lines]}` | "Talk" to a companion pool; the active objective's party line joins it |
| room | `map: {x, y}`, `mapName`, `dungeon: true` | Map node position/label; no fast travel to/from dungeon rooms |
| room | `glints: [{x, y, cond?, pair?, small?, steady?, period?, phase?, a?, color?}]` | code-drawn teal glints (`pair: 3` = two eyes 3 px apart) |
| room | `fx: [{type:'torch', x, y, r} \| {type:'dust'\|'rain'\|'motes'\|'spray', n} \| {type:'heat', y} \| {type:'vignette', a}]` (+ `cond`) | ambient scene life |
| room | `banter: {member: response}` | room-specific companion line |
| room | `stub: true` | not finished (validate warns) |
| exit | `blockedEffects: [effects]`, `seemsOpen`, `hidden`, `look` | run after the blocked text; draw a closed exit as normal (`true` or a condition; no error sound); hide until open |
| encounter | `loseHint` | one in-voice line on the game-over screen for this fight (else a line from the enemies' weaknesses) |
| encounter | `firstTarget: enemyId` | the target Attack starts on (the tutorial's Gorm) |
| room encounter | `label` on an `auto` one | tray button shown only if it was fled with no way back (chapter-start rooms) |
| thing | `use: {self: response}` | "use stocks" with no item (also offered in the Use… sheet) |
| thing | `still: true`, `chip: false` | no idle bob; not listed as a chip |
| thing | `sprite.hideWhen: cond` | draw no sprite while the condition holds; the tap box stays (a hotspot of `sprite.x/y/w/h`) |
| thing | `tint: 'stilled'` | drawn as a grey-blue copy of its sprite, no idle bob (ch V frozen people) |
| room fx | `{type:'glow', y0, y1, color?, a?}` | pulsing additive band (the teal sea glow) |
| chapter | `credits: [{role, who}]` | the end screen after `{chapterEnd:5}` (and the Credits menu) |
| response | `speaker` | the reply is that character's line (portrait, teal for Ain) |
| effect | `{text, speaker?}` | print a line |
| effect | `{cond, effects:[…]}` | effect group (conditions on single effects work too) |
| effect | `{equip:{who, item}}`, `{shop:'id'}`, `{tip:'id'}` | |
| effect `give`/`take` | `quiet: true` | no toast |
| dialogue node | `cond` + `else` | skip to `else` when cond fails (one-time remarks) |
| dialogue node | `again` | text shown instead of `text` when the node is re-entered in the same conversation (hub prompts) |
| scene line | `art`, `caption`, `noWait` | key art on the picture (`art: null` clears); don't wait for Continue (e.g. a line that opens a dialogue) |
| objective | `members: [ids]` | who can be present (party lines required for those) |
| shop | `short`, `greeting`, `room`, `cond` | tray label, greeting line |

`{battle}` continues its effect chain after a win, **or after a loss when the
encounter's `onLose` is a list** (tutorial, duel); it stops on a game over.

Fleeing a fight that starts on entering a room (its `onEnter`, or an `auto`
encounter) sends the party back through the exit to the room it came from,
where the autosave is made; with no such exit it stays, and the room's
progress exits are gated on the fight's flag (their `blockedEffects` restart
the fight). A fled `onAction` ambush fires again on the next action.

Text: `[[id|shown]]` (prefer explicit text; bare `[[id]]` shows the thing's full
`name`), `*italic*`, `\n\n` paragraphs. Default pools may use `{item}`/`{target}`.

## Battle adapter (for `battle-ui.js`)

`main.js` → `startBattle(encounterIdOrObject)` → `Promise<'won'|'lost'|'fled'>`.
It is what the `{battle:id}` effect, auto room encounters, non-auto
encounters' "⚔ Fight" tray button and Seek trouble call
(`makeSeekTroubleEncounter`, id `seek_<room>`, pays every time).

The adapter does: transient revert (`battleStart`), `preBattleSnapshot`,
attempt counter (`R.attempts[id]`, reset by `goToLevel`; battle.js seeds itself
from encounter id + attempt), mosaic in/out + swoosh, battle music and back,
`R.inBattle` (tabs hidden), `onWin` / `onLose` effects (an `onLose` list runs
and the story carries on; `'gameover'` → the Game Over screen: Try again
restores the snapshot and re-runs with attempt + 1, Switch to Saga, Load),
"Equip now" toasts for upgrades in the loot, autosave after the battle.

**`game/src/battle-ui.js`** (live; `BATTLE_UI_READY = true`) exports:

```js
export async function prepare(id, encounter, api) // between mosaic in and out: createBattle, load sprites, draw the field
export async function runBattle(id, encounter, api) // play it; resolves { result, settled: true, loot, summary, party }
export function state()        // Battle.battleView(b) + {busy, auto, victory} (window.__game.state().battle)
export function setAuto(on)
export function onKey(event)   // A toggles Auto, R repeats, arrows change target, Enter attacks; digits go to the tray
```

At the end it calls **`api.settle(b, Battle)`** (main.js `settleBattle`), which
applies BATTLE_API §1: `partyAfter` (HP/MP, poison/bleed carry over; fallen get
1 HP after a win), bag (`itemsUsed` out, `rewards.items` in: steals always,
drops on a win), XP/gold once per encounter (`S.won[id]`; the engine already
applies Saga gold and `paysOnLose`), level-ups (full heal), bestiary
(`b.scanned`), a guest who joined mid-fight (`S.guest`). It returns the summary
the victory and level-up cards show (counting numbers, stat before → after,
new skills).

`api` = `{ S, R, DB, Scene, Audio, UI, log, setTray, layout, toast, attempt,
difficulty, auto, stats(memberId), level, flags, setState(view), bestiary,
settle(b, Battle), setAutoFlag(on) }`. Scene hook: `Scene.setBattle({render(lx,
ctx) → hotspots, overlay(cx, k), onTap(id)})` draws a custom battlefield (the
plain `{enemies, party}` model still draws the stub). Tray spec gained `cls`
(`battle` = 3 columns) and per-button `text` (the plain label for
`state().choices` when `label` is a DOM node). `UI.logNode(node)` appends a
ready-made card to the story log.

Typed battle verbs: while `R.inBattle`, every command-line input (including
bare numbers) goes to `hooks.battleCommand(text)`: `auto [on|off]`, a digit
(presses that tray button), or the BATTLE_API §3 grammar (ambiguity → a
numbered "Which:" tray). Any input continues the victory card.

What it draws: room/encounter background darkened ~33% and desaturated 40%
with a lighter floor band; enemies left (1 px light rim, purple glow on the
shadow enemies, red rim while telegraphing), party right (Kord and Valka in
front, Toktai behind, Ain floating with a halo), the guest behind; HP/MP bars
and 12×12 code status icons under each; a gold marker + name on the current
target and a white one over whose turn it is; the turn-order strip with the
AUTO toggle over the top edge. Events: step forward/back with the 4-frame
attack animations, arrows and spell orbs, white hit flash + shake, screen shake
on crits and boss hits, popping damage numbers (crits big and gold, heals green,
WEAK!/RESIST tags, MISS, status names), pixel-dissolve deaths, dissolve-in
summons, phase flash/shake (the Steward's teal cracks and phase-3 glow, the
Eye), red picture tint while a telegraphed move is pending, Bakari's arrival,
sfx per action and the victory fanfare.

Debug: `__game.fight(encounterId)` starts a placed encounter from the current
room (tests only).

## Saves

`localStorage` keys `barbarain.save.auto|1|2|3` and `barbarain.settings`.
`S` is saved as is (`v`, chapter, room, flags, party, guest, items, newItems,
gold, xp, journal, bestiary, visited, seed, chapterComplete, exits,
choicesDone, won, savedAt). Bump `SAVE_VERSION` and add `MIGRATIONS[n]` in
state.js when the shape changes. Unknown ids on load → `SNAPSHOTS[chapter]`
with the "chronicle has been rewritten" line. Saving only when `isRest()`
(explore mode, no dialogue/scene/battle/targeting/transition, room `rest !== false`);
transient items revert first.

## Debug hook

`window.__game.state()` → `{screen, chapter, chapterComplete, room, rest,
busy, mode, flags, objectives:[{id,status}], party:[{id, level, hp, mp, maxHp,
maxMp, frozen, statuses, equip}], guest, items, gold, xp, level, inBattle,
battle, battleResult, gameWon, targeting, choices (current numbered labels),
waitingContinue, things, exits:[{dir,to,open}], layout, panel}`.
`levels()` → 5; `goToLevel(n)` (returns false if chapter n isn't written);
`fight(encounterId)`;
`goToRoom(id)`; `audioState()`; `setAuto(bool)`; `hotspots()`;
`clientPointOf(thingId)` (screen point of a prop for tap tests).
`policyCommand(policy)` (async: what a battle policy from `tools/solutions/policies/` would
do for the member whose turn it is; read-only advice the replay then types). `state().battle.input`
is true once the battle takes input (a command typed before that gets "Wait for your turn").

**Replays and checks** (game served on :8123):
`node tools/replay.mjs all | ch1 … ch5 | ch1-touch | --continuous [--phone] [--shots=<prefix>]`
(typed scripts from `goToLevel(n)`, boss fights by policy, end state checked against
`SNAPSHOTS[n+1]`; the touch script taps at 393×659; `--continuous` plays New Game → end screen)
and `node tools/dod-check.mjs [desktop small iphone landscape narrow] [--offline] [--shots]`
(the Definition-of-done screens, saves, audio, offline). Log: `design/PLAYTEST.md`.

Replays: send input only when `busy` is false. Scenes wait for Continue
(`waitingContinue`; any typed text or Enter/Space/tap continues). Dialogue
choices can be typed as numbers or as a prefix of the label.
