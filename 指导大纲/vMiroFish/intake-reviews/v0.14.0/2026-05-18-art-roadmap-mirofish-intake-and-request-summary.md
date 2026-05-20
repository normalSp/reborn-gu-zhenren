# v0.14 → v1.0 美术 MiroFish intake 与新增 request 汇总

日期：2026-05-18
关联总入口：`doc/art/v014-to-v100-art-roadmap.md`
用户决策：2026-05-18 选 A，接受 `xiong-li-squad-vs-bai-ning-bing-candidate-03`、`fang-yuan-monkey-king-cavern-fight-candidate-02`、`blood-lake-rank-five-battle-candidate-04` 作为后续 v0.16 候选维护方向；该决策不等于正式 public 入库，也不等于 manifest/schema 升级。

## 已交付包 intake 状态

| 包 | 关联文件 | 结论 | 美术影响 |
|---|---|---|---|
| `qingmao_unfilled_gu_appearance_pack` | `qingmao-unfilled-gu-appearance-pack-intake-review.md` | `accepted_for_art_candidate_pool_with_name_alignment_required` | D3/D5/D6 命名对齐生效；14 张 D3/D5/D6/D4 可入美术候选，3 只 atlas-pending |
| `qingmao_unfilled_gu_appearance_extension_pack_r2` | `qingmao-unfilled-gu-appearance-extension-pack-r2-intake-review.md` | `accepted_for_art_candidate_pool_with_one_name_alignment` | `雷眼蛊 → 电眼蛊` 命名对齐生效；4 只 body 全部未确认，不解锁标本本体图 |
| `qingmao_exit_route_aftermath_pack` | `2026-05-17-qingmao-exit-route-aftermath-pack-intake-review.md` | `accepted_for_candidate_pool_with_quarantine` | 1 条隔离项 `v014exit_30146f740a69` 不得进入玩家可见路线/UI/DeepSeek；与美术直接关系低 |
| `southern_border_low_rank_route_pack` | `2026-05-17-southern-border-low-rank-route-pack-intake-review.md` | `accepted_for_candidate_pool` | 可作 v0.17 路线/区域候选背景，但不足以直接生区域大景 |
| `shang_clan_city_public_entry_pack` | `2026-05-17-shang-clan-city-public-entry-pack-intake-review.md` | `accepted_for_candidate_pool` | 可作公开入口条件候选，但不足以直接生正式商家城美术 |

## R1/R2 吸收边界

允许吸收：

- `candidate_pool`
- `art_prompt_seed`
- `atlas_update`（仅限已完成命名对齐且有人审确认的条目）
- `composition_contract_seed`（仅后续 v0.16 构图锚点包通过后）

禁止吸收：

- runtime truth
- DeepSeek authority
- 玩家可见隐藏事实正文
- 正式地点、阵营、奖励、任务、NPC 生死结论
- 未确认 body 的蛊虫标本本体图

## R3 处置

`指导大纲/vMiroFish/美术/2026-05-18-r3-effect-only-aura-card-pack.md` 仍保留为草稿，但本轮不转交。

理由：

- R2 已确认 `漩涡蛊 / 烈风蛊 / 电眼蛊 / 扬眉吐气蛊` body 全部未确认。
- 用户本轮选 A 是 candidate 验收，不是选 C。
- 只有用户明确选择“4 atlas-pending 蛊做 effect-only 气场卡”时，R3 才有必要转交。

当前处置：

- `漩涡蛊`：保留 `atlas-pending/no-png`。
- `烈风蛊`：保留 `atlas-pending/no-png`。
- `电眼蛊`（曾用候选名 `雷眼蛊`）：命名对齐生效，但 body 仍缺，保留 `atlas-pending/no-png`。
- `扬眉吐气蛊`：保留 `atlas-pending/concept-only`。

## 新增 request

| 包 | 新位置 | 优先级 | 触发/转交建议 | 阻塞情况 |
|---|---|---|---|---|
| `v016_battle_scene_composition_anchor_pack` | `指导大纲/vMiroFish/requests/v0.16.0/2026-05-18-v016-battle-scene-composition-anchor-pack.md` | `preferred` | 建议转交；能减少后续战斗图重生次数，也可核验历史 3 张战斗图 | 不阻塞当前已接受候选，但阻塞“放心扩大战斗图批量维护”的质量门 |
| `v017_region_appearance_pack` | `指导大纲/vMiroFish/requests/v0.17.0/2026-05-18-v017-region-appearance-pack.md` | `blocking` | v0.17 scope-freeze 前应转交 | 阻塞 v0.17 多区域大景 + 商家城城景 |
| `v017_character_appearance_pack` | `指导大纲/vMiroFish/requests/v0.17.0/2026-05-18-v017-character-appearance-pack.md` | `blocking` | v0.17 scope-freeze 前应转交；角色名单需 RebornG 审定 | 阻塞 v0.17 关键 NPC / 南疆代表立绘 |

## v1.0 美术缺口快照

按 `doc/art/v014-to-v100-art-roadmap.md` 与当前候选积累，近期不需用户额外决策即可继续生的新图为 0。剩余缺口分为“候选待入库/manifest 决策”和“等待 MiroFish/边界决策”两类。

### 候选待入库/manifest 决策

- v0.16 战斗场景：5 张候选已齐，其中本轮 A 接受 3 张重生候选作为维护方向；仍需正式入库决策，入库时改 `qingmao-visual-assets.json` / `image-maps.ts` / `battle-asset-manifest.json` 相关白名单。
- v0.16 杀招泛用闪图：4 张候选可作为 runtime 兜底候选，但需要 manifest schema/评审。
- v0.16 凡级蛊 effect：3 张候选可后续绑定 effect frame，但需要 schema 决策。
- v1.0 hero/OG：3 张候选已齐，等正式入库/页面绑定决策。

### 等待 MiroFish 或 hard stop

- v0.17 多区域大景 + 城景：约 9 PNG，阻塞于 `v017_region_appearance_pack`。
- v0.17 角色立绘：约 10 PNG，阻塞于 `v017_character_appearance_pack` 与角色名单审定。
- 仙蛊闪图（春秋蝉 / 人如故 / 鸿运齐天等）：6-10 PNG，不属于 MiroFish 直接请求，应先走 expert council §Lore + §Systems canon/IF 边界评审。
- 4 只 atlas-pending 蛊：默认不画；只有用户破例选择 effect-only 气场卡时才转交 R3。
- v1.0 rc 走查补图：不可预估，等 Player Advocate rc 走查触发。

## 结论

本轮 MiroFish intake 的阻塞结论已经清楚：

1. v0.15 D4/D6 的 R1/R2 已解决命名与可画项；未确认 body 的 4 只不再阻塞后续版本，默认保留 atlas-pending。
2. v0.16 当前战斗候选可继续维护；建议转交构图锚点包以降低重生成本。
3. 真正阻塞 v0.17 美术推进的是区域外观包与角色外观包，已补正式 request。
4. 在这三个 request 交付并通过 intake review 前，不应启动 v0.17 多区域/角色正式生图批次。
