var BattleEngine = (function () {

  function elementBonus(attackerEl, defenderEl) {
    var cfg = ELEMENT_CONFIG[attackerEl];
    if (!cfg) return BATTLE_CONFIG.ELEMENT_BONUS.NORMAL;
    if (cfg.strong === defenderEl) return BATTLE_CONFIG.ELEMENT_BONUS.STRONG;
    if (cfg.weak   === defenderEl) return BATTLE_CONFIG.ELEMENT_BONUS.WEAK;
    return BATTLE_CONFIG.ELEMENT_BONUS.NORMAL;
  }

  function calcDamage(atk, def, mult, elBonus) {
    var raw  = Math.max(
      BATTLE_CONFIG.DAMAGE.MIN_DAMAGE,
      atk * (mult || 1) - def * BATTLE_CONFIG.DAMAGE.DEF_REDUCTION
    );
    var vary = BATTLE_CONFIG.DAMAGE.VARIANCE_MIN +
               Math.random() * (BATTLE_CONFIG.DAMAGE.VARIANCE_MAX - BATTLE_CONFIG.DAMAGE.VARIANCE_MIN);
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
      buffs:     [],  // 儲存 buff 效果 {type, value, duration}
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

  /* 我方目標（敵人攻擊）：使用 AI 策略 */
  function pickPlayerTarget(team) {
    var alive = team.filter(function (p) { return p && p.hp > 0; });
    if (alive.length === 0) return null;

    var rand = Math.random();

    // 50% 攻擊低血量目標
    if (rand < BATTLE_CONFIG.AI_WEIGHTS.TARGET_LOW_HP) {
      alive.sort(function (a, b) { return (a.hp / a.maxHp) - (b.hp / b.maxHp); });
      return alive[0];
    }

    // 30% 攻擊高攻擊力目標
    if (rand < BATTLE_CONFIG.AI_WEIGHTS.TARGET_LOW_HP + BATTLE_CONFIG.AI_WEIGHTS.TARGET_HIGH_ATK) {
      alive.sort(function (a, b) { return b.atk - a.atk; });
      return alive[0];
    }

    // 20% 隨機攻擊
    return alive[Math.floor(Math.random() * alive.length)];
  }

  function allDead(arr) {
    return arr.every(function (e) { return e.hp <= 0; });
  }

  // 處理冷卻時間遞減（統一在回合結束時調用）
  function decrementCooldowns(team) {
    team.forEach(function (pet) {
      if (!pet || pet.hp <= 0) return;
      if (!pet.cooldowns) return;

      for (var i = 0; i < pet.cooldowns.length; i++) {
        if (pet.cooldowns[i] > 0) {
          pet.cooldowns[i]--;
        }
      }
    });
  }

  // 處理 Buff 持續時間遞減
  function decrementBuffs(team) {
    team.forEach(function (pet) {
      if (!pet || !pet.buffs) return;

      pet.buffs = pet.buffs.filter(function (buff) {
        buff.duration--;
        return buff.duration > 0;
      });
    });
  }

  // 計算帶 Buff 的實際屬性
  function getEffectiveAtk(pet) {
    var atk = pet.atk;
    if (!pet.buffs) return atk;

    pet.buffs.forEach(function (buff) {
      if (buff.type === 'atk_boost') {
        atk = Math.floor(atk * (1 + buff.value));
      }
    });
    return atk;
  }

  function getEffectiveDef(pet) {
    var def = pet.def;
    if (!pet.buffs) return def;

    pet.buffs.forEach(function (buff) {
      if (buff.type === 'shield') {
        def = Math.floor(def * (1 + buff.value));
      }
    });
    return def;
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
    decrementCooldowns: decrementCooldowns,
    decrementBuffs: decrementBuffs,
    getEffectiveAtk: getEffectiveAtk,
    getEffectiveDef: getEffectiveDef,

    // 執行單個寵物行動
    executePetAction: function (pet, target, skillIndex, enemyFront, enemyBack, playerTeam) {
      if (!pet || pet.hp <= 0) return null;

      var usedSkill = false;
      var result = null;

      // 使用技能
      if (skillIndex !== undefined && skillIndex >= 0 && pet.skills && pet.skills[skillIndex]) {
        var sk = pet.skills[skillIndex];
        if (sk.type === 'active' && pet.cooldowns[skillIndex] <= 0) {
          pet.cooldowns[skillIndex] = sk.cooldown;

          // 全體傷害技能
          if (sk.effect === 'damage_all') {
            var hits = [];
            enemyFront.concat(enemyBack).forEach(function (e) {
              if (e.hp <= 0) return;
              var bon = elementBonus(pet.element, e.element);
              var effectiveAtk = getEffectiveAtk(pet);
              var dmg = calcDamage(effectiveAtk, e.def, sk.multiplier, bon);
              e.hp = Math.max(0, e.hp - dmg);
              BattleStats.recordDamageDealt(dmg);
              if (e.hp === 0) BattleStats.recordKill();
              hits.push({ targetId: e.id, name: e.name, dmg: dmg, hp: e.hp, maxHp: e.maxHp });
            });
            result = { type: 'skill_all', pet: pet.name, icon: pet.icon, skill: sk.name, hits: hits };
            BattleStats.recordSkillUsed();

          // 單體治療
          } else if (sk.effect === 'heal') {
            var healed = Math.floor(pet.maxHp * sk.value);
            pet.hp = Math.min(pet.maxHp, pet.hp + healed);
            result = { type: 'heal', pet: pet.name, icon: pet.icon, skill: sk.name, amount: healed, hp: pet.hp, maxHp: pet.maxHp };
            BattleStats.recordSkillUsed();

          // 全體治療
          } else if (sk.effect === 'heal_all') {
            var heals = [];
            (playerTeam || []).forEach(function (p) {
              if (!p || p.hp <= 0) return;
              var healAmount = Math.floor(p.maxHp * sk.value);
              p.hp = Math.min(p.maxHp, p.hp + healAmount);
              heals.push({ name: p.name, amount: healAmount, hp: p.hp, maxHp: p.maxHp });
            });
            result = { type: 'heal_all', pet: pet.name, icon: pet.icon, skill: sk.name, heals: heals };
            BattleStats.recordSkillUsed();

          // 攻擊力提升 Buff
          } else if (sk.effect === 'buff_atk') {
            if (!pet.buffs) pet.buffs = [];
            pet.buffs.push({
              type: 'atk_boost',
              value: sk.value,
              duration: BATTLE_CONFIG.BUFF_DURATION.DEFAULT
            });
            result = { type: 'buff', pet: pet.name, icon: pet.icon, skill: sk.name, buffType: 'atk_boost' };
            BattleStats.recordSkillUsed();

          // 護盾 Buff
          } else if (sk.effect === 'shield') {
            if (!pet.buffs) pet.buffs = [];
            pet.buffs.push({
              type: 'shield',
              value: sk.value,
              duration: BATTLE_CONFIG.BUFF_DURATION.SHIELD
            });
            result = { type: 'buff', pet: pet.name, icon: pet.icon, skill: sk.name, buffType: 'shield' };
            BattleStats.recordSkillUsed();

          // 單體傷害技能
          } else if (sk.multiplier) {
            if (!target) {
              showToast('請先選擇目標！');
              return null;
            }
            var bon2 = elementBonus(pet.element, target.element);
            var effectiveAtk2 = getEffectiveAtk(pet);
            var dmg2 = calcDamage(effectiveAtk2, target.def, sk.multiplier, bon2);
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
        var effectiveAtk3 = getEffectiveAtk(pet);
        var dmg3 = calcDamage(effectiveAtk3, target.def, mult3, bon3);
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
      if (!GameState.spendAP(BATTLE_CONFIG.AP_COST)) {
        return { win: false, log: [{ type: 'msg', text: 'AP 不足！需要 ' + BATTLE_CONFIG.AP_COST + ' AP 才能戰鬥' }], rewards: null };
      }

      var cfg = getStageConfig(stageNum);
      if (!cfg) {
        GameState.addAP(BATTLE_CONFIG.AP_COST);
        return { win: false, log: [{ type: 'msg', text: '關卡配置錯誤！' }], rewards: null };
      }

      var rawPets  = GameState.getActivePets();

      if (!rawPets.some(Boolean)) {
        GameState.addAP(BATTLE_CONFIG.AP_COST);
        return { win: false, log: [{ type: 'msg', text: '請先設定上陣寵物！' }], rewards: null };
      }

      // Build team (keep nulls to preserve slot index for front/back targeting)
      var playerTeam = rawPets.map(function (p) { return p ? buildCombatant(p) : null; });
      var enemyFront = cfg.frontRow.map(buildEnemy);
      var enemyBack  = cfg.backRow.map(buildEnemy);

      applyPassives(playerTeam.filter(Boolean));

      var log = [];
      log.push({ type: 'start', stageName: '第' + stageNum + '關' + (cfg.isBoss ? ' ★BOSS' : ''), isBoss: cfg.isBoss });

      for (var round = 1; round <= BATTLE_CONFIG.MAX_ROUNDS; round++) {
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
                    var effectiveAtk = getEffectiveAtk(pet);
                    var dmg = calcDamage(effectiveAtk, e.def, sk.multiplier, bon);
                    e.hp = Math.max(0, e.hp - dmg);
                    BattleStats.recordDamageDealt(dmg);
                    if (e.hp === 0) BattleStats.recordKill();
                    hits.push({ targetId: e.id, name: e.name, dmg: dmg, hp: e.hp, maxHp: e.maxHp });
                  });
                  log.push({ type: 'skill_all', pet: pet.name, icon: pet.icon, skill: sk.name, hits: hits });
                  BattleStats.recordSkillUsed();

                } else if (sk.effect === 'heal') {
                  var healed = Math.floor(pet.maxHp * sk.value);
                  pet.hp = Math.min(pet.maxHp, pet.hp + healed);
                  log.push({ type: 'heal', pet: pet.name, icon: pet.icon, skill: sk.name, amount: healed, hp: pet.hp, maxHp: pet.maxHp });
                  BattleStats.recordSkillUsed();

                } else if (sk.effect === 'heal_all') {
                  var heals = [];
                  playerTeam.forEach(function (p) {
                    if (!p || p.hp <= 0) return;
                    var healAmount = Math.floor(p.maxHp * sk.value);
                    p.hp = Math.min(p.maxHp, p.hp + healAmount);
                    heals.push({ name: p.name, amount: healAmount, hp: p.hp, maxHp: p.maxHp });
                  });
                  log.push({ type: 'heal_all', pet: pet.name, icon: pet.icon, skill: sk.name, heals: heals });
                  BattleStats.recordSkillUsed();

                } else if (sk.effect === 'buff_atk') {
                  if (!pet.buffs) pet.buffs = [];
                  pet.buffs.push({
                    type: 'atk_boost',
                    value: sk.value,
                    duration: BATTLE_CONFIG.BUFF_DURATION.DEFAULT
                  });
                  log.push({ type: 'buff', pet: pet.name, icon: pet.icon, skill: sk.name, buffType: 'atk_boost' });
                  BattleStats.recordSkillUsed();

                } else if (sk.effect === 'shield') {
                  if (!pet.buffs) pet.buffs = [];
                  pet.buffs.push({
                    type: 'shield',
                    value: sk.value,
                    duration: BATTLE_CONFIG.BUFF_DURATION.SHIELD
                  });
                  log.push({ type: 'buff', pet: pet.name, icon: pet.icon, skill: sk.name, buffType: 'shield' });
                  BattleStats.recordSkillUsed();

                } else if (sk.multiplier) {
                  var bon2 = elementBonus(pet.element, target.element);
                  var effectiveAtk2 = getEffectiveAtk(pet);
                  var dmg2 = calcDamage(effectiveAtk2, target.def, sk.multiplier, bon2);
                  target.hp = Math.max(0, target.hp - dmg2);
                  BattleStats.recordDamageDealt(dmg2);
                  if (target.hp === 0) BattleStats.recordKill();
                  log.push({ type: 'skill', pet: pet.name, icon: pet.icon, skill: sk.name, targetId: target.id, target: target.name, dmg: dmg2, hp: target.hp, maxHp: target.maxHp });
                  BattleStats.recordSkillUsed();

                } else {
                  log.push({ type: 'buff', pet: pet.name, icon: pet.icon, skill: sk.name });
                  BattleStats.recordSkillUsed();
                }
                usedSkill = true;
                break;
              }
            }
          }

          if (!usedSkill) {
            var t2    = pickEnemyTarget(enemyFront, enemyBack);
            if (!t2) return;
            var bon3  = elementBonus(pet.element, t2.element);
            var basic = pet.skills ? pet.skills.find(function (s) { return s.type === 'basic'; }) : null;
            var mult3 = basic ? basic.multiplier : 1.0;
            var effectiveAtk3 = getEffectiveAtk(pet);
            var dmg3  = calcDamage(effectiveAtk3, t2.def, mult3, bon3);
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

        /* ─── 敵人攻擊 ─── */
        enemyFront.concat(enemyBack).forEach(function (enemy) {
          if (enemy.hp <= 0) return;
          var pt = pickPlayerTarget(playerTeam);
          if (!pt) return;
          var effectiveDef = getEffectiveDef(pt);
          var dmgE = calcDamage(enemy.atk, effectiveDef, 1.0, 1.0);
          pt.hp = Math.max(0, pt.hp - dmgE);
          BattleStats.recordDamageTaken(dmgE);
          log.push({ type: 'enemy_attack', enemyId: enemy.id, enemy: enemy.name, icon: enemy.icon, target: pt.name, dmg: dmgE, hp: pt.hp, maxHp: pt.maxHp });
        });

        /* 回合結束：統一處理冷卻和 Buff */
        decrementCooldowns(playerTeam);
        decrementBuffs(playerTeam);

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
