const smoothPose=n=>{n=Math.max(0,Math.min(1,n));return n*n*(3-2*n);};
// Visual timing only. These functions never change answers, score or progression.
export const ENEMY_MOTION={
 E_NEW_01:{breath:2.8,bob:1.6,sway:1,weight:1,attack:'木葉掌',tone:'wood'},
 E_NEW_02:{breath:1.9,bob:8,sway:4,weight:.6,attack:'墨珠波',tone:'ink'},
 E_NEW_03:{breath:2.4,bob:11,sway:5,weight:.5,attack:'迴風刃',tone:'wind'},
 E_NEW_04:{breath:3.2,bob:2,sway:1,weight:1.2,attack:'竹節突進',tone:'bamboo'},
 E_NEW_05:{breath:3.9,bob:1.2,sway:.5,weight:1.7,attack:'星燈震',tone:'stone'},
 E_NEW_06:{breath:2.7,bob:3,sway:1.6,weight:1,attack:'墨影斬',tone:'sword'},
 nether_lord_boss:{breath:3.6,bob:6,sway:2,weight:1.4,attack:'玄墨劍氣',tone:'ink'}
};
export function combatPlan(type,{combo=0}={}){
 if(type==='wrong')return {type,duration:610,beats:[
  {at:0,actor:'hero',action:'hurt',duration:420},
  {at:0,actor:'enemy',action:'anticipation',duration:145},
  {at:145,actor:'enemy',action:'attack',duration:420},
  {at:205,cue:'enemy-wave'},{at:285,cue:'hurt-impact'}]};
 if(type==='guard')return {type,duration:620,beats:[
  {at:0,actor:'enemy',action:'attack',duration:430},
  {at:0,actor:'hero',action:'defense',duration:550},
  {at:145,cue:'enemy-wave'},{at:225,cue:'guard-impact'},
  {at:285,actor:'enemy',action:'hurt',duration:220}]};
 return {type:'correct',finisher:type==='word'||combo>0&&combo%5===0,duration:560,beats:[
  {at:0,actor:'hero',action:'run',duration:140},
  {at:140,actor:'hero',action:'attack',duration:400},
  {at:230,cue:'hero-wave'},
  {at:320,actor:'enemy',action:'hurt',duration:230},
  {at:320,cue:'hit-impact'}]};
}
const clamp=v=>Math.min(1,Math.max(0,v));
export function spritePose({action='idle',elapsed=0,duration=500,clock=0,enemy=false,id='',reduced=false,variant=0}={}){
 const p=ENEMY_MOTION[id]??{breath:2.8,bob:2,sway:.5,weight:1};
 if(reduced)return {x:0,y:0,r:0,sx:1,sy:1,opacity:1};
 const breathe=Math.sin(clock/(p.breath*1000)*Math.PI*2),t=clamp(elapsed/duration),dir=enemy?-1:1;
 let x=enemy?breathe*p.sway:0,y=-Math.max(0,breathe)*(enemy?p.bob:.7),r=enemy?breathe*p.sway*.28:0,sx=enemy?1+breathe*.009:1,sy=enemy?1-breathe*.014:1,opacity=1;
 if(action==='run'){const ease=t*t*(3-2*t);x=dir*ease*20;y=-Math.sin(t*Math.PI)*2.5;}
 if(action==='anticipation'){x=-dir*Math.sin(t*Math.PI/2)*9;sx=1+.035*t;sy=1-.045*t;r=-dir*3*t;}
 if(action==='attack'){
  const lunge=Math.sin(clamp((t-.1)/.9)*Math.PI);
  x=dir*lunge*(enemy?32/p.weight:34);y=-lunge*(enemy&&p.weight>1.4?1:5);r=dir*lunge*(variant%2?-4:4);sx=1+lunge*.025;sy=1-lunge*.02;
 }
 if(action==='jump'){x=dir*Math.sin(t*Math.PI)*13;y=-Math.sin(t*Math.PI)*22;}
 if(action==='defense'){x=-dir*Math.sin(t*Math.PI)*8;sy=1-Math.sin(t*Math.PI)*.025;}
 if(action==='hurt'){const shock=Math.exp(-t*6);x=-dir*Math.sin(t*Math.PI)*19+Math.sin(t*32)*shock*3;r=-dir*shock*5;sx=1+shock*.025;sy=1-shock*.025;}
 if(action==='exit'){x=-dir*t*28;y=-Math.sin(t*Math.PI)*8;opacity=1-t;}
 if(action==='victory'){y=-Math.sin(t*Math.PI)*2;r=Math.sin(t*Math.PI)*.5;}
 if(!enemy){sx=1;sy=1;
  if(action==='attack'){
   // Plant the rear foot, release through the strike, then recover into guard.
   const knots=[[0,0,0,0],[.19,-7,2,-2.2],[.43,43,-4,2.8],[.58,46,-3,2.0],[.77,17,-1,-.8],[1,0,0,0]];let k=0;while(k<knots.length-2&&t>knots[k+1][0])k++;const a=knots[k],b=knots[k+1],u=clamp((t-a[0])/(b[0]-a[0])),q=u*u*(3-2*u);x=a[1]+(b[1]-a[1])*q;y=a[2]+(b[2]-a[2])*q;r=(a[3]+(b[3]-a[3])*q)*(variant%2?1:-.75);
  }
  if(action==='cast'||action==='seal'){const gather=smoothPose(t/.28),release=smoothPose((t-.28)/.32),settle=smoothPose((t-.65)/.35);x=-5*gather+12*release-7*settle;y=-3*Math.sin(t*Math.PI);r=-1.5*gather+2.5*release-settle;}
 }

 return {x,y,r,sx,sy,opacity};
}

export function blendSpritePose(previous,next,elapsed,windowMs=90){
 if(!previous||elapsed>=windowMs)return next;
 const t=clamp(elapsed/windowMs),ease=1-(1-t)**3;
 return Object.fromEntries(Object.keys(next).map(key=>[key,previous[key]+(next[key]-previous[key])*ease]));
}