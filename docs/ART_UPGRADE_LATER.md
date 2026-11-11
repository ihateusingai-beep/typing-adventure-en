# 日後再做 · 美術／系統升級計劃（暫不執行）

> 2026-03-22 記錄。Ken：**唔升級住**，只寫 plan。  
> 現況 P0 Ghibli 靜圖已上線；下列為品質／完整度 backlog。

---

## A. 美術動畫升級（角色／敵人）

| 優先 | 項目 | 現況 | 目標 |
|---|---|---|---|
| A1 | 主角 motion O00–O07 | 單姿 PIL 拼 4×4 假動畫 | **逐幀** idle/run/attack/hurt（同 STYLE_BIBLE） |
| A2 | Signature sheet | 單姿 2×3 變體 | 真 6 幀出招 |
| A3 | 敵人 sheet E_NEW_01–06 | 單姿 6×5 拼格 | 真 idle/anticipation/attack/hurt/exit |
| A4 | Boss nether_lord | 靜態 gif | 完整 sheet 或 4–6 幀 gif |
| A5 | NPC 2×2 表情 | 同圖明暗變體 | 4 表情真畫（calm…） |
| A6 | O08–O15 | O00 變色 placeholder | 獨立造型 portrait+thumb+motion |
| A7 | 角色一致性 | 各 outfit 臉略漂 | 用 reference_image 鎖同一主角 |

**建議流程（日後）**  
1. 鎖 O00 base 正面／3/4 參考圖  
2. img2img 出 8 套衣服  
3. 每套最少 4 pose（idle/run/attack/hurt）→ 自動 pack 4×4  
4. 敵人類推  
5. 換檔 + smoke 戰鬥幀位 + Push

**工具**：MiniMax 優先；額滿先 Grok（Ken 已准）。腳本可擴 `scripts/gen_ghibli_p0.py`。

---

## B. 音效／音樂

| 項目 | 現況 | 目標 |
|---|---|---|
| `audio/*.mp3` | **全 404**（靜默失敗） | 自製或授權 BGM/SFX 落地 |
| 路徑 | `src/media.mjs` Sound class | 可改相對 `audio/` |

---

## C. 挑戰／試煉系統（功能洞）

| 項目 | 現況 | 目標 |
|---|---|---|
| `legacy.html` 五關挑戰 | **未打包** → iframe 白等 | 移植 legacy 或用本 repo 戰鬥引擎重做 5 關 |
| 無盡 Boss / 排行榜 | 依賴 legacy + 雲端 | 本地 only 無盡 or 隱藏 |
| 秘境 Rift | code 仍在，dock 已藏 | 要就接 local save |
| PvP | 不需要 | 維持切除 |

**2026-03-22 止血**：dock 只留 山門／劇情／服裝；`startLegacy` toast 後返回。

---

## D. 小優化（非 blocker）

- 標題字：現用系統 Songti；可換自有授權字  
- 挑戰卡圖已用 BG placeholder  
- `store.config.legacyLeaderboardUrl` 空字串 OK  
- 主線通關後 Boss UI 可能仍指 legacy → 與 C 一齊處理  
- SEN 化（身份卡、大字、A/B/C/D）— 另開需求，非本 fork 範圍

---

## E. 驗收清單（升級完成時）

- [ ] 戰鬥 hero/enemy 肉眼見 pose 變化（非只位移）  
- [ ] O00–O07 臉一致  
- [ ] 無第三方殘圖（hash 抽查）  
- [ ] 有 SFX 至少 correct/wrong/click  
- [ ] 挑戰可玩 **或** UI 永久隱藏且無死路  
- [ ] Live smoke：入場→S01-01 得分→服裝→匯出存檔  

[STATUS: PARKED]
