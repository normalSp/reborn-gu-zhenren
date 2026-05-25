# v3.7.0 总览

日期：2026-05-25
状态：startup proposed；pending user approval
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
| `v3.7.0-startup-Skill同步审计记录.md` | startup skill sync audit |
| `v3.7.0-Git提交与推送计划.md` | branch / commit / push / CI |

## 当前建议

建议用户批准 D-370-001 至 D-370-012，并确认 F-370-001 至 F-370-012 全部继续 `future_gate_required`。批准后，Codex 可在 `/goal` 内完成 v3.7；若触发例外停机清单，必须停止并询问用户。
