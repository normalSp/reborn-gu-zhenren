import { getGuUseRegistryEntries, type GuUseProvenance } from './gu-use-registry';
import { getPathRegistryEntries, isRuntimePathAllowed } from './path-registry';
import provenancePolicyRaw from '../canon/provenance-policy.json';
import guDatabaseRaw from '../canon/gu-database.json';
import immortalGuRaw from '../canon/immortal-gu.json';
import killerMovesRaw from '../canon/killer-moves.json';
import npcsRaw from '../canon/npcs.json';
import trainingGroundsRaw from '../canon/training-grounds.json';
import encountersRaw from '../canon/encounters.json';
import shopItemsRaw from '../canon/shop-items.json';
import economyBalanceRaw from '../canon/economy-balance.json';
import secretRealmsRaw from '../canon/secret-realms.json';

export interface RuntimeProvenanceReview {
  whitelisted?: boolean;
  worldviewNote?: string;
  designRole?: string;
  balanceTier?: string;
}

export interface RuntimeProvenanceSubject {
  id: string;
  name: string;
  provenance?: GuUseProvenance;
  review?: RuntimeProvenanceReview;
}

export interface ProvenanceGateIssue {
  id: string;
  severity: 'blocking' | 'warning';
  message: string;
}

interface CanonDatasetPolicy {
  id: string;
  file: string;
  scope: string;
  defaultProvenance: GuUseProvenance;
  runtimePools: string[];
  review?: RuntimeProvenanceReview;
}

const canonDatasetByFile: Record<string, any> = {
  'gu-database.json': guDatabaseRaw,
  'immortal-gu.json': immortalGuRaw,
  'killer-moves.json': killerMovesRaw,
  'npcs.json': npcsRaw,
  'training-grounds.json': trainingGroundsRaw,
  'encounters.json': encountersRaw,
  'shop-items.json': shopItemsRaw,
  'economy-balance.json': economyBalanceRaw,
  'secret-realms.json': secretRealmsRaw,
};

function hasText(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function datasetSourceText(data: any): string | undefined {
  return data?._meta?.source || data?.source || data?.description || data?.principle;
}

function auditRecordPaths(
  issues: ProvenanceGateIssue[],
  sourceId: string,
  record: Record<string, any>,
  pathKey: 'path' | 'pathType',
) {
  for (const [name, item] of Object.entries(record)) {
    if (name === '_meta' || !item || typeof item !== 'object') continue;
    const path = item[pathKey];
    if (!path) {
      if (item.runtimePathAllowed === false || item.runtimeAllowed === false) continue;
      continue;
    }

    if (item.runtimeAllowed === false) {
      if (!hasText(item.reviewStatus) || !hasText(item.reviewNote)) {
        issues.push({
          id: `${sourceId}:${name}`,
          severity: 'blocking',
          message: `${name} 使用未确认流派 ${path}，但缺少 runtimeAllowed=false 的复核说明。`,
        });
      }
      continue;
    }

    if (!isRuntimePathAllowed(path)) {
      issues.push({
        id: `${sourceId}:${name}`,
        severity: 'blocking',
        message: `${name} 使用了未通过原著运行时注册表的流派: ${path}`,
      });
    }
  }
}

export function isRuntimeProvenanceAllowed(subject: RuntimeProvenanceSubject): boolean {
  if (subject.provenance && subject.provenance !== 'unknown') return true;
  const review = subject.review;
  return !!(
    review?.whitelisted &&
    review.worldviewNote &&
    review.designRole &&
    review.balanceTier
  );
}

export function auditGuUseRegistryProvenance(): ProvenanceGateIssue[] {
  const issues: ProvenanceGateIssue[] = [];

  for (const entry of getGuUseRegistryEntries()) {
    if (!isRuntimeProvenanceAllowed({ id: entry.guName, name: entry.guName, provenance: entry.provenance })) {
      issues.push({
        id: entry.guName,
        severity: 'blocking',
        message: `${entry.guName} 缺少可运行来源标注或 unknown 审核白名单。`,
      });
    }
    if (!entry.balanceTier) {
      issues.push({
        id: entry.guName,
        severity: 'blocking',
        message: `${entry.guName} 缺少数值档位 balanceTier。`,
      });
    }
    if (!entry.loreRef) {
      issues.push({
        id: entry.guName,
        severity: 'blocking',
        message: `${entry.guName} 缺少世界观依据 loreRef。`,
      });
    }

    for (const effect of entry.effects || []) {
      if (effect.path && !isRuntimePathAllowed(effect.path)) {
        issues.push({
          id: entry.guName,
          severity: 'blocking',
          message: `${entry.guName} 使用了未通过运行时注册的流派: ${effect.path}`,
        });
      }
    }
  }

  return issues;
}

export function auditPathRegistryRuntimeGate(): ProvenanceGateIssue[] {
  const issues: ProvenanceGateIssue[] = [];

  for (const path of getPathRegistryEntries()) {
    if (path.runtimeAllowed && path.canonicalStatus !== 'confirmed') {
      issues.push({
        id: path.id,
        severity: 'blocking',
        message: `${path.id} 不是 confirmed，却被允许进入 runtime。`,
      });
    }
    if ((path.canonicalStatus === 'blocked' || path.canonicalStatus === 'category_only') && path.runtimeAllowed) {
      issues.push({
        id: path.id,
        severity: 'blocking',
        message: `${path.id} 是 ${path.canonicalStatus}，不能进入战斗、炼蛊、宝黄天或蛊使用路径。`,
      });
    }
  }

  return issues;
}

export function auditRuntimeProvenanceGate(): ProvenanceGateIssue[] {
  return [
    ...auditGuUseRegistryProvenance(),
    ...auditCanonDatasetProvenance(),
    ...auditPathRegistryRuntimeGate(),
  ];
}

export function auditCanonDatasetProvenance(): ProvenanceGateIssue[] {
  const issues: ProvenanceGateIssue[] = [];
  const policies = ((provenancePolicyRaw as any).runtimeDatasets || []) as CanonDatasetPolicy[];

  for (const policy of policies) {
    const data = canonDatasetByFile[policy.file];
    if (!data) {
      issues.push({
        id: policy.id,
        severity: 'blocking',
        message: `${policy.id} 指向的 canon 文件不存在: ${policy.file}`,
      });
      continue;
    }

    if (!isRuntimeProvenanceAllowed({
      id: policy.id,
      name: policy.scope,
      provenance: policy.defaultProvenance,
      review: policy.review,
    })) {
      issues.push({
        id: policy.id,
        severity: 'blocking',
        message: `${policy.id} 缺少可运行来源标注或 unknown 审核白名单。`,
      });
    }

    if (!hasText(datasetSourceText(data))) {
      issues.push({
        id: policy.id,
        severity: 'warning',
        message: `${policy.id} 缺少数据源 source/description 说明。`,
      });
    }

    if (!Array.isArray(policy.runtimePools) || policy.runtimePools.length === 0) {
      issues.push({
        id: policy.id,
        severity: 'blocking',
        message: `${policy.id} 未声明会进入哪些运行时池。`,
      });
    }
  }

  auditRecordPaths(issues, 'gu-database', guDatabaseRaw as any, 'path');
  auditRecordPaths(issues, 'immortal-gu', immortalGuRaw as any, 'path');
  auditRecordPaths(issues, 'killer-moves', killerMovesRaw as any, 'path');

  const trainingGrounds = ((trainingGroundsRaw as any).grounds || {}) as Record<string, any>[]; 
  auditRecordPaths(
    issues,
    'training-grounds',
    Object.fromEntries(trainingGrounds.map(ground => [ground.id || ground.name, ground])),
    'pathType',
  );

  const secretRealms = ((secretRealmsRaw as any)['天地秘境'] || {}) as Record<string, any>;
  auditRecordPaths(issues, 'secret-realms', secretRealms, 'path');

  return issues;
}
