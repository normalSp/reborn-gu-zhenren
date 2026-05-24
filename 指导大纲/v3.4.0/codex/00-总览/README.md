# v3.4.0 总览

日期：2026-05-24
状态：startup；pending user route decision
主线：v3.4 路线选择与最小 runtime first cut 前置授权包

## 定位

v3.4 承接 v3.3 的 `F-300 reopen 决策包`。v3.3 已证明可以讨论最小 runtime agent 第一刀，但没有自动授权实现。

本启动包只负责把三条路线写清楚：

1. 继续 report-only hardening。
2. 单独重开最小 `transient proposal-only` runtime first cut 授权包。
3. 继续 defer 到 v3.5+。

专家团倾向路线 2，但只能在用户明确批准后进入实现。路线 2 也只打开一个窄口：L2/L3 小区域、transient AgentProposal、WorldCore post-check、expression-only、不写事实、不写存档、不调用 live DeepSeek。

## 既定路线回放

长期路线 `v3.0-v4.0-RuntimeAgent到高阶世界总体大纲.md` 的设定是：

- v3.1：继续加固 runtime agent 门禁。
- v3.2：做 offline / report-only runtime rehearsal。
- v3.3：给出 F-300 reopen 决策包。
- v3.4-v3.6：如果未来获批，分阶段做最小 L2/L3 小区域试点；如果未获批，则继续 report-only hardening。
- v3.7-v3.8：多 NPC、小势力、同开局差异、长期记忆污染和漂移复核。
- v3.9：v4.0 前安全收束。
- v4.0：高阶战斗 + 天道/宿命双预备，不承诺完整蛊仙开放。

因此，v3.4 不是“必须继续 report-only”，也不是“默认实装 runtime agent”。它是第一处可以让你决定是否打开最小窄口的位置。

## 硬边界

本启动包不授权：

- 不改 runtime/source/UI/store/prompt/save。
- 不实现 runtime agent。
- 不新增 save field，不 bump `SAVE_FORMAT_VERSION`，不新增 `runFingerprint`。
- 不调用 live DeepSeek，不改 prompt/context/model/authority，不新增 DeepSeek visible lore/RAG。
- 不做 MiroFish export/intake，不吸收真实原著事实、命名 NPC、hidden-adjacent、方源公开证据或正式 lore 结论。
- 不做 backend/BFF/service/job queue/eval archive/cloud save。
- 不引入 external framework PoC/dependency/read-only scan/subagent/patch artifact。
- 不开放 L4/L5 runtime、天道/宿命 runtime 裁决、原著关键人物 runtime agent。
- 不开放正式地点、阵营、身份、奖励、NPC 生死、通缉、招揽、封锁。
- 不做 public wording、release、EdgeOne 或法律/版权边界变化。

## 入口文件

| 文件 | 用途 |
|---|---|
| `v3.4.0-专家团启动会纪要.md` | 专家团路线判断、收益风险与推荐 |
| `v3.4.0-启动审查与范围冻结.md` | v3.3 证据复核与 v3.4 startup 范围 |
| `v3.4.0-总体开发大纲.md` | v3.4 候选阶段设计 |
| `v3.4.0-小版本执行路线图.md` | route 1 / route 2 / route 3 的执行拆分 |
| `v3.4.0-前置授权包.md` | 需要用户拍板的 D-340 / F-340 |
| `v3.4.0-例外停机清单.md` | 后续 `/goal` 自动推进硬停条件 |
| `v3.4.0-需求决策池.md` | v3.4 决策状态入口 |
| `v3.4.0-测试矩阵.md` | startup 自检和未来 route 2 验收档位 |
| `v3.4.0-真相源索引.md` | v3.4 证据优先级 |
| `v3.4.0-MiroFish资料需求与交付协议.md` | 当前 MiroFish need level 与 blocking 触发器 |
| `v3.4.0-Git提交与推送计划.md` | 分支、提交、推送与 CI 计划 |
| `v3.4.0-startup-Skill同步审计记录.md` | startup skill sync audit |

## 当前结论

专家团不建议路线 3。路线 1 最安全但边际收益下降。路线 2 是最符合长期路线的推进方式，但必须明确为“单独打开最小窄口”，不能顺手打开 save、live DeepSeek、MiroFish、backend、external framework、L4/L5 或正式世界事实。

需要用户下一步拍板：选择路线 1、路线 2 或路线 3。专家团推荐路线 2。
