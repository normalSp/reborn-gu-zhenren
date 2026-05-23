# v2.7.0 codex 总览

日期：2026-05-24
状态：startup meeting completed；等待用户审批 D-271 前置授权包
分支：`codex/v270-startup-multi-npc-agent-lab`
主线：`低阶多 NPC / 小势力 Agent Lab 样板扩展`

## 一句话结论

v2.7 建议承接 v2.6 的 agent infra 准入清单，把 Agent Lab 从单一边界 checker 推进到多 NPC、小队记忆、小势力压力、商队/散修/路人聚合反应的离线样板扩展。v2.7 仍然是 synthetic / offline / report-only，不批准 runtime agent、后端、live DeepSeek、MiroFish export、真实原著事实或正式游戏事实。

## 当前入口

| 文档 | 用途 | 状态 |
|---|---|---|
| `v2.7.0-专家团启动会纪要.md` | 专家团意见与启动结论 | completed |
| `v2.7.0-前置授权包.md` | D-271 / F-271 全版本授权边界 | pending user approval |
| `v2.7.0-启动审查与范围冻结.md` | v2.6 输入、硬边界、范围冻结 | completed startup |
| `v2.7.0-总体开发大纲.md` | 主线、产物目标、工程边界 | draft |
| `v2.7.0-小版本执行路线图.md` | startup/a0/a1/a2/b1/b2/b3/process/rc | draft |
| `v2.7.0-需求决策池.md` | D-271 / F-271 决策池 | pending |
| `v2.7.0-a0-v2.6复盘与多NPC小势力AgentLab范围冻结.md` | v2.6 复盘与 v2.7 a0 范围冻结 | draft |
| `v2.7.0-测试矩阵.md` | v2.7 report-only / offline 测试矩阵 | draft |
| `v2.7.0-真相源索引.md` | 本版本依据与禁止事实源 | draft |
| `v2.7.0-MiroFish资料需求与交付协议.md` | MiroFish need level 与升级条件 | draft |
| `v2.7.0-Git提交与推送计划.md` | 分支、提交、推送、CI 计划 | draft |
| `v2.7.0-startup-Skill同步审计记录.md` | startup skill sync audit | completed |

## 编号说明

历史文档中 `D-270-001` 至 `D-270-006` 已用于 v2.5 启动前决策。为避免编号冲突，v2.7 前置授权包采用 `D-271` / `F-271`。

## 当前建议

专家团建议用户审批：

- D-271-001 至 D-271-012：建议全部批准。
- F-271-001 至 F-271-012：建议全部保持 `future_gate_required`。

若用户批准 D-271，后续可以在 `/goal` 中按授权包连续完成 v2.7，不再每个小阶段重复等待常规审批。任何 F-271 事项触发时仍必须停机找用户决策。

## 硬边界

v2.7 startup 不授权：

- runtime/source/UI/store/prompt/save 变更。
- 新 save field、`SAVE_FORMAT_VERSION` bump、migration、`runFingerprint`。
- runtime agent、WorldCore runtime 接入、agent 写正式事实。
- live DeepSeek、DeepSeek prompt/context/model/authority 变更、DeepSeek visible lore/RAG。
- backend/BFF/private canon service/eval archive service/job queue service/cloud save。
- external framework PoC、dependency、vendored subset、read-only scan、patch artifact、subagents。
- MiroFish export/intake、真实原著事实、命名 NPC、hidden-adjacent、方源公开证据、正式 lore 结论。
- 知识库正文、runtime canon、canon promotion、真实 hidden/private body、prompt body archive。
- 正式地点、阵营、身份、奖励、NPC 生死、正式游戏事实。
- public wording、release、EdgeOne 部署、法律/版权边界变化。

## 下一步

等待用户审批 D-271 / F-271。

若批准，进入：

`v2.7.0-a1-多NPC小势力AgentLab场景模型设计门禁.md`
