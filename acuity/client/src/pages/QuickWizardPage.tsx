import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Container, Paper, Typography, Button, MenuItem, TextField, InputAdornment, Chip, Stack } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import { fetchQuickRecommendations } from "../lib/api";
import type { QuickInput } from "../lib/api";

const FILING_STATUSES = [
  { value: "single", label: "Single" },
  { value: "married_filing_jointly", label: "Married Filing Jointly" },
  { value: "married_filing_separately", label: "Married Filing Separately" },
  { value: "head_of_household", label: "Head of Household" },
];
const US_STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC"];
const inputSx = { "& .MuiOutlinedInput-root": { bgcolor: "rgba(255,255,255,0.03)", "& fieldset": { borderColor: "#1e2d45" }, "&:hover fieldset": { borderColor: "#00d48a" }, "&.Mui-focused fieldset": { borderColor: "#00d48a" } }, "& .MuiInputBase-input": { color: "#e2e8f0" }, "& .MuiSvgIcon-root": { color: "#8b9bb4" } };

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <Box>
      <Typography sx={{ fontSize: "0.78rem", fontWeight: 600, color: "#8b9bb4", mb: 0.75, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</Typography>
      {children}
      {hint && <Typography sx={{ fontSize: "0.72rem", color: "#4b5563", mt: 0.5 }}>{hint}</Typography>}
    </Box>
  );
}

export default function QuickWizardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<QuickInput>({ filingStatus: "single", age: 35, state: "CA", annualIncome: 0, totalRetirementSavings: 0 });
  const set = (k: keyof QuickInput, v: string | number) => setForm((p) => ({ ...p, [k]: v }));
  const isValid = form.state.length === 2 && form.age >= 16 && form.age <= 110;

  const handleSubmit = async () => {
    setLoading(true); setError(null);
    const res = await fetchQuickRecommendations(form);
    setLoading(false);
    if (!res.success || !res.data) { setError(res.error || "Something went wrong."); return; }
    sessionStorage.setItem("quick-results", JSON.stringify({ input: form, result: res.data }));
    navigate("/quick-results");
  };

  return (
    <Box sx={{ bgcolor: "#0a0e1a", minHeight: "100vh", color: "#e2e8f0", pt: 10, pb: 8 }}>
      <Container maxWidth="sm">
        <Box sx={{ textAlign: "center", mb: 5 }}>
          <Chip label="Quick Snapshot — Free" size="small" sx={{ bgcolor: "rgba(0,212,138,0.1)", color: "#00d48a", border: "1px solid rgba(0,212,138,0.25)", fontWeight: 700, mb: 2 }} />
          <Typography variant="h3" sx={{ fontSize: { xs: "2rem", md: "2.6rem" }, fontWeight: 800, letterSpacing: "-0.03em", mb: 1.5 }}>
            Get your free snapshot
          </Typography>
          <Typography sx={{ color: "#8b9bb4", fontSize: "1rem", lineHeight: 1.7 }}>
            5 quick questions. Your tax bracket, health score, and top 3 priority actions in seconds.
          </Typography>
        </Box>

        <Paper sx={{ p: { xs: 3, sm: 4.5 }, bgcolor: "#111827", border: "1px solid #1e2d45", borderRadius: 4, backgroundImage: "none" }}>
          <Stack spacing={3}>
            <Field label="Filing Status">
              <TextField select fullWidth value={form.filingStatus} onChange={(e) => set("filingStatus", e.target.value)} sx={inputSx}>
                {FILING_STATUSES.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </TextField>
            </Field>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Field label="Your Age">
                <TextField fullWidth type="number" value={form.age || ""} onChange={(e) => set("age", Number(e.target.value))} slotProps={{ htmlInput: { min: 16, max: 110 } }} sx={inputSx} />
              </Field>
              <Field label="State">
                <TextField select fullWidth value={form.state} onChange={(e) => set("state", e.target.value)} sx={inputSx}>
                  {US_STATES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
              </Field>
            </Stack>
            <Field label="Total Annual Household Income" hint="Include W-2, self-employment, investment income, and all other sources">
              <TextField fullWidth type="number" value={form.annualIncome || ""} onChange={(e) => set("annualIncome", Number(e.target.value))} placeholder="0"
                slotProps={{ input: { startAdornment: <InputAdornment position="start" sx={{ "& p": { color: "#8b9bb4" } }}>$</InputAdornment> } }} sx={inputSx} />
            </Field>
            <Field label="Total Retirement Savings" hint="Include 401(k), IRA, Roth IRA, and all other invested retirement accounts">
              <TextField fullWidth type="number" value={form.totalRetirementSavings || ""} onChange={(e) => set("totalRetirementSavings", Number(e.target.value))} placeholder="0"
                slotProps={{ input: { startAdornment: <InputAdornment position="start" sx={{ "& p": { color: "#8b9bb4" } }}>$</InputAdornment> } }} sx={inputSx} />
            </Field>
            {error && <Typography sx={{ color: "#f87171", fontSize: "0.85rem", textAlign: "center" }}>{error}</Typography>}
            <Button fullWidth onClick={handleSubmit} disabled={!isValid || loading}
              endIcon={!loading ? <ArrowForwardIcon /> : undefined} startIcon={loading ? <FlashOnIcon /> : undefined}
              sx={{ background: "linear-gradient(135deg,#00d48a,#00b876)", color: "#0a0e1a", fontWeight: 800, fontSize: "1rem", py: 1.5, borderRadius: 3, textTransform: "none", boxShadow: "0 0 24px rgba(0,212,138,0.3)", "&:hover": { boxShadow: "0 0 40px rgba(0,212,138,0.5)", transform: "translateY(-1px)" }, "&:disabled": { opacity: 0.5 }, transition: "all 0.2s" }}>
              {loading ? "Analyzing…" : "Get My Free Snapshot"}
            </Button>
            <Typography sx={{ textAlign: "center", fontSize: "0.72rem", color: "#4b5563" }}>
              No account required • Results in seconds • Educational estimates only
            </Typography>
          </Stack>
        </Paper>

        <Box sx={{ textAlign: "center", mt: 3 }}>
          <Typography sx={{ fontSize: "0.82rem", color: "#4b5563" }}>
            Want the full AI-powered plan?{" "}
            <Box component="span" onClick={() => navigate("/wizard")} sx={{ color: "#00d48a", cursor: "pointer", fontWeight: 600, "&:hover": { textDecoration: "underline" } }}>
              Build your detailed plan
            </Box>
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
