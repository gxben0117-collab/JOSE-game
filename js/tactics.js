/* JOSE 戰棋模式：純前端、十二乘十棋盤。所有可見文字均使用繁體中文。 */
(function () {
  'use strict';
  var COLS = 12, ROWS = 10, SAVE_KEY = 'jose-tactics-progression-v1';
  var DEFAULT_PARTY = ['fire_fox', 'forest_deer', 'abyss_dragon'];
  var partyIds = DEFAULT_PARTY.slice();
  var enemyIds = ['lava_crab', 'thorn_boar', 'ice_shark', 'magma_hound'];
  var state;
  var board = document.getElementById('board');
  var list = document.getElementById('party-list');
  var teamTrait = document.getElementById('team-trait');
  var detail = document.getElementById('unit-detail');
  var buttons = document.getElementById('skill-buttons');
  var evolutionButtons = document.getElementById('evolution-buttons');
  var turnOrder = document.getElementById('turn-order');
  var log = document.getElementById('combat-log');
  var banner = document.getElementById('turn-banner');
  var roundStatus = document.getElementById('round-status');
  var medals = document.getElementById('medals');
  var deployModal = document.getElementById('deploy-modal');
  var deployGrid = document.getElementById('deploy-grid');
  var deployHelp = document.getElementById('deploy-help');
  var deploySelection = [];
  var autoButton = document.getElementById('auto-turn');
  var speedButton = document.getElementById('battle-speed');
  var autoTimer = null;
  var battleSpeed = 1;
  var resultModal = document.getElementById('result-modal');
  var resultIcon = document.getElementById('result-icon');
  var resultTitle = document.getElementById('result-title');
  var resultCopy = document.getElementById('result-copy');
  var resultStats = document.getElementById('result-stats');

  function profile(id) { return TACTICAL_PET_DATA.filter(function (p) { return p.id === id; })[0]; }
  function loadProgress(){try{var saved=JSON.parse(localStorage.getItem(SAVE_KEY));if(!saved||!Array.isArray(saved.party)||saved.party.length!==3||!saved.party.every(profile))throw new Error('invalid');return {party:saved.party,medals:Math.max(0,Number(saved.medals)||0),evolution:saved.evolution||{},wins:Math.max(0,Number(saved.wins)||0),battles:Math.max(0,Number(saved.battles)||0)};}catch(_){return {party:DEFAULT_PARTY.slice(),medals:0,evolution:{},wins:0,battles:0};}}
  function saveProgress(){localStorage.setItem(SAVE_KEY,JSON.stringify(progress));}
  var progress = loadProgress(); partyIds = progress.party.slice();
  function evolutionCost(stage){return stage===2?4:stage===3?10:0;}
  function evolutionUnlocked(id,stage){return stage===1||(progress.evolution[id]||1)>=stage;}
  function renderProgress(){medals.textContent='🏅 '+progress.medals+' 戰術徽章';}
  function clone(id, team, x, y) {
    var p = profile(id), s = p.stats;
    return { id:id, key:team + '-' + id, team:team, p:p, x:x, y:y, hp:s.health, maxHp:s.health, moved:false, acted:false, evolution:1, cooldowns:p.skills.map(function(){return 0;}) };
  }
  function reset() {
    stopAuto();
    state = { round:1, phase:'player', selected:null, mode:'move', skill:0, over:false, animating:false, autoEnding:false,
      stats:{damage:0,healing:0}, units:[clone(partyIds[0],'ally',1,4), clone(partyIds[1],'ally',2,5), clone(partyIds[2],'ally',1,6), clone(enemyIds[0],'enemy',10,3), clone(enemyIds[1],'enemy',9,4), clone(enemyIds[2],'enemy',10,5), clone(enemyIds[3],'enemy',9,6)] };
    note('戰棋開始：先選取我方幻獸，再移動或施放技能。'); renderProgress(); render();
  }
  function alive(team) { return state.units.filter(function (u) { return u.team === team && u.hp > 0; }); }
  function at(x,y) { return state.units.filter(function(u){return u.hp>0 && u.x===x && u.y===y;})[0]; }
  function dist(a,b) { return Math.abs(a.x-b.x)+Math.abs(a.y-b.y); }
  function inBoard(x,y){ return x>=0&&x<COLS&&y>=0&&y<ROWS; }
  function terrain(x,y){ var n=(x*7+y*3)%11; return n===0?'fire':n===4?'forest':n===7?'water':''; }
  function unitName(u){return u.p.name;}
  function note(t){ log.textContent=t; }
  function traitFor(team){
    var units=alive(team), counts={};units.forEach(function(u){counts[u.p.element]=(counts[u.p.element]||0)+1;});
    var elements=Object.keys(counts), repeated=elements.filter(function(element){return counts[element]>=2;})[0];
    if(repeated)return {multiplier:1.12,label:'元素共鳴',copy:repeated+' 系幻獸互相呼應，造成傷害與治療量 +12%。'};
    if(elements.length>=3)return {multiplier:1.08,label:'三系戰術',copy:'三種元素互補，造成傷害與治療量 +8%。'};
    return {multiplier:1,label:'尚未共鳴',copy:'嘗試搭配三種元素，或兩隻相同元素的幻獸。'};
  }
  function combatMultiplier(u){return traitFor(u.team).multiplier;}
  function selected(){ return state.units.filter(function(u){return u.key===state.selected;})[0]; }
  function canMove(u,x,y){ return !at(x,y)&&dist(u,{x:x,y:y})<=u.p.move&&inBoard(x,y); }
  function duration(ms){return Math.max(40,Math.round(ms/battleSpeed));}
  function pause(ms){ return new Promise(function(resolve){ setTimeout(resolve,duration(ms)); }); }
  function pathTo(u, x, y, maxSteps){
    var start=u.x+','+u.y, queue=[{x:u.x,y:u.y,path:[]}], visited={}; visited[start]=true;
    while(queue.length){
      var current=queue.shift(); if(current.x===x&&current.y===y)return current.path;
      if(current.path.length>=maxSteps)continue;
      [[1,0],[-1,0],[0,1],[0,-1]].forEach(function(d){
        var nx=current.x+d[0],ny=current.y+d[1],key=nx+','+ny;
        if(!visited[key]&&inBoard(nx,ny)&&(!at(nx,ny)||(nx===x&&ny===y))){visited[key]=true;queue.push({x:nx,y:ny,path:current.path.concat([{x:nx,y:ny}])});}
      });
    } return null;
  }
  function maybeAutoEndAfterMoves(){
    if(state.autoEnding||state.phase!=='player'||state.over||state.animating||!alive('ally').length||!alive('ally').every(function(u){return u.moved;}))return;
    state.autoEnding=true;note('我方全員已完成移動，準備切換敵方回合。');render();
    setTimeout(function(){state.autoEnding=false;if(state.phase==='player'&&!state.over&&!state.animating&&alive('ally').every(function(u){return u.moved;}))endTurn();},duration(260));
  }
  function walkUnit(u,x,y){
    var path=pathTo(u,x,y,u.p.move); if(!path||!path.length)return Promise.resolve(false);
    state.animating=true; note(unitName(u)+' 開始移動：'+path.length+' 格路徑。'); render();
    return new Promise(function(resolve){var step=0;function next(){
      if(step>=path.length){u.moved=true;state.animating=false;note(unitName(u)+' 抵達 '+(u.x+1)+'-'+(u.y+1)+'。');render();maybeAutoEndAfterMoves();resolve(true);return;}
      var fromX=u.x,fromY=u.y;u.x=path[step].x;u.y=path[step].y;step++;render();
      var piece=board.querySelector('[data-key="'+u.key+'"]');if(piece){piece.style.setProperty('--walk-x',(fromX-u.x)*100+'%');piece.style.setProperty('--walk-y',(fromY-u.y)*100+'%');piece.classList.add('walking');}setTimeout(next,duration(175));
    } setTimeout(next,duration(45));});
  }
  function skillOf(u){return u.p.skills[state.skill]||u.p.skills[0];}
  function canTarget(u, target){ var s=skillOf(u), d=dist(u,target); if(s.attackStyle==='support') return target.team==='ally' && d<=s.range; return target.team==='enemy' && d<=s.range; }
  function evolutionMultiplier(u){ return 1 + (u.evolution - 1) * .12; }
  function portrait(u){ return u.p.evolution[u.evolution - 1].portrait; }
  function render(){
    board.innerHTML='';
    for(var y=0;y<ROWS;y++) for(var x=0;x<COLS;x++) board.appendChild(cell(x,y));
    renderParty(); renderTrait(); renderDetail(); renderTurnOrder();
    banner.textContent=state.over?'戰鬥結束':(state.phase==='player'?'第 '+state.round+' 回合｜我方行動':'第 '+state.round+' 回合｜敵方行動');
    roundStatus.textContent=state.over?'試煉結束':state.phase==='player'?'我方回合':'敵方回合';
  }
  function cell(x,y){
    var el=document.createElement('div'), u=at(x,y), s=selected(); el.className='cell';
    var t=terrain(x,y); if(t) el.classList.add('terrain-'+t);
    el.innerHTML='<span class="coord">'+(x+1)+'-'+(y+1)+'</span>';
    if(s && state.phase==='player' && !state.over){
      if(state.mode==='move' && !s.moved && canMove(s,x,y)) el.classList.add('move-target');
      if(state.mode==='skill' && u && !s.acted && canTarget(s,u)) el.classList.add(skillOf(s).attackStyle==='support'?'support-target':'attack-target');
    }
    el.addEventListener('click',function(){ clickCell(x,y); });
    if(u) el.appendChild(unitEl(u)); return el;
  }
  function unitEl(u){
    var el=document.createElement('div'); el.className='unit '+u.team+(state.selected===u.key?' active':''); el.dataset.key=u.key;
    el.setAttribute('aria-label',u.p.name+'，生命 '+u.hp+'／'+u.maxHp);
    el.innerHTML='<span class="portrait" role="img" aria-label="'+u.p.name+'" style="background-image:url(\''+portrait(u)+'\')"></span><span class="unit-info"><span class="unit-name">'+u.p.name+'</span><span class="unit-health" title="生命 '+u.hp+'／'+u.maxHp+'"><i style="width:'+(100*u.hp/u.maxHp)+'%"></i></span></span>';
    el.addEventListener('click',function(e){e.stopPropagation();if(state.mode==='skill'&&selected()&&canTarget(selected(),u)){clickCell(u.x,u.y);return;}if(u.team==='ally'&&state.phase==='player'&&!state.over&&!state.animating&&!state.autoEnding){state.selected=u.key;state.mode='move';note('已選取「'+unitName(u)+'」：先移動，或選擇技能後點選目標。');render();}});
    return el;
  }
  function clickCell(x,y){
    var s=selected(), target=at(x,y); if(!s||state.phase!=='player'||state.over||state.animating||state.autoEnding)return;
    if(state.mode==='move'&&canMove(s,x,y)&&!s.moved){ walkUnit(s,x,y); return; }
    if(state.mode==='skill'&&target&&canTarget(s,target)&&!s.acted) act(s,target,skillOf(s));
  }
  function closest(unit, units){return units.slice().sort(function(a,b){return dist(unit,a)-dist(unit,b);})[0];}
  function autoMove(unit, target){var choices=[];for(var y=0;y<ROWS;y++)for(var x=0;x<COLS;x++){if(canMove(unit,x,y)&&pathTo(unit,x,y,unit.p.move))choices.push({x:x,y:y,d:Math.abs(x-target.x)+Math.abs(y-target.y)});}choices.sort(function(a,b){return a.d-b.d;});if(choices.length&&choices[0].d<dist(unit,target)){walkUnit(unit,choices[0].x,choices[0].y);return true;}unit.moved=true;maybeAutoEndAfterMoves();return false;}
  function autoTarget(unit){var enemies=alive('enemy'),allies=alive('ally'),skills=unit.p.skills;for(var i=skills.length-1;i>=0;i--){if(unit.cooldowns[i]>0)continue;state.skill=i;var skill=skills[i],targets=skill.attackStyle==='support'?allies.filter(function(a){return a.hp<a.maxHp&&canTarget(unit,a);}):enemies.filter(function(e){return canTarget(unit,e);});if(targets.length)return {skill:i,target:closest(unit,targets)};}return null;}
  function autoStep(){if(!autoTimer||state.animating||state.autoEnding)return;if(state.over){stopAuto();return;}if(state.phase!=='player')return;var unit=alive('ally').filter(function(u){return !u.acted;})[0];if(!unit){endTurn();return;}state.selected=unit.key;var action=autoTarget(unit);if(!action&&!unit.moved){autoMove(unit,closest(unit,alive('enemy')));return;}action=autoTarget(unit);if(action){state.mode='skill';state.skill=action.skill;act(unit,action.target,skillOf(unit),action.skill);return;}unit.acted=true;note(unitName(unit)+' 沒有可用目標，結束本次行動。');render();}
  function stopAuto(){if(autoTimer){clearInterval(autoTimer);autoTimer=null;}if(autoButton){autoButton.classList.remove('active');autoButton.textContent='🤖 觀戰自動戰鬥：關';}}
  function startAutoTimer(){autoTimer=setInterval(autoStep,duration(245));}
  function toggleAuto(){if(autoTimer){stopAuto();return;}startAutoTimer();autoButton.classList.add('active');autoButton.textContent='🤖 觀戰自動戰鬥：開';note('觀戰模式啟動：幻獸會依射程、冷卻與目標生命值自行行動。');autoStep();}
  function cycleSpeed(){var speeds=[1,1.5,2],index=speeds.indexOf(battleSpeed);battleSpeed=speeds[(index+1)%speeds.length];document.documentElement.style.setProperty('--battle-rate',1/battleSpeed);speedButton.textContent='⚡ 戰鬥速度：'+battleSpeed+'×';if(autoTimer){clearInterval(autoTimer);startAutoTimer();}note('戰鬥速度調整為 '+battleSpeed+'×。');}
  function damage(attacker,target,skill){
    var magic=skill.attackStyle==='ranged'||skill.attackStyle==='area';
    var raw=Math.round((magic?attacker.p.stats.magic:attacker.p.stats.power)*evolutionMultiplier(attacker)*combatMultiplier(attacker)*(skill.multiplier||1.05));
    var amount=Math.max(12,Math.round(raw-target.p.stats.defense*.55));
    target.hp=Math.max(0,target.hp-amount); if(attacker.team==='ally')state.stats.damage+=amount; return amount;
  }
  function vfx(target, element, skill, amount, healing){
    var cell=board.children[target.y*COLS+target.x]; if(!cell)return;
    var fx=document.createElement('i'); fx.className='vfx '+(element||'fire')+' variant-'+((skill&&skill.vfxVariant)||0); if(skill)fx.style.setProperty('--vfx','hsl('+skill.vfxHue+' 92% 62%)'); fx.setAttribute('aria-label',skill?skill.name+' 特效':'攻擊特效'); cell.appendChild(fx);
    var number=document.createElement('b');number.className='damage-number '+(healing?'heal':'');number.textContent=(healing?'+':'−')+amount;cell.appendChild(number);setTimeout(function(){fx.remove();number.remove();},duration(520));
    var u=cell.querySelector('.unit'); if(u){u.classList.add(healing?'recover':'hit');setTimeout(function(){u.classList.remove(healing?'recover':'hit');},duration(400));}
  }
  function canCounter(defender, attacker){var basic=defender.p.skills[0];return defender.hp>0&&attacker.hp>0&&basic&&basic.attackStyle!=='support'&&dist(defender,attacker)<=basic.range;}
  function act(u,target,skill,skillIndex,options){
    options=options||{};
    state.animating=true;u.acted=true; var message, amount, healing=skill.attackStyle==='support';
    if(healing) { var heal=Math.round(u.p.stats.magic*evolutionMultiplier(u)*combatMultiplier(u)*(skill.multiplier||.8)); var before=target.hp; target.hp=Math.min(target.maxHp,target.hp+heal); amount=target.hp-before; if(u.team==='ally')state.stats.healing+=amount; message=unitName(u)+' 詠唱「'+skill.name+'」，為 '+unitName(target)+' 回復 '+amount+' 點生命。'; }
    else { amount=damage(u,target,skill); message=(options.counter?'反擊！':'')+unitName(u)+' 施放「'+skill.name+'」，對 '+unitName(target)+' 造成 '+amount+' 點傷害。'; }
    var actualIndex=skillIndex===undefined?state.skill:skillIndex; if(skill.cooldown > 0) u.cooldowns[actualIndex] = skill.cooldown;
    note(message); checkEnd(); render();
    var caster=board.querySelector('[data-key="'+u.key+'"]'); if(caster){caster.classList.add('cast');setTimeout(function(){caster.classList.remove('cast');},duration(400));}
    if(skill.attackStyle==='melee'){ var active=board.querySelector('[data-key="'+u.key+'"]'); if(active){var dx=(target.x-u.x)*42,dy=(target.y-u.y)*42;active.style.setProperty('--dash-x',dx+'px');active.style.setProperty('--dash-y',dy+'px');active.classList.add('dash');setTimeout(function(){active.classList.remove('dash');},duration(380));} }
    setTimeout(function(){vfx(target,u.p.element,skill,amount,healing);},duration(healing?70:110));
    var shouldCounter=!healing&&!options.counter&&!state.over&&canCounter(target,u);
    if(shouldCounter){setTimeout(function(){if(!state.over&&canCounter(target,u)){note(unitName(target)+' 抓住破綻，發動反擊！');render();act(target,u,target.p.skills[0],0,{counter:true});}else{state.animating=false;if(!state.over)render();}},duration(470));}
    else setTimeout(function(){state.animating=false;if(!state.over)render();},duration(440));
  }
  function renderParty(){ list.innerHTML=''; alive('ally').forEach(function(u){var e=document.createElement('div');e.className='party-card'+(state.selected===u.key?' selected':'')+(u.hp<=0?' dead':'');e.innerHTML='<div class="party-name">'+u.p.name+'</div><div class="party-meta">'+u.p.roleLabel+'｜'+(u.p.attackStyle==='melee'?'近戰':u.p.attackStyle==='ranged'?'遠攻':'輔助')+'</div><div class="hpbar"><i style="width:'+(100*u.hp/u.maxHp)+'%"></i></div>';e.onclick=function(){if(state.phase==='player'&&!state.over&&!state.animating&&!state.autoEnding){state.selected=u.key;state.mode='move';render();}};list.appendChild(e);}); }
  function renderTrait(){var trait=traitFor('ally');teamTrait.innerHTML='<b>✦ '+trait.label+'</b><span>'+trait.copy+'</span>';}
  function renderDetail(){ var u=selected(); buttons.innerHTML=''; evolutionButtons.innerHTML=''; if(!u){detail.textContent='點選我方幻獸查看能力。';return;} var st=u.p.stats, mult=evolutionMultiplier(u);detail.innerHTML='<strong>'+u.p.name+'｜'+u.p.roleLabel+'｜'+u.p.evolution[u.evolution-1].label+'</strong><br>攻擊方式：'+(u.p.attackStyle==='melee'?'近戰（會移至目標相鄰格）':u.p.attackStyle==='ranged'?'遠攻（原地施放）':'輔助（原地施放）')+'<div class="stat-grid"><span>力量 '+Math.round(st.power*mult)+'</span><span>魔力 '+Math.round(st.magic*mult)+'</span><span>防衛 '+Math.round(st.defense*mult)+'</span><span>速度 '+st.speed+'</span><span>血量 '+u.hp+'/'+u.maxHp+'</span><span>移動 '+u.p.move+' 格</span></div>';
    u.p.evolution.forEach(function(e){var b=document.createElement('button'),unlocked=evolutionUnlocked(u.id,e.stage),cost=evolutionCost(e.stage);b.className='evolution-btn'+(u.evolution===e.stage?' active':'');b.disabled=u.acted||state.phase!=='player'||state.over||state.animating||state.autoEnding;b.textContent=e.stage+'．'+e.label+(unlocked?'':' 🔒'+cost);b.onclick=function(){setEvolution(u,e.stage);};evolutionButtons.appendChild(b);});
    u.p.skills.forEach(function(s,i){var b=document.createElement('button'),cd=u.cooldowns[i]||0;b.className='skill'+(state.mode==='skill'&&state.skill===i?' active':'');b.disabled=u.acted||cd>0||state.phase!=='player'||state.over||state.animating||state.autoEnding;b.textContent=(i+1)+'．'+s.name+'｜'+(s.attackStyle==='support'?'輔助':'射程 '+s.range)+(cd?'（冷卻 '+cd+'）':'');b.onclick=function(){state.selected=u.key;state.mode='skill';state.skill=i;note('已選擇「'+s.name+'」，請直接點選可作用的'+(s.attackStyle==='support'?'我方':'敵方')+'角色或目標格。');render();};buttons.appendChild(b);}); }
  function setEvolution(u, stage){if(u.evolution===stage)return;if(!evolutionUnlocked(u.id,stage)){var cost=evolutionCost(stage);if(progress.medals<cost){note('需要 '+cost+' 枚戰術徽章才能解鎖'+u.p.evolution[stage-1].label+'。');return;}progress.medals-=cost;progress.evolution[u.id]=stage;saveProgress();renderProgress();note(unitName(u)+' 解鎖了'+u.p.evolution[stage-1].label+'！');}var ratio=u.maxHp?u.hp/u.maxHp:1;u.evolution=stage;u.maxHp=Math.round(u.p.stats.health*evolutionMultiplier(u));u.hp=Math.max(1,Math.min(u.maxHp,Math.round(u.maxHp*ratio)));note(unitName(u)+' 轉換為'+u.p.evolution[stage-1].label+'，能力值已更新。');render();}
  function renderTurnOrder(){var units=alive('ally').concat(alive('enemy')).sort(function(a,b){return b.p.stats.speed-a.p.stats.speed;});turnOrder.innerHTML='<b>速度行動序列</b><span>'+units.map(function(u,index){return '<i class="timeline-token '+u.team+'">'+(index+1)+'</i>'+u.p.name+' '+u.p.stats.speed;}).join('　')+'</span>';}
  function showResult(win){var aliveCount=alive('ally').length;resultIcon.textContent=win?'🏆':'🌙';resultTitle.textContent=win?'試煉勝利':'本次撤退';resultCopy.textContent=win?'獲得 4 枚戰術徽章；可繼續解鎖出戰幻獸的進化階段。':'調整隊伍、善用射程與技能冷卻後再次挑戰。';resultStats.innerHTML='<span><b>'+state.round+'</b>回合</span><span><b>'+state.stats.damage+'</b>傷害</span><span><b>'+aliveCount+'/3</b>存活</span>';resultModal.hidden=false;}
  function checkEnd(){if(!alive('enemy').length){state.over=true;stopAuto();progress.medals+=4;progress.wins++;progress.battles++;saveProgress();renderProgress();note('勝利！獲得 4 枚戰術徽章，可用於解鎖進化階段。');setTimeout(function(){showResult(true);},duration(380));}else if(!alive('ally').length){state.over=true;stopAuto();progress.battles++;saveProgress();note('戰敗。重新開始後可調整移動順序與技能目標。');setTimeout(function(){showResult(false);},duration(380));}}
  function openDeploy(){if(!state.over&&state.round>1){note('請在本場結束後再調整隊伍。');return;}deploySelection=partyIds.slice();renderDeploy();deployModal.hidden=false;}
  function renderDeploy(){deployHelp.textContent='已選 '+deploySelection.length+'/3 隻。選擇不同元素與定位可改善戰術彈性。';deployGrid.innerHTML='';TACTICAL_PET_DATA.forEach(function(p){var b=document.createElement('button'),selected=deploySelection.indexOf(p.id)>=0;b.className='deploy-card'+(selected?' selected':'');b.innerHTML='<span class="deploy-art" style="background-image:url(\''+p.evolution[0].portrait+'\')"></span><b>'+p.name+'</b><small>'+p.roleLabel+'｜'+(p.attackStyle==='melee'?'近戰':p.attackStyle==='ranged'?'遠攻':'輔助')+'</small>';b.onclick=function(){var index=deploySelection.indexOf(p.id);if(index>=0)deploySelection.splice(index,1);else if(deploySelection.length<3)deploySelection.push(p.id);else{deployHelp.textContent='隊伍已滿，請先取消一隻幻獸。';return;}renderDeploy();};deployGrid.appendChild(b);});}
  function confirmDeploy(){if(deploySelection.length!==3){deployHelp.textContent='請選滿三隻幻獸後再確認。';return;}partyIds=deploySelection.slice();progress.party=partyIds.slice();saveProgress();deployModal.hidden=true;reset();}
  function endTurn(){if(state.phase!=='player'||state.over||state.animating)return; state.phase='enemy'; state.selected=null; render(); setTimeout(enemyTurn,duration(260));}
  function enemyAction(enemy){var foes=alive('ally'),allies=alive('enemy'),best=null;enemy.p.skills.forEach(function(skill,index){if(enemy.cooldowns[index]>0)return;var candidates=skill.attackStyle==='support'?allies.filter(function(a){return a.hp<a.maxHp&&dist(enemy,a)<=skill.range;}):foes.filter(function(f){return dist(enemy,f)<=skill.range;});if(!candidates.length)return;var target=skill.attackStyle==='support'?candidates.sort(function(a,b){return a.hp/a.maxHp-b.hp/b.maxHp;})[0]:candidates.sort(function(a,b){return a.hp/a.maxHp-b.hp/b.maxHp||dist(enemy,a)-dist(enemy,b);})[0],score=(skill.kind==='ultimate'?30:skill.kind==='active'?20:10)+(skill.attackStyle==='support'?(1-target.hp/target.maxHp)*25:(1-target.hp/target.maxHp)*15);if(!best||score>best.score)best={skill:skill,index:index,target:target,score:score};});return best;}
  async function enemyTurn(){
    var enemies=alive('enemy').sort(function(a,b){return b.p.stats.speed-a.p.stats.speed;});
    for(var i=0;i<enemies.length;i++){
      var e=enemies[i];if(e.hp<=0||state.over)break;var targets=alive('ally');if(!targets.length)break;
      var action=enemyAction(e),t=action?action.target:closest(e,targets);
      if(!action&&dist(e,t)>1){
        var choices=[];for(var y=0;y<ROWS;y++)for(var x=0;x<COLS;x++)if(canMove(e,x,y)&&pathTo(e,x,y,e.p.move))choices.push({x:x,y:y,d:Math.abs(x-t.x)+Math.abs(y-t.y)});
        choices.sort(function(a,b){return a.d-b.d;});if(choices.length&&choices[0].d<dist(e,t)){note(unitName(e)+' 正在逐格逼近 '+unitName(t)+'。');await walkUnit(e,choices[0].x,choices[0].y);}
        action=enemyAction(e);
      }
      if(action){var countered=canCounter(action.target,e);act(e,action.target,action.skill,action.index);await pause(countered?940:470);}else if(dist(e,t)<=1){var counteredBasic=canCounter(t,e);act(e,t,e.p.skills[0],0);await pause(counteredBasic?940:470);}else{e.moved=true;note(unitName(e)+' 暫時無法接近目標。');render();await pause(150);}
    }
    if(!state.over){state.phase='player';state.round++;alive('ally').concat(alive('enemy')).forEach(function(u){u.moved=false;u.acted=false;u.cooldowns=u.cooldowns.map(function(cd){return Math.max(0,cd-1);});});note('輪到我方，請規劃本回合行動。');render();}
  }
  document.getElementById('restart').onclick=reset; document.getElementById('end-turn').onclick=endTurn; autoButton.onclick=toggleAuto; speedButton.onclick=cycleSpeed; document.getElementById('deploy').onclick=openDeploy; document.getElementById('close-deploy').onclick=function(){deployModal.hidden=true;}; document.getElementById('cancel-deploy').onclick=function(){deployModal.hidden=true;}; document.getElementById('confirm-deploy').onclick=confirmDeploy; document.getElementById('result-retry').onclick=function(){resultModal.hidden=true;reset();}; document.getElementById('result-deploy').onclick=function(){resultModal.hidden=true;openDeploy();}; reset();
}());
