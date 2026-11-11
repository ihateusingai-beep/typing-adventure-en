// Pure, deterministic character scripts. No answer, damage or scoring logic lives here.
const unit=t=>Math.max(0,Math.min(1,t));
export function enemyDuration(p,phase,kind='pressure'){
 if(phase==='enter')return 650;if(phase==='anticipation')return kind==='counter'?Math.min(440,p.windup*.58):p.windup;
 if(phase==='attack')return ['rush','pounce','inferno'].includes(p.attack)?470:390;
 return ({recover:p.recovery,hurt:400,defeat:720,retreat:400,victory:900,idle:Infinity})[phase]??500;
}
export function enemyPose(p,phase,elapsed=0,clock=0,{reduced=false,kind='pressure'}={}){
 const t=unit(elapsed/enemyDuration(p,phase,kind)),wave=Math.sin(clock/(p.breath*1000)*Math.PI*2+p.seed),dir=-1;
 if(reduced)return {x:0,y:0,rotate:0,sx:1,sy:1,alpha:['defeat','retreat'].includes(phase)?1-t:1,bend:0,flap:0,charge:phase==='anticipation'?t:0};
 let x=0,y=-p.hover*(.5+.5*wave),rotate=0,sx=1+wave*.012,sy=1-wave*.018,alpha=1,bend=wave*2,flap=Math.sin(clock/170+p.seed),charge=0;
 if(p.body==='serpent'){bend=Math.sin(clock/330+p.seed)*8;sx=1+wave*.02;}
 if(p.body==='beast'){rotate=Math.sin(clock/800+p.seed)*.5;bend=wave*1.3;}
 if(p.body==='tree')bend=Math.sin(clock/1100+p.seed)*6;
 if(p.body==='heavy'){sx=1+wave*.006;sy=1-wave*.009;bend=wave*.6;}
 if(p.body==='flame')bend=Math.sin(clock/230+p.seed)*6;
 if(p.body==='dragon'){rotate=wave*1.2;bend=wave*6;}
 if(phase==='enter'){x=42*(1-t)**2;y-=Math.sin(t*Math.PI)*9;alpha=Math.min(1,t*2);}
 if(phase==='anticipation'){charge=t;x=12*t;sy-=t*(p.body==='heavy'?.025:.07);sx+=t*.035;rotate=4*t;bend+=t*(p.body==='serpent'?16:4);}
 if(phase==='attack'){const strike=Math.sin(t*Math.PI);x=dir*p.lunge*strike;rotate=dir*strike*(p.body==='heavy'?2:7);y-=strike*(['beast','wing','dragon'].includes(p.body)?20:3);sx+=strike*.04;sy-=strike*.035;bend-=strike*8;}
 if(phase==='recover'){x=-8*(1-t);rotate=-2*(1-t);}
 if(phase==='hurt'){const shock=Math.exp(-t*5);x=22*Math.sin(t*Math.PI)+Math.sin(t*38)*shock*4;rotate=shock*6;sy-=shock*.035;}
 if(phase==='defeat'||phase==='retreat'){x=t*36;y+=t*t*16;rotate=t*9;alpha=1-t;sy-=t*.07;}
 if(phase==='victory'){y-=Math.max(0,Math.sin(t*Math.PI*2))*6;rotate=Math.sin(t*Math.PI)*-3;}
 return {x,y,rotate,sx,sy,alpha,bend,flap,charge};
}
// A continuous deformation over strips preserves the illustration while articulating it.
export function enemyMesh(p,pose,position,clock=0){
 const v=unit(position),edge=Math.abs(v-.5)*2;
 if(p.body==='wing')return {dx:0,dy:0,scale:1-(.12+.12*pose.flap)*edge*edge};
 const head=(1-v)**2,feet=v**3;
 const sway=p.body==='serpent'?Math.sin(v*9-clock/290+p.seed)*(2+Math.abs(pose.bend))*Math.sin(v*Math.PI):p.body==='spirit'||p.body==='flame'?Math.sin(v*11-clock/260+p.seed)*feet*6:head*pose.bend;
 return {dx:sway,dy:p.body==='beast'?Math.sin(clock/220+v*14)*feet*1.5:0,scale:1};
}

// Select only frames actually drawn by imagegen. No mesh-warped frames or invented in-betweens.
export function enemyFrame(p,phase,elapsed=0,clock=0,{reduced=false,kind='pressure'}={}){
 if(!p.animation)return null;
 const rows={idle:0,enter:0,anticipation:1,attack:2,recover:2,hurt:3,defeat:4,retreat:4,victory:0};
 const row=rows[phase]??0,count=p.animation.counts[row];let column=0;
 if(phase==='idle'||phase==='victory')column=reduced?0:Math.floor(clock/(p.body==='wing'?110:170))%count;
 else if(phase==='recover')column=reduced?count-1:Math.min(count-1,count-2+Math.floor(elapsed/enemyDuration(p,'recover',kind)*2));
 else if(phase!=='enter')column=reduced?0:Math.min(count-1,Math.floor(elapsed/enemyDuration(p,phase,kind)*count));
 return {row,column,x:column*p.animation.cellSize,y:row*p.animation.cellSize,size:p.animation.cellSize};
}