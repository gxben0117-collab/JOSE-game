var QUALITY_CONFIG = {
  normal:    { label: '普通', color: '#aaaaaa', statMult: 1.0 },
  rare:      { label: '稀有', color: '#00cc66', statMult: 1.5 },
  elite:     { label: '菁英', color: '#4488ff', statMult: 2.2 },
  epic:      { label: '史詩', color: '#aa44ff', statMult: 3.0 },
  legendary: { label: '傳說', color: '#ff8800', statMult: 4.5 },
  mythical:  { label: '神話', color: '#ff2244', statMult: 7.0 }
};

var ELEMENT_CONFIG = {
  fire:   { label: '火',   icon: '🔥', color: '#ff4422', strong: 'forest', weak: 'ocean'  },
  forest: { label: '森林', icon: '🌿', color: '#22aa44', strong: 'ocean',  weak: 'fire'   },
  ocean:  { label: '海洋', icon: '💧', color: '#2266ff', strong: 'fire',   weak: 'forest' }
};

var PET_DATA = [
  // ===== 火系 (Fire) =====
  {
    id: 'molten_ball', name: '熔球獸', element: 'fire', quality: 'normal', icon: '🔥',
    baseHp: 480, baseAtk: 85, baseDef: 45,
    skills: [
      { name: '火球', type: 'basic',   effect: 'damage',     multiplier: 1.0 },
      { name: '爆炎', type: 'active',  effect: 'damage_all', multiplier: 0.6, cooldown: 3 },
      { name: '灼熱', type: 'passive', effect: 'burn',       chance: 0.15, value: 0.05 },
      { name: '火焰反擊', type: 'active', effect: 'damage', multiplier: 1.5, cooldown: 2 }
    ]
  },
  {
    id: 'fire_lion', name: '炎獅', element: 'fire', quality: 'normal', icon: '🦁',
    baseHp: 540, baseAtk: 75, baseDef: 65,
    skills: [
      { name: '獅爪',   type: 'basic',   effect: 'damage',    multiplier: 1.0 },
      { name: '怒吼',   type: 'active',  effect: 'buff_atk',  value: 0.3, cooldown: 4 },
      { name: '鬃毛防護', type: 'passive', effect: 'def_boost', value: 0.1 },
      { name: '撕咬', type: 'active', effect: 'damage', multiplier: 1.8, cooldown: 2 }
    ]
  },
  {
    id: 'fire_fox', name: '火狐', element: 'fire', quality: 'rare', icon: '🦊',
    baseHp: 600, baseAtk: 125, baseDef: 55,
    skills: [
      { name: '鬼火',   type: 'basic',   effect: 'damage', multiplier: 1.1 },
      { name: '九尾亂舞', type: 'active', effect: 'damage', multiplier: 2.5, cooldown: 4 },
      { name: '靈敏',   type: 'passive', effect: 'atk_boost', value: 0.12 },
      { name: '猛攻', type: 'active', effect: 'damage', multiplier: 2.0, cooldown: 3 }
    ]
  },
  {
    id: 'red_wing_bird', name: '赤羽鳥', element: 'fire', quality: 'rare', icon: '🦅',
    baseHp: 560, baseAtk: 135, baseDef: 40,
    skills: [
      { name: '翼斬',   type: 'basic',  effect: 'damage', multiplier: 1.2 },
      { name: '俯衝轟炸', type: 'active', effect: 'damage', multiplier: 3.0, cooldown: 5 },
      { name: '空中霸主', type: 'passive', effect: 'atk_boost', value: 0.12 },
      { name: '疾風斬', type: 'active', effect: 'damage', multiplier: 2.2, cooldown: 3 }
    ]
  },
  {
    id: 'lava_crab', name: '熔岩蟹', element: 'fire', quality: 'rare', icon: '🦀',
    baseHp: 740, baseAtk: 95, baseDef: 105,
    skills: [
      { name: '蟹鉗',   type: 'basic',  effect: 'damage',  multiplier: 1.0 },
      { name: '熔岩護盾', type: 'active', effect: 'shield',  value: 0.3, cooldown: 5 },
      { name: '硬殼',   type: 'passive', effect: 'def_boost', value: 0.2 },
      { name: '重擊', type: 'active', effect: 'damage', multiplier: 2.0, cooldown: 3 }
    ]
  },
  {
    id: 'flame_spirit', name: '炎靈獸', element: 'fire', quality: 'elite', icon: '✨',
    baseHp: 900, baseAtk: 200, baseDef: 120,
    skills: [
      { name: '靈焰',   type: 'basic',  effect: 'damage',     multiplier: 1.3 },
      { name: '鳳凰之火', type: 'active', effect: 'damage_all', multiplier: 1.2, cooldown: 4 },
      { name: '靈魂連結', type: 'passive', effect: 'atk_boost', value: 0.15 },
      { name: '致命一擊', type: 'active', effect: 'damage', multiplier: 2.5, cooldown: 3 }
    ]
  },
  {
    id: 'blazing_dragon', name: '烈焰龍', element: 'fire', quality: 'elite', icon: '🐉',
    baseHp: 1100, baseAtk: 245, baseDef: 100,
    skills: [
      { name: '龍息',  type: 'basic',  effect: 'damage',     multiplier: 1.4 },
      { name: '業火',  type: 'active', effect: 'damage_all', multiplier: 1.5, cooldown: 5 },
      { name: '龍之傲', type: 'passive', effect: 'atk_boost', value: 0.2 },
      { name: '龍爪撕裂', type: 'active', effect: 'damage', multiplier: 2.8, cooldown: 3 }
    ]
  },
  {
    id: 'flame_god_lion', name: '焰神獅', element: 'fire', quality: 'epic', icon: '🔱',
    baseHp: 2000, baseAtk: 460, baseDef: 280,
    skills: [
      { name: '神擊',  type: 'basic',  effect: 'damage',     multiplier: 1.5 },
      { name: '神焰',  type: 'active', effect: 'damage_all', multiplier: 2.0, cooldown: 4 },
      { name: '神之氣息', type: 'passive', effect: 'all_boost', value: 0.15 },
      { name: '終結技', type: 'active', effect: 'damage', multiplier: 3.0, cooldown: 4 }
    ]
  },
  {
    id: 'crimson_dragon', name: '赤炎神龍', element: 'fire', quality: 'legendary', icon: '🌋',
    baseHp: 4500, baseAtk: 910, baseDef: 510,
    skills: [
      { name: '傳說咬擊', type: 'basic',  effect: 'damage',     multiplier: 1.8 },
      { name: '世界之炎', type: 'active', effect: 'damage_all', multiplier: 3.0, cooldown: 5 },
      { name: '龍皇之威', type: 'passive', effect: 'atk_boost', value: 0.3 },
      { name: '屠殺', type: 'active', effect: 'damage', multiplier: 3.5, cooldown: 4 }
    ]
  },
  {
    id: 'flame_emperor', name: '炎帝獸', element: 'fire', quality: 'mythical', icon: '☀️',
    baseHp: 9000, baseAtk: 1800, baseDef: 900,
    skills: [
      { name: '帝王之擊', type: 'basic',  effect: 'damage',     multiplier: 2.0 },
      { name: '太陽風暴', type: 'active', effect: 'damage_all', multiplier: 4.0, cooldown: 5 },
      { name: '帝王氣息', type: 'passive', effect: 'all_boost', value: 0.25 },
      { name: '神罰', type: 'active', effect: 'damage', multiplier: 4.0, cooldown: 5 }
    ]
  },

  // ===== 森林系 (Forest) =====
  {
    id: 'leaf_ear_rabbit', name: '葉耳兔', element: 'forest', quality: 'normal', icon: '🐰',
    baseHp: 460, baseAtk: 70, baseDef: 55,
    skills: [
      { name: '葉片投擲', type: 'basic',  effect: 'damage', multiplier: 1.0 },
      { name: '草藥治療', type: 'active', effect: 'heal',   value: 0.25, cooldown: 4 },
      { name: '森林之心', type: 'passive', effect: 'hp_boost', value: 0.1 },
      { name: '反擊', type: 'active', effect: 'damage', multiplier: 1.5, cooldown: 3 }
    ]
  },
  {
    id: 'grass_bear', name: '草熊', element: 'forest', quality: 'normal', icon: '🐻',
    baseHp: 660, baseAtk: 80, baseDef: 75,
    skills: [
      { name: '熊掌',   type: 'basic',  effect: 'damage',     multiplier: 1.0 },
      { name: '大地震擊', type: 'active', effect: 'damage_all', multiplier: 0.7, cooldown: 4 },
      { name: '厚毛',   type: 'passive', effect: 'def_boost', value: 0.15 },
      { name: '重擊', type: 'active', effect: 'damage', multiplier: 1.8, cooldown: 3 }
    ]
  },
  {
    id: 'vine_snake', name: '藤蛇', element: 'forest', quality: 'rare', icon: '🐍',
    baseHp: 585, baseAtk: 145, baseDef: 60,
    skills: [
      { name: '藤鞭',  type: 'basic',  effect: 'damage', multiplier: 1.1 },
      { name: '毒牙',  type: 'active', effect: 'damage', multiplier: 2.2, cooldown: 3 },
      { name: '毒氣',  type: 'passive', effect: 'atk_boost', value: 0.1 },
      { name: '猛攻', type: 'active', effect: 'damage', multiplier: 2.0, cooldown: 3 }
    ]
  },
  {
    id: 'emerald_bird', name: '翠羽鳥', element: 'forest', quality: 'rare', icon: '🦜',
    baseHp: 565, baseAtk: 130, baseDef: 50,
    skills: [
      { name: '羽毛風暴', type: 'basic',  effect: 'damage',    multiplier: 1.2 },
      { name: '翠羽舞',  type: 'active', effect: 'buff_atk',  value: 0.2, cooldown: 4 },
      { name: '疾翼',   type: 'passive', effect: 'atk_boost', value: 0.12 },
      { name: '迅襲', type: 'active', effect: 'damage', multiplier: 2.3, cooldown: 3 }
    ]
  },
  {
    id: 'moss_turtle', name: '苔蘚龜', element: 'forest', quality: 'rare', icon: '🐢',
    baseHp: 920, baseAtk: 70, baseDef: 155,
    skills: [
      { name: '龜殼衝撞', type: 'basic',  effect: 'damage',  multiplier: 0.8 },
      { name: '自然護盾', type: 'active', effect: 'shield',  value: 0.2, cooldown: 5 },
      { name: '遠古龜殼', type: 'passive', effect: 'def_boost', value: 0.25 },
      { name: '堅守', type: 'active', effect: 'heal', value: 0.2, cooldown: 4 }
    ]
  },
  {
    id: 'forest_deer', name: '森靈鹿', element: 'forest', quality: 'elite', icon: '🦌',
    baseHp: 960, baseAtk: 195, baseDef: 130,
    skills: [
      { name: '鹿角衝擊', type: 'basic',  effect: 'damage',   multiplier: 1.3 },
      { name: '森林祝福', type: 'active', effect: 'heal',     value: 0.2, cooldown: 4 },
      { name: '自然連結', type: 'passive', effect: 'hp_boost', value: 0.15 },
      { name: '神速突擊', type: 'active', effect: 'damage', multiplier: 2.8, cooldown: 4 }
    ]
  },
  {
    id: 'emerald_dragon', name: '翠龍', element: 'forest', quality: 'elite', icon: '🐲',
    baseHp: 1200, baseAtk: 235, baseDef: 115,
    skills: [
      { name: '翠息',   type: 'basic',  effect: 'damage',  multiplier: 1.4 },
      { name: '藤蔓束縛', type: 'active', effect: 'damage', multiplier: 2.0, cooldown: 5 },
      { name: '翠龍鱗', type: 'passive', effect: 'def_boost', value: 0.18 },
      { name: '龍之怒吼', type: 'active', effect: 'damage_all', multiplier: 1.5, cooldown: 5 }
    ]
  },
  {
    id: 'forest_king', name: '森王獸', element: 'forest', quality: 'epic', icon: '🌿',
    baseHp: 2200, baseAtk: 430, baseDef: 305,
    skills: [
      { name: '王者之擊', type: 'basic',  effect: 'damage',     multiplier: 1.5 },
      { name: '森林之怒', type: 'active', effect: 'damage_all', multiplier: 2.0, cooldown: 4 },
      { name: '森王氣息', type: 'passive', effect: 'hp_boost', value: 0.2 },
      { name: '自然重生', type: 'active', effect: 'heal_all', value: 0.25, cooldown: 5 }
    ]
  },
  {
    id: 'emerald_god_dragon', name: '翠神龍', element: 'forest', quality: 'legendary', icon: '🌳',
    baseHp: 5000, baseAtk: 860, baseDef: 555,
    skills: [
      { name: '傳說龍牙', type: 'basic',  effect: 'damage',   multiplier: 1.8 },
      { name: '世界樹之力', type: 'active', effect: 'heal',   value: 0.3, cooldown: 5 },
      { name: '遠古之力', type: 'passive', effect: 'all_boost', value: 0.28 },
      { name: '神龍天滅', type: 'active', effect: 'damage_all', multiplier: 3.5, cooldown: 5 }
    ]
  },
  {
    id: 'forest_god', name: '林神獸', element: 'forest', quality: 'mythical', icon: '🌲',
    baseHp: 9500, baseAtk: 1710, baseDef: 960,
    skills: [
      { name: '神之牙',  type: 'basic',  effect: 'damage',     multiplier: 2.0 },
      { name: '自然之怒', type: 'active', effect: 'damage_all', multiplier: 4.0, cooldown: 5 },
      { name: '神之林',  type: 'passive', effect: 'all_boost', value: 0.22 },
      { name: '創世森林', type: 'active', effect: 'heal_all', value: 0.5, cooldown: 6 }
    ]
  },

  // ===== 海洋系 (Ocean) =====
  {
    id: 'bubble_whale', name: '泡泡鯨', element: 'ocean', quality: 'normal', icon: '🐋',
    baseHp: 620, baseAtk: 65, baseDef: 60,
    skills: [
      { name: '水花',   type: 'basic',  effect: 'damage', multiplier: 1.0 },
      { name: '泡泡護盾', type: 'active', effect: 'shield', value: 0.2, cooldown: 4 },
      { name: '海洋之心', type: 'passive', effect: 'hp_boost', value: 0.12 },
      { name: '水柱衝擊', type: 'active', effect: 'damage', multiplier: 1.6, cooldown: 3 }
    ]
  },
  {
    id: 'coral_fish', name: '珊瑚魚', element: 'ocean', quality: 'normal', icon: '🐠',
    baseHp: 420, baseAtk: 95, baseDef: 38,
    skills: [
      { name: '魚鰭斬', type: 'basic',  effect: 'damage', multiplier: 1.1 },
      { name: '魚群衝鋒', type: 'active', effect: 'damage', multiplier: 2.5, cooldown: 4 },
      { name: '滑溜',  type: 'passive', effect: 'atk_boost', value: 0.1 },
      { name: '連擊', type: 'active', effect: 'damage', multiplier: 1.8, cooldown: 3 }
    ]
  },
  {
    id: 'starfish_beast', name: '海星獸', element: 'ocean', quality: 'rare', icon: '⭐',
    baseHp: 660, baseAtk: 115, baseDef: 82,
    skills: [
      { name: '星光射線', type: 'basic',  effect: 'damage', multiplier: 1.1 },
      { name: '再生',   type: 'active', effect: 'heal',   value: 0.3, cooldown: 4 },
      { name: '星力',   type: 'passive', effect: 'hp_boost', value: 0.1 },
      { name: '星爆', type: 'active', effect: 'damage', multiplier: 2.0, cooldown: 3 }
    ]
  },
  {
    id: 'ice_shark', name: '冰鯊', element: 'ocean', quality: 'rare', icon: '🦈',
    baseHp: 710, baseAtk: 155, baseDef: 65,
    skills: [
      { name: '鯊齒咬擊', type: 'basic',  effect: 'damage', multiplier: 1.3 },
      { name: '冰暴衝擊', type: 'active', effect: 'damage', multiplier: 2.8, cooldown: 4 },
      { name: '掠食者',  type: 'passive', effect: 'atk_boost', value: 0.15 },
      { name: '冰封突襲', type: 'active', effect: 'damage', multiplier: 2.4, cooldown: 3 }
    ]
  },
  {
    id: 'deep_sea_crab', name: '深海螃蟹', element: 'ocean', quality: 'rare', icon: '🦞',
    baseHp: 820, baseAtk: 100, baseDef: 135,
    skills: [
      { name: '鉗擊',   type: 'basic',  effect: 'damage',  multiplier: 1.0 },
      { name: '水牆',   type: 'active', effect: 'shield',  value: 0.25, cooldown: 5 },
      { name: '深海鎧甲', type: 'passive', effect: 'def_boost', value: 0.22 },
      { name: '巨鉗粉碎', type: 'active', effect: 'damage', multiplier: 2.0, cooldown: 4 }
    ]
  },
  {
    id: 'ice_spirit_fish', name: '冰靈魚', element: 'ocean', quality: 'elite', icon: '❄️',
    baseHp: 990, baseAtk: 215, baseDef: 122,
    skills: [
      { name: '冰矛',   type: 'basic',  effect: 'damage',     multiplier: 1.3 },
      { name: '暴風雪', type: 'active', effect: 'damage_all', multiplier: 1.3, cooldown: 4 },
      { name: '冰晶氣場', type: 'passive', effect: 'atk_boost', value: 0.15 },
      { name: '極凍爆破', type: 'active', effect: 'damage', multiplier: 3.0, cooldown: 4 }
    ]
  },
  {
    id: 'abyss_dragon', name: '深淵龍', element: 'ocean', quality: 'elite', icon: '🌊',
    baseHp: 1320, baseAtk: 255, baseDef: 118,
    skills: [
      { name: '深淵咬擊', type: 'basic',  effect: 'damage',     multiplier: 1.4 },
      { name: '海嘯',   type: 'active', effect: 'damage_all', multiplier: 1.6, cooldown: 5 },
      { name: '深淵之力', type: 'passive', effect: 'atk_boost', value: 0.18 },
      { name: '龍捲水柱', type: 'active', effect: 'damage', multiplier: 2.8, cooldown: 4 }
    ]
  },
  {
    id: 'sea_god_beast', name: '海神獸', element: 'ocean', quality: 'epic', icon: '🔱',
    baseHp: 2400, baseAtk: 440, baseDef: 295,
    skills: [
      { name: '三叉戟', type: 'basic',  effect: 'damage',     multiplier: 1.5 },
      { name: '海洋之怒', type: 'active', effect: 'damage_all', multiplier: 2.2, cooldown: 4 },
      { name: '海神氣息', type: 'passive', effect: 'all_boost', value: 0.15 },
      { name: '海嘯沖擊', type: 'active', effect: 'damage_all', multiplier: 2.5, cooldown: 5 }
    ]
  },
  {
    id: 'abyss_god_dragon', name: '深淵神龍', element: 'ocean', quality: 'legendary', icon: '🌀',
    baseHp: 5500, baseAtk: 930, baseDef: 565,
    skills: [
      { name: '傳說龍顎', type: 'basic',  effect: 'damage',     multiplier: 1.8 },
      { name: '虛空海潮', type: 'active', effect: 'damage_all', multiplier: 3.2, cooldown: 5 },
      { name: '深淵意志', type: 'passive', effect: 'all_boost', value: 0.3 },
      { name: '滅世洪流', type: 'active', effect: 'damage_all', multiplier: 3.5, cooldown: 5 }
    ]
  },
  {
    id: 'sea_emperor', name: '海帝獸', element: 'ocean', quality: 'mythical', icon: '💠',
    baseHp: 10000, baseAtk: 1900, baseDef: 1000,
    skills: [
      { name: '帝王浪潮', type: 'basic',  effect: 'damage',     multiplier: 2.0 },
      { name: '末日海潮', type: 'active', effect: 'damage_all', multiplier: 4.5, cooldown: 5 },
      { name: '帝王之海', type: 'passive', effect: 'all_boost', value: 0.23 },
      { name: '創世大洪水', type: 'active', effect: 'damage_all', multiplier: 5.0, cooldown: 6 }
    ]
  },

  // ===== 新增火系寵物 =====
  {
    id: 'magma_hound', name: '熔岩獵犬', element: 'fire', quality: 'rare', icon: '🐕',
    baseHp: 620, baseAtk: 140, baseDef: 50,
    skills: [
      { name: '烈焰咬', type: 'basic', effect: 'damage', multiplier: 1.2 },
      { name: '灼燒追擊', type: 'active', effect: 'damage', multiplier: 2.4, cooldown: 3 },
      { name: '野性本能', type: 'passive', effect: 'atk_boost', value: 0.13 },
      { name: '火焰爪擊', type: 'active', effect: 'damage', multiplier: 2.0, cooldown: 2 }
    ]
  },
  {
    id: 'inferno_bat', name: '地獄火蝠', element: 'fire', quality: 'elite', icon: '🦇',
    baseHp: 850, baseAtk: 210, baseDef: 95,
    skills: [
      { name: '火焰音波', type: 'basic', effect: 'damage', multiplier: 1.3 },
      { name: '煉獄風暴', type: 'active', effect: 'damage_all', multiplier: 1.4, cooldown: 4 },
      { name: '燃燒氣息', type: 'passive', effect: 'atk_boost', value: 0.17 },
      { name: '俯衝焚擊', type: 'active', effect: 'damage', multiplier: 2.6, cooldown: 3 }
    ]
  },
  {
    id: 'volcanic_titan', name: '火山巨神', element: 'fire', quality: 'epic', icon: '🌋',
    baseHp: 2100, baseAtk: 470, baseDef: 290,
    skills: [
      { name: '巨岩拳', type: 'basic', effect: 'damage', multiplier: 1.5 },
      { name: '火山爆發', type: 'active', effect: 'damage_all', multiplier: 2.1, cooldown: 4 },
      { name: '熔岩護體', type: 'passive', effect: 'all_boost', value: 0.16 },
      { name: '巨神之怒', type: 'active', effect: 'damage', multiplier: 3.2, cooldown: 4 }
    ]
  },
  {
    id: 'sun_phoenix', name: '烈陽鳳凰', element: 'fire', quality: 'legendary', icon: '🦅',
    baseHp: 4600, baseAtk: 920, baseDef: 520,
    skills: [
      { name: '鳳凰羽擊', type: 'basic', effect: 'damage', multiplier: 1.8 },
      { name: '涅槃之火', type: 'active', effect: 'heal', value: 0.35, cooldown: 5 },
      { name: '不死之身', type: 'passive', effect: 'hp_boost', value: 0.25 },
      { name: '烈陽天降', type: 'active', effect: 'damage_all', multiplier: 3.3, cooldown: 5 }
    ]
  },
  {
    id: 'crimson_wolf', name: '赤炎狼王', element: 'fire', quality: 'elite', icon: '🐺',
    baseHp: 1050, baseAtk: 240, baseDef: 110,
    skills: [
      { name: '狼牙', type: 'basic', effect: 'damage', multiplier: 1.4 },
      { name: '狼群之怒', type: 'active', effect: 'damage', multiplier: 2.7, cooldown: 4 },
      { name: '狼王威壓', type: 'passive', effect: 'atk_boost', value: 0.19 },
      { name: '火焰衝鋒', type: 'active', effect: 'damage', multiplier: 2.3, cooldown: 3 }
    ]
  },

  // ===== 新增森林系寵物 =====
  {
    id: 'thorn_boar', name: '荊棘野豬', element: 'forest', quality: 'rare', icon: '🐗',
    baseHp: 680, baseAtk: 120, baseDef: 90,
    skills: [
      { name: '尖刺衝撞', type: 'basic', effect: 'damage', multiplier: 1.1 },
      { name: '荊棘反擊', type: 'active', effect: 'damage', multiplier: 2.1, cooldown: 3 },
      { name: '厚皮', type: 'passive', effect: 'def_boost', value: 0.18 },
      { name: '狂暴突進', type: 'active', effect: 'damage', multiplier: 1.9, cooldown: 3 }
    ]
  },
  {
    id: 'nature_guardian', name: '自然守護者', element: 'forest', quality: 'elite', icon: '🧙',
    baseHp: 1000, baseAtk: 200, baseDef: 140,
    skills: [
      { name: '自然之杖', type: 'basic', effect: 'damage', multiplier: 1.3 },
      { name: '生命綻放', type: 'active', effect: 'heal_all', value: 0.2, cooldown: 5 },
      { name: '自然祝福', type: 'passive', effect: 'hp_boost', value: 0.17 },
      { name: '藤蔓絞殺', type: 'active', effect: 'damage', multiplier: 2.5, cooldown: 4 }
    ]
  },
  {
    id: 'ancient_treant', name: '遠古樹人', element: 'forest', quality: 'epic', icon: '🌳',
    baseHp: 2500, baseAtk: 410, baseDef: 330,
    skills: [
      { name: '樹根重擊', type: 'basic', effect: 'damage', multiplier: 1.5 },
      { name: '森林復甦', type: 'active', effect: 'heal', value: 0.3, cooldown: 5 },
      { name: '遠古之力', type: 'passive', effect: 'all_boost', value: 0.14 },
      { name: '自然之怒', type: 'active', effect: 'damage_all', multiplier: 2.0, cooldown: 4 }
    ]
  },
  {
    id: 'jade_qilin', name: '翠玉麒麟', element: 'forest', quality: 'legendary', icon: '🦌',
    baseHp: 5200, baseAtk: 880, baseDef: 590,
    skills: [
      { name: '聖獸之角', type: 'basic', effect: 'damage', multiplier: 1.8 },
      { name: '翠玉光環', type: 'active', effect: 'heal_all', value: 0.25, cooldown: 5 },
      { name: '麒麟之靈', type: 'passive', effect: 'all_boost', value: 0.27 },
      { name: '神獸天罰', type: 'active', effect: 'damage_all', multiplier: 3.4, cooldown: 5 }
    ]
  },
  {
    id: 'poison_mantis', name: '毒刃螳螂', element: 'forest', quality: 'rare', icon: '🦗',
    baseHp: 550, baseAtk: 160, baseDef: 45,
    skills: [
      { name: '鐮刀斬', type: 'basic', effect: 'damage', multiplier: 1.2 },
      { name: '毒刃連擊', type: 'active', effect: 'damage', multiplier: 2.5, cooldown: 3 },
      { name: '致命毒素', type: 'passive', effect: 'atk_boost', value: 0.14 },
      { name: '影刺', type: 'active', effect: 'damage', multiplier: 2.2, cooldown: 3 }
    ]
  },

  // ===== 新增海洋系寵物 =====
  {
    id: 'electric_eel', name: '雷電鰻', element: 'ocean', quality: 'rare', icon: '⚡',
    baseHp: 600, baseAtk: 135, baseDef: 60,
    skills: [
      { name: '電擊', type: 'basic', effect: 'damage', multiplier: 1.2 },
      { name: '閃電鏈', type: 'active', effect: 'damage_all', multiplier: 1.0, cooldown: 4 },
      { name: '高壓電流', type: 'passive', effect: 'atk_boost', value: 0.12 },
      { name: '雷霆一擊', type: 'active', effect: 'damage', multiplier: 2.3, cooldown: 3 }
    ]
  },
  {
    id: 'kraken_spawn', name: '深海巨妖', element: 'ocean', quality: 'elite', icon: '🐙',
    baseHp: 1100, baseAtk: 225, baseDef: 125,
    skills: [
      { name: '觸手鞭打', type: 'basic', effect: 'damage', multiplier: 1.4 },
      { name: '漩渦絞殺', type: 'active', effect: 'damage', multiplier: 2.6, cooldown: 4 },
      { name: '深海之力', type: 'passive', effect: 'atk_boost', value: 0.16 },
      { name: '觸手風暴', type: 'active', effect: 'damage_all', multiplier: 1.5, cooldown: 5 }
    ]
  },
  {
    id: 'frost_leviathan', name: '寒冰利維坦', element: 'ocean', quality: 'epic', icon: '🐋',
    baseHp: 2600, baseAtk: 450, baseDef: 310,
    skills: [
      { name: '寒冰重擊', type: 'basic', effect: 'damage', multiplier: 1.5 },
      { name: '極寒風暴', type: 'active', effect: 'damage_all', multiplier: 2.2, cooldown: 4 },
      { name: '冰霜鎧甲', type: 'passive', effect: 'def_boost', value: 0.2 },
      { name: '冰封吐息', type: 'active', effect: 'damage_all', multiplier: 2.4, cooldown: 5 }
    ]
  },
  {
    id: 'tsunami_dragon', name: '海嘯神龍', element: 'ocean', quality: 'legendary', icon: '🌊',
    baseHp: 5300, baseAtk: 940, baseDef: 570,
    skills: [
      { name: '龍顎碎擊', type: 'basic', effect: 'damage', multiplier: 1.8 },
      { name: '萬丈狂瀾', type: 'active', effect: 'damage_all', multiplier: 3.3, cooldown: 5 },
      { name: '海洋霸主', type: 'passive', effect: 'all_boost', value: 0.29 },
      { name: '滅世海嘯', type: 'active', effect: 'damage_all', multiplier: 3.6, cooldown: 5 }
    ]
  },
  {
    id: 'crystal_jellyfish', name: '水晶水母', element: 'ocean', quality: 'rare', icon: '🪼',
    baseHp: 720, baseAtk: 110, baseDef: 95,
    skills: [
      { name: '水晶刺', type: 'basic', effect: 'damage', multiplier: 1.0 },
      { name: '水療', type: 'active', effect: 'heal', value: 0.25, cooldown: 4 },
      { name: '水晶護盾', type: 'passive', effect: 'def_boost', value: 0.16 },
      { name: '毒刺陣', type: 'active', effect: 'damage_all', multiplier: 0.9, cooldown: 4 }
    ]
  }
];
