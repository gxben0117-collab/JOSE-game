var ITEM_DATA = {
  revival_potion: {
    id: 'revival_potion',
    name: '復活藥',
    icon: '💊',
    description: '復活1隻死亡寵物，恢復50%血量',
    type: 'combat',
    goldPrice: 1000,
    diamondPrice: null
  },
  exp_small: {
    id: 'exp_small',
    name: '小型經驗藥',
    icon: '🧪',
    description: '給予目標寵物 +100 經驗值',
    type: 'exp',
    expValue: 100,
    goldPrice: 500,
    diamondPrice: null
  },
  exp_medium: {
    id: 'exp_medium',
    name: '中型經驗藥',
    icon: '⚗️',
    description: '給予目標寵物 +1000 經驗值',
    type: 'exp',
    expValue: 1000,
    goldPrice: 2000,
    diamondPrice: null
  },
  exp_large: {
    id: 'exp_large',
    name: '大型經驗藥',
    icon: '🔮',
    description: '給予目標寵物 +10000 經驗值',
    type: 'exp',
    expValue: 10000,
    goldPrice: null,
    diamondPrice: 50
  },
  gacha_ticket: {
    id: 'gacha_ticket',
    name: '抽獎券',
    icon: '🎫',
    description: '可使用1次抽獎（等同100鑽石）',
    type: 'gacha',
    goldPrice: null,
    diamondPrice: null
  }
};

var GOLD_SHOP = [
  { itemId: 'exp_small',      count: 3,  goldPrice: 1200 },
  { itemId: 'exp_medium',     count: 1,  goldPrice: 2000 },
  { itemId: 'revival_potion', count: 1,  goldPrice: 1000 },
  { itemId: 'revival_potion', count: 5,  goldPrice: 4000 }
];

var DIAMOND_SHOP = [
  { itemId: 'exp_large',      count: 1,  diamondPrice: 50  },
  { itemId: 'revival_potion', count: 10, diamondPrice: 80  },
  { label: '背包 +10格',      type: 'bag_expand', diamondPrice: 200 },
  { label: 'AP +50',          type: 'ap_buy',     diamondPrice: 100 }
];
