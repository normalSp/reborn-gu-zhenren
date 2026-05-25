# 2026-05-25 v3.9 startup context

当前分支：`codex/v390-startup-v4-safety-closure`。

用户要求：开 `v3.9` 专家团启动会。

已做：

- 从 v3.8 完成态创建 v3.9 语义分支。
- 建立 v3.9 startup docs：`指导大纲/v3.9.0/codex/00-总览/`。
- v3.9 建议主线：`v4.0 前安全收束`。
- 当前 D-390 仍为 `pending_user_decision`。
- F-390 全部建议保持 `future_gate_required`。

硬边界：

- 不新增 save field / save-format bump / `runFingerprint`。
- 不接入 live DeepSeek。
- 不做 MiroFish export/intake。
- 不建 backend/BFF。
- 不引入外部 framework PoC/dependency/subagent/read-only scan/patch artifact。
- 不开放 persistent agent state、L4/L5、HeavenWill/Fate runtime、高阶战斗 runtime、正式地点/阵营/身份/奖励/NPC 生死/通缉/招揽/封锁。
- 不自动合并 `main`，不部署 EdgeOne。

下一步：

- 等用户审批 `D-390-001` 至 `D-390-012`。
- 建议用户同时确认 `F-390-001` 至 `F-390-012` 全部继续 `future_gate_required`。
- 若用户批准，可进入 v3.9 开发。
- 若用户修改路线，先更新前置授权包和例外停机清单。
