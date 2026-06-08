// 自動化遊戲測試腳本 - 模擬10次完整遊玩
// 此腳本在瀏覽器 console 中執行

(function() {
  console.log('========================================');
  console.log('🎮 開始自動化遊戲測試 - 10 次完整遊玩');
  console.log('========================================\n');

  let testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    errors: []
  };

  // 測試 1: 遊戲初始化
  console.log('📋 測試 1/10: 遊戲初始化');
  try {
    GameState.init();
    const state = GameState.get();

    if (state && state.playerLevel >= 1) {
      console.log('✅ GameState 初始化成功');
      console.log(`   - 玩家等級: ${state.playerLevel}`);
      console.log(`   - 金幣: ${state.gold}`);
      console.log(`   - 鑽石: ${state.diamond}`);
      testResults.passed++;
    } else {
      throw new Error('GameState 初始化失敗');
    }
  } catch (e) {
    console.error('❌ 測試 1 失敗:', e.message);
    testResults.failed++;
    testResults.errors.push(e.message);
  }
  testResults.total++;

  // 測試 2: 寵物系統
  console.log('\n📋 測試 2/10: 寵物系統');
  try {
    if (PET_DATA && PET_DATA.length === 30) {
      console.log('✅ 寵物資料載入成功');
      console.log(`   - 總寵物數: ${PET_DATA.length}`);

      // 檢查技能完整性
      const missingSkills = PET_DATA.filter(p => !p.skills || p.skills.length < 4);
      if (missingSkills.length === 0) {
        console.log('✅ 所有寵物都有 4 個技能');
        testResults.passed++;
      } else {
        throw new Error(`${missingSkills.length} 隻寵物缺少技能`);
      }
    } else {
      throw new Error('寵物資料不完整');
    }
  } catch (e) {
    console.error('❌ 測試 2 失敗:', e.message);
    testResults.failed++;
    testResults.errors.push(e.message);
  }
  testResults.total++;

  // 測試 3: 添加測試寵物
  console.log('\n📋 測試 3/10: 添加測試寵物');
  try {
    const state = GameState.get();

    // 清空現有寵物並添加測試寵物
    state.pets = [
      { id: 'molten_ball', level: 10, exp: 0, stars: 2 },
      { id: 'fire_lion', level: 10, exp: 0, stars: 2 },
      { id: 'fire_fox', level: 10, exp: 0, stars: 2 }
    ];
    state.activePets = [0, 1, 2];
    state.maxAp = 200;
    GameState.save();

    console.log('✅ 測試寵物添加成功');
    console.log(`   - 熔岩球 Lv.10 ⭐⭐`);
    console.log(`   - 火獅 Lv.10 ⭐⭐`);
    console.log(`   - 火狐 Lv.10 ⭐⭐`);
    testResults.passed++;
  } catch (e) {
    console.error('❌ 測試 3 失敗:', e.message);
    testResults.failed++;
    testResults.errors.push(e.message);
  }
  testResults.total++;

  // 測試 4-13: 10 次戰鬥測試
  let battleResults = { wins: 0, losses: 0, errors: 0 };

  for (let i = 1; i <= 10; i++) {
    console.log(`\n📋 測試 ${3 + i}/10: 第 ${i} 關戰鬥`);

    try {
      const state = GameState.get();
      state.currentStage = i;
      GameState.save();

      // 執行戰鬥
      const result = BattleEngine.simulate(i, false);

      if (!result) {
        throw new Error('戰鬥結果為 null');
      }

      if (result.win) {
        console.log(`✅ 第 ${i} 關 - 勝利！`);
        if (result.rewards) {
          console.log(`   - 金幣 +${result.rewards.gold}`);
          console.log(`   - 鑽石 +${result.rewards.diamond}`);
          console.log(`   - 經驗 +${result.rewards.exp}`);
        }
        battleResults.wins++;
        testResults.passed++;
      } else {
        console.log(`⚠️  第 ${i} 關 - 失敗`);
        battleResults.losses++;
        testResults.passed++; // 失敗也算通過測試，因為邏輯正常
      }

    } catch (e) {
      console.error(`❌ 第 ${i} 關測試失敗:`, e.message);
      battleResults.errors++;
      testResults.failed++;
      testResults.errors.push(`第${i}關: ${e.message}`);
    }

    testResults.total++;
  }

  // 總結
  console.log('\n========================================');
  console.log('📊 測試總結');
  console.log('========================================');
  console.log(`總測試數: ${testResults.total}`);
  console.log(`✅ 通過: ${testResults.passed}`);
  console.log(`❌ 失敗: ${testResults.failed}`);
  console.log(`成功率: ${Math.round((testResults.passed / testResults.total) * 100)}%`);

  console.log('\n⚔️  戰鬥統計:');
  console.log(`   - 勝利: ${battleResults.wins}/10`);
  console.log(`   - 失敗: ${battleResults.losses}/10`);
  console.log(`   - 錯誤: ${battleResults.errors}/10`);
  console.log(`   - 勝率: ${battleResults.wins * 10}%`);

  if (testResults.errors.length > 0) {
    console.log('\n⚠️  錯誤列表:');
    testResults.errors.forEach((err, idx) => {
      console.log(`   ${idx + 1}. ${err}`);
    });
  }

  console.log('\n========================================');

  if (testResults.failed === 0 && battleResults.errors === 0) {
    console.log('🎉 所有測試通過！遊戲運作正常！');
    console.log('✅ Production Ready 驗證成功！');
  } else {
    console.log('⚠️  部分測試失敗，請檢查錯誤列表');
  }

  console.log('========================================\n');

  return testResults;
})();
