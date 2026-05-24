# v3.1.0 总览

日期：2026-05-24
状态：startup completed；等待用户审批 D-310-001 至 D-310-012
主线：runtime agent 门禁二次加固

## 定位

v3.1 承接 `v3.0.0` 的有限 L2/L3 runtime agent 试点设计门禁，但不打开 runtime agent implementation。

本版本要做的是把 v3.0 已建立的 `AgentProposal -> WorldCore post-check -> report-only go/no-go` 继续压实，重点复核 rollback、old-save、Player Advocate、live metadata、long drift、manual review 与 future gate 触发条件。目标是让后续 v3.2 rehearsal 有更硬的证据链，而不是让 agent 进入正式 runtime。

## 硬边界

- 不改 runtime/source/UI/store/prompt/save。
- 不实现 runtime agent。
- 不新增 save field，不 bump `SAVE_FORMAT_VERSION`，不新增 `runFingerprint`。
- 不调用 live DeepSeek，不修改 prompt/context/model/authority，不新增 DeepSeek visible lore/RAG。
- 不新增 backend/BFF/service/job queue/eval archive/cloud save。
- 不新增 MiroFish export/intake，不使用真实原著事实、命名 NPC、hidden-adjacent、方源公开证据或正式 lore 结论。
- 不写知识库正文，不 promotion runtime canon，不归档 hidden/private body 或 prompt body。
- 不引入外部 agent framework 的 PoC、dependency、vendored subset、read-only scan、patch artifact、subagent 或外部项目写权限。
- 不开放正式地点、阵营、身份、奖励、NPC 生死、通缉、招揽、封锁。
- 不开放 L4/L5 runtime、天道/宿命 runtime 裁决、原著关键人物 runtime agent。
- 不部署 EdgeOne，不改变 public wording / release / legal boundary。

## 当前入口

| 文件 | 用途 |
|---|---|
| `v3.1.0-专家团启动会纪要.md` | v3.1 专家团意见与版本基调 |
| `v3.1.0-启动审查与范围冻结.md` | v3.0 复盘、v3.1 范围冻结、禁止事项 |
| `v3.1.0-总体开发大纲.md` | v3.1 总体阶段设计 |
| `v3.1.0-小版本执行路线图.md` | a0/a1/a2/b1/b2/b3/process/rc 执行顺序 |
| `v3.1.0-前置授权包.md` | D-310 建议批准项与 F-310 future gate |
| `v3.1.0-例外停机清单.md` | `/goal` 自动推进时必须停机的条件 |
| `v3.1.0-需求决策池.md` | D-310/F-310 决策记录入口 |
| `v3.1.0-测试矩阵.md` | v3.1 文档、报告、checker、Player Advocate/live metadata 计划 |
| `v3.1.0-真相源索引.md` | v3.1 的证据优先级 |
| `v3.1.0-MiroFish资料需求与交付协议.md` | 当前 MiroFish need level 与升级条件 |
| `v3.1.0-Git提交与推送计划.md` | 分支、提交、推送、CI 计划 |
| `v3.1.0-startup-Skill同步审计记录.md` | startup skill sync audit |

## 给用户的待决策项

请审批：

- D-310-001 至 D-310-012：建议作为 v3.1 的前置批量授权包。
- F-310-001 至 F-310-012：建议全部保持 `future_gate_required`。

批准后，Codex 可在授权包内连续完成 v3.1；触发任一 F-310 或例外停机条件时必须停下来找用户决策。
