import{Box,Typography,Grid,Chip}from"@mui/material";
import CalendarTodayIcon from"@mui/icons-material/CalendarToday";
import TrendingUpIcon from"@mui/icons-material/TrendingUp";
import type{RoadmapItem}from"../../types";

function TimelineItem({action,index,color,bg}:{action:string;index:number;color:string;bg:string}){
  return(
    <Box sx={{display:"flex",gap:1.5,alignItems:"flex-start"}}>
      <Box sx={{width:28,height:28,borderRadius:"50%",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",bgcolor:bg,border:"1px solid",borderColor:color,mt:0.2}}>
        <Typography sx={{fontSize:"0.72rem",fontWeight:800,color}}>{index+1}</Typography>
      </Box>
      <Box sx={{flex:1,bgcolor:"rgba(255,255,255,0.02)",border:"1px solid #1e2d45",borderRadius:2,p:1.75,"&:hover":{bgcolor:"rgba(255,255,255,0.04)",borderColor:"#2a3a55"},transition:"all 0.15s"}}>
        <Typography sx={{fontSize:"0.84rem",color:"#e2e8f0",lineHeight:1.6}}>{action}</Typography>
      </Box>
    </Box>
  );
}

export default function RoadmapChecklist({roadmap}:{roadmap:RoadmapItem[]}){
  const thisYear=roadmap.filter(r=>r.timeframe==="this_year");
  const future=roadmap.filter(r=>r.timeframe==="future_years");
  return(
    <Box sx={{bgcolor:"#111827",border:"1px solid #1e2d45",borderRadius:3,p:3,mb:3}}>
      <Box sx={{display:"flex",alignItems:"center",gap:1.5,mb:0.5}}>
        <Typography variant="subtitle2">5. Prioritized Action Roadmap</Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{mb:3,fontSize:"0.78rem"}}>
        Expand any recommendation above to see the step-by-step instructions, then work through these actions in order.
      </Typography>
      <Grid container spacing={3}>
        <Grid size={{xs:12,sm:6}}>
          <Box sx={{display:"flex",alignItems:"center",gap:1,mb:2,pb:1.5,borderBottom:"1px solid #1e2d45"}}>
            <CalendarTodayIcon sx={{fontSize:15,color:"#00d48a"}}/>
            <Typography sx={{fontWeight:700,fontSize:"0.8rem",color:"#00d48a",textTransform:"uppercase",letterSpacing:"0.06em"}}>
              This Tax Year
            </Typography>
            <Chip label="Do now" size="small" sx={{ml:"auto",bgcolor:"rgba(0,212,138,0.1)",color:"#00d48a",border:"1px solid rgba(0,212,138,0.25)",fontSize:"0.65rem",fontWeight:700,height:18}}/>
          </Box>
          <Box sx={{display:"flex",flexDirection:"column",gap:1.5}}>
            {thisYear.map((r,i)=><TimelineItem key={i} action={r.action} index={i} color="#00d48a" bg="rgba(0,212,138,0.1)"/>)}
          </Box>
        </Grid>
        <Grid size={{xs:12,sm:6}}>
          <Box sx={{display:"flex",alignItems:"center",gap:1,mb:2,pb:1.5,borderBottom:"1px solid #1e2d45"}}>
            <TrendingUpIcon sx={{fontSize:15,color:"#3b82f6"}}/>
            <Typography sx={{fontWeight:700,fontSize:"0.8rem",color:"#3b82f6",textTransform:"uppercase",letterSpacing:"0.06em"}}>
              Future Years
            </Typography>
            <Chip label="Plan ahead" size="small" sx={{ml:"auto",bgcolor:"rgba(59,130,246,0.1)",color:"#3b82f6",border:"1px solid rgba(59,130,246,0.25)",fontSize:"0.65rem",fontWeight:700,height:18}}/>
          </Box>
          <Box sx={{display:"flex",flexDirection:"column",gap:1.5}}>
            {future.map((r,i)=><TimelineItem key={i} action={r.action} index={i} color="#3b82f6" bg="rgba(59,130,246,0.1)"/>)}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
