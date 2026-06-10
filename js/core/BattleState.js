// 戰鬥狀態管理（用於手動模式）
var BattleState = (function () {
  var currentBattle = null;

  return {
    // 初始化戰鬥
    init: function (stageNum, isManualMode) {
      var cfg = getStageConfig(stageNum);
      var rawPets = GameState.getActivePets();

      if (!rawPets.some(Boolean)) {
        return { error: '請先設定上陣寵物！' };
      }

      // 建立戰鬥單位
      var playerTeam = rawPets.map(function (p) {
        return p ? BattleEngine.buildCombatant(p) : null;
      });
      var enemyFront = cfg.frontRow.map(BattleEngine.buildEnemy);
      var enemyBack = cfg.backRow.map(BattleEngine.buildEnemy);

      BattleEngine.applyPassives(playerTeam.filter(Boolean));

      currentBattle = {
        stageNum: stageNum,
        isManualMode: isManualMode,
        isBoss: cfg.isBoss,
        playerTeam: playerTeam,
        enemyFront: enemyFront,
        enemyBack: enemyBack,
        round: 0,
        log: [],
        currentPetIndex: 0, // 當前行動的寵物索引
        isPlayerTurn: true
      };

      currentBattle.log.push({
        type: 'start',
        stageName: '第' + stageNum + '關' + (cfg.isBoss ? ' ★BOSS' : ''),
        isBoss: cfg.isBoss
      });

      return { success: true };
    },

    // 獲取當前戰鬥狀態
    get: function () {
      return currentBattle;
    },

    // 檢查戰鬥是否結束
    checkBattleEnd: function () {
      if (!currentBattle) return null;

      var allEnemyDead = BattleEngine.allDead(currentBattle.enemyFront) &&
                         BattleEngine.allDead(currentBattle.enemyBack);
      var allPlayerDead = currentBattle.playerTeam.every(function (p) {
        return !p || p.hp <= 0;
      });

      if (allEnemyDead) {
        var rewards = getStageReward(currentBattle.stageNum, currentBattle.isBoss);
        if (currentBattle.isManualMode && rewards.diamond) {
          rewards.diamond = Math.floor(rewards.diamond * 1.1);
        }
        return { win: true, rewards: rewards };
      }

      if (allPlayerDead) {
        return { win: false, rewards: null };
      }

      if (currentBattle.round >= 60) {
        return { win: false, rewards: null };
      }

      return null;
    },

    // 執行玩家行動
    executePlayerAction: function (petIndex, targetId, skillIndex) {
      if (!currentBattle || !currentBattle.isPlayerTurn) return null;

      var pet = currentBattle.playerTeam[petIndex];
      if (!pet || pet.hp <= 0) return { error: '該寵物無法行動' };

      var target = this.findTarget(targetId);
      // 全體技能或治療技能不需要目標
      var skill = pet.skills && pet.skills[skillIndex];
      if (skill && (skill.effect === 'damage_all' || skill.effect === 'heal' ||
                    skill.effect === 'heal_all' || skill.effect === 'buff_atk' ||
                    skill.effect === 'shield')) {
        target = null; // 這些技能不需要目標
      } else if (!target) {
        return { error: '請先選擇目標' };
      }

      var result = BattleEngine.executePetAction(
        pet,
        target,
        skillIndex,
        currentBattle.enemyFront,
        currentBattle.enemyBack,
        currentBattle.playerTeam
      );

      if (result) {
        currentBattle.log.push(result);
      }

      // 移動到下一隻寵物
      currentBattle.currentPetIndex++;

      // 如果所有寵物都行動完，切換到敵人回合
      if (currentBattle.currentPetIndex >= 6) {
        currentBattle.isPlayerTurn = false;
        currentBattle.currentPetIndex = 0;
      }

      return result;
    },

    // 執行敵人回合
    executeEnemyTurn: function () {
      if (!currentBattle || currentBattle.isPlayerTurn) return null;

      currentBattle.round++;
      currentBattle.log.push({ type: 'round', round: currentBattle.round });
      BattleStats.setRoundCount(currentBattle.round);

      var results = [];

      // 所有敵人攻擊
      currentBattle.enemyFront.concat(currentBattle.enemyBack).forEach(function (enemy) {
        if (enemy.hp <= 0) return;
        var pt = BattleEngine.pickPlayerTarget(currentBattle.playerTeam);
        if (!pt) return;
        var effectiveDef = BattleEngine.getEffectiveDef(pt);
        var dmgE = BattleEngine.calcDamage(enemy.atk, effectiveDef, 1.0, 1.0);
        pt.hp = Math.max(0, pt.hp - dmgE);
        BattleStats.recordDamageTaken(dmgE);
        var result = {
          type: 'enemy_attack',
          enemyId: enemy.id,
          enemy: enemy.name,
          icon: enemy.icon,
          target: pt.name,
          dmg: dmgE,
          hp: pt.hp,
          maxHp: pt.maxHp
        };
        currentBattle.log.push(result);
        results.push(result);
      });

      // 回合結束：統一遞減冷卻時間和 Buff
      BattleEngine.decrementCooldowns(currentBattle.playerTeam);
      BattleEngine.decrementBuffs(currentBattle.playerTeam);

      // 切換回玩家回合
      currentBattle.isPlayerTurn = true;
      currentBattle.currentPetIndex = 0;

      return results;
    },

    findTarget: function (targetId) {
      var all = currentBattle.enemyFront.concat(currentBattle.enemyBack);
      return all.find(function (e) { return e.id === targetId; });
    },

    // 清除戰鬥狀態
    clear: function () {
      currentBattle = null;
    },

    // 獲取當前行動寵物
    getCurrentPet: function () {
      if (!currentBattle) return null;

      // 提前檢查是否所有寵物都死亡
      var anyAlive = currentBattle.playerTeam.some(function(p) {
        return p && p.hp > 0;
      });
      if (!anyAlive) return null;

      // 從當前索引開始向後找活著的寵物
      for (var i = currentBattle.currentPetIndex; i < 6; i++) {
        var pet = currentBattle.playerTeam[i];
        if (pet && pet.hp > 0) {
          currentBattle.currentPetIndex = i;
          return pet;
        }
      }

      // 如果沒找到，從頭開始找（處理治療/復活的情況）
      for (var i = 0; i < currentBattle.currentPetIndex; i++) {
        var pet = currentBattle.playerTeam[i];
        if (pet && pet.hp > 0) {
          currentBattle.currentPetIndex = i;
          return pet;
        }
      }

      return null;
    }
  };
})();
