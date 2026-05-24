# 2026-05-24 v3.3 complete F-300 reopen decision context

## 当前状态

- 分支：`codex/v330-startup-f300-reopen-decision`
- 当前完成里程碑：`v3.3.0` F-300 reopen 决策包
- 当前入口：`指导大纲/v3.3.0/codex/00-总览/README.md`
- v3.3 状态：completed locally；D-330 approved；F-330 kept `future_gate_required`

## 本轮完成

- 已确认 v3.2 准入证据允许开 v3.3：`v33DecisionPackageReady=true`，`runtimeImplementationApproved=false`。
- 已记录用户批准 D-330-001 至 D-330-012，F-330-001 至 F-330-012 全部继续保持 `future_gate_required`。
- 已完成 v3.3 expert-council 文档包：
  - 专家团启动会纪要
  - D330 决策记录
  - 启动审查与范围冻结
  - 总体开发大纲
  - 小版本执行路线图
  - 前置授权包
  - 例外停机清单
  - 需求决策池
  - 测试矩阵
  - 真相源索引
  - MiroFish 资料需求与交付协议
  - Git 提交与推送计划
  - startup Skill 同步审计记录
  - a0 v3.0-v3.2 证据复盘
  - a1 最小 runtime first cut 选项分析
  - a2 future gate bundle
  - b1 F-300 reopen report-only 决策矩阵
  - b2 PA/live/drift/rollback/old-save 测试档位
  - b3 v3.4 路线分叉建议
  - process-1 / process-2
  - rc F-300 reopen 最终决策包
  - rc Skill 同步审计记录
  - rc 质量收束记录
- 已同步 `指导大纲/项目仪表盘.md`、`AGENTS.md`、`PROJECT-STATE.md`。
- 已同步本机 skills：`reborn-expert-council`、`game-dev-text`、`reverend-insanity-lore`。

## 当前结论

- `f300ReopenDecisionPackageComplete=true`
- `runtimeImplementationApproved=false`
- 下一步候选：开 v3.4 专家团启动会，让用户在继续 hardening、单独批准最小 transient proposal-only 第一刀、继续 defer 之间拍板。

v3.3 不替 v3.4 授权；若未来选择最小 runtime 第一刀，必须新开审批包并单独打开 F-330-001 / F-300-001。

## 绝对边界

当前未授权：

- runtime agent implementation
- runtime/source/UI/store/prompt/save changes
- new save fields / `SAVE_FORMAT_VERSION` bump / `runFingerprint`
- live DeepSeek / prompt-context-model-authority changes / DeepSeek visible lore-RAG
- backend/BFF/service/job queue/eval archive/cloud save
- MiroFish export/intake / real original facts / named NPC / hidden-adjacent / formal lore
- knowledge-index body / runtime canon / hidden-private body / prompt body archival
- external framework PoC/dependency/read-only scan/vendored subset/patch artifact/subagents
- L4/L5 runtime / HeavenWill-Fate runtime adjudication / original key figure runtime agent
- formal location/faction/identity/reward/NPC life-death
- public wording / legal-release boundary / EdgeOne
