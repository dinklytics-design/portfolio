import{useState}from"react";
import{Box,Typography,Chip,Collapse,IconButton,Tooltip,Divider}from"@mui/material";
import ExpandMoreIcon from"@mui/icons-material/ExpandMore";
import ExpandLessIcon from"@mui/icons-material/ExpandLess";
import QuestionAnswerIcon from"@mui/icons-material/QuestionAnswer";
import InfoOutlinedIcon from"@mui/icons-material/InfoOutlined";
import WarningAmberIcon from"@mui/icons-material/WarningAmber";
import MenuBookIcon from"@mui/icons-material/MenuBook";
import SavingsIcon from"@mui/icons-material/Savings";
import type{RecommendationItem}from"../../types";

const priorityConfig:Record<RecommendationItem["priority"],{color:string;bg:string;label:string}>={
  high:{color:"#f87171",bg:"rgba(248,113,113,0.1)",label:"HIGH"},
  medium:{color:"#fbbf24",bg:"rgba(251,191,36,0.1)",label:"MED"},
  low:{color:"#60a5fa",bg:"rgba(96,165,250,0.1)",label:"LOW"},
};

function RecommendationCard({item,onAsk}:{item:RecommendationItem;onAsk?:(q:string)=>void}){
  const[open,setOpen]=useState(true);
  const cfg=priorityConfig[item.priority];
  return(
    <Box sx={{border:"1px solid",borderColor:open?`${cfg.color}44`:"#1e2d45",borderLeft:"3px solid",borderLeftColor:cfg.color,borderRadius:2,bgcolor:open?"rgba(255,255,255,0.02)":"transparent",transition:"all 0.15s","&:hover":{borderColor:`${cfg.color}44`,bgcolor:"rgba(255,255,255,0.02)"}}}>
      <Box onClick={()=>setOpen(!open)} sx={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:1,p:2,cursor:"pointer"}}>
        <Box sx={{display:"flex",alignItems:"center",gap:1.5,flex:1,minWidth:0}}>
          <Chip label={cfg.label} size="small" sx={{bgcolor:cfg.bg,color:cfg.color,border:"none",fontWeight:700,fontSize:"0.65rem",minWidth:40,height:20}}/>
          <Typography sx={{fontWeight:600,fontSize:"0.875rem",color:"#e2e8f0",lineHeight:1.3}}>{item.title}</Typography>
        </Box>
        <Box sx={{display:"flex",alignItems:"center",gap:0.5,flexShrink:0}}>{item.savingsEstimate&&item.savingsEstimate>0?(<Box sx={{display:"flex",alignItems:"center",gap:0.4,bgcolor:"rgba(0,212,138,0.08)",border:"1px solid rgba(0,212,138,0.2)",borderRadius:1,px:1,py:0.3,mr:0.5}}><SavingsIcon sx={{fontSize:11,color:"#00d48a"}}/><Typography sx={{fontSize:"0.68rem",color:"#00d48a",fontWeight:700,whiteSpace:"nowrap"}}>~{"$"+item.savingsEstimate.toLocaleString()}/yr</Typography></Box>):null}
          {onAsk&&(<Tooltip title="Ask Margaret about this"><IconButton size="small" onClick={e=>{e.stopPropagation();onAsk(`Explain in detail and give me a step-by-step action plan: "${item.title}". Context: ${item.detail}`);}} sx={{color:"#8b9bb4","&:hover":{color:"#3b82f6",bgcolor:"rgba(59,130,246,0.1)"}}}><QuestionAnswerIcon sx={{fontSize:14}}/></IconButton></Tooltip>)}
          <Box sx={{color:"#8b9bb4"}}>{open?<ExpandLessIcon fontSize="small"/>:<ExpandMoreIcon fontSize="small"/>}</Box>
        </Box>
      </Box>
      <Collapse in={open}>
        <Box sx={{px:2,pb:2.5}}>
          {/* Why it matters */}
          <Typography variant="body2" sx={{color:"#8b9bb4",lineHeight:1.65,fontSize:"0.82rem",mb:item.context||item.steps?1.5:0}}>{item.detail}</Typography>

          {/* Your situation */}
          {item.context&&(
            <Box sx={{p:1.5,bgcolor:"rgba(0,212,138,0.05)",border:"1px solid rgba(0,212,138,0.2)",borderRadius:2,mb:1.5,display:"flex",gap:1,alignItems:"flex-start"}}>
              <InfoOutlinedIcon sx={{fontSize:15,color:"#00d48a",mt:"2px",flexShrink:0}}/>
              <Box>
                <Typography sx={{fontSize:"0.7rem",fontWeight:700,color:"#00d48a",textTransform:"uppercase",letterSpacing:"0.08em",mb:0.4}}>Your Situation</Typography>
                <Typography sx={{fontSize:"0.82rem",color:"#e2e8f0",lineHeight:1.6}}>{item.context}</Typography>
              </Box>
            </Box>
          )}

          {/* Step-by-step action plan */}
          {item.steps&&item.steps.length>0&&(
            <Box>
              <Divider sx={{mb:1.5,borderColor:"#1e2d45"}}/>
              <Typography sx={{fontSize:"0.7rem",fontWeight:700,color:"#8b9bb4",textTransform:"uppercase",letterSpacing:"0.08em",mb:1.25}}>How To Do It</Typography>
              <Box sx={{display:"flex",flexDirection:"column",gap:0.9}}>
                {item.steps.map((step,i)=>(
                  <Box key={i} sx={{display:"flex",gap:1.5,alignItems:"flex-start"}}>
                    <Box sx={{width:22,height:22,borderRadius:"50%",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",bgcolor:"rgba(0,212,138,0.12)",border:"1px solid rgba(0,212,138,0.3)",mt:"1px"}}>
                      <Typography sx={{fontSize:"0.65rem",fontWeight:800,color:"#00d48a"}}>{i+1}</Typography>
                    </Box>
                    <Typography sx={{fontSize:"0.82rem",color:"#c9d6e3",lineHeight:1.6,flex:1}}>{step}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {/* Education */}
          {item.education&&(
            <Box sx={{mt:2}}>
              <Divider sx={{mb:1.5,borderColor:"#1e2d45"}}/>
              <Box sx={{display:"flex",alignItems:"center",gap:1,mb:1.25}}>
                <MenuBookIcon sx={{fontSize:14,color:"#a78bfa"}}/>
                <Typography sx={{fontSize:"0.7rem",fontWeight:700,color:"#a78bfa",textTransform:"uppercase",letterSpacing:"0.08em"}}>How This Works ? Educational Background</Typography>
              </Box>
              <Box sx={{p:2,bgcolor:"rgba(167,139,250,0.04)",border:"1px solid rgba(167,139,250,0.15)",borderRadius:2}}>
                {item.education.split("\n\n").map((para,i)=>(<Typography key={i} sx={{fontSize:"0.82rem",color:"#b8c4d4",lineHeight:1.75,mb:i<item.education!.split("\n\n").length-1?1.5:0,whiteSpace:"pre-line"}}>{para}</Typography>))}
              </Box>
            </Box>
          )}

          {/* Warning */}
          {item.warning&&(
            <Box sx={{mt:1.5,display:"flex",gap:1,alignItems:"flex-start",p:1.5,bgcolor:"rgba(251,191,36,0.05)",border:"1px solid rgba(251,191,36,0.2)",borderRadius:2}}>
              <WarningAmberIcon sx={{fontSize:15,color:"#fbbf24",mt:"2px",flexShrink:0}}/>
              <Box>
                <Typography sx={{fontSize:"0.7rem",fontWeight:700,color:"#fbbf24",textTransform:"uppercase",letterSpacing:"0.08em",mb:0.4}}>Common Mistake to Avoid</Typography>
                <Typography sx={{fontSize:"0.82rem",color:"#e2e8f0",lineHeight:1.6}}>{item.warning}</Typography>
              </Box>
            </Box>
          )}
        </Box>
      </Collapse>
    </Box>
  );
}

export default function RecommendationSection({title,items,onAsk}:{title:string;items:RecommendationItem[];onAsk?:(q:string)=>void}){
  return(
    <Box sx={{mb:2}}>
      <Typography variant="subtitle2" sx={{mb:1.5,color:"#8b9bb4"}}>{title}</Typography>
      <Box sx={{display:"flex",flexDirection:"column",gap:1}}>
        {items.map((item,idx)=><RecommendationCard key={idx} item={item} onAsk={onAsk}/>)}
      </Box>
    </Box>
  );
}
