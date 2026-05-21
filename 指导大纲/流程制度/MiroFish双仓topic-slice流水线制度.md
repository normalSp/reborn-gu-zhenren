# MiroFish 双仓 topic-slice 流水线制度

日期：2026-05-21
状态：项目级制度；v1.7-a1 建立第一版
适用范围：RebornG 需要使用 MiroFish 全书基础包、主题切片、source pointer、coverage、hidden/private 风险清单、测试样本或规则草案时。

## 目标

把旧的“RebornG 发 request，另一个窗口处理 MiroFish，再回到 RebornG 做 intake review”固化为可复跑、可审计、可检查的双仓流水线：

```mermaid
flowchart LR
  A["RebornG request"] --> B["MiroFish export"]
  B --> C["RebornG intake review"]
  C --> D["test matrix / rule draft"]
  D --> E["current version gate"]
```

该流水线的核心不是让 MiroFish 成为权威，而是确保 RebornG 每次使用全书基础包时，都有明确主题、明确交付、明确审查和明确晋升边界。

## 双仓职责

| 仓库 | 路径 | 职责 | 禁止事项 |
|---|---|---|---|
| RebornG | `D:\workspace\CodeBuddyWorkSpace\RebornG_codebuddy` | 写 request、接收 export、写 intake review、更新测试矩阵/规则草案/仪表盘/PROJECT-STATE | 不直接读取 MiroFish raw；不把基础包整包导入 runtime、DeepSeek 或知识库 |
| MiroFish | `D:\workspace\CodeBuddyWorkSpace\2026-05-12-task-1\MiroFish` | 从 strict/reviewable base 或 RebornG 基础包档案导出 quote-redacted topic slice、coverage report、handoff | 不直接编辑 RebornG `src/canon`、runtime、store、DeepSeek context 或知识索引 |

环境变量：

- `MIROFISH_REPO` 可覆盖 MiroFish 仓库路径。
- 默认路径为 `D:\workspace\CodeBuddyWorkSpace\2026-05-12-task-1\MiroFish`。

## 阶段

### 1. RebornG request

RebornG 当前版本先写 request：

- 目录：`指导大纲/vMiroFish/requests/<version>/`
- 必须包含：topic id、版本、目标、允许输出、禁止输出、需要字段、source pointer 要求、hidden/private 处理、交付目录、RebornG intake 入口。
- request 只能请求局部主题切片，不能请求全书整包导入。

v1.7 第一条样板 topic：

- `southern_border_low_rank_outer_edge_life_slice`

### 2. MiroFish export

MiroFish 根据 request 产出 export-ready 包：

- 交付目录：`指导大纲/vMiroFish/<version>/exports/`
- 必须包含 quote-redacted JSON、coverage report、handoff markdown。
- `runtimeAuthority` 必须为 `candidate_only`。
- hidden/private 条目必须 `hiddenRefOnly=true`、`runtimeVisible=false`、`deepSeekVisible=false` 或等价口径。
- 不允许 `quote`、`originalText`、`excerpt`、`verbatim`、`rawText`、`sourceText` 出现在 RebornG-facing export。

### 3. RebornG intake review

RebornG 收到 export 后必须写 intake review：

- 目录：`指导大纲/vMiroFish/intake-reviews/<version>/`
- 结论只能分流为 `candidate_pool`、`rule_draft`、`test_sample`、`fact_card_draft`、`deferred`、`quarantined`、`rejected`。
- 任何 hidden/private、方源私密因果、后期高阶事实、正式地点/阵营/奖励/NPC 生死，默认 `deferred` 或 `quarantined`，除非当前版本门禁和用户决策另行批准。

### 4. 测试矩阵与规则草案

通过 intake 的材料只能被 RebornG 改写为：

- 测试样本。
- 规则草案。
- source pointer。
- 候选池条目。

进入测试矩阵必须按 `测试矩阵演进规则.md` 三分流。进入知识索引必须满足 `全书知识库治理制度.md` 的字段和可见性要求。

### 5. runtime 前门禁

任何内容进入 runtime 前，必须再经过当前版本设计门禁、focused tests、Player Advocate 或长线漂移门禁，并在需要时停下来让用户决策。

## 自动检查

新增只读检查：

```powershell
npm run check:mirofish-dual-repo-pipeline -- --target-version=v1.7.0 --topic=southern_border_low_rank_outer_edge_life_slice --stage=a1
```

阶段参数：

| stage | 检查内容 |
|---|---|
| `a1` | 双仓路径、基础包 manifest/coverage、制度文件、MiroFish export 工具入口 |
| `request` | `a1` + RebornG request 文件存在并包含 topic |
| `export` | `request` + RebornG exports 目录存在、export/handoff/report 包含 topic、JSON 无原文字段 |
| `intake` | `export` + RebornG intake review 存在并有分流结论 |
| `complete` | `intake` + 当前版本测试矩阵或规则草案已引用 topic |

该检查不自动修复、不自动复制、不自动晋升 runtime canon，也不修改 DeepSeek context。

## 子代理规则

v1.7-a2 第一条样板由主线程跑通，不启用子代理写文件。

样板稳定后，主线程必须向用户提交“只读/分析型子代理”风险收益评估，再由用户决定是否启用。

允许的子代理职责：

- 只读扫描 MiroFish 基础包或 export，列 source pointer 和 coverage gap。
- 只读审查 RebornG request 是否覆盖当前版本门禁。
- 只读比较 intake review 与测试矩阵引用链。

禁止的子代理职责：

- 直接写 RebornG runtime、`src/canon`、store、DeepSeek context。
- 直接修改或提交同一个 request/intake 文件。
- 直接 stage、commit、push。
- 直接宣布 MiroFish 材料可进入 runtime。

## 停手点

以下情况必须停下来让用户决策：

- 要把任意 MiroFish 派生内容晋升为 runtime canon。
- 要让 DeepSeek 看到基础包派生摘要。
- 要把 hidden/private 内容转为玩家可见信息。
- 要扩大 topic slice 到完整南疆、完整商家城、正式势力规则、奖励或 NPC 生死。
- 要启用可写子代理或多子代理并行改文件。
- 要把检查脚本加入 CI hard gate。
- 要删除、重写或替换基础包原始交付档案。

## v1.7 第一条样板

用户已批准将第一条样板流水线交由当前 Codex 主线程主控：

`RebornG request -> MiroFish export -> RebornG intake review -> 测试矩阵/规则草案`

样板 topic：

`southern_border_low_rank_outer_edge_life_slice`

在 D-171 正式批准并进入 a2 前，本制度只建立流程和自动检查，不执行 runtime、save-format、DeepSeek、MiroFish 导入或 canon 晋升。
