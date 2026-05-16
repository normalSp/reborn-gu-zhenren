import contentPackRaw from '../canon/qingmao-low-rank-content-pack.json';
import type {
  CombatEncounterEntryValidation,
  CombatEncounterScale,
  CombatEventCandidate,
  CombatEventCandidateType,
} from '../types';
import { evaluateCombatEncounterEntry } from './v080-narrative-combat-orchestration';

type RewardPolicy = 'local_engine_only' | 'candidate_clue_only';
type ReadinessStatus = 'ready_for_local_validation' | 'candidate_only' | 'blocked';

interface QingmaoLowRankContentPack {
  _meta: {
    version: string;
    status: 'candidate_review';
    runtimeActivation: 'not_active';
    saveFormatImpact: 'none';
  };
  guCandidates: Array<{
    id: string;
    guName: string;
    expressionRef: string;
    activation: 'runtime_candidate' | 'candidate_only';
  }>;
  encounterTemplates: QingmaoCombatEncounterTemplate[];
}

export interface QingmaoCombatEncounterTemplate {
  id: string;
  displayName: string;
  sourceActionSlot: string;
  requiredIdentityRoles: string[];
  combatScale: CombatEncounterScale;
  recommendedGuIds: string[];
  rewardPolicy: RewardPolicy;
  risk: 'low' | 'medium' | 'high';
  notes: string;
}

export interface QingmaoCombatTemplateReadiness {
  template: QingmaoCombatEncounterTemplate;
  status: ReadinessStatus;
  blockers: string[];
  warnings: string[];
  recommendedGuNames: string[];
}

export interface QingmaoCombatCandidateBuildResult {
  template: QingmaoCombatEncounterTemplate | null;
  readiness: QingmaoCombatTemplateReadiness | null;
  candidate: CombatEventCandidate | null;
  validation: CombatEncounterEntryValidation | null;
  blockers: string[];
  warnings: string[];
  saveFormatImpact: 'none';
}

const contentPack = contentPackRaw as QingmaoLowRankContentPack;

const FIRST_VALIDATION_TEMPLATE_IDS = new Set([
  'qingmao_encounter_clan_school_spar',
  'qingmao_encounter_front_mountain_patrol',
  'qingmao_encounter_wolf_shadow_pressure',
]);

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function guNameById(id: string): string | null {
  return contentPack.guCandidates.find(candidate => candidate.id === id)?.guName || null;
}

function candidateTypeFor(template: QingmaoCombatEncounterTemplate): CombatEventCandidateType {
  if (template.id.includes('wolf') || template.id.includes('trap')) return 'ambush';
  if (template.id.includes('patrol')) return 'pursuit';
  if (template.id.includes('spar')) return 'other';
  return 'environment';
}

function enemyHintFor(template: QingmaoCombatEncounterTemplate): string {
  if (template.id.includes('wolf')) return '狼影与山道兽压';
  if (template.id.includes('trap')) return '林道暗线与伏击者';
  if (template.id.includes('patrol')) return '巡查中发现的可疑目标';
  return '族学切磋对手';
}

export function getQingmaoLowRankContentPack(): QingmaoLowRankContentPack {
  return contentPack;
}

export function listQingmaoCombatTemplateReadiness(): QingmaoCombatTemplateReadiness[] {
  return contentPack.encounterTemplates.map(template => {
    const blockers: string[] = [];
    const warnings: string[] = [];
    const recommendedGuNames = template.recommendedGuIds.map(guNameById).filter(Boolean) as string[];

    if (contentPack._meta.status !== 'candidate_review') blockers.push('青茅低阶内容包不是 candidate_review 状态。');
    if (contentPack._meta.runtimeActivation !== 'not_active') blockers.push('内容包已被错误激活为运行时来源。');
    if (contentPack._meta.saveFormatImpact !== 'none') blockers.push('内容包不应要求存档迁移。');
    if (template.combatScale !== 'battlefield_5x3') blockers.push(`${template.displayName} 不是 5x3 凡战模板。`);
    if (!['local_engine_only', 'candidate_clue_only'].includes(template.rewardPolicy)) {
      blockers.push(`${template.displayName} 的奖励策略越界。`);
    }
    if (recommendedGuNames.length !== template.recommendedGuIds.length) {
      blockers.push(`${template.displayName} 引用了不存在的低阶蛊候选。`);
    }
    if (!FIRST_VALIDATION_TEMPLATE_IDS.has(template.id)) {
      warnings.push('该模板保留为候选，等待前 2-3 个模板验证稳定后再接入。');
    }

    return {
      template,
      status: blockers.length > 0
        ? 'blocked'
        : FIRST_VALIDATION_TEMPLATE_IDS.has(template.id)
          ? 'ready_for_local_validation'
          : 'candidate_only',
      blockers,
      warnings,
      recommendedGuNames,
    };
  });
}

export function buildQingmaoCombatEventCandidate(
  templateId: string,
  store: any = {},
): QingmaoCombatCandidateBuildResult {
  const readiness = listQingmaoCombatTemplateReadiness().find(item => item.template.id === templateId) || null;
  if (!readiness) {
    return {
      template: null,
      readiness: null,
      candidate: null,
      validation: null,
      blockers: [`未知青茅战斗模板：${templateId}`],
      warnings: [],
      saveFormatImpact: 'none',
    };
  }

  if (readiness.status === 'blocked') {
    return {
      template: readiness.template,
      readiness,
      candidate: null,
      validation: null,
      blockers: readiness.blockers,
      warnings: readiness.warnings,
      saveFormatImpact: 'none',
    };
  }

  const template = readiness.template;
  const candidate: CombatEventCandidate = {
    id: `qingmao_b2_${template.id}_${Number(store?.turn || 1)}`,
    type: candidateTypeFor(template),
    title: template.displayName,
    summary: `${template.displayName}：${template.notes} 本候选只进入本地战斗入口验证，奖励策略为 ${template.rewardPolicy}。`,
    risk: template.risk,
    source: 'engine',
    engineValidation: 'pending',
    createdTurn: Number(store?.turn || 1),
    scale: template.combatScale,
    enemyHint: enemyHintFor(template),
    requiredRealmGrand: 1,
    dropPolicyId: template.rewardPolicy,
    gridPresetId: 'skirmish_5x3',
  };
  const validation = evaluateCombatEncounterEntry(candidate, store);
  return {
    template,
    readiness,
    candidate: {
      ...candidate,
      engineValidation: validation.valid ? 'pending' : 'downgraded',
      validationIssues: uniqueStrings([...validation.blockers, ...validation.warnings]),
      entryValidation: validation,
    },
    validation,
    blockers: validation.blockers,
    warnings: uniqueStrings([...readiness.warnings, ...validation.warnings]),
    saveFormatImpact: 'none',
  };
}
