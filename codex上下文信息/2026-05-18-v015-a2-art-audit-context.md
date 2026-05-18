# 2026-05-18 v0.15-a2 与美术资源盘点交接

## 当前状态

- `v0.15.0-a1` 设计门禁已完成。
- `v0.15.0-a2` 候选规则池与 schema 第一刀已完成。
- 按用户新指令，`v0.15-a` 完成后暂停进入 b1，并先完成项目美术资源盘点。

## a2 交付

新增：

- `src/canon/qingmao-low-rank-economy-rules.json`
- `src/canon/qingmao-low-rank-economy-rules.test.ts`
- `src/engine/v015-qingmao-low-rank-economy.ts`
- `src/engine/v015-qingmao-low-rank-economy.test.ts`
- `指导大纲/v0.15.0/codex/00-总览/v0.15.0-a2-候选规则池与schema第一刀.md`

规则池：

- 当前候选规则：24 条。
- 灰色交易延期边界：10 条。
- 输出只读预览，不写 store、不改 UI、不发奖励、不新增存档字段、不开放市场/黑市/委托、不扩张 DeepSeek。

## 美术盘点

新增：

- `指导大纲/v0.15.0/codex/00-总览/v0.15.0-art-audit-美术资源盘点.md`

结论：

- 当前本地工作区有 180 个图片/视觉文件，45 个 public audio，20 个 bgm/ 本地音频。
- 青茅 S0 蛊图 59 个 runtime 文件全部已在 `GU_IMAGE_MAP` 映射。
- 原著角色图 25 个，其中方源/方正 style-sample 与正式图完全重复。
- 场景资源是 v1.0 风险点：磁盘资源多于 visual manifest 登记，需要专项治理。
- 精确重复 30 组，其中 27 组是候选图复制入库后的正常重复。
- 建议开 `v0.15-art-audit-1 美术资源治理与 v1.0 发布支撑专项`，先做 manifest、状态、候选/重复清单，不删图、不进玩法。

## 验证

已通过：

```powershell
npm test -- src/canon/qingmao-low-rank-economy-rules.test.ts src/engine/v015-qingmao-low-rank-economy.test.ts
npx tsc --noEmit --pretty false
npm test -- --reporter=dot
npm run build
```

结果：

- focused tests：2 个 test file，13 个测试通过。
- TypeScript：通过。
- full unit：127 个 test file，720 个测试通过。
- build：通过，无 500KB+ chunk warning，仅 Rolldown plugin timing warning。

## 当前决策点

需要用户决策：

1. 是否批准开 `v0.15-art-audit-1`。
2. 是否保留/归档方源、方正 style-sample 与风格母版 candidate。
3. 战斗图候选是否按 roadmap 已接受项进入后续正式入库候选。
4. v1.0 hero 三件套是否现在挑选，还是等发布专项。

在这些决策前，不进入 `v0.15.0-b1`。

## Git 注意

- 不使用 `git add -A`。
- 只 stage v0.15-a 与美术盘点相关文件。
- 不纳入历史未跟踪资源：`.cursor/`、`RebornG_codebuddy.zip`、`artifacts/`、`bgm/`、`doc/art/candidates/`、`doc/art/style-lock/`、`public/rebrng/...` 资产文件等，除非用户后续明确要求。
