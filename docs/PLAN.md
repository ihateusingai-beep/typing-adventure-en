# 武俠打字傳 → 英文-only 訪客版｜計劃書

**來源：** https://wuxia-typing-journey.changsheng0612.workers.dev/#/home  
**版本：** v3.24.4  
**研究日：** 2026-03-22  
**目標：** 用 clone-website skill **fork 改造**，只保留 **英文鍵盤打字** 旅程；**完全去掉 Google / Firebase 登入**。  
**狀態：** 研究完成 · 等你批「順序」先動工  
**預設 app-root：** `~/works/wuxia-typing-en-clone/`

---

## 0. 一句結論

**可以 clone，而且適合 clone。**  
但 **唔係** Next pixel-perfect 全站抄。  
原站係 **Cloudflare Workers 靜態殼 + 原生 ES module SPA**（`src/main.mjs` 入口）。  
最佳路徑 = **靜態 SPA fork-adapt**（下載模組 + 剪枝），再 guest-only localStorage。

英文路線本身已係一等公民（`route=en`）；注音係平行 save。  
砍 `zh-bpmf` + 砍 Firebase = 符合你需求，工程量可控。

---

## 1. 原站解剖（Recon）

### 1.1 Tech stack

| 層 | 實況 |
|---|---|
| 宿主 | Cloudflare Workers 靜態（SPA fallback → index.html） |
| 前端 | Vanilla JS ES modules，無 React/Vue/Next |
| 入口 | `index.html` → `src/main.mjs?v=3.24.4`（~83KB） |
| 路由 | hash：`#/home` 等；另有 `?route=` / `localStorage wuxia_typing_route` |
| 樣式 | 18 個 CSS（app/game-ui/battle/missions…）+ 自訂字體 Wuxia |
| 美術 | `game-data/media.json` 清單 + `assets/v3/**` webp（portrait/motion/bg/enemy） |
| 雲端 | Firebase Auth（Google popup）+ Firestore 同步（`storage.mjs`） |
| 訪客 | **已完整可玩**：`localStorage wuxia_typing_guest_v3`，唔登入都得 |

### 1.2 雙路線（關鍵）

```
stores = {
  en:      SaveStore('en')        // gameId: wuxia_typing_v3
  zh-bpmf: SaveStore('zh-bpmf')   // gameId: wuxia_typing_bpmf_v3
}
```

- **英文判定：** `event.code`（物理鍵）對 `KeyF` 等，**唔靠 IME 出字**
- **注音判定：** 同一套 physical key，目標字用 ㄅㄆ… map（`keyboard.mjs` BPMF_KEYS）
- 你要：**永久鎖 `en`**，刪 route-switch UI + bopomofo 資料

### 1.3 英文劇情課程（保留核心）

7 章 · **29 nodes**（`game-data/curriculum.mjs`）

| 章 | 標題 | 節點 | 教什麼 |
|---|---|---|---|
| C01 劍心初醒 | S01-01…04 | F/J → D/K 家鍵 |
| C02 雙手歸位 | S02-01…04 | 基準列 A–; |
| C03 踏雲送信 | S03-01…05 | 上排 Q–P |
| C04 竹影守橋 | S04-01…04 | 下排 Z–M |
| C05 星燈數陣 | S05-01…05 | 數字 0–9 |
| C06 連字成招 | S06-01…04 | Space / 短字 / , . / Shift 大小寫 |
| C07 鍵心歸一 | S07-01…03 | 防禦 intro → word+guard → Boss |

**Mechanics 分佈：**

- `static_key` ×24（主幹）
- `word_sequence` ×1（短字：`as dad sad fall…`）
- `shift_case` ×1
- `guard_intro` / `word_guard` / `story_finale` ×1 each（C07）

完成條件多數：`correctKeypresses` 目標數；後期 word/guard 混合。

### 1.4 打字引擎契約（必須原樣保留）

`src/core.mjs`：

```
makeSession(node) → session{targets, index, progress, correct, attempted, combo…}
targetOf(session) → {value, char, kind, shift?}
physicalCode(char) → KeyboardEvent.code
applyInput(session, event) → {state, event: correct|miss|complete|guard|ignored}
sessionResult / completeNode / resultStars / blankSave / normalizeSave
```

規則精華：

- 忽略 repeat / ctrl / meta / alt
- 用 **`event.code`**，唔用 `event.key`（對 SEN 英文指法課極重要）
- case 關要對 `shiftKey`
- 錯鍵唔跳目標（「目標會等你」）

### 1.5 畫面流（主線）

```
Entry/Home（山門）
  → Journey（劇情地圖選關）
  → Dialogue（開場台詞 + 觀察/自己來）
  → Battle（目標字 + 手指提示 + hero/enemy sprite + 鍵位 hint）
  → StoryResult（星數/解鎖）
  → Wardrobe（服裝，劇情解鎖）
```

Dock：山門 / 劇情 / 挑戰 / 試煉 / 服裝  
Header：badge 星數 · 選單（帳號·設定·全螢幕·路線切換）

### 1.6 登入系統（要刪）

`storage.mjs`：

- `cloudServices()` 動態 import Firebase 12.19 CDN
- `login()` → `GoogleAuthProvider` + `signInWithPopup`
- Firestore doc 同步、revision transaction、collection 抽卡交易
- Guest path：`GUEST_KEY` localStorage，**無帳號已可全劇情**

**策略：** 重寫 `SaveStore` 做 **LocalOnlyStore**（只 localStorage + export/import JSON），刪全部 cloud/auth UI。

### 1.7 週邊系統盤點（要決定去留）

| 模組 | 檔案量級 | 建議 |
|---|---|---|
| 英文劇情+戰鬥 | main/core/content/media/enemy-director… | **P0 必留** |
| 訪客存檔 | storage 簡化版 | **P0 必留** |
| 服裝（劇情 outfit O00–O07 等） | costumes + media motion | **P0/P1 留故事解鎖** |
| 挑戰 Challenges | challenge-* + CSS | **P1 可選**（3 分鐘英文挑戰） |
| 試煉 Trials / Endless | trials CSS + collection | **P2 或砍** |
| 裂隙 Rift / 鍛造 | rift-* | **砍**（依賴雲端/複雜經濟） |
| PvP / LAN | pvp/* | **砍** |
| 注音 bopomofo | bopomofo.mjs + route UI | **砍** |
| Google/Firebase | storage cloud + sign-in.css | **砍** |
| 抽卡 collection gacha | collection* 大部 | **砍或極簡**（只留 outfit 解鎖） |

### 1.8 美術 / 體積

- `media.json` ~115KB，約 **208** 條 asset path
- 單張 portrait ~90–110KB；對話 sprite sheet ~0.9–1.1MB
- 全量 assets 估計 **數十 MB**（含大量 limited/rift outfit）
- **英文 P0 剪枝後**可只拉：故事 bg 7 張 + 故事 enemy 6–7 + 故事 outfit portrait/motion + UI icons + 對話角色 sheet

---

## 2. Clone 策略（點用 skill）

### 2.1 用邊個 skill 模式

| 模式 | 適用？ |
|---|---|
| clone-website 全 Phase 1–5 Next pixel | ❌ 過重、stack 錯位 |
| architecture-only 淨 wireframe | ❌ 你要可玩 fork |
| **single-file/educational SPA fork-adapt** | ✅ **主路徑** |
| education-game-dev（SEN 改造） | ⏳ 第二階段（若要培智化） |

**Foreman 做法：**

1. 研究包（本 PLAN + 下列 docs）  
2. 鏡像下載 **英文必要模組 + CSS + 剪枝 assets**  
3. 改 storage / 鎖 route / 剪 main 死碼  
4. 本地 `npx serve` 或 GitHub Pages 靜態驗證  
5. （可選）再套 SEN 規則：身份卡、大圓標、禁右鍵等

### 2.2 法律 / 品牌邊界

- 原作「武俠打字傳」有完整美術/文案/設計  
- **個人學習 / 課堂改寫 OK**；**唔好**用原品牌名公開偽站  
- 建議 fork 後：
  - 改標題（例：`英文鍵心旅程` / 校名版）
  - footer 註「教學改寫，非官方」
  - 若公開 Pages：換校徽 + Ken footer 規
- 資產：教學用途本機/校內；公開前再決定是否重畫/生成替代

---

## 3. 目標產品定義（英文-only 訪客版）

### 3.1 Must（P0）

1. 開站即英文，**無路線切換、無 Google 掣**
2. 訪客 localStorage 自動存進度（改 `SAVE_KEY` 避免撞原站）
3. 完整 7 章 29 關英文課程 + 對話 + 戰鬥判定
4. 星數、關卡解鎖順序、`canStartNode`
5. 基本設定：靜音 / 減動畫 / 高對比（已有）
6. Export / Import JSON 存檔（離線備份）
7. 實體鍵盤提示（C01 keyboard hint + fingerFor）
8. 可 `node --check` 主要 mjs + 瀏覽器 smoke：山門→第一關→按 F 命中

### 3.2 Should（P1）

- 劇情服裝牆（只 story outfits）
- 挑戰模式（若你要「三分鐘英文」）
- 設定頁清理文案（刪登入相關字）

### 3.3 Won’t（除非你後加）

- 注音 / Google / Firestore / PvP / Rift / 限時抽卡經濟
- 官方 brand 原樣上線

### 3.4 之後可選 SEN fork（另開 plan）

中度班：關卡再縮（先 F/J/home row）、身份卡、大鍵位 UI、粵語 TTS 提示、禁複雜 dock。  
**今次計劃唔包 SEN 改造**，只交可玩英文 fork 底座。

---

## 4. 技術方案

### 4.1 目錄（建議）

```
~/works/wuxia-typing-en-clone/
  index.html
  docs/
    PLAN.md                 ← 本檔
    research/
      TECH_STACK.md
      MODULE_MAP.md
      CURRICULUM_EN.md
      CUT_LIST.md
  src/
    main.mjs                ← 剪枝後
    core.mjs                ← 去 bpmf 分支
    content.mjs
    keyboard.mjs            ← 只留 physicalKey + en helpers
    storage.mjs             ← LocalOnlyStore
    media.mjs / combat.mjs / enemy-director.mjs …
    (刪 pvp/, 可刪 rift-ui)
  game-data/
    curriculum.mjs
    media.json              ← 剪枝
    challenge-*.mjs         ← 若 P1
    (刪 bopomofo.mjs)
  styles/                   ← 必要 CSS only
  assets/v3/…               ← 剪枝下載
  fonts/
  .nojekyll
  README.md
```

### 4.2 剪枝主手術

1. **`storage.mjs`**  
   - 刪 `cloudServices` / `login` / `logout` / Firestore flush  
   - 保留：`blankSave` 讀寫、`update`、`export`、`importFile`  
   - `status` 恆 `local`

2. **`main.mjs`**  
   - `initialRoute()` 寫死 `'en'`  
   - 刪 `switchRoute`、route-switch DOM、login/resume-guest 雲端分支  
   - Dock 刪「試煉」等（按 scope）  
   - Account 畫面：只顯示訪客 + 匯出/匯入 + 改名

3. **`core.mjs` / `keyboard.mjs`**  
   - 刪 BPMF 依賴路徑（`physicalCode` 仍可留 map 空操作或刪）  
   - `makeSession` 唔再讀 `node.route==='zh-bpmf'`

4. **`index.html`**  
   - 標題/ description 改英文練習  
   - 可唔 load `sign-in.css` / `pvp.css` / `rift.css`（若已砍）

5. **SAVE_KEY**  
   - 例：`wuxia_en_guest_v1`（避免讀到玩家原站進度）

### 4.3 部署

- 本機：`npx --yes serve .` 或 Python http.server（要 MIME 對 `.mjs`）  
- 上線：GitHub Pages 靜態（Ken 講 **Push** 先 push）  
- **唔使** Workers / Firebase

---

## 5. 執行階段（等「順序」）

### Phase A — 研究固化（已完成大部）

- [x] 入口/stack/雙路線/引擎/課程/登入  
- [ ] 補寫 `MODULE_MAP.md` + `CUT_LIST.md`（開工時 30 分鐘內完成）  
- [ ] 截圖入 `docs/design-references/`（可選）

### Phase B — 鏡像下載

1. 列必要 URL 清單（mjs/css/json/font + P0 assets）  
2. `curl -L` batch 落 app-root（之前 terminal curl 被政策擋過 → 改 browser fetch 寫檔或你本機核准網路）  
3. 核對 `media.json` 路徑 404=0（P0 set）

### Phase C — 訪客英文剪枝

1. LocalOnlyStore  
2. 鎖 en、砍 UI  
3. 砍 bpmf/pvp/rift import（main 能 boot）  
4. 文案/標題

### Phase D — 驗證閘

| 閘 | 標準 |
|---|---|
| Syntax | 主要 `.mjs` `node --check` |
| Boot | 開 index 無 console error |
| Flow | 山門 → 繼續冒險 → 對話 → Battle |
| Input | 按正確 `KeyF` 進度+1；錯鍵唔跳 |
| Save | refresh 後進度仍在 |
| No-auth | 全站無 Google 掣、無 firebase 請求 |
| EN-only | 無注音/路線切換 |

### Phase E —（可選）P1 挑戰 + 服裝牆

### Phase F —（可選）SEN 培智化另案

---

## 6. 風險同對策

| 風險 | 等級 | 對策 |
|---|---|---|
| main.mjs 83KB 高度耦合，亂刪 import 爆 | 高 | 先 LocalOnly + 鎖 en，再逐個砍 feature flag |
| assets 太大 | 中 | P0 只拉故事用；缺圖顯示「載入中」已有 fallback |
| 原站 Cloudflare/bot 擋批量 curl | 中 | browser `fetch` + write_file；或你手動批准 terminal 網路 |
| 美術版權公開 | 中 | 校內先；公開要 rebrand / 替代圖 |
| Sprite/combat 複雜 | 中 | 原樣搬 `media.mjs`+`combat.mjs`+`enemy-director.mjs`，唔重寫 |
| 無實體鍵盤（iPad） | 低 | 原站已提示「請用實體鍵盤」；SEN 若要螢幕鍵盤另做 |

---

## 7. 工時粗估

| 範圍 | 估 |
|---|---|
| P0 英文訪客可玩（故事 29 關） | 0.5–1.5 日（agent 連續） |
| +P1 挑戰/服裝 | +0.5 日 |
| +SEN 改造 | 另開 2–4 日 |

---

## 8. 你要拍板嘅 3 件事

1. **Scope 包：**  
   - A) 只劇情 29 關（最瘦 P0）  
   - B) 劇情 + 服裝  
   - C) 劇情 + 服裝 + 挑戰  

2. **Brand：**  
   - 保留「武俠打字傳」教學私用名  
   - 定改名（建議公開必改）

3. **開做指令：** 覆「**順序**」= 批本 plan + 自主做到 P0 可玩驗證（唔 push，除非你再講 Push）

---

## 9. 推薦決定（Unicorn 判斷）

- **Scope：B（劇情+服裝）** — 服裝係獎勵回饋，砍咗旅程變乾  
- **Brand：私用暫留原名；若 Pages 公開再改**  
- **Stack：靜態 SPA fork，唔上 Next**  
- **Auth：零雲端，LocalOnly + JSON 匯出**  
- **Skill：clone-website 當 recon/foreman；實作走 SPA fork-adapt，唔走 pixel Next**

---

## 10. 附：模組依賴（英文 P0 最小集）

**必下載 JS**

- `src/main.mjs`（剪）
- `src/core.mjs` `content.mjs` `keyboard.mjs` `storage.mjs`（重寫）
- `src/media.mjs` `combat.mjs` `enemy-director.mjs` `actor-point.mjs`
- `src/approaches.mjs` `challenge-intro.mjs`（若要引導可留）
- `src/costumes.mjs` `icons.mjs` `ui-polish.mjs` `xianxia-fx.mjs` `rewards.mjs`
- `src/collection.mjs`（core import blankCollection — 可 stub 精簡）
- `game-data/curriculum.mjs` `media.json`
- `game-data/ordinary-heroines.mjs` `signature-arts.mjs` `limited-costumes.mjs` `rift.mjs`（core 有 import — stub 空資料）
- `game-data/spirit-treasures.mjs`（可 stub）

**可整枝刪（P0）**

- `src/pvp/**` `rift-ui.mjs` `game-data/bopomofo.mjs` `game-data/pk-lan.mjs`
- 多數 challenges/trials 若選 Scope A

**CSS P0**

- `app.css` `missions.css` `game-ui.css` `desktop.css` `battle-layout.css`  
- `icons.css` `xianxia.css` `polish.css` `menu-v321.css` `rewards.css` `routes.css`  
- 可暫留、後刪：`sign-in` `pvp` `rift` `trials` `challenges` `collection` `treasures`

---

**[DONE research]** 計劃書路徑：`~/works/wuxia-typing-en-clone/docs/PLAN.md`
