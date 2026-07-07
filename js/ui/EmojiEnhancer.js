/**
 * Emoji 图标增强工具
 * 自动为页面中的 emoji 添加视觉增强效果
 */
class EmojiEnhancer {
  constructor() {
    this.initialized = false;
  }

  /**
   * 初始化 emoji 增强系统
   */
  init() {
    if (this.initialized) return;

    // 延迟执行，确保 DOM 已加载
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.enhanceAll());
    } else {
      this.enhanceAll();
    }

    // 监听 DOM 变化，自动增强新添加的 emoji
    this.setupMutationObserver();

    this.initialized = true;
    console.log('✨ Emoji Enhancer 已启动');
  }

  /**
   * 增强所有现有的 emoji
   */
  enhanceAll() {
    // 增强 HUD 中的图标
    this.enhanceHUD();

    // 增强导航按钮
    this.enhanceNavigation();

    // 增强战斗卡片图标
    this.enhanceBattleIcons();

    // 增强背包图标
    this.enhanceInventoryIcons();

    // 增强抽卡图标
    this.enhanceGachaIcons();

    // 增强商店图标
    this.enhanceShopIcons();

    console.log('✅ 所有 emoji 增强完成');
  }

  /**
   * 增强 HUD 图标
   */
  enhanceHUD() {
    const hudElements = [
      '#hud-level',
      '#hud-gold',
      '#hud-diamond',
      '#hud-ap'
    ];

    hudElements.forEach(selector => {
      const el = document.querySelector(selector);
      if (el && !el.classList.contains('emoji-enhanced')) {
        el.classList.add('emoji-enhanced');
        this.addEmojiGlow(el, this.getHUDGlowColor(selector));
      }
    });
  }

  /**
   * 获取 HUD 元素的发光颜色
   */
  getHUDGlowColor(selector) {
    const colorMap = {
      '#hud-level': 'rgba(100, 150, 255, 0.4)',
      '#hud-gold': 'rgba(255, 215, 0, 0.5)',
      '#hud-diamond': 'rgba(100, 200, 255, 0.5)',
      '#hud-ap': 'rgba(255, 230, 100, 0.5)'
    };
    return colorMap[selector] || 'rgba(255, 255, 255, 0.3)';
  }

  /**
   * 增强导航按钮
   */
  enhanceNavigation() {
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => {
      if (!btn.classList.contains('emoji-enhanced')) {
        btn.classList.add('emoji-enhanced');

        // 为活跃的导航添加特殊效果
        if (btn.classList.contains('active')) {
          this.addActiveEffect(btn);
        }
      }
    });

    // 监听导航切换
    navBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        navBtns.forEach(b => b.classList.remove('nav-active-enhanced'));
        this.addActiveEffect(btn);
      });
    });
  }

  /**
   * 添加活跃效果
   */
  addActiveEffect(element) {
    element.classList.add('nav-active-enhanced');
  }

  /**
   * 增强战斗卡片图标
   */
  enhanceBattleIcons() {
    // 增强战斗卡片中的图标
    const battleIcons = document.querySelectorAll('.bc-icon');
    battleIcons.forEach(icon => {
      if (!icon.classList.contains('emoji-enhanced')) {
        icon.classList.add('emoji-enhanced');

        // 根据卡片类型添加不同效果
        const card = icon.closest('.bc');
        if (card) {
          if (card.classList.contains('boss-bc')) {
            icon.classList.add('emoji-3d');
          } else if (card.classList.contains('leader-bc')) {
            icon.classList.add('emoji-3d');
          }
        }
      }
    });

    // 增强队伍槽位图标
    const teamIcons = document.querySelectorAll('.pet-icon');
    teamIcons.forEach(icon => {
      if (!icon.classList.contains('emoji-enhanced')) {
        icon.classList.add('emoji-enhanced', 'emoji-3d');
      }
    });

    // 增强敌人预览图标
    const enemyIcons = document.querySelectorAll('.enemy-icon');
    enemyIcons.forEach(icon => {
      if (!icon.classList.contains('emoji-enhanced')) {
        icon.classList.add('emoji-enhanced');
      }
    });
  }

  /**
   * 增强背包图标
   */
  enhanceInventoryIcons() {
    // 增强宠物卡片图标
    const petIcons = document.querySelectorAll('.pc-icon');
    petIcons.forEach(icon => {
      if (!icon.classList.contains('emoji-enhanced')) {
        icon.classList.add('emoji-enhanced', 'emoji-3d');

        // 根据品质添加不同效果
        const card = icon.closest('.pet-card');
        if (card) {
          const quality = this.getQuality(card);
          if (quality) {
            card.setAttribute('data-quality', quality);
          }
        }
      }
    });

    // 增强槽位菜单图标
    const slotIcons = document.querySelectorAll('.spi-icon');
    slotIcons.forEach(icon => {
      if (!icon.classList.contains('emoji-enhanced')) {
        icon.classList.add('emoji-enhanced');
      }
    });
  }

  /**
   * 获取宠物品质
   */
  getQuality(card) {
    const qualityEl = card.querySelector('.pc-quality');
    if (qualityEl) {
      const text = qualityEl.textContent.trim();
      if (text.includes('傳說')) return '傳說';
      if (text.includes('史詩')) return '史詩';
      if (text.includes('稀有')) return '稀有';
      if (text.includes('普通')) return '普通';
    }
    return null;
  }

  /**
   * 增强抽卡图标
   */
  enhanceGachaIcons() {
    // 增强抽卡结果图标
    const gachaIcons = document.querySelectorAll('.gc-icon');
    gachaIcons.forEach(icon => {
      if (!icon.classList.contains('emoji-enhanced')) {
        icon.classList.add('emoji-enhanced', 'emoji-3d');

        // 根据品质添加效果
        const card = icon.closest('.gacha-card');
        if (card) {
          const quality = this.getGachaQuality(card);
          if (quality) {
            card.setAttribute('data-quality', quality);
          }
        }
      }
    });

    // 增强抽卡动画
    const gachaPull = document.querySelector('.gacha-pull-anim');
    if (gachaPull && !gachaPull.classList.contains('emoji-enhanced')) {
      gachaPull.classList.add('emoji-enhanced');
    }
  }

  /**
   * 获取抽卡品质
   */
  getGachaQuality(card) {
    const qualityEl = card.querySelector('.gc-quality');
    if (qualityEl) {
      const text = qualityEl.textContent.trim();
      if (text.includes('傳說')) return '傳說';
      if (text.includes('史詩')) return '史詩';
      if (text.includes('稀有')) return '稀有';
      if (text.includes('普通')) return '普通';
    }
    return null;
  }

  /**
   * 增强商店图标
   */
  enhanceShopIcons() {
    const shopIcons = document.querySelectorAll('.sc-icon');
    shopIcons.forEach(icon => {
      if (!icon.classList.contains('emoji-enhanced')) {
        icon.classList.add('emoji-enhanced', 'emoji-3d');
      }
    });

    // 增强手动战斗卡片图标
    const cardIcons = document.querySelectorAll('.card-icon');
    cardIcons.forEach(icon => {
      if (!icon.classList.contains('emoji-enhanced')) {
        icon.classList.add('emoji-enhanced', 'emoji-3d');
      }
    });
  }

  /**
   * 添加发光效果
   */
  addEmojiGlow(element, color) {
    const style = element.style;
    const currentFilter = style.filter || '';

    if (!currentFilter.includes('drop-shadow')) {
      style.filter = `${currentFilter} drop-shadow(0 0 8px ${color})`.trim();
    }
  }

  /**
   * 设置 DOM 变化监听器
   */
  setupMutationObserver() {
    const observer = new MutationObserver((mutations) => {
      let needsUpdate = false;

      mutations.forEach(mutation => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          needsUpdate = true;
        }
      });

      if (needsUpdate) {
        // 延迟执行，避免频繁调用
        clearTimeout(this.updateTimeout);
        this.updateTimeout = setTimeout(() => {
          this.enhanceAll();
        }, 100);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * 为特定元素添加特效
   */
  addSpecialEffect(element, effectName) {
    if (!element) return;

    const effects = {
      'pulse': 'emoji-pulse',
      'glow': 'emoji-glow',
      'bounce': 'emoji-bounce',
      '3d': 'emoji-3d',
      'sparkle': 'emoji-sparkle'
    };

    const className = effects[effectName];
    if (className && !element.classList.contains(className)) {
      element.classList.add(className);
    }
  }

  /**
   * 移除特效
   */
  removeSpecialEffect(element, effectName) {
    if (!element) return;

    const effects = {
      'pulse': 'emoji-pulse',
      'glow': 'emoji-glow',
      'bounce': 'emoji-bounce',
      '3d': 'emoji-3d',
      'sparkle': 'emoji-sparkle'
    };

    const className = effects[effectName];
    if (className) {
      element.classList.remove(className);
    }
  }

  /**
   * 触发特殊动画
   */
  triggerAnimation(element, animationName) {
    if (!element) return;

    // 移除已有动画类
    element.style.animation = 'none';

    // 强制重排
    void element.offsetWidth;

    // 添加新动画
    element.style.animation = `${animationName} 0.6s ease-out`;

    // 动画结束后清理
    element.addEventListener('animationend', () => {
      element.style.animation = '';
    }, { once: true });
  }

  /**
   * 批量增强指定容器内的 emoji
   */
  enhanceContainer(container) {
    if (!container) return;

    // 查找所有可能包含 emoji 的元素
    const selectors = [
      '.bc-icon', '.pet-icon', '.enemy-icon', '.pc-icon',
      '.gc-icon', '.sc-icon', '.card-icon', '.spi-icon'
    ];

    selectors.forEach(selector => {
      const icons = container.querySelectorAll(selector);
      icons.forEach(icon => {
        if (!icon.classList.contains('emoji-enhanced')) {
          icon.classList.add('emoji-enhanced', 'emoji-3d');
        }
      });
    });
  }
}

// 创建全局实例
window.emojiEnhancer = new EmojiEnhancer();

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EmojiEnhancer;
}
