# 蛊真人模拟器 — P1-P3 游戏深度拓展总体大纲

**版本**: v1.0  
**日期**: 2026-05-01  
**状态**: 大纲阶段（待确认设计决策后进入P1详细设计）

---

## 一、当前架构概览

项目基于 React 18 + TypeScript + Zustand + DeepSeek AI Pipeline，核心流程为:

```
玩家选择 → PIPE管道(BUILDING_CONTEXT→FETCHING→VALIDATING_L4→VALIDATING_L3→RESOLVED) → 叙事输出 + state_update
```

现有系统: 角色创建、蛊虫管理、商会交易、状态更新、L3/L4验证、NPC数据库

---

## 二、P1 — 游戏深度（核心玩法拓展）

### 2.1 回合制战斗系统

**当前状态**: `BattleOverlay` 仅展示 AI 返回的战斗结果文本，无交互。

**目标架构**:

```
BattleEngine 状态机:
  INIT → PLAYER_TURN → AI_JUDGE → ENEMY_TURN → RESULT_CHECK → (loop/end)
```

**组件树**:
```
BattleOverlay (容器)
├── BattleScene (战场背景+敌人)
├── GuSelectionPanel (蛊虫选择 — 复用GuInventoryPanel卡片)
├── KillerMoveBar (杀招释放栏)
├── BattleLog (战斗日志滚动)
└── BattleResult (结算弹窗)
```

**核心系统**:
- **蛊虫选择**: 每回合从背包选择激活蛊虫(上限=空窍容量)，不同蛊虫提供不同战斗效果
- **杀招释放**: 预设杀招(killer-moves.json) + 动态组合(两只以上蛊虫同时激活触发组合技)
- **伤害计算**: 基于境界差值、道痕、蛊虫tier的公式
- **AI判定**: 每回合将战斗状态作为state_update发送给AI，AI返回敌方行动+伤害结果

**设计决策待确认**:
- [ ] 杀招系统: 预设杀招(从JSON加载预设组合) vs 动态组合(玩家自由组合蛊虫触发) vs 混合模式?
- [ ] 战斗节奏: 传统回合制(玩家-敌方交替) vs ATB(速度条系统)?
- [ ] 逃跑机制: 允许逃跑但承担损失 vs 战斗必须分出胜负?

**预估工时**: 5-7天

---

### 2.2 NPC 交互系统

**当前状态**: `CharacterPanel` 只读展示，无交互。经济系统有商会交易面板。

**目标架构**:

```
NPC交互模式:
  对话 → 交易 → 任务 → 关系变化
```

**对话系统**:
- 复用 PIPE 管线，追加 NPC persona 到 context
- System Prompt 中注入 NPC 的 personality + currentMood + relationshipWithPlayer
- 支持情感记忆: 每次对话后更新 npc_xxx_attitude flag

**交易系统**:
- 复用 MerchantPanel 模式
- 新增好感度折扣: attitude≥80 → 8折, attitude≥50 → 9折, attitude≤20 → 拒绝交易
- NPC 专属商品池: npc_xxx_items flag

**任务系统**:
- `quests.json` 定义任务模板, 三类:
  - Fetch: 获取指定蛊虫/蛊材
  - Defeat: 击败指定敌人
  - Deliver: 送达物品到指定地点/NPC
- `questSlice` 管理当前活跃任务
- 任务奖励: 元石/蛊虫/好感度/境界经验

**设计决策待确认**:
- [ ] 对话风格: 自由对话(AI开放生成) vs 话题选项制(预设话题，AI在话题范围内生成)?
- [ ] NPC 感情线: 是否支持NPC好感度→恋爱/婚姻? 需要制定规则防崩坏
- [ ] 任务刷新: 定期自动刷新 vs 完成一批后手动触发 vs 根据剧情章节解锁?

**预估工时**: 4-6天

---

### 2.3 章节叙事弧光

**当前状态**: 无章节概念，叙事自由生成，无极弧光结构。

**目标架构**:

```
chapter.json:
  chapters:
    - id: "青茅山篇"
      trigger: { realm_min: 1, realm_max: 2, flags: ["opened_aperture"] }
      goals: ["获得第一只本命蛊", "达到二转", "在狼潮中存活"]
      key_events: ["开窍大典", "狼潮来袭", "山寨覆灭"]
      npcs_present: ["古月博", "古月方正", "古月青书", "白凝冰"]
      start_narrative: "你在古月山寨的破旧木屋中醒来..."

    - id: "商队篇"
      trigger: { realm_min: 2, realm_max: 3, flags: ["guyue_fell"] }
      goals: ["加入商队", "完成第一次商队任务", "与商心慈建立信任"]
      ...
```

**context-builder 注入**:
- 根据玩家 flags 判断当前章节
- 注入 `currentChapter.goals` 到 system prompt
- 叙事中引导玩家朝章节目标前进

**章节推进**:
- 纯 flags 驱动: 关键事件 flags 全部达成 + 境界达标 → 自动触发转章叙事
- 转章叙事: AI 生成一段过渡叙事(约300字)，介绍新环境和新角色

**设计决策待确认**:
- [ ] 章节触发: 纯 flags 驱动(自动化) vs flags + 手动选择(玩家决定何时进入下一章)?
- [ ] 章节数量: 当前规划几章?(建议P1先做3章: 青茅山→商队→南疆初探)
- [ ] 失败处理: 章节目标未达成允许跳过(丢失奖励) vs 必须完成才能推进?

**预估工时**: 3-4天

---

## 三、P2 — 体验打磨（沉浸感与留存）

### 3.1 音频系统

**当前状态**: `audio.ts` 有基础结构(Web Audio API + 增益节点)，未实际使用。

**目标架构**:

```
AudioManager (三通道):
├── BGM通道 (循环播放，按场景切换)
│   ├── 山寨bgm (古月山寨/安全区)
│   ├── 野外bgm (探索/旅行)
│   ├── 战斗bgm (遭遇战/Boss)
│   └── 宝黄天bgm (商会/仙蛊交易)
├── SFX通道 (一次性音效)
│   ├── 购买/出售
│   ├── 蛊虫激活
│   ├── 战斗命中/闪避
│   └── 境界突破
└── Ambient通道 (环境音循环)
    ├── 森林鸟鸣
    ├── 山洞滴水
    └── 市集喧闹
```

**实现方案**: 使用 Web Audio API (已引入)，用 `<audio>` 标签预加载 + `AudioContext` 控制播放/音量/淡入淡出。

**设计决策待确认**:
- [ ] 音效资源: 使用免费音效库(如 Freesound) vs 用户自行提供? 版权合规?
- [ ] BGM: 使用免费古典音乐 vs 用户提供音乐文件?
- [ ] 静音模式: 独立音量控制条 vs 简单静音按钮?

**预估工时**: 2-3天

---

### 3.2 成就系统

**当前状态**: 无成就系统，但有 `flags` + `daoHeart` 可用于触发。

**目标架构**:

```
achievements.json:
  - id: "first_gu"
    name: "蛊师初成"
    desc: "获得第一只蛊虫"
    trigger: { flag: "has_first_gu", value: true }
    icon: "bug"

  - id: "wolf_survivor"
    name: "狼口余生"
    desc: "在狼潮中存活"
    trigger: { flag: "survived_wolf_tide", value: true }
    icon: "wolf"

  - id: "realm_three"
    name: "三转蛊师"
    desc: "突破至三转境界"
    trigger: { realm_min: 3 }
    icon: "star-three"

  - id: "mercy_path"
    name: "仁者之心"
    desc: "仁道值达到50"
    trigger: { daoHeart: "mercy", threshold: 50 }
    icon: "heart"
```

**AchievementPopup 组件**: 右下角弹出 → 停留3秒 → 淡出。支持栈式排队(多个成就依次弹出)。

**设计决策待确认**:
- [ ] 隐藏成就: 是否需要不公开触发条件的隐藏成就?(如: 在特定场景选择特定选项)
- [ ] 成就奖励: 纯收集 vs 达成后获得元石/蛊虫奖励?

**预估工时**: 1-2天

---

### 3.3 新手引导

**当前状态**: `TutorialOverlay` 纯文本展示。

**目标架构**:

```
TutorialOverlay (逐步引导):
  Step 1: 高亮角色名区域 → "这是你的角色，蛊界弱肉强食，唯有强大才能生存"
  Step 2: 高亮选项面板 → "每轮你需要做出选择，高风险 = 高回报 = 高后果"
  Step 3: 高亮状态栏 → "这里显示你的境界、时间、财富"
  Step 4: 高亮蛊虫背包 → "蛊虫是你的武器和工具，需要定期喂养"
  Step 5: 高亮商会入口 → "赚取元石后可在商会购买蛊虫和蛊材"
```

**实现**:
- 每个引导步骤用半透明遮罩 + 箭头 + 文案
- 使用 `position: fixed` + `z-index: 999` 确保引导层在最上方
- 引导完成后设置 `flag.tutorial_complete = true`

**设计决策待确认**:
- [ ] 引导触发: 每次新游戏都触发 vs 仅首次触发(检测localStorage)?
- [ ] 跳过: 允许老玩家跳过引导?

**预估工时**: 1-2天

---

## 四、P3 — 远期规划

### 4.1 宝黄天完整拍卖系统

**目标**: 从当前"直接购买"升级为"出价→竞价→倒计时→成交"的完整拍卖流程。

**核心系统**:
- 拍卖品轮播: 每轮3-5件拍卖品
- 出价系统: 起拍价 → 每次加价最低增量 → 倒计时30秒
- NPC 竞价对手: AI模拟2-3个对手出价
- 你的手牌: 称号/xp等可作加价筹码

**预估工时**: 5-7天

---

### 4.2 蛊仙升炼 + 仙蛊屋

**目标**: 五转以上内容——蛊仙升炼六转 + 仙蛊屋建造。

**核心系统**:
- 升炼条件: 五转巅峰 + 具备本命蛊 + 完成升炼机缘
- 升炼过程: 多轮叙事 + 选择驱动的升炼(成功/失败/变异)
- 仙蛊屋: 收集仙蛊材料 → 选择仙蛊屋类型 → 建造 + 命名

**预估工时**: 7-10天

---

### 4.3 多人/联网

**目标**: WebSocket 房间系统 + 实时对战。

**核心架构**:
- WebSocket 服务器(Node.js)
- 房间系统: 创建/加入/观战
- 实时对战: 双方同时选择蛊虫→AI判定结果→结算
- 排行榜: 战力/财富/成就排行

**预估工时**: 10-15天

---

## 五、技术债务清理建议

在开始P1之前建议完成以下基础设施优化:

1. **TypeScript strict 模式**: 当前大量 `as any` 类型断言，建议逐步迁移
2. **单元测试**: `canary-assertions.ts` 和 `context-builder.ts` 为核心逻辑，建议加测试
3. **性能优化**: `npc.json` 从70+条增至120+条后，`injectNPCContext` 需要控制过滤后数量
4. **错误边界**: 当前无 React ErrorBoundary，AI异常时可能白屏

---

## 六、实施建议

**推荐顺序**: P1 → P2 → P3

**P1 内部顺序**: 章节弧光(最小改动，最大效果) → NPC交互(中改动) → 战斗系统(大改动，最复杂)

**里程碑**:
- M1: P1-章节弧光完成 → 玩家有明确的章节推进感
- M2: P1-NPC交互完成 → 可以对话/交易/接任务
- M3: P1-战斗系统完成 → 完整的回合制战斗体验
- M4: P2-全部完成 → 音效+成就+引导，游戏完整可玩
- M5: P3-开始 → 大规模内容扩展

---

> **下一步**: 请审阅各模块的「设计决策待确认」项，确认后我按 P1 → P2 → P3 的顺序展开详细设计文档。
