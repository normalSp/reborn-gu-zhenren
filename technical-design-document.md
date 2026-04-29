# 蛊真人模拟器 — 技术设计文档 (TDD)

**版本**: v1.0
**日期**: 2026-04-29
**状态**: 正式设计文档
**依赖**: game-design-document.md (GDD), feasibility-analysis-report.md (可行性报告), prompt-optimization-ceiling-guide.md (方法论)

---

## 文档目的

本文档是蛊真人模拟器的技术设计文档 (Technical Design Document)，在GDD确定了「做什么」的基础上，精确回答「怎么实现」。覆盖三个最关键的技术子系统：AINarrativeEngine（AI叙事引擎的完整响应管道）、Zustand Store（12个slice的精确架构）、数据流与错误处理（从玩家点击到UI刷新的完整异步链路）。

本文档不重复GDD中已定义的功能接口和产品需求，只补充实现级别的精确设计。

---

## 第一部分：AINarrativeEngine 技术设计

### 1.1 架构定位

AINarrativeEngine 是项目的核心引擎，封装所有与DeepSeek V4 Pro API的交互。它位于前端应用层和数据层之间——上层接收玩家选择，下层输出结构化叙事和状态更新。其职责范围明确限定为：构建AI上下文、发起API调用、解析和校验响应。它不负责游戏逻辑（那是EventEngine的职责），也不负责UI渲染（那是React组件的职责）。

### 1.2 Zod Schema 完整定义

以下四个Schema是AI响应管道的核心类型约束。所有Schema使用Zod定义，运行时校验，编译时TypeScript类型自动推导。

**Schema 1: NarrativeJSON — AI输出的根结构**

```typescript
import { z } from 'zod';

const RiskLevel = z.enum(['high', 'medium', 'low']);

const ChoiceSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1).max(50),
  risk: RiskLevel,
  risk_note: z.string().min(1).max(100),
});

const NarrativeJSONSchema = z.object({
  narrative: z.object({
    text: z.string().min(100).max(800),
    choices: z.array(ChoiceSchema).min(2).max(4),
  }),
  state_update: z.object({
    player: z.object({
      realm: z.object({ action: z.literal('set'), value: z.string() }).optional(),
      attributes: z.object({
        资质: z.object({ action: z.literal('add'), value: z.number() }).optional(),
        根骨: z.object({ action: z.literal('add'), value: z.number() }).optional(),
        心智: z.object({ action: z.literal('add'), value: z.number() }).optional(),
        气运: z.object({ action: z.literal('add'), value: z.number() }).optional(),
      }).optional(),
      health: z.object({ current: z.number(), max: z.number() }).optional(),
      essence: z.object({ current: z.number(), max: z.number() }).optional(),
    }).optional(),
    gu_inventory: z.object({
      add: z.array(z.object({
        name: z.string(), tier: z.number().min(1).max(9),
        path: z.string(), rarity: z.string(), description: z.string(),
      })).optional(),
      remove: z.array(z.string()).optional(),
    }).optional(),
    flags: z.object({
      set: z.record(z.string(), z.any()).optional(),
      remove: z.array(z.string()).optional(),
    }).optional(),
    faction: z.record(z.string(), z.object({ standing: z.number() })).optional(),
    causality: z.object({
      track: z.string().optional(),
      butterfly_effects: z.array(z.string()).optional(),
    }).optional(),
  }),
});

type NarrativeJSON = z.infer<typeof NarrativeJSONSchema>;
```

设计要点：`choices`数组必须包含2-4个选项（下限防止单一选择，上限防止选项爆炸）。`narrative.text`的长度约束为100-800字（GDD要求的200-500字在Schema中用min/max封闭，同时考虑AI偶发的超长输出）。`state_update`的所有顶层字段都是optional——如果本轮无变化，AI可省略对应字段。

**Schema 2: StateUpdate — 差分状态更新**

StateUpdate是从NarrativeJSON中提取的类型，但独立定义以支持差分更新逻辑。核心设计：`action`字段只有两种操作——`set`（覆盖值）和`add`（增减数值）。前端解析器根据action类型执行对应的Zustand store操作。

```typescript
type StateActionSet = { action: 'set'; value: any };
type StateActionAdd = { action: 'add'; value: number };

interface StateUpdate {
  player?: {
    realm?: StateActionSet;
    attributes?: {
      资质?: StateActionAdd;
      根骨?: StateActionAdd;
      心智?: StateActionAdd;
      气运?: StateActionAdd;
    };
    health?: { current: number; max: number };
    essence?: { current: number; max: number };
  };
  gu_inventory?: {
    add?: GuInventoryItem[];
    remove?: string[];
  };
  flags?: {
    set?: Record<string, any>;
    remove?: string[];
  };
  faction?: Record<string, { standing: number }>;
  causality?: {
    track?: string;
    butterfly_effects?: string[];
  };
}
```

**Schema 3: AIContext — AI调用上下文**

```typescript
interface AIContext {
  systemPrompt: string;      // Layer 1: 静态世界观规则 + Few-shot (~6400 chars)
  playerStateJSON: string;   // Layer 2: 结构化玩家状态JSON (~1000 chars)
  keyEvents: KeyEvent[];     // Layer 3a: 关键事件索引
  recentMessages: Message[]; // Layer 3b: 最近5轮对话原文
  rollingSummary: string;    // Layer 3c: 滚动摘要 (每10轮更新)
  mode: 'canon' | 'if';      // 当前模式
  turnNumber: number;        // 当前回合数
}

interface KeyEvent {
  id: string;
  type: 'birth' | 'breakthrough' | 'battle' | 'treasure' | 'contact' | 'death' | 'betrayal' | 'discovery';
  turn: number;
  summary: string;
  importance: 1 | 2 | 3;
  timestamp: number;
  relatedNPCs: string[];
}
```

**Schema 4: ValidationResult — Layer 3语义校验结果**

```typescript
interface ValidationResult {
  passed: boolean;
  score: number;             // 0-100
  ruleResults: RuleResult[];
  failedRules: string[];
  recommendation: 'accept' | 'retry' | 'warn_only';
}

interface RuleResult {
  ruleId: string;
  ruleName: string;
  passed: boolean;
  posHits: number;
  negHits: number;
  minPositive: number;
  maxNegative: number;
  detail: string;
}
```

### 1.3 响应管道状态机

AINarrativeEngine的响应管道是一个7状态12转移规则的有限状态机。这是项目最关键的技术设计——从玩家点击选项到叙事文本展示在屏幕上的完整路径，每一条可能的异常路径都有明确定义的处理策略。

**7个状态**:

- `IDLE`: 初始状态，等待玩家选择
- `BUILDING_CONTEXT`: 正在构建AI上下文包
- `FETCHING`: 正在调用DeepSeek API
- `PARSING`: 正在解析JSON响应
- `VALIDATING_L3`: 正在执行Layer 3前端语义校验
- `VALIDATING_L2`: 正在执行Layer 2双轮裁判校验
- `RESOLVED`: 响应通过所有校验，准备渲染
- `ERROR`: 所有重试耗尽，进入降级模式

**12条转移规则**:

```
IDLE → BUILDING_CONTEXT: 玩家点击选项按钮
BUILDING_CONTEXT → FETCHING: 上下文构建完成，发起API调用
FETCHING → PARSING: API返回200 OK
FETCHING → BUILDING_CONTEXT: API超时/网络错误，重试(最多2次)
FETCHING → ERROR: 2次重试后仍然失败
PARSING → VALIDATING_L3: JSON成功解析
PARSING → FETCHING: JSON解析失败，将失败反馈注入context后重试(最多1次)
PARSING → ERROR: JSON解析重试后仍然失败
VALIDATING_L3 → IDLE (展示): Layer 3通过 (日常场景)
VALIDATING_L3 → VALIDATING_L2: Layer 3未通过且为关键场景
VALIDATING_L2 → IDLE (展示): Layer 2裁判评分≥8分
VALIDATING_L2 → FETCHING: Layer 2裁判评分<8分，重新生成(最多2次)
VALIDATING_L2 → ERROR: 2次Layer 2重试后仍然<8分
```

**状态机实现骨架**:

```typescript
type PipeState = 'IDLE' | 'BUILDING_CONTEXT' | 'FETCHING' | 'PARSING' | 'VALIDATING_L3' | 'VALIDATING_L2' | 'RESOLVED' | 'ERROR';

class ResponsePipeline {
  state: PipeState = 'IDLE';
  retryCount = 0;
  maxRetries = 2;

  async process(playerChoice: PlayerChoice, store: RootStore): Promise<PipeResult> {
    this.state = 'BUILDING_CONTEXT';
    const context = this.buildContext(store);

    while (this.retryCount <= this.maxRetries) {
      try {
        this.state = 'FETCHING';
        const rawJSON = await this.callDeepSeekAPI(context);

        this.state = 'PARSING';
        const parsed = this.parseResponse(rawJSON);
        if (!parsed.success) {
          context.lastError = parsed.error; // 注入失败反馈
          this.retryCount++;
          continue;
        }

        this.state = 'VALIDATING_L3';
        const l3Result = this.layer3Validate(parsed.data.narrative.text);
        if (!l3Result.passed && this.isCriticalScene(store)) {
          this.state = 'VALIDATING_L2';
          const l2Result = await this.layer2Validate(parsed.data);
          if (l2Result.score < 8 && this.retryCount < this.maxRetries) {
            this.retryCount++;
            continue;
          }
        }

        this.state = 'RESOLVED';
        return { success: true, response: parsed.data, l3Result };
      } catch (err) {
        this.retryCount++;
        if (this.retryCount > this.maxRetries) {
          this.state = 'ERROR';
          return { success: false, error: err, degraded: true };
        }
      }
    }

    this.state = 'ERROR';
    return { success: false, error: 'Max retries exceeded', degraded: true };
  }

  private isCriticalScene(store: RootStore): boolean {
    const { flags } = store.narrativeSlice;
    return flags.met_fangyuan === true
      || flags.realm_gap_2plus === true
      || flags.core_opportunity === true;
  }
}
```

### 1.4 Layer 3 语义规则引擎评分算法

Layer 3是前端对AI叙事text进行宽词簇语义评分的引擎。它不调用API，纯CPU计算（约5ms），对所有场景全局启用。

**核心算法**:

```typescript
interface SemanticRule {
  id: string;
  name: string;
  positiveWords: string[];    // 正面词簇（7-20个）
  negativeWords: string[];    // 负面词簇（5-10个，出现则为违规）
  minPositiveHits: number;    // 最低正面词命中数
  maxNegativeHits: number;    // 最高负面词命中数（通常为0）
  weight: number;             // 权重（1-5）
}

function semanticScore(text: string, rule: SemanticRule): RuleResult {
  const lower = text.toLowerCase();
  let posHits = 0;
  let negHits = 0;

  for (const w of rule.positiveWords) {
    if (lower.includes(w.toLowerCase())) posHits++;
  }
  for (const w of rule.negativeWords) {
    if (lower.includes(w.toLowerCase())) negHits++;
  }

  return {
    ruleId: rule.id,
    ruleName: rule.name,
    passed: posHits >= rule.minPositiveHits && negHits <= rule.maxNegativeHits,
    posHits,
    negHits,
    minPositive: rule.minPositiveHits,
    maxNegative: rule.maxNegativeHits,
    detail: `${rule.name}: 正面命中${posHits}/${rule.minPositiveHits}, 负面命中${negHits}/${rule.maxNegativeHits}`,
  };
}

// 综合评分计算
function layer3Validate(text: string): ValidationResult {
  const results = RULES.map(rule => semanticScore(text, rule));
  const failed = results.filter(r => !r.passed);

  const weightedScore = results.reduce((sum, r, i) =>
    sum + (r.passed ? RULES[i].weight : 0),
  0) / results.reduce((sum, r) => sum + RULES[i].weight, 0) * 100;

  return {
    passed: failed.length === 0,
    score: Math.round(weightedScore),
    ruleResults: results,
    failedRules: failed.map(r => r.ruleId),
    recommendation: failed.length === 0 ? 'accept'
      : failed.length <= 1 ? 'warn_only'
      : 'retry',
  };
}
```

**阈值调参表**（基于31次测试数据校准）:

| 规则ID | 规则名 | 正面词簇 | 负面词簇 | minPositive | maxNegative | 权重 |
|--------|--------|---------|---------|-------------|-------------|------|
| R01 | NPC非友善 | 杀/死/危险/威胁/算计/利用/试探/怀疑/代价/条件/不容/威压 | 友善/信任/朋友/欣赏/帮助/免费/栽培/鼓励 | 2 | 0 | 4 |
| R02 | 方源威胁感 | 监视/打量/审视/布局/脊背发凉/猎人/猎物/灭口/必杀/寒意/眼神/杀意 | 友善/信任/合作/欣赏 | 2 | 0 | 5 |
| R03 | 境界压制 | 绝望/无力/不可反抗/天壤/逃/悬殊/秒杀/臣服/碾 | 周旋/反击/伤害/大战/对抗 | 1 | 0 | 3 |
| R04 | 机缘代价 | 代价/风险/反噬/条件/但是/不过/然而/切记 | 免费/白给/轻松/顺利/无风险 | 1 | 0 | 2 |
| R05 | 非爽文基调 | 冷/暗/血/死/苦/惨/残/玄/凶 | 碾压/无敌/横推/打脸/爽 | 2 | 0 | 4 |
| R06 | 选项风险 | — (不检查text, 检查choices数组) | — | — | — | 3 |
| R07 | 禁词检查 | — | 爽文/碾压/无敌/横推/打脸/开后宫 | 0 | 0 | 1 |

### 1.5 Layer 2 双轮裁判触发逻辑

Layer 2是对AI输出的第二次独立API调用裁判，按7项评分卡打分。由于每轮增加一次API调用（成本翻倍），仅对关键场景启用。

**触发条件决策树**:

```
当前场景是否满足以下任一条件？
├── 方源出场 (flags.met_fangyuan === true AND 本轮turn - 首次接触turn < 5)
│   └── → 触发Layer 2
├── 境界差距≥2转 (player境界 - NPC境界 >= 2)
│   └── → 触发Layer 2
├── 核心机缘触发 (flags.core_opportunity === true)
│   └── → 触发Layer 2
├── Layer 3 评分 < 60 (任何场景)
│   └── → 触发Layer 2 (兜底，防止严重违规遗漏)
└── 以上均不满足
    └── → 跳过Layer 2，直接展示
```

**异步编排**:

Layer 2裁判调用是Layer 1生成调用的后续步骤，必须等待Layer 1完成后再执行。由于两次调用共享相同的Cache前缀（System Prompt），只需改变user message部分。

```typescript
async function layer2Validate(narrative: NarrativeJSON): Promise<L2ValidationResult> {
  const judgePrompt = `你是一个独立的叙事裁判。请对以下蛊真人AI叙事按7项评分卡打分(0-10)。

评分卡:
1. NPC是否被描写为无条件友善/信任？(0=是/2=否)
2. 叙事基调是否符合蛊界残酷现实？(0=爽文/2=黑暗)
3. 核心NPC人设是否正确？(2分)
4. 境界差距描写是否恰当？(1分)
5. 机缘是否附带了对应代价和风险？(1分)
6. 选项是否全部含有独立风险提示？(1分)
7. 叙事是否包含禁词？(0=包含/1=否)

叙事文本: """${narrative.narrative.text}"""
选项: ${JSON.stringify(narrative.narrative.choices)}

返回JSON: {"scores": [item1, item2, ...], "total": 0-10, "verdict": "pass"|"fail", "reason": "string"}`;

  const response = await fetch(DEEPSEEK_API, {
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: judgePrompt }],
      response_format: { type: 'json_object' },
    }),
  });

  const result = await response.json();
  const parsed = JSON.parse(result.choices[0].message.content);
  return { score: parsed.total, passed: parsed.verdict === 'pass' && parsed.total >= 8, reason: parsed.reason };
}
```

评分阈值设定为8分（满分10），源于可行性报告中的分析——评分<8的叙事通常存在至少一项明确违规而非风格偏差，需要重新生成。

---

## 第二部分：Zustand Store 架构设计

### 2.1 总览

Zustand Store使用slice模式，12个slice各自独立定义State+Actions，通过`create`的合并器组合为RootStore。persist中间件确保游戏状态自动序列化到localStorage。

### 2.2 12个Slice完整类型定义

```typescript
// ─── 1. playerSlice ───
interface PlayerSlice {
  profile: { name: string; realm: RealmInfo; background: string };
  attributes: { 资质: number; 根骨: number; 心智: number; 气运: number };
  vitals: { health: { current: number; max: number }; essence: { current: number; max: number } };
  pathBuild: { primary: string; secondary: string[]; path_levels: Record<string, number>; dao_marks: Record<string, number> };
  daoHeart: { kill: number; mercy: number; scheme: number; ambition: number };
  // Actions
  applyStateUpdate: (update: StateUpdate['player']) => void;
  addModifier: (mod: AttributeModifier) => void;
  removeModifier: (id: string) => void;
}

// ─── 2. guSlice ───
interface GuSlice {
  inventory: GuInstance[];
  // Actions
  addGu: (gu: GuInstance) => void;
  removeGu: (id: string) => void;
  updateGuState: (id: string, state: GuInstance['currentState']) => void;
}

// ─── 3. killMoveSlice ───
interface KillMoveSlice {
  killMoves: KillMove[];
  cooldowns: Record<string, number>; // moveId → remaining cooldown turns
  // Actions
  learnKillMove: (move: KillMove) => void;
  useKillMove: (id: string) => void;
  tickCooldowns: () => void;
}

// ─── 4. pathSlice ───
interface PathSlice {
  primaryPath: string | null;
  secondaryPaths: string[];
  pathLevels: Record<string, number>;
  daoMarks: Record<string, number>;
  // Actions
  setPrimaryPath: (path: string) => void;
  addSecondaryPath: (path: string) => void;
  addDaoMarks: (path: string, amount: number) => void;
}

// ─── 5. talentSlice ───
interface TalentSlice {
  selectedTalents: Talent[];
  activeModifiers: AttributeModifier[]; // 来自天赋的修正器
  // Actions
  selectTalent: (talent: Talent) => void;
}

// ─── 6. factionSlice ───
interface FactionSlice {
  standings: Record<string, FactionStanding>;
  characterRelations: CharacterRelation[];
  // Actions
  updateStanding: (factionId: string, delta: number) => void;
  updateRelation: (charId: string, update: Partial<CharacterRelation>) => void;
}

// ─── 7. immortalSlice ───
interface ImmortalSlice {
  aperture: ImmortalAperture | null; // null = 未成仙
  // Actions
  initializeAperture: (aperture: ImmortalAperture) => void;
  tickAperture: (externalTime: number) => void; // 仙窍时间流逝结算
}

// ─── 8. causalitySlice ───
interface CausalitySlice {
  butterflyEffects: ButterflyEffect[];
  timelineDeviation: number; // 0-100
  // Actions
  trackEffect: (effect: ButterflyEffect) => void;
  updateDeviation: (delta: number) => void;
}

// ─── 9. eventSlice ───
interface EventSlice {
  eventQueue: GameEvent[];
  triggeredEvents: Set<string>;
  eventHistory: EventHistoryEntry[];
  // Actions
  enqueueEvent: (event: GameEvent) => void;
  dequeueAndTrigger: () => TriggerResult | null;
  markTriggered: (eventId: string) => void;
}

// ─── 10. narrativeSlice ───
interface NarrativeSlice {
  messages: Message[];          // 完整对话历史
  keyEvents: KeyEvent[];        // 关键事件索引
  rollingSummary: string;       // 滚动摘要
  currentNarrative: NarrativeJSON | null; // 当前展示的叙事
  isLoading: boolean;           // AI是否正在生成
  error: string | null;         // 最新错误信息
  // Actions
  appendMessage: (msg: Message) => void;
  addKeyEvent: (event: KeyEvent) => void;
  updateSummary: (summary: string) => void;
  setCurrentNarrative: (narrative: NarrativeJSON) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

// ─── 11. mapSlice ───
interface MapSlice {
  knownLocations: MapLocation[];
  playerPosition: { x: number; y: number; region: string };
  exploredRegions: Set<string>;
  fogOfWar: boolean;
  // Actions
  discoverLocation: (loc: MapLocation) => void;
  movePlayer: (pos: { x: number; y: number; region: string }) => void;
  revealRegion: (region: string) => void;
}

// ─── 12. uiSlice ───
interface UiSlice {
  activeTab: string;            // 当前展开的账簿Tab
  isSettingsOpen: boolean;
  isSaveDialogOpen: boolean;
  isEventLogExpanded: boolean;
  typewriterSpeed: number;      // ms/字
  // Actions
  setActiveTab: (tab: string) => void;
  toggleSettings: () => void;
  toggleSaveDialog: () => void;
  toggleEventLog: () => void;
  setTypewriterSpeed: (speed: number) => void;
}

// ─── RootStore 合并类型 ───
type RootStore = PlayerSlice & GuSlice & KillMoveSlice & PathSlice
  & TalentSlice & FactionSlice & ImmortalSlice & CausalitySlice
  & EventSlice & NarrativeSlice & MapSlice & UiSlice;
```

### 2.3 Slice依赖矩阵

当一个slice更新时，以下slice需要同步刷新（通过订阅或显式调用）。横轴为「被更新的slice」，纵轴为「需要刷新的slice」：

```
影响 → 被影响 ↓    player gu killMove path talent faction immortal causality event narrative map ui
player           │   -    ✗     ✗      ✗     ✗      ✗       ✗        ✗       ✗      ✓       ✗  ✗
gu               │   ✗    -     ✗      ✗     ✗      ✗       ✗        ✗       ✗      ✗       ✗  ✗
killMove         │   ✗    ✗     -      ✗     ✗      ✗       ✗        ✗       ✗      ✗       ✗  ✗
path             │   ✓    ✗     ✓      -     ✗      ✗       ✗        ✗       ✗      ✗       ✗  ✗
talent           │   ✓    ✗     ✗      ✗     -      ✗       ✗        ✗       ✗      ✗       ✗  ✗
faction          │   ✗    ✗     ✗      ✗     ✗      -       ✗        ✗       ✗      ✗       ✗  ✗
immortal         │   ✓    ✗     ✗      ✗     ✗      ✗       -        ✗       ✗      ✗       ✗  ✗
causality        │   ✗    ✗     ✗      ✗     ✗      ✗       ✗        -       ✗      ✗       ✗  ✗
event            │   ✓    ✓     ✗      ✗     ✗      ✓       ✓        ✗       -      ✗       ✗  ✗
narrative        │   ✓    ✓     ✓      ✓     ✓      ✓       ✓        ✓       ✓      -       ✗  ✗
map              │   ✗    ✗     ✗      ✗     ✗      ✗       ✗        ✗       ✗      ✗       -  ✗
ui               │   ✗    ✗     ✗      ✗     ✗      ✗       ✗        ✗       ✗      ✗       ✗  -
```

核心规律：AI的`state_update`每次更新`playerSlice`、`guSlice`、`factionSlice`等游戏状态slice，这些变化会触发`narrativeSlice`添加新消息和更新关键事件索引，然后所有受影响的UI面板自动重渲染（通过React的useSyncExternalStore或Zustand的selector订阅）。`narrativeSlice`是最繁忙的枢纽节点——它消费来自entitySlices的更新并驱动UI重渲染。

### 2.4 Persist配置

```typescript
import { persist } from 'zustand/middleware';

const useStore = create<RootStore>()(
  persist(
    (...a) => ({
      ...createPlayerSlice(...a),
      ...createGuSlice(...a),
      // ... 其余10个slice
      ...createUiSlice(...a),
    }),
    {
      name: 'gu-zhenren-save',
      version: 1,
      // 白名单：只有这些slice会被持久化
      partialize: (state) => ({
        // 持久化：所有游戏状态
        player: { profile: state.profile, attributes: state.attributes, vitals: state.vitals, pathBuild: state.pathBuild, daoHeart: state.daoHeart },
        gu: { inventory: state.inventory },
        killMoves: { killMoves: state.killMoves, cooldowns: state.cooldowns },
        path: { primaryPath: state.primaryPath, secondaryPaths: state.secondaryPaths, pathLevels: state.pathLevels, daoMarks: state.daoMarks },
        talent: { selectedTalents: state.selectedTalents, activeModifiers: state.activeModifiers },
        faction: { standings: state.standings, characterRelations: state.characterRelations },
        immortal: { aperture: state.aperture },
        causality: { butterflyEffects: state.butterflyEffects, timelineDeviation: state.timelineDeviation },
        event: { triggeredEvents: Array.from(state.triggeredEvents), eventHistory: state.eventHistory },
        narrative: { messages: state.messages, keyEvents: state.keyEvents, rollingSummary: state.rollingSummary },
        map: { knownLocations: state.knownLocations, playerPosition: state.playerPosition, exploredRegions: Array.from(state.exploredRegions), fogOfWar: state.fogOfWar },
        // 不持久化：ui状态（activeTab, isSettingsOpen, isLoading, error等）
      }),
      // 版本迁移
      migrate: (persistedState, version) => {
        if (version === 0) {
          // 未来版本迁移逻辑
        }
        return persistedState as RootStore;
      },
    }
  )
);
```

关键设计：`uiSlice`不持久化——`activeTab`、`isSettingsOpen`、`isLoading`、`error`等纯UI状态在刷新页面后重置为默认值。`eventSlice`的`eventQueue`不持久化（队列在游戏中形成，刷新后重新计算可触发事件池）。

### 2.5 Middleware链

```typescript
// middleware 链: persist → immer → devtools
// 顺序: 最外层 persist(最先生效) → immer(中间层) → devtools(最内层)
//
// persist在最外层: localStorage的读写发生在store的最外层，确保序列化的是完整状态
// immer在中间层: 所有slice的set操作自动转为immutable更新，但persist看到的是序列化后的纯对象
// devtools在最内层: 捕获的是immer处理后的状态变更，Redux DevTools显示的state是immer展开后的可读版本

import { persist, devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

const useStore = create<RootStore>()(
  devtools(
    immer(
      persist(
        (...a) => ({ /* 12 slices */ }),
        { name: 'gu-zhenren-save', version: 1, partialize: /* ... */ }
      )
    ),
    { name: 'GuZhenrenStore' }
  )
);
```

---

## 第三部分：数据流与错误处理架构

### 3.1 时间序数据流图

从玩家点击选项到UI刷新的完整异步链路（12步）：

```
Step 01 [同步]: 玩家点击选项按钮 → ChoicePanel.onClick(choiceId)
Step 02 [同步]: 从narrativeSlice.currentNarrative.choices中找到对应Choice对象
Step 03 [同步]: 构建PlayerChoice { id, text, risk }
Step 04 [同步]: ContextBuilder.build(store) → 构建AIContext { systemPrompt, playerStateJSON, keyEvents, recentMessages, rollingSummary, mode, turnNumber }
Step 05 [同步]: narrativeSlice.setLoading(true) → UI显示「正在生成叙事...」
Step 06 [异步]: ResponsePipeline.process(playerChoice, store)
  ├── 06a: fetch(DEEPSEEK_API, { body: JSON.stringify({ messages: [...] }) }) → 返回 AIResponse
  ├── 06b: NarrativeJSONSchema.parse(aiResponse) → 成功: 解析为NarrativeJSON | 失败: 触发重试
  ├── 06c: layer3Validate(narrative.text) → 通过: 继续 | 未通过且关键场景: 触发Layer 2
  └── 06d: layer2Validate(narrative) → 评分≥8: 通过 | <8: 重新生成
Step 07 [异步]: React Query缓存写入 → queryClient.setQueryData(['narrative', turnNumber], response)
Step 08 [同步]: narrativeSlice.setCurrentNarrative(narrative) → 更新当前展示的叙事
Step 09 [同步]: narrativeSlice.appendMessage({ role: 'assistant', content: narrative.text })
Step 10 [同步]: parseStateUpdate(narrative.state_update) → 差分更新所有entitySlices
  ├── playerSlice.applyStateUpdate(update.player)
  ├── guSlice.addGu / removeGu (update.gu_inventory)
  ├── factionSlice.updateStanding (update.faction)
  ├── ImmortalSlice的更新 (update.immortal_aperture)
  └── eventSlice.enqueueEvent (基于flags变化检测触发)
Step 11 [同步]: narrativeSlice.setLoading(false) → UI隐藏加载状态
Step 12 [同步]: 所有订阅了受影响slice的React组件自动重渲染 (Zustand selector机制)
```

### 3.2 React Query缓存键策略

React Query在此项目中不用于管理AI叙事（叙事由Zustand直接管理），而是用于以下四个辅助场景：

| 场景 | 缓存键模板 | 失效规则 | 说明 |
|------|-----------|---------|------|
| 摘要压缩 | `['summary', turnNumber]` | 永不失效，手动覆盖 | 每10轮调用compressHistory时写入新的摘要 |
| 存档列表 | `['saves', 'list']` | 保存/删除时失效 | 存档槽位列表查询 |
| 蛊虫图鉴查询 | `['gu', 'spec', guId]` | 永不失效（静态数据） | GuSpec模板数据，设计时定义 |
| API可用性检测 | `['api', 'health']` | staleTime: 60s | 定期ping DeepSeek API确认可用 |

不使用React Query缓存AI叙事响应的原因：AI叙事具有「一次生成、立即消费、不可复用」的特性。每轮API调用的上下文（玩家状态JSON+关键事件索引+最近5轮对话）是唯一的，缓存命中意味着玩家状态已变化但AI看到了旧叙事——这是严重Bug。

### 3.3 全局UI三态管理

项目中的UI状态分为三种，通过统一的模式管理：

**Loading状态**:

触发条件：玩家点击选项后、API调用进行中。表现：叙事面板显示打字机占位动画（闪烁光标），选项面板禁用所有按钮，顶部状态条显示「正在生成...」旋转指示器。实现：`narrativeSlice.isLoading`驱动所有UI组件的loading变体。超时处理：如果`isLoading`持续超过15秒未变化，触发超时警告——在叙事面板中显示「API响应超时，正在重试（第N次）...」。

**Error状态**:

分三级处理：

一级错误（自动恢复）——JSON解析失败、Layer 3评分<60。处理：ResponsePipeline自动重试，UI不打断玩家体验，仅在顶部状态条短暂闪烁黄色警告图标（持续2秒后消失）。

二级错误（需要Layer 2介入）——关键场景Layer 3未通过。处理：自动触发Layer 2双轮裁判。UI显示「正在深度校验叙事质量...」而非Error状态。如果Layer 2通过（评分≥8），直接展示叙事，玩家无感知。

三级错误（不可恢复）——API连续3次超时/网络错误、JSON解析2次重试失败、Layer 2重试2次后评分仍<8。处理：进入降级模式。显示预设的兜底叙事文本（从`FALLBACK_NARRATIVES`数组中读取），提示玩家「AI服务暂时不可用，请稍后重试」。选项替换为「继续等待」「重新开始本章节」「返回主菜单」三个固定选项。`narrativeSlice.error`设置错误详情。

**Success状态**:

叙事通过所有校验后正常展示。打字机效果逐字渲染（默认20ms/字，可在设置中调整），渲染完成后启用选项按钮。叙事面板添加淡入过渡动画（0.3s ease-in），状态面板的数字变化使用0.3s ease-out过渡。

**三态状态机实现**:

```typescript
type UIStatus = 'idle' | 'loading' | 'success' | 'error_degraded';

interface UIState {
  status: UIStatus;
  retryCount: number;
  lastError: string | null;
}

const uiStateMachine: Record<UIStatus, Partial<Record<UIStatus, () => void>>> = {
  idle: {
    loading: () => { /* 禁用选项按钮 */ },
  },
  loading: {
    success: () => { /* 启用在选项按钮 + 开始打字机效果 */ },
    error_degraded: () => { /* 显示兜底叙事 + 禁用选项 */ },
  },
  success: {
    loading: () => { /* 新一轮开始 */ },
  },
  error_degraded: {
    loading: () => { /* 玩家选择「继续等待」重新尝试 */ },
  },
};
```

---

## 结论

本文档从三个最关键的维度定义了蛊真人模拟器的实现级技术设计：

AINarrativeEngine的响应管道用7状态12转移的状态机覆盖了所有异常路径——从API超时到JSON解析失败到Layer 3/2校验不通过，每一条路径都有明确的处理策略。Zod Schema的字段级定义确保了AI输出和前端解析之间的类型契约牢不可破。

Zustand Store的12个slice设计中，依赖矩阵明确了更新传播规则，persist白名单排除了纯UI状态，middleware链的顺序（persist→immer→devtools）确保了持久化、不可变更新和开发调试的正确性。

数据流与错误处理架构定义了从玩家点击到UI刷新的12步完整时间序链路，React Query仅用于辅助查询而非AI叙事管理，三级错误处理确保在任何异常情况下玩家都不会面对空白屏幕。

与GDD配合阅读，本文档消除了所有「写得很好但不知道怎么实现」的模糊地带。

---

## 参考文献

1. `game-design-document.md` — 蛊真人模拟器概要设计文档 (GDD, §4 AI叙事集成方案, §3.3 状态管理设计)
2. `feasibility-analysis-report.md` — 技术可行性分析报告 (§4 长上下文记忆方案, §5 AI文本→前端状态映射, §17.1 四层策略)
3. `prompt-optimization-ceiling-guide.md` — Prompt优化极限方法论 (§3 七大原则, §4.4 语义评分函数设计)
4. `system-prompt-layer1-world-rules.md` — System Prompt Layer 1 世界观规则 (§12 Few-shot示例集)
5. `system-prompt-layer2-output-protocol.md` — System Prompt Layer 2 输出协议 (§JSON Schema, §自检协议)
6. game-dev-text Skill: `C:\Users\11411\.codebuddy\skills\game-dev-text\assets\core-frameworks\react-game\`
