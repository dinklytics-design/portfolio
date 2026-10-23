import { Grid, Box, Typography } from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import PercentIcon from "@mui/icons-material/Percent";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import type { RecommendationsResult } from "../../types";

const cards = (s: RecommendationsResult["summary"]) => [
  {
    label: "Total Net Worth",
    value: `$${s.totalNetWorth.toLocaleString()}`,
    icon: <AccountBalanceWalletIcon />,
    color: "#00d48a",
    bg: "rgba(0,212,138,0.07)",
  },
  {
    label: "Annual Income",
    value: `$${s.totalAnnualIncome.toLocaleString()}`,
    icon: <AttachMoneyIcon />,
    color: "#3b82f6",
    bg: "rgba(59,130,246,0.07)",
  },
  {
    label: "Marginal Bracket",
    value: `${s.marginalFederalBracketPct}%`,
    icon: <TrendingUpIcon />,
    color: "#fbbf24",
    bg: "rgba(251,191,36,0.07)",
  },
  {
    label: "Effective Rate",
    value: `${s.effectiveFederalRatePct}%`,
    icon: <PercentIcon />,
    color: "#a78bfa",
    bg: "rgba(167,139,250,0.07)",
  },
];

export default function SummaryCards({ summary }: { summary: RecommendationsResult["summary"] }) {
  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {cards(summary).map((c) => (
        <Grid key={c.label} size={{ xs: 6, md: 3 }}>
          <Box sx={{
            bgcolor: c.bg, border: "1px solid", borderColor: `${c.color}33`,
            borderRadius: 3, p: 2.5, height: "100%",
            transition: "border-color 0.2s",
            "&:hover": { borderColor: `${c.color}66` },
          }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.75rem", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {c.label}
              </Typography>
              <Box sx={{ color: c.color, opacity: 0.7, "& svg": { fontSize: 18 } }}>{c.icon}</Box>
            </Box>
            <Typography sx={{ fontSize: "1.6rem", fontWeight: 800, color: c.color, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
              {c.value}
            </Typography>
          </Box>
        </Grid>
      ))}
    </Grid>
  );
}

