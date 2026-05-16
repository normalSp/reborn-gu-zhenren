# 2026-05-17 Player Advocate 走查制度交接

## 状态

Player Advocate 走查制度已升级为项目级流程，并在 v0.13.0 上追补完成一次 rc 级 50 轮走查。

## 本轮完成

- 新增 `指导大纲/流程制度/README.md`。
- 新增 `指导大纲/流程制度/Player-Advocate走查制度.md`。
- 新增 `指导大纲/流程制度/Player-Advocate走查记录模板.md`。
- 新增 `scripts/check-player-advocate-gate.mjs`。
- 新增 npm 命令：`npm run check:player-advocate-gate -- <record.md> <10|50>`。
- 更新 `AGENTS.md`、`PROJECT-STATE.md`、`v0.11.0-测试工程化总纲.md`、`v0.11.0-后续专项池.md`。
- 更新本机 `reborn-expert-council` skill 到 `0.1.60`，加入 Player Advocate Playtest Gate。

## 本轮追加

- 新增 `指导大纲/v0.13.0/codex/00-总览/v0.13.0-rc-Player-Advocate-50轮走查记录.md`。
- 追补 v0.13.0 rc 级玩家视角走查：50 轮，下一步可理解率 94%，严重困惑 3 轮，P0/P1 玩家体验阻断 0。
- 更新 `scripts/check-player-advocate-gate.mjs`：从“只数轮数”升级为有效记录校验，检查必填 section、模板占位、每轮必填列、yes/no 理解、下一步可理解率和严重困惑轮次。
- 更新 `指导大纲/流程制度/Player-Advocate走查制度.md` 和模板，新增覆盖分布和脚本校验说明。
- 更新 `AGENTS.md`、`PROJECT-STATE.md`、`v0.13.0-项目仪表盘.md`、`v0.13.0-rc-质量收束记录.md`。
- 更新本机 `reborn-expert-council` skill 到 `0.1.61`，补充严格 Player Advocate gate 口径。

## 制度口径

- 从 `v0.14.0` 起默认生效。
- 玩家可见 / runtime 小版本完成前走查 10 轮。
- 大版本 rc 前走查 50 轮。
- 纯文档、纯 CI、纯 Git、纯内部脚本可豁免，但必须写明豁免原因。
- 走查结果进入 bug、测试、`.learnings/ERRORS.md`、需求池或用户决策门，不直接覆盖本地 canon/engine 权限。
- 走查记录不能只填空表：脚本会拒绝占位符、空行、非 yes/no 理解项，以及低于阈值的下一步可理解率。

## 当前模型口径

当前剧情文本生成默认模型是 `deepseek-v4-flash`，不是 Pro。真相源包括：

- `src/api/deepseek.ts`
- `src/api/deepseek.test.ts`
- `AGENTS.md`
- `.codex/skills/reborn-expert-council/references/PROJECT-STATE.md`

用户此前已决定不再主动评估其他模型；除非用户撤销，不应主动提出 Pro / Reasoner / 其他模型切换。

## 验证

- `npm run test:e2e -- tests/e2e/v013-social-impact-panel.spec.ts tests/e2e/v011-free-goal-panel.spec.ts`：6 个 Playwright 测试通过。
- `node --check scripts/check-player-advocate-gate.mjs`：通过。
- `npm run check:player-advocate-gate -- "指导大纲/v0.13.0/codex/00-总览/v0.13.0-rc-Player-Advocate-50轮走查记录.md" 50`：通过。
- Git 提交 `17e99d6 docs: 补强玩家视角走查门禁` 已推送到 `origin/codex/v013-npc-faction-reaction`。
- GitHub Actions run `25969597344`：通过确定性质量门。

## 后续

下一步进入 `v0.14.0` 启动审查时，应先让用户选择主线方向，再在对应版本文档中建立第一份 Player Advocate 10 轮走查记录。

v0.13 追补走查进入后续需求池的内容：

- P2：社会后续候选到正式前置行动桥。
- P2：阵营目标前置条件展示，仍不开放 faction_transfer。
- P3：移动端社会影响摘要优先级。
