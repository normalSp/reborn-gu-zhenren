import qingmaoCanonAnchorsRaw from '../canon/qingmao-canon-anchors.json';

export type QingmaoCanonAnchorType =
  | 'fixed_context'
  | 'resource_loop'
  | 'if_window'
  | 'pressure_chain'
  | 'hidden_guard'
  | string;

export interface QingmaoCanonAnchor {
  id: string;
  title: string;
  stage: string;
  anchorType: QingmaoCanonAnchorType;
  canonStatus: string;
  visibility: string;
  factCardIds: string[];
  playerVisibleFactIds: string[];
  hiddenFactRefIds: string[];
  ifDeviationPointIds: string[];
  lowRankIfAxes: string[];
  allowedPlayerLevers: string[];
  protectedOutcomes: string[];
  deepSeekAllowed: string[];
  deepSeekForbidden: string[];
  nextPhaseUse: string;
}

export interface QingmaoCanonAnchorPromptContext {
  anchors: Array<{
    id: string;
    title: string;
    anchorType: QingmaoCanonAnchorType;
    canonStatus: string;
    playerVisibleFactIds: string[];
    ifDeviationPointIds: string[];
    lowRankIfAxes: string[];
    allowedPlayerLevers: string[];
    protectedOutcomes: string[];
    deepSeekAllowed: string[];
    deepSeekForbidden: string[];
  }>;
  hiddenGuards: Array<{
    anchorId: string;
    guard: 'hidden_ref_only';
    hiddenFactRefIds: string[];
    protectedOutcomes: string[];
    deepSeekForbidden: string[];
  }>;
}

interface QingmaoCanonAnchorFile {
  version: string;
  status: string;
  allowedLowRankIfAxes: string[];
  forbiddenHighLevelAxes: string[];
  anchors: QingmaoCanonAnchor[];
}

const qingmaoCanonAnchors = qingmaoCanonAnchorsRaw as QingmaoCanonAnchorFile;
const anchorsById = new Map<string, QingmaoCanonAnchor>(
  qingmaoCanonAnchors.anchors.map(anchor => [anchor.id, anchor]),
);

function cloneAnchor(anchor: QingmaoCanonAnchor): QingmaoCanonAnchor {
  return {
    ...anchor,
    factCardIds: [...anchor.factCardIds],
    playerVisibleFactIds: [...anchor.playerVisibleFactIds],
    hiddenFactRefIds: [...anchor.hiddenFactRefIds],
    ifDeviationPointIds: [...anchor.ifDeviationPointIds],
    lowRankIfAxes: [...anchor.lowRankIfAxes],
    allowedPlayerLevers: [...anchor.allowedPlayerLevers],
    protectedOutcomes: [...anchor.protectedOutcomes],
    deepSeekAllowed: [...anchor.deepSeekAllowed],
    deepSeekForbidden: [...anchor.deepSeekForbidden],
  };
}

function uniqueExistingAnchorIds(ids: string[]): string[] {
  return [...new Set(ids)].filter(id => anchorsById.has(id));
}

export function listQingmaoCanonAnchors(): QingmaoCanonAnchor[] {
  return qingmaoCanonAnchors.anchors.map(cloneAnchor);
}

export function getQingmaoCanonAnchor(id: string): QingmaoCanonAnchor | null {
  const anchor = anchorsById.get(id);
  return anchor ? cloneAnchor(anchor) : null;
}

export function listQingmaoCanonAnchorsForFactCard(factCardId: string): QingmaoCanonAnchor[] {
  return qingmaoCanonAnchors.anchors
    .filter(anchor => anchor.factCardIds.includes(factCardId))
    .map(cloneAnchor);
}

export function getQingmaoAllowedLowRankIfAxes(): string[] {
  return [...qingmaoCanonAnchors.allowedLowRankIfAxes];
}

export function getQingmaoForbiddenHighLevelAxes(): string[] {
  return [...qingmaoCanonAnchors.forbiddenHighLevelAxes];
}

export function buildQingmaoCanonAnchorPromptContext(input: {
  anchorIds?: string[];
  factCardIds?: string[];
} = {}): QingmaoCanonAnchorPromptContext {
  const idsFromFacts = (input.factCardIds || []).flatMap(factCardId =>
    qingmaoCanonAnchors.anchors
      .filter(anchor => anchor.factCardIds.includes(factCardId))
      .map(anchor => anchor.id),
  );
  const requestedAnchorIds = input.anchorIds?.length
    ? uniqueExistingAnchorIds(input.anchorIds)
    : uniqueExistingAnchorIds(idsFromFacts);
  const selectedAnchors = (requestedAnchorIds.length
    ? requestedAnchorIds.map(id => anchorsById.get(id)!)
    : qingmaoCanonAnchors.anchors);

  return {
    anchors: selectedAnchors.map(anchor => ({
      id: anchor.id,
      title: anchor.title,
      anchorType: anchor.anchorType,
      canonStatus: anchor.canonStatus,
      playerVisibleFactIds: [...anchor.playerVisibleFactIds],
      ifDeviationPointIds: [...anchor.ifDeviationPointIds],
      lowRankIfAxes: [...anchor.lowRankIfAxes],
      allowedPlayerLevers: [...anchor.allowedPlayerLevers],
      protectedOutcomes: [...anchor.protectedOutcomes],
      deepSeekAllowed: [...anchor.deepSeekAllowed],
      deepSeekForbidden: [...anchor.deepSeekForbidden],
    })),
    hiddenGuards: selectedAnchors
      .filter(anchor => anchor.hiddenFactRefIds.length > 0)
      .map(anchor => ({
        anchorId: anchor.id,
        guard: 'hidden_ref_only',
        hiddenFactRefIds: [...anchor.hiddenFactRefIds],
        protectedOutcomes: [...anchor.protectedOutcomes],
        deepSeekForbidden: [...anchor.deepSeekForbidden],
      })),
  };
}
