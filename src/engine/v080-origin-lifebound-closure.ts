import originProfilesRaw from '../canon/v080-origin-deep-line-profiles.json';
import lifeboundProfilesRaw from '../canon/v080-lifebound-gu-growth-profiles.json';
import frontMidAnchorMapRaw from '../canon/v080-front-mid-anchor-map.json';
import startProfilesRaw from '../canon/start-profiles.json';
import canonAnchorRegistryRaw from '../canon/canon-anchor-registry.json';
import type {
  FrontMidgameAnchorMapping,
  GuInstance,
  LifeboundGuGrowthProfile,
  LifeboundGuOperation,
  LifeboundGuOperationValidation,
  OriginDeepLineProfile,
} from '../types';

const originProfiles = (originProfilesRaw as any).profiles as OriginDeepLineProfile[];
const lifeboundProfiles = (lifeboundProfilesRaw as any).profiles as LifeboundGuGrowthProfile[];
const frontMidAnchorMap = (frontMidAnchorMapRaw as any).entries as FrontMidgameAnchorMapping[];
const operationPolicy = (lifeboundProfilesRaw as any).ordinaryOperationPolicy as Record<LifeboundGuOperation, 'allow' | 'block'>;
const startProfiles = (startProfilesRaw as any).profiles as Array<{ id: string; factionName?: string; playerFactionRole?: string; startChapterId?: string }>;
const canonAnchorIds = new Set(((canonAnchorRegistryRaw as any).anchors || []).map((anchor: any) => anchor.id).filter(Boolean));
const startProfileIds = new Set(startProfiles.map(profile => profile.id));

function ensureArray<T>(value: T[] | undefined | null): T[] {
  return Array.isArray(value) ? value : [];
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function selectedStartProfileId(store: any): string {
  return String(
    store?.flags?._start_profile ||
    store?.selectedStartProfileId ||
    store?.startProfileId ||
    store?.profile?.startProfileId ||
    '',
  );
}

function currentLifeboundGu(store: any): Partial<GuInstance> | null {
  const info = store?.lifeboundGuInfo || store?.lifeboundGu || null;
  const guId = info?.guId || info?.id;
  const byId = [
    ...(Array.isArray(store?.inventory) ? store.inventory : []),
    ...(Array.isArray(store?.apertureInventory?.gu) ? store.apertureInventory.gu : []),
  ].find((gu: any) => gu?.id && gu.id === guId);
  if (byId) return byId;
  if (info?.guName || info?.name) {
    return {
      id: guId,
      name: info.guName || info.name,
      path: info.path,
      tier: info.tier,
      bonded: true,
    };
  }
  return null;
}

export function getOriginDeepLineProfiles(): OriginDeepLineProfile[] {
  return originProfiles;
}

export function getFrontMidgameAnchorMappings(): FrontMidgameAnchorMapping[] {
  return frontMidAnchorMap;
}

export function getLifeboundGuGrowthProfiles(): LifeboundGuGrowthProfile[] {
  return lifeboundProfiles;
}

export function resolveOriginDeepLineProfileByStartProfile(startProfileId?: string | null): OriginDeepLineProfile | null {
  if (!startProfileId) return null;
  return originProfiles.find(profile => profile.startProfileIds.includes(startProfileId)) || null;
}

export function resolveOriginDeepLineProfile(storeOrStartProfileId: any): OriginDeepLineProfile | null {
  if (typeof storeOrStartProfileId === 'string') {
    return resolveOriginDeepLineProfileByStartProfile(storeOrStartProfileId);
  }
  return resolveOriginDeepLineProfileByStartProfile(selectedStartProfileId(storeOrStartProfileId));
}

export function validateOriginDeepLineCoverage(): string[] {
  const issues: string[] = [];
  const covered = new Map<string, string[]>();
  for (const profile of originProfiles) {
    for (const startProfileId of profile.startProfileIds) {
      if (!startProfileIds.has(startProfileId)) {
        issues.push(`OriginDeepLineProfile ${profile.id} references unknown StartProfile ${startProfileId}`);
      }
      covered.set(startProfileId, [...(covered.get(startProfileId) || []), profile.id]);
    }
    for (const access of profile.canonAnchorAccess || []) {
      if (!canonAnchorIds.has(access.anchorId)) {
        issues.push(`OriginDeepLineProfile ${profile.id} references unknown canon anchor ${access.anchorId}`);
      }
    }
  }
  for (const startProfile of startProfiles) {
    const owners = covered.get(startProfile.id) || [];
    if (owners.length === 0) issues.push(`StartProfile ${startProfile.id} has no OriginDeepLineProfile`);
    if (owners.length > 1) issues.push(`StartProfile ${startProfile.id} is claimed by multiple OriginDeepLineProfiles: ${owners.join(', ')}`);
  }
  return issues;
}

export function resolveFrontMidgameAnchorMapping(input: {
  chapterId?: string | null;
  startProfileId?: string | null;
  canonAnchorId?: string | null;
}): FrontMidgameAnchorMapping | null {
  const chapterId = String(input.chapterId || '');
  const startProfileId = String(input.startProfileId || '');
  const canonAnchorId = String(input.canonAnchorId || '');
  if (canonAnchorId) {
    const byCanon = frontMidAnchorMap.find(mapping => mapping.canonAnchorId === canonAnchorId);
    if (byCanon) return byCanon;
  }
  if (chapterId) {
    const byChapter = frontMidAnchorMap.find(mapping => mapping.chapterIds.includes(chapterId));
    if (byChapter) return byChapter;
  }
  if (startProfileId) {
    const byStart = frontMidAnchorMap.find(mapping => mapping.startProfileIds.includes(startProfileId));
    if (byStart) return byStart;
  }
  return null;
}

export function validateFrontMidgameAnchorCoverage(): string[] {
  const issues: string[] = [];
  const seen = new Set<string>();
  for (const mapping of frontMidAnchorMap) {
    if (seen.has(mapping.id)) issues.push(`Duplicate front/mid anchor mapping id ${mapping.id}`);
    seen.add(mapping.id);
    if (!canonAnchorIds.has(mapping.canonAnchorId)) {
      issues.push(`FrontMidgameAnchorMapping ${mapping.id} references unknown canon anchor ${mapping.canonAnchorId}`);
    }
    for (const startProfileId of mapping.startProfileIds || []) {
      if (!startProfileIds.has(startProfileId)) {
        issues.push(`FrontMidgameAnchorMapping ${mapping.id} references unknown StartProfile ${startProfileId}`);
      }
    }
  }
  return issues;
}

export function getLifeboundGuGrowthProfile(input?: Partial<GuInstance> | null): LifeboundGuGrowthProfile | null {
  if (!input) return lifeboundProfiles.find(profile => profile.id === 'lifebound_default_mortal') || null;
  const guName = String(input.name || input.customName || '');
  const path = String(input.path || '');
  const byName = lifeboundProfiles.find(profile => ensureArray(profile.matchGuNames).includes(guName));
  if (byName) return byName;
  const byPath = lifeboundProfiles.find(profile => ensureArray(profile.matchPaths).includes(path));
  if (byPath) return byPath;
  return lifeboundProfiles.find(profile => profile.id === 'lifebound_default_mortal') || null;
}

export function validateLifeboundGuOperation(store: any, guIdOrName: string, operation: LifeboundGuOperation): LifeboundGuOperationValidation {
  const lifeboundInfo = store?.lifeboundGuInfo || store?.lifeboundGu || null;
  const lifeboundGu = currentLifeboundGu(store);
  const target = String(guIdOrName || '');
  const isLifebound = Boolean(lifeboundInfo) && (
    lifeboundInfo?.guId === target ||
    lifeboundInfo?.id === target ||
    lifeboundInfo?.guName === target ||
    lifeboundInfo?.name === target ||
    lifeboundGu?.id === target ||
    lifeboundGu?.name === target
  );
  const profile = getLifeboundGuGrowthProfile(lifeboundGu);
  if (!isLifebound) {
    return { allowed: true, operation, reason: '目标不是本命蛊。', profile };
  }
  if (operationPolicy[operation] === 'block') {
    return {
      allowed: false,
      operation,
      reason: `${lifeboundInfo?.guName || lifeboundGu?.name || '本命蛊'}已进入本命蛊成长协议，不能被普通${operation}逻辑处理。`,
      profile,
    };
  }
  return { allowed: true, operation, reason: '本命蛊操作允许，但需保留成长与反噬记录。', profile };
}

export function sanitizeOriginIdentityText(text: string, store: any): { text: string; changed: boolean; detail?: string; profile?: OriginDeepLineProfile | null } {
  const profile = resolveOriginDeepLineProfile(store);
  if (!profile || !text) return { text, changed: false, profile };
  let next = text;
  const hits: string[] = [];
  for (const claim of profile.forbiddenIdentityClaims || []) {
    if (!claim || !next.includes(claim)) continue;
    const pattern = new RegExp(escapeRegExp(claim), 'g');
    next = next.replace(pattern, profile.replacementIdentity);
    hits.push(claim);
  }
  if (hits.length === 0) return { text, changed: false, profile };
  return {
    text: next,
    changed: true,
    profile,
    detail: `开局出身为${profile.displayName}，AI 不得把玩家写成 ${hits.join('/')}，已降级为「${profile.replacementIdentity}」。`,
  };
}

export function buildOriginLifeboundContextForPrompt(store: any): string {
  const startProfileId = selectedStartProfileId(store);
  const origin = resolveOriginDeepLineProfileByStartProfile(startProfileId);
  const currentAnchor = resolveFrontMidgameAnchorMapping({
    chapterId: store?.currentChapterId || store?.flags?.currentChapterId || store?.chapterId,
    startProfileId,
    canonAnchorId: store?.storyAnchorState?.currentAnchorId || store?.currentCanonAnchorId,
  });
  const lifeboundGu = currentLifeboundGu(store);
  const lifeboundProfile = getLifeboundGuGrowthProfile(lifeboundGu);
  const lines: string[] = ['[v0.8.0-c1.2 出身深线 / 本命蛊协议]'];
  if (origin) {
    lines.push(`- 当前出身：${origin.displayName}（${origin.id}）。身份边界：${origin.identityBoundary}`);
    lines.push(`- 初始压力：${origin.initialPressure.slice(0, 3).join(' / ')}；长期压力：${origin.longTermPressure.slice(0, 3).join(' / ')}`);
    lines.push(`- 资源入口只能从：${origin.resourceEntrances.slice(0, 4).join(' / ')} 解释，跨出身身份、无门槛资源、关键正史改写必须降级。`);
    lines.push(`- IF偏移代价：${origin.ifDeviationCosts.slice(0, 4).join(' / ')}。`);
  } else {
    lines.push('- 当前没有登记出身深线，AI 不得自行赋予大族嫡系、天庭核心或正史核心人物身份。');
  }
  if (currentAnchor) {
    lines.push(`- 当前前中期锚点：${currentAnchor.displayName}（${currentAnchor.canonAnchorId}）。正史边界：${currentAnchor.modeBoundaries.canon}`);
    lines.push(`- 禁止改写：${currentAnchor.forbiddenRewrites.slice(0, 3).join(' / ')}。`);
  }
  if (lifeboundGu && lifeboundProfile) {
    lines.push(`- 本命蛊：${lifeboundGu.name || '未命名'}；成长协议：${lifeboundProfile.displayName}（${lifeboundProfile.id}）。`);
    lines.push(`- 本命蛊不可被普通出售、移除、拆炼、升炼；只可喂养或按场景使用。风险：${lifeboundProfile.riskTags.join(' / ')}。`);
  } else {
    lines.push('- 暂无本命蛊；若出现本命蛊选择，只能作为候选和风险提示，不能把普通背包蛊虫自动改成本命蛊。');
  }
  return lines.join('\n');
}

export function buildOriginEndingEvidence(store: any): {
  background: string;
  debtLabels: string[];
  profileId?: string;
  profileName?: string;
  provenance?: OriginDeepLineProfile['provenance'];
  identityBoundary?: string;
  initialPressure?: string[];
  longTermPressure?: string[];
  anchorAccess?: OriginDeepLineProfile['canonAnchorAccess'];
  ifDeviationCosts?: string[];
} {
  const origin = resolveOriginDeepLineProfile(store);
  if (!origin) {
    return {
      background: store?.profile?.background || store?.selectedOriginId || '未登记出身',
      debtLabels: [],
    };
  }
  return {
    background: origin.displayName,
    debtLabels: origin.endingDebtLabels,
    profileId: origin.id,
    profileName: origin.displayName,
    provenance: origin.provenance,
    identityBoundary: origin.identityBoundary,
    initialPressure: origin.initialPressure,
    longTermPressure: origin.longTermPressure,
    anchorAccess: origin.canonAnchorAccess,
    ifDeviationCosts: origin.ifDeviationCosts,
  };
}

export function buildLifeboundEndingEvidence(store: any): {
  guName?: string;
  hasPenalty: boolean;
  profileId?: string;
  profileName?: string;
  growthStage?: string;
  riskTags?: string[];
  endingWeights?: Record<string, number>;
} {
  const lifeboundGu = currentLifeboundGu(store);
  const profile = getLifeboundGuGrowthProfile(lifeboundGu);
  const info = store?.lifeboundGuInfo || store?.lifeboundGu || null;
  return {
    guName: lifeboundGu?.name || info?.guName || info?.name,
    hasPenalty: Boolean(store?.lifeboundDeathPenalty),
    profileId: lifeboundGu && profile ? profile.id : undefined,
    profileName: lifeboundGu && profile ? profile.displayName : undefined,
    growthStage: lifeboundGu && profile ? profile.growthStages?.[Math.min(Number(info?.upgradeCount || 0), profile.growthStages.length - 1)]?.label : undefined,
    riskTags: lifeboundGu && profile ? profile.riskTags : undefined,
    endingWeights: lifeboundGu && profile ? profile.endingWeights : undefined,
  };
}
