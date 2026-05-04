// ═══════════════════════════════════════════════
// M7 Phase 1: 设备性能检测
// 三级性能分级: high / medium / low
// 驱动 GSAP 场景动画的启用/禁用决策
// ═══════════════════════════════════════════════

import { useMemo } from 'react';

export type DeviceTier = 'high' | 'medium' | 'low';

interface DeviceCapability {
  tier: DeviceTier;
  /** 支持 backdrop-filter */
  backdropFilter: boolean;
  /** 低内存模式（禁用 GSAP 场景动画） */
  lowMemory: boolean;
  /** 触屏设备 */
  touchDevice: boolean;
  /** 移动端 */
  mobile: boolean;
}

function detectMemory(): boolean {
  try {
    const nav = navigator as any;
    if (typeof nav.deviceMemory === 'number') {
      return nav.deviceMemory < 4;
    }
    return false;
  } catch {
    return false;
  }
}

function detectTouch(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

function detectMobile(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

function detectBackdropFilter(): boolean {
  return CSS.supports('backdrop-filter', 'blur(1px)');
}

/**
 * 检测设备能力，返回三级性能分级。
 * - 'high': 桌面端，>=4GB RAM → 启用所有动效
 * - 'medium': 移动端/内存 <4GB → 简化 GSAP 场景动画
 * - 'low': 低端移动端/低内存触屏 → 禁用 GSAP，仅保留 Motion 微交互
 *
 * 可用于 useMemo 包裹，避免重复计算。
 */
export function useDeviceCapability(): DeviceCapability {
  return useMemo<DeviceCapability>(() => {
    const lowMemory = detectMemory();
    const touchDevice = detectTouch();
    const mobile = detectMobile();
    const backdropFilter = detectBackdropFilter();

    let tier: DeviceTier = 'high';
    if (mobile && lowMemory) {
      tier = 'low';
    } else if (mobile || lowMemory) {
      tier = 'medium';
    }

    return { tier, backdropFilter, lowMemory, touchDevice, mobile };
  }, []);
}
