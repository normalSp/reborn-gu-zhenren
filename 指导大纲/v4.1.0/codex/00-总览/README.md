# v4.1.0 总览

状态：completed locally；`D-410-001` 至 `D-410-012` 已获用户批准并执行，`F-410-001` 至 `F-410-012` 继续 `future_gate_required`。
日期：2026-05-26。
分支：`codex/v410-startup-auto-theater-contract-hardening`。
主线建议：`Auto-Theater Contract / Schema / Checker 加固`。

## 定位

`v4.1.0` 承接 `v4.0.0` 的 Auto-Theater Combat 与 HeavenWill/Fate Pressure 设计门禁。v4.0 已证明高阶世界方向可以被拆成 report-only、synthetic/generic、WorldCore final authority 的门禁；v4.1 不应该直接实现 theater UI 或高阶 runtime，而应先把 v4.0 的概念整理成可执行、可校验、可复用的工程合同。

v4.1 的核心任务是冻结 `AutoTheaterContractV1`：

- `PreparationEnvelopeV1`：准备阶段输入、资源、撤退阈值、候选意图。
- `TheaterLayerV1`：air / ground / underground / water / aperture / formation / domain / house / environment 等战场态势层。
- `KillerMoveStackFrameV1`：杀招准备、打断、反制、连锁、反噬、消耗与证据。
- `CombatLedgerEntryV1`：事实、候选、拒绝、需要用户决策、压力、证据链。
- `ExpressionAuthorityV1`：UI / DeepSeek / 动效 / report 只能表达什么，不能裁决什么。
- `WorldCoreEvidenceChainV1`：所有事实结论必须能追溯到 WorldCore / Combat Core / canon gate。

本版本仍是 design-gate / report-only / checker-first，不改 runtime、save、prompt、UI、后端、外部依赖、MiroFish 或素材。

## 硬边界

- 不新增 save field，不 bump `SAVE_FORMAT_VERSION = 25`。
- 不新增 `runFingerprint`。
- 不调用 live DeepSeek，不改 DeepSeek prompt/context/model/authority。
- 不做 DeepSeek visible lore/RAG。
- 不做 MiroFish export/intake；当前 need level 为 `not_needed`。
- 不引入 backend/BFF/service/job queue/eval archive service/cloud save。
- 不引入外部 agent/combat framework PoC、dependency、vendored subset、read-only scan、patch artifact、subagents。
- 不开放 persistent agent state、agent memory store 或 self-learning 写入。
- 不开放 L4/L5 runtime、方源等原著关键人物 agent、HeavenWill/Fate runtime 裁决。
- 不实现高阶战斗 runtime、凡阶战斗 runtime 迁移、纯自走棋 runtime、theater UI、杀招栈数值、仙蛊屋状态写入、环境破坏结算或素材生成。
- 不新增正式地点、阵营、身份、奖励、NPC 生死、通缉、招揽、封锁。
- 不新增 knowledge-index body、runtime canon、hidden/private body、prompt body archival。
- 不改公开发布、法律边界，不部署 EdgeOne，不自动合并 `main`。

## 入口文件

| 文件 | 用途 |
|---|---|
| `v4.1.0-专家团启动会纪要.md` | 专家团意见、路线选择、收益风险 |
| `v4.1.0-启动审查与范围冻结.md` | 进入条件、范围、非目标 |
| `v4.1.0-总体开发大纲.md` | v4.1 总体目标和阶段产物 |
| `v4.1.0-小版本执行路线图.md` | a0/a1/a2/b1/b2/b3/rc 路线建议 |
| `v4.1.0-前置授权包.md` | 已获用户批准的 D-410/F-410 状态与授权边界 |
| `v4.1.0-D410授权确认记录.md` | D-410/F-410 用户拍板记录 |
| `v4.1.0-a0-v4.0证据复盘与范围冻结.md` | v4.0 证据复盘与 v4.1 范围冻结 |
| `v4.1.0-a1-AutoTheaterContractV1设计门禁.md` | Auto-Theater contract v1 设计门禁 |
| `v4.1.0-a2-表达权限与证据链门禁.md` | ExpressionAuthority / WorldCoreEvidenceChain 门禁 |
| `v4.1.0-b1-v410-contract-checker实现记录.md` | v410 report-only contract checker 实现与首跑结果 |
| `v4.1.0-b2-negative-fixtures与deterministic-contract-hardening记录.md` | negative fixture 与 240 轮 deterministic contract 证据 |
| `v4.1.0-b3-Player-Advocate-50轮记录.md` | 50 轮 Player Advocate 记录 |
| `v4.1.0-b3-old-save-no-save-rollback证据.md` | old-save / no-save / rollback 证据 |
| `v4.1.0-process-2-长线漂移与知识边界复核.md` | 长线漂移与知识边界复核 |
| `v4.1.0-rc-Skill同步审计记录.md` | rc skill sync audit |
| `v4.1.0-rc-质量收束记录.md` | rc 质量收束记录 |
| `v4.1.0-例外停机清单.md` | `/goal` 自动推进必须停止的条件 |
| `v4.1.0-需求决策池.md` | 决策项状态表 |
| `v4.1.0-测试矩阵.md` | 文档自检、后续 checker 与 PA 计划 |
| `v4.1.0-MiroFish资料需求与交付协议.md` | MiroFish need level 与 blocking 条件 |
| `v4.1.0-真相源索引.md` | 当前真相源和禁止来源 |
| `v4.1.0-Git提交与推送计划.md` | 分支、提交、推送、主线合并边界 |
| `v4.1.0-startup-Skill同步审计记录.md` | startup skill sync audit |

## 当前建议

用户已一次性审批 `D-410-001` 至 `D-410-012`，并确认 `F-410-001` 至 `F-410-012` 全部继续 `future_gate_required`。v4.1 已在一个 `/goal` 内完成 a0/a1/a2/b1/b2/b3/rc，本地验证通过；没有触发例外停机清单。
