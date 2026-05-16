# MiroFish 请求目录

当 RebornG 某个阶段需要原著候选材料时，在本目录新增请求文件。

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
- 当前 Codex 线程不能直接联系 MiroFish，需要用户转交给会话 `019e207b-c55d-7e23-b450-efa7a054a165`。

如果不需要请求，也应在阶段记录里写明 `not_needed`。
