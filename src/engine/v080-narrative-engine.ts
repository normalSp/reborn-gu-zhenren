import anchorRegistryRaw from '../canon/canon-anchor-registry.json';
import branchMatrixRaw from '../canon/fate-branch-matrix.json';
import heavenWillRulesRaw from '../canon/heaven-will-rules.json';
import endingOutcomesRaw from '../canon/ending-outcomes.json';
import type {
  CanonAnchor,
  CanonAnchorPressure,
  EndingOutcome,
  EndingResolverInput,
  FateState,
  HeavenWillLedger,
  HeavenWillTrigger,
  IfBranchAxis,
  IfBranchCandidate,
  IfBranchVector,
  TimelineMode,
} from '../types';

const anchorRegistry = anchorRegistryRaw as { anchors: CanonAnchor[] };
const branchMatrix = branchMatrixRaw as any;
const heavenWillRules = heavenWillRulesRaw as any;
const endingOutcomes = endingOutcomesRaw as any;

const VALID_AXES = new Set<IfBranchAxis>(
  (branchMatrix.axes || []).map((axis: any) => axis.id),
);

export function getCanonAnchors(): CanonAnchor[] {
  return anchorRegistry.anchors;
}

export function getCanonAnchor(anchorId: string): CanonAnchor | undefined {
  return anchorRegistry.anchors.find(anchor => anchor.id === anchorId);
}

export function getInitialHeavenWillLedger(): HeavenWillLedger {
  const initial = heavenWillRules.initialLedger || {};
  return {
    attention: Number(initial.attention || 0),
    correction: Number(initial.correction || 0),
    rejection: Number(initial.rejection || 0),
    ambiguity: Number(initial.ambiguity || 20),
    lastTriggers: [],
  };
}

export function inferFateState(fateIntegrity: number): FateState {
  if (fateIntegrity <= 0) return 'destroyed';
  if (fateIntegrity < 70) return 'fractured';
  return 'intact';
}

export function validateAnchorMutation(
  mode: TimelineMode,
  anchorId: string,
  attemptedMutation: string,
): CanonAnchorPressure {
  const anchor = getCanonAnchor(anchorId);
  if (!anchor) {
    return {
      anchorId,
      pressure: 100,
      reason: '未知剧情锚点，不能让 AI 或剧情文本直接改写。',
      attemptedMutation,
      engineDecision: 'block',
      fallbackNarrativeHint: '将该内容转为传闻或候选线索，等待 canon 注册。',
    };
  }

  const mutation = attemptedMutation.toLowerCase();
  const forbidden = anchor.forbiddenMutationsCanon.some(item =>
    mutation.includes(item.toLowerCase()) || attemptedMutation.includes(item),
  );

  if (mode === 'canon' && (anchor.canonStatus === 'fixed' || forbidden)) {
    return {
      anchorId,
      pressure: forbidden ? 100 : 82,
      reason: `正史模式保护固定锚点「${anchor.displayName}」。`,
      attemptedMutation,
      engineDecision: forbidden ? 'block' : 'redirect',
      fallbackNarrativeHint: anchor.allowedVariationsCanon[0] || '改为旁支参与或局部变体。',
    };
  }

  if (mode === 'canon' && anchor.canonStatus === 'flexible') {
    return {
      anchorId,
      pressure: 38,
      reason: `正史模式允许「${anchor.displayName}」的局部变体，但不得抢夺核心因果。`,
      attemptedMutation,
      engineDecision: 'allow_local_variation',
      fallbackNarrativeHint: anchor.allowedVariationsCanon[0] || '保留为局部剧情变化。',
    };
  }

  return {
    anchorId,
    pressure: anchor.canonStatus === 'fixed' ? 55 : 25,
    reason: `IF 模式允许「${anchor.displayName}」产生偏移，但必须写入 IfBranchVector 并承担代价。`,
    attemptedMutation,
    engineDecision: 'allow_local_variation',
    fallbackNarrativeHint: '将偏移登记为 IF 候选，等待引擎校验。',
  };
}

export function validateIfBranchCandidate(
  candidate: IfBranchCandidate,
  mode: TimelineMode,
): { accepted: boolean; issues: string[]; vector?: IfBranchVector } {
  const issues: string[] = [];
  const anchor = getCanonAnchor(candidate.anchorId);

  if (mode !== 'if') {
    issues.push('正史模式不能接受 IF 分支候选。');
  }
  if (!anchor) {
    issues.push(`未知锚点：${candidate.anchorId}`);
  }
  if (!VALID_AXES.has(candidate.axis)) {
    issues.push(`未知 IF 分支轴：${candidate.axis}`);
  }
  if (anchor && !anchor.ifDeviationAxes.includes(candidate.axis)) {
    issues.push(`锚点「${anchor.displayName}」不允许 ${candidate.axis} 偏移。`);
  }
  if (!Number.isFinite(candidate.proposedDelta) || Math.abs(candidate.proposedDelta) > 100) {
    issues.push('分支偏移值必须在 -100 到 100 之间。');
  }

  if (issues.length > 0 || !anchor) {
    return { accepted: false, issues };
  }

  return {
    accepted: true,
    issues: [],
    vector: {
      id: candidate.id || `if_${candidate.anchorId}_${candidate.axis}_${Date.now()}`,
      anchorId: candidate.anchorId,
      axis: candidate.axis,
      delta: candidate.proposedDelta,
      cause: candidate.summary,
      cost: candidate.costHint,
      downstreamImpact: candidate.downstreamHint || [],
      provenance: 'if-derived',
      createdTurn: 0,
    },
  };
}

export function applyHeavenWillTrigger(
  ledger: HeavenWillLedger,
  trigger: HeavenWillTrigger,
): HeavenWillLedger {
  const rule = heavenWillRules.triggers?.[trigger.kind] || {};
  const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));
  return {
    attention: clamp(ledger.attention + Number(rule.attention || 0) + trigger.delta),
    correction: clamp(ledger.correction + Number(rule.correction || 0)),
    rejection: clamp(ledger.rejection + Number(rule.rejection || 0)),
    ambiguity: clamp(ledger.ambiguity),
    lastTriggers: [trigger, ...(ledger.lastTriggers || [])].slice(0, 8),
  };
}

function getFamily(id: string): any {
  return (endingOutcomes.families || []).find((family: any) => family.id === id) || endingOutcomes.families?.[0];
}

export function resolveEnding(input: EndingResolverInput): EndingOutcome {
  const reasons: string[] = [];
  let familyId = 'canon_near';

  if (!input.playerSurvived) {
    familyId = 'death_and_dust';
    reasons.push('玩家未能存活到终局。');
  } else if (input.ifBranchVectors.some(vector => vector.axis === 'protect_fate' && vector.delta > 0) && input.fateState === 'intact') {
    familyId = 'fate_intact_order';
    reasons.push('护宿命分支占优，宿命仍保持完整。');
  } else if (input.fateState === 'destroyed') {
    familyId = 'fate_destroyed_struggle';
    reasons.push('宿命破碎，自由时代开启。');
  } else if (input.fateState === 'fractured') {
    familyId = 'fate_fractured_chaos';
    reasons.push('宿命出现裂痕但未完全破碎。');
  }

  if (input.playerSurvived && input.playerFactionScore >= 75) {
    familyId = 'player_faction_foothold';
    reasons.push('玩家势力已达到终局立足门槛。');
  }

  const chaosPressure =
    input.heavenWillLedger.attention +
    (input.karmicDebtLedger.byKind?.chaos_contact || 0) +
    (input.ifBranchVectors.some(vector => vector.axis === 'venerable_balance') ? 15 : 0);
  if (input.playerSurvived && chaosPressure >= 100) {
    familyId = 'crazed_demon_unproven';
    reasons.push('玩家接触混沌、疯魔或尊者求证线索，但未证明永生。');
  }

  const family = getFamily(familyId);
  const forbidden = endingOutcomes.forbiddenAssertions || [];
  const text = `${family?.displayName || ''} ${family?.summary || ''}`;
  const forbiddenHit = forbidden.filter((phrase: string) => text.includes(phrase));

  return {
    familyId,
    displayName: family?.displayName || familyId,
    provenance: family?.provenance || 'if-derived',
    summary: family?.summary || '结局待补充。',
    reasons,
    unresolvedWarnings: [
      'v0.8.0 不开放真正永生或炼成永生蛊结局。',
      ...forbiddenHit.map((phrase: string) => `结局文本包含禁止断言：${phrase}`),
    ],
  };
}

export function validateEndingText(text: string): string[] {
  const forbidden = endingOutcomes.forbiddenAssertions || [];
  return forbidden.filter((phrase: string) => text.includes(phrase));
}
