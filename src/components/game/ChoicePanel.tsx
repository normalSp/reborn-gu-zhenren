import { useStore } from '../../store';
import type { Choice } from '../../types';
import type { PipeState } from '../../engine/response-pipeline';

interface ChoicePanelProps {
  onSelect: (choiceId: string) => void;
  pipelineState: PipeState;
}

// ─── 风险颜色映射 ───
const RISK_STYLES: Record<Choice['risk'], {
  border: string;
  bg: string;
  text: string;
  label: string;
  labelColor: string;
}> = {
  high: {
    border: 'border-rg-blood-400/50 hover:border-rg-blood-400/80',
    bg: 'hover:bg-rg-blood-600/10',
    text: 'text-rg-blood-300',
    label: '高风险',
    labelColor: 'text-rg-blood-400',
  },
  medium: {
    border: 'border-rg-gold/40 hover:border-rg-gold/60',
    bg: 'hover:bg-rg-gold/10',
    text: 'text-rg-gold',
    label: '中风险',
    labelColor: 'text-rg-gold',
  },
  low: {
    border: 'border-rg-jade-400/30 hover:border-rg-jade-400/50',
    bg: 'hover:bg-rg-jade-600/10',
    text: 'text-rg-jade-300',
    label: '低风险',
    labelColor: 'text-rg-jade-400',
  },
};

export function ChoicePanel({ onSelect, pipelineState }: ChoicePanelProps) {
  const narrative = useStore(s => s.currentNarrative);
  const phase = useStore(s => s.pipelinePhase);

  const choices = narrative?.narrative?.choices || [];

  const isProcessing =
    phase === 'FETCHING' ||
    phase === 'BUILDING_CONTEXT' ||
    phase === 'PARSING' ||
    phase === 'VALIDATING_L3' ||
    phase === 'VALIDATING_FORMAT';

  const isError = phase === 'ERROR' || pipelineState === 'ERROR';

  if (isError) {
    return (
      <div className="w-full bg-rg-ink-700/90 border-t border-rg-ink-300/12 px-6 py-4 backdrop-blur-md">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-rg-blood-400 text-sm font-panel mb-3">
            天机紊乱，感应天道失败
          </p>
          <button
            onClick={() => onSelect('retry')}
            className="bg-rg-gold/80 hover:bg-rg-gold text-rg-ink-900 font-button font-semibold text-sm px-4 py-2 rounded-sm transition-micro"
          >
            重新感应
          </button>
        </div>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="w-full bg-rg-ink-700/90 border-t border-rg-ink-300/12 px-6 py-4 backdrop-blur-md">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-rg-paper-200/40 text-sm font-panel">
            {phase === 'FETCHING' ? '天道正在回应...' : '命运正在汇聚...'}
          </p>
        </div>
      </div>
    );
  }

  if (choices.length === 0) {
    return (
      <div className="w-full bg-rg-ink-700/90 border-t border-rg-ink-300/12 px-6 py-4 backdrop-blur-md">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-rg-paper-200/30 text-sm font-panel">
            等待命运的分岔...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-rg-ink-700/90 border-t border-rg-ink-300/12 px-6 py-5 backdrop-blur-md">
      <div className="max-w-3xl mx-auto">
        <p className="text-rg-paper-200/50 text-xs font-panel mb-3 tracking-[0.1em]">
          做出你的选择
        </p>
        <div className={`grid gap-3 ${
          choices.length === 2 ? 'grid-cols-2' :
          choices.length === 3 ? 'grid-cols-3' :
          'grid-cols-2 sm:grid-cols-4'
        }`}>
          {choices.map(choice => {
            const style = RISK_STYLES[choice.risk];
            return (
              <div key={choice.id} className="relative group">
                <button
                  onClick={() => onSelect(choice.id)}
                  className={`w-full text-left p-4 rounded-sm border bg-rg-ink-800/50 transition-micro ${style.border} ${style.bg}`}
                >
                  {/* 风险标签 */}
                  <span className={`inline-block text-[10px] font-panel font-semibold mb-1.5 ${style.labelColor}`}>
                    {style.label}
                  </span>
                  {/* 选项文本 */}
                  <p className="text-rg-paper-100 text-sm font-button leading-relaxed">
                    {choice.text}
                  </p>
                </button>
                {/* Risk tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-rg-ink-600 border border-rg-gold/30 rounded-sm
                              opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50
                              pointer-events-none shadow-lg shadow-black/50">
                  <p className="text-rg-paper-200/80 text-xs font-panel leading-relaxed">
                    {choice.risk_note}
                  </p>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1
                                w-0 h-0 border-l-4 border-r-4 border-t-4
                                border-l-transparent border-r-transparent border-t-rg-ink-600" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
