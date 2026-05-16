# 2026-05-16 v0.12.0-rc 质量收束交接

## 当前状态

`v0.12.0` 已完成本地开发里程碑。
下一步：`v0.13.0` 启动审查与范围冻结。

## 本轮完成

v0.12 已完成：

- a1 原著事实卡扩展与正史锚点表。
- a2 青茅低阶 IF 矩阵。
- b1 route / supply / pursuit 准备链。
- b2 NPC / faction reaction bridge。
- b3 方源公开旁证询问。
- process-1 GitHub/CI 工程门禁。
- rc 质量收束。

## 质量验证

全部通过：

- `npm test -- --reporter=dot`：117 个 test file，674 个测试通过。
- `npx tsc --noEmit --pretty false`：通过。
- `npm run build`：通过，无 500KB+ chunk warning。
- `npm run check:runtime-assets`：131 个文件，zero-byte=0。
- `npm run check:qingmao-assets`：10 个 entries，active=4，candidate=3，review-only=2，blocked=1。
- `npm run check:player-visible-copy`：230 个文件通过。
- `npm run check:production-preview`：通过，生产预览根节点高度正常。
- `npm run test:e2e -- tests/e2e/v011-free-goal-panel.spec.ts`：5 个测试通过。
- `npm run test:e2e -- tests/e2e/v010-qingmao-region-actions.spec.ts tests/e2e/v090-b3-qingmao-battlefield.spec.ts`：7 个测试通过。
- `npm run test:e2e:long`：29 个测试通过。

## 文档同步

新增：

- `指导大纲/v0.12.0/codex/00-总览/v0.12.0-rc-质量收束记录.md`

已更新：

- `AGENTS.md`
- `.codex/skills/reborn-expert-council/references/PROJECT-STATE.md`
- `C:\Users\11411\.codex\skills\reborn-expert-council\SKILL.md`
- `指导大纲/v0.12.0/codex/00-总览/README.md`
- `指导大纲/v0.12.0/codex/00-总览/v0.12.0-总体开发大纲.md`
- `指导大纲/v0.12.0/codex/00-总览/v0.12.0-小版本执行路线图.md`
- `指导大纲/v0.12.0/codex/00-总览/v0.12.0-真相源索引.md`
- `指导大纲/v0.12.0/codex/00-总览/v0.12.0-需求决策池.md`
- `指导大纲/v0.12.0/codex/00-总览/v0.12.0-项目仪表盘.md`

## 未改变

- `package.json` 仍为 `0.9.0`。
- `SAVE_FORMAT_VERSION` 仍为 `22`。
- DeepSeek 仍为 `deepseek-v4-flash`。
- 未新增持久化字段。
- 未开放正式逃离、正式阵营变化、声望、NPC 生死、追踪/抓捕、地点解锁、奖励或隐藏事实展示。
- 未改变 EdgeOne 配置。
- 未自动提交、未推送。

## 下一阶段建议

进入 v0.13 前先让专家团提出 3-5 个候选方向，重点候选可能包括：

- 青茅准备链推进到有限结算。
- NPC/势力长期记忆第一刀。
- 青茅公开事件时间压力。
- GitHub Actions 首次远端运行与 branch policy 是否升级。
- 新 MiroFish 包需求：狼潮前置、三寨关系深化、商队路线、战后路线或关键 NPC 公开事实。

## 停点

v0.13 若触碰新的原著事实、IF、NPC、势力、路线、hidden fact、Fang Yuan 公开/隐藏材料，必须先判断 MiroFish 需求。

v0.13 若要新增持久化字段、扩张 DeepSeek 权限、引入外部 runtime 依赖、branch protection、自动发布、EdgeOne 自动部署、正式 route/location unlock，必须先让用户决策。

## Git 状态

未提交，未推送。当前工作区历史脏项很多；提交前必须只 stage 本阶段相关文件。
