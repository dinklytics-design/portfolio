import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Paper,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { useWizard } from "../../context/WizardContext";
import { uploadStatement } from "../../lib/api";
import type { ParsedStatement } from "../../types";

export default function ImportStatementStep({
  onValidityChange,
}: {
  onValidityChange: (v: boolean) => void;
}) {
  const { data, updateData } = useWizard();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedStatement | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  useEffect(() => {
    onValidityChange(true); // This step is always optional / never blocks progress
  }, [onValidityChange]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setError(null);
    setLoading(true);
    const result = await uploadStatement(file);
    setLoading(false);
    if (!result.success || !result.data) {
      setError(result.error || "Failed to parse statement.");
      return;
    }
    setParsed(result.data);
    updateData({ importedHoldings: [...(data.importedHoldings || []), ...result.data.holdings] });
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Import Your 401(k) / Brokerage Statement (Optional)
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Upload a PDF statement and our AI parsing agent will extract your fund holdings and balances to
        personalize the asset-location recommendations. This step is optional \u2014 you can skip it and continue.
      </Typography>

      <Button
        component="label"
        variant="outlined"
        startIcon={<UploadFileIcon />}
        disabled={loading}
      >
        {loading ? "Analyzing statement\u2026" : "Choose PDF statement"}
        <input type="file" accept="application/pdf" hidden onChange={handleFileChange} />
      </Button>

      {loading && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 2 }}>
          <CircularProgress size={20} />
          <Typography variant="body2">Our agent is reading and analyzing your statement\u2026</Typography>
        </Box>
      )}

      {fileName && !loading && !error && (
        <Alert severity="success" sx={{ mt: 2 }}>
          Successfully parsed "{fileName}".
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {parsed && parsed.holdings.length > 0 && (
        <Paper variant="outlined" sx={{ mt: 3, p: 2, overflowX: "auto" }}>
          <Typography variant="subtitle1" gutterBottom>
            Extracted Holdings {parsed.provider ? `(${parsed.provider})` : ""}
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Fund</TableCell>
                <TableCell>Account</TableCell>
                <TableCell>Asset Class</TableCell>
                <TableCell align="right">Balance</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {parsed.holdings.map((h, i) => (
                <TableRow key={i}>
                  <TableCell>{h.name}</TableCell>
                  <TableCell>
                    <Chip size="small" label={h.accountType.replace(/_/g, " ")} />
                  </TableCell>
                  <TableCell>{h.assetClass.replace(/_/g, " ")}</TableCell>
                  <TableCell align="right">${h.balance.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
            Review these figures for accuracy \u2014 AI-parsed data may contain errors. You can re-upload a
            clearer statement if anything looks wrong.
          </Typography>
        </Paper>
      )}
    </Box>
  );
}
