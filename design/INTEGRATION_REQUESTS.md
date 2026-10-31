
## From the chapter V writer (game/src/data/ch5.js)

1. **Register the chapter.** (DONE: ch5 is now in CHAPTER_FILES.) `game/src/state.js`: add `'ch5'` to `CHAPTER_FILES`. (Validator error until then: "ch5.js exists but is not in CHAPTER_FILES".)

2. **Snapshots ignore `frozen`.** `state.js applySnapshot()` builds members with `makeMember(p.id, p.equip)` and drops `p.frozen`, so `goToLevel(5)` starts with Toktai and Valka awake. Please carry it over: `s.party = snap.party.map(p => Object.assign(makeMember(p.id, p.equip), { frozen: !!p.frozen }))`. (ch5 works around this: `pyr_stilled.onEnter` freezes both once, behind `ch5.begun`.)

3. **Grey "stilled" sprites.** ch5 marks frozen people with `thing.tint: 'stilled'` (Toktai, Valka, the temple guards, the priest, the stair captain; ENGINE_NOTES/STORY: "grey-tinted in code"). In `scene.js drawRoom`, when `th.tint === 'stilled'` draw the sprite with `lx.filter = 'grayscale(100%) brightness(80%) contrast(90%)'` (or, without filter support, draw it then overlay `rgba(120,130,140,0.45)` with `source-atop` on an offscreen copy), and skip the idle bob. Document the field in ENGINE_NOTES' extension table and let validate accept it.

4. **End of game screen.** `main.js chapterEnd(n)` for the last chapter currently prints "End of Chapter V. The chronicle continues in a later telling." That line must not appear after the finale. When `!DB.chapters[n + 1] && n === 5`: set `S.gameWon = true`, autosave, and show a closing screen: title "BarbarAIn", the line "Here ends the chronicle of Kord of Cimmeria.", the credits from `DB.chapters[5].credits` (`[{role, who}]`, already in ch5.js) and buttons "Return to title" / "Credits". (ch5 also prints the credits in the story log in scene `sc_credits` before `{chapterEnd:5}`, so the screen can be short.) Also update `openCredits()` in main.js with the same list: original idea and request by the player; story, code and design by Claude via gamegen; art with imagegen2, nanogen, anim8gen; music and sound with audiogen (ElevenLabs); fonts Alegreya, Pixelify Sans, Metamorphous, Cinzel Decorative (SIL OFL); inspired by the Hyborian Age of Robert E. Howard.

5. **Bakari joining in battle should persist as the guest.** e5_steward's `onPlayerSkill` adds Bakari inside the battle, but the adapter never writes that back, so after the fight `S.guest` is null. ch5's resolution scenes branch on `{guest:'bakari'}` (he is on the apex beside them if the Roar fetched him; otherwise he arrives with the revolt when the Stillness ends). Please have the battle adapter set `S.guest = {id, level}` from the battle's final party when a guest joined mid-fight (or from the `guest` event). ch5 runs `{guestLeave:'bakari'}` itself after the farewells.

6. **e5_thulamon winText duplicates the room scene.** `enemies.js` e5_thulamon has `winText: 'Thulamon falls from the apex. Then a pause, and Ain, clearer than before: "Rest. Ten breaths. I will hold it."'`. ch5's `sc_thulamon_falls` scene plays his fall and Ain's line right after the battle, so the line shows twice. Please change the winText to `'The serpent that was Thulamon reels back toward the edge of the apex.'`.

7. **Parser verbs (nice to have).** Add `shake`, `wake`, `nudge`, `touch` to `use` and `ring`, `bang` to `hit` in `parser.js VERBS`, so "shake toktai", "wake valka", "ring gong", "touch obelisk" reach the replies ch5 wrote under `use.self` / `hit`.

8. **Room bg can be key art.** `epi_dawn` uses `bg: 'keyart/dawn-at-sea'` (STORY's room table gives that art for the epilogue). It renders correctly today; please keep it working if bg loading ever becomes `bg/`-only.

## Chapter III (ch3.js writer)

1. **Register the chapter.** `game/src/state.js`: add `'ch3'` to `CHAPTER_FILES`
   (e.g. `['ch1', 'ch2', 'ch3', 'ch4', 'ch5']` as the files land). Until then
   `validate.mjs` reports "ch3.js exists but is not in CHAPTER_FILES" and
   `goToLevel(3)` returns false.
2. **e3_pillar winText duplicates the chronicle line.** `enemies.js`
   `ENCOUNTERS.e3_pillar.winText` currently ends with "For the first time in
   this chronicle, hitting it was the answer." ch3's `sc_crew_wake` scene
   (run right after the win) speaks that line as narration, so with the real
   battle UI it would appear twice. Please shorten the winText to
   `'The pillar cracks and its note dies.'`
3. **SNAPSHOTS[4]: the two Ain charms placed in chapter III.** ch3 places
   `prism_facet` (Glass Garden, optional room) and `seers_lens` (Window of
   Years, on the main path). Suggest `snapshots.js` SNAPSHOTS[4]:
   `{ id: 'ain', equip: { charm: 'prism_facet' } }` and `seers_lens: 1` in
   `items`. (Not key items, so the play-test match does not depend on it.)
4. FYI, no change needed: ch3 gives `star_weave_mail`, `aegis_disc`,
   `humming_blade` and one `star_stone` from the silver skeleton in the
   graveyard, and `star_iron_greatsword` in the corridor before the
   serpent-drones (pulling it wakes them), matching the order in
   `tools/solutions/sim-loadouts.json`. One `star_cell` is found in the Window
   of Years (sim-loadouts has one before e3_warden); the Warden's steal can
   add a second. `lotus_tincture` comes from Valka's sea-chest (SNAPSHOTS[4]
   has one).

## Chapter IV (ch4.js writer)

1. **Register the chapter.** `game/src/state.js`: add `'ch4'` to `CHAPTER_FILES`.
   Until then `validate.mjs` reports "ch4.js exists but is not in CHAPTER_FILES"
   (the only error ch4.js produces) and `goToLevel(4)` returns false.
2. **Recipe for the python puzzle.** `game/src/data/recipes.js`, append:
   ```js
   { a: 'purging_root', b: 'rat', result: 'stuffed_rat', consumes: ['a', 'b'],
     text: 'Toktai takes the root and the rat, and with two quick turns of his knife and a grass string the root is inside the rat and the rat has stopped complaining. Medicine, dressed as dinner.' },
   ```
   STORY ch IV step 5 ("Combine root + rat → stuffed rat"); the objective's third
   hint says "combine". Workaround in ch4.js meanwhile: talking to Toktai in
   `khm_street` with both items in the bag does the stuffing (room banter
   response with effects). It can stay after the recipe lands.
3. **`{leave:'ain'}` should return Ain's gear to the bag.** sc_twist3 runs
   `{leave:'ain'}` when Ain is drawn into the obelisk. `conditions.js` only
   filters `S.party`, so a charm Ain is wearing (ch3 places `prism_facet` and
   `seers_lens`; SNAPSHOTS[4] may equip one) vanishes with it. Please make
   `leave` move every non-null `equip` slot of the leaving member into
   `S.items` first (quietly).
4. **SNAPSHOTS[5] (optional, not key items).** ch4 places
   `amulet_of_the_hours` (Hall of Judgement, among the Guardian's offerings;
   sorcerous, so Valka or Toktai wear it) and `mummy_wrap_hood`,
   `embalmers_flail`, `asp_fang_dagger` (catacombs), `lion_tooth_charm` and
   `bow_of_kush` (Bakari, pens). SNAPSHOTS[5] already has the last five
   equipped or in the bag; suggest adding `amulet_of_the_hours: 1` to its
   `items`.
5. FYI, no change needed: ch4 reads the encounter flags exactly as in
   BATTLE_API §8 (`ch4.slavers_dead`, `ch4.bakari_freed`, `ch4.mummies_dead`,
   `ch4.scarabs_dead`, `ch4.python_dead`, `ch4.guardian_dead`) and never gives
   the writ or shackles itself (e4_slavers' onWin does). Bakari joins with
   `{guest:'bakari', level:13}` after e4_pens (the encounters already carry
   him) and leaves with `{guestLeave:'bakari'}` at the deep door, before
   e4_guardian. The twist leaves Toktai and Valka frozen and Ain out of the
   party, matching SNAPSHOTS[5]. The one-eyed armourer's shop (`khm_armourer`)
   has no `npc` (he is painted in the bazaar background) and is opened from his
   hotspot's talk/use reply and by `shop.room`.

## Chapter II (ch2.js writer)

1. **Register the chapter.** `game/src/state.js`: add `'ch2'` to `CHAPTER_FILES`
   (`['ch1', 'ch2', 'ch3', 'ch4', 'ch5']`). It is the only validator error
   ch2.js produces; until then `goToLevel(2)` returns false.
2. **e2_ortho winText duplicates the room scene.** `enemies.js`
   `ENCOUNTERS.e2_ortho.winText` is `'Black Ortho goes over the side. "This
   isn't over, red!"'`. ch2's `sc_ortho_after` (run right after the win) plays
   his fall and that line, so with the real battle UI it shows twice. Please
   change it to `'Black Ortho reels back across his stolen deck, his sabre
   gone.'`
3. **SNAPSHOTS[3] (optional, not key items).** ch2 places `croms_tooth`
   (Gallows Hill gibbet, on the way to the caves) and `ishtar_bangle` (Ortho's
   hoard, main path; sorcerous, so Ain or Valka wear it), plus `pearl`,
   `smugglers_gold_chain`, `kraken_bone_club` (grotto chest) and
   `zingaran_main_gauche` (hoard). Suggest SNAPSHOTS[3]: kord
   `charm: 'croms_tooth'`, ain `charm: 'ishtar_bangle'`.
4. **Art (nice to have).** Two NPCs have no sprite and are placed as
   hotspot-only npc things (registry entries without `sprite`, so
   `actions.view()` keeps the hotspot): Pellam the barkeep (`gal_tavern`,
   behind the counter, inn + rum shop) and Marrow the shipwright (`gal_market`,
   under his awning, gear shop). If sprites `npc/barkeep` (about 30×48) and
   `npc/shipwright` land, tell the ch2 writer (registry `sprite` + thing
   `sprite:{x,y}` instead of `hotspot`).
5. **Teal sea glow (nice to have).** STORY wants a code-drawn teal glow over
   the non-machine `sea-deck` background as the Wyrm rises. ch2 does it with
   eleven `glints` (`cond: ch2.sea_glow`) along the waterline plus teal
   `motes`. A room fx `{type:'glow', y0, y1, color, a, cond}` (a pulsing
   additive teal band) would read better; if added, ch2 will use
   `{type:'glow', y0:68, y1:104, a:0.35, cond:{flag:'ch2.sea_glow'}}`. FYI:
   `drawGlint` fills only a 17×17 box, so `r` above 8 is clipped.

## Chapter I (ch1.js writer)

1. **Typed buy / sell.** The shop is a modal only, so a typed play-through (and keyboard-only players) cannot trade. Please add to `parser.js` `dispatch('shop')`: `buy <item>` / `sell <item>` resolving the item against the current shop's stock (buy) or the bag (sell), calling `Inv.buy(entry, 1)` / `Inv.sell(shop, id, 1)` with the same toasts as the modal; bare `buy`/`shop` keeps opening the modal. ch1 works around it with dialogue choices on Oyuk (wine 5, bread 8), Ilk (sell dagger 8, sell silver cup 40, buy cudgel / iron mace / iron cap / healing draught) and the lamp-seller (oil 3).
2. **Kord's chapter banter.** `actions.js banter('kord')` always uses `DEFAULTS.kordSelf`. ch1 (and later chapters) define `banter.kord` lines. Please prefer `DB.banter[S.chapter]?.kord` (merged with `kordSelf`, plus the active objective's `party.kord` line) so "Talk to Kord" gets chapter flavour like the others.
3. **Ashkarran's diary item text.** `items.js ashkarran_diary.desc` is `'"The voice in the wires is patient." Readable.'` ch1 no longer gives the diary as an item (it is chained to the lectern prop, so no key item is left at chapter end, matching `SNAPSHOTS[2]`); the item stays only as the subject of the brass mouth's `use` reply. Optional: either remove `ashkarran_diary` from `items.js`/STORY key items, or if kept give it `look: ` the three passages (see `twr_library.diary.look` in ch1.js).
4. **Bazaar lamp-seller shop.** `main.js shopHere()` returns only the first shop whose NPC is present, so the bazaar's tray shows "Trade · Ilk" and never the lamp-seller's shop. ch1 sells the oil through the lamp-seller's dialogue (`{shop:'lamp_seller'}` is not needed). If several shops share a room, consider one Trade button per shop.
6. **Validator: catch cross-chapter id collisions.** `addChapter` merges
   `dialogues`, `scenes`, `npcs` and `shops` into one namespace, so a later
   chapter silently replaces an earlier one's entry with the same id (ch2 and
   ch4 both had `dlg_teg`; ch2's is now `dlg_gull_teg`). `validate.mjs` warns
   only for `npcs`; please make duplicate dialogue/scene/shop ids an error
   (`Object.assign(DIALOGUES, …)` at the top of validate.mjs is where they get
   merged).
5. **`goToLevel` leaves a stale dialogue mode.** If `__game.goToLevel(n)` is called while a dialogue is open, the old `runDialogue` finally-block skips its reset (epoch changed) and `R.mode` stays `'dialogue'` in the fresh game: every typed command answers "Pick one of the replies." with no choices shown. Please reset `R.mode = 'explore'; R.targeting = null; D.cancelChoice()` (as `goToRoom` does) inside `goToLevel` before `freshGame(n)`.
5. **"ring" is ambiguous in the Window of Years** (low priority). Typing
   `look ring` there asks "Which: the ring of glass or the Ring of Mitra
   (worn)?", because the parser matches the worn charm's name by partial word
   at the same rank as the room thing's exact synonym `ring`. DATA_SPEC §6
   says exact names and synonyms should win before partial matches; if the
   parser is changed to rank an exact thing synonym above a partial item-name
   match, the prompt goes away. Taps and `ring of glass` work today.
6. **A pending "Which…?" prompt survives `goToLevel` / `goToRoom`** (test
   harness, low priority). If a Which prompt is open when `__game.goToLevel(n)`
   runs, `dialogue.js`'s `pendingChoice` stays set, and every later typed
   command (even in battle) answers "Pick one of the numbered replies".
   Suggest calling `D.cancelChoice()` in `goToLevel` and `goToRoom`
   (main.js debug hook) next to `UI.closeAllModals()`.

## Done by the integration programmer (2026-10-30)

- **CHAPTER_FILES** = `['ch1', 'ch2', 'ch3', 'ch4', 'ch5']` (ch1–ch5 requests 1).
- **ch5-2** `applySnapshot` keeps `frozen` (`goToLevel(5)` starts with Toktai and Valka frozen). The `ch5.begun` workaround can stay.
- **ch5-3** `thing.tint: 'stilled'` draws a grey-blue copy of the sprite with no idle bob (scene.js), documented in ENGINE_NOTES.
- **ch5-4** End of game: `{chapterEnd:5}` sets `S.gameWon`, autosaves and shows the end screen (logo, "Here ends the chronicle of Kord of Cimmeria.", `DB.chapters[5].credits`, Return to title / Credits, `ending` music). The Credits menu lists the same credits.
- **ch5-5** A guest who joins mid-battle (the Roar fetching Bakari) is written to `S.guest = {id, level}` when the battle is settled.
- **ch5-6, ch3-2, ch2-2** winTexts changed as asked (e5_thulamon, e3_pillar, e2_ortho). Note: the plain "Victory." line is no longer printed (the victory card shows it).
- **ch5-7** parser: `shake wake nudge touch` → use; `ring bang` → hit.
- **ch5-8** key-art room backgrounds keep working (bg loading is by asset id, any kind).
- **ch4-2** recipe `purging_root + rat → stuffed_rat` added to recipes.js.
- **ch4-3** `{leave:id}` moves the member's equipped gear to the bag first.
- **ch3-3, ch4-4, ch2-3** snapshots: SNAPSHOTS[3] Kord `croms_tooth`, Ain `ishtar_bangle`; SNAPSHOTS[4] Ain `prism_facet` + `seers_lens: 1`; SNAPSHOTS[5] `amulet_of_the_hours: 1`.
- **ch2-5** room fx `{type:'glow', y0, y1, color?, a?, cond?}` exists now (pulsing additive band); ch2 may switch to it.
- **ch1 (market stocks)**: already solved in data (`stocks` hotspot while locked, `stocks_empty` prop after). The engine also supports `sprite.hideWhen: cond` (draw nothing, keep the tap box) if a similar case comes up.
- **Not done**: ch2-4 (no barkeep / shipwright sprites; art, not code).
- Asset ids: party battle sprites are `party/kord|toktai|ain|valka`, Bakari in battle `party/bakari-guest`, Valka in the duel `enemy/valka-duel` (instance name `valka-duel`), the Steward `enemy/steward`. `prop/diary` resolves to `props/diary-lectern.png` through the manifest alias. Run `node tools/build-assets-manifest.mjs` after adding art.
- Debug: `__game.fight('e3_warden')` starts any placed encounter from a resting state (tests only).
- **ch1-1** typed `buy <item>` / `sell <item>` (against every shop in the room; same toasts and coins as the modal; bare `buy`/`shop` opens the modal). Tested at gal_market.
- **ch1-2** "Talk to Kord" uses the room's `banter.kord`, then the chapter's `banter.kord` + the active objective's `party.kord` + `DEFAULTS.kordSelf`.
- **ch1-4** one `Trade · …` button per shop present (also shops with no `npc` but a matching `room`, e.g. ch4's armourer).
- **ch1-5 / ch1-6 (second)** `goToLevel` and `goToRoom` cancel a pending choice / Continue and reset `R.mode`; both also abort a battle in progress.
- **ch1-6 (first)** validate.mjs: a dialogue, scene or shop id defined in two chapter files is now an error.
- **Not done**: ch1-3 (diary item text: content/items decision, left as is).
- **Done in the final play-test** (design/PLAYTEST.md): "ring" ranking (an exact name of a thing in the room beats a carried item's synonym); the ch3 spider fight re-checked: 200/200 attempt seeds won with the SNAPSHOTS[3] gear, and every replay wins it.
- **Balance note for ch3 (FYI)**: from `goToLevel(3)` with the SNAPSHOTS[3] gear, Auto lost the graveyard spider fight once (Kord's slashing sabre vs crush-weak, slash-resistant spiders; it won on another attempt). If the chapter hints don't already point at the Kraken-bone club before that fight, consider it.
