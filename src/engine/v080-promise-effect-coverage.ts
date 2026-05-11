import coverageRaw from '../canon/v080-promise-effect-coverage.json';

export type PromiseEffectCoverageStatus =
  | 'runtime_active'
  | 'creation_only'
  | 'registered_unconsumed'
  | 'planned_needs_system'
  | 'narrative_only'
  | 'needs_downgrade';

export interface PromiseEffectCoverageRule {
  id: string;
  sourceTypes: string[];
  matchAny: string[];
  status: PromiseEffectCoverageStatus;
  evidence: string;
  ownerPhase: string;
  reason: string;
  nextStep?: string;
}

export interface PromiseEffectCoverageResolution {
  claim: string;
  status: PromiseEffectCoverageStatus;
  evidence: string;
  ownerPhase?: string;
  reason?: string;
  nextStep?: string;
}

type CoverageData = {
  _meta?: {
    releasePolicy?: {
      allowNeedsDowngrade?: boolean;
      plannedRowsMustExplainOwner?: boolean;
    };
  };
  explicitClaims?: PromiseEffectCoverageRule[];
  plannedBacklog?: Array<{ id: string; ownerPhase: string; reason: string }>;
};

const COVERAGE = coverageRaw as CoverageData;
const RULES = COVERAGE.explicitClaims ?? [];

function normalize(value: unknown): string {
  return String(value ?? '').trim().toLowerCase();
}

function includesAny(claim: string, needles: string[]): boolean {
  const normalizedClaim = normalize(claim);
  return needles.some(needle => {
    const normalizedNeedle = normalize(needle);
    return Boolean(normalizedNeedle) && normalizedClaim.includes(normalizedNeedle);
  });
}

export function getPromiseEffectCoverageRules(): PromiseEffectCoverageRule[] {
  return [...RULES];
}

export function classifyPromiseEffectClaim(
  claim: string,
  sourceType: string,
  sourceId: string,
): PromiseEffectCoverageResolution {
  const cleanClaim = String(claim || '').trim();
  const explicit = RULES.find(rule =>
    (rule.sourceTypes.includes(sourceType) || rule.sourceTypes.includes('*')) &&
    includesAny(cleanClaim, rule.matchAny)
  );
  if (explicit) {
    return {
      claim: cleanClaim,
      status: explicit.status,
      evidence: explicit.evidence,
      ownerPhase: explicit.ownerPhase,
      reason: explicit.reason,
      nextStep: explicit.nextStep,
    };
  }

  const numericClaim = /[+\-]\d|×\d|x\d|X\d|%|概率|成功率|折扣|消耗|恢复|产出|风险|收益|速度|伤害|防御|命中|逃脱/.test(cleanClaim);
  if (numericClaim) {
    return {
      claim: cleanClaim,
      status: 'planned_needs_system',
      evidence: `${sourceType}:${sourceId}:coverage-unmapped-numeric-claim`,
      ownerPhase: 'v0.8.0-c1.1',
      reason: '数值承诺尚未命中显式覆盖规则，发布前必须补 truth source 或改为叙事描述。',
      nextStep: 'Register this promise in v080-promise-effect-coverage.json or modifier-registry.json.',
    };
  }

  return {
    claim: cleanClaim,
    status: 'narrative_only',
    evidence: `${sourceType}:${sourceId}:coverage-default-narrative`,
    ownerPhase: 'v0.8.0-c1.1',
    reason: '未声明数值效果，按叙事约束处理。',
  };
}

export function validatePromiseEffectCoverageRelease(): string[] {
  const issues: string[] = [];
  const allowNeedsDowngrade = COVERAGE._meta?.releasePolicy?.allowNeedsDowngrade === true;
  for (const rule of RULES) {
    if (!allowNeedsDowngrade && rule.status === 'needs_downgrade') {
      issues.push(`${rule.id} still uses needs_downgrade`);
    }
    if (rule.status === 'planned_needs_system' && (!rule.ownerPhase || !rule.reason)) {
      issues.push(`${rule.id} planned_needs_system must explain ownerPhase and reason`);
    }
  }
  return issues;
}
