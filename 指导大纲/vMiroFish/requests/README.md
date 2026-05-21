# MiroFish 请求目录

当 RebornG 某个阶段需要原著候选材料时，在本目录新增请求文件。

**美术专项例外**：RebornG 美术总路线（`doc/art/v014-to-v100-art-roadmap.md`）跨多个小版本，节奏与 runtime 主线解耦。从 2026-05-18 起，美术专项请求统一写到 `指导大纲/vMiroFish/美术/`，而不是本目录。本目录继续承载主线（runtime / canon / save / DeepSeek）请求。已存在的 `requests/v0.14.0/2026-05-17-qingmao-unfilled-gu-appearance-pack.md` 是历史遗留美术请求，留在原位不动；后续美术请求请走 `美术/`。

## 请求文件必须包含

- `requestId`
- `targetPhase`
- `blockingLevel`
- `purpose`
- `scope`
- `requiredFields`
- `forbiddenContent`
- `acceptanceCriteria`
- `suggestedOutputName`
- `handoffMessageForMiroFish`

## 阻塞等级

- `blocking`：没有交付包，不应继续该阶段 runtime。
- `preferred`：有交付包更稳；没有也可做保守最小刀。
- `optional`：补充材料，不影响实现。
- `not_needed`：本阶段不需要 MiroFish。

## 使用方式

### v1.7+ 双仓 topic-slice 流水线

从 `v1.7.0-a1` 起，涉及全书基础包的主题切片优先走项目级制度：

- 制度文件：`指导大纲/流程制度/MiroFish双仓topic-slice流水线制度.md`
- 默认 MiroFish 仓库：`D:\workspace\CodeBuddyWorkSpace\2026-05-12-task-1\MiroFish`
- 可用环境变量覆盖：`MIROFISH_REPO`
- 当前首个样板 topic：`southern_border_low_rank_outer_edge_life_slice`

请求文件仍由 RebornG 在本目录生成和归档，但不再默认要求用户手动转交给旧窗口。若当前 Codex 可读取 MiroFish 仓库，应按制度执行：

1. RebornG 写 request。
2. 在 MiroFish 仓库只读基础包并运行/调用导出流程，产出 quote-redacted topic-slice export。
3. RebornG 写 intake review。
4. RebornG 将合格材料转写为测试矩阵、规则草案或候选样本。

请求文件必须额外写清：

- `topicId`
- `mirofishRepo`
- `expectedExportPath`
- `expectedIntakeReviewPath`
- `allowedUses`
- `forbiddenUses`
- `noRuntimeCanonAuthority`
- `noDeepSeekVisibleContext`
- `firstSampleMainThreadOnly`，直到用户另行批准只读/分析型子代理。

旧的用户手动转交方式保留为 fallback：只有在当前 Codex 无法访问 MiroFish 仓库、导出工具不可用、或用户主动指定另一个窗口主控时，才回退到手动转交。

### 旧窗口 handoff fallback

1. Codex 写请求文件。
2. 用户把请求文件内容转交给 MiroFish 会话。
3. MiroFish 产出 quote-redacted JSON 包和报告。
4. 用户把产物放入 `指导大纲/vMiroFish/`。
5. Codex 在 `intake-reviews/` 写审查结论。

## 主动提醒要求

Codex 在拟定大版本大纲或进入小版本 startup review 时，必须判断是否需要新请求。

如果需要请求，回复用户时必须明确：

- 需要哪个包。
- 目标阶段。
- 阻塞等级。
- 请求文件路径。
- 当前应走双仓流水线，还是因为仓库不可用等原因回退到用户手动转交。

如果不需要请求，也应在阶段记录里写明 `not_needed`。
