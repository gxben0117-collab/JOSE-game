var OfflineSystem = (function () {
  var MAX_HOURS = 12;

  return {
    calculate: function () {
      var state   = GameState.get();
      var now     = Date.now();
      var elapsed = (now - state.lastSaveTime) / 1000 / 3600; // hours
      elapsed     = Math.min(elapsed, MAX_HOURS);

      if (elapsed < 0.05) return null; // less than 3 min, skip

      var stage   = state.maxStage || 1;
      var gold    = Math.floor(stage * 50 * elapsed);
      var exp     = Math.floor(stage * 20 * elapsed);

      return {
        hours:   Math.floor(elapsed * 10) / 10,
        gold:    gold,
        exp:     exp
      };
    },

    apply: function (income) {
      if (!income) return;
      GameState.addGold(income.gold);

      // 召喚師獲得經驗
      GameState.addPlayerExp(income.exp);

      // 寵物獲得經驗
      var pets = GameState.getActivePets().filter(Boolean);
      pets.forEach(function (p) {
        PetSystem.addExp(p, income.exp);
      });

      GameState.save();
    }
  };
})();
