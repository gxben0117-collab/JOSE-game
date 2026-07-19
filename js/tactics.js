/* JOSE 幻獸戰棋：單一玩法的戰鬥控制器與 UI 協調層。 */
(function () {
  'use strict';

  var COLS = 21, ROWS = 10, HARD_ROUND_LIMIT = 45, DEPLOY_CAPACITY = 25, AGGRO_RANGE = 7;
  /* 25 格底部部署區：6×4 主區（24 格）+ 右下 1 格，能容納 25 隻 1×1 或 6 隻 2×2 + 1 隻 1×1。 */
  /* 戰前自由部署：左側 3 欄 × 10 列；出陣容量仍獨立維持 25 單位。 */
  var DEPLOY_MIN_X = 0, DEPLOY_MAX_X = 2, DEPLOY_MIN_Y = 0, DEPLOY_MAX_Y = 9;
  var content = window.TACTICAL_CONTENT;
  var profiles = window.TACTICAL_PET_DATA.concat(window.TACTICAL_ENEMY_DATA || []);
  var progression = new window.TacticalProgression({ profiles: window.TACTICAL_PET_DATA, content: content });
  var progress = progression.state;
  var audio = new window.TacticalAudio(progress.sound);
  var partyIds = progress.party.slice(), currentStage = content.stageById(progress.currentStage), state;
  var deploySelection = [], growthPetId = partyIds[0], autoTimer = null, towerChoiceTimer = null, towerChoiceTick = null, towerReviveTick = null, battleSpeed = 1;
  var formationSnapshot = [], deployFilters = { search: '', element: '', role: '', size: '' };
  var dexFilters = { search: '', element: '', role: '', owned: '' }, dexSelectedId = '';
  var storyContent = window.JOSE_STORY_CONTENT || { sceneFor: function () { return null; } };
  var homeReturnFeedback = '';
  var HOME_DISPLAY_IDS = ['crimson_dragon', 'emerald_god_dragon', 'abyss_god_dragon', 'solar_phoenix', 'eclipse_dragon'];

  var dom = {
    app: document.querySelector('.tactics-app'), board: document.getElementById('board'), list: document.getElementById('party-list'),
    teamTrait: document.getElementById('team-trait'), detail: document.getElementById('unit-detail'), skills: document.getElementById('skill-buttons'),
    turnOrder: document.getElementById('turn-order'), log: document.getElementById('combat-log'),
    banner: document.getElementById('turn-banner'), roundStatus: document.getElementById('round-status'), medals: document.getElementById('medals'),
    essences: document.getElementById('essences'), fusionCores: document.getElementById('fusion-cores'), sound: document.getElementById('sound-toggle'),
    mapEyebrow: document.getElementById('map-eyebrow'), stageTitle: document.getElementById('stage-title'), stageDescription: document.getElementById('stage-description'),
    stageBadge: document.getElementById('stage-badge'), stageObjective: document.getElementById('stage-objective'), stageProgress: document.getElementById('stage-progress'),
    questSummary: document.getElementById('quest-summary'), deployModal: document.getElementById('deploy-modal'), deployGrid: document.getElementById('deploy-grid'), deployHelp: document.getElementById('deploy-help'),
    deployToolbar: document.getElementById('deploy-toolbar'), deployStatus: document.getElementById('deploy-status'), deployBudgetLabel: document.getElementById('deploy-budget-label'), deployBudgetFill: document.getElementById('deploy-budget-fill'),
    campaignModal: document.getElementById('campaign-modal'), campaignGrid: document.getElementById('campaign-grid'), growthModal: document.getElementById('growth-modal'),
    growthPet: document.getElementById('growth-pet'), growthFeedback: document.getElementById('growth-feedback'), growthContent: document.getElementById('growth-content'), questList: document.getElementById('quest-list'),
    growthConfirmModal: document.getElementById('growth-confirm-modal'), growthConfirmTitle: document.getElementById('growth-confirm-title'), growthConfirmCopy: document.getElementById('growth-confirm-copy'), growthConfirmMaterials: document.getElementById('growth-confirm-materials'), growthConfirmEffect: document.getElementById('growth-confirm-effect'), growthConfirmAccept: document.getElementById('growth-confirm-accept'),
    resultIcon: document.getElementById('result-icon'), resultStage: document.getElementById('result-stage'),
    resultTitle: document.getElementById('result-title'), resultCopy: document.getElementById('result-copy'), resultStats: document.getElementById('result-stats'), resultRewards: document.getElementById('result-rewards'),
    bossBar: document.getElementById('boss-bar'), bossName: document.getElementById('boss-name'), bossHpFill: document.getElementById('boss-hp-fill'), bossIntro: document.getElementById('boss-intro'),
    screenHome: document.getElementById('screen-home'), screenBattle: document.getElementById('screen-battle'), screenResult: document.getElementById('screen-result'),
    enterBattle: document.getElementById('enter-battle'), battleExit: document.getElementById('battle-exit'), battleStageLabel: document.getElementById('battle-stage-label'),
    battleAllyList: document.getElementById('battle-ally-list'), battleAllyCount: document.getElementById('battle-ally-count'), battleTeamTrait: document.getElementById('battle-team-trait'), battleObjective: document.getElementById('battle-objective'),
    battleEnemyCount: document.getElementById('battle-enemy-count'), battleEnemySummary: document.getElementById('battle-enemy-summary'),
    auto: document.getElementById('auto-turn'), towerCommand: document.getElementById('tower-command'), towerChoice: document.getElementById('tower-choice'), towerChoiceTitle: document.getElementById('tower-choice-title'), towerChoiceCopy: document.getElementById('tower-choice-copy'), towerChoiceOptions: document.getElementById('tower-choice-options'), speed: document.getElementById('battle-speed'), terrainToggle: document.getElementById('terrain-toggle'), endTurn: document.getElementById('end-turn'),
    battleCommand: document.getElementById('battle-command'), battleCommandPortrait: document.getElementById('battle-command-portrait'), battleCommandName: document.getElementById('battle-command-name'), battleCommandStatus: document.getElementById('battle-command-status'), battleCommandSkills: document.getElementById('battle-command-skills'), battleCommandActions: document.getElementById('battle-command-actions')
  };

  var terrainAlwaysVisible = false;
  try { terrainAlwaysVisible = localStorage.getItem('jose-terrain-visibility') === 'all'; } catch (error) { terrainAlwaysVisible = false; }
  function syncTerrainVisibility() {
    dom.board.classList.toggle('show-terrain', terrainAlwaysVisible);
    if (!dom.terrainToggle) return;
    dom.terrainToggle.setAttribute('aria-pressed', terrainAlwaysVisible ? 'true' : 'false');
    dom.terrainToggle.textContent = terrainAlwaysVisible ? '🗺 地形：全開' : '🗺 地形：自動';
  }
  function toggleTerrainVisibility() {
    terrainAlwaysVisible = !terrainAlwaysVisible;
    try { localStorage.setItem('jose-terrain-visibility', terrainAlwaysVisible ? 'all' : 'adaptive'); } catch (error) { /* private storage may be unavailable */ }
    syncTerrainVisibility(); audio.play('ui');
  }
  function updateSlowTerrainCopy() {
    document.querySelectorAll('.terrain-rules li').forEach(function (item) {
      if (item.textContent.indexOf('障礙') < 0) return;
      item.innerHTML = '<i>▽</i><span><b>減速格</b>：可通行；進入時消耗 2 點行動力，不阻擋遠距視線</span>';
    });
    document.querySelectorAll('.board-legend span').forEach(function (item) {
      if (item.textContent.indexOf('障礙') >= 0) item.textContent = '▽ 減速：進入消耗 2 點行動力；不阻擋視線';
    });
  }

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
  function displayPet() { return profile(progression.homeDisplayPetId()) || profile('crimson_dragon') || window.TACTICAL_PET_DATA[0]; }
  function displayPortrait(pet) {
    if (!pet) return '';
    var stage = Math.max(1, Math.min(3, Number(progress.evolution[pet.id]) || 1));
    return pet.evolution && pet.evolution[stage - 1] ? pet.evolution[stage - 1].portrait : '';
  }
  function displayQuote(pet) { return (window.TACTICAL_SUMMON_QUOTES || {})[pet.id] || '機庫已完成同步，隨時可以出發。'; }
  var BOSS_RAID_TIERS = ['簡單', '普通', '困難', '菁英', '魔神'];
  function bossRaidIds() { return profiles.filter(function (entry) { return entry.boss && entry.size === 4; }).map(function (entry) { return entry.id; }); }
  function bossRaidInfo() {
    var raid = progression.bossRaidState(bossRaidIds()), boss = profile(raid.bossId) || profiles.filter(function (entry) { return entry.boss; })[0];
    return { raid: raid, boss: boss, tier: Math.min(4, Number(raid.tier) || 0), cost: 90 + Math.min(4, Number(raid.tier) || 0) * 45 };
  }
  function bossRaidStage(info) {
    var base = content.stages[0];
    return { id: 'daily-boss-' + info.raid.key, bossRaid: true, mapId: base.mapId, chapter: 0, index: 0, order: 0,
      name: 'Boss 來襲・' + BOSS_RAID_TIERS[info.tier], difficulty: BOSS_RAID_TIERS[info.tier], boss: true,
      power: 1.12 + info.tier * 0.32, enemies: [info.boss.id], enemyCount: 1, seed: 800 + info.tier,
      objective: '討伐今日 Boss，殘血可於今日持續追擊', turnLimit: 30, rewards: { medals: 0, essence: 0, fusionCore: 0 } };
  }
  function renderBossRaidSummary() {
    var host = document.getElementById('home-boss-summary'); if (!host) return;
    var info = bossRaidInfo(), raid = info.raid, boss = info.boss, hpText = raid.hp && raid.maxHp ? Math.max(0, Math.round(raid.hp / raid.maxHp * 100)) + '%' : '尚未受損';
    host.innerHTML = '<span class="command-boss-art" style="background-image:url(\'' + displayPortrait(boss) + '\')"></span><div><b>' + boss.name + '｜' + (window.ELEMENT_CONFIG[boss.element] || {}).label + '</b><small>' + (raid.cleared ? '今日討伐完成' : BOSS_RAID_TIERS[info.tier] + '｜HP ' + hpText + '｜入場 ' + info.cost + '🪙') + '</small></div>';
    document.getElementById('home-boss-open').textContent = raid.cleared ? '👑 今日已討伐' : '👑 前往討伐';
    document.getElementById('home-boss-open').disabled = raid.cleared;
  }
  function renderHangarHome() {
    var pet = displayPet(), map = mapData(), hero = document.getElementById('home-hero-art');
    if (!pet || !hero) return;
    document.body.dataset.hangarElement = pet.element || 'fire';
    hero.style.backgroundImage = "url('" + displayPortrait(pet) + "')";
    document.getElementById('home-hero-name').textContent = pet.name;
    document.getElementById('home-hero-kicker').textContent = progression.state.homeDisplay.mode === 'leader' ? '目前隊長展示' : '旗艦幻獸展示';
    document.getElementById('home-hero-meta').textContent = (window.ELEMENT_CONFIG[pet.element] || {}).label + '屬性｜' + ({ normal:'普通', rare:'稀有', elite:'菁英', epic:'史詩', legendary:'傳說', mythical:'神話' }[pet.rarity] || pet.rarity) + '｜機庫同步中';
    document.getElementById('home-hero-quote').textContent = '「' + displayQuote(pet) + '」';
    document.getElementById('home-command-title').textContent = '第 ' + currentStage.chapter + ' 章・' + map.name;
    document.getElementById('home-command-copy').textContent = homeReturnFeedback || ('下一站：' + currentStage.name + '。' + currentStage.objective);
    var dailyReady = progression.dailyQuests().filter(function (quest) { return progression.dailyProgress(quest) >= quest.target && !progression.dailyState().claims[quest.id]; }).length;
    document.getElementById('home-focus').innerHTML = '<span>◈ 章節背景：' + map.name + '</span><span>◈ ' + (dailyReady ? dailyReady + ' 個每日獎勵可領取' : '每日任務進行中') + '</span><span>◈ 無限塔最高 ' + progress.tower.best + ' 層</span>';
    renderBossRaidSummary();
  }
  function openHomeDisplay() {
    var grid = document.getElementById('home-display-grid'), follow = document.getElementById('home-display-follow');
    grid.innerHTML = ''; follow.checked = progress.homeDisplay.mode === 'leader';
    HOME_DISPLAY_IDS.map(profile).filter(Boolean).forEach(function (pet) {
      var button = document.createElement('button'); button.type = 'button'; button.className = 'home-display-card' + (pet.id === progress.homeDisplay.petId ? ' is-active' : '');
      button.style.setProperty('--card-color', (window.ELEMENT_CONFIG[pet.element] || {}).color || '#ffb058');
      button.innerHTML = '<span class="home-display-art" style="background-image:url(\'' + displayPortrait(pet) + '\')"></span><b>' + pet.name + '</b><small>' + (window.ELEMENT_CONFIG[pet.element] || {}).label + '屬性｜首頁展示</small>';
      button.onclick = function () { progression.setHomeDisplay(pet.id, follow.checked ? 'leader' : 'fixed'); audio.play('ui'); renderHangarHome(); openHomeDisplay(); };
      grid.appendChild(button);
    });
    follow.onchange = function () { progression.setHomeDisplay(progress.homeDisplay.petId, follow.checked ? 'leader' : 'fixed'); renderHangarHome(); };
    document.getElementById('home-display-modal').hidden = false; audio.play('ui');
  }
  function showStory(scene, key) {
    if (!scene || progression.hasSeenStory(key)) return Promise.resolve(false);
    var modal = document.getElementById('story-modal'), pet = profile(scene.portrait);
    document.getElementById('story-kicker').textContent = scene.kicker || '章節故事'; document.getElementById('story-speaker').textContent = scene.speaker || '';
    document.getElementById('story-title').textContent = scene.title || ''; document.getElementById('story-copy').textContent = scene.copy || '';
    document.getElementById('story-art').style.backgroundImage = pet ? "url('" + displayPortrait(pet) + "')" : '';
    modal.hidden = false; audio.play('ui');
    return new Promise(function (resolve) { document.getElementById('story-next').onclick = function () { modal.hidden = true; progression.markStorySeen(key); resolve(true); }; });
  }
  function mapData() { return content.mapById(currentStage.mapId); }
  function alive(team) { return state.units.filter(function (unit) { return unit.team === team && unit.hp > 0; }); }
  function selected() { return state.units.find(function (unit) { return unit.key === state.selected; }); }
  function inspected() { return state.units.find(function (unit) { return unit.key === state.inspected; }) || selected(); }
  function unitSize(unit) { return (unit && unit.p && unit.p.size) || 1; }
  function deploymentCost(pet) { return progression.deploymentCost(pet && pet.p ? pet.p : pet); }
  function selectedDeploymentCost(ids) { return progression.partyCost(ids || deploySelection); }
  /* 多格佔位：大型單位以左上角為錨點，footprint 覆蓋 size×size 格。 */
  function at(x, y) {
    return state.units.find(function (unit) {
      if (unit.hp <= 0 && !unit.defeating) return false;
      var size = unitSize(unit);
      return x >= unit.x && x < unit.x + size && y >= unit.y && y < unit.y + size;
    });
  }
  function canStand(unit, x, y) {
    var size = unitSize(unit);
    for (var dy = 0; dy < size; dy++) for (var dx = 0; dx < size; dx++) {
      var cx = x + dx, cy = y + dy;
      if (!inBoard(cx, cy)) return false;
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
  function terrain(x, y) { return content.terrainAt(currentStage, x, y); }
  function slowAt(x, y) { return Boolean(state && state.obstacleMap[x + ',' + y]); }
  function movementCost(unit, x, y) {
    var size = unitSize(unit);
    for (var dy = 0; dy < size; dy++) for (var dx = 0; dx < size; dx++) if (slowAt(x + dx, y + dy)) return 2;
    return 1;
  }
  function unitName(unit) { return unit.p.name; }
  function note(message) { dom.log.textContent = message; }
  function duration(milliseconds) { return Math.max(18, Math.round(milliseconds / battleSpeed)); }
  function pause(milliseconds) { return new Promise(function (resolve) { setTimeout(resolve, duration(milliseconds)); }); }
  function evolutionMultiplier(unit) { return 1 + (unit.evolution - 1) * 0.12; }
  function portrait(unit) { return unit.p.evolution[Math.min(unit.evolution, unit.p.evolution.length) - 1].portrait; }
  /* 動畫圖集由戰場 CSS 使用，路徑以 css/ 為基準。 */
  function motionSheet(unit) {
    var stage = Math.max(1, Math.min(3, Number(unit.evolution) || 1));
    var stagePortrait = unit.p.evolution[Math.min(stage, unit.p.evolution.length) - 1]?.portrait || '';
    var stageSuffix = stage > 1 && stagePortrait.indexOf('assets/pets/' + unit.id + '/evolution/stage_' + stage + '.png') === 0 ? '-stage_' + stage : '';
    return '../assets/animations/directional/' + unit.id + stageSuffix + '-motion-4dir-sheet.webp?v=25';
  }
  function motionManifestEntry(unit) { return (window.TACTICAL_MOTION_MANIFEST || {})[unit.id] || {}; }
  function animationSpec(unit, action, override) {
    var entry = motionManifestEntry(unit), authored = entry.animations?.[action] || {};
    var columns = Math.max(1, Math.min(12, Number(entry.columns) || Number(authored.frameCount) || 6));
    var source = Object.assign({}, authored, override || {});
    if (source.frameCount === undefined) source.frameCount = Math.min(columns, 6);
    var spec = window.TACTICAL_ANIMATION_CONFIG.action(action, source);
    spec.columns = columns;
    spec.steps = Math.max(1, spec.frameCount - 1);
    spec.endX = columns <= 1 ? 0 : 100 * (spec.frameCount - 1) / (columns - 1);
    return spec;
  }
  function motionVariables(unit) {
    var entry = motionManifestEntry(unit);
    var result = { columns: animationSpec(unit, 'idle').columns, rows: Math.max(1, Number(entry.rows) || 12), rowsOrder: entry.rowsOrder || [] };
    ['idle', 'move', 'attack', 'hit', 'death', 'victory'].forEach(function (action) { result[action] = animationSpec(unit, action); });
    return result;
  }
  function applyMotionVariables(element, unit) {
    var specs = motionVariables(unit);
    element.style.setProperty('--motion-columns', specs.columns);
    element.style.setProperty('--motion-rows', specs.rows);
    ['idle', 'move', 'attack', 'hit', 'victory', 'death'].forEach(function (action) {
      ['down', 'right', 'up', 'left'].forEach(function (direction) {
        var row = specs.rowsOrder.indexOf(action + '-' + direction);
        if (row < 0) row = ({ idle: 0, move: 1, attack: 2, hit: 0, victory: 0, death: 0 }[action] + ({ down: 0, right: 3, up: 6, left: 9 }[direction] || 0));
        element.style.setProperty('--' + action + '-' + direction + '-y', (specs.rows <= 1 ? 0 : row * 100 / (specs.rows - 1)).toFixed(4) + '%');
      });
    });
    ['idle', 'move', 'attack', 'hit', 'victory', 'death'].forEach(function (action) {
      var spec = specs[action];
      element.style.setProperty('--' + action + '-frames', spec.frameCount);
      element.style.setProperty('--' + action + '-steps', spec.steps);
      element.style.setProperty('--' + action + '-duration', spec.durationMs + 'ms');
      element.style.setProperty('--' + action + '-end-x', spec.endX.toFixed(4) + '%');
      element.style.setProperty('--' + action + '-iteration', spec.loop ? 'infinite' : '1');
    });
  }
  function animationHitDelay(unit, action, skill) {
    var spec = skill?.kind === 'ultimate' ? window.TACTICAL_ANIMATION_CONFIG.action('ultimate', skill.animation) : animationSpec(unit, action, skill?.animation);
    return spec.hitFrame ? Math.round((spec.hitFrame - 1) / spec.fps * 1000) : 0;
  }
  function bonuses(unit) { return unit.team === 'ally' ? progression.bonusesFor(unit.p) : {}; }
  function bonusValue(unit, key) { var value = bonuses(unit); return (value.all || 0) + (value[key] || 0); }
  function starMultiplier(unit) { return unit.team === 'ally' ? progression.starMultiplier(unit.id) : 1; }
  function stat(unit, key) {
    var value = unit.p.stats[key] * evolutionMultiplier(unit) * starMultiplier(unit);
    if (key === 'power') value *= 1 + bonusValue(unit, 'offense');
    if (key === 'magic') value *= 1 + bonusValue(unit, 'magic') + (bonuses(unit).offense || 0);
    if (key === 'defense') value *= 1 + bonusValue(unit, 'defense');
    if (unit.team === 'enemy' && currentStage.tower && (key === 'power' || key === 'magic')) value *= 1 + towerBuffStack('frenzy') * 0.08;
    if (unit.team === 'enemy' && currentStage.tower && key === 'speed') value += towerBuffStack('swift');
    return value * (unit.team === 'enemy' ? state.enemyScale : 1);
  }
  function moveRange(unit) { return unit.p.move + (bonuses(unit).move || 0) + (unit.team === 'enemy' && currentStage.tower ? towerBuffStack('swift') : 0) + (unit.p.element === 'ocean' && terrain(unit.x, unit.y) === 'water' ? 1 : 0); }
  function skillRange(unit, skill) { return skill.range + (skill.attackStyle === 'support' ? (bonuses(unit).supportRange || 0) : (bonuses(unit).range || 0)); }
  function portraitStage(id) { return Math.max(1, Math.min(3, Number(progress.evolution[id]) || 1)); }
  function isControlSkill(skill) { return Boolean(skill.status || skill.push || skill.pull); }
  function passiveDescription(passive) {
    var percent = Math.round((Number(passive.value) || 0) * 100), chance = Math.round((Number(passive.chance) || 0) * 100);
    var effects = {
      atk_boost: '攻擊與魔力提升 ' + percent + '%', def_boost: '防禦提升 ' + percent + '%', hp_boost: '最大生命提升 ' + percent + '%',
      all_boost: '生命、攻擊、魔力與防禦提升 ' + percent + '%', burn: (chance ? '攻擊時有 ' + chance + '% 機率' : '攻擊時') + '附加燃燒；每回合造成目標最大生命 ' + percent + '% 傷害',
      poison: (chance ? '攻擊時有 ' + chance + '% 機率' : '攻擊時') + '附加中毒；每回合造成持續傷害', freeze: (chance ? '攻擊時有 ' + chance + '% 機率' : '攻擊時') + '使目標冰凍 1 回合',
      shield: '戰鬥開始時獲得相當於最大生命 ' + percent + '% 的護盾', heal: '治療效果提升 ' + percent + '%'
    };
    return effects[passive.effect] || (percent ? '戰鬥中對應能力提升 ' + percent + '%' : chance ? '觸發機率 ' + chance + '%' : '進入戰鬥後持續生效');
  }

  function clone(id, team, x, y, index) {
    var pet = profile(id), evolution = team === 'ally' ? portraitStage(id) : Math.max(1, Math.min(pet.evolution.length, 1 + Math.floor((Math.max(1, currentStage.order) - 1) / 6)));
    var unit = { id: id, key: team + '-' + index + '-' + id, team: team, p: pet, x: x, y: y, hp: 1, maxHp: 1, moved: false, acted: false, facing: team === 'ally' ? 'right' : 'left', evolution: evolution,
      cooldowns: pet.skills.map(function () { return 0; }), shield: 0, burn: 0, poison: 0, freeze: 0, atkBuff: 0, boss: Boolean(pet.boss) };
    unit.maxHp = Math.round(pet.stats.health * evolutionMultiplier(unit) * starMultiplier(unit) * (1 + bonusValue(unit, 'health')) * (team === 'enemy' ? state.enemyScale * (unit.boss ? 1.1 : 1) : 1));
    unit.hp = unit.maxHp;
    if (team === 'enemy' && currentStage.tower) {
      unit.maxHp = Math.round(unit.maxHp * (1 + towerBuffStack('fortified') * 0.12));
      unit.hp = unit.maxHp;
      if (towerBuffStack('barrier')) unit.shield = Math.round(unit.maxHp * 0.08 * towerBuffStack('barrier'));
    }
    return unit;
  }

  /* 25 格主部署區；3×3 幻獸成本依規則只算 3，改在左上大型部署列排列，避免合法編隊被候補。 */
  function inDeployZone(x, y) { return x >= DEPLOY_MIN_X && x <= DEPLOY_MAX_X && y >= DEPLOY_MIN_Y && y <= DEPLOY_MAX_Y; }
  function inLargeDeployReserve(x, y) { return x >= DEPLOY_MIN_X && x <= DEPLOY_MAX_X + 2 && y >= DEPLOY_MIN_Y && y <= DEPLOY_MAX_Y; }
  function deployFits(unit, x, y) {
    return inDeployZone(x, y) && canStand(unit, x, y);
  }
  function clearDeploymentObstacles() {
    state.obstacles = state.obstacles.filter(function (spot) { return !inLargeDeployReserve(spot.x, spot.y); });
    state.obstacleMap = {};
    state.obstacles.forEach(function (spot) { state.obstacleMap[spot.x + ',' + spot.y] = true; });
  }
  function placeAllies() {
    var benched = [];
    var orderedParty = partyIds.slice().sort(function (a, b) { return (profile(b).size || 1) - (profile(a).size || 1); });
    orderedParty.forEach(function (id, index) {
      var unit = clone(id, 'ally', -9, -9, index), placed = false;
      state.units.push(unit);
      for (var y = 0; y < ROWS && !placed; y++) for (var x = 0; x < COLS && !placed; x++) {
        if (deployFits(unit, x, y)) { unit.x = x; unit.y = y; placed = true; }
      }
      if (!placed) { state.units.pop(); benched.push(unit.p.name + '（' + unitSize(unit) + '×' + unitSize(unit) + '）'); }
    });
    return benched;
  }

  function applySavedFormation() {
    var saved = progression.formationFor(partyIds), allies = state.units.filter(function (unit) { return unit.team === 'ally'; });
    if (saved.length !== allies.length) return false;
    var fallback = allies.map(function (unit) { return { unit: unit, x: unit.x, y: unit.y }; });
    allies.forEach(function (unit) { unit.x = -9; unit.y = -9; });
    for (var index = 0; index < saved.length; index++) {
      var spot = saved[index], unit = allies.find(function (entry) { return entry.id === spot.id; });
      if (!unit || !deployFits(unit, spot.x, spot.y)) {
        fallback.forEach(function (entry) { entry.unit.x = entry.x; entry.unit.y = entry.y; });
        return false;
      }
      unit.x = spot.x; unit.y = spot.y;
    }
    return true;
  }

  function saveFormationPreset() {
    if (state.phase !== 'deploy') return;
    var positions = state.units.filter(function (unit) { return unit.team === 'ally'; }).map(function (unit) { return { id: unit.id, x: unit.x, y: unit.y }; });
    progression.setFormation(partyIds, positions); audio.play('ui'); note('已儲存此隊伍的部署預設；下次進入戰鬥會自動套用。'); renderDeployPresetStatus();
  }

  function rememberFormation() {
    if (!state || state.phase !== 'deploy') return false;
    var positions = state.units.filter(function (unit) { return unit.team === 'ally' && unit.x >= 0 && unit.y >= 0; }).map(function (unit) { return { id: unit.id, x: unit.x, y: unit.y }; });
    return positions.length === partyIds.length && progression.setFormation(partyIds, positions);
  }

  function captureFormation() {
    formationSnapshot = state.units.filter(function (unit) { return unit.team === 'ally'; }).map(function (unit) { return { key: unit.key, x: unit.x, y: unit.y }; });
  }
  function restoreFormation() {
    if (state.phase !== 'deploy' || !formationSnapshot.length) return;
    formationSnapshot.forEach(function (spot) { var unit = state.units.find(function (entry) { return entry.key === spot.key; }); if (unit) { unit.x = spot.x; unit.y = spot.y; } });
    state.selected = null; audio.play('ui'); note('已還原進入關卡時的部署位置。'); render();
  }
  function formationRoleRank(unit, mode) {
    var balanced = { defender: 0, allrounder: 1, controller: 2, attacker: 3, support: 4, healer: 5 };
    var assault = { attacker: 0, controller: 1, allrounder: 2, defender: 3, support: 4, healer: 5 };
    var ranks = mode === 'assault' ? assault : balanced;
    return Object.prototype.hasOwnProperty.call(ranks, unit.p.role) ? ranks[unit.p.role] : 3;
  }
  function arrangeFormation(mode) {
    if (state.phase !== 'deploy') return;
    var allies = state.units.filter(function (unit) { return unit.team === 'ally'; });
    allies.forEach(function (unit) { unit.x = -9; unit.y = -9; });
    allies.sort(function (a, b) { return unitSize(b) - unitSize(a) || formationRoleRank(a, mode) - formationRoleRank(b, mode); });
    var cells = [];
    for (var y = DEPLOY_MIN_Y; y <= DEPLOY_MAX_Y; y++) for (var x = DEPLOY_MIN_X; x <= DEPLOY_MAX_X; x++) cells.push([x, y]);
    cells.sort(function (a, b) {
      if (mode === 'assault') return b[0] - a[0] || Math.abs(a[1] - 4.5) - Math.abs(b[1] - 4.5);
      return Math.abs(a[1] - 4.5) - Math.abs(b[1] - 4.5) || a[0] - b[0];
    });
    allies.forEach(function (unit) { var spot = cells.find(function (entry) { return deployFits(unit, entry[0], entry[1]); }); if (spot) { unit.x = spot[0]; unit.y = spot[1]; } });
    state.selected = null; audio.play('ui'); note(mode === 'assault' ? '已套用突擊陣：輸出與控場靠前，快速接敵。' : '已套用均衡陣：防禦在前、治療與輔助在後。'); render();
  }

  function autoArrangeBySpeed() {
    if (state.phase !== 'deploy') return;
    var allies = state.units.filter(function (unit) { return unit.team === 'ally'; });
    allies.forEach(function (unit) { unit.x = -9; unit.y = -9; });
    allies.sort(function (a, b) { return b.p.stats.speed - a.p.stats.speed || unitSize(b) - unitSize(a) || a.id.localeCompare(b.id); });
    var cells = [];
    for (var y = DEPLOY_MIN_Y; y <= DEPLOY_MAX_Y; y++) for (var x = DEPLOY_MIN_X; x <= DEPLOY_MAX_X; x++) cells.push([x, y]);
    allies.forEach(function (unit) {
      var options = cells.filter(function (cell) { return deployFits(unit, cell[0], cell[1]); });
      options.sort(function (a, b) {
        function score(cell) {
          var nearest = allies.filter(function (entry) { return entry.x >= 0 && entry.y >= 0; }).reduce(function (minimum, entry) { return Math.min(minimum, Math.abs(entry.x - cell[0]) + Math.abs(entry.y - cell[1])); }, 12);
          return cell[0] * 12 + nearest * 14 - Math.abs(cell[1] - 4.5) * 0.05;
        }
        return score(b) - score(a) || Math.abs(a[1] - 4.5) - Math.abs(b[1] - 4.5);
      });
      if (options.length) { unit.x = options[0][0]; unit.y = options[0][1]; }
    });
    state.selected = null; rememberFormation(); audio.play('ui'); note('已自動部署：依速度由快至慢，優先右側並分散隊形。'); render();
  }

  function balancedEnemyRoster(stage, partyCost) {
    var base = (content.rosterFor ? content.rosterFor(stage) : stage.enemies).slice();
    var originalCount = base.length;
    var earlyChapter = !stage.tower && Number(stage.chapter) <= 5;
    var added = Math.max(0, Math.round((partyCost - 10) * (earlyChapter ? 0.35 : 0.6)));
    var target = Math.min(30, base.length + added), pool = base.filter(function (id) { return !(profile(id) || {}).boss; });
    if (!pool.length) pool = base.slice();
    for (var index = base.length; index < target; index++) base.push(pool[(index + (stage.seed || 0)) % pool.length]);
    var scale = 1 + Math.max(0, partyCost - 10) * (earlyChapter ? 0.008 : 0.012);
    var minimumScale = (earlyChapter ? 0.48 : 0.62) + Math.max(0, partyCost - 8) * (earlyChapter ? 0.025 : 0.035);
    return { roster: base, added: Math.max(0, target - originalCount), scale: scale, minimumScale: minimumScale, label: partyCost >= 23 ? '滿編迎擊' : partyCost >= 16 ? '增援迎擊' : partyCost >= 9 ? '警戒迎擊' : '標準迎擊' };
  }

  /* 敵方布陣：名冊拆成 3~5 人小隊，依關卡 seed 決定性散布在全地圖多個集結點；
     頭目小隊固定佔據最深處的錨點。 */
  function findFreeSpot(cx, cy, occupied, size) {
    size = size || 1;
    function free(x, y) {
      for (var dy = 0; dy < size; dy++) for (var dx = 0; dx < size; dx++) {
        var fx = x + dx, fy = y + dy;
        if (!inBoard(fx, fy) || at(fx, fy) || occupied[fx + ',' + fy] || (fx <= DEPLOY_MAX_X + 2 && fy >= DEPLOY_MIN_Y - 2)) return false;
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
    for (var scanY = 1; scanY < ROWS - size; scanY++) for (var scanX = DEPLOY_MAX_X + 3; scanX < COLS - size; scanX++) {
      if (free(scanX, scanY)) return { x: scanX, y: scanY };
    }
    return { x: cx, y: cy };
  }
  function enemyFormation(roster) {
    var anchors = [[COLS - 3, 2], [COLS - 4, Math.floor(ROWS / 2)], [COLS - 3, ROWS - 4], [COLS - 8, 3], [COLS - 8, ROWS - 5], [COLS - 10, Math.floor(ROWS / 2)], [COLS - 6, 6], [COLS - 6, ROWS - 7], [COLS - 11, 4], [COLS - 11, ROWS - 6], [COLS - 4, 6], [COLS - 4, ROWS - 7]];
    var result = [], occupied = {}, squads = [], squadSize = roster.length > 20 ? 5 : 4, offset = currentStage.seed % anchors.length;
    for (var index = 0; index < roster.length; index += squadSize) squads.push(roster.slice(index, index + squadSize));
    squads.forEach(function (squad, squadIndex) {
      var anchor = squadIndex === 0 && currentStage.boss ? [COLS - 4, Math.floor(ROWS / 2) - 1] : anchors[(offset + squadIndex * 3) % anchors.length];
      squad.forEach(function (id) {
        var size = (profile(id) || {}).size || 1;
        var spot = findFreeSpot(anchor[0], anchor[1], occupied, size);
        for (var dy = 0; dy < size; dy++) for (var dx = 0; dx < size; dx++) occupied[(spot.x + dx) + ',' + (spot.y + dy)] = true;
        result.push({ id: id, x: spot.x, y: spot.y, squad: squadIndex });
      });
    });
    return result;
  }

  /* 無限塔：10 波守護塔生存戰。 */
  function towerBasePower(floor) { return Math.round((0.62 + Math.min(floor, 20) * 0.025 + Math.max(0, floor - 20) * 0.015) * 100) / 100; }
  function towerEnemyBuffs(floor) {
    var cycle = ['fortified', 'frenzy', 'swift', 'barrier'], buffs = {}, tiers = Math.floor(Math.max(0, floor - 1) / 5);
    for (var index = 0; index < tiers; index++) buffs[cycle[index % cycle.length]] = (buffs[cycle[index % cycle.length]] || 0) + 1;
    return buffs;
  }
  function towerBuffStack(id) { return currentStage && currentStage.tower && state && state.tower ? (state.tower.enemyBuffs[id] || 0) : 0; }
  function towerBuffSummary() {
    var labels = { fortified: '🛡 堅甲', frenzy: '⚔ 狂暴', swift: '⚡ 迅捷', barrier: '✦ 護幕' }, buffs = state.tower.enemyBuffs;
    var text = Object.keys(buffs).map(function (id) { return labels[id] + '×' + buffs[id]; });
    return text.length ? text.join(' ') : '無（第 6 層開始）';
  }
  function towerStageFor(floor) {
    var chapter = content.maps[(floor - 1) % content.maps.length];
    /* 無限塔是跨界戰場：一般波可遇到所有幻獸與非首領魔獸；第 5、10 波由所有魔獸首領輪替壓陣。 */
    var towerUnits = profiles.filter(function (entry) { return !entry.boss; }).map(function (entry) { return entry.id; });
    var towerBosses = profiles.filter(function (entry) { return entry.boss; }).map(function (entry) { return entry.id; });
    return {
      id: 'tower-' + floor, tower: true, floor: floor, mapId: chapter.id, chapter: 0, index: floor, order: 0,
      name: '無限塔・第 ' + floor + ' 層', difficulty: '守護塔防衛', boss: false,
      power: towerBasePower(floor),
      enemies: towerUnits, towerBosses: towerBosses,
      enemyCount: Math.min(30, 8 + Math.floor(floor * 0.45)), seed: floor * 97 + 13,
      objective: '守住守護塔，抵擋 10 波魔物進攻', turnLimit: 30,
      rewards: { medals: 0, essence: 0, fusionCore: 0 }
    };
  }
  function enterTower(floor) {
    currentStage = towerStageFor(Math.max(1, floor));
    reset(currentStage); setView('battle'); audio.play('boss');
    focusDeployZone(true);
  }

  function reset(stageId) {
    stopAuto();
    stopTowerChoiceTimer();
    stopTowerReviveTimer();
    if (stageId && typeof stageId === 'object') currentStage = stageId;
    else if (stageId) currentStage = content.stageById(stageId);
    if (!currentStage.tower) { progress.currentStage = currentStage.id; progression.save(); }
    var scale = currentStage.power || (1 + (currentStage.order - 1) * 0.055), partyCost = progression.partyCost(partyIds), balance = balancedEnemyRoster(currentStage, partyCost);
    state = { round: 1, phase: 'deploy', selected: null, inspected: null, mode: 'move', skill: 0, commandOpen: false, over: false, animating: false, autoEnding: false, resultRecorded: false,
      threatKey: null,
      enemyScale: Math.max(scale * balance.scale, balance.minimumScale), partyCost: partyCost, balance: balance, riftPower: 0, reward: null, stats: { damage: 0, healing: 0, skills: 0 }, units: [], obstacles: [], obstacleMap: {}, tower: currentStage.tower ? { wave: 0, maxWaves: 10, commandUsed: false, awaitingChoice: false, attackBonus: 0, healBonus: 0, reviveRemaining: {}, reviveLastTick: 0, autoEnabled: false, boons: [], enemyBuffs: towerEnemyBuffs(currentStage.floor) } : null };
    state.obstacles = currentStage.tower ? [] : (content.obstaclesFor ? content.obstaclesFor(currentStage, COLS, ROWS) : []);
    state.obstacles.forEach(function (spot) { state.obstacleMap[spot.x + ',' + spot.y] = true; });
    clearDeploymentObstacles();
    if (currentStage.tower) state.units.push(guardianTower(currentStage.floor));
    var benched = placeAllies();
    var usedPreset = applySavedFormation();
    var roster = currentStage.tower ? [] : balance.roster;
    enemyFormation(roster).forEach(function (spot, index) {
      var unit = clone(spot.id, 'enemy', spot.x, spot.y, index); unit.squad = spot.squad; state.units.push(unit);
    });
    if (currentStage.bossRaid) {
      var raidInfo = bossRaidInfo(), raidBoss = state.units.find(function (unit) { return unit.boss; });
      if (raidBoss) {
        var raidMaxHp = Math.round(raidBoss.maxHp * (2.4 + raidInfo.tier * 0.9));
        raidBoss.maxHp = raidMaxHp;
        raidBoss.hp = raidInfo.raid.hp && raidInfo.raid.maxHp ? Math.min(raidMaxHp, Math.round(raidInfo.raid.hp / raidInfo.raid.maxHp * raidMaxHp)) : raidMaxHp;
        state.bossRaid = { raid: raidInfo.raid, maxHp: raidMaxHp, element: raidInfo.boss.element };
      }
    }
    dom.board.style.width = '100%';
    dom.board.style.aspectRatio = COLS + ' / ' + ROWS;
    dom.board.style.gridTemplateColumns = 'repeat(' + COLS + ', minmax(0, 1fr))';
    dom.board.style.gridTemplateRows = 'repeat(' + ROWS + ', minmax(0, 1fr))';
    dom.board.dataset.mapKind = content.mapLayout ? content.mapLayout(currentStage) : currentStage.mapId;
    dom.board.style.backgroundImage = "url('" + (content.mapAsset ? content.mapAsset(currentStage) : 'assets/maps/chapter-01-field-21x10.jpg') + "')";
    document.body.className = 'map-' + mapData().theme + ' view-' + currentView;
    captureFormation();
    note((currentStage.tower ? '守護塔防衛：戰鬥開始後我方 AI 自動作戰。每波結束守護塔會治療全隊，請保留每波一次塔之指令。' : (usedPreset ? '已套用此隊伍儲存的部署預設。' : '部署階段：點選我方幻獸，再點藍色部署格調整站位。') + balance.label + '，敵軍共 ' + roster.length + ' 隻。') +
      (benched.length ? '⚠ 布陣空間不足，候補未出戰：' + benched.join('、') + '。' : ''));
    renderProgress(); renderCampaignMeta(); render();
    focusDeployZone(true);
  }

  async function startBattle() {
    if (state.phase !== 'deploy') return;
    var openingScene = storyContent.sceneFor(currentStage.id, 'before');
    if (openingScene) await showStory(openingScene, currentStage.id + ':before');
    rememberFormation();
    state.phase = 'player'; state.selected = null; audio.play('ui');
    if (currentStage.tower) { state.tower.autoEnabled = true; spawnTowerWave(1); return; }
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
    alive(team).filter(function (unit) { return !unit.guardian; }).forEach(function (unit) { counts[unit.p.element] = (counts[unit.p.element] || 0) + 1; });
    var elements = Object.keys(counts), repeated = elements.find(function (element) { return counts[element] >= 3; });
    if (repeated) return { multiplier: 1.12, label: '元素共鳴', copy: repeated + ' 系三獸協同，傷害與治療 +12%。' };
    if (elements.length >= 3) return { multiplier: 1.08, label: '三系戰術', copy: '火、森、海互補，傷害與治療 +8%。' };
    return { multiplier: 1, label: '尚未共鳴', copy: '湊齊三種元素，或三隻相同元素的幻獸可啟動加成。' };
  }
  function combatMultiplier(unit) { return traitFor(unit.team).multiplier * (currentStage.tower && unit.team === 'ally' && !unit.guardian ? 1 + state.tower.attackBonus : 1); }
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
    var queue = [{ x: unit.x, y: unit.y, path: [], cost: 0 }], visited = {}; visited[unit.x + ',' + unit.y] = 0;
    while (queue.length) {
      queue.sort(function (a, b) { return a.cost - b.cost; });
      var current = queue.shift();
      if (current.x === x && current.y === y) return current.path;
      if (current.cost >= maxSteps) continue;
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (delta) {
        var nx = current.x + delta[0], ny = current.y + delta[1], key = nx + ',' + ny, nextCost = current.cost + movementCost(unit, nx, ny);
        if (nextCost <= maxSteps && canStand(unit, nx, ny) && (visited[key] === undefined || nextCost < visited[key])) {
          visited[key] = nextCost; queue.push({ x: nx, y: ny, path: current.path.concat([{ x: nx, y: ny }]), cost: nextCost });
        }
      });
    }
    return null;
  }
  function reachableTiles(unit) {
    var tiles = [{ x: unit.x, y: unit.y, steps: 0 }], visited = {}, queue = [{ x: unit.x, y: unit.y, steps: 0 }], range = moveRange(unit);
    visited[unit.x + ',' + unit.y] = 0;
    while (queue.length) {
      queue.sort(function (a, b) { return a.steps - b.steps; });
      var current = queue.shift();
      if (current.steps >= range) continue;
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (delta) {
        var nx = current.x + delta[0], ny = current.y + delta[1], key = nx + ',' + ny, nextSteps = current.steps + movementCost(unit, nx, ny);
        if (nextSteps <= range && canStand(unit, nx, ny) && (visited[key] === undefined || nextSteps < visited[key])) {
          visited[key] = nextSteps; var next = { x: nx, y: ny, steps: nextSteps }; tiles.push(next); queue.push(next);
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
      /* 減速格不再阻擋遠距視線。 */
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
    await animateWaypoints(unit, path, 'walking', 115);
    unit.moved = true; state.animating = false; note(unitName(unit) + ' 抵達 ' + (unit.x + 1) + '-' + (unit.y + 1) + '。'); render(); maybeAutoEndAfterMoves(); return true;
  }
  function guardianTower(floor) {
    var hp = Math.round(1500 + floor * 260);
    return { id: 'guardian-tower', key: 'ally-guardian-tower', guardian: true, team: 'ally', x: 0, y: 4, hp: hp, maxHp: hp, moved: true, acted: true, facing: 'right', evolution: 1, cooldowns: [], shield: 0, burn: 0, poison: 0, freeze: 0, atkBuff: 0, boss: false,
      p: { id: 'guardian-tower', name: '守護塔', element: 'light', rarity: 'tower', role: 'defender', roleLabel: '守護核心', move: 0, size: 2, stats: { health: hp, power: 0, magic: 0, defense: 42 + floor * 3, speed: 0 }, skills: [], passives: [], evolution: [{ stage: 1, label: '守護核心', portrait: '' }] } };
  }
  function towerUnits() { return state.units.filter(function (unit) { return unit.team === 'ally' && !unit.guardian; }); }
  function towerWaveRoster(wave) {
    var pool = currentStage.enemies, count = Math.min(14, 3 + wave + Math.floor(currentStage.floor / 3)), roster = [];
    var offset = (currentStage.floor * 31 + wave * 17) % pool.length;
    /* 37 與目前名冊長度互質，能讓相鄰波次跨越不同元素、定位與體型，而非只輪到少數單位。 */
    for (var index = 0; index < count; index++) roster.push(pool[(offset + index * 37) % pool.length]);
    if (wave === 5 || wave === 10) roster.unshift(currentStage.towerBosses[(currentStage.floor * 7 + wave) % currentStage.towerBosses.length]);
    return roster;
  }
  function spawnTowerWave(wave) {
    state.units = state.units.filter(function (unit) { return unit.team !== 'enemy'; });
    enemyFormation(towerWaveRoster(wave)).forEach(function (spot, index) { var unit = clone(spot.id, 'enemy', spot.x, spot.y, index); unit.squad = 0; state.units.push(unit); });
    state.tower.wave = wave; state.tower.commandUsed = false; state.phase = 'player';
    towerUnits().filter(function (unit) { return unit.hp > 0; }).forEach(function (unit) { unit.moved = false; unit.acted = false; });
    note('第 ' + wave + '／10 波來襲！敵軍 Buff：' + towerBuffSummary() + '。守護塔受到攻擊即為失敗條件。'); render(); phaseBanner('🛡 第 ' + wave + ' 波｜守護塔防衛', 'player');
    if (state.tower.autoEnabled && !autoTimer) startAuto();
  }

  /* 單次 WAAPI 路徑：資料先到終點，畫面沿途連續位移，只在終點重繪。 */
  async function animateWaypoints(unit, path, motionClass, millisecondsPerCell) {
    if (!path.length) return;
    var originX = unit.x, originY = unit.y;
    var piece = dom.board.querySelector('[data-key="' + unit.key + '"]');
    var cellWidth = dom.board.clientWidth / COLS, cellHeight = dom.board.clientHeight / ROWS;
    var totalDuration = duration(millisecondsPerCell * path.length), timers = [];
    path.forEach(function (point, index) {
      var fromX = index ? path[index - 1].x : originX;
      var fromY = index ? path[index - 1].y : originY;
      timers.push(setTimeout(function () {
        if (point.x !== fromX) unit.facing = path[index].x > fromX ? 'right' : 'left';
        else if (point.y !== fromY) unit.facing = path[index].y > fromY ? 'down' : 'up';
        if (piece) {
          piece.classList.toggle('facing-right', unit.facing === 'right');
          piece.classList.toggle('facing-left', unit.facing === 'left');
          piece.classList.toggle('facing-up', unit.facing === 'up');
          piece.classList.toggle('facing-down', unit.facing === 'down');
        }
        audio.play('move');
      }, Math.round(totalDuration * index / path.length)));
    });
    unit.x = path[path.length - 1].x; unit.y = path[path.length - 1].y;
    if (piece && typeof piece.animate === 'function' && cellWidth > 0 && cellHeight > 0) {
      piece.classList.add(motionClass);
      var keyframes = [{ transform: 'translate(0px, 0px)', offset: 0 }].concat(path.map(function (point, index) {
        return { transform: 'translate(' + ((point.x - originX) * cellWidth) + 'px, ' + ((point.y - originY) * cellHeight) + 'px)', offset: (index + 1) / path.length };
      }));
      var animation = piece.animate(keyframes, { duration: totalDuration, easing: 'linear', fill: 'forwards' });
      try { await animation.finished; } catch (error) { /* render/navigation cancellation is safe */ }
      piece.classList.remove(motionClass);
    } else await pause(millisecondsPerCell * path.length);
    timers.forEach(clearTimeout);
  }

  function damage(attacker, target, skill, options) {
    options = options || {};
    /* 最後一道友軍傷害保護：任何呼叫端都不能讓同陣營單位扣血。 */
    if (!attacker || !target || attacker.team === target.team) return { amount: 0, absorbed: 0, crit: false };
    if (options.dodged) return { amount: 0, absorbed: 0, crit: false, dodged: true };
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
    if (target.hp <= 0) target.defeating = true;
    if (attacker.team === 'ally') state.stats.damage += amount;
    return { amount: amount, absorbed: absorbed, crit: crit, dodged: false };
  }

  /* 速度較快者較能閃避；冰凍時無法閃避，必殺技與近戰則較難避開。 */
  function dodgeChance(attacker, target, skill) {
    if (!attacker || !target || target.freeze > 0 || skill.attackStyle === 'support') return 0;
    var speedLead = Math.max(0, stat(target, 'speed') - stat(attacker, 'speed'));
    var chance = Math.min(0.28, speedLead * 0.035 + Math.max(0, stat(target, 'speed') - 5) * 0.006);
    if (skill.attackStyle === 'melee') chance *= 0.55;
    if (skill.kind === 'ultimate') chance *= 0.6;
    return Number(chance.toFixed(3));
  }
  function willDodge(attacker, target, skill) { return Math.random() < dodgeChance(attacker, target, skill); }

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
    if (state && state.animating) return;
    var scroller = dom.board.parentElement, sample = dom.board.firstChild;
    if (!scroller || !sample || !sample.offsetWidth) return;
    var size = sample.offsetWidth;
    scroller.scrollTo({
      left: Math.max(0, (x + 0.5) * size - scroller.clientWidth / 2),
      top: Math.max(0, (y + 0.5) * size - scroller.clientHeight / 2),
      behavior: instant ? 'auto' : 'smooth'
    });
  }
  function focusUnit(unit, instant) {
    if (!unit) return;
    focusCamera(unit.x + (unitSize(unit) - 1) / 2, unit.y + (unitSize(unit) - 1) / 2, instant);
    var piece = dom.board.querySelector('[data-key="' + unit.key + '"]');
    if (piece) {
      piece.classList.remove('camera-focus');
      void piece.offsetWidth;
      piece.classList.add('camera-focus');
      setTimeout(function () { piece.classList.remove('camera-focus'); }, duration(520));
    }
  }
  function focusDeployZone(instant) { focusCamera((DEPLOY_MIN_X + DEPLOY_MAX_X) / 2, (DEPLOY_MIN_Y + DEPLOY_MAX_Y) / 2, instant); }
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
  }

  /* 粒子爆散：hit 向外飛散、heal 向上飄升、death 大範圍炸開。 */
  function burst(target, hue, kind, count) {
    var cell = visualHost(target); if (!cell) return;
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
  /* Every battle effect uses the rendered unit rather than its top-left grid
     anchor.  That keeps 2×2+ units centred and gives projectiles a real
     caster-to-target trajectory. */
  function visualHost(unit) {
    return dom.board.querySelector('[data-key="' + unit.key + '"]') || cellAt(unit.x, unit.y);
  }
  function impactRing(target, hue) {
    var cell = visualHost(target); if (!cell) return;
    var ring = document.createElement('i'); ring.className = 'impact-ring'; ring.style.setProperty('--vfx', 'hsl(' + hue + ' 92% 66%)');
    cell.appendChild(ring); setTimeout(function () { ring.remove(); }, duration(520));
  }
  function telegraphArea(center, radius, hue) {
    for (var y = 0; y < ROWS; y++) for (var x = 0; x < COLS; x++) {
      if (Math.abs(x - center.x) + Math.abs(y - center.y) > radius) continue;
      var cell = cellAt(x, y); if (!cell) continue;
      var mark = document.createElement('i'); mark.className = 'aoe-mark'; mark.style.setProperty('--vfx', 'hsl(' + hue + ' 92% 62%)');
      cell.appendChild(mark); setTimeout(function (node) { node.remove(); }, duration(560), mark);
    }
  }
  /* 近戰揮砍弧光與施法魔法陣 */
  function slashFx(target) {
    var cell = visualHost(target); if (!cell) return;
    var slash = document.createElement('i'); slash.className = 'slash-fx';
    slash.style.setProperty('--slash-rot', (Math.random() * 70 - 35).toFixed(0) + 'deg');
    cell.appendChild(slash); setTimeout(function () { slash.remove(); }, duration(430));
  }
  function castCircle(unit, hue) {
    var cell = visualHost(unit); if (!cell) return;
    var circle = document.createElement('i'); circle.className = 'cast-circle';
    circle.style.setProperty('--vfx', 'hsl(' + hue + ' 92% 66%)');
    cell.appendChild(circle); setTimeout(function () { circle.remove(); }, duration(620));
  }
  function ultimateFlash() {
    var wrap = dom.board.parentElement.parentElement;
    wrap.classList.add('ult-cast'); setTimeout(function () { wrap.classList.remove('ult-cast'); }, duration(620));
  }

  function addVisual(target, element, skill, amount, healing, absorbed, crit) {
    var cell = visualHost(target); if (!cell) return;
    var fxClass = skill.status === 'freeze' ? 'fx-freeze' : skill.status === 'poison' ? 'fx-poison' : skill.status === 'burn' ? 'fx-burn' : (skill.push || skill.pull) ? 'fx-force' : '';
    var vfxSpec = window.TACTICAL_ANIMATION_CONFIG.vfx(skill);
    var fx = document.createElement('i'); fx.className = 'vfx ' + (element || 'fire') + ' variant-' + (skill.vfxVariant || 0) + (fxClass ? ' ' + fxClass : '') + (healing ? ' support-vfx' : ''); fx.style.setProperty('--vfx', 'hsl(' + skill.vfxHue + ' 92% 62%)'); fx.setAttribute('aria-label', skill.name + ' 特效'); cell.appendChild(fx);
    var number = document.createElement('b'); number.className = 'damage-number ' + (healing ? 'heal' : '') + (crit ? ' crit' : ''); number.textContent = absorbed && !amount ? '護盾' : (crit ? '爆擊 ' : '') + (healing ? '+' : '−') + amount;
    fx.style.setProperty('--vfx-frames', vfxSpec.frameCount); fx.style.setProperty('--vfx-duration', vfxSpec.durationMs + 'ms'); fx.dataset.frameCount = String(vfxSpec.frameCount);
    if (skill.kind === 'ultimate' || skill.boss) fx.classList.add('vfx-featured');
    number.style.setProperty('--drift', ((Math.random() - 0.5) * 34).toFixed(0) + 'px'); cell.appendChild(number);
    var piece = cell.classList.contains('unit') ? cell : cell.querySelector('.unit'); if (piece) piece.classList.add(healing ? 'recover' : 'hit');
    if (skill.kind !== 'basic' && !healing) {
      var stamp = document.createElement('i'); stamp.className = 'impact-art';
      stamp.style.backgroundImage = 'url(assets/vfx/impact-' + (element || 'fire') + '.png)';
      cell.appendChild(stamp); setTimeout(function () { stamp.remove(); }, duration(560));
    }
    if (healing) burst(target, 140, 'heal', 7);
    else { burst(target, skill.vfxHue, 'hit', crit ? 14 : 8); if (crit || skill.attackStyle === 'melee') impactRing(target, skill.vfxHue); }
    setTimeout(function () { fx.remove(); number.remove(); if (piece) piece.classList.remove(healing ? 'recover' : 'hit'); }, duration(Math.max(620, vfxSpec.durationMs)));
  }
  function addDodgeVisual(attacker, target) {
    var host = visualHost(target); if (!host) return;
    var dx = target.x - attacker.x, dy = target.y - attacker.y;
    var evadeX = Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? 18 : -18) : 0;
    var evadeY = evadeX ? 0 : (dy >= 0 ? 12 : -12);
    host.style.setProperty('--evade-x', evadeX + 'px'); host.style.setProperty('--evade-y', evadeY + 'px'); host.classList.add('evading');
    var label = document.createElement('b'); label.className = 'dodge-number'; label.textContent = '閃避！'; host.appendChild(label);
    setTimeout(function () { label.remove(); host.classList.remove('evading'); }, duration(620));
  }
  function statusLabel(target, text) {
    var cell = visualHost(target); if (!cell) return;
    var label = document.createElement('b'); label.className = 'status-label'; label.textContent = text; cell.appendChild(label);
    setTimeout(function () { label.remove(); }, duration(760));
  }

  function addProjectile(caster, target, skill, misses) {
    if (skill.attackStyle === 'melee' || skill.attackStyle === 'support') return 0;
    var casterHost = visualHost(caster), targetHost = visualHost(target); if (!casterHost || !targetHost) return 0;
    var element = caster.p.element || 'arcane';
    var projectile = document.createElement('i');
    projectile.className = 'projectile projectile-' + element + (skill.kind === 'basic' ? ' projectile-basic' : ' projectile-skill');
    var boardRect = dom.board.getBoundingClientRect(), casterRect = casterHost.getBoundingClientRect(), targetRect = targetHost.getBoundingClientRect();
    var startX = casterRect.left - boardRect.left + casterRect.width / 2, startY = casterRect.top - boardRect.top + casterRect.height / 2;
    var endX = targetRect.left - boardRect.left + targetRect.width / 2, endY = targetRect.top - boardRect.top + targetRect.height / 2;
    var deltaX = endX - startX, deltaY = endY - startY;
    if (misses) {
      var length = Math.max(1, Math.hypot(deltaX, deltaY)), offset = Math.min(34, Math.max(18, targetRect.width * 0.32));
      var missX = -deltaY / length * offset, missY = deltaX / length * offset;
      deltaX += missX; deltaY += missY;
      projectile.classList.add('projectile-miss');
    }
    projectile.style.setProperty('--projectile', 'hsl(' + skill.vfxHue + ' 92% 68%)');
    projectile.style.left = startX + 'px'; projectile.style.top = startY + 'px';
    projectile.style.setProperty('--travel-x', deltaX + 'px'); projectile.style.setProperty('--travel-y', deltaY + 'px');
    projectile.style.setProperty('--angle', Math.atan2(deltaY, deltaX) + 'rad');
    projectile.setAttribute('aria-label', skill.name + '的' + ({ fire: '火球', forest: '自然彈', ocean: '水流彈', light: '光矢', dark: '暗影彈' }[element] || '魔法彈'));
    var muzzle = document.createElement('i'); muzzle.className = 'projectile-muzzle'; muzzle.style.setProperty('--projectile', 'hsl(' + skill.vfxHue + ' 92% 68%)'); casterHost.appendChild(muzzle);
    dom.board.appendChild(projectile); setTimeout(function () { projectile.remove(); muzzle.remove(); }, duration(420));
    return 330;
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
    var tiles = skill.push || skill.pull; if (!tiles || caster.team === target.team || target.hp <= 0 || target.boss || unitSize(target) > 1) return;
    var dx = target.x - caster.x, dy = target.y - caster.y;
    var stepX = Math.abs(dx) >= Math.abs(dy) ? Math.sign(dx) || 1 : 0, stepY = stepX ? 0 : Math.sign(dy) || 1;
    if (skill.pull) { stepX = -stepX; stepY = -stepY; }
    var movedTiles = 0, path = [], plannedX = target.x, plannedY = target.y;
    for (var index = 0; index < tiles; index++) {
      var nx = plannedX + stepX, ny = plannedY + stepY;
      if (skill.pull && Math.abs(nx - caster.x) + Math.abs(ny - caster.y) < 1) break;
      if (!inBoard(nx, ny) || at(nx, ny)) {
        var impact = Math.max(10, Math.round(target.maxHp * 0.05 * (tiles - index)));
        target.hp = Math.max(0, target.hp - impact);
        if (target.hp <= 0) target.defeating = true;
        if (caster.team === 'ally') state.stats.damage += impact;
        statusLabel(target, '💥 撞擊 −' + impact); audio.play('hit');
        break;
      }
      plannedX = nx; plannedY = ny; path.push({ x: nx, y: ny }); movedTiles++;
    }
    if (movedTiles) { await animateWaypoints(target, path, 'knocked', 100); statusLabel(target, skill.push ? '💨 擊退' : '🪝 拉扯'); audio.play('push'); }
    if (movedTiles || target.hp <= 0) render();
    if (target.hp <= 0) {
      var defeatedPiece = dom.board.querySelector('[data-key="' + target.key + '"]');
      if (defeatedPiece) defeatedPiece.classList.add('defeated', 'unit-defeated');
      burst(target, skill.vfxHue, 'death', 14); impactRing(target, skill.vfxHue); combatShake('light');
      await hitStop(75); await pause(450);
      target.defeating = false; dom.board.parentElement.parentElement.classList.remove('shake-light'); render();
    }
  }

  function canCounter(defender, attacker) {
    if (defender.guardian) return false;
    var basic = defender.p.skills[0];
    return defender.team !== attacker.team && defender.hp > 0 && attacker.hp > 0 && defender.freeze <= 0 && distance(defender, attacker) <= skillRange(defender, basic) && hasSight(defender, attacker, basic);
  }

  function clearForecast() { /* 相容舊呼叫：現行手動操作點擊目標即施放，不再顯示確認面板。 */ }

  /* ── 敵方威脅範圍（點擊敵人顯示移動＋射程圈）── */
  function computeThreat(enemy) {
    var map = {}, tiles = reachableTiles(enemy);
    var maxRange = Math.max.apply(null, enemy.p.skills.map(function (skill) { return skill.attackStyle === 'support' ? 0 : skill.range; }));
    tiles.forEach(function (tile) { map[tile.x + ',' + tile.y] = 'move'; });
    tiles.forEach(function (tile) {
      for (var dy = -maxRange; dy <= maxRange; dy++) for (var dx = -(maxRange - Math.abs(dy)); dx <= maxRange - Math.abs(dy); dx++) {
        var x = tile.x + dx, y = tile.y + dy, key = x + ',' + y;
        if (inBoard(x, y) && !map[key]) map[key] = 'range';
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

  async function hitStop(milliseconds) {
    dom.board.classList.add('hitstop');
    await new Promise(function (resolve) { setTimeout(resolve, milliseconds); });
    dom.board.classList.remove('hitstop');
  }

  function combatShake(kind) {
    var viewport = dom.board.parentElement.parentElement;
    viewport.classList.remove('shake-light', 'shake-crit', 'shake-ultimate');
    void viewport.offsetWidth;
    viewport.classList.add('shake-' + kind);
    return viewport;
  }

  async function act(unit, target, skill, skillIndex, options) {
    options = options || {};
    /* 無論是手動、AUTO、反擊或未來新增的呼叫端，都不能繞過技能的敵我目標規則。 */
    if (!unit || !target || unit.hp <= 0 || target.hp <= 0 || !canUseTarget(unit, target, skill)) return;
    if (!options.nested) state.animating = true;
    unit.acted = true;
    var actualIndex = skillIndex === undefined ? state.skill : skillIndex;
    if (skill.cooldown > 0) unit.cooldowns[actualIndex] = Math.max(1, skill.cooldown - (bonuses(unit).cooldown || 0));
    if (unit.team === 'ally' && skill.kind !== 'basic' && !options.counter) { state.stats.skills++; progression.recordSkill(); }
    if (unit.team === 'ally' && isControlSkill(skill) && !options.counter) progression.recordControl();
    var targetDx = target.x - unit.x, targetDy = target.y - unit.y;
    if (Math.abs(targetDx) >= Math.abs(targetDy) && targetDx !== 0) unit.facing = targetDx > 0 ? 'right' : 'left';
    else if (targetDy !== 0) unit.facing = targetDy > 0 ? 'down' : 'up';
    var opposingTeam = unit.team === 'ally' ? 'enemy' : 'ally';
    var plannedTargets = skill.attackStyle === 'support' ? [] : (skill.attackStyle === 'area' ? alive(opposingTeam).filter(function (entry) { return distance(entry, target) <= (skill.radius || 1); }) : [target]);
    var dodgePlan = {};
    plannedTargets.forEach(function (entry) { dodgePlan[entry.key] = willDodge(unit, entry, skill); });
    render();
    /* 支援技能不能沿用攻擊動作圖；它的目標是友軍，若播放 attack row
       便會視覺上像對自己人出手。 */
    var casterMotionClass = skill.attackStyle === 'support' ? 'supporting' : 'cast';
    var casterPiece = dom.board.querySelector('[data-key="' + unit.key + '"]'); if (casterPiece) casterPiece.classList.add(casterMotionClass);
    if (skill.kind === 'ultimate' && skill.attackStyle !== 'support') ultimateFlash();
    if (skill.attackStyle === 'area') telegraphArea(target, skill.radius || 1, skill.vfxHue);
    if (skill.attackStyle !== 'melee') castCircle(unit, skill.attackStyle === 'support' ? 145 : skill.vfxHue); /* 遠程／輔助：腳下魔法陣 */
    else slashFx(target); /* 近戰：目標身上的揮砍弧光 */
    var projectileDelay = addProjectile(unit, target, skill, Boolean(dodgePlan[target.key]));
    if (projectileDelay) await pause(projectileDelay);

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
      /* 範圍傷害一律以施放者的敵隊為準，避免目標資料異常時誤傷我方幻獸。 */
      var targetsHit = plannedTargets;
      var totalDamage = 0;
      targetsHit.forEach(function (enemy, index) {
        var result = damage(unit, enemy, skill, { counter: options.counter, secondary: index > 0, dodged: dodgePlan[enemy.key] }); totalDamage += result.amount;
        anyCrit = anyCrit || result.crit;
        effects.push({ target: enemy, amount: result.amount, absorbed: result.absorbed, crit: result.crit, dodged: result.dodged, healing: false });
        if (!result.dodged) { passiveBurn(unit, enemy); applyStatus(unit, enemy, skill); }
      });
      var dodgeCount = effects.filter(function (effect) { return effect.dodged; }).length;
      message = (options.counter ? '反擊！' : '') + unitName(unit) + ' 施放「' + skill.name + '」，造成 ' + totalDamage + ' 點傷害' + (anyCrit ? '（爆擊！）' : '') + (dodgeCount ? '（' + dodgeCount + ' 次閃避）' : '') + (targetsHit.length > 1 ? '（命中 ' + (targetsHit.length - dodgeCount) + ' 個目標）' : '') + '。';
      audio.play(skill.attackStyle === 'melee' ? 'attack' : 'ranged');
    }
    note(message); render();
    casterPiece = dom.board.querySelector('[data-key="' + unit.key + '"]');
    if (skill.attackStyle === 'melee' && casterPiece) {
      casterPiece.style.setProperty('--dash-x', (target.x - unit.x) * 42 + 'px'); casterPiece.style.setProperty('--dash-y', (target.y - unit.y) * 42 + 'px'); casterPiece.classList.add('dash');
    }
    await pause(Math.max(0, animationHitDelay(unit, 'attack', skill) - projectileDelay)); effects.forEach(function (effect) {
      if (effect.dodged) { addDodgeVisual(unit, effect.target); return; }
      var visualSkill = effect.healing ? Object.assign({}, skill, { vfxHue: 145, vfxVariant: 3 }) : skill;
      addVisual(effect.target, effect.healing ? 'forest' : unit.p.element, visualSkill, effect.amount, effect.healing, effect.absorbed, effect.crit);
    });
    if (effects.some(function (effect) { return !effect.healing && !effect.dodged; })) {
      combatShake(skill.kind === 'ultimate' ? 'ultimate' : anyCrit ? 'crit' : 'light');
      await hitStop(anyCrit ? 120 : skill.kind === 'ultimate' ? 90 : 75);
      audio.play(anyCrit ? 'crit' : 'hit');
    }
    var defeated = effects.filter(function (effect) { return !effect.healing && effect.target.hp <= 0; });
    var bossDefeated = defeated.some(function (effect) { return effect.target.boss; });
    defeated.forEach(function (effect) {
      var piece = dom.board.querySelector('[data-key="' + effect.target.key + '"]');
      if (piece) piece.classList.add('defeated', effect.target.boss ? 'boss-defeated' : 'unit-defeated');
      burst(effect.target, skill.vfxHue, 'death', effect.target.boss ? 26 : 14); impactRing(effect.target, skill.vfxHue);
    });
    if (bossDefeated) dom.board.parentElement.parentElement.classList.add('boss-death-flash');
    await pause(defeated.length ? 450 : 330);
    if (casterPiece) { casterPiece.classList.remove('cast', 'supporting', 'dash'); }
    dom.board.parentElement.parentElement.classList.remove('shake-light', 'shake-crit', 'shake-ultimate', 'boss-death-flash');
    if ((skill.push || skill.pull) && target.hp > 0) await displace(unit, target, skill);
    defeated.forEach(function (effect) { effect.target.defeating = false; });
    if (defeated.length) render();

    if (!options.counter && skill.attackStyle !== 'support' && target.hp > 0 && canCounter(target, unit) && !state.over) {
      /* 先讓上一擊的受擊特效消失，再開始反擊；否則受擊光效和施法圈會重疊在
         同一隻我方幻獸上，看起來像它在攻擊自己。 */
      state.selected = target.key; note(unitName(target) + ' 準備反擊。'); render();
      await pause(300);
      if (target.hp > 0 && unit.hp > 0 && canCounter(target, unit) && !state.over) await act(target, unit, target.p.skills[0], 0, { counter: true, nested: true });
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

  var moveTargetMap = null; /* 每次 render 只做一次 BFS，供 210 格查表用 */
  function cell(x, y) {
    var element = document.createElement('div'), unit = at(x, y), active = selected(), tile = terrain(x, y); element.className = 'cell';
    if (slowAt(x, y)) {
      element.classList.add('slow-cell'); element.title = '減速：進入此格消耗 2 點行動力';
      element.innerHTML = '<span class="slow-icon" aria-label="減速">▽</span>';
    }
    if (tile) {
      var terrainCopy = tile === 'fire' ? '熔岩：火系增傷，非火系每回合受傷' : tile === 'forest' ? '森林：森林系防禦與治療提升' : '水域：海洋系移動與傷害提升';
      var terrainGlyph = tile === 'fire' ? '♨' : tile === 'forest' ? '♣' : '≈';
      var terrainLabel = tile === 'fire' ? '🔥' : tile === 'forest' ? '🌿' : '💧';
      element.classList.add('terrain-' + tile); element.title = terrainCopy;
      element.innerHTML = '<span class="terrain-hint terrain-hint-' + tile + '" aria-hidden="true">' + terrainLabel + '</span>';
    }
    else if (!slowAt(x, y)) element.innerHTML = '';
    if (state.phase === 'deploy' && !unit && inDeployZone(x, y)) element.classList.add('deploy-zone');
    if (threatTileMap && threatTileMap[x + ',' + y]) element.classList.add(threatTileMap[x + ',' + y] === 'move' ? 'threat-move' : 'threat-range');
    if (active && state.phase === 'deploy' && active.team === 'ally' && !unit && deployFits(active, x, y)) element.classList.add('move-target');
    if (active && state.phase === 'player' && !state.over) {
      if (state.mode === 'move' && !active.moved && moveTargetMap && moveTargetMap[x + ',' + y]) element.classList.add('move-target');
      if (state.mode === 'skill' && unit && !active.acted && canTarget(active, unit)) element.classList.add(skillOf(active).attackStyle === 'support' ? 'support-target' : 'attack-target');
    }
    if (tile && active && active.team === 'ally') {
      var inMoveScope = state.mode === 'move' && moveTargetMap && moveTargetMap[x + ',' + y];
      var gapX = Math.max(0, x - (active.x + unitSize(active) - 1), active.x - x);
      var gapY = Math.max(0, y - (active.y + unitSize(active) - 1), active.y - y);
      var inSkillScope = state.mode === 'skill' && gapX + gapY <= skillRange(active, skillOf(active));
      if (inMoveScope || inSkillScope || (x === active.x && y === active.y)) element.classList.add('terrain-relevant');
    }
    element.addEventListener('click', function () { clickCell(x, y); });
    if (unit && unit.x === x && unit.y === y) element.appendChild(unitElement(unit));
    else if (unit) element.classList.add('covered');
    return element;
  }

  function unitElement(unit) {
    var element = document.createElement('button'); element.type = 'button'; element.className = 'unit portrait-fallback motion-4dir facing-' + unit.facing + ' ' + unit.team + ' size-' + unitSize(unit) + (state.selected === unit.key ? ' active' : '') + (state.inspected === unit.key ? ' inspected' : '') + (unit.team === 'ally' && unit.acted ? ' action-complete' : '') + (state.victoryCinematic && unit.team === 'ally' && unit.hp > 0 ? ' victorious' : '') + (unit.boss ? ' boss-unit' : '') + (unit.freeze > 0 ? ' frozen' : '') + (unit.poison > 0 ? ' poisoned' : '') + (unit.defeating ? ' defeated' : ''); element.dataset.key = unit.key;
    if (unit.guardian) {
      element.className += ' guardian-tower'; element.setAttribute('aria-label', '守護塔，生命 ' + unit.hp + ' / ' + unit.maxHp);
      element.innerHTML = '<span class="guardian-spire" aria-hidden="true"><span class="guardian-core">✦</span></span><span class="unit-info"><span class="unit-health"><i style="width:' + (100 * unit.hp / unit.maxHp) + '%"></i></span></span>';
      element.addEventListener('click', function (event) { event.stopPropagation(); }); return element;
    }
    element.setAttribute('aria-pressed', state.inspected === unit.key ? 'true' : 'false');
    element.setAttribute('aria-label', unit.p.name + '，生命 ' + unit.hp + ' / ' + unit.maxHp);
    var statuses = (unit.shield > 0 ? '🛡️' : '') + (unit.burn > 0 ? '🔥' : '') + (unit.poison > 0 ? '☠️' : '') + (unit.freeze > 0 ? '❄️' : '') + (unit.atkBuff > 0 ? '⬆️' : '');
    element.title = unit.p.name + '（' + unit.p.roleLabel + '）';
    var facingLabel = { right: '右', left: '左', up: '上', down: '下' }[unit.facing] || '右';
    element.innerHTML = '<span class="portrait" role="img" aria-label="' + unit.p.name + '，朝向' + facingLabel + '" style="background-image:url(\'' + portrait(unit) + '\')"></span>' + (statuses ? '<span class="status-icons">' + statuses + '</span>' : '') + '<span class="unit-info"><span class="unit-health"><i style="width:' + (100 * unit.hp / unit.maxHp) + '%"></i></span></span>';
    element.addEventListener('click', function (event) {
      event.stopPropagation();
      if (cameraSuppressed()) return;
      state.inspected = unit.key;
      focusUnit(unit, false);
      if (state.mode === 'skill' && selected() && canTarget(selected(), unit)) { clickCell(unit.x, unit.y); return; }
      if (state.phase === 'deploy' && unit.team === 'ally') { state.selected = unit.key; note('已選擇 ' + unitName(unit) + '，點選左側部署格調整站位。'); render(); return; }
      if (unit.team === 'enemy' && unit.hp > 0 && (state.phase === 'player' || state.phase === 'deploy') && !state.animating) {
        state.threatKey = state.threatKey === unit.key ? null : unit.key; clearForecast(); audio.play('ui');
        note(state.threatKey ? unitName(unit) + ' 的威脅範圍：橘色＝可移動、紅色＝射程涵蓋。再點一次取消。' : '已關閉威脅範圍顯示。');
        render(); return;
      }
      if (!currentStage.tower && unit.team === 'ally' && unit.hp > 0 && state.phase === 'player' && !state.over && !state.animating && !state.autoEnding) { state.selected = unit.key; state.mode = 'move'; state.skill = 0; state.commandOpen = true; clearForecast(); note('已選擇 ' + unitName(unit) + '，請從中央指令面板選擇移動或技能。'); render(); }
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
    dom.board.classList.toggle('is-deploying', state.phase === 'deploy');
    if (dom.deployToolbar) dom.deployToolbar.hidden = state.phase !== 'deploy';
    if (dom.towerCommand) { dom.towerCommand.hidden = !currentStage.tower; dom.towerCommand.disabled = !currentStage.tower || state.tower.commandUsed || state.tower.awaitingChoice || state.over; dom.towerCommand.textContent = state.tower && state.tower.commandUsed ? '🛡 塔之指令・已使用' : '🛡 塔之指令'; }
    if (dom.deployStatus) dom.deployStatus.textContent = '左側 3×10｜出陣 ' + alive('ally').length + ' 隻｜' + state.partyCost + '/25 單位｜' + state.balance.label + '・敵軍 ' + alive('enemy').length + ' 隻' + (active && active.team === 'ally' ? '｜已選 ' + active.p.name : '');
    var fragment = document.createDocumentFragment();
    for (var y = 0; y < ROWS; y++) for (var x = 0; x < COLS; x++) fragment.appendChild(cell(x, y));
    dom.board.innerHTML = ''; dom.board.appendChild(fragment);
    renderParty(); renderTrait(); renderBattleSides(); renderTowerBoonSummary(); renderDetail(); renderBattleCommand(); renderBossBar();
    dom.banner.textContent = state.over ? '戰鬥結束' : state.phase === 'tower-choice' ? '波間整備' : currentStage.tower ? '第 ' + state.tower.wave + '／10 波｜' + (state.phase === 'player' ? '我方 AI 防守' : '魔物進攻') : state.phase === 'deploy' ? '部署階段' : '第 ' + state.round + ' 回合｜' + (state.phase === 'player' ? '我方行動' : '敵方行動');
    dom.roundStatus.textContent = state.over ? '結算完成' : state.phase === 'tower-choice' ? '選擇加護' : currentStage.tower ? '第 ' + state.tower.wave + '／10 波' : state.phase === 'deploy' ? '自由部署' : state.phase === 'player' ? '我方回合' : '敵方回合';
    dom.endTurn.textContent = state.phase === 'deploy' ? '⚔️ 開始戰鬥' : '結束本回合';
    dom.endTurn.hidden = Boolean(currentStage.tower);
    dom.endTurn.disabled = state.over || state.animating || (state.phase !== 'player' && state.phase !== 'deploy');
    if (currentStage.tower) {
      dom.auto.disabled = true;
      dom.auto.classList.add('active');
      dom.auto.textContent = state.phase === 'tower-choice' ? '🤖 守護 AI・整備中' : '🤖 守護 AI・啟動中';
      dom.auto.setAttribute('aria-label', '守護 AI 已固定啟動');
    } else {
      dom.auto.disabled = false;
      dom.auto.removeAttribute('aria-label');
    }
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
    state.units.filter(function (unit) { return unit.team === 'ally' && !unit.guardian; }).forEach(function (unit) {
      var card = document.createElement('button'); card.type = 'button'; card.className = 'party-card' + (state.selected === unit.key ? ' selected' : '') + (unit.hp <= 0 ? ' dead' : ''); card.disabled = unit.hp <= 0;
      card.innerHTML = '<div class="party-name">' + unit.p.name + (unitSize(unit) > 1 ? ' ⬛2×2' : '') + '</div><div class="party-meta">' + unit.p.roleLabel + '｜★' + progression.starOf(unit.id) + '｜融合 ' + (progress.fusion[unit.id] || 0) + '</div><div class="hpbar"><i style="width:' + (100 * unit.hp / unit.maxHp) + '%"></i></div>';
      card.onclick = function () { if ((state.phase === 'player' || state.phase === 'deploy') && !state.over && !state.animating) { state.selected = unit.key; state.inspected = unit.key; state.mode = 'move'; state.commandOpen = state.phase === 'player'; render(); focusUnit(unit, false); } }; dom.list.appendChild(card);
    });
  }
  function renderBattleSides() {
    if (!dom.battleAllyList) return;
    var allies = state.units.filter(function (unit) { return unit.team === 'ally' && !unit.guardian; });
    var livingAllies = allies.filter(function (unit) { return unit.hp > 0; });
    var enemies = state.units.filter(function (unit) { return unit.team === 'enemy'; });
    var livingEnemies = enemies.filter(function (unit) { return unit.hp > 0; });
    dom.battleAllyCount.textContent = livingAllies.length + ' / ' + allies.length;
    dom.battleEnemyCount.textContent = livingEnemies.length + ' / ' + enemies.length;
    dom.battleObjective.textContent = currentStage.tower ? '目標｜守護塔 ' + state.units.find(function (unit) { return unit.guardian; }).hp + ' / ' + state.units.find(function (unit) { return unit.guardian; }).maxHp + '｜第 ' + state.tower.wave + '／10 波｜敵軍 Buff：' + towerBuffSummary() : '目標｜' + currentStage.objective + '｜' + state.balance.label + '（' + state.partyCost + '/25）';
    var trait = traitFor('ally');
    dom.battleTeamTrait.innerHTML = '<b>✦ ' + trait.label + '</b><span>' + trait.copy + '</span>';
    dom.battleAllyList.innerHTML = '';
    allies.forEach(function (unit) {
      if (currentStage.tower && unit.hp <= 0) queueTowerRevival(unit);
      var reviveText = currentStage.tower && unit.hp <= 0 ? '｜⏱ 復活 ' + reviveCountdown(unit) + ' 秒' : '';
      var card = document.createElement('button');
      card.type = 'button';
      card.className = 'battle-roster-card' + (state.selected === unit.key ? ' selected' : '') + (unit.hp <= 0 ? ' defeated reviving' : '') + (unit.acted ? ' acted' : '');
      card.innerHTML = '<i style="background-image:url(\'' + portrait(unit) + '\')"></i><span><b>' + unit.p.name + '</b><small>' + unit.p.roleLabel + (unitSize(unit) > 1 ? '｜' + unitSize(unit) + '×' + unitSize(unit) : '') + (unit.acted ? '｜✓ 已行動' : '') + reviveText + '</small><em><u style="width:' + (100 * unit.hp / unit.maxHp) + '%"></u></em></span>';
      card.setAttribute('aria-label', unit.p.name + (unit.hp <= 0 && currentStage.tower ? '，復活倒數 ' + reviveCountdown(unit) + ' 秒' : '，生命 ' + unit.hp + ' / ' + unit.maxHp) + '，點擊置中');
      card.onclick = function () {
        if (cameraSuppressed() || unit.hp <= 0) return;
        if (!currentStage.tower && (state.phase === 'player' || state.phase === 'deploy') && !state.over && !state.animating) { state.selected = unit.key; state.inspected = unit.key; state.mode = 'move'; state.skill = 0; state.commandOpen = state.phase === 'player'; render(); }
        focusUnit(unit, false);
      };
      dom.battleAllyList.appendChild(card);
    });
    var boss = livingEnemies.find(function (unit) { return unit.boss; });
    if (boss) dom.battleEnemySummary.textContent = '首領 ' + boss.p.name + '｜生命 ' + boss.hp + ' / ' + boss.maxHp;
    else if (livingEnemies.length) dom.battleEnemySummary.textContent = state.balance.label + '｜剩餘 ' + livingEnemies.length + ' 隻｜戰力倍率 ×' + state.enemyScale.toFixed(2);
    else dom.battleEnemySummary.textContent = '敵軍已全數擊破';
  }
  function renderTowerBoonSummary() {
    var label = document.querySelector('.battle-hud .ally-label');
    if (!label) return;
    var summary = document.getElementById('tower-boon-summary');
    if (!summary) { summary = document.createElement('small'); summary.id = 'tower-boon-summary'; summary.className = 'tower-boon-summary'; label.appendChild(summary); }
    if (!currentStage.tower || !state.tower || !state.tower.boons.length) { summary.hidden = true; summary.textContent = ''; return; }
    var labels = { attack: '⚔', heal: '💚', fortify: '🛡' };
    summary.hidden = false; summary.textContent = '｜' + state.tower.boons.map(function (id) { return labels[id] || id; }).join(' ');
  }
  function renderTrait() { var trait = traitFor('ally'); dom.teamTrait.innerHTML = '<b>✦ ' + trait.label + '</b><span>' + trait.copy + '</span>'; }
  function renderTurnOrder() {
    var units = alive('ally').concat(alive('enemy')).sort(function (a, b) { return b.p.stats.speed - a.p.stats.speed; });
    dom.turnOrder.innerHTML = '<b>速度行動序列</b><div class="order-chips">' + units.map(function (unit) {
      return '<span class="order-chip ' + unit.team + (unit.acted ? ' done' : '') + (unit.boss ? ' boss' : '') + '" title="' + unit.p.name + '｜速度 ' + unit.p.stats.speed + '"><i style="background-image:url(\'' + portrait(unit) + '\')"></i><small>' + unit.p.stats.speed + '</small></span>';
    }).join('') + '</div>';
  }
  function renderDetail() {
    var unit = inspected(); dom.skills.innerHTML = '';
    if (!unit) { dom.detail.textContent = state.phase === 'deploy' ? '點選地圖上的幻獸或魔獸查看資訊；我方幻獸可繼續調整部署。' : '點選地圖上的任一幻獸或魔獸查看完整資訊。'; return; }
    var passive = unit.p.passives.map(function (entry) { return '<b>' + entry.name + '</b>：' + passiveDescription(entry); }).join('<br>') || '無';
    var statusText = [];
    if (unit.freeze > 0) statusText.push('❄ 冰凍 ' + unit.freeze);
    if (unit.poison > 0) statusText.push('☠ 中毒 ' + unit.poison);
    if (unit.burn > 0) statusText.push('🔥 灼燒 ' + unit.burn);
    var elementIcon = { fire: '🔥', forest: '🌿', ocean: '🌊', light: '✨', dark: '🌑' }[unit.p.element] || '◆';
    var stage = unit.p.evolution[Math.min(unit.evolution, unit.p.evolution.length) - 1];
    var teamLabel = unit.team === 'ally' ? '我方幻獸' : unit.boss ? '敵方首領' : '敵方魔獸';
    var skillInfo = unit.p.skills.map(function (skill) {
      var type = skill.attackStyle === 'support' ? '輔助' : skill.attackStyle === 'area' ? '範圍' : skill.attackStyle === 'melee' ? '近戰' : '遠程';
      var cooldown = skill.cooldown ? '・冷卻' + skill.cooldown : '・無冷卻';
      return '<li><b>' + skill.name + '</b><span>' + type + '・距離' + skillRange(unit, skill) + cooldown + '</span></li>';
    }).join('');
    dom.detail.innerHTML = '<div class="detail-head"><span class="detail-face" style="background-image:url(\'' + portrait(unit) + '\')"></span><div class="detail-title"><strong>' + unit.p.name + '</strong><small>' + elementIcon + ' ' + teamLabel + '・' + unit.p.roleLabel + '</small><span class="detail-hp"><i style="width:' + (100 * unit.hp / unit.maxHp) + '%"></i></span></div></div><div class="detail-tags"><span>' + (stage?.label || '戰鬥型態') + '</span><span>' + unitSize(unit) + '×' + unitSize(unit) + '</span><span>' + (unit.p.rarity || 'normal').toUpperCase() + '</span></div><p class="detail-passive">被動：' + passive + (statusText.length ? '<br>狀態：' + statusText.join('、') : '') + '</p><div class="stat-grid"><span>力量 ' + Math.round(stat(unit, 'power')) + '</span><span>魔力 ' + Math.round(stat(unit, 'magic')) + '</span><span>防衛 ' + Math.round(stat(unit, 'defense')) + '</span><span>速度 ' + unit.p.stats.speed + '</span><span>血量 ' + unit.hp + '/' + unit.maxHp + '</span><span>移動 ' + moveRange(unit) + ' 格</span></div><h3 class="detail-skill-title">技能資訊</h3><ul class="detail-skill-list">' + skillInfo + '</ul>';
    if (unit.team !== 'ally') return;
    unit.p.skills.forEach(function (skill, index) {
      var button = document.createElement('button'), cooldown = unit.cooldowns[index] || 0;
      button.className = 'skill' + (skill.kind === 'basic' ? ' basic-skill' : '') + (cooldown ? ' cooling' : ' ready') + (state.mode === 'skill' && state.skill === index ? ' active' : '');
      button.disabled = unit.acted || cooldown > 0 || state.phase !== 'player' || state.over || state.animating;
      var extras = (skill.status === 'freeze' ? '❄' : skill.status === 'poison' ? '☠' : skill.status === 'burn' ? '🔥' : '') + (skill.push ? '💨' : '') + (skill.pull ? '🪝' : '');
      button.textContent = (skill.kind === 'basic' ? '⚔ 普攻．' : (index + 1) + '．') + skill.name + extras + '｜' + (skill.attackStyle === 'support' ? '輔助' : skill.attackStyle === 'area' ? '範圍' : '射程 ' + skillRange(unit, skill)) + (skill.kind === 'basic' ? '｜無冷卻' : cooldown ? '（冷卻 ' + cooldown + '）' : '');
      button.onclick = function () { state.selected = unit.key; state.mode = 'skill'; state.skill = index; clearForecast(); audio.play('ui'); note('已選擇「' + skill.name + '」，點擊高亮的' + (skill.attackStyle === 'support' ? '我方' : '敵方') + '目標後立即施放。'); render(); }; dom.skills.appendChild(button);
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
      clearForecast();
      await act(unit, target, skillOf(unit), state.skill);
      return;
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
    if (currentStage.tower && unit.team === 'ally') {
      var guardian = state.units.find(function (entry) { return entry.guardian && entry.hp > 0; });
      if (guardian) {
        var towerDistance = distance(tile, guardian);
        if (fragileRole(unit)) score += Math.max(0, 7 - towerDistance) * 3;
        else if (opponents.length) {
          var closestThreat = opponents.slice().sort(function (a, b) { return distance(a, guardian) - distance(b, guardian); })[0];
          var guardLine = Math.max(2, Math.min(6, distance(closestThreat, guardian) - 1));
          score += Math.max(0, 12 - Math.abs(towerDistance - guardLine) * 3);
        }
      }
    }
    return score;
  }
  function towerDefenseTarget(unit) {
    var guardian = state.units.find(function (entry) { return entry.guardian && entry.hp > 0; });
    var enemies = alive('enemy');
    if (!guardian || !enemies.length) return closest(unit, enemies);
    return enemies.slice().sort(function (a, b) {
      return distance(a, guardian) - distance(b, guardian) || distance(unit, a) - distance(unit, b);
    })[0];
  }
  function planFor(unit) {
    /* 目標陣營由施放者本身推導，不能由呼叫端傳入。
       這樣 AUTO 的選目標階段永遠不會把同陣營單位列入攻擊候選。 */
    var opponents = state.units.filter(function (entry) { return entry.hp > 0 && entry.team !== unit.team; });
    var friends = alive(unit.team), tiles = reachableTiles(unit), best = null;
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
            var score = positionScore + (skill.effect === 'heal' || skill.effect === 'heal_all' ? 12 + missing * 80 : 16 + missing * 12) + (friend.boss ? 4 : 0) + (friend.guardian ? 56 + missing * 90 : 0);
            if (skill.effect === 'heal_all') score += friends.filter(function (entry) { return entry.hp < entry.maxHp; }).length * 8;
            if (missing < 0.08 && skill.effect !== 'shield' && skill.effect !== 'buff_atk') return;
            if (!best || score > best.score) best = { tile: tile, skill: skill, index: index, target: friend, score: score };
          });
          return;
        }
        opponents.forEach(function (target) {
          /* 防禦性保護：即使日後候選清單變更，攻擊技能也不評估友軍。 */
          if (target.team === unit.team) return;
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
          if (currentStage.tower && unit.team === 'ally') {
            var guardian = state.units.find(function (entry) { return entry.guardian && entry.hp > 0; });
            if (guardian) score += Math.max(0, 9 - distance(target, guardian)) * 11;
          }
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
    var unit = alive('ally').find(function (entry) { return !entry.guardian && !entry.acted; });
    if (!unit) { await endTurn(true); scheduleAuto(); return; }
    if (unit.freeze > 0) { unit.moved = true; unit.acted = true; note(unitName(unit) + ' 被冰凍，無法行動。'); render(); scheduleAuto(); return; }
    state.selected = unit.key;
    var plan = planFor(unit);
    if (plan) await executePlan(unit, plan);
    else if (!unit.moved && unit.hp < unit.maxHp * 0.4 && nearestHealer(unit) && distance(unit, closest(unit, alive('enemy')) || unit) > 2) {
      /* 殘血且未接戰：撤向治療者等待救援。 */
      await advanceToward(unit, nearestHealer(unit)); unit.acted = true; note(unitName(unit) + ' 撤向後方尋求治療。'); render();
    }
    else if (!unit.moved && alive('enemy').length) { await advanceToward(unit, currentStage.tower ? towerDefenseTarget(unit) : closest(unit, alive('enemy'))); var retry = planFor(unit); if (retry) await executePlan(unit, retry); else { unit.acted = true; render(); } }
    else { unit.acted = true; note(unitName(unit) + ' 沒有可用目標，結束本次行動。'); render(); }
    scheduleAuto();
  }
  function stopAuto(preserveTowerSetting) {
    if (autoTimer) clearTimeout(autoTimer); autoTimer = null;
    if (currentStage.tower && state && state.tower && !preserveTowerSetting) state.tower.autoEnabled = false;
    dom.auto.classList.remove('active'); dom.auto.textContent = '🤖 AUTO';
  }
  function startAuto() {
    if (autoTimer || state.over || state.phase === 'tower-choice') return;
    clearForecast(); state.commandOpen = false; autoTimer = setTimeout(autoStep, 10);
    dom.auto.classList.add('active'); dom.auto.textContent = '🤖 AUTO ✓'; render();
  }
  function toggleAuto() {
    audio.unlock();
    if (currentStage.tower) return;
    if (autoTimer) { stopAuto(false); render(); return; }
    startAuto(); note('AUTO 啟動：AI 會評估走位、視線、集火與控場時機。');
  }
  function cycleSpeed() { var speeds = [1, 1.5, 2], index = speeds.indexOf(battleSpeed); battleSpeed = speeds[(index + 1) % speeds.length]; document.documentElement.style.setProperty('--battle-rate', 1 / battleSpeed); dom.speed.textContent = '⚡ ' + battleSpeed + '×'; if (autoTimer) scheduleAuto(); audio.play('ui'); }

  async function endTurn(fromAuto) {
    if (currentStage.tower && !fromAuto) return;
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
      /* 敵方施法時必須將畫面焦點交給真正的施放者，避免保留上一隻我方
         幻獸的選取光圈，造成「我方在攻擊自己」的錯覺。 */
      state.selected = enemy.key; state.commandOpen = false; clearForecast(); render();
      if (enemy.freeze > 0) { enemy.freeze--; note(unitName(enemy) + ' 被冰凍，無法行動。'); statusLabel(enemy, '❄ 冰凍中'); render(); await pause(240); continue; }
      var plan = planFor(enemy);
      if (plan) await executePlan(enemy, plan);
      else if (!enemy.moved) { await advanceToward(enemy, closest(enemy, targets)); var retry = planFor(enemy); if (retry) await executePlan(enemy, retry); else { enemy.acted = true; note(unitName(enemy) + ' 逼近我方陣線。'); render(); await pause(100); } }
      else { enemy.acted = true; note(unitName(enemy) + ' 無法接近目標。'); render(); await pause(100); }
    }
    if (!state.over) {
      state.phase = 'player'; state.selected = null; state.round++;
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
    if (currentStage.tower) {
      var guardian = state.units.find(function (unit) { return unit.guardian; });
      if (!guardian || guardian.hp <= 0) { finishBattle(false, '守護塔破碎，防衛失敗。'); return true; }
      if (!alive('enemy').length && state.tower.wave > 0) {
        if (state.tower.wave >= state.tower.maxWaves) { finishBattle(true, '十波魔物已全數擊退，守護塔安然無恙！'); return true; }
        if (!state.tower.awaitingChoice) completeTowerWave();
        return true;
      }
      return false;
    }
    if (currentStage.boss && !state.units.some(function (unit) { return unit.boss && unit.hp > 0; })) { finishBattle(true, '頭目已被擊破，殘餘魔物潰逃——遠征勝利！'); return true; }
    if (!alive('enemy').length) { finishBattle(true); return true; }
    if (!alive('ally').length) { finishBattle(false); return true; }
    return false;
  }
  function towerBoonOptions() {
    return [
      { id: 'attack', title: '⚔ 銳鋒共鳴', copy: '我方幻獸傷害 +12%', apply: function () { state.tower.attackBonus += 0.12; } },
      { id: 'heal', title: '💚 生命潮汐', copy: '波間治療量 +12%，立刻額外治療全隊', apply: function () { state.tower.healBonus += 0.12; towerHealAll(0.16); } },
      { id: 'fortify', title: '🛡 塔壁加固', copy: '守護塔立刻修復 18% 並獲得護盾', apply: function () { var tower = state.units.find(function (unit) { return unit.guardian; }); tower.hp = Math.min(tower.maxHp, tower.hp + Math.round(tower.maxHp * 0.18)); tower.shield += Math.round(tower.maxHp * 0.12); } }
    ];
  }
  function towerHealAll(rate) {
    var multiplier = 1 + state.tower.healBonus;
    towerUnits().filter(function (unit) { return unit.hp > 0; }).forEach(function (unit) { var amount = Math.round(unit.maxHp * rate * multiplier); unit.hp = Math.min(unit.maxHp, unit.hp + amount); unit.shield += Math.round(amount * 0.25); });
    var tower = state.units.find(function (unit) { return unit.guardian; }); tower.hp = Math.min(tower.maxHp, tower.hp + Math.round(tower.maxHp * rate * 0.7));
  }
  var TOWER_REVIVE_MS = 12000;
  function queueTowerRevival(unit) {
    if (!currentStage.tower || !state.tower || !unit || unit.hp > 0 || Object.prototype.hasOwnProperty.call(state.tower.reviveRemaining, unit.key)) return;
    state.tower.reviveRemaining[unit.key] = TOWER_REVIVE_MS;
    state.tower.reviveLastTick = Date.now();
    ensureTowerReviveTimer();
  }
  function reviveCountdown(unit) {
    var remaining = state && state.tower && state.tower.reviveRemaining[unit.key];
    return typeof remaining === 'number' ? Math.max(0, Math.ceil(remaining / 1000)) : 0;
  }
  function placeTowerRevival(unit) {
    var guardian = state.units.find(function (entry) { return entry.guardian; });
    if (!guardian) return;
    var size = unitSize(unit), candidates = [];
    /* 先嘗試守護塔右側，無空位才按距離向外展開。 */
    for (var x = guardian.x + unitSize(guardian); x < Math.min(COLS - size + 1, guardian.x + 9); x++) {
      for (var y = 0; y <= ROWS - size; y++) candidates.push({ x: x, y: y, distance: Math.abs(x - (guardian.x + unitSize(guardian))) + Math.abs(y - guardian.y) });
    }
    candidates.sort(function (a, b) { return a.distance - b.distance; });
    unit.x = -99; unit.y = -99;
    var spot = candidates.find(function (candidate) { return canStand(unit, candidate.x, candidate.y); });
    if (spot) { unit.x = spot.x; unit.y = spot.y; }
  }
  function reviveTowerUnit(unit) {
    placeTowerRevival(unit);
    unit.hp = Math.round(unit.maxHp * 0.38); unit.shield = Math.round(unit.maxHp * 0.08);
    unit.burn = 0; unit.poison = 0; unit.freeze = 0; unit.defeating = false; unit.acted = false;
    delete state.tower.reviveRemaining[unit.key]; statusLabel(unit, '✦ 塔之復甦');
  }
  function processTowerRevives() {
    if (!state || !state.tower || state.over || state.phase === 'tower-choice') return;
    var now = Date.now(), previousTick = state.tower.reviveLastTick || now;
    var elapsed = Math.max(0, now - previousTick) * battleSpeed;
    state.tower.reviveLastTick = now;
    var changed = false;
    towerUnits().filter(function (unit) { return unit.hp <= 0; }).forEach(function (unit) {
      if (!Object.prototype.hasOwnProperty.call(state.tower.reviveRemaining, unit.key)) { queueTowerRevival(unit); return; }
      state.tower.reviveRemaining[unit.key] = Math.max(0, state.tower.reviveRemaining[unit.key] - elapsed);
      if (state.tower.reviveRemaining[unit.key] <= 0) { reviveTowerUnit(unit); changed = true; }
    });
    if (changed) { note('守護塔完成靈魂修復：倒下的幻獸已重返戰場。'); render(); }
  }
  function ensureTowerReviveTimer() {
    if (towerReviveTick) return;
    towerReviveTick = setInterval(function () { processTowerRevives(); if (!state || !state.tower || state.over || !Object.keys(state.tower.reviveRemaining).length) stopTowerReviveTimer(); else renderBattleSides(); }, 250);
  }
  function stopTowerReviveTimer() { if (towerReviveTick) clearInterval(towerReviveTick); towerReviveTick = null; }
  function completeTowerWave() {
    state.tower.awaitingChoice = true; stopAuto(true);
    towerUnits().filter(function (unit) { return unit.hp <= 0; }).forEach(queueTowerRevival);
    towerHealAll(0.22); state.phase = 'tower-choice'; render();
    dom.towerChoiceTitle.textContent = '第 ' + state.tower.wave + ' 波防守成功';
    dom.towerChoiceOptions.innerHTML = '';
    var boons = towerBoonOptions();
    boons.forEach(function (boon) { var button = document.createElement('button'); button.type = 'button'; button.innerHTML = '<b>' + boon.title + '</b><small>' + boon.copy + '</small>'; button.onclick = function () { chooseTowerBoon(boon, false); }; dom.towerChoiceOptions.appendChild(button); });
    dom.towerChoice.hidden = false;
    state.tower.choiceEndsAt = Date.now() + 5000;
    updateTowerChoiceCountdown();
    towerChoiceTick = setInterval(updateTowerChoiceCountdown, 200);
    towerChoiceTimer = setTimeout(function () { chooseTowerBoon(autoTowerBoon(boons), true); }, 5000);
  }
  function stopTowerChoiceTimer() {
    if (towerChoiceTimer) clearTimeout(towerChoiceTimer);
    if (towerChoiceTick) clearInterval(towerChoiceTick);
    towerChoiceTimer = null; towerChoiceTick = null;
  }
  function updateTowerChoiceCountdown() {
    if (!state || !state.tower || !state.tower.awaitingChoice) return;
    var seconds = Math.max(0, Math.ceil((state.tower.choiceEndsAt - Date.now()) / 1000));
    dom.towerChoiceCopy.textContent = '守護塔已治療倖存幻獸；倒下的幻獸將在後續波次由塔復甦。請在 ' + seconds + ' 秒內選擇，逾時由守護塔自動決定加護。';
  }
  function autoTowerBoon(boons) {
    var tower = state.units.find(function (unit) { return unit.guardian; });
    var allies = towerUnits().filter(function (unit) { return unit.hp > 0; });
    var missing = allies.length ? allies.reduce(function (sum, unit) { return sum + (1 - unit.hp / unit.maxHp); }, 0) / allies.length : 0;
    if (tower && tower.hp < tower.maxHp * 0.62) return boons.find(function (boon) { return boon.id === 'fortify'; });
    if (missing > 0.22) return boons.find(function (boon) { return boon.id === 'heal'; });
    return boons.find(function (boon) { return boon.id === 'attack'; });
  }
  function chooseTowerBoon(boon, automatic) {
    if (!boon || !state.tower.awaitingChoice || state.over) return;
    stopTowerChoiceTimer(); boon.apply(); state.tower.boons.push(boon.id); dom.towerChoice.hidden = true; state.tower.awaitingChoice = false;
    note(automatic ? '守護塔自動選擇「' + boon.title.replace(/^[^\s]+\s*/, '') + '」。' : '已選擇「' + boon.title.replace(/^[^\s]+\s*/, '') + '」。');
    spawnTowerWave(state.tower.wave + 1);
  }
  function towerCommand() {
    if (!currentStage.tower || state.tower.commandUsed || state.over || state.tower.awaitingChoice) return;
    state.tower.commandUsed = true;
    var mode = state.tower.wave % 4;
    if (mode === 1) { towerHealAll(0.28); note('塔之指令「生命脈衝」：全隊獲得緊急治療。'); }
    else if (mode === 2) { alive('enemy').forEach(function (unit) { unit.freeze = Math.max(unit.freeze, 1); }); note('塔之指令「寒霜停滯」：本波魔物全體冰凍。'); }
    else if (mode === 3) { var tower = state.units.find(function (unit) { return unit.guardian; }); tower.shield += Math.round(tower.maxHp * 0.3); note('塔之指令「絕對壁壘」：守護塔獲得強力護盾。'); }
    else { towerUnits().filter(function (unit) { return unit.hp <= 0; }).forEach(reviveTowerUnit); note('塔之指令「靈魂召回」：倒下的幻獸立刻復甦。'); }
    audio.play('heal'); render();
  }
  function finishBattle(win, reason) {
    if (state.resultRecorded) return; state.resultRecorded = true; state.over = true; stopAuto(); stopTowerReviveTimer();
    var bossDefeated = win && currentStage.boss;
    var reward;
    if (currentStage.bossRaid) {
      var raidBoss = state.units.find(function (unit) { return unit.boss; });
      var raidResult = progression.recordBossRaid(bossRaidIds(), win, raidBoss ? raidBoss.hp : 0, raidBoss ? raidBoss.maxHp : 1, state.bossRaid && state.bossRaid.element);
      reward = win ? Object.assign({ stars: 1, firstClear: false, cleared: raidResult.cleared }, raidResult.reward) : {};
    } else if (currentStage.tower) {
      var towerResult = progression.completeTower(currentStage.floor, win);
      reward = win ? { stars: 1, medals: 0, essence: towerResult.reward.essence, fusionCore: 0, crystals: towerResult.reward.crystals, gold: towerResult.reward.gold, firstClear: false } : {};
    } else {
      var summary = { win: win, round: state.round, survivors: alive('ally').length, partySize: partyIds.length, bossKill: bossDefeated };
      reward = progression.completeBattle(currentStage, summary);
      var endingScene = win ? storyContent.sceneFor(currentStage.id, 'after') : null;
      if (endingScene && endingScene.rewardKey && progression.grantStoryPet(endingScene.rewardKey, endingScene.rewardPet)) reward.storyPet = endingScene.rewardPet;
    }
    /* 目前上線圖集沒有一致的勝利專用動作列；切換該列會讀到錯誤圖格，
       因此結算前維持正常待機圖，避免勝利瞬間出現殘影／破圖。 */
    state.reward = reward; state.victoryCinematic = false;
    renderProgress(); render(); note(reason || (win ? '勝利！獎勵已加入戰棋資源。' : '戰敗。調整隊伍、進化或技能樹後再次挑戰。'));
    audio.play(win ? 'victory' : 'defeat'); setTimeout(function () { showResult(win); }, duration(win ? 1000 : 700));
  }
  function showResult(win) {
    var survivors = alive('ally').length, reward = state.reward || {};
    dom.resultIcon.textContent = win ? '🏆' : '🌙'; dom.resultStage.textContent = mapData().name + '｜' + currentStage.name; dom.resultTitle.textContent = win ? '遠征勝利' : '本次撤退';
    dom.resultCopy.textContent = win ? (reward.firstClear ? '首次通關完成，已解鎖下一個關卡。' : '重複挑戰完成，取得部分固定資源。') : '可先調整隊伍、融合階級與技能樹再挑戰。';
    dom.resultStats.innerHTML = '<span><b>' + state.round + '</b>回合</span><span><b>' + state.stats.damage + '</b>傷害</span><span><b>' + survivors + '/' + partyIds.length + '</b>存活</span>';
    dom.resultRewards.textContent = win
      ? '★'.repeat(reward.stars || 1) + (reward.medals ? '　🏅 +' + reward.medals : '') + (reward.essence ? '　🔷 +' + reward.essence : '') + (reward.fusionCore ? '　🧬 +' + reward.fusionCore : '') + (reward.coreLabel ? '　✦ ' + reward.coreLabel : '') + (reward.crystals ? '　💎 +' + reward.crystals : '') + (reward.gold ? '　🪙 +' + reward.gold : '') + (reward.summonShards ? '　🧩 +' + reward.summonShards + ' 召喚碎片' : '') + (reward.storyPet ? '　🦌 新夥伴：' + profile(reward.storyPet).name : '')
      : '本次沒有取得掉落物';
    if (currentStage.bossRaid) {
      var bossResult = state.reward || {};
      dom.resultStage.textContent = '每日 Boss 來襲｜' + currentStage.name;
      dom.resultCopy.textContent = win ? (bossResult.cleared ? '五段難度全部討伐完成，明日將輪替新的 Boss。' : '討伐成功！已解鎖下一個難度。') : 'Boss 保留目前剩餘 HP；支付金幣即可在今日繼續討伐。';
      document.getElementById('result-next').textContent = win && !bossResult.cleared ? '👑 挑戰下一難度' : '回到機庫';
      document.getElementById('result-next').hidden = false;
    } else if (currentStage.tower) {
      dom.resultCopy.textContent = win ? '第 ' + currentStage.floor + ' 層攻略完成！歷史最高 ' + progress.tower.best + ' 層。' : '止步於第 ' + currentStage.floor + ' 層，強化後再來挑戰。';
      document.getElementById('result-next').textContent = '⬆ 挑戰第 ' + (currentStage.floor + 1) + ' 層';
      document.getElementById('result-next').hidden = !win;
    } else {
      document.getElementById('result-next').textContent = '下一關';
      document.getElementById('result-next').hidden = !win || currentStage.order >= 110;
    }
    setView('result');
    if (win) {
      var endingScene = storyContent.sceneFor(currentStage.id, 'after');
      if (endingScene) setTimeout(function () { showStory(endingScene, currentStage.id + ':after'); }, 420);
    }
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
    renderHangarHome();
  }
  function renderCampaignMeta() {
    var map = mapData(); dom.mapEyebrow.textContent = map.icon + ' ' + map.name + '｜10 × 21 戰場'; dom.stageTitle.textContent = map.name + '：' + currentStage.name; dom.stageDescription.textContent = map.description;
    dom.stageBadge.textContent = currentStage.difficulty; dom.stageObjective.textContent = '目標：' + currentStage.objective;
    dom.stageProgress.textContent = currentStage.tower ? '無限塔・歷史最高 ' + progress.tower.best + ' 層' : '第 ' + currentStage.chapter + ' 章／10・' + (currentStage.hard ? 'HARD 特別關' : currentStage.boss ? '魔王關' : '第 ' + currentStage.index + ' 關');
    dom.battleStageLabel.textContent = map.icon + ' ' + map.name + '：' + currentStage.name + '｜' + currentStage.difficulty;
  }

  /* 關卡地圖：章節分頁 + 節點路徑（參考手遊 SRPG 的關卡選擇畫面）。 */
  var campaignChapter = null, campaignView = 'overview';
  function openCampaign() { campaignChapter = currentStage.mapId; campaignView = 'overview'; renderCampaign(); dom.campaignModal.hidden = false; audio.play('ui'); }
  function chapterInfo(map) {
    var boss = profile(map.boss), modal = document.getElementById('chapter-info-modal');
    document.getElementById('chapter-info-art').style.backgroundImage = boss ? "url('" + portrait({ p: boss, evolution: 1 }) + "')" : '';
    document.getElementById('chapter-info-kicker').textContent = map.icon + ' 章節情報';
    document.getElementById('chapter-info-title').textContent = map.name + '｜Boss：' + (boss ? boss.name : '未知');
    document.getElementById('chapter-info-copy').textContent = map.description + ' 本章將在 10 個主線節點後迎戰首領；通關後解鎖 4 個 HARD 特別關。';
    modal.hidden = false; audio.play('ui');
  }
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
    if (campaignView === 'overview') {
      dom.campaignGrid.innerHTML = '<div class="campaign-overview">' + content.maps.map(function (map, index) {
      var main = content.stages.filter(function (stage) { return stage.mapId === map.id && !stage.hard; });
      var clearedCount = main.filter(function (stage) { return progress.cleared[stage.id]; }).length;
      var unlocked = progression.isStageUnlocked(main[0].id);
      var boss = profile(map.boss), art = boss ? portrait({ p: boss, evolution: 1 }) : '';
      return '<article class="chapter-overview-card' + (unlocked ? '' : ' locked') + '" style="--chapter-art:url(\'' + art + '\')"><div><small>第 ' + (index + 1) + ' 章｜' + clearedCount + '/11</small><h3>' + map.icon + ' ' + map.name + '</h3><p>' + map.description + '</p><b>Boss：' + (boss ? boss.name : '未知') + '</b></div><footer><button data-chapter-info="' + map.id + '">情報</button><button class="primary" data-chapter-open="' + map.id + '" ' + (unlocked ? '' : 'disabled') + '>進入章節</button></footer></article>';
      }).join('') + '</div>';
      dom.campaignGrid.querySelectorAll('[data-chapter-open]').forEach(function (button) { button.onclick = function () { campaignChapter = button.dataset.chapterOpen; campaignView = 'chapter'; renderCampaign(); }; });
      dom.campaignGrid.querySelectorAll('[data-chapter-info]').forEach(function (button) { button.onclick = function () { chapterInfo(content.mapById(button.dataset.chapterInfo)); }; });
      return;
    }
    var mainStages = content.stages.filter(function (stage) { return stage.mapId === chapter.id && !stage.hard; });
    var hardStages = content.stages.filter(function (stage) { return stage.mapId === chapter.id && stage.hard; });
    var mainNodes = mainStages.map(stageNode).join('<i class="node-link"></i>');
    var hardNodes = hardStages.map(stageNode).join('<i class="node-link hard-link"></i>');
    var bossCleared = Boolean(progress.cleared[chapter.id + '-boss']);
    var boss = profile(chapter.boss), bossArt = boss ? portrait({ p: boss, evolution: 1 }) : '';
    dom.campaignGrid.innerHTML = '<div class="chapter-detail-head"><button id="campaign-back" class="secondary">← 全部章節</button><div class="chapter-detail-boss" style="background-image:url(\'' + bossArt + '\')"></div><div><p class="eyebrow">第 ' + (content.maps.indexOf(chapter) + 1) + ' 章</p><h3>' + chapter.icon + ' ' + chapter.name + '</h3><p>' + chapter.description + '</p><button id="campaign-boss-info">👑 Boss 與故事情報</button></div></div>' +
      '<div class="stage-path map-path-' + chapter.theme + '">' + mainNodes + '</div>' +
      '<p class="hard-title">🔥 HARD 特別關' + (bossCleared ? '（已解鎖）' : '（擊敗本章魔王後解鎖）') + '</p>' +
      '<div class="stage-path hard-path">' + hardNodes + '</div>';
    document.getElementById('campaign-back').onclick = function () { campaignView = 'overview'; renderCampaign(); };
    document.getElementById('campaign-boss-info').onclick = function () { chapterInfo(chapter); };
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

  function renderBattleCommand() {
    if (!dom.battleCommand) return;
    var unit = selected();
    var visible = Boolean(!currentStage.tower && unit && unit.team === 'ally' && unit.hp > 0 && state.phase === 'player' && !state.over && !autoTimer && state.commandOpen);
    dom.battleCommand.hidden = !visible;
    if (!visible) return;
    dom.battleCommandPortrait.style.backgroundImage = "url('" + portrait(unit) + "')";
    dom.battleCommandName.textContent = unit.p.name;
    dom.battleCommandStatus.textContent = 'HP ' + unit.hp + ' / ' + unit.maxHp + '｜移動 ' + moveRange(unit) + '｜' + (unit.moved ? '已移動' : '可移動') + '｜' + (unit.acted ? '已行動' : '可使用技能');
    dom.battleCommandSkills.innerHTML = '';
    unit.p.skills.forEach(function (skill, index) {
      var cooldown = unit.cooldowns[index] || 0, button = document.createElement('button');
      button.type = 'button'; button.className = 'battle-command-skill ' + (cooldown ? 'cooling' : 'ready') + (state.mode === 'skill' && state.skill === index ? ' active' : '');
      button.disabled = unit.acted || cooldown > 0 || state.animating;
      var targetType = skill.attackStyle === 'support' ? '我方支援' : skill.attackStyle === 'area' ? '範圍攻擊' : skill.attackStyle === 'melee' ? '近戰攻擊' : '遠距攻擊';
      button.innerHTML = '<b>' + skill.name + '</b><small>' + targetType + '｜射程 ' + skillRange(unit, skill) + (cooldown ? '｜冷卻 ' + cooldown : skill.kind === 'basic' ? '｜無冷卻' : '｜冷卻 ' + skill.cooldown) + '</small>';
      button.onclick = function () { state.mode = 'skill'; state.skill = index; state.commandOpen = false; clearForecast(); audio.play('ui'); note('已選擇「' + skill.name + '」，請點選可作用的目標。'); render(); };
      dom.battleCommandSkills.appendChild(button);
    });
    dom.battleCommandActions.innerHTML = '';
    var move = document.createElement('button'); move.type = 'button'; move.className = 'secondary'; move.textContent = unit.moved ? '✓ 已移動' : '移動'; move.disabled = unit.moved || state.animating;
    move.onclick = function () { state.mode = 'move'; state.commandOpen = false; clearForecast(); audio.play('ui'); note('請點選藍色可移動格；減速格會消耗 2 點行動力。'); render(); };
    var wait = document.createElement('button'); wait.type = 'button'; wait.className = 'secondary'; wait.textContent = '待機'; wait.disabled = unit.acted || state.animating;
    wait.onclick = function () { unit.moved = true; unit.acted = true; state.commandOpen = false; clearForecast(); audio.play('ui'); note(unitName(unit) + ' 完成本回合。'); render(); maybeAutoEndAfterMoves(); };
    var info = document.createElement('button'); info.type = 'button'; info.className = 'secondary'; info.textContent = '查看資訊'; info.onclick = function () { state.inspected = unit.key; state.commandOpen = false; render(); };
    dom.battleCommandActions.append(move, wait, info);
  }
  var pendingGrowthAction = null;
  function growthMaterialsHtml(items) {
    return items.map(function (item) {
      var enough = item.owned >= item.cost, remaining = item.owned - item.cost;
      return '<span class="growth-material ' + (enough ? 'enough' : 'short') + '"><i>' + item.icon + '</i><b>' + item.label + '</b><small>持有 ' + item.owned + '｜需求 ' + item.cost + '｜使用後 ' + (remaining >= 0 ? remaining : '缺 ' + Math.abs(remaining)) + '</small></span>';
    }).join('');
  }
  function openGrowthConfirmation(config) {
    pendingGrowthAction = config.ready ? config.onConfirm : null;
    dom.growthConfirmTitle.textContent = config.title;
    dom.growthConfirmCopy.textContent = config.copy;
    dom.growthConfirmMaterials.innerHTML = growthMaterialsHtml(config.materials);
    dom.growthConfirmEffect.innerHTML = '<b>執行後效果</b><span>' + config.effect + '</span>';
    dom.growthConfirmAccept.disabled = !config.ready;
    dom.growthConfirmAccept.textContent = config.ready ? '確認使用材料' : '材料不足，無法執行';
    dom.growthConfirmModal.hidden = false; audio.play('ui');
  }
  function closeGrowthConfirmation() { dom.growthConfirmModal.hidden = true; pendingGrowthAction = null; }
  function renderGrowth() {
    var pet = window.TACTICAL_PET_DATA.find(function (entry) { return entry.id === growthPetId; }), fusion = progress.fusion[pet.id] || 0, stage = portraitStage(pet.id), points = progress.skillPoints[pet.id] || 0, essence = progress.essences[pet.element] || 0, nextStage = stage + 1, evolutionCost = progression.evolutionCost(nextStage);
    var star = progression.starOf(pet.id), starCost = progression.starCost(pet.id), copies = progress.copies[pet.id] || 0;
    var elementLabel = { fire: '火', forest: '森', ocean: '海', light: '光', dark: '暗' }[pet.element] || pet.element;
    var starMaterials = starCost ? [{ icon: '🧩', label: pet.name + '複製體', owned: copies, cost: starCost.copies }, { icon: '🪙', label: '金幣', owned: progress.gold, cost: starCost.gold }] : [];
    var coreCost = 2 + fusion, fusionEssenceCost = 6 + fusion * 3;
    var fuseMaterials = [{ icon: '🧬', label: '融合核心', owned: progress.fusionCores, cost: coreCost }, { icon: '🔷', label: elementLabel + '元素精華', owned: essence, cost: fusionEssenceCost }];
    var evolveMaterials = nextStage <= 3 ? [{ icon: '🏅', label: '戰術徽章', owned: progress.medals, cost: evolutionCost.medals }, { icon: '🔷', label: elementLabel + '元素精華', owned: essence, cost: evolutionCost.essence }] : [];
    var starReady = Boolean(starCost && starMaterials.every(function (item) { return item.owned >= item.cost; }));
    var fuseReady = fusion < 3 && fuseMaterials.every(function (item) { return item.owned >= item.cost; });
    var evolveReady = nextStage <= 3 && evolveMaterials.every(function (item) { return item.owned >= item.cost; }) && fusion >= (evolutionCost.fusion || 0);
    var starCard = '<article class="growth-action-card"><div class="growth-action-materials">' + (starCost ? growthMaterialsHtml(starMaterials) : '<span class="growth-max">已達星級上限</span>') + '</div><h4>⭐ ' + (starCost ? '升 ' + starCost.nextStar + ' 星' : '9 星完成') + '</h4><p>消耗召喚重複取得的同名幻獸複製體與金幣。每升一星，力量、魔力、防衛、速度與血量等戰鬥能力永久增加 10%，最高 9 星。</p><small>本次效果：' + (starCost ? star + ' 星 → ' + starCost.nextStar + ' 星；累積全能力加成 +' + starCost.nextStar * 10 + '%' : '已獲得最高 +90% 星級加成') + '</small><button id="growth-star" ' + (!starCost ? 'disabled' : '') + '>' + (starCost ? '查看材料並確認升星' : '已達 9 星上限') + '</button></article>';
    var fuseCard = '<article class="growth-action-card"><div class="growth-action-materials">' + (fusion < 3 ? growthMaterialsHtml(fuseMaterials) : '<span class="growth-max">已達融合上限</span>') + '</div><h4>🧬 融合升階</h4><p>消耗融合核心與本幻獸的同系元素精華。每階讓全能力永久增加 4%，並立即取得 1 點技能點，可用於技能樹；最高融合 3 階。</p><small>本次效果：' + (fusion < 3 ? '融合 ' + fusion + ' → ' + (fusion + 1) + '；全能力 +4%；技能點 ' + points + ' → ' + (points + 1) : '已取得最高融合加成') + '</small><button id="growth-fuse" ' + (fusion >= 3 ? 'disabled' : '') + '>' + (fusion < 3 ? '查看材料並確認融合' : '融合已達 3 階') + '</button></article>';
    var evolveLabel = nextStage <= 3 ? pet.evolution[nextStage - 1].label : '最終型';
    var evolveCard = '<article class="growth-action-card"><div class="growth-action-materials">' + (nextStage <= 3 ? growthMaterialsHtml(evolveMaterials) + (evolutionCost.fusion ? '<span class="growth-prerequisite ' + (fusion >= evolutionCost.fusion ? 'enough' : 'short') + '">前置：融合 ' + fusion + ' / ' + evolutionCost.fusion + '</span>' : '') : '<span class="growth-max">已達最終進化</span>') + '</div><h4>✨ ' + (nextStage <= 3 ? '解鎖' + evolveLabel : '最終型完成') + '</h4><p>永久解鎖下一階幻獸立繪與戰鬥型態。每次進化讓戰鬥全能力倍率增加 12%；最終型需要先完成至少 1 次融合。</p><small>本次效果：' + (nextStage <= 3 ? pet.evolution[stage - 1].label + ' → ' + evolveLabel + '；進化能力加成 +' + (nextStage - 1) * 12 + '%' : '已解鎖三階立繪與最高 +24% 進化加成') + '</small><button id="growth-evolve" ' + (nextStage > 3 ? 'disabled' : '') + '>' + (nextStage <= 3 ? '查看材料並確認進化' : '已達最終進化') + '</button></article>';
    dom.growthContent.innerHTML = '<div class="growth-overview"><div class="growth-portrait" style="background-image:url(\'' + pet.evolution[stage - 1].portrait + '\')"></div><div><h3>' + pet.name + '｜' + pet.roleLabel + '　<span class="star-row">' + (star ? '★'.repeat(star) : '☆ 0 星') + '</span></h3><div class="growth-meta"><span>星級 ' + star + '/9</span><span>進化 ' + stage + '/3</span><span>融合 ' + fusion + '/3</span><span>技能點 ' + points + '</span></div></div></div><div class="growth-resource-ledger"><b>目前持有材料</b><span>🧩 ' + pet.name + '複製體 ' + copies + '</span><span>🪙 金幣 ' + progress.gold + '</span><span>🏅 戰術徽章 ' + progress.medals + '</span><span>🧬 融合核心 ' + progress.fusionCores + '</span><span>🔷 ' + elementLabel + '元素精華 ' + essence + '</span></div><div class="growth-actions">' + starCard + fuseCard + evolveCard + '</div><h3>技能樹</h3><div id="skill-tree" class="skill-tree"></div>';
    document.getElementById('growth-star').onclick = function () {
      openGrowthConfirmation({ title: '⭐ 確認升至 ' + (starCost ? starCost.nextStar : star) + ' 星', copy: '升星會永久消耗同名複製體與金幣，完成後無法降星或返還材料。', materials: starMaterials, ready: starReady, effect: '全能力永久增加 10%；累積星級加成變為 +' + (starCost ? starCost.nextStar * 10 : star * 10) + '%。', onConfirm: function () { var result = progression.starUp(pet.id); if (!result.ok) return growthMessage(result.reason); audio.play('unlock'); renderProgress(); renderGrowth(); growthMessage('升星成功！目前 ' + result.star + ' 星，全能力 +' + result.star * 10 + '%。'); } });
    };
    document.getElementById('growth-fuse').onclick = function () {
      openGrowthConfirmation({ title: '🧬 確認融合升階', copy: '融合會永久消耗融合核心與同系元素精華，最高可提升至融合 3 階。', materials: fuseMaterials, ready: fuseReady, effect: '融合 ' + fusion + ' → ' + Math.min(3, fusion + 1) + '；全能力永久 +4%，並取得 1 技能點。', onConfirm: function () { var result = progression.fuse(pet); if (!result.ok) return growthMessage(result.reason); audio.play('unlock'); renderProgress(); renderGrowth(); growthMessage('融合成功，全能力提升並獲得 1 技能點。'); } });
    };
    document.getElementById('growth-evolve').onclick = function () {
      openGrowthConfirmation({ title: '✨ 確認解鎖' + evolveLabel, copy: '進化會永久消耗戰術徽章與同系元素精華，並切換為下一階幻獸立繪與戰鬥型態。', materials: evolveMaterials, ready: evolveReady, effect: (nextStage <= 3 ? pet.evolution[stage - 1].label + ' → ' + evolveLabel + '；進化全能力加成提升為 +' + (nextStage - 1) * 12 + '%。' : '已達最終型。'), onConfirm: function () { var result = progression.unlockEvolution(pet, nextStage); if (!result.ok) return growthMessage(result.reason); audio.play('unlock'); renderProgress(); renderGrowth(); growthMessage('進化階段已永久解鎖。'); } });
    };
    var tree = document.getElementById('skill-tree'), unlocked = progress.skillTree[pet.id] || [];
    progression.treeFor(pet).forEach(function (node) { var button = document.createElement('button'), active = unlocked.indexOf(node.id) >= 0; button.className = 'tree-node ' + (active ? 'unlocked' : node.requires && unlocked.indexOf(node.requires) < 0 ? 'locked' : ''); button.disabled = active; button.innerHTML = '<b>' + (active ? '✓ ' : '') + node.name + '</b><small>' + node.description + '<br>需要 ' + node.cost + ' 技能點</small>'; button.onclick = function () { var result = progression.unlockSkill(pet, node.id); if (!result.ok) return growthMessage(result.reason); audio.play('unlock'); renderGrowth(); growthMessage('技能節點已啟用。'); }; tree.appendChild(button); });
    renderQuests();
  }
  function growthMessage(message) { note(message); dom.growthFeedback.textContent = message; }
  function renderQuests() {
    dom.questList.innerHTML = '';
    content.quests.forEach(function (quest) { var value = progression.questProgress(quest), claimed = Boolean(progress.questClaims[quest.id]), ready = value >= quest.target, rewardText = (quest.reward.medals ? quest.reward.medals + '🏅 ' : '') + (quest.reward.fusionCore ? quest.reward.fusionCore + '🧬 ' : '') + (quest.reward.skillPoints ? quest.reward.skillPoints + '技能點' : ''), card = document.createElement('article'); card.className = 'quest-card'; card.innerHTML = '<div><b>' + quest.name + '</b><small>' + quest.description + '｜' + Math.min(value, quest.target) + '/' + quest.target + '｜獎勵 ' + rewardText + '</small><div class="quest-progress"><i style="width:' + Math.min(100, value / quest.target * 100) + '%"></i></div></div><button ' + (!ready || claimed ? 'disabled' : '') + '>' + (claimed ? '已領取' : ready ? '領取' : '進行中') + '</button>'; card.querySelector('button').onclick = function () { var result = progression.claimQuest(quest.id); if (!result.ok) return growthMessage(result.reason); audio.play('unlock'); renderProgress(); renderGrowth(); growthMessage('任務獎勵已領取。'); }; dom.questList.appendChild(card); });
  }

  function renderDeployPresetStatus() {
    var box = document.getElementById('formation-preset-box'); if (!box) return;
    var saved = progression.formationFor(deploySelection.length ? deploySelection : partyIds);
    box.querySelector('span').textContent = saved.length ? '已儲存 ' + saved.length + ' 隻的站位，進場自動套用。' : '目前隊伍尚未儲存部署站位。';
    box.querySelector('button').disabled = !saved.length;
  }
  function ensureDeployPresetBox() {
    var box = document.getElementById('formation-preset-box'); if (box) return box;
    box = document.createElement('div'); box.id = 'formation-preset-box'; box.className = 'formation-preset-box';
    box.innerHTML = '<div><b>部署預設</b><span></span></div><button type="button" class="secondary">清除預設</button>';
    box.querySelector('button').onclick = function () { progression.clearFormation(); audio.play('ui'); renderDeployPresetStatus(); };
    dom.deployHelp.parentElement.insertBefore(box, dom.deployHelp);
    return box;
  }
  function openDeploy() {
    if (!state.over && state.phase !== 'deploy' && state.round > 1) { note('進行中的戰鬥不可更換隊伍，請先完成或重新開始。'); return; }
    deploySelection = partyIds.slice(); ensureDeployPresetBox(); renderDeploy(); renderDeployPresetStatus();
    dom.deployModal.hidden = false; dom.deployModal.scrollTop = 0;
    requestAnimationFrame(function () { var close = document.getElementById('close-deploy'); if (close) close.focus({ preventScroll: true }); });
  }
  function renderDeploy() {
    var allOwned = progression.ownedPets(), used = selectedDeploymentCost();
    var roster = allOwned.filter(function (pet) {
      var search = deployFilters.search.toLowerCase();
      return (!search || pet.name.toLowerCase().indexOf(search) >= 0) && (!deployFilters.element || pet.element === deployFilters.element) && (!deployFilters.role || pet.role === deployFilters.role) && (!deployFilters.size || String(pet.size) === deployFilters.size);
    }).sort(function (a, b) { return (deploySelection.indexOf(b.id) >= 0) - (deploySelection.indexOf(a.id) >= 0) || deploymentCost(a) - deploymentCost(b) || a.name.localeCompare(b.name, 'zh-Hant'); });
    dom.deployBudgetLabel.textContent = '出陣單位 ' + used + ' / ' + DEPLOY_CAPACITY;
    dom.deployBudgetFill.style.width = Math.min(100, used / DEPLOY_CAPACITY * 100) + '%';
    dom.deployBudgetFill.classList.toggle('near-limit', used >= 22);
    dom.deployHelp.innerHTML = '<b>出陣單位 ' + used + ' / ' + DEPLOY_CAPACITY + '</b>｜已選 ' + deploySelection.length + ' 隻｜定位：' + partyRoleSummary(deploySelection) + '｜顯示 ' + roster.length + '/' + allOwned.length + ' 隻。'; dom.deployGrid.innerHTML = '';
    roster.forEach(function (pet) {
      var button = document.createElement('button'), active = deploySelection.indexOf(pet.id) >= 0, cost = deploymentCost(pet), nextCost = used + cost;
      button.className = 'deploy-card' + (active ? ' selected' : '') + (!active && nextCost > DEPLOY_CAPACITY ? ' over-capacity' : '');
      button.innerHTML = '<span class="deploy-cost">' + cost + '</span><span class="deploy-art" style="background-image:url(\'' + pet.evolution[portraitStage(pet.id) - 1].portrait + '\')"></span><b>' + pet.name + (pet.size > 1 ? ' ⬛' : '') + '</b><small>' + (ELEMENT_ICONS[pet.element] || '') + ' ' + pet.roleLabel + '｜★' + progression.starOf(pet.id) + '<br>' + pet.size + '×' + pet.size + '・佔 ' + cost + ' 單位</small>';
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
      button.onclick = function () {
        var index = deploySelection.indexOf(pet.id);
        if (index >= 0) deploySelection.splice(index, 1);
        else if (selectedDeploymentCost() + cost <= DEPLOY_CAPACITY) deploySelection.push(pet.id);
        else { dom.deployHelp.innerHTML = '<b>出陣單位不足：</b>目前 ' + selectedDeploymentCost() + '/' + DEPLOY_CAPACITY + '，' + pet.name + ' 需要 ' + cost + ' 單位。'; return; }
        renderDeploy();
      };
      dom.deployGrid.appendChild(button);
    });
    if (!roster.length) dom.deployGrid.innerHTML = '<p class="empty-filter">找不到符合條件的幻獸。</p>';
    renderDeployPresetStatus();
  }
  function partyRoleSummary(ids) {
    var counts = {};
    ids.forEach(function (id) { var pet = profile(id); if (pet) counts[pet.roleLabel] = (counts[pet.roleLabel] || 0) + 1; });
    return Object.keys(counts).map(function (label) { return label + counts[label]; }).join('、') || '尚未選擇';
  }
  function recommendParty() {
    var candidates = progression.ownedPets().slice().sort(function (a, b) {
      var priority = { defender: 0, healer: 1, attacker: 2, controller: 3, support: 4, allrounder: 5 };
      var rankA = Object.prototype.hasOwnProperty.call(priority, a.role) ? priority[a.role] : 5;
      var rankB = Object.prototype.hasOwnProperty.call(priority, b.role) ? priority[b.role] : 5;
      return rankA - rankB || (progression.starOf(b.id) - progression.starOf(a.id)) || deploymentCost(a) - deploymentCost(b);
    });
    var picked = [], used = 0;
    ['defender','healer','attacker','controller','support'].forEach(function (role) { var pet = candidates.find(function (entry) { return entry.role === role && used + deploymentCost(entry) <= DEPLOY_CAPACITY; }); if (pet && picked.indexOf(pet.id) < 0) { picked.push(pet.id); used += deploymentCost(pet); } });
    candidates.forEach(function (pet) { var cost = deploymentCost(pet); if (picked.indexOf(pet.id) < 0 && used + cost <= DEPLOY_CAPACITY) { picked.push(pet.id); used += cost; } });
    deploySelection = picked; audio.play('ui'); renderDeploy();
  }

  /* ── 圖鑑：收集進度與全帳號加成 ── */
  function openDex() { if (!dexSelectedId) { var first = progression.ownedPets()[0]; dexSelectedId = first ? first.id : window.TACTICAL_PET_DATA[0].id; } renderDex(); document.getElementById('dex-modal').hidden = false; audio.play('ui'); }
  function renderDex() {
    var dex = progression.dexSummary();
    document.getElementById('dex-summary').innerHTML =
      '<span><b>' + dex.total + '/' + dex.max + '</b> 已收集</span>' +
      '<span>🔥 ' + dex.byElement.fire + '　🌿 ' + dex.byElement.forest + '　🌊 ' + dex.byElement.ocean + '　✨ ' + dex.byElement.light + '　🌑 ' + dex.byElement.dark + '</span>' +
      '<span class="dex-bonus">收集加成：全能力 +' + Math.round(dex.allBonus * 100) + '%' +
      (dex.elementBonus.fire ? '｜火系攻擊 +3%' : '') + (dex.elementBonus.forest ? '｜森系攻擊 +3%' : '') + (dex.elementBonus.ocean ? '｜海系攻擊 +3%' : '') + (dex.elementBonus.light ? '｜光系攻擊 +3%' : '') + (dex.elementBonus.dark ? '｜暗系攻擊 +3%' : '') +
      '｜每收集 10 隻全能力 +1%，單一元素滿 10 隻該系攻擊 +3%</span>';
    var grid = document.getElementById('dex-grid'); grid.innerHTML = '';
    var filtered = window.TACTICAL_PET_DATA.filter(function (pet) { var owned = progression.owns(pet.id), search = dexFilters.search.toLowerCase(), skillText = pet.skills.map(function (skill) { return skill.name; }).join(' '); return (!search || pet.name.toLowerCase().indexOf(search) >= 0 || skillText.toLowerCase().indexOf(search) >= 0) && (!dexFilters.element || pet.element === dexFilters.element) && (!dexFilters.role || pet.role === dexFilters.role) && (!dexFilters.owned || (dexFilters.owned === 'owned') === owned); });
    filtered.forEach(function (pet) {
      var owned = progression.owns(pet.id), card = document.createElement('button'); card.type = 'button';
      card.className = 'dex-card' + (owned ? '' : ' unknown') + (dexSelectedId === pet.id ? ' selected' : '');
      card.innerHTML = '<span class="deploy-art" style="background-image:url(\'' + pet.evolution[0].portrait + '\')"></span><b>' + (owned ? pet.name : '？？？') + '</b><small>' + (owned ? (ELEMENT_ICONS[pet.element] || '') + ' ' + pet.roleLabel + '｜★' + progression.starOf(pet.id) + '<br>' + pet.size + '×' + pet.size + '・' + deploymentCost(pet) + ' 單位' : '未取得') + '</small>';
      card.onclick = function () { dexSelectedId = pet.id; audio.play('ui'); renderDex(); };
      grid.appendChild(card);
    });
    if (!filtered.length) grid.innerHTML = '<p class="empty-filter">沒有符合條件的圖鑑資料。</p>';
    renderDexDetail(window.TACTICAL_PET_DATA.find(function (pet) { return pet.id === dexSelectedId; }));
  }
  function renderDexDetail(pet) {
    var detail = document.getElementById('dex-detail'); if (!pet) { detail.innerHTML = '<p>選擇幻獸查看詳情。</p>'; return; }
    var owned = progression.owns(pet.id);
    if (!owned) { detail.innerHTML = '<div class="dex-detail-hero unknown"><span style="background-image:url(\'' + pet.evolution[0].portrait + '\')"></span><div><small>尚未發現</small><h3>？？？</h3><p>可透過召喚與關卡獎勵取得，取得後解鎖完整能力與技能資料。</p></div></div>'; return; }
    var stage = portraitStage(pet.id), stats = pet.stats;
    detail.innerHTML = '<div class="dex-detail-hero"><span style="background-image:url(\'' + pet.evolution[stage - 1].portrait + '\')"></span><div><small>' + (ELEMENT_ICONS[pet.element] || '') + ' ' + pet.roleLabel + '｜' + (pet.rarity || 'normal') + '</small><h3>' + pet.name + '</h3><p>★' + progression.starOf(pet.id) + '｜' + pet.evolution[stage - 1].label + '｜融合 ' + (progress.fusion[pet.id] || 0) + '｜複製體 ' + (progress.copies[pet.id] || 0) + '</p></div></div>' +
      '<div class="dex-tags"><span>體型 ' + pet.size + '×' + pet.size + '</span><span>出陣 ' + deploymentCost(pet) + ' 單位</span><span>移動 ' + pet.move + '</span><span>' + (pet.attackStyle === 'melee' ? '近戰' : pet.attackStyle === 'support' ? '支援' : '遠程') + '</span></div>' +
      '<div class="dex-stats"><span><b>' + stats.health + '</b>生命</span><span><b>' + stats.power + '</b>力量</span><span><b>' + stats.magic + '</b>魔力</span><span><b>' + stats.defense + '</b>防衛</span><span><b>' + stats.speed + '</b>速度</span></div>' +
      '<h4>技能資料</h4><div class="dex-skills">' + pet.skills.map(function (skill) { var effect = skill.attackStyle === 'support' ? '輔助' : skill.attackStyle === 'area' ? '範圍' : '射程 ' + skill.range; return '<article><b>' + skill.name + '</b><small>' + effect + '｜冷卻 ' + skill.cooldown + (skill.status ? '｜異常 ' + skill.status : '') + (skill.push ? '｜擊退 ' + skill.push : '') + (skill.pull ? '｜拉近 ' + skill.pull : '') + '</small></article>'; }).join('') + '</div>' +
      (pet.passives.length ? '<h4>被動能力</h4><div class="dex-passives">' + pet.passives.map(function (passive) { return '<article><b>' + passive.name + '</b><p>' + passiveDescription(passive) + '</p></article>'; }).join('') + '</div>' : '');
  }

  /* ── 召喚 ── */
  var gachaCeremony = { results: [], index: 0, timer: null };
  var GACHA_QUALITY_LABELS = { normal: '普通', rare: '稀有', elite: '菁英', epic: '史詩', legendary: '傳說', mythical: '神話' };
  var GACHA_QUOTES = {
    normal: '請下令。', rare: '我願成為您的利刃。', elite: '讓我們一同突破命運。',
    epic: '這份力量將為您而戰。', legendary: '傳說的誓約已在此刻締結。', mythical: '命運終於讓我們相遇。'
  };
  function openGacha() { finishGachaCeremony(); renderGacha(); document.getElementById('gacha-results').innerHTML = ''; document.getElementById('gacha-modal').hidden = false; audio.play('ui'); }
  function openBossRaid() {
    var info = bossRaidInfo(), raid = info.raid, boss = info.boss, hp = raid.hp && raid.maxHp ? Math.max(0, Math.round(raid.hp / raid.maxHp * 100)) : 100;
    var tiers = BOSS_RAID_TIERS.map(function (label, tier) {
      var status = raid.cleared || tier < info.tier ? 'cleared' : tier === info.tier ? 'active' : 'locked';
      var reward = '💎' + (12 + tier * 8) + '　🪙' + (140 + tier * 100) + '　🏅' + (4 + tier * 4) + '　🧬' + (1 + Math.floor(tier / 2));
      return '<article class="boss-tier ' + status + '"><b>' + (status === 'cleared' ? '✓ ' : status === 'locked' ? '🔒 ' : '⚔ ') + label + '</b><small>' + (status === 'cleared' ? '已討伐' : status === 'locked' ? '完成前一難度解鎖' : '目前挑戰・HP ' + hp + '%') + '</small><em>' + reward + '</em></article>';
    }).join('');
    document.getElementById('boss-raid-content').innerHTML = '<article class="boss-raid-card"><span class="boss-raid-art" style="background-image:url(\'' + displayPortrait(boss) + '\')"></span><div><p class="eyebrow">每日輪替・' + (window.ELEMENT_CONFIG[boss.element] || {}).label + '屬性</p><h3>' + boss.name + '</h3><p>' + (raid.cleared ? '今日五段難度已全數討伐。明日 00:00 將輪替新的 Boss。' : '大型 4×4 單位｜目前挑戰：' + BOSS_RAID_TIERS[info.tier]) + '</p><div class="boss-raid-track"><i style="width:' + hp + '%"></i></div></div></article><section class="boss-tier-grid" aria-label="Boss 五段難度解鎖">' + tiers + '</section>';
    var enter = document.getElementById('boss-raid-enter'); enter.disabled = raid.cleared; enter.textContent = raid.cleared ? '今日討伐完成' : '👑 挑戰「' + BOSS_RAID_TIERS[info.tier] + '」・支付 ' + info.cost + ' 金幣';
    document.getElementById('boss-raid-modal').hidden = false; audio.play('ui');
  }
  function enterBossRaid() {
    var info = bossRaidInfo(), result = progression.startBossRaid(bossRaidIds(), info.cost);
    if (!result.ok) { document.getElementById('boss-raid-content').insertAdjacentHTML('afterbegin', '<p class="fc-warn">' + result.reason + '</p>'); audio.play('ui'); return; }
    document.getElementById('boss-raid-modal').hidden = true; currentStage = bossRaidStage(info); reset(currentStage); setView('battle'); audio.play('boss');
  }
  function renderGacha() {
    document.getElementById('gacha-info').innerHTML = '持有 <b>💎 ' + progress.crystals + '</b> 召喚水晶。首次通關與每日任務可獲得水晶。已收集 ' + progression.dexSummary().total + '/' + window.TACTICAL_PET_DATA.length + ' 隻。';
    var icons = { fire: '🔥 火', forest: '🌿 森', ocean: '🌊 海', light: '✨ 光', dark: '🌑 暗' };
    var featured = progression.featuredProgress(), featuredPet = featured.pet;
    document.getElementById('gacha-element-pulls').innerHTML = '<article class="gacha-featured"><span class="gacha-featured-art" style="background-image:url(\'' + featuredPet.evolution[0].portrait + '\')"></span><div><b>✦ 每日精選幻獸池</b><small>' + (window.ELEMENT_CONFIG[featuredPet.element] || {}).label + '・' + featuredPet.name + '｜保底進度 ' + featured.pulls + '/' + featured.target + '</small></div><div class="gacha-featured-actions"><button type="button" data-featured-pull="1">單抽 30 💎</button><button type="button" data-featured-pull="10">十連 270 💎</button></div></article>' + ['fire', 'forest', 'ocean', 'light', 'dark'].map(function (element) { return '<button type="button" data-element-pull="' + element + '">' + icons[element] + '屬性召喚 <small>50 💎</small></button>'; }).join('');
    document.querySelectorAll('[data-element-pull]').forEach(function (button) { button.onclick = function () { doPull(1, button.dataset.elementPull); }; });
    document.querySelectorAll('[data-featured-pull]').forEach(function (button) { button.onclick = function () { doPull(Number(button.dataset.featuredPull), null, true); }; });
  }
  function renderGachaResults(results) {
    var box = document.getElementById('gacha-results');
    box.innerHTML = results.map(function (entry, index) {
      var quality = entry.pet.rarity || entry.pet.quality || 'normal';
      return '<div class="gacha-card quality-' + quality + (entry.isNew ? ' fresh' : '') + (entry.featuredGuaranteed ? ' featured-guaranteed' : '') + '" style="animation-delay:' + index * 90 + 'ms">' +
        '<span class="deploy-art" style="background-image:url(\'' + entry.pet.evolution[0].portrait + '\')"></span>' +
        '<b>' + entry.pet.name + '</b><small>' + (entry.featuredGuaranteed ? '✦ 精選保底！' : entry.isNew ? '✨ NEW!' : '碎片 +1') + '</small></div>';
    }).join('');
  }
  function revealGachaCard() {
    var entry = gachaCeremony.results[gachaCeremony.index];
    if (!entry) { finishGachaCeremony(); return; }
    var quality = entry.pet.rarity || entry.pet.quality || 'normal';
    var quote = entry.pet.summonQuote || GACHA_QUOTES[quality];
    var card = document.getElementById('gacha-reveal-card');
    card.className = 'gacha-reveal-card quality-' + quality + (entry.isNew ? ' fresh' : '');
    card.innerHTML = '<span class="gacha-reveal-art" style="background-image:url(\'' + entry.pet.evolution[0].portrait + '\')"></span>' +
      '<div class="gacha-reveal-copy"><small>' + GACHA_QUALITY_LABELS[quality] + '幻獸' + (entry.isNew ? ' ・ 初次契約' : ' ・ 靈魂共鳴') + '</small>' +
      '<h2>' + entry.pet.name + '</h2><p>「' + quote + '」</p></div>';
    document.getElementById('gacha-reveal-progress').textContent = '第 ' + (gachaCeremony.index + 1) + '／' + gachaCeremony.results.length + ' 張';
    window.requestAnimationFrame(function () { card.classList.add('is-revealed'); });
    clearTimeout(gachaCeremony.timer);
    gachaCeremony.timer = setTimeout(function () {
      gachaCeremony.index += 1;
      revealGachaCard();
    }, 1600);
  }
  function startGachaCeremony(results) {
    clearTimeout(gachaCeremony.timer);
    gachaCeremony = { results: results, index: 0, timer: null };
    document.getElementById('gacha-results').innerHTML = '';
    document.getElementById('gacha-reveal').hidden = false;
    revealGachaCard();
  }
  function finishGachaCeremony() {
    clearTimeout(gachaCeremony.timer);
    if (gachaCeremony.results.length) renderGachaResults(gachaCeremony.results);
    gachaCeremony = { results: [], index: 0, timer: null };
    document.getElementById('gacha-reveal').hidden = true;
  }
  function doPull(count, element, featured) {
    var result = progression.pull(count, element, featured);
    if (!result.ok) { document.getElementById('gacha-info').innerHTML = '<b class="fc-warn">' + result.reason + '</b>'; audio.play('ui'); return; }
    audio.play('unlock'); renderProgress(); renderGacha(); renderParty(); renderTrait();
    startGachaCeremony(result.results);
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
    var weeklyList = document.getElementById('weekly-list'), weekly = progression.weeklyState();
    document.getElementById('weekly-reset-copy').textContent = '本週週期：' + weekly.key + '（週一 00:00 重置）。不同樓層各計一次，重複挑戰不會重複累積。';
    weeklyList.innerHTML = '';
    progression.weeklyQuests().forEach(function (quest) {
      var value = progression.weeklyProgress(quest), claimed = Boolean(weekly.claims[quest.id]), ready = value >= quest.target;
      var rewardText = (quest.reward.crystals ? quest.reward.crystals + '💎 ' : '') + (quest.reward.gold ? quest.reward.gold + '🪙 ' : '') + (quest.reward.medals ? quest.reward.medals + '🏅 ' : '') + (quest.reward.fusionCore ? quest.reward.fusionCore + '🧬 ' : '') + (quest.reward.essence ? '五系各 ' + quest.reward.essence + '🔷' : '');
      var card = document.createElement('article'); card.className = 'quest-card';
      card.innerHTML = '<div><b>🗼 ' + quest.name + '</b><small>' + quest.description + '｜' + Math.min(value, quest.target) + '/' + quest.target + '｜獎勵 ' + rewardText + '</small><div class="quest-progress"><i style="width:' + Math.min(100, value / quest.target * 100) + '%"></i></div></div><button ' + (!ready || claimed ? 'disabled' : '') + '>' + (claimed ? '已領取' : ready ? '領取豐富獎勵' : '進行中') + '</button>';
      card.querySelector('button').onclick = function () { var result = progression.claimWeekly(quest.id); if (!result.ok) { note(result.reason); return; } audio.play('unlock'); renderProgress(); renderDaily(); note('每週無限塔獎勵已領取。'); };
      weeklyList.appendChild(card);
    });
  }
  function confirmDeploy() {
    var used = selectedDeploymentCost();
    if (!deploySelection.length || used > DEPLOY_CAPACITY) { dom.deployHelp.textContent = '請選擇至少 1 隻幻獸，且出陣單位不得超過 ' + DEPLOY_CAPACITY + '（目前 ' + used + '）。'; return; }
    if (!progression.setParty(deploySelection)) { dom.deployHelp.textContent = '編隊資料無效，請確認幻獸擁有狀態與出陣單位。'; return; }
    partyIds = progress.party.slice(); dom.deployModal.hidden = true; reset(currentStage.id);
  }

  document.addEventListener('pointerdown', function unlockOnce() { audio.unlock(); document.removeEventListener('pointerdown', unlockOnce); }, { once: true });
  document.getElementById('restart').onclick = function () { reset(stageRef()); };
  dom.endTurn.onclick = endTurn; dom.auto.onclick = toggleAuto; dom.speed.onclick = cycleSpeed;
  if (dom.towerCommand) dom.towerCommand.onclick = towerCommand;
  document.getElementById('battle-command-close').onclick = function () { state.commandOpen = false; render(); };
  if (dom.terrainToggle) dom.terrainToggle.onclick = toggleTerrainVisibility;
  dom.sound.onclick = function () { var enabled = progression.toggleSound(); audio.setEnabled(enabled); renderProgress(); if (enabled) audio.play('ui'); };
  document.getElementById('open-campaign').onclick = openCampaign; document.getElementById('open-growth').onclick = openGrowth;
  document.getElementById('open-dex').onclick = openDex; document.getElementById('open-gacha').onclick = openGacha; document.getElementById('open-daily').onclick = openDaily;
  document.getElementById('open-home').onclick = openHome; document.getElementById('open-shop').onclick = openShop; document.getElementById('open-bag').onclick = openBag;
  document.getElementById('open-boss-raid').onclick = openBossRaid; document.getElementById('home-boss-open').onclick = openBossRaid; document.getElementById('boss-raid-enter').onclick = enterBossRaid;
  document.querySelectorAll('[data-hangar-action]').forEach(function (button) { button.onclick = function () { var target = document.getElementById(button.dataset.hangarAction); if (target) target.click(); }; });
  document.querySelectorAll('[data-hangar-soon]').forEach(function (button) { button.onclick = function () { audio.play('ui'); note('「' + button.dataset.hangarSoon + '」正在規劃探索地圖與事件，敬請期待。'); }; });
  document.getElementById('home-display-open').onclick = openHomeDisplay;
  document.getElementById('home-screenshot').onclick = function () { document.body.classList.toggle('home-capture'); this.textContent = document.body.classList.contains('home-capture') ? '× 結束截圖' : '▣ 截圖模式'; };
  document.getElementById('home-continue').onclick = function () { dom.enterBattle.click(); };
  [['crystals','open-gacha'], ['gold','open-shop'], ['medals','open-growth'], ['essences','open-growth'], ['fusion-cores','open-growth']].forEach(function (pair) { var chip = document.getElementById(pair[0]); if (chip) { chip.tabIndex = 0; chip.setAttribute('role', 'button'); chip.onclick = function () { document.getElementById(pair[1]).click(); }; chip.onkeydown = function (event) { if (event.key === 'Enter' || event.key === ' ') chip.click(); }; } });
  document.getElementById('home-collect').onclick = function () { var result = progression.collectHome(); if (!result.ok) { note(result.reason); return; } audio.play('unlock'); renderProgress(); renderHome(); note('收成完成：獲得 ' + result.total + ' 點元素精華。'); };
  document.getElementById('hub-party').onclick = openDeploy;
  document.getElementById('gacha-one').onclick = function () { doPull(1); };
  document.getElementById('gacha-ten').onclick = function () { doPull(10); };
  document.getElementById('gacha-skip').onclick = finishGachaCeremony;
  document.querySelectorAll('.hub-soon').forEach(function (button) {
    button.onclick = function () { audio.play('ui'); note('「' + button.dataset.soon + '」功能開發中，敬請期待！（規劃見 docs/遊戲企劃藍圖.md）'); };
  });
  document.getElementById('deploy').onclick = openDeploy; document.getElementById('close-deploy').onclick = function () { dom.deployModal.hidden = true; }; document.getElementById('cancel-deploy').onclick = function () { dom.deployModal.hidden = true; }; document.getElementById('confirm-deploy').onclick = confirmDeploy;
  /* Safari/iPad 在滿版橫向頁偶爾會把 tap 判成頁面手勢而不派發 click；隊伍編輯以 pointerup 作為同一條開啟路徑。 */
  ['deploy', 'hub-party'].forEach(function (id) { var button = document.getElementById(id); if (button) button.addEventListener('pointerup', function (event) { if (event.pointerType !== 'touch') return; event.preventDefault(); openDeploy(); }, { passive: false }); });
  document.getElementById('deploy-search').oninput = function () { deployFilters.search = this.value.trim(); renderDeploy(); };
  document.getElementById('deploy-element').onchange = function () { deployFilters.element = this.value; renderDeploy(); };
  document.getElementById('deploy-role').onchange = function () { deployFilters.role = this.value; renderDeploy(); };
  document.getElementById('deploy-size').onchange = function () { deployFilters.size = this.value; renderDeploy(); };
  document.getElementById('deploy-recommend').onclick = recommendParty;
  document.getElementById('deploy-clear').onclick = function () { deploySelection = []; audio.play('ui'); renderDeploy(); };
  ['search','element','role','owned'].forEach(function (key) { var control = document.getElementById('dex-' + key); control[key === 'search' ? 'oninput' : 'onchange'] = function () { dexFilters[key] = this.value.trim(); renderDex(); }; });
  document.getElementById('formation-balanced').onclick = function () { arrangeFormation('balanced'); };
  document.getElementById('formation-assault').onclick = function () { arrangeFormation('assault'); };
  (function () { var button = document.createElement('button'); button.id = 'formation-auto'; button.type = 'button'; button.textContent = '⚡ 自動部署'; button.onclick = autoArrangeBySpeed; document.querySelector('.deploy-toolbar-actions').insertBefore(button, document.getElementById('formation-balanced')); }());
  document.getElementById('formation-reset').onclick = restoreFormation;
  (function () { var button = document.createElement('button'); button.id = 'formation-save'; button.type = 'button'; button.textContent = '💾 儲存部署'; button.onclick = saveFormationPreset; document.querySelector('.deploy-toolbar-actions').insertBefore(button, document.getElementById('deploy-start')); }());
  document.getElementById('deploy-start').onclick = startBattle;
  document.querySelectorAll('[data-close]').forEach(function (button) { button.onclick = function () { document.getElementById(button.dataset.close).hidden = true; }; });
  document.getElementById('growth-confirm-close').onclick = closeGrowthConfirmation;
  document.getElementById('growth-confirm-cancel').onclick = closeGrowthConfirmation;
  dom.growthConfirmAccept.onclick = function () { var action = pendingGrowthAction; if (!action) return; closeGrowthConfirmation(); action(); };
  dom.growthPet.onchange = function () { growthPetId = dom.growthPet.value; renderGrowth(); };
  dom.enterBattle.onclick = function () { audio.unlock(); if (state.over || state.phase !== 'deploy') reset(currentStage.id); setView('battle'); audio.play('ui'); render(); focusDeployZone(true); };
  function stageRef() { return currentStage.tower ? towerStageFor(currentStage.floor) : currentStage.bossRaid ? null : currentStage.id; }
  function returnToHomeStage() { reset(progress.currentStage); setView('home'); renderHangarHome(); }
  dom.battleExit.onclick = function () { stopAuto(); returnToHomeStage(); homeReturnFeedback = '已撤退回機庫；調整隊伍後再出發。'; note('已撤退回遠征準備頁。'); };
  document.getElementById('result-home').onclick = function () { returnToHomeStage(); homeReturnFeedback = state.reward && state.reward.storyPet ? '救援完成：' + profile(state.reward.storyPet).name + ' 已加入圖鑑與編隊名單。' : (state.reward && state.reward.firstClear ? '首次通關回報已同步，新的章節節點已開啟。' : '戰鬥資料已回傳機庫，準備下一次出擊。'); };
  document.getElementById('result-retry').onclick = function () { if (currentStage.bossRaid) { returnToHomeStage(); openBossRaid(); return; } reset(stageRef()); setView('battle'); };
  document.getElementById('result-deploy').onclick = function () { returnToHomeStage(); openDeploy(); };
  document.getElementById('result-next').onclick = function () {
    if (currentStage.bossRaid) { if (state.reward && state.reward.firstClear === false && state.reward.crystals && !state.reward.cleared) { returnToHomeStage(); openBossRaid(); } else returnToHomeStage(); return; }
    if (currentStage.tower) { enterTower(currentStage.floor + 1); return; }
    currentStage = content.stageById(progress.currentStage); reset(currentStage.id); setView('battle');
  };
  var towerButton = document.getElementById('open-tower');
  if (towerButton) towerButton.onclick = function () { audio.unlock(); enterTower(progress.tower.best + 1); };
  document.addEventListener('keydown', function (event) { if (event.key === 'Escape') { closeGrowthConfirmation(); ['deploy-modal', 'campaign-modal', 'growth-modal', 'dex-modal', 'gacha-modal', 'daily-modal', 'home-modal', 'shop-modal', 'bag-modal', 'boss-raid-modal', 'home-display-modal', 'story-modal'].forEach(function (id) { var modal = document.getElementById(id); if (modal) modal.hidden = true; }); } });

  window.__TACTICS_DEBUG__ = {
    getState: function () { return { stage: currentStage.id, view: currentView, round: state.round, phase: state.phase, over: state.over, allies: alive('ally').length, enemies: alive('enemy').length, partyCost: state.partyCost, enemyScale: state.enemyScale, balanceLabel: state.balance.label, enemyReinforcements: state.balance.added, obstacles: state.obstacles.length, resources: JSON.parse(JSON.stringify(progress)) }; },
    setView: setView,
    enterTower: enterTower,
    reset: function (stageId) { if (stageId && progression.isStageUnlocked(stageId)) currentStage = content.stageById(stageId); reset(currentStage.id); },
    startBattle: startBattle,
    setSpeed: function (speed) { battleSpeed = Math.max(1, Math.min(8, Number(speed) || 1)); },
    startAuto: function () { if (!autoTimer) toggleAuto(); },
    stopAuto: stopAuto
  };

  enableCameraDrag();
  var boardZoom = 1.5, zoomButton = document.getElementById('board-zoom');
  if (zoomButton) zoomButton.onclick = function () {
    boardZoom = boardZoom === 1.5 ? 2 : 1.5;
    var viewport = dom.board.parentElement.parentElement;
    viewport.style.setProperty('--zoom', boardZoom);
    zoomButton.textContent = '🔍 ' + boardZoom + '×';
    audio.play('ui');
    var focus = selected() || alive('ally')[0];
    if (focus) focusUnit(focus, true);
  };
  syncTerrainVisibility();
  updateSlowTerrainCopy();
  reset(currentStage.id);
  if (/[?&]view=battle/.test(window.location.search)) { setView('battle'); focusDeployZone(true); }
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
