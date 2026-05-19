# v1.0.0 MiroFish 三包 intake review

日期：2026-05-19
审查方：RebornG Codex / 专家团
状态：三包通过 intake，可作为候选材料进入 v1.0 后续阶段

## 交付包

| package | items | sourcePointers | 结论 |
|---|---:|---:|---|
| `v100_qingmao_southern_border_continuity_pack` | 8 | 16 | accepted_for_candidate_pool / rule_draft / test_sample / deferred |
| `v100_low_rank_life_loop_release_boundary_pack` | 8 | 15 | accepted_for_candidate_pool / rule_draft / test_sample / copy_boundary / deferred |
| `v100_public_release_copy_art_boundary_pack` | 8 | 16 | accepted_for_copy_boundary / art_caption_boundary / test_sample / deferred |

配套 coverage matrix：

- `qingmao_v100_request_packs_coverage_matrix.json`

## 机械门禁

本次检查结果：

- JSON 可解析：通过。
- `quote`、`originalText`、`excerpt`、`verbatim`、`rawText`、`sourceText` 禁用字段：0。
- forbiddenTextTokenCount：0。
- gateBadCount：0。
- runtimeAuthority：candidate-only。
- deepSeekAuthority：none。
- allRuntimeVisibleFalse：true。
- allDeepSeekVisibleFalse：true。
- itemsRequiringHumanCanonReview：24。

## 分包结论

### continuity pack

可吸收项：

- `qingmao_exit_pressure`：进入 b1 route/readability rule draft。
- `southern_border_route_anchor`：进入 b1 route candidate pool。
- `route_pressure`：进入 b1/b3 test sample 与 rule draft。
- `faction_residual_risk`：进入 candidate pool，默认不生成正式 faction result。
- `if_minor_deviation`：进入 b1/b3 rule draft 与 test sample。

受限项：

- `hidden_boundary`：只进 hidden redline/test sample，不进入 UI/DeepSeek visible context。
- `if_high_cost_deviation`：deferred/test_sample，不作为 v1.0 可执行承诺。
- `v1_blocked_extreme_intent`：deferred/test_sample，用于拒绝/延期说明。

### life loop pack

可吸收项：

- cultivation / supply / gu_usage / combat：进入 b2 低阶 life loop rule draft 和测试样本。
- trade / commission：进入 b2/b3 询价、担保、资格、报酬不确定性边界。
- social_pressure：进入 b2/b3 社会压力候选。

受限项：

- `test_intent`：只进入 Player Advocate/test matrix，不直接生成 runtime 功能。

### public release pack

可吸收项：

- `release_copy_boundary`：进入 b4 public copy boundary。
- `faq_boundary`：进入 b4 FAQ boundary。
- `art_caption_boundary`：进入 b4 hero/screenshot caption boundary。
- `safe_wording_candidate`：进入 copy boundary，不作为最终公开文案。

受限项：

- `hidden_fact_risk`：hidden_ref_only，只作为 leakage canary/test sample。
- `overpromise_risk`：deferred/test_sample，用于阻断完整蛊界、五域、蛊仙、尊者、任意时代开局等过度承诺。

## 吸收边界

允许：

- 转写为 RebornG-owned rule draft。
- 转写为 test sample。
- 转写为 copy/art caption boundary。
- 记录 source pointer ids 和 review status。

禁止：

- 直接成为 canon 真相源。
- 直接进入 runtime 权威。
- 直接进入 DeepSeek visible context。
- 直接进入玩家可见 hidden fact 说明。
- 直接写正式奖励、正式地点、正式阵营、NPC 生死、路线成功结论。
- 直接当作公开文案终稿。

## 阻塞状态

v1.0 a1/a2：不阻塞。

v1.0 b1：continuity pack 已通过 intake，允许进入保守 runtime absorption；如果实现需要新增 route/location 持久字段或 `SAVE_FORMAT_VERSION = 23`，仍必须停手。

v1.0 b2/b3：life loop pack 已通过 intake，允许进入 rule/test/copy-boundary 草案。

v1.0 b4：public release pack 已通过 intake，允许进入 public copy/art boundary 草案；最终公开承诺仍必须用户审批。

## 后续 MiroFish 需求

当前不需要新的 MiroFish 包。

后续只有在以下情况才需要新包：

- b1 发现需要更细的南疆早期地点/商队/客栈事实分层。
- b2 要把低阶 life loop 从边界说明升级为正式经济/任务系统。
- b4 要对外发布具体 FAQ/公告终稿，需要更细的 public wording risk。
