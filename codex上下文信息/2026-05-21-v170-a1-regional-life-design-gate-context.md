# 2026-05-21 v1.7-a1 区域活世界设计门禁交接

状态：a1 design gate active draft。
分支：`codex/v170-a1-regional-life-design-gate`。
基线：`codex/v170-player-advocate-live-probe-policy`。

## 用户输入

- 用户批准 D-170-001 至 D-170-010。
- 用户批准把“同开局可重玩差异度”作为 v1.7-a1 正式评估项，并要求兼顾长期方向和开发路径。

## 已落地

- 新增 `指导大纲/v1.7.0/codex/00-总览/v1.7.0-a1-区域活世界topic-slice与save-format设计门禁.md`。
- 更新 v1.7 README、总体大纲、小版本路线图、需求决策池、测试矩阵、MiroFish 协议、真相源索引、Git 计划和 a0 记录。
- 更新长期路线，把 v1.7 从原先的 public-test/BFF 候选调整为低阶区域活世界纵切，并把 public-test/BFF 保留为 process sidecar。
- 更新项目仪表盘、PROJECT-STATE、AGENTS。
- 同步 skills：`reborn-expert-council`、`game-dev-text`、`reverend-insanity-lore`、`mirofish-reborng-export`；`reborn-combat-motion` 暂判 `no_update_needed`。

## a1 推荐口径

- 推荐 topic-slice：`southern_border_low_rank_outer_edge_life_slice`。
- b1 若获批，保持 `SAVE_FORMAT_VERSION = 24`。
- b1 不新增 `regionalLifeState` / `areaLivingState`。
- per-save `runFingerprint` / `regionalEventLedger` 放入 v1.8-v2.0 future pool，除非用户后续单独批准。
- MiroFish a1 为 `preferred`；a2 formal topic-slice intake 升级 `blocking`。
- 同开局差异度应来自本地公开压力、event/pressure deck、失败推进和 DeepSeek 叙事表达，不来自正式事实漂移。

## D-171 待用户拍板

- D-171-001：确认 topic-slice。
- D-171-002：保持 v24、不新增区域活世界持久字段。
- D-171-003：b1 projection-first helper。
- D-171-004：a2 MiroFish topic-slice blocking intake。
- D-171-005：同开局可重玩差异度测试门禁，不直接新增持久随机字段。
- D-171-006：b1/process-2 前评估最小 `seeded_runtime_probe`。
- D-171-007：继续禁止 DeepSeek RAG/visible summary/model switch/new authority。
- D-171-008：public-test/BFF 保持 process-1 评估。
- D-171-009：per-save run fingerprint / event ledger 放入 v1.8-v2.0 future pool。
- D-171-010：D-171 批准后进入 `v1.7.0-a2-MiroFish-区域活世界topic-slice-intake.md`。

## 硬边界

本次只做文档门禁，不改 runtime、不改 save、无 DeepSeek prompt/context/model/authority 变更、无 MiroFish 基础包导入、无知识库批量内容、无 public release wording、无 EdgeOne 部署。
