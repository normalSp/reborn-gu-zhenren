# v3.8.0 总览

状态：completed，commit `196b46b4` / GitHub Actions `26395818611` passed。
日期：2026-05-25。
分支：`codex/v380-startup-proposal-graph-stability`。
主线：`transient proposal graph 长期稳定性与多小势力压力复核`。

## 定位

`v3.8.0` 承接 `v3.7.0` 的 transient multi-NPC / small-faction AgentProposal proposal graph。专家团建议不要立刻扩大为完整 runtime agent 社会，而是先验证 proposal graph 在更长轮次、更多 generic 小势力压力源、同开局差异和长期漂移场景下是否仍然可控。

v3.8 已在 D-380 授权范围内完成本地开发与验证。它不开放任何 F-380 future gate。

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
| `v3.8.0-D380授权确认记录.md` | 用户授权落盘 |
| `v3.8.0-a0-v3.7复盘与proposal-graph-stability范围冻结.md` | a0 范围冻结 |
| `v3.8.0-a1-proposal-graph-stability-model设计门禁.md` | a1 模型门禁 |
| `v3.8.0-a2-multi-pressure-same-start-copy-gate.md` | a2 文案门禁 |
| `v3.8.0-b1-transient-proposal-graph-stability实现记录.md` | b1 实现记录 |
| `v3.8.0-b2-150轮deterministic-stability记录.md` | b2 deterministic 记录 |
| `v3.8.0-b3-old-save-no-save-rollback证据.md` | b3 存档安全证据 |
| `v3.8.0-b3-Player-Advocate-50轮记录.md` | b3 PA 记录 |
| `v3.8.0-process-1-前置审批制度第十四轮复核.md` | 前置审批制度复核 |
| `v3.8.0-process-2-长线漂移与知识边界复核.md` | 长线漂移与知识边界复核 |
| `v3.8.0-rc-Skill同步审计记录.md` | rc skill audit |
| `v3.8.0-rc-质量收束记录.md` | rc 质量收束 |
| `v3.8.0-例外停机清单.md` | `/goal` 自动推进必须停止的条件 |
| `v3.8.0-需求决策池.md` | 决策项状态表 |
| `v3.8.0-测试矩阵.md` | 启动文档自检与后续实现测试计划 |
| `v3.8.0-分层Agent与WorldCore测试体系进化审计.md` | v3.8 测试制度化/工程化审计 |
| `v3.8.0-MiroFish资料需求与交付协议.md` | MiroFish need level 与 blocking 条件 |
| `v3.8.0-真相源索引.md` | 当前真相源和禁止来源 |
| `v3.8.0-Git提交与推送计划.md` | 分支、提交、推送、主线合并边界 |
| `v3.8.0-startup-Skill同步审计记录.md` | skill sync audit |

## 当前建议

v3.8 可作为 v3.9 启动输入。是否合并 `main` 仍需按主线合并制度另行确认。
