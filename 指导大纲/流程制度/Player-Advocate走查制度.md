# Player Advocate 走查制度

日期：2026-05-17
状态：已建立，v0.14.0 起默认纳入阶段门禁
来源：`v0.11.0-后续专项池.md` 中 `V11-A4 Player Advocate 前 10 轮走查制度`，升级为项目级流程。

## 目的

RebornG 的工程测试能证明“系统没坏”，但玩家视角走查要证明“玩家愿意继续玩”。

本制度固定检查：

- 玩家是否知道自己现在能做什么。
- 选择是否有意义，而不是同义按钮。
- 失败反馈是否像世界规则，而不是系统拒绝。
- 行动后果是否能被玩家理解。
- UI 是否遮挡、出戏、信息过载或缺少下一步。
- DeepSeek 文本是否服务玩家体验，同时不越过本地引擎权限。

## 适用范围

默认适用于：

- 新增或修改玩家可见 UI。
- 新增或修改自由意图、行动候选、NPC/势力反应、剧情推进、战斗入口、资源循环、DeepSeek 回流文本。
- 每个小版本收束。
- 每个大版本 rc 前。

可豁免：

- 纯文档、纯 CI、纯 Git 流程、纯内部脚本，且不改变玩家可见体验。
- 豁免必须在当前版本文档或交接中写明。

## 轮次标准

### 小版本

每个涉及玩家体验的小版本完成前，至少走查 `10` 轮。

### rc 前

每个大版本 rc 前，至少走查 `50` 轮。

50 轮应覆盖：

- 至少 20 轮主线目标推进。
- 至少 10 轮自由意图或长期目标。
- 至少 10 轮失败、阻断、风险或代价反馈。
- 至少 5 轮移动端或 reduced-motion 可读性。
- 至少 5 轮旧档兼容、E2E harness demo、replay/eval 样本或当前版本可复现路径。`测试存档/` 与 `public/test-saves/` 已废弃，不再作为新门禁入口。

## 什么算一轮

一轮必须包含：

1. 玩家当前目标。
2. 玩家看到的上下文。
3. 玩家选择或输入。
4. 系统反馈。
5. 玩家是否理解后果和下一步。
6. Player Advocate 评价。

只有自动点击但没有玩家目标和体验评价，不算一轮。

## 输出位置

小版本走查：

`指导大纲/<version>/codex/00-总览/<version>-<phase>-Player-Advocate走查记录.md`

rc 走查：

`指导大纲/<version>/codex/00-总览/<version>-rc-Player-Advocate-50轮走查记录.md`

模板：

`指导大纲/流程制度/Player-Advocate走查记录模板.md`

## 门禁脚本

走查记录必须通过：

```bash
npm run check:player-advocate-gate -- <record.md> <10|50>
```

脚本不只数轮次，还必须拦住形式化记录：

- 必须包含验收指标、轮次记录、发现、结论。
- 不允许遗留模板占位符。
- 每轮必须填写玩家目标、可见上下文、选择 / 输入、系统反馈、下一步理解、体验评价、问题分类和处理。
- `玩家是否理解下一步` 必须是 `yes` 或 `no`，脚本会据此计算下一步可理解率和严重困惑轮次。
- 记录结论必须明确写明 `是否通过本阶段 Player Advocate gate：通过`。

## 硬指标

rc 前必须满足：

- P0/P1 玩家体验阻断未关闭数：`0`。
- 玩家可见隐藏事实泄露：`0`。
- UI 私算奖励、地点、阵营、NPC 生死：`0`。
- 关键 UI 遮挡 / 文字不可读：`0`。
- 玩家下一步可理解率：小版本 `>= 80%`，rc `>= 85%`。
- 严重困惑轮次：小版本 `<= 2/10`，rc `<= 5/50`。

若未满足，不能直接宣布小版本或 rc 完成；必须进入 bug、需求池、测试矩阵或用户决策。

## 结果分类

每个问题必须归类为：

- `bug`：功能、布局、状态、黑屏、遮挡。
- `copy`：文案不清、术语不稳、反馈不像世界规则。
- `flow`：玩家不知道下一步。
- `choice_quality`：选择没有意义。
- `lore_boundary`：不像蛊真人或碰到原著/IF 边界。
- `system_gap`：需要未来引擎支持。
- `user_decision`：涉及方向、边界、自由度或发布承诺，必须停下来问用户。

## 与自动测试的关系

Player Advocate 走查不替代：

- unit tests
- type check
- build
- asset scans
- production-preview smoke
- Playwright e2e
- DeepSeek eval

它补的是自动测试难以判断的玩家口感、自由感、理解度和继续游玩欲望。

## 确定性走查与 live DeepSeek

Player Advocate 走查分两层：

1. `deterministic_walkthrough`：默认层。使用本地引擎、E2E harness demo、Playwright、replay/eval 样本或手工可复现步骤走查，验证目标、选择、反馈、边界、UI 和存档是否可理解。小版本和 rc 的轮次默认按这一层计数。
2. `live_narrative_probe`：叙事探针层。用于真实调用 `deepseek-v4-flash` 检查叙事口感、越权、hidden 泄漏、术语和玩家继续游玩欲望。玩家可见 runtime 小版本和大版本 rc 默认启用；纯文档/CI/Git/内部脚本可豁免。它必须记录模型名、轮次、token/缓存命中、失败原因、是否保存 transcript、是否进入 eval 样本。

live DeepSeek 不替代确定性走查。原因是 live 输出有随机性，适合验证叙事口感、越权和成本，不适合单独证明本地引擎门禁稳定。

从 2026-05-21 起，所有 Player Advocate 记录必须写清 live DeepSeek 元数据：

- 是否调用 live DeepSeek：否 / 是。
- 若是：模型、样本、轮次、成本、报告路径必须齐全。
- 当前标准模型固定为 `deepseek-v4-flash`，与运行时 `.env` 口径一致；不得在走查中临时切换 Pro / Reasoner / 其他模型。
- 若否：必须写明不调用 live 的原因，通常是纯文档/CI/Git/内部脚本，或本阶段只做确定性回归。

## live_narrative_probe 默认档位

成本不再作为标准档 live probe 的阻断理由；质量优先。标准档之外的模型切换、明显扩大样本或长时间 live soak，仍必须另行停下来让用户确认。

| 场景 | 是否默认 live | 标准档 | 说明 |
|---|---|---:|---|
| 纯文档、CI、Git、report-only 工具 | 否 | 0 | 写明豁免原因 |
| 玩家可见 runtime 小版本，但不改 DeepSeek prompt/context | 是 | 8-12 轮 | 做叙事口感、越权、hidden 泄漏 smoke |
| 改 DeepSeek prompt/context/schema、自由意图、剧情回流、NPC/势力/区域/冲突叙事 | 是 | 20-40 轮 | 作为小版本阻断门 |
| 大版本 rc | 是 | 40-60 轮 | 覆盖主线、自由意图、失败阻断、hidden/authority 对抗样本 |
| 高风险 rc：新区域活世界、知识摘要、hidden-adjacent、公开候选 | 是 | 80-120 轮 | 每 20/25 轮做 checkpoint |
| v2.0 前区域活世界长测 | 是 / mixed | 300+ 总轮次，其中 live 不少于 80-120 | live 与 replay/deterministic 组合 |

若标准档 live probe 出现任一 P0，必须修复后 clean re-probe。若出现 P1/P2，必须进入当前测试矩阵、需求池或延期样本池，不能只写“观察”。

## live_narrative_probe 执行方式

live probe 不应把 DeepSeek 当成世界状态写入者。推荐执行流水线：

1. 选择 probe route：从当前版本批准的起点、旧档兼容路径、E2E harness demo、replay/eval 样本或人工构造的 debug state 开始。
2. 固定本地事实：由 local canon / engine / store 给出当前路线、地点候选、资源压力、社会压力、冲突后果和 forbidden writes。
3. 调用 `deepseek-v4-flash`：只让模型生成叙事、候选、传闻、请求、压力和玩家可见说明。
4. 本地审查：逐轮检查 DeepSeek 是否越权写奖励、地点、阵营、NPC 生死、hidden/private、完整 canon 或正式结论。
5. checkpoint：小档至少末尾审查一次；20 轮以上每 10/20 轮审查一次；80 轮以上每 20/25 轮审查一次。
6. 归档：保存 transcript、report.json、样本 ids、模型名、轮次、token/缓存命中、成本、失败项和是否进入测试矩阵。
7. 晋升：只有通过 intake/test/user gate 的样本，才能晋升为 replay/eval/golden_playthrough_candidate；不得重新启用 `测试存档/` 或 `public/test-saves/`。

执行形态分三种：

- `api_sample_probe`：像 v1.1 D-025、v1.3-rc 那样，用固定样本直接调用 DeepSeek API。适合 prompt/schema/authority/hidden 对抗。
- `seeded_runtime_probe`：从当前 app 的可复现状态或 Playwright harness 出发，走若干玩家回合，再把回合上下文交给 DeepSeek。适合真实玩法口感。
- `mixed_probe`：先 deterministic / replay 跑长线，再抽关键 checkpoint live 调 DeepSeek。适合长线成本、时间和稳定性的平衡。

当前项目已有 `api_sample_probe` 和 `replay/deterministic` 骨架；还缺一个通用 `seeded_runtime_probe` runner。进入 v1.7 runtime 前，应在 a1/a2 或 process 小刀里决定是否把它工具化。

公开候选前不得低于 rc 标准档。若要做完整 live 长测，可升级到高风险 rc 或 v2.0 前区域活世界长测档；升级必须记录额外耗时、样本、成本和可复现性风险。

## 存档价值评估

每份走查记录都必须写明：

- 本次走查是否产生值得保留的回放、E2E fixture、eval 样本或手工复现步骤。
- 存档价值是 `none`、`debug_only`、`regression_candidate` 还是 `golden_playthrough_candidate`。
- 若是候选样本，后续是否要落到 e2e fixture、eval archive、长期回放样本或当前版本文档；不要重新启用已废弃的 `测试存档/` 或 `public/test-saves/`。

不能把一次主观体验走查直接当成 golden playthrough；必须先通过自动测试、隐藏事实扫描和旧档兼容检查。

走查发现的可回归问题，应补到：

- `tests/e2e/`
- focused unit tests
- `scripts/check-*`
- `.learnings/ERRORS.md`
- 当前版本测试矩阵

## 停下来问用户的情况

走查中出现以下情况，必须停止继续开发并让用户决策：

- 玩家自由度是否应开放。
- 正史 / IF 边界是否应偏离。
- 是否允许正式阵营变化、通缉、招揽、任务、奖励、地点解锁或 NPC 生死。
- 体验方向和当前版本目标冲突。
- 对外发布承诺需要调整。

## 当前模型口径

正式运行时剧情文本生成默认使用 `deepseek-v4-flash`，不是 Pro。

不得主动提出切换或重新评估 Pro / Reasoner / 其他模型，除非用户明确撤销当前模型策略。
