# 2026-05-10 v0.8.0 蛊虫表现化战斗与动效 skill 上下文

## 当前状态

- 工作区：`D:\workspace\CodeBuddyWorkSpace\RebornG_codebuddy`
- 分支：`codex/v070-release-closure`
- 本轮性质：v0.8.0-pre 地基落地，不提升 `SAVE_FORMAT_VERSION`。
- 本轮重点：把“蛊虫/杀招描述必须进入可结算、可显示、可被剧情调用”的计划落成文档、canon 数据、类型、读取器、测试和独立 skill。

## 已落地

### Canon 数据

- `src/canon/gu-expression-specs.json`
  - 首批 53 只蛊虫表现规格。
  - 覆盖攻击/压制、防御/护持、控制/地形、侦察/情报、续航/辅助、禁忌样板。
  - 禁忌蛊如 `血颅蛊`、`妇人心蛊` 标记为 `scene_gated` + `mortal_forbidden`，不进入普通战斗按钮。
- `src/canon/killer-move-expression-specs.json`
  - 首批 15 个杀招样板。
  - 每个杀招都有核心蛊、辅助蛊、棋盘形状、蓄势、释放、维持、破绽、失败模式、反噬和视觉节拍。

### 类型与引擎入口

- `src/types/index.ts`
  - 新增 `GuExpressionSpec`、`KillerMoveExpressionSpec`、`BattlefieldCombatState`、`BattleResolutionStep` 等 v0.8 表现化战斗协议。
- `src/engine/gu-expression-registry.ts`
  - `listGuExpressionSpecs`
  - `getGuExpressionSpec`
  - `listKillerMoveExpressionSpecs`
  - `getKillerMoveExpressionSpec`
  - `listSceneUtilitiesForGu`
  - `buildGuResolutionStepDraft`

### 测试

- `src/engine/v080-combat-expression-data.test.ts`
  - 守门首批蛊虫覆盖、流派合法性、独特性字段、禁忌蛊场景门槛。
  - 守门 15 个杀招样板的核心蛊/辅助蛊/失败/反噬/视觉节拍。
  - 守门剧情用途查询和 `BattleResolutionStep` 草稿可供 UI 消费。

### 文档

- 更新：`指导大纲/v0.8.0/codex/00-总览/v0.8.0-开发阶段跟踪.md`
  - 增加战斗深化和全局动效重皮为 v0.8 一级重点。
  - 明确仙蛊 v0.8 只做授权/见闻/临时借用/高压演出，仙蛊屋暂不做运行时战斗系统。
- 新增：
  - `指导大纲/v0.8.0/codex/03-战斗深化/蛊虫表现化战斗系统设计.md`
  - `指导大纲/v0.8.0/codex/03-战斗深化/首批凡蛊与杀招样板清单.md`
  - `指导大纲/v0.8.0/codex/04-前端动效/GSAP-Motion-全局重皮规范.md`

### Skill

- 新增：`C:\Users\11411\.codex\skills\reborn-combat-motion\SKILL.md`
  - 专管 RebornG 战斗表现、GSAP/Motion 分工、`BattleResolutionStep` 播放、GPT-5.5 动效提示词和浏览器验收。
- 更新：`C:\Users\11411\.codex\skills\game-dev-text\SKILL.md`
  - 只加轻量引用：涉及 v0.8 战斗动效/UI 时同时使用 `reborn-combat-motion`。

## 验证结果

- `npm test -- src/engine/v080-combat-expression-data.test.ts`
  - 通过：1 个测试文件 / 6 个用例。
- `npm test`
  - 通过：58 个测试文件 / 375 个用例。
- `npm run build`
  - 通过：最大 chunk `combat-squad` 约 427.82 kB，无 500KB+ 警告。
- `npm run test:e2e:long`
  - 通过：18 条 Playwright 长测路径。

## 后续入口

1. v0.8.0-a 下一步应实现轻地图棋盘 UI，组件只能消费 `BattleResolutionStep` 和表现规格，不在 UI 私算伤害/状态。
2. 将 `listSceneUtilitiesForGu` 接入 context-builder 或选择生成前置上下文，让剧情选择识别玩家持有蛊虫的侦察、追踪、治疗、解毒、破障、遮掩等用途。
3. 把现有 `CombatOverlay` 的“攻/防/技能/杀招/逃跑”改造成：蛊虫、杀招、阵法、身法、观察、撤退。
4. 对首批 53 蛊做逐步数值校准；当前数据是表现协议和验收闸门，不是最终 TTK 调参。

## 注意事项

- 本轮没有修改存档格式，也没有给玩家新增持久化战斗状态。
- 本轮没有实现最终战斗 UI，只落地 UI 所需协议、数据、文档和 skill。
- 工作区仍保留 v0.7.1 RC 之前的大量未提交改动；本轮未回退它们。
