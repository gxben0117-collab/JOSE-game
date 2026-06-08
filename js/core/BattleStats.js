// 戰鬥統計系統
var BattleStats = (function () {
  var currentStats = null;

  return {
    // 初始化統計
    init: function () {
      currentStats = {
        totalDamageDealt: 0,
        totalDamageTaken: 0,
        killCount: 0,
        roundCount: 0,
        skillsUsed: 0,
        startTime: Date.now()
      };
    },

    // 記錄傷害輸出
    recordDamageDealt: function (damage) {
      if (currentStats) {
        currentStats.totalDamageDealt += damage;
      }
    },

    // 記錄受到傷害
    recordDamageTaken: function (damage) {
      if (currentStats) {
        currentStats.totalDamageTaken += damage;
      }
    },

    // 記錄擊殺
    recordKill: function () {
      if (currentStats) {
        currentStats.killCount++;
      }
    },

    // 記錄技能使用
    recordSkillUsed: function () {
      if (currentStats) {
        currentStats.skillsUsed++;
      }
    },

    // 記錄回合數
    setRoundCount: function (round) {
      if (currentStats) {
        currentStats.roundCount = round;
      }
    },

    // 獲取統計
    get: function () {
      if (!currentStats) return null;

      var duration = Math.floor((Date.now() - currentStats.startTime) / 1000);
      return {
        totalDamageDealt: currentStats.totalDamageDealt,
        totalDamageTaken: currentStats.totalDamageTaken,
        killCount: currentStats.killCount,
        roundCount: currentStats.roundCount,
        skillsUsed: currentStats.skillsUsed,
        duration: duration,
        dps: duration > 0 ? Math.floor(currentStats.totalDamageDealt / duration) : 0
      };
    },

    // 清除統計
    clear: function () {
      currentStats = null;
    },

    // 生成統計報告 HTML
    generateReport: function () {
      var stats = this.get();
      if (!stats) return '';

      return '<div class="battle-stats-report">' +
        '<div class="stats-title">⚔️ 戰鬥統計</div>' +
        '<div class="stats-grid">' +
          '<div class="stat-item">' +
            '<div class="stat-label">總傷害</div>' +
            '<div class="stat-value">' + stats.totalDamageDealt.toLocaleString() + '</div>' +
          '</div>' +
          '<div class="stat-item">' +
            '<div class="stat-label">受到傷害</div>' +
            '<div class="stat-value">' + stats.totalDamageTaken.toLocaleString() + '</div>' +
          '</div>' +
          '<div class="stat-item">' +
            '<div class="stat-label">擊殺數</div>' +
            '<div class="stat-value">' + stats.killCount + '</div>' +
          '</div>' +
          '<div class="stat-item">' +
            '<div class="stat-label">回合數</div>' +
            '<div class="stat-value">' + stats.roundCount + '</div>' +
          '</div>' +
          '<div class="stat-item">' +
            '<div class="stat-label">技能使用</div>' +
            '<div class="stat-value">' + stats.skillsUsed + '</div>' +
          '</div>' +
          '<div class="stat-item">' +
            '<div class="stat-label">DPS</div>' +
            '<div class="stat-value">' + stats.dps.toLocaleString() + '</div>' +
          '</div>' +
          '<div class="stat-item">' +
            '<div class="stat-label">用時</div>' +
            '<div class="stat-value">' + stats.duration + 's</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    }
  };
})();
