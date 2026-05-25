# v4.0.0 总览

状态：startup pending user decision。
日期：2026-05-25。
分支：`codex/v400-startup-high-world-prep`。
主线建议：`高阶战斗 theater 与 HeavenWill/Fate 宏观压力双预备`。

## 定位

`v4.0.0` 承接 `v3.9.0` 的 v4.0 前安全收束。专家团建议 v4.0 不直接开放完整蛊仙、高阶战斗 runtime、天道/宿命裁决或 L4/L5 原著关键人物 agent，而是先把两条高风险长期路线拆成可审计的架构预备：

1. 高阶战斗表达与结算架构预备：theater map、杀招栈、领域/阵法/地形压力、仙蛊屋状态、环境破坏证据链。
2. HeavenWill / Fate / L5 宏观压力预备：Fate state、HeavenWill pressure、era anchor graph、causality debt、L5 macro director。

本启动包只开专家团会和前置授权包，不改 runtime、save、prompt、UI、后端、外部依赖或 MiroFish。

## 硬边界

- 不新增 save field，不 bump `SAVE_FORMAT_VERSION = 25`。
- 不新增 `runFingerprint`。
- 不调用 live DeepSeek，不改 DeepSeek prompt/context/model/authority。
- 不做 DeepSeek visible lore/RAG。
- 不做 MiroFish export/intake；当前建议 need level 为 `not_needed`，触发真实原著/hidden/L4/L5 时升级 blocking。
- 不引入 backend/BFF/service/job queue/eval archive service/cloud save。
- 不引入外部 agent framework PoC、dependency、vendored subset、read-only scan、patch artifact、subagents。
- 不开放 persistent agent state、agent memory store 或 self-learning 写入。
- 不开放 L4/L5 runtime、方源等原著关键人物 agent、HeavenWill/Fate runtime 裁决。
- 不实现高阶战斗 runtime、theater UI、杀招栈数值、仙蛊屋状态写入或环境破坏结算。
- 不新增正式地点、阵营、身份、奖励、NPC 生死、通缉、招揽、封锁。
- 不新增 knowledge-index body、runtime canon、hidden/private body、prompt body archival。
- 不改公开发布、法律边界，不部署 EdgeOne，不自动合并 `main`。

## 入口文件

| 文件 | 用途 |
|---|---|
| `v4.0.0-专家团启动会纪要.md` | 专家团意见、路线选择、收益风险 |
| `v4.0.0-启动审查与范围冻结.md` | 进入条件、范围、非目标 |
| `v4.0.0-总体开发大纲.md` | v4.0 总体目标和阶段产物 |
| `v4.0.0-小版本执行路线图.md` | a0/a1/a2/b1/b2/b3/rc 路线建议 |
| `v4.0.0-前置授权包.md` | 待用户审批的 D-400/F-400 |
| `v4.0.0-例外停机清单.md` | `/goal` 自动推进必须停止的条件 |
| `v4.0.0-需求决策池.md` | 决策项状态表 |
| `v4.0.0-a1-高阶战斗theater与杀招栈设计门禁草案.md` | 高阶战斗预备设计门禁草案 |
| `v4.0.0-a2-HeavenWill-Fate-L5宏观压力设计门禁草案.md` | 天道/宿命/L5 宏观压力设计门禁草案 |
| `v4.0.0-测试矩阵.md` | 启动文档自检与后续实现测试计划 |
| `v4.0.0-MiroFish资料需求与交付协议.md` | MiroFish need level 与 blocking 条件 |
| `v4.0.0-真相源索引.md` | 当前真相源和禁止来源 |
| `v4.0.0-Git提交与推送计划.md` | 分支、提交、推送、主线合并边界 |
| `v4.0.0-startup-Skill同步审计记录.md` | startup skill sync audit |

## 当前建议

请用户审批 `D-400-001` 至 `D-400-012`，并确认 `F-400-001` 至 `F-400-012` 全部继续 `future_gate_required`。审批后，Codex 可在该授权包内完成 v4.0；触发例外停机清单时必须立即停止并报告用户。
