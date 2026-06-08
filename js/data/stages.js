var BOSS_DATA = {
  10:  { name: '岩漿巨獸',   icon: '🗿', minionName: '岩石傀儡', minionIcon: '🪨', hpMult: 5,  atkMult: 2.5, defMult: 2.0 },
  20:  { name: '毒牙蜘蛛王', icon: '🕷️', minionName: '毒蜘蛛',   minionIcon: '🕸️', hpMult: 5,  atkMult: 2.5, defMult: 2.0 },
  30:  { name: '冰霜巨龍',   icon: '🐲', minionName: '寒冰守衛', minionIcon: '❄️', hpMult: 6,  atkMult: 3.0, defMult: 2.2 },
  40:  { name: '烈焰惡魔',   icon: '😈', minionName: '火焰魔將', minionIcon: '🔥', hpMult: 6,  atkMult: 3.0, defMult: 2.2 },
  50:  { name: '深淵領主',   icon: '👿', minionName: '深淵衛兵', minionIcon: '⛓️', hpMult: 7,  atkMult: 3.5, defMult: 2.5 },
  60:  { name: '雷神巨獸',   icon: '⚡', minionName: '雷電衛士', minionIcon: '🌩️', hpMult: 7,  atkMult: 3.5, defMult: 2.5 },
  70:  { name: '暗影之王',   icon: '🌑', minionName: '暗影刺客', minionIcon: '🗡️', hpMult: 8,  atkMult: 4.0, defMult: 3.0 },
  80:  { name: '混沌巨龍',   icon: '🌀', minionName: '混沌碎片', minionIcon: '💠', hpMult: 9,  atkMult: 4.5, defMult: 3.0 },
  90:  { name: '毀滅者',     icon: '💀', minionName: '死亡騎士', minionIcon: '🪦', hpMult: 10, atkMult: 5.0, defMult: 3.5 },
  100: { name: '神界魔王',   icon: '👑', minionName: '神殿衛士', minionIcon: '🛡️', hpMult: 15, atkMult: 6.0, defMult: 4.0 }
};

var MONSTER_NAMES = [
  '哥布林','骷髏戰士','岩石怪','毒液蜥','黑影狼','鐵甲蟹',
  '電氣魚','火焰蝙蝠','寒冰熊','毒蘑菇人','石頭巨人','沼澤怪',
  '暗黑騎士','熔岩蟲','深海章魚','森林妖精'
];
var MINION_NAMES = ['小哥布林','骷髏兵','岩石小怪','蜥蜴小兵','暗影蝙蝠','毒液蟲','火球精靈','冰晶碎片'];
var MINION_ICONS = ['👹','💀','🪨','🦎','🦇','🐛','🔮','❄️'];

// 怪物屬性對應（根據關卡循環分配）
var MONSTER_ELEMENTS = ['fire', 'forest', 'ocean', 'fire', 'forest', 'ocean', 'fire', 'forest', 'ocean', 'fire', 'forest', 'ocean', 'fire', 'forest', 'ocean', 'forest'];
var MINION_ELEMENTS = ['fire', 'forest', 'ocean', 'fire', 'forest', 'ocean', 'fire', 'ocean'];

/*
  getStageConfig returns:
  {
    isBoss: bool,
    frontRow: [ { id:'ef-0', name, icon, level, maxHp, atk, def }, ... ],
    backRow:  [ { id:'eb-0', name, icon, level, maxHp, atk, def, isBoss? } ]
  }
  frontRow = minions that block attacks; backRow = boss/leader (hit only after frontRow dead)
*/
function getStageConfig(stageNum) {
  var isBoss = stageNum % 10 === 0;
  var level  = stageNum;

  if (isBoss) {
    var boss    = BOSS_DATA[stageNum] || { name: 'Boss', icon: '💀', minionName: '小兵', minionIcon: '👾', hpMult: 5, atkMult: 2.5, defMult: 2.0 };
    var bossHp  = Math.floor(level * 200 * boss.hpMult);
    var bossAtk = Math.floor(level * 25  * boss.atkMult);
    var bossDef = Math.floor(level * 10  * boss.defMult);
    var mLv     = Math.max(1, level - 2);
    var mHp     = Math.floor(bossHp  * 0.20);
    var mAtk    = Math.floor(bossAtk * 0.40);
    var mDef    = Math.floor(bossDef * 0.40);

    // Boss 屬性根據關卡循環分配
    var bossElement = ['fire', 'ocean', 'forest'][(stageNum / 10 - 1) % 3];

    return {
      isBoss: true,
      frontRow: [
        { id: 'ef-0', name: boss.minionName, icon: boss.minionIcon, level: mLv, maxHp: mHp, atk: mAtk, def: mDef, element: bossElement },
        { id: 'ef-1', name: boss.minionName, icon: boss.minionIcon, level: mLv, maxHp: mHp, atk: mAtk, def: mDef, element: bossElement }
      ],
      backRow: [
        { id: 'eb-0', name: boss.name, icon: boss.icon, level: level, maxHp: bossHp, atk: bossAtk, def: bossDef, isBoss: true, element: bossElement }
      ]
    };
  }

  var baseHp  = level * 200;
  var baseAtk = level * 25;
  var baseDef = level * 10;
  var mIdx    = stageNum % MINION_NAMES.length;
  var eIdx    = (stageNum + 5) % MONSTER_NAMES.length;
  var mLv2    = Math.max(1, level - 1);
  var mHp2    = Math.floor(baseHp  * 0.35);
  var mAtk2   = Math.floor(baseAtk * 0.55);
  var mDef2   = Math.floor(baseDef * 0.55);

  // 小怪和敵人屬性
  var minionElement = MINION_ELEMENTS[mIdx % MINION_ELEMENTS.length];
  var enemyElement = MONSTER_ELEMENTS[eIdx % MONSTER_ELEMENTS.length];

  return {
    isBoss: false,
    frontRow: [
      { id: 'ef-0', name: MINION_NAMES[mIdx], icon: MINION_ICONS[mIdx], level: mLv2, maxHp: mHp2, atk: mAtk2, def: mDef2, element: minionElement },
      { id: 'ef-1', name: MINION_NAMES[mIdx], icon: MINION_ICONS[mIdx], level: mLv2, maxHp: mHp2, atk: mAtk2, def: mDef2, element: minionElement }
    ],
    backRow: [
      { id: 'eb-0', name: MONSTER_NAMES[eIdx], icon: '👾', level: level, maxHp: baseHp, atk: baseAtk, def: baseDef, element: enemyElement }
    ]
  };
}

function getStageReward(stageNum, isBoss) {
  var gold, diamond, exp, tickets = 0;
  if (stageNum <= 10) {
    gold    = 20 + Math.floor(Math.random() * 31);
    diamond = Math.random() < 0.3 ? 1 : 0;
    exp     = stageNum * 30;
  } else if (stageNum <= 30) {
    gold    = 50 + Math.floor(Math.random() * 51);
    diamond = Math.random() < 0.4 ? (Math.random() < 0.5 ? 1 : 2) : 0;
    exp     = stageNum * 40;
  } else if (stageNum <= 50) {
    gold    = 100 + Math.floor(Math.random() * 201);
    diamond = Math.random() < 0.5 ? (1 + Math.floor(Math.random() * 3)) : 0;
    exp     = stageNum * 50;
  } else {
    gold    = 300 + Math.floor(Math.random() * 201);
    diamond = 3 + Math.floor(Math.random() * 8);
    exp     = stageNum * 60;
  }
  if (isBoss) {
    gold    *= 10;
    diamond *= 10;
    exp     *= 5;
    if (stageNum >= 50) tickets = 2;
    else if (stageNum >= 30) tickets = 1;
  }
  return {
    gold:    Math.floor(gold),
    diamond: Math.floor(diamond),
    exp:     Math.floor(exp),
    tickets: tickets,
    items:   getDropItems(stageNum, isBoss)
  };
}

function getDropItems(stageNum, isBoss) {
  var items = [];
  if (isBoss) {
    items.push({ id: 'exp_small', count: 2 });
    if (stageNum >= 30) items.push({ id: 'exp_medium', count: 1 });
    if (stageNum >= 50) items.push({ id: 'exp_large',  count: 1 });
    items.push({ id: 'revival_potion', count: 1 });
  } else if (Math.random() < 0.25) {
    items.push({ id: 'exp_small', count: 1 });
  } else if (Math.random() < 0.08) {
    items.push({ id: 'revival_potion', count: 1 });
  }
  return items;
}
