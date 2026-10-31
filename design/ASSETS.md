# BarbarAIn — assets and spending

Budget $20. Prices: nanogen flash 512 $0.022, 1K $0.034 (table; prose says $0.067 -> worst case x2). audiogen music ~$0.30/min, sfx ~$0.12. imagegen2: measured at checkpoint 1 (see below).

| ID | File | Tool | Prompt (short) | Tries | Est. cost | Machine |
|---|---|---|---|---|---|---|
| party, bosses, mini-bosses, enemy sheets E1/E3, machine sheet M1, NPC sheets N1-N4, lady-waves (61 sprites + 6 mirrors) | game/assets/sprites/{party,enemy,npc}/*.png; M1 props in props/ (rebuild tools/rebuild/sprites.sh) | imagegen2 medium (singles + sheets), anchor ref | per GAME_DESIGN asset list | 25 calls | $0.55 | ain, ashkarran-unveiled, warden(+arm), steward, brass-sentinel, guardian-of-scales, M1 |
| prop sheets P1-P4 (23 props) | game/assets/props/*.png (rebuild tools/rebuild/props.sh) | imagegen2 sheets medium | puzzle props per GAME_DESIGN | 4 | $0.08 | no |
| item icons x24 | game/assets/icons/*.png | imagegen2 sheet (key drawn in code) | 6x4 icon grid | 1 | $0.02 | future-blade only |
| app icon + sizes | game/favicon.png, apple-touch-icon.png, icon-192/512/maskable-512.png | imagegen2 + Pillow | horned helm vs moon, teal glint | 1 | $0.015 | - |
| portraits x23 | game/assets/portraits/*.png | nanogen 512 edit (Kord portrait + sprite refs) | head-and-shoulders | 25 | $0.55 | ain, lady-grey, steward, silver-man |
| kord-attack, toktai-shoot, valka-lunge | sprites/party/<id>-1..4.png, -strip.png, <id>.json | anim8gen (imagegen2 medium 1024) | 4-frame attacks facing left | 19 images | $0.29 | no |
| backgrounds x42 | game/assets/bg/*.png (raws art-src/bg/*.jpg; rebuild tools/rebuild/bg.sh) | nanogen flash 512, tavern anchor ref | per STORY rooms | 52 | $1.14 | wyr-*, pyr-heart, pyr-apex |
| keyart x9 | game/assets/keyart/*.png | nanogen flash 512 | title-tower, godstone-reveal, wyrm-rising, ouroboros-heart, serpent-altar, stilled-khemi, dawn-at-sea, teal-sliver, last-page | 17 | $0.29 | all but title-tower, stilled-khemi, dawn-at-sea |
| kord-battle (anchor) | game/assets/style-anchor.png -> sprites/party/kord.png | imagegen2 medium 1024 transparent | Kord facing left, chunky SNES proportions | 2 | $0.03 | no |
| bg-shz-tavern (anchor) | game/assets/bg/shz-tavern.png | nanogen flash 1K | The Drowned Lamp tavern at night | 1 | $0.034 | no |
| enemy sheet E2 | sprites/enemy/{drunk,turanian-merc,cutthroat,ortho-bosun,stygian-slaver,pen-guard}.png | imagegen2 sheet 1536x1024 | six humans facing right | 1 | $0.021 | no |
| portrait kord | game/assets/portraits/kord.png | nanogen 512 edit | brooding horned helm | 1 | $0.022 | no |
| music x10 | game/assets/audio/music/{title,shadizar,dungeon,battle,boss,ending,gallows,wyrm,khemi,finale}.mp3 | audiogen music | per GAME_DESIGN audio table, no intro/fade | 12 (title, finale 2 each) | $4.28 | - |
| sfx x36 | game/assets/audio/sfx/*.mp3 (16 combat, 9 world, 5 stingers, 6 loops) | audiogen sfx | per GAME_DESIGN list | 38 (arrow, puzzle 2 each) | $4.56 | - |

## Running total
- Audio: $8.54 (estimate at skill rates; restricted key can't read billing)
- Art prototype: $0.105
- Backgrounds + key art: $1.43
- Animations: $0.29
- Props, icons, app icon, portraits: $0.65
- Characters and enemies: $0.55
- Total: $11.57 (art $3.03 + audio $8.54)

## Checkpoint 1 (2026-10-30)
imagegen2 model gpt-image-2.5-flare, OpenAI pricing page (developers.openai.com/api/docs/pricing, 2026-10-30): text in $5/M, image in $8/M, image out $30/M.
Measured: single sprite medium 1024 ~= $0.0145; sheet 1536x1024 with anchor ref ~= $0.0205.
Re-projection: imagegen2+anim8gen lines ~= $1.4 (planned $4.98) -> whole plan ~= $12. No pre-committed cuts triggered; all should-assets (portraits, anim8gen, icons, key art) stay in.

## Change: alternate endings (2026-10-31), own budget $20

| Asset | File | Tool | Takes | Cost | Notes |
|---|---|---|---|---|---|
| keyart x3 | game/assets/keyart/wyrm-homeward.png, shattered-core.png, kings-tomb.png | nanogen flash 512 + pixelize (machine palette) | 4 | $0.09 | shattered-core: v1 used, its crescent moon painted out (the finale is at the dark of the moon); v2's teal horizon was rejected |

- Change total: $0.09 of $20. Game total: $11.66.

## Change 2: side quests (2026-10-31), own budget $20

| Asset | File | Tool | Takes | Est. cost | Machine | Notes |
|---|---|---|---|---|---|---|
| bg shz-pit | game/assets/bg/shz-pit.png (raw art-src/bg/shz-pit.jpg) | nanogen flash 512, tavern anchor ref + pixelize 320x180 (world palette) | 2 | $0.044 | no | v1 rejected: crowd not visible, a moonlit window in a cellar; v2 used (prompt adds a visible silhouette crowd, no sky) |
| enemy pit-champion (Hrolf) | game/assets/sprites/enemy/pit-champion.png (raw art-src/sprites/pit-champion.png) | imagegen2 medium 1024 transparent, Kord anchor ref + pixelize --height 54 (world) | 1 | $0.015 | no | faces right like the other enemies (the battle draws enemies on the left facing right) |
| npc ulla | game/assets/sprites/npc/ulla.png (raw art-src/sprites/ulla.png) | imagegen2 medium 1024 transparent, Kord anchor ref + pixelize --height 46 (world) | 2 | $0.029 | no | faces right; v1 had short cropped hair; v2 used, retaken to match the portrait (long grey braid, three gold earrings) |
| npc jackal | game/assets/sprites/npc/jackal.png (raw art-src/sprites/jackal.png) | imagegen2 medium 1024 transparent, Kord anchor ref + pixelize --height 44 (world) | 1 | $0.015 | no | faces right |
| portrait ulla | game/assets/portraits/ulla.png (raw art-src/portraits/ulla.jpg) | nanogen 512 edit (Kord portrait + sprite refs) + pixelize 64x64 --bg (world) | 2 | $0.044 | no | v1 read as a man; v2 used (clearly female face, long grey braid, three gold ear rings, cheek scar) |
| portrait jackal | game/assets/portraits/jackal.png (raw art-src/portraits/jackal.jpg) | nanogen 512 edit (Kord portrait + sprite refs) + pixelize 64x64 --bg (world) | 1 | $0.022 | no | |
| sfx crowd-cheer | game/assets/audio/sfx/crowd-cheer.mp3 | audiogen sfx, 2 s, mp3_44100_128 | 1 | $0.12 | - | RMS -15.9 dB, peak -2.8 dB; manifest volume 0.79 (target -18 dB) |

- Change total: $0.30 of $20. Game total: $11.96.
