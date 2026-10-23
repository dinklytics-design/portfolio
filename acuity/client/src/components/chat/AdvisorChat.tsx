import { useState, useRef, useEffect, useCallback } from "react";
import { Drawer, Box, Typography, TextField, IconButton, Stack, CircularProgress, Chip, Divider, Paper } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import CloseIcon from "@mui/icons-material/Close";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import PersonIcon from "@mui/icons-material/Person";
import type { ChatMessage, RecommendationsResult, WizardInput } from "../../types";
import { sendChatMessage } from "../../lib/api";

const SUGGESTED = [
  "What is the single most important action I should take this month?",
  "Am I on track to reach my retirement goal?",
  "Explain my Roth conversion opportunity in plain English",
  "What is my financial independence number?",
  "Do I have enough emergency fund?",
  "How much could I save in taxes this year?",
];

function buildClientContext(input: WizardInput, result: RecommendationsResult): string {
  const taxYear = new Date().getFullYear();
  const fmt = (n: number) => `$${n.toLocaleString()}`;
  const total = input.income.w2Income + input.income.selfEmployment1099Income + input.income.investmentIncome + input.income.otherIncome;
  const recLine = (tag: string, r: { title: string; savingsEstimate?: number | null }) =>
    `[${tag}${r.savingsEstimate ? ` ~$${r.savingsEstimate.toLocaleString()}` : ""}] ${r.title}`;
  const recSummary = [
    ...result.assetLocation.map((r) => recLine("Asset", r)),
    ...result.withdrawalSequencing.map((r) => recLine("Retirement", r)),
    ...(result.retirementStrategy||[]).map((r) => recLine("RetirementStrategy", r)),
    ...result.deductionsCredits.map((r) => recLine("Deductions", r)),
    ...result.entityStructuring.map((r) => recLine("Business", r)),
    ...result.roadmap.map((r) => `[Roadmap-${r.timeframe}] ${r.action.slice(0, 140)}`),
  ].join("\n").slice(0, 6000);
  return [
    `TAX YEAR: ${taxYear}`,
    `FILING: ${input.filingStatus.replace(/_/g, " ")} | STATE: ${input.state} | AGE: ${input.age}`,
    `INCOME: W2 ${fmt(input.income.w2Income)} SE ${fmt(input.income.selfEmployment1099Income)} Total ${fmt(total)}`,
    `BALANCES: Trad ${fmt(input.balances.traditional401kIra)} Roth ${fmt(input.balances.rothIraOr401k)} Taxable ${fmt(input.balances.taxableBrokerage)} Cash ${fmt(input.balances.cashSavings)}`,
    `NET WORTH: ${fmt(result.summary.totalNetWorth)} BRACKET: ${result.summary.marginalFederalBracketPct}% EFFECTIVE: ${result.summary.effectiveFederalRatePct}%`,
    `GOALS: EarlyRetire:${input.goals.earlyRetirement} Age:${input.goals.targetRetirementAge} Home:${input.goals.buyingHome} College:${input.goals.collegeFunding}`,
    `BUSINESS: ${input.deductionsBusiness.isSelfEmployedOrBusinessOwner}`,
    ``,
    `RECOMMENDATIONS:`,
    recSummary,
  ].join("\n");
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  return (
    <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start", flexDirection: isUser ? "row-reverse" : "row" }}>
      <Box sx={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
        bgcolor: isUser ? "rgba(0,212,138,0.2)" : "rgba(59,130,246,0.2)",
        border: "1px solid", borderColor: isUser ? "rgba(0,212,138,0.4)" : "rgba(59,130,246,0.4)",
        display: "flex", alignItems: "center", justifyContent: "center" }}>
        {isUser ? <PersonIcon sx={{ fontSize: 14, color: "#00d48a" }} /> : <SmartToyIcon sx={{ fontSize: 14, color: "#3b82f6" }} />}
      </Box>
      <Box sx={{ maxWidth: "82%",
        bgcolor: isUser ? "rgba(0,212,138,0.08)" : "#1a2235",
        border: "1px solid", borderColor: isUser ? "rgba(0,212,138,0.2)" : "#1e2d45",
        borderRadius: isUser ? "12px 4px 12px 12px" : "4px 12px 12px 12px",
        px: 2, py: 1.5 }}>
        <Typography sx={{ fontSize: "0.85rem", color: "#e2e8f0", lineHeight: 1.65, whiteSpace: "pre-wrap" }}>
          {msg.content}
        </Typography>
      </Box>
    </Box>
  );
}

function TypingIndicator() {
  return (
    <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
      <Box sx={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, bgcolor: "rgba(59,130,246,0.2)",
        border: "1px solid rgba(59,130,246,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <SmartToyIcon sx={{ fontSize: 14, color: "#3b82f6" }} />
      </Box>
      <Box sx={{ bgcolor: "#1a2235", border: "1px solid #1e2d45", borderRadius: "4px 12px 12px 12px", px: 2, py: 1.5 }}>
        <Box sx={{ display: "flex", gap: 0.5, alignItems: "center", height: 20 }}>
          {[0, 1, 2].map((i) => (
            <Box key={i} sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "#3b82f6",
              animation: "bounce 1.2s ease-in-out infinite",
              animationDelay: `${i * 0.2}s`,
              "@keyframes bounce": { "0%,80%,100%": { transform: "scale(0.7)", opacity: 0.5 }, "40%": { transform: "scale(1)", opacity: 1 } } }} />
          ))}
        </Box>
      </Box>
    </Box>
  );
}
interface AdvisorChatProps {
  open: boolean;
  onClose: () => void;
  input: WizardInput;
  result: RecommendationsResult;
  initialQuestion?: string;
}

export default function AdvisorChat({ open, onClose, input, result, initialQuestion }: AdvisorChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const clientContext = useRef(buildClientContext(input, result));

  useEffect(() => {
    if (open && initialQuestion) { setDraft(initialQuestion); setTimeout(() => inputRef.current?.focus(), 150); }
  }, [open, initialQuestion]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ role: "assistant", content: "Hi! I am Margaret Chen, your AI financial advisor. I have reviewed your complete financial profile and recommendations.\n\nAsk me anything. I can explain any recommendation, run scenarios, or help you prioritize next steps." }]);
    }
  }, [open]);

  const sendMessage = useCallback(async (text: string) => {
    const question = text.trim();
    if (!question || loading) return;
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setDraft("");
    setLoading(true);
    const history = messages.slice(1).map((m) => ({ role: m.role, content: m.content }));
    const res = await sendChatMessage(question, clientContext.current, history);
    setLoading(false);
    setMessages((prev) => [...prev, {
      role: "assistant",
      content: res.success && res.data ? res.data.reply : `Sorry: ${res.error || "unknown error"}. Please try again.`,
    }]);
  }, [messages, loading]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(draft); }
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose}
      slotProps={{ paper: { sx: { width: { xs: "100vw", sm: 440 }, bgcolor: "#0d1421", border: "none", borderLeft: "1px solid #1e2d45", display: "flex", flexDirection: "column" } } }}>
      <Box sx={{ px: 2.5, py: 2, borderBottom: "1px solid #1e2d45", flexShrink: 0 }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
            <Box sx={{ width: 36, height: 36, borderRadius: "50%", bgcolor: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <SmartToyIcon sx={{ fontSize: 18, color: "#3b82f6" }} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", color: "#e2e8f0" }}>Ask Margaret</Typography>
              <Typography sx={{ fontSize: "0.7rem", color: "#00d48a" }}>Online  CPA, CFP, PFS</Typography>
            </Box>
          </Stack>
          <IconButton onClick={onClose} size="small" sx={{ color: "#8b9bb4" }}><CloseIcon fontSize="small" /></IconButton>
        </Stack>
      </Box>
      <Box sx={{ flex: 1, overflowY: "auto", px: 2.5, py: 2.5, display: "flex", flexDirection: "column", gap: 2 }}>
        {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </Box>
      {messages.length <= 1 && !loading && (
        <Box sx={{ px: 2.5, pb: 1.5, flexShrink: 0 }}>
          <Typography sx={{ fontSize: "0.7rem", color: "#8b9bb4", mb: 1, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>Suggested</Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.8 }}>
            {SUGGESTED.map((q) => (
              <Chip key={q} label={q} size="small" onClick={() => sendMessage(q)}
                sx={{ bgcolor: "rgba(255,255,255,0.04)", border: "1px solid #1e2d45", color: "#8b9bb4", fontSize: "0.72rem", cursor: "pointer", "&:hover": { bgcolor: "rgba(0,212,138,0.08)", borderColor: "rgba(0,212,138,0.3)", color: "#00d48a" } }} />
            ))}
          </Box>
        </Box>
      )}
      <Divider sx={{ borderColor: "#1e2d45", flexShrink: 0 }} />
      <Box sx={{ px: 2.5, py: 2, flexShrink: 0 }}>
        <Paper sx={{ display: "flex", alignItems: "flex-end", gap: 1, bgcolor: "#111827", border: "1px solid #1e2d45", borderRadius: 3, px: 2, py: 1, "&:focus-within": { borderColor: "#00d48a" } }}>
          <TextField inputRef={inputRef} multiline maxRows={4} fullWidth placeholder="Ask about any recommendation..." value={draft}
            onChange={(e) => setDraft(e.target.value)} onKeyDown={handleKeyDown} disabled={loading} variant="standard"
            sx={{ "& .MuiInput-root": { fontSize: "0.875rem", color: "#e2e8f0" }, "& .MuiInput-root:before, & .MuiInput-root:after": { display: "none" }, "& .MuiInputBase-input::placeholder": { color: "#8b9bb4", opacity: 1 } }} />
          <IconButton onClick={() => sendMessage(draft)} disabled={!draft.trim() || loading} size="small"
            sx={{ bgcolor: draft.trim() && !loading ? "#00d48a" : "transparent", color: draft.trim() && !loading ? "#0a0e1a" : "#8b9bb4", "&:hover": { bgcolor: "#00b876" }, flexShrink: 0, mb: 0.3 }}>
            {loading ? <CircularProgress size={16} color="inherit" /> : <SendIcon fontSize="small" />}
          </IconButton>
        </Paper>
        <Typography sx={{ mt: 0.8, fontSize: "0.65rem", color: "#8b9bb4", textAlign: "center" }}>Enter to send  Shift+Enter for new line</Typography>
      </Box>
    </Drawer>
  );
}
