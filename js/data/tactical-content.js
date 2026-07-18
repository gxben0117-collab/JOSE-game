/* JOSE 戰棋內容資料：10 大章節 × 150 關、掉落、任務與技能樹。
   每章 10 小關 + 1 首領關（擊破首領開啟下一章）+ 4 個 HARD 特別關（通關本章首領後解鎖）。 */
(function (global) {
  'use strict';

  var chapters = [
    { id: 'c1', name: '幻獸初醒', icon: '🌱', element: 'forest', theme: 'verdant', boss: 'blightwood_sovereign', minions: ['rotcap_rootling', 'dryad_thorn', 'ent_sapling', 'venom_mantis'], description: '幻獸甦醒之地，森林魔物在苔光小徑間集結。' },
    { id: 'c2', name: '迷霧森林', icon: '🌫️', element: 'forest', theme: 'verdant', boss: 'thorn_hive_queen', minions: ['thorn_pollen_drone', 'mist_banshee', 'fog_wisp', 'gloom_turtle'], description: '瘴霧瀰漫的深林，迷霧妖龍潛伏其中。' },
    { id: 'c3', name: '赤炎火山', icon: '🌋', element: 'fire', theme: 'ember', boss: 'ash_crown_tyrant', minions: ['crown_cinderling', 'salamander_fiend', 'surtr_spawn', 'ember_imp'], description: '熔岩橫流的火山口，炎獄魔龍王的領地。' },
    { id: 'c4', name: '沉睡古城', icon: '🏛️', element: 'mixed', theme: 'rift', boss: 'cathedral_titan', minions: ['rosewindow_sentinel', 'gargoyle_watcher', 'golem_sentinel', 'ash_hound'], description: '被遺忘的古城遺跡，魔像在斷垣間甦醒。' },
    { id: 'c5', name: '冰封雪原', icon: '❄️', element: 'ocean', theme: 'tide', boss: 'glacier_leviathan', minions: ['glacier_shellcrab', 'jotunn_frost', 'selkie_hunter', 'murk_fish'], description: '極寒冰原，冰淵潮王凍結了一切。' },
    { id: 'c6', name: '雷鳴高原', icon: '⚡', element: 'mixed', theme: 'rift', boss: 'furnace_colossus', minions: ['slag_hound', 'thunderbird_kin', 'raiju_beast', 'void_eel'], description: '雷雲翻騰的高原，雷鳴暴龍呼喚萬雷。' },
    { id: 'c7', name: '失落海域', icon: '🌊', element: 'ocean', theme: 'tide', boss: 'abyssal_kraken_emperor', minions: ['pearl_lantern_fry', 'siren_lure', 'kraken_tentacle', 'tide_spawn'], description: '沉沒文明的海域，古神自深淵中凝視。' },
    { id: 'c8', name: '天空遺跡', icon: '☀️', element: 'light', theme: 'rift', boss: 'solar_seraph_chimera', minions: ['prism_wing_cub', 'cherub_guard', 'bennu_acolyte', 'flame_wisp'], description: '漂浮天際的聖光遺跡，神翼守護著光之精華。' },
    { id: 'c9', name: '魔界裂縫', icon: '🌑', element: 'dark', theme: 'rift', boss: 'eclipse_bone_wyrm', minions: ['crescent_rib_whelp', 'cerberus_whelp', 'mara_fiend', 'void_eel'], description: '暗之魔力湧出的裂縫，暗獄狼王率群狼盤據。' },
    { id: 'c10', name: '遠古幻獸之門', icon: '🐲', element: 'mixed', theme: 'rift', boss: 'void_devourer', minions: ['singularity_mite', 'chimera_spawn', 'leviathan_brood', 'mara_fiend'], description: '連接三界與光暗的遠古之門，最終試煉在此。' }
  ];

  var STAGE_NAMES = ['前哨戰', '外圍掃蕩', '斥候遭遇', '荒徑伏擊', '補給爭奪', '斷橋突破', '險地推進', '要塞攻堅', '親衛精銳', '決戰前夕'];
  var HARD_NAMES = ['魔物狂潮', '精銳試煉', '無盡包圍', '極限挑戰'];
  var BOSS_NAMES = { blightwood_sovereign: '腐菌樹王', thorn_hive_queen: '荊棘蜂后', ash_crown_tyrant: '燼冠暴君', cathedral_titan: '聖堂泰坦', glacier_leviathan: '冰川利維坦', furnace_colossus: '熔爐巨神', abyssal_kraken_emperor: '深淵克拉肯皇', solar_seraph_chimera: '日輝奇美拉', eclipse_bone_wyrm: '蝕月骨龍', void_devourer: '虛空吞噬者' };

  function round2(value) { return Math.round(value * 100) / 100; }

  var stages = [];
  chapters.forEach(function (chapter, chapterIndex) {
    var base = 0.42 + chapterIndex * 0.47;
    for (var index = 1; index <= 10; index++) {
      var elite = index >= 9;
      stages.push({
        id: chapter.id + '-' + index, mapId: chapter.id, chapter: chapterIndex + 1, index: index,
        order: chapterIndex * 11 + index,
        name: chapter.name + '・' + STAGE_NAMES[index - 1],
        difficulty: elite ? '精英' : '普通', elite: elite,
        power: round2(base * (1 + (index - 1) * 0.03)),
        enemies: chapter.minions, enemyCount: Math.min(28, 10 + chapterIndex + Math.floor(index / 3)),
        seed: chapterIndex * 53 + index * 17 + 7,
        objective: index % 3 === 0 ? '在 ' + (18 + chapterIndex + Math.ceil(index / 2)) + ' 回合內獲勝' : index % 3 === 1 ? '殲滅所有魔物小隊' : '至少保留半數幻獸',
        turnLimit: 18 + chapterIndex + Math.ceil(index / 2),
        rewards: { medals: 3 + chapterIndex + Math.floor(index / 4), essence: 2 + Math.floor((chapterIndex + index) / 4), fusionCore: index === 10 ? 1 : (elite && chapterIndex >= 2 ? 1 : 0) }
      });
    }
    stages.push({
      id: chapter.id + '-boss', mapId: chapter.id, chapter: chapterIndex + 1, index: 11,
      order: chapterIndex * 11 + 11, boss: true,
      name: chapter.name + '・魔王 ' + BOSS_NAMES[chapter.boss],
      difficulty: '首領', power: round2(base * 1.34),
      enemies: [chapter.boss].concat(chapter.minions), enemyCount: Math.min(30, 14 + chapterIndex),
      seed: chapterIndex * 53 + 199,
      objective: '擊敗 ' + BOSS_NAMES[chapter.boss] + '，開啟下一章',
      turnLimit: 24 + chapterIndex,
      rewards: { medals: 8 + chapterIndex * 2, essence: 6 + chapterIndex, fusionCore: 2 + (chapterIndex >= 5 ? 1 : 0) }
    });
    for (var hard = 1; hard <= 4; hard++) {
      stages.push({
        id: chapter.id + '-h' + hard, mapId: chapter.id, chapter: chapterIndex + 1, index: 11 + hard,
        order: 900 + chapterIndex * 10 + hard, hard: true, elite: true,
        name: chapter.name + '・HARD ' + HARD_NAMES[hard - 1],
        difficulty: 'HARD', power: round2(base * 1.34 * (1.04 + hard * 0.05)),
        enemies: chapter.minions, enemyCount: Math.min(30, 16 + chapterIndex + hard * 2),
        seed: chapterIndex * 53 + hard * 29 + 401,
        objective: 'HARD 試煉：殲滅高強度魔物大軍',
        turnLimit: 26 + chapterIndex,
        rewards: { medals: 10 + chapterIndex * 2 + hard, essence: 8 + chapterIndex, fusionCore: 1 + (hard === 4 ? 2 : 1) }
      });
    }
  });

  var skillTrees = {
    attacker: [
      { id: 'force', name: '猛攻訓練', description: '力量與魔力 +8%', cost: 1, bonus: { offense: 0.08 } },
      { id: 'hunter', name: '獵手步伐', description: '移動距離 +1', cost: 1, requires: 'force', bonus: { move: 1 } },
      { id: 'execute', name: '終結本能', description: '對半血以下目標傷害 +18%', cost: 2, requires: 'hunter', bonus: { execute: 0.18 } }
    ],
    defender: [
      { id: 'vitality', name: '厚實體魄', description: '最大生命 +12%', cost: 1, bonus: { health: 0.12 } },
      { id: 'bulwark', name: '堅壁姿態', description: '防衛 +12%', cost: 1, requires: 'vitality', bonus: { defense: 0.12 } },
      { id: 'retaliate', name: '反擊架勢', description: '反擊傷害 +25%', cost: 2, requires: 'bulwark', bonus: { counter: 0.25 } }
    ],
    support: [
      { id: 'focus', name: '靈能專注', description: '魔力與治療 +10%', cost: 1, bonus: { magic: 0.10, healing: 0.10 } },
      { id: 'reach', name: '共鳴延伸', description: '輔助技能射程 +1', cost: 1, requires: 'focus', bonus: { supportRange: 1 } },
      { id: 'renew', name: '生命迴響', description: '治療時額外恢復 8%', cost: 2, requires: 'reach', bonus: { healing: 0.08 } }
    ],
    healer: [
      { id: 'focus', name: '療癒專注', description: '魔力與治療 +10%', cost: 1, bonus: { magic: 0.10, healing: 0.10 } },
      { id: 'reach', name: '遠距祈願', description: '輔助技能射程 +1', cost: 1, requires: 'focus', bonus: { supportRange: 1 } },
      { id: 'renew', name: '復甦之光', description: '治療效果再 +12%', cost: 2, requires: 'reach', bonus: { healing: 0.12 } }
    ],
    controller: [
      { id: 'focus', name: '精準施法', description: '魔力 +10%', cost: 1, bonus: { magic: 0.10 } },
      { id: 'reach', name: '戰場掌控', description: '遠程技能射程 +1', cost: 1, requires: 'focus', bonus: { range: 1 } },
      { id: 'tempo', name: '節奏壓制', description: '技能冷卻首次少 1 回合', cost: 2, requires: 'reach', bonus: { cooldown: 1 } }
    ],
    allrounder: [
      { id: 'balance', name: '均衡鍛鍊', description: '全能力 +6%', cost: 1, bonus: { all: 0.06 } },
      { id: 'stride', name: '靈活步伐', description: '移動距離 +1', cost: 1, requires: 'balance', bonus: { move: 1 } },
      { id: 'mastery', name: '戰術大師', description: '傷害與治療 +12%', cost: 2, requires: 'stride', bonus: { offense: 0.12, healing: 0.12 } }
    ]
  };

  var quests = [
    { id: 'battle-3', name: '裂谷巡守', description: '完成 3 場戰鬥', stat: 'battles', target: 3, reward: { medals: 5 } },
    { id: 'win-2', name: '連戰告捷', description: '贏得 2 場戰鬥', stat: 'wins', target: 2, reward: { fusionCore: 1 } },
    { id: 'skill-8', name: '奧義研究', description: '施放 8 次非普攻技能', stat: 'skills', target: 8, reward: { skillPoints: 1 } },
    { id: 'control-6', name: '控場大師', description: '施放 6 次擊退、拉扯、冰凍或中毒技能', stat: 'controls', target: 6, reward: { medals: 6, skillPoints: 1 } },
    { id: 'boss-1', name: '首領獵人', description: '擊敗 1 隻章節首領', stat: 'bossKills', target: 1, reward: { fusionCore: 2 } },
    { id: 'stage-4', name: '遠征里程碑', description: '首次通過 4 個不同關卡', stat: 'cleared', target: 4, reward: { medals: 8, fusionCore: 1 } }
  ];

  function mapById(id) { return chapters.find(function (chapter) { return chapter.id === id; }); }
  function stageById(id) { return stages.find(function (stage) { return stage.id === id; }) || stages[0]; }

  /* 地形與禁行逐格資料：由 scripts/generate-map-terrain.py 依 60 張美術大地圖
     產出（js/data/map-terrain.js），同一張圖的所有關卡共用同一份標註。 */
  var TERRAIN_CODES = { W: 'water', F: 'forest', R: 'fire' };
  function mapVariant(stage) {
    if (stage.boss) return 'boss';
    if (stage.hard) return 'hard-' + (Number(String(stage.id).match(/-h([1-4])$/)?.[1]) || 1);
    return 'field';
  }
  function terrainGrid(stage) {
    var data = global.TACTICAL_MAP_TERRAIN || {};
    var chapter = Math.max(1, Math.min(10, Number(stage.chapter) || 1));
    return data['chapter-' + String(chapter).padStart(2, '0') + '-' + mapVariant(stage)] || null;
  }
  function obstaclesFor(stage) {
    var grid = terrainGrid(stage), result = [];
    if (!grid) return result;
    for (var y = 0; y < grid.length; y++) for (var x = 0; x < grid[y].length; x++) {
      if (grid[y].charAt(x) === '#') result.push({ x: x, y: y });
    }
    return result;
  }

  /* 名冊展開：依 enemyCount 循環展開敵軍組成；首領關固定頭目一名在首位。 */
  function rosterFor(stage) {
    var base = stage.enemies, count = stage.enemyCount || base.length, result = [], start = 0;
    if (stage.boss) { result.push(base[0]); start = 1; }
    var pool = base.slice(start);
    if (!pool.length) pool = base.slice();
    while (result.length < count) result.push(pool[(result.length - (stage.boss ? 1 : 0)) % pool.length]);
    return result;
  }

  /* 依美術大地圖逐格標註回傳水／森／火；禁行格與圖外回傳空字串。 */
  function terrainAt(stage, x, y) {
    var grid = terrainGrid(stage);
    var row = grid && grid[y];
    return (row && TERRAIN_CODES[row.charAt(x)]) || '';
  }

  global.TACTICAL_CONTENT = Object.freeze({
    maps: chapters,
    chapters: chapters,
    stages: stages,
    skillTrees: skillTrees,
    quests: quests,
    mapById: mapById,
    stageById: stageById,
    terrainAt: terrainAt,
    mapLayout: function (stage) { return stage.mapId + (stage.boss ? '-boss' : stage.hard ? '-hard' : '-field'); },
    mapAsset: function (stage) {
      var chapter = Math.max(1, Math.min(10, Number(stage.chapter) || 1));
      return 'assets/maps/chapter-' + String(chapter).padStart(2, '0') + '-' + mapVariant(stage) + '-21x10.jpg';
    },
    obstaclesFor: obstaclesFor,
    rosterFor: rosterFor
  });
}(typeof window !== 'undefined' ? window : globalThis));
