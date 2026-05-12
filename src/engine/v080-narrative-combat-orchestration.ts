import type {
  BattleOutcomeResult,
  BattleOutcomeSummary,
  BattlefieldCombatState,
  CombatEncounterEntryValidation,
  CombatEncounterScale,
  CombatEncounterSpec,
  CombatEncounterState,
  CombatEventCandidate,
  LocalActionLedgerEntry,
} from '../types';
import {
  getKillerMoveExpressionSpec,
  isGuNormalCombatUsable,
} from './gu-expression-registry';
import {
  normalizeCombatRouteScale,
  resolveCombatRoutePolicy,
} from './combat-route-policy';
import { getBeastEnemySpec } from './v090-beast-enemy-registry';

const DEFAULT_ENEMY_HINT: Record<CombatEncounterScale, string> = {
  duel: '剧情对手',
  battlefield_5x3: '遭遇敌手',
  group_5x3: '小队敌群',
  group_7x5: '山谷伏兵',
};

export function createIdleCombatEncounterState(): CombatEncounterState {
  return {
    status: 'idle',
    spec: null,
    validation: null,
    startedTurn: 0,
    outcomeSummary: null,
  };
}

export function normalizeCombatEncounterScale(input: unknown): CombatEncounterScale {
  return normalizeCombatRouteScale(input);
}

function collectOwnedGu(store: any): string[] {
  const names = new Set<string>();
  const add = (gu: any) => {
    const name = String(gu?.name || gu?.guName || '').trim();
    if (name && isGuNormalCombatUsable(name)) names.add(name);
  };
  for (const gu of Array.isArray(store?.inventory) ? store.inventory : []) add(gu);
  for (const gu of Array.isArray(store?.apertureInventory?.gu) ? store.apertureInventory.gu : []) add(gu);
  return [...names].sort();
}

function collectLearnedKillerMoves(store: any, ownedGu: string[]): string[] {
  const owned = new Set(ownedGu);
  const names = new Set<string>();
  for (const move of Array.isArray(store?.killMoves) ? store.killMoves : []) {
    const name = String(move?.name || move?.moveName || '').trim();
    const spec = name ? getKillerMoveExpressionSpec(name) : undefined;
    if (!spec) continue;
    if ([...spec.coreGu, ...spec.auxiliaryGu].every(guName => owned.has(guName))) names.add(spec.moveName);
  }
  return [...names].sort();
}

function resolveCandidateId(candidate: Partial<CombatEventCandidate>, turn: number): string {
  if (candidate.id) return String(candidate.id);
  const title = String(candidate.title || 'combat').replace(/\s+/g, '_').slice(0, 24);
  return `combat_${turn}_${title}`;
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

export function normalizeCombatEncounterSpec(candidate: Partial<CombatEventCandidate>, store: any): CombatEncounterSpec {
  const turn = Number(candidate.createdTurn || store?.turn || 1);
  const route = resolveCombatRoutePolicy({
    scale: (candidate as any).scale,
    encounterScale: (candidate as any).encounterScale,
    type: candidate.type,
    title: candidate.title,
    summary: candidate.summary,
    tags: (candidate as any).tags,
    enemyCount: (candidate as any).enemyCount,
    allyCount: (candidate as any).allyCount,
    neutralCount: (candidate as any).neutralCount,
    objectiveTags: (candidate as any).objectiveTags,
  });
  const scale = route.scale;
  const ownedGu = collectOwnedGu(store);
  const learnedMoves = collectLearnedKillerMoves(store, ownedGu);
  const enemyHint = String((candidate as any).enemyHint || (candidate as any).enemy || DEFAULT_ENEMY_HINT[scale]);
  const requiredRealmGrand = Number((candidate as any).requiredRealmGrand || (candidate as any).recommendedRealm || 0) || undefined;
  const blockers: string[] = [];
  const warnings: string[] = [...route.warnings];
  const enemySpecIds = Array.isArray((candidate as any).enemySpecIds)
    ? uniqueStrings((candidate as any).enemySpecIds.map(String))
    : [];
  const validEnemySpecIds = enemySpecIds.filter(id => getBeastEnemySpec(id));
  const unknownEnemySpecIds = enemySpecIds.filter(id => !getBeastEnemySpec(id));

  if (!candidate.title || !candidate.summary) blockers.push('缺少标题或摘要，不能进入正式战斗。');
  if (requiredRealmGrand && Number(store?.profile?.realm?.grand || 1) < requiredRealmGrand) {
    blockers.push(`当前境界不足：需要${requiredRealmGrand}转以上。`);
  }
  if (unknownEnemySpecIds.length > 0) {
    blockers.push(`unknown beast enemy specs: ${unknownEnemySpecIds.join(', ')}`);
  }
  if (scale !== 'duel' && ownedGu.length === 0) {
    warnings.push('玩家没有可登记凡战蛊虫，本地战斗会降为保命/观察向压力。');
  }

  return {
    id: resolveCandidateId(candidate, turn),
    title: String(candidate.title || '未命名战斗候选'),
    summary: String(candidate.summary || 'AI 未提供摘要，候选只能作为危险传闻。'),
    scale,
    risk: candidate.risk || 'medium',
    source: candidate.source || 'ai-rumor',
    sceneId: String((candidate as any).sceneId || store?.sceneSessionState?.sceneId || store?.currentChapterId || 'current_scene'),
    createdTurn: turn,
    enemyHint,
    requiredRealmGrand,
    availableGu: ownedGu,
    availableKillerMoves: learnedMoves,
    blockers,
    warnings,
    encounterKind: (candidate as any).encounterKind,
    enemySpecIds: validEnemySpecIds,
    groundId: (candidate as any).groundId,
    dropPolicyId: (candidate as any).dropPolicyId,
    gridPresetId: (candidate as any).gridPresetId,
  };
}

export function evaluateCombatEncounterEntry(candidate: Partial<CombatEventCandidate>, store: any): CombatEncounterEntryValidation {
  const spec = normalizeCombatEncounterSpec(candidate, store);
  const blockers = [...spec.blockers];
  const warnings = [...spec.warnings];
  const valid = blockers.length === 0;
  return {
    valid,
    spec,
    blockers,
    warnings,
    downgradedTo: valid ? undefined : (candidate.risk === 'high' ? 'danger_hint' : 'rumor'),
  };
}

function resultFromBattlefield(state: BattlefieldCombatState | null | undefined, fallback: BattleOutcomeResult): BattleOutcomeResult {
  const winner = state?.result?.winner;
  if (winner === 'player') return 'victory';
  if (winner === 'enemy') return 'defeat';
  if (winner === 'escaped') return 'retreat';
  return fallback;
}

export function buildBattleOutcomeSummary(input: {
  encounter: CombatEncounterSpec;
  battlefieldState?: BattlefieldCombatState | null;
  playbackSteps?: Array<{ kind?: string; message?: string; sourceName?: string; tags?: string[] }>;
  result?: BattleOutcomeResult;
  turn?: number;
}): BattleOutcomeSummary {
  const state = input.battlefieldState;
  const player = state?.units?.find(unit => unit.side === 'player');
  const startHp = Number(player?.maxHp || 0);
  const endHp = Number(player?.hp || startHp);
  const essenceMax = Number(player?.essence?.max || 0);
  const essenceCurrent = Number(player?.essence?.current || essenceMax);
  const result = input.result || resultFromBattlefield(state, 'unresolved');
  const steps = (input.playbackSteps || [])
    .slice(-10)
    .map(step => String(step.message || step.sourceName || step.kind || '战斗轨迹'));
  const summary = `${input.encounter.title}：${resultLabel(result)}。${state?.result?.reason || input.encounter.summary}`;

  return {
    id: `battle_outcome_${input.encounter.id}_${input.turn || input.encounter.createdTurn}`,
    encounterId: input.encounter.id,
    scale: input.encounter.scale,
    result,
    summary,
    winner: state?.result?.winner ?? null,
    roundsTaken: Number(state?.result?.roundsTaken || state?.round || 0),
    hpDelta: startHp ? endHp - startHp : 0,
    essenceDelta: essenceMax ? essenceCurrent - essenceMax : 0,
    consumedGu: [],
    daoMarkDelta: {},
    createdTurn: Number(input.turn || input.encounter.createdTurn || 1),
    steps: steps.length ? steps : [summary],
  };
}

export function buildCombatOutcomeLedgerEntry(
  outcome: BattleOutcomeSummary,
  sceneId: string,
): LocalActionLedgerEntry {
  return {
    id: `ledger_${outcome.id}`,
    turn: outcome.createdTurn,
    sceneId,
    actionType: 'combat',
    source: 'v0.8.0-c2.3:narrative-combat',
    cost: 0,
    summary: outcome.summary,
    systemResult: {
      encounterId: outcome.encounterId,
      scale: outcome.scale,
      result: outcome.result,
      winner: outcome.winner ?? null,
      roundsTaken: outcome.roundsTaken,
      hpDelta: outcome.hpDelta,
      essenceDelta: outcome.essenceDelta,
      steps: outcome.steps,
      beastLoot: outcome.beastLoot,
    },
    risks: outcome.result === 'victory' ? [] : ['战斗结果会作为下一轮剧情压力承接'],
  };
}

export function formatCombatEncounterForPrompt(state: CombatEncounterState | null | undefined): string {
  if (!state || state.status === 'idle') return '';
  if (state.outcomeSummary) {
    const outcome = state.outcomeSummary;
    return [
      '【剧情战斗结果】',
      `${outcome.summary}`,
      `规模：${scaleLabel(outcome.scale)}；结果：${resultLabel(outcome.result)}；回合：${outcome.roundsTaken}。`,
      'DeepSeek 只能承接这份本地战果写叙事，不得改写胜负、血量、真元、资源或状态。',
    ].join('\n');
  }
  if (state.spec) {
    return [
      '【剧情战斗候选】',
      `${state.spec.title}（${scaleLabel(state.spec.scale)}，风险${riskLabel(state.spec.risk)}）：${state.spec.summary}`,
      state.validation?.valid
        ? '本地战斗入口已开启，玩家可选择进入；战斗胜负由本地引擎结算。'
        : `候选已降级：${state.validation?.blockers.join('；') || '未通过本地校验'}`,
    ].join('\n');
  }
  return '';
}

export function scaleLabel(scale: CombatEncounterScale): string {
  if (scale === 'duel') return '1v1决斗';
  if (scale === 'battlefield_5x3') return '5x3凡战';
  if (scale === 'group_5x3') return '5x3群像战';
  return '7x5群像战';
}

export function resultLabel(result: BattleOutcomeResult): string {
  if (result === 'victory') return '胜利';
  if (result === 'defeat') return '失败';
  if (result === 'retreat') return '撤退';
  if (result === 'abandoned') return '放弃';
  return '未决';
}

function riskLabel(risk: 'low' | 'medium' | 'high'): string {
  return risk === 'low' ? '低' : risk === 'high' ? '高' : '中';
}
