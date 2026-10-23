import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Container, Typography, Button, Stack, Paper, Grid } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import EditIcon from "@mui/icons-material/Edit";
import LockIcon from "@mui/icons-material/Lock";
import type { QuickInput, QuickResult, QuickAction } from "../lib/api";

const priorityCfg: Record<QuickAction["priority"], { color: string; bg: string; label: string }> = {
  high:   { color: "#f87171", bg: "rgba(248,113,113,0.1)", label: "HIGH" },
  medium: { color: "#fbbf24", bg: "rgba(251,191,36,0.1)",  label: "MED" },
  low:    { color: "#60a5fa", bg: "rgba(96,165,250,0.1)",  label: "LOW" },
};

function HealthDial({ score, label }: { score: number; label: string }) {
  const color = score >= 80 ? "#00d48a" : score >= 65 ? "#3b82f6" : score >= 50 ? "#fbbf24" : score >= 35 ? "#f97316" : "#f87171";
  const r = 54; const circ = 2 * Math.PI * r; const pct = (score / 100) * circ;
  return (
    <Box sx={{ textAlign: "center" }}>
      <Box sx={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 140, height: 140 }}>
        <svg width="140" height="140" style={{ transform: "rotate(-90deg)", position: "absolute" }}>
          <circle cx="70" cy="70" r={r} fill="none" stroke="#1e2d45" strokeWidth="10" />
          <circle cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={circ} strokeDashoffset={circ - pct} strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1.2s ease" }} />
        </svg>
        <Box sx={{ textAlign: "center", zIndex: 1 }}>
          <Typography sx={{ fontSize: "2rem", fontWeight: 900, color, lineHeight: 1 }}>{score}</Typography>
          <Typography sx={{ fontSize: "0.62rem", color: "#8b9bb4", fontWeight: 600, textTransform: "uppercase" }}>/100</Typography>
        </Box>
      </Box>
      <Typography sx={{ mt: 1, fontWeight: 700, color, fontSize: "0.9rem" }}>{label}</Typography>
    </Box>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <Box sx={{ p: 2.5, borderRadius: 3, bgcolor: `${color}0d`, border: `1px solid ${color}33`, textAlign: "center", flex: 1 }}>
      <Typography sx={{ fontSize: "1.6rem", fontWeight: 900, color, letterSpacing: "-0.02em", lineHeight: 1 }}>{value}</Typography>
      <Typography sx={{ fontSize: "0.72rem", color: "#8b9bb4", mt: 0.5, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</Typography>
    </Box>
  );
}

function ActionCard({ action, idx: _idx }: { action: QuickAction; idx: number }) {
  const cfg = priorityCfg[action.priority];
  return (
    <Box sx={{ display: "flex", gap: 2, p: 2.5, borderRadius: 3, bgcolor: "rgba(255,255,255,0.02)", border: "1px solid #1e2d45", borderLeft: `3px solid ${cfg.color}` }}>
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, flex: 1 }}>
        <Box sx={{ bgcolor: cfg.bg, color: cfg.color, fontSize: "0.6rem", fontWeight: 800, px: 0.8, py: 0.3, borderRadius: 1, flexShrink: 0, mt: 0.3 }}>{cfg.label}</Box>
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: "0.88rem", color: "#e2e8f0", mb: 0.5 }}>{action.title}</Typography>
          <Typography sx={{ fontSize: "0.8rem", color: "#8b9bb4", lineHeight: 1.6 }}>{action.detail}</Typography>
        </Box>
      </Box>
    </Box>
  );
}

const LOCKED_SECTIONS = [
  { title: "Asset Location Strategy", desc: "Which investments belong in which accounts to minimize lifetime tax drag." },
  { title: "Roth Conversion Analysis", desc: "Identify low-income years to strategically convert and build tax-free wealth." },
  { title: "Deductions & Credits Optimization", desc: "Standard vs. itemized analysis with every legitimate deduction identified." },
  { title: "Business Entity Structuring", desc: "Minimize self-employment tax and maximize qualified business income (Section 199A) deductions." },
];

export default function QuickResultsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<{ input: QuickInput; result: QuickResult } | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("quick-results");
    if (!raw) { navigate("/quick"); return; }
    try { setData(JSON.parse(raw)); } catch { navigate("/quick"); }
  }, [navigate]);

  if (!data) return null;
  const { result, input } = data;
  const yr = new Date().getFullYear();

  return (
    <Box sx={{ bgcolor: "#0a0e1a", minHeight: "100vh", color: "#e2e8f0", pb: 10 }}>
      <Box sx={{ bgcolor: "#111827", borderBottom: "1px solid #1e2d45", py: 3, mb: 4 }}>
        <Container maxWidth="md">
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ justifyContent: "space-between", alignItems: { sm: "center" } }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>Your Free Financial Snapshot</Typography>
              <Typography sx={{ fontSize: "0.82rem", color: "#8b9bb4" }}>{yr} tax data • {input.filingStatus.replace(/_/g, " ")} • {input.state}</Typography>
            </Box>
            <Button variant="outlined" startIcon={<EditIcon />} onClick={() => navigate("/quick")} size="small"
              sx={{ borderColor: "#1e2d45", color: "#8b9bb4", "&:hover": { borderColor: "#00d48a", color: "#00d48a" } }}>Edit Answers</Button>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="md">
        <Paper sx={{ p: { xs: 2.5, sm: 4 }, mb: 3, bgcolor: "#111827", border: "1px solid #1e2d45", borderRadius: 4, backgroundImage: "none" }}>
          <Grid container spacing={3} sx={{ alignItems: "center" }}>
            <Grid size={{ xs: 12, sm: 4 }} sx={{ display: "flex", justifyContent: "center" }}>
              <HealthDial score={result.healthScore} label={result.healthLabel} />
            </Grid>
            <Grid size={{ xs: 12, sm: 8 }}>
              <Typography sx={{ fontWeight: 700, fontSize: "0.72rem", color: "#8b9bb4", textTransform: "uppercase", letterSpacing: "0.1em", mb: 2 }}>Financial Health Score</Typography>
              <Stack direction="row" spacing={1.5} sx={{ flexWrap: "wrap", gap: 1.5 }}>
                <StatCard label="Tax Bracket" value={result.bracket + "%"} color="#fbbf24" />
                <StatCard label="Effective Rate" value={result.effectiveRate + "%"} color="#a78bfa" />
                <StatCard label="Est. Federal Tax" value={"$" + result.estimatedTax.toLocaleString()} color="#f87171" />
              </Stack>
              <Typography sx={{ fontSize: "0.8rem", color: "#8b9bb4", mt: 2, lineHeight: 1.6, p: 1.5, bgcolor: "rgba(0,212,138,0.04)", borderRadius: 2, border: "1px solid rgba(0,212,138,0.15)" }}>
                {result.savingsGapMessage}
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        <Box sx={{ mb: 3 }}>
          <Typography sx={{ fontWeight: 700, fontSize: "0.72rem", color: "#8b9bb4", textTransform: "uppercase", letterSpacing: "0.1em", mb: 2 }}>Your Top 3 Priority Actions</Typography>
          <Stack spacing={1.5}>{result.topActions.map((a, i) => <ActionCard key={i} action={a} idx={i} />)}</Stack>
        </Box>

        <Paper sx={{ p: { xs: 2.5, sm: 4 }, bgcolor: "#111827", border: "1px solid #1e2d45", borderRadius: 4, backgroundImage: "none", position: "relative", overflow: "hidden" }}>
          <Box sx={{ position: "absolute", inset: 0, bgcolor: "rgba(10,14,26,0.7)", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, backdropFilter: "blur(4px)", borderRadius: 4 }}>
            <LockIcon sx={{ fontSize: 36, color: "#00d48a" }} />
            <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", textAlign: "center" }}>Unlock 15+ More Recommendations</Typography>
            <Typography sx={{ fontSize: "0.85rem", color: "#8b9bb4", textAlign: "center", maxWidth: 360 }}>Full AI-powered plan: asset location, Roth strategy, deductions, business structuring, and a roadmap.</Typography>
            <Button onClick={() => navigate("/wizard")} endIcon={<ArrowForwardIcon />}
              sx={{ background: "linear-gradient(135deg,#00d48a,#00b876)", color: "#0a0e1a", fontWeight: 800, px: 3, py: 1.2, borderRadius: 3, textTransform: "none", boxShadow: "0 0 24px rgba(0,212,138,0.35)", "&:hover": { transform: "translateY(-1px)" }, transition: "all 0.2s" }}>
              Get My Full Plan — Free
            </Button>
            <Typography sx={{ fontSize: "0.7rem", color: "#4b5563" }}>No credit card • Beta access • Free until payments launch</Typography>
          </Box>
          <Typography sx={{ fontWeight: 700, fontSize: "0.72rem", color: "#8b9bb4", textTransform: "uppercase", letterSpacing: "0.1em", mb: 2 }}>Full Plan Preview</Typography>
          <Stack spacing={1.5}>
            {LOCKED_SECTIONS.map((s) => (
              <Box key={s.title} sx={{ p: 2, borderRadius: 2, bgcolor: "rgba(255,255,255,0.02)", border: "1px solid #1e2d45", filter: "blur(1.5px)" }}>
                <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", color: "#e2e8f0", mb: 0.4 }}>{s.title}</Typography>
                <Typography sx={{ fontSize: "0.78rem", color: "#8b9bb4" }}>{s.desc}</Typography>
              </Box>
            ))}
          </Stack>
        </Paper>

        <Typography sx={{ mt: 3, fontSize: "0.7rem", color: "#4b5563", textAlign: "center", lineHeight: 1.6 }}>
          Educational estimates only. Not individualized tax, legal, or investment advice. Consult a licensed CPA or CFP® before acting.
        </Typography>
      </Container>
    </Box>
  );
}
