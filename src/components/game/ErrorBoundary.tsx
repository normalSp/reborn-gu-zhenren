import { Component, type ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; errorMsg: string; }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMsg: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMsg: error.message || '未知错误' };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[100dvh] bg-rg-ink-800 flex flex-col items-center justify-center p-8">
          <h1 className="text-2xl font-bold text-rg-gold font-narrative mb-4">
            蛊虫失控
          </h1>
          <p className="text-rg-paper-200/50 text-sm font-panel mb-6 text-center max-w-md">
            游戏中出现了意料之外的错误。蛊虫反噬，天道紊乱。请刷新页面重试。
          </p>
          <code className="text-rg-blood-400/60 text-xs font-mono bg-rg-ink-900 px-4 py-2 rounded mb-6 max-w-md break-all">
            {this.state.errorMsg}
          </code>
          <button
            onClick={() => window.location.reload()}
            className="bg-rg-gold hover:bg-rg-gold/80 text-rg-ink-900 font-button font-semibold px-6 py-3 rounded-sm transition-micro"
          >
            重新感应天道
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
