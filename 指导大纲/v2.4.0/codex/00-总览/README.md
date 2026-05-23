# RebornG v2.4.0 Codex 当前入口

状态：v2.4-rc 已完成；D-240/D-241/D-242/D-249/D-259/D-269/D-270 决策池已获用户批准；v2.5-a0 治理补丁已开启；不授权 runtime。
日期：2026-05-23
当前分支：`codex/v240-rc-infrastructure-boundary-closure`

## 当前一句话

`v2.4.0` 建议主线为：`薄 BFF / private canon / eval archive 边界评估`。

v2.0 已证明第一个区域活世界和 T3 长测能守住；v2.1-v2.3 已完成 Agent Lab、扩展离线模拟和 eval farm；v2.4 不应直接把 agent 接进 runtime，而应先把未来基础设施边界讲清楚：

- 薄 BFF 能做什么，不能做什么。
- private canon / hidden body 如何在不泄漏的前提下服务未来 agent。
- eval archive / replay / cost / prompt hash 如何工程化。
- Hermes / LangGraph / Mastra / LlamaIndex / Dify 等外部框架如何只作为架构吸收，不越权进入 runtime。
- self-learning 如何只生成候选，不自裁决。

## 当前边界

本启动包不授权：

- runtime agent。
- 后端/BFF 实现。
- live DeepSeek。
- DeepSeek prompt / context / model / authority 变更。
- 新 save fields、`SAVE_FORMAT_VERSION` bump、`runFingerprint`。
- 外部 framework PoC、dependency、vendored subset、项目读取/写入、命令执行、patch artifact、git 操作。
- subagents。
- MiroFish export。
- 知识库正文、runtime canon、DeepSeek visible lore/RAG。
- 正式地点、阵营、身份、奖励、NPC 生死或 canon promotion。
- EdgeOne 自动部署。

## 当前阶段

- v2.3 completed locally。
- v2.4 前置 `Agent Framework Landscape 2026 吸收矩阵` 已落地。
- v2.0-v4.0 长期研究线已完成 Landscape 同步修正。
- v2.4 startup / a0 文档已建立。
- D-240-001 至 D-240-012 已获用户批准。
- v2.4-a1 薄 BFF / private canon / eval archive 边界设计门禁已完成。
- D-241-001 至 D-241-006 已获用户批准。
- v2.4-a2 external framework adapter / license-SBOM / self-learning 门禁已完成。
- D-242-001 至 D-242-006 已获用户批准。
- v2.4-b1 report-only 基础设施边界报告第一刀已完成。
- D-249-001 至 D-249-006 已获用户批准。
- v2.4-b2 private canon / hidden leak 风险模型报告已完成。
- D-259-001 至 D-259-006 已获用户批准。
- v2.4-b3 eval archive / replay / cost / prompt hash schema 草案已完成。
- D-269-001 至 D-269-006 已获用户批准。
- v2.4-rc 基础设施边界质量收束与 v2.5 go/no-go 已完成。
- D-270-001 至 D-270-006 已获用户批准。
- 下一步：先完成 `v2.5.0-a0` 前置批量审批与例外停机治理补丁，再开 v2.5 专家团启动会；不直接进入 backend/PoC/runtime。

## 推荐切法

1. startup/a0：长期路线修正、Landscape 同步、v2.4 范围冻结。已完成。
2. a1：薄 BFF / private canon / eval archive 边界设计门禁。已完成。
3. a2：外部 framework adapter / license-SBOM / self-learning candidate pipeline 门禁。已完成。
4. b1：report-only 基础设施边界报告第一刀，不实现后端。已完成。
5. b2：private canon / visibility / hidden leak 风险模型报告。已完成。
6. b3：eval archive / replay / cost / prompt hash schema 草案。已完成。
7. rc：v2.4 质量收束与 v2.5 go/no-go。已完成。

## 当前入口文件

- `v2.4.0-专家团启动会纪要.md`
- `v2.4.0-启动审查与范围冻结.md`
- `v2.4.0-总体开发大纲.md`
- `v2.4.0-小版本执行路线图.md`
- `v2.4.0-需求决策池.md`
- `v2.4.0-a0-长期路线修正与Landscape同步.md`
- `v2.4.0-a0-Skill同步审计记录.md`
- `v2.4.0-a1-薄BFF-private-canon-eval-archive边界设计门禁.md`
- `v2.4.0-a1-Skill同步审计记录.md`
- `v2.4.0-a2-external-framework-adapter-license-SBOM-self-learning门禁.md`
- `v2.4.0-a2-Skill同步审计记录.md`
- `v2.4.0-b1-report-only基础设施边界报告第一刀.md`
- `v2.4.0-b1-Skill同步审计记录.md`
- `v2.4.0-b2-private-canon-hidden-leak风险模型报告.md`
- `v2.4.0-b2-Skill同步审计记录.md`
- `v2.4.0-b3-eval-archive-replay-cost-prompt-hash-schema草案.md`
- `v2.4.0-b3-Skill同步审计记录.md`
- `v2.4.0-rc-基础设施边界质量收束与v2.5-go-no-go.md`
- `v2.4.0-rc-Skill同步审计记录.md`
- `v2.4.0-真相源索引.md`
- `v2.4.0-测试矩阵.md`
- `v2.4.0-MiroFish资料需求与交付协议.md`
- `v2.4.0-Git提交与推送计划.md`

## 专家团初判

v2.4 的价值不是“立刻上后端”，而是把未来后端、私有事实、外部框架、self-learning、eval archive 的边界切干净。

专家团建议下一步完成 v2.5-a0 治理补丁，然后开 v2.5 专家团启动会。启动会必须按新制度输出全版本前置授权包，不要绕过 report-only 门禁直接实现任何 backend、PoC、dependency、private canon service、eval archive service、runner、RAG 或 runtime agent。
