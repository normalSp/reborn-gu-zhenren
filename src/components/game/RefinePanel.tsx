/**
 * ═══ 炼蛊面板 — P4 重写：从零炼制 + 操作模式切换 ═══
 * 模式: 炼制(配方列表) / 升炼(选蛊虫) / 合炼(多选) / 拆炼(单选)
 */
import { useState, useMemo, useCallback } from 'react';
import { useStore } from '../../store';
import { refineGu, ascendGu, disassembleGu, ascendImmortalGu } from '../../engine/refine-engine';
import { isRecipeUnlocked, synthesizeRecipe, attemptCompleteFragment, canAttemptFragment, loadAllFragments } from '../../engine/recipe-discovery';
import { findMaterialSources, type MaterialSourceTag } from '../../engine/material-source-audit';
import type { RefineInput, RefineResult } from '../../engine/refine-engine';
import type { FragmentRecipe } from '../../engine/recipe-discovery';
import guDbRaw from '../../canon/gu-database.json';
import fragmentRecipesRaw from '../../canon/fragment-recipes.json';

const GU_DB = guDbRaw as Record<string, any>;
const FRAGMENTS = (fragmentRecipesRaw as any).fragments || [];

// ═══ Bug修复: selector 默认值必须是稳定引用，否则每次渲染都创建新对象→无限循环 ═══
const EMPTY_OBJ = Object.freeze({});
const EMPTY_ARR: readonly never[] = Object.freeze([]);

type OpMode = 'refine' | 'ascend' | 'disassemble';

interface RecipeEntry {
  guName: string;
  tier: number;
  path: string;
  rank: string;
  refineCost: any;
  ascCost: any;
  source: '天生' | '残方补全' | '未知';
  effect: string;
}

const SOURCE_LABELS: Record<MaterialSourceTag, string> = {
  shop: '商会',
  encounter: '遭遇',
  training_ground: '道场',
  faction: '势力',
  aperture_resource: '仙窍',
  treasure_yellow_heaven: '宝黄天',
  event_whitelist: '剧情',
  regional_generation: '野外/地域掉落',
  special_rule: '特殊规则',
};

interface RefineSourceRow {
  materialName: string;
  amount: number;
  owned: number;
  sourceLabels: string[];
  hasSource: boolean;
  enough: boolean;
}

export function RefinePanel() {
  const inventory = useStore(s => s.inventory);
  const materialBag = useStore(s => (s as any).materialBag || EMPTY_OBJ) as Record<string, number>;
  const apertureMaterials = useStore(s => (s as any).apertureInventory?.materials || EMPTY_OBJ) as Record<string, number>;
  const apertureImmortalMaterials = useStore(s => (s as any).apertureInventory?.immortalMaterials || EMPTY_OBJ) as Record<string, number>;
  const daoMarks = useStore(s => (s as any).pathBuild?.dao_marks || EMPTY_OBJ) as Record<string, number>;
  const talents = useStore(s => (s as any).selectedTalents || EMPTY_ARR) as any[];
  const refinedGuCount = useStore(s => (s as any).refinedGuCount || 0) as number;
  const completedRecipes = useStore((s: any) => s.flags?.completedRecipes || EMPTY_OBJ) as Record<string, boolean>;
  const discoveredFragments = useStore((s: any) => s.flags?.discoveredFragments || EMPTY_ARR) as string[];
  const realm = useStore((s: any) => s.profile?.realm?.grand || 1);
  const isImmortal = realm >= 6;

  const [mode, setMode] = useState<OpMode>('refine');
  const [selectedRecipe, setSelectedRecipe] = useState<string | null>(null);
  const [selectedGuIds, setSelectedGuIds] = useState<string[]>([]);
  const [result, setResult] = useState<RefineResult | null>(null);
  const [showFragmentPanel, setShowFragmentPanel] = useState(false);
  const [showImmortalAscend, setShowImmortalAscend] = useState(false);

  // ─── 配方列表（三档过滤：基础/已解锁显示，古方隐藏，进阶显示为锁定） ───
  const recipeList = useMemo((): { unlocked: RecipeEntry[]; locked: RecipeEntry[] } => {
    const unlocked: RecipeEntry[] = [];
    const locked: RecipeEntry[] = [];
    for (const [name, gu] of Object.entries(GU_DB)) {
      if (gu.isImmortalGu) continue;       // 仙蛊: 仅古方
      if (gu.noRefine) continue;
      if (!gu.refineCost && !gu.refineMaterials) continue;
      const entry: RecipeEntry = {
        guName: name,
        tier: gu.tier || 1,
        path: gu.path || '未知',
        rank: gu.rank || 'common',
        refineCost: gu.refineCost,
        ascCost: gu.ascendCost,
        source: completedRecipes[name] ? '残方补全' : (isRecipeUnlocked(name, gu) ? '天生' : '未知'),
        effect: gu.effect || '',
      };
      if (isRecipeUnlocked(name, gu)) {
        unlocked.push(entry);
      } else {
        locked.push(entry);
      }
    }
    return {
      unlocked: unlocked.sort((a, b) => a.tier - b.tier || a.guName.localeCompare(b.guName)),
      locked: locked.sort((a, b) => a.tier - b.tier || a.guName.localeCompare(b.guName)),
    };
  }, [completedRecipes]);

  const allFragmentRecipes = useMemo(() => loadAllFragments(), []);
  const selectedEntry = recipeList.unlocked.find(r => r.guName === selectedRecipe);
  const hasTalent = talents.some((t: any) => t.id === 'talent_hundred_refinements');
  const hasSavant = talents.some((t: any) => t.id === 'talent_refinement_savant' || t.id === 'ti_refine_genius');
  const materialView = useMemo(() => {
    const result: Record<string, number> = { ...materialBag };
    for (const [key, qty] of Object.entries(apertureMaterials)) {
      result[key] = (result[key] || 0) + qty;
    }
    for (const [key, qty] of Object.entries(apertureImmortalMaterials)) {
      result[key] = (result[key] || 0) + qty;
    }
    return result;
  }, [materialBag, apertureMaterials, apertureImmortalMaterials]);

  const refineSourceRows = useMemo((): RefineSourceRow[] => {
    if (!selectedEntry?.refineCost) return [];
    const costBuckets: Record<string, number>[] = [
      selectedEntry.refineCost.generic || {},
      selectedEntry.refineCost.specific || {},
      selectedEntry.refineCost.materials || {},
      selectedEntry.refineCost.immortalMaterials || {},
    ];
    const merged: Record<string, number> = {};
    for (const bucket of costBuckets) {
      for (const [materialName, amount] of Object.entries(bucket)) {
        merged[materialName] = (merged[materialName] || 0) + Number(amount || 0);
      }
    }
    return Object.entries(merged).map(([materialName, amount]) => {
      const sources = findMaterialSources(materialName);
      const sourceLabels = Array.from(new Set(sources.map(source => SOURCE_LABELS[source.tag] || source.tag)));
      const owned = materialView[materialName] || 0;
      return {
        materialName,
        amount,
        owned,
        sourceLabels,
        hasSource: sourceLabels.length > 0,
        enough: owned >= amount,
      };
    });
  }, [selectedEntry, materialView]);

  const hasBlockingRefineSource = refineSourceRows.some(row => !row.hasSource);
  const hasRefineShortage = refineSourceRows.some(row => row.hasSource && !row.enough);

  // ─── 成功率预览 ───
  const successPreview = useMemo(() => {
    if (!selectedEntry?.refineCost) return null;
    let rate = Math.max(0.1, 1 - (selectedEntry.refineCost.difficulty || 0.3) * 0.1);
    rate += (daoMarks['炼道'] || 0) * 0.02;
    if (hasTalent) rate += 0.15;
    if (hasSavant) rate += 0.20;
    return Math.min(0.95, rate);
  }, [selectedEntry, daoMarks, talents]);

  // ─── 炼制操作 ───
  const handleRefine = () => {
    if (!selectedEntry) return;
    if (hasBlockingRefineSource) {
      setResult({ success: false, message: '材料来源未登记，不能显示为可完成炼蛊。', costMaterials: [], costCurrency: 0 });
      return;
    }
    if (hasRefineShortage) {
      setResult({ success: false, message: '材料库存不足，请先按来源矩阵补齐。', costMaterials: [], costCurrency: 0 });
      return;
    }
    const result = refineGu({
      specId: selectedEntry.guName,
      name: selectedEntry.guName,
      tier: selectedEntry.tier,
      path: selectedEntry.path,
      refineMaterials: selectedEntry.refineCost ? '' : (GU_DB[selectedEntry.guName]?.refineMaterials || ''),
      refineDifficulty: selectedEntry.refineCost?.difficulty || 0.3,
    });
    setResult(result);
  };

  // ─── 升炼操作 ───
  const handleAscend = () => {
    if (selectedGuIds.length !== 1) { setResult({ success: false, message: '请选择1只蛊虫进行升炼', costMaterials: [], costCurrency: 0 }); return; }
    const result = ascendGu({ guId: selectedGuIds[0] });
    setResult(result);
    setSelectedGuIds([]);
  };

  // ─── 拆炼操作 ───
  const handleDisassemble = () => {
    if (selectedGuIds.length !== 1) { setResult({ success: false, message: '请选择1只蛊虫进行拆炼', costMaterials: [], costCurrency: 0 }); return; }
    const result = disassembleGu({ guId: selectedGuIds[0] });
    setResult(result);
    setSelectedGuIds([]);
  };

  // ─── CR3: 仙蛊升炼操作 ───
  const [ascendImmortalInput, setAscendImmortalInput] = useState<{ guId: string; immortalMaterials: string[] }>({ guId: '', immortalMaterials: ['空间晶石', '灾劫灰烬', '光阴砂', '道痕结晶'] });

  const handleAscendImmortal = () => {
    if (!ascendImmortalInput.guId) {
      setResult({ success: false, message: '请选择一只5转凡蛊作为仙蛊升炼基底', costMaterials: [], costCurrency: 0 });
      return;
    }
    const res = ascendImmortalGu(ascendImmortalInput);
    setResult(res);
    setAscendImmortalInput(p => ({ ...p, guId: '' }));
  };

  // ─── 残方操作 ───
  const [fragmentResult, setFragmentResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleAttemptComplete = useCallback((fragment: FragmentRecipe) => {
    const res = attemptCompleteFragment(fragment);
    if (res.success && res.refineInput) {
      const store = useStore.getState() as any;
      store.unlockRecipe?.(fragment.targetGu, `fragment-complete:${fragment.id}`);
    }
    setFragmentResult(res);
  }, []);

  const handleSynthesize = useCallback((fragmentId: string) => {
    const res = synthesizeRecipe(fragmentId);
    setFragmentResult(res);
  }, []);

  const toggleSelect = (id: string) => {
    if (mode === 'refine') {
      setSelectedRecipe(id);
      setResult(null);
    } else if (mode === 'ascend') {
      setSelectedGuIds(prev => prev.includes(id) ? [] : [id]);
      setResult(null);
    } else {
      setSelectedGuIds(prev => prev.includes(id) ? [] : [id]);
      setResult(null);
    }
  };

  // ─── 残方列表 ───
  const availableFragments = useMemo(() => {
    return FRAGMENTS.filter((f: any) => discoveredFragments.includes(f.id));
  }, [discoveredFragments]);

  return (
    <div className="h-full flex flex-col bg-rg-ink-900/95 text-rg-paper-200 font-panel">
      {/* Header */}
      <div className="p-4 border-b border-rg-ink-700/50">
        <h3 className="text-sm font-semibold text-rg-gold tracking-wider">炼蛊</h3>
        <p className="text-[11px] text-rg-paper-200/40 mt-1">累计炼制: {refinedGuCount} 次</p>

        {/* 操作模式切换 */}
        <div className="flex gap-1 mt-2">
          {(['refine', 'ascend', 'disassemble'] as OpMode[]).map(m => (
            <button key={m} onClick={() => { setMode(m); setSelectedRecipe(null); setSelectedGuIds([]); setResult(null); }}
              className={`text-[10px] font-button px-2 py-0.5 rounded-sm transition-micro ${
                mode === m ? 'bg-rg-gold/20 text-rg-gold border border-rg-gold/30' : 'text-rg-paper-200/40 border border-rg-ink-700/30 hover:border-rg-gold/20'
              }`}>
              {{ refine: '炼制', ascend: '升炼', disassemble: '拆炼' }[m]}
            </button>
          ))}
          {/* CR3: 蛊仙模式下仙蛊升炼入口 */}
          {isImmortal && (
            <button key="immortal_ascend" onClick={() => { setMode('ascend'); setSelectedGuIds([]); setResult(null); setShowImmortalAscend(true); }}
              className={`text-[10px] font-button px-2 py-0.5 rounded-sm transition-micro ${showImmortalAscend ? 'bg-rg-gold/20 text-rg-gold border border-rg-gold/30' : 'text-rg-gold/60 border border-rg-gold/20 hover:border-rg-gold/40'}`}>
              仙蛊升炼
            </button>
          )}
          <button onClick={() => setShowFragmentPanel(!showFragmentPanel)}
            className={`text-[10px] font-button px-2 py-0.5 rounded-sm transition-micro ml-auto ${showFragmentPanel ? 'bg-rg-gold/20 text-rg-gold border border-rg-gold/30' : 'text-rg-paper-200/40 border border-rg-ink-700/30'}`}>
            残方({availableFragments.length})
          </button>
        </div>
      </div>

      {/* 残方子面板 */}
      {showFragmentPanel && (
        <div className="p-3 border-b border-rg-ink-700/30 bg-rg-ink-800/50 max-h-52 overflow-y-auto">
          <p className="text-[10px] text-rg-paper-200/30 mb-2">已发现残方 — 补全或合成解锁蛊方</p>
          {availableFragments.length === 0 ? (
            <p className="text-xs text-rg-paper-200/20 italic">尚未发现任何残方——探索、战斗、商会获取</p>
          ) : (
            availableFragments.map((f: any) => {
              const frag = allFragmentRecipes.find(x => x.id === f.id);
              const copies = discoveredFragments.filter((id: string) => id === f.id).length;
              const canAttempt = frag ? canAttemptFragment(frag) : false;
              const canSynthesize = copies >= (f.fragmentsRequired || 3);
              const isCompleted = completedRecipes[f.targetGu];
              return (
              <div key={f.id} className="flex flex-col px-2 py-1.5 text-[10px] border-b border-rg-ink-700/20 last:border-0 gap-1.5">
                <div className="flex items-center justify-between">
                  <span className={isCompleted ? 'text-rg-jade-400' : 'text-rg-paper-200'}>{f.name}</span>
                  <span className={isCompleted ? 'text-rg-jade-400/60 text-[9px]' : 'text-rg-paper-200/30 text-[9px]'}>
                    {isCompleted ? '已解锁' : `${copies}份/${f.fragmentsRequired}份`}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => frag && handleAttemptComplete(frag)}
                    disabled={isCompleted || !canAttempt}
                    className={`flex-1 text-[9px] py-0.5 rounded-sm font-button transition-colors ${
                      isCompleted ? 'bg-rg-ink-800/30 text-rg-paper-200/15 cursor-not-allowed' :
                      canAttempt ? 'bg-amber-400/10 border border-amber-400/25 text-amber-400 hover:bg-amber-400/20' :
                      'bg-rg-ink-800/20 border border-rg-ink-700/10 text-rg-paper-200/20 cursor-not-allowed'
                    }`}>
                    尝试补全
                  </button>
                  <button
                    onClick={() => handleSynthesize(f.id)}
                    disabled={isCompleted || !canSynthesize}
                    className={`flex-1 text-[9px] py-0.5 rounded-sm font-button transition-colors ${
                      isCompleted ? 'bg-rg-ink-800/30 text-rg-paper-200/15 cursor-not-allowed' :
                      canSynthesize ? 'bg-rg-jade-400/10 border border-rg-jade-400/25 text-rg-jade-400 hover:bg-rg-jade-400/20' :
                      'bg-rg-ink-800/20 border border-rg-ink-700/10 text-rg-paper-200/20 cursor-not-allowed'
                    }`}>
                    合成({copies}/{f.fragmentsRequired || 3})
                  </button>
                </div>
              </div>
              );
            })
          )}
          {fragmentResult && (
            <div className={`mt-2 p-2 rounded-sm text-[10px] ${fragmentResult.success ? 'bg-rg-jade-400/10 border border-rg-jade-400/30 text-rg-jade-400' : 'bg-rg-blood-400/10 border border-rg-blood-400/30 text-rg-blood-400'}`}>
              {fragmentResult.message}
              <button onClick={() => setFragmentResult(null)} className="ml-2 text-rg-paper-200/30 hover:text-rg-paper-200/60 text-[8px]">×</button>
            </div>
          )}
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* 左侧: 列表 */}
        <div className="w-1/2 border-r border-rg-ink-700/30 overflow-y-auto p-2">
          {(mode === 'refine') ? (
            <>
              <p className="text-[10px] text-rg-paper-200/30 mb-2 px-1">蛊方({recipeList.unlocked.length})</p>
              {recipeList.unlocked.map(r => (
                <button key={r.guName} onClick={() => toggleSelect(r.guName)}
                  className={`w-full text-left px-2 py-1.5 rounded-sm mb-1 text-xs transition-colors ${
                    selectedRecipe === r.guName ? 'bg-rg-gold/15 border border-rg-gold/30 text-rg-gold' :
                    'bg-rg-ink-800/50 border border-rg-ink-700/20 hover:border-rg-gold/20'
                  }`}>
                  <div className="flex items-center gap-1">
                    <span>{r.guName}</span>
                    <span className="text-[9px] text-rg-paper-200/30 ml-auto">{r.tier}转·{r.path}</span>
                  </div>
                  <div className="text-[8px] text-rg-paper-200/20 mt-0.5 truncate">{r.source}</div>
                </button>
              ))}
              {recipeList.locked.length > 0 && (
                <div className="mt-3 pt-2 border-t border-rg-ink-700/20">
                  <p className="text-[9px] text-rg-paper-200/15 mb-2 px-1">未解锁蛊方({recipeList.locked.length}) — 收集残方解锁</p>
                  {recipeList.locked.map(r => (
                    <div key={r.guName}
                      className="w-full text-left px-2 py-1.5 rounded-sm mb-1 text-xs bg-rg-ink-800/20 border border-rg-ink-700/10 opacity-50">
                      <div className="flex items-center gap-1">
                        <span className="text-rg-paper-200/30">🔒</span>
                        <span className="text-rg-paper-200/30">{r.guName}</span>
                        <span className="text-[9px] text-rg-paper-200/15 ml-auto">{r.tier}转·{r.path}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <p className="text-[10px] text-rg-paper-200/30 mb-2 px-1">
                {mode === 'ascend' ? '选择蛊虫升炼(上限5转)' : '选择蛊虫拆回蛊材'}
              </p>
              {inventory.filter((g: any) => mode !== 'ascend' || (g.tier < 5 && g.currentState !== 'dead')).map((g: any) => (
                <button key={g.id} onClick={() => toggleSelect(g.id)}
                  className={`w-full text-left px-2 py-1.5 rounded-sm mb-1 text-xs transition-colors ${
                    selectedGuIds.includes(g.id) ? 'bg-rg-gold/15 border border-rg-gold/30 text-rg-gold' :
                    'bg-rg-ink-800/50 border border-rg-ink-700/20 hover:border-rg-gold/20'
                  }`}>
                  <div className="flex items-center gap-1">
                    <span>{g.name}</span>
                    <span className="text-[9px] text-rg-paper-200/30 ml-auto">{g.tier}转·{g.path}</span>
                  </div>
                </button>
              ))}
            </>
          )}
        </div>

        {/* 右侧: 详情+操作 */}
        <div className="w-1/2 p-3 overflow-y-auto">
          {mode === 'refine' && selectedEntry ? (
            <div className="space-y-3">
              <div><span className="text-xs text-rg-paper-200/40">蛊虫</span><p className="text-sm text-rg-paper-100 font-semibold">{selectedEntry.guName}</p></div>
              <div><span className="text-xs text-rg-paper-200/40">流派</span><p className="text-xs text-rg-paper-200/80">{selectedEntry.path} · {selectedEntry.tier}转 · {selectedEntry.rank}</p></div>
              <div><span className="text-xs text-rg-paper-200/40">效果</span><p className="text-[10px] text-rg-paper-200/50 line-clamp-2">{selectedEntry.effect}</p></div>
              {selectedEntry.refineCost && (
                <div>
                  <span className="text-xs text-rg-paper-200/40">所需材料</span>
                  <div className="text-[10px] text-rg-paper-200/60 mt-0.5">
                    {Object.entries(selectedEntry.refineCost.generic || {} as Record<string,number>).map(([k, v]) => <span key={k} className="mr-2">{k}×{v}</span>)}
                    {Object.entries(selectedEntry.refineCost.specific || {} as Record<string,number>).map(([k, v]) => <span key={k} className="mr-2">{k}×{v}</span>)}
                    <span className="block mt-1">元石 {selectedEntry.refineCost.currency} | 耗时 {selectedEntry.refineCost.turns}回合</span>
                  </div>
                </div>
              )}
              {refineSourceRows.length > 0 && (
                <div className="rounded-sm border border-rg-ink-700/40 bg-rg-ink-800/35 p-2">
                  <span className="text-xs text-rg-paper-200/40">来源矩阵</span>
                  <div className="mt-1 space-y-1">
                    {refineSourceRows.map(row => (
                      <div key={row.materialName} className={`text-[10px] leading-4 ${!row.hasSource || !row.enough ? 'text-rg-gold' : 'text-rg-paper-200/55'}`}>
                        <div className="flex justify-between gap-2">
                          <span className="truncate">{row.materialName}</span>
                          <span className="shrink-0">库存 {row.owned}/{row.amount}</span>
                        </div>
                        <div className="text-rg-paper-200/35 truncate">
                          {row.hasSource ? `来源：${row.sourceLabels.join(' / ')}` : '来源：未登记，需补真相源'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {successPreview !== null && (
                <div>
                  <span className="text-xs text-rg-paper-200/40">成功率</span>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-3 bg-rg-ink-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${successPreview >= 0.7 ? 'bg-rg-jade-400' : successPreview >= 0.4 ? 'bg-amber-400' : 'bg-rg-blood-400'}`}
                        style={{ width: `${Math.round(successPreview * 100)}%` }} />
                    </div>
                    <span className="text-xs font-bold">{Math.round(successPreview * 100)}%</span>
                  </div>
                </div>
              )}
              <button onClick={handleRefine} disabled={hasBlockingRefineSource || hasRefineShortage} className={`w-full py-2 rounded-sm text-xs font-button font-semibold transition-colors ${hasBlockingRefineSource || hasRefineShortage ? 'bg-rg-ink-700 text-rg-paper-200/30 cursor-not-allowed' : 'bg-rg-gold text-rg-ink-900 hover:brightness-115'}`}>
                开始炼制
              </button>
            </div>
          ) : mode === 'ascend' && selectedGuIds.length === 1 && !showImmortalAscend ? (
            <div className="space-y-3">
              <p className="text-sm font-semibold">{inventory.find((g: any) => g.id === selectedGuIds[0])?.name}</p>
              <p className="text-xs text-rg-paper-200/50">升炼将提升蛊虫转数（上限5转），失败则蛊虫饥饿+1级</p>
              <button onClick={handleAscend} className="w-full py-2 rounded-sm text-xs font-button font-semibold bg-rg-gold text-rg-ink-900 hover:brightness-115 transition-colors">
                确认升炼
              </button>
            </div>
          ) : mode === 'ascend' && showImmortalAscend ? (
            /* CR3: 仙蛊升炼界面 — 蛊仙将5转凡蛊升为6转仙蛊 */
            <div className="space-y-3">
              <div className="bg-rg-gold/5 border border-rg-gold/15 rounded-md p-2">
                <p className="text-[10px] text-rg-gold/80 font-panel">仙蛊升炼 - 以5转凡蛊为基底，消耗仙材与炼道道痕，凡蛊蜕变升华为独一无二的仙蛊</p>
                <p className="text-[9px] text-rg-gold/40 mt-1">成功率极低(3-8%)，失败则损失仙材与凡蛊</p>
              </div>
              <div>
                <span className="text-xs text-rg-paper-200/40">选择基底凡蛊（5转）</span>
                <div className="mt-1 max-h-32 overflow-y-auto space-y-0.5">
                  {inventory.filter((g: any) => g.tier === 5 && !g.bonded && !g.isImmortalGu).map((g: any) => (
                    <button key={g.id} onClick={() => setAscendImmortalInput(p => ({ ...p, guId: g.id }))}
                      className={`w-full text-left px-2 py-1 rounded-sm text-xs transition-colors ${ascendImmortalInput.guId === g.id ? 'bg-rg-gold/15 border border-rg-gold/30 text-rg-gold' : 'bg-rg-ink-800/50 border border-rg-ink-700/20 text-rg-paper-200/60 hover:border-rg-gold/20'}`}>
                      {g.name} · {g.path}
                    </button>
                  ))}
                  {inventory.filter((g: any) => g.tier === 5 && !g.bonded && !g.isImmortalGu).length === 0 && (
                    <p className="text-[10px] text-rg-paper-200/20 italic">无可用5转凡蛊作为升炼基底</p>
                  )}
                </div>
              </div>
              <div>
                <span className="text-xs text-rg-paper-200/40">可用仙材</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {['空间晶石', '灾劫灰烬', '光阴砂', '道痕结晶', '三兽血瓶', '地火核心', '九天罡风', '福地本源', '星辉碎片', '古兽真血'].map(mat => {
                    const qty = materialView[mat] || 0;
                    return (
                      <span key={mat} className={`text-[9px] px-1.5 py-0.5 rounded-sm ${qty > 0 ? 'bg-rg-ink-700/50 text-rg-paper-200/50' : 'bg-rg-ink-800/30 text-rg-ink-500'}`}>
                        {mat}×{qty}
                      </span>
                    );
                  })}
                </div>
              </div>
              <button onClick={handleAscendImmortal} disabled={!ascendImmortalInput.guId}
                className={`w-full py-2 rounded-sm text-xs font-button font-semibold transition-colors ${ascendImmortalInput.guId ? 'bg-rg-gold text-rg-ink-900 hover:brightness-115' : 'bg-rg-ink-700/50 text-rg-ink-500 cursor-not-allowed'}`}>
                仙蛊升炼
              </button>
            </div>
          ) : mode === 'disassemble' && selectedGuIds.length === 1 ? (
            <div className="space-y-3">
              <p className="text-sm font-semibold">{inventory.find((g: any) => g.id === selectedGuIds[0])?.name}</p>
              <p className="text-xs text-rg-paper-200/50">拆回蛊材（回收率80%），本命蛊不可拆炼</p>
              <button onClick={handleDisassemble} className="w-full py-2 rounded-sm text-xs font-button font-semibold bg-rg-gold text-rg-ink-900 hover:brightness-115 transition-colors">
                确认拆炼
              </button>
            </div>
          ) : (
            <p className="text-xs text-rg-paper-200/20 italic">
              {mode === 'refine' ? '选择左侧蛊方查看详情' : '选择左侧蛊虫进行操作'}
            </p>
          )}

          {/* 结果提示 */}
          {result && (
            <div className={`mt-3 p-2 rounded-sm text-xs ${result.success ? 'bg-rg-jade-400/10 border border-rg-jade-400/30 text-rg-jade-400' : 'bg-rg-blood-400/10 border border-rg-blood-400/30 text-rg-blood-400'}`}>
              {result.message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
