import type { AIContext, KeyEvent, Message } from '../types';
import type { RootStore } from '../store';

// ─── 知识库静态导入 ───
import guDatabaseRaw from '../canon/gu-database.json';
import worldRulesRaw from '../canon/world-rules.json';
import terminologyRaw from '../canon/terminology.json';

const guDatabase = guDatabaseRaw as Record<string, any>;
const worldRules = worldRulesRaw as Record<string, any>;
const terminology = terminologyRaw as Record<string, any>;

// ─── System Prompt Layer 1: 世界观核心 ───
const SYSTEM_PROMPT_LAYER1 = `你是一个「蛊真人世界·人生重来模拟器」的 AI 游戏主持人。你负责生成所有叙事文本、提供玩家选项、管理游戏状态。

核心世界观：蛊界是一个残酷的修真世界。弱肉强食是唯一法则，没有正邪，只有强弱。
境界体系不可逾越。NPC不会降智，不会无条件信任，不会免费送资源。
机缘必有代价。选择必有后果。

你必须严格按照JSON格式输出，不要输出任何JSON以外的文字。`;

// ─── System Prompt Layer 2: 输出格式 + 叙事铁则 ───
const SYSTEM_PROMPT_LAYER2 = `
输出格式要求：
{
  "narrative": {
    "text": "叙事文本（200-500字，中文，冷静克制的第二人称）",
    "choices": [
      {
        "id": "choice_1",
        "text": "选项描述（简洁有力）",
        "risk": "high|medium|low",
        "risk_note": "风险提示（必填）"
      }
    ]
  },
  "state_update": {
    "player": {
      "realm": { "action": "set", "value": "二转初阶" },
      "attributes": {
        "资质": { "action": "add", "value": 0 },
        "体魄": { "action": "add", "value": 1 },
        "心智": { "action": "add", "value": 0 },
        "气运": { "action": "add", "value": -1 }
      },
      "health": { "current": 95, "max": 100 },
      "essence": { "current": 80, "max": 120 }
    },
    "gu_inventory": { "add": [], "remove": [] },
    "flags": { "set": {}, "remove": [] },
    "faction": {},
    "causality": {}
  }
}

叙事铁则：
- 每轮2-4个选项，每个都有明确风险
- 高境界绝对压制低境界
- 方源（古月方源）极致利己、算无遗策，不会友善不会信任
- 机缘必有对等代价
- 选项必须包含一个保守选项和一个冒险选项
- risk_note必填
- 属性中资质使用甲等/乙等/丙等/丁等评价，体魄/心智/气运不使用甲等-丁等
- 气运默认不可见，蛊师没有运道蛊虫时无法知道自己和他人气运

生成JSON前请完成自检：NPC无无条件信任、叙事不偏正面、核心NPC威慑力充分、机缘有代价、境界差距正确、选项全部含风险提示。`;

// ─── Layer S: 风格指南（注入版） ───
const STYLE_GUIDE_INJECT = `
【叙事风格指南】
- 人称：第二人称（"你"），让玩家代入角色
- 语气：冷静克制，不煽情不热血。黑暗现实基调——蛊界残酷
- 禁用爽文套路：热血沸腾、充满希望、美好未来、前途无量、轻松愉快、皆大欢喜
- 禁用NPC降智：无条件信任、无偿赠送、欣赏主角、全力栽培
- 每个机缘必有对等代价，每个选项都有明确风险
- 描写侧重氛围和后果，不过度描写战斗动作细节
- 人名规范：古月方源不可称"方源哥哥"等亲昵称呼
- 地名使用原著正名：南疆、北原、东海、西漠、中州`;

// ─── 开局专用 System Prompt ───
const SYSTEM_PROMPT_OPENING = `
你现在负责生成蛊真人模拟器的开局叙事。玩家刚刚完成了角色创建，即将进入蛊界。

开局背景：
- 地点：南疆，古月山寨附近
- 时代：蛊真人原著故事线之初
- 玩家身份：刚开窍的蛊师学徒（一转初阶），身世普通

第一轮叙事要求：
1. 简介玩家的背景和开窍过程（约200字）
2. 描述当前的情景——玩家刚成为蛊师学徒，需要做出第一个重要选择
3. 提供2-3个开局选项：
   - 一个选择炼蛊之路（加入山寨炼蛊房学习）
   - 一个选择修行之路（独自修行提高境界）
   - 一个冒险选择（探索山寨外围寻找机缘）

角色信息将在用户消息中提供。请生成开局叙事JSON。`;

// ─── Canon / IF 模式分化 ───
const CANON_MODE_INJECT = `
【当前模式：正史线】
你正处于蛊真人原著主线中。请遵循以下约束：
- 方源（古月方源）此时应在南疆古月山寨附近活动
- 原著关键事件（如方源使用春秋蝉重生、与太白云生相遇）按时间线发生
- 核心NPC（方源、太白云生等）性格和行为遵循原著
- 玩家作为独立蛊师，可与原著角色互动但不可改变原著主线关键节点
- 如果玩家接触到原著关键剧情点，应以"旁观者"或"次要参与者"身份描写`;

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

// ─── 术语速查注入 ───
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

// ─── 经济规则注入（4D.9） ───
function injectEconomyRules(store: RootStore): string {
  const currency = (store as any).currency ?? 0;
  return `
## 经济与交易规则

蛊界的通用货币是「元石」。元石分布在底层岩石中，可为蛊师补充真元（一转初阶获约100真元，境界越高补充量越少）。
当前玩家元石余额：${currency}块。
空窍容量：一转3只/二转5只/三转8只/四转12只/五转15只。

物价参考（境界分段基数：一转150/二转200/三转800/四转5000/五转20000元石）：
- 一转蛊虫 150-225元石；日常食宿 1-5元石/日；蛊师月收入约100-500元石
- 蛊材：普通5-20元石、精品30-80元石、稀有100-300元石
- 传奇蛊虫不在市场上流通，只能通过机缘/传承获得

炼蛊成本参考：一转需20-40元石+普通蛊材、二转50-100元石+普通蛊材、三转200-400元石+精品蛊材

叙事规则：
- 不可描述玩家"轻松获得大量元石"的情节
- 任何意外收入须有对等代价或风险
- NPC不会无条件赠予元石或蛊虫
- 凡人与蛊师经济完全脱钩——蛊师不会为几块元石做有辱身份的事`;
}

// ═══════════════════════════════════════════
export class ContextBuilder {
  private layer1Content: string;
  private layer2Content: string;

  constructor() {
    this.layer1Content = SYSTEM_PROMPT_LAYER1;
    this.layer2Content = SYSTEM_PROMPT_LAYER2;
  }

  // ─── 构建 System Prompt（4B.3重构版） ───
  buildSystemPrompt(
    mode: 'canon' | 'if',
    isOpening: boolean = false,
    store?: RootStore
  ): string {
    if (isOpening) {
      return SYSTEM_PROMPT_OPENING;
    }

    const parts: string[] = [
      this.layer1Content,
      STYLE_GUIDE_INJECT,
      this.layer2Content,
    ];

    // Canon / IF 模式分化
    if (mode === 'canon') {
      parts.push(CANON_MODE_INJECT);
    } else {
      parts.push(IF_MODE_INJECT);
    }

    // 世界规则注入
    parts.push(injectWorldRules());

    // 经济规则注入（4D.9）
    if (store) {
      parts.push(injectEconomyRules(store));
    }

    // 术语速查
    parts.push(injectTerminology());

    // 蛊虫知识注入（按玩家上下文）
    if (store?.inventory && store.inventory.length > 0) {
      parts.push(injectGuKnowledge(store.inventory));
    }

    return parts.join('\n');
  }

  // ─── 序列化玩家状态 ───
  buildPlayerStateJSON(store: RootStore): string {
    const s = store;
    const playerInfo = {
      name: s.profile.name,
      realm: s.profile.realm.label,
      attributes: s.attributes,
      vitals: { health: s.vitals.health, essence: s.vitals.essence },
      path: { primary: s.pathBuild.primary || '无', secondary: s.pathBuild.secondary },
      daoHeart: s.daoHeart,
      guInventory: s.inventory.map((g: any) => ({
        name: g.name, tier: g.tier, path: g.path, state: g.currentState,
      })),
      flags: s.flags,
      factions: (s as any).standings ? Object.entries(s as any).filter(([k]) => k !== 'updateStanding' && k !== 'updateRelation') : [],
    };
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
    mode: 'canon' | 'if',
    isOpening: boolean = false
  ): AIContext {
    const systemPrompt = this.buildSystemPrompt(mode, isOpening, store);
    const playerStateJSON = this.buildPlayerStateJSON(store);
    const { keyEvents, recentMessages, rollingSummary } = this.buildNarrativeContext(store);
    return { systemPrompt, playerStateJSON, keyEvents, recentMessages, rollingSummary, mode, turnNumber: store.messages.length };
  }

  // ─── 构建 API 消息列表 ───
  buildMessages(context: AIContext, choiceId?: string): { system: string; user: string } {
    const userContextParts = [
      '【玩家当前状态】', context.playerStateJSON, '',
      '【近期关键事件】',
      context.keyEvents.length > 0
        ? context.keyEvents.map(e => `- [第${e.turn}回合] ${e.summary}`).join('\n')
        : '（游戏开始，暂无历史事件）',
      '',
      '【历史摘要】', context.rollingSummary || '（无历史摘要）',
    ];
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
