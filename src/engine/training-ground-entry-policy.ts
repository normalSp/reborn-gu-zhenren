import type { CombatEncounterScale } from '../types';
import type { TrainingGroundContext, TrainingGroundSpec } from './training-ground-engine';

export type TrainingGroundEntryStatus =
  | 'available'
  | 'debug_only'
  | 'missing_clue'
  | 'location_mismatch'
  | 'realm_blocked'
  | 'cooldown'
  | 'blocked';

export interface TrainingGroundEntryPolicyOptions {
  allowLegacyDebugAccess?: boolean;
  narrativeClueIds?: string[];
  unlockedGroundIds?: string[];
}

export interface TrainingGroundEntryPolicy {
  ground: TrainingGroundSpec;
  status: TrainingGroundEntryStatus;
  canDisplay: boolean;
  canEnter: boolean;
  debugOnly: boolean;
  blockers: string[];
  warnings: string[];
  recommendedActions: string[];
  routeHint?: CombatEncounterScale;
}

export interface TrainingGroundEntrySummary {
  entries: TrainingGroundEntryPolicy[];
  displayable: TrainingGroundEntryPolicy[];
  blockers: string[];
  recommendedActions: string[];
  hasAnyDisplayable: boolean;
}

function hasNarrativeClue(ground: TrainingGroundSpec, options: TrainingGroundEntryPolicyOptions): boolean {
  const clues = new Set([...(options.narrativeClueIds || []), ...(options.unlockedGroundIds || [])].map(String));
  return clues.has(ground.id) || clues.has(ground.chapterRequired || '') || clues.has(ground.domain);
}

function routeHintForGround(ground: TrainingGroundSpec): CombatEncounterScale | undefined {
  if (ground.type === 'hunt') return 'group_7x5';
  if (ground.type === '对决' || ground.type === '瀵瑰喅') return 'duel';
  if (ground.type === '试炼' || ground.type === '璇曠偧') return 'battlefield_5x3';
  return undefined;
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

export function evaluateTrainingGroundEntry(
  ground: TrainingGroundSpec,
  context: TrainingGroundContext,
  options: TrainingGroundEntryPolicyOptions = {},
): TrainingGroundEntryPolicy {
  const blockers: string[] = [];
  const warnings: string[] = [];
  const recommendedActions: string[] = [];
  let status: TrainingGroundEntryStatus = 'available';

  if (ground.immortalOnly && !context.isImmortal) {
    blockers.push('需要蛊仙境界。');
    recommendedActions.push('推进修行或查看仙窍入口。');
    status = 'realm_blocked';
  }
  if (Number.isFinite(ground.minRealm) && context.realmGrand < Number(ground.minRealm)) {
    blockers.push(`境界不足：需要 ${ground.minRealm} 转以上。`);
    recommendedActions.push('先完成本地修行、突破或升仙闭环。');
    status = 'realm_blocked';
  }
  if (ground.chapterRequired && context.currentChapterId && ground.chapterRequired !== context.currentChapterId) {
    blockers.push(`地点/章节不匹配：需要 ${ground.chapterRequired}。`);
    recommendedActions.push('推进剧情、出发到对应地点，或等待剧情给出道场线索。');
    status = status === 'available' ? 'location_mismatch' : status;
  }
  const cooldownUntil = context.cooldowns?.[ground.id] || 0;
  if (cooldownUntil > context.turn) {
    blockers.push(`仍在冷却：第 ${cooldownUntil} 回后可用。`);
    recommendedActions.push('推进剧情或选择其他本地行动。');
    status = status === 'available' ? 'cooldown' : status;
  }

  const clueOwned = hasNarrativeClue(ground, options);
  const allowLegacyDebugAccess = options.allowLegacyDebugAccess !== false;
  if (!clueOwned) {
    warnings.push('缺少剧情线索：a1 暂保留旧入口，a2 会改为线索驱动。');
    recommendedActions.push('通过侦察、对话、传承或福地资源点获取道场线索。');
    if (!allowLegacyDebugAccess) {
      blockers.push('缺少剧情线索。');
      status = status === 'available' ? 'missing_clue' : status;
    } else if (status === 'available') {
      status = 'debug_only';
    }
  }

  const routeHint = routeHintForGround(ground);
  if (ground.type === 'hunt') {
    warnings.push('hunt 道场将在 v0.9.0-a3 接入荒兽/兽群敌库，默认路由 group_7x5。');
  }

  const canEnter = blockers.length === 0;
  const canDisplay = canEnter || allowLegacyDebugAccess;
  return {
    ground,
    status: canEnter ? status : status === 'available' ? 'blocked' : status,
    canDisplay,
    canEnter,
    debugOnly: canEnter && status === 'debug_only',
    blockers,
    warnings,
    recommendedActions: unique(recommendedActions),
    routeHint,
  };
}

export function summarizeTrainingGroundEntries(
  grounds: TrainingGroundSpec[],
  context: TrainingGroundContext,
  options: TrainingGroundEntryPolicyOptions = {},
): TrainingGroundEntrySummary {
  const entries = grounds.map(ground => evaluateTrainingGroundEntry(ground, context, options));
  const displayable = entries.filter(entry => entry.canEnter);
  const blockers = unique(entries.flatMap(entry => entry.blockers));
  const recommendedActions = unique([
    ...entries.flatMap(entry => entry.recommendedActions),
    '推进剧情，等待文本给出道场、猎场、试炼或传承入口。',
  ]);
  return {
    entries,
    displayable,
    blockers,
    recommendedActions,
    hasAnyDisplayable: displayable.length > 0,
  };
}
