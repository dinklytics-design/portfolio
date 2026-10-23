import { useEffect, useMemo, useState } from "react";
import { Box, Container, Typography, Paper, LinearProgress, Stack } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import AutorenewIcon from "@mui/icons-material/Autorenew";

// Steps mirror the plan's real generation order (summary first, then the 6 sections).
const STEPS = [
  { key: "summary", label: "Your tax profile", detail: "Income, brackets, and net worth snapshot" },
  { key: "assetLocation", label: "Asset location", detail: "Where each investment should live for tax efficiency" },
  { key: "withdrawalSequencing", label: "Withdrawal sequencing", detail: "Roth conversions, RMDs, and decumulation order" },
  { key: "retirementStrategy", label: "Retirement strategy", detail: "Social Security timing, withdrawal rates, and longevity" },
  { key: "deductionsCredits", label: "Deductions & credits", detail: "Every deduction and contribution opportunity" },
  { key: "entityStructuring", label: "Business tax strategy", detail: "Self-employment and entity optimization" },
  { key: "roadmap", label: "Your action roadmap", detail: "Prioritized steps with timelines" },
] as const;

const ROTATING_MESSAGES = [
  "Margaret is reviewing your full financial picture…",
  "Hunting for Roth conversion opportunities…",
  "Checking every deduction you may qualify for…",
  "Optimizing which accounts should hold which investments…",
  "Sequencing withdrawals to minimize lifetime taxes…",
  "Double-checking figures against current IRS rules…",
  "Building your step-by-step action roadmap…",
];

function formatElapsed(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface PlanLoadingScreenProps {
  completedKeys: string[];
  summaryReady: boolean;
  jobStatus: "starting" | "pending" | "working";
  startedAt: number;
  slowNotice?: boolean;
}

export default function PlanLoadingScreen({
  completedKeys,
  summaryReady,
  jobStatus,
  startedAt,
  slowNotice,
}: PlanLoadingScreenProps) {
  const [now, setNow] = useState(() => Date.now());
  const [messageIdx, setMessageIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setMessageIdx((i) => (i + 1) % ROTATING_MESSAGES.length), 7000);
    return () => clearInterval(t);
  }, []);

  const doneKeys = useMemo(() => {
    const s = new Set(completedKeys);
    if (summaryReady) s.add("summary");
    return s;
  }, [completedKeys, summaryReady]);

  const doneCount = STEPS.filter((s) => doneKeys.has(s.key)).length;
  const total = STEPS.length;
  const elapsed = Math.max(0, now - startedAt);
  const progressPct = Math.round((doneCount / total) * 100);

  // Adaptive remaining-time estimate: pace so far, extrapolated over the
  // remaining steps. Before the first step lands we fall back to the
  // observed 6–10 minute range rather than guessing.
  let estimateLine: string;
  if (doneCount === 0) {
    estimateLine = "Most plans finish in 6–10 minutes";
  } else {
    const perStep = elapsed / doneCount;
    const remainingMs = perStep * (total - doneCount);
    const remainingMin = remainingMs / 60000;
    if (remainingMin < 1) {
      estimateLine = "Almost done…";
    } else if (remainingMin <= 1.5) {
      estimateLine = "About 1 minute left";
    } else {
      estimateLine = `About ${Math.ceil(remainingMin)} minutes left`;
    }
  }

  const statusLine =
    jobStatus === "starting"
      ? "Submitting your request…"
      : jobStatus === "pending"
        ? "In the queue — an advisor will pick this up shortly"
        : "Your AI advisor is generating your plan";

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        background:
          "radial-gradient(1200px 600px at 50% -10%, rgba(0,212,138,0.08), transparent), #0a0e1a",
        py: 6,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          sx={{
            p: { xs: 3, sm: 5 },
            bgcolor: "#111827",
            border: "1px solid #1e2d45",
            borderRadius: 4,
            backgroundImage: "none",
            textAlign: "center",
          }}
        >
          {/* Animated brand ring */}
          <Box sx={{ position: "relative", width: 88, height: 88, mx: "auto", mb: 3 }}>
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                border: "3px solid rgba(0,212,138,0.15)",
              }}
            />
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                border: "3px solid transparent",
                borderTopColor: "#00d48a",
                animation: "plan-spin 1.2s linear infinite",
                "@keyframes plan-spin": { to: { transform: "rotate(360deg)" } },
              }}
            />
            <Box
              sx={{
                position: "absolute",
                inset: 22,
                borderRadius: "50%",
                background: "linear-gradient(135deg,#00d48a,#00b876)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#0a0e1a",
                fontWeight: 900,
                fontSize: "1.4rem",
              }}
            >
              A
            </Box>
          </Box>

          <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
            Building your personalized plan
          </Typography>
          <Typography sx={{ color: "#8b9bb4", fontSize: "0.9rem", mb: 0.5 }}>
            {statusLine}
          </Typography>
          <Typography
            sx={{ color: "#00d48a", fontSize: "0.85rem", fontWeight: 700, mb: 3 }}
            aria-live="polite"
          >
            {estimateLine} · {formatElapsed(elapsed)} elapsed
          </Typography>

          <Box sx={{ mb: 1 }}>
            <LinearProgress
              variant="determinate"
              value={progressPct}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: "#1e2d45",
                "& .MuiLinearProgress-bar": {
                  borderRadius: 4,
                  background: "linear-gradient(90deg,#00d48a,#00b876)",
                },
              }}
            />
          </Box>
          <Typography sx={{ fontSize: "0.75rem", color: "#4b5563", mb: 3 }}>
            {doneCount} of {total} sections complete
          </Typography>

          <Stack spacing={1} sx={{ textAlign: "left", mb: 3 }}>
            {STEPS.map((step, i) => {
              const done = doneKeys.has(step.key);
              const isCurrent =
                !done && STEPS.slice(0, i).every((s) => doneKeys.has(s.key));
              return (
                <Box
                  key={step.key}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    px: 2,
                    py: 1.25,
                    borderRadius: 2,
                    bgcolor: isCurrent ? "rgba(0,212,138,0.07)" : "transparent",
                    border: isCurrent
                      ? "1px solid rgba(0,212,138,0.25)"
                      : "1px solid transparent",
                    opacity: done || isCurrent ? 1 : 0.45,
                    transition: "all 0.3s",
                  }}
                >
                  {done ? (
                    <CheckCircleIcon sx={{ color: "#00d48a", fontSize: 22 }} />
                  ) : isCurrent ? (
                    <AutorenewIcon
                      sx={{
                        color: "#00d48a",
                        fontSize: 22,
                        animation: "plan-spin 1.2s linear infinite",
                      }}
                    />
                  ) : (
                    <RadioButtonUncheckedIcon sx={{ color: "#4b5563", fontSize: 22 }} />
                  )}
                  <Box>
                    <Typography
                      sx={{
                        fontSize: "0.88rem",
                        fontWeight: done || isCurrent ? 700 : 500,
                        color: done ? "#e2e8f0" : isCurrent ? "#ffffff" : "#8b9bb4",
                      }}
                    >
                      {step.label}
                    </Typography>
                    <Typography sx={{ fontSize: "0.75rem", color: "#4b5563" }}>
                      {done ? "Complete" : step.detail}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Stack>

          <Typography
            key={messageIdx}
            sx={{ fontSize: "0.82rem", color: "#8b9bb4", fontStyle: "italic", mb: 2, minHeight: "1.4em" }}
          >
            {ROTATING_MESSAGES[messageIdx]}
          </Typography>
          <Typography sx={{ fontSize: "0.72rem", color: "#4b5563" }}>
            Keep this tab open — your report appears here automatically when it&rsquo;s ready.
          </Typography>
          {slowNotice && (
            <Box
              sx={{
                mt: 2,
                px: 2,
                py: 1.5,
                borderRadius: 2,
                bgcolor: "rgba(251,191,36,0.08)",
                border: "1px solid rgba(251,191,36,0.3)",
              }}
            >
              <Typography sx={{ fontSize: "0.8rem", color: "#fbbf24" }}>
                Taking longer than usual — your plan is still being built. Thanks for your
                patience; nothing is lost and you can safely leave this tab open.
              </Typography>
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
}
