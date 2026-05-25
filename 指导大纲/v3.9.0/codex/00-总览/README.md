# v3.9.0 总览

状态：startup，pending user decision；startup commit `bea185ff` / GitHub Actions `26397569012` passed。
日期：2026-05-25。
分支：`codex/v390-startup-v4-safety-closure`。
主线建议：`v4.0 前安全收束：agent / DeepSeek / MiroFish / save-format / Player Advocate / 高阶世界准入统一复核`。

## 定位

`v3.9.0` 承接 `v3.4` 至 `v3.8` 的 transient AgentProposal 路线，是进入 `v4.0 高阶战斗 + 天道/宿命双预备` 前的安全收束版本。

专家团建议 v3.9 不继续堆新 agent 能力，而是回答一个更硬的问题：当前 transient proposal-only runtime、WorldCore final authority、Player Advocate、deterministic drift、old-save/no-save/rollback、MiroFish boundary、external-framework boundary 和 Git/mainline 制度，是否足以支撑 v4.0 进入高阶世界预备设计。

本启动包只开会、建路线和前置授权包；在用户批准 `D-390` 之前不进入实现。启动会文档提交 `bea185ff` 已推送，GitHub Actions `26397569012` 通过。

## 硬边界

- 不新增 save field，不 bump `SAVE_FORMAT_VERSION = 25`。
- 不新增 `runFingerprint`。
- 不接入 live DeepSeek，不改 DeepSeek prompt/context/model/authority。
- 不做 DeepSeek visible lore/RAG。
- 不做 MiroFish export/intake；当前建议 need level 为 `not_needed`，触发真实原著/hidden/L4/L5 时升级 blocking。
- 不引入 backend/BFF/service/job queue/eval archive service/cloud save。
- 不引入外部 agent framework PoC、dependency、vendored subset、read-only scan、patch artifact、subagents。
- 不开放 persistent agent state、agent memory store 或 self-learning 写入。
- 不开放 L4/L5 runtime、天道/宿命 runtime 裁决、原著关键人物 agent。
- 不新增正式地点、阵营、身份、奖励、NPC 生死、通缉、招揽、封锁。
- 不新增 knowledge-index body、runtime canon、hidden/private body、prompt body archival。
- 不改公开发布、法律边界，不部署 EdgeOne，不自动合并 `main`。

## 入口文件

| 文件 | 用途 |
|---|---|
| `v3.9.0-专家团启动会纪要.md` | 专家团意见、路线选择、收益风险 |
| `v3.9.0-启动审查与范围冻结.md` | 进入条件、范围、非目标 |
| `v3.9.0-总体开发大纲.md` | v3.9 总体目标和阶段产物 |
| `v3.9.0-小版本执行路线图.md` | a0/a1/a2/b1/b2/b3/rc 路线 |
| `v3.9.0-前置授权包.md` | 等待用户审批的 D-390/F-390 |
| `v3.9.0-例外停机清单.md` | `/goal` 自动推进必须停止的条件 |
| `v3.9.0-需求决策池.md` | 决策项状态表 |
| `v3.9.0-测试矩阵.md` | 启动文档自检与后续实现测试计划 |
| `v3.9.0-v4.0准入框架草案.md` | v4.0 高阶战斗与天道/宿命准入框架 |
| `v3.9.0-分层Agent与WorldCore测试体系收束审计.md` | v3.x 测试体系是否按路线演进 |
| `v3.9.0-MiroFish资料需求与交付协议.md` | MiroFish need level 与 blocking 条件 |
| `v3.9.0-真相源索引.md` | 当前真相源和禁止来源 |
| `v3.9.0-Git提交与推送计划.md` | 分支、提交、推送、主线合并边界 |
| `v3.9.0-startup-Skill同步审计记录.md` | startup skill sync audit |

## 当前建议

建议用户审批 `D-390-001` 至 `D-390-012`，并确认 `F-390-001` 至 `F-390-012` 继续 `future_gate_required`。审批后，v3.9 可在不触发例外停机的前提下进入完整开发与收束。
