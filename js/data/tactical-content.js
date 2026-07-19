/* JOSE 戰棋內容資料：10 大章節 × 150 關、掉落、任務與技能樹。
   每章 10 小關 + 1 首領關（擊破首領開啟下一章）+ 4 個 HARD 特別關（通關本章首領後解鎖）。 */
(function (global) {
  'use strict';

  /* 第一篇章嚴格依 Story Canon：生命 → 龍族守護，逐步埋入機械、天界、魔界與虛空伏筆。 */
  var chapters = [
    { id: 'c1', name: '幻獸初醒', icon: '🌱', element: 'forest', theme: 'verdant', coreType: '自然核心', boss: 'blightwood_sovereign', minions: ['rotcap_rootling', 'dryad_thorn', 'ent_sapling', 'venom_mantis'], description: '苔光森林與生命泉源異變；追查讓森林守護者失控的第一枚融合核心。', missions: ['泉源異變調查','苔光小徑救援','驅散腐化孢霧','追查核心殘響','守住生命泉支流','回收自然碎片','古樹祭壇淨化','森靈求救定位','腐菌根網切斷','枯木王座前進'], hard: ['污染源逆流','失落守林者','孢霧包圍網','自然核心試煉'] },
    { id: 'c2', name: '迷霧森林', icon: '🌫️', element: 'forest', theme: 'verdant', coreType: '自然核心', boss: 'thorn_hive_queen', minions: ['thorn_pollen_drone', 'mist_banshee', 'fog_wisp', 'gloom_turtle'], description: '瘴霧、毒沼與荊棘迷宮深處，有人正刻意蒐集散落的核心碎片。', missions: ['瘴霧邊界勘查','毒沼安全路線','失竊碎片追跡','荊棘迷宮破陣','救援迷途幻獸','辨識採集標記','阻斷花粉訊號','蜂巢外環突入','女王親衛瓦解','碎片倉庫奪回'], hard: ['毒沼殘響','採集者遺痕','荊棘核心庫','蜂后真巢'] },
    { id: 'c3', name: '赤炎火山', icon: '🌋', element: 'fire', theme: 'ember', coreType: '龍魂核心', boss: 'ash_crown_tyrant', minions: ['crown_cinderling', 'salamander_fiend', 'surtr_spawn', 'ember_imp'], description: '熔岩河與炎晶洞穴的火系幻獸失控；龍族壁畫首次記錄五界之門與始源晶核。', missions: ['熔岩河架橋','火系幻獸安撫','炎晶洞穴探勘','龍紋壁畫修復','五界之門辨讀','壓制火脈暴走','救出礦脈守衛','灰燼軍團突破','王冠熔爐封鎖','火山口決戰前夕'], hard: ['炎晶採掘隊','失控火脈','龍紋試煉','五界壁畫殘頁'] },
    { id: 'c4', name: '沉睡古城', icon: '🏛️', element: 'mixed', theme: 'rift', coreType: '古文明核心', boss: 'cathedral_titan', minions: ['rosewindow_sentinel', 'gargoyle_watcher', 'golem_sentinel', 'ash_hound'], description: '失落王國曾研究融合核心；神殿與魔像遺跡保留了文明因災難消失的證詞。', missions: ['城門石碑解讀','失落王國巡查','魔像警戒解除','研究室遺稿回收','災變年表拼合','聖堂補給通路','玫窗哨兵突破','地下檔案封存','泰坦啟動室抵達','古城真相對照'], hard: ['失落研究者','封存實驗記錄','魔像反制陣','災變前夜'] },
    { id: 'c5', name: '冰封雪原', icon: '❄️', element: 'ocean', theme: 'tide', coreType: '自然核心', boss: 'glacier_leviathan', minions: ['glacier_shellcrab', 'jotunn_frost', 'selkie_hunter', 'murk_fish'], description: '核心能量扭曲氣候；冰晶洞窟與永凍湖令沉睡數千年的遠古生命甦醒。', missions: ['暴雪前線穿越','冰晶洞窟點燈','永凍湖裂痕調查','遠古足跡追蹤','保護雪原聚落','回收凍結碎片','冰層共鳴校正','利維坦巢穴定位','解開遠古封凍','極寒湖心進軍'], hard: ['千年冰層','甦醒者群落','失溫核心井','永凍試煉'] },
    { id: 'c6', name: '雷鳴高原', icon: '⚡', element: 'mixed', theme: 'rift', coreType: '數據核心', boss: 'furnace_colossus', minions: ['slag_hound', 'thunderbird_kin', 'raiju_beast', 'void_eel'], description: '磁石山谷與古代鍛造場出現無法以自然解釋的金屬遺跡：機械文明的第一個明確伏筆。', missions: ['雷暴高原測繪','磁石山谷通電','鍛造場入口解鎖','非自然金屬鑑定','斷裂齒輪回收','雷鳴訊號追蹤','自律工坊停機','熔爐守衛壓制','巨神核心降溫','機械銘文破譯'], hard: ['自律鍛鎚','磁極反轉','遺失資料匣','數據核心殘片'] },
    { id: 'c7', name: '失落海域', icon: '🌊', element: 'ocean', theme: 'tide', coreType: '自然核心', boss: 'abyssal_kraken_emperor', minions: ['pearl_lantern_fry', 'siren_lure', 'kraken_tentacle', 'tide_spawn'], description: '沉沒城市與深海神殿記錄始源晶核破碎時，曾有來自世界之外的存在注視此地。', missions: ['沉沒城外環','潮汐航道護送','海底壁畫辨讀','晶核破碎回放','深海祭壇開啟','救援失落潛行者','世界外痕跡採樣','克拉肯觸腕斬斷','皇座水壓突破','神殿深處對峙'], hard: ['沉城守密者','破碎瞬間','世界外的影','深海皇室試煉'] },
    { id: 'c8', name: '天空遺跡', icon: '☀️', element: 'light', theme: 'rift', coreType: '聖光核心', boss: 'solar_seraph_chimera', minions: ['prism_wing_cub', 'cherub_guard', 'bennu_acolyte', 'flame_wisp'], description: '浮空島與天空神殿首度證實天界存在；石碑警告五界重連將再次開啟審判之門。', missions: ['浮空島著陸','風脈升降校正','神殿光路點亮','聖碑文字解碼','五界連結證實','避開審判巡翼','回收聖光碎片','奇美拉巢域突破','日輝祭壇淨化','審判門前警訊'], hard: ['墜落翼隊','星光石碑','審判預演','聖光核心守門'] },
    { id: 'c9', name: '魔界裂縫', icon: '🌑', element: 'dark', theme: 'rift', coreType: '深淵核心', boss: 'eclipse_bone_wyrm', minions: ['crescent_rib_whelp', 'cerberus_whelp', 'mara_fiend', 'void_eel'], description: '晶核活動使裂縫提早開啟，魔界生物首次進入現世；牠們不是答案，而是更大災變的警報。', missions: ['裂縫封鎖線','暗影森林偵查','異界生物辨識','避難幻獸護送','深淵氣息採樣','骨龍遺骸追跡','魔界倖存者對話','月蝕骨巢突入','鋼鐵警告驗證','裂縫邊界決戰'], hard: ['魔界逃難者','裂縫另一端','骨龍舊戰場','深淵核心警報'] },
    { id: 'c10', name: '遠古龍族之門', icon: '🐲', element: 'mixed', theme: 'rift', coreType: '龍魂核心', boss: 'void_devourer', minions: ['singularity_mite', 'chimera_spawn', 'leviathan_brood', 'mara_fiend'], description: '穿越龍之谷、龍魂祭壇與始源龍殿；龍族守護大型始源碎片，並非異變元凶。', missions: ['龍之谷入境','遠古龍門共鳴','龍魂祭壇試煉','守護者誤會化解','龍城記憶回收','始源碎片定位','跨界搜尋痕跡','皇族親衛考驗','龍殿封印解除','始源龍皇謁見'], hard: ['龍族守護契約','遠古龍城殘頁','跨界搜尋者','始源碎片共振'] }
  ];

  var HARD_NAMES = ['文明殘響', '角色側記', '歷史真相', '核心試煉'];
  var BOSS_NAMES = { blightwood_sovereign: '腐菌樹王', thorn_hive_queen: '荊棘蜂后', ash_crown_tyrant: '燼冠暴君', cathedral_titan: '聖堂泰坦', glacier_leviathan: '冰川利維坦', furnace_colossus: '熔爐巨神', abyssal_kraken_emperor: '深淵克拉肯皇', solar_seraph_chimera: '日輝奇美拉', eclipse_bone_wyrm: '蝕月骨龍', void_devourer: '始源龍皇・阿爾卡迪亞' };

  function round2(value) { return Math.round(value * 100) / 100; }

  /* 前五章讓玩家熟悉角色、元素與劇情；第六章起才逐步要求養成與編隊配合。 */
  var CHAPTER_BASE_POWER = [0.58, 0.66, 0.75, 0.85, 0.96, 1.12, 1.32, 1.55, 1.82, 2.14];
  var stages = [];
  chapters.forEach(function (chapter, chapterIndex) {
    var base = CHAPTER_BASE_POWER[chapterIndex];
    for (var index = 1; index <= 10; index++) {
      var elite = index >= 9;
      stages.push({
        id: chapter.id + '-' + index, mapId: chapter.id, chapter: chapterIndex + 1, index: index,
        order: chapterIndex * 11 + index,
        name: chapter.name + '・' + chapter.missions[index - 1],
        difficulty: elite ? '精英' : '普通', elite: elite,
        power: round2(base * (1 + (index - 1) * 0.022)),
        enemies: chapter.minions, enemyCount: Math.min(28, 10 + chapterIndex + Math.floor(index / 3)),
        seed: chapterIndex * 53 + index * 17 + 7,
        objective: chapter.missions[index - 1] + '：' + (index % 3 === 0 ? '在 ' + (18 + chapterIndex + Math.ceil(index / 2)) + ' 回合內完成調查' : index % 3 === 1 ? '排除阻礙，確保調查隊前進' : '保護至少半數幻獸，帶回關鍵線索'),
        turnLimit: 18 + chapterIndex + Math.ceil(index / 2),
        rewards: { medals: 3 + chapterIndex + Math.floor(index / 4), essence: 2 + Math.floor((chapterIndex + index) / 4), fusionCore: index >= 9 ? 1 : 0, coreType: chapter.coreType, coreLabel: index >= 9 ? chapter.coreType + '碎片' : chapter.coreType + '殘響' }
      });
    }
    stages.push({
      id: chapter.id + '-boss', mapId: chapter.id, chapter: chapterIndex + 1, index: 11,
      order: chapterIndex * 11 + 11, boss: true,
      name: chapter.name + '・魔王 ' + BOSS_NAMES[chapter.boss],
      difficulty: '首領', power: round2(base * 1.22),
      enemies: [chapter.boss].concat(chapter.minions), enemyCount: Math.min(30, 14 + chapterIndex),
      seed: chapterIndex * 53 + 199,
      objective: '擊敗 ' + BOSS_NAMES[chapter.boss] + '，取得高階' + chapter.coreType + '並開啟下一章',
      turnLimit: 24 + chapterIndex,
      rewards: { medals: 8 + chapterIndex * 2, essence: 6 + chapterIndex, fusionCore: 2 + (chapterIndex >= 5 ? 1 : 0), coreType: chapter.coreType, coreLabel: '高階' + chapter.coreType }
    });
    for (var hard = 1; hard <= 4; hard++) {
      stages.push({
        id: chapter.id + '-h' + hard, mapId: chapter.id, chapter: chapterIndex + 1, index: 11 + hard,
        order: 900 + chapterIndex * 10 + hard, hard: true, elite: true,
        name: chapter.name + '・HARD ' + chapter.hard[hard - 1],
        difficulty: 'HARD', power: round2(base * 1.22 * (1.04 + hard * 0.04)),
        enemies: chapter.minions, enemyCount: Math.min(30, 16 + chapterIndex + hard * 2),
        seed: chapterIndex * 53 + hard * 29 + 401,
        objective: 'HARD ' + HARD_NAMES[hard - 1] + '：完成「' + chapter.hard[hard - 1] + '」並帶回稀有線索',
        turnLimit: 26 + chapterIndex,
        rewards: { medals: 10 + chapterIndex * 2 + hard, essence: 8 + chapterIndex, fusionCore: 1 + (hard === 4 ? 2 : 1), coreType: chapter.coreType, coreLabel: '稀有' + chapter.coreType }
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
