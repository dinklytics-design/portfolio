import {
  Dialog, DialogContent, Box, Typography, Button, Stack, Divider,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import FlashOnIcon from "@mui/icons-material/FlashOn";

interface PlanGateModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const FREE_FEATURES = [
  "Quick 5-question snapshot",
  "Tax bracket & effective rate",
  "Top 3 priority actions",
  "Financial health score",
];
const FREE_MISSING = [
  "Full personalized recommendations",
  "AI advisor (Margaret Chen, CPA CFP®)",
  "PDF export & action roadmap",
];
const FULL_FEATURES = [
  "Everything in the free snapshot",
  "15+ personalized recommendations",
  "Asset location & tax-loss harvesting",
  "Roth conversion analysis",
  "Business entity advice",
  "Deductions & credits optimization",
  "AI advisor chat — ask Margaret anything",
  "Prioritized action roadmap",
  "PDF export of your full plan",
];

function CheckRow({ text, included }: { text: string; included: boolean }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.75 }}>
      {included
        ? <CheckIcon sx={{ fontSize: 15, color: "#00d48a", flexShrink: 0 }} />
        : <CloseIcon sx={{ fontSize: 15, color: "#4b5563", flexShrink: 0 }} />}
      <Typography sx={{ fontSize: "0.82rem", color: included ? "#e2e8f0" : "#4b5563" }}>{text}</Typography>
    </Box>
  );
}

export default function PlanGateModal({ open, onClose, onConfirm }: PlanGateModalProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      slotProps={{ paper: { sx: { bgcolor: "#0f1728", border: "1px solid #1e2d45", borderRadius: 4, backgroundImage: "none" } } }}>
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 3.5, pb: 2.5, borderBottom: "1px solid #1e2d45", background: "linear-gradient(135deg,rgba(0,212,138,0.06) 0%,transparent 60%)" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
            <LockOpenIcon sx={{ color: "#00d48a", fontSize: 22 }} />
            <Typography sx={{ fontWeight: 800, fontSize: "1.2rem", color: "#e2e8f0" }}>Unlock Your Full Financial Plan</Typography>
          </Box>
          <Typography sx={{ fontSize: "0.85rem", color: "#8b9bb4", lineHeight: 1.6 }}>
            AI-powered recommendations across every area of your tax picture — personalized to your exact numbers.
          </Typography>
        </Box>
        <Box sx={{ p: 3.5, pt: 2.5 }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }}>
            <Box sx={{ flex: 1, p: 2.5, borderRadius: 3, border: "1px solid #1e2d45", bgcolor: "rgba(255,255,255,0.01)" }}>
              <Typography sx={{ fontWeight: 700, fontSize: "0.72rem", color: "#8b9bb4", textTransform: "uppercase", letterSpacing: "0.1em", mb: 0.5 }}>Quick Snapshot</Typography>
              <Typography sx={{ fontWeight: 800, fontSize: "1.4rem", color: "#e2e8f0", mb: 2 }}>Free</Typography>
              {FREE_FEATURES.map((f) => <CheckRow key={f} text={f} included={true} />)}
              <Divider sx={{ my: 1.5, borderColor: "#1e2d45" }} />
              {FREE_MISSING.map((f) => <CheckRow key={f} text={f} included={false} />)}
            </Box>
            <Box sx={{ flex: 1, p: 2.5, borderRadius: 3, border: "1px solid rgba(0,212,138,0.35)", bgcolor: "rgba(0,212,138,0.04)", position: "relative" }}>
              <Box sx={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", bgcolor: "#00d48a", color: "#0a0e1a", fontSize: "0.62rem", fontWeight: 800, px: 1.5, py: 0.4, borderRadius: 99, textTransform: "uppercase", letterSpacing: "0.1em", whiteSpace: "nowrap" }}>
                Beta — Free
              </Box>
              <Typography sx={{ fontWeight: 700, fontSize: "0.72rem", color: "#00d48a", textTransform: "uppercase", letterSpacing: "0.1em", mb: 0.5 }}>Full Plan</Typography>
              <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, mb: 2 }}>
                <Typography sx={{ fontWeight: 800, fontSize: "1.4rem", color: "#00d48a" }}>Free</Typography>
                <Typography sx={{ fontSize: "0.75rem", color: "#8b9bb4", textDecoration: "line-through" }}>$49/mo</Typography>
              </Box>
              {FULL_FEATURES.map((f) => <CheckRow key={f} text={f} included={true} />)}
            </Box>
          </Stack>
          <Button fullWidth onClick={onConfirm} startIcon={<FlashOnIcon />}
            sx={{ background: "linear-gradient(135deg,#00d48a,#00b876)", color: "#0a0e1a", fontWeight: 800, fontSize: "1rem", py: 1.5, borderRadius: 3, textTransform: "none", boxShadow: "0 0 24px rgba(0,212,138,0.35)", "&:hover": { boxShadow: "0 0 40px rgba(0,212,138,0.55)", transform: "translateY(-1px)" }, transition: "all 0.2s", mb: 1.5 }}>
            Get My Full Plan — Free
          </Button>
          <Typography sx={{ textAlign: "center", fontSize: "0.72rem", color: "#4b5563" }}>
            No credit card required &bull; Limited beta access &bull; Free until payments launch
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
