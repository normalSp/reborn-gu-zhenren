# 上轮对话工作总结

## 时间
2026年5月5日

## 用户提出的问题（按优先级排列）

### 问题1: 义天山章节开局报错 "isOpening is not defined"
- 选择义天山篇章开局时，刚进入就显示"天机紊乱"
- 排查方向：`isOpening` 变量未定义，需检查开局初始化代码

### 问题2: 蛊材UI显示异常
- "仙窍 · 未知 · 面积?亩" 显示不正常
- 怀疑仙窍数据没有正确接入

### 问题3: 仙窍显示命名
- 6转升仙之后UI应该改名叫"仙窍"（目前可能仍显示为"空窍"之类）

### 问题4: 道痕系统设计问题（重点）
- 升仙后在原著中必然有主修流派、辅修流派
- 吸收天气地气人气升仙必然有一定的道痕
- 选后期时间线蛊仙开局时，天赋选择混乱：
  - 流派大师、宗师和逆天改命类天赋混在一起
  - 没有主修/辅修流派的选择选项
  - "风道大师"之类天赋应该关联修行流派选择，但目前太笼统
- 需要更好的设计方案

### 问题5: 道心倾向系统
- 剧情走向是否会影响道心倾向数值？
- 道心倾向是否反过来影响剧情走向？
- 选出身时是否应该根据出身地点、是否散修、是否宗门内部人物来影响道心倾向初始值？

### 问题6: 本命仙蛊选择冲突
- 蛊仙开局选本命蛊时可能选到春秋蝉等原著剧情仙蛊
- 进入游戏后当剧情触发这些仙蛊的唯一性检查时会报错
- 需考虑排除原著剧情仙蛊，但可能导致本命仙蛊池过少
- 是否增加二创仙蛊来扩充池子？

## 已制定的工作计划

创建了修复计划 `62d7db4bed4442f68089f92eaccdbfd4`，包含8个Critical级死代码修复项：

| 编号 | 内容 | 状态 |
|------|------|------|
| CR1 | KillMovePanel.tsx 添加杀招"进化"按钮，接入 killmove-evolution.ts | pending |
| CR2 | playerSlice.ts advanceTurn() 中调用 filterNpcByDomain 进行NPC域过滤 | pending |
| CR3 | RefinePanel.tsx 蛊仙模式追加"仙蛊升炼"区块，接入 ascendImmortalGu | pending |
| CR4 | gu-database.json 新增冰晶蛊/毒液蛊/万兽蛊/治愈蛊 4条数据 | pending |
| CR5 | recipe-discovery.ts FragmentRecipe接口 path→fragmentType 字段统一 | pending |
| CR6 | guSlice.ts 新增 guEvolutionState 状态字段和 triggerGuEvolution 方法 | pending |
| CR7 | combat-router.ts knownChapterIds 改为从 chapters.json 动态读取全部章节 | pending |
| CR8 | achievementSlice.ts evaluateConditionString 新增3个条件解析分支 | pending |

## 当前状态
- 计划状态：ready（已就绪，等待用户确认执行）
- 尚未开始任何代码修改
- 用户在中断前提出了6个新问题（问题1-6），这些问题尚未被纳入现有计划
