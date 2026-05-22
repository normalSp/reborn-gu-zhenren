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

## 用户决策更新

用户已批准：

- D-200-001 至 D-200-008。
- D-201-001 至 D-201-012。

当前结论：

- v2.0 第一核心区域正式锁为 `南疆早期低阶外缘小区域`。
- b1 可做 `SAVE_FORMAT_VERSION = 25` + 单一最小 `regionalEventLedger` runtime 第一刀。
- b1 必须同一刀完成 migration/defaults/tests/rollback。
- `runFingerprint`、正式区域状态、正式身份状态继续暂缓。
- DeepSeek RAG、BFF/backend、子代理、formal outcome、EdgeOne 继续禁止。

## 原待决项记录

已不再待决：

- D-200-001 至 D-200-008。
- D-201-001 至 D-201-012。

其中 D-201-002 / D-201-003 是 v25 + 最小 `regionalEventLedger` runtime 的关键。

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

下一步建议进入 `v2.0.0-b1-regionalEventLedger与WorldCore第一刀`，但需先切 b1 语义分支并保持上述边界。
