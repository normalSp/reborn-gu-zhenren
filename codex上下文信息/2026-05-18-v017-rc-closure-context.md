# 2026-05-18 v0.17.0 rc 收束上下文

## 当前状态

`v0.17.0` 已完成为本地开发里程碑，主线是 `战斗、杀招、小队与阵法深化`。下一步必须停下来进入 `v0.18.0` 启动审查，由用户审定主线、MiroFish 需求、是否继续不新增存档字段，以及南疆路线/多区域承接边界。

## 本轮交付

- MiroFish v0.17 三包 intake review 已通过：低阶战斗遭遇、杀招/蛊虫反制、小队/阵法战术。
- 新增 `src/canon/v017-combat-deepening-rules.json`。
- 新增 `src/engine/v017-combat-deepening.ts` 与 focused tests。
- `qingmaoRegionSlice` 新增 `registerV017CombatCandidateAction`，只写既有 combat candidate queue。
- `ActionPanel` 接入 v0.17 战斗准备入口。
- `GuDaoPanel` 接入杀招/蛊虫反制与小队战术只读提示。
- `NarrativeCombatPanel` 接入战后回流复核提示。
- 新增 e2e：`tests/e2e/v017-combat-deepening.spec.ts`。

## 明确未做

- 未新增存档字段，`SAVE_FORMAT_VERSION` 保持 `22`。
- 未扩大 DeepSeek 权限。
- 未新增正式奖励、掉落、材料、蛊虫、蛊方、地点、阵营、NPC 生死。
- 未设置 `enemySpecIds`，避免触发旧兽材掉落链。
- 未引入后端/BFF、外部运行时依赖、EdgeOne 自动部署或公开承诺。
- 未把 MiroFish 输出当作 canon、runtime truth 或 DeepSeek authority。

## 已通过验证

- `npm test -- src/engine/v017-combat-deepening.test.ts src/store/slices/qingmaoRegionSlice.test.ts --reporter=dot`
- `npx tsc --noEmit --pretty false`
- `npm run test:e2e -- tests/e2e/v017-combat-deepening.spec.ts`
- `npm test -- --reporter=dot`
- `npm run build`
- `npm run check:runtime-assets`
- `npm run check:qingmao-assets`
- `npm run check:player-visible-copy`
- `npm run test:e2e`
- `npm run test:e2e:long`
- `npm run check:production-preview`
- b1/b2/b3/b4 Player Advocate 20 轮
- rc Player Advocate 60 轮

## Git 状态

`005c1da feat: 完成v0.17战斗深化第一层` 与 `9c77935 docs: 记录v0.17远端验证` 已推送到 `codex/v013-npc-faction-reaction`。GitHub Actions run `26046493464`、`26046685585` 通过 deterministic quality gate。

后续提交仍必须显式 stage 相关文件，不得使用 `git add -A`，不得混入历史脏文件、美术候选、zip、artifacts、bgm、`.cursor` 或 `指导大纲/大方向/`。
