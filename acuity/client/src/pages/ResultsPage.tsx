import{useEffect,useRef,useState}from"react";
import{useNavigate}from"react-router-dom";
import{Container,Typography,Box,Button,Alert,Stack,Chip,Paper,Fab,Tooltip,Divider,Grid}from"@mui/material";
import SmartToyIcon from"@mui/icons-material/SmartToy";
import BuildIcon from"@mui/icons-material/Build";
import EditIcon from"@mui/icons-material/Edit";
import SavingsIcon from"@mui/icons-material/Savings";
import ChatIcon from"@mui/icons-material/Chat";
import{useWizard}from"../context/WizardContext";
import{fetchRecommendations}from"../lib/api";
import type{RecommendationsResult}from"../types";
import SummaryCards from"../components/results/SummaryCards";
import AllocationChart from"../components/results/AllocationChart";
import RecommendationSection from"../components/results/RecommendationSection";
import RoadmapChecklist from"../components/results/RoadmapChecklist";
import PlanLoadingScreen from"../components/results/PlanLoadingScreen";
import PdfExportButton from"../components/results/PdfExportButton";
import AdvisorChat from"../components/chat/AdvisorChat";
import RetirementProjectionChart from"../components/results/RetirementProjectionChart";

const TAX_YEAR=new Date().getFullYear();
const SECTIONS=[
  {key:"assetLocation" as const,num:"1",label:"Asset Location & Tax-Loss Harvesting",desc:"Optimize where you hold each investment and harvest losses to reduce your annual tax bill."},
  {key:"withdrawalSequencing" as const,num:"2",label:"Retirement & Withdrawal Sequencing",desc:"Maximize what you keep in retirement through optimal withdrawal order, Roth conversions, and Required Minimum Distribution planning."},
  {key:"retirementStrategy" as const,num:"3",label:"Retirement Strategy",desc:"Social Security timing, sustainable withdrawal rates, the healthcare bridge to Medicare, RMD defusal, and longevity planning."},
  {key:"deductionsCredits" as const,num:"4",label:"Deductions, Credits & Contribution Strategies",desc:"Maximize every legal deduction and ensure no contribution room goes unused."},
  {key:"entityStructuring" as const,num:"5",label:"Business & Self-Employment Tax Strategy",desc:"Reduce self-employment tax, maximize retirement contributions, and optimize your business structure."},
];

function SourceBanner({source}:{source:RecommendationsResult["source"]}){
  if(source==="ai") return(<Alert severity="success" icon={<SmartToyIcon fontSize="inherit"/>} sx={{mb:3}}><Box sx={{display:"flex",alignItems:"center",gap:1,flexWrap:"wrap"}}><Typography variant="body2" sx={{fontWeight:700}}>AI-Generated</Typography><Typography variant="body2" color="text.secondary">Personalized by Margaret Chen, CPA, CFP&reg;, PFS</Typography></Box></Alert>);
  return(<Alert severity="info" icon={<BuildIcon fontSize="inherit"/>} sx={{mb:3}}><Typography variant="body2" sx={{fontWeight:700}}>Instant Plan</Typography><Typography variant="body2">Built in seconds from your numbers and current federal tax data.</Typography></Alert>);
}

function TaxProfile({result,data}:{result:RecommendationsResult;data:any}){
  const s=result.summary;
  const income=data.income||{};
  const totalIncome=s.totalAnnualIncome;
  const isMFJ=data.filingStatus==="married_filing_jointly";
  const stdDed=isMFJ?30700:15350;
  const taxableInc=Math.max(0,totalIncome-stdDed);
  const Row=({label,value,color,bold}:{label:string;value:string;color?:string;bold?:boolean})=>(
    <Box sx={{display:"flex",justifyContent:"space-between",alignItems:"center",py:0.75,borderBottom:"1px solid rgba(30,45,69,0.6)"}}>
      <Typography sx={{fontSize:"0.83rem",color:"#8b9bb4"}}>{label}</Typography>
      <Typography sx={{fontSize:"0.83rem",fontWeight:bold?700:500,color:color||"#e2e8f0"}}>{value}</Typography>
    </Box>
  );
  return(
    <Paper sx={{p:3,mb:3,bgcolor:"#111827",border:"1px solid #1e2d45",borderRadius:3,backgroundImage:"none"}}>
      <Typography variant="h6" sx={{mb:0.5,fontWeight:700}}>Your {TAX_YEAR} Tax Profile</Typography>
      <Typography sx={{fontSize:"0.78rem",color:"#8b9bb4",mb:2}}>Federal estimates based on your income and deduction inputs. Does not include state taxes, Alternative Minimum Tax, or Net Investment Income Tax.</Typography>
      <Grid container spacing={3}>
        <Grid size={{xs:12,sm:6}}>
          <Row label="Total Gross Income" value={"$"+totalIncome.toLocaleString()} bold/>
          <Row label="W-2 / Salary Income" value={"$"+(income.w2Income||0).toLocaleString()}/>
          {(income.selfEmployment1099Income||0)>0&&<Row label="Self-Employment Income" value={"$"+income.selfEmployment1099Income.toLocaleString()}/>}
          {(income.rentalIncome||0)>0&&<Row label="Rental Income" value={"$"+income.rentalIncome.toLocaleString()}/>}
          <Row label={"Standard Deduction ("+(isMFJ?"Married Filing Jointly":"Single/Head of Household")+")" } value={"- $"+stdDed.toLocaleString()}/>
          <Row label="Estimated Taxable Income" value={"$"+taxableInc.toLocaleString()} bold/>
        </Grid>
        <Grid size={{xs:12,sm:6}}>
          <Row label="Marginal Federal Bracket" value={s.marginalFederalBracketPct+"%"} color="#fbbf24" bold/>
          <Row label="Effective Federal Rate" value={s.effectiveFederalRatePct.toFixed(1)+"%"} color="#a78bfa"/>
          <Row label="Tax as % of Gross Income" value={s.effectiveFederalRatePct.toFixed(1)+"%"}/>
          <Row label="Tax as % of Taxable Income" value={taxableInc>0?(Math.round(s.effectiveFederalRatePct*totalIncome/taxableInc*10)/10)+"%":"N/A"}/>
          <Row label="Total Net Worth" value={"$"+s.totalNetWorth.toLocaleString()} color="#00d48a" bold/>
        </Grid>
      </Grid>
    </Paper>
  );
}

function SavingsSummary({result}:{result:RecommendationsResult}){
  const allItems=[...result.assetLocation,...result.withdrawalSequencing,...(result.retirementStrategy||[]),...result.deductionsCredits,...result.entityStructuring];
  const withSavings=allItems.filter(i=>i.savingsEstimate&&i.savingsEstimate>0).sort((a,b)=>(b.savingsEstimate||0)-(a.savingsEstimate||0));
  const total=withSavings.reduce((s,i)=>s+(i.savingsEstimate||0),0);
  if(total===0) return null;
  const fmtDollar=(n:number)=>"$"+n.toLocaleString();
  return(
    <Paper sx={{p:3,mb:3,bgcolor:"#111827",border:"1px solid rgba(0,212,138,0.3)",borderRadius:3,backgroundImage:"none"}}>
      <Box sx={{display:"flex",alignItems:"center",gap:1.5,mb:0.5}}>
        <SavingsIcon sx={{color:"#00d48a",fontSize:22}}/>
        <Typography variant="h6" sx={{fontWeight:700,color:"#00d48a"}}>Potential Annual Tax Savings Identified</Typography>
      </Box>
      <Typography sx={{fontSize:"0.78rem",color:"#8b9bb4",mb:2}}>Estimated savings if all recommendations are fully implemented. Individual results vary based on specific circumstances.</Typography>
      <Box sx={{display:"flex",flexDirection:"column",gap:0}}>
        {withSavings.map((item,i)=>(
          <Box key={i} sx={{display:"flex",justifyContent:"space-between",alignItems:"center",py:0.75,borderBottom:"1px solid #1e2d45"}}>
            <Typography sx={{fontSize:"0.82rem",color:"#c9d6e3",flex:1,mr:2}}>{item.title}</Typography>
            <Typography sx={{fontSize:"0.85rem",fontWeight:700,color:"#00d48a",flexShrink:0}}>~{fmtDollar(item.savingsEstimate||0)}/yr</Typography>
          </Box>
        ))}
      </Box>
      <Box sx={{display:"flex",justifyContent:"space-between",alignItems:"center",pt:1.5,mt:0.5,borderTop:"2px solid rgba(0,212,138,0.3)"}}>
        <Typography sx={{fontWeight:700,fontSize:"1rem"}}>Total Estimated Annual Savings</Typography>
        <Typography sx={{fontWeight:900,fontSize:"1.3rem",color:"#00d48a"}}>~{fmtDollar(total)}/yr</Typography>
      </Box>
    </Paper>
  );
}

export default function ResultsPage(){
  const{data}=useWizard();
  const navigate=useNavigate();
  const[result,setResult]=useState<RecommendationsResult|null>(null);
  const[loading,setLoading]=useState(true);
  const[error,setError]=useState<string|null>(null);
  const[chatOpen,setChatOpen]=useState(false);
  const[chatQuestion,setChatQuestion]=useState<string|undefined>();
  const[completedKeys,setCompletedKeys]=useState<string[]>([]);
  const[summaryReady,setSummaryReady]=useState(false);
  const[jobStatus,setJobStatus]=useState<"starting"|"pending"|"working">("starting");
  const[startedAt]=useState(()=>Date.now());
  const[slowNotice,setSlowNotice]=useState(false);
  const jobIdRef=useRef<string|null>(null);
  const mountedRef=useRef(true);
  const openChat=(q?:string)=>{setChatQuestion(q);setChatOpen(true);};

  const runPoll=(resumeJobId?:string)=>{
    const SECTIONS=["assetLocation","withdrawalSequencing","retirementStrategy","deductionsCredits","entityStructuring","roadmap"];
    // Build a partial result that fills in as sections stream in
    const partial:any={source:"ai",summary:{totalNetWorth:0,marginalFederalBracketPct:0,effectiveFederalRatePct:0,totalAnnualIncome:0},assetLocation:[],withdrawalSequencing:[],retirementStrategy:[],deductionsCredits:[],entityStructuring:[],roadmap:[],disclaimer:""};
    setLoading(true);
    setError(null);
    fetchRecommendations(
      data,
      (key,sectionData,source)=>{
        if(!mountedRef.current)return;
        partial[key]=sectionData;
        partial.source=source==="ai"?"ai":"rules";
        setCompletedKeys((prev)=>prev.includes(key)?prev:[...prev,key]);
        // Show partial results as each section arrives
        const allLoaded=SECTIONS.every(s=>partial[s]&&(Array.isArray(partial[s])&&partial[s].length>0));
        if(allLoaded){setLoading(false);}
        setResult({...partial});
      },
      (summary,disclaimer)=>{
        if(!mountedRef.current)return;
        partial.summary=summary;
        partial.disclaimer=disclaimer;
        setSummaryReady(true);
      },
      (aiSections)=>{
        if(!mountedRef.current)return;
        setLoading(false);
        setResult({...partial,source:aiSections>0?"ai":"rules"});
      },
      (err)=>{
        if(!mountedRef.current)return;
        setLoading(false);
        setError(err||"Failed to generate recommendations.");
      },
      {
        onStatus:(status)=>{
          if(!mountedRef.current)return;
          setJobStatus(status);
        },
        onJobId:(id)=>{jobIdRef.current=id;},
        onSlow:()=>{
          if(!mountedRef.current)return;
          setSlowNotice(true);
        },
        resumeJobId,
      }
    );
  };

  useEffect(()=>{
    mountedRef.current=true;
    runPoll();
    return()=>{mountedRef.current=false;};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  if(loading) return(
    <PlanLoadingScreen
      completedKeys={completedKeys}
      summaryReady={summaryReady}
      jobStatus={jobStatus}
      startedAt={startedAt}
      slowNotice={slowNotice}
    />
  );
  if(error||!result) return(
    <Container maxWidth="sm" sx={{py:12}}>
      <Alert severity="warning" sx={{mb:2}}>{error||"No results available."}</Alert>
      <Stack direction="row" spacing={1}>
        {jobIdRef.current&&(
          <Button variant="contained" sx={{bgcolor:"#00d48a",color:"#0a0e1a","&:hover":{bgcolor:"#00b876"}}}
            onClick={()=>{const id=jobIdRef.current;if(id)runPoll(id);}}>
            Keep waiting
          </Button>
        )}
        <Button variant="outlined" onClick={()=>navigate("/wizard")}>Start over</Button>
      </Stack>
    </Container>
  );

  const totalRecs=SECTIONS.reduce((s,sec)=>s+(result[sec.key]?.length||0),0);

  return(
    <Container maxWidth="lg" sx={{py:4}}>
      <Stack direction={{xs:"column",sm:"row"}} spacing={2} sx={{mb:3,justifyContent:"space-between",alignItems:{sm:"flex-start"}}}>
        <Box>
          <Box sx={{display:"flex",alignItems:"center",gap:1.5,mb:0.5,flexWrap:"wrap"}}>
            <Typography variant="h4">Your Personalized Financial Plan</Typography>
            <Chip label={TAX_YEAR+" Federal Tax Data"} size="small" sx={{bgcolor:"rgba(0,212,138,0.1)",color:"#00d48a",border:"1px solid rgba(0,212,138,0.3)",fontWeight:600,fontSize:"0.7rem"}}/>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Prepared by Margaret Chen, CPA, CFP&reg;&nbsp;&bull;&nbsp;{TAX_YEAR} profile&nbsp;&bull;&nbsp;{totalRecs} recommendations across 4 categories
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} sx={{flexShrink:0}}>
          <Button variant="outlined" startIcon={<EditIcon/>} onClick={()=>navigate("/wizard")} size="small">Edit</Button>
          <PdfExportButton input={data} result={result}/>
        </Stack>
      </Stack>

      <SourceBanner source={result.source}/>
      <SummaryCards summary={result.summary}/>
      <TaxProfile result={result} data={data}/>
      <AllocationChart balances={data.balances} summary={result.summary}/>
    <RetirementProjectionChart input={data} summary={result.summary}/>
      <SavingsSummary result={result}/>

      <Divider sx={{my:4}}>
        <Typography sx={{fontSize:"0.72rem",color:"#8b9bb4",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.12em",px:2}}>
          Detailed Recommendations & Educational Guide
        </Typography>
      </Divider>

      {SECTIONS.map((sec)=>(
        <Box key={sec.key} sx={{mb:6}}>
          <Box sx={{mb:2.5,pb:2,borderBottom:"1px solid #1e2d45"}}>
            <Box sx={{display:"flex",alignItems:"center",gap:1.5,mb:0.5}}>
              <Box sx={{width:28,height:28,borderRadius:"50%",bgcolor:"rgba(0,212,138,0.15)",border:"1px solid rgba(0,212,138,0.3)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <Typography sx={{fontSize:"0.75rem",fontWeight:800,color:"#00d48a"}}>{sec.num}</Typography>
              </Box>
              <Typography variant="h5" sx={{fontWeight:700}}>{sec.label}</Typography>
            </Box>
            <Typography sx={{fontSize:"0.85rem",color:"#8b9bb4",ml:5}}>{sec.desc}</Typography>
          </Box>
          <RecommendationSection title="" items={result[sec.key] ?? []} onAsk={openChat}/>
        </Box>
      ))}

      <RoadmapChecklist roadmap={result.roadmap}/>

      <Alert severity="info" sx={{mt:2}}>
        <Typography variant="caption">{result.disclaimer}</Typography>
      </Alert>

      <Tooltip title="Ask Margaret — your AI financial advisor" placement="left">
        <Fab onClick={()=>openChat()} sx={{position:"fixed",bottom:32,right:32,zIndex:200,background:"linear-gradient(135deg,#00d48a,#00b876)",color:"#0a0e1a",boxShadow:"0 0 28px rgba(0,212,138,0.4)","@keyframes pulse":{"0%,100%":{boxShadow:"0 0 28px rgba(0,212,138,0.4)"},"50%":{boxShadow:"0 0 48px rgba(0,212,138,0.7)"}},animation:"pulse 3s ease-in-out infinite","&:hover":{background:"linear-gradient(135deg,#00b876,#009960)",transform:"scale(1.05)"},transition:"transform 0.15s"}}>
          <ChatIcon/>
        </Fab>
      </Tooltip>

      <AdvisorChat open={chatOpen} onClose={()=>setChatOpen(false)} input={data} result={result} initialQuestion={chatQuestion}/>
    </Container>
  );
}
