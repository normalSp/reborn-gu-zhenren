# 2026-05-17 v0.14.0-b2 山路逃离路线承接交接

## 当前状态

- 当前分支：`codex/v013-npc-faction-reaction`
- 当前阶段：`v0.14.0-b2 青茅离开路线第一刀`
- 状态：已完成实现、验证、提交、推送和远端 CI
- 存档版本：仍为 `SAVE_FORMAT_VERSION = 22`
- DeepSeek 模型：仍为 `deepseek-v4-flash`
- MiroFish：v0.14 三包已通过 intake，本阶段不需要新增包

## 本次完成

1. 新增山路逃离路线承接动作。
   - 新增 `src/engine/v014-qingmao-mountain-pass-route-continuation.ts`。
   - actionId：`qingmao_mountain_pass_route_continuation_probe`。
   - 触发条件：已有逃离青茅山目标、已完成路线准备、已遮掩逃离痕迹，且 `mountain_pass_escape` 为 candidate 或 ready。
   - 阻断原因包括：`missing_escape_goal`、`missing_route_preparation`、`missing_cover_tracks_context`、`route_not_candidate`。

2. Store 接入。
   - `resolveQingmaoMountainPassRouteContinuationAction()` 通过 `action_protocol` 写入现有 v22 字段。
   - 写入范围：`knownFacts`、`factionPressure`、`npcMemories`、`playerGoals`、`actionConsequences`、`worldClock.lastActionId`、`localActionLedger`、`lastWorldActionReturnContext`、`lastLivingWorldPatch`。
   - 不新增存档字段。

3. UI 接入。
   - `FreeGoalPanel` 新增 `路线承接` 区块。
   - `山路逃离路线` 可显示候选状态、缺口、风险和边界。
   - 新增按钮 `承接山路`，`data-testid="free-goal-mountain-pass-route-run"`。

4. 测试和文档。
   - 新增 `src/engine/v014-qingmao-mountain-pass-route-continuation.test.ts`。
   - 更新 `src/store/slices/livingWorldSlice.test.ts`。
   - 新增 `tests/e2e/v014-mountain-pass-route-continuation.spec.ts`。
   - 新增 `v0.14.0-b2-青茅离开路线第一刀.md`。
   - 新增 `v0.14.0-b2-Player-Advocate-20轮走查记录.md`。
   - 更新 v0.14 README、总体大纲、路线图、需求池、真相源、Git 计划、PROJECT-STATE、AGENTS 和项目仪表盘。

## 权限边界

本阶段没有做：

- `route_entered`
- `escape_success`
- 地点或地域解锁
- 阵营转移或身份变化
- 声望/通缉/招揽/任务网络
- 物品、材料、元石、蛊虫、蛊方奖励
- 追击成功/失败结算
- NPC 生死或抓捕
- 隐藏事实揭露
- 正史锚点变更
- DeepSeek 权限扩张
- SAVE_FORMAT_VERSION bump

## 验证

已通过：

```powershell
npm test -- src/engine/v014-qingmao-mountain-pass-route-continuation.test.ts src/store/slices/livingWorldSlice.test.ts --reporter=dot
npx tsc --noEmit --pretty false
npm run test:e2e -- tests/e2e/v014-mountain-pass-route-continuation.spec.ts
npm run check:player-advocate-gate -- "指导大纲/v0.14.0/codex/00-总览/v0.14.0-b2-Player-Advocate-20轮走查记录.md" 20
npm test -- --reporter=dot
npm run build
npm run check:player-visible-copy
npm run check:runtime-assets
npm run check:qingmao-assets
npm run check:production-preview
gh run watch 25988584563 --exit-status
```

结果：

- focused unit：2 个文件，15 个测试通过。
- TypeScript：通过。
- Playwright：1 个测试通过。
- Player Advocate gate：20 轮，95% 下一步理解率，1 个困惑轮次。
- full unit：124 个 test file，703 个测试通过。
- build：通过，无 500KB+ chunk warning，仅 Rolldown plugin timing warning。
- player-visible-copy：242 个文件扫描通过。
- runtime assets：131 个文件，0 zero-byte。
- Qingmao assets：10 entries，active=4。
- production-preview smoke：通过。
- GitHub Actions：run `25988584563` deterministic quality gate 通过。

## Git

本阶段已提交并推送：

- commit：`9bdde59 feat: 建立v0.14青茅路线承接候选`
- remote：`origin/codex/v013-npc-faction-reaction`
- GitHub Actions：`25988584563`，RebornG CI deterministic quality gate 通过

远端证据文档待单独小提交：

- `v0.14.0-Git提交与推送计划.md`
- `v0.11.0-项目仪表盘.md`
- `README.md`
- `v0.14.0-总体开发大纲.md`
- `v0.14.0-b2-青茅离开路线第一刀.md`
- `PROJECT-STATE.md`
- `AGENTS.md`
- 本交接文件

仍不要 stage：

- `.cursor/`
- `RebornG_codebuddy.zip`
- `artifacts/`
- `bgm/`
- `指导大纲/大方向/`
- 本轮出现的 `doc/art/` 未确认改动

Git 维护提示：

- 提交时 Git 仍提示有 unreachable loose objects，可后续单独维护。
- 当前不要擅自运行 `git prune` 或重写历史。

## 下一步

进入 `v0.14.0-b3 阵营目标前置条件展示` 启动复核。

默认口径：

- 不需要新的 MiroFish 包。
- 只展示投靠白家、加入商队、离开古月等长期目标的当前前置、风险和可做小步。
- 不改变阵营，不创建正式招揽/任务，不发奖励，不新增持久字段。

如果 b3 要开放 `faction_transfer`、正式声望/通缉/招揽、任务网络、地点变化、奖励、NPC 生死或 DeepSeek 新权限，必须停下来让用户决策。

