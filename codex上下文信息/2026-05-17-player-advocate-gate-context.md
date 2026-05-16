# 2026-05-17 Player Advocate 走查制度交接

## 状态

Player Advocate 走查制度已升级为项目级流程。

## 本轮完成

- 新增 `指导大纲/流程制度/README.md`。
- 新增 `指导大纲/流程制度/Player-Advocate走查制度.md`。
- 新增 `指导大纲/流程制度/Player-Advocate走查记录模板.md`。
- 新增 `scripts/check-player-advocate-gate.mjs`。
- 新增 npm 命令：`npm run check:player-advocate-gate -- <record.md> <10|50>`。
- 更新 `AGENTS.md`、`PROJECT-STATE.md`、`v0.11.0-测试工程化总纲.md`、`v0.11.0-后续专项池.md`。
- 更新本机 `reborn-expert-council` skill 到 `0.1.60`，加入 Player Advocate Playtest Gate。

## 制度口径

- 从 `v0.14.0` 起默认生效。
- 玩家可见 / runtime 小版本完成前走查 10 轮。
- 大版本 rc 前走查 50 轮。
- 纯文档、纯 CI、纯 Git、纯内部脚本可豁免，但必须写明豁免原因。
- 走查结果进入 bug、测试、`.learnings/ERRORS.md`、需求池或用户决策门，不直接覆盖本地 canon/engine 权限。

## 当前模型口径

当前剧情文本生成默认模型是 `deepseek-v4-flash`，不是 Pro。真相源包括：

- `src/api/deepseek.ts`
- `src/api/deepseek.test.ts`
- `AGENTS.md`
- `.codex/skills/reborn-expert-council/references/PROJECT-STATE.md`

用户此前已决定不再主动评估其他模型；除非用户撤销，不应主动提出 Pro / Reasoner / 其他模型切换。

## 验证

- `node scripts/check-player-advocate-gate.mjs --help`：通过。
- `npm run check:player-advocate-gate -- 指导大纲/流程制度/Player-Advocate走查记录模板.md 10`：通过。
- `git diff --check`：通过，仅有 LF/CRLF 提示。

## 后续

下一步进入 `v0.14.0` 启动审查时，应先让用户选择主线方向，再在对应版本文档中建立第一份 Player Advocate 10 轮走查记录。
