import { describe, expect, it } from 'vitest';
import {
  buildQingmaoRouteSupplyPursuitPlan,
  listQingmaoPursuitTriggers,
  listQingmaoRouteCandidates,
  listQingmaoSupplyRequirements,
} from './v012-qingmao-route-supply-pursuit';

describe('v0.12.0-b1 Qingmao route/supply/pursuit helper', () => {
  it('lists cloned route, supply, and pursuit candidates', () => {
    const routes = listQingmaoRouteCandidates();
    const supplies = listQingmaoSupplyRequirements();
    const triggers = listQingmaoPursuitTriggers();

    expect(routes.map(route => route.id)).toEqual([
      'route_qingmao_outer_night_mountain_road',
      'route_qingmao_bamboo_forest_riverbank',
      'route_qingmao_task_valley',
    ]);
    expect(supplies).toHaveLength(4);
    expect(triggers).toHaveLength(3);

    const firstRisk = routes[0].riskTags[0];
    routes[0].riskTags[0] = 'mutated';
    expect(listQingmaoRouteCandidates()[0].riskTags[0]).toBe(firstRisk);
  });

  it('builds a preparation-only plan with source refs and blocked outcomes', () => {
    const plan = buildQingmaoRouteSupplyPursuitPlan();

    expect(plan.status).toBe('preparation_only');
    expect(plan.publicSummary).toContain('3 条路线候选');
    expect(plan.publicSummary).toContain('4 项补给缺口');
    expect(plan.publicSummary).toContain('3 个追击触发');
    expect(plan.visibleSourceRefs).toEqual(expect.arrayContaining([
      'mirofish:route_ch0010_night_mountain_road_exit',
      'mirofish:supply_ch0024_food_wine_and_moon_orchid_cost',
      'mirofish:pursuit_ch0092_group_waits_at_north_gate',
    ]));
    expect(plan.blockedOutcomes.join('|')).toContain('逃离成功');
    expect(plan.forbiddenWrites).toEqual(expect.arrayContaining([
      'escape_success',
      'location_unlock',
      'reward',
      'faction_identity_change',
      'hidden_fact_reveal',
      'deepseek_authority_expansion',
    ]));
    expect(plan.deferredItemIds).toContain('hidden_ref_ch0010_household_trap');
  });
});
