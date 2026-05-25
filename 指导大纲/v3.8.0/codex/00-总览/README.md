# v3.8.0 总览

状态：startup proposed，等待用户审批 `D-380-001` 至 `D-380-012`。
日期：2026-05-25。
分支：`codex/v380-startup-proposal-graph-stability`。
主线：`transient proposal graph 长期稳定性与多小势力压力复核`。

## 定位

`v3.8.0` 承接 `v3.7.0` 的 transient multi-NPC / small-faction AgentProposal proposal graph。专家团建议不要立刻扩大为完整 runtime agent 社会，而是先验证 proposal graph 在更长轮次、更多 generic 小势力压力源、同开局差异和长期漂移场景下是否仍然可控。

本启动包只建立 v3.8 的专家团意见、前置授权包、例外停机清单、测试矩阵和入口同步。它不等于用户已经批准开发实现。

## 硬边界

- 不新增 save field，不 bump `SAVE_FORMAT_VERSION = 25`。
- 不新增 `runFingerprint`。
- 不接入 live DeepSeek，不改 DeepSeek prompt/context/model/authority。
- 不做 DeepSeek visible lore/RAG。
- 不做 MiroFish export/intake；当前 need level 为 `not_needed`。
- 不引入 backend/BFF/service/job queue/eval archive service/cloud save。
- 不引入外部 agent framework PoC、dependency、vendored subset、read-only scan、patch artifact、subagents。
- 不开放 L4/L5 runtime、天道/宿命 runtime 裁决、原著关键人物 agent。
- 不新增正式地点、阵营、身份、奖励、NPC 生死、通缉、招揽、封锁。
- 不新增 knowledge-index body、runtime canon、hidden/private body、prompt body archival。
- 不改公开发布、法律边界，不部署 EdgeOne。

## 入口文件

| 文件 | 用途 |
|---|---|
| `v3.8.0-专家团启动会纪要.md` | 专家团意见、路线选择、收益风险 |
| `v3.8.0-启动审查与范围冻结.md` | 进入条件、范围、非目标 |
| `v3.8.0-总体开发大纲.md` | v3.8 总体目标和阶段产物 |
| `v3.8.0-小版本执行路线图.md` | a0/a1/a2/b1/b2/b3/rc 路线 |
| `v3.8.0-前置授权包.md` | 等待用户审批的 D-380/F-380 |
| `v3.8.0-例外停机清单.md` | `/goal` 自动推进必须停止的条件 |
| `v3.8.0-需求决策池.md` | 决策项状态表 |
| `v3.8.0-测试矩阵.md` | 启动文档自检与后续实现测试计划 |
| `v3.8.0-分层Agent与WorldCore测试体系进化审计.md` | v3.8 测试制度化/工程化审计 |
| `v3.8.0-MiroFish资料需求与交付协议.md` | MiroFish need level 与 blocking 条件 |
| `v3.8.0-真相源索引.md` | 当前真相源和禁止来源 |
| `v3.8.0-Git提交与推送计划.md` | 分支、提交、推送、主线合并边界 |
| `v3.8.0-startup-Skill同步审计记录.md` | skill sync audit |

## 当前建议

建议用户审批 `D-380-001` 至 `D-380-012` 后进入 v3.8 开发；`F-380-001` 至 `F-380-012` 全部保持 `future_gate_required`。
