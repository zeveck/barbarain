# BarbarAIn — content data spec

All story content (rooms, things, people, dialogue, puzzles, objectives,
encounters, shops, scenes) is **plain data** in `src/data/`. The engine reads
it; `tools/validate.mjs` checks it with node after every content change. Code
in data is allowed only as a named escape hatch (`script`, section 5) and the
validator lists every use.

## 1. Files and ids

```
src/data/items.js      ITEMS {id: item}                       (section 14)
src/data/enemies.js    ENEMIES {id: enemy}, MOVES {id: move}, ENCOUNTERS {id: encounter}  (section 10)
src/data/party.js      MEMBERS {id: member}, SKILLS {id: skill} (section 14)
src/data/snapshots.js  SNAPSHOTS {1..5: chapter-start state}
src/data/recipes.js    RECIPES [combine rules]                (section 14)
src/data/defaults.js   fallback reply pools (section 6)
src/data/scripts.js    SCRIPTS {id: function} (escape hatch, kept tiny)
src/data/ch1.js … ch5.js  each exports {chapter, rooms, npcs, dialogues, scenes,
                       objectives, shops, threats, seekTrouble}
```

Encounters live in `enemies.js` only (not in the chapter files). Test
fixtures (`tools/solutions/*.json`, `tools/solutions/policies/*.json`,
`tools/solutions/sim-loadouts.json`) are outside `game/` and no game data
points at them.

- Ids are `snake_case`. Rooms use the STORY.md ids (`shz_tavern`). Things are
  unique within a room and referenced as `room.thing` from outside it.
- Flags are named `<chapter>.<what>`, e.g. `ch1.bolo_asleep`,
  `ch2.lens_polished`. Flags are booleans unless set to a number. A flag is
  read only if some effect sets it (the validator checks both directions).
- Speaker ids are member/NPC ids (`kord`, `ain`, `oyuk`, `narrator`); each maps
  to a portrait id through `MEMBERS` or the chapter's `npcs` registry (or the
  framed upper-body sprite fallback).
- **`npcs` registry** (per chapter file): `npcs: {oyuk: {name:'Oyuk', names:
  ['oyuk','taverner','innkeeper'], portrait:'portrait/oyuk', sprite:
  'npc/oyuk'}}`. Room things of `kind:'npc'` refer to it with `npc:'oyuk'` and
  add only placement and replies; name, synonyms, portrait and sprite come from
  the registry, so an NPC who appears in two rooms is defined once.

## 2. Text and keyword markup

- `[[thingId|shown text]]`: the **first half is the id** of a thing, NPC, exit
  or item in scope; the second half is the words shown. `[[thingId]]` shows
  the thing's `name`. Rendered as an inline link (normal line height, hit area
  padded vertically only) and also listed in the "Things here" chip row.
- Text fields are either a string or a list of variants
  `[{cond, text}, …, {text}]`; the first variant whose `cond` passes is used
  (the last one has no `cond`).
- `{kord}`-style tokens are not used; write names out. `*word*` is italics.
  Ain's lines are styled teal by speaker, never by markup.

## 3. Rooms and things

```js
{
  id: 'shz_market', name: 'Market of the Stocks', chapter: 1,
  bg: 'bg/shz-market', music: 'shadizar', ambience: 'crowd',   // asset ids
  machine: false,                     // true = teal palette allowed (art)
  desc:  [{cond:{flag:'ch1.toktai_free'}, text:'…'}, {text:'…'}],  // full description
  short: '…',                         // shown on revisits
  exits: [{dir:'s', label:'Street of the Maul', names:['street','out'],
           to:'shz_street', cond:null,
           blocked:'Kord does not fear dogs. These are not dogs.'}],
  things: [thing, …],                 // includes NPCs placed here (kind:'npc', npc:'id')
  encounters: [{id:'e1_hall_mercs', auto:true, cond:{not:{flag:'ch1.mercs_dead'}}}],
  seekTrouble: 'tower',               // table id, or null
  onEnter: [effect, …],               // run every entry (use cond inside to run once)
  onAction: {count:3, cond:{not:{flag:'ch1.gorm_brawl'}}, effects:[{scene:'sc_gorm'}]},
  onIdle:   {seconds:30, cond:{not:{flag:'ch1.gorm_brawl'}}, effects:[{scene:'sc_gorm'}]},
  say:   [{match:'ashkarran the magnificent', response}],   // `say …` / dialogue choice
  shout: response,                    // `shout`, `roar`, `yell` (no target)
  rest: true,                         // false while a scripted beat is running (no saving)
  inn: {price:10, text:'…'}           // optional: adds "Rest (10 silver)": full heal + autosave
}
```

```js
// thing
{
  id: 'bolo', kind: 'npc' | 'thing' | 'prop',
  npc: 'bolo',                         // kind:'npc' only: registry id (name, names, portrait, sprite id)
  name: 'Sergeant Bolo', names: ['bolo','sergeant','guard'],   // things/props: parser synonyms
  sprite: {id:'npc/bolo', x: 212, y: 92},   // 320×180 coords of the sprite's top-left
  hotspot: null,                       // only for things painted in the bg: {x,y,w,h}
  cond: null,                          // thing exists only while true
  look: '…' | [variants],
  take: response | '…refusal…',
  talk: 'dlg_bolo',                    // dialogue id, or a response
  use:  { drugged_wine: response, shadizar_red: response, '*': response },
  give: { drugged_wine: response, '*': response },  // give X to NPC
  hit:  response,                      // `hit X` / use any weapon on X
  say:  [{match:'…', response}]        // optional: `say … to bolo`
}
```

- **Exits.** `dir` is one of `n s e w u d in out` (unique per room). `label`
  is the free text on the button (`N · Market Square`). `names` are extra
  parser words (`tavern`, `deeper`, `chute`, `up the wall`, `back`). The parser
  matches `go <word>`, a bare direction, or a bare exit name; arrow keys map to
  n/s/e/w.
- **Triggers.** `onAction.count` counts the player's actions in the room
  (look/take/use/give/talk/hit/say, not movement or menus) and fires once when
  the count is reached; `onIdle.seconds` fires once after that many seconds
  at rest with no input (paused while a menu or the tab is hidden). Whichever
  comes first fires; its `cond` is re-checked so the other never repeats it.
- **`say`** entries match the normalised words after `say` (articles and
  punctuation stripped) and can also appear on a thing (`thing.say`) or as a
  dialogue choice that runs the same response. Unmatched `say` falls to
  `DEFAULTS.say`. `shout` falls back to `DEFAULTS.shout`.
- **Hotspot = sprite box.** Puzzle objects are prop sprites placed at `sprite.x/y`;
  the tap area is the sprite's bounding box, padded to at least 44×44 CSS px at
  the current scale. `hotspot` is used only for things that are part of the
  painted background (scenery with flavour text, no puzzle role).
- A **response** is `{cond?, text, effects?, sfx?}` or a list of them (first whose
  `cond` passes). A response with no `text` is invalid.

## 4. Conditions and effects

Conditions (all plain data; combine freely):

| Form | True when |
|---|---|
| `{flag:'ch1.x'}` / `{flag:'ch1.x', eq:3}` | flag set / equals |
| `{not: cond}` · `{all:[…]}` · `{any:[…]}` | logic |
| `{has:'item_id', n?:2}` | in the bag **or equipped** |
| `{inParty:'toktai'}` · `{guest:'bakari'}` | member present (not frozen) |
| `{visited:'room_id'}` · `{inRoom:'room_id'}` | |
| `{gold:{gte:5}}` | |
| `{objective:'id', is:'active'|'done'}` | |
| `{level:{gte:9}}` | party level |
| `{script:'id'}` | escape hatch |

Effects (run in order):

| Form | Does |
|---|---|
| `{set:'ch1.x'}` · `{set:'ch1.x', to:2}` · `{clear:'ch1.x'}` | flags |
| `{give:'item', n?}` · `{take:'item', n?}` · `{gold:+n}` | inventory (toast + sfx) |
| `{join:'toktai'}` · `{leave:'ain'}` · `{freeze:'toktai'}` · `{unfreeze:'toktai'}` | party |
| `{guest:'bakari', level:13}` · `{guestLeave:'bakari'}` | 5th battle slot |
| `{learn:{who:'ain', skill:'aegis'}}` | skill |
| `{battle:'encounter_id'}` | start a battle; following effects run after a win |
| `{goto:'room_id'}` · `{openExit:{room, dir}}` · `{closeExit:{room, dir}}` | |
| `{objective:{id, to:'active'|'done'}}` | journal; plays the ✦ chime on done |
| `{scene:'scene_id'}` · `{dialogue:'dlg_id'}` | |
| `{heal:'party'}` · `{autosave:true}` | |
| `{chapterEnd:1}` | chapter card, sets `chapterComplete` |
| `{transform:{from:'oily_rag', to:'burning_rag'}}` | swap an item in place |
| `{sfx:'id'}` · `{music:'id'}` · `{fx:'glint'|'shake'|'flash'}` | presentation |
| `{script:'id'}` | escape hatch |

## 5. Dialogue and scenes

```js
dialogues: {
  dlg_bolo: { start: 'n0', nodes: {
    n0: { speaker:'bolo', text:'No wine on duty. That\'s the law.',
          choices: [
            {text:'Not even a gift?', next:'n1'},
            {text:'Give him the drugged wine.', cond:{has:'drugged_wine'},
             effects:[{take:'drugged_wine'},{set:'ch1.bolo_asleep'}], next:'n_sleep'},
            {text:'Leave.', next:null}
          ]},
    n1: { speaker:'bolo', text:'A gift, though… gifts aren\'t wine. Gifts are gifts.', next:'n0' },
    n_sleep: { speaker:'bolo', text:'A gift! Gifts are legal!', effects:[{sfx:'snore'}], next:null }
  }}
}
scenes: {   // non-interactive beats; tap to advance
  sc_twist1: [ {speaker:'narrator', text:'…'}, {speaker:'ain', text:'…', art:'keyart/godstone-reveal', effects:[…]}, … ]
}
```

- Scene `art` uses asset ids exactly as in the asset list:
  `keyart/godstone-reveal`, `keyart/ouroboros-heart`, `keyart/serpent-altar`,
  `keyart/dawn-at-sea`, … (the validator checks them).
- `next: null` ends the dialogue. Choices with a failing `cond` are hidden;
  a choice with `hideIfDone: true` disappears once its effects have run.
- `again` (optional, text spec like `text`): shown instead of `text` when the
  node is re-entered within the same conversation, e.g. a hub node that
  answers loop back to (`again:'"Anything else?"'`), so the NPC's opening line
  is not reprinted after every answer. Effects still run as normal; a fresh
  conversation shows `text` again.
- While a dialogue or scene runs, `room.rest` is false: no saving, no travel.

## 6. Fallback chains (nobody writes every pair)

**Targeting on touch (and with the mouse).** When an item is in targeting
mode and the player taps an **NPC**, the engine tries `npc.give[X]` →
`npc.use[X]` → the rest of the **give** chain. Tapping a **thing or prop**
(or a party member) uses the **use** chain. Typed `use X on npc` uses the use
chain first, then `give[X]`; typed `give X to thing` gives "Kord can't give
things to that." So `use drugged wine` + tap Bolo and `give wine to bolo`
reach the same reply.

**Noun resolution.** Nouns are matched against things, NPCs, items held
(bag and equipped), companions and exits in scope: exact name or synonym
first, then whole-word partial matches. If more than one candidate is left,
the game asks "Which: the lamp or the lamp oil?" and lists the options as
numbered choices (tap or type the number); a battle command with an
ambiguous enemy does the same.

**use X on Y** — the first that exists wins:

1. `thing.use[X]` (with its `cond`)
2. `thing.use['*']` — the thing's reply to any item
3. `ITEMS[X].useDefault` — the item's reply on anything ("Save the wine for
   someone thirsty.")
4. `DEFAULTS.byKind[ITEMS[X].kind]` — weapon: "Kord considers hitting it.
   He decides to save that for later."; food, potion, key, document,
   companion, treasure each have 3 lines
5. `DEFAULTS.kordRefusals` — pool of at least 12, seeded pick, never the same
   line twice in a row

**give X to NPC**: `npc.give[X]` → `npc.give['*']` → `ITEMS[X].giveDefault` →
`DEFAULTS.give` pool. **look / take / talk / hit** on anything without a
reply: `DEFAULTS.look|take|talk|hit` pools. **combine A with B**: `RECIPES`
match in either order → `ITEMS[A].combineDefault` → `DEFAULTS.combine` ("They
refuse to become one thing."). Using a gear item that has no reply falls to
the `weapon`/`armor` kind defaults, never to an error.

## 7. Companions as usable things

- Party members appear in Items → **Key** as companion entries while present:
  `ain` ("Ain, the Godstone: speaks, glows, objects to being licked"),
  `toktai` ("Toktai: climbs, steals, catches small animals"). `use ain on scale`
  resolves through `thing.use.ain`; the chain's step 4 uses `byKind.companion`
  (e.g. Ain: "Ain declines, politely.").
- Companion entries vanish when the member is absent or frozen (chapter V).
- The only puzzle that needs `use ain on …` is the Hall of Judgement scale.
  Toktai's grapnel (garden wall) and rat-catching run automatically when he is
  in the party (the response's `cond: {inParty:'toktai'}`), with a line from
  Kord if he isn't.

## 8. Items that change

```js
burning_rag: { kind:'key', name:'Burning rag', transient:
  { revertsTo:'oily_rag', on:'leaveRoom', text:'The flame gutters out. The rag is just oily again.' } }
```

- `transient.on`: `leaveRoom` (or `battleStart`). Revert runs before the
  autosave of the next room, so a save never holds a transient item.
- Key items can't be sold or dropped. `ITEMS[x].hintOnceLearned` is shown in
  the item card after the flag in `learnedBy` is set.

## 9. Objectives and hints

```js
objectives: [{
  id: 'ch1_free_toktai', text: 'Free the Hyrkanian from the stocks.',
  done: {flag:'ch1.toktai_free'},
  hints: [ 'Bolo is thirsty, and loves a loophole.',
           'A gift that is not wine… but makes him sleep. Mother Hesh deals in sleep.',
           'Combine Shadizar Red with the poppy draught and give it to Bolo.' ],
  party: { kord:'"The fat one wants wine. Give him something that bites back."',
           toktai:'"He sleeps like a dead ox after a drink. I would know. I have watched him for three days."' }
}]
```

- Every objective has exactly 3 hints, and a `party` line for every member who
  can be present then (the validator checks against the chapter's party).
- Active objectives show in the Journal with a Hint button (reveals one level
  at a time). "Ask the party" picks the line of a random present member.

## 10. Encounters, enemies, moves and the battle engine

All of this lives in `src/data/enemies.js`. Every extension point below must
exist before chapter I's battles are written, even if chapter I barely uses
it. Numbers come from BALANCE.md §4.

### Encounters

```js
ENCOUNTERS.e3_warden = {
  enemies: [{enemy:'warden', tier:11}],   // root enemies only; parts spawn themselves
  partySize: 4,           // planned non-guest members (BALANCE party-size factor)
  party: null,            // or a subset, e.g. ['kord'] for solo fights
  guest: null,            // e.g. {id:'bakari', level:13}
  xp: 600, gold: 0,       // paid once on a win or scripted end (BALANCE §1)
  optional: false,        // true: Great Gull, Seek trouble (left out of chapter sums)
  music:'boss', bg:'bg/wyr-heart', noFlee:true,
  roundHooks: [],         // e.g. [{every:3, effect:'stone_heals'}] (Ashkarran), ch V 'ain_breaks_through'
  onPlayerSkill: [],      // e.g. [{skill:'croms_roar', phase:3, once:true, effects:[{guest:'bakari', level:17}]}]
  onWin:[…], onLose:'gameover' | [effects] /* duel: continue with other lines */,
  endsWhen: null          // 'enemyFlees' (Uzzah) or 'anyBelowPct' (duel): the end counts as a win
}

// an encounter entry can override the enemy's stat inputs:
ENCOUNTERS.e5_halls_a = { enemies:[{enemy:'brazen_man', tier:15, role:'minion',
  mult:{hp:1.6, def:1.2, agi:0.7}}], partySize:1, party:['kord'], xp:350, gold:0, … }
```

- **Stats** = BALANCE tier formula with `tier` (required on every entry),
  `role` and `mult` (entry overrides the enemy's defaults), times the
  party-size factor from `partySize`. One enemy id can therefore appear at
  several tiers (cutthroat T6/T7/T8; serpent_drone; brazen_man elite in ch III
  and solo minion in ch V) without duplicate stat blocks.
- **Instance names** are stable and shown in the battle UI, `state()` and the
  parser: the sprite id plus `-a`, `-b`, `-c` in list order when an enemy id
  appears more than once (`cutthroat-a`, `cutthroat-b`, `drunk-a`), the bare
  sprite id when it appears once (`gorm`, `warden`), and the part's `name` for
  parts (`warden-arm-l`, `warden-arm-r`). Summoned and called-in enemies
  continue the letters (`summoned-shadow-a`, `asp-b`, `cutthroat-c`).
- **No scripted commands in game data.** Bosses are proved by battle policies
  in `tools/solutions/policies/<encounter>.json` (BALANCE §8).

### Enemies

```js
ENEMIES.warden = { name:'The Warden', sprite:'enemy/warden', role:'boss',
  mult:{}, tags:['machine'], weak:['crush'], resist:['shock','slash'], immune:[],
  aiRole: null,             // 'healer' | 'summoner' | null: Auto's "deal with first" tag
  parts: [{enemy:'warden_arm', name:'warden-arm-l', sprite:'enemy/warden-arm'},
          {enemy:'warden_arm', name:'warden-arm-r', sprite:'enemy/warden-arm', mirror:true}],
  phases: [{atHpPct:100, sprite:'enemy/warden', moves:['double_strike','beam','strike']}],
  ai: [ {when:{partsAlive:{gte:1}}, move:'double_strike', target:'random'},
        {when:{every:3}, move:'beam', target:'highest_hp'},
        {move:'strike', target:'random'} ],
  aura: null,               // e.g. {status:'drowsy', target:'party'} each round (Singing Pillar)
  autoHints: { priorityTargets:['warden_arm'], defendOnTelegraph:true },
  steal: {item:'star_cell', chance:1}, drops: [{item:'sun_lance', chance:1}],
  flags: { noAttack:false, yieldsAt:null, fleesAt:null, endsAtPct:null, neverTarget:['ain'] } }
```

- `role` is **only** the stat role (`minion | elite | mini | boss`).
  Behaviour tags use `aiRole`.
- `parts` **spawn** their enemies when the battle starts; an encounter lists
  only the root. Parts share no HP with the root; the root's AI can read
  `partsAlive`. Killing the root ends the fight (remaining parts fall).
- `flags.neverTarget` (member ids the enemy never picks) and
  `autoHints.priorityTargets` (enemy ids Auto and policies hit first) are the
  only spellings: there is no `ai.neverTarget` and no `priority` field.
- `phases[]` change at HP thresholds on one HP bar. A phase may override
  `sprite`, `moves` (the moves the AI may pick), `mult` (applied on top:
  `{atk:1.15}`), `tags`, `weak`, `resist`, `immune`. Example (Thulamon):
  `{atHpPct:50, sprite:'enemy/thulamon-serpent', moves:['crush','venom'],
  mult:{atk:1.15}, tags:['beast'], resist:['pierce']}`.
- `ai[]` is read top to bottom each turn; the first rule whose `when` passes
  and whose `move` is in the current phase's `moves` is used. The last rule
  has no `when`.

### Moves

```js
MOVES = {
  strike:        { mult:1.0, type:'weapon', target:'one' },
  double_strike: { mult:0.8, type:'weapon', target:'one', hits:2 },
  beam:          { mult:2.0, type:'shock', target:'one', telegraph:'The core brightens…' },
  lightning:     { mult:1.8, type:'shock', target:'all', telegraph:'Ashkarran begins to chant…' },
  slam:          { mult:1.3, type:'crush', target:'one', telegraph:'It raises both fists…' },
  tail_sweep:    { mult:0.8, type:'weapon', target:'all', telegraph:'The tail coils…' },
  net:           { mult:0.5, type:'weapon', target:'one', status:{id:'stun', chance:0.3, rounds:1} },
  gust:          { mult:0.7, type:'weapon', target:'all', status:{id:'blind', chance:0.3, rounds:2} },
  dirty_trick:   { mult:0.6, type:'weapon', target:'one', status:{id:'blind', chance:0.6, rounds:2} },
  drain:         { mult:1.0, type:'wonder', target:'one', drain:0.5 },
  heal_ally:     { target:'ally', heal:{pctMax:25} },
  summon_shadow: { target:'self', summon:{enemy:'summoned_shadow', n:1, max:2, tier:'same'} },
  summon_asps:   { target:'self', summon:{enemy:'asp', n:2, max:2, tier:'same'} },
  call_cutthroat:{ target:'self', summon:{enemy:'cutthroat', n:1, max:1, tier:'same'} },
  weigh:         { target:'all', buff:{stat:'def', pct:-20, rounds:3} },
  judgement:     { mult:2.0, type:'weapon', target:'highest_hp', telegraph:'The scale tips…' },
  stillness_one: { target:'one_nonimmune', status:{id:'stilled', chance:1, rounds:99}, telegraph:'Thulamon lifts a hand. The air goes thick…' },
  stillness_all: { target:'all', status:{id:'stilled', chance:1, rounds:99}, telegraph:'The serpent draws a long, silent breath…' },
  eye_open:      { target:'self', setFlag:'eyeOpen', rounds:1, text:'"Kord, now! The eye!"' },
  maul_swing:    { mult:1.2, type:'weapon', target:'one', status:{id:'stun', chance:0.15, rounds:1} },
  lions_song:    { target:'party', buff:{stat:'atk', pct:20, rounds:2}, taunt:2 }
  // … one entry per move named in BALANCE §4 (crush, venom, bite, whip, rot, constrict, poison_dart, …)
}
```

Fields: `mult` (× ATK, physical formula; `type:'weapon'` = the enemy's own
attack type, `'wonder'` = wonder formula), `type`
(slash/pierce/crush/shock/fire/weapon/wonder), `target`
(`one | all | self | ally | ally_lowest_hp | highest_hp | lowest_hp | random |
one_nonimmune | party` for party-side buffs), `hits`, `status:{id, chance,
rounds}`, `heal:{pctMax|flat}`, `drain` (fraction of damage healed),
`buff:{stat, pct, rounds}`, `summon:{enemy, n, max, tier}` (max = alive at
once; summons give 0 XP), `telegraph` (the line shown one round ahead: the
move is announced at the end of round N and used in round N+1; Auto and
policies see `telegraph:true`), `setFlag`, `taunt`, `actsFirst`, `text`.
Party skills use the same move fields (section 14).

### The closed `when` vocabulary

Every `ai[].when`, policy `if` and hook condition uses only these forms
(combine with `all`/`any`/`not`); the validator rejects anything else.

| Form | True when |
|---|---|
| `{every:3}` | round number is a multiple of 3 |
| `{rounds:[5,10,15]}` | round number is in the list |
| `{hpPctBelow:70, once:true}` | own HP below 70%; with `once`, fires one time only per battle |
| `{allyHpBelow:60}` | some living ally (same side) is below 60% HP |
| `{alliesAlive:{lt:2}}` | number of living allies (same side, self excluded) compares |
| `{partsAlive:{gte:1}}` | own parts still alive |
| `{phase:2}` | current phase index (1-based) |
| `{afterTelegraph:true}` | this unit announced a telegraph last round |
| `{targetHas:'stilled'}` | a possible target has that status |
| `{notOnRounds:[5,10,15]}` | round is not in the list (the Steward's Stillness skips Eye rounds) |
| `{chance:0.3}` | seeded roll |
| party side only (policies, Auto): `{telegraph:true}`, `{eyeOpen:true}`, `{allyHas:'stilled'}`, `{allyDown:true}`, `{enemyHas:{aiRole:'healer'}}` | as named |

### Hooks, auras, immunities

- `roundHooks:[{every:3, effect:'ain_breaks_through'}]` on encounters fire
  **at the start of the round, before turns**. Effects are named engine
  effects: `ain_breaks_through` (heal 20% max HP, cure Stilled, teal log
  line), `stone_heals` (Ashkarran fight: heal 20%, "Hold, thief."). Also
  `{rounds:[…]}` instead of `every`.
- `onPlayerSkill:[{skill, phase?, once?, effects}]` on encounters fire right
  after the named party skill resolves (the Steward's phase 3: the first
  Crom's Roar adds Bakari).
- `aura:{status, target, chance?}` on enemies applies at the start of each
  round while the enemy lives (Singing Pillar: Drowsy on the party).
- **Member immunities** (`MEMBERS.kord.immune:['stilled','drowsy']`) make
  any status in the list fail silently with an "unaffected" pop; targets of
  `one_nonimmune` skip immune members.
- Turn order per round: roundHooks, auras, then turns. Units whose action
  has `actsFirst` (weapon or skill, e.g. Crom's Roar) go first, sorted by AGI;
  then everyone else by AGI + seeded 0 to 3.
- Counters (Riposte) and Taunt are statuses the targeting step reads.

### Battle commands and state

- A battle command (button or typed) applies to **whoever's turn it is**
  (`battle.awaiting`). A member name in a typed command (`skill kord roar`)
  is only a check: if it isn't Kord's turn the reply is "It is Toktai's turn."
  and nothing happens.
- Targets are instance names (`attack warden-arm-l`) or unambiguous prefixes
  (`attack arm` asks "Which: warden-arm-l or warden-arm-r?").
- `state().battle` = `{round, phase, awaiting: memberId|null, telegraph:
  bool, eyeOpen: bool, enemies:[{name, id, hp, maxHp, statuses}],
  party:[{id, hp, mp, statuses}], lastCommand}`; top-level `busy: bool` is true
  while any animation, typewriter text, transition or toast that blocks input
  is running. Replays send the next input only when `busy` is false.

## 11. Chapter-start snapshots

`SNAPSHOTS[n]` = `{room, level, xp, gold, party:[{id, equip:{weapon, off,
body, head, charm}}], items:{id:n}, flags:[…], objectives:[…]}`: the typical
state a player has at the start of chapter n (the gear named in BALANCE.md
section 5). `goToLevel(n)` loads it. The play-test checks that chapter n's
recorded solution ends in a state that matches `SNAPSHOTS[n+1]` on level,
key flags and key items exactly, and gold within ±25%.

## 12. Saves

- One key per slot: `barbarain.save.auto`, `.1`, `.2`, `.3`; settings in
  `barbarain.settings`. A bad write can break only one slot.
- Each save is `{v: <int>, chapter, room, flags, party, guest, items, gold,
  journal, bestiary, visited, seed, savedAt}`. `MIGRATIONS = {1: s => …, 2: …}`
  upgrades old versions step by step.
- On load: check every room, item, flag, member and objective id against the
  data. Unknown ids → load `SNAPSHOTS[save.chapter]` instead and say so ("The
  chronicle has been rewritten since you last read it; you begin this chapter
  afresh.").
- Saving (manual or auto) happens only at a room's resting state: no dialogue,
  scene, battle or targeting mode open, no transient items (they revert first).
- `preBattleSnapshot` (for Try again) is kept in memory only, taken when a
  battle starts.

## 13. What `tools/validate.mjs` checks

Run `node tools/validate.mjs` after every content change; it exits non-zero
on any error and prints a summary (rooms, things, keywords, objectives,
`script` escape-hatch uses).

1. Every `[[id|text]]` resolves to a thing, NPC, exit or item in scope of
   that room.
2. Every exit `to`, encounter id, dialogue id, scene id, `next` node, item id,
   member id, skill id, enemy id, sprite/bg/music/sfx asset id exists (asset
   ids checked against `game/assets/manifest.json` once assets exist).
3. Every flag that is read is set somewhere, and every flag set is read
   somewhere (warning).
4. Every key item is the subject of at least one `use`/`give`/`combine` reply
   or recipe; every recipe result is used.
5. Every objective has 3 hints and party lines for each member present.
6. Every room has a `bg`, `desc`, `short`, and at least 3 keywords; no text
   contains `TODO`, `XXX` or `lorem`.
7. Every room is reachable from the chapter's start room through exits
   (ignoring conditions), and the chapter has a `chapterEnd` effect.
8. Every prop sprite fits inside 320×180.
9. Every encounter entry has a `tier`, every enemy a `role`; every encounter
   has `xp`, `gold` and `partySize`; per-chapter XP sums of the non-optional
   encounters match BALANCE.md's targets (324, 1326, 1921, 2882, 2520).
   Summon targets have no XP of their own (there is no enemy `xp` field).
10. Every response has text; every dialogue node is reachable.
11. Every move named in `ai`, `phases.moves`, a skill or a policy exists in
    `MOVES`/`SKILLS`; every `when`/`if` uses only the closed vocabulary
    (section 10); every `parts[].enemy` exists and no encounter lists a part
    enemy as a root; `role` is one of the four stat roles and `aiRole` one of
    healer/summoner/null; `neverTarget`/`priorityTargets` ids exist.
12. Every weapon has `power`, `type`, `class` and `users`; every armor piece
    a `slot` and `def`; every consumable an `effect`; every item a `price`
    (or `price:null` for found-only) and, if `kind:'treasure'`, a `value`.
13. Every skill a member can learn exists in `SKILLS`, and every member's
    allowed weapon classes cover their start gear; every shop item exists and
    is not a key item; every recipe's `a`, `b`, `result` exist; every
    `seekTrouble` pool enemy exists and `rewardFrom` names an encounter in the
    same chapter.
14. Every room's exits have unique `dir` values from n/s/e/w/u/d/in/out, and
    no two exits, things or NPCs in one room share a synonym without the
    ambiguity prompt being acceptable (warning list).
15. `tools/solutions/sim-loadouts.json` and every policy file reference only
    existing items, members, skills and enemies (run with `--tests`).

## 14. RPG data schemas

One example per kind; every field shown is the full set the engine reads.

```js
// ITEMS
rusty_broadsword: { kind:'weapon', name:'Rusty Broadsword', class:'sword',
  power:6, type:'slash', users:['kord','valka'], twoHanded:false,
  actsFirst:false, flyers:false, offhand:false,          // offhand: may go in the off-hand (daggers)
  procs:[], crit:0, vs:null, price:null, icon:'sword' },   // price:null = not in any shop; unsellable unless `sell` is set
woodcutters_axe: { kind:'weapon', class:'axe', power:11, type:'slash', users:['kord'],
  procs:[{status:'sunder', chance:0.15, rounds:3}], price:80, … },
khopesh_of_set: { kind:'weapon', class:'sword', power:30, type:'slash',
  users:['kord','valka'], vs:{tag:'human', pct:25}, price:700, … },
zingaran_main_gauche: { kind:'weapon', class:'dagger', power:6, type:'pierce',
  users:['toktai','valka'], offhand:true, offhandDef:3, crit:0, price:null, … },
horned_helm: { kind:'armor', slot:'head', name:'Horned Helm', def:3, agi:0,
  resist:[], users:['kord'], price:null, icon:'helm' },
star_weave_mail: { kind:'armor', slot:'body', def:18, resist:['shock'], users:['kord','toktai','valka'], … },
ring_of_mitra: { kind:'charm', name:'Ring of Mitra', sorcerous:false,
  users:'any', immune:['poison'], stats:{}, price:null, icon:'charm' },
ishtar_bangle: { kind:'charm', sorcerous:true, stats:{mpPct:20}, … },   // Kord refuses sorcerous
healing_draught: { kind:'consumable', name:'Healing Draught', battle:true, field:true,
  effect:{heal:100}, target:'ally', price:30, icon:'potion_red' },
oil_bomb: { kind:'consumable', effect:{damage:{type:'fire', base:40, perChapter:30}},
  target:'all_enemies', usableBy:'any', price:70 },        // damage = base + perChapter × (chapter − 1)
throwing_knives: { kind:'consumable', effect:{damage:{type:'pierce', base:60, perChapter:35}}, target:'one', … },
scroll_of_fire: { kind:'consumable', effect:{move:'flare'}, notUsableBy:['kord'], … },
zamorian_silver_cup: { kind:'treasure', name:'Zamorian silver cup', value:40 },
drugged_wine: { kind:'key', name:'Drugged wine', useDefault:'…', giveDefault:'…', hintOnceLearned:'…', learnedBy:'ch1.…' }
```

- Sell price = `price / 2` for gear and consumables, `sell` for found gear
  that may be sold (`notched_dagger: {…, price:null, sell:8}`), `value` for
  treasures; key items can't be sold. `procs` are on-hit statuses (stun, bleed, poison,
  sunder). `vs` is the "+25% vs tag" bonus. Weapon `class` ∈ sword,
  greatsword, axe, mace, spear, dagger, bow, sabre, rapier, future.

```js
// MEMBERS
kord: { name:'Kord', sprite:'party/kord-battle', portrait:'portrait/kord',
  lv1:{hp:60, mp:8, atk:12, def:6, agi:7, wil:3},
  lv17:{hp:520, mp:60, atk:62, def:34, agi:22, wil:12},       // BALANCE §2, linear
  classes:['sword','greatsword','axe','mace','spear','dagger'], shields:true,
  slots:['weapon','off','body','head','charm'], refusesSorcerous:true,
  immune:['stilled','drowsy'], skills:['cleave','sunder','whirlwind','croms_fury','croms_roar'],
  start:{weapon:'rusty_broadsword', body:'leather_harness'} },
ain: { …, classes:[], slots:['charm'], immune:[], skills:['spark','mend','scan', …] }

// SKILLS (same effect fields as MOVES, plus cost and learning)
cleave: { name:'Cleave', who:'kord', mp:4, hpPct:0, target:'one', mult:1.5, type:'weapon',
  learn:{level:1} },
croms_fury: { who:'kord', mp:12, hpPct:10, target:'one', mult:3.0, type:'weapon', noMiss:true, learn:{level:11} },
croms_roar: { who:'kord', mp:8, target:'party', actsFirst:true, cure:['stilled','drowsy'],
  buff:{stat:'atk', pct:25, rounds:3}, learn:{flag:'ch5.gong_struck'} },
aegis: { who:'ain', mp:10, target:'party', buff:{stat:'def', pct:40, rounds:3}, learn:{flag:'ch2.ain_woken'} },
spark: { who:'ain', mp:4, target:'one', type:'shock', spellPower:10, learn:{flag:'ch1.ain_joined'} },
mend:  { who:'ain', mp:5, target:'ally', heal:{wilMult:2, flat:20}, learn:{flag:'ch1.ain_joined'} }

// RECIPES (either order)
{ a:'shadizar_red', b:'poppy_draught', result:'drugged_wine', text:'…', consumes:['a','b'] }

// shops (chapter file)
shops: { ilk: { name:'Ilk the Smith', npc:'ilk',
  stock:[{item:'cudgel'}, {item:'iron_mace'}, {item:'healing_draught', qty:null}],   // price from ITEMS unless given
  buys:true, buysKinds:['weapon','armor','charm','consumable','treasure'] },
  oyuk: { stock:[{item:'shadizar_red', price:5}], buys:false } }

// threats (chapter file, for Best gear scoring, BALANCE §6)
threats: ['poison','stun','human']

// seekTrouble (chapter file)
seekTrouble: { sewers_none: null,
  tower: { pool:['turanian_merc','shadow_cat'], size:[1,3], tier:'party', partySize:'current',
           rewardFrom:'e1_hall_mercs', pct:25, optional:true } }
```

## 15. Input rules shared by keyboard, mouse and touch

- **Enter:** when the command line is focused, Enter always submits it; if
  text is still typing out, it first completes the text and then submits.
  When the command line is not focused: Enter completes running text if any;
  otherwise it confirms the highlighted choice or battle target; otherwise it
  focuses the command line. Space never submits.
- **Number keys** pick choices only when the command line isn't focused; in
  the command line a bare number + Enter does the same.
- **Ambiguous nouns** get the "Which: …?" prompt with numbered choices
  (section 6); the prompt is a normal choice list, so taps, digits and typed
  numbers all work.

