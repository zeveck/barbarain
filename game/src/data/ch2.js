// BarbarAIn — Chapter II: Red Sails over Gallows Bay (STORY.md, chapter II).
// Plain data (DATA_SPEC + the engine extensions in design/ENGINE_NOTES.md).
//
// Flow: gal_docks (arrival) → gal_tavern (Valka's entrance, the duel e2_duel,
// Valka joins; inn) → two threads in either order:
//   A. the crew's nerve: Mother Teg → Gilbo's Articles quiz (clued by Valka and
//      the pirates' table) → Kill-Devil Rum on the crusted lens → Ain wakes
//      (Aegis, Flare, Mirage) → "Ain has a sign for you" (the Lady of the Waves).
//   B. the ship: Gallows Hill (optional Great Gull) → grotto (crabs, cutthroats,
//      the skeleton's crank) → drowned passage (crank on winch, sea ghouls) →
//      Ortho's hoard (bosun, the sea-chart) → Ortho's Cove (betrayal offer,
//      boss Black Ortho).
// Finishing either thread first autosaves with the halfway line. With ship,
// crew and chart done, Valka offers to sail (confirm) → sea_deck: the vow,
// "I have no heart, in the anatomical sense", the Wyrm rises → chapter end.
//
// Battle flags (BATTLE_API §8, set by enemies.js encounters): ch2.duel_done,
// ch2.duel_won, ch2.crabs_dead, ch2.cutthroats_dead, ch2.ghouls_dead,
// ch2.hoard_won, ch2.ortho_beaten, ch2.gull_dead. Story flags SNAPSHOTS[3]
// expects: ch2.valka_joined, ch2.ain_woken, ch2.ortho_beaten.

export const chapter = {
  n: 2, name: 'Red Sails over Gallows Bay', start: 'gal_docks', card: 'bg/gal-docks',
  party: ['kord', 'toktai', 'ain', 'valka'],
};

export const itemNames = {
  loaded_dice: ['dice', 'loaded dice', 'my dice'],
  articles_a: ['dash parchment', "dash's parchment", 'first piece', 'parchment'],
  articles_b: ['gull parchment', "gull's parchment", 'second piece', 'parchment'],
  articles_c: ['marrow parchment', "marrow's parchment", 'third piece', 'parchment'],
  articles_ab: ['torn articles', 'two pieces', 'parchment'],
  drowned_articles: ['articles', 'drowned articles', 'old articles', 'original articles'],
  seal_box: ['seal box', 'seal-box', 'box', 'seals'],
  sea_vote_earring: ['earring', 'sea-vote earring', 'gold earring'],
  old_mercy: ['old mercy', 'mercy', 'gilbo cutlass'],
  kill_devil_rum: ['rum', 'kill-devil', 'kill devil', 'bottle', 'kill devil rum'],
  winch_crank: ['crank', 'iron crank', 'handle', 'winch crank'],
  sea_chart: ['chart', 'sea chart', 'sea-chart', 'map', 'stygian chart'],
  croms_tooth: ['tooth', 'croms tooth', 'crom tooth'],
  ishtar_bangle: ['bangle', 'bracelet', 'ishtar bangle'],
  pearl: ['pearl'],
  smugglers_gold_chain: ['chain', 'gold chain'],
  orthos_black_sabre: ['sabre', 'black sabre', 'ortho sabre'],
  zingaran_main_gauche: ['main-gauche', 'main gauche', 'parrying dagger'],
  kraken_bone_club: ['club', 'kraken club', 'bone club'],
  gull_feather: ['feather', 'gull feather'],
  barachan_cutlass: ['cutlass'],
};

// ---------------------------------------------------------------- people
export const npcs = {
  valka_npc: { name: 'Red Valka', names: ['valka', 'red valka', 'captain', 'woman', 'pirate'], portrait: 'portrait/valka', sprite: 'party/valka' },
  barkeep: { name: 'the barkeep', names: ['barkeep', 'bartender', 'innkeeper', 'pellam', 'landlord'] },
  teg: { name: 'Mother Teg', names: ['teg', 'mother teg', 'boatswain', 'old woman'], portrait: 'portrait/mother-teg', sprite: 'npc/mother-teg' },
  shrike_sailors: { name: 'the Shrike\'s crew', names: ['crew', 'sailors', 'shrike crew', 'deckhands'], sprite: 'npc/shrike-sailor' },
  dash: { name: 'One-Ear Dash', names: ['dash', 'one-ear dash', 'one ear dash', 'drunk', 'singer'], portrait: 'portrait/one-ear-dash', sprite: 'npc/one-ear-dash' },
  pirates: { name: 'the pirates', names: ['pirates', 'brothers'] },
  gilbo: { name: 'Gilbo', names: ['gilbo', 'keeper', 'old pirate', 'one-legged man', 'lighthouse keeper'], portrait: 'portrait/gilbo', sprite: 'npc/gilbo' },
  chandler: { name: 'Marrow the shipwright', names: ['marrow', 'shipwright', 'chandler', 'merchant', 'seller'] },
  ortho: { name: 'Black Ortho', names: ['ortho', 'black ortho', 'zingaran', 'captain ortho'], portrait: 'portrait/black-ortho', sprite: 'enemy/black-ortho' },
  lady_waves: { name: 'the Lady of the Waves', names: ['lady', 'lady of the waves', 'vision', 'mirage'], sprite: 'npc/lady-waves', machine: true },
};

// ---------------------------------------------------------------- helpers
const F = (flag) => ({ flag });
const NOT = (c) => ({ not: c });
const ALL = (...c) => ({ all: c });

// The first thread finished autosaves with the halfway line (STORY ch II step 2).
const HALFWAY = { cond: NOT(F('ch2.halfway')), effects: [
  { set: 'ch2.halfway' },
  { text: 'Half the work was done, and the sun had not yet set on Gallows Bay. A wiser crew would have stopped there, and drunk, and slept. This one drank, at least.' },
  { autosave: true },
] };

// Ship, crew and chart all done: Valka offers to sail.
const READY = { cond: ALL(F('ch2.ortho_beaten'), F('ch2.crew_rallied'), F('ch2.chart_found'), NOT(F('ch2.ready'))), effects: [
  { set: 'ch2.ready' },
  { objective: { id: 'ch2_sail', to: 'active' } },
  { speaker: 'valka', text: '"A ship, a crew, and a chart. That\'s everything a pirate needs, except a reason, and I\'ve got one: Stygian gold and Stygian slavers to take it off. The Shrike lies in Ortho\'s Cove; the crew will row out on the evening tide. Buy your trinkets first, Cimmerian. Once we sail, we don\'t come back for anything you forgot."' },
] };

// The night at sea: the vow, the heart, the Wyrm. Runs once.
const NIGHT = { cond: NOT(F('ch2.vow_done')), effects: [
  { set: 'ch2.vow_done' },
  { scene: 'sc_vow' },
  { scene: 'sc_wyrm' },
  { chapterEnd: 2 },
] };

// Shown as Valka's remark whenever she can't yet sail.
const NOT_READY = [
  { cond: NOT(F('ch2.ortho_beaten')), speaker: 'valka', text: '"Sail what? Ortho\'s still standing on my deck."' },
  { cond: NOT(F('ch2.crew_rallied')), speaker: 'valka', text: '"I can\'t sail her alone, and my crew are still in the Gull, waiting for a miracle."' },
  { cond: NOT(F('ch2.chart_found')), speaker: 'valka', text: '"Not without Ortho\'s chart. The Stygian coast eats ships that guess."' },
  { speaker: 'valka', text: '"Say the word, Cimmerian."' },
];

// ---------------------------------------------------------------- rooms
export const rooms = {
  // ============================================================ GALLOWS BAY DOCKS
  gal_docks: {
    name: 'Gallows Bay Docks', bg: 'bg/gal-docks', music: 'gallows', ambience: 'loop-sea', machine: false,
    map: { x: 1, y: 1 }, mapName: 'Docks',
    fx: [{ type: 'torch', x: 76, y: 100, r: 30 }, { type: 'torch', x: 212, y: 100, r: 30 }, { type: 'torch', x: 300, y: 102, r: 24 }, { type: 'spray', n: 16 }],
    desc: [
      { cond: F('ch2.ortho_beaten'), text: 'Gallows Bay at the end of the day: tar and fish-guts and the sour sweetness of spilled rum, red sails furled against a sky the colour of a bruise. Out past the [[mooring|empty mooring]], beyond the point, the *Crimson Shrike* rode at anchor in Ortho\'s Cove, hers again. The [[lighthouse|lighthouse]] stood on its rock to the north, and the [[ships|pirate ships]] creaked at their ropes like old men in their sleep. The door of the [[gull|Hanged Gull]] banged open and shut on its own laughter.' },
      { text: 'Gallows Bay was where the Barachan Isles kept their sins: a crooked harbour of black piles and red sails, stinking gloriously of tar, fish-guts, wet rope and rum. [[ships|Pirate ships]] lay three deep at the quays, their crews gambling on the decks. One [[mooring|mooring]] stood empty, its cut ropes trailing in the water. North on its rock rose the [[lighthouse|lighthouse]], unlit, and over the town squatted the bald brow of Gallows Hill. By the water\'s edge a tavern sign creaked in the wind: a gull, hanged by the neck. The [[gull|Hanged Gull]]. Somewhere inside it, glass broke, and someone cheered.' },
    ],
    short: [
      { cond: F('ch2.ortho_beaten'), text: 'The docks of Gallows Bay. The [[gull|Hanged Gull]], the [[ships|ships]], the empty [[mooring|mooring]], the [[lighthouse|lighthouse]]; the Shrike waits in the cove to the south.' },
      { text: 'The docks of Gallows Bay. The [[gull|Hanged Gull]] by the water, the [[ships|ships]], the empty [[mooring|mooring]], the [[lighthouse|lighthouse]] to the north.' },
    ],
    exits: [
      { dir: 'in', label: 'The Hanged Gull', names: ['tavern', 'hanged gull', 'gull', 'inn'], to: 'gal_tavern' },
      { dir: 'e', label: 'Shipwrights\' Row', names: ['shipwrights', 'shipwrights row', 'row', 'market', 'shop'], to: 'gal_market' },
      { dir: 'n', label: 'The lighthouse path', names: ['lighthouse', 'lighthouse path', 'path', 'point'], to: 'gal_lighthouse',
        cond: F('ch2.valka_joined'),
        blocked: [{ cond: { inParty: 'toktai' }, text: 'Toktai catches Kord\'s arm. "First the captain, Cimmerian. Then the sightseeing. She drinks in the Gull, when she is not throwing people out of it."' },
          { text: 'First a captain, and a ship. The lighthouse can wait.' }] },
      { dir: 'w', label: 'Gallows Hill', names: ['hill', 'gallows hill', 'gallows', 'gibbet'], to: 'gal_hill',
        cond: F('ch2.valka_joined'),
        blocked: [{ cond: { inParty: 'toktai' }, text: 'Toktai shakes his head. "A hill with a gallows on it. Do not climb toward a rope you have not been invited to. Find the captain first."' },
          { text: 'A hill with a gallows on it. Kord decides to find a captain first.' }] },
      { dir: 's', label: 'Row out to the Shrike', names: ['shrike', 'cove', 'ortho cove', 'boat', 'row'], to: 'gal_cove', cond: F('ch2.ortho_beaten'), hidden: true },
    ],
    onEnter: [{ cond: NOT(F('ch2.arrived')), effects: [{ set: 'ch2.arrived' }, { scene: 'sc_arrival' }] }],
    shout: { text: 'Kord bellows across the harbour. Forty pirates look up from forty games of dice, judge the size of him, and go back to their dice. In Gallows Bay a loud man is weather.' },
    say: [{ match: 'crom', response: { text: 'Kord says the name of his god to the grey sea. The sea, which has its own gods and is not fond of hill-men, slaps the piles and says nothing.' } }],
    banter: {
      ain: { speaker: 'ain', text: '"I do not like the sea." A pause. "It is very large, and very deep, and somewhere in it something is humming. I cannot tell where. I would rather not find out."' },
      valka: { cond: F('ch2.valka_joined'), speaker: 'valka', text: '"Gallows Bay. Every man here would cut your throat for a copper and give you his last shirt for a song. Best town in the world. Don\'t drink the water."' },
    },
    things: [
      { id: 'gull', kind: 'thing', name: 'the Hanged Gull', names: ['hanged gull', 'tavern', 'sign', 'inn sign'],
        hotspot: { x: 246, y: 40, w: 74, h: 66 },
        look: 'A sagging tavern built half on the quay and half on faith. Its sign is a real gull, long dead, hanged by the neck from an iron bracket: a joke the Barachans have found funny for forty years. Lamplight and noise spill from every crack.',
        take: 'The sign is nailed up with a great deal of iron and a great deal of local pride.',
        hit: 'Kord punches the gull. It swings, creaks and goes on being dead.',
        talk: 'Kord addresses the hanged gull. It has heard worse, from better.' },
      { id: 'ships', kind: 'thing', name: 'pirate ships', names: ['ships', 'ship', 'red sails', 'sails', 'galleys', 'quays'],
        hotspot: { x: 0, y: 0, w: 136, h: 112 },
        look: 'Barachan rovers, sleek and low, their red sails furled like sleeping bats. Not one of them has sailed this month. Their captains drink in the Gull and talk about the Wyrm, and lower their voices when they do.',
        take: 'Kord eyes the nearest ship. Its crew eye Kord. There are twenty of them, and they have the look of men who know exactly what he is thinking.',
        hit: 'Kord kicks a mooring post. Every ship in the row creaks at him, like an old woman tutting.',
        talk: 'Kord hails the nearest deck. "Sailing anywhere?" A laugh, and a bottle-cap thrown at his head. "Not this month, big man. Not with the Wyrm about."' },
      { id: 'mooring', kind: 'thing', name: 'empty mooring', names: ['mooring', 'empty mooring', 'berth', 'ropes', 'cut ropes', 'pier'],
        hotspot: { x: 130, y: 110, w: 70, h: 40 },
        look: [
          { cond: F('ch2.ortho_beaten'), text: 'The empty berth where the Shrike was stolen. Valka spat in it on the way past, for luck. Barachan luck is a strange thing.' },
          { cond: F('ch2.valka_joined'), text: 'The berth where the *Crimson Shrike* lay until Black Ortho cut her loose in the night. Valka looks at it the way a wolf looks at an empty den.' },
          { text: 'An empty berth, its mooring ropes cut clean through and trailing in the oily water. Someone left in a hurry, or someone was taken.' },
        ],
        take: 'Kord fishes up a cut rope. A clean cut, one stroke: a heavy blade, and a man who did not want to wake anyone.',
        hit: 'Kord stamps on the planks. Somewhere underneath, a crab scuttles off, offended.' },
      { id: 'lighthouse', kind: 'thing', name: 'lighthouse', names: ['lighthouse', 'tower', 'light', 'lamp', 'point'],
        hotspot: { x: 166, y: 56, w: 18, h: 34 },
        look: [
          { cond: F('ch2.ain_woken'), text: 'The lighthouse on its rock. For the first time in ten years there is a gleam up there: the great lens, clean, catching the last of the sun.' },
          { text: 'A squat tower on the rock at the harbour mouth. Its lamp has been dark for years, and the harbour pilots curse it nightly. They say a one-legged old pirate keeps it, and lets nobody up.' },
        ],
        take: 'Even Kord has limits, and a lighthouse is past them.',
        hit: 'The lighthouse is half a mile off. Kord shakes his fist at it. It does not notice.' },
    ],
  },

  // ============================================================ THE HANGED GULL
  gal_tavern: {
    name: 'The Hanged Gull', bg: 'bg/gal-tavern', music: 'gallows', ambience: 'loop-tavern', machine: false,
    map: { x: 0, y: 1 }, mapName: 'Hanged Gull',
    fx: [{ type: 'torch', x: 92, y: 30, r: 30 }, { type: 'torch', x: 170, y: 40, r: 30 }, { type: 'torch', x: 252, y: 32, r: 30 }, { type: 'dust', n: 14 }, { type: 'vignette', a: 0.3 }],
    desc: [
      { cond: F('ch2.crew_rallied'), text: 'The Hanged Gull roared like a ship\'s hold in a storm. The Shrike\'s crew were drinking to the Lady of the Waves and arguing about who had seen her first. At the [[table|pirates\' table]] the Articles argument had started over. [[dash|One-Ear Dash]] was singing, which nobody had asked for, and the [[barkeep|barkeep]] was pouring Kill-Devil as fast as gold hit the counter.' },
      { cond: F('ch2.valka_joined'), text: 'The Hanged Gull was a long low room of tarred beams and fishing nets, lit by swinging lamps and loud with the talk of men who were not sailing. A stuffed [[stuffed_gull|gull]] hung by a noose over the door. Through the [[window|broken window]] the sea breeze came in and the smell of the harbour with it. The Shrike\'s crew sat by the wall around [[teg|Mother Teg]], drinking like mourners. At the [[table|pirates\' table]] four rovers argued, and [[dash|One-Ear Dash]] swayed on a stool by the barrels. The [[barkeep|barkeep]] watched it all from behind his counter.' },
      { text: 'The Hanged Gull was a long low room of tarred beams and fishing nets, lit by swinging lamps and loud with the talk of men who were not sailing. A stuffed [[stuffed_gull|gull]] hung by a noose over the door. [[table|Pirates]] drank at a scarred table; [[dash|a one-eared drunk]] swayed by the barrels; a crew of [[teg|sailors]] sat by the wall like mourners. Behind the counter the [[barkeep|barkeep]] was already reaching for his cudgel, because at the centre of the room stood a woman with a copper-red braid, holding a large man off the floor by his belt and collar, and swinging him, thoughtfully, toward the [[window|window]].' },
    ],
    short: [
      { cond: F('ch2.valka_joined'), text: 'The Hanged Gull: the [[barkeep|barkeep]], [[teg|Mother Teg]] and the crew, the [[table|pirates\' table]], [[dash|One-Ear Dash]], the [[window|broken window]].' },
      { text: 'The Hanged Gull, loud and smoky. A [[window|window]], a [[table|table]] of pirates, a [[barkeep|barkeep]].' },
    ],
    exits: [{ dir: 'out', label: 'The docks', names: ['docks', 'door', 'outside', 'harbour', 'out'], to: 'gal_docks' }],
    onEnter: [{ cond: NOT(F('ch2.valka_met')), effects: [{ set: 'ch2.valka_met' }, { scene: 'sc_valka' }, { dialogue: 'dlg_valka_duel' }] }],
    inn: { price: 10,
      text: 'The barkeep shows them up a ladder to a loft that smells of rope and old sailors. The hammocks swing with the tide all night. Kord sleeps like a sunk anchor and wakes with his wounds closed and his purse ten silver lighter.',
      broke: '"Ten silver," says the barkeep. "The hammocks are cheap. The ceiling\'s extra, and so is not being robbed."' },
    shout: [
      { cond: F('ch2.valka_joined'), text: 'Kord roars for rum. The whole tavern roars back, louder, for the sheer joy of it. Valka bangs her cup on the table. "He\'s learning," she tells the room.' },
      { text: 'Kord roars. Nobody notices; somebody is being thrown out of a window.' },
    ],
    say: [
      { match: 'articles', response: { speaker: 'valka', text: '"The Articles? We vote on everything. Course, captain, dinner. No man owns a Brother. The more you want, the more you risk." She drinks. "That\'s all of it. The rest is lawyers."' } },
    ],
    banter: {
      valka: { speaker: 'valka', text: '"My crew. Brave as sharks, superstitious as grandmothers. Three ships swallowed this month and they\'ve decided the sea hates them personally. They want a sign. I\'m a pirate, not a priestess."' },
      toktai: { speaker: 'toktai', text: '"Good tavern. The rum tastes of tar. When the drink tastes of the road, the road is long. My grandfather said that, and he drank a great deal."' },
    },
    things: [
      { id: 'valka', kind: 'npc', npc: 'valka_npc', sprite: { x: 140, y: 94 }, cond: NOT(F('ch2.valka_joined')),
        look: 'A tall Aquilonian woman in a sea-green coat, a sabre at one hip and a dagger at the other, gold in her ears, a copper braid as thick as a hawser down her back. She has the laugh of a knife and the eyes of someone who has already decided how the fight ends.',
        talk: { speaker: 'valka', text: '"Wait your turn, big man. I\'m busy."' },
        take: 'Kord reaches for her. She is not where his hand went, and his hand is not where it was: it is behind his back, and she is holding it there, smiling.',
        hit: 'She has drawn a blade, and that is fair. But she is about to draw it on him anyway, and Kord is curious.' },
      { id: 'barkeep', kind: 'npc', npc: 'barkeep', hotspot: { x: 214, y: 70, w: 54, h: 60 },
        look: 'Pellam the barkeep: an Argossean with one ear, one eye, and a cudgel the size of a mooring post behind the counter. Every bottle on his shelf is Kill-Devil, whatever the label says. He has seen everything twice and charged for it both times.',
        talk: 'dlg_barkeep',
        take: 'Pellam\'s hand drifts to the cudgel. Kord\'s hand drifts away from Pellam.',
        hit: { text: 'Kord leans over the counter with intent. The cudgel comes up from behind it with more intent. They agree, wordlessly, to postpone.' },
        give: {
          kill_devil_rum: { text: '"Selling it back? It\'s worse the second time," says Pellam. "Use it on something. Drink it, clean with it, set fire to it."' },
          '*': { text: '"I take silver," says Pellam. "Anything else, take to Marrow on the Row."' },
        } },
      { id: 'teg', kind: 'npc', npc: 'teg', sprite: { x: 26, y: 100 }, cond: NOT(ALL(F('ch2.crew_rallied'), F('ch2.ortho_beaten'))),
        look: [
          { cond: F('ch2.crew_rallied'), text: 'Mother Teg sits straighter now, and there is a light in her eye that was not there before. Every so often she looks at Ain and touches the shark\'s tooth at her throat.' },
          { text: 'Mother Teg, boatswain of the Shrike: a grizzled woman as broad as a capstan, with forearms tattooed in fading blue and a voice that has been shouting into gales for forty years. The crew around her stare into their cups. Not one of them is drunk enough to forget the Wyrm.' },
        ],
        talk: 'dlg_gull_teg',
        take: 'Teg would break Kord\'s arm. She would apologise afterwards, very sincerely.',
        hit: { speaker: 'teg', text: '"Go on, then. I\'ve been hit by better, and by the sea, and the sea hits harder."' },
        give: {
          kill_devil_rum: { speaker: 'teg', text: '"Rum won\'t do it, lad. We\'ve drunk the Gull dry twice this month and we\'re still frightened. It\'s a sign we want, not a bottle."' },
          '*': { speaker: 'teg', text: '"Gifts won\'t do it. A sign from the sea, that\'s what we need."' },
        } },
      { id: 'crew', kind: 'npc', npc: 'shrike_sailors', sprite: { x: 58, y: 98 }, cond: NOT(ALL(F('ch2.crew_rallied'), F('ch2.ortho_beaten'))),
        look: [
          { cond: F('ch2.crew_rallied'), text: 'The Shrike\'s crew, drinking to the Lady of the Waves. They have already started a song about her. It is terrible, and getting longer.' },
          { text: 'Thirty of the hardest men and women on the Barachan coast, and they look like children who have heard a noise under the bed. One of them makes the sign against the evil eye every time the sea booms against the piles.' },
        ],
        talk: [
          { cond: F('ch2.crew_rallied'), text: '"Did you see her?" says a sailor, grabbing Kord\'s arm. "The Lady! She smiled at me. At me!" Kord does not tell him whose smile it was.' },
          { text: 'A young sailor with a gold tooth: "Talk to Mother Teg. She speaks for us. And she\'ll tell you what I\'ll tell you: we\'ll not sail into the Wyrm without a sign."' },
        ],
        take: 'Kord is not press-ganging thirty pirates. Not alone, anyway.',
        hit: 'Thirty pirates stand up at once. Kord sits down at once. Everyone agrees it never happened.' },
      { id: 'table', kind: 'prop', name: 'pirates\' table', names: ['table', 'pirates table', 'pirates', 'rovers', 'argument'],
        sprite: { id: 'prop/pirates-table', x: 102, y: 122 },
        look: 'A scarred table, four rovers, a great many cups, and an argument about the Articles of the Brotherhood that has been going since noon. Nobody is winning. Everybody is enjoying it.',
        talk: 'dlg_pirates',
        take: 'Kord takes a cup off the table. Four knives come out. He puts the cup back, and the knives go away, and the argument picks up mid-sentence.',
        hit: 'Kord thumps the table. The cups jump; the argument doesn\'t even pause. "...and that\'s why the parrot can\'t be captain!"',
        use: { kill_devil_rum: { text: 'Kord sets the bottle on the table. It vanishes. The argument gets louder and, if anything, more learned.', effects: [{ take: 'kill_devil_rum' }] },
          '*': { text: 'The pirates glance at the {item} and go back to arguing. "...blade and vote, that\'s what I said!"' } } },
      { id: 'dash', kind: 'npc', npc: 'dash', sprite: { x: 178, y: 98 },
        look: 'One-Ear Dash: a harbour drunk with one ear, three teeth and a voice like a gull with a grievance. He knows everything that happens in Gallows Bay, and sings about most of it.',
        talk: 'dlg_dash',
        use: { loaded_dice: [
          { cond: F('ch2.art_swapped'), text: 'The swap is made already.' },
          { cond: { inParty: 'toktai' }, text: 'Kord leans over to admire Dash\'s singing, which is a sacrifice. Behind him Toktai\'s hand passes over the barrel-head like a shadow over a field, and when it is gone, Dash\'s dice are in Toktai\'s sash and Kord\'s are on the barrel. Dash notices nothing. Dash is singing.', effects: [{ take: 'loaded_dice', quiet: true }, { set: 'ch2.art_swapped' }] },
          { text: 'Kord would need quicker hands than his to swap dice under Dash\'s nose. He knows a man with quicker hands.' }] },
        take: 'Dash is not worth stealing. Dash would be the first to say so.',
        hit: { speaker: 'dash', text: '"Not the other ear! I need it for listening!"' },
        give: {
          loaded_dice: [
          { cond: F('ch2.art_swapped'), text: 'The swap is made already.' },
          { cond: { inParty: 'toktai' }, text: 'Kord leans over to admire Dash\'s singing, which is a sacrifice. Behind him Toktai\'s hand passes over the barrel-head like a shadow over a field, and when it is gone, Dash\'s dice are in Toktai\'s sash and Kord\'s are on the barrel. Dash notices nothing. Dash is singing.', effects: [{ take: 'loaded_dice', quiet: true }, { set: 'ch2.art_swapped' }] },
          { text: 'Kord would need quicker hands than his to swap dice under Dash\'s nose. He knows a man with quicker hands.' }],
          kill_devil_rum: { speaker: 'dash', text: '"For me? Oh, you beauty." He weighs it lovingly, then pushes it back. "No. I can see in your face it\'s for summat. Rum\'s for drinking, and for cleaning glass, and for cleaning wounds. In that order. Don\'t waste it on Dash."' },
          '*': { speaker: 'dash', text: '"Can I drink it? No? Then what\'s it for?"' },
        } },
      { id: 'window', kind: 'thing', name: 'broken window', names: ['window', 'broken window', 'glass', 'frame'],
        hotspot: { x: 176, y: 56, w: 46, h: 40 },
        look: [
          { cond: F('ch2.valka_joined'), text: 'The window has no glass left, only a man-shaped absence. Outside on the quay, the man it belonged to is sitting up and asking who won.' },
          { text: 'A window, with glass in it. For now.' },
        ],
        take: 'There is nothing left in it worth taking. Valka took the glass, by way of a Zingaran.',
        hit: 'There is no glass left to break. Valka was thorough.' },
      { id: 'stuffed_gull', kind: 'thing', name: 'stuffed gull', names: ['stuffed gull', 'gull', 'bird', 'noose'],
        hotspot: { x: 30, y: 40, w: 46, h: 46 },
        look: 'A stuffed gull, hanged by a tiny noose. Below it a plank is carved: HE STOLE A FISH. The Barachans think this is very funny, and very fair.',
        take: 'The pirates of Gallows Bay would forgive a man for stealing their ships. Not their gull.',
        hit: 'Kord flicks the gull. It spins slowly on its noose. Somebody at the bar crosses himself.' },
    ],
  },

  // ============================================================ SHIPWRIGHTS' ROW
  gal_market: {
    name: 'Shipwrights\' Row', bg: 'bg/gal-market', music: 'gallows', ambience: 'loop-crowd', machine: false,
    map: { x: 2, y: 1 }, mapName: 'Shipwrights',
    fx: [{ type: 'torch', x: 188, y: 82, r: 24 }, { type: 'torch', x: 312, y: 76, r: 26 }, { type: 'dust', n: 20 }],
    desc: 'Shipwrights\' Row smelled of pine tar, hot pitch and sawdust, the honest smell of men building things that float. A half-built [[hull|hull]] lay on its cradle like the ribcage of a whale, and adzes rang along the waterfront. At the end of the row, under a striped awning hung with cutlasses, coats and coils of rope, [[chandler|Marrow the shipwright]] sold everything a pirate needed to kill, keep dry, or stay afloat. Beside his door, propped on a barrel, leaned a [[figurehead|figurehead]] with a cracked face.',
    short: 'Shipwrights\' Row: the [[hull|hull]], the [[figurehead|figurehead]], and [[chandler|Marrow]] under his awning.',
    exits: [{ dir: 'w', label: 'The docks', names: ['docks', 'back', 'harbour'], to: 'gal_docks' }],
    shout: { text: 'Kord roars down the Row. Adzes stop mid-swing. Then Marrow shouts back, "Buying or bellowing?", and the adzes start again.' },
    banter: {
      toktai: { speaker: 'toktai', text: '"Look: a bow of layered horn, Khitan glue, sinew from a beast I cannot name. On the steppe we say: a man\'s second wife is his bow. My first wife would understand."' },
      valka: { speaker: 'valka', text: '"Marrow cheats everyone equally. It\'s the closest thing to justice on the islands. That rapier on his wall, though. I\'ve wanted it for two years."' },
    },
    things: [
      { id: 'chandler', kind: 'npc', npc: 'chandler', hotspot: { x: 250, y: 66, w: 62, h: 74 },
        look: 'Marrow the shipwright: a long, stooped Barachan with sawdust in his beard and a pencil behind each ear. He builds ships for pirates and sells them everything else too, and he has never once asked where the gold came from.',
        talk: 'dlg_chandler',
        take: 'Marrow is attached to his shop by thirty years of habit and a very large dog under the counter.',
        hit: { text: 'Marrow does not flinch. "Hit me and you\'ll buy at double. Hit the dog and you won\'t buy at all."' },
        give: { '*': { text: '"Selling? Open the trade, big man. I buy what floats and what cuts."' } } },
      { id: 'hull', kind: 'thing', name: 'half-built hull', names: ['hull', 'ship', 'cradle', 'ribs', 'keel'],
        hotspot: { x: 116, y: 30, w: 76, h: 86 },
        look: 'Oak ribs on a cradle, a keel as long as a temple. Marrow says she\'ll be the fastest ship on the islands. Marrow says that about every ship. It is, so far, always true for about a year.',
        take: 'Kord considers stealing a ship. He considers how far he would get, pushing it.',
        hit: 'Kord slaps a rib. It booms like a drum. A shipwright up on the scaffold drops his adze and calls him something Barachan.' },
      { id: 'figurehead', kind: 'thing', name: 'figurehead', names: ['figurehead', 'carving', 'statue', 'wooden woman'],
        hotspot: { x: 196, y: 92, w: 42, h: 46 },
        look: 'A wooden sea-woman with a cracked face and a fish\'s tail, salvaged from a wreck. "Off the *Kestrel*," says Marrow. "The Wyrm\'s third. They found the figurehead. Not the ship. Not the crew."',
        take: '"That\'s not for sale," says Marrow. "That\'s for remembering."',
        hit: 'Kord raises a hand to the wooden face, and doesn\'t. Some things have had a hard enough month.' },
    ],
  },

  // ============================================================ THE LIGHTHOUSE
  gal_lighthouse: {
    name: 'The Lighthouse', bg: 'bg/gal-lighthouse', music: 'gallows', ambience: 'loop-sea', machine: false,
    map: { x: 1, y: 0 }, mapName: 'Lighthouse',
    fx: [{ type: 'dust', n: 18 }, { type: 'vignette', a: 0.25 }],
    glints: [{ x: 196, y: 82, steady: true, a: 0.8, cond: F('ch2.ain_woken') }],
    desc: [
      { cond: F('ch2.ain_woken'), text: 'The lamp room of the lighthouse was full of sea-light and salt wind. The great [[lens_clean|lens]] shone like a second sun, and in the empty [[cradle|lamp cradle]] where Ain had drunk the noon light a faint warmth still lingered. [[gilbo|Gilbo]] stumped about on his peg, polishing things that did not need it, and humming.' },
      { cond: F('ch2.gilbo_passed'), text: 'The lamp room at the top of the lighthouse: a ring of salt-fogged [[windows|windows]] over a hammered sea, a brass [[cradle|lamp cradle]] where no flame had burned in ten years, and beside it on its stand the great [[lens|lens]], crusted white and blind. [[gilbo|Gilbo]] watched Kord from beside the stair, a Brother of the Coast regarding another.' },
      { text: 'At the top of the lighthouse the wind sang in the window-frames. A ring of salt-fogged [[windows|windows]] looked out over a hammered sea. In the centre hung an empty brass [[cradle|lamp cradle]], and beside it on its stand a great [[lens|lens]], crusted white. Between Kord and all of it stood [[gilbo|Gilbo]] the keeper, on one leg and one peg, with a boathook held like a halberd.' },
    ],
    short: [
      { cond: F('ch2.ain_woken'), text: 'The lamp room. The clean [[lens_clean|lens]], the warm [[cradle|cradle]], [[gilbo|Gilbo]] humming.' },
      { text: 'The lamp room. [[gilbo|Gilbo]], the [[cradle|lamp cradle]], the crusted [[lens|lens]], the [[windows|windows]].' },
    ],
    exits: [{ dir: 's', label: 'Down to the docks', names: ['docks', 'down', 'stair', 'back'], to: 'gal_docks' }],
    onEnter: [{ cond: NOT(F('ch2.gilbo_passed')), effects: [{ objective: { id: 'ch2_lighthouse', to: 'active' } }] }],
    shout: { text: 'Kord shouts. The whole tower rings with it like a bell, and Gilbo claps his hands over his ears. "I\'ve one leg, lad, not no ears!"' },
    say: [
      { match: 'articles', response: { speaker: 'gilbo', text: '"Aye, the Articles. Free men, sharing alike, voting on all. Every answer\'s in that, if you\'ve the wit to look."' } },
    ],
    banter: {
      ain: { speaker: 'ain', text: '"The lens. If it were clean, it would gather the whole noon sky into one point." A long pause. "I find I want that very much. I do not know why."' },
      valka: { cond: NOT(F('ch2.gilbo_passed')), speaker: 'valka', text: '"Gilbo sailed with my old captain. He\'ll test you on the Articles. Think like a Brother: we vote on everything. Course, captain, dinner. No man owns a Brother. The more you want, the more you risk."' },
      toktai: { speaker: 'toktai', text: '"A tower full of windows and an old man with one leg. A rule of mine: never argue with a man who has already lost a leg. He knows what it costs."' },
    },
    things: [
      { id: 'gilbo', kind: 'npc', npc: 'gilbo', sprite: { x: 52, y: 106 },
        look: [
          { cond: F('ch2.gilbo_passed'), text: 'Gilbo, keeper of the light, one leg in the grave and one peg on the floor. He looks at Kord now with the fierce, pleased suspicion of an old man who has found a new person to tell his stories to.' },
          { text: 'Gilbo: a one-legged old pirate, brown and knotted as a ship\'s rope, with a beard like sea-foam and a boathook he holds like a halberd. Thirty years he sailed with the Brotherhood; ten he has kept this light, and in all that time he has let no lubber up his stair.' },
        ],
        talk: 'dlg_gilbo',
        take: 'Gilbo hooks Kord\'s belt with the boathook and gives a little tug, the way a man tests a fish.',
        hit: [
          { cond: F('ch2.gilbo_passed'), speaker: 'gilbo', text: '"Hit a Brother? Against the Articles, that is. Flogging offence. I\'d flog you myself, but I\'d need a ladder."' },
          { speaker: 'gilbo', text: '"Try it, lubber. I\'ve one leg and a boathook, and you\'ve two legs and nowhere to fall but down the stair."' },
        ],
        give: {
          seal_box: { text: 'Kord holds out the tarred box.', effects: [{ dialogue: 'dlg_gilbo' }] },
          kill_devil_rum: [
            { cond: F('ch2.gilbo_passed'), speaker: 'gilbo', text: 'Gilbo sniffs the bottle and sighs like a lover. "Not for me, Brother. I\'d drink it, and then where would my lens be? Salt comes off with rum. Put it on the glass."' },
            { speaker: 'gilbo', text: '"Bribing the keeper? That\'s lubber\'s work. Answer my questions like a Brother, or get off my stair."' },
          ],
          '*': { speaker: 'gilbo', text: '"Don\'t want it. Want a Brother of the Coast, or want you gone."' },
        },
        use: { kill_devil_rum: { speaker: 'gilbo', text: '"Not on the outside, lad."' } } },
      { id: 'lens', kind: 'prop', name: 'crusted lens', names: ['lens', 'great lens', 'crusted lens', 'glass', 'salt'], cond: NOT(F('ch2.lens_clean')),
        sprite: { id: 'prop/lens-crusted', x: 118, y: 86 },
        look: [
          { cond: F('ch2.gilbo_passed'), text: 'A great lens of rings within rings, taller than Toktai, set in a cage of brass. Ten years of sea-spray have crusted it white, blind as a dead gull\'s eye. Gilbo\'s words come back: salt comes off with rum. Everything comes off with rum.' },
          { text: 'A great lens of rings within rings, crusted white with salt, blind as a dead gull\'s eye. Gilbo shifts his boathook to stand between it and Kord.' },
        ],
        take: [
          { cond: F('ch2.gilbo_passed'), text: 'The lens is the size of a barrel and bolted to its stand. Besides, Gilbo is watching.' },
          { speaker: 'gilbo', text: '"Hands off my lens, lubber! Brothers only, past this peg."' },
        ],
        hit: { speaker: 'gilbo', text: '"TOUCH MY LENS AND I\'LL HAVE YOUR OTHER LEG." Kord: "I have both legs." Gilbo: "For now."' },
        use: {
          kill_devil_rum: [
            { cond: NOT(F('ch2.gilbo_passed')), speaker: 'gilbo', text: 'The boathook\'s hook settles round Kord\'s wrist. "Brothers only, I said. Answer my questions first."' },
            { text: 'Kord uncorks the Kill-Devil. The smell alone loosens the salt. He sloshes it over the great lens and scrubs with the heel of his hand, ring by ring, and the white crust melts and runs like frost in the sun.', sfx: 'puzzle',
              effects: [{ take: 'kill_devil_rum', quiet: true }, { set: 'ch2.lens_clean' }, { scene: 'sc_ain_wakes' }] },
          ],
          self: [
            { cond: NOT(F('ch2.gilbo_passed')), speaker: 'gilbo', text: '"Hands off my lens, lubber!"' },
            { text: 'Kord rubs the lens with his sleeve. The salt wins.' },
          ],
          '*': [
            { cond: NOT(F('ch2.gilbo_passed')), speaker: 'gilbo', text: '"Hands off my lens, lubber!"' },
            { text: 'Kord scrapes at the salt with the {item}. The salt has had ten years to settle in. It is not moving for a {item}.' },
          ],
        } },
      { id: 'lens_clean', kind: 'prop', name: 'great lens', names: ['clean lens', 'bright lens', 'polished lens'], cond: F('ch2.lens_clean'),
        sprite: { id: 'prop/lens-clean', x: 118, y: 86 },
        look: 'The great lens, clean for the first time in ten years. Light pours through it and pools gold in the brass cradle. It is hard to look at directly. Gilbo keeps looking at it anyway, and wiping his eyes, and blaming the salt.',
        take: 'It is bolted down, and Gilbo would follow Kord to the ends of the earth for it. On one leg.',
        hit: { speaker: 'gilbo', text: '"Lay a finger on it now and I\'ll feed you to the gulls in very small pieces."' },
        use: { kill_devil_rum: { text: 'The lens is clean. Kord takes a pull of the rum instead. It is horrible. He takes another.' },
          '*': { text: 'The lens is clean. Anything more would only make it dirtier.' } } },
      { id: 'cradle', kind: 'thing', name: 'lamp cradle', names: ['cradle', 'lamp cradle', 'lamp', 'brass cradle', 'lantern'],
        hotspot: { x: 172, y: 30, w: 50, h: 98 },
        look: [
          { cond: F('ch2.ain_woken'), text: 'The brass cradle is warm, like a stone after sunset. Ain lay there in the light and drank it, and something in the crystal\'s slow pulse is quicker now, and brighter.' },
          { cond: F('ch2.gilbo_passed'), text: 'An empty brass cradle where the great flame once burned, with nothing in it but dead moths. The lens is set to throw all its light into it. If the lens could see.' },
          { text: 'A tall brass cradle where the lighthouse flame once burned. Empty for years. Gilbo watches Kord look at it.' },
        ],
        take: 'Kord tugs at the cradle. It is bolted to the floor and the ceiling, and to Gilbo\'s heart.',
        hit: 'The cradle rings like a temple bell. Gilbo winces, and so does Ain.',
        use: {
          ain: [
            { cond: F('ch2.ain_woken'), speaker: 'ain', text: '"I have had my fill, thank you. More would be greed. I am told that is a pirate virtue, but I will resist."' },
            { cond: F('ch2.gilbo_passed'), speaker: 'ain', text: '"Not yet. There is no light in it. The lens is blind."' },
            { speaker: 'gilbo', text: '"Stones in my lamp? Not past my peg, lubber."' },
          ],
          '*': { text: 'Kord sets the {item} in the cradle, considers it, and takes it back. It is not what the cradle is for.' },
        } },
      { id: 'windows', kind: 'thing', name: 'windows', names: ['windows', 'window', 'sea', 'view', 'horizon'],
        hotspot: { x: 14, y: 14, w: 60, h: 92 },
        look: 'Through the salt-fogged panes the whole of Gallows Bay lies below: the red sails, the black piles, the bald brow of Gallows Hill. And beyond, the open sea, grey and wrinkled, going on forever toward Stygia. Ain dims a little, looking at it.',
        take: 'Kord cannot take the view. He takes a long look instead.',
        hit: 'Kord raps a pane. A gull outside raps back, harder, with its beak. It wins.' },
    ],
  },

  // ============================================================ GALLOWS HILL
  gal_hill: {
    name: 'Gallows Hill', bg: 'bg/gal-hill', music: 'gallows', ambience: 'loop-sea', machine: false,
    map: { x: 0, y: 2 }, mapName: 'Gallows Hill',
    fx: [{ type: 'torch', x: 216, y: 92, r: 24 }, { type: 'torch', x: 248, y: 96, r: 22 }, { type: 'spray', n: 24 }],
    desc: [
      { cond: F('ch2.gull_dead'), text: 'Gallows Hill, under a sky like wet slate. The [[gibbet|gibbet]] creaked on the crown of the hill, and the wind went round it moaning. Up on the crag the great [[nest|nest]] stood empty now, a heap of wreck-wood and bones. The smugglers\' [[stair|stair]] went down into the rock between two guttering torches.' },
      { text: 'Gallows Hill was a bald hump of rock and thrift between the town and the sea, where the Barachans hanged the few men they could agree on. An old [[gibbet|gibbet]] creaked at its crown, a frayed noose still turning in the wind. Below it, between two torches that someone kept lit for reasons of their own, a [[stair|stair]] cut into the rock went down toward the sea caves. And on the crag above the breakers, a [[nest|nest]] the size of a hay-cart was heaped with wreck-wood and bones, and something in it was very large, and watching.' },
    ],
    short: 'Gallows Hill: the [[gibbet|gibbet]], the great [[nest|nest]] on the crag, the smugglers\' [[stair|stair]] down into the rock.',
    exits: [
      { dir: 'e', label: 'The docks', names: ['docks', 'town', 'back', 'harbour'], to: 'gal_docks' },
      { dir: 'd', label: 'The smugglers\' stair', names: ['stair', 'stairs', 'down', 'caves', 'smugglers stair', 'grotto'], to: 'cav_grotto' },
    ],
    encounters: [{ id: 'e2_gull', auto: false, label: '⚔ Raid the Great Gull\'s nest', cond: NOT(F('ch2.gull_dead')) }],
    shout: [
      { cond: NOT(F('ch2.gull_dead')), text: 'Kord roars at the crag. The thing in the nest rises, and rises, and spreads wings like two sails, and screams back. Kord has been out-shouted. It does not happen often.' },
      { text: 'Kord roars at the sea. The sea roars back. They call it a draw.' },
    ],
    banter: {
      valka: { speaker: 'valka', text: '"Ortho\'s cove is round the back of this hill. The old smugglers\' caves run under it, all the way down to the sea. The brandy-runners used them for a hundred years, until someone hanged the last of them, up there." She nods at the gibbet. "Gallows Bay humour."' },
      ain: { speaker: 'ain', text: '"The caves go down below the waterline. I can feel the weight of the sea above them." A pause. "I am not afraid. I am merely... noting it."' },
    },
    things: [
      { id: 'gibbet', kind: 'thing', name: 'gibbet', names: ['gibbet', 'gallows', 'noose', 'bones', 'hanged man', 'skeleton'],
        hotspot: { x: 196, y: 0, w: 40, h: 54 },
        look: [
          { cond: F('ch2.tooth_taken'), text: 'The old gibbet, and the hill-man\'s bones in the grass beneath it. Kord has piled stones over them. It is not a cairn, as Cimmerians build them. It is the best a man can do on a hill full of pirates.' },
          { text: 'A gibbet of black oak, its noose frayed to a thread. Whoever hung there fell long ago: a heap of big bones lies in the thrift beneath, and round the neck-bones, on a rotted thong, a great yellow tooth carved with a mark Kord knows. A hill-mark. Cimmerian.' },
        ],
        take: [
          { cond: F('ch2.tooth_taken'), text: 'Kord has taken what the dead man would have wanted taken. The rest stays.' },
          { text: 'Kord kneels in the thrift and lifts the tooth from the bones. A hill-man, a long way from the hills. Kord does not know his name; he says something to Crom about him anyway, short and grim, and stacks stones over what is left. Then he hangs the tooth round his own neck.', sfx: 'pickup',
            effects: [{ set: 'ch2.tooth_taken' }, { give: 'croms_tooth' },
              { cond: { inParty: 'toktai' }, speaker: 'toktai', text: '"My people leave the dead to the sky. Bones for the birds, luck for whoever needs it. You need it."' }] },
        ],
        hit: 'Kord does not strike the dead. The dead have had enough done to them on this hill.',
        talk: 'Kord says, very low, the old words for a man of the hills who died among strangers. The wind takes them out to sea, which is as close to home as they will get.' },
      { id: 'nest', kind: 'thing', name: 'great nest', names: ['nest', 'great nest', 'crag', 'gull', 'great gull', 'bird'],
        hotspot: { x: 112, y: 56, w: 62, h: 34 },
        look: [
          { cond: ALL(F('ch2.gull_dead'), { objective: 'sq2_articles' }, NOT(F('ch2.art_b_taken'))), text: 'The nest is empty of gull: wreck-wood, sailcloth, bones. And under the bones, rolled tight round a gull\'s thighbone, a scrap of tarred parchment.' },
          { cond: F('ch2.gull_dead'), text: 'The nest is empty: wreck-wood, sailcloth, bones and one huge grey feather, quivering in the wind.' },
          { text: 'On the crag, a nest of wreck-wood and sailcloth and bones, and in it a gull as big as a pony, with a beak like a boarding axe. It watches Kord with one yellow eye. The Barachans call it the Harbour-master, and pay it no dues at all.' },
        ],
        take: [
          { cond: ALL(F('ch2.gull_dead'), { objective: 'sq2_articles' }, NOT(F('ch2.art_b_taken'))), text: 'Kord unrolls the scrap from the gull\'s thighbone. Tarred parchment, signed in something brown. The second piece of Gilbo\'s Articles.', effects: [{ set: 'ch2.art_b_taken' }, { give: 'articles_b' }] },
          { cond: F('ch2.gull_dead'), text: 'Kord picks through the nest. Bones, rope, a Zingaran boot. Nothing worth the climb.' },
          { text: 'Kord would have to take it off the Great Gull first. The Great Gull has views on that. (Raid the nest to fight it.)' },
        ],
        hit: [
          { cond: F('ch2.gull_dead'), text: 'Kord kicks the empty nest. A Zingaran boot falls out and rolls into the sea.' },
          { text: 'Kord climbs toward the crag, fist first.', effects: [{ battle: 'e2_gull' }] },
        ] },
      { id: 'stair', kind: 'thing', name: 'smugglers\' stair', names: ['stair', 'stairs', 'smugglers stair', 'steps', 'torches'],
        hotspot: { x: 200, y: 84, w: 54, h: 54 },
        look: 'Steps cut into the living rock, worn hollow by a hundred years of brandy-casks and bare feet, going down into the dark between two torches. Somebody keeps those torches lit. Somebody uses this stair.',
        take: 'Kord takes a torch from its bracket, then puts it back. Whoever lit it will want it when they come up. Kord will want to see them coming.',
        hit: 'Kord kicks the top step. Far below, something echoes, and something else answers.' },
    ],
  },

  // ============================================================ THE SMUGGLERS' GROTTO
  cav_grotto: {
    name: 'The Smugglers\' Grotto', bg: 'bg/cav-grotto', music: 'dungeon', ambience: 'loop-dungeon', machine: false, dungeon: true,
    map: { x: 0, y: 3 }, mapName: 'Grotto', seekTrouble: 'caves',
    fx: [{ type: 'torch', x: 214, y: 70, r: 26 }, { type: 'torch', x: 296, y: 72, r: 26 }, { type: 'vignette', a: 0.45 }],
    desc: [
      { cond: F('ch2.cutthroats_dead'), text: 'The Smugglers\' Grotto dripped and echoed. Green [[water|water]] lapped at a rotting [[boat|smugglers\' boat]], and the lantern-lit [[tunnel|tunnel]] on the far side led on, deeper under the hill. On the shingle the old [[skeleton|skeleton]] lay where it had lain for a century, and a [[chest|sea-chest]] stood half-buried under the lanterns.' },
      { text: 'The stair came down into a vast sea-cave, cathedral-high, its roof hung with dripping teeth of stone. A pool of green [[water|water]] filled the middle, breathing with the tide, and a rotting [[boat|smugglers\' boat]] lay drawn up on the shingle. On the far side, lanterns burned at the mouth of a [[tunnel|tunnel]]; somebody had hung them, and somebody was sitting under them, playing dice. Half-buried among the stones lay a [[skeleton|skeleton]], very old, and a [[chest|sea-chest]].' },
    ],
    short: 'The grotto: the green [[water|water]], the [[boat|boat]], the [[skeleton|skeleton]], the [[chest|chest]], and the lantern-lit [[tunnel|tunnel]].',
    encounters: [{ id: 'e2_grotto_crabs', auto: true, cond: NOT(F('ch2.crabs_dead')) },
      { id: 'e2_grotto_cutthroats', auto: false, label: '⚔ Fight the cutthroats', cond: ALL(F('ch2.crabs_dead'), NOT(F('ch2.cutthroats_dead'))) }],
    onEnter: [{ cond: ALL(F('ch2.crabs_dead'), NOT(F('ch2.cutthroats_dead')), NOT(F('ch2.cutthroats_seen'))), effects: [
      { set: 'ch2.cutthroats_seen' },
      { text: 'As the last crab cracks and goes still, the dice stop rattling under the lanterns. Three Barachan cutthroats get up from their game by the tunnel mouth, knives already out. Ortho\'s men. "Wrong cave, friends," says the biggest one. "It\'s a long swim home from here."' },
    ] }],
    exits: [
      { dir: 'u', label: 'Up to Gallows Hill', names: ['up', 'stair', 'hill', 'back', 'gallows hill'], to: 'gal_hill' },
      { dir: 'in', label: 'The tunnel', names: ['tunnel', 'deeper', 'passage', 'on', 'drowned passage'], to: 'cav_sluice',
        cond: ALL(F('ch2.crabs_dead'), F('ch2.cutthroats_dead')),
        blocked: [
          { cond: NOT(F('ch2.crabs_dead')), text: 'Kord starts round the pool. The shingle at his feet stands up on eight legs and opens a claw the size of a mangle. The crabs have not finished with him.' },
          { text: 'Three cutthroats stand shoulder to shoulder across the tunnel mouth. "Toll," says the biggest. "Your lives. Pay up."' },
        ],
        blockedEffects: [{ cond: F('ch2.crabs_dead'), effects: [{ battle: 'e2_grotto_cutthroats' }] },
          { cond: NOT(F('ch2.crabs_dead')), effects: [{ battle: 'e2_grotto_crabs' }] }] },
    ],
    shout: { text: 'Kord\'s roar booms round the cave and comes back from every side, so that for a moment there are twenty Cimmerians in the grotto. Stone teeth drip. Somewhere, a crab clicks its claws in reply.' },
    banter: {
      toktai: { speaker: 'toktai', text: '"Smugglers. Honest thieves, like us, but wetter. Look closer: a dead man\'s hand is never empty. It is only holding something you have not noticed."' },
      ain: { speaker: 'ain', text: '"The water here is the sea\'s, come in under the hill. It hums very faintly. Probably the tide." A pause. "Probably."' },
    },
    things: [
      { id: 'skeleton', kind: 'prop', name: 'smuggler\'s skeleton', names: ['skeleton', 'smuggler', 'bones', 'dead man', 'dead smuggler', 'hand'],
        sprite: { id: 'prop/smugglers-skeleton', x: 226, y: 146 },
        look: [
          { cond: F('ch2.crank_taken'), text: 'The old smuggler, lying on the shingle with one hand open now, as if relieved of a long errand.' },
          { text: 'A smuggler, a hundred years dead, lying where he fell, his skull grinning at the cave roof. His bony fist is still clamped round an iron crank, as if he died on his way somewhere with it, and refused to put it down.' },
        ],
        take: [
          { cond: F('ch2.crank_taken'), text: 'The rest of him he can keep.' },
          { text: 'Kord prises the crank out of the dead man\'s fist, one finger at a time. "Sorry, old man. I\'ll finish your errand." The fingers come away with a small dry click.', sfx: 'pickup',
            effects: [{ set: 'ch2.crank_taken' }, { give: 'winch_crank' }] },
        ],
        talk: 'Kord asks the skeleton where he was going with that crank. The skeleton\'s grin suggests it was somewhere deeper in.',
        hit: 'Kord does not kick a dead man who is only trying to rest. Not this one, anyway: he looks like he worked hard.' },
      { id: 'crank', kind: 'prop', name: 'iron crank', names: ['crank', 'iron crank', 'handle'], cond: NOT(F('ch2.crank_taken')),
        sprite: { id: 'prop/crank', x: 216, y: 144 },
        look: 'An iron crank, long-handled, square-socketed, black with age, gripped in the smuggler\'s bony fist. The kind of crank that turns a winch. A big winch.',
        take: { text: 'Kord prises the crank out of the dead man\'s fist, one finger at a time. "Sorry, old man. I\'ll finish your errand."', sfx: 'pickup',
          effects: [{ set: 'ch2.crank_taken' }, { give: 'winch_crank' }] },
        hit: 'Clang. The skeleton\'s grip does not loosen. Death is the best grip there is.' },
      { id: 'chest', kind: 'prop', name: 'sea-chest', names: ['chest', 'sea chest', 'sea-chest', 'box', 'trunk'],
        sprite: { id: 'prop/chest-closed', x: 270, y: 122 },
        look: [
          { cond: F('ch2.grotto_chest'), text: 'The sea-chest gapes open and empty.' },
          { text: 'A smuggler\'s sea-chest, iron-banded, half sunk in the shingle. The lock rusted away long ago.' },
        ],
        take: [
          { cond: F('ch2.grotto_chest'), text: 'Empty. Kord checks under the lining anyway. Still empty.' },
          { text: 'Kord heaves up the lid. Under a rotted sail lies a club of yellowed bone as long as his arm, heavy as an anchor, carved with suckers. Kraken bone. "Crom," says Kord, hefting it, with real affection.', sfx: 'chest',
            effects: [{ set: 'ch2.grotto_chest' }, { give: 'kraken_bone_club' }] },
        ],
        use: { self: [{ cond: F('ch2.grotto_chest'), text: 'Empty.' }, { text: 'It opens. Take what is inside.' }] },
        hit: 'The chest booms. A crab under it decides to live somewhere else.' },
      { id: 'water', kind: 'thing', name: 'green water', names: ['water', 'pool', 'green water', 'sea', 'tide'],
        hotspot: { x: 130, y: 92, w: 110, h: 40 },
        look: [
          { cond: F('ch2.crabs_dead'), text: 'Green water, breathing with the tide. Pieces of crab float in it. On the shingle at its edge one great shell lies cracked open, and something gleams pink inside.' },
          { text: 'Green water breathing in and out with the tide. Things move under it, armoured things, with claws.' },
        ],
        take: [
          { cond: ALL(F('ch2.crabs_dead'), NOT(F('ch2.pearl_taken'))), text: 'Kord reaches into the cracked crab-shell and comes out with a pearl as fat as a grape and as pink as a sunrise.', sfx: 'pickup',
            effects: [{ set: 'ch2.pearl_taken' }, { give: 'pearl' }] },
          { text: 'Kord scoops up a handful of sea. It runs out between his fingers, as the sea does.' },
        ],
        hit: 'Splash. Something under the water splashes back.' },
      { id: 'boat', kind: 'thing', name: 'smugglers\' boat', names: ['boat', 'rowing boat', 'smugglers boat', 'hull'],
        hotspot: { x: 48, y: 100, w: 88, h: 40 },
        look: 'A long rowing boat, rotted through, its oars still shipped. The smugglers rowed brandy in here on dark nights, a hundred years ago. Now crabs row in instead.',
        take: 'It would sink. It would sink with Kord in it.',
        hit: 'Kord\'s fist goes through the hull. A crab inside looks out at him through the hole.' },
      { id: 'tunnel', kind: 'thing', name: 'lantern-lit tunnel', names: ['tunnel', 'lanterns', 'lantern', 'passage', 'dice'],
        hotspot: { x: 222, y: 56, w: 62, h: 50 },
        look: [
          { cond: F('ch2.cutthroats_dead'), text: 'The tunnel mouth under its lanterns, the cutthroats\' dice still scattered on a barrel-head. The passage beyond runs down, and down, and the air from it smells of deep water.' },
          { text: 'Lanterns at a tunnel mouth, a barrel for a table, dice, and three of Ortho\'s cutthroats playing for each other\'s boots. Beyond them the passage runs down under the hill.' },
        ],
        take: [
          { cond: ALL(NOT({ has: 'loaded_dice' }), NOT(F('ch2.art_dice_taken'))), text: 'Kord pockets the dice. Loaded. He keeps them.', effects: [{ set: 'ch2.art_dice_taken' }, { give: 'loaded_dice', quiet: true }] },
          { text: 'Kord already has the only dice in this cave worth having.' },
        ],
        hit: 'Kord raps the tunnel wall. The echo goes a long way down and comes back wet.' },
      { id: 'pillar', kind: 'thing', name: 'barnacled pillar', names: ['pillar', 'third pillar', 'barnacled pillar', 'barnacles', 'cache', 'x'],
        hotspot: { x: 166, y: 20, w: 38, h: 70 }, cond: { any: [{ has: 'drowned_articles' }, F('ch2.art_cache_open')] },
        look: [
          { cond: F('ch2.art_cache_open'), text: 'The third barnacled pillar, with a black hole at its foot where the tar-sealed chest was. The tide sings in it, softly, to nobody.' },
          { text: 'The third pillar from the stair, crusted with barnacles to the height of a man. When the tide breathes, a hole at its foot hums a low note. Where the tide sings. Gilbo\'s Articles have an X on exactly this spot.' },
        ],
        take: [{ cond: F('ch2.art_cache_open'), text: 'There is nothing left in the hole but the tide.' }, { text: 'Kord kneels and reaches into the singing hole.', effects: [{ cond: NOT(F('ch2.art_ghoul_dead')), effects: [
            { text: 'His fingers find tarred wood. And something else finds his wrist: a hand, cold and wet and very strong, coming up out of the black water. A drowned man rises after it, barnacled like the pillar, with a captain\'s ring on one finger and the old Articles\' oath still on his lips: "...and keep the box, till a Brother comes..."', sfx: 'splash' },
            { battle: 'e2_cache' }] },
          { cond: ALL(F('ch2.art_ghoul_dead'), NOT(F('ch2.art_cache_open'))), effects: [{ set: 'ch2.art_cache_open' },
            { text: 'The drowned guardian sinks back into the pool, and this time it stays down. "Kept his word," says Toktai quietly. "Longer than most men keep anything." Kord hauls a little tar-sealed chest out of the hole and breaks the seal.' },
            { give: 'seal_box' }, { give: 'sea_vote_earring' },
            { cond: { inParty: 'valka' }, speaker: 'valka', text: 'Valka fishes a heavy gold earring out of the chest and holds it up to the lantern. "First captains wore these to vote. One ring, one voice." She tosses it to Kord. "You fought for it, you wear it. Gilbo gets the box."' }] }] }],
        hit: [{ cond: F('ch2.art_cache_open'), text: 'The pillar has given up its secret.' }, { text: 'Kord kicks the barnacles away from the singing hole.', effects: [{ cond: NOT(F('ch2.art_ghoul_dead')), effects: [
            { text: 'His fingers find tarred wood. And something else finds his wrist: a hand, cold and wet and very strong, coming up out of the black water. A drowned man rises after it, barnacled like the pillar, with a captain\'s ring on one finger and the old Articles\' oath still on his lips: "...and keep the box, till a Brother comes..."', sfx: 'splash' },
            { battle: 'e2_cache' }] },
          { cond: ALL(F('ch2.art_ghoul_dead'), NOT(F('ch2.art_cache_open'))), effects: [{ set: 'ch2.art_cache_open' },
            { text: 'The drowned guardian sinks back into the pool, and this time it stays down. "Kept his word," says Toktai quietly. "Longer than most men keep anything." Kord hauls a little tar-sealed chest out of the hole and breaks the seal.' },
            { give: 'seal_box' }, { give: 'sea_vote_earring' },
            { cond: { inParty: 'valka' }, speaker: 'valka', text: 'Valka fishes a heavy gold earring out of the chest and holds it up to the lantern. "First captains wore these to vote. One ring, one voice." She tosses it to Kord. "You fought for it, you wear it. Gilbo gets the box."' }] }] }],
        use: { drowned_articles: [{ cond: F('ch2.art_cache_open'), text: 'The X has been found.' }, { text: 'Kord holds the chart up against the cave. Third pillar. Where the tide sings. He kneels.', effects: [{ cond: NOT(F('ch2.art_ghoul_dead')), effects: [
            { text: 'His fingers find tarred wood. And something else finds his wrist: a hand, cold and wet and very strong, coming up out of the black water. A drowned man rises after it, barnacled like the pillar, with a captain\'s ring on one finger and the old Articles\' oath still on his lips: "...and keep the box, till a Brother comes..."', sfx: 'splash' },
            { battle: 'e2_cache' }] },
          { cond: ALL(F('ch2.art_ghoul_dead'), NOT(F('ch2.art_cache_open'))), effects: [{ set: 'ch2.art_cache_open' },
            { text: 'The drowned guardian sinks back into the pool, and this time it stays down. "Kept his word," says Toktai quietly. "Longer than most men keep anything." Kord hauls a little tar-sealed chest out of the hole and breaks the seal.' },
            { give: 'seal_box' }, { give: 'sea_vote_earring' },
            { cond: { inParty: 'valka' }, speaker: 'valka', text: 'Valka fishes a heavy gold earring out of the chest and holds it up to the lantern. "First captains wore these to vote. One ring, one voice." She tosses it to Kord. "You fought for it, you wear it. Gilbo gets the box."' }] }] }] } },
    ],
  },

  // ============================================================ THE DROWNED PASSAGE
  cav_sluice: {
    name: 'The Drowned Passage', bg: 'bg/cav-sluice', music: 'dungeon', ambience: 'loop-dungeon', machine: false, dungeon: true,
    map: { x: 1, y: 3 }, mapName: 'Drowned Passage', seekTrouble: 'caves',
    fx: [{ type: 'torch', x: 56, y: 66, r: 26 }, { type: 'torch', x: 264, y: 64, r: 26 }, { type: 'vignette', a: 0.5 }],
    desc: [
      { cond: F('ch2.sluice_drained'), text: 'The Drowned Passage was drowned no longer. Where the black water had stood, a floor of stinking [[mud|mud]] ran on into the dark, strewn with the bones of things the sea had kept. The [[gate|sluice gate]] stood raised in its frame, streaming, and the old [[winch|winch]] beside it wore its crank again, like a man with his hat back on.' },
      { text: 'The tunnel opened into a high, vaulted passage, torch-lit, its walls sweating. A few paces on, the way simply ended in black [[water|water]], flat and still and filling the passage to the roof. Across it stood a wooden [[gate|sluice gate]] in a frame of old stone, holding back the sea from somewhere, or holding it in. Beside the gate an iron-bound [[winch|winch]] waited to raise it, with an empty square socket where its crank should be.' },
    ],
    short: [
      { cond: F('ch2.sluice_drained'), text: 'The drained passage: the raised [[gate|gate]], the [[winch|winch]] with its crank, the [[mud|mud]] running on.' },
      { text: 'The Drowned Passage: the black [[water|water]], the [[gate|sluice gate]], the [[winch|winch]] with no crank.' },
    ],
    encounters: [{ id: 'e2_sluice_ghouls', auto: true, cond: ALL(F('ch2.sluice_drained'), NOT(F('ch2.ghouls_dead'))) }],
    exits: [
      { dir: 'out', label: 'Back to the grotto', names: ['back', 'grotto', 'out'], to: 'cav_grotto' },
      { dir: 'in', label: 'On through the passage', names: ['on', 'passage', 'deeper', 'mud', 'hoard', 'onward'], to: 'cav_hoard',
        cond: ALL(F('ch2.sluice_drained'), F('ch2.ghouls_dead')),
        blocked: [
          { cond: F('ch2.sluice_drained'), text: 'Shapes are still crawling up out of the mud, pale and dripping, between Kord and the way on.' },
          { text: 'Kord wades in to the knees, then the waist, then the chest. The water is cold as a moneylender\'s heart and black to the roof, and it goes on. Kord wades back out. "Not without gills."' },
        ],
        blockedEffects: [{ cond: ALL(F('ch2.sluice_drained'), NOT(F('ch2.ghouls_dead'))), effects: [{ battle: 'e2_sluice_ghouls' }] }] },
    ],
    shout: { text: 'Kord\'s roar rolls across the water and booms back off the gate. The water shivers. Something under it shivers too.' },
    banter: {
      toktai: { cond: NOT(F('ch2.sluice_drained')), speaker: 'toktai', text: '"A winch with no crank. And the dead man in the cave behind us, holding a crank, as if he had somewhere to be." He shrugs. "The dead are poor company, but excellent porters."' },
      valka: { speaker: 'valka', text: '"Smugglers\' trick. Flood the passage when the revenue men come; drain it when they\'ve gone. Ortho found it and kept it. Ortho never had an idea of his own in his life."' },
    },
    things: [
      { id: 'winch', kind: 'prop', name: 'winch', names: ['winch', 'drum', 'socket', 'square socket'],
        sprite: { id: 'prop/winch', x: 72, y: 124 },
        look: [
          { cond: F('ch2.sluice_drained'), text: 'The winch, its chain wound tight, the old crank seated in its socket where it belongs. A hundred years late, the smuggler\'s errand is done.' },
          { text: 'An iron-bound winch, its chain running up to the top of the sluice gate. The square socket in its side is empty: whoever worked it last took the crank away with him.' },
        ],
        take: 'It is bolted to the rock with bolts as thick as Kord\'s thumb, by men who expected someone like Kord.',
        hit: 'Kord pounds the winch. The drum turns a finger\'s width, groans, and turns back. It wants a crank, not a fist.',
        use: {
          winch_crank: [
            { cond: F('ch2.sluice_drained'), text: 'The crank is already in it.' },
            { text: 'Kord seats the dead smuggler\'s crank in the empty socket. It fits like a key. He sets his feet and heaves, and the winch shrieks, and the chain comes up out of the water link by streaming link, and the sluice gate rises. With a roar like the sea clearing its throat, the black water rushes out under the gate and away down some hidden channel, and the passage drains.', sfx: 'water-rush',
              effects: [{ take: 'winch_crank', quiet: true }, { set: 'ch2.sluice_drained' }, { fx: 'shake' },
                { text: 'In the mud the water leaves behind, things begin to move. Pale things, bloated, with the sea still running out of their mouths, getting up.' },
                { battle: 'e2_sluice_ghouls' }] },
          ],
          self: [
            { cond: F('ch2.sluice_drained'), text: 'Kord gives the crank another turn for luck. The chain is as tight as it goes.' },
            { text: 'Kord grips the empty socket with his fingers and heaves. The winch does not move. His fingers are not square, and the winch is very particular.' },
          ],
          '*': { text: 'Kord jams the {item} into the square socket and heaves. The {item} gives up before the winch does.' },
        } },
      { id: 'crank_fitted', kind: 'prop', name: 'fitted crank', names: ['fitted crank'], cond: F('ch2.sluice_drained'),
        sprite: { id: 'prop/crank', x: 96, y: 122 },
        look: 'The smuggler\'s crank, back where it belongs.',
        take: 'Kord leaves it in the winch. If the gate came down behind them, they would want a way back.',
        hit: 'Clang.' },
      { id: 'gate', kind: 'prop', name: 'sluice gate', names: ['gate', 'sluice gate', 'sluice', 'frame'],
        sprite: { id: 'prop/sluice-gate', x: 140, y: 90 },
        look: [
          { cond: F('ch2.sluice_drained'), text: 'The sluice gate, hauled up in its frame, streaming weed and water. Beyond it the passage runs on, muddy and open.' },
          { text: 'A gate of black oak planks in a stone frame, chained to the winch. Behind it the water stands to the roof. Raise the gate and the water would go out under it, somewhere. Smugglers built it; smugglers knew where.' },
        ],
        take: 'Kord heaves at the gate. A hundred tons of sea lean on the other side. The sea wins.',
        hit: [
          { cond: F('ch2.sluice_drained'), text: 'Kord thumps the raised gate. Water drips on his head.' },
          { text: 'Kord hammers on the gate. It booms. The sea behind it does not care. The winch would do better.' },
        ],
        use: { winch_crank: { text: 'The crank goes in the winch, not the gate. The winch raises the gate.' }, '*': { text: 'The gate is chained to the winch. That is where the work gets done.' } } },
      { id: 'water', kind: 'thing', name: 'black water', names: ['water', 'black water', 'flood', 'pool'], cond: NOT(F('ch2.sluice_drained')),
        hotspot: { x: 100, y: 92, w: 120, h: 30 },
        look: 'Black water, flat as glass, filling the passage to the roof. Kord\'s torch shows nothing in it but his own face, and behind his face, maybe, something pale.',
        take: 'Kord scoops up a handful. It is salt, and very cold, and it smells of drowned things.',
        hit: 'Splash. Ripples run away into the dark. Something under there turns over in its sleep.',
        use: { '*': { text: 'Kord dips the {item} in the water. Now it is a wet {item}.' } } },
      { id: 'mud', kind: 'thing', name: 'mud', names: ['mud', 'floor', 'bones', 'drained passage'], cond: F('ch2.sluice_drained'),
        hotspot: { x: 92, y: 110, w: 140, h: 30 },
        look: [
          { cond: F('ch2.ghouls_dead'), text: 'Mud, bones, and the leavings of the things that rose from it. The way on is open.' },
          { text: 'Mud, and things getting up out of it.' },
        ],
        take: 'Kord has enough of this mud on him already.',
        hit: 'Squelch. The mud keeps Kord\'s boot for a moment, thinking about it.' },
    ],
  },

  // ============================================================ ORTHO'S HOARD
  cav_hoard: {
    name: 'Ortho\'s Hoard', bg: 'bg/cav-hoard', music: 'dungeon', ambience: 'loop-dungeon', machine: false, dungeon: true,
    map: { x: 2, y: 3 }, mapName: 'Hoard', seekTrouble: 'caves',
    fx: [{ type: 'torch', x: 102, y: 38, r: 22 }, { type: 'torch', x: 214, y: 38, r: 22 }, { type: 'torch', x: 256, y: 44, r: 20 }, { type: 'dust', n: 12 }],
    desc: [
      { cond: F('ch2.hoard_looted'), text: 'Ortho\'s hoard looked like a dragon\'s den after a visit from bailiffs. The [[gold|gold]] that was worth carrying had been carried; under Ortho\'s skull-and-sabre [[flag|flag]] his [[throne|chart table]] stood bare. Through the [[cave_mouth|sea-mouth]] on the far side the daylight glittered on the cove, and on the red sails of the *Crimson Shrike*.' },
      { text: 'The passage climbed into a cave hung with ship\'s lanterns, and the lanterns shone on gold. It lay in heaps on the floor and spilled out of broken chests: plate and coin, chain and candlestick, the loot of a hundred ships, piled with all the taste of a magpie. At the back, under a black [[flag|flag]] showing a skull and a sabre, stood a carved chair and a [[throne|chart table]] scattered with papers. Through a [[cave_mouth|sea-mouth]] on the right, daylight, and the sound of surf. Black Ortho had made himself a dragon\'s den. He had left a dragon in it: his bosun, and two of his worst.' },
    ],
    short: 'Ortho\'s hoard: the heaped [[gold|gold]], the [[flag|flag]], the [[throne|chart table]], and the [[cave_mouth|sea-mouth]] to the cove.',
    encounters: [{ id: 'e2_hoard', auto: true, cond: NOT(F('ch2.hoard_won')) }],
    exits: [
      { dir: 'w', label: 'Back through the passage', names: ['back', 'passage', 'drowned passage', 'west'], to: 'cav_sluice' },
      { dir: 'out', label: 'Out to the cove', names: ['out', 'cove', 'sea mouth', 'sea-mouth', 'shrike', 'daylight'], to: 'gal_cove',
        cond: F('ch2.hoard_won'), blocked: 'Ortho\'s bosun stands in the sea-mouth with the daylight behind him, a hand-axe in each fist.' },
    ],
    onEnter: [{ cond: ALL(F('ch2.hoard_won'), NOT(F('ch2.hoard_seen'))), effects: [{ set: 'ch2.hoard_seen' },
      { speaker: 'valka', text: '"That\'s my silver plate. And that\'s my cabin door. He took my *door*." She kicks a heap of coins. "Take what you like, Cimmerian. Leave me the chart. The chart\'s worth more than the rest of this together."' }] }],
    shout: { text: 'Kord roars. The gold shivers in its heaps, chinking like a fat man laughing. Outside, through the sea-mouth, someone on a ship\'s deck shouts back a question.' },
    banter: {
      valka: { speaker: 'valka', text: '"Half this is mine, and the other half belonged to people who\'d be glad to see Ortho hang. We\'re practically priests."' },
      toktai: { speaker: 'toktai', text: '"So much gold. A man can only ride one horse." His eyes shine. "But he can lead many."' },
    },
    things: [
      { id: 'gold', kind: 'thing', name: 'heaps of gold', names: ['gold', 'treasure', 'hoard', 'coins', 'heaps', 'plate', 'loot'],
        hotspot: { x: 78, y: 92, w: 62, h: 44 },
        look: [
          { cond: F('ch2.hoard_looted'), text: 'What is left is too heavy, too ugly, or too cursed to carry. Ortho had a weakness for gilded candlesticks.' },
          { text: 'Coin of every kingdom from Argos to Vendhya, Zingaran plate, a gilt saint with no nose, and through it all, like a fish through weed, the gleam of something better: a heavy gold chain, a bangle of strange pale metal, a parrying dagger with a basket hilt.' },
        ],
        take: [
          { cond: F('ch2.hoard_looted'), text: 'Kord has taken the best of it. The candlesticks he leaves for the next thief, out of professional courtesy.' },
          { text: 'Kord fills his pockets, his pouch and his boots: two hundred silver in mixed coin, a smuggler\'s gold chain heavy enough to drown in, a Zingaran parrying dagger, and a bangle of pale metal set with a moonstone that is warm to the touch.', sfx: 'coins',
            effects: [{ set: 'ch2.hoard_looted' }, { gold: 200 }, { give: 'smugglers_gold_chain' }, { give: 'zingaran_main_gauche' }, { give: 'ishtar_bangle' },
              { cond: { inParty: 'ain' }, speaker: 'ain', text: '"The bangle hums very faintly. Sorcery, or something like it. You will not wear it, I suppose." Kord: "No." Ain: "I might."' }] },
        ],
        hit: 'Kord punches a heap of coin. It avalanches over his boots with a sound like rain on a tin roof, which is the most beautiful sound in the world.' },
      { id: 'throne', kind: 'thing', name: 'chart table', names: ['chart table', 'table', 'chair', 'throne', 'papers', 'chart', 'sea chart', 'map'],
        hotspot: { x: 164, y: 92, w: 40, h: 34 },
        look: [
          { cond: F('ch2.chart_found'), text: 'Ortho\'s carved chair and his chart table, bare now but for wine-rings and a doodle of a woman with a red braid being eaten by a shark.' },
          { text: 'A carved chair Ortho must have thought looked like a throne, and a table of papers: bills of sale, a love-letter he never sent, and, held flat by a dagger, a sea-chart drawn on oiled sheepskin. The Stygian coast, every reef and current and watchtower, from the Black River to Khemi.' },
        ],
        take: [
          { cond: F('ch2.chart_found'), text: 'Nothing else on the table is worth having, unless Kord wants to read Ortho\'s love poetry. He does not.' },
          { text: 'Kord pulls the dagger out of the table and rolls up the chart.', sfx: 'pickup',
            effects: [{ set: 'ch2.chart_found' }, { give: 'sea_chart' }, { objective: { id: 'ch2_chart', to: 'done' } },
              { cond: { inParty: 'valka' }, speaker: 'valka', text: '"The Stygian coast. Every reef, every watchtower. That\'s our way in, Cimmerian. Hang on to it till we\'re aboard; I\'ll pin it to the Shrike\'s chart table myself."' },
              READY] },
        ],
        hit: 'Kord kicks Ortho\'s chair over. It is very satisfying, and he can see why Valka would want to do it herself.',
        use: { self: { text: 'Kord sits in Ortho\'s chair and puts his boots on the table. It is a good chair. Ortho had one thing right.' } } },
      { id: 'flag', kind: 'thing', name: 'Ortho\'s flag', names: ['flag', 'banner', 'skull', 'black flag'],
        hotspot: { x: 172, y: 58, w: 32, h: 34 },
        look: 'A black flag with a white skull and a crossed sabre. Ortho\'s colours. Somebody has sewn the skull a little smile; possibly Ortho, possibly a sailmaker with a sense of humour.',
        take: 'Kord tears the flag down and uses it to wipe his boots. Then he hangs it back up, upside down, which among pirates is apparently worse.',
        hit: 'Kord punches the skull on the flag. It goes on smiling.' },
      { id: 'cave_mouth', kind: 'thing', name: 'sea-mouth', names: ['sea mouth', 'sea-mouth', 'cave mouth', 'daylight', 'cove', 'opening'],
        hotspot: { x: 236, y: 54, w: 64, h: 70 },
        look: 'A ragged mouth in the rock, full of salt wind and sunlight. Beyond it, a hidden cove, and riding at anchor in the cove a ship with red sails. The *Crimson Shrike*.',
        take: 'Kord cannot take daylight. He can walk out into it.',
        hit: 'Kord punches the cave wall. The cave wall was here first.' },
    ],
  },

  // ============================================================ ORTHO'S COVE (the Shrike's deck)
  gal_cove: {
    name: 'Ortho\'s Cove', bg: 'bg/gal-cove', music: 'gallows', ambience: 'loop-sea', machine: false,
    map: { x: 2, y: 2 }, mapName: 'Ortho\'s Cove',
    fx: [{ type: 'torch', x: 16, y: 78, r: 26 }, { type: 'torch', x: 232, y: 80, r: 18 }, { type: 'spray', n: 18 }],
    desc: [
      { cond: F('ch2.ortho_beaten'), text: 'The *Crimson Shrike* rode at anchor in the cove, red sails loose on her yards, her deck scrubbed of Ortho and most of his blood. [[helm|Her wheel]] gleamed under Valka\'s hands. The [[mast|mainmast]] creaked companionably. Beyond the [[rail|rail]] the cove opened on the grey road to Stygia, and the cliff behind held the [[cave|cave]] they had come out of.' },
      { text: 'They came out of the rock onto a cliff ledge, and down a rope ladder onto the deck of the *Crimson Shrike*. She lay at anchor in a cove walled with black cliffs, her red sails furled, her deck littered with Ortho\'s empty bottles. At the [[helm|wheel]], one boot on a coil of rope, stood a broad man in a black coat with gold at his throat and a black sabre at his hip: [[ortho|Black Ortho]], smiling as if he had been expecting them, and as if he were glad.' },
    ],
    short: [
      { cond: F('ch2.ortho_beaten'), text: 'The Shrike\'s deck. The [[helm|wheel]], the [[mast|mast]], the [[rail|rail]], and the [[cave|cave]] in the cliff.' },
      { text: 'The Shrike\'s deck, and [[ortho|Black Ortho]] at the [[helm|wheel]].' },
    ],
    exits: [
      { dir: 'in', label: 'Back into the caves', names: ['cave', 'caves', 'hoard', 'back', 'ladder'], to: 'cav_hoard' },
      { dir: 'w', label: 'Row back to the docks', names: ['docks', 'row', 'harbour', 'gallows bay', 'town'], to: 'gal_docks', cond: F('ch2.ortho_beaten'),
        blocked: 'Black Ortho is between Kord and the boat, and he has not finished smiling.' },
      { dir: 'out', label: 'Set sail', names: ['set sail', 'sail', 'sea', 'stygia', 'open sea'], to: 'sea_deck',
        cond: F('ch2.sail_now'), seemsOpen: true,
        blocked: [{ cond: F('ch2.ready'), text: 'Valka is at the wheel before Kord has finished the thought.' }, { text: 'Valka looks up at the furled sails, and then at Kord.' }],
        blockedEffects: [{ cond: F('ch2.ortho_beaten'), effects: [{ dialogue: 'dlg_sail' }, { cond: F('ch2.sail_now'), effects: [{ goto: 'sea_deck' }] }] }] },
    ],
    onEnter: [
      { cond: NOT(F('ch2.ortho_beaten')), effects: [{ dialogue: 'dlg_ortho' }] },
      { cond: ALL(F('ch2.ortho_beaten'), F('ch2.crew_rallied'), NOT(F('ch2.crew_aboard'))), effects: [{ set: 'ch2.crew_aboard' },
        { text: 'The Shrike\'s crew are aboard, swarming the rigging, singing the terrible song about the Lady of the Waves. Mother Teg is cursing them all by name, lovingly, from the bow.' }] },
    ],
    shout: [
      { cond: F('ch2.ortho_beaten'), text: 'Kord roars from the deck of the Shrike. The cliffs throw it back three times, each one prouder. Valka laughs and roars with him.' },
      { text: 'Kord roars. Ortho winces, delicately. "Must you? Sound carries, on water."' },
    ],
    banter: {
      ain: { speaker: 'ain', text: '"I would prefer to stay on deck. Away from the water." A pause. "That is not possible on a ship. I am aware. I am stating a preference."' },
      valka: { cond: F('ch2.ortho_beaten'), speaker: 'valka', text: '"Feel her, Cimmerian. She\'s glad to have me back. Ships know." She pats the rail. "And I\'m glad to have her. Don\'t tell anyone I said that."' },
    },
    things: [
      { id: 'ortho', kind: 'npc', npc: 'ortho', sprite: { x: 160, y: 88 }, cond: NOT(F('ch2.ortho_beaten')),
        look: 'Black Ortho of Zingara: handsome gone to seed, a black beard oiled into ringlets, rings on every finger, a smile like a knife being sharpened in another room. The great black sabre at his hip is the only honest thing about him.',
        talk: 'dlg_ortho',
        take: 'Ortho steps aside from Kord\'s hand with a dancer\'s grace. "Not yet, friend. We\'ve not been introduced."',
        hit: { text: 'Kord answers with steel.', effects: [{ dialogue: 'dlg_ortho' }] } },
      { id: 'helm', kind: 'thing', name: 'the Shrike\'s wheel', names: ['wheel', 'helm', 'ship wheel', 'tiller', 'chart table'],
        hotspot: { x: 196, y: 62, w: 42, h: 66 },
        look: [
          { cond: F('ch2.chart_given'), text: 'The Shrike\'s wheel, and beside it the chart table with Ortho\'s sea-chart pinned flat. Valka has already drawn a line on it in red: straight for the Stygian coast.' },
          { cond: F('ch2.ortho_beaten'), text: 'The Shrike\'s wheel, spoked in black oak and worn pale by Valka\'s hands. Beside it, an empty chart table, waiting for a chart.' },
          { text: 'The wheel of the *Crimson Shrike*, with Black Ortho\'s boot on the coil of rope beside it as if he owned the place. He does not.' },
        ],
        take: [{ cond: F('ch2.ortho_beaten'), text: 'The wheel is Valka\'s. Kord would sooner take a she-wolf\'s cub.' }, { text: 'Ortho is standing at it.' }],
        hit: { text: 'Kord thumps the wheel. Valka thumps Kord. Order is restored.' },
        talk: { cond: F('ch2.ortho_beaten'), text: 'Valka, at the wheel, looks round.', effects: [{ dialogue: 'dlg_sail' }, { cond: F('ch2.sail_now'), effects: [{ goto: 'sea_deck' }] }] },
        use: {
          sea_chart: [
            { cond: NOT(F('ch2.ortho_beaten')), text: 'Ortho first. Then charts.' },
            { speaker: 'valka', text: 'Valka takes the chart from Kord as if it were made of glass, spreads it on the chart table and pins it with four daggers. "There. Now she knows where she\'s going."', effects: [{ take: 'sea_chart', quiet: true }, { set: 'ch2.chart_given' }] },
          ],
          self: [{ cond: F('ch2.ortho_beaten'), text: 'Kord puts his hands on the wheel.', effects: [{ dialogue: 'dlg_sail' }, { cond: F('ch2.sail_now'), effects: [{ goto: 'sea_deck' }] }] }, { text: 'Ortho is standing at it.' }],
          '*': { text: 'The wheel steers. The {item} does not help.' },
        } },
      { id: 'mast', kind: 'thing', name: 'mainmast', names: ['mast', 'mainmast', 'sails', 'rigging', 'yards'],
        hotspot: { x: 210, y: 0, w: 30, h: 60 },
        look: 'A mast of Argossean pine as thick as a temple column, red sails furled on her yards. Gulls sit on the crosstrees and judge everyone below.',
        take: 'Kord climbs a few feet up the rigging, looks down at the deck, and climbs back. Cimmerians climb mountains. Mountains hold still.',
        hit: 'Kord slaps the mast. High above, a gull loses its footing and says something unrepeatable.' },
      { id: 'rail', kind: 'thing', name: 'rail', names: ['rail', 'side', 'gunwale', 'water', 'cove'],
        hotspot: { x: 100, y: 108, w: 110, h: 30 },
        look: [
          { cond: F('ch2.ortho_beaten'), text: 'Over the rail, a long way down, green water, and in it nothing: no Ortho, no bubbles. Barachans say a Zingaran floats like a cork, being mostly wind. Valka says she will believe he is dead when she has his head on her bowsprit.' },
          { text: 'Green water, a long way down, and the black cliffs all round. No way out but the sea-mouth or Ortho.' },
        ],
        take: 'Kord leans on the rail instead. It takes him.',
        hit: 'Kord thumps the rail. Ain, floating beside him, edges away from the water and says nothing.' },
      { id: 'cave', kind: 'thing', name: 'cave in the cliff', names: ['cave', 'cliff', 'cliffs', 'ladder', 'rope ladder'],
        hotspot: { x: 40, y: 84, w: 90, h: 40 },
        look: 'The cave mouth in the cliff and the rope ladder down from it. Ortho\'s private road to his hoard, now Kord\'s.',
        take: 'Kord does not need the ladder; he needs to remember it.',
        hit: 'Kord punches the air in the direction of the cliff. It is a long way off and a long way up.' },
      { id: 'teg', kind: 'npc', npc: 'teg', sprite: { x: 252, y: 90 }, cond: ALL(F('ch2.crew_rallied'), F('ch2.ortho_beaten')),
        look: 'Mother Teg in the bows, coiling a line and cursing a deckhand, happy as a gull in a gale.',
        talk: 'dlg_gull_teg',
        take: 'Teg is ballast. She stays.',
        hit: { speaker: 'teg', text: '"Lay a hand on me on my own deck and you\'ll be swimming to Stygia."' } },
    ],
  },

  // ============================================================ NIGHT ON THE OPEN SEA
  sea_deck: {
    name: 'Night on the Open Sea', bg: 'bg/sea-deck', music: 'gallows', ambience: 'loop-sea', machine: false,
    map: { x: 3, y: 2 }, mapName: 'Open Sea',
    fx: [{ type: 'torch', x: 52, y: 102, r: 26 }, { type: 'torch', x: 268, y: 102, r: 26 }, { type: 'vignette', a: 0.35 },
      { type: 'motes', n: 30, cond: F('ch2.sea_glow') }],
    glints: [
      { x: 20, y: 82, r: 8, period: 90, cond: F('ch2.sea_glow') }, { x: 52, y: 88, r: 8, period: 110, phase: 30, cond: F('ch2.sea_glow') },
      { x: 88, y: 80, r: 8, period: 100, phase: 50, cond: F('ch2.sea_glow') }, { x: 120, y: 86, r: 8, period: 80, phase: 10, cond: F('ch2.sea_glow') },
      { x: 152, y: 82, r: 8, period: 120, phase: 70, cond: F('ch2.sea_glow') }, { x: 186, y: 88, r: 8, period: 95, phase: 20, cond: F('ch2.sea_glow') },
      { x: 220, y: 80, r: 8, period: 105, phase: 60, cond: F('ch2.sea_glow') }, { x: 254, y: 86, r: 8, period: 85, phase: 40, cond: F('ch2.sea_glow') },
      { x: 288, y: 82, r: 8, period: 115, phase: 5, cond: F('ch2.sea_glow') }, { x: 310, y: 88, r: 8, period: 90, phase: 80, cond: F('ch2.sea_glow') },
      { x: 140, y: 76, pair: 14, steady: true, a: 0.9, cond: F('ch2.sea_glow') },
    ],
    desc: 'Night on the open sea. The Shrike ran south under a sky crowded with stars, her wake a pale road behind her, the coast of the Barachans long gone. The sea was flat as a coin and black as a well. At the [[rail|rail]] Valka stood with the wind in her braid; at the stern, Toktai sat with a [[line|fishing line]] over the side. The [[lanterns|lanterns]] swung, and the crew sang low on the foredeck, and the [[moon|moon]] was a thin bright sickle in the west.',
    short: 'The Shrike\'s deck at night. The [[rail|rail]], Toktai\'s [[line|line]], the [[lanterns|lanterns]], the [[moon|moon]].',
    exits: [],
    onEnter: [{ cond: NOT(F('ch2.at_sea')), effects: [{ set: 'ch2.at_sea' }, { scene: 'sc_night' }] }],
    onAction: { count: 4, cond: NOT(F('ch2.vow_done')), effects: [NIGHT] },
    onIdle: { seconds: 40, cond: NOT(F('ch2.vow_done')), effects: [NIGHT] },
    shout: { text: 'Kord shouts at the stars, for no reason except that there is nobody to stop him. The crew cheer. The sea swallows the sound whole, as if it were hungry.' },
    banter: {
      valka: { cond: NOT(F('ch2.vow_done')), speaker: 'valka', text: '"Come here, Cimmerian. Lean on the rail with me. It\'s the only time a pirate is ever quiet."', effects: [NIGHT] },
      toktai: { speaker: 'toktai', text: '"I have caught nothing. There is a saying about fish that bite at night: they have no friends. These fish are very popular."' },
      ain: { speaker: 'ain', text: '"It is beautiful. The stars, the dark water." A pause. "I wish it were not so deep."' },
    },
    things: [
      { id: 'rail', kind: 'thing', name: 'rail', names: ['rail', 'side', 'gunwale'],
        hotspot: { x: 70, y: 104, w: 180, h: 26 },
        look: { text: 'Valka leans on the rail, looking at nothing, which for her is unusual. She glances back at Kord, and tips her head: here.', effects: [NIGHT] },
        talk: { text: 'Kord goes to the rail and leans beside her.', effects: [NIGHT] },
        use: { self: { text: 'Kord goes to the rail and leans beside her.', effects: [NIGHT] } },
        take: 'Kord leans on the rail. It is as close as a man comes to taking one.',
        hit: 'Kord thumps the rail. Valka raises an eyebrow. "Feeling poetic, are we?"' },
      { id: 'line', kind: 'thing', name: 'fishing line', names: ['line', 'fishing line', 'toktai', 'stern', 'fish'],
        hotspot: { x: 270, y: 106, w: 48, h: 36 },
        look: 'Toktai sits on a coil of rope at the stern, line over the side, patient as a heron. He has caught nothing. He looks as if catching nothing were the point.',
        talk: { speaker: 'toktai', text: '"Shh. You will frighten the fish." A pause. "There are no fish. Something has frightened them already. Something big."' },
        take: { speaker: 'toktai', text: '"Get your own line, Cimmerian. This one has my luck on it."' },
        hit: { speaker: 'toktai', text: '"Strike my line and I will put a hook in your ear. On the steppe that is a compliment. Mostly."' } },
      { id: 'lanterns', kind: 'thing', name: 'lanterns', names: ['lanterns', 'lantern', 'lights', 'lamps'],
        hotspot: { x: 40, y: 88, w: 24, h: 26 },
        look: 'Ship\'s lanterns, swinging gold in the dark. Their light makes a small warm room on the deck, and outside it the night goes on forever in every direction, down as well as out.',
        take: 'Teg would have something to say about that. Teg has something to say about everything.',
        hit: 'Kord taps a lantern. It swings, and the shadows of the rigging swing with it, like a cage being rocked.' },
      { id: 'moon', kind: 'thing', name: 'moon', names: ['moon', 'stars', 'sky', 'night'],
        hotspot: { x: 252, y: 12, w: 20, h: 22 },
        look: 'A thin moon, waning toward dark. Ain looks at it a long time. "The dark of the moon is in a few nights," it says, as if the words had been waiting in it for somebody to ask.',
        take: 'Kord reaches for the moon. It is further than it looks. Everything worth having is.',
        hit: 'Kord shakes his fist at the moon. It has been shaken at before. It is still there.' },
    ],
  },
};

// ---------------------------------------------------------------- dialogues
export const dialogues = {
  // ---- Valka's challenge (before the duel)
  dlg_valka_duel: { start: 'n0', nodes: {
    n0: { speaker: 'valka', text: '"A Cimmerian. I\'ve heard of Cimmerians. Big, gloomy, and they fight like a rockfall. Let\'s see whether Cimmeria breeds men or goats."',
      choices: [
        { text: '"Men."', next: 'n_men' },
        { text: '"I don\'t cross steel with women."', next: 'n_women' },
        { text: '"Toktai. She\'s yours."', next: 'n_toktai' },
      ] },
    n_men: { speaker: 'valka', text: '"Big men, anyway. We\'ll see about the rest." She draws her cutlass and flicks the point at his chin. "First to bleed enough loses. Nobody dies. I need my tables."', next: 'n_fight' },
    n_women: { speaker: 'valka', text: 'The cutlass is in her hand before the word is out of his mouth. "There. Now I\'m not a woman, I\'m a woman with a sword. Different animal entirely."', next: 'n_fight' },
    n_toktai: { speaker: 'toktai', text: 'Toktai, already backing toward the bar: "My ancestors had one rule: never fight a woman who has just thrown a man through a window. I am honouring my ancestors."', next: 'n_toktai2' },
    n_toktai2: { speaker: 'valka', text: '"Your friend\'s wise. Your friend can watch." She draws. "You, though. You\'re mine."', next: 'n_fight' },
    n_fight: { text: 'The tables clear themselves the way tables do in Gallows Bay: fast, and with the drinks held high. The crew by the wall start taking bets. Not one of them bets against their captain.',
      effects: [{ battle: 'e2_duel' }, { scene: 'sc_duel_after' }], next: null },
  } },

  // ---- Pellam the barkeep
  dlg_barkeep: { start: 'n0', nodes: {
    n0: { speaker: 'barkeep', again: '"Anything else, or are you just holding the bar up?"', text: '"Rum\'s five. Beds are ten. Breakages are whatever I say they are, and I\'m saying them to the captain."',
      choices: [
        { text: '"A bottle of Kill-Devil." (5 silver)', cond: { gold: { gte: 5 } }, effects: [{ gold: -5 }, { give: 'kill_devil_rum' }], next: 'n_rum' },
        { text: '"A bottle of Kill-Devil."', cond: NOT({ gold: { gte: 5 } }), next: 'n_broke' },
        { text: 'Let me see what you\'ve got.', effects: [{ shop: 'barkeep' }], next: 'n0' },
        { text: '"I need a bed."', next: 'n_bed' },
        { text: '"Who was the man she threw out of the window?"', cond: F('ch2.valka_joined'), hideIfDone: true, next: 'n_window' },
        { text: '"Is it true rum cleans anything?"', hideIfDone: true, next: 'n_clean' },
        { text: 'Nothing.', next: null },
      ] },
    n_rum: { speaker: 'barkeep', text: '"Kill-Devil. Distilled from cane, sea-water and spite. Drink it, rub it in a wound, scrub a deck with it, light a lamp with it. Just don\'t do all four on the same night."', next: 'n0' },
    n_broke: { speaker: 'barkeep', text: '"Five silver. I can see your purse from here, friend. So can everyone else."', next: 'n0' },
    n_bed: { speaker: 'barkeep', text: '"Ten silver a head, the loft upstairs, hammocks and all. Say the word." (Rest is in the tray.)', next: 'n0' },
    n_window: { speaker: 'barkeep', text: '"Zingaran. One of Ortho\'s. He came in to tell her Ortho sent his regards. She sent them back. Through the window. I\'m charging Ortho for the glass."', next: 'n0' },
    n_clean: { speaker: 'barkeep', text: '"Takes tar off a deck, blood off a knife and the paint off a door. Old Gilbo up the lighthouse swears by it for glass. Swears by it for everything, Gilbo."', next: 'n0' },
  } },

  // ---- Mother Teg and the crew
  dlg_gull_teg: { start: 'n_aboard', nodes: {
    n_aboard: { cond: F('ch2.crew_rallied'), else: 'n0', speaker: 'teg', text: [
      { cond: F('ch2.ortho_beaten'), text: '"We sail when the captain says, and not before. And not after. Mostly not after. The Lady\'s with us, big man. I saw her with these eyes."' },
      { text: '"We\'re ready, lad. The Lady\'s with us. Now get our ship back off that Zingaran slug, and we\'ll be aboard by the next tide."' }],
      next: null },
    n0: { speaker: 'teg', again: '"Anything else, lad? We\'re still not sailing."', text: '"We\'ll not sail. Three ships swallowed whole this month: the *Kestrel*, the *Red Hind*, the *Merry Widow*. Swallowed, lad, hull and mast. The Wyrm\'s out there, and we\'re in here, and here is where we\'ll stay."',
      choices: [
        { text: '"What would change your mind?"', cond: NOT(F('ch2.crew_asked')), next: 'n_sign' },
        { text: '"Remind me what you want."', cond: F('ch2.crew_asked'), next: 'n_remind' },
        { text: '"Ain has a sign for you."', cond: ALL(F('ch2.crew_asked'), F('ch2.ain_woken')), next: 'n_mirage' },
        { text: '"Tell me about the Wyrm."', next: 'n_wyrm' },
        { text: '"Valka says you\'re frightened."', hideIfDone: true, next: 'n_fright' },
        { text: 'Leave.', next: null },
      ] },
    n_sign: { speaker: 'teg', text: '"A sign. From the sea, mind, not from some priest with his hand out. Show us the sea\'s on our side, and we\'ll follow her into Set\'s own mouth."', next: 'n_sign2' },
    n_sign2: { speaker: 'valka', text: '"They want a miracle. I\'m fresh out."', next: 'n_sign3' },
    n_sign3: { speaker: 'ain', text: [
      { cond: F('ch2.ain_woken'), text: '"I could make one. I have the power now: the lens fed me well. Light, shaped. Let me show them."' },
      { text: '"I could make one. If I had power. Light, a great deal of it, focused." A pause. "At the moment I could barely make a candle blush."' }],
      next: 'n_sign4' },
    n_sign4: { speaker: 'toktai', text: [
      { cond: F('ch2.ain_woken'), text: '"Then make one, stone. A saddled horse is meant to be ridden."' },
      { text: '"Light, focused. There is a lighthouse on the point with a great glass in it, dark these ten years. You want fire? Go where fire used to live."' }],
      effects: [{ set: 'ch2.crew_asked' }, { cond: NOT(F('ch2.gilbo_passed')), effects: [{ objective: { id: 'ch2_lighthouse', to: 'active' } }] }], next: 'n0' },
    n_remind: { speaker: 'teg', text: [
      { cond: F('ch2.ain_woken'), text: '"A sign from the sea. And your little stone there looks fit to burst with something. Well?"' },
      { text: '"A sign from the sea, lad. And not one you bought in the market. The only light this harbour ever had is Gilbo\'s, up the lighthouse, and that\'s been dark ten years."' }],
      next: 'n0' },
    n_wyrm: { speaker: 'teg', text: '"Nobody\'s seen it close and come back talking. Fishermen say it leaves a wake straight as a rope pulled tight, and no beast swims straight. Two lights under the water, like moons drowned. And the *Red Hind*\'s jolly-boat drifted in last week with four lads sitting up in it, eyes open, breathing, still as carvings. Never said a word since. Never ate. Just sit there, humming."', next: 'n0' },
    n_fright: { speaker: 'teg', text: '"Frightened? Course we\'re frightened. Fear\'s what keeps a sailor alive. It\'s only the dead ones that weren\'t." She drinks. "Tell the captain that, with my love."', next: 'n0' },
    n_mirage: { speaker: 'ain', text: '"Gather them by the window, please. Where the sea can see."', effects: [{ scene: 'sc_mirage' }], next: null },
  } },

  // ---- the pirates' table (the Articles argument; second clue for Gilbo's quiz)
  dlg_pirates: { start: 'n0', nodes: {
    n0: { speaker: 'pirates', again: 'The argument starts again from the top. "Well?" says one. "Settle it, door."', text: 'Four rovers are three cups into an argument about the Articles of the Brotherhood, and have lost track of which side they are on. "Ask him," says one, pointing at Kord. "He looks impartial. He looks like a door."',
      choices: [
        { text: '"What does a Brother owe his captain?"', next: 'n_owe' },
        { text: '"Who decides where the ship sails?"', next: 'n_course' },
        { text: '"Who goes first over the rail?"', next: 'n_plank' },
        { text: '"What are the Articles, anyway?"', next: 'n_what' },
        { text: 'Leave them to it.', next: null },
      ] },
    n_owe: { speaker: 'pirates', text: '"His life!" says a one-eyed Argossean. A Shemite woman cuffs him round the head. "His life\'s his own, fool, that\'s the whole point of being a Brother. The captain gets your blade in the fight and your vote at the mast. That\'s all. Anything more and you\'re a slave with a nicer hat."', next: 'n0' },
    n_course: { speaker: 'pirates', text: '"The captain picks the course!" "And who picked the captain?" "We did." "How?" "By vote..." "So who picks the course?" A long, beery silence. "...Oh. Us. By vote." "Thank you."', next: 'n0' },
    n_plank: { speaker: 'pirates', text: '"The youngest, to blood him." "The youngest is too busy puking over the side. No: it\'s whoever asked for the biggest share. You want the most, you go first onto the plank. Want more, risk more. That\'s the Articles, and that\'s why Wenna\'s never been first over a rail in her life." "I resent that." "You\'ve never asked for more than a half-share." "I resent that less."', next: 'n0' },
    n_what: { speaker: 'pirates', text: '"The Articles? What makes us Brothers and not slaves, big man. Free men, sharing alike, voting on everything. Captain, course, dinner. Write that on your arm, and you\'ll pass old Gilbo\'s questions up the lighthouse. He asks everyone. Nobody passes. Nobody listens."', next: 'n0' },
  } },

  // ---- One-Ear Dash
  dlg_dash: { start: 'n0', nodes: {
    n0: { speaker: 'dash', again: '"♪ ...and the drink had a drink... ♪ Eh? Still here, big lad?"', text: '"♪ Oh the Wyrm ate the Kestrel, the Hind and the Widow, and Dash had a drink, and the drink had a... ♪ Eh? Oh, it\'s you. Big lad. Buy Dash a drink?"',
      choices: [
        { text: '"What\'s rum good for?"', next: 'n_rum' },
        { text: '"Where would Ortho hide a stolen ship?"', next: 'n_ortho' },
        { text: '"Tell me about the Wyrm."', next: 'n_wyrm' },
        { text: '"Sing something."', hideIfDone: true, next: 'n_sing' },
        { text: '"I hear you\'ve a scrap of old parchment."', cond: ALL({ objective: 'sq2_articles' }, NOT(F('ch2.art_a_won'))), next: 'n_bet' },
        { text: 'Leave.', next: null },
      ] },
    n_bet: { speaker: 'dash', text: [
      { cond: F('ch2.art_swapped'), text: '"Back for another go, big lad? Same stakes: my parchment against ten of your silver. Dash never loses." He rattles the dice, which are now, unknown to Dash, Kord\'s.' },
      '"This?" Dash pulls a scrap of tarred parchment from his shirt, signed in something brown. "Lucky piece. Found it in a dead man\'s boot. Play you for it: my parchment against ten of your silver, one throw of the bones. Dash never loses."'],
      choices: [
        { text: 'Throw the bones. (10 silver)', cond: { gold: { gte: 10 } }, next: 'n_throw' },
        { text: '"Not now."', next: 'n0' },
      ] },
    n_throw: { cond: F('ch2.art_swapped'), else: 'n_lose', text: 'Dash throws: two, three. He frowns. Kord throws: six and six. Dash looks at the dice for a long time. "Fair\'s fair," he says at last, and hands over the parchment. "...Was it fair?" Toktai, from somewhere behind Kord: "Now it was."',
      effects: [{ set: 'ch2.art_a_won' }, { give: 'articles_a' }], next: 'n0' },
    n_lose: { text: 'Kord throws: three and four. Dash throws: six and six. "Dash never loses," says Dash, and pockets ten of Kord\'s silver. Kord looks at Dash\'s dice. One face of each is worn smoother than the others. Dash\'s dice have opinions.',
      effects: [{ gold: -10 },
        { cond: { inParty: 'toktai' }, speaker: 'toktai', text: 'Toktai, very quietly: "Loaded. Cheat a cheater, Cimmerian; on the steppe we call that weather. We need dice that lie better than his. Find me some, and keep him talking."' }], next: 'n0' },
    n_rum: { speaker: 'dash', text: '"Rum? Rum\'s for drinking, and for cleaning glass, and for cleaning wounds. In that order. The Gull sells Kill-Devil, five silver the bottle. Take the salt off a window and the skin off your tongue, Kill-Devil."', next: 'n0' },
    n_ortho: { speaker: 'dash', text: 'Dash taps his nose, which is mostly broken. "The old smugglers\' caves, under Gallows Hill. Brandy-runners dug \'em, Ortho found \'em. There\'s a stair down by the gibbet. They say there\'s water in there that comes and goes, and a gate, and a cove at the far end you can\'t see from the sea. That\'s where she\'ll be. The Shrike."', next: 'n0' },
    n_wyrm: { speaker: 'dash', text: '"Seen it, I have. Well. Seen its eyes. Out past the point, a calm night: two lights coming up under the water, big as moons, the colour of shallow sea over white sand. And a wake as straight as a ruler. Then the *Merry Widow* wasn\'t there no more. It doesn\'t eat \'em, you know. The men. It keeps \'em."', next: 'n0' },
    n_sing: { speaker: 'dash', text: '"♪ Oh, Red Valka\'s a terror, and Black Ortho\'s a thief, and Dash had a wife once, but now he\'s got... grief... ♪" He waits for applause. The tavern waits for him to stop. Valka, in the corner, throws a cup at him. Dash catches it, and drinks what was in it.', next: 'n0' },
  } },

  // ---- Gilbo and the Articles quiz (every answer logical; a joke for every decoy)
  dlg_gilbo: { start: 'n_passed', nodes: {
    n_passed: { again: '"What else, Brother? Mind the leg."', cond: F('ch2.gilbo_passed'), else: 'n0', speaker: 'gilbo', text: '"Brother! Mind my lens. Mind my stair. Mind my leg, I\'ve only the one."',
      choices: [
        { text: '"How do I clean the lens?"', cond: NOT(F('ch2.lens_clean')), next: 'n_clean' },
        { text: '"Tell me about the Wyrm."', next: 'n_wyrm' },
        { text: '"How did you lose the leg?"', hideIfDone: true, next: 'n_leg' },
        { text: '"You and your Articles."', cond: ALL(NOT({ objective: 'sq2_articles' }), NOT({ objective: 'sq2_articles', is: 'done' })), next: 'n_art' },
        { text: '"Your Articles, Gilbo. And the seals."', cond: { has: 'seal_box' }, next: 'n_art_back' },
        { text: 'Leave.', next: null },
      ] },
    n_art: { speaker: 'gilbo', text: '"Mine? They\'re everybody\'s, lubber, that\'s the point." He spits. "But they vote by a copy now. Ortho\'s crowd rewrote it in their own hand, and every clause that stood in their way went missing. The originals were signed in tar and blood by the first captains of the Coast, and when the Brotherhood went bad, the last honest one tore them in three and hid them, and a chart to the seals with them. Bring \'em back and I\'ll nail \'em to the Gull\'s door, and the next time Ortho\'s lot quote me a clause I\'ll show \'em the blood it was signed in."', next: 'n_art2' },
    n_art2: { speaker: 'gilbo', text: '"Three pieces. One\'s gone round the taverns as somebody\'s lucky charm. One went up the hill with a gull that steals anything that shines or rustles. And one\'s on some tradesman\'s wall, for all I know, holding up a plan." He sniffs. "Brothers don\'t throw away paper."',
      effects: [{ objective: { id: 'sq2_articles', to: 'active' } },
        { cond: { inParty: 'valka' }, speaker: 'valka', text: '"The originals?" Valka\'s eyes light up like a sacked city. "I\'d give my good earring to watch Ortho\'s bosun read them."' }], next: 'n_passed' },
    n_art_back: { speaker: 'gilbo', text: 'Gilbo takes the tarred box in both hands, and the Articles after it, and reads the first line, and the second, and then he cannot read any more for a while. "Brother," he says thickly, "you\'ve no idea. You\'ve no idea at all."',
      effects: [{ take: 'seal_box', quiet: true }, { cond: { has: 'drowned_articles' }, effects: [{ take: 'drowned_articles', quiet: true }] }, { set: 'ch2.art_returned' }, { give: 'old_mercy' },
        { objective: { id: 'sq2_articles', to: 'done' } }], next: 'n_art_back2' },
    n_art_back2: { speaker: 'gilbo', text: '"They\'ll be on the Gull\'s door by nightfall, with a nail through every captain\'s name. And this is for the lass with the red hair, who knows the Articles better than I do and won\'t admit it. Old Mercy. She\'s cut more bad captains than you\'ve had hot dinners."', next: 'n_passed' },
    n_clean: { speaker: 'gilbo', text: '"Salt comes off with rum. Everything comes off with rum. I\'d do it myself, but I drink it before it gets there. The Gull sells Kill-Devil; it\'s the only thing in this town stronger than the salt."', next: 'n_passed' },
    n_wyrm: { speaker: 'gilbo', text: '"Saw it once, from up here, a night like black glass. A wake across the bay straight as a rule, and two lights under the water, the colour of shallow sea over white sand. Next morning the *Kestrel* was gone. Thirty years I sailed, Brother. I\'ve seen serpents and krakens and a Vendhyan admiral sober. Nothing living swims that straight."', next: 'n_passed' },
    n_leg: { speaker: 'gilbo', text: '"Shark took it, off Messantia. I took the shark. Ate it, too. So, in a manner of speaking, I got the leg back."', next: 'n_passed' },
    n0: { speaker: 'gilbo', again: '"Well, lubber? Brother, or just big?"', text: '"Avast there! Nobody climbs to my lens but a true Brother of the Coast. Are you a Brother, lubber, or just big?"',
      choices: [
        { text: '"I\'m a Brother. Test me."', next: 'n_test' },
        { text: '"What\'s a Brother of the Coast?"', next: 'n_what' },
        { text: '"Valka, tell me about the Articles."', cond: { inParty: 'valka' }, next: 'n_valka' },
        { text: '"Why guard a dead lamp?"', hideIfDone: true, next: 'n_why' },
        { text: 'Leave.', next: null },
      ] },
    n_what: { speaker: 'gilbo', text: '"A free man of the sea, sworn to the Articles. Free, mind. No king, no master, no owner. Everything voted, everything shared. If you\'ve to ask, you\'re not one, but I\'ll test you anyway. I\'ve not had a visitor in a month."', next: 'n0' },
    n_valka: { speaker: 'valka', text: '"The Articles? We vote on everything. Course, captain, dinner. No man owns a Brother. The more you want, the more you risk." She winks at Gilbo. "He knows them better than I do. He just likes watching people fail."', next: 'n0' },
    n_why: { speaker: 'gilbo', text: '"Dead? She\'s sleeping. Lens is crusted blind with salt, and the lamp\'s cold, but one day a Brother will come up my stair worth lighting her for. Until then I keep the lubbers off her."', next: 'n0' },
    n_test: { speaker: 'gilbo', text: '"Three questions on the Articles. Get one wrong, and it\'s back to the start, and I\'ve all day and one leg and no patience."', next: 'q1' },
    q1: { speaker: 'gilbo', text: '"First. What does a Brother owe his captain?"',
      choices: [
        { text: '"His life."', next: 'w1a' },
        { text: '"His blade and his vote, and nothing else."', next: 'q2' },
        { text: '"His share."', next: 'w1b' },
        { text: '"I\'ll come back."', next: null },
      ] },
    w1a: { speaker: 'gilbo', text: '"His life? That\'s a slave you\'re describing. Or a husband. Wrong! From the top."', next: 'q1' },
    w1b: { speaker: 'gilbo', text: '"His share? Then why\'d he sail, for the view? Wrong! From the top."', next: 'q1' },
    q2: { speaker: 'gilbo', text: '"Hm. Aye. Second. Who decides where the ship sails?"',
      choices: [
        { text: '"The captain."', next: 'w2a' },
        { text: '"The gods."', next: 'w2b' },
        { text: '"The crew, by vote."', next: 'q3' },
      ] },
    w2a: { speaker: 'gilbo', text: '"Hah! And who decides who\'s captain, the parrot? Wrong! From the top."', next: 'q1' },
    w2b: { speaker: 'gilbo', text: '"The gods get seasick, lubber. Wrong! From the top."', next: 'q1' },
    q3: { speaker: 'gilbo', text: '"Hmph. Third, and mind it. Who stands first on the boarding plank?"',
      choices: [
        { text: '"The captain."', next: 'w3a' },
        { text: '"The one who asked for the biggest share."', next: 'n_pass' },
        { text: '"The youngest."', next: 'w3b' },
      ] },
    w3a: { speaker: 'gilbo', text: '"Captain\'s busy steering, and paying for the rum. Wrong! From the top."', next: 'q1' },
    w3b: { speaker: 'gilbo', text: '"The youngest is busy being sick over the rail. Wrong! From the top."', next: 'q1' },
    n_pass: { speaker: 'gilbo', text: 'Gilbo stares at Kord for a long moment. Then he sticks out a hand like a knot of old rope. "Well, blow me down and fish me up. A Brother. And a big one."', sfx: 'puzzle',
      effects: [{ set: 'ch2.gilbo_passed' }, { objective: { id: 'ch2_lighthouse', to: 'done' } }, { objective: { id: 'ch2_lens', to: 'active' } }], next: 'n_pass2' },
    n_pass2: { speaker: 'gilbo', text: '"Go on, then, look at her. My lens. Blind as a dead gull\'s eye, these ten years: salt. Salt comes off with rum, mind. Everything comes off with rum."', next: null },
  } },

  // ---- Marrow the shipwright
  dlg_chandler: { start: 'n0', nodes: {
    n0: { speaker: 'chandler', again: '"Anything else? I\'ve a shop to run."', text: '"Coats, steel, rope, bows, and a hull if you\'ve a year to wait. I buy what floats and what cuts. What\'s it to be?"',
      choices: [
        { text: 'Show me your wares.', effects: [{ shop: 'chandler' }], next: 'n0' },
        { text: '"That tarred scrap pinned among your plans."', cond: ALL({ objective: 'sq2_articles' }, NOT(F('ch2.art_c_got'))), next: 'n_scrap' },
        { text: '"Have you seen the Shrike?"', next: 'n_shrike' },
        { text: '"What do you know about the Wyrm?"', next: 'n_wyrm' },
        { text: 'Leave.', next: null },
      ] },
    n_scrap: { speaker: 'chandler', text: '"That? Old Brotherhood writing, tar and blood. Pretty hand. I keep it for luck." Marrow taps a pencil on his teeth. "But I\'ve a figurehead wants a crown, and a crown wants a plume, and there\'s only one plume on this coast fit for it: the Great Gull\'s. Bring me that feather and the scrap\'s yours. Or coin, if you\'ve no feather. Sixty silver."',
      choices: [
        { text: 'Give him the Great Gull\'s feather.', cond: { has: 'gull_feather' }, effects: [{ take: 'gull_feather' }, { set: 'ch2.art_c_got' }, { give: 'articles_c' }, { text: 'Marrow plucks the feather from Kord\'s hand. "You\'ll not be wearing that again." He unpins the scrap and hands it over.' }], next: 'n0' },
        { text: 'Pay sixty silver.', cond: { gold: { gte: 60 } }, effects: [{ gold: -60 }, { set: 'ch2.art_c_got' }, { give: 'articles_c' }], next: 'n0' },
        { text: '"Not now."', next: 'n0' },
      ] },
    n_shrike: { speaker: 'chandler', text: '"Saw her slip out past the point the night Ortho took her, no lights, heading round the back of Gallows Hill. There\'s nothing round there but cliffs. And the old smugglers\' caves, if you believe in those."', next: 'n0' },
    n_wyrm: { speaker: 'chandler', text: '"I know it doesn\'t chew. The *Kestrel*\'s figurehead floated in without a toothmark on it, and that\'s good oak, that\'d show a bite. Whatever took her swallowed her whole and careful. Like a man pocketing a coin."', next: 'n0' },
  } },

  // ---- Black Ortho's offer, then the boss fight
  dlg_ortho: { start: 'n0', nodes: {
    n0: { speaker: 'ortho', text: [
      { cond: F('ch2.ortho_offered'), text: '"Back again, Cimmerian? Good. A man should sleep on an offer like mine. Well?"' },
      { text: '"Red Valka! My dear. You look well, for a woman without a ship." His eyes slide to Kord, and weigh him like a purse. "And you\'ve brought a bear. A bear with sense, I hope. Cimmerian, a word between men of the world."' }],
      choices: [
        { text: '"Speak."', cond: NOT(F('ch2.ortho_offered')), next: 'n_offer' },
        { text: '"I\'ve sold my sword. Never my friends."', cond: F('ch2.ortho_offered'), next: 'n_refuse' },
        { text: '"Half? Done."', cond: F('ch2.ortho_offered'), next: 'n_pretend' },
      ] },
    n_offer: { speaker: 'ortho', text: '"Half the Shrike. Half the plunder in that cave, and it is a great deal of plunder. All you do is stand aside while my lads and I settle with the lady. She\'d do the same to you, friend. They all would. That\'s the sea."', effects: [{ set: 'ch2.ortho_offered' }], next: 'n_offer2' },
    n_offer2: { speaker: 'valka', text: 'Valka doesn\'t even look at Kord. "Go on, Cimmerian. Half\'s a good price. I\'d think about it."',
      choices: [
        { text: '"I\'ve sold my sword. Never my friends."', next: 'n_refuse' },
        { text: '"Half? Done."', next: 'n_pretend' },
        { text: '"Which half?"', hideIfDone: true, next: 'n_which' },
      ] },
    n_which: { speaker: 'ortho', text: '"The half that floats, friend. Ha! No, no. The better half. My half. Whatever you like." He spreads ringed hands. "I am a generous man, with other people\'s ships."', next: 'n_offer2' },
    n_refuse: { speaker: 'kord', text: '"I\'ve sold my sword. Never my friends."', next: 'n_refuse2' },
    n_refuse2: { speaker: 'ortho', text: 'Ortho sighs, as if Kord had disappointed him personally, and draws the great black sabre. "Pity. I\'d have liked a bear. Lads!" Two cutthroats drop out of the rigging onto the deck.', next: 'n_fight' },
    n_pretend: { speaker: 'kord', text: '"Half? Done."', effects: [{ set: 'ch2.ortho_pretend' }], next: 'n_pretend2' },
    n_pretend2: { speaker: 'ortho', text: '"A man of the world!" Ortho throws his arms wide, laughing, and turns his back on Kord to face Valka. "You see, my dear? Everyone has a price. Even bears." Behind him there is the long cold whisper of a sword leaving its scabbard.', next: 'n_pretend3' },
    n_pretend3: { speaker: 'kord', text: '"I lied. It\'s a civilised habit. I picked it up here."', next: 'n_pretend4' },
    n_pretend4: { speaker: 'ortho', text: 'Ortho spins, quick for a fat man, the black sabre already in his hand. "Barbarian! Lads!" Two cutthroats drop out of the rigging onto the deck.', next: 'n_fight' },
    n_fight: { text: 'Valka laughs like a knife coming out, and draws. "Now THAT\'s an answer."',
      effects: [{ battle: 'e2_ortho' }, { scene: 'sc_ortho_after' }], next: null },
  } },

  // ---- Set sail (the confirm)
  dlg_sail: { start: 'n_ready', nodes: {
    n_ready: { cond: F('ch2.ready'), else: 'n_not', speaker: 'valka', text: [
      { cond: { has: 'sea_chart' }, text: 'Valka holds out her hand, and Kord gives her Ortho\'s chart. She spreads it on the chart table and pins it with four daggers. "Now she knows where she\'s going." Then, at the wheel: "Set sail? There\'s no coming back for whatever you forgot to buy."' },
      { text: '"Set sail? There\'s no coming back for whatever you forgot to buy."' }],
      effects: [{ cond: { has: 'sea_chart' }, effects: [{ take: 'sea_chart', quiet: true }, { set: 'ch2.chart_given' }] },
        { cond: { objective: 'sq2_articles' }, speaker: 'valka', text: '"And Gilbo\'s old papers stay ashore if we go. Just saying. I\'m not sentimental."' }],
      choices: [
        { text: '"Set sail."', effects: [{ set: 'ch2.sail_now' }, { objective: { id: 'ch2_sail', to: 'done' } }, { objective: { id: 'sq2_articles', to: 'closed' } },
          ...['articles_a', 'articles_b', 'articles_c', 'articles_ab', 'drowned_articles', 'seal_box', 'loaded_dice'].map(id => ({ cond: { has: id }, effects: [{ take: id, quiet: true }] }))], next: 'n_go' },
        { text: '"Not yet."', next: 'n_wait' },
      ] },
    n_go: { speaker: 'valka', text: '"Up anchor! Loose the topsails! Teg, if that song starts again I\'ll have you keelhauled!" The Shrike shakes out her red sails, leans to the wind like a hound slipping its leash, and runs for the open sea.', sfx: 'puzzle', next: null },
    n_wait: { speaker: 'valka', text: '"Don\'t be long. The tide waits for no one, and neither do I. Usually."', next: null },
    n_not: { speaker: 'valka', text: [
      { cond: NOT(F('ch2.crew_rallied')), text: '"I can\'t sail her alone, and my crew are still in the Gull waiting for a miracle. Fetch me a miracle, Cimmerian."' },
      { cond: NOT(F('ch2.chart_found')), text: '"Not without Ortho\'s chart. The Stygian coast eats ships that guess. It\'ll be in his hoard somewhere."' },
      { text: '"Nearly. Give me a moment."' }],
      next: null },
  } },
};

// ---------------------------------------------------------------- scenes
export const scenes = {
  sc_arrival: [
    { text: 'Weeks of caravan dust, and then a leaky Argossean merchantman that stank of figs and fear, and then, one grey afternoon, the pirate haven of Gallows Bay, on the Barachan Isles, where the law was whatever the biggest ship in harbour said it was.' },
    { text: 'Kord came down the gangplank with Ashkarran\'s silver in his belt and the sea still rolling in his legs. Toktai followed, green as a lizard. Ain floated at Kord\'s shoulder, and its teal heart, which in Shadizar had pulsed like a slow drum, now beat faint and far apart, like a sleeper\'s.' },
    { speaker: 'ain', text: '"I am... tired. Is that the word? Everything I do costs more than it did. Small sparks, small mendings, small looks at things. Nothing larger, I think, until I am... fed."' },
    { speaker: 'kord', text: '"Rocks don\'t eat."' },
    { speaker: 'ain', text: '"Then I am a very unusual rock."' },
    { speaker: 'toktai', text: '"We need a ship and a captain mad enough to sail into Stygian waters. I said I knew one. She drinks at the Hanged Gull, there, by the water."' },
    { text: 'Glass breaks somewhere inside the Gull. Someone cheers.' },
    { speaker: 'toktai', text: '"Yes. She is in."',
      effects: [{ objective: { id: 'ch2_captain', to: 'active' } }] },
  ],
  sc_valka: [
    { text: 'As the party came through the door, the woman with the copper braid finished her swing. The man went through the window with a crash like a ship hitting a reef, taking the glass, the frame and most of a fishing net with him, and landed on the quay outside, where he lay looking at the sky and reconsidering his life.', effects: [{ sfx: 'heavy-hit' }, { fx: 'shake' }] },
    { speaker: 'valka', text: '"And tell Ortho," she called after him, "that if he wants to give me his regards, he can bring them himself, with my ship!" She dusted off her hands and turned to the room. "Who\'s next? Nobody? Pity."' },
    { speaker: 'toktai', text: '"Red Valka," murmured Toktai, with deep satisfaction. "Captain of the *Crimson Shrike*. Barachan. Aquilonian-born. Very mad. I told you."' },
    { speaker: 'valka', text: '"Captain of nothing, little Hyrkanian. Black Ortho stole the Shrike off her mooring while I was busy being drunk ashore. And my crew," she flung a hand at the sailors by the wall, "won\'t sail anywhere anyway, because three ships have been swallowed whole by the Wyrm this month, and they\'ve decided the sea hates them personally."' },
    { text: 'Then her eyes found Kord, and travelled up him, slowly, the way a buyer looks at a horse, or a wolf at a wall it means to climb.' },
  ],
  sc_duel_after: [
    { cond: F('ch2.duel_won'), text: 'Valka\'s cutlass spins out of her hand and sticks quivering in a beam. She ends up on her back on a table among the cups, with Kord\'s point resting very lightly at her throat. For a moment the whole tavern holds its breath. Then she laughs: a real laugh, a knife of a laugh, delighted.' },
    { cond: F('ch2.duel_won'), speaker: 'valka', text: '"Men, then. Cimmeria breeds men. Big ones." She pushes his blade aside with one finger. "Help a lady up, goat. That was a compliment."' },
    { cond: NOT(F('ch2.duel_won')), text: 'Kord swings, and she is not there, and something cold kisses the side of his neck: the flat of her cutlass, laid there as gently as a lover\'s hand. The tavern roars. Kord stands very still and finds, to his own surprise, that he is grinning.' },
    { cond: NOT(F('ch2.duel_won')), speaker: 'valka', text: '"Goats, then. Big, stubborn, beautiful goats." She sheathes the cutlass. "I like goats. You can\'t teach them anything, but they climb anywhere and they never, ever quit. Next time I\'ll win by more."' },
    { speaker: 'kord', text: '"Next time."', effects: [{ cond: F('ch2.duel_done'), effects: [{ heal: 'party' }] }] },
    { speaker: 'toktai', text: '"Captain, we need a ship that sails to Stygia, and a captain mad enough to sail her."' },
    { speaker: 'valka', text: '"Stygia." For a moment her face goes hard and still. "Stygia sells people, little Hyrkanian. Sells them in chains, on the quays at Khemi, by the pound. There is nothing I would like better than to sail into Stygian waters and take everything they own." She grins again. "I just need my ship back. And my crew\'s nerve. And Ortho\'s chart of the Stygian coast, because he\'s the only man on the islands who has one."' },
    { speaker: 'ain', text: '"We could help with all three. Probably. Statistically..." Kord looks at it. "...Yes. We could help."' },
    { speaker: 'valka', text: '"A talking jewel. Gods, Cimmerian, you come with everything." She spits in her palm and holds it out. "Win me back the Shrike and give my lads their nerve, and I\'ll sail you to Stygia and back and not charge you for the view. Deal?"' },
    { speaker: 'kord', text: 'Kord spits in his own palm and takes her hand. Her grip is like a ship\'s cable. "Deal."',
      effects: [{ join: 'valka' }, { set: 'ch2.valka_joined' },
        { objective: { id: 'ch2_captain', to: 'done' } }, { objective: { id: 'ch2_shrike', to: 'active' } },
        { objective: { id: 'ch2_crew', to: 'active' } }, { objective: { id: 'ch2_chart', to: 'active' } }] },
  ],
  sc_ain_wakes: [
    { text: 'Noon light slammed through the clean lens like a blow. It gathered into a single blinding shaft and fell into the empty brass cradle and pooled there, white-gold, humming, so bright that Gilbo threw an arm across his eyes and Toktai turned his face away.' },
    { speaker: 'ain', text: 'Ain drifted toward it, slowly, as a moth drifts. "Put me there. Please." Its voice was very small. "I think... I think I have been hungry for a very long time."' },
    { text: 'Kord took the stone out of the air, and for a moment held it in his fist, warm and faint as a sparrow. Then he set it in the cradle, in the heart of the light.' },
    { text: 'The teal pulse caught. It beat once, twice, and then faster, brighter, like a heart that has remembered what it is for, until the light in the cradle was no longer white but the colour of shallow sea over white sand, and the whole lamp room swam with it, and every window in the tower blazed teal out over Gallows Bay.', effects: [{ sfx: 'ain-cast' }, { fx: 'flash' }] },
    { speaker: 'ain', text: '"Oh," said Ain. And then, wonderingly: "I feel... awake. Is this what wine is like?"' },
    { speaker: 'kord', text: '"No."',
      effects: [{ set: 'ch2.ain_woken' }, { learn: { who: 'ain', skill: 'aegis' } }, { learn: { who: 'ain', skill: 'flare' } }, { learn: { who: 'ain', skill: 'mirage' } },
        { objective: { id: 'ch2_lens', to: 'done' } }] },
    { speaker: 'gilbo', text: 'Gilbo lowered his arm and stared at the blazing lamp, and his old face worked. "Ten years," he said hoarsely. "Ten years she\'s been dark. Brother, what in the name of the deep is that stone?"' },
    { speaker: 'ain', text: '"A friend," said Ain, rising out of the cradle and taking its place again at Kord\'s shoulder, brighter than it had been since Shadizar. "Thank you for your lamp. Now, I believe someone at the Hanged Gull wanted a miracle."' },
  ],
  sc_mirage: [
    { text: 'They gathered the crew by the broken window, grumbling, with the evening sea beyond it like hammered pewter. Ain rose out over the sill and hung there, a small bright star against the dusk.', effects: [{ set: 'ch2.mirage_on' }] },
    { text: 'Out on the water, the sea-foam stirred. It gathered. It rose, shining, into the shape of a woman taller than a mast, robed in spray and crowned with silver fish, her hair the colour of shallow sea over white sand, and she walked across the harbour toward the Hanged Gull with the waves smoothing themselves beneath her feet.', effects: [{ sfx: 'ain-cast' }] },
    { speaker: 'lady_waves', text: 'She lifted one hand over the crew, and her voice was the hush of surf on sand. "Children of the sea. Sail. The deep remembers you. I will go before you, all the way to the dark coast."' },
    { text: 'And she bowed, and was foam, and was gone. For a long moment nobody in the Hanged Gull breathed. Then Mother Teg let out a whoop like a gale in the rigging, and the whole crew were on their feet, roaring, hugging, weeping, and calling for rum.', effects: [{ clear: 'ch2.mirage_on' }] },
    { speaker: 'teg', text: '"The Lady of the Waves! The Lady herself! We sail, Captain! We sail tomorrow, and the Wyrm can kiss my tattoos!"' },
    { speaker: 'kord', text: 'Kord, low, to the stone settling back at his shoulder: "Lies."' },
    { speaker: 'ain', text: '"Theatre."' },
    { text: 'Kord watched the crew for a long time: their straightened backs, their hands on their knives, the light back in their eyes.' },
    { speaker: 'kord', text: '"...It worked."',
      effects: [{ set: 'ch2.crew_rallied' }, { objective: { id: 'ch2_crew', to: 'done' } },
        { cond: NOT(F('ch2.ortho_beaten')), speaker: 'valka', text: '"Now all they need is a ship. Ortho\'s got one of those. Mine."' },
        HALFWAY, READY] },
  ],
  sc_ortho_after: [
    { text: 'Black Ortho reeled back across his stolen deck, his sabre gone, blood in his beard, his cutthroats down around him. He looked at Valka, and at Kord, and at the green water a long way below.' },
    { speaker: 'ortho', text: '"This isn\'t over, red!" And he went over the side like a sack of wet laundry, and the sea closed over him, and did not give him back.' },
    { text: 'Valka walked to the wheel of the *Crimson Shrike* and laid both hands on it, the way a woman lays her hands on a horse she thought she had lost, and for a moment did not say anything at all.' },
    { cond: F('ch2.ortho_pretend'), speaker: 'valka', text: '"\'I picked it up here.\'" She turns, grinning. "I\'m having that carved on the rail. For a moment there, Cimmerian, I almost believed you."' },
    { cond: F('ch2.ortho_pretend'), speaker: 'kord', text: '"So did he."' },
    { cond: NOT(F('ch2.ortho_pretend')), speaker: 'valka', text: '"\'Never my friends.\'" She turns, grinning. "Careful, Cimmerian. Talk like that, I\'ll start thinking you\'re sweet on me."' },
    { cond: NOT(F('ch2.ortho_pretend')), speaker: 'kord', text: '"Crom."' },
    { speaker: 'toktai', text: 'Toktai, peering over the rail: "He does not come up. A fat man sinks slowly. But he sinks."' },
    { speaker: 'valka', text: '"He\'ll come up. His kind always do. Next time I\'ll be ready." She pats the wheel. "Hello, beautiful. Did he hurt you?"',
      effects: [{ objective: { id: 'ch2_shrike', to: 'done' } },
        { cond: NOT(F('ch2.crew_rallied')), speaker: 'valka', text: '"Now all she needs is a crew that isn\'t hiding in a tavern waiting for a miracle. There\'s a boat at the stern: we can row round to the docks from here."' },
        { cond: NOT(F('ch2.chart_found')), speaker: 'valka', text: '"And Ortho\'s chart. It\'ll be in his hoard, back in the cave. He never let it out of reach."' },
        HALFWAY, READY] },
  ],
  sc_night: [
    { text: 'The Shrike ran south for two days under a fair wind, and the crew sang the terrible song about the Lady of the Waves until even Teg knew all the words. On the third night the wind dropped to a breath, and the sea went flat and black and still, and the stars came down to sit on it.' },
    { text: 'It was the quiet hour after the watch changed. Toktai had a line over the stern. Valka stood alone at the rail, which she never did.' },
  ],
  sc_vow: [
    { text: 'Kord leaned on the rail beside her. For a while neither of them said anything, which, for Valka, was a kind of speech.' },
    { speaker: 'valka', text: '"Here\'s a thing, Cimmerian. I\'ve buried a lot of crew. Sea takes them, or steel, or rum. And every one of them I\'ve thought: if they\'d had any spine they\'d have come back to finish the fight." She turns her head. "So here\'s my vow, and I keep my vows. If I die before you, at sea or anywhere, I\'ll come back from wherever they send me, and fight beside you. Dead or not."' },
    { speaker: 'kord', text: '"And if I die first?"' },
    { speaker: 'valka', text: '"Then I win."' },
    { speaker: 'kord', text: 'Kord thinks about it. "Then I\'ll come back too."' },
    { speaker: 'valka', text: '"You\'ll be late. Cimmerians always are." But she is smiling at the sea. What she meant by it, she alone knew then. I have turned it over many times since.' },
    { text: 'At the stern Toktai\'s line hung slack in the black water. Nothing had bitten all night. Nothing, Toktai observed, seemed to be down there at all, which was strange so far from land, where the sea should be thick with fish.' },
    { speaker: 'valka', text: 'Valka glances at the stone floating at Kord\'s shoulder. "And you, Ain? Does that crystal have a heart in it somewhere?"' },
    { speaker: 'ain', text: '"I have no heart, in the anatomical sense." A pause, while the teal light turns slowly. "It has never bothered me until now."' },
  ],
  sc_wyrm: [
    { text: 'Ain\'s light went dim, all at once, like a lamp turned down. It drifted closer to Kord, very close, until it almost touched his cheek.' },
    { speaker: 'ain', text: '"Something beneath us." Its voice was barely a whisper. "Something I... recognise."' },
    { text: 'Below the Shrike, far down in the black water, a light woke. Then another. Then the whole sea around the ship began to glow, from beneath, the colour of shallow sea over white sand, and every face on deck was lit from below like the faces of the drowned.', effects: [{ set: 'ch2.sea_glow' }, { sfx: 'wyrm-roar' }, { music: 'wyrm' }] },
    { speaker: 'toktai', text: 'Toktai dropped his line. "On the steppe we say..."' },
    { speaker: 'valka', text: '"Not now!"' },
    { text: 'The sea opened. Up out of it, streaming, rose a serpent the size of a city wall: a serpent of bronze, plated and ribbed, older than Atlantis, with eyes like two teal moons, and in its wake the water lay as straight as a rule. It rose and rose against the stars until it blotted them out, and looked down at the little red-sailed ship, and opened its mouth.', art: 'keyart/wyrm-rising', caption: 'The Wyrm rises', effects: [{ fx: 'shake' }] },
    { speaker: 'kord', text: 'Kord drew his sword. "Crom."' },
    { text: 'The mouth came down. The Shrike, the crew, the song, the lanterns, the stars: all of it went into the dark together.', art: null, effects: [{ fx: 'flash' }, { clear: 'ch2.sea_glow' }] },
    { text: 'Black.' },
  ],
};

// ---------------------------------------------------------------- objectives
export const objectives = [
  { id: 'sq2_articles', side: true, text: 'Bring Gilbo the original Articles.', lock: 'Must be done before the Shrike sets sail.', done: F('ch2.art_returned'), members: ['kord', 'toktai', 'valka'],
    hints: ['Three torn pieces: a tavern drunk\'s lucky charm, something a great gull carried up the hill, and a scrap holding up a tradesman\'s plan.',
      'One-Ear Dash bets his piece at bones, and his dice are loaded; the cutthroats in the grotto had loaded dice too. The Great Gull\'s nest hides the second piece once the bird is gone. Marrow wants a plume for his figurehead.',
      'Take the dice in the grotto, give them to Dash (Toktai swaps them) and throw the bones; raid the gull\'s nest and search it; trade Marrow the gull\'s feather or sixty silver. Combine the three pieces, use them on the third barnacled pillar in the grotto, then take the seal-box to Gilbo.'],
    party: {
      kord: '"Three bits of paper. Crom. I came here to steal a ship, and now I am a scribe."',
      toktai: '"Dash\'s dice lie. Bring me dice that lie better, and I will make an honest man of him for one throw."',
      valka: '"The originals, Kord. With Ortho\'s crowd\'s fathers\' names on them. Find them and I\'ll kiss Gilbo. On the forehead. Probably."',
    } },
  { id: 'ch2_captain', text: 'Find a captain mad enough to sail for Stygia.', done: F('ch2.valka_joined'), members: ['kord', 'toktai', 'ain'],
    hints: ['Toktai knows a captain. Follow the sound of breaking glass.',
      'Pirates drink at the Hanged Gull, on the docks.',
      'Go into the Hanged Gull.'],
    party: {
      kord: '"The Hyrkanian knows a mad captain. In this town, that narrows it down to everyone."',
      toktai: '"Red Valka. She drinks at the Hanged Gull, when she is not throwing people out of it. Listen: you can hear her from here."',
      ain: '"Toktai said she drinks at the tavern with the hanged bird. Which, I am told, is a joke. I do not understand it. I will keep trying."' } },
  { id: 'ch2_shrike', text: 'Win back the Crimson Shrike from Black Ortho.', done: F('ch2.ortho_beaten'), members: ['kord', 'toktai', 'ain', 'valka'],
    hints: ['Ortho hides the Shrike somewhere near Gallows Bay. Valka, One-Ear Dash and Marrow the shipwright all have ideas where.',
      'The old smugglers\' caves under Gallows Hill run down to a hidden cove. In the Drowned Passage a sluice winch is missing its crank; a dead smuggler in the grotto is still holding one.',
      'Go west to Gallows Hill and down the stair. Take the crank from the skeleton in the grotto, use it on the winch in the Drowned Passage, go on through the hoard and out to the cove, and beat Black Ortho.'],
    party: {
      kord: '"Ortho has the ship. We take it back. Simple. The caves first."',
      toktai: '"The shipwright saw her go round behind Gallows Hill. When a horse thief rides into the hills, you look for the cave with the fresh dung. Every herd-boy knows that."',
      ain: '"The caves run under Gallows Hill toward the sea. I can feel the water in them. I will be brave about it."',
      valka: '"Ortho\'s cove is round the back of Gallows Hill. The smugglers\' caves run down to it. Get me to my deck, Cimmerian. I\'ll do the rest."' } },
  { id: 'ch2_crew', text: 'Give the Shrike\'s crew their nerve back.', done: F('ch2.crew_rallied'), members: ['kord', 'toktai', 'ain', 'valka'],
    hints: ['Mother Teg speaks for the crew in the Hanged Gull. Ask her what would change their minds.',
      'They want a sign from the sea. Ain could make one if it had power: light, a great deal of it, focused. The lighthouse has a great lens.',
      'Wake Ain at the lighthouse lens, then talk to Mother Teg and choose "Ain has a sign for you."'],
    party: {
      kord: '"They want a sign. I\'d give them a kick. Valka says no."',
      toktai: '"Sailors. Like horses: beat a frightened horse and it still will not cross the river. Show it the other bank."',
      ain: '"I could make them a sign, if I had power: light, a great deal of it, focused. Once I have it, ask Mother Teg to look out of the window."',
      valka: '"Teg speaks for them. Whatever she wants, get it, and they\'ll follow me into Set\'s own mouth. They\'ve done it before. Twice."' } },
  { id: 'ch2_lighthouse', text: 'Win the lighthouse keeper\'s trust.', done: F('ch2.gilbo_passed'), members: ['kord', 'toktai', 'ain', 'valka'],
    hints: ['Gilbo lets only true Brothers of the Coast near his lens, and tests them on the Articles of the Brotherhood.',
      'It is not a memory test. Ask Valka about the Articles, or talk to the pirates arguing at their table in the Hanged Gull: free men, everything voted, everything shared, the more you want the more you risk.',
      'Owe the captain: "His blade and his vote, and nothing else." Who decides the course: "The crew, by vote." First on the plank: "The one who asked for the biggest share."'],
    party: {
      kord: '"The old man wants a Brother. I\'m a thief. It\'s close."',
      toktai: '"The pirates in the tavern argue about those Articles all day. You want to know a tribe\'s law? Listen to them break it."',
      ain: '"Every answer should follow from what the Brotherhood is. Free men who vote, and share. It is almost elegant. Almost."',
      valka: '"The Articles? We vote on everything. Course, captain, dinner. No man owns a Brother. The more you want, the more you risk. Think like that and Gilbo can\'t touch you."' } },
  { id: 'ch2_lens', text: 'Clear the salt from the great lens.', done: F('ch2.ain_woken'), members: ['kord', 'toktai', 'ain', 'valka'],
    hints: ['The lens is crusted blind with salt. A sleeve will not shift it.',
      'Gilbo says salt comes off with rum; One-Ear Dash says rum is for cleaning glass. The barkeep at the Hanged Gull sells Kill-Devil.',
      'Buy Kill-Devil Rum from the barkeep at the Hanged Gull (5 silver) and use it on the lens.'],
    party: {
      kord: '"Salt. My sleeve lost. Rum wins everything, the old man says."',
      toktai: '"Everything comes off with rum, says the one-legged man. Back home it is mare\'s milk. That takes everything off, including the stomach."',
      ain: '"If the lens were clean it would gather the whole noon sky into the cradle. I would like that more than I can say."',
      valka: '"Kill-Devil takes the paint off a hull. A little salt\'s nothing. The Gull sells it, if you can stand the smell."' } },
  { id: 'ch2_chart', text: 'Take Ortho\'s sea-chart of the Stygian coast.', done: F('ch2.chart_found'), members: ['kord', 'toktai', 'ain', 'valka'],
    hints: ['Only Black Ortho has a chart of the Stygian coast. He keeps his plunder close.',
      'Ortho\'s hoard lies in the caves under Gallows Hill, beyond the Drowned Passage.',
      'Beat Ortho\'s bosun in the hoard, then take the chart from the chart table under Ortho\'s flag.'],
    party: {
      kord: '"Ortho has a map. Ortho won\'t need it."',
      toktai: '"A thief keeps his best thing where he sleeps. I would know. Look under the saddle."',
      ain: '"A chart of the Stygian coast. I would like to read it. Strictly for navigation."',
      valka: '"Ortho\'s chart is the only true one on the islands. He\'ll keep it with his loot, where he can gloat at it."' } },
  { id: 'ch2_sail', text: 'Set sail for Stygia.', done: F('ch2.sail_now'), members: ['kord', 'toktai', 'ain', 'valka'],
    hints: ['Ship, crew and chart are ready. Valka is waiting on the Shrike in Ortho\'s Cove.',
      'Last chance to buy gear on Shipwrights\' Row and rest at the Hanged Gull. There is no coming back.',
      'Row out to the Shrike from the docks (or walk through the caves), and set sail.'],
    party: {
      kord: '"Stygia. Gold, slavers, sorcerers. Good. Let\'s go."',
      toktai: '"Buy your arrows before the war, not during it. The shipwright is on the Row."',
      ain: '"I do not like the sea. But I will like Stygia even less, so it evens out."',
      valka: '"She\'s ready, I\'m ready, the lads are ready. Get aboard, Cimmerian, before I sail without you."' } },
];

// ---------------------------------------------------------------- shops, threats, seek trouble, banter
export const shops = {
  barkeep: { name: 'Pellam\'s counter', short: 'Pellam', npc: 'barkeep', buys: false,
    greeting: '"Rum\'s five. Bread\'s eight. Don\'t ask what\'s in the stew."',
    stock: [{ item: 'kill_devil_rum', price: 5 }, { item: 'bread_and_dates' }, { item: 'healing_draught', qty: null }] },
  chandler: { name: 'Marrow the shipwright', short: 'Marrow', npc: 'chandler', buys: true, buysKinds: ['weapon', 'armor', 'charm', 'consumable', 'treasure'],
    greeting: '"Coats, steel, rope and bows. I buy what floats and what cuts."',
    stock: [{ item: 'corsair_bandana' }, { item: 'round_shield' }, { item: 'sea_wolf_coat' }, { item: 'harpoon' }, { item: 'boarding_axe' },
      { item: 'composite_horn_bow' }, { item: 'argossean_rapier' }, { item: 'chain_hauberk' },
      { item: 'healing_draught', qty: null }, { item: 'antidote_herbs', qty: null }, { item: 'throwing_knives', qty: null }] },
};

export const threats = ['human', 'bleed'];

export const seekTrouble = {
  caves: { pool: ['cutthroat', 'giant_crab', 'sea_ghoul'], size: [1, 3], tier: 'party', partySize: 'current',
    rewardFrom: 'e2_grotto_cutthroats', pct: 25, optional: true },
};

export const banter = {
  toktai: [
    '"The sea is only a steppe that has forgotten how to stand still. I prefer the steppe. It does not try to get into my boots."',
    '"The red captain is magnificent. I admire her from a distance. A great distance. Approximately one Cimmerian."',
    '"You have the face of a man who is going to hit something soon. I like that face. It saves time."',
  ],
  ain: [
    '"I have been counting the gaps in my memory. Counting is perhaps the wrong word. I keep walking into them in the dark."',
    '"Valka flirts with you as a contest, I think. You are losing. I thought you would want to know." Kord: "I\'m not." Ain: "That is what losing sounds like."',
    '"Please do not put me in your boot again. I know it was for safety. I could feel the boot."',
  ],
  valka: [
    '"No man owns me, Cimmerian. No god either. Remember that, and we\'ll get on fine. Forget it, and I\'ll remind you. With the pointy end."',
    '"I was born in Aquilonia, in a house with silk on the walls and bars on the windows. I climbed out at fifteen and never once looked back. Well. Once. To spit."',
    '"You keep looking at me, Cimmerian. That\'s one point to me. You looked away just now. That\'s two."',
  ],
};
