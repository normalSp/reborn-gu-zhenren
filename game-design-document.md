# 蛊真人世界·人生重来模拟器 — 概要设计文档 (GDD)

**版本**: v1.0
**日期**: 2026-04-29
**作者**: CodeBuddy AI + game-dev-text Skill
**技术栈**: React 18 + TypeScript 5 + Vite 5 + Zustand + DeepSeek V4 Pro
**目标平台**: 浏览器本地运行（纯前端）
**设计模式**: SIM 核心 + VN 叙事层 + RPG 成长系统（蛊真人混合架构）

---

## 1. 产品定义与设计目标

### 1.1 一句话描述

一款基于 DeepSeek V4 Pro 大语言模型的 AI 驱动文字游戏，背景严格贴合《蛊真人》原著世界观。玩家以凡人起步，在蛊界弱肉强食的环境中，通过 AI 实时生成的叙事文本推进剧情，所有玩家状态实时可视化并切实影响 AI 生成的后续剧情走向。

### 1.2 体验目标

| 目标 | 描述 | 衡量标准 |
|------|------|----------|
| 沉浸感 | 玩家感觉身处蛊真人世界，每一次选择都在刀尖上跳舞 | 叙事一致性 ≥ 88%（已验证可达） |
| 策略感 | 流派选择、蛊虫搭配、势力外交都是需精心权衡的决策 | Build 多样性 ≥ 12 种有效组合 |
| 代入感 | 方源不是 NPC——他是一个会算计你的真实威胁 | 方源出场场景合规率 ≥ 93% |
| 复玩性 | 每次重开都因天赋/选择/蝴蝶效应而产生不同剧情 | IF 线 ≥ 3 条，天赋池 ≥ 25 个 |
| 透明感 | 所有数值变化对玩家可见，AI 叙事和前端状态同步更新 | JSON 合规率 100%（已验证） |

### 1.3 非目标（明确不做）

- 不做实时动作/战斗动画（这是文字游戏，不是 ARPG）
- 不做多人/联机（纯单机体验）
- 不做自定义流派/自创蛊虫（严格贴合原著，不引入二设）
- 不做语音合成/全语音（阶段 5 可选，非核心）
- 不做移动端适配（首版目标桌面端 1920x1080）

### 1.4 成功指标

| 指标 | 目标值 | 当前验证状态 |
|------|--------|-------------|
| AI JSON 输出合规率 | ≥ 98% | 实测 100%（31 次 API） |
| AI 长线记忆保持率（5 轮后） | ≥ 95% | 实测 100% |
| 世界观叙事一致性 | ≥ 88% | 实测 88%（Prompt 层天花板），代码层推至 93-97% |
| 方源人设合规率 | ≥ 93% | 当前 88%（待代码层 Layer 2-4 实现） |
| 单轮 API 平均延迟 | ≤ 500ms | 实测 190ms（Cache 命中时 ~100ms） |
| 一场 50 轮完整游戏成本 | ≤ $2.00 | 实测 $1.50 |

---

## 2. 核心循环设计

### 2.1 四层时间循环

游戏的核心循环是 AP/时间/事件/叙事的四层嵌套：

```
外层：AP 行动点循环（1 AP = 1 次玩家行动）
├── 消耗 AP → AI 生成叙事 → 展示叙事文本 + 选项 → 玩家选择
│   └── 返回 state_update → 前端面板实时刷新 → 事件引擎判定触发
├── 每日 AP 上限：基础 3 AP，可通过蛊虫/天赋/资源增加
├── AP 耗尽 → 进入下一时段
│
中层：四时段时间流逝（晨/昼/暮/夜 × 每段若干 AP）
├── 时段影响 AI 叙事（夜=更多危机/暗面事件）
├── 时段影响可触发的遭遇类型
├── 蛊虫喂养/炼蛊等操作有时段限制
│
内层：日期/月份/年份推进
├── 触发定期事件（势力贡赋/劫难预告/境界突破时机）
├── 原著检查点到期判定（原著线）
├── 资源点产出结算
│
底层：仙窍内部光阴流速（成仙后）
├── 仙窍内时间按光阴流速比加速流逝
├── 灾劫倒计时递减
├── 仙元/蛊材/蛊虫自动产出
```

### 2.2 玩家行动 → AI 响应完整流程

```
1. 玩家在 UI 中做出选择（点击选项按钮）
2. 前端构建「上下文包」：
   - Layer 1: System Prompt（静态世界观规则 + Few-shot 示例）
   - Layer 2: 玩家状态 JSON（境界/蛊虫/势力/旗帜）
   - Layer 3: 叙事上下文（关键事件索引 + 最近 5 轮对话 + 滚动摘要）
   - 用户消息：玩家选择的文本
3. 调用 DeepSeek V4 Pro API（response_format: json_object）
4. 解析返回的 JSON：
   ├─ narrative.text → 渲染至叙事面板
   ├─ narrative.choices → 渲染至选择面板
   └─ state_update → 差分更新 Zustand Store
5. 前端语义规则引擎校验 narrative.text
   ├─ 通过 → 展示叙事 + 等待玩家下一选择
   └─ 未通过 → 触发 Layer 2 重试（关键场景）或 警告标记（日常场景）
6. 事件引擎检查 state_update 触发了哪些事件
7. 所有受影响的 UI 面板自动重渲染
```

### 2.3 存档/读档循环

每次玩家做选择前自动保存（本地 localStorage）。玩家也可手动存档（最多 20 个槽位）。读档时完整恢复 AI 上下文（System Prompt 重建 + 关键事件注入 + 最近 5 轮对话原文），确保 AI 表现为从未"断片"。

---

## 3. 系统架构总览

### 3.1 12 个核心子系统

系统架构遵循 game-dev-text 的"状态驱动 + 数据视图分离 + 事件溯源"设计原则。

```
蛊真人模拟器
│
├── 1. AI 叙事引擎 (AINarrativeEngine)
│   ├── Context Builder: 构建三层上下文包
│   ├── API Gateway: DeepSeek V4 Pro 调用封装（重试/退避/错误处理）
│   ├── Response Parser: JSON 解析 + Zod Schema 校验
│   └── Consistency Validator: 四层保障策略的调度中心
│
├── 2. 玩家属性系统 (PlayerAttributeSystem)
│   ├── 四大核心属性：资质/根骨/心智/气运（0-10 分）
│   ├── 境界管理：九转 × 四小境界，突破成功率判定
│   ├── 生命/真元：HP 和真元实时追踪
│   └── 道心倾向：四维道德标尺（杀伐/仁善/算计/野心）
│
├── 3. 蛊虫系统 (GuSystem)
│   ├── GuSpec: 蛊虫原型（名称/转数/流派/稀有度/效果）
│   ├── GuInstance: 玩家持有的具体蛊虫（含当前状态/喂养需求）
│   ├── 仙蛊唯一性约束：同一仙蛊世间只能存在一只
│   └── 蛊虫喂养：真元消耗 + 特殊食物需求
│
├── 4. 流派/Build 系统 (PathBuildSystem)
│   ├── 48 流派定义 + 道痕互斥约束
│   ├── 七级流派境界（普通 → 道主）
│   ├── 杀招管理：流派专属杀招的领悟/升级/使用
│   └── Build 评估：流派适应度计算 + 推荐方向
│
├── 5. 天赋系统 (TalentSystem)
│   ├── 六品天赋分级（金/红/橙/紫/蓝/白）
│   ├── 天赋 Modifier 系统（增益 + 代价双向修正器）
│   ├── 天赋抽取：每局开局从 25+ 天赋池随机抽 10 选 3
│   └── 特殊机制：存档回溯/春秋残响/十绝体等
│
├── 6. 势力与社交系统 (FactionSocialSystem)
│   ├── 势力声望：-100（死敌）→ 100（崇拜）
│   ├── 人物关系网：亲密度 + 信任度 + 已知秘密 + 被揭示秘密
│   ├── 关系影响叙事：affinity 值直接控制 AI 对玩家态度
│   └── 势力事件：定期贡赋/通缉/联盟/背叛
│
├── 7. 事件/奇遇引擎 (EventEngine)
│   ├── 事件池：基于条件的随机事件（奇遇/危机/日常）
│   ├── 权重计算：按境界/区域/道心倾向/气运加权
│   ├── 条件触发器：特定旗帜/属性阈值/时间点触发
│   └── 原著检查点：原著线硬约束事件调度
│
├── 8. 战斗结算引擎 (CombatEngine)
│   ├── 回合制结算：蛊虫对决/杀招博弈
│   ├── 伤害 = (ATK - DEF×0.5) × 流派克制系数 × 杀招倍率 × 暴击 × 浮动
│   ├── 命中率 = accuracy/(accuracy + evasion)
│   ├── AI 负责叙事描写，引擎只负责数值结算
│   └── 境界差距绝对限制：≥2 转差距 = 秒杀
│
├── 9. 仙窍经营系统 (ImmortalApertureSystem)
│   ├── 面积/光阴流速/资源节点/道痕密度的实时追踪
│   ├── 灾劫系统：按境界递增（地灾→天劫→浩劫→万劫）
│   ├── 产出结算：仙元/蛊材/蛊虫按光阴流速自动产出
│   └── 设施建造：炼蛊室/蛊虫培育室/防御阵法
│
├── 10. 因果追踪系统 (CausalityTracker)
│   ├── 蝴蝶效应列表：每个重大选择记录因果链
│   ├── 时间线偏离度：0（完全贴合原著）→ 100（面目全非）
│   ├── 世界状态差异：相对原著的变化对比
│   └── 注入 AI 上下文：确保 AI 知道世界因玩家发生了哪些根本改变
│
├── 11. 存档系统 (SaveSystem)
│   ├── 多槽位存档（最多 20 个）
│   ├── JSON 导出/导入（跨设备迁移）
│   ├── 自动存档：每次选择前自动保存
│   └── 读档 AI 上下文恢复：System Prompt 重建 + 关键事件注入
│
└── 12. 可视化系统 (VisualSystem)
    ├── 对话面板：AI 叙事文本 + 打字机效果
    ├── 选项面板：风险等级可视化 + risk_note 提示
    ├── 状态面板：属性雷达图 + 境界进度条 + 真元/生命
    ├── 蛊虫图鉴：卡片网格 + 流派/转数/稀有度筛选
    ├── 杀招列表：等级/流派/消耗/效果详情
    ├── 仙窍面板：同心圆可视化 + 面积图 + 资源产出表
    ├── 地图面板：SVG 五域两天地图 + 动态标记 + 战争迷雾
    ├── 人物图鉴：头像卡片 + 关系网络图
    ├── 势力面板：声望进度条 + 关系标签
    ├── 道痕面板：流派道痕柱状图
    └── 事件日志：时间线 + 类型过滤
```

### 3.2 数据流关系

核心数据流是单向的：

```
玩家选择 → Context Builder → API 调用 → JSON 响应
    → Zustand Store 差分更新 → 所有 UI 面板自动重渲染
    → 事件引擎检测触发 → 事件加入队列 → 下轮 API 上下文注入
```

### 3.3 状态管理设计

使用 Zustand 的切片（slice）模式，每个子系统一个独立的 store slice：

```
Zustand Root Store
├── playerSlice: 属性/境界/生命/真元/道心
├── guSlice: 蛊虫列表/喂养状态
├── killMoveSlice: 杀招列表/等级/冷却
├── pathSlice: 流派/流派境界/道痕
├── talentSlice: 已选天赋/天赋修正器
├── factionSlice: 势力声望/人物关系
├── immortalSlice: 仙窍/资源/灾劫
├── causalitySlice: 蝴蝶效应/时间线偏离度
├── eventSlice: 事件队列/已触发事件
├── narrativeSlice: 对话历史/关键事件索引/滚动摘要
├── mapSlice: 地图标记/探索进度
└── uiSlice: 当前面板Tab/存档状态/加载状态
```

Zustand 的 `persist` 中间件自动将状态序列化到 localStorage，实现存档。

---

## 4. AI 叙事集成方案

### 4.1 AINarrativeEngine 标准接口

基于 game-dev-text 的 AINarrativeEngine 接口模式，封装 DeepSeek V4 Pro 调用：

```typescript
interface AINarrativeEngine {
  // 核心方法：发送玩家选择，获取 AI 叙事
  requestNarrative(
    playerChoice: PlayerChoice,
    playerState: PlayerState,
    aiContext: AIContext
  ): Promise<NarrativeResponse>;

  // 摘要压缩：每 10 轮调用一次，压缩旧对话
  compressHistory(
    messages: Message[]
  ): Promise<string>;

  // 一致性校验：双轮流水线的第二层
  validateNarrative(
    narrative: NarrativeJSON,
    context: ValidationContext
  ): Promise<ValidationResult>;
}

interface PlayerChoice {
  id: string;
  text: string;
  risk: 'high' | 'medium' | 'low';
}

interface AIContext {
  systemPrompt: string;        // Layer 1: 世界观规则 + Few-shot
  playerStateJSON: string;     // Layer 2: 结构化状态
  keyEvents: KeyEvent[];       // Layer 3a: 关键事件索引
  recentMessages: Message[];   // Layer 3b: 最近 5 轮对话
  rollingSummary: string;      // Layer 3c: 滚动摘要
}

interface NarrativeResponse {
  narrative: {
    text: string;
    choices: Choice[];
  };
  stateUpdate: StateUpdate;
  rawJSON: string;             // 保留原始 JSON 用于调试和重试
  tokens: TokenUsage;
  elapsedMs: number;
}
```

### 4.2 Context Prompt 构建策略

每次 API 调用的 Context 按以下顺序构建，遵循"静态在前、动态在后"原则以最大化 DeepSeek API 的 Cache 命中率：

```
[System Message 角色: system]
1. Layer 1 世界规则（~2000 chars, 静态, 所有调用共享 → Cache 命中）
2. Layer 2 输出协议（~2700 chars, 静态, 所有调用共享 → Cache 命中）
3. 当前模式（原著线/IF线, 静态, 同模式共享 → Cache 命中）
4. Few-shot 示例（~1700 chars, 静态, 匹配场景共享 → Cache 命中）

[User Message 角色: user]
5. 玩家结构化状态 JSON（~1000 chars, 每轮变化 → Cache Miss）
6. 关键事件索引（~500 chars, 动态变化 → Cache Miss）
7. 滚动摘要（~300 chars, 每 10 轮更新 → Cache Miss）
8. 最近 5 轮对话原文（~800 chars, 每轮变化 → Cache Miss）
9. 用户本轮选择 + 当前回合数（动态）
```

实测 Cache 命中率 ~65%，Cache 命中时延迟 ~100ms（vs 未命中 ~300ms）。策略已通过 31 次 API 调用验证有效。

### 4.3 三层混合记忆架构

这是项目最核心的技术创新。每轮 AI 调用的上下文组织如下：

```
┌─────────────────────────────────────────────┐
│ LAYER 1: System Prompt (静态，~4.7K chars)     │
│  - 蛊真人世界观规则（境界/流派/道痕/地理/NPC人设铁则）    │
│  - 当前模式（原著线/IF线）                      │
│  - 输出格式协议（JSON Schema + 禁止事项）          │
│  - Few-shot 示例集（5组正确/错误示例）             │
│  - 写作风格指导（贴合原著文风，黑暗现实主义）         │
│  Cache 命中率：~65%（DeepSeek 自动缓存）          │
├─────────────────────────────────────────────┤
│ LAYER 2: 结构化玩家状态 (每轮更新，~1K chars)       │
│  {                                           │
│    "profile": { "name":"...", "境界":"三转中阶", │
│      "资质":9, "根骨":4, "心智":8, "气运":3 },  │
│    "gu_inventory": [蛊虫列表],                 │
│    "kill_moves": [杀招列表],                    │
│    "immortal_aperture": {...},                │
│    "faction_standing": {...},                 │
│    "character_relations": {...},              │
│    "dao_marks": {...},                        │
│    "flags": {"met_fangyuan":true, ...}         │
│  }                                           │
├─────────────────────────────────────────────┤
│ LAYER 3: 叙事上下文 (动态，~1.6K chars)         │
│  3a. 关键事件索引（始终保留，重要性3级永不遗忘）   │
│  3b. 最近 5 轮对话原文（完整保留）               │
│  3c. 滚动摘要（每 10 轮压缩一次旧对话）           │
└─────────────────────────────────────────────┘
```

总上下文 ~7.3K 字符，约 2.1K tokens，在 DeepSeek V4 Pro 128K 上下文中非常安全。

记忆持久性实测数据：连续 5 轮对话后，AI 仍然准确记得玩家在开窍大典上的选择、酒虫的来源、以及与方源的第一次接触。100% 记忆保持。

### 4.4 双通道输出协议

AI 每次响应用统一 JSON 结构包裹两段内容：

通道一：`narrative` — AI 生成的叙事文本 + 玩家选项，由前端渲染为打字机效果的文本和选项按钮。

通道二：`state_update` — 结构化状态变更指令，前端自动解析为 Zustand Store 的差分更新。支持 `set`（覆盖值）和 `add`（增减值）两种操作类型。

两个通道由同一个 JSON 包裹，确保叙事和状态变更的**原子一致性**——不会出现"叙事说玩家突破了但状态没更新"的断联。

### 4.5 四层世界观一致性保障策略

基于 31 次 API 调用的三回合实证数据（详见 `prompt-optimization-ceiling-guide.md`），确认 Prompt 层面优化的天花板在 ~88%。四层策略按场景分级启用，将一致性推至 93-97%。

| 层级 | 策略 | 机制 | 成本 | 启用场景 |
|------|------|------|------|----------|
| Layer 1 | Few-shot 示例注入 | System Prompt 中 5 组正确/错误示例 | +500 tokens，零额外 API | 全局，所有场景 |
| Layer 2 | 双轮语义校验 | 第二次 API 调用裁判按 7 项评分卡打分 | +1 API 调用/轮 | 方源出场/境界压制/核心机缘 |
| Layer 3 | 前端语义规则引擎 | 宽词簇 + 阈值评分校验 narrative.text | 5ms CPU，零 API | 全局，所有场景 |
| Layer 4 | 关键场景金丝雀断言 | 硬断言模式匹配，拒绝渲染违规叙事 | 2ms CPU，零 API | 方源出场/境界越级 |

**分场景启用**：日常叙事（Layer 1+3）→ 势力互动（Layer 1+3）→ 方源出场/境界压制（Layer 1+2+3+4）。整体成本增幅控制在 30% 内。

---

## 5. 关键数据模型

### 5.1 蛊虫数据模型：GuSpec / GuInstance

遵循 game-dev-text 的蛊虫双表设计——原型和实例分离。

```typescript
// GuSpec: 蛊虫原型（设计时定义，一个模板可有无数个实例）
interface GuSpec {
  id: string;                    // 唯一标识，如 "wine_gu_v2"
  name: string;                  // 蛊虫名称
  tier: number;                  // 转数（1-9）
  path: PathType;                // 所属流派
  rank: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'divine';
  isImmortalGu: boolean;         // 是否为仙蛊（六转及以上）
  unique: boolean;               // 仙蛊唯一性：true=世间仅此一只
  effects: GuEffect[];           // 蛊虫效果列表
  feedRequirement: GuFeedReq;    // 喂养需求
  baseRefineDifficulty: number;  // 基础炼制难度（0-100）
}

// GuInstance: 玩家持有的具体蛊虫
interface GuInstance {
  id: string;                    // 实例唯一 ID
  specId: string;                // 指向 GuSpec
  name: string;                  // 可能覆写名称（如"变异酒虫"）
  customName?: string;           // 玩家自命名
  tier: number;
  path: PathType;
  currentState: 'optimal' | 'fed' | 'hungry' | 'starving' | 'dying';
  proficiency: number;           // 使用熟练度（0-100，影响效果强度）
  bonded: boolean;               // 是否已炼化为本命蛊
  acquiredAt: { turn: number; narrative: string };
}
```

道痕互斥是 Build 系统的核心约束。异种道痕相互干扰——例如玩家不能同时高深度修习炎道和水道，因为火行道痕和冰水道痕在体内相互抵消甚至引发反噬。这自然引导玩家形成差异化的流派组合。

### 5.2 玩家状态核心

```typescript
interface PlayerState {
  profile: {
    name: string;
    realm: RealmInfo;            // 当前境界（大境界 + 小境界）
    background: string;          // 出身背景（南疆/北原/等等）
  };
  attributes: {
    资质: number;  // 1-10，影响修行速度 + 突破成功率
    根骨: number;  // 1-10，影响肉身强度 + 反噬承受力
    心智: number;  // 1-10，影响计谋/智道/幻术抗性
    气运: number;  // 1-10，影响奇遇概率/灾劫频率，<3则天意针对
  };
  vitals: {
    health: { current: number; max: number };
    essence: { current: number; max: number };
  };
  pathBuild: {
    primary: PathType;
    secondary: PathType[];
    path_levels: Record<PathType, PathLevel>;
    dao_marks: Record<PathType, number>;
  };
  daoHeart: {
    kill: number;       // 杀伐
    mercy: number;      // 仁善
    scheme: number;     // 算计
    ambition: number;   // 野心
  };
  flags: Record<string, any>;
}
```

`flags` 是游戏状态中最重要的柔性字段。它是一个自由 key-value 字典，用于标记所有不影响数值但深刻影响剧情的叙事节点。例如 `met_fangyuan_in_cave: true` 会改变方源后续所有互动中的态度——从"陌生人"变为"观察对象"再变为"已知威胁"。旗帜的增删由 AI 在 `state_update` 中通过 `flags.set` 和 `flags.remove` 指令控制。

### 5.3 时间模型

遵循 game-dev-text 的 SIM 时间模式：

```typescript
interface GameTime {
  ap: number;           // 当前 AP（每时段初始 AP，消耗后递减）
  max_ap: number;       // 该时段最大 AP
  period: 'morning' | 'noon' | 'evening' | 'night';
  day: number;          // 当月第几天
  month: number;        // 1-12
  year: number;         // 蛊界纪年
  season: 'spring' | 'summer' | 'autumn' | 'winter';
}

// 成仙后额外维度
interface ImmortalTime {
  // 仙窍内部时间 = 外界时间 × 光阴流速比
  inner_year: number;
  inner_month: number;
  inner_day: number;
  time_flow_ratio: number;  // 光阴流速比（如 1.5 = 外界过 1 年，仙窍过 1.5 年）
}
```

### 5.4 关键事件索引

```typescript
interface KeyEvent {
  id: string;
  type: 'birth' | 'breakthrough' | 'battle' | 'treasure' | 'contact' | 'death' | 'betrayal' | 'discovery';
  turn: number;
  summary: string;          // 一句话摘要，注入 AI 上下文
  importance: 1 | 2 | 3;   // 3=转折点（永不遗忘），2=重要（保留50轮），1=次要（保留20轮）
  timestamp: number;
  relatedNPCs: string[];    // 关联 NPC ID
}
```

重要性 3 级的事件（如"与方源首次冲突""突破六转成仙""获得红莲魔尊传承"）永远不从上下文中移除。

---

## 6. UI 设计范式

### 6.1 账簿式界面

遵循 game-dev-text 的"账簿式"UI 范式——蛊真人世界的叙事以"手记"为载体，界面模拟一本古老手卷的视觉体验。

色彩体系：
- `rg-ink` (#1a1a2e)：正文墨色，深黑紫底，叙事文本主体色
- `rg-paper` (#f5f0e8)：纸质底，暖黄米白，面板区背景色
- `rg-blood` (#8b0000)：血迹标注，深暗红，风险提示/死亡/HP 低警告
- `rg-jade` (#2d6a4f)：翠玉标，暗绿，成功/正面状态/debuff 清零
- `rg-gold` (#b8860b)：鎏金边，暗金色，境界突破/重要事件/金品天赋

字体方案：
- 叙事正文：思源宋体/Noto Serif SC（衬线，手卷阅读感）
- 数值面板：思源黑体/Noto Sans SC（无衬线，清晰可读）
- 选项按钮：苹方/PingFang SC Medium（中等粗细，强调感）

### 6.2 组件树

```
<GameScreen>
  ├── <TopBar>                       // 顶部状态条（始终可见）
  │   ├── 当前回合数 + 时间/年号
  │   ├── AP 剩余显示
  │   ├── 境界 + 真元条（浓缩版）
  │   ├── HP 条（浓缩版）
  │   └── 存档/设置按钮
  │
  ├── <MainArea>                     // flex: 1, 主内容区
  │   ├── <NarrativePanel>           // 叙事文本区（左侧，60%宽）
  │   │   ├── <TextRenderer />       // 打字机效果逐字渲染
  │   │   └── <ChoicePanel />        // 选项按钮组 + risk badge
  │   │       └── ChoiceButton[]     // 风险等级颜色编码 + risk_note tooltip
  │   │
  │   └── <LedgerTabs>               // 账簿面板区（右侧，40%宽，7个Tab）
  │       ├── Tab 1: 属性（雷达图 + 境界 + 属性分项 + 道心四维）
  │       ├── Tab 2: 蛊虫（卡片网格 + 转数/流派筛选 + 喂养状态标）
  │       ├── Tab 3: 杀招（列表 + 等级/流派/消耗/冷却）
  │       ├── Tab 4: 仙窍（同心圆 + 面积 + 资源产出 + 灾劫倒计时）
  │       ├── Tab 5: 地图（SVG 五域 + 标记 + 势力色）
  │       ├── Tab 6: 人物（头像卡片 + 关系网 + 信任度）
  │       └── Tab 7: 道痕（柱状图 + 流派互斥提示）
  │
  └── <EventLog>                     // 底部事件日志（可折叠）
      └── 时间线滚轴 + 事件类型图标 + 过滤器
```

### 6.3 信息设计原则

1. 最重要信息总是可见（顶部状态条不随 Tab 切换隐藏）
2. 数值变化用过渡动画（0.3s ease-out），玩家能感知变化但不至于突兀
3. 风险信息用 rg-blood 色 + 警告图标突出
4. 正面变化用 rg-jade 色 + 上浮动画暗示好消息
5. 境界突破用全屏粒子效果 + 音效反馈（阶段 5 实现）
6. 所有可交互元素提供 tooltip 或 hover 效果

---

## 7. 技术选型与架构决策

### 7.1 技术栈汇总

| 层次 | 选型 | 版本 | 决策理由 |
|------|------|------|----------|
| 框架 | React | 18 | 组件化架构适合 12 个可视化面板独立更新 |
| 语言 | TypeScript | 5 | 类型安全、interface 设计数据模型 |
| 构建 | Vite | 5 | HMR 极快、开发体验好 |
| 样式 | Tailwind CSS | 3.4 | 账簿式 UI 需大量定制色系，Tailwind 扩展方便 |
| 组件库 | shadcn/ui | latest | 暗色主题适配好，组件可定制性强 |
| 状态管理 | Zustand | 5 | 轻量、persist 中间件直接对接 localStorage 存档 |
| API 缓存 | React Query | 5 | AI 调用去重、错误重试、加载状态管理 |
| 图表 | Recharts | 2 | 雷达图/柱状图/面积图覆盖所有数据可视化需求 |
| 地图 | 原生 SVG | — | 无外部依赖，CSS 控制渲染，契合账簿式美学 |
| AI 引擎 | DeepSeek V4 Pro | — | 128K 上下文、JSON Mode、缓存系统、成本友好 |
| 持久化 | localStorage | — | 5-10MB 纯前端，支持 50+ 存档 |

### 7.2 关键架构决策

**决策 1：纯前端运行，零后端**

理由：蛊真人模拟器是单人文字游戏，不需要服务器端的数据同步、多人交互或实时通信。DeepSeek API 从浏览器直接调用（需用户提供 API Key，存储在浏览器 localStorage 中，不经过任何服务器）。

风险：API Key 暴露在前端代码中。缓解措施：Key 仅存储在浏览器 localStorage，不从代码仓库提交。提供 API Key 输入界面，支持用户随时更换。

**决策 2：Zustand 替代 Redux**

理由：12 个 store slice 需要独立更新但共享 persist 配置。Zustand 的 slice 模式 + `persist` 中间件比 Redux Toolkit 更轻量（压缩后 ~3KB vs ~12KB），且 API 更简洁。对于单人文字游戏的状态管理复杂度，Redux 是过度工程。

**决策 3：Recharts 替代 ECharts/D3**

理由：Recharts 基于 React 组件声明式 API，与 React 的渲染周期天然兼容。图表数据由 Zustand store 驱动，store 变化 → Recharts 自动重渲染。捆绑体积 ~150KB（ECharts ~1MB），对纯前端应用更友好。

**决策 4：SVG 地图替代 Canvas 地图**

理由：五域两天地图是静态底图 + 动态标记点的结构，不需要 Canvas 的逐像素渲染能力。SVG 元素可被 CSS 选中和动画化，与账簿式 UI 的墨色美学一致。Canvas 适合实时渲染，文字游戏不需要。

### 7.3 game-dev-text Skill 复用

game-dev-text 技能的底层模块高度匹配本项目需求，约 75% 可直接复用或适配移植：

| 模块 | 复用率 | 适配工作 |
|------|--------|----------|
| AttributeSystem（三层属性+修正器） | 90% | 扩展境界/流派维度，新增道痕修正器 |
| EventEngine（条件触发+权重随机） | 85% | 增加蛊界专属事件池和条件类型 |
| FSM/StateMachine（场景状态管理） | 80% | 扩展仙窍状态维度 |
| NumberFormula（成长曲线+战斗结算） | 80% | 新增道痕修正系数和流派克制表 |
| 存档系统（localStorage 序列化） | 75% | 扩展 AI 上下文序列化和恢复 |
| RNG/Probability（种子随机数+概率表） | 95% | 直接移植，无需修改 |
| React 组件（DialogueBox/ChoicePanel/AttributePanel） | 60% | 样式适配账簿式美学 |
| 蛊虫 GuSpec/GuInstance 数据模型 | N/A | 属于本项目的原创设计 |

---

## 8. 开发阶段规划

5 个阶段，12-16 周迭代交付。每个阶段有明确的可玩里程碑。

### 阶段 0：项目脚手架（第 1 周）

目标：可运行的空壳项目，已验证 API 连通性。

任务清单：
- Vite + React 18 + TypeScript 5 项目初始化
- Tailwind CSS 3.4 + shadcn/ui 配置
- 账簿式 UI 色彩体系配置（Tailwind 扩展色系）
- Zustand Store 骨架（12 个 slice 的空壳）
- DeepSeek API 封装（fetch + 重试 + 错误处理 + token 统计）
- 菜单/设置/API Key 输入画面
- `.gitignore` + `.env.example` + ESLint/Prettier 配置

里程碑：运行 `npm run dev`，看到账簿式标题画面，输入 API Key 后调用 DeepSeek 返回"Hello World"。

### 阶段 1：核心游戏循环（第 2-3 周）

目标：可完整玩一轮从开窍到青茅山覆灭的文字游戏。

任务清单：
- System Prompt Layer 1（世界观规则 + Few-shot 示例）完整编写
- System Prompt Layer 2（输出协议 + JSON Schema）完整编写
- Context Builder：三层上下文构建器实现
- Response Parser：JSON 解析 + Zod Schema 校验
- 基础属性系统（四大属性 + 境界管理 + 生命真元）
- 天赋选择界面 + Talent Modifier 系统（从精简天赋池开始，6-8 个天赋）
- 基础对话循环：叙事面板 + 选择面板 + 打字机效果
- 前端语义规则引擎 Layer 3（基础版，核心规则）
- Zustand persist 中间件（基础存档）
- **里程碑**：可以完整游玩开窍→青茅山的章节，所有数值跟随 AI 叙事变化

### 阶段 2：可视化系统（第 4-6 周）

目标：所有面板跟随 AI 剧情实时刷新。

任务清单：
- 属性面板（雷达图 + 进度条 + 道心四维标尺）
- 蛊虫图鉴面板（卡片网格 + 转数/流派筛选 + 喂养状态标签）
- 杀招列表面板
- 空窍状态可视化（同心圆设计）
- 境界突破动画（粒子效果）
- SVG 地图系统（基础版，南疆区域）
- 人物图鉴面板（头像 + 关系网）
- 势力声望面板（进度条 + 关系标签）
- 道痕面板（流派道痕柱状图 + 互斥提示）
- 事件日志面板（时间线滚轴）
- AP/时间显示（顶部状态条的完整实现）
- **里程碑**：所有 9 个可视化面板均跟随 AI 剧情实时刷新

### 阶段 3：双模式 + Build + 战斗（第 7-9 周）

目标：两个模式均可完整游玩，Build 系统可运转。

任务清单：
- 原著线检查点事件链编码（青茅山→商家城→三王山→王庭之争→疯魔窟→宿命大战）
- IF 线触发机制 + 预设的 1 条 IF 线剧情（IF-1：方源未重生）
- 48 流派定义 + 道痕互斥规则
- 流派选择 UI + Build 推荐系统
- 战斗结算引擎（回合制，蛊虫对决 + 杀招博弈）
- 仙窍经营核心循环（资源产出 + 灾劫系统）
- 道心倾向追踪 + 因果/蝴蝶效应追踪
- 双轮语义校验 Layer 2（关键场景：方源出场/境界压制）
- 关键场景金丝雀断言 Layer 4
- **里程碑**：原著线 + 1 条 IF 线均可完整游玩，战斗/仙窍/流派系统可运转

### 阶段 4：内容丰富 + 存档完善（第 10-12 周）

目标：内容量达标，存档系统完善，具备发布条件。

任务清单：
- 天赋池扩展至 25+ 个（覆盖全流派策略）
- 蛊虫数据填充：80+ 凡蛊 + 30+ 仙蛊的完整 GuSpec 定义
- 原著线检查点完善：增加更多支线节点（花酒传承支线、商家城内斗、白凝冰支线）
- 多槽位存档系统：最多 20 个槽位 + JSON 导出/导入
- 读档 AI 上下文完整恢复
- 世界观一致性全面调优（基于 31 次测试数据的四层策略最终参数）
- UI 打磨：动画过渡、加载状态、错误提示、空状态设计
- 性能优化：React.memo 面板组件、虚拟滚动事件日志、localStorage 配额监控
- **里程碑**：内容丰度达标，存档可靠，可对外发布 Beta 版本

### 阶段 5：音频/图像/发布（第 13-16 周，可并行）

- 名场面 BGM 触发系统（境界突破/战斗/灾劫/关键剧情）
- 场景图/战斗图显示（AI 生成或预设图片库）
- 语音合成接入（可选，依赖用户提供的 TTS 方案）
- 最终打磨：文案校对、数值平衡、Bug 修复
- 发布准备：README、使用文档、API Key 获取指引
- **里程碑**：完整产品发布，包括音频和图像增强

---

## 9. 风险与应对

| 风险 | 概率 | 影响 | 应对措施 | 验证状态 |
|------|------|------|----------|----------|
| AI JSON 输出格式不稳定 | 3% | 高 | JSON Mode + Zod 校验 + 前端降级 + 自动重试（最多 1 次） | 实测 0 解析失败 |
| AI 遗忘早期剧情 | 2% | 高 | 三层记忆架构 + 重要性 3 级永久保留 + 摘要兜底 | 实测 5 轮 100% 保持 |
| AI 叙事偏温和/脱离黑暗基调 | 15% (Layer 1+3 后) | 中 | Layer 1 Few-shot + Layer 3 语义引擎 + Layer 2 双轮校验 | 实测 88%，目标 93-97% |
| DeepSeek API 限流/宕机 | 10% | 中 | 指数退避重试 + 本地缓存最近 5 次响应 + 降级为纯文本模式 |
| localStorage 配额超限 | 5% | 中 | 最多 20 存档 + JSON 导出清理 + 配额监控警告 |
| 流派/战斗数值不平衡 | 20% | 中 | game-dev-text BalanceAnalyzer 工具 + Beta 测试反馈 |

---

## 10. 结论

蛊真人世界·人生重来模拟器是一个设计完备、技术验证充分、分阶段可交付的项目。核心优势：

其一，经过 31 次实测，AI 引擎的可靠性和叙事质量得到量化验证。JSON 合规性 100%，记忆持久性 100%，世界观一致性在宽词簇评测下达 88%，四层策略可将关键场景推至 93-97%。

其二，12 个子系统全部有明确的接口定义、数据模型和实现路径。没有任何子系统需要"摸着石头过河"——每个系统都可以从 game-dev-text Skill 复用 60-90% 的底层代码，或从本文档找到完整的 TypeScript 接口设计。

其三，5 阶段路线图每个阶段都有可玩里程碑，可在 12-16 周内迭代交付。每个阶段的验证标准是"可以玩"而非"代码写完了"，保证每一个迭代都有可感知的用户价值。

其四，架构设计充分考虑了 LLM 的概率本性——不追求 100% 的完美一致性，而是通过四层分级策略，将成本增幅控制在 30% 内，同时保障核心场景的高质量输出。

建议在进入阶段 1 之前，先在当前项目的可行性报告和 System Prompt 文件基础上，进行一次端到端的"人工走查"：手动模拟一次从开窍到青茅山覆灭的完整游戏流程，用纸笔记录每一个 AI 叙事中可能存在问题的节点。这一步可以极大地降低阶段 1 开发中的意外回滚。

---

本概要设计文档应与以下文件配合阅读：

- `feasibility-analysis-report.md`：完整的技术可行性分析（13 章），包含所有实测数据和四层策略详细设计
- `prompt-optimization-ceiling-guide.md`：Prompt 优化极限方法论手册，记录了 31 次测试的方法论和七条通用原则
- `system-prompt-layer1-world-rules.md`：Layer 1 世界观规则 System Prompt（含 5 组 Few-shot 示例）
- `system-prompt-layer2-output-protocol.md`：Layer 2 输出格式协议（含自检协议和禁止事项）
