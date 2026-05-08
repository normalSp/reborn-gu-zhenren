/**
 * ═══ 道场面板 — v0.6.0 ═══
 * 随机刷新3个道场，仙元刷新成本递增，流派偏向，剧情锁。
 */
import { useState, useMemo } from 'react';
import { useStore } from '../../store';
import trainingData from '../../canon/training-grounds.json';

interface TrainingGround {
  id: string; name: string; domain: string; chapterRequired: string;
  pathType: string; type: '磨练' | '对决' | '试炼' | 'hunt';
  tier: number; baseYield: number; costCurrency: number; costImmortalCurrency: number;
  cooldownTurns: number; immortalOnly: boolean;
  failureChance: number; failureEffect: string; description: string;
  huntConfig?: { 仙材掉落率: number; 仙材类型: string[]; 仙蛊掉落率: number; 荒兽: string[]; 上古荒兽?: string; };
}

const GROUNDS = (trainingData as any).grounds as TrainingGround[];
const TYPE_LABELS: Record<string, string> = { '磨练': '磨练', '对决': '对决', '试炼': '试炼', 'hunt': '猎场' };
const TYPE_COLORS: Record<string, string> = { '磨练': 'text-rg-jade-400', '对决': 'text-amber-400', '试炼': 'text-purple-400', 'hunt': 'text-rg-gold' };
const EMPTY_SECONDARY_PATHS = Object.freeze([]) as string[];
const EMPTY_TRAINING_COOLDOWNS = Object.freeze({}) as Record<string, number>;

function seedRand(seed: number) { let s = seed; return () => { s = (s * 1664525 + 1013904223) & 0xFFFFFFFF; return (s >>> 0) / 0xFFFFFFFF; }; }

export function TrainingGroundPanel() {
  const realm = useStore(s => s.profile?.realm?.grand || 1);
  const isImmortal = realm >= 6;
  const currentDomain = useStore(s => s.currentDomain || '南疆');
  const currentChapterId = useStore(s => (s as any).currentChapterId || '');
  const primaryPath = useStore(s => s.pathBuild?.primary || '');
  const secondaryPaths = useStore(s => s.pathBuild?.secondary ?? EMPTY_SECONDARY_PATHS);
  const cooldowns = useStore(s => (s as any).flags?.trainingCooldowns ?? EMPTY_TRAINING_COOLDOWNS) as Record<string, number>;
  const turn = useStore(s => s.turn || 1);
  const isInCriticalPlot = useStore(s => !!(s as any).battleState || !!(s as any).flags?._ascension_in_progress);
  const isPipelineBusy = useStore(s => {
    const phase = (s as any).pipelinePhase;
    return !!phase && phase !== 'IDLE' && phase !== 'RESOLVED' && phase !== 'ERROR';
  });

  const [refreshCost, setRefreshCost] = useState(isImmortal ? 500 : 200);
  const [poolSeed, setPoolSeed] = useState(turn);
  const [resultMsg, setResultMsg] = useState('');

  const availableGrounds = useMemo(() => {
    return GROUNDS.filter(g => {
      if (g.immortalOnly && !isImmortal) return false;
      if (g.chapterRequired && currentChapterId && g.chapterRequired !== currentChapterId) return false;
      // 冷却检查
      if (cooldowns[g.id] && cooldowns[g.id] > turn) return false;
      return true;
    });
  }, [isImmortal, currentChapterId, cooldowns, turn]);

  const picked = useMemo(() => {
    if (availableGrounds.length === 0) return [];
    const rng = seedRand(poolSeed);
    // 流派偏向：主修×2权重、辅修×1.5
    const weighted = availableGrounds.map(g => {
      let w = 1.0;
      if (g.pathType === primaryPath) w = 2.0;
      else if (secondaryPaths.includes(g.pathType)) w = 1.5;
      return { ...g, _weight: w };
    });
    const shuffled = [...weighted].sort(() => rng() - 0.5);
    return shuffled.slice(0, Math.min(3, shuffled.length));
  }, [availableGrounds, poolSeed, primaryPath, secondaryPaths]);

  const handleRefresh = () => {
    if (isPipelineBusy) return;
    setPoolSeed(poolSeed + 1);
    setRefreshCost(prev => Math.min(4000, prev * 2));
  };

  const handleTrain = (ground: TrainingGround) => {
    if (isPipelineBusy) return;
    const cost = isImmortal ? ground.costImmortalCurrency : ground.costCurrency;
    const store = useStore.getState() as any;
    const currency = isImmortal ? (store.immortalCurrency || 0) : (store.currency || 0);
    if (currency < cost) { setResultMsg(`${isImmortal ? '仙元石' : '元石'}不足`); return; }

    // 消耗货币
    if (isImmortal) useStore.setState(s => ({ ...s, immortalCurrency: (store.immortalCurrency || 0) - cost } as any));
    else (store as any).spendCurrency?.(cost);

    // 成功/失败判定
    if (Math.random() < ground.failureChance) {
      setResultMsg(`修炼失败！${ground.failureEffect}`);
    } else {
      const daoBonus = ground.pathType === primaryPath ? 0.3 : secondaryPaths.includes(ground.pathType) ? 0.15 : 0;
      const yield_ = Math.floor(ground.baseYield * (1 + (store.attributes?.资质 || 5) / 20) * (1 + daoBonus));
      // 增加道痕
      if (typeof (store as any).addDaoMarks === 'function') (store as any).addDaoMarks(ground.pathType, yield_);
      setResultMsg(`修炼成功！${ground.pathType}道痕 +${yield_}`);
    }

    // 写冷却
    const newCDs = { ...cooldowns, [ground.id]: turn + ground.cooldownTurns };
    useStore.setState(s => ({ ...s, flags: { ...(s as any).flags, trainingCooldowns: newCDs } } as any));
    setTimeout(() => setResultMsg(''), 3000);
  };

  if (isInCriticalPlot) {
    return (
      <div className="h-full flex items-center justify-center p-6 bg-rg-ink-900/95">
        <p className="text-rg-paper-200/30 text-xs font-panel">当前剧情关键节点，无法进入道场修炼</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-rg-ink-900/95 text-rg-paper-200 font-panel overflow-y-auto">
      <div className="p-4 border-b border-rg-ink-700/50">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-semibold text-rg-gold tracking-wider">道场</h3>
          <button onClick={handleRefresh} disabled={isPipelineBusy} className={`text-[10px] font-button px-2 py-0.5 border border-rg-gold/20 text-rg-gold/60 hover:text-rg-gold rounded-sm ${isPipelineBusy ? 'opacity-45 cursor-not-allowed' : ''}`}>
            刷新 ({refreshCost}{isImmortal ? '仙元' : '元石'})
          </button>
        </div>
        <p className="text-[10px] text-rg-paper-200/30 mt-1">流派偏向: 主修×2权重 · 辅修×1.5</p>
      </div>

      {resultMsg && <div className="px-4 py-2 bg-rg-gold/10 border-b border-rg-gold/20 text-rg-gold text-[10px] text-center">{resultMsg}</div>}

      <div className="flex-1 p-3 space-y-3">
        {picked.length === 0 ? (
          <p className="text-xs text-rg-paper-200/20 italic text-center py-8">当前无可用的修炼道场——章节未解锁或均在冷却中</p>
        ) : picked.map(g => (
          <div key={g.id} className="bg-rg-ink-800/50 border border-rg-ink-300/12 rounded-md p-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-semibold">{g.name}</span>
              <span className={`text-[9px] ${TYPE_COLORS[g.type]}`}>{TYPE_LABELS[g.type]}</span>
            </div>
            <p className="text-[10px] text-rg-paper-200/40 leading-relaxed mb-2">{g.description}</p>
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-rg-paper-200/30">{g.pathType} · Lv{g.tier} · 产出{g.baseYield}道痕</span>
              <span className="text-rg-paper-200/20">{g.cooldownTurns}回合冷却</span>
            </div>
            {g.type === 'hunt' && g.huntConfig && (
              <p className="text-[9px] text-rg-gold/50 mt-1">
                仙材{g.huntConfig.仙材掉落率 * 100}% · 仙蛊{g.huntConfig.仙蛊掉落率 * 100}%
              </p>
            )}
            <button onClick={() => handleTrain(g)} disabled={isPipelineBusy}
              className={`mt-2 w-full py-1.5 rounded-sm text-[10px] font-button ${g.immortalOnly ? 'bg-rg-gold/10 border border-rg-gold/30 text-rg-gold hover:bg-rg-gold/20' : 'bg-rg-ink-700/50 border border-rg-ink-300/15 text-rg-paper-200/60 hover:border-rg-gold/20'} transition-colors ${isPipelineBusy ? 'opacity-45 cursor-not-allowed' : ''}`}>
              {g.type === 'hunt' ? '开始狩猎' : '修炼'} ({g.immortalOnly ? g.costImmortalCurrency + '仙元' : g.costCurrency + '元石'})
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
