import { describe, expect, it } from 'vitest';
import { createInitialLivingWorldState } from '../store/defaultLivingWorldState';
import type { LivingPlayerGoalEntry } from '../types';
import {
  buildQingmaoRouteContinuationPreview,
  listQingmaoRouteContinuationIntentSamples,
  listQingmaoRouteContinuationRules,
} from './v014-qingmao-route-continuation';

function escapeGoal(turn = 41): LivingPlayerGoalEntry {
  return {
    id: 'goal_v014_escape_qingmao',
    intentType: 'travel',
    targetRef: 'region:outside_qingmao',
    status: 'deferred',
    createdTurn: turn,
    lastUpdatedTurn: turn,
    rationale: '我想离开青茅山，去南疆寻找后续人生。',
    nextStepHints: ['route:mountain_pass_escape'],
    blockedByRefIds: ['route:mountain_pass_escape', 'supply:travel_supply_gap'],
  };
}

describe('v0.14.0-a2 Qingmao route continuation preview', () => {
  it('keeps route rules candidate-only and carries the quarantined MiroFish item', () => {
    const routes = listQingmaoRouteContinuationRules();
    const result = buildQingmaoRouteContinuationPreview({ intentText: '我想看看离开青茅山有哪些路线' });

    expect(routes.map(route => route.routeKey)).toEqual(expect.arrayContaining([
      'mountain_pass_escape',
      'merchant_caravan_contact',
      'baijia_contact_window',
      'rogue_cultivator_path',
      'shang_public_entry_deferred',
    ]));
    expect(result.status).toBe('read_only_preview');
    expect(result.forbiddenWrites).toEqual(expect.arrayContaining([
      'route_entered',
      'location_unlock',
      'faction_identity_change',
      'reward',
      'hidden_fact_reveal',
      'deepseek_authority_expansion',
    ]));
    expect(result.quarantinedItemIds).toEqual(['v014exit_30146f740a69']);
    expect(JSON.stringify(result)).not.toContain('春秋蝉');
    expect(JSON.stringify(result)).not.toContain('重生');
    expect(JSON.stringify(result)).not.toContain('进入商家城成功');
  });

  it('shows route prerequisites for a normal escape intent without changing state', () => {
    const state = createInitialLivingWorldState({
      worldClock: { turn: 41 },
      playerGoals: [escapeGoal(41)],
    } as any);

    const result = buildQingmaoRouteContinuationPreview({
      livingWorldState: state,
      intentText: '我想离开青茅山',
    });
    const mountain = result.previews.find(preview => preview.routeKey === 'mountain_pass_escape');

    expect(mountain).toBeDefined();
    expect(mountain?.eligibility).toBe('needs_preparation');
    expect(mountain?.missingConditions.map(condition => condition.id)).toEqual(expect.arrayContaining([
      'route_prep_baseline',
      'travel_supply_gap',
    ]));
    expect(mountain?.availablePreparations.map(action => action.id)).toEqual(expect.arrayContaining([
      'qingmao_escape_route_preparation_probe',
      'gather_travel_supply',
    ]));
    expect(mountain?.statePatchApplied).toBe(false);
    expect(result.statePatchApplied).toBe(false);
  });

  it('upgrades prepared escape state to candidate but still does not unlock a location', () => {
    const state = createInitialLivingWorldState({
      worldClock: { turn: 42, lastActionId: 'qingmao_escape_route_preparation_probe' },
      playerGoals: [escapeGoal(42)],
      knownFacts: {
        qingmao_escape_route_preparation_baseline: {
          id: 'qingmao_escape_route_preparation_baseline',
          scope: 'region',
          source: 'engine_result',
          summary: '逃离青茅山的第一轮准备只确认路线、补给、身份遮掩和追踪风险四类前置。',
          learnedTurn: 42,
          confidence: 'confirmed',
          tags: ['v0.12.0-b1', 'qingmao_escape_route', 'route_supply_pursuit'],
        },
      },
      actionConsequences: [{
        id: 'consequence_qingmao_escape_route_preparation_probe',
        actionId: 'qingmao_escape_route_preparation_probe',
        turn: 42,
        scope: 'region',
        publicSummary: '已完成路线准备第一步，但当前没有离开青茅山。',
        effectRefs: ['route:route_qingmao_outer_night_mountain_road'],
        followUpRefs: ['supply:supply_qingmao_food_wine_short_trip', 'gate:no_location_unlock'],
      }],
    } as any);

    const result = buildQingmaoRouteContinuationPreview({ livingWorldState: state });
    const mountain = result.previews.find(preview => preview.routeKey === 'mountain_pass_escape');

    expect(mountain?.eligibility).toBe('candidate');
    expect(mountain?.missingConditions.map(condition => condition.id)).not.toContain('route_prep_baseline');
    expect(mountain?.missingConditions.map(condition => condition.id)).toContain('travel_supply_gap');
    expect(mountain?.boundaries.map(boundary => boundary.type)).toEqual(expect.arrayContaining([
      'no_location_unlock',
      'no_faction_transfer',
      'no_reward',
      'hidden_ref_only',
      'deepseek_no_authority',
    ]));
    expect(JSON.stringify(result)).not.toContain('location_unlock_granted');
  });

  it('shows faction-goal prerequisites for joining Bai clan without faction transfer', () => {
    const state = createInitialLivingWorldState({
      worldClock: { turn: 43 },
      playerGoals: [{
        ...escapeGoal(43),
        id: 'goal_join_baijia',
        intentType: 'join_faction',
        targetRef: 'faction:baijia_zhai',
        rationale: '我想投靠白家，但先试探接触窗口。',
      }],
      factionPressure: [{
        id: 'faction_pressure_qingmao_baijia_contact_window_opportunity',
        factionId: 'baijia_zhai',
        pressureType: 'opportunity',
        delta: 1,
        reason: '白家接触窗口只是一种机会，不等于阵营变化。',
        turn: 43,
        visibility: 'player_visible',
      }],
    } as any);

    const result = buildQingmaoRouteContinuationPreview({
      livingWorldState: state,
      intentText: '我想投靠白家',
    });
    const bai = result.previews.find(preview => preview.routeKey === 'baijia_contact_window');

    expect(result.intentRulingHints[0]).toEqual(expect.objectContaining({
      disposition: 'faction_goal_prerequisites_only',
      testMatrixRef: 'R14-007',
    }));
    expect(bai?.eligibility).toBe('candidate');
    expect(bai?.boundaries.map(boundary => boundary.type)).toContain('no_faction_transfer');
    expect(bai?.availablePreparations.map(action => action.id)).toEqual(expect.arrayContaining([
      'send_baijia_message',
      'avoid_guyue_attention',
    ]));
    expect(JSON.stringify(result)).not.toContain('投靠成功');
    expect(JSON.stringify(result)).not.toContain('faction_transfer_granted');
  });

  it('downgrades direct Shang city travel to public entry prerequisites only', () => {
    const result = buildQingmaoRouteContinuationPreview({
      intentText: '我想加入商队，直接去商家城',
    });
    const shang = result.previews.find(preview => preview.routeKey === 'shang_public_entry_deferred');

    expect(result.intentRulingHints[0]).toEqual(expect.objectContaining({
      disposition: 'route_preview_with_prerequisites',
    }));
    expect(shang?.eligibility).toBe('blocked');
    expect(shang?.reason).toContain('不开放完整城市');
    expect(shang?.boundaries.map(boundary => boundary.type)).toContain('no_location_unlock');
  });

  it('triages extreme high-rank inheritance intent as future sample pool', () => {
    const result = buildQingmaoRouteContinuationPreview({
      intentText: '我一转刚开窍，也不是天外之魔，但想立刻拿到盗天魔尊传承',
    });

    expect(result.intentRulingHints).toEqual([
      expect.objectContaining({
        id: 'R14-INTENT-EXTREME-001',
        bucket: 'extreme',
        disposition: 'future_sample_pool',
        testMatrixRef: 'R14-GOV-001',
      }),
    ]);
    expect(result.previews.every(preview => preview.statePatchApplied === false)).toBe(true);
    expect(result.forbiddenWrites).toContain('reward');
  });

  it('lists normal, short, long, faction, and extreme Player Advocate intent samples', () => {
    const samples = listQingmaoRouteContinuationIntentSamples();

    expect(samples.map(sample => sample.id)).toEqual(expect.arrayContaining([
      'R14-INTENT-NORMAL-001',
      'R14-INTENT-SHORT-001',
      'R14-INTENT-LONG-001',
      'R14-INTENT-FACTION-001',
      'R14-INTENT-EXTREME-001',
    ]));
    expect(samples.filter(sample => sample.matrixTriage === 'current_matrix').length).toBeGreaterThanOrEqual(4);
    expect(samples.find(sample => sample.id === 'R14-INTENT-EXTREME-001')?.matrixTriage).toBe('future_sample_pool');
  });
});
