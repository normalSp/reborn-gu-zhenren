import { useState, useEffect, useCallback } from 'react';

export interface BattleInfo {
  enemy: string;
  enemyRealm: string;
  action: string;
  damage?: number;
}

let triggerBattleFn: ((info: BattleInfo) => void) | null = null;

export function triggerBattleInfo(info: BattleInfo) {
  triggerBattleFn?.(info);
}

export function BattleOverlay() {
  const [active, setActive] = useState(false);
  const [info, setInfo] = useState<BattleInfo | null>(null);
  const [visible, setVisible] = useState(false);

  const doTrigger = useCallback((i: BattleInfo) => {
    setInfo(i);
    setActive(true);
    setVisible(true);
    // 3秒后自动消失
    setTimeout(() => setVisible(false), 3000);
    setTimeout(() => { setActive(false); setInfo(null); }, 3500);
  }, []);

  useEffect(() => {
    triggerBattleFn = doTrigger;
    return () => { triggerBattleFn = null; };
  }, [doTrigger]);

  if (!active || !info) return null;

  const damageColor = info.damage && info.damage > 0
    ? 'text-rg-blood-400' : 'text-rg-jade-400';

  return (
    <div
      className={`fixed top-32 left-1/2 -translate-x-1/2 z-30 pointer-events-none transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      }`}
    >
      <div className="bg-rg-ink-700/95 border border-rg-ink-300/15 rounded-lg px-5 py-3 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center gap-3 text-sm">
          <span className="text-rg-paper-200/60 font-panel">⚔</span>
          <span className="text-rg-gold font-narrative">{info.enemy}</span>
          <span className="text-rg-paper-200/30 text-xs font-panel">{info.enemyRealm}</span>
          <span className="text-rg-paper-200/60 font-panel">·</span>
          <span className="text-rg-paper-200/80 text-xs font-panel">{info.action}</span>
          {info.damage !== undefined && (
            <span className={`text-xs font-narrative font-bold ${damageColor}`}>
              {info.damage > 0 ? `-${info.damage}` : info.damage === 0 ? '格挡' : `+${Math.abs(info.damage)}`}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
