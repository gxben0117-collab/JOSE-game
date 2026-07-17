# CLAUBE 匯入清單

## 建議資料欄位

### 幻獸

```text
id, nameZh, element, role, portraitPath, rarity, passive, skill1, skill2, ultimate
```

`portraitPath` 對應 `01_幻獸/<檔名>.png`。編號 001~010 火、011~020 森、021~030 海、031~040 光、041~050 暗。

### 地形

```text
id, theme, category, texturePath, walkable, moveCost, onEnterEffect, blocksSight
```

每個主題的 `01~04` 是基礎地板、`05~08` 是功能格、`09~12` 是障礙、`13~16` 是特殊格。實際效果見地形索引。

### 道具

```text
id, nameZh, category, iconPath, rarity, stackable, effectType, effectValue
```

資源養成圖示使用 `resource_01~16`，裝備消耗使用 `equipment_01~16`。

### 技能

```text
id, nameZh, element, iconPath, targetType, range, energyCost, cooldown, damageScale, statusEffect
```

技能 ID 建議直接採 `fire_skill_01` 等英文檔名，中文名稱由 `04_技能/技能圖示索引.md` 取得。

### Boss 與專屬小兵

Boss 與小兵資料結構、固定配對、階段事件與測試規則，請讀 `06_魔獸Boss與專屬小兵/CLAUBE_Boss匯入規格.md`。Boss `B01~B10` 與小兵 `M01~M10` 依相同編號一對一關聯。

## 接入待辦

- [ ] 將素材資料夾複製到專案正式的公開資源路徑。
- [ ] 建立幻獸、地形、道具、技能資料表。
- [ ] 依現有五屬性 enum 對應 `fire / forest / ocean / light / dark`。
- [ ] 在圖鑑與召喚池加入 50 隻幻獸，先以設計文件建議稀有度配置。
- [ ] 地圖生成器加入四主題的 16 格規則，障礙格設定不可通行或視線阻擋。
- [ ] 道具與技能 icon 統一縮圖尺寸並啟用瀏覽器圖像快取。
- [ ] 用實際 UI 檢查透明邊緣、縮小辨識度與文字對比。
- [ ] 加入 10 場 Boss 關卡，驗證階段切換、部位破壞、召喚上限與 Boss 死亡後的小兵處理。
- [ ] 若製作戰鬥動畫，另建立 `idle / attack / hit / skill / defeat` 動畫資源，不直接把本立繪當動畫幀。

## 路徑提醒

- 正式幻獸圖在 `01_幻獸/`。
- `_source_chroma/` 是保留的原始綠幕製作檔，不應被遊戲載入。
- `_圖集/` 是整張 atlas；同層編號子資料夾是已切割單圖，兩者擇一接入即可。
