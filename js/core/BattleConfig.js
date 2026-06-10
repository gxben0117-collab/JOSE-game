// 戰鬥系統配置
var BATTLE_CONFIG = {
  // 關卡設定
  MIN_STAGE: 1,
  MAX_STAGE: 999,
  MAX_ROUNDS: 60,

  // AP 設定
  AP_COST: 10,
  FLEE_AP_REFUND: 5,

  // 戰鬥速度
  SPEEDS: [1, 2, 4],
  DEFAULT_SPEED: 1,

  // 動畫延遲（毫秒）
  ANIMATION_DELAYS: {
    START: 500,
    ROUND: 200,
    ATTACK: 620,
    SKILL: 820,
    SKILL_ALL: 820,
    HEAL: 700,
    BUFF: 600,
    ENEMY_ATTACK: 620,
    WIN: 900,
    LOSE: 800,
    MSG: 500,
    DEFAULT: 100
  },

  // 屬性加成
  ELEMENT_BONUS: {
    STRONG: 1.3,  // 屬性優勢
    NORMAL: 1.0,  // 普通
    WEAK: 0.7     // 屬性劣勢
  },

  // 傷害計算
  DAMAGE: {
    MIN_DAMAGE: 1,
    DEF_REDUCTION: 0.4,
    VARIANCE_MIN: 0.9,
    VARIANCE_MAX: 1.1
  },

  // Buff 持續回合數
  BUFF_DURATION: {
    DEFAULT: 3,
    SHIELD: 2,
    BURN: 3
  },

  // AI 行為權重
  AI_WEIGHTS: {
    TARGET_LOW_HP: 0.5,      // 50% 攻擊低血量
    TARGET_HIGH_ATK: 0.3,    // 30% 攻擊高攻擊力
    TARGET_RANDOM: 0.2       // 20% 隨機
  }
};
