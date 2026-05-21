# RebornG v1.5.0 Codex 入口

状态：v1.5.0 本地开发里程碑完成
日期：2026-05-21
主题：冲突、追杀、杀招与小队后果解释层第一阶段

## 当前一句话

`v1.5.0` 已在不 bump `SAVE_FORMAT_VERSION = 24`、不新增 `conflictConsequenceState` / `pursuitState` / `combatAftermathState`、不扩大 DeepSeek authority 的前提下，完成 projection-first 冲突后果解释层。世界面板新增 `冲突` tab，能把 v1.1 路线、v1.2 生存压力、v1.3 社会压力、v1.4 区域姿态和既有战斗证据组合成玩家可读的风险来源、追杀注意窗口、反制缺口和小队/阵法准备度。

D-150-001 至 D-150-010、D-151-001 至 D-151-010 均已获用户批准并落地。

## 当前入口文件

- `v1.5.0-专家团启动会纪要.md`
- `v1.5.0-启动审查与范围冻结.md`
- `v1.5.0-总体开发大纲.md`
- `v1.5.0-小版本执行路线图.md`
- `v1.5.0-需求决策池.md`
- `v1.5.0-a0-治理补丁与范围冻结.md`
- `v1.5.0-a1-冲突追杀杀招小队save-format设计门禁.md`
- `v1.5.0-a2-MiroFish-战斗追杀杀招小队topic-slice-intake.md`
- `v1.5.0-b1-冲突后果projection-first第一刀.md`
- `v1.5.0-b1-Player-Advocate-30轮走查记录.md`
- `v1.5.0-b2-追杀截杀压力窗口.md`
- `v1.5.0-b3-杀招反制与失败代价可读性.md`
- `v1.5.0-b4-小队阵法前置条件.md`
- `v1.5.0-process-1-冲突反刷save兼容与回滚复核.md`
- `v1.5.0-process-2-长线漂移与知识库复核.md`
- `v1.5.0-rc-Player-Advocate-100轮走查记录.md`
- `v1.5.0-rc-live-probe复核记录.md`
- `v1.5.0-rc-Skill同步审计记录.md`
- `v1.5.0-rc-质量收束记录.md`
- `v1.5.0-真相源索引.md`
- `v1.5.0-测试矩阵.md`
- `v1.5.0-MiroFish资料需求与交付协议.md`
- `v1.5.0-Git提交与推送计划.md`

## 完成内容

- 新增纯 engine `buildV150ConflictAftermathProjection()`。
- 世界面板新增 `冲突` tab 与 `ConflictAftermathPanel`。
- a2 复核 v0.17 战斗/杀招/小队/阵法历史资料；未请求或导入新 MiroFish 包。
- b1-b4 完成路线伏击风险、追杀注意窗口、反制缺口、小队/阵法准备度四类只读解释。
- process-1 完成反刷、旧档、回滚复核。
- process-2 完成长线漂移、知识库、隐藏事实复核；live probe 因无 DeepSeek prompt/context/authority 变化而豁免。
- rc 完成 100 轮 Player Advocate、Skill 同步审计与质量收束。

## 未开放边界

- 不开放正式战斗后果持久字段。
- 不开放正式掉落池、稀有蛊、仙蛊、完整杀招传承。
- 不写 NPC 生死、捕获、背叛、永久伤残。
- 不写正式阵营敌对、通缉、追杀、封锁或招揽结论。
- 不写正式地点/路线/城市进入。
- 不让 DeepSeek 结算战斗、奖励、生死、地点、阵营或 canon 事实。
- 不新增大规模战斗动效/美术资产包。
- 不自动部署 EdgeOne，不更新公开发布口径。

## 下一步

建议下一步先开 `v1.6` 专家团启动会，围绕内容生产、canon schema、长测工厂、知识库/测试样本工厂和过期入口自动检查做范围冻结。
