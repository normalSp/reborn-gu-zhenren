import { describe, expect, it } from 'vitest';
import type { CalamityPreview, ImmortalAperture, ResourceNode } from '../types';
import {
  buildCalamitySceneSpec,
  buildCalamityWorldActionBridge,
  formatCalamitySceneForPrompt,
  listCalamitySceneTemplates,
  selectCalamitySceneKind,
} from './v080-calamity-scene-engine';

function preview(overrides: Partial<CalamityPreview> = {}): CalamityPreview {
  return {
    id: 'earth_fire',
    name: '地火灾',
    category: 'earth_calamity',
    path: '炎道',
    severity: 3,
    countdown: 6,
    affectedResourceNodeIds: ['node_fire', 'node_wood'],
    expectedAreaLossPct: 0.08,
    warnings: ['test'],
    tags: ['calamity'],
    ...overrides,
  };
}

function immortalAperture(nodes: ResourceNode[] = []): ImmortalAperture {
  return {
    type: '福地',
    grade: '中等福地',
    area_mu: 520,
    time_flow_ratio: 18,
    resource_nodes: nodes,
    dao_mark_density: { 炎道: 70, 木道: 40, 气道: 120 },
    next_disaster_type: '地火',
    disaster_countdown: 6,
  };
}

describe('v0.8.0-c2.4 calamity scene engine', () => {
  it('keeps all six calamity scene templates registered', () => {
    expect(listCalamitySceneTemplates().map(item => item.kind).sort()).toEqual([
      'dao_mark_manifestation',
      'desolate_beast_invasion',
      'human_calamity',
      'immortal_killer_pressure',
      'natural_disaster',
      'resource_node_imbalance',
    ]);
  });

  it('does not create a scene without immortal aperture calamity preview', () => {
    const spec = buildCalamitySceneSpec({
      store: {
        profile: { realm: { grand: 5 } },
        aperture: { type: 'mortal' },
      },
    });
    expect(spec).toBeNull();
  });

  it('selects narrative calamity kinds from preview facts instead of random rolls', () => {
    expect(selectCalamitySceneKind(preview({ tags: ['beast'] }))).toBe('desolate_beast_invasion');
    expect(selectCalamitySceneKind(preview({ tags: ['human_calamity'] }))).toBe('human_calamity');
    expect(selectCalamitySceneKind(preview({ category: 'heavenly_tribulation' }))).toBe('immortal_killer_pressure');
    expect(selectCalamitySceneKind(preview({ severity: 5, affectedResourceNodeIds: [] }))).toBe('dao_mark_manifestation');
    expect(selectCalamitySceneKind(preview({ severity: 2, affectedResourceNodeIds: [] }))).toBe('natural_disaster');
  });

  it('uses resource-node imbalance when a rich aperture has multiple affected nodes', () => {
    const store = {
      turn: 8,
      profile: { realm: { grand: 7 } },
      currentChapterId: 'immortal_aperture_night',
      aperture: immortalAperture([
        { id: 'node_fire', type: '炎道', name: '火脉灵田', output_rate: 3, quality: 80, grade: '仙材', active: true },
        { id: 'node_wood', type: '木道', name: '青木药圃', output_rate: 2, quality: 70, grade: '精品', active: true },
        { id: 'node_qi', type: '气道', name: '三气回旋口', output_rate: 2, quality: 68, grade: '仙材', active: true },
      ]),
    };
    const spec = buildCalamitySceneSpec({ store, preview: preview() });

    expect(spec?.kind).toBe('resource_node_imbalance');
    expect(spec?.sceneId).toBe('immortal_aperture_night');
    expect(spec?.realmGrand).toBe(7);
    expect(spec?.affectedResourceNodeIds).toEqual(['node_fire', 'node_wood']);
  });

  it('formats prompt guardrails so DeepSeek cannot settle calamity consequences', () => {
    const spec = buildCalamitySceneSpec({
      store: { turn: 9, profile: { realm: { grand: 6 } }, aperture: immortalAperture() },
      preview: preview({ tags: ['human_calamity'] }),
    });
    const prompt = formatCalamitySceneForPrompt(spec);

    expect(spec?.combatScale).toBe('group_5x3');
    expect(prompt).toContain('灾劫场景规格');
    expect(prompt).toContain('DeepSeek 只能写预兆');
    expect(prompt).toContain('本地引擎结算');
  });

  it('projects calamity scenes into the unified world-action protocol', () => {
    const spec = buildCalamitySceneSpec({
      store: {
        turn: 12,
        currentChapterId: 'immortal_aperture_calamity',
        currentDomain: '南疆',
        profile: { realm: { grand: 6 } },
        aperture: immortalAperture(),
      },
      preview: preview({ severity: 4 }),
    });

    const bridge = buildCalamityWorldActionBridge({
      spec: spec!,
      store: { turn: 12, currentChapterId: 'immortal_aperture_calamity', currentDomain: '南疆' },
      phase: 'omen',
      summary: `灾劫预兆入场：${spec?.name}`,
      status: 'pending_narrative',
      mode: 'narrative_return',
    });

    expect(bridge.worldActionCandidate.domain).toBe('calamity');
    expect(bridge.worldActionDeparture.mode).toBe('narrative_return');
    expect(bridge.worldActionResolution.rewardPolicy).toBe('local_engine_only');
    expect(bridge.worldActionLedgerEntry.actionType).toBe('calamity');
    expect(bridge.worldActionLedgerEntry.source).toContain(':omen');
    expect(bridge.narrativeReturnContext.promptSummary).toContain('灾劫预兆');
    expect(bridge.narrativeReturnContext.promptSummary).toContain('不得由 DeepSeek 判定');
  });
});
