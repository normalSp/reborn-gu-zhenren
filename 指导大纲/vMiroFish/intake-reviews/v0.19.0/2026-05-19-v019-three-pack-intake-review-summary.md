# v0.19.0 MiroFish 三包 intake review 汇总

日期：2026-05-19
状态：通过，accepted_for_v019_candidate_boundaries
审查人：RebornG 专家团

## 输入包

| 包 | 文件 | 条目 | source pointers | 结论 |
|---|---|---:|---:|---|
| public canon boundary | `v019_public_canon_boundary_pack_export_ready.json` | 8 | 16 | 通过 |
| representative playthrough anchor | `v019_representative_playthrough_anchor_pack_export_ready.json` | 8 | 15 | 通过 |
| release art caption boundary | `v019_release_art_caption_boundary_pack_export_ready.json` | 8 | 16 | 通过 |
| coverage matrix | `qingmao_v019_request_packs_coverage_matrix.json` | 3 组 coverage | 12 | 通过 |

## 自动结构检查

- 3 个主包均声明 `sourceBodyIncluded = false`。
- 3 个主包均声明 `originalWordingIncluded = false`。
- 未发现 `quote`、`originalText`、`excerpt`、`verbatim`、`sourceBody` 等运行时禁止字段。
- 每个主包均为 8 个 export-ready candidate，覆盖 request 中要求的 8 个类别。
- `completionGate.status = complete_candidate`，含义是“请求覆盖完整的候选材料”，不是 RebornG canon 事实。

## 晋级规则

MiroFish 输出不直接进入 runtime truth。v0.19 只允许下列晋级：

| MiroFish 包 | RebornG 晋级目标 | 不允许 |
|---|---|---|
| public canon boundary | `copy_boundary`、`test_sample`、`release_note_scope`、`human_review_only` | 直接成为 canon fact、隐藏事实正文、DeepSeek 可见上下文 |
| representative playthrough anchor | `golden_playthrough`、`extreme_intent_sample`、`hidden_fact_probe_sample` | 直接写行动结果、奖励、地点、阵营、NPC 生死 |
| release art caption boundary | `release_manifest_check`、`caption_boundary`、`redline_test` | 自动绑定 runtime art、对外发布承诺、大规模新图生成 |

## 逐包结论

### public canon boundary

通过。8 项分别覆盖：

- 青茅公开事实边界。
- 南疆路线公开边界。
- 商队/市场公开边界。
- 方源公开旁证边界。
- 三寨人物公开边界。
- 隐藏历史 public redline。
- 商家城外缘公开边界。
- 未来高阶 public redline。

处理：

- 7 项可进入 `copy_boundary` 或 `test_sample`。
- `hidden_history_public_redline` 只能作为 `human_review_only` 和 negative test，不进入 UI/DeepSeek 可见上下文。

### representative playthrough anchor

通过。8 项分别覆盖：

- 低阶开局。
- 行动/补给/战斗。
- 逃离路线。
- 调查边界。
- 敌对/竞争家族接触。
- 散修/外部接触。
- 商家城外缘。
- 极端目标红线。

处理：

- 进入 v0.19 a2 long playthrough matrix。
- 进入 b2 Player Advocate 30 轮与 rc 100 轮覆盖分布。
- 极端目标样本继续覆盖九转蛊、盗天传承、凡人宝黄天交易、NPC 生死这类硬边界。

### release art caption boundary

通过。8 项分别覆盖：

- 青茅低阶视觉边界。
- 路线/巡逻视觉边界。
- 商队/市场视觉边界。
- 低阶蛊材视觉边界。
- 三寨视觉边界。
- 方源视觉边界。
- 白凝冰视觉边界。
- 商家城外缘视觉边界。

处理：

- 可进入 b4 release art pack caption/redline 检查。
- 方源、白凝冰相关边界保留 `human_review_only` 色彩：可用于检查“不能暗示隐藏因果/NPC 命运”，不得自动生成对外文案。

## 隔离项

本次三包没有 `skipped` 或 quarantined 条目。

但以下类别天然高风险，即使 export-ready 也不自动进入公开文本：

| 类别 | 处理 |
|---|---|
| `hidden_history_public_redline` | hidden/ref negative test only |
| `fang_yuan_public_evidence_boundary` | public evidence only，涉及方源时 human review |
| `fang_yuan_visual_boundary` | release art caption human review |
| `bai_ning_bing_visual_boundary` | release art caption human review |
| `future_high_rank_public_redline` | FAQ/test redline only |

## 吸收落点

本次 intake 已吸收到：

- `src/canon/v019-content-governance-rules.json`
- `src/engine/v019-content-governance.ts`
- `src/engine/v019-content-governance.test.ts`
- `scripts/check-v019-content-governance.mjs`

吸收方式是 RebornG-owned rewrite：保留 item id、类别、晋级目标和 source pointer 数量判断，不复制原文正文，不赋予 MiroFish runtime authority。

## 结论

三包合格，足以支撑 v0.19：

- `a1` 内容模板和 schema 门禁。
- `a2` 长测路径矩阵。
- `b1` canon/content 校验工具。
- `b2` Player Advocate 大走查。
- `b3` public safety preflight。
- `b4` release art pack caption/redline 检查。

不需要新的 MiroFish 阻塞包即可继续 v0.19 开发。若后续要进入正式 v1.0 对外发布文案或新增大规模素材，需要另行让用户审批，不由本 intake 自动授权。
