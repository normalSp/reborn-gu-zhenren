# RebornG 错误记录

> 用途：记录历史Bug和修复方案，避免重复踩坑。每次修复Bug后追加条目。
> 当前说明（2026-05-15）：本文件早期内容多为 v0.6/v0.7 旧审计发现，部分已被后续版本修复或 supersede。修复新问题前必须以当前源码、测试、`PROJECT-STATE.md` 和对应版本文档复核，不可直接照旧条目执行。

---

## 当前防坑索引 (2026-05-15)

### 青茅凡战 5x3 棋盘被说明卡/行动坞挤压
- **症状**：桌面 900px 高度下只能看到一行半到两行战场格，蛊虫/杀招/美术说明与底部行动卡抢占主视区。
- **根因**：战场格保留宽度驱动的 `aspect-ratio`，中栏越宽格子越高；底部行动卡用 `28vh` 展开；旧 e2e 只检查格子数量，没检查第三行是否可见。
- **防范**：凡战 overlay 要把棋盘列为主体验收：Qingmao 5x3 单元格高度使用视口夹取，说明区/行动坞限高滚动；Playwright 必须断言 `c4_2` 位于行动坞上方且棋盘高度达标。

### 青茅凡战底部行动卡半截露出/文字重叠
- **症状**：蛊虫/杀招行动栏中第二行卡片半截露出，卡片说明文字压到下一张卡上，看起来像重叠。
- **根因**：为保棋盘把行动列表限高后仍使用多行 grid；后续又把卡片压到 116px 并裁剪，导致描述、反制和用途下半段不可见。
- **防范**：青茅 battlefield 的行动卡使用单行横向滚动，卡片高度必须足够显示标题、消耗/射程/目标、两行描述和反制/用途；e2e 断言 action list 无垂直溢出、可见卡片同一行、描述和反制块在卡片内可见。

### EdgeOne 生产预览黑屏：生产拆包循环依赖
- **症状**：EdgeOne 预览黑屏，生产 chunk 中 `rules.cultivation` 读取 undefined。
- **根因**：store 启动期模块顶层同步调用 engine 默认状态函数，在生产拆包循环依赖下可能早于 JSON/rules 初始化。
- **防范**：默认 engine state 走 store 侧稳定默认值，不在 store 模块顶层调用复杂 engine 默认函数；发布前跑 `npm run check:production-preview`。

### Playwright 长测不要和其他 dev-server 套件并行
- **症状**：`npm run test:e2e:long` 前几条通过后，后续出现 `ERR_CONNECTION_REFUSED` 或 `page.waitForFunction` 等待 `__REBORN_E2E__` 超时。
- **根因**：长测和其他 Playwright e2e 套件并行运行时会争用同一个本地 dev server/端口，某个套件结束后可能关闭服务，导致另一套件误报连接失败。
- **防范**：rc 收束时长测必须单独运行；不要把 `npm run test:e2e:long` 放进 `multi_tool_use.parallel` 与其他 `npm run test:e2e` 同时执行。若出现此类失败，先单独重跑长测确认，再判断是否为真实回归。

### 青茅资源小循环不能变掉落池
- **症状风险**：资源入口、战斗候选、喂养、残方 UI 互相绕过边界，导致稳定刷材料/蛊方/蛊虫。
- **防范**：资源奖励单次 1-2 份低阶注册材料；白玉蛊缺口不产出；战斗候选不激活 `beastLoot` 或材料掉落；DeepSeek 回流无奖励追加权。

### `.codex` 本地状态不要整目录入库
- **症状风险**：`.codex` 中混有日志、截图、临时探测文件和本地配置，误入版本控制会污染仓库并泄露环境形态。
- **防范**：`.gitignore` 默认排除 `.codex/*`，只允许项目级 `.codex/skills/**` 参考文件进入。

### 大方向外部报告不是权威源
- **症状风险**：Claude Code Game Studio 评估文档中有价值建议，也有工具能力假设和过期事实，直接照做会造成误导。
- **防范**：先转写为项目-owned 的 v0.11 专项草案，经用户批准后再实现；不得直接改 `指导大纲/大方向` 原文。

## 专家团全量审查新发现问题 (2026-05-06) — 补充

### 阻塞级新增
- **TIER_BASE_PRICE**: auction-engine.ts 当前 `{6:4,7:12,8:35,9:100}`，应为 `{6:3600,7:12000,8:40000,9:150000}`（差×900）
- **5转势力无收入源**: 维护费标注"仙元/回合"但5转无仙元来源，需改为元石维护
- **capacity=3非十绝体专属**: CharacterCreate.tsx:320 所有角色默认capacity=3，十绝体锁定逻辑缺失
- **成就奖励零实现**: achievementSlice.ts 仅做解锁标记，无元石/蛊材/杀招发放

### 架构反模式新增
- **|| {}模式泛滥**: playerSlice/combatSlice/refine-engine等59+处每次渲染创建新引用
- **shallow比较完全缺失**: 项目中无任何 zustand/shallow 使用
- **useStore.getState() 在渲染路径**: CharacterCreate.tsx 27+处直接调用

### 数据层新增
- **extreme-physique-daomark-affinity.json 不存在**: 阻塞十绝体道痕禁制
- **语音voice/目录不存在**: public/audio/下仅有bgm/sfx，阻塞配音系统
- **成就无reward/progressMax**: 26条成就全部缺失奖励字段

## 已知问题 (2026-05-06 v0.7.0审查发现)

### 数据层
- **immortal-gu.json**：至尊仙胎蛊出现2次（tier:9 人道 × 1, tier:9 变化道 × 1），需确认是否为原著双版本
- **combat-constraints.json**：仅4个南疆场景，缺少五域全覆盖场景配置
- **terminology.json**：仅定义"十绝体"通用概念，缺少10种具体类型的枚举和效果描述
- **economy.json**：仙材仙元定价不完整，仅1行"500-2000元石/份"

### 代码层
- **SquadCombatOverlay.tsx**：空桩文件（`return null`），需从头构建~350行UI
- **squad-combat-engine.ts**：空白占位，需从头编写~300行引擎
- **combat-formulas.ts**：缺少checkAffinityBlock函数（十绝体道痕禁制）
- **context-builder.ts**：缺5个v0.7.0 AI注入管道（十绝体/势力/NPC组队/名场面/域外交）
- **state-update-applier.ts**：十绝体capacity=3 override、放入取出HP扣减逻辑缺失
- **playerSlice.ts**：缺少extremePhysiqueType状态字段
- **AchievementCheckState**：缺少factionLevel/membersCount/immortalGuCount/ascensionSuccessCount/trainingGroundVisits/huntSuccessCount/singlePathDaoMarks共7个字段

### 素材层
- **BGM**：南疆/北原/中洲三域BGM为零字节空文件（5域仅2域有声音）
- **SFX**：13个MP3文件已存在但从未被代码调用，全部使用OscillatorNode合成音
- **配音**：public/audio/voice/ 目录不存在，木成111文件未集成

---

## v0.6.0 已知Bug（回顾）

### useMemo中调用setState导致无限重渲染
- **文件**：GameScreen.tsx（历史）
- **根因**：useMemo回调中调用了refreshShopGroup()
- **修复**：将副作用移到useEffect
- **预防**：skill中已固化为反模式规则#6

### useStore selector引用不稳定导致性能退化
- **根因**：selector中使用`|| {}`每次渲染创建新对象
- **预防**：skill中已固化为反模式规则#9
