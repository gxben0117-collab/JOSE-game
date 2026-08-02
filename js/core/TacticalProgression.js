/* 戰棋存檔與養成服務。純資料操作，避免 UI 與 localStorage 規則散落在戰鬥程式。 */
(function (global) {
  'use strict';

  var SAVE_KEY = 'jose-tactics-progression-v2';
  var LEGACY_KEY = 'jose-tactics-progression-v1';
  var COMMANDER_CAPACITY_STEPS = [
    { level: 1, capacity: 12 }, { level: 3, capacity: 15 }, { level: 6, capacity: 18 },
    { level: 10, capacity: 21 }, { level: 15, capacity: 23 }, { level: 20, capacity: 25 },
    { level: 30, capacity: 26 }, { level: 45, capacity: 27 }, { level: 60, capacity: 28 },
    { level: 80, capacity: 29 }, { level: 100, capacity: 30 }
  ];
  /* 初始陣容：熔球獸、炎獅、火狐 + 會治療的葉耳兔。 */
  var DEFAULT_PARTY = ['molten_ball', 'fire_lion', 'fire_fox', 'leaf_ear_rabbit'];
  var STARTER_PETS = DEFAULT_PARTY.slice();
  var GACHA_TIER_WEIGHT = { normal: 34, rare: 30, elite: 18, epic: 10, legendary: 6, mythical: 2 };
  var PULL_COST = 30, PULL10_COST = 270;
  /* 測試期首次登入贈禮：保留既有 key，避免已領過舊贈禮的帳號再次補發。 */
  var TESTER_GIFT_KEY = 'crystals-5000-v1', TESTER_GIFT_CRYSTALS = 300, FEATURED_PITY = 200;
  var DAILY_QUESTS = [
    { id: 'd-battle', name: '每日遠征', description: '完成 3 場戰鬥', stat: 'battles', target: 3, reward: { crystals: 10 } },
    { id: 'd-win', name: '旗開得勝', description: '贏得 2 場戰鬥', stat: 'wins', target: 2, reward: { crystals: 10, medals: 3 } },
    { id: 'd-control', name: '控場訓練', description: '施放 4 次控場技能', stat: 'controls', target: 4, reward: { crystals: 10 } },
    { id: 'd-chest', name: '活躍寶箱', description: '完成上列全部每日任務', stat: 'chest', target: 3, reward: { crystals: 20, fusionCore: 1 } }
  ];
  var WEEKLY_QUESTS = [
    { id: 'w-tower-10', name: '守護塔週報', description: '本週成功通關 10 個不同無限塔樓層', stat: 'towerFloors', target: 10, reward: { crystals: 120, medals: 30, fusionCore: 5, gold: 800, essence: 30 } }
  ];
  var ELEMENTS = ['fire', 'forest', 'ocean', 'light', 'dark'];

  function deploymentCost(profile) {
    var size = Number(profile && profile.size) || 1;
    return size === 3 ? 3 : size === 2 ? 4 : 1;
  }

  function number(value, fallback) { value = Number(value); return Number.isFinite(value) ? value : fallback; }
  function commanderXpForLevel(level) { level = Math.max(1, Math.min(100, Math.floor(number(level, 1)))); return Math.round(60 * (level - 1) + 15 * (level - 1) * (level - 1)); }
  function commanderCapacityForLevel(level) {
    return COMMANDER_CAPACITY_STEPS.reduce(function (capacity, step) { return level >= step.level ? step.capacity : capacity; }, 12);
  }
  function emptyElements() { return { fire: 0, forest: 0, ocean: 0, light: 0, dark: 0 }; }
  function fresh() {
    return {
      version: 2,
      party: DEFAULT_PARTY.slice(),
      medals: 0,
      essences: emptyElements(),
      fusionCores: 0,
      evolution: {},
      fusion: {},
      skillPoints: {},
      skillTree: {},
      currentStage: 'c1-1',
      cleared: {},
      bestStars: {},
      wins: 0,
      battles: 0,
      skills: 0,
      controls: 0,
      bossKills: 0,
      questClaims: {},
      owned: {},
      crystals: 360,
      gold: 200,
      copies: {},
      stars: {},
      shards: {},
      daily: null,
      weekly: null,
      shop: null,
      home: { residents: [], lastCollect: 0 },
      /* 首頁展示只影響機庫立繪，不等同於取得／出戰該幻獸。 */
      homeDisplay: { petId: 'crimson_dragon', mode: 'fixed' },
      /* 劇情閱讀與一次性救援獎勵；以 key 保留給後續章節擴充。 */
      story: { seen: {}, rewards: {}, bonds: {} },
      testerGifts: { 'crystals-5000-v1': true },
      featuredPity: { date: '', pulls: 0 },
      tower: { best: 0 },
      bossRaid: null,
      commander: { level: 1, xp: 0 },
      formation: { party: [], positions: [], presets: {} },
      sound: true
    };
  }

  function TacticalProgression(options) {
    options = options || {};
    this.storage = options.storage || global.localStorage;
    this.profiles = options.profiles || [];
    this.content = options.content || global.TACTICAL_CONTENT;
    this.state = this.load();
    this.save();
  }

  TacticalProgression.prototype.validPet = function (id) {
    return this.profiles.some(function (pet) { return pet.id === id; });
  };

  TacticalProgression.prototype.load = function () {
    var raw = null;
    try { raw = JSON.parse(this.storage.getItem(SAVE_KEY)); } catch (_) { raw = null; }
    if (!raw) {
      try {
        var legacy = JSON.parse(this.storage.getItem(LEGACY_KEY));
        if (legacy) raw = {
          party: legacy.party,
          medals: legacy.medals,
          evolution: legacy.evolution,
          wins: legacy.wins,
          battles: legacy.battles
        };
      } catch (_) { raw = null; }
    }
    return this.migrate(raw || fresh());
  };

  TacticalProgression.prototype.migrate = function (raw) {
    var next = Object.assign(fresh(), raw || {});
    next.version = 2;
    /* 舊存檔已依 25 容量編隊，遷移時給予 Lv.20，避免既有隊伍被拆除。 */
    if (!next.commander || typeof next.commander !== 'object' || Array.isArray(next.commander)) next.commander = { level: raw ? 20 : 1, xp: commanderXpForLevel(raw ? 20 : 1) };
    next.commander.level = Math.max(1, Math.min(100, Math.floor(number(next.commander.level, raw ? 20 : 1))));
    next.commander.xp = Math.max(commanderXpForLevel(next.commander.level), number(next.commander.xp, commanderXpForLevel(next.commander.level)));
    // 出陣成本依指揮官容量：1×1=1、2×2=4、3×3=3；遷移時依原順序保留可容納成員。
    var party = Array.isArray(next.party) ? next.party.filter(this.validPet.bind(this)) : [];
    party = party.filter(function (id, index) { return party.indexOf(id) === index; });
    var used = 0, self = this;
    next.party = party.filter(function (id) {
      var cost = self.deploymentCost(id);
      if (used + cost > commanderCapacityForLevel(next.commander.level)) return false;
      used += cost; return true;
    });
    if (!next.party.length) next.party = DEFAULT_PARTY.slice();
    next.medals = Math.max(0, number(next.medals, 0));
    next.fusionCores = Math.max(0, number(next.fusionCores, 0));
    next.wins = Math.max(0, number(next.wins, 0));
    next.battles = Math.max(0, number(next.battles, 0));
    next.skills = Math.max(0, number(next.skills, 0));
    next.controls = Math.max(0, number(next.controls, 0));
    next.bossKills = Math.max(0, number(next.bossKills, 0));
    next.crystals = Math.max(0, number(next.crystals, 60));
    next.gold = Math.max(0, number(next.gold, 200));
    if (!next.owned || typeof next.owned !== 'object' || Array.isArray(next.owned)) next.owned = {};
    if (!next.shards || typeof next.shards !== 'object' || Array.isArray(next.shards)) next.shards = {};
    ['copies', 'stars'].forEach(function (key) {
      if (!next[key] || typeof next[key] !== 'object' || Array.isArray(next[key])) next[key] = {};
    });
    // 舊版靈魂碎片 1:1 併入複製體（星級／販售素材）。
    Object.keys(next.shards).forEach(function (id) {
      next.copies[id] = number(next.copies[id], 0) + number(next.shards[id], 0);
    });
    next.shards = {};
    if (!next.tower || typeof next.tower !== 'object' || Array.isArray(next.tower)) next.tower = { best: 0 };
    next.tower.best = Math.max(0, number(next.tower.best, 0));
    if (!next.bossRaid || typeof next.bossRaid !== 'object' || Array.isArray(next.bossRaid)) next.bossRaid = null;
    if (!next.weekly || typeof next.weekly !== 'object' || Array.isArray(next.weekly)) next.weekly = null;
    if (!next.formation || typeof next.formation !== 'object' || Array.isArray(next.formation)) next.formation = { party: [], positions: [], presets: {} };
    if (!Array.isArray(next.formation.party)) next.formation.party = [];
    if (!Array.isArray(next.formation.positions)) next.formation.positions = [];
    if (!next.formation.presets || typeof next.formation.presets !== 'object' || Array.isArray(next.formation.presets)) next.formation.presets = {};
    if (!next.home || typeof next.home !== 'object' || Array.isArray(next.home)) next.home = { residents: [], lastCollect: 0 };
    if (!Array.isArray(next.home.residents)) next.home.residents = [];
    next.home.residents = next.home.residents.filter(this.validPet.bind(this)).slice(0, 3);
    next.home.lastCollect = Math.max(0, number(next.home.lastCollect, 0));
    if (!next.homeDisplay || typeof next.homeDisplay !== 'object' || Array.isArray(next.homeDisplay)) next.homeDisplay = { petId: 'crimson_dragon', mode: 'fixed' };
    if (!this.validPet(next.homeDisplay.petId)) next.homeDisplay.petId = 'crimson_dragon';
    next.homeDisplay.mode = next.homeDisplay.mode === 'leader' ? 'leader' : 'fixed';
    if (!next.story || typeof next.story !== 'object' || Array.isArray(next.story)) next.story = { seen: {}, rewards: {} };
    ['seen', 'rewards', 'bonds'].forEach(function (key) { if (!next.story[key] || typeof next.story[key] !== 'object' || Array.isArray(next.story[key])) next.story[key] = {}; });
    var shouldGrantTesterGift = Boolean(raw) && (!raw.testerGifts || typeof raw.testerGifts !== 'object' || !raw.testerGifts[TESTER_GIFT_KEY]);
    if (!next.testerGifts || typeof next.testerGifts !== 'object' || Array.isArray(next.testerGifts)) next.testerGifts = {};
    /* 測試期全玩家一次性贈禮：新舊存檔都可取得一次，但不會因重整重複發放。 */
    if (shouldGrantTesterGift) { next.crystals += TESTER_GIFT_CRYSTALS; next.testerGifts[TESTER_GIFT_KEY] = true; }
    if (!next.featuredPity || typeof next.featuredPity !== 'object' || Array.isArray(next.featuredPity)) next.featuredPity = { date: '', pulls: 0 };
    next.featuredPity.date = typeof next.featuredPity.date === 'string' ? next.featuredPity.date : '';
    next.featuredPity.pulls = Math.max(0, Math.min(FEATURED_PITY - 1, number(next.featuredPity.pulls, 0)));
    // 擁有制遷移：初始 8 隻 + 隊伍成員 + 任何投入過養成的幻獸自動視為已擁有。
    STARTER_PETS.forEach(function (id) { next.owned[id] = true; });
    (Array.isArray(next.party) ? next.party : []).forEach(function (id) { next.owned[id] = true; });
    ['fusion', 'evolution', 'skillPoints', 'skillTree'].forEach(function (key) {
      Object.keys(next[key] || {}).forEach(function (id) { next.owned[id] = true; });
    });
    next.essences = Object.assign(emptyElements(), next.essences || {});
    ELEMENTS.forEach(function (element) { next.essences[element] = Math.max(0, number(next.essences[element], 0)); });
    ['evolution', 'fusion', 'skillPoints', 'skillTree', 'cleared', 'bestStars', 'questClaims'].forEach(function (key) {
      if (!next[key] || typeof next[key] !== 'object' || Array.isArray(next[key])) next[key] = {};
    });
    if (!this.content.stages.some(function (stage) { return stage.id === next.currentStage; })) next.currentStage = this.content.stages[0].id;
    next.sound = next.sound !== false;
    return next;
  };

  TacticalProgression.prototype.save = function () {
    try { this.storage.setItem(SAVE_KEY, JSON.stringify(this.state)); this.saveFailed = false; }
    catch (error) { this.saveFailed = true; /* 私密瀏覽或儲存空間已滿：保留記憶體中的進度，避免整個遊戲當掉 */ }
  };

  TacticalProgression.prototype.setParty = function (party) {
    if (!Array.isArray(party) || !party.length || !party.every(this.validPet.bind(this))) return false;
    if (new Set(party).size !== party.length) return false;
    if (!party.every(this.owns.bind(this))) return false;
    if (this.partyCost(party) > this.partyCapacity()) return false;
    this.state.party = party.slice(); this.save(); return true;
  };

  TacticalProgression.prototype.deploymentCost = function (petOrId) {
    var profile = typeof petOrId === 'string' ? this.profiles.find(function (pet) { return pet.id === petOrId; }) : petOrId;
    return deploymentCost(profile);
  };
  TacticalProgression.prototype.partyCost = function (party) {
    var self = this;
    return (party || this.state.party || []).reduce(function (total, id) { return total + self.deploymentCost(id); }, 0);
  };
  TacticalProgression.prototype.commanderXpForLevel = function (level) { return commanderXpForLevel(level); };
  TacticalProgression.prototype.commanderInfo = function () {
    var commander = this.state.commander || { level: 1, xp: 0 }, level = Math.max(1, Math.min(100, commander.level));
    var currentXp = Math.max(0, commander.xp), currentStart = commanderXpForLevel(level), nextStart = level >= 100 ? currentStart : commanderXpForLevel(level + 1);
    var nextStep = COMMANDER_CAPACITY_STEPS.find(function (step) { return step.level > level; }) || null;
    return { level: level, xp: currentXp, currentStart: currentStart, nextStart: nextStart, progress: level >= 100 ? 1 : Math.max(0, Math.min(1, (currentXp - currentStart) / Math.max(1, nextStart - currentStart))), capacity: commanderCapacityForLevel(level), nextCapacityStep: nextStep, maxLevel: 100 };
  };
  TacticalProgression.prototype.partyCapacity = function () { return this.commanderInfo().capacity; };
  TacticalProgression.prototype.awardCommanderXp = function (amount) {
    amount = Math.max(0, Math.round(number(amount, 0))); var before = this.commanderInfo();
    this.state.commander.xp += amount;
    while (this.state.commander.level < 100 && this.state.commander.xp >= commanderXpForLevel(this.state.commander.level + 1)) this.state.commander.level++;
    var after = this.commanderInfo(); this.save();
    return { gained: amount, before: before, after: after, leveled: after.level > before.level, capacityUp: after.capacity > before.capacity };
  };
  TacticalProgression.prototype.setFormation = function (party, positions) {
    if (!Array.isArray(party) || !Array.isArray(positions)) return false;
    var presets = (this.state.formation && this.state.formation.presets) || {};
    this.state.formation = {
      party: party.slice(),
      positions: positions.filter(function (spot) { return spot && typeof spot.id === 'string' && Number.isInteger(spot.x) && Number.isInteger(spot.y); }).map(function (spot) { return { id: spot.id, x: spot.x, y: spot.y }; }),
      presets: presets
    };
    this.save(); return true;
  };
  TacticalProgression.prototype.formationFor = function (party) {
    var saved = this.state.formation || { party: [], positions: [] };
    if (!Array.isArray(party) || saved.party.join('|') !== party.join('|')) return [];
    return saved.positions.map(function (spot) { return { id: spot.id, x: spot.x, y: spot.y }; });
  };
  TacticalProgression.prototype.setFormationPreset = function (kind, party, positions) {
    var allowed = ['campaign', 'boss', 'hard', 'tower', 'raid'];
    if (allowed.indexOf(kind) < 0 || !Array.isArray(party) || !Array.isArray(positions)) return false;
    if (!this.state.formation || typeof this.state.formation !== 'object') this.state.formation = { party: [], positions: [], presets: {} };
    if (!this.state.formation.presets || typeof this.state.formation.presets !== 'object') this.state.formation.presets = {};
    this.state.formation.presets[kind] = { party: party.slice(), positions: positions.filter(function (spot) { return spot && typeof spot.id === 'string' && Number.isInteger(spot.x) && Number.isInteger(spot.y); }).map(function (spot) { return { id: spot.id, x: spot.x, y: spot.y }; }) };
    this.save(); return true;
  };
  TacticalProgression.prototype.formationPreset = function (kind) {
    var saved = (this.state.formation.presets || {})[kind];
    return saved && Array.isArray(saved.party) && Array.isArray(saved.positions) ? { party: saved.party.slice(), positions: saved.positions.map(function (spot) { return { id: spot.id, x: spot.x, y: spot.y }; }) } : null;
  };
  TacticalProgression.prototype.clearFormation = function () { this.state.formation = { party: [], positions: [], presets: {} }; this.save(); };

  /* ── 首頁展示／劇情進度 ── */
  TacticalProgression.prototype.setHomeDisplay = function (petId, mode) {
    if (!this.validPet(petId)) return false;
    this.state.homeDisplay = { petId: petId, mode: mode === 'leader' ? 'leader' : 'fixed' };
    this.save(); return true;
  };
  TacticalProgression.prototype.homeDisplayPetId = function () {
    if (this.state.homeDisplay.mode === 'leader' && this.state.party[0]) return this.state.party[0];
    return this.state.homeDisplay.petId;
  };
  TacticalProgression.prototype.hasSeenStory = function (key) { return Boolean(this.state.story.seen[key]); };
  TacticalProgression.prototype.markStorySeen = function (key, portrait) {
    if (this.state.story.seen[key]) return false;
    this.state.story.seen[key] = true;
    if (portrait && this.validPet(portrait)) this.state.story.bonds[portrait] = Math.min(5, number(this.state.story.bonds[portrait], 0) + 1);
    this.save(); return true;
  };
  TacticalProgression.prototype.bondOf = function (petId) { return Math.min(5, Math.max(0, number(this.state.story.bonds[petId], 0))); };
  TacticalProgression.prototype.bondBonusFor = function (petId) { return this.bondOf(petId) * 0.01; };
  TacticalProgression.prototype.grantStoryPet = function (rewardKey, petId) {
    if (!rewardKey || !this.validPet(petId) || this.state.story.rewards[rewardKey]) return false;
    this.state.story.rewards[rewardKey] = petId;
    this.state.owned[petId] = true;
    this.save(); return true;
  };

  /* ── 幻獸擁有制與召喚 ── */
  TacticalProgression.prototype.owns = function (id) { return Boolean(this.state.owned[id]); };
  TacticalProgression.prototype.ownedPets = function () {
    var self = this; return this.profiles.filter(function (pet) { return self.owns(pet.id); });
  };
  TacticalProgression.prototype.grantPet = function (id) {
    if (!this.validPet(id)) return { ok: false };
    if (!this.state.owned[id]) { this.state.owned[id] = true; this.save(); return { ok: true, isNew: true }; }
    /* 重複抽到：轉為複製體，可於強化升星或在商店賣掉換金幣。 */
    this.state.copies[id] = number(this.state.copies[id], 0) + 1;
    this.save();
    return { ok: true, isNew: false, copies: this.state.copies[id] };
  };

  /* ── 星級進階：升到第 n 星消耗同幻獸複製體 2^(n-1) 隻與金幣，每星全能力 +10%。 ── */
  var SELL_PRICE = { normal: 60, rare: 120, elite: 240, epic: 480, legendary: 960, mythical: 1920 };
  TacticalProgression.prototype.starOf = function (id) { return Math.min(9, number(this.state.stars[id], 0)); };
  TacticalProgression.prototype.starMultiplier = function (id) { return 1 + this.starOf(id) * 0.1; };
  TacticalProgression.prototype.starCost = function (id) {
    var star = this.starOf(id);
    if (star >= 9) return null;
    return { copies: Math.pow(2, star), gold: 120 * Math.pow(2, star), nextStar: star + 1 };
  };
  TacticalProgression.prototype.starUp = function (id) {
    if (!this.owns(id)) return { ok: false, reason: '尚未擁有此幻獸' };
    var cost = this.starCost(id);
    if (!cost) return { ok: false, reason: '已達 9 星上限' };
    if (number(this.state.copies[id], 0) < cost.copies) return { ok: false, reason: '複製體不足（需要 ' + cost.copies + ' 隻，可由召喚重複取得）' };
    if (this.state.gold < cost.gold) return { ok: false, reason: '金幣不足（需要 ' + cost.gold + '）' };
    this.state.copies[id] -= cost.copies;
    this.state.gold -= cost.gold;
    this.state.stars[id] = cost.nextStar;
    this.save();
    return { ok: true, star: cost.nextStar };
  };
  TacticalProgression.prototype.sellPrice = function (id) {
    var pet = this.profiles.find(function (entry) { return entry.id === id; });
    return SELL_PRICE[pet ? pet.quality : 'normal'] || 60;
  };
  TacticalProgression.prototype.sellCopy = function (id) {
    if (number(this.state.copies[id], 0) < 1) return { ok: false, reason: '沒有可販售的複製體' };
    var price = this.sellPrice(id);
    this.state.copies[id] -= 1;
    this.state.gold += price;
    this.save();
    return { ok: true, gold: price };
  };

  /* ── 無限塔 ── */
  TacticalProgression.prototype.completeTower = function (floor, win) {
    if (!win) { this.save(); return { ok: true, win: false }; }
    if (floor > this.state.tower.best) this.state.tower.best = floor;
    var weekly = this.weeklyState();
    weekly.towerFloors[String(floor)] = true;
    var reward = { crystals: 8 + floor * 2, gold: 30 + floor * 8, essence: 3 + Math.floor(floor / 2), element: ELEMENTS[floor % ELEMENTS.length] };
    this.state.crystals += reward.crystals;
    this.state.gold += reward.gold;
    this.state.essences[reward.element] += reward.essence;
    reward.commanderXp = this.awardCommanderXp(26 + Math.min(80, floor) * 2).gained;
    this.save();
    return { ok: true, win: true, reward: reward, best: this.state.tower.best };
  };
  TacticalProgression.prototype.pullCost = function (count) { return count === 10 ? PULL10_COST : PULL_COST * count; };
  TacticalProgression.prototype.dateKey = function () { return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Taipei' }); };
  TacticalProgression.prototype.featuredPet = function () {
    var date = this.dateKey(), seed = date.split('-').reduce(function (sum, part) { return sum * 37 + Number(part || 0); }, 0);
    var pool = this.profiles.filter(function (pet) { return pet.size === 1 && ['elite', 'epic', 'legendary', 'mythical'].indexOf(pet.quality) >= 0; });
    return { date: date, pet: pool[Math.abs(seed) % pool.length] || this.profiles[0] };
  };
  TacticalProgression.prototype.featuredProgress = function () {
    var featured = this.featuredPet();
    if (this.state.featuredPity.date !== featured.date) { this.state.featuredPity = { date: featured.date, pulls: 0 }; this.save(); }
    return { pet: featured.pet, date: featured.date, pulls: this.state.featuredPity.pulls, target: FEATURED_PITY };
  };
  TacticalProgression.prototype.pull = function (count, element, featured) {
    count = count === 10 ? 10 : 1;
    element = ELEMENTS.indexOf(element) >= 0 ? element : null;
    if (element) count = 1;
    var cost = element ? 50 : this.pullCost(count);
    if (this.state.crystals < cost) return { ok: false, reason: '召喚水晶不足（需要 ' + cost + '💎）' };
    var tierCounts = {}, eligiblePets = this.profiles.filter(function (pet) { return pet.size === 1 && (!element || pet.element === element); });
    eligiblePets.forEach(function (pet) { tierCounts[pet.quality] = (tierCounts[pet.quality] || 0) + 1; });
    var pool = eligiblePets.map(function (pet) { return { pet: pet, weight: (GACHA_TIER_WEIGHT[pet.quality] || 10) / tierCounts[pet.quality] }; });
    var totalWeight = pool.reduce(function (sum, entry) { return sum + entry.weight; }, 0), featuredInfo = featured ? this.featuredProgress() : null;
    this.state.crystals -= cost;
    var results = [];
    for (var index = 0; index < count; index++) {
      var guaranteed = featuredInfo && featuredInfo.pulls >= FEATURED_PITY - 1, roll = Math.random() * totalWeight, picked = guaranteed ? { pet: eligiblePets[Math.floor(Math.random() * eligiblePets.length)] } : pool[0];
      if (!guaranteed) for (var cursor = 0; cursor < pool.length; cursor++) { roll -= pool[cursor].weight; if (roll <= 0) { picked = pool[cursor]; break; } }
      var grant = this.grantPet(picked.pet.id);
      results.push({ pet: picked.pet, isNew: grant.isNew, featuredGuaranteed: Boolean(guaranteed) });
      if (featuredInfo) { featuredInfo.pulls = guaranteed ? 0 : featuredInfo.pulls + 1; this.state.featuredPity = { date: featuredInfo.date, pulls: featuredInfo.pulls }; }
    }
    this.save();
    return { ok: true, results: results, crystals: this.state.crystals, featured: featuredInfo ? this.featuredProgress() : null };
  };

  TacticalProgression.prototype.bossRaidState = function (bossIds, fixedBossId) {
    var key = this.dateKey(), seed = key.replace(/-/g, '').split('').reduce(function (sum, digit) { return sum + Number(digit); }, 0);
    bossIds = Array.isArray(bossIds) && bossIds.length ? bossIds : [];
    var bossId = bossIds.indexOf(fixedBossId) >= 0 ? fixedBossId : (bossIds[seed % bossIds.length] || '');
    if (!this.state.bossRaid || this.state.bossRaid.key !== key || this.state.bossRaid.bossId !== bossId) {
      this.state.bossRaid = { key: key, bossId: bossId, tier: 0, hp: null, maxHp: null, cleared: false, challenges: 0 };
      this.save();
    }
    return this.state.bossRaid;
  };
  TacticalProgression.prototype.startBossRaid = function (bossIds, cost, fixedBossId) {
    var raid = this.bossRaidState(bossIds, fixedBossId); cost = Math.max(0, number(cost, 0));
    if (raid.cleared) return { ok: false, reason: '今日五個難度已全部討伐完成' };
    if (this.state.gold < cost) return { ok: false, reason: '金幣不足（需要 ' + cost + '）' };
    this.state.gold -= cost; raid.challenges++; this.save();
    return { ok: true, raid: raid };
  };
  TacticalProgression.prototype.recordBossRaid = function (bossIds, win, hp, maxHp, element, fixedBossId) {
    var raid = this.bossRaidState(bossIds, fixedBossId);
    if (!win) { raid.hp = Math.max(1, Math.round(number(hp, maxHp))); raid.maxHp = Math.max(1, Math.round(number(maxHp, raid.hp))); this.save(); return { win: false }; }
    var tier = Math.min(4, number(raid.tier, 0));
    var reward = { crystals: 12 + tier * 8, gold: 140 + tier * 100, medals: 4 + tier * 4, fusionCore: 1 + Math.floor(tier / 2), essence: 8 + tier * 5, element: ELEMENTS.indexOf(element) >= 0 ? element : 'fire' };
    var shardPool = this.profiles.filter(function (pet) { return pet.element === reward.element; });
    reward.shardPetId = shardPool.length ? shardPool[tier % shardPool.length].id : '';
    reward.summonShards = 2 + tier;
    this.state.crystals += reward.crystals; this.state.gold += reward.gold; this.state.medals += reward.medals; this.state.fusionCores += reward.fusionCore; this.state.essences[reward.element] += reward.essence;
    if (reward.shardPetId) this.state.copies[reward.shardPetId] = number(this.state.copies[reward.shardPetId], 0) + reward.summonShards;
    reward.commanderXp = this.awardCommanderXp(70 + tier * 20).gained;
    raid.hp = null; raid.maxHp = null; raid.tier = tier + 1; raid.cleared = raid.tier >= 5; this.save();
    return { win: true, reward: reward, nextTier: raid.tier, cleared: raid.cleared };
  };

  /* ── 圖鑑收集加成：每 10 隻全能力 +1%；單一元素滿 10 隻該系攻擊 +3%。 ── */
  TacticalProgression.prototype.dexSummary = function () {
    var self = this, owned = this.ownedPets();
    var byElement = emptyElements();
    owned.forEach(function (pet) { if (byElement[pet.element] !== undefined) byElement[pet.element]++; });
    var elementBonus = {};
    ELEMENTS.forEach(function (element) { elementBonus[element] = byElement[element] >= 10 ? 0.03 : 0; });
    return {
      total: owned.length, max: this.profiles.length, byElement: byElement,
      allBonus: Math.floor(owned.length / 10) * 0.01,
      elementBonus: elementBonus
    };
  };

  /* ── 商店：每日限購（依本地日期重置） ── */
  var SHOP_OFFERS = [
    { id: 'core-pack', icon: '🧬', name: '融合核心 ×2', cost: { crystals: 60 }, gain: { fusionCores: 2 }, daily: 2 },
    { id: 'essence-crystal', icon: '🔷', name: '元素精華 ×10（自選屬性）', cost: { crystals: 30 }, gain: { essence: 10 }, pick: true, daily: 3 },
    { id: 'essence-medal', icon: '🔶', name: '元素精華 ×6（自選屬性）', cost: { medals: 12 }, gain: { essence: 6 }, pick: true, daily: 3 },
    { id: 'medal-pack', icon: '🏅', name: '戰術徽章 ×8', cost: { crystals: 25 }, gain: { medals: 8 }, daily: 2 }
  ];
  TacticalProgression.prototype.shopOffers = function () { return SHOP_OFFERS.slice(); };
  TacticalProgression.prototype.shopState = function () {
    var key = this.dateKey();
    if (!this.state.shop || this.state.shop.key !== key) { this.state.shop = { key: key, counts: {} }; this.save(); }
    return this.state.shop;
  };
  TacticalProgression.prototype.buyOffer = function (offerId, element) {
    var offer = SHOP_OFFERS.find(function (entry) { return entry.id === offerId; });
    if (!offer) return { ok: false, reason: '商品不存在' };
    var shop = this.shopState();
    if ((shop.counts[offerId] || 0) >= offer.daily) return { ok: false, reason: '今日限購已達上限' };
    if (offer.cost.crystals && this.state.crystals < offer.cost.crystals) return { ok: false, reason: '召喚水晶不足' };
    if (offer.cost.medals && this.state.medals < offer.cost.medals) return { ok: false, reason: '戰術徽章不足' };
    if (offer.pick && ELEMENTS.indexOf(element) < 0) return { ok: false, reason: '請先選擇屬性' };
    this.state.crystals -= offer.cost.crystals || 0;
    this.state.medals -= offer.cost.medals || 0;
    if (offer.gain.fusionCores) this.state.fusionCores += offer.gain.fusionCores;
    if (offer.gain.medals) this.state.medals += offer.gain.medals;
    if (offer.gain.essence) this.state.essences[element] += offer.gain.essence;
    shop.counts[offerId] = (shop.counts[offerId] || 0) + 1;
    this.save();
    return { ok: true };
  };

  /* ── 幻獸之家：最多 3 隻駐守，離線產出該系元素精華（每小時 2，上限 24 小時） ── */
  TacticalProgression.prototype.setResident = function (slot, petId) {
    if (slot < 0 || slot > 2) return false;
    var residents = this.state.home.residents.slice();
    if (petId === null || petId === '') { residents.splice(slot, 1); }
    else {
      if (!this.owns(petId) || residents.indexOf(petId) >= 0) return false;
      residents[slot] = petId;
    }
    this.state.home.residents = residents.filter(Boolean).slice(0, 3);
    if (!this.state.home.lastCollect) this.state.home.lastCollect = Date.now();
    this.save(); return true;
  };
  TacticalProgression.prototype.homePending = function () {
    var home = this.state.home, self = this;
    if (!home.residents.length || !home.lastCollect) return { hours: 0, yields: [] };
    var hours = Math.min(24, (Date.now() - home.lastCollect) / 3600000);
    var yields = home.residents.map(function (id) {
      var pet = self.profiles.find(function (entry) { return entry.id === id; });
      return { id: id, element: pet ? pet.element : 'fire', amount: Math.floor(hours * 2) };
    });
    return { hours: hours, yields: yields };
  };
  TacticalProgression.prototype.collectHome = function () {
    var pending = this.homePending(), self = this;
    var total = pending.yields.reduce(function (sum, entry) { return sum + entry.amount; }, 0);
    if (!total) return { ok: false, reason: '尚無可收成的產出（每小時累積 2 精華）' };
    pending.yields.forEach(function (entry) { self.state.essences[entry.element] += entry.amount; });
    this.state.home.lastCollect = Date.now();
    this.save();
    return { ok: true, yields: pending.yields, total: total };
  };

  /* ── 每日任務（統一依 dateKey() 的台灣日期重置，避免每日/每週/商店/保底各自用不同時區基準） ── */
  TacticalProgression.prototype.dailyQuests = function () { return DAILY_QUESTS.slice(); };
  TacticalProgression.prototype.weekKey = function () {
    var parts = this.dateKey().split('-').map(Number);
    var date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
    return date.getUTCFullYear() + '-' + String(date.getUTCMonth() + 1).padStart(2, '0') + '-' + String(date.getUTCDate()).padStart(2, '0');
  };
  TacticalProgression.prototype.weeklyQuests = function () { return WEEKLY_QUESTS.slice(); };
  TacticalProgression.prototype.weeklyState = function () {
    var key = this.weekKey();
    if (!this.state.weekly || this.state.weekly.key !== key) {
      this.state.weekly = { key: key, towerFloors: {}, claims: {} };
      this.save();
    }
    if (!this.state.weekly.towerFloors || typeof this.state.weekly.towerFloors !== 'object') this.state.weekly.towerFloors = {};
    if (!this.state.weekly.claims || typeof this.state.weekly.claims !== 'object') this.state.weekly.claims = {};
    return this.state.weekly;
  };
  TacticalProgression.prototype.weeklyProgress = function (quest) {
    var weekly = this.weeklyState();
    return quest.stat === 'towerFloors' ? Object.keys(weekly.towerFloors).length : 0;
  };
  TacticalProgression.prototype.claimWeekly = function (questId) {
    var quest = WEEKLY_QUESTS.find(function (entry) { return entry.id === questId; }), weekly = this.weeklyState();
    if (!quest || weekly.claims[questId]) return { ok: false, reason: '任務不存在或已領取' };
    if (this.weeklyProgress(quest) < quest.target) return { ok: false, reason: '任務尚未完成' };
    this.state.crystals += quest.reward.crystals || 0;
    this.state.medals += quest.reward.medals || 0;
    this.state.fusionCores += quest.reward.fusionCore || 0;
    this.state.gold += quest.reward.gold || 0;
    if (quest.reward.essence) ELEMENTS.forEach(function (element) { this.state.essences[element] += quest.reward.essence; }, this);
    weekly.claims[questId] = true;
    this.save(); return { ok: true, reward: quest.reward };
  };
  TacticalProgression.prototype.dailyState = function () {
    var key = this.dateKey();
    if (!this.state.daily || this.state.daily.key !== key) {
      this.state.daily = { key: key, battles: 0, wins: 0, controls: 0, claims: {} };
      this.save();
    }
    return this.state.daily;
  };
  TacticalProgression.prototype.dailyProgress = function (quest) {
    var daily = this.dailyState();
    if (quest.stat === 'chest') {
      var self = this;
      return DAILY_QUESTS.filter(function (entry) { return entry.stat !== 'chest' && daily[entry.stat] >= entry.target; }).length;
    }
    return number(daily[quest.stat], 0);
  };
  TacticalProgression.prototype.claimDaily = function (questId) {
    var quest = DAILY_QUESTS.find(function (entry) { return entry.id === questId; });
    var daily = this.dailyState();
    if (!quest || daily.claims[questId]) return { ok: false, reason: '任務不存在或已領取' };
    if (this.dailyProgress(quest) < quest.target) return { ok: false, reason: '任務尚未完成' };
    this.state.crystals += quest.reward.crystals || 0;
    this.state.medals += quest.reward.medals || 0;
    this.state.fusionCores += quest.reward.fusionCore || 0;
    daily.claims[questId] = true;
    this.save();
    return { ok: true, reward: quest.reward };
  };

  TacticalProgression.prototype.maxClearedOrder = function () {
    var self = this;
    return Object.keys(this.state.cleared).reduce(function (max, id) {
      var stage = self.content.stageById(id);
      if (!self.state.cleared[id] || stage.hard || stage.id !== id) return max; /* 忽略 HARD 與失效的舊關卡 id */
      return Math.max(max, stage.order);
    }, 0);
  };

  TacticalProgression.prototype.isStageUnlocked = function (id) {
    var stage = this.content.stageById(id);
    if (stage.hard) { /* HARD 特別關：通關該章首領後解鎖 */
      var bossId = stage.mapId + '-boss';
      return Boolean(this.state.cleared[bossId]);
    }
    return stage.order <= this.maxClearedOrder() + 1;
  };

  TacticalProgression.prototype.selectStage = function (id) {
    if (!this.isStageUnlocked(id)) return false;
    this.state.currentStage = this.content.stageById(id).id; this.save(); return true;
  };

  TacticalProgression.prototype.evolutionCost = function (stage) {
    return stage === 2 ? { medals: 4, essence: 3 } : stage === 3 ? { medals: 10, essence: 8, fusion: 1 } : { medals: 0, essence: 0 };
  };

  TacticalProgression.prototype.evolutionUnlocked = function (id, stage) {
    return stage === 1 || Math.max(1, number(this.state.evolution[id], 1)) >= stage;
  };

  TacticalProgression.prototype.unlockEvolution = function (pet, stage) {
    if (!pet || stage < 2 || stage > 3) return { ok: false, reason: '無效的進化階段' };
    if (this.evolutionUnlocked(pet.id, stage)) return { ok: true, already: true };
    if (stage === 3 && !this.evolutionUnlocked(pet.id, 2)) return { ok: false, reason: '需先解鎖成長體' };
    var cost = this.evolutionCost(stage), element = pet.element;
    if (this.state.medals < cost.medals) return { ok: false, reason: '戰術徽章不足' };
    if ((this.state.essences[element] || 0) < cost.essence) return { ok: false, reason: '元素精華不足' };
    if ((this.state.fusion[pet.id] || 0) < (cost.fusion || 0)) return { ok: false, reason: '最終型需要先完成一次融合' };
    this.state.medals -= cost.medals;
    this.state.essences[element] -= cost.essence;
    this.state.evolution[pet.id] = stage;
    this.save();
    return { ok: true, cost: cost };
  };

  TacticalProgression.prototype.fuse = function (pet) {
    if (!pet) return { ok: false, reason: '找不到幻獸' };
    var rank = number(this.state.fusion[pet.id], 0), coreCost = 2 + rank, essenceCost = 6 + rank * 3;
    if (rank >= 3) return { ok: false, reason: '融合已達最高 3 階' };
    if (this.state.fusionCores < coreCost) return { ok: false, reason: '融合核心不足（需要 ' + coreCost + '）' };
    if ((this.state.essences[pet.element] || 0) < essenceCost) return { ok: false, reason: '元素精華不足（需要 ' + essenceCost + '）' };
    this.state.fusionCores -= coreCost;
    this.state.essences[pet.element] -= essenceCost;
    this.state.fusion[pet.id] = rank + 1;
    this.state.skillPoints[pet.id] = number(this.state.skillPoints[pet.id], 0) + 1;
    this.save();
    return { ok: true, rank: rank + 1, skillPoint: 1 };
  };

  TacticalProgression.prototype.treeFor = function (pet) {
    return (this.content.skillTrees[pet.role] || this.content.skillTrees.allrounder).slice();
  };

  TacticalProgression.prototype.unlockSkill = function (pet, nodeId) {
    if (!pet) return { ok: false, reason: '找不到幻獸' };
    var tree = this.treeFor(pet), node = tree.find(function (entry) { return entry.id === nodeId; });
    if (!node) return { ok: false, reason: '找不到技能節點' };
    var unlocked = this.state.skillTree[pet.id] || [];
    if (unlocked.indexOf(nodeId) >= 0) return { ok: false, reason: '技能已解鎖' };
    if (node.requires && unlocked.indexOf(node.requires) < 0) return { ok: false, reason: '需先解鎖前置技能' };
    var points = number(this.state.skillPoints[pet.id], 0);
    if (points < node.cost) return { ok: false, reason: '技能點不足' };
    this.state.skillPoints[pet.id] = points - node.cost;
    this.state.skillTree[pet.id] = unlocked.concat(nodeId);
    this.save();
    return { ok: true, node: node };
  };

  TacticalProgression.prototype.bonusesFor = function (pet) {
    var bonus = {}, self = this, unlocked = this.state.skillTree[pet.id] || [];
    this.treeFor(pet).forEach(function (node) {
      if (unlocked.indexOf(node.id) < 0) return;
      Object.keys(node.bonus).forEach(function (key) { bonus[key] = (bonus[key] || 0) + node.bonus[key]; });
    });
    var fusion = number(self.state.fusion[pet.id], 0);
    bonus.all = (bonus.all || 0) + fusion * 0.04;
    var dex = this.dexSummary();
    bonus.all += dex.allBonus;
    if (dex.elementBonus[pet.element]) bonus.offense = (bonus.offense || 0) + dex.elementBonus[pet.element];
    return bonus;
  };

  TacticalProgression.prototype.recordSkill = function () {
    this.state.skills++; this.save();
  };

  TacticalProgression.prototype.recordControl = function () {
    this.state.controls++;
    this.dailyState().controls++;
    this.save();
  };

  TacticalProgression.prototype.completeBattle = function (stage, summary) {
    summary = summary || {};
    this.state.battles++;
    var daily = this.dailyState(); daily.battles++;
    var reward = { medals: 0, essence: 0, fusionCore: 0, skillPoints: 0, crystals: 0, stars: 0, firstClear: false };
    if (summary.win) {
      this.state.wins++; daily.wins++;
      if (summary.bossKill) this.state.bossKills++;
      reward.firstClear = !this.state.cleared[stage.id];
      reward.stars = 1 + (summary.survivors >= (summary.partySize || this.state.party.length) ? 1 : 0) + (summary.round <= stage.turnLimit ? 1 : 0);
      reward.medals = reward.firstClear ? stage.rewards.medals : Math.max(1, Math.floor(stage.rewards.medals / 2));
      reward.essence = reward.firstClear ? stage.rewards.essence : Math.max(1, Math.floor(stage.rewards.essence / 2));
      reward.fusionCore = reward.firstClear ? stage.rewards.fusionCore : 0;
      reward.coreLabel = reward.firstClear ? (stage.rewards.coreLabel || '') : '';
      reward.crystals = reward.firstClear ? 15 + stage.order * 2 : 5;
      reward.commanderXp = this.awardCommanderXp((reward.firstClear ? 2 : 1) * (stage.boss ? 95 + stage.chapter * 12 : stage.hard ? 62 + stage.chapter * 6 : 24 + stage.chapter * 3)).gained;
      /* 新手福利：第一章前五個主線節點首次通關，各贈一隻隨機 1×1 幻獸。
         優先從未擁有名單抽取，避免福利被重複幻獸轉成素材而失去意義。 */
      if (reward.firstClear && stage.mapId === 'c1' && !stage.hard && stage.index >= 1 && stage.index <= 5) {
        var giftPool = this.profiles.filter(function (pet) { return pet.size === 1 && !this.owns(pet.id); }, this);
        if (!giftPool.length) giftPool = this.profiles.filter(function (pet) { return pet.size === 1; });
        var giftPet = giftPool[Math.floor(Math.random() * giftPool.length)];
        if (giftPet) { this.grantPet(giftPet.id); reward.firstClearPet = giftPet.id; }
      }
      this.state.crystals += reward.crystals;
      reward.gold = reward.firstClear ? 40 + stage.order * 6 : 15;
      this.state.gold += reward.gold;
      if (!reward.firstClear && stage.elite && Math.random() < 0.35) reward.fusionCore++;
      this.state.medals += reward.medals;
      var chapterElement = this.content.mapById(stage.mapId).element;
      var essenceElement = ELEMENTS.indexOf(chapterElement) >= 0 ? chapterElement : ELEMENTS[stage.order % ELEMENTS.length];
      this.state.essences[essenceElement] += reward.essence;
      this.state.fusionCores += reward.fusionCore;
      this.state.cleared[stage.id] = true;
      this.state.bestStars[stage.id] = Math.max(number(this.state.bestStars[stage.id], 0), reward.stars);
      if (!stage.hard) {
        var next = this.content.stages.find(function (entry) { return entry.order === stage.order + 1 && !entry.hard; });
        if (next) this.state.currentStage = next.id;
      }
    }
    this.save();
    return reward;
  };

  TacticalProgression.prototype.questProgress = function (quest) {
    if (quest.stat === 'cleared') return Object.keys(this.state.cleared).filter(function (id) { return Boolean(this.state.cleared[id]); }, this).length;
    return number(this.state[quest.stat], 0);
  };

  TacticalProgression.prototype.claimQuest = function (questId) {
    var quest = this.content.quests.find(function (entry) { return entry.id === questId; });
    if (!quest || this.state.questClaims[questId]) return { ok: false, reason: '任務不存在或已領取' };
    if (this.questProgress(quest) < quest.target) return { ok: false, reason: '任務尚未完成' };
    this.state.medals += quest.reward.medals || 0;
    this.state.fusionCores += quest.reward.fusionCore || 0;
    if (quest.reward.skillPoints) {
      var petId = this.state.party[0];
      this.state.skillPoints[petId] = number(this.state.skillPoints[petId], 0) + quest.reward.skillPoints;
    }
    this.state.questClaims[questId] = true;
    this.save();
    return { ok: true, reward: quest.reward };
  };

  TacticalProgression.prototype.toggleSound = function () {
    this.state.sound = !this.state.sound; this.save(); return this.state.sound;
  };

  global.TacticalProgression = TacticalProgression;
}(window));
