# MiroFish 全书基础包（RebornG intake 用）

范围：`ri_lw_ch_0001` 至 `ri_lw_ch_2340`，共 `2340` 个章节基础包。

边界：这些文件只作为 RebornG candidate material，不是 canon，不是运行时权力来源，也不是 DeepSeek/runtime 可直接消费的权威上下文。

导出策略：从 MiroFish strict/reviewable fullbook base 导出，递归移除了 `quote` / `originalText` / `excerpt` / `verbatim` / `rawText` / `sourceText` 字段；少量包含 source quote reference 的 review note 已替换为 redaction note。

使用建议：RebornG intake 应读取 summary、sourcePointer ids、chapterId、paragraphId、startOffset/endOffset、review 状态与 coverage；需要进入游戏规则、剧情、NPC、奖励、地点、阵营或 DeepSeek 上下文前，必须再经过 RebornG 本地改写和审核。

配套文件：
- `coverage_report.json`
- `manifest.json`
