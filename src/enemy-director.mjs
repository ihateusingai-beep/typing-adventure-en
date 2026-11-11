import {enemyProfile} from '../game-data/challenge-enemies.mjs';
import {enemyPose,enemyMesh,enemyDuration,enemyFrame} from './enemy-motion.mjs';
import {ENEMY_HIT_REGIONS} from '../game-data/enemy-hit-regions.mjs';
const images=new Map();
function art(src){if(images.has(src)){const cached=images.get(src);images.delete(src);images.set(src,cached);return cached;}const pending=new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>{images.delete(src);reject(Error('Enemy art unavailable'));};im.src=src;});images.set(src,pending);while(images.size>8)images.delete(images.keys().next().value);return pending;}
const mix=(a,b,t)=>a+(b-a)*t,limit=t=>Math.min(1,Math.max(0,t));
export class EnemyDirector{
 constructor(host,id,{arena=host,hero=null,reduced=false,preview=false,onImpact=()=>{}}={}){
  Object.assign(this,{host,arena,hero,reduced,preview,onImpact,phase:'enter',started:performance.now(),offset:0,pausedAt:0,kind:'pressure',dead:false,seen:new Set(),defeated:0,serial:0,nextAttack:performance.now()+3400});
  this.canvas=document.createElement('canvas');this.canvas.width=this.canvas.height=640;this.canvas.className='enemy-canvas';this.canvas.setAttribute('aria-hidden','true');host.append(this.canvas);this.ctx=this.canvas.getContext('2d');
  this.fxCanvas=document.createElement('canvas');this.fxCanvas.className='enemy-script-fx';this.fxCanvas.setAttribute('aria-hidden','true');arena.append(this.fxCanvas);this.fxCtx=this.fxCanvas.getContext('2d');
  this.label=document.createElement('span');this.label.className='enemy-script-name';host.append(this.label);this.intent=document.createElement('span');this.intent.className='enemy-script-intent';this.intent.setAttribute('aria-hidden','true');host.append(this.intent);
  this.tick=this.tick.bind(this);this.ready=this.setEnemy(id);this.raf=requestAnimationFrame(this.tick);
 }
 async setEnemy(id){
  if(this.profile?.id===id&&!['defeat','retreat'].includes(this.phase))return;
  if(this.profile&&this.image)this.outgoing={profile:this.profile,image:this.image,started:this.phase==='defeat'?this.started:performance.now(),phase:this.defeatedId===this.profile.id?'defeat':'retreat'};
  this.defeatedId=null;this.holdUntil=0;const token=++this.serial;this.profile=enemyProfile(id);this.image=null;this.host.dataset.art='loading';this.seen.add(id);this.host.dataset.enemyId=id;this.host.dataset.enemyBody=this.profile.body;this.host.setAttribute('aria-label',this.profile.name);this.label.textContent=this.profile.name;this.host.style.setProperty('--enemy-color',this.profile.color);this.setPhase('enter');this.nextAttack=performance.now()+3300+this.profile.seed*31;
  try{const image=await art(this.profile.animation?.src??this.profile.src);if(this.dead||token!==this.serial)return;this.image=image;this.host.dataset.animationSource=this.profile.animation?'ai-drawn-atlas':'reference-still';this.host.dataset.art='ready';this.host.querySelector('.enemy-art-error')?.remove();}
  catch{if(this.dead||token!==this.serial)return;this.host.dataset.art='error';const error=document.createElement('button');error.className='enemy-art-error quiet';error.textContent=this.profile.name+'：重新載入';error.onclick=()=>{this.profile=null;this.setEnemy(id);};this.host.append(error);}
 }
 preload(id){const p=enemyProfile(id);return art(p.animation?.src??p.src).catch(()=>null);}
 setPhase(phase,kind=this.kind){this.phase=phase;this.kind=kind;this.started=performance.now();this.host.dataset.enemyPhase=phase;this.intent.textContent=phase==='anticipation'?this.profile.move:phase==='attack'?this.profile.move:'';this.impacted=false;}
 attack(kind='pressure'){
  if(this.dead||['defeat','retreat','victory'].includes(this.phase))return;
  if(kind!=='counter'&&['anticipation','attack','hurt'].includes(this.phase))return;
  this.holdUntil=0;this.setPhase('anticipation',kind);this.nextAttack=performance.now()+4200+this.profile.seed*45;
 }
 prepareGuard(deadline){this.holdUntil=deadline;this.setPhase('anticipation','guard');}
 answered(correct){if(correct&&this.kind==='counter'&&['anticipation','attack'].includes(this.phase))this.setPhase('recover','pressure');else if(!correct)this.attack('counter');}
 hurt(){if(this.phase!=='defeat')this.setPhase('hurt','pressure');}
 markDefeated(id){this.defeated++;this.defeatedId=id;if(id===this.profile.id)this.setPhase('defeat');}
 parried(){this.holdUntil=0;this.setPhase('hurt','pressure');}
 rest(){this.holdUntil=0;this.setPhase('idle','pressure');this.nextAttack=performance.now()+4000;}
 victory(){this.holdUntil=0;this.setPhase('victory','pressure');}
 pause(){if(!this.pausedAt)this.pausedAt=performance.now();}
 resume(){if(this.pausedAt){const delta=performance.now()-this.pausedAt;this.started+=delta;this.offset+=delta;this.nextAttack+=delta;if(this.holdUntil)this.holdUntil+=delta;if(this.outgoing)this.outgoing.started+=delta;this.pausedAt=0;}}
 paintBody(profile,image,phase,elapsed,clock,kind='pressure'){
  const ctx=this.ctx,pose=enemyPose(profile,phase,elapsed,clock,{reduced:this.reduced,kind});
  ctx.save();ctx.globalAlpha=pose.alpha;
  ctx.fillStyle='#0004';ctx.beginPath();ctx.ellipse(320,558,104,13,0,0,Math.PI*2);ctx.fill();
  if(pose.charge>0&&!this.reduced){ctx.strokeStyle=profile.color;ctx.globalAlpha=pose.alpha*pose.charge*.45;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(320,550,95+pose.charge*28,19+pose.charge*8,0,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=pose.alpha;}
  ctx.translate(320+pose.x,556+pose.y);ctx.rotate(pose.rotate*Math.PI/180);ctx.scale(pose.sx*profile.scale,pose.sy*profile.scale);ctx.translate(-256,-492);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  const drawn=enemyFrame(profile,phase,elapsed,clock,{reduced:this.reduced,kind});
  if(drawn){ctx.drawImage(image,drawn.x,drawn.y,drawn.size,drawn.size,0,0,512,512);if(profile.id===this.profile.id)this.host.dataset.drawnFrame=`${drawn.row}:${drawn.column}`;}
  else if(this.reduced)ctx.drawImage(image,0,0,512,512);
  else if(profile.body==='wing'){
   for(let x=0;x<512;x+=4){const mesh=enemyMesh(profile,pose,(x+2)/512,clock);ctx.drawImage(image,x,0,4,512,x,285*(1-mesh.scale),4,512*mesh.scale);}
  }else{
   for(let y=0;y<512;y+=4){const mesh=enemyMesh(profile,pose,(y+2)/512,clock);ctx.drawImage(image,0,y,512,4,Math.round(mesh.dx),y,512,4);}
  }
  ctx.restore();
 }
 anchors(){
  const a=this.arena.getBoundingClientRect(),e=this.host.getBoundingClientRect();const h=this.hero?.getBoundingClientRect();
  return {x0:e.left-a.left+e.width*.45,y0:e.top-a.top+e.height*.45,x1:h?h.left-a.left+h.width*.6:Math.max(22,e.left-a.left-70),y1:h?h.top-a.top+h.height*.5:e.top-a.top+e.height*.6,ground:e.bottom-a.top};
 }
 impactPoint(){
  const now=this.pausedAt||performance.now(),clock=now-this.offset,p=this.profile,age=now-this.started,pose=enemyPose(p,this.phase,age,clock,{reduced:this.reduced,kind:this.kind}),frame=enemyFrame(p,this.phase,age,clock,{reduced:this.reduced,kind:this.kind});
  const index=frame?Math.round(frame.y/frame.size)*(p.animation?.columns??6)+Math.round(frame.x/frame.size):0;
  const [x0,y0,x1,y1]=ENEMY_HIT_REGIONS[p.id]?.[index]??[96,80,416,492],x=((x0+x1)/2-256)*p.scale*pose.sx,y=((y0+y1)/2-492)*p.scale*pose.sy,angle=pose.rotate*Math.PI/180;
  const outer=this.arena.getBoundingClientRect(),r=this.canvas.getBoundingClientRect();
  return {x:r.left-outer.left+(320+pose.x+x*Math.cos(angle)-y*Math.sin(angle))*r.width/640,y:r.top-outer.top+(556+pose.y+x*Math.sin(angle)+y*Math.cos(angle))*r.height/640,body:Math.max(x1-x0,y1-y0)*p.scale*r.height/640};
 }
 paintFx(now){
  const c=this.fxCanvas,box=this.arena.getBoundingClientRect(),w=Math.max(1,Math.round(box.width)),h=Math.max(1,Math.round(box.height));if(c.width!==w||c.height!==h){c.width=w;c.height=h;}
  const ctx=this.fxCtx;ctx.clearRect(0,0,w,h);if(this.reduced)return;
  const p=this.profile,a=this.anchors(),age=now-this.started;ctx.save();ctx.strokeStyle=p.color;ctx.fillStyle=p.color;
  if(this.phase==='anticipation'){
   const t=limit(age/enemyDuration(p,'anticipation',this.kind));ctx.globalAlpha=.25+.35*t;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(a.x0,a.y0,15+16*(1-t),-.9*Math.PI,Math.PI*(.4+1.4*t));ctx.stroke();
   for(let i=0;i<4;i++){const angle=now/700+i*Math.PI/2;ctx.beginPath();ctx.arc(a.x0+Math.cos(angle)*24,a.y0+Math.sin(angle)*24,1.5,0,Math.PI*2);ctx.fill();}
  }
  if(this.phase==='attack'){
   const t=limit(age/enemyDuration(p,'attack',this.kind));const destination=this.kind==='counter'||this.kind==='guard'?a.x1:mix(a.x0,a.x1,.65),x=mix(a.x0,destination,t),y=mix(a.y0,a.y1,t)-Math.sin(t*Math.PI)*12;ctx.globalAlpha=Math.sin(t*Math.PI);ctx.lineWidth=2.5;
   if(['slash','claw','bite'].includes(p.attack)){
    for(let i=0;i<(p.attack==='claw'?3:2);i++){ctx.beginPath();ctx.ellipse(x+i*7,y,12+i*4,24,Math.PI/5,-Math.PI*.65,Math.PI*.65);ctx.stroke();}
   }else if(['stomp','roots','inferno'].includes(p.attack)){
    ctx.beginPath();ctx.ellipse(mix(a.x0,destination,t),a.ground-5,18+t*60,4+t*14,0,0,Math.PI*2);ctx.stroke();
    for(let i=0;i<8;i++){const px=mix(a.x0,destination,(i+t)/9);const rise=(p.attack==='inferno'?28:16)*Math.sin((i+t)*2);ctx.beginPath();ctx.moveTo(px,a.ground);ctx.lineTo(px-4,a.ground-Math.abs(rise));ctx.lineTo(px+4,a.ground);ctx.stroke();}
   }else if(['shards','frost','scroll'].includes(p.attack)){
    for(let i=-1;i<=1;i++){const px=x+i*10,py=y+i*13;ctx.save();ctx.translate(px,py);ctx.rotate(p.attack==='scroll'?t*5:i*.35);if(p.attack==='scroll'){ctx.fillRect(-6,-9,12,18);ctx.clearRect(-3,-5,6,1);ctx.clearRect(-3,0,6,1);}else{ctx.beginPath();ctx.moveTo(-11,0);ctx.lineTo(7,-5);ctx.lineTo(11,0);ctx.lineTo(7,5);ctx.closePath();ctx.fill();}ctx.restore();}
   }else if(['rush','pounce'].includes(p.attack)){
    for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(x+25,y-12+i*12);ctx.lineTo(x-18,y-8+i*12);ctx.stroke();}
    ctx.beginPath();ctx.ellipse(x,a.ground-5,14,5,0,0,Math.PI*2);ctx.stroke();
   }else{
    for(let i=0;i<5;i++){const fade=1-i/6;ctx.globalAlpha=Math.sin(t*Math.PI)*fade*.7;ctx.beginPath();ctx.arc(x+i*9,y+Math.sin(now/180+i)*4,Math.max(2,8-i),0,Math.PI*2);ctx.fill();}
    if(p.attack==='soul'){ctx.beginPath();ctx.arc(x,y,16,-t*8,Math.PI-t*8);ctx.stroke();}
   }
  }
  if(this.phase==='hurt'){
   const t=limit(age/400);ctx.globalAlpha=1-t;ctx.lineWidth=2;ctx.beginPath();ctx.arc(a.x0,a.y0,8+t*30,0,Math.PI*2);ctx.stroke();for(let i=0;i<6;i++){const ang=i*Math.PI/3;ctx.beginPath();ctx.moveTo(a.x0+Math.cos(ang)*12,a.y0+Math.sin(ang)*12);ctx.lineTo(a.x0+Math.cos(ang)*(18+t*26),a.y0+Math.sin(ang)*(18+t*26));ctx.stroke();}
  }
  ctx.restore();
 }
 tick(now){
  if(this.dead)return;this.raf=requestAnimationFrame(this.tick);if(this.pausedAt)return;
  const age=now-this.started,duration=enemyDuration(this.profile,this.phase,this.kind);
  if(this.phase==='attack'&&!this.impacted&&age>duration*.62){this.impacted=true;if(this.kind==='counter')this.onImpact();}
  if(age>=duration&&!(this.holdUntil&&now<this.holdUntil)){
   if(this.phase==='anticipation')this.setPhase('attack');else if(this.phase==='attack')this.setPhase('recover');else if(!['defeat','retreat'].includes(this.phase))this.setPhase('idle');
  }
  if(this.phase==='idle'&&now>=this.nextAttack)this.attack('pressure');
  this.ctx.clearRect(0,0,640,640);const clock=now-this.offset;
  if(this.outgoing){const out=this.outgoing,elapsed=now-out.started;if(elapsed>enemyDuration(out.profile,out.phase))this.outgoing=null;else this.paintBody(out.profile,out.image,out.phase,elapsed,clock);}
  if(this.image)this.paintBody(this.profile,this.image,this.phase,now-this.started,clock,this.kind);
  this.paintFx(now);this.host.dataset.motionSample=[this.phase,Math.round(now-this.started)].join(':');
 }
 destroy(){this.dead=true;cancelAnimationFrame(this.raf);this.canvas.remove();this.fxCanvas.remove();this.label.remove();this.intent.remove();this.host.querySelector('.enemy-art-error')?.remove();}
}