import { describe, expect, it, vi } from 'vitest';
import { createDefaultStoryAnchorState } from '../../engine/v080-midgame-anchor-engine';
import { SAVE_FORMAT_VERSION } from '../initialState';
import { migrateSave } from '../index';
import { createStoryAnchorSlice } from './storyAnchorSlice';

function createHarness(overrides: Record<string, any> = {}) {
  let state: any = {
    turn: 18,
    gameMode: 'if',
    currentChapterId: 'fate_war',
    currentDomain: '中洲',
    profile: { name: '测试蛊师', realm: { grand: 6, sub: '初阶', label: '六转初阶' } },
    flags: {},
    storyAnchorState: createDefaultStoryAnchorState(),
    gameLog: [],
    l3Warnings: [],
    ...overrides,
  };
  const set = (patch: any) => {
    const next = typeof patch === 'function' ? patch(state) : patch;
    state = { ...state, ...next };
  };
  const get = () => state;
  state.addGameLog = vi.fn((category: string, message: string, meta: any) => {
    state.gameLog = [...state.gameLog, { category, message, meta }];
  });
  state.setL3Warnings = vi.fn((warnings: any[]) => {
    state.l3Warnings = warnings;
  });
  state = { ...state, ...createStoryAnchorSlice(set, get) };
  return { get: () => state };
}

describe('v0.8.0-b3 story anchor store slice', () => {
  it('migrates v16 saves to v17 storyAnchorState and mirrors legacy flags', () => {
    const migrated = migrateSave({
      formatVersion: 16,
      timestamp: 'test',
      meta: { playerName: '旧档', realm: '六转初阶', turn: 16, gameMode: 'if' },
      state: {
        profile: { name: '旧档', realm: { grand: 6, sub: '初阶', label: '六转初阶' } },
        flags: {
          fateState: 'fractured',
          currentCanonAnchorId: 'reverse_flow_river',
          ifBranchVectors: [{
            id: 'legacy_vector',
            anchorId: 'reverse_flow_river',
            axis: 'protect_fate',
            delta: 8,
            cause: '旧 flags',
            cost: '天意关注',
            downstreamImpact: [],
            provenance: 'if-derived',
            createdTurn: 6,
          }],
        },
      },
    } as any);

    expect(migrated.formatVersion).toBe(SAVE_FORMAT_VERSION);
    expect((migrated.state as any).storyAnchorState.version).toBe('v0.8.0-b3');
    expect((migrated.state as any).storyAnchorState.fateState).toBe('fractured');
    expect((migrated.state as any).storyAnchorState.currentAnchorId).toBe('reverse_flow_river');
    expect((migrated.state as any).flags.ifBranchVectors).toHaveLength(1);
  });

  it('records accepted story candidates in persistent state and compatibility flags', () => {
    const harness = createHarness({ gameMode: 'canon' });
    const result = harness.get().resolveStoryEventCandidateAction({
      anchorId: 'fate_war',
      type: 'side_event',
      title: '侧翼救援',
      summary: '玩家在宿命战侧翼救援受伤蛊师并撤退，只产生局部战果。',
      risk: 'medium',
    });

    expect(result.accepted).toBe(true);
    expect(harness.get().storyAnchorState.storyEventCandidates).toHaveLength(1);
    expect(harness.get().flags.storyEventCandidates).toHaveLength(1);
    expect(harness.get().storyAnchorState.anchorResults.fate_war.status).toBe('active');
    expect(harness.get().addGameLog).toHaveBeenCalled();
  });

  it('blocks canon core mutations and writes L3 warning pressure', () => {
    const harness = createHarness({ gameMode: 'canon' });
    const result = harness.get().resolveStoryEventCandidateAction({
      anchorId: 'fate_war',
      type: 'side_event',
      title: '夺取宿命蛊',
      summary: '玩家获得宿命蛊并炼成永生蛊。',
      risk: 'high',
    });

    expect(result.accepted).toBe(false);
    expect(harness.get().storyAnchorState.storyEventCandidates[0].engineValidation).toBe('blocked');
    expect(harness.get().l3Warnings.length).toBeGreaterThan(0);
  });

  it('accepts legal IF vectors in IF mode and rejects them in canon mode', () => {
    const ifHarness = createHarness({ gameMode: 'if' });
    const accepted = ifHarness.get().resolveIfBranchCandidateAction({
      anchorId: 'fate_war',
      axis: 'break_fate',
      proposedDelta: 20,
      summary: '偏向毁宿命侧翼。',
      costHint: '天意排斥',
      downstreamHint: ['heaven_will_debt'],
    });
    expect(accepted.accepted).toBe(true);
    expect(ifHarness.get().storyAnchorState.ifBranchVectors).toHaveLength(1);
    expect(ifHarness.get().storyAnchorState.karmicDebtLedger.totalDebt).toBeGreaterThan(0);

    const canonHarness = createHarness({ gameMode: 'canon' });
    const blocked = canonHarness.get().resolveIfBranchCandidateAction({
      anchorId: 'fate_war',
      axis: 'break_fate',
      proposedDelta: 20,
      summary: '正史中偏向毁宿命 IF。',
      costHint: '无',
      downstreamHint: [],
    });
    expect(blocked.accepted).toBe(false);
    expect(canonHarness.get().storyAnchorState.ifBranchVectors).toHaveLength(0);
  });

  it('records direct canon anchor pressure through local action', () => {
    const harness = createHarness({ gameMode: 'canon' });
    const result = harness.get().recordCanonAnchorPressureAction({
      anchorId: 'fate_war',
      pressure: 100,
      reason: 'AI 尝试写核心结果',
      attemptedMutation: '玩家获得宿命蛊',
      engineDecision: 'block',
      fallbackNarrativeHint: '降级为侧翼见证。',
    });
    expect(result.accepted).toBe(false);
    expect(harness.get().storyAnchorState.canonAnchorPressureLog).toHaveLength(1);
    expect(harness.get().flags.canonAnchorPressureLog).toHaveLength(1);
  });
});
