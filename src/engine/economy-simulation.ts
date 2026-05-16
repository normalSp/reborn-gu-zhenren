import economyBalanceRaw from '../canon/economy-balance.json';
import achievementsRaw from '../canon/achievements.json';
import type { SquadMember } from '../types';
import { getMaterialEntry, resolveMaterialAlias } from './material-registry';
import { getRecipeRegistryEntries, type RecipeRegistryEntry } from './recipe-registry';
import { getRuntimeAuctionPricingSnapshot } from './auction-engine';
import { generateGuFeedingClosureMatrix } from './material-source-audit';
import { evaluateSquadDispatch, listSquadDispatchTasks } from './squad-dispatch';

export interface EconomySimulationScenario {
  id: string;
  turns: number;
  realmGrand: number;
  primevalCurrencyPerTurn: number;
  immortalCurrencyPerTurn: number;
  guMaterialEveryTurns: number;
  immortalMaterialEveryTurns: number;
}

export interface EconomySimulationResult {
  scenarioId: string;
  turns: number;
  primevalCurrency: number;
  immortalCurrency: number;
  guMaterials: number;
  immortalMaterials: number;
  canBuyLowImmortalMaterial: boolean;
  canReliablyBuyRank6ImmortalGu: boolean;
  canCompleteOneRank6MajorGoal: boolean;
  canRepeatRank6MajorGoal: boolean;
  canHoldMultipleRank6Assets: boolean;
  rank7PlusRemainsStrategic: boolean;
}

export interface RecipeClosureIssue {
  recipeId: string;
  targetGu: string;
  field: 'materials' | 'immortalMaterials' | 'sourceGu' | 'auxiliaryGu';
  key: string;
}

export type AuctionPricingAuditCategory =
  | 'immortalGu'
  | 'immortalMaterial'
  | 'recipe'
  | 'killerMoveFragment'
  | 'killerMoveComplete';

export type AuctionPricingAuditSeverity = 'ok' | 'watch' | 'mismatch';

export interface AuctionPricingAuditRow {
  category: AuctionPricingAuditCategory;
  target: string;
  runtimePrice: number;
  simulatedPrice: number;
  ratio: number;
  severity: AuctionPricingAuditSeverity;
  note: string;
}

export interface AuctionPurchasingPowerRow {
  turns: number;
  immortalCurrency: number;
  lowImmortalMaterialAtMinPrice: number;
  rank6MajorGoalCount: number;
  rank6ImmortalGuBaseCount: number;
  rank6KillerMoveFragmentCount: number;
  rank6KillerMoveCompleteCount: number;
  canReliablyBuyRank6ImmortalGu: boolean;
  canCompleteOneRank6MajorGoal: boolean;
  rank7PlusRemainsStrategic: boolean;
}

export interface ApertureIncomeProfile {
  baseImmortalStonePerTurn: number;
  resourceGrossValuePerTurn: number;
  foodSelfUseRatio: number;
  daoMarkEfficiency: number;
  calamityLossRate: number;
}

export interface FactionIncomeProfile {
  active: boolean;
  grossTradePerTurn: number;
  maintenancePerTurn: number;
  riskLossRate: number;
  trustConflictCostPerTurn: number;
}

export interface FeedingExpenseProfile {
  mortalGuCount: number;
  immortalGuCount: number;
  mortalFoodCostPerGuTurn: number;
  immortalFoodCostPerGuTurn: number;
  selfSupplyCoverage: number;
}

export interface AuctionPriceProfile {
  lowImmortalMaterialPrice: number;
  rank6ImmortalGuPrice: number;
  rank6MajorGoalPrice: number;
  rank7ImmortalGuPrice: number;
  rank6KillerMoveFragmentPrice: number;
  rank6KillerMoveCompletePrice: number;
}

export interface IntegratedEconomySimulationInput {
  id: string;
  turns: number;
  aperture: ApertureIncomeProfile;
  faction: FactionIncomeProfile;
  feeding: FeedingExpenseProfile;
  auction: AuctionPriceProfile;
  eventIncomePerTurn: number;
  eventRiskCostPerTurn: number;
  refinementFailureReservePerTurn: number;
}

export interface IntegratedEconomySimulationRow {
  turns: number;
  apertureGross: number;
  apertureTradable: number;
  factionGross: number;
  factionNet: number;
  eventNet: number;
  feedingExpense: number;
  refinementReserve: number;
  netImmortalCurrency: number;
  lowImmortalMaterialCount: number;
  rank6MajorGoalCount: number;
  rank6ImmortalGuCount: number;
  rank6KillerMoveFragmentCount: number;
  rank6KillerMoveCompleteCount: number;
  canReliablyBuyRank6ImmortalGu: boolean;
  canCompleteOneRank6MajorGoal: boolean;
  rank7PlusRemainsStrategic: boolean;
  feedingClosureBlockingCount: number;
}

export interface ReleaseCombatArbitrageProfile {
  fightsPer20Turns: number;
  yuanStoneRewardPerFight: number;
  materialImmortalValuePerFight: number;
  fatigueLossRatio: number;
}

export interface ReleaseDispatchArbitrageProfile {
  assignmentsPer20Turns: number;
  rewardValueMultiplier: number;
}

export interface ReleaseAchievementBurstProfile {
  burstRatio: number;
  materialYuanStoneValue: number;
}

export interface ReleaseArbitrageScenario {
  id: string;
  turns: number;
  integrated: IntegratedEconomySimulationInput;
  combat: ReleaseCombatArbitrageProfile;
  dispatch: ReleaseDispatchArbitrageProfile;
  achievements: ReleaseAchievementBurstProfile;
}

export interface ReleaseArbitrageReport {
  scenarioId: string;
  turns: number;
  integratedNetImmortalCurrency: number;
  squadCombatImmortalValue: number;
  dispatchImmortalValue: number;
  achievementImmortalValue: number;
  totalImmortalEquivalent: number;
  rank6MajorGoalCount: number;
  canReliablyBuyRank6ImmortalGu: boolean;
  canCompleteOneRank6MajorGoal: boolean;
  rank7PlusRemainsStrategic: boolean;
  releaseGatePassed: boolean;
  notes: string[];
}

const economyBalance = economyBalanceRaw as any;
const achievements = ((achievementsRaw as any).achievements || []) as any[];

export function getEconomyBalanceConfig(): any {
  return economyBalance;
}

export function getDefaultSimulationScenario(id: 'sixTurnSteady' | 'mortalEarly', turns: number): EconomySimulationScenario {
  const scenario = economyBalance.simulationScenarios[id];
  return {
    id,
    turns,
    realmGrand: scenario.realmGrand,
    primevalCurrencyPerTurn: scenario.primevalCurrencyPerTurn,
    immortalCurrencyPerTurn: scenario.immortalCurrencyPerTurn,
    guMaterialEveryTurns: scenario.guMaterialEveryTurns,
    immortalMaterialEveryTurns: scenario.immortalMaterialEveryTurns,
  };
}

export function simulateEconomy(scenario: EconomySimulationScenario): EconomySimulationResult {
  let primevalCurrency = 0;
  let immortalCurrency = 0;
  let guMaterials = 0;
  let immortalMaterials = 0;

  for (let turn = 1; turn <= scenario.turns; turn += 1) {
    primevalCurrency += scenario.primevalCurrencyPerTurn;
    immortalCurrency += scenario.immortalCurrencyPerTurn;
    if (scenario.guMaterialEveryTurns > 0 && turn % scenario.guMaterialEveryTurns === 0) guMaterials += 1;
    if (scenario.immortalMaterialEveryTurns > 0 && turn % scenario.immortalMaterialEveryTurns === 0) immortalMaterials += 1;
  }

  const lowMaterialMin = Number(economyBalance.auctionPricing.lowImmortalMaterialRange.min);
  const rank6MajorGoalPrice = Number(economyBalance.auctionPricing.rank6MajorGoalPrice);
  const rank7Price = Number(economyBalance.auctionPricing.immortalGuBasePriceByTier['7']);

  return {
    scenarioId: scenario.id,
    turns: scenario.turns,
    primevalCurrency,
    immortalCurrency,
    guMaterials,
    immortalMaterials,
    canBuyLowImmortalMaterial: immortalCurrency >= lowMaterialMin,
    canReliablyBuyRank6ImmortalGu: immortalCurrency >= rank6MajorGoalPrice && scenario.turns <= 20,
    canCompleteOneRank6MajorGoal: immortalCurrency >= rank6MajorGoalPrice,
    canRepeatRank6MajorGoal: immortalCurrency >= rank6MajorGoalPrice * 2 && scenario.turns <= 100,
    canHoldMultipleRank6Assets: immortalCurrency >= rank6MajorGoalPrice * 2,
    rank7PlusRemainsStrategic: immortalCurrency < rank7Price,
  };
}

export function runSteadyPacingSimulation(): EconomySimulationResult[] {
  return [20, 100, 300].map(turns => simulateEconomy(getDefaultSimulationScenario('sixTurnSteady', turns)));
}

function auditSeverity(runtimePrice: number, simulatedPrice: number): AuctionPricingAuditSeverity {
  if (simulatedPrice <= 0) return 'watch';
  const ratio = runtimePrice / simulatedPrice;
  if (ratio >= 0.7 && ratio <= 1.3) return 'ok';
  if (ratio >= 0.4 && ratio <= 1.8) return 'watch';
  return 'mismatch';
}

function toAuditRow(
  category: AuctionPricingAuditCategory,
  target: string,
  runtimePrice: number,
  simulatedPrice: number,
  note: string,
): AuctionPricingAuditRow {
  const ratio = simulatedPrice > 0 ? runtimePrice / simulatedPrice : 0;
  return {
    category,
    target,
    runtimePrice,
    simulatedPrice,
    ratio: Number(ratio.toFixed(4)),
    severity: auditSeverity(runtimePrice, simulatedPrice),
    note,
  };
}

export function generateAuctionPricingAudit(): AuctionPricingAuditRow[] {
  const snapshot = getRuntimeAuctionPricingSnapshot();
  const pricing = economyBalance.auctionPricing;
  const rows: AuctionPricingAuditRow[] = [];

  for (const [tier, runtimePrice] of Object.entries(snapshot.immortalGuTierBasePrice)) {
    rows.push(toAuditRow(
      'immortalGu',
      `${tier}转仙蛊基础价`,
      Number(runtimePrice),
      Number(pricing.immortalGuBasePriceByTier[tier]),
      '运行时基础价与 economy-balance 候选节奏对照，未在本轮固化。',
    ));
  }

  const materialMin = Number(pricing.lowImmortalMaterialRange.min);
  const materialMax = Number(pricing.lowImmortalMaterialRange.max);
  for (const [name, runtimePrice] of Object.entries(snapshot.immortalMaterialBasePrice)) {
    const simulatedPrice = Math.round((materialMin + materialMax) / 2);
    const row = toAuditRow(
      'immortalMaterial',
      name,
      Number(runtimePrice),
      simulatedPrice,
      `候选低级仙材区间为 ${materialMin}-${materialMax} 仙元石；单品价允许落在区间内。`,
    );
    rows.push({
      ...row,
      severity: Number(runtimePrice) >= materialMin && Number(runtimePrice) <= materialMax ? 'ok' : row.severity,
    });
  }

  const rank6RecipeRuntime = Math.max(300, 6 * 6 * 300 + 3 * 120);
  rows.push(toAuditRow(
    'recipe',
    '6转仙蛊方/完整大目标候选',
    rank6RecipeRuntime,
    6 * 6 * 300,
    `运行时公式 ${snapshot.recipeBaseFormula} 明显偏向残方早期价，六转完整目标需单独定价。`,
  ));

  rows.push(toAuditRow(
    'killerMoveFragment',
    '6转杀招残方',
    6 * 300,
    6 * 300,
    `运行时公式 ${snapshot.killerMoveFragmentFormula} 与候选价一致。`,
  ));
  rows.push(toAuditRow(
    'killerMoveComplete',
    '6转杀招完整传承',
    6 * 6 * 300,
    6 * 6 * 300,
    `运行时公式 ${snapshot.killerMoveCompleteFormula} 与候选价一致。`,
  ));

  return rows;
}

export function generatePurchasingPowerTable(): AuctionPurchasingPowerRow[] {
  const pricing = economyBalance.auctionPricing;
  const lowMaterialMin = Number(pricing.lowImmortalMaterialRange.min);
  const rank6MajorGoalPrice = Number(pricing.rank6MajorGoalPrice);
  const rank6ImmortalGuPrice = Number(pricing.immortalGuBasePriceByTier['6']);
  const rank6KillerMoveFragmentPrice = 6 * 300;
  const rank6KillerMoveCompletePrice = 6 * 6 * 300;

  return runSteadyPacingSimulation().map(result => ({
    turns: result.turns,
    immortalCurrency: result.immortalCurrency,
    lowImmortalMaterialAtMinPrice: Math.floor(result.immortalCurrency / lowMaterialMin),
    rank6MajorGoalCount: Math.floor(result.immortalCurrency / rank6MajorGoalPrice),
    rank6ImmortalGuBaseCount: Math.floor(result.immortalCurrency / rank6ImmortalGuPrice),
    rank6KillerMoveFragmentCount: Math.floor(result.immortalCurrency / rank6KillerMoveFragmentPrice),
    rank6KillerMoveCompleteCount: Math.floor(result.immortalCurrency / rank6KillerMoveCompletePrice),
    canReliablyBuyRank6ImmortalGu: result.canReliablyBuyRank6ImmortalGu,
    canCompleteOneRank6MajorGoal: result.canCompleteOneRank6MajorGoal,
    rank7PlusRemainsStrategic: result.rank7PlusRemainsStrategic,
  }));
}

export function getDefaultAuctionPriceProfile(): AuctionPriceProfile {
  const pricing = economyBalance.auctionPricing;
  return {
    lowImmortalMaterialPrice: Number(pricing.lowImmortalMaterialRange.min),
    rank6ImmortalGuPrice: Number(pricing.immortalGuBasePriceByTier['6']),
    rank6MajorGoalPrice: Number(pricing.rank6MajorGoalPrice),
    rank7ImmortalGuPrice: Number(pricing.immortalGuBasePriceByTier['7']),
    rank6KillerMoveFragmentPrice: 6 * 300,
    rank6KillerMoveCompletePrice: 6 * 6 * 300,
  };
}

export function getDefaultIntegratedEconomyScenario(turns: number): IntegratedEconomySimulationInput {
  return {
    id: 'sixTurnIntegrated',
    turns,
    aperture: {
      baseImmortalStonePerTurn: 22,
      resourceGrossValuePerTurn: 30,
      foodSelfUseRatio: 0.35,
      daoMarkEfficiency: 1,
      calamityLossRate: 0.08,
    },
    faction: {
      active: true,
      grossTradePerTurn: 18,
      maintenancePerTurn: 10,
      riskLossRate: 0.25,
      trustConflictCostPerTurn: 2,
    },
    feeding: {
      mortalGuCount: 4,
      immortalGuCount: 2,
      mortalFoodCostPerGuTurn: 0.25,
      immortalFoodCostPerGuTurn: 4,
      selfSupplyCoverage: 0.45,
    },
    auction: getDefaultAuctionPriceProfile(),
    eventIncomePerTurn: 4,
    eventRiskCostPerTurn: 2,
    refinementFailureReservePerTurn: 1,
  };
}

export function simulateIntegratedEconomy(input: IntegratedEconomySimulationInput): IntegratedEconomySimulationRow {
  const apertureResourceTradable = input.aperture.resourceGrossValuePerTurn
    * (1 - input.aperture.foodSelfUseRatio)
    * input.aperture.daoMarkEfficiency
    * (1 - input.aperture.calamityLossRate);
  const apertureTradablePerTurn = input.aperture.baseImmortalStonePerTurn + apertureResourceTradable;
  const factionGrossPerTurn = input.faction.active ? input.faction.grossTradePerTurn : 0;
  const factionNetPerTurn = input.faction.active
    ? Math.max(0, factionGrossPerTurn * (1 - input.faction.riskLossRate) - input.faction.maintenancePerTurn - input.faction.trustConflictCostPerTurn)
    : 0;
  const eventNetPerTurn = input.eventIncomePerTurn - input.eventRiskCostPerTurn;
  const feedingExpensePerTurn = (
    input.feeding.mortalGuCount * input.feeding.mortalFoodCostPerGuTurn +
    input.feeding.immortalGuCount * input.feeding.immortalFoodCostPerGuTurn
  ) * (1 - input.feeding.selfSupplyCoverage);
  const netPerTurn = apertureTradablePerTurn + factionNetPerTurn + eventNetPerTurn - feedingExpensePerTurn - input.refinementFailureReservePerTurn;
  const netImmortalCurrency = Math.max(0, Math.floor(netPerTurn * input.turns));
  const feedingClosureBlockingCount = generateGuFeedingClosureMatrix().filter(row => row.rank >= 4 && row.blocking).length;

  return {
    turns: input.turns,
    apertureGross: Math.round((input.aperture.baseImmortalStonePerTurn + input.aperture.resourceGrossValuePerTurn) * input.turns),
    apertureTradable: Math.floor(apertureTradablePerTurn * input.turns),
    factionGross: Math.floor(factionGrossPerTurn * input.turns),
    factionNet: Math.floor(factionNetPerTurn * input.turns),
    eventNet: Math.floor(eventNetPerTurn * input.turns),
    feedingExpense: Math.ceil(feedingExpensePerTurn * input.turns),
    refinementReserve: Math.ceil(input.refinementFailureReservePerTurn * input.turns),
    netImmortalCurrency,
    lowImmortalMaterialCount: Math.floor(netImmortalCurrency / input.auction.lowImmortalMaterialPrice),
    rank6MajorGoalCount: Math.floor(netImmortalCurrency / input.auction.rank6MajorGoalPrice),
    rank6ImmortalGuCount: Math.floor(netImmortalCurrency / input.auction.rank6ImmortalGuPrice),
    rank6KillerMoveFragmentCount: Math.floor(netImmortalCurrency / input.auction.rank6KillerMoveFragmentPrice),
    rank6KillerMoveCompleteCount: Math.floor(netImmortalCurrency / input.auction.rank6KillerMoveCompletePrice),
    canReliablyBuyRank6ImmortalGu: input.turns <= 20 && netImmortalCurrency >= input.auction.rank6ImmortalGuPrice,
    canCompleteOneRank6MajorGoal: netImmortalCurrency >= input.auction.rank6MajorGoalPrice,
    rank7PlusRemainsStrategic: netImmortalCurrency < input.auction.rank7ImmortalGuPrice,
    feedingClosureBlockingCount,
  };
}

export function runIntegratedEconomySimulation(): IntegratedEconomySimulationRow[] {
  return [20, 100, 300].map(turns => simulateIntegratedEconomy(getDefaultIntegratedEconomyScenario(turns)));
}

function getPrimevalToImmortalRate(): number {
  return Number(economyBalance.currencyPolicy?.immortalStoneToPrimevalStone || 10000);
}

function getReleaseAuditMember(): SquadMember {
  return {
    id: 'release_dispatcher',
    name: 'Release Dispatch Auditor',
    path: '智道',
    realm: 6,
    loyalty: 78,
    personality: 'cautious',
    alive: true,
    hp: 620,
    maxHp: 620,
    atk: 62,
    def: 54,
    adventureTrust: 88,
    interestDrive: 76,
  };
}

function estimateAchievementBurstImmortalValue(profile: ReleaseAchievementBurstProfile): number {
  const primevalRate = getPrimevalToImmortalRate();
  const primevalValue = achievements.reduce((sum, achievement) => {
    const reward = achievement.reward || {};
    const currencyValue = Number(reward.currency || 0);
    const materialValue = (Object.values(reward.materials || {}) as number[]).reduce(
      (materialSum, amount) => materialSum + Number(amount || 0) * profile.materialYuanStoneValue,
      0,
    );
    return sum + currencyValue + materialValue;
  }, 0);
  return (primevalValue / primevalRate) * profile.burstRatio;
}

function estimateSquadCombatImmortalValue(turns: number, profile: ReleaseCombatArbitrageProfile): number {
  const primevalRate = getPrimevalToImmortalRate();
  const fightCount = Math.floor((turns / 20) * profile.fightsPer20Turns);
  const effectiveRatio = Math.max(0, 1 - profile.fatigueLossRatio);
  return fightCount * (
    (profile.yuanStoneRewardPerFight / primevalRate) + profile.materialImmortalValuePerFight
  ) * effectiveRatio;
}

function estimateDispatchImmortalValue(turns: number, profile: ReleaseDispatchArbitrageProfile): number {
  const primevalRate = getPrimevalToImmortalRate();
  const tasks = listSquadDispatchTasks().filter(task => task.id !== 'ambush');
  const member = getReleaseAuditMember();
  const assignmentCount = Math.floor((turns / 20) * profile.assignmentsPer20Turns);
  const lowMaterialUtilityValue = Number(economyBalance.auctionPricing.lowImmortalMaterialRange.min) * 0.002;
  let value = 0;

  for (let index = 0; index < assignmentCount; index += 1) {
    const task = tasks[index % tasks.length];
    if (!task) continue;
    const evaluation = evaluateSquadDispatch(member, task.id, { morale: 68, turn: index + 1 });
    const yuanStoneValue = Number(task.successReward.yuanStone || 0) / primevalRate;
    const materialValue = Number(task.successReward.materials || 0) * lowMaterialUtilityValue;
    const reputationUtility = Number(task.successReward.reputation || 0) * 0.01;
    const rumorUtility = Number(task.successReward.rumors || 0) * 0.015;
    value += (yuanStoneValue + materialValue + reputationUtility + rumorUtility)
      * evaluation.successChance
      * profile.rewardValueMultiplier;
  }

  return value;
}

export function getDefaultReleaseArbitrageScenario(turns: number): ReleaseArbitrageScenario {
  return {
    id: 'releaseHighPressure',
    turns,
    integrated: getDefaultIntegratedEconomyScenario(turns),
    combat: {
      fightsPer20Turns: 2,
      yuanStoneRewardPerFight: 120,
      materialImmortalValuePerFight: 0.012,
      fatigueLossRatio: 0.45,
    },
    dispatch: {
      assignmentsPer20Turns: 2,
      rewardValueMultiplier: 0.35,
    },
    achievements: {
      burstRatio: 0.35,
      materialYuanStoneValue: 40,
    },
  };
}

export function simulateReleaseArbitrage(scenario: ReleaseArbitrageScenario): ReleaseArbitrageReport {
  const integrated = simulateIntegratedEconomy(scenario.integrated);
  const combatValue = estimateSquadCombatImmortalValue(scenario.turns, scenario.combat);
  const dispatchValue = estimateDispatchImmortalValue(scenario.turns, scenario.dispatch);
  const achievementValue = estimateAchievementBurstImmortalValue(scenario.achievements);
  const total = integrated.netImmortalCurrency + combatValue + dispatchValue + achievementValue;
  const auction = scenario.integrated.auction;
  const rank6MajorGoalCount = Math.floor(total / auction.rank6MajorGoalPrice);
  const canReliablyBuyRank6ImmortalGu = scenario.turns <= 20 && total >= auction.rank6ImmortalGuPrice;
  const canCompleteOneRank6MajorGoal = total >= auction.rank6MajorGoalPrice;
  const rank7PlusRemainsStrategic = total < auction.rank7ImmortalGuPrice;
  const notes: string[] = [];

  if (canReliablyBuyRank6ImmortalGu) notes.push('20-turn pressure can buy a rank-6 immortal gu.');
  if (!rank7PlusRemainsStrategic) notes.push('Rank-7 target is no longer strategic under combined income.');
  if (rank6MajorGoalCount > 1 && scenario.turns <= 100) notes.push('100-turn pressure completes more than one rank-6 major goal.');
  if (combatValue + dispatchValue > integrated.netImmortalCurrency * 0.08) {
    notes.push('External squad combat/dispatch income exceeds 8% of the five-ledger baseline.');
  }

  return {
    scenarioId: scenario.id,
    turns: scenario.turns,
    integratedNetImmortalCurrency: integrated.netImmortalCurrency,
    squadCombatImmortalValue: Number(combatValue.toFixed(2)),
    dispatchImmortalValue: Number(dispatchValue.toFixed(2)),
    achievementImmortalValue: Number(achievementValue.toFixed(2)),
    totalImmortalEquivalent: Number(total.toFixed(2)),
    rank6MajorGoalCount,
    canReliablyBuyRank6ImmortalGu,
    canCompleteOneRank6MajorGoal,
    rank7PlusRemainsStrategic,
    releaseGatePassed: !canReliablyBuyRank6ImmortalGu
      && rank7PlusRemainsStrategic
      && !(rank6MajorGoalCount > 1 && scenario.turns <= 100),
    notes,
  };
}

export function runReleaseArbitrageAudit(): ReleaseArbitrageReport[] {
  return [20, 100, 300].map(turns => simulateReleaseArbitrage(getDefaultReleaseArbitrageScenario(turns)));
}

function hasMaterial(name: string): boolean {
  return !!getMaterialEntry(name) || !!resolveMaterialAlias(name);
}

function recordMissingMaterialIssues(
  recipe: RecipeRegistryEntry,
  field: 'materials' | 'immortalMaterials',
  issues: RecipeClosureIssue[],
): void {
  for (const key of Object.keys(recipe[field])) {
    if (!hasMaterial(key)) {
      issues.push({ recipeId: recipe.id, targetGu: recipe.targetGu, field, key });
    }
  }
}

function recordMissingGuIssues(
  recipe: RecipeRegistryEntry,
  field: 'sourceGu' | 'auxiliaryGu',
  issues: RecipeClosureIssue[],
): void {
  for (const key of Object.keys(recipe[field])) {
    const exists = getRecipeRegistryEntries().some(entry => entry.targetGu === key) || recipe.targetGu === key;
    if (!exists) issues.push({ recipeId: recipe.id, targetGu: recipe.targetGu, field, key });
  }
}

export function auditRecipeEconomicClosure(): RecipeClosureIssue[] {
  const issues: RecipeClosureIssue[] = [];
  for (const recipe of getRecipeRegistryEntries()) {
    recordMissingMaterialIssues(recipe, 'materials', issues);
    recordMissingMaterialIssues(recipe, 'immortalMaterials', issues);
    recordMissingGuIssues(recipe, 'sourceGu', issues);
    recordMissingGuIssues(recipe, 'auxiliaryGu', issues);
  }
  return issues;
}
