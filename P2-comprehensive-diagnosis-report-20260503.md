# P2 质量审计完整诊断报告

**审计日期**: 2026-05-03
**审计范围**: 全项目代码 × 6 份指导大纲交叉对比
**状态**: 诊断完成，待用户确认后执行修复

---

## 执行摘要

本次审计发现 **12 项明确问题**，其中 P0 级 4 项（游戏无法正常运行）、P1 级 5 项（严重影响体验）、P2 级 3 项（质量未达标）。

核心发现：**域识别链路存在系统性断裂**——从 INITIAL_STATE 硬编码 南疆、到双重 initChapter 竞态、到 injectChapterConstraints 从错误数据源获取章节信息——整条链路有 4 个独立缺陷点，导致"选中洲→显示青茅山→选项前往山寨"的连锁错误。这不是单一 bug，而是设计层面对五域开局的初始化流程缺乏统一管理。

P2 大纲中的数据层（chapters.json 22章、npcs.json 202人、achievements.json 26成就、gu-database.json 91蛊虫）已按 P2 要求完成填充。但运行时链路（数据→store→UI→AI prompt）存在多处断裂。

---

## 问题清单

### P0-1: 域链路系统性断裂（"选中洲→青茅山→前往山寨"）

**现象**:
- 在 OriginSelectScreen 选择 中洲 身份，完成角色创建后，StatusBar 显示 "第一章 · 青茅山期"（而非 "第一章 · 宗门弟子"）
- AI 生成的第一个选项是 "前往山寨"（南疆 context），点击后叙事回到南疆

**根因链**:

```
缺陷点①: INITIAL_STATE 硬编码
  src/store/initialState.ts:21  profile.background = '南疆'
  src/store/initialState.ts:130 currentDomain = '南疆'
  → resetStore() 总是将域重置为南疆

缺陷点②: 双重 initChapter 竞态
  CharacterCreate.handleConfirm (line 153-163):
    异步 import chapters.json → initChapter(opening.id, originDomain)
  useGamePipeline.startGame (line 56-78):
    同步 initChapter(openingChapter.id, domain)
  → 两个调用可能以不可预测的顺序执行，最后一次覆盖前一次

缺陷点③: injectChapterConstraints 数据源错误
  src/engine/context-builder.ts:206-208:
    currentChapter = flags.current_chapter    ← 从 flags 读取（可能未同步）
    currentDomain = flags.current_domain || store.currentDomain || ''
  → chapterSlice.initChapter 设置 flags.current_chapter (line 114-118)
    但 if async initChapter 未完成 / store 未同步 → flags.current_chapter 可能为空
  → flags 查找失败 → chapterDef 为 null → 无章节约束注入
  → AI 缺乏域约束 → 可能生成南疆 context

缺陷点④: migrate 默认域
  src/store/index.ts:367:
    if (persistedState.currentDomain === undefined) persistedState.currentDomain = '南疆';
  → 存档迁移时默认域为南疆
```

**修复方向**: 统一初始化入口，消除竞态；injectChapterConstraints 改为从 store.currentChapterId 直接读取章节定义；去除 INITIAL_STATE 中的域硬编码。

---

### P0-2: 存档持久化 — "继续游戏"按钮消失

**现象**: 之前实现了基于 `turn > 1 && profile.name 非空` 的 "继续冒险" 按钮，但现在刷新浏览器后按钮消失。

**根因链**:

1. Zustand persist 中间件 key 为 `'gu-zhenren-save'`（store/index.ts:307）
2. App.tsx:71 的 `onStart` 处理函数调用 `resetStore()` → 立即执行 `localStorage.removeItem('gu-zhenren-save')`（store/index.ts:156）
3. resetStore 将状态设为 INITIAL_STATE（turn=1, profile.name=''）
4. persist 中间件检测到状态变更 → 将 INITIAL_STATE 写入 localStorage → **覆盖了已存档数据**
5. 下次刷新时 persist 恢复 turn=1, name='' → `hasSavedGame = false`

**关键：这不是"继续游戏功能坏了"，而是"点击新游戏时过早销毁了存档数据"。** resetStore 在 title screen 就被调用（点击"进入蛊界"按钮 → mode_select），而非等到玩家实际完成角色创建后才清除存档。

**修复方向**: 将 localStorage 清除延迟到 CharacterCreate.handleConfirm 成功后；或给 resetStore 增加参数控制是否清除 localStorage。

---

### P0-3: 成就系统 — 刷新浏览器后成就重置

**现象**: 用户刷新浏览器后，已解锁的成就从零开始。

**代码已正确实现的部分**:
- `achievementSlice.ts:22-24`: 使用独立 localStorage key `'gu-zhenren-achievements'` 
- `store/index.ts:158-173` (resetStore): 正确从独立 key 恢复成就数据
- `store/index.ts:407-413` (partialize): 正确排除成就字段，避免双重真相源
- `main.tsx:25-31`: 正确调用 `loadAchievementDefinitions` 加载 26 成就定义
- `response-pipeline.ts:380-406`: 每轮 RESOLVED 后正确调用 `checkAchievements`

**失效原因分析**:

最可能的根因是**成就定义未成功加载** —— `_achievementDefs` 为空时 `checkAchievements` 直接返回 `[]`（achievementSlice.ts:93）。检查调用链：

`main.tsx:27-28`:
```
const raw = (achievementsData as any).achievements || [];
useStore.getState().loadAchievementDefinitions(raw);
```

这里 imports `achievementsData` from `'../canon/achievements.json'`。如果 achievements.json 中 `achievements` 数组的 key 名称与代码消费的不一致，或者 `useStore.getState()` 在 persist 水合完成前被调用，都可能导致加载失败。

**次要风险**: 刷新后 persist 中间件水合阶段可能用迁移默认值 `[]` 覆盖了 achievementSlice 从独立 key 加载的数据。需要验证水合顺序。

**修复方向**: 验证 achievements.json 的 JSON 结构能被正确消费；确保成就定义加载在 persist 水合完成后执行；增加防御性日志。

---

### P0-4: UI 舆图按钮固定显示 "南疆舆图"

**现象**: 底部工具栏地图按钮固定显示 "南疆舆图"，选中洲或其他域开局也显示此标签。

**根因**:

GameScreen.tsx:324 的代码 `${currentDomain}舆图` 本身是正确的动态逻辑。问题在于 store 中的 `currentDomain` 值未正确更新——因为 P0-1 域链路断裂，`currentDomain` 实际值仍为初始化默认值 `'南疆'`（INITIAL_STATE:130）。

**修复**: 修复 P0-1 域链路后，此问题应自动解决。

---

### P1-1: BGM 质量完全不契合蛊真人风格

**现象**: 当前 BGM 文件为 Klaus Neumaier - Harpsichord Pack（大键琴/羽管键琴独奏），来自 ccMixter（CC BY 3.0）。完全不符合蛊真人的黑暗修真/古风/武侠氛围。

**数据验证**:
- 五域 BGM 路径映射正确（soundSlice.ts:12-18）
- 文件确实存在于 `public/audio/bgm/{domain}/{domain}.mp3`
- 但所有域使用的是同一个 Harpsichord Pack（music_manifest.json 显示仅 1 条 track 记录）
- `public/audio/sfx/` 有 13 个 mp3 文件（已正确接入，点击提示音正常工作）

**大纲要求**（P2-7 音效系统增强）:
- 南疆: 山岚氛围 / 古琴+竹笛为主
- 北原: 苍茫草原 / 马头琴+呼麦元素
- 东海: 海浪波涛 / 空灵氛围
- 西漠: 大漠孤烟 / 西域乐器
- 中洲: 庄严秩序 / 编钟+古筝

**修复方向**: 从国内免费音乐平台搜索下载五域高质量 BGM，每域至少 1 首主题曲。

---

### P1-2: 新手引导未按域定制

**现象**: TutorialOverlay 使用全局硬编码 `PAGES` 数组（4 页通用内容），无论选择哪个域开局都显示相同的引导内容。

**现有实现**:
- `TutorialOverlay.tsx`: 硬编码 PAGES 数组（4 页：蛊师四维/道心四极/风险与选择/蛊虫与修行）
- `tutorialSlice.ts`: 有 FSM 骨架（startTutorial/advanceStep/skipTutorial/completeTutorial）但 PAGES 不从 store 读取

**大纲要求**（全书覆盖文档 Sec 4.1）:
- 南疆: 山寨家族丛林法则引导
- 北原: 部落血统至上引导
- 东海: 散修自由探索引导
- 西漠: 绿洲生存优先引导
- 中洲: 宗门秩序规则引导

**修复方向**: 为五域各定义专属引导内容数组，TutorialOverlay 根据 `store.currentDomain` 动态选择。

---

### P1-3: 中洲章节 exitTriggers 设计缺陷

**现象**: 中洲第四章 `zhongzhou_skywatch`（宿命线索）的 exitTriggers 写为 "天庭的注视让你意识到中洲格局的局限——或许南疆的自由、北原的战火、西漠的古老秘密、或东海的散修天地能给你更多答案"，这是一个叙事性描述而非机器可解析的跨域路由指令。

**对比**: 南疆第五章 `sanwang_yitian` 的 exitTriggers 为 "南疆→北原域切换"（格式为 `→{目标域}域切换`），章节路由引擎（chapter-router.ts:183）可正确解析。

**影响**: 中洲玩家完成域内所有章节后无法自动跨域跳转，路由引擎无法解析中洲第四章的 exitTriggers 格式。

**修复方向**: 统一 exitTriggers 格式为标准 `→{目标域}域切换`。

---

### P1-4: encounters.json 覆盖不完整（22/55）

**现象**: 随机遭遇系统仅覆盖南疆前 2 章（青茅山 11 条 + 商路求生 11 条），其余章节（南疆后 3 章 + 其他四域全部章节）遭遇池为空。

**P2 大纲要求**: encounters.json 含 55 条模板，5 章 × 5 类型覆盖。

**实际**: 22/55 完成（40%），剩余 33 条待批处理。

**风险**: 南疆第三章开始及所有非南疆域开局缺乏随机遭遇内容，游戏体验密度不足。

**修复方向**: 按域分批填充 encounters.json 剩余 33 条模板。

---

### P1-5: 成就 JSON 结构异常

**现象**: `achievements.json` 存在两个 `_meta` 键（第 2 行 v2.0 和末尾 v2.1），在严格 JSON 解析中可能导致行为未定义。

**数据验证**:
- 总成就: 26 个（18 常规 + 8 跨域，与 `_meta.total: 26` 一致）
- 稀有度分布: bronze 14, silver 11, gold 2
- 隐藏成就: 3 个（dark_choice, mercy_path, kill_path）
- 领域分布: 通用 18, 南疆 1, 北原 2, 东海 2, 西漠 2, 中洲 2
- 顶层结构: `"achievements"` 数组包裹，正确

**修复方向**: 移除重复的 _meta 条目，保留一个。

---

### P2-1: 教程系统与 tutorialSlice 解耦

**现有问题**: TutorialOverlay.tsx 使用自己的 localStorage key `'gu-tutorial-done'` 和硬编码 PAGES，完全未使用 store 中的 tutorialSlice（state/currentStep/skippable/api）。

tutorialSlice 有完整的 FSM（startTutorial/advanceStep/skipTutorial/completeTutorial）但从未被 TutorialOverlay 调用。两者完全解耦。

**修复方向**: 重构 TutorialOverlay 接入 tutorialSlice；按域定制 PAGES 数据源。

---

### P2-2: contextBuilder.buildOpeningPrompt 使用 "天元皇朝" 等非原著术语

**现象**: `context-builder.ts:52-53` 中洲配置使用 "天元皇朝治下的仙门坊市"——"天元皇朝"和"仙门"非蛊真人原著术语。

**原著正确术语**: 中洲 = 十大门派（十大古派）、天庭、正道秩序。不存在"天元皇朝"。

**原文引用**: 全书覆盖文档 Sec 2.2 "中洲（宗门/正统·秩序维护）：叙事范式是在正道秩序内爬升地位并应对道德困境。"

**修复方向**: 修正 DOMAIN_OPENING 中洲配置为原著准确术语。

---

### P2-3: AudioManager 音量桥接时序问题

**现象**: App.tsx:24-35 使用 useEffect 桥接 soundSlice → AudioManager。但 AudioManager 初始化（init）依赖用户交互后才有 AudioContext。如果 BGM 在没有用户交互时尝试播放，AudioContext 会处于 suspended 状态。

**当前实现**: AudioManager.init() 在每次 playBgm/playSfx 调用时自动调用，内建 `ctx.resume()`。但 App.tsx 的 setVolumeGetters 只在 soundState 变化时更新回调，不触发 AudioContext 恢复。

**修复方向**: GameScreen 的 BGM 自动播放处添加 AudioContext 恢复逻辑。

---

## 6 份指导大纲交叉对比

| 大纲文档 | 关键要求 | 实际代码状态 | 差距 |
|---------|---------|------------|------|
| 总体开发大纲与系统设计指导文档（3250行） | P1 南疆三章验证通过 + P2 五域全量 + P2-2a 8核心事件L0-L3四层涟漪 | chapters.json 22章完整，8核心事件定义完整 | 运行时链路断裂导致部分功能不可用 |
| P2-下一步真实开发计划（322行） | P2 21/21 (100%) 全部完成，158/158 测试通过 | P2-7 音效系统（AudioManager 285行）、P2-8 成就系统（18→26成就）、P2-9 随机遭遇（22/55）、P2-10 起源解锁（5/5） | BGM 素材质量不合格；encounters 覆盖仅 40% |
| 前端展示样式与风格重构总体大纲（1419行） | M7 Phase 0F-4 全 5 阶段 100% 完成 | Lint 零错误、Vitest 158/158、Vite Build 成功 | ARIA 无障碍为存量缺陷（非 M7 引入）；颜色硬编码部分未使用 CSS Token |
| 全书覆盖可行性评估与开发指导文档（561行） | 五域差异化叙事范式、域开局体验差异化、开局数据层设计 | chapters.json 已按五域 22 章定义，NPC 202 人已分配域 | 域识别运行时链路未正确接入；中洲 exitTriggers 格式不统一 |
| 三域事件原型设计文档 | 中洲 5 种事件原型（宗门晋升/正道困境/天庭监视/秩序裂隙/宿命预兆）、东海 5 种、西漠 5 种 | chapters.json 域章节的 sceneConstraints 已基于原型文档填充 | 事件原型仅在 L0 层定义，跨域 L1-L2 涟漪文本可在 AI 引导中增强 |
| M7-Phase4-质量验收报告 | Phase 4 全部通过（含 2 项已知限制 + 3 项存量缺陷） | 报告与代码状态一致 | useDeviceCapability Hook 已定义但未被组件消费（已知限制） |

---

## 优先级矩阵

| 优先级 | 编号 | 问题 | 影响面 | 修复工作量 |
|--------|------|------|--------|-----------|
| **P0** | 1 | 域链路系统性断裂 | 所有非南疆开局玩家 | 中（~4 文件） |
| **P0** | 2 | 存档"继续游戏"消失 | 所有回归玩家 | 小（~2 文件） |
| **P0** | 3 | 成就刷新重置 | 所有玩家 | 小（~2 文件） |
| **P0** | 4 | UI 舆图按钮固定南疆 | 所有非南疆玩家 | 随 P0-1 自动修复 |
| **P1** | 5 | BGM 质量不合格 | 所有玩家 | 中（素材搜索+替换） |
| **P1** | 6 | 教程非域定制 | 所有非南疆玩家 | 中（~3 文件） |
| **P1** | 7 | 中洲 exitTriggers 格式 | 中洲晚期玩家 | 小（1 文件 1 行） |
| **P1** | 8 | encounters 覆盖 40% | 中后期玩家 | 中（1 文件扩展 33 条） |
| **P1** | 9 | 成就 JSON 重复 _meta | 无（Vite 构建兼容） | 极小（1 行） |
| **P2** | 10 | 教程与 tutorialSlice 解耦 | 架构整洁性 | 小 |
| **P2** | 11 | 中洲术语非原著 | 中洲开局玩家 | 极小（1 行） |
| **P2** | 12 | AudioContext 时序 | 首次 BGM 播放 | 极小（1 处） |

---

## 数据层验证（pass 项）

以下 P2 大纲要求已通过代码核实，确认达标：

- NPC 数据库: 202 人，五域各有分配（南疆 61、北原 39、东海 28、西漠 27、中洲 47），全部含 domainTags/dynamicTitles/canonicalNotes ✅
- 章节数据: 五域共 22 章（南疆 5 + 北原 5 + 东海 4 + 西漠 4 + 中洲 4），全部含 sceneConstraints/goals/keyNPCs/domainOpeningChapter ✅
- 蛊虫数据: 91 条目，0 条缺失 feedRequirement ✅
- 五域文化: world-rules.json 每域各 3 条 uniqueRules + 4 个 uniqueTerminology + 概述/社会规范/仪式传统/禁忌红线 ✅
- 全局事件: 8 核心事件 L0-L3 四层涟漪全部定义 ✅
- 起源解锁: 5 个可解锁出身（蛊仙转世/商队后人/散修浪人/战场遗孤/人祖信徒）✅
- 音效系统: AudioManager 285 行完整三通道系统 ✅
- 成就系统: achievementSlice 230 行 + 独立 localStorage 持久化 ✅
- 道痕互斥: combat-config.json pathMatrix 15流派克制矩阵 ✅
- 动态系统: 蛊虫饥饿状态机 + NPC 关系网络 + 洞天福地模型 ✅
- 测试覆盖: 158/158 全量通过 ✅
- 生产构建: Vite Build 零错误 ✅

---

## 总结

本次审计发现的核心矛盾是：**P2 数据层完整度约 95%，但运行时集成链路存在 4 个独立断裂点**，导致"数据准备好了但代码没有正确使用它们"。

最致命的是 P0-1 域链路断裂——这个问题会影响所有非南疆开局玩家（北原/东海/西漠/中洲），使他们看到错误的章节名、错误的叙事 context、错误的地图标签。这是一个系统性而非隔离性 bug。

建议修复顺序：P0-1（域链路）→ P0-2（存档）→ P0-3（成就）→ P1-1（BGM）→ P1-2（教程）→ 其余 P1/P2 项。
