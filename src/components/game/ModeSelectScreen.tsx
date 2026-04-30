import { useStore } from '../../store';

interface Props { onNext: () => void; onBack: () => void; }

export function ModeSelectScreen({ onNext, onBack }: Props) {
  const setGameMode = useStore(s => s.setGameMode);

  const select = (mode: 'canon' | 'if') => {
    setGameMode(mode);
    onNext();
  };

  return (
    <div className="min-h-[100dvh] bg-rg-ink-800 flex flex-col items-center justify-start p-8">
      <div className="text-center mb-10 pt-12">
        <h2 className="text-3xl font-bold text-rg-gold font-narrative tracking-wider">抉择天命</h2>
        <p className="text-rg-paper-200/50 text-sm font-panel mt-2 tracking-[0.1em]">
          选择你的命运之路
        </p>
        <div className="mt-4 w-12 h-[1px] bg-rg-gold/30 mx-auto" />
      </div>

      <div className="w-full max-w-xl flex flex-col gap-4">
        <button
          onClick={() => select('canon')}
          className="text-left p-6 rounded-lg border border-rg-gold/30 bg-rg-ink-700/90 hover:bg-rg-gold/10 transition-micro backdrop-blur-md"
        >
          <h3 className="text-rg-gold font-narrative text-lg mb-2">正史线</h3>
          <p className="text-rg-paper-200/60 text-sm font-panel leading-relaxed">
            遵循蛊真人原著主线。方源将按时间线在南疆活动，原著关键事件如实发生。
            你作为独立蛊师可在不改变命运节点的前提下与原著角色互动，见证蛊界大势。
          </p>
        </button>

        <button
          onClick={() => select('if')}
          className="text-left p-6 rounded-lg border border-rg-ink-300/15 bg-rg-ink-700/90 hover:bg-rg-jade-400/10 transition-micro backdrop-blur-md"
        >
          <h3 className="text-rg-jade-400 font-narrative text-lg mb-2">IF线 — 自由探索</h3>
          <p className="text-rg-paper-200/60 text-sm font-panel leading-relaxed">
            原著事件线完全断裂。你是这片蛊界唯一的主宰。蝴蝶效应最大化——
            每个选择都可能引发连锁反应，NPC的命运和行动完全由你的选择决定。
            创造属于你自己的蛊界传奇。
          </p>
        </button>
      </div>

      <button onClick={onBack} className="mt-8 text-rg-paper-200/30 hover:text-rg-paper-100 text-xs font-button transition-micro">
        返回标题
      </button>
    </div>
  );
}
