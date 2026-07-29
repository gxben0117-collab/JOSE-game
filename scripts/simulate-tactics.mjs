import fs from 'node:fs';
import vm from 'node:vm';

const root = new URL('..', import.meta.url);
const context = { console };
context.window = context;
vm.createContext(context);
for (const file of ['js/data/pets.js', 'js/data/pets-lightdark.js', 'js/data/pets-pack.js', 'js/data/tactical-pets.js', 'js/data/tactical-enemies.js', 'js/data/map-terrain.js', 'js/data/tactical-content.js']) {
  vm.runInContext(fs.readFileSync(new URL(file, root), 'utf8'), context, { filename: file });
}

const pets = context.TACTICAL_PET_DATA;
const enemies = context.TACTICAL_ENEMY_DATA;
const profiles = pets.concat(enemies);
const content = context.TACTICAL_CONTENT;
if (pets.length !== 115 || enemies.length !== 110 || content.stages.length !== 255) throw new Error('戰棋資料或關卡資料不完整');

const profile = id => profiles.find(pet => pet.id === id);
const strong = { fire: 'forest', forest: 'ocean', ocean: 'fire' };
function multiplier(attacker, target) {
  if (strong[attacker.element] === target.element) return 1.25;
  if (strong[target.element] === attacker.element) return 0.85;
  return 1;
}
function battle(seed, stage, partyIds) {
  const scale = stage.power || 1;
  const allies = partyIds.map(id => ({ p: profile(id), hp: profile(id).stats.health, cooldowns: [] }));
  // 分隊接戰模型：敵軍依警戒圈設計逐小隊（4~5 隻）投入，模擬大地圖獵殺節奏。
  const roster = content.rosterFor(stage);
  const squadSize = roster.length > 20 ? 5 : 4;
  const squads = [];
  for (let index = 0; index < roster.length; index += squadSize) squads.push(roster.slice(index, index + squadSize));
  let rounds = 0, skills = 0;
  for (const squad of squads) {
    if (!allies.some(unit => unit.hp > 0)) break;
    const foes = squad.map(id => ({ p: profile(id), hp: Math.round(profile(id).stats.health * scale * (profile(id).boss ? 1.1 : 1)), cooldowns: [] }));
    while (allies.some(unit => unit.hp > 0) && foes.some(unit => unit.hp > 0) && rounds++ < 45) {
      for (const [group, targets] of [[allies, foes], [foes, allies]]) {
        for (const unit of group.filter(entry => entry.hp > 0).sort((a, b) => b.p.stats.speed - a.p.stats.speed)) {
          const living = targets.filter(entry => entry.hp > 0);
          if (!living.length) break;
          const skill = unit.p.skills[(seed + rounds + unit.p.id.length) % unit.p.skills.length];
          if (skill.kind !== 'basic') skills++;
          if (skill.attackStyle === 'support') {
            const wounded = group.filter(entry => entry.hp > 0).sort((a, b) => a.hp / a.p.stats.health - b.hp / b.p.stats.health)[0];
            wounded.hp = Math.min(wounded.p.stats.health * (group === foes ? scale : 1), wounded.hp + Math.max(12, Math.round(unit.p.stats.magic * 0.7)));
          } else {
            const target = living[(seed + rounds) % living.length];
            const attack = skill.attackStyle === 'melee' ? unit.p.stats.power : unit.p.stats.magic;
            const teamScale = group === foes ? scale : 1;
            const amount = Math.max(12, Math.round(attack * teamScale * (skill.multiplier || 1) * multiplier(unit.p, target.p) - target.p.stats.defense * 0.45));
            target.hp -= amount;
            if (skill.attackStyle === 'area') living.filter(entry => entry !== target).slice(0, 1).forEach(entry => { entry.hp -= Math.round(amount * 0.72); });
          }
        }
      }
    }
    if (foes.some(unit => unit.hp > 0)) break; // 小隊未清光＝我方敗退
  }
  if (rounds >= 45) throw new Error(`${stage.id} 超出 45 回合硬上限`);
  return { stage: stage.id, rounds, winner: allies.some(unit => unit.hp > 0) ? '我方' : '敵方', skills };
}

const starterParty = ['molten_ball', 'fire_lion', 'fire_fox', 'leaf_ear_rabbit'];
const midParty = ['crimson_dragon', 'ancient_treant', 'sun_phoenix', 'frost_leviathan', 'jade_qilin', 'emerald_dragon', 'blazing_dragon', 'tsunami_dragon'];
const endgameParty = ['flame_emperor', 'forest_god', 'sea_emperor', 'flame_god_lion', 'emerald_god_dragon', 'abyss_god_dragon', 'solar_phoenix', 'void_leviathan', 'gold_qilin', 'eclipse_dragon'];
const regressionPlan = [
  ['c1-1', starterParty], ['c1-2', starterParty], ['c1-5', starterParty], ['c1-boss', starterParty],
  ['c2-1', starterParty], ['c3-1', midParty], ['c5-1', midParty], ['c5-boss', midParty],
  ['c8-boss', endgameParty], ['c10-boss', endgameParty]
];
const requestedRuns = Number((process.argv.find(arg => arg.startsWith('--runs=')) || '--runs=10').slice(7));
if (!Number.isInteger(requestedRuns) || requestedRuns < 1 || requestedRuns > 500) throw new Error('--runs 必須是 1～500 的整數');
const plan = requestedRuns === 10 ? regressionPlan : Array.from({ length: requestedRuns }, (_, index) => {
  const stage = content.stages[Math.floor(index * content.stages.length / requestedRuns)];
  const chapter = Number((stage.id.match(/^c(\d+)/) || [])[1] || 1);
  return [stage.id, chapter <= 2 ? starterParty : chapter <= 5 ? midParty : endgameParty];
});
const selectedStages = plan.map(entry => content.stageById(entry[0]));
const results = plan.map((entry, index) => battle(index + 1, content.stageById(entry[0]), entry[1]));
if (requestedRuns === 10) {
  const starterWins = results.filter((result, index) => ['c1-1', 'c1-2'].includes(selectedStages[index].id) && result.winner === '我方').length;
  if (starterWins < 1) throw new Error('初始 4 人隊連第一章前兩關都無法取勝，難度曲線失衡');
}
console.log(`✅ 戰棋內部遊玩 ${requestedRuns} 場通過`);
results.forEach((result, index) => console.log(`第 ${index + 1} 場（${result.stage}）：${result.winner}勝利，${result.rounds} 回合，施放 ${result.skills} 次技能`));
