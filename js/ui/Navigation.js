var Navigation = (function () {
  var current = 'battle';

  return {
    init: function () {
      document.querySelectorAll('.nav-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          Navigation.goTo(this.dataset.screen);
        });
      });
    },

    goTo: function (screenId) {
      current = screenId;
      document.querySelectorAll('.screen').forEach(function (s) {
        s.classList.remove('active');
      });
      var target = document.getElementById('screen-' + screenId);
      if (target) target.classList.add('active');

      document.querySelectorAll('.nav-btn').forEach(function (btn) {
        btn.classList.toggle('active', btn.dataset.screen === screenId);
      });

      if (screenId === 'battle')    BattleView.render();
      if (screenId === 'inventory') InventoryView.render();
      if (screenId === 'gacha')     GachaView.render();
      if (screenId === 'shop')      ShopView.render();
      if (screenId === 'settings')  SettingsView.render();
    },

    current: function () { return current; }
  };
})();
