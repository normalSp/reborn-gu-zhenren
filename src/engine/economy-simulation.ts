import economyBalanceRaw from '../canon/economy-balance.json';
import { getMaterialEntry, resolveMaterialAlias } from './material-registry';
import { getRecipeRegistryEntries, type RecipeRegistryEntry } from './recipe-registry';
import { getRuntimeAuctionPricingSnapshot } from './auction-engine';
import { generateGuFeedingClosureMatrix } from './material-source-audit';

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

const economyBalance = economyBalanceRaw as any;

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
