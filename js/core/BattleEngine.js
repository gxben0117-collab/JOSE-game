var BattleEngine = (function () {

  function elementBonus(attackerEl, defenderEl) {
    var cfg = ELEMENT_CONFIG[attackerEl];
    if (!cfg) return 1.0;
    if (cfg.strong === defenderEl) return 1.3;
    if (cfg.weak   === defenderEl) return 0.7;
    return 1.0;
  }

  function calcDamage(atk, def, mult, elBonus) {
    var raw  = Math.max(1, atk * (mult || 1) - def * 0.4);
    var vary = 0.9 + Math.random() * 0.2;
    return Math.floor(raw * vary * (elBonus || 1));
  }

  function buildCombatant(petInst) {
    var stats = PetSystem.getStats(petInst);
    return {
      uuid:      petInst.uuid,
      petId:     petInst.petId,
      name:      stats.name,
      icon:      stats.icon,
      element:   stats.element,
      quality:   stats.quality,
      skills:    stats.skills,
      maxHp:     stats.maxHp,
      hp:        stats.maxHp,
      atk:       stats.atk,
      def:       stats.def,
      cooldowns: stats.skills.map(function (s) { return s.type === 'active' ? 0 : -1; }),
      isPlayer:  true
    };
  }

  function buildEnemy(def) {
    return {
      id:      def.id,
      name:    def.name,
      icon:    def.icon,
      element: def.element || 'none',
      level:   def.level,
      maxHp:   def.maxHp,
      hp:      def.maxHp,
      atk:     def.atk,
      def:     def.def,
      isBoss:  def.isBoss || false,
      isPlayer: false
    };
  }

  function applyPassives(team) {
    team.forEach(function (c) {
      if (!c || !c.skills) return;
      c.skills.forEach(function (sk) {
        if (sk.type !== 'passive') return;
        if (sk.effect === 'atk_boost')  c.atk   = Math.floor(c.atk   * (1 + sk.value));
        if (sk.effect === 'def_boost')  c.def   = Math.floor(c.def   * (1 + sk.value));
        if (sk.effect === 'hp_boost')  { c.maxHp = Math.floor(c.maxHp * (1 + sk.value)); c.hp = c.maxHp; }
        if (sk.effect === 'all_boost') {
          c.atk  = Math.floor(c.atk  * (1 + sk.value));
          c.def  = Math.floor(c.def  * (1 + sk.value));
          c.maxHp= Math.floor(c.maxHp* (1 + sk.value));
          c.hp   = c.maxHp;
        }
      });
    });
  }

  /* 敵方目標：前排先，前排全滅才打後排 */
  function pickEnemyTarget(front, back) {
    var t = front.find(function (e) { return e.hp > 0; });
    if (t) return t;
    return back.find(function (e) { return e.hp > 0; }) || null;
  }

  /* 我方目標（敵人攻擊）：前排槽位0~3先；全滅才打後排槽位4,5 */
  function pickPlayerTarget(team) {
    var front = team.filter(function (p, i) { return i < 4 && p && p.hp > 0; });
    if (front.length > 0) return front[Math.floor(Math.random() * front.length)];
    var back = team.filter(function (p, i) { return i >= 4 && p && p.hp > 0; });
    if (back.length > 0) return back[Math.floor(Math.random() * back.length)];
    return null;
  }

  function allDead(arr) {
    return arr.every(function (e) { return e.hp <= 0; });
  }

  return {
    // 暴露給 BattleState 使用
    buildCombatant: buildCombatant,
    buildEnemy: buildEnemy,
    applyPassives: applyPassives,
    pickPlayerTarget: pickPlayerTarget,
    pickEnemyTarget: pickEnemyTarget,
    calcDamage: calcDamage,
    elementBonus: elementBonus,
    allDead: allDead,

    // 執行單個寵物行動
    executePetAction: function (pet, target, skillIndex, enemyFront, enemyBack) {
      if (!pet || pet.hp <= 0) return null;

      var usedSkill = false;
      var result = null;

      // 使用技能
      if (skillIndex !== undefined && skillIndex >= 0 && pet.skills && pet.skills[skillIndex]) {
        var sk = pet.skills[skillIndex];
        if (sk.type === 'active' && pet.cooldowns[skillIndex] <= 0) {
          pet.cooldowns[skillIndex] = sk.cooldown;

          if (sk.effect === 'damage_all') {
            var hits = [];
            enemyFront.concat(enemyBack).forEach(function (e) {
              if (e.hp <= 0) return;
              var bon = elementBonus(pet.element, e.element);
              var dmg = calcDamage(pet.atk, e.def, sk.multiplier, bon);
              e.hp = Math.max(0, e.hp - dmg);
              BattleStats.recordDamageDealt(dmg);
              if (e.hp === 0) BattleStats.recordKill();
              hits.push({ targetId: e.id, name: e.name, dmg: dmg, hp: e.hp, maxHp: e.maxHp });
            });
            result = { type: 'skill_all', pet: pet.name, icon: pet.icon, skill: sk.name, hits: hits };
            BattleStats.recordSkillUsed();

          } else if (sk.effect === 'heal' || sk.effect === 'heal_all') {
            var healed = Math.floor(pet.maxHp * sk.value);
            pet.hp = Math.min(pet.maxHp, pet.hp + healed);
            result = { type: 'heal', pet: pet.name, icon: pet.icon, skill: sk.name, amount: healed, hp: pet.hp, maxHp: pet.maxHp };
            BattleStats.recordSkillUsed();

          } else if (sk.multiplier) {
            var bon2 = elementBonus(pet.element, target.element);
            var dmg2 = calcDamage(pet.atk, target.def, sk.multiplier, bon2);
            target.hp = Math.max(0, target.hp - dmg2);
            BattleStats.recordDamageDealt(dmg2);
            if (target.hp === 0) BattleStats.recordKill();
            result = { type: 'skill', pet: pet.name, icon: pet.icon, skill: sk.name, targetId: target.id, target: target.name, dmg: dmg2, hp: target.hp, maxHp: target.maxHp };
            BattleStats.recordSkillUsed();

          } else {
            result = { type: 'buff', pet: pet.name, icon: pet.icon, skill: sk.name };
            BattleStats.recordSkillUsed();
          }
          usedSkill = true;
        }
      }

      // 普通攻擊
      if (!usedSkill) {
        if (!target) {
          target = pickEnemyTarget(enemyFront, enemyBack);
        }
        if (!target) return null;

        var bon3 = elementBonus(pet.element, target.element);
        var basic = pet.skills ? pet.skills.find(function (s) { return s.type === 'basic'; }) : null;
        var mult3 = basic ? basic.multiplier : 1.0;
        var dmg3 = calcDamage(pet.atk, target.def, mult3, bon3);
        target.hp = Math.max(0, target.hp - dmg3);
        BattleStats.recordDamageDealt(dmg3);
        if (target.hp === 0) BattleStats.recordKill();
        result = { type: 'attack', pet: pet.name, icon: pet.icon, targetId: target.id, target: target.name, dmg: dmg3, hp: target.hp, maxHp: target.maxHp };
      }

      return result;
    },

    simulate: function (stageNum, isManualMode) {
      var state    = GameState.get();

      // 初始化統計
      BattleStats.init();

      // 檢查 AP
      if (!GameState.spendAP(10)) {
        return { win: false, log: [{ type: 'msg', text: 'AP 不足！需要 10 AP 才能戰鬥' }], rewards: null };
      }

      var cfg      = getStageConfig(stageNum);
      var rawPets  = GameState.getActivePets(); // [slot0, slot1, slot2], may have null

      if (!rawPets.some(Boolean)) {
        GameState.addAP(10); // 退還 AP
        return { win: false, log: [{ type: 'msg', text: '請先設定上陣寵物！' }], rewards: null };
      }

      // Build team (keep nulls to preserve slot index for front/back targeting)
      var playerTeam = rawPets.map(function (p) { return p ? buildCombatant(p) : null; });
      var enemyFront = cfg.frontRow.map(buildEnemy);
      var enemyBack  = cfg.backRow.map(buildEnemy);

      applyPassives(playerTeam.filter(Boolean));

      var log = [];
      log.push({ type: 'start', stageName: '第' + stageNum + '關' + (cfg.isBoss ? ' ★BOSS' : ''), isBoss: cfg.isBoss });

      var MAX_ROUNDS = 60;

      for (var round = 1; round <= MAX_ROUNDS; round++) {
        log.push({ type: 'round', round: round });
        BattleStats.setRoundCount(round);

        /* ─── 玩家攻擊 ─── */
        playerTeam.forEach(function (pet) {
          if (!pet || pet.hp <= 0) return;
          var target = pickEnemyTarget(enemyFront, enemyBack);
          if (!target) return;

          var usedSkill = false;

          if (pet.skills) {
            for (var i = 0; i < pet.skills.length; i++) {
              var sk = pet.skills[i];
              if (sk.type !== 'active') continue;

              if (pet.cooldowns[i] <= 0) {
                pet.cooldowns[i] = sk.cooldown;

                if (sk.effect === 'damage_all') {
                  var hits = [];
                  enemyFront.concat(enemyBack).forEach(function (e) {
                    if (e.hp <= 0) return;
                    var bon = elementBonus(pet.element, e.element);
                    var dmg = calcDamage(pet.atk, e.def, sk.multiplier, bon);
                    e.hp = Math.max(0, e.hp - dmg);
                    BattleStats.recordDamageDealt(dmg);
                    if (e.hp === 0) BattleStats.recordKill();
                    hits.push({ targetId: e.id, name: e.name, dmg: dmg, hp: e.hp, maxHp: e.maxHp });
                  });
                  log.push({ type: 'skill_all', pet: pet.name, icon: pet.icon, skill: sk.name, hits: hits });
                  BattleStats.recordSkillUsed();

                } else if (sk.effect === 'heal' || sk.effect === 'heal_all') {
                  var healed = Math.floor(pet.maxHp * sk.value);
                  pet.hp = Math.min(pet.maxHp, pet.hp + healed);
                  log.push({ type: 'heal', pet: pet.name, icon: pet.icon, skill: sk.name, amount: healed, hp: pet.hp, maxHp: pet.maxHp });

                } else if (sk.multiplier) {
                  var bon2 = elementBonus(pet.element, target.element);
                  var dmg2 = calcDamage(pet.atk, target.def, sk.multiplier, bon2);
                  target.hp = Math.max(0, target.hp - dmg2);
                  BattleStats.recordDamageDealt(dmg2);
                  if (target.hp === 0) BattleStats.recordKill();
                  log.push({ type: 'skill', pet: pet.name, icon: pet.icon, skill: sk.name, targetId: target.id, target: target.name, dmg: dmg2, hp: target.hp, maxHp: target.maxHp });
                  BattleStats.recordSkillUsed();

                } else {
                  log.push({ type: 'buff', pet: pet.name, icon: pet.icon, skill: sk.name });
                }
                usedSkill = true;
                break;

              } else {
                pet.cooldowns[i]--;
              }
            }
          }

          if (!usedSkill) {
            var t2    = pickEnemyTarget(enemyFront, enemyBack);
            if (!t2) return;
            var bon3  = elementBonus(pet.element, t2.element);
            var basic = pet.skills ? pet.skills.find(function (s) { return s.type === 'basic'; }) : null;
            var mult3 = basic ? basic.multiplier : 1.0;
            var dmg3  = calcDamage(pet.atk, t2.def, mult3, bon3);
            t2.hp = Math.max(0, t2.hp - dmg3);
            BattleStats.recordDamageDealt(dmg3);
            if (t2.hp === 0) BattleStats.recordKill();
            log.push({ type: 'attack', pet: pet.name, icon: pet.icon, targetId: t2.id, target: t2.name, dmg: dmg3, hp: t2.hp, maxHp: t2.maxHp });
          }
        });

        /* 判斷勝利 */
        if (allDead(enemyFront) && allDead(enemyBack)) {
          var rewards = getStageReward(stageNum, cfg.isBoss);
          // 手動模式鑽石掉落率提升 10%
          if (isManualMode && rewards.diamond) {
            rewards.diamond = Math.floor(rewards.diamond * 1.1);
          }
          log.push({ type: 'win', rewards: rewards });
          return { win: true, log: log, rewards: rewards };
        }

        /* ─── 敵人攻擊（前排先出手，後排跟上） ─── */
        enemyFront.concat(enemyBack).forEach(function (enemy) {
          if (enemy.hp <= 0) return;
          var pt = pickPlayerTarget(playerTeam);
          if (!pt) return;
          var dmgE = calcDamage(enemy.atk, pt.def, 1.0, 1.0);
          pt.hp = Math.max(0, pt.hp - dmgE);
          BattleStats.recordDamageTaken(dmgE);
          log.push({ type: 'enemy_attack', enemyId: enemy.id, enemy: enemy.name, icon: enemy.icon, target: pt.name, dmg: dmgE, hp: pt.hp, maxHp: pt.maxHp });
        });

        /* 判斷失敗 */
        if (playerTeam.every(function (p) { return !p || p.hp <= 0; })) {
          log.push({ type: 'lose' });
          return { win: false, log: log, rewards: null };
        }
      }

      log.push({ type: 'lose' });
      return { win: false, log: log, rewards: null };
    },

    applyRewards: function (rewards) {
      if (!rewards) return;
      GameState.addGold(rewards.gold);
      GameState.addDiamond(rewards.diamond);
      if (rewards.tickets) GameState.addItem('gacha_ticket', rewards.tickets);
      (rewards.items || []).forEach(function (drop) {
        GameState.addItem(drop.id, drop.count);
      });

      // 召喚師獲得經驗
      var playerLeveled = GameState.addPlayerExp(rewards.exp);
      if (playerLeveled) {
        showToast('🎉 召喚師升級！AP 上限 +1 並已補滿');
      }

      // 寵物獲得經驗
      GameState.getActivePets().filter(Boolean).forEach(function (p) {
        PetSystem.addExp(p, rewards.exp);
      });
    }
  };
})();
