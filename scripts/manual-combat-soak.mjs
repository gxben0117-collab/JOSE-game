/*
 * 手動戰鬥壓力測試：以瀏覽器真實 DOM 操作重複驗證
 * 選單位 → 藍格移動 → （可選）取消移動／選技能 → 待機。
 * 不使用 AUTO，也不直接修改戰鬥 state；每一次都是玩家實際可做的點擊流程。
 */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const runs = Number((process.argv.find(arg => arg.startsWith('--runs=')) || '--runs=100').slice(7));
if (!Number.isInteger(runs) || runs < 1 || runs > 200) throw new Error('--runs 必須是 1～200 的整數');
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const webPort = 4188, debugPort = 9342;
const profile = mkdtempSync(join(tmpdir(), 'jose-manual-soak-'));
const server = spawn('python', ['-m', 'http.server', String(webPort), '--bind', '127.0.0.1'], { cwd: new URL('..', import.meta.url), stdio: 'ignore', windowsHide: true });
const browser = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', `--remote-debugging-port=${debugPort}`, `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore', windowsHide: true });
const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
async function json(url, options) { for (let attempt = 0; attempt < 80; attempt++) { try { const response = await fetch(url, options); if (response.ok) return response.json(); } catch {} await delay(50); } throw new Error('Chrome DevTools 無法啟動'); }

let socket, serial = 0;
const pending = new Map(), events = [], errors = [];
function command(method, params = {}) { const id = ++serial; socket.send(JSON.stringify({ id, method, params })); return new Promise((resolve, reject) => pending.set(id, { resolve, reject })); }
function waitEvent(method, timeout = 10000) { return new Promise((resolve, reject) => { const started = Date.now(), timer = setInterval(() => { const index = events.findIndex(event => event.method === method); if (index >= 0) { clearInterval(timer); resolve(events.splice(index, 1)[0]); } else if (Date.now() - started > timeout) { clearInterval(timer); reject(new Error('等待瀏覽器事件逾時：' + method)); } }, 20); }); }
async function evaluate(expression) { const response = await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (response.exceptionDetails) throw new Error(response.exceptionDetails.exception?.description || response.exceptionDetails.text); return response.result.value; }

try {
  const target = await json(`http://127.0.0.1:${debugPort}/json/new?about:blank`, { method: 'PUT' });
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  socket.onmessage = event => { const message = JSON.parse(event.data); if (message.id && pending.has(message.id)) { const entry = pending.get(message.id); pending.delete(message.id); message.error ? entry.reject(new Error(message.error.message)) : entry.resolve(message.result || {}); return; } events.push(message); if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text || 'runtime exception'); if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') errors.push(message.params.entry.text || 'console error'); };
  await Promise.all(['Page.enable', 'Runtime.enable', 'Log.enable'].map(method => command(method)));
  await command('Emulation.setDeviceMetricsOverride', { width: 1366, height: 768, deviceScaleFactor: 1, mobile: false });
  const loaded = waitEvent('Page.loadEventFired'); await command('Page.navigate', { url: `http://127.0.0.1:${webPort}/tactics.html?manual-soak=1` }); await loaded; await delay(550);
  const reloaded = waitEvent('Page.loadEventFired'); await evaluate(`localStorage.clear(); location.reload()`); await reloaded; await delay(550);

  const totals = { moved: 0, undone: 0, skills: 0, waited: 0 };
  for (let run = 1; run <= runs; run++) {
    const result = await evaluate(`(async () => {
      const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
      window.__TACTICS_DEBUG__.reset('c1-1');
      if (!window.__TACTICS_DEBUG__.beginBattlePhase()) throw new Error('第 ${run} 場無法從部署進入手動戰鬥');
      await wait(25);
      let selected = '', target = null;
      for (const ally of document.querySelectorAll('.unit.ally')) {
        ally.click();
        const move = document.querySelector('.cell.move-target');
        if (move) { selected = ally.dataset.key; target = move; break; }
      }
      const panel = document.querySelector('#battle-command');
      const skillCount = document.querySelectorAll('#skill-buttons .skill').length;
      if (!selected || !target || !panel.hidden || skillCount < 1) throw new Error('第 ${run} 場選取後沒有可用直覺操作：' + JSON.stringify({ selected, target: !!target, panelHidden: panel.hidden, skillCount }));
      target.click(); await wait(150);
      const moved = document.querySelector('.unit.ally.active')?.dataset.key === selected && document.querySelector('#skill-buttons .unit-actions button')?.textContent.includes('待機');
      if (!moved) throw new Error('第 ${run} 場移動後未保留待機操作');
      let undone = false, skill = false;
      if (${run} % 3 === 0) {
        const undo = [...document.querySelectorAll('#skill-buttons .unit-actions button')].find(button => button.textContent.includes('取消移動'));
        if (!undo) throw new Error('第 ${run} 場移動後缺少取消移動');
        undo.click(); await wait(20); undone = true;
        const retry = document.querySelector('.cell.move-target'); if (!retry) throw new Error('第 ${run} 場取消移動後沒有恢復藍格'); retry.click(); await wait(150);
      }
      if (${run} % 4 === 0) {
        const skillButton = [...document.querySelectorAll('#skill-buttons .skill')].find(button => !button.classList.contains('basic-skill') && !button.disabled) || document.querySelector('#skill-buttons .skill');
        skillButton.click(); await wait(20); skill = skillButton.classList.contains('active') || document.querySelector('#skill-buttons .skill.active') !== null;
        if (!skill) throw new Error('第 ${run} 場技能選取未切換至目標模式');
      }
      const waitButton = [...document.querySelectorAll('#skill-buttons .unit-actions button')].find(button => button.textContent.includes('待機'));
      if (!waitButton) throw new Error('第 ${run} 場缺少待機按鈕');
      waitButton.click(); await wait(20);
      const state = window.__TACTICS_DEBUG__.getState();
      if (state.phase !== 'player' || state.animating || !document.querySelector('.unit.ally.action-complete')) throw new Error('第 ${run} 場待機後行動狀態異常');
      return { moved: 1, undone: undone ? 1 : 0, skill: skill ? 1 : 0, waited: 1 };
    })()`);
    totals.moved += result.moved; totals.undone += result.undone; totals.skills += result.skill; totals.waited += result.waited;
  }
  assert.deepEqual(errors, [], '瀏覽器錯誤：' + errors.join(' | '));
  assert.equal(totals.moved, runs); assert.equal(totals.waited, runs);
  console.log(JSON.stringify({ status: 'PASS', runs, totals, errors }, null, 2));
} finally {
  try { socket?.close(); } catch {}
  browser.kill(); server.kill(); await delay(300);
  try { rmSync(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 150 }); } catch {}
}
