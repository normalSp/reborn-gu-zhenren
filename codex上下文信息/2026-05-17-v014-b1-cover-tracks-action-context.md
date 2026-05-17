# 2026-05-17 v0.14.0-b1 遮掩逃离痕迹前置行动交接

## 当前状态

- 当前分支：`codex/v013-npc-faction-reaction`
- 当前阶段：`v0.14.0-b1 候选后续到正式前置行动桥`
- 状态：已完成实现、验证、提交、推送和远端 CI
- 存档版本：仍为 `SAVE_FORMAT_VERSION = 22`
- DeepSeek 模型：仍为 `deepseek-v4-flash`
- MiroFish：v0.14 三包已通过 intake，本阶段不需要新增包

## 本次完成

1. 新增正式前置行动样板：`遮掩逃离痕迹`。
   - 新增 `src/engine/v014-qingmao-cover-escape-tracks.ts`。
   - actionId：`qingmao_cover_escape_tracks_probe`。
   - 触发条件：已有逃离青茅山目标，或已有路线准备上下文。
   - 无上下文时阻断为 `missing_escape_route_context`。

2. Store 接入。
   - `resolveQingmaoCoverEscapeTracksAction()` 通过 `action_protocol` 写入现有 v22 字段。
   - 写入范围：`knownFacts`、`factionPressure`、`npcMemories`、`playerGoals`、`actionConsequences`、`worldClock.lastActionId`、`localActionLedger`、`lastWorldActionReturnContext`、`lastLivingWorldPatch`。
   - 不新增存档字段。

3. UI 接入。
   - `FreeGoalPanel` 的 `社会影响 / 局势后续` 中，`followup_prepare_public_reason` 显示为 `可执行前置行动，不是任务`。
   - 新增按钮 `遮掩痕迹`，`data-testid="free-goal-cover-tracks-run"`。

4. 测试和文档。
   - 新增 `src/engine/v014-qingmao-cover-escape-tracks.test.ts`。
   - 更新 `src/store/slices/livingWorldSlice.test.ts`。
   - 新增 `tests/e2e/v014-cover-tracks-action.spec.ts`。
   - 新增 `v0.14.0-b1-候选后续到正式前置行动桥.md`。
   - 新增 `v0.14.0-b1-Player-Advocate-20轮走查记录.md`。
   - 更新 v0.14 README、路线图、总体大纲、需求池、测试矩阵、Git 计划、PROJECT-STATE、AGENTS 和项目仪表盘。

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
npm test -- src/engine/v014-qingmao-cover-escape-tracks.test.ts src/store/slices/livingWorldSlice.test.ts --reporter=dot
npx tsc --noEmit --pretty false
npm run test:e2e -- tests/e2e/v014-cover-tracks-action.spec.ts
npm run check:player-advocate-gate -- "指导大纲/v0.14.0/codex/00-总览/v0.14.0-b1-Player-Advocate-20轮走查记录.md" 20
npm test -- --reporter=dot
npm run build
npm run check:player-visible-copy
npm run check:runtime-assets
npm run check:qingmao-assets
npm run check:production-preview
gh run watch 25987158730 --exit-status
```

结果：

- focused unit：2 个文件，15 个测试通过。
- TypeScript：通过。
- Playwright：1 个测试通过。
- Player Advocate gate：20 轮，95% 下一步理解率，1 个困惑轮次。
- full unit：123 个 test file，700 个测试通过。
- build：通过，无 500KB+ chunk warning，仅 Rolldown plugin timing warning。
- player-visible-copy：241 个文件扫描通过。
- runtime assets：131 个文件，0 zero-byte。
- Qingmao assets：10 entries，active=4。
- production-preview smoke：通过。
- GitHub Actions：run `25987158730` deterministic quality gate 通过。

## Git

本阶段已提交并推送：

- commit：`77a98e1 feat: 接入v0.14路线前置行动样板`
- remote：`origin/codex/v013-npc-faction-reaction`
- GitHub Actions：`25987158730`，RebornG CI deterministic quality gate 通过

本次只 stage v0.14-b1 相关文件，未使用 `git add -A`。

仍不要 stage：

- `RebornG_codebuddy.zip`
- `artifacts/`
- `bgm/`
- `指导大纲/大方向/`

Git 维护提示：

- 提交时 Git 提示有较多 unreachable loose objects，可后续单独维护。
- 当前不要擅自运行 `git prune` 或重写历史。

## 下一步

进入 `v0.14.0-b2 青茅离开路线第一刀` 启动复核。

必须先判断：

- b2 是否只用现有 v22 字段表达 route continuation。
- b2 是否需要新增正式 route state。
- b2 是否会产生地点变化、路线成功判定或新持久字段。

如果需要正式 route state、地点变化、save format bump、阵营变化、奖励、NPC 生死或 DeepSeek 新权限，必须停下来让用户决策。
