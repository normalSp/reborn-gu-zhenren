# 2026-05-22 v1.9-a2 MiroFish v2 区域活世界预备 intake 交接

## 当前状态

- 分支：`codex/v190-a2-mirofish-v2-region-life-intake`
- 用户已批准：D-190-001 至 D-190-012、D-191-001 至 D-191-012。
- 用户已确认：v2.0-v4.0 分层 Agent 与世界内核长期研究线作为当前长期架构基线。
- 用户已批准：进入 `v1.9.0-a2-MiroFish-v2区域活世界预备topic-slice-intake.md`。

## a2 完成内容

已完成 MiroFish 双仓流水线：

1. RebornG request。
2. MiroFish blueprint。
3. MiroFish quote-redacted export。
4. MiroFish report。
5. MiroFish handoff。
6. RebornG intake review。
7. RebornG 规则草案。
8. 测试矩阵同步。

Topic：

`southern_border_low_rank_region_life_v2_prelude_slice`

导出摘要：

- totalItems：13
- sourcePointers：13
- quoteLikeKeys：0
- blocked：0
- coverage：外缘边界、商队接触、市场/补给、临时落脚、路障冲突、公开观察、事件账本风险、同开局差异风险、正式凭证词风险。

## 新增/更新核心文件

- `指导大纲/vMiroFish/requests/v1.9.0/2026-05-22-v190-southern-border-low-rank-region-life-v2-prelude.md`
- `指导大纲/vMiroFish/requests/v1.9.0/2026-05-22-v190-southern-border-low-rank-region-life-v2-prelude-blueprint.json`
- `指导大纲/vMiroFish/v1.9.0/exports/v190_southern_border_low_rank_region_life_v2_prelude_slice_export_ready.json`
- `指导大纲/vMiroFish/v1.9.0/exports/v190_southern_border_low_rank_region_life_v2_prelude_slice_report.json`
- `指导大纲/vMiroFish/v1.9.0/exports/v190_southern_border_low_rank_region_life_v2_prelude_slice_handoff.md`
- `指导大纲/vMiroFish/intake-reviews/v1.9.0/2026-05-22-v190-southern-border-low-rank-region-life-v2-prelude-intake-review.md`
- `指导大纲/v1.9.0/codex/00-总览/v1.9.0-a2-MiroFish-v2区域活世界预备topic-slice-intake.md`
- `指导大纲/v1.9.0/codex/00-总览/v1.9.0-a2-v2区域活世界预备规则草案.md`

已同步：

- `AGENTS.md`
- `.codex/skills/reborn-expert-council/references/PROJECT-STATE.md`
- `指导大纲/项目仪表盘.md`
- `指导大纲/v1.9.0/codex/00-总览/README.md`
- v1.9 路线图、总体大纲、需求池、真相源、测试矩阵、MiroFish 协议、Git 计划、readiness 草案
- 本机 skills：`reborn-expert-council`、`game-dev-text`、`reverend-insanity-lore`、`mirofish-reborng-export`、`reborn-combat-motion`

## 边界

a2 只允许：

- `candidate_pool`
- `rule_draft`
- `test_sample`
- `deferred`

a2 不授权：

- runtime。
- `SAVE_FORMAT_VERSION = 25`。
- `regionalEventLedger`。
- `runFingerprint`。
- `regionalLifeState` / `areaLivingState`。
- `identityRouteState` / `professionState`。
- DeepSeek visible full-book summary / RAG。
- runtime canon 或 knowledge-index 正文导入。
- 正式地点、阵营、奖励、NPC 生死。
- 完整南疆、完整商家城。
- 正式商队成员、散修势力、护卫组织、职业/身份系统。
- BFF/backend、子代理、public wording、EdgeOne。

## live DeepSeek

- 是否调用 live DeepSeek：否。
- 原因：a2 是 request/export/intake/rule/test 文档门禁，不触碰 runtime prompt、DeepSeek context 或玩家可见叙事。

## 下一步

不是默认堆 runtime。下一步先复核：

- b1 `v2 readiness projection/report 第一刀` 是否足够。
- 是否保持 report-only / pure helper / 无 UI tab。
- 是否需要在进入 runtime 前追加 `v1.9.0-a3-v2-readiness-report设计门禁.md`。

若进入 b1，仍需保持：

- `SAVE_FORMAT_VERSION = 24`。
- 不新增持久字段。
- 不让 DeepSeek 看到 MiroFish 派生摘要。
- 不开放正式地点、阵营、奖励、NPC 生死。
- 不启用 BFF/backend、子代理或 EdgeOne。

## 验证建议

已建议运行：

- `git diff --check`
- `rg -n "v1.9.0-a2|southern_border_low_rank_region_life_v2_prelude_slice|V19-A2-SLICE" 指导大纲/v1.9.0/codex/00-总览 指导大纲/vMiroFish AGENTS.md .codex/skills/reborn-expert-council/references/PROJECT-STATE.md`
- `rg -n "quote|excerpt|verbatim|rawText|sourceText|originalText" 指导大纲/vMiroFish/v1.9.0/exports/v190_southern_border_low_rank_region_life_v2_prelude_slice_export_ready.json`
- `npm run check:mirofish-dual-repo-pipeline -- --target-version=v1.9.0 --topic=southern_border_low_rank_region_life_v2_prelude_slice --stage=complete`

本阶段不运行 runtime 测试，因为没有源码、UI、prompt、存档或后端变更。
