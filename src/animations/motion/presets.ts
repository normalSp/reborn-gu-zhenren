// ═══════════════════════════════════════════════
// M7 Phase 1: Motion Variant 预设
// 所有预设使用 CSS GPU 合成属性: transform, opacity
// ═══════════════════════════════════════════════

import type { Variants } from 'framer-motion';
import { GU_SPRING_DEFAULT, GU_SPRING_PANEL, GU_SPRING_BOUNCE } from './springTokens';

/** 向上淡入（页面/段落入场） */
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: GU_SPRING_DEFAULT,
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.2 },
  },
};

/** 向左滑入（导航/返回面板） */
export const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: GU_SPRING_PANEL,
  },
  exit: {
    opacity: 0,
    x: -12,
    transition: { duration: 0.2 },
  },
};

/** 向右滑入（新面板/详情） */
export const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: GU_SPRING_PANEL,
  },
  exit: {
    opacity: 0,
    x: 12,
    transition: { duration: 0.2 },
  },
};

/** 缩放入场（Modal/Dialog） */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: GU_SPRING_DEFAULT,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.15 },
  },
};

/** 列表 Stagger（选项/卡片列表） */
export const staggerList: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

/** 向下淡出（Toast/通知退场） */
export const slideDownExit: Variants = {
  initial: { opacity: 0, y: -40, scale: 0.95 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: GU_SPRING_BOUNCE,
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.95,
    transition: { duration: 0.2 },
  },
};

/** 危险脉冲（红框闪烁/伤害预示） — P4: 硬编码色→CSS Token */
export const dangerPulse = {
  initial: { boxShadow: '0 0 0px var(--gu-life-crimson-dim)' },
  animate: {
    boxShadow: [
      '0 0 0px var(--gu-life-crimson-dim)',
      '0 0 12px var(--gu-life-crimson)',
      '0 0 0px var(--gu-life-crimson-dim)',
    ],
    transition: {
      duration: 1.6,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};
