# BarbarAIn — side quests (change request 2)

Request (as typed): `/gg:gamegen --change add three optional side quests, including an arena in Shadizar`

There are three optional side quests, one in each hub chapter. Each one:
- is offered by a character already in that hub;
- is listed in the Journal under **Side quests**, with 3 hints and a line per party member;
- has a small puzzle in the game's give, use and combine style, plus optional fights;
- pays a unique item and some silver.

None of them gate the main story. All their fights are `optional: true`, so the chapter XP sums, the snapshots and the main replays stay exact. All three together add well under a level by chapter V.

**Locks.** Locks are flags, never rooms. When a quest's chapter moves past it, the objective is set to the new `closed` state: the Journal shows "Lost to time", greyed, and any quest items are taken quietly. Each lock is announced in the world just before it happens:

| Quest | Lock flag | In-world warning |
|---|---|---|
| The Pit | `ch1.ain_joined` (the chute from the sanctum is one-way) | Toktai at the rope before the wall: "Unfinished business in the city, Cimmerian? The wall will wait." This shows only while the Pit is unfinished. |
| The Drowned Articles | `ch2.sail_now` | Valka's existing "Set sail?" confirmation gains a line while the quest is open: "And Gilbo's papers stay ashore if we go." |
| The Jackal's Wager | `ch4.guardian_dead` | Bakari at the catacombs: "Whatever games you play in the bazaar, play them before we go down. The dead do not wait for gamblers." This shows only while the quest is open. |

---

## 1. The Pit of the Maul (chapter I, Shadizar): the arena

**Hook.** In the Drowned Lamp, Gorm (after the brawl) has a new line: "Under the Street of the Maul there's a pit where they pay silver to men who can stay standing. You'd stay standing." The Street gains an exit, **down: the Pit**, a cellar door beside a butcher's stall with roaring underneath. It's open from the start, so it can be found without Gorm. Taking the exit, or hearing the hook, makes the objective active.

**New room `shz_pit`, "The Pit of the Maul".**
- Background: new `bg/shz-pit`, map position (2,0).
- Sound: `loop-crowd` ambience and the `shadizar` music; a new `crowd-cheer` sfx plays when a bout is won.
- The room holds a chalked **slate** of bouts, the **sand**, and the **benches**. Gorm sits on the benches once the hook is heard.

**Ulla Three-Rings** (new NPC: `npc/ulla`, `portrait/ulla`) is a retired Brythunian pit-fighter with three gold rings in one ear. She's fair by her own crooked lights.
- Rule: "One fighter on the sand. Your friends bet, or they sit."
- Bouts are Kord alone (`party: ['kord']`, `partySize: 1`, like Valka's duel). Toktai, if he's joined, comments from the benches. Ain hasn't joined yet in this part of the game and is never mentioned here.

**Losing costs nothing.** Every bout has `onLose: [{heal}, {Ulla line}]`, so there's no game-over screen: "The sand doesn't hold grudges. Come back when you've bled a bit." Silver is paid only through `onWin` (with `gold: 0` on the encounter), and the next bout unlocks on the flag that `onWin` sets.

**The ladder** (Ulla: "Next bout"). Kord is level 2 after the brawl. The bouts are tuned for a solo Kord at level 2, rising to level 3 with their own XP.

| Bout | Opponent | Sprite | Moves | XP | Pay (`onWin`) |
|---|---|---|---|---|---|
| e1_pit_1 | **The Brothers Dusk**, two Zamorian brawlers | `enemy/drunk` ×2 | punch | 10 | 15 silver |
| e1_pit_2 | **Arslan the Deserter**, a Turanian with a net | `enemy/turanian-merc` | cut, every 3rd round net (stun) | 15 | 20 silver |
| e1_pit_3 | **Princess**, Ulla's spotted cat | `enemy/shadow-cat` | claw, bleeds | 20 | 25 silver |
| e1_pit_4 | **Hrolf the Red, of Vanaheim**, the champion | new `enemy/pit-champion` | strike, every 3rd round `riposte_stance` ("Hrolf sets his shield"): Defend that round, or eat the counter | 35 | 40 silver + **Torc of the Pit** |

Stats are hand-tuned per bout (the `mult` values in enemies.js) and checked by a new sim mode that runs one encounter at a given level and loadout.

**The dive (the dilemma).** Before bout 4 Ulla offers Kord **60 silver to go down** against Hrolf; the money is on the champion. This is a real trade:
- **"I'll take your silver."** Kord: "Silver's silver." A narrated scene follows (no battle): Kord walks into the first blow and stays down, the crowd boos, and Hrolf spits, "Cimmerian dog. I do not fight a man twice who lies down once."
  - Ulla pays 60.
  - Hrolf won't fight Kord again, so there's no Torc. The quest is done.
  - Gorm's later lines change: "Sixty silver for your pride? Cheap, northerner. I'd have asked eighty."
  - Toktai approves: "On the steppe we say: the horse that lies down is still a horse, and the man who bet on it is a fool." Kord says nothing for a long time.
- **"I don't lie down."** Kord: "Civilised men sell everything. Not this." Bout 4 is fought for real for the champion's purse and the Torc, with Gorm and the crowd chanting "KORD!" Losing is a retry like any other bout.
- **"Let me think."** Leaves the menu.

**The Torc of the Pit** is a new charm (ATK +2, HP +10%): "Hrolf's silver neck-ring. It still smells of Vanir."

The total is 60 to 100 silver plus the Torc. That's modest against chapter I's 470 silver target. Valka's duel teaches the solo format in chapter II; the Pit just meets it earlier.

---

## 2. The Drowned Articles (chapter II, Gallows Bay): the treasure hunt

**Hook.** Gilbo, after he lets Kord pass (`ch2.gilbo_passed`), gets a new choice: **"You and your Articles."** The Brothers still vote, but by the copy Ortho's crowd rewrote to suit themselves. The **original** Articles were signed in tar and blood by the first captains and torn in three when the Brotherhood went bad. Gilbo: "Bring 'em back and I'll nail 'em to the Hanged Gull's door, and the next time Ortho's lot quote me a clause I'll show 'em the blood it was signed in." That settles the Hanged Gull's endless Articles argument for good. Valka: "I'd give my good earring to watch Ortho's bosun read it."

**Three pieces** (key items `articles_a`, `articles_b`, `articles_c`):

1. **Dash's piece (the Hanged Gull).** One-Ear Dash stakes his piece at bones and always wins.
   - Look at his dice: "One face is worn smoother than the others. Dash's dice have opinions."
   - Toktai: "Cheat a cheater: on the steppe we call that weather. We need dice that lie better than his."
   - In the Smugglers' Grotto, taking the cutthroats' dice now gives the key item **loaded dice**. ("Loaded. He keeps them," as before.)
   - Give the loaded dice to Toktai, or use them on Dash. Toktai swaps them in. Dash: "Fair's fair. ...Was it fair?" Toktai: "Now it was."
   - This works in either order. Taking the grotto dice before hearing the hook is fine, because Kord carries them.
2. **The gull's piece (Gallows Hill).** It sits in the Great Gull's nest, which is the existing optional fight.
   - After the hook, once the gull is dead, the nest's look and take responses change: "Under the bones, rolled tight round a gull's thighbone, a scrap of tarred parchment."
   - The piece appears whether the gull died before or after the hook.
3. **Marrow's piece (Shipwrights' Row).** Marrow, the shipwright, has a scrap of tarred parchment pinned among his ship plans. He'll only part with it for a fine plume for his new figurehead's crown, and the Great Gull's feather is the finest on the coast.
   - The trade line says plainly that the feather charm goes: "Marrow plucks the feather from Kord's hand. 'You'll not be wearing that again.'"
   - If the feather was sold or is equipped, he takes **60 silver** instead: "or coin, if you've no feather." That way the quest can't get stuck.

**Combine:** a + b gives the **torn Articles**, then + c gives **the Drowned Articles**. On the back is a chart: the Smugglers' Grotto, "beneath the third barnacled pillar, where the tide sings".

**The cache (cav_grotto).**
- A new keyword, **pillar**, is visible while the player holds the full Articles.
- Use the Articles on it, or search it: a **Sea-Ghoul** rises, the cache's drowned guardian (existing `enemy/sea-ghoul`). It's an optional encounter, `e2_cache`.
- Beating it opens the chest. It holds the **Articles' seal-box** (the key item to return) and the **Sea-Vote Earring**, a new charm (Evasion +6%, Crit +4%).

**Return** the seal-box to Gilbo.
- He nails the Articles to the Hanged Gull's door, and the patrons get new lines about it.
- He gives Valka his old cutlass **"Old Mercy"**, a new weapon a little stronger than the Barachan Cutlass: "She's cut more bad captains than you've had hot dinners."
- Valka's line "That's the Articles" at dawn in chapter V gains a quiet payoff.

---

## 3. The Jackal's Wager (chapter IV, Khemi): the heist

**Hook.** In the Temple Bazaar, the incense seller watches Toktai instead of her stall. She's **the Jackal** (new NPC: `npc/jackal`, `portrait/jackal`), mistress of Khemi's thieves, behind a widow's veil and a tray of temple candles: "Steppe hands. You took a purse off a man at the gate and he still has not noticed. Shall we play?"

**The wager.** Beside the black arch stands a **bronze cobra idol with one jade eye** (new thing `idol`), watched by a **temple guard** (existing `npc/temple-guard`). The bet: take the eye *without the guard ever knowing it was taken*. Toktai: "On the steppe we say: never bet against a man's pride. You will win his money and lose his friendship." A pause. "I accept."

**The puzzle** needs a decoy and a distraction:
- **Decoy.**
  - Buy a **green temple candle** from the Jackal's own tray for 5 silver. She's amused.
  - Give it to Toktai, and he carves a **wax eye**: "Green enough, in candlelight, to a man who is not looking." This uses a give response, not a recipe, so no dagger is used up.
- **Distraction.** Ask Valka (talk to Valka, or use Valka on the guard). "Distract him? Darling, I was born for it." She asks him, at length and very seriously, for directions to a temple that doesn't exist.
- **Swap.** Use the wax eye on the idol while Valka has the guard. Toktai swaps the eyes in a heartbeat, and the flag `ch4.jade_taken` is set.
- **Wrong tries:**
  - Using the wax eye with no distraction: "The guard's eyes follow Toktai's hand like a dog's follow a sausage."
  - Shouting: "He looks. He looks back. A shout is short; this needs a performance."
  - Hitting the guard: "Not in Khemi. Not dressed as slaves."
  - Hitting the idol: "Toktai looks genuinely hurt."
  - Ain stays hidden in its pouch, as everywhere in Khemi: "Not here, Kord. Set's priests have eyes."

**Payoff choice** (talk to the Jackal while carrying the **Jade Eye**):
- **Hand it over.** She laughs: the idol is hers, set there years ago to test thieves, and the guard is her cousin.
  - She gives Toktai the **Jackal's Ring**, a new charm (AGI +4, Crit +5%): "No one in Khemi will rob you now. Some may still try to kill you."
  - She also gives a tip, which adds a hint line to the Hall of Judgement objective. "The jackal-god by the scale is bronze. Bronze weeps at hammers."
- **Keep it.** Kord: "Thieves keep what they steal." The Jade Eye sells for 300 silver to the armourer. The Jackal is delighted: "A true thief. Then we owe each other nothing, which is the best friendship of all." There's no ring.

---

## Engine and tools work

- **Objectives:**
  - `side: true` objectives are grouped under a **Side quests** heading in the Journal.
  - A new state, `closed`, shows "Lost to time", greyed; validate allows it.
  - Lock effects set it and take the quest items.
- **Encounters:** pay goes in `onWin` as `{gold}`; `onLose` is a list (heal plus a line).
- **sim.mjs:** a new single-encounter mode, `--enc <id> --level <n> [--party kord]`, which uses the snapshot loadout for that chapter.
- **replay.mjs:** a new `noEndCheck` option. Side-quest replays check only their `endFlags` and the absence of browser errors.
  - sq1-pit-straight
  - sq1-pit-dive
  - sq2-articles (with the grotto dice taken first, then the hook)
  - sq3-jackal (hand-over)
- **validate:** `closed`, side objectives and the new effect kinds.

## New assets (about $1 of the $20)

| Asset | Tool |
|---|---|
| bg/shz-pit | nanogen flash 512 + pixelize (world palette) |
| enemy/pit-champion (Hrolf) | imagegen2 + pixelize |
| npc/ulla, portrait/ulla | imagegen2 sprite, nanogen portrait |
| npc/jackal, portrait/jackal | imagegen2 sprite, nanogen portrait |
| sfx crowd-cheer | audiogen |

Item icons reuse existing ones: amulet (Torc), ring (Earring, Ring), document (Articles), misc (dice, candle, wax eye, seal-box), gem (Jade Eye) and sword (Old Mercy).
