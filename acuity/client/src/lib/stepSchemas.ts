import { z } from "zod";

export const basicsSchema = z.object({
  filingStatus: z.enum(["single","married_filing_jointly","married_filing_separately","head_of_household"]),
  state: z.string().min(2,"Enter a valid state (e.g., CA)").max(2,"Use a 2-letter state code"),
  age: z.coerce.number().min(16).max(110),
  spouseAge: z.coerce.number().min(16).max(110).optional(),
  dependents: z.coerce.number().min(0).max(20),
  youngestDependentAge: z.coerce.number().min(0).max(25).optional(),
  employmentStatus: z.enum(["w2_employee","self_employed","both","retired","not_working"]).optional(),
});

export const incomeSchema = z.object({
  w2Income: z.coerce.number().min(0),
  selfEmployment1099Income: z.coerce.number().min(0),
  investmentIncome: z.coerce.number().min(0),
  otherIncome: z.coerce.number().min(0),
  expectedAnnualGrowthPct: z.coerce.number().min(-100).max(100).optional(),
  qualifiedDividendsLtcg: z.coerce.number().min(0).optional(),
  ordinaryInterestIncome: z.coerce.number().min(0).optional(),
  rentalIncome: z.coerce.number().min(0).optional(),
  receivesSSOrPension: z.boolean().optional(),
  socialSecurityIncome: z.coerce.number().min(0).optional(),
  pensionIncome: z.coerce.number().min(0).optional(),
  receivesRSU: z.boolean().optional(),
  rsuVestingValue: z.coerce.number().min(0).optional(),
});

export const balancesSchema = z.object({
  traditional401kIra: z.coerce.number().min(0),
  rothIraOr401k: z.coerce.number().min(0),
  taxableBrokerage: z.coerce.number().min(0),
  hsaBalance: z.coerce.number().min(0),
  cashSavings: z.coerce.number().min(0),
  otherAssets: z.coerce.number().min(0),
  liabilities: z.coerce.number().min(0),
  educationSavings529: z.coerce.number().min(0).optional(),
  primaryHomeValue: z.coerce.number().min(0).optional(),
  unrealizedGainPct: z.enum(["none","under25","25to50","over50"]).optional(),
  hasPension: z.boolean().optional(),
  estimatedMonthlyPension: z.coerce.number().min(0).optional(),
});

export const contributionsSchema = z.object({
  has401kAtWork: z.boolean().optional(),
  traditional401kAnnual: z.coerce.number().min(0),
  rothAnnual: z.coerce.number().min(0),
  hasRoth401kOption: z.boolean().optional(),
  hasAfterTax401kOption: z.boolean().optional(),
  usingCatchUp: z.boolean().optional(),
  taxableAnnual: z.coerce.number().min(0),
  hsaAnnual: z.coerce.number().min(0),
  employerMatchPct: z.coerce.number().min(0).max(100),
  employerMatchCapPct: z.coerce.number().min(0).max(100),
  sepOrSolo401kAnnual: z.coerce.number().min(0).optional(),
  annualContribution529: z.coerce.number().min(0).optional(),
});

export const goalsSchema = z.object({
  riskTolerance: z.enum(["conservative","moderate","aggressive"]).optional(),
  taxPriority: z.enum(["reduce_now","minimize_retirement","max_wealth","legacy"]).optional(),
  hasEmergencyFund: z.boolean().optional(),
  hasHighInterestDebt: z.boolean().optional(),
  buyingHome: z.boolean(),
  homeTimeframeYears: z.coerce.number().min(0).max(50).optional(),
  earlyRetirement: z.boolean(),
  targetRetirementAge: z.coerce.number().min(30).max(90).optional(),
  collegeFunding: z.boolean(),
  numberOfChildrenForCollege: z.coerce.number().min(0).max(20).optional(),
  estateAndLegacy: z.boolean().optional(),
  longTermCareConcern: z.boolean().optional(),
  desiredMonthlyRetirementIncome: z.coerce.number().min(0).optional(),
});

export const deductionsBusinessSchema = z.object({
  mortgageInterest: z.coerce.number().min(0),
  stateLocalTaxesPaid: z.coerce.number().min(0),
  charitableGivingAnnual: z.coerce.number().min(0),
  usesDonorAdvisedFund: z.boolean(),
  hasHsaEligiblePlan: z.boolean(),
  studentLoanInterest: z.coerce.number().min(0).optional(),
  dependentCareExpenses: z.coerce.number().min(0).optional(),
  educationExpenses: z.coerce.number().min(0).optional(),
  significantMedicalExpenses: z.boolean().optional(),
  isSelfEmployedOrBusinessOwner: z.boolean(),
  businessEntityType: z.enum(["none","sole_proprietor","llc","s_corp","c_corp","partnership"]),
  netBusinessProfit: z.coerce.number().min(0).optional(),
  hasHomeOffice: z.boolean().optional(),
  isSpecifiedServiceTrade: z.boolean().optional(),
  rentalPropertyCount: z.coerce.number().min(0).optional(),
  rentalAnnualDepreciation: z.coerce.number().min(0).optional(),
});
