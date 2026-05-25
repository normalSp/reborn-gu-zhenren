# 2026-05-25 v3.7 mainline branch policy context

## 当前状态

- 分支：`codex/v370-startup-multi-npc-small-faction`
- 当前入口：`指导大纲/v3.7.0/codex/00-总览/README.md`
- 当前阶段：v3.7 startup approved；D-370 approved；F-370 future_gate_required；等待后续 `/goal` implementation
- 本轮性质：docs/process-only Git 制度补丁，不改 runtime/source/UI/store/prompt/save

## 本轮完成

- 在 `指导大纲/流程制度/Git分支切换与推送制度.md` 加入 `主线合并与版本分支制度补丁`。
- 明确 `main` 是稳定主线，`codex/vXYZ-*` 是版本/专项工作分支。
- 明确暂不默认新增 `develop` / `integration`。
- 明确版本/专项完成时必须记录是否建议合并回 `main`，若不合并需写原因。
- 明确禁止未获批准时自动合并、改 branch protection、force push、history rewrite、EdgeOne 部署或把 `main` 当实验分支。
- 同步 `指导大纲/流程制度/README.md`、`指导大纲/项目仪表盘.md`、`AGENTS.md`、`PROJECT-STATE.md`、v3.7 路线图、测试矩阵、Git 计划和 skill sync audit。
- 同步本机 skills：`reborn-expert-council`、`game-dev-text`；`reverend-insanity-lore`、`reborn-combat-motion`、`mirofish-reborng-export` 为 `no_update_needed`。

## 当前边界

- 不自动合并 `main`。
- 不创建 `develop`。
- 不修改 branch protection。
- 不做 EdgeOne 部署。
- 不进入 v3.7 runtime implementation。
- 不改变 D-370/F-370 授权状态。

## 下一步

- 如果用户要求完成 v3.7，可在 D-370 envelope 内进入 `/goal` implementation。
- v3.7 rc/质量收束时，必须按新制度写明是否建议合并回 `main`。
- 若未来需要真正合并 `main`，先给出合并风险、基线、测试和 CI 证据，并等待用户批准或 PR 审核。
