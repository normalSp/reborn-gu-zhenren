# v0.9.0 post-lock DeepSeek C-049 默认模型切换交接

日期：2026-05-13

## 当前结论

- 用户已批准 C-049。
- 运行时默认 DeepSeek 模型已从兼容别名 `deepseek-chat` 切换为显式 `deepseek-v4-flash`。
- 此次切换不改变玩法事实、存档协议、世界观边界、战斗结算或 DeepSeek 输出权限。
- DeepSeek 仍只能写叙事、候选、线索、传闻和压力；正式奖励、战斗、经济、灾劫和原著硬事实仍由本地 canon/engine 决定。

## 代码改动

- `src/api/deepseek.ts`
  - `DEEPSEEK_DEFAULT_MODEL = 'deepseek-v4-flash'`。
  - `TokenUsage` 增加 `cache_miss_tokens`。
  - API 返回显式 `prompt_cache_miss_tokens` 时直接记录；缺失时用 `prompt_tokens - prompt_cache_hit_tokens` 推导。
- `src/engine/response-pipeline.ts`
  - `PipeTokenUsage` 增加 `cacheMiss`。
  - pipeline merge 与 game log metadata 透传缓存未命中 tokens。
- `src/components/title/TitleScreen.tsx`
  - 标题页 DeepSeek 调用信息显示模型、耗时、total tokens、缓存命中/未命中、命中率和 prompt hash。
- 测试：
  - `src/api/deepseek.test.ts`
  - `src/engine/response-pipeline-token-usage.test.ts`

## 验证结果

- `npx vitest run src/api/deepseek.test.ts src/engine/response-pipeline-token-usage.test.ts`：通过，2 files / 6 tests。
- `npx tsc --noEmit --pretty false`：通过。
- `npm test`：通过，88 files / 543 tests。
- `npm run build`：通过；无 500KB+ chunk warning，仅有 Rolldown plugin timings 提示。
- `npm run eval:deepseek:dry-run`：通过，prompt hash `c88508ff`。
- 中文 smoke：真实 API 使用 `deepseek-v4-flash`，返回 `{"message":"天道已响应","status":"ok"}`，total tokens 103，prompt cache hit/miss 为 0/61。

## 文档与 skill 同步

- 新增 C-049 执行记录：`指导大纲/v0.9.0/codex/00-总览/v0.9.0-post-deepseek-model-switch-C049.md`。
- 已同步 README、真相源索引、阶段跟踪、路线图、决策记录、风险池、发布闸门、DeepSeek 模型治理、需求决策池和专家团镜像说明。
- 已更新全局 skills：
  - `reborn-expert-council` v0.1.12
  - `game-dev-text` v2.3.11
  - `reverend-insanity-lore` v0.3.10
  - `reborn-combat-motion` v0.2.9

## 后续边界

- 用户已在后续明确决定不再评估其他模型；Pro、Reasoner 或其他模型不再作为专家团主动候选。
- 生成新图和对外素材使用仍需用户逐项批准。
- 若继续推进，优先级建议为：人工手测记录、正式发布口径确认、或 post-v0.9 视觉素材审查。
