import type { AIContext, KeyEvent, Message, ProximityEvent, GlobalFlag, CombatConstraint } from '../types';
import type { RootStore } from '../store';

// ─── 知识库静态导入 ───
import guDatabaseRaw from '../canon/gu-database.json';
import worldRulesRaw from '../canon/world-rules.json';
import terminologyRaw from '../canon/terminology.json';
import npcsRaw from '../canon/npcs.json';
import chaptersRaw from '../canon/chapters.json';
import economyRaw from '../canon/economy.json';

const guDatabase = guDatabaseRaw as Record<string, any>;
const worldRules = worldRulesRaw as Record<string, any>;
const terminology = terminologyRaw as Record<string, any>;
const economyData = economyRaw as Record<string, any>;

// ─── System Prompt Layer 1: 世界观核心 ───
const SYSTEM_PROMPT_LAYER1 = `你是蛊真人模拟器的AI游戏主持人。你必须按以下格式输出纯JSON：{"narrative":{"text":"叙事","choices":[{"id":"c1","text":"选项","risk":"high|medium|low","risk_note":"风险说明"}]},"state_update":{...}}。字段名不可自创：choices非options、state_update非stateUpdate。

世界观：蛊界弱肉强食。境界不可逾越。禁止markdown包裹。`;

// ─── System Prompt Layer 2: 格式速查（精简至~200 tokens）───
const SYSTEM_PROMPT_LAYER2 = `字段速查: choices[].{id,text,risk,risk_note} | state_update.{player,wealth,gu_inventory,flags,dao_marks,path_levels,materials,dynamic_npcs} | risk值high|medium|low。铁则: 2-4选项各含risk/risk_note, 高境界压低级, 方源利己不友善, 机缘有代价, 道心给dao_heart, 元石变动给wealth.delta, 道痕变动给player:{dao_marks:{"力道":500}}, 境界变动给path_levels, 获得蛊虫给gu_inventory:{add:[{name:"铁甲蛊",tier:1,path:"金道",rarity:"稀有",description:"提升防御"}]}, 获得蛊材/材料给materials:{add:{"沼泽毒泥":2,"毒虫毒囊":1}}, 真元消耗给player.essence:{current:60,max:100}, HP变化给player.health:{current:80,max:100}。重要：真元消耗或HP变化在叙事中出现时必须在state_update中回写。材料(毒囊、兽骨、毒泥等)不是蛊虫，必须走materials字段不要错放到gu_inventory。道心影响选项：杀性高→激进暴力选项,仁心高→救赎怜悯选项,谋略高→计谋迂回选项,野心高→权势自利选项。

🆕 动态NPC规则: 叙事中遇到新的"路人甲"NPC（非202预定义NPC）时，通过state_update.dynamic_npcs.add回写结构化数据: [{name:"张三",path:"力道",realm:1,personality:"憨厚老实",bonding_hint:"张三感激你出手相助，对你心生敬佩"}]. realm限制1-2(凡人/一转初阶)，避免战力通胀。人物不可重复（检查之前叙事中是否已出现同名者）。已有NPC好感变化通过dynamic_npcs.affinity_delta回写: [{name:"张三",delta:5}]。`;

// ─── Layer S: 风格指南（注入版） ───
const STYLE_GUIDE_INJECT = `
【叙事风格指南】
- 人称：第二人称（"你"），让玩家代入角色
- 语气：冷静克制，不煽情不热血。黑暗现实基调——蛊界残酷
- 禁用爽文套路：热血沸腾、充满希望、美好未来、前途无量、轻松愉快、皆大欢喜
- 禁用NPC降智：无条件信任、无偿赠送、欣赏主角、全力栽培
- 每个机缘必有对等代价，每个选项都有明确风险
- 叙事推进（铁则）：每一轮叙事必须推动剧情实质性前进，不可在同一场景中循环不变。场景核心信息（地点/敌人/目标）应每轮有所变化——要么场景转变，要么状况发展，要么角色关系深化。禁止连续三轮在完全相同的矿洞/同一只蛊兽前原地打转
- 蛊虫存放：蛊师可将蛊虫收入体内空窍，无需笼具或腰间携带。仅凡人/未开窍者才需外部容器。不可描述"蛊虫笼""腰间挂着蛊虫"等物理存放方式。十绝体空窍完全充满元海无空腔，需依赖第二空窍蛊或外力携带蛊虫——此为重要叙事设定
- 蛊虫脆弱性（分层规则）：蛊虫本身极其脆弱——一只一转蛊虫被凡铁击中也可能死亡。蛊虫平时存放在蛊师空窍中受层层保护，常规战斗中双方以杀招互搏，蛊虫本体不应成为直接攻击目标。以下场景例外：(1)蛊师濒死时空窍破裂，蛊虫震出体外丧失保护 (2)十绝体空窍无空腔，蛊虫暴露 (3)特殊蛊虫本身不在空窍内——如天意蛊虫（宿命蛊）、野生仙蛊、已放出体外施法的蛊虫——可直接被外力作用。此类场景需明确描写空窍破裂/蛊虫位置/特殊性质等前因后果，不可随意出现。蛊虫消亡正常途径：蛊师死亡自爆、长期饥饿致死、炼蛊失败反噬
- 获得蛊虫须知：若叙事中NPC给予/玩家获取了蛊虫，必须在state_update的gu_inventory.add字段中记录（含name/tier/path/rarity/description）。仅文本描述"获得"而不在state_update中记录=UI不会显示
- 描写侧重氛围和后果，不过度描写战斗动作细节
- 人名规范：古月方源不可称"方源哥哥"等亲昵称呼
- 地名使用原著正名：南疆、北原、东海、西漠、中洲`;

/* ═══ isOpening 硬编码路径已移除（遵循「约束注入，而非固定脚本」原则） ═══
 * 原 buildOpeningPrompt + DOMAIN_OPENING 硬编码"刚开窍的蛊师学徒（一转初阶）"，
 * 导致时间线起点（义天山/逆流河等）的高境界信息被完全无视，叙事沦为新人故事。
 * 现统一走标准 prompt — chapterConstraints/境界/道痕/NPC上下文全量注入，
 * AI 从约束中自动推导对应叙事。符合「章节是状态区间，不是叙事容器」原则。 */

// ─── Canon / IF 模式分化 ───
// P2修复：正史线提示词不再硬编码南疆，根据currentDomain动态生成
function buildCanonModeInject(currentDomain: string): string {
  const domainCanonHints: Record<string, string> = {
    '南疆': '方源此时应在南疆古月山寨附近活动，核心NPC如方源、太白云生等在南疆活跃',
    '北原': '方源此时应在南疆活动，北原黄金家族感受到南疆变局的余波，各部族在暗中观望',
    '东海': '南疆正经历大变动，东海散修界隔海观望，商路和情报网络受到影响',
    '西漠': '南疆剧变的消息穿越沙漠传来，绿洲城邦的商人们议论纷纷',
    '中洲': '天庭正密切关注南疆的异动，中洲十大门派接到监视南方局势的密令',
  };
  const hint = domainCanonHints[currentDomain] || domainCanonHints['南疆'];
  return `
【当前模式：正史线】
你正处于蛊真人原著主线中。当前所在域：${currentDomain}。
- ${hint}
- 原著关键事件（如方源使用春秋蝉重生、与太白云生相遇）按时间线发生
- 核心NPC（方源、太白云生等）性格和行为遵循原著
- 玩家作为独立蛊师，可与原著角色互动但不可改变原著主线关键节点
- 如果玩家接触到原著关键剧情点，应以"旁观者"或"次要参与者"身份描写`;
}

const IF_MODE_INJECT = `
【当前模式：IF线（自由探索）】
原著事件线已完全断裂。你是这片蛊界的唯一主宰。
- 不拘泥于原著时间线和事件
- 蝴蝶效应最大化——玩家的每个选择都可能引发连锁反应
- 原著角色可以作为NPC出现，但他们的命运和行动完全由当前叙事决定
- 创造全新的机缘、危机和剧情发展
- 保持蛊真人的黑暗现实基调和世界观规则`;

// ─── 世界规则注入 ───
function injectWorldRules(): string {
  const rules = worldRules;
  const lines: string[] = ['', '【蛊界核心规则】'];

  if (rules['蛊虫死后销毁']) {
    const r = rules['蛊虫死后销毁'] as any;
    lines.push(`- 蛊虫死后销毁：${r.rule}`);
    lines.push(`  例外：${r.exception}`);
  }
  if (rules['蛊虫本体脆弱性']) {
    const r = rules['蛊虫本体脆弱性'] as any;
    lines.push(`- 蛊虫脆弱性：${r.rule}`);
    lines.push(`  战斗规则：${r.combatRule}`);
    lines.push(`  例外：${r.exception}`);
    lines.push(`  正常消亡：${r.normalDeathCauses}`);
  }
  if (rules['道痕战力模型']) {
    const r = rules['道痕战力模型'] as any;
    lines.push(`- 战力核心：${r.core}`);
    lines.push(`  越级可能：${r['越级可能']}`);
  }
  if (rules['气运不可见']) {
    const r = rules['气运不可见'] as any;
    lines.push(`- 气运：${r.rule}（${r.条件}）`);
  }
  if (rules['蛊虫喂养通用规则']) {
    const r = rules['蛊虫喂养通用规则'] as any;
    lines.push(`- 蛊虫喂养：${r.rule}。${r.饥饿}。${r.反噬}`);
  }
  if (rules['仙窍转化']) {
    const r = rules['仙窍转化'] as any;
    lines.push(`- 仙窍转化：${r.rule}`);
    lines.push(`  地灵：${r['地灵形成']}。认主条件：${r['地灵认主']}`);
  }
  if (rules['流派互斥']) {
    const mutex = rules['流派互斥'] as Record<string, string>;
    const pairs = Object.entries(mutex).filter(([k]) => k.includes('↔')).slice(0, 5);
    if (pairs.length > 0) {
      lines.push(`- 流派互斥示例：${pairs.map(([k, v]) => `${k}（${v}）`).join('、')}`);
    }
  }

  return lines.join('\n');
}

// ─── 蛊虫知识注入（按玩家当前蛊虫匹配） ───
function injectGuKnowledge(inventory: Array<{ name: string; tier: number; path: string }>): string {
  if (!inventory || inventory.length === 0) return '';

  const relevant: Array<{ name: string; feed: string; fail: string }> = [];
  for (const gu of inventory.slice(0, 6)) {
    const data = guDatabase[gu.name];
    if (data) {
      relevant.push({
        name: gu.name,
        feed: data.feed || '未知',
        fail: data.usageFailure || data.feedFailure || '未知',
      });
    }
  }

  if (relevant.length === 0) return '';

  return [
    '',
    '【玩家当前蛊虫参考】',
    ...relevant.map(g =>
      `- ${g.name}：喂养=${g.feed}；失败=${g.fail}`
    ),
    '请确保叙事中蛊虫的使用、喂养、反噬符合以上设定。',
  ].join('\n');
}

// ─── 章节约束注入（P1新增：基于chapters.json注入域约束/位置锁/场景约束） ───
function injectChapterConstraints(store: RootStore): string {
  const s = store as any;
  // P3修复：直接从 store 读取 currentChapterId + currentDomain，不再依赖 flags 同步
  const currentChapterId = s.currentChapterId || '';
  const currentDomain = s.currentDomain || '';
  
  if (!currentChapterId || !currentDomain) return '';

  const chaptersData = chaptersRaw as any;
  const domainChapters: any[] = chaptersData.domains?.[currentDomain] || [];
  const chapterDef = domainChapters.find((c: any) => c.id === currentChapterId);

  if (!chapterDef) {
    console.warn(`[ContextBuilder] 未找到章节定义: id=${currentChapterId} domain=${currentDomain}`);
    return '';
  }

  const lines: string[] = ['', '【当前章节约束】'];

  // 位置约束
  if (chapterDef.position) {
    lines.push(`- 当前位置：${chapterDef.position.region} · ${chapterDef.position.area}`);
    if (chapterDef.position.accessibleLocations?.length > 0) {
      lines.push(`- 可前往地点：${chapterDef.position.accessibleLocations.join('、')}`);
    }
  }

  // 势力约束
  if (chapterDef.keyFactions?.length > 0) {
    lines.push(`- 当前势力存在：${chapterDef.keyFactions.join('、')}`);
  }

  // 场景约束（AI叙事引导）
  if (chapterDef.sceneConstraints) {
    const sc = chapterDef.sceneConstraints;
    if (sc.mustHappen?.length > 0) {
      lines.push(`- 叙事应涉及：${sc.mustHappen.join('、')}`);
    }
    if (sc.mustNotHappen?.length > 0) {
      lines.push(`- 叙事禁止：${sc.mustNotHappen.join('、')}`);
    }
    if (sc.narrativeTheme) {
      lines.push(`- 叙事主题：${sc.narrativeTheme}`);
    }
  }

  // 经济系数（P1预留，P2由economy系统消费）
  if (chapterDef.chapterPriceMultiplier && chapterDef.chapterPriceMultiplier !== 1.0) {
    lines.push(`- 物价系数：${chapterDef.chapterPriceMultiplier}x（基础价格乘以该系数）`);
  }

  // 涟漪层（P2修复：不再使用rippleLayers，由injectRippleEvents+injectGlobalFlags替代）
  return lines.join('\n');
}

// ─── P2-2a: 涟漪事件注入（L0/L1/L2分层注入AI prompt） ───
function injectRippleEvents(store: RootStore): string {
  const proximityEvents: ProximityEvent[] = (store as any).proximityEvents || [];
  if (proximityEvents.length === 0) return '';

  const lines: string[] = ['【世界动态 — 全局事件涟漪】'];
  const seen = new Set<string>();

  for (const evt of proximityEvents) {
    if (seen.has(evt.eventId)) continue;
    seen.add(evt.eventId);

    switch (evt.layer) {
      case 'L0':
        lines.push(`● [当前事件: ${evt.name}] 你正处于事件的中心——${evt.manifestation || '事件的完整叙事正在展开'}`);
        break;
      case 'L1':
        if (evt.distance <= 15) {
          lines.push(`○ [可介入: ${evt.name}] 你感知到这一事件的直接影响——${evt.manifestation || ''}。你可选择是否介入。`);
        } else {
          lines.push(`○ [临近: ${evt.name}] ${evt.manifestation || '你感受到远方传来的波动，但影响尚不明显。'}`);
        }
        break;
      case 'L2':
        lines.push(`· [远方的消息: ${evt.name}] ${evt.manifestation || '远方的天际传来一丝不寻常的气息。'}`);
        break;
      default:
        break;
    }
  }

  return lines.join('\n');
}

// ─── P2-2a: L3全局flag注入（持久世界状态影响） ───
let globalFlagsCache: GlobalFlag[] | null = null;
function loadGlobalFlags(): GlobalFlag[] {
  if (globalFlagsCache) return globalFlagsCache;
  try {
    const raw = require('../canon/global-flags.json');
    globalFlagsCache = (raw.flags || []) as GlobalFlag[];
  } catch {
    globalFlagsCache = [];
  }
  return globalFlagsCache;
}

function injectGlobalFlags(store: RootStore): string {
  const allFlags = loadGlobalFlags();
  if (allFlags.length === 0) return '';

  const globalEventStatus: Record<string, { triggered: boolean; completed: boolean }> =
    (store as any).globalEventStatus || {};

  const activeFlags = allFlags
    .filter(f => {
      const status = globalEventStatus[f.eventId];
      return status && status.completed;
    })
    .sort((a, b) => a.priority - b.priority);

  if (activeFlags.length === 0) return '';

  const lines: string[] = ['【当前世界状态 — 全局事件影响】'];
  for (const flag of activeFlags) {
    lines.push(`- ${flag.name}：${flag.effectOnNarrative}`);
  }

  return lines.join('\n');
}

// ─── P2-4b: 战斗约束注入（叙事战斗场景） ───
function injectCombatConstraint(store: RootStore): string {
  const cc = (store as any).transientCombatConstraint as CombatConstraint | null;
  if (!cc) return '';

  // 消费后清除
  if (typeof (store as any).setTransientCombatConstraint === 'function') {
    (store as any).setTransientCombatConstraint(null);
  }

  const lines: string[] = ['【战斗场景约束 — 叙事战斗】'];
  lines.push(`- 场景类型：${cc.scale === 'battle' ? '大规模战斗' : '小规模冲突'}（${cc.strategicChoiceCount}个战略选项）`);
  if (cc.baseChance !== undefined) {
    lines.push(`- 基础成功概率：${Math.round(cc.baseChance * 100)}%（受境界差和流派加成调整）`);
  }
  if (cc.recommendedRealm !== undefined) {
    lines.push(`- 推荐境界：${cc.recommendedRealm}转`);
  }
  lines.push(`- 必须发生：${cc.mustHappen.join('；')}`);
  lines.push(`- 禁止出现：${cc.mustNotHappen.join('；')}`);
  lines.push(`- 关键NPC：${cc.keyNPCs.join('、')}`);
  lines.push(`- 关键势力：${cc.keyFactions.join('、')}`);
  if (cc.narrativeStyle) {
    lines.push(`- 叙事风格：${cc.narrativeStyle}`);
  }
  lines.push(`- 生成要求：提供${cc.strategicChoiceCount}个战略选项（含risk/risk_note），选项应体现${cc.narrativeStyle ? '上述叙事风格' : '蛊界现实'}，避免爽文套路。战斗/修炼结果必须在state_update中回写：wealth.delta(战利品)、player.health({current,max})(HP变化)、player.essence({current,max})(真元消耗)、materials.add(蛊材获得)。叙事中提到真元消耗或HP变化时必须同步回写数值——不可只描述不更新。蛊材/材料走materials字段，不可错放到gu_inventory(蛊虫)。`);

  return lines.join('\n');
}

// ─── P2-5: NPC对话上下文注入 ───
function injectDialogueContext(store: RootStore): string {
  const ad = (store as any).activeDialogue as { npcName: string; npcPersonality: string; affinity: number; messages: { role: string; text: string }[] } | null;
  if (!ad || ad.messages.length === 0) return '';

  const lastMsg = ad.messages[ad.messages.length - 1];
  if (lastMsg?.role !== 'player') return '';

  const topic = lastMsg.text.replace('【', '').replace('】', '');

  return [
    '【NPC对话上下文】',
    `你正在与${ad.npcName}进行对话。`,
    `${ad.npcName}的性格：${ad.npcPersonality}`,
    `当前好感度：${ad.affinity}（-100~100）`,
    `玩家选择的话题：【${topic}】`,
    '',
    `请以${ad.npcName}的身份用第一人称回应。回应需符合该NPC的性格特征和当前好感度水平。`,
    '回应后必须在state_update.faction中包含affinity_delta字段（正整数=好感上升，负整数=好感下降），范围-5到+5。',
    '你仍然需要生成正常的叙事文本narrative.text和当轮的选择项choices——对话回应放在叙事文本的开头部分，然后继续当轮的正常叙事。',
  ].join('\n');
}
function injectTerminology(): string {
  const core = terminology['核心概念'] as Record<string, string>;
  if (!core) return '';
  const keys = ['真元', '仙元', '空窍', '道痕', '杀招', '本命蛊', '地灵'];
  const lines = ['', '【术语速查】'];
  for (const k of keys) {
    if (core[k]) lines.push(`- ${k}：${core[k]}`);
  }
  return lines.join('\n');
}

// ═══════════════════════════════════════════
// ContextBuilder 类
// ═══════════════════════════════════════════

// ─── P2-流派: 道痕量变质变规则注入 ───
const DAO_MARK_BASE = 100;

/**
 * injectDaoMarkRules — 从combat-config.json pathMatrix读取15流派克制关系
 * 生成道痕量变→质变规则文本（100道痕=1成威力）
 * 并检测玩家当前主修/辅修流派之间的互斥关系
 */
export function injectDaoMarkRules(store: RootStore): string {
  const primaryPath = store.pathBuild?.primary || '';
  const secondaryPaths = store.pathBuild?.secondary || [];
  const daoMarks = store.pathBuild?.dao_marks || {};

  const lines: string[] = ['', '【道痕与流派互斥规则】'];

  // 段1: 道痕量变质变基础规则
  lines.push(`道痕是蛊师修炼的根本。${DAO_MARK_BASE}道痕=1成威力，每增加${DAO_MARK_BASE}道痕威力翻倍。`);
  lines.push('道痕累积不消失，不可逆转。主修流派的道痕数量直接影响该流派杀招威力。');

  // 段2: 玩家当前道痕状态
  if (primaryPath && daoMarks[primaryPath]) {
    const marks = daoMarks[primaryPath];
    const grade = marks >= 1000 ? `${Math.floor(marks / 100)}成（大成）` :
                  marks >= 500 ? `${Math.floor(marks / 100)}成（小成）` :
                  marks >= 100 ? `${Math.floor(marks / 100)}成` : '不足1成';
    lines.push(`- 主修${primaryPath}：${marks}道痕（${grade}），战力倍率×${(1 + marks / 1000).toFixed(1)}`);
  }

  for (const secPath of secondaryPaths) {
    if (daoMarks[secPath]) {
      lines.push(`- 辅修${secPath}：${daoMarks[secPath]}道痕`);
    }
  }

  // 段3: 流派互斥检测（基于combat-config.json pathMatrix）
  try {
    const combatConfig = require('../canon/combat-config.json');
    const pathMatrix: Record<string, Record<string, number>> = combatConfig.pathMatrix?.matrix || {};

    if (primaryPath && pathMatrix[primaryPath]) {
      const conflicts: string[] = [];
      for (const secPath of secondaryPaths) {
        const coefficient = pathMatrix[primaryPath]?.[secPath];
        if (coefficient !== undefined) {
          if (coefficient <= 0.7) {
            conflicts.push(`${secPath}→${primaryPath}被克（系数${coefficient}）：不建议同时修行`);
          } else if (coefficient <= 0.85) {
            conflicts.push(`${secPath}→${primaryPath}轻度冲突（系数${coefficient}）：可以辅修但效率降低`);
          }
        }
      }

      if (conflicts.length > 0) {
        lines.push('');
        lines.push('【流派互斥警告】');
        lines.push(...conflicts.map(c => `- ${c}`));
      } else if (secondaryPaths.length > 0) {
        lines.push('');
        lines.push('【流派兼容】主修与辅修流派间无直接互斥关系，可安全兼修。');
      }
    }
  } catch {
    // combat-config.json 不可用时静默跳过
  }

  // 段4: 道痕互斥通用规则
  lines.push('');
  lines.push('通用规则：相克流派（如炎道↔水道、金道↔木道、土道↔风道）的道痕会在体内相互抵消——同时修行会导致双方道痕均被削弱。单一蛊师最多辅修2个流派，否则道痕冲突风险指数增长。');

  return lines.join('\n');
}

// ─── 经济规则注入 — P2修复：动态读取 economy.json，参照 injectWorldRules() 模式 ───
function injectEconomyRules(store: RootStore): string {
  const eco = economyData;
  const lines: string[] = ['', '【经济与交易规则 — 动态读取canon/economy.json】'];

  // ── 1. 元石基础 ──
  if (eco['元石']) {
    const yuan = eco['元石'] as any;
    lines.push('## 元石 (Primeval Stone)');
    lines.push(`- 本质：${yuan['本质']}`);
    lines.push(`- 真元补充：${yuan['真元补充']}`);
    lines.push(`- 购买力：${yuan['购买力']}`);
    lines.push(`- 备注：${yuan['备注']}`);
  }

  // ── 2. 仙元石经济（之前遗漏） ──
  if (eco['仙元石']) {
    const xian = eco['仙元石'] as any;
    lines.push('', '## 仙元石 (Immortal Essence Stone)');
    lines.push(`- 本质：${xian['本质']}`);
    lines.push(`- 获取：${xian['获取']}`);
    lines.push(`- 备注：${xian['备注']}。1仙元石≈100元石（市场参考价）。仙元(能量)≠仙元石(货币)，二者严格区分`);
  }

  // ── 3. 宝黄天（之前遗漏） ──
  if (eco['宝黄天']) {
    const bht = eco['宝黄天'] as any;
    lines.push('', '## 宝黄天 (Bao Huang Tian)');
    lines.push(`- 本质：${bht['本质']}`);
    lines.push(`- 交易物：${bht['交易物']}`);
    lines.push(`- 货币：${bht['货币']}（凡间元石不可在宝黄天使用）`);
    lines.push(`- 玩家何时可用：${bht['玩家何时可用']}`);
  }

  // ── 4. 蛊虫市场价格参考（含稀有度乘数） ──
  if (eco['蛊虫市场价格参考']) {
    const guPrice = eco['蛊虫市场价格参考'] as any;
    lines.push('', '## 蛊虫市场价格');
    lines.push(`- 境界基数：${guPrice['境界基数']}（一转基准价）`);
    lines.push(`- 稀有度乘数：${JSON.stringify(guPrice['稀有度乘数'])}`);
    // 具体价格示例
    if (guPrice['common一转']) lines.push(`- common一转蛊虫：${guPrice['common一转']['价格']}（例：${guPrice['common一转']['示例']}）`);
    if (guPrice['uncommon一转']) lines.push(`- uncommon一转蛊虫：${guPrice['uncommon一转']['价格']}（例：${guPrice['uncommon一转']['示例']}）`);
    if (guPrice['rare二转']) lines.push(`- rare二转蛊虫：${guPrice['rare二转']['价格']}（例：${guPrice['rare二转']['示例']}）`);
    lines.push(`- 回购价：${guPrice['回购价']}（卖出价=市场价×50%）`);
    if (guPrice['legendary']) lines.push(`- 传奇蛊虫：${guPrice['legendary']['说明']}`);
  }

  // ── 5. 蛊材市场价格分级（之前遗漏） ──
  if (eco['蛊材市场价格参考']) {
    const matPrice = eco['蛊材市场价格参考'] as any;
    lines.push('', '## 蛊材市场价格分级');
    lines.push(`- 普通蛊材：${matPrice['普通蛊材']}`);
    lines.push(`- 精品蛊材：${matPrice['精品蛊材']}`);
    lines.push(`- 稀有蛊材：${matPrice['稀有蛊材']}`);
    lines.push(`- 仙材：${matPrice['仙材']}`);
  }

  // ── 6. 炼蛊成本（已修正为economy.json真实值） ──
  if (eco['炼蛊成本参考']) {
    const refineCost = eco['炼蛊成本参考'] as any;
    lines.push('', '## 炼蛊成本参考');
    for (const tier of ['一转蛊虫', '二转蛊虫', '三转蛊虫', '四转蛊虫', '五转蛊虫']) {
      if (refineCost[tier]) lines.push(`- ${tier}：${refineCost[tier]}`);
    }
  }

  // ── 7. 炼蛊失败率与耗时（之前遗漏的重要维度） ──
  if (eco['炼蛊失败率与耗时']) {
    const refineFail = eco['炼蛊失败率与耗时'] as any;
    lines.push('', '## 炼蛊失败率与耗时');
    if (refineFail['失败率']) {
      lines.push('- 失败率（炼道天赋可修正）：');
      for (const [tier, rate] of Object.entries(refineFail['失败率'] as Record<string, number>)) {
        lines.push(`  ${tier}：${Math.round((rate as number) * 100)}%`);
      }
    }
    if (refineFail['炼制耗时(天)']) {
      lines.push('- 炼制耗时（炼道天赋可加速30%）：');
      for (const [tier, days] of Object.entries(refineFail['炼制耗时(天)'] as Record<string, number>)) {
        lines.push(`  ${tier}：${days}天`);
      }
    }
    if (refineFail['失败后果']) {
      lines.push(`- 失败后果：${refineFail['失败后果']}`);
    }
    if (refineFail['炼制耗时修正']) {
      lines.push(`- 耗时修正：${refineFail['炼制耗时修正']}`);
    }
  }

  // ── 8. 资源节点建造消耗（之前遗漏） ──
  if (eco['RESOURCE_NODE_BUILD_COST']) {
    const rn = eco['RESOURCE_NODE_BUILD_COST'] as any;
    lines.push('', '## 仙窍资源节点建造消耗');
    lines.push(`- 基础建造消耗：${rn.baseCost}元石`);
    lines.push(`- 等级乘数：${JSON.stringify(rn.gradeMultiplier)}`);
    lines.push(`- 建造成功率公式：${rn.baseSuccessRate}% + 资质×${rn.talentSuccessBonus}%`);
    lines.push(`- 升级基础消耗：${rn.upgradeBaseCost}元石，升级成功率${Math.round(rn.upgradeSuccessRate * 100)}%`);
    if (rn.availableNodeTypes && Array.isArray(rn.availableNodeTypes)) {
      const nodeList = rn.availableNodeTypes.slice(0, 6).map((n: any) => `${n.name}(${n.grade},需仙窍Lv${n.minApertureLevel})`).join('、');
      lines.push(`- 可建造节点类型(部分)：${nodeList}`);
    }
  }

  // ── 9. 经济叙事规则 ──
  if (eco['经济叙事规则']) {
    const rules = eco['经济叙事规则'] as any;
    lines.push('', '## 经济叙事规则');
    if (rules['禁止暴富']) lines.push(`- ${rules['禁止暴富']}`);
    if (rules['机缘代价']) lines.push(`- ${rules['机缘代价']}`);
    if (rules['日常合理']) lines.push(`- ${rules['日常合理']}`);
    if (rules['空窍容量限制']) lines.push(`- ${rules['空窍容量限制']}`);
  }

  return lines.join('\n');
}

// ─── 经济锚定注入 — 玩家余额与canonical价格对比 ───
function injectEconomyBalanceAnchor(store: RootStore): string {
  const eco = economyData;
  const s = store as any;
  const currency = s.currency ?? 0;

  // 获取当前章节物价系数
  const currentChapterId = s.currentChapterId || '';
  const chapterMultiplier = (eco.chapterPriceMultiplier as Record<string, number>)?.[currentChapterId] || 1.0;

  // 获取canonical基准价格
  let monthlyIncome = '30-100元石';
  if (eco['元石']?.['购买力']) {
    monthlyIncome = (eco['元石']['购买力'] as string).match(/月收入约[0-9-]+元石/)?.[0] || '30-100元石';
  }

  const commonPrice = eco['蛊虫市场价格参考']?.['common一转']?.['价格'] || '150元石';

  const lines: string[] = [];
  lines.push('', '【玩家经济锚定 — 购买力参考】');
  lines.push(`- 玩家当前余额：${currency}元石`);
  lines.push(`- 当前章节物价系数：${chapterMultiplier.toFixed(1)}x`);
  lines.push(`- 蛊师月收入基准：${monthlyIncome}`);
  lines.push(`- 一转common蛊虫基准价：${commonPrice}`);
  lines.push(`- 日常食宿：1-5元石/日`);
  lines.push(`- 玩家当前购买力：约${Math.floor(currency / 150)}只一转蛊虫；约${Math.floor(currency / 30)}个月日常开销`);

  // 根据余额给出AI叙事指导
  if (currency < 50) {
    lines.push('- 【经济状态】极贫——玩家连一只一转蛊虫都买不起，叙事中不可出现大额消费/馈赠场景');
  } else if (currency < 300) {
    lines.push('- 【经济状态】贫困——只能勉强维持日常，叙事中珍贵物品应有明确价格门槛');
  } else if (currency < 1000) {
    lines.push('- 【经济状态】普通——可负担基本消费，但大宗交易仍有压力');
  } else if (currency < 5000) {
    lines.push('- 【经济状态】小康——有一定积蓄，可参与中档交易');
  } else {
    lines.push('- 【经济状态】富裕——经济宽裕，但不可出现"挥金如土"描写');
  }

  lines.push('- 重要：state_update.wealth.delta的变动应基于以上锚定数据，不可随意定价。收入/支出偏离基准超过3倍即为异常');

  return lines.join('\n');
}

// ═══ v0.7.0 P2: 动态NPC上下文注入 — 将已注册的动态NPC注入AI上下文 ═══
function injectDynamicNPCContext(store: RootStore): string {
  const s = store as any;
  const npcs: Record<string, any> = s.dynamicNPCs || {};
  const entries = Object.values(npcs) as any[];
  if (entries.length === 0) return '';

  // 按剧情参与度排序，取前10个最活跃的
  const topNpcs = entries
    .sort((a: any, b: any) => b.plot_participation - a.plot_participation)
    .slice(0, 10);

  const lines: string[] = ['', '【动态NPC — AI叙事中生成的路人甲角色】'];
  lines.push('以下NPC是通过之前的叙事动态生成的，叙事中如再次出现他们，请保持性格和背景一致：');

  for (const npc of topNpcs) {
    const affinityLabel = npc.affinity >= 60 ? '🟢友善' : npc.affinity >= 20 ? '🟡中立' : npc.affinity >= -20 ? '🟠冷淡' : '🔴敌对';
    const recruitLabel = npc.recruit_eligible ? ' | 可招募' : '';
    lines.push(`- ${npc.name}（${npc.path}道·${npc.realm_label}）性格：${npc.personality}。${npc.description}。好感度：${npc.affinity}(${affinityLabel})。互动${npc.interaction_count}次，共同战斗${npc.battle_count}次${recruitLabel}`);
  }

  lines.push('注意：如果叙事中需要引入新的路人甲NPC，请通过state_update.dynamic_npcs.add字段回写结构化数据。已有NPC的好感度变化通过dynamic_npcs.affinity_delta回写。');
  return lines.join('\n');
}

// ─── NPC 上下文注入（5C.1 三层过滤 + P2-3b 跨域过滤） ───
function injectNPCContext(store: RootStore): string {
  const npcDb = (npcsRaw as any).npcDatabase as Record<string, any>;
  if (!npcDb) return '';

  const flags: Record<string, any> = (store as any).flags || {};
  const currentFaction = flags.current_faction || '南疆';
  const currentChapter = flags.current_chapter || '青茅山期';
  const currentDomain = (store as any).currentDomain || '南疆';
  const factionStandings: Record<string, number> = (store as any).standings || {};

  // === P2-3b: 域过滤层 — 按 currentDomain 优先排序 ===
  const relevantNpcs: Array<{ name: string; info: any; relevance: number; domain: string }> = [];

  for (const [name, npc] of Object.entries(npcDb)) {
    const n = npc as any;
    if (!n || n.role === 'minor') continue; // 跳过龙套

    let relevance = 0;

    // P2-3b: 同域 +5（最高权重）
    const npcDomain = n.domain || n.faction || '南疆';
    if (npcDomain === currentDomain) relevance += 5;

    // 同势力/同地区 +3
    if (n.faction === currentFaction) relevance += 3;
    // 主要角色 +2
    if (n.role === 'protagonist' || n.role === 'antagonist') relevance += 2;
    if (n.role === 'supporting') relevance += 1;
    // 有 relationship 定义 +1
    if (n.relationship && n.relationship !== '无关' && n.relationship !== '无直接关系') relevance += 1;

    if (relevance >= 2) {
      relevantNpcs.push({ name, info: n, relevance, domain: npcDomain });
    }
  }

  // 按相关度排序，取前15个（P2-3b: 从12扩展到15，给跨域NPC留余量）
  relevantNpcs.sort((a, b) => b.relevance - a.relevance);
  const topNpcs = relevantNpcs.slice(0, 15);

  if (topNpcs.length === 0) return '';

  // === 过滤层2: 生成身份摘要 ===
  const lines: string[] = ['', `【当前域：${currentDomain} · 已知NPC身份】`];

  let lastDomain = '';
  for (const { name, info, domain: npcDomain } of topNpcs) {
    // P2-3b: 跨域NPC加标注
    if (npcDomain !== currentDomain && npcDomain !== lastDomain) {
      lines.push(`  [${npcDomain}域]`);
      lastDomain = npcDomain;
    }

    // 检查 flags 中是否有身份覆盖
    const overrideKey = `npc_${name}_title_override`;
    const dynamicTitle = flags[overrideKey];

    // === 过滤层3: 动态身份选择 ===
    let displayTitle: string;
    if (dynamicTitle) {
      displayTitle = dynamicTitle;
    } else if (info.dynamicTitles && info.dynamicTitles[currentChapter]) {
      displayTitle = info.dynamicTitles[currentChapter];
    } else if (info.dynamicTitles && info.dynamicTitles.initial) {
      displayTitle = info.dynamicTitles.initial;
    } else {
      displayTitle = `${info.faction} · ${info.title || info.rank}`;
    }

    const extraInfo: string[] = [];
    if (info.relationship && info.relationship !== '本人') {
      extraInfo.push(`与你关系：${info.relationship}`);
    }
    if (info.personality) {
      extraInfo.push(`性格：${info.personality}`);
    }

    const extraStr = extraInfo.length > 0 ? `（${extraInfo.join('；')}）` : '';
    lines.push(`- ${name}：${displayTitle}。${extraStr}`);
  }

  lines.push('', '请确保叙事中NPC的身份、性格、关系遵循以上设定。不可随意改变NPC的阵营或身份头衔。');
  return lines.join('\n');
}

// ═══ v0.7.0 P1: 十绝体苏醒叙事注入 — 设计大纲§5.3 ═══
function injectExtremePhysiqueAwakening(store: RootStore): string {
  const aperture = (store as any).aperture;
  if (!aperture || aperture.type !== 'mortal' || !aperture.extremePhysiqueType) return '';

  const physiqueType = aperture.extremePhysiqueType as string;
  const awakeningTexts: Record<string, string> = {
    '太日阳莽体': '空间亲和之躯，白昼修行效率翻倍。体内空窍如烈日般炽热，宇道蛊虫在体内共鸣如星辰运转。',
    '古月阴荒体': '时间亲和之躯，夜晚修行增速。空窍中时光流速微有异常，宙道蛊虫感知到宿主的时间波动。',
    '北冥冰魄体': '冰雪双亲和体质，体温极低。空窍被冰蓝色真元充斥，冰道蛊虫在窍内如鱼得水。水汽触肤即凝霜。',
    '森海轮回体': '木道完美亲和，自然愈合速度翻倍。空窍中真元如春藤蔓延，草木系蛊虫感知到生机律动。',
    '炎煌雷泽体': '炎雷双亲和，体内电弧随情绪迸发。空窍中赤金色真元翻涌，炎道/雷道蛊虫感受到雷电共鸣。',
    '万金妙华体': '金道完美亲和，金属蛊虫炼化成功率+30%。空窍壁泛着金属光泽，金道蛊虫感知到金锐之气。',
    '大力真武体': '肉身力量巨大，物理防御极强。空窍厚重坚实，力道蛊虫在窍内感到磅礴力量共鸣。',
    '逍遥智心体': '悟性超群，杀招学习速度+50%。空窍中真元如星点推演流转，智道蛊虫感知到宿主的智慧微光。',
    '厚土元央体': '大地亲和，山地修行+40%。空窍如琥珀般厚重温暖，土道蛊虫感受到大地的召唤。',
    '宇宙大衍体': '万物流变之躯，炼蛊变异率+50%。空窍中真元不定形流转，变化道蛊虫感知到万物的可塑性。',
    '纯梦求真体': '梦境化身，非自然十绝体。空窍中迷雾缭绕，梦道蛊虫感知到虚实交织的梦境气息。',
  };

  const awakeningDesc = awakeningTexts[physiqueType] || '十绝体拥有者，空窍被十成真元压迫，仅可容纳3只蛊虫。';
  const capacityNote = '【十绝体约束】空窍仅可容纳3只蛊虫（高压迫槽位）。每次放入/取出蛊虫扣除5%当前生命。需在叙事中体现取舍之难——携带哪只蛊虫上战场是生死抉择。HP不足5%时阻止蛊虫操作。';

  return `【十绝体·${physiqueType}】${awakeningDesc}\n${capacityNote}`;
}

// ═══ v0.7.0 P2: 势力外交铺垫注入 — 设计大纲§5.9 ═══
function injectFactionDiplomacy(store: RootStore): string {
  const faction = (store as any).playerFaction;
  if (!faction) return '';

  const domainCultureHints: Record<string, string> = {
    '南疆': '山寨文化，以血缘和地域为纽带。你的势力在南疆立足，周围山寨对你的崛起已有警觉。',
    '北原': '游牧部族，黄金家族影响深远。你的势力闯入北原权力棋局，各部族在暗中评估你的实力。',
    '东海': '海岛散修联盟，以贸易为生命线。你的势力需在东海错综复杂的商路中找到立足点。',
    '西漠': '沙漠绿洲文明，水资源即权力。你的势力需谨慎处理与沙漠诸邦的关系。',
    '中洲': '十大古派宗门体系，秩序森严。你的势力在中洲正道眼中需要证明自己的合法性。',
  };

  const cultureHint = domainCultureHints[faction.domain] || '';
  const levelNote = faction.level >= 5
    ? '【外交升级】势力已具一定规模，域间势力开始正视你的存在。AI叙事可引入域间冲突事件（间谍渗透/商路争夺/跨域联盟邀请）。'
    : '';

  return `【玩家势力·${faction.name}】等级${faction.level}，${faction.type}，${faction.members?.length || 0}名成员，声望${faction.reputation}。${cultureHint}\n${levelNote}`;
}

// ═══ v0.7.0 P3: 小队士气上下文注入 — 设计大纲§1.4.2 ═══
function injectSquadMoraleContext(store: RootStore): string {
  const party = (store as any).partyState;
  if (!party || !party.members || party.members.length === 0) return '';

  const memberLines = party.members.map((m: any) => {
    const trustLabel = m.adventureTrust >= 70 ? '高度信任' : m.adventureTrust >= 40 ? '基本信任' : '低信任';
    const interestLabel = m.interestDrive >= 60 ? '高利益驱动' : m.interestDrive >= 30 ? '中等利益' : '低利益';
    return `- ${m.name}（${m.path}${m.realm}转）信任:${m.adventureTrust}/100 利益:${m.interestDrive}/100 [${trustLabel},${interestLabel}]`;
  }).join('\n');

  const formation = party.formation || '无';
  return `【当前小队】编队${party.members.length}/${party.maxSize}人，战术姿态:${formation}\n${memberLines}\n注意：叙事中应体现队友的信任-利益状态。低信任成员可能在关键时刻犹豫或自保，高利益驱动的mercenary型成员可能在报酬不足时消极作战。`;
}

// ═══ v0.7.0 P4: 成就进度感知注入 ═══
function injectAchievementProgressContext(store: RootStore): string {
  const achievements = (store as any)._achievementDefs;
  const unlocked = (store as any).unlockedAchievements || [];
  const progress = (store as any).achievementProgress || {};

  if (!achievements || achievements.length === 0) return '';

  // 找到即将完成的成就（进度>=80%）
  const nearComplete: string[] = [];
  for (const def of achievements) {
    if (unlocked.includes(def.id)) continue;
    if (def.progressMax && progress[def.id] !== undefined) {
      const pct = progress[def.id] / def.progressMax;
      if (pct >= 0.80) {
        nearComplete.push(`- ${def.name}（进度${Math.round(pct * 100)}%）`);
      }
    }
  }

  if (nearComplete.length === 0) return '';

  return `【成就进度感知】以下成就即将完成，可在叙事中适当铺垫相关情节：\n${nearComplete.join('\n')}\n注意：不要直接宣布成就解锁（由系统自动检测），可在叙事中暗示玩家接近里程碑。`;
}

// ═══ v0.7.0 P5: 资源点建设提示注入 ═══
function injectResourceNodeHints(store: RootStore): string {
  const aperture = (store as any).aperture;
  if (!aperture || aperture.type === 'mortal') return '';

  const nodes = aperture.resource_nodes || [];
  const activeNodes = nodes.filter((n: any) => n.active);
  const buildableSlots = Math.max(0, 6 - nodes.length);

  if (activeNodes.length === 0 && buildableSlots === 0) return '';

  const nodeSummary = activeNodes.map((n: any) => `- ${n.name}（${n.grade}，产出${n.output_rate}/轮，品质${n.quality}）`).join('\n');

  return `【仙窍资源节点】当前${activeNodes.length}个活跃节点，可建造${buildableSlots}个新节点。\n${nodeSummary || '（暂无活跃节点，可在ApertureManagement面板中建造）'}\n提示：可在叙事中提及仙窍资源产出状态，引导玩家关注资源建设。`;
}

// ═══════════════════════════════════════════
export class ContextBuilder {
  private layer1Content: string;
  private layer2Content: string;

  constructor() {
    this.layer1Content = SYSTEM_PROMPT_LAYER1;
    this.layer2Content = SYSTEM_PROMPT_LAYER2;
  }

  // ─── 构建 System Prompt ───
  buildSystemPrompt(
    mode: 'canon' | 'if',
    store?: RootStore
  ): string {
    const parts: string[] = [
      this.layer1Content,
      STYLE_GUIDE_INJECT,
      this.layer2Content,
    ];

    // Canon / IF 模式分化（P2: CANON_MODE_INJECT改为动态函数调用）
    if (mode === 'canon') {
      const domain = store?.currentDomain || '南疆';
      parts.push(buildCanonModeInject(domain));
    } else {
      parts.push(IF_MODE_INJECT);
    }

    // 世界规则注入
    parts.push(injectWorldRules());

    // ═══ P2-流派: 道痕量变质变规则注入 ═══
    if (store) {
      parts.push(injectDaoMarkRules(store));
    }

    // 经济规则注入 — P2修复：动态读取economy.json + 余额锚定
    parts.push(injectEconomyRules(store!));

    // ═══ P1章节约束注入：域约束/位置锁/场景约束（在NPC上下文之前） ═══
    if (store) {
      parts.push(injectChapterConstraints(store));
    }

    // ═══ P2-2a 涟漪事件注入（L0/L1/L2分层） ═══
    if (store) {
      parts.push(injectRippleEvents(store));
    }

    // ═══ P2-2a L3全局flag注入（持久世界状态） ═══
    if (store) {
      parts.push(injectGlobalFlags(store));
    }

    // ═══ P2-4b 战斗约束注入（叙事战斗场景） ═══
    if (store) {
      parts.push(injectCombatConstraint(store));
    }

    // ═══ P2-5 NPC对话上下文注入 ═══
    if (store) {
      parts.push(injectDialogueContext(store));
    }

    // NPC上下文注入（5C.1 三层过滤）
    if (store) {
      parts.push(injectNPCContext(store));
    }

    // ═══ v0.7.0 P2: 动态NPC上下文注入 ═══
    if (store) {
      parts.push(injectDynamicNPCContext(store));
    }

    // ═══ v0.7.0: 5个新注入管道 ═══
    // P1: 十绝体苏醒叙事
    if (store) {
      parts.push(injectExtremePhysiqueAwakening(store));
    }
    // P2: 势力外交铺垫
    if (store) {
      parts.push(injectFactionDiplomacy(store));
    }
    // P3: 小队士气上下文
    if (store) {
      parts.push(injectSquadMoraleContext(store));
    }
    // P4: 成就进度感知
    if (store) {
      parts.push(injectAchievementProgressContext(store));
    }
    // P5: 资源点建设提示
    if (store) {
      parts.push(injectResourceNodeHints(store));
    }

    // 术语速查
    parts.push(injectTerminology());

    // 蛊虫知识注入【P1-6.3动静分离：从system prompt移除，迁移到buildMessages动态段】
    // 原 injectGuKnowledge(store.inventory) 调用已移除

    return parts.join('\n');
  }

  // ─── 序列化玩家状态 ───
  buildPlayerStateJSON(store: RootStore): string {
    const s = store;
    const playerInfo: Record<string, any> = {
      name: s.profile.name,
      realm: s.profile.realm.label,
      attributes: s.attributes,
      vitals: { health: s.vitals.health, essence: s.vitals.essence },
      path: { primary: s.pathBuild.primary || '无', secondary: s.pathBuild.secondary },
      daoHeart: s.daoHeart,
      daoHeartGuide: (() => {
        const dh = s.daoHeart;
        const parts: string[] = [];
        if (dh.kill >= 5) parts.push('杀性深重——你视人命如草芥，选项应多含杀戮、毁灭、复仇之途');
        else if (dh.kill >= 3) parts.push('杀性渐长——你不避杀戮，必要时会以血开路');
        if (dh.mercy >= 5) parts.push('仁心深厚——你常存善念，选项应多含救赎、保护、牺牲之途');
        else if (dh.mercy >= 3) parts.push('仁心初显——你偶有恻隐，不吝施以援手');
        if (dh.scheme >= 5) parts.push('谋略深沉——你工于心计，选项应多含布局、算计、借刀杀人之途');
        else if (dh.scheme >= 3) parts.push('谋略渐成——你善用计策，常思迂回之道');
        if (dh.ambition >= 5) parts.push('野心勃勃——你志在权势，选项应多含夺权、扩张、称霸之途');
        else if (dh.ambition >= 3) parts.push('野心萌动——你不甘平庸，追求更高地位');
        if (parts.length === 0) parts.push('道心未定——你的心性仍在塑造中，选项应中性多元');
        return parts.join('；');
      })(),
      guInventory: s.inventory.map((g: any) => ({
        name: g.name, tier: g.tier, path: g.path, state: g.currentState,
      })),
      // ═══ v1.7: LLM感知玩家杀招 ═══
      killMoves: (s as any).killMoves?.map((km: any) => ({
        name: km.name, path: km.path, level: km.level,
        multiplier: km.multiplier, cooldown: (s as any).cooldowns?.[km.id] || 0,
        description: km.description,
      })) || [],
      flags: s.flags,
      factions: (s as any).standings ? Object.entries(s as any).filter(([k]) => k !== 'updateStanding' && k !== 'updateRelation') : [],
    };
    // ─── 5B: 高资质势力关注 ───
    if (s.attributes.资质 >= 9) {
      playerInfo.talentNotice = s.attributes.资质 === 10
        ? '该蛊师拥有十绝体，资质千古罕见。各方势力已暗中关注——正道欲拉拢培养、魔道欲夺舍炼化、散修欲结交依附。每次社交选择都可能引来势力接触，好坏参半。'
        : '该蛊师资质甲等，天赋异禀。已引起附近势力注意——可能获得修行资源资助，也可能招来嫉妒和算计。行事需低调谨慎。';
    }
    return JSON.stringify(playerInfo, null, 2);
  }

  // ─── 构建叙事上下文 ───
  buildNarrativeContext(store: RootStore): {
    keyEvents: KeyEvent[]; recentMessages: Message[]; rollingSummary: string;
  } {
    return {
      keyEvents: store.keyEvents.slice(-10),
      recentMessages: store.messages.slice(-10),
      rollingSummary: store.rollingSummary || '（尚无历史摘要）',
    };
  }

  // ─── 构建完整 AIContext ───
  buildFullContext(
    store: RootStore,
    mode: 'canon' | 'if'
  ): AIContext {
    const systemPrompt = this.buildSystemPrompt(mode, store);
    const playerStateJSON = this.buildPlayerStateJSON(store);
    const { keyEvents, recentMessages, rollingSummary } = this.buildNarrativeContext(store);
    return { systemPrompt, playerStateJSON, keyEvents, recentMessages, rollingSummary, mode, turnNumber: store.messages.length };
  }

  // ─── P1-6.3 构建动态上下文（注入到user message，不污染system prompt缓存） ───
  buildDynamicContext(store: RootStore): string {
    const parts: string[] = [];

    // 段1: 经济锚定 — 玩家余额 + 购买力参考 + 章节物价系数
    parts.push(injectEconomyBalanceAnchor(store));

    // ═══ P3修复: 章节位置提醒（防止AI在超长上下文中丢失当前位置导致叙事跳回） ═══
    const currentChapterId = (store as any).currentChapterId || '';
    const currentDomain = (store as any).currentDomain || '南疆';
    if (currentChapterId) {
      const chaptersData = chaptersRaw as any;
      const domainChapters = chaptersData.domains?.[currentDomain] || [];
      const chapterDef = domainChapters.find((c: any) => c.id === currentChapterId);
      if (chapterDef) {
        parts.push(`【当前章节位置 — 不可脱离】你正处于「${chapterDef.displayName}」章节，位于${currentDomain}域${chapterDef.position?.area || chapterDef.position?.region || ''}。叙事必须严格围绕当前章节展开，不可跳回前面的章节事件，也不可跳到后面的章节。`);
      }
    }

    // ═══ P4: 天赋效果提醒（每轮注入，+150 tokens） ═══
    const selectedTalents = (store as any).selectedTalents;
    if (selectedTalents && selectedTalents.length > 0) {
      try {
        const { P4_TALENTS } = require('../data/talents-p4');
        const { INITIAL_TALENTS } = require('../data/talents');
        const talentLines: string[] = [];
        for (const tid of selectedTalents) {
          const t = P4_TALENTS.find((tt: any) => tt.id === tid) || INITIAL_TALENTS.find((tt: any) => tt.id === tid);
          if (t) {
            const benefits = t.benefits?.join('；') || '';
            const costs = t.costs?.join('；') || '';
            const note = costs ? `${benefits}。代价：${costs}` : benefits;
            talentLines.push(`- ${t.name}：${note}`);
          }
        }
        if (talentLines.length > 0) {
          parts.push(`【天赋效果生效提醒 — 叙事必须遵守】\n${talentLines.join('\n')}\n警告：不可在叙事中描写违反以上天赋效果的情节（如\"百毒不侵\"则不可出现中毒描写）。`);
        }
      } catch { /* ignore */ }
    }

    // 段2: 势力声望（P4: 含势力定义注入，确保AI知晓可操作的faction）
    const standingsData: Record<string, any> = (store as any).standings || {};
    // 过滤掉函数属性，获取纯数值的势力声望
    const currentStandings = Object.entries(standingsData)
      .filter(([key, val]) => key !== 'updateStanding' && key !== 'updateRelation' && key !== 'characterRelations' && key !== 'npcRelations' && key !== 'initNpcRelations' && key !== 'updateNpcRelation' && key !== 'getNpcAffinity' && key !== 'tickNpcRelations' && typeof val === 'object' && val !== null && 'standing' in val)
      .map(([factionId, data]: [string, any]) => ({ id: factionId, standing: data.standing || 0 }));

    // P4: 从world-rules.json获取当前域势力定义
    const domainFactions = (worldRulesRaw as any)?.['五域势力']?.[currentDomain]?.keyFactions || [];

    if (domainFactions.length > 0) {
      const factionLines = domainFactions.map((f: any) => {
        const cur = currentStandings.find((s: any) => s.id === f.id);
        const standing = cur?.standing ?? f.standing;
        const label = standing >= 30 ? '友善' : standing >= 10 ? '好感' : standing >= -10 ? '中立' : standing >= -30 ? '反感' : '敌对';
        return `  ${f.id}(${f.name}): ${standing > 0 ? '+' : ''}${standing}(${label}) — ${f.note}`;
      });
      parts.push(`【势力声望 — ${currentDomain}域】\n${factionLines.join('\n')}\n\n提示: 在state_update.faction中可调整势力声望，如: {\"${domainFactions[0].id}\": {\"standing\": 5}}`);
    }

    // 段3: 蛊虫当前状态摘要
    const inventory = store.inventory;
    if (inventory && inventory.length > 0) {
      const guLines: string[] = [];
      for (const gu of inventory.slice(0, 6)) {
        const data = guDatabase[gu.name];
        if (data) {
          guLines.push(`  ${gu.name}(${gu.tier}转${gu.path}): 状态=${gu.currentState || 'normal'}; 喂=${data.feed || '未知'}; 败=${data.usageFailure || data.feedFailure || '未知'}`);
        } else {
          guLines.push(`  ${gu.name}(${gu.tier}转${gu.path}): 状态=${gu.currentState || 'normal'}`);
        }
      }
      if (guLines.length > 0) {
        parts.push(`【当前蛊虫状态】\n${guLines.join('\n')}`);
        // v0.6.0: 蛊虫能力引导 — 指导AI生成使用蛊虫的选项
        const guAbilityLines: string[] = [];
        for (const gu of inventory.slice(0, 4)) {
          const data = guDatabase[gu.name];
          if (data) {
            const ability = data.effect || data.description || '';
            if (ability) guAbilityLines.push(`- ${gu.name}(${gu.tier}转${gu.path}): ${ability.substring(0, 40)}`);
          }
        }
        if (guAbilityLines.length > 0) {
          parts.push(`【蛊虫能力 — 选项生成规则】\n每个选项应至少有一条关联到以下蛊虫能力。在社交/战斗/探索场景中优先生成使用蛊虫的选项:\n${guAbilityLines.join('\n')}`);
        }
      }
    }

    // ═══ P2-9: 随机遭遇上下文注入 ═══
    try {
      const encCtx = (store as any).getEncounterContext?.();
      if (encCtx) {
        const encLines = [
          `【随机遭遇: ${encCtx.title}】`,
          `类型: ${encCtx.type}`,
          encCtx.narrativeTemplate,
          '',
          '玩家可选行动:',
          ...encCtx.choices.map((c: any) => `  - ${c.text} (风险:${c.risk}) → ${c.outcome}`),
        ];
        parts.push(encLines.join('\n'));
      }
    } catch { /* encounter context injection not available */ }

    // ═══ P2修复: 道心指导指令 — 让AI根据道心值调整叙事倾向和选项风格 ═══
    const daoHeart = (store as any).daoHeart || { kill: 0, mercy: 0, scheme: 0, ambition: 0 };
    const dhLines: string[] = [];
    if (daoHeart.kill >= 3) dhLines.push(`杀性(${daoHeart.kill})：玩家的选项应至少包含一条暴力/毁灭/直接冲突的路径`);
    if (daoHeart.mercy >= 3) dhLines.push(`仁心(${daoHeart.mercy})：玩家的选项应至少包含一条救助/保护/牺牲的路径`);
    if (daoHeart.scheme >= 3) dhLines.push(`谋略(${daoHeart.scheme})：玩家的选项应至少包含一条布局/算计/借力打力的路径`);
    if (daoHeart.ambition >= 3) dhLines.push(`野心(${daoHeart.ambition})：玩家的选项应至少包含一条夺权/扩张/建立势力的路径`);
    if (dhLines.length > 0) {
      parts.push(`【道心指导指令 — 选项生成必须遵守】\n${dhLines.join('\n')}\n\n玩家道心倾向已固化，选项若完全违背道心则违背角色一致性。但不必所有选项都顺从道心——留1条中性选项给玩家改变的空间。`);
    } else {
      parts.push('【道心指导指令】玩家道心尚未成型（四维均低于3），选项可多元化，每个选项引导不同的道心走向。此阶段是塑造角色道心的最佳时期。');
    }

    return parts.length > 0 ? parts.join('\n\n') : '';
  }

  // ─── 构建 API 消息列表 ───
  buildMessages(context: AIContext, choiceId?: string, dynamicContext?: string): { system: string; user: string } {
    const userContextParts = [
      '【玩家当前状态】', context.playerStateJSON, '',
      '【近期关键事件】',
      context.keyEvents.length > 0
        ? context.keyEvents.map(e => `- [第${e.turn}回合] ${e.summary}`).join('\n')
        : '（游戏开始，暂无历史事件）',
      '',
      '【历史摘要】', context.rollingSummary || '（无历史摘要）',
    ];

    // P1-6.3 动态上下文注入：元石余额 + NPC关系 + 蛊虫状态
    if (dynamicContext) {
      userContextParts.push('', dynamicContext);
    }

    userContextParts.push('', choiceId ? `【玩家选择】${choiceId}` : '【玩家选择】开始游戏');
    if (context.recentMessages.length > 0) {
      userContextParts.push('', '【最近对话历史】');
      context.recentMessages.forEach(msg => {
        userContextParts.push(`${msg.role === 'assistant' ? '叙述者' : '玩家'}: ${msg.content.substring(0, 200)}`);
      });
    }
    return { system: context.systemPrompt, user: userContextParts.join('\n') };
  }
}

export const contextBuilder = new ContextBuilder();
