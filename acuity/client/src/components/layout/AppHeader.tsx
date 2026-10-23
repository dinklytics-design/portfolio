import { AppBar, Toolbar, Box, Chip, Typography, Stack, Container } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";

function AcuityLogo() {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, textDecoration: "none" }} component={Link} to="/">
      <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" rx="8" fill="#0a0e1a" />
        <polygon points="16,4 28,16 16,28 4,16" fill="none" stroke="#00d48a" strokeWidth="1.8" />
        <polyline points="10,16 14,12 18,19 22,14" stroke="#00d48a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="22" cy="14" r="1.8" fill="#00d48a" />
      </svg>
      <Typography variant="h6" sx={{ fontWeight: 800, color: "#e2e8f0", letterSpacing: "-0.02em", fontSize: "1.1rem" }}>
        Acuity
      </Typography>
    </Box>
  );
}

export default function AppHeader() {
  const navigate = useNavigate();
  return (
    <AppBar position="sticky" elevation={0}>
      <Toolbar sx={{ p: "0 !important" }}>
        <Container maxWidth="lg">
          <Stack direction="row" sx={{ alignItems: "center", height: 60, gap: 2 }}>
            <AcuityLogo />
            {/* Centered nav links — same layout as landing page */}
            <Stack direction="row" spacing={3} sx={{ flexGrow: 1, justifyContent: "center", display: { xs: "none", md: "flex" } }}>
              <Typography
                onClick={() => navigate("/")}
                sx={{ fontSize: "0.85rem", color: "text.secondary", cursor: "pointer", "&:hover": { color: "text.primary" }, transition: "color 0.15s" }}
              >
                Home
              </Typography>
              <Typography
                onClick={() => navigate("/wizard")}
                sx={{ fontSize: "0.85rem", color: "text.secondary", cursor: "pointer", "&:hover": { color: "text.primary" }, transition: "color 0.15s" }}
              >
                My Plan
              </Typography>
            </Stack>
            <Chip
              label="Educational estimates — not individualized advice"
              size="small"
              sx={{
                display: { xs: "none", sm: "flex" },
                bgcolor: "rgba(255,255,255,0.05)",
                color: "text.secondary",
                border: "1px solid",
                borderColor: "divider",
                fontSize: "0.7rem",
              }}
            />
          </Stack>
        </Container>
      </Toolbar>
    </AppBar>
  );
}

