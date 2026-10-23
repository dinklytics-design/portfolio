import{useEffect}from"react";import{useForm,Controller}from"react-hook-form";import{zodResolver}from"@hookform/resolvers/zod";import{Grid,TextField,Typography,FormControlLabel,Switch,MenuItem,InputAdornment,Divider,Alert}from"@mui/material";import{useWizard}from"../../context/WizardContext";import{deductionsBusinessSchema}from"../../lib/stepSchemas";import type{z}from"zod";
type F=z.infer<typeof deductionsBusinessSchema>;
const ENTITY=[{value:"none",label:"N/A"},{value:"sole_proprietor",label:"Sole Proprietor"},{value:"llc",label:"LLC"},{value:"s_corp",label:"S-Corporation"},{value:"c_corp",label:"C-Corporation"},{value:"partnership",label:"Partnership"}];
const dollar=(ctl:any,n:keyof F,lbl:string,hint?:string)=>(<Controller name={n} control={ctl} render={({field,fieldState})=>(<TextField fullWidth type="number" label={lbl} error={!!fieldState.error} helperText={fieldState.error?.message||hint} slotProps={{input:{startAdornment:<InputAdornment position="start">$</InputAdornment>}}}{...field}/>)}/>);
export default function DeductionsBusinessStep({onValidityChange}:{onValidityChange:(v:boolean)=>void}){
  const{data,updateData}=useWizard();
  const hasDeps=(data.dependents||0)>0;
  const hasRental=(data.income?.rentalIncome||0)>0;
  const{control,watch,formState:{isValid}}=useForm<F>({resolver:zodResolver(deductionsBusinessSchema)as any,mode:"onChange",defaultValues:{mortgageInterest:data.deductionsBusiness.mortgageInterest,stateLocalTaxesPaid:data.deductionsBusiness.stateLocalTaxesPaid,charitableGivingAnnual:data.deductionsBusiness.charitableGivingAnnual,usesDonorAdvisedFund:data.deductionsBusiness.usesDonorAdvisedFund,hasHsaEligiblePlan:data.deductionsBusiness.hasHsaEligiblePlan,studentLoanInterest:data.deductionsBusiness.studentLoanInterest??0,dependentCareExpenses:data.deductionsBusiness.dependentCareExpenses??0,educationExpenses:data.deductionsBusiness.educationExpenses??0,significantMedicalExpenses:data.deductionsBusiness.significantMedicalExpenses??false,isSelfEmployedOrBusinessOwner:data.deductionsBusiness.isSelfEmployedOrBusinessOwner,businessEntityType:data.deductionsBusiness.businessEntityType??"none",netBusinessProfit:data.deductionsBusiness.netBusinessProfit??0,hasHomeOffice:data.deductionsBusiness.hasHomeOffice??false,isSpecifiedServiceTrade:data.deductionsBusiness.isSpecifiedServiceTrade??false,rentalPropertyCount:data.deductionsBusiness.rentalPropertyCount??0,rentalAnnualDepreciation:data.deductionsBusiness.rentalAnnualDepreciation??0}});
  const v=watch();
  const isSE=v.isSelfEmployedOrBusinessOwner;
  useEffect(()=>{
    onValidityChange(isValid);
    if(isValid)updateData({deductionsBusiness:{mortgageInterest:Number(v.mortgageInterest),stateLocalTaxesPaid:Number(v.stateLocalTaxesPaid),charitableGivingAnnual:Number(v.charitableGivingAnnual),usesDonorAdvisedFund:v.usesDonorAdvisedFund,hasHsaEligiblePlan:v.hasHsaEligiblePlan,studentLoanInterest:Number(v.studentLoanInterest),dependentCareExpenses:hasDeps?Number(v.dependentCareExpenses):undefined,educationExpenses:Number(v.educationExpenses),significantMedicalExpenses:v.significantMedicalExpenses,isSelfEmployedOrBusinessOwner:v.isSelfEmployedOrBusinessOwner,businessEntityType:v.businessEntityType,netBusinessProfit:isSE?Number(v.netBusinessProfit):undefined,hasHomeOffice:isSE?v.hasHomeOffice:undefined,isSpecifiedServiceTrade:isSE?v.isSpecifiedServiceTrade:undefined,rentalPropertyCount:hasRental?Number(v.rentalPropertyCount):undefined,rentalAnnualDepreciation:hasRental?Number(v.rentalAnnualDepreciation):undefined}});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[isValid,JSON.stringify(v),hasDeps,isSE,hasRental]);
  return(<Grid container spacing={3}>
    <Grid size={12}><Typography variant="h6">Deductions, Credits &amp; Business Structure</Typography></Grid>
    <Grid size={12}><Divider><Typography variant="caption" color="text.secondary">Itemized Deductions</Typography></Divider></Grid>
    <Grid size={{xs:12,sm:6}}>{dollar(control,"mortgageInterest","Annual Mortgage Interest Paid","Deductible on up to $750k of mortgage debt")}</Grid>
    <Grid size={{xs:12,sm:6}}>{dollar(control,"stateLocalTaxesPaid","State/Local Taxes Paid (SALT)","Capped at $10,000 deduction")}</Grid>
    <Grid size={{xs:12,sm:6}}>{dollar(control,"charitableGivingAnnual","Annual Charitable Giving")}</Grid>
    <Grid size={{xs:12,sm:6}}>{dollar(control,"studentLoanInterest","Student Loan Interest Paid","Deductible up to $2,500 (income phase-outs apply)")}</Grid>
    <Grid size={12}><Divider><Typography variant="caption" color="text.secondary">Above-the-Line Deductions &amp; Credits</Typography></Divider></Grid>
    {hasDeps&&<Grid size={{xs:12,sm:6}}>{dollar(control,"dependentCareExpenses","Annual Childcare / Dependent Care Expenses","Drives Child & Dependent Care Credit and FSA advice")}</Grid>}
    <Grid size={{xs:12,sm:6}}>{dollar(control,"educationExpenses","College / Education Expenses Paid","American Opportunity Credit up to $2,500 for first 4 years")}</Grid>
    <Grid size={{xs:12,sm:6}}>
      <Controller name="significantMedicalExpenses" control={control} render={({field})=>(<FormControlLabel control={<Switch checked={!!field.value} onChange={e=>field.onChange(e.target.checked)}/>} label="Significant out-of-pocket medical expenses this year (&gt;7.5% of income)"/>)}/>
    </Grid>
    <Grid size={{xs:12,sm:6}}>
      <Controller name="usesDonorAdvisedFund" control={control} render={({field})=>(<FormControlLabel control={<Switch checked={!!field.value} onChange={e=>field.onChange(e.target.checked)}/>} label="I already use a Donor-Advised Fund (DAF)"/>)}/>
    </Grid>
    <Grid size={{xs:12,sm:6}}>
      <Controller name="hasHsaEligiblePlan" control={control} render={({field})=>(<FormControlLabel control={<Switch checked={!!field.value} onChange={e=>field.onChange(e.target.checked)}/>} label="I have an HSA-eligible high-deductible health plan"/>)}/>
    </Grid>
    {hasRental&&<><Grid size={12}><Divider><Typography variant="caption" color="text.secondary">Rental Property</Typography></Divider></Grid>
    <Grid size={{xs:12,sm:6}}><Controller name="rentalPropertyCount" control={control} render={({field,fieldState})=>(<TextField fullWidth type="number" label="Number of Rental Properties" error={!!fieldState.error} helperText="Passive activity rules and depreciation differ per property"{...field}/>)}/></Grid>
    <Grid size={{xs:12,sm:6}}>{dollar(control,"rentalAnnualDepreciation","Annual Depreciation Claimed","Depreciation reduces taxable rental income but triggers recapture on sale")}</Grid></>}
    <Grid size={12}><Divider><Typography variant="caption" color="text.secondary">Self-Employment &amp; Business</Typography></Divider></Grid>
    <Grid size={12}>
      <Controller name="isSelfEmployedOrBusinessOwner" control={control} render={({field})=>(<FormControlLabel control={<Switch checked={!!field.value} onChange={e=>field.onChange(e.target.checked)}/>} label="I am self-employed or own a business"/>)}/>
    </Grid>
    {isSE&&<>
      <Grid size={{xs:12,sm:6}}><Controller name="businessEntityType" control={control} render={({field,fieldState})=>(<TextField select fullWidth label="Business Entity Type" error={!!fieldState.error} helperText={fieldState.error?.message}{...field}>{ENTITY.map(o=><MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}</TextField>)}/></Grid>
      <Grid size={{xs:12,sm:6}}>{dollar(control,"netBusinessProfit","Estimated Net Business Profit","After ordinary business expenses, before retirement contributions")}</Grid>
      <Grid size={{xs:12,sm:6}}><Controller name="hasHomeOffice" control={control} render={({field})=>(<FormControlLabel control={<Switch checked={!!field.value} onChange={e=>field.onChange(e.target.checked)}/>} label="I use a dedicated home office exclusively for business"/>)}/></Grid>
      <Grid size={{xs:12,sm:6}}><Controller name="isSpecifiedServiceTrade" control={control} render={({field})=>(<FormControlLabel control={<Switch checked={!!field.value} onChange={e=>field.onChange(e.target.checked)}/>} label="My business is a Specified Service Trade (law, consulting, finance, health, etc.)"/>)}/></Grid>
      {v.isSpecifiedServiceTrade&&<Grid size={12}><Alert severity="warning" sx={{fontSize:"0.82rem"}}>SSTB status limits or eliminates the 20% QBI deduction at higher income levels. We’ll analyze your specific phase-out thresholds in the recommendations.</Alert></Grid>}
    </>}
  </Grid>);
}