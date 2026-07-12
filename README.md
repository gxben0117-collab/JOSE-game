# JOSE：幻獸遠征

純靜態 HTML、CSS、JavaScript 製作的 3D 寵物收集策略 RPG，無 npm、無建置流程。

## 主要內容

- 45 隻既有幻獸各自綁定一個獨立 3D 模型，全部支援展示與戰鬥骨架動畫。
- 戰鬥包含待機、跑動／飛行、近身攻擊、受擊、擊退、死亡與勝利動作，以及元素粒子、技能衝擊波和鏡頭震動。
- 五個區域、每區 12 關，共 60 個主線關卡。
- 三人隊伍、角色定位、速度、能量技能與五屬性克制。
- 三星目標、精英戰、區域守護神、元素試煉、無限塔與世界 Boss。
- 等級、五星、靈魂碎片、親密度、技能與二階分支進化。
- 基地訓練場、研究所、孵化室與高／低 3D 畫質模式。
- `localStorage` 本機存檔；舊版檔案保留在 Git 歷史中。

## 執行

模型使用 `fetch` 載入，請由 HTTP 伺服器開啟：

```powershell
python -m http.server 8000
```

瀏覽 `http://localhost:8000/`。

## 結構

- `index.html`：新版入口
- `css/v2.css`：新版響應式視覺系統
- `js/v2/`：資料、存檔、3D 渲染與遊戲 UI
- `js/vendor/`：自託管 Three.js 及 GLTFLoader
- `assets/models/`：CC0 GLB 模型
- `docs/3D_ASSET_LICENSES.md`：資產授權記錄
- `docs/方案三_3D寵物探索Roguelite備忘.md`：下一款遊戲企劃
