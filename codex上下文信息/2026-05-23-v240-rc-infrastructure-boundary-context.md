# 2026-05-23 v2.4 rc 基础设施边界收束上下文

## 当前状态

- 分支：`codex/v240-rc-infrastructure-boundary-closure`
- v2.4.0 rc 已完成本地文档收束。
- D-269-001 至 D-269-006 已获用户批准并执行。
- v2.4 主线：`薄 BFF / private canon / eval archive 边界评估`。

## 已完成

- `v2.4.0-rc-基础设施边界质量收束与v2.5-go-no-go.md`
- `v2.4.0-rc-Skill同步审计记录.md`
- README、需求决策池、路线图、测试矩阵、真相源索引、Git 计划、MiroFish 协议、仪表盘、AGENTS、PROJECT-STATE、长期路线入口和 historical-index 同步。
- 外部 skill 同步：
  - `reborn-expert-council` -> `0.1.150`
  - `game-dev-text` -> `2.4.17`
  - `reverend-insanity-lore` -> `0.3.104`

## 硬边界

v2.4 rc 不授权：

- runtime/source/UI/store/prompt/save 变更。
- 新 save fields、`SAVE_FORMAT_VERSION` bump、`runFingerprint`。
- backend/BFF/private canon service/eval archive service/job queue/cloud save implementation。
- runner、service、artifact、history migration。
- live DeepSeek、prompt/context/model/authority change。
- external framework PoC、dependency、vendored subset、read-only scan、patch artifact、subagents 或外部 agent 权限。
- MiroFish export/intake、知识库正文、runtime canon、DeepSeek visible lore/RAG。
- hidden/private body、prompt body、原著正文或 MiroFish raw output。
- 正式地点、阵营、身份、奖励、NPC 生死或 canon promotion。
- EdgeOne 自动部署。

## 下一步

等待用户审批 D-270-001 至 D-270-006。建议下一步是开 v2.5 专家团启动会，主题暂定 `private canon / knowledge visibility 试验设计`，仍先做 docs/report-only/design-first。
