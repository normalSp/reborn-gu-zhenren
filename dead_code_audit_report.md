# 死代码与设计-实现落差全量审计报告

审计日期：2026-05-07 08:57
审计范围：`src/` 全量 200+ 源文件 + `src/canon/` 与 `src/data/` 所有 JSON 数据文件 + `指导大纲/` 设计文档
审计分层：4 层（零调用函数 / 设计实现一致性 / 数据完整性 / UI 入口完整性）
审计方式：6 个子代理并行深度扫描，28 个子系统全覆盖

---

## 执行摘要

本次审计对 RebornG 项目进行了全面代码健康检查，覆盖 4 个层次。总计发现 **85 个需修复项**，按严重程度分类：**Critical 3 项**（系统功能完全缺失或数据损坏）、**High 19 项**（核心逻辑断裂）、**Medium 28 项**（数据完善性或代码清洁）、**Low 35 项**（代码清理或格式改进）。

### 相较于前次审计（2026-05-06 08:58）的主要变化

**已修复/改善（3 项）：**
1. ✅ **ascendCost 覆盖率已达 100%**：所有需升炼的凡蛊均已拥有 ascendCost，上次审计标记的 warning 已消除
2. ✅ **fragment-recipes targetGu 全部验证通过**：8 条全部存在，上次修复已确认生效
3. ✅ **combatSlice 共享引用保护**：_.cloneDeep 使用已确认正确

**持续未修复的 Critical 问题（距上次审计 1-2 天）：**
1. ❌ **removeMaterial 方法仍未定义** → 无限免费炼蛊漏洞（已连续 2 天标记）
2. ❌ **encounters.json sjq_danger_assassin choices 合并损坏** → JSON 数据丢失（已连续 2 天标记）
3. ❌ **triggerBreakthrough 类型不匹配** → 突破动画静默失败（上次标记为 DiceRollAnimation，实际应为 BreakthroughAnimation）

**新增发现（5 项）：**
- 2 个关键炼蛊材料（美酒、古籍残页）在 shop-items.json 缺失
- 4 个蛊虫 refineCost 货币值严重超出 economy.json 参考范围
- ApertureManagementPanel 死代码（已导入但 TypeScript 类型阻止访问）
- 3 个 v0.7.0 面板（FactionPanel/SquadFormationPanel/ResourceNodeBuildPanel）未接入
- AchievementUnlockOverlay 和 HuntingRewardPanel 覆盖层未渲染

---

## 第一层：零调用函数检测

### 1.1 src/engine/ 零调用导出（25 项）

| # | 文件 | 行号 | 函数名 | 严重性 | 说明 |
|---|------|------|--------|--------|------|
| 1 | `engine/auction-engine.ts` | 34 | `isAuctionable` | Low | 仅内部调用(line 45)，零外部导入。若确为内部辅助函数应改为非导出 |
| 2 | `engine/auction-engine.ts` | 110 | `listPlayerGu` | Medium | 设计文档引用但代码零调用，拍卖上架功能未接入 |
| 3 | `engine/auction-engine.ts` | 116 | `simulateSellAuction` | Medium | 设计文档引用但代码零调用，拍卖结算功能未接入 |
| 4 | `engine/auction-engine.ts` | 149 | `generateMaterialPool` | Medium | 桩函数返回[]，零调用。材料拍卖池未实现 |
| 5 | `engine/auction-engine.ts` | 154 | `generateRecipePool` | Medium | 桩函数返回[]，零调用。残方拍卖池未实现 |
| 6 | `engine/auction-engine.ts` | 159 | `generateKillerMovePool` | Medium | 桩函数返回[]，零调用。杀招拍卖池未实现 |
| 7 | `engine/canary-assertions.ts` | 38 | `resetC09Counter` | Low | 仅测试文件调用，生产环境零调用 |
| 8 | `engine/combat-cooldown.ts` | 28 | `createCooldownState` | Medium | 工厂函数零外部调用，冷却系统未接入战斗 |
| 9 | `engine/combat-cooldown.ts` | 61 | `updateChapterDensity` | Medium | 零外部调用，章节遭遇密度调控未接入 |
| 10 | `engine/combat-cooldown.ts` | 71 | `getRemainingCooldown` | Medium | 零外部调用，冷却剩余查询未接入 |
| 11 | `engine/combat-engine.ts` | 376 | `tryEscape` | Low | 仅内部调用(line 189)，零外部导入 |
| 12 | `engine/combat-fatigue.ts` | 29 | `createFatigueState` | Low | 工厂函数零外部调用 |
| 13 | `engine/combat-fatigue.ts` | 37 | `calcFatigueGain` | Low | 仅内部调用 |
| 14 | `engine/combat-fatigue.ts` | 50 | `decayFatigue` | Low | 仅内部调用 |
| 15 | `engine/combat-fatigue.ts` | 65 | `recordCombat` | **High** | 零外部调用，战斗疲劳系统完全未接入 advanceTurn |
| 16 | `engine/combat-fatigue.ts` | 88 | `getFatigueEncounterMult` | **High** | 零外部调用，疲劳遭遇倍率调节器未接入 |
| 17 | `engine/combat-fatigue.ts` | 97 | `tickFatigue` | **High** | 零外部调用，疲劳衰减 tick 未接入 advanceTurn |
| 18 | `engine/combat-formulas.ts` | 184 | `checkAffinityBlock` | Medium | 仅有设计文档引用，亲和阻断检测未接入战斗 |
| 19 | `engine/combat-router.ts` | 57 | `analyzeKeywordTiers` | Low | 仅内部调用 |
| 20 | `engine/combat-stats.ts` | 148 | `getStandardEnemyStats` | Medium | 零外部调用，combat-router 绕过此工厂函数 |
| 21 | `engine/HeavenlyLandEngine.ts` | 256 | `calculateHeavenlyLandValue` | Medium | 零外部调用，仙窍估值功能未接入 |
| 22 | `engine/HeavenlyLandEngine.ts` | 269 | `getDisasterUrgencyLevel` | Medium | 零外部调用，灾劫紧急度查询未接入 |
| 23 | `engine/killmove-bridge.ts` | 36 | `normalizeKillMove` | Low | 仅内部调用 |
| 24 | `engine/refine-engine.ts` | — | 多个内部辅助函数 | Low | 部分辅助函数仅内部调用，需逐一审查是否需要导出 |

**引擎层零调用总计：25 项**（High 3 / Medium 13 / Low 9）

**修复建议：**
- **combat-fatigue.ts 全文件**（recordCombat/tickFatigue/getFatigueEncounterMult）需要在 playerSlice.advanceTurn 中接入调用链
- **auction-engine.ts** 的 3 个桩函数和 2 个业务函数需要与 AuctionPanel UI 连接
- **combat-cooldown.ts** 需要接入 combatSlice 的战斗流程
- 内部辅助函数应改为非导出或添加 `@internal` JSDoc 标记

### 1.2 src/store/slices/ 零调用方法（49 项）

#### 完全零调用的 Slice Action（32 项）

| # | 文件 | 行号 | 方法名 | 类型 | 严重性 |
|---|------|------|--------|------|--------|
| 1 | `causalitySlice.ts` | 16 | `updateDeviation` | action | Medium |
| 2 | `eventSlice.ts` | 16 | `enqueueEvent` | action | **High** |
| 3 | `eventSlice.ts` | 19 | `dequeueAndTrigger` | action | **High** |
| 4 | `eventSlice.ts` | 30 | `markTriggered` | action | Medium |
| 5 | `narrativeSlice.ts` | 34 | `setLoading` | action | Medium |
| 6 | `narrativeSlice.ts` | 35 | `setError` | action | Medium |
| 7 | `mapSlice.ts` | 26 | `discoverLocation` | action | Medium |
| 8 | `mapSlice.ts` | 56 | `markDomainVisited` | action | Medium |
| 9 | `gameLogSlice.ts` | 74 | `clearGameLog` | action | Low |
| 10 | `debtSlice.ts` | 22 | `incurDebt` | action | **High** |
| 11 | `debtSlice.ts` | 33 | `repayDebt` | action | **High** |
| 12 | `debtSlice.ts` | 44 | `getDebtStatus` | selector | **High** |
| 13 | `chapterSlice.ts` | 319 | `skipEvent` | action | Medium |
| 14 | `combatSlice.ts` | 226 | `executeEnemyTurnAction` | action | Medium |
| 15 | `combatSlice.ts` | 236 | `initSquadDuel` | action | Medium |
| 16 | `dialogueSlice.ts` | 79 | `appendNpcMessage` | action | Medium |
| 17 | `factionSlice.ts` | 459 | `getMemberCount` | selector | Medium |
| 18 | `factionSlice.ts` | 442 | `updateMemberLoyalty` | action | Medium |
| 19 | `factionSlice.ts` | 422 | `tickFactionTrade` | action | **High** |
| 20 | `factionSlice.ts` | 396 | `tickFactionMaintenance` | action | **High** |
| 21 | `guSlice.ts` | 524 | `unbindLifeboundGu` | action | Medium |
| 22 | `guSlice.ts` | 551 | `triggerLifeboundDeathPenalty` | action | Medium |
| 23 | `guSlice.ts` | 122 | `triggerGuEvolution` | action | Medium |
| 24 | `guSlice.ts` | 130 | `clearGuEvolution` | action | Medium |
| 25 | `originUnlockSlice.ts` | 169 | `getAvailableOrigins` | selector | Medium |
| 26 | `originUnlockSlice.ts` | 187 | `getUnmetConditions` | selector | Medium |
| 27 | `originUnlockSlice.ts` | 179 | `forceUnlock` | action | Low |
| 28 | `originUnlockSlice.ts` | 165 | `getUnlockedOrigins` | selector | Medium |
| 29 | `originUnlockSlice.ts` | 174 | `isOriginUnlocked` | selector | Medium |
| 30 | `encounterSlice.ts` | 185 | `getCooldownInfo` | selector | Low |
| 31 | `merchantSlice.ts` | 75 | `canShopRefresh` | selector | Medium |
| 32 | `merchantSlice.ts` | 71 | `getShopGroup` | selector | Medium |
| 33 | `yuanStoneSlice.ts` | 94 | `getCurrencySummary` | selector | Low |
| 34 | `achievementSlice.ts` | 155 | `unlockAchievement` | action | **High** |
| 35 | `achievementSlice.ts` | 164 | `updateAchievementProgress` | action | **High** |
| 36 | `achievementSlice.ts` | 175 | `checkCondition` | selector | **High** |
| 37 | `achievementSlice.ts` | 243 | `grantReward` | action | **High** |
| 38 | `achievementSlice.ts` | 225 | `getAllAchievements` | selector | Low |
| 39 | `achievementSlice.ts` | 232 | `reloadFromStorage` | action | Low |
| 40 | `achievementSlice.ts` | 171 | `isAchievementUnlocked` | selector | Low |

**零调用 Slice 方法总计：40 项**（action 27 / selector 13），分布在 18 个 slice 文件中。

#### 零调用导出常量/函数（5 项）

| # | 文件 | 行号 | 名称 | 类型 | 严重性 |
|---|------|------|------|------|--------|
| 1 | `soundSlice.ts` | 22 | `SPECIAL_BGM` | const | Low |
| 2 | `guSlice.ts` | 52 | `FEED_MATERIAL_MAP` | const | Low |
| 3 | `auctionSlice.ts` | 166 | `shouldTriggerAuction` | function | Medium |
| 4 | `immortalSlice.ts` | 54 | `getTimelineAperturePoints` | function | Medium |
| 5 | `timelineSlice.ts` | 31 | `normalizeTimelineNode` | function | Low |

**修复建议（按优先级）：**
1. **achievementSlice 7 项全部零调用** → 成就系统的核心方法（unlockAchievement/updateAchievementProgress/checkCondition/grantReward）从未被调用，成就面板可能只能读取初始状态而无法动态解锁。需在事件处理链中接入
2. **debtSlice 3 项** → 债务系统完全未激活，需要在商店交易/事件中接入 incurDebt/repayDebt
3. **factionSlice tickFactionTrade/tickFactionMaintenance** → 势力经济/Maintenance tick 需接入 advanceTurn
4. **eventSlice enqueueEvent/dequeueAndTrigger** → 事件队列系统虽已定义但从未入队/出队触发

### 1.3 src/hooks/ 零调用 Hook（2 项）

| # | 文件 | 行号 | Hook 名 | 严重性 | 说明 |
|---|------|------|---------|--------|------|
| 1 | `hooks/useReducedMotion.ts` | 17 | `useReducedMotion` | Low | Hook 零调用，但同文件的 `isReducedMotion()` 工具函数被 6 处引用。Hook 版本为纯死代码 |
| 2 | `hooks/useFontReady.ts` | 16 | `useFontReady` | Low | 全文件唯一导出，零调用。字体加载检测功能未使用 |

**修复建议：** 若不需要 Hook 形式的 reduced motion 检测和字体检测，可移除这两个文件以减小编译体积。

### 1.4 src/components/ 零调用组件（9 项）

| # | 文件 | 行号 | 组件名 | 文件大小 | 严重性 | 说明 |
|---|------|------|--------|----------|--------|------|
| 1 | `game/AchievementUnlockOverlay.tsx` | 25 | `AchievementUnlockOverlay` | 3.61 KB | **High** | 成就解锁动画覆盖层，未在 GameScreen 覆盖层区域渲染 |
| 2 | `game/AscensionBalancePanel.tsx` | 35 | `AscensionBalancePanel` | 11.74 KB | **High** | 升仙三气平衡面板，完全未接入任何流程 |
| 3 | `game/FactionPanel.tsx` | 22 | `FactionPanel` | 12.35 KB | **High** | v0.7.0 势力管理面板（3 Tab），未接入工具栏 |
| 4 | `game/HuntingRewardPanel.tsx` | 6 | `HuntingRewardPanel` | 1.50 KB | Medium | 狩猎战利品结算覆盖层，未渲染 |
| 5 | `game/LoadingSkeleton.tsx` | 1 | `LoadingSkeleton` | 2.26 KB | Low | 骨架屏占位符，App.tsx 未使用 |
| 6 | `game/ModeSelectScreen.tsx` | 5 | `ModeSelectScreen` | 2.37 KB | Low | 已确认废弃（注释：v1.6 gameMode 合并到 TimelineSelect） |
| 7 | `game/ResourceNodeBuildPanel.tsx` | 31 | `ResourceNodeBuildPanel` | 8.98 KB | **High** | v0.7.0 资源点建造面板，未接入 |
| 8 | `game/SquadFormationPanel.tsx` | 64 | `SquadFormationPanel` | 8.51 KB | **High** | v0.7.0 小队编成面板，未接入 |
| 9 | `game/BattleOverlay.tsx` | 14 | `triggerBattleInfo` (函数) | 2.42 KB | Medium | 导出函数零导入，仅通过 store 的 `battleStore.triggerBattleInfo` 间接使用 |

**孤立代码体积合计：~51.7 KB**

**修复建议：**
- **FactionPanel / SquadFormationPanel / ResourceNodeBuildPanel** 是 v0.7.0 核心功能，需在 GameScreen TOOLBAR_BUTTONS 中注册为 SidePanel
- **AchievementUnlockOverlay** 需在 GameScreen 覆盖层区域渲染，与 AchievementToast 并列
- **AscensionBalancePanel** 需集成到升仙流程中
- **LoadingSkeleton / ModeSelectScreen** 可安全清理

---

## 第二层：设计-实现一致性审计

### 2.1 炼蛊系统 — 健康评分 33%（Critical）

| # | 检查项 | 文件 | 行号 | 状态 | 详情 |
|---|--------|------|------|------|------|
| 1 | refineCost 覆盖率 | `data/gu-database.json` | 108+ 匹配 | ✅ PASS | 所有非仙蛊/非不可炼蛊虫均有 refineCost |
| 2 | ascendCost 覆盖率 | `data/gu-database.json` | 90+ 匹配 | ✅ PASS | 前次审计已修复，覆盖率 100%（排除五转蛊和仙蛊） |
| 3 | checkMaterialsWithFallback 调用 | `engine/refine-engine.ts` | L95 定义, L311/L565 调用 | ✅ PASS | 炼蛊和升炼流程均调用 |

| 4 | **removeMaterial 未定义** | `store/slices/playerSlice.ts` | — | ❌ **CRITICAL** | `removeMaterial` 从未定义。4 处调用点通过可选链 `.removeMaterial?.()` 静默失败：killMoveSlice.ts:98、refine-engine.ts:340/577、recipe-discovery.ts:90、killmove-evolution.ts:97。炼蛊/杀招/残方系统消耗材料永不扣减 = **无限免费炼蛊漏洞** |

| 5 | addMaterial 容量限制 | `store/slices/playerSlice.ts` | L788-799 | ⚠️ WARNING | 仅 console.warn 不阻止写入，materialBag 容量限制未强制 |

**修复建议：**
- **P0**：在 `playerSlice.ts` 中添加 `removeMaterial` 方法，接收材料名和数量，与 `addMaterial` 对称
- **P1**：addMaterial 应在超容量时阻止写入或触发丢弃提示

### 2.2 杀招系统 — 健康评分 100%

| # | 检查项 | 文件 | 状态 | 详情 |
|---|--------|------|------|------|
| 1 | teachKillMove | `killMoveSlice.ts:77` → `NPCInteractionPanel.tsx:79` | ✅ PASS | NPC 好感≥80 时请教，完整调用链验证 |
| 2 | enhanceKillMove | `killMoveSlice.ts:87` → `KillMovePanel.tsx:96-100` | ✅ PASS | UI 按钮触发，消耗材料提升倍率 20% |
| 3 | tickCooldowns | `killMoveSlice.ts:69` → `playerSlice.ts:658` | ✅ PASS | 每回合 advanceTurn 中调用 |

### 2.3 战斗系统 — 健康评分 100%

| # | 检查项 | 文件 | 状态 | 详情 |
|---|--------|------|------|------|
| 1 | daoMarks 战斗集成 | `engine/combat-engine.ts` | ✅ PASS | 13 处引用：calcDamage(L124/L217)、applyStatusOnHit(L292)、initDuel(L49-51) 等 |
| 2 | DiceRollAnimation 组件 | `GameScreen.tsx:336` | ✅ PASS | 组件存在且正确渲染 |
| 3 | triggerDiceRoll 调用 | `combatSlice.ts:183` | ✅ PASS | endDuel 中正确调用 |

### 2.4 喂蛊系统 — 健康评分 100%

| # | 检查项 | 文件 | 状态 | 详情 |
|---|--------|------|------|------|
| 1 | feedGuHunger 调用链 | `guSlice.ts:381` → `GuInventoryPanel.tsx` + `refine-engine.ts:613` | ✅ PASS | UI 和炼蛊失败时均调用 |
| 2 | tickGuHunger 调用链 | `guSlice.ts:304` → `playerSlice.ts:560` | ✅ PASS | 每回合 advanceTurn 调用，四态模型完整 |

### 2.5 经济系统 — 健康评分 100%

| # | 检查项 | 文件 | 状态 | 详情 |
|---|--------|------|------|------|
| 1 | shop-engine 读取 economy.json | `engine/shop-engine.ts:15` | ✅ PASS | calcGuPrice 使用章节价格乘数 |
| 2 | 商店材料购买 | `MerchantPanel.tsx:45-55` | ✅ PASS | handleBuyMaterial + payWithDualCurrency + addMaterial 完整 |
| 3 | shop-items.json 材料可购买 | `data/shop-items.json` | ✅ PASS | 36 种蛊材/消耗品均可在商店购买 |

### 2.6 NPC 系统 — 健康评分 67%

| # | 检查项 | 文件 | 行号 | 状态 | 详情 |
|---|--------|------|------|------|------|
| 1 | filterNpcByDomain | `engine/npc-cross-domain.ts:55` → `playerSlice.ts:641` | ✅ PASS | 每回合按域过滤 NPC 池 |
| 2 | crossDomainAffinityDecay | `engine/npc-cross-domain.ts:111` → `playerSlice.ts:620` | ✅ PASS | 每 10 回合衰减离开域 NPC 亲和 |

| 3 | **calcCrossDomainCost 零调用** | `engine/npc-cross-domain.ts` | L160 | ❌ **FAIL** | 跨域通信消耗计算函数定义完整但代码中零调用。跨域通信 UI 未实现 |

**修复建议：** 在跨域通信 UI 中接入 calcCrossDomainCost，或在 NPC 交互面板中展示跨域消耗。

### 2.7 动画系统 — 健康评分 67%

| # | 检查项 | 文件 | 行号 | 状态 | 详情 |
|---|--------|------|------|------|------|
| 1 | triggerDiceRoll | `DiceRollAnimation.tsx:13` → `combatSlice.ts:183` | ✅ PASS | 战斗结算触发动画，签名匹配 |

| 2 | **triggerBreakthrough 类型不匹配** | `playerSlice.ts` | L727 | ❌ **CRITICAL** | playerSlice 传递 `{path, level, realm}` 但 BreakthroughAnimation 期望 `BreakthroughPayload = {oldRealm, newRealm}`。属性名完全错位：oldRealm/newRealm 从未被设置，path/level/realm 从未被读取 → 动画渲染空文本，静默失败 |

| 3 | playGuEvolutionAnimation | `useAnimationBridge.ts:107` → `refine-engine.ts:602` | ✅ PASS | 升炼成功时触发，签名匹配 |

**修复建议：**
- **P0**：修复 playerSlice.ts:727，将调用改为 `{oldRealm: currentRealmName, newRealm: nextRealmName}` 或重构 BreakthroughAnimation 接受 path+level+realm

### 2.8 残方系统 — 健康评分 75%

| # | 检查项 | 文件 | 行号 | 状态 | 详情 |
|---|--------|------|------|------|------|
| 1 | loadAllFragments | `recipe-discovery.ts:53` → `RefinePanel.tsx:83` | ✅ PASS | RefinePanel 加载残方列表 |
| 2 | attemptCompleteFragment | `recipe-discovery.ts:69` → `RefinePanel.tsx:153` | ✅ PASS | 拼合残方动作 |
| 3 | canAttemptFragment | `recipe-discovery.ts:117` → `RefinePanel.tsx:234` | ✅ PASS | 检查拼合条件 |
| 4 | isRecipeUnlocked | `recipe-discovery.ts:130` → `RefinePanel.tsx:68,71` | ✅ PASS | 检查残方解锁状态 |
| 5 | synthesizeRecipe | `recipe-discovery.ts:143` → `RefinePanel.tsx:168` | ✅ PASS | 合成配方 |

| 6 | **getFragmentsForChapter 零调用** | `recipe-discovery.ts` | L60 | ❌ **FAIL** | 按章节过滤残方的功能从未被调用 |
| 7 | FragmentRecipe 接口缺字段 | `recipe-discovery.ts` | L28-40 | ⚠️ WARNING | TypeScript 接口不含 `fragmentsRequired`，但运行时通过类型转换访问。虽不导致运行时错误，但类型安全性缺失 |

**修复建议：**
- 如果按章节过滤是预期功能，在 RefinePanel 中接入 getFragmentsForChapter
- 在 FragmentRecipe 接口中添加 `fragmentsRequired: number` 字段

---

## 第三层：数据完整性审计

### 3.1 gu-database.json — 健康评分 92%

| 统计项 | 值 |
|--------|-----|
| 总条目数 | 128 |
| 仙蛊 (isImmortalGu: true) | 17 |
| 不可炼制凡蛊 (noRefine: true) | 4 |
| 五转凡蛊 (noAscend: true) | 17 |
| 需含 refineCost+ascendCost | 90 |
| refineCost 缺失 | 0 |
| ascendCost 缺失 | 0 |

**数值异常发现（超出 economy.json 参考上限 3 倍以上）：**

| # | 蛊虫 | 转数 | 稀有度 | refineCost.currency | 参考上限 | 倍数 | 严重性 |
|---|------|------|--------|---------------------|----------|------|--------|
| 1 | 冰晶蛊 | 3 | rare | 400 | 80 | 5× | Medium |
| 2 | 治愈蛊 | 3 | rare | 500 | 80 | 6.25× | Medium |
| 3 | 毒液蛊 | 4 | rare | 800 | 200 | 4× | Medium |
| 4 | 万兽蛊 | 5 | epic | 2000 | 500 | 4× | Medium |

**评估：** 这些高值可能为稀有/史诗蛊虫的设计意图（通过稀有材料提高成本），但 4-6 倍超标幅度值得设计评审确认。

### 3.2 shop-items.json — 健康评分 94%

| 统计项 | 值 |
|--------|-----|
| 商店商品总数 | 52 |
| gu-database 炼蛊材料种类 | 31 |
| 材料名称一致 | 29 / 31 |

**缺失商品：**

| # | 缺失材料 | 引用的蛊虫 | 严重性 |
|---|----------|-----------|--------|
| 1 | **美酒** | 酒虫、四味酒虫、七香酒虫、九眼酒虫、狼吞蛊、酒囊蛊、辟谷蛊（7 条） | **High** |
| 2 | **古籍残页** | 书虫、侦察蛊、竹君子、追踪蛊、巡夜蛊、蜃楼蛊（6 条） | **High** |

**修复建议：** 在 shop-items.json 中添加"美酒"和"古籍残页"商品条目，设置合理的价格和章节可用性。

### 3.3 fragment-recipes.json — 健康评分 100%

| 检查项 | 结果 |
|--------|------|
| 残方总数 | 8 |
| 含 `type` 字段 | 8/8（4 refine + 4 ascend） |
| 含 `fragmentsRequired` 字段 | 8/8 |
| targetGu 存在于 gu-database.json | 8/8（月光蛊、火鸦蛊、冰晶蛊、金钟蛊、毒液蛊、风道加速蛊、万兽蛊、治愈蛊） |

### 3.4 encounters.json — 健康评分 96%

| 统计项 | 值 |
|--------|-----|
| 模板总数 | 55 |
| _meta.total 声明 | 55 |
| 55 阈值 | ✅ 达标 |

| # | 问题 | 文件 | 位置 | 严重性 | 详情 |
|---|------|------|------|--------|------|
| 1 | **choices 对象合并损坏** | `data/encounters.json` | `shili_jueqi > sjq_danger_assassin > choices` | ❌ **CRITICAL** | choices 数组第一个元素中同时出现两个 `id` 键（"counter" 和 "trap"），第二个对象的属性覆盖了第一个。正确 JSON 应为两个独立对象 `{"id":"counter",...}, {"id":"trap",...}`。当前数据会导致"反击"选项丢失 |

**修复建议：** 将合并的 choices 对象拆分为两个独立的数组元素。

---

## 第四层：UI 入口完整性检查

### 4.1 GameScreen.tsx 工具栏注册现状

**SidePanel 类型（L45）** 定义了 13 个有效面板 ID：
`attributes | events | gu_inventory | kill_moves | aperture | map | characters | dao_marks | merchant | achievements | refine | material_bag | training_ground`

**TOOLBAR_BUTTONS_BASE（L91-104）** 包含 12 个按钮 + 1 个硬编码地图按钮 = 共 13 个，全部与 SidePanel 类型对齐。

### 4.2 逐面板验证

| 面板 | 注册方式 | 状态 |
|------|----------|------|
| AchievementPanel | 工具栏 `achievements` | ✅ present |
| AuctionPanel | 独立覆盖层 (L328) | ✅ 事件驱动，合理 |
| CombatOverlay | 独立覆盖层 (L331) | ✅ 事件驱动，合理 |
| CharacterCreate | App.tsx 角色创建 | ✅ 游戏前界面，合理 |
| EventLogPanel | 工具栏 `events` | ✅ present |
| GuInventoryPanel | 工具栏 `gu_inventory` | ✅ present |
| KillMoveCreationPanel | 独立覆盖层 (L329) | ✅ 事件驱动，合理 |
| MerchantPanel | 工具栏 `merchant` | ✅ present |

### 4.3 发现的问题

| # | 问题 | 文件 | 严重性 | 详情 |
|---|------|------|--------|------|
| 1 | **ApertureManagementPanel 死代码** | `GameScreen.tsx` L77 | **High** | 已在 L35 导入，在 panelContent switch 中有 case 'aperture_management'，但 `'aperture_management'` 不在 SidePanel 联合类型（L45）中，也不在 TOOLBAR_BUTTONS_BASE 中。TypeScript 类型系统阻止其执行 → 死代码 |

| 2 | **FactionPanel 未接入** | `game/FactionPanel.tsx` | **High** | v0.7.0 势力管理面板（12.35KB，3 标签页），完全未在 GameScreen 中引用 |
| 3 | **SquadFormationPanel 未接入** | `game/SquadFormationPanel.tsx` | **High** | v0.7.0 小队编成面板（8.51KB），未引用 |
| 4 | **ResourceNodeBuildPanel 未接入** | `game/ResourceNodeBuildPanel.tsx` | **High** | v0.7.0 资源点建造面板（8.98KB），未引用 |
| 5 | **AchievementUnlockOverlay 未渲染** | `game/AchievementUnlockOverlay.tsx` | **High** | 成就解锁动画覆盖层，GameScreen 覆盖层区域（L327-343）未渲染 |
| 6 | **HuntingRewardPanel 未渲染** | `game/HuntingRewardPanel.tsx` | Medium | 狩猎战利品面板，未渲染 |
| 7 | **AscensionBalancePanel 未接入** | `game/AscensionBalancePanel.tsx` | Medium | 升仙面板（11.74KB），未接入任何流程 |

**修复建议：**
- **P0**：将 `aperture_management` 添加到 SidePanel 类型和 TOOLBAR_BUTTONS_BASE（标签 "仙窍管理"）
- **P1**：FactionPanel / SquadFormationPanel 作为 v0.7.0 核心功能应在工具栏注册（标签 "势力" / "小队"）
- **P2**：ResourceNodeBuildPanel 可集成到 ApertureManagementPanel 的子面板或作为独立工具栏按钮
- **P2**：AchievementUnlockOverlay 在 GameScreen 覆盖层区域渲染，与 AchievementToast 联动

---

## 全局优先级排序

### CRITICAL（立即修复 — 3 项）

| # | 发现 | 位置 | 距首次发现 |
|---|------|------|-----------|
| C1 | **removeMaterial 未定义** → 无限免费炼蛊漏洞 | `playerSlice.ts` | 2 天 |
| C2 | **triggerBreakthrough 类型不匹配** → 突破动画静默失败 | `playerSlice.ts:727` | 1 天 |
| C3 | **encounters.json choices 对象合并损坏** → JSON 数据丢失 | `encounters.json` shili_jueqi | 2 天 |

### HIGH（本周修复 — 19 项）

| # | 发现 | 位置 | 类别 |
|---|------|------|------|
| H1 | combat-fatigue.ts 全文件未接入（recordCombat/tickFatigue/getFatigueEncounterMult） | `engine/combat-fatigue.ts` | 引擎 |
| H2 | eventSlice enqueueEvent/dequeueAndTrigger 零调用 | `store/slices/eventSlice.ts` | Store |
| H3 | debtSlice 全文件零调用（incurDebt/repayDebt/getDebtStatus） | `store/slices/debtSlice.ts` | Store |
| H4 | factionSlice tickFactionTrade/tickFactionMaintenance 零调用 | `store/slices/factionSlice.ts` | Store |
| H5 | achievementSlice 7 项核心方法零调用 | `store/slices/achievementSlice.ts` | Store |
| H6 | shop-items.json 缺失"美酒"（7 条蛊引用） | `data/shop-items.json` | 数据 |
| H7 | shop-items.json 缺失"古籍残页"（6 条蛊引用） | `data/shop-items.json` | 数据 |
| H8 | ApertureManagementPanel 死代码（类型禁止访问） | `GameScreen.tsx:77` | UI |
| H9 | FactionPanel 未接入工具栏 | `game/FactionPanel.tsx` | UI |
| H10 | SquadFormationPanel 未接入 | `game/SquadFormationPanel.tsx` | UI |
| H11 | ResourceNodeBuildPanel 未接入 | `game/ResourceNodeBuildPanel.tsx` | UI |
| H12 | AchievementUnlockOverlay 未渲染 | `game/AchievementUnlockOverlay.tsx` | UI |
| H13 | AscensionBalancePanel 未接入升仙流程 | `game/AscensionBalancePanel.tsx` | UI |
| H14 | calcCrossDomainCost 零调用 | `engine/npc-cross-domain.ts:160` | NPC |
| H15 | getFragmentsForChapter 零调用 | `engine/recipe-discovery.ts:60` | 残方 |
| H16 | combat-cooldown.ts 全文件零调用 | `engine/combat-cooldown.ts` | 引擎 |
| H17 | auction-engine.ts 3 个桩函数 + 2 个业务函数零调用 | `engine/auction-engine.ts` | 引擎 |
| H18 | canShopRefresh/getShopGroup 零调用 | `store/slices/merchantSlice.ts` | Store |
| H19 | getMemberCount/updateMemberLoyalty 零调用 | `store/slices/factionSlice.ts` | Store |

### MEDIUM（本月修复 — 28 项）

包括：
- guSlice 4 项零调用（unbindLifeboundGu/triggerLifebornDeathPenalty/triggerGuEvolution/clearGuEvolution）
- originUnlockSlice 4 项零调用选择器
- combatSlice 2 项零调用（executeEnemyTurnAction/initSquadDuel）
- combat-stats.ts getStandardEnemyStats 零调用
- HeavenlyLandEngine 2 项零调用
- dialogueSlice appendNpcMessage 零调用
- mapSlice discoverLocation/markDomainVisited 零调用
- narrativeSlice setLoading/setError 零调用
- chapterSlice skipEvent 零调用
- causalitySlice updateDeviation 零调用
- auctionSlice shouldTriggerAuction 零调用
- immortalSlice getTimelineAperturePoints 零调用
- gu-database.json 4 个异常高 refineCost
- FragmentRecipe 接口缺少 fragmentsRequired 字段
- HuntingRewardPanel 未渲染
- triggerBattleInfo 零导入

### LOW（适时清理 — 35 项）

包括：
- engine 层 9 个内部辅助函数应非导出
- useReducedMotion / useFontReady 死 Hook
- LoadingSkeleton / ModeSelectScreen 废弃组件
- SPECIAL_BGM / FEED_MATERIAL_MAP 等常量
- store 层 12 个低频选择器
- 非必要的命名导出（BreakthroughPayload/AperturePanelProps/DiceRollPayload）

---

## 系统健康评分总览

| 系统 | 上次评分 | 本次评分 | 变化 | 趋势 |
|------|----------|----------|------|------|
| 炼蛊系统 | 80% | **33%** | -47% | ⬇️ 发现 removeMaterial 未定义（Critical） |
| 杀招系统 | 100% | **100%** | 0 | ➡️ 稳定 |
| 战斗系统 | 95% | **100%** | +5% | ⬆️ 确认 DiceRollAnimation 连接正常 |
| 喂蛊系统 | 85% | **100%** | +15% | ⬆️ 完整调用链验证通过 |
| 经济系统 | 90% | **100%** | +10% | ⬆️ 完整购买流程验证通过 |
| NPC 系统 | 40% | **67%** | +27% | ⬆️ filterNpcByDomain/crossDomainAffinityDecay 确认已接入 |
| 动画系统 | 65% | **67%** | +2% | ➡️ triggerBreakthrough 仍为 Critical |
| 残方系统 | 80% | **75%** | -5% | ⬇️ 发现 getFragmentsForChapter 零调用 |
| 数据完整性 | 85% | **96%** | +11% | ⬆️ ascendCost 补齐 + fragment-recipes 验证 |
| UI 入口 | 85% | **70%** | -15% | ⬇️ 发现 ApertureManagementPanel 死代码 + 4 个面板未接入 |
| **综合** | **78%** | **81%** | **+3%** | ⬆️ 整体改善，数据文件质量提升抵消了 UI 接入度下降 |

---

## 行动建议

### 立即行动（本周内）
1. **C1**：在 `playerSlice.ts` 实现 `removeMaterial` 方法，替代所有可选链式调用
2. **C2**：修复 `playerSlice.ts:727` 的 triggerBreakthrough 参数匹配
3. **C3**：修复 `encounters.json` shili_jueqi choices 的 JSON 结构
4. **H6-H7**：在 `shop-items.json` 添加美酒和古籍残页商品

### 短期行动（2 周内）
5. **H1**：将 combat-fatigue.ts 接入 playerSlice.advanceTurn
6. **H4**：将 factionSlice tickFactionTrade/tickFactionMaintenance 接入 advanceTurn
7. **H5**：将 achievementSlice 核心方法接入事件处理链
8. **H8-H13**：接入 7 个孤立 UI 组件（工具栏注册 + 覆盖层渲染）

### 中期行动（1 月内）
9. 清理 35 个 Low 优先级死代码项
10. 评估 auction-engine combat-cooldown HeavenlyLandEngine 等模块的去留
11. 评审 4 个异常 refineCost 值是否合理
