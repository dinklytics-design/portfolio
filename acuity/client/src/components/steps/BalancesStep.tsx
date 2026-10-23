import{useEffect}from"react";import{useForm,Controller}from"react-hook-form";import{zodResolver}from"@hookform/resolvers/zod";import{Grid,TextField,MenuItem,Typography,FormControlLabel,Switch,Divider,InputAdornment,Alert}from"@mui/material";import{useWizard}from"../../context/WizardContext";import{balancesSchema}from"../../lib/stepSchemas";import type{z}from"zod";
type F=z.infer<typeof balancesSchema>;
const GAIN_OPTIONS=[{value:"none",label:"Minimal / At a loss"},{value:"under25",label:"1–25% gain"},{value:"25to50",label:"26–50% gain"},{value:"over50",label:"Over 50% gain"}];
const dollar=(control:any,n:keyof F,lbl:string,hint?:string)=>(<Controller name={n} control={control} render={({field,fieldState})=>(<TextField fullWidth type="number" label={lbl} error={!!fieldState.error} helperText={fieldState.error?.message||hint} slotProps={{input:{startAdornment:<InputAdornment position="start">$</InputAdornment>}}}{...field}/>)}/>);
export default function BalancesStep({onValidityChange}:{onValidityChange:(v:boolean)=>void}){
  const{data,updateData}=useWizard();
  const{control,watch,formState:{isValid}}=useForm<F>({resolver:zodResolver(balancesSchema)as any,mode:"onChange",defaultValues:{traditional401kIra:data.balances.traditional401kIra,rothIraOr401k:data.balances.rothIraOr401k,taxableBrokerage:data.balances.taxableBrokerage,hsaBalance:data.balances.hsaBalance,cashSavings:data.balances.cashSavings,otherAssets:data.balances.otherAssets,liabilities:data.balances.liabilities,educationSavings529:data.balances.educationSavings529??0,primaryHomeValue:data.balances.primaryHomeValue??0,unrealizedGainPct:data.balances.unrealizedGainPct??"none",hasPension:data.balances.hasPension??false,estimatedMonthlyPension:data.balances.estimatedMonthlyPension??0}});
  const v=watch();
  useEffect(()=>{
    onValidityChange(isValid);
    if(isValid)updateData({balances:{traditional401kIra:Number(v.traditional401kIra),rothIraOr401k:Number(v.rothIraOr401k),taxableBrokerage:Number(v.taxableBrokerage),hsaBalance:Number(v.hsaBalance),cashSavings:Number(v.cashSavings),otherAssets:Number(v.otherAssets),liabilities:Number(v.liabilities),educationSavings529:Number(v.educationSavings529),primaryHomeValue:Number(v.primaryHomeValue),unrealizedGainPct:v.unrealizedGainPct,hasPension:v.hasPension,estimatedMonthlyPension:v.hasPension?Number(v.estimatedMonthlyPension):undefined}});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[isValid,JSON.stringify(v)]);
  return(<Grid container spacing={3}>
    <Grid size={12}><Typography variant="h6">Current Balances &amp; Net Worth</Typography></Grid>
    <Grid size={{xs:12,sm:6}}>{dollar(control,"traditional401kIra","Traditional 401(k) / IRA Balance")}</Grid>
    <Grid size={{xs:12,sm:6}}>{dollar(control,"rothIraOr401k","Roth IRA / Roth 401(k) Balance")}</Grid>
    <Grid size={{xs:12,sm:6}}>{dollar(control,"taxableBrokerage","Taxable Brokerage Balance")}</Grid>
    <Grid size={{xs:12,sm:6}}>
      <Controller name="unrealizedGainPct" control={control} render={({field})=>(
        <TextField select fullWidth label="Approx. Unrealized Gain in Taxable Brokerage" helperText="Critical for tax-loss harvesting and asset sale sequencing" {...field}>
          {GAIN_OPTIONS.map(o=><MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
        </TextField>
      )}/>
    </Grid>
    <Grid size={{xs:12,sm:6}}>{dollar(control,"hsaBalance","HSA Balance")}</Grid>
    <Grid size={{xs:12,sm:6}}>{dollar(control,"cashSavings","Cash / Emergency Fund","Liquid savings in bank accounts, money market, etc.")}</Grid>
    <Grid size={{xs:12,sm:6}}>{dollar(control,"primaryHomeValue","Primary Home Value (0 if renting)","Home equity drives net worth and itemized deduction analysis")}</Grid>
    <Grid size={{xs:12,sm:6}}>{dollar(control,"educationSavings529","529 / Education Savings Balance","Needed for college funding gap analysis")}</Grid>
    <Grid size={{xs:12,sm:6}}>{dollar(control,"otherAssets","Other Assets (vehicles, business equity, etc.)")}</Grid>
    <Grid size={{xs:12,sm:6}}>{dollar(control,"liabilities","Total Liabilities (mortgage, loans, cards)")}</Grid>
    <Grid size={12}><Divider/></Grid>
    <Grid size={12}>
      <Controller name="hasPension" control={control} render={({field})=>(
        <FormControlLabel control={<Switch checked={!!field.value} onChange={e=>field.onChange(e.target.checked)}/>} label="I have a defined-benefit pension"/>
      )}/>
    </Grid>
    {v.hasPension&&<Grid size={{xs:12,sm:6}}>{dollar(control,"estimatedMonthlyPension","Estimated Monthly Pension at Retirement","Dramatically changes withdrawal sequencing and SS timing advice")}</Grid>}
    {Number(v.taxableBrokerage)>0&&v.unrealizedGainPct==="over50"&&<Grid size={12}><Alert severity="info" sx={{fontSize:"0.82rem"}}>Large unrealized gains (&gt;50%) mean asset sales are costly. We’ll recommend tax-loss harvesting offsets and gifting appreciated shares to a DAF to reduce capital gain exposure.</Alert></Grid>}
  </Grid>);
}