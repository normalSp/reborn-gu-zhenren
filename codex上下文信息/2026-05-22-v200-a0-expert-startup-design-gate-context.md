# 2026-05-22 v2.0-a0 expert startup/design gate context

分支：`codex/v200-a0-expert-startup-design-gate`

## 本次目标

用户要求开启 v2.0 专家启动会/设计门禁。

## 已完成

- 建立 `指导大纲/v2.0.0/codex/00-总览/`。
- 写入 v2.0 README、专家团启动会、启动审查、总体大纲、路线图、需求决策池。
- 写入 a0 治理补丁与 a1 第一核心区域/save-format 设计门禁。
- 写入 v2.0 真相源索引、测试矩阵、MiroFish 协议、Git 计划。
- 更新项目仪表盘、PROJECT-STATE、AGENTS。
- 同步外部 skill：reborn-expert-council、game-dev-text、reverend-insanity-lore。

## 当前口径

v2.0 建议主线：

`第一个区域活世界：南疆早期低阶外缘小区域`

当前只是 docs/design gate，不授权 runtime。

## 需要用户决策

等待审批：

- D-200-001 至 D-200-008。
- D-201-001 至 D-201-012。

专家团建议若要进入 v2.0 开发，一次性批准 D-200/D-201 全部；其中 D-201-002 / D-201-003 是 v25 + 最小 `regionalEventLedger` runtime 的关键。

## 硬边界

- 不改 runtime。
- 不新增 save 字段。
- 不 bump `SAVE_FORMAT_VERSION`。
- 不改 DeepSeek prompt/context/model/authority。
- 不请求新 MiroFish export。
- 不调用 live DeepSeek。
- 不启用子代理。
- 不启用 BFF/backend。
- 不部署 EdgeOne。

## 下一步

用户批准后，按 D-201 进入 a1 后续或 b1 runtime 设计；未批准前不得自动写 runtime。
