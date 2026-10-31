# BarbarAIn — play-test log

Final whole-game play-test (2026-10-30). Tools: `node tools/replay.mjs` (unified solution replay,
real key presses / taps through playwright-core, `window.__game` only to read state, jump with
`goToLevel(n)` and ask a boss policy for its move, which is then typed).

```bash
python3 -m http.server 8123 --bind 127.0.0.1 --directory game   # in the background
node tools/replay.mjs all            # ch1 … ch5 typed scripts from goToLevel(n), 1280×800
node tools/replay.mjs ch1-touch      # taps only, iPhone 15 (393×659, pointer: coarse)
node tools/replay.mjs --continuous   # New Game on the title → ch1 … ch5 → end screen
```

## Bugs found and fixed

| # | Bug | How found | Fix | Re-verified |
|---|---|---|---|---|
| 1 | A command typed while a battle was starting (battle state up, battle input not yet hooked) went to the room parser ("Kord frowns at 'skill sunder'…") | ch1 replay: first boss command of e1_ashkarran / e1_croc rejected | parser.js: while `R.inBattle` with no battle hook, answer "(The fight is about to begin. Wait for your turn.)"; battle-ui `state().input` tells replays when the battle takes input | ch1 replay |
| 2 | Policy-driven replays had no way to ask the policy in the browser | replay runner | debug hook `__game.policyCommand(policy)` (read-only advice for the member whose turn it is) | all replays |
| 3 | ch2 script used shop-modal steps (`{buy:[…]}`) from before typed buy/sell existed | replay runner normalisation | ch2.json now types `buy <item>` / `sell <item>` | ch2 replay |
| 4 | 30 validator warnings "X names both A and B" were false positives: each pair has mutually exclusive conditions (`F(flag)` vs `NOT(F(flag))`), so the parser never sees both | validate.mjs | validate.mjs skips pairs whose conditions can never hold together (a literal required by one and negated by the other) | `node tools/validate.mjs`: 0 warnings |
| 5 | NPC ids `steward` and `thulamon` registered in both ch4 and ch5: ch5's entry silently replaced ch4's, so the chapter IV twist speaker showed as "The Steward" (no sprite) instead of "the voice of Set" | validator warning | ch4's speaker is now `voice_of_set`; ch5 reuses ch4's `thulamon` entry (synonym "stygian" merged) | validate 0 warnings; ch4 replay |
| 6 | "ring" in the Window of Years asked "Which: the ring of glass or the Ring of Mitra (worn)?" | INTEGRATION_REQUESTS ch1-5 | parser.js `resolve`: on an exact-name tie, a thing in the room beats a carried item (an explicit item preference still wins) | typed `look ring` in wyr_window |
| 7 | The first-battle tip sat on the bottom of the phone battlefield, over the party's HP bars | open item | shorter text; on phones (`#tips.below`) it sits under the picture (portrait) or over the story column (landscape) | phone screenshots |
| 8 | Toasts ("+ Cudgel", "−20 silver") swallowed taps: on the phone a tap on an Items row under a toast (even a fading one) did nothing | ch1-touch replay stuck on `item:Cudgel` (screenshot) | style.css: toasts are `pointer-events: none`; only their "Equip now" button takes taps (not while fading) | ch1-touch replay passes |
| 9 | With a physical keyboard in the portrait layout (e.g. an 800×600 window), focusing the command line hid the picture (meant for on-screen keyboards), so in battle the battlefield and its AUTO toggle vanished | DoD check at 800×600 (screenshot) | ui.js `layout()`: hide the picture for the command line only when `pointer: coarse` | DoD 800×600 38/38 |
| 10 | Chapter-end gold didn't match the next snapshot: ch2 ended with 190 (SNAPSHOTS[3] said 300), ch4 with 700 (SNAPSHOTS[5] 200) and the ch4 route never bought the Stygian Scale that SNAPSHOTS[5] has Kord wearing | ch2 / ch4 replays (gold ±25% check) | ch4.json shops at the bazaar (sell the two Atlantean coins and the scarab, buy and equip the Stygian Scale); snapshot gold set to what the scripted route really carries from chapter to chapter (SNAPSHOTS[2] 470, [3] 280, [4] 280, [5] 430; chapter III has no shop), so both the per-chapter replays and the continuous run land inside ±25% | ch2, ch3, ch4 replays |
| 11 | Any first-time tip shown during a fight (e.g. the "item" tip from the bread Oyuk shoves at Kord as Gorm's brawl starts) sat on the phone battlefield | ch1-touch battle screenshot | style.css: `body.in-battle #tips` uses the under-the-picture position too | phone screenshots |
| 12 | The shop's first-time tip covered the shop modal's title on desktop | DoD screenshot `play-dod-desktop-shop.png` | style.css: while a modal is open, tips sit at the bottom edge | screenshot |
| 13 | Landscape phone (734×343): the tray showed one row of exits, the "Trade" button was below the fold | DoD layout check + screenshot | ui.js: landscape tray cap 140 px (112 in battle) when the window is ≥ 330 px tall | DoD landscape |
| 14 | Party strip with four members overflowed on narrow strips (landscape phone): "Red Valka" ran into the "Lv 6" label | DoD landscape victory screenshot | style.css: member cards and bars may shrink (`flex: 0 1`), names ellipsize, the level label never shrinks | landscape screenshots |
| 15 | Chapter IV catacombs: the weighing-mural prop floated in front of the green serpent pillar near the ceiling | screenshot review (`play-desktop-room-pyr_catacombs.png`) | ch4.js: mural moved onto the far wall above the corridor's end (x 75, y 50) | re-shot the room |
| 16 | Tips raised before a modal opened (the "tap a glowing word" tip under the pause menu) sat over the modal's buttons | DoD screenshots, every size | ui.js/style.css: tips hide while a modal is open, except one raised by the modal itself (the shop's), which sits at the bottom edge | DoD screenshots |
| 17 | Chapter card clipped on a landscape phone ("CHAPTER I" and "tap to continue" off screen) and the opening paragraph ran past the dark panel at 800×600 | DoD screenshots | style.css: card scrolls if needed, smaller type on windows ≤ 640 px tall, a more solid panel | DoD screenshots |
| 18 | Landscape pause menu taller than the screen ("Quit to title" below the fold) | DoD screenshot | style.css: two-column pause menu in landscape | screenshot |
| 19 | Up to five stacked toasts ran over the phone party strip; the Items filter row hid "Key" at 360 px | screenshot review | ui.js: three toasts at most on phones; style.css: tighter filter tabs under 380 px | screenshots |

## Results (final run, 2026-10-30)

| Check | Result |
|---|---|
| `replay.mjs ch1` … `ch5` (typed, from `goToLevel(n)`, bosses by policy, end state vs `SNAPSHOTS[n+1]`) | 5/5 PASS, 0 battles lost (ch5 ends on the end screen with `gameWon`) |
| `replay.mjs ch1-touch` (taps only, iPhone 15, 393×659, pointer coarse) | PASS |
| `replay.mjs --continuous` (New Game on the title → ch1 … ch5 → end screen, no jumps) | PASS at 1280×800 and on the iPhone 15: 29 battles, 0 lost, every chapter hand-over matches the next snapshot, credits on the end screen, `gameWon` true |
| `dod-check.mjs` desktop / 800×600 / iPhone 15 / 734×343 / 360×640 / offline | 45/45, 38/38, 46/46, 39/39, 39/39, 2/2 |
| `validate.mjs` (and `--strict`, `--tests`) | 0 errors, 0 warnings |
| `battle-test.mjs` / `sim.mjs` (200 seeds) | 23/23 / all BALANCE §7 targets met |

Notes:
- The ch3 graveyard spiders: 200/200 attempt seeds won with the SNAPSHOTS[3] gear (also with the Kraken-bone club); every replay and both continuous runs won it first time. No balance change needed.
- Tab hiding: headless Chromium never hides a tab, so dod-check overrides `document.hidden` and fires the real `visibilitychange`; the game's handler suspends and resumes the audio context.
- Screenshots: `design/screenshots/play-desktop-*` and `play-phone-*` (every room reached, every battle, the twist scenes and the last page, the end screen), `play-dod-<size>-*` (every screen at each size). README picks in `media/screenshots/`.
- Left as is (minor): the Atlantean-galley prop in the Graveyard of Ships is a pale ship sprite standing in front of the painted wrecks; the Steward's name label touches the turn strip on the phone battlefield.

## Final review (bug hunter) fixes

| # | Problem | Fix | Re-check |
|---|---|---|---|
| 1 | Autosave between setting `ch1.road_done` and `chapterEnd(1)`: closing during the Chapter I ending left a save stuck in Chapter I | removed the forced autosave from `shz_road` onEnter (ch1.js); other chapter endings checked: none autosave between their done flag and chapterEnd | t1 repro: Continue returns to the last good autosave |
| 2 | Load / Quit to title / New Game left a pending dialogue choice alive; picking it leaked old effects and locked the new game in dialogue mode | `resetFlow()` in main.js (epoch bump, cancel choice, release Continue, close popover, reset mode) used by load, title, new game and goToLevel; epoch checks after `choose()` and `waitContinue()` in dialogue.js | t9 repro: new game shows exits, no stale replies, no leaked item |
| 3 | Same for a pending cutscene Continue after load | same fix | t7 repro: tray shows chips and exits after load |
| 4 | Audio unlocked once, on pointerdown/touchstart only | `Audio.nudge()` on pointerup/touchend/click/keydown resumes a suspended or interrupted context and restarts wanted music/ambience | code review; audio context running in all runs |
| 5 | Ambience kept playing on the game-over screen | stopped in gameOver(), restored on Try again | t3: ambience null on game over, back after |
| 6 | Failed autosave was silent | one warning toast per session | code review |
| 7 | Unreadable save loaded Chapter I | unreadable slots disabled in Load, Continue hidden for an unreadable autosave, load says it couldn't be read | dod-check corrupted-save step |
| 8 | New Game warning wording | "replaced as soon as it begins" | read |
| 9 | Picture could stay hidden after Android Back closed the keyboard | keyboard layout also needs the visual viewport to be < 80% of the tallest seen at that width | code review |

## Final review (playtester) fixes

| # | Finding | Fix | Re-check |
|---|---|---|---|
| 1 | Fleeing the Brass Sentinel left the sanctum stair open and autosaved; Ashkarran (no flee) was then met underleveled | Engine (main.js `enterRoom` / `fallBack`): fleeing a fight that starts on entering a room (onEnter or an `auto` encounter) sends the party back through the exit it came in by, and the autosave is made there; re-entering starts the fight again. With no way back (chapter-start rooms) the party stays, and a fled `auto` encounter shows as a tray button. A fled `onAction` ambush (ch5 halls) fires again on the next action. Data: progress exits are gated on winning, each with an in-voice blocked line and `blockedEffects` that restart the fight: twr_workshop up (sentinel_dead), twr_library up (cats_dead, was ungated), cav_grotto tunnel (crabs_dead, was ungated), wyr_graveyard door (spiders_dead), pyr_catacombs stair (mummies_dead), pyr_stilled stair (halls_a_dead), pyr_ascent apex (stair_a_dead). Already gated: hall mercs (key), sluice ghouls, hoard, drones, brazen (star stone), slavers (writ), python | scripted flee → back in the library; stay case → "up" restarts the fight (`fix-sentinel-flee-retreat-desktop.png`, `fix-sentinel-blocked-desktop.png`) |
| 2 | Phone dialogue replies squeezed into a 112 px strip | ui.js `layout()`: numbered replies may take up to 58% of the story+tray area (portrait and landscape); the tray scrolls back to the top for each new menu; a "▾ more" fade shows while it still scrolls; the story keeps the latest line in view | 393×659: tray 226 px, 4 of 5 replies + fade; 360×640: 215 px; 734×343: all 5 (`fix-tray-lady-*.png`) |
| 3 | Typed text in a dialogue matched any substring ("out" → "Tell me about", "n" bought bread) | parser.js `matchChoice`: numbers pick; exact text (without the price) picks; movement words and leave/bye/out/nothing/goodbye pick the reply that ends the talk (dialogue.js marks it: `next: null`, no effects) or a Leave/Nothing-type label; otherwise whole words from the start, 3+ letters, exactly one match (possessives ignored); replies that spend silver are never picked from partial text (dialogue.js marks them); else "Pick one of the numbered replies" | Lady: "out" leaves, "wh" refused, "who are" picks; all replays |
| 4 | In the command box an empty Enter did nothing and digits typed into the box | main.js: empty Enter in the box skips typing / continues / presses the highlighted reply; digits 1–9 with the box empty pick replies (or battle commands); "2⏎" picks once | scripted; ch2 replay (types "2", Enter) |
| 5 | Sentinel unfair without a blunt weapon | Toktai stops Kord once on the library's upper stair if the party has no cudgel/mace ("Hot bronze… Have you a hammer? Ilk in the bazaar sells hammers."), then the stair opens. Game over shows a hint: encounter `loseHint` (Sentinel, Ashkarran, croc, hoard, Ortho, pillar, Warden, Uzzah, Guardian, both halls bronze men, Thulamon, Steward; no twists spoiled), else a line from the enemies' weaknesses, else general advice | `fix-gameover-hint-desktop.png` |
| 6 | SFX loudness uneven; harsh typing tick | manifest.json: per-sfx `volume` from measured RMS over the non-silent part (target −18 dB, cap 3, peak-limited; miss 0.34, war-cry 0.45, puzzle 3.0, victory 1.86); audio.js already multiplied it in. Tick: sine ~900 Hz, 25 ms, low gain. Settings: "Typing sound" on/off (`SETTINGS.typingSound`) | toggle persists over reload |
| 7 | The Lady in Grey was the 9th chip, off-screen on phones | main.js: chips sorted people first, then things that appeared since entering (glowing `fresh` style), then the rest; the chip row scrolls back to the start when its first chip changes. sc_gorm_after sets `lady_here` before the line, which now reads "A [[lady|woman in grey]] sits there…" | chips after the brawl: Gorm, the Lady in Grey, Oyuk… (`fix-phone-lady-chip.png`) |
| 8 | "On the steppe we say" 71×; hub openers reprinted after every answer | 11 kept, 60 rewritten in varied Toktai voice (hints kept). Dialogue nodes take `again` (shown when the node comes round again in one conversation); hub lines for Oyuk, Gorm, the Lady, Bolo, Toktai, Hesh, Ilk, the lamp-seller, Pashtu, ch2 barkeep/Teg/pirates/Dash/Gilbo/chandler, ch4 Teg/gate captain/Uzzah/herbalist/Bakari/scale pan. Documented in DATA_SPEC §5, validated | replays |
| 9 | Tutorial: "Gorm is asking for it" but Attack aimed at a drunk; "Tap" on desktop | encounter `firstTarget: 'gorm'`; tip reworded to teach tapping an enemy. `UI.tapWords()` turns Tap→Click when the pointer isn't coarse: tips, battle tutorial lines, targeting banner, How to play, travel note, parser prompts, "Tap to begin", "tap to continue" | desktop log reads "Click an enemy…" |
| 10 | Small things | Failed flee: "…makes a run for it, and the enemy heads them off. Bad luck: it may go better next time." Companions in Items show their portrait. Speaker labels capitalised ("The Lady in Grey"). Things with a dialogue (`talk: 'dlg_…'`, the brass mouth) get Talk in their menu. Enemy target label kept below the turn-order row (the Steward on phones) | `fix-phone-items-companion.png`, `fix-phone-steward-label.png` |

Results after these fixes: `validate.mjs` 0 errors / 0 warnings; `battle-test.mjs` 23/23; `sim.mjs` all BALANCE §7 targets met; `replay.mjs` ch1 … ch5 5/5 PASS, `ch1-touch` PASS, `--continuous` (1280×800) PASS (29 battles, 0 lost, every hand-over ✓, `gameWon`); `dod-check.mjs` desktop 45/45, 800×600 38/38, iPhone 15 46/46, 734×343 39/39, 360×640 39/39. Solution files unchanged (the stricter reply matching still accepts every scripted reply).

## Final review round 2 fixes

| Problem | Fix |
|---|---|
| Effects queued behind a line still typing ran after Load / Quit to title (items, fights leaked into the loaded game or the title) | `resetFlow()` calls `UI.clearLog(true)`, which drops queued lines without resolving their promises; epoch checks after awaited text in `respond`, `runDialogue`, `runScene`. r4/r5 repros: nothing leaks |
| Room ambience played on the title screen | `showTitle()` stops ambience (r7) |
| A fled ambush could start the room's action-count ambush straight away | `counted()` skips the room's action trigger on an action whose fight was fled (r6) |
| Effects on dialogue text variants never ran (Lady's terms reprinted after every question; Toktai's "met" line unreachable) | `runDialogue` runs the chosen variant's effects |
| Try again restarted a boss at the same low HP | Try again heals the party ("The party catches its breath."); Sentinel hint mentions resting |
| Empty Enter in the command box did nothing in battle | presses the highlighted command |

Left as is (nice): typed command during a cutscene only advances it; "buying" doesn't match "I'm buying"; gold digits at 1x in 734x343 landscape; spare band under the landscape battle party strip; lower-case chip label.
