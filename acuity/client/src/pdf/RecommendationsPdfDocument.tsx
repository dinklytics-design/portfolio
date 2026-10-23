import{Document,Page,Text,View,StyleSheet}from"@react-pdf/renderer";
import type{RecommendationsResult,WizardInput}from"../types";

// react-pdf Helvetica only supports Windows-1252 (Latin-1)
// Use only ASCII-safe characters - no em-dashes, (R), (c), special symbols
const GREEN="#00d48a",DARK="#0a0e1a",NAVY="#0f1728",BLUE="#3b82f6",AMBER="#f59e0b",RED="#ef4444",PURPLE="#8b5cf6",TEAL="#14b8a6";
const TEXT="#1a202c",MUTED="#64748b",BORDER="#e2e8f0",WHITE="#ffffff",LIGHT="#f8fafc";

const S=StyleSheet.create({
  page:{paddingTop:44,paddingBottom:64,paddingHorizontal:44,fontFamily:"Helvetica",backgroundColor:WHITE,color:TEXT},
  coverPage:{paddingTop:0,paddingBottom:0,paddingHorizontal:0,fontFamily:"Helvetica",backgroundColor:DARK},
  coverTop:{backgroundColor:NAVY,paddingTop:44,paddingBottom:32,paddingHorizontal:44,borderBottomWidth:3,borderBottomColor:GREEN},
  coverLogo:{fontSize:24,fontFamily:"Helvetica-Bold",color:WHITE,letterSpacing:2},
  coverTagline:{fontSize:8,color:GREEN,marginTop:4,letterSpacing:2},
  coverBody:{paddingHorizontal:44,paddingTop:36,paddingBottom:44},
  coverTitle:{fontSize:26,fontFamily:"Helvetica-Bold",color:WHITE,lineHeight:1.25,marginBottom:10},
  coverAccent:{color:GREEN},
  coverMeta:{fontSize:10,color:"#94a3b8",marginTop:4},
  coverAdvisor:{marginTop:28,padding:16,backgroundColor:"#111827",borderWidth:1,borderColor:"#1e3a2f",borderRadius:4},
  coverAdvisorName:{fontSize:12,fontFamily:"Helvetica-Bold",color:WHITE},
  coverAdvisorTitle:{fontSize:9,color:GREEN,marginTop:3},
  coverDivider:{height:1,backgroundColor:"#1e2d45",marginTop:28,marginBottom:28,width:260},
  coverStatRow:{flexDirection:"row",gap:10,marginTop:4},
  coverStat:{paddingTop:10,paddingBottom:10,paddingLeft:14,paddingRight:14,backgroundColor:"#111827",borderWidth:1,borderColor:"#1e2d45",borderRadius:4,minWidth:90},
  coverStatValue:{fontSize:14,fontFamily:"Helvetica-Bold",marginBottom:2},
  coverStatLabel:{fontSize:7.5,color:"#94a3b8"},
  coverFooterBar:{marginTop:32,paddingTop:12,borderTopWidth:1,borderTopColor:"#1e2d45",flexDirection:"row",justifyContent:"space-between"},
  coverFooterText:{fontSize:8,color:"#64748b"},
  pageHeader:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",marginBottom:20,paddingBottom:10,borderBottomWidth:1,borderBottomColor:GREEN},
  pageHeaderBrand:{fontSize:9,fontFamily:"Helvetica-Bold",color:DARK},
  pageHeaderSub:{fontSize:8,color:MUTED,marginTop:1},
  pageHeaderRight:{fontSize:8,fontFamily:"Helvetica-Bold",color:GREEN},
  pageFooter:{marginTop:24,paddingTop:8,borderTopWidth:1,borderTopColor:BORDER,flexDirection:"row",justifyContent:"space-between"},
  pageFooterText:{fontSize:7.5,color:MUTED},
  h1:{fontSize:17,fontFamily:"Helvetica-Bold",color:DARK,marginBottom:4},
  h2:{fontSize:12,fontFamily:"Helvetica-Bold",color:DARK,marginBottom:8,marginTop:18},
  h3:{fontSize:10,fontFamily:"Helvetica-Bold",color:DARK,marginBottom:5},
  body:{fontSize:9.5,lineHeight:1.55,color:TEXT},
  small:{fontSize:8,color:MUTED,lineHeight:1.4},
  label:{fontSize:7.5,fontFamily:"Helvetica-Bold",color:MUTED,letterSpacing:1},
  statRow:{flexDirection:"row",gap:8,marginBottom:14},
  statCard:{flex:1,backgroundColor:LIGHT,borderWidth:1,borderColor:BORDER,borderRadius:4,paddingTop:10,paddingBottom:10,paddingLeft:12,paddingRight:12,alignItems:"center"},
  statValue:{fontSize:15,fontFamily:"Helvetica-Bold",marginBottom:2},
  statLabel:{fontSize:7,color:MUTED,letterSpacing:0.5},
  tableHeader:{backgroundColor:NAVY,flexDirection:"row",paddingTop:7,paddingBottom:7,paddingLeft:12,paddingRight:12},
  tableHeaderText:{fontSize:8,fontFamily:"Helvetica-Bold",color:WHITE},
  tableRow:{flexDirection:"row",paddingTop:6,paddingBottom:6,paddingLeft:12,paddingRight:12,borderBottomWidth:1,borderBottomColor:BORDER,alignItems:"center"},
  tableRowAlt:{backgroundColor:LIGHT},
  chartBox:{borderWidth:1,borderColor:BORDER,borderRadius:4,paddingTop:12,paddingBottom:12,paddingLeft:12,paddingRight:12,marginBottom:10},
  chartTitle:{fontSize:9.5,fontFamily:"Helvetica-Bold",color:DARK,marginBottom:3},
  chartRow:{flexDirection:"row",alignItems:"center",marginBottom:5},
  chartLabel:{fontSize:8,color:MUTED,width:115},
  chartBarBg:{flex:1,height:9,backgroundColor:"#f1f5f9",borderRadius:2},
  chartBarFill:{height:9,borderRadius:2},
  chartValue:{fontSize:8,color:TEXT,fontFamily:"Helvetica-Bold",width:46,textAlign:"right"},
  savingsTable:{borderWidth:1,borderColor:BORDER,borderRadius:4,marginBottom:14},
  savingsRow:{flexDirection:"row",paddingTop:6,paddingBottom:6,paddingLeft:12,paddingRight:12,borderBottomWidth:1,borderBottomColor:BORDER,alignItems:"center"},
  savingsTitle:{flex:1,fontSize:8.5,color:TEXT},
  savingsAmt:{fontSize:9,fontFamily:"Helvetica-Bold",color:GREEN,width:72,textAlign:"right"},
  savingsTotal:{flexDirection:"row",paddingTop:8,paddingBottom:8,paddingLeft:12,paddingRight:12,backgroundColor:"#ecfdf5",alignItems:"center"},
  savingsTotalLabel:{flex:1,fontSize:9,fontFamily:"Helvetica-Bold",color:DARK},
  savingsTotalAmt:{fontSize:11,fontFamily:"Helvetica-Bold",color:GREEN,width:72,textAlign:"right"},
  secBand:{backgroundColor:NAVY,paddingTop:12,paddingBottom:12,paddingLeft:44,paddingRight:44,marginTop:0,marginBottom:14,marginLeft:-44,marginRight:-44},
  secBandNum:{fontSize:7.5,color:GREEN,fontFamily:"Helvetica-Bold",letterSpacing:1.5,marginBottom:2},
  secBandTitle:{fontSize:14,fontFamily:"Helvetica-Bold",color:WHITE},
  secBandDesc:{fontSize:8.5,color:"#94a3b8",marginTop:3},
  recCard:{marginBottom:12,borderWidth:1,borderColor:BORDER,borderRadius:4},
  recHeaderRow:{flexDirection:"row",alignItems:"flex-start",paddingTop:10,paddingBottom:10,paddingLeft:12,paddingRight:12,gap:8,borderBottomWidth:1,borderBottomColor:BORDER},
  recTitleBlock:{flex:1},
  recTitle:{fontSize:10,fontFamily:"Helvetica-Bold",color:DARK,lineHeight:1.3},
  recSavings:{fontSize:8,color:GREEN,fontFamily:"Helvetica-Bold",marginTop:2},
  recBody:{paddingTop:10,paddingBottom:10,paddingLeft:12,paddingRight:12},
  recDetail:{fontSize:9,color:MUTED,lineHeight:1.5,marginBottom:8},
  ctxBox:{backgroundColor:"#f0fdf4",borderWidth:1,borderColor:"#86efac",borderRadius:3,paddingTop:7,paddingBottom:7,paddingLeft:10,paddingRight:10,marginBottom:8},
  ctxLabel:{fontSize:7,fontFamily:"Helvetica-Bold",color:"#16a34a",letterSpacing:0.8,marginBottom:2},
  ctxText:{fontSize:9,color:"#15803d",lineHeight:1.5},
  stepsLabel:{fontSize:7.5,fontFamily:"Helvetica-Bold",color:MUTED,letterSpacing:0.8,marginBottom:5},
  stepRow:{flexDirection:"row",gap:7,marginBottom:4,alignItems:"flex-start"},
  stepNum:{width:16,height:16,backgroundColor:"#ecfdf5",borderWidth:1,borderColor:GREEN,borderRadius:8,alignItems:"center",justifyContent:"center"},
  stepNumText:{fontSize:7,fontFamily:"Helvetica-Bold",color:GREEN},
  stepText:{flex:1,fontSize:8.5,color:TEXT,lineHeight:1.5},
  warnBox:{backgroundColor:"#fffbeb",borderWidth:1,borderColor:"#fcd34d",borderRadius:3,paddingTop:6,paddingBottom:6,paddingLeft:10,paddingRight:10,marginBottom:8},
  warnLabel:{fontSize:7,fontFamily:"Helvetica-Bold",color:"#92400e",letterSpacing:0.8,marginBottom:2},
  warnText:{fontSize:8.5,color:"#78350f",lineHeight:1.4},
  educBox:{backgroundColor:LIGHT,borderWidth:1,borderColor:BORDER,borderRadius:3,paddingTop:7,paddingBottom:7,paddingLeft:10,paddingRight:10},
  educLabel:{fontSize:7,fontFamily:"Helvetica-Bold",color:MUTED,letterSpacing:0.8,marginBottom:3},
  educText:{fontSize:8.5,color:MUTED,lineHeight:1.55},
  roadmapCol:{flex:1},
  roadmapColHeader:{paddingTop:8,paddingBottom:8,paddingLeft:12,paddingRight:12,marginBottom:8,borderRadius:4,borderLeftWidth:3},
  roadmapColHeaderTitle:{fontSize:9,fontFamily:"Helvetica-Bold",color:WHITE},
  roadmapColHeaderSub:{fontSize:8,color:"#94a3b8",marginTop:2},
  roadmapItem:{flexDirection:"row",gap:7,marginBottom:8,alignItems:"flex-start"},
  roadmapNumCircle:{width:18,height:18,borderRadius:9,alignItems:"center",justifyContent:"center"},
  roadmapNumText:{fontSize:8,fontFamily:"Helvetica-Bold",color:WHITE},
  roadmapText:{flex:1,fontSize:8.5,color:TEXT,lineHeight:1.5,borderWidth:1,borderColor:BORDER,borderRadius:3,paddingTop:6,paddingBottom:6,paddingLeft:8,paddingRight:8,backgroundColor:LIGHT},
  discBox:{backgroundColor:LIGHT,borderWidth:1,borderColor:BORDER,borderRadius:4,paddingTop:14,paddingBottom:14,paddingLeft:14,paddingRight:14},
  discLabel:{fontSize:7.5,fontFamily:"Helvetica-Bold",color:MUTED,letterSpacing:0.8,marginBottom:5},
  discText:{fontSize:8.5,color:MUTED,lineHeight:1.55,marginBottom:12},
  firmBox:{marginTop:14,paddingTop:12,paddingBottom:12,paddingLeft:14,paddingRight:14,backgroundColor:NAVY,borderRadius:4},
});

// All text uses only ASCII/Latin-1 safe chars - no em-dashes, (R), copyright symbols
function fmt(n:number){return"$"+Math.round(n).toLocaleString();}
function fmtK(n:number){return n>=1000000?"$"+(n/1000000).toFixed(1)+"M":n>=1000?"$"+(n/1000).toFixed(0)+"k":"$"+n;}
function pctOf(v:number,total:number){return total>0?Math.round((v/total)*100):0;}

function PriorityBadge({p}:{p:"high"|"medium"|"low"}){
  const c={high:{bg:"#fee2e2",fg:"#991b1b",lbl:"HIGH PRIORITY"},medium:{bg:"#fef3c7",fg:"#92400e",lbl:"MED PRIORITY"},low:{bg:"#dbeafe",fg:"#1e40af",lbl:"LOW PRIORITY"}}[p];
  return<View style={{backgroundColor:c.bg,borderRadius:3,paddingTop:2,paddingBottom:2,paddingLeft:6,paddingRight:6,alignSelf:"flex-start"}}><Text style={{fontSize:7,fontFamily:"Helvetica-Bold",color:c.fg,letterSpacing:0.5}}>{c.lbl}</Text></View>;
}

function NativeBar({data,colors}:{data:{name:string;value:number}[];colors:Record<string,string>}){
  const max=Math.max(...data.map(d=>d.value),1);
  return(
    <View>
      {data.map((d,i)=>(
        <View key={i} style={S.chartRow}>
          <Text style={S.chartLabel}>{d.name}</Text>
          <View style={S.chartBarBg}>
            <View style={[S.chartBarFill,{width:String(pctOf(d.value,max))+"%" as any,backgroundColor:colors[d.name]??GREEN}]}/>
          </View>
          <Text style={S.chartValue}>{fmtK(d.value)}</Text>
        </View>
      ))}
    </View>
  );
}

function PageHdr({sub,client}:{sub:string;client:string}){
  return(
    <View style={S.pageHeader}>
      <View>
        <Text style={S.pageHeaderBrand}>ACUITY Financial Planning</Text>
        <Text style={S.pageHeaderSub}>{sub}</Text>
      </View>
      <Text style={S.pageHeaderRight}>{client}</Text>
    </View>
  );
}

function PageFtr({pg,total,date}:{pg:number;total:number;date:string}){
  return(
    <View style={S.pageFooter}>
      <Text style={S.pageFooterText}>Confidential - Prepared by Margaret Chen, CPA, CFP(R) - Acuity Financial Planning</Text>
      <Text style={S.pageFooterText}>{date} - Page {pg} of {total}</Text>
    </View>
  );
}

function RecCard({item}:{item:any}){
  const educ:string=item.education??("" as string);
  const educShort=educ.split("\n\n").slice(0,2).join("\n\n").replace(/\uFFFD/g,"-");
  return(
    <View style={S.recCard}>
      <View style={S.recHeaderRow}>
        <PriorityBadge p={item.priority}/>
        <View style={S.recTitleBlock}>
          <Text style={S.recTitle}>{item.title}</Text>
          {item.savingsEstimate>0&&(
            <Text style={S.recSavings}>~{fmt(item.savingsEstimate)} estimated annual savings</Text>
          )}
        </View>
      </View>
      <View style={S.recBody}>
        {!!item.detail&&<Text style={S.recDetail}>{String(item.detail).replace(/\uFFFD/g,"-")}</Text>}
        {!!item.context&&(
          <View style={S.ctxBox}>
            <Text style={S.ctxLabel}>YOUR SITUATION</Text>
            <Text style={S.ctxText}>{String(item.context).replace(/\uFFFD/g,"-")}</Text>
          </View>
        )}
        {item.steps&&item.steps.length>0&&(
          <View style={{marginBottom:8}}>
            <Text style={S.stepsLabel}>HOW TO DO IT</Text>
            {(item.steps as string[]).map((step,i)=>(
              <View key={i} style={S.stepRow}>
                <View style={S.stepNum}><Text style={S.stepNumText}>{i+1}</Text></View>
                <Text style={S.stepText}>{step.replace(/\uFFFD/g,"-")}</Text>
              </View>
            ))}
          </View>
        )}
        {!!item.warning&&(
          <View style={S.warnBox}>
            <Text style={S.warnLabel}>COMMON MISTAKE TO AVOID</Text>
            <Text style={S.warnText}>{String(item.warning).replace(/\uFFFD/g,"-")}</Text>
          </View>
        )}
        {!!educShort&&(
          <View style={S.educBox}>
            <Text style={S.educLabel}>HOW THIS WORKS</Text>
            <Text style={S.educText}>{educShort}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default function RecommendationsPdfDocument({input,result}:{input:WizardInput;result:RecommendationsResult}){
  const yr=new Date().getFullYear();
  const date=new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"});
  const filing=input.filingStatus.replace(/_/g," ").replace(/\b\w/g,(c:string)=>c.toUpperCase());
  const client=filing+", Age "+input.age+(input.state?", "+input.state:"");
  const PAGES=9;

  const income=result.summary.totalAnnualIncome;
  const margPct=result.summary.marginalFederalBracketPct;
  const effPct=result.summary.effectiveFederalRatePct;
  const estTax=Math.round(income*(effPct/100));
  const takeHome=Math.max(0,income-estTax);

  const ACCT_COLORS:Record<string,string>={"Traditional 401k/IRA":GREEN,"Roth":BLUE,"Taxable Brokerage":AMBER,"HSA":PURPLE,"Cash":RED,"Other Assets":"#60a5fa"};
  const INCOME_COLORS:Record<string,string>={"Gross Income":BLUE,"Est. Federal Tax":RED,"Take-Home":GREEN};

  const allocData=[
    {name:"Traditional 401k/IRA",value:input.balances.traditional401kIra},
    {name:"Roth",value:input.balances.rothIraOr401k},
    {name:"Taxable Brokerage",value:input.balances.taxableBrokerage},
    {name:"HSA",value:input.balances.hsaBalance},
    {name:"Cash",value:input.balances.cashSavings},
    {name:"Other Assets",value:input.balances.otherAssets},
  ].filter(d=>d.value>0);

  const incomeData=[
    {name:"Gross Income",value:income},
    {name:"Est. Federal Tax",value:estTax},
    {name:"Take-Home",value:takeHome},
  ].filter(d=>d.value>0);

  const allItems=[...result.assetLocation,...result.withdrawalSequencing,...(result.retirementStrategy||[]),...result.deductionsCredits,...result.entityStructuring];
  const savingsItems=allItems.filter(i=>(i.savingsEstimate??0)>0).sort((a,b)=>(b.savingsEstimate||0)-(a.savingsEstimate||0));
  const totalSavings=savingsItems.reduce((s,i)=>s+(i.savingsEstimate||0),0);


  const currentAge=input.age||35;
  const totalPortfolio=(input.balances?.traditional401kIra||0)+(input.balances?.rothIraOr401k||0)+(input.balances?.taxableBrokerage||0)+(input.balances?.hsaBalance||0)+(input.balances?.cashSavings||0);
  const annualContribs=(input.contributions?.traditional401kAnnual||0)+(input.contributions?.rothAnnual||0)+(input.contributions?.taxableAnnual||0)+(input.contributions?.hsaAnnual||0);
  const growthRate=((input.income?.expectedAnnualGrowthPct||7))/100;
  const annualExpenses=Math.round(income*0.8);
  const desiredMonthly=input.goals?.desiredMonthlyRetirementIncome||0;
  const desiredExpenses=desiredMonthly>0?desiredMonthly*12:0;
  const fiTarget=desiredExpenses>0?desiredExpenses*25:annualExpenses*25;
  const fiTargetThumb=annualExpenses*25;
  const fiTargetDesired=desiredExpenses>0?desiredExpenses*25:null;
  const preferredRetAge=input.goals?.earlyRetirement&&input.goals?.targetRetirementAge?input.goals.targetRetirementAge:null;
  const stdRetAge=67;
  const projPort=(years:number)=>{let port=totalPortfolio;for(let i=0;i<years;i++)port=port*(1+growthRate)+annualContribs;return Math.round(port);};
  const findReadyAgeByTarget=(target:number):number|null=>{if(target<=0||totalPortfolio<=0)return null;for(let age=currentAge;age<=85;age++){if(projPort(age-currentAge)>=target)return age;}return null;};
  let readyAge:number|null=findReadyAgeByTarget(fiTarget);
  const milestoneAges=[...new Set([currentAge+5,50,55,60,preferredRetAge,readyAge,stdRetAge,70].filter((a):a is number=>!!a&&a>currentAge&&a<=80))].sort((a,b)=>a-b);
  const fmtM=(n:number)=>n>=1000000?"$"+(n/1000000).toFixed(1)+"M":n>=1000?"$"+(n/1000).toFixed(0)+"k":"$"+n;
  const SECS=[
    {num:"01",title:"Asset Location & Tax-Loss Harvesting",desc:"Optimize where you hold each investment and reduce annual tax drag.",items:result.assetLocation,color:GREEN},
    {num:"02",title:"Retirement & Withdrawal Sequencing",desc:"Maximize what you keep in retirement through optimal withdrawal order and Roth strategy.",items:result.withdrawalSequencing,color:BLUE},
    {num:"03",title:"Retirement Strategy",desc:"Social Security timing, sustainable withdrawal rates, healthcare bridge, and longevity planning.",items:result.retirementStrategy||[],color:TEAL},
    {num:"04",title:"Deductions, Credits & Contributions",desc:"Maximize every legal deduction and ensure no contribution room goes unused.",items:result.deductionsCredits,color:AMBER},
    {num:"05",title:"Business & Self-Employment Tax Strategy",desc:"Reduce self-employment tax and optimize your business structure.",items:result.entityStructuring,color:PURPLE},
  ];
  const thisYear=result.roadmap.filter(r=>r.timeframe==="this_year");
  const futureYrs=result.roadmap.filter(r=>r.timeframe==="future_years");

  return(
    <Document title={"Financial Plan - "+client} author="Acuity Financial Planning" subject="Personalized Tax-Efficient Financial Plan">

      {/* COVER */}
      <Page size="LETTER" style={S.coverPage}>
        <View style={S.coverTop}>
          <Text style={S.coverLogo}>ACUITY</Text>
          <Text style={S.coverTagline}>AI-POWERED TAX AND WEALTH PLANNING</Text>
        </View>
        <View style={S.coverBody}>
          <Text style={{fontSize:9,color:GREEN,fontFamily:"Helvetica-Bold",letterSpacing:2,marginBottom:10}}>PERSONALIZED FINANCIAL PLAN</Text>
          <Text style={S.coverTitle}>Tax-Efficient{"\n"}<Text style={S.coverAccent}>Financial Strategy</Text>{"\n"}and Action Plan</Text>
          <Text style={{...S.coverMeta,marginTop:10}}>Prepared for: {client}</Text>
          <Text style={S.coverMeta}>Tax Year: {yr}</Text>
          <Text style={S.coverMeta}>Report Date: {date}</Text>
          <View style={S.coverDivider}/>
          <View style={S.coverAdvisor}>
            <Text style={S.coverAdvisorName}>Margaret Chen, CPA, CFP(R), PFS</Text>
            <Text style={S.coverAdvisorTitle}>Senior Financial Advisor - Acuity Financial Planning</Text>
            <Text style={{fontSize:9,color:"#94a3b8",marginTop:6}}>28 years experience in private wealth management,{"\n"}tax planning, and retirement income strategy.</Text>
          </View>
          <View style={S.coverStatRow}>
            {([{v:fmt(result.summary.totalNetWorth),l:"Net Worth",c:GREEN},{v:fmt(income),l:"Annual Income",c:BLUE},{v:margPct+"%",l:"Tax Bracket",c:AMBER},{v:effPct.toFixed(1)+"%",l:"Effective Rate",c:PURPLE}] as any[]).map((s,i)=>(
              <View key={i} style={S.coverStat}>
                <Text style={[S.coverStatValue,{color:s.c}]}>{s.v}</Text>
                <Text style={S.coverStatLabel}>{s.l}</Text>
              </View>
            ))}
          </View>
          <View style={S.coverFooterBar}>
            <Text style={S.coverFooterText}>CONFIDENTIAL - Prepared exclusively for the named recipient</Text>
            <Text style={S.coverFooterText}>(c) {yr} Acuity Financial Planning</Text>
          </View>
        </View>
      </Page>

      {/* PAGE 2: EXECUTIVE SUMMARY */}
      <Page size="LETTER" style={S.page}>
        <PageHdr sub="Executive Summary" client={client}/>
        <Text style={S.h1}>Executive Summary</Text>
        <Text style={{...S.body,marginBottom:14}}>This report provides a comprehensive, personalized tax-efficiency and wealth-building plan based on your {yr} financial profile. It was prepared by Margaret Chen, CPA, CFP(R) using your income, account balances, goals, and deduction inputs. All federal tax estimates use {yr} IRS data. Educational estimates only - consult a licensed tax professional before acting.</Text>
        <View style={S.statRow}>
          {([{v:fmt(result.summary.totalNetWorth),l:"Total Net Worth",c:GREEN},{v:fmt(income),l:"Annual Income",c:BLUE},{v:margPct+"%",l:"Marginal Bracket",c:AMBER},{v:effPct.toFixed(1)+"%",l:"Effective Rate",c:PURPLE}] as any[]).map((s,i)=>(
            <View key={i} style={S.statCard}><Text style={[S.statValue,{color:s.c}]}>{s.v}</Text><Text style={S.statLabel}>{s.l}</Text></View>
          ))}
        </View>
        <Text style={S.h2}>Your {yr} Federal Tax Profile</Text>
        <View style={{borderWidth:1,borderColor:BORDER,borderRadius:4,marginBottom:14}}>
          <View style={S.tableHeader}>
            <Text style={[S.tableHeaderText,{flex:1}]}>Item</Text>
            <Text style={[S.tableHeaderText,{width:110,textAlign:"right"}]}>Amount</Text>
          </View>
          {([
            {l:"Total Gross Income",v:fmt(income),bold:true},
            {l:"Filing Status",v:filing,bold:false},
            {l:"State of Residence",v:input.state||"Not specified",bold:false},
            {l:"Estimated Federal Tax",v:fmt(estTax),bold:false},
            {l:"Marginal Federal Bracket",v:margPct+"%",bold:true},
            {l:"Effective Federal Rate",v:effPct.toFixed(1)+"%",bold:false},
            {l:"Estimated Take-Home",v:fmt(takeHome),bold:true},
          ] as any[]).map((r,i)=>(
            <View key={i} style={[S.tableRow,i%2===1?S.tableRowAlt:{}]}>
              <Text style={{flex:1,fontSize:9,color:TEXT,fontFamily:r.bold?"Helvetica-Bold":"Helvetica"}}>{r.l}</Text>
              <Text style={{fontSize:9,color:r.bold?DARK:MUTED,fontFamily:r.bold?"Helvetica-Bold":"Helvetica",width:110,textAlign:"right"}}>{r.v}</Text>
            </View>
          ))}
        </View>
        <Text style={S.h2}>Account Balances and Net Worth</Text>
        <View style={{borderWidth:1,borderColor:BORDER,borderRadius:4,marginBottom:8}}>
          <View style={S.tableHeader}>
            <Text style={[S.tableHeaderText,{flex:1}]}>Account Type</Text>
            <Text style={[S.tableHeaderText,{width:100,textAlign:"right"}]}>Balance</Text>
          </View>
          {([
            {l:"Traditional 401(k) / IRA",v:input.balances.traditional401kIra,c:GREEN},
            {l:"Roth IRA / Roth 401(k)",v:input.balances.rothIraOr401k,c:BLUE},
            {l:"Taxable Brokerage",v:input.balances.taxableBrokerage,c:AMBER},
            {l:"Health Savings Account",v:input.balances.hsaBalance,c:PURPLE},
            {l:"Cash / Emergency Fund",v:input.balances.cashSavings,c:RED},
            {l:"Other Assets",v:input.balances.otherAssets,c:MUTED},
          ] as any[]).filter((r:any)=>r.v>0).map((r:any,i:number)=>(
            <View key={i} style={[S.tableRow,i%2===1?S.tableRowAlt:{}]}>
              <View style={{width:8,height:8,borderRadius:4,backgroundColor:r.c,marginRight:8}}/>
              <Text style={{flex:1,fontSize:9,color:TEXT}}>{r.l}</Text>
              <Text style={{fontSize:9,fontFamily:"Helvetica-Bold",color:DARK,width:100,textAlign:"right"}}>{fmt(r.v)}</Text>
            </View>
          ))}
          {input.balances.liabilities>0&&(
            <View style={[S.tableRow,{backgroundColor:"#fff1f2"}]}>
              <View style={{width:8,height:8,borderRadius:4,backgroundColor:RED,marginRight:8}}/>
              <Text style={{flex:1,fontSize:9,color:TEXT}}>Total Liabilities</Text>
              <Text style={{fontSize:9,fontFamily:"Helvetica-Bold",color:RED,width:100,textAlign:"right"}}>-{fmt(input.balances.liabilities)}</Text>
            </View>
          )}
          <View style={{...S.tableRow,backgroundColor:"#f0fdf4"}}>
            <Text style={{flex:1,fontSize:9.5,fontFamily:"Helvetica-Bold",color:DARK}}>Total Net Worth</Text>
            <Text style={{fontSize:10,fontFamily:"Helvetica-Bold",color:GREEN,width:100,textAlign:"right"}}>{fmt(result.summary.totalNetWorth)}</Text>
          </View>
        </View>
        <PageFtr pg={2} total={PAGES} date={date}/>
      </Page>

      {/* PAGE 3: CHARTS + SAVINGS */}
      <Page size="LETTER" style={S.page}>
        <PageHdr sub="Portfolio Overview and Potential Savings" client={client}/>
        <Text style={S.h1}>Portfolio Overview</Text>
        <View style={{flexDirection:"row",gap:12,marginBottom:12}}>
          {allocData.length>0&&(
            <View style={[S.chartBox,{flex:1}]}>
              <Text style={S.chartTitle}>Account Allocation</Text>
              <Text style={{...S.small,marginBottom:8}}>Balance by account type</Text>
              <NativeBar data={allocData} colors={ACCT_COLORS}/>
            </View>
          )}
          <View style={[S.chartBox,{flex:1}]}>
            <Text style={S.chartTitle}>Income vs. Tax ({yr})</Text>
            <Text style={{...S.small,marginBottom:8}}>Estimated federal breakdown</Text>
            <NativeBar data={incomeData} colors={INCOME_COLORS}/>
            <View style={{marginTop:10,paddingTop:8,paddingBottom:8,paddingLeft:10,paddingRight:10,backgroundColor:"#f0fdf4",borderRadius:3}}>
              <Text style={{fontSize:8.5,color:"#15803d",lineHeight:1.5}}>You pay {effPct.toFixed(1)}% effective rate on {fmt(income)} of gross income. At your {margPct}% marginal bracket, each additional dollar of income costs {margPct} cents in federal taxes.</Text>
            </View>
          </View>
        </View>
        <View style={{flexDirection:"row",gap:12,marginBottom:12}}>
          <View style={[S.chartBox,{flex:1}]}>
            <Text style={S.chartTitle}>Financial Goals</Text>
            {([
              {l:"Risk Tolerance",v:input.goals?.riskTolerance??("Not specified")},
              {l:"Tax Priority",v:(input.goals?.taxPriority??("Not specified")).replace(/_/g," ")},
              {l:"Emergency Fund",v:input.goals?.hasEmergencyFund?"Yes":"No"},
              {l:"High-Interest Debt",v:input.goals?.hasHighInterestDebt?"Yes":"No"},
              {l:"Home Purchase",v:input.goals?.buyingHome?"Yes":"No"},
              {l:"Early Retirement",v:input.goals?.earlyRetirement?("Age "+(input.goals.targetRetirementAge??"TBD")):"No"},
              {l:"College Funding",v:input.goals?.collegeFunding?"Yes":"No"},
              {l:"Estate/Legacy",v:input.goals?.estateAndLegacy?"Yes":"No"},
            ] as any[]).map((r:any,i:number)=>(
              <View key={i} style={{flexDirection:"row",justifyContent:"space-between",paddingTop:4,paddingBottom:4,borderBottomWidth:1,borderBottomColor:BORDER}}>
                <Text style={{fontSize:8.5,color:MUTED}}>{r.l}</Text>
                <Text style={{fontSize:8.5,color:TEXT,fontFamily:"Helvetica-Bold"}}>{r.v}</Text>
              </View>
            ))}
          </View>
          <View style={[S.chartBox,{flex:1}]}>
            <Text style={S.chartTitle}>Annual Contributions</Text>
            {([
              {l:"Traditional 401(k)",v:fmt(input.contributions?.traditional401kAnnual??0)},
              {l:"Roth IRA/401(k)",v:fmt(input.contributions?.rothAnnual??0)},
              {l:"Health Savings Account",v:fmt(input.contributions?.hsaAnnual??0)},
              {l:"Taxable Brokerage",v:fmt(input.contributions?.taxableAnnual??0)},
              {l:"Employer Match",v:(input.contributions?.employerMatchPct??0)>0?(input.contributions.employerMatchPct+"% match"):"None/Not provided"},
              {l:"Roth 401(k) Option",v:input.contributions?.hasRoth401kOption?"Available":"Not available"},
              {l:"Mega Backdoor Roth",v:input.contributions?.hasAfterTax401kOption?"Available":"Not available"},
            ] as any[]).map((r:any,i:number)=>(
              <View key={i} style={{flexDirection:"row",justifyContent:"space-between",paddingTop:4,paddingBottom:4,borderBottomWidth:1,borderBottomColor:BORDER}}>
                <Text style={{fontSize:8.5,color:MUTED,flex:1,marginRight:6}}>{r.l}</Text>
                <Text style={{fontSize:8.5,color:TEXT,fontFamily:"Helvetica-Bold"}}>{r.v}</Text>
              </View>
            ))}
          </View>
        </View>
        {totalSavings>0&&(
          <View>
            <Text style={[S.h2,{color:GREEN,marginTop:4}]}>Potential Annual Tax Savings Identified: {fmt(totalSavings)}</Text>
            <View style={S.savingsTable}>
              <View style={S.tableHeader}>
                <Text style={[S.tableHeaderText,{flex:1}]}>Recommendation</Text>
                <Text style={[S.tableHeaderText,{width:80,textAlign:"right"}]}>Est. Annual Savings</Text>
              </View>
              {savingsItems.map((item,i)=>(
                <View key={i} style={[S.savingsRow,i%2===1?{backgroundColor:LIGHT}:{}]}>
                  <Text style={S.savingsTitle}>{item.title}</Text>
                  <Text style={S.savingsAmt}>~{fmt(item.savingsEstimate||0)}</Text>
                </View>
              ))}
              <View style={S.savingsTotal}>
                <Text style={S.savingsTotalLabel}>Total Estimated Annual Tax Savings</Text>
                <Text style={S.savingsTotalAmt}>~{fmt(totalSavings)}</Text>
              </View>
            </View>
            <Text style={{...S.small,marginBottom:4}}>* Estimates are illustrative. Actual savings depend on full implementation and your specific tax situation.</Text>
          </View>
        )}
        <PageFtr pg={3} total={PAGES} date={date}/>
      </Page>

      
      {/* PAGE 4: RETIREMENT READINESS */}
      {totalPortfolio>0&&income>0&&(
      <Page size="LETTER" style={S.page}>
        <PageHdr sub="Retirement Readiness Projection" client={client}/>
        <Text style={S.h1}>Retirement Readiness Projection</Text>
        <Text style={{...S.small,marginBottom:12}}>Projected growth at {Math.round(growthRate*100)}% annual return with {fmtM(annualContribs)}/yr contributions. Financial Independence target: {fmtM(fiTarget)} (annual expenses x 25 using the 4% safe withdrawal rule).</Text>
        <View style={{flexDirection:"row",gap:10,marginBottom:14}}>
          {preferredRetAge&&(<View style={{flex:1,paddingTop:10,paddingBottom:10,paddingLeft:12,paddingRight:12,borderWidth:1,borderColor:AMBER+"66",borderRadius:4,backgroundColor:AMBER+"0d"}}>
            <Text style={{fontSize:7,fontFamily:"Helvetica-Bold",color:AMBER,textTransform:"uppercase",letterSpacing:0.8,marginBottom:3}}>PREFERRED RETIREMENT</Text>
            <Text style={{fontSize:16,fontFamily:"Helvetica-Bold",color:AMBER,lineHeight:1,marginBottom:2}}>Age {preferredRetAge}</Text>
            <Text style={{fontSize:8,color:MUTED,marginBottom:5}}>{preferredRetAge-currentAge} years away</Text>
            <Text style={{fontSize:10,fontFamily:"Helvetica-Bold",color:projPort(preferredRetAge-currentAge)>=fiTarget?GREEN:RED}}>{fmtM(projPort(preferredRetAge-currentAge))}</Text>
            <Text style={{fontSize:8,color:MUTED}}>{Math.round((projPort(preferredRetAge-currentAge)/Math.max(1,fiTarget))*100)}% of goal</Text>
            {projPort(preferredRetAge-currentAge)<fiTarget&&<Text style={{fontSize:7.5,color:RED,marginTop:3}}>{fmtM(fiTarget-projPort(preferredRetAge-currentAge))} short</Text>}
          </View>)}
          {readyAge&&(<View style={{flex:1,paddingTop:10,paddingBottom:10,paddingLeft:12,paddingRight:12,borderWidth:2,borderColor:GREEN+"66",borderRadius:4,backgroundColor:GREEN+"0d"}}>
            <Text style={{fontSize:7,fontFamily:"Helvetica-Bold",color:GREEN,textTransform:"uppercase",letterSpacing:0.8,marginBottom:3}}>WHEN YOU ARE READY</Text>
            <Text style={{fontSize:16,fontFamily:"Helvetica-Bold",color:GREEN,lineHeight:1,marginBottom:2}}>Age {readyAge}</Text>
            <Text style={{fontSize:8,color:MUTED,marginBottom:5}}>{readyAge-currentAge} years away</Text>
            <Text style={{fontSize:10,fontFamily:"Helvetica-Bold",color:GREEN}}>{fmtM(projPort(readyAge-currentAge))}</Text>
            <Text style={{fontSize:8,color:GREEN}}>Goal reached</Text>
          </View>)}
          <View style={{flex:1,paddingTop:10,paddingBottom:10,paddingLeft:12,paddingRight:12,borderWidth:1,borderColor:BLUE+"44",borderRadius:4,backgroundColor:BLUE+"09"}}>
            <Text style={{fontSize:7,fontFamily:"Helvetica-Bold",color:BLUE,textTransform:"uppercase",letterSpacing:0.8,marginBottom:3}}>STANDARD RETIREMENT</Text>
            <Text style={{fontSize:16,fontFamily:"Helvetica-Bold",color:BLUE,lineHeight:1,marginBottom:2}}>Age {stdRetAge}</Text>
            <Text style={{fontSize:8,color:MUTED,marginBottom:5}}>{stdRetAge-currentAge} years away</Text>
            <Text style={{fontSize:10,fontFamily:"Helvetica-Bold",color:projPort(stdRetAge-currentAge)>=fiTarget?GREEN:RED}}>{fmtM(projPort(stdRetAge-currentAge))}</Text>
            <Text style={{fontSize:8,color:MUTED}}>{Math.round((projPort(stdRetAge-currentAge)/Math.max(1,fiTarget))*100)}% of goal</Text>
          </View>
        </View>

        <Text style={[S.h2,{marginTop:4}]}>Portfolio Growth Milestones</Text>
        <View style={{borderWidth:1,borderColor:BORDER,borderRadius:4,marginBottom:12}}>
          <View style={S.tableHeader}>
            <Text style={[S.tableHeaderText,{width:36}]}>Age</Text>
            <Text style={[S.tableHeaderText,{flex:1}]}>Projected Portfolio</Text>
            <Text style={[S.tableHeaderText,{width:60,textAlign:"right"}]}>% of Goal</Text>
          </View>
          {milestoneAges.map((age,i)=>{
            const port=projPort(age-currentAge);
            const pct=Math.min(100,Math.round((port/Math.max(1,fiTarget))*100));
            const tag=age===preferredRetAge?" (Preferred)":age===readyAge?" (Ready)":age===stdRetAge?" (Standard)":"";
            return(<View key={i} style={[S.tableRow,{backgroundColor:age===readyAge?"#f0fdf4":age===preferredRetAge?AMBER+"0a":i%2===1?LIGHT:WHITE,alignItems:"center"}]}>
              <Text style={{fontSize:8.5,fontFamily:tag?"Helvetica-Bold":"Helvetica",color:age===readyAge?GREEN:age===preferredRetAge?AMBER:age===stdRetAge?BLUE:DARK,width:36}}>{age}</Text>
              <View style={{flex:1}}>
                <Text style={{fontSize:9,fontFamily:"Helvetica-Bold",color:port>=fiTarget?GREEN:DARK,marginBottom:2}}>{fmtM(port)}{tag}</Text>
                <View style={{height:5,backgroundColor:"#f1f5f9",borderRadius:2,width:"90%"}}>
                  <View style={{height:5,borderRadius:2,backgroundColor:pct>=100?GREEN:pct>60?AMBER:RED,width:(Math.min(pct,100)+"%") as any}}/>
                </View>
              </View>
              <Text style={{fontSize:8.5,fontFamily:"Helvetica-Bold",color:pct>=100?GREEN:RED,width:60,textAlign:"right"}}>{pct}%</Text>
            </View>);
          })}
        </View>
        <View style={{paddingTop:9,paddingBottom:9,paddingLeft:12,paddingRight:12,backgroundColor:"rgba(0,212,138,0.04)",borderWidth:1,borderColor:"rgba(0,212,138,0.2)",borderRadius:3}}>
          <Text style={{fontSize:8.5,color:TEXT,lineHeight:1.65}}>{readyAge?("Portfolio of "+fmtM(totalPortfolio)+" growing at "+Math.round(growthRate*100)+"% with "+fmtM(annualContribs)+"/yr contributions. "+(fiTargetDesired?"Desired lifestyle scenario (FI target: "+fmtM(fiTargetDesired)+"): ready at age "+(findReadyAgeByTarget?.(fiTargetDesired)||readyAge||"unknown")+". ":"")+"Rule of thumb scenario (FI target: "+fmtM(fiTargetThumb)+"): ready at age "+(findReadyAgeByTarget?.(fiTargetThumb)||"unknown")+"."+(preferredRetAge&&preferredRetAge<(readyAge||99)?" To retire at preferred age "+preferredRetAge+", increase annual contributions by approximately "+fmtM(Math.round((fiTarget-projPort(preferredRetAge-currentAge))/Math.max(1,preferredRetAge-currentAge)))+"/yr.":"")):"At standard retirement age "+stdRetAge+", projected portfolio of "+fmtM(projPort(stdRetAge-currentAge))+" is "+Math.round((projPort(stdRetAge-currentAge)/Math.max(1,fiTarget))*100)+"% of Financial Independence target."}</Text>
        </View>
        <PageFtr pg={4} total={PAGES} date={date}/>
      </Page>
      )}
      {/* PAGES 5-8: RECOMMENDATION SECTIONS */}
      {SECS.map((sec,si)=>(
        <Page key={sec.num} size="LETTER" style={S.page}>
          <PageHdr sub={"Section "+sec.num+" - "+sec.title} client={client}/>
          <View style={[S.secBand,{borderLeftWidth:4,borderLeftColor:sec.color}]}>
            <Text style={S.secBandNum}>SECTION {sec.num}</Text>
            <Text style={S.secBandTitle}>{sec.title}</Text>
            <Text style={S.secBandDesc}>{sec.desc}</Text>
          </View>
          {sec.items.map((item:any,i:number)=>(
            <RecCard key={i} item={item}/>
          ))}
          <PageFtr pg={5+si} total={PAGES} date={date}/>
        </Page>
      ))}

      {/* ROADMAP PAGE */}
      <Page size="LETTER" style={S.page}>
        <PageHdr sub="Action Roadmap" client={client}/>
        <Text style={S.h1}>Your Prioritized Action Roadmap</Text>
        <Text style={{...S.body,marginBottom:16}}>Work through these actions in order of urgency. The "Act This Tax Year" column contains time-sensitive opportunities with December 31st deadlines. The "Future Years" column contains strategic moves to build into your annual planning.</Text>
        <View style={{flexDirection:"row",gap:14}}>
          <View style={S.roadmapCol}>
            <View style={[S.roadmapColHeader,{backgroundColor:NAVY,borderLeftColor:GREEN}]}>
              <Text style={[S.roadmapColHeaderTitle,{color:GREEN}]}>ACT THIS TAX YEAR</Text>
              <Text style={S.roadmapColHeaderSub}>Time-sensitive - December 31st deadlines</Text>
            </View>
            {thisYear.map((r,i)=>(
              <View key={i} style={S.roadmapItem}>
                <View style={[S.roadmapNumCircle,{backgroundColor:GREEN}]}><Text style={S.roadmapNumText}>{i+1}</Text></View>
                <Text style={S.roadmapText}>{r.action.replace(/\uFFFD/g,"-")}</Text>
              </View>
            ))}
          </View>
          <View style={S.roadmapCol}>
            <View style={[S.roadmapColHeader,{backgroundColor:NAVY,borderLeftColor:BLUE}]}>
              <Text style={[S.roadmapColHeaderTitle,{color:BLUE}]}>PLAN FOR FUTURE YEARS</Text>
              <Text style={S.roadmapColHeaderSub}>Ongoing strategy - incorporate into annual review</Text>
            </View>
            {futureYrs.map((r,i)=>(
              <View key={i} style={S.roadmapItem}>
                <View style={[S.roadmapNumCircle,{backgroundColor:BLUE}]}><Text style={S.roadmapNumText}>{i+1}</Text></View>
                <Text style={S.roadmapText}>{r.action.replace(/\uFFFD/g,"-")}</Text>
              </View>
            ))}
          </View>
        </View>
        <PageFtr pg={PAGES-1} total={PAGES} date={date}/>
      </Page>

      {/* DISCLOSURES */}
      <Page size="LETTER" style={S.page}>
        <PageHdr sub="Disclosures and Important Notices" client={client}/>
        <Text style={[S.h1,{marginBottom:16}]}>Important Disclosures</Text>
        <View style={S.discBox}>
          <Text style={S.discLabel}>GENERAL DISCLOSURE</Text>
          <Text style={S.discText}>{result.disclaimer.replace(/\uFFFD/g,"-")}</Text>
          <Text style={S.discLabel}>ABOUT THIS REPORT</Text>
          <Text style={S.discText}>This financial plan was generated by Acuity AI planning engine, using the advisor persona of Margaret Chen, CPA, CFP(R), PFS. Recommendations are based on the financial data you provided and {yr} federal tax law. This report does not constitute individualized legal, tax, or investment advice. All projections are illustrative only.</Text>
          <Text style={S.discLabel}>SCOPE OF ANALYSIS</Text>
          <Text style={S.discText}>This plan covers federal income tax planning only. It does not analyze state and local taxes, estate taxes, gift taxes, Alternative Minimum Tax in detail, Net Investment Income Tax surcharges, Medicare income surcharges, Social Security benefit taxation thresholds, or every phase-out applicable to your situation. A comprehensive review by a licensed CPA or CFP(R) is strongly recommended before implementing any strategy.</Text>
          <Text style={S.discLabel}>CONFIDENTIALITY</Text>
          <Text style={{...S.discText,marginBottom:0}}>This report is prepared exclusively for the individual named on the cover page and is strictly confidential. It may not be distributed or relied upon by any third party without express written consent of Acuity Financial Planning.</Text>
        </View>
        <View style={S.firmBox}>
          <Text style={{fontSize:9,fontFamily:"Helvetica-Bold",color:WHITE,marginBottom:3}}>Acuity Financial Planning</Text>
          <Text style={{fontSize:8,color:"#94a3b8"}}>AI-Powered Tax and Wealth Planning Platform</Text>
          <Text style={{fontSize:8,color:"#94a3b8",marginTop:2}}>Report generated: {date} - {yr} Federal Tax Data</Text>
        </View>
        <PageFtr pg={PAGES} total={PAGES} date={date}/>
      </Page>

    </Document>
  );
}
