import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { WizardInput } from "../types";

const STORAGE_KEY = "tax-wizard-form-state-v2";

export const defaultWizardInput: WizardInput = {
  filingStatus: "single", state: "", age: 35, dependents: 0, employmentStatus: "w2_employee",
  income: { w2Income: 0, selfEmployment1099Income: 0, investmentIncome: 0, otherIncome: 0, expectedAnnualGrowthPct: 6 },
  balances: { traditional401kIra: 0, rothIraOr401k: 0, taxableBrokerage: 0, hsaBalance: 0, cashSavings: 0, otherAssets: 0, liabilities: 0 },
  contributions: { traditional401kAnnual: 0, rothAnnual: 0, taxableAnnual: 0, hsaAnnual: 0, employerMatchPct: 0, employerMatchCapPct: 0, has401kAtWork: true },
  goals: { buyingHome: false, earlyRetirement: false, collegeFunding: false, riskTolerance: "moderate", taxPriority: "reduce_now", hasEmergencyFund: true, hasHighInterestDebt: false, estateAndLegacy: false, longTermCareConcern: false },
  deductionsBusiness: { mortgageInterest: 0, stateLocalTaxesPaid: 0, charitableGivingAnnual: 0, usesDonorAdvisedFund: false, hasHsaEligiblePlan: false, isSelfEmployedOrBusinessOwner: false, businessEntityType: "none" },
  importedHoldings: [],
};

function loadInitialState(): WizardInput {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultWizardInput, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return defaultWizardInput;
}

interface WizardContextValue {
  data: WizardInput;
  updateData: (patch: Partial<WizardInput>) => void;
  resetData: () => void;
  activeStep: number;
  setActiveStep: (step: number) => void;
}

const WizardContext = createContext<WizardContextValue | undefined>(undefined);

export function WizardProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<WizardInput>(loadInitialState);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const value = useMemo<WizardContextValue>(
    () => ({
      data,
      updateData: (patch) => setData((prev) => ({ ...prev, ...patch })),
      resetData: () => { setData(defaultWizardInput); window.localStorage.removeItem(STORAGE_KEY); },
      activeStep, setActiveStep,
    }),
    [data, activeStep]
  );

  return <WizardContext.Provider value={value}>{children}</WizardContext.Provider>;
}

export function useWizard(): WizardContextValue {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error("useWizard must be used within a WizardProvider");
  return ctx;
}
