# 2026-05-15 v0.12.0 大纲草案交接

## 当前状态

`v0.12.0` 正式大纲已建立，用户已批准推荐组合，尚未进入 runtime 开发。

主线草案：

`青茅山正史锚点与 IF 框架`

## 本轮完成

新增/更新：

- `指导大纲/v0.12.0/codex/00-总览/README.md`
- `指导大纲/v0.12.0/codex/00-总览/v0.12.0-总体开发大纲.md`
- `指导大纲/v0.12.0/codex/00-总览/v0.12.0-启动审查与范围冻结.md`
- `指导大纲/v0.12.0/codex/00-总览/v0.12.0-小版本执行路线图.md`
- `指导大纲/v0.12.0/codex/00-总览/v0.12.0-需求决策池.md`
- `指导大纲/v0.12.0/codex/00-总览/v0.12.0-真相源索引.md`
- `指导大纲/v0.12.0/codex/00-总览/v0.12.0-项目仪表盘.md`
- `指导大纲/v0.12.0/codex/00-总览/v0.12.0-候选专项池.md`
- `.codex/skills/reborn-expert-council/references/PROJECT-STATE.md`
- `AGENTS.md`
- `reborn-expert-council` / `game-dev-text` / `reverend-insanity-lore` skills

## 专家团口径

用户提出的长期路线定义适合进入 v0.12 大纲：

- 原著青茅山事实卡抽取。
- 正史锚点表。
- 玩家可见事实/隐藏事实分离。
- IF 偏离规则和代价。
- 青茅关键压力链：族学、三寨、狼潮、资源、战后路线等，以原著抽取为准。

专家团调整：

- 第一刀先做事实卡扩展与正史锚点表，不先做路线行动。
- route/supply/pursuit 作为第一条正式行动链，但放在事实/IF 地基之后。
- NPC/faction reaction 在 v0.12 只做轻量 bridge，不替代 v0.13 完整 NPC 系统。
- 方源公开旁证询问放在更多公开事实卡和隐藏门禁之后。
- GitHub/CI 作为 process 小刀穿插，不抢活世界主线。

## 用户已批准

1. `v0.12.0` 主线：`青茅山正史锚点与 IF 框架`。
2. `v0.12.0-a1` 第一刀：原著事实卡扩展与正史锚点表。
3. `v0.12.0-a2`：IF 偏离规则和代价。
4. `v0.12.0-b1`：route/supply/pursuit 第一刀。
5. `v0.12.0-b2`：NPC/faction reaction bridge 第一刀。
6. `v0.12.0-process-1`：GitHub/CI 工程门禁小刀。

建议延期：

- 方源公开旁证询问，等公开事实卡足够后做。
- 新持久化字段，等 b1/b2 确认需要后单独决策。
- 白家正式投靠。

建议不进本轮：

- 完整狼潮主线。
- 逃离成功或新地域正式开放。
- 方源隐藏因果泄露。
- NPC 生死或正史核心锚点改写。

## 当前讨论

用户正在讨论长期架构：纯前端承载所有引擎/子系统的优缺点、是否需要后端或组件支持、是否重复造轮子。runtime 开发需等架构讨论后再进入 `v0.12.0-a1`。

## 验证

本轮只改文档和 skill，没有运行 runtime 测试。最近完整质量基线仍是 `v0.11.0-rc`：

- `npm test`
- `npx tsc --noEmit --pretty false`
- `npm run build`
- runtime/Qingmao asset scans
- production-preview smoke
- FreeGoalPanel e2e
- long e2e
- Qingmao region + battlefield e2e

## Git 状态

本轮未 commit / 未 push。当前工作区仍有大量历史脏项；提交前应按 Git 制度只 stage v0.12 大纲相关文件和同步文件。
