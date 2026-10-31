// BarbarAIn — combine rules (DATA_SPEC §14). Matched in either order.
// consumes: which inputs are used up (default both).

export const RECIPES = [
  { a: 'shadizar_red', b: 'poppy_draught', result: 'drugged_wine', consumes: ['a', 'b'],
    text: 'Kord pours the poppy draught into the wine and swirls it. It smells exactly like Shadizar Red, which is to say, of feet. A gift, not wine.' },
  { a: 'lamp_oil', b: 'red_sash', result: 'oily_rag', consumes: ['a', 'b'],
    text: 'Kord soaks the strip of red sash in the lamp oil until it drips. It would burn like a heretic.' },
  { a: 'purging_root', b: 'rat', result: 'stuffed_rat', consumes: ['a', 'b'],
    text: 'Toktai takes the root and the rat, and with two quick turns of his knife and a grass string the root is inside the rat and the rat has stopped complaining. Medicine, dressed as dinner.' },
  // the three torn pieces of the Articles join in any order: two make the torn Articles, the third completes them
  ...[['articles_a', 'articles_b'], ['articles_a', 'articles_c'], ['articles_b', 'articles_c']].map(([a, b]) => ({ a, b, result: 'articles_ab', consumes: ['a', 'b'],
    text: 'The torn edges meet like old friends. Two captains\' names run across the join, one in tar and one in something darker.' })),
  ...['articles_a', 'articles_b', 'articles_c'].map((b) => ({ a: 'articles_ab', b, result: 'drowned_articles', consumes: ['a', 'b'],
    text: 'The last piece fits. Kord turns the whole sheet over, and on the back, in faded ink, is a chart: the Smugglers\' Grotto, and an X beneath the third barnacled pillar, "where the tide sings".' })),
  // the Jackal's wager: Toktai carves the candle (the companion is not used up)
  { a: 'green_candle', b: 'toktai', result: 'wax_eye', consumes: ['a'],
    text: 'Toktai takes the candle, turns it in his fingers, and goes at it with a knife no longer than his thumb. Shavings curl away like green petals. When he is done he holds up an eye: round, glossy, deep green. "Green enough, in candlelight, to a man who is not looking."' },
];
