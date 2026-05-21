# RebornG v1.6.0 Codex 入口

状态：completed local milestone
日期：2026-05-21
主题：内容生产、canon schema 与长测工厂

## 一句话

`v1.6.0` 已完成本地开发里程碑：把 MiroFish 全书基础包、知识索引、canon schema、测试样本、长测 replay/eval 和过期入口检查从“文档制度”推进成“report-only 工具链 + 可审计报告 + 可追溯入口”。

这不是新玩法版本：没有改 runtime，没有 bump `SAVE_FORMAT_VERSION = 24`，没有扩 DeepSeek 权限，没有把全书基础包整包导入知识库、runtime 或 prompt，也没有自动部署 EdgeOne。

## 当前入口文件

- `v1.6.0-专家团启动会纪要.md`
- `v1.6.0-启动审查与范围冻结.md`
- `v1.6.0-总体开发大纲.md`
- `v1.6.0-小版本执行路线图.md`
- `v1.6.0-需求决策池.md`
- `v1.6.0-a0-治理补丁与范围冻结.md`
- `v1.6.0-a1-内容知识库canon-schema设计门禁.md`
- `v1.6.0-a2-MiroFish基础包inventory设计门禁.md`
- `v1.6.0-b1-MiroFish基础包inventory-checker-report-only第一刀.md`
- `v1.6.0-b2-知识索引边界checker-report-only第一刀.md`
- `v1.6.0-b3-MiroFish-intake晋升链checker-report-only第一刀.md`
- `v1.6.0-b4-长测replay-eval工厂骨架.md`
- `v1.6.0-b5-过期入口checker-report-only第一刀.md`
- `v1.6.0-process-1-流程减法与冗余复核.md`
- `v1.6.0-process-2-长线漂移与测试矩阵整合.md`
- `v1.6.0-rc-Skill同步审计记录.md`
- `v1.6.0-rc-质量收束记录.md`
- `v1.6.0-MiroFish基础包使用方案.md`
- `v1.6.0-真相源索引.md`
- `v1.6.0-测试矩阵.md`
- `v1.6.0-Git提交与推送计划.md`

## 已落地脚本

- `npm run check:mirofish-base-pack-inventory`
- `npm run check:knowledge-index-boundaries`
- `npm run check:mirofish-intake-promotions`
- `npm run check:v160-long-test-replay`
- `npm run check:stale-entrypoints`

所有新增脚本第一版均为 report-only，不自动修复、不自动晋升、不进入 CI hard gate。

## 完成边界

完成：

- 基础包 2340 章 inventory 结构检查。
- 知识索引 schema / visibility / promotionStatus / allowedUses / forbiddenUses 边界检查。
- MiroFish/source pointer -> intake review -> knowledge entry -> test matrix 的晋升链检查。
- 长测 replay/eval dry-run 骨架。
- 过期入口检查器第一版。
- v1.6 测试矩阵、skill sync、handoff、仪表盘收束。

未完成且不得暗示完成：

- 全书知识库内容导入。
- runtime canon 晋升。
- DeepSeek 可见知识摘要或 RAG。
- 几百回合 live narrative quality 长测。
- 正式地点、阵营、奖励、NPC 生死、隐藏事实可见化。

## 下一步建议

下一步建议开 v1.7 专家团启动会，先决定“第一个可控 topic-slice / 区域活世界测试目标”，再让 v1.6 工具链为它服务。
