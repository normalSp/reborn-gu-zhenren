import { describe, expect, it } from 'vitest';
import {
  buildNarrativeReturnContext,
  createWorldActionCandidate,
  createWorldActionDeparture,
  createWorldActionResolution,
  formatNarrativeReturnContext,
  projectWorldActionLedgerEntry,
} from './v090-world-action-protocol';

describe('v0.9.0-b1 world action protocol', () => {
  it('normalizes a candidate and departure without letting AI own final facts', () => {
    const candidate = createWorldActionCandidate({
      domain: 'training_ground',
      sourceId: 'tg_nanjiang_refine',
      title: '南疆炼道道场线索',
      summary: '洞壁有炼道刻痕，可出发侦察。',
      source: 'ai-rumor',
      sceneId: 'qingmao:41:night',
      apCost: 1,
      risk: 'high',
      warnings: ['可能有兽群窥伺'],
      createdTurn: 41,
    });
    const departure = createWorldActionDeparture({ candidate, mode: 'local_resolution' });

    expect(candidate.apCost).toBe(1);
    expect(candidate.source).toBe('ai-rumor');
    expect(departure.chargeAp).toBe(true);
    expect(departure.blockers).toEqual([]);
  });

  it('projects one formal action into one AP ledger entry', () => {
    const candidate = createWorldActionCandidate({
      domain: 'inheritance',
      title: '石缝传承线索',
      summary: '只允许登记为候选，奖励由本地试炼决定。',
      sceneId: 'qingmao:42:dawn',
      apCost: 1,
      createdTurn: 42,
    });
    const departure = createWorldActionDeparture({ candidate, mode: 'narrative_return' });
    const resolution = createWorldActionResolution({
      departure,
      status: 'pending_narrative',
      summary: '玩家已出发检查石缝传承封印。',
      localFacts: ['玩家消耗 1 AP 出发检查石缝传承封印。'],
      rewardPolicy: 'local_engine_only',
    });
    const ledger = projectWorldActionLedgerEntry({ departure, resolution });

    expect(ledger.actionType).toBe('inheritance');
    expect(ledger.cost).toBe(1);
    expect(ledger.systemResult.worldAction).toMatchObject({
      candidateId: candidate.id,
      departureId: departure.id,
      resolutionId: resolution.id,
      status: 'pending_narrative',
      rewardPolicy: 'local_engine_only',
    });
  });

  it('formats return context with mutation boundaries for the next DeepSeek prompt', () => {
    const candidate = createWorldActionCandidate({
      domain: 'calamity',
      title: '空窍灾劫预兆',
      summary: '本地系统登记灾劫压力，AI 只能承接氛围。',
      sceneId: 'aperture:80:storm',
      apCost: 0,
      createdTurn: 80,
    });
    const departure = createWorldActionDeparture({ candidate, mode: 'local_resolution', chargeAp: false });
    const resolution = createWorldActionResolution({
      departure,
      summary: '灾劫压力已由本地系统登记。',
      localFacts: ['空窍灾劫压力增加，但后果尚未结算。'],
      risks: ['灾劫后果不得由 AI 判定'],
      rewardPolicy: 'none',
    });
    const ledger = projectWorldActionLedgerEntry({ departure, resolution });
    const context = buildNarrativeReturnContext({
      sceneId: candidate.sceneId,
      turn: 80,
      ledgerEntries: [ledger],
      resolutions: [resolution],
    });
    const prompt = formatNarrativeReturnContext(context);

    expect(context.ledgerEntryIds).toEqual([ledger.id]);
    expect(prompt).toContain('空窍灾劫压力增加');
    expect(prompt).toContain('不得改写 AP、资源、奖励');
  });
});
