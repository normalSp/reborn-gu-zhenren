/**
 * ChapterTransition — 转章过场动画组件
 * P1基础架构：淡入动画 + 章节标题 + 叙事摘要 + 确认按钮
 * P2扩展：多路由选项UI + 五域差异化美术风格（M7） + 音效（P2-7）
 * M7 Phase 2: GSAP Timeline 6阶段水墨扩散过渡
 */
import React, { useEffect, useState } from 'react';
import { useStore } from '../../store';
import type { ChapterDefinition, ChapterRoute } from '../../types';
import chaptersRaw from '../../canon/chapters.json';
import { isReducedMotion } from '../../hooks/useReducedMotion';

const chaptersData = chaptersRaw as { domains: Record<string, ChapterDefinition[]> };

export const ChapterTransition: React.FC = () => {
  const [opacity, setOpacity] = useState(0);
  const [showContent, setShowContent] = useState(false);

  const transitionState = useStore(s => s.transitionState);
  const currentDomain = useStore(s => s.currentDomain);
  const activateChapter = useStore(s => s.activateChapter);
  const setTransitionState = useStore(s => s.setTransitionState);
  const finalizeChapter = useStore(s => s.finalizeChapter);
  const checkProgression = useStore(s => s.checkProgression);
  const turn = useStore(s => s.turn);
  // P2: 多路由选项
  const nextChapterOptions = useStore(s => (s as any).nextChapterOptions as ChapterRoute[]);
  const proximityEvents = useStore(s => (s as any).proximityEvents);

  const [nextChapter, setNextChapter] = useState<ChapterDefinition | null>(null);
  const [progressionResult, setProgressionResult] = useState<ReturnType<typeof checkProgression> | null>(null);
  // P2: 多路由选择状态
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number>(0);
  const [isMultiRoute, setIsMultiRoute] = useState(false);

  // 检测转章触发
  useEffect(() => {
    if (transitionState !== 'idle') return;

    const result = checkProgression();
    if (result.shouldTransition) {
      setProgressionResult(result);

      // P2: 判断是否多路由
      const options = result.nextChapterOptions || [];
      if (options.length > 1) {
        setIsMultiRoute(true);
        setSelectedRouteIndex(0);
      } else {
        setIsMultiRoute(false);
      }

      setTransitionState('transitioning');
    }
  }, [transitionState, turn, checkProgression, setTransitionState]);

  // ─── M7: 转章过渡 — 仅负责 DOM 渲染，GSAP 动画由 useAnimationBridge 统一调度 ───
  useEffect(() => {
    if (transitionState !== 'transitioning') return;

    // BugFix: pipeline 直接调用 setTransitionState('transitioning') 会跳过
    // 第一个 useEffect 的 checkProgression()，导致 progressionResult 为空
    // 这里兜底：progressionResult 为空时自行调用 checkProgression 获取数据
    let effectiveResult = progressionResult;
    if (!effectiveResult || !effectiveResult.shouldTransition) {
      const result = checkProgression();
      if (result.shouldTransition) {
        effectiveResult = result;
        // 解析路由选项
        const options = result.nextChapterOptions || [];
        if (options.length > 1) {
          setIsMultiRoute(true);
          setSelectedRouteIndex(0);
        } else {
          setIsMultiRoute(false);
        }
      }
    }
    // 保持 progressionResult 为最新（供 handleConfirm 使用）
    if (effectiveResult !== progressionResult) {
      setProgressionResult(effectiveResult as any);
    }

    // 解析下一章节信息
    if (isMultiRoute && effectiveResult?.nextChapterOptions) {
      const selectedRoute = effectiveResult.nextChapterOptions[selectedRouteIndex];
      if (selectedRoute) {
        const chapters = chaptersData.domains[selectedRoute.domain] || [];
        const def = chapters.find(c => c.id === selectedRoute.chapterId);
        setNextChapter(def || null);
      }
    } else if (effectiveResult?.nextChapterId) {
      const domain = effectiveResult.nextDomain || currentDomain;
      const chaptersAll = chaptersData.domains as any;
      const domainKey = effectiveResult.nextDomain || currentDomain;
      const chapters = chaptersAll[domainKey] || [];
      const next = chapters.find((c: any) => c.id === effectiveResult!.nextChapterId);
      if (!next && domainKey !== currentDomain) {
        // 跨域查找：key 名称不同（如 '南疆' vs 'nanjiang'）
        const fallbackKey = Object.keys(chaptersData.domains).find(
          k => k.toLowerCase().replace(/\s/g, '') === domainKey.toLowerCase().replace(/\s/g, '')
        );
        if (fallbackKey) {
          const nextInFallback = chaptersData.domains[fallbackKey].find(c => c.id === effectiveResult!.nextChapterId);
          setNextChapter(nextInFallback || null);
        } else {
          setNextChapter(null);
        }
      } else {
        setNextChapter(next || null);
      }
    }

    // 先让 React 渲染出 DOM 节点，再交给 useAnimationBridge 的 GSAP 来动画
    setShowContent(true);
    if (isReducedMotion()) {
      setOpacity(1);
    } else {
      // 用 rAF 确保 React 提交了 DOM 后 GSAP 能找到目标元素
      setOpacity(0);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setOpacity(0.85);
        });
      });
    }

    // 安全兜底：30s 后自动关闭过渡（防止 overlay 因任何原因阻挡 UI）
    const safetyTimer = setTimeout(() => {
      console.warn('[ChapterTransition] 安全超时自动关闭过渡');
      setShowContent(false);
      setOpacity(0);
      setTimeout(() => {
        setTransitionState('idle');
        setNextChapter(null);
        setProgressionResult(null);
        setIsMultiRoute(false);
        setSelectedRouteIndex(0);
      }, 600);
    }, 30_000);

    return () => {
      clearTimeout(safetyTimer);
    };
  }, [transitionState, progressionResult, currentDomain, isMultiRoute, selectedRouteIndex]);

  const handleConfirm = () => {
    // P2: 多路由模式 — 使用选中路由的chapterId
    let targetChapterId: string | undefined;
    if (isMultiRoute && progressionResult?.nextChapterOptions) {
      targetChapterId = progressionResult.nextChapterOptions[selectedRouteIndex]?.chapterId;
    } else {
      targetChapterId = progressionResult?.nextChapterId;
    }

    if (!targetChapterId) return;

    // 完成当前章节记录
    finalizeChapter();

    // 淡出
    setShowContent(false);
    setOpacity(0);

    setTimeout(() => {
      // 激活下一章节
      activateChapter(targetChapterId!);
      setTransitionState('idle');
      setNextChapter(null);
      setProgressionResult(null);
      setIsMultiRoute(false);
      setSelectedRouteIndex(0);
    }, 600);
  };

  if (transitionState !== 'transitioning') return null;

  // P2: 多路由选择模式 — 显示路由卡片供玩家选择
  const multiRoutes = progressionResult?.nextChapterOptions || [];
  const showRouteSelector = isMultiRoute && multiRoutes.length > 1;

  return (
    <div
      className="chapter-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'var(--gu-bg-deep)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        opacity,
        transition: 'opacity 0.5s ease-in-out',
        pointerEvents: showContent ? 'auto' : 'none',
      }}
    >
      {/* M7: 水墨遮罩层（GSAP 动画目标） */}
      <div
        className="ink-mask"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          width: '600px',
          height: '600px',
          transform: 'translate(-50%, -50%) scale(0)',
          opacity: 0,
          background: 'radial-gradient(ellipse at center, var(--gu-bg-deep) 0%, var(--gu-bg-deep) 40%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 1001,
        }}
      />
      {showContent && (
        <div style={{ textAlign: 'center', maxWidth: showRouteSelector ? '720px' : '600px', padding: '40px' }}>
          {/* ─── P2: 多路由选择面板 ─── */}
          {showRouteSelector && (
            <>
              <h2
                className="chapter-title"
                style={{
                  fontSize: '28px',
                  fontWeight: 'bold',
                  color: 'var(--gu-trace-gold)',
                  marginBottom: '8px',
                  fontFamily: '"Serif", serif',
                  letterSpacing: '0.1em',
                }}
              >
                前路抉择
              </h2>
              <p
                style={{
                  fontSize: '14px',
                  color: 'var(--gu-text-secondary)',
                  marginBottom: '24px',
                  letterSpacing: '0.1em',
                }}
              >
                {multiRoutes.length} 条路径展现在你面前，选择一条踏入新的篇章
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                {multiRoutes.map((route, idx) => {
                  const isSelected = idx === selectedRouteIndex;
                  const chapterDef = chaptersData.domains[route.domain]?.find(c => c.id === route.chapterId);
                  return (
                    <div
                      key={route.chapterId}
                      onClick={() => setSelectedRouteIndex(idx)}
                      style={{
                        padding: '16px 24px',
                        border: isSelected
                          ? '2px solid var(--gu-trace-gold)'
                          : '1px solid var(--gu-trace-slate)',
                        borderRadius: '6px',
                        backgroundColor: isSelected
                          ? 'var(--gu-trace-gold-dim)'
                          : 'var(--gu-bg-elevated)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        textAlign: 'left',
                      }}
                      onMouseEnter={e => {
                        if (!isSelected) e.currentTarget.style.borderColor = 'var(--gu-trace-gold)';
                      }}
                      onMouseLeave={e => {
                        if (!isSelected) e.currentTarget.style.borderColor = 'var(--gu-trace-slate)';
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '18px', color: 'var(--gu-trace-gold-bright)', fontFamily: '"Serif", serif', marginBottom: '4px' }}>
                            {route.displayName}
                          </div>
                          <div style={{ fontSize: '13px', color: 'var(--gu-text-secondary)' }}>
                            {route.domain} · {chapterDef?.position?.area || '未知区域'}
                            {route.domainOpeningChapter && (
                              <span style={{ color: 'var(--gu-trace-gold)', marginLeft: '8px' }}>【新域开启】</span>
                            )}
                          </div>
                          {chapterDef?.sceneConstraints?.narrativeTheme && (
                            <div style={{ fontSize: '12px', color: 'var(--gu-text-disabled)', marginTop: '4px', fontStyle: 'italic' }}>
                              {chapterDef.sceneConstraints.narrativeTheme.substring(0, 60)}...
                            </div>
                          )}
                        </div>
                        {isSelected && (
                          <div style={{
                            width: '20px', height: '20px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--gu-trace-gold-dim)',
                            border: '2px solid var(--gu-trace-gold)',
                          }} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 临近名场面提示 */}
              {proximityEvents && proximityEvents.length > 0 && (
                <div style={{ marginBottom: '24px', fontSize: '12px', color: 'var(--gu-text-disabled)' }}>
                  临近事件：{proximityEvents.slice(0, 3).map(e => e.name).join(' · ')}
                </div>
              )}
            </>
          )}

          {/* ─── 单路由模式：章节标题 ─── */}
          {!showRouteSelector && (
            <h2
              className="chapter-title"
              style={{
                fontSize: '36px',
                fontWeight: 'bold',
                color: 'var(--gu-trace-gold)',
                marginBottom: '16px',
                fontFamily: '"Serif", serif',
                letterSpacing: '0.1em',
              }}
            >
              {nextChapter?.displayName || '新章节'}
            </h2>
          )}

          {/* 域标识 */}
          <div
            style={{
            fontSize: '14px',
            color: 'var(--gu-text-secondary)',
            marginBottom: '32px',
              letterSpacing: '0.2em',
            }}
          >
            {nextChapter?.domain || currentDomain}
          </div>

          {/* 位置区域 */}
          {nextChapter && (
            <div
              style={{
              fontSize: '16px',
              color: 'var(--gu-trace-gold)',
              marginBottom: '24px',
                lineHeight: '1.6',
              }}
            >
              区域：{nextChapter.position.area}
            </div>
          )}

          {/* 叙事主题（GSAP 动画目标：.chapter-epigraph） */}
          <div
            className="chapter-epigraph"
            style={{
              fontSize: '14px',
              color: 'var(--gu-text-secondary)',
              marginBottom: '40px',
              lineHeight: '1.8',
              fontStyle: 'italic',
              padding: '0 20px',
              minHeight: '20px',
            }}
          >
            {nextChapter ? nextChapter.sceneConstraints.narrativeTheme : '\u00A0'}
          </div>

          {/* 目标预览 */}
          {nextChapter && nextChapter.goals.length > 0 && (
            <div style={{ marginBottom: '40px', textAlign: 'left' }}>
              <div style={{ fontSize: '13px', color: 'var(--gu-text-secondary)', marginBottom: '8px' }}>
                本章目标：
              </div>
              {nextChapter.goals.map(g => (
                <div
                  key={g.id}
                  style={{
                  fontSize: '14px',
                  color: 'var(--gu-trace-gold)',
                  padding: '4px 0',
                  }}
                >
                  {g.description}
                </div>
              ))}
            </div>
          )}

          {/* 确认按钮 */}
          <button
            onClick={handleConfirm}
            style={{
              padding: '12px 48px',
              fontSize: '18px',
              backgroundColor: 'transparent',
              color: 'var(--gu-trace-gold)',
              border: '1px solid var(--gu-trace-gold)',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              fontFamily: '"Serif", serif',
              letterSpacing: '0.1em',
              pointerEvents: 'auto',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = 'var(--gu-bg-elevated)';
              e.currentTarget.style.borderColor = 'var(--gu-trace-gold-bright)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = 'var(--gu-trace-gold)';
            }}
          >
            踏入新章
          </button>

          {/* P2: 多路由选择次要选项 */}
          {showRouteSelector && multiRoutes.length > 1 && selectedRouteIndex < multiRoutes.length - 1 && (
            <div style={{ marginTop: '8px', display: 'flex', gap: '16px', justifyContent: 'center' }}>
              {multiRoutes.map((route, idx) => (
                idx !== selectedRouteIndex && (
                  <button
                    key={route.chapterId}
                    onClick={() => setSelectedRouteIndex(idx)}
                    style={{
                      padding: '8px 16px',
                      fontSize: '13px',
                      backgroundColor: 'transparent',
                      color: 'var(--gu-text-secondary)',
                      border: '1px solid var(--gu-trace-slate)',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontFamily: '"Serif", serif',
                      letterSpacing: '0.1em',
                      pointerEvents: 'auto',
                    }}
                  >
                    {route.displayName}
                  </button>
                )
              ))}
            </div>
          )}

          {progressionResult?.reason && (
            <div style={{ fontSize: '12px', color: 'var(--gu-text-disabled)', marginTop: '16px' }}>
              {progressionResult.reason}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
