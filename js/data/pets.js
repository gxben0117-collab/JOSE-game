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
      { name: '灼熱', type: 'passive', effect: 'burn',       chance: 0.15, value: 0.05 }
    ]
  },
  {
    id: 'fire_lion', name: '炎獅', element: 'fire', quality: 'normal', icon: '🦁',
    baseHp: 540, baseAtk: 75, baseDef: 65,
    skills: [
      { name: '獅爪',   type: 'basic',   effect: 'damage',    multiplier: 1.0 },
      { name: '怒吼',   type: 'active',  effect: 'buff_atk',  value: 0.3, cooldown: 4 },
      { name: '鬃毛防護', type: 'passive', effect: 'def_boost', value: 0.1 }
    ]
  },
  {
    id: 'fire_fox', name: '火狐', element: 'fire', quality: 'rare', icon: '🦊',
    baseHp: 600, baseAtk: 125, baseDef: 55,
    skills: [
      { name: '鬼火',   type: 'basic',   effect: 'damage', multiplier: 1.1 },
      { name: '九尾亂舞', type: 'active', effect: 'damage', multiplier: 2.5, cooldown: 4 },
      { name: '靈敏',   type: 'passive', effect: 'atk_boost', value: 0.12 }
    ]
  },
  {
    id: 'red_wing_bird', name: '赤羽鳥', element: 'fire', quality: 'rare', icon: '🦅',
    baseHp: 560, baseAtk: 135, baseDef: 40,
    skills: [
      { name: '翼斬',   type: 'basic',  effect: 'damage', multiplier: 1.2 },
      { name: '俯衝轟炸', type: 'active', effect: 'damage', multiplier: 3.0, cooldown: 5 },
      { name: '空中霸主', type: 'passive', effect: 'atk_boost', value: 0.12 }
    ]
  },
  {
    id: 'lava_crab', name: '熔岩蟹', element: 'fire', quality: 'rare', icon: '🦀',
    baseHp: 740, baseAtk: 95, baseDef: 105,
    skills: [
      { name: '蟹鉗',   type: 'basic',  effect: 'damage',  multiplier: 1.0 },
      { name: '熔岩護盾', type: 'active', effect: 'shield',  value: 0.3, cooldown: 5 },
      { name: '硬殼',   type: 'passive', effect: 'def_boost', value: 0.2 }
    ]
  },
  {
    id: 'flame_spirit', name: '炎靈獸', element: 'fire', quality: 'elite', icon: '✨',
    baseHp: 900, baseAtk: 200, baseDef: 120,
    skills: [
      { name: '靈焰',   type: 'basic',  effect: 'damage',     multiplier: 1.3 },
      { name: '鳳凰之火', type: 'active', effect: 'damage_all', multiplier: 1.2, cooldown: 4 },
      { name: '靈魂連結', type: 'passive', effect: 'atk_boost', value: 0.15 }
    ]
  },
  {
    id: 'blazing_dragon', name: '烈焰龍', element: 'fire', quality: 'elite', icon: '🐉',
    baseHp: 1100, baseAtk: 245, baseDef: 100,
    skills: [
      { name: '龍息',  type: 'basic',  effect: 'damage',     multiplier: 1.4 },
      { name: '業火',  type: 'active', effect: 'damage_all', multiplier: 1.5, cooldown: 5 },
      { name: '龍之傲', type: 'passive', effect: 'atk_boost', value: 0.2 }
    ]
  },
  {
    id: 'flame_god_lion', name: '焰神獅', element: 'fire', quality: 'epic', icon: '🔱',
    baseHp: 2000, baseAtk: 460, baseDef: 280,
    skills: [
      { name: '神擊',  type: 'basic',  effect: 'damage',     multiplier: 1.5 },
      { name: '神焰',  type: 'active', effect: 'damage_all', multiplier: 2.0, cooldown: 4 },
      { name: '神之氣息', type: 'passive', effect: 'all_boost', value: 0.15 }
    ]
  },
  {
    id: 'crimson_dragon', name: '赤炎神龍', element: 'fire', quality: 'legendary', icon: '🌋',
    baseHp: 4500, baseAtk: 910, baseDef: 510,
    skills: [
      { name: '傳說咬擊', type: 'basic',  effect: 'damage',     multiplier: 1.8 },
      { name: '世界之炎', type: 'active', effect: 'damage_all', multiplier: 3.0, cooldown: 5 },
      { name: '龍皇之威', type: 'passive', effect: 'atk_boost', value: 0.3 }
    ]
  },
  {
    id: 'flame_emperor', name: '炎帝獸', element: 'fire', quality: 'mythical', icon: '☀️',
    baseHp: 9000, baseAtk: 1800, baseDef: 900,
    skills: [
      { name: '帝王之擊', type: 'basic',  effect: 'damage',     multiplier: 2.0 },
      { name: '太陽風暴', type: 'active', effect: 'damage_all', multiplier: 4.0, cooldown: 5 },
      { name: '帝王氣息', type: 'passive', effect: 'all_boost', value: 0.25 }
    ]
  },

  // ===== 森林系 (Forest) =====
  {
    id: 'leaf_ear_rabbit', name: '葉耳兔', element: 'forest', quality: 'normal', icon: '🐰',
    baseHp: 460, baseAtk: 70, baseDef: 55,
    skills: [
      { name: '葉片投擲', type: 'basic',  effect: 'damage', multiplier: 1.0 },
      { name: '草藥治療', type: 'active', effect: 'heal',   value: 0.25, cooldown: 4 },
      { name: '森林之心', type: 'passive', effect: 'hp_boost', value: 0.1 }
    ]
  },
  {
    id: 'grass_bear', name: '草熊', element: 'forest', quality: 'normal', icon: '🐻',
    baseHp: 660, baseAtk: 80, baseDef: 75,
    skills: [
      { name: '熊掌',   type: 'basic',  effect: 'damage',     multiplier: 1.0 },
      { name: '大地震擊', type: 'active', effect: 'damage_all', multiplier: 0.7, cooldown: 4 },
      { name: '厚毛',   type: 'passive', effect: 'def_boost', value: 0.15 }
    ]
  },
  {
    id: 'vine_snake', name: '藤蛇', element: 'forest', quality: 'rare', icon: '🐍',
    baseHp: 585, baseAtk: 145, baseDef: 60,
    skills: [
      { name: '藤鞭',  type: 'basic',  effect: 'damage', multiplier: 1.1 },
      { name: '毒牙',  type: 'active', effect: 'damage', multiplier: 2.2, cooldown: 3 },
      { name: '毒氣',  type: 'passive', effect: 'atk_boost', value: 0.1 }
    ]
  },
  {
    id: 'emerald_bird', name: '翠羽鳥', element: 'forest', quality: 'rare', icon: '🦜',
    baseHp: 565, baseAtk: 130, baseDef: 50,
    skills: [
      { name: '羽毛風暴', type: 'basic',  effect: 'damage',    multiplier: 1.2 },
      { name: '翠羽舞',  type: 'active', effect: 'buff_atk',  value: 0.2, cooldown: 4 },
      { name: '疾翼',   type: 'passive', effect: 'atk_boost', value: 0.12 }
    ]
  },
  {
    id: 'moss_turtle', name: '苔蘚龜', element: 'forest', quality: 'rare', icon: '🐢',
    baseHp: 920, baseAtk: 70, baseDef: 155,
    skills: [
      { name: '龜殼衝撞', type: 'basic',  effect: 'damage',  multiplier: 0.8 },
      { name: '自然護盾', type: 'active', effect: 'shield',  value: 0.2, cooldown: 5 },
      { name: '遠古龜殼', type: 'passive', effect: 'def_boost', value: 0.25 }
    ]
  },
  {
    id: 'forest_deer', name: '森靈鹿', element: 'forest', quality: 'elite', icon: '🦌',
    baseHp: 960, baseAtk: 195, baseDef: 130,
    skills: [
      { name: '鹿角衝擊', type: 'basic',  effect: 'damage',   multiplier: 1.3 },
      { name: '森林祝福', type: 'active', effect: 'heal',     value: 0.2, cooldown: 4 },
      { name: '自然連結', type: 'passive', effect: 'hp_boost', value: 0.15 }
    ]
  },
  {
    id: 'emerald_dragon', name: '翠龍', element: 'forest', quality: 'elite', icon: '🐲',
    baseHp: 1200, baseAtk: 235, baseDef: 115,
    skills: [
      { name: '翠息',   type: 'basic',  effect: 'damage',  multiplier: 1.4 },
      { name: '藤蔓束縛', type: 'active', effect: 'damage', multiplier: 2.0, cooldown: 5 },
      { name: '翠龍鱗', type: 'passive', effect: 'def_boost', value: 0.18 }
    ]
  },
  {
    id: 'forest_king', name: '森王獸', element: 'forest', quality: 'epic', icon: '🌿',
    baseHp: 2200, baseAtk: 430, baseDef: 305,
    skills: [
      { name: '王者之擊', type: 'basic',  effect: 'damage',     multiplier: 1.5 },
      { name: '森林之怒', type: 'active', effect: 'damage_all', multiplier: 2.0, cooldown: 4 },
      { name: '森王氣息', type: 'passive', effect: 'hp_boost', value: 0.2 }
    ]
  },
  {
    id: 'emerald_god_dragon', name: '翠神龍', element: 'forest', quality: 'legendary', icon: '🌳',
    baseHp: 5000, baseAtk: 860, baseDef: 555,
    skills: [
      { name: '傳說龍牙', type: 'basic',  effect: 'damage',   multiplier: 1.8 },
      { name: '世界樹之力', type: 'active', effect: 'heal',   value: 0.3, cooldown: 5 },
      { name: '遠古之力', type: 'passive', effect: 'all_boost', value: 0.28 }
    ]
  },
  {
    id: 'forest_god', name: '林神獸', element: 'forest', quality: 'mythical', icon: '🌲',
    baseHp: 9500, baseAtk: 1710, baseDef: 960,
    skills: [
      { name: '神之牙',  type: 'basic',  effect: 'damage',     multiplier: 2.0 },
      { name: '自然之怒', type: 'active', effect: 'damage_all', multiplier: 4.0, cooldown: 5 },
      { name: '神之林',  type: 'passive', effect: 'all_boost', value: 0.22 }
    ]
  },

  // ===== 海洋系 (Ocean) =====
  {
    id: 'bubble_whale', name: '泡泡鯨', element: 'ocean', quality: 'normal', icon: '🐋',
    baseHp: 620, baseAtk: 65, baseDef: 60,
    skills: [
      { name: '水花',   type: 'basic',  effect: 'damage', multiplier: 1.0 },
      { name: '泡泡護盾', type: 'active', effect: 'shield', value: 0.2, cooldown: 4 },
      { name: '海洋之心', type: 'passive', effect: 'hp_boost', value: 0.12 }
    ]
  },
  {
    id: 'coral_fish', name: '珊瑚魚', element: 'ocean', quality: 'normal', icon: '🐠',
    baseHp: 420, baseAtk: 95, baseDef: 38,
    skills: [
      { name: '魚鰭斬', type: 'basic',  effect: 'damage', multiplier: 1.1 },
      { name: '魚群衝鋒', type: 'active', effect: 'damage', multiplier: 2.5, cooldown: 4 },
      { name: '滑溜',  type: 'passive', effect: 'atk_boost', value: 0.1 }
    ]
  },
  {
    id: 'starfish_beast', name: '海星獸', element: 'ocean', quality: 'rare', icon: '⭐',
    baseHp: 660, baseAtk: 115, baseDef: 82,
    skills: [
      { name: '星光射線', type: 'basic',  effect: 'damage', multiplier: 1.1 },
      { name: '再生',   type: 'active', effect: 'heal',   value: 0.3, cooldown: 4 },
      { name: '星力',   type: 'passive', effect: 'hp_boost', value: 0.1 }
    ]
  },
  {
    id: 'ice_shark', name: '冰鯊', element: 'ocean', quality: 'rare', icon: '🦈',
    baseHp: 710, baseAtk: 155, baseDef: 65,
    skills: [
      { name: '鯊齒咬擊', type: 'basic',  effect: 'damage', multiplier: 1.3 },
      { name: '冰暴衝擊', type: 'active', effect: 'damage', multiplier: 2.8, cooldown: 4 },
      { name: '掠食者',  type: 'passive', effect: 'atk_boost', value: 0.15 }
    ]
  },
  {
    id: 'deep_sea_crab', name: '深海螃蟹', element: 'ocean', quality: 'rare', icon: '🦞',
    baseHp: 820, baseAtk: 100, baseDef: 135,
    skills: [
      { name: '鉗擊',   type: 'basic',  effect: 'damage',  multiplier: 1.0 },
      { name: '水牆',   type: 'active', effect: 'shield',  value: 0.25, cooldown: 5 },
      { name: '深海鎧甲', type: 'passive', effect: 'def_boost', value: 0.22 }
    ]
  },
  {
    id: 'ice_spirit_fish', name: '冰靈魚', element: 'ocean', quality: 'elite', icon: '❄️',
    baseHp: 990, baseAtk: 215, baseDef: 122,
    skills: [
      { name: '冰矛',   type: 'basic',  effect: 'damage',     multiplier: 1.3 },
      { name: '暴風雪', type: 'active', effect: 'damage_all', multiplier: 1.3, cooldown: 4 },
      { name: '冰晶氣場', type: 'passive', effect: 'atk_boost', value: 0.15 }
    ]
  },
  {
    id: 'abyss_dragon', name: '深淵龍', element: 'ocean', quality: 'elite', icon: '🌊',
    baseHp: 1320, baseAtk: 255, baseDef: 118,
    skills: [
      { name: '深淵咬擊', type: 'basic',  effect: 'damage',     multiplier: 1.4 },
      { name: '海嘯',   type: 'active', effect: 'damage_all', multiplier: 1.6, cooldown: 5 },
      { name: '深淵之力', type: 'passive', effect: 'atk_boost', value: 0.18 }
    ]
  },
  {
    id: 'sea_god_beast', name: '海神獸', element: 'ocean', quality: 'epic', icon: '🔱',
    baseHp: 2400, baseAtk: 440, baseDef: 295,
    skills: [
      { name: '三叉戟', type: 'basic',  effect: 'damage',     multiplier: 1.5 },
      { name: '海洋之怒', type: 'active', effect: 'damage_all', multiplier: 2.2, cooldown: 4 },
      { name: '海神氣息', type: 'passive', effect: 'all_boost', value: 0.15 }
    ]
  },
  {
    id: 'abyss_god_dragon', name: '深淵神龍', element: 'ocean', quality: 'legendary', icon: '🌀',
    baseHp: 5500, baseAtk: 930, baseDef: 565,
    skills: [
      { name: '傳說龍顎', type: 'basic',  effect: 'damage',     multiplier: 1.8 },
      { name: '虛空海潮', type: 'active', effect: 'damage_all', multiplier: 3.2, cooldown: 5 },
      { name: '深淵意志', type: 'passive', effect: 'all_boost', value: 0.3 }
    ]
  },
  {
    id: 'sea_emperor', name: '海帝獸', element: 'ocean', quality: 'mythical', icon: '💠',
    baseHp: 10000, baseAtk: 1900, baseDef: 1000,
    skills: [
      { name: '帝王浪潮', type: 'basic',  effect: 'damage',     multiplier: 2.0 },
      { name: '末日海潮', type: 'active', effect: 'damage_all', multiplier: 4.5, cooldown: 5 },
      { name: '帝王之海', type: 'passive', effect: 'all_boost', value: 0.23 }
    ]
  }
];
