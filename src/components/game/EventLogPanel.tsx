import { useMemo, useState } from 'react';
import { useStore } from '../../store';
import { StarIcon } from '../../icons';
import type { KeyEvent } from '../../types';
import type { GameLogEntry } from '../../store/slices/gameLogSlice';

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
  const gameLog = useStore((s: any) => s.gameLog) as GameLogEntry[] | undefined;
  const gameLogArchive = useStore((s: any) => s.gameLogArchive) as GameLogEntry[] | undefined;
  const messages = useStore(s => s.messages);
  const eventHistory = useStore(s => s.eventHistory);
  const archiveGameLog = useStore((s: any) => s.archiveGameLog);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const pageSize = 40;
  const logRows = useMemo(() => [...(gameLog || [])].reverse(), [gameLog]);
  const pageCount = Math.max(1, Math.ceil(logRows.length / pageSize));
  const visibleLogs = logRows.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="max-w-lg mx-auto space-y-5">
        {/* ─── 关键事件时间线 ─── */}
        <div className="bg-rg-ink-700/90 border border-rg-ink-300/12 rounded-lg p-4 backdrop-blur-md max-h-[42vh] overflow-y-auto">
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
                      <span className="text-rg-gold text-[10px] font-panel flex gap-px">
                        {Array.from({ length: event.importance }, (_, i) => (
                          <StarIcon key={i} size={12} />
                        ))}
                      </span>
                    )}
                    <span className="text-rg-paper-200/30 text-[10px] font-panel ml-auto">
                      第{event.turn}回
                    </span>
                  </div>
                  <p className="text-rg-paper-200/70 text-xs font-panel leading-relaxed line-clamp-2">{event.summary}</p>
                  <button
                    className="mt-1 text-[10px] text-rg-gold hover:underline font-panel"
                    onClick={() => setSelectedLogId(selectedLogId === event.id ? null : event.id)}
                  >
                    {selectedLogId === event.id ? '收起详情' : '查看详情'}
                  </button>
                  {selectedLogId === event.id && (
                    <div className="mt-2 rounded-sm bg-rg-ink-900/60 border border-rg-ink-300/8 p-2 text-rg-paper-200/60 text-xs font-panel leading-relaxed whitespace-pre-wrap">
                      {event.summary}
                    </div>
                  )}
                  {event.relatedNPCs?.length > 0 && (
                    <p className="text-rg-paper-200/30 text-[10px] font-panel mt-1">
                      相关: {event.relatedNPCs!.join(' · ')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── 全量事件日志 ─── */}
        <div className="bg-rg-ink-700/90 border border-rg-ink-300/12 rounded-lg p-4 backdrop-blur-md">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h3 className="text-rg-paper-200 text-sm font-panel font-semibold">事件日志</h3>
            <div className="flex items-center gap-2">
              <span className="text-rg-paper-200/30 text-[10px] font-panel">
                {logRows.length} 条 / 归档 {(gameLogArchive || []).length} 条
              </span>
              {typeof archiveGameLog === 'function' && logRows.length > 300 && (
                <button
                  className="text-[10px] text-rg-gold hover:underline font-panel"
                  onClick={() => archiveGameLog(300)}
                >
                  归档普通
                </button>
              )}
            </div>
          </div>

          {visibleLogs.length === 0 ? (
            <p className="text-rg-paper-200/30 text-xs font-panel">暂无运行日志</p>
          ) : (
            <div className="max-h-[45vh] overflow-y-auto space-y-2 pr-1">
              {visibleLogs.map((entry) => {
                const opened = selectedLogId === entry.id;
                const danger = entry.danger && entry.danger !== 'none' ? entry.danger : '';
                return (
                  <div key={entry.id} className="rounded-sm border border-rg-ink-300/8 bg-rg-ink-800/35 p-2">
                    <div className="flex items-start gap-2">
                      <span className="text-rg-paper-200/30 text-[10px] font-panel w-10 shrink-0">T{entry.turn}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-rg-paper-200/40 text-[10px] font-panel uppercase">{entry.category}</span>
                          {danger && <span className="text-rg-blood-400 text-[10px] font-panel">{danger}</span>}
                          {entry.location && <span className="text-rg-paper-200/30 text-[10px] font-panel truncate">{entry.location}</span>}
                        </div>
                        <p className="text-rg-paper-200/70 text-xs font-panel leading-relaxed line-clamp-2">
                          {entry.summary || entry.message}
                        </p>
                        {(entry.gains?.length || entry.losses?.length || entry.actors?.length) ? (
                          <div className="mt-1 text-[10px] text-rg-paper-200/35 font-panel truncate">
                            {entry.actors?.length ? `人物：${entry.actors.join('、')} ` : ''}
                            {entry.gains?.length ? `收益：${entry.gains.join('、')} ` : ''}
                            {entry.losses?.length ? `损失：${entry.losses.join('、')}` : ''}
                          </div>
                        ) : null}
                      </div>
                      <button
                        className="text-[10px] text-rg-gold hover:underline font-panel shrink-0"
                        onClick={() => setSelectedLogId(opened ? null : entry.id)}
                      >
                        {opened ? '收起' : '详情'}
                      </button>
                    </div>
                    {opened && (
                      <div className="mt-2 rounded-sm bg-rg-ink-900/60 border border-rg-ink-300/8 p-2 text-rg-paper-200/60 text-xs font-panel leading-relaxed whitespace-pre-wrap">
                        {entry.detail || entry.message}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {pageCount > 1 && (
            <div className="mt-3 flex items-center justify-between text-[10px] font-panel">
              <button
                className="text-rg-gold disabled:text-rg-paper-200/20"
                disabled={page <= 0}
                onClick={() => setPage(p => Math.max(0, p - 1))}
              >
                上一页
              </button>
              <span className="text-rg-paper-200/35">{page + 1} / {pageCount}</span>
              <button
                className="text-rg-gold disabled:text-rg-paper-200/20"
                disabled={page >= pageCount - 1}
                onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))}
              >
                下一页
              </button>
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
