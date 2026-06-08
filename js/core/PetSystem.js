var PetSystem = (function () {
  var EXP_TABLE = (function () {
    var table = [0];
    for (var i = 1; i <= 100; i++) {
      table.push(Math.floor(100 * Math.pow(i, 1.8)));
    }
    return table;
  })();

  var STAR_BONUS = [0, 0, 0.15, 0.35, 0.65, 1.2];

  return {
    getTemplate: function (petId) {
      return PET_DATA.find(function (p) { return p.id === petId; });
    },

    getStats: function (petInstance) {
      var tmpl = this.getTemplate(petInstance.petId);
      if (!tmpl) return null;

      var qualMult  = QUALITY_CONFIG[tmpl.quality].statMult;
      var levelMult = 1 + (petInstance.level - 1) * 0.05;
      var starMult  = 1 + (STAR_BONUS[petInstance.stars] || 0);

      return {
        name:    tmpl.name,
        icon:    tmpl.icon,
        element: tmpl.element,
        quality: tmpl.quality,
        skills:  tmpl.skills,
        maxHp:   Math.floor(tmpl.baseHp  * qualMult * levelMult * starMult),
        atk:     Math.floor(tmpl.baseAtk * qualMult * levelMult * starMult),
        def:     Math.floor(tmpl.baseDef * qualMult * levelMult * starMult)
      };
    },

    expForLevel: function (level) {
      return EXP_TABLE[level] || 999999999;
    },

    totalExpForLevel: function (level) {
      var total = 0;
      for (var i = 1; i < level; i++) total += EXP_TABLE[i];
      return total;
    },

    addExp: function (petInstance, amount) {
      var leveled = false;
      petInstance.exp += amount;
      while (petInstance.level < 100) {
        var needed = this.expForLevel(petInstance.level);
        if (petInstance.exp >= needed) {
          petInstance.exp -= needed;
          petInstance.level++;
          leveled = true;
        } else {
          break;
        }
      }
      if (petInstance.level >= 100) petInstance.exp = 0;
      GameState.save();
      return leveled;
    },

    canStarUp: function (petInstance) {
      if (petInstance.stars >= 5) return false;
      var tmpl  = this.getTemplate(petInstance.petId);
      var state = GameState.get();
      var sameCount = state.inventory.filter(function (p) {
        return p.uuid !== petInstance.uuid && p.petId === petInstance.petId;
      }).length;
      if (sameCount >= 3) return true;
      // 5 同品質替代品 = 1 同名名額；共需填滿 (3 - sameCount) 個名額
      var sameQuality = state.inventory.filter(function (p) {
        return p.uuid !== petInstance.uuid && p.petId !== petInstance.petId &&
               PetSystem.getTemplate(p.petId).quality === tmpl.quality;
      }).length;
      return Math.floor(sameQuality / 5) >= (3 - sameCount);
    },

    starUp: function (petInstance) {
      if (petInstance.stars >= 5) return false;
      var state = GameState.get();
      var tmpl  = this.getTemplate(petInstance.petId);

      var sameUUIDs = state.inventory
        .filter(function (p) { return p.uuid !== petInstance.uuid && p.petId === petInstance.petId; })
        .map(function (p) { return p.uuid; });

      var subUUIDs = state.inventory
        .filter(function (p) {
          return p.uuid !== petInstance.uuid && p.petId !== petInstance.petId &&
                 PetSystem.getTemplate(p.petId).quality === tmpl.quality;
        })
        .map(function (p) { return p.uuid; });

      var toRemove = [];
      var needed = 3;
      for (var i = 0; i < sameUUIDs.length && needed > 0; i++) {
        toRemove.push(sameUUIDs[i]);
        needed--;
      }
      while (needed > 0 && subUUIDs.length >= 5) {
        for (var j = 0; j < 5 && subUUIDs.length > 0; j++) {
          toRemove.push(subUUIDs.shift());
        }
        needed--;
      }
      if (needed > 0) return false;

      toRemove.forEach(function (uuid) { GameState.removePetFromInventory(uuid); });
      petInstance.stars++;
      GameState.save();
      return true;
    },

    useExpItem: function (petInstance, itemId) {
      var item = ITEM_DATA[itemId];
      if (!item || item.type !== 'exp') return false;
      if (!GameState.spendItem(itemId, 1)) return false;
      this.addExp(petInstance, item.expValue);
      return true;
    },

    getQualityLabel: function (quality) {
      return QUALITY_CONFIG[quality] ? QUALITY_CONFIG[quality].label : quality;
    },

    getQualityColor: function (quality) {
      return QUALITY_CONFIG[quality] ? QUALITY_CONFIG[quality].color : '#fff';
    }
  };
})();
