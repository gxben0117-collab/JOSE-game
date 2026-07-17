/* JOSE 幻獸戰棋：單一玩法的戰鬥控制器與 UI 協調層。 */
(function () {
  'use strict';

  var COLS = 30, ROWS = 30, HARD_ROUND_LIMIT = 45, PARTY_SIZE = 10, AGGRO_RANGE = 7;
  /* 布陣空間預設 5×5：大型（2×2）幻獸佔 4 格，天然限制大型單位的出戰數量。 */
  var DEPLOY_MIN_X = 2, DEPLOY_MAX_X = 6, DEPLOY_MIN_Y = 21, DEPLOY_MAX_Y = 25;
  var content = window.TACTICAL_CONTENT;
  var profiles = window.TACTICAL_PET_DATA.concat(window.TACTICAL_ENEMY_DATA || []);
  var progression = new window.TacticalProgression({ profiles: window.TACTICAL_PET_DATA, content: content });
  var progress = progression.state;
  var audio = new window.TacticalAudio(progress.sound);
  var partyIds = progress.party.slice(), currentStage = content.stageById(progress.currentStage), state;
  var deploySelection = [], growthPetId = partyIds[0], autoTimer = null, battleSpeed = 1;

  var dom = {
    app: document.querySelector('.tactics-app'), board: document.getElementById('board'), list: document.getElementById('party-list'),
    teamTrait: document.getElementById('team-trait'), detail: document.getElementById('unit-detail'), skills: document.getElementById('skill-buttons'),
    evolution: document.getElementById('evolution-buttons'), turnOrder: document.getElementById('turn-order'), log: document.getElementById('combat-log'),
    banner: document.getElementById('turn-banner'), roundStatus: document.getElementById('round-status'), medals: document.getElementById('medals'),
    essences: document.getElementById('essences'), fusionCores: document.getElementById('fusion-cores'), sound: document.getElementById('sound-toggle'),
    mapEyebrow: document.getElementById('map-eyebrow'), stageTitle: document.getElementById('stage-title'), stageDescription: document.getElementById('stage-description'),
    stageBadge: document.getElementById('stage-badge'), stageObjective: document.getElementById('stage-objective'), stageProgress: document.getElementById('stage-progress'),
    questSummary: document.getElementById('quest-summary'), deployModal: document.getElementById('deploy-modal'), deployGrid: document.getElementById('deploy-grid'), deployHelp: document.getElementById('deploy-help'),
    campaignModal: document.getElementById('campaign-modal'), campaignGrid: document.getElementById('campaign-grid'), growthModal: document.getElementById('growth-modal'),
    growthPet: document.getElementById('growth-pet'), growthFeedback: document.getElementById('growth-feedback'), growthContent: document.getElementById('growth-content'), questList: document.getElementById('quest-list'),
    resultIcon: document.getElementById('result-icon'), resultStage: document.getElementById('result-stage'),
    resultTitle: document.getElementById('result-title'), resultCopy: document.getElementById('result-copy'), resultStats: document.getElementById('result-stats'), resultRewards: document.getElementById('result-rewards'),
    bossBar: document.getElementById('boss-bar'), bossName: document.getElementById('boss-name'), bossHpFill: document.getElementById('boss-hp-fill'), bossIntro: document.getElementById('boss-intro'),
    screenHome: document.getElementById('screen-home'), screenBattle: document.getElementById('screen-battle'), screenResult: document.getElementById('screen-result'),
    enterBattle: document.getElementById('enter-battle'), battleExit: document.getElementById('battle-exit'), battleStageLabel: document.getElementById('battle-stage-label'),
    auto: document.getElementById('auto-turn'), speed: document.getElementById('battle-speed'), endTurn: document.getElementById('end-turn')
  };

  /* 畫面切換：準備主頁／戰鬥頁／結算頁 三個獨立頁面。 */
  var currentView = 'home';
  function setView(view) {
    currentView = view;
    dom.screenHome.hidden = view !== 'home';
    dom.screenBattle.hidden = view !== 'battle';
    dom.screenResult.hidden = view !== 'result';
    document.body.classList.remove('view-home', 'view-battle', 'view-result');
    document.body.classList.add('view-' + view);
    window.scrollTo(0, 0);
  }

  function profile(id) { return profiles.find(function (pet) { return pet.id === id; }); }
  function mapData() { return content.mapById(currentStage.mapId); }
  function alive(team) { return state.units.filter(function (unit) { return unit.team === team && unit.hp > 0; }); }
  function selected() { return state.units.find(function (unit) { return unit.key === state.selected; }); }
  function unitSize(unit) { return (unit && unit.p && unit.p.size) || 1; }
  /* 多格佔位：大型單位以左上角為錨點，footprint 覆蓋 size×size 格。 */
  function at(x, y) {
    return state.units.find(function (unit) {
      if (unit.hp <= 0) return false;
      var size = unitSize(unit);
      return x >= unit.x && x < unit.x + size && y >= unit.y && y < unit.y + size;
    });
  }
  function canStand(unit, x, y) {
    var size = unitSize(unit);
    for (var dy = 0; dy < size; dy++) for (var dx = 0; dx < size; dx++) {
      var cx = x + dx, cy = y + dy;
      if (!inBoard(cx, cy) || obstacleAt(cx, cy)) return false;
      var other = at(cx, cy);
      if (other && other !== unit) return false;
    }
    return true;
  }
  function inBoard(x, y) { return x >= 0 && x < COLS && y >= 0 && y < ROWS; }
  /* 距離＝兩單位 footprint 矩形間的曼哈頓間隙（大型單位更容易被打到，也打得更遠）。 */
  function distance(a, b) {
    var aSize = unitSize(a), bSize = unitSize(b);
    var gapX = Math.max(0, b.x - (a.x + aSize - 1), a.x - (b.x + bSize - 1));
    var gapY = Math.max(0, b.y - (a.y + aSize - 1), a.y - (b.y + bSize - 1));
    return gapX + gapY;
  }
  function terrain(x, y) { return obstacleAt(x, y) ? '' : content.terrainAt(currentStage, x, y); }
  function obstacleAt(x, y) { return Boolean(state && state.obstacleMap[x + ',' + y]); }
  function unitName(unit) { return unit.p.name; }
  function note(message) { dom.log.textContent = message; }
  function duration(milliseconds) { return Math.max(18, Math.round(milliseconds / battleSpeed)); }
  function pause(milliseconds) { return new Promise(function (resolve) { setTimeout(resolve, duration(milliseconds)); }); }
  function evolutionMultiplier(unit) { return 1 + (unit.evolution - 1) * 0.12; }
  function portrait(unit) { return unit.p.evolution[Math.min(unit.evolution, unit.p.evolution.length) - 1].portrait; }
  function bonuses(unit) { return unit.team === 'ally' ? progression.bonusesFor(unit.p) : {}; }
  function bonusValue(unit, key) { var value = bonuses(unit); return (value.all || 0) + (value[key] || 0); }
  function starMultiplier(unit) { return unit.team === 'ally' ? progression.starMultiplier(unit.id) : 1; }
  function stat(unit, key) {
    var value = unit.p.stats[key] * evolutionMultiplier(unit) * starMultiplier(unit);
    if (key === 'power') value *= 1 + bonusValue(unit, 'offense');
    if (key === 'magic') value *= 1 + bonusValue(unit, 'magic') + (bonuses(unit).offense || 0);
    if (key === 'defense') value *= 1 + bonusValue(unit, 'defense');
    return value * (unit.team === 'enemy' ? state.enemyScale : 1);
  }
  function moveRange(unit) { return unit.p.move + (bonuses(unit).move || 0) + (unit.p.element === 'ocean' && terrain(unit.x, unit.y) === 'water' ? 1 : 0); }
  function skillRange(unit, skill) { return skill.range + (skill.attackStyle === 'support' ? (bonuses(unit).supportRange || 0) : (bonuses(unit).range || 0)); }
  function portraitStage(id) { return Math.max(1, Math.min(3, Number(progress.evolution[id]) || 1)); }
  function isControlSkill(skill) { return Boolean(skill.status || skill.push || skill.pull); }

  function clone(id, team, x, y, index) {
    var pet = profile(id), evolution = team === 'ally' ? portraitStage(id) : Math.max(1, Math.min(pet.evolution.length, 1 + Math.floor((Math.max(1, currentStage.order) - 1) / 6)));
    var unit = { id: id, key: team + '-' + index + '-' + id, team: team, p: pet, x: x, y: y, hp: 1, maxHp: 1, moved: false, acted: false, evolution: evolution,
      cooldowns: pet.skills.map(function () { return 0; }), shield: 0, burn: 0, poison: 0, freeze: 0, atkBuff: 0, boss: Boolean(pet.boss) };
    unit.maxHp = Math.round(pet.stats.health * evolutionMultiplier(unit) * starMultiplier(unit) * (1 + bonusValue(unit, 'health')) * (team === 'enemy' ? state.enemyScale * (unit.boss ? 1.1 : 1) : 1));
    unit.hp = unit.maxHp;
    return unit;
  }

  /* 我方站位：在 5×5 布陣區內貪婪擺放（大型單位需 2×2 連續空格），放不下的幻獸列為候補。 */
  function inDeployZone(x, y) { return x >= DEPLOY_MIN_X && x <= DEPLOY_MAX_X && y >= DEPLOY_MIN_Y && y <= DEPLOY_MAX_Y; }
  function deployFits(unit, x, y) {
    var size = unitSize(unit);
    for (var dy = 0; dy < size; dy++) for (var dx = 0; dx < size; dx++) {
      if (!inDeployZone(x + dx, y + dy)) return false;
    }
    return canStand(unit, x, y);
  }
  function placeAllies() {
    var benched = [];
    partyIds.forEach(function (id, index) {
      var unit = clone(id, 'ally', -9, -9, index), placed = false;
      state.units.push(unit);
      for (var y = DEPLOY_MIN_Y; y <= DEPLOY_MAX_Y && !placed; y++) for (var x = DEPLOY_MIN_X; x <= DEPLOY_MAX_X && !placed; x++) {
        if (deployFits(unit, x, y)) { unit.x = x; unit.y = y; placed = true; }
      }
      if (!placed) { state.units.pop(); benched.push(unit.p.name + (unitSize(unit) > 1 ? '（2×2）' : '')); }
    });
    return benched;
  }

  /* 敵方布陣：名冊拆成 3~5 人小隊，依關卡 seed 決定性散布在全地圖多個集結點；
     頭目小隊固定佔據最深處的錨點。 */
  function findFreeSpot(cx, cy, occupied, size) {
    size = size || 1;
    function free(x, y) {
      for (var dy = 0; dy < size; dy++) for (var dx = 0; dx < size; dx++) {
        var fx = x + dx, fy = y + dy;
        if (!inBoard(fx, fy) || obstacleAt(fx, fy) || occupied[fx + ',' + fy] || (fx <= DEPLOY_MAX_X + 2 && fy >= DEPLOY_MIN_Y - 2)) return false;
      }
      return true;
    }
    for (var radius = 0; radius < 10; radius++) {
      for (var dy = -radius; dy <= radius; dy++) for (var dx = -radius; dx <= radius; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== radius) continue;
        var x = cx + dx, y = cy + dy;
        if (free(x, y)) return { x: x, y: y };
      }
    }
    return { x: cx, y: cy };
  }
  function enemyFormation(roster) {
    var anchors = [[26, 5], [25, 14], [26, 23], [19, 8], [19, 21], [13, 14], [21, 14], [15, 5], [15, 25], [27, 9], [27, 19], [11, 8]];
    var result = [], occupied = {}, squads = [], squadSize = roster.length > 20 ? 5 : 4, offset = currentStage.seed % anchors.length;
    for (var index = 0; index < roster.length; index += squadSize) squads.push(roster.slice(index, index + squadSize));
    squads.forEach(function (squad, squadIndex) {
      var anchor = squadIndex === 0 && currentStage.boss ? [25, 13] : anchors[(offset + squadIndex * 3) % anchors.length];
      squad.forEach(function (id) {
        var size = (profile(id) || {}).size || 1;
        var spot = findFreeSpot(anchor[0], anchor[1], occupied, size);
        for (var dy = 0; dy < size; dy++) for (var dx = 0; dx < size; dx++) occupied[(spot.x + dx) + ',' + (spot.y + dy)] = true;
        result.push({ id: id, x: spot.x, y: spot.y, squad: squadIndex });
      });
    });
    return result;
  }

  /* 無限塔：虛擬關卡生成器——每 5 層一場塔層首領戰，難度隨層數線性攀升。 */
  function towerStageFor(floor) {
    var chapter = content.maps[(floor - 1) % content.maps.length];
    var bossFloor = floor % 5 === 0;
    return {
      id: 'tower-' + floor, tower: true, floor: floor, mapId: chapter.id, chapter: 0, index: floor, order: 0,
      name: '無限塔・第 ' + floor + ' 層', difficulty: bossFloor ? '塔層首領' : '無限塔', boss: bossFloor,
      power: Math.round((0.3 + floor * 0.16) * 100) / 100,
      enemies: bossFloor ? [chapter.boss].concat(chapter.minions) : chapter.minions,
      enemyCount: Math.min(30, 8 + floor), seed: floor * 97 + 13,
      objective: '掃平第 ' + floor + ' 層（每 5 層有塔層首領）', turnLimit: 30,
      rewards: { medals: 0, essence: 0, fusionCore: 0 }
    };
  }
  function enterTower(floor) {
    currentStage = towerStageFor(Math.max(1, floor));
    reset(currentStage); setView('battle'); audio.play('boss');
    focusCamera(4, 24, true);
  }

  function reset(stageId) {
    stopAuto();
    if (stageId && typeof stageId === 'object') currentStage = stageId;
    else if (stageId) currentStage = content.stageById(stageId);
    if (!currentStage.tower) { progress.currentStage = currentStage.id; progression.save(); }
    var scale = currentStage.power || (1 + (currentStage.order - 1) * 0.055);
    state = { round: 1, phase: 'deploy', selected: null, mode: 'move', skill: 0, over: false, animating: false, autoEnding: false, resultRecorded: false,
      pendingTarget: null, threatKey: null,
      enemyScale: scale, riftPower: 0, reward: null, stats: { damage: 0, healing: 0, skills: 0 }, units: [], obstacles: [], obstacleMap: {} };
    state.obstacles = (content.obstaclesFor ? content.obstaclesFor(currentStage, COLS, ROWS) : []);
    state.obstacles.forEach(function (spot) { state.obstacleMap[spot.x + ',' + spot.y] = true; });
    var benched = placeAllies();
    var roster = content.rosterFor ? content.rosterFor(currentStage) : currentStage.enemies;
    enemyFormation(roster).forEach(function (spot, index) {
      var unit = clone(spot.id, 'enemy', spot.x, spot.y, index); unit.squad = spot.squad; state.units.push(unit);
    });
    dom.board.style.gridTemplateColumns = 'repeat(' + COLS + ', var(--cell))';
    dom.board.style.gridTemplateRows = 'repeat(' + ROWS + ', var(--cell))';
    document.body.className = 'map-' + mapData().theme + ' view-' + currentView;
    note('部署階段：點選我方幻獸，再點左下角藍色部署格（5×5）調整站位，完成後按「開始戰鬥」。敵軍共 ' + roster.length + ' 隻分小隊散布全圖。' +
      (benched.length ? '⚠ 布陣空間不足，候補未出戰：' + benched.join('、') + '。' : ''));
    renderProgress(); renderCampaignMeta(); render();
    focusCamera(4, 24, true);
  }

  async function startBattle() {
    if (state.phase !== 'deploy') return;
    state.phase = 'player'; state.selected = null; audio.play('ui');
    if (currentStage.boss) {
      var boss = state.units.find(function (unit) { return unit.boss && unit.hp > 0; });
      if (boss && dom.bossIntro) {
        dom.bossIntro.innerHTML = '<div class="boss-intro-art" style="background-image:url(\'' + portrait(boss) + '\')"></div><p class="eyebrow">章節首領</p><h2>' + boss.p.name + '</h2><p>' + currentStage.objective + '</p>';
        dom.bossIntro.hidden = false; audio.play('boss');
        await pause(1500); dom.bossIntro.hidden = true;
      }
    }
    note('第 ' + currentStage.order + ' 關開戰：選擇幻獸移動，再從右側選擇技能。可拖曳地圖或用小地圖掌握全場。');
    render();
    phaseBanner('⚔ 我方回合｜PLAYER PHASE', 'player');
    focusUnit(alive('ally')[0], false);
  }

  function traitFor(team) {
    var counts = {};
    alive(team).forEach(function (unit) { counts[unit.p.element] = (counts[unit.p.element] || 0) + 1; });
    var elements = Object.keys(counts), repeated = elements.find(function (element) { return counts[element] >= 3; });
    if (repeated) return { multiplier: 1.12, label: '元素共鳴', copy: repeated + ' 系三獸協同，傷害與治療 +12%。' };
    if (elements.length >= 3) return { multiplier: 1.08, label: '三系戰術', copy: '火、森、海互補，傷害與治療 +8%。' };
    return { multiplier: 1, label: '尚未共鳴', copy: '湊齊三種元素，或三隻相同元素的幻獸可啟動加成。' };
  }
  function combatMultiplier(unit) { return traitFor(unit.team).multiplier; }
  function elementalMultiplier(attacker, target) {
    var strong = { fire: 'forest', forest: 'ocean', ocean: 'fire', light: 'dark', dark: 'light' };
    if (strong[attacker.p.element] === target.p.element) return 1.25;
    if (strong[target.p.element] === attacker.p.element && strong[attacker.p.element] !== target.p.element) return 0.85;
    return 1;
  }
  function terrainAttackMultiplier(unit, x, y) {
    var tile = terrain(x === undefined ? unit.x : x, y === undefined ? unit.y : y);
    return (tile === 'fire' && unit.p.element === 'fire') || (tile === 'forest' && unit.p.element === 'forest') || (tile === 'water' && unit.p.element === 'ocean') ? 1.15 : 1;
  }

  function pathTo(unit, x, y, maxSteps) {
    if (!canStand(unit, x, y) && !(unit.x === x && unit.y === y)) return null;
    var queue = [{ x: unit.x, y: unit.y, path: [] }], visited = {}; visited[unit.x + ',' + unit.y] = true;
    while (queue.length) {
      var current = queue.shift();
      if (current.x === x && current.y === y) return current.path;
      if (current.path.length >= maxSteps) continue;
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (delta) {
        var nx = current.x + delta[0], ny = current.y + delta[1], key = nx + ',' + ny;
        if (!visited[key] && canStand(unit, nx, ny)) {
          visited[key] = true; queue.push({ x: nx, y: ny, path: current.path.concat([{ x: nx, y: ny }]) });
        }
      });
    }
    return null;
  }
  function reachableTiles(unit) {
    var tiles = [{ x: unit.x, y: unit.y, steps: 0 }], visited = {}, queue = [{ x: unit.x, y: unit.y, steps: 0 }], range = moveRange(unit);
    visited[unit.x + ',' + unit.y] = true;
    while (queue.length) {
      var current = queue.shift();
      if (current.steps >= range) continue;
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (delta) {
        var nx = current.x + delta[0], ny = current.y + delta[1], key = nx + ',' + ny;
        if (!visited[key] && canStand(unit, nx, ny)) {
          visited[key] = true; var next = { x: nx, y: ny, steps: current.steps + 1 }; tiles.push(next); queue.push(next);
        }
      });
    }
    return tiles;
  }
  function canMove(unit, x, y) { var path = pathTo(unit, x, y, moveRange(unit)); return Boolean(path && path.length); }

  /* 遠程視線：以格線采樣檢查兩點之間是否被障礙物遮蔽（不含端點）。 */
  function lineClear(fromX, fromY, toX, toY) {
    var steps = Math.max(Math.abs(toX - fromX), Math.abs(toY - fromY)) * 2;
    for (var index = 1; index < steps; index++) {
      var x = Math.round(fromX + (toX - fromX) * index / steps), y = Math.round(fromY + (toY - fromY) * index / steps);
      if ((x !== fromX || y !== fromY) && (x !== toX || y !== toY) && obstacleAt(x, y)) return false;
    }
    return true;
  }
  function hasSight(unit, target, skill, fromX, fromY) {
    if (skill.attackStyle !== 'ranged' && skill.attackStyle !== 'area') return true;
    return lineClear(fromX === undefined ? unit.x : fromX, fromY === undefined ? unit.y : fromY, target.x, target.y);
  }
  function canUseTarget(unit, target, skill) {
    if (!target || target.hp <= 0 || distance(unit, target) > skillRange(unit, skill)) return false;
    if (!hasSight(unit, target, skill)) return false;
    return skill.attackStyle === 'support' ? target.team === unit.team : target.team !== unit.team;
  }
  function skillOf(unit) { return unit.p.skills[state.skill] || unit.p.skills[0]; }
  function canTarget(unit, target) { return canUseTarget(unit, target, skillOf(unit)); }

  async function walkUnit(unit, x, y) {
    var path = pathTo(unit, x, y, moveRange(unit));
    if (!path || !path.length) return false;
    unit.prevX = unit.x; unit.prevY = unit.y; /* 供「取消移動」還原 */
    state.animating = true; note(unitName(unit) + ' 移動 ' + path.length + ' 格。');
    focusCamera(x, y, false);
    for (var index = 0; index < path.length; index++) {
      var fromX = unit.x, fromY = unit.y; unit.x = path[index].x; unit.y = path[index].y; render();
      var piece = dom.board.querySelector('[data-key="' + unit.key + '"]');
      if (piece) { piece.style.setProperty('--walk-x', (fromX - unit.x) * 100 + '%'); piece.style.setProperty('--walk-y', (fromY - unit.y) * 100 + '%'); piece.classList.add('walking'); }
      audio.play('move'); await pause(135);
    }
    unit.moved = true; state.animating = false; note(unitName(unit) + ' 抵達 ' + (unit.x + 1) + '-' + (unit.y + 1) + '。'); render(); maybeAutoEndAfterMoves(); return true;
  }

  function damage(attacker, target, skill, options) {
    options = options || {};
    var magic = skill.attackStyle === 'ranged' || skill.attackStyle === 'area';
    var raw = (magic ? stat(attacker, 'magic') : stat(attacker, 'power')) * combatMultiplier(attacker) * terrainAttackMultiplier(attacker) * (skill.multiplier || 1.05);
    raw *= elementalMultiplier(attacker, target);
    if (attacker.atkBuff > 0) raw *= 1.2;
    if (target.hp / target.maxHp < 0.5) raw *= 1 + (bonuses(attacker).execute || 0);
    if (options.counter) raw *= 1 + (bonuses(attacker).counter || 0);
    if (attacker.team === 'enemy') raw *= 1 + state.riftPower;
    var crit = !options.counter && Math.random() < 0.12 + (attacker.p.stats.speed > target.p.stats.speed ? 0.06 : 0);
    if (crit) raw *= 1.5;
    var defense = stat(target, 'defense') * (terrain(target.x, target.y) === 'forest' && target.p.element === 'forest' ? 1.12 : 1);
    var amount = Math.max(12, Math.round(raw - defense * 0.55));
    if (options.secondary) amount = Math.round(amount * 0.72);
    var absorbed = Math.min(target.shield, amount); target.shield -= absorbed; amount -= absorbed;
    target.hp = Math.max(0, target.hp - amount);
    if (attacker.team === 'ally') state.stats.damage += amount;
    return { amount: amount, absorbed: absorbed, crit: crit };
  }

  function healAmount(caster, target, skill) {
    var multiplier = 1 + bonusValue(caster, 'healing');
    if (terrain(caster.x, caster.y) === 'forest' && caster.p.element === 'forest') multiplier *= 1.2;
    var amount = Math.round(stat(caster, 'magic') * combatMultiplier(caster) * multiplier * (skill.multiplier || 0.8));
    var before = target.hp; target.hp = Math.min(target.maxHp, target.hp + amount); return target.hp - before;
  }

  function cellAt(x, y) { return dom.board.children[y * COLS + x]; }

  /* ── 大地圖鏡頭：拖曳平移、自動跟隨行動單位、小地圖導航 ── */
  var suppressClickUntil = 0;
  function cameraSuppressed() { return Date.now() < suppressClickUntil; }
  function focusCamera(x, y, instant) {
    var scroller = dom.board.parentElement, sample = dom.board.firstChild;
    if (!scroller || !sample || !sample.offsetWidth) return;
    var size = sample.offsetWidth;
    scroller.scrollTo({
      left: Math.max(0, (x + 0.5) * size - scroller.clientWidth / 2),
      top: Math.max(0, (y + 0.5) * size - scroller.clientHeight / 2),
      behavior: instant ? 'auto' : 'smooth'
    });
  }
  function focusUnit(unit, instant) { if (unit) focusCamera(unit.x, unit.y, instant); }
  function enableCameraDrag() {
    var scroller = dom.board.parentElement, drag = null;
    scroller.addEventListener('pointerdown', function (event) {
      if (event.button !== 0) return;
      drag = { x: event.clientX, y: event.clientY, left: scroller.scrollLeft, top: scroller.scrollTop, moved: false };
    });
    window.addEventListener('pointermove', function (event) {
      if (!drag) return;
      var dx = event.clientX - drag.x, dy = event.clientY - drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 8) drag.moved = true;
      if (drag.moved) { scroller.scrollLeft = drag.left - dx; scroller.scrollTop = drag.top - dy; scroller.classList.add('dragging'); }
    });
    window.addEventListener('pointerup', function () {
      if (drag && drag.moved) suppressClickUntil = Date.now() + 180;
      drag = null; scroller.classList.remove('dragging');
    });
    scroller.addEventListener('scroll', renderMinimapView, { passive: true });
  }
  function renderMinimap() {
    var dots = document.getElementById('minimap-dots'); if (!dots) return;
    var html = '';
    state.obstacles.forEach(function (spot) { html += '<i class="mm-rock" style="left:' + ((spot.x + 0.5) / COLS * 100) + '%;top:' + ((spot.y + 0.5) / ROWS * 100) + '%"></i>'; });
    state.units.forEach(function (unit) {
      if (unit.hp <= 0) return;
      html += '<i class="mm-' + (unit.boss ? 'boss' : unit.team) + '" style="left:' + ((unit.x + 0.5) / COLS * 100) + '%;top:' + ((unit.y + 0.5) / ROWS * 100) + '%"></i>';
    });
    dots.innerHTML = html;
    renderMinimapView();
  }
  function renderMinimapView() {
    var view = document.getElementById('minimap-view'), scroller = dom.board.parentElement;
    if (!view || !scroller || !scroller.scrollWidth) return;
    view.style.left = scroller.scrollLeft / scroller.scrollWidth * 100 + '%';
    view.style.top = scroller.scrollTop / scroller.scrollHeight * 100 + '%';
    view.style.width = Math.min(100, scroller.clientWidth / scroller.scrollWidth * 100) + '%';
    view.style.height = Math.min(100, scroller.clientHeight / scroller.scrollHeight * 100) + '%';
  }

  /* 粒子爆散：hit 向外飛散、heal 向上飄升、death 大範圍炸開。 */
  function burst(target, hue, kind, count) {
    var cell = cellAt(target.x, target.y); if (!cell) return;
    for (var index = 0; index < count; index++) {
      var spark = document.createElement('i'); spark.className = 'spark ' + kind;
      var angle = kind === 'heal' ? (-Math.PI / 2 + (Math.random() - 0.5) * 1.2) : Math.random() * Math.PI * 2;
      var reach = (kind === 'death' ? 40 : 26) + Math.random() * (kind === 'death' ? 42 : 26);
      spark.style.setProperty('--dx', Math.cos(angle) * reach + 'px');
      spark.style.setProperty('--dy', Math.sin(angle) * reach + (kind === 'heal' ? -18 : 0) + 'px');
      spark.style.setProperty('--spark', 'hsl(' + (hue + (Math.random() - 0.5) * 40) + ' 92% ' + (58 + Math.random() * 24) + '%)');
      spark.style.setProperty('--size', (kind === 'death' ? 5 : 3.4) + Math.random() * 4 + 'px');
      spark.style.animationDelay = Math.random() * 60 / battleSpeed + 'ms';
      cell.appendChild(spark);
      setTimeout(function (node) { node.remove(); }, duration(760), spark);
    }
  }
  function impactRing(target, hue) {
    var cell = cellAt(target.x, target.y); if (!cell) return;
    var ring = document.createElement('i'); ring.className = 'impact-ring'; ring.style.setProperty('--vfx', 'hsl(' + hue + ' 92% 66%)');
    cell.appendChild(ring); setTimeout(function () { ring.remove(); }, duration(520));
  }
  function telegraphArea(center, radius, hue) {
    for (var y = 0; y < ROWS; y++) for (var x = 0; x < COLS; x++) {
      if (Math.abs(x - center.x) + Math.abs(y - center.y) > radius || obstacleAt(x, y)) continue;
      var cell = cellAt(x, y); if (!cell) continue;
      var mark = document.createElement('i'); mark.className = 'aoe-mark'; mark.style.setProperty('--vfx', 'hsl(' + hue + ' 92% 62%)');
      cell.appendChild(mark); setTimeout(function (node) { node.remove(); }, duration(560), mark);
    }
  }
  /* 近戰揮砍弧光與施法魔法陣 */
  function slashFx(target) {
    var cell = cellAt(target.x, target.y); if (!cell) return;
    var slash = document.createElement('i'); slash.className = 'slash-fx';
    slash.style.setProperty('--slash-rot', (Math.random() * 70 - 35).toFixed(0) + 'deg');
    cell.appendChild(slash); setTimeout(function () { slash.remove(); }, duration(430));
  }
  function castCircle(unit, hue) {
    var cell = cellAt(unit.x, unit.y); if (!cell) return;
    var circle = document.createElement('i'); circle.className = 'cast-circle';
    circle.style.setProperty('--vfx', 'hsl(' + hue + ' 92% 66%)');
    cell.appendChild(circle); setTimeout(function () { circle.remove(); }, duration(620));
  }
  function ultimateFlash() {
    var wrap = dom.board.parentElement.parentElement;
    wrap.classList.add('ult-cast'); setTimeout(function () { wrap.classList.remove('ult-cast'); }, duration(620));
  }

  function addVisual(target, element, skill, amount, healing, absorbed, crit) {
    var cell = cellAt(target.x, target.y); if (!cell) return;
    var fxClass = skill.status === 'freeze' ? 'fx-freeze' : skill.status === 'poison' ? 'fx-poison' : skill.status === 'burn' ? 'fx-burn' : (skill.push || skill.pull) ? 'fx-force' : '';
    var fx = document.createElement('i'); fx.className = 'vfx ' + (element || 'fire') + ' variant-' + (skill.vfxVariant || 0) + (fxClass ? ' ' + fxClass : ''); fx.style.setProperty('--vfx', 'hsl(' + skill.vfxHue + ' 92% 62%)'); fx.setAttribute('aria-label', skill.name + ' 特效'); cell.appendChild(fx);
    var number = document.createElement('b'); number.className = 'damage-number ' + (healing ? 'heal' : '') + (crit ? ' crit' : ''); number.textContent = absorbed && !amount ? '護盾' : (crit ? '爆擊 ' : '') + (healing ? '+' : '−') + amount;
    number.style.setProperty('--drift', ((Math.random() - 0.5) * 34).toFixed(0) + 'px'); cell.appendChild(number);
    var piece = cell.querySelector('.unit'); if (piece) piece.classList.add(healing ? 'recover' : 'hit');
    if (skill.kind !== 'basic' && !healing) {
      var stamp = document.createElement('i'); stamp.className = 'impact-art';
      stamp.style.backgroundImage = 'url(assets/vfx/impact-' + (element || 'fire') + '.png)';
      cell.appendChild(stamp); setTimeout(function () { stamp.remove(); }, duration(560));
    }
    if (healing) burst(target, 140, 'heal', 7);
    else { burst(target, skill.vfxHue, 'hit', crit ? 14 : 8); if (crit || skill.attackStyle === 'melee') impactRing(target, skill.vfxHue); }
    setTimeout(function () { fx.remove(); number.remove(); if (piece) piece.classList.remove(healing ? 'recover' : 'hit'); }, duration(620));
  }
  function statusLabel(target, text) {
    var cell = cellAt(target.x, target.y); if (!cell) return;
    var label = document.createElement('b'); label.className = 'status-label'; label.textContent = text; cell.appendChild(label);
    setTimeout(function () { label.remove(); }, duration(760));
  }

  function addProjectile(caster, target, skill) {
    if (skill.attackStyle === 'melee' || skill.attackStyle === 'support') return;
    var cell = cellAt(target.x, target.y); if (!cell) return;
    var projectile = document.createElement('i'); projectile.className = 'projectile';
    var deltaX = (caster.x - target.x) * cell.offsetWidth, deltaY = (caster.y - target.y) * cell.offsetHeight;
    projectile.style.setProperty('--projectile', 'hsl(' + skill.vfxHue + ' 92% 68%)');
    projectile.style.setProperty('--from-x', deltaX + 'px'); projectile.style.setProperty('--from-y', deltaY + 'px');
    projectile.style.setProperty('--angle', Math.atan2(-deltaY, -deltaX) + 'rad');
    cell.appendChild(projectile); setTimeout(function () { projectile.remove(); }, duration(300));
  }

  function passiveBurn(attacker, target) {
    var burn = attacker.p.passives.find(function (passive) { return passive.effect === 'burn'; });
    if (burn && Math.random() < (burn.chance || 0)) { target.burn = Math.max(target.burn, 3); return true; }
    return false;
  }

  function applyStatus(caster, target, skill) {
    var applied = [];
    if (skill.status && target.hp > 0) {
      var turns = skill.statusTurns || 2;
      if (skill.status === 'freeze' && !target.boss) { target.freeze = Math.max(target.freeze, turns); applied.push('❄ 冰凍'); audio.play('freeze'); }
      if (skill.status === 'poison') { target.poison = Math.max(target.poison, turns); applied.push('☠ 中毒'); audio.play('poison'); }
      if (skill.status === 'burn') { target.burn = Math.max(target.burn, turns); applied.push('🔥 灼燒'); }
    }
    applied.forEach(function (text) { statusLabel(target, text); });
    return applied.length > 0;
  }

  /* 位移：擊退沿施術者→目標方向推移；拉扯反向。撞到牆、障礙或單位時，剩餘每格轉為碰撞傷害。 */
  async function displace(caster, target, skill) {
    var tiles = skill.push || skill.pull; if (!tiles || target.hp <= 0 || target.boss || unitSize(target) > 1) return;
    var dx = target.x - caster.x, dy = target.y - caster.y;
    var stepX = Math.abs(dx) >= Math.abs(dy) ? Math.sign(dx) || 1 : 0, stepY = stepX ? 0 : Math.sign(dy) || 1;
    if (skill.pull) { stepX = -stepX; stepY = -stepY; }
    var movedTiles = 0;
    for (var index = 0; index < tiles; index++) {
      var nx = target.x + stepX, ny = target.y + stepY;
      if (skill.pull && Math.abs(nx - caster.x) + Math.abs(ny - caster.y) < 1) break;
      if (!inBoard(nx, ny) || obstacleAt(nx, ny) || at(nx, ny)) {
        var impact = Math.max(10, Math.round(target.maxHp * 0.05 * (tiles - index)));
        target.hp = Math.max(0, target.hp - impact);
        if (caster.team === 'ally') state.stats.damage += impact;
        statusLabel(target, '💥 撞擊 −' + impact); audio.play('hit');
        break;
      }
      target.x = nx; target.y = ny; movedTiles++;
      render();
      var piece = dom.board.querySelector('[data-key="' + target.key + '"]');
      if (piece) { piece.style.setProperty('--walk-x', -stepX * 100 + '%'); piece.style.setProperty('--walk-y', -stepY * 100 + '%'); piece.classList.add('knocked'); }
      await pause(95);
    }
    if (movedTiles) { statusLabel(target, skill.push ? '💨 擊退' : '🪝 拉扯'); audio.play('push'); render(); }
  }

  function canCounter(defender, attacker) {
    var basic = defender.p.skills[0];
    return defender.hp > 0 && attacker.hp > 0 && defender.freeze <= 0 && distance(defender, attacker) <= skillRange(defender, basic) && hasSight(defender, attacker, basic);
  }

  /* ── 戰鬥預測面板（出手前確認，含反擊與擊破預測）── */
  function forecastDamage(unit, target, skill) {
    var magic = skill.attackStyle === 'ranged' || skill.attackStyle === 'area';
    var raw = (magic ? stat(unit, 'magic') : stat(unit, 'power')) * combatMultiplier(unit) * terrainAttackMultiplier(unit) * (skill.multiplier || 1.05);
    raw *= elementalMultiplier(unit, target);
    if (unit.atkBuff > 0) raw *= 1.2;
    if (target.hp / target.maxHp < 0.5) raw *= 1 + (bonuses(unit).execute || 0);
    if (unit.team === 'enemy') raw *= 1 + state.riftPower;
    var defense = stat(target, 'defense') * (terrain(target.x, target.y) === 'forest' && target.p.element === 'forest' ? 1.12 : 1);
    return Math.max(12, Math.round(raw - defense * 0.55));
  }
  function forecastHeal(caster, target, skill) {
    var multiplier = 1 + bonusValue(caster, 'healing');
    if (terrain(caster.x, caster.y) === 'forest' && caster.p.element === 'forest') multiplier *= 1.2;
    return Math.min(target.maxHp - target.hp, Math.round(stat(caster, 'magic') * combatMultiplier(caster) * multiplier * (skill.multiplier || 0.8)));
  }
  function clearForecast() { state.pendingTarget = null; var panel = document.getElementById('forecast'); if (panel) panel.hidden = true; }
  function showForecast(unit, target, skill) {
    var panel = document.getElementById('forecast'); if (!panel) return;
    var rows = '';
    if (skill.attackStyle === 'support') {
      var value = skill.effect === 'shield' ? Math.round(stat(unit, 'magic') * (skill.value || 0.7)) : skill.effect === 'buff_atk' ? 0 : forecastHeal(unit, target, skill);
      rows = '<span class="fc-good">' + (skill.effect === 'shield' ? '🛡 護盾 +' + value : skill.effect === 'buff_atk' ? '⬆ 攻擊 +20%（3 回合）' : '💚 回復 +' + value) + '</span>';
    } else {
      var expected = forecastDamage(unit, target, skill);
      var splash = skill.attackStyle === 'area' ? alive(target.team).filter(function (entry) { return entry !== target && distance(entry, target) <= (skill.radius || 1); }).length : 0;
      rows = '<span class="fc-bad">⚔ 預計傷害 ' + expected + (splash ? '（波及 ' + splash + ' 名）' : '') + '</span>';
      if (expected >= target.hp + target.shield) rows += '<span class="fc-kill">💀 可擊破</span>';
      else if (canCounter(target, unit)) rows += '<span class="fc-warn">↩ 敵方反擊約 −' + forecastDamage(target, unit, target.p.skills[0]) + '</span>';
      var extras = (skill.status === 'freeze' ? '❄冰凍 ' : skill.status === 'poison' ? '☠中毒 ' : skill.status === 'burn' ? '🔥灼燒 ' : '') + (skill.push ? '💨擊退 ' : '') + (skill.pull ? '🪝拉扯' : '');
      if (extras) rows += '<span class="fc-extra">附帶：' + extras + '</span>';
    }
    panel.innerHTML =
      '<div class="fc-side"><span class="fc-face" style="background-image:url(\'' + portrait(unit) + '\')"></span><b>' + unit.p.name + '</b><small>' + skill.name + '</small></div>' +
      '<div class="fc-mid">' + rows + '<div class="fc-actions"><button id="fc-confirm" class="primary" type="button">✔ 執行</button><button id="fc-cancel" class="secondary" type="button">✖ 取消</button></div></div>' +
      '<div class="fc-side"><span class="fc-face" style="background-image:url(\'' + portrait(target) + '\')"></span><b>' + target.p.name + '</b><small>HP ' + target.hp + '/' + target.maxHp + '</small></div>';
    panel.hidden = false;
    document.getElementById('fc-confirm').onclick = async function () {
      clearForecast();
      if (!state.over && !state.animating && unit.hp > 0 && target.hp > 0 && !unit.acted) await act(unit, target, skill, state.skill);
    };
    document.getElementById('fc-cancel').onclick = function () { clearForecast(); audio.play('ui'); };
  }

  /* ── 敵方威脅範圍（點擊敵人顯示移動＋射程圈）── */
  function computeThreat(enemy) {
    var map = {}, tiles = reachableTiles(enemy);
    var maxRange = Math.max.apply(null, enemy.p.skills.map(function (skill) { return skill.attackStyle === 'support' ? 0 : skill.range; }));
    tiles.forEach(function (tile) { map[tile.x + ',' + tile.y] = 'move'; });
    tiles.forEach(function (tile) {
      for (var dy = -maxRange; dy <= maxRange; dy++) for (var dx = -(maxRange - Math.abs(dy)); dx <= maxRange - Math.abs(dy); dx++) {
        var x = tile.x + dx, y = tile.y + dy, key = x + ',' + y;
        if (inBoard(x, y) && !obstacleAt(x, y) && !map[key]) map[key] = 'range';
      }
    });
    return map;
  }

  /* ── 階段轉場橫幅（PLAYER PHASE／ENEMY PHASE）── */
  function phaseBanner(text, kind) {
    var wrap = dom.board.parentElement.parentElement.parentElement, old = wrap.querySelector('.phase-banner');
    if (old) old.remove();
    var banner = document.createElement('div'); banner.className = 'phase-banner phase-' + (kind || 'player');
    banner.innerHTML = '<b>' + text + '</b>';
    wrap.appendChild(banner);
    setTimeout(function () { banner.remove(); }, duration(1100));
  }

  async function act(unit, target, skill, skillIndex, options) {
    options = options || {}; if (!unit || !target || unit.hp <= 0 || target.hp <= 0) return;
    if (!options.nested) state.animating = true;
    if (!options.counter) focusCamera((unit.x + target.x) / 2, (unit.y + target.y) / 2, false);
    unit.acted = true;
    var actualIndex = skillIndex === undefined ? state.skill : skillIndex;
    if (skill.cooldown > 0) unit.cooldowns[actualIndex] = Math.max(1, skill.cooldown - (bonuses(unit).cooldown || 0));
    if (unit.team === 'ally' && skill.kind !== 'basic' && !options.counter) { state.stats.skills++; progression.recordSkill(); }
    if (unit.team === 'ally' && isControlSkill(skill) && !options.counter) progression.recordControl();
    var casterPiece = dom.board.querySelector('[data-key="' + unit.key + '"]'); if (casterPiece) casterPiece.classList.add('cast');
    if (skill.kind === 'ultimate' && skill.attackStyle !== 'support') ultimateFlash();
    if (skill.attackStyle === 'area') telegraphArea(target, skill.radius || 1, skill.vfxHue);
    if (skill.attackStyle !== 'melee') castCircle(unit, skill.vfxHue); /* 遠程／輔助：腳下魔法陣 */
    else slashFx(target); /* 近戰：目標身上的揮砍弧光 */
    addProjectile(unit, target, skill);

    var message, effects = [], anyCrit = false;
    if (skill.attackStyle === 'support') {
      var targets = skill.effect === 'heal_all' ? alive(unit.team) : [target];
      if (skill.effect === 'shield') {
        var shield = Math.round(stat(unit, 'magic') * (skill.value || 0.7)); target.shield += shield; effects.push({ target: target, amount: shield, healing: true });
        message = unitName(unit) + ' 施放「' + skill.name + '」，為 ' + unitName(target) + ' 建立 ' + shield + ' 點護盾。';
      } else if (skill.effect === 'buff_atk') {
        target.atkBuff = 3; effects.push({ target: target, amount: 20, healing: true }); message = unitName(unit) + ' 強化 ' + unitName(target) + '，攻擊提升 20%。';
      } else {
        var total = 0; targets.forEach(function (ally) { var amount = healAmount(unit, ally, skill); total += amount; effects.push({ target: ally, amount: amount, healing: true }); });
        if (unit.team === 'ally') state.stats.healing += total;
        message = unitName(unit) + ' 詠唱「' + skill.name + '」，回復 ' + total + ' 點生命。';
      }
      audio.play('heal');
    } else {
      var targetsHit = skill.attackStyle === 'area' ? alive(target.team).filter(function (entry) { return distance(entry, target) <= (skill.radius || 1); }) : [target];
      var totalDamage = 0;
      targetsHit.forEach(function (enemy, index) {
        var result = damage(unit, enemy, skill, { counter: options.counter, secondary: index > 0 }); totalDamage += result.amount;
        anyCrit = anyCrit || result.crit;
        effects.push({ target: enemy, amount: result.amount, absorbed: result.absorbed, crit: result.crit, healing: false });
        passiveBurn(unit, enemy); applyStatus(unit, enemy, skill);
      });
      message = (options.counter ? '反擊！' : '') + unitName(unit) + ' 施放「' + skill.name + '」，造成 ' + totalDamage + ' 點傷害' + (anyCrit ? '（爆擊！）' : '') + (targetsHit.length > 1 ? '（命中 ' + targetsHit.length + ' 個目標）' : '') + '。';
      audio.play(skill.attackStyle === 'melee' ? 'attack' : 'ranged');
    }
    note(message); render();
    if (skill.attackStyle === 'melee' && casterPiece) {
      casterPiece.style.setProperty('--dash-x', (target.x - unit.x) * 42 + 'px'); casterPiece.style.setProperty('--dash-y', (target.y - unit.y) * 42 + 'px'); casterPiece.classList.add('dash');
    }
    await pause(150); effects.forEach(function (effect) { addVisual(effect.target, unit.p.element, skill, effect.amount, effect.healing, effect.absorbed, effect.crit); });
    if (effects.some(function (effect) { return !effect.healing; })) {
      dom.board.parentElement.parentElement.classList.add(anyCrit ? 'shake-hard' : 'shake'); audio.play(anyCrit ? 'crit' : 'hit');
    }
    var defeated = effects.filter(function (effect) { return !effect.healing && effect.target.hp <= 0; });
    defeated.forEach(function (effect) {
      var piece = dom.board.querySelector('[data-key="' + effect.target.key + '"]');
      if (piece) piece.classList.add('defeated');
      burst(effect.target, skill.vfxHue, 'death', effect.target.boss ? 26 : 14); impactRing(effect.target, skill.vfxHue);
    });
    await pause(330);
    if (casterPiece) { casterPiece.classList.remove('cast', 'dash'); }
    dom.board.parentElement.parentElement.classList.remove('shake', 'shake-hard');
    if ((skill.push || skill.pull) && target.hp > 0) await displace(unit, target, skill);
    if (defeated.length) await pause(160);

    if (!options.counter && skill.attackStyle !== 'support' && target.hp > 0 && canCounter(target, unit) && !state.over) {
      note(unitName(target) + ' 抓住破綻，發動反擊！'); render(); await act(target, unit, target.p.skills[0], 0, { counter: true, nested: true });
    }
    if (!options.nested) { state.animating = false; checkEnd(); if (!state.over) render(); }
  }

  function processRoundEffects() {
    var messages = [];
    alive('ally').concat(alive('enemy')).forEach(function (unit) {
      if (unit.burn > 0) { var burnDamage = Math.max(8, Math.round(unit.maxHp * 0.04)); unit.hp = Math.max(0, unit.hp - burnDamage); unit.burn--; messages.push(unitName(unit) + ' 受到 ' + burnDamage + ' 點灼燒傷害'); }
      if (unit.poison > 0) { var poisonDamage = Math.max(10, Math.round(unit.maxHp * 0.06)); unit.hp = Math.max(0, unit.hp - poisonDamage); unit.poison--; messages.push(unitName(unit) + ' 因中毒損失 ' + poisonDamage + ' 點生命'); }
      if (terrain(unit.x, unit.y) === 'fire' && unit.p.element !== 'fire') { var terrainDamage = Math.max(5, Math.round(unit.maxHp * 0.025)); unit.hp = Math.max(0, unit.hp - terrainDamage); messages.push(unitName(unit) + ' 被熔岩灼傷 ' + terrainDamage + ' 點'); }
      if (unit.atkBuff > 0) unit.atkBuff--;
      unit.shield = Math.max(0, Math.round(unit.shield * 0.8));
    });
    if (currentStage.mapId === 'rift' && state.round % 3 === 0) { state.riftPower += 0.08; messages.push('裂隙增幅：敵方傷害永久 +8%'); }
    if (messages.length) note(messages.join('；') + '。');
    checkEnd();
  }

  function maybeAutoEndAfterMoves() {
    if (state.autoEnding || state.phase !== 'player' || state.over || state.animating || !alive('ally').length || !alive('ally').every(function (unit) { return unit.moved; })) return;
    state.autoEnding = true; note('我方全員已移動，準備交由敵方行動。'); render();
    setTimeout(function () { state.autoEnding = false; if (!state.over && state.phase === 'player' && alive('ally').every(function (unit) { return unit.moved; })) endTurn(); }, duration(220));
  }

  function obstacleGlyph() {
    var theme = mapData().theme;
    return theme === 'ember' ? '🌋' : theme === 'verdant' ? '🌳' : theme === 'tide' ? '🪸' : '🔮';
  }

  var moveTargetMap = null; /* 每次 render 只做一次 BFS，供 900 格查表用 */
  function cell(x, y) {
    var element = document.createElement('div'), unit = at(x, y), active = selected(), tile = terrain(x, y); element.className = 'cell';
    if (obstacleAt(x, y)) {
      element.classList.add('obstacle'); element.title = '障礙物：阻擋移動與遠程視線';
      element.innerHTML = '<span class="obstacle-icon">' + obstacleGlyph() + '</span>';
      element.addEventListener('click', function () { note('障礙物無法通行，也會遮蔽遠程技能的視線。'); });
      return element;
    }
    if (tile) { element.classList.add('terrain-' + tile); element.title = tile === 'fire' ? '熔岩：火系增傷，非火系每回合受傷' : tile === 'forest' ? '森林：森林系防禦與治療提升' : '水域：海洋系移動與傷害提升'; element.innerHTML = '<span class="terrain-hint terrain-hint-' + tile + '"></span>'; }
    else element.innerHTML = '';
    if (state.phase === 'deploy' && inDeployZone(x, y) && !unit) element.classList.add('deploy-zone');
    if (threatTileMap && threatTileMap[x + ',' + y]) element.classList.add(threatTileMap[x + ',' + y] === 'move' ? 'threat-move' : 'threat-range');
    if (active && state.phase === 'deploy' && active.team === 'ally' && !unit && deployFits(active, x, y)) element.classList.add('move-target');
    if (active && state.phase === 'player' && !state.over) {
      if (state.mode === 'move' && !active.moved && moveTargetMap && moveTargetMap[x + ',' + y]) element.classList.add('move-target');
      if (state.mode === 'skill' && unit && !active.acted && canTarget(active, unit)) element.classList.add(skillOf(active).attackStyle === 'support' ? 'support-target' : 'attack-target');
    }
    element.addEventListener('click', function () { clickCell(x, y); });
    if (unit && unit.x === x && unit.y === y) element.appendChild(unitElement(unit));
    else if (unit) element.classList.add('covered');
    return element;
  }

  function unitElement(unit) {
    var element = document.createElement('button'); element.type = 'button'; element.className = 'unit ' + unit.team + ' size-' + unitSize(unit) + (state.selected === unit.key ? ' active' : '') + (unit.boss ? ' boss-unit' : '') + (unit.freeze > 0 ? ' frozen' : '') + (unit.poison > 0 ? ' poisoned' : ''); element.dataset.key = unit.key;
    element.setAttribute('aria-label', unit.p.name + '，生命 ' + unit.hp + ' / ' + unit.maxHp);
    var statuses = (unit.shield > 0 ? '🛡️' : '') + (unit.burn > 0 ? '🔥' : '') + (unit.poison > 0 ? '☠️' : '') + (unit.freeze > 0 ? '❄️' : '') + (unit.atkBuff > 0 ? '⬆️' : '');
    element.title = unit.p.name + '（' + unit.p.roleLabel + '）';
    element.innerHTML = '<span class="portrait" role="img" aria-label="' + unit.p.name + '" style="background-image:url(\'' + portrait(unit) + '\')"></span>' + (statuses ? '<span class="status-icons">' + statuses + '</span>' : '') + '<span class="unit-info"><span class="unit-health"><i style="width:' + (100 * unit.hp / unit.maxHp) + '%"></i></span></span>';
    element.addEventListener('click', function (event) {
      event.stopPropagation();
      if (cameraSuppressed()) return;
      if (state.mode === 'skill' && selected() && canTarget(selected(), unit)) { clickCell(unit.x, unit.y); return; }
      if (state.phase === 'deploy' && unit.team === 'ally') { state.selected = unit.key; note('已選擇 ' + unitName(unit) + '，點選左側部署格調整站位。'); render(); return; }
      if (unit.team === 'enemy' && unit.hp > 0 && (state.phase === 'player' || state.phase === 'deploy') && !state.animating) {
        state.threatKey = state.threatKey === unit.key ? null : unit.key; clearForecast(); audio.play('ui');
        note(state.threatKey ? unitName(unit) + ' 的威脅範圍：橘色＝可移動、紅色＝射程涵蓋。再點一次取消。' : '已關閉威脅範圍顯示。');
        render(); return;
      }
      if (unit.team === 'ally' && unit.hp > 0 && state.phase === 'player' && !state.over && !state.animating && !state.autoEnding) { state.selected = unit.key; state.mode = 'move'; clearForecast(); note('已選擇 ' + unitName(unit) + '。藍色格可移動，亦可直接選擇技能。'); render(); }
    }); return element;
  }

  var threatTileMap = null;
  function render() {
    moveTargetMap = null; threatTileMap = null;
    var active = selected();
    if (active && state.phase === 'player' && !state.over && state.mode === 'move' && !active.moved) {
      moveTargetMap = {};
      reachableTiles(active).forEach(function (tile) { if (tile.steps > 0) moveTargetMap[tile.x + ',' + tile.y] = true; });
    }
    if (state.threatKey) {
      var threatUnit = state.units.find(function (unit) { return unit.key === state.threatKey && unit.hp > 0; });
      if (threatUnit) threatTileMap = computeThreat(threatUnit); else state.threatKey = null;
    }
    if (state.pendingTarget) {
      var pendingUnit = state.units.find(function (unit) { return unit.key === state.pendingTarget && unit.hp > 0; });
      if (!pendingUnit || !active || active.acted || state.mode !== 'skill' || state.phase !== 'player') clearForecast();
    } else { var panel = document.getElementById('forecast'); if (panel && !panel.hidden) panel.hidden = true; }
    var fragment = document.createDocumentFragment();
    for (var y = 0; y < ROWS; y++) for (var x = 0; x < COLS; x++) fragment.appendChild(cell(x, y));
    dom.board.innerHTML = ''; dom.board.appendChild(fragment);
    renderMinimap();
    renderParty(); renderTrait(); renderDetail(); renderTurnOrder(); renderBossBar();
    dom.banner.textContent = state.over ? '戰鬥結束' : state.phase === 'deploy' ? '部署階段' : '第 ' + state.round + ' 回合｜' + (state.phase === 'player' ? '我方行動' : '敵方行動');
    dom.roundStatus.textContent = state.over ? '結算完成' : state.phase === 'deploy' ? '自由部署' : state.phase === 'player' ? '我方回合' : '敵方回合';
    dom.endTurn.textContent = state.phase === 'deploy' ? '⚔️ 開始戰鬥' : '結束本回合';
    dom.endTurn.disabled = state.over || state.animating || (state.phase !== 'player' && state.phase !== 'deploy');
  }

  function renderBossBar() {
    if (!dom.bossBar) return;
    var boss = state.units.find(function (unit) { return unit.boss; });
    if (!boss || !currentStage.boss) { dom.bossBar.hidden = true; return; }
    dom.bossBar.hidden = false;
    dom.bossName.textContent = '👑 ' + boss.p.name;
    dom.bossHpFill.style.width = (100 * boss.hp / boss.maxHp) + '%';
    dom.bossBar.classList.toggle('boss-low', boss.hp / boss.maxHp < 0.35);
  }

  function renderParty() {
    dom.list.innerHTML = '';
    state.units.filter(function (unit) { return unit.team === 'ally'; }).forEach(function (unit) {
      var card = document.createElement('button'); card.type = 'button'; card.className = 'party-card' + (state.selected === unit.key ? ' selected' : '') + (unit.hp <= 0 ? ' dead' : ''); card.disabled = unit.hp <= 0;
      card.innerHTML = '<div class="party-name">' + unit.p.name + (unitSize(unit) > 1 ? ' ⬛2×2' : '') + '</div><div class="party-meta">' + unit.p.roleLabel + '｜★' + progression.starOf(unit.id) + '｜融合 ' + (progress.fusion[unit.id] || 0) + '</div><div class="hpbar"><i style="width:' + (100 * unit.hp / unit.maxHp) + '%"></i></div>';
      card.onclick = function () { if ((state.phase === 'player' || state.phase === 'deploy') && !state.over && !state.animating) { state.selected = unit.key; state.mode = 'move'; render(); } }; dom.list.appendChild(card);
    });
  }
  function renderTrait() { var trait = traitFor('ally'); dom.teamTrait.innerHTML = '<b>✦ ' + trait.label + '</b><span>' + trait.copy + '</span>'; }
  function renderTurnOrder() {
    var units = alive('ally').concat(alive('enemy')).sort(function (a, b) { return b.p.stats.speed - a.p.stats.speed; });
    dom.turnOrder.innerHTML = '<b>速度行動序列</b><div class="order-chips">' + units.map(function (unit) {
      return '<span class="order-chip ' + unit.team + (unit.acted ? ' done' : '') + (unit.boss ? ' boss' : '') + '" title="' + unit.p.name + '｜速度 ' + unit.p.stats.speed + '"><i style="background-image:url(\'' + portrait(unit) + '\')"></i><small>' + unit.p.stats.speed + '</small></span>';
    }).join('') + '</div>';
  }
  function renderDetail() {
    var unit = selected(); dom.skills.innerHTML = ''; dom.evolution.innerHTML = '';
    if (!unit) { dom.detail.textContent = state.phase === 'deploy' ? '點選我方幻獸並選擇部署格。' : '點選我方幻獸查看能力。'; return; }
    var passive = unit.p.passives.map(function (entry) { return entry.name; }).join('、') || '無';
    var statusText = [];
    if (unit.freeze > 0) statusText.push('❄ 冰凍 ' + unit.freeze);
    if (unit.poison > 0) statusText.push('☠ 中毒 ' + unit.poison);
    if (unit.burn > 0) statusText.push('🔥 灼燒 ' + unit.burn);
    dom.detail.innerHTML = '<div class="detail-head"><span class="detail-face" style="background-image:url(\'' + portrait(unit) + '\')"></span><div class="detail-title"><strong>' + unit.p.name + '</strong><small>' + unit.p.roleLabel + '｜' + unit.p.evolution[Math.min(unit.evolution, unit.p.evolution.length) - 1].label + '</small><span class="detail-hp"><i style="width:' + (100 * unit.hp / unit.maxHp) + '%"></i></span></div></div>被動：' + passive + (statusText.length ? '<br>狀態：' + statusText.join('、') : '') + '<div class="stat-grid"><span>力量 ' + Math.round(stat(unit, 'power')) + '</span><span>魔力 ' + Math.round(stat(unit, 'magic')) + '</span><span>防衛 ' + Math.round(stat(unit, 'defense')) + '</span><span>速度 ' + unit.p.stats.speed + '</span><span>血量 ' + unit.hp + '/' + unit.maxHp + '</span><span>移動 ' + moveRange(unit) + ' 格</span></div>';
    if (unit.team !== 'ally') return;
    unit.p.evolution.forEach(function (entry) {
      var button = document.createElement('button'), unlocked = progression.evolutionUnlocked(unit.id, entry.stage), cost = progression.evolutionCost(entry.stage);
      button.className = 'evolution-btn' + (unit.evolution === entry.stage ? ' active' : ''); button.disabled = unit.acted || state.phase === 'enemy' || state.over || state.animating;
      button.textContent = entry.stage + '．' + entry.label + (unlocked ? '' : ' 🔒' + cost.medals + '🏅'); button.onclick = function () { setEvolution(unit, entry.stage); }; dom.evolution.appendChild(button);
    });
    unit.p.skills.forEach(function (skill, index) {
      var button = document.createElement('button'), cooldown = unit.cooldowns[index] || 0; button.className = 'skill' + (state.mode === 'skill' && state.skill === index ? ' active' : '');
      button.disabled = unit.acted || cooldown > 0 || state.phase !== 'player' || state.over || state.animating;
      var extras = (skill.status === 'freeze' ? '❄' : skill.status === 'poison' ? '☠' : skill.status === 'burn' ? '🔥' : '') + (skill.push ? '💨' : '') + (skill.pull ? '🪝' : '');
      button.textContent = (index + 1) + '．' + skill.name + extras + '｜' + (skill.attackStyle === 'support' ? '輔助' : skill.attackStyle === 'area' ? '範圍' : '射程 ' + skillRange(unit, skill)) + (cooldown ? '（冷卻 ' + cooldown + '）' : '');
      button.onclick = function () { state.selected = unit.key; state.mode = 'skill'; state.skill = index; clearForecast(); audio.play('ui'); note('已選擇「' + skill.name + '」，請點選高亮的' + (skill.attackStyle === 'support' ? '我方' : '敵方') + '目標。'); render(); }; dom.skills.appendChild(button);
    });
    // 待機／取消移動（參考 SRPG 行動指令）
    if (state.phase === 'player' && !state.over && !unit.acted) {
      var actions = document.createElement('div'); actions.className = 'unit-actions';
      var wait = document.createElement('button'); wait.type = 'button'; wait.className = 'secondary'; wait.textContent = '🕒 待機';
      wait.disabled = state.animating;
      wait.onclick = function () { if (state.animating || unit.acted) return; unit.moved = true; unit.acted = true; clearForecast(); audio.play('ui'); note(unitName(unit) + ' 選擇待機。'); render(); maybeAutoEndAfterMoves(); };
      actions.appendChild(wait);
      if (unit.moved && unit.prevX !== undefined && !state.animating) {
        var undo = document.createElement('button'); undo.type = 'button'; undo.className = 'secondary'; undo.textContent = '↩ 取消移動';
        undo.onclick = function () {
          if (state.animating || unit.acted || at(unit.prevX, unit.prevY)) return;
          unit.x = unit.prevX; unit.y = unit.prevY; unit.moved = false; unit.prevX = undefined; unit.prevY = undefined;
          clearForecast(); audio.play('ui'); note(unitName(unit) + ' 退回原位，可重新規劃。'); render(); focusUnit(unit, false);
        };
        actions.appendChild(undo);
      }
      dom.skills.appendChild(actions);
    }
  }

  function setEvolution(unit, stage) {
    if (unit.evolution === stage) return;
    if (!progression.evolutionUnlocked(unit.id, stage)) {
      var result = progression.unlockEvolution(unit.p, stage); if (!result.ok) { note(result.reason + '。可在「融合與技能樹」查看材料。'); audio.play('ui'); return; }
      renderProgress(); audio.play('unlock'); note(unitName(unit) + ' 解鎖了' + unit.p.evolution[stage - 1].label + '！');
    }
    var ratio = unit.hp / unit.maxHp; unit.evolution = stage; unit.maxHp = Math.round(unit.p.stats.health * evolutionMultiplier(unit) * (1 + bonusValue(unit, 'health'))); unit.hp = Math.max(1, Math.round(unit.maxHp * ratio)); render();
  }

  async function clickCell(x, y) {
    if (cameraSuppressed()) return;
    var unit = selected(), target = at(x, y);
    if (state.phase === 'deploy') {
      if (unit && unit.team === 'ally' && !target && deployFits(unit, x, y)) { unit.x = x; unit.y = y; audio.play('move'); note(unitName(unit) + ' 部署到 ' + (x + 1) + '-' + (y + 1) + '。'); render(); }
      return;
    }
    if (!unit || state.phase !== 'player' || state.over || state.animating || state.autoEnding) return;
    if (state.mode === 'move' && !unit.moved && canMove(unit, x, y)) { clearForecast(); await walkUnit(unit, x, y); return; }
    if (state.mode === 'skill' && !unit.acted && target && canTarget(unit, target)) {
      if (autoTimer) { await act(unit, target, skillOf(unit), state.skill); return; }
      // 出手確認流程：第一次點目標顯示戰鬥預測，再點一次（或按執行）才施放。
      if (state.pendingTarget === target.key) { clearForecast(); await act(unit, target, skillOf(unit), state.skill); return; }
      state.pendingTarget = target.key; audio.play('ui'); showForecast(unit, target, skillOf(unit));
      note('確認對 ' + unitName(target) + ' 施放「' + skillOf(unit).name + '」？再點一次目標或按「執行」。');
    }
  }

  function closest(unit, units) { return units.slice().sort(function (a, b) { return distance(unit, a) - distance(unit, b); })[0]; }

  /* AI 核心：對每個可到達位置 × 每個可用技能 × 每個目標做聯合評估。
     考量：擊殺、集火殘血、元素克制、範圍命中數、控場價值、地形加成與脆皮距離控管。 */
  function estimateDamage(unit, target, skill, fromX, fromY) {
    var magic = skill.attackStyle === 'ranged' || skill.attackStyle === 'area';
    var raw = (magic ? stat(unit, 'magic') : stat(unit, 'power')) * combatMultiplier(unit) * terrainAttackMultiplier(unit, fromX, fromY) * (skill.multiplier || 1.05);
    raw *= elementalMultiplier(unit, target);
    if (unit.atkBuff > 0) raw *= 1.2;
    if (unit.team === 'enemy') raw *= 1 + state.riftPower;
    return Math.max(12, Math.round(raw - stat(target, 'defense') * 0.55));
  }
  function fragileRole(unit) { return unit.p.role === 'healer' || unit.p.role === 'support' || unit.p.attackStyle === 'ranged'; }
  function tilePositionScore(unit, tile, opponents) {
    var score = 0, tileTerrain = terrain(tile.x, tile.y);
    if ((tileTerrain === 'fire' && unit.p.element === 'fire') || (tileTerrain === 'forest' && unit.p.element === 'forest') || (tileTerrain === 'water' && unit.p.element === 'ocean')) score += 5;
    if (tileTerrain === 'fire' && unit.p.element !== 'fire') score -= 7;
    if (fragileRole(unit) && opponents.length) {
      var nearest = Math.min.apply(null, opponents.map(function (entry) { return Math.abs(entry.x - tile.x) + Math.abs(entry.y - tile.y); }));
      score += Math.min(nearest, 4) * 2;
    }
    /* 殘血自保：往治療者靠攏、拉開與敵人的距離。 */
    if (unit.hp < unit.maxHp * 0.4) {
      var healer = nearestHealer(unit);
      if (healer) score += Math.max(0, 7 - (Math.abs(healer.x - tile.x) + Math.abs(healer.y - tile.y))) * 2.5;
      if (opponents.length) {
        var closestEnemy = Math.min.apply(null, opponents.map(function (entry) { return Math.abs(entry.x - tile.x) + Math.abs(entry.y - tile.y); }));
        score += Math.min(closestEnemy, 5) * 2;
      }
    }
    return score;
  }
  function planFor(unit, targetTeam) {
    var opponents = alive(targetTeam), friends = alive(unit.team), tiles = reachableTiles(unit), best = null;
    if (unit.moved) tiles = [{ x: unit.x, y: unit.y, steps: 0 }];
    tiles.forEach(function (tile) {
      var positionScore = tilePositionScore(unit, tile, opponents);
      unit.p.skills.forEach(function (skill, index) {
        if (unit.cooldowns[index] > 0) return;
        var virtual = { x: tile.x, y: tile.y, p: unit.p, team: unit.team };
        if (skill.attackStyle === 'support') {
          friends.forEach(function (friend) {
            var needs = friend.hp < friend.maxHp * 0.92 || skill.effect === 'shield' || skill.effect === 'buff_atk';
            if (!needs || distance(virtual, friend) > skillRange(unit, skill)) return;
            var missing = 1 - friend.hp / friend.maxHp;
            var score = positionScore + (skill.effect === 'heal' || skill.effect === 'heal_all' ? 12 + missing * 80 : 16 + missing * 12) + (friend.boss ? 4 : 0);
            if (skill.effect === 'heal_all') score += friends.filter(function (entry) { return entry.hp < entry.maxHp; }).length * 8;
            if (missing < 0.08 && skill.effect !== 'shield' && skill.effect !== 'buff_atk') return;
            if (!best || score > best.score) best = { tile: tile, skill: skill, index: index, target: friend, score: score };
          });
          return;
        }
        opponents.forEach(function (target) {
          if (distance(virtual, target) > skillRange(unit, skill)) return;
          if (!hasSight(virtual, target, skill, tile.x, tile.y)) return;
          var expected = estimateDamage(unit, target, skill, tile.x, tile.y), score = positionScore + expected / Math.max(1, target.maxHp) * 55;
          if (skill.attackStyle === 'area') {
            var splash = opponents.filter(function (entry) { return entry !== target && distance(entry, target) <= (skill.radius || 1); }).length;
            score += splash * 12;
          }
          if (expected >= target.hp) score += 60;
          score += (1 - target.hp / target.maxHp) * 22;
          if (skill.status && !(target[skill.status === 'burn' ? 'burn' : skill.status] > 0) && !target.boss) score += 14;
          if ((skill.push || skill.pull) && !target.boss) score += 6;
          if (target.boss) score += 5;
          if (skill.kind === 'ultimate') score += 4;
          if (!best || score > best.score) best = { tile: tile, skill: skill, index: index, target: target, score: score };
        });
      });
    });
    return best;
  }
  async function executePlan(unit, plan) {
    if (plan.tile && (plan.tile.x !== unit.x || plan.tile.y !== unit.y)) await walkUnit(unit, plan.tile.x, plan.tile.y);
    else unit.moved = true;
    if (!state.over && unit.hp > 0 && plan.target.hp > 0) await act(unit, plan.target, plan.skill, plan.index);
    else unit.acted = true;
  }
  async function advanceToward(unit, target) {
    var tiles = reachableTiles(unit), targetDistance = function (tile) { return Math.abs(tile.x - target.x) + Math.abs(tile.y - target.y); };
    tiles.sort(function (a, b) { return targetDistance(a) - targetDistance(b) || a.steps - b.steps; });
    if (tiles.length && targetDistance(tiles[0]) < distance(unit, target)) { await walkUnit(unit, tiles[0].x, tiles[0].y); return true; }
    unit.moved = true; maybeAutoEndAfterMoves(); return false;
  }

  function scheduleAuto() { if (!autoTimer) return; clearTimeout(autoTimer); autoTimer = setTimeout(autoStep, duration(210)); }
  async function autoStep() {
    if (!autoTimer || state.over) { if (state.over) stopAuto(); return; }
    if (state.phase === 'deploy') { await startBattle(); scheduleAuto(); return; }
    if (state.animating || state.autoEnding || state.phase !== 'player') { scheduleAuto(); return; }
    var unit = alive('ally').find(function (entry) { return !entry.acted; });
    if (!unit) { await endTurn(); scheduleAuto(); return; }
    if (unit.freeze > 0) { unit.moved = true; unit.acted = true; note(unitName(unit) + ' 被冰凍，無法行動。'); render(); scheduleAuto(); return; }
    state.selected = unit.key;
    var plan = planFor(unit, 'enemy');
    if (plan) await executePlan(unit, plan);
    else if (!unit.moved && unit.hp < unit.maxHp * 0.4 && nearestHealer(unit) && distance(unit, closest(unit, alive('enemy')) || unit) > 2) {
      /* 殘血且未接戰：撤向治療者等待救援。 */
      await advanceToward(unit, nearestHealer(unit)); unit.acted = true; note(unitName(unit) + ' 撤向後方尋求治療。'); render();
    }
    else if (!unit.moved && alive('enemy').length) { await advanceToward(unit, closest(unit, alive('enemy'))); var retry = planFor(unit, 'enemy'); if (retry) await executePlan(unit, retry); else { unit.acted = true; render(); } }
    else { unit.acted = true; note(unitName(unit) + ' 沒有可用目標，結束本次行動。'); render(); }
    scheduleAuto();
  }
  function stopAuto() { if (autoTimer) clearTimeout(autoTimer); autoTimer = null; dom.auto.classList.remove('active'); dom.auto.textContent = '🤖 AUTO'; }
  function toggleAuto() { audio.unlock(); if (autoTimer) { stopAuto(); return; } clearForecast(); autoTimer = setTimeout(autoStep, 10); dom.auto.classList.add('active'); dom.auto.textContent = '🤖 AUTO ✓'; note('AUTO 啟動：AI 會評估走位、視線、集火與控場時機。'); }
  function cycleSpeed() { var speeds = [1, 1.5, 2], index = speeds.indexOf(battleSpeed); battleSpeed = speeds[(index + 1) % speeds.length]; document.documentElement.style.setProperty('--battle-rate', 1 / battleSpeed); dom.speed.textContent = '⚡ ' + battleSpeed + '×'; if (autoTimer) scheduleAuto(); audio.play('ui'); }

  async function endTurn() {
    if (state.phase === 'deploy') { await startBattle(); return; }
    if (state.phase !== 'player' || state.over || state.animating) return;
    clearForecast(); state.threatKey = null;
    state.phase = 'enemy'; state.selected = null; render();
    phaseBanner('🛡 敵方回合｜ENEMY PHASE', 'enemy');
    await pause(560); await enemyTurn();
  }
  /* 警戒圈＋分批推進：小隊被驚動（成員受傷／我方進入 7 格）立即出擊；
     否則依小隊編號分波，時間到自動向我方推進，避免敵方永遠龜守。 */
  function squadActive(enemy, allies) {
    if (state.round >= 5 + (enemy.squad || 0) * 3) return true; /* 分批推進波次 */
    return state.units.some(function (member) {
      return member.team === 'enemy' && member.squad === enemy.squad && member.hp > 0 &&
        (member.hp < member.maxHp || allies.some(function (ally) { return distance(ally, member) <= AGGRO_RANGE; }));
    });
  }
  function nearestHealer(unit) {
    var healers = alive(unit.team).filter(function (entry) { return entry !== unit && (entry.p.role === 'healer' || entry.p.role === 'support'); });
    return healers.sort(function (a, b) { return distance(unit, a) - distance(unit, b); })[0] || null;
  }
  async function enemyTurn() {
    var enemies = alive('enemy').sort(function (a, b) { return b.p.stats.speed - a.p.stats.speed; });
    for (var index = 0; index < enemies.length; index++) {
      var enemy = enemies[index]; if (enemy.hp <= 0 || state.over) break;
      var targets = alive('ally'); if (!targets.length) break;
      if (!squadActive(enemy, targets)) continue; /* 未進入警戒圈：駐守 */
      focusUnit(enemy, false);
      if (enemy.freeze > 0) { enemy.freeze--; note(unitName(enemy) + ' 被冰凍，無法行動。'); statusLabel(enemy, '❄ 冰凍中'); render(); await pause(240); continue; }
      var plan = planFor(enemy, 'ally');
      if (plan) await executePlan(enemy, plan);
      else if (!enemy.moved) { await advanceToward(enemy, closest(enemy, targets)); var retry = planFor(enemy, 'ally'); if (retry) await executePlan(enemy, retry); else { enemy.acted = true; note(unitName(enemy) + ' 逼近我方陣線。'); render(); await pause(100); } }
      else { enemy.acted = true; note(unitName(enemy) + ' 無法接近目標。'); render(); await pause(100); }
    }
    if (!state.over) {
      state.phase = 'player'; state.round++;
      alive('ally').concat(alive('enemy')).forEach(function (unit) {
        unit.moved = false; unit.acted = false; unit.cooldowns = unit.cooldowns.map(function (cooldown) { return Math.max(0, cooldown - 1); });
        if (unit.team === 'ally' && unit.freeze > 0) { unit.moved = true; unit.acted = true; unit.freeze--; }
      });
      alive('ally').concat(alive('enemy')).forEach(function (unit) { unit.prevX = undefined; unit.prevY = undefined; });
      processRoundEffects();
      if (!state.over && state.round > HARD_ROUND_LIMIT) finishBattle(false, '超過 ' + HARD_ROUND_LIMIT + ' 回合上限，遠征隊撤退。');
      else if (!state.over) { if (!dom.log.textContent.includes('灼') && !dom.log.textContent.includes('毒')) note('輪到我方，請規劃本回合行動。'); render(); phaseBanner('⚔ 第 ' + state.round + ' 回合｜PLAYER PHASE', 'player'); }
    }
  }

  function checkEnd() {
    if (state.over) return true;
    if (currentStage.boss && !state.units.some(function (unit) { return unit.boss && unit.hp > 0; })) { finishBattle(true, '頭目已被擊破，殘餘魔物潰逃——遠征勝利！'); return true; }
    if (!alive('enemy').length) { finishBattle(true); return true; }
    if (!alive('ally').length) { finishBattle(false); return true; }
    return false;
  }
  function finishBattle(win, reason) {
    if (state.resultRecorded) return; state.resultRecorded = true; state.over = true; stopAuto();
    var bossDefeated = win && currentStage.boss;
    var reward;
    if (currentStage.tower) {
      var towerResult = progression.completeTower(currentStage.floor, win);
      reward = win ? { stars: 1, medals: 0, essence: towerResult.reward.essence, fusionCore: 0, crystals: towerResult.reward.crystals, gold: towerResult.reward.gold, firstClear: false } : {};
    } else {
      var summary = { win: win, round: state.round, survivors: alive('ally').length, partySize: partyIds.length, bossKill: bossDefeated };
      reward = progression.completeBattle(currentStage, summary);
    }
    state.reward = reward;
    renderProgress(); render(); note(reason || (win ? '勝利！獎勵已加入戰棋資源。' : '戰敗。調整隊伍、進化或技能樹後再次挑戰。'));
    audio.play(win ? 'victory' : 'defeat'); setTimeout(function () { showResult(win); }, duration(420));
  }
  function showResult(win) {
    var survivors = alive('ally').length, reward = state.reward || {};
    dom.resultIcon.textContent = win ? '🏆' : '🌙'; dom.resultStage.textContent = mapData().name + '｜' + currentStage.name; dom.resultTitle.textContent = win ? '遠征勝利' : '本次撤退';
    dom.resultCopy.textContent = win ? (reward.firstClear ? '首次通關完成，已解鎖下一個關卡。' : '重複挑戰完成，取得部分固定資源。') : '可先調整隊伍、融合階級與技能樹再挑戰。';
    dom.resultStats.innerHTML = '<span><b>' + state.round + '</b>回合</span><span><b>' + state.stats.damage + '</b>傷害</span><span><b>' + survivors + '/' + partyIds.length + '</b>存活</span>';
    dom.resultRewards.textContent = win
      ? '★'.repeat(reward.stars || 1) + (reward.medals ? '　🏅 +' + reward.medals : '') + (reward.essence ? '　🔷 +' + reward.essence : '') + (reward.fusionCore ? '　🧬 +' + reward.fusionCore : '') + (reward.crystals ? '　💎 +' + reward.crystals : '') + (reward.gold ? '　🪙 +' + reward.gold : '')
      : '本次沒有取得掉落物';
    if (currentStage.tower) {
      dom.resultCopy.textContent = win ? '第 ' + currentStage.floor + ' 層攻略完成！歷史最高 ' + progress.tower.best + ' 層。' : '止步於第 ' + currentStage.floor + ' 層，強化後再來挑戰。';
      document.getElementById('result-next').textContent = '⬆ 挑戰第 ' + (currentStage.floor + 1) + ' 層';
      document.getElementById('result-next').hidden = !win;
    } else {
      document.getElementById('result-next').textContent = '下一關';
      document.getElementById('result-next').hidden = !win || currentStage.order >= 110;
    }
    setView('result');
  }

  function renderProgress() {
    var totalEssence = progress.essences.fire + progress.essences.forest + progress.essences.ocean;
    var crystals = document.getElementById('crystals'); if (crystals) { crystals.textContent = '💎 ' + progress.crystals; crystals.title = '召喚水晶'; }
    var gold = document.getElementById('gold'); if (gold) { gold.textContent = '🪙 ' + progress.gold; gold.title = '金幣'; }
    var towerBest = document.getElementById('tower-best'); if (towerBest) towerBest.textContent = '最高 ' + progress.tower.best + ' 層';
    dom.medals.textContent = '🏅 ' + progress.medals; dom.medals.title = '戰術徽章'; dom.essences.textContent = '🔷 ' + totalEssence; dom.essences.title = '元素精華總量'; dom.fusionCores.textContent = '🧬 ' + progress.fusionCores; dom.fusionCores.title = '融合核心'; dom.sound.textContent = progress.sound ? '🔊' : '🔇'; dom.sound.setAttribute('aria-pressed', String(!progress.sound));
    var completed = content.quests.filter(function (quest) { return progression.questProgress(quest) >= quest.target && !progress.questClaims[quest.id]; }).length;
    var mainStages = content.stages.filter(function (stage) { return !stage.hard; });
    var clearedMain = mainStages.filter(function (stage) { return progress.cleared[stage.id]; }).length;
    dom.questSummary.innerHTML = '<b>遠征任務</b><br>' + (completed ? completed + ' 個獎勵可領取' : '主線 ' + clearedMain + '/' + mainStages.length + ' 關已通過') + '｜勝場 ' + progress.wins;
  }
  function renderCampaignMeta() {
    var map = mapData(); dom.mapEyebrow.textContent = map.icon + ' ' + map.name + '｜30 × 30 大戰場'; dom.stageTitle.textContent = map.name + '：' + currentStage.name; dom.stageDescription.textContent = map.description;
    dom.stageBadge.textContent = currentStage.difficulty; dom.stageObjective.textContent = '目標：' + currentStage.objective;
    dom.stageProgress.textContent = currentStage.tower ? '無限塔・歷史最高 ' + progress.tower.best + ' 層' : '第 ' + currentStage.chapter + ' 章／10・' + (currentStage.hard ? 'HARD 特別關' : currentStage.boss ? '魔王關' : '第 ' + currentStage.index + ' 關');
    dom.battleStageLabel.textContent = map.icon + ' ' + map.name + '：' + currentStage.name + '｜' + currentStage.difficulty;
  }

  /* 關卡地圖：章節分頁 + 節點路徑（參考手遊 SRPG 的關卡選擇畫面）。 */
  var campaignChapter = null;
  function openCampaign() { campaignChapter = currentStage.mapId; renderCampaign(); dom.campaignModal.hidden = false; audio.play('ui'); }
  function stageNode(stage) {
    var unlocked = progression.isStageUnlocked(stage.id), cleared = Boolean(progress.cleared[stage.id]);
    var stars = cleared ? '★'.repeat(progress.bestStars[stage.id] || 1) + '☆'.repeat(3 - (progress.bestStars[stage.id] || 1)) : unlocked ? '—' : '';
    var label = stage.hard ? '🔥' : stage.boss ? '👑' : stage.index;
    return '<div class="stage-node-slot ' + (stage.index % 2 ? 'raise' : 'drop') + '">' +
      '<button type="button" class="stage-node' + (stage.id === currentStage.id ? ' current' : '') + (cleared ? ' cleared' : '') + (stage.boss ? ' boss-node' : '') + (stage.hard ? ' hard-node' : '') + (unlocked ? '' : ' locked') + '" data-stage="' + stage.id + '" ' + (unlocked ? '' : 'disabled') + '>' +
      '<i>' + (unlocked ? label : '🔒') + '</i></button>' +
      '<b>' + stage.name.split('・')[1] + '</b><small>' + stage.difficulty + '｜敵 ' + (stage.enemyCount || stage.enemies.length) + '</small><span class="node-stars">' + stars + '</span></div>';
  }
  function renderCampaign() {
    var chapter = content.mapById(campaignChapter) || content.maps[0];
    var tabs = content.maps.map(function (map, index) {
      var main = content.stages.filter(function (stage) { return stage.mapId === map.id && !stage.hard; });
      var clearedCount = main.filter(function (stage) { return progress.cleared[stage.id]; }).length;
      var unlocked = progression.isStageUnlocked(main[0].id);
      return '<button type="button" class="chapter-tab' + (map.id === chapter.id ? ' active' : '') + '" data-chapter="' + map.id + '" ' + (unlocked ? '' : 'disabled') + '>' +
        '<i>' + map.icon + '</i><b>第 ' + (index + 1) + ' 章</b><small>' + map.name + '</small><span>' + clearedCount + '/11</span></button>';
    }).join('');
    var mainStages = content.stages.filter(function (stage) { return stage.mapId === chapter.id && !stage.hard; });
    var hardStages = content.stages.filter(function (stage) { return stage.mapId === chapter.id && stage.hard; });
    var mainNodes = mainStages.map(stageNode).join('<i class="node-link"></i>');
    var hardNodes = hardStages.map(stageNode).join('<i class="node-link hard-link"></i>');
    var bossCleared = Boolean(progress.cleared[chapter.id + '-boss']);
    dom.campaignGrid.innerHTML = '<div class="chapter-tabs">' + tabs + '</div>' +
      '<p class="chapter-copy">' + chapter.icon + ' ' + chapter.description + '</p>' +
      '<div class="stage-path map-path-' + chapter.theme + '">' + mainNodes + '</div>' +
      '<p class="hard-title">🔥 HARD 特別關' + (bossCleared ? '（已解鎖）' : '（擊敗本章魔王後解鎖）') + '</p>' +
      '<div class="stage-path hard-path">' + hardNodes + '</div>';
    dom.campaignGrid.querySelectorAll('.chapter-tab').forEach(function (tab) {
      tab.onclick = function () { campaignChapter = tab.dataset.chapter; audio.play('ui'); renderCampaign(); };
    });
    dom.campaignGrid.querySelectorAll('.stage-node').forEach(function (node) {
      node.onclick = function () {
        var stage = content.stageById(node.dataset.stage);
        progression.selectStage(stage.id); currentStage = stage; dom.campaignModal.hidden = true; audio.play('ui');
        reset(stage.id); if (currentView !== 'home') setView('home');
      };
    });
  }

  function openGrowth() {
    var roster = progression.ownedPets();
    if (!progression.owns(growthPetId)) growthPetId = (roster[0] || {}).id || partyIds[0];
    dom.growthPet.innerHTML = roster.map(function (pet) { return '<option value="' + pet.id + '"' + (pet.id === growthPetId ? ' selected' : '') + '>' + pet.name + '｜' + pet.roleLabel + '</option>'; }).join('');
    renderGrowth(); dom.growthModal.hidden = false; audio.play('ui');
  }
  function renderGrowth() {
    var pet = window.TACTICAL_PET_DATA.find(function (entry) { return entry.id === growthPetId; }), fusion = progress.fusion[pet.id] || 0, stage = portraitStage(pet.id), points = progress.skillPoints[pet.id] || 0, essence = progress.essences[pet.element] || 0, nextStage = stage + 1, evolutionCost = progression.evolutionCost(nextStage);
    var star = progression.starOf(pet.id), starCost = progression.starCost(pet.id), copies = progress.copies[pet.id] || 0;
    var starText = starCost
      ? '⭐ 升 ' + starCost.nextStar + ' 星（複製體 ' + starCost.copies + '／🪙 ' + starCost.gold + '，持有複製體 ' + copies + '）'
      : '⭐ 已達 9 星上限';
    dom.growthContent.innerHTML = '<div class="growth-overview"><div class="growth-portrait" style="background-image:url(\'' + pet.evolution[stage - 1].portrait + '\')"></div><div><h3>' + pet.name + '｜' + pet.roleLabel + '　<span class="star-row">' + (star ? '★'.repeat(star) : '☆ 0 星') + '</span></h3><div class="growth-meta"><span>星級 ' + star + '/9（每星全能力 +10%）</span><span>進化 ' + stage + '/3</span><span>融合 ' + fusion + '/3</span><span>技能點 ' + points + '</span><span>元素精華 ' + essence + '</span></div><p>星級消耗同幻獸複製體（召喚重複取得）與金幣；融合永久 +4% 並給 1 技能點。</p></div></div><div class="growth-actions"><button id="growth-star">' + starText + '</button><button id="growth-fuse">🧬 融合升階（核心 ' + (2 + fusion) + '／精華 ' + (6 + fusion * 3) + '）</button><button id="growth-evolve">✨ ' + (nextStage > 3 ? '已達最終進化' : '解鎖' + pet.evolution[nextStage - 1].label + '（' + evolutionCost.medals + '🏅／' + evolutionCost.essence + '精華）') + '</button></div><h3>技能樹</h3><div id="skill-tree" class="skill-tree"></div>';
    document.getElementById('growth-star').disabled = !starCost;
    document.getElementById('growth-star').onclick = function () { var result = progression.starUp(pet.id); if (!result.ok) return growthMessage(result.reason); audio.play('unlock'); renderProgress(); renderGrowth(); growthMessage('升星成功！目前 ' + result.star + ' 星，全能力 +' + result.star * 10 + '%。'); };
    document.getElementById('growth-fuse').disabled = fusion >= 3; document.getElementById('growth-fuse').onclick = function () { var result = progression.fuse(pet); if (!result.ok) return growthMessage(result.reason); audio.play('unlock'); renderProgress(); renderGrowth(); growthMessage('融合成功，全能力提升並獲得 1 技能點。'); };
    document.getElementById('growth-evolve').disabled = nextStage > 3; document.getElementById('growth-evolve').onclick = function () { var result = progression.unlockEvolution(pet, nextStage); if (!result.ok) return growthMessage(result.reason); audio.play('unlock'); renderProgress(); renderGrowth(); growthMessage('進化階段已永久解鎖。'); };
    var tree = document.getElementById('skill-tree'), unlocked = progress.skillTree[pet.id] || [];
    progression.treeFor(pet).forEach(function (node) { var button = document.createElement('button'), active = unlocked.indexOf(node.id) >= 0; button.className = 'tree-node ' + (active ? 'unlocked' : node.requires && unlocked.indexOf(node.requires) < 0 ? 'locked' : ''); button.disabled = active; button.innerHTML = '<b>' + (active ? '✓ ' : '') + node.name + '</b><small>' + node.description + '<br>需要 ' + node.cost + ' 技能點</small>'; button.onclick = function () { var result = progression.unlockSkill(pet, node.id); if (!result.ok) return growthMessage(result.reason); audio.play('unlock'); renderGrowth(); growthMessage('技能節點已啟用。'); }; tree.appendChild(button); });
    renderQuests();
  }
  function growthMessage(message) { note(message); dom.growthFeedback.textContent = message; }
  function renderQuests() {
    dom.questList.innerHTML = '';
    content.quests.forEach(function (quest) { var value = progression.questProgress(quest), claimed = Boolean(progress.questClaims[quest.id]), ready = value >= quest.target, rewardText = (quest.reward.medals ? quest.reward.medals + '🏅 ' : '') + (quest.reward.fusionCore ? quest.reward.fusionCore + '🧬 ' : '') + (quest.reward.skillPoints ? quest.reward.skillPoints + '技能點' : ''), card = document.createElement('article'); card.className = 'quest-card'; card.innerHTML = '<div><b>' + quest.name + '</b><small>' + quest.description + '｜' + Math.min(value, quest.target) + '/' + quest.target + '｜獎勵 ' + rewardText + '</small><div class="quest-progress"><i style="width:' + Math.min(100, value / quest.target * 100) + '%"></i></div></div><button ' + (!ready || claimed ? 'disabled' : '') + '>' + (claimed ? '已領取' : ready ? '領取' : '進行中') + '</button>'; card.querySelector('button').onclick = function () { var result = progression.claimQuest(quest.id); if (!result.ok) return growthMessage(result.reason); audio.play('unlock'); renderProgress(); renderGrowth(); growthMessage('任務獎勵已領取。'); }; dom.questList.appendChild(card); });
  }

  function openDeploy() { if (!state.over && state.phase !== 'deploy' && state.round > 1) { note('進行中的戰鬥不可更換隊伍，請先完成或重新開始。'); return; } deploySelection = partyIds.slice(); renderDeploy(); dom.deployModal.hidden = false; }
  function renderDeploy() {
    var roster = progression.ownedPets();
    dom.deployHelp.textContent = '已選 ' + deploySelection.length + '/' + PARTY_SIZE + ' 隻（1〜10 自由編制）｜已擁有 ' + roster.length + '/' + window.TACTICAL_PET_DATA.length + ' 隻，新幻獸可透過 🎰 召喚取得。'; dom.deployGrid.innerHTML = '';
    roster.forEach(function (pet) { var button = document.createElement('button'), active = deploySelection.indexOf(pet.id) >= 0; button.className = 'deploy-card' + (active ? ' selected' : ''); button.innerHTML = '<span class="deploy-art" style="background-image:url(\'' + pet.evolution[portraitStage(pet.id) - 1].portrait + '\')"></span><b>' + pet.name + (pet.size > 1 ? ' ⬛' : '') + '</b><small>' + pet.roleLabel + '｜★' + progression.starOf(pet.id) + (pet.size > 1 ? '｜2×2 佔 4 格' : '') + '</small>'; button.onclick = function () { var index = deploySelection.indexOf(pet.id); if (index >= 0) deploySelection.splice(index, 1); else if (deploySelection.length < PARTY_SIZE) deploySelection.push(pet.id); else { dom.deployHelp.textContent = '隊伍已滿（10 隻），請先取消一隻幻獸。'; return; } renderDeploy(); }; dom.deployGrid.appendChild(button); });
  }

  /* ── 圖鑑：收集進度與全帳號加成 ── */
  function openDex() { renderDex(); document.getElementById('dex-modal').hidden = false; audio.play('ui'); }
  function renderDex() {
    var dex = progression.dexSummary();
    document.getElementById('dex-summary').innerHTML =
      '<span><b>' + dex.total + '/' + dex.max + '</b> 已收集</span>' +
      '<span>🔥 ' + dex.byElement.fire + '　🌿 ' + dex.byElement.forest + '　🌊 ' + dex.byElement.ocean + '　✨ ' + dex.byElement.light + '　🌑 ' + dex.byElement.dark + '</span>' +
      '<span class="dex-bonus">收集加成：全能力 +' + Math.round(dex.allBonus * 100) + '%' +
      (dex.elementBonus.fire ? '｜火系攻擊 +3%' : '') + (dex.elementBonus.forest ? '｜森系攻擊 +3%' : '') + (dex.elementBonus.ocean ? '｜海系攻擊 +3%' : '') + (dex.elementBonus.light ? '｜光系攻擊 +3%' : '') + (dex.elementBonus.dark ? '｜暗系攻擊 +3%' : '') +
      '｜每收集 10 隻全能力 +1%，單一元素滿 10 隻該系攻擊 +3%</span>';
    var grid = document.getElementById('dex-grid'); grid.innerHTML = '';
    window.TACTICAL_PET_DATA.forEach(function (pet) {
      var owned = progression.owns(pet.id), card = document.createElement('div');
      card.className = 'dex-card' + (owned ? '' : ' unknown');
      card.innerHTML = '<span class="deploy-art" style="background-image:url(\'' + pet.evolution[0].portrait + '\')"></span><b>' + (owned ? pet.name : '？？？') + '</b><small>' + (owned ? pet.roleLabel + '｜★' + progression.starOf(pet.id) + (progress.copies[pet.id] ? '｜複製 ' + progress.copies[pet.id] : '') : '未取得') + '</small>';
      grid.appendChild(card);
    });
  }

  /* ── 召喚 ── */
  function openGacha() { renderGacha(); document.getElementById('gacha-results').innerHTML = ''; document.getElementById('gacha-modal').hidden = false; audio.play('ui'); }
  function renderGacha() {
    document.getElementById('gacha-info').innerHTML = '持有 <b>💎 ' + progress.crystals + '</b> 召喚水晶。首次通關與每日任務可獲得水晶。已收集 ' + progression.dexSummary().total + '/' + window.TACTICAL_PET_DATA.length + ' 隻。';
  }
  function doPull(count) {
    var result = progression.pull(count);
    if (!result.ok) { document.getElementById('gacha-info').innerHTML = '<b class="fc-warn">' + result.reason + '</b>'; audio.play('ui'); return; }
    audio.play('unlock'); renderProgress(); renderGacha(); renderParty(); renderTrait();
    var box = document.getElementById('gacha-results');
    box.innerHTML = result.results.map(function (entry, index) {
      return '<div class="gacha-card quality-' + entry.pet.quality + (entry.isNew ? ' fresh' : '') + '" style="animation-delay:' + index * 90 + 'ms">' +
        '<span class="deploy-art" style="background-image:url(\'' + entry.pet.evolution[0].portrait + '\')"></span>' +
        '<b>' + entry.pet.name + '</b><small>' + (entry.isNew ? '✨ NEW!' : '碎片 +1') + '</small></div>';
    }).join('');
  }

  /* ── 幻獸之家：駐守與收成 ── */
  var ELEMENT_ICONS = { fire: '🔥', forest: '🌿', ocean: '🌊', light: '✨', dark: '🌑' };
  function openHome() { renderHome(); document.getElementById('home-modal').hidden = false; audio.play('ui'); }
  function renderHome() {
    var slots = document.getElementById('home-slots'); slots.innerHTML = '';
    var residents = progress.home.residents;
    for (var slot = 0; slot < 3; slot++) (function (slotIndex) {
      var current = residents[slotIndex] || '';
      var wrapper = document.createElement('div'); wrapper.className = 'home-slot';
      var pet = current ? progression.ownedPets().find(function (entry) { return entry.id === current; }) : null;
      var options = '<option value="">— 空位 —</option>' + progression.ownedPets().map(function (entry) {
        if (residents.indexOf(entry.id) >= 0 && entry.id !== current) return '';
        return '<option value="' + entry.id + '"' + (entry.id === current ? ' selected' : '') + '>' + ELEMENT_ICONS[entry.element] + ' ' + entry.name + '</option>';
      }).join('');
      wrapper.innerHTML = '<span class="deploy-art" style="background-image:url(\'' + (pet ? pet.evolution[0].portrait : '') + '\')"></span><small>' + (pet ? ELEMENT_ICONS[pet.element] + ' 生產' + (pet.element === 'fire' ? '火' : pet.element === 'forest' ? '森' : pet.element === 'ocean' ? '海' : pet.element === 'light' ? '光' : '暗') + '精華' : '空位') + '</small><select data-slot="' + slotIndex + '">' + options + '</select>';
      wrapper.querySelector('select').onchange = function () { progression.setResident(slotIndex, this.value || null); audio.play('ui'); renderHome(); };
      slots.appendChild(wrapper);
    }(slot));
    var pending = progression.homePending();
    var total = pending.yields.reduce(function (sum, entry) { return sum + entry.amount; }, 0);
    document.getElementById('home-pending').innerHTML = residents.length
      ? '已累積 <b>' + pending.hours.toFixed(1) + '</b> 小時，可收成 <b>' + total + '</b> 點精華' + (pending.yields.length ? '（' + pending.yields.map(function (entry) { return ELEMENT_ICONS[entry.element] + entry.amount; }).join('、') + '）' : '')
      : '尚未指派駐守幻獸。';
  }

  /* ── 商店 ── */
  var shopElement = 'fire';
  function openShop() { renderShop(); document.getElementById('shop-modal').hidden = false; audio.play('ui'); }
  function renderShop() {
    var picker = document.getElementById('shop-element');
    picker.innerHTML = Object.keys(ELEMENT_ICONS).map(function (element) {
      return '<button type="button" class="element-pick' + (element === shopElement ? ' active' : '') + '" data-element="' + element + '">' + ELEMENT_ICONS[element] + '</button>';
    }).join('');
    picker.querySelectorAll('.element-pick').forEach(function (button) {
      button.onclick = function () { shopElement = button.dataset.element; audio.play('ui'); renderShop(); };
    });
    var list = document.getElementById('shop-list'); list.innerHTML = '';
    var shop = progression.shopState();
    progression.shopOffers().forEach(function (offer) {
      var used = shop.counts[offer.id] || 0, soldOut = used >= offer.daily;
      var costText = (offer.cost.crystals ? offer.cost.crystals + '💎' : '') + (offer.cost.medals ? offer.cost.medals + '🏅' : '');
      var card = document.createElement('article'); card.className = 'quest-card';
      card.innerHTML = '<div><b>' + offer.icon + ' ' + offer.name + '</b><small>價格 ' + costText + '｜今日 ' + used + '/' + offer.daily + (offer.pick ? '｜目前屬性 ' + ELEMENT_ICONS[shopElement] : '') + '</small></div><button ' + (soldOut ? 'disabled' : '') + '>' + (soldOut ? '售罄' : '購買') + '</button>';
      card.querySelector('button').onclick = function () {
        var result = progression.buyOffer(offer.id, shopElement);
        if (!result.ok) { note(result.reason); return; }
        audio.play('unlock'); renderProgress(); renderShop(); note('已購買「' + offer.name + '」。');
      };
      list.appendChild(card);
    });
    /* 販售重複幻獸複製體換金幣 */
    var sellIds = Object.keys(progress.copies).filter(function (id) { return progress.copies[id] > 0; });
    var sellHead = document.createElement('h3'); sellHead.className = 'bag-subtitle'; sellHead.textContent = '💰 販售複製體（持有 🪙 ' + progress.gold + '）';
    list.appendChild(sellHead);
    if (!sellIds.length) {
      var empty = document.createElement('small'); empty.className = 'gacha-rates'; empty.textContent = '沒有可販售的複製體——召喚抽到重複幻獸時會累積。';
      list.appendChild(empty);
    }
    sellIds.forEach(function (id) {
      var pet = window.TACTICAL_PET_DATA.find(function (entry) { return entry.id === id; }); if (!pet) return;
      var price = progression.sellPrice(id);
      var card = document.createElement('article'); card.className = 'quest-card';
      card.innerHTML = '<div><b>' + pet.name + ' 複製體 ×' + progress.copies[id] + '</b><small>單價 🪙 ' + price + '（也可用於升星）</small></div><button>賣 1 隻</button>';
      card.querySelector('button').onclick = function () {
        var result = progression.sellCopy(id);
        if (!result.ok) { note(result.reason); return; }
        audio.play('unlock'); renderProgress(); renderShop(); note('售出 ' + pet.name + ' 複製體，獲得 🪙 ' + result.gold + '。');
      };
      list.appendChild(card);
    });
  }

  /* ── 背包 ── */
  function openBag() { renderBag(); document.getElementById('bag-modal').hidden = false; audio.play('ui'); }
  function renderBag() {
    var essences = Object.keys(ELEMENT_ICONS).map(function (element) { return ELEMENT_ICONS[element] + ' ' + (progress.essences[element] || 0); }).join('　');
    document.getElementById('bag-resources').innerHTML =
      '<span>💎 <b>' + progress.crystals + '</b> 水晶</span><span>🪙 <b>' + progress.gold + '</b> 金幣</span><span>🏅 <b>' + progress.medals + '</b> 徽章</span><span>🧬 <b>' + progress.fusionCores + '</b> 核心</span><span>' + essences + '</span>';
    var shardsBox = document.getElementById('bag-shards'); shardsBox.innerHTML = '';
    var copyIds = Object.keys(progress.copies).filter(function (id) { return progress.copies[id] > 0; });
    if (!copyIds.length) { shardsBox.innerHTML = '<small class="gacha-rates">尚無幻獸複製體——召喚抽到重複幻獸時會累積，可升星或在商店賣掉。</small>'; return; }
    copyIds.forEach(function (id) {
      var pet = window.TACTICAL_PET_DATA.find(function (entry) { return entry.id === id; }); if (!pet) return;
      var card = document.createElement('div'); card.className = 'dex-card';
      card.innerHTML = '<span class="deploy-art" style="background-image:url(\'' + pet.evolution[0].portrait + '\')"></span><b>' + pet.name + '</b><small>複製體 ×' + progress.copies[id] + '｜★' + progression.starOf(id) + '</small>';
      shardsBox.appendChild(card);
    });
  }

  /* ── 每日任務 ── */
  function openDaily() { renderDaily(); document.getElementById('daily-modal').hidden = false; audio.play('ui'); }
  function renderDaily() {
    var list = document.getElementById('daily-list'); list.innerHTML = '';
    var daily = progression.dailyState();
    progression.dailyQuests().forEach(function (quest) {
      var value = progression.dailyProgress(quest), claimed = Boolean(daily.claims[quest.id]), ready = value >= quest.target;
      var rewardText = (quest.reward.crystals ? quest.reward.crystals + '💎 ' : '') + (quest.reward.medals ? quest.reward.medals + '🏅 ' : '') + (quest.reward.fusionCore ? quest.reward.fusionCore + '🧬' : '');
      var card = document.createElement('article'); card.className = 'quest-card';
      card.innerHTML = '<div><b>' + quest.name + '</b><small>' + quest.description + '｜' + Math.min(value, quest.target) + '/' + quest.target + '｜獎勵 ' + rewardText + '</small><div class="quest-progress"><i style="width:' + Math.min(100, value / quest.target * 100) + '%"></i></div></div><button ' + (!ready || claimed ? 'disabled' : '') + '>' + (claimed ? '已領取' : ready ? '領取' : '進行中') + '</button>';
      card.querySelector('button').onclick = function () { var result = progression.claimDaily(quest.id); if (!result.ok) { note(result.reason); return; } audio.play('unlock'); renderProgress(); renderDaily(); note('每日任務獎勵已領取。'); };
      list.appendChild(card);
    });
  }
  function confirmDeploy() { if (!deploySelection.length || deploySelection.length > PARTY_SIZE) { dom.deployHelp.textContent = '請選擇 1〜' + PARTY_SIZE + ' 隻幻獸（目前 ' + deploySelection.length + ' 隻）。'; return; } progression.setParty(deploySelection); partyIds = progress.party.slice(); dom.deployModal.hidden = true; reset(currentStage.id); }

  document.addEventListener('pointerdown', function unlockOnce() { audio.unlock(); document.removeEventListener('pointerdown', unlockOnce); }, { once: true });
  document.getElementById('restart').onclick = function () { reset(stageRef()); };
  dom.endTurn.onclick = endTurn; dom.auto.onclick = toggleAuto; dom.speed.onclick = cycleSpeed;
  dom.sound.onclick = function () { var enabled = progression.toggleSound(); audio.setEnabled(enabled); renderProgress(); if (enabled) audio.play('ui'); };
  document.getElementById('open-campaign').onclick = openCampaign; document.getElementById('open-growth').onclick = openGrowth;
  document.getElementById('open-dex').onclick = openDex; document.getElementById('open-gacha').onclick = openGacha; document.getElementById('open-daily').onclick = openDaily;
  document.getElementById('open-home').onclick = openHome; document.getElementById('open-shop').onclick = openShop; document.getElementById('open-bag').onclick = openBag;
  document.getElementById('home-collect').onclick = function () { var result = progression.collectHome(); if (!result.ok) { note(result.reason); return; } audio.play('unlock'); renderProgress(); renderHome(); note('收成完成：獲得 ' + result.total + ' 點元素精華。'); };
  document.getElementById('hub-party').onclick = openDeploy;
  document.getElementById('gacha-one').onclick = function () { doPull(1); };
  document.getElementById('gacha-ten').onclick = function () { doPull(10); };
  document.querySelectorAll('.hub-soon').forEach(function (button) {
    button.onclick = function () { audio.play('ui'); note('「' + button.dataset.soon + '」功能開發中，敬請期待！（規劃見 docs/遊戲企劃藍圖.md）'); };
  });
  document.getElementById('deploy').onclick = openDeploy; document.getElementById('close-deploy').onclick = function () { dom.deployModal.hidden = true; }; document.getElementById('cancel-deploy').onclick = function () { dom.deployModal.hidden = true; }; document.getElementById('confirm-deploy').onclick = confirmDeploy;
  document.querySelectorAll('[data-close]').forEach(function (button) { button.onclick = function () { document.getElementById(button.dataset.close).hidden = true; }; });
  dom.growthPet.onchange = function () { growthPetId = dom.growthPet.value; renderGrowth(); };
  dom.enterBattle.onclick = function () { audio.unlock(); if (state.over || state.phase !== 'deploy') reset(currentStage.id); setView('battle'); audio.play('ui'); render(); focusCamera(4, 24, true); };
  function stageRef() { return currentStage.tower ? towerStageFor(currentStage.floor) : currentStage.id; }
  dom.battleExit.onclick = function () { stopAuto(); reset(currentStage.tower ? progress.currentStage : currentStage.id); setView('home'); note('已撤退回遠征準備頁。'); };
  document.getElementById('result-home').onclick = function () { reset(currentStage.tower ? progress.currentStage : currentStage.id); setView('home'); };
  document.getElementById('result-retry').onclick = function () { reset(stageRef()); setView('battle'); };
  document.getElementById('result-deploy').onclick = function () { reset(currentStage.tower ? progress.currentStage : currentStage.id); setView('home'); openDeploy(); };
  document.getElementById('result-next').onclick = function () {
    if (currentStage.tower) { enterTower(currentStage.floor + 1); return; }
    currentStage = content.stageById(progress.currentStage); reset(currentStage.id); setView('battle');
  };
  var towerButton = document.getElementById('open-tower');
  if (towerButton) towerButton.onclick = function () { audio.unlock(); enterTower(progress.tower.best + 1); };
  document.addEventListener('keydown', function (event) { if (event.key === 'Escape') ['deploy-modal', 'campaign-modal', 'growth-modal', 'dex-modal', 'gacha-modal', 'daily-modal', 'home-modal', 'shop-modal', 'bag-modal'].forEach(function (id) { var modal = document.getElementById(id); if (modal) modal.hidden = true; }); });

  window.__TACTICS_DEBUG__ = {
    getState: function () { return { stage: currentStage.id, view: currentView, round: state.round, phase: state.phase, over: state.over, allies: alive('ally').length, enemies: alive('enemy').length, obstacles: state.obstacles.length, resources: JSON.parse(JSON.stringify(progress)) }; },
    setView: setView,
    reset: function (stageId) { if (stageId && progression.isStageUnlocked(stageId)) currentStage = content.stageById(stageId); reset(currentStage.id); },
    startBattle: startBattle,
    setSpeed: function (speed) { battleSpeed = Math.max(1, Math.min(8, Number(speed) || 1)); },
    startAuto: function () { if (!autoTimer) toggleAuto(); },
    stopAuto: stopAuto
  };

  enableCameraDrag();
  var boardZoom = 1, zoomButton = document.getElementById('board-zoom');
  if (zoomButton) zoomButton.onclick = function () {
    boardZoom = boardZoom === 1 ? 1.3 : 1;
    var viewport = dom.board.parentElement.parentElement;
    viewport.style.setProperty('--zoom', boardZoom);
    zoomButton.textContent = '🔍 ' + boardZoom + '×';
    audio.play('ui');
    var focus = selected() || alive('ally')[0];
    if (focus) focusUnit(focus, true);
  };
  var minimap = document.getElementById('minimap');
  if (minimap) minimap.addEventListener('click', function (event) {
    var rect = minimap.getBoundingClientRect();
    focusCamera((event.clientX - rect.left) / rect.width * COLS - 0.5, (event.clientY - rect.top) / rect.height * ROWS - 0.5, false);
  });

  reset(currentStage.id);
  if (/[?&]view=battle/.test(window.location.search)) { setView('battle'); focusCamera(4, 24, true); }
  var openMatch = window.location.search.match(/[?&]open=(campaign|dex|gacha|daily|deploy|growth|home|shop|bag)/);
  if (openMatch) ({ campaign: openCampaign, dex: openDex, gacha: openGacha, daily: openDaily, deploy: openDeploy, growth: openGrowth, home: openHome, shop: openShop, bag: openBag })[openMatch[1]]();

  /* 自動化煙霧測試：?autotest=1 會全速打完一場並把結果寫進網頁標題。 */
  if (/[?&]autotest=1/.test(window.location.search)) {
    battleSpeed = 8; document.documentElement.style.setProperty('--battle-rate', 1 / battleSpeed);
    var stageMatch = window.location.search.match(/[?&]stage=([a-z0-9-]+)/);
    if (stageMatch) {
      var wanted = content.stageById(stageMatch[1]);
      content.stages.forEach(function (entry) { if (entry.order < wanted.order) progress.cleared[entry.id] = true; });
      var partyMatch = window.location.search.match(/[?&]party=([a-z_,]+)/);
      if (partyMatch) {
        partyMatch[1].split(',').forEach(function (id) { progress.owned[id] = true; });
        progression.setParty(partyMatch[1].split(',')); partyIds = progress.party.slice();
      }
      if (/[?&]boost=1/.test(window.location.search)) partyIds.forEach(function (id) {
        progress.fusion[id] = 3; progress.evolution[id] = 3;
        progress.skillTree[id] = progression.treeFor(profile(id)).map(function (node) { return node.id; });
      });
      reset(wanted.id);
    }
    var towerMatch = window.location.search.match(/[?&]tower=(\d+)/);
    if (towerMatch) enterTower(parseInt(towerMatch[1], 10));
    setView('battle');
    setTimeout(function () { if (!autoTimer) toggleAuto(); }, 60);
    var autotestWatch = setInterval(function () {
      if (!state.over) { document.title = 'AUTOTEST:RUN:' + state.phase + ':R' + state.round + ':ERR' + (window.__consoleErrors || []).length + ':' + ((window.__consoleErrors || [])[0] || '').slice(0, 80); return; }
      clearInterval(autotestWatch);
      document.title = 'AUTOTEST:' + (alive('ally').length ? 'WIN' : 'LOSE') + ':R' + state.round + ':ERR' + (window.__consoleErrors || []).length;
    }, 150);
  }
}());
