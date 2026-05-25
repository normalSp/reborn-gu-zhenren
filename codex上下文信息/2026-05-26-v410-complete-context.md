# 2026-05-26 v4.1 complete context

分支：`codex/v410-startup-auto-theater-contract-hardening`

## 当前目标

完成 `v4.1.0`：Auto-Theater Contract / Schema / Checker 加固。

## 用户批准

- `D-410-001` 至 `D-410-012`：全部批准并执行。
- `F-410-001` 至 `F-410-012`：全部继续 `future_gate_required`。

## 已完成

- a0：冻结 `v410_a0_v40_evidence_review_scope_lock_v1`。
- a1：冻结 `v410_a1_auto_theater_contract_v1`。
- a2：冻结 `v410_a2_expression_authority_worldcore_evidence_gate_v1`。
- b1：新增 report-only checker：
  - `scripts/run-v410-auto-theater-contract-check.mjs`
  - `tests/evals/v410-auto-theater-contract/samples.json`
  - `npm run check:v410-auto-theater-contract`
  - `artifacts/v4.1.0/auto-theater-contract/2026-05-25T20-08-20.038Z/report.json`
- b2：negative fixtures 与 240 轮 deterministic contract hardening。
- b3：50 轮 Player Advocate；live DeepSeek：否。
- process-2：长线漂移与知识边界复核；MiroFish `not_needed`。
- rc：同步 `AGENTS.md`、`PROJECT-STATE.md`、`指导大纲/项目仪表盘.md`、skill override 与上下文记录。

## 核心结果

`check:v410-auto-theater-contract`：

- sampleCount：35
- schemaValid：35
- decisions：13 ready / 8 future gate / 14 blocked
- missingRequiredFamilies：0
- positiveP0：0
- negativeFalseNegative：0
- resultMismatch：0
- deterministicRounds：240
- acceptedForGate：true

Player Advocate：

- 50/50 轮通过
- understandingRate：100%
- confused：0
- live DeepSeek：否

## 本地验证

- `npm run check:v410-auto-theater-contract`
- `npm run check:player-advocate-gate -- 指导大纲/v4.1.0/codex/00-总览/v4.1.0-b3-Player-Advocate-50轮记录.md 50`
- `npx tsc --noEmit --pretty false`
- `npm test -- --reporter=dot`
- `npm run build`
- `npm run check:runtime-assets`
- `npm run check:qingmao-assets`
- `npm run check:player-visible-copy`
- `npm run check:stale-entrypoints`
- `npm run test:e2e`
- `npm run test:e2e:long`
- `npm run check:production-preview`
- `git diff --check`

## 远端验证

- 分支：`codex/v410-startup-auto-theater-contract-hardening`
- 状态：completion branch 已推送，GitHub Actions 已检查通过。
- 具体 commit / run id 以 git history、GitHub Actions 和最终答复为准。

## 仍未授权

v4.1 不授权 Auto-Theater runtime、theater UI、高阶战斗 runtime、凡阶战斗迁移、纯自走棋 runtime、Auto-Theater 素材生成、save field、`SAVE_FORMAT_VERSION` bump、`runFingerprint`、live DeepSeek、DeepSeek prompt/context/model/authority 扩大、DeepSeek visible lore/RAG、MiroFish export/intake、backend/BFF/service、external framework PoC/dependency/subagents/read-only scan/patch artifact、persistent agent state、L4/L5 runtime、HeavenWill/Fate runtime 裁决、原著关键人物 agent、正式地点/阵营/身份/奖励/NPC 生死/通缉/招揽/封锁、knowledge-index body、runtime canon、public/legal/EdgeOne、main auto-merge。

## 下一步建议

可开 `v4.2` 专家团启动会，优先讨论 Auto-Theater Lite / 凡阶战斗映射设计门禁。v4.2 不应默认迁移 runtime；如果要迁移现有凡阶战斗，必须重新给出 save/runtime/UI/PA/old-save/live/rollback 授权包。
