# 2026-05-13 v0.9.0-rc 发布闸门与成果锁定上下文

## 当前状态

- 工作分支：`codex/v090-b1-world-action-protocol`
- 当前阶段：`v0.9.0-rc` 发布闸门
- 用户决策：选择先把 `v0.9.0` 当前成果锁住，再开 DeepSeek 和视觉扩展
- 结论：`v0.9.0` 本体进入范围锁定；除关键 bug、发布配置、文档一致性和验收记录外，不再新增玩法、视觉资产、模型切换或存档字段。release gate 自动化验证已通过。

## 本轮落地

- 新增 `指导大纲/v0.9.0/codex/00-总览/v0.9.0-发布闸门与成果锁定.md`。
- `README.md`、路线图、阶段跟踪、风险池、真相源索引、需求决策池、发布说明和手测清单均同步到“成果锁定 + release gate”口径。
- 新增候选需求：
  - `C-046 v0.9.0 发布闸门与成果锁定`
  - `C-047 post-v0.9 DeepSeek 模型 eval 专项`
  - `C-048 post-v0.9 视觉扩展与素材审查专项`

## 锁定边界

允许：

- 修复 P0/P1 bug。
- 调整发布配置、文档一致性、风险池和验收记录。
- 建立 DeepSeek eval 或视觉扩展后续专项文档。

禁止：

- 向 `v0.9.0` 本体新增完整玩法、视觉资产、模型切换或存档字段。
- 盲切正式叙事模型。
- 把 b3/b3-5 素材直接用于对外宣传而不做美术边界审查。
- 让青茅凡战特效暗示仙蛊、永生、十转、宿命蛊归属、凡人宝黄天交易或洞天正式认主。

## Release Gate 自动化结果

- `npx tsc --noEmit --pretty false`：通过。
- `npm test`：通过，88 files / 541 tests。
- `npm run build`：通过；无 500KB+ chunk warning。
- `npm run check:runtime-assets`：通过，128 files；audio=45、images=72、json=11、zero-byte=0。
- `npm run check:qingmao-assets`：通过，7 entries；active=4、review-only=2、blocked=1。
- `npm run test:e2e:long`：通过，29 tests。
- `npx playwright test tests/e2e/v090-b3-qingmao-battlefield.spec.ts`：通过，4 tests。

## 下一步

- 同步 skill 当前事实。
- 进入后续专项前，先确认它们不会改变已锁定的 `v0.9.0` 本体。

## 决策边界

以下事项仍需要用户后续拍板：

- 是否把 `0.9.0-rc.0` 升成正式 `0.9.0` 发布口径。
- 是否批准某个具体 DeepSeek 模型成为正式叙事运行时默认模型。
- 是否批准某张截图、短录屏或生成图作为对外素材。
