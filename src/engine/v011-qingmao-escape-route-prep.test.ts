import { describe, expect, it } from 'vitest';
import { createInitialLivingWorldState } from '../store/defaultLivingWorldState';
import type { LivingPlayerGoalEntry } from '../types';
import { resolveQingmaoEscapeRoutePreparationAction } from './v011-qingmao-escape-route-prep';

function escapeGoal(turn = 31): LivingPlayerGoalEntry {
  return {
    id: 'goal_escape_qingmao_test',
    intentType: 'travel',
    targetRef: 'region:outside_qingmao',
    status: 'deferred',
    createdTurn: turn,
    lastUpdatedTurn: turn,
    rationale: '逃离青茅山需要前置。',
    nextStepHints: ['route:qingmao_exit', 'resource:travel_supply', 'risk:pursuit'],
    blockedByRefIds: ['route:qingmao_exit', 'resource:travel_supply', 'risk:pursuit'],
  };
}

describe('v0.11.0-b2-6 Qingmao escape route preparation', () => {
  it('prepares escape-route prerequisites without unlocking a new region', () => {
    const goal = escapeGoal(31);
    const state = createInitialLivingWorldState({
      worldClock: { turn: 31 },
      playerGoals: [goal],
    } as any);

    const result = resolveQingmaoEscapeRoutePreparationAction({
      livingWorldState: state,
      goalId: goal.id,
      selectedStartProfileId: 'start_qingmaoshan_guyue',
      sceneId: 'v011_escape_route_test',
      locationId: 'qingmaoshan_clan_school',
    });

    expect(result.success).toBe(true);
    expect(result.blocked).toBe(false);
    expect(result.worldActionCandidate.domain).toBe('field_action');
    expect(result.worldActionDeparture.mode).toBe('local_resolution');
    expect(result.worldActionDeparture.chargeAp).toBe(false);
    expect(result.worldActionResolution.rewardPolicy).toBe('none');
    expect(result.knownFacts).toEqual([
      expect.objectContaining({
        id: 'qingmao_escape_route_preparation_baseline',
        summary: expect.stringContaining('当前没有离开青茅山'),
        tags: expect.arrayContaining(['v0.12.0-b1', 'route_supply_pursuit']),
      }),
    ]);
    expect(result.factionPressure).toEqual([
      expect.objectContaining({
        id: 'faction_pressure_qingmao_escape_route_guyue_shanzhai_pursuit_risk',
        factionId: 'guyue_shanzhai',
        pressureType: 'suspicion',
      }),
    ]);
    expect(result.playerGoals).toEqual([
      expect.objectContaining({
        id: goal.id,
        targetRef: 'region:outside_qingmao',
        status: 'deferred',
        blockedByRefIds: expect.arrayContaining([
          'route:route_qingmao_outer_night_mountain_road',
          'supply:supply_qingmao_food_wine_short_trip',
          'pursuit:pursuit_qingmao_task_absence_north_gate',
        ]),
      }),
    ]);
    expect(result.actionConsequences).toEqual([
      expect.objectContaining({
        id: 'consequence_qingmao_escape_route_preparation_probe',
        followUpRefs: expect.arrayContaining([
          'route:route_qingmao_outer_night_mountain_road',
          'supply:supply_qingmao_food_wine_short_trip',
          'pursuit:pursuit_qingmao_task_absence_north_gate',
          'gate:no_location_unlock',
        ]),
      }),
    ]);
    expect(result.forbiddenUpgrades).toEqual(expect.arrayContaining([
      'location_unlock',
      'teleport',
      'escape_success',
      'reward',
      'hidden_fact_reveal',
      'canon_anchor_change',
    ]));
    expect(result.routeSupplyPursuitPlan.routeCandidates).toHaveLength(3);
    expect(result.routeSupplyPursuitPlan.supplyRequirements).toHaveLength(4);
    expect(result.routeSupplyPursuitPlan.pursuitTriggers).toHaveLength(3);
    expect(result.visibleSourceRefs).toEqual(expect.arrayContaining([
      'mirofish:route_ch0010_night_mountain_road_exit',
      'mirofish:supply_ch0024_food_wine_and_moon_orchid_cost',
      'mirofish:pursuit_ch0092_group_waits_at_north_gate',
    ]));
    expect(JSON.stringify(result)).not.toContain('离开成功');
    expect(JSON.stringify(result)).not.toContain('青茅山外已开放');
    expect(JSON.stringify(result)).not.toContain('春秋蝉');
  });

  it('blocks route preparation before the escape goal is confirmed', () => {
    const state = createInitialLivingWorldState({ worldClock: { turn: 32 } } as any);

    const result = resolveQingmaoEscapeRoutePreparationAction({
      livingWorldState: state,
      selectedStartProfileId: 'start_qingmaoshan_guyue',
    });

    expect(result.success).toBe(false);
    expect(result.blocked).toBe(true);
    expect(result.rejectedReasons).toEqual(['missing_escape_goal']);
    expect(result.knownFacts).toEqual([]);
    expect(result.factionPressure).toEqual([]);
    expect(result.playerGoals).toEqual([]);
    expect(result.actionConsequences).toEqual([]);
  });

  it('uses stable ids so repeated preparation cannot farm route state', () => {
    const goal = escapeGoal(33);
    const state = createInitialLivingWorldState({
      worldClock: { turn: 33 },
      playerGoals: [goal],
    } as any);

    const first = resolveQingmaoEscapeRoutePreparationAction({ livingWorldState: state, goalId: goal.id, turn: 33 });
    const second = resolveQingmaoEscapeRoutePreparationAction({ livingWorldState: state, goalId: goal.id, turn: 33 });

    expect(first.knownFacts.map(entry => entry.id)).toEqual(second.knownFacts.map(entry => entry.id));
    expect(first.factionPressure.map(entry => entry.id)).toEqual(second.factionPressure.map(entry => entry.id));
    expect(first.actionConsequences.map(entry => entry.id)).toEqual(second.actionConsequences.map(entry => entry.id));
    expect(first.playerGoals.map(entry => entry.id)).toEqual(second.playerGoals.map(entry => entry.id));
  });
});
