import{useEffect}from"react";import{useForm,Controller}from"react-hook-form";import{zodResolver}from"@hookform/resolvers/zod";import{Grid,TextField,Typography,InputAdornment,FormControlLabel,Switch,Divider,Alert}from"@mui/material";import{useWizard}from"../../context/WizardContext";import{incomeSchema}from"../../lib/stepSchemas";import type{z}from"zod";
type F=z.infer<typeof incomeSchema>;
export default function IncomeStep({onValidityChange}:{onValidityChange:(v:boolean)=>void}){
  const{data,updateData}=useWizard();
  const{control,watch,formState:{isValid}}=useForm<F>({resolver:zodResolver(incomeSchema)as any,mode:"onChange",defaultValues:{w2Income:data.income.w2Income,selfEmployment1099Income:data.income.selfEmployment1099Income,investmentIncome:data.income.investmentIncome,otherIncome:data.income.otherIncome,expectedAnnualGrowthPct:data.income.expectedAnnualGrowthPct??6,qualifiedDividendsLtcg:data.income.qualifiedDividendsLtcg??0,ordinaryInterestIncome:data.income.ordinaryInterestIncome??0,rentalIncome:data.income.rentalIncome??0,receivesSSOrPension:!!(data.income.socialSecurityIncome||data.income.pensionIncome),socialSecurityIncome:data.income.socialSecurityIncome??0,pensionIncome:data.income.pensionIncome??0,receivesRSU:!!(data.income.rsuVestingValue),rsuVestingValue:data.income.rsuVestingValue??0}});
  const v=watch();
  const age=data.age||35;
  useEffect(()=>{
    onValidityChange(isValid);
    if(isValid){const inv=(Number(v.qualifiedDividendsLtcg)||0)+(Number(v.ordinaryInterestIncome)||0);updateData({income:{w2Income:Number(v.w2Income),selfEmployment1099Income:Number(v.selfEmployment1099Income),investmentIncome:inv||Number(v.investmentIncome),otherIncome:Number(v.otherIncome),expectedAnnualGrowthPct:Number(v.expectedAnnualGrowthPct),qualifiedDividendsLtcg:Number(v.qualifiedDividendsLtcg),ordinaryInterestIncome:Number(v.ordinaryInterestIncome),rentalIncome:Number(v.rentalIncome),socialSecurityIncome:v.receivesSSOrPension?Number(v.socialSecurityIncome):undefined,pensionIncome:v.receivesSSOrPension?Number(v.pensionIncome):undefined,rsuVestingValue:v.receivesRSU?Number(v.rsuVestingValue):undefined}});}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[isValid,JSON.stringify(v)]);
  const dollar=(n:keyof F,lbl:string,hint?:string)=>(<Controller name={n} control={control} render={({field,fieldState})=>(<TextField fullWidth type="number" label={lbl} error={!!fieldState.error} helperText={fieldState.error?.message||hint} slotProps={{input:{startAdornment:<InputAdornment position="start">$</InputAdornment>}}}{...field}/>)}/>);
  return(<Grid container spacing={3}>
    <Grid size={12}><Typography variant="h6">Annual Income &amp; Sources</Typography></Grid>
    <Grid size={{xs:12,sm:6}}>{dollar("w2Income","Annual W-2 Income")}</Grid>
    <Grid size={{xs:12,sm:6}}>{dollar("selfEmployment1099Income","Annual 1099 / Self-Employment Income","Subject to 15.3% SE tax in addition to income tax")}</Grid>
    <Grid size={12}><Divider><Typography variant="caption" color="text.secondary">Investment Income (split for accurate LTCG analysis)</Typography></Divider></Grid>
    <Grid size={{xs:12,sm:6}}>{dollar("qualifiedDividendsLtcg","Qualified Dividends & Long-Term Capital Gains","Taxed at 0%, 15%, or 20% — lower than ordinary rates")}</Grid>
    <Grid size={{xs:12,sm:6}}>{dollar("ordinaryInterestIncome","Ordinary Interest & Short-Term Gains","Taxed at your full ordinary income rate")}</Grid>
    <Grid size={{xs:12,sm:6}}>{dollar("rentalIncome","Annual Net Rental Income","Net income after expenses, before depreciation")}</Grid>
    <Grid size={{xs:12,sm:6}}>{dollar("otherIncome","Other Annual Income","Alimony received, prizes, misc taxable income")}</Grid>
    <Grid size={12}><Divider/></Grid>
    <Grid size={12}>
      <Controller name="receivesSSOrPension" control={control} render={({field})=>(
        <FormControlLabel control={<Switch checked={!!field.value} onChange={e=>field.onChange(e.target.checked)}/>} label={age>=62?"I receive Social Security or pension income":"I receive a pension (or expect to receive SS before age 65)"}/>
      )}/>
    </Grid>
    {v.receivesSSOrPension&&<>
      <Grid size={{xs:12,sm:6}}>{dollar("socialSecurityIncome","Annual Social Security Income","Up to 85% may be taxable depending on provisional income")}</Grid>
      <Grid size={{xs:12,sm:6}}>{dollar("pensionIncome","Annual Pension Income","Defined-benefit pension or annuity payments")}</Grid>
    </>}
    <Grid size={12}>
      <Controller name="receivesRSU" control={control} render={({field})=>(
        <FormControlLabel control={<Switch checked={!!field.value} onChange={e=>field.onChange(e.target.checked)}/>} label="I receive RSUs, stock options, or equity compensation"/>
      )}/>
    </Grid>
    {v.receivesRSU&&<Grid size={{xs:12,sm:6}}>{dollar("rsuVestingValue","Estimated Annual RSU Vesting Value","RSU vesting is W-2 income — cost basis = FMV at vest date")}</Grid>}
    <Grid size={12}><Divider/></Grid>
    <Grid size={{xs:12,sm:6}}>
      <Controller name="expectedAnnualGrowthPct" control={control} render={({field,fieldState})=>(
        <TextField fullWidth type="number" label="Expected Annual Income Growth" error={!!fieldState.error} helperText={fieldState.error?.message||"Used for multi-year projections"} slotProps={{input:{endAdornment:<InputAdornment position="end">%</InputAdornment>}}}{...field}/>
      )}/>
    </Grid>
    {Number(v.selfEmployment1099Income)>0&&<Grid size={12}><Alert severity="warning" sx={{fontSize:"0.82rem"}}>Self-employment income of ${Number(v.selfEmployment1099Income).toLocaleString()} is subject to ~15.3% SE tax in addition to income tax. We’ll analyze Solo 401(k) and entity strategies in the Contributions and Deductions steps.</Alert></Grid>}
  </Grid>);
}