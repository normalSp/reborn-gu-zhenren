# v3.5.0 总览

日期：2026-05-25
状态：completed；commit/push/CI passed
主线：`transient AgentProposal hardening-first`

## 定位

v3.5 承接 v3.4 的最小 `transient proposal-only` L2/L3 runtime first cut。v3.4 已证明：

- `AgentProposal -> WorldCore post-check -> 玩家可见候选表达` 可以进入 runtime。
- 不需要 save field、migration、`runFingerprint`、live DeepSeek、MiroFish、backend 或外部框架。
- 玩家能在 10 轮 Player Advocate 中理解“候选不是事实”。

v3.5 没有扩大成完整 runtime agent。本版本只把 v3.4 首刀硬化为 lifecycle v2：`candidate / rejected / expired / needs_user_decision`，并完成 20 轮 Player Advocate 与 60 轮 deterministic drift。

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

推荐路线 A：`hardening-first`。

含义：v3.5 继续使用 v3.4 的窄口，只做 transient AgentProposal 质量硬化、UI/文案复核、deterministic 多样性、rejection/rollback/old-save 证据和 Player Advocate 强化。

不推荐 v3.5 直接打开：

- persistent agent memory。
- live DeepSeek agent。
- 命名 NPC / 真实势力 / MiroFish blocking。
- 外部 framework PoC 或依赖。
- 后端/BFF。
- L4/L5、天道宿命、高阶战斗。

## 入口文件

| 文件 | 用途 |
|---|---|
| `v3.5.0-专家团启动会纪要.md` | v3.5 路线收益风险与专家意见 |
| `v3.5.0-D350决策记录.md` | 用户批准 D-350 / F-350 的记录 |
| `v3.5.0-启动审查与范围冻结.md` | v3.4 复盘与 v3.5 范围冻结 |
| `v3.5.0-总体开发大纲.md` | v3.5 阶段设计 |
| `v3.5.0-小版本执行路线图.md` | a0/a1/a2/b1/b2/b3/rc 拆分 |
| `v3.5.0-前置授权包.md` | D-350 / F-350 审批包 |
| `v3.5.0-例外停机清单.md` | `/goal` 自动推进硬停条件 |
| `v3.5.0-需求决策池.md` | D/F 决策状态入口 |
| `v3.5.0-测试矩阵.md` | doc/runtime-hardening 测试计划 |
| `v3.5.0-真相源索引.md` | v3.5 证据优先级 |
| `v3.5.0-MiroFish资料需求与交付协议.md` | MiroFish need level 与升级触发器 |
| `v3.5.0-Git提交与推送计划.md` | 分支、提交、推送与 CI 计划 |
| `v3.5.0-startup-Skill同步审计记录.md` | startup skill sync audit |
| `v3.5.0-a0-v3.4首刀复盘与hardening范围冻结.md` | a0 复盘 |
| `v3.5.0-a1-AgentProposal-lifecycle-v2设计门禁.md` | a1 lifecycle v2 |
| `v3.5.0-a2-candidate-vs-fact-rejection-copy门禁.md` | a2 UI/copy |
| `v3.5.0-b1-transient-AgentProposal-hardening-first-cut.md` | b1 第一刀 |
| `v3.5.0-b2-60轮deterministic-same-start-variation.md` | b2 deterministic variation |
| `v3.5.0-b3-Player-Advocate-20轮走查记录.md` | b3 PA |
| `v3.5.0-b3-60轮deterministic漂移检查记录.md` | b3 drift |
| `v3.5.0-process-1-前置审批制度第十一轮复核.md` | process-1 |
| `v3.5.0-process-2-长线漂移与知识边界复核.md` | process-2 |
| `v3.5.0-rc-Skill同步审计记录.md` | rc skill audit |
| `v3.5.0-rc-质量收束记录.md` | rc closure |

## 完成结论

v3.5 已完成并通过远端 CI：runtime `意图` tab 继续保持 transient proposal-only，但新增 lifecycle v2、copy guard、60 轮 deterministic gate 与 20 轮 PA 证据。完成 commit `e3b004dd` 已推送，GitHub Actions run `26368124209` passed。它仍不是 persistent runtime agent。
