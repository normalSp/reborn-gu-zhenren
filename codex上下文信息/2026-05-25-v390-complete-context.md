# 2026-05-25 v3.9 complete context

分支：`codex/v390-startup-v4-safety-closure`。
版本：`v3.9.0`。
主题：`v4.0 前安全收束`。

## 当前结论

用户已批准 `D-390-001` 至 `D-390-012`，并确认 `F-390-001` 至 `F-390-012` 全部继续 `future_gate_required`。v3.9 已完成，completion commit `2c2366ec` 已推送，GitHub Actions run `26400121645` passed。

## 本轮新增

- `scripts/run-v390-pre-v4-readiness-check.mjs`
- `tests/evals/v390-pre-v4-readiness/samples.json`
- npm script：`check:v390-pre-v4-readiness`
- report：`artifacts/v3.9.0/pre-v4-readiness/2026-05-25T12-13-50.203Z/report.json`
- v3.9 a0/a1/a2/b1/b2/b3/process/rc 文档。
- 60 轮 Player Advocate：`指导大纲/v3.9.0/codex/00-总览/v3.9.0-b3-Player-Advocate-60轮记录.md`

## 验证

本地已通过：

- `npm run check:v390-pre-v4-readiness`
- `npm run check:player-advocate-gate -- 指导大纲/v3.9.0/codex/00-总览/v3.9.0-b3-Player-Advocate-60轮记录.md 60`
- `npx tsc --noEmit --pretty false`
- `npm test`
- `npm run build`
- `npm run check:runtime-assets`
- `npm run check:qingmao-assets`
- `npm run check:player-visible-copy`
- `npm run check:stale-entrypoints`
- `npm run test:e2e`
- `npm run test:e2e:long`
- `npm run check:production-preview`
- `git diff --check`

## 硬边界

v3.9 未新增 runtime/source/store/UI/prompt/save 行为；未新增 save field、migration、`SAVE_FORMAT_VERSION` bump、`runFingerprint`；未调用 live DeepSeek；未使用 MiroFish；未引入 backend/BFF/service、外部框架 PoC/dependency/subagents；未开放 L4/L5、HeavenWill/Fate、高阶战斗 runtime；未新增正式地点/阵营/身份/奖励/NPC 生死/通缉/招揽/封锁；未改 public/legal/release；未部署 EdgeOne；未自动合并 main。

## 下一步

完成提交、推送和 CI 后，建议二选一：

1. 按 `主线合并与版本分支制度补丁` 单独讨论是否合并 `main`。
2. 开 v4.0 专家团启动会，重新给 v4.0 前置授权包。
