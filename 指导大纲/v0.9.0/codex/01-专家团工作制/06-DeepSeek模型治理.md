# DeepSeek 模型治理

## 目标

把 AI 叙事从“能跑”推进到“可治理”：可见模型、tokens、缓存命中、重试成本、JSON 通过率、世界观违规率和成本基线。

## 运行时默认

- 默认模型由 `src/api/deepseek.ts` 的 `DEEPSEEK_DEFAULT_MODEL` 决定。
- 当前默认模型：`deepseek-v4-flash`。用户已在 C-049 批准此切换，依据为 Flash full live + 严门禁回放 100% 候选证据。
- 用户已明确决定不再评估其他模型；专家团不得主动提出 Pro、Reasoner 或其他模型切换专项。
- UI 不写死 “DeepSeek V4 Pro”，只显示实际模型或“DeepSeek V4 系列”。
- 只有用户未来主动撤销该决定时，才重新讨论模型评估。

## 官方模型口径（2026-05-12）

- DeepSeek 官方价格页当前列出 `deepseek-v4-flash` 与 `deepseek-v4-pro`；两者均支持 JSON Output、Tool Calls、对话前缀续写和 1M 上下文。
- 官方说明 `deepseek-chat` 与 `deepseek-reasoner` 将于日后弃用；兼容映射分别对应 `deepseek-v4-flash` 的非思考与思考模式。
- 当前价格会变化，文档只记录治理口径，不把折扣价格写成长期事实；模型/价格调整前必须重新查看官方价格页。
- `deepseek-v4-flash` 已在 C-049 后成为正式运行时默认模型；v0.9.0 不再评估或切换其他模型。

## 必须观测

- model
- temperature
- prompt tokens
- completion tokens
- total tokens
- prompt cache hit tokens
- prompt cache miss tokens（如果 API 返回）
- cache hit ratio
- retry tokens
- AI call count
- elapsed ms
- prompt prefix hash
- Zod/L3/L4/奖励校验失败原因

## 当前代码观测入口

- `src/api/deepseek.ts`：从 API `usage.prompt_cache_hit_tokens` 与 `usage.prompt_cache_miss_tokens` 读取缓存命中/未命中 tokens；缺少 miss 字段时用 `prompt_tokens - hit` 推导；返回 `model`、`temperature`、`prompt_prefix_hash`、`elapsedMs` 和 `retries`。
- `src/engine/response-pipeline.ts`：把单次和重试调用的 tokens、缓存命中/未命中、缓存命中率、模型、temperature、耗时和 prompt 前缀 hash 合并到 `PipeResult.tokenUsage`，并写入游戏日志 metadata。
- `src/components/title/TitleScreen.tsx`：API 测试入口显示模型、耗时、总 tokens、缓存命中 tokens、缓存未命中 tokens、缓存命中率和 prompt 前缀 hash。
- b1 不得删除这些字段；如果新增 UI 成本面板，必须从同一组 telemetry 字段读取，不得重新估算。

## Prompt 分层

- System prompt 保持稳定前缀，承载身份、格式、硬边界和长期规则。
- 玩家状态、近期事件、动态 NPC、战斗状态、选择和上下文进入 user message。
- 如果 system prompt 因 store 内容变化而改变，必须记录原因，并由 DeepSeek/模型调优专家复核缓存收益。

## 质量闸门

- JSON 首轮通过率目标：>= 95%。
- normalize + Zod 通过率目标：>= 99%。
- L3/L4 critical 违规率目标：< 3%。
- 未登记奖励被 `dropped/rumorOnly` 的比例必须被记录并逐版本下降。
- 没有真实 usage 数据时，不得宣称缓存命中率。

## Live Eval 当前结果（2026-05-13）

记录：`指导大纲/v0.9.0/codex/00-总览/v0.9.0-post-deepseek-model-eval-live-20260513.md`

- `scripts/run-deepseek-eval.mjs` 已加入严门禁与 `--replay-results`：可用当前 schema/质量规则重判历史 live 输出，不额外消耗 API token。
- 人工审查曾发现旧门禁会漏掉空叙事、数组类型漂移、元石/空窍术语错位、凡人宝黄天访问路径、地灵/五转主人混写和模型泄漏数值成本；这些已转为自动质量 flag。
- 当前 `v090-runtime-json` prompt prefix hash：`c88508ff`。
- `deepseek-v4-flash` 最终候选证据为 `2026-05-13T10-01-48-626Z` full live + `2026-05-13T10-02-48-963Z` 严门禁回放：40 条固定样本 accepted 100%，JSON/schema/domain/boundary/quality 均 100%，retry rate 2.5%，cache hit ratio 0.8404，total tokens 41578，估算成本 0.00526468 USD，平均 6001 ms。
- `deepseek-v4-pro` 8 条代表样本仍为 75%，失败包括 JSON 截断和空 narrative，cache hit ratio 0.4968，total tokens 9931，估算成本 0.00663236 USD，平均 28494 ms。
- C-049 已完成：运行时默认模型已切换为 `deepseek-v4-flash`；标题页和 pipeline telemetry 均可看到缓存命中/未命中与 prompt hash。Pro 代表样本只保留为历史对照，不再继续评估。

## 便宜模型策略

便宜模型可用于：

- 专家团候选需求草稿。
- UI 文案草稿。
- 非运行时分析和摘要。
- 固定 eval 样本的低成本预筛。

v0.9.0 正式游戏叙事模型已冻结为 `deepseek-v4-flash`。除非用户未来主动撤销“不再评估其他模型”的决定，否则不再开展换模评估。

切换评估必须比较：

- JSON 首轮通过率与 normalize + Zod 通过率。
- L3/L4 世界观违规率，尤其是仙蛊、宿命蛊、永生、宝黄天、尊者和正式奖励边界。
- 同一 eval 样本的叙事可读性、候选质量、线索可解释性和回流文本稳定性。
- `prompt_cache_hit_tokens`、`prompt_cache_miss_tokens`、输出 tokens、重试 tokens 与单位有效叙事成本。
- 同版本同模式下 `prompt prefix hash` 是否稳定；如果 hash 频繁变化，先修 prompt 分层，不急着换模型。
