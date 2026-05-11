import { describe, expect, it } from 'vitest';
import {
  buildNarrativeAdvanceIntent,
  createDefaultSceneSessionState,
  formatSceneSessionForPrompt,
  normalizeSceneSessionState,
  spendSceneActionBudget,
} from './v080-scene-session-engine';

describe('v0.8.0-c2.2 scene session engine', () => {
  it('spends scene AP without advancing narrative turn and records a ledger entry', () => {
    const state = createDefaultSceneSessionState({ narrativeTurn: 40 });
    const result = spendSceneActionBudget({
      state,
      cost: 1,
      actionType: 'cultivate',
      summary: '深修一轮',
      source: 'test',
      systemResult: { progressGain: 6 },
    });

    expect(result.success).toBe(true);
    expect(result.state.narrativeTurn).toBe(40);
    expect(result.state.actionBudget.remainingAp).toBe(2);
    expect(result.state.localActionLedger[0].systemResult.progressGain).toBe(6);
  });

  it('blocks actions after AP is exhausted and creates a narrative advance intent', () => {
    const state = normalizeSceneSessionState({
      actionBudget: { maxAp: 1, remainingAp: 0, grantedBy: 'narrative_scene', exhaustedPolicy: 'advance_narrative' },
      localActionLedger: [],
    });
    const blocked = spendSceneActionBudget({
      state,
      cost: 1,
      actionType: 'field_action',
      summary: '继续采集',
      source: 'test',
    });
    const intent = buildNarrativeAdvanceIntent(state);

    expect(blocked.success).toBe(false);
    expect(intent.reason).toBe('player_advance');
  });

  it('formats ledger facts for the next narrative prompt', () => {
    const spent = spendSceneActionBudget({
      state: createDefaultSceneSessionState({ sceneId: 'qingmao:40:night' }),
      cost: 1,
      actionType: 'meditate',
      summary: '调息吸收元石',
      source: 'test',
    });

    const prompt = formatSceneSessionForPrompt(spent.state);

    expect(prompt).toContain('场景行动预算');
    expect(prompt).toContain('调息吸收元石');
    expect(prompt).toContain('不得改写数值');
  });
});
