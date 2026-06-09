var GachaView = (function () {

  function renderResult(results) {
    var html = '<div class="gacha-results">';
    results.forEach(function (r) {
      var tmpl   = PetSystem.getTemplate(r.instance.petId);
      var qColor = PetSystem.getQualityColor(tmpl.quality);
      var qLabel = PetSystem.getQualityLabel(tmpl.quality);
      html += '<div class="gacha-card" style="border-color:' + qColor + '">' +
                '<div class="gc-icon">' + tmpl.icon + '</div>' +
                '<div class="gc-name" style="color:' + qColor + '">' + tmpl.name + '</div>' +
                '<div class="gc-quality" style="color:' + qColor + '">' + qLabel + '</div>' +
                (!r.added ? '<div class="gc-full">背包已滿！</div>' : '') +
              '</div>';
    });
    html += '</div>';
    html += '<button class="btn-primary" onclick="GachaView.render()">繼續</button>';
    return html;
  }

  return {
    render: function () {
      var state = GameState.get();
      var pity  = GachaSystem.getPityInfo();
      var el    = document.getElementById('screen-gacha');

      el.innerHTML =
        '<div class="gacha-header">' +
          '<div class="gacha-title">✨ 寵物召喚</div>' +
          '<div class="gacha-pity">' +
            '<span>距史詩保底: ' + (pity.epicPityAt - pity.pullsSinceEpic) + ' 抽</span>' +
            '<span>距傳說保底: ' + (pity.legPityAt - pity.pullsSinceLegendary) + ' 抽</span>' +
          '</div>' +
        '</div>' +
        '<div class="gacha-rates">' +
          Object.entries(QUALITY_CONFIG).map(function (entry) {
            var k = entry[0]; var v = entry[1];
            var rates = { normal: 60, rare: 25, elite: 10, epic: 3.5, legendary: 1.3, mythical: 0.2 };
            return '<span style="color:' + v.color + '">' + v.label + ' ' + rates[k] + '%</span>';
          }).join(' &nbsp; ') +
        '</div>' +
        '<div class="gacha-banner">🌟 限時召喚池</div>' +
        '<div class="gacha-actions">' +
          '<button class="btn-gacha" onclick="GachaView.pull(1)">' +
            '<div>單抽 ×1</div>' +
            '<div class="gacha-cost">💎 100 &nbsp;或&nbsp; 🎫 1張</div>' +
            '<div class="gacha-own">擁有: 💎' + state.diamond + ' / 🎫' + (state.items.gacha_ticket || 0) + '</div>' +
          '</button>' +
          '<button class="btn-gacha btn-gacha-10" onclick="GachaView.pull(10)">' +
            '<div>十連抽 ×10</div>' +
            '<div class="gacha-cost">💎 900 &nbsp;或&nbsp; 🎫 10張</div>' +
            '<div class="gacha-cost-note">（省 100鑽）</div>' +
          '</button>' +
        '</div>' +
        '<div class="gacha-stats">累計抽獎: ' + pity.totalPulls + ' 次</div>' +
        '<div id="gacha-result-area"></div>';
    },

    pull: function (count) {
      var results = GachaSystem.pull(count);
      if (!results) {
        showToast('鑽石不足！');
        this.render();
        return;
      }

      var el = document.getElementById('screen-gacha');
      el.innerHTML =
        '<div class="gacha-pull-anim">✨ 召喚中... ✨</div>';

      setTimeout(function () {
        el.innerHTML = renderResult(results);
        updateHUD();
      }, 800);
    }
  };
})();
