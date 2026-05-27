# v4.2.0 总览

状态：completed；用户已批准 `D-420-001` 至 `D-420-012`，并确认 `F-420-001` 至 `F-420-012` 继续 `future_gate_required`。
日期：2026-05-26。
当前分支：`codex/v420-startup-auto-theater-lite-mortal-mapping`。
主线：`Auto-Theater Lite / 凡阶战斗映射设计门禁`。

## 定位

`v4.2.0` 承接 `v4.0.0` 的 Auto-Theater Combat 总设计和 `v4.1.0` 的 Auto-Theater contract v1。它的目标不是重做凡阶战斗，而是把现有凡阶棋盘 / 行动卡 / 战斗 trace 映射成 `Auto-Theater Lite` 的 preparation、transcript、Combat Ledger 和 player-readable explanation。

一句话：`v4.2` 先证明“现有凡阶战斗可以不推倒重做，也能拥有更强的战斗解释与证据链”，再决定未来是否迁移 runtime。

## 硬边界

- 不改 runtime/source/UI/store/prompt/save。
- 不迁移现有凡阶战斗 runtime，不改变玩家低阶战斗操作方式。
- 不实现 theater UI，不接入 Auto-Theater runtime，不做纯自走棋 runtime。
- 不新增战斗数值、伤害公式、奖励、掉落、地点、阵营、身份、NPC 生死或战后正式结论。
- 不新增 save field，不 bump `SAVE_FORMAT_VERSION = 25`，不加入 `runFingerprint`。
- 不调用 live DeepSeek，不修改 DeepSeek prompt/context/model/authority。
- 不新增 DeepSeek visible lore/RAG。
- 不新增 MiroFish export/intake、knowledge-index body、runtime canon、hidden/private body。
- 不引入 backend/BFF/service/job queue/eval archive service/cloud save。
- 不引入外部 framework PoC、dependency、vendored subset、read-only scan、patch artifact 或 subagents。
- 不开放高阶战斗 runtime、L4/L5 runtime、HeavenWill/Fate runtime 裁决或原著关键人物 agent。
- 不发布公开口径，不部署 EdgeOne，不自动合并 `main`。

## 入口文件

- `v4.2.0-专家团启动会纪要.md`
- `v4.2.0-启动审查与范围冻结.md`
- `v4.2.0-总体开发大纲.md`
- `v4.2.0-小版本执行路线图.md`
- `v4.2.0-前置授权包.md`
- `v4.2.0-例外停机清单.md`
- `v4.2.0-需求决策池.md`
- `v4.2.0-测试矩阵.md`
- `v4.2.0-MiroFish资料需求与交付协议.md`
- `v4.2.0-真相源索引.md`
- `v4.2.0-Git提交与推送计划.md`
- `v4.2.0-startup-Skill同步审计记录.md`
- `v4.2.0-D420授权确认记录.md`
- `v4.2.0-a0-v4.1证据复盘与范围冻结.md`
- `v4.2.0-a1-AutoTheaterLite凡阶映射设计门禁草案.md`
- `v4.2.0-a2-CombatLedgerLite与可读性表达门禁.md`
- `v4.2.0-b1-v420-lite-mapping-checker实现记录.md`
- `v4.2.0-b2-negative-fixtures与deterministic-mapping-hardening记录.md`
- `v4.2.0-b3-Player-Advocate-50轮记录.md`
- `v4.2.0-b3-old-save-no-save-rollback证据.md`
- `v4.2.0-process-1-系统连续性与孤儿系统审计.md`
- `v4.2.0-process-2-长线漂移与知识边界复核.md`
- `v4.2.0-rc-Skill同步审计记录.md`
- `v4.2.0-rc-质量收束记录.md`

## 专家团建议

专家团建议 `v4.2` 采用保守路线：先做 `report-only / design-gate / checker-ready` 的凡阶映射，不改现有战斗 runtime。棋盘战斗在凡阶阶段仍是可用的操作壳；Auto-Theater Lite 应先作为解释层、证据层和未来迁移合同，而不是直接替换玩家操作。

## 完成证据

- `check:v420-auto-theater-lite-mortal-mapping` 首次通过：32/32 schema valid，10 ready / 8 future gate / 14 no-go，240 轮 deterministic，acceptedForGate=true。
- Player Advocate 50 轮通过，live DeepSeek：否。
- old-save/no-save/rollback 通过：未改 runtime、store、save、prompt、UI、后端或外部依赖。
- Context-to-Skill 治理专项已并回 v4.2 工作分支，不再停留在孤立分支。

## 下一步

v4.2 完成后的下一步应先看 v4.3 专家团启动会，而不是直接开放凡阶 combat runtime 迁移。凡阶战斗 runtime 迁移、Auto-Theater Lite runtime、theater UI、素材生成、live DeepSeek 战斗表达、MiroFish blocking 或任何 F-420 项仍需未来单独审批。

## 并行治理专项

pre-v4.3 已新增 `Context-to-Skill 技能演化评测制度专项`：

- 项目级制度入口：`指导大纲/流程制度/Context-to-Skill技能演化评测制度.md`
- skill 演化入口：`指导大纲/技能演化/README.md`
- Agent Lab 论文参考池：`指导大纲/长期路线/Agent-Lab论文参考池与吸收计划.md`

该专项只覆盖 `reborn-expert-council`，不自动改 skill、不跑 LLM Judge、不新增脚本，也不改变 v4.2 的 D-420/F-420 授权包。
