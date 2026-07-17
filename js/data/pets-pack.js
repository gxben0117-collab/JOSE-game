/* 素材包 50 隻新幻獸（CLAUBE_全新遊戲圖案素材包_2026-07-17）。
   單張立繪（art）供三階與圖鑑共用；名稱、定位、技能名取自素材包設計文件。 */
(function () {
  'use strict';
  var PACK_PETS = [
 {
  "id": "emberhorn_beetle",
  "name": "燼角甲蟲",
  "element": "fire",
  "quality": "normal",
  "icon": "🐾",
  "baseHp": 560,
  "baseAtk": 88,
  "baseDef": 55,
  "art": "assets/pack/emberhorn_beetle.png",
  "skills": [
   {
    "name": "燼角突進",
    "type": "basic",
    "effect": "damage",
    "multiplier": 1.0
   },
   {
    "name": "熔殼",
    "type": "active",
    "effect": "shield",
    "multiplier": 0.85,
    "cooldown": 3,
    "value": 0.8
   },
   {
    "name": "火山鐵壁",
    "type": "active",
    "effect": "damage",
    "multiplier": 1.4,
    "cooldown": 2
   }
  ]
 },
 {
  "id": "furnace_owl",
  "name": "爐心梟",
  "element": "fire",
  "quality": "normal",
  "icon": "🐾",
  "baseHp": 507,
  "baseAtk": 91,
  "baseDef": 53,
  "art": "assets/pack/furnace_owl.png",
  "skills": [
   {
    "name": "灰燼羽",
    "type": "basic",
    "effect": "damage",
    "multiplier": 1.0
   },
   {
    "name": "熱風環",
    "type": "active",
    "effect": "damage",
    "multiplier": 1.35,
    "cooldown": 2
   },
   {
    "name": "爐心凝視",
    "type": "active",
    "effect": "damage_all",
    "multiplier": 0.62,
    "cooldown": 3
   }
  ]
 },
 {
  "id": "cinder_pangolin",
  "name": "燼甲穿山獸",
  "element": "fire",
  "quality": "normal",
  "icon": "🐾",
  "baseHp": 574,
  "baseAtk": 94,
  "baseDef": 55,
  "art": "assets/pack/cinder_pangolin.png",
  "skills": [
   {
    "name": "火輪滾",
    "type": "basic",
    "effect": "damage",
    "multiplier": 1.0
   },
   {
    "name": "蜷甲",
    "type": "active",
    "effect": "shield",
    "multiplier": 0.85,
    "cooldown": 3,
    "value": 0.8
   },
   {
    "name": "地脈翻騰",
    "type": "active",
    "effect": "damage",
    "multiplier": 1.4,
    "cooldown": 2
   }
  ]
 },
 {
  "id": "scarlet_salamander",
  "name": "赤煉蠑螈",
  "element": "fire",
  "quality": "rare",
  "icon": "🐾",
  "baseHp": 641,
  "baseAtk": 149,
  "baseDef": 63,
  "art": "assets/pack/scarlet_salamander.png",
  "skills": [
   {
    "name": "熱毒爪",
    "type": "basic",
    "effect": "damage",
    "multiplier": 1.0
   },
   {
    "name": "熔岩滑步",
    "type": "active",
    "effect": "damage",
    "multiplier": 1.45,
    "cooldown": 2
   },
   {
    "name": "赤煉爆發",
    "type": "active",
    "effect": "damage_all",
    "multiplier": 0.64,
    "cooldown": 3
   }
  ]
 },
 {
  "id": "blast_ram",
  "name": "爆炎戰羊",
  "element": "fire",
  "quality": "rare",
  "icon": "🐾",
  "baseHp": 648,
  "baseAtk": 140,
  "baseDef": 58,
  "art": "assets/pack/blast_ram.png",
  "skills": [
   {
    "name": "爆角衝鋒",
    "type": "basic",
    "effect": "damage",
    "multiplier": 1.0
   },
   {
    "name": "踏焰",
    "type": "active",
    "effect": "damage",
    "multiplier": 1.45,
    "cooldown": 2
   },
   {
    "name": "焚城衝角",
    "type": "active",
    "effect": "damage_all",
    "multiplier": 0.64,
    "cooldown": 3
   }
  ]
 },
 {
  "id": "coal_mole",
  "name": "炭鑽鼴",
  "element": "fire",
  "quality": "rare",
  "icon": "🐾",
  "baseHp": 655,
  "baseAtk": 131,
  "baseDef": 63,
  "art": "assets/pack/coal_mole.png",
  "skills": [
   {
    "name": "潛地爪",
    "type": "basic",
    "effect": "damage",
    "multiplier": 1.0
   },
   {
    "name": "炭爆雷",
    "type": "active",
    "effect": "damage",
    "multiplier": 1.35,
    "cooldown": 2
   },
   {
    "name": "地底噴發",
    "type": "active",
    "effect": "damage_all",
    "multiplier": 0.62,
    "cooldown": 3
   }
  ]
 },
 {
  "id": "flare_hummingbird",
  "name": "曜焰蜂鳥",
  "element": "fire",
  "quality": "epic",
  "icon": "🐾",
  "baseHp": 2052,
  "baseAtk": 461,
  "baseDef": 278,
  "art": "assets/pack/flare_hummingbird.png",
  "skills": [
   {
    "name": "曜光針",
    "type": "basic",
    "effect": "damage",
    "multiplier": 1.0
   },
   {
    "name": "火花加速",
    "type": "active",
    "effect": "shield",
    "multiplier": 0.82,
    "cooldown": 3,
    "value": 0.8
   },
   {
    "name": "日輪振翅",
    "type": "active",
    "effect": "buff_atk",
    "multiplier": 0.8,
    "cooldown": 4,
    "value": 0.85
   }
  ]
 },
 {
  "id": "kiln_rhinoceros",
  "name": "爐岩犀",
  "element": "fire",
  "quality": "epic",
  "icon": "🐾",
  "baseHp": 2305,
  "baseAtk": 464,
  "baseDef": 324,
  "art": "assets/pack/kiln_rhinoceros.png",
  "skills": [
   {
    "name": "岩角挑釁",
    "type": "basic",
    "effect": "damage",
    "multiplier": 1.0
   },
   {
    "name": "爐壁",
    "type": "active",
    "effect": "shield",
    "multiplier": 0.85,
    "cooldown": 3,
    "value": 0.8
   },
   {
    "name": "熔爐奔襲",
    "type": "active",
    "effect": "damage",
    "multiplier": 1.4,
    "cooldown": 2
   }
  ]
 },
 {
  "id": "sunscar_scorpion",
  "name": "日痕蠍",
  "element": "fire",
  "quality": "epic",
  "icon": "🐾",
  "baseHp": 2066,
  "baseAtk": 455,
  "baseDef": 278,
  "art": "assets/pack/sunscar_scorpion.png",
  "skills": [
   {
    "name": "日痕刺",
    "type": "basic",
    "effect": "damage",
    "multiplier": 1.0
   },
   {
    "name": "火鉗鎖",
    "type": "active",
    "effect": "damage",
    "multiplier": 1.35,
    "cooldown": 2
   },
   {
    "name": "正午刑台",
    "type": "active",
    "effect": "damage_all",
    "multiplier": 0.62,
    "cooldown": 3
   }
  ]
 },
 {
  "id": "comet_tiger",
  "name": "彗焰虎",
  "element": "fire",
  "quality": "mythical",
  "icon": "🐾",
  "baseHp": 9123,
  "baseAtk": 1961,
  "baseDef": 925,
  "art": "assets/pack/comet_tiger.png",
  "skills": [
   {
    "name": "彗爪",
    "type": "basic",
    "effect": "damage",
    "multiplier": 1.0
   },
   {
    "name": "追焰",
    "type": "active",
    "effect": "damage",
    "multiplier": 1.45,
    "cooldown": 2
   },
   {
    "name": "天火虎嘯",
    "type": "active",
    "effect": "damage_all",
    "multiplier": 0.64,
    "cooldown": 3
   }
  ]
 },
 {
  "id": "spore_hedgehog",
  "name": "孢芽刺蝟",
  "element": "forest",
  "quality": "normal",
  "icon": "🐾",
  "baseHp": 530,
  "baseAtk": 94,
  "baseDef": 48,
  "art": "assets/pack/spore_hedgehog.png",
  "skills": [
   {
    "name": "孢子針",
    "type": "basic",
    "effect": "damage",
    "multiplier": 1.0
   },
   {
    "name": "菌毯",
    "type": "active",
    "effect": "heal",
    "multiplier": 1.0,
    "cooldown": 1
   },
   {
    "name": "春芽綻放",
    "type": "active",
    "effect": "heal_all",
    "multiplier": 0.72,
    "cooldown": 3
   }
  ]
 },
 {
  "id": "bamboo_panda",
  "name": "竹鎧貓熊",
  "element": "forest",
  "quality": "normal",
  "icon": "🐾",
  "baseHp": 597,
  "baseAtk": 97,
  "baseDef": 60,
  "art": "assets/pack/bamboo_panda.png",
  "skills": [
   {
    "name": "竹掌",
    "type": "basic",
    "effect": "damage",
    "multiplier": 1.0
   },
   {
    "name": "節節高",
    "type": "active",
    "effect": "shield",
    "multiplier": 0.85,
    "cooldown": 3,
    "value": 0.8
   },
   {
    "name": "萬竹陣",
    "type": "active",
    "effect": "damage",
    "multiplier": 1.4,
    "cooldown": 2
   }
  ]
 },
 {
  "id": "orchid_gecko",
  "name": "蘭影壁虎",
  "element": "forest",
  "quality": "normal",
  "icon": "🐾",
  "baseHp": 504,
  "baseAtk": 88,
  "baseDef": 48,
  "art": "assets/pack/orchid_gecko.png",
  "skills": [
   {
    "name": "蘭粉",
    "type": "basic",
    "effect": "damage",
    "multiplier": 1.0
   },
   {
    "name": "攀壁影步",
    "type": "active",
    "effect": "damage",
    "multiplier": 1.35,
    "cooldown": 2
   },
   {
    "name": "幽香幻境",
    "type": "active",
    "effect": "damage_all",
    "multiplier": 0.62,
    "cooldown": 3
   }
  ]
 },
 {
  "id": "acorn_squirrel",
  "name": "橡果飛鼠",
  "element": "forest",
  "quality": "rare",
  "icon": "🐾",
  "baseHp": 631,
  "baseAtk": 143,
  "baseDef": 63,
  "art": "assets/pack/acorn_squirrel.png",
  "skills": [
   {
    "name": "橡果彈",
    "type": "basic",
    "effect": "damage",
    "multiplier": 1.0
   },
   {
    "name": "乘風襲",
    "type": "active",
    "effect": "damage",
    "multiplier": 1.45,
    "cooldown": 2
   },
   {
    "name": "果雨轟炸",
    "type": "active",
    "effect": "damage_all",
    "multiplier": 0.64,
    "cooldown": 3
   }
  ]
 },
 {
  "id": "fern_ceratops",
  "name": "蕨角獸",
  "element": "forest",
  "quality": "rare",
  "icon": "🐾",
  "baseHp": 712,
  "baseAtk": 134,
  "baseDef": 66,
  "art": "assets/pack/fern_ceratops.png",
  "skills": [
   {
    "name": "蕨角頂",
    "type": "basic",
    "effect": "damage",
    "multiplier": 1.0
   },
   {
    "name": "古木頭盾",
    "type": "active",
    "effect": "shield",
    "multiplier": 0.85,
    "cooldown": 3,
    "value": 0.8
   },
   {
    "name": "林海堡壘",
    "type": "active",
    "effect": "damage",
    "multiplier": 1.4,
    "cooldown": 2
   }
  ]
 },
 {
  "id": "nectar_moth",
  "name": "蜜露蛾",
  "element": "forest",
  "quality": "rare",
  "icon": "🐾",
  "baseHp": 645,
  "baseAtk": 137,
  "baseDef": 63,
  "art": "assets/pack/nectar_moth.png",
  "skills": [
   {
    "name": "蜜粉",
    "type": "basic",
    "effect": "damage",
    "multiplier": 1.0
   },
   {
    "name": "花翼庇護",
    "type": "active",
    "effect": "heal",
    "multiplier": 1.0,
    "cooldown": 1
   },
   {
    "name": "月下蜜雨",
    "type": "active",
    "effect": "heal_all",
    "multiplier": 0.72,
    "cooldown": 3
   }
  ]
 },
 {
  "id": "bramble_lynx",
  "name": "棘影猞猁",
  "element": "forest",
  "quality": "epic",
  "icon": "🐾",
  "baseHp": 2082,
  "baseAtk": 500,
  "baseDef": 278,
  "art": "assets/pack/bramble_lynx.png",
  "skills": [
   {
    "name": "棘爪",
    "type": "basic",
    "effect": "damage",
    "multiplier": 1.0
   },
   {
    "name": "林影跳殺",
    "type": "active",
    "effect": "damage",
    "multiplier": 1.45,
    "cooldown": 2
   },
   {
    "name": "獵場封鎖",
    "type": "active",
    "effect": "damage_all",
    "multiplier": 0.64,
    "cooldown": 3
   }
  ]
 },
 {
  "id": "mushroom_bison",
  "name": "菇冠野牛",
  "element": "forest",
  "quality": "epic",
  "icon": "🐾",
  "baseHp": 2335,
  "baseAtk": 458,
  "baseDef": 324,
  "art": "assets/pack/mushroom_bison.png",
  "skills": [
   {
    "name": "菇角撞",
    "type": "basic",
    "effect": "damage",
    "multiplier": 1.0
   },
   {
    "name": "菌甲",
    "type": "active",
    "effect": "shield",
    "multiplier": 0.85,
    "cooldown": 3,
    "value": 0.8
   },
   {
    "name": "遠古菌林",
    "type": "active",
    "effect": "damage",
    "multiplier": 1.4,
    "cooldown": 2
   }
  ]
 },
 {
  "id": "willow_crane",
  "name": "柳風鶴",
  "element": "forest",
  "quality": "epic",
  "icon": "🐾",
  "baseHp": 2056,
  "baseAtk": 461,
  "baseDef": 278,
  "art": "assets/pack/willow_crane.png",
  "skills": [
   {
    "name": "柳葉針",
    "type": "basic",
    "effect": "damage",
    "multiplier": 1.0
   },
   {
    "name": "回風",
    "type": "active",
    "effect": "heal",
    "multiplier": 1.0,
    "cooldown": 1
   },
   {
    "name": "垂柳新生",
    "type": "active",
    "effect": "heal_all",
    "multiplier": 0.72,
    "cooldown": 3
   }
  ]
 },
 {
  "id": "amber_antler_moose",
  "name": "琥珀角駝鹿",
  "element": "forest",
  "quality": "mythical",
  "icon": "🐾",
  "baseHp": 9113,
  "baseAtk": 1789,
  "baseDef": 925,
  "art": "assets/pack/amber_antler_moose.png",
  "skills": [
   {
    "name": "琥珀光",
    "type": "basic",
    "effect": "damage",
    "multiplier": 1.0
   },
   {
    "name": "森王踏",
    "type": "active",
    "effect": "damage",
    "multiplier": 1.5,
    "cooldown": 2
   },
   {
    "name": "四季輪轉",
    "type": "active",
    "effect": "damage_all",
    "multiplier": 0.7,
    "cooldown": 3
   }
  ]
 },
 {
  "id": "pearl_seahorse",
  "name": "珠鎧海馬",
  "element": "ocean",
  "quality": "normal",
  "icon": "🐾",
  "baseHp": 520,
  "baseAtk": 88,
  "baseDef": 48,
  "art": "assets/pack/pearl_seahorse.png",
  "skills": [
   {
    "name": "珠泡",
    "type": "basic",
    "effect": "damage",
    "multiplier": 1.0
   },
   {
    "name": "潮尾推波",
    "type": "active",
    "effect": "shield",
    "multiplier": 0.82,
    "cooldown": 3,
    "value": 0.8
   },
   {
    "name": "王珠祝福",
    "type": "active",
    "effect": "buff_atk",
    "multiplier": 0.8,
    "cooldown": 4,
    "value": 0.85
   }
  ]
 },
 {
  "id": "tidal_axolotl",
  "name": "潮汐六角螈",
  "element": "ocean",
  "quality": "normal",
  "icon": "🐾",
  "baseHp": 527,
  "baseAtk": 91,
  "baseDef": 53,
  "art": "assets/pack/tidal_axolotl.png",
  "skills": [
   {
    "name": "再生水滴",
    "type": "basic",
    "effect": "damage",
    "multiplier": 1.0
   },
   {
    "name": "潮池",
    "type": "active",
    "effect": "heal",
    "multiplier": 1.0,
    "cooldown": 1
   },
   {
    "name": "不滅外鰓",
    "type": "active",
    "effect": "heal_all",
    "multiplier": 0.72,
    "cooldown": 3
   }
  ]
 },
 {
  "id": "glacier_penguin",
  "name": "冰晶企鵝",
  "element": "ocean",
  "quality": "normal",
  "icon": "🐾",
  "baseHp": 534,
  "baseAtk": 94,
  "baseDef": 48,
  "art": "assets/pack/glacier_penguin.png",
  "skills": [
   {
    "name": "冰球",
    "type": "basic",
    "effect": "damage",
    "multiplier": 1.0
   },
   {
    "name": "滑冰衝撞",
    "type": "active",
    "effect": "damage",
    "multiplier": 1.35,
    "cooldown": 2
   },
   {
    "name": "極地封鎖",
    "type": "active",
    "effect": "damage_all",
    "multiplier": 0.62,
    "cooldown": 3
   }
  ]
 },
 {
  "id": "nautilus_guardian",
  "name": "螺旋鸚鵡螺",
  "element": "ocean",
  "quality": "rare",
  "icon": "🐾",
  "baseHp": 695,
  "baseAtk": 137,
  "baseDef": 71,
  "art": "assets/pack/nautilus_guardian.png",
  "skills": [
   {
    "name": "螺殼守勢",
    "type": "basic",
    "effect": "damage",
    "multiplier": 1.0
   },
   {
    "name": "潮吸",
    "type": "active",
    "effect": "shield",
    "multiplier": 0.85,
    "cooldown": 3,
    "value": 0.8
   },
   {
    "name": "深海回旋",
    "type": "active",
    "effect": "damage",
    "multiplier": 1.4,
    "cooldown": 2
   }
  ]
 },
 {
  "id": "star_tide_ray",
  "name": "星潮魟",
  "element": "ocean",
  "quality": "rare",
  "icon": "🐾",
  "baseHp": 628,
  "baseAtk": 140,
  "baseDef": 58,
  "art": "assets/pack/star_tide_ray.png",
  "skills": [
   {
    "name": "潮翼刃",
    "type": "basic",
    "effect": "damage",
    "multiplier": 1.0
   },
   {
    "name": "星尾針",
    "type": "active",
    "effect": "damage",
    "multiplier": 1.45,
    "cooldown": 2
   },
   {
    "name": "星潮墜落",
    "type": "active",
    "effect": "damage_all",
    "multiplier": 0.64,
    "cooldown": 3
   }
  ]
 },
 {
  "id": "kelp_otter",
  "name": "海藻水獺",
  "element": "ocean",
  "quality": "rare",
  "icon": "🐾",
  "baseHp": 635,
  "baseAtk": 131,
  "baseDef": 63,
  "art": "assets/pack/kelp_otter.png",
  "skills": [
   {
    "name": "貝殼彈",
    "type": "basic",
    "effect": "damage",
    "multiplier": 1.0
   },
   {
    "name": "海藻繃帶",
    "type": "active",
    "effect": "shield",
    "multiplier": 0.82,
    "cooldown": 3,
    "value": 0.8
   },
   {
    "name": "水獺補給",
    "type": "active",
    "effect": "buff_atk",
    "multiplier": 0.8,
    "cooldown": 4,
    "value": 0.85
   }
  ]
 },
 {
  "id": "geyser_frog",
  "name": "湧泉蛙",
  "element": "ocean",
  "quality": "epic",
  "icon": "🐾",
  "baseHp": 2072,
  "baseAtk": 461,
  "baseDef": 278,
  "art": "assets/pack/geyser_frog.png",
  "skills": [
   {
    "name": "水彈舌",
    "type": "basic",
    "effect": "damage",
    "multiplier": 1.0
   },
   {
    "name": "湧泉跳",
    "type": "active",
    "effect": "damage",
    "multiplier": 1.35,
    "cooldown": 2
   },
   {
    "name": "間歇泉群",
    "type": "active",
    "effect": "damage_all",
    "multiplier": 0.62,
    "cooldown": 3
   }
  ]
 },
 {
  "id": "reef_hammerhead",
  "name": "礁岩鎚頭獸",
  "element": "ocean",
  "quality": "epic",
  "icon": "🐾",
  "baseHp": 2079,
  "baseAtk": 509,
  "baseDef": 283,
  "art": "assets/pack/reef_hammerhead.png",
  "skills": [
   {
    "name": "橫掃鎚",
    "type": "basic",
    "effect": "damage",
    "multiplier": 1.0
   },
   {
    "name": "獵潮",
    "type": "active",
    "effect": "damage",
    "multiplier": 1.45,
    "cooldown": 2
   },
   {
    "name": "破礁狂航",
    "type": "active",
    "effect": "damage_all",
    "multiplier": 0.64,
    "cooldown": 3
   }
  ]
 },
 {
  "id": "brine_crocodile",
  "name": "鹽潮鱷",
  "element": "ocean",
  "quality": "epic",
  "icon": "🐾",
  "baseHp": 2332,
  "baseAtk": 455,
  "baseDef": 319,
  "art": "assets/pack/brine_crocodile.png",
  "skills": [
   {
    "name": "鹽晶咬",
    "type": "basic",
    "effect": "damage",
    "multiplier": 1.0
   },
   {
    "name": "潛潮伏擊",
    "type": "active",
    "effect": "shield",
    "multiplier": 0.85,
    "cooldown": 3,
    "value": 0.8
   },
   {
    "name": "鹽海領域",
    "type": "active",
    "effect": "damage",
    "multiplier": 1.4,
    "cooldown": 2
   }
  ]
 },
 {
  "id": "aurora_narwhal",
  "name": "極光獨角鯨",
  "element": "ocean",
  "quality": "mythical",
  "icon": "🐾",
  "baseHp": 9103,
  "baseAtk": 1783,
  "baseDef": 925,
  "art": "assets/pack/aurora_narwhal.png",
  "skills": [
   {
    "name": "極光刺",
    "type": "basic",
    "effect": "damage",
    "multiplier": 1.0
   },
   {
    "name": "星潮護航",
    "type": "active",
    "effect": "damage",
    "multiplier": 1.5,
    "cooldown": 2
   },
   {
    "name": "北海天幕",
    "type": "active",
    "effect": "damage_all",
    "multiplier": 0.7,
    "cooldown": 3
   }
  ]
 },
 {
  "id": "prism_peacock",
  "name": "稜光孔雀",
  "element": "light",
  "quality": "normal",
  "icon": "🐾",
  "baseHp": 510,
  "baseAtk": 94,
  "baseDef": 48,
  "art": "assets/pack/prism_peacock.png",
  "skills": [
   {
    "name": "折光羽",
    "type": "basic",
    "effect": "damage",
    "multiplier": 1.0
   },
   {
    "name": "眩彩開屏",
    "type": "active",
    "effect": "damage",
    "multiplier": 1.35,
    "cooldown": 2
   },
   {
    "name": "七色迷宮",
    "type": "active",
    "effect": "damage_all",
    "multiplier": 0.62,
    "cooldown": 3
   }
  ]
 },
 {
  "id": "dawn_griffin",
  "name": "曙光獅鷲",
  "element": "light",
  "quality": "normal",
  "icon": "🐾",
  "baseHp": 517,
  "baseAtk": 105,
  "baseDef": 53,
  "art": "assets/pack/dawn_griffin.png",
  "skills": [
   {
    "name": "曙爪",
    "type": "basic",
    "effect": "damage",
    "multiplier": 1.0
   },
   {
    "name": "天際俯衝",
    "type": "active",
    "effect": "damage",
    "multiplier": 1.45,
    "cooldown": 2
   },
   {
    "name": "破曉裁決",
    "type": "active",
    "effect": "damage_all",
    "multiplier": 0.64,
    "cooldown": 3
   }
  ]
 },
 {
  "id": "halo_capybara",
  "name": "光環水豚",
  "element": "light",
  "quality": "normal",
  "icon": "🐾",
  "baseHp": 524,
  "baseAtk": 88,
  "baseDef": 48,
  "art": "assets/pack/halo_capybara.png",
  "skills": [
   {
    "name": "安心波",
    "type": "basic",
    "effect": "damage",
    "multiplier": 1.0
   },
   {
    "name": "靜謐領域",
    "type": "active",
    "effect": "heal",
    "multiplier": 1.0,
    "cooldown": 1
   },
   {
    "name": "眾生休憩",
    "type": "active",
    "effect": "heal_all",
    "multiplier": 0.72,
    "cooldown": 3
   }
  ]
 },
 {
  "id": "mirror_armadillo",
  "name": "鏡甲犰狳",
  "element": "light",
  "quality": "rare",
  "icon": "🐾",
  "baseHp": 725,
  "baseAtk": 131,
  "baseDef": 71,
  "art": "assets/pack/mirror_armadillo.png",
  "skills": [
   {
    "name": "鏡甲",
    "type": "basic",
    "effect": "damage",
    "multiplier": 1.0
   },
   {
    "name": "光球滾擊",
    "type": "active",
    "effect": "shield",
    "multiplier": 0.85,
    "cooldown": 3,
    "value": 0.8
   },
   {
    "name": "萬鏡結界",
    "type": "active",
    "effect": "damage",
    "multiplier": 1.4,
    "cooldown": 2
   }
  ]
 },
 {
  "id": "star_ram",
  "name": "星冠白羊",
  "element": "light",
  "quality": "rare",
  "icon": "🐾",
  "baseHp": 658,
  "baseAtk": 134,
  "baseDef": 58,
  "art": "assets/pack/star_ram.png",
  "skills": [
   {
    "name": "星塵角",
    "type": "basic",
    "effect": "damage",
    "multiplier": 1.0
   },
   {
    "name": "星冠鼓舞",
    "type": "active",
    "effect": "shield",
    "multiplier": 0.82,
    "cooldown": 3,
    "value": 0.8
   },
   {
    "name": "群星列陣",
    "type": "active",
    "effect": "buff_atk",
    "multiplier": 0.8,
    "cooldown": 4,
    "value": 0.85
   }
  ]
 },
 {
  "id": "lantern_koi",
  "name": "燈星錦鯉",
  "element": "light",
  "quality": "rare",
  "icon": "🐾",
  "baseHp": 625,
  "baseAtk": 137,
  "baseDef": 63,
  "art": "assets/pack/lantern_koi.png",
  "skills": [
   {
    "name": "燈星滴",
    "type": "basic",
    "effect": "damage",
    "multiplier": 1.0
   },
   {
    "name": "祈願游",
    "type": "active",
    "effect": "heal",
    "multiplier": 1.0,
    "cooldown": 1
   },
   {
    "name": "萬願天河",
    "type": "active",
    "effect": "heal_all",
    "multiplier": 0.72,
    "cooldown": 3
   }
  ]
 },
 {
  "id": "auric_stag_beetle",
  "name": "聖金鍬甲",
  "element": "light",
  "quality": "epic",
  "icon": "🐾",
  "baseHp": 2062,
  "baseAtk": 500,
  "baseDef": 278,
  "art": "assets/pack/auric_stag_beetle.png",
  "skills": [
   {
    "name": "金顎剪",
    "type": "basic",
    "effect": "damage",
    "multiplier": 1.0
   },
   {
    "name": "日耀投擲",
    "type": "active",
    "effect": "damage",
    "multiplier": 1.45,
    "cooldown": 2
   },
   {
    "name": "聖金處刑",
    "type": "active",
    "effect": "damage_all",
    "multiplier": 0.64,
    "cooldown": 3
   }
  ]
 },
 {
  "id": "cathedral_elephant",
  "name": "聖堂象",
  "element": "light",
  "quality": "epic",
  "icon": "🐾",
  "baseHp": 2315,
  "baseAtk": 458,
  "baseDef": 324,
  "art": "assets/pack/cathedral_elephant.png",
  "skills": [
   {
    "name": "聖堂踏",
    "type": "basic",
    "effect": "damage",
    "multiplier": 1.0
   },
   {
    "name": "彩窗護佑",
    "type": "active",
    "effect": "shield",
    "multiplier": 0.85,
    "cooldown": 3,
    "value": 0.8
   },
   {
    "name": "移動聖域",
    "type": "active",
    "effect": "damage",
    "multiplier": 1.4,
    "cooldown": 2
   }
  ]
 },
 {
  "id": "comet_heron",
  "name": "彗星蒼鷺",
  "element": "light",
  "quality": "epic",
  "icon": "🐾",
  "baseHp": 2076,
  "baseAtk": 461,
  "baseDef": 278,
  "art": "assets/pack/comet_heron.png",
  "skills": [
   {
    "name": "星喙",
    "type": "basic",
    "effect": "damage",
    "multiplier": 1.0
   },
   {
    "name": "引星步",
    "type": "active",
    "effect": "damage",
    "multiplier": 1.35,
    "cooldown": 2
   },
   {
    "name": "彗軌封陣",
    "type": "active",
    "effect": "damage_all",
    "multiplier": 0.62,
    "cooldown": 3
   }
  ]
 },
 {
  "id": "crown_unicorn",
  "name": "王冠獨角獸",
  "element": "light",
  "quality": "mythical",
  "icon": "🐾",
  "baseHp": 9133,
  "baseAtk": 1789,
  "baseDef": 925,
  "art": "assets/pack/crown_unicorn.png",
  "skills": [
   {
    "name": "王光突刺",
    "type": "basic",
    "effect": "damage",
    "multiplier": 1.0
   },
   {
    "name": "皇家恩典",
    "type": "active",
    "effect": "damage",
    "multiplier": 1.5,
    "cooldown": 2
   },
   {
    "name": "天國巡行",
    "type": "active",
    "effect": "damage_all",
    "multiplier": 0.7,
    "cooldown": 3
   }
  ]
 },
 {
  "id": "ink_chameleon",
  "name": "墨影變色龍",
  "element": "dark",
  "quality": "normal",
  "icon": "🐾",
  "baseHp": 500,
  "baseAtk": 88,
  "baseDef": 48,
  "art": "assets/pack/ink_chameleon.png",
  "skills": [
   {
    "name": "墨舌",
    "type": "basic",
    "effect": "damage",
    "multiplier": 1.0
   },
   {
    "name": "褪色斬",
    "type": "active",
    "effect": "damage",
    "multiplier": 1.35,
    "cooldown": 2
   },
   {
    "name": "萬象偽裝",
    "type": "active",
    "effect": "damage_all",
    "multiplier": 0.62,
    "cooldown": 3
   }
  ]
 },
 {
  "id": "grave_badger",
  "name": "墓土獾",
  "element": "dark",
  "quality": "normal",
  "icon": "🐾",
  "baseHp": 567,
  "baseAtk": 91,
  "baseDef": 60,
  "art": "assets/pack/grave_badger.png",
  "skills": [
   {
    "name": "墓爪",
    "type": "basic",
    "effect": "damage",
    "multiplier": 1.0
   },
   {
    "name": "掘墓突襲",
    "type": "active",
    "effect": "shield",
    "multiplier": 0.85,
    "cooldown": 3,
    "value": 0.8
   },
   {
    "name": "亡土堡壘",
    "type": "active",
    "effect": "damage",
    "multiplier": 1.4,
    "cooldown": 2
   }
  ]
 },
 {
  "id": "eclipse_moth",
  "name": "蝕月蛾",
  "element": "dark",
  "quality": "normal",
  "icon": "🐾",
  "baseHp": 514,
  "baseAtk": 94,
  "baseDef": 48,
  "art": "assets/pack/eclipse_moth.png",
  "skills": [
   {
    "name": "月蝕粉",
    "type": "basic",
    "effect": "damage",
    "multiplier": 1.0
   },
   {
    "name": "暗月遮蔽",
    "type": "active",
    "effect": "shield",
    "multiplier": 0.82,
    "cooldown": 3,
    "value": 0.8
   },
   {
    "name": "全蝕",
    "type": "active",
    "effect": "buff_atk",
    "multiplier": 0.8,
    "cooldown": 4,
    "value": 0.85
   }
  ]
 },
 {
  "id": "hollow_hyena",
  "name": "空洞鬣狗",
  "element": "dark",
  "quality": "rare",
  "icon": "🐾",
  "baseHp": 641,
  "baseAtk": 149,
  "baseDef": 63,
  "art": "assets/pack/hollow_hyena.png",
  "skills": [
   {
    "name": "裂笑咬",
    "type": "basic",
    "effect": "damage",
    "multiplier": 1.0
   },
   {
    "name": "聞血追獵",
    "type": "active",
    "effect": "damage",
    "multiplier": 1.45,
    "cooldown": 2
   },
   {
    "name": "群墓狂笑",
    "type": "active",
    "effect": "damage_all",
    "multiplier": 0.64,
    "cooldown": 3
   }
  ]
 },
 {
  "id": "obsidian_gorilla",
  "name": "黑曜巨猿",
  "element": "dark",
  "quality": "rare",
  "icon": "🐾",
  "baseHp": 722,
  "baseAtk": 128,
  "baseDef": 66,
  "art": "assets/pack/obsidian_gorilla.png",
  "skills": [
   {
    "name": "黑曜拳",
    "type": "basic",
    "effect": "damage",
    "multiplier": 1.0
   },
   {
    "name": "裂地護體",
    "type": "active",
    "effect": "shield",
    "multiplier": 0.85,
    "cooldown": 3,
    "value": 0.8
   },
   {
    "name": "深夜山崩",
    "type": "active",
    "effect": "damage",
    "multiplier": 1.4,
    "cooldown": 2
   }
  ]
 },
 {
  "id": "nightmare_tapir",
  "name": "夢魘貘",
  "element": "dark",
  "quality": "rare",
  "icon": "🐾",
  "baseHp": 655,
  "baseAtk": 131,
  "baseDef": 63,
  "art": "assets/pack/nightmare_tapir.png",
  "skills": [
   {
    "name": "夢霧吸取",
    "type": "basic",
    "effect": "damage",
    "multiplier": 1.0
   },
   {
    "name": "沉眠鼻息",
    "type": "active",
    "effect": "damage",
    "multiplier": 1.35,
    "cooldown": 2
   },
   {
    "name": "噩夢具現",
    "type": "active",
    "effect": "damage_all",
    "multiplier": 0.62,
    "cooldown": 3
   }
  ]
 },
 {
  "id": "chain_centipede",
  "name": "鎖魂蜈蚣",
  "element": "dark",
  "quality": "epic",
  "icon": "🐾",
  "baseHp": 2052,
  "baseAtk": 506,
  "baseDef": 278,
  "art": "assets/pack/chain_centipede.png",
  "skills": [
   {
    "name": "鎖鏈刺",
    "type": "basic",
    "effect": "damage",
    "multiplier": 1.0
   },
   {
    "name": "纏魂擊",
    "type": "active",
    "effect": "damage",
    "multiplier": 1.45,
    "cooldown": 2
   },
   {
    "name": "百節刑輪",
    "type": "active",
    "effect": "damage_all",
    "multiplier": 0.64,
    "cooldown": 3
   }
  ]
 },
 {
  "id": "phantom_raven",
  "name": "幽相烏鴉",
  "element": "dark",
  "quality": "epic",
  "icon": "🐾",
  "baseHp": 2059,
  "baseAtk": 464,
  "baseDef": 283,
  "art": "assets/pack/phantom_raven.png",
  "skills": [
   {
    "name": "幽羽",
    "type": "basic",
    "effect": "damage",
    "multiplier": 1.0
   },
   {
    "name": "換影護持",
    "type": "active",
    "effect": "shield",
    "multiplier": 0.82,
    "cooldown": 3,
    "value": 0.8
   },
   {
    "name": "預兆之夜",
    "type": "active",
    "effect": "buff_atk",
    "multiplier": 0.8,
    "cooldown": 4,
    "value": 0.85
   }
  ]
 },
 {
  "id": "void_anglerfish",
  "name": "虛空鮟鱇",
  "element": "dark",
  "quality": "epic",
  "icon": "🐾",
  "baseHp": 2066,
  "baseAtk": 455,
  "baseDef": 278,
  "art": "assets/pack/void_anglerfish.png",
  "skills": [
   {
    "name": "誘光",
    "type": "basic",
    "effect": "damage",
    "multiplier": 1.0
   },
   {
    "name": "黑潮吞噬",
    "type": "active",
    "effect": "damage",
    "multiplier": 1.35,
    "cooldown": 2
   },
   {
    "name": "無光海溝",
    "type": "active",
    "effect": "damage_all",
    "multiplier": 0.62,
    "cooldown": 3
   }
  ]
 },
 {
  "id": "abyss_mammoth",
  "name": "深淵猛獁",
  "element": "dark",
  "quality": "mythical",
  "icon": "🐾",
  "baseHp": 10215,
  "baseAtk": 1783,
  "baseDef": 1063,
  "art": "assets/pack/abyss_mammoth.png",
  "skills": [
   {
    "name": "深淵牙",
    "type": "basic",
    "effect": "damage",
    "multiplier": 1.0
   },
   {
    "name": "古獸壁壘",
    "type": "active",
    "effect": "shield",
    "multiplier": 0.85,
    "cooldown": 3,
    "value": 0.8
   },
   {
    "name": "終夜踐踏",
    "type": "active",
    "effect": "damage",
    "multiplier": 1.4,
    "cooldown": 2
   }
  ]
 }
];
  PACK_PETS.forEach(function (entry) { PET_DATA.push(entry); });
}());
