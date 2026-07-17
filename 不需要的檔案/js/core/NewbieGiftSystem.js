/**
 * 新手禮包系統 - 開局送 3000 鑽石
 * 包含精美的彈窗動畫和領取特效
 */

const NewbieGiftSystem = {
  // 禮包配置
  config: {
    diamond: 3000,      // 鑽石數量
    gold: 10000,        // 額外金幣
    gachaTicket: 10,    // 抽獎券
    apPotion: 5         // 能量藥水
  },

  // 檢查是否已領取
  hasClaimedGift() {
    const state = GameState.get();
    return state.hasClaimedNewbieGift === true;
  },

  // 標記為已領取
  markAsClaimed() {
    const state = GameState.get();
    state.hasClaimedNewbieGift = true;
    state.newbieGiftClaimTime = Date.now();
    GameState.save();
  },

  // 顯示新手禮包彈窗
  show() {
    if (this.hasClaimedGift()) {
      console.log('新手禮包已領取');
      return;
    }

    const modal = document.createElement('div');
    modal.id = 'newbie-gift-modal';
    modal.className = 'newbie-gift-modal';
    modal.innerHTML = `
      <div class="newbie-gift-overlay"></div>
      <div class="newbie-gift-box">
        <!-- 頂部裝飾 -->
        <div class="gift-header">
          <div class="gift-rays"></div>
          <div class="gift-title">🎉 新手大禮包 🎉</div>
          <div class="gift-subtitle">歡迎來到寵物闖關 RPG！</div>
        </div>

        <!-- 禮包內容 -->
        <div class="gift-content">
          <!-- 主要獎勵 - 鑽石 -->
          <div class="gift-main-reward">
            <div class="diamond-container">
              <div class="diamond-icon-large">💎</div>
              <div class="diamond-amount">×${this.config.diamond}</div>
            </div>
            <div class="reward-label">鑽石</div>
          </div>

          <!-- 額外獎勵 -->
          <div class="gift-extra-rewards">
            <div class="extra-reward-item">
              <div class="reward-icon">💰</div>
              <div class="reward-text">金幣 ×${this.config.gold.toLocaleString()}</div>
            </div>
            <div class="extra-reward-item">
              <div class="reward-icon">🎟️</div>
              <div class="reward-text">抽獎券 ×${this.config.gachaTicket}</div>
            </div>
            <div class="extra-reward-item">
              <div class="reward-icon">⚡</div>
              <div class="reward-text">能量藥水 ×${this.config.apPotion}</div>
            </div>
          </div>

          <!-- 說明文字 -->
          <div class="gift-description">
            <p>🌟 首次登入即可領取</p>
            <p>💝 開啟精彩冒險之旅</p>
            <p>✨ 限時專屬福利</p>
          </div>

          <!-- 領取按鈕 -->
          <button class="btn-claim-gift" onclick="NewbieGiftSystem.claim()">
            <span class="btn-shine"></span>
            <span class="btn-text">🎁 立即領取</span>
          </button>
        </div>

        <!-- 底部裝飾粒子 -->
        <div class="gift-particles">
          ${this.generateParticles()}
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // 觸發入場動畫
    setTimeout(() => {
      modal.classList.add('show');
    }, 50);

    // 播放音效（如果有）
    this.playSound('gift_appear');
  },

  // 生成裝飾粒子
  generateParticles() {
    let html = '';
    const particles = ['✨', '💎', '⭐', '🌟', '💫'];
    for (let i = 0; i < 20; i++) {
      const particle = particles[Math.floor(Math.random() * particles.length)];
      const left = Math.random() * 100;
      const delay = Math.random() * 3;
      const duration = 3 + Math.random() * 2;
      html += `<div class="particle" style="left: ${left}%; animation-delay: ${delay}s; animation-duration: ${duration}s;">${particle}</div>`;
    }
    return html;
  },

  // 領取禮包
  claim() {
    const modal = document.getElementById('newbie-gift-modal');
    if (!modal) return;

    // 禁用按鈕防止重複點擊
    const btn = modal.querySelector('.btn-claim-gift');
    btn.disabled = true;
    btn.innerHTML = '<span class="btn-text">領取中...</span>';

    // 播放領取動畫
    this.playClaimAnimation(modal);

    // 延遲發放獎勵（配合動畫）
    setTimeout(() => {
      this.giveRewards();
      this.markAsClaimed();

      // 顯示領取成功
      this.showClaimSuccess(modal);

      // 播放音效
      this.playSound('gift_claimed');

      // 3秒後關閉彈窗
      setTimeout(() => {
        this.close(modal);
      }, 3000);
    }, 1500);
  },

  // 播放領取動畫
  playClaimAnimation(modal) {
    const giftBox = modal.querySelector('.newbie-gift-box');
    giftBox.classList.add('claiming');

    // 創建爆炸特效
    const explosion = document.createElement('div');
    explosion.className = 'gift-explosion';
    explosion.innerHTML = `
      <div class="explosion-ring"></div>
      <div class="explosion-ring"></div>
      <div class="explosion-ring"></div>
    `;
    giftBox.appendChild(explosion);

    // 鑽石飛出特效
    this.createFlyingDiamonds(modal);
  },

  // 創建鑽石飛出特效
  createFlyingDiamonds(modal) {
    const diamondContainer = modal.querySelector('.diamond-container');
    const rect = diamondContainer.getBoundingClientRect();

    for (let i = 0; i < 15; i++) {
      const diamond = document.createElement('div');
      diamond.className = 'flying-diamond';
      diamond.textContent = '💎';
      diamond.style.left = rect.left + rect.width / 2 + 'px';
      diamond.style.top = rect.top + rect.height / 2 + 'px';

      const angle = (Math.PI * 2 * i) / 15;
      const distance = 100 + Math.random() * 100;
      const targetX = Math.cos(angle) * distance;
      const targetY = Math.sin(angle) * distance;

      diamond.style.setProperty('--target-x', targetX + 'px');
      diamond.style.setProperty('--target-y', targetY + 'px');

      document.body.appendChild(diamond);

      // 動畫結束後移除
      setTimeout(() => {
        diamond.remove();
      }, 1000);
    }
  },

  // 顯示領取成功
  showClaimSuccess(modal) {
    const content = modal.querySelector('.gift-content');
    content.innerHTML = `
      <div class="claim-success">
        <div class="success-icon">🎉</div>
        <div class="success-title">領取成功！</div>
        <div class="success-rewards">
          <div class="success-item">💎 鑽石 +${this.config.diamond}</div>
          <div class="success-item">💰 金幣 +${this.config.gold.toLocaleString()}</div>
          <div class="success-item">🎟️ 抽獎券 +${this.config.gachaTicket}</div>
          <div class="success-item">⚡ 能量藥水 +${this.config.apPotion}</div>
        </div>
        <div class="success-message">獎勵已發放到您的帳戶</div>
        <div class="success-hint">祝您遊戲愉快！🎮</div>
      </div>
    `;
  },

  // 發放獎勵
  giveRewards() {
    // 發放鑽石
    GameState.addDiamond(this.config.diamond);

    // 發放金幣
    GameState.addGold(this.config.gold);

    // 發放道具
    GameState.addItem('gacha_ticket', this.config.gachaTicket);
    GameState.addItem('ap_potion', this.config.apPotion);

    // 保存狀態
    GameState.save();

    // 更新 HUD 顯示
    if (typeof updateHUD === 'function') {
      updateHUD();
    }

    console.log('✅ 新手禮包獎勵已發放');
  },

  // 關閉彈窗
  close(modal) {
    if (!modal) {
      modal = document.getElementById('newbie-gift-modal');
    }
    if (!modal) return;

    modal.classList.remove('show');
    modal.classList.add('hide');

    setTimeout(() => {
      modal.remove();
    }, 500);
  },

  // 播放音效（佔位函數）
  playSound(soundName) {
    // TODO: 如果有音效系統，在這裡播放
    console.log('🔊 播放音效:', soundName);
  },

  // 重置禮包（調試用）
  reset() {
    const state = GameState.get();
    delete state.hasClaimedNewbieGift;
    delete state.newbieGiftClaimTime;
    GameState.save();
    console.log('✅ 新手禮包已重置，刷新頁面可重新領取');
  }
};

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NewbieGiftSystem;
}
