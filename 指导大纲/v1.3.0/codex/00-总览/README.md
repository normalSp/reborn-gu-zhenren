# RebornG v1.3.0 Codex 当前入口

状态：a0 启动包已建立；D-130-001 至 D-130-009 已记录为用户批准；尚未进入 runtime
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

## 硬边界

- 不新增 save 字段，除非 a1 后用户批准。
- 不把 `SAVE_FORMAT_VERSION = 25` 当成默认结论。
- 不让 DeepSeek 写正式关系、阵营、通缉、招募、奖励、NPC 生死或隐藏事实。
- 不整包导入全书 MiroFish 基础包。
- 不让 MiroFish、知识库或 skill 成为 runtime/canon authority。
- 不自动部署 EdgeOne。

## 下一步

进入 `v1.3.0-a1-NPC势力关系save-format设计门禁.md`，详细评估：

- 是否需要 `SAVE_FORMAT_VERSION = 25`。
- 是否需要单一 `socialRelationState` 或同类聚合对象。
- b1 是否保持 projection-only。
- 命名 NPC allowlist、关系证据、势力压力、公开编年史各自的权限边界。
- Player Advocate、deterministic drift、live probe 和 MiroFish blocking 条件。
