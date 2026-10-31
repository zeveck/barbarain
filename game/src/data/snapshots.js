// BarbarAIn — chapter-start snapshots (DATA_SPEC §11, BALANCE §1 and §5).
// SNAPSHOTS[n] is the typical state at the start of chapter n; goToLevel(n)
// loads it, and the play-test checks chapter n's solution ends matching
// SNAPSHOTS[n+1] on level, key flags and key items exactly, gold within ±25%.
//
// Levels and XP are exact (BALANCE §1: 1 / 5 / 9 / 12 / 15 = cumulative XP of
// the placed fights). Gear is the BALANCE §5 "typical" pick for each chapter.
// Flag names: the story flags each chapter's content sets on its way out;
// they must match the ids used in ch1.js … ch5.js (see design/BATTLE_API.md).

export const SNAPSHOTS = {
  1: {
    chapter: 1, room: 'shz_tavern', level: 1, xp: 0, gold: 0,
    party: [
      { id: 'kord', equip: { weapon: 'rusty_broadsword', off: null, body: 'leather_harness', head: null, charm: null } },
    ],
    items: {},
    flags: [],
    objectives: [],
  },

  2: {
    chapter: 2, room: 'gal_docks', level: 5, xp: 324, gold: 470,
    party: [
      { id: 'kord', equip: { weapon: 'lion_hilt_broadsword', off: 'iron_buckler', body: 'leather_harness', head: 'horned_helm', charm: null } },
      { id: 'toktai', equip: { weapon: 'hyrkanian_shortbow', off: null, body: 'hyrkanian_jerkin', head: 'iron_cap', charm: 'ring_of_mitra' } },
      { id: 'ain', equip: { charm: null } },
    ],
    items: { ashkarran_bronze_mace: 1, cudgel: 1, thiefs_dirk: 1, scroll_of_fire: 1, healing_draught: 3, bread_and_dates: 1 },
    flags: ['ch1.toktai_free', 'ch1.ain_joined', 'ch1.ashkarran_dead'],
    objectives: [],
  },

  3: {
    chapter: 3, room: 'wyr_graveyard', level: 9, xp: 1650, gold: 280,
    party: [
      { id: 'kord', equip: { weapon: 'orthos_black_sabre', off: 'brass_targe', body: 'chain_hauberk', head: 'horned_helm', charm: 'croms_tooth' } },
      { id: 'toktai', equip: { weapon: 'composite_horn_bow', off: null, body: 'hyrkanian_jerkin', head: 'corsair_bandana', charm: 'ring_of_mitra' } },
      { id: 'ain', equip: { charm: 'ishtar_bangle' } },
      { id: 'valka', equip: { weapon: 'argossean_rapier', off: 'zingaran_main_gauche', body: 'sea_wolf_coat', head: 'iron_cap', charm: null } },
    ],
    items: {
      kraken_bone_club: 1, ashkarran_bronze_mace: 1, lion_hilt_broadsword: 1, barachan_cutlass: 1, iron_buckler: 1,
      thiefs_dirk: 1, leather_harness: 1, scroll_of_fire: 1, healing_draught: 4, throwing_knives: 1, antidote_herbs: 1,
    },
    flags: ['ch1.toktai_free', 'ch1.ain_joined', 'ch1.ashkarran_dead', 'ch2.valka_joined', 'ch2.ain_woken', 'ch2.ortho_beaten'],
    objectives: [],
  },

  4: {
    chapter: 4, room: 'stg_beach', level: 12, xp: 3571, gold: 280,
    party: [
      { id: 'kord', equip: { weapon: 'star_iron_greatsword', off: null, body: 'star_weave_mail', head: 'horned_helm', charm: null } },
      { id: 'toktai', equip: { weapon: 'bow_of_the_hours', off: null, body: 'sea_wolf_coat', head: 'corsair_bandana', charm: 'ring_of_mitra' } },
      { id: 'ain', equip: { charm: 'prism_facet' } },
      { id: 'valka', equip: { weapon: 'humming_blade', off: 'aegis_disc', body: 'chain_hauberk', head: 'iron_cap', charm: null } },
    ],
    items: {
      sun_shard: 1,   // the Wyrm's heart burned in chapter III (the default; design/ENDINGS.md)
      kraken_bone_club: 1, sun_lance: 1, orthos_black_sabre: 1, argossean_rapier: 1, composite_horn_bow: 1,
      zingaran_main_gauche: 1, brass_targe: 1, hyrkanian_jerkin: 1, atlantean_coin: 2, star_fruit: 2, star_cell: 1,
      healing_draught: 4, lotus_tincture: 1, scroll_of_fire: 1, seers_lens: 1,
    },
    flags: ['ch1.toktai_free', 'ch1.ain_joined', 'ch1.ashkarran_dead', 'ch2.valka_joined', 'ch2.ain_woken', 'ch2.ortho_beaten',
      'ch3.crew_woken', 'ch3.warden_dead'],
    objectives: [],
  },

  5: {
    chapter: 5, room: 'pyr_stilled', level: 15, xp: 6453, gold: 430,
    party: [
      { id: 'kord', equip: { weapon: 'embalmers_flail', off: 'aegis_disc', body: 'stygian_scale', head: 'serpent_crest_helm', charm: 'lion_tooth_charm' } },
      { id: 'toktai', frozen: true, equip: { weapon: 'bow_of_kush', off: null, body: 'star_weave_mail', head: 'corsair_bandana', charm: 'ring_of_mitra' } },
      { id: 'valka', frozen: true, equip: { weapon: 'sea_queens_sabre', off: 'brass_targe', body: 'chain_hauberk', head: 'mummy_wrap_hood', charm: null } },
    ],
    items: {
      sun_shard: 1,   // the Wyrm's heart burned in chapter III (the default; design/ENDINGS.md)
      star_iron_greatsword: 1, khopesh_of_set: 1, sun_lance: 1, humming_blade: 1, asp_fang_dagger: 1, bow_of_the_hours: 1,
      sea_wolf_coat: 1, horned_helm: 1, greater_draught: 2, healing_draught: 3, smelling_salts: 1, lotus_tincture: 1, amulet_of_the_hours: 1,
    },
    flags: ['ch1.toktai_free', 'ch1.ain_joined', 'ch1.ashkarran_dead', 'ch2.valka_joined', 'ch2.ain_woken', 'ch2.ortho_beaten',
      'ch3.crew_woken', 'ch3.warden_dead', 'ch4.bakari_freed', 'ch4.guardian_dead'],
    objectives: [],
  },
};
