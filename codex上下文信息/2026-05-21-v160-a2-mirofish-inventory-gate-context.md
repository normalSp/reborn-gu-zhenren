# 2026-05-21 v1.6-a2 MiroFish 基础包 inventory 门禁交接

## 当前状态

- 当前分支：`codex/v160-a2-mirofish-inventory-gate`
- 基线分支：`codex/v160-a1-content-schema-gate`
- 用户已批准：D-160-001 至 D-160-012、D-161-001 至 D-161-010
- 当前 active draft：`v1.6.0-a2-MiroFish基础包inventory设计门禁.md`
- 下一道用户决策：D-162-001 至 D-162-010

## 本次落地

- 建立 `指导大纲/v1.6.0/codex/00-总览/v1.6.0-a2-MiroFish基础包inventory设计门禁.md`。
- 将 v1.6 入口从 a1 更新为 a2。
- 将 D-161 全部记录为已批准。
- 新增 D-162 决策池，等待用户批准后才能实现基础包 inventory checker。
- 同步 `指导大纲/项目仪表盘.md`、`PROJECT-STATE.md`、`AGENTS.md` 和 v1.6 docs。
- 同步触发 skill：
  - `reborn-expert-council`：updated 到 v1.6-a2。
  - `game-dev-text`：updated 到 v1.6-a2。
  - `reverend-insanity-lore`：updated 到 v1.6-a2。
  - `mirofish-reborng-export`：updated 到 v1.6-a2 bridge。
  - `reborn-combat-motion`：no_update_needed，a2 不触发 runtime、战斗表现、动效或视觉资产。

## a2 结论

a2 只冻结未来 `check:mirofish-base-pack-inventory` 的设计：

- 输入边界：只读 RebornG 导出的基础包 manifest、coverage、章节 JSON；禁止读 MiroFish 原始 sourceDir、原著正文、runtime canon 和知识库。
- 检查项：manifest、coverage、章节连续性、JSON parse、forbidden text keys、runtime/deepSeek 可见权限字段。
- 严重级别：P0/P1/P2/Info。
- 报告 schema：建议输出到 `artifacts/v1.6.0/mirofish-base-pack-inventory/<timestamp>/report.json`。
- 行为边界：report-only，不自动修复、删除、移动、晋升或加入 CI hard gate。

a2 不做：

- 不改 runtime。
- 不 bump `SAVE_FORMAT_VERSION = 24`。
- 不新增脚本。
- 不运行全量基础包扫描。
- 不读取 MiroFish 原始 sourceDir。
- 不吸收基础包内容。
- 不新增知识库条目。
- 不新增 canon 文件。
- 不扩 DeepSeek 权限。
- 不做 public wording 或 EdgeOne 部署。

## D-162 待用户批准

1. D-162-001：是否批准 `check:mirofish-base-pack-inventory` 的输入边界。
2. D-162-002：是否批准 manifest / coverage / chapter 文件三层检查项。
3. D-162-003：是否批准 2340 章、0001-2340 连续性、sourcePointersBad=0 作为当前基线。
4. D-162-004：是否批准 forbidden text key 列表。
5. D-162-005：是否批准 P0/P1/P2/Info 严重级别。
6. D-162-006：是否批准 report-only 输出到 `artifacts/v1.6.0/mirofish-base-pack-inventory/<timestamp>/report.json`。
7. D-162-007：是否批准脚本只能报告、不能自动修复/删除/晋升。
8. D-162-008：是否批准 inventory 通过仅代表 archive inventory 通过，不代表知识库/canon/DeepSeek 通过。
9. D-162-009：是否批准 `check:mirofish-base-pack-inventory` 第一版不加入 CI hard gate。
10. D-162-010：是否批准 D-162 后先实现基础包 inventory checker report-only 第一刀，再进入知识索引边界 checker。

## 下一步

若用户批准 D-162-001 至 D-162-010，进入：

`指导大纲/v1.6.0/codex/00-总览/v1.6.0-b1-MiroFish基础包inventory-checker-report-only第一刀.md`

进入 b1 前仍不得实现其它 checker，不得把 inventory 通过误写成知识库/canon/DeepSeek 通过，不得加入 CI hard gate。
