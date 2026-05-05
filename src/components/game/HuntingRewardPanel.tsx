/** v0.6.0: 白天/黑天狩猎战利品结算面板 */
import { useState, useEffect } from 'react';

interface LootEntry { label: string; value: string; delay: number; }

export function HuntingRewardPanel({ rewards, onConfirm }: { rewards: LootEntry[]; onConfirm: () => void }) {
  const [revealed, setRevealed] = useState(0);

  useEffect(() => {
    if (revealed < rewards.length) {
      const timer = setTimeout(() => setRevealed(r => r + 1), 300);
      return () => clearTimeout(timer);
    }
  }, [revealed, rewards.length]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-rg-ink-900/80 backdrop-blur-sm" onClick={onConfirm}>
      <div className="bg-rg-ink-800 border border-rg-gold/30 rounded-lg p-6 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-narrative text-rg-gold text-center mb-4">🏆 狩猎战果</h3>
        <div className="space-y-2 mb-6">
          {rewards.slice(0, revealed).map((r, i) => (
            <div key={i} className="flex justify-between text-xs py-1 border-b border-rg-ink-700/30 animate-fadeIn">
              <span className="text-rg-paper-200/60">{r.label}</span>
              <span className="text-rg-gold font-semibold">{r.value}</span>
            </div>
          ))}
        </div>
        <button onClick={onConfirm} className="w-full py-2 rounded-sm text-sm font-button bg-rg-gold text-rg-ink-900 hover:brightness-115">确认</button>
      </div>
    </div>
  );
}
