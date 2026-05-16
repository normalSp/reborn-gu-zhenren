# 2026-05-13 v0.9.0 锁定后专项启动上下文

## 当前状态

- 工作分支：`codex/v090-b1-world-action-protocol`
- `v0.9.0` 当前成果已锁定，release gate 自动化已通过。
- 用户已要求锁定后继续开 DeepSeek 和视觉扩展。
- 本轮已建立启动审查，并完成 V-001 内部审查素材捕获；不切正式模型、不生成新图、不改已锁定的 `v0.9.0` 本体。

## DeepSeek 专项

新增文档：`指导大纲/v0.9.0/codex/00-总览/v0.9.0-post-deepseek-model-eval-启动审查.md`
新增样本设计：`指导大纲/v0.9.0/codex/00-总览/v0.9.0-post-deepseek-model-eval-固定样本与dry-run设计.md`

核心结论：

- 历史记录：当时运行时默认是 `src/api/deepseek.ts` 的 `DEEPSEEK_DEFAULT_MODEL = deepseek-chat`。此事实已被 C-049 superseded，当前默认为 `deepseek-v4-flash`。
- 历史记录：当时评估组至少包含当前默认、`deepseek-v4-flash` 和 Pro 对照。该专项已由 C-049 收束，用户已决定不再评估其他模型。
- 用户已在后续明确决定不再评估 Pro、Reasoner 或其他模型。
- 用户已在 2026-05-13 表示 API token 消耗无所谓；成本顾虑解除。
- `scripts/run-deepseek-eval.mjs` 已升级为真实 live API runner，并在后续人审中补充 `--replay-results` 严门禁回放；`npm run eval:deepseek:live` 会消耗 API token 并写入 `artifacts/deepseek-eval/<timestamp>/report.json` 与 `results.jsonl`。
- 已设计 8 类共 40 条固定 eval 样本矩阵和 dry-run/live 模式边界；已落地 40 条固定样本、`scripts/run-deepseek-eval.mjs` 和 `npm run eval:deepseek:dry-run`。dry-run 不调用 API，只检查样本、prompt prefix hash 稳定性和风险标签。
- 后续 Flash 人审已 supersede 本文件早期 dry-run/live 结果：当前 prompt profile hash 为 `c88508ff`，estimatedPromptTokens=45146，最终候选证据为 `artifacts/deepseek-eval/2026-05-13T10-01-48-626Z/` full live 与 `artifacts/deepseek-eval/2026-05-13T10-02-48-963Z/` 严门禁回放。
- Flash 最终严门禁回放：accepted/JSON/schema/domain/boundary/quality 均 100%，retry rate 2.5%，cache hit ratio 0.8404，total tokens 41578，估算成本 0.00526468 USD。
- Pro 代表样本 live eval 已完成：报告 `artifacts/deepseek-eval/2026-05-13T09-21-57-389Z/report.json`；8 条样本 accepted 75%，失败包括 JSON 截断和空 narrative，cache hit ratio 0.4968，total tokens 9931，估算成本 0.00663236 USD。
- C-049 后运行时默认已切换为 `DEEPSEEK_DEFAULT_MODEL = deepseek-v4-flash`；用户随后明确决定不再评估其他正式模型。

## 视觉专项

新增文档：`指导大纲/v0.9.0/codex/00-总览/v0.9.0-post-visual-expansion-启动审查.md`
新增 V-001：`指导大纲/v0.9.0/codex/00-总览/v0.9.0-post-visual-expansion-V001-对外素材审查包.md`

核心结论：

- 先做 V-001 对外素材审查包，再决定是否做 bitmap 泛用底图、短录屏或蛊虫补图。
- 新图继续单张慢产，不批量生成。
- 对外素材使用、生成新 bitmap 图、第一张补图目标仍需用户后续拍板。
- V-001 已完成第一轮只读审查：当前没有素材被直接批准对外使用；第一候选是重新捕获的青茅凡战 UI 截图或短录屏。C-035 SVG 底图仅适合作为 UI 氛围层，具体人物战斗图只保留 review-only。
- 已新增 `scripts/capture-qingmao-v001-materials.mjs` 和 `npm run capture:qingmao:v001`；命令已通过，内部审查产物落到 `artifacts/v0.9.0/post-visual-expansion/V001/`。
- 捕获产物：桌面总览、月光蛊执行、白玉蛊护体、禁忌门槛失败、移动端 reduced-motion、内部审查短录屏和 manifest。移动端截图只建议内部审查，不建议直接对外。

## 同步文件

- `README.md`
- `v0.9.0-真相源索引.md`
- `v0.9.0-需求决策池.md`
- `v0.9.0-post-visual-expansion-V001-素材捕获记录.md`
- `v0.9.0-post-deepseek-model-eval-固定样本与dry-run设计.md`
- `v0.9.0-post-deepseek-model-eval-live-20260513.md`
- `指导大纲/v0.9.0/codex/01-专家团工作制/06-DeepSeek模型治理.md`

## 下一步

可以继续做不消耗 API token、不生成新图的只读审查：

- DeepSeek Flash 结果人工抽样审查已完成；后续已由用户批准 C-049 并切换默认模型，本文件的“下一步”已 superseded。
- 视觉 V-002/V-003 的 Composition Contract 或短录屏脚本草案，但正式生成图/录屏对外使用仍需用户确认。

需要用户决策后才能做：

- 正式模型切换已由 C-049 完成；其他模型评估已按用户最新决定关闭。
- 生成新 bitmap 图。
- 使用具体截图/短录屏/生成图对外发布。
