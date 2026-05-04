# Bug修复工作总结 — 2026年5月3日

## 一、用户反馈的7个核心问题

1. **开局选域链路断裂**：选中洲开局仍显示青茅山、前往山寨
2. **成就持久化**：刷新浏览器成就从零开始
3. **存档/继续游戏**：TitleScreen 的"继续冒险"按钮消失
4. **剧情链路**：中洲开局 → 第一个选项是"前往山寨" → 又回到南疆
5. **舆图标题**：固定显示"南疆舆图"，与所选域不符
6. **BGM缺失**：点击提示音有，但背景音乐无
7. **ChapterTransition/点击卡死**：overlay 阻挡所有鼠标事件

## 二、已完成的修复（按文件）

### 2.1 ChapterTransition.tsx（点击卡死问题）
- 移除内联 GSAP 代码，只负责 DOM 渲染
- 添加 `pointerEvents: showContent ? 'auto' : 'none'`
- `.chapter-epigraph` 始终渲染（`minHeight: '20px'` + `\u00A0` 占位）
- 添加 30s 安全超时自动关闭
- 当 `progressionResult` 为空时自行调用 `checkProgression()` 兜底
- 移除未使用的 `useRef` import

### 2.2 useAnimationBridge.ts（GSAP竞态）
- 双重 `requestAnimationFrame` 等待 ChapterTransition DOM 渲染后再启动 GSAP

### 2.3 chapterTransition.ts（GSAP动画定义）
- GSAP 不再控制 `.chapter-overlay` opacity（交React管理）
- 避免动画结束后透明 overlay 阻挡点击

### 2.4 AchievementPanel.tsx（死循环修复）
- `useStore(s => s.getAchievementStats?.())` 每次返回新对象 → 无限循环
- 改为 `useMemo` 本地计算统计
- 移除未使用的 `showHidden` 状态

### 2.5 中州→中洲命名统一（多文件）
- `OriginSelectScreen.tsx`: '中州' → '中洲'
- `SVGMapPanel.tsx`: REGION_COLORS/REGION_BORDERS/REGION_ELLIPSES
- `context-builder.ts`: 系统提示词
- `world-rules.json`: 域定义 key

### 2.6 CharacterCreate.tsx（初始化章节）
- `handleConfirm` 中提取出身域名
- 调用 `useStore.setState({ currentDomain: originDomain })` 同步设置域
- 异步加载 chapters.json 查找 domainOpeningChapter 并调用 initChapter
- 同步更新 movePlayer/revealRegion

### 2.7 useGamePipeline.ts（启动时初始化章节）
- import chapters.json
- `startGame(isResume=false)` 时从 profile.background 提取域名
- 查找域的 domainOpeningChapter 并调用 initChapter

### 2.8 GameScreen.tsx（舆图标签动态化）
- `PANEL_TITLES` 改为 `getPanelTitle(panel, currentDomain)` 函数
- 工具栏地图按钮标签根据 `currentDomain` 动态生成
- `TOOLBAR_BUTTONS` 改为 `TOOLBAR_BUTTONS_BASE` + `getToolbarLabel`

### 2.9 store/index.ts（成就持久化+存档修复）
- `resetStore()` 从独立 localStorage key 恢复成就数据
- `partialize` 排除成就字段（避免双重真相源覆盖）
- `resetStore()` 先 `localStorage.removeItem('gu-zhenren-save')` 清除持久化缓存

### 2.10 context-builder.ts（章节fallback修复）
- `currentChapter` fallback 从 '青茅山期' 改为 ''
- `currentDomain` fallback 从 '南疆' 改为 ''
- `chapterDef` 查找失败时回退到 domainOpeningChapter

### 2.11 soundSlice.ts（BGM路径修复）
- DOMAIN_BGM 路径指向子目录（nanjiang/nanjiang.mp3 等）

## 三、验证状态

- ✅ `tsc --noEmit` 无类型错误
- ✅ `vite build` 成功生成 dist/ 产物
- ✅ 所有修改文件零 lint 错误

## 四、可能存在遗留问题（需要验证）

1. **存档/继续按钮**：TitleScreen 的 `useStore.persist.hasHydrated()` + localStorage 检测逻辑是否正确？（暂未修改 TitleScreen.tsx，需要测试验证）
2. **BGM质量**：当前 BGM 是合成生成的（ccMixter电子音乐），用户要求换成蛊真人原著风格的高质量中文古风音乐。需要从 Pixabay/Chosic 等平台下载优质素材。
3. **剧情链路**：即使 domain/chapter 正确初始化，AI 返回的剧情文本仍可能提"青茅山"/"山寨"（因为 system prompt 中开局叙事模板可能硬编码）。需要检查 context-builder 开局提示词生成逻辑。
4. **StatusBar 章节标题**：需要确认 `currentChapter` 是否在 initChapter 后正确更新到 UI 上。
