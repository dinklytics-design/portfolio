import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Container, Paper, Button, Typography, Alert, LinearProgress, useMediaQuery, useTheme, Divider, Chip } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ChatIcon from "@mui/icons-material/Chat";
import ProspectChat from "../components/chat/ProspectChat";
import PlanGateModal from "../components/paywall/PlanGateModal";
import { useWizard } from "../context/WizardContext";
import BasicsStep from "../components/steps/BasicsStep";
import IncomeStep from "../components/steps/IncomeStep";
import BalancesStep from "../components/steps/BalancesStep";
import ContributionsStep from "../components/steps/ContributionsStep";
import GoalsStep from "../components/steps/GoalsStep";
import DeductionsBusinessStep from "../components/steps/DeductionsBusinessStep";
// import ImportStatementStep from "../components/steps/ImportStatementStep"; // disabled - coming soon
import ReviewStep from "../components/steps/ReviewStep";

const STEPS = [
  { label: "Basics", description: "Filing status & profile" },
  { label: "Income", description: "All income sources" },
  { label: "Balances", description: "Accounts & net worth" },
  { label: "Contributions", description: "Savings amounts" },
  { label: "Goals", description: "Financial objectives" },
  { label: "Deductions", description: "Credits & business" },
  // { label: "Import", description: "401(k) statement (optional)" }, // disabled - coming soon
  { label: "Review", description: "Confirm & generate" },
];

export default function WizardPage() {
  const theme = useTheme();
  const isMd = useMediaQuery(theme.breakpoints.up("md"));
  const { activeStep, setActiveStep } = useWizard();
  const navigate = useNavigate();
  const [stepValid, setStepValid] = useState(true);
  const [highestStep, setHighestStep] = useState(activeStep);
  const [chatOpen, setChatOpen] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const isLastStep = activeStep === STEPS.length - 1;
  const progress = ((activeStep + 1) / STEPS.length) * 100;
  const stepLabel = STEPS[activeStep].label;

  // Return to top whenever the step changes (mobile + desktop).
  useEffect(() => { window.scrollTo(0, 0); }, [activeStep]);

  const goToStep = (idx: number) => {
    if (idx <= highestStep) setActiveStep(idx);
  };

  const handleNext = () => {
    if (isLastStep) {
      setGateOpen(true);
    } else {
      const next = activeStep + 1;
      setHighestStep((prev) => Math.max(prev, next));
      setActiveStep(next);
    }
  };
  const handleBack = () => setActiveStep(Math.max(0, activeStep - 1));
  const handleGateConfirm = () => { setGateOpen(false); navigate("/results"); };

  const renderStep = () => {
    switch (activeStep) {
      case 0: return <BasicsStep onValidityChange={setStepValid} />;
      case 1: return <IncomeStep onValidityChange={setStepValid} />;
      case 2: return <BalancesStep onValidityChange={setStepValid} />;
      case 3: return <ContributionsStep onValidityChange={setStepValid} />;
      case 4: return <GoalsStep onValidityChange={setStepValid} />;
      case 5: return <DeductionsBusinessStep onValidityChange={setStepValid} />;
      // case 6: return <ImportStatementStep onValidityChange={setStepValid} />; // disabled
      case 6: return <ReviewStep />;
      default: return null;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
      <Box sx={{ mb: { xs: 2, md: 4 } }}>
        <Typography variant="h4" sx={{ fontSize: { xs: "1.5rem", md: "2.125rem" } }} gutterBottom>Build Your Financial Plan</Typography>
        <Typography variant="body2" color="text.secondary">
          Answer a few questions. Your progress is saved automatically.
        </Typography>
        <LinearProgress variant="determinate" value={progress} sx={{ mt: 2, height: 3 }} />
        <Typography variant="caption" sx={{ mt: 0.5, display: "block" }}>
          Step {activeStep + 1} of {STEPS.length} — {stepLabel}
        </Typography>

        {/* Mobile step jumper: tap any visited step to jump straight to it */}
        {!isMd && (
          <Box role="navigation" aria-label="Wizard steps"
            sx={{ display: "flex", gap: 1, overflowX: "auto", mt: 1.5, pb: 0.5, mx: -2, px: 2,
              scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" } }}>
            {STEPS.map((step, idx) => {
              const done = idx < activeStep;
              const active = idx === activeStep;
              const clickable = idx <= highestStep;
              return (
                <Chip key={step.label}
                  clickable={clickable}
                  disabled={!clickable}
                  onClick={() => goToStep(idx)}
                  icon={done ? <CheckCircleIcon sx={{ fontSize: 16, color: "#00d48a" }} /> : undefined}
                  label={`${idx + 1}. ${step.label}`}
                  aria-label={`Go to step ${idx + 1}: ${step.label}`}
                  sx={{
                    flexShrink: 0, height: 44, fontSize: "0.8rem", fontWeight: active ? 700 : 500,
                    border: "1px solid",
                    borderColor: active ? "#00d48a" : done ? "rgba(0,212,138,0.4)" : "#1e2d45",
                    bgcolor: active ? "rgba(0,212,138,0.12)" : "transparent",
                    color: active ? "#e2e8f0" : done ? "#00d48a" : "#8b9bb4",
                    "& .MuiChip-label": { px: 1.5 },
                    "&.Mui-disabled": { opacity: 0.45 },
                  }} />
              );
            })}
          </Box>
        )}
      </Box>

      <Box sx={{ display: "flex", gap: 3, alignItems: "flex-start" }}>
        {isMd && (
          <Paper sx={{ width: 200, flexShrink: 0, p: 1.5, position: "sticky", top: 80 }}>
            {STEPS.map((step, idx) => {
              const done = idx < activeStep;
              const active = idx === activeStep;
              const clickable = idx <= highestStep;
              return (
                <Box key={step.label} onClick={() => clickable && setActiveStep(idx)}
                  sx={{ display: "flex", alignItems: "center", gap: 1.2, p: 1, borderRadius: 2,
                    cursor: clickable ? "pointer" : "default",
                    bgcolor: active ? "rgba(0,212,138,0.08)" : "transparent",
                    border: "1px solid", borderColor: active ? "rgba(0,212,138,0.3)" : "transparent",
                    "&:hover": clickable ? { bgcolor: "rgba(255,255,255,0.04)" } : {} }}>
                  <Box sx={{ width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    bgcolor: done ? "rgba(0,212,138,0.15)" : active ? "rgba(0,212,138,0.2)" : "rgba(255,255,255,0.05)",
                    border: "1px solid", borderColor: done || active ? "#00d48a" : "#1e2d45" }}>
                    {done ? <CheckCircleIcon sx={{ fontSize: 14, color: "#00d48a" }} />
                      : <Typography sx={{ fontSize: 11, fontWeight: 700, color: active ? "#00d48a" : "#8b9bb4" }}>{idx + 1}</Typography>}
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: "0.8rem", fontWeight: active ? 700 : 500,
                      color: active ? "#e2e8f0" : done ? "#00d48a" : "#8b9bb4", lineHeight: 1.2 }}>{step.label}</Typography>
                    <Typography sx={{ fontSize: "0.68rem", color: "#8b9bb4", lineHeight: 1.2 }}>{step.description}</Typography>
                  </Box>
                </Box>
              );
            })}
          </Paper>
        )}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Paper sx={{ p: { xs: 2.5, sm: 4 } }}>
            <Box sx={{ mb: 3, pb: 2, borderBottom: "1px solid", borderColor: "divider" }}>
              <Typography variant="h5">{stepLabel}</Typography>
              <Typography variant="body2" color="text.secondary">{STEPS[activeStep].description}</Typography>
            </Box>
            {renderStep()}

            {/* Per-step Ask Margaret: contextual help lives inside each step (no floating button) */}
            <Button fullWidth={!isMd} variant="outlined" startIcon={<ChatIcon />}
              onClick={() => setChatOpen(true)}
              sx={{ mt: 3, minHeight: 48, borderStyle: "dashed", borderColor: "rgba(0,212,138,0.45)",
                color: "#00d48a", fontWeight: 600, textTransform: "none", fontSize: "0.9rem",
                "&:hover": { borderColor: "#00d48a", bgcolor: "rgba(0,212,138,0.06)", borderStyle: "dashed" } }}>
              Ask Margaret about {stepLabel.toLowerCase()}
            </Button>

            {!stepValid && <Alert severity="warning" sx={{ mt: 3 }}>Please correct the highlighted fields before continuing.</Alert>}
            <Divider sx={{ my: 3 }} />

            {/* CTA bar: sticky on mobile with safe-area padding and 48px touch targets */}
            <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2,
              position: { xs: "sticky", md: "static" }, bottom: 0, zIndex: 10,
              mx: { xs: -2.5, sm: -4, md: 0 }, px: { xs: 2.5, sm: 4, md: 0 },
              pt: { xs: 1.5, md: 0 },
              pb: { xs: "calc(12px + env(safe-area-inset-bottom))", md: 0 },
              bgcolor: { xs: "background.paper", md: "transparent" },
              borderTop: { xs: "1px solid", md: "none" }, borderColor: "divider",
            }}>
              <Button variant="outlined" onClick={handleBack} disabled={activeStep === 0}
                sx={{ minWidth: 100, minHeight: { xs: 48, md: 40 } }}>Back</Button>
              <Button variant="contained" onClick={handleNext} disabled={!stepValid} size="large"
                sx={{ minWidth: isLastStep ? 220 : 120, minHeight: { xs: 48, md: 40 },
                  background: isLastStep ? "linear-gradient(135deg,#00d48a,#00b876)" : undefined, fontWeight: 700 }}>
                {isLastStep ? "✦ Generate My Plan" : "Continue"}
              </Button>
            </Box>
          </Paper>
        </Box>
      </Box>

      <PlanGateModal open={gateOpen} onClose={() => setGateOpen(false)} onConfirm={handleGateConfirm} />

      {/* Chat opens from the per-step button above — no floating FAB on the wizard.
          The homepage keeps its own floating chat button unchanged. */}
      <ProspectChat open={chatOpen} onClose={() => setChatOpen(false)} contextLabel={stepLabel} />
    </Container>
  );
}
