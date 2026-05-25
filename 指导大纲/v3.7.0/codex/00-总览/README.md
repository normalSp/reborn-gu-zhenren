# v3.7.0 总览

日期：2026-05-25
状态：full local verification passed；commit/push/CI evidence pending
主线：`transient multi-NPC / small-faction AgentProposal 复核`

## 定位

v3.7 承接 v3.4-v3.6 的最小 transient AgentProposal 路线：v3.4 打开最小 proposal-only `意图` tab，v3.5 做 lifecycle / copy hardening，v3.6 做 synthetic L2/L3 多 lane 微扩。

v3.7 的目标不是开放完整 NPC 社会，而是验证多个 synthetic/generic NPC 与一个小势力压力源在同一公开事件下能否形成可解释、可拒绝、可回滚、可测试的候选网络。

## 硬边界

- 不新增 save field，不 bump `SAVE_FORMAT_VERSION = 25`，不新增 migration。
- 不新增 `runFingerprint`。
- 不写 persistent agent state、agent memory、formal relation、faction standing。
- 不调用 live DeepSeek，不改 prompt/context/model/authority。
- 不做 DeepSeek visible lore/RAG。
- 不请求或吸收 MiroFish 包；need level 默认为 `not_needed`。
- 不接真实命名 NPC、真实势力、hidden-adjacent、方源公开证据、L4/L5 原著锚点或正式 lore 结论。
- 不做 backend/BFF/service/job queue/eval archive/cloud save。
- 不引入外部 framework PoC/dependency/read-only scan/subagent/patch artifact。
- 不开放正式地点、阵营、身份、奖励、NPC 生死、通缉、招揽、封锁。
- 不改变 public wording、legal/copyright 或 EdgeOne 部署。

## 启动文档入口

| 文档 | 用途 |
|---|---|
| `v3.7.0-专家团启动会纪要.md` | 专家团结论与路线选择 |
| `v3.7.0-启动审查与范围冻结.md` | v3.7 scope / non-goal / entry condition |
| `v3.7.0-总体开发大纲.md` | v3.7 phase structure |
| `v3.7.0-小版本执行路线图.md` | a0/a1/a2/b1/b2/b3/rc 路线 |
| `v3.7.0-前置授权包.md` | D-370/F-370 前置授权 |
| `v3.7.0-例外停机清单.md` | `/goal` 自动推进硬停条件 |
| `v3.7.0-需求决策池.md` | D/F 决策状态入口 |
| `v3.7.0-测试矩阵.md` | v3.7 test matrix |
| `v3.7.0-分层Agent与WorldCore测试体系审计.md` | 分层 Agent / WorldCore 测试制度化审计 |
| `v3.7.0-MiroFish资料需求与交付协议.md` | MiroFish need level 与升级条件 |
| `v3.7.0-真相源索引.md` | 当前 truth source 与禁止来源 |
| `v3.7.0-a0-v3.6复盘与multi-NPC范围冻结.md` | v3.6 复盘与 v3.7 范围冻结 |
| `v3.7.0-a1-proposal-graph-scenario-model设计门禁.md` | proposal graph scenario model |
| `v3.7.0-a2-rumor-fact-pressure-copy-gate.md` | rumor/fact 与 pressure handoff 文案门禁 |
| `v3.7.0-b1-transient-proposal-graph第一刀.md` | v370 engine/UI 第一刀记录 |
| `v3.7.0-b2-120轮deterministic-drift记录.md` | 120 轮 deterministic 记录 |
| `v3.7.0-b3-Player-Advocate-40轮走查记录.md` | 40 轮 Player Advocate |
| `v3.7.0-b3-old-save-no-save-rollback证据.md` | old-save/no-save/rollback 证据 |
| `v3.7.0-process-1-前置审批制度第十三轮复核.md` | 前置审批制度复核 |
| `v3.7.0-process-2-长线漂移与知识边界复核.md` | 长线漂移与知识边界复核 |
| `v3.7.0-startup-Skill同步审计记录.md` | startup / process skill sync audit |
| `v3.7.0-Git提交与推送计划.md` | branch / commit / push / CI |
| `v3.7.0-rc-质量收束记录.md` | rc 质量收束 |

## 当前进度

用户已批准 D-370-001 至 D-370-012，并确认 F-370-001 至 F-370-012 全部继续 `future_gate_required`。本地已完成 v370 proposal graph engine、UI、unit/e2e、120 轮 deterministic、40 轮 Player Advocate、制度文档与 full local verification；仍需完成 Git commit/push、CI 与最终 evidence 回填后才能宣布 v3.7 远端闭环完成。
