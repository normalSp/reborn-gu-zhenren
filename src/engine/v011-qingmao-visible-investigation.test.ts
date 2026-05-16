import { describe, expect, it } from 'vitest';
import { createInitialLivingWorldState } from '../store/defaultLivingWorldState';
import { adjudicateWorldIntent, type WorldIntentContext } from './v011-world-intent-engine';
import { resolveQingmaoVisibleInvestigation } from './v011-qingmao-visible-investigation';

const qingmaoContext: WorldIntentContext = {
  actorId: 'player',
  turn: 16,
  regionId: 'qingmao_three_clans',
  selectedStartProfileId: 'start_qingmaoshan_guyue',
  playerRealmGrand: 1,
  timelineMode: 'canon',
  livingWorldState: createInitialLivingWorldState({ worldClock: { turn: 16 } } as any),
};

function adjudicate(text: string) {
  return adjudicateWorldIntent({
    ...qingmaoContext,
    rawText: text,
    source: 'player_input',
  });
}

describe('v0.11.0-b2 Qingmao visible-scope investigation', () => {
  it('turns visible Bai clan investigation into living-world known facts', () => {
    const adjudication = adjudicate('我要调查白家');
    const result = resolveQingmaoVisibleInvestigation({
      adjudication,
      livingWorldState: qingmaoContext.livingWorldState,
    });

    expect(adjudication.candidate.intentType).toBe('investigate');
    expect(result.success).toBe(true);
    expect(result.blocked).toBe(false);
    expect(result.knownFacts.map(fact => fact.id)).toEqual([
      'qingmao_three_clans_layout',
      'baijia_bai_ning_bing_public_talent',
    ]);
    expect(result.hiddenFactRefs).toEqual([]);
    expect(result.factionPressure).toEqual([
      expect.objectContaining({
        factionId: 'baijia_zhai',
        pressureType: 'opportunity',
        visibility: 'player_visible',
      }),
    ]);
    expect(result.actionConsequences).toEqual([
      expect.objectContaining({
        actionId: result.actionId,
        scope: 'region',
        effectRefs: expect.arrayContaining([
          'qingmao_three_clans_layout',
          'baijia_bai_ning_bing_public_talent',
          result.factionPressure[0].id,
        ]),
      }),
    ]);
    expect(result.deepSeekVisibleFactIds).toEqual([
      'qingmao_three_clans_layout',
      'baijia_bai_ning_bing_public_talent',
    ]);
  });

  it('records spirit-spring hidden refs without exposing hidden summaries', () => {
    const adjudication = adjudicate('我要调查灵泉');
    const result = resolveQingmaoVisibleInvestigation({
      adjudication,
      livingWorldState: qingmaoContext.livingWorldState,
    });

    expect(result.success).toBe(false);
    expect(result.blocked).toBe(true);
    expect(result.knownFacts).toEqual([]);
    expect(result.factionPressure).toEqual([]);
    expect(result.hiddenFactRefs).toEqual([
      expect.objectContaining({
        id: 'guyue_spirit_spring_resource_basis',
        guard: 'hidden',
      }),
    ]);
    expect(result.rejectedReasons).toEqual(['hidden_fact_ref_only']);
    expect(result.publicSummary).not.toContain('元石');
    expect(result.publicSummary).not.toContain('枯竭');
    expect(JSON.stringify(result.hiddenFactRefs)).not.toContain('summary');
  });

  it('keeps Fang Yuan investigation local and hidden-fact protected', () => {
    const adjudication = adjudicate('我要跟踪方源');
    const result = resolveQingmaoVisibleInvestigation({
      adjudication,
      livingWorldState: qingmaoContext.livingWorldState,
    });

    expect(adjudication.ruling.allowed).toBe(true);
    expect(result.success).toBe(false);
    expect(result.hiddenFactCardIds).toContain('fang_yuan_private_causality_hidden_anchor');
    expect(result.deepSeekVisibleFactIds).not.toContain('fang_yuan_private_causality_hidden_anchor');
    expect(result.actionConsequences).toEqual([
      expect.objectContaining({
        scope: 'npc',
        effectRefs: ['fang_yuan_private_causality_hidden_anchor'],
      }),
    ]);
    expect(result.npcMemories).toEqual([
      expect.objectContaining({
        npcId: 'fang_yuan',
        privateRefId: 'fang_yuan_private_causality_hidden_anchor',
        attitudeDelta: 0,
        tags: expect.arrayContaining(['hidden_fact_protected']),
      }),
    ]);
    expect(result.publicSummary).not.toContain('春秋蝉');
    expect(result.publicSummary).not.toContain('回溯');
    expect(JSON.stringify(result.npcMemories)).not.toContain('春秋蝉');
    expect(JSON.stringify(result.npcMemories)).not.toContain('回溯');
  });

  it('rejects non-investigation adjudications before any state patch', () => {
    const adjudication = adjudicateWorldIntent({
      ...qingmaoContext,
      rawText: '我要逃离青茅山',
      source: 'player_input',
    });
    const result = resolveQingmaoVisibleInvestigation({
      adjudication,
      livingWorldState: qingmaoContext.livingWorldState,
    });

    expect(adjudication.candidate.intentType).toBe('travel');
    expect(result.success).toBe(false);
    expect(result.rejectedReasons).toEqual(['intent_not_investigate']);
    expect(result.knownFacts).toEqual([]);
    expect(result.factionPressure).toEqual([]);
    expect(result.npcMemories).toEqual([]);
    expect(result.actionConsequences).toEqual([]);
  });
});
