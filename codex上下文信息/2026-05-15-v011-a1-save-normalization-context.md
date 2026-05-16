# 2026-05-15 v0.11.0-a1 第一轮交接

## 当前状态

- `v0.11.0` 已进入开发。
- `v0.11.0-a0` 玩家可见旧债清理已完成。
- `v0.11.0-a1` 架构与存档加固第一轮已完成。
- 已完成：存档归一化第一刀、response pipeline 可观测第一刀、storage key 统一第一刀、专家团门禁清单。
- 进入 `v0.11.0-a2` 前需要用户决策，因为 a2 会触及活世界持久化状态，可能需要 `SAVE_FORMAT_VERSION`。
- `SAVE_FORMAT_VERSION` 保持 `21`。

## 本轮完成

- `src/store/index.ts`
  - 新增 `normalizePersistedGameState()`。
  - `migrateSave()`、`persist.migrate()`、`persist.merge()` 和手动读档落地路径复用共享归一化。
  - 统一补旧档默认值、party/squad/cultivation/story/ending/scene/inheritance/training ground 子状态和兼容 flags 镜像。
- `src/store/save-normalization.test.ts`
  - 覆盖共享归一化默认值。
  - 覆盖 `formatVersion 21` 文件导入仍走同一路径。
- `src/engine/response-pipeline.ts`
  - 新增 `buildPipelineWarning()` 与 `pipelineWarn()`。
  - 将章节目标、成就、遭遇、combat-router、日志写入、死亡/起源等可选路径的静默失败改成脱敏 warning。
- `src/engine/response-pipeline-token-usage.test.ts`
  - 覆盖 warning 脱敏和非阻塞行为。
- `src/store/storageKeys.ts`
  - 集中登记主存档、成就、DeepSeek key、字号、声音、起源、新手引导、诊断日志和手动槽位前缀。
- `src/store/storageKeys.test.ts`
  - 锁定旧 key 字符串不变。
- 已迁移 localStorage 使用点：DeepSeek API、store 主存档/成就恢复、成就/起源/声音/教程 slice、手动存档 UI、设置 UI、e2e harness、诊断日志。
- `指导大纲/v0.11.0/codex/00-总览/v0.11.0-a1-专家团门禁清单.md`
  - 固定 runtime、存档、DeepSeek、原著/IF、世界意图、测试和完成门禁。
- 文档同步：
  - `指导大纲/v0.11.0/codex/00-总览/v0.11.0-a1-存档归一化第一刀.md`
  - `README.md`
  - `v0.11.0-小版本执行路线图.md`
  - `v0.11.0-a1-架构与存档加固专项草案.md`
  - `v0.11.0-a1-response-pipeline可观测第一刀.md`
  - `v0.11.0-a1-storage-key统一第一刀.md`
  - `v0.11.0-a1-专家团门禁清单.md`
  - `.codex/skills/reborn-expert-council/references/PROJECT-STATE.md`
- `.learnings/LEARNINGS.md` 增加“可选系统失败要低噪声可观测”和“localStorage key 先注册后使用”当前有效经验。
- 全局 Skills 同步：
  - `reborn-expert-council`
  - `game-dev-text`
  - `reverend-insanity-lore`

## 验证

- `npm test -- src/store/save-normalization.test.ts src/store/slices/cultivationSlice.test.ts src/store/slices/trainingGroundSlice.test.ts`：通过，3 files / 13 tests。
- `npm test -- src/engine/response-pipeline-token-usage.test.ts src/store/save-normalization.test.ts`：通过，2 files / 6 tests。
- `npm test -- src/store/storageKeys.test.ts src/api/deepseek.test.ts src/store/save-normalization.test.ts src/store/slices/achievement-v070.test.ts src/store/slices/trainingGroundSlice.test.ts`：通过，5 files / 30 tests。
- `npx tsc --noEmit --pretty false`：通过。
- `npm run check:player-visible-copy`：通过，210 files scanned。
- `npm test`：通过，97 files / 585 tests。
- `npm run build`：通过，无 500KB+ chunk warning。
- `npm run check:production-preview`：通过，标题页可渲染，未复现生产启动黑屏。

## 边界

- 未新增持久化字段。
- 未提升 `SAVE_FORMAT_VERSION`。
- 未改 DeepSeek 模型、prompt、token 或 lore 权限。
- 未把可选 pipeline 失败升级为玩家阻断；warning 会脱敏 prompt/API key/token/system/user/messages。
- 未改任何 localStorage key 字符串，未迁移或删除旧数据。
- 未拆目录、未重命名版本前缀、未创建 Sub-Agent TOML。

## 下一步建议

停止自动进入 `v0.11.0-a2`，等待用户拍板。

建议用户决策：

1. 是否批准 `v0.11.0-a2` 建立活世界状态协议。
2. 若 a2 新增持久化字段，是否批准 `SAVE_FORMAT_VERSION` 从 `21` 升级到 `22`。
3. a2 第一刀是先做“设计门禁输出文档 + 字段表 + 测试矩阵”，还是直接做最小运行时状态骨架。
