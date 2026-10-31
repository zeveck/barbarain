# BarbarAIn

*A Cimmerian thief. A sorcerer's tower. A job that is not what it seems.*

## Pitch

A modern text adventure RPG set in Robert E. Howard's Hyborian Age. You read
vivid scene descriptions over a 16-bit picture of each place, tap keywords,
characters and exits (or type commands), solve comic inventory puzzles, and
fight turn-based battles with a party of up to four. It starts as a classic
heist in Shadizar the Wicked and spirals through pirates, a bronze sea-dragon,
and a serpent god's temple. The hook is the title: the barbarian (**Barbar**-)
and the strange companion **Ain**, who narrates the whole tale. (What Ain is,
and what the dragon and the god are, are the twists: keep them out of every
store text, meta tag, manifest and title screen.)

The full story, room by room, with every puzzle, twist and line of key
dialogue sketched, is in **`design/STORY.md`**. This file is the systems,
screens, assets and tech. Content data formats are in **`design/DATA_SPEC.md`**;
every number (stats, XP, gold, skills, prices) is in **`design/BALANCE.md`**.

## Settings

- Platform: both (desktop and phones)
- Target: web, plain HTML/CSS/JavaScript ES modules, no build step
- Scope: large (implied by the request); cut list below protects the finish
- Budget: $20 for generated art and audio; plan ≈ $15 (see Budget)
- Tools available: imagegen2 + anim8gen (OpenAI key ok), nanogen (Gemini ok),
  audiogen (ElevenLabs ok, restricted key: plan settled by first audio),
  Pillow, node, playwright-cli
- Decisions made on the player's behalf: see `design/BRIEF.md`. Key ones:
  original characters that evoke Howard's and the films' (no "Conan" name, no
  quotations); all five loose ideas used (heist, pirates, time-travel dragon,
  future robots, time travel) under one idea (an AI from the future); portrait
  phone layout; choice-based play with an optional command line.

## The player's fantasy

Be the barbarian: a scowling, laconic thief who solves most problems with a
sword and is wrong about only some of them; who distrusts sorcery and
civilization, yet ends up the one man a god-machine cannot predict. Gather a
loyal, quarrelsome band, get rich, get ambushed, get swallowed by a dragon,
and out-stubborn the end of the world.

## Core loop

- **10 seconds:** read a short, vivid paragraph; tap a highlighted noun, a
  person, an exit, or an item to use on something; get a punchy, often funny
  response.
- **1 minute:** a room: look around, talk, pick up or use things, maybe fight
  the monsters there (turn-based, 3 to 6 rounds), loot, move on.
- **Chapter (25 to 35 minutes):** a town hub with a 2-to-4-step puzzle chain
  that opens a dungeon of 3 to 5 rooms with fights, a light puzzle, a boss
  and a twist or cliffhanger. Each chapter has a natural break (autosave plus
  a "good place to stop" line) halfway through, so a 15-minute session ends
  somewhere sensible.
- **Session loop:** a level up every one or two fights, better weapons in
  every chapter, and a story that ends each chapter on a hook.

**The mechanic it lives or dies by:** the *scene interaction*: every room
must respond to sensible actions with good writing. Puzzles must be fair
(clued twice), combat quick and readable, and nothing may ever leave the
player stuck without a hint. The DATA_SPEC fallback chain guarantees a written
reply for every action, even the ones nobody planned.

## Controls

The same actions on every device. The UI is HTML (DOM) over and beside a
pixel-art canvas, so text is crisp, readable and scrollable.

### Desktop (mouse + keyboard)

| Action | Mouse | Keyboard |
|---|---|---|
| Look at / act on a thing | click a keyword in the text, a chip in the "Things here" row, or a thing in the picture → small action menu (Look, Take, Use, Talk) | type `look lamp`, `take key`, `talk oyuk` |
| Move | click an exit button (`N · Market Square`) | arrow keys or `n/s/e/w/u/d` in the command line, or `go market` |
| Use an item on something | Items → item → Use → targeting banner → click the target | `use oil on rag`, `give wine to bolo` |
| Combine two items | Items → item → Combine → second item | `combine oil with sash` |
| Choose a dialogue line / choice | click it | number keys `1`-`9`; in the command line, a bare number + Enter |
| Battle command | click Attack / Skill / Item / Defend / Flee / Repeat (acts on the current target shown on the button; click an enemy to change it); Auto toggle in the turn-order strip | `1`-`6`, arrows + Enter to change the target, `A` toggles Auto, `R` repeats last turn; or type `attack warden-arm-l`, `skill roar` (or `skill kord roar`: the name is only checked), `item draught kord`, `defend`, `flee`, `auto on` |
| Skip text animation | click the text | Space, or Enter (Enter rule: DATA_SPEC §15) |
| Open Items / Party / Journal / Map | tabs in the side panel | `I`, `P`, `J`, `M` (when the command line isn't focused); `/` focuses it, and so does Enter when there's no text running and nothing to confirm |
| Cancel targeting / close a panel | ✕ on the banner | Escape |
| Pause menu (save, load, settings) | ☰ button | Escape (when nothing else is open) |
| Mute | 🔊 button | `Ctrl+M` |

### Phone (touch), portrait

Planned against the **viewports** the play-test and real browsers give (not
screen sizes): iPhone 15 portrait **393×659**, landscape **734×343**
(Playwright's `iPhone 15` / `iPhone 15 landscape`, checked with
playwright-core's device list), and small Android **360×640**. Safe-area
insets (`env(safe-area-inset-*)`) come out of the same budget.

**The picture is never shown below 1×** (320×180 CSS px). When space is short
it drops to exactly 1× and is centred with dark side bands (or cropped at the
sides by up to 16 logical px, never a prop's tap area); it is never scaled
below 1.

| Area (top to bottom) | Explore at 393×659 | Busy (battle, dialogue) | What's there |
|---|---|---|---|
| Top bar | 36 | 36 (party HP/MP mini bars move in here) | chapter + room name, gold, ☰ menu, 🔊 |
| Scene picture | 221 (393 wide, 1.23×); 180 (1×) if the tray needs room | 180 (1×) | tap people and props in it; turn-order strip and Auto toggle overlay its top edge in battle |
| Party strip | 32 | collapsed into the top bar | 4 (+1 guest) tiny portraits with HP/MP bars (tap for Party) |
| Story text | flexible, ≥ 178 (≈ 219 at 1×) | ≥ 300 | scrolling log; keywords are inline links at normal line height, hit area padded vertically only |
| Action tray | ≤ 140 (chip row 40 + 2 button rows), scrolls | **capped at 2 button rows** (≤ 112) | Explore: "Things here" chips (horizontal scroll) + bag button, then exits and choices (min 48px tall, rows of 2). Battle: two rows of 3 big buttons |
| Tab bar | 52 | hidden in battle (tabs can't be used there); shown in dialogue | Play · Items · Party · Journal · Map |

At 360×640: picture 203 (1.125×) or 180 (1×); explore tray ≤ 140, story ≥ 200
at 1×. Long dialogue choice lists scroll inside the 2-row tray.

- **Using an item on touch:** choosing Use (in Items or the bag button's quick
  sheet) jumps back to Play and shows a sticky banner above the tray:
  "Using: Burning rag · tap a target · ✕". Valid targets (things, people, party
  members) pulse; the Things-here chips stay available as targets. Tapping an
  NPC tries give, then use; a thing uses the use chain (DATA_SPEC §6). Tapping
  ✕, the Items tab or empty picture cancels. Desktop uses the same banner (no
  custom cursor).
- **Battle on touch (one thumb):** the tray holds two rows: **Attack · Skill ·
  Item** and **Defend · Flee · Repeat**. Every command acts on the **current
  target**, named on the Attack button ("Attack ▸ Arm L"): by default the last
  target if still alive, else Auto's pick, so a turn is usually one tap.
  Tapping an enemy sprite (tap box ≥ 44 CSS px, even for 20-px asps) or the
  target name changes it. **Skill** and **Item** open a **bottom sheet** over
  the story log: 2 columns of 48px rows showing name, MP cost and a type icon
  (unaffordable ones greyed), up to 5 rows visible before it scrolls; ally
  skills then ask for an ally with the party portraits. **Repeat** re-runs the
  member's last command on the same or default target. **Auto** is a toggle
  in the turn-order strip (and `auto on|off`).
- **Command line on touch:** hidden by default (⌨ button). When it opens, the
  layout sizes itself from `visualViewport`: the picture and party strip hide
  while the keyboard is up, so the log and input stay visible.
- **Landscape phone (734×343):** a 48px tab rail on the left; the left column
  holds the picture at 1× (320×180), with the top-bar info and party strip
  stacked under it (36 + 32); the right column (≈ 366 wide) holds the story
  (≥ 220) and the tray (≤ 112, 2 rows). No top bar across the width.
- Tested sizes: **393×659** and **734×343** (iPhone 15 viewport), **360×640**,
  desktop **1280×800**.

## Structure and difficulty

Five chapters, each a town or hub, a puzzle chain, a dungeon and a twist.
Party levels in brackets (numbers in BALANCE.md).

| Ch | Name | Place | New things | Twist / hook |
|---|---|---|---|---|
| I | The Godstone of Shadizar | Shadizar the Wicked, Ashkarran's tower, sewers | scene tapping, tutorial brawl, shops, first puzzles (use/give/combine), Toktai joins, crush weakness, Ain joins | **Twist 1**: the jewel you stole hired you: it is a thinking machine from 12,000 years in the future (Lv 1→5) |
| II | Red Sails over Gallows Bay | pirate haven on the Barachan Isles, sea caves, Ortho's cove | Valka joins (sparring duel), Ain's powers wake, two parallel puzzle threads, pirates | cliffhanger: a bronze sea-dragon swallows the ship (Lv 5→9) |
| III | The Belly of the Wyrm | inside the "dragon" | future-tech weapons (shock damage), a time-window puzzle, the hum that freezes minds (Kord is immune) | **Twist 2**: the dragon is a time-ship, and the god Set who speaks to the Stygian priests is the machine mind that wears it as a body; its core sleeps under Khemi's Black Pyramid (Lv 9→12) |
| IV | The Black Pyramid of Khemi | Stygia: Khemi city, catacombs, pyramid | disguise heist ("Yes... master."), the sacred python, Bakari fights beside you (guest), the scales of judgement | **Twist 3**: Ain is the god-machine's own cut-out conscience, and its will is the key; the escape was staged so Ain would *want* to reach the core (Lv 12→15) |
| V | The Stillness | the frozen pyramid and its apex | Kord alone in a frozen world, his war-cry wakes his friends, final bosses, Ain breaking through from inside | **Surprise 4**: the narrator of the whole game is Ain, writing from the far future (Lv 15→17) |

**Difficulty curve.** Chapter I teaches one thing at a time: the opening is a
few taps in the tavern, then a scripted-easy tutorial brawl (Attack, Defend,
Item); the first real dungeon fight comes after the player has a companion and
a shop they can afford. Weaknesses (slash, pierce, crush, shock, fire) appear
in chapter I (the Brass Sentinel hates crush, and Ilk sells a 20-silver cudgel
the player can afford by then) and matter more from chapter III. Bosses
telegraph big moves one round ahead ("Ashkarran begins to chant..."), so
Defend is a real choice. Later chapters add status effects (poison, bleed,
stun, Stilled) and enemies that must be dealt with in an order (healers,
summoners, arms). Chapter V gives Kord the tools for his solo fights (a crush
maul and draughts from frozen guards, Ain breaking through to heal) and a full
heal and autosave between the two final bosses.

**Never frustrating:**

- Puzzles can't kill you or lock you out; a wrong action gets a funny reply.
  Every puzzle step is clued at least twice (description + an NPC or a
  companion). The Journal has **progressive hints** (3 levels) for the current
  objective, and "Ask the party" gives an in-character nudge.
- Losing a battle offers **Try again** (restart the battle from the moment
  before it started), **Load autosave** or **Switch to Saga**.
- Autosave on every room change and after every battle; manual save anywhere
  at rest (outside battles, dialogues and targeting), 3 slots.
- Two difficulty settings, changeable any time: **Saga** (story: enemies at
  70% HP and damage, 25% more gold) and **Warrior** (normal). Default Warrior.
- No random battles. Fights are placed in rooms and shown in the picture.
  In dungeons a **"Seek trouble"** action starts an optional fight from that
  area's table (one table per chapter) for players who want to grind.
- Full heal at chapter starts, the two inns (the Drowned Lamp and the Hanged
  Gull: "Rest", 10 silver, with autosave), the Glass Garden spring, every
  level-up, and between Thulamon and the Steward. The first boss also has
  help: the caged stone heals the party every 3rd round (STORY ch I step 8).

## Win, lose and progress

- **Win the game:** defeat the Steward in chapter V and see the epilogue.
- **Chapter progress:** the chapter's goals are listed in the Journal;
  finishing one plays a short scene and a chapter card.
- **Lose:** every non-guest party member at 0 HP. Game Over screen with a
  gloomy line ("Crom does not answer. He never does."), then Try again / Load /
  Saga.
- **Saved:** one `localStorage` key per slot (`barbarain.save.auto`, `.1`,
  `.2`, `.3`), each with a version number, a migration table and a reference
  check on load (DATA_SPEC §12); settings (volumes, mute, text speed,
  difficulty, show hotspots, font size) separately in `barbarain.settings`.
  Completed games unlock **New Game+** (nice-to-have; on the cut list).

## The RPG systems

### Party

| Member | Joins | Role | Weapons | MP skills |
|---|---|---|---|---|
| **Kord** of Cimmeria | start | heavy fighter, highest HP/ATK | swords, greatswords, axes, maces, spears, daggers; shields | Cleave, Sunder (armor down), Whirlwind (all), Crom's Fury (huge, costs HP too), Crom's Roar (ch V: party ATK up, wakes Stilled) |
| **Toktai** the Hyrkanian | ch I, freed from the stocks | fast archer-thief, crits, steals | bows, daggers | Twin Shot, Pilfer (steal), Pinning Shot (stun), Smoke Pot (party evasion), Poison Arrow, Arrow Storm (all) |
| **Ain** (the Godstone) | ch I end | caster/healer; a palm-sized gem floating beside the party | none (charms only) | Spark (shock), Mend, Scan (show weaknesses and HP), Aegis (party DEF), Flare (fire, all), Mirage (party evasion), Rekindle (revive), Mend All, Overload (big shock, all) |
| **Red Valka** | ch II, after a sparring duel | swift duelist, taunts and counters | swords, sabres, rapiers, daggers, off-hand dagger | Riposte (counter stance), Taunt, Bleeding Cut, Rally (party heal), Corsair's Gambit (random big effect) |
| **Bakari** of Kush (guest) | ch IV slave pens → catacombs; ch V final battle phase 3 | AI-controlled guest in a 5th battle slot: huge maul, Lion's Song | Kushite Maul (fixed) | Maul Swing, Lion's Song (party ATK up, taunts) |

All members share **one party level** (everyone gets every battle's XP;
joiners join at the party level). Ain's powers wake in stages (chapter I end:
Spark, Mend, Scan; chapter II lighthouse: Aegis, Flare, Mirage; later by
level). Kord cannot use scrolls or sorcerous charms ("Sorcery. Keep it away
from me."); this is a joke with a mechanical edge, since those items go to the
others. In chapter V, Ain is gone (inside the Steward) and the party is Kord,
then Kord, Toktai and Valka.

### Stats and formulas

- **HP, MP, ATK, DEF, AGI** (speed, evasion, crit), **WIL** (wonder power and
  resistance).
- Physical damage = `((ATK + weaponPower) × skillMult − DEF × 0.5)` × type
  multiplier (weak 1.5, normal 1, resist 0.5, immune 0) × tag bonus (e.g.
  +25% vs machines) × seeded random 0.9 to 1.1; crit (5% + AGI/4 % + weapon
  bonus) ×1.75; Defend halves damage taken; minimum 1.
- Wonder damage = `(WIL × 1.6 + spellPower) × type multiplier − enemy WIL × 0.4`.
- Hit chance 95% − (target AGI − attacker AGI)/2 %, clamped to 70 to 99%.
- Turn order: each round, members with an "acts first" weapon go first
  (sorted by AGI among themselves), then everyone else by AGI + seeded random
  0 to 3; a turn-order strip shows the next 6 actors.
- **Flyers** (tag) take half damage from melee weapons unless the weapon has
  `flyers` (bows) or the attack is a wonder or a thrown item.
- **Off-hand:** a shield or parrying dagger adds its stats only (a dagger adds
  its DEF bonus and half its crit bonus). No second attack. Two-handers and
  bows empty the off-hand.
- **Levels** 1 to 20. XP to next level = `round(18 × L^1.55)`. Growth is linear
  between each member's Lv 1 and Lv 17 stat lines (BALANCE.md §2); every level
  up fully restores HP and MP.
- **Status effects:** Poison (5% max HP per round), Bleed (damage when acting),
  Stun (lose a turn), Blind (−40% hit), Drowsy (−AGI, from the Stillness
  hum), Stilled (can't act; cured by Crom's Roar or Smelling Salts; Kord is
  immune), Guard, Riposte, Aegis, Mirage, Rage. Shown as code-drawn 12×12
  icons by the bars.
- **Damage types:** slash, pierce, crush, shock (future weapons, Ain), fire
  (oil bombs, Flare). Each enemy has weaknesses and resistances; they appear
  in the battle UI once found by Scan or by hitting with that type, and are
  remembered in the **Bestiary** (Journal tab).

### Battle engine rules (extension points)

Defined in DATA_SPEC §10 (data forms, the MOVES table and the closed `when`
vocabulary) and filled in BALANCE.md §4. All of them exist before chapter I's
fights are written:

- enemy `tags[]` (human, beast, machine, undead, spirit, flyer) for tag
  bonuses and the flyer rule;
- `MOVES` with multiplier, type, target shape, status, heal, drain, buff,
  summon and telegraph; enemy `ai[{when, move, target}]` rule lists over the
  closed `when` vocabulary (`every`, `rounds`, `hpPctBelow`+`once`,
  `allyHpBelow`, `alliesAlive`, `partsAlive`, `phase`, `afterTelegraph`,
  `notOnRounds`, `chance`);
- `parts[]` that spawn separately targetable enemies (the Warden's arms; the
  encounter lists only the root);
- `phases[{atHpPct, sprite, moves, mult, tags, weak, resist, immune}]` on one
  HP bar (Thulamon → serpent; the Steward's three phases);
- `flags{noAttack, yieldsAt, fleesAt, endsAtPct, neverTarget}` and
  `autoHints.priorityTargets` (one spelling each), `aiRole` (healer,
  summoner) separate from the stat `role`;
- `aura` (the Singing Pillar's Drowsy) and member `immune` (Kord: Stilled,
  Drowsy);
- `steal` tables for Pilfer, `drops`;
- encounter `tier` per entry (one enemy id at several tiers), `partySize`,
  `xp`/`gold` paid once, `optional`, `party` subset (Kord solo) and `guest`
  (Bakari);
- `roundHooks` at the start of a round (Ashkarran's caged stone, chapter V's
  breakthroughs) and `onPlayerSkill` hooks (the Steward's phase 3 Roar);
- `actsFirst` on weapons and skills (spears, Crom's Roar);
- counters (Riposte) and Taunt as statuses the targeting step reads;
- stable enemy instance names (`cutthroat-a`, `warden-arm-l`).

**Auto** (a QoL toggle and the sim's player) follows one priority list:

1. an ally is Stilled → Crom's Roar (Kord) or Smelling Salts;
2. an ally is under 35% HP → Mend / Rally / a draught; a fallen ally →
   Rekindle / Fire-Wine;
3. the enemy telegraphed a big move → Defend (the healer heals instead);
4. `eyeOpen` → everyone's strongest attack on the Eye;
5. targets in the enemy's `autoHints.priorityTargets` (arms), then enemies
   with `aiRole` healer, then summoner;
6. otherwise the best known damage type on the lowest-HP enemy; Ain Scans an
   unknown boss once.

Bosses are also proved by a **battle policy** per boss
(`tools/solutions/policies/<encounter>.json`, BALANCE §8): a short priority
list in Auto's vocabulary that the sim runs over 200 seeds and the typed
replay evaluates against `state()` turn by turn, so the play-test never
depends on Auto's luck or on a fixed command list.

### Weapons, armor and items

About 32 weapons, 18 armor pieces, 12 charms, 12 consumables, plus key items
and sellable treasures (full tables in STORY.md, appendix A; prices against
income in BALANCE.md §5). Highlights:

- **A real range of weapons**, each class with a feel: swords (balanced),
  greatswords (two-handed, slow, huge), axes (chance to Sunder armor), maces
  and clubs (crush, stun chance; bronze and skeletons hate them), spears
  (pierce, act first), daggers (crit, can go in the off-hand), bows (pierce,
  full damage to flyers), and future weapons (shock: the Humming Blade, the Bow
  of the Hours). Signature finds: the Lion-hilt Broadsword, Ashkarran's Bronze
  Mace, Ortho's Black Sabre, the Humming Blade, the Khopesh of Set, the
  Atlantean Blade.
- **Slots:** Weapon, Off-hand (shield or parrying dagger; empty with
  two-handers and bows), Body, Head, Charm. Ain has only a Charm slot.
- **Kord's look from minute two:** Gorm gives him the **Horned Helm** after
  the tutorial brawl, so every player sees the iconic silhouette.
- **Consumables** usable in and out of battle: Bread and Dates, Healing
  Draught, Greater Draught, Lotus Tincture (MP), Black Lotus Essence (MP),
  Kothian Fire-Wine (revive), Antidote Herbs, Smelling Salts, Oil Bomb
  (fire, all enemies), Throwing Knives, Star-cell (Ain full MP).

### Inventory quality of life (a headline feature)

- One shared party bag, no weight limit, stacks of consumables.
- Tabs: **All · Weapons · Armor · Charms · Use · Key**, and a sort toggle
  (type / power / value / newest). New items carry a **NEW** badge until seen.
- Tapping a piece of gear shows its stats, type, specials, who can use it, and
  a **comparison row for each eligible party member** (green ▲ / red ▼ deltas
  against what they wear). One tap: **Equip on Kord / Toktai / Valka**.
- **Best gear**: one button per character (and one for the whole party). It
  scores loadouts by role (BALANCE.md §6: e.g. Kord ATK×1 + DEF×0.8 + AGI×0.5
  + HP%×0.5), values immunities only against the current chapter's threats,
  compares a two-hander against main hand + off-hand, never puts a sorcerous
  charm on Kord, and only moves a piece between members when the new wearer
  gains more than the old one loses.
- After a loot drop, a toast offers **Equip now** when the new piece is an
  upgrade for someone.
- Key items can't be sold or dropped; they show a hint of what they're for
  once you've learned it. Companions present (Ain, Toktai) are listed under
  **Key** so they can be used on things. **Use** starts targeting mode (the
  banner, see Controls). **Combine** pairs two items. Equipped gear counts as
  held for puzzles (`use humming blade on ring` works while it's in Kord's
  hand).
- Shops: buy/sell lists with the same comparisons, quantity steppers, and
  **Sell all treasures** (sells only items marked as treasure, never gear or
  key items).
- In battle, the Item menu shows only usable items, with counts.

## Screens

- **Title:** key art (Ashkarran's tower at night over Shadizar's rooftops; a
  faint teal glint at one window, drawn in code), the BarbarAIn logo drawn in
  code with the "AI" glowing teal, Continue / New Game / Load / Settings /
  Credits. "Tap to begin" also unlocks audio.
- **First start:** no How-to-play card. The opening chronicle card (one short
  paragraph, tap to continue), then the tavern: 4 tappable things and a
  first-time tip ("Tap a glowing word to act on it."). More tips appear the
  first time each thing happens (first exit, first item, first battle, first
  Use, first shop). Gorm interrupts on the third action or after ~30
  seconds (room `onAction` / `onIdle` triggers, DATA_SPEC §3).
- **How to play:** in the pause menu: a code-drawn card using existing
  sprites (tap words, use items, fight, hints in the Journal).
- **Play screen:** picture, party strip, story log, Things-here row, action
  tray, tabs (see Controls). Desktop: picture and story on the left two
  thirds, side panel (Party / Items / Journal / Map) on the right third.
- **Dialogue:** portrait (64px art at 2x) beside the speaker's lines in the
  log, numbered reply choices in the tray.
- **Battle:** the picture becomes the battlefield (enemies left facing right,
  party right facing left, guest in a 5th slot behind), turn-order strip with
  the Auto toggle, damage numbers; two rows of command buttons in the tray
  (see Controls); skill and item bottom sheet; log lines in the story area.
  The room background is darkened 30 to 35% and desaturated about 40%, with a
  lighter floor band behind the sprites; enemies get a 1px light rim in code
  so dark sprites read.
- **Journal:** current objectives with Hint buttons, Bestiary; chapter recap
  and people met (on the cut list).
- **Map:** the chapter's rooms as a small node map drawn in code, visited
  rooms named, current room marked; tap a visited room to travel there
  (only outside dungeons and battles).
- **Pause menu (☰):** Resume, Save (3 slots), Load, Settings (music volume,
  sound volume, mute, text speed incl. instant, difficulty, show hotspots,
  font size), How to play, Quit to title.
- **Chapter card:** chapter number and name in the display font over art that
  doesn't spoil what's coming: I = title tower, II = the Gallows Bay docks
  background, III = the Wyrm rising (the hook just seen), IV = the beached
  Wyrm background, V = stilled Khemi under a moonless sky. Tap to continue.
- **Game over:** dark, line from Kord's gods, Try again / Load / Saga mode.
- **Victory / epilogue:** dawn at sea, the teal sliver in Kord's hand, the
  last page (Ain beside the quiet Steward in the far future), credits,
  "Thanks for playing", New Game+ (if built).

## Juice

Must-haves marked ★.

- ★ SNES-style **mosaic** transition into and out of battle (with a swoosh);
  fade between rooms.
- ★ Damage numbers that pop and fall; crits bigger and gold; heals green;
  "WEAK!" / "RESIST" tags.
- ★ Hit flash (enemy sprite white for 2 frames) and a small shake on the
  struck sprite; screen shake on crits and boss attacks.
- ★ Attacker steps forward toward the target and back; enemy death
  dissolves pixel by pixel.
- ★ Typewriter text (fast, skippable, instant option) with a soft code-made
  tick; keywords fade in highlighted.
- ★ A sound on every action: tap, item, door, equip, coins, chest, puzzle
  solved.
- ★ Level-up fanfare with a stat panel that counts up.
- ★ The teal glints that foreshadow the machine are drawn in code, so they
  are the only teal on screen outside machine scenes: the tower window on the
  title art, the tower's teal lamp in twr-hall, the severed bronze head's eyes
  in twr-workshop, the hounds' eyes, the Lady's eyes, the dark tavern corner,
  the acolytes' amulets in the stairwell (escape), and the teal glow over the
  sea in sea-deck (a code tint, since the background is non-machine).
- Ambient scene life drawn in code: torch flicker light, drifting dust or
  sea spray, rain at Gallows Bay, heat shimmer in Khemi, teal motes in the
  Wyrm.
- Puzzle solved: a gold "✦" chime and a subtle glow on the solved prop.
- Loot: items arc out of a chest, gold counter rolls up.
- Boss telegraphs: picture tints red, warning line in the log.
- Ain speaks in teal with a faint code-made blip per line.

## Art direction

- **Style line (paste into every image prompt):** "16-bit SNES-era pixel art
  for a sword-and-sorcery RPG, Hyborian Age, rich saturated palette of burnt
  orange sand, blood crimson, bronze gold, deep indigo night and dark jade
  serpent green, crisp dark outlines, dramatic torchlight, chunky readable
  shapes, no text."
- **Teal = the machine, enforced.** Every asset is tagged `machine` or not in
  `design/ASSETS.md`. Non-machine prompts add: "sea and water in deep indigo
  and slate green, no cyan, no turquoise, no teal". Only machine prompts add:
  "its eyes/veins/light glow cyan-teal". The pixelize step remaps non-machine
  assets to the **world palette** (no teal band) and machine assets to the
  **machine palette** (world + 8 teal shades, hue 165 to 195°), and reports
  any teal left in a non-machine asset (must be 0). Machine assets: Ain, the
  Lady in Grey and Lady of the Waves, bronze hounds, Brass Sentinel,
  Ashkarran unveiled, the silver man, glass spiders, drones, Brazen Men, the
  Warden, the Singing Pillar, the Guardian of Scales, the Steward, the
  machine props (egg-socket door, ring of glass, bronze head), all `wyr-*`
  backgrounds, `pyr-heart`, `pyr-apex`, and the key art pieces godstone-reveal,
  wyrm-rising, ouroboros-heart, serpent-altar, teal-sliver, last-page.
- **Master palette.** `tools/palette.py` builds `assets/palette-world.png`
  (about 64 colours) in two steps. (1) **Seed ramps set by hand**: a 4- to
  5-step ramp for each style-line hue (burnt orange sand, blood crimson,
  bronze gold, deep indigo night, dark jade serpent green) plus skin (two
  ramps), copper (Valka's braid), sea-green (her coat), slate sea, stone grey
  and black. (2) **Sampled colours** merged in from the accepted Kord sprite
  and six test backgrounds that cover warm, night, sea, garden and stone:
  shz-tavern, shz-bazaar, gal-docks, sea-deck, wyr-garden and pyr-catacombs.
  Before sampling, every pixel in the teal band (hue 165 to 195°, saturation
  > 0.25) is **dropped from the world sources**, so teal can't leak into the
  world palette. Posterization is then checked on two backgrounds not used
  as sources (shz-garden, gal-cove) before the batch. `palette-machine.png`
  = world + 8 teal. Every asset is remapped to one of them with no dithering
  on sprites (backgrounds may use a light 2×2 ordered dither on gradients
  only). The CSS chrome colours, code glints, Ain's text colour and the
  code-drawn icons read the same palette (`assets/palette.json`).
- **Anchors.** (1) Sprite anchor: Kord's battle sprite (full body, facing left,
  horned helm, broadsword, fur and leather harness, black square-cut mane, blue
  eyes, scarred bronzed skin), made first with imagegen2 and used as the
  reference image for every character, enemy and prop sheet. (2) Background
  anchor: shz-tavern, made first with nanogen at 1K, pixelized, and passed as
  nanogen's `--image` reference for every other background and key art piece.
  (3) Portrait anchor: Kord's portrait made with nanogen edit mode from the
  accepted Kord sprite; every other portrait gets the Kord portrait plus that
  character's accepted sprite as references.
- **Prototype before the batch:** anchor sprite, palette, tavern background,
  one enemy sheet and the Kord portrait go through the whole pipeline and are
  looked at in the running game before anything else is generated.
- **Logical resolution:** the scene canvas is **320×180**, never shown below
  1× (see Rendering in the tech plan for even pixels at fractional sizes). **One human height,
  48px, in scenes and in battle** (Kord 52, Toktai 46); Ain 20px with a
  code-drawn halo; beasts and bosses scale from that (tavern dog 20, hound
  26, crocodile 40 tall, Warden 120, the Steward up to 140); portraits 64×64;
  item icons 16×16 (shown at 2x or 3x).
- **Facing:** party sprites face left; every NPC and enemy faces right (3/4
  view), so an NPC who becomes an enemy (Gorm, Uzzah) uses the same sprite.
  Valka's duel sprite and Bakari's guest sprite are mirrors (free).
- **Sprite prompts:** "pixel art drawn on a 48-pixel-tall grid, large flat
  pixels, no anti-aliasing, silhouette-first, low detail" + style line.
- **Pixelize (`tools/pixelize.py`), one pass:** (1) crop to the alpha
  bounding box; (2) a **single** reduction straight to the target size (box
  filter for backgrounds, mode filter over each source block for sprites:
  each target pixel takes the most common palette-snapped colour of its
  source area); (3) remap to the world or machine palette; (4) binary alpha
  at 50%; (5) add a 1px outline in the palette's darkest colour **only where
  the edge pixel isn't already dark** (so outlines are never 2px). No second
  resample: nearest-neighbour is used only for integer up-scaling. Grid
  detection runs only as a report ("source block ≈ 21px") to catch odd
  outputs. Teal report as before.
- **Slicing sheets (`tools/slice_sheet.py`):** find sprites by **alpha
  connected components**, merge pieces closer than 6 source px (a sword tip,
  a tail), sort them into rows by centre, and **require the expected count**
  from the sheet's cell list; names are assigned in reading order. A wrong
  count or a piece touching the image edge fails the sheet and lists the
  cells to **regenerate alone** as single sprites (the budget's single-cell
  fixes line). Each sprite's baseline is its lowest opaque row.
- **anim8gen frames:** anim8gen fits and aligns frames to its own canvas
  (SKILL.md: alignment, `segmentation.minDetachedPixels`), so its scale has
  nothing to do with the idle sprite's. For each animation, compute **one
  factor** that makes frame 1's figure height equal the idle sprite's height
  (52, 46 or 48px), apply it to every frame through the same one-pass
  pixelize, and align every frame's baseline to the idle sprite's feet.
- **Props for puzzles:** every object a puzzle or a twist clue depends on is a
  separate transparent prop sprite placed in code (DATA_SPEC §3), so its tap
  area is its own box (min 44 CSS px). Backgrounds are scenery only.
- **No mixed sheets:** a sheet is either all machine (its prompt asks for
  teal eyes and veins) or all non-machine (its prompt forbids cyan and teal);
  machine cells never share a sheet with non-machine ones.
- **Backgrounds:** nanogen at 512, 16:9, opaque, pixelized to 320×180. Prompt
  adds: "open, uncluttered floor across the whole lower third, no characters".
- **Text is never in images.** All titles, names and UI are drawn in code with
  bundled OFL fonts: a pixel font for UI labels and numbers, a readable book
  serif for the story, and a chiselled display face for the logo and chapter
  cards (picked from Google Fonts, licences bundled).
- **UI chrome:** CSS: dark leather-brown panels with a bronze 2px border, a
  parchment tint for the story text area, crimson accents, teal for Ain only.

## Audio direction

Music: instrumental, generated at the lengths below. Every prompt includes
"no intro, no ending, no fade-out, steady N BPM, constant energy, seamless
loop". audiogen has no loop flag for music and ElevenLabs drifts from the
requested tempo (audiogen SKILL.md "Loop Caveat"), so the BPM is only a
prompt word: **loop points are measured**, not computed from it.
`tools/loopfind.mjs` cross-correlates the clip's last 4 s against its first
8 s (mono, downsampled envelope plus waveform refinement) and picks the best
match; it stores `loopStart`, `loopEnd` and `crossfade` per track in
`game/assets/manifest.json`, and writes a 6 s preview of the seam for a
listen. `audio.js` loops each track with two overlapping sources and that
crossfade:

| ID | Mood | Gen length | BPM | Loop crossfade |
|---|---|---|---|---|
| title | epic sword-and-sorcery theme: war drums, low brass, a lone horn, a faint cold synth shimmer; key of D minor | 60 s | 80 | 2.0 s |
| shadizar | sly, sultry desert bazaar: oud, darbuka, finger cymbals, menace at night | 60 s | 96 | 1.5 s |
| dungeon | dark ambient crawl: low drones, distant drums, dripping | 75 s | 70 | 2.0 s |
| battle | driving percussion, staccato brass and strings, heroic | 75 s | 140 | 1.5 s |
| boss | heavier, tribal drums and dark brass with a pulsing synth undertone | 75 s | 120 | 1.5 s |
| gallows | rowdy pirate harbor: fiddle, hand drum, creaking timbers | 60 s | 112 | 1.5 s |
| wyrm | eerie, futuristic and ancient at once: analog synth pulses over ritual drums | 60 s | 90 | 2.0 s |
| khemi | Stygian dread: snake-charmer flute, low brass, slow processional drums | 60 s | 76 | 2.0 s |
| finale | the final boss: war drums, low brass, lone horn and synth at full battle intensity; key of D minor, same instruments as title | 75 s | 140 | 1.5 s |
| ending | melancholy, heroic farewell on a solo horn over soft strings; key of D minor, same horn as title | 60 s | 72 | plays once over credits, then loops title |

- Crossfade 1 s between tracks on scene change; never two copies of a track.
- **Stillness** is not a music track: a looping choir-like pad made as an
  audiogen SFX loop, plus a code-made heartbeat thump; before the final battle
  code ramps its volume up and crossfades into finale (or into boss if finale
  is cut).
- The shared "motif" is approximated by sharing key, tempo words and
  instruments; no melody is promised.

Sound effects (audiogen, punchy 0.3 to 2 s; loops 10 to 20 s with `--loop`):

- **Combat (16):** sword slash, heavy blunt hit (crits reuse it louder and
  pitched down), arrow release and thunk, shock zap, fire whoosh, heal chime,
  Ain cast shimmer, miss whoosh (flee reuses it), shield/equip clang, enemy
  death, ally falls, potion drink, bronze servo whir, Wyrm roar, battle
  transition swoosh, chest open.
- **World (9):** item pickup, coins, door creak, stone door grind, the gong
  BONG, Kord's war-cry roar, **water-rush** (sewer sluice flood, Drowned
  Passage draining), **alarm** (machine klaxon: Window of Years, the Mind),
  **serpent-hiss** (Nebet, temple python, asps, Thulamon's serpent phase, the
  Steward's serpent).
- **Stingers (5):** victory fanfare, level up, puzzle solved ✦, chapter card,
  game over.
- **Loops (6):** tavern murmur, sea waves, rain, dungeon drip and wind,
  Stillness pad (the Singing Pillar reuses it, pitched up), **crowd**
  (market and street ambience; raised and layered with the war-cry for
  Bakari's revolt).
- **Made in code (WebAudio, free):** typewriter tick, UI tap, UI back, soft
  error, Ain's speech blip, save confirmation, heartbeat.

## Asset list

`machine` marks assets that may use teal. Sizes: generation → in game. Every
image goes through `tools/pixelize.py`. Sheets are 1536×1024 imagegen2 calls
with a transparent background, one character or prop per cell with clear
space between cells, the anchor as reference, sliced by
`tools/slice_sheet.py` (connected components, expected-count check). No sheet
mixes machine and non-machine cells.

| ID | What it is | Tool | Size → in game | Machine | Animation | Priority |
|---|---|---|---|---|---|---|
| kord-battle | **sprite anchor**: Kord full body facing left | imagegen2 medium | 1024 → 52px | no | code bob/step; anim8gen attack | must |
| palette-world, palette-machine | master palettes (hand-set ramps + sampled, teal band stripped) | Pillow (`tools/palette.py`) | ~64 / 72 colours | — | — | must |
| bg-shz-tavern | **background anchor** | nanogen 1K | → 320×180 | no | code torch flicker | must |
| toktai-battle, valka-battle | party sprites facing left | imagegen2 medium | 1024 → 46 / 48px | no | code | must |
| ain-battle | floating faceted gem, teal core | imagegen2 medium | 1024 → 20px | yes | code halo, bob | must |
| kord-attack, toktai-shoot, valka-lunge | 4-frame attack animations | anim8gen | 256 canvas → scaled so frame 1 = idle height, baseline on the idle feet | no | 4 frames | should |
| boss sprites ×7 + 2 edits | ashkarran (56), black-ortho (50), warden (120), warden-arm (48, mirrored for the other arm), thulamon (56), thulamon-serpent (130), steward (140; phases 2-3 by code cracks and glow); edits: ashkarran-unveiled (filaments), shadow-of-set (from summoned-shadow) | imagegen2 medium (edits with `--image`) | 1024 → as listed | warden, warden-arm, ashkarran-unveiled, steward | code flash, shake, dissolve, phase tint | must |
| mini-boss sprites ×2 | brass-sentinel (64), guardian-of-scales (110) | imagegen2 medium | 1024 → as listed | yes | code | must |
| enemy sheet E1 | shadow-cat, summoned-shadow, giant-crab, great-gull, scarab-swarm (24 to 40px) | imagegen2 sheet | → per cell | no | code | must (great-gull should) |
| enemy sheet E2 | drunk, turanian-merc, cutthroat, ortho-bosun, stygian-slaver, pen-guard (48px) | imagegen2 sheet | → 48px | no | code | must |
| enemy sheet E3 | acolyte-of-set, sea-ghoul, mummy, asp (24), sewer-croc (40 tall), temple-python (72 long) | imagegen2 sheet | → per cell | no | code | must |
| **machine sheet M1** | glass-spider, serpent-drone (32), brazen-man (48), singing-pillar (64), lady-grey (48, face right), silver-man (48), bronze-hound (26); props: bronze-head (16, teal eyes), egg-socket door (64), ring of glass (56, dark; lit by code glow) | imagegen2 sheet | → per cell | **all** | code; elite-brazen-man is a code palette swap | must |
| npc sheet N1 | oyuk, gorm, bolo, toktai-stocks, mother-hesh (48px, face right) | imagegen2 sheet | → 48px | no | code idle bob | must |
| npc sheet N2 | pashtu, ilk, lamp-seller, gilbo, one-ear-dash, mother-teg | imagegen2 sheet | → 48px | no | code | must (dash should) |
| npc sheet N3 | shrike-sailor, bakari, uzzah, gate-captain, herbalist, **temple-guard** (frozen guards and the priest in ch V by a code grey tint) | imagegen2 sheet | → 48px | no | code | must |
| npc sheet N4 | tavern-dog (20), old-nebet (python on steps, 40), drain-rat (10) | imagegen2 sheet | → per cell | no | code | must |
| lady-waves | the Lady of the Waves projection | imagegen2 edit of lady-grey | → 48px | yes | code shimmer | should |
| prop sheet P1 (ch I) | stocks, gate brazier, chamber pot, brass mouth, diary on lectern, chest closed, chest open | imagegen2 sheet | → 12 to 40px | no | code glow on solve | must |
| prop sheet P2 (ch II) | pirates' table, great lens crusted, great lens clean, winch, crank, smuggler's skeleton, sluice gate | imagegen2 sheet | → 12 to 48px | no | code | must |
| prop sheet P3 (ch III-IV) | **silver-skeleton** (Atlantean, silvery clothes, holding a sword; the Humming Blade is drawn by code as an item glint), rusted grate, street drain, scale with feather, weighing mural | imagegen2 sheet | → 16 to 64px | no | code | must |
| prop sheet P4 (ch I, IV-V) | rotten sluice board (sewer), sarcophagus, bronze gong, trophy shrine with the Atlantean Blade | imagegen2 sheet | → 16 to 56px | no | code | must |
| portraits ×10 must | kord, toktai, valka, ain, lady-grey, ashkarran, black-ortho, bakari, thulamon, steward | nanogen 512 edit (sprite + Kord portrait as refs) | → 64×64 | ain, lady-grey, steward | none | must |
| portraits ×6 should | oyuk, mother-hesh, bolo, pashtu, gilbo, mother-teg | nanogen 512 edit | → 64×64 | no | none | should |
| portraits ×8 minor | gorm, ilk, uzzah, one-ear-dash, gate-captain, herbalist, lamp-seller, silver-man (the Shrike's crew speak as mother-teg) | nanogen 512 edit (sprite + Kord portrait as refs) | → 64×64 | silver-man | none | should (fallback for any portrait cut: the speaker's sprite, upper body, framed at 2×; never a ×4 cropped head) |
| backgrounds ×42 | every room in STORY.md (41) + wyr-window-past (nanogen edit of wyr-window) | nanogen 512, bg anchor as ref | → 320×180 | `wyr-*`, pyr-heart, pyr-apex | code ambient fx | must |
| keyart ×9 | title-tower (night, no stone visible; title, ch I card), godstone-reveal (ch I twist), wyrm-rising (ch II end, ch III card), ouroboros-heart (ch III twist, the Mind), serpent-altar (ch IV twist, the Heart), stilled-khemi (ch V card), dawn-at-sea (epilogue), teal-sliver (epilogue, in Kord's palm), last-page (Ain beside the quiet Steward, far future). Ids are used as `keyart/<id>` everywhere | nanogen 512, bg anchor as ref | → 320×180 | all but title-tower, stilled-khemi, dawn-at-sea | none | must (title, reveals, last-page, teal-sliver); should (rest) |
| item icons ×24 | one 6×4 sheet: sword, greatsword, axe, mace, spear, dagger, bow, future blade, shield, body armor, helm, charm ring, amulet, potion red, potion blue, wine, food, bomb, knives, scroll, key, gem/treasure, document, misc | imagegen2 low, one sheet | → 16×16 | no | none | should (code-drawn fallback) |
| status + type icons | 11 statuses, 5 damage types | code-drawn 12×12 from the world palette | — | — | — | must |
| app icon | Kord's horned helm silhouette against a moon, one faint teal glint | imagegen2 + code | 1024 → 512/192/maskable/180/32 | — | none | must |
| social card | 1200×630 composed in HTML from title-tower + logo + tagline | code (playwright screenshot) | 1200×630 | — | none | must |
| music ×10 | table above | audiogen music | 60 to 75 s; loop points measured (`tools/loopfind.mjs`) | — | loop table in manifest | must: title, shadizar, dungeon, battle, boss, ending; should: rest |
| sfx ×36 | list above (16 combat, 9 world, 5 stingers, 6 loops) | audiogen sfx | 0.3 to 2 s; loops 10 to 20 s | — | — | must: combat, world, stingers; should: loops (crowd must: the revolt beat) |

## Tech plan

```
game/
  index.html            page shell, meta/OG tags (spoiler-free tagline), manifest link, fonts
  style.css             layout (desktop 3-column, phone portrait/landscape), panels, chips, banner
  src/main.js           boot, screen router, autosave, visibility pause, debug hook
  src/state.js          game state, flags, save/load (slots, migrate, validate), seeded RNG, preBattleSnapshot
  src/ui.js             story log, typewriter, Things-here row, action tray, targeting banner, tabs, toasts, modals
  src/scene.js          320×180 canvas: background, props, NPC/enemy/party sprites, tap boxes, ambient fx, glints, mosaic
  src/parser.js         command-line parser → the same actions as buttons, incl. battle verbs and digit choices
  src/actions.js        look/take/use/give/combine/talk/hit/go/say; targeting; fallback chains
  src/conditions.js     condition and effect interpreters (DATA_SPEC §4)
  src/dialogue.js       dialogue and scene runner over data
  src/battle.js         turn-based battle engine (pure functions) + Auto
  src/battle-ui.js      battle rendering and input
  src/inventory.js      bag, equipment, compare, best gear scoring, shops
  src/audio.js          Web Audio: music loop table + crossfade, sfx, code blips, mute, volumes
  src/data/items.js, enemies.js (ENEMIES, MOVES, ENCOUNTERS), party.js, snapshots.js, recipes.js, defaults.js, scripts.js
  src/data/ch1.js … ch5.js  rooms, npcs registry, dialogue, scenes, objectives, shops, threats, seekTrouble (data only)
  manifest.webmanifest, sw.js, icons, social-card.jpg, fonts/, assets/ (+ assets/manifest.json: asset ids, loop points, palette.json)
tools/pixelize.py       one-pass: alpha crop, single reduction, palette remap, alpha, outline-if-needed, teal + grid report
tools/palette.py        hand-set ramps + sampled sources (teal band stripped) → world and machine palettes, palette.json
tools/slice_sheet.py    alpha connected components → named cells, expected-count check, regen list
tools/loopfind.mjs      music loop points by cross-correlation → assets/manifest.json
tools/validate.mjs      content checker (DATA_SPEC §13), run after every content change
tools/sim.mjs           battle balance sim (BALANCE.md §7); --replay runs headless over the solution scripts
tools/solutions/        ch1.json … ch5.json typed command scripts (regular fights: `auto on`); ch1-touch.json;
                        policies/<encounter>.json boss battle policies; sim-loadouts.json (test fixtures, not game data)
```

- **Rendering (even pixels at any size):** DOM for all text and controls; one
  canvas for the picture. The scene is drawn at 320×180 and then blitted to a
  backing canvas at an **integer scale k = ceil(displayed CSS width × DPR /
  320)** with `imageSmoothingEnabled = false`, so every art pixel becomes an
  exact k×k block. CSS then shows the canvas at its layout size with
  `image-rendering: auto`: a small, uniform **downscale** (at 393 CSS px and
  DPR 3: k = 4, 1280 → 1179 device px), which keeps all pixels the same size
  and only slightly soft, instead of `pixelated` at a fractional scale (1- and
  2-px uneven outlines). On **desktop**, the picture is **letterboxed at a
  whole-number scale** in its column (e.g. 2× = 640×360 at 1280×800, DPR 1),
  so CSS size × DPR equals the backing size exactly and no resampling happens.
  The picture is never shown below 1×. A requestAnimationFrame loop runs only
  the canvas animations at a fixed 60 Hz step; game logic is event driven
  (turn-based).
- **Content is data** (DATA_SPEC): rooms, things with prop sprites, keywords
  as `[[thingId|shown text]]`, dialogue as node data, conditions and effects
  as small data forms, objectives with 3 hints, fallback chains, transient
  items. `node tools/validate.mjs` must pass before any commit of content.
- **Parser:** tokenizes, strips articles, resolves nouns against things,
  NPCs, items, companions and exits in scope (synonyms and partial matches),
  and dispatches to the same action functions as the buttons. Battle verbs
  (`attack`, `skill`, `item`, `defend`, `flee`, `auto on|off`) and bare
  numbers (choices) work too. Unknown input gets a helpful reply listing
  what's possible here. The parser is not on the cut list: it is the
  play-test harness.
- **Battle engine:** pure functions over a battle state with a seeded RNG
  (seed = encounter id + attempt number), so the same commands give the same
  result. Extension points and Auto as above. `tools/sim.mjs` imports it
  directly in node.
- **Input:** keyboard shortcuts only when the command line isn't focused;
  pointer events for taps; `preventDefault` on game keys; the page never
  scrolls except the story log, tray and panels (`overscroll-behavior:
  contain`); layout sized from `visualViewport`.
- **Audio:** Web Audio API, unlocked on first tap/key; per-track loop points
  with a two-source crossfade; 1 s crossfade on track change; never two copies
  of a track; mute and two volume sliders stored in settings.
- **Saving:** DATA_SPEC §12 (one key per slot, version + migrations, reference
  check with chapter-snapshot fallback, saves only at rest, transient items
  revert first); try/catch and fallback; never during battle.
- **Install/offline:** manifest (standalone, any orientation, spoiler-free
  description), service worker from web-target.md (registered only
  off-localhost or with `?sw=1`), icons made from one square image with Pillow.
- **Debug hook** `window.__game`: `state()` → `{screen, chapter,
  chapterComplete: [chapter numbers done], room, rest, busy, flags,
  objectives: [{id, status}], party: [{id, level, hp, mp, frozen, statuses}],
  guest, items, gold, xp, inBattle, battle: {round, phase, awaiting:
  memberId|null, telegraph, eyeOpen, enemies: [{name, id, hp, maxHp,
  statuses}], lastCommand}, battleResult: 'won'|'lost'|'fled'|null,
  gameWon}`. `busy` is true while an animation, typewriter text, transition
  or blocking toast runs; replays send the next input only when it is false
  (and, in battle, when `battle.awaiting` is set); `levels()` → 5; `goToLevel(n)` → start
  chapter n from `SNAPSHOTS[n]`; `goToRoom(id)`; `audioState()`;
  `setAuto(bool)`. Play-tests drive with real input (typing in the command
  line, clicks and taps) and use the hook only to read state and jump to a
  chapter.
- **Play-test proof:** each chapter's typed script runs from `goToLevel(n)`
  (regular fights with `auto on`, bosses driven by their battle policy, which
  the replay evaluates against `state()` and turns into typed commands) and
  must end with `n` in `chapterComplete` and a state matching
  `SNAPSHOTS[n+1]` (DATA_SPEC §11). The battle seed is encounter id + attempt
  number, reset by `goToLevel`. `ch1-touch.json` replays chapter I with taps
  only on chips, tray buttons, props and battle buttons (Auto toggle allowed)
  at 393×659.

## Build order

Chapter I is finished, with its art and sound, before any chapter II content
is written. This proves the whole pipeline before scaling up.

1. Engine skeleton: state, data interpreters, parser, validate.mjs, debug
   hook, layout at all four sizes (393×659, 734×343, 360×640, 1280×800),
   chapter I rooms as data with placeholder art.
2. Art pipeline prototype: Kord anchor, palettes, tavern background, enemy
   sheet E2, Kord portrait, through pixelize and slice_sheet, viewed in the
   game. Fix the look here. **Budget checkpoint 1:** record the measured cost
   of the Kord anchor and the E2 sheet in `design/ASSETS.md` and re-project
   the whole budget from them (see Budget) before any other generation.
3. Battle engine with every extension point, Auto, sim.mjs; chapter I
   numbers green in the sim.
4. Chapter I content complete (all writing, objectives, hints, fallbacks);
   chapter I assets (12 backgrounds, title art, godstone reveal, its sprites,
   prop sheets P1/P4, its portraits, must music and core sfx).
5. Chapter I play-test: typed script, touch-only replay, phone sizes, saves.
   **Budget checkpoint:** re-project the total from what chapter I really
   cost (see Budget).
6. Chapters II to V in order: content, validate, sim, assets, solution script.
7. Should-assets, juice polish, final play-test of the whole game.

## Cut list

In order, first to go:

1. New Game+.
2. anim8gen attack animations (use code step-forward + flash instead).
3. Optional side content: Great Gull fight, Glass Garden lore tablets, Seek
   trouble tables beyond one per chapter.
4. Party banter pools from 3 to 2 lines per character per chapter (keep the
   room-specific lines in key rooms and every objective's "Ask the party"
   line).
5. Journal pages for chapter recaps and people met (keep objectives, hints
   and the Bestiary).
6. Font-size setting.
7. The 6 should-portraits and the 8 minor portraits: those speakers show
   their sprite's upper body framed at 2× (never a ×4 cropped head).
8. Generated item icons (use code-drawn 16×16 icons).
9. Map fast travel (keep the map view).
10. Music down to six tracks: title, town (shadizar for all towns), dungeon,
    battle, boss, ending.
11. The landscape-phone layout (landscape shows the portrait column centred).
12. Picture taps on props (keep the Things-here chips, inline keywords and
    the command line).

The story, the three twists and narrator surprise, all five chapters,
combat, levels, weapons, the inventory system, the parser (it is the test
harness), the props that puzzles need, validate.mjs and sim.mjs are not on
the list.

## Budget estimate

Prices checked against the skills on 2026-10-30. **nanogen's own docs
disagree:** SKILL.md line 153 says Flash costs "$0.067 / 1K image", while its
cost table (SKILL.md line 405, reference.md line 399) says $0.034 (512: $0.022).
The plan uses the table and shows the worst case at the higher rate (×2).
**imagegen2 lists no prices at all** (`grep -n price` on its SKILL.md finds
nothing), so every imagegen2 and anim8gen rate below is an assumption and the
worst case doubles it too. The real rates are measured at build step 2 (Kord
anchor and the E2 sheet) and recorded in `design/ASSETS.md` with the date.

| Kind | Count (with retries) | Rate | Plan | Worst case |
|---|---|---|---|---|
| nanogen: bg anchor (1K) | 3 | $0.034 | $0.10 | $0.20 |
| nanogen: backgrounds (512) | 41 + 8 retries | $0.022 | $1.08 | $2.16 |
| nanogen: key art (512) | 9 + 3 | $0.022 | $0.26 | $0.53 |
| nanogen: portraits (512 edit) | 24 (10 must, 6 should, 8 minor) + 6 | $0.022 | $0.66 | $1.32 |
| imagegen2: single sprites (anchor ×4, party 3+2, mini-bosses 2+1, bosses 7+3, edits 3, app icon 2) | 27 | ~$0.06 (medium, assumed) | $1.62 | $3.24 |
| imagegen2: sheets (3 enemy, 1 machine, 4 NPC, 4 prop) | 12 + 6 retries | ~$0.09 (assumed) | $1.62 | $3.24 |
| imagegen2: single-cell fixes from bad sheets | 8 | ~$0.06 | $0.48 | $0.96 |
| imagegen2: icon sheet (low) | 2 | ~$0.03 | $0.06 | $0.12 |
| anim8gen (3 animations × ~10 images) | 30 | ~$0.04 | $1.20 | $2.40 |
| Music (audiogen, ~$0.30/min) | 10 tracks, 11 min + 1.5 min retries | | $3.75 | $3.75 |
| SFX (audiogen, ~$0.12 each) | 36 + 4 retries | | $4.80 | $4.80 |
| **Total** | | | **≈ $15.63** | **≈ $22.72** |

**Pre-committed cuts** (decided now, applied in this order at either
checkpoint whenever the projection is over $18, until it isn't; worst-case
savings in brackets):

1. If imagegen2 measures above ~$0.10 per sheet: generate the four prop
   sheets at `low` quality (they shrink to 12 to 64px anyway) [≈ −$0.40].
2. anim8gen attack animations (cut list 2) [−$2.40].
3. Minor and should portraits (cut list 7) [−$0.75].
4. Generated item icons (cut list 8) [−$0.12].
5. Should key art (stilled-khemi, dawn-at-sea; the chapter card and epilogue
   reuse backgrounds) [−$0.13].
6. Should music (gallows, wyrm, khemi, finale: cut list 10) [−$1.28].

Cuts 1 to 5 bring the worst case to about $18.9, under $20 with audio
retries intact; cut 6 is the reserve.

- **Checkpoint 1** at build step 2 (anchor + E2 sheet measured): re-project
  every imagegen2/anim8gen line from the measured rate.
- **Checkpoint 2** after chapter I's assets (build step 5): project the total
  from real spend.
- At 80% of $20 spent, note it in STATUS.md and drop to fewer retries. At
  $20, stop and use the cut list and code-drawn art.

## Definition of done

- [ ] Starts with no console errors at desktop (1280×800) and phone
      viewports (393×659 portrait, 734×343 landscape, 360×640); nothing
      important is pushed off-screen at any of them; the picture is never
      below 1× and its pixels are even (integer backing scale).
- [ ] `node tools/validate.mjs` passes with no errors; `node tools/sim.mjs`
      meets BALANCE.md §7.
- [ ] All five chapters complete by their recorded scripts from
      `goToLevel(n)`, each ending with the chapter in `chapterComplete` and a
      state matching the next snapshot; the game can be won (epilogue
      reached), with bosses driven by their battle policies. Chapter I also
      completes by the touch-only replay at 393×659.
- [ ] Each of the three twists (and the narrator reveal) plays and reads
      correctly; the key rule ("the key cannot be forced; only the Arbiter's
      own wanting turns it") is stated at least twice before chapter IV, the
      mechanism (reaching for the core; the obelisk is its hand) is revealed
      only in chapter IV; every puzzle step is clued twice
      and has 3 Journal hints.
- [ ] Every room has a background, description and at least 3 interactable
      keywords; every puzzle object and twist-clue object is a visible prop;
      no placeholder text.
- [ ] Combat: every enemy and boss appears with its sprite, weaknesses work,
      statuses work, parts/phases/telegraphs/summons work, Bakari fights as a
      guest, levels and skills unlock, Auto works, losing offers Try again.
- [ ] Inventory: tabs, sorting, compare, equip, best gear, use (with the
      targeting banner), combine, shops buy/sell, sell treasures all work by
      mouse and by touch.
- [ ] Every control works with mouse, keyboard and touch; the command line
      understands the verbs in Controls, including battle verbs.
- [ ] Music and sound play after the first tap, loops have no audible seam
      (measured loop points in the manifest),
      tracks crossfade, and mute works.
- [ ] Saving, loading and autosave survive a reload; a corrupt or outdated
      save doesn't crash (falls back to the chapter snapshot with a message).
- [ ] No teal in non-machine assets (pixelize report); no spoiler in the
      tagline, meta/OG tags, manifest, title art or social card.
- [ ] Installs as an app and works offline (`?sw=1` check).
