import { useState } from 'react';
import { useStore } from '../../store';

// ─── 五域文化特征（原著设定） ───
const REGIONS: { id: string; name: string; desc: string; atmosphere: string }[] = [
  {
    id: '南疆', name: '南疆',
    desc: '多山多寨，蛊师家族势力为主。古月山寨、商家等势力盘踞。资源分散，生存靠实力。',
    atmosphere: '山岚瘴气 · 家族纷争 · 蛊虫资源丰沛',
  },
  {
    id: '北原', name: '北原',
    desc: '草原部落制，黄金血脉为王庭。长生天势力范围，民风彪悍，最善征战。',
    atmosphere: '草原苍茫 · 部落争霸 · 力道蛊师辈出',
  },
  {
    id: '东海', name: '东海',
    desc: '海域散修为主，岛屿型势力。资源丰富但分散，自由度最高。水路四通八达。',
    atmosphere: '碧海蓝天 · 散修天堂 · 水道蛊虫盛行',
  },
  {
    id: '西漠', name: '西漠',
    desc: '沙漠地带，绿洲城邦林立。人祖传说诞生之地，蓝海秘境隐藏于此。',
    atmosphere: '黄沙万里 · 绿洲商路 · 秘境传说众多',
  },
  {
    id: '中州', name: '中州',
    desc: '天庭核心，十大门派体系。正道势力最强，规矩森严。修行资源最集中。',
    atmosphere: '宗门林立 · 正道秩序 · 修行体系最完整',
  },
];

const IDENTITIES: { id: string; name: string; desc: string }[] = [
  {
    id: '蛊师学徒', name: '蛊师学徒',
    desc: '一只一转蛊伴身，身处山寨/势力底层。前路漫漫，一切从头开始。',
  },
  {
    id: '家族子弟', name: '家族子弟',
    desc: '出身蛊师家族，初始蛊虫配置略优。但家族内斗、长辈期望亦是重负。',
  },
  {
    id: '散修', name: '散修',
    desc: '无门无派，自由但无依。开局资源最少，但不受任何势力约束。',
  },
];

interface OriginSelectScreenProps {
  onNext: () => void;
  onBack: () => void;
}

export function OriginSelectScreen({ onNext, onBack }: OriginSelectScreenProps) {
  const [region, setRegion] = useState('南疆');
  const [identity, setIdentity] = useState('蛊师学徒');

  const handleConfirm = () => {
    const store = useStore.getState();
    (store as any).setFlag?.('_origin', region);
    (store as any).setFlag?.('_identity', identity);
    onNext();
  };

  return (
    <div className="min-h-[100dvh] bg-rg-ink-800 flex flex-col items-center justify-start p-8 overflow-y-auto">
      {/* ─── 标题 ─── */}
      <div className="text-center mb-8 pt-8">
        <h2 className="text-3xl font-bold text-rg-gold font-narrative tracking-wider">
          出身
        </h2>
        <p className="text-rg-paper-200/50 text-sm font-panel mt-2 tracking-[0.1em]">
          你将自何处踏入这方蛊界？
        </p>
        <div className="mt-4 w-12 h-[1px] bg-rg-gold/30 mx-auto" />
      </div>

      <div className="w-full max-w-2xl flex flex-col gap-6">
        {/* ─── 区域选择 ─── */}
        <div className="bg-rg-ink-700/90 border border-rg-ink-300/12 rounded-lg p-6 backdrop-blur-md">
          <h3 className="text-rg-paper-200 text-sm font-panel font-semibold mb-4">
            出身之地
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {REGIONS.map(r => {
              const isSelected = region === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => setRegion(r.id)}
                  className={`text-left p-4 rounded-sm border transition-micro ${
                    isSelected
                      ? 'border-rg-gold/60 bg-rg-gold/10'
                      : 'border-rg-ink-400/15 bg-rg-ink-800/50 hover:border-rg-gold/30'
                  }`}
                >
                  <div className="text-rg-paper-100 font-panel text-sm font-semibold mb-1">
                    {r.name}
                  </div>
                  <p className="text-rg-paper-200/50 text-xs font-panel leading-relaxed mb-2">
                    {r.desc}
                  </p>
                  <p className="text-rg-paper-200/25 text-[10px] font-panel">
                    {r.atmosphere}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── 身份选择 ─── */}
        <div className="bg-rg-ink-700/90 border border-rg-ink-300/12 rounded-lg p-6 backdrop-blur-md">
          <h3 className="text-rg-paper-200 text-sm font-panel font-semibold mb-4">
            你的身份
          </h3>
          <div className="flex flex-col gap-3">
            {IDENTITIES.map(idt => {
              const isSelected = identity === idt.id;
              return (
                <button
                  key={idt.id}
                  onClick={() => setIdentity(idt.id)}
                  className={`text-left p-4 rounded-sm border transition-micro ${
                    isSelected
                      ? 'border-rg-gold/60 bg-rg-gold/10'
                      : 'border-rg-ink-400/15 bg-rg-ink-800/50 hover:border-rg-gold/30'
                  }`}
                >
                  <div className="text-rg-paper-100 font-panel text-sm font-semibold mb-1">
                    {idt.name}
                  </div>
                  <p className="text-rg-paper-200/50 text-xs font-panel leading-relaxed">
                    {idt.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── 确认 ─── */}
        <div className="flex justify-center gap-4 pb-12">
          <button
            onClick={onBack}
            className="text-rg-paper-200/40 hover:text-rg-paper-100 text-xs font-button px-6 py-3 border border-rg-ink-300/15 rounded-sm hover:bg-rg-ink-700/50 transition-micro"
          >
            返回
          </button>
          <button
            onClick={handleConfirm}
            className="bg-rg-gold text-rg-ink-900 font-button font-semibold px-8 py-3 rounded-sm
                       hover:brightness-115 hover:scale-[1.02] transition-micro"
          >
            开窍
          </button>
        </div>
      </div>
    </div>
  );
}
