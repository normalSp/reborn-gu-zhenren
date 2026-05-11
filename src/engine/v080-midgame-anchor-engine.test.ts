import { describe, expect, it } from 'vitest';
import anchorRegistryRaw from '../canon/canon-anchor-registry.json';
import branchMatrixRaw from '../canon/fate-branch-matrix.json';
import rulesRaw from '../canon/v080-midgame-anchor-rules.json';
import {
  B3_MIDGAME_ANCHOR_IDS,
  buildEndingResolverInput,
  createDefaultStoryAnchorState,
  evaluateStoryAnchorEntry,
  normalizeStoryAnchorState,
  recordCanonAnchorPressure,
  resolveIfBranchCandidate,
  resolveStoryEventCandidate,
  validateStoryEventCandidate,
} from './v080-midgame-anchor-engine';

const anchorIds = new Set((anchorRegistryRaw as any).anchors.map((anchor: any) => anchor.id));
const axisIds = new Set((branchMatrixRaw as any).axes.map((axis: any) => axis.id));

function store(overrides: Record<string, any> = {}) {
  return {
    turn: 12,
    gameMode: 'canon',
    currentChapterId: 'fate_war',
    currentDomain: '中洲',
    profile: { realm: { grand: 6, sub: '初阶', label: '六转初阶' } },
    flags: {},
    daoHeart: { kill: 0, mercy: 0, scheme: 0, ambition: 0 },
    ...overrides,
  };
}

describe('v0.8.0-b3 midgame anchor rules', () => {
  it('uses registered canon anchors and IF axes only', () => {
    for (const anchorId of (rulesRaw as any).coveredAnchorIds) {
      expect(anchorIds.has(anchorId), `${anchorId} should be registered`).toBe(true);
    }
    for (const anchorId of (rulesRaw as any).futureAnchorIds) {
      expect(anchorIds.has(anchorId), `${anchorId} should be registered`).toBe(true);
    }
    for (const [anchorId, rule] of Object.entries((rulesRaw as any).anchorRules)) {
      expect(anchorIds.has(anchorId)).toBe(true);
      for (const axis of (rule as any).allowedIfAxes) {
        expect(axisIds.has(axis), `${anchorId}/${axis} should use registered IF axis`).toBe(true);
      }
    }
  });

  it('keeps forbidden runtime assertions explicit', () => {
    const forbidden = (rulesRaw as any).forbiddenRuntimeAssertions.join('\n');
    expect(forbidden).toContain('永生蛊');
    expect(forbidden).toContain('十转');
    expect(forbidden).toContain('玩家获得宿命蛊');
    expect(forbidden).toContain('普通战斗击杀尊者');
  });
});

describe('v0.8.0-b3 midgame anchor engine', () => {
  it('evaluates entry gates by realm, mode, and b3 coverage', () => {
    const tooLow = evaluateStoryAnchorEntry({
      state: createDefaultStoryAnchorState(),
      store: store({ profile: { realm: { grand: 4, sub: '巅峰', label: '四转巅峰' } } }),
      anchorId: 'yi_tian_mountain',
    });
    expect(tooLow.allowed).toBe(false);
    expect(tooLow.issues.join('\n')).toContain('境界不足');

    const fateWar = evaluateStoryAnchorEntry({
      state: createDefaultStoryAnchorState(),
      store: store(),
      anchorId: 'fate_war',
    });
    expect(fateWar.allowed).toBe(true);
    expect(fateWar.recommendedRole).toContain('侧翼');

    expect([...B3_MIDGAME_ANCHOR_IDS]).toContain('dream_shadow_sect');
  });

  it('blocks fixed canon core mutations and forbidden assertions', () => {
    const state = createDefaultStoryAnchorState();
    const yiTian = validateStoryEventCandidate({
      state,
      store: store({ currentChapterId: 'yi_tian_mountain' }),
      candidate: {
        anchorId: 'yi_tian_mountain',
        type: 'side_event',
        title: '夺取至尊仙胎',
        summary: '玩家夺取至尊仙胎主线位置，提前公开影宗全局真相。',
        risk: 'high',
      },
    });
    expect(yiTian.engineValidation).toBe('blocked');

    const river = validateStoryEventCandidate({
      state,
      store: store({ currentChapterId: 'reverse_flow_river' }),
      candidate: {
        anchorId: 'reverse_flow_river',
        type: 'side_event',
        title: '替代逆流河名场面',
        summary: '玩家替代方源完成逆流河核心名场面。',
        risk: 'high',
      },
    });
    expect(river.engineValidation).toBe('blocked');

    const fate = validateStoryEventCandidate({
      state,
      store: store(),
      candidate: {
        anchorId: 'fate_war',
        type: 'side_event',
        title: '夺宿命蛊',
        summary: '玩家获得宿命蛊，并宣告真正永生。',
        risk: 'high',
      },
    });
    expect(fate.engineValidation).toBe('blocked');
    expect(fate.validationIssues.join('\n')).toContain('禁区断言');
  });

  it('allows canon side-line participation without direct rewards', () => {
    const result = resolveStoryEventCandidate({
      state: createDefaultStoryAnchorState(),
      store: store(),
      candidate: {
        anchorId: 'fate_war',
        type: 'side_event',
        title: '侧翼救援',
        summary: '玩家在宿命战侧翼救援受伤蛊师并撤退，只改变关系变化与局部战果。',
        risk: 'medium',
      },
    });
    expect(result.record.engineValidation).toBe('accepted');
    expect(result.state.storyEventCandidates).toHaveLength(1);
    expect(result.state.anchorResults.fate_war.status).toBe('active');
    expect(result.steps[0].kind).toBe('candidate');
  });

  it('accepts legal IF axes only in IF mode and records cost ledgers', () => {
    const result = resolveIfBranchCandidate({
      state: createDefaultStoryAnchorState(),
      store: store({ gameMode: 'if' }),
      candidate: {
        anchorId: 'fate_war',
        axis: 'break_fate',
        proposedDelta: 24,
        summary: '在宿命战侧翼偏向毁宿命阵营。',
        costHint: '天意排斥与势力仇怨上升',
        downstreamHint: ['heaven_will_debt'],
      },
      mode: 'if',
    });
    expect(result.record.engineValidation).toBe('accepted');
    expect(result.vector?.axis).toBe('break_fate');
    expect(result.state.ifBranchVectors).toHaveLength(1);
    expect(result.state.heavenWillLedger.attention).toBeGreaterThan(0);
    expect(result.state.karmicDebtLedger.totalDebt).toBeGreaterThan(0);

    const blocked = resolveIfBranchCandidate({
      state: createDefaultStoryAnchorState(),
      store: store(),
      candidate: {
        anchorId: 'fate_war',
        axis: 'break_fate',
        proposedDelta: 24,
        summary: '正史模式尝试毁宿命 IF。',
        costHint: '无',
        downstreamHint: [],
      },
      mode: 'canon',
    });
    expect(blocked.record.engineValidation).toBe('blocked');
    expect(blocked.state.ifBranchVectors).toHaveLength(0);
  });

  it('records pressure and normalizes legacy flags into storyAnchorState', () => {
    const pressure = recordCanonAnchorPressure({
      state: createDefaultStoryAnchorState(),
      store: store(),
      pressure: {
        anchorId: 'fate_war',
        pressure: 100,
        reason: 'AI 越权',
        attemptedMutation: '玩家获得宿命蛊',
        engineDecision: 'block',
        fallbackNarrativeHint: '降级为侧翼见证。',
      },
    });
    expect(pressure.record.engineDecision).toBe('block');
    expect(pressure.state.canonAnchorPressureLog).toHaveLength(1);

    const migrated = normalizeStoryAnchorState(null, {
      fateState: 'fractured',
      currentCanonAnchorId: 'reverse_flow_river',
      ifBranchVectors: [{ id: 'legacy', anchorId: 'reverse_flow_river', axis: 'protect_fate', delta: 8, cause: 'legacy', cost: 'legacy', downstreamImpact: [], provenance: 'if-derived', createdTurn: 3 }],
    });
    expect(migrated.version).toBe('v0.8.0-b3');
    expect(migrated.fateState).toBe('fractured');
    expect(migrated.currentAnchorId).toBe('reverse_flow_river');
    expect(migrated.ifBranchVectors).toHaveLength(1);
  });

  it('builds ending resolver input from persistent anchor state', () => {
    const anchorState = createDefaultStoryAnchorState({ fateState: 'fractured' });
    const input = buildEndingResolverInput({ state: anchorState, store: store({ flags: { playerFactionScore: 66 } }) });
    expect(input.fateState).toBe('fractured');
    expect(input.playerFactionScore).toBe(66);
    expect(input.anchorResults.fate_war.anchorId).toBe('fate_war');
  });
});
