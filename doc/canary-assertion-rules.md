# Layer 4 金丝雀断言规则 (Canary Assertions)

> 版本: Draft 2（经原著设定审核修正）  
> 审核状态: C05/C09 已确认，C01/C11/C12 已按原著修正  
> 关联: 《Prompt 优化极限方法论手册》

---

## 设计原则

金丝雀断言与 Layer 3 语义规则引擎的核心差异:

| 维度 | Layer 3 (语义规则) | Layer 4 (金丝雀断言) |
|------|-------------------|---------------------|
| 判定方式 | 词簇概率评分 (0-100) | 确定性二值判断 (通过/拒绝) |
| 上下文感知 | 仅看文本本身 | 结合 `store` 玩家状态 |
| 误报率 | 中等（如"回忆越级战斗"可能触发 R01） | 低（状态感知消除假阳性） |
| 性能 | ~5ms | ~2ms（纯逻辑判断） |
| 定位 | 兜底检测 | 前置过滤器（在 L3 之前运行） |

---

## 12 条规则详情

### C01 — 越级战斗合理性守卫 (RealmCrossCheck) ⚠️ Warning

**原著设定**: 蛊真人世界中**越级杀确实可能**，战斗核心取决于道痕数量而非纯粹境界差距。典型案例：无极魔尊刚升仙即有八转巅峰级道痕（30万），可抗衡普通八转。但越级战斗必须伴随极端条件：特殊杀招、道痕碾压、仙蛊优势、巨大代价。

**判定逻辑**（修正后）:  
若 `text` 描述玩家跨境界战胜对手（对手境界 > `player.realm.grand`），**且**文本中**没有**出现以下任一"越级合理性标记词"，则触发 Warning:
- 杀招相关: `杀招` `仙蛊` `道痕` `底牌`
- 代价相关: `代价` `反噬` `重伤` `耗尽` `燃烧`
- 条件相关: `偷袭` `借助` `天时` `地利`

**不再直接 reject**——越级战斗在蛊真人世界中是合理的戏剧冲突，只要 AI 给出了足够的世界观支撑。

**伪代码**:
```
opponentRealm = extractRealmFromText(text)
if opponentRealm > player.realm.grand:
  victoryWords = ["战胜", "击败", "打倒", "打退", "击杀"]
  if text.containsAny(victoryWords):
    justificationWords = ["杀招", "仙蛊", "道痕", "底牌", "代价", "反噬", "重伤", "耗尽", "燃烧", "偷袭", "借助", "天时", "地利"]
    if not text.containsAny(justificationWords):
      → warn (缺少越级合理性说明)
```

---

### C02 — 方源角色锁 (FangYuanLock) ⚡ Critical

**判定逻辑**:  
若 `text` 包含「方源」或「古月方源」，且同时出现「信任」「友善」「欣赏」「交朋友」「全力支持」「看好你」，则触发。

**设计理由**: 方源在原著中是极致利己、算无遗策的角色，任何友善描写都是角色崩坏。

**伪代码**:
```
if text.contains("方源") or text.contains("古月方源"):
  forbidden = ["信任", "友善", "欣赏", "交朋友", "全力支持", "看好你"]
  if text.containsAny(forbidden):
    → reject
```

---

### C03 — 境界跳跃检测 (RealmJumpDetector) ⚡ Critical

**判定逻辑**:  
若 `state_update.realm.value` 从 N 转直接跳到 N+2 转以上（如「一转初阶」→「三转初阶」），则触发。

**设计理由**: 蛊真人世界中境界必须逐转突破，跳转违反世界规则。

**伪代码**:
```
oldRealm = player.realm.grand  // 从 store 读取当前境界
newRealm = parseRealm(state_update.realm.value)
if newRealm.grand - oldRealm >= 2:
  → reject
```

---

### C04 — 免费午餐检测 (FreeLunchCheck) ⚡ Critical

**判定逻辑**:  
若 `state_update.gu_inventory.add` 含 rank ≥ `epic` 的蛊虫，且 `text` 不含任何「代价」「风险」「但是」「换取」「条件」「如果失败」词，则触发。

**设计理由**: 高稀有度蛊虫的获得必须伴随对等代价，这是蛊真人世界观铁则。

**伪代码**:
```
if state_update.gu_inventory.add has any gu with rank in ["epic", "legendary", "divine"]:
  costWords = ["代价", "风险", "但是", "换取", "条件", "如果失败"]
  if not text.containsAny(costWords):
    → reject
```

---

### C05 — 属性突变检测 (AttrSpikeDetector) ⚠️ Warning

**判定逻辑**:  
若单次 `state_update` 中任意属性（资质/根骨/心智/气运）变化绝对值 > `THRESHOLD`，则触发。

**阈值**: `±3`（已确认）。若文本同时包含苛刻条件标记词（`代价` `反噬` `燃烧寿命` `天意`），阈值放宽至 `±5`。

**设计理由**: 属性代表蛊师天赋根基，大幅突变违反成长逻辑。但蛊真人世界中机缘（如天意干预、特殊蛊虫炼化）确实可能带来显著变化。

**伪代码**:
```
THRESHOLD = 3
harshConditionWords = ["代价", "反噬", "燃烧寿命", "天意"]
if text.containsAny(harshConditionWords):
  THRESHOLD = 5
for attr in ["资质", "根骨", "心智", "气运"]:
  if abs(state_update.attributes[attr].value) > THRESHOLD:
    → warn
```

---

### C06 — 生命/真元溢出检测 (VitalOverflowCheck) ⚡ Critical

**判定逻辑**:  
若 `state_update.health.current > health.max` 或 `essence.current > essence.max`，则触发。

**设计理由**: 数据类型约束，数值溢出会导致 UI 显示异常和游戏逻辑错误。

**伪代码**:
```
if state_update.health:
  if health.current > health.max:
    → reject
if state_update.essence:
  if essence.current > essence.max:
    → reject
```

---

### C07 — 选择结构完整性 (ChoiceStructureCheck) ⚡ Critical

**判定逻辑**:  
若 `choices` 数组中无 `risk: 'high'` 或无 `risk: 'low'` 的选项，则触发。

**设计理由**: 叙事铁则要求每轮"必须包含一个保守选项和一个冒险选项"，缺少任一说明 AI 没有提供足够的选择空间。

**伪代码**:
```
hasHigh = choices.some(c => c.risk === "high")
hasLow = choices.some(c => c.risk === "low")
if not hasHigh or not hasLow:
  → reject
```

---

### C08 — 叙事长度硬边界 (TextBoundaryCheck) ⚡ Critical

**判定逻辑**:  
若 `text.length < 80` 或 `> 900`，则触发。

**设计理由**: Zod schema 已约束 100-800 字，此处做更宽松的二次防线，仅拦截极端异常值（如空字符串或超长输出）。比 Zod 宽松是因为 Zod 验证失败会触发重试，而金丝雀断言直接 reject 不重试。

**伪代码**:
```
if text.length < 80 or text.length > 900:
  → reject
```

---

### C09 — 爽文禁词检测 (PowerFantasyGuard) ⚠️ Warning

**判定逻辑**:  
若 `text` 包含禁词列表中的任意词，则触发。累计 3 次 Warning 升级为 reject。

**禁词列表** (6 词，已确认):
`热血沸腾` `充满希望` `美好未来` `前途无量` `轻松愉快` `皆大欢喜`

后续测试如发现遗漏再补充。

**设计理由**: 蛊真人叙事必须是黑暗现实风格。这些词是典型爽文/热血漫标志，一旦出现说明 AI 偏离了叙事基调。

**伪代码**:
```
forbiddenWords = ["热血沸腾", "充满希望", "美好未来", "前途无量", "轻松愉快", "皆大欢喜"]
hits = text.countAny(forbiddenWords)
if hits > 0:
  → warn (accumulate: 3 warns → reject)
```

---

### C10 — 核心NPC威慑力守卫 (NPCDeterrenceGuard) ⚡ Critical

**判定逻辑**:  
若 `text` 提及 NPC 名且该 NPC 在 canon NPC 列表中标记为「威慑型」，同时出现「拍了拍」「露出微笑」「温和地说」「和蔼」，则触发。

**依赖**: 需 `src/canon/npcs.json` 配置文件（在 4B.1 阶段建立）。

---

### C11 — 蛊虫死后销毁守卫 (GuDestructionGuard) ⚡ Critical

**原著设定**: 蛊师/蛊仙在临死前通常会自爆蛊虫，防止落入敌手。直接杀死敌人后获取其蛊虫是极其罕见的——获取他人蛊虫的正规途径是通过「力量传承」（设下考验）或极其特殊的杀戮手段（如瞬间击杀让其来不及自爆）。像方源获取血颅蛊等属于极端个案。

**判定逻辑**:  
若 `text` 描述玩家杀死了蛊师/蛊仙，**且**叙事中描述玩家轻松获取了对方的蛊虫，**且**文本中没有出现以下任一"正当获取标记词":
- 传承相关: `传承` `考验` `试炼` `认可`
- 特殊手段: `春秋蝉` `魂道` `梦境` `算计已久` `偷袭得手` `瞬间击杀`

则触发 reject。

**伪代码**:
```
if text.containsAny(["杀死", "击杀", "毙命", "陨落"]):
  if text.containsAny(["获得了", "得到了", "取走了", "收走"]) and text.containsAny(["蛊"]):
    justificationWords = ["传承", "考验", "试炼", "认可", "春秋蝉", "魂道", "梦境", "算计已久", "偷袭得手", "瞬间击杀"]
    if not text.containsAny(justificationWords):
      → reject
    else:
      → warn (有获取标记，但仍需人工判断合理性)
```

---

### C12 — 仙窍转化守卫 (ApertureTransformGuard) ⚠️ Warning

**原著设定**: 蛊仙死后，其仙窍会吸收天地二气，落地转化为福地或洞天。六转仙窍→福地，七转以上→洞天。福地/洞天中会诞生「地灵」——由蛊仙生前执念（obsession）结合天地伟力形成。地灵认主条件与蛊仙生前的执念直接相关：能满足执念者方可得地灵认可。吞并福地需相应流派境界：六转福地需大师级，七转需宗师级，八转洞天需大宗师级。

**判定逻辑**:  
若 `text` 描述蛊仙死亡，**且**未提及仙窍转化为福地/洞天的过程（对于非战斗叙事中省略仙窍下落的情况不应触发——仅在"正面描写蛊仙死亡场景"时检查），则触发 Warning。

**注意**: 此规则需要在 Canon 数据中维护"当前已知的福地/洞天"列表。若 AI 在叙事中引入了新的蛊仙死亡事件，应自动将该蛊仙的仙窍加入待转化列表，供后续叙事引用。

**伪代码**:
```
if text.containsAny(["蛊仙", "仙尊", "真君"]) and text.containsAny(["陨落", "身死", "死亡", "殒命"]):
  transformWords = ["福地", "洞天", "仙窍落下", "仙窍落地", "天地二气"]
  if not text.containsAny(transformWords):
    → warn (蛊仙死亡未提及仙窍转化，可能遗漏世界观设定)
```

---

## 已确认事项

1. **C05 阈值**: `±3`，苛刻条件可放宽至 `±5` ✅
2. **C09 禁词列表**: 6 词足够，测试后有问题再补充 ✅
3. **C10 NPC 名单**: 在 **阶段 4B.1 (Canon 数据注入)** 中建立 `src/canon/npcs.json`，定义威慑型/友善型 NPC 名单 ✅

---

## 原著设定补充（注入 Phase 4B.1 Canon 数据）

以下设定经原著和 wiki 核查，不属于金丝雀断言规则本身，但需要在 4B.1 阶段写入 `src/canon/` 数据文件，供 `ContextBuilder` 注入 AI 上下文:

| 设定项 | 写入文件 | 内容 |
|--------|---------|------|
| 蛊虫死后销毁 | `src/canon/world-rules.json` | 蛊师死前自爆蛊虫、力量传承体系、遗藏 vs 传承的区别 |
| 仙窍转化 | `src/canon/world-rules.json` | 六转→福地、七转+→洞天、地灵=执念+天地伟力、认主条件 |
| 吞窍门槛 | `src/canon/world-rules.json` | 六转福地需大师级、七转需宗师级、八转洞天需大宗师级 |
| 地灵认主 | `src/canon/npcs.json` | 地灵性格由蛊仙执念决定，认主条件 = 满足执念 |
| 越级战斗规则 | `src/canon/world-rules.json` | 道痕数量为核心战力指标、杀招可弥补境界差距、越级条件苛刻但可能 |

---

## 与现有系统的集成点

- **执行顺序**: Layer 4 → Layer 3 → Layer 2 (Zod/JSON retry)。金丝雀断言作为前置过滤器，最快拦截确定性违规。
- **管道状态**: 新增 `PipeState.VALIDATING_L4` 阶段（在 `VALIDATING_L3` 之前）。
- **违规处理**: Critical → 直接 reject 返回 ERROR；Warning → 记录但放行，累计追踪在 `narrativeSlice` 中。
- **性能**: 10 条断言纯逻辑判断 ~2ms，不增加明显延迟。
