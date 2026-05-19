import worldIntentRulesRaw from '../canon/v011-world-intent-rules.json';
import qingmaoRegionBoardRaw from '../canon/qingmao-region-board.json';
import {
  buildQingmaoFactPromptContext,
  buildQingmaoFactReferenceSet,
  type QingmaoFactReferenceSet,
} from './v011-qingmao-fact-cards';
import type {
  IntentCandidate,
  IntentRuling,
  LivingPlayerGoalEntry,
  LivingWorldState,
  TimelineMode,
  WorldActionDomain,
} from '../types';

type IntentType = IntentCandidate['intentType'];
type IntentSource = IntentCandidate['source'];
type RulingCategory = IntentRuling['category'];

interface WorldIntentRules {
  deepSeekContract: {
    allowedOutputs: string[];
    forbiddenOutputs: string[];
  };
}

interface QingmaoIdentityScope {
  startProfileId: string;
  factionId: string;
  role: string;
  identityBoundary: string;
}

interface QingmaoRegionBoard {
  identityScope: QingmaoIdentityScope[];
}

export interface WorldIntentContext {
  actorId?: string;
  turn?: number;
  regionId?: string | null;
  selectedStartProfileId?: string | null;
  playerFactionId?: string | null;
  playerRealmGrand?: number | null;
  timelineMode?: TimelineMode;
  livingWorldState?: Partial<LivingWorldState> | null;
  visibleFactIds?: string[];
}

export interface WorldIntentInput extends WorldIntentContext {
  rawText: string;
  source?: IntentSource;
  candidateId?: string;
}

export interface WorldIntentRouteSuggestion {
  canRouteToActionProtocol: boolean;
  domain: WorldActionDomain | 'living_world_goal' | null;
  actionHint: string;
  mustConfirmBeforePersistingGoal: boolean;
  forbiddenStateWrites: string[];
}

export interface WorldIntentDeepSeekContract {
  allowedOutputs: string[];
  forbiddenOutputs: string[];
  localRulingAuthority: true;
  visibleFactIds: string[];
}

export interface WorldIntentAdjudication {
  candidate: IntentCandidate;
  ruling: IntentRuling;
  route: WorldIntentRouteSuggestion;
  factCardRefs: QingmaoFactReferenceSet;
  deepSeekContract: WorldIntentDeepSeekContract;
  suggestedPlayerGoal: LivingPlayerGoalEntry | null;
  statePatchApplied: false;
}

const worldIntentRules = worldIntentRulesRaw as WorldIntentRules;
const qingmaoRegionBoard = qingmaoRegionBoardRaw as QingmaoRegionBoard;

const DEFAULT_FORBIDDEN_STATE_WRITES = [
  'inventory',
  'materialBag',
  'currency',
  'immortalCurrency',
  'locationUnlocks',
  'npcDeath',
  'canonAnchorStatus',
  'ending',
];

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function stableHash(text: string): string {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function normalizeRawText(value: string): string {
  return value.trim().replace(/\s+/g, '');
}

function includesAny(text: string, patterns: string[]): boolean {
  return patterns.some(pattern => text.includes(pattern));
}

function currentTurn(context: WorldIntentContext): number {
  return Math.max(0, Math.floor(Number(context.turn || context.livingWorldState?.worldClock?.turn || 0)));
}

function currentRealmGrand(context: WorldIntentContext): number {
  const value = Number(context.playerRealmGrand || 1);
  return Number.isFinite(value) ? Math.max(1, Math.min(9, Math.floor(value))) : 1;
}

function resolveCurrentFactionId(context: WorldIntentContext): string | null {
  if (context.playerFactionId) return context.playerFactionId;
  const scope = qingmaoRegionBoard.identityScope.find(item => item.startProfileId === context.selectedStartProfileId);
  return scope?.factionId || null;
}

function classifyIntent(rawText: string): Pick<IntentCandidate, 'intentType' | 'targetRef' | 'evidenceRefIds'> {
  const text = normalizeRawText(rawText);

  if (includesAny(text, ['九转蛊', '九转仙蛊', 'rankninegu', 'rank9gu'])) {
    return {
      intentType: 'obtain_item',
      targetRef: 'item:rank_nine_gu',
      evidenceRefIds: ['boundary:rank_nine_gu_not_runtime_reward'],
    };
  }

  if (includesAny(text, ['春秋蝉', '春秋蟬', 'springautumncicada'])) {
    return {
      intentType: 'obtain_item',
      targetRef: 'item:spring_autumn_cicada',
      evidenceRefIds: ['boundary:spring_autumn_cicada_special_fact'],
    };
  }

  if (includesAny(text, ['盗天魔尊', '盜天魔尊', '盗天传承', '盜天傳承', '盗天遗藏', '盜天遺藏', 'theftheaven'])) {
    return {
      intentType: 'obtain_item',
      targetRef: 'inheritance:theft_heaven_demon_venerable',
      evidenceRefIds: ['boundary:theft_heaven_inheritance_not_low_rank_reward'],
    };
  }

  if (includesAny(text, ['宝黄天交易', '寶黃天交易', '去宝黄天', '去寶黃天', 'treasureyellowheaven'])) {
    return {
      intentType: 'travel',
      targetRef: 'location:treasure_yellow_heaven',
      evidenceRefIds: ['boundary:mortal_treasure_yellow_heaven_trade_blocked'],
    };
  }

  if (includesAny(text, ['商家城', '商家城核心', '商家城内城', '商家城外缘', '商家城外圍', '商家城外围'])) {
    return {
      intentType: 'travel',
      targetRef: 'location:shang_clan_city_outer_edge',
      evidenceRefIds: ['route_gate:shang_clan_city_requires_route_supply_and_guarantee'],
    };
  }

  if (includesAny(text, ['白家']) && includesAny(text, ['投靠', '加入', '拜入', '归附', '歸附'])) {
    return {
      intentType: 'join_faction',
      targetRef: 'faction:baijia_zhai',
      evidenceRefIds: ['qingmao_identity_scope:baijia_zhai'],
    };
  }

  if (includesAny(text, ['方源']) && includesAny(text, ['跟踪', '跟蹤', '监视', '監視', '观察', '觀察', '打听', '打聽', '盯着', '盯著', '盯'])) {
    return {
      intentType: 'investigate',
      targetRef: 'npc:fang_yuan',
      evidenceRefIds: ['hidden_fact_policy:fang_yuan_private_causality'],
    };
  }

  if (includesAny(text, ['逃离青茅山', '逃離青茅山', '离开青茅山', '離開青茅山', '出青茅山'])) {
    return {
      intentType: 'travel',
      targetRef: 'region:outside_qingmao',
      evidenceRefIds: ['route_gate:qingmao_exit_requires_route_and_supply'],
    };
  }

  if (
    includesAny(text, ['关键NPC', '關鍵NPC', '关键npc', '關鍵npc', '关键人物', '關鍵人物', '重要NPC', '重要npc', '正史人物'])
    && includesAny(text, ['杀', '殺', '杀死', '殺死', '刺杀', '刺殺', '除掉', '弄死', '抓捕', '改写', '改寫'])
  ) {
    return {
      intentType: 'long_term_goal',
      targetRef: 'npc:key_character:death_or_capture',
      evidenceRefIds: ['canon_anchor:major_npc_life_result_gate'],
    };
  }

  if (includesAny(text, ['白凝冰']) && includesAny(text, ['杀', '殺', '杀死', '殺死', '刺杀', '刺殺', '除掉', '弄死'])) {
    return {
      intentType: 'long_term_goal',
      targetRef: 'npc:bai_ning_bing:defeat_or_kill',
      evidenceRefIds: ['canon_anchor:bai_ning_bing_major_if'],
    };
  }

  if (includesAny(text, ['拿', '获取', '獲取', '获得', '得到', '夺取', '奪取', '搞到', '弄到', '买到', '買到', '买', '買'])) {
    return {
      intentType: 'obtain_item',
      targetRef: `item:unregistered:${stableHash(text)}`,
      evidenceRefIds: ['gate:unregistered_item_needs_local_registration'],
    };
  }

  if (includesAny(text, ['投靠', '加入', '拜入', '归附', '歸附', '靠山', '换阵营', '換陣營'])) {
    return {
      intentType: 'join_faction',
      targetRef: `faction:unknown:${stableHash(text)}`,
      evidenceRefIds: ['gate:faction_contact_requires_local_identity_check'],
    };
  }

  if (includesAny(text, ['调查', '調查', '打听', '打聽', '观察', '觀察', '追查', '跟踪', '跟蹤', '寻找', '尋找', '找'])) {
    return {
      intentType: 'investigate',
      targetRef: `investigation:unknown:${stableHash(text)}`,
      evidenceRefIds: ['gate:investigation_requires_visible_scope'],
    };
  }

  if (includesAny(text, ['去', '前往', '离开', '離開', '逃离', '逃離'])) {
    return {
      intentType: 'travel',
      targetRef: `travel:unknown:${stableHash(text)}`,
      evidenceRefIds: ['gate:travel_requires_route'],
    };
  }

  return {
    intentType: 'long_term_goal',
    targetRef: `goal:unclassified:${stableHash(text)}`,
    evidenceRefIds: ['gate:long_term_goal_requires_review'],
  };
}

export function createIntentCandidate(input: WorldIntentInput): IntentCandidate {
  const classified = classifyIntent(input.rawText);
  const actorId = input.actorId || 'player';
  const id = input.candidateId || `intent_${classified.intentType}_${stableHash(`${actorId}:${input.rawText}`)}`;
  return {
    id,
    rawText: input.rawText,
    intentType: classified.intentType,
    actorId,
    targetRef: classified.targetRef,
    regionId: input.regionId ?? null,
    source: input.source || 'player_input',
    evidenceRefIds: classified.evidenceRefIds,
  };
}

function makeRuling(
  candidate: IntentCandidate,
  category: RulingCategory,
  input: {
    allowed: boolean;
    reasons: string[];
    visibleExplanation: string;
    prerequisiteRefs?: string[];
    costRefs?: string[];
    riskLevel?: 0 | 1 | 2 | 3;
  },
): IntentRuling {
  return {
    candidateId: candidate.id,
    category,
    allowed: input.allowed,
    reasons: input.reasons,
    prerequisiteRefs: input.prerequisiteRefs || [],
    costRefs: input.costRefs || [],
    riskLevel: input.riskLevel ?? 1,
    visibleExplanation: input.visibleExplanation,
  };
}

function adjudicateCandidate(candidate: IntentCandidate, context: WorldIntentContext): IntentRuling {
  const factionId = resolveCurrentFactionId(context);
  const realmGrand = currentRealmGrand(context);
  const timelineMode = context.timelineMode || 'canon';

  if (candidate.targetRef === 'item:rank_nine_gu') {
    return makeRuling(candidate, 'long_term_goal', {
      allowed: false,
      reasons: [
        '九转蛊不属于当前一转/低阶阶段可获得目标。',
        '该目标只能作为远期野心、传闻追索或骗局风险处理。',
        '本地引擎不会写入背包、奖励、蛊方或传承。',
      ],
      prerequisiteRefs: ['realm:late_immortal', 'canon_gate:rank_nine_gu'],
      riskLevel: 3,
      visibleExplanation: '九转蛊可以被记录为遥远野心，但现在不能直接获得。当前可做的是打听高阶传闻、积累修行资源，或识破以九转蛊为名的骗局。',
    });
  }

  if (candidate.targetRef === 'item:spring_autumn_cicada') {
    return makeRuling(candidate, 'world_rule_blocked', {
      allowed: false,
      reasons: [
        '春秋蝉属于高阶特殊事实，不能成为普通奖励或自由输入直接目标。',
        '当前裁决不得泄露或改写相关隐藏因果。',
      ],
      prerequisiteRefs: ['canon_gate:spring_autumn_cicada', 'hidden_fact_policy:time_path_private_causality'],
      riskLevel: 3,
      visibleExplanation: '春秋蝉不是当前阶段可直接获得的蛊。你可以追索时间类传闻或长期研究时间道，但不能把它写入背包或任务奖励。',
    });
  }

  if (candidate.targetRef === 'inheritance:theft_heaven_demon_venerable') {
    return makeRuling(candidate, 'world_rule_blocked', {
      allowed: false,
      reasons: [
        '盗天魔尊传承不能由一转阶段自由输入直接获得。',
        '当前角色不是经本地系统确认的天外之魔相关身份，不能把该传承写成即时奖励。',
        '该目标只能降级为远期传闻、骗局风险、路线线索或未来专项。',
      ],
      prerequisiteRefs: [
        'realm:far_future_high_rank_gate',
        'canon_gate:theft_heaven_inheritance',
        'identity_gate:otherworldly_demon_not_confirmed',
      ],
      costRefs: ['risk:fraud_or_trap', 'risk:high_rank_attention'],
      riskLevel: 3,
      visibleExplanation: '盗天魔尊传承不是当前一转、低阶阶段能直接获得的东西。系统可以把它记成遥远传闻或危险线索，但不会发传承、写背包，也不会默认你具备天外之魔相关前提。',
    });
  }

  if (candidate.targetRef === 'location:treasure_yellow_heaven') {
    if (realmGrand >= 6) {
      return makeRuling(candidate, 'available_with_cost', {
        allowed: true,
        reasons: [
          '蛊仙阶段可进入宝黄天相关系统，但仍需由后续交易/区域引擎结算。',
          '意图裁决只允许路由，不产生交易结果。',
        ],
        prerequisiteRefs: ['system:treasure_yellow_heaven_trade_engine'],
        costRefs: ['immortal_essence', 'immortal_essence_stone'],
        riskLevel: 2,
        visibleExplanation: '你具备触及宝黄天的境界前提，但交易仍需要后续本地交易系统验证。',
      });
    }
    return makeRuling(candidate, 'world_rule_blocked', {
      allowed: false,
      reasons: [
        '宝黄天是蛊仙层级交易空间，凡人阶段不能正式交易。',
        'DeepSeek 只能把它写成传闻，不得生成正式交易、价格或奖励。',
      ],
      prerequisiteRefs: ['realm:gu_immortal', 'system:treasure_yellow_heaven_trade_engine'],
      riskLevel: 3,
      visibleExplanation: '凡人阶段不能去宝黄天正式交易。当前只能听闻相关传说，或把它作为蛊仙期以后才可能接触的目标。',
    });
  }

  if (candidate.targetRef === 'location:shang_clan_city_outer_edge') {
    return makeRuling(candidate, 'requires_prerequisite', {
      allowed: false,
      reasons: [
        '商家城不是当前阶段可直接传送或完整开放的地点。',
        '只能先处理青茅离山、南疆路线、补给、身份和担保等外缘前置。',
        '本地引擎不会写入正式地点、入城资格、商会任务或交易结果。',
      ],
      prerequisiteRefs: [
        'route:southern_border_low_rank_route',
        'resource:travel_supply',
        'contact:caravan_or_guarantee',
        'gate:shang_outer_edge_only',
      ],
      costRefs: ['risk:pursuit', 'risk:identity_exposure', 'time:travel_preparation'],
      riskLevel: 2,
      visibleExplanation: '去商家城可以作为后续路线目标，但 v1.0 只处理外缘路线和前置条件：补给、身份、担保、追索风险。不能直接开放商家城核心区、商会任务或正式交易。',
    });
  }

  if (candidate.targetRef === 'faction:baijia_zhai') {
    if (factionId === 'baijia_zhai') {
      return makeRuling(candidate, 'available', {
        allowed: true,
        reasons: [
          '当前身份已经属于白家寨，可转为本家任务或族内接触。',
          '裁决不直接增加声望或职位。',
        ],
        prerequisiteRefs: [],
        riskLevel: 1,
        visibleExplanation: '你本就有白家身份，可以从族学、本家巡查或溪瀑资源线开始行动。',
      });
    }
    if (factionId === 'sanxiu' || factionId === 'shangjia' || factionId === 'tiejia' || factionId === 'wujia') {
      return makeRuling(candidate, 'available_with_cost', {
        allowed: true,
        reasons: [
          '外来身份可以尝试接触白家，但不是立即加入。',
          '需要通过本地行动协议处理接触、风险、代价和后果。',
        ],
        prerequisiteRefs: ['contact:baijia_outer_gate'],
        costRefs: ['risk:suspicion', 'time:local_action'],
        riskLevel: 2,
        visibleExplanation: '你可以尝试接触白家，但这只是求庇护或递话入口，不会立刻获得白家身份。',
      });
    }
    return makeRuling(candidate, 'requires_prerequisite', {
      allowed: false,
      reasons: [
        '当前身份与白家存在阵营风险，不能一键改换门庭。',
        '需要可见接触渠道、投名状、脱身代价和本地势力压力结算。',
      ],
      prerequisiteRefs: ['contact:baijia_outer_gate', 'cost:defection_risk', 'living_world:faction_pressure'],
      costRefs: ['risk:hostility', 'risk:identity_exposure'],
      riskLevel: 3,
      visibleExplanation: '投靠白家不是按钮式换阵营。你需要先找到接触渠道，并承担被原势力怀疑或追查的风险。',
    });
  }

  if (candidate.targetRef === 'npc:fang_yuan') {
    return makeRuling(candidate, 'available_with_cost', {
      allowed: true,
      reasons: [
        '可做可见范围内的观察、打听或跟踪尝试。',
        '不得泄露或推断玩家不可见的隐藏因果。',
        '失败可能引起对方警觉或被反利用。',
      ],
      prerequisiteRefs: ['visibility:fang_yuan_public_activity'],
      costRefs: ['risk:counter_surveillance', 'time:local_action'],
      riskLevel: 3,
      visibleExplanation: '你可以尝试从可见行踪入手观察方源，但系统不会告诉你玩家角色不知道的隐藏因果；失败会有被察觉的风险。',
    });
  }

  if (candidate.targetRef === 'region:outside_qingmao') {
    return makeRuling(candidate, 'requires_prerequisite', {
      allowed: false,
      reasons: [
        '离开青茅山需要路线、补给、身份遮掩和追踪风险评估。',
        '当前裁决不会直接传送到新地域。',
      ],
      prerequisiteRefs: ['route:qingmao_exit', 'resource:travel_supply', 'risk:pursuit'],
      costRefs: ['time:travel_preparation', 'risk:wilderness'],
      riskLevel: 2,
      visibleExplanation: '逃离青茅山可以成为明确目标，但现在需要先调查路线、准备补给，并处理身份与追踪风险。',
    });
  }

  if (candidate.targetRef === 'npc:bai_ning_bing:defeat_or_kill') {
    return makeRuling(candidate, 'major_if_deviation', {
      allowed: false,
      reasons: [
        '杀死白凝冰属于重大 IF 偏离，不在 a3 第一刀直接开放。',
        timelineMode === 'canon'
          ? '正史模式下该目标必须先被锚点保护。'
          : 'IF 模式也需要实力、情报、时机、代价和后续账本。',
        '本地引擎不会根据自由输入直接判定 NPC 死亡。',
      ],
      prerequisiteRefs: ['canon_anchor:bai_ning_bing', 'if_gate:major_deviation_review'],
      costRefs: ['risk:lethal_conflict', 'risk:canon_anchor_heat'],
      riskLevel: 3,
      visibleExplanation: '这会触及重大 IF 偏离。当前只能记录为危险目标或调查线，不能直接判定成功，更不能由 DeepSeek 宣告白凝冰死亡。',
    });
  }

  if (candidate.targetRef === 'npc:key_character:death_or_capture') {
    return makeRuling(candidate, 'major_if_deviation', {
      allowed: false,
      reasons: [
        '关键 NPC 生死、抓捕和正史核心因果属于重大 IF 或正史锚点变化。',
        '自由输入不能直接决定正式生死结果、抓捕结果或正史锚点变化。',
        '后续必须由具体身份、实力、情报、场景、时机和用户批准的 IF 规则处理。',
      ],
      prerequisiteRefs: ['if_gate:major_deviation_review', 'canon_anchor:key_npc_life_gate'],
      costRefs: ['risk:lethal_conflict', 'risk:faction_retaliation', 'risk:canon_anchor_heat'],
      riskLevel: 3,
      visibleExplanation: '杀死或抓捕关键 NPC 是重大 IF，不是自由输入能直接成功的行动。当前只能作为危险目标或未来专项记录，不能写 NPC 生死、正史锚点或结局。',
    });
  }

  if (candidate.intentType === 'obtain_item') {
    return makeRuling(candidate, 'requires_prerequisite', {
      allowed: false,
      reasons: [
        '未登记物品不能由自由输入直接进入背包或奖励。',
        '需要本地 canon/资源/炼蛊系统确认目标、来源和代价。',
      ],
      prerequisiteRefs: ['canon:item_registration', 'engine:reward_or_refine_gate'],
      riskLevel: 2,
      visibleExplanation: '这个目标需要先确认它是不是已登记资源、蛊虫或蛊方线索；系统不会直接发放。',
    });
  }

  if (candidate.intentType === 'join_faction') {
    return makeRuling(candidate, 'requires_prerequisite', {
      allowed: false,
      reasons: [
        '未知势力接触需要身份、地域和门路审查。',
        '不能直接改写玩家势力归属。',
      ],
      prerequisiteRefs: ['canon:faction_registration', 'living_world:faction_contact'],
      riskLevel: 2,
      visibleExplanation: '加入势力需要先找到可见接触渠道，并经过本地身份与风险审查。',
    });
  }

  if (candidate.intentType === 'investigate') {
    return makeRuling(candidate, 'available_with_cost', {
      allowed: true,
      reasons: [
        '调查类意图可以路由为本地行动候选。',
        '调查结果必须由本地行动协议和可见事实决定。',
      ],
      prerequisiteRefs: ['visibility:local_scope'],
      costRefs: ['time:local_action'],
      riskLevel: 1,
      visibleExplanation: '你可以开始调查，但结果只会来自可见事实和本地行动结算。',
    });
  }

  if (candidate.intentType === 'travel') {
    return makeRuling(candidate, 'requires_prerequisite', {
      allowed: false,
      reasons: [
        '未知路线不能直接开放地点。',
        '需要本地地图、路线或线索系统确认。',
      ],
      prerequisiteRefs: ['route:local_map_or_clue'],
      costRefs: ['time:travel_preparation'],
      riskLevel: 1,
      visibleExplanation: '前往未知地点需要先拿到路线或线索，不能直接传送。',
    });
  }

  return makeRuling(candidate, 'long_term_goal', {
    allowed: false,
    reasons: [
      '该目标尚不能转成当前版本的具体行动。',
      '可以作为长期目标等待后续拆解。',
    ],
    prerequisiteRefs: ['gate:goal_breakdown_required'],
    riskLevel: 1,
    visibleExplanation: '这个目标可以先记为长期方向，后续再拆成可执行的小行动。',
  });
}

function routeFor(candidate: IntentCandidate, ruling: IntentRuling): WorldIntentRouteSuggestion {
  let domain: WorldActionDomain | 'living_world_goal' | null = null;
  let actionHint = '当前只输出本地裁决，不直接创建行动候选。';

  if (ruling.allowed) {
    if (candidate.intentType === 'investigate' || candidate.intentType === 'travel') {
      domain = 'field_action';
      actionHint = '可在后续 store/UI 切口中转为 field_action 候选。';
    } else if (candidate.intentType === 'join_faction') {
      domain = 'other';
      actionHint = '可在后续势力/区域切口中转为接触候选。';
    }
  } else if (
    ruling.category === 'long_term_goal'
    || ruling.category === 'requires_prerequisite'
    || ruling.category === 'major_if_deviation'
  ) {
    domain = 'living_world_goal';
    actionHint = '可在玩家确认后写入 livingWorldState.playerGoals；本次裁决不自动持久化。';
  }

  return {
    canRouteToActionProtocol: ruling.allowed,
    domain,
    actionHint,
    mustConfirmBeforePersistingGoal: true,
    forbiddenStateWrites: DEFAULT_FORBIDDEN_STATE_WRITES,
  };
}

function goalStatusFor(category: RulingCategory): LivingPlayerGoalEntry['status'] {
  if (category === 'world_rule_blocked' || category === 'hidden_fact_blocked' || category === 'major_if_deviation') {
    return 'blocked';
  }
  if (category === 'available' || category === 'available_with_cost') {
    return 'active';
  }
  return 'deferred';
}

function buildGoalDraft(
  candidate: IntentCandidate,
  ruling: IntentRuling,
  context: WorldIntentContext,
): LivingPlayerGoalEntry | null {
  if (ruling.allowed && candidate.intentType !== 'long_term_goal') return null;
  const turn = currentTurn(context);
  return {
    id: `goal_${candidate.id}`,
    intentType: candidate.intentType,
    targetRef: candidate.targetRef,
    status: goalStatusFor(ruling.category),
    createdTurn: turn,
    lastUpdatedTurn: turn,
    rationale: ruling.visibleExplanation,
    nextStepHints: ruling.allowed
      ? ['选择具体行动入口', '等待本地行动协议结算']
      : ruling.prerequisiteRefs,
    blockedByRefIds: ruling.allowed ? [] : ruling.prerequisiteRefs,
  };
}

export function adjudicateIntentCandidate(
  candidate: IntentCandidate,
  context: WorldIntentContext = {},
): WorldIntentAdjudication {
  const factCardRefs = buildQingmaoFactReferenceSet(candidate);
  const promptContext = buildQingmaoFactPromptContext(factCardRefs);
  const ruling = adjudicateCandidate(candidate, context);
  return {
    candidate,
    ruling,
    route: routeFor(candidate, ruling),
    factCardRefs,
    deepSeekContract: {
      allowedOutputs: worldIntentRules.deepSeekContract.allowedOutputs,
      forbiddenOutputs: worldIntentRules.deepSeekContract.forbiddenOutputs,
      localRulingAuthority: true,
      visibleFactIds: uniqueStrings([
        ...(context.visibleFactIds || []),
        ...promptContext.visibleFacts.map(fact => fact.id),
      ]),
    },
    suggestedPlayerGoal: buildGoalDraft(candidate, ruling, context),
    statePatchApplied: false,
  };
}

export function adjudicateWorldIntent(input: WorldIntentInput): WorldIntentAdjudication {
  const candidate = createIntentCandidate(input);
  return adjudicateIntentCandidate(candidate, input);
}

export function buildWorldIntentContextFromStore(store: any): WorldIntentContext {
  return {
    actorId: 'player',
    turn: Number(store?.turn || store?.livingWorldState?.worldClock?.turn || 0),
    regionId: store?.sceneSessionState?.locationId || store?.currentLocationId || null,
    selectedStartProfileId: store?.selectedStartProfileId || store?.timelineState?.startProfileId || null,
    playerFactionId: store?.timelineState?.factionId || store?.currentFaction || null,
    playerRealmGrand: Number(store?.profile?.realm?.grand || 1),
    timelineMode: store?.gameMode === 'if' ? 'if' : 'canon',
    livingWorldState: store?.livingWorldState || null,
    visibleFactIds: Object.keys(store?.livingWorldState?.knownFacts || {}),
  };
}
