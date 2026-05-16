import {
  buildHiddenFactRefFromQingmaoCard,
  buildPlayerKnownFactFromQingmaoCard,
} from './v011-qingmao-fact-cards';
import type { WorldIntentAdjudication } from './v011-world-intent-engine';
import type {
  HiddenFactRefState,
  LivingActionConsequenceEntry,
  LivingFactionPressureEntry,
  LivingNpcMemoryEntry,
  LivingWorldState,
  PlayerKnownFact,
} from '../types';

export interface QingmaoVisibleInvestigationInput {
  adjudication: WorldIntentAdjudication;
  livingWorldState?: Partial<LivingWorldState> | null;
  turn?: number;
}

export interface QingmaoVisibleInvestigationResolution {
  success: boolean;
  blocked: boolean;
  message: string;
  publicSummary: string;
  actionId: string;
  knownFacts: PlayerKnownFact[];
  hiddenFactRefs: HiddenFactRefState[];
  factionPressure: LivingFactionPressureEntry[];
  npcMemories: LivingNpcMemoryEntry[];
  actionConsequences: LivingActionConsequenceEntry[];
  deepSeekVisibleFactIds: string[];
  hiddenFactCardIds: string[];
  rejectedReasons: string[];
  warnings: string[];
  statePatchApplied: false;
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function currentTurn(input: QingmaoVisibleInvestigationInput): number {
  return Math.max(0, Math.floor(Number(
    input.turn ?? input.livingWorldState?.worldClock?.turn ?? 0,
  )));
}

function buildActionId(adjudication: WorldIntentAdjudication): string {
  return `qingmao_visible_investigation_${adjudication.candidate.id}`;
}

function visibleFactIdsFromState(state?: Partial<LivingWorldState> | null): string[] {
  return Object.keys(state?.knownFacts || {});
}

export function resolveQingmaoVisibleInvestigation(
  input: QingmaoVisibleInvestigationInput,
): QingmaoVisibleInvestigationResolution {
  const { adjudication } = input;
  const turn = currentTurn(input);
  const actionId = buildActionId(adjudication);
  const visibleFactCardIds = uniqueStrings(adjudication.factCardRefs.visibleFactCardIds || []);
  const hiddenFactCardIds = uniqueStrings(adjudication.factCardRefs.hiddenFactCardIds || []);
  const hiddenFactRefs = hiddenFactCardIds
    .map(id => buildHiddenFactRefFromQingmaoCard(id, turn))
    .filter((ref): ref is HiddenFactRefState => Boolean(ref));
  const base: Omit<QingmaoVisibleInvestigationResolution, 'success' | 'blocked' | 'message' | 'publicSummary' | 'knownFacts' | 'factionPressure' | 'npcMemories' | 'actionConsequences' | 'rejectedReasons' | 'warnings'> = {
    actionId,
    hiddenFactRefs,
    deepSeekVisibleFactIds: uniqueStrings([
      ...adjudication.deepSeekContract.visibleFactIds,
      ...visibleFactIdsFromState(input.livingWorldState),
      ...visibleFactCardIds,
    ]),
    hiddenFactCardIds,
    statePatchApplied: false,
  };

  if (adjudication.candidate.intentType !== 'investigate') {
    return {
      ...base,
      success: false,
      blocked: true,
      message: '当前裁决不是调查行动。',
      publicSummary: '当前自由意图不能转成青茅可见范围调查。',
      knownFacts: [],
      actionConsequences: [],
      factionPressure: [],
      npcMemories: [],
      rejectedReasons: ['intent_not_investigate'],
      warnings: [],
    };
  }

  if (!adjudication.ruling.allowed) {
    return {
      ...base,
      success: false,
      blocked: true,
      message: '当前调查被裁决闸门阻断。',
      publicSummary: adjudication.ruling.visibleExplanation,
      knownFacts: [],
      actionConsequences: [],
      factionPressure: [],
      npcMemories: [],
      rejectedReasons: [`ruling_blocked:${adjudication.ruling.category}`],
      warnings: hiddenFactRefs.length > 0 ? ['hidden_fact_refs_recorded_only'] : [],
    };
  }

  const knownFacts = visibleFactCardIds
    .map(id => buildPlayerKnownFactFromQingmaoCard(id, turn))
    .filter((fact): fact is PlayerKnownFact => Boolean(fact));

  if (knownFacts.length === 0) {
    const isFangYuanProbe = adjudication.candidate.targetRef === 'npc:fang_yuan';
    const protectedConsequence: LivingActionConsequenceEntry[] = isFangYuanProbe
      ? [{
        id: `consequence_${actionId}_protected_failure`,
        actionId,
        turn,
        scope: 'npc',
        publicSummary: '调查未获得可见事实，只留下谨慎的打听痕迹。',
        effectRefs: hiddenFactRefs.map(ref => ref.id),
        followUpRefs: ['gate:visible_scope_required', 'risk:npc_counter_observation'],
      }]
      : [];
    const npcMemories: LivingNpcMemoryEntry[] = isFangYuanProbe
      ? [{
        id: `npc_memory_${actionId}_caution`,
        npcId: 'fang_yuan',
        turn,
        regionId: adjudication.candidate.regionId,
        actionId,
        publicSummary: '有人试图打听方源动向，但没有获得当前可见范围内的可靠事实。',
        privateRefId: hiddenFactRefs[0]?.id || null,
        attitudeDelta: 0,
        weight: 2,
        tags: ['hidden_fact_protected', 'visible_scope_failed'],
        expiresTurn: null,
      }]
      : [];

    return {
      ...base,
      success: false,
      blocked: true,
      message: hiddenFactRefs.length > 0
        ? '这次调查触及受保护线索，只记录系统保护引用，不生成玩家可见事实。'
        : '这次调查暂未命中可见事实卡。',
      publicSummary: hiddenFactRefs.length > 0
        ? '调查触及受保护线索：当前只记录风险，不向玩家展示隐藏事实。'
        : '调查没有发现当前版本可见范围内的新事实。',
      knownFacts: [],
      factionPressure: [],
      npcMemories,
      actionConsequences: protectedConsequence,
      rejectedReasons: hiddenFactRefs.length > 0 ? ['hidden_fact_ref_only'] : ['no_visible_fact_card'],
      warnings: [
        ...(hiddenFactRefs.length > 0 ? ['hidden_fact_refs_recorded_only'] : []),
        ...(isFangYuanProbe ? ['npc_memory_public_failure_only'] : []),
      ],
    };
  }

  const factionPressure = visibleFactCardIds.includes('baijia_bai_ning_bing_public_talent')
    ? [{
      id: `faction_pressure_${actionId}_baijia_opportunity`,
      factionId: 'baijia_zhai',
      pressureType: 'opportunity' as const,
      delta: 5,
      reason: '对白家寨的可见范围调查形成接触机会；这不是势力归属变化。',
      turn,
      visibility: 'player_visible' as const,
    }]
    : [];
  const effectRefs = knownFacts.map(fact => fact.id);
  const actionConsequence: LivingActionConsequenceEntry = {
    id: `consequence_${actionId}`,
    actionId,
    turn,
    scope: 'region',
    publicSummary: `调查获得 ${knownFacts.length} 条青茅山可见事实。`,
    effectRefs: [
      ...effectRefs,
      ...factionPressure.map(entry => entry.id),
    ],
    followUpRefs: [
      adjudication.candidate.targetRef,
      ...adjudication.ruling.prerequisiteRefs,
      ...adjudication.ruling.costRefs,
    ],
  };

  return {
    ...base,
    success: true,
    blocked: false,
    message: '已完成可见范围调查，新增事实写入活世界账本。',
    publicSummary: actionConsequence.publicSummary,
    knownFacts,
    factionPressure,
    npcMemories: [],
    actionConsequences: [actionConsequence],
    rejectedReasons: [],
    warnings: hiddenFactRefs.length > 0 ? ['hidden_fact_refs_recorded_only'] : [],
  };
}
