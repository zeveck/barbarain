# Design review round 2: raw findings

## Player

I found 9 problems: 1 must-fix, 7 should-fix and 1 nice. The must-fix is the twist-3 logic. Four of the others are difficulty walls or puzzle gaps that most players would hit. The first minute works well: a short opening card, four taps in the tavern, then Gorm's brawl and the Horned Helm. The humour is in character, and most puzzles are clued twice.

### Chapter III spells out the trap, so twist 3 makes Ain and the party look slow
Severity: must-fix
What's wrong: Key-rule statement 3 has Ain read aloud, twice: "ARBITER KEY: TURNS ONLY BY THE ARBITER'S OWN WILL, WHEN IT REACHES FOR THE CORE." In the same scene the Steward says "The key comes to me across the sea", the doors call Ain "Arbiter", and the silver man shouted "it'll have to make it *want* to come back". The party's whole plan is then for Ain to go to the core, wanting to destroy it. When Toktai asks "What key?", Ain, a precise and logical machine, answers "...I don't know", and the party marches on. Chapter IV then sets the trap off with "As Ain flares with Spark at the serpent". But the core is "deep below"; striking a serpent at the obelisk is not plainly "reaching for the core". The ending has a smaller wobble: the lock "does not ask why… only your wanting", yet Ain undoes it with "I do not consent".
Why it matters: Anyone paying attention solves twist 3 in chapter III and then watches the heroes walk into it. The reveal reads as "the characters were dim", not "of course". It is the headline twist, and the brief's "make sense" item rides on it.
Suggestion: Cut "WHEN IT REACHES FOR THE CORE" from the chapter III record. Keep only "CANNOT BE COMPELLED, COPIED OR FORGED". The Steward reveals the mechanism in chapter IV. Better still, let Ain half-suspect in chapter III ("If I am its key, I will not touch it. Kord's sword will."). Then in chapter IV the Steward forces the moment: the serpent seizes Kord, and Ain reaches into the obelisk-core of its own will to save him. Wanting is still the trigger, Ain isn't dumb, and the scene is crueller. State in one line that the obelisk is the core's hand ("to touch this is to touch me"). End on "I do not want it any more" and drop "consent".
Evidence: STORY.md 202-213, 560-574, 669-681, 746-747

### The sim checks fights at a level the player won't have
Severity: should-fix
What's wrong: BALANCE §7 runs each encounter "at the planned level (T)". But the §4 XP table puts the party one level under T for about 10 placed fights:
- cats: T3, party Lv2 (58 XP)
- crocodile: T5, Lv4
- crabs: T6, Lv5
- ghouls: T7, Lv6
- hoard: T8, Lv7
- e3_brazen: T10, Lv9
- pillar: T11, Lv10
- pens: T13, Lv12
- scarabs: T14, Lv13
- python: T14, Lv13
- e5_stair_a: T16, Lv15

The shadow-cats are the worst, at minute ~12. Kord at Lv2 has about 89 HP and DEF 14; Toktai about 62 HP. Two cats (ATK 25, 99% to hit) deal about 40 a round. Toktai's pierce attacks are resisted, so party damage is about 22 a round against 94 HP: roughly 4 rounds and about 160 damage, against 151 party HP. The default is Warrior.
Why it matters: The sim goes green while real players hit a wall in the first dungeon. With no healer, the two chest draughts get burned here.
Suggestion: Have sim.mjs compute each fight's level from the cumulative XP before it, not from T, or set T = level actually reached. Re-tier the cats to T2 (or ×0.8 ATK).
Evidence: BALANCE.md 17-19, 100-163, 259-261

### Ashkarran is a boss for two with no healer, and nowhere in chapter I heals you
Severity: should-fix
What's wrong: Ain (Mend) joins after Ashkarran, so the boss is Kord and Toktai at Lv4 (about 146 + 102 HP). The boss has 342 HP plus two Shadows that resist slash and pierce, and nobody on the party has fire or shock yet. Rough sums: about 47 party damage a round, so about 10 rounds. He deals about 28-32 a hit, and Lightning 1.8× hits both, about 60 each, or about 30 if Defended. Incoming damage comes to about 450-500 over the fight, so the player needs 3+ Healing Draughts they probably don't have. GAME_DESIGN promises "full heal at… inns", but no inn exists in any room table. The tier formula assumes a full party, while chapter I has one or two members.
Why it matters: The first boss on default difficulty is a likely Game Over loop right before the best moment in chapter I.
Suggestion: Add a party-size factor to the tier formula (e.g. HP ×0.7 at 2 members). Even better, let the caged stone help in the boss fight: every 3rd round a woman's voice from the cage heals 20% ("Hold, thief."). That reuses the chapter V roundHooks, foreshadows twist 1 and fixes the curve. Make the Drowned Lamp and the Hanged Gull real inns (a 10-silver rest).
Evidence: BALANCE.md 35, 107-108, 176; GAME_DESIGN.md 160; STORY.md 246-259

### In the final boss, the first Eye round collides with the Stillness, and Kord is too slow to fix it
Severity: should-fix
What's wrong: The Steward casts Stillness on rounds 4, 8, 12 and opens the Eye on rounds 5, 10, 15. Ain breaks through on rounds 3, 6, 9 and so on. Toktai and Valka get Stilled on round 4, and the next cure is Ain on round 6, so they spend Eye round 5 frozen. Kord could Roar on round 5, but at AGI 22 he acts after Toktai (40) and Valka (34), so their turns are already skipped. Round 5 becomes "Kord swings alone or wastes the Eye on a Roar".
Why it matters: The big "Kord, now! The Eye!" moment fizzles the first time. Players will feel the mechanic is broken.
Suggestion: Move the Stillness to rounds 3, 7, 11, so a breakthrough or Roar lands before each Eye. Or make Crom's Roar "acts first". Also check the Eye/Stillness/breakthrough order in the sim.
Evidence: BALANCE.md 38, 58, 203, 210-211

### The python puzzle's combine step has only one clue
Severity: should-fix
What's wrong: "Nebet won't eat a root… Combine root + rat." The only clues are the herbalist's "for the overfed" and the wrong-try replies. No NPC or companion suggests hiding the root in food, the leap the player has to make. The plain-rat reply ("too full for rat. Barely.") actually points away from feeding a rat at all.
Why it matters: This is the step where players will start using every item on every other item, against the design's own "clued twice" rule.
Suggestion: Give the herbalist "Shepherds hide it in a fig for the goats. The sacred one does not eat figs." Give Toktai, holding the rat, the line "He will not eat medicine. He would eat medicine dressed as dinner."
Evidence: STORY.md 624-630; GAME_DESIGN.md 147-150

### The opening money is exactly enough, so one wrong purchase strands a new player
Severity: should-fix
What's wrong: Kord starts with 0. The dagger sells for 8, and the needs are Shadizar Red 5 plus lamp oil 3 (oil also comes free from Oyuk, but only "if asked after the fight", which isn't clued). Spending 8 on Bread and Dates, or on anything else at Ilk's first, leaves the player selling the Horned Helm or their only sword to continue.
Why it matters: In the first 10 minutes the player feels stuck or punished, and that rarely loops back as "funny".
Suggestion: Gorm's apology includes "a few coins for the wine I spilled" (10 silver), or Oyuk runs a tab for Kord. Clue the free oil: Oyuk complains about "the dregs of the lamp oil" when Kord looks at the lamps.
Evidence: STORY.md 263-317; BALANCE.md 221-225

### How does a caged stone in the tower hire a thief across the city?
Severity: should-fix
What's wrong: The Godstone sits "in a cage of blue fire" in the sanctum, yet the Lady appears in the Drowned Lamp across town. Nothing explains the projection's range. The plot also hinges on the Steward wanting Ain to escape, yet it has Ashkarran fight to the death and sends acolytes after the party. "Theatre" covers that, but nobody ever says so.
Why it matters: Players reconstruct twist 1 the moment it happens. "Wait, how?" undercuts a reveal that is otherwise well clued.
Suggestion: Add one line in the twist 1 scene, e.g. "I can throw my image anywhere the tower's teal lamp can see. It sees the whole city." Have the Steward in chapter IV say "Ashkarran had to fight. A door left open must look shut."
Evidence: STORY.md 145-150, 279-287, 351-374

### Touch battle controls leave out Auto and the skill/target sub-menus
Severity: should-fix
What's wrong: The phone battle tray is "five big buttons". Auto ("a QoL toggle") exists only as keyboard `A`. Skill menus (Ain has up to 9 skills, Toktai 6) and the target list have to share the same 168px tray (120px on 360×640), and their layout isn't specified. Targets in the picture include 20-26px sprites (Ain, asps, about 24-32 CSS px).
Why it matters: About 30 fights of 3-10 rounds, one-thumbed, with no Auto and a scrolling skill list, is where phone players give up.
Suggestion: Add an Auto toggle in the turn-order strip, and a "Repeat last turn" button. Make the skill list a bottom sheet showing name, MP and type (2 columns, 48px rows). Default the target to the last target or the Auto pick, so one tap confirms.
Evidence: GAME_DESIGN.md 80, 106-108, 116, 247

### Valka's vow at sea is never paid off
Severity: nice
What's wrong: On the Shrike, Valka "vows that if she dies at sea she'll come back to fight beside him". She never dies and the vow never returns. Her chapter V wake-up line is "Next time, kiss me awake."
Why it matters: It's a Bêlit callback that every fan will notice. A setup without a payoff feels like a dropped thread.
Suggestion: When the Roar wakes her: "Told you I'd come back to fight beside you. I just didn't think I'd have to die standing up." Or have her throw herself between Kord and the Steward's killing blow in phase 3.
Evidence: STORY.md 484-486, 718-719

## Builder

Round 2 Builder review. There are 10 findings below, most important first; three are must-fix. I re-ran the BALANCE numbers with node. The XP table, the chapter totals (324 / 1326 / 1921 / 2882 / 2520), the gold sums, the chapter II shop total (1,620), the asset count of 41 backgrounds and the budget totals ($14.93 / $16.82) all add up. The problems are in how the data is shaped, the test harness and phone sizing, not in the arithmetic.

### 1. The battle data has no moves table and the AI conditions are never defined, so enemies can't be written
Severity: must-fix
What's wrong: Enemy `ai` and `phases` refer to moves by id (`double_strike`, `beam`, `stillness`, `asps`, `crush`, `venom`, Slam, Net, Gust, Dirty Trick, Drain, Judgement, Weigh, Lion's Song), but DATA_SPEC never defines a MOVES table. A move needs a multiplier, damage type, target shape, status and chance, heal or drain, and summon details. The `ai.when` conditions are shown only by example (`partsAlive`, `every`). The design also needs conditions it never names: HP below X% once (Ashkarran's summons at 70% and 35%, Thulamon's asps at 75%), "fewer than 2 alive" (Ortho calling a cutthroat), "lowest-HP ally" (the Acolyte's heal), a fixed round list (the Eye on rounds 5, 10, 15) and "a telegraph happened last round".

Several required behaviours have no data form:
- Phases carry no stat or resistance overrides (`{atHpPct, sprite, moves}` only). Thulamon's serpent phase needs ATK ×1.15 and a pierce resistance; the Steward needs ATK ×1 / ×1.1 / ×1.2.
- There is no trigger for "the first Crom's Roar in phase 3 adds Bakari"; `roundHooks` only fire on round counts.
- There is no per-round aura (the Singing Pillar's Drowsy), and no field for Kord's innate immunity to Stilled and Drowsy.

Two definitions will break outright:
- BALANCE gives the Acolyte `role: healer`, but `role` is the minion / elite / mini / boss key the stat formula reads.
- The Warden lists its arms twice: in `ENEMIES.warden.parts` and again in `ENCOUNTERS.e3_warden.enemies`. Nothing says which one spawns them, so an engine could create four arms.

Why it matters: The design says every extension point must exist before chapter I's fights, and Ashkarran already needs a once-only summon at an HP threshold plus a telegraph. Without these definitions each enemy becomes a one-off script, and the sim and validator have nothing to check against.
Suggestion: Add a `MOVES {id: {mult, type, target:'one'|'all'|'self'|'ally', status:{id, chance}, heal, drain, summon:{enemy, n, max}, telegraph}}` section. Write a closed `when` vocabulary: `hpPctBelow` + `once`, `every`, `rounds:[…]`, `alliesAlive`, `partsAlive`, `allyHpLowest`, `afterTelegraph`, `chance`. Let phases carry `mult`, `weak`, `resist` and `immune`. Add `onPlayerSkill` hooks next to `roundHooks`, plus `aura` and member `immune`. Rename the healer tag to `aiRole`. Say plainly that `parts` spawn the arms and the encounter lists only the root enemy.
Evidence: DATA_SPEC.md lines 219–237 (the only `when` forms are `partsAlive` and `every`; no MOVES section anywhere, check with `grep -n MOVES DATA_SPEC.md`). BALANCE.md line 195 (`role: healer`) and line 201 (phases with atk×1.15 and a resist change). DATA_SPEC line 217 together with line 223 (arms listed in both places).

### 2. XP is stored per enemy, but BALANCE's totals are per encounter and don't divide evenly
Severity: must-fix
What's wrong: DATA_SPEC puts `xp` and `gold` on each enemy (`xp: 600`), and validator check 9 adds them up per chapter. BALANCE gives XP per encounter, and several encounters can't be split across identical enemies:
- e2_grotto_cutthroats: 220 / 3
- e2_sluice_ghouls: 250 / 3
- e4_slavers: 400 / 3

The same id also appears at two tiers with different stats and XP:
- `cutthroat` at T6 and T8
- `serpent_drone` at T10 and T11
- `brazen_man` at T10 (elite) and T15 (minion)

Nothing says what XP comes from summoned shadows and asps, Ortho's extra cutthroats, Uzzah fleeing at 20%, losing the Valka duel (the story continues on a loss) or the optional Gull. Levels sit exactly on the thresholds (1650 = Lv 9, 3571 = Lv 12, 6453 = Lv 15, 8973 = Lv 17). So any stray XP, high or low, breaks the "level matches the next snapshot exactly" check.
Why it matters: Check 9 can't pass as written, `ENEMIES{id}` can't hold two stat blocks for one id, and the play-test's snapshot comparison will fail at random.
Suggestion: Put `xp` and `gold` on ENCOUNTERS and pay them once on a win or a scripted end (duel either way, Uzzah fleeing). Summoned and called-in enemies give 0. Add `optional: true` (Gull, Seek trouble) and leave those out of check 9. Either use distinct ids (`cutthroat_t8`, `brazen_man_solo`, `serpent_drone_t11`) or let an encounter override tier, role and mult.
Evidence: `node -e 'console.log(220/3,250/3,400/3)'` gives non-integers. BALANCE.md lines 113, 117, 125–126, 131 (the repeated ids). DATA_SPEC.md lines 230 and 287.

### 3. Scripted battle commands are never defined, and "100% wins over 200 seeds" can't be met by a fixed script
Severity: must-fix
What's wrong: BALANCE §7 asks bosses to "win 100% with the chapter's scripted battle commands" across 200 sim seeds. A fixed command list can't survive changing outcomes: a target dies early, the acting member is stunned or Stilled, or the turn order changes. The format is undefined:
- DATA_SPEC uses a per-encounter file (`scriptedCommands: 'tools/solutions/ch3-warden.json'`) while the tech plan puts the commands inside ch1–5.json.
- Game data points into `tools/`, which is outside `game/`.
- `skill kord roar` names a member, but nothing says what happens when it isn't Kord's turn.
- Duplicate enemies (2 drunks, 3 cutthroats, 2 `warden_arm`s) have no instance names, so `attack warden-arm` is ambiguous.

`state().battle` has no field for whose input is awaited and no busy flag, so a Playwright replay can't tell when to send the next command while animations and the typewriter run.
Why it matters: `sim.mjs` exits non-zero on any miss, so the definition of done is unreachable as written. Boss replays will also go out of step and fail at random.
Suggestion: Make scripted commands a small priority policy in the same vocabulary as Auto (for example "if an arm is alive, attack the lowest arm; if a telegraph is up, defend"). Store it as `tools/solutions/policies/<encounter>.json`; it isn't game data. The sim runs it over 200 seeds. The typed replay uses the game's fixed seed (encounter + attempt, reset by `goToLevel`). Give enemy instances stable names (`cutthroat-a/b/c`, `warden-arm-l/r`). Define that a battle command applies to whoever's turn it is, and that a member name is only a check. Add `battle.awaiting: memberId|null` and a top-level `busy: bool` to `state()`.
Evidence: BALANCE.md lines 264–266. DATA_SPEC.md line 218 against GAME_DESIGN.md line 558. GAME_DESIGN "Debug hook" bullet (the battle fields are only `{round, phase, enemies:[{id,hp}]}`).

### 4. The sim runs fights at tier T, but in 12 of 29 fights the party is a level lower, and it ignores shop gear
Severity: should-fix
What's wrong: BALANCE §7 runs every encounter "at the planned level (T)". I added up the cumulative XP in walkthrough order with node: the party is one level below T at e1_library_cats, e1_croc, e2_grotto_crabs, e2_sluice_ghouls, e2_hoard, e3_brazen, e3_pillar, e4_pens, e4_scarabs, e4_python and e5_stair_a. Running ch III's drones before the Brazen Man adds e3_drones, which makes 12. The croc (a mini-boss right after Ain joins) is fought at Lv 4, not 5.

The sim's gear is "snapshot gear plus everything found", which leaves out purchases. The Sentinel lesson depends on the bought Cudgel. My rough count with slash only (Rusty Broadsword plus Toktai's bow against its resist) is about 16 damage a round against 177 HP: roughly 11 rounds, which probably loses.
Why it matters: The sim will pass fights that real players will struggle with, and the "crush takes at most 60% of the rounds" check has no defined loadout.
Suggestion: Have the sim take the party (level, HP/MP, gear, items) from the solution replay at each battle start. Run the battle engine headless over the solution script, or dump `state()` there. Failing that, work the level out from cumulative XP in solution order and add a per-encounter `simLoadout` that includes purchases. Either drop T to the real level or keep T and accept the gap on purpose.
Evidence: the node script in this review (cumulative XP against T); BALANCE.md lines 84 and 258–259; STORY.md chapter I step 7.

### 5. The phone layout was sized to screen heights, not the viewports the play-test uses; the picture also shrinks below 1×
Severity: should-fix
What's wrong: The portrait budget adds up to exactly 844, the iPhone 15 screen height. The play-test opens `--device "iPhone 15"`, whose viewport is 393×659 portrait and 734×343 landscape.

At 659, the bars plus picture 221, tray 168 and tab bar 56 leave the story about 138px, well under the stated minimum of 200. Landscape needs 40 + 168 + 160 = 368 against 343 available.

The fallback, shrinking the picture to 156px tall, scales the 320×180 art by 0.87×. With `pixelated`, that drops whole pixel rows and columns: 1px outlines vanish and 48px characters lose detail.
Why it matters: The definition of done checks 390×844 and 844×390, sizes the play-test's real phone never shows. Real Safari, with its toolbars, is close to 659.
Suggestion: Plan against 393×659 and 734×343 (and 360×640), and add them to "Tested sizes". Keep the picture at 1× or more: at the minimum it shows 180 logical px tall, cropping the sides or letterboxing rather than scaling below 1. When the tray is busy (battle, dialogue), cap it at 2 button rows and collapse the party strip into the top bar. In landscape, drop the top bar into the rail.
Evidence: run `node -e 'const d=require("playwright-core").devices;console.log(d["iPhone 15"].viewport,d["iPhone 15 landscape"].viewport)'` from `/usr/local/share/nvm/versions/node/v24.22.2/lib/node_modules/@playwright/cli/node_modules/playwright-core`. Output: `{width:393,height:659}` and `{width:734,height:343}`. GAME_DESIGN.md lines 89–117.

### 6. The pixelize, slicing and animation steps are fragile as written
Severity: should-fix
What's wrong:
- **Grid detection.** "Detect the generator's pixel-block size, downsample with a mode filter at that grid, then nearest-neighbour to the target height" resamples twice. imagegen2 and nanogen output has no consistent pixel grid, so detection returns noise. The second nearest-neighbour step (for example a detected ~70px-tall figure squeezed to 48) drops rows and breaks outlines.
- **Sheet slicing.** `slice_sheet.py` "into named cells" assumes the model keeps to cells and a shared ground line. It often won't: uneven spacing, a sword or tail crossing a cell edge.
- **Animation frames.** anim8gen frames are "cropped at the same scale factor as the idle sprite", but that factor (a 1024 image down to 52px) doesn't apply to anim8gen's own frames, which are separate images at a different framing.
- **Palette.** A roughly 56-colour world palette built from Kord plus 3 warm or indigo backgrounds may posterize Glass Garden greens and night-sea scenes.
Why it matters: Every sprite and background goes through these tools. If they misbehave, the prototype step will burn retries on what is really a tooling bug.
Suggestion: Pixelize in one pass: crop to the alpha bounding box, scale once to the target height with a box or mode reduction, remap to the palette, threshold alpha, add the outline. Use grid detection only as a sanity report. Slice sheets by alpha connected components: merge pieces within N px, sort into rows, and require the expected count, else regenerate that cell alone (the budget's "single-cell fixes" line). For anim8gen, scale all frames by one factor that brings frame 1's figure height to the idle height. Build the palette from 5 or 6 test backgrounds that cover warm, night, sea, garden and stone, then check the posterization on two others before the batch.
Evidence: GAME_DESIGN.md lines 429–433, 495 and 553–555. The anim8gen SKILL.md (around lines 116–120) does its own detached-pixel segmentation (`segmentation.minDetachedPixels`), so its frames aren't laid out like the idle image. The rest is judgment.

### 7. Data fields and file paths disagree between the documents
Severity: should-fix
What's wrong:
- **`neverTarget`.** DATA_SPEC has `flags.neverTarget` (line 229); GAME_DESIGN and BALANCE have `ai.neverTarget` (line 239; BALANCE line 190).
- **Priority targets.** BALANCE gives warden_arm `priority: true` (line 191); DATA_SPEC uses the encounter's `autoHints.priorityTargets`.
- **Where encounters live.** The tech plan puts them in ch1–5.js; DATA_SPEC puts ENCOUNTERS in enemies.js, and its list of ch exports has no encounters.
- **`npcs`.** It's a ch-file export that is never defined, while NPCs are also placed as `kind:'npc'` things.
- **Exit directions.** DATA_SPEC uses `dir:'s'` and the parser n/s/e/w/u/d, but STORY's exits are "out, in, on, back, deeper, side, tavern, up the wall".
- **BALANCE errata.** great_gull HP should be 306, not 337 (139 × 2.2). Steward HP works out to 3233, not 3234. A Ch V Brazen Slam on Kord is about 75 damage after DEF, roughly 16% of his HP, not "about 11%".
Why it matters: Content writers and the validator will pick one spelling and quietly ignore the other.
Suggestion: Pick one name for each and change the other two files. Define `dir` as a fixed set (n/s/e/w/u/d/in/out) plus a free `label` and parser synonyms per exit. Define `npcs` as a registry (portrait, sprite, `names`) that room things refer to by id. Fix the three numbers.
Evidence: the lines cited above. Recheck the HPs with `node -e 'console.log((20+70+49)*2.2,(20+170+289)*4.5*1.5)'`.

### 8. Rules are missing for some verbs and keys
Severity: should-fix
What's wrong:
- **Use vs give on touch.** Using an item opens targeting mode; tapping Bolo then has to pick `use[X]` or `give[X]`. Nothing says which. The touch-only chapter I replay (drugged wine to Bolo) depends on it.
- **`say` and `shout`.** STORY needs `say ashkarran the magnificent` (the password) and "shouting makes Toktai's eye twitch", but things and rooms have no data field for them.
- **Gorm's interruption.** "On the third action or after ~30 seconds" has no data form (action count or timer trigger), so it becomes a script.
- **Enter.** One key means skip text, focus the command line, submit a command and confirm a battle target. Nothing says which wins while the typewriter is running and the command line is focused.
- **Noun matching.** "Partial matches" has no rule for ties (two things, or a thing and an item, with the same word).
Why it matters: Each of these is a spot where touch and typed play can behave differently, and the replays will be the first to find out.
Suggestion: Targeting an NPC tries `give[X]` → `use[X]` → the give chain; targeting a thing uses the use chain. Add `say: [{match:'ashkarran the magnificent', response}]` on rooms and things, and `shout`/`roar` as a room-level response. Add room `onAction:{count:3, effects}` and `onIdle:{seconds:30, effects}`. Enter in a focused input always submits and completes any running text. When a noun is ambiguous, ask "Which: the lamp or the lamp oil?" and list the options as numbered choices.
Evidence: DATA_SPEC.md §3 (the thing fields are look/take/talk/use/give/hit only) and §6. GAME_DESIGN Controls table (Enter appears in three rows). STORY.md chapter I steps 1 and 6, chapter V step 1.

### 9. DATA_SPEC covers the story data but not the RPG data
Severity: should-fix
What's wrong: There is no schema for:
- ITEMS beyond `kind`, `name` and `transient`: no power, damage type, slot, users, two-handed, acts first, flyers, stun/Sunder/poison %, crit, "+25% vs tag", price, treasure value, sorcerous flag, consumable effect, or the "scales by chapter" rule for Oil Bomb and Throwing Knives.
- MEMBERS (Lv 1 and Lv 17 stat lines, allowed weapon classes, slots, Kord's immunities) and SKILLS (cost, target, mult or power, status, duration, learn level or flag).
- RECIPES, `shops` (stock, prices, buy/sell rules), `threats` and `seekTrouble` tables (enemy pools, the 25% reward rule).
Why it matters: Chapter I needs all of these: Ilk's shop, two recipes, gear comparison, Best gear and the sim. The builder will invent them during the engine skeleton step, and validate.mjs can't check what was never specified.
Suggestion: Add a short §14 with one example object for each: item (weapon, armor, charm, consumable, treasure), member, skill, recipe (`{a, b, result, text}`), shop (`{id, stock:[{item, price?}], buys:true}`), seekTrouble (`{id, pool:[enemy…], size:[1,3], rewardFrom:'e2_grotto_crabs', pct:25}`). Add validator checks: every weapon has power, type and users; every skill a member has exists; every shop item exists.
Evidence: DATA_SPEC.md §1 lists these files, but only §8 shows an item (transient fields only); there is no member, skill, shop or recipe example anywhere (`grep -n "RECIPES\|SKILLS\|shops" DATA_SPEC.md`).

### 10. The chapter V puzzle objects have no sprites
Severity: nice
What's wrong: Kord takes the maul, draughts, salts and Fire-Wine "from frozen guards". The guards are the source of chapter V's key gear, but no prop or NPC sheet has a temple guard. P2's smuggler's skeleton could double for chapter III's Atlantean skeleton holding the Humming Blade, but no sheet says so. Frozen Toktai and Valka can be their party sprites tinted in code.
Why it matters: The definition of done says "every puzzle object is a visible prop". Otherwise these become hotspot boxes on the background, against the design's own rule.
Suggestion: Add `temple-guard` (48px, facing right) to sheet N3 or E2. It also works as a frozen priest with a code tint. Note the skeleton reuse in P2.
Evidence: GAME_DESIGN.md asset list (sheets N1–N4, P1–P4) against STORY.md chapter V step 1 and chapter III step 1.

## Art and sound director

I'm the art and sound director for round 2. I read GAME_DESIGN.md, STORY.md, DATA_SPEC.md, review-roles.md, asset-guide.md and the four tool SKILL.md files.

**Coverage counts:**
- **Rooms:** 41 of 41 rooms in STORY have a background, plus wyr-window-past, which makes the 42 listed.
- **Enemies and bosses:** all 31 sprite ids in STORY Appendix B have an entry in a sheet or the boss list.
- **Named cast:** everyone has a sprite. 10 have portraits, 6 have should-portraits and the rest use cropped heads.
- **Props:** 24 are listed, but 2 that a puzzle or the win path depends on are missing, plus one clue prop (finding 1).
- **Key art:** 9 are listed. STORY places 7 of them; 2 have no scene and 2 ids don't match what the data uses (finding 1).
- **Music:** all 10 tracks are used.
- **Sound effects:** 32 are listed, all used, with gaps (finding 8).

The music total is 11 min, and the counts behind the image budget lines check out.

### 1. Missing props, and key art with no scene or the wrong id
Severity: should-fix
What's wrong: Some puzzle and plot objects in STORY have no sprite in any sheet:
- **Atlantean skeleton** in silvery clothes holding the Humming Blade. Star-stone 1 is taken from it, so it is a puzzle object (STORY 518).
- **Frozen temple guards.** Kord takes the Temple Guard's Maul and the draughts from them, which his solo fights depend on (STORY 707).
- **Severed bronze head** with teal eyes that whispers "...arbiter...", a twist 3 clue (STORY 348).

Key art problems:
- STORY never asks for `ouroboros-heart` or `serpent-altar` in any scene.
- DATA_SPEC 137 uses `keyart/godstone`, but the asset is `godstone-reveal`.
- STORY 701 uses `keyart-dawn`, but the asset is `dawn-at-sea`.
- DATA_SPEC 47 uses the ambience id `crowd`, which isn't in the loop list.

Why it matters: The definition of done says "every puzzle object is a visible prop", and validate.mjs fails on missing asset ids (DATA_SPEC 275). The builder finds these mid-chapter and has to make one-off generations that weren't budgeted.
Suggestion:
- Add a silver-skeleton cell (machine) to P3.
- Add a frozen-guard cell to P4. One grey-tinted pen-guard pose would do.
- Add a bronze-head cell (machine) to P1.
- Write the key art scenes into STORY: ouroboros-heart in "The Mind" (twist 2) and serpent-altar in "Heart of the Black Pyramid" (twist 3).
- Use one id style everywhere: `keyart/godstone-reveal`, `keyart/dawn-at-sea`.
- Add `crowd` to the loops or drop it from the example.
Evidence: grep the props table (GAME_DESIGN 516-519) against STORY 348/518/707; `grep -n keyart STORY.md DATA_SPEC.md`.

### 2. The teal rule erases planted clues and clashes inside mixed sheets
Severity: should-fix
What's wrong: Several teal clues sit in rooms or sheets that are not tagged machine, so the remap to the world palette will turn them grey-blue:
- "a lamp that burns teal and never flickers" in twr-hall. Twist 1's clue list names "the tower's strange lamp".
- The severed head's eyes in twr-workshop.
- "the sea lights up teal" in sea-deck.

The juice list draws only 4 glints in code (GAME_DESIGN 370-372). Also, 7 sheets mix machine and non-machine cells: E1, E3, E4, N1, N3, N4 and P3. One sheet prompt then has to say both "no cyan, no teal" and "eyes glow teal". The negative wins and the machine cells come out with almost no teal to keep.
Why it matters: The visual clue chain for twists 1 and 2 is lost, and the machine sprites look dull.
Suggestion:
- Add these to the code-glint list: twr-hall lamp, workshop head eyes, sea-deck teal glow (code tint), and the acolyte amulets in the escape.
- Regroup the machine sprites into one machine sheet of 7 cells: glass-spider, serpent-drone, brazen-man, singing-pillar, lady-grey, silver-man, bronze-hound. This costs nothing extra; a sheet frees up elsewhere.
Evidence: STORY 172-176, 333, 348, 490; GAME_DESIGN 388-399, 507-518.

### 3. The world palette's sources can't cover the style line, and may contain teal
Severity: should-fix
What's wrong: palette-world (about 56 colours) is built only from Kord plus tavern, docks and Khemi street (GAME_DESIGN 400-405). That mix gives warm browns, blues and black/sand. The style line's blood crimson and jade serpent green, Valka's copper braid and sea-green coat, and Thulamon's black and crimson may have no close match. The docks sea from nanogen is likely to be cyan-ish, and nothing says palette.py drops hue 165-195° from its sources. If it doesn't, the teal ends up in the world palette, and the "0 teal" check passes while teal is on screen.
Why it matters: Colours in later assets shift to whatever is nearest, which gives muddy crimson and a grey-green Valka. The teal rule also breaks silently.
Suggestion:
- Seed the palette with hand-set 4- to 5-step ramps for each style-line hue, plus skin, copper and sea-green, then merge in the sampled colours.
- Have palette.py drop hue 165-195° (saturation > 0.25) from the world sources.
- Read the CSS chrome colours, code glints, Ain's text colour and the code-drawn icons from the same palette files.
Evidence: judgment; GAME_DESIGN 383-387, 400-405.

### 4. Pixelize resamples twice, so pixels come out uneven
Severity: should-fix
What's wrong: The pipeline is "downsample with a mode filter at that grid, then nearest-neighbour to the target height" (GAME_DESIGN 429-431). GPT Image will not respect "a 48-pixel-tall grid". A detected grid of, say, 61 rows resized by nearest-neighbour to 48 drops or doubles rows. Mixed-size sheets like E4 (40 to 72px) and P1 (12 to 40px) make this worse.
Why it matters: Doubled and missing pixel rows look broken, not 16-bit.
Suggestion: Do one area/mode downsample straight from the source to the target size, then remap and outline. Use nearest-neighbour only at integer ratios. Also skip the added 1px outline when the source already has a dark edge, or outlines become 2px on some sprites and 1px on others.
Evidence: judgment; GAME_DESIGN 427-433.

### 5. Attack frames have no defined scale against the idle sprite
Severity: should-fix
What's wrong: "anim8gen frames are cropped at the same scale factor as the idle sprite". The idle sprite comes from a 1024 image scaled to 52px. anim8gen aligns and fits frames into its own 256 canvas, so the idle factor (about 1/17) applied to those frames gives a Kord about 12px tall.
Why it matters: The attack frames don't match the idle sprite's size or baseline, so Kord pops in size mid-attack.
Suggestion: For each animation, compute one factor so the neutral frame 1 is 52, 46 or 48px tall. Apply it to every frame, and keep the baseline aligned with the idle sprite's feet.
Evidence: anim8gen SKILL.md lines 77, 349 (it fits and aligns frames to the canvas); GAME_DESIGN 433, 504.

### 6. The canvas never scales by a whole number on the tested screens
Severity: should-fix
What's wrong: The 320×180 picture is shown at 390 CSS px wide (×1.22; ×3.66 device px at DPR 3), about 853px on desktop (×2.67) and 422px in landscape (×1.32). With `image-rendering: pixelated`, every 1px outline renders 1 or 2 device pixels wide, unevenly.
Why it matters: Shimmering, uneven pixels at every tested size undercut the "one 16-bit look" more than any asset mismatch.
Suggestion: Draw to the backing canvas at floor(device scale) with smoothing off. Then let CSS do the small leftover downscale with `image-rendering: auto`, which keeps pixels uniform and slightly soft. Or letterbox at whole-number scales on desktop.
Evidence: judgment; GAME_DESIGN 89-93, 112, 418-419, 561-564.

### 7. The worst-case budget doesn't stress the biggest unknown
Severity: should-fix
What's wrong: All the imagegen2 and anim8gen lines (about $4.98) use assumed rates, and the worst-case column just copies the plan figures. The ×2 worst case is applied only to nanogen, the cheapest and best-documented cost. At 2× on imagegen2 (likely for 1536×1024 transparent medium), the worst case is about $21.80. That is over $20 before audio retries. The hard checkpoint only comes at build step 5, after all of chapter I's sheets are made.
Why it matters: The budget could run out in chapter IV or V, which have the most bosses.
Suggestion:
- Measure the anchor and the E2 sheet cost in build step 2 and re-project there.
- Show imagegen2 at 2× in the worst-case column.
- Pre-commit the cuts: anim8gen, should-portraits, item-icon sheet. If imagegen2 measures above about $0.10 a sheet, use `low` quality for the prop sheets, which shrink to 12 to 64px anyway.
Evidence: GAME_DESIGN 670-688; imagegen2 SKILL.md lists no prices (`grep -n price` finds nothing).

### 8. Some actions in the design have no sound
Severity: should-fix
What's wrong:
- **Rushing water:** none, though two puzzle payoffs need one (the sewer sluice flood, the Drowned Passage draining).
- **Alarm:** none, though the Wyrm sounds alarms twice (STORY 550, 574).
- **Serpent hiss:** none, though there are 5 serpents (Nebet, temple python, asps, Thulamon's serpent phase, the Steward).
- **Crowd:** neither a revolt roar (STORY 668) nor the `crowd` ambience exists.
Why it matters: "A sound on every action" is a must-have in the juice list, and these are big story beats.
Suggestion: Add water rush, alarm klaxon (machine-like), serpent hiss and crowd-roar loop: 4 more sfx, about +$0.48. Or write down an explicit reuse for each.
Evidence: GAME_DESIGN 474-488; STORY 377, 472, 550, 574, 668.

### 9. Loop points need a measured method, not the prompt's BPM
Severity: nice
What's wrong: "trimmed to a bar boundary" assumes the clip really plays at the BPM in the prompt. ElevenLabs drifts from requested tempos, and audiogen has no loop flag for music (SKILL.md 97, 287).
Why it matters: A loop point off the beat shows up as a hiccup every 60 to 75 s, which breaks the "no audible seam" item in the definition of done.
Suggestion: In a node or Python tool, cross-correlate the clip's last 4 s against its first 8 s to pick the loop point. Store loopStart, loopEnd and crossfade in assets/manifest.json. Also say that if finale is cut, the Stillness pad crossfades into boss.
Evidence: audiogen SKILL.md lines 97-99, 285-291.

### 10. Cropped-head portraits clash with the generated ones
Severity: nice
What's wrong: Nine speakers (Gorm, Ilk, Uzzah, the silver man and others) use "sprite head cropped and scaled ×4". The head on a 48px sprite is about 12 to 14px, which becomes a 64px block of fat pixels next to 10 to 16 detailed nanogen portraits. Gorm and Uzzah speak a lot.
Why it matters: The dialogue panel looks like two different games.
Suggestion: Generate all the minor portraits with nanogen 512 edit (9 × $0.022 is about $0.20). Or show every non-main speaker as a framed upper-body sprite at 2×, with no fake portrait.
Evidence: GAME_DESIGN 520-522; nanogen cost table, SKILL.md line 404.

The pipeline itself (one sprite anchor, one background anchor, palette remap, hard alpha) is sound and should give one coherent look once findings 3, 4 and 6 are fixed. None of the findings is a must-fix.

