import routeSupplyPursuitRaw from '../canon/qingmao-route-supply-pursuit-pack.json';

export interface QingmaoRouteCandidate {
  id: string;
  title: string;
  routeType: string;
  sourceItemIds: string[];
  sourcePointerIds: string[];
  summary: string;
  entryCondition: string;
  riskTags: string[];
  blockedOutcome: string;
}

export interface QingmaoSupplyRequirement {
  id: string;
  title: string;
  sourceItemIds: string[];
  sourcePointerIds: string[];
  summary: string;
  gapTags: string[];
  blockedOutcome: string;
}

export interface QingmaoPursuitTrigger {
  id: string;
  title: string;
  sourceItemIds: string[];
  sourcePointerIds: string[];
  summary: string;
  trigger: string;
  pressureType: string;
  riskDelta: number;
}

export interface QingmaoRouteSupplyPursuitPlan {
  status: 'preparation_only';
  intakeReviewRef: string;
  routeCandidates: QingmaoRouteCandidate[];
  supplyRequirements: QingmaoSupplyRequirement[];
  pursuitTriggers: QingmaoPursuitTrigger[];
  visibleSourceRefs: string[];
  blockedOutcomes: string[];
  forbiddenWrites: string[];
  deferredItemIds: string[];
  publicSummary: string;
}

interface QingmaoRouteSupplyPursuitPack {
  sourceReview: {
    intakeReview: string;
  };
  boundaries: {
    forbiddenWrites: string[];
    deferredItemIds: string[];
  };
  routeCandidates: QingmaoRouteCandidate[];
  supplyRequirements: QingmaoSupplyRequirement[];
  pursuitTriggers: QingmaoPursuitTrigger[];
}

const pack = routeSupplyPursuitRaw as QingmaoRouteSupplyPursuitPack;

function cloneRoute(route: QingmaoRouteCandidate): QingmaoRouteCandidate {
  return {
    ...route,
    sourceItemIds: [...route.sourceItemIds],
    sourcePointerIds: [...route.sourcePointerIds],
    riskTags: [...route.riskTags],
  };
}

function cloneSupply(supply: QingmaoSupplyRequirement): QingmaoSupplyRequirement {
  return {
    ...supply,
    sourceItemIds: [...supply.sourceItemIds],
    sourcePointerIds: [...supply.sourcePointerIds],
    gapTags: [...supply.gapTags],
  };
}

function clonePursuit(trigger: QingmaoPursuitTrigger): QingmaoPursuitTrigger {
  return {
    ...trigger,
    sourceItemIds: [...trigger.sourceItemIds],
    sourcePointerIds: [...trigger.sourcePointerIds],
  };
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

export function listQingmaoRouteCandidates(): QingmaoRouteCandidate[] {
  return pack.routeCandidates.map(cloneRoute);
}

export function listQingmaoSupplyRequirements(): QingmaoSupplyRequirement[] {
  return pack.supplyRequirements.map(cloneSupply);
}

export function listQingmaoPursuitTriggers(): QingmaoPursuitTrigger[] {
  return pack.pursuitTriggers.map(clonePursuit);
}

export function buildQingmaoRouteSupplyPursuitPlan(): QingmaoRouteSupplyPursuitPlan {
  const routeCandidates = listQingmaoRouteCandidates();
  const supplyRequirements = listQingmaoSupplyRequirements();
  const pursuitTriggers = listQingmaoPursuitTriggers();
  const sourceRefs = unique([
    ...routeCandidates.flatMap(route => route.sourceItemIds.map(id => `mirofish:${id}`)),
    ...supplyRequirements.flatMap(supply => supply.sourceItemIds.map(id => `mirofish:${id}`)),
    ...pursuitTriggers.flatMap(trigger => trigger.sourceItemIds.map(id => `mirofish:${id}`)),
  ]);
  const blockedOutcomes = unique([
    ...routeCandidates.map(route => route.blockedOutcome),
    ...supplyRequirements.map(supply => supply.blockedOutcome),
    '本阶段只生成准备链预览，不开放逃离成功、新地域、奖励、阵营变化、NPC 生死或 DeepSeek 权限。',
  ]);

  return {
    status: 'preparation_only',
    intakeReviewRef: pack.sourceReview.intakeReview,
    routeCandidates,
    supplyRequirements,
    pursuitTriggers,
    visibleSourceRefs: sourceRefs,
    blockedOutcomes,
    forbiddenWrites: [...pack.boundaries.forbiddenWrites],
    deferredItemIds: [...pack.boundaries.deferredItemIds],
    publicSummary: `已汇总 ${routeCandidates.length} 条路线候选、${supplyRequirements.length} 项补给缺口、${pursuitTriggers.length} 个追击触发；当前只用于逃离青茅山准备链。`,
  };
}
