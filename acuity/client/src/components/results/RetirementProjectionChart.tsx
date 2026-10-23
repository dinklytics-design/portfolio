import{useMemo}from"react";
import{Box,Typography}from"@mui/material";
import{AreaChart,Area,XAxis,YAxis,CartesianGrid,Tooltip,ReferenceLine,ResponsiveContainer}from"recharts";
import type{WizardInput,RecommendationsResult}from"../../types";

const GREEN="#00d48a",BLUE="#3b82f6",AMBER="#f59e0b",RED="#f87171";
const fmt=(n:number)=>n>=1000000?"$"+(n/1000000).toFixed(1)+"M":n>=1000?"$"+(n/1000).toFixed(0)+"k":"$"+Math.round(n);

interface Props{input:WizardInput;summary:RecommendationsResult["summary"];}
interface Scenario{label:string;monthlyIncome:number;annualExpenses:number;fiTarget:number;color:string;tag:string;}

export default function RetirementProjectionChart({input,summary}:Props){
  const currentAge=input.age||35;
  const totalPortfolio=((input.balances?.traditional401kIra||0)+(input.balances?.rothIraOr401k||0)+(input.balances?.taxableBrokerage||0)+(input.balances?.hsaBalance||0)+(input.balances?.cashSavings||0));
  const annualContribs=((input.contributions?.traditional401kAnnual||0)+(input.contributions?.rothAnnual||0)+(input.contributions?.taxableAnnual||0)+(input.contributions?.hsaAnnual||0));
  const grossIncome=summary?.totalAnnualIncome||input.income?.w2Income||0;
  const growthRate=((input.income?.expectedAnnualGrowthPct||7))/100;
  const preferredRetAge=input.goals?.earlyRetirement&&input.goals?.targetRetirementAge?input.goals.targetRetirementAge:null;
  const stdRetAge=67;
  const desiredMonthly=input.goals?.desiredMonthlyRetirementIncome||0;
  const thumbExpenses=Math.round(grossIncome*0.8);
  const desiredExpenses=desiredMonthly>0?desiredMonthly*12:0;

  const projPort=useMemo(()=>(years:number)=>{let p=totalPortfolio;for(let i=0;i<years;i++)p=p*(1+growthRate)+annualContribs;return Math.round(p);},[totalPortfolio,annualContribs,growthRate]);

  const scenarios:Scenario[]=useMemo(()=>{
    const s:Scenario[]=[];
    if(desiredExpenses>0) s.push({label:`Your Desired: ${fmt(desiredMonthly)}/mo`,monthlyIncome:desiredMonthly,annualExpenses:desiredExpenses,fiTarget:desiredExpenses*25,color:GREEN,tag:"Desired"});
    if(thumbExpenses>0) s.push({label:`Rule of Thumb: 80% of income`,monthlyIncome:thumbExpenses/12,annualExpenses:thumbExpenses,fiTarget:thumbExpenses*25,color:AMBER,tag:"80% Rule"});
    return s;
  },[desiredExpenses,thumbExpenses,desiredMonthly]);

  const findReadyAge=(fiTarget:number)=>{for(let age=currentAge;age<=85;age++){if(projPort(age-currentAge)>=fiTarget)return age;}return null;};

  const chartData=useMemo(()=>{
    const data=[];
    for(let age=currentAge;age<=82;age++) data.push({age,portfolio:projPort(age-currentAge)});
    return data;
  },[projPort,currentAge]);

  if(grossIncome===0||totalPortfolio===0||scenarios.length===0)return null;

  const ScenarioCard=({sc,readyAge,prefPortfolio,stdPortfolio}:{sc:Scenario;readyAge:number|null;prefPortfolio:number;stdPortfolio:number})=>{
    const prefReady=prefPortfolio>=sc.fiTarget;
    const stdReady=stdPortfolio>=sc.fiTarget;
    return(
      <Box sx={{flex:1,p:2,borderRadius:3,border:"1px solid "+sc.color+"44",bgcolor:sc.color+"08"}}>
        <Typography sx={{fontSize:"0.72rem",fontWeight:800,color:sc.color,textTransform:"uppercase",letterSpacing:"0.08em",mb:1}}>{sc.label}</Typography>
        <Box sx={{display:"flex",gap:1,mb:1,flexWrap:"wrap"}}>
          <Box sx={{fontSize:"0.72rem",fontWeight:700,color:sc.color,bgcolor:sc.color+"18",px:1,py:0.3,borderRadius:1}}>{fmt(sc.monthlyIncome)}/mo</Box>
          <Box sx={{fontSize:"0.72rem",color:"#8b9bb4",display:"flex",alignItems:"center"}}>{fmt(sc.annualExpenses)}/yr</Box>
          <Box sx={{fontSize:"0.72rem",color:"#8b9bb4",display:"flex",alignItems:"center"}}>FI Target: {fmt(sc.fiTarget)}</Box>
        </Box>
        <Box sx={{display:"flex",gap:1,flexWrap:"wrap"}}>
          {preferredRetAge&&<Box sx={{p:1.2,borderRadius:2,bgcolor:"rgba(255,255,255,0.03)",border:"1px solid "+(prefReady?sc.color+"66":"#1e2d45")}}><Typography sx={{fontSize:"0.7rem",color:"#8b9bb4",mb:0.3}}>Preferred (Age {preferredRetAge})</Typography><Typography sx={{fontSize:"0.95rem",fontWeight:800,color:prefReady?sc.color:RED}}>{fmt(prefPortfolio)}</Typography><Typography sx={{fontSize:"0.68rem",color:prefReady?sc.color:RED}}>{Math.round(prefPortfolio/sc.fiTarget*100)}% {prefReady?"Ready":"of goal"}</Typography></Box>}
          {readyAge&&<Box sx={{p:1.2,borderRadius:2,bgcolor:sc.color+"0a",border:"2px solid "+sc.color+"66"}}><Typography sx={{fontSize:"0.7rem",color:"#8b9bb4",mb:0.3}}>Ready Age</Typography><Typography sx={{fontSize:"1.1rem",fontWeight:900,color:sc.color}}>{readyAge}</Typography><Typography sx={{fontSize:"0.68rem",color:"#8b9bb4"}}>{readyAge-currentAge} yrs away</Typography></Box>}
          <Box sx={{p:1.2,borderRadius:2,bgcolor:"rgba(255,255,255,0.02)",border:"1px solid #1e2d45"}}><Typography sx={{fontSize:"0.7rem",color:"#8b9bb4",mb:0.3}}>Standard (Age {stdRetAge})</Typography><Typography sx={{fontSize:"0.95rem",fontWeight:800,color:stdReady?sc.color:RED}}>{fmt(stdPortfolio)}</Typography><Typography sx={{fontSize:"0.68rem",color:stdReady?sc.color:"#8b9bb4"}}>{Math.round(stdPortfolio/sc.fiTarget*100)}% of goal</Typography></Box>
        </Box>
      </Box>
    );
  };
  return(
    <Box sx={{mb:3,bgcolor:"#111827",border:"1px solid #1e2d45",borderRadius:3,p:3}}>
      <Typography variant="h6" sx={{mb:0.5,fontWeight:700}}>Retirement Readiness - Two Scenarios</Typography>
      <Typography sx={{fontSize:"0.78rem",color:"#8b9bb4",mb:2.5}}>Portfolio projected at {Math.round(growthRate*100)}% annual growth with {fmt(annualContribs)}/yr contributions. Two scenarios shown: your desired monthly income and the standard financial planning rule of thumb (80% of current income).</Typography>
      <Box sx={{display:"flex",gap:2,mb:3,flexWrap:"wrap"}}>{scenarios.map(sc=><ScenarioCard key={sc.tag} sc={sc} readyAge={findReadyAge(sc.fiTarget)} prefPortfolio={preferredRetAge?projPort(preferredRetAge-currentAge):0} stdPortfolio={projPort(stdRetAge-currentAge)}/>)}</Box>
      <Box sx={{width:"100%",height:260}}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{left:8,right:16,top:8,bottom:4}}>
            <defs><linearGradient id="retGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={GREEN} stopOpacity={0.25}/><stop offset="95%" stopColor={GREEN} stopOpacity={0.02}/></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2d45"/>
            <XAxis dataKey="age" tick={{fill:"#8b9bb4",fontSize:11}} axisLine={false} tickLine={false} label={{value:"Age",position:"insideBottom",offset:-2,fill:"#8b9bb4",fontSize:11}}/>
            <YAxis tickFormatter={v=>v>=1000000?(v/1000000).toFixed(1)+"M":v>=1000?(v/1000).toFixed(0)+"k":String(v)} tick={{fill:"#8b9bb4",fontSize:11}} axisLine={false} tickLine={false}/>
            <Tooltip contentStyle={{backgroundColor:"#1a2235",border:"1px solid #1e2d45",borderRadius:8}} formatter={(v:any)=>[fmt(Number(v)),"Portfolio"]} labelFormatter={l=>"Age "+l}/>
            {scenarios.map(sc=><ReferenceLine key={sc.tag} y={sc.fiTarget} stroke={sc.color} strokeDasharray="5 3" label={{value:sc.tag+" "+fmt(sc.fiTarget),position:"insideTopRight",fill:sc.color,fontSize:10}}/>)}
            {preferredRetAge&&<ReferenceLine x={preferredRetAge} stroke={AMBER} strokeDasharray="4 3" label={{value:"Preferred "+preferredRetAge,position:"insideTopLeft",fill:AMBER,fontSize:10}}/>}
            <ReferenceLine x={stdRetAge} stroke={BLUE} strokeDasharray="4 3" label={{value:"Standard "+stdRetAge,position:"insideTopLeft",fill:BLUE,fontSize:10}}/>
            <Area type="monotone" dataKey="portfolio" stroke={GREEN} strokeWidth={2} fill="url(#retGrad)" dot={false}/>
          </AreaChart>
        </ResponsiveContainer>
      </Box>
      <Box sx={{mt:2,p:1.5,bgcolor:"rgba(0,212,138,0.04)",border:"1px solid rgba(0,212,138,0.15)",borderRadius:2}}>
        <Typography sx={{fontSize:"0.82rem",color:"#e2e8f0",lineHeight:1.7}}>{scenarios.map(sc=>{const ra=findReadyAge(sc.fiTarget);return ra?(sc.label+": Financial Independence target of "+fmt(sc.fiTarget)+" reached at age "+ra+" ("+( ra-currentAge)+" years from now).  "):null;}).filter(Boolean).join("")}{preferredRetAge&&scenarios.length>0&&(()=>{const sc=scenarios[0];const pp=projPort(preferredRetAge-currentAge);if(pp<sc.fiTarget){return" To retire at preferred age "+preferredRetAge+", you need approximately "+fmt(Math.round((sc.fiTarget-pp)/Math.max(1,preferredRetAge-currentAge)))+"/year more in contributions.";}return null;})()}</Typography>
      </Box>
    </Box>
  );
}
