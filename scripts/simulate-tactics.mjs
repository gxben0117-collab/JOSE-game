import fs from 'node:fs';
import vm from 'node:vm';

const root = new URL('..', import.meta.url);
const ctx = { console };
vm.createContext(ctx);
for (const file of ['js/data/pets.js', 'js/data/tactical-pets.js']) {
  vm.runInContext(fs.readFileSync(new URL(file, root), 'utf8'), ctx, { filename:file });
}
const data = ctx.TACTICAL_PET_DATA;
if (data.length !== 45 || data.some(p => p.evolution.length !== 3 || p.skills.length < 1)) throw new Error('45 隻幻獸的戰棋資料不完整');
function battle(seed) {
  let allies = data.filter(p => ['fire_fox','forest_deer','abyss_dragon'].includes(p.id)).map(p => ({ p, hp:p.stats.health }));
  let foes = data.filter(p => ['lava_crab','thorn_boar','ice_shark','magma_hound'].includes(p.id)).map(p => ({ p, hp:p.stats.health }));
  let turns=0;
  while (allies.some(x=>x.hp>0) && foes.some(x=>x.hp>0) && turns++ < 180) {
    for (const group of [allies, foes]) for (const unit of group.filter(x=>x.hp>0).sort((a,b)=>b.p.stats.speed-a.p.stats.speed)) {
      const targets = (group===allies?foes:allies).filter(x=>x.hp>0); if (!targets.length) break;
      const target=targets[(seed+turns+unit.p.id.length)%targets.length]; const skill=unit.p.skills[(seed+turns)%Math.min(3,unit.p.skills.length)];
      if (skill.attackStyle==='support') { unit.hp=Math.min(unit.p.stats.health,unit.hp+Math.max(8,Math.round(unit.p.stats.magic*.45))); }
      else { const magic=skill.attackStyle==='ranged'||skill.attackStyle==='area'; const dmg=Math.max(12,Math.round((magic?unit.p.stats.magic:unit.p.stats.power)*(skill.multiplier||1)-target.p.stats.defense*.55)); target.hp-=dmg; }
    }
  }
  return { turns, winner:allies.some(x=>x.hp>0)?'我方':'敵方' };
}
const results=Array.from({length:10},(_,i)=>battle(i+1));
if(results.some(r=>r.turns>=180)) throw new Error('模擬超出回合上限');
console.log('✅ 戰棋模擬 10 場通過');
results.forEach((r,i)=>console.log(`第 ${i+1} 場：${r.winner}勝利，${r.turns} 回合`));
