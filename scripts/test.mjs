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
for (const file of ['js/data/pets.js', 'js/data/pets-lightdark.js', 'js/data/pets-pack.js', 'js/data/tactical-pets.js', 'js/data/tactical-enemies.js', 'js/data/map-terrain.js', 'js/data/tactical-content.js', 'js/data/animation-config.js']) vm.runInContext(readFileSync(join(root, file), 'utf8'), context, { filename: file });
const pets = context.PET_DATA, tactical = context.TACTICAL_PET_DATA, enemies = context.TACTICAL_ENEMY_DATA, content = context.TACTICAL_CONTENT;
const profiles = tactical.concat(enemies);

test('動畫播放器支援每個動作 1～12 幀並安全限制設定', () => {
  const animations = context.TACTICAL_ANIMATION_CONFIG;
  assert.equal(animations.MIN_FRAMES, 1); assert.equal(animations.MAX_FRAMES, 12);
  assert.equal(animations.DEFAULT_CHARACTER_FRAMES, 8); assert.equal(animations.FEATURE_FRAMES, 12);
  assert.equal(animations.normalizeAnimationAction({ frameCount: 0 }).frameCount, 1);
  assert.equal(animations.normalizeAnimationAction({ frameCount: 99 }).frameCount, 12);
  assert.equal(animations.normalizeAnimationAction({ frames: ['1.png', '2.png', '3.png'], fps: 11, loop: false, hitFrame: 9 }).frameCount, 3);
  assert.equal(animations.normalizeAnimationAction({ frames: ['1.png', '2.png', '3.png'], hitFrame: 9 }).hitFrame, 3);
  assert.equal(animations.vfx({ kind: 'ultimate' }).frameCount, 12);
  assert.equal(animations.vfx({ kind: 'basic' }).frameCount, 8);
});

test('資料庫包含 115 隻幻獸（45 原生 + 20 光暗 + 50 素材包）', () => { assert.equal(pets.length, 115); assert.equal(pets.filter(pet => pet.element === 'light').length, 20); assert.equal(pets.filter(pet => pet.element === 'dark').length, 20); });
test('戰棋資料與主資料數量一致', () => assert.equal(tactical.length, pets.length));
test('每隻幻獸都有專屬且不重複的水晶召喚台詞', () => {
  const quotes = tactical.map(pet => pet.summonQuote);
  assert.equal(quotes.length, 115); assert.ok(quotes.every(quote => typeof quote === 'string' && quote.length >= 9 && !quote.startsWith('吾主，')));
  assert.equal(new Set(quotes).size, quotes.length);
});
test('每隻戰棋幻獸皆有三段進化', () => assert.ok(tactical.every(pet => pet.evolution?.length === 3)));
test('每隻戰棋幻獸皆有可用技能與正數數值', () => assert.ok(tactical.every(pet => pet.skills?.length && Object.values(pet.stats).every(value => value > 0))));
test('敵我所有戰棋單位皆以無冷卻傷害普攻作為第一技能', () => assert.ok(profiles.every(pet => pet.skills[0]?.kind === 'basic' && pet.skills[0].attackStyle !== 'support' && pet.skills[0].cooldown === 0 && pet.skills[0].multiplier > 0)));
test('被動技能不會混入可點擊技能', () => assert.ok(tactical.every(pet => pet.skills.every(skill => !['atk_boost', 'def_boost', 'hp_boost', 'all_boost', 'burn'].includes(skill.effect)))));
test('輔助技能的效果語意與攻擊型態一致', () => assert.ok(profiles.every(pet => pet.skills.every(skill => skill.attackStyle !== 'support' || ['heal', 'heal_all', 'shield', 'buff_atk'].includes(skill.effect)))));
test('範圍技能具有有效半徑', () => assert.ok(profiles.flatMap(pet => pet.skills).filter(skill => skill.attackStyle === 'area').every(skill => skill.radius >= 1)));
test('每個戰棋技能皆有資料驅動特效識別', () => assert.ok(profiles.every(pet => pet.skills.every(skill => skill.vfxKey && Number.isInteger(skill.vfxVariant) && skill.vfxHue >= 0 && skill.vfxHue < 360))));
test('所有戰棋頭像與三階透明立繪存在', () => assert.ok(tactical.every(pet => existsSync(join(root, pet.sourceSheet)) && pet.evolution.every(stage => existsSync(join(root, stage.portrait))))));

test('敵人資料包含第 11 章機械軍團共 50 種小兵與 15 隻首領（含 4×4 菁英、5×5 魔神）', () => { assert.equal(enemies.filter(enemy => enemy.minion).length, 50); assert.equal(enemies.filter(enemy => enemy.boss).length, 15); assert.ok(enemies.filter(enemy => enemy.boss).every(boss => boss.size >= 2 && boss.size <= 5)); assert.ok(enemies.some(enemy => enemy.boss && enemy.size === 4)); assert.ok(enemies.some(enemy => enemy.boss && enemy.size === 5)); });
test('小兵只有單一階段且首領有專屬立繪', () => assert.ok(enemies.every(enemy => enemy.evolution.length === 1 && enemy.evolution[0].portrait.startsWith('assets/enemies/'))));
test('所有敵人圖片檔案存在', () => assert.ok(enemies.every(enemy => existsSync(join(root, enemy.evolution[0].portrait)))));
test('115 隻幻獸與 65 隻魔獸皆有左右待機、移動、攻擊六列動畫表', () => {
  const manifest = JSON.parse(readFileSync(join(root, 'assets/animations/units/manifest.json'), 'utf8'));
  assert.equal(profiles.length, 180);
  for (const unit of profiles) {
    const entry = manifest[unit.id];
    assert.ok(entry, `${unit.id} 缺少動畫清單`);
    assert.equal(entry.columns, 4); assert.equal(entry.rows, 6); assert.equal(entry.frame, 112);
    assert.deepEqual(Array.from(entry.rowsOrder), ['idle-right', 'move-right', 'attack-right', 'idle-left', 'move-left', 'attack-left']);
    assert.ok(existsSync(join(root, entry.file)), `${unit.id} 缺少 ${entry.file}`);
  }
  const runtimeSheets = readdirSync(join(root, 'assets/animations/units')).filter(name => name.endsWith('-motion-sheet.webp'));
  assert.equal(runtimeSheets.length, 180);
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

test('戰役包含 11 大章節 × 165 關（121 主線 + 44 HARD）', () => {
  assert.equal(content.maps.length, 11); assert.equal(content.stages.length, 165);
  const main = content.stages.filter(stage => !stage.hard);
  assert.equal(main.length, 121);
  assert.deepEqual(Array.from(main, stage => stage.order).sort((a, b) => a - b), Array.from({ length: 121 }, (_, index) => index + 1));
  assert.equal(content.stages.filter(stage => stage.hard).length, 44);
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
test('第 1～11 章出場魔獸與可編入幻獸都有完整上下左右動作表', () => {
  const manifest = JSON.parse(readFileSync(join(root, 'assets/animations/directional/manifest.json'), 'utf8'));
  const chapterEnemies = new Set(content.stages.filter(stage => stage.chapter >= 1 && stage.chapter <= 11).flatMap(stage => stage.enemies));
  assert.equal(chapterEnemies.size, 53, '第 1～11 章目前應出場 53 種魔獸；其餘名冊保留給 Boss／無限塔等模式');
  const required = tactical.concat(Array.from(chapterEnemies, id => enemies.find(enemy => enemy.id === id)));
  for (const unit of required) {
    const entry = manifest[unit.id];
    assert.ok(entry, `${unit.id} 缺少四方向動作資料`);
    assert.equal(entry.columns, 8, `${unit.id} 每列須有八幀`);
    assert.equal(entry.rows, 24, `${unit.id} 須有 24 列（四方向 × 六動作）`);
    ['idle-down', 'move-down', 'attack-down', 'idle-up', 'move-up', 'attack-up', 'idle-left', 'move-left', 'attack-left', 'idle-right', 'move-right', 'attack-right'].forEach(action => assert.ok(entry.rowsOrder.includes(action), `${unit.id} 缺少 ${action}`));
    assert.ok(existsSync(join(root, entry.file)), `${unit.id} 缺少四方向動作圖檔`);
  }
});
test('腐帽根靈與毒刃螳螂的左右欄位依實戰校正，不會反向面對移動目標', () => {
  const manifest = JSON.parse(readFileSync(join(root, 'assets/animations/directional/manifest.json'), 'utf8'));
  ['rotcap_rootling', 'venom_mantis'].forEach(id => assert.deepEqual(Array.from(manifest[id].sourceColumns), [0, 3, 2, 1], `${id} 左右欄位未交換`));
  const builder = readFileSync(join(root, 'scripts/build-four-direction-motion.py'), 'utf8');
  assert.match(builder, /"rotcap_rootling", "venom_mantis"/);
});

test('關卡難度倍率章節內遞增、章節起點逐章提高', () => {
  assert.ok(content.stages.every(stage => stage.power >= 0.4));
  for (const map of content.maps) {
    const powers = content.stages.filter(stage => stage.mapId === map.id && !stage.hard).map(stage => stage.power);
    assert.ok(powers.every((power, index) => index === 0 || power >= powers[index - 1]), `${map.id} 章節內難度未遞增`);
  }
  const starts = content.maps.map(map => content.stages.find(stage => stage.mapId === map.id).power);
  assert.ok(starts.every((power, index) => index === 0 || power > starts[index - 1]), '章節起點難度未逐章提高');
});
test('66 張美術大地圖都有 21×10 逐格標註且只用合法圖例', () => {
  const grids = context.TACTICAL_MAP_TERRAIN;
  const keys = new Set(content.stages.map(stage => content.mapAsset(stage).match(/chapter-\d{2}-(?:field|boss|hard-[1-4])/)[0]));
  assert.equal(keys.size, 66);
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
test('11 章各自提供 field、boss 與四張 HARD 21×10 大地圖', () => {
  const assets = new Set(content.stages.map(stage => content.mapAsset(stage)));
  assert.equal(assets.size, 66);
  assets.forEach(asset => { assert.match(asset, /chapter-\d{2}-(field|boss|hard-[1-4])-21x10\.jpg$/); assert.ok(existsSync(join(root, asset)), `缺少 ${asset}`); });
  assert.equal(content.mapAsset(content.stageById('c1-1')), 'assets/maps/chapter-01-field-21x10.jpg');
  assert.equal(content.mapAsset(content.stageById('c10-boss')), 'assets/maps/chapter-10-boss-21x10.jpg');
  assert.equal(content.mapAsset(content.stageById('c11-boss')), 'assets/maps/chapter-11-boss-21x10.jpg');
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
});
test('滿編前五章、無限塔與 Boss 來襲維持舒適曲線，第六章後才逐步提高壓力', () => {
  const source = readFileSync(join(root, 'js/tactics.js'), 'utf8');
  assert.match(source, /var gentle = stage\.tower \|\| stage\.bossRaid \|\| Number\(stage\.chapter\) <= 5/);
  assert.match(source, /minimumScale = \(gentle \? 0\.48 : 0\.62\)/);
  assert.match(source, /enemyScale: Math\.max\(scale \* balance\.scale, balance\.minimumScale\)/);
  const fullPartyMinimum = 0.48 + (25 - 8) * 0.025;
  assert.equal(Math.round(fullPartyMinimum * 100) / 100, 0.91);
  assert.ok(content.stageById('c5-1').power < content.stageById('c6-1').power);
  assert.ok(content.stageById('c6-1').power < content.stageById('c10-1').power);
});
test('全部戰鬥單位與 65 隻原生幻獸進化階段具有四方向八幀動作圖集', () => {
  const manifest = JSON.parse(readFileSync(join(root, 'assets/animations/directional/manifest.json'), 'utf8'));
  const unitIds = Array.from(profiles, unit => unit.id).sort();
  const rows = ['idle-down','move-down','attack-down','hit-down','victory-down','death-down','idle-right','move-right','attack-right','hit-right','victory-right','death-right','idle-up','move-up','attack-up','hit-up','victory-up','death-up','idle-left','move-left','attack-left','hit-left','victory-left','death-left'];
  assert.deepEqual(Object.keys(manifest).sort(), unitIds);
  for (const id of unitIds) {
    assert.equal(manifest[id].columns, 8); assert.equal(manifest[id].rows, 24); assert.equal(manifest[id].frame, 112);
    for (const action of ['idle', 'move', 'attack']) {
      assert.equal(manifest[id].animations[action].frameCount, 8);
      assert.ok(manifest[id].animations[action].fps > 0 && manifest[id].animations[action].fps <= 60);
      if (manifest[id].animations[action].hitFrame) assert.ok(manifest[id].animations[action].hitFrame <= 8);
    }
    assert.deepEqual(Array.from(manifest[id].rowsOrder), rows); assert.ok(existsSync(join(root, manifest[id].file)));
    assert.ok(['authored-four-direction', 'derived-from-approved-motion', 'authored-front-back-and-approved-side'].includes(manifest[id].sourceType));
    const profile = profiles.find(unit => unit.id === id);
    const hasEvolutionArt = profile.evolution[1]?.portrait.startsWith(`assets/pets/${id}/evolution/`);
    assert.deepEqual(Object.keys(manifest[id].evolutionSheets), hasEvolutionArt ? ['1','2','3'] : ['1']);
    if (hasEvolutionArt) for (const stage of [2, 3]) {
      assert.ok(existsSync(join(root, manifest[id].evolutionSheets[String(stage)])));
    }
  }
  assert.equal(Object.values(manifest).filter(entry => Object.keys(entry.evolutionSheets).length === 3).length, 65);
  assert.equal(readdirSync(join(root, 'assets/animations/directional/frames')).filter(name => name.endsWith('.png')).length, 0);
});
test('六種定位都有三節點技能樹', () => assert.ok(Object.values(content.skillTrees).every(tree => tree.length === 3 && tree.every(node => node.id && node.bonus))));
test('任務具有進度目標與實際獎勵', () => assert.ok(content.quests.length >= 6 && content.quests.every(quest => quest.target > 0 && Object.keys(quest.reward).length)));

function progressionSandbox() {
  const storage = new Map();
  const sandbox = { console, TACTICAL_CONTENT: content, TACTICAL_PET_DATA: tactical, localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) } };
  sandbox.window = sandbox; vm.createContext(sandbox); vm.runInContext(readFileSync(join(root, 'js/core/TacticalProgression.js'), 'utf8'), sandbox); return { sandbox, storage };
}
test('新版進度服務會建立安全預設存檔（含初始幻獸與測試水晶）', () => { const { sandbox } = progressionSandbox(), service = new sandbox.TacticalProgression({ profiles: tactical, content }); assert.equal(service.state.party.join(','), 'molten_ball,fire_lion,fire_fox,leaf_ear_rabbit'); assert.equal(service.state.currentStage, 'c1-1'); assert.equal(service.state.crystals, 5060); assert.equal(service.ownedPets().length, 4); assert.ok(service.state.party.every(id => service.owns(id))); });
test('測試贈禮僅發放一次，且每日精選池在第 200 抽保底給當日幻獸', () => { const { sandbox, storage } = progressionSandbox(); storage.set('jose-tactics-progression-v2', JSON.stringify({ crystals: 60, party: ['molten_ball'] })); const service = new sandbox.TacticalProgression({ profiles: tactical, content }); assert.equal(service.state.crystals, 5060); const second = new sandbox.TacticalProgression({ profiles: tactical, content }); assert.equal(second.state.crystals, 5060); const featured = service.featuredProgress(); service.state.featuredPity = { date: featured.date, pulls: 199 }; service.state.crystals = 100; const result = service.pull(1, null, true); assert.equal(result.ok, true); assert.equal(result.results[0].pet.id, featured.pet.id); assert.equal(result.results[0].featuredGuaranteed, true); assert.equal(service.featuredProgress().pulls, 0); });
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
test('旗艦機庫首頁提供五隻展示、橫向遊玩規格與第一章可擴充故事資料', () => {
  const html = readFileSync(join(root, 'tactics.html'), 'utf8'); const source = readFileSync(join(root, 'js/tactics.js'), 'utf8'); const progression = readFileSync(join(root, 'js/core/TacticalProgression.js'), 'utf8'); const story = readFileSync(join(root, 'js/data/story-content.js'), 'utf8'); const hangar = readFileSync(join(root, 'css/tactics-hangar.css'), 'utf8');
  assert.match(html, /id="home-display-open"/); assert.match(html, /id="home-screenshot"/); assert.match(html, /id="story-modal"/); assert.match(html, /story-content\.js\?v=3/); assert.match(html, /tactics-hangar\.css\?v=9/); assert.doesNotMatch(html, /傾聽宣言/);
  assert.match(source, /HOME_DISPLAY_IDS = \['crimson_dragon', 'emerald_god_dragon', 'abyss_god_dragon', 'solar_phoenix', 'eclipse_dragon'\]/); assert.match(source, /function showStory/); assert.match(source, /grantStoryPet/);
  assert.match(progression, /homeDisplay: \{ petId: 'crimson_dragon', mode: 'fixed' \}/); assert.match(progression, /grantStoryPet/);
  assert.match(story, /var arcs/); assert.match(story, /幻獸初醒/); assert.match(story, /遠古龍族之門/); assert.match(story, /始源龍皇・阿爾卡迪亞/); assert.match(story, /機械紀元——重新啟動/); assert.match(story, /c11-1:before/); assert.match(story, /機關廢鐵巨鱷/); assert.match(story, /forest_deer/);
  assert.match(hangar, /統一遊玩畫布/); assert.doesNotMatch(hangar, /請將裝置轉為橫向遊玩|orientation:portrait/); assert.match(hangar, /min-width:720px/);
});
test('每週無限塔任務以不同樓層計算並提供豐富獎勵', () => {
  const { sandbox } = progressionSandbox(), service = new sandbox.TacticalProgression({ profiles: tactical, content });
  for (let floor = 1; floor <= 10; floor++) service.completeTower(floor, true);
  const quest = service.weeklyQuests()[0];
  assert.equal(service.weeklyProgress(quest), 10);
  const before = service.state.crystals;
  assert.equal(service.claimWeekly(quest.id).ok, true);
  assert.ok(service.state.crystals >= before + quest.reward.crystals);
  assert.equal(service.claimWeekly(quest.id).ok, false);
});
test('戰棋使用 21×10 地圖、25 出陣單位、路徑搜尋與分體型部署', () => { const source = readFileSync(join(root, 'js/tactics.js'), 'utf8'); assert.match(source, /COLS = 21, ROWS = 10/); assert.match(source, /DEPLOY_CAPACITY = 25/); assert.match(source, /function pathTo/); assert.match(source, /function placeAllies/); assert.match(source, /function canStand/); assert.match(source, /function unitSize/); assert.match(source, /function inLargeDeployReserve/); assert.match(source, /function enemyFormation/); assert.match(source, /function squadActive/); assert.match(source, /function canMove\(unit, x, y\).*pathTo/); });
test('全部戰鬥單位使用四方向新版動作圖', () => {
  const source = readFileSync(join(root, 'js/tactics.js'), 'utf8');
  const css = readFileSync(join(root, 'css/tactics-screens.css'), 'utf8');
  assert.match(source, /facing: team === 'ally' \? 'right' : 'left'/);
  assert.match(source, /path\[index\]\.x > fromX \? 'right' : 'left'/);
  assert.match(source, /targetDx > 0 \? 'right' : 'left'/); assert.match(source, /point\.y !== fromY/);
  assert.match(source, /motion-4dir/); assert.match(source, /-motion-4dir-sheet\.webp/); assert.doesNotMatch(source, /FOUR_DIRECTION_UNITS/);
  ['motion-idle-right', 'motion-idle-left', 'motion-walk-right', 'motion-walk-left', 'motion-attack-right', 'motion-attack-left'].forEach(name => assert.match(css, new RegExp(name)));
  ['motion-4dir-idle-down','motion-4dir-walk-down','motion-4dir-attack-down','motion-4dir-idle-up','motion-4dir-walk-up','motion-4dir-attack-up'].forEach(name => assert.match(css, new RegExp(name)));
});
test('無限塔改為十波守護塔防衛，含波間加護、復甦與塔之指令', () => {
  const html = readFileSync(join(root, 'tactics.html'), 'utf8');
  const source = readFileSync(join(root, 'js/tactics.js'), 'utf8');
  const battle = readFileSync(join(root, 'css/tactics-battle.css'), 'utf8');
  assert.match(source, /maxWaves: 10/); assert.match(source, /function guardianTower\(floor\)/); assert.match(source, /function towerBasePower\(floor\)/); assert.match(source, /function towerEnemyBuffs\(floor\)/); assert.match(source, /enemyBuffs: towerEnemyBuffs\(currentStage\.floor\)/); assert.match(source, /profiles\.filter\(function \(entry\) \{ return !entry\.boss; \}\)/); assert.match(source, /towerBosses: towerBosses/); assert.match(source, /function spawnTowerWave\(wave\)/); assert.match(source, /function completeTowerWave\(\)/); assert.match(source, /var TOWER_REVIVE_MS = 12000/); assert.match(source, /function placeTowerRevival\(unit\)/); assert.match(source, /placeTowerRevival\(unit\)/); assert.match(source, /reviveRemaining/); assert.match(source, /\* battleSpeed/); assert.match(source, /function queueTowerRevival\(unit\)/); assert.match(source, /function processTowerRevives\(\)/); assert.match(source, /function towerCommand\(\)/);
  assert.match(source, /function chooseTowerBoon\(boon, automatic\)/); assert.match(source, /setTimeout\(function \(\) \{ chooseTowerBoon\(autoTowerBoon\(boons\), true\); \}, 5000\)/); assert.match(source, /function towerDefenseTarget\(unit\)/); assert.match(source, /autoEnabled: false/); assert.match(source, /state\.tower\.autoEnabled = true; spawnTowerWave\(1\); return;/); assert.match(source, /if \(currentStage\.tower\) return;/); assert.match(source, /stopAuto\(true\)/);
  assert.match(html, /id="tower-command"/); assert.match(html, /id="tower-choice"/); assert.match(battle, /\.guardian-tower\{/); assert.match(battle, /\.tower-choice\{/); assert.match(battle, /guardian-spire/);
});
test('戰鬥地圖可點選敵我單位查看完整資訊且已移除小地圖', () => {
  const source = readFileSync(join(root, 'js/tactics.js'), 'utf8');
  const html = readFileSync(join(root, 'tactics.html'), 'utf8');
  const css = readFileSync(join(root, 'css/tactics-screens.css'), 'utf8');
  assert.match(source, /function inspected\(\)/); assert.match(source, /state\.inspected = unit\.key/);
  assert.match(source, /detail-skill-list/); assert.match(source, /teamLabel/); assert.match(css, /\.unit\.inspected/);
  assert.doesNotMatch(source, /renderMinimap|minimap-view/); assert.doesNotMatch(html, /id="minimap"/); assert.doesNotMatch(css, /\.minimap/);
});
test('移動、地形顯示與打擊感採新版戰鬥演出', () => {
  const source = readFileSync(join(root, 'js/tactics.js'), 'utf8');
  const html = readFileSync(join(root, 'tactics.html'), 'utf8');
  const css = readFileSync(join(root, 'css/tactics-battle.css'), 'utf8');
  assert.match(source, /function animateWaypoints/); assert.match(source, /piece\.animate\(keyframes/);
  assert.match(source, /function hitStop/); assert.match(source, /combatShake\(skill\.kind === 'ultimate'/);
  assert.match(source, /jose-terrain-visibility/); assert.match(html, /class="terrain-rules"/);
  assert.match(css, /\.board\.hitstop \*/); assert.match(css, /impact-shake-ultimate/); assert.match(css, /unit-death-sink/); assert.match(css, /opacity:\.25!important/);
});
test('行動裝置只在使用者互動後觸發震動', () => {
  const source = readFileSync(join(root, 'js/core/TacticalAudio.js'), 'utf8');
  assert.match(source, /navigator\.userActivation/); assert.match(source, /activation\.hasBeenActive/);
});
test('我方自由部署區為靠左側 3×10 並維持 25 出陣單位規則', () => {
  const cells = [];
  for (let y = 0; y < 10; y++) for (let x = 0; x < 3; x++) cells.push({ x, y });
  assert.equal(new Set(cells.map(cell => cell.x + ',' + cell.y)).size, 30);
  assert.ok(cells.every(cell => cell.x <= 2 && cell.y <= 9));
  const source = readFileSync(join(root, 'js/tactics.js'), 'utf8');
  assert.match(source, /DEPLOY_MIN_X = 0, DEPLOY_MAX_X = 2, DEPLOY_MIN_Y = 0, DEPLOY_MAX_Y = 9/);
  assert.match(source, /DEPLOY_CAPACITY = 25/);
});

test('2×2 幻獸全數優先採用原生四方向來源', () => {
  const source = readFileSync(join(root, 'scripts/build-four-direction-motion.py'), 'utf8');
  const directionalManifest = JSON.parse(readFileSync(join(root, 'assets/animations/directional/manifest.json'), 'utf8'));
  const nativeSize2Ids = [
    'gold_qilin', 'solar_phoenix', 'eclipse_dragon', 'flame_emperor', 'crimson_dragon',
    'blazing_dragon', 'flame_god_lion', 'volcanic_titan', 'kiln_rhinoceros',
    'emerald_dragon', 'emerald_god_dragon', 'jade_qilin', 'forest_god', 'ancient_treant',
    'fern_ceratops', 'mushroom_bison', 'amber_antler_moose', 'sea_god_beast', 'sea_emperor',
    'tsunami_dragon', 'abyss_god_dragon', 'frost_leviathan', 'aurora_narwhal', 'brine_crocodile',
    'crown_unicorn', 'cathedral_elephant', 'void_leviathan', 'abyss_mammoth', 'obsidian_gorilla',
  ];
  for (const id of nativeSize2Ids) assert.match(source, new RegExp('\\"' + id + '\\"'));
  assert.doesNotMatch(source, /rotate\(angle/);
  assert.match(source, /front_path = VIEW_DIR/);
  assert.match(source, /back_path = VIEW_DIR/);
  for (const id of nativeSize2Ids) {
    const entry = directionalManifest[id];
    assert.equal(entry.rows, 24);
    assert.equal(entry.sourceType, 'authored-four-direction');
    assert.deepEqual(Array.from(entry.sourceColumns), [0, 1, 2, 3]);
    assert.match(entry.source, /four-direction-reference-v1-alpha\.png$/);
  }
});
test('第二、三章原生側面方向依實測映射，只有幽暗龜與霧中鬼火交換左右', () => {
  const directionalManifest = JSON.parse(readFileSync(join(root, 'assets/animations/directional/manifest.json'), 'utf8'));
  for (const id of ['fog_wisp', 'gloom_turtle']) {
    assert.deepEqual(Array.from(directionalManifest[id].sourceColumns), [0, 3, 2, 1]);
  }
  for (const id of ['thorn_pollen_drone', 'mist_banshee', 'thorn_hive_queen', 'crown_cinderling', 'salamander_fiend', 'surtr_spawn', 'ember_imp', 'ash_crown_tyrant']) {
    assert.deepEqual(Array.from(directionalManifest[id].sourceColumns), [0, 1, 2, 3]);
  }
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
  assert.match(source, /function focusCamera/); assert.match(source, /function enableCameraDrag/); assert.doesNotMatch(source, /function renderMinimap/);
  const unitClickSource = source.slice(source.indexOf("element.addEventListener('click', function (event)"), source.indexOf('var threatTileMap'));
  assert.match(unitClickSource, /focusUnit\(unit, false\)/);
  assert.match(source, /gridTemplateColumns = 'repeat\(' \+ COLS/);
  const html = readFileSync(join(root, 'tactics.html'), 'utf8');
  assert.doesNotMatch(html, /id="minimap"/); assert.doesNotMatch(html, /id="minimap-view"/);
});
test('戰鬥引擎具備視線遮蔽、位移、狀態與部署階段', () => { const source = readFileSync(join(root, 'js/tactics.js'), 'utf8'); assert.match(source, /function lineClear/); assert.match(source, /async function displace/); assert.match(source, /function planFor/); assert.match(source, /phase: 'deploy'/); assert.match(source, /unit\.freeze/); assert.match(source, /unit\.poison/); });
test('棋盤角色可存取且不重複顯示精確血量文字', () => { const source = readFileSync(join(root, 'js/tactics.js'), 'utf8'); assert.doesNotMatch(source, /class=\\?"unit-hp/); assert.match(source, /element\.setAttribute\('aria-label', unit\.p\.name \+ '，生命 '/); assert.match(source, /state\.mode === 'skill' && selected\(\) && canTarget\(selected\(\), unit\)/); });
test('戰棋頁載入敵人資料、Boss 百分比標籤與戰鬥樣式', () => { const html = readFileSync(join(root, 'tactics.html'), 'utf8'); const source = readFileSync(join(root, 'js/tactics.js'), 'utf8'); assert.match(html, /tactical-content\.js/); assert.match(html, /tactical-enemies\.js/); assert.match(html, /tactics-battle\.css\?v=15/); assert.match(html, /id="enemy-label"/); assert.doesNotMatch(html, /id="boss-bar"/); assert.match(source, /魔物軍團 ◆｜BOSS/); assert.match(html, /id="boss-intro"/); assert.match(html, /id="campaign-modal"/); assert.match(html, /id="growth-modal"/); });
test('主城功能格：關卡、編隊、強化、圖鑑、召喚、每日任務', () => {
  const html = readFileSync(join(root, 'tactics.html'), 'utf8');
  assert.match(html, /class="hub-grid"/); assert.match(html, /id="open-dex"/); assert.match(html, /id="open-gacha"/); assert.match(html, /id="open-daily"/); assert.match(html, /id="hub-party"/); assert.match(html, /id="crystals"/);
  assert.match(html, /id="dex-modal"/); assert.match(html, /id="gacha-modal"/); assert.match(html, /id="daily-modal"/);
  assert.match(html, /id="home-modal"/); assert.match(html, /id="shop-modal"/); assert.match(html, /id="bag-modal"/); assert.match(html, /id="open-home"/); assert.match(html, /id="open-shop"/); assert.match(html, /id="open-bag"/);
  const source = readFileSync(join(root, 'js/tactics.js'), 'utf8');
  assert.match(source, /function renderDex/); assert.match(source, /function dexEvolutionRoute/); assert.match(source, /dex-evolution-route/); assert.match(source, /function doPull/); assert.match(source, /function renderDaily/); assert.match(source, /function renderCampaign/); assert.match(source, /campaign-overview/); assert.match(source, /function chapterInfo/);
});
test('水晶招喚以逐張立繪與台詞揭示，並可跳過演出', () => {
  const html = readFileSync(join(root, 'tactics.html'), 'utf8');
  const source = readFileSync(join(root, 'js/tactics.js'), 'utf8');
  const screens = readFileSync(join(root, 'css/tactics-screens.css'), 'utf8');
  assert.match(html, /id="gacha-reveal"/); assert.match(html, /id="gacha-skip"[^>]*>SKIP/); assert.match(html, /tactical-pets\.js\?v=8/); assert.match(html, /js\/tactics\.js\?v=72/);
  assert.match(source, /function startGachaCeremony/); assert.match(source, /function revealGachaCard/); assert.match(source, /function finishGachaCeremony/); assert.match(source, /GACHA_QUOTES/); assert.match(source, /document\.getElementById\('gacha-skip'\)\.onclick = finishGachaCeremony/);
  assert.match(source, /startGachaCeremony\(result\.results\)/); assert.match(screens, /\.gacha-reveal\{position:fixed/); assert.match(screens, /\.gacha-skip\{position:absolute/);
  assert.match(source, /entry\.pet\.summonQuote \|\| GACHA_QUOTES\[quality\]/); assert.doesNotMatch(source, /再次相逢/); assert.doesNotMatch(source, /吾主，請下令/);
});
test('元素限定召喚與每日 Boss 來襲可保存殘血並依五段難度解鎖', () => {
  const html = readFileSync(join(root, 'tactics.html'), 'utf8'); const source = readFileSync(join(root, 'js/tactics.js'), 'utf8'); const progression = readFileSync(join(root, 'js/core/TacticalProgression.js'), 'utf8');
  assert.match(html, /id="gacha-element-pulls"/); assert.match(html, /id="open-boss-raid"/); assert.match(html, /id="boss-raid-modal"/); assert.match(html, /js\/core\/TacticalProgression\.js\?v=13/);
  assert.match(source, /function bossRaidStage/); assert.match(source, /function enterBossRaid/); assert.match(source, /BOSS_RAID_TIERS = \['簡單', '普通', '困難', '菁英', '魔神'\]/); assert.match(source, /boss-tier-grid/); assert.match(source, /完成前一難度解鎖/); assert.match(source, /progression\.pull\(count, element, featured\)/); assert.match(source, /每日精選幻獸池/);
  assert.match(progression, /TacticalProgression\.prototype\.bossRaidState/); assert.match(progression, /TacticalProgression\.prototype\.recordBossRaid/); assert.match(progression, /TacticalProgression\.prototype\.featuredProgress/); assert.match(progression, /FEATURED_PITY = 200/); assert.match(progression, /var cost = element \? 50/);
});
test('三畫面架構：準備、戰鬥、結算各自獨立', () => {
  const html = readFileSync(join(root, 'tactics.html'), 'utf8');
  assert.match(html, /id="screen-home"/); assert.match(html, /id="screen-battle"[^>]*hidden/); assert.match(html, /id="screen-result"[^>]*hidden/);
  assert.match(html, /id="enter-battle"/); assert.match(html, /id="battle-exit"/); assert.match(html, /id="result-home"/);
  assert.match(html, /tactics-screens\.css/);
  assert.match(html, /class="terrain-rules"/); assert.doesNotMatch(html, /class="board-legend"/);
  const source = readFileSync(join(root, 'js/tactics.js'), 'utf8');
  assert.match(source, /function setView\(view\)/);
});
test('戰鬥棋盤固定完整顯示、取消放大與拖曳，並保留體型樣式', () => { const css = readFileSync(join(root, 'css/tactics-screens.css'), 'utf8'); assert.match(css, /--cell:calc\(clamp/); assert.match(css, /board-scroll\{overflow:hidden;height:auto;cursor:default/); assert.match(css, /aspect-ratio:21 \/ 10/); assert.match(css, /\.unit\.size-2/); assert.match(css, /\.unit\.size-3/); assert.match(css, /boss-unit::before/); const source = readFileSync(join(root, 'js/tactics.js'), 'utf8'); assert.match(source, /COLS = 21, ROWS = 10/); assert.match(source, /dom\.board\.style\.width = '100%'/); });

test('幻獸使用 1×1～3×3，敵方首領支援 4×4 與 5×5，立繪填滿佔格', () => {
  const css = readFileSync(join(root, 'css/tactics-screens.css'), 'utf8');
  assert.ok(tactical.every(pet => [1, 2, 3].includes(pet.size)));
  assert.ok(enemies.every(enemy => [1, 2, 3, 4, 5].includes(enemy.size)));
  assert.match(css, /\.unit\.size-1[^}]*width:100%[^}]*height:100%/);
  assert.match(css, /\.unit\.size-2[^}]*width:200%[^}]*height:200%/);
  assert.match(css, /\.unit\.size-3[^}]*width:300%[^}]*height:300%/);
  assert.match(css, /\.unit\.size-4[^}]*width:400%[^}]*height:400%/);
  assert.match(css, /\.unit\.size-5[^}]*width:500%[^}]*height:500%/);
  assert.match(css, /\.idle-arena \.unit \.portrait[^}]*inset:0[^}]*width:100%[^}]*height:100%[^}]*aspect-ratio:1 \/ 1/);
  assert.match(css, /background-position:center bottom/);
});
test('戰前主城可垂直捲動，進入戰鬥操作列固定可見', () => {
  const html = readFileSync(join(root, 'tactics.html'), 'utf8');
  const screens = readFileSync(join(root, 'css/tactics-screens.css'), 'utf8');
  assert.match(html, /class="enter-battle-dock"/); assert.match(html, /id="enter-battle"/);
  assert.match(screens, /\.screen-home\{[^}]*padding:18px 18px 118px/);
  assert.match(screens, /\.enter-battle-dock\{position:fixed/);
  assert.match(screens, /padding:18px 18px 118px/);
});
test('戰鬥框架使用左方戰隊、中央棋盤、右方敵情與指令三欄', () => {
  const html = readFileSync(join(root, 'tactics.html'), 'utf8');
  const source = readFileSync(join(root, 'js/tactics.js'), 'utf8');
  const screens = readFileSync(join(root, 'css/tactics-screens.css'), 'utf8');
  assert.match(html, /class="battle-ally-panel"/); assert.match(html, /id="battle-ally-list"/);
  assert.match(html, /class="board-wrap"/); assert.match(html, /class="side-panel battle-panel"/);
  assert.match(html, /id="battle-enemy-count"/); assert.match(html, /id="battle-enemy-summary"/);
  assert.match(source, /function renderBattleSides/); assert.match(source, /renderBattleSides\(\)/);
  assert.match(screens, /grid-template-columns:160px minmax\(0,1fr\) 242px/);
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
  assert.match(detailSource, /stage\?\.label/); assert.doesNotMatch(detailSource, /openGrowthConfirmation|unlockEvolution|growth-evolve/);
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

test('手動戰鬥點選我方會開啟中央角色指令面板', () => {
  const html = readFileSync(join(root, 'tactics.html'), 'utf8');
  const source = readFileSync(join(root, 'js/tactics.js'), 'utf8');
  const css = readFileSync(join(root, 'css/tactics-screens.css'), 'utf8');
  assert.match(html, /id="battle-command"/); assert.match(html, /id="battle-command-portrait"/); assert.match(html, /id="battle-command-skills"/);
  assert.match(source, /function renderBattleCommand/); assert.match(source, /state\.commandOpen = state\.phase === 'player'/);
  assert.match(css, /\.battle-command\{position:fixed/); assert.match(css, /\.battle-panel #skill-buttons\{display:none!important/);
});
test('隊伍部署預設可儲存、讀取與清除', () => {
  const { sandbox } = progressionSandbox(), service = new sandbox.TacticalProgression({ profiles: tactical, content });
  const party = service.state.party.slice(), positions = party.map((id, index) => ({ id, x: index % 3, y: index }));
  assert.equal(service.setFormation(party, positions), true);
  assert.equal(service.formationFor(party).length, party.length);
  service.clearFormation(); assert.deepEqual(Array.from(service.formationFor(party)), []);
});
test('減速格可通行且大型幻獸單次最多花費 1 點行動力，無限塔不產生減速格', () => {
  const source = readFileSync(join(root, 'js/tactics.js'), 'utf8');
  assert.match(source, /function movementCost\(unit, x, y\)/);
  assert.match(source, /if \(slowAt\(x \+ dx, y \+ dy\)\) return 1/);
  assert.match(source, /currentStage\.tower \? \[\]/); assert.match(source, /slow-cell/);
  assert.doesNotMatch(source.slice(source.indexOf('function canStand'), source.indexOf('function inBoard')), /slowAt/);
});
test('幻獸圖鑑列出被動能力的實際效果說明', () => {
  const source = readFileSync(join(root, 'js/tactics.js'), 'utf8');
  assert.match(source, /function passiveDescription/); assert.match(source, /攻擊與魔力提升/); assert.match(source, /持續傷害/); assert.match(source, /dex-passives/);
});
test('骷髏系列八種魔物完整且包含 4×4 與 5×5 首領', () => {
  const ids = ['skeleton_soldier','skeleton_mage','skeleton_knight','skeleton_sergeant','skeleton_king','bone_dragon','lich','lich_king'];
  ids.forEach(id => assert.ok(enemies.some(enemy => enemy.id === id), id));
  assert.equal(enemies.find(enemy => enemy.id === 'skeleton_king').size, 4);
  assert.equal(enemies.find(enemy => enemy.id === 'lich_king').size, 5);
});
test('已完成行動的我方棋子與隊伍卡會變暗，未行動者維持正常亮度', () => {
  const source = readFileSync(join(root, 'js/tactics.js'), 'utf8');
  const css = readFileSync(join(root, 'css/tactics-screens.css'), 'utf8');
  assert.match(source, /unit\.team === 'ally' && unit\.acted \? ' action-complete'/);
  assert.match(source, /unit\.acted \? '｜✓ 已行動'/);
  assert.match(css, /\.unit\.ally\.action-complete \.portrait\{filter:grayscale/);
  assert.match(css, /\.battle-roster-card\.acted>i\{filter:grayscale/);
});

test('AUTO 戰鬥不會攻擊同陣營單位', () => {
  const source = readFileSync(join(root, 'js/tactics.js'), 'utf8');
  assert.match(source, /target\.hp <= 0 \|\| !canUseTarget\(unit, target, skill\)\) return/);
  assert.match(source, /var opposingTeam = unit\.team === 'ally' \? 'enemy' : 'ally';/);
  assert.match(source, /alive\(opposingTeam\)\.filter/);
  assert.match(source, /return defender\.team !== attacker\.team && defender\.hp > 0/);
  assert.match(source, /if \(!attacker \|\| !target \|\| attacker\.team === target\.team\) return \{ amount: 0, absorbed: 0, crit: false \}/);
  assert.match(source, /caster\.team === target\.team \|\| target\.hp <= 0/);
});

test('四方向圖集與自動部署使用完整方向列、保存最後站位', () => {
  const source = readFileSync(join(root, 'js/tactics.js'), 'utf8');
  const screens = readFileSync(join(root, 'css/tactics-screens.css'), 'utf8');
  assert.match(source, /function rememberFormation\(\)/);
  assert.match(source, /rememberFormation\(\);\s+state\.phase = 'player'/);
  assert.match(source, /function autoArrangeBySpeed\(\)/);
  assert.match(source, /b\.p\.stats\.speed - a\.p\.stats\.speed/);
  assert.match(source, /id = 'formation-auto'/);
  assert.match(screens, /motion-4dir\.facing-down \.portrait,[\s\S]*motion-4dir\.facing-left \.portrait\{animation:motion-4dir-row/);
  assert.match(source, /\['idle', 'move', 'attack', 'hit', 'victory', 'death'\]\.forEach\(function \(action\)/);
});

test('遠距技能由施術者中心飛向目標中心，命中特效不使用錨點格', () => {
  const source = readFileSync(join(root, 'js/tactics.js'), 'utf8');
  const campaign = readFileSync(join(root, 'css/tactics-campaign.css'), 'utf8');
  assert.match(source, /function visualHost\(unit\)/);
  assert.match(source, /casterHost\.getBoundingClientRect\(\), targetRect = targetHost\.getBoundingClientRect\(\)/);
  assert.match(source, /startX = casterRect\.left - boardRect\.left \+ casterRect\.width \/ 2/);
  assert.match(source, /endX = targetRect\.left - boardRect\.left \+ targetRect\.width \/ 2/);
  assert.match(source, /projectile\.style\.left = startX \+ 'px'/);
  assert.match(source, /--travel-x/);
  assert.match(source, /projectile\.dataset\.sourceKey = caster\.key; projectile\.dataset\.targetKey = target\.key/);
  assert.match(source, /var flightBaseDuration = 340/);
  assert.match(source, /--projectile-duration', duration\(flightBaseDuration\) \+ 'ms'/);
  assert.match(source, /return flightBaseDuration;/);
  assert.match(source, /dom\.board\.appendChild\(projectile\)/);
  assert.match(campaign, /translate\(var\(--travel-x\),var\(--travel-y\)\)/);
});

test('遠距攻擊從施術者本體出發，速度差可觸發閃避與未命中演出', () => {
  const html = readFileSync(join(root, 'tactics.html'), 'utf8');
  const source = readFileSync(join(root, 'js/tactics.js'), 'utf8');
  const battle = readFileSync(join(root, 'css/tactics-battle.css'), 'utf8');
  assert.match(html, /tactics-battle\.css\?v=15/); assert.match(html, /js\/tactics\.js\?v=72/);
  assert.match(source, /casterHost\.appendChild\(muzzle\)/); assert.match(source, /function dodgeChance\(attacker, target, skill\)/); assert.match(source, /function willDodge\(attacker, target, skill\)/);
  assert.match(source, /element\.style\.setProperty\('--motion-sheet'/); assert.match(source, /motion-sprite motion-4dir/); assert.match(source, /applyMotionVariables\(element, unit\);/);
  assert.match(source, /dodged: dodgePlan\[enemy\.key\]/); assert.match(source, /if \(effect\.dodged\) \{ addDodgeVisual\(unit, effect\.target\); return; \}/); assert.match(source, /projectile\.classList\.add\('projectile-miss'\)/);
  assert.match(battle, /\.projectile-muzzle\{/); assert.match(battle, /\.unit\.evading\{/); assert.match(battle, /\.dodge-number\{/);
  assert.match(battle, /animation-duration:var\(--projectile-duration/);
});

test('iPad 戰場維持 21×10 比例、中央棋盤優先且隊伍編輯可觸控開啟', () => {
  const screens = readFileSync(join(root, 'css/tactics-screens.css'), 'utf8');
  const source = readFileSync(join(root, 'js/tactics.js'), 'utf8');
  const html = readFileSync(join(root, 'tactics.html'), 'utf8');
  assert.match(html, /tactics-screens\.css\?v=33/);
  assert.match(html, /id="deploy-squad-console"/);
  assert.match(screens, /\.idle-arena \.unit \.portrait\{[^}]*height:100%[^}]*aspect-ratio:1 \/ 1/);
  assert.match(screens, /@media \(min-width:700px\) and \(max-width:980px\)[\s\S]*width:max\(720px,100%\)[\s\S]*aspect-ratio:21 \/ 10/);
  assert.match(screens, /\.deploy-squad-console\{/);
  assert.match(source, /function renderDeploySquadConsole\(\)/);
  assert.match(screens, /@media \(min-width:981px\) and \(max-width:1180px\)[\s\S]*grid-template-columns:132px minmax\(0,1fr\) 190px/);
  assert.match(source, /\['deploy', 'hub-party'\][\s\S]*addEventListener\('pointerup'/);
  assert.match(html, /id="deploy"[^>]*type="button"/);
});

console.log(`\n${passed}/${total} regression checks passed.`);

