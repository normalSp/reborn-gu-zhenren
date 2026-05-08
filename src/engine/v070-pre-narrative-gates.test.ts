import { describe, expect, it } from 'vitest';
import { NarrativeJSONSchema } from '../schemas/narrative.schema';
import { contextBuilder } from './context-builder';
import { buildDeathRecordFallback } from './death-record';
import battleDesignPack from '../canon/battle-design-pack.json';
import battleAssetManifest from '../canon/battle-asset-manifest.json';
import squadGrowthDesignSpec from '../canon/squad-growth-design-spec.json';
import { createFactionSlice } from '../store/slices/factionSlice';
import { createGameLogSlice } from '../store/slices/gameLogSlice';

function createHarness<T>(factory: (set: any, get: any) => T, initial: Record<string, any> = {}) {
  let state: Record<string, any> = { ...initial };
  const set = (patch: any) => {
    const next = typeof patch === 'function' ? patch(state) : patch;
    state = { ...state, ...next };
  };
  const get = () => state;
  const slice = factory(set, get);
  state = { ...slice, ...state };
  return {
    get state() {
      return state;
    },
  };
}

function minimalStore(overrides: Record<string, any> = {}) {
  return {
    profile: { name: '', realm: { label: '一转初阶', grand: 1 } },
    attributes: { 资质: 5, 体魄: 5, 心智: 5, 气运: 5 },
    vitals: { health: { current: 100, max: 100 }, essence: { current: 100, max: 100 } },
    pathBuild: { primary: '', secondary: [], path_levels: {}, dao_marks: {} },
    daoHeart: { kill: 0, mercy: 0, scheme: 0, ambition: 0 },
    inventory: [],
    flags: {},
    messages: [],
    keyEvents: [],
    rollingSummary: '',
    ...overrides,
  } as any;
}

describe('v0.7.0-pre narrative closure gates', () => {
  it('anchors the player as an original participant instead of Fang Yuan', () => {
    const stateJson = contextBuilder.buildPlayerStateJSON(minimalStore());
    const parsed = JSON.parse(stateJson);

    expect(parsed.name).toBe('无名蛊师');
    expect(parsed.playerIdentity.playerRole).toBe('original_participant');
    expect(parsed.playerIdentity.canonIdentityGuard).toContain('方源只能作为原著NPC');
  });

  it('accepts npc_contacts in AI state_update for codex character encyclopedia', () => {
    const parsed = NarrativeJSONSchema.parse({
      narrative: {
        text: '商队午后停在山道边，护卫们低声谈起商心慈，言语中带着几分敬意。你没有贸然靠近，只把这个名字记下，准备等入夜后再打听她与张家的关系。',
        choices: [{ id: 'c1', text: '继续打听商心慈', risk: 'low', risk_note: '可能暴露好奇心' }],
      },
      state_update: {
        npc_contacts: {
          add: [{ name: '商心慈', source: 'canon', status: 'heard', location: '南疆商路', summary: '商队中被多次提及的少女。' }],
        },
      },
    });

    expect(parsed.state_update?.npc_contacts?.add?.[0]?.name).toBe('商心慈');
  });

  it('accepts scene-gated Gu use suggestions without granting execution authority to AI', () => {
    const parsed = NarrativeJSONSchema.parse({
      narrative: {
        text: '毒雾散开后，地上只剩一具敌尸，衣襟间还残留着毒囊与血痕。你想起妇人心蛊的炼毒法门，但这种事若不合场景、目标与代价，绝不能随手发动，更不能让叙事模型直接改写数值。',
        choices: [{ id: 'c1', text: '先检查尸体与毒囊', risk: 'medium', risk_note: '可能暴露毒道手段' }],
      },
      state_update: {
        gu_use_suggestions: {
          add: [{
            guName: '妇人心蛊',
            target: { type: 'scene_target', name: '敌尸' },
            sceneValidated: true,
            sceneTags: ['毒道', '尸体'],
            reason: '剧情中出现合规尸体目标，但仍需引擎检查玩家是否持有该蛊。',
          }],
        },
      },
    });

    expect(parsed.state_update?.gu_use_suggestions?.add?.[0]?.guName).toBe('妇人心蛊');
  });

  it('merges contact status and increments known npc count only once', () => {
    const harness = createHarness(createFactionSlice, { turn: 3, currentChapterId: 'shangdu' });

    harness.state.addNpcContact({ name: '白凝冰', source: 'canon', status: 'heard' });
    harness.state.addNpcContact({ name: '白凝冰', source: 'canon', status: 'interacted', summary: '短暂交锋后留下深刻印象。' });

    expect(harness.state.npcContacts).toHaveLength(1);
    expect(harness.state.npcContacts[0].status).toBe('interacted');
    expect(harness.state.knownNpcCount).toBe(1);
  });

  it('archives ordinary logs while preserving critical logs', () => {
    const harness = createHarness(createGameLogSlice, { turn: 1, profile: { name: '测试', realm: { label: '一转初阶' } } });
    for (let i = 0; i < 5; i++) {
      harness.state.addGameLog('system', `普通事件${i}`, { importance: 1 });
    }
    harness.state.addGameLog('death', '道陨', { importance: 3, detail: '生命耗尽。' });

    harness.state.archiveGameLog(2);

    expect(harness.state.gameLog.some((entry: any) => entry.category === 'death')).toBe(true);
    expect(harness.state.gameLogArchive.length).toBeGreaterThan(0);
  });

  it('generates a complete local death record fallback', () => {
    const record = buildDeathRecordFallback({
      profile: { name: '寒舟', realm: { label: '三转中阶' } },
      deathCause: '炼蛊反噬',
      deathTurn: 88,
      currentDomain: '南疆',
      unlockedAchievements: ['first_refine'],
      keyEvents: [{ summary: '夺得一份残方' }],
      characterRelations: [{ name: '商心慈' }],
    });

    expect(record.lifeSummary).toContain('寒舟');
    expect(record.closingPoem).toContain('炼蛊反噬');
    expect(record.majorChoices).toContain('夺得一份残方');
    expect(record.generatedAt).toBeTruthy();
  });

  it('keeps the battle and squad design pack executable for v0.7.0-a/b/c', () => {
    expect(battleDesignPack.engineModel).toBe('deterministic_with_controlled_llm_events');
    expect(battleDesignPack.roundStructure).toContain('第三方事件判定');
    expect(battleAssetManifest.entries.every(entry => entry.runtimePhase && entry.triggerTags.length > 0)).toBe(true);
    expect(squadGrowthDesignSpec.dispatchTaskTypes).toContain('拉拢NPC');
    expect(squadGrowthDesignSpec.betrayalThreshold).toBeLessThan(50);
  });
});
