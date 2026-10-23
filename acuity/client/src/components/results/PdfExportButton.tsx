import{useState}from"react";
import{Button,CircularProgress}from"@mui/material";
import DownloadIcon from"@mui/icons-material/Download";
import{pdf}from"@react-pdf/renderer";
import RecommendationsPdfDocument from"../../pdf/RecommendationsPdfDocument";
import type{RecommendationsResult,WizardInput}from"../../types";

export default function PdfExportButton({input,result}:{input:WizardInput;result:RecommendationsResult|null}){
  const[generating,setGenerating]=useState(false);
  if(!result)return null;
  const handleExport=async()=>{
    setGenerating(true);
    try{
      const blob=await pdf(<RecommendationsPdfDocument input={input} result={result}/>).toBlob();
      const url=URL.createObjectURL(blob);
      const link=document.createElement("a");
      link.href=url;
      const date=new Date().toISOString().slice(0,10);
      const state=input.state||"US";
      link.download=`Acuity-Financial-Plan-${state}-${date}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }finally{
      setGenerating(false);
    }
  };
  return(
    <Button variant="contained" color="secondary" startIcon={generating?<CircularProgress size={16} color="inherit"/>:<DownloadIcon/>} onClick={handleExport} disabled={generating}>
      {generating?"Preparing PDF…":"Export Full Plan PDF"}
    </Button>
  );
}
