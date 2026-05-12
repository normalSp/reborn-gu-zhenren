# DeepSeek 模型治理

## 目标

把 AI 叙事从“能跑”推进到“可治理”：可见模型、tokens、缓存命中、重试成本、JSON 通过率、世界观违规率和成本基线。

## 运行时默认

- 默认模型由 `src/api/deepseek.ts` 的 `DEEPSEEK_DEFAULT_MODEL` 决定。
- 高质量/昂贵模型只用于离线评审、专家团提案或通过 eval 后的对照测试。
- UI 不写死 “DeepSeek V4 Pro”，只显示实际模型或“DeepSeek V4 系列”。

## 官方模型口径（2026-05-12）

- DeepSeek 官方价格页当前列出 `deepseek-v4-flash` 与 `deepseek-v4-pro`；两者均支持 JSON Output、Tool Calls、对话前缀续写和 1M 上下文。
- 官方说明 `deepseek-chat` 与 `deepseek-reasoner` 将于日后弃用；兼容映射分别对应 `deepseek-v4-flash` 的非思考与思考模式。
- 当前价格会变化，文档只记录治理口径，不把折扣价格写成长期事实；模型/价格调整前必须重新查看官方价格页。
- `deepseek-v4-flash` 可作为成本优化候选，但正式游戏叙事不能只因价格更低而直接切换。

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

- `src/api/deepseek.ts`：从 API `usage.prompt_cache_hit_tokens` 读取缓存命中 tokens，返回 `model`、`temperature`、`prompt_prefix_hash`、`elapsedMs` 和 `retries`。
- `src/engine/response-pipeline.ts`：把单次和重试调用的 tokens、缓存命中率、模型、temperature、耗时和 prompt 前缀 hash 合并到 `PipeResult.tokenUsage`，并写入游戏日志 metadata。
- `src/components/title/TitleScreen.tsx`：API 测试入口显示模型、耗时、总 tokens、缓存命中 tokens 和缓存命中率。
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

## 便宜模型策略

便宜模型可用于：

- 专家团候选需求草稿。
- UI 文案草稿。
- 非运行时分析和摘要。
- 固定 eval 样本的低成本预筛。

正式游戏叙事必须经过 schema、世界观闸门、本地真相源和回归测试后才能切换模型。

切换评估必须比较：

- JSON 首轮通过率与 normalize + Zod 通过率。
- L3/L4 世界观违规率，尤其是仙蛊、宿命蛊、永生、宝黄天、尊者和正式奖励边界。
- 同一 eval 样本的叙事可读性、候选质量、线索可解释性和回流文本稳定性。
- `prompt_cache_hit_tokens`、`prompt_cache_miss_tokens`、输出 tokens、重试 tokens 与单位有效叙事成本。
- 同版本同模式下 `prompt prefix hash` 是否稳定；如果 hash 频繁变化，先修 prompt 分层，不急着换模型。
