import { useState, useMemo } from 'react';
import { useStore } from '../../store';
import { INITIAL_TALENTS, TIER_COLORS, TIER_LABELS, TALENT_COST } from '../../data/talents';
import type { Talent } from '../../types';

interface CharacterCreateProps {
  onConfirm: () => void;
}

// ─── 骰子随机生成属性 ───
function rollAttribute(): number {
  // 1-10，但概率偏向4-7（现实中大多数人的资质在中等范围）
  const roll = Math.random() * 10;
  // 4-7概率最高（40%），极端值概率低
  if (roll < 0.5) return 1;       // 5%
  if (roll < 1.0) return 2;       // 5%
  if (roll < 1.6) return 3;       // 6%
  if (roll < 2.6) return 4;       // 10%
  if (roll < 4.1) return 5;       // 15%
  if (roll < 6.1) return 6;       // 20%
  if (roll < 7.6) return 7;       // 15%
  if (roll < 8.6) return 8;       // 10%
  if (roll < 9.5) return 9;       // 9%
  return 10;                       // 5%
}

function rollAllAttributes(): { 资质: number; 体魄: number; 心智: number; 气运: number } {
  const 资质 = rollAttribute();
  // 十绝体：资质=10时，其余属性保底≥8（全属性极致）
  if (资质 === 10) {
    const rollHigh = () => {
      const r = Math.random() * 10;
      if (r < 8.5) return 8;  // 15%
      if (r < 9.2) return 9;  // 7%
      return 10;               // 8%
    };
    return { 资质: 10, 体魄: rollHigh(), 心智: rollHigh(), 气运: rollHigh() };
  }
  return {
    资质,
    体魄: rollAttribute(),
    心智: rollAttribute(),
    气运: rollAttribute(),
  };
}

// ─── 属性分级显示 ───
// 原著：甲等-丁等仅用于评价空窍真元容量（资质），体魄/心智/气运不使用
function attrGrade(value: number, attrName: string): { label: string; color: string } {
  if (attrName !== '资质') return { label: '', color: 'text-rg-paper-100' };
  if (value >= 9) return { label: '甲等', color: 'text-rg-gold' };
  if (value >= 7) return { label: '乙等', color: 'text-rg-jade-400' };
  if (value >= 5) return { label: '丙等', color: 'text-rg-paper-200' };
  return { label: '丁等', color: 'text-rg-paper-200/50' };
}

// ─── 确定性伪随机（种子shuffle用） ───
function seedRand(seed: number): () => number {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) & 0xFFFFFFFF; return (s >>> 0) / 0xFFFFFFFF; };
}

export function CharacterCreate({ onConfirm }: CharacterCreateProps) {
  const [name, setName] = useState('');
  const [attributes, setAttributes] = useState(rollAllAttributes());
  const [selectedTalents, setSelectedTalents] = useState<Talent[]>([]);
  // 随机池：每页从52条目中抽取12个展示
  const [poolIndex, setPoolIndex] = useState(0);

  // ─── 天赋点数计算（5B: /5 而非 /6） ───
  const isTenUltimate = attributes.资质 === 10;
  const talentPoints = useMemo(() => {
    const total = attributes.资质 + attributes.体魄 + attributes.心智 + attributes.气运;
    const divisor = isTenUltimate ? 8 : 5;
    return Math.floor(total / divisor);
  }, [attributes, isTenUltimate]);

  // 随机12条天赋池（保留已选天赋在列表中）
  const shuffledPool = useMemo(() => {
    const rng = seedRand(attributes.资质 * 100 + attributes.体魄 * 10 + poolIndex);
    const sorted = [...INITIAL_TALENTS].sort(() => rng() - 0.5);
    // 确保已选天赋也在展示列表中
    const needShow = sorted.filter(t => selectedTalents.some(s => s.id === t.id));
    const rest = sorted.filter(t => !selectedTalents.some(s => s.id === t.id));
    return [...needShow, ...rest.slice(0, 12)];
  }, [attributes, poolIndex, selectedTalents]);

  // 已消费点数
  const spentPoints = selectedTalents.reduce((sum, t) => sum + (TALENT_COST[t.tier] || 1), 0);
  const remainingPoints = talentPoints - spentPoints;

  const background = useStore(s => (s as any).flags?._origin || '南疆') as string;
  const identity = useStore(s => (s as any).flags?._identity || '蛊师学徒') as string;

  const setProfile = (profile: any) => {
    useStore.getState().setFlag('_profile_init', true);
    useStore.setState({
      profile: {
        name,
        realm: { grand: 1, sub: '初阶', label: '一转初阶' },
        background: `${background} · ${identity}`,
      },
      attributes,
    });
  };

  // toggle 天赋选中
  const toggleTalent = (talent: Talent) => {
    setSelectedTalents(prev => {
      const exists = prev.find(t => t.id === talent.id);
      if (exists) return prev.filter(t => t.id !== talent.id);
      const cost = TALENT_COST[talent.tier] || 1;
      if (remainingPoints >= cost) return [...prev, talent];
      return prev;
    });
  };

  const handleConfirm = () => {
    if (!name.trim()) return;
    useStore.getState().setFlag('_profile_init', true);
    useStore.setState({
      profile: {
        name,
        realm: { grand: 1, sub: '初阶', label: '一转初阶' },
        background: `${background} · ${identity}`,
      },
      attributes,
    });
    // 多天赋写入 store
    selectedTalents.forEach(t => useStore.getState().selectTalent(t));
    onConfirm();
  };

  const handleReroll = () => {
    setAttributes(rollAllAttributes());
  };

  return (
    <div className="min-h-[100dvh] bg-rg-ink-800 flex flex-col items-center justify-start p-8 overflow-y-auto">
      {/* ─── 标题 ─── */}
      <div className="text-center mb-8 pt-8">
        <h2 className="text-3xl font-bold text-rg-gold font-narrative tracking-wider">
          开窍
        </h2>
        <p className="text-rg-paper-200/50 text-sm font-panel mt-2 tracking-[0.1em]">
          天意垂青 · 你于今日开窍，踏入蛊师之路
        </p>
        <div className="mt-4 w-12 h-[1px] bg-rg-gold/30 mx-auto" />
      </div>

      <div className="w-full max-w-2xl flex flex-col gap-6">
        {/* ─── 姓名输入 ─── */}
        <div className="bg-rg-ink-700/90 border border-rg-ink-300/12 rounded-lg p-6 backdrop-blur-md">
          <label className="block text-rg-paper-200 text-sm font-panel mb-3">
            你的名号
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="输入你的蛊师之名..."
            maxLength={8}
            className="w-full bg-rg-ink-900 border border-rg-ink-500/30 text-rg-paper-100 font-narrative text-lg px-4 py-3 rounded-sm
                       placeholder:text-rg-ink-400 focus:outline-none focus:border-rg-gold/60"
          />
        </div>

        {/* ─── 属性骰子 ─── */}
        <div className="bg-rg-ink-700/90 border border-rg-ink-300/12 rounded-lg p-6 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-rg-paper-200 text-sm font-panel font-semibold">
              先天资质
            </h3>
            <button
              onClick={handleReroll}
              className="text-rg-gold/80 hover:text-rg-gold text-xs font-button px-3 py-1 border border-rg-gold/25 rounded-sm hover:bg-rg-gold/10 transition-micro"
            >
              重新掷骰
            </button>
          </div>

          <div className="grid grid-cols-4 gap-4">
            {(['资质', '体魄', '心智', '气运'] as const).map(attr => {
              const val = attributes[attr];
              const grade = attrGrade(val, attr);
              const isTen = attr === '资质' && val === 10;
              return (
                <div key={attr} className={`text-center p-3 rounded-sm border transition-micro ${
                  isTen ? 'bg-rg-gold/10 border-rg-gold/30' : 'bg-rg-ink-800/50 border-rg-ink-400/15'
                }`}>
                  <div className="text-rg-paper-200/70 text-xs font-panel mb-1">{attr}</div>
                  <div className={`text-2xl font-bold font-panel ${isTen ? 'text-rg-gold' : grade.color}`}>
                    {val}
                    {isTen && <span className="text-[10px] text-rg-gold ml-1">十绝</span>}
                  </div>
                  {grade.label && (
                    <div className={`text-xs font-panel mt-1 ${grade.color}`}>{grade.label}</div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-4 text-rg-ink-300 text-xs font-panel leading-relaxed">
            {(() => {
              if (attributes.资质 === 10) {
                return '十绝体！空窍十成真元、修行一日千里。但升仙时灾劫恐怖、天意必诛、极易陨落。木秀于林，风必摧之。';
              }
              const { 资质: q, 体魄: t, 心智: x, 气运: y } = attributes;
              const total = q + t + x + y;
              if (total >= 32) return '天资卓绝，百年难遇。但你当知：木秀于林，风必摧之。';
              if (total >= 24) return '天赋不错，修行之路有望。但仍需步步为营。';
              if (total >= 16) return '资质平庸，但平凡之人亦能有所成就。天道酬勤。';
              return '资质低下，前路艰难。但蛊界从不缺少以凡人之躯逆天改命的传说。';
            })()}
          </div>
        </div>

        {/* ─── 天赋遴选（多选制）─── */}
        <div className="bg-rg-ink-700/90 border border-rg-ink-300/12 rounded-lg p-6 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-rg-paper-200 text-sm font-panel font-semibold">
              天赋遴选（可多选至点数用尽）
            </h3>
            <div className="flex items-center gap-3">
              <span className="text-rg-paper-200/50 text-xs font-panel">
                已选<span className="text-rg-gold font-bold">{selectedTalents.length}</span>个 · 剩余<span className="text-rg-gold font-bold">{remainingPoints}</span>点
              </span>
              <button onClick={() => setPoolIndex(p => p + 1)}
                className="text-rg-gold/60 hover:text-rg-gold text-xs font-button px-2 py-0.5 border border-rg-gold/20 rounded-sm transition-micro">
                换一批
              </button>
            </div>
          </div>
          {isTenUltimate && (
            <p className="text-rg-gold/80 text-xs font-panel mb-4">
              十绝体！空窍十成真元、全属性极致。天赋余裕所剩无几——仅能选基础天赋。
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {shuffledPool.map(talent => {
              const isSelected = selectedTalents.some(t => t.id === talent.id);
              const cost = TALENT_COST[talent.tier] || 1;
              const canAfford = !isSelected && cost <= remainingPoints;
              return (
                <button
                  key={talent.id}
                  onClick={() => toggleTalent(talent)}
                  disabled={!isSelected && !canAfford}
                  className={`text-left p-4 rounded-sm border transition-micro ${isSelected ? 'border-rg-gold/60 bg-rg-gold/10 ring-1 ring-rg-gold/20' : canAfford ? 'border-rg-ink-400/15 bg-rg-ink-800/50 hover:border-rg-gold/30' : 'border-rg-ink-400/8 bg-rg-ink-800/30 opacity-30 cursor-not-allowed'}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-panel font-semibold ${TIER_COLORS[talent.tier]}`}>{TIER_LABELS[talent.tier]}</span>
                    <span className="text-rg-paper-100 font-panel text-sm font-semibold">{talent.name}</span>
                    {isSelected && <span className="text-[9px] text-rg-gold ml-auto">已选</span>}
                    {!isSelected && <span className={`text-[9px] font-panel ml-auto ${canAfford ? 'text-rg-gold/60' : 'text-rg-paper-200/20'}`}>{cost}pts</span>}
                  </div>
                  <p className="text-rg-paper-200/60 text-xs font-panel leading-relaxed">{talent.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── 确认按钮 ─── */}
        <div className="flex justify-center pb-12">
          <button
            onClick={handleConfirm}
            disabled={!name.trim()}
            className="bg-rg-gold text-rg-ink-900 font-button font-semibold px-8 py-3 rounded-sm
                       hover:brightness-115 hover:scale-[1.02] transition-micro
                       disabled:opacity-40 disabled:hover:scale-100 disabled:hover:brightness-100 disabled:cursor-not-allowed"
          >
            踏入蛊界
          </button>
        </div>
      </div>
    </div>
  );
}
