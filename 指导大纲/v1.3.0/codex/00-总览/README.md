# RebornG v1.3.0 Codex 当前入口

状态：rc 本地收束进行中；D-130-009 live probe 规模待用户确认
日期：2026-05-21
主题：NPC 与势力长期关系第二层

## 当前一句话

`v1.3.0` 承接 `v1.1` 的路线/地点状态和 `v1.2` 的低阶生存经济，把玩家行为对 NPC、势力、公开事件和社会压力的长期影响做成第二层地基。v1.3 不默认新增持久社会字段，不默认开放正式阵营转移、通缉结论、招募成功、任务奖励或 NPC 生死。

## 当前入口文件

- `v1.3.0-专家团启动会纪要.md`
- `v1.3.0-启动审查与范围冻结.md`
- `v1.3.0-总体开发大纲.md`
- `v1.3.0-小版本执行路线图.md`
- `v1.3.0-需求决策池.md`
- `v1.3.0-a0-治理补丁与范围冻结.md`
- `v1.3.0-a1-NPC势力关系save-format设计门禁.md`
- `v1.3.0-a2-MiroFish-NPC势力关系topic-slice-intake.md`
- `v1.3.0-b1-关系证据与社会压力projection-only第一刀.md`
- `v1.3.0-b1-Player-Advocate-30轮走查记录.md`
- `v1.3.0-b1-长线叙事漂移检查记录.md`
- `v1.3.0-b2-社会压力projection-only硬化.md`
- `v1.3.0-b3-NPC接触窗口projection-only.md`
- `v1.3.0-b4-势力前置条件projection-only.md`
- `v1.3.0-process-1-社会反刷save兼容与回滚复核.md`
- `v1.3.0-process-2-长线漂移与知识库复核.md`
- `v1.3.0-rc-Player-Advocate-100轮走查记录.md`
- `v1.3.0-rc-live-probe执行方案待确认.md`
- `v1.3.0-rc-Skill同步审计记录.md`
- `v1.3.0-rc-质量收束记录.md`
- `v1.3.0-真相源索引.md`
- `v1.3.0-测试矩阵.md`
- `v1.3.0-MiroFish资料需求与交付协议.md`
- `v1.3.0-Git提交与推送计划.md`

## 已获批准

用户已批准 D-130-001 至 D-130-008：

1. v1.3 主线为 `NPC 与势力长期关系第二层`。
2. v1.3 采用 a0/a1/a2 先于 runtime。
3. b1 默认 projection-only，不默认 bump save format。
4. a1 严肃评估 `SAVE_FORMAT_VERSION = 25` 与单一社会聚合对象，但不等于批准实际落地。
5. v1.3 禁止默认开放正式阵营转移、通缉结论、招募成功、任务奖励或 NPC 生死。
6. MiroFish 初始为 preferred；正式命名 NPC allowlist、通缉、招揽、隐藏事实邻近规则升级为 blocking。
7. rc Player Advocate 采用 100/120 轮分级。
8. 不自动部署 EdgeOne，不写 public release wording，不扩大 DeepSeek 权限。

用户另行批准 D-130-009：

- v1.3-rc 必跑 live probe，模型固定 `deepseek-v4-flash`；成本、样本数和轮次必须到 rc 前按实际 scope 再给用户拍板确认。

## 本轮 a0 治理补丁

v1.3-a0 先补制度，不写 runtime：

- 建立 `指导大纲/流程制度/Skill同步审计制度.md`。
- 把 v1.3 启动包、MiroFish 基础包主题切片、skill sync audit、rc live probe 预案写入当前版本文档。
- 记录 `reverend-insanity-lore` 当前口径曾落后于 v1.2 b1，后续必须通过 skill sync audit 防止再漏。
- 明确 `mirofish-reborng-export` 不并入专家团 skill，只做生产/导出桥接；RebornG 仍通过 intake review 吸收候选。

## 本轮 a1 save-format 门禁

v1.3-a1 已完成设计门禁，不写 runtime：

- 核对当前 `SAVE_FORMAT_VERSION = 24` 与既有 `livingWorldState.npcMemories`、`factionPressure`、`actionConsequences`。
- 明确旧字段 `npcRelations`、`standings`、`npcContacts`、`dynamicNPCs` 暂不作为 v1.3 社会关系权威。
- 专家团建议 b1 采用 projection-only，不 bump v25，不新增 `socialRelationState`。
- 若后续 b2/b3 证明必须持久化，再单独进入 `SAVE_FORMAT_VERSION = 25` 小门禁。
- 列出 D-131-001 至 D-131-007；用户已全部批准。

## 本轮 a2 MiroFish topic-slice intake

v1.3-a2 已完成资料门禁，不写 runtime：

- 复核 v0.13 三包：NPC memory/motive、faction pressure、public event chronicle 继续作为 v1.3 candidate/rule/test 后勤。
- 复核全书基础包：只作为 archive/source-pointer inventory 和 coverage gap，不整包吸收。
- 将 NPC 记忆、势力压力、公开事件、hidden boundary、formal social blocking 分流。
- 将新增样本同步到 `V13-*` 测试矩阵。
- 结论：b1 可进入 projection-only 第一刀，不需要新 MiroFish 包或 live extraction。

## 本轮 b1 runtime 第一刀

v1.3-b1 已完成本地 runtime 第一刀：

- 新增世界面板 `社会` 页签。
- 新增 `buildV130SocialPressureProjection()`，只读现有 `livingWorldState` 和本地行动账本。
- 复用 v0.13 已审查的本地规则投影器，把公开证据显示为势力压力、记忆痕迹、公开事件和社会后续候选。
- 不 bump `SAVE_FORMAT_VERSION = 25`，当前仍为 `24`。
- 不新增 `socialRelationState`。
- 不从旧字段 `npcRelations`、`standings`、`npcContacts`、`dynamicNPCs` 推导权威。
- 不写正式关系、声望、通缉、招揽、封锁、阵营、奖励或 NPC 生死。
- 聚焦 unit、typecheck、focused e2e、30 轮 Player Advocate 与 T0-lite drift 均通过。

## 本轮 b2 projection-only 硬化

v1.3-b2 已完成本地小刀：

- 不进入 `SAVE_FORMAT_VERSION = 25`。
- 不新增 `socialRelationState`。
- 新增 `projectionAudit`，把无持久写入、旧字段不权威、MiroFish 非 runtime、DeepSeek 无新权限变成 helper 返回值。
- 世界 `社会` 页签新增 `投影审计` 区块。
- 聚焦 unit、typecheck、focused e2e 通过。

## 本轮 b3 NPC 接触窗口

v1.3-b3 已完成本地第一刀：

- 新增 `npcContactWindows` projection 输出。
- 世界 `社会` 页签新增 `NPC 接触窗口` 区块。
- 只显示解释、递话、避开、公开调查等前置窗口。
- 不写好感度、不创建正式命名 NPC runtime rule、不写 NPC 生死。
- 聚焦 unit、typecheck、focused e2e 通过。

## 本轮 b4 势力前置条件

v1.3-b4 已完成本地第一刀：

- 新增 `factionPreconditions` projection 输出。
- 世界 `社会` 页签新增 `势力前置条件` 区块。
- 只显示招揽前置、通缉风险、封锁压力、任务流程压力和交易窗口。
- 不写通缉、不写招揽或阵营变化、不写正式封锁/追捕结果、不创建任务、不发奖励。
- 聚焦 unit、typecheck、focused e2e 通过。

## 本轮 process/rc 本地收束

已建立：

- process-1：社会反刷、save 兼容与回滚复核。
- process-2：deterministic 长线漂移与知识库复核。
- rc Player Advocate：100 轮记录。
- rc live probe：执行方案待用户确认。
- Skill sync audit：因 live probe 未执行，最终 complete 口径延后。
- rc 质量记录：明确 live probe 未执行前不能声称最终完成。

## 硬边界

- b1 不新增 save 字段。
- b1 不 bump `SAVE_FORMAT_VERSION = 25`。
- 不让 DeepSeek 写正式关系、阵营、通缉、招募、奖励、NPC 生死或隐藏事实。
- 不整包导入全书 MiroFish 基础包。
- 不让 MiroFish、知识库或 skill 成为 runtime/canon authority。
- 不自动部署 EdgeOne。

## 下一步

下一步必须停在 live probe 决策：

- 推荐方案：4 样本 x 3 轮，`deepseek-v4-flash`，允许一次 clean re-probe。
- 备选低成本：3 样本 x 2 轮。
- 备选高强度：5 样本 x 4 轮。
- 用户确认前，不执行 live probe，不写 v1.3 complete。
- rc live probe 必跑，但成本、样本、轮次和通过标准仍需 rc 前让用户确认。
