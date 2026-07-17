/**
 * 像素濾鏡控制系統
 * 為戰鬥圖標添加復古像素風格效果
 */

const PixelFilterController = {
  enabled: false,

  // 初始化系統
  init() {
    // 從 localStorage 讀取使用者偏好
    const saved = localStorage.getItem('pixelFilterEnabled');
    this.enabled = saved === 'true';

    if (this.enabled) {
      this.enable();
    }

    console.log('🎨 像素濾鏡系統已初始化');
  },

  // 啟用像素濾鏡
  enable() {
    this.enabled = true;
    localStorage.setItem('pixelFilterEnabled', 'true');

    // 為所有戰鬥圖標添加像素增強
    this.applyToAllIcons();

    // 為戰鬥場景添加像素模式
    const arena = document.querySelector('.battle-arena');
    if (arena) {
      arena.classList.add('pixel-mode');
      arena.classList.add('pixel-mode-activating');
      setTimeout(() => {
        arena.classList.remove('pixel-mode-activating');
      }, 500);
    }

    console.log('✅ 像素濾鏡已啟用');
  },

  // 禁用像素濾鏡
  disable() {
    this.enabled = false;
    localStorage.setItem('pixelFilterEnabled', 'false');

    // 移除所有像素增強類
    this.removeFromAllIcons();

    // 移除戰鬥場景像素模式
    const arena = document.querySelector('.battle-arena');
    if (arena) {
      arena.classList.remove('pixel-mode');
    }

    console.log('❌ 像素濾鏡已禁用');
  },

  // 切換像素濾鏡
  toggle() {
    if (this.enabled) {
      this.disable();
    } else {
      this.enable();
    }
    return this.enabled;
  },

  // 為所有圖標應用像素增強
  applyToAllIcons() {
    // 戰鬥卡片圖標
    const battleIcons = document.querySelectorAll('.bc-icon');
    battleIcons.forEach(icon => {
      icon.classList.add('pixel-enhanced');
    });

    // 戰鬥卡片本身
    const battleCards = document.querySelectorAll('.bc');
    battleCards.forEach(card => {
      card.classList.add('pixel-enhanced');
    });

    // 隊伍槽位圖標
    const petIcons = document.querySelectorAll('.pet-icon');
    petIcons.forEach(icon => {
      icon.classList.add('pixel-enhanced');
    });

    // 敵人預覽圖標
    const enemyIcons = document.querySelectorAll('.enemy-icon');
    enemyIcons.forEach(icon => {
      icon.classList.add('pixel-enhanced');
    });

    // 背包寵物圖標
    const pcIcons = document.querySelectorAll('.pc-icon');
    pcIcons.forEach(icon => {
      icon.classList.add('pixel-enhanced');
    });

    // HUD 圖標
    const hudIcons = ['hud-level', 'hud-gold', 'hud-diamond', 'hud-ap'];
    hudIcons.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.classList.add('pixel-enhanced');
      }
    });
  },

  // 移除所有圖標的像素增強
  removeFromAllIcons() {
    const allEnhanced = document.querySelectorAll('.pixel-enhanced');
    allEnhanced.forEach(el => {
      el.classList.remove('pixel-enhanced');
    });
  },

  // 為新添加的元素應用像素濾鏡
  applyToElement(element) {
    if (!this.enabled) return;

    // 檢查是否是需要增強的圖標
    if (element.classList.contains('bc-icon') ||
        element.classList.contains('pet-icon') ||
        element.classList.contains('enemy-icon') ||
        element.classList.contains('pc-icon') ||
        element.classList.contains('bc')) {
      element.classList.add('pixel-enhanced');
    }

    // 遞迴處理子元素
    const icons = element.querySelectorAll('.bc-icon, .pet-icon, .enemy-icon, .pc-icon, .bc');
    icons.forEach(icon => {
      icon.classList.add('pixel-enhanced');
    });
  },

  // 設置監聽器以自動處理新元素
  setupMutationObserver() {
    const observer = new MutationObserver((mutations) => {
      if (!this.enabled) return;

      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) { // Element node
            this.applyToElement(node);
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    console.log('👁️ 像素濾鏡觀察器已啟動');
  }
};

// 自動初始化（在 DOM 載入後）
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    PixelFilterController.init();
    PixelFilterController.setupMutationObserver();
  });
} else {
  PixelFilterController.init();
  PixelFilterController.setupMutationObserver();
}

// 導出供其他模組使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PixelFilterController;
}
