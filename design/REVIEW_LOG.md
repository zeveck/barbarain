# Design review log

## Round 1
Reviewers: Player (10 findings), Builder (10), Art and sound director (10). Raw findings: `review-round1-findings.md`.
Must-fix: twist 3 logic (consent vs "knock", dead Wyrm still talking, no ship home); no content data format/validator; scripts+Auto can't prove bosses; no balance numbers; pixelize won't unify tools; teal motif would drown in sea art.
Refiner outcome: all 30 fixed (none rejected). Highlights: one will-based key rule stated 3x before ch IV, Wyrm = body / core under pyramid; ch I economy (Cudgel 20, tower gold, Horned Helm gift), escape merged into one croc fight; ch V solo fixes (maul from frozen guards, Ain breaks through, heal between bosses, Bakari guest); only the scale puzzle still uses Ain (3 clues); new DATA_SPEC.md + BALANCE.md + tools/validate.mjs + tools/sim.mjs; battle verbs in parser, Auto with boss hints, state() expanded, chapter snapshots as data; master palette with machine-only teal band; one 48px human scale; props as sprites; sheets; music loop table; budget ~$14.9 (worst ~$16.8) with checkpoint; build order ch I first.
Unresolved (to measure): imagegen2 price, nanogen price conflict, sheet slicing consistency, balance needs sim.
Decision: must-fix findings existed -> run round 2.

## Round 2
Reviewers: Player (9), Builder (10), Art and sound director (10). Raw: `review-round2-findings.md`.
Must-fix: ch III over-explained twist 3 (trap visible); no MOVES table / open `when` vocabulary; XP per enemy indivisible + multi-tier ids; scripted boss commands undefined.
Refiner outcome: all 29 fixed, none rejected. Twist 3 rebuilt (record says only "cannot be compelled, copied or forged"; Ain half-suspects; serpent seizes Kord and Ain reaches in to save him: key turns by will; ending "I do not want it any more"); XP/gold per encounter, T = real level in solution order, party-size factor, Ashkarran caged-stone heal, inns, Stillness 3/7/11 vs Eye 5/10/15, Gorm's 10 silver; DATA_SPEC: MOVES, closed when-vocabulary, hooks/auras, RPG schemas, input rules; boss priority policies (>=99%/200 seeds + fixed-seed win); phone budgets for 393x659 / 734x343 / 360x640, picture never <1x, integer canvas backing; one-pass pixelize, component slicing, machine-only sheet, new props/glints/sfx/portraits, loopfind; budget plan $15.63, worst $22.72 -> pre-committed cuts to ~$18.9, checkpoint at build step 2.
Decision: rounds limit (2) reached; remaining risks are measurement items (imagegen2 price, sim balance) handled in build.

## Change 1: alternate endings (2026-10-31), one round

Reviewers: Player, Builder (the art was 3 key-art images through the existing pipeline; no art director needed). I refined it myself.

| # | Finding | Sev | Outcome |
|---|---|---|---|
| P1 / B3 | sc_resolution has Ain promise to "sit with" the Steward before the choice | must | Fixed: those two lines moved into sc_farewell (A); the resolution now ends with the Steward falling asleep |
| P2 | Players can't get back to the choices | must | Fixed: checkpoint saves at rest before each choice (cp_wyrm, cp_core); the end screen offers "Return to the final choice" and "Return to the Wyrm's heart"; hints for endings not found |
| P3 | B has no cost and no keeper | must | Fixed: the hound lies down beside the core at the far end, and Ain admits it is a wager ("I would be choosing you over certainty"); the loop wording in B's last page is kept vague ("build it around the strangest thing they ever found") |
| P4 | The ch III choice is a morality quiz | should | Fixed: Valka's real argument (it made her crew thralls; slavers are built too); Ain is unsure the leash will stay cut; Toktai warns that a hound whose master lives does not stay masterless; the killed path gives the Sun-shard charm |
| P5 / B8 | Ch IV lines assume a dead Wyrm | should | Fixed: desc, short, shout, Ain banter, Wyrm look/talk/hit/use, Shrike look (planks from the hold's wrecks), sailor look, opening scene; the Shrike sails out through the open jaws; a slow teal glint on the sleeping eye |
| P6 | C needs a Kord beat; "forever" contradicts the loop; "Not yet" twice | should | Fixed: "Crom. Shut your eyes, stone." / "I have no eyes... There. They are shut."; the confirmation is "Strike." / "Hold."; C's last page says "Nothing sleeps at the far end of the River now" |
| P7 | Toktai hands the player B | nice | Fixed: Kord thinks of it ("The dog. Can it swim that river?"); options fixed A, B, C |
| P8 | C's narrator needs to explain what it never saw | nice | Fixed: "The rest Kord told me, every night..." |
| B1 | The obelisk shares 'core'/'stone' and its hotspot | must | Fixed: obelisk cond NOT steward_dead, core cond steward_dead; 'core' removed from the obelisk's names |
| B2 | B can't be replayed from a spared ch III | must | Fixed: goToLevel(n, {flags}), solution fields base/from/flags/endFlags, refused replies fail the run; new replays ch3-spare, ch5-hound, ch5-break |
| B4 | The ending scenes shouldn't run inside the dialogue | should | Fixed: both dialogues only set a flag; the caller runs the scenes, the chapter end and the goto (ch2 dlg_sail pattern) |
| B5 | On reload: music, ambience, stale texts | should | Fixed: room music/ambience variants [{cond,id}] in the engine (ending music and the crowd loop once the Stillness ends) plus an `ambience` effect; shout, say ain, braziers and core texts have steward_dead variants |
| B6 | Snapshots, validate and the unread flag | should | Fixed: no wyrm_killed flag (kill = ch3.fate_burn, read by the chain); sun_shard added to snapshots 4 and 5; validate knows the checkpoint/ambience effects and the audio variants; ch5_choice has party lines |
| B7 | End screen overflow on phones; dod-check never visits it | should | Fixed: margin:auto centring, inline credits hidden under 600px height (the Credits button stays); dod-check now plays to the end screen at every size |
| B8 | SETTINGS.endings repair; sc_collapse in B | nice | Fixed: default {} plus a repair like tips; the ending is recorded in chapterEnd (old saves count as watch); a B line in sc_collapse (Kord runs with a hand over the stone) |

## Change 2: side quests (2026-10-31), one round

Reviewers: Player, Builder. I refined it myself in design/SIDEQUESTS.md.

| Finding | Sev | Outcome |
|---|---|---|
| P1: Ain doesn't exist before the tower, but the Pit design used it | must | Ain is removed from the Pit; the no-sorcery rule became "one fighter on the sand"; Toktai comments from the benches |
| P2: The dive was strictly better | must | The dive pays 60 and Hrolf refuses Kord forever (no Torc); the straight fight pays 40 + Torc; Gorm and Toktai react |
| P3 / B4: Arena power and pay broke chapter I; solo stats undefined; sim can't test optional fights | must | Bouts tuned for solo Kord at level 2→3, XP 80 in all, pay 60–100; per-bout mults; new single-encounter sim mode |
| P4: The "restore the vote" premise clashes with existing Articles lore | should | The originals are a relic that shames Ortho's rewritten copy; the hook needs gilbo_passed |
| P5 / B7: The chandler is out of character; the feather charm cost is hidden; nest texts; order of events | should | Marrow wants a figurehead plume, the trade says the charm goes, and 60 silver is accepted instead; nest variants after the hook whenever the gull died; recipes a+b then +c |
| P6: The loaded dice gag | nice | The grotto's loaded dice become a key item; Toktai swaps them in; works in either order |
| P7: Ain glowing in Khemi breaks the disguise | should | Removed; Valka is the distraction; Ain refuses from its pouch |
| P8 / B3: Lock points inconsistent and unannounced | should | Locks are flags (ain_joined, sail_now, guardian_dead); in-world warnings; Journal "Lost to time" |
| B1: A lost optional bout leads to an inescapable game over | must | onLose: heal + Ulla line; pay only in onWin; next bout gated on onWin flags |
| B2: No way to lose in the third exchange | must | The dive is a narrated scene, not a battle |
| B5: Journal and validate have no side or closed support | should | side grouping + closed state in ui.js and validate |
| B6: Unsupported charm stats | must | Earring Evasion +6% / Crit +4%; Ring AGI +4 / Crit +5% |
| B8: Replays can't skip the chapter-end check | should | noEndCheck option |

## Polish pass (after first publish, 2026-10-31)

Owner found the tagline's lone "seems.", "[object HTMLElement]" in Credits and a flicker as the title loads. Fixed, then a fresh visual reviewer went through every screen at five sizes, and the screen checker gained text checks (junk text, lone last words, clipped text) that run on every screen it visits.

| Finding | Outcome |
|---|---|
| Tagline wrap; lone last words across headings, labels and text (35 found) | `text-wrap: balance` / `pretty` game-wide, names kept together: 0 left |
| Credits showed `[object HTMLElement]` | `el()` flattens nested children fully; checker opens Credits at every size |
| Title flicker (stand-in fonts, art popping in, button label swap) | Fonts and art preloaded; title fades in once ready; button keeps its space |
| Pop-up notes pile up and cover each other / tips / fighters | Same-kind notes merge; notes stack under a tip; battle notes go under the battlefield on phones; story tips hidden under phone panels |
| Credits table cramped on phones; credits shown three times at the end | Stacks on narrow screens; end screen keeps only the Credits button; fonts listed once |
| Settings "Instant" cut off at 360 wide | Rows wrap; controls never clip |
| Sideways title menu / game over ran off screen | Short-screen layout: two-column menu, smaller logo, scrollable |
| Map names spilled out of boxes; map tiny on phones | Names wrap or squeeze inside boxes; map scrolls instead of shrinking |
| Top-bar room name cut to "The S…" | Shrinks, then two lines, then hidden; party strip uses short names |
| Battle name labels tiny, spaces lost | At least 11 px on screen, word spacing added |
| Mixed emoji and symbols in top bar and tabs; blank keyboard icon | One set of gold line icons |
| Exit "more" hint over button text | Taller, more opaque fade |
| Naming: item case, "Marrow the Shipwright", lower-case menu headings | Item names in title case; one spelling; headings capitalised |
| Journal: "wager. (lost to time)", faint lock line, struck-through goals | "…: lost to time"; lock line readable; done goals marked ✦ without strike-through |
| Chapter card hard-edged panel, dim prompt | Panel fades at its edges; prompt brighter |
| Chapter V hall floor washed out | Floor darkened toward the bottom (original kept in .gamegen/candidates/bg) |
| Small: Settings note, "A" slot, stacked Save over Pause, Toktai narration in quotes, "Things here", Saga button, no How to play on title | All fixed |
| Companions listed under Items › Key | Kept: by design (they are "carried" for use-on puzzles) |
| Battle log "The Drunk B…" then "The drunk…" | Kept: minor |
