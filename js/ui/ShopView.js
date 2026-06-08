var ShopView = (function () {
  var activeTab = 'gold';

  function goldShopHtml() {
    var state = GameState.get();
    var html  = '<div class="shop-items">';
    GOLD_SHOP.forEach(function (row, i) {
      var item = ITEM_DATA[row.itemId];
      html +=
        '<div class="shop-card">' +
          '<div class="sc-icon">' + item.icon + '</div>' +
          '<div class="sc-name">' + item.name + (row.count > 1 ? ' ×' + row.count : '') + '</div>' +
          '<div class="sc-desc">' + item.description + '</div>' +
          '<button class="btn-buy" onclick="ShopView.buyGold(' + i + ')">' +
            '💰 ' + row.goldPrice + ' 金幣' +
          '</button>' +
        '</div>';
    });
    html += '</div>';
    return html;
  }

  function diamondShopHtml() {
    var state = GameState.get();
    var currentAp = GameState.getAP();
    var html  = '<div class="shop-items">';
    DIAMOND_SHOP.forEach(function (row, i) {
      if (row.type === 'bag_expand') {
        html +=
          '<div class="shop-card">' +
            '<div class="sc-icon">🎒</div>' +
            '<div class="sc-name">' + row.label + '</div>' +
            '<div class="sc-desc">目前容量: ' + state.maxInventory + ' 格</div>' +
            '<button class="btn-buy btn-diamond" onclick="ShopView.buyDiamond(' + i + ')">' +
              '💎 ' + row.diamondPrice + ' 鑽石' +
            '</button>' +
          '</div>';
      } else if (row.type === 'ap_buy') {
        html +=
          '<div class="shop-card">' +
            '<div class="sc-icon">⚡</div>' +
            '<div class="sc-name">' + row.label + '</div>' +
            '<div class="sc-desc">目前 AP: ' + currentAp + ' / ' + state.maxAp + '</div>' +
            '<button class="btn-buy btn-diamond" onclick="ShopView.buyDiamond(' + i + ')">' +
              '💎 ' + row.diamondPrice + ' 鑽石' +
            '</button>' +
          '</div>';
      } else {
        var item = ITEM_DATA[row.itemId];
        html +=
          '<div class="shop-card">' +
            '<div class="sc-icon">' + item.icon + '</div>' +
            '<div class="sc-name">' + item.name + (row.count > 1 ? ' ×' + row.count : '') + '</div>' +
            '<div class="sc-desc">' + item.description + '</div>' +
            '<button class="btn-buy btn-diamond" onclick="ShopView.buyDiamond(' + i + ')">' +
              '💎 ' + row.diamondPrice + ' 鑽石' +
            '</button>' +
          '</div>';
      }
    });
    html += '</div>';
    return html;
  }

  return {
    render: function () {
      var el = document.getElementById('screen-shop');
      el.innerHTML =
        '<div class="shop-header"><div class="shop-title">🏪 商店</div></div>' +
        '<div class="shop-tabs">' +
          '<button class="tab-btn ' + (activeTab === 'gold' ? 'active' : '') + '" onclick="ShopView.setTab(\'gold\')">💰 金幣商店</button>' +
          '<button class="tab-btn ' + (activeTab === 'diamond' ? 'active' : '') + '" onclick="ShopView.setTab(\'diamond\')">💎 鑽石商店</button>' +
        '</div>' +
        '<div id="shop-content">' + (activeTab === 'gold' ? goldShopHtml() : diamondShopHtml()) + '</div>';
    },

    setTab: function (tab) {
      activeTab = tab;
      this.render();
    },

    buyGold: function (idx) {
      var row  = GOLD_SHOP[idx];
      var item = ITEM_DATA[row.itemId];
      if (!GameState.spendGold(row.goldPrice)) {
        showToast('金幣不足！');
        return;
      }
      GameState.addItem(row.itemId, row.count);
      showToast('購買成功！獲得 ' + item.name + ' ×' + row.count);
      updateHUD();
      this.render();
    },

    buyDiamond: function (idx) {
      var row = DIAMOND_SHOP[idx];
      if (row.type === 'bag_expand') {
        if (!GameState.spendDiamond(row.diamondPrice)) {
          showToast('鑽石不足！');
          return;
        }
        GameState.get().maxInventory += 10;
        GameState.save();
        showToast('背包已擴充 +10 格！');
      } else if (row.type === 'ap_buy') {
        if (!GameState.spendDiamond(row.diamondPrice)) {
          showToast('鑽石不足！');
          return;
        }
        GameState.addAP(50);
        showToast('AP +50！');
      } else {
        var item = ITEM_DATA[row.itemId];
        if (!GameState.spendDiamond(row.diamondPrice)) {
          showToast('鑽石不足！');
          return;
        }
        GameState.addItem(row.itemId, row.count);
        showToast('購買成功！獲得 ' + item.name + ' ×' + row.count);
      }
      updateHUD();
      this.render();
    }
  };
})();
