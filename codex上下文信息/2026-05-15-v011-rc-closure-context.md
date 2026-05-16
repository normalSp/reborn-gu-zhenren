# 2026-05-15 v0.11.0-rc 收束交接

## 当前状态

`v0.11.0` 已完成为本地开发里程碑。主线 `活世界地基与自由意图闸门` 已交付：

- 自由意图本地裁决入口。
- 持久化 `livingWorldState` 与 v22 迁移。
- 原著事实卡试点与隐藏事实 ref 保护。
- 可见范围调查。
- 白家接触压力样本、正式接触窗口行动。
- 方源隐藏保护失败账本。
- 逃离青茅山路线准备链。
- 开发流程、用户输入协议、测试工程化、项目仪表盘和 Git 制度。

## 本轮新增/收束

- `v0.11.0-b2-5`：白家接触窗口正式行动。
- `v0.11.0-b2-6`：逃离青茅山路线准备链。
- `v0.11.0-rc`：质量收束与全量验证。
- `v0.12.0` 候选池已补入 b2 后续：route/supply/pursuit、NPC/faction reaction、方源公开旁证询问。

## 验证结果

已通过：

- `npm test -- src/engine/v011-qingmao-bai-contact-window.test.ts src/engine/v011-qingmao-escape-route-prep.test.ts src/engine/v011-qingmao-investigation-followups.test.ts src/store/slices/livingWorldSlice.test.ts`
- `npx tsc --noEmit --pretty false`
- `npm run test:e2e -- tests/e2e/v011-free-goal-panel.spec.ts`
- `npm test`
- `npm run build`
- `npm run check:runtime-assets`
- `npm run check:qingmao-assets`
- `npm run check:production-preview`
- `npm run test:e2e:long`
- `npm run test:e2e -- tests/e2e/v010-qingmao-region-actions.spec.ts tests/e2e/v090-b3-qingmao-battlefield.spec.ts`

统计口径：

- Full unit：107 个 test file，632 个测试通过。
- Long e2e：29 个测试通过。
- Qingmao region + battlefield e2e：7 个测试通过。
- Production preview smoke：通过。

## 下次进入时先读

1. `.codex/skills/reborn-expert-council/references/PROJECT-STATE.md`
2. `指导大纲/v0.11.0/codex/00-总览/v0.11.0-项目仪表盘.md`
3. `指导大纲/v0.11.0/codex/00-总览/v0.11.0-rc-质量收束记录.md`
4. `指导大纲/v0.12.0/codex/00-总览/README.md`
5. `指导大纲/v0.12.0/codex/00-总览/v0.12.0-候选专项池.md`

## 需要用户决策

继续开发前，需要冻结 `v0.12.0` 范围。建议候选：

1. 青茅逃离路线 route / supply / pursuit 系统。
2. NPC / faction reaction engine 第一刀。
3. 方源公开旁证事实卡与询问行动。
4. GitHub / CI 工程门禁。
5. 存档 / 架构加固后续。

冻结前不得扩展正式地点解锁、阵营身份变更、NPC 生死或正史锚点、奖励、持久化字段、DeepSeek 权限或对外发布承诺。

## Git 状态

本阶段未提交/未推送。原因：当前工作区有大量历史脏项和未跟踪文件，且本地分支名仍偏旧。下一次提交建议按 `v0.11.0-Git提交与推送制度.md` 只 stage 本阶段相关源码、测试、文档、PROJECT-STATE、skills 和交接文件。
