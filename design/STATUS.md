# BarbarAIn

## Request (as typed)
/gg:gamegen We want to make a modern-leaning text adventure. It should describe scenes and let you explore dungeons and fight monsters and gain levels and HP and MP and magic. They should use a range of weapons. Typical RPG elements. It should have relatively simple 16-bit style graphics depicting environments and towns people and the hero's party and enemies. It should have enough interface to be playable on desktop and mobile. It is called BarbarAIn. It should be heavily based on the world of Conan the Barbarian as depicted in the books and stories by author Robert E. Howard. It should have characters evoking those from the books and movies and they should behave "in character" when present. However, we want this to be a new story, and it should have at least three major twists and surprises, and they should make sense in the world. Anything goes -- robots from the future? time travel? pirates? trans-dimensional dragons? a heist? Sure, if you can make it fit into the world. There should be light adventure game style puzzles a la Secret of Monkey Island. It should have items and armor and weapons with a good quality of life system for managing inventory. Racing to say "done" but producing slop is a fail. It's fine to take longer to get it right. Be careful. Good luck!

## Settings
- Platform: both (desktop + mobile)
- Target: web (plain HTML/CSS/JS ES modules, no build step)
- Scope: large (implied by the request: full RPG + 3 twists + puzzles); no flag given
- Budget: $20 (default)
- Rounds: 2
- Folder: the project root (was empty apart from settings)

## Available
- OPENAI_API_KEY ok (imagegen2, anim8gen)
- GEMINI_API_KEY ok (nanogen)
- ELEVENLABS_API_KEY ok, restricted key; tier settled: PAID (128 kbps default worked) -> no credit line
- Pillow installed (13.0.0), playwright-cli ok, node ok
- Not a git repo -> no commits

## Phases
- [x] 1 Brief: design/BRIEF.md written
- [x] 2 Design: GAME_DESIGN.md (systems) + STORY.md (story bible, 5 chapters, 41 rooms)
- [x] 3 Design review: 2 rounds, 59 findings all resolved; added DATA_SPEC.md, BALANCE.md (REVIEW_LOG.md)
- [x] 4 Assets: all art + audio made, $11.57 of $20 (ASSETS.md). Asset-id mismatches to fix in code: boss/steward -> enemy/steward; party/*-battle -> party/<id>
- [x] 5 Build: engine + battle UI + 5 chapters (~100k words of data) integrated; validate 0 errors, sim green, battle-test 23/23
- [x] 6 Play-test: tools/replay.mjs all 5 chapters + ch1-touch pass; continuous New Game->end pass desktop+phone (29 battles, 0 lost); tools/dod-check.mjs all sizes pass + offline; 19 bugs fixed (PLAYTEST.md); open: galley prop pale, Steward label touches turn strip on phone
- [x] 7 Final review: 2 rounds (playtester + bug hunter each). R1: 1 must-fix (Sentinel flee skip) + save/dialogue softlocks fixed, 19 items; R2: queued-effects leak on load, Lady repeat, retry at low HP fixed. Details in PLAYTEST.md
- [x] 8 Wrap up: social card checked, README + media/screenshots, .github/workflows/pages.yml (GAME_DIR=game), game served at http://localhost:8123

## Phase 4/5 working notes
- Build order (GAME_DESIGN "Build order"): engine skeleton -> art prototype (+ budget checkpoint 1) -> battle engine + sim -> ch I content + assets -> ch I play-test (+ checkpoint 2) -> ch II-V -> polish.
- Parallel workstreams started: engine (exploration systems, UI, parser, validate), battle (engine, data, sim), art pipeline prototype, audio (all music + sfx).
- Audio done: 10 music + 36 sfx, manifest game/assets/audio/manifest.json with measured loop points; seams to listen: dungeon, finale, gallows.
- Backgrounds (42) + key art (9) done, $1.43; palette rebuilt from 6 sources. Minor: last-page serpent eyes open, pyr-stilled floor blotchy, stg-road city jade.
- Battle engine done: battle.js (pure), items/party/enemies/snapshots data, sim.mjs green (all 30 encounters), battle-test 23/23, BATTLE_API.md. Integration TODO: flag names (BATTLE_API §8) vs chapter files; adapter must pass attempt (not seed), payout via engine (drops/steals/duel XP on loss); 6 charms need placement in content; GAME_DESIGN stats section superseded by BALANCE tuning.
- Anim done ($0.29); props/icons/app icon/portraits done ($0.65).
- Engine done (exploration, UI, parser, saves, audio, validate; ch1 town playable). Now running: integration (battle UI, asset manifest, fixes) + 5 chapter writers (ch1 finish, ch2-ch5) in parallel; writers file requests in INTEGRATION_REQUESTS.md.
- All 5 chapters written and individually played through by their writers (ch1 typed + touch replays). Fixed ch4 Ain line to STORY's 'I knew. I did it anyway.' Integration (battle UI + requests) still running.

## Change 1 (2026-10-31): two alternate endings
Request: `/gg:gamegen --change add two alternate endings, one unlocked by a choice in chapter III` (own budget $20).
- [x] Design: design/ENDINGS.md (A The Long Watch = old ending; B The Hound of Hours = spare the Wyrm in ch III + "Call the hound"; C The Barbarian's Answer = "Break it"). STORY.md points to it.
- [x] Review: 1 round, Player + Builder (REVIEW_LOG.md, "Change 1"); all must/should findings applied.
- [x] Assets: 3 key art (wyrm-homeward, shattered-core, kings-tomb), $0.09.
- [x] Build: ch3 choice from rest (dlg_wyrm_fate, Sun-shard), ch4 sleeping-Wyrm variants, ch5 rest point before the core + dlg_finale + sc_hound/sc_break + epilogue/last-page variants; engine: checkpoint + ambience effects, room audio variants, endings record in settings, end screen (ending, n of 3, hints, Return to the final choice / Wyrm's heart); validate 0/0.
- [x] Play-test: ch3, ch3-spare, ch5, ch5-hound, ch5-break pass; all chapters, ch1-touch, continuous pass; dod-check all sizes pass (end screen checked).
- [x] Wrap up: README, report.

## Change 2 (2026-10-31): three side quests
Request: `/gg:gamegen --change add three optional side quests, including an arena in Shadizar` (own budget $20).
- [x] Design: design/SIDEQUESTS.md (Pit of the Maul ch I arena, Drowned Articles ch II, Jackal's Wager ch IV)
- [x] Review: 1 round, Player + Builder (REVIEW_LOG.md "Change 2"), all findings applied
- [x] Assets: bg shz-pit, pit-champion, ulla (sprite + portrait retaken), jackal (+portrait), sfx crowd-cheer: $0.30
- [x] Build: Pit (ch1), Articles (ch2), Jackal (ch4); Journal side quests + 'closed'; sim single-encounter mode; replay noEndCheck/verbose; bug-hunter review: 7 fixes; ligatures disabled (pixel font drew 'fi' as 'A')
- [x] Play-test: sq1-pit-straight, sq1-pit-dive, sq2-articles, sq3-jackal pass; all 5 chapters + ch1-touch + continuous + endings pass; dod-check 52/45/53/46/46; validate 0/0; battle-test 23/23. Sim: e5_thulamon median 5 rounds vs target 6-10 (pre-existing, unchanged by these changes)
- [x] Wrap up: README + screenshots (desktop-pit, phone-journal-side-quest), report
