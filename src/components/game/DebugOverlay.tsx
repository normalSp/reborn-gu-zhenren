import { useState, useCallback } from 'react';
import { useStore } from '../../store';

const COLOR_MAP: Record<string, string> = {
  RESOLVED: 'var(--gu-life-verdant)', ERROR: 'var(--gu-life-crimson)', FETCHING: 'var(--gu-trace-gold)',
  IDLE: 'var(--gu-text-disabled)', BUILDING_CONTEXT: 'var(--gu-text-secondary)', PARSING: 'var(--gu-text-secondary)',
  VALIDATING_L3: 'var(--gu-trace-gold-dim)', VALIDATING_FORMAT: 'var(--gu-text-secondary)',
};

export function DebugOverlay() {
  const phase = useStore(s => s.pipelinePhase);
  const error = useStore(s => s.pipelineError);
  const turn = useStore(s => s.turn);
  const screenState = useStore(s => s.screenState);
  const gameLog = useStore(s => s.gameLog);
  const exportGameLog = useStore(s => s.exportGameLog);
  const [expanded, setExpanded] = useState(false);

  const handleExportLog = useCallback(() => {
    const json = exportGameLog();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    link.download = `guzhenren-log-${timestamp}.json`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [exportGameLog]);

  const color = COLOR_MAP[phase] || 'var(--gu-text-disabled)';
  const lastLogs = gameLog.slice(-5).reverse();

  // ⚠️ 所有 Hooks 必须在条件返回之前调用！
  if (screenState !== 'game_play') return null;

  return (
    <div style={{
      position: 'fixed', bottom: 56, right: 8, zIndex: 9999,
      background: 'var(--gu-bg-glass)', backdropFilter: 'blur(6px)',
      border: `1px solid ${color}44`, borderRadius: 6,
      padding: '8px 12px', maxWidth: expanded ? 420 : 340, fontFamily: 'monospace',
      fontSize: 11, lineHeight: 1.5,
      pointerEvents: 'none',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: expanded ? 6 : 0 }}>
        <div style={{ color, fontWeight: 700 }}>
          ● <span style={{ fontSize: 13 }}>{phase}</span>
          <span style={{ color: 'var(--gu-text-disabled)', marginLeft: 10 }}>T{turn} {screenState}</span>
        </div>
        <div style={{ display: 'flex', gap: 4, pointerEvents: 'auto' }}>
          <button
            onClick={() => setExpanded(v => !v)}
            style={{
              background: 'var(--gu-bg-elevated)', border: '1px solid var(--gu-trace-slate)',
              borderRadius: 3, color: 'var(--gu-text-secondary)', fontSize: 9, padding: '2px 6px',
              cursor: 'pointer',
            }}
          >
            {expanded ? '收起' : `日志(${gameLog.length})`}
          </button>
          <button
            onClick={handleExportLog}
            style={{
              background: 'var(--gu-trace-gold-dim)', border: '1px solid var(--gu-trace-gold)',
              borderRadius: 3, color: 'var(--gu-trace-gold)', fontSize: 9, padding: '2px 6px',
              cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            导出日志
          </button>
        </div>
      </div>

      {error && (
        <div style={{ color: 'var(--gu-life-crimson)', fontSize: 10, wordBreak: 'break-all', marginTop: 2 }}>
          {error}
        </div>
      )}

      {expanded && (
        <div style={{
          maxHeight: 240, overflowY: 'auto', marginTop: 6,
          borderTop: '1px solid var(--gu-trace-slate)', paddingTop: 6,
          pointerEvents: 'auto',
        }}>
          {lastLogs.length === 0 ? (
            <div style={{ color: 'var(--gu-text-disabled)', fontSize: 10, fontStyle: 'italic' }}>暂无日志</div>
          ) : (
            lastLogs.map(entry => (
              <div key={entry.id} style={{
                display: 'flex', gap: 6, fontSize: 10, padding: '2px 0',
                borderBottom: '1px solid var(--gu-trace-slate)',
                color: entry.category === 'combat' ? 'var(--gu-life-crimson)' :
                       entry.category === 'achievement' ? 'var(--gu-trace-gold)' :
                       entry.category === 'economy' ? 'var(--gu-life-verdant)' : 'var(--gu-text-secondary)',
              }}>
                <span style={{ color: 'var(--gu-text-disabled)', width: 16, flexShrink: 0 }}>T{entry.turn}</span>
                <span style={{ color: 'var(--gu-text-disabled)', width: 60, flexShrink: 0, textTransform: 'uppercase' }}>{entry.category}</span>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.message}</span>
              </div>
            ))
          )}
        </div>
      )}

      <div style={{ color: '#444', fontSize: 9, marginTop: 4, fontStyle: 'italic' }}>
        导出日志获取完整 JSON 记录 · F12 Console
      </div>
    </div>
  );
}
