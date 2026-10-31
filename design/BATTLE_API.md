# BarbarAIn — battle engine API

Contract between `game/src/battle.js` (pure engine, no DOM) and its two
users: the **battle UI** (`battle-ui.js`) and the **game engine** (`main.js`,
`state.js`, `parser.js`). Data: `src/data/enemies.js` (ENEMIES, MOVES,
ENCOUNTERS, TIER_RULES, SOLUTION_ORDER), `party.js` (MEMBERS, SKILLS, helpers),
`items.js` (ITEMS, `sellPrice`). Tests: `node tools/battle-test.mjs`; balance:
`node tools/sim.mjs`.

## 1. Lifecycle

```js
import * as Battle from './battle.js';

let b = Battle.createBattle({
  encounterId: 'e3_warden',          // or encounter: {...} for Seek trouble (makeSeekTroubleEncounter)
  party: [{ id:'kord', hp, mp, equip:{weapon, off, body, head, charm}, frozen?, statuses? }, …],
  level: 11,                         // shared party level
  items: { healing_draught: 3, … },  // the bag (only consumables matter; the battle keeps its own copy)
  flags: ['ch1.ain_joined', …],      // story flags (skills with learn.flag)
  chapter: 3,                        // chapter-scaling consumables
  difficulty: 'warrior' | 'saga',
  attempt: 1,                        // seed = hash(encounterId + '#' + attempt); Try again → attempt + 1
});
// b.lastEvents: opening events (round 1, auras, Ain's breakthrough, tutorial prompt…)

while (!b.over) {
  // b.awaiting = member id whose command is wanted (null only when over)
  const r = Battle.command(b, 'attack warden-arm-l');  // or an object, see §3
  if (r.error)   showLine(r.error);            // nothing happened; state unchanged
  if (r.choices) showChoices(r.prompt, r.choices); // ambiguous target/skill/item: each choice has .cmd
  b = r.state;                                 // new object (input state is never mutated)
  animate(r.events);
}
// b.result: 'won' | 'lost' | 'fled'; b.scripted: true for the duel's scripted end
// b.rewards: { xp, gold, items:[ids], drops, stolen, itemsUsed:{id:n}, effects }
```

- `party` may contain frozen members and members outside `encounter.party`
  (Kord's solo fights): the engine drops them. Guests are never passed in:
  the encounter's `guest` (Bakari) is added by the engine, and
  `onPlayerSkill` can add him mid-fight.
- `hp`/`mp` `null` = full. Members at 0 HP start fallen.
- **After the battle** the game applies, in order:
  1. `Battle.partyAfter(b)` → `[{id, hp, mp, statuses}]` (poison/bleed carry
     over; everything else ends),
  2. bag: subtract `rewards.itemsUsed`, add `rewards.items` (steals are kept
     even when the fight is lost or fled; drops only on a win),
  3. `Battle.applyRewards({level, xp}, b.rewards)` →
     `{xp, level, levelUps:[…], gold, fullHeal}`; a level-up fully heals,
  4. `rewards.effects`: `encounter.onWin` on a win, `encounter.onLose` on a loss
     (`'gameover'` → Game Over screen; an array → run as effects and carry on,
     e.g. the duel). XP is paid on a win, and on a loss only when the
     encounter has `paysOnLose` (the duel). Nothing on `fled`.
- Encounter `onWin` effects only set the encounter's flag (`ch1.mercs_dead`,
  `ch2.ortho_beaten`, …) and give the encounter's **story** items (tower key,
  star-stone, slaver's writ and open shackles). Room data should not give
  those again. Gear drops (Bronze Mace, Black Sabre, Sun-lance, Sea-Queen's
  Sabre, …) come back in `rewards.items`.
- e5_thulamon's `onWin` includes `{heal:'party'}` and `{autosave:true}` (the
  rest between bosses).

## 2. Round structure

1. **Round start**: `round` +1, roundHooks (`stone_heals`, `ain_breaks_through`:
   heal 20%, cure Stilled, a teal line spoken by `ain`), auras (Drowsy),
   enemy decisions; moves with `setFlag` (the Steward's Eye) resolve here,
   so `eyeOpen` is visible to the commands.
2. **Commands**: `awaiting` steps through the living members who can act
   (Kord, Toktai, Ain, Valka order; Stilled or stunned members are skipped;
   the guest chooses by itself). Defend takes effect the moment it is chosen.
3. **Resolution** (no input): everyone acts in turn order: units whose
   action is acts-first (spear/lance weapons on Attack, Crom's Roar) by AGI,
   then everyone else by AGI + seeded 0–3, then **telegraphed** enemy moves
   last. Bleed hurts when the unit acts; stun eats one turn.
4. **Round end**: poison, regen (Scarab of Life), status timers, then
   telegraphs for next round are announced (`telegraph` event). A battle
   ends the instant its condition is met (any event can be the last).

So one `command()` call returns either just the Defend/choice echo (more
members still to choose) or the whole resolved round plus the next round's
start events.

## 3. Commands

Object form (what buttons and Auto send):

| Command | Notes |
|---|---|
| `{act:'attack', target:'cutthroat-b'}` | target optional: current target (last one, if alive) else Auto's pick |
| `{act:'skill', skill:'mend', target:'toktai'}` | target only for `one` / `ally` / `ally_down` skills |
| `{act:'item', item:'healing_draught', target:'kord'}` | |
| `{act:'defend'}` · `{act:'flee'}` | flee fails with an error on `noFlee` encounters |
| `{act:'repeat'}` | this member's last command (same target if alive) |
| `{act:'auto'}` | let Auto pick this one turn |

Typed grammar (`command(b, text)` or `parseCommand(b, text)` →
`{cmd} | {error} | {choices, prompt}`):

```
attack|a|hit [target]          skill|s|cast [member] <skill words> [target]
item|i|use <item words> [target]   defend|d|guard   flee|f|run   repeat|r
```

- Targets: instance names (`warden-arm-l`), any `-` segment or label word
  prefix (`arm`, `left`, `cutthroat`); ambiguity → `choices` ("Which:
  warden-arm-l or warden-arm-r?"). Allies by id or name (`kord`, `valka`).
- Skills by id or name words (`roar`, `crom's roar`, `mend all`).
  Items by id or name words, longest match first (`item healing draught kord`).
- A member name after `skill`/`item` is only a check: `skill valka taunt`
  on Kord's turn → `error: "It is Kord's turn."`.
- `auto on|off` is a UI toggle: while on, the UI sends `Battle.autoCommand(b, b.awaiting)`
  for each turn.

Errors (string, state unchanged): unknown/unlearned skill, not enough MP,
"Sorcery. Keep it away from me." (Kord + scroll), empty bag, no fallen ally,
no running, "Not now.".

## 4. State shape (plain JSON-safe object)

```js
{
  encounterId, attempt, seed, rng, chapter, difficulty, level, partySize,
  encounter,                  // a copy of the ENCOUNTERS entry
  round, stage: 'command'|'resolve'|'over', over, result, scripted,
  awaiting,                   // member id or null
  queue: [memberIds still to choose this round], commands: {memberId: cmd},
  telegraph: bool,            // an enemy will use a telegraphed move this round
  flags: { eyeOpen: bool },
  party:   [unit], enemies: [unit],
  items: {id:n}, itemsUsed: {id:n}, lastCommands: {memberId: cmd}, lastCommand: {who, …cmd},
  currentTarget: {memberId: instanceName},
  scanned: {enemyId: {weak:[], resist:[], immune:[], full:bool}},  // Bestiary knowledge (Scan = full)
  loot: {stolen:[], drops:[], gold}, rewards,
  log: [events] (last 400), lastEvents: [events of the last call],
  eyeLog: [{round, stilled:[ids]}], round1Down: [ids], stats: {damageTaken, damageDealt}
}
unit = {
  key, name /* instance name, = member id for the party */, id /* member or enemy id */,
  side: 'party'|'enemy', label /* "Toktai", "Barachan Cutthroat B", "Left Arm" */,
  sprite, mirror, guest, level, hp, maxHp, mp, maxMp, atk, def, agi, wil,
  statuses: [{id, rounds, stat?, pct?, counters?}], alive, fled, yielded,
  // enemies: role, tier, tags, weak, resist, immune, aiRole, phaseIdx, parts, partOf, summonedBy,
  //          plan {move, telegraphed}, pending (telegraphed for next round)
}
```

Status ids (12×12 icons): `poison bleed stun blind drowsy stilled sunder
weigh guard riposte taunt aegis mirage smoke rage song` (`STATUS_INFO` has
labels). `rage` = Crom's Roar ATK up, `song` = Lion's Song ATK up, `smoke`
= Smoke Pot, `weigh` = the Guardian's DEF down.

## 5. `window.__game.state().battle`

`Battle.battleView(b)` returns exactly the debug-hook fields (DATA_SPEC §10):

| Field | From |
|---|---|
| `round` | `b.round` |
| `phase` | root boss `phaseIdx + 1` (1 when no phased boss) |
| `awaiting` | `b.awaiting` (null while resolving and when over) |
| `telegraph` | `b.telegraph` |
| `eyeOpen` | `b.flags.eyeOpen` |
| `enemies` | living enemies: `{name, id, label, hp, maxHp, sprite, statuses:[ids], part, telegraph}` |
| `party` | `{id, hp, mp, maxHp, maxMp, alive, guest, statuses:[ids]}` (guest included) |
| `guest` | guest member id or null |
| `turnOrder` | next 6 actors (instance names) for the strip |
| `lastCommand` | `{who, act, …}` |
| `over`, `result`, `encounter` | |

`busy` stays the UI's: true while it animates `events`. Replays send input
only when `busy` is false and `awaiting` is set. Battle policies
(`tools/solutions/policies/*.json`) can be evaluated in the browser with
`Battle.policyCommand(b, policy, b.awaiting)`; turn the returned object into
typed text with `cmdToText` below if the replay must type.

```js
const cmdToText = (c) => c.act === 'skill' ? `skill ${c.skill.replace(/_/g,' ')} ${c.target||''}`
  : c.act === 'item' ? `item ${c.item.replace(/_/g,' ')} ${c.target||''}` : `${c.act} ${c.target||''}`;
```

## 6. Events (what the UI animates)

Every event has `type` and `text` (the log line in the game's voice; may be
`''` for silent bookkeeping). Optional `speaker` (`'ain'` → teal line).

| type | fields | when |
|---|---|---|
| `round` | `round` | round start |
| `hook` | `effect`, `targets:[{unit, heal, statusesRemoved, hp, maxHp}]`, `speaker:'ain'` | caged stone, Ain breaks through |
| `aura` | `actor`, `status`, `targets:[{unit, added?, unaffected?}]` | Singing Pillar |
| `eye` | `actor`, `flag:'eyeOpen'`, `open:true`, `speaker:'ain'` | "Kord, now! The eye!" |
| `tutorial` | — | tutorial prompt for this round |
| `action` | `actor`, `action:{kind:'attack'|'skill'|'item'|'defend'|'move'|'counter', id, name}`, `targets:[result]`, `counter?`, `summoned?`, `gambit?` | any act |
| `skip` | `unit`, `reason:'stun'|'stilled'` | lost turn |
| `tick` | `unit`, `status:'poison'|'bleed'|'regen'`, `damage?`, `heal?`, `died?` | DoT/regen |
| `status` | `unit`, `removed:[ids]` | statuses wearing off (text empty) |
| `telegraph` | `actor`, `move` | warning line for next round (pulse the actor) |
| `summon` | `actor`, `units:[instance names]` | new enemies appear (look them up in state) |
| `phase` | `unit`, `phase`, `sprite` | swap the sprite, flash |
| `death` | `unit` | enemy or member falls (parts/summons that fall with a root get their own) |
| `yield` / `flee` | `unit` (`party:true` when the party flees) | Gorm gives up; Uzzah runs |
| `drop` / `steal` | `unit`/`actor`, `target`, `item` (null = failed steal) | loot |
| `scan` | `target`, `enemy`, `hp`, `maxHp`, `weak`, `resist`, `immune` | Bestiary update |
| `guest` | `unit`, `id`, `level`, `speaker` | Bakari arrives (phase 3) |
| `fizzle` | `unit` | no MP, nothing to use |
| `end` | `result`, `scripted`, `xp`, `gold`, `items` | last event |

Action `result` (one per target): `{unit, damage, hits:[{damage, crit} | {miss}],
crit, weak, resist, immune, miss, died, fled, yielded, heal, mp, revived,
drained, statusesAdded:[ids], statusesRemoved:[ids], unaffected:[ids],
resisted, hp, maxHp}`. Show `weak`/`resist` tags on the damage number; an
`unaffected` id gets the "unaffected" pop.

## 7. Other exports

| Export | Use |
|---|---|
| `autoCommand(b, who, {target?})` | Auto's pick (GAME_DESIGN priority list) |
| `policyCommand(b, policy, who)` | battle policy evaluation (BALANCE §8) |
| `runBattle(b, {policy, onStep})` | run to the end with Auto/policy (sim, tests) |
| `validateCommand(b, cmd)` | error string or null (grey out buttons) |
| `availableSkills(b, who)` | learned skill ids (show MP cost from `SKILLS`) |
| `turnOrder(b)` | instance names in resolution order |
| `previewDamage(b, attacker, target, skill?)` | expected damage (optional UI hint) |
| `memberStats(id, level, equip)` | stats with gear (inventory compare rows use this) |
| `enemyStats(enemyId, entry, partySize, difficulty)` | tier formula |
| `evalWhen(b, when, {unit, side, round})` | the closed `when` vocabulary |
| `applyRewards`, `partyAfter`, `battleSeed`, `makeSeekTroubleEncounter(table, {level, partySize, seed})` | see §1 |
| `unitByName(b, name)`, `STATUS_INFO`, `DAMAGE_TYPES` | lookups |
| from `party.js`: `baseStats`, `xpToNext`, `xpToReach`, `levelForXp`, `knownSkills(id, level, flags)` | |

## 8. Flags and ids the engine expects from chapter data

- Skills learned by flag: `ch1.ain_joined` (Spark, Mend, Scan),
  `ch2.ain_woken` (Aegis, Flare, Mirage), `ch5.gong_struck` (Crom's Roar).
- Encounter `onWin` sets `ch1.gorm_brawl` (also on loss), `ch1.mercs_dead`,
  `ch1.cats_dead`, `ch1.sentinel_dead`, `ch1.ashkarran_dead`, `ch1.croc_dead`,
  `ch2.duel_done` (+ `ch2.duel_won` on a win), `ch2.crabs_dead`,
  `ch2.cutthroats_dead`, `ch2.ghouls_dead`, `ch2.hoard_won`, `ch2.ortho_beaten`,
  `ch2.gull_dead`, `ch3.spiders_dead`, `ch3.brazen_dead`, `ch3.drones_dead`,
  `ch3.crew_woken`, `ch3.warden_dead`, `ch4.slavers_dead`, `ch4.bakari_freed`,
  `ch4.mummies_dead`, `ch4.scarabs_dead`, `ch4.python_dead`, `ch4.guardian_dead`,
  `ch5.halls_a_dead`, `ch5.halls_b_dead`, `ch5.stair_a_dead`, `ch5.stair_b_dead`,
  `ch5.thulamon_dead`, `ch5.steward_dead`. Chapter files read these in room
  conditions; rename here and in `snapshots.js` together if the content uses
  other names.
- `SNAPSHOTS[n].flags` lists the key flags each chapter start assumes
  (`ch1.toktai_free`, `ch2.valka_joined`, `ch4.bakari_freed`, …).
- Encounter `bg` / `music` are asset ids (`bg/twr-sanctum`, `boss`, `finale`).
  Enemy sprites: `enemy/<id-with-dashes>`, `npc/gorm`, `npc/uzzah`,
  `enemy/valka-duel` (Valka in the duel; instance name `valka-duel`), `enemy/steward`, `enemy/thulamon-serpent`,
  `enemy/warden-arm` (right one `mirror:true`); the Elite Brazen Man is
  `enemy/brazen-man` with `recolour:'elite'` (code recolour).
