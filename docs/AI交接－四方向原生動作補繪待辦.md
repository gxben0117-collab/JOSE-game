# AI 交接－四方向原生動作補繪待辦

更新日期：2026-07-22
專案：JOSE｜幻獸戰棋
目前目標：把所有仍為「延伸上下方向」的戰鬥單位，逐隻改為真正原生的前／後／左／右動作來源，並直接導入遊戲戰鬥。

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
| `authored-four-direction` | 20 | 已有真正前後左右原生參考圖。 |
| `authored-front-back-and-approved-side` | 25 | 已有可用前後參考與核准側面，不是本輪優先。 |
| `derived-from-approved-motion` | **135** | 本輪待補繪目標。 |

不要手動維護 140 隻清單。每次開工請以 manifest 即時列出：

```powershell
$m = Get-Content -Raw -Encoding utf8 assets\animations\directional\manifest.json | ConvertFrom-Json
$m.psobject.Properties | Where-Object { $_.Value.sourceType -eq 'derived-from-approved-motion' } |
  ForEach-Object Name | Sort-Object
```

## 建議補繪順序

原則：先讓玩家最早看見、且主線第 1～11 章實際上場的單位完成；其次是大型 Boss；最後才是無限塔／Boss 來襲專用名冊。

### 我方旗艦幻獸（已完成）

`gold_qilin`｜耀金麒麟、`solar_phoenix`｜聖陽鳳凰、`eclipse_dragon`｜蝕月黑龍、`flame_emperor`｜炎帝獸、`crimson_dragon`｜赤炎神龍皆已完成真正原生前／右／後／左動作來源。

### 第一章完成狀態

`blightwood_sovereign`｜腐菌樹王（Boss）已完成真正原生前後左右動作圖；第一章第 1～10 關、Boss 與四個 HARD 關卡實際出場的 `forest_deer`、`rotcap_rootling`、`dryad_thorn`、`ent_sapling`、`venom_mantis` 皆無須再產圖。

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

本輪沒有授權部署、提交或推送；完成一個可驗證批次後，先回報素材清單與測試結果。
