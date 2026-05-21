# RebornG v1.6.0 Codex 当前入口

状态：v1.6-a1 active draft
日期：2026-05-21
主题：内容生产、canon schema 与长测工厂

## 当前一句话

`v1.6.0` 建议承接 v1.1-process-2 的长期叙事漂移制度和全书知识库治理制度，把 MiroFish 全书基础包、知识索引、canon schema、测试样本、长测 replay/eval 和过期入口检查从“文档制度”推进成“可检查、可复用、可回滚的生产工厂”。

这不是新玩法版本，不默认改 runtime，不 bump `SAVE_FORMAT_VERSION`，不扩 DeepSeek 权限，不把全书基础包整包导入知识库、runtime 或 prompt。

## 当前入口文件

- `v1.6.0-专家团启动会纪要.md`
- `v1.6.0-启动审查与范围冻结.md`
- `v1.6.0-总体开发大纲.md`
- `v1.6.0-小版本执行路线图.md`
- `v1.6.0-需求决策池.md`
- `v1.6.0-a0-治理补丁与范围冻结.md`
- `v1.6.0-a1-内容知识库canon-schema设计门禁.md`
- `v1.6.0-MiroFish基础包使用方案.md`
- `v1.6.0-真相源索引.md`
- `v1.6.0-测试矩阵.md`
- `v1.6.0-Git提交与推送计划.md`

## 专家团建议

v1.6 主线建议为：

`内容生产、canon schema 与长测工厂`

优先做：

- MiroFish 基础包 inventory / coverage / quote-redacted 状态检查。
- 知识索引条目 schema 与边界检查。
- MiroFish intake -> 知识索引 -> 测试矩阵 -> runtime canon 的引用链检查。
- 长线叙事漂移 replay/eval 样本工厂。
- 过期入口 / 历史 active draft / 旧门禁残留的自动检查。

暂不做：

- 全书知识库整包导入。
- DeepSeek 大上下文或全书检索运行时接入。
- runtime canon 批量晋升。
- 正式地点、阵营、奖励、NPC 生死或隐藏事实可见化。
- 自动部署 EdgeOne。

## 下一步

用户已批准 `v1.6.0-需求决策池.md` 的 D-160-001 至 D-160-012，v1.6 正式进入 a1。

当前 a1 已建立 `v1.6.0-a1-内容知识库canon-schema设计门禁.md`，只冻结知识索引 schema、promotionStatus、visibility、allowedUses/forbiddenUses、canon 草案 schema、测试样本 schema 和晋升链；不实现脚本，不读取或吸收 MiroFish 基础包内容，不改 runtime。

请用户审阅并决定 D-161-001 至 D-161-010。若批准，下一步进入：

`v1.6.0-a2-MiroFish基础包inventory设计门禁.md`
