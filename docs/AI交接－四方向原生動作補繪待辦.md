# AI 交接－四方向原生動作補繪待辦

更新日期：2026-07-29
專案：JOSE｜幻獸戰棋
目前目標：把所有仍為「延伸上下方向」的戰鬥單位，逐隻改為真正原生的前／後／左／右動作來源，並直接導入遊戲戰鬥。

## 2026-07-29｜第 1～20 章敵軍原生四方向全數完成

- 第 1～20 章的 110 隻敵軍現在全部使用 `authored-four-direction`；不再有任何章節敵軍使用 `derived-from-approved-motion`。
- 本批補齊：`cinder_bat`、`blight_boar`、`thorn_creeper`、`frost_shell`、`skeleton_soldier`、`skeleton_mage`、`skeleton_knight`、`skeleton_sergeant`、`skeleton_king`、`bone_dragon`、`lich`、`lich_king`。
- 每隻均已完成原生 4×3 來源（下／右／上／左 × 待命／移動／攻擊）、透明去背、正式 runtime WebP 圖集、敵軍預覽與 manifest 登錄；不以鏡像或延伸上下圖取代。
- 全量 runtime 以非清空模式重建完成：225 單位、43,200 格 WebP 動作框；`npm.cmd test` 98/98 與 `python scripts/check-directional-frame-bounds.py` 均通過。

## 2026-07-29｜第 19～20 章正式接入完成

- 第 19 章「中央能源心臟」與第 20 章「Ω 終焉程序」已完成正式關卡、敵軍、地圖與 Boss 三階段接入；第 18 章同步補齊章節資料銜接。
- 第 19～20 章各有 5 隻正式敵軍：1 隻 5×5 Boss、2 隻 2×2 親衛／精英、2 隻 1×1 小兵；每章為 6 主線＋Boss＋3 HARD，共 10 關。第 19 章沿用既有 `overload_nuclear_golem` 正式來源，不重製資產。
- 新增並完成原生四方向來源、透明版、敵方立繪、runtime WebP 圖集與 manifest 登錄：`omega_trooper`、`central_core_unit`、`omega_guard`、`terminal_adjudicator`；`omega_guard` 已以 V2 修正左右欄序。
- 第 19、20 章 Boss 均具 70%／35% 三階段：核能傀儡依序進入熱能增幅、過載灼燒／裂隙壓力；Ω-00 依序啟動資料凍結、終端協議／裂隙壓力。階段會更新技能優先度、召喚、護盾、警示與敵軍壓力，非純數值加成。
- 長卷主地圖與 Boss／HARD 切片、255 張地形格、5×5 安全出生區已完成；5×5 Boss 與 2×2 親衛的出生、移動、範圍與邊界均由回歸測試覆蓋。
- 現行總量：20 章、255 個正式關卡、110 隻敵軍、225 個四方向動作單位。驗證：`npm.cmd test` 98/98、`python scripts/check-directional-frame-bounds.py` 225 單位／43,200 格、100 場自動戰鬥模擬全數結束且無卡關。

## 2026-07-29｜第 18～20 章本批原生四方向動作全面巡檢

- 本批 11 隻已逐張檢查下／右／上／左 × 待命／移動／攻擊：`argus_omniscient_eye`、`surveillance_orb`、`optical_sniper`、`argus_guardian`、`predictive_executor`、`overload_nuclear_golem`、`nuclear_technician`、`reactor_guard`、`nuclear_heavy`、`overload_berserker`、`omega_00`。
- 原圖合格、無須改圖：`optical_sniper`、`predictive_executor`、`overload_nuclear_golem`、`nuclear_heavy`、`omega_00`。
- 已修正方向／版型：`argus_omniscient_eye` 重排為標準四方向欄序；`surveillance_orb`、`argus_guardian` 修正左右映射；`reactor_guard`、`nuclear_technician` 將錯誤 4×4 來源轉為標準 4×3；`overload_berserker` 以 V2 取代動作與方向混列的舊表。
- `nuclear_technician` 已升為 V3：左向攻擊改為朝畫面左側發射，並清除轉置後的跨格殘片。
- 11 隻 manifest 均指向目前最高核准版本；runtime 均為 8 欄 × 24 列、112px 動作格，透明來源與正式 WebP 圖集皆存在。
- 驗證：`python scripts/check-directional-frame-bounds.py` 通過 221 單位、42,432 個 runtime WebP 動作格；`git diff --check` 無格式錯誤（僅既有 CRLF 提示）。

## 2026-07-28｜第 16 章「重力磁場」完成進度

- 原生 4×3（下／右／上／左 × 待命／移動／攻擊）來源、去背、敵方立繪與 runtime 四方向八幀圖集已完成：`magnetic_gravity_core`、`magnetic_infantry`、`gravity_probe`、`gravity_warden`、`magnetic_storm_knight`。
- 已接入第 16 章 6 個主線小關、5×5 Boss 關與 3 個 HARD；Boss 為磁極重力核心，親衛為重力守衛／磁暴騎士，小兵為磁力步兵／浮游探測機。
- 章節長卷切片、Boss／HARD 地圖與逐格地形已更新；目前總計 16 章、215 關、90 隻敵軍、205 個四方向單位圖集。
- 驗證：`python scripts/check-directional-frame-bounds.py` 通過 39,360 格；`npm.cmd test` 97/97 通過。
- 下一批：第 17 章「奈米工廠」五隻（奈米蜂群女王、奈米工蜂、修復蟲群、蜂群戰將、奈米禁衛），接著以同規格完成第 18～20 章。

## 已完成

下列單位已完成「原生四方向參考圖 → 透明去背 → 遊戲動作圖集」完整流程，已可在戰鬥中依移動與攻擊方向播放：

1. `forest_deer`｜森靈鹿
   - 來源：`assets/animations/directional/sources/forest_deer-four-direction-reference-v2-alpha.png`
2. `rotcap_rootling`｜腐帽根靈
   - 來源：`assets/animations/directional/sources/rotcap_rootling-four-direction-reference-v1-alpha.png`
3. `dryad_thorn`｜荊棘乾靈
   - 來源：`assets/animations/directional/sources/dryad_thorn-four-direction-reference-v1-alpha.png`
4. `ent_sapling`｜樹靈幼苗
   - 來源：`assets/animations/directional/sources/ent_sapling-four-direction-reference-v1-alpha.png`
5. `venom_mantis`｜毒刃螳螂
   - 來源：`assets/animations/directional/sources/venom_mantis-four-direction-reference-v1-alpha.png`
6. `blightwood_sovereign`｜腐菌樹王（Boss）
   - 來源：`assets/animations/directional/sources/blightwood_sovereign-four-direction-reference-v1-alpha.png`
7. `gold_qilin`｜耀金麒麟（我方 2×2 幻獸）
   - 來源：`assets/animations/directional/sources/gold_qilin-four-direction-reference-v1-alpha.png`
8. `solar_phoenix`｜聖陽鳳凰（我方 2×2 幻獸）
   - 來源：`assets/animations/directional/sources/solar_phoenix-four-direction-reference-v1-alpha.png`
9. `eclipse_dragon`｜蝕月黑龍（我方 2×2 幻獸）
   - 來源：`assets/animations/directional/sources/eclipse_dragon-four-direction-reference-v1-alpha.png`
10. `flame_emperor`｜炎帝獸（我方 2×2 幻獸）
    - 來源：`assets/animations/directional/sources/flame_emperor-four-direction-reference-v1-alpha.png`
11. `crimson_dragon`｜赤炎神龍（我方 2×2 幻獸）
    - 來源：`assets/animations/directional/sources/crimson_dragon-four-direction-reference-v1-alpha.png`

最近一次完整重建及驗證已通過：

- 310 張單位／進化動作圖集已重建。
- `python scripts/check-directional-frame-bounds.py`：180 單位、34,560 個 runtime WebP 動作格通過。
- `npm.cmd run lint`：通過。
- 五隻旗艦幻獸均已驗證為 `authored-four-direction`，會優先使用新原生方向稿而不再回退到舊的 2×2 前後合成版本。

## 剩餘工作量

目前來源統計：

| 類型 | 數量 | 說明 |
| --- | ---: | --- |
| `authored-four-direction` | **144** | 已有真正前後左右原生參考圖，包含第 1～20 章全數 110 隻敵軍與全數 29 隻 2×2 幻獸。 |
| `authored-front-back-and-approved-side` | 0 | 此舊式前後來源已全數由原生四方向來源取代。 |
| `derived-from-approved-motion` | **81** | 僅剩非主線敵軍或其他舊單位的後續補繪目標；第 1～20 章敵軍不在其中。 |

不要手動維護 140 隻清單。每次開工請以 manifest 即時列出：

```powershell
$m = Get-Content -Raw -Encoding utf8 assets\animations\directional\manifest.json | ConvertFrom-Json
$m.psobject.Properties | Where-Object { $_.Value.sourceType -eq 'derived-from-approved-motion' } |
  ForEach-Object Name | Sort-Object
```

### 2×2 幻獸批次（2026-07-23 完成，待最終驗證與上架）

本輪 24 隻 2×2 幻獸都已完成「原稿、透明去背、原生四方向 4×3 動作來源」；重建後必須全部在 manifest 顯示為 `authored-four-direction`：

- 火：`blazing_dragon`、`flame_god_lion`、`volcanic_titan`、`kiln_rhinoceros`。
- 森：`emerald_dragon`、`emerald_god_dragon`、`jade_qilin`、`forest_god`、`ancient_treant`、`fern_ceratops`、`mushroom_bison`、`amber_antler_moose`。
- 海：`sea_god_beast`、`sea_emperor`、`tsunami_dragon`、`abyss_god_dragon`、`frost_leviathan`、`aurora_narwhal`、`brine_crocodile`。
- 光：`crown_unicorn`、`cathedral_elephant`。
- 暗：`void_leviathan`、`abyss_mammoth`、`obsidian_gorilla`。

同輪修正：`solar_phoenix` 的右向移動／攻擊來源格左上殘圖會在裁切進 runtime 圖集前透明清除；需以重建後的圖集人工確認。

## 建議補繪順序

原則：先讓玩家最早看見、且主線第 1～11 章實際上場的單位完成；其次是大型 Boss；最後才是無限塔／Boss 來襲專用名冊。

### 我方旗艦幻獸（已完成）

`gold_qilin`｜耀金麒麟、`solar_phoenix`｜聖陽鳳凰、`eclipse_dragon`｜蝕月黑龍、`flame_emperor`｜炎帝獸、`crimson_dragon`｜赤炎神龍皆已完成真正原生前／右／後／左動作來源。

### 第一章完成狀態

`blightwood_sovereign`｜腐菌樹王（Boss）已完成真正原生前後左右動作圖；第一章第 1～10 關、Boss 與四個 HARD 關卡實際出場的 `forest_deer`、`rotcap_rootling`、`dryad_thorn`、`ent_sapling`、`venom_mantis` 皆無須再產圖。

### 第二章完成狀態（2026-07-27，待獨立上架）

`thorn_hive_queen`｜荊棘蜂后（Boss）與第二章實際出場的 `thorn_pollen_drone`｜荊棘花粉蜂、`mist_banshee`｜迷霧報喪女妖、`fog_wisp`｜霧中鬼火、`gloom_turtle`｜幽暗龜，均已完成真正原生前／右／後／左動作來源、透明去背與戰鬥圖集重建。

本批驗證：`python scripts/check-directional-frame-bounds.py` 34,560 格通過；`npm.cmd test` 92/92 通過。尚未獨立提交／上架，避免與工作區其他未完成的第 11 章與介面變更混合。

方向校正：`fog_wisp`｜霧中鬼火與 `gloom_turtle`｜幽暗龜已依實測交換側面來源欄位，確保右移／右攻時面向右方；第 2、3 章其餘八隻維持原有映射。

### 第三章完成狀態（2026-07-27，待獨立上架）

`ash_crown_tyrant`｜燼冠暴君（Boss）與第三章實際出場的 `crown_cinderling`｜燼冠餘燼靈、`salamander_fiend`｜火蜥精、`surtr_spawn`｜焰巨人眷屬、`ember_imp`｜餘燼小鬼，均已完成真正原生前／右／後／左動作來源、透明去背與戰鬥圖集重建。

本批驗證：`python scripts/check-directional-frame-bounds.py` 34,560 格通過；`npm.cmd test` 92/92 通過。尚未獨立提交／上架，避免與工作區其他未完成的第 11 章與介面變更混合。

### 第四章完成狀態（2026-07-27，待獨立上架）

`cathedral_titan`｜聖堂泰坦（Boss）與第四章實際出場的 `rosewindow_sentinel`｜彩窗哨兵、`gargoyle_watcher`｜石像鬼守望者、`golem_sentinel`｜魔像哨衛、`ash_hound`｜灰燼獵犬，均已完成真正原生前／右／後／左動作來源、透明去背與戰鬥圖集重建。

本批驗證：`python scripts/check-directional-frame-bounds.py` 34,560 格通過；`npm.cmd test` 93/93 通過。

### 第五章完成狀態（2026-07-27，本地完成、待獨立上架）

`glacier_leviathan`｜冰河利維坦（Boss）與第五章實際出場的 `glacier_shellcrab`｜冰川甲殼蟹、`jotunn_frost`｜霜巨人、`selkie_hunter`｜海豹獵人、`murk_fish`｜幽濁魚，均已完成原生前／右／後／左動作來源、透明去背與戰鬥圖集重建。後續以 `v2` 來源為準：第 1 列待機、第 2 列明顯移動、第 3 列明顯攻擊，取代原先攻擊辨識不足的 `v1`。

本批以固定欄位「前、右、後、左」建立來源圖，特別以角色本體面向判定側面：右欄為面向畫面右方、左欄為面向畫面左方，並非程式鏡像。驗證完成：`python scripts/check-directional-frame-bounds.py` 34,560 格通過；`npm.cmd test` 93/93 通過。

### 第六～十章完成狀態（2026-07-27，本地完成、待獨立上架）

第六～十章新增的 23 隻出場魔獸與 Boss 已完成原生四方向來源、透明去背與動作圖集重建；重複出場的 `void_eel` 與 `mara_fiend` 共用同一套角色來源。每張來源固定第 1 列待機、第 2 列明顯移動、第 3 列明顯攻擊，並固定欄位前／右／後／左，右欄面向畫面右方、左欄面向畫面左方。

本批驗證：`python scripts/check-directional-frame-bounds.py` 34,560 格通過；`npm.cmd test` 93/93 通過。

後續章節請依 `js/data/tactical-content.js` 中各章 `minions`、`boss` 取順序，不要只依檔名字母排序。

## 每隻單位的標準流程（不可省略）

### 1. 讀取身份參考圖

- 幻獸優先：`assets/pets/<unit_id>/evolution/stage_1.png`
- 魔獸優先：`assets/enemies/<unit_id>.png`
- 先用 `view_image` 檢視，確認角色的元素、武器／肢體、輪廓與畫風。

### 2. 用 image generation 製作「4×3 原生四方向參考圖」

只能用同一角色，嚴格要求：

- 欄（左至右）：`down/front`、`right`、`up/back`、`left`。
- 列（上至下）：`idle`、`move`、`attack`。
- 背景必須是**純色 `#ff00ff`**，無格線、文字、陰影、地板或邊框。
- 攻擊特效只能用該單位的元素，不能使用洋紅色。
- 每格角色完整入鏡，頭、角、翼、尾、武器與特效不可碰格邊。
- 用現有立繪當身份 reference；產圖後務必用 `view_image` 人工檢查前／後視角與左右是否清楚。

### 3. 導入原圖與透明版

不得覆寫舊版。使用新版本號：

```text
assets/animations/directional/sources/<unit_id>-four-direction-reference-vN.png
assets/animations/directional/sources/<unit_id>-four-direction-reference-vN-alpha.png
```

使用內建去背工具移除洋紅背景：

```powershell
python C:\Users\User\.codex\skills\.system\imagegen\scripts\remove_chroma_key.py `
  --input assets\animations\directional\sources\<unit_id>-four-direction-reference-vN.png `
  --out assets\animations\directional\sources\<unit_id>-four-direction-reference-vN-alpha.png `
  --auto-key border --soft-matte --transparent-threshold 12 --opaque-threshold 220 --despill
```

完成後再次用 `view_image` 檢查透明邊緣沒有洋紅殘色。

### 4. 以批次方式重建遊戲動作圖

累積約 3～8 隻後再跑一次，避免不必要重建。不可同時啟動兩個重建程序：

```powershell
python scripts\build-four-direction-motion.py
```

注意：此程序會清除後重建 `assets/animations/directional/*-motion-4dir-sheet.webp` 與 manifest，約需數分鐘。若終端命令逾時，先用 `Get-CimInstance Win32_Process` 確認 Python 程序是否仍在跑；**不要重複啟動**。

重建程式已改為同一單位自動採用最高數字版本的 `vN-alpha.png`，不會誤用舊版。

### 5. 必跑驗證

```powershell
python scripts\check-directional-frame-bounds.py
npm.cmd run lint
npm.cmd test
```

需確認：

- manifest 中該單位 `sourceType` 變成 `authored-four-direction`。
- `source` 指向新產出的 `vN-alpha.png`。
- 動作邊界檢查為 34,560 格通過。
- 若這批涉及戰鬥流程或 CSS，再跑 `npm.cmd run test:browser`。

## 相關檔案與注意事項

- 動作重建：`scripts/build-four-direction-motion.py`
- 邊界檢查：`scripts/check-directional-frame-bounds.py`
- 動作清單：`assets/animations/directional/manifest.json`、`manifest.js`
- 規格：`docs/幻獸與魔獸四方向六幀動作圖規格.md`
- 戰鬥 runtime：`js/tactics.js`

本工作區原本就有其他未提交的 UI、劇情與戰鬥改動。接手者只能處理本待辦相關檔案，不可用 `git reset --hard`、`git checkout --` 或大範圍還原。

本輪 24 隻 2×2 幻獸與鳳凰右向裁切修正已於 2026-07-23 完成重建：`python scripts/check-directional-frame-bounds.py` 34560 格通過、`npm.cmd run lint` 通過、`npm.cmd test` 92/92 通過；發布時需同步更新 `tactics.html` 與 `js/tactics.js` 的快取版本。
