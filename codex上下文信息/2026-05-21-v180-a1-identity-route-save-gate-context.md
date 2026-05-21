# 2026-05-21 v1.8-a1 身份路线与差异度设计门禁交接

## 当前状态

- 当前分支：`codex/v180-a1-identity-route-save-gate`
- 基线：`4cba0c3 docs: 开启v1.8专家团启动会`
- 当前阶段：`v1.8.0-a1-低阶身份路线与差异度save-format设计门禁`
- 用户已批准：D-180-001 至 D-180-012。
- 用户特别边界：D-180-005 批准为候选，不作为正式身份。

## 本阶段落地

- 建立 `v1.8.0-a1-低阶身份路线与差异度save-format设计门禁.md`。
- 将 D-180 写入决策池为已批准。
- 新增 D-181-001 至 D-181-010，等待用户审批后才能进入 a2/runtime。
- 更新 README、路线图、测试矩阵、MiroFish 协议、Git 计划、真相源索引、启动审查、项目仪表盘、PROJECT-STATE、AGENTS。
- 同步外部 skill：`reborn-expert-council`、`game-dev-text`、`reverend-insanity-lore`、`mirofish-reborng-export`。
- `reborn-combat-motion` 本阶段记录为 `no_update_needed`。

## 关键口径

- 五类低阶身份只作为候选标签、测试样本和 MiroFish topic-slice 输入：
  - 商队学徒/临时帮工
  - 散修短工
  - 低阶护卫/护送候选
  - 采集跑腿
  - 情报跑腿/传话人
- 它们不是正式身份、职业、阵营、工资、任务、奖励或 NPC 命运结论。
- a1 推荐 b1 保持 `SAVE_FORMAT_VERSION = 24`。
- a1 推荐不新增 `identityRouteState`、`professionState`、`runFingerprint`、`regionalEventLedger`。
- a2 若获批，身份路线 topic-slice 升级为 blocking，但只允许晋升 RebornG-owned candidate/rule/test material。

## 当前禁止项

- 不改 runtime。
- 不 bump save format。
- 不写 MiroFish request/export/intake。
- 不扩 DeepSeek prompt/context/model/authority。
- 不开放正式地点、阵营、奖励、工资、价格、任务、NPC 生死。
- 不开放 hidden/private 可见化、DeepSeek RAG、可见全书摘要。
- 不启用子代理，不自动部署 EdgeOne。

## 验证记录

- `npm run check:stale-entrypoints`：通过，P0=0，P1=0，P2=0，Info=0。脚本生成的一次性 report 已删除，避免把 artifact 混入本阶段提交。
- `git diff --check`：通过；仅 Git 换行风格提示。
- 定向 stale 文案扫描：无 D-180 待审批、a0 active、D-180 pending 等旧口径命中。

## 下一步

等待用户审批 D-181-001 至 D-181-010。若批准，进入：

`v1.8.0-a2-MiroFish-低阶身份路线topic-slice-intake.md`

进入 a2 前应按 Git 制度切到：

`codex/v180-a2-identity-topic-slice-intake`
