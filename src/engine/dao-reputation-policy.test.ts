import { describe, expect, it } from 'vitest';
import {
  applyDaoHeartEvent,
  calculateReputationTier,
  describeDaoHeartNarrativeBias,
  describeReputationEffects,
  getDaoHeartEventPolicy,
  getReputationEventPolicy,
} from './dao-reputation-policy';

describe('dao-reputation-policy', () => {
  it('links narrative events to Dao Heart changes', () => {
    const policy = getDaoHeartEventPolicy('betray');
    const next = applyDaoHeartEvent({ kill: 0, mercy: 0, scheme: 0, ambition: 0 }, policy);

    expect(next.scheme).toBe(2);
    expect(next.ambition).toBe(1);
    expect(describeDaoHeartNarrativeBias({ ...next, scheme: 5 })).toContain(
      '谋略偏高：剧情应提供布局、伪装、谈判和反制选项。',
    );
  });

  it('turns reputation into benefits and risks instead of a naked number', () => {
    expect(calculateReputationTier(85)).toBe('崇拜');
    expect(calculateReputationTier(-85)).toBe('死敌');

    const friendly = describeReputationEffects(60);
    expect(friendly.benefits.join('|')).toContain('情报');

    const hostile = describeReputationEffects(-60);
    expect(hostile.risks.join('|')).toContain('追踪');

    const betrayal = getReputationEventPolicy('betray');
    expect(betrayal.righteousDelta).toBeLessThan(0);
    expect(betrayal.merchantDelta).toBeLessThan(0);
  });
});
