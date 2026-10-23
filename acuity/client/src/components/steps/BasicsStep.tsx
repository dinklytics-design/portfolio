import{useEffect}from"react";import{useForm,Controller}from"react-hook-form";import{zodResolver}from"@hookform/resolvers/zod";import{Grid,TextField,MenuItem,Typography,Alert}from"@mui/material";import{useWizard}from"../../context/WizardContext";import{basicsSchema}from"../../lib/stepSchemas";import type{z}from"zod";
type F=z.infer<typeof basicsSchema>;
const FS=[{value:"single",label:"Single"},{value:"married_filing_jointly",label:"Married Filing Jointly"},{value:"married_filing_separately",label:"Married Filing Separately"},{value:"head_of_household",label:"Head of Household"}];
const ES=[{value:"w2_employee",label:"W-2 Employee"},{value:"self_employed",label:"Self-Employed / 1099"},{value:"both",label:"Both W-2 and Self-Employed"},{value:"retired",label:"Retired"},{value:"not_working",label:"Not Currently Working"}];
const ST=["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC"];
export default function BasicsStep({onValidityChange}:{onValidityChange:(v:boolean)=>void}){
  const{data,updateData}=useWizard();
  const{control,watch,formState:{isValid}}=useForm<F>({resolver:zodResolver(basicsSchema)as any,mode:"onChange",defaultValues:{filingStatus:data.filingStatus,state:data.state,age:data.age,spouseAge:data.spouseAge,dependents:data.dependents,youngestDependentAge:data.youngestDependentAge,employmentStatus:data.employmentStatus??"w2_employee"}});
  const v=watch();
  const married=v.filingStatus==="married_filing_jointly"||v.filingStatus==="married_filing_separately";
  const hasDep=Number(v.dependents)>0;
  const isSE=v.employmentStatus==="self_employed"||v.employmentStatus==="both";
  useEffect(()=>{
    onValidityChange(isValid);
    if(isValid)updateData({filingStatus:v.filingStatus,state:(v.state||"").toUpperCase(),age:Number(v.age),spouseAge:married&&v.spouseAge?Number(v.spouseAge):undefined,dependents:Number(v.dependents),youngestDependentAge:hasDep&&v.youngestDependentAge?Number(v.youngestDependentAge):undefined,employmentStatus:v.employmentStatus});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[isValid,JSON.stringify(v),married,hasDep]);
  return(<Grid container spacing={3}>
    <Grid size={12}><Typography variant="h6">Tell us about yourself</Typography></Grid>
    <Grid size={{xs:12,sm:6}}><Controller name="filingStatus" control={control} render={({field,fieldState})=>(<TextField select fullWidth label="Filing Status" error={!!fieldState.error} helperText={fieldState.error?.message}{...field}>{FS.map(o=><MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}</TextField>)}/></Grid>
    <Grid size={{xs:12,sm:6}}><Controller name="state" control={control} render={({field,fieldState})=>(<TextField select fullWidth label="State of Residence" error={!!fieldState.error} helperText={fieldState.error?.message}{...field}>{ST.map(s=><MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField>)}/></Grid>
    <Grid size={{xs:12,sm:6}}><Controller name="age" control={control} render={({field,fieldState})=>(<TextField fullWidth type="number" label="Your Age" error={!!fieldState.error} helperText={fieldState.error?.message}{...field}/>)}/></Grid>
    {married&&<Grid size={{xs:12,sm:6}}><Controller name="spouseAge" control={control} render={({field,fieldState})=>(<TextField fullWidth type="number" label="Spouse Age" error={!!fieldState.error} helperText={fieldState.error?.message||"Used for RMD timing and Social Security strategy"}{...field}/>)}/></Grid>}
    <Grid size={{xs:12,sm:6}}><Controller name="dependents" control={control} render={({field,fieldState})=>(<TextField fullWidth type="number" label="Number of Dependents" error={!!fieldState.error} helperText={fieldState.error?.message}{...field}/>)}/></Grid>
    {hasDep&&<Grid size={{xs:12,sm:6}}><Controller name="youngestDependentAge" control={control} render={({field,fieldState})=>(<TextField fullWidth type="number" label="Age of Youngest Dependent" error={!!fieldState.error} helperText={fieldState.error?.message||"Affects child tax credit eligibility and college funding timeline"}{...field}/>)}/></Grid>}
    <Grid size={{xs:12,sm:6}}><Controller name="employmentStatus" control={control} render={({field,fieldState})=>(<TextField select fullWidth label="Employment Status" error={!!fieldState.error} helperText={fieldState.error?.message||"Shapes income and contribution questions in later steps"}{...field}>{ES.map(o=><MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}</TextField>)}/></Grid>
    {isSE&&<Grid size={12}><Alert severity="info" sx={{fontSize:"0.82rem"}}>As a self-employed filer, we’ll ask about business income, Solo 401(k)/SEP-IRA contributions, and home office deductions in later steps.</Alert></Grid>}
  </Grid>);
}