import { describe, expect, it, vi } from 'vitest';
import anchorRegistryRaw from '../canon/canon-anchor-registry.json';
import endingOutcomesRaw from '../canon/ending-outcomes.json';
import rulesRaw from '../canon/v080-ending-framework-rules.json';
import { createDefaultStoryAnchorState } from './v080-midgame-anchor-engine';
import {
  buildEndingResolutionInput,
  commitEndingOutcome,
  createDefaultEndingFrameworkState,
  evaluateEndingReadiness,
  generateEndingRouteCandidates,
  recordEndingPressure,
  resolveEndingRoute,
  validateEndingRouteCandidate,
} from './v080-ending-framework-engine';

const anchorIds = new Set((anchorRegistryRaw as any).anchors.map((anchor: any) => anchor.id));
const endingFamilyIds = new Set((endingOutcomesRaw as any).families.map((family: any) => family.id));

function readyStoryAnchorState() {
  const base = createDefaultStoryAnchorState({ fateState: 'destroyed', currentAnchorId: 'heavenly_court_late_chapter' });
  return createDefaultStoryAnchorState({
    ...base,
    anchorResults: {
      ...base.anchorResults,
      yi_tian_mountain: { anchorId: 'yi_tian_mountain', status: 'resolved', canonDeviation: 8, summary: 'side line resolved' },
      reverse_flow_river: { anchorId: 'reverse_flow_river', status: 'resolved', canonDeviation: 6, summary: 'side line resolved' },
      dream_shadow_sect: { anchorId: 'dream_shadow_sect', status: 'resolved', canonDeviation: 10, summary: 'side line resolved' },
      fate_war: { anchorId: 'fate_war', status: 'resolved', canonDeviation: 18, summary: 'side wing resolved' },
      venerable_chessboard: { anchorId: 'venerable_chessboard', status: 'active', canonDeviation: 12, summary: 'pressure only' },
      heavenly_court_late_chapter: { anchorId: 'heavenly_court_late_chapter', status: 'active', canonDeviation: 14, summary: 'late pressure' },
    },
    ifBranchVectors: [
      {
        id: 'if_break_fate_test',
        anchorId: 'fate_war',
        axis: 'break_fate',
        delta: 46,
        cause: 'test evidence',
        cost: 'heaven will attention',
        downstreamImpact: ['free_will'],
        provenance: 'if-derived',
        createdTurn: 80,
      },
      {
        id: 'if_faction_test',
        anchorId: 'heavenly_court_late_chapter',
        axis: 'faction_shift',
        delta: 34,
        cause: 'test faction',
        cost: 'karmic debt',
        downstreamImpact: ['faction_cost'],
        provenance: 'if-derived',
        createdTurn: 90,
      },
      {
        id: 'if_venerable_pressure_test',
        anchorId: 'venerable_chessboard',
        axis: 'venerable_balance',
        delta: 18,
        cause: 'test pressure',
        cost: 'not a kill',
        downstreamImpact: ['venerable_attention'],
        provenance: 'if-derived',
        createdTurn: 100,
      },
    ],
    heavenWillLedger: {
      ...base.heavenWillLedger,
      attention: 72,
      correction: 20,
      rejection: 14,
    },
    karmicDebtLedger: {
      ...base.karmicDebtLedger,
      totalDebt: 38,
      byKind: {
        ...base.karmicDebtLedger.byKind,
        chaos_contact: 16,
      },
    },
  });
}

function readyStore(overrides: Record<string, any> = {}) {
  return {
    turn: 120,
    gameMode: 'if',
    currentChapterId: 'heavenly_court_late_chapter',
    currentDomain: 'Central Continent',
    profile: { name: 'Ending Tester', realm: { grand: 7, sub: 'high', label: 'rank seven high stage' }, background: 'rogue' },
    flags: { playerFactionScore: 78 },
    playerFaction: { reputation: 82 },
    daoHeart: { kill: 30, mercy: 12, scheme: 44, ambition: 40 },
    totalBattlesFought: 12,
    combatWins: 8,
    squadCombatWins: 3,
    squadMemberDeaths: 1,
    factionEvents: [{ id: 'faction_event' }],
    characterRelations: [{ id: 'relation' }],
    ...overrides,
  };
}

describe('v0.8.0-c1 ending framework rules', () => {
  it('uses registered late anchors and ending families only', () => {
    for (const anchorId of (rulesRaw as any).coveredAnchorIds) {
      expect(anchorIds.has(anchorId), `${anchorId} should be registered`).toBe(true);
    }
    for (const familyId of Object.keys((rulesRaw as any).familyWeights)) {
      expect(endingFamilyIds.has(familyId), `${familyId} should be a registered ending family`).toBe(true);
    }
    expect((rulesRaw as any).coveredAnchorIds).toEqual(['venerable_chessboard', 'heavenly_court_late_chapter']);
    expect((rulesRaw as any).commitPolicy.screenAfterCommit).toBe('game_over');
  });

  it('keeps forbidden ending assertions in local rules and out of candidate summaries', () => {
    const forbidden = (rulesRaw as any).commitPolicy.deepSeekForbidden;
    expect(forbidden).toContain('endingState');
    expect(forbidden).toContain('finalOutcome');
    expect(forbidden).toContain('venerableKill');
    expect(forbidden).toContain('rankTen');

    const input = buildEndingResolutionInput({
      storyAnchorState: readyStoryAnchorState(),
      store: readyStore(),
    });
    for (const candidate of generateEndingRouteCandidates(input)) {
      expect(candidate.forbiddenHits, candidate.familyId).toEqual([]);
    }
  });
});

describe('v0.8.0-c1 ending framework engine', () => {
  it('blocks early living endings but allows death summaries through local validation', () => {
    const earlyInput = buildEndingResolutionInput({
      storyAnchorState: createDefaultStoryAnchorState(),
      store: readyStore({
        turn: 4,
        profile: { name: 'Low Realm', realm: { grand: 3, sub: 'mid', label: 'rank three' } },
      }),
    });
    const early = evaluateEndingReadiness(earlyInput);
    expect(early.canCommit).toBe(false);
    expect(early.issues.length).toBeGreaterThan(0);

    const deadInput = buildEndingResolutionInput({
      storyAnchorState: createDefaultStoryAnchorState(),
      store: readyStore({ isDead: true, turn: 4, profile: { name: 'Dead Tester', realm: { grand: 3, sub: 'mid', label: 'rank three' } } }),
    });
    const dead = validateEndingRouteCandidate({ familyId: 'death_and_dust', resolutionInput: deadInput });
    expect(dead.valid).toBe(true);
  });

  it('generates commit-ready local candidates from anchor, IF, battle, faction, and cultivation evidence', () => {
    const input = buildEndingResolutionInput({
      storyAnchorState: readyStoryAnchorState(),
      store: readyStore(),
    });
    const validation = evaluateEndingReadiness(input);
    const candidates = generateEndingRouteCandidates(input);

    expect(validation.canCommit).toBe(true);
    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates.some(candidate => candidate.canCommit)).toBe(true);
    expect(candidates.map(candidate => candidate.familyId)).toContain('player_faction_foothold');
    expect(input.evidence.anchors.resolvedCount).toBeGreaterThanOrEqual(4);
    expect(input.evidence.battle.combatWins).toBe(8);
  });

  it('commits a valid route into a death-record-compatible ending summary', () => {
    const input = buildEndingResolutionInput({
      storyAnchorState: readyStoryAnchorState(),
      store: readyStore(),
    });
    const candidate = generateEndingRouteCandidates(input).find(item => item.canCommit);
    expect(candidate).toBeTruthy();

    const result = commitEndingOutcome({
      state: createDefaultEndingFrameworkState(),
      resolutionInput: input,
      candidateId: candidate!.id,
      committedAt: '2026-05-11T00:00:00.000Z',
    });

    expect(result.success).toBe(true);
    expect(result.state.status).toBe('committed');
    expect(result.commitRecord?.screenStateAfterCommit).toBe('game_over');
    expect(result.deathRecord?.endingFamilyId).toBe(candidate!.familyId);
    expect(result.deathRecord?.endingProvenance).toBe(result.outcome.provenance);
    expect(result.outcome.unresolvedWarnings.join('\n')).toContain('v0.8.0');
    expect(result.steps.some(step => step.kind === 'commit')).toBe(true);
  });

  it('records forbidden ending pressure instead of accepting AI-written final results', () => {
    const result = recordEndingPressure({
      state: createDefaultEndingFrameworkState(),
      attemptedOutcome: 'player obtains Fate Gu, becomes rank ten, and reaches true immortality',
      reason: 'AI direct final outcome',
      turn: 88,
    });

    expect(result.state.status).toBe('blocked');
    expect(result.state.pressureLog).toHaveLength(1);
    expect(result.state.lastResolutionSteps[0].kind).toBe('forbidden_block');
  });

  it('is deterministic and does not call Math.random', () => {
    const input = buildEndingResolutionInput({
      storyAnchorState: readyStoryAnchorState(),
      store: readyStore(),
    });
    const spy = vi.spyOn(Math, 'random').mockImplementation(() => {
      throw new Error('Math.random should not be used by c1 ending framework');
    });
    try {
      const first = resolveEndingRoute({ familyId: 'player_faction_foothold', resolutionInput: input });
      const second = resolveEndingRoute({ familyId: 'player_faction_foothold', resolutionInput: input });
      expect(first.valid).toBe(second.valid);
      expect(first.outcome.familyId).toBe(second.outcome.familyId);
      expect(first.steps.map(step => step.kind)).toEqual(second.steps.map(step => step.kind));
    } finally {
      spy.mockRestore();
    }
  });
});
