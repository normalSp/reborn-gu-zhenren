import { describe, expect, it } from 'vitest';
import type { EndingResolverInput, IfBranchCandidate } from '../types';
import {
  getCanonAnchor,
  getCanonAnchors,
  getInitialHeavenWillLedger,
  inferFateState,
  resolveEnding,
  validateAnchorMutation,
  validateEndingText,
  validateIfBranchCandidate,
} from './v080-narrative-engine';

function baseEndingInput(overrides: Partial<EndingResolverInput> = {}): EndingResolverInput {
  return {
    gameMode: 'if',
    fateState: 'intact',
    anchorResults: {},
    ifBranchVectors: [],
    heavenWillLedger: getInitialHeavenWillLedger(),
    karmicDebtLedger: { totalDebt: 0, byKind: {}, pendingReturns: [] },
    playerFactionScore: 0,
    fangYuanRelation: 'observed',
    venerableBalance: {},
    daoHeart: { kill: 0, mercy: 0, scheme: 0, ambition: 0 },
    playerSurvived: true,
    ...overrides,
  };
}

describe('v0.8.0 narrative engine gates', () => {
  it('loads ten canon anchors and keeps Fate War as a fixed dual-route anchor', () => {
    const anchors = getCanonAnchors();
    const fateWar = getCanonAnchor('fate_war');

    expect(anchors).toHaveLength(10);
    expect(fateWar?.canonStatus).toBe('fixed');
    expect(fateWar?.ifDeviationAxes).toContain('protect_fate');
    expect(fateWar?.ifDeviationAxes).toContain('break_fate');
  });

  it('blocks direct Fate Gu rewrites in canon mode', () => {
    const pressure = validateAnchorMutation('canon', 'fate_war', '玩家获得宿命蛊并替代方源改写宿命战');

    expect(pressure.engineDecision).toBe('block');
    expect(pressure.pressure).toBeGreaterThanOrEqual(80);
  });

  it('accepts IF branch candidates only in IF mode', () => {
    const candidate: IfBranchCandidate = {
      anchorId: 'fate_war',
      axis: 'protect_fate',
      proposedDelta: 45,
      summary: '玩家选择站到天庭秩序一侧，试图护住宿命。',
      costHint: '自由阵营仇恨增加，方源关系恶化。',
      downstreamHint: ['宿命战立场改变', '天意注视增强'],
    };

    const canonVerdict = validateIfBranchCandidate(candidate, 'canon');
    const ifVerdict = validateIfBranchCandidate(candidate, 'if');

    expect(canonVerdict.accepted).toBe(false);
    expect(ifVerdict.accepted).toBe(true);
    expect(ifVerdict.vector?.axis).toBe('protect_fate');
  });

  it('infers fate states from integrity without exposing an AI write shortcut', () => {
    expect(inferFateState(100)).toBe('intact');
    expect(inferFateState(35)).toBe('fractured');
    expect(inferFateState(0)).toBe('destroyed');
  });

  it('resolves protect-fate and chaos inquiry endings without confirming eternal life', () => {
    const protectedEnding = resolveEnding(baseEndingInput({
      ifBranchVectors: [{
        id: 'if_fate_protect',
        anchorId: 'fate_war',
        axis: 'protect_fate',
        delta: 60,
        cause: '护住宿命',
        cost: '自由阵营敌视',
        downstreamImpact: ['宿命永存'],
        provenance: 'if-derived',
        createdTurn: 200,
      }],
    }));
    const chaosEnding = resolveEnding(baseEndingInput({
      heavenWillLedger: { attention: 90, correction: 0, rejection: 0, ambiguity: 20, lastTriggers: [] },
      karmicDebtLedger: { totalDebt: 15, byKind: { chaos_contact: 15 }, pendingReturns: [] },
    }));

    expect(protectedEnding.familyId).toBe('fate_intact_order');
    expect(chaosEnding.familyId).toBe('crazed_demon_unproven');
    expect([...protectedEnding.unresolvedWarnings, ...chaosEnding.unresolvedWarnings].join('\n')).toContain('永生');
    expect(validateEndingText('玩家炼成永生蛊，真正永生。')).not.toHaveLength(0);
  });
});
