import { describe, expect, it } from 'vitest';
import { sanitizeNarrativeConsistency } from './narrative-consistency';
import type { NarrativeJSON } from '../types';

function narrative(text: string, choices: any[] = []): NarrativeJSON {
  return {
    narrative: { text, choices },
    state_update: {},
  } as any;
}

const store = {
  vitals: { essence: { current: 65, max: 100 } },
  inventory: [{ id: 'moonlight', name: '月光蛊', specId: '月光蛊' }],
  flags: {},
};

describe('narrative-consistency', () => {
  it('prevents high essence states from being described as nearly exhausted', () => {
    const result = sanitizeNarrativeConsistency(narrative('你退到树后，真元所剩无几。'), store);
    expect(result.narrative.narrative.text).toContain('真元尚余过半');
    expect(result.rewardIssues.some(issue => issue.kind === 'essence_text_mismatch')).toBe(true);
  });

  it('downgrades choices that try to use a Gu the player does not own', () => {
    const result = sanitizeNarrativeConsistency(narrative('你听见风声。', [
      { id: 'c1', text: '使用寻物蛊追踪线索', risk: 'low', risk_note: '' },
    ]), store);
    expect(result.narrative.narrative.choices[0].text).toContain('寻找「寻物蛊」线索');
    expect(result.choiceIssues[0].name).toBe('寻物蛊');
  });

  it('turns narrative-only unknown Gu rewards into discoveries', () => {
    const result = sanitizeNarrativeConsistency(narrative('你获得了寻物蛊，收入怀中。'), store);
    expect(result.narrative.narrative.text).toContain('听闻了「寻物蛊」线索');
    expect((result.narrative.state_update as any).discoveries.add[0].name).toBe('寻物蛊');
  });
});
