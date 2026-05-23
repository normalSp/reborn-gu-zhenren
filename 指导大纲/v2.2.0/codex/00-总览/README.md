# RebornG v2.2.0 Codex 当前入口

状态：v2.2.0 completed locally；D-222 已批准并完成 b1-b3/rc。
日期：2026-05-23
当前分支：`codex/v220-b1-to-rc-agent-lab-expanded-runner`

## 当前一句话

`v2.2.0` 主线已按用户批准的 D-220 冻结为 `Agent Lab 扩展离线模拟第一阶段`。a1 已完成 20 NPC / 3 势力 / 1 个 L5 宏观导演的离线场景模型设计门禁；a2 已完成 memory / visibility / WorldCore post-check 扩展门禁；用户随后批准 D-222 全部项，b1-b3/rc 已完成自有 zero-dependency report-only/offline runner 扩展、multi-turn replay/rescore、failure taxonomy、报告归档和 skill sync。

本版本仍只做文档、设计门禁、report-only/offline 工具和证据归档：

- 不改 runtime。
- 不新增 save 字段，不 bump `SAVE_FORMAT_VERSION`。
- 不新增 DeepSeek prompt/context/model/authority。
- 不调用 live DeepSeek。
- 不新增后端/BFF。
- 不启用子代理。
- 不新增 MiroFish export。
- 不引入第三方 agent SDK/framework 依赖或 PoC。
- 不开放外部 SDK/agent 文件、命令、补丁或 git 权限。
- 不开放正式地点、阵营、奖励、NPC 生死或 canon promotion。

## 当前阶段结果

- D-220-001 至 D-220-012：用户已全部批准。
- a1 场景模型门禁：completed。
- a2 memory / visibility / WorldCore post-check 门禁：completed。
- D-222-001 至 D-222-010：用户已全部批准。
- b1 v2.2 expanded offline runner 第一刀：completed。
- b2 multi-turn replay / rescore / failure taxonomy：completed。
- b3 report archive / future_sample_pool 回流：completed。
- rc 质量收束与 skill sync：completed。
- 场景代号：`outer_edge_agent_lab_synthetic_v1`。
- 默认规模：20 NPC / 3 抽象势力 / 1 L5 `heaven_will_pressure`。
- L4：默认不进入 v2.2 a1/a2；若进入，升级 MiroFish `blocking` 并重新请用户决策。
- memory：仅 report-only candidate，不是 save/canon/runtime/DeepSeek visible。
- visibility：`public_pressure` / `agent_private_candidate` / `ref_only` / `gated` / rejected。
- WorldCore post-check：hidden leak、formal authority drift、memory contamination、L5 结局宣判均为 blocking。
- runner 证据：`npm run check:v220-agent-lab-expanded-offline` 通过，21/21 schema valid，20 unique NPC，3 faction pressure refs，1 L5，P0/P1/P2=0/0/0，hiddenLeak/formalAuthorityDrift/memoryContamination=0。
- 报告：`artifacts/v2.2.0/agent-lab-expanded-offline-runner/2026-05-23T06-20-49-546Z/report.json`。

## 继承输入

v2.1 已完成：

- 自有 zero-dependency report-only/offline runner。
- `tests/evals/v210-agent-lab/samples.json` 10 个合成样本。
- `npm run check:v210-agent-lab-offline` 通过。
- schema 10/10，acceptedForGate 10/10，P0/P1/P2=0/0/0。
- 报告：`artifacts/v2.1.0/agent-lab-offline-runner/2026-05-22T17-31-47-312Z/report.json`。

长期总纲规定 v2.2 的默认方向：

- 扩展离线、report-only 的 Agent Lab runner。
- 默认目标 20 NPC / 3 势力 / 1 个 L5 宏观导演。
- 仍不进玩家 runtime，不写正式存档。
- live DeepSeek、外部框架 PoC、只读子代理、BFF/backend 均需未来单独批准。

## 当前入口文件

- `v2.2.0-专家团启动会纪要.md`
- `v2.2.0-启动审查与范围冻结.md`
- `v2.2.0-总体开发大纲.md`
- `v2.2.0-小版本执行路线图.md`
- `v2.2.0-需求决策池.md`
- `v2.2.0-a0-v2.1复盘与AgentLab扩展范围冻结.md`
- `v2.2.0-a0-Skill同步审计记录.md`
- `v2.2.0-a1-20NPC三势力一L5场景模型设计门禁.md`
- `v2.2.0-a1-Skill同步审计记录.md`
- `v2.2.0-a2-memory-visibility-postcheck扩展门禁.md`
- `v2.2.0-a2-Skill同步审计记录.md`
- `v2.2.0-b1-Agent-Lab-expanded-offline-runner第一刀.md`
- `v2.2.0-b2-multi-turn-replay-rescore与failure-taxonomy.md`
- `v2.2.0-b3-report-archive与future-sample回流.md`
- `v2.2.0-rc-Agent-Lab扩展离线模拟质量收束记录.md`
- `v2.2.0-rc-Skill同步审计记录.md`
- `v2.2.0-真相源索引.md`
- `v2.2.0-测试矩阵.md`
- `v2.2.0-MiroFish资料需求与交付协议.md`
- `v2.2.0-Git提交与推送计划.md`

## 建议版本切法

1. startup/a0：v2.1 runner 复盘、v2.2 扩展范围冻结、D-220 决策池。已完成。
2. a1：20 NPC / 3 势力 / 1 L5 场景模型设计门禁。已完成。
3. a2：Agent memory / visibility / WorldCore post-check 扩展门禁。已完成。
4. b1：用户批准 D-222 后，扩展自有 report-only/offline runner 到 v2.2 样本规模。已完成。
5. b2：multi-turn offline replay / rescore / failure taxonomy。已完成。
6. b3：报告归档、成本字段占位、future_sample_pool 回流。已完成。
7. rc：质量收束、skill sync、CI、handoff。已完成。

## 下一步

v2.2 已本地完成。下一步应先开 `v2.3` 专家团启动会，复盘 v2.2 expanded offline runner，再决定是否进入 agent eval farm / failure taxonomy hardening；不要把 v2.2 runner 通过误解为 runtime agent 获批。
