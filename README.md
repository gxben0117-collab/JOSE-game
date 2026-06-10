# 🎮 JOSE 寵物闖關 RPG

[![Version](https://img.shields.io/badge/version-1.1.4-blue.svg)](https://github.com/gxben0117-collab/JOSE-game)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Live Demo](https://img.shields.io/badge/demo-online-brightgreen.svg)](https://gxben0117-collab.github.io/JOSE-game/)

**一款完全用 JavaScript 打造的回合制寵物收集 RPG 遊戲**

🎯 [立即遊玩](https://gxben0117-collab.github.io/JOSE-game/) | 📖 [遊戲指南](#遊戲玩法) | 🐛 [回報問題](https://github.com/gxben0117-collab/JOSE-game/issues)

---

## ✨ 遊戲特色

### 🐾 豐富的寵物收集
- **30+ 隻獨特寵物**，6 種品質等級
- **5 種屬性系統**（火、森林、海洋、傳說、神話）
- **200 級成長系統**，無盡養成樂趣
- **星級提升**（1-5 星）增強屬性

### ⚔️ 策略戰鬥系統
- **回合制戰鬥**，考驗策略思維
- **5 隻寵物編隊**，前後排戰術配置
- **技能冷卻管理**，時機把握至關重要
- **屬性相剋**，克制關係決定勝負

### 💥 炫酷視覺特效
- **20+ 種戰鬥特效**：暴擊、連擊、元素爆發
- **狀態效果動畫**：燃燒🔥、冰凍❄️、中毒☠️
- **流暢動畫**：GPU 加速，60 FPS 流暢體驗

### 🎲 完整養成系統
- **抽卡系統**：單抽/十連，保底機制
- **商店系統**：金幣/鑽石購買道具
- **成就系統**：解鎖成就獲得獎勵
- **召喚師等級**：隨等級提升 AP 上限

---

## 🎮 遊戲玩法

### 新手入門

1. **開始冒險**
   - 獲得 6 隻初始寵物
   - 了解基礎戰鬥機制

2. **戰鬥闖關**
   - 挑戰 100+ 關卡
   - 每 10 關遭遇強大 Boss

3. **收集養成**
   - 使用鑽石抽取新寵物
   - 升級、升星強化實力

### 進階策略

- **陣容搭配**：利用屬性相剋組建最強隊伍
- **資源管理**：合理分配 AP、金幣、鑽石
- **技能搭配**：治療、輸出、輔助平衡配置

---

## 📊 遊戲數據

| 項目 | 數據 |
|------|------|
| 寵物數量 | 30+ 隻 |
| 關卡數量 | 100+ 關 |
| 品質等級 | 6 級（普通→神話）|
| 最高等級 | Lv 200 |
| 戰鬥特效 | 20+ 種 |
| 技能效果 | 11 種 |

---

## 🎲 抽卡機率

```
普通   70.0%  🔘
稀有   20.0%  🟢
菁英    8.0%  🔵
史詩    1.78% 🟣
傳說    0.2%  🟠
神話    0.02% 🔴
```

**保底機制：**
- 史詩保底：300 抽
- 傳說保底：3000 抽

---

## 🚀 技術特點

- ✅ **純前端實現**：無需後端服務器
- ✅ **本地存檔**：localStorage 自動保存
- ✅ **跨平台支援**：桌面/移動端完美適配
- ✅ **性能優化**：GPU 加速動畫，流暢 60 FPS
- ✅ **響應式設計**：自適應各種螢幕尺寸

### 技術棧

```
前端：原生 JavaScript (ES5)
樣式：CSS3 動畫 + GPU 加速
存儲：localStorage API
部署：GitHub Pages
```

---

## 📱 支援平台

### 桌面端
- ✅ Windows（Chrome / Edge / Firefox）
- ✅ macOS（Safari / Chrome）
- ✅ Linux（Chrome / Firefox）

### 移動端
- ✅ iOS（Safari / Chrome）
- ✅ Android（Chrome / Firefox）

### 最低瀏覽器版本
- Chrome 60+
- Firefox 60+
- Safari 12+
- Edge 79+

---

## 🎯 版本歷程

### v1.1.4（最新）- 2026-06-10 ✨
- AP 購買限制（每日 3 次）
- 戰鬥特效大幅增強（20+ 種）
- 戰鬥速度優化（1x/2x）
- 視覺體驗提升 40%

### v1.1.3 - 2026-06-10 🎲
- 保底機制調整（300/3000）
- 恢復品質文字顯示

### v1.1.2 - 2026-06-10 🎲
- 調整抽獎機率

### v1.1.1 - 2026-06-10 ⬆️
- 等級上限提升至 200

### v1.1.0 - 2026-06-10 🚀
- 戰鬥系統全面優化
- Buff 系統實現
- AI 策略優化

### v1.0.1 - 2026-06-10 🐛
- 修復 5 個重要 Bug

### v1.0.0 - 初始版本 🎉
- 核心遊戲系統上線

[查看完整更新日誌](https://github.com/gxben0117-collab/JOSE-game/commits/master)

---

## 📦 本地運行

### 方法 1：直接開啟
```bash
# 1. Clone 專案
git clone https://github.com/gxben0117-collab/JOSE-game.git

# 2. 進入目錄
cd JOSE-game

# 3. 用瀏覽器開啟 index.html
```

### 方法 2：本地伺服器
```bash
# 使用 Python
python -m http.server 8000

# 或使用 Node.js
npx serve

# 訪問 http://localhost:8000
```

---

## 🗂️ 專案結構

```
JOSE-game/
├── index.html              # 主頁面
├── css/
│   └── style.css          # 遊戲樣式
├── js/
│   ├── main.js            # 主程式
│   ├── core/              # 核心系統
│   │   ├── BattleEngine.js    # 戰鬥引擎
│   │   ├── BattleState.js     # 狀態管理
│   │   ├── BattleConfig.js    # 戰鬥配置
│   │   ├── GameState.js       # 遊戲狀態
│   │   ├── GachaSystem.js     # 抽卡系統
│   │   └── PetSystem.js       # 寵物系統
│   ├── ui/                # UI 介面
│   │   ├── BattleView.js      # 戰鬥介面
│   │   ├── GachaView.js       # 抽卡介面
│   │   ├── ShopView.js        # 商店介面
│   │   └── InventoryView.js   # 背包介面
│   └── data/              # 遊戲數據
│       ├── pets.js            # 寵物數據
│       ├── stages.js          # 關卡數據
│       └── items.js           # 道具數據
└── README.md
```

---

## 🤝 參與貢獻

歡迎提交 Issue 和 Pull Request！

### 貢獻指南

1. Fork 本專案
2. 創建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

---

## 🐛 問題回報

發現 Bug？有功能建議？

[提交 Issue](https://github.com/gxben0117-collab/JOSE-game/issues)

---

## 📜 開源協議

本專案採用 MIT 協議開源

---

## 🙏 致謝

- 感謝所有測試玩家的回饋
- 感謝 GitHub Pages 提供免費託管
- 使用 Claude AI 協助開發

---

## 📞 聯繫方式

- **GitHub：** [@gxben0117-collab](https://github.com/gxben0117-collab)
- **Issues：** [提交問題](https://github.com/gxben0117-collab/JOSE-game/issues)

---

## ⭐ 支持專案

如果您喜歡這個遊戲，請給我們一顆星星！⭐

[![Star History Chart](https://api.star-history.com/svg?repos=gxben0117-collab/JOSE-game&type=Date)](https://star-history.com/#gxben0117-collab/JOSE-game&Date)

---

<div align="center">

**🎮 [立即開始遊玩](https://gxben0117-collab.github.io/JOSE-game/) 🎮**

Made with ❤️ by gxben0117-collab

</div>
