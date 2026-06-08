var BattleView = (function () {
  var battleResult  = null;
  var logIndex      = 0;
  var animTimer     = null;
  var isBattling    = false;
  var petNameToSlot = {};  // stats.name -> slot index 0|1|2
  var battleMode    = 'auto'; // 'auto' 或 'manual'
  var battleSpeed   = 1; // 1x, 2x, 4x

  /* ─── DOM builders ─── */

  function hpHtml(hp, maxHp) {
    return '<div class="bc-hpbar-wrap"><div class="bc-hpbar"></div></div>' +
           '<div class="bc-hptext">' + hp + ' / ' + maxHp + '</div>';
  }

  function buildEnemySide(cfg) {
    // frontRow left, backRow right  (enemy faces LEFT toward player)
    var frontHtml = cfg.frontRow.map(function (e) {
      return '<div class="bc enemy-bc minion-bc" id="bc-' + e.id + '">' +
               '<div class="bc-icon">' + e.icon + '</div>' +
               '<div class="bc-label">' + e.name + '<br><span class="bc-lv">Lv.' + e.level + '</span></div>' +
               hpHtml(e.maxHp, e.maxHp) +
             '</div>';
    }).join('');

    var backHtml = cfg.backRow.map(function (e) {
      var cls = e.isBoss ? ' boss-bc' : ' leader-bc';
      return '<div class="bc enemy-bc' + cls + '" id="bc-' + e.id + '">' +
               '<div class="bc-icon">' + e.icon + '</div>' +
               '<div class="bc-label">' + e.name + '<br><span class="bc-lv">Lv.' + e.level + '</span></div>' +
               hpHtml(e.maxHp, e.maxHp) +
             '</div>';
    }).join('');

    return '<div class="form-front-col">' +
             '<div class="row-tag enemy-tag">前排</div>' +
             frontHtml +
           '</div>' +
           '<div class="form-back-col">' +
             '<div class="row-tag enemy-tag">後排</div>' +
             backHtml +
           '</div>';
  }

  function buildPlayerSide() {
    petNameToSlot = {};
    var slots = GameState.getActivePets();

    // slot 0, 1 = front row  /  slot 2 = back row
    var frontHtml = [0, 1].map(function (i) {
      var p = slots[i];
      if (!p) {
        return '<div class="bc player-bc empty-bc" id="bc-p-' + i + '" onclick="BattleView.openSlotMenu(' + i + ')">' +
                 '<div class="bc-icon add-icon">＋</div>' +
                 '<div class="bc-label">空位</div>' +
               '</div>';
      }
      var stats  = PetSystem.getStats(p);
      var qColor = PetSystem.getQualityColor(stats.quality);
      petNameToSlot[stats.name] = i;
      return '<div class="bc player-bc" id="bc-p-' + i + '" onclick="BattleView.openSlotMenu(' + i + ')" data-pname="' + stats.name + '">' +
               '<div class="bc-icon">' + stats.icon + '</div>' +
               '<div class="bc-label" style="color:' + qColor + '">' + stats.name + '<br>' +
                 '<span class="bc-lv">Lv.' + p.level + ' ' + '★'.repeat(p.stars) + '</span></div>' +
               hpHtml(stats.maxHp, stats.maxHp) +
             '</div>';
    }).join('');

    var p2     = slots[2];
    var back2;
    if (!p2) {
      back2 = '<div class="bc player-bc empty-bc" id="bc-p-2" onclick="BattleView.openSlotMenu(2)">' +
                '<div class="bc-icon add-icon">＋</div>' +
                '<div class="bc-label">空位</div>' +
              '</div>';
    } else {
      var st2  = PetSystem.getStats(p2);
      var qc2  = PetSystem.getQualityColor(st2.quality);
      petNameToSlot[st2.name] = 2;
      back2 = '<div class="bc player-bc" id="bc-p-2" onclick="BattleView.openSlotMenu(2)" data-pname="' + st2.name + '">' +
                '<div class="bc-icon">' + st2.icon + '</div>' +
                '<div class="bc-label" style="color:' + qc2 + '">' + st2.name + '<br>' +
                  '<span class="bc-lv">Lv.' + p2.level + ' ' + '★'.repeat(p2.stars) + '</span></div>' +
                hpHtml(st2.maxHp, st2.maxHp) +
              '</div>';
    }

    return '<div class="form-back-col">' +
             '<div class="row-tag player-tag">後排</div>' +
             back2 +
           '</div>' +
           '<div class="form-front-col">' +
             '<div class="row-tag player-tag">前排</div>' +
             frontHtml +
           '</div>';
  }

  /* ─── Visual helpers ─── */

  function getPetEl(name) {
    var i = petNameToSlot[name];
    return i !== undefined ? document.getElementById('bc-p-' + i) : null;
  }

  function getEnemyEl(id) {
    return document.getElementById('bc-' + id);
  }

  function updateHp(el, hp, maxHp) {
    if (!el) return;
    var pct   = maxHp > 0 ? Math.max(0, hp / maxHp * 100) : 0;
    var color = pct > 50 ? '#00e676' : pct > 25 ? '#ffab00' : '#ff5252';
    var bar   = el.querySelector('.bc-hpbar');
    var txt   = el.querySelector('.bc-hptext');
    if (bar) { bar.style.width = pct + '%'; bar.style.background = color; }
    if (txt)  txt.textContent = Math.max(0, Math.floor(hp)) + ' / ' + maxHp;
    if (hp <= 0) el.classList.add('bc-dead');
  }

  function floatNum(el, num, cls) {
    if (!el) return;
    var d = document.createElement('div');
    d.className = 'dmg-float ' + (cls || 'df-dmg');
    d.textContent = cls === 'df-heal' ? '+' + num : '-' + num;
    el.appendChild(d);
    setTimeout(function () { if (d.parentNode) d.remove(); }, 1100);
  }

  function runAnim(el, cls, dur, cb) {
    if (!el) { if (cb) cb(); return; }
    el.classList.add(cls);
    setTimeout(function () { el.classList.remove(cls); if (cb) cb(); }, dur || 400);
  }

  function setStatus(html) {
    var el = document.getElementById('bc-status');
    if (el) el.innerHTML = html;
  }

  /* ─── Log entry → animation ─── */

  function processEntry(entry) {
    var pEl, eEl;

    switch (entry.type) {

      case 'start':
        setStatus('⚔️ 戰鬥開始！');
        return 500;

      case 'round':
        setStatus('─ 第 ' + entry.round + ' 回合 ─');
        return 200;

      case 'attack':
        pEl = getPetEl(entry.pet);
        eEl = getEnemyEl(entry.targetId);
        setStatus('<b>' + entry.pet + '</b> 攻擊 ▶ <b>' + entry.target + '</b>');
        runAnim(pEl, 'bc-atk-right', 380, function () {
          runAnim(eEl, 'bc-hit', 350, null);
          floatNum(eEl, entry.dmg, 'df-dmg');
          updateHp(eEl, entry.hp, entry.maxHp);
        });
        return 620;

      case 'skill':
        pEl = getPetEl(entry.pet);
        eEl = getEnemyEl(entry.targetId);
        setStatus('✨ <b>' + entry.pet + '</b>【' + entry.skill + '】▶ <b>' + entry.target + '</b>');
        runAnim(pEl, 'bc-skill-glow', 200, function () {
          runAnim(pEl, 'bc-atk-right', 380, function () {
            runAnim(eEl, 'bc-hit', 350, null);
            floatNum(eEl, entry.dmg, 'df-skill');
            updateHp(eEl, entry.hp, entry.maxHp);
          });
        });
        return 820;

      case 'skill_all':
        pEl = getPetEl(entry.pet);
        setStatus('🌟 <b>' + entry.pet + '</b>【' + entry.skill + '】全體攻擊！');
        runAnim(pEl, 'bc-skill-glow', 280, function () {
          entry.hits.forEach(function (h, hi) {
            setTimeout(function () {
              var hEl = getEnemyEl(h.targetId);
              runAnim(hEl, 'bc-hit', 350, null);
              floatNum(hEl, h.dmg, 'df-skill');
              updateHp(hEl, h.hp, h.maxHp);
            }, hi * 140);
          });
        });
        return 820;

      case 'heal':
        pEl = getPetEl(entry.pet);
        setStatus('💚 <b>' + entry.pet + '</b>【' + entry.skill + '】回復 HP！');
        runAnim(pEl, 'bc-heal-glow', 600, null);
        floatNum(pEl, entry.amount, 'df-heal');
        updateHp(pEl, entry.hp, entry.maxHp);
        return 700;

      case 'buff':
        pEl = getPetEl(entry.pet);
        setStatus('⚡ <b>' + entry.pet + '</b> 發動【' + entry.skill + '】！');
        runAnim(pEl, 'bc-skill-glow', 600, null);
        return 600;

      case 'enemy_attack':
        eEl = getEnemyEl(entry.enemyId);
        pEl = getPetEl(entry.target);
        setStatus('💥 <b>' + entry.enemy + '</b> 攻擊 <b>' + entry.target + '</b>！');
        runAnim(eEl, 'bc-atk-left', 380, function () {
          runAnim(pEl, 'bc-hit', 350, null);
          floatNum(pEl, entry.dmg, 'df-edm');
          updateHp(pEl, entry.hp, entry.maxHp);
        });
        return 620;

      case 'win':
        setStatus('<span class="st-win">🎉 勝利！</span>');
        runAnim(document.getElementById('battle-arena'), 'arena-victory', 900, null);
        return 900;

      case 'lose':
        setStatus('<span class="st-lose">💀 戰鬥失敗...</span>');
        return 800;

      case 'msg':
        setStatus(entry.text);
        return 500;

      default:
        return 100;
    }
  }

  /* ─── Battle loop ─── */

  function animateBattle() {
    if (!battleResult || logIndex >= battleResult.log.length) {
      isBattling = false;
      finishBattle();
      return;
    }
    var entry = battleResult.log[logIndex++];
    var delay = processEntry(entry);
    animTimer = setTimeout(animateBattle, delay / battleSpeed);
  }

  /* ─── Result ─── */

  function finishBattle() {
    var overlay = document.getElementById('battle-result-overlay');
    if (!overlay) return;

    // 隱藏逃跑按鈕，顯示出戰按鈕
    var btn = document.getElementById('btn-fight');
    var fleeBtn = document.getElementById('btn-flee');
    if (btn) { btn.disabled = false; btn.textContent = '⚔️ 出戰'; btn.style.display = 'block'; }
    if (fleeBtn) fleeBtn.style.display = 'none';

    if (battleResult.win) {
      var r = battleResult.rewards;
      BattleEngine.applyRewards(r);
      GameState.unlockStage(GameState.get().currentStage + 1);

      var itemText = (r.items || []).map(function (it) {
        return ITEM_DATA[it.id] ? ITEM_DATA[it.id].name + ' ×' + it.count : '';
      }).filter(Boolean).join('、');

      var statsHtml = BattleStats.generateReport();

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
          '<button class="btn-primary" onclick="BattleView.closeResult(true)">下一關</button>' +
          '<button class="btn-secondary" onclick="BattleView.closeResult(false)">返回</button>' +
        '</div></div>';
    } else {
      var statsHtml2 = BattleStats.generateReport();
      overlay.innerHTML =
        '<div class="result-box lose"><div class="result-title">💀 失敗</div>' +
        '<div class="result-sub">強化寵物後再試！</div>' +
        statsHtml2 +
        '<button class="btn-primary" onclick="BattleView.closeResult(false)">重試</button></div>';
    }
    overlay.style.display = 'flex';
    updateHUD();
  }

  /* ─── Public ─── */
  return {

    render: function () {
      var state  = GameState.get();
      var currentAp = GameState.getAP();
      var stage  = state.currentStage;
      var isBoss = stage % 10 === 0;
      var cfg    = getStageConfig(stage);
      var el     = document.getElementById('screen-battle');

      el.innerHTML =
        '<div class="battle-topbar">' +
          '<span class="stage-num">第 ' + stage + ' 關' + (isBoss ? ' 🔥 BOSS' : '') + '</span>' +
          '<div class="stage-nav">' +
            (stage > 1              ? '<button class="btn-sm" onclick="BattleView.changeStage(-1)">◀</button>' : '<span></span>') +
            (stage < state.maxStage ? '<button class="btn-sm" onclick="BattleView.changeStage(1)">▶</button>'  : '<span></span>') +
          '</div>' +
        '</div>' +

        '<div class="battle-mode-bar">' +
          '<span>AP: ' + currentAp + '/' + state.maxAp + ' (需要 10)</span>' +
          '<div class="mode-controls">' +
            '<button class="btn-mode ' + (battleMode === 'auto' ? 'active' : '') + '" onclick="BattleView.toggleMode()" title="' + (battleMode === 'auto' ? '自動戰鬥' : '手動模式：鑽石掉落+10%') + '">模式: ' + (battleMode === 'auto' ? '自動' : '手動💎+10%') + '</button>' +
            '<div class="speed-btns">' +
              '<button class="btn-speed-sm ' + (battleSpeed === 1 ? 'active' : '') + '" onclick="BattleView.setSpeed(1)">1x</button>' +
              '<button class="btn-speed-sm ' + (battleSpeed === 2 ? 'active' : '') + '" onclick="BattleView.setSpeed(2)">2x</button>' +
              '<button class="btn-speed-sm ' + (battleSpeed === 4 ? 'active' : '') + '" onclick="BattleView.setSpeed(4)">4x</button>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div class="battle-arena" id="battle-arena">' +
          /* 左：我方 */
          '<div class="formation player-formation">' +
            '<div class="formation-title player-title">我方</div>' +
            '<div class="formation-inner">' + buildPlayerSide() + '</div>' +
          '</div>' +
          /* 中：分隔 */
          '<div class="vs-divider"><span>⚔️</span></div>' +
          /* 右：敵方 */
          '<div class="formation enemy-formation">' +
            '<div class="formation-title enemy-title">敵方</div>' +
            '<div class="formation-inner">' + buildEnemySide(cfg) + '</div>' +
          '</div>' +
        '</div>' +

        '<div class="bc-status-bar"><div id="bc-status" class="bc-status">點擊寵物可更換，準備好後出戰！</div></div>' +

        '<div class="fight-wrap">' +
          '<button class="btn-fight" id="btn-fight" onclick="BattleView.startFight()">⚔️ 出戰</button>' +
          '<button class="btn-flee" id="btn-flee" onclick="BattleView.flee()" style="display:none">🏃 逃跑</button>' +
        '</div>' +

        '<div id="battle-result-overlay" class="result-overlay" style="display:none"></div>' +
        '<div id="slot-menu" class="slot-menu" style="display:none"></div>';
    },

    changeStage: function (dir) {
      var state = GameState.get();
      var n = state.currentStage + dir;
      if (n < 1 || n > state.maxStage) return;
      state.currentStage = n;
      GameState.save();
      this.render();
    },

    startFight: function () {
      if (isBattling) return;
      if (animTimer) clearTimeout(animTimer);

      var state = GameState.get();

      // 手動模式
      if (battleMode === 'manual') {
        isBattling = true;
        document.getElementById('battle-result-overlay').style.display = 'none';
        var btn = document.getElementById('btn-fight');
        var fleeBtn = document.getElementById('btn-flee');
        if (btn) btn.style.display = 'none';
        if (fleeBtn) fleeBtn.style.display = 'block';

        ManualBattle.start(state.currentStage);
        return;
      }

      // 自動模式
      isBattling   = true;
      logIndex     = 0;
      battleResult = BattleEngine.simulate(GameState.get().currentStage, false);
      document.getElementById('battle-result-overlay').style.display = 'none';
      var btn = document.getElementById('btn-fight');
      var fleeBtn = document.getElementById('btn-flee');
      if (btn) { btn.disabled = true; btn.textContent = '戰鬥中...'; btn.style.display = 'none'; }
      if (fleeBtn) fleeBtn.style.display = 'block';
      animateBattle();
    },

    flee: function () {
      if (!isBattling) return;
      if (animTimer) clearTimeout(animTimer);

      // 清空戰鬥狀態
      isBattling = false;
      battleResult = null;
      logIndex = 0;

      // 清空手動戰鬥狀態
      BattleState.clear();

      // 隱藏結果覆蓋層和槽位選單
      var overlay = document.getElementById('battle-result-overlay');
      var slotMenu = document.getElementById('slot-menu');
      if (overlay) overlay.style.display = 'none';
      if (slotMenu) slotMenu.style.display = 'none';

      setStatus('💨 已逃跑！AP 退還 5 點');
      GameState.addAP(5); // 退還一半 AP
      updateHUD();

      setTimeout(function () {
        var btn = document.getElementById('btn-fight');
        var fleeBtn = document.getElementById('btn-flee');
        if (btn) { btn.disabled = false; btn.textContent = '⚔️ 出戰'; btn.style.display = 'block'; }
        if (fleeBtn) fleeBtn.style.display = 'none';
        BattleView.render();
      }, 1000);
    },

    toggleMode: function () {
      battleMode = battleMode === 'auto' ? 'manual' : 'auto';
      this.render();
    },

    setSpeed: function (speed) {
      battleSpeed = speed;
      this.render();
    },

    closeResult: function (advance) {
      document.getElementById('battle-result-overlay').style.display = 'none';
      if (advance && battleResult && battleResult.win) {
        var state = GameState.get();
        if (state.currentStage < 100) {
          state.currentStage = Math.min(state.maxStage, state.currentStage + 1);
          GameState.save();
        }
      }
      battleResult = null;
      this.render();
    },

    openSlotMenu: function (slot) {
      if (isBattling) return;
      var menu  = document.getElementById('slot-menu');
      var state = GameState.get();
      var label = slot < 2 ? '前排槽位 ' + (slot + 1) : '後排槽位';

      var html = '<div class="slot-menu-inner">' +
                 '<div class="slot-menu-title">選擇寵物（' + label + '）</div>' +
                 '<div class="slot-pet-list">';

      state.inventory.forEach(function (p) {
        var stats  = PetSystem.getStats(p);
        var qColor = PetSystem.getQualityColor(stats.quality);
        var curr   = p.isActive && p.activeSlot === slot  ? ' current'  : '';
        var other  = p.isActive && p.activeSlot !== slot  ? ' in-other' : '';
        html += '<div class="slot-pet-item' + curr + other + '" onclick="BattleView.assignSlot(\'' + p.uuid + '\',' + slot + ')">' +
                  '<span class="spi-icon">' + stats.icon + '</span>' +
                  '<span class="spi-name" style="color:' + qColor + '">' + stats.name + '</span>' +
                  '<span class="spi-lv">Lv.' + p.level + '</span>' +
                '</div>';
      });

      html += '</div>' +
              '<button class="btn-secondary btn-sm" style="margin-bottom:6px" onclick="BattleView.assignSlot(null,' + slot + ')">清空此槽</button>' +
              '<button class="btn-close-menu" onclick="document.getElementById(\'slot-menu\').style.display=\'none\'">關閉</button>' +
              '</div>';

      menu.innerHTML = html;
      menu.style.display = 'flex';
    },

    assignSlot: function (uuid, slot) {
      GameState.setActiveSlot(uuid, slot);
      document.getElementById('slot-menu').style.display = 'none';
      this.render();
    }
  };
})();
