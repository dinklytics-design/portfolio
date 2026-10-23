import{Grid,Typography,Paper,Divider,Chip,Box}from"@mui/material";import{useWizard}from"../../context/WizardContext";
function fmt(n:number){return`$${n.toLocaleString()}`;}
function Row({label,value}:{label:string;value:string}){return(<Typography variant="body2" sx={{mb:0.3}}><Box component="span" sx={{fontWeight:600,color:"text.secondary"}}>{label}: </Box>{value}</Typography>);}
export default function ReviewStep(){
  const{data}=useWizard();
  return(<Grid container spacing={2}>
    <Grid size={12}><Typography variant="h6" gutterBottom>Review Your Information</Typography><Typography variant="body2" color="text.secondary" sx={{mb:2}}>Confirm everything looks correct, then generate your personalized recommendations.</Typography></Grid>
    <Grid size={{xs:12,sm:6}}><Paper variant="outlined" sx={{p:2}}><Typography variant="subtitle2" sx={{mb:1}}>Basics</Typography><Divider sx={{mb:1}}/>
      <Row label="Filing Status" value={data.filingStatus.replace(/_/g," ")}/>
      <Row label="State" value={data.state}/><Row label="Age" value={String(data.age)}/>
      {data.spouseAge&&<Row label="Spouse Age" value={String(data.spouseAge)}/>}
      <Row label="Dependents" value={String(data.dependents)}/>
      {data.employmentStatus&&<Row label="Employment" value={data.employmentStatus.replace(/_/g," ")}/>}
    </Paper></Grid>
    <Grid size={{xs:12,sm:6}}><Paper variant="outlined" sx={{p:2}}><Typography variant="subtitle2" sx={{mb:1}}>Income</Typography><Divider sx={{mb:1}}/>
      <Row label="W-2" value={fmt(data.income.w2Income)}/><Row label="1099/SE" value={fmt(data.income.selfEmployment1099Income)}/>
      {(data.income.qualifiedDividendsLtcg||0)>0&&<Row label="LTCG/Qualified Dividends" value={fmt(data.income.qualifiedDividendsLtcg||0)}/>}
      {(data.income.rentalIncome||0)>0&&<Row label="Rental" value={fmt(data.income.rentalIncome||0)}/>}
      {(data.income.socialSecurityIncome||0)>0&&<Row label="Social Security" value={fmt(data.income.socialSecurityIncome||0)}/>}
      <Row label="Other" value={fmt(data.income.otherIncome)}/>
    </Paper></Grid>
    <Grid size={{xs:12,sm:6}}><Paper variant="outlined" sx={{p:2}}><Typography variant="subtitle2" sx={{mb:1}}>Balances</Typography><Divider sx={{mb:1}}/>
      <Row label="Traditional 401k/IRA" value={fmt(data.balances.traditional401kIra)}/>
      <Row label="Roth" value={fmt(data.balances.rothIraOr401k)}/>
      <Row label="Taxable Brokerage" value={fmt(data.balances.taxableBrokerage)}/>
      <Row label="HSA" value={fmt(data.balances.hsaBalance)}/>
      <Row label="Cash" value={fmt(data.balances.cashSavings)}/>
      {(data.balances.primaryHomeValue||0)>0&&<Row label="Home Value" value={fmt(data.balances.primaryHomeValue||0)}/>}
      {(data.balances.educationSavings529||0)>0&&<Row label="529 Balance" value={fmt(data.balances.educationSavings529||0)}/>}
      <Row label="Liabilities" value={fmt(data.balances.liabilities)}/>
    </Paper></Grid>
    <Grid size={{xs:12,sm:6}}><Paper variant="outlined" sx={{p:2}}><Typography variant="subtitle2" sx={{mb:1}}>Goals &amp; Preferences</Typography><Divider sx={{mb:1}}/>
      {data.goals.riskTolerance&&<Row label="Risk Tolerance" value={data.goals.riskTolerance}/>}
      {data.goals.taxPriority&&<Row label="Tax Priority" value={data.goals.taxPriority.replace(/_/g," ")}/>}
      <Row label="Emergency Fund" value={data.goals.hasEmergencyFund?"Yes":"No"}/>
      <Row label="High-Interest Debt" value={data.goals.hasHighInterestDebt?"Yes":"No"}/>
      <Row label="Buying Home" value={data.goals.buyingHome?"Yes":"No"}/>
      <Row label="Early Retirement" value={data.goals.earlyRetirement?(`Yes — age ${data.goals.targetRetirementAge??""}`):"No"}/>
      <Row label="College Funding" value={data.goals.collegeFunding?"Yes":"No"}/>
      <Box sx={{mt:0.5,display:"flex",gap:0.5,flexWrap:"wrap"}}>
        {data.goals.estateAndLegacy&&<Chip size="small" label="Legacy planning"/>}
        {data.goals.longTermCareConcern&&<Chip size="small" label="LTC concern"/>}
        {data.contributions.hasAfterTax401kOption&&<Chip size="small" label="Mega Backdoor Roth eligible" sx={{bgcolor:"rgba(0,212,138,0.12)",color:"#00d48a"}}/>}
      </Box>
    </Paper></Grid>
  </Grid>);
}