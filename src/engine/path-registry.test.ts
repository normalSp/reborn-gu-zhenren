import { describe, expect, it } from 'vitest';
import { isAuctionable } from './auction-engine';
import { assertRuntimePathAllowed, getRuntimePathNames, isRuntimePathAllowed } from './path-registry';

describe('原著流派运行时注册表', () => {
  it('允许原著确认流派进入运行时系统', () => {
    expect(isRuntimePathAllowed('毒道')).toBe(true);
    expect(isRuntimePathAllowed('骨道')).toBe(true);
    expect(isRuntimePathAllowed('剑道')).toBe(true);
    expect(isRuntimePathAllowed('音道')).toBe(true);
  });

  it('拒绝自创流派与功能类别 path', () => {
    expect(isRuntimePathAllowed('生死道')).toBe(false);
    expect(isRuntimePathAllowed('太古')).toBe(false);
    expect(isRuntimePathAllowed('特殊')).toBe(false);
    expect(isRuntimePathAllowed('侦察')).toBe(false);
    expect(() => assertRuntimePathAllowed('生死道', '起死回生蛊')).toThrow(/生死道/);
  });

  it('角色创建可选流派列表不包含 blocked/category/prototype 项', () => {
    const names = getRuntimePathNames();
    expect(names).toContain('气道');
    expect(names).toContain('偷道');
    expect(names).not.toContain('生死道');
    expect(names).not.toContain('阴阳道');
    expect(names).not.toContain('太道');
    expect(names).not.toContain('通用');
  });

  it('非法 path 的仙蛊不得进入宝黄天运行时池', () => {
    expect(isAuctionable('起死回生蛊', 8, '生死道')).toBe(false);
    expect(isAuctionable('态度蛊', 8, '太古')).toBe(false);
  });
});
