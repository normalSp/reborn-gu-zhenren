# 2026-05-13 v0.9.0-rc-type-debt 上下文

## 当前状态

- 工作分支：`codex/v090-b1-world-action-protocol`
- 当前阶段：`v0.9.0-rc` 发布候选收束
- 本轮专项：`rc-type-debt` 已完成
- 结论：`R-001 TypeScript 全量类型债` 已关闭；没有出现需要用户拍板的世界观、玩法或模型策略冲突。

## 本轮落地

- 修复 GSAP 动画模块类型、动画队列返回类型。
- 统一 `ScreenState` / `PipelinePhase`，补齐 `VALIDATING_L4`、`VALIDATING_L3_RETRY`。
- 修复成就统计、Achievement toast key、骰子/突破动效 payload。
- 对齐仙窍、资源节点、蛊材物资袋、传承/福地、灾劫、结局、故事锚点、荒兽狩猎等旧字段与当前类型。
- 补 `BattleTracePhase.settlement`，修复战斗、squad、battlefield UI model 的类型桥接。
- 修复 `response-pipeline.ts` 与 DeepSeek 状态更新验证之间的 schema/type 桥接，不改变缓存命中、tokens、模型名和 prompt 前缀 hash 观测策略。
- 更新 rc 风险池、README、阶段跟踪，并新增 `v0.9.0-rc-type-debt-验收记录.md`。
- 更新四个核心 skill 当前事实。

## 验证结果

- `npx tsc --noEmit --pretty false`：通过。
- `npm test`：通过，88 files / 541 tests。
- `npm run build`：通过；保留既有 `combat-squad` 500KB+ chunk warning 与 plugin timing warning。
- `npm run check:runtime-assets`：通过，128 files；audio=45、images=72、json=11、zero-byte=0。
- `npm run check:qingmao-assets`：通过，active=4、review-only=2、blocked=1。
- `npm run test:e2e:long`：通过，29 tests。

## 剩余风险

- 构建仍有 `combat-squad` 500KB+ chunk warning；建议单独开性能/code splitting 小阶段。
- 本文件记录的是 C-049 之前的类型债阶段判断；正式叙事模型已由 C-049 切换为 `deepseek-v4-flash`，用户已决定不再评估其他模型。
- b3 宣传素材/短录屏仍需素材审查。

## 下一步建议

继续 rc 收束。专家团建议优先顺序：

1. 发布说明与手测走查清单最终化。
2. `combat-squad` chunk 体积专项评估。
3. b3/b3-5 宣传素材审查。
4. 正式候选版本前最后一轮 `npm test`、`npm run build`、`npm run test:e2e:long`。
