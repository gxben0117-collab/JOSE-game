# 🎮 JOSE 寵物闖關 RPG

一款基於純前端技術的回合制寵物對戰遊戲，支援自動與手動戰鬥模式。

[![Production Ready](https://img.shields.io/badge/status-production%20ready-brightgreen)]()
[![Version](https://img.shields.io/badge/version-v1.0.0-blue)]()
[![License](https://img.shields.io/badge/license-MIT-green)]()

## 🌟 特色功能

### ⚔️ 戰鬥系統
- **雙模式戰鬥**：自動戰鬥 & 完整手動控制
- **戰鬥速度控制**：1x / 2x / 4x 三段速度
- **戰鬥統計**：即時追蹤 DPS、傷害、擊殺數等
- **屬性相剋**：火 > 森林 > 海洋 > 火
- **技能系統**：基礎攻擊、主動技能、被動技能
- **手動模式獎勵**：鑽石掉落 +10%

### 🐾 寵物系統
- **30 隻獨特寵物**：火系、森林系、海洋系各 10 隻
- **6 種品質**：普通、稀有、精英、史詩、傳說、神話
- **完整技能**：每隻寵物擁有 4 個技能
- **升級系統**：透過戰鬥獲得經驗升級
- **星級系統**：提升寵物潛力

### 🎯 遊戲系統
- **100 關卡**：逐步提升的挑戰難度
- **Boss 戰**：每 10 關一個強力 Boss
- **召喚師等級**：提升獲得被動加成
- **抽獎系統**：消耗鑽石獲得新寵物
- **離線獎勵**：離線時也能獲得經驗
- **每日登入**：連續登入獲得獎勵

### 📊 統計與進度
- **戰鬥統計**：
  - 總傷害輸出
  - 受到傷害
  - 擊殺數
  - 回合數
  - 技能使用次數
  - DPS（每秒傷害）
  - 戰鬥時長

## 🚀 快速開始

### 線上遊玩
直接訪問：[https://gxben0117-collab.github.io/JOSE-game/](https://gxben0117-collab.github.io/JOSE-game/)

### 本地運行
```bash
# 克隆專案
git clone https://github.com/gxben0117-collab/JOSE-game.git

# 進入目錄
cd JOSE-game

# 使用任何 HTTP 伺服器運行，例如：
python -m http.server 8000
# 或
npx http-server

# 在瀏覽器中訪問
# http://localhost:8000
```

## 📱 設備支援

- ✅ **桌面瀏覽器**（Chrome、Firefox、Safari、Edge）
- ✅ **平板電腦**（iPad、Android 平板）
- ✅ **手機**（iOS、Android）
- ✅ **響應式設計**，自動適配各種螢幕尺寸

## 🎮 遊戲玩法

### 基礎流程
1. **組建隊伍**：選擇 3 隻寵物上陣
2. **選擇關卡**：挑戰不同難度的關卡
3. **選擇模式**：自動戰鬥或手動控制
4. **獲得獎勵**：金幣、經驗、鑽石、道具
5. **強化寵物**：升級、進化、學習技能
6. **挑戰更高關卡**

### 戰鬥技巧
- **屬性相剋**：利用屬性優勢造成 1.5 倍傷害
- **技能時機**：合理使用冷卻技能
- **陣容搭配**：坦克 + 輸出 + 輔助的平衡
- **手動模式**：精確控制獲得更多鑽石

### 資源管理
- **金幣**：用於升級和進化
- **鑽石**：用於高級抽獎
- **AP（行動力）**：每場戰鬥消耗 10 AP
- **道具**：提升寵物屬性

## 🏗️ 技術架構

### 技術棧
- **純前端實現**：HTML5 + CSS3 + Vanilla JavaScript
- **無框架依賴**：原生 JavaScript，性能優異
- **本地儲存**：localStorage 自動儲存進度
- **模組化設計**：清晰的代碼結構

### 專案結構
```
JOSE-game/
├── index.html              # 主頁面
├── css/
│   └── style.css          # 所有樣式
├── js/
│   ├── data/              # 遊戲資料
│   │   ├── pets.js        # 寵物資料
│   │   ├── stages.js      # 關卡資料
│   │   └── items.js       # 道具資料
│   ├── core/              # 核心系統
│   │   ├── GameState.js   # 遊戲狀態管理
│   │   ├── BattleEngine.js # 戰鬥引擎
│   │   ├── BattleState.js  # 手動戰鬥狀態
│   │   ├── BattleStats.js  # 戰鬥統計
│   │   ├── PetSystem.js    # 寵物系統
│   │   ├── GachaSystem.js  # 抽獎系統
│   │   └── OfflineSystem.js # 離線系統
│   ├── ui/                # UI 模組
│   │   ├── BattleView.js   # 戰鬥界面
│   │   ├── ManualBattle.js # 手動戰鬥
│   │   ├── InventoryView.js # 背包界面
│   │   ├── GachaView.js    # 抽獎界面
│   │   ├── ShopView.js     # 商店界面
│   │   ├── SettingsView.js # 設定界面
│   │   └── Navigation.js   # 導航系統
│   └── main.js            # 程式入口
├── test.html              # 基礎測試頁面
├── auto-test.html         # 自動化戰鬥測試
├── comprehensive-test.html # 完整測試套件
└── README.md              # 本文件
```

### 核心模組說明

#### GameState
- 管理遊戲狀態
- 本地儲存和讀取
- 資源管理（金幣、鑽石、AP）

#### BattleEngine
- 戰鬥邏輯運算
- 傷害計算
- 屬性相剋
- 技能效果

#### BattleState
- 手動戰鬥狀態管理
- 回合制控制
- 玩家行動處理

#### BattleStats
- 即時戰鬥數據追蹤
- 統計報告生成
- DPS 計算

## 🧪 測試

### 自動化測試
訪問測試頁面進行完整測試：
- [基礎測試](test.html)
- [戰鬥測試](auto-test.html)
- [綜合測試](comprehensive-test.html)

### 測試覆蓋
- ✅ 資料完整性測試
- ✅ UI 元素測試
- ✅ 系統模組測試
- ✅ 戰鬥邏輯測試（10次自動測試）
- ✅ Mobile 響應式測試

## 📈 遊戲數據

### 寵物統計
- **總數**：30 隻
- **火系**：10 隻（熔岩球、火狐、火獅等）
- **森林系**：10 隻（葉耳兔、草熊、翠龍等）
- **海洋系**：10 隻（泡泡鯨、冰鯊、海帝獸等）

### 技能統計
- **總技能數**：120 個（30 隻 × 4 技能）
- **基礎攻擊**：30 個
- **主動技能**：60 個
- **被動技能**：30 個

### 關卡統計
- **總關卡**：100 關
- **普通關卡**：90 關
- **Boss 關卡**：10 關（每10關）

## 🎨 設計理念

### 視覺設計
- **深色主題**：舒適的遊戲體驗
- **漸變配色**：科技感十足
- **動畫反饋**：流暢的互動體驗
- **表情符號**：生動的寵物圖示

### 遊戲設計
- **漸進式難度**：從簡單到困難
- **多樣化玩法**：自動 + 手動模式
- **即時反饋**：戰鬥統計、視覺效果
- **獎勵機制**：持續激勵玩家

## 📄 License

MIT License - 自由使用和修改

## 👥 貢獻

歡迎提交 Issue 和 Pull Request！

## 🙏 致謝

感謝所有測試和反饋的玩家！

---

**立即開始遊戲：** [https://gxben0117-collab.github.io/JOSE-game/](https://gxben0117-collab.github.io/JOSE-game/)

Made with ❤️ by Claude Opus 4.8
