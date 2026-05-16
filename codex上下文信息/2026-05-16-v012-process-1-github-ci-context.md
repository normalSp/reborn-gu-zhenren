# 2026-05-16 v0.12.0-process-1 GitHub/CI 工程门禁交接

## 本轮目标

在 `v0.12.0-b3` 方源公开旁证询问完成后，按用户要求继续推进，完成已批准的 `v0.12.0-process-1 GitHub/CI 工程门禁`。

MiroFish：`not_needed`。本阶段只做工程流程，不涉及 canon/IF/NPC/faction/route/Fang Yuan/hidden-fact 数据吸收。

## 已完成文件

- `.github/workflows/ci.yml`
- `.github/pull_request_template.md`
- `.github/ISSUE_TEMPLATE/phase_task.yml`
- `.github/ISSUE_TEMPLATE/bug_report.yml`
- `.github/ISSUE_TEMPLATE/config.yml`
- `指导大纲/v0.12.0/codex/00-总览/v0.12.0-process-1-GitHub-CI工程门禁.md`

同步更新：

- `AGENTS.md`
- `.codex/skills/reborn-expert-council/references/PROJECT-STATE.md`
- `C:\Users\11411\.codex\skills\reborn-expert-council\SKILL.md`
- `指导大纲/v0.12.0/codex/00-总览/README.md`
- `指导大纲/v0.12.0/codex/00-总览/v0.12.0-总体开发大纲.md`
- `指导大纲/v0.12.0/codex/00-总览/v0.12.0-小版本执行路线图.md`
- `指导大纲/v0.12.0/codex/00-总览/v0.12.0-需求决策池.md`
- `指导大纲/v0.12.0/codex/00-总览/v0.12.0-真相源索引.md`
- `指导大纲/v0.12.0/codex/00-总览/v0.12.0-项目仪表盘.md`

## CI 口径

默认 PR / push 质量门：

- `npm ci`
- `npx tsc --noEmit --pretty false`
- `npm test -- --reporter=dot`
- `npm run build`
- `npm run check:runtime-assets`
- `npm run check:qingmao-assets`
- `npm run check:player-visible-copy`

手动 Playwright smoke：

- `workflow_dispatch` 输入 `run_e2e=true`
- `npm run test:e2e -- tests/e2e/v011-free-goal-panel.spec.ts`

## 边界

- 不新增持久化字段。
- 不改 `SAVE_FORMAT_VERSION`。
- 不改 EdgeOne 配置。
- 不新增 runtime dependency。
- 不开启自动发布、自动合并、branch protection。
- 不把 Playwright 全量或长测设为所有 PR 默认必跑。

## 验证状态

本阶段主要是 GitHub 配置和文档落地。已做文件存在性与文档同步检查；后续可在 GitHub 推送后由 Actions 首次实际运行验证。

最近代码完整验证仍来自 b3：

- `npx tsc --noEmit --pretty false`：通过。
- `npm test -- --reporter=dot`：117 个 test file、674 个测试通过。
- `npm run build`：通过。
- `npm run test:e2e -- tests/e2e/v011-free-goal-panel.spec.ts`：5 个测试通过。

## 下一步

进入 `v0.12.0-rc` 质量收束。默认不需要 MiroFish。

停点：

- 如需新增 canon/IF/NPC/route/hidden-fact 内容，先重新判断 MiroFish。
- 如需 branch protection、自动发布、EdgeOne 自动部署、PR 必跑完整 Playwright、外部 runtime dependency，先让用户决策。

## Git 状态

未提交，未推送。当前工作区历史脏项很多；如需提交，必须按 Git 提交制度只 stage 本阶段相关文件。
