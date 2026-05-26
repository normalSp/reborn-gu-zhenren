# 2026-05-26 v4.2 startup context

分支：`codex/v420-startup-auto-theater-lite-mortal-mapping`

## 当前目标

已完成 `v4.2.0` 专家团启动会与进入前准备。主线建议为：

`Auto-Theater Lite / 凡阶战斗映射设计门禁`

## 用户审批状态

- `D-420-001` 至 `D-420-012`：pending user decision。
- `F-420-001` 至 `F-420-012`：建议全部继续 `future_gate_required`。

## 已完成

- 新建 `指导大纲/v4.2.0/codex/00-总览/`。
- 写入 v4.2 启动会、范围冻结、总体大纲、路线图、授权包、例外停机清单、需求池、测试矩阵、MiroFish need-level、真相源索引、Git 计划、Skill 同步审计和 a1 设计门禁草案。
- 同步 `指导大纲/项目仪表盘.md`、`AGENTS.md`、`.codex/skills/reborn-expert-council/references/PROJECT-STATE.md`。
- 同步外部 skills：`reborn-expert-council`、`game-dev-text`、`reverend-insanity-lore`、`reborn-combat-motion`。

## 核心结论

v4.2 应先做 report-only / design-gate / checker-ready 的凡阶映射。现有棋盘 / 行动卡仍是 active runtime，不在 v4.2 startup 中迁移或替换。

Auto-Theater Lite 的定位是：

- 把现有凡阶 action 映射到 preparation / transcript / Combat Ledger Lite。
- 强化玩家对准备、支援、防御、失败原因、候选/事实边界的理解。
- 为未来凡阶 runtime 迁移提供合同、样本和验收标准。

## MiroFish / DeepSeek

- MiroFish need level：`not_needed`。
- live DeepSeek：否。
- 若触及真实原著战斗、命名 NPC、真实势力、hidden-adjacent、方源证据、L4/L5 原著锚点、HeavenWill/Fate 真实锚点或正式 lore conclusion，必须升级 MiroFish 为 `blocking` 并停机。

## 仍未授权

v4.2 startup 不授权凡阶战斗 runtime 迁移、Auto-Theater Lite runtime、纯自走棋 runtime、高阶战斗 runtime、theater UI、Auto-Theater 素材生成、save field、`SAVE_FORMAT_VERSION` bump、`runFingerprint`、live DeepSeek、DeepSeek prompt/context/model/authority 扩大、DeepSeek visible lore/RAG、MiroFish export/intake、backend/BFF/service、external framework PoC/dependency/subagents/read-only scan/patch artifact、persistent agent state、L4/L5 runtime、HeavenWill/Fate runtime 裁决、原著关键人物 agent、正式地点/阵营/身份/奖励/NPC 生死/通缉/招揽/封锁、knowledge-index body、runtime canon、public/legal/EdgeOne、main auto-merge。

## 下一步

请用户审批：

- `D-420-001` 至 `D-420-012` 是否批准。
- `F-420-001` 至 `F-420-012` 是否继续 `future_gate_required`。

若用户批准，v4.2 可以进入 `/goal` 自动完成；若触发 `v4.2.0-例外停机清单.md`，必须立即停止并回到用户决策。
