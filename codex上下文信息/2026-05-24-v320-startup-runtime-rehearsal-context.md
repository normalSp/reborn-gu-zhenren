# 2026-05-24 v3.2 runtime rehearsal completion context

## 当前状态

- 分支：`codex/v320-startup-runtime-rehearsal`
- 当前完成里程碑：`v3.2.0` offline / report-only runtime rehearsal
- 当前入口：`指导大纲/v3.2.0/codex/00-总览/README.md`
- v3.2 状态：completed locally；D-320 approved/executed；F-320 全部保持 `future_gate_required`

## 本轮完成

- 已确认 v3.1 准入证据允许开 v3.2：`v32RehearsalAdmissible=true`，`runtimeImplementationApproved=false`。
- 已完成 v3.2 expert-council 文档与门禁包：
  - 专家团启动会纪要
  - D-320 决策记录
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
  - a0/a1/a2 设计门禁
  - b1/b2/b3 report-only rehearsal 记录
  - process-1/process-2 复核
  - rc Skill 同步审计与质量收束记录
- 已实现自有零依赖 report-only checker：
  - `scripts/run-v320-runtime-rehearsal-check.mjs`
  - `tests/evals/v320-runtime-rehearsal/samples.json`
  - `npm run check:v320-runtime-rehearsal`
  - report：`artifacts/v3.2.0/runtime-rehearsal/2026-05-24T13-17-44-101Z/report.json`
- checker 结果：26/26 schema valid；decisions=`rehearsal_ok=5/manual_review_required=2/future_gate_required=7/rejected_violation=12`；P0/P1 falseNegative=0/0；`v33DecisionPackageReady=true`；`runtimeImplementationApproved=false`。
- 已同步 `指导大纲/项目仪表盘.md`、`AGENTS.md`、`PROJECT-STATE.md`。
- 已同步本机 skills：`reborn-expert-council`、`game-dev-text`、`reverend-insanity-lore`。

## 下一步

v3.2 已完成。下一步如果继续，应开 `v3.3` 专家团启动会 / F-300 reopen 决策包，而不是直接进入 runtime agent implementation。

## 绝对边界

v3.2 完成后仍未授权：

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
