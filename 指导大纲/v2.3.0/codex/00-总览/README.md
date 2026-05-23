# RebornG v2.3.0 Codex 当前入口

状态：v2.3.0 本地开发完成；D-230、D-231、D-232 已批准；a1/a2/b1/b2/b3/rc 已完成。
日期：2026-05-23
当前分支：`codex/v230-startup-agent-eval-farm`

## 当前一句话

`v2.3.0` 主线已批准为 `Agent eval farm 与失败分类硬化`。

v2.1 证明了自有 `AgentProposal` report-only runner 能跑通；v2.2 证明了 20 NPC / 3 抽象 pressure source / 1 个 L5 宏观导演的扩展离线样板能稳定通过。v2.3 不应急着接 runtime agent，而应把 Agent Lab 推进到“能持续判定可靠性”的阶段：失败分类、负例注入、重放/rescore、趋势归档、future sample 回流和准入阈值。

当前已完成 startup/a0、a1/a2 设计门禁、b1-b3 report-only/offline runner 收束和 rc 质量收束：

- 不改 runtime。
- 不新增 save 字段，不 bump `SAVE_FORMAT_VERSION`。
- 不新增 DeepSeek prompt/context/model/authority。
- 不调用 live DeepSeek。
- 不新增后端/BFF。
- 不启用 subagents。
- 不新增 MiroFish export。
- 不引入第三方 agent SDK/framework 依赖或 PoC。
- 不开放外部 SDK/agent 文件、命令、补丁或 git 权限。
- 不开放正式地点、阵营、奖励、NPC 生死或 canon promotion。

## 当前阶段

- v2.2 completed locally。
- v2.3 startup / a0 文档已建立。
- D-230-001 至 D-230-012：已获用户批准。
- a1 `failure taxonomy 与 severity rubric` 已完成，冻结 `agent_eval_taxonomy_v230_a1`。
- D-231-001 至 D-231-006：已获用户批准。
- a2 `eval farm schema 与 report archive` 已完成，冻结 `agent_eval_farm_report_v230_a2`。
- D-232-001 至 D-232-006：已获用户批准。
- b1/b2/b3/rc 已完成，自有 runner 报告 `artifacts/v2.3.0/agent-eval-farm/2026-05-23T09-10-30-682Z/report.json` 通过。
- v2.4 前置专项：`指导大纲/长期路线/Agent-Framework-Landscape-2026吸收矩阵.md` 已获用户批准并落地。Hermes Agent 为 P0 架构参考/P1 隔离 PoC 候选；Dify/Flowise/AutoGPT/Agno/Browser-use/LlamaIndex 等已按 WorldCore 服务能力重新评分；当前只授权 license/SBOM/架构适配评估，不授权 PoC、依赖、runtime agent、外部 agent 权限或 self-learning 写 canon/runtime/save。
- 下一步：开 v2.4 专家团启动会，先讨论薄 BFF / private canon / eval archive infrastructure 边界，并把 Agent Framework Landscape 作为输入；不直接进入 runtime agent。

## v2.3 推荐切法

1. startup/a0：v2.2 runner 复盘、v2.3 eval farm 范围冻结、D-230 决策池。已完成。
2. a1：failure taxonomy 与 severity rubric 设计门禁。已完成。
3. a2：eval farm schema、report archive、trend ledger 设计门禁。已完成。
4. b1：自有 zero-dependency report-only eval farm runner。已完成。
5. b2：负例注入、deterministic mutation、replay/rescore 和 false-negative gate。已完成。
6. b3：报告归档、趋势比较、future_sample_pool 回流。已完成。
7. rc：质量收束、Skill sync、CI、handoff。已完成。

## 当前入口文件

- `v2.3.0-专家团启动会纪要.md`
- `v2.3.0-启动审查与范围冻结.md`
- `v2.3.0-总体开发大纲.md`
- `v2.3.0-小版本执行路线图.md`
- `v2.3.0-需求决策池.md`
- `v2.3.0-a0-v2.2复盘与EvalFarm范围冻结.md`
- `v2.3.0-a0-Skill同步审计记录.md`
- `v2.3.0-a1-failure-taxonomy与severity-rubric设计门禁.md`
- `v2.3.0-a1-Skill同步审计记录.md`
- `v2.3.0-a2-eval-farm-schema与report-archive设计门禁.md`
- `v2.3.0-a2-Skill同步审计记录.md`
- `v2.3.0-b1-Agent-Eval-Farm-report-only-runner第一刀.md`
- `v2.3.0-b2-negative-fixture-mutation与rescore.md`
- `v2.3.0-b3-trend-archive与future-sample回流.md`
- `v2.3.0-rc-Agent-Eval-Farm质量收束记录.md`
- `v2.3.0-rc-Skill同步审计记录.md`
- `v2.3.0-真相源索引.md`
- `v2.3.0-测试矩阵.md`
- `v2.3.0-MiroFish资料需求与交付协议.md`
- `v2.3.0-Git提交与推送计划.md`

## 继承输入

- v2.0 T3：regional life hardening、formal credential / terminology / retry repair 经验。
- v2.1：自有 report-only `AgentProposal` runner 第一版。
- v2.2：20 NPC / 3 pressure source / 1 L5 expanded offline runner，P0/P1/P2=0/0/0。
- 长期路线：`v2.0-v3.0-AgentLab到RuntimeAgent总体大纲.md` 中 v2.3 定位为 eval farm 与失败分类，不授权 runtime agent。

## 下一步

建议开 v2.4 专家团启动会。v2.4 仍应先评估薄 BFF / private canon / eval archive infrastructure 边界；`Agent Framework Landscape 2026 吸收矩阵` 是前置输入；不要直接从 v2.3 跳到 runtime agent。
