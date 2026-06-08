var GameState = (function () {
  var SAVE_KEY = 'joseRPG_v1';

  function createPetInstance(petId, level) {
    return {
      uuid:     Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      petId:    petId,
      level:    level || 1,
      exp:      0,
      stars:    1,
      isActive: false,
      activeSlot: -1
    };
  }

  function defaultState() {
    var pet1 = createPetInstance('molten_ball',    3);
    var pet2 = createPetInstance('leaf_ear_rabbit', 3);
    var pet3 = createPetInstance('bubble_whale',   3);
    pet1.isActive = true; pet1.activeSlot = 0;
    pet2.isActive = true; pet2.activeSlot = 1;
    pet3.isActive = true; pet3.activeSlot = 2;

    return {
      gold:         500,
      diamond:      100,
      currentStage: 1,
      maxStage:     1,
      inventory:    [pet1, pet2, pet3],
      maxInventory: 1000,
      items: {
        revival_potion: 2,
        exp_small:  3,
        exp_medium: 1,
        exp_large:  0,
        gacha_ticket: 0
      },
      pullsSinceEpic:      0,
      pullsSinceLegendary: 0,
      totalPulls:          0,
      lastSaveTime:        Date.now(),
      lastLoginDate:       null,
      loginStreak:         0,
      achievements: {}
    };
  }

  var state = null;

  return {
    init: function () {
      var saved = localStorage.getItem(SAVE_KEY);
      if (saved) {
        try {
          state = JSON.parse(saved);
          if (state.maxInventory < 1000) state.maxInventory = 1000;
        } catch (e) {
          state = defaultState();
        }
      } else {
        state = defaultState();
      }
    },

    get: function () { return state; },

    save: function () {
      state.lastSaveTime = Date.now();
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    },

    reset: function () {
      localStorage.removeItem(SAVE_KEY);
      state = defaultState();
    },

    createPetInstance: createPetInstance,

    addGold: function (amount) {
      state.gold = Math.max(0, state.gold + amount);
      this.save();
    },

    spendGold: function (amount) {
      if (state.gold < amount) return false;
      state.gold -= amount;
      this.save();
      return true;
    },

    addDiamond: function (amount) {
      state.diamond = Math.max(0, state.diamond + amount);
      this.save();
    },

    spendDiamond: function (amount) {
      if (state.diamond < amount) return false;
      state.diamond -= amount;
      this.save();
      return true;
    },

    addItem: function (itemId, count) {
      if (!state.items[itemId]) state.items[itemId] = 0;
      state.items[itemId] += (count || 1);
      this.save();
    },

    spendItem: function (itemId, count) {
      count = count || 1;
      if (!state.items[itemId] || state.items[itemId] < count) return false;
      state.items[itemId] -= count;
      this.save();
      return true;
    },

    addPetToInventory: function (petInstance) {
      if (state.inventory.length >= state.maxInventory) return false;
      state.inventory.push(petInstance);
      this.save();
      return true;
    },

    removePetFromInventory: function (uuid) {
      var idx = state.inventory.findIndex(function (p) { return p.uuid === uuid; });
      if (idx === -1) return false;
      var pet = state.inventory[idx];
      if (pet.isActive) {
        pet.isActive = false;
        pet.activeSlot = -1;
      }
      state.inventory.splice(idx, 1);
      this.save();
      return true;
    },

    getActivePets: function () {
      return [0, 1, 2].map(function (slot) {
        return state.inventory.find(function (p) { return p.isActive && p.activeSlot === slot; }) || null;
      });
    },

    setActiveSlot: function (uuid, slot) {
      // clear current pet in slot
      state.inventory.forEach(function (p) {
        if (p.activeSlot === slot) { p.isActive = false; p.activeSlot = -1; }
      });
      if (uuid === null) { this.save(); return; }
      var pet = state.inventory.find(function (p) { return p.uuid === uuid; });
      if (!pet) return;
      if (pet.isActive) { pet.isActive = false; pet.activeSlot = -1; }
      pet.isActive  = true;
      pet.activeSlot = slot;
      this.save();
    },

    unlockStage: function (stageNum) {
      if (stageNum > state.maxStage) {
        state.maxStage = stageNum;
      }
      this.save();
    }
  };
})();
