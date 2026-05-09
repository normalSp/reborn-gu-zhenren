import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '../../store';
import type { BattleVisualEffectEvent } from '../../types';

export function BattleFlashOverlay() {
  const queue = useStore((s: any) => s.battleVisualQueue ?? []);
  const dequeue = useStore((s: any) => s.dequeueBattleVisualEffect);
  const current = queue[0] as BattleVisualEffectEvent | undefined;
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
    if (!current) return;
    const timer = window.setTimeout(() => {
      dequeue?.();
    }, Math.max(300, current.durationMs));
    return () => window.clearTimeout(timer);
  }, [current?.id, current?.durationMs, dequeue]);

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          key={current.id}
          className="pointer-events-none fixed inset-0 z-[70] flex items-center justify-center overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: current.fadeInMs / 1000 }}
          style={{
            background: `radial-gradient(circle at center, ${current.fallbackTint}55 0%, ${(current.secondaryTint || current.fallbackTint)}28 36%, rgba(0,0,0,0) 74%)`,
          }}
        >
          <div
            className={`battle-flash-motif battle-flash-${current.motif || 'generic'} battle-flash-${current.intensity || 'normal'}`}
            style={{
              ['--battle-flash-primary' as string]: current.fallbackTint,
              ['--battle-flash-secondary' as string]: current.secondaryTint || current.fallbackTint,
            }}
          />
          <motion.div
            className="absolute inset-0"
            animate={{
              x: current.shakeIntensity ? [0, -current.shakeIntensity, current.shakeIntensity, 0] : 0,
            }}
            transition={{
              duration: Math.max(0.05, current.shakeDurationMs / 1000),
              repeat: current.shakeIntensity ? 1 : 0,
            }}
          />
          {current.assetPath && !imageFailed ? (
            <motion.img
              src={current.assetPath}
              alt={current.sourceName}
              onError={() => setImageFailed(true)}
              className="max-h-[72vh] max-w-[92vw] object-contain opacity-90"
              initial={{ scale: 1.08, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.92 }}
              exit={{ scale: 1.02, opacity: 0 }}
              transition={{ duration: 0.22 }}
            />
          ) : (
            <motion.div
              className="min-w-[280px] max-w-[86vw] border px-8 py-7 text-center shadow-2xl"
              initial={{ scale: 1.06, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                borderColor: current.fallbackTint,
                background: 'rgba(8, 8, 16, 0.82)',
                boxShadow: `0 0 48px ${current.fallbackTint}55`,
              }}
            >
              <div
                className="font-display text-3xl font-bold"
                style={{ color: current.fallbackTint }}
              >
                {current.sourceName}
              </div>
              <div className="mt-2 font-panel text-xs tracking-wide text-rg-paper-200/50">
                {current.pathId ? `${current.pathId} · ` : ''}{current.kind === 'immortal_gu' ? '重要仙蛊发动' : '杀招发动'}
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
