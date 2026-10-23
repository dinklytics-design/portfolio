// Shared domain types for the wizard frontend (mirrors server/src/types.ts).

export type FilingStatus = "single" | "married_filing_jointly" | "married_filing_separately" | "head_of_household";
export type EmploymentStatus = "w2_employee" | "self_employed" | "both" | "retired" | "not_working";

export interface IncomeInput {
  w2Income: number; selfEmployment1099Income: number; investmentIncome: number; otherIncome: number;
  expectedAnnualGrowthPct?: number; qualifiedDividendsLtcg?: number; ordinaryInterestIncome?: number;
  rentalIncome?: number; socialSecurityIncome?: number; pensionIncome?: number; rsuVestingValue?: number;
}
export interface RetirementBalancesInput {
  traditional401kIra: number; rothIraOr401k: number; taxableBrokerage: number;
  hsaBalance: number; cashSavings: number; otherAssets: number; liabilities: number;
  educationSavings529?: number; primaryHomeValue?: number;
  unrealizedGainPct?: "none" | "under25" | "25to50" | "over50";
  hasPension?: boolean; estimatedMonthlyPension?: number;
}
export interface ContributionsInput {
  traditional401kAnnual: number; rothAnnual: number; taxableAnnual: number; hsaAnnual: number;
  employerMatchPct: number; employerMatchCapPct: number;
  has401kAtWork?: boolean; hasRoth401kOption?: boolean; hasAfterTax401kOption?: boolean;
  usingCatchUp?: boolean; sepOrSolo401kAnnual?: number; annualContribution529?: number;
}
export interface GoalsInput {
  buyingHome: boolean; homeTimeframeYears?: number;
  earlyRetirement: boolean; targetRetirementAge?: number;
  collegeFunding: boolean; numberOfChildrenForCollege?: number;
  riskTolerance?: "conservative" | "moderate" | "aggressive";
  taxPriority?: "reduce_now" | "minimize_retirement" | "max_wealth" | "legacy";
  hasEmergencyFund?: boolean; hasHighInterestDebt?: boolean; estateAndLegacy?: boolean; longTermCareConcern?: boolean; desiredMonthlyRetirementIncome?: number;
}
export type BusinessEntityType = "none" | "sole_proprietor" | "llc" | "s_corp" | "c_corp" | "partnership";
export interface DeductionsBusinessInput {
  mortgageInterest: number; stateLocalTaxesPaid: number; charitableGivingAnnual: number;
  usesDonorAdvisedFund: boolean; hasHsaEligiblePlan: boolean; isSelfEmployedOrBusinessOwner: boolean;
  businessEntityType?: BusinessEntityType; netBusinessProfit?: number;
  studentLoanInterest?: number; dependentCareExpenses?: number; educationExpenses?: number;
  significantMedicalExpenses?: boolean; hasHomeOffice?: boolean;
  isSpecifiedServiceTrade?: boolean; rentalPropertyCount?: number; rentalAnnualDepreciation?: number;
}
export type AssetClass = "us_equity" | "intl_equity" | "bond" | "reit" | "cash" | "target_date" | "commodity" | "other";
export type AccountType = "traditional_401k" | "roth_401k" | "traditional_ira" | "roth_ira" | "taxable_brokerage" | "hsa" | "other";
export interface PortfolioHolding { name: string; ticker?: string; accountType: AccountType; assetClass: AssetClass; balance: number; allocationPct?: number; expenseRatioPct?: number; }
export interface ParsedStatement { provider?: string; accountType: AccountType; asOfDate?: string; totalBalance: number; holdings: PortfolioHolding[]; contributionRatePct?: number; employerMatchNote?: string; rawNotes?: string; }
export interface WizardInput {
  filingStatus: FilingStatus; state: string; age: number; spouseAge?: number;
  dependents: number; youngestDependentAge?: number; employmentStatus?: EmploymentStatus;
  income: IncomeInput; balances: RetirementBalancesInput; contributions: ContributionsInput;
  goals: GoalsInput; deductionsBusiness: DeductionsBusinessInput; importedHoldings?: PortfolioHolding[];
}
export interface ChatMessage { role: "user" | "assistant"; content: string; }
export interface ChatResult { reply: string; }
export interface RecommendationItem { title: string; detail: string; priority: "high" | "medium" | "low"; context?: string; steps?: string[]; education?: string; warning?: string; savingsEstimate?: number; }
export interface RoadmapItem { timeframe: "this_year" | "future_years"; action: string; }
export interface RecommendationsResult {
  source: "ai" | "rules";
  summary: { totalNetWorth: number; marginalFederalBracketPct: number; effectiveFederalRatePct: number; totalAnnualIncome: number; };
  assetLocation: RecommendationItem[]; withdrawalSequencing: RecommendationItem[];
  deductionsCredits: RecommendationItem[]; entityStructuring: RecommendationItem[];
  retirementStrategy?: RecommendationItem[];
  roadmap: RoadmapItem[]; disclaimer: string;
}
