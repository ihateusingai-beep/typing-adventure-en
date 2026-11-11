# 電腦打字大冒險 · Assets 重生清單

> **用途**：原作美術不便使用 → 你按自己風格重畫/重生成。  
> **原則**：路徑對齊即可 drop-in；或改路徑後同步改 `game-data/media.json` + `src/icons.mjs`。  
> **App**：`~/works/wuxia-typing-en-clone/`  
> **Live**：暫仍含第三方檔，**換齊 P0 後應刪原 `assets/` 再 Push**。

---

## 0. 結論（先做邊啲）

| 優先 | 範圍 | 大約數量 | 做完可玩程度 |
|---|---|---|---|
| **P0** | 英文 29 關劇情 + UI | ~90 檔 | 主線全通、服裝 O00–O07 |
| **P1** | 服裝牆 O08–O15 + 抽卡/仙途等 | + portrait/thumb/motion | 衣櫃完整 |
| **P2** | 挑戰場景卡、rift/limited 全套 | 可延後 | 裝飾/高階模式 |

**建議順序**：風格 bible → UI icons → 7 背景 → 3 NPC sheet → 7 敵人 → 主角 O00 → 其餘 O01–O07 → 字體。

---

## 1. 技術契約（生成規格鎖）

| 類型 | 副檔名 | 規格 | 接線 |
|---|---|---|---|
| 背景 | `.webp` | **1672×941**（或 16:9 接近） | `media.json` → `backgrounds.*` |
| 主角立繪 | `.webp` | 透明底，高約 **400px**，寬 ~210–250；`aspect`≈0.53–0.63 | `portraits.Oxx` `single:true` |
| 主角縮圖 | `.webp` | ~128–256 邊 | `portraits.Oxx.thumbnail` / wardrobe |
| 主角動作 sheet | `.webp` | **4×4**，cell **640×640**，整圖 **2560×2560**；`footAnchor≈[320,620]` | `motion.Oxx` |
| 必殺 signature | `.webp` | **2×3**，cell **640×640** | `motion.Oxx.signature` + attack action asset |
| 敵人 sheet | `.webp` | **6×5**，cell **256×256**，整圖 **1536×1280**；`footAnchor≈[128,246]` | `enemies.*` |
| NPC 表情 sheet | `.webp` | **2×2** 四表情 | MASTER / PEER / VILLAIN |
| UI icon | `.webp` | 顯示 32×32（源可 128） | `assets/v3/ui/icons|details/{id}.webp` |
| 標題字 | `.woff2`/`.ttf` | 任意自用字，改 CSS `@font-face` | `fonts/` + `styles/app.css` |
| Boss 後備 | `.gif` 可選 | 無 sheet 時 | `assets/monsters/nether_lord_boss.gif` |

### 主角 motion 幀位（必須跟呢個，否則動畫錯格）

```
grid 4×4 (index 0–15, 左→右、上→下)
idle:    start 0,  count 2
run:     start 2,  count 4
jump:    start 3,  count 2
cast/seal: start 6, count 2
attack:  start 8,  count 4
defense: start 12, count 2
hurt:    start 14, count 2
victory: 可重用 idle
```

### NPC 表情格（2×2）

| ID | 檔 | 四格順序（左上→右上→左下→右下） |
|---|---|---|
| MASTER | `assets/v3/portraits/master-portraits.webp` | calm, demonstrating, encouraging, proud |
| PEER | `.../peer-portraits.webp` | happy, thinking, surprised, relieved |
| VILLAIN | `.../villain-portraits.webp` | smug, focused, surprised, respectful |

---

## 2. 主線章節 ↔ 背景 / 敵人 / 服裝

| 章 | 標題 | 背景 ID | 敵人 ID（名） | 關卡解鎖服裝 |
|---|---|---|---|---|
| C01 | 劍心初醒 | `BG_YARD` | `E_NEW_01` 竹葉木樁 | `O01` @ S01-04 |
| C02 | 雙手歸位 | `BG_HALL` | `E_NEW_02` 墨點小靈 | `O05` @ S02-04 |
| C03 | 踏雲送信 | `BG_EXISTING_FROZEN` | `E_NEW_03` 送信紙鳶 | `O02` @ S03-05 |
| C04 | 竹影守橋 | `BG_BRIDGE` | `E_NEW_04` 竹橋機關偶 | `O06` @ S04-04 |
| C05 | 星燈數陣 | `BG_EXISTING_RUINS` | `E_NEW_05` 星燈石衛 | `O03` @ S05-05 |
| C06 | 連字成招 | `BG_EXISTING_RUINS` | `E_NEW_06` 墨影劍侍 | `O07` @ S06-04 |
| C07 | 鍵心歸一 | `BG_EXISTING_VOLCANO` | `nether_lord_boss` 墨影門主 | `O04` @ S07-03 |

開場預設服裝：`O00` 布衣少俠（無 node）。

---

## 3. P0 清單（主線必做）

### 3.1 背景 ×7（+1 可選仙庭）

| path | ID | 場景意象（自訂風格時可改畫風，建議保留「可讀地點」） |
|---|---|---|
| `assets/v3/backgrounds/BG_YARD.webp` | BG_YARD | 師門庭院 |
| `assets/v3/backgrounds/BG_HALL.webp` | BG_HALL | 山門內廳 |
| `assets/v3/backgrounds/BG_EXISTING_FROZEN.webp` | BG_EXISTING_FROZEN | 山路/雪嶺 |
| `assets/v3/backgrounds/BG_BRIDGE.webp` | BG_BRIDGE | 竹橋渡口 |
| `assets/v3/backgrounds/BG_EXISTING_RUINS.webp` | BG_EXISTING_RUINS | 遺跡/星燈城 |
| `assets/v3/backgrounds/BG_EXISTING_VOLCANO.webp` | BG_EXISTING_VOLCANO | 決戰/火山感 |
| `assets/v3/backgrounds/BG_IMMORTAL.webp` | BG_IMMORTAL | 可選；可與 YARD 共用暫代 |
| `assets/v3/xianxia/immortal-court.webp` | （部分 UI） | 可選；可暫指向 YARD |

### 3.2 敵人 sheet ×6 + Boss

| path | ID | 名稱 | 規格 |
|---|---|---|---|
| `assets/v3/enemies/E_NEW_01.webp` | E_NEW_01 | 竹葉木樁 | 6×5 · 256 cell |
| `assets/v3/enemies/E_NEW_02.webp` | E_NEW_02 | 墨點小靈 | 同上 |
| `assets/v3/enemies/E_NEW_03.webp` | E_NEW_03 | 送信紙鳶 | 同上 |
| `assets/v3/enemies/E_NEW_04.webp` | E_NEW_04 | 竹橋機關偶 | 同上 |
| `assets/v3/enemies/E_NEW_05.webp` | E_NEW_05 | 星燈石衛 | 同上 |
| `assets/v3/enemies/E_NEW_06.webp` | E_NEW_06 | 墨影劍侍 | 同上 |
| `assets/monsters/nether_lord_boss.gif` **或** 自訂 sheet 後改 `media.json` | nether_lord_boss | 墨影門主 | gif 後備 **或** 同敵人 sheet 規格 |

> Boss 若只出靜態/簡易 sheet：可暫時複製 `E_NEW_06` 並改色，再在 `media.json` `enemies` 加 entry（要改 `media.mjs` 讀 boss 邏輯者另說；現況 boss 偏 gif fallback）。

### 3.3 NPC 表情 sheet ×3

| path | ID |
|---|---|
| `assets/v3/portraits/master-portraits.webp` | MASTER 師傅 |
| `assets/v3/portraits/peer-portraits.webp` | PEER 小禾 |
| `assets/v3/portraits/villain-portraits.webp` | VILLAIN |

### 3.4 主角服裝 O00–O07（每套 4 檔）

每套需要：

1. `assets/v3/q3/{ID}-portrait.webp`
2. `assets/v3/q3/{ID}-thumb.webp`
3. `assets/v3/q3/{ID}-motion.webp`（4×4）
4. `assets/v3/signatures/{ID}-attack.webp`（2×3）

| ID | 名稱 | 稱號 | 解鎖 | 造型關鍵詞（方便 prompt，可全改） |
|---|---|---|---|---|
| O00 | 布衣少俠 | 初入江湖 | 預設 | 深藍布衣、練習劍 |
| O01 | 青竹弟子 | 雙手有了家 | S01-04 | 交領、竹紋護腕 |
| O02 | 雲行俠客 | 踏雲送信 | S03-05 | 輕肩護、送信袋 |
| O03 | 玄霜護行 | 星燈引路 | S05-05 | 短披風、護肩手套 |
| O04 | 天衡宗師 | 鍵心歸一 | S07-03 | 長劍袍、師門腰飾 |
| O05 | 火羽行者 | 急信送達 | S02-04 | 赤紅披風、銅甲 |
| O06 | 月華劍使 | 竹橋之約 | S04-04 | 月白劍袍、銀甲 |
| O07 | 星河劍隱 | 連招成訣 | S06-04 | 深紫繡星、流光穗 |

**小計 P0 主角**：8 × 4 = **32 檔**

### 3.5 UI icons（P0 全做，好少工）

**主 icon** → `assets/v3/ui/icons/{id}.webp`  
`home, journey, challenges, wardrobe, boss, target, combo, score, clock, next, sound, gem, rank, spell, talisman, shield, settings, pause, gift, star`  
（20 個）

**細節 icon** → `assets/v3/ui/details/{id}.webp`  
`back, retry, help, keyboard, cloud, local, user, lock, check, fullscreen, upload, download, run, jump, exit, close`  
（16 個）

**Favicon / 入口**  
`assets/ui/portrait.png`（任意方圖；品牌標）

### 3.6 字體

| path | 說明 |
|---|---|
| `fonts/font_wuxia_title.woff2.ttf` | 標題用；可換任何授權字，檔名可保留或改 `styles/app.css` `@font-face` |

### 3.7 P0 數量速算

| 類 | 數 |
|---|---|
| 背景 | 7–8 |
| 敵人+Boss | 7 |
| NPC sheet | 3 |
| O00–O07 ×4 | 32 |
| UI icons | 36 |
| portrait.png + font | 2 |
| **合計** | **~87–90** |

---

## 4. P1 清單（服裝牆加料，可第二輪）

### 4.1 O08–O15（珍藏/仙途）

每套最少：**portrait + thumb**；要預覽攻擊再加 **motion（+ signature）**。

| ID | 名稱 | 備註 |
|---|---|---|
| O08 | 天符星師 | item 解鎖 |
| O09 | 幽蓮劍仙 | item |
| O10–O15 | 靈墨練氣…九霄渡劫 | `category: immortal` 仙途 |

路徑同 P0：`assets/v3/q3/Oxx-*.webp`、`assets/v3/signatures/Oxx-attack.webp`

### 4.2 其他 media.json 可能仲有

- `ordinary-heroines` O30–O37  
- `limited` O16–O20  
- `rift` O21–O29  

**今次主線唔使**；衣柜若顯示「尚未取得」缺圖可接受，或用 O00 thumb 做 placeholder（要改 code）。

---

## 5. P2（可延後）

| path pattern | 用途 |
|---|---|
| `assets/v3/challenges/{forest,frozen,cave,ruins,volcano}.webp` | 挑戰大圖 |
| `.../{name}-card.webp` | 挑戰卡 |
| `.../marks/{name}.webp` | 40×40 標記 |
| `assets/backgrounds/battle_forest_pixel.jpg` | 舊 CSS fallback（可刪/改 CSS） |

---

## 6. 生成 Prompt 骨架（可複製）

### 背景
```
[你的風格], wide establishing shot, 1672x941, game background, no UI, no text, no watermark,
location: {庭院/內廳/雪嶺山路/竹橋/遺跡星燈/決戰山}, readable silhouette, soft lighting
```

### 立繪
```
[你的風格], full body hero portrait, transparent background, facing camera slightly 3/4,
height ~400px composition, clean edges, single character, no text,
outfit: {描述}
```

### Motion sheet
```
[你的風格], character sprite sheet, 4x4 grid, each cell 640x640, identical scale and foot position,
transparent background, same outfit as portrait {ID}, frames: idle idle run run run run jump jump,
cast cast attack attack attack attack defense defense hurt hurt
```

### 敵人 sheet
```
[你的風格], enemy sprite sheet, 6x5 grid, cell 256x256, transparent bg, foot planted,
creature: {木樁/墨靈/紙鳶/機關偶/石衛/劍侍}
```

### UI icon
```
[你的風格] simple game UI icon, {home/star/...}, centered, readable at 32px, soft bg or solid as needed, no text
```

（你偏好 Ghibli soft pastel 可寫死在 bible，全套共用。）

---

## 7. 換檔流程（實操）

1. 自訂圖放到**相同 path**（或新 path）。  
2. 若 path 變了：改 `game-data/media.json` 對應 `src` / `thumbnail`。  
3. Icons 只認 `src/icons.mjs` 固定 path。  
4. 本地：`cd ~/works/wuxia-typing-en-clone && npx --yes serve .`  
5. 驗：入場立繪、山門 BG、第一關敵人、按 F 有 attack 幀、服裝牆 thumb。  
6. **刪光第三方原檔**後再 `Push`。  
7. 可加 `docs/STYLE_BIBLE.md` 鎖色/比例，方便分批生成一致。

---

## 8. 法律 / 使用

- 現 repo `assets/`、`fonts/` 來自他方遊戲，**尺寸與 grid 可參考，像素內容勿當你的教材公開資產**。  
- 本清單只描述**引擎契約 + 路徑 + 文案關鍵詞**，方便你重生。  
- 公開課前：P0 全換 + 搜 repo 無舊 webp hash。

---

## 9. 你下一步（揀一）

1. **你出圖，我收檔**：你丟資料夾/ zip，我對 path + 改 media + 驗 +（你講 Push 先）上線。  
2. **我按 Ghibli bible 幫你寫每張完整 prompt 表**（P0 逐檔可 copy）。  
3. **先砍 repo 內第三方 assets**，改 placeholder 色塊，等你圖至再換（避免誤用）。

覆 `1` / `2` / `3` 或「順序 2 然後 3」。

[STATUS: DONE]
