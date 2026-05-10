import { describe, expect, it } from 'vitest';
import guDatabaseRaw from '../canon/gu-database.json';
import guExpressionSpecsRaw from '../canon/gu-expression-specs.json';
import killerMoveExpressionSpecsRaw from '../canon/killer-move-expression-specs.json';
import battlefieldCombatRulesRaw from '../canon/battlefield-combat-rules.json';
import { isRuntimePathAllowed } from './path-registry';
import {
  buildGuResolutionStepDraft,
  getGuExpressionSpec,
  isGuNormalCombatUsable,
  isGuPassive,
  isGuSceneGated,
  listGuExpressionSpecs,
  listKillerMoveExpressionSpecs,
  listSceneUtilitiesForGu,
} from './gu-expression-registry';
import {
  createBattlefieldCombatState,
  listBattlefieldActionTargets,
} from './v080-battlefield-combat-engine';
import {
  NARRATIVE_GU_AFFORDANCE_CATEGORIES,
  getNarrativeGuUtilityCategory,
  validateNarrativeGuUtilityMap,
} from './v080-narrative-gu-affordances';

const REQUIRED_GU = [
  '月光蛊', '月芒蛊', '小光蛊', '骨枪蛊', '熊力蛊', '蛮力天牛蛊', '水龙蛊', '火鸦蛊', '雷翼蛊', '春雷蛊', '岩枪蛊', '金龙蛊',
  '石皮蛊', '铜皮蛊', '铁皮蛊', '玉皮蛊', '白玉蛊', '金钟蛊', '金缕衣蛊', '金罡蛊', '水幕天华蛊', '月霓裳',
  '力气蛊', '横冲直撞蛊', '青丝蛊', '种蛊', '裂地蛊', '幽影随行蛊', '水蛛蛊', '破风蛊', '爱生离', '毒液蛊',
  '书虫', '侦察蛊', '追踪蛊', '巡夜蛊', '电眼蛊', '察运蛊', '鉴毒蛊', '避瘴蛊',
  '酒虫', '净水蛊', '治愈蛊', '金风送爽蛊', '醒酒蛊', '辟谷蛊',
  '血颅蛊', '妇人心蛊', '月影蛊', '驭虫蛊', '黑豕蛊', '白豕蛊',
];

const REQUIRED_KILLER_MOVES = [
  '月刃连斩', '石皮护体', '木灵缠绕', '草木生长', '青丝绞杀',
  '水龙卷', '金钟不破', '巨灵变', '酒虫精炼阵', '食铁者',
  '吞噬强化', '无形之手', '影子行窃', '血颅续航', '血滴子杀阵',
];

describe('v0.8.0 Gu expression data foundation', () => {
  it('covers the first Gu expression set with runtime-safe paths and non-generic play identity', () => {
    const specs = listGuExpressionSpecs();
    const names = new Set(specs.map(spec => spec.guName));

    expect(specs.length).toBeGreaterThanOrEqual(50);
    for (const guName of REQUIRED_GU) {
      expect(names.has(guName), guName).toBe(true);
    }

    for (const spec of specs) {
      expect(isRuntimePathAllowed(spec.path), `${spec.guName}.path=${spec.path}`).toBe(true);
      expect(spec.verbs.length, `${spec.guName}.verbs`).toBeGreaterThanOrEqual(2);
      expect(spec.sceneUtilities.length, `${spec.guName}.sceneUtilities`).toBeGreaterThanOrEqual(2);
      expect(spec.counters.length, `${spec.guName}.counters`).toBeGreaterThanOrEqual(2);
      expect(spec.visualMotif.motif, `${spec.guName}.visualMotif.motif`).toBeTruthy();
      expect(spec.visualMotif.motion, `${spec.guName}.visualMotif.motion`).toBeTruthy();
      expect(spec.uniqueness.length, `${spec.guName}.uniqueness`).toBeGreaterThan(12);
      expect(Number.isFinite(spec.range.max), `${spec.guName}.range.max`).toBe(true);
      expect(Number.isFinite(spec.cooldown), `${spec.guName}.cooldown`).toBe(true);
    }
  });

  it('keeps forbidden Gu scene-gated instead of normal combat buttons', () => {
    for (const guName of ['血颅蛊', '妇人心蛊']) {
      const spec = getGuExpressionSpec(guName);
      expect(spec?.realmScope, guName).toBe('mortal_forbidden');
      expect(spec?.availability, guName).toBe('scene_gated');
      expect(spec?.targetRule, guName).toMatch(/scene|sacrifice|corpse/);
    }
  });

  it('records first-set Gu missing from legacy gu-database as v0.8 expression canon instead of AI inventions', () => {
    const guDatabase = guDatabaseRaw as Record<string, unknown>;
    const missingFromLegacyDb = REQUIRED_GU.filter(guName => !guDatabase[guName]);

    expect(missingFromLegacyDb.length).toBeGreaterThan(0);
    for (const guName of missingFromLegacyDb) {
      const spec = getGuExpressionSpec(guName);
      expect(spec, guName).toBeTruthy();
      expect(['canon', 'canon-near', 'project-canon', 'derived'].includes(spec!.provenance), guName).toBe(true);
    }
  });

  it('defines all first killer move samples with Gu components, failure modes, backlash, and visual beats', () => {
    const moves = listKillerMoveExpressionSpecs();
    const moveNames = new Set(moves.map(move => move.moveName));
    const guNames = new Set(listGuExpressionSpecs().map(spec => spec.guName));

    expect(moves).toHaveLength(15);
    for (const moveName of REQUIRED_KILLER_MOVES) {
      expect(moveNames.has(moveName), moveName).toBe(true);
    }

    for (const move of moves) {
      expect(isRuntimePathAllowed(move.path), `${move.moveName}.path=${move.path}`).toBe(true);
      expect(move.coreGu.length, `${move.moveName}.coreGu`).toBeGreaterThanOrEqual(1);
      expect(move.visualBeats.length, `${move.moveName}.visualBeats`).toBeGreaterThanOrEqual(3);
      expect(move.failureMode.length, `${move.moveName}.failureMode`).toBeGreaterThan(8);
      expect(move.backlash.length, `${move.moveName}.backlash`).toBeGreaterThan(4);
      expect(move.boardPattern.area, `${move.moveName}.boardPattern.area`).toBeGreaterThanOrEqual(1);
      for (const guName of [...move.coreGu, ...move.auxiliaryGu]) {
        expect(guNames.has(guName), `${move.moveName}.${guName}`).toBe(true);
      }
    }
  });

  it('exposes scene utilities and draftable BattleResolutionStep data for UI playback', () => {
    const utilities = listSceneUtilitiesForGu(['月光蛊', '侦察蛊', '酒虫']);
    expect(utilities).toContain('cut_rope');
    expect(utilities).toContain('spot_ambush');
    expect(utilities).toContain('refine_primeval_essence');

    const step = buildGuResolutionStepDraft('月光蛊', {
      round: 1,
      actorId: 'player',
      targetIds: ['enemy-1'],
      affectedCellIds: ['c2'],
    });

    expect(step?.kind).toBe('gu_use');
    expect(step?.sourceName).toBe('月光蛊');
    expect(step?.visual.motif).toBe('crescent_blade');
    expect(step?.tags).toContain('光道');

    const blocked = buildGuResolutionStepDraft('妇人心蛊', {
      round: 2,
      actorId: 'player',
      blockedReason: '缺少尸体或毒道场景门槛',
    });
    expect(blocked?.kind).toBe('failure');
    expect(blocked?.blockedReason).toContain('场景门槛');
  });

  it('keeps JSON metadata synchronized with entry counts', () => {
    expect((guExpressionSpecsRaw as any)._meta.entryCount).toBe((guExpressionSpecsRaw as any).entries.length);
    expect((killerMoveExpressionSpecsRaw as any)._meta.entryCount).toBe((killerMoveExpressionSpecsRaw as any).entries.length);
  });

  it('maps every narrative scene utility into fixed v0.8 Gu affordance categories', () => {
    expect(validateNarrativeGuUtilityMap()).toEqual([]);
    expect(NARRATIVE_GU_AFFORDANCE_CATEGORIES).toEqual([
      'reconnaissance',
      'tracking',
      'healing',
      'detox',
      'obstacle_breaking',
      'concealment',
      'intimidation',
      'forbidden_ritual',
      'mobility',
      'protection',
      'control',
      'signal',
      'survival',
      'refinement',
    ]);
    expect(getNarrativeGuUtilityCategory('spot_ambush')?.id).toBe('reconnaissance');
    expect(getNarrativeGuUtilityCategory('follow_fugitive')?.id).toBe('tracking');
    expect(getNarrativeGuUtilityCategory('save_wounded_ally')?.id).toBe('healing');
    expect(getNarrativeGuUtilityCategory('remove_low_poison')?.id).toBe('detox');
    expect(getNarrativeGuUtilityCategory('cut_rope')?.id).toBe('obstacle_breaking');
    expect(getNarrativeGuUtilityCategory('hide_in_moon_shadow')?.id).toBe('concealment');
    expect(getNarrativeGuUtilityCategory('intimidate_mortal')?.id).toBe('intimidation');
    expect(getNarrativeGuUtilityCategory('forbidden_array')?.id).toBe('forbidden_ritual');
  });

  it('supports every Gu and killer move board shape in battlefield combat rules', () => {
    const rules = battlefieldCombatRulesRaw as any;
    const guShapes = new Set(Object.keys(rules.guShapes));
    const killerMoveShapes = new Set(Object.keys(rules.killerMoveShapes));

    for (const spec of listGuExpressionSpecs()) {
      expect(guShapes.has(spec.range.shape), `${spec.guName}.range.shape=${spec.range.shape}`).toBe(true);
    }
    for (const move of listKillerMoveExpressionSpecs()) {
      expect(killerMoveShapes.has(move.boardPattern.shape), `${move.moveName}.boardPattern.shape=${move.boardPattern.shape}`).toBe(true);
    }
  });

  it('lets the battlefield target enumerator handle all direct Gu while excluding passive and scene-gated buttons', () => {
    const specs = listGuExpressionSpecs();
    const directGuNames = specs.filter(isGuNormalCombatUsable).map(spec => spec.guName);
    const state = createBattlefieldCombatState({
      battleId: 'expression-target-enumeration',
      seed: 'expression-target-enumeration',
      units: [
        {
          id: 'player',
          name: 'player',
          side: 'player',
          cellId: 'c0_1',
          realmNum: 3,
          path: '光道',
          hp: 100,
          maxHp: 100,
          essence: { current: 1000, max: 1000, type: 'primeval' },
          guNames: directGuNames,
          killerMoveNames: [],
          statusEffects: [],
        },
        {
          id: 'enemy',
          name: 'enemy',
          side: 'enemy',
          cellId: 'c2_1',
          realmNum: 3,
          path: '土道',
          hp: 100,
          maxHp: 100,
          essence: { current: 100, max: 100, type: 'primeval' },
          guNames: [],
          killerMoveNames: [],
          statusEffects: [],
        },
      ],
    });

    for (const spec of specs.filter(isGuNormalCombatUsable)) {
      const targets = listBattlefieldActionTargets(state, {
        type: 'gu',
        actorId: 'player',
        guName: spec.guName,
      });
      expect(targets.tags, spec.guName).toContain(spec.range.shape);
      expect(Array.isArray(targets.validTargetCellIds), spec.guName).toBe(true);
    }

    for (const spec of specs.filter(spec => isGuPassive(spec) || isGuSceneGated(spec))) {
      expect(isGuNormalCombatUsable(spec), spec.guName).toBe(false);
    }
  });
});
