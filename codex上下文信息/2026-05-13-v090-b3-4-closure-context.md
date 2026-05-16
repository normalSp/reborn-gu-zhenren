# 2026-05-13 v0.9.0-b3-4 白玉/禁忌专项验收与 b3 收束上下文

## 阶段状态

`v0.9.0-b3-4` 已完成。b3 青茅山凡战视觉竖切已具备：5x3 样板、青茅演武入口、美术边界、月光蛊/白玉蛊/酒虫资产桥接、storyboard、行动卡密度、源格/目标格演出锚点、白玉/禁忌专项 e2e、资产 manifest 扫描和截图台账。

## 关键落地

- `scripts/check-qingmao-visual-assets.mjs`
  - 扫描 `src/canon/qingmao-visual-assets.json`。
  - 验证 active/candidate 的 `/rebrng/` 文件存在。
  - 验证必需 active 资产：`moonlight-gu`、`white-jade-gu`、`liquor-worm`。
  - 验证 `spring-autumn-cicada` 不在 active。
- `package.json`
  - 新增 `check:qingmao-assets`。
- `src/e2e/installE2eHarness.ts`
  - 新增 `triggerQingmaoForbiddenThresholdFailure()`，用于 e2e 触发本地校验失败轨迹。
  - 该触发器选择月光蛊对非直线格 `c1_0` 发起动作，失败原因由 battlefield engine 产出。
- `tests/e2e/v090-b3-qingmao-battlefield.spec.ts`
  - 扩展为 4 条测试：桌面月光蛊、白玉护体、禁忌失败、移动端 reduced motion。
  - 白玉护体验收 `data-effect-from-cell=c0_1`、`data-effect-target-cell=c0_1`。
  - 禁忌失败验收失败原因“目标超出射程”、禁忌门槛 storyboard active、effect layer 回落到玩家格。
  - Playwright 附件：`v090-b3-4-white-jade-shell`、`v090-b3-4-forbidden-threshold`。
- 文档
  - 新增 `v0.9.0-b3-4-启动与验收审查.md`。
  - 更新 README、阶段跟踪、路线图、需求决策池、真相源索引、截图验收台账。

## 边界

- 白玉蛊只表现凡人护体，不暗示仙体、永生、绝对免伤。
- 禁忌门槛只表现失败、反制、窍壁压力或风险，不暗示未开放禁术奖励。
- 酒虫仍不作为普通攻击按钮。
- 春秋蝉继续 blocked，不进入 b3 凡战 UI。
- UI 与动效仍只消费 `BattleResolutionStep`，不私算伤害、命中、状态、胜负或奖励。

## 验证

- `npm run check:qingmao-assets`：通过。
- `npm test -- src/store/slices/v080-battlefield-combat-ui-store.test.ts src/engine/v080-combat-expression-data.test.ts`：通过，2 files / 16 tests。
- `npx playwright test tests/e2e/v090-b3-qingmao-battlefield.spec.ts`：通过，4 tests。
- `npm run build`：通过，仅保留既有 500KB+ chunk warning 和 plugin timings warning。
- `npm test`：通过，87 files / 538 tests。
- `npx playwright test tests/e2e/v080-battlefield-ui.spec.ts tests/e2e/v080-group-battlefield-ui.spec.ts tests/e2e/v080-large-group-battlefield-ui.spec.ts`：通过，6 tests。

## 下一步

专家团建议进入 `v0.9.0-rc` 启动审查：

- 长测和测试存档。
- 经济复验与奖励污染复核。
- DeepSeek telemetry 与模型切换复盘。
- 文档冲突清理与版本标识收口。
- b3 截图/短录屏宣传素材前置审查。

如果用户想继续做更炫的前端/美术表现，先冻结 `b3-5` 或后续视觉资产阶段范围，再进入实现。
