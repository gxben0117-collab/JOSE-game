# JOSE 現行架構與執行流程

更新日期：2026-07-18（V0.18／pkg 0.18.0）

## 正式產品邊界

`index.html` 只負責導向 `tactics.html`。戰棋是唯一正式玩法；舊 2D 冒險、幻獸展示、3D 遠征等歷史檔案全部封存於 `不需要的檔案/`（含說明 README），不會進入正式使用者流程、測試與建置。

## 分層

1. 內容資料（純資料、不碰 DOM）
   - `js/data/pets.js`：原始幻獸資料（45 隻）。
   - `js/data/tactical-pets.js`：轉為戰棋數值、主動技能、被動與三階資產；依定位與元素指派控場效果（控制型→冰凍／中毒／灼燒＋終極技拉扯；近戰攻擊／防禦型終極技→擊退）。
   - `js/data/tactical-enemies.js`：敵方專屬資料層——12 種單階小兵 + 4 隻章節首領，介面與幻獸相同（`minion`／`boss` 旗標、單元素立繪）。
   - `js/data/tactical-content.js`：地圖、16 關（含 `power` 難度倍率）、決定性障礙物配置 `obstaclesFor()`、掉落、任務與六定位技能樹。
2. 核心服務
   - `TacticalProgression`：唯一負責存檔與資源交易；新增 `controls`／`bossKills` 任務統計。
   - `TacticalAudio`：延遲建立 AudioContext；新增 crit／freeze／poison／push／boss 音效。
3. 戰鬥控制器 `js/tactics.js`
   - 單位建立：我方讀進化階段；敵方讀關卡 `power` 倍率（首領再 ×1.1 血量）。
   - 空間系統：21×10 橫向戰場（`COLS = 21`、`ROWS = 10`），整張棋盤固定完整顯示；BFS 路徑（障礙物阻擋）、`reachableTiles()`、`lineClear()` 視線採樣——遠程／範圍技能需要通視。主部署區為下方 25 格，3×3 幻獸另有大型部署列，敵軍由右側多個錨點組成隊形。
   - 鏡頭系統：無放大控制；玩家點選棋盤上任一敵我單位時，`focusUnit()` 依 1×1／2×2／3×3 佔格中心定位並短暫標示焦點。`walkUnit()`、`act()` 與 `enemyTurn()` 不呼叫鏡頭跟隨，避免動畫期間視角晃動。
   - 狀態系統：freeze（跳過行動）、poison（回合 6% 最大生命）、burn、shield、atkBuff；`displace()` 處理擊退／拉扯，撞牆／障礙／單位轉為碰撞傷害；首領免疫凍結與位移。
   - 流程：`deploy`（自由部署）→ `player` ↔ `enemy` → 結算；首領關開戰有登場演出與常駐血條。
   - 畫面：`setView()` 切換三個獨立頁面（`screen-home` 準備／`screen-battle` 戰鬥／`screen-result` 結算），戰鬥頁只掛戰鬥控制鍵。
   - 編隊：`DEPLOY_CAPACITY = 25`；1×1 成本 1、2×2 成本 4、3×3 成本 3。存檔、編隊 UI 與戰場配置共用同一成本規則；搜尋／元素／定位／體型篩選與推薦隊伍協助滿編。
   - 部署與難度：自由部署支援均衡陣、突擊陣與還原；`balancedEnemyRoster()` 依出陣成本切換標準／警戒／增援／滿編迎擊，增加敵軍數量（上限 30）並於高容量提供小幅能力倍率。`enemyFormation()` 依 seed 分小隊散布，`squadActive()` 警戒圈（7 格）控制出擊；首領關斬首即勝。
   - 主城系統：擁有制（初始 8 隻）、召喚（水晶／六階機率）、圖鑑收集加成（併入 `bonusesFor`）、每日任務（日期重置），皆在 `TacticalProgression`。
   - AI `planFor()`：可達位置 × 可用技能 × 目標的聯合評分（期望傷害、擊殺、集火、範圍命中數、控場價值、地形與脆皮距離控管），敵我自動戰鬥共用。
   - 操作：手動選擇技能後第一次點擊合法目標即呼叫 `act()`，沒有二次確認；敵我資料第一技能皆為無冷卻傷害普攻，供冷卻期與反擊保底。
   - 演出：`addProjectile()` 依火／森／海／光／暗產生不同飛行彈體，飛行完成才結算傷害；另含爆擊（12%+速度優勢6%，1.5×）、狀態浮字、擊殺淡出、分級震動。
   - 測試鉤子：`window.__TACTICS_DEBUG__` 與 `?autotest=1&stage=&party=&boost=1` 煙霧測試。
4. 呈現
   - `tactics.html`：語意化容器、Boss 血條（`#boss-bar`）與登場覆層（`#boss-intro`）。
   - `tactics.css`／`tactics-fix.css` 基礎棋盤；`tactics-campaign.css` 戰役與 mobile；`tactics-battle.css` 障礙物、部署區、狀態、Boss、爆擊樣式；`tactics-screens.css` 三畫面版面與固定 `--cell` 棋盤尺寸（修正格子大小不一）。
5. 驗證與輸出
   - `scripts/lint.mjs`：JS 語法 + `index.html`／`tactics.html` 資產引用。
   - `scripts/test.mjs`：57 項回歸（資料、敵人、關卡、障礙物、進度、直接施放、元素投射、鏡頭、三畫面、引擎特徵、10 場模擬）。
   - `scripts/simulate-tactics.mjs`：初始隊與神獸隊分段模擬，驗證難度曲線。
   - `scripts/build.mjs`：產出 `dist/`，過濾美術原始檔（約 78MB）。
   - `scripts/generate-enemy-art.py`：由幻獸立繪重生成敵人魔化圖（可重跑）。

## 啟動資料流

1. 依序載入 pets → tactical-pets → tactical-enemies → tactical-content → 進度 → 音效 → 控制器。
2. `TacticalProgression` 讀取 `jose-tactics-progression-v2`；v1 存檔自動遷移。
3. `reset()` 建立像素分類地形、障礙物與雙方單位，進入 `deploy` 階段；玩家可在 25 格主部署區或 3×3 大型部署列調整站位後開戰。
4. 玩家操作或 AI 依 `planFor()` 行動；遠程需通視，位移與狀態即時演出。
5. 敵方回合結束處理灼燒、中毒、熔岩、護盾衰減、冷卻、冰凍解凍與裂隙增幅。
6. 勝敗時 `completeBattle` 原子化寫入星級、解鎖、掉落、控場／首領統計，再顯示結算。

## 難度模型

- 每關 `power` 直接乘上敵方全數值：ember 1.0→1.45、verdant 1.65→2.2、tide 2.6→3.2、rift 3.6→5.6。
- 隊伍容量超過 8 後逐步增加敵軍數量；超過 12 後每個出陣單位使敵方能力再提高 0.8%，25 單位為滿編迎擊。
- 章節內遞增、章節起點逐章提高（有回歸測試保護）。
- 實測基準以成本不超過 25 的編隊為準；`scripts/simulate-tactics.mjs` 固定執行 10 場並受 45 回合硬上限保護。

## 依賴

- Production runtime：無第三方套件、無 API、無登入。
- 開發：Node.js 18+；本機預覽用 Python 內建 HTTP server（`npm start`）。
- 美術管線：Python 3 + Pillow（僅開發期，生成敵人圖）。

## 已知產品限制

- 純本機 `localStorage`，沒有跨裝置同步、帳號或多人連線。
- 小螢幕會保留放大後的格子可辨識性，棋盤本身可水平與垂直拖曳。
- 音效由瀏覽器合成；瀏覽器禁止自動播放時等首次觸控。
