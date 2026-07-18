import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
let passed = 0, total = 0;
function test(name, fn) { total++; try { fn(); passed++; console.log(`✓ ${name}`); } catch (error) { console.error(`✗ ${name}\n${error.stack}`); process.exitCode = 1; } }

const context = { console };
context.window = context;
vm.createContext(context);
for (const file of ['js/data/pets.js', 'js/data/pets-lightdark.js', 'js/data/pets-pack.js', 'js/data/tactical-pets.js', 'js/data/tactical-enemies.js', 'js/data/map-terrain.js', 'js/data/tactical-content.js']) vm.runInContext(readFileSync(join(root, file), 'utf8'), context, { filename: file });
const pets = context.PET_DATA, tactical = context.TACTICAL_PET_DATA, enemies = context.TACTICAL_ENEMY_DATA, content = context.TACTICAL_CONTENT;
const profiles = tactical.concat(enemies);

test('資料庫包含 115 隻幻獸（45 原生 + 20 光暗 + 50 素材包）', () => { assert.equal(pets.length, 115); assert.equal(pets.filter(pet => pet.element === 'light').length, 20); assert.equal(pets.filter(pet => pet.element === 'dark').length, 20); });
test('戰棋資料與主資料數量一致', () => assert.equal(tactical.length, pets.length));
test('每隻戰棋幻獸皆有三段進化', () => assert.ok(tactical.every(pet => pet.evolution?.length === 3)));
test('每隻戰棋幻獸皆有可用技能與正數數值', () => assert.ok(tactical.every(pet => pet.skills?.length && Object.values(pet.stats).every(value => value > 0))));
test('敵我所有戰棋單位皆以無冷卻傷害普攻作為第一技能', () => assert.ok(profiles.every(pet => pet.skills[0]?.kind === 'basic' && pet.skills[0].attackStyle !== 'support' && pet.skills[0].cooldown === 0 && pet.skills[0].multiplier > 0)));
test('被動技能不會混入可點擊技能', () => assert.ok(tactical.every(pet => pet.skills.every(skill => !['atk_boost', 'def_boost', 'hp_boost', 'all_boost', 'burn'].includes(skill.effect)))));
test('輔助技能的效果語意與攻擊型態一致', () => assert.ok(profiles.every(pet => pet.skills.every(skill => skill.attackStyle !== 'support' || ['heal', 'heal_all', 'shield', 'buff_atk'].includes(skill.effect)))));
test('範圍技能具有有效半徑', () => assert.ok(profiles.flatMap(pet => pet.skills).filter(skill => skill.attackStyle === 'area').every(skill => skill.radius >= 1)));
test('每個戰棋技能皆有資料驅動特效識別', () => assert.ok(profiles.every(pet => pet.skills.every(skill => skill.vfxKey && Number.isInteger(skill.vfxVariant) && skill.vfxHue >= 0 && skill.vfxHue < 360))));
test('所有戰棋頭像與三階透明立繪存在', () => assert.ok(tactical.every(pet => existsSync(join(root, pet.sourceSheet)) && pet.evolution.every(stage => existsSync(join(root, stage.portrait))))));

test('敵人資料包含 42 種小兵（12 通用 + 30 首領親衛）與 10 隻章節首領', () => { assert.equal(enemies.filter(enemy => enemy.minion).length, 42); assert.equal(enemies.filter(enemy => enemy.boss).length, 10); assert.ok(enemies.filter(enemy => enemy.boss).every(boss => boss.size >= 2 && boss.size <= 3)); });
test('小兵只有單一階段且首領有專屬立繪', () => assert.ok(enemies.every(enemy => enemy.evolution.length === 1 && enemy.evolution[0].portrait.startsWith('assets/enemies/'))));
test('所有敵人圖片檔案存在', () => assert.ok(enemies.every(enemy => existsSync(join(root, enemy.evolution[0].portrait)))));
test('115 隻幻獸與 52 隻魔獸皆有左右待機、移動、攻擊六列動畫表', () => {
  const manifest = JSON.parse(readFileSync(join(root, 'assets/animations/units/manifest.json'), 'utf8'));
  assert.equal(profiles.length, 167);
  for (const unit of profiles) {
    const entry = manifest[unit.id];
    assert.ok(entry, `${unit.id} 缺少動畫清單`);
    assert.equal(entry.columns, 4); assert.equal(entry.rows, 6); assert.equal(entry.frame, 112);
    assert.deepEqual(Array.from(entry.rowsOrder), ['idle-right', 'move-right', 'attack-right', 'idle-left', 'move-left', 'attack-left']);
    assert.ok(existsSync(join(root, entry.file)), `${unit.id} 缺少 ${entry.file}`);
  }
  const runtimeSheets = readdirSync(join(root, 'assets/animations/units')).filter(name => name.endsWith('-motion-sheet.webp'));
  assert.equal(runtimeSheets.length, 167);
  assert.ok(runtimeSheets.every(name => statSync(join(root, 'assets/animations/units', name)).size > 1000));
});
test('敵人陣營涵蓋擊退、拉扯、冰凍、中毒控場', () => {
  const skills = enemies.flatMap(enemy => enemy.skills);
  assert.ok(skills.some(skill => skill.push) && skills.some(skill => skill.pull));
  assert.ok(skills.some(skill => skill.status === 'freeze') && skills.some(skill => skill.status === 'poison'));
});
test('玩家控制型幻獸具有異常狀態與拉扯技能', () => {
  const controllers = tactical.filter(pet => pet.role === 'controller').flatMap(pet => pet.skills);
  assert.ok(controllers.some(skill => skill.status) && controllers.some(skill => skill.pull));
});

test('戰役包含 10 大章節 × 150 關（110 主線 + 40 HARD）', () => {
  assert.equal(content.maps.length, 10); assert.equal(content.stages.length, 150);
  const main = content.stages.filter(stage => !stage.hard);
  assert.equal(main.length, 110);
  assert.deepEqual(Array.from(main, stage => stage.order).sort((a, b) => a - b), Array.from({ length: 110 }, (_, index) => index + 1));
  assert.equal(content.stages.filter(stage => stage.hard).length, 40);
});
test('每章 10 小關 + 1 首領關 + 4 個 HARD 特別關', () => {
  for (const chapter of content.maps) {
    const own = content.stages.filter(stage => stage.mapId === chapter.id);
    assert.equal(own.filter(stage => !stage.hard && !stage.boss).length, 10, chapter.id);
    assert.equal(own.filter(stage => stage.boss).length, 1, chapter.id);
    assert.equal(own.filter(stage => stage.hard).length, 4, chapter.id);
    const boss = own.find(stage => stage.boss);
    assert.ok(enemies.find(enemy => enemy.id === boss.enemies[0])?.boss, chapter.id);
  }
});
test('光暗互剋且五元素圖鑑加成齊備', () => {
  const strong = { fire: 'forest', forest: 'ocean', ocean: 'fire', light: 'dark', dark: 'light' };
  assert.equal(strong.light, 'dark'); assert.equal(strong.dark, 'light');
  const source = readFileSync(join(root, 'js/tactics.js'), 'utf8');
  assert.match(source, /light: 'dark', dark: 'light'/);
});
test('所有關卡敵人、目標、回合上限與掉落表有效', () => assert.ok(content.stages.every(stage => stage.enemies.length >= 4 && stage.enemies.every(id => enemies.some(enemy => enemy.id === id)) && stage.objective && stage.turnLimit >= 10 && stage.rewards.medals > 0)));

test('關卡難度倍率章節內遞增、章節起點逐章提高', () => {
  assert.ok(content.stages.every(stage => stage.power >= 0.4));
  for (const map of content.maps) {
    const powers = content.stages.filter(stage => stage.mapId === map.id && !stage.hard).map(stage => stage.power);
    assert.ok(powers.every((power, index) => index === 0 || power >= powers[index - 1]), `${map.id} 章節內難度未遞增`);
  }
  const starts = content.maps.map(map => content.stages.find(stage => stage.mapId === map.id).power);
  assert.ok(starts.every((power, index) => index === 0 || power > starts[index - 1]), '章節起點難度未逐章提高');
});
test('60 張美術大地圖都有 21×10 逐格標註且只用合法圖例', () => {
  const grids = context.TACTICAL_MAP_TERRAIN;
  const keys = new Set(content.stages.map(stage => content.mapAsset(stage).match(/chapter-\d{2}-(?:field|boss|hard-[1-4])/)[0]));
  assert.equal(keys.size, 60);
  keys.forEach(key => {
    const grid = grids[key];
    assert.ok(grid, `缺少 ${key} 的地形標註`);
    assert.equal(grid.length, 10);
    grid.forEach(row => { assert.equal(row.length, 21); assert.match(row, /^[.WFR#]{21}$/); });
  });
});
test('禁行格決定性、落在棋盤內且與美術圖逐格資料一致', () => {
  for (const stage of content.stages) {
    const first = content.obstaclesFor(stage, 21, 10), second = content.obstaclesFor(stage, 21, 10);
    assert.deepEqual(first, second);
    assert.ok(first.length <= 60, `${stage.id} 禁行格數 ${first.length} 異常`);
    assert.ok(first.every(spot => spot.x >= 0 && spot.x < 21 && spot.y >= 0 && spot.y < 10));
    assert.ok(first.every(spot => !((spot.x >= 3 && spot.x <= 8 && spot.y >= 6 && spot.y <= 9) || (spot.x === 9 && spot.y === 9))), `${stage.id} 禁行格侵入部署區`);
    const key = content.mapAsset(stage).match(/chapter-\d{2}-(?:field|boss|hard-[1-4])/)[0];
    const expected = [];
    context.TACTICAL_MAP_TERRAIN[key].forEach((row, y) => { for (let x = 0; x < row.length; x++) if (row[x] === '#') expected.push({ x, y }); });
    assert.equal(JSON.stringify(first), JSON.stringify(expected), `${stage.id} 禁行格與美術圖資料不一致`);
  }
});
test('共用同一張美術圖的關卡標註一致，平原中央不得標禁行', () => {
  assert.deepEqual(content.obstaclesFor(content.stageById('c1-2'), 21, 10), content.obstaclesFor(content.stageById('c1-1'), 21, 10));
  for (const stage of content.stages.filter(entry => !entry.boss && !entry.hard && [1, 2, 3, 5, 6, 7, 9, 10].includes(entry.chapter))) {
    const central = content.obstaclesFor(stage, 21, 10).filter(spot => spot.x >= 3 && spot.x <= 17 && spot.y >= 2 && spot.y <= 7);
    assert.equal(central.length, 0, `${stage.id} 在開闊平原標了禁行`);
  }
});
test('10 章各自提供 field、boss 與四張 HARD 21×10 大地圖', () => {
  const assets = new Set(content.stages.map(stage => content.mapAsset(stage)));
  assert.equal(assets.size, 60);
  assets.forEach(asset => { assert.match(asset, /chapter-\d{2}-(field|boss|hard-[1-4])-21x10\.jpg$/); assert.ok(existsSync(join(root, asset)), `缺少 ${asset}`); });
  assert.equal(content.mapAsset(content.stageById('c1-1')), 'assets/maps/chapter-01-field-21x10.jpg');
  assert.equal(content.mapAsset(content.stageById('c10-boss')), 'assets/maps/chapter-10-boss-21x10.jpg');
  assert.equal(content.mapAsset(content.stageById('c6-h3')), 'assets/maps/chapter-06-hard-3-21x10.jpg');
  assert.equal(new Set([1, 2, 3, 4].map(index => content.mapAsset(content.stageById('c6-h' + index)))).size, 4);
});
test('地形以連續區塊生成而非零碎散點', () => {
  for (const map of content.maps) {
    const stage = content.stages.find(entry => entry.mapId === map.id);
    const cells = [];
    for (let y = 0; y < 10; y++) for (let x = 0; x < 21; x++) {
      const terrain = content.terrainAt(stage, x, y);
      if (terrain) cells.push({ x, y, terrain });
    }
    const connected = cells.filter(cell => [[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy]) => content.terrainAt(stage, cell.x + dx, cell.y + dy) === cell.terrain));
    if (cells.length) assert.ok(connected.length / cells.length >= 0.8, `${map.id} 地形仍過度零碎`);
  }
  assert.ok(content.maps.some(map => content.terrainAt(content.stages.find(stage => stage.mapId === map.id), 10, 5)), '所有章節中央都被分類成無地形');
});
test('六種定位都有三節點技能樹', () => assert.ok(Object.values(content.skillTrees).every(tree => tree.length === 3 && tree.every(node => node.id && node.bonus))));
test('任務具有進度目標與實際獎勵', () => assert.ok(content.quests.length >= 6 && content.quests.every(quest => quest.target > 0 && Object.keys(quest.reward).length)));

function progressionSandbox() {
  const storage = new Map();
  const sandbox = { console, TACTICAL_CONTENT: content, TACTICAL_PET_DATA: tactical, localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) } };
  sandbox.window = sandbox; vm.createContext(sandbox); vm.runInContext(readFileSync(join(root, 'js/core/TacticalProgression.js'), 'utf8'), sandbox); return { sandbox, storage };
}
test('新版進度服務會建立安全預設存檔（含初始幻獸與水晶）', () => { const { sandbox } = progressionSandbox(), service = new sandbox.TacticalProgression({ profiles: tactical, content }); assert.equal(service.state.party.join(','), 'molten_ball,fire_lion,fire_fox,leaf_ear_rabbit'); assert.equal(service.state.currentStage, 'c1-1'); assert.equal(service.state.crystals, 60); assert.equal(service.ownedPets().length, 4); assert.ok(service.state.party.every(id => service.owns(id))); });
test('舊版 3 人存檔保留隊伍並自動獲得擁有權', () => { const { sandbox, storage } = progressionSandbox(); storage.set('jose-tactics-progression-v2', JSON.stringify({ party: ['fire_fox', 'forest_deer', 'abyss_dragon'], medals: 9, fusion: { sea_emperor: 2 } })); const service = new sandbox.TacticalProgression({ profiles: tactical, content }); assert.equal(service.state.party.join(','), 'fire_fox,forest_deer,abyss_dragon'); assert.equal(service.state.medals, 9); assert.ok(service.owns('sea_emperor')); });
test('召喚消耗水晶、給新幻獸或碎片補償', () => {
  const { sandbox } = progressionSandbox(), service = new sandbox.TacticalProgression({ profiles: tactical, content });
  service.state.crystals = 300;
  const result = service.pull(10);
  assert.equal(result.ok, true); assert.equal(result.results.length, 10); assert.equal(service.state.crystals, 30);
  assert.ok(service.pull(10).ok === false);
  result.results.forEach(entry => assert.ok(service.owns(entry.pet.id)));
});
test('隊伍依 25 出陣單位編成：1×1=1、2×2=4、3×3=3', () => {
  const sizeThree = Array.from({ length: 8 }, (_, index) => ({ ...tactical[0], id: 'test-size3-' + index, size: 3 }));
  const profilesWithSizeThree = tactical.concat(sizeThree);
  const { sandbox } = progressionSandbox(), service = new sandbox.TacticalProgression({ profiles: profilesWithSizeThree, content });
  const unowned = tactical.find(pet => !service.owns(pet.id));
  assert.equal(service.setParty([unowned.id]), false);
  assert.equal(service.setParty(['fire_fox']), true);
  assert.equal(service.setParty([]), false);
  assert.equal(service.setParty(['fire_fox', 'fire_fox']), false);
  const small = tactical.filter(pet => pet.size === 1).slice(0, 26);
  const large = tactical.filter(pet => pet.size === 2).slice(0, 7);
  small.concat(large).concat(sizeThree).forEach(pet => { service.state.owned[pet.id] = true; });
  assert.equal(service.setParty(small.slice(0, 25).map(pet => pet.id)), true, '25 隻 1×1 應可出陣');
  assert.equal(service.setParty(small.slice(0, 26).map(pet => pet.id)), false, '26 隻 1×1 應超過容量');
  assert.equal(service.setParty(large.slice(0, 6).map(pet => pet.id).concat(small[0].id)), true, '6 隻 2×2 + 1 隻 1×1 應剛好 25');
  assert.equal(service.setParty(large.slice(0, 7).map(pet => pet.id)), false, '7 隻 2×2 應超過容量');
  assert.equal(service.setParty(sizeThree.map(pet => pet.id).concat(small[0].id)), true, '8 隻 3×3 + 1 隻 1×1 應剛好 25');
  assert.equal(service.partyCost(), 25); assert.equal(service.partyCapacity(), 25);
});
test('每日任務依日期重置且可領取獎勵', () => {
  const { sandbox } = progressionSandbox(), service = new sandbox.TacticalProgression({ profiles: tactical, content });
  const daily = service.dailyState();
  assert.equal(daily.battles, 0);
  service.completeBattle(content.stages[0], { win: true, round: 8, survivors: 6, partySize: 6 });
  assert.equal(service.dailyState().battles, 1);
  service.state.daily.battles = 3;
  const quest = service.dailyQuests()[0];
  assert.equal(service.claimDaily(quest.id).ok, true);
  assert.equal(service.claimDaily(quest.id).ok, false);
});
test('幻獸之家駐守與收成、商店每日限購', () => {
  const { sandbox } = progressionSandbox(), service = new sandbox.TacticalProgression({ profiles: tactical, content });
  assert.equal(service.setResident(0, 'fire_fox'), true);
  assert.equal(service.setResident(1, 'fire_fox'), false, '不可重複駐守');
  service.state.home.lastCollect = Date.now() - 5 * 3600000;
  const pending = service.homePending();
  assert.ok(pending.yields[0].amount >= 10, '5 小時應累積 10 精華');
  const before = service.state.essences.fire;
  assert.equal(service.collectHome().ok, true);
  assert.ok(service.state.essences.fire >= before + 10);
  service.state.crystals = 200;
  assert.equal(service.buyOffer('essence-crystal', 'light').ok, true);
  assert.ok(service.state.essences.light >= 10);
  const offer = service.shopOffers().find(entry => entry.id === 'core-pack');
  service.state.crystals = 999;
  for (let index = 0; index < offer.daily; index++) assert.equal(service.buyOffer('core-pack').ok, true);
  assert.equal(service.buyOffer('core-pack').ok, false, '超過每日限購');
});
test('經濟系統：星級進階與複製體販售', () => {
  const { sandbox } = progressionSandbox(), service = new sandbox.TacticalProgression({ profiles: tactical, content });
  assert.equal(service.state.gold, 200);
  assert.equal(service.starUp('fire_fox').ok, false, '沒有複製體不能升星');
  service.state.copies.fire_fox = 3; service.state.gold = 1000;
  assert.equal(service.starUp('fire_fox').ok, true);
  assert.equal(service.starOf('fire_fox'), 1);
  assert.ok(Math.abs(service.starMultiplier('fire_fox') - 1.1) < 1e-9);
  const cost2 = service.starCost('fire_fox');
  assert.equal(cost2.copies, 2);
  const goldBefore = service.state.gold;
  assert.equal(service.sellCopy('fire_fox').ok, true);
  assert.ok(service.state.gold > goldBefore);
  const dup = service.grantPet('fire_fox');
  assert.equal(dup.isNew, false); assert.ok(dup.copies >= 1);
});
test('無限塔：勝利提升最高層並發獎', () => {
  const { sandbox } = progressionSandbox(), service = new sandbox.TacticalProgression({ profiles: tactical, content });
  const result = service.completeTower(3, true);
  assert.equal(result.best, 3); assert.ok(result.reward.crystals > 0);
  service.completeTower(2, true);
  assert.equal(service.state.tower.best, 3, '低樓層不會倒退');
  const source = readFileSync(join(root, 'js/tactics.js'), 'utf8');
  assert.match(source, /function towerStageFor/); assert.match(source, /function enterTower/);
  const html = readFileSync(join(root, 'tactics.html'), 'utf8');
  assert.match(html, /id="open-tower"/); assert.match(html, /id="gold"/);
});
test('圖鑑收集提供全帳號加成', () => {
  const { sandbox } = progressionSandbox(), service = new sandbox.TacticalProgression({ profiles: tactical, content });
  tactical.forEach(pet => { service.state.owned[pet.id] = true; });
  const dex = service.dexSummary();
  assert.equal(dex.total, 115); assert.ok(dex.allBonus >= 0.11); assert.equal(dex.elementBonus.fire, 0.03); assert.equal(dex.elementBonus.light, 0.03); assert.equal(dex.elementBonus.dark, 0.03);
  assert.ok(service.bonusesFor(tactical[0]).all >= dex.allBonus);
});
test('主線依序解鎖、HARD 需通關本章首領', () => {
  const { sandbox } = progressionSandbox(), service = new sandbox.TacticalProgression({ profiles: tactical, content });
  assert.equal(service.selectStage('c10-boss'), false);
  assert.equal(service.isStageUnlocked('c1-h1'), false);
  service.completeBattle(content.stageById('c1-1'), { win: true, round: 8, survivors: 4, partySize: 4 });
  assert.equal(service.isStageUnlocked('c1-2'), true);
  for (let index = 2; index <= 10; index++) service.completeBattle(content.stageById('c1-' + index), { win: true, round: 8, survivors: 4, partySize: 4 });
  assert.equal(service.isStageUnlocked('c1-boss'), true);
  assert.equal(service.isStageUnlocked('c1-h1'), false);
  service.completeBattle(content.stageById('c1-boss'), { win: true, round: 9, survivors: 4, partySize: 4, bossKill: true });
  assert.equal(service.isStageUnlocked('c2-1'), true, '擊敗首領開啟下一章');
  assert.equal(service.isStageUnlocked('c1-h1'), true, 'HARD 於首領後解鎖');
  assert.equal(service.state.currentStage, 'c2-1');
});
test('首次通關會寫入星數並發放掉落', () => { const { sandbox } = progressionSandbox(), service = new sandbox.TacticalProgression({ profiles: tactical, content }), reward = service.completeBattle(content.stages[0], { win: true, round: 8, survivors: 4, partySize: 4 }); assert.equal(reward.stars, 3); assert.equal(service.state.medals, content.stages[0].rewards.medals); assert.equal(service.state.essences.forest, content.stages[0].rewards.essence); assert.ok(reward.crystals > 0); });
test('控場與首領擊殺會累積任務統計', () => { const { sandbox } = progressionSandbox(), service = new sandbox.TacticalProgression({ profiles: tactical, content }); service.recordControl(); service.recordControl(); assert.equal(service.state.controls, 2); service.completeBattle(content.stages[3], { win: true, round: 9, survivors: 2, bossKill: true }); assert.equal(service.state.bossKills, 1); });
test('融合消耗材料、提升階級並產生技能點', () => { const { sandbox } = progressionSandbox(), service = new sandbox.TacticalProgression({ profiles: tactical, content }), pet = tactical[2]; service.state.fusionCores = 5; service.state.essences[pet.element] = 20; assert.equal(service.fuse(pet).ok, true); assert.equal(service.state.fusion[pet.id], 1); assert.equal(service.state.skillPoints[pet.id], 1); assert.ok(service.bonusesFor(pet).all >= 0.04); });
test('技能樹會檢查技能點與前置節點', () => { const { sandbox } = progressionSandbox(), service = new sandbox.TacticalProgression({ profiles: tactical, content }), pet = tactical[2], tree = service.treeFor(pet); service.state.skillPoints[pet.id] = 5; assert.equal(service.unlockSkill(pet, tree[1].id).ok, false); assert.equal(service.unlockSkill(pet, tree[0].id).ok, true); assert.equal(service.unlockSkill(pet, tree[1].id).ok, true); });
test('最終進化需要成長體、材料與融合', () => { const { sandbox } = progressionSandbox(), service = new sandbox.TacticalProgression({ profiles: tactical, content }), pet = tactical[2]; service.state.medals = 30; service.state.essences[pet.element] = 30; assert.equal(service.unlockEvolution(pet, 2).ok, true); assert.equal(service.unlockEvolution(pet, 3).ok, false); service.state.fusion[pet.id] = 1; assert.equal(service.unlockEvolution(pet, 3).ok, true); });

test('主頁只導向唯一戰棋模式', () => { const home = readFileSync(join(root, 'index.html'), 'utf8'); assert.match(home, /url=tactics\.html/); assert.match(home, /href="tactics\.html"/); });
test('戰棋使用 21×10 地圖、25 出陣單位、路徑搜尋與分體型部署', () => { const source = readFileSync(join(root, 'js/tactics.js'), 'utf8'); assert.match(source, /COLS = 21, ROWS = 10/); assert.match(source, /DEPLOY_CAPACITY = 25/); assert.match(source, /function pathTo/); assert.match(source, /function placeAllies/); assert.match(source, /function canStand/); assert.match(source, /function unitSize/); assert.match(source, /function inLargeDeployReserve/); assert.match(source, /function enemyFormation/); assert.match(source, /function squadActive/); assert.match(source, /function canMove\(unit, x, y\).*pathTo/); });
test('待機、移動與攻擊依左右方向切換全名冊動畫', () => {
  const source = readFileSync(join(root, 'js/tactics.js'), 'utf8');
  const css = readFileSync(join(root, 'css/tactics-screens.css'), 'utf8');
  assert.match(source, /facing: team === 'ally' \? 'right' : 'left'/);
  assert.match(source, /path\[index\]\.x > fromX \? 'right' : 'left'/);
  assert.match(source, /target\.x > unit\.x \? 'right' : 'left'/);
  assert.match(source, /motion-sprite facing-/); assert.match(source, /-motion-sheet\.webp/);
  ['motion-idle-right', 'motion-idle-left', 'motion-walk-right', 'motion-walk-left', 'motion-attack-right', 'motion-attack-left'].forEach(name => assert.match(css, new RegExp(name)));
});
test('移動、地形顯示與打擊感採新版戰鬥演出', () => {
  const source = readFileSync(join(root, 'js/tactics.js'), 'utf8');
  const html = readFileSync(join(root, 'tactics.html'), 'utf8');
  const css = readFileSync(join(root, 'css/tactics-battle.css'), 'utf8');
  assert.match(source, /function animateWaypoints/); assert.match(source, /piece\.animate\(keyframes/);
  assert.match(source, /function hitStop/); assert.match(source, /combatShake\(skill\.kind === 'ultimate'/);
  assert.match(source, /jose-terrain-visibility/); assert.match(html, /id="terrain-toggle"/);
  assert.match(css, /\.board\.hitstop \*/); assert.match(css, /impact-shake-ultimate/); assert.match(css, /unit-death-sink/); assert.match(css, /opacity:\.25!important/);
});
test('行動裝置只在使用者互動後觸發震動', () => {
  const source = readFileSync(join(root, 'js/core/TacticalAudio.js'), 'utf8');
  assert.match(source, /navigator\.userActivation/); assert.match(source, /activation\.hasBeenActive/);
});
test('我方主部署區恰為 25 格並可容納六個 2×2 加一個 1×1', () => {
  const cells = [];
  for (let y = 6; y <= 9; y++) for (let x = 3; x <= 8; x++) cells.push({ x, y });
  cells.push({ x: 9, y: 9 });
  assert.equal(new Set(cells.map(cell => cell.x + ',' + cell.y)).size, 25);
  const occupied = new Set();
  for (const anchor of [{x:3,y:6},{x:5,y:6},{x:7,y:6},{x:3,y:8},{x:5,y:8},{x:7,y:8}]) {
    for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) occupied.add((anchor.x + dx) + ',' + (anchor.y + dy));
  }
  occupied.add('9,9'); assert.equal(occupied.size, 25);
});
test('敵軍名冊展開為 10~30 隻且首領在首位', () => {
  for (const stage of content.stages) {
    const roster = content.rosterFor(stage);
    assert.ok(roster.length >= 10 && roster.length <= 30, `${stage.id} 名冊 ${roster.length}`);
    assert.ok(roster.every(id => enemies.some(enemy => enemy.id === id)));
    if (stage.boss) {
      assert.ok(enemies.find(enemy => enemy.id === roster[0])?.boss);
      assert.equal(roster.filter(id => enemies.find(enemy => enemy.id === id)?.boss).length, 1);
    }
  }
});
test('SRPG 介面：點敵即施放、階段橫幅、威脅範圍、待機與取消移動', () => {
  const source = readFileSync(join(root, 'js/tactics.js'), 'utf8');
  const clickSource = source.slice(source.indexOf('async function clickCell'), source.indexOf('function closest'));
  assert.match(clickSource, /clearForecast\(\);\s*await act\(unit, target, skillOf\(unit\), state\.skill\)/);
  assert.doesNotMatch(clickSource, /pendingTarget|showForecast|再點一次|fc-confirm/);
  assert.match(source, /function phaseBanner/); assert.match(source, /function computeThreat/);
  assert.match(source, /'🕒 待機'/); assert.match(source, /'↩ 取消移動'/);
  const html = readFileSync(join(root, 'tactics.html'), 'utf8');
  assert.doesNotMatch(html, /id="forecast"/); assert.match(html, /battle-topbar-tools/);
});
test('大地圖鏡頭：拖曳平移、點選置中與小地圖', () => {
  const source = readFileSync(join(root, 'js/tactics.js'), 'utf8');
  assert.match(source, /function focusCamera/); assert.match(source, /function enableCameraDrag/); assert.match(source, /function renderMinimap/);
  const unitClickSource = source.slice(source.indexOf("element.addEventListener('click', function (event)"), source.indexOf('var threatTileMap'));
  assert.match(unitClickSource, /focusUnit\(unit, false\)/);
  assert.match(source, /gridTemplateColumns = 'repeat\(' \+ COLS/);
  const html = readFileSync(join(root, 'tactics.html'), 'utf8');
  assert.match(html, /id="minimap"/); assert.match(html, /id="minimap-view"/);
});
test('戰鬥引擎具備視線遮蔽、位移、狀態與部署階段', () => { const source = readFileSync(join(root, 'js/tactics.js'), 'utf8'); assert.match(source, /function lineClear/); assert.match(source, /async function displace/); assert.match(source, /function planFor/); assert.match(source, /phase: 'deploy'/); assert.match(source, /unit\.freeze/); assert.match(source, /unit\.poison/); });
test('棋盤角色可存取且不重複顯示精確血量文字', () => { const source = readFileSync(join(root, 'js/tactics.js'), 'utf8'); assert.doesNotMatch(source, /class=\\?"unit-hp/); assert.match(source, /element\.setAttribute\('aria-label', unit\.p\.name \+ '，生命 '/); assert.match(source, /state\.mode === 'skill' && selected\(\) && canTarget\(selected\(\), unit\)/); });
test('戰棋頁載入敵人資料、Boss 介面與戰鬥樣式', () => { const html = readFileSync(join(root, 'tactics.html'), 'utf8'); assert.match(html, /tactical-content\.js/); assert.match(html, /tactical-enemies\.js/); assert.match(html, /tactics-battle\.css/); assert.match(html, /id="boss-bar"/); assert.match(html, /id="boss-intro"/); assert.match(html, /id="campaign-modal"/); assert.match(html, /id="growth-modal"/); });
test('主城功能格：關卡、編隊、強化、圖鑑、召喚、每日任務', () => {
  const html = readFileSync(join(root, 'tactics.html'), 'utf8');
  assert.match(html, /class="hub-grid"/); assert.match(html, /id="open-dex"/); assert.match(html, /id="open-gacha"/); assert.match(html, /id="open-daily"/); assert.match(html, /id="hub-party"/); assert.match(html, /id="crystals"/);
  assert.match(html, /id="dex-modal"/); assert.match(html, /id="gacha-modal"/); assert.match(html, /id="daily-modal"/);
  assert.match(html, /id="home-modal"/); assert.match(html, /id="shop-modal"/); assert.match(html, /id="bag-modal"/); assert.match(html, /id="open-home"/); assert.match(html, /id="open-shop"/); assert.match(html, /id="open-bag"/);
  const source = readFileSync(join(root, 'js/tactics.js'), 'utf8');
  assert.match(source, /function renderDex/); assert.match(source, /function doPull/); assert.match(source, /function renderDaily/); assert.match(source, /function renderCampaign/); assert.match(source, /chapter-tab/);
});
test('三畫面架構：準備、戰鬥、結算各自獨立', () => {
  const html = readFileSync(join(root, 'tactics.html'), 'utf8');
  assert.match(html, /id="screen-home"/); assert.match(html, /id="screen-battle"[^>]*hidden/); assert.match(html, /id="screen-result"[^>]*hidden/);
  assert.match(html, /id="enter-battle"/); assert.match(html, /id="battle-exit"/); assert.match(html, /id="result-home"/);
  assert.match(html, /tactics-screens\.css/);
  assert.match(html, /class="terrain-rules"/); assert.match(html, /class="board-legend"/);
  const source = readFileSync(join(root, 'js/tactics.js'), 'utf8');
  assert.match(source, /function setView\(view\)/);
});
test('戰鬥棋盤固定完整顯示、取消放大與拖曳，並保留體型樣式', () => { const css = readFileSync(join(root, 'css/tactics-screens.css'), 'utf8'); assert.match(css, /--cell:calc\(clamp/); assert.match(css, /board-scroll\{overflow:hidden;height:auto;cursor:default/); assert.match(css, /aspect-ratio:21 \/ 10/); assert.match(css, /\.unit\.size-2/); assert.match(css, /\.unit\.size-3/); assert.match(css, /boss-unit::before/); const source = readFileSync(join(root, 'js/tactics.js'), 'utf8'); assert.match(source, /COLS = 21, ROWS = 10/); assert.match(source, /dom\.board\.style\.width = '100%'/); });

test('所有幻獸與敵人依資料佔 1×1、2×2 或 3×3，立繪盡量填滿完整佔格', () => {
  const css = readFileSync(join(root, 'css/tactics-screens.css'), 'utf8');
  assert.ok(profiles.every(pet => [1, 2, 3].includes(pet.size)));
  assert.match(css, /\.unit\.size-1[^}]*width:100%[^}]*height:100%/);
  assert.match(css, /\.unit\.size-2[^}]*width:200%[^}]*height:200%/);
  assert.match(css, /\.unit\.size-3[^}]*width:300%[^}]*height:300%/);
  assert.match(css, /\.idle-arena \.unit \.portrait[^}]*inset:0 0 7px[^}]*width:100%/);
  assert.match(css, /background-position:center bottom/);
});
test('戰前主城可垂直捲動，進入戰鬥操作列固定可見', () => {
  const html = readFileSync(join(root, 'tactics.html'), 'utf8');
  const screens = readFileSync(join(root, 'css/tactics-screens.css'), 'utf8');
  assert.match(html, /class="enter-battle-dock"/); assert.match(html, /id="enter-battle"/);
  assert.match(screens, /body\.view-home\{[^}]*overflow-y:auto/);
  assert.match(screens, /body\.view-home \.screen-home\{[^}]*height:auto[^}]*overflow:visible/);
  assert.match(screens, /\.enter-battle-dock\{position:fixed/);
  assert.match(screens, /padding-bottom:118px/);
});
test('戰鬥框架使用左方戰隊、中央棋盤、右方敵情與指令三欄', () => {
  const html = readFileSync(join(root, 'tactics.html'), 'utf8');
  const source = readFileSync(join(root, 'js/tactics.js'), 'utf8');
  const screens = readFileSync(join(root, 'css/tactics-screens.css'), 'utf8');
  assert.match(html, /class="battle-ally-panel"/); assert.match(html, /id="battle-ally-list"/);
  assert.match(html, /class="board-wrap"/); assert.match(html, /class="side-panel battle-panel"/);
  assert.match(html, /id="battle-enemy-count"/); assert.match(html, /id="battle-enemy-summary"/);
  assert.match(source, /function renderBattleSides/); assert.match(source, /renderBattleSides\(\)/);
  assert.match(screens, /grid-template-columns:190px minmax\(0,1fr\) 292px/);
  assert.match(screens, /\.battle-main\{[^}]*flex:0 0 auto/);
  assert.match(screens, /\.screen-battle \.board\{margin-inline:auto\}/);
  assert.match(screens, /@media \(max-width:980px\)[\s\S]*\.battle-ally-panel\{display:none\}/);
});
test('升星、融合與進化顯示材料帳本、完整說明並經確認才扣料', () => {
  const html = readFileSync(join(root, 'tactics.html'), 'utf8');
  const source = readFileSync(join(root, 'js/tactics.js'), 'utf8');
  const screens = readFileSync(join(root, 'css/tactics-screens.css'), 'utf8');
  const growthSource = source.slice(source.indexOf('var pendingGrowthAction'), source.indexOf('function growthMessage'));
  assert.match(html, /id="growth-confirm-modal"/); assert.match(html, /id="growth-confirm-accept"/);
  assert.match(growthSource, /function growthMaterialsHtml/); assert.match(growthSource, /持有.*需求.*使用後/);
  assert.match(growthSource, /growth-resource-ledger/); assert.match(growthSource, /growth-action-card/g);
  assert.equal((growthSource.match(/openGrowthConfirmation\(\{/g) || []).length, 3);
  assert.match(source, /growthConfirmAccept\.onclick = function \(\) \{ var action = pendingGrowthAction; if \(!action\) return; closeGrowthConfirmation\(\); action\(\); \}/);
  assert.match(screens, /\.growth-resource-ledger/); assert.match(screens, /\.growth-confirm-materials/);
});
test('遠距技能依施術者屬性產生飛行投射物，並等待飛行完成再結算', () => {
  const source = readFileSync(join(root, 'js/tactics.js'), 'utf8');
  assert.match(source, /projectile-fire|fire: '火球'/); assert.match(source, /projectileDelay = addProjectile/); assert.match(source, /await pause\(projectileDelay\)/);
  const css = readFileSync(join(root, 'css/tactics-battle.css'), 'utf8');
  ['fire', 'forest', 'ocean', 'light', 'dark'].forEach(element => assert.match(css, new RegExp('projectile-' + element)));
});
test('戰鬥側欄只保留戰鬥資訊，不顯示進化解鎖按鈕', () => {
  const html = readFileSync(join(root, 'tactics.html'), 'utf8');
  const source = readFileSync(join(root, 'js/tactics.js'), 'utf8');
  const detailSource = source.slice(source.indexOf('function renderDetail'), source.indexOf('async function clickCell'));
  assert.doesNotMatch(html, /id="evolution-buttons"/); assert.doesNotMatch(source, /dom\.evolution/);
  assert.doesNotMatch(detailSource, /unit\.p\.evolution|進化階段|成長體|最終型/);
  assert.match(html, /class="skill-help"/); assert.match(source, /skill\.kind === 'basic' \? '⚔ 普攻/);
});
test('鏡頭只在玩家點選時置中，移動、攻擊與敵方行動不自動追鏡', () => {
  const source = readFileSync(join(root, 'js/tactics.js'), 'utf8');
  assert.match(source, /card\.onclick[\s\S]*focusUnit\(unit, false\)/);
  assert.match(source, /state\.phase === 'deploy'[\s\S]*focusUnit\(unit, false\)/);
  assert.doesNotMatch(source, /focusUnit\(enemy/);
  const walkSource = source.slice(source.indexOf('async function walkUnit'), source.indexOf('function terrainAttackMultiplier'));
  const actSource = source.slice(source.indexOf('async function act'), source.indexOf('function processRoundEffects'));
  assert.doesNotMatch(walkSource, /focusCamera|focusUnit/);
  assert.doesNotMatch(actSource, /focusCamera|focusUnit/);
});

test('部署藍格僅在部署階段顯示，戰鬥地形具有獨立辨識符號', () => {
  const source = readFileSync(join(root, 'js/tactics.js'), 'utf8');
  const battleCss = readFileSync(join(root, 'css/tactics-battle.css'), 'utf8');
  const screenCss = readFileSync(join(root, 'css/tactics-screens.css'), 'utf8');
  assert.match(source, /classList\.toggle\('is-deploying', state\.phase === 'deploy'\)/);
  assert.match(battleCss, /\.board\.is-deploying \.cell\.deploy-zone/);
  assert.match(battleCss, /\.board:not\(\.is-deploying\) \.cell\.deploy-zone/);
  assert.match(source, /terrainGlyph = tile === 'fire' \? '♨' : tile === 'forest' \? '♣' : '≈'/);
  assert.match(screenCss, /terrain-hint-water/);
});
test('內部遊玩 10 場均在硬回合上限內結束', () => { const result = spawnSync(process.execPath, ['scripts/simulate-tactics.mjs'], { cwd: root, encoding: 'utf8' }); assert.equal(result.status, 0, result.stderr || result.stdout); assert.match(result.stdout, /10 場通過/); assert.equal((result.stdout.match(/第 \d+ 場/g) || []).length, 10); });

console.log(`\n${passed}/${total} regression checks passed.`);
