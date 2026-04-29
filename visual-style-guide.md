# 蛊真人模拟器 — 视觉风格指南

**版本**: v1.1
**日期**: 2026-04-30
**来源**: GitHub调研（FutureAIGuide/future-ai-design-tokens, adrianspeyer/speyer-ui）+ Material Design Dark Theme + Muzli Dark Mode Guide + 前端开发技能规范 + GDD §6.1
**适用范围**: 所有UI组件、面板、按钮、文本渲染

---

## 1. 设计哲学

蛊真人模拟器的视觉语言遵循三条核心哲学：

**黑暗现实主义**：蛊界是一个残酷的修真世界——弱肉强食、没有正邪、只有强弱。UI不能明亮、温暖或友好，必须传递压迫感、疏离感和古旧感。背景以深黑紫底（rg-ink）为主，所有面板区采用暖黄米白文字（rg-paper），形成「黑暗中的古籍手卷」的视觉隐喻。

**古籍手卷感**：界面模拟一本古老手卷的视觉体验。叙事正文使用衬线字体（思源宋体）模拟手写感，数值面板使用无衬线字体（思源黑体）提供清晰可读性。面板边框使用半透明细线（`rgba(144, 144, 184, 0.12)`），不做厚重边框——古籍的边界是褪色的，不是硬切的。

**信息层次通过色彩权重而非字号区分**：最重要的信息用暗金色（rg-gold），危险信息用深暗红（rg-blood），正面状态用暗绿（rg-jade），普通信息用暖黄米白（rg-paper）。不同重要度的文本使用同一字号但不同颜色，避免字号爆炸——古籍不会有36pt的标题，只有不同深浅的墨迹。

---

## 2. 色彩Token体系

### 2.1 五大主色

| Token | Hex | Tailwind Class | 语义 | 使用场景 |
|-------|-----|---------------|------|----------|
| rg-ink | #1a1a2e | `bg-rg-ink-700` | 墨色底色 | 全局背景、面板底色、叙事区底色 |
| rg-paper | #f5f0e8 | `text-rg-paper-200` | 纸色文字 | 正文、标签、普通按钮文字 |
| rg-blood | #8b0000 | `text-rg-blood-600` | 血迹警告 | 死亡提示、HP低警告、高风险选项、错误信息 |
| rg-jade | #2d6a4f | `text-rg-jade-600` | 翠玉成功 | 成功状态、debuff清零、正面buff激活、境界突破确认 |
| rg-gold | #b8860b | `text-rg-gold` | 鎏金重点 | 标题、境界突破、金品天赋、最重要的叙事节点 |

### 2.2 表面层级体系（Surface Elevation Hierarchy）

暗色UI的核心原则：**亮度随高度递增，而非依赖阴影**。组件在Z轴上的位置越高，背景越亮。遵循Material Design暗色主题的四级表面模型。

| 层级 | Tailwind | Hex | 角色 | 适用组件 |
|------|----------|-----|------|----------|
| surface-base | `bg-rg-ink-800` | #121220 | 页面根基 | body背景、页面最底层 |
| surface-raised | `bg-rg-ink-700` | #1a1a2e | 升高1级 | 卡片、面板、侧栏、对话框容器 |
| surface-elevated | `bg-rg-ink-600` | #2d2d58 | 升高2级 | 嵌套卡片、高亮通知、结果反馈区、重要提示 |
| surface-input | `bg-rg-ink-900` | #0a0a14 | 凹陷（反向） | 输入框、表单字段、搜索框 |

**层级规则**：
- base → raised → elevated：每升高一级，亮度递增约5-8%
- input 特殊：输入框产生「凹陷」感，比包裹它的面板更深
- 组件必须使用对应的表面层级色，不得随意混用
- 同一层级内若需要进一步区分，用透明度微调（如面板内子区域用 opacity-90）

**效果验证**：各级之间在OLED和LCD屏幕上均应可辨识，对比度 ≥ 3:1（相邻层级间）。

### 2.3 暗度层级

每个主色有0-950的暗度层级（遵循Tailwind惯例），暗度越高越深。**本节仅适用于非ink类颜色（paper/blood/jade/gold），ink类颜色由§2.2表面层级体系接管**。

- **最深色（700-950）**：谨慎使用，仅用于需要强烈存在感的元素
- **中间色（400-600）**：标准色。正文默认使用rg-paper-100（#faf7e8），重点文字使用gold-600
- **浅色（50-300）**：强调色。仅在hover状态或极少量高亮时使用，大面积浅色会破坏黑暗基调

### 2.4 透明度Token

| Token | 值 | 使用场景 |
|-------|-----|---------|
| opacity-90 | 0.9 | 主面板背景（带blur） |
| opacity-70 | 0.7 | 次要面板背景 |
| opacity-50 | 0.5 | 禁用状态文字 |
| opacity-30 | 0.3 | 占位符文字、弱化提示 |
| opacity-10 | 0.1 | 面板边框、分割线 |

### 2.4 语义色映射

| 语义 | 颜色 | 示例 |
|------|------|------|
| success/positive | rg-jade-600 | `text-rg-jade-600` |
| danger/negative | rg-blood-600 | `text-rg-blood-600` |
| warning/caution | rg-gold | `text-rg-gold` |
| muted/secondary | rgba(245,240,232,0.5) | `text-rg-paper-200/50` |
| primary/action | rg-gold | `bg-rg-gold` |

---

## 3. 字体排印体系

### 3.1 三字体方案

| 角色 | 字体栈 | Tailwind Class | 使用场景 |
|------|--------|---------------|----------|
| 叙事正文 | Noto Serif SC, Songti SC, serif | `font-narrative` | AI生成的叙事文本、世界观描述、角色对话 |
| 数值面板 | Noto Sans SC, PingFang SC, sans-serif | `font-panel` | 属性面板、蛊虫图鉴、战斗结算、所有数据展示 |
| 操作按钮 | PingFang SC, Noto Sans SC, sans-serif | `font-button` | 选项按钮、菜单、设置、所有可交互元素 |

### 3.2 字号层级

| 级别 | 字号 | Tailwind | 字重 | 行高 | 使用场景 |
|------|------|----------|------|------|----------|
| H1 | 2.25rem | `text-4xl` | 700 (bold) | 1.2 | 主标题（蛊真人世界） |
| H2 | 1.5rem | `text-2xl` | 600 (semibold) | 1.3 | 章节标题、重要提示 |
| H3 | 1.25rem | `text-xl` | 500 (medium) | 1.4 | 面板标题、Tab名 |
| Body | 1rem | `text-base` | 400 (normal) | 1.85 | AI叙事正文 |
| Small | 0.875rem | `text-sm` | 400 | 1.5 | 数值标签、辅助信息 |
| Caption | 0.75rem | `text-xs` | 400 | 1.4 | 风险提示、时间戳、注脚 |

### 3.3 色彩-字号组合规则

同一层级的信息，优先通过色彩而非字号区分权重。例如：

- 重要叙事节点用 `text-rg-gold` + `text-base`
- 普通叙事正文用 `text-rg-paper-200` + `text-base`
- 系统提示用 `text-rg-paper-200/50` + `text-sm`

不要出现 `text-2xl text-rg-paper-200`——大字不需要弱色，弱色不需要大字。

---

## 4. 组件设计Token

### 4.1 按钮体系

三种变体，不使用默认shadcn/ui样式：

| 变体 | Tailwind | 使用场景 |
|------|----------|----------|
| Primary | `bg-rg-gold text-rg-ink-900 font-button font-semibold px-4 py-2 rounded-sm hover:brightness-115 hover:scale-[1.02] transition-micro` | 主要操作：测试连通、开始游戏、确认选择 |
| Danger | `bg-transparent text-rg-blood-600 font-button border border-rg-blood-600/40 px-4 py-2 rounded-sm hover:bg-rg-blood-600/15 transition-micro` | 危险操作：删除存档、放弃机缘 |
| Ghost | `bg-transparent text-rg-paper-200 font-button border border-rg-ink-300/20 px-4 py-2 rounded-sm hover:border-rg-gold/40 transition-micro` | 次要操作：取消、返回、设置 |

### 4.2 卡片体系

两种变体：

| 变体 | Tailwind | 使用场景 |
|------|----------|----------|
| Panel | `bg-rg-ink-700/90 border border-rg-ink-300/12 rounded-lg backdrop-blur-md` | 默认面板：属性面板、蛊虫图鉴、势力面板 |
| Highlight | `bg-rg-ink-700/90 border border-rg-gold/25 rounded-lg backdrop-blur-md` | 高亮面板：境界突破、重要事件通知 |

### 4.3 面板边框规范

- 默认边框：`border-rg-ink-300/12`（几乎不可见，但提供了微妙的层次分离）
- 重点边框：`border-rg-gold/25`（只在突破、重要事件等高亮场景使用）
- 禁用粗边框（2px+）：古籍的边界是褪色线，不是实线框
- 禁用圆角过大（`rounded-2xl`+）：古籍手卷的折角是小圆弧

### 4.4 间距体系（4px基准）

| Token | 值 | Tailwind | 使用场景 |
|-------|-----|----------|----------|
| space-1 | 4px | `p-1 / gap-1` | 紧凑元素间距 |
| space-2 | 8px | `p-2 / gap-2` | 标签与内容间距 |
| space-3 | 12px | `p-3 / gap-3` | 卡片内边距 |
| space-4 | 16px | `p-4 / gap-4` | 面板内边距 |
| space-6 | 24px | `p-6 / gap-6` | 面板间距 |
| space-8 | 32px | `p-8 / gap-8` | 大区块间距 |
| space-12 | 48px | `p-12 / gap-12` | 页面级间距 |

---

## 5. 动效规范

### 5.1 过渡时长

| 级别 | 时长 | Tailwind | 使用场景 |
|------|------|----------|----------|
| 微交互 | 150ms | `transition-micro` | 按钮hover、输入框focus、图标状态切换 |
| 面板切换 | 300ms | `transition-panel` | Tab切换、面板展开/折叠、模态框出入 |
| 场景转换 | 500ms | `transition-scene` | 标题画面→游戏界面、章节转换、全屏过场 |

### 5.2 缓动曲线

- micro: `ease-out` — 快速响应，不拖沓
- panel: `cubic-bezier(0.16, 1, 0.3, 1)` — 平滑减速
- scene: `cubic-bezier(0.7, 0, 0.84, 0)` — 先加速后减速

### 5.3 动效禁用项

- 禁用 `transform` 改变布局属性（width/height/top/left）——只能用 `transform: scale()` 或 `opacity`
- 禁用持续循环动画，除了打字机光标闪烁（唯一的例外）
- 禁用全屏粒子效果（阶段5可选，非核心）
- 禁用GSAP/Framer Motion混合在同一组件中
- 必须尊重 `prefers-reduced-motion`——若用户开启了减少动画，禁用所有非必要动效

### 5.4 特殊动效（阶段3B+启用）

- 境界突破：全屏rg-gold微光闪动 + 文字淡入，持续500ms
- 死亡场景：rg-blood底色渐变覆盖 + 文字逐字淡出，持续1000ms
- 打字机效果：逐字渲染，默认20ms/字，可在设置中调整

---

## 6. 暗黑UI禁则

以下资源直接继承前端开发技能规范（Forbidden Patterns §1.5），针对蛊真人项目额外收紧：

### 6.1 色彩禁则

- 禁用纯黑 `#000000` —— 用 `rg-ink-950 (#05050a)` 替代
- 禁用高饱和霓虹色 —— 所有主色饱和度 ≤ 80%
- 禁用渐变文字在标题上（`text-gold-gradient` 仅限极少数场景）
- 禁用自定义光标 —— 保持系统默认

### 6.2 字体禁则

- 禁用 Inter 字体 —— 使用思源宋体/思源黑体/苹方
- 禁用过大的 H1（> 3rem）—— 古籍不会有超大标题
- 禁用 Serif 在数值面板 —— 数据必须用无衬线字体

### 6.3 图标禁则

- 禁用 emoji 作为图标 —— 使用 Lucide Icons
- 图标统一尺寸：24x24（默认）、20x20（紧凑）、16x16（内联）
- 图标颜色跟随父元素文字颜色

### 6.4 布局禁则

- 禁用均匀三列等宽卡片布局 —— 使用非对称Bento网格
- 禁用居中对齐的英雄式布局（hero section）—— 古籍手卷是左对齐的
- 禁用 `h-screen` —— 使用 `min-h-[100dvh]`

### 6.5 组件禁则

- 禁用默认shadcn/ui样式不改动直接使用 —— 必须覆写为账簿式风格
- 禁用通用的卡片样式（`shadow-lg rounded-xl bg-white`）
- 每次生成UI组件后自查：是否符合账簿式的古籍手卷感？

---

## 7. 引用关系

本文档与以下文件配合使用：

- `game-design-document.md` §6.1：色彩体系和组件树的原始定义
- `tailwind.config.js`：色彩Token的代码实现
- `src/index.css`：CSS变量和全局样式的代码实现

所有后续UI组件开发必须在编码前阅读本文档，确保视觉一致性。

---

## 参考文献

1. [FutureAIGuide/future-ai-design-tokens](https://github.com/FutureAIGuide/future-ai-design-tokens) — AI友好的设计Token库
2. [adrianspeyer/speyer-ui](https://github.com/adrianspeyer/speyer-ui) — 暗色模式CSS设计系统
3. [shadcn/ui Theming](https://ui.shadcn.com/docs/theming) — shadcn/ui主题化文档
4. 前端开发技能规范 — Design Engineering §1.3-1.6, Forbidden Patterns §1.5, Motion Engine §2.1-2.6
