# RebornG 错误记录

> 用途：记录历史Bug和修复方案，避免重复踩坑。每次修复Bug后追加条目。

---

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
