import { useState, useRef, useEffect, useCallback } from "react";
import { Drawer, Box, Typography, TextField, IconButton, Stack, CircularProgress, Chip, Divider, Paper } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import CloseIcon from "@mui/icons-material/Close";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import PersonIcon from "@mui/icons-material/Person";
import type { ChatMessage } from "../../types";
import { sendChatMessage } from "../../lib/api";

const SUGGESTED = [
  "What does Acuity do?",
  "How does the AI advisor work?",
  "What tax strategies will I learn about?",
  "Is my financial data safe?",
  "How long does it take to get my plan?",
  "What is a Roth conversion?",
];

// Step-aware suggestions shown when the chat is opened from a wizard step.
const STEP_SUGGESTIONS: Record<string, string[]> = {
  Basics: ["How does filing status affect my taxes?", "Do state taxes matter for my plan?"],
  Income: ["How can I lower the tax on my W-2 income?", "Are bonuses and RSUs taxed differently?"],
  Balances: ["Should I prioritize Roth or traditional accounts?", "What is asset location?"],
  Contributions: ["Am I saving enough for retirement?", "Should I max out my HSA?"],
  Goals: ["How do I plan for early retirement?", "Buy a home or invest the difference?"],
  Deductions: ["Should I itemize or take the standard deduction?", "What is a donor-advised fund?"],
  Review: ["What happens after I generate my plan?", "Is my financial data safe?"],
};

function Bubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  return (
    <Box sx={{ display:"flex",gap:1.5,alignItems:"flex-start",flexDirection:isUser?"row-reverse":"row" }}>
      <Box sx={{ width:28,height:28,borderRadius:"50%",flexShrink:0,bgcolor:isUser?"rgba(0,212,138,0.2)":"rgba(59,130,246,0.2)",border:"1px solid",borderColor:isUser?"rgba(0,212,138,0.4)":"rgba(59,130,246,0.4)",display:"flex",alignItems:"center",justifyContent:"center" }}>
        {isUser ? <PersonIcon sx={{ fontSize:14,color:"#00d48a" }} /> : <SmartToyIcon sx={{ fontSize:14,color:"#3b82f6" }} />}
      </Box>
      <Box sx={{ maxWidth:"82%",bgcolor:isUser?"rgba(0,212,138,0.08)":"#1a2235",border:"1px solid",borderColor:isUser?"rgba(0,212,138,0.2)":"#1e2d45",borderRadius:isUser?"12px 4px 12px 12px":"4px 12px 12px 12px",px:2,py:1.5 }}>
        <Typography sx={{ fontSize:"0.85rem",color:"#e2e8f0",lineHeight:1.65,whiteSpace:"pre-wrap" }}>{msg.content}</Typography>
      </Box>
    </Box>
  );
}

export default function ProspectChat({ open, onClose, contextLabel }: { open: boolean; onClose: () => void; contextLabel?: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  // Which page/step the current conversation belongs to (null = chat never opened yet).
  // The chat refreshes with a fresh greeting whenever it is opened on a different page.
  const contextKey = contextLabel ?? "home";
  const [greetedKey, setGreetedKey] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestions = (contextLabel && STEP_SUGGESTIONS[contextLabel]) || SUGGESTED;

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages, loading]);

  useEffect(() => {
    if (!open) return;
    if (greetedKey !== contextKey) {
      setGreetedKey(contextKey);
      setDraft("");
      setMessages([{ role:"assistant", content: contextLabel
        ? `Hi! I'm Margaret Chen, CPA, CFP.\n\nI see you're working on "${contextLabel}" — ask me anything about this step, or about tax planning in general.`
        : "Hi! I am Margaret Chen, CPA, CFP — Acuity AI financial advisor.\n\nAsk me anything about tax planning, retirement, or what Acuity can do for you." }]);
    }
  }, [open, contextKey, contextLabel, greetedKey]);

  const sendMsg = useCallback(async (text: string) => {
    const q = text.trim();
    if (!q || loading) return;
    setMessages((p) => [...p, { role:"user", content:q }]);
    setDraft("");
    setLoading(true);
    const history = messages.slice(1).map((m) => ({ role:m.role, content:m.content }));
    const clientContext = contextLabel
      ? `The user is currently on the "${contextLabel}" step of the Acuity financial-plan wizard. Keep answers relevant to that step when applicable.`
      : "";
    const res = await sendChatMessage(q, clientContext, history, true);
    setLoading(false);
    setMessages((p) => [...p, { role:"assistant", content: res.success && res.data ? res.data.reply : `Sorry: ${res.error || "unknown error"}. Try again.` }]);
  }, [messages, loading, contextLabel]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMsg(draft); }
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose}
      slotProps={{ paper: { sx:{ width:{xs:"100vw",sm:420},bgcolor:"#0d1421",border:"none",borderLeft:"1px solid #1e2d45",display:"flex",flexDirection:"column" } } }}>
      <Box sx={{ px:2.5,py:2,borderBottom:"1px solid #1e2d45",flexShrink:0 }}>
        <Stack direction="row" sx={{ justifyContent:"space-between",alignItems:"center" }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems:"center" }}>
            <Box sx={{ width:36,height:36,borderRadius:"50%",bgcolor:"rgba(59,130,246,0.15)",border:"1px solid rgba(59,130,246,0.3)",display:"flex",alignItems:"center",justifyContent:"center" }}>
              <SmartToyIcon sx={{ fontSize:18,color:"#3b82f6" }} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight:700,fontSize:"0.9rem",color:"#e2e8f0" }}>Ask Margaret</Typography>
              <Typography sx={{ fontSize:"0.7rem",color:"#00d48a" }}>AI Financial Advisor</Typography>
            </Box>
          </Stack>
          <IconButton onClick={onClose} size="small" sx={{ color:"#8b9bb4" }}><CloseIcon fontSize="small" /></IconButton>
        </Stack>
      </Box>
      <Box sx={{ flex:1,overflowY:"auto",px:2.5,py:2.5,display:"flex",flexDirection:"column",gap:2 }}>
        {messages.map((msg,i) => <Bubble key={i} msg={msg} />)}
        {loading && (
          <Box sx={{ display:"flex",gap:1.5,alignItems:"center" }}>
            <Box sx={{ width:28,height:28,borderRadius:"50%",bgcolor:"rgba(59,130,246,0.2)",border:"1px solid rgba(59,130,246,0.4)",display:"flex",alignItems:"center",justifyContent:"center" }}>
              <SmartToyIcon sx={{ fontSize:14,color:"#3b82f6" }} />
            </Box>
            <CircularProgress size={16} sx={{ color:"#3b82f6" }} />
          </Box>
        )}
        <div ref={bottomRef} />
      </Box>
      {messages.length <= 1 && !loading && (
        <Box sx={{ px:2.5,pb:1.5,flexShrink:0 }}>
          <Typography sx={{ fontSize:"0.7rem",color:"#8b9bb4",mb:1,fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase" }}>Ask me anything</Typography>
          <Box sx={{ display:"flex",flexWrap:"wrap",gap:0.8 }}>
            {suggestions.map((q) => (
              <Chip key={q} label={q} size="small" onClick={() => sendMsg(q)}
                sx={{ bgcolor:"rgba(255,255,255,0.04)",border:"1px solid #1e2d45",color:"#8b9bb4",fontSize:"0.72rem",cursor:"pointer","&:hover":{bgcolor:"rgba(0,212,138,0.08)",borderColor:"rgba(0,212,138,0.3)",color:"#00d48a"} }} />
            ))}
          </Box>
        </Box>
      )}
      <Divider sx={{ borderColor:"#1e2d45",flexShrink:0 }} />
      <Box sx={{ px:2.5,py:2,flexShrink:0 }}>
        <Paper sx={{ display:"flex",alignItems:"flex-end",gap:1,bgcolor:"#111827",border:"1px solid #1e2d45",borderRadius:3,px:2,py:1,"&:focus-within":{borderColor:"#00d48a"} }}>
          <TextField inputRef={inputRef} multiline maxRows={3} fullWidth placeholder="Ask about tax planning or Acuity..." value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={handleKey} disabled={loading} variant="standard"
            sx={{ "& .MuiInput-root":{fontSize:"0.875rem",color:"#e2e8f0"},"& .MuiInput-root:before, & .MuiInput-root:after":{display:"none"},"& .MuiInputBase-input::placeholder":{color:"#8b9bb4",opacity:1} }} />
          <IconButton onClick={() => sendMsg(draft)} disabled={!draft.trim()||loading} size="small"
            sx={{ bgcolor:draft.trim()&&!loading?"#00d48a":"transparent",color:draft.trim()&&!loading?"#0a0e1a":"#8b9bb4","&:hover":{bgcolor:"#00b876"},flexShrink:0,mb:0.3 }}>
            {loading ? <CircularProgress size={16} color="inherit" /> : <SendIcon fontSize="small" />}
          </IconButton>
        </Paper>
        <Typography sx={{ mt:0.8,fontSize:"0.65rem",color:"#8b9bb4",textAlign:"center" }}>Enter to send</Typography>
      </Box>
    </Drawer>
  );
}
