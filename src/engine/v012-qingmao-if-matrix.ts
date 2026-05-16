import qingmaoLowRankIfMatrixRaw from '../canon/qingmao-low-rank-if-matrix.json';

export type QingmaoDeviationLevel =
  | 'blocked'
  | 'rumor_only'
  | 'precondition_required'
  | 'minor_deviation'
  | 'major_deviation_candidate'
  | string;

export interface QingmaoIfAxis {
  id: string;
  description: string;
  relatedAnchorIds: string[];
  defaultDeviationLevel: QingmaoDeviationLevel;
  allowedWrites: string[];
  forbiddenWrites: string[];
  deepSeekAllowed: string[];
  deepSeekForbidden: string[];
}

export interface QingmaoIfRuleMatcher {
  targetRefs?: string[];
  intentTypes?: string[];
  rawTextIncludesAny?: string[];
}

export interface QingmaoIfRule {
  id: string;
  priority: number;
  title: string;
  matcher: QingmaoIfRuleMatcher;
  axisIds: string[];
  anchorIds: string[];
  factCardIds: string[];
  hiddenFactRefIds: string[];
  deviationLevel: QingmaoDeviationLevel;
  costTypes: string[];
  requiredPreconditions: string[];
  allowedOutcome: string;
  forbiddenWrites: string[];
  playerFacingResult: string;
}

export interface QingmaoIfAdjudicationPreview {
  matched: boolean;
  ruleId: string | null;
  deviationLevel: QingmaoDeviationLevel | null;
  axisIds: string[];
  anchorIds: string[];
  factCardIds: string[];
  hiddenFactRefIds: string[];
  costTypes: string[];
  requiredPreconditions: string[];
  allowedOutcome: string | null;
  forbiddenWrites: string[];
  playerFacingResult: string | null;
}

interface QingmaoIfMatrixFile {
  version: string;
  status: string;
  axes: QingmaoIfAxis[];
  rules: QingmaoIfRule[];
}

const qingmaoIfMatrix = qingmaoLowRankIfMatrixRaw as QingmaoIfMatrixFile;
const axesById = new Map<string, QingmaoIfAxis>(qingmaoIfMatrix.axes.map(axis => [axis.id, axis]));
const rulesById = new Map<string, QingmaoIfRule>(qingmaoIfMatrix.rules.map(rule => [rule.id, rule]));

function cloneAxis(axis: QingmaoIfAxis): QingmaoIfAxis {
  return {
    ...axis,
    relatedAnchorIds: [...axis.relatedAnchorIds],
    allowedWrites: [...axis.allowedWrites],
    forbiddenWrites: [...axis.forbiddenWrites],
    deepSeekAllowed: [...axis.deepSeekAllowed],
    deepSeekForbidden: [...axis.deepSeekForbidden],
  };
}

function cloneRule(rule: QingmaoIfRule): QingmaoIfRule {
  return {
    ...rule,
    matcher: {
      targetRefs: rule.matcher.targetRefs ? [...rule.matcher.targetRefs] : undefined,
      intentTypes: rule.matcher.intentTypes ? [...rule.matcher.intentTypes] : undefined,
      rawTextIncludesAny: rule.matcher.rawTextIncludesAny ? [...rule.matcher.rawTextIncludesAny] : undefined,
    },
    axisIds: [...rule.axisIds],
    anchorIds: [...rule.anchorIds],
    factCardIds: [...rule.factCardIds],
    hiddenFactRefIds: [...rule.hiddenFactRefIds],
    costTypes: [...rule.costTypes],
    requiredPreconditions: [...rule.requiredPreconditions],
    forbiddenWrites: [...rule.forbiddenWrites],
  };
}

function normalized(value: string | undefined): string {
  return (value || '').replace(/\s+/g, '').toLocaleLowerCase();
}

function matcherHits(rule: QingmaoIfRule, input: {
  rawText?: string;
  targetRef?: string;
  intentType?: string;
}): boolean {
  const targetHit = !!input.targetRef && !!rule.matcher.targetRefs?.includes(input.targetRef);
  const intentHit = !!input.intentType && !!rule.matcher.intentTypes?.includes(input.intentType);
  const text = normalized(input.rawText);
  const textHit = !!text && !!rule.matcher.rawTextIncludesAny?.some(term => text.includes(normalized(term)));
  return targetHit || intentHit || textHit;
}

export function listQingmaoLowRankIfAxes(): QingmaoIfAxis[] {
  return qingmaoIfMatrix.axes.map(cloneAxis);
}

export function getQingmaoLowRankIfAxis(id: string): QingmaoIfAxis | null {
  const axis = axesById.get(id);
  return axis ? cloneAxis(axis) : null;
}

export function listQingmaoLowRankIfRules(): QingmaoIfRule[] {
  return qingmaoIfMatrix.rules.map(cloneRule);
}

export function getQingmaoLowRankIfRule(id: string): QingmaoIfRule | null {
  const rule = rulesById.get(id);
  return rule ? cloneRule(rule) : null;
}

export function matchQingmaoLowRankIfRules(input: {
  rawText?: string;
  targetRef?: string;
  intentType?: string;
}): QingmaoIfRule[] {
  return qingmaoIfMatrix.rules
    .filter(rule => matcherHits(rule, input))
    .sort((a, b) => b.priority - a.priority)
    .map(cloneRule);
}

export function previewQingmaoLowRankIfAdjudication(input: {
  rawText?: string;
  targetRef?: string;
  intentType?: string;
}): QingmaoIfAdjudicationPreview {
  const [rule] = matchQingmaoLowRankIfRules(input);

  if (!rule) {
    return {
      matched: false,
      ruleId: null,
      deviationLevel: null,
      axisIds: [],
      anchorIds: [],
      factCardIds: [],
      hiddenFactRefIds: [],
      costTypes: [],
      requiredPreconditions: [],
      allowedOutcome: null,
      forbiddenWrites: [],
      playerFacingResult: null,
    };
  }

  return {
    matched: true,
    ruleId: rule.id,
    deviationLevel: rule.deviationLevel,
    axisIds: [...rule.axisIds],
    anchorIds: [...rule.anchorIds],
    factCardIds: [...rule.factCardIds],
    hiddenFactRefIds: [...rule.hiddenFactRefIds],
    costTypes: [...rule.costTypes],
    requiredPreconditions: [...rule.requiredPreconditions],
    allowedOutcome: rule.allowedOutcome,
    forbiddenWrites: [...rule.forbiddenWrites],
    playerFacingResult: rule.playerFacingResult,
  };
}
