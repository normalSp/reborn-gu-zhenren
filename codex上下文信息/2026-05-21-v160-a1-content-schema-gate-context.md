# 2026-05-21 v1.6-a1 内容知识库 canon schema 门禁交接

## 当前状态

- 当前分支：`codex/v160-a1-content-schema-gate`
- 基线分支：`codex/v160-startup-council`
- 用户已批准：D-160-001 至 D-160-012
- 当前 active draft：`v1.6.0-a1-内容知识库canon-schema设计门禁.md`
- 下一道用户决策：D-161-001 至 D-161-010

## 本次落地

- 建立 `指导大纲/v1.6.0/codex/00-总览/v1.6.0-a1-内容知识库canon-schema设计门禁.md`。
- 将 v1.6 入口从 a0 更新为 a1。
- 将 D-160 全部记录为已批准。
- 新增 D-161 决策池，等待用户批准后才能进入 a2。
- 同步 `指导大纲/项目仪表盘.md`、`PROJECT-STATE.md`、`AGENTS.md` 和 v1.6 docs。
- 同步触发 skill：
  - `reborn-expert-council`：updated 到 v1.6-a1。
  - `game-dev-text`：updated 到 v1.6-a1。
  - `reverend-insanity-lore`：updated 到 v1.6-a1。
  - `mirofish-reborng-export`：updated 到 v1.6-a1 bridge。
  - `reborn-combat-motion`：no_update_needed，a1 不触发 runtime、战斗表现、动效或视觉资产。

## a1 结论

a1 只冻结 schema 与晋升链：

- 知识索引最小 schema。
- `promotionStatus` 九态。
- `visibility` 五态。
- `allowedUses` / `forbiddenUses`。
- canon 草案 schema。
- 测试样本 schema。
- MiroFish 基础包 -> topic-slice intake -> RebornG 知识索引 -> fact-card/rule/test sample draft -> current version gate -> focused tests/Player Advocate/drift gate -> runtime canon subset 晋升链。

a1 不做：

- 不改 runtime。
- 不 bump `SAVE_FORMAT_VERSION = 24`。
- 不新增脚本。
- 不读取或吸收 MiroFish 基础包内容。
- 不批量导入知识库。
- 不生成 runtime canon 文件。
- 不扩 DeepSeek 权限。
- 不做 public wording 或 EdgeOne 部署。

## D-161 待用户批准

1. D-161-001：是否批准 a1 的知识索引最小 schema。
2. D-161-002：是否批准 `promotionStatus` 九态定义。
3. D-161-003：是否批准 `visibility` 五态定义。
4. D-161-004：是否要求每条知识索引必须有 `allowedUses` / `forbiddenUses`。
5. D-161-005：是否批准 canon 草案只作为 draft，不在 v1.6-a1 创建 runtime canon 文件。
6. D-161-006：是否批准测试样本 schema 并接入测试矩阵演进规则。
7. D-161-007：是否批准晋升链缺失时工具只能 report failure，不能自动补链或晋升。
8. D-161-008：是否批准 b1/b2/b3/b4 工具初始全部 report-only。
9. D-161-009：是否批准任何 CI hard gate 需要 rc 或单独用户决策。
10. D-161-010：是否批准 a2 先做 MiroFish 基础包 inventory 设计门禁，再实现任何检查脚本。

## 下一步

若用户批准 D-161-001 至 D-161-010，进入：

`指导大纲/v1.6.0/codex/00-总览/v1.6.0-a2-MiroFish基础包inventory设计门禁.md`

进入 a2 前仍不得实现 checker，不得扫描并吸收基础包内容，不得把基础包变成知识库/runtime/DeepSeek authority。
