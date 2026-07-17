# 不需要的檔案（歷史封存）

此資料夾存放 **目前遊戲（幻獸戰棋）不再使用** 的歷史檔案，僅供資產與技術參考。
正式遊戲只需要專案根目錄的 `index.html`、`tactics.html`、`css/`、`js/`、`assets/`。

## 內容分類

| 位置 | 內容 | 原用途 |
| --- | --- | --- |
| `adventure.html` + `js/adventure*.js` + `css/adventure*.css` | 2D 冒險模式 | 舊玩法（已收斂為戰棋） |
| `showcase.html` + `js/showcase.js` + `css/showcase.css` | 幻獸展示頁 | 舊展示功能 |
| `index-3d-legacy.html` + `js/v2/` + `css/v2.css` | 3D 遠征模式 | 舊 3D 實驗玩法 |
| `js/core/`（Battle*、Gacha、GameState 等 9 檔） | 舊主遊戲系統 | 抽卡／背包／離線收益等 |
| `js/ui/`、`js/utils/`、`js/vendor/` | 舊 UI 元件、three.js | 舊 2D/3D 介面與 3D 引擎 |
| `js/data/items.js`、`js/data/stages.js` | 舊道具與關卡資料 | 2D 冒險模式資料 |
| `css/`（style、home、newbie-gift、pixel-filter、emoji-enhance） | 舊全域樣式 | 舊主頁與視覺強化 |
| `assets/models/` | 45+10 個 GLB 3D 模型 | 3D 模式模型（14MB） |
| `assets/sprites/animation-upgrade/`、`assets/sprites/vfx/` | 動畫幀與特效圖 | 舊動畫升級實驗（37MB） |
| `scripts/inspect-model-animations.mjs` | GLB 模型檢查工具 | 3D 資產驗證 |
| `docs/` | 3D 授權、舊方案與計畫文件 | 歷史規劃紀錄 |
| `server.log`、`server-error.log` | 本機伺服器日誌 | 執行期產物 |

## 注意

- 若未來要復活 2D／3D 模式，把對應檔案搬回原路徑即可（路徑結構保持原樣）。
- `assets/models/` 的授權資訊在 `docs/3D_ASSET_LICENSES.md`。
- 刪除整個資料夾不影響現行遊戲的執行、測試與建置。
