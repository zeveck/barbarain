// BarbarAIn — fallback reply pools (DATA_SPEC §6). Every action that nobody
// wrote a reply for lands here, so the game always answers in character.
// Lines are picked by a seeded roll and never repeat twice in a row.
// {item} and {target} are filled in by the engine (pools only).

export const DEFAULTS = {
  look: [
    'Kord looks at the {target}. The {target} does not look back. A good start.',
    'The {target}. Kord has seen better. He has also seen worse, usually on fire.',
    'Nothing about the {target} tells Kord how to steal it, eat it or kill it, which is all he asks of a thing.',
  ],
  take: [
    'Kord weighs the idea of taking the {target}, and decides it would only slow him down.',
    'Even in Shadizar, some things are nailed down. The {target} is one of them, in spirit if not in fact.',
    'A thief takes what is worth taking. The {target} is not.',
  ],
  takeNpc: [
    '"Hands off," says the {target}, with feeling.',
    'Kord is a thief, not a slaver. He leaves the {target} where it stands.',
  ],
  talk: [
    'The {target} has nothing to say to a barbarian. Kord takes it as a compliment.',
    'Kord grunts a greeting. The {target} grunts back. It is, by Cimmerian standards, a conversation.',
    '"Well?" says the {target}. Kord has no answer to that, nor any wish to find one.',
  ],
  talkThing: [
    'Kord says a few words to the {target}. It keeps its own counsel, like a sensible thing.',
    'The {target} has the good manners of the dead: it does not interrupt.',
    'Talking to the {target}. Ain would call this statistically unproductive. Ain is not here yet.',
  ],
  hit: [
    'Kord considers hitting the {target}. He decides to save that for later.',
    'His fist itches. The {target} is not worth the bruise.',
    'Kord glares at the {target} until it is clear who would win. Then he lets it live.',
  ],
  hitNpc: [
    'Kord\'s hand drifts to his hilt. The {target} sees it, and so does every eye in the street. He lets it drift back.',
    'Not here. Not yet. Not without a reason a magistrate could misunderstand.',
  ],
  give: [
    'The {target} looks at the {item}, then at Kord, then away. No sale.',
    '"What would I want with that?" says the {target}.',
    'Kord holds out the {item}. The {target} keeps both hands firmly to itself.',
  ],
  combine: [
    'They refuse to become one thing.',
    'Kord holds the {item} against the {target}. They have nothing to say to each other.',
    'Kord has seen sorcerers mix things. He has also seen what was left of the sorcerers.',
  ],
  say: [
    'Kord says it. Nobody seems to care, which is how most speeches go.',
    'The words fall into the room and lie there.',
    '"{target}," says Kord. The world remains unimpressed.',
  ],
  shout: [
    'Kord bellows a hill-war-cry of Cimmeria. Dust falls. Somewhere, a baby agrees with him.',
    'Kord roars. It changes nothing, but he feels better.',
    '"CROM!" The echo comes back sounding embarrassed for him.',
  ],
  useBare: [
    'Use the {target} how? Kord looks for a handle and finds none.',
    'Kord prods the {target}. It is unmoved, in every sense.',
    'The {target} does not seem to be for anything. Like most of Shadizar.',
  ],
  goNowhere: [
    'There is no way out in that direction, unless Kord means to go through a wall. He considers it.',
    'That way lies a wall, and walls in Shadizar are thicker than its morals.',
  ],
  kordSelf: [
    '"Crom." It is not a prayer. It is barely a word.',
    'Kord takes stock of himself: one barbarian, slightly used.',
  ],
  byKind: {
    weapon: [
      'Kord considers hitting the {target} with the {item}. He decides to save that for later.',
      'The {item} is for things that bleed or break. The {target} does neither, worth the effort.',
      'Steel is an answer. This is not the question.',
    ],
    armor: [
      'Kord holds the {item} against the {target}. Neither is improved.',
      'Armour goes on a body. The {target} is not one.',
      'The {item} does not fit the {target}. Few things do.',
    ],
    charm: [
      'Kord dangles the {item} at the {target}. Nothing magical happens, which suits him.',
      'Trinkets are for wearing or selling, not for waving at things.',
    ],
    food: [
      'Kord is not going to waste good food on the {target}.',
      'The {target} is not hungry. Kord is. He puts the {item} away before he eats it.',
      'Feeding the {target}? It has no mouth, and Kord has a perfectly good one.',
    ],
    potion: [
      'Pouring a good draught over the {target} would be a waste of a good draught.',
      'The {target} is not wounded. Kord keeps the {item} for someone who is.',
      'Save the drink for someone thirsty.',
    ],
    consumable: [
      'Not here, not on that. Kord puts the {item} away.',
      'The {item} has a use. This is not it.',
    ],
    key: [
      'The {item} and the {target} have no business together.',
      'Kord tries the {item} on the {target}. Nothing gives, except his patience.',
      'Not everything is a lock, Kord reminds himself. He does not believe it.',
    ],
    document: [
      'Kord shows the {item} to the {target}. Neither of them can read it.',
      'Paper solves nothing that a sword cannot, says Kord. He is often wrong about this.',
      'The {target} has no interest in reading.',
    ],
    companion: [
      'That is not how friends are used, even in Shadizar.',
      'A raised eyebrow is the only answer.',
      'Some things a companion will not do. This is one of them.',
    ],
    treasure: [
      'Kord rubs the {item} against the {target}. It gains nothing but a smear.',
      'Treasure is for selling, not for poking things with.',
      'Ilk would buy the {item}. The {target} would not.',
    ],
  },
  kordRefusals: [
    'Kord considers it. He decides to save that for later.',
    'Kord tries it. The world declines to take part.',
    'In Cimmeria they have a word for ideas like that. The word is "no".',
    'Kord frowns at his own hands, as if they had suggested it.',
    'Nothing happens. Kord is not surprised; in his experience, nothing happens a great deal.',
    'That would work in a tale told by drunk men. This is not one, yet.',
    'Kord grunts. It is the grunt of a man who has tried something foolish and been rewarded with nothing.',
    'Crom gives a man courage at birth, and nothing else. Certainly not this.',
    'The idea dies in the doing. Kord buries it quietly.',
    'Kord tries, briefly and with conviction. Conviction is not enough.',
    'A passing cat watches him do it, and walks away unimpressed.',
    'Kord decides that whoever thought of that should be hit. Then he remembers who thought of it.',
  ],
};
