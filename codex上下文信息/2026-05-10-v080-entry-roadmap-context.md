# v0.8.0 入场路线图交接

时间：2026-05-10  
分支：`codex/v070-release-closure` -> `codex/v080-roadmap`  
阶段：v0.8.0-pre 工程入场

## 本次目标

用户要求把当前代码推上 GitHub，并判断是否可以进入 v0.8.0。如果可以，需要把 v0.8.0 全部大纲拆成小版本、明确每个小版本的目标与里程碑，并写成后续开发可直接使用的详细文件。

## 关键结论

- 可以进入 `v0.8.0-pre`。
- 进入前必须先收束并推送当前 `codex/v070-release-closure`。
- v0.8.0 后续开发不应长期留在 v0.7 收束分支，应从已推送点创建 `codex/v080-roadmap`，再进入 `codex/v080-a1-combat-engine`。
- 本机 skill `C:\Users\11411\.codex\skills\reborn-combat-motion\SKILL.md` 不会自动进入 GitHub，所以新增了仓库镜像文档。

## 新增文档

- `指导大纲/v0.8.0/codex/00-总览/v0.8.0-小版本执行路线图.md`
  - 固化 `v0.8.0-pre/a1/a2/a3/b1/b2/b3/c1/c2/rc` 的目标、交付和验收。
  - 明确凡战优先、DeepSeek 不结算、路径名来自 canon、仙蛊屋暂不做运行时系统。
- `指导大纲/v0.8.0/codex/04-前端动效/reborn-combat-motion-SKILL.md`
  - 作为本机 skill 的仓库镜像，供 GitHub 追踪和后续恢复。

## 后续入口

下一阶段优先执行 `v0.8.0-a1`：

1. 从 `src/canon/gu-expression-specs.json` 和 `src/canon/killer-move-expression-specs.json` 读取首批凡蛊/杀招规格。
2. 建立 5x3 `BattlefieldCombatState` 纯本地结算入口。
3. 所有正式战斗表现输出为 `BattleResolutionStep[]`。
4. UI 和动效不得私算战斗结果。

## 必跑验证

- `npm test`
- `npm run build`
- `npm run test:e2e:long`

涉及 UI/动效阶段还必须做桌面、移动端和 reduced motion 验收。
