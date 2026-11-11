# Assets / 特效盤點（2026-03-22 · 更新 fx1）

**產品**：電腦打字大冒險（主線 = 英文劇情 29 關 + 服裝）  
**結論一句**：主線 **可玩圖已齊**；**P0 音效／BGM + O00／E_NEW_01 真姿勢 + 通用 combat FX** 已補上 `?v=fx1`。

---

## A. 主線現況

| 類 | 狀態 | 說明 |
|---|---|---|
| 背景 7 | ✅ | BG Ghibli 靜圖 |
| 敵人 6 + boss | ✅ | **E_NEW_01 真多姿勢 sheet**；其餘仍假動畫拼格 |
| NPC 3 | ✅ | |
| O00–O07 | ✅ | **O00 motion／signature 真姿勢**；O01–O07 仍舊拼格 |
| O08–O15 | ⚠️ | 變色 placeholder |
| UI icons | ✅ | |
| **audio/** | ✅ | 3 BGM + 10 SFX mp3（`?v=fx1`） |
| **combat-fx** | ✅ | blade/ward/thunder/frost/flame |
| **O00-fx + icon** | ✅ | signatures/ |
| 挑戰卡 | 檔在／UI 關 | legacy 已擋 |

---

## B. 已完成 P0（fx1）

1. **AUD-1** `audio/*.mp3`：title/main/battle BGM + correct/wrong/attack/crit/hurt/guard/levelup/click/buy/cast  
2. **MOT-1 範本**：O00 4×4 真 idle/run/jump/cast/attack/defense/hurt；E_NEW_01 6×5 真 idle/anticipation/attack/hurt/exit  
3. **FX-1 通用**：`assets/v3/combat-fx/*` + `O00-fx.webp` / `O00-icon.webp` + xianxia sword_arc／relic-arts 後備  

腳本：`scripts/pack_motion_fx.py`（去底 flood-fill + pack）

---

## C. 仍可做（非 blocker）

| 優先 | 項 |
|---|---|
| P1 | O01–O07／其餘敵人套用同一真姿勢 pipeline |
| P1 | O08–O15 真衫 |
| P1 | NPC 真表情 |
| P2 | 高質授權 BGM（而家係合成 loop，課用夠） |
| P2 | rift／限定／靈寶（已關） |

---

## D. Live

https://ihateusingai-beep.github.io/typing-adventure-en/?v=fx1

[STATUS: DONE fx1]
