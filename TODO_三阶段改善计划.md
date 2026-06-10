# 📋 JOSE 游戏三阶段改善计划

## 📅 创建日期
2026-06-10

## 🎯 总体目标
从当前 v1.1.0（79分）提升到 v1.3.0（96分）

---

## 🔴 Phase 1: 核心完善（v1.1.1）

### 基本信息
- **优先级：** ⭐⭐⭐⭐⭐ 紧急
- **预计时间：** 5 小时
- **目标分数：** 79 → 83 分（+4分）
- **状态：** ⏳ 待执行

---

### 任务清单

#### 1️⃣ 实现 burn（灼烧）效果
**预计时间：** 2 小时
**优先级：** 🔴 Critical

**任务详情：**
- [ ] 在 `BattleEngine.buildCombatant` 中添加 `debuffs: []` 字段
- [ ] 实现 burn 触发逻辑（15% 概率）
- [ ] 实现每回合 burn 伤害处理
- [ ] 添加 `decrementDebuffs()` 函数
- [ ] 在回合结束时调用 burn 处理
- [ ] 测试熔岩球的"灼熱"被动技能

**实现代码模板：**
```javascript
// 在 buildCombatant 中添加
debuffs: []  // 存储 debuff 效果

// 实现 burn 效果
if (sk.effect === 'burn' && Math.random() < sk.chance) {
  target.debuffs = target.debuffs || [];
  target.debuffs.push({
    type: 'burn',
    damage: Math.floor(target.maxHp * sk.value),  // 5% 最大HP
    duration: 3
  });
}

// 每回合处理 burn
function processDebuffs(team) {
  team.forEach(function(unit) {
    if (!unit || !unit.debuffs) return;
    
    unit.debuffs.forEach(function(debuff) {
      if (debuff.type === 'burn') {
        unit.hp = Math.max(0, unit.hp - debuff.damage);
        BattleStats.recordDamageTaken(debuff.damage);
        debuff.duration--;
      }
    });
    
    unit.debuffs = unit.debuffs.filter(d => d.duration > 0);
  });
}
```

**修改文件：**
- `js/core/BattleEngine.js`
- `js/core/BattleConfig.js` (添加 DEBUFF_DURATION 配置)

**测试步骤：**
1. 选择熔岩球上阵
2. 进行战斗
3. 观察敌人是否受到持续伤害
4. 验证灼烧图标显示（Phase 2）

---

#### 2️⃣ 增强战斗统计系统
**预计时间：** 3 小时
**优先级：** 🟠 High

**任务详情：**
- [ ] 扩展 BattleStats 数据结构
- [ ] 添加每个宠物的独立统计
- [ ] 追踪技能伤害贡献
- [ ] 记录最高单次伤害
- [ ] 统计治疗总量
- [ ] 生成详细战斗报告

**新增数据结构：**
```javascript
var BattleStats = (function () {
  var currentStats = null;

  return {
    init: function () {
      currentStats = {
        // 现有字段
        totalDamageDealt: 0,
        totalDamageTaken: 0,
        killCount: 0,
        roundCount: 0,
        skillsUsed: 0,
        startTime: Date.now(),
        
        // 新增字段
        petStats: [],  // 每个宠物的统计
        skillDamage: {},  // 技能伤害贡献
        maxSingleDamage: 0,  // 最高单次伤害
        totalHealing: 0,  // 总治疗量
        buffCount: 0,  // Buff 使用次数
        debuffCount: 0  // Debuff 施加次数
      };
    },
    
    // 记录宠物统计
    recordPetAction: function(petName, action, value) {
      var pet = currentStats.petStats.find(p => p.name === petName);
      if (!pet) {
        pet = {
          name: petName,
          damageDealt: 0,
          damageTaken: 0,
          healingDone: 0,
          killCount: 0,
          skillsUsed: 0
        };
        currentStats.petStats.push(pet);
      }
      
      if (action === 'damage') pet.damageDealt += value;
      if (action === 'taken') pet.damageTaken += value;
      if (action === 'heal') pet.healingDone += value;
      if (action === 'kill') pet.killCount++;
      if (action === 'skill') pet.skillsUsed++;
    },
    
    // 生成详细报告
    generateDetailedReport: function() {
      var stats = this.get();
      if (!stats) return '';
      
      // MVP 计算
      var mvp = stats.petStats.reduce(function(best, pet) {
        var score = pet.damageDealt + pet.healingDone * 1.5 + pet.killCount * 100;
        return score > best.score ? {name: pet.name, score: score} : best;
      }, {name: '', score: 0});
      
      var html = '<div class="detailed-stats">';
      html += '<div class="mvp">🏆 MVP: ' + mvp.name + '</div>';
      
      // 宠物统计表格
      html += '<table class="pet-stats-table">';
      html += '<tr><th>宠物</th><th>伤害</th><th>治疗</th><th>击杀</th></tr>';
      stats.petStats.forEach(function(pet) {
        html += '<tr>';
        html += '<td>' + pet.name + '</td>';
        html += '<td>' + pet.damageDealt.toLocaleString() + '</td>';
        html += '<td>' + pet.healingDone.toLocaleString() + '</td>';
        html += '<td>' + pet.killCount + '</td>';
        html += '</tr>';
      });
      html += '</table>';
      
      html += '</div>';
      return html;
    }
  };
})();
```

**修改文件：**
- `js/core/BattleStats.js`
- `js/ui/BattleView.js` (显示详细报告)
- `js/ui/ManualBattle.js` (显示详细报告)

**测试步骤：**
1. 完成一场战斗
2. 查看结算界面
3. 验证 MVP 显示
4. 验证宠物统计表格

---

#### 3️⃣ 验证关卡数据
**预计时间：** 30 分钟
**优先级：** 🟡 Medium

**任务详情：**
- [ ] 检查 100 关配置完整性
- [ ] 验证难度曲线合理性
- [ ] 确认 Boss 关卡平衡
- [ ] 修正不合理的关卡

**检查脚本：**
```javascript
// 运行此脚本验证关卡数据
function validateStages() {
  var issues = [];
  
  for (var i = 1; i <= 100; i++) {
    var cfg = getStageConfig(i);
    
    if (!cfg) {
      issues.push('关卡 ' + i + ' 配置缺失');
      continue;
    }
    
    // 检查敌人数量
    var totalEnemies = cfg.frontRow.length + cfg.backRow.length;
    if (totalEnemies === 0) {
      issues.push('关卡 ' + i + ' 没有敌人');
    }
    
    // 检查难度曲线
    if (i > 1) {
      var prevCfg = getStageConfig(i - 1);
      var prevPower = prevCfg.frontRow.reduce((s, e) => s + e.atk + e.def, 0);
      var currPower = cfg.frontRow.reduce((s, e) => s + e.atk + e.def, 0);
      
      if (currPower < prevPower * 0.8) {
        issues.push('关卡 ' + i + ' 难度下降过多');
      }
    }
    
    // 检查 Boss 关卡
    if (i % 10 === 0 && !cfg.isBoss) {
      issues.push('关卡 ' + i + ' 应该是 Boss 关卡');
    }
  }
  
  console.log('关卡验证完成，发现 ' + issues.length + ' 个问题：');
  issues.forEach(issue => console.log('- ' + issue));
}
```

**修改文件：**
- `js/data/stages.js` (如有问题)

---

### Phase 1 完成标准

- [x] burn 效果正常工作
- [x] 熔岩球技能生效
- [x] 战斗统计显示 MVP
- [x] 宠物统计表格完整
- [x] 所有关卡可正常进行
- [x] 无新增 Bug

### Phase 1 预期成果

**技能实现度：** 90.9% → **100%** ✅
**战斗完整性：** 85% → 95%
**系统评分：** 79 → 83 分

---

## 🟠 Phase 2: 体验增强（v1.2.0）

### 基本信息
- **优先级：** ⭐⭐⭐⭐ 重要
- **预计时间：** 1-2 周
- **目标分数：** 83 → 88 分（+5分）
- **状态：** ⏳ 待执行

---

### 任务清单

#### 1️⃣ 战斗回放系统
**预计时间：** 2 天
**优先级：** 🟠 High

**任务详情：**
- [ ] 创建 BattleRecorder 模块
- [ ] 记录完整战斗事件流
- [ ] 实现回放播放器 UI
- [ ] 添加速度控制（0.5x, 1x, 2x）
- [ ] 支持暂停/继续/跳转
- [ ] 保存最近 10 场战斗
- [ ] 添加分享功能（导出 JSON）

**新增文件：**
- `js/core/BattleRecorder.js`
- `js/ui/ReplayView.js`

---

#### 2️⃣ 详细战斗报告
**预计时间：** 2 天
**优先级：** 🟠 High

**任务详情：**
- [ ] MVP 评选算法
- [ ] 伤害贡献饼图
- [ ] 技能使用频率统计
- [ ] 三星评级系统
- [ ] 战斗时长与效率
- [ ] 存活率分析

**评级标准：**
```
⭐⭐⭐ 三星：战斗时长 < 60秒，无宠物死亡
⭐⭐   两星：战斗时长 < 90秒，或最多1只宠物死亡
⭐     一星：完成战斗
```

---

#### 3️⃣ Buff/Debuff 视觉效果
**预计时间：** 1 天
**优先级：** 🟡 Medium

**任务详情：**
- [ ] 设计 Buff 图标（攻击↑、防御↑）
- [ ] 设计 Debuff 图标（灼烧🔥）
- [ ] 在宠物卡片上显示状态图标
- [ ] 添加持续时间倒计时
- [ ] 鼠标悬停显示详细信息
- [ ] 添加状态动画效果

**CSS 示例：**
```css
.buff-icon {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  position: absolute;
  top: 5px;
  right: 5px;
  animation: pulse 1s infinite;
}

.buff-atk { background: #ff6b6b; }
.buff-def { background: #4ecdc4; }
.debuff-burn { background: #ff922b; }
```

---

#### 4️⃣ AI 策略优化
**预计时间：** 2 天
**优先级：** 🟡 Medium

**任务详情：**
- [ ] 技能优先级系统
- [ ] 根据战况动态调整策略
- [ ] 保护低血量盟友
- [ ] 优先击杀威胁目标
- [ ] Boss 专属 AI 行为

**AI 决策树：**
```
1. 是否有队友濒死？
   → 是：使用治疗技能
   → 否：继续

2. 是否有高威胁敌人？
   → 是：集火攻击
   → 否：继续

3. 是否可以使用 AoE？
   → 是：使用全体技能
   → 否：单体攻击
```

---

#### 5️⃣ 战斗日志系统
**预计时间：** 1 天
**优先级：** 🟢 Low

**任务详情：**
- [ ] 创建 BattleLogger 模块
- [ ] 记录所有战斗事件
- [ ] 可导出为文本日志
- [ ] 开发者调试模式
- [ ] 性能监控

**新增文件：**
- `js/core/BattleLogger.js`

---

### Phase 2 完成标准

- [ ] 可以回放战斗
- [ ] MVP 正确显示
- [ ] 三星评级工作正常
- [ ] Buff/Debuff 图标显示
- [ ] AI 行为更智能
- [ ] 日志系统可用

### Phase 2 预期成果

**功能丰富度：** 70% → 90%
**可玩性：** 75% → 92%
**留存率：** +25-30%
**系统评分：** 83 → 88 分

---

## 🟢 Phase 3: 深度优化（v1.3.0）

### 基本信息
- **优先级：** ⭐⭐⭐ 可选
- **预计时间：** 2-4 周
- **目标分数：** 88 → 96 分（+8分）
- **状态：** ⏳ 待执行

---

### 任务清单

#### 1️⃣ 性能优化
**预计时间：** 1 周
**优先级：** 🟡 Medium

**任务详情：**
- [ ] 实现 DOM 对象池
- [ ] Canvas 离屏渲染
- [ ] 减少重排重绘
- [ ] 优化动画性能
- [ ] 内存泄漏检测
- [ ] 性能监控面板

**目标：**
- 帧率：60 FPS 稳定
- 内存占用：< 100MB
- 加载时间：< 2s

---

#### 2️⃣ 单元测试
**预计时间：** 1 周
**优先级：** 🟡 Medium

**任务详情：**
- [ ] 设置测试框架（Jest）
- [ ] 战斗引擎测试
- [ ] 伤害计算测试
- [ ] 技能效果测试
- [ ] 状态管理测试
- [ ] 目标覆盖率：90%+

**测试文件结构：**
```
tests/
├── core/
│   ├── BattleEngine.test.js
│   ├── BattleState.test.js
│   └── BattleStats.test.js
├── data/
│   └── pets.test.js
└── utils/
    └── damage.test.js
```

---

#### 3️⃣ 更多 Debuff 效果
**预计时间：** 3 天
**优先级：** 🟢 Low

**任务详情：**
- [ ] poison（中毒）- 持续伤害，可叠加
- [ ] freeze（冰冻）- 跳过1回合
- [ ] stun（眩晕）- 无法行动
- [ ] bleed（流血）- 移动时额外伤害

**实现优先级：**
1. poison（最常见）
2. stun（控制效果）
3. freeze（强控制）
4. bleed（特殊机制）

---

#### 4️⃣ 战斗动画增强
**预计时间：** 3 天
**优先级：** 🟢 Low

**任务详情：**
- [ ] 更流畅的移动动画
- [ ] 技能特效升级
- [ ] 相机震动效果
- [ ] 粒子系统优化
- [ ] 连击动画

---

#### 5️⃣ 高级 AI 模式
**预计时间：** 3 天
**优先级：** 🟢 Low

**任务详情：**
- [ ] 困难 AI（预测玩家行为）
- [ ] 竞技场 AI（更激进）
- [ ] Boss 专属技能 AI
- [ ] 自适应难度

---

### Phase 3 完成标准

- [ ] 性能提升 30-50%
- [ ] 测试覆盖率 > 90%
- [ ] 4 种 Debuff 实现
- [ ] 动画流畅度提升
- [ ] 高级 AI 可用

### Phase 3 预期成果

**性能：** +30-50%
**代码质量：** 良好 → 优秀
**测试覆盖：** 50% → 90%
**系统评分：** 88 → 96 分

---

## 📊 总体进度追踪

### 时间线

```
Week 1:  Phase 1 (5小时)
Week 2-3: Phase 2 (1-2周)
Week 4-7: Phase 3 (2-4周)
```

### 评分进化

```
v1.1.0: 79/100 ⭐⭐⭐⭐☆
   ↓
v1.1.1: 83/100 ⭐⭐⭐⭐☆ Phase 1
   ↓
v1.2.0: 88/100 ⭐⭐⭐⭐☆ Phase 2
   ↓
v1.3.0: 96/100 ⭐⭐⭐⭐⭐ Phase 3
```

---

## 🎯 优先级说明

### 🔴 Critical - 立即执行
- 影响核心功能
- 用户可能遇到 Bug
- 阻塞其他功能

### 🟠 High - 尽快完成
- 显著提升体验
- 用户高频使用
- 影响留存率

### 🟡 Medium - 计划执行
- 改善体验
- 锦上添花
- 有一定价值

### 🟢 Low - 可选执行
- 长期优化
- 开发者体验
- 未来扩展

---

## 📝 执行建议

### 推荐执行顺序

1. **立即执行：** Phase 1（5小时）
   - 快速达到 100% 功能完整度
   - 解决唯一的 Critical 问题

2. **短期规划：** Phase 2（1-2周）
   - 根据用户反馈调整优先级
   - 重点做战斗回放和详细报告

3. **长期规划：** Phase 3（2-4周）
   - 性能优化和测试是重点
   - 其他功能根据需求灵活调整

---

## 🔄 迭代流程

每个 Phase 完成后：
1. ✅ 功能测试
2. ✅ 性能测试
3. ✅ 用户反馈收集
4. ✅ Bug 修复
5. ✅ 发布新版本
6. ✅ 更新文档

---

## 📞 联系与反馈

如有问题或建议，请：
- 查看相关文档
- 测试功能
- 记录 Bug
- 提出改进意见

---

**创建日期：** 2026-06-10
**文档版本：** v1.0
**状态：** ⏳ 待执行
**下次更新：** Phase 1 完成后
