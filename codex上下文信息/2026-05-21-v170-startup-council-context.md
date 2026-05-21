# 2026-05-21 v1.7 启动会交接

状态：v1.7.0-a0 active draft。
分支：`codex/v170-startup-council`。
来源：用户要求开 v1.7 专家团启动会，并希望多给专家团建议、集思广益。

## 已完成

- 新建 `指导大纲/v1.7.0/codex/00-总览/` 启动包。
- 新建 v1.7 入口 README、专家团启动会纪要、启动审查与范围冻结、总体开发大纲、小版本路线图、需求决策池、真相源索引、测试矩阵、MiroFish 资料需求与交付协议、Git 提交与推送计划。
- 新建 `v1.7.0-a0-治理补丁与范围冻结.md`，记录启动会、D-170 待拍板、skill 同步审计和硬冻结。
- 更新 `指导大纲/项目仪表盘.md`，把当前入口从 v1.6 completed 切到 v1.7 active draft。
- 更新 `.codex/skills/reborn-expert-council/references/PROJECT-STATE.md` 和 `AGENTS.md`，同步当前 active draft 与 source priority。

## 专家团建议主线

`v1.7.0` 推荐主线为：低阶区域活世界纵切选型与第一阶段门禁。

具体含义：

- 不急着做完整南疆、完整商家城、RAG、BFF 或大 public test。
- 先用 v1.6 的 MiroFish inventory / knowledge boundary / promotion-chain / replay 工具，把一个可控低阶区域切片选准。
- 优先候选：南疆早期外缘的山路歇脚点、临时商队接触、散修落脚、城门外缘门槛。
- runtime 若后续进入，默认 projection-first，不新增持久字段，除非 a1 证明必须 bump save。

## D-170 待用户拍板

详见 `指导大纲/v1.7.0/codex/00-总览/v1.7.0-需求决策池.md`。

建议用户一次性决策：

- D-170-001：v1.7 主线。
- D-170-002：a0/a1/a2 before runtime。
- D-170-003：默认继续 `SAVE_FORMAT_VERSION = 24`。
- D-170-004：默认不新增区域活世界持久字段。
- D-170-005：是否采用南疆早期外缘样板。
- D-170-006：MiroFish preferred/blocking 升级规则。
- D-170-007：禁止默认 DeepSeek 全书 RAG/visible summary/authority expansion。
- D-170-008：Player Advocate / drift 强度与 live probe 单独批准。
- D-170-009：public test / BFF 只做 process-1 安全审查。
- D-170-010：继续硬停 formal 地点/势力/奖励/NPC 生死/hidden reveal/EdgeOne auto-deploy。

## 当前硬冻结

- 无 runtime 改动。
- 无 save-format bump。
- 无新 save 字段。
- 无 DeepSeek prompt/context/model/authority 改动。
- 无 full-book MiroFish 导入 runtime/canon/DeepSeek visible context。
- 无 public wording。
- 无 BFF/backend 改造。
- 无 EdgeOne 自动部署。

## 下一步

等待用户确认或修订 D-170。

若 D-170 全批准，进入：

`v1.7.0-a1-区域活世界topic-slice与save-format设计门禁.md`

若用户改选 public test/BFF、DeepSeek safe summary/RAG、商家城外缘或青茅 aftermath revisit，则先改写 v1.7 启动审查、需求决策池和测试矩阵，再进入 a1。
