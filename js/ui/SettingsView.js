var SettingsView = (function () {
  return {
    render: function () {
      var state = GameState.get();
      var expNeeded = GameState.getPlayerExpNeeded();
      var expPercent = expNeeded > 0 ? Math.floor((state.playerExp / expNeeded) * 100) : 100;

      var el = document.getElementById('screen-settings');
      el.innerHTML =
        '<div class="settings-header">' +
          '<div class="settings-title">⚙️ 設置</div>' +
        '</div>' +
        '<div class="settings-content">' +
          '<div class="settings-section">' +
            '<div class="settings-section-title">召喚師資訊</div>' +
            '<div class="player-info">' +
              '<div class="pi-row"><span class="pi-label">等級：</span><span class="pi-value">Lv.' + state.playerLevel + '</span></div>' +
              '<div class="pi-row"><span class="pi-label">經驗：</span><span class="pi-value">' + state.playerExp + ' / ' + expNeeded + ' (' + expPercent + '%)</span></div>' +
              '<div class="pi-row"><span class="pi-label">AP 上限：</span><span class="pi-value">' + state.maxAp + '</span></div>' +
              '<div class="pi-row"><span class="pi-label">當前關卡：</span><span class="pi-value">第 ' + state.currentStage + ' 關</span></div>' +
              '<div class="pi-row"><span class="pi-label">最高關卡：</span><span class="pi-value">第 ' + state.maxStage + ' 關</span></div>' +
            '</div>' +
          '</div>' +
          '<div class="settings-section">' +
            '<div class="settings-section-title">存檔管理</div>' +
            '<button class="btn-primary btn-full" onclick="SettingsView.exportSave()">💾 匯出存檔</button>' +
            '<button class="btn-primary btn-full" onclick="SettingsView.importSave()">📂 匯入存檔</button>' +
            '<input type="file" id="file-input" style="display:none" accept=".json" onchange="SettingsView.handleFileSelect(event)">' +
          '</div>' +
          '<div class="settings-section">' +
            '<div class="settings-section-title">遊戲數據</div>' +
            '<button class="btn-danger btn-full" onclick="SettingsView.confirmReset()">🔄 重新開局</button>' +
          '</div>' +
          '<div class="settings-section">' +
            '<div class="settings-info">版本: v1.1</div>' +
            '<div class="settings-info">JOSE 寵物闖關 RPG</div>' +
          '</div>' +
        '</div>';
    },

    exportSave: function () {
      try {
        var state = GameState.get();
        var saveData = JSON.stringify(state, null, 2);
        var blob = new Blob([saveData], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        var timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        a.href = url;
        a.download = 'jose-save-' + timestamp + '.json';
        a.click();
        URL.revokeObjectURL(url);
        showToast('存檔已匯出！');
      } catch (e) {
        showToast('匯出失敗：' + e.message);
      }
    },

    importSave: function () {
      document.getElementById('file-input').click();
    },

    handleFileSelect: function (event) {
      var file = event.target.files[0];
      if (!file) return;

      var reader = new FileReader();
      reader.onload = function (e) {
        try {
          var saveData = JSON.parse(e.target.result);
          // 簡單驗證
          if (!saveData.gold || !saveData.inventory) {
            showToast('無效的存檔格式！');
            return;
          }
          localStorage.setItem('joseRPG_v1', JSON.stringify(saveData));
          showToast('存檔已載入！刷新頁面生效...');
          setTimeout(function () { location.reload(); }, 1500);
        } catch (err) {
          showToast('讀取存檔失敗：' + err.message);
        }
      };
      reader.readAsText(file);
      event.target.value = '';
    },

    confirmReset: function () {
      if (confirm('確定要重新開局嗎？所有進度將被清除！')) {
        GameState.reset();
        showToast('重新開局成功！刷新頁面中...');
        setTimeout(function () { location.reload(); }, 1000);
      }
    }
  };
})();
