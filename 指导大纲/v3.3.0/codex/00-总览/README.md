# v3.3.0 总览

日期：2026-05-24
状态：startup completed；D-330 pending user approval；F-330 proposed `future_gate_required`
主线：F-300 reopen 决策包

## 定位

v3.3 承接 v3.2 的 `v33DecisionPackageReady=true`，目标是给用户一份能一次性判断“是否打开最小 runtime agent 第一刀”的 F-300 reopen 决策包。

v3.3 不是 runtime agent implementation。当前默认只做决策包、证据复盘、风险收益、成本档位、测试档位和下一步路线分叉。

## 硬边界

本 startup 不授权：

- 不打开 F-300-001，不实现 runtime agent implementation。
- 不改 runtime/source/UI/store/prompt/save。
- 不新增 save field，不 bump `SAVE_FORMAT_VERSION`，不新增 `runFingerprint`。
- 不调用 live DeepSeek，不改 DeepSeek prompt/context/model/authority，不新增 DeepSeek visible lore/RAG。
- 不建 backend/BFF/service/job queue/eval archive/cloud save。
- 不做 MiroFish export/intake，不吸收真实原著事实、命名 NPC、hidden-adjacent、方源公开证据或正式 lore 结论。
- 不写知识库正文，不 promotion runtime canon，不读取或归档 hidden/private body。
- 不引入 external framework PoC/dependency/read-only scan/vendored subset/patch artifact/subagents。
- 不开放 L4/L5 runtime、天道/宿命 runtime 裁决、原著关键人物 runtime agent。
- 不开放正式地点、阵营、身份、奖励、NPC 生死、通缉、招揽、封锁。
- 不做 public wording、release、EdgeOne 或法律/版权边界变化。

## 入口文件

| 文件 | 用途 |
|---|---|
| `v3.3.0-专家团启动会纪要.md` | v3.3 专家团意见与版本基调 |
| `v3.3.0-启动审查与范围冻结.md` | v3.2 证据复盘与 v3.3 范围冻结 |
| `v3.3.0-总体开发大纲.md` | v3.3 总体阶段设计 |
| `v3.3.0-小版本执行路线图.md` | startup/a0/a1/a2/b1/b2/b3/process/rc 执行顺序 |
| `v3.3.0-前置授权包.md` | D-330 建议批准项与 F-330 future gate |
| `v3.3.0-例外停机清单.md` | `/goal` 自动推进时必须停机的条件 |
| `v3.3.0-需求决策池.md` | D-330/F-330 决策记录入口 |
| `v3.3.0-测试矩阵.md` | v3.3 文档、证据和边界检查计划 |
| `v3.3.0-真相源索引.md` | v3.3 的证据优先级 |
| `v3.3.0-MiroFish资料需求与交付协议.md` | 当前 MiroFish need level 与升级条件 |
| `v3.3.0-Git提交与推送计划.md` | 分支、提交、推送、CI 计划 |
| `v3.3.0-startup-Skill同步审计记录.md` | startup skill sync audit |

## 当前结论

专家团建议开启 v3.3，但 v3.3 应保持“决策包版本”：先把 F-300 是否打开、打开哪几项、代价和测试档位讲清楚。若 D-330 获批，可以继续完成 v3.3 的 a0-a2/b1-b3/process/rc 文档与 report-only 决策矩阵；若用户要真正打开 runtime agent implementation，必须另批 F-300/F-330。
