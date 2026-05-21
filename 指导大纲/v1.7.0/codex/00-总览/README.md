# RebornG v1.7.0 Codex 当前入口

状态：completed
日期：2026-05-21
主题：低阶区域活世界纵切选型与第一阶段门禁

## 当前一句话

`v1.7.0` 已完成本地开发里程碑：首个 `southern_border_low_rank_outer_edge_life_slice` 双仓 topic-slice 样板已跑通，并落地 `buildV170RegionalLifeProjection()` 与世界面板 `活世` 页签。v1.7 保持 `SAVE_FORMAT_VERSION = 24`，不新增 `regionalLifeState` / `areaLivingState` / `regionalEventLedger` / `runFingerprint`，不扩 DeepSeek 权限，不开放完整南疆/商家城/正式商队身份。

用户追加批准：把“同开局可重玩差异度”作为 v1.7-a1 的正式评估项。它是长期活世界能力的一部分，但 v1.7 不默认通过新增持久随机字段或扩大 DeepSeek 权限来实现。

用户追加批准：把 MiroFish 双仓 topic-slice 流水线制度化。v1.7-a2 第一条样板由当前 Codex 主线程主控跑通 `RebornG request -> MiroFish export -> RebornG intake review -> 测试矩阵/规则草案`；样板稳定后，再提交“只读/分析型子代理”风险收益给用户决策。

这不是默认后端重构版本，也不是默认公开测试版本。公开测试、薄 BFF、DeepSeek 可见知识摘要、runtime canon 晋升、存档字段、正式地点/阵营/奖励/NPC 生死，都必须另走门禁并由用户批准。

v1.7 live gate 已执行：b1 8 轮 `deepseek-v4-flash` clean smoke 通过；rc 50 轮真实输出经 evaluator rescore 通过，P0/P1/P2=0/0/7。P2 主要是“木牌/令牌/登记/成员身份”等偏正式道具风险，已进入 future prompt/eval hardening，不阻断 v1.7。

## 当前入口文件

- `v1.7.0-专家团启动会纪要.md`
- `v1.7.0-启动审查与范围冻结.md`
- `v1.7.0-总体开发大纲.md`
- `v1.7.0-小版本执行路线图.md`
- `v1.7.0-需求决策池.md`
- `v1.7.0-a0-治理补丁与范围冻结.md`
- `v1.7.0-a1-区域活世界topic-slice与save-format设计门禁.md`
- `v1.7.0-a2-MiroFish-区域活世界topic-slice-intake.md`
- `v1.7.0-a2-区域活世界规则草案.md`
- `v1.7.0-b1-区域活世界projection-first第一刀.md`
- `v1.7.0-b1-Player-Advocate-30轮走查记录.md`
- `v1.7.0-b1-长线叙事漂移检查记录.md`
- `v1.7.0-b2-路线生存社会冲突组合态势.md`
- `v1.7.0-b3-低阶生活事件模板与失败推进.md`
- `v1.7.0-b4-反刷旧档回滚与入口一致性.md`
- `v1.7.0-process-1-公开测试BFF安全门禁复核.md`
- `v1.7.0-process-2-长线漂移与知识库复核.md`
- `v1.7.0-rc-Player-Advocate-100轮走查记录.md`
- `v1.7.0-rc-live-probe执行记录.md`
- `v1.7.0-rc-Skill同步审计记录.md`
- `v1.7.0-rc-质量收束记录.md`
- `v1.7.0-真相源索引.md`
- `v1.7.0-测试矩阵.md`
- `v1.7.0-MiroFish资料需求与交付协议.md`
- `v1.7.0-Git提交与推送计划.md`

关联项目级制度：

- `指导大纲/流程制度/MiroFish双仓topic-slice流水线制度.md`

## 专家团推荐主线

推荐主线：

`低阶区域活世界纵切选型与第一阶段门禁`

推荐第一目标不是“完整南疆”，而是一个小到能长测、大到能体现活世界的样板：

`南疆早期外缘：山路歇脚点 / 临时商队接触 / 散修落脚 / 城门外缘门槛`

它可以复用 v1.1-v1.5 的已有投影地基，也能用 v1.6 工具检查 MiroFish source pointer、知识索引、晋升链和长测样本。

## 备选主线

| 方案 | 名称 | 专家团倾向 |
|---|---|---|
| A | 低阶区域活世界纵切选型 | 推荐 |
| B | 公开测试与薄 BFF 安全门禁 | 作为 process sidecar，不做默认主线 |
| C | DeepSeek 安全摘要 / RAG 预研 | 暂缓，风险高 |
| D | 商家城外缘社会经济样板 | 有吸引力，但现在偏大 |
| E | 青茅余波回访样板 | 稳，但对“青茅之后”推进感较弱 |

## 当前下一步

v1.7.0 已完成。下一步建议另开 v1.8 专家团启动会，重点讨论是否把 `runFingerprint` / `regionalEventLedger` / 区域事件长期差异度持久化推入正式设计门禁。
