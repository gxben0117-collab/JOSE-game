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
    var hue = { fire: 16, forest: 110, ocean: 210, light: 46, dark: 275 }[element] || 275;
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
    enemy('void_devourer', '虛空吞噬者', 'dark', 'allrounder', '終局首領', { health: 4700, power: 540, magic: 500, defense: 330, speed: 7 }, 3, [
      skill('吞噬之口', { kind: 'basic', multiplier: 0.95 }),
      skill('虛空亂流', { kind: 'active', multiplier: 1.0, range: 4, radius: 2, attackStyle: 'area', cooldown: 3, status: 'poison', statusTurns: 2 }),
      skill('奇點湮滅', { kind: 'ultimate', multiplier: 1.4, range: 5, attackStyle: 'ranged', cooldown: 4, pull: 4, status: 'freeze', statusTurns: 1 })
    ], { boss: true, size: 3 })
  ];

  global.TACTICAL_ENEMY_DATA = MINIONS.concat(BOSSES);
}(typeof window !== 'undefined' ? window : globalThis));
