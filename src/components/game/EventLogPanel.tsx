import { useStore } from '../../store';
import type { KeyEvent } from '../../types';

const EVENT_TYPE_LABELS: Record<KeyEvent['type'], string> = {
  birth: '降生', breakthrough: '突破', battle: '战斗', treasure: '机缘',
  contact: '遭遇', death: '陨落', betrayal: '背叛', discovery: '发现',
};

const EVENT_TYPE_COLORS: Record<KeyEvent['type'], string> = {
  birth: 'text-rg-paper-100', breakthrough: 'text-rg-gold', battle: 'text-rg-blood-400',
  treasure: 'text-rg-jade-400', contact: 'text-rg-paper-200', death: 'text-rg-blood-600',
  betrayal: 'text-rg-blood-300', discovery: 'text-rg-gold/80',
};

export function EventLogPanel() {
  const keyEvents = useStore(s => s.keyEvents);
  const messages = useStore(s => s.messages);
  const eventHistory = useStore(s => s.eventHistory);

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="max-w-lg mx-auto space-y-5">
        {/* ─── 关键事件时间线 ─── */}
        <div className="bg-rg-ink-700/90 border border-rg-ink-300/12 rounded-lg p-4 backdrop-blur-md">
          <h3 className="text-rg-paper-200 text-sm font-panel font-semibold mb-3">关键事件</h3>
          {keyEvents.length === 0 ? (
            <p className="text-rg-paper-200/30 text-xs font-panel">尚无关键事件发生</p>
          ) : (
            <div className="relative pl-4 border-l border-rg-ink-300/20 space-y-3">
              {[...keyEvents].reverse().map(event => (
                <div key={event.id} className="relative">
                  <div className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-rg-ink-500 border border-rg-ink-300/30" />
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-panel font-semibold ${EVENT_TYPE_COLORS[event.type] || 'text-rg-paper-200/50'}`}>
                      {EVENT_TYPE_LABELS[event.type]}
                    </span>
                    {event.importance >= 2 && (
                      <span className="text-rg-gold text-[10px] font-panel">
                        {'★'.repeat(event.importance)}
                      </span>
                    )}
                    <span className="text-rg-paper-200/30 text-[10px] font-panel ml-auto">
                      第{event.turn}回
                    </span>
                  </div>
                  <p className="text-rg-paper-200/70 text-xs font-panel leading-relaxed">{event.summary}</p>
                  {event.relatedNPCs.length > 0 && (
                    <p className="text-rg-paper-200/30 text-[10px] font-panel mt-1">
                      相关: {event.relatedNPCs.join(' · ')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── 事件触发历史 ─── */}
        {eventHistory.length > 0 && (
          <div className="bg-rg-ink-700/90 border border-rg-ink-300/12 rounded-lg p-4 backdrop-blur-md">
            <h3 className="text-rg-paper-200 text-sm font-panel font-semibold mb-3">事件记录</h3>
            <div className="space-y-2">
              {[...eventHistory].reverse().map((entry, i) => (
                <div key={i} className="flex items-start gap-2 text-xs font-panel">
                  <span className="text-rg-paper-200/30 w-12 text-right shrink-0">
                    {new Date(entry.triggeredAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-rg-paper-200/60">{entry.event.id}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── 对话历史统计 ─── */}
        <div className="bg-rg-ink-700/90 border border-rg-ink-300/12 rounded-lg p-4 backdrop-blur-md">
          <h3 className="text-rg-paper-200 text-sm font-panel font-semibold mb-3">对话统计</h3>
          <div className="grid grid-cols-3 gap-3">
            {['system', 'user', 'assistant'].map(role => {
              const count = messages.filter(m => m.role === role).length;
              const tokens = messages.filter(m => m.role === role).reduce((sum, m) => sum + (m.tokens || 0), 0);
              const roleLabel = role === 'system' ? '系统' : role === 'user' ? '玩家' : '天道';
              return (
                <div key={role} className="text-center p-2 bg-rg-ink-800/50 rounded-sm">
                  <div className="text-rg-paper-200/40 text-[10px] font-panel">{roleLabel}</div>
                  <div className="text-rg-paper-100 text-lg font-panel font-bold">{count}</div>
                  <div className="text-rg-paper-200/30 text-[10px] font-panel">{tokens} tokens</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
