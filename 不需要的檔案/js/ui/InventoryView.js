var InventoryView = (function () {
  var detailUUID = null;
  var useItemForPet = null;
  var selectedPets = [];  // 批量選擇的寵物
  var selectMode = false;  // 是否處於選擇模式
  var filterQuality = 'all';  // 品質篩選
  var filterFavorite = false;  // 只顯示最愛
  var sortBy = 'level';  // 排序方式：level, quality, star, favorite

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

      // 篩選寵物
      var filteredPets = state.inventory.filter(function(p) {
        var stats = PetSystem.getStats(p);
        if (filterQuality !== 'all' && stats.quality !== filterQuality) return false;
        if (filterFavorite && !p.isFavorite) return false;
        return true;
      });

      // 排序寵物
      filteredPets.sort(function(a, b) {
        if (sortBy === 'favorite') {
          if (a.isFavorite && !b.isFavorite) return -1;
          if (!a.isFavorite && b.isFavorite) return 1;
        }
        if (sortBy === 'level') return b.level - a.level;
        if (sortBy === 'star') return b.stars - a.stars;
        if (sortBy === 'quality') {
          var qOrder = {mythical: 6, legendary: 5, epic: 4, elite: 3, rare: 2, normal: 1};
          var aStats = PetSystem.getStats(a);
          var bStats = PetSystem.getStats(b);
          return qOrder[bStats.quality] - qOrder[aStats.quality];
        }
        return 0;
      });

      // 可一鍵合成數量
      var autoSynthCount = this.getAutoSynthCount();

      var html =
        '<div class="inv-header">' +
          '<div class="inv-title">背包 <span class="inv-count">' + state.inventory.length + ' / ' + state.maxInventory + '</span></div>' +
          '<div class="inv-items">' + (itemSummary || '<span style="color:#666">無道具</span>') + '</div>' +
        '</div>' +

        // 工具列
        '<div class="inv-toolbar">' +
          // 篩選排序
          '<div class="inv-filters">' +
            '<select class="filter-select" onchange="InventoryView.setFilterQuality(this.value)">' +
              '<option value="all">全部品質</option>' +
              '<option value="normal">普通</option>' +
              '<option value="rare">稀有</option>' +
              '<option value="elite">菁英</option>' +
              '<option value="epic">史詩</option>' +
              '<option value="legendary">傳說</option>' +
              '<option value="mythical">神話</option>' +
            '</select>' +
            '<select class="filter-select" onchange="InventoryView.setSortBy(this.value)">' +
              '<option value="level">等級排序</option>' +
              '<option value="quality">品質排序</option>' +
              '<option value="star">星級排序</option>' +
              '<option value="favorite">最愛優先</option>' +
            '</select>' +
            '<button class="btn-filter ' + (filterFavorite ? 'active' : '') + '" onclick="InventoryView.toggleFavoriteFilter()">' +
              '⭐ 只顯示最愛' +
            '</button>' +
          '</div>' +

          // 批量操作
          '<div class="inv-actions">' +
            '<button class="btn-action" onclick="InventoryView.toggleSelectMode()">' +
              (selectMode ? '✓ 完成選擇' : '☑ 批量選擇') +
            '</button>' +
            (selectMode ?
              '<button class="btn-action btn-danger" onclick="InventoryView.batchRelease()" ' +
              (selectedPets.length === 0 ? 'disabled' : '') + '>' +
                '🗑️ 放生選中(' + selectedPets.length + ')' +
              '</button>'
            : '') +
            '<button class="btn-action btn-primary" onclick="InventoryView.autoSynth()" ' +
            (autoSynthCount === 0 ? 'disabled' : '') + '>' +
              '✨ 一鍵合成(' + autoSynthCount + ')' +
            '</button>' +
          '</div>' +
        '</div>' +

        '<div class="pet-grid">';

      filteredPets.forEach(function (p) {
        var stats    = PetSystem.getStats(p);
        var qColor   = PetSystem.getQualityColor(stats.quality);
        var activeTag = p.isActive ? '<div class="active-tag">上陣 ' + (p.activeSlot + 1) + '</div>' : '';
        var starTag   = (p.stars < 5 && PetSystem.canStarUp(p))
                          ? '<div class="synth-tag">★ 可升星</div>' : '';
        var favoriteTag = p.isFavorite ? '<div class="favorite-tag">⭐</div>' : '';
        var isSelected = selectedPets.indexOf(p.uuid) !== -1;
        var selectedClass = isSelected ? ' pet-selected' : '';

        html +=
          '<div class="pet-card' + selectedClass + '" onclick="InventoryView.' +
          (selectMode ? 'toggleSelect' : 'openDetail') + '(\'' + p.uuid + '\')">' +
            (selectMode ? '<div class="select-checkbox">' + (isSelected ? '✓' : '') + '</div>' : '') +
            activeTag +
            starTag +
            favoriteTag +
            '<div class="pc-icon">' + stats.icon + '</div>' +
            '<div class="pc-name" style="color:' + qColor + '">' + stats.name + '</div>' +
            '<div class="pc-quality" style="color:' + qColor + '">' + PetSystem.getQualityLabel(stats.quality) + '</div>' +
            '<div class="pc-lv">Lv.' + p.level + ' ' + '★'.repeat(p.stars) + '</div>' +
          '</div>';
      });

      html += '</div>';
      el.innerHTML = html;

      // 恢復篩選狀態
      var qualitySelect = el.querySelector('.filter-select');
      if (qualitySelect) qualitySelect.value = filterQuality;
      var sortSelect = el.querySelectorAll('.filter-select')[1];
      if (sortSelect) sortSelect.value = sortBy;

      if (detailUUID && !selectMode) this.openDetail(detailUUID);
    },

    setFilterQuality: function(quality) {
      filterQuality = quality;
      this.render();
    },

    setSortBy: function(sort) {
      sortBy = sort;
      this.render();
    },

    toggleFavoriteFilter: function() {
      filterFavorite = !filterFavorite;
      this.render();
    },

    toggleSelectMode: function() {
      selectMode = !selectMode;
      selectedPets = [];
      this.closeDetail();
      this.render();
    },

    toggleSelect: function(uuid) {
      var idx = selectedPets.indexOf(uuid);
      if (idx === -1) {
        selectedPets.push(uuid);
      } else {
        selectedPets.splice(idx, 1);
      }
      this.render();
    },

    batchRelease: function() {
      if (selectedPets.length === 0) return;

      var state = GameState.get();
      var canRelease = [];
      var cannotRelease = [];

      selectedPets.forEach(function(uuid) {
        var p = state.inventory.find(function(x) { return x.uuid === uuid; });
        if (p) {
          if (p.isActive) {
            cannotRelease.push(p);
          } else {
            canRelease.push(p);
          }
        }
      });

      if (cannotRelease.length > 0) {
        showToast('有 ' + cannotRelease.length + ' 隻寵物正在上陣，無法放生');
        return;
      }

      if (!confirm('確定要放生 ' + canRelease.length + ' 隻寵物嗎？')) return;

      canRelease.forEach(function(p) {
        GameState.removePetFromInventory(p.uuid);
      });

      selectedPets = [];
      selectMode = false;
      showToast('已放生 ' + canRelease.length + ' 隻寵物');
      this.render();
    },

    getAutoSynthCount: function() {
      var state = GameState.get();
      var count = 0;
      state.inventory.forEach(function(p) {
        if (p.stars < 5 && PetSystem.canStarUp(p)) {
          count++;
        }
      });
      return count;
    },

    autoSynth: function() {
      var state = GameState.get();
      var synthesized = 0;
      var pets = state.inventory.slice(); // 複製陣列避免修改問題

      pets.forEach(function(p) {
        if (p.stars < 5 && PetSystem.canStarUp(p)) {
          if (PetSystem.starUp(p)) {
            synthesized++;
          }
        }
      });

      if (synthesized > 0) {
        showToast('一鍵合成完成！成功升星 ' + synthesized + ' 隻寵物');
        this.render();
      } else {
        showToast('沒有可升星的寵物');
      }
    },

    toggleFavorite: function(uuid) {
      var state = GameState.get();
      var p = state.inventory.find(function(x) { return x.uuid === uuid; });
      if (!p) return;

      p.isFavorite = !p.isFavorite;
      GameState.save();
      showToast(p.isFavorite ? '已加入最愛 ⭐' : '已取消最愛');
      this.openDetail(uuid);
      this.render();
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
      var expPct = p.level >= 200 ? 100 : Math.floor(p.exp / needed * 100);

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
              '<button class="btn-favorite ' + (p.isFavorite ? 'active' : '') + '" onclick="InventoryView.toggleFavorite(\'' + uuid + '\')">' +
                (p.isFavorite ? '⭐ 已收藏' : '☆ 加入最愛') +
              '</button>' +
            '</div>' +
            '<div class="pd-stats">' +
              '<div class="stat-row"><span>等級</span><span>Lv.' + p.level + ' / 200</span></div>' +
              '<div class="stat-row"><span>經驗</span><span>' + p.exp + ' / ' + (p.level >= 200 ? 'MAX' : needed) + '</span></div>' +
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
