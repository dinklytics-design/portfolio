import{useEffect}from"react";import{useForm,Controller}from"react-hook-form";import{zodResolver}from"@hookform/resolvers/zod";import{Grid,TextField,Typography,InputAdornment,FormControlLabel,Switch,Divider,Alert,Chip}from"@mui/material";import{useWizard}from"../../context/WizardContext";import{contributionsSchema}from"../../lib/stepSchemas";import type{z}from"zod";
type F=z.infer<typeof contributionsSchema>;
const dollar=(ctl:any,n:keyof F,lbl:string,hint?:string)=>(<Controller name={n} control={ctl} render={({field,fieldState})=>(<TextField fullWidth type="number" label={lbl} error={!!fieldState.error} helperText={fieldState.error?.message||hint} slotProps={{input:{startAdornment:<InputAdornment position="start">$</InputAdornment>}}}{...field}/>)}/>);
const pct=(ctl:any,n:keyof F,lbl:string,hint?:string)=>(<Controller name={n} control={ctl} render={({field,fieldState})=>(<TextField fullWidth type="number" label={lbl} error={!!fieldState.error} helperText={fieldState.error?.message||hint} slotProps={{input:{endAdornment:<InputAdornment position="end">%</InputAdornment>}}}{...field}/>)}/>);
export default function ContributionsStep({onValidityChange}:{onValidityChange:(v:boolean)=>void}){
  const{data,updateData}=useWizard();
  const age=data.age||35;const isSE=data.employmentStatus==="self_employed"||data.employmentStatus==="both";const hasSEIncome=(data.income?.selfEmployment1099Income||0)>0;const showSE=isSE||hasSEIncome;const catchUpAge=age>=50;const megaCatchUp=age>=60&&age<=63;
  const{control,watch,formState:{isValid}}=useForm<F>({resolver:zodResolver(contributionsSchema)as any,mode:"onChange",defaultValues:{has401kAtWork:data.contributions.has401kAtWork??true,traditional401kAnnual:data.contributions.traditional401kAnnual,rothAnnual:data.contributions.rothAnnual,hasRoth401kOption:data.contributions.hasRoth401kOption??false,hasAfterTax401kOption:data.contributions.hasAfterTax401kOption??false,usingCatchUp:data.contributions.usingCatchUp??false,taxableAnnual:data.contributions.taxableAnnual,hsaAnnual:data.contributions.hsaAnnual,employerMatchPct:data.contributions.employerMatchPct,employerMatchCapPct:data.contributions.employerMatchCapPct,sepOrSolo401kAnnual:data.contributions.sepOrSolo401kAnnual??0,annualContribution529:data.contributions.annualContribution529??0}});
  const v=watch();const has401k=v.has401kAtWork;
  useEffect(()=>{
    onValidityChange(isValid);
    if(isValid)updateData({contributions:{has401kAtWork:v.has401kAtWork,traditional401kAnnual:Number(v.traditional401kAnnual),rothAnnual:Number(v.rothAnnual),hasRoth401kOption:v.hasRoth401kOption,hasAfterTax401kOption:v.hasAfterTax401kOption,usingCatchUp:v.usingCatchUp,taxableAnnual:Number(v.taxableAnnual),hsaAnnual:Number(v.hsaAnnual),employerMatchPct:Number(v.employerMatchPct),employerMatchCapPct:Number(v.employerMatchCapPct),sepOrSolo401kAnnual:showSE?Number(v.sepOrSolo401kAnnual):undefined,annualContribution529:Number(v.annualContribution529)}});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[isValid,JSON.stringify(v),showSE]);
  return(<Grid container spacing={3}>
    <Grid size={12}><Typography variant="h6">Annual Savings &amp; Contributions</Typography></Grid>
    <Grid size={12}><Controller name="has401kAtWork" control={control} render={({field})=>(<FormControlLabel control={<Switch checked={!!field.value} onChange={e=>field.onChange(e.target.checked)}/>} label="My employer offers a 401(k) plan"/>)}/></Grid>
    {has401k&&<>
      <Grid size={12}><Divider><Typography variant="caption" color="text.secondary">401(k) Contributions</Typography></Divider></Grid>
      <Grid size={{xs:12,sm:6}}>{dollar(control,"traditional401kAnnual","Annual Traditional 401(k) Contribution")}</Grid>
      <Grid size={{xs:12,sm:6}}>{dollar(control,"rothAnnual","Annual Roth 401(k)/IRA Contribution")}</Grid>
      <Grid size={{xs:12,sm:6}}>{pct(control,"employerMatchPct","Employer Match (% matched)")}</Grid>
      <Grid size={{xs:12,sm:6}}>{pct(control,"employerMatchCapPct","Match Cap (% of salary)")}</Grid>
      <Grid size={{xs:12,sm:4}}><Controller name="hasRoth401kOption" control={control} render={({field})=>(<FormControlLabel control={<Switch checked={!!field.value} onChange={e=>field.onChange(e.target.checked)}/>} label="Plan offers Roth 401(k)"/>)}/></Grid>
      <Grid size={{xs:12,sm:4}}><Controller name="hasAfterTax401kOption" control={control} render={({field})=>(<FormControlLabel control={<Switch checked={!!field.value} onChange={e=>field.onChange(e.target.checked)}/>} label={<>After-tax contributions <Chip size="small" label="Mega Backdoor Roth" sx={{ml:0.5,fontSize:"0.6rem",bgcolor:"rgba(0,212,138,0.12)",color:"#00d48a",border:"1px solid rgba(0,212,138,0.3)"}}/></>}/>)}/></Grid>
      {catchUpAge&&<Grid size={{xs:12,sm:4}}><Controller name="usingCatchUp" control={control} render={({field})=>(<FormControlLabel control={<Switch checked={!!field.value} onChange={e=>field.onChange(e.target.checked)}/>} label={<>Using catch-up <Chip size="small" label={megaCatchUp?"Ages 60-63: +$11,250":"+$7,500"} sx={{ml:0.5,fontSize:"0.6rem",bgcolor:"rgba(251,191,36,0.12)",color:"#fbbf24",border:"1px solid rgba(251,191,36,0.3)"}}/></>}/>)}/></Grid>}
    </>}
    <Grid size={12}><Divider><Typography variant="caption" color="text.secondary">Other Accounts</Typography></Divider></Grid>
    <Grid size={{xs:12,sm:6}}>{dollar(control,"taxableAnnual","Annual Taxable Brokerage Contribution")}</Grid>
    <Grid size={{xs:12,sm:6}}>{dollar(control,"hsaAnnual","Annual HSA Contribution","Triple tax benefit — max this before taxable investing")}</Grid>
    {showSE&&<><Grid size={12}><Divider><Typography variant="caption" color="text.secondary">Self-Employment Retirement Accounts</Typography></Divider></Grid>
    <Grid size={{xs:12,sm:6}}>{dollar(control,"sepOrSolo401kAnnual","Annual SEP-IRA / Solo 401(k) Contribution","Up to 25% of net SE income, or employee deferral limit for Solo 401(k)")}</Grid></>}
    {data.goals?.collegeFunding&&<><Grid size={12}><Divider><Typography variant="caption" color="text.secondary">Education Savings</Typography></Divider></Grid>
    <Grid size={{xs:12,sm:6}}>{dollar(control,"annualContribution529","Annual 529 Plan Contribution","Tax-free growth for qualified education expenses")}</Grid></>}
    {v.hasAfterTax401kOption&&<Grid size={12}><Alert severity="success" sx={{fontSize:"0.82rem"}}>After-tax contributions unlock the <strong>Mega Backdoor Roth</strong> — potentially $40k+ in additional annual Roth savings. We’ll include this strategy in your recommendations.</Alert></Grid>}
  </Grid>);
}