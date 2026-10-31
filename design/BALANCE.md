# BarbarAIn — balance appendix

Starting numbers for every stat block, skill, fight reward and price. They are
a first pass made to add up (XP sums were checked with node); `tools/sim.mjs`
proves or corrects them before content is final. When the sim changes a number,
change it here too. Formulas live in GAME_DESIGN.md ("Stats and formulas");
this file holds the numbers they eat.

## 1. Party level and XP

- **One party level.** Every member (including frozen or absent ones) gets the
  full XP of every battle, and late joiners join at the party level, so all
  four always share one level. The data keeps one `party.xp`; each member has
  their own stat line.
- **XP and gold belong to the encounter**, not the enemy (`ENCOUNTERS.x.xp`,
  `.gold`, DATA_SPEC §10). They are paid **once**, when the encounter ends in a
  win or a scripted end: the sparring duel pays either way, and Uzzah fleeing
  at 20% ends e4_pens as a win. Summoned or called-in enemies (shadows, asps,
  Ortho's extra cutthroat) give 0. Encounters marked `optional: true` (Great
  Gull, Seek trouble) are left out of the chapter sums. So the solution
  script's XP is exact, and "level matches the next snapshot" is a fair check.
- XP to next level = `round(18 × L^1.55)`. Cumulative XP to *reach* a level:

| Lv | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| XP | 18 | 71 | 170 | 324 | 542 | 831 | 1198 | 1650 | 2192 | 2831 | 3571 | 4418 | 5377 | 6453 | 7650 | 8973 | 10427 |

- Chapter targets: start of I Lv 1, II Lv 5, III Lv 9, IV Lv 12, V Lv 15, final
  boss Lv 17. Placed fights alone hit these exactly (section 4), in the order
  of the solution scripts (`tools/solutions/ch1..5.json`). Optional fights
  (Great Gull, Seek trouble) can push at most about one level over.
- Seek trouble fights give 25% of the XP and gold of the area's first placed
  fight, so grinding helps but doesn't trivialise.

## 2. Party stats

Base at Lv 1 and Lv 17; every level in between is linear:
`stat(L) = round(b1 + (b17 − b1) × (L − 1) / 16)`. Levels 18 to 20 extend the
same line. Order: HP / MP / ATK / DEF / AGI / WIL (before gear).

| Member | Lv 1 | Lv 5 | Lv 9 | Lv 12 | Lv 15 | Lv 17 |
|---|---|---|---|---|---|---|
| Kord | 60/8/12/6/7/3 | 175/21/25/13/11/5 | 290/34/37/20/15/8 | 376/44/46/25/17/9 | 463/54/56/31/20/11 | 520/60/62/34/22/12 |
| Toktai | 42/12/9/4/12/5 | 122/32/19/9/19/8 | 201/51/29/14/26/12 | 261/66/36/18/31/14 | 320/80/43/22/37/16 | 360/90/48/24/40/18 |
| Ain | 30/30/2/5/9/12 | 93/83/4/10/14/25 | 155/135/5/16/19/38 | 202/174/6/19/22/48 | 249/214/7/23/26/58 | 280/240/8/26/28/64 |
| Valka | 50/14/11/5/11/6 | 145/38/22/11/17/10 | 240/62/34/17/23/13 | 311/80/42/21/27/16 | 383/98/50/25/31/18 | 430/110/56/28/34/20 |

**Bakari (guest, chapter IV pens and catacombs, and phase 3 of the final
battle).** Fixed stats, no gear, no XP, AI-controlled, 5th battle slot.
Lv 13: 520/0/60/30/18/10. Lv 17: 700/0/78/38/22/12. Weapon: Kushite Maul,
power 34, crush. Moves: Maul Swing (1.2×, 15% stun); every 3rd turn Lion's
Song (party ATK +20% for 2 rounds and he Taunts). A battle is lost when every
non-guest member is down, whatever Bakari's HP.

## 3. Skills

Learned at party level unless a story beat is given. A member who joins late
knows every skill at or below the party level.

| Member | Skill | Learn | MP | Target | Effect |
|---|---|---|---|---|---|
| Kord | Cleave | Lv 1 | 4 | one | 1.5× physical |
| Kord | Sunder | Lv 3 | 5 | one | 1.0×, target DEF −30% for 3 rounds |
| Kord | Whirlwind | Lv 7 | 10 | all | 0.8× each |
| Kord | Crom's Fury | Lv 11 | 12 + 10% max HP | one | 3.0×, cannot miss |
| Kord | Crom's Roar | ch V gong | 8 | party | **acts first** (`actsFirst: true`); ATK +25% for 3 rounds; cures Stilled and Drowsy on all; in the Steward's phase 3 the first Roar wakes Bakari (the encounter's `onPlayerSkill` hook) |
| Toktai | Twin Shot | Lv 1 | 4 | one | 2 hits × 0.75 |
| Toktai | Pilfer | Lv 2 | 3 | one | steal (section 6); chance 50% + (Toktai AGI − target AGI)%, clamp 20 to 90% |
| Toktai | Pinning Shot | Lv 5 | 6 | one | 0.8×, 40% stun |
| Toktai | Smoke Pot | Lv 7 | 8 | party | evasion +25% for 3 rounds |
| Toktai | Poison Arrow | Lv 10 | 7 | one | 1.0×, 60% poison |
| Toktai | Arrow Storm | Lv 13 | 16 | all | 0.9× pierce each; full damage to flyers |
| Ain | Spark | joins (ch I) | 4 | one | shock, spell power 10 |
| Ain | Mend | joins | 5 | ally | heal WIL × 2 + 20 |
| Ain | Scan | joins | 2 (0 with Seer's Lens) | one | reveals HP, weak/resist/immune (saved to Bestiary) |
| Ain | Aegis | ch II lighthouse | 10 | party | DEF +40% for 3 rounds |
| Ain | Flare | ch II lighthouse | 12 | all | fire, spell power 14, ×0.8 per target |
| Ain | Mirage | ch II lighthouse | 9 | party | evasion +20% for 3 rounds |
| Ain | Rekindle | Lv 11 | 18 | ally | revive at 40% HP |
| Ain | Mend All | Lv 13 | 16 | party | heal WIL × 1.3 + 15 each |
| Ain | Overload | Lv 14 | 26 | all | shock, spell power 34, ×0.8 per target |
| Valka | Riposte | Lv 1 | 5 | self | counter the next 2 physical hits at 1.0× |
| Valka | Taunt | Lv 1 | 4 | self | enemies target Valka for 2 rounds |
| Valka | Bleeding Cut | Lv 6 | 6 | one | 1.1×, 70% bleed |
| Valka | Rally | Lv 9 | 12 | party | heal 15% max HP each |
| Valka | Corsair's Gambit | Lv 12 | 8 | — | seeded pick: 3.0× hit on a random enemy / party heal 30% / all enemies Blind / +50 silver / nothing ("Bah.") |

## 4. Enemies

### Tier formula

`T` = **the party level actually reached at that fight**: cumulative XP of
the placed fights before it, in solution-script order (checked by `sim.mjs`,
section 7). The tier is set per encounter entry (DATA_SPEC §10), so one enemy
id can appear at several tiers. Base stats:

- HP = 20 + 10T + T²
- ATK = 10 + 5T
- DEF = 3 + 1.7T
- AGI = 6 + 1.6T
- WIL = 3 + 2T

Role multipliers (HP / ATK / DEF): **minion** 1.8 / 1 / 1; **elite** 3.5 / 1.15 /
1.2; **mini-boss** 5 / 1.2 / 1.3; **boss** 4.5 / 1.25 / 1.3 (tuned by the sim;
see "Tuning changes"; the table lives in `enemies.js` as `TIER_RULES`). Then the
**party-size factor** from the encounter's `partySize` (planned non-guest
members): 2 members HP ×0.75 and ATK ×0.9; 3 members HP ×0.9; 4 members ×1.
Solo fights (tutorial, duel, Kord's chapter V halls) are hand-tuned with
their own multipliers and use 1. Then the per-enemy multipliers below. Round at the end. Multi-phase bosses have **one HP bar**;
phases change at HP thresholds (they don't refill). Saga difficulty: enemy HP
and ATK × 0.7, gold × 1.25.

### Placed fights (stats per encounter entry; XP and gold per encounter)

Party = `partySize`. The table below is generated from the engine
(`enemyStats` in `game/src/battle.js`) after the sim tuning; per-enemy
multipliers are the ones in `enemies.js` (an encounter entry's `mult`
replaces the enemy's).

| Enemy | Ch | Encounter | T | Party | Role | Multipliers | HP | ATK | DEF | AGI | WIL |
|---|---|---|---|---|---|---|---|---|---|---|---|
| gorm | I | e1_tutorial | 1 | 1 | minion | hp×0.77 atk×0.6 | 43 | 9 | 5 | 8 | 5 |
| drunk | I | e1_tutorial ×2 | 1 | 1 | minion | hp×0.28 atk×0.5 | 16 | 8 | 5 | 8 | 5 |
| turanian_merc | I | e1_hall_mercs ×2 | 2 | 2 | minion | — | 59 | 18 | 6 | 9 | 7 |
| shadow_cat | I | e1_library_cats ×2 | 2 | 2 | minion | hp×0.7 agi×1.5 | 42 | 18 | 6 | 14 | 7 |
| brass_sentinel | I | e1_sentinel | 3 | 2 | mini | def×1.2 agi×0.6 | 221 | 27 | 13 | 6 | 9 |
| ashkarran | I | e1_ashkarran | 4 | 2 | boss | wil×1.4 | 257 | 34 | 13 | 12 | 15 |
| summoned_shadow | I | (summoned in e1_ashkarran) | 4 | 2 | minion | hp×0.35 agi×1.4 | 36 | 27 | 10 | 17 | 11 |
| sewer_croc | I | e1_croc | 4 | 3 | mini | agi×0.7 | 342 | 36 | 13 | 9 | 11 |
| valka_duel | II | e2_duel | 5 | 1 | elite | hp×0.75 atk×0.7 agi×1.3 | 249 | 28 | 14 | 18 | 13 |
| giant_crab | II | e2_grotto_crabs ×2 | 5 | 4 | minion | def×1.6 agi×0.6 | 171 | 35 | 18 | 8 | 13 |
| cutthroat | II | e2_grotto_cutthroats ×3 | 6 | 4 | minion | — | 209 | 40 | 13 | 16 | 15 |
| sea_ghoul | II | e2_sluice_ghouls ×3 | 6 | 4 | minion | hp×1.1 | 230 | 40 | 13 | 16 | 15 |
| ortho_bosun | II | e2_hoard | 7 | 4 | elite | — | 487 | 52 | 18 | 17 | 17 |
| cutthroat | II | e2_hoard ×2 | 7 | 4 | minion | — | 250 | 45 | 15 | 17 | 17 |
| black_ortho | II | e2_ortho | 8 | 4 | boss | agi×1.2 | 738 | 63 | 22 | 23 | 19 |
| cutthroat | II | (summoned in e2_ortho) | 8 | 4 | minion | — | 295 | 50 | 17 | 19 | 19 |
| cutthroat | II | e2_ortho ×2 | 8 | 4 | minion | — | 295 | 50 | 17 | 19 | 19 |
| great_gull (optional) | II | e2_gull | 7 | 4 | elite | agi×1.3 | 487 | 52 | 18 | 22 | 17 |
| glass_spider | III | e3_spiders ×3 | 9 | 4 | minion | hp×0.8 agi×1.3 | 275 | 55 | 18 | 27 | 21 |
| brazen_man | III | e3_brazen | 9 | 4 | elite | def×1.2 agi×0.7 | 669 | 63 | 26 | 14 | 21 |
| serpent_drone | III | e3_drones ×3 | 10 | 4 | minion | hp×0.9 agi×1.2 | 356 | 60 | 20 | 26 | 23 |
| singing_pillar | III | e3_pillar | 10 | 4 | elite | atk×0 | 770 | 0 | 24 | 22 | 23 |
| serpent_drone | III | e3_pillar ×2 | 10 | 4 | minion | hp×0.9 agi×1.2 | 356 | 60 | 20 | 26 | 23 |
| warden | III | e3_warden | 11 | 4 | boss | — | 1130 | 81 | 28 | 24 | 25 |
| warden_arm | III | e3_warden (2 parts) | 11 | 4 | minion | hp×0.9 def×1.3 | 407 | 65 | 28 | 24 | 25 |
| stygian_slaver | IV | e4_slavers ×3 | 12 | 4 | minion | — | 511 | 70 | 23 | 25 | 27 |
| uzzah | IV | e4_pens | 12 | 4 | elite | atk×0.9 | 994 | 72 | 28 | 25 | 27 |
| pen_guard | IV | e4_pens ×2 | 12 | 4 | minion | — | 511 | 70 | 23 | 25 | 27 |
| mummy | IV | e4_mummies ×2 | 13 | 4 | minion | hp×1.3 agi×0.6 | 746 | 75 | 25 | 16 | 29 |
| acolyte_of_set | IV | e4_mummies | 13 | 4 | minion | hp×0.8 wil×1.3 | 459 | 75 | 25 | 27 | 38 |
| scarab_swarm | IV | e4_scarabs ×2 | 13 | 4 | minion | hp×0.9 agi×1.2 | 517 | 75 | 25 | 32 | 29 |
| temple_python | IV | e4_python | 13 | 4 | elite | hp×1.1 | 1228 | 86 | 30 | 27 | 29 |
| guardian_of_scales | IV | e4_guardian | 14 | 4 | mini | def×1.2 | 1780 | 96 | 42 | 28 | 31 |
| brazen_man | V | e5_halls_a | 15 | 1 | minion | hp×0.89 def×1.2 agi×0.7 | 633 | 85 | 34 | 21 | 33 |
| brazen_man | V | e5_halls_b | 15 | 1 | minion | hp×0.89 def×1.2 agi×0.7 | 633 | 85 | 34 | 21 | 33 |
| elite_brazen_man | V | e5_stair_a ×2 | 15 | 3 | elite | hp×0.45 def×1.2 agi×0.7 | 560 | 98 | 41 | 21 | 33 |
| elite_brazen_man | V | e5_stair_b | 16 | 3 | elite | hp×0.45 def×1.2 agi×0.7 | 618 | 103 | 43 | 22 | 35 |
| shadow_of_set | V | e5_stair_b | 16 | 3 | elite | hp×0.5 agi×1.4 | 687 | 103 | 36 | 44 | 35 |
| thulamon | V | e5_thulamon | 16 | 3 | boss | wil×1.3 | 1766 | 113 / 129 | 39 | 32 | 46 |
| asp | V | (summoned in e5_thulamon) | 16 | 3 | minion | hp×0.4 | 283 | 90 | 30 | 32 | 35 |
| steward | V | e5_steward | 17 | 3 | boss | hp×3.3 | 6402 | 119 / 131 / 143 | 41 | 33 | 37 |

| Encounter | XP | Gold | Encounter | XP | Gold |
|---|---|---|---|---|---|
| e1_tutorial | 18 | 0 | e3_spiders | 300 | 0 |
| e1_hall_mercs | 40 | 30 | e3_brazen | 320 | 0 |
| e1_library_cats | 56 | 16 | e3_drones | 330 | 0 |
| e1_sentinel | 70 | 40 | e3_pillar | 371 | 0 |
| e1_ashkarran | 90 | 60 | e3_warden | 600 | 0 |
| e1_croc | 50 | 30 | **ch III total** | **1921** | 0 (treasure instead) |
| **ch I total** | **324** | **176** | e4_slavers | 400 | 120 |
| e2_duel | 60 | 0 | e4_pens | 450 | 90 |
| e2_grotto_crabs | 180 | 40 | e4_mummies | 480 | 60 |
| e2_grotto_cutthroats | 220 | 75 | e4_scarabs | 420 | 40 |
| e2_sluice_ghouls | 250 | 60 | e4_python | 432 | 0 |
| e2_hoard | 266 | 110 | e4_guardian | 700 | 0 |
| e2_ortho | 350 | 150 | **ch IV total** | **2882** | **310** |
| **ch II total** | **1326** | **435** | e5_halls_a / _b | 350 / 350 | 0 |
| e2_gull (`optional`) | 80 | 0 | e5_stair_a / _b | 500 / 520 | 0 |
| | | | e5_thulamon | 800 | 0 |
| | | | e5_steward | 0 (the game ends) | 0 |
| | | | **ch V total** | **2520** | 0 |

Level check (cumulative XP in solution order, checked with node): the
tutorial gives Lv 2; Lv 3 after the cats; Lv 4 after the Sentinel; Ain joins
at Lv 4 and the crocodile is fought at Lv 4; Lv 5 after it. Lv 9 after Ortho,
Lv 12 after the Warden, Lv 15 after the Guardian, Lv 17 after Thulamon. The T
column above is exactly the level at each fight: 11 fights (cats, croc,
crabs, ghouls, hoard, brazen, pillar, pens, scarabs, python, stair_a) were
re-tiered one level down this round so the stats match the party players
really have. Chapter III's drones come after the Brazen Man in the solution
(the star-stone opens the door to the corridor).

### Tags, types, rules, steals and drops

`tags` drive "+25% vs X" weapons (human, beast, machine, undead, spirit) and
movement rules (flyer). W/R/I = weak (1.5×), resist (0.5×), immune (0).

| Enemy | Tags | W | R / I | Rules (engine extension points) | Steal | Drop |
|---|---|---|---|---|---|---|
| gorm, drunk | human | — | — | `flags.yieldsAt: 0` (gives up instead of dying); tutorial prompts | — | notched dagger, Horned Helm (scripted gift) |
| turanian_merc | human | — | — | basic | Bread and Dates | captain: tower key |
| shadow_cat | beast | fire | R pierce | 20% Bleed on hit (fought at T2 with 2 members: the first dungeon fight must not drain the chest draughts) | — | Healing Draught 30% |
| brass_sentinel | machine | crush | R slash, pierce | slow; Slam 1.3× every 3rd turn (telegraphed) | Healing Draught | Ashkarran's Bronze Mace |
| ashkarran | human | slash | R shock | telegraph "begins to chant" → `lightning` 1.8× all next turn; summons 1 Shadow at 70% and 35% HP (`when:{hpPctBelow:70, once:true}`, then 35); encounter `roundHooks:[{every:3, effect:'stone_heals'}]`: the caged stone heals each member 20% max HP ("Hold, thief.") | Lotus Tincture | — (the treasure is in the alcove) |
| summoned_shadow | spirit | fire, shock | R slash, pierce | evasive | — | — |
| sewer_croc | beast | shock, pierce | R slash | Bite; Tail Sweep 0.8× all every 3rd turn (telegraphed: "the tail coils") | Healing Draught | — |
| valka_duel | human | — | — | `flags.endsAtPct: 25` (either side below 25% ends it); Riposte | — | — |
| cutthroat | human | — | — | 20% Bleed | Throwing Knives | Healing Draught 25% |
| giant_crab | beast | crush | R slash | high DEF | — | pearl 15% |
| sea_ghoul | undead | fire, slash | R pierce | Drain (heals half the damage) | Antidote Herbs | — |
| great_gull | beast, flyer | pierce | — | Gust (Blind 30%) | — | Gull-feather |
| ortho_bosun | human | pierce | — | Sunder hit | Greater Draught | Brass Targe |
| black_ortho | human | — | — | Dirty Trick (Blind); calls 1 cutthroat (`when:{all:[{hpPctBelow:50},{alliesAlive:{lt:2}}]}`, max 1; gives 0 XP); 20% Bleed | Eye of Derketo | Ortho's Black Sabre |
| glass_spider | machine | crush | R pierce | shock bite | Star-cell | — |
| serpent_drone | machine, flyer | pierce | — | Beam | Lotus Tincture | — |
| brazen_man | machine | crush | R slash, pierce | Slam 1.3× | Greater Draught | ch III: star-stone 2 |
| singing_pillar | machine | crush | R shock | `flags.noAttack`; `aura:{status:'drowsy', target:'party'}` each round (Kord's member `immune:['drowsy','stilled']` skips him) | — | — |
| warden | machine | crush | R shock, slash | `parts: [{enemy:'warden_arm', name:'warden-arm-l'}, {…'warden-arm-r'}]` (the parts spawn the arms; the encounter lists only the warden); while any arm lives it strikes twice; telegraph "the core brightens" → `beam` 2× one; `flags.neverTarget:['ain']`; `autoHints.priorityTargets:['warden_arm']` | Star-cell | Sun-lance |
| warden_arm | machine | crush | R shock, slash | part of warden (spawned by `parts`; Auto and policies hit arms first via the warden's `autoHints`) | — | — |
| stygian_slaver | human | — | — | Net (stun 30%) | Antidote Herbs | slaver's writ, open shackles (story) |
| uzzah, pen_guard | human | — | — | Whip (Bleed 25%); Uzzah flees at 20% HP (`flags.fleesAt:20`; his fleeing ends the encounter as a win) | Coral Amulet (Uzzah) | key ring is a story item, already held |
| mummy | undead | fire | R pierce | Rot (poison 40%); slow | — | — |
| acolyte_of_set | human | slash | — | `aiRole: 'healer'` (Auto's "healers first" tag; `role` stays the stat role, minion): `heal_ally` 25% on `target:'ally_lowest_hp'` when `{allyHpBelow:60}`; poison dart | Smelling Salts | — |
| scarab_swarm | beast | fire | R slash, pierce | 3 small hits | — | Stygian scarab 20% |
| temple_python | beast | slash | — | Constrict (stun 1 round) | — | — |
| guardian_of_scales | machine | crush | R slash, pierce | Judgement 2× on the highest-HP member (telegraphed "the scale tips"); Weigh: party DEF −20% | Greater Draught | Sea-Queen's Sabre |
| elite_brazen_man | machine | crush | R slash, pierce | Slam 1.3×; code recolour of brazen_man | Greater Draught | — |
| shadow_of_set | spirit | shock, fire | R slash, pierce | Drain | Black Lotus Essence | — |
| thulamon | human → beast at 50% | slash | — / serpent phase R pierce | `phases: [{atHpPct:100, sprite:'enemy/thulamon', moves:['stillness_one','summon_asps','drain']}, {atHpPct:50, sprite:'enemy/thulamon-serpent', moves:['crush','venom'], mult:{atk:1.15}, tags:['beast'], resist:['pierce']}]`; `stillness_one` = Stilled on one member on rounds 4, 8, 12 (telegraphed); summons 2 asps once below 75% (asps give 0 XP) | Scarab of Life | — |
| asp | beast | slash | — | poison bite | — | — |
| steward | machine | — | R shock | `mult:{hp:3.3}`; phases at 66% (`mult:{atk:1.1}`) and 33% (`mult:{atk:1.2}`); `stillness_all` (Stilled on every member; Kord immune) on rounds 3, 7, 11, then every 4th, never on an Eye round, telegraphed one round ahead; `eye_open` move on `rounds:[5,10,15,20]` sets `flags.eyeOpen`: all hits ×3 that round; phase 3: `onPlayerSkill:{skill:'croms_roar', phase:3, once:true, effects:[{guest:'bakari', level:17}]}`. Order per round: roundHooks (Ain's breakthrough) at the start, then turns; Crom's Roar acts first. | — | — |

### Chapter V helpers (fixes the difficulty wall)

- **Frozen guards** in the Stilled Halls give, on Take: Temple Guard's Maul
  (power 40, crush, 20% stun, Kord), 3 Greater Draughts, 2 Smelling Salts,
  1 Kothian Fire-Wine ("It seems only fair.").
- **Ain breaks through** (at the start of rounds 3, 6, 9… in every chapter V
  fight, before anyone acts): heals each living member 20% max HP and cures
  Stilled. Its teal line plays in the log. In the Steward fight this lands a
  cure between each Stillness (3, 7, 11) and the next Eye (5, 10, 15): round 3
  breakthrough → Stillness → round 4 Roar (acts first) or Salts → Eye 5;
  Stillness 7 → breakthrough 9 → Eye 10; Stillness 11 → breakthrough 12 → Eye 15.
- **Rest between bosses:** after Thulamon falls, a full heal and an autosave
  ("Rest. Ten breaths. I will hold it.").
- With the Maul, Kord's solo fights with a Brazen Man take about 5 rounds
  ((56 + 4 + 40 − 17) × 1.5 ≈ 125 per hit against 633 HP), and a Slam
  (85 × 1.3 − Kord's DEF ≈ 70 × 0.5 ≈ 75) takes about 16% of his 463 HP
  (erratum: was "about 11%"). Ain's breakthrough every 3rd round heals 20%.

## 5. Gold: income against prices

Starting money 0; Gorm gives 10 silver after the tutorial. Sell price = half
the buy price; treasures sell for their listed value. **Inns:** the Drowned
Lamp (ch I) and the Hanged Gull (ch II) rest the party for 10 silver (full HP
and MP, autosave).

**Opening slack:** at the first shop visit Kord has 18 (Gorm 10 + dagger 8)
against needs of 8 (Shadizar Red 5, lamp oil 3), and the oil is free from
Oyuk (clued). One wrong 8-silver buy still leaves the puzzle solvable.

| Chapter | Income (fights + found gold + treasures) | Carried in (typical) | Shop and what it costs |
|---|---|---|---|
| I | Gorm 10; dagger sale 8; fights 176; Zamorian silver cup 40 (Hall of Echoes chest); alcove 300 | 0 | Ilk: Cudgel 20, Iron Cap 40, Zamorian Shortsword 60, Hunting Spear 70, Iron Mace 75, Woodcutter's Axe 80, Brigandine 120; Healing Draught 30. Drowned Lamp rest 10. **Before the Sentinel the player has about 96 silver** (Gorm 10 + dagger 8 + fights 46 + cup 40, minus wine 5 and maybe oil 3), enough for the Cudgel or the Iron Mace and a draught. The tower's lower floors are a short walk from the bazaar (garden wall → street). After the alcove there's no shop until chapter II, so the 300 carries over. |
| II | fights 435; pearl 90, smuggler's gold chain 150, hoard gold 200 | about 380 | Shipwrights: Corsair Bandana 90, Round Shield 160, Sea-wolf Coat 180, Harpoon 200, Boarding Axe 220, Composite Horn Bow 230, Argossean Rapier 240, Chain Hauberk 300 (total 1,620). Available ≈ 1,255: the player picks about two thirds. The shop stays reachable until "Set sail" (with a confirm). Kill-Devil Rum 5 and a rest for 10 at the Hanged Gull. |
| III | 2 Atlantean coins (200 each), star-fruit; free gear (Humming Blade, Star-iron Greatsword, Star-weave Mail, Aegis Disc, Bow of the Hours) | about 300 | no shop (inside the Wyrm) |
| IV | fights 310; Stygian scarab 250 (slavers' camp chest); catacombs gold 100, gold canopic jar 400 | about 700 | Khemi bazaar: Serpent Crest Helm 450, Nomad's Lamellar 650, Khopesh of Set 700, Stygian Glaive 750, Stygian Scale 900; Greater Draught 120, Smelling Salts 40. **About 1,070 on the first visit** buys one big piece plus potions; the catacomb loot (+500) buys a second. Bow of Kush is Bakari's gift. |
| V | none | leftovers | no shop; frozen guards (section 4) |

Play-test note (2026-10-30): `snapshots.js` gold follows the scripted solution route (II 470, III 280, IV 280, V 430: the route keeps the Atlantean coins until Khemi, where it sells them with the scarab to buy the Stygian Scale), so the replays' ±25% gold check holds both per chapter and across the continuous run.

## 6. Gear scoring for Best gear

Score of a loadout for a member (higher is better), with weapon power counted
as ATK and percentages as whole numbers:

| Member | Score |
|---|---|
| Kord | ATK × 1.0 + DEF × 0.8 + AGI × 0.5 + HP% × 0.5 |
| Toktai | ATK × 0.8 + AGI × 1.0 + DEF × 0.6 + crit × 0.5 |
| Valka | ATK × 1.0 + AGI × 0.8 + DEF × 0.7 + crit × 0.4 |
| Ain | WIL × 1.0 + MP% × 0.5 + DEF × 0.5 |

- An immunity or resistance is worth +6 if the current chapter's threat list
  (in chapter data: e.g. ch IV `threats: [poison, stun]`, ch V `[stilled]`)
  contains it, otherwise +1.
- "+25% vs X" counts as +10% ATK if the chapter threat list has X enemies.
- Two-handers and bows: compared against main hand + off-hand together.
- Kord never auto-equips a sorcerous (*) charm.
- Ties keep what is worn. Whole-party Best gear assigns slot by slot (weapon,
  off-hand, body, head, charm), giving each piece to the member who gains the
  most score, so it never steals a piece unless the gain is bigger for the
  new wearer.
- **Off-hand dagger rule:** a parrying dagger in the off-hand is a stat piece
  only (its DEF bonus, plus half its crit bonus). No second attack.


## 7. Sim targets (`tools/sim.mjs`)

**Party state comes from the solution replay, not from T.** For every placed
encounter, the sim takes the party as it really is at that battle in the
chapter's solution script (`tools/solutions/chN.json`):

- **Level** from the cumulative XP of the placed encounters before it, in
  script order. The sim prints the level and fails if it differs from the
  encounter's tier `T` (hand-tuned solo fights excepted).
- **Gear and items** from `tools/solutions/sim-loadouts.json`, one entry per
  encounter, purchases included (the Cudgel for the Sentinel):
  `{"e1_sentinel": {"equip": {"kord": {"weapon": "cudgel", "head":
  "horned_helm", "body": "leather_harness"}, "toktai": {…}}, "items":
  {"healing_draught": 2}}}`. The validator checks that every item in a
  loadout exists and was obtainable before that encounter (found, dropped, or
  in a shop reachable earlier). When the engine runs headless over the
  solution scripts (`node tools/sim.mjs --replay`), the file is regenerated
  from the replay's real state at each battle start.
- **HP/MP:** full after a heal point (chapter start, inn, spring, level-up,
  rest between bosses); otherwise what the previous fight's median run left.

Then 200 seeds per encounter on Warrior:

- regular fights with Auto: win ≥ 95%, median 3 to 6 rounds;
- mini-bosses with Auto: win ≥ 90%, median 4 to 8 rounds;
- bosses: win ≥ 80% with Auto, median 6 to 10 rounds; with the boss's
  **battle policy** (section 8) win ≥ 99% over the 200 seeds and win on the
  game's fixed seed for attempt 1 (the seed the typed replay uses);
- Saga: every fight ≥ 99%;
- the Sentinel with its loadout's crush weapon takes at most 60% of the rounds
  it takes with the same loadout and the Rusty Broadsword (slash);
- the Steward: on every seed, no Eye round (5, 10, 15) starts with Toktai or
  Valka Stilled;
- no fight where a party member drops below 0 HP in round 1 at full health.

The sim prints one line per encounter (level, win %, median rounds, median
party HP left) and exits non-zero on a miss.

## 8. Battle policies (scripted boss play)

A fixed list of commands can't survive a stun, an early kill or a changed turn
order, so bosses are proved by a small **priority policy** in Auto's
vocabulary. Policies are test fixtures in `tools/solutions/policies/`, never
game data, and game data never points at them:

```json
{ "encounter": "e3_warden",
  "rules": [
    {"if": {"telegraph": true}, "do": {"act": "defend"}, "healer": {"act": "skill", "skill": "aegis"}},
    {"if": {"allyHpBelow": 35}, "do": {"act": "skill", "skill": "mend", "target": "ally_lowest_hp"}},
    {"if": {"partsAlive": {"gte": 1}}, "do": {"act": "attack", "target": "lowest:warden_arm"}},
    {"do": {"act": "best", "target": "warden"}} ] }
```

- `if` uses the closed `when` vocabulary of DATA_SPEC §10, read from the
  party's side; `do.act` is attack / skill / item / defend / best (Auto's
  pick for this member); `target` is an instance name (`warden-arm-l`),
  `lowest:<enemy id>`, `ally_lowest_hp` or `self`. Rules apply to whichever
  member's turn it is (`battle.awaiting`); a rule may name `who` to apply to
  one member only.
- The sim runs each policy over 200 seeds. The Playwright replay reads
  `state().battle` whenever `battle.awaiting` is set and `busy` is false,
  evaluates the policy, and types the resulting command (`attack
  warden-arm-l`), so the replay still uses real input.
- Regular fights in the solution scripts use `auto on`.

## Tuning changes (sim, battle engine build)

`node tools/sim.mjs` (200 seeds per fight, party replayed from
`tools/solutions/sim-loadouts.json`) met every §7 target only after these
changes. The numbers above already include them.

- **Role HP multipliers:** minion 1 → **1.8**, elite 2.2 → **3.5**, mini-boss
  3 → **5** (boss 4.5 unchanged). With the first-pass numbers every regular
  fight ended in 1–2 rounds (target 3–6) and the Guardian in 2.
- **Per-enemy HP multipliers** re-set so hand-tuned and summoned enemies keep
  their intended size under the new role table: gorm hp×1.4 → ×0.77, drunk
  ×0.5 → ×0.28, summoned_shadow ×0.6 → ×0.35, warden_arm ×1.6 → ×0.9, Kord's
  solo Brazen Men (e5_halls) ×1.6 → ×0.89, elite_brazen_man ×0.7 → ×0.45; new:
  shadow_cat hp×0.7, shadow_of_set hp×0.5.
- **Valka's duel:** hp×1.2 → ×0.75 (HP 249, as before) and **atk×0.7** (was
  ×1): Kord alone at Lv 5 won only 62% of duels. Now ≈ 97%.
- **The Steward:** hp×1.5 → **×3.3** (6402 HP). Eye rounds triple every hit,
  so at 2910 HP the fight ended on the first Eye (round 5); now it ends on
  the second (round 10), passing through phase 3 so the Roar can wake Bakari
  (≈ 75% of policy runs).
- **Poison and bleed on bosses and mini-bosses:** 1% of max HP per tick
  (5% on everyone else), so damage over time doesn't scale with boss HP.
- **Enemy crit chance** is 5% + AGI/8 % (the party keeps 5% + AGI/4 %), and
  **stun chances against bosses and mini-bosses are halved.**
- **Round structure** (needed for acts-first skills and fair telegraphs):
  each round, every member able to act chooses a command first; then all
  actions resolve in turn order (acts-first group by AGI, then AGI + seeded
  0–3). Defend takes effect the moment it is chosen and lasts the round.
  A telegraphed move is announced at the end of round N and resolves **last**
  in round N+1, so Defend always answers it. Moves that set a flag (the
  Eye) resolve at the start of the round, before commands.
- **Random single-target enemy attacks prefer members not yet attacked that
  round** (never the same member twice in round 1), which removes freak
  round-1 deaths (Ain at full HP to Black Ortho + a cutthroat).
- **Auto** keeps MP back (Ain: two to three Mends; Kord: one Roar once he
  knows it; Valka: one Rally in boss fights) and uses Crom's Fury only in
  boss and mini-boss fights.
- **Thulamon** phase 1 has a plain `bolt` besides Stillness, asps and drain.

Sim report after tuning (Warrior, 200 seeds; policy = the boss's battle
policy; Saga ≥ 99% everywhere; Sentinel with crush 5 rounds vs 14 with the
Rusty Broadsword; no Eye round starts with Toktai or Valka Stilled):

| Encounter | Lv | Auto win % | Median rounds | Policy win % (rounds) |
|---|---|---|---|---|
| e1_tutorial | 1 | 100.0 | 6 | — |
| e1_hall_mercs | 2 | 100.0 | 3 | — |
| e1_library_cats | 2 | 100.0 | 5 | — |
| e1_sentinel | 3 | 100.0 | 5 | 100.0 (8) |
| e1_ashkarran | 4 | 100.0 | 7 | 100.0 (8) |
| e1_croc | 4 | 100.0 | 6 | 100.0 (7) |
| e2_duel | 5 | 97.5 | 4 | — |
| e2_grotto_crabs | 5 | 100.0 | 3 | — |
| e2_grotto_cutthroats | 6 | 100.0 | 4 | — |
| e2_sluice_ghouls | 6 | 100.0 | 4 | — |
| e2_hoard | 7 | 100.0 | 5 | — |
| e2_ortho | 8 | 100.0 | 7 | 100.0 (8) |
| e3_spiders | 9 | 100.0 | 4 | — |
| e3_brazen | 9 | 100.0 | 4 | — |
| e3_drones | 10 | 100.0 | 5 | — |
| e3_pillar | 10 | 100.0 | 6 | — |
| e3_warden | 11 | 100.0 | 8 | 100.0 (11) |
| e4_slavers | 12 | 100.0 | 5 | — |
| e4_pens | 12 | 100.0 | 5 | — |
| e4_mummies | 13 | 100.0 | 4 | — |
| e4_scarabs | 13 | 100.0 | 3 | — |
| e4_python | 13 | 100.0 | 3 | — |
| e4_guardian | 14 | 100.0 | 4 | 100.0 (5) |
| e5_halls_a | 15 | 100.0 | 4 | — |
| e5_halls_b | 15 | 100.0 | 4 | — |
| e5_stair_a | 15 | 100.0 | 5 | — |
| e5_stair_b | 16 | 100.0 | 5 | — |
| e5_thulamon | 16 | 100.0 | 6 | 100.0 (6) |
| e5_steward | 17 | 100.0 | 10 | 100.0 (10) |
