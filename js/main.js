function updateHUD() {
  var state = GameState.get();
  var currentAp = GameState.getAP();
  var levelEl   = document.getElementById('hud-level');
  var goldEl    = document.getElementById('hud-gold');
  var diamondEl = document.getElementById('hud-diamond');
  var apEl      = document.getElementById('hud-ap');
  if (levelEl)   levelEl.textContent   = '👤 Lv.' + state.playerLevel;
  if (goldEl)    goldEl.textContent    = '💰 ' + state.gold.toLocaleString();
  if (diamondEl) diamondEl.textContent = '💎 ' + state.diamond.toLocaleString();
  if (apEl)      apEl.textContent      = '⚡ ' + currentAp + '/' + state.maxAp;
}

function showToast(msg, duration) {
  var existing = document.getElementById('toast');
  if (existing) existing.remove();
  var toast = document.createElement('div');
  toast.id = 'toast';
  toast.className = 'toast';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(function () { toast.classList.add('show'); }, 10);
  setTimeout(function () {
    toast.classList.remove('show');
    setTimeout(function () { if (toast.parentNode) toast.remove(); }, 300);
  }, duration || 2000);
}

function showOfflineIncome(income) {
  if (!income) return;
  var modal = document.createElement('div');
  modal.className = 'offline-modal';
  modal.innerHTML =
    '<div class="offline-box">' +
      '<div class="offline-title">⏰ 離線收益</div>' +
      '<div class="offline-time">你離開了約 ' + income.hours + ' 小時</div>' +
      '<div class="offline-rewards">' +
        '💰 金幣 +' + income.gold.toLocaleString() + '<br>' +
        '⭐ 經驗 +' + income.exp.toLocaleString() +
      '</div>' +
      '<button class="btn-primary" onclick="this.parentElement.parentElement.remove()">領取</button>' +
    '</div>';
  document.body.appendChild(modal);
}

function checkDailyLogin() {
  var state = GameState.get();
  var today = new Date().toDateString();
  if (state.lastLoginDate === today) return;

  var streak = state.loginStreak || 0;
  if (state.lastLoginDate === new Date(Date.now() - 86400000).toDateString()) {
    streak++;
  } else {
    streak = 1;
  }
  state.loginStreak    = streak;
  state.lastLoginDate  = today;

  var rewards = { gold: 0, items: {} };
  var dayInCycle = ((streak - 1) % 7) + 1;
  if (dayInCycle === 1) rewards.gold = 500;
  if (dayInCycle === 2) { rewards.items.revival_potion = 5; }
  if (dayInCycle === 3) { rewards.items.gacha_ticket = 1; }
  if (dayInCycle === 7) rewards.diamond = 300;

  if (rewards.gold)    GameState.addGold(rewards.gold);
  if (rewards.diamond) GameState.addDiamond(rewards.diamond);
  Object.keys(rewards.items || {}).forEach(function (id) {
    GameState.addItem(id, rewards.items[id]);
  });
  GameState.save();

  var rewardText = [];
  if (rewards.gold)    rewardText.push('💰 金幣 +' + rewards.gold);
  if (rewards.diamond) rewardText.push('💎 鑽石 +' + rewards.diamond);
  Object.keys(rewards.items || {}).forEach(function (id) {
    if (ITEM_DATA[id]) rewardText.push(ITEM_DATA[id].icon + ' ' + ITEM_DATA[id].name + ' ×' + rewards.items[id]);
  });

  var modal = document.createElement('div');
  modal.className = 'offline-modal';
  modal.innerHTML =
    '<div class="offline-box">' +
      '<div class="offline-title">🎁 每日登入獎勵</div>' +
      '<div class="offline-time">第 ' + dayInCycle + ' 天（連續 ' + streak + ' 天）</div>' +
      '<div class="offline-rewards">' + rewardText.join('<br>') + '</div>' +
      '<button class="btn-primary" onclick="this.parentElement.parentElement.remove()">領取</button>' +
    '</div>';
  document.body.appendChild(modal);
}

window.addEventListener('DOMContentLoaded', function () {
  GameState.init();

  var income = OfflineSystem.calculate();
  OfflineSystem.apply(income);

  Navigation.init();
  updateHUD();

  checkDailyLogin();
  if (income) showOfflineIncome(income);

  BattleView.render();

  setInterval(function () { GameState.save(); }, 30000);
});
