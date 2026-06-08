var InventoryView = (function () {
  var detailUUID = null;
  var useItemForPet = null;

  return {
    render: function () {
      var state = GameState.get();
      var el    = document.getElementById('screen-inventory');

      var itemSummary = '';
      Object.keys(state.items).forEach(function (id) {
        var cnt = state.items[id];
        if (cnt > 0 && ITEM_DATA[id]) {
          itemSummary += '<span class="item-chip">' + ITEM_DATA[id].icon + ' ' + ITEM_DATA[id].name + ' ×' + cnt + '</span>';
        }
      });

      var html =
        '<div class="inv-header">' +
          '<div class="inv-title">背包 <span class="inv-count">' + state.inventory.length + ' / ' + state.maxInventory + '</span></div>' +
          '<div class="inv-items">' + (itemSummary || '<span style="color:#666">無道具</span>') + '</div>' +
        '</div>' +
        '<div class="pet-grid">';

      state.inventory.forEach(function (p) {
        var stats    = PetSystem.getStats(p);
        var qColor   = PetSystem.getQualityColor(stats.quality);
        var activeTag = p.isActive ? '<div class="active-tag">上陣 ' + (p.activeSlot + 1) + '</div>' : '';
        var starTag   = (p.stars < 5 && PetSystem.canStarUp(p))
                          ? '<div class="synth-tag">★ 可升星</div>' : '';
        html +=
          '<div class="pet-card" onclick="InventoryView.openDetail(\'' + p.uuid + '\')">' +
            activeTag +
            starTag +
            '<div class="pc-icon">' + stats.icon + '</div>' +
            '<div class="pc-name" style="color:' + qColor + '">' + stats.name + '</div>' +
            '<div class="pc-quality" style="color:' + qColor + '">' + PetSystem.getQualityLabel(stats.quality) + '</div>' +
            '<div class="pc-lv">Lv.' + p.level + ' ' + '★'.repeat(p.stars) + '</div>' +
          '</div>';
      });

      html += '</div>';
      el.innerHTML = html;

      if (detailUUID) this.openDetail(detailUUID);
    },

    openDetail: function (uuid) {
      detailUUID = uuid;
      var state = GameState.get();
      var p     = state.inventory.find(function (x) { return x.uuid === uuid; });
      if (!p) { detailUUID = null; return; }

      var stats  = PetSystem.getStats(p);
      var qColor = PetSystem.getQualityColor(stats.quality);
      var elCfg  = ELEMENT_CONFIG[stats.element] || {};
      var needed = PetSystem.expForLevel(p.level);
      var expPct = p.level >= 100 ? 100 : Math.floor(p.exp / needed * 100);

      var skillsHtml = stats.skills.map(function (sk) {
        var tag = sk.type === 'basic' ? '普攻' : sk.type === 'active' ? '主動' : '被動';
        return '<div class="skill-row"><span class="skill-tag">' + tag + '</span>' +
               '<span class="skill-name">' + sk.name + '</span></div>';
      }).join('');

      var canStar = PetSystem.canStarUp(p);

      var itemButtons = '';
      ['exp_small','exp_medium','exp_large'].forEach(function (id) {
        var cnt = state.items[id] || 0;
        if (cnt > 0 && ITEM_DATA[id]) {
          itemButtons += '<button class="btn-sm btn-item" onclick="InventoryView.useItem(\'' + uuid + '\',\'' + id + '\')">' +
                         ITEM_DATA[id].icon + ' ' + ITEM_DATA[id].name + ' (' + cnt + ')</button>';
        }
      });

      var html =
        '<div class="modal-overlay" onclick="InventoryView.closeDetail(event)">' +
          '<div class="modal-box pet-detail" onclick="event.stopPropagation()">' +
            '<div class="pd-top">' +
              '<div class="pd-icon">' + stats.icon + '</div>' +
              '<div class="pd-info">' +
                '<div class="pd-name" style="color:' + qColor + '">' + stats.name + '</div>' +
                '<div class="pd-meta">' +
                  '<span style="color:' + qColor + '">' + PetSystem.getQualityLabel(stats.quality) + '</span> &nbsp;' +
                  (elCfg.icon || '') + ' ' + (elCfg.label || '') +
                '</div>' +
                '<div class="pd-stars">' + '★'.repeat(p.stars) + '☆'.repeat(5 - p.stars) + '</div>' +
              '</div>' +
            '</div>' +
            '<div class="pd-stats">' +
              '<div class="stat-row"><span>等級</span><span>Lv.' + p.level + ' / 100</span></div>' +
              '<div class="stat-row"><span>經驗</span><span>' + p.exp + ' / ' + (p.level >= 100 ? 'MAX' : needed) + '</span></div>' +
              '<div class="exp-bar-wrap"><div class="exp-bar" style="width:' + expPct + '%"></div></div>' +
              '<div class="stat-row"><span>❤️ 血量</span><span>' + stats.maxHp + '</span></div>' +
              '<div class="stat-row"><span>⚔️ 攻擊</span><span>' + stats.atk + '</span></div>' +
              '<div class="stat-row"><span>🛡️ 防禦</span><span>' + stats.def + '</span></div>' +
            '</div>' +
            '<div class="pd-skills"><div class="pd-section-title">技能</div>' + skillsHtml + '</div>' +
            '<div class="pd-actions">' +
              (itemButtons ? '<div class="pd-section-title">使用道具</div>' + itemButtons : '') +
              '<div class="pd-section-title">升星</div>' +
              '<button class="btn-primary btn-sm ' + (canStar ? '' : 'btn-disabled') + '" ' +
              (canStar ? 'onclick="InventoryView.starUp(\'' + uuid + '\')"' : '') + '>' +
              '★ 升星（需同名×3 或同品質×5）</button>' +
              '<div class="pd-section-title">其他</div>' +
              '<button class="btn-danger btn-sm" onclick="InventoryView.releasePet(\'' + uuid + '\')">放生</button>' +
            '</div>' +
            '<button class="btn-close" onclick="InventoryView.closeDetail()">✕</button>' +
          '</div>' +
        '</div>';

      var existing = document.getElementById('pet-detail-modal');
      if (existing) existing.remove();
      var div = document.createElement('div');
      div.id = 'pet-detail-modal';
      div.innerHTML = html;
      document.getElementById('screen-inventory').appendChild(div);
    },

    closeDetail: function (event) {
      if (event && event.target !== event.currentTarget) return;
      detailUUID = null;
      var el = document.getElementById('pet-detail-modal');
      if (el) el.remove();
    },

    useItem: function (uuid, itemId) {
      var state = GameState.get();
      var p = state.inventory.find(function (x) { return x.uuid === uuid; });
      if (!p) return;
      var leveled = PetSystem.useExpItem(p, itemId);
      showToast(ITEM_DATA[itemId].name + ' 使用成功！' + (leveled ? ' 等級提升！' : ''));
      this.openDetail(uuid);
      updateHUD();
    },

    starUp: function (uuid) {
      var state = GameState.get();
      var p = state.inventory.find(function (x) { return x.uuid === uuid; });
      if (!p) return;
      var ok = PetSystem.starUp(p);
      if (ok) {
        showToast('升星成功！★' + p.stars);
        this.render();
        detailUUID = uuid;
        this.openDetail(uuid);
      } else {
        showToast('材料不足，無法升星');
      }
    },

    releasePet: function (uuid) {
      var state = GameState.get();
      var p = state.inventory.find(function (x) { return x.uuid === uuid; });
      if (!p) return;
      if (p.isActive) { showToast('請先從隊伍中移除'); return; }
      var stats = PetSystem.getStats(p);
      if (!confirm('確定要放生 ' + stats.name + ' 嗎？')) return;
      GameState.removePetFromInventory(uuid);
      detailUUID = null;
      this.render();
      showToast(stats.name + ' 已放生');
    }
  };
})();
