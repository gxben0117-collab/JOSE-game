import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
let passed = 0;
function test(name, fn) { try { fn(); passed++; console.log(`✓ ${name}`); } catch (error) { console.error(`✗ ${name}\n${error.stack}`); process.exitCode = 1; } }
const context = { console }; vm.createContext(context);
for (const file of ['js/data/pets.js', 'js/data/tactical-pets.js']) vm.runInContext(readFileSync(join(root, file), 'utf8'), context, { filename: file });
const pets = context.PET_DATA, tactical = context.TACTICAL_PET_DATA;

test('資料庫包含 45 隻幻獸', () => assert.equal(pets.length, 45));
test('戰棋資料與主資料數量一致', () => assert.equal(tactical.length, pets.length));
test('每隻戰棋幻獸皆有三段進化', () => assert.ok(tactical.every(p => p.evolution?.length === 3)));
test('每隻戰棋幻獸皆有可用技能與數值', () => assert.ok(tactical.every(p => p.skills?.length && p.stats.health > 0 && p.stats.power > 0)));
test('所有幻獸皆以可造成傷害的基本攻擊作為第一技能', () => assert.ok(tactical.every(p => p.skills[0]?.kind === 'basic' && p.skills[0].attackStyle !== 'support' && p.skills[0].cooldown === 0)));
test('每個戰棋技能皆有資料驅動的專屬特效識別', () => assert.ok(tactical.every(p => p.skills.every(s => s.vfxKey && Number.isInteger(s.vfxVariant) && s.vfxHue >= 0 && s.vfxHue < 360))));
test('所有戰棋頭像資產存在', () => assert.ok(tactical.every(p => existsSync(join(root, p.sourceSheet)))));
test('45 個 3D 幻獸模型都存在', () => assert.ok(pets.every((_, i) => existsSync(join(root, `assets/models/pets/pet-${String(i + 1).padStart(2, '0')}.glb`)))));
test('45 隻幻獸皆有三階透明立繪', () => assert.ok(tactical.every(p => p.evolution.length === 3 && p.evolution.every(stage => existsSync(join(root, stage.portrait))))));
test('主頁與歷史頁面都保留在專案中', () => assert.ok(['index.html','index-3d-legacy.html','adventure.html','tactics.html','showcase.html'].every(f => existsSync(join(root, f)))));
test('首頁只導向唯一的戰棋模式', () => {
  const home = readFileSync(join(root, 'index.html'), 'utf8');
  assert.match(home, /url=tactics\.html/);
  assert.match(home, /href="tactics\.html"/);
  assert.doesNotMatch(home, /data-go=|js\/v2\/app\.js/);
});
test('戰棋使用 12 欄 10 列並採左右部署', () => {
  const source = readFileSync(join(root, 'js/tactics.js'), 'utf8');
  assert.match(source, /COLS = 12, ROWS = 10/);
  assert.match(source, /'ally',1,4/);
  assert.match(source, /'enemy',10,3/);
});
test('棋盤單位不重複顯示血量數字，且角色本體會轉交技能點擊', () => {
  const source = readFileSync(join(root, 'js/tactics.js'), 'utf8');
  assert.doesNotMatch(source, /class="unit-hp"/);
  assert.match(source, /state\.mode==='skill'&&selected\(\)&&canTarget\(selected\(\),u\)\)\{clickCell\(u\.x,u\.y\)/);
});
test('新版 Store 能拒絕不存在的幻獸', () => {
  const storage = new Map(); const sandbox = { localStorage: { getItem:k => storage.get(k) ?? null, setItem:(k,v) => storage.set(k,v) }, window: { dispatchEvent() {} }, CustomEvent: class { constructor(type) { this.type = type; } } }; vm.createContext(sandbox);
  const source = readFileSync(join(root, 'js/v2/store.js'), 'utf8').replace('export class Store', 'class Store') + ';globalThis.Store=Store;'; vm.runInContext(source, sandbox);
  const store = new sandbox.Store(pets); assert.equal(store.levelPet('missing'), false); assert.equal(store.starPet('missing'), false); assert.equal(store.evolve('missing', 'A'), false);
});
test('新版 Store 在空召喚資料池時安全失敗', () => {
  const storage = new Map(); const sandbox = { localStorage: { getItem:k => storage.get(k) ?? null, setItem:(k,v) => storage.set(k,v) }, window: { dispatchEvent() {} }, CustomEvent: class { constructor(type) { this.type = type; } } }; vm.createContext(sandbox);
  const source = readFileSync(join(root, 'js/v2/store.js'), 'utf8').replace('export class Store', 'class Store') + ';globalThis.Store=Store;'; vm.runInContext(source, sandbox);
  assert.equal(new sandbox.Store([]).summon(1), null);
});
test('戰棋模擬的 10 場完整戰鬥均在回合上限內結束', () => { const result = spawnSync(process.execPath, ['scripts/simulate-tactics.mjs'], { cwd: root, encoding: 'utf8' }); assert.equal(result.status, 0, result.stderr || result.stdout); assert.match(result.stdout, /10 場通過/); });
test('全部 GLB 模型檢查可讀取', () => { const result = spawnSync(process.execPath, ['scripts/inspect-model-animations.mjs'], { cwd: root, encoding: 'utf8' }); assert.equal(result.status, 0, result.stderr); assert.equal(result.stdout.trim().split('\n').length, 45); });
console.log(`\n${passed}/17 regression checks passed.`);
