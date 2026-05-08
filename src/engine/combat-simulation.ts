import combatConfigRaw from '../canon/combat-config.json';
import type { DuelAction, DuelMove, DuelResult, DuelState } from '../types';
import { executeEnemyTurn, executePlayerTurn } from './combat-engine';
import { createSeededRng } from './combat-formulas';

const config = combatConfigRaw as any;

export type CombatSimulationStrategy = 'attack_only' | 'best_available' | 'escape_first';

export interface CombatSimulationOptions {
  seed: string | number;
  strategy?: CombatSimulationStrategy;
  maxRounds?: number;
}

export interface CombatSimulationResult {
  result: DuelResult | null;
  rounds: number;
  winner: DuelResult['winner'];
  escaped: boolean;
  playerFinalHp: number;
  enemyFinalHp: number;
  logCount: number;
}

export interface BattleRewardArbitrageInput {
  turns: number;
  battlesPerTurn: number;
  expectedMaterialValuePerBattle: number;
  benchmarkIncomePerTurn: number;
}

export interface BattleRewardArbitrageResult {
  turns: number;
  battleValue: number;
  benchmarkValue: number;
  maxAllowedValue: number;
  safe: boolean;
}

function withSeededRandom<T>(seed: string | number, fn: () => T): T {
  const originalRandom = Math.random;
  const rng = createSeededRng(seed);
  Math.random = () => rng.next();
  try {
    return fn();
  } finally {
    Math.random = originalRandom;
  }
}

function canPayMoveCost(state: DuelState, move: DuelMove): boolean {
  const moveCost = (move as DuelMove & { baseCost?: number }).baseCost ?? config.resourceCost?.defaultGuSkillEssencePct ?? 8;
  if (state.player.realmNum >= 6) return true;
  return state.player.essence.current >= moveCost;
}

function chooseAction(state: DuelState, strategy: CombatSimulationStrategy): { action: DuelAction; moveIndex?: number } {
  if (strategy === 'escape_first') return { action: 'escape' };
  if (strategy === 'best_available') {
    const moveIndex = state.player.moves.findIndex(move => canPayMoveCost(state, move));
    if (moveIndex >= 0) return { action: 'gu_skill', moveIndex };
  }
  return { action: 'attack' };
}

export function simulateDuelToEnd(initialState: DuelState, options: CombatSimulationOptions): CombatSimulationResult {
  return withSeededRandom(options.seed, () => {
    let state: DuelState = {
      ...initialState,
      phase: initialState.phase === 'init' ? 'player_turn' : initialState.phase,
      log: [...initialState.log],
    };
    const strategy = options.strategy || 'best_available';
    const maxRounds = options.maxRounds ?? 30;

    while (state.phase !== 'ended' && state.round < maxRounds) {
      if (state.phase === 'player_turn') {
        const chosen = chooseAction(state, strategy);
        const afterPlayer = executePlayerTurn(state, chosen.action, chosen.moveIndex);
        state = afterPlayer.state;
        if (afterPlayer.enemyTurn && state.phase === 'enemy_turn') {
          state = executeEnemyTurn(state);
        }
      } else if (state.phase === 'enemy_turn') {
        state = executeEnemyTurn(state);
      } else {
        state = { ...state, phase: 'player_turn' };
      }
    }

    return {
      result: state.result,
      rounds: state.result?.roundsTaken ?? state.round,
      winner: state.result?.winner ?? null,
      escaped: !!state.result?.escaped,
      playerFinalHp: state.result?.playerFinalHp ?? state.player.hp,
      enemyFinalHp: state.result?.enemyFinalHp ?? state.enemy.hp,
      logCount: state.log.length,
    };
  });
}

export function auditBattleRewardArbitrage(input: BattleRewardArbitrageInput): BattleRewardArbitrageResult {
  const maxRatio = Number(config.loot?.maxBattleStoneValueRatio ?? 0.65);
  const battleValue = input.turns * input.battlesPerTurn * input.expectedMaterialValuePerBattle;
  const benchmarkValue = input.turns * input.benchmarkIncomePerTurn;
  const maxAllowedValue = Math.floor(benchmarkValue * maxRatio);
  return {
    turns: input.turns,
    battleValue,
    benchmarkValue,
    maxAllowedValue,
    safe: battleValue <= maxAllowedValue,
  };
}
