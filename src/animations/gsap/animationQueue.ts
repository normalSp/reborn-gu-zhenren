// ═══════════════════════════════════════════════════════════
// M7 Phase 2: GSAP 全局动画队列
// 防止多个场景动画同时播放导致的性能崩溃
// 最大同时活跃 3 个 Timeline，超出排队等待
// ═══════════════════════════════════════════════════════════

import { isReducedMotion } from '../../hooks/useReducedMotion';

type AnimFactory = () => Promise<void> | gsap.core.Timeline;

class AnimationQueue {
  private queue: AnimFactory[] = [];
  private activeCount = 0;
  private readonly maxActive = 3;

  /** 入队一个动画工厂函数，队列满时自动等待 */
  enqueue(factory: AnimFactory): void {
    if (isReducedMotion()) return; // 减少动效模式下跳过所有场景动画
    this.queue.push(factory);
    this.tick();
  }

  /** 清空等待队列 */
  clear(): void {
    this.queue = [];
  }

  private tick(): void {
    if (this.activeCount >= this.maxActive) return;
    const factory = this.queue.shift();
    if (!factory) return;

    this.activeCount++;
    const result = factory();

    const done = () => {
      this.activeCount--;
      this.tick();
    };

    if (result instanceof Promise) {
      result.then(done, done);
    } else {
      // gsap.core.Timeline
      result.then(done);
      // result.eventCallback('onComplete', done);
    }
  }
}

/** 全局单例动画队列 */
export const animQueue = new AnimationQueue();
