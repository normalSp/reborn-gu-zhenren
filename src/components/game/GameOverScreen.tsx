import { useStore } from '../../store';

interface GameOverScreenProps {
  onRestart: () => void;
}

export function GameOverScreen({ onRestart }: GameOverScreenProps) {
  const profile = useStore(s => s.profile);
  const turn = useStore(s => s.turn);
  const deathCause = useStore(s => (s as any).deathCause || '生命耗尽');
  const deathTurn = useStore(s => (s as any).deathTurn || turn);

  const handleRestart = () => {
    // ═══ 全量重置存档状态，再返回标题 ═══
    (useStore.getState() as any).resetStore?.();
    onRestart();
  };

  const handleSaveDeath = () => {
    // ═══ 死亡时可导出存档留作纪念 ═══
    (useStore.getState() as any).saveToFile?.();
  };

  return (
    <div className="min-h-[100dvh] bg-rg-ink-800 flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold text-rg-blood font-narrative tracking-widest mb-6">
        道陨
      </h1>
      <p className="text-rg-paper-200/60 text-lg font-narrative mb-4">
        你的蛊师之路在此终结
      </p>

      {/* 死因详情 */}
      <div className="bg-rg-ink-700/90 border border-rg-ink-300/12 rounded-lg p-4 mb-8 max-w-sm w-full backdrop-blur-md">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-rg-paper-200/40 text-xs font-panel">蛊师</span>
            <p className="text-rg-gold font-narrative">{profile.name || '无名蛊师'}</p>
          </div>
          <div>
            <span className="text-rg-paper-200/40 text-xs font-panel">境界</span>
            <p className="text-rg-paper-100 font-panel">{profile.realm.label}</p>
          </div>
          <div>
            <span className="text-rg-paper-200/40 text-xs font-panel">陨落于</span>
            <p className="text-rg-paper-100 font-panel">第{deathTurn}回</p>
          </div>
          <div>
            <span className="text-rg-paper-200/40 text-xs font-panel">死因</span>
            <p className="text-rg-blood-400 font-panel">{deathCause}</p>
          </div>
        </div>
      </div>

      <p className="text-rg-paper-200/30 text-sm font-panel mb-8">
        蛊界从不因一个人的死亡而停止运转
      </p>

      <div className="flex gap-4">
        {/* 导出存档（留作纪念） */}
        <button
          onClick={handleSaveDeath}
          className="border border-rg-gold/40 text-rg-gold font-button text-sm px-5 py-2.5 rounded-sm hover:bg-rg-gold/10 transition-micro"
        >
          导出此行
        </button>

        {/* 重入轮回 */}
        <button
          onClick={handleRestart}
          className="bg-rg-gold hover:bg-rg-gold/80 text-rg-ink-900 font-button font-semibold px-6 py-2.5 rounded-sm hover:brightness-115 transition-micro"
        >
          重入轮回
        </button>
      </div>
    </div>
  );
}
