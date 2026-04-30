import { useStore } from '../../store';

const COLOR_MAP: Record<string, string> = {
  RESOLVED: '#30d080', ERROR: '#e85050', FETCHING: '#b8860b',
  IDLE: '#555', BUILDING_CONTEXT: '#777', PARSING: '#888',
  VALIDATING_L3: '#a08030', VALIDATING_FORMAT: '#999',
};

export function DebugOverlay() {
  const phase = useStore(s => s.pipelinePhase);
  const error = useStore(s => s.pipelineError);
  const turn = useStore(s => s.turn);
  const screenState = useStore(s => s.screenState);

  if (screenState !== 'game_play') return null;

  const color = COLOR_MAP[phase] || '#999';

  return (
    <div style={{
      position: 'fixed', bottom: 56, right: 8, zIndex: 9999,
      background: 'rgba(10,10,20,0.88)', backdropFilter: 'blur(6px)',
      border: `1px solid ${color}44`, borderRadius: 6,
      padding: '8px 12px', maxWidth: 340, fontFamily: 'monospace',
      fontSize: 11, lineHeight: 1.5, pointerEvents: 'none',
    }}>
      <div style={{ color, fontWeight: 700, marginBottom: 2 }}>
        ● <span style={{ fontSize: 13 }}>{phase}</span>
        <span style={{ color: '#666', marginLeft: 10 }}>T{turn} {screenState}</span>
      </div>
      {error && (
        <div style={{ color: '#e85050aa', fontSize: 10, wordBreak: 'break-all', marginTop: 2 }}>
          {error}
        </div>
      )}
      {phase === 'RESOLVED' && (
        <div style={{ color: '#30d08055', fontSize: 10, marginTop: 2 }}>Zod ✓ L4 ✓ L3 ✓</div>
      )}
      {phase === 'FETCHING' && (
        <div style={{ color: '#b8860b55', fontSize: 10, marginTop: 2 }}>waiting for API...</div>
      )}
      <div style={{ color: '#444', fontSize: 9, marginTop: 4, fontStyle: 'italic' }}>
        查看完整日志: F12 Console
      </div>
    </div>
  );
}
