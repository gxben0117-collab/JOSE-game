var GachaSystem = (function () {
  var RATES = [
    { quality: 'normal',    weight: 700 },  // 70%
    { quality: 'rare',      weight: 200 },  // 20%
    { quality: 'elite',     weight: 80  },  // 8%
    { quality: 'epic',      weight: 17.8},  // 1.78%
    { quality: 'legendary', weight: 2   },  // 0.2%
    { quality: 'mythical',  weight: 0.2 }   // 0.02%
  ];
  var TOTAL_WEIGHT = RATES.reduce(function (s, r) { return s + r.weight; }, 0);

  function pickQuality(state) {
    var s = state;

    // Pity: 300 pulls -> guaranteed epic+
    if (s.pullsSinceEpic >= 299) {
      s.pullsSinceEpic = 0;
      var epicPlus = ['epic', 'legendary', 'mythical'];
      var filtered = RATES.filter(function (r) { return epicPlus.indexOf(r.quality) !== -1; });
      return rollFrom(filtered);
    }

    // Pity: 3000 pulls -> guaranteed legendary+
    if (s.pullsSinceLegendary >= 2999) {
      s.pullsSinceLegendary = 0;
      s.pullsSinceEpic = 0;
      var legPlus = ['legendary', 'mythical'];
      var filtered2 = RATES.filter(function (r) { return legPlus.indexOf(r.quality) !== -1; });
      return rollFrom(filtered2);
    }

    return rollFrom(RATES);
  }

  function rollFrom(pool) {
    var total = pool.reduce(function (s, r) { return s + r.weight; }, 0);
    var roll  = Math.random() * total;
    var acc   = 0;
    for (var i = 0; i < pool.length; i++) {
      acc += pool[i].weight;
      if (roll < acc) return pool[i].quality;
    }
    return pool[pool.length - 1].quality;
  }

  function pickPetByQuality(quality) {
    var pool = PET_DATA.filter(function (p) { return p.quality === quality; });
    if (!pool.length) pool = PET_DATA.filter(function (p) { return p.quality === 'normal'; });
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function doPull() {
    var state = GameState.get();
    var quality = pickQuality(state);

    var isEpicPlus = ['epic','legendary','mythical'].indexOf(quality) !== -1;
    var isLegPlus  = ['legendary','mythical'].indexOf(quality) !== -1;

    state.pullsSinceEpic++;
    state.pullsSinceLegendary++;
    state.totalPulls++;
    if (isEpicPlus)  state.pullsSinceEpic      = 0;
    if (isLegPlus)   state.pullsSinceLegendary  = 0;

    var tmpl = pickPetByQuality(quality);
    var inst = GameState.createPetInstance(tmpl.id, 1);
    return inst;
  }

  return {
    pull: function (count) {
      count = count || 1;
      var state = GameState.get();

      // 單抽：優先使用券
      if (count === 1 && state.items.gacha_ticket > 0) {
        if (!GameState.spendItem('gacha_ticket', 1)) return null;
      }
      // 10連抽：檢查是否有10張券
      else if (count === 10 && state.items.gacha_ticket >= 10) {
        if (!GameState.spendItem('gacha_ticket', 10)) return null;
      }
      // 沒券或券不足，用鑽石
      else {
        var cost = count === 10 ? 900 : count * 100;
        if (!GameState.spendDiamond(cost)) return null;
      }

      var results = [];
      for (var i = 0; i < count; i++) {
        var inst = doPull();
        var added = GameState.addPetToInventory(inst);
        results.push({ instance: inst, added: added });
      }
      GameState.save();
      return results;
    },

    getPityInfo: function () {
      var s = GameState.get();
      return {
        pullsSinceEpic:      s.pullsSinceEpic,
        pullsSinceLegendary: s.pullsSinceLegendary,
        epicPityAt:          300,
        legPityAt:           3000,
        totalPulls:          s.totalPulls
      };
    }
  };
})();
