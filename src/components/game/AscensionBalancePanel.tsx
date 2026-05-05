/**
 * ═══ 三气平衡升仙面板 — v0.6.0 ═══
 * 升仙第二步：三气(天气/地气/人气)平衡数值面板。
 * 回合制抉择，多因子难度公式，风险递增。
 */
import { useState, useMemo, useCallback } from 'react';
import { useStore } from '../../store';

interface TriQiState {
  weather: number;  // 天气当前值
  earth: number;    // 地气当前值
  human: number;    // 人气当前值
}
interface TriQiMax { weather: number; earth: number; human: number; }

interface AscensionStep {
  totalAbsorbed: { weather: number; earth: number; human: number };
  riskLevel: 'safe' | 'caution' | 'danger' | 'fatal';
  deathLine: number;
  remainingTurns: number;
  maxTurns: number;
  triQiDiff: number;
}

function computeDifficulty(attrs: { aptitude: number; physique: number; mind: number }, realm: number, daoTotal: number, isTenUltimate: boolean, guCount: number): number {
  const aptCoef = attrs.aptitude <= 7 ? 1.0 : attrs.aptitude === 8 ? 1.3 : attrs.aptitude === 9 ? 1.8 : 3.0;
  const accCoef = Math.min(2.0, Math.max(1.0, (attrs.aptitude * 10 + attrs.physique * 5 + attrs.mind * 5 + daoTotal / 10) / 100));
  const tenUltimateMult = isTenUltimate ? 3.0 : 1.0;
  const guMult = 1.0 + guCount * 0.5;
  return Math.min(20.0, Math.max(1.0, aptCoef * accCoef * tenUltimateMult * guMult));
}

function deathLine(difficulty: number): number { return Math.max(15, 50 - difficulty * 5); }

export function AscensionBalancePanel({ onComplete }: { onComplete: (result: { areaMu: number; flowRatio: number; nodes: number; isDongTian: boolean; daoMarks: Record<string, number> }) => void }) {
  const attrs = useStore(s => s.attributes);
  const realm = useStore(s => s.profile?.realm?.grand || 5);
  const pathBuild = useStore(s => s.pathBuild);
  const daoTotal = Object.values(pathBuild?.dao_marks || {}).reduce((a: number, b: number) => a + b, 0);
  const isTenUltimate = attrs.资质 === 10;
  const inventory = useStore(s => s.inventory);
  const guCount = inventory?.length || 0;

  const difficulty = useMemo(() => computeDifficulty({ aptitude: attrs.资质, physique: attrs.体魄, mind: attrs.心智 }, realm, daoTotal, isTenUltimate, guCount), [attrs, realm, daoTotal, isTenUltimate, guCount]);

  // 人气上限 = 资质×10 + 体魄×5 + 心智×5 + 道痕总量/10
  const humanMax = useMemo(() => attrs.资质 * 10 + attrs.体魄 * 5 + attrs.心智 * 5 + Math.floor(daoTotal / 10), [attrs, daoTotal]);
  const qiMax: TriQiMax = { weather: Math.floor(humanMax * 1.3), earth: Math.floor(humanMax * 1.3), human: humanMax };
  const maxTurns = 8 + Math.floor(attrs.资质 / 2);

  const [qi, setQi] = useState<TriQiState>({ weather: Math.floor(humanMax * 0.3), earth: Math.floor(humanMax * 0.3), human: humanMax });
  const [turn, setTurn] = useState(0);
  const [absorbed, setAbsorbed] = useState({ weather: 0, earth: 0, human: 0 });
  const [msg, setMsg] = useState('');
  const [result, setResult] = useState<'none' | 'success' | 'injured' | 'dead' | 'failed'>('none');

  const absorbRate = { weather: 18, earth: 15, human: 12 };
  const diffLine = deathLine(difficulty);

  const triQiDiff = useMemo(() => {
    const pcts = [qi.weather / qiMax.weather, qi.earth / qiMax.earth, qi.human / qiMax.human];
    return Math.round((Math.max(...pcts) - Math.min(...pcts)) * 100);
  }, [qi, qiMax]);

  const riskLevel = triQiDiff < 15 ? 'safe' : triQiDiff < 25 ? 'caution' : triQiDiff < 35 ? 'danger' : 'fatal';
  const deathProb = triQiDiff >= diffLine ? Math.min(70, (triQiDiff - diffLine) * 2) : 0;

  const handleAction = useCallback((action: 'weather' | 'earth' | 'balance') => {
    if (result !== 'none') return;
    setQi(prev => {
      if (action === 'weather') return { ...prev, weather: Math.max(0, prev.weather - absorbRate.weather), human: Math.max(0, prev.human - 8), earth: Math.min(qiMax.earth, prev.earth + 5) };
      if (action === 'earth') return { ...prev, earth: Math.max(0, prev.earth - absorbRate.earth), human: Math.max(0, prev.human - 8), weather: Math.min(qiMax.weather, prev.weather + 5) };
      // balance
      return { ...prev, weather: Math.max(0, prev.weather - Math.floor(absorbRate.weather * 0.6)), earth: Math.max(0, prev.earth - Math.floor(absorbRate.earth * 0.6)), human: Math.min(qiMax.human, prev.human + 10) };
    });
    setAbsorbed(prev => ({
      weather: prev.weather + (action === 'weather' ? absorbRate.weather : action === 'balance' ? Math.floor(absorbRate.weather * 0.6) : 0),
      earth: prev.earth + (action === 'earth' ? absorbRate.earth : action === 'balance' ? Math.floor(absorbRate.earth * 0.6) : 0),
      human: prev.human - 8 + (action === 'balance' ? 10 : 0),
    }));
    // Death check
    const newDiff = (() => {
      const a = action === 'weather' ? Math.max(0, qi.weather - absorbRate.weather) : action === 'earth' ? qi.weather : Math.max(0, qi.weather - Math.floor(absorbRate.weather * 0.6));
      const b = action === 'earth' ? Math.max(0, qi.earth - absorbRate.earth) : action === 'weather' ? qi.earth : Math.max(0, qi.earth - Math.floor(absorbRate.earth * 0.6));
      const c = action !== 'balance' ? Math.max(0, qi.human - 8) : Math.min(qiMax.human, qi.human + 10);
      const pcts2 = [a / qiMax.weather, b / qiMax.earth, c / qiMax.human];
      return Math.round((Math.max(...pcts2) - Math.min(...pcts2)) * 100);
    })();
    const newDeathLine = deathLine(difficulty);
    if (newDiff >= newDeathLine) {
      const prob = Math.min(70, (newDiff - newDeathLine) * 2);
      if (Math.random() * 100 < prob) { setResult('dead'); return prev; }
    }
    const nextTurn = turn + 1;
    setTurn(nextTurn);
    // Auto-growth per turn
    if (nextTurn >= maxTurns) {
      if (triQiDiff < 25) setResult('success');
      else if (triQiDiff < 35) setResult('injured');
      else setResult('failed');
    }
    // Natural qi growth
    setQi(prev2 => ({
      weather: Math.min(qiMax.weather, prev2.weather + 5 + Math.floor(Math.random() * 11)),
      earth: Math.min(qiMax.earth, prev2.earth + 5 + Math.floor(Math.random() * 11)),
      human: Math.max(0, prev2.human - (3 + Math.floor(Math.random() * 6))),
    }));
  }, [qi, qiMax, turn, maxTurns, result, difficulty, triQiDiff]);

  const handleComplete = useCallback(() => {
    const total = absorbed.weather + absorbed.earth + absorbed.human;
    const areaMu = Math.min(900, 100 + Math.floor(total / Math.max(1, humanMax) * 800));
    const flowRatio = Math.min(33, 5 + Math.floor(total / Math.max(1, humanMax) * 28));
    const nodes = Math.min(6, 1 + Math.floor(total / Math.max(1, humanMax) * 5));
    const isDongTian = areaMu > 600 && triQiDiff < 10 && Math.random() < 0.5;
    onComplete({ areaMu, flowRatio, nodes, isDongTian, daoMarks: {} });
  }, [absorbed, humanMax, triQiDiff, onComplete]);

  const bgColor = riskLevel === 'safe' ? 'bg-rg-jade-500/5' : riskLevel === 'caution' ? 'bg-amber-500/5' : riskLevel === 'danger' ? 'bg-rg-blood-500/5' : 'bg-red-900/10';
  const borderColor = riskLevel === 'safe' ? 'border-rg-jade-500/20' : riskLevel === 'caution' ? 'border-amber-500/20' : riskLevel === 'danger' ? 'border-rg-blood-500/20' : 'border-red-500/40';
  const textColor = riskLevel === 'safe' ? 'text-rg-jade-400' : riskLevel === 'caution' ? 'text-amber-400' : riskLevel === 'danger' ? 'text-rg-blood-400' : 'text-red-400';

  return (
    <div className="min-h-[100dvh] bg-rg-ink-900 flex items-center justify-center p-4">
      <div className={`w-full max-w-lg ${bgColor} border ${borderColor} rounded-lg p-6 backdrop-blur-md`}>
        <h2 className="text-xl font-bold text-rg-gold font-narrative text-center mb-1">三气平衡 · 升仙第二关</h2>
        <p className={`text-xs font-panel text-center mb-4 ${textColor}`}>
          难度系数: ×{difficulty.toFixed(1)} · 致死线: {diffLine}% · {isTenUltimate ? '十绝体·特等福地' : '标准升仙'}
        </p>

        {result !== 'none' ? (
          <div className="text-center py-8">
            {result === 'success' && <p className="text-rg-jade-400 text-lg font-narrative">三气平衡成功！天地人三气融合，仙窍即将开辟。</p>}
            {result === 'injured' && <p className="text-amber-400 text-lg font-narrative">三气勉强收束。福地将降一等，但你活了下来。</p>}
            {result === 'dead' && <p className="text-rg-blood-400 text-lg font-narrative">三气失衡……你消融于天地之间。</p>}
            {result === 'failed' && <p className="text-rg-blood-400 text-lg font-narrative">三气失衡已达极限。升仙失败，重伤回退。</p>}
            {(result === 'success' || result === 'injured') && (
              <button onClick={handleComplete} className="mt-6 bg-rg-gold text-rg-ink-900 font-button font-semibold px-8 py-3 rounded-sm hover:brightness-115">
                踏入仙途
              </button>
            )}
          </div>
        ) : (
          <>
            {/* 三气进度条 */}
            <div className="space-y-4 mb-4">
              {(['weather', 'earth', 'human'] as const).map(type => {
                const val = qi[type]; const max = qiMax[type]; const pct = Math.round(val / max * 100);
                const barColor = type === 'weather' ? 'bg-cyan-500' : type === 'earth' ? 'bg-amber-500' : 'bg-white/70';
                const label = type === 'weather' ? '天气' : type === 'earth' ? '地气' : '人气';
                return (
                  <div key={type}>
                    <div className="flex justify-between text-xs font-panel mb-1">
                      <span className="text-rg-paper-200/60">{label}</span>
                      <span className="text-rg-paper-200/40">{val}/{max}</span>
                    </div>
                    <div className="h-4 bg-rg-ink-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-300 ${barColor}`} style={{ width: `${Math.max(2, pct)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 状态信息 */}
            <div className="grid grid-cols-3 gap-3 mb-4 text-center">
              <div><span className="text-rg-paper-200/40 text-[10px]">三气差值</span><div className={textColor}>{triQiDiff}%</div></div>
              <div><span className="text-rg-paper-200/40 text-[10px]">死亡概率</span><div className="text-rg-blood-400">{deathProb}%</div></div>
              <div><span className="text-rg-paper-200/40 text-[10px]">剩余回合</span><div className="text-rg-paper-200/60">{maxTurns - turn}/{maxTurns}</div></div>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-2 mb-4">
              <button onClick={() => handleAction('weather')} disabled={turn >= maxTurns}
                className="flex-1 py-3 rounded-sm text-xs font-button bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 transition-colors">
                多吸天气
              </button>
              <button onClick={() => handleAction('earth')} disabled={turn >= maxTurns}
                className="flex-1 py-3 rounded-sm text-xs font-button bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-colors">
                多吸地气
              </button>
              <button onClick={() => handleAction('balance')} disabled={turn >= maxTurns}
                className="flex-1 py-3 rounded-sm text-xs font-button bg-rg-jade-500/10 border border-rg-jade-500/30 text-rg-jade-400 hover:bg-rg-jade-500/20 transition-colors">
                维持平衡
              </button>
            </div>

            {msg && <p className="text-xs text-rg-paper-200/40 text-center mb-2">{msg}</p>}
          </>
        )}
      </div>
    </div>
  );
}
