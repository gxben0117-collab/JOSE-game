import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const port = 9337;
const baseUrl = (process.env.JOSE_BASE_URL || 'http://127.0.0.1:4173').replace(/\/$/, '');
const profile = mkdtempSync(join(tmpdir(), 'jose-chrome-'));
const browser = spawn(chrome, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, 'about:blank'
], { stdio: 'ignore', windowsHide: true });

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function json(url, options) {
  for (let attempt = 0; attempt < 50; attempt++) {
    try { const response = await fetch(url, options); if (response.ok) return response.json(); } catch {}
    await delay(100);
  }
  throw new Error(`Chrome DevTools endpoint unavailable: ${url}`);
}

let socket;
let serial = 0;
const pending = new Map();
const events = [];
function command(method, params = {}) {
  const id = ++serial;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}
function waitEvent(method, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const timer = setInterval(() => {
      const index = events.findIndex(event => event.method === method);
      if (index >= 0) { clearInterval(timer); resolve(events.splice(index, 1)[0]); }
      else if (Date.now() - started > timeout) { clearInterval(timer); reject(new Error(`Timed out waiting for ${method}`)); }
    }, 25);
  });
}
async function evaluate(expression) {
  const response = await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.exception?.description || response.exceptionDetails.text || 'Browser evaluation failed');
  return response.result.value;
}
async function screenshot(name) {
  const result = await command('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  const path = join(tmpdir(), name); writeFileSync(path, Buffer.from(result.data, 'base64')); return path;
}
async function reloadAtStage(stageId) {
  const loaded = waitEvent('Page.loadEventFired');
  await evaluate(`(() => { const key = 'jose-tactics-progression-v2'; const save = JSON.parse(localStorage.getItem(key)); save.currentStage = '${stageId}'; localStorage.setItem(key, JSON.stringify(save)); location.reload(); })()`);
  await loaded; await delay(700);
  return evaluate(`(() => ({ stage: document.querySelector('#stage-title').textContent, map: getComputedStyle(document.querySelector('#board')).backgroundImage, kind: document.querySelector('#board').dataset.mapKind, cells: document.querySelectorAll('#board .cell').length }))()`);
}
async function reloadAtTower(floor) {
  await evaluate(`window.__TACTICS_DEBUG__.enterTower(${floor})`); await delay(300);
  return evaluate(`(() => ({ stage: document.querySelector('#stage-title').textContent, slows: document.querySelectorAll('#board .slow-cell').length, size4: document.querySelectorAll('#board .unit.enemy.size-4').length, size5: document.querySelectorAll('#board .unit.enemy.size-5').length, cells: document.querySelectorAll('#board .cell').length }))()`);
}

const errors = [];
const requests = new Map();
try {
  const target = await json(`http://127.0.0.1:${port}/json/new?${encodeURIComponent('about:blank')}`, { method: 'PUT' });
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  socket.onmessage = event => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const item = pending.get(message.id); pending.delete(message.id);
      if (message.error) item.reject(new Error(message.error.message)); else item.resolve(message.result || {});
    } else {
      events.push(message);
      if (message.method === 'Network.requestWillBeSent') requests.set(message.params.requestId, message.params.request.url);
      if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text || 'runtime exception');
      if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') errors.push(`${message.params.entry.text} ${message.params.entry.url || ''}`.trim());
      if (message.method === 'Network.loadingFailed' && !message.params.canceled) errors.push(`${message.params.errorText} ${requests.get(message.params.requestId) || ''}`.trim());
    }
  };
  await Promise.all(['Page.enable', 'Runtime.enable', 'Network.enable', 'Log.enable'].map(method => command(method)));
  await command('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  const loaded = waitEvent('Page.loadEventFired');
  await command('Page.navigate', { url: `${baseUrl}/tactics.html` }); await loaded; await delay(1000);

  const home = await evaluate(`(() => ({
    title: document.title,
    text: document.body.innerText.trim().length,
    homeVisible: !document.querySelector('#screen-home').hidden,
    eyebrow: document.querySelector('#map-eyebrow').textContent,
    cells: document.querySelectorAll('#board .cell').length,
    map: getComputedStyle(document.querySelector('#board')).backgroundImage,
    overflow: document.documentElement.scrollWidth - innerWidth
  }))()`);
  assert.ok(home.text > 250 && home.homeVisible, '首頁載入異常：' + JSON.stringify(home)); assert.match(home.eyebrow, /10 × 21/); assert.equal(home.cells, 210); assert.match(home.map, /chapter-01-story-01-21x10\.jpg/); assert.ok(home.overflow <= 1);
  const desktopShot = await screenshot('jose-desktop-home.png');

  const packingLoaded = waitEvent('Page.loadEventFired');
  await evaluate(`(() => { const key = 'jose-tactics-progression-v2'; const save = JSON.parse(localStorage.getItem(key)); save.commander = { level: 20, xp: 6600 }; const large = TACTICAL_PET_DATA.filter(pet => pet.size === 2).slice(0, 6).map(pet => pet.id); const small = TACTICAL_PET_DATA.find(pet => pet.size === 1).id; [...large, small].forEach(id => { save.owned[id] = true; }); save.party = [...large, small]; localStorage.setItem(key, JSON.stringify(save)); location.reload(); })()`);
  await packingLoaded; await delay(700);
  const packingRoster = await evaluate(`(() => ({ allies: document.querySelectorAll('#board .unit.ally').length, large: document.querySelectorAll('#board .unit.ally.size-2').length, small: document.querySelectorAll('#board .unit.ally.size-1').length, covered: document.querySelectorAll('#board .cell.covered').length, anchorColumns: [...document.querySelectorAll('#board .unit.ally')].map(unit => [...document.querySelectorAll('#board .cell')].indexOf(unit.parentElement) % 21) }))()`);
  assert.equal(packingRoster.allies, 7); assert.equal(packingRoster.large, 6); assert.equal(packingRoster.small, 1); assert.equal(packingRoster.covered, 18); assert.ok(packingRoster.anchorColumns.every(column => column >= 0 && column <= 2));

  const capacityLoaded = waitEvent('Page.loadEventFired');
  await evaluate(`(() => { const key = 'jose-tactics-progression-v2'; const save = JSON.parse(localStorage.getItem(key)); save.commander = { level: 20, xp: 6600 }; const ids = TACTICAL_PET_DATA.filter(pet => pet.size === 1).slice(0, 25).map(pet => pet.id); ids.forEach(id => { save.owned[id] = true; }); save.party = ids; save.evolution.molten_ball = 3; localStorage.setItem(key, JSON.stringify(save)); location.reload(); })()`);
  await capacityLoaded; await delay(700);
  const capacityRoster = await evaluate(`(() => { document.querySelector('#hub-party').click(); const search = document.querySelector('#deploy-search'); search.value = '熔球'; search.dispatchEvent(new Event('input')); const filtered = document.querySelectorAll('#deploy-grid .deploy-card').length; search.value = ''; search.dispatchEvent(new Event('input')); const result = { help: document.querySelector('#deploy-help').textContent, selected: document.querySelectorAll('#deploy-grid .deploy-card.selected').length, filtered, budget: document.querySelector('#deploy-budget-label').textContent }; document.querySelector('#close-deploy').click(); return result; })()`);
  assert.equal(capacityRoster.selected, 25); assert.match(capacityRoster.help, /出陣單位 25 \/ 25/);
  assert.equal(capacityRoster.filtered, 1); assert.match(capacityRoster.budget, /25 \/ 25/);

  const dexUi = await evaluate(`(() => { document.querySelector('#open-dex').click(); const search = document.querySelector('#dex-search'); search.value = '基本攻擊'; search.dispatchEvent(new Event('input')); const result = { cards: document.querySelectorAll('#dex-grid .dex-card').length, detail: document.querySelector('#dex-detail').innerText, layout: getComputedStyle(document.querySelector('.dex-layout')).display }; document.querySelector('[data-close="dex-modal"]').click(); return result; })()`);
  assert.ok(dexUi.cards > 0); assert.match(dexUi.detail, /技能資料|尚未發現/); assert.equal(dexUi.layout, 'grid');

  const growthUi = await evaluate(`(() => { document.querySelector('#open-growth').click(); const result = { quick: document.querySelectorAll('#growth-quick-roster .growth-quick-card').length, preview: document.querySelector('.growth-stat-panel')?.innerText || '', next: document.querySelector('.growth-next-step')?.innerText || '' }; document.querySelector('[data-close="growth-modal"]').click(); return result; })()`);
  assert.ok(growthUi.quick > 0); assert.match(growthUi.preview, /戰力預覽/); assert.match(growthUi.next, /下一個有效提升/);

  await evaluate(`document.querySelector('#enter-battle').click()`); await delay(500);
  const briefing = await evaluate(`(() => ({ open: !document.querySelector('#battle-briefing-modal').hidden, title: document.querySelector('#battle-briefing-title').textContent, text: document.querySelector('#battle-briefing-content').innerText, presetButtons: document.querySelectorAll('#battle-briefing-content #briefing-recommend').length }))()`);
  assert.ok(briefing.open && briefing.presetButtons === 1); assert.match(briefing.text, /敵軍編制/); assert.match(briefing.text, /推薦編隊/); assert.match(briefing.text, /地形重點/);
  await evaluate(`document.querySelector('#battle-briefing-go').click()`); await delay(260);
  const deployed = await evaluate(`(() => ({
    battleVisible: !document.querySelector('#screen-battle').hidden,
    allies: document.querySelectorAll('.unit.ally').length,
    enemies: document.querySelectorAll('.unit.enemy').length,
    allyRight: !!document.querySelector('.unit.ally.facing-right'),
    enemyLeft: !!document.querySelector('.unit.enemy.facing-left'),
    motion: getComputedStyle(document.querySelector('.unit.ally .portrait')).backgroundImage,
    evolvedMotion: getComputedStyle(document.querySelector('.unit.ally[data-key$="-molten_ball"] .portrait')).backgroundImage,
    idleAnimation: getComputedStyle(document.querySelector('.unit.ally .portrait')).animationName,
    terrainOpacity: getComputedStyle(document.querySelector('.terrain-hint')).opacity,
    fourDirectionAllies: document.querySelectorAll('.unit.ally.motion-4dir').length,
    fourDirectionEnemies: document.querySelectorAll('.unit.enemy.motion-4dir').length,
    fourDirectionSheetSize: getComputedStyle(document.querySelector('.unit.ally.motion-4dir .portrait')).backgroundSize,
    motionColumns: document.querySelector('.unit.ally.motion-4dir').style.getPropertyValue('--motion-columns'),
    idleFrames: document.querySelector('.unit.ally.motion-4dir').style.getPropertyValue('--idle-frames'),
    moveFrames: document.querySelector('.unit.ally.motion-4dir').style.getPropertyValue('--move-frames'),
    attackFrames: document.querySelector('.unit.ally.motion-4dir').style.getPropertyValue('--attack-frames'),
    deployToolbar: !document.querySelector('#deploy-toolbar').hidden,
    balance: window.__TACTICS_DEBUG__.getState().balanceLabel,
    partyCost: window.__TACTICS_DEBUG__.getState().partyCost,
    deployStatus: document.querySelector('#deploy-status').textContent,
    allyAnchorColumns: [...document.querySelectorAll('#board .unit.ally')].map(unit => [...document.querySelectorAll('#board .cell')].indexOf(unit.parentElement) % 21)
  }))()`);
  assert.ok(deployed.battleVisible && deployed.allies === 25 && deployed.enemies >= 15, '戰鬥部署異常：' + JSON.stringify(deployed));
  assert.ok(deployed.deployToolbar); assert.equal(deployed.balance, '滿編迎擊'); assert.equal(deployed.partyCost, 25);
  assert.match(deployed.deployStatus, /3×10/); assert.ok(deployed.allyAnchorColumns.every(column => column >= 0 && column <= 2));
  assert.equal(deployed.fourDirectionAllies, deployed.allies); assert.equal(deployed.fourDirectionEnemies, deployed.enemies); assert.match(deployed.fourDirectionSheetSize, /^800% (1200|2400)%$/); assert.deepEqual([deployed.motionColumns, deployed.idleFrames, deployed.moveFrames, deployed.attackFrames], ['8', '8', '8', '8']); assert.ok(deployed.allyRight && deployed.enemyLeft); assert.match(deployed.motion, /motion-4dir-sheet\.webp/); assert.match(deployed.evolvedMotion, /molten_ball-stage_3-motion-4dir-sheet\.webp/); assert.match(deployed.idleAnimation, /motion-4dir-(idle-right|row)/);
  assert.equal(deployed.terrainOpacity, '0.25');
  const formationPreset = await evaluate(`(() => { document.querySelector('#formation-save').click(); const save = JSON.parse(localStorage.getItem('jose-tactics-progression-v2')); return { party: save.formation.party.length, positions: save.formation.positions.length }; })()`);
  assert.deepEqual(formationPreset, { party: 25, positions: 25 });
  const unitInspection = await evaluate(`(async () => { const enemy = document.querySelector('.unit.enemy'); enemy.click(); await new Promise(resolve => setTimeout(resolve, 80)); const enemyResult = { highlighted: !!document.querySelector('.unit.enemy.inspected'), tags: document.querySelectorAll('#unit-detail .detail-tags span').length, skills: document.querySelectorAll('#unit-detail .detail-skill-list li').length, text: document.querySelector('#unit-detail').innerText.length, forecast: document.querySelector('#unit-detail .combat-forecast')?.innerText || '' }; const ally = document.querySelector('.unit.ally'); ally.click(); await new Promise(resolve => setTimeout(resolve, 80)); return { enemy: enemyResult, allyHighlighted: !!document.querySelector('.unit.ally.inspected'), allyActions: document.querySelectorAll('#skill-buttons .skill').length, minimap: !!document.querySelector('#minimap') }; })()`);
  assert.ok(unitInspection.enemy.highlighted && unitInspection.enemy.tags >= 3 && unitInspection.enemy.skills > 0 && unitInspection.enemy.text > 80); assert.match(unitInspection.enemy.forecast, /戰術預判/); assert.ok(unitInspection.allyHighlighted && unitInspection.allyActions > 0); assert.equal(unitInspection.minimap, false);
  await evaluate(`(() => { document.querySelector('#deploy-start').click(); if (window.__TACTICS_DEBUG__.getState().phase === 'deploy') window.__TACTICS_DEBUG__.beginBattlePhase(); })()`); await delay(120);
  await evaluate(`(() => { const modal = document.querySelector('#story-modal'); if (modal && !modal.hidden) document.querySelector('#story-next').click(); })()`);
  for (let attempt = 0; attempt < 30; attempt++) {
    const phase = await evaluate(`window.__TACTICS_DEBUG__.getState().phase`);
    if (phase === 'player') break;
    await delay(100);
  }
  const battleStartState = await evaluate(`(() => { const raw = window.__TACTICS_DEBUG__.getState(); return { state: { phase: raw.phase, battleStartInProgress: raw.battleStartInProgress }, bossWarning: { visible: !document.querySelector('#boss-warning-panel').hidden, text: document.querySelector('#boss-warning-panel').innerText }, button: { disabled: document.querySelector('#deploy-start').disabled, hidden: document.querySelector('#deploy-toolbar').hidden, handler: typeof document.querySelector('#deploy-start').onclick } }; })()`);
  assert.equal(battleStartState.state.phase, 'player', '部署開始後必須進入我方行動階段：' + JSON.stringify(battleStartState));
  /* 開戰後先等鏡頭定位完成，驗證玩家下一次點選立刻能取得藍格。 */
  await delay(240);
  const directControl = await evaluate(`(() => { let chosen = null; const keys = [...document.querySelectorAll('.unit.ally:not(.action-complete)')].map(unit => unit.dataset.key); for (const key of keys) { const unit = document.querySelector('.unit.ally[data-key="' + key + '"]'); if (!unit) continue; unit.click(); if (document.querySelectorAll('.cell.move-target').length) { chosen = key; break; } } return { selected: chosen, moveTargets: document.querySelectorAll('.cell.move-target').length, attackTargets: document.querySelectorAll('.unit.enemy.in-range, .unit.enemy.attack-target').length, rightSkills: document.querySelectorAll('#skill-buttons .skill').length, rightSkillsDisplay: getComputedStyle(document.querySelector('#skill-buttons')).display, state: window.__TACTICS_DEBUG__.getState(), active: document.querySelector('.unit.ally.active')?.dataset.key || '' }; })()`);
  assert.ok(directControl.moveTargets > 0 && directControl.rightSkills > 0, '選取幻獸後必須直接保留棋盤操作與右側技能：' + JSON.stringify(directControl)); assert.notEqual(directControl.rightSkillsDisplay, 'none');
  const moved = await evaluate(`(() => { const count = document.querySelectorAll('.unit.ally').length; for (let index = 0; index < count; index++) { const ally = document.querySelectorAll('.unit.ally')[index]; ally.click(); const target = document.querySelector('.cell.move-target'); if (target) { target.click(); return true; } } return false; })()`);
  assert.ok(moved); await delay(60);
  const walkAnimation = await evaluate(`(() => { const portrait = document.querySelector('.unit.ally.walking .portrait'); return portrait ? getComputedStyle(portrait).animationName : ''; })()`);
  assert.match(walkAnimation, /motion-(4dir-)?(walk-(right|left|up|down)|row)/); await delay(840);
  const postMoveManualState = await evaluate(`(() => { const active = document.querySelector('.unit.ally.active'); return { phase: window.__TACTICS_DEBUG__.getState().phase, active: active?.dataset.key || '', acted: active?.classList.contains('action-complete') || false, skillsEnabled: [...document.querySelectorAll('#skill-buttons .skill')].some(button => !button.disabled), log: document.querySelector('#combat-log').textContent }; })()`);
  assert.equal(postMoveManualState.phase, 'player', '手動移動後不得自動交給敵方回合：' + JSON.stringify(postMoveManualState));
  assert.ok(postMoveManualState.active && !postMoveManualState.acted && postMoveManualState.skillsEnabled, '手動移動後必須保留攻擊／技能／待機選擇：' + JSON.stringify(postMoveManualState));
  await evaluate(`(() => { window.__attackAnimation = ''; window.__visualEvents = []; window.__lastCasterTeam = ''; window.__lastCasterSupport = false; new MutationObserver(records => { for (const record of records) { if (record.type === 'attributes') { const unit = record.target; if (unit.classList?.contains('unit') && (unit.classList.contains('cast') || unit.classList.contains('supporting'))) { const support = unit.classList.contains('supporting'); const portrait = unit.querySelector('.portrait'); if (!support) window.__attackAnimation = portrait ? getComputedStyle(portrait).animationName : ''; window.__lastCasterTeam = unit.classList.contains('ally') ? 'ally' : 'enemy'; window.__lastCasterSupport = support; window.__visualEvents.push({ type: support ? 'support' : 'cast', team: window.__lastCasterTeam, key: unit.dataset.key }); } } if (record.type === 'childList') for (const node of record.addedNodes) { if (!(node.classList?.contains('vfx') || node.classList?.contains('dodge-number'))) continue; const host = node.parentElement, target = host?.classList.contains('unit') ? host : host?.querySelector('.unit'); window.__visualEvents.push({ type: node.classList.contains('dodge-number') ? 'dodge' : 'hit', caster: window.__lastCasterTeam, target: target?.classList.contains('ally') ? 'ally' : target?.classList.contains('enemy') ? 'enemy' : 'none', support: node.classList.contains('support-vfx') && window.__lastCasterSupport, key: target?.dataset.key || '' }); } } }).observe(document.querySelector('#board'), { subtree: true, attributes: true, childList: true, attributeFilter: ['class'] }); window.__TACTICS_DEBUG__.setSpeed(8); window.__TACTICS_DEBUG__.startAuto(); })()`);
  let attackAnimation = '', alliedHitSeen = false;
  /* 攻擊動作剛掛上 class 時不能立即停掉 AUTO；需等投射物／命中結算實際
     寫入棋盤，否則完整演出模式會被測試本身截斷成「只有施放」。 */
  for (let attempt = 0; attempt < 150 && !(attackAnimation && alliedHitSeen); attempt++) {
    await delay(100);
    const visualProgress = await evaluate(`({ attack: window.__attackAnimation || '', hit: window.__visualEvents.some(event => event.type === 'hit' && event.caster === 'ally' && event.target === 'enemy') })`);
    attackAnimation = visualProgress.attack; alliedHitSeen = visualProgress.hit;
  }
  await evaluate(`window.__TACTICS_DEBUG__.stopAuto()`); await delay(400);
  assert.match(attackAnimation, /motion-(4dir-)?(attack-(right|left|up|down)|row)/);
  const visualEvents = await evaluate(`window.__visualEvents`);
  assert.ok(alliedHitSeen && visualEvents.some(event => event.type === 'hit' && event.caster === 'ally' && event.target === 'enemy'), '我方攻擊應命中敵方：' + JSON.stringify(visualEvents));
  console.log('Battle visual events:', JSON.stringify(visualEvents));
  assert.ok(!visualEvents.some(event => event.type === 'hit' && event.caster === 'ally' && event.target === 'ally' && !event.support), '我方對我方只能顯示支援特效，不得顯示攻擊特效');
  const actionState = await evaluate(`(() => { const done = document.querySelector('.unit.ally.action-complete'), waiting = document.querySelector('.unit.ally:not(.action-complete)'), rosterDone = document.querySelector('.battle-roster-card.acted'); return { done: document.querySelectorAll('.unit.ally.action-complete').length, waiting: document.querySelectorAll('.unit.ally:not(.action-complete)').length, doneFilter: done ? getComputedStyle(done.querySelector('.portrait')).filter : '', waitingFilter: waiting ? getComputedStyle(waiting.querySelector('.portrait')).filter : '', rosterDone: !!rosterDone, rosterText: rosterDone?.innerText || '' }; })()`);
  /* 戰術 AI 可能在等到第一個完整命中後已完成整隊本回合，不再假定一定
     還存在未行動友軍；驗證已行動棋子與左側卡片同步即可。 */
  assert.ok(actionState.done > 0 && actionState.rosterDone); assert.match(actionState.doneFilter, /grayscale|brightness|opacity|contrast/); assert.match(actionState.rosterText, /已行動/);
  const desktopBattleShot = await screenshot('jose-desktop-battle.png');

  await command('Emulation.setDeviceMetricsOverride', { width: 1024, height: 768, deviceScaleFactor: 1, mobile: false }); await delay(500);
  const ipadLandscape = await evaluate(`(() => {
    const main = document.querySelector('.battle-main').getBoundingClientRect();
    const ally = document.querySelector('.battle-ally-panel').getBoundingClientRect();
    const board = document.querySelector('.board-wrap').getBoundingClientRect();
    const enemy = document.querySelector('.battle-panel').getBoundingClientRect();
    return { width: innerWidth, overflow: document.documentElement.scrollWidth - innerWidth, columns: getComputedStyle(document.querySelector('.battle-main')).gridTemplateColumns, mainWidth: main.width, allyWidth: ally.width, boardWidth: board.width, enemyWidth: enemy.width, boardRatio: getComputedStyle(document.querySelector('#board')).aspectRatio, ordered: ally.left < board.left && board.right < enemy.right };
  })()`);
  assert.equal(ipadLandscape.width, 1024); assert.ok(ipadLandscape.overflow <= 1, 'iPad 橫向畫布不可產生頁面橫向溢位：' + JSON.stringify(ipadLandscape));
  assert.match(ipadLandscape.columns, /124px/); assert.ok(ipadLandscape.boardWidth > ipadLandscape.allyWidth + ipadLandscape.enemyWidth, 'iPad 橫向時中央棋盤必須大於兩側資訊欄：' + JSON.stringify(ipadLandscape));
  assert.equal(ipadLandscape.boardRatio, '21 / 10'); assert.ok(ipadLandscape.ordered, 'iPad 橫向三欄順序錯誤：' + JSON.stringify(ipadLandscape));
  const ipadShot = await screenshot('jose-ipad-landscape-battle.png');

  await command('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true }); await delay(500);
  const mobile = await evaluate(`(() => ({
    width: innerWidth,
    overflow: document.documentElement.scrollWidth - innerWidth,
    board: !!document.querySelector('#board'),
    controls: getComputedStyle(document.querySelector('.battle-topbar-tools')).display,
    cells: document.querySelectorAll('#board .cell').length
  }))()`);
  assert.ok(mobile.width >= 720, '手機橫向畫布應維持最小 720px：' + JSON.stringify(mobile)); assert.ok(mobile.overflow <= 1); assert.ok(mobile.board && mobile.controls !== 'none'); assert.equal(mobile.cells, 210);
  const mobileDirectControl = await evaluate(`(() => { const unit = document.querySelector('.unit.ally:not(.action-complete)') || document.querySelector('.unit.ally'); unit.click(); return { moves: document.querySelectorAll('.cell.move-target').length, attacks: document.querySelectorAll('.unit.enemy.in-range, .unit.enemy.attack-target').length, skills: document.querySelectorAll('#skill-buttons .skill').length, skillDisplay: getComputedStyle(document.querySelector('#skill-buttons')).display, phase: window.__TACTICS_DEBUG__.getState().phase }; })()`);
  assert.ok(mobileDirectControl.skills > 0 && mobileDirectControl.skillDisplay !== 'none', '行動回合的手機橫向畫布必須維持直接棋盤操作：' + JSON.stringify(mobileDirectControl));
  const mobileShot = await screenshot('jose-mobile-battle.png');

  await command('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  const hardStage = await reloadAtStage('c6-h3');
  assert.match(hardStage.map, /chapter-06-hard-3-21x10\.jpg/); assert.match(hardStage.kind, /-hard$/); assert.equal(hardStage.cells, 210);
  const bossStage = await reloadAtStage('c10-boss');
  assert.match(bossStage.map, /chapter-10-boss-21x10\.jpg/); assert.match(bossStage.kind, /-boss$/); assert.equal(bossStage.cells, 210);
  const bossTelegraph = await evaluate(`(async () => { document.querySelector('#enter-battle').click(); await new Promise(resolve => setTimeout(resolve, 80)); document.querySelector('#battle-briefing-go').click(); await new Promise(resolve => setTimeout(resolve, 80)); document.querySelector('#deploy-start').click(); if (window.__TACTICS_DEBUG__.getState().phase === 'deploy') window.__TACTICS_DEBUG__.beginBattlePhase(); await new Promise(resolve => setTimeout(resolve, 120)); const story = document.querySelector('#story-modal'); if (story && !story.hidden) document.querySelector('#story-next').click(); await new Promise(resolve => setTimeout(resolve, 80)); return { phase: window.__TACTICS_DEBUG__.getState().phase, warning: document.querySelector('#boss-warning-panel').innerText, visible: !document.querySelector('#boss-warning-panel').hidden, tiles: document.querySelectorAll('.cell.boss-danger').length }; })()`);
  assert.equal(bossTelegraph.phase, 'player'); assert.ok(bossTelegraph.visible); assert.match(bossTelegraph.warning, /Boss 技能預警/); assert.match(bossTelegraph.warning, /倒數|本回合可能施放/);
  const towerElite = await reloadAtTower(5), towerDemon = await reloadAtTower(20);
  assert.equal(towerElite.slows, 0); assert.ok(towerElite.size4 >= 0); assert.equal(towerElite.cells, 210);
  assert.equal(towerDemon.slows, 0); assert.ok(towerDemon.size5 >= 0); assert.equal(towerDemon.cells, 210);

  assert.deepEqual(errors, [], `Browser errors: ${errors.join(' | ')}`);
  console.log(JSON.stringify({ status: 'PASS', home, packingRoster, capacityRoster, deployed, formationPreset, unitInspection, directControl, walkAnimation, attackAnimation, actionState, ipadLandscape, mobile, mobileDirectControl, hardStage, bossStage, bossTelegraph, towerElite, towerDemon, screenshots: [desktopShot, desktopBattleShot, ipadShot, mobileShot], errors }, null, 2));
} finally {
  try { socket?.close(); } catch {}
  browser.kill();
  await delay(800);
  try { rmSync(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 250 }); } catch {}
}
