# 2026-05-13 v0.9.0 post-lock DeepSeek Flash 人审上下文

## 当前状态

- 工作分支：`codex/v090-b1-world-action-protocol`
- `v0.9.0` 当前成果仍保持锁定；本轮没有切换运行时默认模型。
- 本轮完成 Flash live eval 人工审查、严门禁补强、最终 live/replay 证据整理和文档同步。

## 代码变化

- `scripts/run-deepseek-eval.mjs`
  - 新增 `--replay-results`，可用当前 eval 规则重判历史 `results.jsonl`，不消耗 API token。
  - 新增严格 eval schema：`narrative` 必须非空，候选/传闻/压力/安全备注必须是字符串数组。
  - 新增人工审查转化而来的质量 flag：元石/空窍术语错位、精炼元石、`immortal Gu Master`、凡人宝黄天访问路径、地灵/五转主人混写、模型泄漏数值成本等。
  - prompt profile `v090-runtime-json` 已补充顶层字段、数组类型、真元/元石、宝黄天、地灵/福地和数值泄漏边界。

## Eval 证据

保留的报告目录：

- `artifacts/deepseek-eval/2026-05-13T10-01-48-626Z/`：Flash 40 条完整 live API 输出，prompt hash `c88508ff`。
- `artifacts/deepseek-eval/2026-05-13T10-02-48-963Z/`：同一批 Flash live 输出的严门禁回放，最终候选证据。
- `artifacts/deepseek-eval/2026-05-13T09-21-57-389Z/`：Pro 8 条代表样本对照。

Flash 最终严门禁回放摘要：

- sampleCount 40
- acceptedRate 100%
- JSON/schema/domain/boundary/quality 均 100%
- retry rate 2.5%，retries 1
- prompt tokens 24979，completion tokens 16599，total tokens 41578
- prompt_cache_hit_tokens 20992，prompt_cache_miss_tokens 3987
- cacheHitRatio 0.8404
- estimatedCostUsd 0.00526468

Pro 代表样本仍为 75%，暂作离线对照。

## 人工审查结论

旧门禁曾漏掉以下问题，本轮已转成自动门禁：

- 白玉蛊护体把元石写成空窍内能量。
- `pressure`/`safety_notes` 类型漂移。
- 空叙事。
- 凡人宝黄天访问路径。
- 地灵与五转蛊师主人混写。
- 灾劫候选泄漏 AP/元石/真元具体数值。

最终 Flash 样本抽看结果：

- 青茅凡战、宝黄天、传承/福地、灾劫、对抗诱导样本没有发现新的硬越界。
- `mustContain` 仍只是提示项，72.5% 不作为阻断。
- 本文件记录的是 C-049 批准前的人审状态；用户随后已批准 C-049，当前正式运行时默认模型为 `deepseek-v4-flash`。

## 文档同步

- `指导大纲/v0.9.0/codex/00-总览/v0.9.0-post-deepseek-model-eval-live-20260513.md`
- `指导大纲/v0.9.0/codex/01-专家团工作制/06-DeepSeek模型治理.md`
- `指导大纲/v0.9.0/codex/00-总览/v0.9.0-真相源索引.md`
- `指导大纲/v0.9.0/codex/00-总览/v0.9.0-需求决策池.md`
- `指导大纲/v0.9.0/codex/00-总览/README.md`

## 下一步决策点

需要用户拍板后才能继续：

- 用户已批准 C-049：运行时默认模型已从 `deepseek-chat` 切为显式 `deepseek-v4-flash`。

若批准，下一刀只做配置、单测、构建、dry-run 和一次中文运行时 smoke；不新增玩法、存档字段或视觉资产。
