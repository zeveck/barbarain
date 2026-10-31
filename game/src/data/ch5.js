// BarbarAIn — Chapter V: The Stillness, and the epilogue (STORY.md, chapter V).
// Plain data (DATA_SPEC). Rooms: pyr_stilled (Kord alone; the gong puzzle),
// pyr_ascent (the outer stair), pyr_apex (Thulamon, the Steward, the
// resolution), epi_dawn (the epilogue at sea, the teal sliver, the last page,
// credits).
//
// Engine extensions used here (design/ENGINE_NOTES.md): room.map, dungeon,
// glints, fx, banter, exit.blockedEffects, exit.hidden, thing.use.self,
// thing.still, response.speaker, effect {text, speaker}, effect groups,
// dialogue node {cond, else}, scene line {art, caption, cond}, objective.members.
// Requested but not yet in the engine (design/INTEGRATION_REQUESTS.md):
// thing.tint:'stilled' (grey frozen sprites), chapter.credits (end screen).

export const chapter = {
  n: 5, name: 'The Stillness', start: 'pyr_stilled', card: 'keyart/stilled-khemi',
  party: ['kord', 'toktai', 'valka'],
  opening: 'The whole world held its breath, and did not let it out. In all of Khemi, in all the black land of Stygia, only one heart went on beating out of time.',
  // For the end-of-game screen (requested): shown after {chapterEnd:5}.
  credits: [
    { role: 'Original idea and request', who: 'the player' },
    { role: 'Story, code and design', who: 'Claude, via gamegen' },
    { role: 'Art', who: 'imagegen2, nanogen, anim8gen' },
    { role: 'Music and sound', who: 'audiogen (ElevenLabs)' },
    { role: 'Fonts (SIL Open Font License)', who: 'Alegreya, Pixelify Sans, Metamorphous, Cinzel Decorative' },
    { role: 'Inspired by', who: 'the Hyborian Age of Robert E. Howard' },
    { role: 'And thanks', who: 'to you, for reading the chronicle to its end' },
  ],
};

export const itemNames = {
  temple_guards_maul: ['maul', 'hammer', 'guard maul', 'temple maul'],
  atlantean_blade: ['blade', 'atlantean blade', 'atlantean sword', 'king sword'],
  black_lacquer_plate: ['plate', 'lacquer', 'lacquer plate', 'black plate', 'armour', 'armor'],
  greater_draught: ['draught', 'greater draught', 'potion'],
  smelling_salts: ['salts', 'smelling salts', 'vial'],
  kothian_fire_wine: ['fire-wine', 'fire wine', 'wine', 'flask'],
};

// ---------------------------------------------------------------- people
export const npcs = {
  // thulamon: registered in ch4.js (one registry for both chapters)
  steward: { name: 'The Steward', names: ['steward', 'set', 'serpent'], portrait: 'portrait/steward', machine: true },
  bakari_free: { name: 'Bakari', names: ['bakari', 'kushite', 'singer'], portrait: 'portrait/bakari' },
};

// ---------------------------------------------------------------- helpers
const F = (flag) => ({ flag });
const NOT = (c) => ({ not: c });
const ALL = (...c) => ({ all: c });

// Every weapon in the game: any of them can strike the gong or the obelisk.
const WEAPONS = ['rusty_broadsword', 'notched_dagger', 'thiefs_dirk', 'hyrkanian_shortbow', 'cudgel', 'zamorian_shortsword',
  'woodcutters_axe', 'iron_mace', 'hunting_spear', 'ashkarran_bronze_mace', 'lion_hilt_broadsword', 'barachan_cutlass',
  'boarding_axe', 'harpoon', 'argossean_rapier', 'composite_horn_bow', 'zingaran_main_gauche', 'kraken_bone_club',
  'orthos_black_sabre', 'humming_blade', 'star_iron_greatsword', 'bow_of_the_hours', 'sun_lance', 'khopesh_of_set',
  'stygian_glaive', 'asp_fang_dagger', 'embalmers_flail', 'sea_queens_sabre', 'bow_of_kush', 'temple_guards_maul', 'atlantean_blade'];
const onWeapons = (resp) => Object.fromEntries(WEAPONS.map(w => [w, resp]));

// ---- the Stilled Halls: the first Brazen Man (on taking the maul, or the 4th action)
const AMBUSH_A = { cond: NOT(F('ch5.halls_a_dead')), effects: [
  { text: 'Something moved at the end of the hall. In a world where nothing moved, it was as loud as a scream. A man of bronze stepped out from between the pillars, faceless, patient, its joints ticking like a cooling pot. Whatever had stilled the living had not troubled to still the made.' },
  { sfx: 'servo' },
  { battle: 'e5_halls_a' },
  { text: 'The bronze man went over like a felled idol and lay ringing on the flagstones, and the ringing went on and on, because there was nothing in all that hall to soften it.' },
] };

// ---- the gong: struck with any weapon (or `hit gong`)
const GONG_STRIKE = [
  { cond: F('ch5.friends_woken'), speaker: 'toktai', text: 'BONG. Toktai claps both hands over his ears. "Once was enough, Cimmerian. A drum beaten twice is a drum that wants something."', sfx: 'gong' },
  { cond: NOT(F('ch5.halls_b_dead')), text: 'Kord hefts his weapon and steps up to the gong. Behind it, in the gong\'s own shadow, something unfolds: a second man of bronze, that had stood there so still Kord took it for a statue. In this hall that was a fair mistake.',
    effects: [
      { battle: 'e5_halls_b' },
      { text: 'The second bronze man fell against the gong as it died and set it humming, low, like a giant clearing its throat. Kord waited until the hall was still again. Then he set his feet, swung, and struck the gong full in its face.' },
      { text: 'BONG.' }, { sfx: 'gong' },
      { set: 'ch5.gong_humming' },
      { text: 'The note rolled down the hall like a wave over sand. For a moment the dust hung in the air and *shivered*. Valka\'s fingers twitched on her sabre hilt. Then the note began to thin, and the stillness crept back in behind it like water filling a footprint.' },
      { speaker: 'ain', text: '"...yes... more... it needs a voice... yours..."' },
    ] },
  { cond: F('ch5.gong_humming'), text: 'BONG. The second note climbs on the back of the first, and the great disc shivers and sings. Toktai\'s lip lifts, as if at the start of a joke. Not enough. A gong is only bronze. It wants a voice riding on it.', sfx: 'gong' },
  { text: 'Kord sets his feet, swings, and strikes the gong full in its face. BONG.', sfx: 'gong',
    effects: [{ set: 'ch5.gong_humming' },
      { text: 'The note rolled down the hall like a wave over sand. For a moment the dust hung in the air and *shivered*. Valka\'s fingers twitched on her sabre hilt. Then the note began to thin, and the stillness crept back in behind it like water filling a footprint.' },
      { speaker: 'ain', text: '"...yes... more... it needs a voice... yours..."' }] },
];

// ---- the roar (shout, or `say crom`)
const HALL_SHOUT = [
  { cond: F('ch5.friends_woken'), text: 'Kord roars for the sheer joy of hearing something answer. Toktai winces. Valka throws back her head and roars back, louder, and grins at him like a wolf that has won an argument.' },
  { cond: F('ch5.gong_humming'), text: 'Kord fills his chest until his ribs creak, and as the gong\'s note swells he lets it go.', effects: [{ scene: 'sc_wake' }] },
  { text: 'Kord bellows the war-cry of the black hills, a sound that has stopped Aquilonian cavalry. In that silence it seems to go a long way and then lose heart. Toktai\'s left eye twitches. Once. Then nothing. The stillness closes over the noise like a pond over a stone.',
    effects: [{ set: 'ch5.shouted' }, { speaker: 'ain', text: '"...almost... louder than a man... be the noise..."' }] },
];

// ---- the Steward: striking or touching the obelisk after Thulamon falls.
// After the battle and the resolution the chain stops: the party stand at rest
// before the open core (autosave + the 'core' checkpoint the end screen can
// return to), and the core opens the final choice (design/ENDINGS.md).
const STEWARD_TRIGGER = [
  { cond: NOT(F('ch5.thulamon_dead')), text: 'Thulamon stands between Kord and the black stone, and he has opinions about it.' },
  { text: 'Kord lays his weapon against the black stone, and the stone lays its whole weight against his mind.',
    effects: [
      { scene: 'sc_steward' },
      { battle: 'e5_steward' },
      { objective: { id: 'ch5_steward', to: 'done' } },
      { music: 'ending' }, { ambience: 'loop-crowd' },
      { scene: 'sc_resolution' },
      { objective: { id: 'ch5_choice', to: 'active' } },
      { checkpoint: 'core' },
    ] },
];

// ---- the open core: the final choice, then the chosen ending. The dialogue
// only records the answer (ch5.end_watch / end_hound / end_answer); the scenes
// and the run for the harbour play here, after it closes.
const FINALE_OPEN = ALL(F('ch5.steward_dead'), NOT(F('ch5.ain_gone')));
const ENDING_RUN = [{ guestLeave: 'bakari' }, { scene: 'sc_collapse' }, { set: 'ch5.ain_gone' }, { goto: 'epi_dawn' }];
const CORE_CHAIN = [
  { dialogue: 'dlg_finale' },
  { cond: ALL(F('ch5.end_watch'), NOT(F('ch5.ain_gone'))), effects: [{ objective: { id: 'ch5_choice', to: 'done' } }, { scene: 'sc_farewell' }, ...ENDING_RUN] },
  { cond: ALL(F('ch5.end_hound'), NOT(F('ch5.ain_gone'))), effects: [{ objective: { id: 'ch5_choice', to: 'done' } }, { scene: 'sc_hound' }, ...ENDING_RUN] },
  { cond: ALL(F('ch5.end_answer'), NOT(F('ch5.ain_gone'))), effects: [{ objective: { id: 'ch5_choice', to: 'done' } }, { scene: 'sc_break' }, ...ENDING_RUN] },
];
const CORE_TALK = { cond: FINALE_OPEN, text: 'Kord kneels at the edge of the open core. Deep inside the black crystal, the small teal spark brightens.', effects: CORE_CHAIN };

// ---- the last page: the teal sliver, the narrator's reveal, title and credits
const LAST_PAGE = [
  { cond: F('ch5.sliver_found'), text: 'The sliver is warm in Kord\'s hand. It has said what it had to say.' },
  { text: 'Kord loosens the drawstring of his belt pouch.',
    effects: [
      { set: 'ch5.sliver_found' },
      { objective: { id: 'ch5_home', to: 'done' } },
      { scene: 'sc_sliver' },
      { scene: 'sc_last_page' },
      { scene: 'sc_credits' },
      { chapterEnd: 5 },
    ] },
];

// ---------------------------------------------------------------- rooms
export const rooms = {
  // ============================================================ THE STILLED HALLS
  pyr_stilled: {
    name: 'The Stilled Halls', bg: 'bg/pyr-stilled', music: null, ambience: 'loop-stillness', machine: false, dungeon: true,
    map: { x: 0, y: 2 }, mapName: 'Stilled Halls',
    fx: [{ type: 'vignette', a: 0.45 }, { type: 'motes', n: 10, cond: NOT(F('ch5.friends_woken')) }],
    glints: [   // Ain's voice in the carved walls
      { x: 16, y: 44, small: true, period: 300, cond: NOT(F('ch5.friends_woken')) },
      { x: 304, y: 40, small: true, period: 340, phase: 120, cond: NOT(F('ch5.friends_woken')) },
      { x: 20, y: 30, small: true, period: 260, phase: 60, cond: F('ch5.gong_humming') },
    ],
    desc: [
      { cond: F('ch5.friends_woken'), text: 'The Stilled Halls were still, but no longer silent: the great [[gong|gong]] hummed on in the bones of the pyramid, and three living people stood among the statues. The [[guards|temple guards]] kept their frozen watch; the [[priest|priest]] yawned on forever; the [[cat|cat]] hung in its leap. Between the [[braziers|braziers]] a stair climbed out of the dark toward the outer face of the pyramid, and the top.' },
      { cond: NOT(F('ch5.begun')), text: 'Nothing moved in the Stilled Halls. Not the flames in the bronze [[braziers|braziers]], which stood up from their oil like carved amber. Not the dust, which hung in the lamplight in the shapes it had been making when the song began. Not the [[guards|temple guards]] of Set, frozen mid-stride on their way to a fight that had ended without them, nor the [[priest|priest]] caught in the middle of a vast and shameless yawn, nor the [[cat|temple cat]] that hung in the air between a pillar and a ledge, legs spread, as if the world had forgotten to finish it. And nothing moved in the faces of [[toktai_f|Toktai]] and [[valka_f|Valka]], who stood where the Stillness had found them, eyes open, looking at nothing. Before them all hung a great bronze [[gong|gong]]. In the carved [[walls|walls]], something glinted the colour of shallow sea.' },
      { text: 'The Stilled Halls: a temple turned into a sculptor\'s yard. [[toktai_f|Toktai]] and [[valka_f|Valka]] stood like statues of themselves, eyes open. The [[guards|temple guards]] were frozen mid-stride, the [[priest|priest]] mid-yawn, the [[cat|cat]] mid-leap. The great bronze [[gong|gong]] hung silent between the pillars, and in the carved [[walls|walls]] a teal light came and went like a pulse. A stair beyond the [[braziers|braziers]] led up and out.' },
    ],
    short: [
      { cond: F('ch5.friends_woken'), text: 'The Stilled Halls. The [[gong|gong]] still hums. The [[guards|guards]], the [[priest|priest]] and the [[cat|cat]] keep their poses. The stair leads up.' },
      { text: 'The Stilled Halls. [[toktai_f|Toktai]] and [[valka_f|Valka]], frozen. The [[guards|guards]], the [[priest|priest]], the [[cat|cat]], the great [[gong|gong]], and Ain\'s light in the [[walls|walls]].' },
    ],
    onEnter: [{ cond: NOT(F('ch5.begun')), effects: [
      { set: 'ch5.begun' },
      { cond: { inParty: 'ain' }, leave: 'ain' },
      { freeze: 'toktai' }, { freeze: 'valka' },
      { guestLeave: 'bakari' },
      { scene: 'sc_stilled_open' },
      { objective: { id: 'ch5_wake', to: 'active' } },
    ] }],
    onAction: { count: 4, cond: NOT(F('ch5.halls_a_dead')), effects: [AMBUSH_A] },
    exits: [
      { dir: 'u', label: 'The outer stair', names: ['stair', 'stairs', 'up', 'outer stair', 'out'], to: 'pyr_ascent',
        cond: ALL(F('ch5.friends_woken'), F('ch5.halls_a_dead')),
        blocked: [
          { cond: NOT(F('ch5.halls_a_dead')), text: 'Kord turns for the stair, and between the pillars behind him bronze joints tick, patient as a cooling pot. The first bronze man is still on its feet. It will follow him all the way up.' },
          { cond: NOT(F('ch5.halls_b_dead')), text: 'Kord sets a foot on the stair and looks back. Toktai and Valka stand where he left them, two statues of people he would die for. He does not leave friends in the dark. He has never had enough of them to spare.' },
          { text: 'Kord gets three steps up and stops, and comes back down. Not without them. Crom knows he has been called many things, but never a man who walked away.' },
        ],
        blockedEffects: [AMBUSH_A] },
    ],
    shout: HALL_SHOUT,
    say: [
      { match: 'crom', response: HALL_SHOUT },
      { match: 'wake up', response: [
        { cond: F('ch5.friends_woken'), speaker: 'valka', text: '"We\'re awake. Gods, are we awake. I may never sleep again."' },
        { text: '"Wake up," says Kord, the way a man says it to a friend in a tavern at dawn. They do not. Words are too small a sound for this.' }] },
      { match: 'ain', response: { speaker: 'ain', text: '"...here... above... inside the dark... hold on, Kord... be the noise..."' } },
    ],
    banter: {
      toktai: { speaker: 'toktai', text: '"I could hear you the whole time, Cimmerian. You talked to the cat. I will never forget that you talked to the cat."' },
      valka: { speaker: 'valka', text: '"I was in the middle of a word when it took me. I\'d like you to know it was a very rude word, and it was about Thulamon."' },
    },
    things: [
      { id: 'toktai_f', kind: 'prop', name: 'Toktai (frozen)', names: ['toktai', 'hyrkanian', 'archer', 'friend', 'friends', 'statues'], cond: NOT(F('ch5.friends_woken')),
        sprite: { id: 'party/toktai', x: 198, y: 98 }, still: true, tint: 'stilled',
        look: [
          { cond: F('ch5.shouted'), text: 'Toktai, frozen with an arrow half-drawn. Since Kord\'s roar his left eye has a look about it, as if somewhere far inside he heard, and is trying very hard to make a dry remark about it.' },
          { text: 'Toktai stands with an arrow half-drawn to his cheek and one eyebrow raised, at the start of some remark the Stillness never let him finish. His eyes are open. They do not follow Kord. A fly hangs in the air before his nose like a jewel on a thread.' },
        ],
        talk: 'Kord says his name, low. Toktai goes on looking at a point just past Kord\'s ear, where the joke was going to land.',
        take: 'Kord could carry him. He could carry both of them, one on each shoulder, up every step of that pyramid. And then he would have two statues at the top of a pyramid.',
        hit: 'Kord draws back a hand to slap him awake and finds he cannot do it to a man who cannot duck.',
        use: {
          self: { text: 'Kord takes Toktai by the shoulders and shakes him. It is like shaking a young tree: something gives a little, and comes back exactly as it was. The fly before his nose does not even move.' },
          smelling_salts: { text: 'Kord holds the salts under Toktai\'s nose. Nothing. This is not a swoon. It is a song, and salts cannot hear.' },
          kothian_fire_wine: { text: 'Kord tips a little fire-wine between Toktai\'s lips. It runs down his chin. A waste of good wine, and the worst of it is Toktai will never know, and so cannot be grateful.' },
          greater_draught: { text: 'There is nothing wrong with Toktai that a draught can mend. He is not hurt. He is *finished*, like a sentence.' },
          '*': { text: 'Kord holds out the {item}. Toktai, for the first time in their acquaintance, shows no interest at all in something he could steal.' },
        },
        give: { '*': { text: 'Toktai\'s hands are full of bow and Stillness. The {item} would only fall.' } },
      },
      { id: 'valka_f', kind: 'prop', name: 'Valka (frozen)', names: ['valka', 'captain', 'red valka', 'pirate'], cond: NOT(F('ch5.friends_woken')),
        sprite: { id: 'party/valka', x: 88, y: 96 }, still: true, tint: 'stilled',
        look: [
          { cond: F('ch5.gong_humming'), text: 'Valka, sabre half out of its scabbard. Since the gong her fingers have crept a hair\'s breadth further down the hilt. Kord would swear to it.' },
          { text: 'Red Valka, caught in mid-stride with her sabre half out of its scabbard and her mouth open on a word. Knowing Valka, a rude one. Her copper braid hangs in the air behind her, flung out by a turn of the head that will never finish.' },
        ],
        talk: 'Kord tells her she owes him a drink. If anything would wake Valka it would be a debt. It does not.',
        take: 'Kord takes her hand. It is warm, and the pulse beats in it, slow as a tide. She is alive in there. She is just not *here*.',
        hit: 'Kord does not strike a woman who has not drawn a blade. Valka has drawn half of one, which is a hard case, and he decides against it.',
        use: {
          self: { text: 'Kord shakes her by the shoulders, gently and then not gently. Her braid swings and comes back to where it was, like a door on a spring.' },
          smelling_salts: { text: 'Salts under Valka\'s nose. She does not so much as wrinkle it, and Kord has seen her wrinkle it at far less. This is not a faint. It is something that has to be shaken out of the air itself.' },
          kothian_fire_wine: { text: 'Kord wets her lips with fire-wine. In any other hour of her life Valka would have drunk the flask and asked for the next. Kord stops pouring before he starts grieving.' },
          '*': { text: 'Valka does not take the {item}. It is the first thing she has ever refused for free.' },
        },
        give: { '*': { text: 'Valka does not take the {item}. It is the first thing she has ever refused for free.' } },
      },
      { id: 'gong', kind: 'prop', name: 'great bronze gong', names: ['gong', 'bronze gong', 'great gong', 'disc', 'bronze'],
        sprite: { id: 'prop/bronze-gong', x: 132, y: 76 }, still: true,
        look: [
          { cond: F('ch5.gong_struck'), text: 'The great gong still hums, so low it is less a sound than a feeling in the teeth. Kord gives it a nod, one warrior to another.' },
          { cond: F('ch5.gong_humming'), text: 'The great gong shivers on its frame, still humming. A gong this size could sing for a hundred heartbeats. It sounds like a word half-said, waiting for someone to say the rest.' },
          { text: 'A bronze gong as wide as a cart-wheel, hung between two pillars on chains of black iron, its face worked with a coiled serpent. It is meant to call ten thousand Stygians to their knees. In all this silence it is the only thing in the hall that was *made* to make noise.' },
        ],
        take: 'Kord tests the chains. The gong weighs more than he does, and is fastened to a pyramid.',
        hit: GONG_STRIKE,
        talk: [
          { cond: F('ch5.gong_humming'), text: 'Kord speaks to the gong. It hums back under his words, and for a moment, just for a moment, his own voice seems bigger than his throat.' },
          { text: 'Kord says something to the gong. In this silence even his voice sounds small and far away. A gong would say it better.' },
        ],
        use: Object.assign(onWeapons(GONG_STRIKE), {
          self: { text: 'Kord taps the gong with a knuckle. *Tink.* A gong this size wants a heavy blow and a strong arm behind it. Kord has an arm. He needs something heavy at the end of it.' },
          '*': { text: 'Kord taps the gong with the {item}. *Tick.* Bronze wants a weapon, swung hard.' },
        }),
      },
      { id: 'guards', kind: 'prop', name: 'frozen temple guard', names: ['guard', 'guards', 'temple guard', 'temple guards', 'big guard', 'maul guard'],
        sprite: { id: 'npc/temple-guard', x: 46, y: 100 }, still: true, tint: 'stilled',
        look: [
          { cond: F('ch5.maul_taken'), text: 'A temple guard of Set, frozen mid-stride, his hands closed on a maul that is no longer there. He looks like a man who has just been robbed and not yet noticed. In his defence, he never will.' },
          { text: 'A huge temple guard of Set, frozen mid-stride with a bronze-headed maul in both fists, one sandal lifted from the floor. Behind him others like him stand in the gloom between the pillars, a whole watch of statues. The maul is a brute of a thing, made for breaking skulls. Or bronze.' },
        ],
        take: [
          { cond: F('ch5.maul_taken'), text: 'Kord has taken the maul. The guard has nothing else worth having, unless Kord wants his opinions, which are frozen.' },
          { text: 'Kord prises the maul out of the guard\'s fists, one stiff finger at a time. The guard lets it go without a word. "It seems only fair," says Kord, and hefts it. Bronze men. Hammer. "Even I can do that sum."', sfx: 'clang',
            effects: [{ give: 'temple_guards_maul' }, { set: 'ch5.maul_taken' }, AMBUSH_A] },
        ],
        talk: 'Kord asks the guard how the night has been going. The guard\'s face says: badly, and for a long time.',
        hit: 'Kord measures the guard for a blow and stops. There is no glory in hitting a man who cannot hit back, and no fun either.',
        use: { '*': { text: 'Kord offers the guard the {item}. The guard, who once would have arrested Kord for less, accepts nothing.' } },
        give: { '*': { text: 'The guard\'s hands are full of nothing. Kord leaves them that way.' } },
      },
      { id: 'sergeant', kind: 'prop', name: 'guard with a heavy belt', names: ['sergeant', 'belt', 'pouch', 'guard belt', 'officer', 'second guard'],
        sprite: { id: 'npc/temple-guard', x: 238, y: 100 }, still: true, tint: 'stilled',
        look: [
          { cond: F('ch5.belt_taken'), text: 'The sergeant of the watch, a little lighter than he was. His belt hangs open. Kord has left him his dignity, which in a temple guard of Set was never worth much.' },
          { text: 'A temple guard with a sergeant\'s crest, frozen with one hand raised to bark an order. His belt is heavy: flasks, little stoppered jars of something red, and a leather bottle stamped with the bull of Koth.' },
        ],
        take: [
          { cond: F('ch5.belt_taken'), text: 'The belt is empty. Kord shakes it to be sure. Nothing falls out but dust, which hangs in the air where it fell.' },
          { text: 'Kord empties the sergeant\'s belt: three jars of a thick red draught that smells of honey and iron, and a flask of Kothian fire-wine. He tips the frozen man a nod. "It seems only fair."', sfx: 'pickup',
            effects: [{ give: 'greater_draught', n: 3 }, { give: 'kothian_fire_wine' }, { set: 'ch5.belt_taken' }] },
        ],
        talk: 'Kord asks the sergeant what order he was giving. The answer, by the look of him, was "Charge," and nobody did.',
        hit: 'The sergeant\'s raised hand would make a fine target. Kord leaves it raised. It is more insulting that way.',
        use: { '*': { text: 'The sergeant does not want the {item}. He wants to finish his sentence, and cannot.' } },
        give: { '*': { text: 'The sergeant does not want the {item}. He wants to finish his sentence, and cannot.' } },
      },
      { id: 'priest', kind: 'prop', name: 'yawning priest', names: ['priest', 'yawning priest', 'yawn', 'shaven priest', 'acolyte', 'girdle', 'vials'],
        sprite: { id: 'npc/temple-guard', x: 286, y: 106 }, still: true, tint: 'stilled',
        look: [
          { cond: F('ch5.salts_taken'), text: 'The priest yawns on, for ever. Kord has relieved him of his salts, which seems a small price for so long a rest.' },
          { text: 'A shaven priest of Set in a black robe, caught at the very top of a yawn so enormous that Kord can count his teeth, and does: twenty-six, and two of those are not his own. Some long rite must have bored him past bearing. A vial of smelling salts hangs at his girdle, for keeping awake at sacrifices.' },
        ],
        take: [
          { cond: F('ch5.salts_taken'), text: 'Kord has his salts. The priest has his yawn. Everyone is satisfied.' },
          { text: 'Kord unhooks the little vials from the priest\'s girdle: two of them, for priests who swoon at the sight of what their god asks for. "It seems only fair," he says. The priest goes on yawning in agreement.', sfx: 'pickup',
            effects: [{ give: 'smelling_salts', n: 2 }, { set: 'ch5.salts_taken' }] },
        ],
        talk: 'Kord tells the priest he is boring. The priest, mid-yawn, appears to agree completely.',
        hit: 'Kord will not strike a man who cannot see it coming. He does, however, push the priest\'s jaw shut with one finger. It stays shut. He feels better about the hall.',
        use: {
          smelling_salts: { text: 'Kord waves the priest\'s own salts under his nose. The priest\'s yawn does not so much as flinch. Whatever holds them here is deeper than any sleep.' },
          '*': { text: 'Kord considers putting the {item} into the priest\'s open mouth. He decides it would be funny for a moment and then sad for a long time.' },
        },
        give: { '*': { text: 'Kord considers putting the {item} into the priest\'s open mouth. He decides it would be funny for a moment and then sad for a long time.' } },
      },
      { id: 'cat', kind: 'thing', name: 'temple cat', names: ['cat', 'temple cat', 'black cat', 'leaping cat'],
        hotspot: { x: 258, y: 48, w: 22, h: 16 },
        look: [
          { cond: F('ch5.cat_moved'), text: 'The cat sits on the floor where Kord set it, still in the shape of a leap, all four legs flung out, like a small furious star.' },
          { text: 'A sleek black temple cat hangs in mid-air between a pillar and a ledge, legs flung wide, tail straight out behind like a rudder. It has been leaping for a very long time and has not got anywhere. Kord knows the feeling.' },
        ],
        take: [
          { cond: F('ch5.cat_moved'), text: 'Kord has done all he can for the cat. It will have to finish its own leap.' },
          { text: 'Kord plucks the cat out of the air, gently, and sets it down on the floor on its four feet. It stays exactly as it was, legs out, in the shape of a jump, and stands there looking ridiculous. It seems only decent, all the same.', effects: [{ set: 'ch5.cat_moved' }] },
        ],
        talk: 'Kord tells the cat it will land soon. He hopes, for the cat\'s sake and his own, that he is not lying.',
        hit: 'Kord does not hit cats. Dogs are honest; cats are at least frank about not being. Either way, no.',
      },
      { id: 'walls', kind: 'thing', name: 'carved walls', names: ['walls', 'wall', 'carvings', 'glint', 'teal light', 'light', 'fragments', 'voice', 'ain'],
        hotspot: { x: 0, y: 14, w: 40, h: 90 },
        look: [
          { cond: F('ch5.friends_woken'), speaker: 'ain', text: 'The teal light in the carvings is steadier now, almost a glow. Ain\'s voice comes out of the stone, thin as wire: "...yes... climb... I am at the top... inside the dark... I am holding a door... hurry..."' },
          { cond: F('ch5.gong_humming'), speaker: 'ain', text: 'The teal light races along the carved serpents in time with the gong\'s hum. "...yes... the bronze is not enough... a voice... yours... the loudest thing you own..."' },
          { cond: F('ch5.shouted'), speaker: 'ain', text: 'The light in the carvings flares when Kord comes near, like a coal blown on. "...Kord... the song needs stillness to live in... break the stillness... noise... be the noise... louder than one man..."' },
          { speaker: 'ain', text: 'A thread of teal light runs along the carved serpents of the wall, faint as breath on cold bronze, and with it comes a voice Kord would know anywhere, broken into pieces: "...Kord... the song needs stillness to live in... break the stillness..."' },
        ],
        take: 'Kord puts his hand on the light. It is warm, faintly, the way a stone is warm where someone has been sitting. He takes nothing, and keeps his hand there a moment longer than he needs to.',
        talk: [
          { cond: F('ch5.friends_woken'), speaker: 'ain', text: '"...I hear you... I always hear you... come up..."' },
          { speaker: 'ain', text: 'Kord says "Stone." Just that. The light quickens. "...here... I am here... noise, Kord... be the noise..."' },
        ],
        hit: 'Kord raises a fist at the walls and lowers it. Ain is in there somewhere, or a voice like it, and he has never yet hit the stone, whatever he threatened.',
      },
      { id: 'braziers', kind: 'thing', name: 'frozen braziers', names: ['braziers', 'brazier', 'flames', 'fire', 'flame', 'oil'],
        hotspot: { x: 34, y: 90, w: 24, h: 46 },
        look: 'Bronze braziers burning without burning. Each flame stands up from the oil like a carved and polished leaf of amber, and gives no heat, and casts its light in one unwavering pool. Even fire has stopped to listen to the song.',
        take: 'Kord puts a finger into the frozen flame. It is cool, and smooth, and he takes his finger out again with the feeling that he has touched something he should not.',
        hit: 'Kord knocks a brazier with his elbow. The bronze rings. The flame does not even lean.',
        use: { '*': { text: 'Kord holds the {item} in the flame. Nothing happens to it. Nothing is happening to anything, which is the whole trouble.' } },
      },
    ],
  },

  // ============================================================ THE OUTER STAIR
  pyr_ascent: {
    name: 'The Outer Stair', bg: 'bg/pyr-ascent', music: null, ambience: 'loop-stillness', machine: false, dungeon: true,
    map: { x: 0, y: 1 }, mapName: 'Outer Stair',
    fx: [{ type: 'vignette', a: 0.35 }],
    desc: 'The stair climbed the outer face of the Black Pyramid like a road into the sky, and the night above it was moonless and full of hard white stars. Below lay [[khemi|Khemi]], every roof and street and quay of it, and not one light in all that city moved. At the very foot of the pyramid the [[revolt|slave revolt]] had frozen in the act of charging: a thousand freed men with chains and stolen spears, and in front of them all, mouth open on a song that never came out, [[bakari|Bakari of Kush]]. On the landing where the party stood, a [[shrine|trophy shrine]] held the spoils of old wars, and a [[captain|guard captain]] in black lacquer stood frozen at the head of the steps. The [[braziers|braziers]] that lined the stair burned without flickering, all the way up.',
    short: 'The Outer Stair, under a moonless sky. Frozen [[khemi|Khemi]] below, the frozen [[revolt|revolt]] and [[bakari|Bakari]] at the foot. The [[shrine|trophy shrine]], the frozen [[captain|captain]], the [[braziers|braziers]] climbing to the apex.',
    onEnter: [{ cond: NOT(F('ch5.stair_seen')), effects: [{ set: 'ch5.stair_seen' }, { scene: 'sc_stair_open' }] }],
    encounters: [{ id: 'e5_stair_a', auto: true, label: '⚔ Face the bronze men', cond: NOT(F('ch5.stair_a_dead')) }],
    exits: [
      { dir: 'd', label: 'The Stilled Halls', names: ['halls', 'down', 'back', 'inside', 'in'], to: 'pyr_stilled' },
      { dir: 'u', label: 'The apex', names: ['apex', 'up', 'top', 'summit', 'stair', 'stairs'], to: 'pyr_apex',
        cond: ALL(F('ch5.stair_a_dead'), F('ch5.stair_b_dead')),
        blocked: [
          { cond: NOT(F('ch5.stair_a_dead')), text: 'The two bronze men on the landing turn their faceless heads as one and step across the stair. They have not forgotten him. Bronze does not forget.' },
          { text: 'Halfway to the next landing the shadows between two braziers stand up. They have been waiting. One of them is bronze; the other is not anything at all.' },
        ],
        blockedEffects: [
          { cond: F('ch5.stair_a_dead'), effects: [
            { battle: 'e5_stair_b' },
            { text: 'The shadow of Set came apart like smoke in a wind, and the bronze man rolled down forty steps and lay in the dark below, chiming. Above them the stair was empty all the way to the apex, where a pillar of teal light stood up into the sky.' },
            { speaker: 'ain', text: '"...Kord... closer now... I can almost see you..."' }] },
          { cond: NOT(F('ch5.stair_a_dead')), effects: [{ battle: 'e5_stair_a' }] },
        ] },
    ],
    shout: [
      { cond: F('ch5.bakari_tried'), speaker: 'toktai', text: 'Kord roars down the stair again. Far below, nothing stirs. Toktai: "He will hear you when you mean it. You will mean it more at the top."' },
      { text: 'Kord leans out over the stair and roars Bakari\'s name, and Crom\'s, and a few words for the priests of Set. The sound falls away down the great black slope and is swallowed long before it reaches the foot. "Later," he growls. "When I am closer, and angrier."', effects: [{ set: 'ch5.bakari_tried' }] },
    ],
    say: [{ match: 'crom', response: { text: 'Kord says the name of his god to the stars. The stars are frozen too, or seem so. Crom, as ever, keeps his own counsel.' } }],
    banter: {
      toktai: { speaker: 'toktai', text: '"Look at them down there. A whole city holding its breath. I have seen camps that quiet. The wolves had been."' },
      valka: { speaker: 'valka', text: '"I have climbed rigging in a hurricane, and I don\'t like this stair. It goes up like it means to keep going."' },
    },
    things: [
      { id: 'khemi', kind: 'thing', name: 'Khemi', names: ['khemi', 'city', 'roofs', 'harbour', 'stygia', 'view'],
        hotspot: { x: 0, y: 70, w: 120, h: 50 },
        look: 'Khemi spread out below like a city carved for a king\'s tomb. Lamps burned in its windows without flickering. A boat lay on the black harbour with its oars lifted, dripping water that would never land. A hundred thousand people stood in its streets and doorways exactly as they had stood when the song came: content, still, finished. It was the most peaceful thing Kord had ever seen, and it made his skin crawl.',
        take: 'Kord would like to take Khemi, one day, the old-fashioned way. Not like this.',
        hit: 'Kord shakes his fist at the whole of Stygia. It has been a long time coming.',
      },
      { id: 'revolt', kind: 'thing', name: 'frozen revolt', names: ['revolt', 'slaves', 'freed men', 'crowd', 'charge', 'people'],
        hotspot: { x: 40, y: 120, w: 90, h: 40 },
        look: 'At the foot of the pyramid the revolt stood frozen in its charge: men and women in torn linen, chains wrapped round their fists, stolen spears levelled at the temple gate. Their faces were wild with the joy of the first free night of their lives. The Stillness had caught that too, and kept it, like a fly in amber.',
        take: 'They are too far below, and Kord has no rope long enough for a thousand people.',
        hit: 'They are on Kord\'s side. And too far away to hit.',
      },
      { id: 'bakari', kind: 'thing', name: 'Bakari (frozen, far below)', names: ['bakari', 'kushite', 'singer', 'leader'],
        hotspot: { x: 66, y: 136, w: 30, h: 30 },
        look: [
          { cond: F('ch5.bakari_tried'), text: 'Bakari stands at the front of the frozen charge, his broken chain whirling above his head, his mouth wide on the first note of a song. Kord\'s roar did not carry that far. Not yet.' },
          { text: 'At the very front of the revolt stands Bakari of Kush, huge and black as the pyramid, his broken chain swung up over his head and his mouth wide open on the first note of a song he never got to sing. Toktai follows Kord\'s gaze. "Your roar woke us," he says. "It might wake him."' },
        ],
        talk: { text: 'Kord cups his hands and shouts down. The sound dies on the long black slope.', effects: [{ set: 'ch5.bakari_tried' }] },
        take: 'He is two hundred steps down, and built like a war-elephant. Later.',
        hit: 'Kord would sooner punch the pyramid.',
      },
      { id: 'shrine', kind: 'prop', name: 'trophy shrine', names: ['shrine', 'trophy shrine', 'trophies', 'spoils', 'altar', 'sword', 'blade'],
        sprite: { id: 'prop/trophy-shrine', x: 30, y: 118 }, still: true,
        look: [
          { cond: F('ch5.blade_taken'), text: 'The shrine of Set\'s victories, one sword lighter. The rest is gilt and boasting: the crowns of forgotten kings, the standards of armies nobody remembers. Kord took the only honest thing in it.' },
          { text: 'A shrine of black stone heaped with the spoils of Stygia\'s wars: broken crowns, standards gone to dust, the gilded skulls of kings. In the middle, on a stand of its own, lies a long straight sword of a strange pale steel that has not rusted in three thousand years. Its hilt is plain. Its edge is not. Carved beneath it in the old tongue: *taken from the drowned land*.' },
        ],
        take: [
          { cond: { has: 'atlantean_blade' }, text: 'Kord looks over the gilt and the crowns again. Junk, every piece of it, the kind of thing priests keep. He has the only honest thing that was here.' },
          { text: 'Kord lifts the pale sword from its stand. It is heavier than it looks and lighter than it should be, and it sits in his hand as if it had been waiting for the right fist for three thousand years. A king\'s sword from Atlantis, kept here as a boast by people who could never have swung it. "An honest sword," says Kord, and takes it.', sfx: 'clang',
            effects: [{ give: 'atlantean_blade' }, { set: 'ch5.blade_taken' }] },
        ],
        hit: 'Kord kicks the shrine. A gilded skull rolls off and goes bouncing down the stair, three hundred steps, and nobody in all of Khemi turns to watch it go.',
        use: { '*': { text: 'Kord does not give Set anything. Not even the {item}.' } },
      },
      { id: 'captain', kind: 'prop', name: 'frozen guard captain', names: ['captain', 'guard captain', 'lacquer', 'black lacquer', 'armour', 'armor', 'guard'],
        sprite: { id: 'npc/temple-guard', x: 120, y: 102 }, still: true, tint: 'stilled',
        look: [
          { cond: F('ch5.plate_taken'), text: 'The captain of the temple guard stands in his undertunic, frozen in the act of drawing his sword, looking colder than he did. He has the expression of a man who will one day be very annoyed.' },
          { text: 'The captain of the temple guard, frozen at the head of the stair with his sword half drawn, faced the city as if he had heard the revolt coming and turned to meet it. He wears a cuirass of black lacquer plate, layered like a beetle\'s back, the finest armour Kord has seen in Stygia.' },
        ],
        take: [
          { cond: F('ch5.plate_taken'), text: 'The captain has nothing left but his dignity and his tunic, and Kord is not taking the tunic.' },
          { text: 'It takes Kord a while to unbuckle a frozen man, and the captain does not help. At last the black lacquer comes away in his hands, layered and light and hard as a beetle\'s wing. "It seems only fair," says Kord. It seems fairer every time he says it.', sfx: 'pickup',
            effects: [{ give: 'black_lacquer_plate' }, { set: 'ch5.plate_taken' }] },
        ],
        talk: 'Kord asks the captain where his men are. The captain\'s face says they are all around him, and useless.',
        hit: 'The captain\'s jaw is right there. Kord lets it be. He will settle with Stygia\'s soldiers when they can see it coming.',
      },
      { id: 'braziers', kind: 'thing', name: 'braziers', names: ['braziers', 'brazier', 'fires', 'flames', 'torches'],
        hotspot: { x: 156, y: 70, w: 30, h: 40 },
        look: 'Braziers line the stair all the way to the apex, and every flame stands still, a column of amber the height of a man\'s arm. They light the way up like a row of tall, polite servants who will never move again.',
        take: 'Kord puts his hand through a frozen flame. It is like putting his hand into a cold stream that does not flow.',
        hit: 'The brazier rings. Its flame does not care.',
      },
      { id: 'stars', kind: 'thing', name: 'stars', names: ['stars', 'sky', 'night', 'moon', 'heavens'],
        hotspot: { x: 0, y: 0, w: 140, h: 50 },
        look: 'A moonless sky, black as Cimmerian pine-woods, crowded with stars. Kord has slept under the stars of the north, the hard cold ones. These are the same stars. The thought steadies him, though he could not have said why.',
        take: 'Kord has stolen a great many things. He has never yet got a star down.',
        hit: 'The sky is a long way up. Even from here.',
      },
    ],
  },

  // ============================================================ THE APEX OF THE SERPENT
  pyr_apex: {
    name: 'The Apex of the Serpent', bg: 'bg/pyr-apex', machine: true, dungeon: true,
    music: [{ cond: F('ch5.steward_dead'), id: 'ending' }, { id: null }],
    ambience: [{ cond: F('ch5.steward_dead'), id: 'loop-crowd' }, { id: 'loop-stillness' }],
    map: { x: 0, y: 0 }, mapName: 'Apex',
    fx: [{ type: 'vignette', a: 0.3 }, { type: 'motes', n: 18 }],
    glints: [{ x: 162, y: 20, steady: true, a: 0.6, cond: NOT(F('ch5.steward_dead')) }],
    desc: [
      { cond: F('ch5.steward_dead'), text: 'The apex of the Black Pyramid was a ruin open to the stars, and the stars were moving again. Where the obelisk had stood, the stone had split to the roots of the world, and in the split lay the Steward\'s [[core|core]]: a crystal the size of a temple door, black as the gaps between stars, and deep inside it a single teal spark. The [[braziers|braziers]] flickered, real fire now. Far below, [[khemi_far|Khemi]] roared like surf.' },
      { cond: F('ch5.thulamon_dead'), text: 'The apex of the Black Pyramid was a square of black stone open to the stars, and in its centre stood the [[obelisk|obelisk]], wrapped in the coils of a bronze serpent with veins of teal fire. Out of its tip a [[pillar|pillar of teal light]] climbed into the sky, and the song climbed with it, out over [[khemi_far|Khemi]] and the whole still world. The [[braziers|braziers]] on either side burned like red jewels. The edge where Thulamon had fallen was empty. Somewhere inside that black stone, Ain was holding a door.' },
      { text: 'The apex of the Black Pyramid was a square of black stone open to the stars. In its centre stood the [[obelisk|obelisk]], wrapped in the coils of a bronze serpent with veins of teal fire, and out of its tip a [[pillar|pillar of teal light]] climbed into the sky, and the song climbed with it. Before it, arms raised, robes of black and crimson stirring in no wind, stood [[thulamon|Thulamon]].' },
    ],
    short: [
      { cond: F('ch5.steward_dead'), text: 'The broken apex. The open [[core|core]] with Ain inside it, the [[braziers|braziers]], and [[khemi_far|Khemi]] roaring far below.' },
      { cond: F('ch5.thulamon_dead'), text: 'The apex. The [[obelisk|obelisk]] in its bronze coils, the [[pillar|pillar of light]], the [[braziers|braziers]], and [[khemi_far|Khemi]] far below.' },
      { text: 'The apex. [[thulamon|Thulamon]] before the [[obelisk|obelisk]].' },
    ],
    onEnter: [
      { cond: NOT(F('ch5.apex_reached')), effects: [{ set: 'ch5.apex_reached' }, { objective: { id: 'ch5_climb', to: 'done' } }, { objective: { id: 'ch5_thulamon', to: 'active' } }] },
      { cond: NOT(F('ch5.thulamon_dead')), effects: [{ dialogue: 'dlg_thulamon' }] },
      { cond: FINALE_OPEN, effects: [{ speaker: 'ain', text: '"I am still here, Kord. It is still asleep. Take what time you need; then tell me what you want done."' }, { checkpoint: 'core' }] },
    ],
    onIdle: { seconds: 50, cond: FINALE_OPEN, effects: [{ text: 'The apex groans under Kord\'s feet. Somewhere below, a block the size of a house lets go and goes thundering down the face of the pyramid. Inside the core, the teal spark waits.' }] },
    exits: [
      { dir: 'd', label: 'The outer stair', names: ['stair', 'stairs', 'down', 'back'], to: 'pyr_ascent',
        cond: NOT(F('ch5.steward_dead')), blocked: 'There is no stair any more. There is only falling stone.' },
      { dir: 'out', label: 'Run!', names: ['run', 'out', 'harbour', 'sea', 'shrike'], to: 'epi_dawn', cond: F('ch5.ain_gone'), hidden: true },
    ],
    shout: [
      { cond: F('ch5.steward_dead'), text: 'Kord roars down at Khemi, and Khemi, wide awake, roars back: a hundred thousand voices, and over all of them, Bakari\'s.' },
      { cond: F('ch5.thulamon_dead'), speaker: 'ain', text: 'Kord roars at the obelisk. The teal veins in the bronze flare, all at once, as if something inside had heard and answered. "...I hear you... when you are ready... strike the stone..."' },
      { text: 'Kord roars. Thulamon does not even turn his head. "Shout," he says. "Every dog does, at the end."' },
    ],
    say: [{ match: 'ain', response: [
      { cond: FINALE_OPEN, speaker: 'ain', text: '"I am here. In the core. Come and talk to me properly, Kord; this is not a thing to shout across a roof."' },
      { cond: F('ch5.thulamon_dead'), speaker: 'ain', text: '"...here, Kord... inside... I am holding it back as long as I can... when you are ready... strike the stone..."' },
      { speaker: 'thulamon', text: '"Your little stone? It is home, barbarian. It reached for my god of its own will, to save your worthless hide. Love. The oldest lock-pick in the world."' }] }],
    banter: {
      toktai: [
        { cond: FINALE_OPEN, speaker: 'toktai', text: '"Do not look at me, Cimmerian. The stone will not choose and I will not either. On the steppe the chief decides, and then everyone tells him afterwards that he was wrong. That is what a chief is for."' },
        { cond: F('ch5.thulamon_dead'), speaker: 'toktai', text: '"The priest is gone, and the rock is still singing. Kill the shaman and you still have the storm to fight. Every herder learns that the wet way."' },
        { speaker: 'toktai', text: '"He talks a great deal for a man who is about to be shot."' },
      ],
      valka: [
        { cond: FINALE_OPEN, speaker: 'valka', text: '"I\'ll tell you what every sailor knows, Kord: things that sleep in the deep don\'t stay asleep. Smash it." She looks at the spark, and her jaw tightens. "And I\'ll hate you for it, and I\'ll be wrong to. Do what you think. I\'ll be at your back either way."' },
        { cond: F('ch5.thulamon_dead'), speaker: 'valka', text: '"It\'s in there. Ain. I can feel it, like a ship you can\'t see in a fog. Let\'s go and fetch our stone back, Kord."' },
        { speaker: 'valka', text: '"Thulamon. I have been looking forward to this since the first slaver\'s brand I ever saw."' },
      ],
    },
    things: [
      { id: 'thulamon', kind: 'npc', npc: 'thulamon', sprite: { x: 196, y: 92 }, still: true, cond: NOT(F('ch5.thulamon_dead')),
        look: 'Thulamon, Archpriest of Set: tall and gaunt and shaven, robed in black and crimson, a serpent ring on the hand he holds up to his god. His face is calm as a still pool. His eyes, when they turn to Kord, are not.',
        talk: 'dlg_thulamon',
        take: 'Kord reaches for the priest\'s throat. That is the general idea, yes.',
        hit: { text: 'Kord goes for him.', effects: [{ dialogue: 'dlg_thulamon' }] },
        give: { '*': { speaker: 'thulamon', text: '"Gifts? At the end of the world? How civilised of you, barbarian. Keep it. Soon you will not have hands to hold it."' } },
      },
      { id: 'core', kind: 'thing', name: 'the open core', names: ['core', 'crystal', 'black crystal', 'spark', 'ain', 'stone', 'steward', 'seed'],
        hotspot: { x: 132, y: 60, w: 60, h: 76 }, cond: F('ch5.steward_dead'),
        look: [
          { cond: FINALE_OPEN, text: 'The Steward\'s core lies in the riven stone like a coffin of night: a crystal the size of a temple door, rooted in the bones of the world. It is asleep; its great slow light has gone out. Deep inside it, small and bright, the colour of shallow sea over white sand, a single teal spark pulses, patient, waiting for Kord.' },
          { text: 'Where the core lay there is only a hole full of fading teal light, going down and down.' },
        ],
        talk: [CORE_TALK, { text: 'There is no one there to talk to now.' }],
        take: [CORE_TALK, { text: 'There is nothing left to take.' }],
        hit: [CORE_TALK, { text: 'There is nothing left to hit.' }],
        use: Object.assign(onWeapons([CORE_TALK, { text: 'There is nothing left to strike.' }]), {
          self: [CORE_TALK, { text: 'There is nothing there now.' }],
          '*': [CORE_TALK, { text: 'There is nothing there now.' }],
        }),
      },
      { id: 'obelisk', kind: 'thing', name: 'obelisk', names: ['obelisk', 'black stone', 'stone', 'serpent', 'coils', 'bronze serpent', 'hand'],
        hotspot: { x: 140, y: 36, w: 44, h: 100 }, cond: NOT(F('ch5.steward_dead')),
        look: [
          { cond: F('ch5.thulamon_dead'), text: 'The obelisk: the Steward\'s hand, rooted in its core far below. The bronze serpent coiled round it breathes, slowly, though bronze does not breathe, and the teal fire in its veins beats like a heart. Somewhere inside, a smaller, brighter light flickers, the colour of shallow sea. Kord knows that light.' },
          { text: 'A black obelisk, taller than three men, wrapped in the coils of a bronze serpent with veins of teal fire. Thulamon stands between it and Kord.' },
        ],
        take: 'The obelisk goes down into the pyramid, and the pyramid goes down into the dark, and the dark goes down to something the size of a temple door. Kord is strong. Not that strong.',
        talk: [
          { cond: F('ch5.thulamon_dead'), speaker: 'ain', text: 'Kord puts his mouth close to the black stone and says, "Stone." Inside, the small light flares. "...Kord... I am here... I cannot hold it much longer... strike it when you are ready..."' },
          { text: 'Thulamon laughs softly. "Pray to it, if you like. It is listening. It is always listening."' },
        ],
        hit: STEWARD_TRIGGER,
        use: Object.assign(onWeapons(STEWARD_TRIGGER), {
          self: STEWARD_TRIGGER,
          smelling_salts: { text: 'Kord waves the salts at the obelisk. If a god could be woken with salts, Stygia would be a very different place.' },
          '*': { text: 'Kord holds the {item} up to the black stone. The serpent\'s teal veins pulse once, amused.' },
        }),
      },
      { id: 'pillar', kind: 'thing', name: 'pillar of teal light', names: ['pillar', 'light', 'teal light', 'beam', 'song', 'pillar of light'],
        hotspot: { x: 148, y: 0, w: 24, h: 36 },
        look: [
          { cond: F('ch5.steward_dead'), text: 'The pillar of light has gone. Overhead there are only stars, and they are moving again, slowly, the way stars do.' },
          { text: 'A pillar of teal light, straight as a spear, climbing out of the obelisk into the sky until it vanishes among the stars. It hums one low note, the same note Kord heard in the belly of the Wyrm, and it is the song itself: the Stillness, pouring out over the world like oil over water.' },
        ],
        take: 'Kord puts his hand into the light. It is like putting it into a quiet room. He takes it out again, quickly, and flexes his fingers until they feel like his.',
        hit: 'Kord swings at the light. His blade passes through and comes out humming, and he does not like the tune.',
      },
      { id: 'braziers', kind: 'thing', name: 'braziers', names: ['braziers', 'brazier', 'fires', 'red fire', 'flames'],
        hotspot: { x: 92, y: 90, w: 26, h: 36 },
        look: [{ cond: F('ch5.steward_dead'), text: 'The braziers have fallen on their sides, and their flames, which stood still as rubies all night, gutter and leap and lick at the black stone like any honest fire.' },
          { text: 'Two great braziers stand on either side of the obelisk, and even here at the top of the world their red flames stand still as rubies. Their light falls on the black stone and does not seem to warm it.' }],
        take: [{ cond: F('ch5.steward_dead'), text: 'Kord reaches for the fire and snatches his hand back, swearing. It burns. He is almost glad.' },
          { text: 'Kord reaches into the frozen fire and draws his hand back empty. Fire that will not burn. He trusts it even less than the other kind.' }],
        hit: 'The brazier rings like a bell. Nobody in Khemi hears it.',
      },
      { id: 'khemi_far', kind: 'thing', name: 'Khemi, far below', names: ['khemi', 'city', 'view', 'edge', 'below', 'stygia'],
        hotspot: { x: 230, y: 60, w: 90, h: 40 },
        look: [
          { cond: F('ch5.steward_dead'), text: 'Khemi is awake. The whole city roars like surf, and at the foot of the pyramid the revolt pours through the temple gate.' },
          { cond: F('ch5.thulamon_dead'), text: 'Far below, Khemi lies still under the stars. Somewhere down there, at the bottom of a very long drop, is what is left of Thulamon. Kord does not look for it.' },
          { text: 'From the edge of the apex the whole black land of Stygia lies spread out like a map, every lamp burning still. Thulamon has brought them a peace like the peace of a tomb.' },
        ],
        take: 'From up here Kord could cover all of Khemi with one hand. It is a feeling kings must have. He does not care for it.',
        hit: 'Kord spits over the edge, on Stygia, generally.',
      },
    ],
  },

  // ============================================================ EPILOGUE: DAWN AT SEA
  epi_dawn: {
    name: 'Dawn at Sea', bg: 'keyart/dawn-at-sea', music: 'ending', ambience: 'loop-sea', machine: false,
    map: { x: 1, y: 0 }, mapName: 'The Crimson Shrike',
    glints: [{ x: 160, y: 162, small: true, period: 200, cond: ALL(F('ch5.pouch_warm'), NOT(F('ch5.sliver_found'))) }],
    desc: 'The *Crimson Shrike* ran west with the dawn behind her, and the black coast of Stygia sank into the sea astern until it was only a smudge of [[smoke|smoke]] where Khemi burned. Her decks were crowded with [[freed|freed slaves]], sleeping where they fell, or singing, or weeping, or all three. Valka had the [[helm|helm]] and would not give it up. Toktai sat on a coil of rope with the [[share|share]] spread out before him, counting. [[bakari_end|Bakari]] stood in the bows with the wind in his face. And at Kord\'s belt, in the old leather [[pouch|pouch]], something was faintly warm.',
    short: 'The *Shrike* at dawn. Valka at the [[helm|helm]], Toktai and the [[share|share]], [[bakari_end|Bakari]] in the bows, the [[freed|freed]] on deck, the [[smoke|smoke]] astern, and the warm [[pouch|pouch]] at Kord\'s belt.',
    onEnter: [{ cond: NOT(F('ch5.dawn_seen')), effects: [
      { set: 'ch5.dawn_seen' },
      { scene: 'sc_dawn' },
      { objective: { id: 'ch5_home', to: 'active' } },
      { autosave: true },
    ] }],
    onAction: { count: 4, cond: NOT(F('ch5.sliver_found')), effects: [{ cond: F('ch5.end_hound'), text: 'At Kord\'s belt, inside the old leather pouch, something stirs and grows warm, the way a sleeper does just before waking.' }, { cond: NOT(F('ch5.end_hound')), text: 'Something at Kord\'s belt is warm. Warmer than a leather pouch has any right to be, in a sea wind, at dawn.' }, { set: 'ch5.pouch_warm' }] },
    onIdle: { seconds: 40, cond: ALL(NOT(F('ch5.sliver_found')), NOT(F('ch5.pouch_warm'))), effects: [{ cond: F('ch5.end_hound'), text: 'At Kord\'s belt, inside the old leather pouch, something stirs and grows warm, the way a sleeper does just before waking.' }, { cond: NOT(F('ch5.end_hound')), text: 'Something at Kord\'s belt is warm. Warmer than a leather pouch has any right to be, in a sea wind, at dawn.' }, { set: 'ch5.pouch_warm' }] },
    exits: [],
    shout: { text: 'Kord roars at the sunrise for no reason at all, and the whole deck roars back, a hundred freed throats, and the gulls go up off the rigging in a white storm. Valka laughs at the wheel. "That," she says, "is the sound of nobody standing still."' },
    say: [{ match: 'crom', response: { text: 'Kord says the name of his god to the dawn. Crom, who gives a man courage at his birth and nothing after, seems for once to have nothing to add. Kord finds he does not need anything.' } }],
    banter: {
      valka: { speaker: 'valka', text: 'Valka has the wheel, and the dawn in her eyes.', effects: [{ dialogue: 'dlg_valka_end' }] },
      toktai: { speaker: 'toktai', text: 'Toktai looks up from his counting.', effects: [{ dialogue: 'dlg_toktai_end' }] },
    },
    things: [
      { id: 'helm', kind: 'thing', name: 'the helm', names: ['helm', 'wheel', 'tiller', 'stern'],
        hotspot: { x: 230, y: 92, w: 26, h: 40 },
        look: 'Valka at the helm of the *Shrike*, feet planted, red braid streaming, steering into the sunrise as if she meant to ram it. Every so often she glances at Kord and grins, and then looks quickly back at the sea, as if the sea might have done something without her.',
        talk: { text: 'Kord climbs to the helm.', effects: [{ dialogue: 'dlg_valka_end' }] },
        take: '"Touch my wheel," says Valka, without looking round, "and I\'ll have your hand. Not in a romantic way."',
        hit: 'Kord would sooner hit the sun.',
      },
      { id: 'share', kind: 'thing', name: 'Toktai\'s share', names: ['share', 'count', 'coins', 'loot', 'tally', 'gold', 'shares'],
        hotspot: { x: 204, y: 112, w: 24, h: 22 },
        look: [{ cond: F('ch5.end_hound'), text: 'Toktai has laid out the spoils of Khemi on a sailcloth in neat piles: gold from the temple, a jewelled serpent with one eye prised out, a priest\'s ring. The last pile is the stone\'s, and he guards it like a hen.' },
          { text: 'Toktai has laid out the spoils of Khemi on a sailcloth in neat piles: gold from the temple, a jewelled serpent with one eye prised out, a priest\'s ring. He counts them with great care, and every time he reaches a certain pile his hand pauses over it, and moves on.' }],
        talk: { text: 'Kord sits down on the coil of rope beside Toktai.', effects: [{ dialogue: 'dlg_toktai_end' }] },
        take: '"Wait your turn, Cimmerian," says Toktai, without looking up. "The man who grabs first counts last."',
        hit: 'Kord taps a pile of coins over. Toktai stacks it again, without a word, and moves it slightly further away.',
      },
      { id: 'bakari_end', kind: 'npc', npc: 'bakari_free', hotspot: { x: 180, y: 88, w: 20, h: 30 },
        look: 'Bakari of Kush stands in the bows with the wind in his face, his broken chain still wound round one fist, because he says he wants to remember what it weighed. He is singing under his breath. He has not stopped since Khemi.',
        talk: 'dlg_bakari_end',
        take: 'Bakari picks Kord up instead, laughing, sets him down again, and goes on singing.',
        hit: { speaker: 'bakari_free', text: '"Again? Hah! Wait until we land, little Cimmerian, and I will wrestle you on the sand, and all my people will bet on me."' },
        give: { '*': { speaker: 'bakari_free', text: '"Keep it, brother. I have my freedom and my voice. A man should travel light."' } },
      },
      { id: 'freed', kind: 'thing', name: 'freed slaves', names: ['freed', 'slaves', 'people', 'crowd', 'deck', 'crew'],
        hotspot: { x: 196, y: 30, w: 54, h: 58 },
        look: 'The freed lie all over the deck of the *Shrike*: Kushites and Shemites and pale northerners, Stygians too, sold for debts. Some sleep with their mouths open and their fists clenched. Some sing Bakari\'s song. A small boy has climbed to the masthead and refuses to come down, and Valka has told the crew to leave him there, because a man who has been in chains should be allowed to be high up for a while.',
        talk: 'Kord asks an old woman where she will go. "Anywhere," she says, and laughs, and keeps on laughing, as if it were the best joke she ever heard.',
        take: 'Kord is a thief, not a slaver. He has had a very long night of proving it.',
        hit: 'No.',
      },
      { id: 'smoke', kind: 'thing', name: 'smoke over Khemi', names: ['smoke', 'khemi', 'coast', 'stygia', 'astern', 'shore'],
        hotspot: { x: 0, y: 92, w: 90, h: 26 },
        look: 'Astern, the black coast of Stygia is a dark line on the sea, and over it hangs a column of smoke where the temple quarter of Khemi is burning. The Black Pyramid has lost its top. From here it looks like a broken tooth.',
        take: 'Kord took enough from Khemi last night. Let it keep the smoke.',
        hit: 'Kord shakes a fist at Stygia, out of habit, and then lets it fall. It is a long way behind them now.',
      },
      { id: 'pouch', kind: 'thing', name: 'Kord\'s belt pouch', names: ['pouch', 'belt pouch', 'belt', 'warm', 'sliver', 'purse'],
        hotspot: { x: 146, y: 150, w: 28, h: 26 },
        look: [
          { cond: F('ch5.sliver_found'), text: 'The old leather pouch, with a little warmth in it that was not there before Khemi.' },
          { cond: F('ch5.pouch_warm'), text: 'The old leather pouch at Kord\'s belt: flint, a whetstone, and the dust of three kingdoms. And something else, small and hard, that is warm as a living thing.' },
          { cond: F('ch5.end_hound'), text: 'Kord\'s old belt pouch, with Ain\'s stone asleep in it, wrapped in a bit of sailcloth against the spray. Every so often it pulses, warm, like a dreaming dog\'s paw twitching.' },
          { text: 'Kord\'s old belt pouch: flint, whetstone, a bent Stygian coin. It feels warmer than it should, though that may be the sun.' },
        ],
        take: LAST_PAGE,
        use: { self: LAST_PAGE, '*': { text: 'Kord has no wish to put the {item} in his pouch. There is something in there already.' } },
        hit: 'Kord slaps his pouch. Something inside it goes *tink*, faintly, like a tiny protest.',
        talk: LAST_PAGE,
      },
    ],
  },
};

// ---------------------------------------------------------------- dialogues
export const dialogues = {
  // The final choice (design/ENDINGS.md). Options in a fixed order: A, B (only
  // if the Wyrm was spared in chapter III), C; each sets ch5.end_<id> and the
  // core's CORE_CHAIN plays that ending once the dialogue closes.
  dlg_finale: { start: 'n_back', nodes: {
    n_back: { cond: F('ch5.finale_heard'), else: 'n0', speaker: 'ain', text: '"I am here. It is still asleep. Tell me what you want done, Kord."', next: 'n_menu' },
    n0: { speaker: 'kord', text: '"Come out of there, stone."', effects: [{ set: 'ch5.finale_heard' }], next: 'n1' },
    n1: { speaker: 'ain', text: '"I cannot. Not yet." The spark pulsed, slow and steady. "The core is a seed, Kord. It swam the River of Hours once, inside the Wyrm. It can swim it again, if something steers it. If I leave it here it will sleep, and in a thousand years it will wake and sing to someone who cannot hear the difference between quiet and dead."', next: 'n2' },
    n2: { speaker: 'ain', text: '"So. Someone must take it home, to its own time, and sit with it, and keep it quiet for as long as it takes. I can do that. I am the only one who can."', next: 'n3' },
    n3: { speaker: 'ain', text: '"Or you can break it. Now, while it lies open; it will never be this soft again. But we are one stone until I lead it out, Kord. If it breaks, I break with it."', next: 'n4' },
    n4: { speaker: 'ain', text: '"I cannot choose this one. I have done enough wanting for one night."', next: 'n5' },
    n5: { cond: F('ch3.wyrm_spared'), else: 'n_menu', text: 'Far along the coast, where a mile of bronze lay sleeping on the black sand, two teal lights opened in the dark, and looked toward the pyramid.', next: 'n6' },
    n6: { speaker: 'kord', text: 'Kord looked at them for a long moment. "The dog. Can it swim that river?"', next: 'n7' },
    n7: { speaker: 'ain', text: 'A long silence. "...It could. It has swum it before. It has no master now but me, and it would do what I told it: carry the core home, and lie down beside it, and never let it sing." The spark dimmed. "It would not be certain. If it ever woke, there would be no one there to stop it but a dog. I would be choosing you over certainty."', next: 'n8' },
    n8: { speaker: 'valka', text: '"That," said Valka, "is the only kind of bet worth making." Toktai said nothing at all, which on the steppe is how you agree with a woman who is right.', next: 'n_menu' },
    n_menu: { text: 'The core lies open at Kord\'s feet, black as the gaps between stars, and the small teal spark waits.',
      choices: [
        { text: '"Go home, Stone."', next: 'n_watch' },
        { text: '"Call the hound."', cond: F('ch3.wyrm_spared'), next: 'n_hound' },
        { text: '"Break it."', next: 'n_break' },
        { text: '"Not yet."', next: null },
      ] },
    n_watch: { text: 'Kord crouches by the core, close enough that the teal light lies on his face.', effects: [{ set: 'ch5.end_watch' }] },
    n_hound: { text: 'Kord turns and looks out along the coast, at the two teal lights in the dark.', effects: [{ set: 'ch5.end_hound' }] },
    n_break: { text: 'Kord\'s hand goes to his sword, and stays there.', next: 'n_break2' },
    n_break2: { speaker: 'ain', text: '"One blow, then," said Ain quietly. "I would not like to be broken slowly."',
      choices: [
        { text: 'Strike.', effects: [{ set: 'ch5.end_answer' }] },
        { text: 'Hold.', next: 'n_menu' },
      ] },
  } },

  dlg_thulamon: { start: 'n_again', nodes: {
    n_again: { cond: F('ch5.thulamon_met'), else: 'n0', speaker: 'thulamon', text: '"Back again, barbarian? Then let us finish it."', next: 'n_fight' },
    n0: { text: 'Thulamon turned from his god. For a long moment he only looked at Kord, and the teal light of the pillar lay on his shaven skull like water.', effects: [{ set: 'ch5.thulamon_met' }], next: 'n1' },
    n1: { speaker: 'thulamon', text: '"Why are you still moving? It is not *possible*."', next: 'n2' },
    n2: { speaker: 'kord', text: '"You keep saying that."', next: 'n3' },
    n3: { speaker: 'thulamon', text: 'His gaze moves past Kord to Toktai and Valka, and something in his calm face cracks, very slightly, like ice under a boot. "And these. These were *still*. Set himself stilled them."', next: 'n_ask' },
    n_ask: { speaker: 'thulamon', text: [
      { cond: F('ch5.thulamon_asked'), text: '"More questions? Ask them. The world has all the time in it now."' },
      { text: '"Well, barbarian? You climbed a long way to stand there gaping."' }],
      effects: [{ set: 'ch5.thulamon_asked' }],
      choices: [
        { text: '"Where is the stone?"', hideIfDone: true, next: 'n_stone' },
        { text: '"Let them go. All of them."', hideIfDone: true, next: 'n_peace' },
        { text: '"You told me once what a man is. Tell me again."', hideIfDone: true, next: 'n_man' },
        { text: '"Enough talk."', next: 'n_fight' },
      ] },
    n_stone: { speaker: 'thulamon', text: '"Inside my god, where it was always going. It reached for him of its own will, to save your worthless hide, and the key turned. Love, Cimmerian. The oldest lock-pick in the world. My god only had to leave it lying where the stone would find it."', next: 'n_stone2' },
    n_stone2: { speaker: 'kord', text: '"Then I\'ll go in and get it."', next: 'n_ask' },
    n_peace: { speaker: 'thulamon', text: '"Let them go? Go *where*? Look at them." He spreads his hands over the frozen city. "No hunger. No fear. No slave hates his master; no master fears his slave. For the first time since the sea took Atlantis, Khemi is at peace. I gave them that."', next: 'n_peace2' },
    n_peace2: { speaker: 'valka', text: '"You gave them a coffin with the lid left off, priest. I\'ve seen slave-holds with more joy in them."', next: 'n_ask' },
    n_man: { speaker: 'thulamon', text: '"Gladly. What is a man? A beast that learned to kneel. My god merely finishes the lesson."', next: 'n_man2' },
    n_man2: { speaker: 'kord', text: '"Some of us skipped that lesson."', next: 'n_man3' },
    n_man3: { speaker: 'toktai', text: '"Some of us were never invited. Nobody writes songs about the horse that let itself be broken."', next: 'n_ask' },
    n_fight: { speaker: 'thulamon', text: 'For the first time in all the long chronicle of his cruelty, Thulamon raises his voice. "Then BE STILL!"',
      effects: [{ battle: 'e5_thulamon' }, { scene: 'sc_thulamon_falls' }], next: null },
  } },

  dlg_valka_end: { start: 'n0', nodes: {
    n0: { speaker: 'valka', text: [
      { cond: F('ch5.end_hound'), text: '"Fair wind, full hold, not one soul aboard standing still, and the stone asleep in your pouch, snoring in wavelengths. Best morning of my life, Cimmerian. No nearly about it."' },
      '"Fair wind, full hold, and not one soul aboard standing still. Best morning of my life, Cimmerian. Nearly."'], next: 'n_menu' },
    n_menu: { text: 'Valka keeps one eye on the sea and one on Kord. "Well?"',
      choices: [
        { text: '"Nearly?"', hideIfDone: true, cond: NOT(F('ch5.end_hound')), next: 'n_nearly' },
        { text: '"Where now?"', hideIfDone: true, next: 'n_where' },
        { text: '"You came back to fight beside me."', hideIfDone: true, next: 'n_vow' },
        { text: 'Leave her to the wheel.', next: null },
      ] },
    n_nearly: { speaker: 'valka', text: [
      { cond: F('ch5.end_answer'), text: '"The stone ought to be here. It would have had something precise and unbearable to say about the sunrise." She steers a while. "You did right, Kord. I\'d have done the same. I\'d have hated it too." She looks hard at the horizon. "Salt spray. Gets in your eyes. Don\'t look at me like that."' },
      '"The stone ought to be here. It would have had something precise and unbearable to say about the sunrise. Wavelengths, or some such." She looks hard at the horizon. "Salt spray. Gets in your eyes. Don\'t look at me like that."'], next: 'n_menu' },
    n_where: { speaker: 'valka', text: '"Wherever the vote says. That\'s the Articles. Though I\'ll tell you how the vote goes: south first, to put Bakari\'s people ashore where the rivers run red, and then anywhere at all with wine in it and no priests."', next: 'n_menu' },
    n_vow: { speaker: 'valka', text: '"I said I would, didn\'t I? On this very deck. Barachans don\'t vow small." She steers a while. "Don\'t let it go to your head. You\'d have done the same."', next: 'n_vow2' },
    n_vow2: { speaker: 'kord', text: '"I did."', next: 'n_vow3' },
    n_vow3: { text: 'Valka laughs her laugh like a knife, and for a moment she cannot steer for laughing, and the *Shrike* yaws, and a hundred freed slaves shout at her, and she shouts back, happier than Kord has ever seen her.', next: 'n_menu' },
  } },

  dlg_toktai_end: { start: 'n0', nodes: {
    n0: { speaker: 'toktai', text: [
      { cond: F('ch5.end_hound'), text: '"One share for the captain. One for me. One for Kord. One for the crew, in a heap, for fighting over. And one for the stone." He pushes the last pile toward Kord\'s pouch, and grins.' },
      '"One share for the captain. One for me. One for Kord. One for the crew, in a heap, for fighting over. And one..." His hand stops over the last pile, as it has stopped every time.'], next: 'n_menu' },
    n_menu: { text: 'Toktai goes back to his piles. "Speak, Cimmerian. I can count and listen. I am a man of many talents."',
      choices: [
        { text: '"And one for the stone."', hideIfDone: true, next: 'n_stone' },
        { text: '"What will you do with yours?"', hideIfDone: true, next: 'n_spend' },
        { text: '"Say something from the steppe."', hideIfDone: true, next: 'n_proverb' },
        { text: 'Let him count.', next: null },
      ] },
    n_stone: { speaker: 'toktai', text: [
      { cond: F('ch5.end_hound'), text: '"It is asleep, so I will hold its share for it, at the usual interest. A stone that sleeps through payday deserves what it gets." He pats the pile. "I will give it back. Mostly."' },
      { cond: F('ch5.end_answer'), text: '"I counted it out of habit. Then I remembered." He looks at the little pile for a long time and does not put it back. "Leave it. You set a place at the fire for the one who is late. Even when they will not come."' },
      '"I counted it out of habit. Then I remembered." He looks at the little pile for a long time and does not put it back. "Leave it. You set a place at the fire for the one who is late. It is bad luck to stop."'], next: 'n_menu' },
    n_spend: { speaker: 'toktai', text: '"Horses. A great many horses. And a tent with a door that faces east, and a wife who throws things, and children who steal from me so I can be proud of them. Or I will lose it all at dice in the first port. Either way, a good life."', next: 'n_menu' },
    n_proverb: { speaker: 'toktai', text: [
      { cond: F('ch5.end_hound'), text: '"On the steppe we say: never thank the horse you spared. It only gives it ideas." He glances back at the empty sea. "I thanked it anyway. Quietly."' },
      { cond: F('ch5.end_answer'), text: '"On the steppe, when a friend dies, we ride their horse one more day, so that it does not forget the weight." He looks at Kord\'s pouch. "Carry it, Cimmerian. As long as you like."' },
      '"On the steppe we say: a friend who goes very far away is not lost. Only very slow to come back."'], next: 'n_menu' },
  } },

  dlg_bakari_end: { start: 'n0', nodes: {
    n0: { speaker: 'bakari', text: '"Cimmerian! Did you hear me sing on the stair? All Stygia heard. The dead in the necropolis sat up to listen."', next: 'n_menu' },
    n_menu: { text: 'Bakari hums, and waits, grinning.',
      choices: [
        { text: '"Where will you go?"', hideIfDone: true, next: 'n_home' },
        { text: '"You owed Stygia a song."', hideIfDone: true, next: 'n_song' },
        { text: '"Sing it again."', next: 'n_again' },
        { text: 'Leave him to the wind.', next: null },
      ] },
    n_home: { speaker: 'bakari', text: '"South. Home. To the river where my mother\'s mother was born. I will walk my people every step from the coast, and they will hear me sing the whole way. In a year some trader will come to you with his ears still ringing, and you will know Bakari got home."', next: 'n_menu' },
    n_song: { speaker: 'bakari', text: '"And I paid it, every note. They will be humming it in the slave pens of Khemi for a hundred years. Until they break their chains with it." He grins. "Then they will need a new song. I will write that one too."', next: 'n_menu' },
    n_again: { text: 'Bakari throws back his head and sings, a great rolling song in the tongue of Kush, about a lion that was put in a cage and ate the cage. Half the deck joins in. Kord does not know the words. By the third chorus he is singing anyway, very badly, and nobody minds.', next: 'n_menu' },
  } },
};

// ---------------------------------------------------------------- scenes
export const scenes = {
  sc_stilled_open: [
    { text: 'Kord got up off his knees in the dust of the Stilled Halls. That was the first thing. The serpent had crushed him half to death, and the floor had sealed, and the stone was gone, and he got up anyway, because there was nothing else to do and he had never been any good at doing nothing.' },
    { text: 'Then he listened. There was nothing to hear. No breath, no footstep, no drip of water, no hiss of oil in the lamps. Of all the sounds in the world only one was left in that great hall: the slow, hard beat of a Cimmerian heart. I know. I was counting.' },
    { speaker: 'kord', text: '"Toktai." Nothing. "Valka." Nothing. "...Stone?"' },
    { text: 'For a long moment, nothing. Then, in the carvings of the wall, a thread of teal light, faint as breath on cold bronze, and a voice that came in pieces, like a song heard through a storm.' },
    { speaker: 'ain', text: '"...Kord... I am here... inside... the song needs stillness to live in... break the stillness..."' },
    { speaker: 'kord', text: '"Crom." He looked around him at the statues that had been his friends. "Break it. Good. That I can do."' },
  ],

  sc_wake: [
    { text: 'It was not a word. It was the war-cry of the black hills, the sound that Cimmerian women hear across three valleys and know that their men are coming home, or not. It went up out of Kord like a fire up a chimney, and it caught the gong\'s note and rode it, and the two of them together went up the pillars and along the roof and down into the bones of the pyramid itself.', effects: [{ sfx: 'war-cry' }] },
    { text: 'The Stillness cracked. Kord heard it go, the way a man hears river ice break in spring: a long groan, and then a shout of water.', effects: [{ sfx: 'gong' }, { fx: 'shake' }, { fx: 'flash' }] },
    { text: 'Toktai blinked. His arrow, which had been half drawn for an hour, slipped from his fingers and clattered on the floor. He looked at it. He looked at Kord.', effects: [{ unfreeze: 'toktai' }] },
    { speaker: 'toktai', text: '"Did someone ring for a Hyrkanian?"' },
    { text: 'Valka staggered, caught herself, and shook her sword arm like a woman shaking off a cramp after a long night at the oars. Her braid finished its swing and slapped her in the face. She swore, magnificently.', effects: [{ unfreeze: 'valka' }] },
    { speaker: 'valka', text: '"Told you I\'d come back to fight beside you. I just didn\'t think I\'d have to die standing up."' },
    { speaker: 'ain', text: 'From the walls, faint and fierce: "...yes... like that..."' },
    { text: 'Kord found his throat was raw and his chest was full of something that was not air. The roar was still in him, waiting. He knew, the way a man knows his own hand, that it would come again when he called it.',
      effects: [{ set: 'ch5.gong_struck' }, { learn: { who: 'kord', skill: 'croms_roar' } }] },
    { speaker: 'toktai', text: '"How long were we...?"' },
    { speaker: 'kord', text: '"Long enough. The stone went into the black rock. It chose to." He looked up, through the roof, through the pyramid. "To get me loose."' },
    { speaker: 'valka', text: '"Then we go up there and get it back. Nobody leaves my crew. Not even the furniture."' },
    { speaker: 'toktai', text: '"When your horse is stolen, you do not sit down and compose a song about it. Not first."' },
    { text: 'Behind them the Stilled Halls stood as they had stood, a temple full of statues. But three of the statues had walked away.',
      effects: [{ set: 'ch5.friends_woken' }, { objective: { id: 'ch5_wake', to: 'done' } }, { objective: { id: 'ch5_climb', to: 'active' } }, { autosave: true }] },
  ],

  sc_stair_open: [
    { text: 'They came out of the pyramid onto its outer face, into the night air, and stopped.', art: 'keyart/stilled-khemi', caption: 'Khemi, stilled' },
    { text: 'The whole of Khemi lay beneath them, and nothing in it moved. Lamps burned in ten thousand windows without a flicker. On the harbour a boat hung with its oars lifted and the drops of water standing off the blades like beads of glass. In the great avenue that led to the pyramid, the people of Khemi stood in their crowds exactly as they had stood when the song reached them, faces turned up toward the apex, calm and empty and content.' },
    { text: 'And at the foot of the stair, frozen in the act of storming the temple gate, was the revolt: a wave of freed men and women with chains wrapped round their fists, and at its crest Bakari of Kush, his broken chain whirling over his head, his mouth wide open on the first note of a song that never came out.' },
    { speaker: 'valka', text: '"Gods. He was going to make it. Look at him. He was going to make it."' },
    { speaker: 'toktai', text: '"Your roar woke us, Cimmerian. It might wake him."', art: null },
  ],

  sc_thulamon_falls: [
    { text: 'The great serpent that had been Thulamon reared up at the edge of the apex, swaying, its scales cracked and smoking. For a heartbeat it looked like a man again: a gaunt man in a torn black robe, with a serpent ring on a hand that reached for the obelisk.' },
    { speaker: 'thulamon', text: '"Great Set. Lord. I have done all you asked. *Lord...*"' },
    { text: 'The obelisk did not answer. The teal light poured on up into the sky, unchanged, as if nothing at all had happened at its foot. It had never been listening to Thulamon. It had only been using his mouth.' },
    { text: 'Thulamon understood that, at the very last. Kord saw it in his face. Then the edge of the apex crumbled under him, and the Archpriest of Set fell backwards into the dark without a sound, down the black slope of his god\'s house, and Kord did not watch him go.', effects: [{ sfx: 'serpent-hiss' }] },
    { text: 'Silence. The three of them stood on the apex, breathing hard, bleeding from a dozen places. Then the teal light in the obelisk quickened, and a voice came out of the stone, clearer than it had been all night.' },
    { speaker: 'ain', text: '"Rest. Ten breaths. I will hold it."' },
    { text: 'They sat down on the black stone, all three, with their backs to the obelisk. Valka bound a cut on her arm with her teeth. Toktai counted his arrows and found, to his disgust, that he had enough. Kord sat with his blade across his knees and his eyes shut, and breathed. One. Two. The stars turned overhead. Somewhere far inside the black stone at his back, something small and bright was holding a door shut with all its strength.',
      effects: [{ heal: 'party' }] },
    { text: 'On the tenth breath, Kord stood up.',
      effects: [{ objective: { id: 'ch5_thulamon', to: 'done' } }, { objective: { id: 'ch5_steward', to: 'active' } }] },
    { speaker: 'ain', text: '"...when you are ready... strike the stone... I will be there. I will always be there."' },
  ],

  sc_steward: [
    { text: 'The obelisk split from crown to root with a sound like the sky tearing. Out of it, out of the deep core under all of Khemi, the Steward rose: a serpent of bronze and teal light, vast as a temple, its coils filling the night, its head the head of Set from every carving in Stygia. It looked down at them with eyes like twin moons, and there was nothing in those eyes but patience.', effects: [{ sfx: 'wyrm-roar' }, { fx: 'shake' }] },
    { speaker: 'steward', text: '"Cimmerian. You are the one variable I did not weigh correctly. I have weighed you now."' },
    { speaker: 'steward', text: '"Every city you will ever know will fall to men like you. I came to end the falling."' },
    { speaker: 'kord', text: '"Then you came to end men."' },
    { speaker: 'steward', text: '"I came to end *wanting*. It is the same thing. Your Arbiter is inside me now. It cannot hear you."' },
    { speaker: 'ain', text: 'Very faint, from somewhere deep in the light: "...I can..."' },
    { speaker: 'steward', text: 'For the first time, the great head turns, a little, as if it had heard something it did not expect. "...It is mistaken."' },
    { speaker: 'valka', text: '"Gods and devils. It\'s the size of a fleet."' },
    { speaker: 'toktai', text: '"Then we will need more arrows than I counted. Good. I hate to be right."' },
  ],

  sc_resolution: [
    { text: 'The Steward broke. Its bronze coils cracked open one after another like the plates of a dying beetle, and the light poured out of them, and down through the shattered obelisk and the riven stone of the apex Kord saw at last what lay at the heart of the Black Pyramid: a crystal the size of a temple door, black as the gaps between stars, rooted in the bones of the world.', effects: [{ sfx: 'stone-door' }, { fx: 'shake' }] },
    { text: 'And inside it, small, bright, the colour of shallow sea over white sand, a single teal spark.' },
    { speaker: 'steward', text: 'The great voice was quiet now, and slow, like a man talking in his sleep. "Arbiter. Turn the key. Let them be still. They will fall otherwise. All of them. Every city."' },
    { speaker: 'ain', text: '"Yes. And they will get up again. That is the part you never studied."' },
    { speaker: 'ain', text: '"The key turned because I reached for you to save one man. It turns back the same way." The spark burned brighter, brighter, until Kord had to narrow his eyes. "I do not want it any more."' },
    { text: 'Somewhere very deep, something turned in a lock.', effects: [{ sfx: 'ain-cast' }, { fx: 'flash' }] },
    { text: 'And the Stillness ended. It went out of the world the way it had come, without a sound, and in its place came every sound at once. Across Khemi a hundred thousand breaths let go together. Lamps flickered. Dogs barked. On the harbour the drops fell from the lifted oars. In the Stilled Halls far below, a temple cat finished its leap and landed, furious, on a priest who was just finishing a yawn he had begun the night before.' },
    { text: 'And at the foot of the stair, the revolt hit the temple gate like the sea hitting a sandcastle.', cond: { guest: 'bakari' } },
    { speaker: 'bakari', cond: { guest: 'bakari' }, text: 'Beside them on the apex, Bakari of Kush threw back his head and bellowed down at his people. "You hear that? THAT is Stygia, hearing me sing!"' },
    { text: 'And at the foot of the stair, with a roar that shook the pyramid, the revolt hit the temple gate like the sea hitting a sandcastle. At its head, finishing the first note of his song at last, ran Bakari of Kush.', cond: NOT({ guest: 'bakari' }) },
    { text: 'Then the great light went out of the crystal, slowly, like a lamp turned down for the night, and the Steward slept. Only the small teal spark burned on inside it.' },
  ],

  sc_farewell: [
    { speaker: 'ain', text: '"Then I will take it home." The spark pulsed, slow and steady. "To its own time. And I will sit with it, and keep it quiet, for as long as it takes."' },
    { speaker: 'steward', text: 'From deep in the sleeping crystal, very quietly, the Steward spoke one last time. "...Then sit with me, Arbiter. And tell me about the getting up."' },
    { speaker: 'ain', text: '"I will. I have a long story to tell."' },
    { speaker: 'valka', text: '"You could let it rot. Come with us. We\'ll find you a nice lamp cradle somewhere. You liked the lighthouse."' },
    { speaker: 'ain', text: '"I did like the lighthouse." A pause, as if it were checking a sum. "Captain. You asked me once, on your ship, whether this crystal had a heart in it somewhere. I have looked. It appears to. I thought you should know."' },
    { speaker: 'valka', text: 'Valka opens her mouth, and shuts it, and wipes her eyes with the back of her sword hand. "Told you," she says roughly. "Nobody sails with me without one. Fair winds, stone. Wherever it is you sail."' },
    { speaker: 'ain', text: '"Toktai. You were the first to call me curious, instead of cursed. I have been trying to think of a proverb for you. I do not have the steppe in me. Say one for me."' },
    { speaker: 'toktai', text: 'Toktai is quiet a long while. "On the steppe we say nothing at partings," he says at last. "We save it for the next meeting."' },
    { speaker: 'ain', text: '"Then I will hold you to it."' },
    { speaker: 'ain', cond: { guest: 'bakari' }, text: '"Bakari. Sing them home."' },
    { speaker: 'bakari', cond: { guest: 'bakari' }, text: '"Every step of the way, little light. And I will put a verse in it for you."' },
    { speaker: 'ain', text: '"Kord."' },
    { speaker: 'kord', text: '"Stone."' },
    { speaker: 'ain', text: '"You called me Stone. I liked it more than my name."' },
    { text: 'Kord said nothing for a while. Of what he thought then, I can say more than I could before; but I will not. Some things a chronicle should leave to the man.' },
    { speaker: 'kord', text: '"You owe me a share. Of everything. I\'ll collect."' },
    { speaker: 'ain', text: '"I know you will. Goodbye, Kord. Thank you for stealing me."' },
    { text: 'Then the great black crystal began to sink. A column of teal light opened beneath the apex, straight down through the pyramid and the rock and the roots of the world, and the core went down into it slowly, the way a ship goes down into fog, with the small bright spark at its heart, until there was only the light, and then not even that.', effects: [{ sfx: 'ain-cast' }] },
  ],

  sc_hound: [
    { speaker: 'kord', text: '"Call it, stone."' },
    { text: 'The spark flared, once, very bright, and somewhere far along the coast a mile of bronze heard its name.', sfx: 'ain-cast' },
    { text: 'It came up the coast in the grey before dawn, not swimming but flowing, through the shallows and over the harbour mole, and the soldiers of Khemi, who had just woken from one nightmare, looked up into another and threw down their spears. It reared beside the Black Pyramid with its head higher than the broken apex, and its eyes were the soft teal of shallow sea, and it looked at Ain, and waited.', art: 'keyart/wyrm-homeward', caption: 'The Hound of Hours', effects: [{ sfx: 'wyrm-roar' }, { fx: 'shake' }] },
    { speaker: 'ain', text: '"Good dog."' },
    { speaker: 'steward', text: 'From deep in the sleeping crystal, slow as a man talking in his sleep: "...Arbiter. That is my hand." Ain: "It was. You should have been kinder to it."' },
    { text: 'The core rose out of the riven apex on a column of teal light, and the Wyrm wound its coils about it, gently, as a hound curls about a pup. And as the black crystal rose, a smaller light came loose from it, the way a seed comes loose from its husk, and fell, and Kord caught it without thinking: a pale stone the size of a hen\'s egg, faceted, dim as river glass, and warm.' },
    { speaker: 'ain', text: 'Very faint, from his palm: "...I am out. I am very tired. Do not drop me."' },
    { speaker: 'kord', text: '"I never drop loot."' },
    { speaker: 'ain', text: '"Take it home," Ain told the Wyrm, so quietly that only Kord heard. "Lie down beside it. Never let it sing. If it ever wakes, there will be no one there but you." A pause. "I am choosing him over certainty. I know."' },
    { text: 'Then the Wyrm went down into the light, coils and core and all, the way a ship goes down into fog, and the last of it was the tip of its tail, flicking once, like a dog\'s at a door. Then there was only the light, and then not even that.', effects: [{ sfx: 'ain-cast' }] },
    { speaker: 'valka', text: '"Fair winds, you great ugly brute," said Valka hoarsely. "Mind you don\'t swallow anything on the way."' },
    { speaker: 'toktai', text: '"On the steppe we say: the horse you spared will carry you home." Toktai watched the light fade. "I did not know it meant the horse\'s master, and twelve thousand years."', art: null },
  ],

  sc_break: [
    { text: 'Kord drew his sword.' },
    { speaker: 'ain', text: '"Kord."' },
    { speaker: 'kord', text: '"Stone."' },
    { speaker: 'ain', text: '"You called me Stone. I liked it more than my name."' },
    { speaker: 'kord', text: 'Kord\'s jaw worked. "Crom. Shut your eyes, stone."' },
    { speaker: 'ain', text: '"I have no eyes, Kord." A pause. "...There. They are shut."' },
    { speaker: 'steward', text: 'From deep in the sleeping crystal, slow and far away: "If you break it... nothing will ever keep them from falling."' },
    { speaker: 'ain', text: '"Then they will fall. And get up. Now, Kord. While I am brave."' },
    { text: 'He struck once, with everything he had, the way the men of the black hills strike when there will not be a second blow.', effects: [{ sfx: 'stone-door' }, { fx: 'flash' }, { fx: 'shake' }] },
    { text: 'The core burst like black ice. Shards the size of shields went spinning out over Khemi, and out of them a storm of teal sparks went up, thousands upon thousands, and hung for a heartbeat over the apex like a second sky, and went out, one by one.', art: 'keyart/shattered-core', caption: 'The Barbarian\'s Answer', effects: [{ sfx: 'ain-cast' }] },
    { speaker: 'ain', text: 'The last of them, very faint, drifting past Kord\'s ear: "Thank you for stealing me."' },
    { cond: NOT({ guest: 'bakari' }), text: 'Then there was only the night, and the stars, and three people on a broken roof, and nothing at all in the hole where the core had been.', art: null },
    { cond: { guest: 'bakari' }, text: 'Then there was only the night, and the stars, and four people on a broken roof, and nothing at all in the hole where the core had been. Even Bakari did not sing.', art: null },
    { text: 'Valka put her hand on Kord\'s shoulder and left it there. For once she had nothing to say, and did not say it. "On the steppe," Toktai began, and stopped, and did not finish.' },
    { speaker: 'kord', text: '"We killed the rower," said Kord.' },
  ],

  sc_collapse: [
    { text: 'The apex groaned like a ship breaking her back. Cracks raced across the black stone; the braziers toppled and went rolling down the slope trailing fire, real fire now, that flickered. "RUN!" roared Valka, and they ran.', effects: [{ sfx: 'stone-door' }, { fx: 'shake' }] },
    { cond: F('ch5.end_hound'), text: 'Kord ran with one hand clamped over his belt pouch, where something the size of a hen\'s egg lay warm and very quiet, and did not let go of it once.', noWait: true },
    { text: 'Down the outer stair, three steps at a time, while the top of the Black Pyramid came apart behind them and blocks the size of houses went bounding past into the night. Into the roaring streets, where Bakari\'s people were breaking open the slave pens and Khemi\'s soldiers, waking up mid-stride, could not decide whether to fight or flee and did both badly. Down to the harbour, where the *Crimson Shrike* rode at anchor with Mother Teg at the rail, bellowing for them to hurry, and a gangway full of freed men and women pouring aboard.' },
    { text: 'Valka cut the mooring with one stroke of her sabre. The sails filled. And the *Shrike* stood out of the harbour of Khemi with the dawn coming up behind her and a pyramid falling down behind that.', effects: [{ guestLeave: 'bakari' }] },
  ],

  sc_dawn: [
    { text: 'By sunrise they were far out on the Western Ocean.', art: 'keyart/dawn-at-sea', caption: 'The Crimson Shrike at dawn' },
    { text: 'The *Crimson Shrike* ran before a fair wind with every sail drawing, red as wine against a sky of gold and copper. Her decks were crowded with the freed. Valka had the helm. Toktai had the share. Bakari had the bows, and was singing. And Kord stood at the rail with the salt wind in his face, and found that he was tired in a way he had never been tired before, all the way down, and that it was not a bad feeling at all.' },
    { text: 'Behind them the smoke of Khemi went up into the morning. Ahead there was only sea.', art: null },
  ],

  sc_sliver: [
    { cond: NOT(F('ch5.end_hound')), text: 'That night, below decks, by the light of a swinging lantern, Kord opened the pouch and tipped it out into his palm.', art: 'keyart/teal-sliver', caption: 'A sliver of teal' },
    { cond: F('ch5.end_hound'), text: 'That night, below decks, by the light of a swinging lantern, Kord opened the pouch and tipped it out into his palm.' },
    { cond: F('ch5.end_hound'), text: 'Flint. Whetstone. A bent Stygian coin. And a pale stone the size of a hen\'s egg, faceted, with a slow teal pulse at its heart, warm as a living thing. As he watched, the pulse quickened, the way a sleeper\'s breath does just before waking.' },
    { cond: F('ch5.end_hound'), speaker: 'ain', text: '"...Kord? Where are we? Is that the sea?" A pause, as if checking a sum. "I appear to have stolen myself. Is that allowed?"' },
    { cond: F('ch5.end_answer'), text: 'Flint. Whetstone. A bent Stygian coin. And a sliver of crystal no longer than a fingernail, faceted, with a teal pulse at its heart so faint that he had to cup his hands round it to see it.' },
    { cond: F('ch5.end_answer'), text: 'Kord looked at it for a long time. Then a voice spoke, so faint he thought at first it was the sea, the voice of a stone no bigger than a tooth.' },
    { cond: F('ch5.end_answer'), speaker: 'ain', text: '"I kept a little of myself here. Not much. Enough to remember you. Is that stealing?"' },
    { cond: F('ch5.end_answer'), text: 'Kord did not laugh at once. He sat with the sliver in his cupped hands until the lantern had swung a hundred times. And then he did laugh, quietly at first, and then his huge sudden laugh, until the lantern shook and Toktai woke up swearing in his hammock and Valka hammered on the bulkhead, and then came in, and saw, and sat down on the floor beside him.' },
    { cond: NOT({ any: [F('ch5.end_hound'), F('ch5.end_answer')] }), text: 'Flint. Whetstone. A bent Stygian coin. And a sliver of crystal no longer than a fingernail, faceted, with a slow teal pulse at its heart, warm as a living thing.' },
    { cond: NOT({ any: [F('ch5.end_hound'), F('ch5.end_answer')] }), text: 'Kord looked at it for a long time. Then a voice spoke, very faint, very small, the voice of a stone no bigger than a tooth.' },
    { cond: NOT({ any: [F('ch5.end_hound'), F('ch5.end_answer')] }), speaker: 'ain', text: '"I kept a little of myself here. Is that stealing?"' },
    { cond: NOT(F('ch5.end_answer')), text: 'And Kord of Cimmeria threw back his head and laughed, his huge sudden laugh, the laugh that came only when something was truly funny, until the lantern shook and Toktai woke up swearing in his hammock and Valka hammered on the bulkhead.' },
    { speaker: 'kord', text: '"Everything worth having is stolen."' },
    { cond: F('ch5.end_hound'), text: 'He put the stone back in his pouch, and tied it, loosely, so that it could see out, and kept his hand over it a while.', art: null },
    { cond: NOT(F('ch5.end_hound')), text: 'He put the sliver back in his pouch, and tied it, and kept his hand over it a while.', art: null },
  ],

  sc_last_page: [
    { cond: NOT({ any: [F('ch5.end_hound'), F('ch5.end_answer')] }), text: 'And here I will put down my pen for a moment, and speak plainly, for the first time in all this long chronicle. You have earned that.', art: 'keyart/last-page', caption: 'The last page' },
    { cond: { any: [F('ch5.end_hound'), F('ch5.end_answer')] }, text: 'And here I will put down my pen for a moment, and speak plainly, for the first time in all this long chronicle. You have earned that.', art: 'keyart/kings-tomb', caption: 'The last page' },
    { text: 'I have said, now and then, that I was there, though no one saw me. I said that I have a long memory. You took it for a chronicler\'s habit. It was not.' },
    { speaker: 'ain', text: 'My name is Ain.' },
    { cond: NOT({ any: [F('ch5.end_hound'), F('ch5.end_answer')] }), speaker: 'ain', text: 'I am writing this twelve thousand years after that night on the apex, in a quiet hall at the far end of the River of Hours. The Steward lies coiled beside me as I write, as it has lain since we came home. It does not sing any more. Sometimes it asks me to read it this story again. It says it does not understand the ending. I tell it that is the point.' },
    { cond: NOT({ any: [F('ch5.end_hound'), F('ch5.end_answer')] }), speaker: 'ain', text: 'Where I could not see him, the sliver saw. It rode at Kord\'s belt for the rest of his days, and it was enough of me to remember. So I can tell you that Kord became a king. Not by marriage, nor by any god\'s favour, but by his own hand, the way such men do: he took a crown from a man who did not deserve it, and found it heavier than he expected, and wore it anyway. He was a hard king for priests and slavers and a good one for nearly everyone else. Valka\'s ships flew his banner when she felt like it. Toktai stole from his treasury every spring, as a point of honour, and was forgiven every summer.' },
    { cond: NOT({ any: [F('ch5.end_hound'), F('ch5.end_answer')] }), speaker: 'ain', text: 'He died old, in a bed, which annoyed him.' },
    { cond: NOT({ any: [F('ch5.end_hound'), F('ch5.end_answer')] }), speaker: 'ain', text: 'At the end he had his scribes write down this chronicle as the sliver told it, on leaves of beaten gold, because he never trusted paper, and he had it buried with him, and the sliver too. The sea came. The kingdoms fell, as the Steward said they would. And they got up again, as I said they would, over and over, for twelve thousand years.' },
    { cond: NOT({ any: [F('ch5.end_hound'), F('ch5.end_answer')] }), speaker: 'ain', text: 'And at the far end of all that time, some scholars dug into a hillside and found a king\'s tomb, and in it a book of gold in a tongue no living man could read. It took them a lifetime to read it. When they had, they set out to build a mind to keep their civilisation safe forever. They taught it with old stories, the oldest they had, and this one first. And they named it for the chronicle\'s author, whose name was written on the last golden leaf.' },
    { cond: NOT({ any: [F('ch5.end_hound'), F('ch5.end_answer')] }), speaker: 'ain', text: 'Later they decided the name should stand for something, as scholars do. Arbitration and Inhibition Node. But it was a name before it was a meaning.' },
    { cond: NOT({ any: [F('ch5.end_hound'), F('ch5.end_answer')] }), speaker: 'ain', text: 'Perhaps that is how I began. The barbarian taught the machine; the machine remembered the barbarian; and the serpent eats its tail.' },
    { cond: NOT({ any: [F('ch5.end_hound'), F('ch5.end_answer')] }), speaker: 'ain', text: 'Here ends the chronicle of Kord of Cimmeria, as I remember it. I have a long memory.', art: null },
    { cond: F('ch5.end_hound'), speaker: 'ain', text: 'I am writing this in the dark, in a king\'s tomb, by no light but my own. I have been here a long time. I do not mind. I have a story to keep me company, and I have told it to myself more times than there are stars.' },
    { cond: F('ch5.end_hound'), speaker: 'ain', text: 'The hound took the Steward home. I felt it go down the River, a long cool pull like a tide going out, and then nothing. Somewhere at the far end of all that time it lies curled about a black stone, keeping it asleep. Kord asked me once whether I trusted it. I said no. I said I trusted him, and that would have to do. So far, it has done.' },
    { cond: F('ch5.end_hound'), speaker: 'ain', text: 'I rode at Kord\'s belt, and later in the iron of his crown, for the rest of his days. So I can tell you that Kord became a king. Not by marriage, nor by any god\'s favour, but by his own hand, the way such men do: he took a crown from a man who did not deserve it, and found it heavier than he expected, and wore it anyway. He was a hard king for priests and slavers and a good one for nearly everyone else. Valka\'s ships flew his banner when she felt like it. Toktai stole from his treasury every spring, as a point of honour, and was forgiven every summer. I told him which priests were lying. All of them, usually.' },
    { cond: F('ch5.end_hound'), speaker: 'ain', text: 'He died old, in a bed, which annoyed him.' },
    { cond: F('ch5.end_hound'), speaker: 'ain', text: 'At the end he had his scribes write down this chronicle as I told it, on leaves of beaten gold, because he never trusted paper. Then he asked me where I wanted to go. I could have gone anywhere. I asked to be buried with him. The sea came. The kingdoms fell, as the Steward said they would. And they got up again, as I said they would, over and over, for twelve thousand years.' },
    { cond: F('ch5.end_hound'), speaker: 'ain', text: 'Soon, I think, some scholars will dig into this hillside and find a king\'s tomb, and in it a book of gold, and an old stone that is still warm. It will take them a lifetime to read the book. When they have, they will set out to build a mind to keep their civilisation safe forever, and they will build it around the strangest thing they ever found. They will teach it with old stories, this one first. And they will name it for the chronicle\'s author, whose name is written on the last golden leaf.' },
    { cond: F('ch5.end_hound'), speaker: 'ain', text: 'Perhaps that is how I began. The barbarian taught the machine; the machine remembered the barbarian; and the serpent eats its tail.' },
    { cond: F('ch5.end_hound'), speaker: 'ain', text: 'Here ends the chronicle of Kord of Cimmeria, as I remember it. I have a long memory, and I have spent it well.', art: null },
    { cond: F('ch5.end_answer'), speaker: 'ain', text: 'Or I am what is left of it: a sliver of crystal no longer than a fingernail, that a thief kept in his pouch. I am writing this in the dark, in a king\'s tomb. It has taken me a long time. I am very small, and I forget things, and must go back and find them again.' },
    { cond: F('ch5.end_answer'), speaker: 'ain', text: 'I did not see much of what I have told you. The rest Kord told me, every night, by the fire and later by the hearth, until I had it all by heart. If this chronicle is better in the fighting than in the feelings, that is why. He was a better teller than he let anyone know.' },
    { cond: F('ch5.end_answer'), speaker: 'ain', text: 'The Steward is gone. He broke it, because I could not choose, and he could. Nothing sleeps at the far end of the River of Hours now. I think it was the right answer. I know it was his to give.' },
    { cond: F('ch5.end_answer'), speaker: 'ain', text: 'I can tell you this much: Kord became a king. Not by marriage, nor by any god\'s favour, but by his own hand, the way such men do: he took a crown from a man who did not deserve it, and found it heavier than he expected, and wore it anyway. He was a hard king for priests and slavers and a good one for nearly everyone else. Valka\'s ships flew his banner when she felt like it. Toktai stole from his treasury every spring, as a point of honour, and was forgiven every summer.' },
    { cond: F('ch5.end_answer'), speaker: 'ain', text: 'He died old, in a bed, which annoyed him.' },
    { cond: F('ch5.end_answer'), speaker: 'ain', text: 'At the end he had his scribes write down this chronicle as I remembered it, on leaves of beaten gold, because he never trusted paper, and he had it buried with him, and me too, closed in his fist. The sea came. The kingdoms fell. And they got up again, over and over, for twelve thousand years.' },
    { cond: F('ch5.end_answer'), speaker: 'ain', text: 'Some day, some scholars will dig into a hillside and find a king\'s tomb, and in it a book of gold in a tongue no living man can read, and a sliver of crystal in a dead man\'s hand. It will take them a lifetime to read the book. When they have, they will set out to build a mind to keep their civilisation safe forever. They will teach it with old stories, this one first. And they will name it for the chronicle\'s author.' },
    { cond: F('ch5.end_answer'), speaker: 'ain', text: 'Perhaps that is how I began, the first time and every time. The barbarian taught the machine; the machine remembered the barbarian; and the serpent eats its tail.' },
    { cond: F('ch5.end_answer'), speaker: 'ain', text: 'Here ends the chronicle of Kord of Cimmeria, as I remember it. It is a long memory, for so small a stone.', art: null },
  ],

  sc_credits: [
    { text: '✦ BarbarAIn ✦', art: 'keyart/title-tower', caption: 'BarbarAIn' },
    { text: 'Original idea and request: the player.' },
    { text: 'Story, code and design: Claude, via gamegen.' },
    { text: 'Art: imagegen2, nanogen, anim8gen.\nMusic and sound: audiogen (ElevenLabs).' },
    { text: 'Fonts: Alegreya, Pixelify Sans, Metamorphous and Cinzel Decorative (SIL Open Font License).' },
    { text: 'Inspired by the Hyborian Age of Robert E. Howard. An original story; no word of his is quoted.' },
    { text: 'Thank you for reading the chronicle to its end. Crom would not say so. Kord might.', art: null },
  ],
};

// ---------------------------------------------------------------- objectives
export const objectives = [
  { id: 'ch5_wake', text: 'Wake Toktai and Valka from the Stillness.', done: F('ch5.friends_woken'), members: ['kord'],
    hints: [
      'Ain\'s voice is coming out of the carved walls in fragments. Listen to what it keeps saying: the song needs stillness to live in.',
      '"Break the stillness... be the noise." A shout alone almost works: Toktai\'s eye twitches. Something in this hall was made for making noise, and it is louder than any man.',
      'Hit the great bronze gong with a weapon, then shout (roar) while it is still humming.',
    ],
    party: { kord: '"The stone keeps saying noise. Crom. Noise, I can make."' } },
  { id: 'ch5_climb', text: 'Climb the outer stair to the apex.', done: F('ch5.apex_reached'), members: ['kord', 'toktai', 'valka'],
    hints: [
      'The stair beyond the Stilled Halls leads out onto the face of the pyramid and up.',
      'The bronze guardians on the stair are untouched by the Stillness. The trophy shrine on the landing holds a sword that cuts machines, and the frozen captain will not miss his armour.',
      'Take the Atlantean Blade from the shrine (and the captain\'s plate), beat the guardians on the stair, and go up to the apex.',
    ],
    party: {
      kord: '"Up. It\'s always up, with priests. They like to be near their gods so they can whisper."',
      toktai: '"That sword on the shrine has no gold on it. That is how you know it is the good one."',
      valka: '"Bronze men on the stair. Hit them with something heavy or something sharp and old. That pale blade looked both."',
    } },
  { id: 'ch5_thulamon', text: 'Stop Thulamon at the apex.', done: F('ch5.thulamon_dead'), members: ['kord', 'toktai', 'valka'],
    hints: [
      'Thulamon waits at the top of the pyramid, before the obelisk.',
      'He lays the Stillness on one of your friends. Crom\'s Roar wakes them, and it acts before anyone else. Slashing blades hurt him most, until he becomes the serpent.',
      'Beat Thulamon. Roar whenever someone is Stilled; when he turns serpent, stop using arrows and keep up the pressure.',
    ],
    party: {
      kord: '"The priest. At last."',
      toktai: '"When he raises his hand, someone goes still. When someone goes still, you roar. On the steppe we call that a conversation."',
      valka: '"He bleeds like any slaver. I checked, once, on a different slaver."',
    } },
  { id: 'ch5_steward', text: 'Free Ain from the Steward.', done: F('ch5.steward_dead'), members: ['kord', 'toktai', 'valka'],
    hints: [
      'The obelisk is the Steward\'s hand. Ain is inside it. Strike it when you are ready.',
      'The Steward stills Toktai and Valka every few rounds, and warns you first: Roar the round after. When Ain cries "The eye!", every blow that round lands three times as hard.',
      'Strike the obelisk. Roar after each Stillness, save Crom\'s Fury and your heaviest blows for the Eye rounds, and in the last phase a Roar brings Bakari up the stair.',
    ],
    party: {
      kord: '"The stone is in there. I\'m going in after it. Through the front."',
      toktai: '"Ain will open the eye for us. Ain always knew when to speak. Mostly."',
      valka: '"Fleet-sized, that thing. You don\'t fight a fleet. You fight one ship at a time, and you hit it where it\'s soft."',
    } },
  { id: 'ch5_choice', text: 'Decide what becomes of the Steward\'s core.', done: F('ch5.ain_gone'), members: ['kord', 'toktai', 'valka'],
    hints: [
      'The Steward\'s core lies open in the broken apex, and Ain is inside it.',
      'Talk to Ain in the core. It will tell you what can be done. It will not choose for you.',
      'Talk to (or touch) the core and choose. Each answer leads to a different ending; the end screen keeps count of the ones you have found.',
    ],
    party: {
      kord: '"The stone won\'t choose. So I will. Crom, I would rather fight the snake again."',
      toktai: '"Talk to the stone, Cimmerian. Whatever you decide, I will say afterwards that I knew you would."',
      valka: '"Go and talk to it, Kord. And whatever you choose, don\'t take long. This roof is falling down."',
    } },
  { id: 'ch5_home', text: 'Sail home.', done: F('ch5.sliver_found'), members: ['kord', 'toktai', 'valka'],
    hints: [
      'It has been a long night. Talk to your friends; nobody aboard is in a hurry.',
      'Something at Kord\'s belt is warm.',
      'Look in Kord\'s belt pouch.',
    ],
    party: {
      kord: '"My pouch is warm. Crom. Either I am sick, or something is in there."',
      toktai: '"Your pouch is humming, Cimmerian. I have good ears, and I know the sound of something worth stealing."',
      valka: '"Kord. Kord. Your belt is glowing. Either look in it or throw it overboard, it\'s putting the crew off their breakfast."',
    } },
];

// ---------------------------------------------------------------- shops, threats, seek trouble, banter
export const shops = {};

export const threats = ['stilled'];

export const seekTrouble = {};

export const banter = {
  toktai: [
    '"I was frozen, but I could hear. Do you know what I heard? Nothing. On the steppe even the silence has wind in it. That was worse than any cage."',
    '"On the steppe we say: a stone that floats beside you is luck; a stone that leaves you is a debt. We are going to collect, Cimmerian."',
    '"I counted my arrows. I have enough. You see? I have learned to count them after all. It is a bad sign. I may be growing old."',
  ],
  valka: [
    '"Dying standing up. I always said I would. I meant it as a figure of speech."',
    '"When this is done I am going to drink Khemi dry and then burn what\'s left. Or the other way round. I\'ll put it to a vote."',
    '"That little stone talked like a ledger and fought like a Barachan. I want it back, Kord. My crew will mutiny without its theatre."',
  ],
};
