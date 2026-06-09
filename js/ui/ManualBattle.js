// 手動戰鬥控制器
var ManualBattle = (function () {
  var selectedTarget = null;
  var battleSpeed = 1; // 1x, 2x, 4x
  var isEndingBattle = false; // 防止重複進入結算

  return {
    // 開始手動戰鬥
    start: function (stageNum) {
      if (!GameState.spendAP(10)) {
        showToast('AP 不足！需要 10 AP');
        return false;
      }

      // 初始化統計
      BattleStats.init();

      // 重置結算旗標
      isEndingBattle = false;

      var result = BattleState.init(stageNum, true);
      if (result.error) {
        GameState.addAP(10);
        showToast(result.error);
        return false;
      }

      this.renderBattleUI();
      return true;
    },

    // 渲染戰鬥界面
    renderBattleUI: function () {
      var battle = BattleState.get();
      if (!battle) return;

      var container = document.getElementById('screen-battle');
      if (!container) return;

      // 渲染敵方
      var enemyHtml = this.renderEnemyTeam(battle.enemyFront, battle.enemyBack);

      // 渲染我方
      var playerHtml = this.renderPlayerTeam(battle.playerTeam);

      // 當前回合資訊
      var currentPet = BattleState.getCurrentPet();
      var turnInfo = '';
      if (battle.isPlayerTurn && currentPet) {
        turnInfo = '<div class="turn-info">🎯 ' + currentPet.name + ' 的回合</div>';
      } else if (!battle.isPlayerTurn) {
        turnInfo = '<div class="turn-info">⚔️ 敵人回合</div>';
      }

      container.innerHTML =
        '<div class="manual-battle-container">' +
          '<div class="battle-header">' +
            '<div class="round-counter">第 ' + battle.round + ' 回合</div>' +
            '<div class="speed-control">' +
              '<button class="btn-speed ' + (battleSpeed === 1 ? 'active' : '') + '" onclick="ManualBattle.setSpeed(1)">1x</button>' +
              '<button class="btn-speed ' + (battleSpeed === 2 ? 'active' : '') + '" onclick="ManualBattle.setSpeed(2)">2x</button>' +
              '<button class="btn-speed ' + (battleSpeed === 4 ? 'active' : '') + '" onclick="ManualBattle.setSpeed(4)">4x</button>' +
            '</div>' +
          '</div>' +
          turnInfo +
          '<div class="battle-field">' +
            '<div class="player-side">' + playerHtml + '</div>' +
            '<div class="enemy-side">' + enemyHtml + '</div>' +
          '</div>' +
          '<div class="action-panel">' + this.renderActionPanel() + '</div>' +
          '<div class="bc-status-bar"><div id="bc-status" class="bc-status">手動戰鬥中...</div></div>' +
          '<div class="fight-wrap">' +
            '<button class="btn-flee" onclick="BattleView.flee()">🏃 逃跑</button>' +
          '</div>' +
        '</div>' +
        '<div id="battle-result-overlay" class="result-overlay" style="display:none"></div>';

      // 如果是敵人回合，自動執行
      if (!battle.isPlayerTurn) {
        setTimeout(function () {
          ManualBattle.executeEnemyTurn();
        }, 1000 / battleSpeed);
      }
    },

    renderPlayerTeam: function (team) {
      return '<div class="manual-player-grid">' +
        '<div class="manual-back-row">' +
          team.slice(4, 6).map(function (pet, idx) {
            var actualIdx = idx + 4;
            if (!pet) return '<div class="battle-card empty">後排空位</div>';

            var hpPercent = Math.floor((pet.hp / pet.maxHp) * 100);
            var isDead = pet.hp <= 0;
            var isCurrent = BattleState.getCurrentPet() === pet;

            return '<div class="battle-card player-card ' +
                   (isDead ? 'dead' : '') +
                   (isCurrent ? ' current-turn' : '') +
                   '" data-pet-index="' + actualIdx + '">' +
              '<div class="card-icon">' + pet.icon + '</div>' +
              '<div class="card-name">' + pet.name + '</div>' +
              '<div class="card-hp">' +
                '<div class="hp-bar-bg"><div class="hp-bar" style="width:' + hpPercent + '%"></div></div>' +
                '<div class="hp-text">' + pet.hp + '/' + pet.maxHp + '</div>' +
              '</div>' +
            '</div>';
          }).join('') +
        '</div>' +
        '<div class="manual-front-row">' +
          team.slice(0, 4).map(function (pet, idx) {
            if (!pet) return '<div class="battle-card empty">前排空位</div>';

            var hpPercent = Math.floor((pet.hp / pet.maxHp) * 100);
            var isDead = pet.hp <= 0;
            var isCurrent = BattleState.getCurrentPet() === pet;

            return '<div class="battle-card player-card ' +
                   (isDead ? 'dead' : '') +
                   (isCurrent ? ' current-turn' : '') +
                   '" data-pet-index="' + idx + '">' +
              '<div class="card-icon">' + pet.icon + '</div>' +
              '<div class="card-name">' + pet.name + '</div>' +
              '<div class="card-hp">' +
                '<div class="hp-bar-bg"><div class="hp-bar" style="width:' + hpPercent + '%"></div></div>' +
                '<div class="hp-text">' + pet.hp + '/' + pet.maxHp + '</div>' +
              '</div>' +
            '</div>';
          }).join('') +
        '</div>' +
      '</div>';
    },

    renderEnemyTeam: function (front, back) {
      var all = front.concat(back);
      return all.map(function (enemy) {
        var hpPercent = Math.floor((enemy.hp / enemy.maxHp) * 100);
        var isDead = enemy.hp <= 0;
        var isSelected = selectedTarget === enemy.id;

        return '<div class="battle-card enemy-card ' +
               (isDead ? 'dead' : '') +
               (isSelected ? ' selected' : '') +
               (enemy.isBoss ? ' boss' : '') +
               '" data-enemy-id="' + enemy.id + '" onclick="ManualBattle.selectTarget(\'' + enemy.id + '\')">' +
          '<div class="card-icon">' + enemy.icon + '</div>' +
          '<div class="card-name">' + enemy.name + ' Lv.' + enemy.level + '</div>' +
          '<div class="card-hp">' +
            '<div class="hp-bar-bg"><div class="hp-bar enemy-hp" style="width:' + hpPercent + '%"></div></div>' +
            '<div class="hp-text">' + enemy.hp + '/' + enemy.maxHp + '</div>' +
          '</div>' +
        '</div>';
      }).join('');
    },

    renderActionPanel: function () {
      var battle = BattleState.get();
      if (!battle || !battle.isPlayerTurn) {
        return '<div class="waiting">等待敵人行動...</div>';
      }

      var currentPet = BattleState.getCurrentPet();
      if (!currentPet) {
        return '<button class="btn-primary btn-large" onclick="ManualBattle.executeEnemyTurn()">結束我方回合</button>';
      }

      var skillsHtml = currentPet.skills.map(function (skill, idx) {
        var cd = currentPet.cooldowns[idx];
        var isPassive = skill.type === 'passive';
        var isActive = skill.type === 'active';
        var onCooldown = isActive && cd > 0;

        var label = skill.name;
        if (isPassive) label += ' (被動)';
        if (onCooldown) label += ' (CD:' + cd + ')';

        return '<button class="btn-skill ' +
               (isPassive || onCooldown ? 'btn-disabled' : '') +
               '" onclick="ManualBattle.useSkill(' + idx + ')" ' +
               (isPassive || onCooldown ? 'disabled' : '') + '>' +
          label +
        '</button>';
      }).join('');

      return '<div class="skill-panel">' +
        '<div class="panel-title">選擇技能：</div>' +
        '<div class="skill-buttons">' + skillsHtml + '</div>' +
        '<div class="panel-hint">' + (selectedTarget ? '✓ 已選擇目標' : '⚠️ 請先選擇敵人目標') + '</div>' +
      '</div>';
    },

    selectTarget: function (targetId) {
      selectedTarget = targetId;
      this.renderBattleUI();
    },

    useSkill: function (skillIndex) {
      var battle = BattleState.get();
      if (!battle || !battle.isPlayerTurn) return;

      var currentPet = BattleState.getCurrentPet();
      if (!currentPet) return;

      var skill = currentPet.skills[skillIndex];

      // 全體技能不需要選擇目標
      if (skill.effect === 'damage_all' || skill.effect === 'heal' || skill.effect === 'heal_all') {
        selectedTarget = null;
      } else if (!selectedTarget) {
        showToast('請先選擇目標！');
        return;
      }

      var petIndex = battle.playerTeam.indexOf(currentPet);
      var result = BattleState.executePlayerAction(petIndex, selectedTarget, skillIndex);

      if (result && result.error) {
        showToast(result.error);
        return;
      }

      selectedTarget = null;

      // 動畫延遲後更新
      setTimeout(function () {
        ManualBattle.renderBattleUI();
        ManualBattle.checkBattleEnd();
      }, 500 / battleSpeed);
    },

    executeEnemyTurn: function () {
      var results = BattleState.executeEnemyTurn();

      setTimeout(function () {
        ManualBattle.renderBattleUI();
        ManualBattle.checkBattleEnd();
      }, 1000 / battleSpeed);
    },

    checkBattleEnd: function () {
      var result = BattleState.checkBattleEnd();
      if (!result) return;

      // 防止重複進入結算（競爭條件）
      if (isEndingBattle) return;
      isEndingBattle = true;

      // 先捕獲 stageNum，避免 setTimeout 內讀取已清空的 state
      var battle = BattleState.get();
      var stageNum = battle ? battle.stageNum : null;

      setTimeout(function () {
        if (result.win) {
          BattleEngine.applyRewards(result.rewards);
          if (stageNum) {
            GameState.unlockStage(stageNum + 1);
          }

          // 顯示勝利界面和統計
          var statsHtml = BattleStats.generateReport();
          var overlay = document.getElementById('battle-result-overlay');
          var r = result.rewards;
          var itemText = (r.items || []).map(function (it) {
            return ITEM_DATA[it.id] ? ITEM_DATA[it.id].name + ' ×' + it.count : '';
          }).filter(Boolean).join('、');

          overlay.innerHTML =
            '<div class="result-box win">' +
            '<div class="result-title">🎉 勝利！</div>' +
            '<div class="result-rewards">' +
              '💰 金幣 +' + r.gold + '<br>💎 鑽石 +' + r.diamond + '<br>⭐ 經驗 +' + r.exp +
              (r.tickets ? '<br>🎫 抽獎券 +' + r.tickets : '') +
              (itemText  ? '<br>📦 ' + itemText : '') +
            '</div>' +
            statsHtml +
            '<div class="result-btns">' +
              '<button class="btn-primary" onclick="ManualBattle.closeResult(true)">下一關</button>' +
              '<button class="btn-secondary" onclick="ManualBattle.closeResult(false)">返回</button>' +
            '</div></div>';
          overlay.style.display = 'flex';

          // 2秒後自動進入下一關
          setTimeout(function () {
            ManualBattle.closeResult(true);
          }, 2000);

        } else {
          var statsHtml2 = BattleStats.generateReport();
          var overlay2 = document.getElementById('battle-result-overlay');
          overlay2.innerHTML =
            '<div class="result-box lose">' +
            '<div class="result-title">💀 失敗</div>' +
            '<div class="result-sub">強化寵物後再試！</div>' +
            statsHtml2 +
            '<button class="btn-primary" onclick="ManualBattle.closeResult(false)">重試</button></div>';
          overlay2.style.display = 'flex';
          // 失敗不自動關閉
        }

        BattleState.clear();
        updateHUD();
      }, 1000 / battleSpeed);
    },

    setSpeed: function (speed) {
      battleSpeed = speed;
      this.renderBattleUI();
    },

    closeResult: function (advance) {
      document.getElementById('battle-result-overlay').style.display = 'none';

      // 重置戰鬥狀態，允許再次戰鬥
      isEndingBattle = false;

      if (advance) {
        var state = GameState.get();
        if (state.currentStage < 999) {
          state.currentStage = Math.min(state.maxStage, state.currentStage + 1);
          GameState.save();
        }
      }
      BattleView.render();
    }
  };
})();
