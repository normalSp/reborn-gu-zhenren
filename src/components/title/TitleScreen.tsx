import { useState } from 'react';
import { callDeepSeek, apiKey } from '../../api/deepseek';
import { useStore } from '../../store';
import { ArrowRightIcon } from '../../icons';
import type { ScreenState } from '../../store/slices/uiSlice';

interface TitleScreenProps {
  onStart: () => void;
  onContinue: () => void;
}

export function TitleScreen({ onStart, onContinue }: TitleScreenProps) {
  const [keyInput, setKeyInput] = useState(apiKey.get() || '');
  const [showKey, setShowKey] = useState(false);
  const [screenState, setScreenState] = useState<'input_key' | 'testing' | 'result'>(
    apiKey.get() ? 'input_key' : 'input_key'
  );
  const [resultMessage, setResultMessage] = useState('');
  const [resultSuccess, setResultSuccess] = useState(false);
  const [tokenInfo, setTokenInfo] = useState('');

  // ─── M4: 存档检测 — 续档条件: turn>1 且 profile.name 非空 ───
  const hasSavedGame = useStore(s => s.turn > 1 && (s.profile?.name?.length ?? 0) > 0);
  const saveTurn = useStore(s => s.turn);
  const saveRealm = useStore(s => s.profile?.realm?.label ?? '');
  const saveBackground = useStore(s => s.profile?.background ?? '');
  const saveLocation = useStore(s => (s as any).playerPosition?.region ?? '');

  const storeScreenState = useStore(s => s.screenState);

  const handleContinue = () => {
    onContinue();
  };

  const handleTestConnection = async () => {
    if (!keyInput.trim()) return;
    apiKey.set(keyInput.trim());
    setScreenState('testing');
    setResultMessage('');

    const response = await callDeepSeek(
      '你是一个测试响应系统。收到任何消息，只需回复一个JSON对象：{"message":"天道已响应","status":"ok"}。不要输出任何其他内容。',
      '当前时序',
      { apiKey: keyInput.trim() }
    );

    if (response.success && response.data) {
      setResultSuccess(true);
      setResultMessage(response.data.message || '天道已响应 — API 连通成功');
      setTokenInfo(
        `耗时 ${response.elapsedMs}ms · Tokens ${response.tokens?.total_tokens ?? '?'} (缓存命中 ${response.tokens?.cached_tokens ?? 0})`
      );
    } else {
      setResultSuccess(false);
      setResultMessage(response.error || '连接失败，请检查 API Key');
      setTokenInfo(`重试 ${response.retries ?? 0} 次后失败`);
    }
    setScreenState('result');
  };

  const handleClearKey = () => {
    apiKey.remove();
    setKeyInput('');
    setScreenState('input_key');
    setResultMessage('');
    setTokenInfo('');
  };

  const handleStartGame = () => {
    if (resultSuccess && apiKey.get()) {
      onStart();
    }
  };

  return (
    <div className="min-h-[100dvh] bg-rg-ink-800 flex flex-col items-center justify-center p-8 md:p-12">
      {/* ─── 标题 ─── */}
      <div className="mt-12 mb-12">
        <h1 className="text-4xl font-bold text-rg-gold mb-3 font-narrative tracking-wider">
          蛊真人世界
        </h1>
        <p className="text-rg-paper-100 text-lg font-panel tracking-[0.15em]">
          人生重来模拟器
        </p>
        <div className="mt-6 w-16 h-[1px] bg-rg-gold/40" />
      </div>

      {/* ─── 主面板 (surface-raised) ─── */}
      <div className="w-full max-w-md bg-rg-ink-700/90 border border-rg-ink-300/12 rounded-lg p-8 shadow-lg shadow-black/40 backdrop-blur-md">
        {/* API Key 输入区 */}
        <label className="block text-rg-paper-200 text-sm font-panel mb-2">
          蛊界天道密钥
        </label>
        <div className="flex gap-2 mb-4">
          <input
            type={showKey ? 'text' : 'password'}
            value={keyInput}
            onChange={e => setKeyInput(e.target.value)}
            placeholder="输入你的 DeepSeek API Key..."
            className="flex-1 bg-rg-ink-900 border border-rg-ink-500/30 text-rg-paper-100 font-panel px-3 py-2 rounded-sm
                       placeholder:text-rg-ink-400 focus:outline-none focus:border-rg-gold/60 focus:shadow-[0_0_0_2px_rgba(184,134,11,0.2)]"
            disabled={screenState === 'testing'}
            onKeyDown={e => e.key === 'Enter' && handleTestConnection()}
          />
          <button
            onClick={() => setShowKey(!showKey)}
            className="text-rg-ink-300 hover:text-rg-paper-100 text-sm font-button px-2 transition-micro"
          >
            {showKey ? '隐藏' : '显示'}
          </button>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-3">
          <button
            onClick={handleTestConnection}
            disabled={screenState === 'testing' || !keyInput.trim()}
            className="flex-1 bg-rg-gold text-rg-ink-900 font-button font-semibold px-4 py-2 rounded-sm
                       hover:brightness-115 hover:scale-[1.02] transition-micro
                       disabled:opacity-40 disabled:hover:scale-100 disabled:hover:brightness-100 disabled:cursor-not-allowed"
          >
            {screenState === 'testing' ? '正在连接蛊界天道...' : '测试连通'}
          </button>
          {apiKey.get() && (
            <button
              onClick={handleClearKey}
              className="text-rg-paper-200/50 hover:text-rg-blood-600 font-button text-sm px-3 py-2 transition-micro"
            >
              清除
            </button>
          )}
        </div>

        {/* 测试中加载动画 */}
        {screenState === 'testing' && (
          <div className="mt-6 text-center">
            <div className="inline-block w-3 h-3 bg-rg-gold rounded-full animate-pulse mr-2" />
            <span className="text-rg-paper-200/70 text-sm font-panel cursor-blink">
              正在连接蛊界天道
            </span>
          </div>
        )}

        {/* 测试结果 (surface-elevated) */}
        {screenState === 'result' && (
          <div className={`mt-6 p-4 rounded-sm border ${
            resultSuccess
              ? 'bg-rg-jade-600/20 border-rg-jade-400/40'
              : 'bg-rg-blood-600/20 border-rg-blood-400/40'
          }`}>
            <p className={`text-sm font-panel ${
              resultSuccess ? 'text-rg-jade-200' : 'text-rg-blood-200'
            }`}>
              {resultMessage}
            </p>
            {tokenInfo && (
              <p className="text-rg-paper-200/60 text-xs font-panel mt-2">
                {tokenInfo}
              </p>
            )}
            <div className="flex gap-3 mt-3">
              <button
                onClick={() => { setScreenState('input_key'); setResultMessage(''); }}
                className="text-rg-ink-300 hover:text-rg-paper-100 text-xs font-button transition-micro"
              >
                返回重新测试
              </button>
              {resultSuccess && (
                <button
                  onClick={handleStartGame}
                  className="bg-rg-gold text-rg-ink-900 font-button font-semibold text-xs px-4 py-1.5 rounded-sm
                             hover:brightness-115 transition-micro"
                >
                  进入蛊界
                </button>
              )}
            </div>
          </div>
        )}

        {/* 底部系统信息 */}
        <div className="mt-8 pt-4 border-t border-rg-ink-400/20">
          {/* ─── M4: 继续冒险入口 ─── */}
          {hasSavedGame && (
            <button
              onClick={handleContinue}
              className="w-full mb-3 bg-rg-ink-900/80 border border-rg-gold/25 hover:border-rg-gold/60 
                         rounded-sm p-3 transition-micro group text-left"
            >
              <div className="flex items-center justify-between">
                <span className="text-rg-gold font-narrative text-sm tracking-wider group-hover:brightness-125 transition-micro">
                  继续冒险
                </span>
                <span className="text-rg-gold/40 text-xs group-hover:text-rg-gold/70 transition-micro">
                  <ArrowRightIcon size={14} className="inline-block" />
                </span>
              </div>
              <p className="text-rg-paper-200/50 text-xs font-panel mt-1">
                第{saveTurn}回合 · {saveRealm}
                {saveLocation ? ` · ${saveLocation}` : ` · ${saveBackground}`}
              </p>
            </button>
          )}
          <p className="text-rg-ink-300 text-xs font-panel text-center">
            蛊真人世界 · 人生重来模拟器 · v0.5.0
          </p>
          <p className="text-rg-ink-400 text-xs font-panel text-center mt-1">
            DeepSeek V4 Pro · React · TypeScript · 账簿式 UI
          </p>
        </div>
      </div>

      {/* 底部提示 */}
      <p className="mt-8 text-rg-ink-300/80 text-xs font-panel max-w-md text-center leading-relaxed">
        API Key 仅存储在浏览器本地，不会上传至任何服务器。
        你可以随时在设置中更换或清除密钥。
      </p>
    </div>
  );
}
