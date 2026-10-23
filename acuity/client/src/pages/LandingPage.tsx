import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Button, Stack, Grid, Paper, Fab, Tooltip } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ChatIcon from '@mui/icons-material/Chat';
import ProspectChat from '../components/chat/ProspectChat';

function Eyebrow({ children }: { children: string }) {
  return (
    <Typography sx={{ display:"inline-block",fontSize:"0.7rem",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"#00d48a",bgcolor:"rgba(0,212,138,0.1)",border:"1px solid rgba(0,212,138,0.25)",borderRadius:99,px:1.5,py:0.5,mb:3 }}>
      {children}
    </Typography>
  );
}

function PrimaryBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button size="large" onClick={onClick} endIcon={<ArrowForwardIcon />} sx={{ background:"linear-gradient(135deg,#00d48a,#00b876)",color:"#0a0e1a",fontWeight:800,fontSize:"0.95rem",px:3.5,py:1.5,borderRadius:3,textTransform:"none",boxShadow:"0 0 28px rgba(0,212,138,0.3)","&:hover":{boxShadow:"0 0 44px rgba(0,212,138,0.5)",transform:"translateY(-1px)"},transition:"all 0.2s" }}>
      {label}
    </Button>
  );
}

function GhostBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button size="large" onClick={onClick} variant="outlined" sx={{ borderColor:"#1e2d45",color:"#e2e8f0",fontWeight:600,fontSize:"0.95rem",px:3.5,py:1.5,borderRadius:3,textTransform:"none","&:hover":{borderColor:"#00d48a",color:"#00d48a",bgcolor:"rgba(0,212,138,0.05)"},transition:"all 0.2s" }}>
      {label}
    </Button>
  );
}
function ProductPreview() {
  const items = [
    { label:"Maximize HSA Contributions",tag:"HIGH",color:"#f87171" },
    { label:"Roth Conversion Window",tag:"HIGH",color:"#f87171" },
    { label:"Unused 401(k) Headroom",tag:"MED",color:"#fbbf24" },
    { label:"Itemize vs. Standard Analysis",tag:"MED",color:"#fbbf24" },
  ];
  const yr = new Date().getFullYear();
  return (
    <Box sx={{ "@keyframes float":{"0%,100%":{transform:"translateY(0)"},"50%":{transform:"translateY(-12px)"}},animation:"float 5s ease-in-out infinite" }}>
      <Paper sx={{ bgcolor:"#111827",border:"1px solid #1e2d45",borderRadius:4,p:2.5,width:{xs:"100%",md:420},boxShadow:"0 40px 80px rgba(0,0,0,0.6),0 0 40px rgba(0,212,138,0.08)" }}>
        <Box sx={{ display:"flex",alignItems:"center",gap:1,mb:2 }}>
          <Box sx={{ width:8,height:8,borderRadius:"50%",bgcolor:"#f87171" }} />
          <Box sx={{ width:8,height:8,borderRadius:"50%",bgcolor:"#fbbf24" }} />
          <Box sx={{ width:8,height:8,borderRadius:"50%",bgcolor:"#00d48a" }} />
          <Typography sx={{ ml:1,fontSize:"0.72rem",color:"#8b9bb4" }}>Your Financial Plan  {yr} Tax Data</Typography>
        </Box>
        <Grid container spacing={1.5} sx={{ mb:2 }}>
          {[["$340k","Net Worth"],["$120k","Income"],["22%","Bracket"]].map(([v,l]) => (
            <Grid key={l} size={4}>
              <Box sx={{ bgcolor:"rgba(0,212,138,0.06)",border:"1px solid rgba(0,212,138,0.15)",borderRadius:2,p:1.2,textAlign:"center" }}>
                <Typography sx={{ fontSize:"0.95rem",fontWeight:800,color:"#00d48a" }}>{v}</Typography>
                <Typography sx={{ fontSize:"0.65rem",color:"#8b9bb4" }}>{l}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
        <Box sx={{ display:"flex",alignItems:"center",gap:1,mb:1.5 }}>
          <Box sx={{ width:6,height:6,borderRadius:"50%",bgcolor:"#00d48a",boxShadow:"0 0 8px #00d48a" }} />
          <Typography sx={{ fontSize:"0.72rem",color:"#00d48a",fontWeight:600 }}>AI-Generated  Margaret Chen, CPA CFP</Typography>
        </Box>
        <Stack spacing={1}>
          {items.map((item) => (
            <Box key={item.label} sx={{ display:"flex",alignItems:"center",gap:1.5,bgcolor:"rgba(255,255,255,0.02)",border:"1px solid #1e2d45",borderLeft:`3px solid ${item.color}`,borderRadius:2,px:1.5,py:1 }}>
              <Box sx={{ bgcolor:`${item.color}22`,color:item.color,fontSize:"0.6rem",fontWeight:800,px:0.8,py:0.3,borderRadius:1,flexShrink:0 }}>{item.tag}</Box>
              <Typography sx={{ fontSize:"0.75rem",color:"#e2e8f0" }}>{item.label}</Typography>
            </Box>
          ))}
        </Stack>
        <Box sx={{ mt:2,pt:1.5,borderTop:"1px solid #1e2d45" }}>
          <Typography sx={{ fontSize:"0.68rem",color:"#8b9bb4",mb:1,fontWeight:600,letterSpacing:"0.08em" }}>ACTION ROADMAP  THIS YEAR</Typography>
          {["Max out HSA before Dec 31","Convert $8k to Roth IRA"].map((a) => (
            <Box key={a} sx={{ display:"flex",alignItems:"center",gap:1,mb:0.5 }}>
              <Box sx={{ width:5,height:5,borderRadius:"50%",bgcolor:"#00d48a",flexShrink:0 }} />
              <Typography sx={{ fontSize:"0.72rem",color:"#8b9bb4" }}>{a}</Typography>
            </Box>
          ))}
        </Box>
      </Paper>
    </Box>
  );
}
function HeroSection({ onPrimary, onSecondary }: { onPrimary:()=>void; onSecondary:()=>void }) {
  return (
    <Box sx={{ position:"relative",overflow:"hidden",pt:{xs:10,md:14},pb:{xs:8,md:12} }}>
      <Box sx={{ position:"absolute",top:0,left:0,right:0,height:"70%",background:"radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,212,138,0.14) 0%, transparent 70%)",pointerEvents:"none" }} />
      <Box sx={{ position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(30,45,69,0.35) 1px,transparent 1px),linear-gradient(90deg,rgba(30,45,69,0.35) 1px,transparent 1px)",backgroundSize:"60px 60px",pointerEvents:"none",opacity:0.5 }} />
      <Container maxWidth="lg" sx={{ position:"relative" }}>
        <Grid container spacing={6} sx={{ alignItems:"center" }}>
          <Grid size={{ xs:12,md:6 }}>
            <Eyebrow>AI Tax and Wealth Planning</Eyebrow>
            <Typography variant="h1" sx={{ fontSize:{xs:"2.6rem",md:"3.8rem"},fontWeight:800,letterSpacing:"-0.03em",lineHeight:1.1,mb:2.5 }}>
              Your personal<br/>
              <Box component="span" sx={{ color:"#00d48a" }}>financial advisor.</Box><br/>
              Always on.
            </Typography>
            <Typography sx={{ fontSize:"1.05rem",color:"#8b9bb4",lineHeight:1.7,mb:4,maxWidth:480 }}>
              Get a personalized tax-efficient financial plan in under 60 seconds. Real advice, based on your real numbers.
            </Typography>
            <Stack direction={{ xs:"column",sm:"row" }} spacing={2} sx={{ mb:4 }}>
              <PrimaryBtn label="Build Full Plan" onClick={onPrimary} />
              <GhostBtn label="Quick Free Snapshot" onClick={onSecondary} />
            </Stack>
            <Typography sx={{ fontSize:"0.78rem",color:"#8b9bb4" }}>
              No credit card required. Results in under 60 seconds.
            </Typography>
          </Grid>
          <Grid size={{ xs:12,md:6 }} sx={{ display:"flex",justifyContent:{xs:"center",md:"flex-end"} }}>
            <ProductPreview />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

function MetricStrip() {
  const stats = [
    { value:"$47k+",label:"Average tax savings identified" },
    { value:"< 60s",label:"Time to your personalized plan" },
    { value:"100%",label:"Personalized to your numbers" },
  ];
  return (
    <Container maxWidth="lg" sx={{ py:{xs:6,md:10} }}>
      <Grid container spacing={2}>
        {stats.map((s) => (
          <Grid key={s.label} size={{ xs:12,sm:4 }}>
            <Box sx={{ textAlign:"center",p:4,bgcolor:"rgba(0,212,138,0.04)",border:"1px solid rgba(0,212,138,0.15)",borderRadius:4 }}>
              <Typography sx={{ fontSize:"3rem",fontWeight:900,color:"#00d48a",letterSpacing:"-0.04em",lineHeight:1 }}>{s.value}</Typography>
              <Typography sx={{ mt:1,fontSize:"0.85rem",color:"#8b9bb4" }}>{s.label}</Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
function HowItWorks() {
  const steps = [
    { num:"01", title:"Enter your profile", desc:"Filing status, income, balances, goals. Takes about 2 minutes." },
    { num:"02", title:"AI analyzes your situation", desc:"Your dedicated AI advisor reviews your full financial picture across every tax domain." },
    { num:"03", title:"Get your plan", desc:"A personalized roadmap with prioritized actions, downloadable as a PDF." },
  ];
  return (
    <Box id="how-it-works" sx={{ py:{xs:8,md:12},borderTop:"1px solid #1e2d45" }}>
      <Container maxWidth="lg">
        <Box sx={{ textAlign:"center",mb:8 }}>
          <Eyebrow>How It Works</Eyebrow>
          <Typography variant="h3" sx={{ fontSize:{xs:"2rem",md:"2.8rem"},fontWeight:800,letterSpacing:"-0.02em" }}>Your plan in three steps</Typography>
        </Box>
        <Grid container spacing={3}>
          {steps.map((s) => (
            <Grid key={s.num} size={{ xs:12,md:4 }}>
              <Box sx={{ height:"100%",p:3,bgcolor:"rgba(255,255,255,0.02)",border:"1px solid #1e2d45",borderRadius:3,position:"relative",overflow:"hidden" }}>
                <Box sx={{ position:"absolute",top:0,left:0,right:0,height:2,bgcolor:"rgba(0,212,138,0.4)",borderRadius:"3px 3px 0 0" }} />
                <Box sx={{ width:44,height:44,borderRadius:"50%",bgcolor:"rgba(0,212,138,0.12)",border:"1px solid rgba(0,212,138,0.3)",display:"flex",alignItems:"center",justifyContent:"center",mb:2.5 }}>
                  <Typography sx={{ fontSize:"0.75rem",fontWeight:800,color:"#00d48a" }}>{s.num}</Typography>
                </Box>
                <Typography variant="h6" sx={{ fontWeight:700,mb:1,fontSize:"1rem" }}>{s.title}</Typography>
                <Typography sx={{ fontSize:"0.875rem",color:"#8b9bb4",lineHeight:1.7 }}>{s.desc}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}

function Features() {
  const features = [
    { color:"#00d48a",title:"Asset Location and Tax-Loss Harvesting",desc:"Know exactly which investments belong in which accounts to minimize your lifetime tax drag." },
    { color:"#3b82f6",title:"Retirement Income Sequencing",desc:"Maximize what you keep in retirement with the right withdrawal order and Roth conversion strategy." },
    { color:"#fbbf24",title:"Deduction and Credit Optimization",desc:"Never leave money on the table. We compare standard vs. itemized and find every legitimate deduction." },
    { color:"#a78bfa",title:"Business Entity Structuring",desc:"Self-employed or a business owner? Discover the right entity type and how to minimize self-employment tax." },
  ];
  return (
    <Box id="features" sx={{ py:{xs:8,md:12},borderTop:"1px solid #1e2d45" }}>
      <Container maxWidth="lg">
        <Box sx={{ textAlign:"center",mb:8 }}>
          <Eyebrow>What Acuity Covers</Eyebrow>
          <Typography variant="h3" sx={{ fontSize:{xs:"2rem",md:"2.8rem"},fontWeight:800,letterSpacing:"-0.02em" }}>Every angle of your tax picture</Typography>
          <Typography sx={{ mt:2,color:"#8b9bb4",maxWidth:520,mx:"auto" }}>Most people focus on one area. Acuity looks at all of them and how they interact.</Typography>
        </Box>
        <Grid container spacing={2.5}>
          {features.map((f) => (
            <Grid key={f.title} size={{ xs:12,sm:6 }}>
              <Box sx={{ height:"100%",p:3.5,bgcolor:"#111827",border:"1px solid #1e2d45",borderTop:`3px solid ${f.color}`,borderRadius:3,transition:"transform 0.2s","&:hover":{transform:"translateY(-2px)"} }}>
                <Box sx={{ width:36,height:36,borderRadius:2,bgcolor:`${f.color}18`,display:"flex",alignItems:"center",justifyContent:"center",mb:2 }}>
                  <Box sx={{ width:12,height:12,borderRadius:"50%",bgcolor:f.color }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight:700,mb:1,fontSize:"1rem" }}>{f.title}</Typography>
                <Typography sx={{ fontSize:"0.875rem",color:"#8b9bb4",lineHeight:1.7 }}>{f.desc}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}


function Testimonials() {
  const quotes = [
    { quote:"I had no idea I was leaving over $12,000 on the table every year. Acuity found it in less than a minute.",name:"Sarah K.",title:"Software Engineer, Single Filer" },
    { quote:"Finally something that actually explains the trade-offs between Roth and Traditional in plain English with my actual numbers.",name:"Marcus T.",title:"Small Business Owner" },
    { quote:"The asset location advice alone justified the time. My bonds were in completely the wrong accounts.",name:"Jennifer R.",title:"Married, Early Retirement Goal" },
  ];
  return (
    <Box sx={{ py:{xs:8,md:12},borderTop:"1px solid #1e2d45" }}>
      <Container maxWidth="lg">
        <Box sx={{ textAlign:"center",mb:8 }}>
          <Eyebrow>What People Are Saying</Eyebrow>
          <Typography variant="h3" sx={{ fontSize:{xs:"2rem",md:"2.8rem"},fontWeight:800,letterSpacing:"-0.02em" }}>Real results, real people</Typography>
        </Box>
        <Grid container spacing={3}>
          {quotes.map((q,i) => (
            <Grid key={i} size={{ xs:12,md:4 }}>
              <Box sx={{ height:"100%",p:3.5,bgcolor:"#111827",border:"1px solid #1e2d45",borderRadius:3,transform:i===1?{md:"translateY(16px)"}:"none" }}>
                <Typography sx={{ color:"#00d48a",fontSize:"1rem",mb:2,letterSpacing:2 }}>&#9733;&#9733;&#9733;&#9733;&#9733;</Typography>
                <Typography sx={{ fontSize:"0.9rem",color:"#e2e8f0",lineHeight:1.75,mb:3,fontStyle:"italic" }}>"{q.quote}"</Typography>
                <Box sx={{ borderTop:"1px solid #1e2d45",pt:2 }}>
                  <Typography sx={{ fontWeight:700,fontSize:"0.85rem" }}>{q.name}</Typography>
                  <Typography sx={{ fontSize:"0.75rem",color:"#8b9bb4" }}>{q.title}</Typography>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}

function BottomCTA({ onPrimary, onSecondary }: { onPrimary:()=>void; onSecondary:()=>void }) {
  return (
    <Box sx={{ borderTop:"1px solid #1e2d45",py:{xs:10,md:16},textAlign:"center",position:"relative",overflow:"hidden" }}>
      <Box sx={{ position:"absolute",inset:0,background:"radial-gradient(ellipse 60% 60% at 50% 100%, rgba(0,212,138,0.1) 0%, transparent 70%)",pointerEvents:"none" }} />
      <Container maxWidth="md" sx={{ position:"relative" }}>
        <Typography variant="h3" sx={{ fontSize:{xs:"2rem",md:"3rem"},fontWeight:800,letterSpacing:"-0.02em",mb:2 }}>
          Ready to see what<br />you are missing?
        </Typography>
        <Typography sx={{ color:"#8b9bb4",mb:5,fontSize:"1.05rem" }}>Your personalized plan is waiting. It takes 2 minutes.</Typography>
        <Stack direction={{ xs:"column",sm:"row" }} spacing={2.5} sx={{ justifyContent:"center" }}>
          <PrimaryBtn label="Build Full Plan" onClick={onPrimary} />
          <GhostBtn label="Quick Free Snapshot" onClick={onSecondary} />
        </Stack>
        <Typography sx={{ mt:4,fontSize:"0.72rem",color:"#8b9bb4",maxWidth:480,mx:"auto",lineHeight:1.6 }}>
          Educational estimates only. Not individualized legal, tax, or investment advice. Please consult a licensed CPA or CFP before acting on any recommendation.
        </Typography>
      </Container>
    </Box>
  );
}

function LandingFooter() {
  const yr = new Date().getFullYear();
  return (
    <Box sx={{ borderTop:"1px solid #1e2d45",py:4 }}>
      <Container maxWidth="lg">
        <Stack direction={{ xs:"column",sm:"row" }} spacing={2} sx={{ justifyContent:"space-between",alignItems:{ sm:"center" } }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems:"center" }}>
            <svg width="22" height="22" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="#0a0e1a"/><polygon points="16,4 28,16 16,28 4,16" fill="none" stroke="#00d48a" strokeWidth="1.8"/><polyline points="10,16 14,12 18,19 22,14" stroke="#00d48a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="22" cy="14" r="1.8" fill="#00d48a"/></svg>
            <Typography sx={{ fontWeight:800,fontSize:"0.9rem",color:"#e2e8f0" }}>Acuity</Typography>
            <Typography sx={{ fontSize:"0.75rem",color:"#8b9bb4" }}>c {yr}</Typography>
          </Stack>
          <Stack direction="row" spacing={3}>
            {["Privacy","Terms","Disclaimer"].map((l) => (
              <Typography key={l} sx={{ fontSize:"0.78rem",color:"#8b9bb4",cursor:"pointer","&:hover":{color:"#e2e8f0"} }}>{l}</Typography>
            ))}
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
function LandingNav({ onCTA }: { onCTA:()=>void }) {
  const scroll = (id:string) => document.getElementById(id)?.scrollIntoView({ behavior:"smooth" });
  return (
    <Box sx={{ position:"fixed",top:0,left:0,right:0,zIndex:100,bgcolor:"rgba(10,14,26,0.88)",backdropFilter:"blur(16px)",borderBottom:"1px solid #1e2d45" }}>
      <Container maxWidth="lg">
        <Stack direction="row" sx={{ alignItems:"center",height:60,gap:2 }}>
          <Stack direction="row" spacing={1.2} sx={{ alignItems:"center",flexShrink:0 }}>
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="#0a0e1a"/><polygon points="16,4 28,16 16,28 4,16" fill="none" stroke="#00d48a" strokeWidth="1.8"/><polyline points="10,16 14,12 18,19 22,14" stroke="#00d48a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="22" cy="14" r="1.8" fill="#00d48a"/></svg>
            <Typography sx={{ fontWeight:800,fontSize:"1rem",color:"#e2e8f0",letterSpacing:"-0.02em" }}>Acuity</Typography>
          </Stack>
          <Stack direction="row" spacing={3} sx={{ flexGrow:1,justifyContent:"center",display:{xs:"none",md:"flex"} }}>
            {[["Features","features"],["How It Works","how-it-works"],["Pricing","pricing"]].map(([label,id]) => (
              <Typography key={id} onClick={() => scroll(id)} sx={{ fontSize:"0.85rem",color:"#8b9bb4",cursor:"pointer","&:hover":{color:"#e2e8f0"},transition:"color 0.15s" }}>{label}</Typography>
            ))}
          </Stack>
          <Button onClick={onCTA} sx={{ ml:"auto",background:"linear-gradient(135deg,#00d48a,#00b876)",color:"#0a0e1a",fontWeight:700,fontSize:"0.82rem",px:2.5,py:0.9,borderRadius:2,textTransform:"none",flexShrink:0,"&:hover":{boxShadow:"0 0 20px rgba(0,212,138,0.4)"} }}>
            Run Financial Analysis
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}


// Landing Chat
export default function LandingPage() {
  const navigate = useNavigate();
  const go = () => navigate("/wizard");
  const goQuick = () => navigate("/quick");
  const [chatOpen, setChatOpen] = useState(false);
  return (
    <Box sx={{ bgcolor:"#0a0e1a",minHeight:"100vh",color:"#e2e8f0" }}>
      <LandingNav onCTA={go} />
      <Box sx={{ pt:"60px" }}>
        <HeroSection onPrimary={go} onSecondary={goQuick} />
        <MetricStrip />
        <HowItWorks />
        <Features />
        <Testimonials />
        <BottomCTA onPrimary={go} onSecondary={goQuick} />
        <LandingFooter />
      </Box>

      {/* Floating chat button */}
      <Tooltip title="Ask Margaret — AI Financial Advisor" placement="left">
        <Fab onClick={() => setChatOpen(true)} sx={{ position:"fixed",bottom:32,right:32,zIndex:200,background:"linear-gradient(135deg,#00d48a,#00b876)",color:"#0a0e1a",boxShadow:"0 0 28px rgba(0,212,138,0.4)","@keyframes pulse":{"0%,100%":{boxShadow:"0 0 28px rgba(0,212,138,0.4)"},"50%":{boxShadow:"0 0 48px rgba(0,212,138,0.7)"}},animation:"pulse 3s ease-in-out infinite","&:hover":{background:"linear-gradient(135deg,#00b876,#009960)",transform:"scale(1.05)"},transition:"transform 0.15s" }}>
          <ChatIcon />
        </Fab>
      </Tooltip>

      <ProspectChat open={chatOpen} onClose={() => setChatOpen(false)} />
    </Box>
  );
}


