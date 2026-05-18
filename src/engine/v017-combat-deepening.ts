import rulesRaw from '../canon/v017-combat-deepening-rules.json';
import type {
  BattleOutcomeSummary,
  BattleResolutionStep,
  CombatEncounterEntryValidation,
  CombatEncounterScale,
  CombatEventCandidate,
  CombatEventCandidateType,
} from '../types';
import { evaluateCombatEncounterEntry } from './v080-narrative-combat-orchestration';

type ReviewStatus = 'ready_for_local_validation' | 'candidate_only' | 'blocked';
type SaveFormatImpact = 'none';

interface V017CombatRules {
  _meta: {
    version: string;
    status: 'candidate_review';
    runtimeActivation: 'local_validation_only';
    saveFormatImpact: SaveFormatImpact;
    miroFishPackageIds: string[];
    boundary: string;
  };
  encounterCandidates: V017EncounterRule[];
  counterBoundaries: V017CounterBoundaryRule[];
  squadTactics: V017SquadTacticRule[];
}

export interface V017EncounterRule {
  id: string;
  displayName: string;
  summary: string;
  publicCombatReason: string;
  runtimeReadiness: ReviewStatus;
  combatScale: CombatEncounterScale;
  candidateType: CombatEventCandidateType;
  risk: 'low' | 'medium' | 'high';
  requiredRealmGrand: number;
  enemyHint: string;
  sceneTags: string[];
  terrainHints: string[];
  pressureAxes: string[];
  recommendedGuNames: string[];
  counterBoundaryIds: string[];
  squadTacticIds: string[];
  allowedOutcomes: string[];
  blockedOutcomes: string[];
  sourcePackageId: string;
  sourcePointerIds: string[];
}

export interface V017CounterBoundaryRule {
  id: string;
  displayName: string;
  summary: string;
  usableWhen: string[];
  counterHints: string[];
  riskHints: string[];
  blockedImplications: string[];
  sourcePackageId: string;
  sourcePointerIds: string[];
}

export interface V017SquadTacticRule {
  id: string;
  displayName: string;
  summary: string;
  tacticTags: string[];
  triggerHints: string[];
  allowedEffects: string[];
  blockedEffects: string[];
  sourcePackageId: string;
  sourcePointerIds: string[];
}

export interface V017CombatPreparationView {
  id: string;
  title: string;
  summary: string;
  publicCombatReason: string;
  status: ReviewStatus;
  canRegister: boolean;
  risk: 'low' | 'medium' | 'high';
  scale: CombatEncounterScale;
  terrainLine: string;
  pressureLine: string;
  recommendedGuLine: string;
  counterHints: string[];
  tacticHints: string[];
  blockedOutcomes: string[];
  validationLabel: string;
  blockers: string[];
  warnings: string[];
  sourcePackageId: string;
  sourcePointerCount: number;
}

export interface V017CombatCandidateBuildResult {
  rule: V017EncounterRule | null;
  view: V017CombatPreparationView | null;
  candidate: CombatEventCandidate | null;
  validation: CombatEncounterEntryValidation | null;
  blockers: string[];
  warnings: string[];
  saveFormatImpact: SaveFormatImpact;
}

export interface V017BattleTraceView {
  id: string;
  title: string;
  lines: string[];
  boundary: string;
  saveFormatImpact: SaveFormatImpact;
}

const rules = rulesRaw as V017CombatRules;

const READY_STATUSES = new Set<ReviewStatus>(['ready_for_local_validation']);
const BOUNDARY_BLOCKS = [
  'reward_grant',
  'gu_grant',
  'location_unlock',
  'faction_transfer',
  'npc_death',
  'hidden_fact_reveal',
];

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function joinLine(values: string[], fallback: string): string {
  return values.length > 0 ? values.slice(0, 4).join(' / ') : fallback;
}

function findCounter(id: string): V017CounterBoundaryRule | undefined {
  return rules.counterBoundaries.find(item => item.id === id);
}

function findTactic(id: string): V017SquadTacticRule | undefined {
  return rules.squadTactics.find(item => item.id === id);
}

function coreRuleBlockers(rule: V017EncounterRule): string[] {
  const blockers: string[] = [];
  if (rules._meta.status !== 'candidate_review') blockers.push('v0.17 战斗规则包不是 candidate_review 状态。');
  if (rules._meta.runtimeActivation !== 'local_validation_only') blockers.push('v0.17 战斗规则包运行时权限越界。');
  if (rules._meta.saveFormatImpact !== 'none') blockers.push('v0.17 战斗规则包不应要求存档迁移。');
  if (!['battlefield_5x3', 'group_5x3', 'group_7x5', 'duel'].includes(rule.combatScale)) {
    blockers.push(`${rule.displayName} 使用了未知战斗规模。`);
  }
  if (!['local_engine_only', 'candidate_clue_only'].includes(dropPolicyFor(rule))) {
    blockers.push(`${rule.displayName} 的奖励策略越界。`);
  }
  for (const blocked of BOUNDARY_BLOCKS) {
    if (!rule.blockedOutcomes.includes(blocked)) {
      blockers.push(`${rule.displayName} 未声明阻断 ${blocked}。`);
    }
  }
  return blockers;
}

function ruleWarnings(rule: V017EncounterRule): string[] {
  const warnings: string[] = [];
  if (rule.runtimeReadiness !== 'ready_for_local_validation') {
    warnings.push('该样本仍是候选，只能作为提示、测试样本或后续设计材料。');
  }
  if (rule.combatScale !== 'battlefield_5x3') {
    warnings.push('非 5x3 凡战样本先保持只读，等小队/阵法入口稳定后再升级。');
  }
  return warnings;
}

function dropPolicyFor(rule: V017EncounterRule): 'local_engine_only' | 'candidate_clue_only' {
  if (rule.allowedOutcomes.includes('combat_entry') && rule.runtimeReadiness === 'ready_for_local_validation') {
    return 'local_engine_only';
  }
  return 'candidate_clue_only';
}

function buildCandidate(rule: V017EncounterRule, store: any = {}): CombatEventCandidate {
  const turn = Number(store?.turn || 1);
  return {
    id: `v017_${rule.id}_${turn}`,
    type: rule.candidateType,
    title: rule.displayName,
    summary: `${rule.summary} ${rule.publicCombatReason} 本候选只走本地战斗入口，禁止直接发放奖励、地点、阵营或 NPC 生死结果。`,
    risk: rule.risk,
    source: 'engine',
    engineValidation: 'pending',
    createdTurn: turn,
    scale: rule.combatScale,
    enemyHint: rule.enemyHint,
    requiredRealmGrand: rule.requiredRealmGrand,
    dropPolicyId: dropPolicyFor(rule),
    gridPresetId: rule.combatScale === 'battlefield_5x3' ? 'skirmish_5x3' : rule.combatScale,
  };
}

export function getV017CombatDeepeningRules(): V017CombatRules {
  return rules;
}

export function listV017CounterBoundaryViews(): V017CounterBoundaryRule[] {
  return [...rules.counterBoundaries];
}

export function listV017SquadTacticViews(): V017SquadTacticRule[] {
  return [...rules.squadTactics];
}

export function listV017CombatPreparationViews(store: any = {}): V017CombatPreparationView[] {
  return rules.encounterCandidates.map(rule => {
    const coreBlockers = coreRuleBlockers(rule);
    const candidate = coreBlockers.length === 0 ? buildCandidate(rule, store) : null;
    const validation = candidate ? evaluateCombatEncounterEntry(candidate, store) : null;
    const blockers = uniqueStrings([...coreBlockers, ...(validation?.blockers || [])]);
    const warnings = uniqueStrings([...ruleWarnings(rule), ...(validation?.warnings || [])]);
    const status = blockers.length > 0 ? 'blocked' : rule.runtimeReadiness;
    const canRegister = READY_STATUSES.has(status) && Boolean(validation?.valid);
    const counters = rule.counterBoundaryIds.map(findCounter).filter(Boolean) as V017CounterBoundaryRule[];
    const tactics = rule.squadTacticIds.map(findTactic).filter(Boolean) as V017SquadTacticRule[];

    return {
      id: rule.id,
      title: rule.displayName,
      summary: rule.summary,
      publicCombatReason: rule.publicCombatReason,
      status,
      canRegister,
      risk: rule.risk,
      scale: rule.combatScale,
      terrainLine: joinLine(rule.terrainHints, '无地形提示'),
      pressureLine: joinLine(rule.pressureAxes, '无压力轴'),
      recommendedGuLine: joinLine(rule.recommendedGuNames, '无推荐蛊'),
      counterHints: counters.flatMap(item => item.counterHints).slice(0, 4),
      tacticHints: tactics.map(item => `${item.displayName}：${item.summary}`).slice(0, 3),
      blockedOutcomes: uniqueStrings([
        ...rule.blockedOutcomes,
        ...counters.flatMap(item => item.blockedImplications),
        ...tactics.flatMap(item => item.blockedEffects),
      ]),
      validationLabel: blockers.length > 0 ? `${blockers.length} 阻断` : warnings.length > 0 ? `${warnings.length} 提醒` : '可登记',
      blockers,
      warnings,
      sourcePackageId: rule.sourcePackageId,
      sourcePointerCount: rule.sourcePointerIds.length,
    };
  });
}

export function buildV017CombatEventCandidate(
  ruleId: string,
  store: any = {},
): V017CombatCandidateBuildResult {
  const rule = rules.encounterCandidates.find(item => item.id === ruleId) || null;
  if (!rule) {
    return {
      rule: null,
      view: null,
      candidate: null,
      validation: null,
      blockers: [`未知 v0.17 战斗候选：${ruleId}`],
      warnings: [],
      saveFormatImpact: 'none',
    };
  }

  const view = listV017CombatPreparationViews(store).find(item => item.id === ruleId) || null;
  if (!view || view.status === 'blocked') {
    return {
      rule,
      view,
      candidate: null,
      validation: null,
      blockers: view?.blockers || coreRuleBlockers(rule),
      warnings: view?.warnings || ruleWarnings(rule),
      saveFormatImpact: 'none',
    };
  }

  if (view.status !== 'ready_for_local_validation') {
    return {
      rule,
      view,
      candidate: null,
      validation: null,
      blockers: [],
      warnings: view.warnings.length ? view.warnings : ['该样本仍是候选，不能登记为正式战斗入口。'],
      saveFormatImpact: 'none',
    };
  }

  const candidate = buildCandidate(rule, store);
  const validation = evaluateCombatEncounterEntry(candidate, store);
  const blockers = validation.blockers;
  const warnings = uniqueStrings([...view.warnings, ...validation.warnings]);

  return {
    rule,
    view,
    candidate: {
      ...candidate,
      engineValidation: validation.valid ? 'pending' : 'downgraded',
      validationIssues: uniqueStrings([...blockers, ...warnings]),
      entryValidation: validation,
    },
    validation,
    blockers,
    warnings,
    saveFormatImpact: 'none',
  };
}

export function buildV017TraceReviewFromSteps(steps: BattleResolutionStep[] = []): V017BattleTraceView {
  const lines = steps
    .slice(-6)
    .map(step => String(step.message || step.sourceName || step.kind || '战斗轨迹'))
    .filter(Boolean);
  return {
    id: 'v017_trace_review',
    title: 'v0.17 战斗轨迹复核',
    lines: lines.length ? lines : ['等待本地战斗引擎输出轨迹。'],
    boundary: '只展示本地轨迹和压力，不补写正式奖励、地点、阵营、NPC 生死或隐藏事实。',
    saveFormatImpact: 'none',
  };
}

export function buildV017OutcomeBackflowView(outcome: BattleOutcomeSummary | null | undefined): V017BattleTraceView {
  if (!outcome) {
    return {
      id: 'v017_outcome_backflow_pending',
      title: 'v0.17 战后回流待生成',
      lines: ['战斗尚未结算，暂不向剧情文本回流。'],
      boundary: 'DeepSeek 只能承接本地战果写叙事，不能改写胜负、资源、地点、阵营或 NPC 生死。',
      saveFormatImpact: 'none',
    };
  }
  return {
    id: `v017_outcome_backflow_${outcome.id}`,
    title: 'v0.17 战后回流复核',
    lines: [
      outcome.summary,
      `结果：${outcome.result}；回合：${outcome.roundsTaken}；气血变化：${outcome.hpDelta}；真元变化：${outcome.essenceDelta}。`,
      ...outcome.steps.slice(-4),
    ],
    boundary: '战果已经由本地引擎写入行动账本；文本层只能承接，不得追加奖励或改写事实。',
    saveFormatImpact: 'none',
  };
}
