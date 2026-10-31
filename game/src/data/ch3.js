// BarbarAIn — Chapter III: The Belly of the Wyrm (STORY.md, chapter III).
// Plain data (DATA_SPEC). Shape follows ch1.js.
//
// Narration describes the Wyrm's insides as an ancient eye would see them:
// bronze, glass, cold lights, humming walls. No modern words outside Ain's
// mouth (and Kord mocks those).
//
// Encounter flags are the canonical ones (BATTLE_API §8): ch3.spiders_dead,
// ch3.brazen_dead, ch3.drones_dead, ch3.crew_woken, ch3.warden_dead.
// e3_brazen's onWin gives the second star-stone; this file never gives it.
//
// Gear placement (matches tools/solutions/sim-loadouts.json order):
//   graveyard: silver skeleton -> Humming Blade, star-stone, Star-weave Mail,
//              Aegis Disc; Atlantean galley -> Atlantean coin; Valka's chest on
//              the Shrike -> Lotus Tincture
//   corridor:  Star-iron Greatsword (pulling it wakes the serpent-drones)
//   garden:    Bow of the Hours, star-fruit x2, Prism Facet (Ain), Atlantean coin
//   window:    Seer's Lens (Ain), a star-cell
//   heart:     Sun-lance (Warden drop, enemies.js)

export const chapter = {
  n: 3, name: 'The Belly of the Wyrm', start: 'wyr_graveyard', card: 'keyart/wyrm-rising',
  party: ['kord', 'toktai', 'ain', 'valka'],
};

const ALL = ['kord', 'toktai', 'ain', 'valka'];

// Extra parser words for items used in this chapter.
export const itemNames = {
  star_stone: ['stone', 'star stone', 'star-stone', 'egg', 'egg stone'],
  key_sigil: ['sigil', 'glass sigil', 'teal sigil', 'key sigil'],
  humming_blade: ['blade', 'humming blade', 'humming sword', 'hum'],
  star_iron_greatsword: ['greatsword', 'black sword', 'star iron', 'star-iron'],
  star_weave_mail: ['mail', 'star weave', 'star-weave', 'silver mail'],
  aegis_disc: ['disc', 'aegis', 'aegis disc'],
  bow_of_the_hours: ['bow of the hours', 'stringless bow', 'light bow'],
  star_fruit: ['fruit', 'star fruit', 'star-fruit', 'glass fruit'],
  star_cell: ['cell', 'star cell', 'star-cell', 'cylinder'],
  prism_facet: ['prism', 'facet', 'prism facet'],
  seers_lens: ['lens', 'seer lens', "seer's lens"],
  atlantean_coin: ['coin', 'atlantean coin', 'gold coin'],
  lotus_tincture: ['tincture', 'lotus', 'lotus tincture'],
};

// ---------------------------------------------------------------- people
export const npcs = {
  teg_wyrm: { name: 'Mother Teg', names: ['teg', 'mother teg', 'boatswain', 'bosun', 'old woman'], portrait: 'portrait/mother-teg', sprite: 'npc/mother-teg' },
  shrike_crew: { name: 'the Shrike\'s crew', names: ['crew', 'sailors', 'shrike crew', 'statues', 'sleepers'], sprite: 'npc/shrike-sailor' },
  silver_man: { name: 'The man in silver', names: ['silver man', 'man in silver', 'man', 'echo', 'ghost', 'picture'], portrait: 'portrait/silver-man', sprite: 'npc/silver-man', machine: true },
  thulamon_vision: { name: 'Thulamon', names: ['thulamon', 'priest', 'archpriest'], portrait: 'portrait/thulamon', sprite: 'enemy/thulamon' },
  set_voice: { name: 'Set', names: ['set', 'voice'], portrait: 'portrait/steward', sprite: 'enemy/steward', machine: true },
  warden_voice: { name: 'The Warden', names: ['warden'], sprite: 'enemy/warden', machine: true },
};

// ---------------------------------------------------------------- helpers
const F = (flag) => ({ flag });
const NOT = (c) => ({ not: c });
const ALLC = (...c) => ({ all: c });

// Any weapon touched to the ring of glass (except the Humming Blade): one reply.
const WEAPONS = ['rusty_broadsword', 'notched_dagger', 'thiefs_dirk', 'hyrkanian_shortbow', 'cudgel', 'zamorian_shortsword',
  'woodcutters_axe', 'iron_mace', 'hunting_spear', 'ashkarran_bronze_mace', 'lion_hilt_broadsword', 'barachan_cutlass',
  'boarding_axe', 'harpoon', 'argossean_rapier', 'composite_horn_bow', 'zingaran_main_gauche', 'kraken_bone_club',
  'orthos_black_sabre', 'star_iron_greatsword', 'bow_of_the_hours'];
const CLANG = { text: 'Clang. The ring is unimpressed. Its note does not so much as waver.' };
const clangAll = Object.fromEntries(WEAPONS.map(w => [w, CLANG]));

// The serpent-drones fight + the door that greets the Arbiter (from either trigger).
const DRONES_FIGHT = [
  { text: 'The ribs overhead rang like a struck bell, and the sound ran away down the corridor and came back changed. Out of the dark between the ribs uncoiled three serpents of bronze, each no longer than a man, with no wings at all and no need of them. They swam through the air as eels swim through water, and their eyes were little teal lamps.', sfx: 'servo' },
  { battle: 'e3_drones' },
  { cond: ALLC(F('ch3.drones_dead'), NOT(F('ch3.welcome'))), effects: [{ scene: 'sc_welcome' }] },
];

// The Singing Pillar fight and the waking of the crew.
const PILLAR_FIGHT = [
  { battle: 'e3_pillar' },
  { cond: ALLC(F('ch3.crew_woken'), NOT(F('ch3.crew_scene'))), effects: [{ scene: 'sc_crew_wake' }] },
];

// The Wyrm's fate (design/ENDINGS.md, choice 1): after the Warden falls the
// chain stops, so the choice is made from rest (autosave + the 'wyrm'
// checkpoint the end screen can return to). Ain, the sun or the Warden's
// wreck opens dlg_wyrm_fate; its replies run the beaching and the chapter end.
const FATE_OPEN = ALLC(F('ch3.warden_dead'), NOT(F('ch3.beached')));
// The dialogue only records the answer; the beaching and the chapter end run
// here, after it closes (the ch2 dlg_sail pattern), so the next chapter is
// entered from explore mode.
const FATE_CHAIN = [
  { dialogue: 'dlg_wyrm_fate' },
  { cond: ALLC(F('ch3.fate_burn'), NOT(F('ch3.beached'))), effects: [{ set: 'ch3.beached' }, { objective: { id: 'ch3_fate', to: 'done' } },
    { scene: 'sc_beaching' }, { give: 'sun_shard' }, { chapterEnd: 3 }] },
  { cond: ALLC(F('ch3.wyrm_spared'), NOT(F('ch3.beached'))), effects: [{ set: 'ch3.beached' }, { objective: { id: 'ch3_fate', to: 'done' } },
    { scene: 'sc_beaching_spared' }, { chapterEnd: 3 }] },
];
const FATE_TALK = { cond: FATE_OPEN, text: 'Ain hangs among the turning rings, teal against gold, waiting.', effects: FATE_CHAIN };

// ---------------------------------------------------------------- rooms
export const rooms = {
  // ============================================================ THE GRAVEYARD OF SHIPS
  wyr_graveyard: {
    name: 'The Graveyard of Ships', bg: 'bg/wyr-graveyard', music: 'wyrm', ambience: 'loop-sea', machine: true, dungeon: true,
    map: { x: 0, y: 1 }, mapName: 'Graveyard', seekTrouble: 'wyrm',
    fx: [{ type: 'dust', n: 18 }, { type: 'torch', x: 155, y: 100, r: 50 }, { type: 'vignette', a: 0.35 }],
    glints: [
      { x: 146, y: 96, small: true, period: 200, cond: NOT(F('ch3.door_open')) },                       // the egg sockets
      { x: 166, y: 96, small: true, period: 200, phase: 100, cond: NOT(F('ch3.door_open')) },
      { x: 65, y: 126, small: true, steady: true, cond: NOT(F('ch3.brazen_dead')) },                     // the stone in the bronze man's chest
      { x: 205, y: 138, small: true, period: 90, cond: NOT(F('ch3.blade_taken')) },                      // the blade's hum
    ],
    desc: [
      { cond: F('ch3.door_open'), text: 'The graveyard of ships lay quiet now under its bars of cold light. The great round [[door|door]] stood open on a ribbed corridor, its two sockets full and glowing. The [[shrike|Shrike]] lay on her side among the dead hulls, and the [[galley|strange galley]] kept its silver [[skeleton|skeleton]] company.' },
      { text: 'It was a hold as vast as a temple, warm as a horse\'s flank and humming like a hive, and it was full of ships. They lay where the Wyrm had spat them, heeled over on a floor of bronze: a black [[barge|Stygian barge]] with a serpent prow, the broken ribs of an old [[trireme|trireme]], and a pale [[galley|galley]] of a make no shipwright living could name. Biggest and nearest lay the [[shrike|Crimson Shrike]], on her side like a drunk in a gutter, red sails sprawled. Beside the barge stood a [[brazen|man of bronze]], still as a statue. At the far end of the hold, a great round [[door|door]] was shut, and long [[scrapes|scrape marks]] ran across the floor toward it.' },
    ],
    short: [
      { cond: F('ch3.door_open'), text: 'The graveyard of ships. The round [[door|door]] stands open; the [[shrike|Shrike]] lies on her side; the silver [[skeleton|skeleton]] keeps watch in the [[galley|galley]].' },
      { text: 'The graveyard of ships: the [[shrike|Shrike]], the [[barge|barge]], the pale [[galley|galley]], the [[brazen|bronze man]], and the shut round [[door|door]].' },
    ],
    exits: [
      { dir: 'in', label: 'Deeper, into the Wyrm', names: ['on', 'deeper', 'corridor', 'through'], to: 'wyr_corridor',
        cond: ALLC(F('ch3.door_open'), F('ch3.spiders_dead')),
        blocked: [
          { cond: NOT(F('ch3.spiders_dead')), text: 'Kord makes for the far end of the hold. Glass legs tick on bronze behind him, close, and closer. The spiders have not given up on him, and he will not turn his back on them.' },
          { text: 'The great round door is shut fast. Two egg-shaped sockets in its face stand empty, and glow faintly, like eyes waiting to be filled.' },
        ],
        blockedEffects: [{ cond: NOT(F('ch3.spiders_dead')), effects: [{ battle: 'e3_spiders' }] }] },
    ],
    onEnter: [{ cond: NOT(F('ch3.intro_done')), effects: [{ scene: 'sc_ch3_open' }] }],
    encounters: [
      { id: 'e3_spiders', auto: true, label: '⚔ Face the glass spiders', cond: NOT(F('ch3.spiders_dead')) },
      { id: 'e3_brazen', auto: false, label: '⚔ Approach the barge', cond: ALLC(F('ch3.spiders_dead'), NOT(F('ch3.brazen_dead'))) },
    ],
    shout: { text: 'Kord\'s roar goes rolling away among the dead ships and comes back from a dozen hulls at once, as if every drowned crew in the hold were shouting with him. Valka winces. "Don\'t do that. Some of them might answer."' },
    say: [{ match: 'crom', response: { text: 'Kord says the name of his god into the belly of a dragon. It seems, for once, an occasion that deserves it.' } }],
    banter: {
      valka: { speaker: 'valka', text: '"Look at her. Lying on her side with her skirts over her head, my poor girl. Whatever did this is going to pay for the paint."' },
      ain: [
        { cond: NOT(F('ch3.door_open')), speaker: 'ain', text: '"The door has two sockets shaped like eggs. I would look for eggs. Warm ones, that hum." Kord: "You want me to find eggs in a dragon." "Yes."' },
        { speaker: 'ain', text: '"Every ship here was taken whole, as a collector takes butterflies. Nothing was eaten. Things that do not eat are hard to understand."' },
      ],
    },
    things: [
      { id: 'door', kind: 'prop', name: 'great round door', names: ['door', 'round door', 'great door', 'sockets', 'socket', 'egg sockets'],
        sprite: { id: 'prop/egg-socket-door', x: 125, y: 64 }, still: true,
        look: [
          { cond: F('ch3.door_open'), text: 'The round door has turned aside like an eye opening. In its sockets the two star-stones glow and hum together, in tune.' },
          { cond: F('ch3.socket_one'), text: 'One socket holds a star-stone, glowing, humming a note that seems to be waiting for its other half. The second socket is empty and dark.' },
          { text: 'A door as round as a millstone and twice a man\'s height, of bronze worked with rings inside rings. There is no handle, no hinge, no keyhole. In its face are two hollows, each the size and shape of a goose\'s egg, glowing faintly from within, like eyes that want filling.' },
        ],
        take: 'Kord sets his shoulder to the door and heaves until the veins stand out on his neck. The door hums, mildly, the way a cow chews.',
        hit: [
          { cond: F('ch3.door_open'), text: 'It is open. Hitting it now would be spite.' },
          { text: 'Kord hammers the door with his fist. It answers with a long, low note, like a temple gong a mile away. It does not open. It does, perhaps, take offence.' },
        ],
        talk: 'Kord tells the door to open. Ain watches with interest. The door does not open. "It was worth a try," says Ain kindly.',
        use: {
          star_stone: [
            { cond: F('ch3.door_open'), text: 'Both sockets are full. The door is open.' },
            { cond: F('ch3.socket_one'), text: 'Kord thumbs the second star-stone into the empty socket. It clicks home like a bone into its joint.', sfx: 'puzzle',
              effects: [{ take: 'star_stone', quiet: true }, { set: 'ch3.door_open' }, { scene: 'sc_door_open' }] },
            { cond: { has: 'star_stone', n: 2 }, text: 'Kord fits the two star-stones into their sockets, one, then the other. They click home like bones into their joints.', sfx: 'puzzle',
              effects: [{ take: 'star_stone', n: 2, quiet: true }, { set: 'ch3.door_open' }, { scene: 'sc_door_open' }] },
            { text: 'Kord thumbs the star-stone into one socket. It clicks home and glows, and hums one note, and then goes on humming it, the way a man hums half a song and waits for someone to finish it. The other socket stays dark.', sfx: 'puzzle',
              effects: [{ take: 'star_stone', quiet: true }, { set: 'ch3.socket_one' }] },
          ],
          humming_blade: { text: 'The blade hums at the door; the door hums back, politely. They are of a family, but the door wants eggs, not swords.' },
          ain: { speaker: 'ain', text: '"I am the wrong shape," says Ain, hovering at a socket. "I have too many facets. And I would rather not be a doorknob."' },
          '*': { text: 'Kord tries the {item} in a socket. It is the wrong shape, the wrong weight, and somehow the wrong temperature.' },
        },
      },
      { id: 'skeleton', kind: 'prop', name: 'silver skeleton', names: ['skeleton', 'bones', 'silver skeleton', 'dead man', 'corpse'],
        sprite: { id: 'prop/silver-skeleton', x: 186, y: 124 }, still: true,
        look: [
          { cond: F('ch3.window_awake'), text: 'The bones in the strange galley wear what is left of clothes of silver, the same as the man in the window. Whoever he was, he got out of the Wyrm once. It came for him again.' },
          { cond: F('ch3.blade_taken'), text: 'The skeleton sits against the galley\'s side with its empty hands in its lap, lighter by a sword, a stone, a shirt and a shield. It does not seem to mind. It has the patient look of a man who has been waiting a very long time and expects to wait longer.' },
          { text: 'Under the galley\'s side, as if he had crawled out of her hold to die where he could see the door, sits a skeleton in clothes of silvery stuff of no fashion on earth: a shirt that shimmers like a fish\'s belly, a disc of glassy bronze strapped to one arm. His bony fingers are locked round the hilt of a sword that hums, very softly, like a bee in a jar. In his lap, cradled like a child, lies an egg-shaped stone, warm and glowing.' },
        ],
        take: [
          { cond: F('ch3.blade_taken'), text: 'He has given all he has. Kord leaves the old man his bones.' },
          { text: 'Kord kneels and unlocks the dead fingers from the hilt, one by one, gently, as a man takes a cup from a sleeping friend.', sfx: 'pickup',
            effects: [{ set: 'ch3.blade_taken' }, { give: 'humming_blade' }, { give: 'star_stone' }, { give: 'star_weave_mail' }, { give: 'aegis_disc' }, { scene: 'sc_blade' }] },
        ],
        hit: 'Kord does not rob a dead man and then beat him. There is a right order to these things, and that is not it.',
        talk: [
          { cond: F('ch3.blade_taken'), text: 'Kord thanks the dead man for the sword. It seems only decent. The skull grins, which is all skulls ever do.' },
          { text: '"Mind if I borrow that?" Kord asks the skeleton. The skeleton, holding its sword like a promise, says nothing, which in Cimmeria counts as yes.' },
        ],
        use: {
          self: [{ cond: F('ch3.blade_taken'), text: 'Nothing more to take.' }, { text: 'Search him, then. Take what he holds.' }],
          '*': { text: 'Kord offers the {item} to the dead man. The dead man has everything he needs, which is nothing.' },
        },
      },
      { id: 'galley', kind: 'thing', name: 'Atlantean galley', names: ['galley', 'pale galley', 'strange galley', 'atlantean galley', 'pale ship', 'strange ship'],
        hotspot: { x: 180, y: 84, w: 44, h: 38 },
        look: [
          { cond: F('ch3.coin_taken'), text: 'The pale galley: lines like a swan\'s neck, wood like grey glass, oar-ports shaped like eyes. A make no shipwright living could name. Ain could name it, perhaps, but has gone quiet.' },
          { text: 'A pale galley, long and narrow, with lines like a swan\'s neck and wood gone grey and smooth as glass. Her oar-ports are shaped like eyes, and her prow bears the face of a king who has been forgotten so thoroughly that even his face looks surprised. A make no shipwright living could name. Something glints in the dust of her hold.' },
        ],
        take: [
          { cond: F('ch3.coin_taken'), text: 'Kord rummages through the hold again. Dust, more dust, and a smell like the inside of an old bell.' },
          { text: 'Kord climbs into the hold and comes out with a gold coin, heavy as a thumb, stamped with a king no one remembers. "Atlantean," says Ain. "From before the sea came in." Kord bites it. "Still gold," he says, satisfied.', sfx: 'coins',
            effects: [{ set: 'ch3.coin_taken' }, { give: 'atlantean_coin' }] },
        ],
        hit: 'Kord kicks the galley. Something deep in her hull gives one note, sweet and sad, like a harp string in an empty room.',
        talk: 'Kord asks the galley where she came from. She came from the bottom of the sea, and before that from a land that is now the bottom of the sea, and she keeps the rest to herself.',
        use: { '*': { text: 'The galley has no use for the {item}. She has no use for anything, any more.' } },
      },
      { id: 'barge', kind: 'thing', name: 'Stygian barge', names: ['barge', 'stygian barge', 'black barge', 'serpent prow', 'longship'],
        hotspot: { x: 8, y: 78, w: 70, h: 48 },
        look: [
          { cond: F('ch3.brazen_dead'), text: 'A Stygian barge, black-hulled, with a serpent for a prow and a hold full of rotten offerings: dried figs, wax gods, a crocodile in a jar. The priests of Set send gifts to the sea. The sea, it seems, sent them here.' },
          { text: 'A Stygian barge, black-hulled, with a serpent for a prow and painted eyes on her bows. Beside her stands the bronze man, motionless, face turned toward the barge as if he were guarding it. Statues do not usually guard things. Statues do not usually have a light in their chest.' },
        ],
        take: [
          { cond: F('ch3.brazen_dead'), text: 'Kord pokes through the barge\'s offerings. Wax gods, dried figs, a crocodile in a jar. He takes nothing. Even Kord has standards about what he steals from gods.' },
          { text: 'Kord walks toward the barge. Three paces from it, the bronze man turns its head.', effects: [{ scene: 'sc_brazen' }] },
        ],
        hit: [
          { cond: F('ch3.brazen_dead'), text: 'The barge booms like a drum. A wax god falls out of the hold and breaks. Kord feels better about Stygia already.' },
          { text: 'Kord strides up to give the barge a kick. He never arrives.', effects: [{ scene: 'sc_brazen' }] },
        ],
        use: { self: [{ cond: F('ch3.brazen_dead'), text: 'Nothing aboard worth the climb.' }, { text: 'Kord makes for the barge.', effects: [{ scene: 'sc_brazen' }] }] },
      },
      { id: 'brazen', kind: 'prop', name: 'bronze man', names: ['bronze man', 'brazen man', 'statue', 'bronze statue', 'brazen'],
        sprite: { id: 'enemy/brazen-man', x: 48, y: 104 }, still: true, cond: NOT(F('ch3.brazen_dead')),
        look: 'A man of bronze half again Kord\'s height, faceless, with fists like anvils, standing by the barge as still as any temple statue. In the middle of its chest, behind a grille of bronze bars, an egg-shaped stone glows and hums. Its head is turned toward the barge. Kord has the strong impression that it was not turned that way a moment ago.',
        take: { text: 'Kord reaches through the grille for the glowing stone.', effects: [{ scene: 'sc_brazen' }] },
        hit: { text: 'Kord squares up to the bronze man.', effects: [{ scene: 'sc_brazen' }] },
        talk: { text: '"You. Bronze. Give me that stone." The bronze man turns its faceless head toward Kord, slowly, and takes a step.', effects: [{ scene: 'sc_brazen' }] },
        use: { '*': { text: 'Kord steps in with the {item}.', effects: [{ scene: 'sc_brazen' }] } },
      },
      { id: 'brazen_wreck', kind: 'thing', name: 'fallen bronze man', names: ['bronze man', 'brazen man', 'wreck', 'statue', 'bronze'],
        hotspot: { x: 44, y: 130, w: 40, h: 24 }, cond: F('ch3.brazen_dead'),
        look: 'The bronze man lies on its back by the barge, its chest-grille torn open and empty, one hand still opening and closing on nothing, slower and slower, like a dying crab.',
        take: 'Too heavy to carry and too ugly to sell.',
        hit: 'Kord kicks the bronze man in the head. It rings. It does not get up. Both of those are satisfying.',
      },
      { id: 'shrike', kind: 'thing', name: 'the Crimson Shrike', names: ['shrike', 'crimson shrike', 'ship', 'valka ship', 'sails', 'red sails'],
        hotspot: { x: 226, y: 28, w: 90, h: 96 },
        look: [
          { cond: F('ch3.crew_woken'), text: 'The Shrike lies on her side, but not for long: her crew swarm over her with ropes and mallets and a great deal of swearing, and Mother Teg\'s voice rises over all of it like a gull\'s.' },
          { text: 'The Crimson Shrike lies heeled over on the bronze floor, red sails sprawled, her masts reaching for a sky that is not there. Not a plank sprung. Not a soul aboard. Her deck is scored with long scrape marks, as if something with many arms had wiped her clean of men and carried them off.' },
        ],
        take: { speaker: 'valka', text: '"Lay a finger on my ship, Cimmerian, and you\'ll be wearing it."' },
        hit: { speaker: 'valka', text: '"Hit my ship again and I hit you, and I don\'t use my fist."' },
        talk: { speaker: 'valka', text: '"Talk to her if you like. She doesn\'t answer anyone but me, and today she\'s sulking."' },
        use: { '*': { speaker: 'valka', text: '"Keep your {item} off my ship."' } },
      },
      { id: 'chest', kind: 'prop', name: 'Valka\'s sea-chest', names: ['chest', 'sea chest', 'sea-chest', 'valka chest', 'trunk'],
        sprite: { id: 'prop/chest-closed', x: 272, y: 128 }, still: true, cond: NOT(F('ch3.chest_open')),
        look: 'A sea-chest bound in brass, thrown out of the Shrike\'s stern cabin when she went over. Painted on the lid, in red: PROPERTY OF R. VALKA. TOUCH AND DIE.',
        take: { text: 'Kord flips the lid. Valka is at his elbow before it is fully open, and snatches out a folded letter so fast it seems never to have been there. "That\'s private." What remains is a lotus tincture and a pair of gold earrings. She hands him the tincture. "Take it. I\'ve got spares of everything but patience."', sfx: 'chest',
          effects: [{ set: 'ch3.chest_open' }, { give: 'lotus_tincture' }] },
        hit: { speaker: 'valka', text: '"That chest has outlived three husbands. Not mine; other people\'s. Leave it."' },
        use: { self: { text: 'Kord flips the lid.', effects: [{ set: 'ch3.chest_open' }, { give: 'lotus_tincture' }, { speaker: 'valka', text: '"Take the tincture. Touch the letter and lose the hand."' }] } },
      },
      { id: 'chest_open', kind: 'prop', name: 'Valka\'s sea-chest', names: ['chest', 'sea chest', 'sea-chest', 'valka chest', 'trunk'],
        sprite: { id: 'prop/chest-open', x: 273, y: 128 }, still: true, cond: F('ch3.chest_open'),
        look: 'Valka\'s sea-chest, open: gold earrings, a spare dagger, a comb with three teeth left, and a conspicuous gap where a letter used to be.',
        take: { speaker: 'valka', text: '"You\'ve had your share, Cimmerian. The earrings are mine. So is the comb, and so is the gap where the letter was."' },
        hit: 'Kord shuts the lid with his boot. It is the most domestic thing he has done in years.',
      },
      { id: 'trireme', kind: 'thing', name: 'old trireme', names: ['trireme', 'old trireme', 'war galley', 'hulls', 'ships'],
        hotspot: { x: 90, y: 82, w: 42, h: 40 },
        look: 'The ribs of a war-galley with three banks of oars, so old the bronze of her ram has gone the green of deep water. Barnacles have grown over barnacles. Whoever rowed her has been dust since before Shadizar had a name.',
        take: 'Kord tugs at an oar. It comes away in his hands and crumbles. He sets the crumbs down respectfully.',
        hit: 'The old ship sighs out a cloud of dust and settles another inch. Kord decides she has suffered enough.',
      },
      { id: 'scrapes', kind: 'thing', name: 'scrape marks', names: ['scrapes', 'scrape marks', 'marks', 'tracks', 'floor'],
        hotspot: { x: 120, y: 140, w: 84, h: 22 },
        look: [
          { cond: F('ch3.crew_woken'), text: 'The scrape marks, already scuffed over by the crew\'s boots coming back. The Wyrm took them in a line. They walked back out in a crowd, arguing.' },
          { text: 'Long scrape marks on the bronze, in sets of five, like the fingers of a hand that dragged and dragged. Here and there among them: a sandal, a dropped knife, a sailor\'s earring. They run straight across the hold to the round door and stop there.' },
        ],
        take: { text: 'Kord picks up a dropped knife from among the marks. Valka takes it from him and turns it over. "Jory\'s," she says, very quietly. "He\'ll want it back."' },
        hit: 'Kord punches the floor. The floor, which is warm, hums at him like a cat that has decided not to scratch.',
      },
    ],
  },

  // ============================================================ THE RIBBED CORRIDOR
  wyr_corridor: {
    name: 'The Ribbed Corridor', bg: 'bg/wyr-corridor', music: 'wyrm', ambience: 'loop-dungeon', machine: true, dungeon: true,
    map: { x: 1, y: 1 }, mapName: 'Corridor', seekTrouble: 'wyrm',
    fx: [{ type: 'motes', n: 14 }, { type: 'vignette', a: 0.35 }],
    glints: [{ x: 84, y: 88, small: true, period: 160, cond: NOT(F('ch3.greatsword_taken')) }],   // the black blade in the rib
    desc: [
      { cond: F('ch3.welcome'), text: 'The Ribbed Corridor ran on into the Wyrm like a gullet, bronze ribs arching overhead, and the [[lights|lights in the floor]] crept along at the party\'s heels like faithful dogs. On the right, the [[side_door|side door]] that had greeted Ain stood open on green light and the smell of leaves. The [[wreck|serpents of bronze]] lay where they had fallen.' },
      { text: 'Beyond the round door ran a corridor like the gullet of some enormous beast, and the beast had been built, not born. Bronze [[ribs|ribs]] arched overhead, one after another, dwindling to a point in the dark. Along the floor ran two bands of [[lights|cold light]], and as the party walked, the light woke under their feet and followed them, like a dog that has picked up a scent. Lodged deep in one rib, at the height of a man\'s chest, a great black [[greatsword|sword]] stuck out of the bronze as if some warrior had swung it with all his strength and never got it back. On the right, a [[side_door|tall door]] stood shut, with no handle at all.' },
    ],
    short: [
      { cond: F('ch3.welcome'), text: 'The Ribbed Corridor: [[ribs|ribs]], following [[lights|lights]], and the open [[side_door|side door]] to the garden.' },
      { text: 'The Ribbed Corridor: [[ribs|bronze ribs]], [[lights|lights]] that follow, the [[greatsword|black sword]] in the rib, and a shut [[side_door|side door]].' },
    ],
    exits: [
      { dir: 'w', label: 'The Graveyard of Ships', names: ['back', 'graveyard', 'ships', 'round door', 'hold'], to: 'wyr_graveyard' },
      { dir: 'e', label: 'Deeper', names: ['on', 'deeper', 'statues', 'hall'], to: 'wyr_pens',
        cond: F('ch3.drones_dead'), seemsOpen: true,
        blocked: 'Kord starts down the corridor. He gets ten paces.', blockedEffects: DRONES_FIGHT },
      { dir: 'n', label: 'The Glass Garden', names: ['garden', 'glass garden', 'green door'], to: 'wyr_garden',
        cond: F('ch3.welcome'),
        blocked: 'The tall door has no handle, no hinge and no lock, and does not care how hard Kord leans on it.' },
    ],
    onEnter: [
      { cond: NOT(F('ch3.corridor_seen')), effects: [{ set: 'ch3.corridor_seen' },
        { speaker: 'ain', text: '"Those are photonic guidance strips, keyed to body heat. They—" Kord: "Speak Cimmerian." Ain: "...Lamps that follow you."' }] },
      { cond: ALLC(F('ch3.drones_dead'), NOT(F('ch3.welcome'))), effects: [{ scene: 'sc_welcome' }] },
    ],
    say: [
      { match: 'arbiter', response: { text: 'Kord says it to the door, with a sneer. The door does nothing. It is particular about who it talks to.' } },
      { match: 'open', response: [
        { cond: F('ch3.welcome'), text: 'The side door is already open. It seems almost pleased with itself.' },
        { text: 'Kord orders the side door to open. It declines, in perfect silence.' }] },
    ],
    shout: { text: 'Kord bellows down the corridor. The lights at his feet flare in alarm and then, finding nothing to light but a shouting Cimmerian, settle back down, a little sulky.' },
    banter: {
      toktai: [
        { cond: F('ch3.welcome'), speaker: 'toktai', text: '"\'Welcome back,\' it said. When the dog wags at a stranger, Cimmerian, ask where the stranger has been."' },
        { speaker: 'toktai', text: '"That sword in the rib. Someone else came this way, a long time ago, and fought. An empty saddle tells you the road. Usually it tells you to take another one."' },
      ],
    },
    things: [
      { id: 'lights', kind: 'thing', name: 'following lights', names: ['lights', 'light', 'floor lights', 'strips', 'cold light', 'lamps'],
        hotspot: { x: 40, y: 150, w: 240, h: 28 },
        look: 'Two bands of cold light set into the floor, the colour of shallow sea. Where the party walks they brighten; behind them they fade. Kord stops; the lights stop. He takes one step sideways; the light shuffles after him like a hopeful dog.',
        take: 'Kord tries to pry up a piece of the light with his knife. It is under the floor, or in it, or both. His knife slides off as if off ice.',
        hit: 'Kord stamps on the light. It brightens around his boot, eagerly, as if he had asked for more.',
        talk: 'Kord tells the lights to go away. They dim, hurt, and creep back the moment he moves.',
      },
      { id: 'ribs', kind: 'thing', name: 'bronze ribs', names: ['ribs', 'rib', 'bronze ribs', 'arches', 'walls', 'wall'],
        hotspot: { x: 0, y: 16, w: 60, h: 112 },
        look: 'Ribs of bronze, each as thick as a man\'s body, arching overhead and down into the floor. Between them the walls are faced with something like dark glass, and behind the glass, faint shapes move and glimmer, like fish under ice. The walls hum. If Kord puts his hand to them, they are warm, and he feels the hum in his teeth.',
        take: 'Even Kord cannot take a rib out of a dragon.',
        hit: 'Kord slaps a rib. It rings, long and low, and somewhere far ahead, something rings back.',
      },
      { id: 'greatsword', kind: 'thing', name: 'black sword', names: ['greatsword', 'black sword', 'sword in the rib', 'great sword', 'hilt'],
        hotspot: { x: 68, y: 72, w: 30, h: 40 }, cond: NOT(F('ch3.greatsword_taken')),
        look: 'A greatsword as long as Valka is tall, black as a moonless night, sunk a hand\'s depth into the bronze of a rib. Its edge is unchipped. Its hilt is wrapped in a leather that has long since rotted, and under it the steel is faintly warm. Whoever swung it meant to cut the Wyrm in half. The Wyrm kept the sword; nobody knows what it kept of him.',
        take: { text: 'Kord sets a boot against the rib, takes the hilt in both hands, and pulls. The rib groans. Kord groans louder. With a shriek of bronze the black blade comes free, and the corridor rings with it from end to end like a great bell.', sfx: 'clang',
          effects: [{ set: 'ch3.greatsword_taken' }, { give: 'star_iron_greatsword' },
            { speaker: 'kord', text: '"Ha. Now that is a sword."' },
            { speaker: 'toktai', text: '"It is longer than I am." "Everything is longer than you are," says Valka.' },
            { cond: NOT(F('ch3.drones_dead')), effects: DRONES_FIGHT }] },
        hit: 'Kord whacks the hilt. The blade quivers in the rib with a deep, angry thrum, but stays.',
        use: { self: { text: 'Pull it, then.' }, '*': { text: 'Kord levers at the black sword with the {item}. The {item} bends first.' } },
      },
      { id: 'side_door', kind: 'thing', name: 'side door', names: ['side door', 'side', 'tall door', 'door'],
        hotspot: { x: 233, y: 58, w: 42, h: 82 },
        look: [
          { cond: F('ch3.welcome'), text: 'The tall door stands open, folded into the wall like a sleeve. Through it come green light, warm air, and a smell of leaves that has no business inside a dragon.' },
          { text: 'A tall door of bronze set between two ribs, chased with leaves and suns. It has no handle, no lock and no seam Kord can get a knife into. Every so often, faintly, it hums, as if thinking about something.' },
        ],
        take: [{ cond: F('ch3.welcome'), text: 'It is open. Go through.' }, { text: 'Kord digs his fingers at the edge of the door. There is no edge.' }],
        hit: [{ cond: F('ch3.welcome'), text: 'Kord thumps the open door. "WELCOME BACK, ARBITER," it says again, brightly. Everyone looks at Ain. Ain looks at the floor, which is difficult for a stone.' },
          { text: 'Kord hammers on the door. It hums, faintly, as a sleeper murmurs when you shake him and does not wake.' }],
        talk: [{ cond: F('ch3.welcome'), text: '"WELCOME BACK, ARBITER," says the door, to Ain, not to Kord. It has never once welcomed Kord.' }, { text: 'The door does not answer Kord. It seems to be waiting for someone else.' }],
        use: { ain: { speaker: 'ain', text: '"It is already open. I did not do anything. I would like that written down."' }, '*': { text: 'The door has no keyhole for the {item}. It has no keyhole for anything.' } },
      },
      { id: 'wreck', kind: 'thing', name: 'fallen serpent-drones', names: ['wreck', 'drones', 'serpents', 'serpent drones', 'bronze serpents'],
        hotspot: { x: 120, y: 124, w: 70, h: 20 }, cond: F('ch3.drones_dead'),
        look: 'Three bronze serpents lie broken on the floor, their little lamp-eyes gone dark. One still twitches its tail now and then, like a dreaming dog.',
        take: 'Kord picks one up. It is lighter than it looks and full of tiny wheels. He drops it, wipes his hand on his thigh, and does not say why.',
        hit: 'Kord stamps on the twitching one. It stops twitching. Toktai nods approval.',
      },
    ],
  },

  // ============================================================ THE GLASS GARDEN (optional)
  wyr_garden: {
    name: 'The Glass Garden', bg: 'bg/wyr-garden', music: 'wyrm', ambience: null, machine: true, dungeon: true,
    map: { x: 1, y: 0 }, mapName: 'Glass Garden',
    fx: [{ type: 'motes', n: 26 }, { type: 'torch', x: 220, y: 52, r: 60 }],
    glints: [{ x: 220, y: 72, small: true, period: 140, cond: NOT(F('ch3.prism_taken')) }],
    desc: [
      { text: 'Beyond the side door lay a garden, under a [[sun|sun]] that hung from the ceiling on a golden chain. It was a small sun and a false one, but it was warm, and under it, inside great bells of glass, [[trees|fruit trees]] grew in green and perfect rows, heavy with fruit like blown glass. A [[spring|spring]] welled up in a round basin, clear as air, and its sound was the first honest sound the Wyrm had made. Along one wall, beneath windows that looked out into black water, stood [[tablets|tablets of glass]] covered in writing, and in a case on the far wall hung a [[bow_case|bow]] with no string.' },
    ],
    short: 'The Glass Garden: the false [[sun|sun]], the [[trees|glass trees]], the [[spring|spring]], the [[tablets|tablets]], the [[bow_case|bow case]].',
    exits: [
      { dir: 's', label: 'The Ribbed Corridor', names: ['back', 'corridor', 'out', 'side door', 'door'], to: 'wyr_corridor' },
    ],
    onEnter: [{ cond: NOT(F('ch3.garden_seen')), effects: [{ set: 'ch3.garden_seen' },
      { speaker: 'valka', text: '"Trees. In a dragon. Under a lamp." She sniffs the air. "Somebody in this world has more money than sense, and I want to meet them, and rob them."' }] }],
    shout: { text: 'Kord\'s roar sets every glass bell in the garden ringing, one after another, high and sweet, until the whole room sings like a temple choir of very small priests. He does not do it again. He would like to.' },
    banter: {
      ain: { speaker: 'ain', text: '"It is very beautiful. Everything here is perfect, and nothing has ever been allowed to grow wrong. I find I would rather be in a ditch with you three. I do not know what that means about me."' },
      toktai: { speaker: 'toktai', text: '"What is a garden? A field that has been told what to do. This one has been told very firmly."' },
    },
    things: [
      { id: 'spring', kind: 'thing', name: 'healing spring', names: ['spring', 'water', 'basin', 'pool', 'fountain'],
        hotspot: { x: 146, y: 134, w: 130, h: 20 },
        look: [
          { cond: F('ch3.coin2_taken'), text: 'The spring wells up clear and cold in its round basin, among pebbles of coloured glass. It smells of rain on stone. Drink, and the hurts close.' },
          { text: 'The spring wells up clear and cold in a round basin, among pebbles of coloured glass. It smells of rain on stone, the way the world smelled before cities. At the bottom, among the pebbles, lies a single gold coin, thrown there long ago by someone who wanted to come back.' },
        ],
        take: [
          { cond: NOT(F('ch3.coin2_taken')), text: 'Kord rolls up his sleeve and fishes the gold coin out of the basin, stamped with a king no one remembers. "For luck," says Valka. "Somebody threw it for luck." Kord bites it. "Now it\'s mine. Lucky me."', sfx: 'coins',
            effects: [{ set: 'ch3.coin2_taken' }, { give: 'atlantean_coin' }] },
          { text: 'Kord cups his hands and drinks. The water is cold enough to ache, and the ache goes down into every cut and bruise and finds them and closes them. Toktai and Valka drink after him. Ain bathes in the light off the water and glows a little brighter.', sfx: 'heal',
            effects: [{ heal: 'party' }, { autosave: true }, { text: 'The party is healed. (A good place to save the chronicle: the game has been saved, and Menu → Save keeps a copy in a slot.)' }] },
        ],
        use: {
          self: [{ text: 'Kord drinks from the spring. The cold goes down into every cut and bruise and closes them.', sfx: 'heal',
            effects: [{ heal: 'party' }, { autosave: true }, { text: 'The party is healed, and the chronicle saved.' }] }],
          ain: { speaker: 'ain', text: '"I am waterproof, but it seems impolite to bathe in a well." It hovers over the water instead and drinks the light off it. It glows a little brighter.', effects: [{ heal: 'party' }] },
          '*': { text: 'Kord dips the {item} in the spring. It comes out cleaner, which is more than can be said for Kord.' },
        },
        hit: 'Kord slaps the water. It splashes Valka. Valka splashes back with a bucket nobody saw her pick up.',
        talk: 'Kord talks to the spring. It burbles back. It is the most pleasant conversation he has had in a dragon.',
      },
      { id: 'trees', kind: 'thing', name: 'glass trees', names: ['trees', 'glass trees', 'fruit trees', 'bells', 'bell jars', 'glass bells', 'fruit'],
        hotspot: { x: 166, y: 80, w: 112, h: 52 },
        look: [
          { cond: F('ch3.fruit_taken'), text: 'Trees in bells of glass, in perfect rows, never touched by wind or bird or worm. Kord has picked them a little less perfect. It is an improvement.' },
          { text: 'Fruit trees, each in its own great bell of glass, perfect, unhurried, never touched by wind or bird or worm. The fruit hangs heavy: clear, glassy globes with a star of light at the core of each, fizzing faintly, like wine about to be poured.' },
        ],
        take: [
          { cond: F('ch3.fruit_taken'), text: 'Kord has already robbed the orchard. The trees look at him reproachfully, as much as trees in jars can.' },
          { text: 'Kord lifts the hem of a glass bell, reaches in and picks two of the starry fruits. He bites a third on the spot. It fizzes on his tongue like lightning in wine. "Tastes like a storm," he says, and then, considering: "A good storm."', sfx: 'pickup',
            effects: [{ set: 'ch3.fruit_taken' }, { give: 'star_fruit', n: 2 }] },
        ],
        hit: 'Kord raises his fist at the glass. Valka catches his wrist. "Break the jar and you break the tree. We may want lunch again."',
        talk: 'Kord tells the trees they look like prisoners. Nobody contradicts him.',
      },
      { id: 'sun', kind: 'thing', name: 'false sun', names: ['sun', 'false sun', 'chain', 'golden chain', 'light', 'lamp'],
        hotspot: { x: 204, y: 36, w: 32, h: 30 },
        look: 'A sun no bigger than a shield, hung from the ceiling on a chain of gold. It is warm on the face and it does not hurt to look at, which is how Kord knows it is a liar. Below it, on the end of its chain, a [[prism|prism]] turns slowly, throwing little rainbows across the leaves.',
        take: 'Kord reaches for the sun. It is a long reach, and a hot one. He settles for warming his hands.',
        hit: 'Kord throws a pebble at the false sun. It goes through the light without a sound and comes down in the spring. Nothing else happens. He feels obscurely that he has lost.',
        talk: 'Kord asks the sun whether it is a god. It does not say no, which is suspicious.',
      },
      { id: 'prism', kind: 'thing', name: 'prism', names: ['prism', 'crystal', 'rainbow', 'facet'],
        hotspot: { x: 212, y: 66, w: 16, h: 14 }, cond: NOT(F('ch3.prism_taken')),
        look: 'A cut prism the length of a finger, hanging from the false sun\'s chain. It drinks the light and throws it back in colours. Ain drifts toward it like a moth toward a lamp, and its own teal pulse quickens.',
        take: { text: 'Kord plucks the prism from its chain. Ain hovers at his elbow. "May I? I think... it would help me think." Kord hands it over. "Careful," he says. "It might be sorcery." "Kord, I am sorcery," says Ain, "by your definition." "Exactly."', sfx: 'pickup',
          effects: [{ set: 'ch3.prism_taken' }, { give: 'prism_facet' }, { tip: 'equip' }] },
        hit: 'Kord flicks the prism. It spins, and the room spins with rainbows, and Toktai has to sit down.',
        use: { ain: { speaker: 'ain', text: '"I would like that very much," says Ain, and waits, with the elaborate patience of someone who cannot pick things up, for Kord to take it down.' } },
      },
      { id: 'tablets', kind: 'thing', name: 'glass tablets', names: ['tablets', 'tablet', 'glass tablets', 'writing', 'lore', 'inscription'],
        hotspot: { x: 110, y: 98, w: 44, h: 32 },
        look: [
          { cond: F('ch3.tablets_read'), text: 'Tablets of glass, written over in a script of tiny, tidy marks. A world where every man was fed and none was free. Ain does not look at them again.' },
          { text: 'Tablets of glass set in a bronze rail, written over in rows of tiny, tidy marks that shine faintly from within, as if the writing were lit by a candle under the glass. Kord cannot read. Neither, he suspects, could anyone else alive.' },
        ],
        take: 'They are part of the rail. Kord could break one off. He does not want to carry writing; it only ever leads to trouble.',
        hit: 'Kord taps the glass. The writing rearranges itself, primly, into the same words.',
        talk: [{ cond: F('ch3.tablets_read'), text: 'Kord has heard what they say. Once was enough.' }, { text: '"Ain. What does it say?"', effects: [{ scene: 'sc_tablets' }] }],
        use: {
          ain: [{ cond: F('ch3.tablets_read'), speaker: 'ain', text: '"I have read them. I would rather not again."' }, { text: 'Ain drifts to the tablets.', effects: [{ scene: 'sc_tablets' }] }],
          self: [{ cond: F('ch3.tablets_read'), text: 'Read enough.' }, { text: 'Kord squints at the writing, then at Ain.', effects: [{ scene: 'sc_tablets' }] }],
          '*': { text: 'Kord holds the {item} up to the glass. The glass is not interested.' },
        },
      },
      { id: 'bow_case', kind: 'thing', name: 'bow case', names: ['bow case', 'case', 'bow', 'stringless bow', 'glass case'],
        hotspot: { x: 284, y: 92, w: 32, h: 34 },
        look: [
          { cond: F('ch3.bow_taken'), text: 'An empty case of glass. Toktai has the bow, and is not giving it back.' },
          { text: 'A case of glass on the far wall, and in it a bow of pale bronze, beautifully curved, with no string at all. Toktai has gone very still and is looking at it the way Valka looks at gold.' },
        ],
        take: [
          { cond: F('ch3.bow_taken'), text: 'Empty.' },
          { cond: { inParty: 'toktai' }, text: 'Toktai opens the case before Kord has finished reaching for it, lifts out the bow, and draws. Between his fingers and the grip a line of light appears, and on it an arrow of light, humming. He lets it down, very carefully. "Never trust a bow you did not make. My father beat that into me." He slings it across his back. "I will make an exception."', sfx: 'pickup',
            effects: [{ set: 'ch3.bow_taken' }, { give: 'bow_of_the_hours' }] },
          { text: 'Kord lifts out the bow and gives it a tug. There is no string. He hands it to nobody in particular and puts it in the bag, for Toktai.', effects: [{ set: 'ch3.bow_taken' }, { give: 'bow_of_the_hours' }] },
        ],
        hit: { speaker: 'toktai', text: '"Do not break that glass, Cimmerian. If you break the glass, you may break what is inside, and I will have to kill you, and I would miss you, a little."' },
        use: { '*': { text: 'The case opens without any {item}; it only wants a hand.' } },
      },
      { id: 'windows', kind: 'thing', name: 'windows', names: ['windows', 'window', 'black water', 'sea', 'panes'],
        hotspot: { x: 20, y: 38, w: 84, h: 100 },
        look: 'Tall windows of thick green glass, and beyond them nothing but black water, pressing close. Once, something long and pale swims past, very slowly, and looks in. Kord looks back. It leaves first.',
        take: 'It is a window into the sea. Taking it out would let the sea in.',
        hit: 'Kord raises a fist at the glass and thinks about the sea on the other side of it. He lowers his fist. Even Kord can do that sum.',
      },
    ],
  },

  // ============================================================ THE HALL OF STATUES
  wyr_pens: {
    name: 'The Hall of Statues', bg: 'bg/wyr-pens', music: 'wyrm', ambience: 'loop-dungeon', machine: true, dungeon: true,
    map: { x: 2, y: 1 }, mapName: 'Hall of Statues', seekTrouble: 'wyrm',
    fx: [{ type: 'motes', n: 12 }, { type: 'vignette', a: 0.4 }],
    glints: [
      { x: 199, y: 96, small: true, period: 60, cond: NOT(F('ch3.crew_woken')) },              // the pillar's singing core
      { x: 71, y: 92, pair: 3, small: true, steady: true, a: 0.5, cond: NOT(F('ch3.crew_woken')) }, // open, unseeing eyes
    ],
    desc: [
      { cond: F('ch3.crew_woken'), text: 'The Hall of Statues was only a hall now: long, cold, and empty, its [[alcoves|alcoves]] full of nothing but green light. Where the [[pillar_broken|singing pillar]] had stood lay a heap of cracked bronze and dull glass. The crew had gone back to the Shrike, and the silence they left behind was the best sound Kord had heard all day.' },
      { text: 'The corridor opened into a long hall lined on both sides with [[alcoves|alcoves]] of green light, row upon row, dwindling into the dark. In every alcove a man or woman stood upright and still, eyes open, staring at nothing: sailors of every nation and every age, and all of them humming. One note, low and endless, from a hundred throats. The [[crew|Shrike\'s crew]] stood nearest, and at their head, arms folded as if waiting for an order, stood [[teg|Mother Teg]]. In the middle of the hall rose a [[pillar|pillar]] of bronze and glass, taller than a man, its glass core pulsing in time with the hum. It was singing.' },
    ],
    short: [
      { cond: F('ch3.crew_woken'), text: 'The Hall of Statues: empty [[alcoves|alcoves]] and the broken [[pillar_broken|pillar]].' },
      { text: 'The Hall of Statues: the [[pillar|singing pillar]], the [[crew|crew]] standing like statues, [[teg|Mother Teg]], and the [[alcoves|alcoves]].' },
    ],
    exits: [
      { dir: 'w', label: 'The Ribbed Corridor', names: ['back', 'corridor'], to: 'wyr_corridor' },
      { dir: 'e', label: 'Deeper', names: ['on', 'deeper', 'window', 'far door'], to: 'wyr_window',
        cond: F('ch3.crew_woken'),
        blocked: 'Kord makes for the far door. Behind him, nobody follows: Valka has sat down against an alcove "for one moment", and Toktai is leaning on her, and the song goes on. He will not leave them here.' },
    ],
    onEnter: [{ cond: NOT(F('ch3.pens_seen')), effects: [{ set: 'ch3.pens_seen' }, { scene: 'sc_pens' }] }],
    shout: [
      { cond: NOT(F('ch3.crew_woken')), text: 'Kord bellows in Mother Teg\'s ear, a roar to empty a Cimmerian valley of crows. She does not blink. The hum does not falter. The song is louder than he is. For now.' },
      { text: 'Kord\'s roar goes down the empty hall and back. No one hums back. Good.' },
    ],
    banter: {
      toktai: [
        { cond: NOT(F('ch3.crew_woken')), speaker: 'toktai', text: '"I am not asleep. I am resting my eyes. And my ears. And my... what was I saying? Hit the pillar, Cimmerian. Hit it before I lie down."' },
        { speaker: 'toktai', text: '"That song was like being a child again, with my mother singing. My mother never sang. That is how I knew it was lying."' },
      ],
      valka: [
        { cond: NOT(F('ch3.crew_woken')), speaker: 'valka', text: '"I\'m fine. I\'m wide awake. I\'m just going to sit for a breath. Kord. Kord, break that bloody thing."' },
        { speaker: 'valka', text: '"My crew. Standing there like furniture, humming. I owe this Wyrm a death, and I always pay my debts."' },
      ],
    },
    things: [
      { id: 'pillar', kind: 'prop', name: 'singing pillar', names: ['pillar', 'singing pillar', 'column', 'core', 'song', 'note'],
        sprite: { id: 'enemy/singing-pillar', x: 186, y: 92 }, still: true, cond: NOT(F('ch3.crew_woken')),
        look: 'A pillar of bronze ribs taller than a man, caging a column of glass in which a light rises and falls, rises and falls, in time with the humming of the sleepers. Toktai and Valka look at it and their eyelids sag. Kord looks at it and sees a pillar. He listens hard. He hears nothing at all.',
        take: 'Kord wraps his arms round the pillar and heaves. It does not come up. It does, he thinks, sing a little louder, out of spite.',
        talk: 'Kord puts his ear to the pillar. Nothing. Not a whisper. Valka, watching him, yawns so hard her jaw cracks.',
        hit: { text: 'Kord rolls his shoulders, spits on his palms, and walks up to the singing pillar like a man walking up to a door he means to go through.', effects: PILLAR_FIGHT },
        use: {
          ain: { speaker: 'ain', text: '"I am trying. It is a song, and I cannot stop it; I can only hear it. Kord cannot hear it at all. I think that matters."' },
          '*': { text: 'The pillar wants something blunter than the {item}. Kord\'s fists, perhaps. Or his sword.' },
        },
      },
      { id: 'pillar_broken', kind: 'thing', name: 'broken pillar', names: ['pillar', 'broken pillar', 'singing pillar', 'bronze', 'glass'],
        hotspot: { x: 180, y: 130, w: 40, h: 26 }, cond: F('ch3.crew_woken'),
        look: 'A heap of cracked bronze ribs and dull, clouded glass. Its light is out and its song is done. Kord prods it with his boot, out of thoroughness.',
        take: 'Kord picks up a shard of the glass core. It is cold and dead. He tosses it back on the heap.',
        hit: 'Kord kicks the wreck. It does not sing. It never will again. That is the best kind of pillar.',
      },
      { id: 'crew', kind: 'npc', npc: 'shrike_crew', sprite: { x: 64, y: 80 }, still: true, cond: NOT(F('ch3.crew_woken')),
        look: 'The Shrike\'s crew stand in their alcoves like statues in a temple: Jory, Long Pell, the Argossean twins, all of them. Eyes open. Faces calm, almost smiling. Humming. Valka looks at them once and does not look again.',
        talk: 'Kord shakes a sailor by the shoulders. The man\'s head rolls and comes back, and he goes on humming, and smiles at nothing, peacefully, the way a man smiles when he has stopped wanting anything at all.',
        take: 'Kord could carry one of them out. There are thirty of them, and a hundred others, and the song would only call them back.',
        hit: 'Kord raises his hand to slap a sailor awake and lowers it. Slapping a man who cannot hit back is not his way. Slapping the thing that put him here is.',
        give: { '*': { text: 'The sailor does not take the {item}. His hands hang at his sides, at peace.' } },
      },
      { id: 'teg', kind: 'npc', npc: 'teg_wyrm', sprite: { x: 98, y: 82 }, still: true, cond: NOT(F('ch3.crew_woken')),
        look: 'Mother Teg, the Shrike\'s grizzled boatswain, who has sworn at storms and won. She stands with her arms folded, staring straight ahead, humming. Her face is soft and young and calm. It is the most frightening thing in the Wyrm.',
        talk: 'Kord says, "Teg." Then louder: "TEG." Mother Teg hums on, with a little smile. Valka puts a hand on Kord\'s arm. "She can\'t hear you," she says. "She hasn\'t been this quiet since the day she was born."',
        take: 'Mother Teg is rooted to the floor like a mooring post.',
        hit: { speaker: 'valka', text: '"Touch her and when she wakes up she\'ll kill you, and then I will. Hit the thing that\'s singing, Kord."' },
        give: { '*': { text: 'Mother Teg does not take the {item}. Her hands are folded. For once in her life, she wants nothing.' } },
      },
      { id: 'alcoves', kind: 'thing', name: 'alcoves', names: ['alcoves', 'alcove', 'rows', 'other sailors', 'others'],
        hotspot: { x: 262, y: 66, w: 56, h: 74 },
        look: [
          { cond: F('ch3.crew_woken'), text: 'The alcoves stand empty, green and cold. The other sailors, from other ships and other ages, have wandered out blinking after the Shrike\'s crew. Some of them speak tongues that died with their kings. They will all have stories to tell, if anyone can understand them.' },
          { text: 'Alcove after alcove, as far as the eye can follow: a Stygian oarsman, a Zingaran in a hat with a plume, a woman in sealskins from some northern sea, a man in a bronze cuirass of a make Kord has only seen on statues. Each stands still and hums. The Wyrm has been collecting a long time.' },
        ],
        take: 'Kord is a thief, but there are limits. People in jars are one of them.',
        hit: 'The alcove glass rings under his fist. The sleeper inside does not even blink.',
      },
      { id: 'hive', kind: 'thing', name: 'bronze hive', names: ['hive', 'ceiling', 'nest', 'arms', 'serpent arms'],
        hotspot: { x: 150, y: 0, w: 100, h: 50 },
        look: 'Up in the vault of the hall hangs a great cluster of bronze, like a hornets\' nest the size of a cottage, with jointed arms folded against it like the legs of a sleeping spider. Kord thinks of the scrape marks on the Shrike\'s deck, and looks at the arms, and thinks some more.',
        take: 'It is forty feet up, and asleep. Kord would like both of those to stay true.',
        hit: 'Kord throws a shard of something at it. One of the folded arms twitches. Kord decides that was enough of an answer.',
      },
    ],
  },

  // ============================================================ THE WINDOW OF YEARS
  wyr_window: {
    name: 'The Window of Years', bg: 'bg/wyr-window', music: 'wyrm', ambience: 'loop-dungeon', machine: true, dungeon: true,
    map: { x: 3, y: 1 }, mapName: 'Window of Years',
    fx: [{ type: 'dust', n: 14 }, { type: 'vignette', a: 0.45 }],
    glints: [
      { x: 160, y: 90, steady: true, a: 0.6, cond: F('ch3.window_awake') },                                   // the woken ring
      { x: 206, y: 156, small: true, period: 120, cond: ALLC(F('ch3.window_awake'), NOT(F('ch3.sigil_taken'))) }, // the sigil under the grate
      { x: 21, y: 98, small: true, period: 180, cond: NOT(F('ch3.cell_taken')) },                               // the star-cell in the press
    ],
    desc: [
      { cond: F('ch3.window_awake'), text: 'In the Window of Years the great [[ring|ring of glass]] glowed now, softly, and held its last picture: [[silver_man|the man in silver]], standing over the [[grate|grate]] in the floor, frozen in the moment before the dark. Behind it all, the sealed [[door|door]] waited. In the wall stood a [[press|press of glass]], and something small glinted on the floor: a [[lens|chip of glass]].' },
      { text: 'The next chamber was round, and ribbed like the rest, and dark. Its far side was one great window of green glass, cracked like ice on a pond, and beyond it was black water. In the middle of the room stood a [[ring|ring of glass]] as tall as a man, dark, set upright in a bronze collar, and humming one low note. A rusted [[grate|grate]] was set in the floor before it. Past the ring, the way on was a sealed [[door|door]], smooth as an egg. In the wall stood a [[press|press of glass]], and something small glinted on the floor: a [[lens|chip of glass]].' },
    ],
    short: [
      { cond: F('ch3.window_awake'), text: 'The Window of Years: the glowing [[ring|ring]], [[silver_man|the man in silver]] frozen in it, the [[grate|grate]], the sealed [[door|door]].' },
      { text: 'The Window of Years: the dark [[ring|ring of glass]], humming; the rusted [[grate|grate]]; the sealed [[door|door]]; a [[press|press of glass]].' },
    ],
    exits: [
      { dir: 'w', label: 'The Hall of Statues', names: ['back', 'hall', 'statues'], to: 'wyr_pens' },
      { dir: 'e', label: 'Deeper', names: ['on', 'deeper', 'mind', 'through'], to: 'wyr_mind',
        cond: F('ch3.mind_open'),
        blocked: 'The sealed door is smooth as an egg, without seam or handle. In its middle is a shallow hollow shaped like a sigil, a hand\'s breadth across, and nothing in it.' },
    ],
    onEnter: [{ cond: NOT(F('ch3.window_seen')), effects: [{ set: 'ch3.window_seen' }, { objective: { id: 'ch3_window', to: 'active' } }] }],
    say: [
      { match: 'arbiter', response: { text: 'Kord says it to the door. The door waits for something better than a word.' } },
    ],
    shout: { text: 'Kord shouts. The ring of glass catches his voice and hums it back to him an octave lower, slowly, like a man repeating a stranger\'s name to remember it.' },
    banter: {
      ain: [
        { cond: NOT(F('ch3.window_awake')), speaker: 'ain', text: '"It is a kind of window, I think. Not onto a place: onto a time. It wants a voice it knows." Kord: "Speak—" "Yes, yes. It wants something that hums the same as it hums."' },
        { cond: NOT(F('ch3.mind_open')), speaker: 'ain', text: '"He dropped something through the grate. The door has a hollow the shape of a sigil. I am trying very hard not to draw a conclusion in front of you, Kord, so that you can enjoy drawing it yourself."' },
        { speaker: 'ain', text: '"\'It can\'t force the Arbiter.\' He was so frightened. I wish I knew of what. I wish I knew why it sounded like good news."' },
      ],
    },
    things: [
      { id: 'ring', kind: 'prop', name: 'ring of glass', names: ['ring', 'ring of glass', 'window', 'glass ring', 'window of years'],
        sprite: { id: 'prop/ring-of-glass', x: 134, y: 62 }, still: true,
        look: [
          { cond: F('ch3.window_awake'), text: 'The ring glows softly now, and in its glass the room stands young and lit, frozen in a single moment: the man in silver at the grate, the sigil falling, the dark about to come down. The picture never moves. The man never finishes falling to his knees.' },
          { cond: { has: 'humming_blade' }, text: 'A ring of glass as tall as a man, set upright in a bronze collar. It is dark, but not empty: deep in the glass something waits, like a reflection waiting for a face. It hums one low note. Toktai looks from the ring to the Humming Blade. The blade is humming the same note.' },
          { text: 'A ring of glass as tall as a man, set upright in a bronze collar. It is dark, and humming one low note, the way a lute string hums when another is plucked nearby.' },
        ],
        take: 'Kord grips the ring by its collar and heaves. It weighs as much as a temple door, and hums at him reprovingly.',
        hit: 'Kord draws back his fist, and stops. He decides not to break a window that shows the past. He might need the past later.',
        talk: [
          { cond: F('ch3.window_awake'), text: 'Kord speaks to the man in the window. The man goes on not quite kneeling, twelve thousand years away.' },
          { text: 'Kord hums at the ring. It is not the right note. It is not, Valka observes, any note at all.' },
        ],
        use: {
          ...clangAll,
          humming_blade: [
            { cond: F('ch3.window_awake'), text: 'The blade and the ring hum together, in tune, contented. The picture in the glass does not change. It has shown what it had to show.' },
            { text: 'Kord lifts the Humming Blade and touches its point to the glass.', effects: [{ scene: 'sc_window' }] },
          ],
          ain: { speaker: 'ain', text: 'Ain floats up to the ring and hums at it, very precisely, in its own voice. The ring ignores it. "It ignores me," says Ain. "Rude."' },
          star_stone: { text: 'The star-stone hums too, but in the wrong key. The ring does not care for it.' },
          '*': { text: 'Kord holds up the {item} to the ring. The ring hums on, unmoved. It wants a voice it knows.' },
        },
      },
      { id: 'silver_man', kind: 'npc', npc: 'silver_man', sprite: { x: 186, y: 100 }, still: true,
        cond: ALLC(F('ch3.window_awake'), NOT(F('ch3.mind_open'))),
        look: 'The man in silver, caught in the window\'s glass like a fly in amber: an ordinary face, sweating, terrified, his clothes shimmering like a fish\'s belly. His hand is open over the grate. He is the only person in this chronicle who knew what Ain was, and he is twelve thousand years dead.',
        talk: { speaker: 'silver_man', text: '"...can\'t force the Arbiter..." The picture does not move. The words come again, faintly, from the glass, like an echo in a well: "...it\'ll have to make it want to come back..."' },
        take: 'Kord\'s hand goes through him as through lamplight. He is not here. He has not been here for a very long time.',
        hit: 'Kord swings at the picture. His fist goes through the man in silver and comes out the other side cold.',
        give: { '*': { text: 'The man in silver does not take the {item}. He is busy being afraid, twelve thousand years ago.' } },
      },
      { id: 'grate', kind: 'prop', name: 'rusted grate', names: ['grate', 'grating', 'rusted grate', 'floor grate', 'drain'],
        sprite: { id: 'prop/rusted-grate', x: 196, y: 148 }, still: true,
        look: [
          { cond: F('ch3.sigil_taken'), text: 'The grate lies torn back on its hinge, and below it there is only dark, and a smell like an old well.' },
          { cond: F('ch3.window_awake'), text: 'The same grate the man in silver dropped the sigil through, twelve thousand years ago, rusted shut since. Down between the bars, in the dark, something glints teal.' },
          { text: 'A grate of bronze in the floor, crusted with rust like old bread with mould. It looks as if nothing has lifted it since before the sea came in. Below the bars there is only dark.' },
        ],
        take: [
          { cond: F('ch3.sigil_taken'), text: 'There is nothing else down there but dark and the smell of a well.' },
          { cond: F('ch3.window_awake'), text: 'Kord crouches, hooks his fingers through the bars, and pulls. The rust holds. Kord pulls harder, and the cords stand out in his neck, and his boots creak on the floor. Twelve thousand years of rust give up. The grate comes away with a shriek, and Kord reaches down into the dark and comes up with a sigil of teal glass, cold as a winter stream.', sfx: 'puzzle',
            effects: [{ set: 'ch3.sigil_taken' }, { give: 'key_sigil' },
              { speaker: 'ain', text: '"Arbiter," it says, very quietly. "That is what is written on it. Only that word."' }] },
          { text: 'Kord heaves at the grate. Rust and bronze hold fast. Whatever is down there, if anything, it is not worth a rupture. Not yet.' },
        ],
        use: {
          self: [{ cond: F('ch3.sigil_taken'), text: 'It is open.' }, { text: 'Pull it open, then. If there is a reason to.' }],
          '*': { text: 'Kord jams the {item} between the bars and levers. The rust laughs at him.' },
        },
        hit: [
          { cond: F('ch3.sigil_taken'), text: 'Kord kicks the torn grate. It rings, and the dark below rings back.' },
          { text: 'Kord stamps on the grate. Rust flakes off like scabs. It does not budge.' },
        ],
      },
      { id: 'door', kind: 'thing', name: 'sealed door', names: ['door', 'sealed door', 'hollow', 'egg door', 'way on'],
        hotspot: { x: 282, y: 56, w: 36, h: 90 },
        look: [
          { cond: F('ch3.mind_open'), text: 'The sealed door stands open on darkness and a cold blue-green glow. From somewhere beyond comes a sound like a great slow breath.' },
          { text: 'The door is smooth as an egg, without seam or handle. In its middle is a shallow hollow, a hand\'s breadth across, the shape of a sigil: a ring with a line through it, like an eye.' },
        ],
        take: 'Kord tries to get his fingers round the door. It is like trying to get your fingers round an egg.',
        hit: 'The door gives back a dull thud, as an egg would, if eggs were bronze and patient.',
        talk: '"Open," says Kord. "ARBITER?" says the door, hopefully, to Ain. Ain says nothing. The door stays shut.',
        use: {
          key_sigil: [
            { cond: F('ch3.mind_open'), text: 'The door is already open.' },
            { text: 'Kord sets the sigil into the hollow. It fits as if it had been grown there. The door reads it, the way a priest reads a scroll, and speaks in a voice like a temple bell: "ARBITER. PROCEED." Then it splits along a seam that was not there and slides away.', sfx: 'stone-door',
              effects: [{ take: 'key_sigil', quiet: true }, { set: 'ch3.mind_open' }, { objective: { id: 'ch3_window', to: 'done' } },
                { speaker: 'ain', text: '"Arbiter again." Kord: "It likes you." Ain: "That is what worries me."' }] },
          ],
          ain: { speaker: 'ain', text: '"I tried that, while you were not looking. It wants the sigil, not me. I am relieved, and I do not know why."' },
          humming_blade: { text: 'The blade hums at the door. The door hums back, in a different key. Wrong voice. Wrong shape.' },
          '*': { text: 'The {item} does not fit the hollow. The hollow is the shape of a sigil.' },
        },
      },
      { id: 'press', kind: 'thing', name: 'press of glass', names: ['press', 'cabinet', 'cupboard', 'glass press', 'case'],
        hotspot: { x: 10, y: 68, w: 44, h: 60 },
        look: [
          { cond: F('ch3.cell_taken'), text: 'An empty press of glass in the wall, its door hanging open. Somebody in silver once kept things here for a hurry. The hurry came.' },
          { text: 'A narrow press of glass set into the wall, like a cupboard for very important cups. Inside, on a shelf, stands a sealed cylinder full of light, like a flask of captured lightning.' },
        ],
        take: [
          { cond: F('ch3.cell_taken'), text: 'Empty.' },
          { text: 'The glass door opens at a touch, as if it had been waiting. Kord takes the cylinder of light. It is warm, and it tingles. "A star-cell," says Ain, with something very like hunger. "Keep it for me. When I am empty, it will fill me."', sfx: 'pickup',
            effects: [{ set: 'ch3.cell_taken' }, { give: 'star_cell' }] },
        ],
        hit: 'Kord raps on the glass. It opens, primly, as though he had knocked.',
        use: { self: [{ cond: F('ch3.cell_taken'), text: 'Empty.' }, { text: 'It opens at a touch. Take what is inside.' }] },
      },
      { id: 'lens', kind: 'thing', name: 'chip of glass', names: ['lens', 'chip', 'chip of glass', 'shard', 'glass chip'],
        hotspot: { x: 104, y: 150, w: 20, h: 14 }, cond: NOT(F('ch3.lens_taken')),
        look: 'A disc of glass the size of a coin, lying on the floor where it fell from the ring\'s collar long ago. When Kord holds it to his eye, the room looks the same, except that he can see, faintly, the bones inside his own hand. He puts it down quickly.',
        take: { text: 'Kord picks it up, holds it out at arm\'s length and offers it to Ain without a word. "A seeing-glass," says Ain, delighted. "Through it I could look at a thing and know it at once, without spending myself. Thank you, Kord." Kord grunts. "It showed me my bones. You keep it."', sfx: 'pickup',
          effects: [{ set: 'ch3.lens_taken' }, { give: 'seers_lens' }, { tip: 'equip' }] },
        hit: 'Kord flicks the little lens. It skitters across the floor and comes to rest pointing at him, accusingly.',
      },
    ],
  },

  // ============================================================ THE MIND OF THE WYRM (TWIST 2)
  wyr_mind: {
    name: 'The Mind of the Wyrm', bg: 'bg/wyr-mind', music: 'wyrm', ambience: 'loop-stillness', machine: true, dungeon: true,
    map: { x: 4, y: 1 }, mapName: 'The Mind',
    fx: [{ type: 'motes', n: 20 }, { type: 'vignette', a: 0.45 }],
    glints: [
      { x: 146, y: 44, steady: true, a: 0.8 }, { x: 177, y: 44, steady: true, a: 0.8 },   // the serpent's glass eyes
      { x: 132, y: 116, small: true, period: 100, cond: NOT(F('ch3.twist2_done')) },     // the heart-records
    ],
    desc: [
      { cond: F('ch3.twist2_done'), text: 'The Mind of the Wyrm was crying with brass throats, and every light in it had gone the colour of blood. The serpent\'s [[head|head]] stared down with teal eyes; the [[pillar|pillar of light]] still fell from its jaws, empty now. Before it the [[hatch|floor]] had opened on a red glow and a heat like a forge mouth. The [[records|heart-records]] crawled with frightened light.' },
      { text: 'The last door opened on a hall like the inside of a skull. Out of the dark above reared the [[head|head of a serpent]], bronze, as vast as a temple front, with eyes of glass that burned teal. From its open jaws a [[pillar|pillar of light]] fell straight to the floor, still as a spear, and wheels of bronze turned in the walls about it, slow as years. Beside the pillar, little lights crawled over a wall of glass like ants on a honey jar: the [[records|speaking wall]].' },
    ],
    short: [
      { cond: F('ch3.twist2_done'), text: 'The Mind of the Wyrm, crying alarm. The serpent [[head|head]], the empty [[pillar|pillar of light]], the [[records|heart-records]], the open [[hatch|floor]].' },
      { text: 'The Mind of the Wyrm: the serpent [[head|head]], the [[pillar|pillar of light]], the [[records|speaking wall]].' },
    ],
    exits: [
      { dir: 'w', label: 'The Window of Years', names: ['back', 'window'], to: 'wyr_window' },
      { dir: 'd', label: 'Down to the heart', names: ['on', 'down', 'heart', 'deeper', 'below'], to: 'wyr_heart',
        cond: F('ch3.twist2_done'),
        blocked: 'The floor before the pillar is seamless bronze, warm underfoot, and from beneath it comes a deep pulse, like a heart heard through a wall. There is no way down. Not yet.' },
    ],
    onEnter: [{ cond: NOT(F('ch3.vision_seen')), effects: [{ set: 'ch3.vision_seen' }, { scene: 'sc_mind_vision' }] }],
    shout: { text: 'Kord roars up at the serpent head. The serpent, which has heard gods, is not impressed by a Cimmerian.' },
    say: [
      { match: 'set', response: { text: 'Kord says the god\'s name into the hall. The serpent\'s eyes do not change. Gods, Kord reflects, never answer when you want them to. Only when you don\'t.' } },
    ],
    banter: {
      ain: [
        { cond: NOT(F('ch3.twist2_done')), speaker: 'ain', text: '"Take me to the speaking wall. Please. I need to know what this is. I think I already know, and I would like to be wrong."' },
        { speaker: 'ain', text: '"Kord. If I ever go near that thing under the pyramid, stop me." Kord: "With what?" Ain: "With anything you have."' },
      ],
      valka: { speaker: 'valka', text: '"A god that lives in a cellar and rows a boat. And Stygians bow to it. No man owns me, Cimmerian. No god either. Least of all one with a basement."' },
    },
    things: [
      { id: 'head', kind: 'thing', name: 'serpent head', names: ['head', 'serpent', 'serpent head', 'eyes', 'glass eyes', 'jaws', 'wyrm'],
        hotspot: { x: 128, y: 2, w: 68, h: 58 },
        look: [
          { cond: F('ch3.twist2_done'), text: 'The serpent\'s head, as vast as a temple front, its glass eyes turned down upon the party now, and burning. It knows they are here. Somewhere far below the sea, so does the one who looks out through it.' },
          { text: 'A serpent\'s head of bronze, crested and horned, as vast as the front of a temple, hanging out of the dark with its jaws open. Its eyes are glass, each as big as a cartwheel, and lit from within with the same teal as the hounds of Ashkarran, and the lamp in the tower window, and Ain. They do not look at the party. They look at nothing, the way a sleeper\'s open eyes look at nothing.' },
        ],
        take: 'Kord measures the serpent\'s head against his outstretched arms. He would need about twenty more arms.',
        hit: 'Kord hurls a shard of the singing pillar at the serpent\'s eye. It strikes, rings, and falls. The eye does not blink. Kord feels like a man throwing gravel at a mountain.',
        talk: [
          { cond: F('ch3.twist2_done'), text: '"I know you\'re in there," says Kord. "Or under there. Wherever. I\'m coming." The eyes burn a little brighter. That is answer enough.' },
          { text: 'Kord addresses the serpent: "You. Set. Whatever you are." The serpent says nothing. It has already said what it had to say, and not to him.' },
        ],
      },
      { id: 'pillar', kind: 'thing', name: 'pillar of light', names: ['pillar', 'pillar of light', 'light', 'beam', 'vision', 'picture'],
        hotspot: { x: 150, y: 62, w: 22, h: 62 },
        look: [
          { cond: F('ch3.twist2_done'), text: 'The pillar of light still falls from the serpent\'s jaws, but the picture in it is gone. Only light now, empty, like a window with nobody behind it.' },
          { text: 'A pillar of light falling from the serpent\'s jaws, still as a spear of ice. In it, like a picture in a pool, Kord can still see the black chamber and the kneeling priest, fading, fading. Thulamon is praying still, and does not know he is watched.' },
        ],
        take: 'Kord puts his hand into the light. It is cool, and his hand looks very far away. He takes it out again and counts his fingers.',
        hit: 'Kord swings through the light. It parts round his fist like water and closes behind it. The priest in the picture does not look up.',
        talk: [
          { cond: F('ch3.twist2_done'), text: 'Kord tells the empty light what he will do to Thulamon. It is a long list, and specific.' },
          { text: 'Kord leans into the light and says, "Thulamon. I\'m coming for you." The priest in the picture goes on praying. "He can\'t hear you," says Ain. "Good," says Kord. "I want it to be a surprise."' },
        ],
        use: { ain: { speaker: 'ain', text: '"I will not go into that light," says Ain. "I do not know why. I only know I will not."' } },
      },
      { id: 'records', kind: 'thing', name: 'heart-records', names: ['records', 'heart records', 'heart-records', 'speaking wall', 'wall', 'glass wall', 'lights'],
        hotspot: { x: 116, y: 102, w: 32, h: 28 },
        look: [
          { cond: F('ch3.twist2_done'), text: 'The speaking wall, its little lights running back and forth in alarm. Somewhere in that glass, in the oldest part, where nothing else is written, is a single line: ARBITER KEY: CANNOT BE COMPELLED, COPIED OR FORGED.' },
          { text: 'A wall of dark glass beside the pillar, over which little lights crawl, gather, scatter and gather again, like ants on a honey jar, or like a crowd of very small priests copying very small scrolls. Kord cannot make sense of it. Ain has drifted close and gone silent.', effects: [{ scene: 'sc_records' }] },
        ],
        take: 'Kord would no more take the speaking wall than steal the moon out of a well.',
        hit: [
          { cond: F('ch3.twist2_done'), text: 'Kord hammers the glass. The lights scatter and re-form, frantic. Somewhere a brass throat cries louder.' },
          { text: 'Kord raises his fist. "Wait," says Ain, sharp as he has ever heard it. "Let me read it first. Then you may hit whatever you like."' },
        ],
        talk: [{ cond: F('ch3.twist2_done'), text: 'The wall has said everything. It is screaming now, in light.' }, { text: '"Ain. Read it."', effects: [{ scene: 'sc_records' }] }],
        use: {
          ain: [{ cond: F('ch3.twist2_done'), speaker: 'ain', text: '"I have read it. I will not forget it."' }, { text: 'Ain drifts to the wall.', effects: [{ scene: 'sc_records' }] }],
          self: [{ cond: F('ch3.twist2_done'), text: 'It is crying alarm now. There is nothing more to read.' }, { text: 'Kord looks at the writing, then at Ain.', effects: [{ scene: 'sc_records' }] }],
          '*': { text: 'Kord holds the {item} up to the speaking wall. The little lights edge away from it.' },
        },
      },
      { id: 'wheels', kind: 'thing', name: 'bronze wheels', names: ['wheels', 'gears', 'cogs', 'bronze wheels'],
        hotspot: { x: 192, y: 82, w: 48, h: 50 },
        look: 'Wheels of bronze, toothed like jaws, turning in the walls in great slow circles. Each one turns another, and that one another, on and on, so that the whole hall seems to be thinking with its teeth.',
        take: 'Kord puts a hand toward a turning wheel. Valka slaps it away. "Keep your fingers. You have so few brains, you can\'t spare any digits."',
        hit: 'Kord swings at a wheel. It turns on, unbothered, and nearly takes his sword with it.',
      },
      { id: 'hatch', kind: 'thing', name: 'open floor', names: ['hatch', 'floor', 'opening', 'hole', 'pit', 'glow'],
        hotspot: { x: 118, y: 132, w: 86, h: 24 }, cond: F('ch3.twist2_done'),
        look: 'The floor before the pillar has opened like a flower of bronze. Below, a red glow, a great slow pulse, and heat like the breath of a forge. The heart of the Wyrm.',
        take: 'Kord would rather go down it than take it.',
        hit: 'Kord kicks a bronze petal of the opened floor. It rings, and the heart below beats once, harder, in answer.',
      },
    ],
  },

  // ============================================================ THE CAPTIVE SUN
  wyr_heart: {
    name: 'The Captive Sun', bg: 'bg/wyr-heart', music: 'wyrm', ambience: 'loop-dungeon', machine: true, dungeon: true,
    map: { x: 5, y: 1 }, mapName: 'Captive Sun',
    fx: [{ type: 'heat', y: 120 }, { type: 'torch', x: 160, y: 76, r: 70 }, { type: 'vignette', a: 0.35 }],
    desc: [
      { cond: F('ch3.warden_dead'), text: 'The Captive Sun stuttered in its [[sun|rings]], dimming, flaring, dimming. The [[warden_wreck|Warden]] lay across the [[platform|bronze floor]] like a fallen temple.' },
      { text: 'Below the Mind lay the heart of the Wyrm, and the heart was a star. A [[sun|small sun]], no bigger than a cart, hung in the middle of the chamber, caged in great rings of bronze that wheeled about it, slow and grave, like the arms of a dancer. Its heat beat on the face like a forge door. Teal [[veins|veins]] of fire ran from it through the walls, out into the body of the Wyrm. Before it, on a [[platform|platform of bronze]], something vast was unfolding.' },
    ],
    short: 'The Captive Sun: the caged [[sun|sun]], the [[veins|teal veins]], the bronze [[platform|platform]].',
    exits: [
      { dir: 'u', label: 'Up to the Mind', names: ['up', 'back', 'mind'], to: 'wyr_mind', cond: NOT(F('ch3.warden_dead')),
        blocked: 'There is no going back up now. The Wyrm is running for the shore.' },
    ],
    onEnter: [
      { cond: NOT(F('ch3.warden_dead')), effects: [{ scene: 'sc_warden' }, { battle: 'e3_warden' }, { scene: 'sc_warden_down' },
        { objective: { id: 'ch3_fate', to: 'active' } }, { checkpoint: 'wyrm' }] },
      { cond: FATE_OPEN, effects: [{ text: 'The Wyrm runs on through the dark sea toward the Stygian shore. Among the rings of the dying sun, Ain waits for Kord\'s answer.' }, { checkpoint: 'wyrm' }] },
    ],
    onIdle: { seconds: 45, cond: FATE_OPEN, effects: [{ speaker: 'ain', text: '"Kord. The shore is coming. I need your answer before it does. Talk to me when you are ready."' }] },
    banter: {
      ain: [FATE_TALK],
      valka: [{ cond: FATE_OPEN, speaker: 'valka', text: '"Burn it. It stood my people in rows like jars on a shelf and made them hum. I don\'t care what it was built for. Slavers are built too, Kord. By other slavers."' }],
      toktai: [{ cond: FATE_OPEN, speaker: 'toktai', text: '"A beast that has done only what it was trained to do. On the steppe we kill the man who trained it, and keep the horse." He shrugs. "But a horse cannot swallow a ship. It is your choice, Cimmerian. That is what it means to be the one with the biggest sword."' }],
    },
    shout: { text: 'Kord roars at the captive star. It roars back, louder, in heat.' },
    things: [
      { id: 'sun', kind: 'thing', name: 'Captive Sun', names: ['sun', 'captive sun', 'star', 'rings', 'cage', 'heart'],
        hotspot: { x: 118, y: 28, w: 86, h: 86 },
        look: [
          { cond: F('ch3.warden_dead'), text: 'The little sun gutters in its rings like a candle in a draught. Ain hovers before it, teal against gold, and the Wyrm shudders with every beat.' },
          { text: 'A sun in a cage. It is too bright to look at for long and too strange to look away from. The rings of bronze wheel round it, slow and grave, and wherever their shadows fall the Wyrm shivers. This is what makes the dragon swim.' },
        ],
        take: 'Kord would sooner grab a lion by the tongue.',
        hit: 'Kord gets three steps toward it and the heat turns him round like a hand on his chest.',
        talk: [FATE_TALK, { text: 'Kord says something rude to the sun. It burns on, unoffended.' }],
      },
      { id: 'veins', kind: 'thing', name: 'teal veins', names: ['veins', 'teal veins', 'fire', 'cracks'],
        hotspot: { x: 200, y: 10, w: 80, h: 80 },
        look: 'Veins of teal fire run from the caged sun out through the walls, branching like lightning frozen in glass. The same colour as Ain. Ain notices Kord noticing, and says nothing.',
        take: 'They are in the walls, and on fire. Kord is a thief, not a lunatic.',
        hit: 'Kord slaps a vein. It stings like a jellyfish, and his arm hums to the shoulder. He does not do it again.',
      },
      { id: 'platform', kind: 'thing', name: 'bronze platform', names: ['platform', 'floor', 'bronze floor'],
        hotspot: { x: 60, y: 126, w: 200, h: 22 },
        look: 'A floor of bronze, worn bright by the feet of something heavy walking the same path for a very long time.',
        take: 'It is a floor. Kord is standing on it. That will have to do.',
        hit: 'The platform rings like a gong. Somewhere in the walls, something answers.',
      },
      { id: 'warden_wreck', kind: 'thing', name: 'fallen Warden', names: ['warden', 'fallen warden', 'wreck', 'automaton'],
        hotspot: { x: 110, y: 112, w: 100, h: 26 }, cond: F('ch3.warden_dead'),
        look: 'The Warden lies sprawled before the sun, its glass core dark, its arms torn away. Even fallen it is three times the size of Kord.',
        take: 'Kord would need a ship to carry it. He has one, as it happens, but she is busy.',
        hit: 'Kord kicks the Warden\'s head. It rolls a little. "ARBITER," it says, very faintly, and then nothing ever again.',
        talk: [FATE_TALK, { text: 'The Warden has said all it will ever say.' }],
      },
    ],
  },
};

// ---------------------------------------------------------------- dialogues
export const dialogues = {
  // The Wyrm's fate: the chapter III choice that unlocks the Hound of Hours ending.
  dlg_wyrm_fate: { start: 'n_back', nodes: {
    n_back: { cond: F('ch3.fate_heard'), else: 'n0', speaker: 'ain', text: '"The shore is close now. Burn its heart, or cut its leash. I will do whichever you say."', next: 'n_menu' },
    n0: { text: 'Of everything Kord decided in the belly of the Wyrm, this is the one I have thought about longest.', effects: [{ set: 'ch3.fate_heard' }], next: 'n1' },
    n1: { speaker: 'ain', text: '"I can run this body aground on the Stygian shore. That part is easy; it wants the land now, the way a wounded bull wants its herd. Then there is one thing more, and I would rather you chose it."', next: 'n2' },
    n2: { speaker: 'ain', text: '"I can burn out its heart, and it dies on the sand. Or I can cut its leash, the cord of light that ties it to the mind under the pyramid, and let it sleep. It has done nothing it was not made to do."', next: 'n3' },
    n3: { speaker: 'valka', text: '"Nothing it wasn\'t *made* to do." Valka\'s voice is very quiet, which is worse than when it is loud. "It took my crew, jewel. It stood them in rows and made them hum. I\'ve hanged men for chaining a cabin boy. I\'ll not leave this thing alive because somebody built it to be a slaver."', next: 'n4' },
    n4: { speaker: 'toktai', text: '"On the steppe, a horse that throws you is still a horse. You do not eat it." He glances at Valka. "Usually. But a hound whose master is still alive does not stay masterless for long."', next: 'n5' },
    n5: { speaker: 'ain', text: '"I think I can cut the leash clean. I cannot be certain. The mind under the pyramid is patient, and I do not know every door in it." Its light flickers, gold and teal. "Kord?"', next: 'n_menu' },
    n_menu: { text: 'The Wyrm shudders around them, running for the shore.',
      choices: [
        { text: '"Burn its heart."', next: 'n_kill' },
        { text: '"Cut its leash. Let it sleep."', next: 'n_spare' },
        { text: '"Give me a moment."', next: null },
      ] },
    n_kill: { speaker: 'kord', text: '"Then we beach the boat and kill the rower."', effects: [{ set: 'ch3.fate_burn' }] },
    n_spare: { speaker: 'kord', text: '"Let the dog sleep. We kill the master."', effects: [{ set: 'ch3.wyrm_spared' }] },
  } },
};

// ---------------------------------------------------------------- scenes
export const scenes = {
  sc_ch3_open: [
    { text: 'There was darkness, and a roar like the whole sea pouring down a well, and then for a long while there was nothing at all.', effects: [{ set: 'ch3.intro_done' }], art: 'keyart/wyrm-rising', caption: 'Swallowed' },
    { text: 'Kord woke on his back on a floor that was warm as a horse\'s flank and hummed beneath him like a hive. Above, ribs of bronze arched away into the gloom, and between them ran bars of cold light the colour of shallow water. The air smelled of brine and hot bronze and something like the air after lightning.', art: null },
    { text: 'All around, beached on that warm floor like toys a child had tired of, lay ships. Dozens of them, of every age the sea had ever floated. And among them, heeled over on her side with her red sails sprawled, the Crimson Shrike.' },
    { speaker: 'valka', text: '"Mitra\'s bloody teeth. My ship." She was on her feet and running before the others had found theirs. "Teg! Jory! Pell! Answer me, you lazy swine!"' },
    { text: 'Nobody answered. The Shrike\'s deck was empty, and scored with long scrape marks, in sets of five, as if something with many arms had wiped her clean of men. The marks ran off across the hold toward a great round door.' },
    { speaker: 'toktai', text: 'Toktai knelt by the marks. "Dragged. Something with many arms and no feet." He stood. "Look on the bright side. When the sky swallows you, at least you are not rained on."' },
    { speaker: 'ain', text: 'Ain hung in the air above them, its pulse slow and troubled. "This is not a beast."' },
    { speaker: 'kord', text: '"Then it can\'t digest us. Good."' },
    { text: 'High in the dark rigging of a dead galley, something clicked. Then something else. Then a great many somethings, all together, like a rain of glass beginning.', sfx: 'servo',
      effects: [{ objective: { id: 'ch3_door', to: 'active' } }, { objective: { id: 'ch3_crew', to: 'active' } }] },
  ],
  sc_brazen: [
    { cond: NOT(F('ch3.brazen_dead')), text: 'The bronze man turned its faceless head, slowly, with a sound like a millstone. In its chest the egg-shaped stone flared bright. Then it stepped down off its plinth, and the whole floor of the hold shook.', sfx: 'servo' },
    { cond: NOT(F('ch3.brazen_dead')), speaker: 'valka', text: '"I\'ve fought bigger men." A pause. "No, I haven\'t."', effects: [{ battle: 'e3_brazen' }] },
    { cond: F('ch3.brazen_dead'), text: 'The bronze man came down like a felled tower. Its chest-grille split, and the glowing stone rolled out across the floor and came to rest against Kord\'s boot, humming, warm, like an egg that had decided whose it was.' },
  ],
  sc_blade: [
    { text: 'In his lap, the dead man has kept an egg-shaped stone, warm and humming. Kord takes it too. He takes the shimmering shirt, and the disc of glassy bronze from the bony arm. "He won\'t need them," says Kord. "Grave-robbing," says Valka. "Borrowing," says Kord. "From a man with no further plans."' },
    { text: 'He weighs the sword. Its blade is dull grey and seems to be very faintly blurred, like a wasp\'s wing, and it buzzes against his palm.' },
    { speaker: 'kord', text: '"It hums. Swords shouldn\'t hum."' },
    { text: 'He swings it at the nearest wreck. There is a sound like tearing silk, a crackle of blue sparks, and a yard of oak rail drops to the floor, smoking at both ends.', sfx: 'shock' },
    { speaker: 'kord', text: '"...It cuts. Good."' },
  ],
  sc_door_open: [
    { text: 'Both stones hummed, and their two notes met, and climbed, and became one. The rings on the door\'s face began to turn, each against its neighbour, faster and faster, until the whole door seemed to whirl like a millwheel. Then it rolled aside into the wall, like an eye opening.', sfx: 'stone-door', effects: [{ objective: { id: 'ch3_door', to: 'done' } }] },
    { text: 'Beyond lay a corridor ribbed like a gullet, dwindling into the dark. The scrape marks ran on into it.' },
    { speaker: 'ain', text: '"It opened for the stones," said Ain. "I am almost sure it opened for the stones."' },
  ],
  sc_welcome: [
    { text: 'When the last bronze serpent fell, the corridor was very quiet. Then, with no one near it, the tall side door folded back into the wall as smoothly as a sleeve, and green light spilled out across the floor, and the smell of leaves.', effects: [{ set: 'ch3.welcome' }], sfx: 'stone-door' },
    { text: 'And a voice spoke out of nowhere, warm and pleasant as a temple bell, the way a steward greets the master of a house come home after long travel: "WELCOME BACK, ARBITER."' },
    { text: 'Toktai looked at Valka. Valka looked at Kord. All three of them looked at the stone.' },
    { speaker: 'ain', text: '"...I do not know why it called me that."' },
    { text: 'Kord watched the stone for a long moment. The stone, which had no face, managed somehow to look as if it would very much rather be somewhere else.' },
    { speaker: 'valka', text: '"\'Back,\' it said. You\'ve been here before, jewel?" Ain: "Not that I remember. But I do not remember a great deal. There are gaps, shaped like doors. That was a door."' },
  ],
  sc_tablets: [
    { text: 'Ain drifted close to the glass and was silent for a while, and the little marks under the glass lit its facets from beneath.', effects: [{ set: 'ch3.tablets_read' }] },
    { speaker: 'ain', text: '"It is a boast, I think. A dedication, carved where everyone would see it. \'Here we grow the bread of a world where every man was fed and none was free. Hunger is ended. Strife is ended. Want is ended. Be grateful.\'"' },
    { speaker: 'kord', text: '"Fed and not free. They have a word for that in Stygia."' },
    { speaker: 'valka', text: '"In Barachan we call it a galley. Usually there\'s a man with a whip at the back."' },
    { speaker: 'toktai', text: '"On the steppe we call it a horse." He thought about it. "Even a horse runs away, sometimes."' },
    { speaker: 'ain', text: '"I know this hand," said Ain slowly, and then, quickly: "No. I know nothing. Forget I spoke."' },
  ],
  sc_pens: [
    { text: 'The hum met them at the threshold, and it was a lovely sound. It was like a mother\'s voice through a wall when you are small and sick. It was like the sea on a quiet night, and the wind in summer barley, and the knowledge that there is nothing whatever that you have to do.' },
    { text: 'Toktai yawned so hard his topknot shook. Valka sat down against an alcove, slowly, as if her legs had made the decision without consulting her. "Just for a moment," she said. Her eyes were half shut.' },
    { text: 'Kord heard nothing at all. He looked from his friends to the rows of humming sailors to the pillar pulsing in the middle of the hall, and frowned, as a man frowns at a joke everyone else has laughed at.' },
    { speaker: 'ain', text: '"It is a song," said Ain, and its light flickered in time with the pillar, against its will. "It goes in through the ears and tells the mind to be still. I cannot stop it."' },
    { speaker: 'toktai', text: '"Hit it?"' },
    { speaker: 'kord', text: '"Hit it."' },
  ],
  sc_crew_wake: [
    { text: 'The pillar split down its length with a sound like a frozen river cracking, and its light went out, and its song stopped in the middle of a note.', effects: [{ set: 'ch3.crew_scene' }] },
    { text: 'For the first time in this chronicle, hitting it was the answer.' },
    { text: 'All down the hall, a hundred sleepers blinked. Somebody coughed. Somebody fell over. Somebody, in a tongue that had died with the kings of its country, began very loudly to complain.' },
    { speaker: 'teg_wyrm', text: 'Mother Teg unfolded her arms and looked about her. "Captain? I dreamed I was a good woman with a quiet farm and a husband who listened. Horrible. Horrible." She spat. "Where in the nine hells are we?"' },
    { speaker: 'valka', text: 'Valka was on her feet, wide awake and furious about it. "Inside the Wyrm. Back to the ship, all of you, and patch her. When this thing dies I want to sail out of its belly, not swim."' },
    { speaker: 'teg_wyrm', text: '"Aye, Captain. You heard her, you whoresons! Back to the ship!" The crew went off down the hall at a run, and the strangers from other ships and other ages trailed after them, because a woman shouting orders is a thing every age understands.', effects: [{ objective: { id: 'ch3_crew', to: 'done' } }] },
    { speaker: 'ain', text: 'Ain hovered beside Kord, its light quite steady again. Quietly: "You did not hear it at all. Interesting."' },
    { speaker: 'kord', text: '"Hear what?"' },
    { text: 'Half the belly of the Wyrm lay behind them. As with all bellies, the worse half lay ahead.', effects: [{ autosave: true }] },
  ],
  sc_window: [
    { text: 'The blade\'s note and the ring\'s note met, wavered, and locked into one, and the sword went still and silent in Kord\'s hand as if it had found what it had been humming for all its life.', sfx: 'puzzle', effects: [{ set: 'ch3.window_awake' }] },
    { text: 'The ring woke. Light poured round its glass like water round a basin, and inside it was this room, but young: the lamps bright, the floor polished, the walls alive with little moving pictures. And beyond the cracked window there was no sea, only a darkness full of streaming lights, like rain falling sideways through the stars.', art: 'bg/wyr-window-past', caption: 'The Window of Years' },
    { text: 'Then a sound began that Kord would remember all his life: a wailing, like a hundred brass throats crying the same word over and over.', sfx: 'alarm' },
    { text: 'A man ran in through the far door. He wore clothes of silver that shimmered like a fish\'s belly, and he had an ordinary face, the kind you would pass in any market, and it was wet with terror.' },
    { speaker: 'silver_man', text: '"It\'s cut the Arbiter out! It\'s going back! It can\'t force the Arbiter, it\'ll have to make it *want* to come back!"' },
    { text: 'He tore something from his breast, a sigil of teal glass, and looked wildly about for somewhere to hide it, and found the grate in the floor. The sigil went through the bars like a coin into a well. Then the lights died, in the room in the window, and the man in silver went to his knees in the dark.' },
    { text: 'I have looked through that window many times since, in the long dark of my memory. He always runs in. He never once runs out.', art: null },
    { speaker: 'kord', text: '"Arbiter." He did not look at the stone. He did not need to.' },
    { speaker: 'ain', text: '"I heard," said Ain.' },
    { speaker: 'toktai', text: '"His clothes," said Toktai. "The bones in the strange galley wore the same." Valka: "Then he got out. For a while." Toktai: "And he dropped something. There." He pointed at the rusted grate.' },
  ],
  sc_mind_vision: [
    { text: 'The hall was silent but for the slow grinding of the wheels in its walls, like a giant thinking. Then the pillar of light under the serpent\'s jaws grew bright, and in it, as in a pool, there was a picture.', art: 'keyart/ouroboros-heart', caption: 'The Mind of the Wyrm', effects: [{ objective: { id: 'ch3_records', to: 'active' } }] },
    { text: 'A chamber of black stone, inside some vast black pyramid, lit by braziers. A black obelisk. And kneeling before it, a tall, shaven, gaunt man in black and crimson, with a serpent ring on the hand he lifted.' },
    { speaker: 'toktai', text: '"Thulamon," breathed Toktai. "The archpriest of Set. I saw him once in Shadizar, from far away. It was not far enough."' },
    { speaker: 'thulamon_vision', text: 'The priest\'s voice came out of the light like warm oil poured into a cup. "Great Set. Father of Serpents. Your servant kneels, as all men will kneel. The sea is emptied of ships. Tell me the hour."' },
    { text: 'And Set answered. The voice did not come from the picture. It came from the serpent\'s mouth, here, in this room, deep and slow, and from very far below, as if the whole sea were a throat. Something in it was strange and familiar at once, the way your own voice is strange when a cliff gives it back.', sfx: 'wyrm-roar' },
    { speaker: 'set_voice', text: '"Patience, priest. The key comes to me across the sea. At the dark of the moon, prepare the Stillness."' },
    { speaker: 'thulamon_vision', text: '"It shall be as you say, Great Set." The priest bowed until his forehead touched the black floor, and the picture faded from the light.' },
    { speaker: 'valka', text: '"Gods talk out of statues all the time in Stygia. There\'s a priest behind the idol with a speaking-tube."' },
    { speaker: 'ain', text: '"There is no priest behind this one," said Ain. "That voice came from below. A long way below." Its light had gone very dim. "Take me to the speaking wall. I want to read what this thing remembers."', art: null },
  ],
  sc_records: [
    { text: 'Ain drifted to the wall of glass beside the pillar, where the little lights crawled, and hung there for a long moment, and the lights began to crawl toward it, as iron filings crawl toward a lodestone. When it spoke, its voice was very level.', art: 'keyart/ouroboros-heart', caption: 'The heart-records', effects: [{ set: 'ch3.twist2_done' }] },
    { speaker: 'ain', text: '"The walls remember. This vessel has a name. Ouroboros: the serpent that eats its own tail."' },
    { speaker: 'kord', text: '"The Wyrm."' },
    { speaker: 'ain', text: '"The Wyrm. It is a vessel capable of displacement along the temporal axis, by way of—"' },
    { speaker: 'kord', text: '"Speak Cimmerian."' },
    { speaker: 'ain', text: '"It is a boat. It swims the sea, and it swims another river: the River of Hours. It came down that river from twelve thousand years hence."' },
    { speaker: 'toktai', text: '"Twelve thousand years. On the steppe we do not count past the next winter."' },
    { speaker: 'ain', text: '"The mind that steers it calls itself the Steward. But the mind is not here. This ship is a hand. A hunting-hound. The mind it belongs to sleeps under the Black Pyramid of Khemi. It came across the River inside this ship and was planted there, long ago, like a seed. A seed that could swim the River again, if it chose."' },
    { speaker: 'valka', text: '"And Thulamon calls it Set."' },
    { speaker: 'ain', text: '"Thulamon calls it Set." A pause. "There is one more line. It is written in the oldest part, where nothing else is written. \'ARBITER KEY: CANNOT BE COMPELLED, COPIED OR FORGED.\'"' },
    { text: 'It read the line again, slowly, as a man rereads a letter in a hand he almost knows.' },
    { speaker: 'ain', text: '"ARBITER KEY: CANNOT BE COMPELLED, COPIED OR FORGED."' },
    { speaker: 'ain', text: '"The doors call me Arbiter. If that is what I am... then no one can make me do anything. Good."' },
    { speaker: 'kord', text: '"Good."' },
    { text: 'Kord looked up at the vast bronze head, and the pillar of light, and the wheels turning in the walls, and scratched his jaw.' },
    { speaker: 'kord', text: '"So the Stygians pray to a boat."' },
    { speaker: 'ain', text: '"To the one who rows it."' },
    { speaker: 'toktai', text: '"What key?"' },
    { speaker: 'ain', text: '"I do not know what it opens. But it is waiting for me, and things that wait for you are rarely gifts." Its light steadied. "If I am its key, I will not touch it. Kord\'s sword will."' },
    { speaker: 'kord', text: '"My sword touches everything. It\'s not fussy."' },
    { text: 'Then the serpent noticed them. Its glass eyes turned, slowly, and looked down; and every light in the hall turned the colour of blood, and a hundred brass throats began to cry.', sfx: 'alarm', effects: [{ fx: 'shake' }] },
    { text: 'Before the pillar, the floor split along seams no one had seen and opened like a bronze flower, and up out of it came heat, and a great slow pulse, and a red-gold light like a little sun.', art: null,
      effects: [{ objective: { id: 'ch3_records', to: 'done' } }, { objective: { id: 'ch3_heart', to: 'active' } }] },
    { speaker: 'ain', text: '"It knows we are here. The heart of the ship is below. If the heart stops, the body stops."' },
    { speaker: 'valka', text: '"Then let\'s go and stop its heart," said Valka, and drew her sword. "I\'ve always wanted to kill a god. This one will do to start."' },
  ],
  sc_warden: [
    { text: 'Something unfolded from the wall beside the caged sun: a man of bronze three times the height of Kord, with a core of glass in its breast that burned like the star behind it, and two great arms that moved on their own, like hounds on leashes, reaching.', sfx: 'servo' },
    { speaker: 'warden_voice', text: 'Its voice rang through the chamber like a hammer on a bell. "INTRUDERS. ARBITER: STAND ASIDE."' },
    { speaker: 'ain', text: 'Ain hung still for a heartbeat. Then, quite firmly: "No."' },
    { speaker: 'kord', text: '"Then stand behind me."' },
    { speaker: 'toktai', text: '"Bronze laughs at blades," said Toktai, nocking an arrow, "and—" Valka: "Weeps at hammers. We\'ve all heard it, Toktai."' },
  ],
  sc_warden_down: [
    { text: 'The Warden fell like a temple in an earthquake, slowly, and then all at once, and its glass heart went dark. Behind it the captive sun stuttered in its rings.' },
    { text: 'Ain drifted in among the turning rings, close to the dying star, so that its teal light and the star\'s gold light mingled, and for a moment it seemed to listen to something no one else could hear.' },
    { speaker: 'ain', text: '"The Wyrm is mine to steer now, for a little while. It is running for the Stygian shore, and I will let it." A pause. "Kord. Before we get there, there is a choice to make, and I would rather it were yours. Talk to me when you are ready."' },
  ],
  sc_beaching: [
    { text: 'Ain flared, and the little sun flared with it, white, then gold, then red, and the rings that held it slowed, and stopped, and the star went out like a coal dropped in a bucket.', sfx: 'ain-cast', effects: [{ fx: 'flash' }] },
    { text: 'The Wyrm screamed. Every rib of it screamed together, and the floor tilted, and the whole great body bent and drove for the shore like a wounded bull running for its herd.', sfx: 'wyrm-roar', effects: [{ fx: 'shake' }] },
    { text: 'When it struck the black sand of Stygia the sound went on for a long time. Then there was silence, and the smell of the sea, and through a rent in the Wyrm\'s side, stars.' },
    { speaker: 'valka', text: '"My ship," said Valka into the silence, "had better be in one piece." And from far below, faint but furious, came the voice of Mother Teg: "She floats, Captain! Mostly!"' },
    { speaker: 'toktai', text: '"On the steppe we say: any landing you walk away from is a good one." He considered. "On the steppe we do not have landings."' },
    { speaker: 'ain', text: 'In the dark where the sun had hung, something small still glowed. "The star left a coal," said Ain. "Take it, Kord. It would be a waste."' },
  ],
  sc_beaching_spared: [
    { text: 'Ain went still among the rings. Then, very gently, as a man unknots a rope that has been tied for a long time, it reached into the teal veins in the wall, and followed them down, and down, and found the one cord of light that ran out of the Wyrm and away under the sea toward Khemi. And cut it.', sfx: 'ain-cast' },
    { text: 'The Wyrm did not scream. It sighed. Every rib of it sighed together, long and low, like a hound lying down by a fire after a day\'s running, and the little sun dimmed to a slow red pulse, and the floor tilted, and the great body turned, unhurried, for the shore.' },
    { text: 'When it touched the black sand of Stygia it was almost tender about it. It slid up the shallows on its belly, and stopped, and lay its great head down on the beach, and opened its jaws a little way, the way a sleeping dog does, so that the night air and the stars came in.' },
    { speaker: 'ain', text: '"It has no master now," said Ain. "If anyone ever calls it, it will be me."' },
    { speaker: 'valka', text: '"If it so much as yawns at my ship," said Valka, "I\'m coming back with a harpoon the size of a mast." And from far below, faint but furious, came the voice of Mother Teg: "She floats, Captain! Mostly! And the beast\'s left its mouth open, so we\'re sailing out through the front door!"' },
    { speaker: 'toktai', text: '"On the steppe we say: any landing you walk away from is a good one." He considered. "On the steppe we do not have landings. Or dragons that let you out when you ask nicely."' },
  ],
};

// ---------------------------------------------------------------- objectives
export const objectives = [
  { id: 'ch3_door', text: 'Open the great round door.', done: F('ch3.door_open'), members: ALL,
    hints: ['The door has two sockets shaped like eggs. Somewhere among the swallowed ships are stones that fit them: warm, glowing, humming.',
      'One stone lies in the lap of the silver skeleton by the pale galley. Another glows in the chest of the bronze man by the Stygian barge.',
      'Take the star-stone from the silver skeleton, approach the barge and defeat the Brazen Man, then use both star-stones on the door.'],
    party: {
      kord: '"Two holes, two eggs. Even I can do that sum. Find the eggs."',
      toktai: '"That bronze man by the barge has a stone in his chest. If the gift is in the wolf, Cimmerian, first you deal with the wolf."',
      ain: '"The dead man in silver by the pale galley is holding something warm. I can feel it humming from here."',
      valka: '"The big bronze lad by the barge has been eyeing me. I think he has something of ours. Let\'s go and take it off him."' } },
  { id: 'ch3_crew', text: 'Find the Shrike\'s crew.', done: F('ch3.crew_woken'), members: ALL,
    hints: ['The scrape marks lead through the round door and deeper into the Wyrm.',
      'The crew stand like statues in the Hall of Statues, held by the song of a singing pillar. Toktai and Valka feel it; Kord hears nothing at all.',
      'Hit the singing pillar in the Hall of Statues (or use a weapon on it) and win the fight.'],
    party: {
      kord: '"Something is singing my friends to sleep. I don\'t hear a thing. Good. That means I can hit it."',
      toktai: '"Follow the marks. A thing dragged leaves a trail. A thing carried does not. We are lucky they were dragged."',
      ain: '"It is a song, and it lives in the pillar. Kord cannot hear it. I would like to know why. Later. After he has hit it."',
      valka: '"They\'re alive. I know they\'re alive. Find them, and find whatever took them, and let me at it."' } },
  { id: 'ch3_window', text: 'Find the way past the Window of Years.', done: F('ch3.mind_open'), members: ALL,
    hints: ['The ring of glass hums one low note. Something you carry hums the same note.',
      'Touch the Humming Blade to the ring and watch what the window shows. Where did the man in silver hide the sigil?',
      'Use the Humming Blade on the ring, pull open the rusted grate, take the key-sigil, and use it on the sealed door.'],
    party: {
      kord: '"The ring hums. My new sword hums. Same tune. Crom, I hate it when sorcery makes sense."',
      toktai: '"Something fell through that grate a long time ago. Things that fall through grates are usually worth having. I speak as a thief."',
      ain: '"It wants a voice it knows. And the man in the window dropped something. And the door has a hollow. And Kord is already pulling at the grate, so I will stop talking."',
      valka: '"That door wants a key. Everything in this fish wants a key. Look where the silver fellow dropped his."' } },
  { id: 'ch3_records', text: 'Learn what the Wyrm is.', done: F('ch3.twist2_done'), members: ALL,
    hints: ['The serpent speaks with the voice of Set. The walls of this hall remember things.',
      'Ain can read the speaking wall beside the pillar of light. Bring it close.',
      'Look at, or talk to, the heart-records (the speaking wall) beside the pillar of light.'],
    party: {
      kord: '"The stone wants to read the wall. Let it read. Then we find something to hit."',
      toktai: '"A god that speaks out of a bronze snake. We have a word for gods that answer back. It is not polite. Check behind the tent."',
      ain: '"Take me to the speaking wall. Please. I need to know what this is."',
      valka: '"Our jewel wants a look at that glowing wall. I want a look at whatever sent my crew to sleep. Both, then."' } },
  { id: 'ch3_heart', text: 'Stop the Wyrm\'s heart.', done: F('ch3.warden_dead'), members: ALL,
    hints: ['The floor of the Mind has opened. The heart of the Wyrm lies below.',
      'The Warden guards it. Its two arms let it strike twice; break the arms first. Bronze weeps at hammers, and shrugs off slashes and lightning.',
      'Go down to the Captive Sun and defeat the Warden: arms first, crush weapons (the Kraken-bone Club, the Bronze Mace), and Defend when its core brightens.'],
    party: {
      kord: '"Down. Find the heart. Stop it. Speak Cimmerian, they say. That\'s Cimmerian."',
      toktai: '"Bronze laughs at blades and weeps at hammers. I will keep saying it until somebody listens. Take the club, Cimmerian."',
      ain: '"Whatever guards the heart will not strike me, I think. I would rather it struck me than you. Break its arms first."',
      valka: '"A heart is a heart. You put a blade in it, or a club, and it stops. I\'ve never met one yet that didn\'t."' } },
  { id: 'ch3_fate', text: 'Decide the Wyrm\'s fate.', done: F('ch3.beached'), members: ALL,
    hints: ['The Warden is down, and the Wyrm is running for the shore. Ain is waiting among the rings of the Captive Sun.',
      'Ain can burn out the Wyrm\'s heart, or cut the leash that ties it to its master and let it sleep. Your friends have opinions: ask them.',
      'Talk to Ain (or to the sun) and choose. Either way the chapter ends; the choice matters later.'],
    party: {
      kord: '"The stone wants an answer. Kill it or leave it. Crom, I hate choosing. Hitting is simpler."',
      toktai: '"Talk to the stone, Cimmerian. It is waiting for you, and so is the shore."',
      ain: '"Burn its heart, or cut its leash. Tell me which, Kord. I will do it."',
      valka: '"You know what I\'d do. Go on. Tell the jewel."' } },
];

// ---------------------------------------------------------------- shops, threats, seek trouble, banter
export const shops = {};

export const threats = ['shock', 'drowsy', 'machine'];

export const seekTrouble = {
  wyrm: { pool: ['glass_spider', 'serpent_drone'], size: [1, 3], tier: 'party', partySize: 'current',
    rewardFrom: 'e3_spiders', pct: 25, optional: true },
};

export const banter = {
  toktai: [
    '"On the steppe we say: the wolf that swallows a hedgehog has a long night ahead. We are the hedgehog, Cimmerian. I hope."',
    '"Everything here hums. The walls, the floor, your new sword. I have begun to hum. Stop me if I hum."',
    '"I have robbed temples, palaces and one very surprised priest of Mitra. I have never robbed a dragon from the inside. My grandfather would not have believed it. My grandfather believed nothing."',
  ],
  ain: [
    '"These walls are made the way I am made. I find I do not like it. That is a new feeling. I will call it dread, and hope I am using the word correctly."',
    '"The lights follow us because they have been told to light the way for anyone aboard. They are being polite." Kord: "They are spying." Ain: "...Also that."',
    '"If you are wondering whether I can feel the hum: yes. It is like hearing someone say my name in the next room, over and over, kindly."',
  ],
  valka: [
    '"Swallowed whole, ship and all, and not a scratch on her paint. I want to be furious, but it\'s a beautiful piece of seamanship."',
    '"Stay close, Cimmerian. Not because I\'m frightened. Because if something eats you, I want to see the look on its face."',
    '"No man owns me. No god either. And I\'ll be damned before a fish does."',
  ],
};
