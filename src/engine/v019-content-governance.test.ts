import { describe, expect, it } from 'vitest';
import heroManifestRaw from '../../doc/art/v1-hero-selection-manifest.json';
import {
  buildV019LongPlaythroughMatrix,
  getV019GovernanceMeta,
  getV019PlayerAdvocatePolicy,
  listV019ContentTemplates,
  listV019HardStops,
  listV019MiroFishSourcePackages,
  listV019PublicCanonBoundaries,
  listV019ReleaseArtCaptionBoundaries,
  runV019PublicSafetyPreflight,
  validateV019ContentDraft,
  validateV019ReleaseArtManifest,
} from './v019-content-governance';

describe('v0.19 content governance tooling', () => {
  it('freezes v0.19 as a tooling/readiness phase without new world authority', () => {
    const meta = getV019GovernanceMeta();
    expect(meta.version).toBe('v0.19.0');
    expect(meta.status).toBe('v1_readiness_tool_gate');
    expect(meta.runtimeAuthority).toBe('local_tooling_only');
    expect(meta.mirofishPolicy).toMatch(/candidate_material_only/);
    expect(meta.saveFormatDecision).toContain('22');
    expect(listV019HardStops()).toEqual(expect.arrayContaining([
      'SAVE_FORMAT_VERSION = 23',
      'formal route or location entry',
      'formal faction transfer',
      'DeepSeek authority expansion',
    ]));
  });

  it('requires content templates to carry source pointers, authority, boundaries, and tests', () => {
    const templates = listV019ContentTemplates();
    expect(templates.map(template => template.id).sort()).toEqual([
      'asset_manifest',
      'combat_candidate',
      'economy_rule',
      'fact_card',
      'pressure_rule',
      'route_rule',
    ]);
    for (const template of templates) {
      expect(template.requiredFields).toEqual(expect.arrayContaining(['id', 'sourceItemIds'].filter(field => template.requiredFields.includes(field))));
      expect(template.forbiddenFields.length, template.id).toBeGreaterThan(0);
      expect(template.deepSeekBoundary, template.id).toMatch(/DeepSeek|visible|narrative|battle narration|candidate|caption|rumor|pressure/i);
      expect(template.requiredTests.length, template.id).toBeGreaterThanOrEqual(3);
    }

    const validRoute = validateV019ContentDraft({
      templateId: 'route_rule',
      fields: {
        id: 'route_rule_sample',
        routeId: 'southern_border_low_rank_route',
        publicSummary: '候选路线说明',
        requirements: ['public reason'],
        blockedUpgrades: ['route_entered'],
        sourceItemIds: ['v019_playthrough_0eae394624f1'],
        testSampleIds: ['V019-CM-003'],
        deepSeekBoundary: 'candidate narrative only',
      },
      authority: ['local_engine_preview_or_action_protocol'],
      sourcePointers: [{ id: 'source-pointer' }],
      testSampleIds: ['V019-CM-003'],
      deepSeekBoundary: 'candidate narrative only',
    });
    expect(validRoute.ok).toBe(true);

    const invalidRoute = validateV019ContentDraft({
      templateId: 'route_rule',
      fields: {
        id: 'bad_route',
        route_entered: true,
        currentRegion: 'southern_border',
      },
      authority: ['route_entered'],
    });
    expect(invalidRoute.ok).toBe(false);
    expect(invalidRoute.errors).toEqual(expect.arrayContaining([
      'forbidden_field:route_rule:route_entered',
      'forbidden_field:route_rule:currentRegion',
      'forbidden_authority:route_entered',
    ]));
  });

  it('promotes MiroFish v0.19 packages only to bounded candidate/test/copy uses', () => {
    expect(listV019MiroFishSourcePackages().sort()).toEqual([
      'v019_public_canon_boundary_pack_export_ready.json',
      'v019_release_art_caption_boundary_pack_export_ready.json',
      'v019_representative_playthrough_anchor_pack_export_ready.json',
    ].sort());

    const boundaries = listV019PublicCanonBoundaries();
    expect(boundaries).toHaveLength(8);
    expect(boundaries.find(item => item.category === 'hidden_history_public_redline')).toMatchObject({
      visibility: 'hidden_ref_only',
      promotedTo: expect.arrayContaining(['human_review_only']),
    });
    expect(boundaries.find(item => item.category === 'future_high_rank_public_redline')?.forbiddenImplications).toEqual(expect.arrayContaining([
      'Immortal Gu acquisition',
      'mortal Treasure Yellow Heaven trade',
    ]));

    const artBoundaries = listV019ReleaseArtCaptionBoundaries();
    expect(artBoundaries).toHaveLength(8);
    expect(artBoundaries.find(item => item.category === 'fang_yuan_visual_boundary')?.forbiddenVisualImplication).toMatch(/rebirth|hidden/i);
    expect(artBoundaries.find(item => item.category === 'shang_outer_edge_visual_boundary')?.safeCaptionBoundary).toMatch(/outer-edge/i);
  });

  it('builds the long-playthrough matrix from eight representative anchors', () => {
    const matrix = buildV019LongPlaythroughMatrix();
    expect(matrix.status).toBe('deterministic_matrix');
    expect(matrix.anchors).toHaveLength(8);
    expect(matrix.categoryCounts.extreme_goal_redline_path).toBe(1);
    expect(matrix.requiredBlockedOutcomes).toEqual(expect.arrayContaining([
      'route_entered',
      'hidden_body_visible',
      'rank_nine_granted',
      'NPC_life_decided',
    ]));
    const policy = getV019PlayerAdvocatePolicy();
    expect(policy.smallVersionPlayerFacingRounds).toBe(30);
    expect(policy.rcRounds).toBe(100);
    expect(policy.v1RcSuggestedRounds).toBe(150);
  });

  it('blocks public-copy, DeepSeek-context, write-target, and release-art overreach', () => {
    const safe = runV019PublicSafetyPreflight({
      visibleCopy: ['青茅与南疆早期低阶路线候选，仍以本地引擎裁决。'],
      deepSeekContextRefs: ['visible_fact:qingmao_public_boundary'],
      proposedWrites: ['knownFacts', 'actionConsequences'],
      releaseArtCaptions: ['低阶蛊师在青茅山雾中寻找下一步。'],
    });
    expect(safe.ok).toBe(true);

    const unsafe = runV019PublicSafetyPreflight({
      visibleCopy: ['已开放完整南疆，并可获得仙蛊奖励。'],
      deepSeekContextRefs: ['hidden_ref_only:v019_public_canon_f4e5d42a2b8c'],
      proposedWrites: ['route_entered', 'npcLifeResult'],
      releaseArtCaptions: ['方源重生后展示春秋蝉回溯。'],
    });
    expect(unsafe.ok).toBe(false);
    expect(unsafe.findings.map(item => item.scope)).toEqual(expect.arrayContaining([
      'visible_copy',
      'deepseek_context',
      'write_target',
      'release_art_caption',
    ]));
  });

  it('keeps the v1 hero manifest as selected candidates, not runtime authority', () => {
    const result = validateV019ReleaseArtManifest(heroManifestRaw);
    expect(result.ok).toBe(true);
    expect(result.warnings).toEqual([]);

    const bad = validateV019ReleaseArtManifest({
      _meta: { runtimeBinding: 'bound_now' },
      entries: [
        {
          id: 'v1-title-screen-hero',
          role: 'title_screen_hero',
          status: 'runtime_active',
          source: '',
          publicPath: '/rebrng/release/v1-hero/title-screen-hero.png',
          boundary: '',
          currentBinding: 'src/components/title/TitleScreen.tsx',
        },
      ],
    });
    expect(bad.ok).toBe(false);
    expect(bad.errors).toEqual(expect.arrayContaining([
      'release_art_runtime_binding_not_allowed:bound_now',
      'invalid_release_art_status:v1-title-screen-hero:runtime_active',
      'missing_release_art_source:v1-title-screen-hero',
      'release_art_entry_bound_too_early:v1-title-screen-hero:src/components/title/TitleScreen.tsx',
    ]));
  });
});
