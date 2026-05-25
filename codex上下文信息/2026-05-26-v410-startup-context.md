# 2026-05-26 v4.1 startup context

分支：`codex/v410-startup-auto-theater-contract-hardening`

## 当前目标

开启 `v4.1.0` 专家团启动会。主线建议为 `Auto-Theater Contract / Schema / Checker 加固`。

## 已完成

- 从 v4.0 completion commit `62faa347` 派生 v4.1 分支。
- 新建 `指导大纲/v4.1.0/codex/00-总览/` 启动包。
- 起草专家团启动会、启动审查、总体开发大纲、小版本路线图、D-410/F-410 前置授权包、例外停机清单、需求池、测试矩阵、MiroFish need-level、真相源索引、Git 计划和 startup Skill 同步审计。
- 同步 `指导大纲/项目仪表盘.md`、`AGENTS.md`、`.codex/skills/reborn-expert-council/references/PROJECT-STATE.md`。
- 外部 skill current override 已同步到 v4.1 startup：`reborn-expert-council`、`game-dev-text`、`reverend-insanity-lore`、`reborn-combat-motion`。

## 待用户决策

建议用户审批：

- `D-410-001` 至 `D-410-012` 全部批准。
- `F-410-001` 至 `F-410-012` 全部继续 `future_gate_required`。

若获批，v4.1 可以一个 `/goal` 完成；若触发例外停机清单，立即停止自动推进。

## 当前硬边界

v4.1 startup 不授权 runtime/source/UI/store/prompt/save 改动，不授权 theater UI、高阶战斗 runtime、凡阶战斗迁移、Auto-Theater 素材生成、live DeepSeek、MiroFish export/intake、backend/BFF、外部框架 PoC/依赖/子代理、save field、`SAVE_FORMAT_VERSION` bump、`runFingerprint`、L4/L5 或 HeavenWill/Fate runtime、正式地点/阵营/身份/奖励/NPC 生死、public/legal/EdgeOne/main auto-merge。
