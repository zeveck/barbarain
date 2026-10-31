# BarbarAIn — alternate endings (change request)

Request (as typed): `/gg:gamegen --change add two alternate endings, one unlocked by a choice in chapter III`

The game had one ending. It now has three. The existing ending stays exactly as
it was and becomes ending A. The two new ones are B and C.

| | Ending | How you get it | What happens |
|---|---|---|---|
| A | **The Long Watch** (the existing one) | Final choice: "Go home, Stone." | Ain steers the Steward's core home through the River of Hours and sits with it forever. The sliver, the last page in the far future, and the loop all play as before. |
| B | **The Hound of Hours** (new) | **Chapter III choice: spare the Wyrm**, then in the finale take the option this unlocks: "Call the hound." | The spared Wyrm rises out of the bay and carries the core home in Ain's place. Ain comes back out into its stone and stays with Kord. The last page is set in Kord's tomb: Ain rode in his crown, was buried with him, and waited 12,000 years to be found by the scholars who named their mind after it. The loop closes tighter: Ain is literally the stone they found. |
| C | **The Barbarian's Answer** (new) | Final choice: "Break it." (always offered) | Kord does what he promised in chapter III ("beach the boat and kill the rower"): he shatters the core while it lies open. The Steward ends forever, and Ain, entangled in it, ends with it. The only thing left is the sliver in Kord's pouch, smaller and dimmer than before; it is the narrator. The last page is set in the tomb, and the loop still closes through the golden book. |

Every ending keeps the narrator surprise and the serpent-eats-its-tail line,
each with its own shading.

## Choice 1: chapter III, the Captive Sun (after the Warden falls)

This replaces the start of `sc_beaching`. Before driving the Wyrm aground, Ain
offers two ways to finish it and asks Kord to choose. The narrator adds one
signpost line: *"Of everything Kord decided in the belly of the Wyrm, this is
the one I have thought about longest."* The party argue it in character:

- **Ain:** "I can run this body aground on the Stygian shore. Then one thing more. I can burn out its heart, and it dies. Or I can cut its leash, the cord that ties it to the mind under the pyramid, and let it sleep. It has done nothing it was not made to do."
- **Valka** wants it dead: "It swallowed my ship." Ain: "It kept your crew alive. It was gentle with her, Captain. I checked."
- **Toktai** leans toward mercy: "On the steppe, a horse that throws you is still a horse. You do not eat it. Usually."

Kord chooses one of two replies:

1. **"Burn its heart."** Kord: "Then we beach the boat and kill the rower." The canon beaching plays as written.
   - Flag: `ch3.wyrm_killed`.
   - The star leaves a coal: **Sun-shard**, a charm with Crit +8%, "Still warm." It is a real reward now, so the choice isn't free.
2. **"Cut its leash. Let it sleep."** Kord: "Let the dog sleep. We kill the master." Ain cuts the cord, and the Wyrm runs aground gently and lies in the shallows with its eyes shut and a slow teal pulse under the lids.
   - Ain: "It has no master now. If anyone ever calls it, it will be me."
   - Flag: `ch3.wyrm_spared`. There is no item.

**Default when the flag is missing** (debug chapter jumps, old saves): neither flag is set, so the game treats it as *killed* (canon).

**Chapter IV follow-through** (only when `ch3.wyrm_spared` is set):
- The Beached Wyrm room's description and short description, plus the Wyrm thing's look, hit and use responses, say *sleeping* instead of *dead*.
- The opening dawn line of chapter IV changes the same way.
- The crew glance at it nervously, and a sailor swears it breathed.
- There are no other changes in chapter IV.

## Choice 2: chapter V, the open core (after the Steward battle)

The ending chain is split. After the Steward is beaten, `sc_resolution` plays as written: the key turns back and the Stillness ends.

The chain then **stops**. The party stand on the apex before the open core, with Ain a spark inside it.
- That state is a rest point, so the game autosaves there, and reloading lets you choose again without refighting the boss.
- New objective `ch5_choice`: "Decide what becomes of the Steward's core." Its hints point at talking to Ain.
- The room description switches to this state.
- A new thing, **core**, responds to look, talk and use; talking, using it or striking it opens `dlg_finale`.
- The party's banter here gives their views. Valka: smash it, because things like that don't stay asleep. Toktai: it's for the chief to decide.

`dlg_finale`:
- Ain lays out the stakes honestly.
  - "Someone must steer it home and sit with it, and I can."
  - "Or break it now, while it is open; we are one stone until I lead it out, so I break with it."
  - "I cannot choose this one, Kord. I have done enough wanting for one night."
- If `ch3.wyrm_spared`: far below in the bay, two teal eyes open. Toktai: "The bronze dog. The one we let sleep. Could a dog carry it?" Ain: "...It could. It would. It has no master but me."
- **Options:**
  - "Go home, Stone." (A)
  - "Call the hound." (B, only if spared)
  - "Break it." (C, with one confirmation step: "Strike." / "Not yet.")
  - "Not yet." (leave)
- Each path sets `ch5.ending` = `watch` | `hound` | `answer`, then:
  - A: `sc_farewell`.
  - B: `sc_hound`, with key art `wyrm-homeward`: farewells to the Wyrm, Ain's stone falls into Kord's palm, and lines adapted from the farewell.
  - C: `sc_break`, with key art `shattered-core`: Ain: "Then do it well. One blow."
- Then `sc_collapse` → `epi_dawn`, the same for all three.

## Epilogue variants (`epi_dawn`, keyed on `ch5.ending`)

- **sc_sliver:**
  - A: unchanged.
  - B: the pouch holds the whole dim Godstone, waking up: "I appear to have stolen myself. Is that allowed?"
  - C: an even smaller voice: "I kept a little of myself here. Not much. Enough to remember. Is that stealing?"
  - Kord's line "Everything worth having is stolen." stays in all three.
- **sc_last_page:**
  - A: unchanged (far-future hall, `last-page` art).
  - B and C use new art `kings-tomb` and their own text.
- **Valka, Toktai and Bakari's dawn dialogues:** small variants for B (Ain is present, asleep in the pouch) and C (gone for good). A is unchanged.

## End screen

- It shows the ending's name: "Ending: The Hound of Hours".
- It shows **Endings found: n of 3**, stored in settings so it lasts across saves and new games.
- It gives a one-line hint for each ending not yet found:
  - A: "Ain offered to go home. Kord could have let it."
  - B: "A mercy shown in the belly of the Wyrm is repaid at the very end."
  - C: "Kord's sword had one more stroke in it."

## New assets

There are 3 key-art images, all machine assets (teal allowed). They are made with nanogen flash 512 through the existing `gen.py`, so the pipeline, style line, palette and pixelize step are the same as the other 9.

| id | prompt gist |
|---|---|
| ka-wyrm-homeward | Night, the broken black pyramid apex by a dark bay; the colossal bronze serpent-ship rises from the sea, calm, eyes soft teal, coiling around a column of teal light that bears a door-sized black crystal upward |
| ka-shattered-core | Black stone apex under stars; a door-sized black crystal bursting into shards; teal sparks scattering upward and fading; a barbarian silhouette with sword lowered |
| ka-kings-tomb | A torch-lit stone tomb; on a bier lies an iron crown with a small teal stone set in it, beside a stack of beaten-gold leaves; dust, quiet, ancient |

The estimated cost is about $0.07, or about $0.15 with retakes. There's no new audio: the existing `ending` and `stillness` music cover these scenes.

## Testing

- `validate.mjs` reports 0 errors.
- The ch3 and ch5 replay solutions are updated, and each new path has its own replay: ch3 spare and kill; ch5 A, B and C, with B started from a spared ch3 state.
- A continuous New Game → end run.
- dod-check on the end screen at all sizes.
- Every other chapter replays unchanged.
