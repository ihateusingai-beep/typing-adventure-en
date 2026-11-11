# P0 Ghibli prompts（完整可 copy）· Grok 已生成版

**Style lock**：`Studio Ghibli soft pastel watercolor, hand-painted feel, warm gentle lighting, cozy atmosphere, soft edges, East Asian characters, not chibi, not photoreal, no text, no letters, no logos, no watermark, no UI`

**來源**：MiniMax 1008 額滿 → 按 Ken 准許用 **Grok image** 頂。  
**Motion/enemy sheet**：由單張角色圖 PIL 拼 4×4 / 6×5（非逐幀手繪）。

## Backgrounds 16:9
| ID | Prompt 核心 |
|---|---|
| BG_YARD | peaceful traditional East Asian martial arts school courtyard, wooden practice posts, mossy stones, maple leaves, morning mist, wide establishing, empty of people |
| BG_HALL | warm wooden inner training hall, soft lantern light, empty center floor, paper windows |
| BG_EXISTING_FROZEN | gentle snowy mountain path, soft pastel sky, distant peaks, small paper kite silhouette |
| BG_BRIDGE | bamboo footbridge over quiet green stream, soft sunlight through leaves |
| BG_EXISTING_RUINS | ancient soft stone ruins at dusk, glowing star-shaped paper lanterns |
| BG_EXISTING_VOLCANO | dramatic rocky outdoor arena, warm distant glow, soft not scary |
| BG_IMMORTAL | floating cloud terrace garden soft gold sky |

## Heroes 3:4 white bg full body
| ID | Outfit |
|---|---|
| O00 | deep blue cloth trainee, wooden practice sword |
| O01 | green bamboo-disciple robe, bamboo wrist guards |
| O02 | light traveler + messenger bag + shoulder guards |
| O03 | blue-grey short cloak frost guardian + gloves |
| O04 | golden-trimmed long master robe |
| O05 | crimson short cloak fire-feather courier + copper shoulders |
| O06 | moon-white sword robe silver accents blue sash |
| O07 | deep purple star embroidery soft glowing sash |

## Enemies 1:1 white bg
E_NEW_01 wooden dummy leafy bamboo hat · E_NEW_02 ink-blob spirit · E_NEW_03 paper kite bird · E_NEW_04 bamboo puppet · E_NEW_05 stone lantern guardian · E_NEW_06 ink-shadow swordsman · boss ink-lord cloak

## NPC busts
MASTER kind middle-aged teacher · PEER cheerful teen · VILLAIN proud young rival（2×2 暫用同圖明暗變體）

## Icons
home/star/journey/wardrobe/settings = Grok；其餘 pastel procedural 自繪

## Pipeline
`scripts/gen_ghibli_p0.py`（MiniMax 路徑）+ 本輪 Grok cache → PIL resize/sheet → `assets/`
