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
import { generateAuctionPool, generateKillerMovePool, generateMaterialPool, generateRareTradePool, generateRecipePool } from './auction-engine';
import { getMaterialEntry, resolveMaterialAlias } from './material-registry';

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

export type ProvenanceSourceMethod = 'record_override' | 'dataset_default' | 'review_whitelist';

export interface ReleaseProvenanceCoverageRow {
  datasetId: string;
  recordId: string;
  name: string;
  runtimePools: string[];
  effectiveProvenance: GuUseProvenance;
  sourceMethod: ProvenanceSourceMethod;
  worldviewNote: string;
  designRole: string;
  balanceTier: string;
  issues: ProvenanceGateIssue[];
}

export interface ReleaseProvenanceCoverage {
  rows: ReleaseProvenanceCoverageRow[];
  summary: {
    totalRecords: number;
    byProvenance: Record<GuUseProvenance, number>;
    blockingCount: number;
    warningCount: number;
  };
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

function recordReview(item: any, fallback?: RuntimeProvenanceReview): RuntimeProvenanceReview | undefined {
  return item?.review || item?.provenanceReview || item?.runtimeReview || fallback;
}

function recordProvenance(item: any, fallback: GuUseProvenance): GuUseProvenance {
  return (item?.provenance || item?.sourceProvenance || fallback) as GuUseProvenance;
}

function recordName(item: any, fallback: string): string {
  return String(item?.name || item?.title || item?.targetGu || item?.type || fallback);
}

function getPolicyRecords(policy: CanonDatasetPolicy, data: any): Array<[string, any]> {
  if (!data) return [];
  if (policy.file === 'gu-database.json' || policy.file === 'immortal-gu.json' || policy.file === 'killer-moves.json') {
    return Object.entries(data).filter(([key]) => !key.startsWith('_'));
  }
  if (policy.file === 'npcs.json') {
    return Object.entries(data.npcDatabase || {});
  }
  if (policy.file === 'training-grounds.json') {
    return ((data.grounds || []) as any[]).map(item => [item.id || item.name, item]);
  }
  if (policy.file === 'encounters.json') {
    const rows: Array<[string, any]> = [];
    for (const [chapterId, chapter] of Object.entries(data.encounters || {})) {
      for (const [encounterId, encounter] of Object.entries((chapter as any) || {})) {
        rows.push([`${chapterId}:${encounterId}`, encounter]);
      }
    }
    return rows;
  }
  if (policy.file === 'shop-items.json') {
    return ((data.items || []) as any[]).map(item => [item.id || item.name, item]);
  }
  if (policy.file === 'economy-balance.json') {
    return [
      ['auctionPricing', data.auctionPricing || data],
      ['simulationScenarios', data.simulationScenarios || {}],
    ];
  }
  if (policy.file === 'secret-realms.json') {
    const rows: Array<[string, any]> = [];
    for (const [sectionId, section] of Object.entries(data)) {
      if (sectionId === '_meta' || !section || typeof section !== 'object') continue;
      for (const [recordId, record] of Object.entries(section as any)) {
        if (recordId === '说明') continue;
        rows.push([`${sectionId}:${recordId}`, record]);
      }
    }
    return rows;
  }
  return Array.isArray(data)
    ? data.map((item, index) => [item?.id || item?.name || String(index), item])
    : Object.entries(data).filter(([key]) => !key.startsWith('_'));
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
    ...auditTrainingGroundMetadata(),
    ...auditAuctionRuntimePoolProvenance(),
  ];
}

export function generateReleaseProvenanceCoverage(): ReleaseProvenanceCoverage {
  const rows: ReleaseProvenanceCoverageRow[] = [];
  const policies = ((provenancePolicyRaw as any).runtimeDatasets || []) as CanonDatasetPolicy[];

  for (const policy of policies) {
    const data = canonDatasetByFile[policy.file];
    for (const [recordId, item] of getPolicyRecords(policy, data)) {
      const effectiveProvenance = recordProvenance(item, policy.defaultProvenance);
      const review = recordReview(item, policy.review);
      const issues: ProvenanceGateIssue[] = [];
      const sourceMethod: ProvenanceSourceMethod = item?.provenance || item?.sourceProvenance
        ? 'record_override'
        : effectiveProvenance === 'unknown' && review?.whitelisted
          ? 'review_whitelist'
          : 'dataset_default';

      if (!isRuntimeProvenanceAllowed({
        id: `${policy.id}:${recordId}`,
        name: recordName(item, recordId),
        provenance: effectiveProvenance,
        review,
      })) {
        issues.push({
          id: `${policy.id}:${recordId}`,
          severity: 'blocking',
          message: `${recordId} 缺少可运行来源标注或 unknown 审核白名单。`,
        });
      }
      if (!review?.worldviewNote || !review?.designRole || !review?.balanceTier) {
        issues.push({
          id: `${policy.id}:${recordId}`,
          severity: effectiveProvenance === 'unknown' ? 'blocking' : 'warning',
          message: `${recordId} 缺少完整世界观说明、设计职责或数值档位。`,
        });
      }

      rows.push({
        datasetId: policy.id,
        recordId,
        name: recordName(item, recordId),
        runtimePools: policy.runtimePools,
        effectiveProvenance,
        sourceMethod,
        worldviewNote: review?.worldviewNote || '',
        designRole: review?.designRole || '',
        balanceTier: review?.balanceTier || '',
        issues,
      });
    }
  }

  const byProvenance = rows.reduce((acc, row) => {
    acc[row.effectiveProvenance] = (acc[row.effectiveProvenance] || 0) + 1;
    return acc;
  }, {} as Record<GuUseProvenance, number>);
  const issueRows = rows.flatMap(row => row.issues);

  return {
    rows,
    summary: {
      totalRecords: rows.length,
      byProvenance,
      blockingCount: issueRows.filter(issue => issue.severity === 'blocking').length,
      warningCount: issueRows.filter(issue => issue.severity === 'warning').length,
    },
  };
}

export function auditTrainingGroundMetadata(): ProvenanceGateIssue[] {
  const metaTotal = Number((trainingGroundsRaw as any)._meta?.totalGrounds);
  const actualTotal = Array.isArray((trainingGroundsRaw as any).grounds)
    ? (trainingGroundsRaw as any).grounds.length
    : 0;
  if (metaTotal === actualTotal) return [];
  return [{
    id: 'training-grounds:totalGrounds',
    severity: 'blocking',
    message: `training-grounds.json _meta.totalGrounds=${metaTotal}，实际 grounds=${actualTotal}。`,
  }];
}

export function auditAuctionRuntimePoolProvenance(turn = 40): ProvenanceGateIssue[] {
  const issues: ProvenanceGateIssue[] = [];
  const materialPool = generateMaterialPool([], turn);
  const recipePool = generateRecipePool([], turn);
  const killerMovePool = generateKillerMovePool([], turn);
  const rarePool = generateRareTradePool([], turn);
  const immortalGuPool = generateAuctionPool([], turn);

  for (const item of materialPool) {
    if (!getMaterialEntry(item.name) && !resolveMaterialAlias(item.name)) {
      issues.push({
        id: `auction-material:${item.name}`,
        severity: 'blocking',
        message: `${item.name} 未登记在 MaterialRegistry，不能进入宝黄天仙材池。`,
      });
    }
    if (!item.currentBid || item.currentBid <= 0) {
      issues.push({ id: `auction-material:${item.name}`, severity: 'blocking', message: `${item.name} 缺少有效竞价。` });
    }
  }

  for (const item of recipePool) {
    if (!item.id || !item.targetGu || item.currentBid <= 0) {
      issues.push({ id: `auction-recipe:${item.id || item.name}`, severity: 'blocking', message: `${item.name} 蛊方池缺少目标、ID或有效价格。` });
    }
  }

  for (const item of killerMovePool) {
    if (!isRuntimePathAllowed(item.path)) {
      issues.push({ id: `auction-killer-move:${item.name}`, severity: 'blocking', message: `${item.name} 使用未确认运行时流派 ${item.path}。` });
    }
    if (item.currentBid <= 0) {
      issues.push({ id: `auction-killer-move:${item.name}`, severity: 'blocking', message: `${item.name} 缺少有效竞价。` });
    }
  }

  for (const item of rarePool) {
    if (!isRuntimePathAllowed(item.path)) {
      issues.push({ id: `auction-rare:${item.name}`, severity: 'blocking', message: `${item.name} 使用未确认运行时流派 ${item.path}。` });
    }
    if (!item.runtimeEffect || item.currentBid <= 0) {
      issues.push({ id: `auction-rare:${item.name}`, severity: 'blocking', message: `${item.name} 缺少线索闸门或有效价格。` });
    }
  }

  for (const item of immortalGuPool) {
    if (!isRuntimePathAllowed(item.path)) {
      issues.push({ id: `auction-immortal-gu:${item.name}`, severity: 'blocking', message: `${item.name} 使用未确认运行时流派 ${item.path}。` });
    }
    if (item.currentBid <= 0) {
      issues.push({ id: `auction-immortal-gu:${item.name}`, severity: 'blocking', message: `${item.name} 缺少有效竞价。` });
    }
  }

  return issues;
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
