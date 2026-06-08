var GachaSystem = (function () {
  var RATES = [
    { quality: 'normal',    weight: 600 },
    { quality: 'rare',      weight: 250 },
    { quality: 'elite',     weight: 100 },
    { quality: 'epic',      weight: 35  },
    { quality: 'legendary', weight: 13  },
    { quality: 'mythical',  weight: 2   }
  ];
  var TOTAL_WEIGHT = RATES.reduce(function (s, r) { return s + r.weight; }, 0);

  function pickQuality(state) {
    var s = state;

    // Pity: 30 pulls -> guaranteed epic+
    if (s.pullsSinceEpic >= 29) {
      s.pullsSinceEpic = 0;
      var epicPlus = ['epic', 'legendary', 'mythical'];
      var filtered = RATES.filter(function (r) { return epicPlus.indexOf(r.quality) !== -1; });
      return rollFrom(filtered);
    }

    // Pity: 100 pulls -> guaranteed legendary+
    if (s.pullsSinceLegendary >= 99) {
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
      var cost = count === 10 ? 900 : count * 100;
      var state = GameState.get();

      // Check tickets first (only for single pull)
      if (count === 1 && state.items.gacha_ticket > 0) {
        if (!GameState.spendItem('gacha_ticket', 1)) return null;
      } else {
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
        epicPityAt:          30,
        legPityAt:           100,
        totalPulls:          s.totalPulls
      };
    }
  };
})();
