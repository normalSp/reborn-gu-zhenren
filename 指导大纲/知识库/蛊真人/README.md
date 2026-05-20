# 蛊真人知识索引

日期：2026-05-20
状态：v1.1-process-2 骨架；全书基础包已登记为档案层，等待后续按主题 intake 填充

## 定位

本目录用于索引蛊真人世界相关的 RebornG-owned 摘要、source pointer、可见性和晋升状态。它是 Codex / 专家团 / QA 的后勤知识库，不是 runtime canon，也不直接供 DeepSeek 读取。

## 当前档案来源

- 全书基础包：`指导大纲/vMiroFish/基础包/`
- 使用计划：`指导大纲/vMiroFish/intake-reviews/v1.1.0/2026-05-20-全书基础包入库使用计划.md`

基础包已登记为档案层，不代表其内容已进入知识索引。任何条目进入本目录前，都必须按主题切片完成 intake review，并转写为 RebornG-owned 摘要。

## 建议子目录

后续按需要逐步创建：

- `人物/`
- `势力/`
- `地点/`
- `事件/`
- `蛊虫/`
- `蛊材与资源/`
- `时间线/`
- `隐藏事实/`
- `IF边界/`
- `测试样本/`

## 条目模板

```md
# <条目名>

id:
kind:
summary:
sourcePointers:
visibility:
promotionStatus:
allowedUses:
forbiddenUses:
mirofishRefs:
testSampleRefs:
lastReviewedVersion:
reviewNotes:
```

## 当前规则

- 不复制原著正文。
- 不保存 hidden fact body。
- 不把 MiroFish 输出当 canon。
- 不把知识库直接喂给 DeepSeek。
- 不把知识库条目直接写入 `src/canon`。
- 所有晋升必须经过当前版本门禁、测试和用户决策。
- 全书基础包不能全量导入；只能按版本目标和主题需要切片吸收。
