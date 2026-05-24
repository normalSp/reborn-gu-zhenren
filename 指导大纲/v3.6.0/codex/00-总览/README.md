# v3.6.0 总览

日期：2026-05-25
状态：startup；pending user approval
主线：`transient AgentProposal synthetic L2/L3 微扩 + 同开局差异/漂移硬化`

## 定位

v3.6 承接 v3.4/v3.5 的最小 `transient proposal-only` runtime 窄口。v3.4 证明 AgentProposal 可以进入玩家可见候选表达；v3.5 把该窄口硬化为 lifecycle v2。

v3.6 不扩大成 persistent runtime agent。本版本建议只做 synthetic / RebornG-owned generic L2/L3 候选微扩，并把同开局差异、rejection/future gate、old-save/no-save/rollback 和 drift 证据压实。

## 本版本不默认授权

- 不新增 save field，不 bump `SAVE_FORMAT_VERSION`，不新增 `runFingerprint`。
- 不新增 persistent agent memory / agent state / store slice。
- 不调用 live DeepSeek，不改 prompt/context/model/authority，不新增 DeepSeek visible lore/RAG。
- 不做 MiroFish export/intake，不吸收真实原著事实、命名 NPC、hidden-adjacent、方源公开证据或正式 lore 结论。
- 不做 backend/BFF/service/job queue/eval archive/cloud save。
- 不引入 external framework PoC/dependency/read-only scan/subagent/patch artifact。
- 不开放 L4/L5 runtime、天道/宿命 runtime 裁决、原著关键人物 runtime agent。
- 不开放正式地点、阵营、身份、奖励、NPC 生死、通缉、招揽、封锁。
- 不做 public wording、release、EdgeOne 或法律/版权边界变化。

## 专家团推荐

推荐路线：`微扩硬化`。

含义：在 v3.5 的 lifecycle v2 基础上，增加多个 synthetic / generic L2/L3 lane，让玩家能看到更多“候选差异”，同时继续强调候选不是事实、WorldCore 保持最终裁决权。

本版本建议测试档位：

- 30 轮 Player Advocate。
- 90 轮 deterministic same-start variation。
- focused v350/v360 unit/e2e。
- full verification 仅在用户批准 D-360 后进入 runtime 开发阶段执行。

## 入口文件

| 文件 | 用途 |
|---|---|
| `v3.6.0-专家团启动会纪要.md` | v3.6 路线收益风险与专家意见 |
| `v3.6.0-启动审查与范围冻结.md` | v3.5 复盘与 v3.6 范围冻结 |
| `v3.6.0-总体开发大纲.md` | v3.6 阶段设计 |
| `v3.6.0-小版本执行路线图.md` | a0/a1/a2/b1/b2/b3/rc 拆分 |
| `v3.6.0-前置授权包.md` | D-360 / F-360 审批包 |
| `v3.6.0-例外停机清单.md` | `/goal` 自动推进硬停条件 |
| `v3.6.0-需求决策池.md` | D/F 决策状态入口 |
| `v3.6.0-测试矩阵.md` | startup / future implementation 测试计划 |
| `v3.6.0-真相源索引.md` | v3.6 证据优先级 |
| `v3.6.0-MiroFish资料需求与交付协议.md` | MiroFish need level 与升级触发器 |
| `v3.6.0-Git提交与推送计划.md` | 分支、提交、推送与 CI 计划 |
| `v3.6.0-startup-Skill同步审计记录.md` | startup skill sync audit |

## 当前结论

v3.6 已具备启动条件，但尚未获得 D-360 批准。下一步应请用户审批 D-360-001 至 D-360-012，并确认 F-360-001 至 F-360-012 全部保持 `future_gate_required`。
