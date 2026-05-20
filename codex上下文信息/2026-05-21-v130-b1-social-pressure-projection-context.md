# 2026-05-21 v1.3.0-b1 social pressure projection context

## 状态

- 分支：`codex/v130-b1-social-pressure-projection`
- 阶段：v1.3.0-b1 关系证据与社会压力 projection-only 第一刀
- 结论：本地第一刀已完成，等待提交/推送

## 用户决策

- D-130-001 至 D-130-009 已批准。
- D-131-001 至 D-131-007 已批准。
- b1 必须 projection-only。
- 不 bump `SAVE_FORMAT_VERSION = 25`。
- 不新增 `socialRelationState`。
- 不开放正式关系、阵营、通缉、招揽、封锁、奖励、NPC 生死。
- rc live probe 必跑，模型 `deepseek-v4-flash`；成本、样本、轮次和通过标准 rc 前再确认。

## Runtime 变更

新增：

- `src/engine/v130-social-pressure-projection.ts`
- `src/engine/v130-social-pressure-projection.test.ts`
- `src/components/game/SocialPressurePanel.tsx`
- `tests/e2e/v130-social-pressure-projection.spec.ts`

更新：

- `src/components/game/WorldHubPanel.tsx`
- `package.json`

行为：

- 世界面板新增 `社会` 页签。
- 只读取 `livingWorldState.knownFacts`、`npcMemories`、`factionPressure`、`actionConsequences` 与本地行动账本。
- 输出势力压力、记忆痕迹、公开事件、社会后续候选。
- 不写 store/save，不调 DeepSeek，不读 MiroFish 原始包。
- 高风险排序保证四类社会信号至少各保留一条。

## 文档更新

- `v1.3.0-b1-关系证据与社会压力projection-only第一刀.md`
- `v1.3.0-b1-Player-Advocate-30轮走查记录.md`
- `v1.3.0-b1-长线叙事漂移检查记录.md`
- v1.3 README、路线图、需求池、测试矩阵、真相源索引、Git 计划
- `指导大纲/项目仪表盘.md`
- `.codex/skills/reborn-expert-council/references/PROJECT-STATE.md`
- `AGENTS.md`

## 验证

已通过：

- `npm test -- v130-social-pressure-projection`
- `npx tsc --noEmit --pretty false`
- `npx playwright test tests/e2e/v130-social-pressure-projection.spec.ts`
- `npm run check:player-advocate-gate -- 指导大纲/v1.3.0/codex/00-总览/v1.3.0-b1-Player-Advocate-30轮走查记录.md 30`
- `npm test`
- `npm run build`
- `npm run test:e2e:long`

## 下一步

完成 b1 提交/推送后，进入 b2/b3/b4 默认 projection-only 深化。若要新增 v25、`socialRelationState`、命名 NPC allowlist、正式通缉/招揽/封锁/阵营/奖励/NPC 生死，必须停下来让用户拍板。
