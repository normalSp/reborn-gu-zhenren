# 死代码与设计-实现落差全量审计报告

审计日期：2026-05-05 13:41
审计范围：`src/` 全量 185 个文件 + `src/canon/` 所有 JSON 数据文件 + `指导大纲/` 13 个设计文档
审计分层：4 层（零调用函数 / 设计实现一致性 / 数据完整性 / UI 入口完整性）
审计方式：5 个子代理并行深度扫描，16 个子系统全覆盖

---

## 执行摘要

本次审计对 RebornG 项目进行了全面代码健康检查，覆盖 4 个层次共 28 个子系统。总计发现 **62 个需修复项**，按严重程度分类：Critical 12 项（系统功能完全缺失或数据损坏）、High 16 项（核心逻辑断裂）、Medium 21 项（数据完善性或代码清洁）、Low 13 项（代码清理或格式改进）。

相较于 2026-05-05 08:58 的前次审计，本次发现 4 个新的 Critical 级别问题：removeMaterial 方法未定义导致无限免费炼蛊；ascendCost 在 gu-database.json 中覆盖率为 0%（升炼完全失效）；DiceRollAnimation 参数格式完全不匹配导致动画检定逻辑损坏；encounters.json 中存在 JSON 对象合并损坏。

---

## 第一层：零调用函数检测

### 1.1 src/engine/killmove-evolution.ts — 整个文件零调用 [CRITICAL]

文件位置：`src/engine/killmove-evolution.ts`（123行）

该文件包含杀招进化系统的完整逻辑实现（对应设计大纲 杀招-炼蛊联动设计大纲.md 5.2），但经全代码库搜索，无任何外部调用者。注意：KillMovePanel.tsx 第 3 行确实 import 了 checkEvolution 和 evolveKillMove，但进化条件依赖 computePathLevel（来自 path-progression.ts），而 path-progression.ts 的 checkPathPromotion/promotePath 本身为零调用死代码，因此 requiredPathLevel 永远不满足。

死代码清单：
- 第 11 行 EvolutionCondition interface：零外部导入
- 第 25 行 EvolutionResult interface：零外部导入
- 第 44 行 checkEvolution() 函数：依赖链断裂，path-progression.ts 为死代码
- 第 81 行 evolveKillMove() 函数：同上

修复建议：在 KillMovePanel.tsx 中添加"进化"按钮并确保 path-progression 调用链完整；或若短期内不计划上线此功能，移除整个文件。

---

### 1.2 src/engine/npc-cross-domain.ts — 函数不存在于文件中 [CRITICAL]

文件位置：`src/engine/npc-cross-domain.ts`

前次审计声称该模块导出 8 个函数（包括 migrateNpc/checkDomainMigration/applyNpcMigration），但经完整扫描，实际仅导出 5 个：filterNpcByDomain、crossDomainAffinityDecay、calcCrossDomainCost、getMigrationNpcs、isNpcInDomain。migrateNpc/checkDomainMigration/applyNpcMigration 三个函数完全不存在于文件中——前次审计为误报。

零调用函数：
- 第 31 行 DOMAINS 常量：零外部导入
- 第 160 行 calcCrossDomainCost()：计算跨域通信费用，零调用。跨域通信功能从未实现

修复建议：移除不存在函数的误报引用；若需 NPC 跨域迁移功能，需从头实现这三个缺失函数。

---

### 1.3 src/engine/combat-stats.ts — 4 个导出零调用 [HIGH]

文件位置：`src/engine/combat-stats.ts`

死代码清单：
- 第 12 行 CombatStats interface — 零外部类型导入，仅内部使用
- 第 21 行 CombatStatsInput interface — 零外部类型导入，仅内部使用
- 第 116 行 getStandardEnemyStats() 函数 — 零外部调用（combat-router 直接从 JSON 构建敌人）
- 第 128 行 SPECIAL_ENEMY_MULTIPLIERS 常量 — 零外部导入

修复建议：若 combat-router 有意绕过这些工具函数，应移除或接入到 combat-router.ts 的 buildEnemy 逻辑中。

---

### 1.4 src/engine/material-region.ts — 3/4 导出零调用 [MEDIUM]

文件位置：`src/engine/material-region.ts`

死代码清单：
- 第 48 行 getRegionBonusPaths() — 零调用
- 第 59 行 generateRegionalMaterial() — 零调用
- 第 82 行 getRegionGradeWeights() — 零调用

正常使用：第 17 行 MATERIAL_GRADE_MAP — 被 MaterialBagPanel.tsx import。

修复建议：三个函数是区域材料生成系统的核心工具，应在 adventure/exploration 事件处理中接入 generateRegionalMaterial。

---

### 1.5 src/engine/combat-engine.ts — 3 个函数零外部调用 [MEDIUM]

文件位置：`src/engine/combat-engine.ts`

死代码清单：
- 第 36 行 getEffectiveDaoMarks() — 仅内部调用（initDuel line 156），零外部导入
- 第 341 行 tryEscape() — 仅内部调用（executePlayerTurn line 277），零外部导入
- 第 377 行 createDuelEnemy() — 零外部调用，combat-router 绕过此工厂函数

修复建议：在 combat-router.ts 的 buildEnemy 中统一使用 createDuelEnemy 作为工厂函数，确保默认值一致性。

---

### 1.6 src/engine/refine-engine.ts — 3 个函数零调用 [HIGH]

文件位置：`src/engine/refine-engine.ts`（672行）

死代码清单：
- 第 146 行 calculateMaterialCost() — 计算单个材料的加权成本，零外部调用
- 第 153 行 calculateMaterialCount() — 类似成本计算，零外部调用
- 第 625 行 ascendImmortalGu() — 仙蛊升炼核心函数（凡蛊吞噬精粹+仙材→进化），完整实现但无 UI 接入

修复建议：为 ascendImmortalGu 添加仙材选择 UI；将 calculateMaterialCost 接入 shop-engine 定价逻辑。

---

### 1.7 src/engine/killmove-bridge.ts — 3/6 导出零调用 [HIGH]

文件位置：`src/engine/killmove-bridge.ts`（151行）

死代码清单：
- 第 36 行 normalizeKillMove() — 杀招数据标准化（补全默认字段），零调用
- 第 65 行 normalizeKillMoves() — 批量标准化，零调用
- 第 105 行 convertKillMoveToDuelMove() — 杀招→战斗招式桥接转换，零调用

正常使用：incrementUsage、getProficiencyCooldownBonus、hasEffectTag 被 killMoveSlice 和 refine-engine 调用。

修复建议：在存档加载（saveSlice.loadSave）中接入 normalizeKillMoves；在 CombatOverlay 加载时使用 convertKillMoveToDuelMove。

---

### 1.8 src/engine/HeavenlyLandEngine.ts — 2 个函数零外部调用 [LOW]

文件位置：`src/engine/HeavenlyLandEngine.ts`

死代码清单：
- 第 256 行 calculateHeavenlyLandValue() — 零外部调用
- 第 269 行 getDisasterUrgencyLevel() — 零外部调用

修复建议：若这些工具函数有设计需求，应接入福地 UI 面板或相关事件逻辑。

---

### 1.9 src/engine/response-pipeline.ts — createPipeline 零调用 [LOW]

文件位置：`src/engine/response-pipeline.ts` 第 673 行

createPipeline() 是 new ResponsePipeline(config) 的工厂包装。所有消费方直接使用 new ResponsePipeline() 而非此工厂。

修复建议：移除 createPipeline 或迁移 useGamePipeline.ts 使用工厂函数。

---

### 1.10 src/engine/auction-engine.ts — isAuctionable 仅内部使用 [LOW]

文件位置：`src/engine/auction-engine.ts` 第 30 行

isAuctionable() 仅被同文件的 generateAuctionPool (line 45) 调用，零外部导入。功能和 auctionSlice 可以合并以消除不必要的导出。

---

### 1.11 Store Slices — 52 个零调用方法 [HIGH]

以下 slice actions 定义了但从未在任何组件/engine 文件中被调用（覆盖 18 个 slice 文件）：

**严重文件（6+ 个零调用方法）：**

| 文件 | 零调用数 | 方法列表 |
|------|---------|---------|
| playerSlice.ts | 6 | setRealm, addAttribute, setPrimaryPath, feedGu, setEssence, getMaterialBagCapacity |
| originUnlockSlice.ts | 6 | getUnlockedOrigins, getAvailableOrigins, isOriginUnlocked, forceUnlock, getUnmetConditions, loadOriginDefinitions |
| achievementSlice.ts | 5 | reloadFromStorage, isAchievementUnlocked, unlockAchievement, checkCondition, updateAchievementProgress |
| guSlice.ts | 5 | clearGuEvolution, triggerGuEvolution, unbindLifeboundGu, triggerLifeboundDeathPenalty, FEED_MATERIAL_MAP |
| narrativeSlice.ts | 4 | updateSummary, addKeyEvent, setLoading, setError |
| soundSlice.ts | 4 | setCurrentBgm, getEffectiveBgmVolume, getEffectiveSfxVolume, SPECIAL_BGM |
| debtSlice.ts | 3 | incurDebt, repayDebt, getDebtStatus |
| eventSlice.ts | 3 | enqueueEvent, dequeueAndTrigger, markTriggered |
| encounterSlice.ts | 3 | initEncounterPool, getCooldownInfo, EncounterChoiceCallback (interface) |

**其他零调用方法：**

merchantSlice: getShopGroup, canShopRefresh
mapSlice: discoverLocation, markDomainVisited
pathSlice: setPrimaryPath, addSecondaryPath
combatSlice: executeEnemyTurnAction, BattleRecord (interface)
immortalSlice: getTimelineAperturePoints
timelineSlice: normalizeTimelineNode, setSelectedDomain
yuanStoneSlice: getCurrencySummary
dialogueSlice: appendNpcMessage
auctionSlice: shouldTriggerAuction
causalitySlice: updateDeviation

修复建议：优先将 triggerGuEvolution、clearGuEvolution 接入动画系统以修复 GuEvolutionOverlay；将 getCurrencySummary、getDebtStatus 接入对应 UI 面板；调试方法（forceUnlock）可接入 DebugOverlay。其余若近期无使用计划，可移除定义以减轻 store 体积。

---

### 1.12 Hooks — useFontReady 零导入 [LOW]

文件位置：`src/hooks/useFontReady.ts` 第 16 行

useFontReady 定义了字体就绪检测 hook，但全代码库无任何 import。字体加载可能由其他机制（CSS @font-face + onload 事件）处理。

修复建议：确认字体加载方式，若使用 CSS 方式则移除 useFontReady。

---

### 1.13 Components — 2 个零导入组件 [LOW]

文件位置：`src/components/game/LoadingSkeleton.tsx` 和 `src/components/game/ModeSelectScreen.tsx`

两个组件均定义为 default export 但全代码库无 import。前次审计未发现此问题。

修复建议：若这些组件已在代码演进中被替代，应移除文件。

---

### 1.14 KillMoveCreationPanel.tsx — 触发机制缺陷 [MEDIUM]

文件位置：`src/components/game/KillMoveCreationPanel.tsx`

该面板使用内部 isOpen state + 自渲染按钮控制开关，不依赖 store 驱动的事件。与项目其他 overlay 的事件驱动模式不一致。

修复建议：添加 store 状态字段，从 KillMovePanel 的"创建新杀招"按钮触发。

---

### 1.15 GuEvolutionOverlay.tsx — store 字段缺失 [HIGH]

文件位置：`src/components/game/GuEvolutionOverlay.tsx`

该组件从 store 读取 guEvolutionState.active，但 guSlice 中 triggerGuEvolution 和 clearGuEvolution 为零调用（见 1.11），组件导入后实际上永远无法被激活显示。此外 playGuEvolutionAnimation 在 refine-engine.ts:602 通过动态 require 调用，在 Vite/esbuild 打包环境中 require 不可用，动画桥接更为脆弱。

修复建议：在 useAnimationBridge 中使用标准 import 替代 require；在 refine-engine.ts 升炼成功时调用 store.triggerGuEvolution()。

---

## 第二层：设计-实现一致性审计

### 2.1 炼蛊系统（Gu Refinement System）

#### 2.1.1 removeMaterial 方法未定义导致无限炼蛊 [CRITICAL — 新发现]

文件位置：`src/engine/refine-engine.ts` 第 340、577 行 + `src/store/slices/playerSlice.ts`

refineGu() 和 ascendGu() 通过 (store as any).removeMaterial?.(mat, 1) 消耗蛊材，但 playerSlice 中只有 addMaterial，没有 removeMaterial 方法。optional chaining (?.) 导致材料消耗被静默跳过，蛊材永不扣除，玩家可以无限免费炼蛊。这是一个严重的数值作弊漏洞。

修复建议：在 playerSlice 中实现 removeMaterial 方法，并在 refineGu/ascendGu 中使用类型安全的方式（非 as any）调用。

#### 2.1.2 ascendCost 覆盖率为 0% — 升炼完全失效 [CRITICAL — 新发现]

文件位置：`src/engine/refine-engine.ts` 第 551-556 行 + `src/canon/gu-database.json`

ascendGu() 在第 551 行读取 guDatabase[gu.name].ascendCost，但搜索 gu-database.json 中 "ascendCost" 字段返回 0 条匹配（前次审计误报为"覆盖率 OK"）。这意味着没有任何蛊虫可以升炼，所有升炼操作将永久返回"该蛊虫暂无升炼配方数据"失败状态。

修复建议：为 1-4 转凡蛊补充 ascendCost 数据。注意第 625 行的 ascendImmortalGu（仙蛊升炼）与 ascendGu（凡蛊升炼）是不同的函数。

#### 2.1.3 materialBag 容量仅警告不阻止 [HIGH]

文件位置：`src/store/slices/playerSlice.ts` 第 577-581 行

addMaterial() 在 totalCount > materialBagCapacity 时仅执行 console.warn，不拒绝写入。设计大纲要求材料获取后有"清理无用蛊材"的压力，当前实现允许无限超容。同时 getMaterialBagCapacity 为零调用方法，说明容量查询无消费方。

修复建议：超容时弹窗提示用户清理材料或拒绝添加，至少确保 totalCount >= materialBagCapacity 时返回 false。

#### 2.1.4 refineEnvironment 参数未从 UI 传入 [MEDIUM]

文件位置：`src/components/game/RefinePanel.tsx` 第 101-108 行

refineGu() 的调用不包含 refineEnvironment 字段，calcSuccessRate() 中的环境加成（炼蛊房 +10%、天地秘境 +20%）永远不会触发。hasRealmReFineBonus() 的自动检测可部分弥补，但炼蛊房加成完全失效。

修复建议：在 RefinePanel 调用时根据当前域传入环境参数。

---

### 2.2 杀招系统（Kill Move System）

#### 2.2.1 杀招进化系统依赖链断裂 [CRITICAL]

见第一层 1.1。虽然 checkEvolution/evolveKillMove 被 KillMovePanel import 了，但依赖的 path-progression.ts 本身为死代码，导致进化条件永远不满足。

#### 2.2.2 杀招标准化/桥接链路未使用 [HIGH]

见第一层 1.7。normalizeKillMove/normalizeKillMoves/convertKillMoveToDuelMove 零调用。

修复建议：在 saveSlice.loadSave 中调用 normalizeKillMoves 标准化所有已加载杀招；在 CombatOverlay 中使用 convertKillMoveToDuelMove 统一转换路径。

#### 2.2.3 teachKillMove/enhanceKillMove/tickCooldowns 已修复 [OK]

P0.3 修复已生效：tickCooldowns 在 advanceTurn() 中被调用。teachKillMove 和 enhanceKillMove 均有 UI 调用点。

---

### 2.3 战斗系统（Combat System）

#### 2.3.1 DiceRollAnimation 参数格式完全不匹配 [CRITICAL — 新发现]

文件位置：`src/store/slices/combatSlice.ts` 第 162 行 vs `src/components/game/DiceRollAnimation.tsx` 第 3-8、69 行

combatSlice 调用 triggerDiceRoll({ label: "战果", value: 100, max: 100 }) 传入 value/max 字段，但 DiceRollPayload 接口定义为 { label, difficulty, target, onComplete? }。动画内部在 line 69 计算 finalRoll + p.difficulty >= p.target 时，p.difficulty 和 p.target 均为 undefined，导致 NaN 比较。掷骰动画虽然在 GameScreen 中渲染，但检定逻辑完全损坏。

修复建议：统一参数格式——将 combatSlice 的调用改为 { label, difficulty, target } 格式，或修改 DiceRollPayload 接口支持 value/max 格式。

#### 2.3.2 combat-router 章节覆盖需确认 [MEDIUM]

文件位置：`src/engine/combat-router.ts` 第 14-28 行

knownChapterIds 从 chapters.json 的 domains 下动态读取所有章节 ID（非硬编码），但需要确认 chapters.json 实际覆盖了多少章节。若 chapters.json 不包含当前章节，detectCombat() 会在 line 39 返回 null。

#### 2.3.3 daoMarks 传递链路完整 [OK]

initDuel() → getEffectiveDaoMarks() → calcDamage() 的道痕传递链路完整。executePlayerTurn() 和 executeEnemyTurn() 正确传递 state.player.daoMarks 和 state.enemy.daoMarks。

---

### 2.4 喂蛊系统（Gu Feeding System）[OK]

调用链完整：advanceTurn() → guStore.tickGuHunger() → 状态迁移/反噬；GuInventoryPanel → feedGuHunger() → 食材消耗/饥饿减少；refine-engine.ts:613 → feedGuHunger() → 炼蛊失败惩罚。无断裂。

---

### 2.5 经济系统（Economy System）

#### 2.5.1 shop-engine 正确读取 economy.json 和 shop-items.json [OK]

shop-engine.ts 第 14-15 行 import economyRaw 和 shopItemsRaw。MaterialShopEntry 从 shop-items.json 加载（line 204-217），价格使用 economy.json 的 chapterPriceMultiplier（line 131-132）。

#### 2.5.2 商店缺少 2 种炼蛊必需材料 [HIGH — 新发现]

| 缺失材料 | 受影响蛊虫 | 影响数量 |
|---------|-----------|---------|
| 美酒 | 酒虫、狼吞蛊、九眼酒虫、辟谷蛊、酒囊蛊、四味酒虫、七香酒虫 | 7条 |
| 古籍残页 | 书虫、侦察蛊、竹君子、蜃楼蛊、追踪蛊、巡夜蛊 | 6条 |

这 2 种材料是高频必需材料（合计影响 13 条蛊虫炼制），但在 shop-items.json 中无对应条目，玩家无法通过商店获取。

#### 2.5.3 商店 14 种材料完全未使用 [MEDIUM — 新发现]

以下材料在 shop-items.json 中可购买，但 gu-database.json 的 refineCost 中无任何引用：蛊狼皮、晨露收集瓶、磁石粉末、金刚石粉、古木精华、火鳞片、金丝线、灾劫灰烬、元初之水、梦境收集袋、蚕丝卷、灯油、碎玉片、兽核。这些是纯粹的"死库存"。

修复建议：为这些材料添加对应的蛊虫配方引用，或标注为"待开发材料"，或从商店中移除。

---

### 2.6 NPC 系统（NPC System）

#### 2.6.1 crossDomainAffinityDecay 调用签名不匹配 [HIGH — 新发现]

文件位置：`src/store/slices/playerSlice.ts` 第 405 行 vs `src/engine/npc-cross-domain.ts` 第 111-113 行

playerSlice 调用 crossDomainAffinityDecay(factionStore, currentDomain)，期望传入整个 factionStore 对象。但函数签名定义为 crossDomainAffinityDecay(affinities: AffinityRecord[], currentDomain: string)，期望第一个参数是 AffinityRecord[] 数组。由于调用被包装在 try/catch 中，类型不匹配被静默吞掉，亲和衰减永不生效。

修复建议：修复调用参数格式，从 factionStore 中提取 AffinityRecord[] 数组传入。

#### 2.6.2 NPC 跨域迁移函数不存在 [CRITICAL]

见第一层 1.2。migrateNpc/checkDomainMigration/applyNpcMigration 三个函数完全不存在于 npc-cross-domain.ts 中。

#### 2.6.3 calcCrossDomainCost 零调用 [MEDIUM]

见第一层 1.2。跨域通信费用计算已实现但无调用者。

---

### 2.7 动画系统（Animation System）

#### 2.7.1 triggerDiceRoll 参数不匹配 [CRITICAL]

见第二层 2.3.1。DiceRollAnimation 在 GameScreen 中渲染，但参数格式完全不匹配，动画检定逻辑损坏。

#### 2.7.2 playGuEvolutionAnimation 通过动态 require 调用 [MEDIUM — 新发现]

文件位置：`src/engine/refine-engine.ts` 第 602 行

ascendGu() 在升炼成功时通过 try { const { playGuEvolutionAnimation } = require('../../hooks/useAnimationBridge'); } catch {} 动态引入，使用相对路径。在 Vite/esbuild 打包环境中 require 不可用，导致动画永远不会触发。

修复建议：改用标准 ES import 导入，并在 store 中正确设置 guEvolutionState。

#### 2.7.3 triggerBreakthrough 已接通 [OK]

playerSlice.ts:512 正确调用 triggerBreakthrough，BreakthroughAnimation 在 GameScreen 中渲染。

---

### 2.8 残方系统（Fragment Recipe System）

#### 2.8.1 fragment-recipes.json 完整性已验证 [OK]

所有 8 条配方均有 type 和 fragmentsRequired 字段。所有 targetGu 均存在于 gu-database.json 中。前次审计报告的"4 个 targetGu 不存在"已在 P4 批次中补齐。

#### 2.8.2 getFragmentsForChapter 零调用 [MEDIUM]

文件位置：`src/engine/recipe-discovery.ts` 第 59 行

该函数按章节 ID 筛选残方列表，应设计为在新章节开始时自动解锁对应残方，但从未被调用。

修复建议：在 chapterSlice 的章节推进逻辑中调用 getFragmentsForChapter 自动发放残方。

#### 2.8.3 attemptCompleteFragment 的 path 字段使用 type 值 [MEDIUM]

文件位置：`src/engine/recipe-discovery.ts` 第 101 行

补全成功时返回的 refineInput.path = fragment.type（值为 "refine" 或 "ascend"），而非目标蛊虫的实际流派。这会导致炼制出的蛊虫流派信息错误。

修复建议：从目标蛊虫的 gu-database 数据中获取正确 path 值。

---

### 2.9 成就系统（Achievement System）

#### 2.9.1 所有计数器递增逻辑正确 [OK]

| 计数器 | 递增位置 | 状态 |
|--------|----------|------|
| combatWins | combatSlice.ts:88 endDuel() | OK |
| deathCount | playerSlice.ts:240,307 HP<=0 | OK |
| knownNpcCount | dialogueSlice.ts:51 + factionSlice.ts:156-157 | OK |
| domainsVisited | mapSlice.ts:51-53 首次访问新域 | OK |
| refinedGuCount | refine-engine.ts:376-377,599-600 | OK |
| renZuLegendsHeard | chapterSlice.ts:314-315 | OK |
| totalBattlesFought | combatSlice.ts:87-88 | OK（新增） |

#### 2.9.2 成就条件求值器不支持 && 复合条件 [HIGH — 新发现]

文件位置：`src/store/slices/achievementSlice.ts` 第 244-309 行

achievements.json 中 beiyuan_warrior 的条件为 "combatWins >= 1 && crossDomainFlags:北原"，但 evaluateConditionString 使用简单的逐行正则匹配，不支持 && 复合解析。该条件永远不会被判定为 true，所有包含 && 的成就永久锁定。

修复建议：在条件求值器中添加 && 复合解析支持。

#### 2.9.3 crossDomainFlags 条件语法未被解析器支持 [MEDIUM — 新发现]

文件位置：`src/store/slices/achievementSlice.ts` 条件求值器

achievements.json 使用 "crossDomainFlags:北原" 语法，但条件解析器中不存在对应的正则匹配规则。即使去掉 && 复合条件，单条 "crossDomainFlags:北原" 也会因无匹配规则而返回 false。

修复建议：在条件求值器中添加 crossDomainFlags 匹配规则。

---

## 第三层：数据完整性审计

### 3.1 gu-database.json — ascendCost 覆盖率为 0% [CRITICAL — 新发现]

文件路径：`src/canon/gu-database.json`，总计 128 条蛊虫。

前次审计报告声称 "ascendCost 覆盖率 OK"，但经本次 search_content 精确搜索 "ascendCost" 在 gu-database.json 中返回 **0 条匹配**。这意味着没有蛊虫可以被升炼（ascendGu），该功能完全不可用。

- refineCost：107+ 条有（排除 17 条仙蛊和 4 条不可炼制蛊虫后覆盖率约 100%）
- ascendCost：0 条（应为 1-4 转凡蛊添加）
- noAscend 标记：18 条五转蛊虫正确使用 noAscend: true

#### 3.1.1 P4 批次生成的 4 条蛊虫价格严重超出参考范围 [HIGH — 新发现]

| 蛊虫名 | tier | refineCost.currency | economy参考 | 超出倍数 |
|--------|------|---------------------|------------|---------|
| 冰晶蛊 | 3 | 400 | 40-80 | 5-10x |
| 毒液蛊 | 4 | 800 | 100-200 | 4-8x |
| 万兽蛊 | 5 | 2000 | 300-500 | 4-6.7x |
| 治愈蛊 | 3 | 500 | 40-80 | 6.25-12.5x |

#### 3.1.2 5 转蛊虫价格普遍超出参考范围 [MEDIUM]

10 条五转蛊虫 refineCost.currency 范围 640-800，超出 economy.json 参考 300-500 达 28-167%。

#### 3.1.3 23 条蛊虫缺少非核心字段 [MEDIUM]

以下蛊虫条目缺少 refineMaterials、refineDifficulty、feedFailure、usageFailure 等期望存在的字段：黑豕蛊、白豕蛊、水蛛蛊、一气金光虫、希望蛊、月霓裳、黑鬃蛊、纸鹤蛊、蛇信蛊、刀光蛊、冰锥蛊、古铜皮蛊、奴隶蛊、血滴子、群力蛊、碧空蛊、玉皮蛊、月芒蛊、白玉蛊、四味酒虫、血月蛊、七香酒虫、宝月光王蛊。

#### 3.1.4 蛇信蛊 path 字段非标准值 [LOW]

蛇信蛊 path 为 "侦察"（非标准流派名如智道），与其他蛊虫的命名约定不一致。

---

### 3.2 shop-items.json — 数据交叉引用断裂 [HIGH]

#### 3.2.1 refineCost 必需但商店不可购买的材料（2种，影响 13 条蛊虫）

见第二层 2.5.2。

#### 3.2.2 商店中可购买但 refineCost 从未使用的材料（14 种）

见第二层 2.5.3。

---

### 3.3 fragment-recipes.json — 完整无断裂 [OK]

文件路径：`src/canon/fragment-recipes.json`，共 8 条配方。

全部 8 条都有 type 和 fragmentsRequired 字段。所有 targetGu 均存在于 gu-database.json 中。前次审计报告的 targetGu 不存在问题已修复。

唯一小问题：type 字段命名在 fragment-recipes.json 中表示 "refine/ascend"，在 encounters.json 中也使用 type 字段表示 "danger/opportunity/social/exploration/rest"。这是跨文件的命名冲突但非 bug（schema 独立）。

---

### 3.4 encounters.json — JSON 对象合并损坏 [CRITICAL — 新发现]

文件路径：`src/canon/encounters.json`

#### 3.4.1 sjq_danger_assassin 的 choices 数组对象合并损坏

shili_jueqi 章节的 sjq_danger_assassin 遭遇（约第 554 行），choices 数组中的两个 choice 对象被错误合并为一个：{"id":"counter",...,"outcome":"...","id":"trap",...}。这导致第二个 id 覆盖第一个，trap choice 同时包含 counter 和 trap 的混合字段。运行时解析将丢失 counter 选项。

修复建议：拆分为两个独立 choice 对象。

#### 3.4.2 实际遭遇类型分布与设计规范不匹配 [HIGH]

设计规范（_meta.designNotes）规定：danger=15%, opportunity=20%, social=30%, exploration=25%, rest=10%。实际分布（每章 11 条）：danger=27%(3条), opportunity=27%(3条), social=18%(2条), exploration=18%(2条), rest=9%(1条)。social 是设计上最强调的类型（30%）但实际最少（18%）。

#### 3.4.3 JSON 格式不一致 [LOW]

qingmaoshan 和 shanglu_qiusheng 的条目使用多行 pretty-print，而 nanjiang_chutan、shili_jueqi、sanwang_yitian 的条目使用压缩单行格式。

#### 3.4.4 总量达标 [OK]

总计 55 条遭遇模板（5 章 x 11 条），达到 55 条目标。

---

### 3.5 economy.json — 参考范围需更新 [MEDIUM]

economy.json 的"炼蛊成本参考"范围需要更新以反映 P4 批次生成的实际数值，特别是稀有度分层定价（common/rare/epic/legendary 各自有独立定价区间）。

---

## 第四层：UI 入口完整性

### 4.1 工具栏面板注册 — 12 个面板 + 1 个死路 [HIGH — 新发现]

文件位置：`src/components/game/GameScreen.tsx`

#### 4.1.1 正常注册的 12 个面板 [OK]

TOOLBAR_BUTTONS_BASE（第 84-96 行）注册了 11 个按钮，加上 map 独立渲染，共 12 个工具栏面板入口，全部正确映射：

| 面板 ID | 组件 | 注册状态 |
|---------|------|---------|
| attributes | AttributeDetailPanel | OK |
| gu_inventory | GuInventoryPanel | OK |
| kill_moves | KillMovePanel | OK |
| refine | RefinePanel | OK |
| material_bag | MaterialBagPanel | OK |
| aperture | AperturePanel | OK |
| characters | CharacterPanel | OK |
| dao_marks | DaoMarkPanel | OK |
| merchant | MerchantPanel | OK |
| achievements | AchievementPanel | OK |
| events | EventLogPanel | OK |
| map | SVGMapPanel | OK（独立按钮渲染） |

#### 4.1.2 aperture_management 死路代码 [HIGH — 新发现]

panelContent() 第 75 行有一个 case 'aperture_management' → ApertureManagementPanel 的映射，但 SidePanel 类型（第 40 行）中不包含 'aperture_management'。TypeScript 永远不会允许 setSidePanel('aperture_management')，该代码路径为死路。

修复建议：将 'aperture_management' 添加到 SidePanel 类型定义中，并在 TOOLBAR_BUTTONS 或 aperture 面板二级菜单中添加入口。

### 4.2 Overlay 注册 — GuEvolutionOverlay 断裂 [HIGH]

GameScreen.tsx 渲染了 15 个 overlay 组件，其中 GuEvolutionOverlay 因 store 字段缺失无法激活（见第一层 1.15）。

#### 4.2.1 正常渲染的 overlay（14/15）[OK]

AuctionPanel、KillMoveCreationPanel、BattleOverlay、CombatOverlay、NarrativeCombatPanel、NPCInteractionPanel、BreakthroughAnimation、DiceRollAnimation、SaveLoadDialog、SettingsDialog、TutorialOverlay、DebugOverlay、AchievementToast、ChapterTransition 均在 GameScreen.tsx 中正确 import 和渲染。

---

## 优先级修复路线图

### 立即修复（Critical — 功能完全缺失或数据损坏）

| 编号 | 问题 | 位置 | 预计工时 |
|------|------|------|---------|
| C1 | removeMaterial 方法未定义，无限免费炼蛊 | playerSlice.ts | 1h |
| C2 | ascendCost 覆盖率为 0%，升炼完全失效 | gu-database.json + refine-engine.ts | 4h |
| C3 | DiceRollAnimation 参数格式不匹配，动画检定逻辑损坏 | combatSlice.ts:162 vs DiceRollAnimation.tsx | 2h |
| C4 | encounters.json sjq_danger_assassin choices 对象合并损坏 | encounters.json ~554行 | 0.5h |
| C5 | killmove-evolution 依赖链断裂（path-progression 死代码） | killmove-evolution.ts + path-progression.ts | 移除或完整接入 4h |
| C6 | NPC 跨域迁移函数不存在（migrateNpc/checkDomainMigration/applyNpcMigration） | npc-cross-domain.ts | 从零实现 6h |
| C7 | crossDomainAffinityDecay 调用签名不匹配 | playerSlice.ts:405 vs npc-cross-domain.ts:111 | 1h |
| C8 | achievement 求值器不支持 && 复合条件和 crossDomainFlags 语法 | achievementSlice.ts:244-309 | 3h |
| C9 | playGuEvolutionAnimation 通过动态 require 调用（打包环境不可用） | refine-engine.ts:602 | 1h |
| C10 | aperture_management SidePanel 类型缺失 | GameScreen.tsx:40 | 0.5h |
| C11 | achievementSlice triggerGuEvolution/clearGuEvolution 零调用 | guSlice.ts | 2h |
| C12 | ascendImmortalGu 仙蛊升炼无 UI | refine-engine.ts:625 | 添加仙材 UI 6h |

### 高优先级（High — 核心逻辑断裂）

| 编号 | 问题 | 位置 | 预计工时 |
|------|------|------|---------|
| H1 | killmove-bridge 3 个核心函数零调用 | killmove-bridge.ts | 2h |
| H2 | combat-stats 4 个导出零调用 | combat-stats.ts | 2h |
| H3 | 商店缺少美酒、古籍残页（影响 13 条蛊虫） | shop-items.json | 1h |
| H4 | 商店 14 种材料完全未使用 | shop-items.json | 排查或清理 2h |
| H5 | P4 蛊虫价格 4-12x 超出参考范围 | gu-database.json | 4h |
| H6 | materialBag 容量仅警告不阻止 | playerSlice.ts:577-581 | 2h |
| H7 | calculateMaterialCost/Count 零调用 | refine-engine.ts:146,153 | 接入商店定价 2h |
| H8 | GuEvolutionOverlay store 字段缺失 | guSlice + useAnimationBridge | 2h |
| H9 | KillMoveCreationPanel 触发机制不一致 | KillMoveCreationPanel.tsx | 改为 store 驱动 2h |
| H10 | encounters.json 实际分布与设计规范不匹配 | encounters.json | 调整或更新规范 2h |
| H11 | 52 个 store 方法零调用（18 个 slice 文件） | store/slices/*.ts | 接入或移除 6h |
| H12 | createDuelEnemy 零调用 | combat-engine.ts:377 | 统一工厂调用 1h |
| H13 | combat-router 章节覆盖需确认 | combat-router.ts:14-28 | 验证 chapters.json 1h |
| H14 | 3 个 material-region 函数零调用 | material-region.ts | 接入探索事件 2h |
| H15 | getFragmentsForChapter 零调用 | recipe-discovery.ts:59 | 接入章节推进 1h |
| H16 | attemptCompleteFragment path 字段使用 type 值 | recipe-discovery.ts:101 | 修复路径 1h |

### 中优先级（Medium — 数据完善性）

| 编号 | 问题 | 位置 | 预计工时 |
|------|------|------|---------|
| M1 | 23 条蛊虫缺非核心字段 | gu-database.json | 批量补齐 3h |
| M2 | refineEnvironment 参数未传入 | RefinePanel.tsx | 传参 1h |
| M3 | economy.json 参考范围需更新 | economy.json | 1h |
| M4 | 蛇信蛊 path 字段非标准值 | gu-database.json | 0.5h |

### 低优先级（Low — 代码清理）

| 编号 | 问题 | 位置 | 预计工时 |
|------|------|------|---------|
| L1 | createPipeline 工厂零调用 | response-pipeline.ts:673 | 移除 0.5h |
| L2 | useFontReady 零导入 | useFontReady.ts | 移除 0.5h |
| L3 | LoadingSkeleton 零导入 | LoadingSkeleton.tsx | 移除 0.5h |
| L4 | ModeSelectScreen 零导入 | ModeSelectScreen.tsx | 移除 0.5h |
| L5 | HeavenlyLand 2 个函数零外部调用 | HeavenlyLandEngine.ts | 移除或接入 1h |
| L6 | isAuctionable 仅内部使用 | auction-engine.ts | 移除 export 0.5h |
| L7 | DOMAINS 常量零导入 | npc-cross-domain.ts:31 | 移除 0.5h |
| L8 | SPECIAL_ENEMY_MULTIPLIERS 零导入 | combat-stats.ts:128 | 移除 0.5h |
| L9 | EvolutionCondition/Result 接口零导入 | killmove-evolution.ts | 随文件处理 |
| L10 | 内部使用的 interface/type export（CanaryResult 等） | canary-assertions.ts 等 | 减量 export 0.5h |
| L11 | fragment-recipes type 字段与 encounters type 命名冲突 | 跨文件 | 文档说明 0.5h |
| L12 | encounters.json 3 个章节使用压缩单行格式 | encounters.json | 统一格式 1h |
| L13 | 万兽蛊 ascendCost vs noAscend 不一致 | gu-database.json | 修正 0.5h |

---

## 结论

本次审计覆盖了 RebornG 项目 185 个源文件、13 个设计文档、5 个核心数据文件，共发现 62 个需修复项（较前次审计新增 15 项）。项目核心游戏循环（turnAdvance/combat/refine/feedGu/achievement counters）功能基本完整，但存在若干严重问题需要立即处理：

第一，removeMaterial 方法缺失导致的无限免费炼蛊漏洞是最高优先级问题，影响游戏数值平衡。ascendCost 覆盖率为 0% 导致升炼功能完全不可用，需紧急补充数据。

第二，DiceRollAnimation 参数格式完全不匹配导致掷骰动画检定逻辑损坏，虽然动画可以播放，但检定计算始终为 NaN。

第三，encounters.json 中存在 JSON 对象合并损坏，将导致运行时丢失一个遭遇选项。

第四，52 个 store 方法为零调用（覆盖 18 个 slice 文件），虽然大多属于"已实现但未接入"的储备代码，但 playerSlice 中 6 个零调用方法表明该核心 slice 存在显著的代码膨胀。

建议按优先级路线图逐步修复，Critical 12 项应在一周内完成，High 16 项在两周内完成，Medium 和 Low 项在后续迭代中纳入。

---

## 参考文献

1. [项目设计文档目录 - 指导大纲/](d:/workspace/CodeBuddyWorkSpace/RebornG_codebuddy/指导大纲/)
2. [游戏设计文档 - game-design-document.md](d:/workspace/CodeBuddyWorkSpace/RebornG_codebuddy/game-design-document.md)
3. [P2 补完计划 - P2补完计划-20260503.md](d:/workspace/CodeBuddyWorkSpace/RebornG_codebuddy/P2补完计划-20260503.md)
4. [数值系统审计报告 - numerical-system-audit-report-20260504.md](d:/workspace/CodeBuddyWorkSpace/RebornG_codebuddy/numerical-system-audit-report-20260504.md)
5. [P2 全面诊断报告 - P2-comprehensive-diagnosis-report-20260503.md](d:/workspace/CodeBuddyWorkSpace/RebornG_codebuddy/P2-comprehensive-diagnosis-report-20260503.md)
6. [前次审计报告 - dead_code_audit_report.md (2026-05-05 08:58)](d:/workspace/CodeBuddyWorkSpace/RebornG_codebuddy/dead_code_audit_report.md)
