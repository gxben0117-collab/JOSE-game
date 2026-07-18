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
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.text || 'Browser evaluation failed');
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
  assert.ok(home.text > 500 && home.homeVisible); assert.match(home.eyebrow, /10 × 21/); assert.equal(home.cells, 210); assert.match(home.map, /chapter-01-field-21x10\.jpg/); assert.ok(home.overflow <= 1);
  const desktopShot = await screenshot('jose-desktop-home.png');

  const packingLoaded = waitEvent('Page.loadEventFired');
  await evaluate(`(() => { const key = 'jose-tactics-progression-v2'; const save = JSON.parse(localStorage.getItem(key)); const large = TACTICAL_PET_DATA.filter(pet => pet.size === 2).slice(0, 6).map(pet => pet.id); const small = TACTICAL_PET_DATA.find(pet => pet.size === 1).id; [...large, small].forEach(id => { save.owned[id] = true; }); save.party = [...large, small]; localStorage.setItem(key, JSON.stringify(save)); location.reload(); })()`);
  await packingLoaded; await delay(700);
  const packingRoster = await evaluate(`(() => ({ allies: document.querySelectorAll('#board .unit.ally').length, large: document.querySelectorAll('#board .unit.ally.size-2').length, small: document.querySelectorAll('#board .unit.ally.size-1').length, covered: document.querySelectorAll('#board .cell.covered').length, anchorColumns: [...document.querySelectorAll('#board .unit.ally')].map(unit => [...document.querySelectorAll('#board .cell')].indexOf(unit.parentElement) % 21) }))()`);
  assert.equal(packingRoster.allies, 7); assert.equal(packingRoster.large, 6); assert.equal(packingRoster.small, 1); assert.equal(packingRoster.covered, 18); assert.ok(packingRoster.anchorColumns.every(column => column >= 0 && column <= 2));

  const capacityLoaded = waitEvent('Page.loadEventFired');
  await evaluate(`(() => { const key = 'jose-tactics-progression-v2'; const save = JSON.parse(localStorage.getItem(key)); const ids = TACTICAL_PET_DATA.filter(pet => pet.size === 1).slice(0, 25).map(pet => pet.id); ids.forEach(id => { save.owned[id] = true; }); save.party = ids; save.evolution.molten_ball = 3; localStorage.setItem(key, JSON.stringify(save)); location.reload(); })()`);
  await capacityLoaded; await delay(700);
  const capacityRoster = await evaluate(`(() => { document.querySelector('#hub-party').click(); const search = document.querySelector('#deploy-search'); search.value = '熔球'; search.dispatchEvent(new Event('input')); const filtered = document.querySelectorAll('#deploy-grid .deploy-card').length; search.value = ''; search.dispatchEvent(new Event('input')); const result = { help: document.querySelector('#deploy-help').textContent, selected: document.querySelectorAll('#deploy-grid .deploy-card.selected').length, filtered, budget: document.querySelector('#deploy-budget-label').textContent }; document.querySelector('#close-deploy').click(); return result; })()`);
  assert.equal(capacityRoster.selected, 25); assert.match(capacityRoster.help, /出陣單位 25 \/ 25/);
  assert.equal(capacityRoster.filtered, 1); assert.match(capacityRoster.budget, /25 \/ 25/);

  const dexUi = await evaluate(`(() => { document.querySelector('#open-dex').click(); const search = document.querySelector('#dex-search'); search.value = '基本攻擊'; search.dispatchEvent(new Event('input')); const result = { cards: document.querySelectorAll('#dex-grid .dex-card').length, detail: document.querySelector('#dex-detail').innerText, layout: getComputedStyle(document.querySelector('.dex-layout')).display }; document.querySelector('[data-close="dex-modal"]').click(); return result; })()`);
  assert.ok(dexUi.cards > 0); assert.match(dexUi.detail, /技能資料|尚未發現/); assert.equal(dexUi.layout, 'grid');

  await evaluate(`document.querySelector('#enter-battle').click()`); await delay(500);
  const deployed = await evaluate(`(() => ({
    battleVisible: !document.querySelector('#screen-battle').hidden,
    allies: document.querySelectorAll('.unit.ally').length,
    enemies: document.querySelectorAll('.unit.enemy').length,
    allyRight: !!document.querySelector('.unit.ally.facing-right'),
    enemyLeft: !!document.querySelector('.unit.enemy.facing-left'),
    motion: getComputedStyle(document.querySelector('.unit.ally .portrait')).backgroundImage,
    evolvedMotion: getComputedStyle(document.querySelector('.unit.ally[data-key$="-molten_ball"] .portrait')).backgroundImage,
    idleAnimation: getComputedStyle(document.querySelector('.unit.ally .portrait')).animationName,
    terrainToggle: document.querySelector('#terrain-toggle')?.textContent,
    terrainOpacity: getComputedStyle(document.querySelector('.terrain-hint')).opacity,
    fourDirectionAllies: document.querySelectorAll('.unit.ally.motion-4dir').length,
    fourDirectionEnemies: document.querySelectorAll('.unit.enemy.motion-4dir').length,
    fourDirectionSheetSize: getComputedStyle(document.querySelector('.unit.ally.motion-4dir .portrait')).backgroundSize,
    deployToolbar: !document.querySelector('#deploy-toolbar').hidden,
    balance: window.__TACTICS_DEBUG__.getState().balanceLabel,
    partyCost: window.__TACTICS_DEBUG__.getState().partyCost,
    deployStatus: document.querySelector('#deploy-status').textContent,
    allyAnchorColumns: [...document.querySelectorAll('#board .unit.ally')].map(unit => [...document.querySelectorAll('#board .cell')].indexOf(unit.parentElement) % 21)
  }))()`);
  assert.ok(deployed.battleVisible && deployed.allies === 25 && deployed.enemies >= 25);
  assert.ok(deployed.deployToolbar); assert.equal(deployed.balance, '滿編迎擊'); assert.equal(deployed.partyCost, 25);
  assert.match(deployed.deployStatus, /3×10/); assert.ok(deployed.allyAnchorColumns.every(column => column >= 0 && column <= 2));
  assert.equal(deployed.fourDirectionAllies, deployed.allies); assert.equal(deployed.fourDirectionEnemies, deployed.enemies); assert.equal(deployed.fourDirectionSheetSize, '600% 1200%'); assert.ok(deployed.allyRight && deployed.enemyLeft); assert.match(deployed.motion, /motion-4dir-sheet\.webp/); assert.match(deployed.evolvedMotion, /molten_ball-stage_3-motion-4dir-sheet\.webp/); assert.match(deployed.idleAnimation, /motion-4dir-idle-right/);
  assert.match(deployed.terrainToggle, /自動/); assert.equal(deployed.terrainOpacity, '0.25');
  const unitInspection = await evaluate(`(async () => { const enemy = document.querySelector('.unit.enemy'); enemy.click(); await new Promise(resolve => setTimeout(resolve, 80)); const enemyResult = { highlighted: !!document.querySelector('.unit.enemy.inspected'), tags: document.querySelectorAll('#unit-detail .detail-tags span').length, skills: document.querySelectorAll('#unit-detail .detail-skill-list li').length, text: document.querySelector('#unit-detail').innerText.length }; const ally = document.querySelector('.unit.ally'); ally.click(); await new Promise(resolve => setTimeout(resolve, 80)); return { enemy: enemyResult, allyHighlighted: !!document.querySelector('.unit.ally.inspected'), allyActions: document.querySelectorAll('#skill-buttons .skill').length, minimap: !!document.querySelector('#minimap') }; })()`);
  assert.ok(unitInspection.enemy.highlighted && unitInspection.enemy.tags >= 3 && unitInspection.enemy.skills > 0 && unitInspection.enemy.text > 80); assert.ok(unitInspection.allyHighlighted && unitInspection.allyActions > 0); assert.equal(unitInspection.minimap, false);
  const terrainToggle = await evaluate(`(async () => { const button = document.querySelector('#terrain-toggle'); button.click(); await new Promise(resolve => setTimeout(resolve, 180)); const result = { pressed: button.getAttribute('aria-pressed'), all: document.querySelector('#board').classList.contains('show-terrain'), stored: localStorage.getItem('jose-terrain-visibility'), opacity: getComputedStyle(document.querySelector('.terrain-hint')).opacity }; button.click(); return result; })()`);
  assert.deepEqual(terrainToggle, { pressed: 'true', all: true, stored: 'all', opacity: '0.9' });
  await evaluate(`document.querySelector('#end-turn').click()`); await delay(300);
  const moved = await evaluate(`(() => { const count = document.querySelectorAll('.unit.ally').length; for (let index = 0; index < count; index++) { const ally = document.querySelectorAll('.unit.ally')[index]; ally.click(); const target = document.querySelector('.cell.move-target'); if (target) { target.click(); return true; } } return false; })()`);
  assert.ok(moved); await delay(60);
  const walkAnimation = await evaluate(`(() => { const portrait = document.querySelector('.unit.ally.walking .portrait'); return portrait ? getComputedStyle(portrait).animationName : ''; })()`);
  assert.match(walkAnimation, /motion-(4dir-)?walk-(right|left|up|down)/); await delay(840);
  await evaluate(`(() => { window.__attackAnimation = ''; new MutationObserver(records => { for (const record of records) { const unit = record.target; if (unit.classList?.contains('unit') && unit.classList.contains('cast')) { const portrait = unit.querySelector('.portrait'); window.__attackAnimation = portrait ? getComputedStyle(portrait).animationName : ''; } } }).observe(document.querySelector('#board'), { subtree: true, attributes: true, attributeFilter: ['class'] }); window.__TACTICS_DEBUG__.setSpeed(8); window.__TACTICS_DEBUG__.startAuto(); })()`);
  let attackAnimation = '';
  for (let attempt = 0; attempt < 100 && !attackAnimation; attempt++) { await delay(100); attackAnimation = await evaluate(`window.__attackAnimation || ''`); }
  await evaluate(`window.__TACTICS_DEBUG__.stopAuto()`); await delay(400);
  assert.match(attackAnimation, /motion-(4dir-)?attack-(right|left|up|down)/);
  const desktopBattleShot = await screenshot('jose-desktop-battle.png');

  await command('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true }); await delay(500);
  const mobile = await evaluate(`(() => ({
    width: innerWidth,
    overflow: document.documentElement.scrollWidth - innerWidth,
    board: !!document.querySelector('#board'),
    controls: getComputedStyle(document.querySelector('.battle-controls')).display,
    cells: document.querySelectorAll('#board .cell').length
  }))()`);
  assert.ok(mobile.width >= 390 && mobile.width <= 420); assert.ok(mobile.overflow <= 1); assert.ok(mobile.board && mobile.controls !== 'none'); assert.equal(mobile.cells, 210);
  const mobileShot = await screenshot('jose-mobile-battle.png');

  await command('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  const hardStage = await reloadAtStage('c6-h3');
  assert.match(hardStage.map, /chapter-06-hard-3-21x10\.jpg/); assert.match(hardStage.kind, /-hard$/); assert.equal(hardStage.cells, 210);
  const bossStage = await reloadAtStage('c10-boss');
  assert.match(bossStage.map, /chapter-10-boss-21x10\.jpg/); assert.match(bossStage.kind, /-boss$/); assert.equal(bossStage.cells, 210);

  assert.deepEqual(errors, [], `Browser errors: ${errors.join(' | ')}`);
  console.log(JSON.stringify({ status: 'PASS', home, packingRoster, capacityRoster, deployed, unitInspection, walkAnimation, attackAnimation, mobile, hardStage, bossStage, screenshots: [desktopShot, desktopBattleShot, mobileShot], errors }, null, 2));
} finally {
  try { socket?.close(); } catch {}
  browser.kill();
  await delay(800);
  try { rmSync(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 250 }); } catch {}
}
