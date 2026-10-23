import { createTheme, alpha } from "@mui/material/styles";

const GREEN = "#00d48a";
const GREEN_DIM = "#00b876";
const NAVY = "#0a0e1a";
const CARD = "#111827";
const CARD_BORDER = "#1e2d45";
const TEXT_PRIMARY = "#e2e8f0";
const TEXT_SECONDARY = "#8b9bb4";

export const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: GREEN, dark: GREEN_DIM, contrastText: "#0a0e1a" },
    secondary: { main: "#3b82f6", contrastText: "#fff" },
    error: { main: "#f87171" },
    warning: { main: "#fbbf24" },
    success: { main: GREEN },
    background: { default: NAVY, paper: CARD },
    text: { primary: TEXT_PRIMARY, secondary: TEXT_SECONDARY },
    divider: CARD_BORDER,
  },
  typography: {
    fontFamily: `"Inter", "Segoe UI", Roboto, Helvetica, Arial, sans-serif`,
    h3: { fontWeight: 800, letterSpacing: "-0.02em" },
    h4: { fontWeight: 700, letterSpacing: "-0.01em" },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 600, color: TEXT_PRIMARY },
    subtitle2: { fontWeight: 600, fontSize: "0.8rem", letterSpacing: "0.06em", textTransform: "uppercase", color: TEXT_SECONDARY },
    body2: { color: TEXT_SECONDARY },
    caption: { color: TEXT_SECONDARY },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCssBaseline: {
      styleOverrides: { body: { backgroundColor: NAVY, color: TEXT_PRIMARY } },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: alpha(NAVY, 0.92),
          backdropFilter: "blur(12px)",
          borderBottom: `1px solid ${CARD_BORDER}`,
          boxShadow: "none",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: CARD,
          backgroundImage: "none",
          border: `1px solid ${CARD_BORDER}`,
        },
        outlined: {
          border: `1px solid ${CARD_BORDER}`,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: CARD,
          border: `1px solid ${CARD_BORDER}`,
          backgroundImage: "none",
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { textTransform: "none", fontWeight: 600, borderRadius: 8 },
        contained: {
          backgroundColor: GREEN,
          color: "#0a0e1a",
          "&:hover": { backgroundColor: GREEN_DIM },
        },
        outlined: {
          borderColor: CARD_BORDER,
          color: TEXT_PRIMARY,
          "&:hover": { borderColor: GREEN, color: GREEN, backgroundColor: alpha(GREEN, 0.06) },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            backgroundColor: alpha("#fff", 0.03),
            "& fieldset": { borderColor: CARD_BORDER },
            "&:hover fieldset": { borderColor: "#3d4f6e" },
            "&.Mui-focused fieldset": { borderColor: GREEN },
          },
          "& .MuiInputLabel-root": { color: TEXT_SECONDARY },
          "& .MuiInputLabel-root.Mui-focused": { color: GREEN },
          "& .MuiInputBase-input": { color: TEXT_PRIMARY },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        icon: { color: TEXT_SECONDARY },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          "&:hover": { backgroundColor: alpha(GREEN, 0.08) },
          "&.Mui-selected": { backgroundColor: alpha(GREEN, 0.12), "&:hover": { backgroundColor: alpha(GREEN, 0.16) } },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, fontSize: "0.72rem" },
        colorSuccess: { backgroundColor: alpha(GREEN, 0.15), color: GREEN, border: `1px solid ${alpha(GREEN, 0.3)}` },
        colorError: { backgroundColor: alpha("#f87171", 0.15), color: "#f87171" },
        colorWarning: { backgroundColor: alpha("#fbbf24", 0.15), color: "#fbbf24" },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          "&.MuiAlert-standardSuccess": { backgroundColor: alpha(GREEN, 0.1), border: `1px solid ${alpha(GREEN, 0.25)}` },
          "&.MuiAlert-standardWarning": { backgroundColor: alpha("#fbbf24", 0.08), border: `1px solid ${alpha("#fbbf24", 0.25)}` },
          "&.MuiAlert-standardError": { backgroundColor: alpha("#f87171", 0.1), border: `1px solid ${alpha("#f87171", 0.25)}` },
          "&.MuiAlert-standardInfo": { backgroundColor: alpha("#3b82f6", 0.08), border: `1px solid ${alpha("#3b82f6", 0.25)}` },
        },
      },
    },
    MuiStepIcon: {
      styleOverrides: {
        root: {
          color: CARD_BORDER,
          "&.Mui-active": { color: GREEN },
          "&.Mui-completed": { color: GREEN },
        },
      },
    },
    MuiStepLabel: {
      styleOverrides: {
        label: {
          color: TEXT_SECONDARY,
          "&.Mui-active": { color: TEXT_PRIMARY, fontWeight: 600 },
          "&.Mui-completed": { color: GREEN },
        },
      },
    },
    MuiDivider: {
      styleOverrides: { root: { borderColor: CARD_BORDER } },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { backgroundColor: alpha(GREEN, 0.15), borderRadius: 4 },
        bar: { backgroundColor: GREEN, borderRadius: 4 },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          color: TEXT_SECONDARY,
          "&.Mui-selected": { color: GREEN },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: { backgroundColor: GREEN },
      },
    },
    MuiListItemIcon: {
      styleOverrides: { root: { color: TEXT_SECONDARY } },
    },
    MuiFormControlLabel: {
      styleOverrides: { label: { color: TEXT_PRIMARY } },
    },
    MuiSwitch: {
      styleOverrides: {
        switchBase: { "&.Mui-checked": { color: GREEN }, "&.Mui-checked + .MuiSwitch-track": { backgroundColor: GREEN } },
      },
    },
  },
});

