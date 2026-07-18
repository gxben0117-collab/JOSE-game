import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const root = new URL('..', import.meta.url);
const context = { console };
context.window = context;
vm.createContext(context);
for (const file of ['js/data/tactical-enemies.js', 'js/data/map-terrain.js', 'js/data/tactical-content.js']) {
  vm.runInContext(fs.readFileSync(new URL(file, root), 'utf8'), context, { filename: file });
}

const content = context.TACTICAL_CONTENT;
const costs = [4, 8, 12, 16, 20, 25];
const balanceFor = (stage, partyCost) => {
  const baseCount = content.rosterFor(stage).length;
  const added = Math.max(0, Math.round((partyCost - 8) * 0.9));
  const enemyCount = Math.min(30, baseCount + added);
  const scaleMultiplier = 1 + Math.max(0, partyCost - 8) * 0.015;
  const minimumScale = 0.42 + Math.max(0, partyCost - 4) * 0.05;
  return { enemyCount, enemyScale: Math.max(stage.power * scaleMultiplier, minimumScale) };
};

assert.equal(content.stages.length, 150);
for (const stage of content.stages) {
  let previous = balanceFor(stage, costs[0]);
  for (const cost of costs.slice(1)) {
    const current = balanceFor(stage, cost);
    assert.ok(current.enemyCount >= previous.enemyCount, `${stage.id}: 擴編後敵軍數反而下降`);
    assert.ok(current.enemyScale >= previous.enemyScale, `${stage.id}: 擴編後敵軍戰力反而下降`);
    previous = current;
  }
  assert.ok(balanceFor(stage, 25).enemyCount >= Math.min(25, content.rosterFor(stage).length), `${stage.id}: 滿編迎擊敵軍不足`);
}

for (let chapter = 1; chapter <= 10; chapter++) {
  const normal = Array.from({ length: 10 }, (_, index) => content.stageById(`c${chapter}-${index + 1}`));
  assert.ok(normal.every((stage, index) => index === 0 || stage.power >= normal[index - 1].power));
  const boss = content.stageById(`c${chapter}-boss`);
  assert.ok(boss.power > normal.at(-1).power, `c${chapter}: Boss 未高於決戰前夕`);
  for (let hard = 1; hard <= 4; hard++) {
    const stage = content.stageById(`c${chapter}-h${hard}`);
    assert.ok(stage.power > boss.power, `${stage.id}: HARD 未高於 Boss`);
    assert.ok(stage.enemyCount >= boss.enemyCount, `${stage.id}: HARD 敵軍數未達首領關水準`);
  }
}

const checkpoints = ['c1-1', 'c1-boss', 'c3-1', 'c5-boss', 'c8-boss', 'c10-boss'];
console.log('Difficulty audit PASS: 150 stages × 6 party-capacity profiles');
for (const id of checkpoints) {
  const stage = content.stageById(id);
  const samples = [4, 12, 25].map(cost => {
    const result = balanceFor(stage, cost);
    return `${cost}單位=${result.enemyCount}敵/×${result.enemyScale.toFixed(2)}`;
  });
  console.log(`${id.padEnd(8)} ${samples.join(' | ')}`);
}
