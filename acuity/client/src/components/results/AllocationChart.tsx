import { Box, Typography, Grid } from "@mui/material";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList,
  Tooltip, Cell, ResponsiveContainer,
} from "recharts";
import type { WizardInput, RecommendationsResult } from "../../types";

const fmt  = (v: number) => `$${v.toLocaleString()}`;
const fmtK = (v: number) => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`;

const ACCOUNT_COLORS: Record<string, string> = {
  "Traditional 401k/IRA": "#00d48a",
  "Roth":                 "#3b82f6",
  "Taxable Brokerage":    "#fbbf24",
  "HSA":                  "#a78bfa",
  "Cash":                 "#f87171",
  "Other Assets":         "#60a5fa",
};

interface Props {
  balances: WizardInput["balances"];
  summary?: RecommendationsResult["summary"];
}

export default function AllocationChart({ balances, summary }: Props) {
  const allocationData = [
    { name: "Traditional 401k/IRA", value: balances.traditional401kIra },
    { name: "Roth",                 value: balances.rothIraOr401k },
    { name: "Taxable Brokerage",    value: balances.taxableBrokerage },
    { name: "HSA",                  value: balances.hsaBalance },
    { name: "Cash",                 value: balances.cashSavings },
    { name: "Other Assets",         value: balances.otherAssets },
  ].filter((d) => d.value > 0);

  const income        = summary?.totalAnnualIncome         ?? 0;
  const marginalPct   = summary?.marginalFederalBracketPct  ?? 0;
  const effectivePct  = summary?.effectiveFederalRatePct   ?? 0;
  const estFedTax     = Math.round(income * (effectivePct / 100));
  const deductions    = Math.max(0, income - (income - estFedTax / (marginalPct / 100 || 1)));
  const taxableIncome = Math.max(0, income - deductions);
  const taxSavings    = Math.max(0, income * (marginalPct / 100) - estFedTax);

  const waterfallData = [
    { name: "Gross Income",   value: income,        fill: "#3b82f6" },
    { name: "Deductions",     value: deductions,    fill: "#00d48a" },
    { name: "Taxable Income", value: taxableIncome, fill: "#fbbf24" },
    { name: "Fed Tax Owed",   value: estFedTax,     fill: "#f87171" },
    { name: "Tax Saved",      value: taxSavings,    fill: "#00d48a" },
  ].filter((d) => d.value > 0);

  if (allocationData.length === 0) {
    return (
      <Box sx={{ bgcolor: "#111827", border: "1px solid #1e2d45", borderRadius: 3, p: 3, mb: 3, textAlign: "center" }}>
        <Typography variant="body2" color="text.secondary">
          Enter account balances in the wizard to see your allocation breakdown.
        </Typography>
      </Box>
    );
  }

  const sharedMargin = { left: 8, right: 56, top: 4, bottom: 4 };
  const sharedXAxis  = { type: "number" as const, tickFormatter: fmtK, tick: { fill: "#8b9bb4", fontSize: 11 }, axisLine: false as false, tickLine: false as false };
  const sharedYAxis  = { type: "category" as const, dataKey: "name", tick: { fill: "#8b9bb4", fontSize: 11 }, axisLine: false as false, tickLine: false as false, width: 110 };
  const sharedTooltipStyle = { backgroundColor: "#1a2235", border: "1px solid #1e2d45", borderRadius: 8 };

  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      <Grid size={{ xs: 12, md: 6 }}>
        <Box sx={{ bgcolor: "#111827", border: "1px solid #1e2d45", borderRadius: 3, p: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Account Allocation</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: "0.75rem" }}>
            Balance by account type
          </Typography>
          <Box sx={{ width: "100%", height: 260, mt: 1 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={allocationData} layout="vertical" margin={sharedMargin}>
                <CartesianGrid horizontal={false} stroke="#1e2d45" />
                <XAxis {...sharedXAxis} />
                <YAxis {...sharedYAxis} />
                <Tooltip contentStyle={sharedTooltipStyle}
                  formatter={(value) => typeof value === "number" ? [fmt(value), "Balance"] : [value, "Balance"]}
                  cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {allocationData.map((entry, i) => (
                    <Cell key={i} fill={ACCOUNT_COLORS[entry.name] ?? "#8b9bb4"} />
                  ))}
                  <LabelList dataKey="value" position="right"
                    formatter={(v: unknown) => typeof v === "number" ? fmtK(v) : ""}
                    style={{ fill: "#8b9bb4", fontSize: 11 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Box>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Box sx={{ bgcolor: "#111827", border: "1px solid #1e2d45", borderRadius: 3, p: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Income Tax Breakdown</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: "0.75rem" }}>
            Where your income goes (estimated 2026 federal)
          </Typography>
          <Box sx={{ width: "100%", height: 260, mt: 1 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={waterfallData} layout="vertical" margin={sharedMargin}>
                <CartesianGrid horizontal={false} stroke="#1e2d45" />
                <XAxis {...sharedXAxis} />
                <YAxis {...sharedYAxis} />
                <Tooltip contentStyle={sharedTooltipStyle}
                  formatter={(value) => typeof value === "number" ? [fmt(value)] : [value]}
                  cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {waterfallData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                  <LabelList dataKey="value" position="right"
                    formatter={(v: unknown) => typeof v === "number" ? fmtK(v) : ""}
                    style={{ fill: "#8b9bb4", fontSize: 11 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Box>
      </Grid>
    </Grid>
  );
}
