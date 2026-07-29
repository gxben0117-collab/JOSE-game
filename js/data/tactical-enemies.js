/* 敵方魔物資料層：12 種單階小兵與 4 隻章節首領。
   與 TACTICAL_PET_DATA 相同介面；小兵不進化，portrait 一律取 assets/enemies/。
   實際戰鬥強度 = 基礎數值 × 關卡 power 倍率（見 tactical-content.js）。 */
(function (global) {
  'use strict';

  function skill(name, options) {
    return Object.assign({
      name: name, kind: 'active', effect: 'damage', multiplier: 1, value: 0,
      range: 1, radius: 0, attackStyle: 'melee', cooldown: 0,
      vfxKey: 'enemy-' + name, vfxVariant: 0, vfxHue: 0
    }, options);
  }

  function enemy(id, name, element, role, roleLabel, stats, move, skills, extra) {
    var hue = { fire: 16, forest: 110, ocean: 210, light: 46, dark: 275, machine: 194 }[element] || 275;
    skills.forEach(function (entry, index) { entry.vfxKey = id + '-' + index; entry.vfxVariant = index % 5; if (!entry.vfxHue) entry.vfxHue = hue; });
    return Object.assign({
      id: id, name: name, element: element, rarity: extra && extra.boss ? 'legend' : 'common',
      role: role, roleLabel: roleLabel, attackStyle: skills[0].attackStyle,
      stats: stats, move: move, skills: skills, passives: (extra && extra.passives) || [],
      size: (extra && extra.size) || (extra && extra.boss ? 2 : 1),
      evolution: [{ stage: 1, label: extra && extra.boss ? '首領' : '魔物', portrait: 'assets/enemies/' + id + '.png' }],
      minion: !(extra && extra.boss), boss: Boolean(extra && extra.boss)
    }, extra || {});
  }

  var MINIONS = [
    enemy('ember_imp', '餘燼小鬼', 'fire', 'attacker', '低階魔獸', { health: 470, power: 78, magic: 118, defense: 46, speed: 8 }, 3, [
      skill('火星彈', { kind: 'basic', multiplier: 0.85, range: 3, attackStyle: 'ranged' }),
      skill('爆裂火花', { multiplier: 1.15, range: 4, attackStyle: 'ranged', cooldown: 2, status: 'burn', statusTurns: 2 })
    ]),
    enemy('ash_hound', '灰燼魔犬', 'fire', 'attacker', '低階魔獸', { health: 560, power: 132, magic: 60, defense: 62, speed: 9 }, 4, [
      skill('撕咬', { kind: 'basic', multiplier: 0.9 }),
      skill('烈焰衝撞', { multiplier: 1.2, cooldown: 2, push: 1 })
    ]),
    enemy('cinder_bat', '燼翼魔蝠', 'fire', 'controller', '低階魔獸', { health: 430, power: 62, magic: 126, defense: 44, speed: 10 }, 4, [
      skill('音爆', { kind: 'basic', multiplier: 0.8, range: 3, attackStyle: 'ranged' }),
      skill('灼熱聲波', { multiplier: 1.05, range: 4, attackStyle: 'ranged', cooldown: 2, status: 'burn', statusTurns: 3 })
    ]),
    enemy('flame_wisp', '燼火妖靈', 'fire', 'healer', '魔物祭司', { health: 520, power: 52, magic: 158, defense: 58, speed: 5 }, 3, [
      skill('妖火', { kind: 'basic', multiplier: 0.75, range: 3, attackStyle: 'ranged' }),
      skill('餘燼治療', { effect: 'heal', multiplier: 0.95, range: 4, attackStyle: 'support', cooldown: 1 })
    ]),
    enemy('blight_boar', '荒疫魔豬', 'forest', 'defender', '低階魔獸', { health: 900, power: 108, magic: 46, defense: 118, speed: 5 }, 2, [
      skill('獠牙', { kind: 'basic', multiplier: 0.85 }),
      skill('疫病衝撞', { multiplier: 1.1, cooldown: 2, push: 2 })
    ]),
    enemy('thorn_creeper', '荊棘魔藤', 'forest', 'controller', '低階魔獸', { health: 540, power: 66, magic: 138, defense: 56, speed: 6 }, 3, [
      skill('棘鞭', { kind: 'basic', multiplier: 0.8, range: 3, attackStyle: 'ranged' }),
      skill('荊棘纏拉', { multiplier: 0.95, range: 4, attackStyle: 'ranged', cooldown: 2, pull: 3, status: 'poison', statusTurns: 2 })
    ]),
    enemy('venom_mantis', '劇毒魔螳', 'forest', 'attacker', '低階魔獸', { health: 520, power: 138, magic: 62, defense: 54, speed: 9 }, 3, [
      skill('鐮切', { kind: 'basic', multiplier: 0.9 }),
      skill('注毒雙刃', { multiplier: 1.15, cooldown: 2, status: 'poison', statusTurns: 3 })
    ]),
    enemy('gloom_turtle', '幽暗魔龜', 'forest', 'defender', '低階魔獸', { health: 980, power: 92, magic: 60, defense: 132, speed: 3 }, 2, [
      skill('甲擊', { kind: 'basic', multiplier: 0.85 }),
      skill('硬化甲殼', { effect: 'shield', value: 0.9, range: 0, attackStyle: 'support', cooldown: 3 })
    ]),
    enemy('murk_fish', '濁潮魔星', 'ocean', 'attacker', '低階魔獸', { health: 500, power: 66, magic: 132, defense: 52, speed: 7 }, 3, [
      skill('水刃', { kind: 'basic', multiplier: 0.85, range: 3, attackStyle: 'ranged' }),
      skill('濁流亂射', { multiplier: 0.95, range: 4, radius: 1, attackStyle: 'area', cooldown: 3 })
    ]),
    enemy('tide_spawn', '深潮觸手', 'ocean', 'controller', '低階魔獸', { health: 620, power: 74, magic: 140, defense: 66, speed: 6 }, 3, [
      skill('觸擊', { kind: 'basic', multiplier: 0.8, range: 2, attackStyle: 'ranged' }),
      skill('深淵拖拽', { multiplier: 0.9, range: 4, attackStyle: 'ranged', cooldown: 2, pull: 3 })
    ]),
    enemy('frost_shell', '寒霜魔蟹', 'ocean', 'defender', '低階魔獸', { health: 920, power: 112, magic: 54, defense: 126, speed: 4 }, 2, [
      skill('重鉗', { kind: 'basic', multiplier: 0.85 }),
      skill('凍結鉗擊', { multiplier: 1.05, cooldown: 3, status: 'freeze', statusTurns: 1 })
    ]),
    enemy('void_eel', '虛空魔鰻', 'ocean', 'controller', '低階魔獸', { health: 480, power: 60, magic: 148, defense: 50, speed: 8 }, 3, [
      skill('放電', { kind: 'basic', multiplier: 0.8, range: 3, attackStyle: 'ranged' }),
      skill('虛空凍流', { multiplier: 1.0, range: 4, attackStyle: 'ranged', cooldown: 3, status: 'freeze', statusTurns: 1 })
    ]),

    /* ── 第 11 章：機械紀元・廢鐵邊境 ── */
    enemy('rust_scout', '鏽蝕偵察兵', 'machine', 'controller', '機械小兵', { health: 840, power: 96, magic: 182, defense: 82, speed: 8 }, 3, [
      skill('掃描脈衝', { kind: 'basic', multiplier: 0.82, range: 4, attackStyle: 'ranged' }),
      skill('故障標記', { multiplier: 1.0, range: 4, attackStyle: 'ranged', cooldown: 2, status: 'freeze', statusTurns: 1 })
    ], { loreElement: 'machine' }),
    enemy('rail_demolition', '軌道爆破兵', 'machine', 'attacker', '機械小兵', { health: 980, power: 184, magic: 116, defense: 96, speed: 5 }, 2, [
      skill('鑽頭衝擊', { kind: 'basic', multiplier: 0.92 }),
      skill('鐵軌爆破', { multiplier: 1.18, range: 3, radius: 1, attackStyle: 'area', cooldown: 3, push: 1 })
    ], { loreElement: 'machine' }),
    enemy('heavy_rail_guard', '重裝鐵衛', 'machine', 'defender', '首領親衛', { health: 2250, power: 242, magic: 112, defense: 260, speed: 3 }, 2, [
      skill('鐵衛重錘', { kind: 'basic', multiplier: 0.98 }),
      skill('列車盾牆', { effect: 'shield', value: 0.95, range: 3, attackStyle: 'support', cooldown: 3 })
    ], { loreElement: 'machine', size: 2, guard: true }),
    enemy('sawwheel_hunter', '鋸輪獵兵', 'machine', 'attacker', '首領親衛', { health: 1780, power: 288, magic: 138, defense: 154, speed: 5 }, 3, [
      skill('鋸輪斬', { kind: 'basic', multiplier: 1.0 }),
      skill('鋼軌獵殺', { multiplier: 1.28, range: 3, cooldown: 2, push: 2 })
    ], { loreElement: 'machine', size: 2, guard: true }),

    /* ── 章節首領專屬神話小兵（玩家無法取得） ── */
    enemy('dryad_thorn', '棘刺樹精', 'forest', 'controller', '首領親衛', { health: 560, power: 70, magic: 142, defense: 60, speed: 6 }, 3, [
      skill('棘針', { kind: 'basic', multiplier: 0.85, range: 3, attackStyle: 'ranged' }),
      skill('荊棘寄生', { multiplier: 1.0, range: 4, attackStyle: 'ranged', cooldown: 2, status: 'poison', statusTurns: 3 })
    ]),
    enemy('ent_sapling', '恩特幼樹人', 'forest', 'defender', '首領親衛', { health: 1050, power: 108, magic: 52, defense: 138, speed: 3 }, 2, [
      skill('枝幹重擊', { kind: 'basic', multiplier: 0.9 }),
      skill('樹皮硬化', { effect: 'shield', value: 0.9, range: 0, attackStyle: 'support', cooldown: 3 })
    ]),
    enemy('mist_banshee', '迷霧報喪女妖', 'forest', 'controller', '首領親衛', { health: 520, power: 62, magic: 150, defense: 54, speed: 8 }, 3, [
      skill('哀嚎', { kind: 'basic', multiplier: 0.85, range: 3, attackStyle: 'ranged' }),
      skill('喪鐘迴響', { multiplier: 1.05, range: 4, radius: 1, attackStyle: 'area', cooldown: 3, status: 'poison', statusTurns: 2 })
    ]),
    enemy('fog_wisp', '霧中鬼火', 'forest', 'healer', '首領親衛', { health: 500, power: 50, magic: 160, defense: 52, speed: 6 }, 3, [
      skill('迷濛光', { kind: 'basic', multiplier: 0.75, range: 3, attackStyle: 'ranged' }),
      skill('霧靈回魂', { effect: 'heal', multiplier: 1.0, range: 4, attackStyle: 'support', cooldown: 1 })
    ]),
    enemy('salamander_fiend', '火蜥精', 'fire', 'attacker', '首領親衛', { health: 580, power: 140, magic: 66, defense: 58, speed: 8 }, 3, [
      skill('熔顎咬', { kind: 'basic', multiplier: 0.95 }),
      skill('赤炎撲殺', { multiplier: 1.25, cooldown: 2, status: 'burn', statusTurns: 2 })
    ]),
    enemy('surtr_spawn', '焰巨人眷屬', 'fire', 'defender', '首領親衛', { health: 1000, power: 120, magic: 54, defense: 128, speed: 4 }, 2, [
      skill('燃燒巨拳', { kind: 'basic', multiplier: 0.9 }),
      skill('末日火撞', { multiplier: 1.15, cooldown: 2, push: 2 })
    ]),
    enemy('gargoyle_watcher', '石像鬼守望者', 'fire', 'controller', '首領親衛', { health: 640, power: 76, magic: 138, defense: 84, speed: 7 }, 4, [
      skill('石翼刃', { kind: 'basic', multiplier: 0.85, range: 3, attackStyle: 'ranged' }),
      skill('石化凝視', { multiplier: 0.95, range: 4, attackStyle: 'ranged', cooldown: 3, status: 'freeze', statusTurns: 1 })
    ]),
    enemy('golem_sentinel', '魔像哨衛', 'fire', 'defender', '首領親衛', { health: 1150, power: 126, magic: 48, defense: 150, speed: 3 }, 2, [
      skill('巨石拳', { kind: 'basic', multiplier: 0.95 }),
      skill('崩擊', { multiplier: 1.2, cooldown: 2, push: 1 })
    ]),
    enemy('jotunn_frost', '霜巨人小卒', 'ocean', 'defender', '首領親衛', { health: 1080, power: 122, magic: 60, defense: 132, speed: 4 }, 2, [
      skill('冰拳', { kind: 'basic', multiplier: 0.9 }),
      skill('凍土踐踏', { multiplier: 1.1, cooldown: 3, status: 'freeze', statusTurns: 1 })
    ]),
    enemy('selkie_hunter', '賽爾奇獵手', 'ocean', 'attacker', '首領親衛', { health: 560, power: 136, magic: 64, defense: 56, speed: 9 }, 4, [
      skill('潮刃', { kind: 'basic', multiplier: 0.95 }),
      skill('海豹突襲', { multiplier: 1.28, cooldown: 2 })
    ]),
    enemy('thunderbird_kin', '雷鳥眷屬', 'ocean', 'controller', '首領親衛', { health: 540, power: 64, magic: 152, defense: 56, speed: 10 }, 4, [
      skill('雷喙', { kind: 'basic', multiplier: 0.85, range: 3, attackStyle: 'ranged' }),
      skill('雷雲召喚', { multiplier: 1.0, range: 4, radius: 1, attackStyle: 'area', cooldown: 3, status: 'freeze', statusTurns: 1 })
    ]),
    enemy('raiju_beast', '雷獸', 'ocean', 'attacker', '首領親衛', { health: 570, power: 142, magic: 70, defense: 58, speed: 10 }, 4, [
      skill('電光爪', { kind: 'basic', multiplier: 0.95 }),
      skill('雷霆疾馳', { multiplier: 1.3, cooldown: 2 })
    ]),
    enemy('siren_lure', '深海賽蓮', 'ocean', 'healer', '首領親衛', { health: 540, power: 54, magic: 162, defense: 56, speed: 6 }, 3, [
      skill('魅音', { kind: 'basic', multiplier: 0.8, range: 3, attackStyle: 'ranged' }),
      skill('深海讚歌', { effect: 'heal_all', multiplier: 0.7, range: 4, radius: 1, attackStyle: 'support', cooldown: 3 })
    ]),
    enemy('kraken_tentacle', '克拉肯觸鬚', 'ocean', 'controller', '首領親衛', { health: 660, power: 78, magic: 146, defense: 70, speed: 6 }, 3, [
      skill('觸鞭', { kind: 'basic', multiplier: 0.85, range: 2, attackStyle: 'ranged' }),
      skill('深淵絞纏', { multiplier: 0.95, range: 4, attackStyle: 'ranged', cooldown: 2, pull: 3 })
    ]),
    enemy('cherub_guard', '智天使侍衛', 'light', 'defender', '首領親衛', { health: 1020, power: 118, magic: 84, defense: 126, speed: 5 }, 3, [
      skill('聖環擊', { kind: 'basic', multiplier: 0.9 }),
      skill('聖光壁', { effect: 'shield', value: 0.85, range: 3, attackStyle: 'support', cooldown: 3 })
    ]),
    enemy('bennu_acolyte', '貝努鳥侍祭', 'light', 'healer', '首領親衛', { health: 520, power: 56, magic: 164, defense: 54, speed: 8 }, 4, [
      skill('曦光羽', { kind: 'basic', multiplier: 0.8, range: 3, attackStyle: 'ranged' }),
      skill('晨曦再生', { effect: 'heal', multiplier: 1.05, range: 4, attackStyle: 'support', cooldown: 1 })
    ]),
    enemy('cerberus_whelp', '地獄犬幼獸', 'dark', 'attacker', '首領親衛', { health: 600, power: 146, magic: 66, defense: 60, speed: 9 }, 4, [
      skill('三首撕咬', { kind: 'basic', multiplier: 0.95 }),
      skill('冥府獵殺', { multiplier: 1.3, cooldown: 2, status: 'poison', statusTurns: 2 })
    ]),
    enemy('mara_fiend', '夢魔瑪拉', 'dark', 'controller', '首領親衛', { health: 540, power: 60, magic: 156, defense: 56, speed: 7 }, 3, [
      skill('夢囈', { kind: 'basic', multiplier: 0.85, range: 3, attackStyle: 'ranged' }),
      skill('噩夢纏身', { multiplier: 1.0, range: 4, attackStyle: 'ranged', cooldown: 3, status: 'freeze', statusTurns: 1 })
    ]),
    enemy('chimera_spawn', '奇美拉幼體', 'dark', 'attacker', '首領親衛', { health: 640, power: 150, magic: 84, defense: 64, speed: 9 }, 4, [
      skill('三獸之牙', { kind: 'basic', multiplier: 0.95 }),
      skill('混沌暴走', { multiplier: 1.2, range: 3, radius: 1, attackStyle: 'area', cooldown: 3 })
    ]),
    enemy('leviathan_brood', '利維坦之裔', 'dark', 'defender', '首領親衛', { health: 1120, power: 130, magic: 62, defense: 142, speed: 4 }, 2, [
      skill('巨鰭橫掃', { kind: 'basic', multiplier: 0.95 }),
      skill('深淵壓潰', { multiplier: 1.18, cooldown: 2, push: 2 })
    ]),
    enemy('crown_cinderling', '燼冠餘燼靈', 'fire', 'attacker', '首領親衛', { health: 520, power: 128, magic: 118, defense: 52, speed: 8 }, 3, [
      skill('燼冠火星', { kind: 'basic', multiplier: 0.85, range: 3, attackStyle: 'ranged' }),
      skill('王冠燃爆', { multiplier: 1.15, range: 4, attackStyle: 'ranged', cooldown: 2, status: 'burn', statusTurns: 2 })
    ]),
    enemy('slag_hound', '熔渣獵犬', 'fire', 'attacker', '首領親衛', { health: 590, power: 140, magic: 62, defense: 60, speed: 9 }, 4, [
      skill('熔渣咬', { kind: 'basic', multiplier: 0.95 }),
      skill('雷渣衝鋒', { multiplier: 1.25, cooldown: 2, push: 1 })
    ]),
    enemy('rotcap_rootling', '腐菌根靈', 'forest', 'healer', '首領親衛', { health: 520, power: 52, magic: 158, defense: 56, speed: 5 }, 3, [
      skill('孢子彈', { kind: 'basic', multiplier: 0.78, range: 3, attackStyle: 'ranged' }),
      skill('菌絲再生', { effect: 'heal', multiplier: 1.0, range: 4, attackStyle: 'support', cooldown: 1 })
    ]),
    enemy('thorn_pollen_drone', '荊棘花粉蜂', 'forest', 'controller', '首領親衛', { health: 500, power: 60, magic: 148, defense: 52, speed: 9 }, 4, [
      skill('毒粉針', { kind: 'basic', multiplier: 0.82, range: 3, attackStyle: 'ranged' }),
      skill('麻痺花粉', { multiplier: 0.95, range: 4, attackStyle: 'ranged', cooldown: 3, status: 'poison', statusTurns: 3 })
    ]),
    enemy('pearl_lantern_fry', '珠燈稚魚', 'ocean', 'healer', '首領親衛', { health: 500, power: 50, magic: 160, defense: 52, speed: 7 }, 3, [
      skill('珠光彈', { kind: 'basic', multiplier: 0.78, range: 3, attackStyle: 'ranged' }),
      skill('珠燈潮癒', { effect: 'heal', multiplier: 1.05, range: 4, attackStyle: 'support', cooldown: 1 })
    ]),
    enemy('glacier_shellcrab', '冰川殼蟹', 'ocean', 'defender', '首領親衛', { health: 1100, power: 120, magic: 56, defense: 148, speed: 3 }, 2, [
      skill('冰殼鉗', { kind: 'basic', multiplier: 0.9 }),
      skill('寒霜重鉗', { multiplier: 1.1, cooldown: 3, status: 'freeze', statusTurns: 1 })
    ]),
    enemy('prism_wing_cub', '稜翼幼獸', 'light', 'support', '首領親衛', { health: 540, power: 58, magic: 150, defense: 56, speed: 8 }, 4, [
      skill('稜光羽', { kind: 'basic', multiplier: 0.8, range: 3, attackStyle: 'ranged' }),
      skill('稜光庇護', { effect: 'shield', value: 0.85, range: 4, attackStyle: 'support', cooldown: 3 })
    ]),
    enemy('rosewindow_sentinel', '彩窗哨兵', 'light', 'defender', '首領親衛', { health: 1080, power: 122, magic: 88, defense: 140, speed: 4 }, 2, [
      skill('聖窗衝擊', { kind: 'basic', multiplier: 0.92 }),
      skill('聖光反射', { effect: 'shield', value: 0.9, range: 0, attackStyle: 'support', cooldown: 3 })
    ]),
    enemy('crescent_rib_whelp', '月肋幼龍', 'dark', 'attacker', '首領親衛', { health: 620, power: 148, magic: 84, defense: 62, speed: 9 }, 4, [
      skill('月骨爪', { kind: 'basic', multiplier: 0.95 }),
      skill('蝕月突襲', { multiplier: 1.3, cooldown: 2, status: 'poison', statusTurns: 2 })
    ]),
    enemy('singularity_mite', '奇點蟎', 'dark', 'controller', '首領親衛', { health: 520, power: 60, magic: 158, defense: 54, speed: 8 }, 3, [
      skill('引力刺', { kind: 'basic', multiplier: 0.82, range: 3, attackStyle: 'ranged' }),
      skill('奇點吸引', { multiplier: 0.95, range: 4, attackStyle: 'ranged', cooldown: 2, pull: 3 })
    ])
  ];

  var BOSSES = [
    enemy('ash_crown_tyrant', '燼冠暴君', 'fire', 'attacker', '章節首領', { health: 3300, power: 470, magic: 350, defense: 240, speed: 8 }, 3, [
      skill('燼冠爪', { kind: 'basic', multiplier: 0.9 }),
      skill('王冠烈焰', { kind: 'active', multiplier: 0.95, range: 4, radius: 2, attackStyle: 'area', cooldown: 3, status: 'burn', statusTurns: 2 }),
      skill('焚世加冕', { kind: 'ultimate', multiplier: 1.5, cooldown: 4, push: 2 })
    ], { boss: true, passives: [{ name: '燼冠餘熱', effect: 'burn', value: 0.05, chance: 0.3 }] }),
    enemy('furnace_colossus', '熔爐巨神', 'fire', 'defender', '章節首領', { health: 4300, power: 445, magic: 300, defense: 385, speed: 4 }, 2, [
      skill('熔爐重錘', { kind: 'basic', multiplier: 0.95 }),
      skill('雷熔震盪', { kind: 'active', multiplier: 0.9, range: 3, radius: 2, attackStyle: 'area', cooldown: 3 }),
      skill('巨神崩擊', { kind: 'ultimate', multiplier: 1.55, cooldown: 4, push: 3 })
    ], { boss: true }),
    enemy('blightwood_sovereign', '腐菌樹王', 'forest', 'defender', '章節首領', { health: 4400, power: 400, magic: 300, defense: 360, speed: 5 }, 2, [
      skill('腐木重擊', { kind: 'basic', multiplier: 0.9 }),
      skill('腐菌孢雨', { kind: 'active', multiplier: 0.85, range: 4, radius: 2, attackStyle: 'area', cooldown: 3, status: 'poison', statusTurns: 3 }),
      skill('根鬚牽引', { kind: 'ultimate', multiplier: 1.25, range: 5, attackStyle: 'ranged', cooldown: 4, pull: 4 })
    ], { boss: true }),
    enemy('thorn_hive_queen', '荊棘蜂后', 'forest', 'controller', '章節首領', { health: 3500, power: 420, magic: 430, defense: 260, speed: 8 }, 3, [
      skill('棘刺螫', { kind: 'basic', multiplier: 0.9, range: 3, attackStyle: 'ranged' }),
      skill('蜂群風暴', { kind: 'active', multiplier: 0.88, range: 4, radius: 2, attackStyle: 'area', cooldown: 3, status: 'poison', statusTurns: 3 }),
      skill('女王號令', { kind: 'ultimate', multiplier: 1.3, range: 5, attackStyle: 'ranged', cooldown: 4, pull: 4 })
    ], { boss: true }),
    enemy('abyssal_kraken_emperor', '深淵克拉肯皇', 'ocean', 'allrounder', '章節首領', { health: 4200, power: 460, magic: 480, defense: 310, speed: 6 }, 3, [
      skill('觸腕橫掃', { kind: 'basic', multiplier: 0.95 }),
      skill('滅頂漩渦', { kind: 'active', multiplier: 0.92, range: 4, radius: 2, attackStyle: 'area', cooldown: 3, pull: 2 }),
      skill('深淵海嘯', { kind: 'ultimate', multiplier: 1.55, range: 5, attackStyle: 'ranged', cooldown: 4, status: 'freeze', statusTurns: 1 })
    ], { boss: true }),
    enemy('glacier_leviathan', '冰川利維坦', 'ocean', 'defender', '章節首領', { health: 3900, power: 430, magic: 460, defense: 300, speed: 6 }, 3, [
      skill('冰川潮擊', { kind: 'basic', multiplier: 0.9, range: 3, attackStyle: 'ranged' }),
      skill('極寒領域', { kind: 'active', multiplier: 0.9, range: 4, radius: 2, attackStyle: 'area', cooldown: 4, status: 'freeze', statusTurns: 1 }),
      skill('冰洋巨浪', { kind: 'ultimate', multiplier: 1.55, range: 5, attackStyle: 'ranged', cooldown: 4 })
    ], { boss: true }),
    enemy('solar_seraph_chimera', '日輝奇美拉', 'light', 'healer', '章節首領', { health: 4000, power: 430, magic: 520, defense: 290, speed: 8 }, 3, [
      skill('日輝爪', { kind: 'basic', multiplier: 0.95 }),
      skill('聖翼烈焰', { kind: 'active', multiplier: 0.95, range: 4, radius: 2, attackStyle: 'area', cooldown: 3, status: 'burn', statusTurns: 2 }),
      skill('聖光重生', { kind: 'ultimate', effect: 'heal', multiplier: 1.1, range: 5, attackStyle: 'support', cooldown: 4 })
    ], { boss: true }),
    enemy('cathedral_titan', '聖堂泰坦', 'light', 'defender', '章節首領', { health: 4400, power: 440, magic: 320, defense: 390, speed: 4 }, 2, [
      skill('聖堂踏擊', { kind: 'basic', multiplier: 0.95 }),
      skill('彩窗聖震', { kind: 'active', multiplier: 0.9, range: 3, radius: 2, attackStyle: 'area', cooldown: 3 }),
      skill('神殿崩落', { kind: 'ultimate', multiplier: 1.5, cooldown: 4, push: 3 })
    ], { boss: true }),
    enemy('eclipse_bone_wyrm', '蝕月骨龍', 'dark', 'attacker', '章節首領', { health: 4100, power: 540, magic: 460, defense: 300, speed: 10 }, 4, [
      skill('骨龍撕咬', { kind: 'basic', multiplier: 1.0 }),
      skill('蝕月吐息', { kind: 'active', multiplier: 0.95, range: 4, radius: 2, attackStyle: 'area', cooldown: 3, status: 'poison', statusTurns: 2 }),
      skill('月蝕獵殺', { kind: 'ultimate', multiplier: 1.65, cooldown: 4, push: 2 })
    ], { boss: true }),
    enemy('void_devourer', '始源龍皇・阿爾卡迪亞', 'dark', 'allrounder', '龍族守護者', { health: 4700, power: 540, magic: 500, defense: 330, speed: 7 }, 3, [
      skill('始源龍爪', { kind: 'basic', multiplier: 0.95 }),
      skill('守護龍息', { kind: 'active', multiplier: 1.0, range: 4, radius: 2, attackStyle: 'area', cooldown: 3, status: 'poison', statusTurns: 2 }),
      skill('龍殿共鳴', { kind: 'ultimate', multiplier: 1.4, range: 5, attackStyle: 'ranged', cooldown: 4, pull: 4, status: 'freeze', statusTurns: 1 })
    ], { boss: true, size: 3 }),
    enemy('scrap_crocodile', '機關廢鐵巨鱷', 'machine', 'defender', '章節首領', { health: 18000, power: 850, magic: 420, defense: 720, speed: 4 }, 2, [
      skill('廢鐵撕咬', { kind: 'basic', multiplier: 1.02 }),
      skill('鋼軌暴衝', { multiplier: 1.15, range: 4, radius: 1, attackStyle: 'area', cooldown: 3, push: 3 }),
      skill('廢鐵吞噬', { kind: 'ultimate', multiplier: 1.55, range: 5, radius: 2, attackStyle: 'area', cooldown: 5, status: 'burn', statusTurns: 2 })
    ], { boss: true, size: 4, loreElement: 'machine', passives: [{ name: '鋼鐵裝甲', effect: 'def_boost', value: 0.22 }] })
  ];

  var SKELETONS = [
    enemy('skeleton_soldier', '骷髏兵', 'dark', 'attacker', '骷髏軍團', { health: 760, power: 138, magic: 45, defense: 82, speed: 7 }, 3, [
      skill('鏽骨斬', { kind: 'basic', multiplier: 0.92 }), skill('亡者突刺', { multiplier: 1.18, cooldown: 2, push: 1 })
    ]),
    enemy('skeleton_mage', '骷髏法師', 'dark', 'controller', '骷髏軍團', { health: 620, power: 52, magic: 178, defense: 60, speed: 6 }, 3, [
      skill('骨火彈', { kind: 'basic', multiplier: 0.85, range: 4, attackStyle: 'ranged' }), skill('亡靈禁錮', { multiplier: 1.05, range: 4, attackStyle: 'ranged', cooldown: 2, status: 'freeze', statusTurns: 1 })
    ]),
    enemy('skeleton_knight', '骷髏騎士', 'dark', 'defender', '骷髏軍團', { health: 1450, power: 172, magic: 65, defense: 186, speed: 5 }, 3, [
      skill('骨盾猛擊', { kind: 'basic', multiplier: 0.95 }), skill('死亡衝鋒', { multiplier: 1.25, cooldown: 3, push: 2 })
    ], { size: 2 }),
    enemy('skeleton_sergeant', '骷髏士官長', 'dark', 'allrounder', '骷髏軍團菁英', { health: 1780, power: 205, magic: 120, defense: 175, speed: 7 }, 4, [
      skill('軍團斬', { kind: 'basic', multiplier: 1.0 }), skill('骸骨號令', { effect: 'shield', value: 0.7, range: 3, attackStyle: 'support', cooldown: 3 })
    ], { size: 2 }),
    enemy('skeleton_king', '骷髏王', 'dark', 'defender', '菁英級 BOSS', { health: 7200, power: 610, magic: 360, defense: 520, speed: 5 }, 3, [
      skill('王骸巨劍', { kind: 'basic', multiplier: 1.0 }), skill('亡者王令', { multiplier: 1.0, range: 4, radius: 2, attackStyle: 'area', cooldown: 3, status: 'poison', statusTurns: 2 }), skill('白骨王座', { kind: 'ultimate', multiplier: 1.7, cooldown: 5, push: 3 })
    ], { boss: true, size: 4, passives: [{ name: '亡者之王', effect: 'def_boost', value: 0.25 }] }),
    enemy('bone_dragon', '骨龍', 'dark', 'attacker', '菁英級 BOSS', { health: 6800, power: 680, magic: 560, defense: 410, speed: 9 }, 5, [
      skill('碎骨龍爪', { kind: 'basic', multiplier: 1.05 }), skill('腐亡吐息', { multiplier: 1.05, range: 5, radius: 2, attackStyle: 'area', cooldown: 3, status: 'poison', statusTurns: 3 }), skill('骸翼墜落', { kind: 'ultimate', multiplier: 1.8, range: 4, radius: 2, attackStyle: 'area', cooldown: 5 })
    ], { boss: true, size: 4, passives: [{ name: '骨翼霸主', effect: 'atk_boost', value: 0.22 }] }),
    enemy('lich', '巫妖', 'dark', 'controller', '菁英級 BOSS', { health: 6400, power: 310, magic: 760, defense: 390, speed: 8 }, 4, [
      skill('靈魂箭', { kind: 'basic', multiplier: 0.95, range: 5, attackStyle: 'ranged' }), skill('寒墓領域', { multiplier: 0.95, range: 5, radius: 3, attackStyle: 'area', cooldown: 3, status: 'freeze', statusTurns: 1 }), skill('命匣爆裂', { kind: 'ultimate', multiplier: 1.75, range: 6, attackStyle: 'ranged', cooldown: 5, pull: 3 })
    ], { boss: true, size: 4, passives: [{ name: '命匣不滅', effect: 'hp_boost', value: 0.3 }] }),
    enemy('lich_king', '巫妖王', 'dark', 'allrounder', '魔神級 BOSS', { health: 11500, power: 720, magic: 920, defense: 620, speed: 8 }, 4, [
      skill('霜亡王劍', { kind: 'basic', multiplier: 1.05, range: 2 }), skill('永夜冰墓', { multiplier: 1.0, range: 6, radius: 3, attackStyle: 'area', cooldown: 3, status: 'freeze', statusTurns: 1 }), skill('亡靈天災', { kind: 'ultimate', multiplier: 1.95, range: 7, radius: 3, attackStyle: 'area', cooldown: 5, pull: 4, status: 'poison', statusTurns: 3 })
    ], { boss: true, size: 5, passives: [{ name: '魔神威壓', effect: 'all_boost', value: 0.35 }] })
  ];

  /* 第 12～15 章：每章兩名小兵、兩名親衛與一名大型首領。美術來源均為
     assets/animations/directional/sources 的核准四方向原畫。 */
  var MACHINE_ARC = [
    ['electromagnetic_infantry','電磁步兵','attacker','機械小兵',1180,260,150,116,7,1], ['energy_carrier','能量搬運機','support','機械小兵',1240,120,240,138,5,1], ['lightning_hunter','雷光獵手','controller','首領親衛',2180,280,340,176,8,2], ['high_voltage_guard','高壓護衛','defender','首領親衛',2840,310,190,300,4,2],
    ['furnace_sapper','熔爐工兵','attacker','機械小兵',1420,310,180,130,6,1], ['cinder_mechanical_hound','焦炭機械犬','attacker','機械小兵',1360,340,130,120,9,1], ['magma_heavy_guard','熔岩重衛','defender','首領親衛',3200,360,170,330,3,2], ['hydraulic_war_spider','液壓戰蛛','controller','首領親衛',2520,310,300,210,6,2],
    ['experiment_trooper','實驗機兵','controller','機械小兵',1600,210,330,145,7,1], ['bionic_hound','仿生獵犬','attacker','機械小兵',1510,360,150,135,9,1], ['prototype_guard','原型護衛機','defender','首領親衛',3480,340,210,350,4,2], ['mimic_warrior','模仿戰士','allrounder','首領親衛',2760,360,320,230,7,2],
    ['data_patroller','數據巡邏兵','controller','機械小兵',1760,210,360,155,8,1], ['antivirus_drone','防毒無人機','healer','機械小兵',1540,145,380,130,8,1], ['firewall_knight','防火牆騎士','defender','首領親衛',3700,370,230,370,4,2], ['deletion_executor','刪除執行者','attacker','首領親衛',2920,410,290,235,7,2]
  ].map(function (spec) {
    return enemy(spec[0], spec[1], 'machine', spec[2], spec[3], { health: spec[4], power: spec[5], magic: spec[6], defense: spec[7], speed: spec[8] }, 3, [
      skill('機械打擊', { kind: 'basic', multiplier: .92, range: spec[2] === 'controller' || spec[2] === 'healer' ? 4 : 1, attackStyle: spec[2] === 'controller' || spec[2] === 'healer' ? 'ranged' : 'melee' }),
      skill(spec[2] === 'healer' ? '修復脈衝' : '協議強襲', { effect: spec[2] === 'healer' ? 'heal' : 'damage', multiplier: 1.12, range: spec[2] === 'controller' || spec[2] === 'healer' ? 4 : 3, attackStyle: spec[2] === 'healer' ? 'support' : (spec[2] === 'controller' ? 'ranged' : 'melee'), cooldown: 2, status: spec[2] === 'controller' ? 'freeze' : undefined, statusTurns: spec[2] === 'controller' ? 1 : undefined })
    ], { loreElement: 'machine', size: spec[9], guard: spec[9] === 2 });
  });
  var MACHINE_BOSSES = [
    ['surge_circuit_wolf','電湧電路狼','attacker',23000,1080,880,760,10], ['incinerator_hydraulic_spider','焚燒液壓蜘蛛','controller',26000,960,1120,820,6], ['prototype_ex01','原型機體 EX-01','allrounder',30000,1120,1040,900,8], ['firewall_paladin','防火牆聖騎','defender',34000,1060,1180,1080,5]
  ].map(function (spec) { return enemy(spec[0], spec[1], 'machine', spec[2], '章節首領', { health: spec[3], power: spec[4], magic: spec[5], defense: spec[6], speed: spec[7] }, 3, [skill('首領攻擊', { kind: 'basic', multiplier: 1.02, range: 2 }), skill('核心協議', { multiplier: 1.12, range: 5, radius: 2, attackStyle: 'area', cooldown: 3, push: 2 }), skill('超載終端', { kind: 'ultimate', multiplier: 1.62, range: 5, radius: 2, attackStyle: 'area', cooldown: 5, status: 'freeze', statusTurns: 1 })], { boss: true, size: 5, loreElement: 'machine' }); });

  /* 第 16 章：重力磁場。磁場兵與探測機組成壓制網，兩名 2×2 親衛則分別
     保護核心與改變走位；首領使用拉扯與位移來呼應劇情設定。 */
  var GRAVITY_FIELD = [
    enemy('magnetic_infantry', '磁力步兵', 'machine', 'attacker', '機械小兵', { health: 2100, power: 430, magic: 260, defense: 205, speed: 7 }, 3, [
      skill('磁力射擊', { kind: 'basic', multiplier: .94, range: 4, attackStyle: 'ranged' }),
      skill('極性牽引', { multiplier: 1.08, range: 4, attackStyle: 'ranged', cooldown: 2, pull: 2 })
    ], { loreElement: 'machine' }),
    enemy('gravity_probe', '浮游探測機', 'machine', 'controller', '機械小兵', { health: 1840, power: 230, magic: 460, defense: 170, speed: 9 }, 4, [
      skill('空中掃描', { kind: 'basic', multiplier: .84, range: 5, attackStyle: 'ranged' }),
      skill('重力干擾', { multiplier: 1.0, range: 5, radius: 1, attackStyle: 'area', cooldown: 2, status: 'freeze', statusTurns: 1 })
    ], { loreElement: 'machine' }),
    enemy('gravity_warden', '重力守衛', 'machine', 'defender', '首領親衛', { health: 4650, power: 440, magic: 330, defense: 510, speed: 3 }, 2, [
      skill('重力盾擊', { kind: 'basic', multiplier: .98 }),
      skill('壓制力場', { multiplier: 1.1, range: 3, radius: 1, attackStyle: 'area', cooldown: 3, status: 'freeze', statusTurns: 1 })
    ], { loreElement: 'machine', size: 2, guard: true }),
    enemy('magnetic_storm_knight', '磁暴騎士', 'machine', 'attacker', '首領親衛', { health: 4020, power: 550, magic: 390, defense: 320, speed: 8 }, 4, [
      skill('磁暴刺擊', { kind: 'basic', multiplier: 1.0 }),
      skill('極性反轉', { multiplier: 1.18, range: 4, attackStyle: 'ranged', cooldown: 3, push: 2 })
    ], { loreElement: 'machine', size: 2, guard: true })
  ];
  var GRAVITY_BOSS = enemy('magnetic_gravity_core', '磁極重力核心', 'machine', 'controller', '章節首領', { health: 39000, power: 1260, magic: 1510, defense: 1120, speed: 6 }, 3, [
    skill('核心脈衝', { kind: 'basic', multiplier: 1.04, range: 5, attackStyle: 'ranged' }),
    skill('磁極逆轉', { multiplier: 1.18, range: 6, radius: 2, attackStyle: 'area', cooldown: 3, push: 3 }),
    skill('重力坍縮', { kind: 'ultimate', multiplier: 1.72, range: 6, radius: 3, attackStyle: 'area', cooldown: 5, pull: 4, status: 'freeze', statusTurns: 1 })
  ], { boss: true, size: 5, loreElement: 'machine', passives: [{ name: '方向參數', effect: 'def_boost', value: .18 }] });

  var NANO_FACTORY = [
    enemy('nano_worker','奈米工蜂','machine','attacker','機械小兵',{health:2450,power:490,magic:300,defense:220,speed:9},4,[skill('微型切割',{kind:'basic',multiplier:.92,range:3,attackStyle:'ranged'}),skill('自我複製',{multiplier:1.08,range:3,attackStyle:'ranged',cooldown:2})],{loreElement:'machine'}),
    enemy('repair_swarm','修復蟲群','machine','healer','機械小兵',{health:2200,power:180,magic:560,defense:190,speed:7},3,[skill('修復脈衝',{kind:'basic',multiplier:.78,range:4,attackStyle:'ranged'}),skill('群體維護',{effect:'heal',multiplier:1.05,range:4,attackStyle:'support',cooldown:2})],{loreElement:'machine'}),
    enemy('swarm_warlord','蜂群戰將','machine','attacker','首領親衛',{health:5200,power:640,magic:410,defense:360,speed:8},4,[skill('蜂群突擊',{kind:'basic',multiplier:1.02}),skill('分裂斬擊',{multiplier:1.22,cooldown:3,push:2})],{loreElement:'machine',size:2,guard:true}),
    enemy('nano_guardian','奈米禁衛','machine','defender','首領親衛',{health:5900,power:480,magic:390,defense:610,speed:3},2,[skill('禁衛槍擊',{kind:'basic',multiplier:.98}),skill('奈米護盾',{effect:'shield',value:1.0,range:3,attackStyle:'support',cooldown:3})],{loreElement:'machine',size:2,guard:true})
  ];
  var NANO_QUEEN = enemy('nano_swarm_queen','奈米蜂群女王','machine','controller','章節首領',{health:44500,power:1380,magic:1680,defense:1200,speed:7},3,[skill('蜂群刺針',{kind:'basic',multiplier:1.04,range:5,attackStyle:'ranged'}),skill('蜂群增殖',{multiplier:1.18,range:6,radius:2,attackStyle:'area',cooldown:3}),skill('奈米重構',{kind:'ultimate',multiplier:1.76,range:6,radius:3,attackStyle:'area',cooldown:5,status:'poison',statusTurns:2})],{boss:true,size:5,loreElement:'machine'});

  /* 第 18 章：全域監測塔。小兵負責標記與遠程狙擊，兩名親衛分別
     建立防線與先制壓力；ARGUS 在 70%／35% 生命時切換預測模式。 */
  var ARGUS_TOWER = [
    enemy('surveillance_orb','監視浮球','machine','controller','機械小兵',{health:2760,power:240,magic:650,defense:230,speed:10},4,[
      skill('掃描脈衝',{kind:'basic',multiplier:.86,range:5,attackStyle:'ranged'}),
      skill('弱點標記',{multiplier:1.06,range:5,attackStyle:'ranged',cooldown:2,status:'freeze',statusTurns:1})
    ],{loreElement:'machine',ai:'mark-and-retreat',resistances:['light'],weakness:'fire',soundHooks:{attack:'scan-pulse',death:'machine-collapse'},drops:{medals:3,essence:2}}),
    enemy('optical_sniper','光學狙擊兵','light','attacker','機械小兵',{health:2580,power:720,magic:410,defense:205,speed:8},3,[
      skill('精準射擊',{kind:'basic',multiplier:.98,range:6,attackStyle:'ranged'}),
      skill('弱點瞄準',{multiplier:1.28,range:7,attackStyle:'ranged',cooldown:3})
    ],{loreElement:'machine',ai:'long-range-focus',resistances:['light'],weakness:'dark',soundHooks:{attack:'rail-shot',death:'machine-collapse'},drops:{medals:3,essence:2}}),
    enemy('argus_guardian','天眼守衛','light','defender','首領親衛',{health:6900,power:560,magic:520,defense:720,speed:4},2,[
      skill('守衛重擊',{kind:'basic',multiplier:1.0}),
      skill('全域掃描',{effect:'shield',value:1.08,range:4,attackStyle:'support',cooldown:3})
    ],{loreElement:'machine',size:2,guard:true,ai:'protect-boss',resistances:['light','freeze'],weakness:'dark',soundHooks:{attack:'shield-impact',death:'heavy-collapse'},drops:{medals:6,essence:4}}),
    enemy('predictive_executor','預測執行者','machine','attacker','首領親衛',{health:6100,power:790,magic:560,defense:430,speed:11},4,[
      skill('先制刃',{kind:'basic',multiplier:1.04}),
      skill('戰術預判',{multiplier:1.3,range:4,attackStyle:'ranged',cooldown:3,push:2})
    ],{loreElement:'machine',size:2,guard:true,ai:'flank-lowest-hp',resistances:['freeze'],weakness:'fire',soundHooks:{attack:'prediction-slash',death:'heavy-collapse'},drops:{medals:6,essence:4}})
  ];
  var ARGUS_BOSS = enemy('argus_omniscient_eye','全視天眼・ARGUS','machine','controller','章節首領',{health:50000,power:1420,magic:1920,defense:1320,speed:8},3,[
    skill('監視光束',{kind:'basic',multiplier:1.05,range:6,attackStyle:'ranged'}),
    skill('未來預測',{multiplier:1.2,range:7,radius:2,attackStyle:'area',cooldown:3,status:'freeze',statusTurns:1}),
    skill('弱點鎖定',{kind:'ultimate',multiplier:1.82,range:7,radius:3,attackStyle:'area',cooldown:5,pull:3})
  ],{boss:true,size:5,loreElement:'machine',ai:'phase-prediction',resistances:['light','freeze'],weakness:'dark',soundHooks:{attack:'argus-beam',phase:'argus-alarm',death:'core-collapse'},drops:{medals:40,essence:24,fusionCore:3},passives:[{name:'全域觀測',effect:'def_boost',value:.18}],bossPhases:[
    {phase:1,name:'全域觀測',skillIndex:0,warning:'ARGUS 正在記錄所有移動路徑。'},
    {phase:2,name:'未來預測',skillIndex:1,summonCount:2,shieldRate:.07,status:'freeze',statusCount:1,warning:'預測環展開：下一輪行動路徑遭到封鎖。'},
    {phase:3,name:'弱點鎖定',skillIndex:2,summonCount:3,shieldRate:.1,teamBuff:true,warning:'全視主瞳鎖定弱點，親衛進入先制模式。'}
  ]});

  /* 第 19 章：中央能源心臟。維修兵提供續戰，反應爐守衛封鎖區域；
     首領的三階段由穩定爐心轉為紅熱暴走，最後進入倒數自毀。 */
  var NUCLEAR_HEART = [
    enemy('nuclear_technician','核能維修兵','machine','healer','機械小兵',{health:3100,power:220,magic:760,defense:260,speed:7},3,[
      skill('維修射線',{kind:'basic',multiplier:.8,range:4,attackStyle:'ranged'}),
      skill('核心充能',{effect:'heal',multiplier:1.12,range:5,attackStyle:'support',cooldown:2})
    ],{loreElement:'machine',ai:'heal-critical-core',resistances:['fire'],weakness:'ocean',soundHooks:{attack:'repair-ray',death:'machine-collapse'},drops:{medals:4,essence:3}}),
    enemy('reactor_guard','反應爐守衛','fire','controller','機械小兵',{health:3450,power:390,magic:730,defense:310,speed:6},3,[
      skill('熱能射線',{kind:'basic',multiplier:.9,range:5,attackStyle:'ranged',status:'burn',statusTurns:2}),
      skill('高熱爆炸',{multiplier:1.16,range:5,radius:1,attackStyle:'area',cooldown:3,status:'burn',statusTurns:3})
    ],{loreElement:'machine',ai:'area-denial',resistances:['fire','burn'],weakness:'ocean',soundHooks:{attack:'thermal-ray',death:'reactor-pop'},drops:{medals:4,essence:3}}),
    enemy('nuclear_heavy','核能重裝兵','fire','defender','首領親衛',{health:7800,power:720,magic:610,defense:820,speed:3},2,[
      skill('核能砲',{kind:'basic',multiplier:1.0,range:5,attackStyle:'ranged'}),
      skill('裝甲強化',{effect:'shield',value:1.18,range:3,attackStyle:'support',cooldown:3})
    ],{loreElement:'machine',size:2,guard:true,ai:'protect-reactor',resistances:['fire','burn'],weakness:'ocean',soundHooks:{attack:'nuclear-cannon',death:'heavy-collapse'},drops:{medals:7,essence:5}}),
    enemy('overload_berserker','過載狂戰機','machine','attacker','首領親衛',{health:6800,power:910,magic:540,defense:470,speed:10},4,[
      skill('狂暴鋸刃',{kind:'basic',multiplier:1.06}),
      skill('自爆核心',{multiplier:1.38,range:3,radius:1,attackStyle:'area',cooldown:4,status:'burn',statusTurns:2})
    ],{loreElement:'machine',size:2,guard:true,ai:'rush-lowest-hp',resistances:['burn'],weakness:'ocean',soundHooks:{attack:'berserk-blade',death:'overload-blast'},drops:{medals:7,essence:5}})
  ];
  var NUCLEAR_BOSS = enemy('overload_nuclear_golem','過載核能傀儡','fire','attacker','章節首領',{health:57000,power:1850,magic:1510,defense:1450,speed:5},3,[
    skill('核能重拳',{kind:'basic',multiplier:1.08,range:2,radius:1,attackStyle:'area'}),
    skill('爐心震爆',{multiplier:1.28,range:6,radius:2,attackStyle:'area',cooldown:3,status:'burn',statusTurns:2}),
    skill('終極過載',{kind:'ultimate',multiplier:1.92,range:6,radius:3,attackStyle:'area',cooldown:5,push:3,status:'burn',statusTurns:3})
  ],{boss:true,size:5,loreElement:'machine',ai:'low-hp-berserk',resistances:['fire','burn'],weakness:'ocean',soundHooks:{attack:'nuclear-impact',phase:'reactor-alarm',death:'core-meltdown'},drops:{medals:46,essence:28,fusionCore:4},passives:[{name:'過載爐心',effect:'atk_boost',value:.2}],bossPhases:[
    {phase:1,name:'穩定爐心',skillIndex:0,warning:'反應爐仍在穩定輸出，先切斷維修線。'},
    {phase:2,name:'紅熱臨界',skillIndex:1,summonCount:2,shieldRate:.05,teamBuff:true,warning:'爐心升至臨界溫度，地表開始燃燒。'},
    {phase:3,name:'毀滅倒數',skillIndex:2,summonCount:3,shieldRate:.08,status:'burn',statusCount:3,riftPower:.12,warning:'終極過載啟動：必須在全場熔毀前擊破傀儡。'}
  ]});

  /* 第 20 章：機械神明祭壇。兩種量產機提供同步射擊與能源支援，
     親衛負責絕對防禦與封鎖；Ω-00 依序啟動秩序、數據化與終焉協議。 */
  var OMEGA_ALTAR = [
    enemy('omega_trooper','Ω量產兵','machine','attacker','機械小兵',{health:3600,power:780,magic:470,defense:320,speed:8},3,[
      skill('制式射擊',{kind:'basic',multiplier:.96,range:5,attackStyle:'ranged'}),
      skill('同步作戰',{effect:'buff_atk',range:4,attackStyle:'support',cooldown:3})
    ],{loreElement:'machine',ai:'synchronized-fire',resistances:['light'],weakness:'dark',soundHooks:{attack:'omega-rifle',death:'data-shatter'},drops:{medals:5,essence:3}}),
    enemy('central_core_unit','中央核心機','machine','healer','機械小兵',{health:3300,power:200,magic:900,defense:300,speed:7},4,[
      skill('資料脈衝',{kind:'basic',multiplier:.82,range:5,attackStyle:'ranged'}),
      skill('能源同步',{effect:'heal_all',multiplier:.72,range:5,radius:2,attackStyle:'support',cooldown:3})
    ],{loreElement:'machine',ai:'support-omega-network',resistances:['light','freeze'],weakness:'dark',soundHooks:{attack:'data-pulse',death:'data-shatter'},drops:{medals:5,essence:3}}),
    enemy('omega_guard','Ω近衛兵','machine','defender','首領親衛',{health:8800,power:820,magic:620,defense:940,speed:5},3,[
      skill('Ω斬擊',{kind:'basic',multiplier:1.04}),
      skill('絕對防禦',{effect:'shield',value:1.3,range:4,attackStyle:'support',cooldown:3})
    ],{loreElement:'machine',size:2,guard:true,ai:'absolute-guard',resistances:['light','freeze'],weakness:'dark',soundHooks:{attack:'omega-slash',death:'heavy-data-collapse'},drops:{medals:8,essence:6}}),
    enemy('terminal_adjudicator','終端裁決者','machine','controller','首領親衛',{health:7600,power:560,magic:1060,defense:590,speed:9},4,[
      skill('裁決光束',{kind:'basic',multiplier:1.0,range:6,attackStyle:'ranged'}),
      skill('系統封鎖',{multiplier:1.22,range:7,radius:2,attackStyle:'area',cooldown:3,status:'freeze',statusTurns:1})
    ],{loreElement:'machine',size:2,guard:true,ai:'lock-highest-power',resistances:['dark','freeze'],weakness:'fire',soundHooks:{attack:'judgment-beam',death:'heavy-data-collapse'},drops:{medals:8,essence:6}})
  ];
  var OMEGA_BOSS = enemy('omega_00','秩序執行官 Ω-00','machine','allrounder','篇章最終首領',{health:72000,power:2050,magic:2250,defense:1720,speed:9},4,[
    skill('秩序裁斷',{kind:'basic',multiplier:1.08,range:5,attackStyle:'ranged'}),
    skill('生命數據化',{multiplier:1.3,range:7,radius:2,attackStyle:'area',cooldown:3,status:'freeze',statusTurns:1}),
    skill('Ω終焉協議',{kind:'ultimate',multiplier:2.02,range:8,radius:3,attackStyle:'area',cooldown:5,pull:4})
  ],{boss:true,size:5,loreElement:'machine',ai:'omega-absolute-order',resistances:['light','dark','freeze'],weakness:'fire',soundHooks:{attack:'omega-judgment',phase:'omega-protocol',death:'omega-collapse'},drops:{medals:60,essence:36,fusionCore:5},passives:[{name:'絕對秩序',effect:'all_boost',value:.22}],bossPhases:[
    {phase:1,name:'秩序演算',skillIndex:0,warning:'Ω-00 正在建立絕對秩序模型。'},
    {phase:2,name:'生命數據化',skillIndex:1,summonCount:2,shieldRate:.08,status:'freeze',statusCount:2,warning:'數據化封鎖啟動：被鎖定的生命將失去行動。'},
    {phase:3,name:'Ω終焉協議',skillIndex:2,summonCount:3,shieldRate:.12,teamBuff:true,riftPower:.16,warning:'全場機械同步強化，終焉協議開始覆寫世界。'}
  ]});

  global.TACTICAL_ENEMY_DATA = MINIONS.concat(BOSSES, SKELETONS, MACHINE_ARC, MACHINE_BOSSES, GRAVITY_FIELD, [GRAVITY_BOSS], NANO_FACTORY, [NANO_QUEEN], ARGUS_TOWER, [ARGUS_BOSS], NUCLEAR_HEART, [NUCLEAR_BOSS], OMEGA_ALTAR, [OMEGA_BOSS]);
}(typeof window !== 'undefined' ? window : globalThis));
