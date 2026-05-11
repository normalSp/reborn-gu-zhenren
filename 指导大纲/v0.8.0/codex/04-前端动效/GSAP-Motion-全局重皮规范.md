# GSAP-Motion 全局重皮规范

更新时间：2026-05-10  
阶段：v0.8.0-pre  
关联 skill：`reborn-combat-motion`

## 总原则

v0.8.0 的前端目标不是简单“加动画”，而是让 UI 像一个蛊真人世界里的战斗与修行仪表盘：

- 暗墨底色承载压迫感。
- 金色道痕表达资源、真元、规则和系统信息。
- 血色表达杀意、反噬、禁忌、危险。
- 玉青表达生机、治疗、护持和恢复。
- 阵纹、格线、符记、道痕线表达“规则正在运转”。

所有动效都必须服务状态解释：为什么能用、为什么不能用、风险是什么、下一步会影响哪里。

## 分工

GSAP 负责时间轴演出：

- 开战。
- 杀招蓄势和释放。
- 蛊阵展开、阵眼亮起、破阵。
- 禁忌蛊触发。
- 重伤、反噬、终结。
- 章节级转场。

Motion 负责界面状态：

- 棋盘单位移动。
- 目标选择、射程格高亮。
- 行动栏切换。
- 面板进出、列表重排。
- Tooltip 和 Hover 反馈。
- HP/真元/状态条。
- 存档、图鉴、背包等全局 UI 的布局过渡。

不要让 GSAP 和 Motion 同时控制同一 DOM 属性。复杂演出用 GSAP，常规 UI 状态用 Motion。

## 战斗 UI

第一阶段战斗界面结构：

- 中央 5×3 棋盘。
- 左侧：玩家/小队单位、生命、真元、状态、当前意图。
- 右侧：敌方单位、侦察信息、阵法/地形/危险说明。
- 底部行动栏：蛊虫、杀招、阵法、身法、观察、撤退。
- 轨迹区：按 `BattleResolutionStep` 显示行动链、命中、失败、反制和代价。

交互要求：

- 选中蛊虫时显示射程和影响格。
- Hover 显示消耗、冷却、反制和剧情用途。
- 不满足条件时显示具体原因，不只置灰。
- 禁忌蛊必须出现风险/代价确认，不进入常规快捷攻击。

## 全局 UI

需要进入 v0.8 重皮的主要界面：

- 状态栏：境界、生命、真元、天意/因果、AP、时段。
- 底部导航：存档、图鉴、队伍、流派、商会、事件日志。
- 蛊虫背包：按流派、用途、可战斗/可剧情使用分层。
- 杀招面板：展示核心蛊、辅助蛊、蓄势、破绽、反噬。
- 人物图鉴：关系、立场、威胁、可触发行动卡。
- 存档：版本、阶段、风险、测试档标签。
- 选择面板：每个选项显示风险、资源、身份/出身压力。

## 动效提示词模板

给 GPT-5.5 或后续前端 agent 的提示词必须包含：

- 目标组件和相关状态字段。
- 这是 GSAP 时间轴还是 Motion 状态动画。
- 输入数据来自哪个 engine/canon 文件。
- 不能在 UI 私算战斗结果。
- reduced motion 行为。
- 桌面和移动端截图验收点。
- 不使用通用科幻、霓虹或营销页风格。

示例：

```text
请改造 CombatOverlay 的蛊虫发动表现。输入只来自 BattleResolutionStep 和 GuExpressionSpec。
GSAP 只负责杀招/禁忌蛊时间轴；Motion 负责格子高亮、单位移动和 action panel。
不得在组件里计算伤害、命中或状态。reduced motion 下保留文本轨迹和静态高亮。
风格为暗墨底、金色道痕、血色风险、玉青生机，不使用科幻 HUD。
验收：桌面 1440x900、移动 390x844，射程格不遮挡文字，按钮原因可读。
```

## 验收

- Playwright 截图验证桌面/移动端。
- reduced motion 下可操作。
- 动效不遮挡关键文字和按钮。
- 长日志可滚动。
- 棋盘、行动栏、Tooltip 尺寸稳定。
- 禁忌蛊/高风险杀招有明确代价提示。

## v0.8.0-a2 实际组件分工

a2 已落地的战斗 UI 动效分工如下：

- `BattlefieldCombatOverlay`：使用 Motion 做全屏 overlay 入场、单位卡 layout、棋盘格 hover/press/选中态、行动卡列表、轨迹条目入场、移动端布局切换。
- `useBattlefieldAnimationBridge`：监听当前 `BattleResolutionStep`，在 reduced motion 下跳过高强度演出。
- `src/animations/gsap/battlefieldTimeline.ts`：只控制 `.battlefield-gsap-*` 独立效果层，播放开战感、杀招、反噬、失败、结算等时间轴效果。
- GSAP effect layer 设置 `pointer-events: none`，不参与点击命中；战斗 overlay 层级高于调试浮层，避免移动端按钮被遮挡。
- UI 文字、按钮可用性、目标范围、资源消耗和失败原因全部来自 a1 validation / `BattleResolutionStep`，动效不创造战斗事实。

a2 桌面/移动端验收口径：

- 桌面 `1440x900`：能选择月光蛊、看到有效目标格、执行后出现 `gu_use` 与 `resource_spend` 轨迹。
- 移动端 `390x844`：行动栏横向可切换，撤退卡可点击，执行按钮高度稳定。
- `prefers-reduced-motion: reduce`：轨迹直接展开，按钮与原因仍可读。

## v0.8.0-a3 剧情选择动效分工

a3 只改剧情选择里的蛊虫解法标注，不做高强度战斗演出，因此不引入新的 GSAP 时间轴。

实际分工：

- `ChoicePanel`：用 Motion 处理蛊虫用途标签进入、选择卡 hover/press、tooltip 显示和选项重排。
- 标签状态固定为“蛊虫解法 / 缺少蛊虫 / 禁忌门槛 / 待校验”，颜色语义分别对应玉青、金色、血色、暗墨灰。
- Tooltip 必须解释蛊名、用途、为什么能用或不能用、风险和代价；不能只显示漂亮标签。
- reduced motion 下保留标签和 tooltip 信息层级，避免依赖闪烁、远距离位移或遮挡式动画表达状态。
- GSAP 仍保留给 a2 战斗 overlay、杀招蓄势、禁忌蛊强演出和章节级转场；a3 的普通剧情选择不使用 GSAP，避免和 Motion 同时控制同一元素。

a3 验收口径：

- 桌面 `1440x900`：同一组选项能同时显示可用、缺蛊和禁忌门槛三种标签，hover tooltip 可读。
- 移动端 `390x844`：标签不挤出选项卡，文字不遮挡主选项。
- `prefers-reduced-motion: reduce`：标签仍可见，tooltip 仍可触发，无控制台错误。

## v0.8.0-b1 群像战动效分工

b1 沿用 a2 的 battlefield overlay，不新增第二套战斗 UI。群像战只增加状态层和行动层：

- Motion 负责：点击我方单位切换 active actor、士气条变化、目标卡状态、第三方/隐藏单位列表、行动卡重排、格子高亮、移动端单列布局。
- GSAP 负责：`ambush` 伏击爆发、`formation` 阵位展开/破阵、`third_party` 第三方入场、`morale` 士气崩落或振奋、`guard`/`assist` 的独立效果层强调。
- GSAP 仍只控制 `.battlefield-gsap-*` 独立 effect layer，不能直接控制 Motion 管辖的棋盘格、单位卡、行动卡或目标卡。
- reduced motion 下关闭大幅位移和闪烁，保留士气/目标/隐藏单位/轨迹的静态可读性。

b1 验收：

- 桌面 `1440x900`：群像战入口可打开，15 格棋盘、多我方/敌方/中立单位、士气条、目标卡、观察揭示、阵位行动、轨迹播放可读。
- 移动端 `390x844`：行动栏横向切换可用，士气和目标信息不被底部行动栏遮挡。
- 任何动画不得遮挡“为什么能用/不能用/风险是什么”的文字说明。

## v0.8.0-b1.1 可变棋盘动效分工

b1.1 继续沿用 `BattlefieldCombatOverlay`，不新建第二套大地图 UI。变化点是棋盘列数由 `state.grid.width` 决定，`ambush_7x5` 需要在桌面紧凑展示、移动端横向滚动。

Motion 负责：

- 棋盘格根据 `state.grid.width` 重排。
- 单位卡和格子高亮在 5x3 / 7x5 之间保持稳定 layout。
- 选中范围、目标格、阵位格、护送出口、第三方入场点的 hover/press 状态。
- 移动端横向滚动棋盘中的行动栏、目标卡、士气条和轨迹列表状态。

GSAP 负责：

- `ambush` 在 7x5 林地/山道中的伏击爆发效果层。
- `formation` 多阵位节点争夺、阵纹展开或破阵。
- `third_party` 从 entry point 入场的独立效果层。
- `morale` 大阵局势变化的短促强化，不控制棋盘格尺寸或位置。

边界：

- GSAP 不控制 grid template、格子位移、行动卡或单位卡；这些仍归 Motion / CSS layout。
- reduced motion 下保留 7x5 棋盘、前/中/后线、出口、入场点和阵位标签，关闭大幅位移、闪烁和镜头式演出。
- 移动端大棋盘允许横向滚动，但文字、按钮、目标卡和轨迹不得互相遮挡。

b1.1 验收：

- 桌面 `1440x900`：7x5 棋盘 35 格可见，士气、目标、第三方、观察揭示、阵位行动和轨迹播放可读。
- 移动端 `390x844` + `prefers-reduced-motion: reduce`：棋盘可横向滚动，行动栏可切换，士气/目标信息可读，无控制台错误。

## v0.8.0-b2 修行与灾劫动效分工

b2 的主要界面是 `ActionPanel` 中的修行深化面板。它不是棋盘战斗 UI，因此默认使用 Motion 做状态变化，只在突破、升仙、灾劫结算这类高压节点保留 GSAP 演出入口。

Motion 负责：

- 修行态势卡、三气条、窍壁/福地压力条、灾劫预览卡的进入和列表重排。
- 成功率、失败后果、天意压力、业债、资源损伤等 tooltip 或展开内容。
- `CultivationResolutionStep[]` 轨迹条目进入、reduced motion 下的淡入替代。

GSAP 负责：

- 大境界突破、升仙、灾劫落点这三类结果演出。
- 只控制独立 effect layer 或专用演出节点，不控制 Motion 管辖的卡片、按钮、进度条和文字。
- reduced motion 下保留结果强调，但取消大幅位移、闪烁和连续震动。

b2 验收：

- 桌面和移动端均能读清时段、地点、安全度、三气、灾劫预览和本地结算轨迹。
- 低动效模式下按钮仍可操作，轨迹仍可推进。
- 动效不得遮挡突破/升仙/灾劫失败原因。

## v0.8.0-b3 宿命面板与锚点标签动效分工

b3 的主要新增界面是底部 `宿命` 面板 `StoryAnchorPanel` 与 `ChoicePanel` 的锚点标签。它们不是战斗强演出界面，默认使用 Motion；GSAP 只留给后续重大锚点压力或章节级转场，不控制按钮、文字、列表或 tooltip。

Motion 负责：

- `StoryAnchorPanel` 的卡片进入、四个中后期锚点列表、候选事件、IF 向量、天意账本、因果债、压力日志和本地轨迹列表重排。
- `ChoicePanel` 的 `正史侧翼`、`IF偏移`、`天意压力`、`禁区拦截` 标签进入、hover/press、tooltip 和选项布局稳定。
- reduced motion 下保留静态标签、面板层级、可读轨迹和按钮状态，取消远距离位移、闪烁和镜头式转场。

GSAP 仅保留给：

- 重大锚点压力触发。
- 宿命状态从 `intact` 到 `fractured` 或 `destroyed` 的章节级转场。
- 天意强修正、禁区拦截、IF 代价回响等独立 effect layer。

边界：

- GSAP 不控制 `StoryAnchorPanel` 的卡片位置、滚动列表、按钮、标签和 tooltip。
- 动效不创造宿命状态、IF 向量、天意账本或因果债；这些事实只能来自 `storyAnchorState` 和本地锚点引擎。
- `宿命` 面板在桌面和移动端都必须能解释“当前锚点是什么、为什么被拦截、IF 代价是什么、天意/因果压力在哪里”。

## v0.8.0-c1 终局面板与总结页动效分工

c1 新增 `EndingResolverPanel` 和终局总结页。终局面板是规则解释界面，不是抽卡或奖励弹窗；动效必须帮助玩家看懂“为什么能结算、为什么被拦截、代价来自哪里”。

Motion 负责：
- `EndingResolverPanel` 的状态卡、证据摘要、候选路线、压力日志和解析轨迹列表进入与重排。
- 候选提交按钮、候选卡 hover/press、tooltip、移动端单列布局和 reduced-motion fallback。
- `GameOverScreen` 终局总结页的文字、诗、理由和未证警示的渐入。

GSAP 只保留给：
- 重大终局压力、宿命状态变动、尊者博弈压力、章节级终局转场的独立 effect layer。
- 未来 c2 若做终局大转场，GSAP 不得控制候选卡、按钮、文本、列表和总结页正文。

边界：
- 动效不创造终局事实。候选、证据、禁区压力和提交结果只能来自 `endingState` 与 `EndingResolutionStep[]`。
- reduced motion 下必须保留终局候选、证据、禁区日志和提交按钮的完整可读性。
- 不出现“永生成功”“十转达成”“普通战斗击杀尊者”等视觉暗示；即使演出强，也必须呈现未证和边界。

## c1.1/c1.2 前置清账对 c2 UI 的要求

c2 全局重皮只能表现已经落地的系统事实。c1.1 后，创建页、选择面板、资源/行动提示应消费：

- `v080-promise-effect-coverage.json`：显示承诺效果的覆盖状态、阶段归属和原因。
- `SceneTimeContext`：显示当前场景为什么能行动、为什么被锁定、为什么只能得到传闻。
- `state-update-applier` 资源闸门日志：显示宝黄天、仙材、宿命蛊、永生蛊、十转等奖励被阻断或降级的原因。

Motion 可用于 `待系统` 标签、原因 tooltip、行动可用性和列表重排；GSAP 不用于这类解释型标签。c2 视觉重皮不得把 `planned_needs_system` 包装成已生效，也不得用高强度动效暗示被本地规则阻断的奖励已经获得。

## c1.2 接入说明：出身/本命蛊只做轻动效

`v0.8.0-c1.2` 新增的出身深线、本命蛊协议和前中期锚点映射属于解释型系统事实，不属于高强度战斗演出：

- `ChoicePanel`、背包和后续 c2 面板只需要 Motion 负责标签、tooltip、列表重排和移动端展开收起。
- GSAP 不参与本命蛊普通提示、出身约束、身份降级标签，避免把系统解释做成抢眼但难读的演出。
- 若后续本命蛊死亡、升仙牵动本命蛊或灾劫重伤本命蛊，才可使用 GSAP 独立 effect layer；仍不得控制按钮、文字或布局元素。
- c2 展示“为什么能用/不能用/风险是什么”时，应直接消费 `v080-origin-lifebound-closure` 输出的身份边界、风险标签和终局权重。

## v0.8.0-c2 实际分工

c2 的新增与调整仍遵守 RebornG 动效边界：UI 解释和布局由 Motion/CSS 负责，高强度演出仍留给既有 GSAP 独立效果层。

已落地分工：
- `src/index.css` 新增 `rg-game-shell`、`rg-statusbar`、`rg-bottom-nav`、`rg-side-panel`、`rg-mobile-sheet`、`rg-panel-surface`、`rg-toolbar-btn`、`rg-chip`、`rg-choice-card`、`rg-explain-card`、`rg-action-card`、`rg-explain-tooltip`、`rg-trace-list`、`rg-scrollable` 等统一类。
- `StatusBar` 与 `GameScreen` 使用 CSS/Motion 轻交互，保证桌面扫描与移动端底部工具带稳定，不使用 GSAP 控制布局。
- `ChoicePanel` 使用 Motion 控制选择卡、风险/蛊虫/锚点/系统标签和 tooltip；reduced motion 下保留静态信息层级。
- `ActionPanel`、`GuInventoryPanel`、`StoryAnchorPanel`、`EndingResolverPanel`、`SaveLoadDialog`、`MaterialBagPanel`、`CharacterPanel` 只做面板、卡片、滚动和标签收束，不私算系统结果。
- GSAP 仍只允许用于 `battlefield-gsap-*`、重大锚点、破阵、杀招、反噬、终局压力等独立 effect layer；不得控制按钮、正文、列表、tooltip 或布局属性。

验收：
- 桌面 `1440x900` 要能打开主界面、行动、蛊虫、宿命、终局、7x5 群像战和天赋遴选，且无控制台错误。
- 移动端 `390x844` + reduced motion 要能打开抽屉、读取选择标签、操作长面板、横滚 7x5 棋盘，且文字不被动效层遮挡。
- 天赋页 `planned_needs_system` 与 `needs_downgrade` 展示保持为空。

## v0.8.0-c2.4 修行与灾劫叙事化动效分工

c2.4 的灾劫不再是“点击按钮直接扣资源”的瞬时反馈，而是先进入剧情场景。动效必须服务“预兆、场景授权、场景 AP、后续本地结算”这条链路。

Motion 负责：
- `ActionPanel` 中凡人空窍、五转升仙、六转以上仙窍/福地三种修行态势的卡片切换、进度条、tooltip 和轨迹列表进入。
- `灾劫入场` 按钮、`calamity_warning` 轨迹、场景 AP 消耗提示、移动端抽屉和 reduced-motion fallback。
- 七转/八转档的仙窍信息布局稳定，不显示五转升仙按钮或五转说明。

GSAP 负责：
- 仅在后续正式灾劫落点、荒兽/人劫入场、类仙道杀招压迫、资源节点崩坏等独立 effect layer 使用。
- 不控制 `ActionPanel` 的按钮、文本、卡片、列表或布局属性。

边界：
- 动效不结算灾劫。灾劫类型来自 `CalamitySceneSpec`，正式面积、资源、道痕、伤势、蛊虫损伤和战斗胜负必须来自本地引擎。
- reduced motion 下必须保留灾劫类型、倒计时、影响资源点、可处理方向和本地结算轨迹。

## v0.8.0-c2.5 传承与待认主福地动效分工

c2.5 的主要新增界面是 `InheritanceLandPanel`、`ChoicePanel` 的传承标签和 `AperturePanel` 的待认主/已认主福地摘要。它们属于解释型系统 UI，不是战斗强演出；默认使用 Motion/CSS，GSAP 只保留给后续传承封印开启、地灵试炼、认主成败等独立效果层。

Motion 负责：
- `传承` 面板卡片、候选列表、奖励预览、地灵条款、拦截记录和结算轨迹的进入、重排与移动端抽屉状态。
- `传承线索 / 待认主福地 / 洞天传闻 / 禁区拦截` 标签的 hover、tooltip 和 reduced-motion fallback。
- `AperturePanel` 中福地摘要、资源压力和灾劫压力提示的轻量布局状态。
- 移动端抽屉必须给底部导航留出可点击空间；长面板滚动不得遮挡工具带。

GSAP 只允许用于：
- 传承封印开启、地灵现形、认主成功/失败、禁区压力显影等独立 effect layer。
- 后续若传承守护战进入 battlefield overlay，战斗特效仍消费 `BattleResolutionStep[]`，不在传承面板私算结果。

边界：
- 动效不创造传承奖励、福地归属、资源节点或洞天归属；这些事实只能来自 `inheritanceLandState` 和 `v080-inheritance-land-engine`。
- 洞天在 v0.8 只显示传闻/禁区压力，不用强演出暗示玩家已经可以正式认主或吞并。
- reduced motion 下必须保留候选状态、可进入/不可进入原因、AP 成本、地灵执念条件、奖励来源和拦截原因。
