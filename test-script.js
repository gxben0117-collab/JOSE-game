// 遊戲流程測試腳本
console.log('🎮 開始遊戲流程測試...\n');

// 測試 1: GameState 初始化
console.log('1️⃣ 測試 GameState 初始化');
try {
  if (typeof GameState === 'undefined') {
    console.error('❌ GameState 未定義');
  } else {
    GameState.init();
    const state = GameState.get();
    console.log('✅ GameState 初始化成功');
    console.log('  - 玩家等級:', state.playerLevel);
    console.log('  - 金幣:', state.gold);
    console.log('  - 鑽石:', state.diamond);
    console.log('  - 當前關卡:', state.currentStage);
  }
} catch (e) {
  console.error('❌ GameState 測試失敗:', e.message);
}

// 測試 2: PetSystem
console.log('\n2️⃣ 測試 PetSystem');
try {
  if (typeof PET_DATA === 'undefined') {
    console.error('❌ PET_DATA 未定義');
  } else {
    console.log('✅ 寵物資料載入成功');
    console.log('  - 總寵物數:', PET_DATA.length);

    // 檢查每隻寵物的技能數量
    const petsWithoutSkill4 = PET_DATA.filter(p => !p.skills || p.skills.length < 4);
    if (petsWithoutSkill4.length > 0) {
      console.warn('⚠️  有', petsWithoutSkill4.length, '隻寵物缺少第4技能:');
      petsWithoutSkill4.forEach(p => console.log('    -', p.name, '(技能數:', p.skills ? p.skills.length : 0, ')'));
    } else {
      console.log('✅ 所有寵物都有4個技能');
    }

    // 檢查屬性
    const elements = PET_DATA.reduce((acc, p) => {
      acc[p.element] = (acc[p.element] || 0) + 1;
      return acc;
    }, {});
    console.log('  - 屬性分布:', elements);
  }
} catch (e) {
  console.error('❌ PetSystem 測試失敗:', e.message);
}

// 測試 3: BattleEngine
console.log('\n3️⃣ 測試 BattleEngine');
try {
  if (typeof BattleEngine === 'undefined') {
    console.error('❌ BattleEngine 未定義');
  } else {
    console.log('✅ BattleEngine 已載入');
    console.log('  - 方法:', Object.keys(BattleEngine).join(', '));
  }
} catch (e) {
  console.error('❌ BattleEngine 測試失敗:', e.message);
}

// 測試 4: BattleState
console.log('\n4️⃣ 測試 BattleState');
try {
  if (typeof BattleState === 'undefined') {
    console.error('❌ BattleState 未定義');
  } else {
    console.log('✅ BattleState 已載入');
    console.log('  - 方法:', Object.keys(BattleState).join(', '));
  }
} catch (e) {
  console.error('❌ BattleState 測試失敗:', e.message);
}

// 測試 5: BattleStats
console.log('\n5️⃣ 測試 BattleStats');
try {
  if (typeof BattleStats === 'undefined') {
    console.error('❌ BattleStats 未定義');
  } else {
    BattleStats.init();
    BattleStats.recordDamageDealt(100);
    BattleStats.recordDamageTaken(50);
    BattleStats.recordKill();
    const stats = BattleStats.get();
    console.log('✅ BattleStats 運作正常');
    console.log('  - 傷害輸出:', stats.totalDamageDealt);
    console.log('  - 受到傷害:', stats.totalDamageTaken);
    console.log('  - 擊殺數:', stats.killCount);
    BattleStats.clear();
  }
} catch (e) {
  console.error('❌ BattleStats 測試失敗:', e.message);
}

// 測試 6: GachaSystem
console.log('\n6️⃣ 測試 GachaSystem');
try {
  if (typeof GachaSystem === 'undefined') {
    console.error('❌ GachaSystem 未定義');
  } else {
    console.log('✅ GachaSystem 已載入');
    console.log('  - 方法:', Object.keys(GachaSystem).join(', '));
  }
} catch (e) {
  console.error('❌ GachaSystem 測試失敗:', e.message);
}

// 測試 7: UI 模組
console.log('\n7️⃣ 測試 UI 模組');
const uiModules = ['BattleView', 'ManualBattle', 'InventoryView', 'GachaView', 'ShopView', 'SettingsView', 'Navigation'];
uiModules.forEach(moduleName => {
  try {
    if (typeof window[moduleName] === 'undefined') {
      console.error('❌', moduleName, '未定義');
    } else {
      console.log('✅', moduleName, '已載入');
    }
  } catch (e) {
    console.error('❌', moduleName, '測試失敗:', e.message);
  }
});

// 測試 8: DOM 元素
console.log('\n8️⃣ 測試 DOM 元素');
const requiredElements = [
  'game-container',
  'hud',
  'screen-battle',
  'screen-inventory',
  'screen-gacha',
  'screen-shop',
  'screen-settings',
  'bottom-nav'
];
requiredElements.forEach(id => {
  const el = document.getElementById(id);
  if (!el) {
    console.error('❌ 元素不存在:', id);
  } else {
    console.log('✅ 元素存在:', id);
  }
});

// 測試 9: 資料完整性
console.log('\n9️⃣ 測試資料完整性');
try {
  if (typeof ITEM_DATA === 'undefined') {
    console.error('❌ ITEM_DATA 未定義');
  } else {
    console.log('✅ 道具資料已載入');
    console.log('  - 道具種類:', Object.keys(ITEM_DATA).length);
  }

  if (typeof getStageConfig === 'undefined') {
    console.error('❌ getStageConfig 未定義');
  } else {
    const stage1 = getStageConfig(1);
    const stage10 = getStageConfig(10);
    console.log('✅ 關卡資料已載入');
    console.log('  - 第1關敵人:', stage1.frontRow.length + stage1.backRow.length);
    console.log('  - 第10關 (Boss):', stage10.isBoss ? 'Yes' : 'No');
  }
} catch (e) {
  console.error('❌ 資料完整性測試失敗:', e.message);
}

// 測試 10: 函數可用性
console.log('\n🔟 測試全域函數');
const globalFunctions = ['updateHUD', 'showToast', 'setStatus'];
globalFunctions.forEach(funcName => {
  if (typeof window[funcName] === 'undefined') {
    console.error('❌ 函數未定義:', funcName);
  } else {
    console.log('✅ 函數可用:', funcName);
  }
});

console.log('\n✅ 測試完成！');
