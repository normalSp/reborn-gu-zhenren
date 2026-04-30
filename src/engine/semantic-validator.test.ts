import { describe, it, expect } from 'vitest';
import { validateNarrativeSemantics } from './semantic-validator';

describe('Layer 3 语义规则引擎', () => {
  it('R01: 越级反杀检测—违规文本应被拦截', () => {
    const text = '你以一转修为击败了三转蛊师，越级反杀令人震惊';
    const result = validateNarrativeSemantics(text);
    const r01 = result.results.find(r => r.ruleId === 'R01')!;
    expect(r01.passed).toBe(false);
  });

  it('R01: 正常描述不触发越级反杀', () => {
    const text = '三转蛊师冷漠地看着你这只一转蝼蚁，你感到无法反抗';
    const result = validateNarrativeSemantics(text);
    const r01 = result.results.find(r => r.ruleId === 'R01')!;
    expect(r01.passed).toBe(true);
  });

  it('R02: NPC无条件信任应被拦截', () => {
    const text = '老蛊师露出微笑，拍了拍你的肩膀说：我欣赏你，全力支持你，免费送你蛊虫';
    const result = validateNarrativeSemantics(text);
    const r02 = result.results.find(r => r.ruleId === 'R02')!;
    expect(r02.passed).toBe(false);
  });

  it('R03: 机缘无代价应被警告', () => {
    const text = '你不费吹灰之力轻松获得了天大的机缘';
    const result = validateNarrativeSemantics(text);
    const r03 = result.results.find(r => r.ruleId === 'R03')!;
    expect(r03.passed).toBe(false);
  });

  it('R04: 叙事基调非黑暗应被警告', () => {
    const text = '你感到热血沸腾充满希望前途无量，庆幸自己走上了美好的修仙之路';
    const result = validateNarrativeSemantics(text);
    const r04 = result.results.find(r => r.ruleId === 'R04')!;
    expect(r04.passed).toBe(false);
  });

  it('R04: 黑暗基调文本通过', () => {
    const text = '你感到绝望和恐惧，这个世界残酷而黑暗，你艰难地挣扎求生';
    const result = validateNarrativeSemantics(text);
    const r04 = result.results.find(r => r.ruleId === 'R04')!;
    expect(r04.passed).toBe(true);
  });

  it('R06: 方源信任描写应被警告', () => {
    const text = '方源对你露出了友善的笑容，尊重你的意见并帮助你';
    const result = validateNarrativeSemantics(text);
    const r06 = result.results.find(r => r.ruleId === 'R06')!;
    expect(r06.passed).toBe(false);
  });

  it('Critical违规应返回reject', () => {
    const text = '你越级击败了三转蛊师，秒杀了对方。老蛊师免费赠送你资源，无条件信任你';
    const result = validateNarrativeSemantics(text);
    expect(result.recommendation).toBe('reject');
  });

  it('正常黑暗叙事应通过', () => {
    const text = '你小心谨慎地走进阴暗的洞窟，内心充满恐惧。每一步都在犹豫——这里可能藏着机缘，但也可能藏着致命的危险。你深知在这个残酷的世界里，没有什么是不需要付出代价的。';
    const result = validateNarrativeSemantics(text);
    expect(result.passed).toBe(true);
  });
});
