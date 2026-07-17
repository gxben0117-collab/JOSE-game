(() => {
  const firePets = PET_DATA.filter((pet) => pet.element === 'fire').slice(0, 10);
  const nodes = [
    { type: 'story', icon: '◇', label: '\u88c2\u8c37\u4e4b\u9580', text: '\u7194\u706b\u88c2\u8c37\u5df2\u7d93\u958b\u555f\u3002\u4e00\u689d\u5b89\u5168\u7684\u8def\u7dda\u5728\u7070\u71fc\u96f2\u4e4b\u9593\u767c\u5149\u3002' },
    { type: 'battle', icon: '⚔', label: '\u7070\u71fc\u7375\u7fa4', difficulty: 1 },
    { type: 'reward', icon: '✦', label: '\u9918\u71fc\u5bf6\u7bb1' },
    { type: 'camp', icon: '♥', label: '\u7070\u71fc\u71df\u5730' },
    { type: 'battle', icon: '⚔', label: '\u7194\u5ca9\u5b88\u885b', difficulty: 2 },
    { type: 'reward', icon: '✦', label: '\u9060\u53e4\u7194\u7210' },
    { type: 'battle', icon: '⚔', label: '\u70c8\u7130\u5148\u92d2', difficulty: 3 },
    { type: 'boss', icon: '♛', label: '\u88c2\u8c37\u5b88\u885b\u8005', difficulty: 4 }
  ];
  const state = { party: [], current: 0, cleared: [], gold: 0, embers: 0, hp: {}, xp: 0, battle: null };
  const $ = (selector) => document.querySelector(selector);
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const pet = (id) => firePets.find((item) => item.id === id);
  const level = () => 1 + Math.floor(state.xp / 80);
  const maxHp = (unit) => Math.round(unit.baseHp * 0.58 * (1 + (level() - 1) * 0.08));
  const attack = (unit) => Math.round(unit.baseAtk * (1 + (level() - 1) * 0.07));
  const quickMode = () => new URLSearchParams(location.search).get('mode') === 'battle';
  function save() { localStorage.setItem('jose-fire-rift-v2', JSON.stringify({ party: state.party, current: state.current, cleared: state.cleared, gold: state.gold, embers: state.embers, hp: state.hp, xp: state.xp })); }
  function load() {
    const saved = localStorage.getItem('jose-fire-rift-v2');
    if (!saved) return;
    try {
      const restored = JSON.parse(saved);
      if (!restored || !Array.isArray(restored.party) || !restored.party.every((id) => pet(id))) throw new Error('invalid save');
      Object.assign(state, restored);
    } catch (_) {
      localStorage.removeItem('jose-fire-rift-v2');
    }
  }
  function updateHud() { $('#gold').textContent = `${state.gold} \u91d1\u5e63`; $('#embers').textContent = `${state.embers} \u9918\u71fc`; }
  function renderRoster() {
    $('#roster').innerHTML = firePets.map((unit) => `<button class="monster-card ${state.party.includes(unit.id) ? 'selected' : ''}" data-id="${unit.id}"><span class="monster-icon">${unit.icon}</span><b>${unit.name}</b><small>\u751f\u547d ${maxHp(unit)} / \u653b\u64ca ${attack(unit)}</small><em>${QUALITY_CONFIG[unit.quality].label}</em></button>`).join('');
    $('#party-picks').innerHTML = state.party.map((id) => `<span class="party-chip">${pet(id).icon}</span>`).join('');
    $('#start-run').disabled = state.party.length !== 3;
  }
  function resetRun() {
    state.current = quickMode() ? 1 : 0; state.cleared = quickMode() ? [0] : []; state.gold = 0; state.embers = 0; state.xp = 0; state.hp = {};
    state.party.forEach((id) => { state.hp[id] = maxHp(pet(id)); });
  }
  function startRun() { resetRun(); $('#setup-screen').hidden = true; $('#game-screen').hidden = false; updateHud(); renderMap(); save(); enterNode(state.current); }
  function renderMap() {
    $('#route').innerHTML = nodes.map((node, index) => { const complete = state.cleared.includes(index); const available = index === state.current; return `<button class="node ${complete ? 'complete' : ''} ${available ? 'available' : 'locked'}" data-node="${index}" ${available ? '' : 'disabled'}><span class="node-icon">${node.icon}</span><span>${node.label}</span><small>${complete ? '\u5df2\u5b8c\u6210' : available ? '\u9032\u5165' : '\u672a\u89e3\u9396'}</small></button>`; }).join('');
    $('#map-status').textContent = state.current < nodes.length ? `\u4e0b\u4e00\u7ad9\uff1a${nodes[state.current].label} \u00b7 \u968a\u4f0d Lv.${level()}` : '\u7194\u706b\u88c2\u8c37\u5df2\u653b\u7565\u3002';
  }
  function showCard(title, copy, button, handler, klass = 'story-card') { $('#event-panel').innerHTML = `<div class="${klass}"><p class="eyebrow">\u7194\u706b\u88c2\u8c37</p><h2>${title}</h2><p>${copy}</p><button id="continue" class="primary">${button}</button></div>`; $('#continue').onclick = handler; }
  function clearNode() { state.cleared.push(state.current); state.current += 1; updateHud(); renderMap(); save(); }
  function nextPrompt() { if (state.current >= nodes.length) { showCard('\u7194\u706b\u88c2\u8c37\u5df2\u653b\u7565', `\u4f60\u7684\u968a\u4f0d\u5df2\u9054\u5230 Lv.${level()}\uff0c\u4e26\u5c01\u5370\u4e86\u88c2\u8c37\u3002`, '\u65b0\u7684\u9060\u5f81', () => $('#reset').click(), 'reward'); return; } const next = nodes[state.current]; showCard(`\u4e0b\u4e00\u7ad9\uff1a${next.label}`, '\u8def\u7dda\u5df2\u5c31\u7dd2\u3002\u7576\u968a\u4f0d\u6e96\u5099\u597d\u5f8c\u5373\u53ef\u7e7c\u7e8c\u3002', '\u5411\u524d\u63a8\u9032', () => enterNode(state.current)); }
  function enterNode(index) {
    if (index !== state.current) return;
    const node = nodes[index];
    if (node.type === 'battle' || node.type === 'boss') return beginBattle(node);
    if (node.type === 'story') return showCard(node.label, node.text, '\u9032\u5165\u88c2\u8c37', () => { clearNode(); nextPrompt(); });
    if (node.type === 'camp') return showCard(node.label, '\u5728\u9019\u88e1\u4f11\u606f\uff0c\u53ef\u4ee5\u5b8c\u5168\u56de\u5fa9\u6bcf\u4e00\u96bb\u5e7b\u7378\u3002', '\u4f11\u606f', () => { state.party.forEach((id) => { state.hp[id] = maxHp(pet(id)); }); clearNode(); showCard('\u968a\u4f0d\u5df2\u56de\u5fa9', '\u5168\u968a\u751f\u547d\u5df2\u56de\u5fa9\u3002', '\u7e7c\u7e8c', nextPrompt, 'reward'); }, 'reward');
    showCard(node.label, '\u5ca9\u77f3\u9593\u85cf\u8457\u4e00\u6279\u9918\u71fc\u88dc\u7d66\u3002', '\u9818\u53d6', () => { state.gold += 30 + state.current * 15; state.embers += 2; clearNode(); showCard('\u88dc\u7d66\u5df2\u53d6\u5f97', '+ \u91d1\u5e63\uff0c+2 \u9918\u71fc\u3002', '\u7e7c\u7e8c', nextPrompt, 'reward'); }, 'reward');
  }
  function enemyStats(unit, difficulty, boss) { return { ...unit, hp: boss ? 1250 : 240 + difficulty * 115, maxHp: boss ? 1250 : 240 + difficulty * 115, atk: boss ? 94 : 42 + difficulty * 14, shield: 0, burn: 0 }; }
  function beginBattle(node) {
    const pool = firePets.slice(2, 7); const boss = node.type === 'boss';
    const source = boss ? firePets[8] : pool[(node.difficulty - 1) % pool.length];
    const enemies = boss ? [enemyStats(source, node.difficulty, true)] : [enemyStats(source, node.difficulty, false), enemyStats(pool[node.difficulty % pool.length], node.difficulty, false)];
    state.battle = { node, enemies, turn: 'player', log: `${node.label}\u963b\u64cb\u4e86\u8def\u7dda\u3002\u8acb\u9078\u64c7\u884c\u52d5\u3002`, cooldown: {}, shield: {}, atkBuff: {}, auto: false, autoTimer: null };
    $('#event-panel').innerHTML = $('#battle-template').innerHTML; renderBattle();
  }
  function unitMarkup(unit, hp, max, enemy) { const pct = clamp(hp / max * 100, 0, 100); return `<div class="unit ${hp <= 0 ? 'dead' : ''}" data-unit="${unit.id}"><div class="unit-icon">${unit.icon}</div><div class="unit-name">${unit.name}</div><div class="hp"><i style="width:${pct}%"></i></div><div class="hp-label">${Math.max(0, Math.round(hp))}/${max}${enemy && unit.burn ? ' · \u71c3\u71d2' : ''}</div></div>`; }
  function renderBattle() {
    const b = state.battle; if (!b) return;
    $('#encounter-name').textContent = b.node.label; $('#turn-label').textContent = b.turn === 'player' ? '\u6211\u65b9\u884c\u52d5' : '\u6575\u65b9\u884c\u52d5'; $('#battle-log').textContent = b.log;
    $('#ally-field').innerHTML = state.party.map((id) => unitMarkup(pet(id), state.hp[id], maxHp(pet(id)), false)).join('');
    $('#enemy-field').innerHTML = b.enemies.map((unit) => unitMarkup(unit, unit.hp, unit.maxHp, true)).join('');
    const active = state.party.filter((id) => state.hp[id] > 0);
    $('#actions').innerHTML = active.map((id) => { const unit = pet(id); const cd = b.cooldown[id] || 0; return `<button class="action" data-skill="${id}|0" ${b.turn !== 'player' ? 'disabled' : ''}><b>${unit.skills[0].name}</b><br><small>${unit.name}</small></button><button class="action" data-skill="${id}|1" ${b.turn !== 'player' || cd ? 'disabled' : ''}><b>${unit.skills[1].name}</b><br><small>${cd ? `\u51b7\u537b ${cd}` : unit.name}</small></button>`; }).join('') + `<button class="action" data-auto="1" ${b.turn !== 'player' ? 'disabled' : ''}><b>${b.auto ? '\u81ea\u52d5\u6230\u9b25\u4e2d' : '\u81ea\u52d5\u6230\u9b25'}</b><br><small>\u5b8c\u6210\u672c\u5834\u6230\u9b25</small></button>`;
  }
  function flash(side, amount, text) { const layer = $('#effect-layer'); layer.innerHTML = `<div class="blast"></div><div class="damage">${text || '-' + amount}</div>`; const target = side === 'enemy' ? $('#enemy-field .unit:not(.dead)') : $('#ally-field .unit:not(.dead)'); if (target) { target.classList.add('hit'); setTimeout(() => target.classList.remove('hit'), 160); } setTimeout(() => { if (layer) layer.innerHTML = ''; }, 700); }
  function animateMelee(id) { const actor = $(`#ally-field [data-unit="${id}"]`); if (!actor) return; actor.classList.add('attack-run'); setTimeout(() => actor.classList.remove('attack-run'), 640); }
  function hurtEnemy(target, amount, impactDelay = 0) { const b = state.battle; const blocked = Math.min(target.shield || 0, amount); target.shield = Math.max(0, (target.shield || 0) - amount); target.hp -= amount - blocked; if (impactDelay) setTimeout(() => flash('enemy', amount - blocked), impactDelay); else flash('enemy', amount - blocked); return amount - blocked; }
  function skillUse(id, slot) {
    const b = state.battle; if (!b || b.turn !== 'player') return; const unit = pet(id); const skill = unit.skills[slot]; if (slot && b.cooldown[id]) return;
    const aliveEnemies = b.enemies.filter((enemy) => enemy.hp > 0); let note = '';
    const multiplier = skill.multiplier || 1; const bonus = b.atkBuff[id] || 0; const base = Math.round(attack(unit) * multiplier * (1 + bonus));
    if (skill.effect === 'heal') { const amount = Math.round(maxHp(unit) * skill.value); state.hp[id] = clamp(state.hp[id] + amount, 0, maxHp(unit)); note = `${unit.name}\u56de\u5fa9\u4e86 ${amount} \u9ede\u751f\u547d\u3002`; flash('ally', amount, '+' + amount); }
    else if (skill.effect === 'shield') { const amount = Math.round(maxHp(unit) * skill.value); b.shield[id] = (b.shield[id] || 0) + amount; note = `${unit.name}\u7372\u5f97\u4e86 ${amount} \u9ede\u8b77\u76fe\u3002`; flash('ally', amount, '\u8b77\u76fe'); }
    else if (skill.effect === 'buff_atk') { b.atkBuff[id] = skill.value || 0.2; note = `${unit.name}\u653b\u64ca\u529b\u63d0\u5347\u3002`; flash('ally', 0, '\u653b\u64ca\u63d0\u5347'); }
    else if (skill.effect === 'damage_all') { let total = 0; aliveEnemies.forEach((enemy) => { total += hurtEnemy(enemy, base); }); note = `${unit.name}\u5c0d\u5168\u9ad4\u6575\u4eba\u9020\u6210 ${total} \u9ede\u50b7\u5bb3\u3002`; }
    else { const target = aliveEnemies[0]; animateMelee(id); const dealt = hurtEnemy(target, base, 240); if (skill.effect === 'burn' || unit.skills.some((item) => item.effect === 'burn')) target.burn = Math.max(target.burn, Math.round(base * 0.22)); note = `${unit.name}\u4f7f\u7528\u4e86${skill.name}\uff0c\u9020\u6210 ${dealt} \u9ede\u50b7\u5bb3\u3002`; }
    if (slot) b.cooldown[id] = skill.cooldown || 3; Object.keys(b.cooldown).forEach((key) => { if (key !== id && b.cooldown[key] > 0) b.cooldown[key] -= 1; }); b.log = note; b.turn = 'enemy'; renderBattle();
    if (b.enemies.every((enemy) => enemy.hp <= 0)) return setTimeout(victory, 450); setTimeout(enemyTurn, 720);
  }
  function enemyTurn() {
    const b = state.battle; if (!b) return; const enemy = b.enemies.find((unit) => unit.hp > 0); const alive = state.party.filter((id) => state.hp[id] > 0); if (!enemy || !alive.length) return;
    const targetId = alive[Math.floor(Math.random() * alive.length)]; const shield = b.shield[targetId] || 0; const raw = Math.round(enemy.atk * (0.85 + Math.random() * 0.3)); const blocked = Math.min(shield, raw); b.shield[targetId] = Math.max(0, shield - raw); state.hp[targetId] -= raw - blocked; const target = pet(targetId); b.enemies.forEach((unit) => { if (unit.burn > 0 && unit.hp > 0) { unit.hp -= unit.burn; } }); b.log = `${enemy.name}\u653b\u64ca${target.name}\uff0c\u9020\u6210 ${raw - blocked} \u9ede\u50b7\u5bb3\u3002`; flash('ally', raw - blocked); renderBattle();
    if (state.party.every((id) => state.hp[id] <= 0)) return setTimeout(defeat, 500); if (b.enemies.every((unit) => unit.hp <= 0)) return setTimeout(victory, 500); b.turn = 'player'; setTimeout(renderBattle, 450);
  }
  function victory() { const b = state.battle; if (!b) return; if (b.autoTimer) clearInterval(b.autoTimer); const boss = b.node.type === 'boss'; const gold = boss ? 250 : 50 + b.node.difficulty * 20; state.gold += gold; state.embers += boss ? 10 : 2; state.xp += boss ? 110 : 35; clearNode(); state.battle = null; showCard(boss ? '\u7194\u706b\u88c2\u8c37\u5df2\u653b\u7565' : '\u52dd\u5229', boss ? `\u88c2\u8c37\u5b88\u885b\u8005\u5012\u4e0b\u4e86\u3002\u4f60\u7684\u968a\u4f0d\u5df2\u9054\u5230 Lv.${level()}\u3002` : `+${gold} \u91d1\u5e63\uff0c+2 \u9918\u71fc\uff0c+35 \u7d93\u9a57\u503c\u3002`, boss ? '\u65b0\u7684\u9060\u5f81' : '\u7e7c\u7e8c', boss ? () => $('#reset').click() : nextPrompt, 'reward'); }
  function defeat() { const b = state.battle; if (b && b.autoTimer) clearInterval(b.autoTimer); showCard('\u64a4\u9000', '\u4f60\u7684\u968a\u4f0d\u56de\u5230\u4e86\u4e0a\u4e00\u500b\u5b89\u5168\u71df\u5730\u3002\u4f11\u606f\u5f8c\u518d\u6311\u6230\u5427\u3002', '\u56de\u5fa9\u968a\u4f0d', () => { state.party.forEach((id) => { state.hp[id] = maxHp(pet(id)); }); state.battle = null; nextPrompt(); }, 'reward'); }
  $('#roster').addEventListener('click', (event) => { const card = event.target.closest('[data-id]'); if (!card) return; const id = card.dataset.id; if (state.party.includes(id)) state.party = state.party.filter((item) => item !== id); else if (state.party.length < 3) state.party.push(id); renderRoster(); });
  $('#start-run').onclick = startRun; $('#route').addEventListener('click', (event) => { const node = event.target.closest('[data-node]'); if (node) enterNode(Number(node.dataset.node)); });
  $('#event-panel').addEventListener('click', (event) => { const action = event.target.closest('[data-skill]'); if (action) { const [id, slot] = action.dataset.skill.split('|'); skillUse(id, Number(slot)); } const auto = event.target.closest('[data-auto]'); if (auto && state.battle && !state.battle.auto) { state.battle.auto = true; state.battle.autoTimer = setInterval(() => { const b = state.battle; if (!b || b.turn !== 'player') return; const id = state.party.find((unit) => state.hp[unit] > 0); if (id) skillUse(id, (b.cooldown[id] || 0) ? 0 : 1); }, 820); renderBattle(); } });
  $('#reset').onclick = () => { localStorage.removeItem('jose-fire-rift-v2'); location.href = 'adventure.html'; };
  load(); if (state.party.length === 3 && state.current < nodes.length && state.cleared.length) { $('#setup-screen').hidden = true; $('#game-screen').hidden = false; updateHud(); renderMap(); nextPrompt(); } else { state.party = ['fire_fox', 'fire_lion', 'lava_crab']; renderRoster(); }
})();
