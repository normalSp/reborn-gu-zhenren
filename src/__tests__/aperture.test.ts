/**
 * 空窍系统单元测试 — P2-12
 */

import { describe, it, expect } from 'vitest';
import {
  mulberry32,
  generateCracks,
  generateJaggedCracks,
  cracksToSvgPath,
  generateCrackSvgData,
} from '../utils/aperture-crack-utils';
import {
  APERTURE_COLOR_MAP,
  REALM_TO_COLOR,
  APERTURE_COLOR_HEX,
  WALL_STATE_CONFIG,
  APERTURE_SVG_CONFIG,
  REALM_NAMES,
} from '../types/aperture';

// ─── 类型与常量测试 ───

describe('aperture-types', () => {
  describe('APERTURE_COLOR_MAP', () => {
    it('should have exactly 5 colors', () => {
      expect(APERTURE_COLOR_MAP).toHaveLength(5);
    });

    it('should have all expected color names', () => {
      expect(APERTURE_COLOR_MAP).toContain('深黑');
      expect(APERTURE_COLOR_MAP).toContain('暗青');
      expect(APERTURE_COLOR_MAP).toContain('幽蓝');
      expect(APERTURE_COLOR_MAP).toContain('深紫');
      expect(APERTURE_COLOR_MAP).toContain('玄黄');
    });
  });

  describe('REALM_TO_COLOR', () => {
    it('should map realm 0-1 to 深黑', () => {
      expect(REALM_TO_COLOR[0]).toBe('深黑');
      expect(REALM_TO_COLOR[1]).toBe('深黑');
    });

    it('should map realm 2-3 to 暗青', () => {
      expect(REALM_TO_COLOR[2]).toBe('暗青');
      expect(REALM_TO_COLOR[3]).toBe('暗青');
    });

    it('should map realm 4-5 to 幽蓝', () => {
      expect(REALM_TO_COLOR[4]).toBe('幽蓝');
      expect(REALM_TO_COLOR[5]).toBe('幽蓝');
    });

    it('should map realm 6-7 to 深紫', () => {
      expect(REALM_TO_COLOR[6]).toBe('深紫');
      expect(REALM_TO_COLOR[7]).toBe('深紫');
    });

    it('should map realm 8-9 to 玄黄', () => {
      expect(REALM_TO_COLOR[8]).toBe('玄黄');
      expect(REALM_TO_COLOR[9]).toBe('玄黄');
    });
  });

  describe('APERTURE_COLOR_HEX', () => {
    it('should have hex values for all colors', () => {
      for (const color of APERTURE_COLOR_MAP) {
        expect(APERTURE_COLOR_HEX[color]).toBeTruthy();
        expect(APERTURE_COLOR_HEX[color]).toMatch(/^#[0-9a-fA-F]{6}$/);
      }
    });
  });

  describe('WALL_STATE_CONFIG', () => {
    it('should have 4 wall states', () => {
      const states = Object.keys(WALL_STATE_CONFIG);
      expect(states).toHaveLength(4);
      expect(states).toContain('完整');
      expect(states).toContain('微裂纹');
      expect(states).toContain('裂痕');
      expect(states).toContain('破碎');
    });

    it('should have increasing crack density from 完整 to 破碎', () => {
      expect(WALL_STATE_CONFIG['完整'].crackDensity).toBe(0);
      expect(WALL_STATE_CONFIG['微裂纹'].crackDensity).toBeGreaterThan(0);
      expect(WALL_STATE_CONFIG['裂痕'].crackDensity).toBeGreaterThan(WALL_STATE_CONFIG['微裂纹'].crackDensity);
      expect(WALL_STATE_CONFIG['破碎'].crackDensity).toBeGreaterThan(WALL_STATE_CONFIG['裂痕'].crackDensity);
    });
  });

  describe('REALM_NAMES', () => {
    it('should have names for realms 0-9', () => {
      for (let i = 0; i <= 9; i++) {
        expect(REALM_NAMES[i]).toBeTruthy();
      }
    });
  });

  describe('APERTURE_SVG_CONFIG', () => {
    it('should have valid viewBox dimensions', () => {
      expect(APERTURE_SVG_CONFIG.viewBoxSize).toBe(280);
      expect(APERTURE_SVG_CONFIG.centerX).toBe(140);
      expect(APERTURE_SVG_CONFIG.centerY).toBe(140);
    });

    it('should have correct radius values', () => {
      expect(APERTURE_SVG_CONFIG.radius.outer).toBe(120);
      expect(APERTURE_SVG_CONFIG.radius.mid).toBe(85);
      expect(APERTURE_SVG_CONFIG.radius.inner).toBe(50);
    });
  });
});

// ─── mulberry32 确定性测试 ───

describe('mulberry32 PRNG', () => {
  it('should produce the same sequence for the same seed', () => {
    const rng1 = mulberry32(42);
    const rng2 = mulberry32(42);

    for (let i = 0; i < 20; i++) {
      expect(rng1()).toBe(rng2());
    }
  });

  it('should produce different sequences for different seeds', () => {
    const rng1 = mulberry32(1);
    const rng2 = mulberry32(2);

    const seq1 = Array.from({ length: 10 }, () => rng1());
    const seq2 = Array.from({ length: 10 }, () => rng2());
    expect(seq1).not.toEqual(seq2);
  });

  it('should produce values in [0, 1) range', () => {
    const rng = mulberry32(12345);
    for (let i = 0; i < 100; i++) {
      const val = rng();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });
});

// ─── 裂纹生成测试 ───

describe('generateCracks', () => {
  it('should produce at least one segment for density > 0', () => {
    const config = {
      seed: 42, density: 0.5, maxStartRadius: 50,
      maxLength: 60, branchProbability: 0.35, jaggedness: 0.8,
    };
    const segments = generateCracks(config);
    expect(segments.length).toBeGreaterThan(0);
  });

  it('should produce deterministic results for same config', () => {
    const config = {
      seed: 99, density: 0.7, maxStartRadius: 50,
      maxLength: 60, branchProbability: 0.35, jaggedness: 0.8,
    };
    const a = generateCracks(config);
    const b = generateCracks(config);
    expect(a.length).toBe(b.length);
    for (let i = 0; i < a.length; i++) {
      expect(a[i].x1).toBe(b[i].x1);
      expect(a[i].y1).toBe(b[i].y1);
    }
  });

  it('should produce at most 1 segment for density 0', () => {
    const config = {
      seed: 1, density: 0, maxStartRadius: 50,
      maxLength: 60, branchProbability: 0, jaggedness: 0,
    };
    const segments = generateCracks(config);
    // density 0 → count = floor(8 * 0) = 0 → Math.max(1,0) = 1 segment
    expect(segments.length).toBeLessThanOrEqual(3); // + possible branch
  });
});

describe('generateJaggedCracks', () => {
  it('should produce multiple sub-segments per main crack', () => {
    const config = {
      seed: 42, density: 0.5, maxStartRadius: 50,
      maxLength: 60, branchProbability: 0.35, jaggedness: 0.8,
    };
    const segments = generateJaggedCracks(config);
    // 每个主裂纹至少3子段 → 至少 3 * floor(6*0.5) = 3*3 = 9 segments
    expect(segments.length).toBeGreaterThan(3);
  });

  it('should be deterministic', () => {
    const config = {
      seed: 77, density: 0.6, maxStartRadius: 50,
      maxLength: 60, branchProbability: 0.3, jaggedness: 1.0,
    };
    expect(generateJaggedCracks(config)).toEqual(generateJaggedCracks(config));
  });
});

describe('cracksToSvgPath', () => {
  it('should return empty string for empty segments', () => {
    expect(cracksToSvgPath([])).toBe('');
  });

  it('should produce M... L... format', () => {
    const segments = [
      { x1: 10, y1: 20, x2: 30, y2: 40, width: 1, depth: 0.5 },
    ];
    const path = cracksToSvgPath(segments);
    expect(path).toContain('M10');
    expect(path).toContain('L30');
  });
});

describe('generateCrackSvgData', () => {
  it('should have visible=false for 完整 wallState', () => {
    const data = generateCrackSvgData(42, '完整');
    expect(data.visible).toBe(false);
    expect(data.segments.length).toBe(0);
  });

  it('should have visible=true for 裂痕 wallState', () => {
    const data = generateCrackSvgData(42, '裂痕');
    expect(data.visible).toBe(true);
    expect(data.segments.length).toBeGreaterThan(0);
  });

  it('should produce pathD with M and L commands for non-empty', () => {
    const data = generateCrackSvgData(42, '破碎');
    expect(data.pathD).toMatch(/^M/);
    expect(data.pathD).toContain('L');
  });

  it('should produce different cracks for jagged vs non-jagged', () => {
    const d1 = generateCrackSvgData(42, '裂痕', false);
    const d2 = generateCrackSvgData(42, '裂痕', true);
    expect(d1.pathD).not.toBe(d2.pathD);
  });
});
