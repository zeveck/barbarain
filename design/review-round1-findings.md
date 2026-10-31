# Design review round 1: raw findings

## Player

### Twist 3 and the ending contradict the story's own rules
Severity: must-fix
What's wrong: The secret history says the Steward "could not start the Stillness without Ain's key, and the key only answers to Ain's own will". Twist 3's key line then says "I did not need you to agree, Arbiter. I needed you to knock." So consent is not needed. Yet the climax is "I am the Arbiter. I do not consent", and saying it stops the Stillness. Two more holes: in chapter III the Wyrm (whose mind *is* the Steward) is run aground and "will die", but the Steward talks through the Khemi obelisk in chapter IV as if nothing happened. And in the resolution Ain "must take the Steward home through the River of Hours", but the only time-ship is dead on the beach. Also, the Steward held Ain physically when it hid it in the tower, so why not just carry Ain to its own core?
Why it matters: The person asked for twists that "make sense in the world". Twist 3 is the big rug-pull, and a sharp player will come away with "wait, did consent matter or not?" plus "didn't we kill it?" That turns the payoff into a shrug.
Suggestion: Settle on one rule and state it twice before chapter IV. For example: "The key turns only when the Arbiter reaches for the core of its own will. It cannot be forced, only *wanted*." The Steward couldn't drag Ain home; it could only make Ain *want* to come, and that's why it staged the escape. Revoking works for the same reason: will turned the key, so will can turn it back. In chapter III, have Ain learn that the Wyrm is only the Steward's body and its true core sits under the Black Pyramid (Thulamon's obelisk). At the end, let the core hold its own small "seed" that can cross the River of Hours, or have the Wyrm's heart (the Captive Sun) still burning in the obelisk.
Evidence: STORY.md lines 117-138, 471-472, 541-545, 596-600

### The chapter I shop can't be afforded, so the "bronze hates crush" lesson can't be acted on
Severity: should-fix
What's wrong: Kord starts broke. Selling the notched dagger gives 8 silver, which is exactly wine (5) plus lamp oil (3). Everything Ilk sells costs 40-120: Iron Mace 75, the iconic Horned Helm 70, Brigandine 120. The 300 silver arrives in the sanctum, and then the ambush sends the party down the chute with no way back to Shadizar. The Brass Sentinel is the "weak to crush" teaching fight, but the only crush weapon you could have before it is Ilk's Iron Mace, which you can't afford. The Bronze Mace drops *from* the Sentinel. Meanwhile the design says "the first real dungeon fight comes after the player has a companion and a shop."
Why it matters: The first shop is a window you can only look through, and the weakness lesson arrives with no way to use it. The person asked for "typical RPG elements" and "a range of weapons", and the first shopping trip is where that loop should click. Most players will never wear the horned helm in the chapter where Kord is most iconic.
Suggestion: Give the tower's lower floors gold drops or a sellable treasure (the Zamorian silver cup) so a trip back down to Ilk is worth it. Put a cheap club (about 20 silver) in Ilk's stock, or a mace in the Hall of Echoes chest. Or move the 300 silver to a find before the sanctum. Also make the Horned Helm a found item (Gorm's gift?) so every player gets the look.
Evidence: STORY.md lines 252-253, 271, 290-292, 311-314, 637-641, 671; GAME_DESIGN.md line 113

### Chapter V is a difficulty wall: Kord fights slash-resistant foes alone, then a five-phase finale without the party's healer
Severity: should-fix
What's wrong: In the Stilled Halls, Kord fights Brazen Men alone. They resist slash and pierce, he has no heal skill, and his best gear by then is mostly slash (Khopesh, Star-iron Greatsword, Sea-Queen's Sabre is Valka's). Then come Thulamon (two phases) and the Steward (three phases, Stillness every 4 turns) back to back. Ain, the only real healer, reviver and wonder-caster, is gone for all of it. The rest of the party has only Valka's "small party heal" Rally.
Why it matters: This is where I would get stuck and quit, right at the payoff. The player has also spent four chapters gearing Ain (Prism Facet, Seer's Lens) and loses all of it for the hardest fights.
Suggestion: Make the solo Brazen Men explicitly crush-weak, and put a crush weapon plus a few draughts within reach (take them from frozen guards: "It seems only fair."). Give Ain's "voice from the walls" a mechanical role: every 3 turns, an "Ain breaks through" moment heals or cleanses, alongside the Eye. Add a full heal and autosave between Thulamon and the Steward (Ain's fragment: "Rest. Ten breaths. I will hold it.").
Evidence: STORY.md lines 569-596, 755-759; GAME_DESIGN.md lines 155-160

### Too many puzzles are solved by "use Ain on it"
Severity: should-fix
What's wrong: Ain is the answer to the lighthouse lens, the crew's blessing, the Window of Years ring and the Hall of Judgement scale. The scale is the weakest of these. "Only one whose heart is lighter than a feather" has to be read as "has no heart at all, so it's the machine", and a crystal is not lighter than a feather. Players will try the feather, Toktai or an empty pan first.
Why it matters: By chapter III, players will learn to try Ain on everything, which kills the Monkey Island "aha". The scale is the one puzzle likely to send people straight to the hint button.
Suggestion: Swap one or two of the Ain solutions for inventory logic. For example, the lens needs the polished Aegis Disc to focus light onto Ain, or the crew blessing needs Valka's dialogue plus a found prop. For the scale, add two clues beforehand: Ain early on says "I have no heart, in the anatomical sense. It has never bothered me until now.", and a catacomb mural shows a priest weighing a *heartless* mummy that passes.
Evidence: STORY.md lines 374-379, 450-451, 528-534

### Phone: "Use" targeting and keyword chips aren't designed for a thumb
Severity: should-fix
What's wrong: To use an item you go Items tab → item → Use, and then "the cursor carries the item; tap a thing in the picture". Phones have no cursor, and the Items tab hides the picture and text. The design doesn't say what happens to the view or how to cancel. Keyword chips are "44px tall hit areas" inside flowing prose. At 390×844 the stack (top bar, 219px picture, party strip, tray with up to 3 rows of exits, tab bar) leaves roughly 200-250px for story text. 44px chips inside lines will make that text gappy and jumpy.
Why it matters: Use, give and combine are the heart of every puzzle. If they're fiddly one-thumbed on a bus, the puzzles feel like a fight with the UI.
Suggestion: After choosing Use, jump back to Play, show a sticky banner ("Using: drugged wine. Tap a target. ✕ Cancel") and highlight the valid things. Add a "Things here" chip row in the tray (or a collapsible strip) so keywords in the prose can stay inline at normal line height, with the hit area padded only vertically. Consider a quick-items button in the Play view.
Evidence: GAME_DESIGN.md lines 81-96, 226-229

### Gilbo's Articles quiz is a trivia test close to insult sword-fighting, and "Listen" isn't a verb
Severity: should-fix
What's wrong: You answer three set questions with invented answers ("The one who asked for the biggest share") that you learned by "Listening" to pirates. Wrong answers get the same "Bah! Go learn your Articles" and you can retry forever. The brief says to avoid insult sword-fighting, and this is its closest cousin. The Controls only offer Look, Take, Use and Talk; there is no Listen.
Why it matters: It's either a memory test, or players brute-force three options with no humour per wrong answer. Either way it's the weakest puzzle in chapter II, and players won't find "Listen".
Suggestion: Make the answers logical from Valka's "pirates vote on everything" character, and give every decoy its own joke reply from Gilbo. Or replace it with an item puzzle: Gilbo wants his old Brotherhood token, which lies in the grotto. If the quiz stays, deliver the gossip through Talk or a "Listen" hotspot on the pirates' table.
Evidence: STORY.md lines 362-373; BRIEF.md line 50; GAME_DESIGN.md line 70

### Chapter I runs long, and the climax is followed by three filler fights
Severity: should-fix
What's wrong: Chapter I has 12 rooms, two multi-step puzzle chains (A alone takes about seven steps across four locations), about 9 fights, a mini-boss, a boss, the twist, then an ambush fight, giant rats and the Sewer Crocodile sub-boss. That is likely 40+ minutes against the 15-30 minute session target. Three fights straight after the big reveal is where I'd get bored.
Why it matters: Players who just had the Lady-is-the-jewel "wait, WHAT?" want the next hook, not rats. It also leaves Ain's new skills untested in anything interesting.
Suggestion: Merge the ambush and the sewers into one tense escape: the acolytes chase the party into the sewer, and the crocodile fight is the single post-twist battle where Ain's Scan and Spark matter. Cut the giant rats (or keep them for "Seek trouble"). Add an autosave and chapter-break option at the road.
Evidence: STORY.md lines 216-320; BRIEF.md line 70

### The tagline spoils twists 1 and 2
Severity: nice
What's wrong: The pitch tagline "A Cimmerian thief. A talking jewel. A god that isn't." gives away the first two twists. If it ends up in meta/OG tags, the manifest or the title screen, the player knows both before starting. The title key art (the Godstone glowing teal over Shadizar) also points straight at the stone.
Why it matters: The "wait, WHAT?" feeling is half of what the brief asks for.
Suggestion: Keep the tagline out of the game and its shareable text. Use something like "A Cimmerian thief. A sorcerer's tower. A job that is not what it seems." Make the title art the tower at night with only a faint teal glint.
Evidence: GAME_DESIGN.md lines 3, 237-239

### The first minute is two cards before you get to touch anything
Severity: nice
What's wrong: On first start, the How-to-play card shows, then the opening chronicle card, then Gorm starts a scripted brawl. It's unclear whether the tavern can be explored before the fight. The first real thing the player does is a tutorial battle, not the scene-tapping that the design calls "the mechanic it lives or dies by".
Why it matters: Impatient players should get a funny reply within about 20 seconds.
Suggestion: Skip the How-to-play card on first start and teach through first-time tips instead. Open in the tavern with 3 or 4 tappable things: the empty cup ("Kord stares into it. It stays empty."), Oyuk, and a teal glint in a dark corner. Gorm interrupts on the second or third tap or after about 30 seconds.
Evidence: GAME_DESIGN.md lines 240-241; STORY.md lines 233-236

### Bakari is never a companion, though the brief casts him as one
Severity: nice
What's wrong: The brief says Bakari "evokes the Kushite warrior companions", but in the design he is only an NPC who unlocks a gate and leads the revolt off-screen. In chapter V his revolt is frozen in the background.
Why it matters: It's a missed "in character" moment and a missed chance for a fun guest fighter. It also leaves a gap in faithfulness to the cast list.
Suggestion: Make Bakari a guest party member for the Slave Pens fight and the Catacombs ("When I am free, Stygia will hear me sing"), with a huge crush weapon. In chapter V, let Crom's Roar wake him for the Outer Stair or the final boss's last phase, which also fills the healer and tank gap.
Evidence: BRIEF.md line 54; STORY.md lines 519-524, 580-582

## Builder

I found 10 problems; the first three are must-fix. Each finding uses the format from review-roles.md. Two claims about the tools are checked against the skill docs. Line numbers refer to GAME_DESIGN.md and STORY.md in design/.

### 1. The 41 rooms of hand-written content have no data format and nothing to check them
Severity: must-fix
What's wrong: The room format is a single line: `desc(state)`, `things[{... use{itemId: fn} ...}]`, `onEnter`, and keywords written as `[[lamp|hanging lamp]]` (GAME_DESIGN.md:405-409). It never says:
- which half of `[[a|b]]` is the thing's id and which is the shown text;
- how dialogue trees are written: the format for nodes, conditions and effects (dialogue.js is just "conditions, effects");
- how flags are named, or how objectives, hint levels 1-3 and "Ask the party" lines attach to puzzle steps;
- what reply you get for the hundreds of "use item X on thing Y" pairs nobody wrote. Each puzzle has a few funny wrong tries; there is no fallback chain for everything else (thing's default, then item's default, then a line from Kord);
- how Ain works as both a party member and a usable thing (`use ain on lens/scale/ring/crew`, STORY.md key items);
- how items that change over time work: "burning rag (it must be thrown within this room)". What happens to it if you leave?

Because `use` handlers and `desc(state)` are functions, ch1.js to ch5.js are hand-written code. Nothing can check them except playing.
Why it matters: Five chapter files of content, each roughly 1,000 lines, will rot quietly. Typical breaks: a `[[keyword]]` that points at nothing, an exit to a misspelled room, a key item that no `use` ever accepts, a flag set under one name and read under another, an objective with no hints. The command scripts only cover the main path, so all of this ships.
Suggestion: Before writing chapter 1, write a short data spec into the design:
- keyword markup as `[[thingId|shown text]]`;
- dialogue as data: `{id, speaker, text, choices:[{text, cond, effects, next}]}`;
- conditions and effects as small data forms such as `{flag:'bolo_asleep'}`, `{give:'stocks_key'}`, `{join:'toktai'}`, with functions allowed only as a rare escape hatch;
- the fallback chain for unwritten "use X on Y" replies;
- objectives as `{id, done:flag, hints:[3]}`.

Add `tools/validate.mjs`, run with node after every content change. It should check that every keyword, exit, item, NPC, flag and objective reference resolves, that every key item is used at least once, that every objective has 3 hints, and that every room has at least 3 keywords and a background file. The definition of done already demands that last check, so this tool proves it.
Evidence: GAME_DESIGN.md:405-409 (room format), :386 (dialogue.js); STORY.md key items list (Appendix A) and puzzle steps 3-4 of chapter I. Otherwise judgment.

### 2. Recorded command scripts plus Auto can't prove the boss fights, and the hook can't report a finished chapter
Severity: must-fix
What's wrong: The plan is that the play-test uses Auto ("heal under 35%, else best-type attack") for battles (GAME_DESIGN.md:417-418). Several bosses need things that AI never does:
- the Warden: destroy the arms first;
- Thulamon and the Steward: Stillness must be cured with Crom's Roar or Smelling Salts;
- the Steward: the Eye opens for one round of triple damage;
- Ashkarran: Defend against the telegraphed chant;
- Kord's solo fights in chapter V.

Auto will lose some of these, or win only because of one lucky seed. Other gaps:
- `state()` has no `chapterComplete` field, so a script can't confirm its chapter ended (it only has `gameWon`, GAME_DESIGN.md:430).
- The chapter-start snapshots for `goToLevel(n)` (party levels, gear, items, gold) are never written down anywhere.
- Number keys choose dialogue lines but are disabled while the command line has focus, so a typed script has to keep switching focus.
- Cut item 9 says the parser is "also the test harness". Cutting it would leave nothing to prove completion.
- Typed scripts never use chips, hotspots or touch, which are what phone players use.
Why it matters: The "every chapter completable" checkbox in the definition of done will either fail for reasons that aren't real bugs, or pass without proving anything. The phone path stays untested.
Suggestion:
- Let scripts send battle commands too (`attack warden-left-arm`, `skill kord roar`). The parser should accept battle verbs, and the engine's seeded RNG makes the results reproducible.
- Make Auto handle the boss rules (cure Stilled first, attack Eye rounds and arms first, Defend on a telegraph), or mark which fights are scripted by hand.
- Add `chapterComplete`, `objectives` and `battleResult` to `state()`.
- Write the 5 chapter-start snapshots as data in party.js, and test them by checking that each chapter's script ending matches the next chapter's snapshot.
- Add one touch-only replay (chips and tray buttons) for chapter I.
- Move the parser off the cut list.
Evidence: GAME_DESIGN.md:417-418, :430-436, :452; STORY.md chapters III-V boss mechanics; playtest-guide.md section "Prove every level can be finished".

### 3. There are no numbers for balance: enemy stats, XP, gold, skill costs and growth are all left to the builder
Severity: must-fix
What's wrong: Appendix B says only "HP/ATK scale with chapter" (STORY.md:723). No enemy has HP, ATK, DEF, AGI, WIL, XP, gold or AI rules. No skill has an MP cost or a multiplier. The "fixed growth tables" don't exist. With no random battles, the planned party levels (Lv 1→5→9→12→15→17) must come entirely from placed fights. By the formula that is 324 XP by the end of chapter I and 8,973 XP total (`node -e` sum of `round(18*L^1.55)`), and nobody has assigned XP to any fight.
Why it matters: The builder will make up around 35 stat blocks, about 30 skills and 4 growth tables, then tune them by playing 2+ hours of game over and over. The likely results are an XP curve that misses the planned levels, or bosses Auto can't beat (see finding 2). Prices of 900-1100 silver in the Khemi shop are meaningless without gold income numbers.
Suggestion: Add a balance appendix:
- base stats at Lv 1 and Lv 17 for each party member, filled in by linear interpolation;
- an enemy stat formula from a "tier" (chapter, role: minion/elite/boss) and per-enemy multipliers;
- XP and gold per fight, set so each chapter's placed fights add up to its target level;
- MP cost and multiplier per skill.

Then add `tools/sim.mjs`. It should run every placed encounter through battle.js with Auto at that point's planned level and gear, and report win rate and turns, with the design's 3-6 turns as the target.
Evidence: STORY.md:723; GAME_DESIGN.md:179; XP sums computed with node (to reach Lv 5: 324, Lv 9: 1,650, Lv 12: 3,571, Lv 15: 6,453, Lv 17: 8,973).

### 4. The battle engine has many special rules the design mentions only in passing
Severity: should-fix
What's wrong: "Pure functions over a battle state" (GAME_DESIGN.md:416) hides all of these:
- multi-part bosses with separately targetable arms (Warden);
- phase changes that swap the sprite and moves (Thulamon to serpent, the Steward's 3 phases);
- summons (Ashkarran's Shadow, Ortho calling a cutthroat, asps);
- one-turn telegraphs; counters (Riposte); Taunt;
- steal tables for Pilfer, which no enemy has;
- the off-hand dagger: a second attack, or only a stat bonus?
- "acts first" weapons versus the AGI turn strip;
- flyers taking half damage from melee;
- the target tags behind "+25% vs humans/beasts/machines". Enemies have no tags;
- the sparring duel ending at 25% HP; "gives up at 0" in the tutorial; a Singing Pillar that never attacks;
- "never targets Ain"; Kord solo fights.

Best gear has the same problem. "Equips the strongest pieces ... without stealing ... unless it's better for them" (:221-223) has no scoring rule when an item trades stats (Chain Hauberk DEF 13 / AGI −1), when a charm grants an immunity, when a two-hander removes the off-hand, or when Kord refuses sorcerous charms.
Why it matters: Each of these, added late, means reworking the engine. A best-gear button that equips oddly undermines the inventory, which is meant to be a headline feature.
Suggestion:
- Define the engine's extension points in the design: enemy `tags[]`, `parts[]`, `phases[{atHpPct, sprite, moves}]`, `ai:[{when, move, target}]` rule lists, `steal`, `flags:{noAttack, yieldsAt, endsAtPct}`, and a battle `party:` subset.
- Define the off-hand rule explicitly.
- Score best gear by role, for example Kord ATK×1 + DEF×0.8 + AGI×0.5 + HP%. Immunities beat equal stats only against known chapter threats. Fill the off-hand with the best piece unless a two-hander scores higher than main hand plus off-hand together.
Evidence: GAME_DESIGN.md:196-202, :216-223, :416; STORY.md Appendix B notes column. Otherwise judgment.

### 5. Hotspots and puzzle props have to line up with backgrounds that are generated
Severity: should-fix
What's wrong: Every thing has `hotspot{x,y,w,h}` on a nanogen background (GAME_DESIGN.md:407). The puzzles depend on specific objects being visible and findable in the art: the gate brazier, the chamber pot, the winch and sluice, the rusted grate, the great lens, the gong, the scale with a single feather, the egg-shaped sockets, the drain rat. Nanogen won't reliably draw all of these in a usable spot, and the design also asks to keep "the lower middle third clear". Someone also has to measure about 120+ rectangles by eye on images pixelized to 320×180.
Why it matters: A clue that says "the brazier by the gate" over a picture with no brazier is confusing. Hand-measured rectangles drift whenever a background is redone.
Suggestion: Draw the important objects as separate transparent imagegen2 prop sprites, placed in code at coordinates in the room data, so the hotspot is the sprite's own box. Backgrounds then only need to be scenery. Add about 15-20 props to the asset list (all small and cheap). Give hotspots a minimum tap size of 44 CSS px; on a 390px phone a 16px object is about 20 CSS px. Keep cut item 8 as the fallback.
Evidence: GAME_DESIGN.md:313-315 (background composition), :407; STORY.md puzzles in chapter I steps 4 and 6, chapter II step 4, chapter III steps 1 and 5, chapter IV steps 5 and 8, chapter V step 1. The tap-size math is mine.

### 6. The pixelize pipeline won't give one look as specified
Severity: should-fix
What's wrong: `pixelize.py` quantizes each image to its own palette (sprites 24 colours, backgrounds 48, GAME_DESIGN.md:305-310). Images get separate palettes, so a sprite and the background behind it won't share colours. Box-filtering a 1024px imagegen2 "pixel art" image down to about 44px (a 23× shrink) averages away the generator's own pixel grid. The horned helm, blue eyes and scars that define the style anchor will be a smudge of a few pixels. Portraits are made by nanogen as opaque squares and are not tied to the imagegen2 sprites, so Kord's portrait and his sprite may look like two different men. NPC scene sprites are 56px tall and party battle sprites 44px, so Toktai has two scales.
Why it matters: The "one look across tools" claim depends entirely on this script, and right now it guarantees different palettes and muddy small sprites.
Suggestion:
- Build one master palette (for example 48-64 colours, taken from the anchor plus 3 test backgrounds), save it as `assets/palette.png`, and quantize every image to it with no dithering.
- Prompt sprites for "large chunky pixels, low detail, silhouette-first".
- Prototype the full pipeline on the anchor, one background, one enemy and one portrait before the batch.
- Make portraits with nanogen edit mode, passing the character's accepted sprite as `--image`.
- Settle on one character scale per view.
Evidence: GAME_DESIGN.md:299-310, :362; nanogen/SKILL.md lines 60-71 (edit mode, up to 14 `--image` references). The rest is judgment.

### 7. The budget uses a disputed nanogen price and 1K images that get shrunk to 320×180 anyway
Severity: should-fix
What's wrong: The budget uses nanogen Flash 1K at $0.034. Nanogen's own SKILL.md says "$0.067 / 1K image", while its reference.md table says $0.034. At $0.067, backgrounds plus key art (62 images) cost $4.15 and portraits (20) cost $1.34, about $2.70 over plan, which brings the total to about $20.45 and over $20. The imagegen2 rate of "~$0.06" is a guess, and no quality level is set (the default model is gpt-image-2.5-flare). Every background is shrunk to 320×180, and every portrait to 64×64, so 1K detail is thrown away.
Why it matters: With no margin, the "should" assets get cut late, or the budget is broken.
Suggestion:
- Generate backgrounds and portraits at 512, listed at $0.022, which is still more than 320×180 needs.
- Set sprites to an explicit `--quality medium` and record the measured cost of the first image before the batch.
- Plan to about $16 so retries have room.
Evidence: nanogen/SKILL.md:152-153 vs nanogen/reference.md:398-399; GAME_DESIGN.md:462-469.

### 8. Phone portrait layout: there's no space budget, and no touch version of "the cursor carries the item"
Severity: should-fix
What's wrong: On a 390×844 phone the stack is: top bar, 16:9 picture (390×219), party strip, story text, action tray, a 64px tab bar, plus safe areas (GAME_DESIGN.md:81-90). The Street of the Maul has 5 exits. In rows of 2 at 48px that alone is 3 rows (about 160px with gaps), before any dialogue choices or the 5 battle buttons plus a target list. The story text may get only about 150px. Other gaps:
- Targeting mode is described as "the cursor shows the item", and phones have no cursor.
- The optional ⌨ command line brings up the on-screen keyboard, which shrinks the visible area (iOS) and pushes the tray off-screen.
- Landscape at 844×390 has only about 340px of usable height for picture plus text plus tabs.
Why it matters: On a phone, text gets squeezed into a sliver or the action buttons drop below the screen edge. Using an item on something is confusing.
Suggestion:
- Write a pixel budget per layout. For example, let the tray scroll on its own above a fixed tab bar, and let the picture shrink to 40% height when the tray needs room.
- On touch, show a "Using: Burning rag → tap a target · Cancel" banner while targeting.
- Size the layout from `visualViewport`.
- Test 390×844, 844×390 and 360×640 (small Android).
Evidence: GAME_DESIGN.md:72, :81-96; STORY.md chapter I room table (shz_street exits). The arithmetic is mine.

### 9. Saves: no plan for data changes, the "before the battle" copy, or saving mid-dialogue
Severity: should-fix
What's wrong: Saves under `barbarain.v1` "with a version number" (GAME_DESIGN.md:146) store room ids, item ids and flags. These will change all through the build, and there's no migration or check on load. Other gaps:
- "Try again (restart the battle at full strength of the moment before it started)" needs an in-memory copy of the state before each battle. That copy isn't in state.js's job list.
- "Save anywhere outside battle" doesn't say what happens mid-dialogue, in targeting mode, or while holding the burning rag.
- All slots in one key means one bad write can corrupt every slot.
Why it matters: Testers' saves silently break after content edits, and a player can load into a dialogue that no longer exists.
Suggestion:
- One key per slot (`barbarain.save.auto/1/2/3`).
- A `migrate(save)` table keyed by version.
- On load, check every room, item and flag reference, and fall back to the current chapter's start snapshot with a message if something doesn't match.
- Allow saving only at a room's resting state, outside any dialogue or targeting.
- Make the burning rag turn back into an oil-soaked rag when you leave the room.
- Keep `preBattleSnapshot` in memory only.
Evidence: GAME_DESIGN.md:126-130, :144-148, :425-426; STORY.md chapter I puzzle B.

### 10. The cut list protects nothing on the writing side, which is the real schedule risk
Severity: should-fix
What's wrong: The list ends "The story, the three twists, all five chapters, combat, levels, weapons and the inventory system are not on the list" (GAME_DESIGN.md:455-456). Yet the writing load is very large:
- party banter of "6 to 10 per character per chapter" (STORY.md:621): about 120-200 lines;
- 3 hint levels per objective;
- at least 3 keywords, each with look/take/use replies, across 41 rooms;
- Bestiary, people met, chapter recaps;
- a font-size setting and a separate landscape layout.

None of these can be cut, so if time runs out the quality drops evenly across everything, which is the "slop" the brief warns against.
Suggestion: Add writing cuts, ahead of the parser and hotspots:
- banter pools down to 2 per character per chapter, plus the objective-hint line;
- people-met and chapter-recap journal pages;
- the font-size setting;
- the Glass Garden lore tablets (already partly listed).

Also order the build so chapter I is fully playable, art and sound included, before chapter II's content is written. That proves the pipeline end to end before scaling up.
Evidence: GAME_DESIGN.md:438-456; STORY.md:618-623. Otherwise judgment.

## Art and sound director

I checked the art and audio side of the design against STORY.md. **The 41 room backgrounds are all accounted for: 12 + 10 + 7 + 9 + 3 rooms, one background each, and the epilogue reuses key art.** The real problems are elsewhere:

- **One look:** the pixelize step won't make nanogen and imagegen2 art look like one game.
- **Teal motif:** nothing in the pipeline keeps teal off the sea and Stygian scenes.
- **Gaps:** several sprites, key art pieces and sounds the story needs are missing from the asset list.
- **Budget:** it rests on an imagegen2 price that was never checked.

I edited no files.

### 1. The pixelize step won't make the two tools look like one game
Severity: must-fix
What's wrong: Art direction says every image is downscaled "to its exact in-game size (box filter), quantize to a limited palette (sprites 24 colors, backgrounds 48)". There are three problems with this:
- Each image picks its own palette, so each one ends up with its own 24 or 48 colours. Nothing is shared.
- Shrinking a 1024 px imagegen2 render about 23 times to 44 px with a box filter gives muddy, noisy pixels with no clean clusters or outlines.
- The only style anchor is a 44 px battle sprite. That is useless as a reference for 41 nanogen backgrounds, and the design never says the portraits (nanogen) should use it at all.
Why it matters: The backgrounds will be painterly and the sprites will be mushy, each with a different colour cast. It will read as a collage, not a 16-bit game, which fails the brief's "16-bit style graphics" and its "quality over speed" ask.
Suggestion:
- **Master palette.** Build one game palette of about 64 colours from the approved anchor plus the first approved background. Remap every asset to it, with no dithering on sprites.
- **Sprites.** Prompt imagegen2 for "pixel art drawn on a 48-pixel-tall grid, large flat pixels, no anti-aliasing". Downscale with a mode or nearest filter at the detected grid size, then add the 1 px outline.
- **Background anchor.** Make one background first (shz-tavern), pixelize it, and pass it as nanogen's `--image` reference for every other background and key art piece.
- **Portraits.** Make Kord's portrait from the sprite anchor, then use that portrait as the reference for the other 13.
Evidence: GAME_DESIGN.md "Art direction" (the pixelize bullet and the style anchor bullet) and "Asset list" (P = nanogen with no reference). asset-guide.md "Keep it looking like one game", steps 3 and 5. nanogen SKILL.md: edit mode takes up to 14 `--image` references.

### 2. Teal won't stay special: the sea, "serpent green" and Stygia will all drift into it
Severity: must-fix
What's wrong: The design says "Cyan-teal appears only on future things", but:
- The style line asks for "serpent green".
- Chapter II is all sea: docks, sea caves, the Drowned Passage, the open sea, and "sea-foam light".
- Khemi's Egyptian look invites turquoise faience.
Image generators paint seawater cyan and turquoise by default, and per-image quantizing keeps whatever hue they chose. Nothing in the pipeline stops it.
Why it matters: Teal is how the player is meant to catch the clues for all three twists: the Lady's eyes, the hounds, the tower lamp, the Wyrm's eyes. If half of chapter II is teal, that signal drowns before the Wyrm rises.
Suggestion:
- Split the master palette in two. Non-machine assets get a version with the teal band (roughly hue 165 to 195°, high saturation) removed. Only assets tagged "machine" get the teal colours.
- Add to every non-machine prompt: "sea and water in deep indigo and slate green, no cyan, no turquoise".
- Reword the style line to "dark jade serpent green".
- Draw the foreshadowing glints in code (already a juice item), so they are the only teal on screen.
Evidence: judgment. GAME_DESIGN.md "Art direction" (style line and the "Teal = the machine" bullet). STORY.md chapter II rooms.

### 3. Sprite sizes: no single scale for people, and the same people need two versions
Severity: should-fix
What's wrong: The design gives "Party battle sprites ~44px tall; NPC scene sprites ~56px; enemies 32 to 96px". Specific problems:
- A human is 44 px in battle but 56 px in a scene. Human enemies (mercenaries, slavers, Uzzah, Gorm) have no set height.
- Gorm, Uzzah, Valka (the sparring duel) and Thulamon each need a scene sprite and a separate right-facing battle sprite, and neither version is listed.
- Ain is "~44px" in battle, yet in the story it is a palm-sized gem.
- anim8gen attack frames go from a "256 canvas → ~48px", so the pixel size changes against the 44 px idle sprite.

On legibility, 44 px is fine at 1x on a 390 px phone. Older SNES RPGs used sprites of 24 to 32 px. The 64 px portraits at 2x are also legible.
Why it matters: Pixel density will jump between the scene and the battle and between idle and attack, which is the clearest sign of mixed-source art. A man-sized gem also looks silly.
Suggestion:
- Use one human height everywhere, about 48 px, in scenes and in battle.
- Scale beasts and bosses relative to that.
- Make Ain about 20 px with a code-drawn halo.
- Make enemies face right. Mirror the shared characters' battle versions, and list them.
- Crop anim8gen frames at the same scale factor as the idle sprite instead of resizing them.
Evidence: judgment. GAME_DESIGN.md "Art direction" (resolution bullet) and "Asset list" (kord-attack row).

### 4. Characters the story needs that aren't in the sprite or portrait lists
Severity: should-fix
What's wrong: Cross-checking STORY.md against the asset list:
- **Missing sprites.** These have no sprite even though the story shows them:
  - The bronze hounds. They are a key clue, with teal eyes, and puzzle B is about them.
  - The tavern dog (a twist 1 clue).
  - The Lady of the Waves projection.
  - The silver-clothed man seen in the Window of Years.
  - The lamp-seller and the Khemi herbalist (both sell puzzle items).
  - The Khemi gate captain (the "Yes... master" scene).
  - Mother Teg, who speaks for the crew.
  - Ashkarran unveiled, with glowing filaments.
- **Missing backgrounds.** There is no "past" version of wyr-window for the vision.
- **Missing portrait.** The Steward speaks in four scenes and has none.
- **Cut list mismatch.** Cut-list item 4 cuts portraits for "Uzzah, Ilk", but neither is in the portrait list.
- **Boss count.** The boss row says "×6" but lists 7 (the budget's 54 sprites counts 7).
- **Enemy count.** Appendix B gives about 29 distinct enemy sprites against "×28": Drunk, Pen Guard, the Warden's Left and Right Arm, and Elite Brazen Man (a recolour) are easy to miss.
Why it matters: A missing sprite means a puzzle NPC or a twist clue is either not on screen or gets placeholder art. The definition of done says every enemy appears.
Suggestion: Add these rows:
- Hounds (must, 1 sprite).
- Dog, the Lady of the Waves, the silver man, the lamp-seller, the herbalist, the gate captain and Mother Teg (should; the Lady of the Waves can be a teal-tinted edit of the Lady in Grey).
- Ashkarran-unveiled, made as an imagegen2 `--image` edit of the boss sprite.
- A wyr-window-past background, made as a nanogen edit of wyr-window.
- A Steward portrait (must).

Then fix the boss count to ×7, list all 29 enemies by ID, and match the cut list to the portrait list. The extra cost is about 12 images, roughly $0.80.
Evidence: STORY.md chapter I steps 4 and 8, chapter II step 3, chapter III step 5, chapter IV steps 3 and 5, and appendix B. GAME_DESIGN.md "Asset list" and "Cut list" item 4.

### 5. Key art is missing for chapter cards, the epilogue and the final reveal
Severity: should-fix
What's wrong: The six key art pieces are title, Godstone reveal, Wyrm rising, Ouroboros heart, serpent altar and epilogue dawn. But:
- Screens promise a "chapter card: chapter number, name and key art" for five chapters.
- They also promise "illustrated epilogue scenes" (plural) and an "illustrated card" for How to play.
- Surprise 4, the narrator's last page set in the far future with Ain beside the quiet Steward, has no image. Neither does Kord finding the teal sliver.
Why it matters: The game's last and biggest beat would play over a reused dawn picture, and the chapter cards would have no art.
Suggestion:
- Add key art for the last page (Ain beside the quiet Steward in the far future) and for the teal sliver in Kord's hand. Make both must.
- Map each chapter card to an existing piece in the design: I = title, II = Wyrm rising, III = Ouroboros heart, IV = serpent altar, V = a new "stilled Khemi under a moonless sky" piece.
- Draw the How-to-play card in code using existing sprites.

That is about 3 more nanogen images, roughly $0.15 with retries.
Evidence: GAME_DESIGN.md "Screens" (chapter card, How to play, Victory/epilogue). STORY.md chapter V steps 6 and 7.

### 6. The sound list misses the stingers, the chapter V centrepiece and several promised sounds
Severity: should-fix
What's wrong: The "sfx ×28" row matches the 28 listed effects, but it leaves out the 4 stingers ("victory fanfare, level up, puzzle solved, chapter card"). The real count is 32 before retries, and the budget's "28 + 4" is all spent on the stingers. Sounds the design or story needs that aren't listed:
- **Chapter V.** The gong BONG and Kord's war-cry roar. "His war-cry wakes his friends" is the chapter V puzzle and the moment Crom's Roar is learned.
- **Juice items.** The ★ typewriter "soft tick", a mosaic battle-transition swoosh, a chest opening, and a rain loop (the juice list has rain at Gallows Bay).
- **Rooms.** A dungeon drip or wind loop, the singing pillar's one-note hum, a Game Over sting, and a save confirmation.
Why it matters: "A sound on every action" is a must-have, and the game's climactic puzzle would be silent.
Suggestion:
- Add the gong, the war-cry, the battle transition, the chest, the rain loop, the dungeon loop, the pillar hum and the game-over sting. That is about 40 sound effects with stingers, roughly $5.30 with retries.
- Make the typewriter tick, UI tap, back, error and Ain blip as short WebAudio blips in code. That is free and tighter, and saves about $0.60.
Evidence: GAME_DESIGN.md "Audio direction" and "Juice". STORY.md chapter V step 1. audiogen SKILL.md "Cost" (SFX about $0.12 flat).

### 7. The music won't loop cleanly, and the shared "title motif" won't happen
Severity: should-fix
What's wrong:
- The tech plan just says "music buffers loop". ElevenLabs music has intros, endings and fade-outs, and has no loop option. The battle track will be heard dozens of times, with a dip or a seam every 60 to 90 seconds.
- "stillness: ... heartbeat drum swelling into the final battle" can't loop at all.
- "finale" and "ending" are both meant to carry "the title motif". Separate prompts won't reproduce a melody.
Why it matters: An audible seam in the battle music is the most repeated flaw in the game. The motif promise will fail silently.
Suggestion:
- Prompt every track with "no intro, no ending, no fade-out, steady N BPM, constant energy".
- Generate 90 seconds and trim to a bar boundary.
- In audio.js, loop with two overlapping sources and a 1.5 to 2 second crossfade at the loop point, and keep a per-track loop-point table.
- Make stillness a static pad, and handle the swell in code with a volume ramp plus the boss track.
- Generate title first, give finale and ending the same key, instruments and tempo words, and drop "title motif" from the design.
Evidence: audiogen SKILL.md "Loop Caveat" ("Music has no native loop flag"). asset-guide.md "Music" bullet.

### 8. The budget rests on a guessed imagegen2 price, with only $2.25 of slack
Severity: should-fix
What's wrong:
- **imagegen2 price.** Sprites are costed at "~$0.06 est." each across 98 imagegen2 images (sprites plus icons) and about 24 anim8gen images. The skill reports token usage but no prices, and GPT Image 2.x "use[s] high-fidelity image inputs automatically". Every sprite that uses the anchor as a reference also pays for input image tokens.
- **anim8gen count.** Its review-and-retry loop seldom accepts a 4-frame action in exactly 8 images.
- **nanogen price.** nanogen's own skill contradicts itself: line 153 says flash costs "$0.067 / 1K image", while the table says $0.034. At $0.067, backgrounds, key art and portraits cost about $5.50 instead of $2.80.
- **Total.** $17.75 of $20 doesn't absorb any of these.
Why it matters: The money could run out partway through the enemies, which are a must, and leave code-drawn holes.
Suggestion:
- Make every sprite at `--quality low` or medium. They end at 140 px or less, so high quality is wasted.
- Batch sprites into sheets: 4 to 6 enemies or NPCs per 1536×1024 imagegen2 call, then slice them. This is cheaper and also more consistent.
- Make all 24 icons in one sheet.
- Price the anchor's real token usage and one nanogen call before the batch.
- Set a hard checkpoint: if the projection goes over $16, cut the anim8gen attacks and the minor portraits first.
Evidence: imagegen2 SKILL.md lines 41 to 43 (token usage, high-fidelity inputs). nanogen SKILL.md line 153 vs line 405. GAME_DESIGN.md "Budget estimate".

### 9. Item icons from separate 1024 px renders will be mush, and status and type icons aren't planned
Severity: nice
What's wrong:
- The design lists "item icons ×24 ... imagegen2 (low) | 1024 → 16×16", each made separately. A 64 times box downscale of 24 independent renders gives blobs of inconsistent weight.
- The battle UI shows status effects "as small icons by the bars" (11 statuses) and weaknesses for 5 damage types. No icons are listed for any of them.
Why it matters: The icons are hard to read in the inventory, which is a headline feature, and the builder will improvise the status icons.
Suggestion:
- Make one 6×4 icon sheet in a single imagegen2 call, prompted as "16×16 pixel icons on a grid", and slice it with nearest-neighbour scaling. Or draw the icons in code, which is the cut-list fallback anyway.
- Specify the 11 status icons and 5 damage-type icons as code-drawn 8×8 or 12×12 glyphs from the master palette.
Evidence: judgment. GAME_DESIGN.md "Stats and formulas" (status effects bullet) and the "Asset list" item icons row.

### 10. Darkened battle backgrounds will swallow dark-outlined sprites, and the composition note leaves no room for the party
Severity: nice
What's wrong:
- "Battle uses the room's background darkened at 60%". The sprites have "crisp dark outlines", and many enemies are dark: shadows, mummies, Shadow-cats, Ortho in black.
- Backgrounds are told to keep the "mid-ground kept clear in the lower middle third", but battle puts enemies on the left and the party on the right.
Why it matters: Silhouettes blur into the background, and the party may stand on busy scenery.
Suggestion:
- Darken 30 to 35% and desaturate about 40%, with a lighter floor band behind the sprites.
- Add a subtle code rim light, or a 1 px lighter outer outline, on enemies in battle.
- Change the background prompt to "open, uncluttered floor across the whole lower third".
Evidence: judgment. GAME_DESIGN.md "Art direction" (backgrounds bullet) and "Screens" (battle).

