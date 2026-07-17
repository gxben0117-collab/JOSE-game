import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
let passed = 0, total = 0;
function test(name, fn) { total++; try { fn(); passed++; console.log(`✓ ${name}`); } catch (error) { console.error(`✗ ${name}\n${error.stack}`); process.exitCode = 1; } }

const context = { console };
context.window = context;
vm.createContext(context);
for (const file of ['js/data/pets.js', 'js/data/pets-lightdark.js', 'js/data/pets-pack.js', 'js/data/tactical-pets.js', 'js/data/tactical-enemies.js', 'js/data/tactical-content.js']) vm.runInContext(readFileSync(join(root, file), 'utf8'), context, { filename: file });
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
test('障礙物配置決定性、落在中央走廊且形成相鄰群組', () => {
  for (const stage of content.stages) {
    const first = content.obstaclesFor(stage, 20, 20), second = content.obstaclesFor(stage, 20, 20);
    assert.deepEqual(first, second);
    assert.ok(first.length >= 9 && first.length <= 12);
    assert.ok(first.every(spot => spot.x >= 7 && spot.x <= 17 && spot.y >= 1 && spot.y <= 18));
    assert.ok(first.every(spot => first.some(other => other !== spot && Math.abs(other.x - spot.x) + Math.abs(other.y - spot.y) <= 2)), `${stage.id} 出現孤立障礙物`);
  }
});
test('地形以連續區塊生成而非零碎散點', () => {
  for (const map of content.maps) {
    const stage = content.stages.find(entry => entry.mapId === map.id);
    const cells = [];
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) {
      const terrain = content.terrainAt(stage, x, y);
      if (terrain) cells.push({ x, y, terrain });
    }
    const connected = cells.filter(cell => [[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy]) => content.terrainAt(stage, cell.x + dx, cell.y + dy) === cell.terrain));
    assert.ok(cells.length > 40 && connected.length / cells.length >= 0.88, `${map.id} 地形仍過度零碎`);
  }
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
test('隊伍只能編入已擁有的幻獸（1〜10 隻）', () => {
  const { sandbox } = progressionSandbox(), service = new sandbox.TacticalProgression({ profiles: tactical, content });
  const unowned = tactical.find(pet => !service.owns(pet.id));
  assert.equal(service.setParty([unowned.id]), false);
  assert.equal(service.setParty(['fire_fox']), true);
  assert.equal(service.setParty([]), false);
  assert.equal(service.setParty(['fire_fox', 'fire_fox']), false);
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
test('戰棋使用 20×20 地圖、最多 10 人編隊、路徑搜尋與左下部署', () => { const source = readFileSync(join(root, 'js/tactics.js'), 'utf8'); assert.match(source, /COLS = 20, ROWS = 20/); assert.match(source, /PARTY_SIZE = 10/); assert.match(source, /function pathTo/); assert.match(source, /function placeAllies/); assert.match(source, /function canStand/); assert.match(source, /function unitSize/); assert.match(source, /function enemyFormation/); assert.match(source, /function squadActive/); assert.match(source, /function canMove\(unit, x, y\).*pathTo/); });
test('我方左下站位 10 格不重疊且全在 6×6 部署區內', () => {
  const slots = Array.from({ length: 10 }, (_, index) => ({ x: 1 + (index % 5), y: 13 + Math.floor(index / 5) * 2 }));
  assert.equal(new Set(slots.map(slot => slot.x + ',' + slot.y)).size, 10);
  assert.ok(slots.every(slot => slot.x >= 1 && slot.x <= 6 && slot.y >= 13 && slot.y <= 18));
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
test('戰鬥棋盤與單位預設放大 1.5 倍且支援縮放與體型樣式', () => { const css = readFileSync(join(root, 'css/tactics-screens.css'), 'utf8'); assert.match(css, /--zoom:1\.5/); assert.match(css, /--cell:calc\(clamp/); assert.match(css, /\*var\(--zoom\)/); assert.match(css, /height:calc\(var\(--cell\)\*9/); assert.match(css, /\.unit\.size-2/); assert.match(css, /\.unit\.size-3/); assert.match(css, /boss-unit::before/); const source = readFileSync(join(root, 'js/tactics.js'), 'utf8'); assert.match(source, /boardZoom = 1\.5/); });

test('所有幻獸與敵人依資料佔 1×1、2×2 或 3×3，立繪盡量填滿完整佔格', () => {
  const css = readFileSync(join(root, 'css/tactics-screens.css'), 'utf8');
  assert.ok(profiles.every(pet => [1, 2, 3].includes(pet.size)));
  assert.match(css, /\.unit\.size-1[^}]*width:100%[^}]*height:100%/);
  assert.match(css, /\.unit\.size-2[^}]*width:200%[^}]*height:200%/);
  assert.match(css, /\.unit\.size-3[^}]*width:300%[^}]*height:300%/);
  assert.match(css, /\.idle-arena \.unit \.portrait[^}]*inset:0 0 7px[^}]*width:100%/);
  assert.match(css, /background-position:center bottom/);
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
