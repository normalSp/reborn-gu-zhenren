# RebornG P3 详细开发计划

**生成日期**: 2026-05-04  
**文档版本**: v1.0  
**参考基线**: GDD v1.0、全书覆盖文档 v1.0、P2诊断报告、M7验收报告  
**当前状态**: P2 21/21 100%完成、M7 5/5阶段100%完成、158/158测试通过  

---

## 执行摘要

P3阶段的核心目标是将RebornG从"可玩原型"推向"可公开发布Beta"。总工时预估45-70天（单人每周20小时），6个里程碑按严格依赖顺序执行。每个里程碑有明确退出标准，不满足则不进入下一阶段。

P3最大的架构风险来自Q3决策——多人灵魂互动需要从纯前端架构扩展到PeerJS P2P异步通信，这打破了GDD"纯前端运行、零后端"的设计前提。方案已做降级设计：多人功能作为可选增强层，主游戏循环不依赖它运行。

P3完成后，玩家将可以：完整游玩南疆+北原两条故事线从开窍到蛊仙、在五域出生点体验不同开局、使用宝黄天拍卖行跨域交易、完成蛊仙升炼的完整流程（含仙蛊屋建造和仙窍战争）、在义天山和逆流河篇体验后四篇章的核心名场面、看到其他玩家的"灵魂残影"在世界中出现。

---

## 里程碑总览

| 里程碑 | 核心内容 | 工时 | 依赖 | 退出标准 |
|--------|---------|------|------|---------|
| **M0** | P0紧急修复+全局Bug排查 | 3-5天 | 无 | 4项P0全部验证通过+无新增回归Bug |
| **M1** | P1/P2质量加固 | 5-8天 | M0 | 8项P1/P2全部修复+BGM替换完成 |
| **M2** | 义天山+逆流河篇章补齐 | 12-18天 | M1 | 2篇×4章scene_constraint全定义+AI叙事验证通过 |
| **M3** | 金丝雀扩展+无障碍收尾 | 5-8天 | M2 | C14-C25规则生效+ARIA零Critical+颜色Token化 |
| **M4** | 四大核心系统 | 15-20天 | M3 | 拍卖/升仙/战斗/多人 4系统全运转 |
| **QA** | 全量回归+Beta发布 | 5-8天 | M4 | 测试全量通过+Builder打包成功+Beta checklist全满足 |

**总计**: 45-70天（约2.5-3.5个月单人全职）

---

## M0: P0紧急修复+全局Bug排查（3-5天）

### 背景
P2诊断报告发现了4项P0致命Bug。用户表示"之前修过"，因此M0的首要任务是验证当前代码库中这些Bug是否仍然存在。

### M0.1: 验证测试（Day 1）

逐项测试4项P0：

**P0-1: 域链路断裂测试**
- 测试步骤：启动游戏→选择中洲身份→完成角色创建→观察StatusBar显示的章节名
- 期望：应显示"第一章 · 宗门弟子"（中洲），而非"第一章 · 青茅山期"（南疆）
- 测试步骤2：AI生成的第一个选项应包含中洲背景的叙事（宗门/正道），而非"前往山寨"
- 涉及文件定位：
  - `src/store/initialState.ts:21` — `profile.background = '南疆'` 硬编码
  - `src/components/game/CharacterCreate.tsx:153-163` — 双重 initChapter 竞态
  - `src/engine/context-builder.ts:206-208` — injectChapterConstraints 数据源
  - `src/store/index.ts:367` — migrate 默认域

**P0-2: 存档继续游戏按钮测试**
- 测试步骤：玩几轮游戏→刷新浏览器→观察TitleScreen是否出现"继续冒险"按钮
- 期望：应出现按钮，点击后恢复之前的游戏状态
- 涉及文件：
  - `src/App.tsx:71` — onStart调用resetStore
  - `src/store/index.ts:156` — resetStore中localStorage.removeItem
  - `src/store/index.ts:307` — persist key 'gu-zhenren-save'

**P0-3: 成就持久化测试**
- 测试步骤：触发成就→刷新浏览器→检查成就面板
- 期望：已解锁成就应保持
- 涉及文件：
  - `src/store/slices/achievementSlice.ts:22-24` — 独立localStorage key
  - `src/main.tsx:25-31` — loadAchievementDefinitions
  - `src/engine/response-pipeline.ts:380-406` — checkAchievements调用

**P0-4: 舆图按钮测试**
- 测试步骤：选择非南疆域→观察底部工具栏地图按钮文字
- 期望：应动态显示"{当前域}舆图"（如"中洲舆图"）
- 注意：此问题随P0-1修复自动解决，验证链路即可

### M0.2: 修复执行（Day 2-3）

仅修复验证未通过的项。修复原则：
1. 每次只改一个缺陷点，改完立即测试
2. 不批量修改，避免A→B连锁Bug
3. 每个改动提交前进行"影响面分析"——列出所有消费该变量/函数的文件

### M0.3: 全局Bug排查（Day 3-4）

验证通过后，主动排查以下高风险区域：
- useGamePipeline.startGame竞态条件（与CharacterCreate的时序冲突）
- 存档迁移链路 v5→v6→v7 的所有默认值是否正确
- GameScreen初始化时序是否存在"先渲染后加载数据"的闪烁
- Zustand persist水合完成前的中间态是否会导致UI错误
- chapterSlice.flags.current_chapter与store.currentChapterId的同步性

### M0退出标准
- 4项P0全部验证通过（测试步骤手动执行）
- 无新增回归Bug（Vitest 158/158保持）
- 全局排查未发现新的P0级问题
- 域链路在5域×2轮开局的交叉测试中全部正确

---

## M1: P1/P2质量加固（5-8天）

### M1.1: BGM素材替换（Day 1-2）

当前BGM问题：Klaus Neumaier - Harpsichord Pack（大键琴独奏）完全不符合蛊真人黑暗修真风格。

替换方案：
- 从B站蛊真人角色梗曲获取素材（用户提供参考：方源角色曲=年轮）
- 使用网页搜索+web_fetch工具搜索B站蛊真人相关创作
- 搜索关键词方向：
  - 蛊真人 角色曲 方源 年轮
  - 蛊真人 BGM 古风
  - 蛊真人 同人曲 黑暗
- 五域BGM需求对应：
  - 南疆：山岚氛围/古琴+竹笛
  - 北原：苍茫草原/马头琴+呼麦
  - 东海：海浪波涛/空灵氛围
  - 西漠：大漠孤烟/西域乐器
  - 中洲：庄严秩序/编钟+古筝

注意：需要处理版权标注，在游戏内/README中注明BGM来源。

### M1.2: encounters.json补齐22→55条（Day 2-3）

当前覆盖：南疆青茅山11条 + 商路求生11条 = 22条

补齐目标：55条 = 22条现有 + 33条新增
- 南疆后3章（南疆风云/势力崛起/三王山前夜）× 各2-3条 = 8条
- 北原5章 × 各2条 = 10条
- 东海4章 × 各1-2条 = 5条
- 西漠4章 × 各1-2条 = 5条
- 中洲4章 × 各1-2条 = 5条

每条模板包含：触发条件、区域限制、5类型（战斗/探索/社交/资源/谜题）、叙事文本模板、奖励表。

### M1.3: 教程域定制+TutorialOverlay接入tutorialSlice（Day 3-4）

重构TutorialOverlay.tsx：
- 移除硬编码PAGES数组
- 改为根据store.currentDomain动态选择引导内容数组
- 接入tutorialSlice的FSM（startTutorial/advanceStep/skipTutorial/completeTutorial）
- 替换独立localStorage key为tutorialSlice的持久化机制
- 五域专属引导内容定义：
  - 南疆：山寨家族丛林法则引导
  - 北原：部落血统至上引导
  - 东海：散修自由探索引导
  - 西漠：绿洲生存优先引导
  - 中洲：宗门秩序规则引导

### M1.4: 其余P1/P2修复（Day 4-5）

- P1-3: 中洲exitTriggers格式统一为"→{目标域}域切换"
- P1-5: achievements.json移除重复_meta键
- P2-2: 修正context-builder.ts中洲配置"天元皇朝"→"十大门派/十大古派"
- P2-3: GameScreen BGM自动播放处添加AudioContext恢复逻辑
- P2-1: 确保TutorialOverlay与tutorialSlice完全对接

### M1退出标准
- 5项P1全部修复（M1.2补齐后P1-4也通过）
- 3项P2全部修复
- BGM素材已替换为蛊真人风格（至少南疆/北原/中洲3域）
- 域定制教程内容可通过UI正常浏览
- Vitest全量通过

---

## M2: 义天山篇+逆流河篇数据层补齐（12-18天）

### 架构说明

这两篇是蛊仙境界（七转-八转）的核心篇章。P2已覆盖凡蛊阶段（开窍→青茅山→商队→三王山→王庭福地，凡人→蛊仙初境），M2将故事线推进至全书中后期。

关键设计原则：篇章约束注入而非固定脚本，每个名场面定义scene_constraint + deviationTolerance。

### M2.1: 义天山篇（6-9天）

**篇章位置**：第五卷，七转-八转，对应原著约300章

**章节规划**（4章）：
1. 义天风云起 — 多方势力在义天山的集结，玩家选择站队
2. 巅峰对决 — 义天山巅峰之战，春秋蝉丢失的关键时刻
3. 天庭初现 — 天庭第一次正面介入，玩家感受"秩序"的力量
4. 乱局余波 — 混战后的势力重组，玩家的选择决定后续走向

**名场面清单**（6个）：
- 义天山巅峰之战（多方混战的全面对抗）
- 春秋蝉丢失（方源底牌被破，原著名场面）
- 天庭第一次正面介入（天庭势力展示）
- 多方混战（正魔散三方全面对抗，玩家必须在其中周旋）
- 天道反噬初现（逆天行为的第一次天道回应，玩家决定是否继续逆天）
- 战后势力重组（玩家在废墟中选择新盟友/新方向）

**数据交付物**：
- chapters.json扩展4条目，每条约50-80行JSON
- global-flags.json扩展3个L3标记
- encounters.json扩展8条（每章2条）
- npcs.json补充太白云生、黑楼兰、天庭使者等10-15个NPC

### M2.2: 逆流河篇（6-9天）

**篇章位置**：第六卷，八转，对应原著约250章

**章节规划**（4章）：
1. 逆流而上 — 逆流河现世，第一次对抗时光逆流
2. 宿命线索 — 追寻宿命蛊的踪迹，天庭全面介入
3. 时间交织 — 春秋蝉与逆流河的时间冲突，玩家的时间线被干扰
4. 不可能突破 — 在逆流河中突破极限，玩家需要做出"不可能的选择"

**名场面清单**（5个）：
- 逆流河上溯（对抗时光逆流的极限挑战）
- 宿命蛊线索浮现（追寻宿命蛊的踪迹，天庭倾力阻止）
- 天庭全面介入（天庭倾力阻止宿命蛊被破坏）
- 时间线交织（春秋蝉与逆流河的时间冲突，玩家看到"另一条时间线"的可能）
- 逆流而上突破（在不可能中创造可能，玩家的终极选择）

**数据交付物**：
- chapters.json扩展4条目
- global-flags.json扩展3个L3标记
- encounters.json扩展8条
- npcs.json补充5-10个NPC

### M2.3: AI叙事验证（贯穿M2）

每完成一章定义，立即用game-dev-text技能审查：
- 名场面约束是否过度约束（导致AI叙事读起来像填词游戏）
- 困境设计是否包含真正的蛊真人式两难（非数值选择）
- 跨域涟漪叙事是否符合各域叙事范式

### M2退出标准
- 义天山篇4章+逆流河篇4章完整定义
- 每章至少1个名场面含完整scene_constraint
- AI模拟测试：至少3个名场面的约束注入后AI输出不偏离核心事件
- game-dev-text审查通过（困境深度≥3/5 + 域范式一致性达标）

---

## M3: 金丝雀规则扩展+无障碍收尾（5-8天）

### M3.1: 金丝雀规则扩展（Day 1-3）

从当前13条扩展到25条：

**C14-C17: 跨域一致性约束（4条）**
- C14: 方源位置一致性 — "方源在南疆时，北原NPC不应提及方源近期行踪"
- C15: 天庭注意力 — "天庭在义天山事件发生前不应过度关注非中洲玩家"
- C16: 势力网络 — "北原黄金血脉不应在巨阳传承前与非北原玩家有直接交易"
- C17: 名场面跨域 — "非源发域玩家不应以L0参与度描述名场面"

**C18-C22: 五域特有约束（5条）**
- C18: 中洲正道 — "中洲正道NPC不应主动提议使用魔道手段"
- C19: 北原血统 — "非北原血统玩家不能通过常规途径觉醒黄金血脉"
- C20: 东海散修 — "东海散修不应表现出宗门式的组织纪律性"
- C21: 西漠生存 — "西漠NPC不应在非极端情况下浪费水资源"
- C22: 南疆家族 — "南疆NPC不应轻易接受外人进入家族权力核心"

**C23-C25: 仙级力量阈值约束（3条）**
- C23: 战斗力 — "非蛊仙NPC不应展示八转级别的战斗力"
- C24: 资源获取 — "仙蛊材料不应在非蛊仙境界获取"
- C25: 天意关注 — "天意对非逆天行为的关注度应随境界递增"

每条规则定义：正则匹配模式 + 语义触发条件 + 违规等级（strict/warn/info） + 修复建议

### M3.2: M7验收遗留项（Day 3-5）

1. **ARIA无障碍标注补全**
   - 交互组件（对话框/面板/控件）添加aria-label/role/aria-modal
   - 图标组件确保有合适的aria-label
   - 叙事文本区域添加合适的role

2. **颜色硬编码迁移CSS Token**
   - 全局搜索`#[0-9A-Fa-f]{6}`硬编码颜色
   - 将匹配Token的颜色替换为var(--gu-xxx)
   - 重点是CombatOverlay和NPCInteractionPanel

3. **Escape键关闭遮罩**
   - 4个Modal/Overlay添加keydown Escape监听
   - AttentionManager模式：关闭时焦点返回触发元素

4. **useDeviceCapability集成**
   - GameScreen根组件调用useDeviceCapability
   - 根据tier分级控制动画质量

### M3退出标准
- 25条金丝雀规则全部定义+测试覆盖
- axe DevTools扫描 零Critical/Serious问题
- 全局搜索无未迁移的硬编码颜色（与CSS Token匹配的颜色）
- Escape键关闭4个遮罩全部生效
- Vitest全量通过+金丝雀新规则测试通过

---

## M4: 四大核心系统（15-20天）

这是P3工时最密集的里程碑，4个系统各有独立的数据流和UI层。

### M4.1: 宝黄天拍卖系统（4-5天）

**设计目标**：跨域交易行，让玩家在蛊仙境界后有一个跨域经济交互的接口。

**核心数据模型**：
```typescript
interface AuctionItem {
  id: string;
  name: string;
  type: 'gu' | 'material' | 'formula' | 'secret' | 'info';
  tier: number;           // 1-9转
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  baseBid: number;        // 起拍价(元石)
  currentBid: number;
  domain: string;         // 上架域
  sellerNpc: string;      // 上架NPC
  expiresAt: number;      // 过期时间(游戏内回合数)
  bidHistory: BidRecord[];
}

interface AuctionState {
  items: AuctionItem[];   // 可用物品池（按域和境界过滤）
  listings: AuctionItem[];// 当前拍卖中的物品
  cooldownTurns: number;  // 下次拍卖冷却
}
```

**交付物**：
- `src/types/auction.ts` — 拍卖相关类型定义
- `src/store/slices/auctionSlice.ts` — Zustand薄切片（物品池+出价+持久化）
- `src/engine/auction-engine.ts` — 纯函数物品生成+出价结算+NPC模拟竞价
- `src/components/game/AuctionPanel.tsx` — 拍卖行UI（物品卡片网格+出价按钮+倒计时）
- 集成点：context-builder注入当前可拍卖物品信息

### M4.2: 蛊仙升炼完整版（5-7天）

**设计目标**：六转成仙后的完整成长系统，包含修行→产出一战争三个层次的闭环。

**核心功能模块**：

1. **仙蛊炼制公式** — 凡蛊升仙蛊的炼制公式，材料需求+成功率+道痕消耗
2. **灾劫5类分化** — 地灾/天劫/浩劫/万劫/混沌劫，按境界递增，每类有不同的应对策略
3. **仙元产出闭环** — 仙窍内光阴流速→仙元产出速率→仙蛊维护→灾劫倒计时的闭环
4. **仙蛊屋建造** — 仙蛊屋类型（防御型/产出型/战争型/传承型），建筑树系统
5. **仙窍策略战争** — 仙窍间的领土争夺，策略层类似简化4X
6. **天尊之路** — 从蛊仙→八转→九转→天尊的终极成长线

**数据模型核心**：
```typescript
interface ImmortalAscension {
  apertureType: 'blessed-land' | 'grotto-heaven';
  timeFlowRatio: number;    // 光阴流速比
  immortalEssence: number;  // 仙元储量
  daoMarkDensity: number;   // 道痕密度
  resourceNodes: ResourceNode[];
  calamities: Calamity[];
  buildings: ImmortalBuilding[];
  territories: ApertureTerritory[];
}
```

**交付物**：
- `src/types/ascension.ts` — 完整类型定义
- `src/store/slices/ascensionSlice.ts` — Zustand切片（扩展immortalSlice）
- `src/engine/ascension-engine.ts` — 纯函数升仙引擎
- `src/engine/refine-engine.ts` — 扩展仙蛊炼制公式
- `src/components/game/ApertureWarPanel.tsx` — 仙窍战争UI
- `src/components/game/ImmortalBuildingPanel.tsx` — 仙蛊屋建筑树UI

### M4.3: 战斗系统深化（3-4天）

**当前状态**：combat-engine.ts 13.75KB，回合制结算，CombatOverlay+NarrativeCombatPanel。

**深化方向**：

1. **流派克制可视化** — combat-config.json pathMatrix 15流派克制矩阵→战斗UI实时展示克制/被克制关系
2. **杀招链combo系统** — 连续使用同流派杀招触发combo加成（第N次+ N×5%威力）
3. **战前决策层** — BattlePreparationPanel：战前选择战略（全力攻击/防守反击/消耗战/速战速决），影响AI叙事方向和结算修正

**交付物**：
- 扩展combat-slice、combat-engine
- 新建BattlePreparationPanel.tsx
- combat-config.json可能需要扩展combo系数定义

### M4.4: 多人灵魂互动（3-4天）

**⚠️ 架构变更警告**：GDD明确说"不做多人/联机"，此功能是用户Q3确认的架构级新增。

**设计哲学**：不是实时多人游戏（那需要完整的MMO架构），而是**异步灵魂残影系统**——其他玩家的游戏状态以"灵魂残影"的形式出现在你的世界中。

**技术方案**：PeerJS P2P异步快照
- 不需要服务器中转（保持纯前端理念的延伸）
- 每隔N轮，将玩家的匿名状态快照（不含敏感信息）通过PeerJS广播
- 其他玩家的"灵魂残影"以NPC形式出现在世界中：他们的道号、境界、主要成就、最后一次重大选择
- 灵魂残影不交互（不能对话/交易/战斗），只作为World Context的一部分
- context-builder注入：当前世界中有多少个其他玩家的灵魂残影

**核心数据模型**：
```typescript
interface SoulMirror {
  id: string;              // 匿名ID（非用户真实信息）
  daoName: string;         // 道号
  realm: string;           // 境界
  domain: string;          // 当前域
  notableAchievements: string[]; // 主要成就
  lastBigDecision: string; // 最近一次重大选择的一句话摘要
  timestamp: number;       // 快照时间
}
```

**交付物**：
- `src/engine/soul-mirror-engine.ts` — P2P通信+快照序列化+匿名化
- `src/store/slices/soulMirrorSlice.ts` — 灵魂残影池管理
- context-builder扩展：injectSoulMirrors注入世界涟漪
- 注意：此功能作为可选增强，主游戏循环不依赖它运行

### M4退出标准
- 拍卖系统：5域×3境界级别的物品池正常生成，NPC模拟竞价正常
- 升仙系统：六转→九转完整晋升链路验证通过，灾劫触发和应对流程正常
- 战斗深化：combo系统+战前决策在至少3场战斗中验证
- 多人灵魂：PeerJS连接建立+快照收发+context注入正常（至少有2个模拟"其他玩家"）
- Vitest新增测试全部通过（至少+15个测试用例）
- game-dev-text审查经济系统平衡性和战斗平衡性

---

## QA: 全量回归测试+Beta发布准备（5-8天）

### QA.1: 自动化测试（Day 1-2）

- Vitest全量回归：确保原有158/158保持通过
- 新增模块测试：auction.test.ts + ascension.test.ts + combat.test.ts + soulMirror.test.ts
- 目标：新增≥20个测试用例

### QA.2: 端到端走查（Day 2-4）

5域×义天山/逆流河篇章的手动走查：
- 每域选择一章开始，模拟完整章节流程
- 验证转章动画+AI叙事+state_update+事件触发
- 验证跨域涟漪触发路径（南疆→北原、中洲→义天山等）

### QA.3: 存档兼容性（Day 4-5）

- 存档迁移v7→v8兼容性测试
- 旧存档（v3/v4/v5/v6/v7）加载→新版本正确合并默认值
- 连续多轮游戏→存档→读档→验证AI不"断片"

### QA.4: Beta发布准备（Day 5-7）

- 更新README.md（含安装步骤/API Key获取/游戏说明）
- 更新GDD版本号至v2.0
- BGM版权标注文件（ATTRIBUTION.txt）
- 提供无BGM模式（静音运行选项）
- 多人在线模式开关（默认关闭，需手动开启）
- Vite production build验证
- 本地部署验证（npm run preview）
- Beta发布checklist逐一确认

### QA退出标准（即P3整体退出标准）
- 所有测试通过（原有158 + 新增≥20 = 178+）
- Vite production build成功
- 5域×2篇章端到端走查无阻塞Bug
- 存档迁移全版本兼容
- README和GDD更新完毕
- Beta发布checklist全部满足
- **游戏可从开窍完整游玩至逆流河篇结束（约150-200轮），全系统正常运转**

---

## 附录A: 架构风险登记

| 风险 | 概率 | 影响 | 缓解 | 需用户确认 |
|------|------|------|------|-----------|
| 多人P2P连接不稳定（NAT穿透失败） | 30% | 中 | 降级：SoulMirror仅在局域网/可穿透时激活 | 否 |
| 蛊仙升炼完整版过于复杂（4X要素失控） | 20% | 中 | 仙窍战争简化：第一版仅领土争夺，建筑树减到5层 | 否 |
| BGM版权风险（B站梗曲非CC授权） | 40% | 低 | 标注来源+提供关闭BGM选项 | ⚠️ 是 |
| chapters.json突破200KB导致解析性能问题 | 15% | 中 | Web Worker lazy load备选方案 | 否 |
| 多人功能与"纯前端"定位冲突 | — | — | 明确标注为可选增强层 | 否 |

---

## 附录B: 需与用户二次沟通的事项

1. **BGM版权**：B站蛊真人角色梗曲通常非CC授权，Beta发布时需标注"仅供学习交流"还是寻找CC0替代？建议提供"关闭BGM"默认选项。

2. **多人P2P的可见性**：灵魂残影是否显示其他玩家的道号？如果用户用真名作为角色名（虽然概率低），是否需要额外匿名化层？

3. **Beta发布的渠道**：GitHub Pages？自行托管？EdgeOne Pages部署？如果是GitHub Pages，多人P2P不受影响；如果是其他渠道，需要考虑P2P信令服务器。

---

**文档结束**
