# 2026-05-21 Player Advocate live probe 制度补丁交接

状态：process governance patch。
分支：`codex/v170-player-advocate-live-probe-policy`。
基线：`codex/v170-startup-council`。

## 触发原因

用户要求：

- 以后每份 Player Advocate 记录都强制写清楚是否调用 live DeepSeek。
- 若调用，必须写明模型、样本、轮次、成本、报告路径。
- 用户不把 `deepseek-v4-flash` token 成本视为阻断，希望质量优先。

## 已落地

- 更新 `指导大纲/流程制度/Player-Advocate走查记录模板.md`，新增 live DeepSeek 元数据字段。
- 更新 `指导大纲/流程制度/Player-Advocate走查制度.md`，定义 live_narrative_probe 默认档位和执行方式。
- 更新 `指导大纲/流程制度/长线叙事漂移测试制度.md`，把 T1/T2/T3 与标准 `deepseek-v4-flash` live 档位对齐。
- 更新 `scripts/check-player-advocate-gate.mjs`，校验每份记录必须包含 `是否调用 live DeepSeek`；如果为“是”，必须包含模型、样本、轮次、成本、报告路径，且模型必须为 `deepseek-v4-flash`。
- 更新 v1.7 启动文档、项目仪表盘、AGENTS、PROJECT-STATE 的相关口径。
- 同步 `reborn-expert-council` 与 `game-dev-text` Current Sync Override。

## 新标准档位

| 场景 | live 标准 |
|---|---:|
| 纯文档 / CI / Git / report-only 工具 | 可豁免，必须写原因 |
| 玩家可见 runtime 小版本，不改 DeepSeek prompt/context | 8-12 轮 |
| DeepSeek / prompt / 叙事高风险小版本 | 20-40 轮 |
| 大版本 rc | 40-60 轮 |
| 高风险 rc | 80-120 轮 |
| v2.0 前区域活世界长测 | 300+ 总轮次，含 live/mixed 覆盖 |

标准模型：`deepseek-v4-flash`。

模型切换、DeepSeek 可见知识 / RAG、超标准档扩容仍需用户单独批准。

## 执行方式

三种形态：

- `api_sample_probe`：固定样本直接调用 DeepSeek API。现有 v1.1 D-025、v1.3-rc 属于这一类。
- `seeded_runtime_probe`：从 app 可复现状态或 Playwright harness 出发，真实走玩家回合，再调用 DeepSeek。当前尚未通用工具化。
- `mixed_probe`：长线 deterministic / replay 为骨架，抽关键 checkpoint 做 live。

下一步进入 v1.7-a1 时，应决定是否把 `seeded_runtime_probe` 工具化为 v1.7 的 process 小刀或 runtime 前置工具。

## 硬边界

本补丁不改 runtime、不 bump save、不改 DeepSeek prompt/context/model/authority、不导入 MiroFish、不部署 EdgeOne。
