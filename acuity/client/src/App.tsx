import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ThemeProvider, CssBaseline, Box } from "@mui/material";
import { theme } from "./theme";
import { WizardProvider } from "./context/WizardContext";
import AppHeader from "./components/layout/AppHeader";
import WizardPage from "./pages/WizardPage";
import ResultsPage from "./pages/ResultsPage";
import LandingPage from "./pages/LandingPage";
import QuickWizardPage from "./pages/QuickWizardPage";
import QuickResultsPage from "./pages/QuickResultsPage";

const NO_HEADER_PATHS = ["/", "/quick", "/quick-results"];

function AppShell() {
  const location = useLocation();
  const showHeader = !NO_HEADER_PATHS.includes(location.pathname);
  return (
    <>
      {showHeader && <AppHeader />}
      <Box sx={{ minHeight: showHeader ? "calc(100vh - 64px)" : "100vh", bgcolor: "background.default" }}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/quick" element={<QuickWizardPage />} />
          <Route path="/quick-results" element={<QuickResultsPage />} />
          <Route path="/wizard" element={<WizardPage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Box>
    </>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <WizardProvider>
        <BrowserRouter>
          <AppShell />
        </BrowserRouter>
      </WizardProvider>
    </ThemeProvider>
  );
}

export default App;
