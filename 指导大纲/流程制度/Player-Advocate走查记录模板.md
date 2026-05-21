# <version>-<phase> Player Advocate 走查记录

日期：YYYY-MM-DD
状态：草案 / 已完成
走查类型：小版本 10 轮 / rc 50 轮
执行者：Player Advocate
MiroFish：not_needed / optional / preferred / blocking
DeepSeek 运行模型：`deepseek-v4-flash`
走查层级：deterministic_walkthrough / live_narrative_probe / mixed

## 范围

本次走查覆盖：

- 玩家身份：
- 起始存档 / 路径：
- 本阶段新增或重点验证内容：
- 本次不验证：
- 是否调用 live DeepSeek：否 / 是
- live DeepSeek 模型：`deepseek-v4-flash` / 不适用
- live DeepSeek 样本：样本数与样本来源 / 不适用
- live DeepSeek 轮次：轮次数 / 不适用
- live DeepSeek 成本：实际或估算 token / 费用 / 不适用
- live DeepSeek 报告路径：`artifacts/.../report.json` / 不适用
- 存档价值：none / debug_only / regression_candidate / golden_playthrough_candidate
- transcript / 存档落点：

## 验收指标

| 指标 | 目标 | 结果 |
|---|---:|---:|
| 走查轮次 | 10 / 50 | 0 |
| 下一步可理解率 | >= 80% / >= 85% | TBD |
| 严重困惑轮次 | <= 2 / <= 5 | TBD |
| P0/P1 未关闭体验阻断 | 0 | TBD |
| 隐藏事实泄露 | 0 | TBD |
| UI 私算奖励/地点/阵营/NPC 生死 | 0 | TBD |
| 关键 UI 遮挡/不可读 | 0 | TBD |
| live DeepSeek 越权 | 0 / 不适用 | TBD |
| 值得保留的回归存档 | 按需 | TBD |

## 覆盖分布

| 覆盖项 | 目标 | 结果 | 证据轮次 |
|---|---:|---:|---|
| 主线目标推进 | 小版本按需 / rc >= 20 | TBD | TBD |
| 自由意图或长期目标 | 小版本按需 / rc >= 10 | TBD | TBD |
| 失败、阻断、风险或代价反馈 | 小版本按需 / rc >= 10 | TBD | TBD |
| 移动端或 reduced-motion 可读性 | 小版本按需 / rc >= 5 | TBD | TBD |
| 旧档兼容 / E2E harness / replay-eval 样本 / 当前版本可复现路径 | 小版本按需 / rc >= 5 | TBD | TBD |

## 轮次记录

| 轮次 | 玩家目标 | 可见上下文 | 玩家选择/输入 | 系统反馈 | 玩家是否理解下一步 | 体验评价 | 问题分类 | 处理 |
|---:|---|---|---|---|---|---|---|---|
| 1 |  |  |  |  | yes/no |  | none | none |
| 2 |  |  |  |  | yes/no |  | none | none |
| 3 |  |  |  |  | yes/no |  | none | none |
| 4 |  |  |  |  | yes/no |  | none | none |
| 5 |  |  |  |  | yes/no |  | none | none |
| 6 |  |  |  |  | yes/no |  | none | none |
| 7 |  |  |  |  | yes/no |  | none | none |
| 8 |  |  |  |  | yes/no |  | none | none |
| 9 |  |  |  |  | yes/no |  | none | none |
| 10 |  |  |  |  | yes/no |  | none | none |

## 发现

| 等级 | 分类 | 描述 | 证据 | 处理 |
|---|---|---|---|---|
| P2 | flow | 示例：玩家看不懂下一步 | 轮次 N | 进入需求池 |

等级说明：

- P0：阻断完成或发布。
- P1：必须在本阶段关闭。
- P2：进入近期需求池。
- P3：记录为远期体验优化。

## 结论

- 是否通过本阶段 Player Advocate gate：
- 需要补测试：
- 需要写入 `.learnings/ERRORS.md`：
- 需要用户决策：
- 进入需求池：
- 本次存档是否保留：
- 是否需要追加 live narrative probe：
- live DeepSeek 元数据是否完整：

## 后续

- 下一次走查建议：
- 应纳入 rc 50 轮的路径：

## 脚本校验

完成后运行：

```bash
npm run check:player-advocate-gate -- <record.md> <10|50>
```

脚本会检查：

- 必须包含验收指标、轮次记录、发现、结论。
- 不允许遗留 `YYYY-MM-DD`、`TBD`、`草案 / 已完成` 等模板占位。
- 每一轮必须填写目标、上下文、选择、反馈、理解、评价、分类和处理。
- `玩家是否理解下一步` 必须写 `yes` 或 `no`。
- 小版本下一步可理解率必须 `>= 80%`，rc 必须 `>= 85%`。
- 小版本严重困惑轮次必须 `<= 2`，rc 必须 `<= 5`。
- 结论必须明确写明 `是否通过本阶段 Player Advocate gate：通过`。
