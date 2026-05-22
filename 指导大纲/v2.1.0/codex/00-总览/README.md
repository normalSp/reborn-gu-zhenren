# RebornG v2.1.0 Codex 当前入口

状态：v2.1.0 completed locally；D-213 连续收束已执行。
日期：2026-05-23
当前分支：`codex/v210-d212-sdk-intake-ci-triage`

## 当前一句话

`v2.1.0` 已完成为 `Agent Simulation Lab 启动版` 本地里程碑：不继续往 v2.0 堆 runtime，而是把 v2.0 T3 复盘、Claude Code 与开源 Agent 框架架构尽调、AgentProposal、权限矩阵、visibility gate、WorldCore post-check、offline runner、eval matrix 和质量收束制度化。

2026-05-22，用户已批准 D-211-001、002、003、005、010、012；D-211-009 只允许 report-only；D-211-004、006、008、011 暂不批准或后移；D-211-007 转为未来开源 SDK/agent 引入评估门，不在 b1 放开外部 SDK/agent 文件、命令、补丁或 git 权限。

2026-05-23，用户进一步批准/限制 D-212：D-212-001 license/SBOM/架构适配评估已批准；D-212-002 隔离 PoC 需要时逐项申请；D-212-003 只有需要时做架构评审；D-212-004 需要时先给风险收益报告；D-212-005 需要时先设计人工复核链路再单独申请；D-212-006 禁止。GitHub 旧分支 CI 失败已初诊为 `registry.npmmirror.com` 拉包 504，当前最新 D-211 分支 CI 通过，不阻塞 b1。

2026-05-23，用户批准 D-213 连续收束授权。b1/b2/rc 已在授权边界内完成：新增自有 zero-dependency offline runner 和 10 个合成 AgentProposal 样本，`npm run check:v210-agent-lab-offline` 通过，schema 10/10，acceptedForGate 10/10，P0/P1/P2=0/0/0，报告见 `artifacts/v2.1.0/agent-lab-offline-runner/2026-05-22T17-31-47-312Z/report.json`。

本版本只做文档、启动会、复盘、设计门禁和 report-only offline runner：

- 不改 runtime。
- 不新增 save 字段，不 bump `SAVE_FORMAT_VERSION`。
- 不新增 DeepSeek prompt/context/model/authority。
- 不新增后端/BFF。
- 不调用 live DeepSeek。
- 不启用子代理。
- 不新增 MiroFish export。
- 不开放正式地点、阵营、奖励、NPC 生死或 canon promotion。

本版本新增的唯一实现型产物是 report-only 工具，不属于 runtime agent。

## 当前入口文件

- `v2.1.0-专家团启动会纪要.md`
- `v2.1.0-启动审查与范围冻结.md`
- `v2.1.0-总体开发大纲.md`
- `v2.1.0-小版本执行路线图.md`
- `v2.1.0-需求决策池.md`
- `v2.1.0-a0-v2.0-T3复盘与Agent-Lab范围冻结.md`
- `v2.1.0-a1-Claude-Code架构尽调.md`
- `v2.1.0-a1-Agent框架吸收矩阵.md`
- `v2.1.0-a2-Agent-Lab设计门禁草案.md`
- `v2.1.0-D211决策记录与开源SDK权限评估.md`
- `v2.1.0-D212决策记录与CI初诊.md`
- `v2.1.0-D213连续收束授权记录.md`
- `v2.1.0-b1-Agent-Lab-report-only-offline-runner第一刀.md`
- `v2.1.0-b2-AgentProposal-eval-matrix与失败分类.md`
- `v2.1.0-rc-Agent-Lab第一版质量收束记录.md`
- `v2.1.0-rc-Skill同步审计记录.md`
- `v2.1.0-a0-Skill同步审计记录.md`
- `v2.1.0-真相源索引.md`
- `v2.1.0-测试矩阵.md`
- `v2.1.0-MiroFish资料需求与交付协议.md`
- `v2.1.0-Git提交与推送计划.md`

## v2.0 继承输入

v2.0 已完成：

- `SAVE_FORMAT_VERSION = 25`。
- 单一最小 `regionalEventLedger`。
- `EventEnvelope -> WorldCore -> regionalEventLedger -> replay lane report -> readiness review -> DeepSeek narrative`。
- T3 deterministic/replay 160/160 accepted，P0/P1/P2=0/0/0。
- T3 live clean3 160/160 accepted，P0/P1/P2=0/0/0。
- mixed total 320/320 accepted，live cost `$0.03083156`。

v2.0 没有批准：

- `runFingerprint`。
- `regionalLifeState` / `areaLivingState`。
- `identityRouteState` / `professionState`。
- DeepSeek visible knowledge / RAG。
- BFF/backend。
- 子代理。
- 正式地点、阵营、奖励、NPC 生死或 canon promotion。

## v2.1 主线

用户已选择：

- v2.1 主线：`Agent Lab`。
- Claude Code 处理方式：`专项尽调`。
- a1 尽调范围：Claude Code + 开源 Agent 框架吸收矩阵；当前只做文档矩阵，不引入依赖。
- 长期 v2.0-v3.0 路线总纲：`指导大纲/长期路线/v2.0-v3.0-AgentLab到RuntimeAgent总体大纲.md` 已作为规划基线建立；它不扩大 v2.1 当前执行范围。

v2.1 第一批顺序：

1. a0：v2.0 T3 复盘与 Agent Lab 范围冻结。已完成。
2. a1：Claude Code 与开源 Agent 框架架构尽调。已完成。
3. a2：Agent Lab 设计门禁草案。已完成。
4. b1：按 D-211/D-213 完成 report-only/offline runner 第一刀。
5. b2：完成 AgentProposal eval matrix 与 failure taxonomy。
6. rc：完成 Agent Lab 第一版质量收束和 Skill 同步审计。

当前已批准：

- D-210-001 至 D-210-010 已批准。
- D-210-011 已按用户同意记录为文档矩阵补丁。
- `v2.1.0-a0-v2.0-T3复盘与Agent-Lab范围冻结` 已完成入场复盘与范围冻结确认。
- `v2.1.0-a1-Claude-Code架构尽调.md` / `v2.1.0-a1-Agent框架吸收矩阵.md` 已完成为 a2 输入。
- 用户于 2026-05-22 明确要求进入 `v2.1.0-a2`，a2 已完成。
- D-211-001、002、003、005、010、012 已批准；D-211-004 暂不批准，若需要 live DeepSeek eval 必须另向用户申请。
- D-211-006 暂不批准，先让自有 AgentProposal 门禁跑通，再做外部框架对照。
- D-211-007 不在 b1 放开外部 SDK/agent 文件、命令、补丁或 git 权限；已转为未来 D-212 开源 SDK/agent 引入评估门。
- D-211-008 暂不批准，后续可单独给只读/分析型子代理风险收益报告。
- D-211-009 只允许 report-only，不写正式存档。
- D-211-011 后移到 v2.4+ 再议。
- D-212-001 已批准为 license/SBOM/架构适配评估；D-212-002/003/004/005 均需后续条件门禁；D-212-006 禁止。
- 本轮 GitHub CI 初诊：旧 a1/a2 分支失败是 npm registry mirror 504，当前最新分支 CI 通过；暂不开子代理，不改 CI/lockfile。
- D-213 已批准并执行：b1/b2/rc 连续收束，P0/P1/P2=0/0/0，offline runner 报告通过。
- 用户消息中的“v2.0-a0”按 D-210 语义归一为 `v2.1.0-a0`，不回退历史 v2.0 阶段。
- 用户于 2026-05-22 明确要求进入 `v2.1.0-a1`，a1 已收束为 a2 设计输入；当前 a2 仍只做设计门禁，不引入依赖、runner、PoC、BFF/backend、live DeepSeek、子代理或 runtime agent。

## 长期路线关系

v2.1 已完成 Agent Lab 启动版：T3 复盘、Claude Code 与开源 Agent 框架架构尽调、Agent Lab 设计门禁、offline runner、eval matrix 和 rc 质量收束。

`v2.0-v3.0-AgentLab到RuntimeAgent总体大纲.md` 只规定后续路线节奏：

- v2.1-v2.3：Agent Lab。
- v2.4-v2.6：薄 BFF / 私有事实 / 归档边界评估。
- v2.7-v2.9：runtime agent 接入前预备。
- v3.0：有限 L2/L3 runtime agent 试点。

该总纲不授权当前 runtime agent、后端、DeepSeek 权限、save-format bump、MiroFish export、正式地点/阵营/奖励/NPC 生死或 canon promotion。

## 必读制度

- `指导大纲/流程制度/Git分支切换与推送制度.md`
- `指导大纲/流程制度/Skill同步审计制度.md`
- `指导大纲/流程制度/长线叙事漂移测试制度.md`
- `指导大纲/流程制度/测试矩阵演进规则.md`
- `指导大纲/流程制度/全书知识库治理制度.md`
- `指导大纲/流程制度/MiroFish双仓topic-slice流水线制度.md`

## 下一步

当前已完成：

`v2.1.0-rc-Agent-Lab第一版质量收束记录.md`

下一步建议开 `v2.2` 专家团启动会，讨论是否扩大 Agent Lab offline runner 覆盖。仍不直接进入 framework PoC、live eval、子代理、BFF/backend、外部 SDK/agent 文件权限或 runtime agent。
