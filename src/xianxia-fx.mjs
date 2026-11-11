import {celestialArt,castCelestial} from './celestial-light.mjs';
import {TreasureFx} from './treasure-fx.mjs';
import {actorPoint,actorCastPoint,actorGeometry} from './actor-point.mjs';
import {effectSignature,attackEffectEnabled} from '../game-data/signature-arts.mjs';
import {COMBAT_FX,impactTheme} from '../game-data/combat-fx.mjs';
export function effectFrame(elapsed,life,peakAt,count=4){if(!peakAt||count!==4)return Math.min(count-1,Math.floor(elapsed/life*count));return elapsed<peakAt*.35?0:elapsed<peakAt?1:elapsed<peakAt+(life-peakAt)*.55?2:3;}
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const smooth=n=>{n=clamp(n);return n*n*(3-2*n);};
// Four drawings overlap around the release beat, instead of flashing as stickers.
export function effectBlend(elapsed,life,peakAt){
 const peak=clamp(peakAt??life*.42,60,life*.65),keys=[0,peak*.6,peak,peak+(life-peak)*.64];
 let frame=0;while(frame<3&&elapsed>=keys[frame+1])frame++;
 const mix=frame<3?smooth((elapsed-keys[frame])/(keys[frame+1]-keys[frame])):0;
 return {frame,next:Math.min(3,frame+1),mix};
}
export function effectEnvelope(elapsed,life,peakAt){
 const peak=peakAt??life*.42,t=clamp(elapsed/life),grow=smooth(elapsed/Math.max(90,peak));
 return {opacity:smooth(elapsed/Math.max(120,peak*.65))*(1-smooth((t-.56)/.44))*.9,scale:.28+.72*grow+.12*smooth((elapsed-peak)/(life-peak)),release:smooth((elapsed-peak*.76)/(life-peak*.76)),blur:2.2*(1-grow)+2.4*smooth((t-.7)/.3)};
}
export function effectRegistration(asset,body,finisher=false){
 const [left,top,right,bottom]=asset.inkBounds??[24,24,360,360],cell=asset.cellSize??384,longest=Math.max(right-left,bottom-top);
 return {size:body*(finisher?1.04:.9)*cell/longest,pivot:[(left+(right-left)*.12)/cell,(top+bottom)/2/cell]};
}
const ROOT='assets/v3/xianxia/',cache=new Map();
const lightColors={blade:'#f2dc9d',frost:'#a8e6ff',thunder:'#c1abff',flame:'#ffae78'};
function preload(src){
 if(!cache.has(src)){const task=new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(src);img.onerror=()=>reject(Error('Effect image'));img.src=src;});cache.set(src,task);task.catch(()=>cache.delete(src));}
 return cache.get(src);
}
// Painted art is presentation only; its frames never award damage or points.
export class PaintedFx{
 constructor(stage,{reduced=false}={}){this.stage=stage;this.reduced=reduced;this.items=[];this.lights=[];this.loaded=new Set();this.dead=false;this.pausedAt=0;this.ready=Promise.resolve();this.tick=this.tick.bind(this);this.raf=requestAnimationFrame(this.tick);}
 point(actor){return actorPoint(this.stage,actor);}
 prepare(hero){
  if(this.relic?.hero!==hero){this.relic?.destroy();this.relic=new TreasureFx(this.stage,hero,{reduced:this.reduced});}
  this.effectHero=hero;this.impactTheme=impactTheme(hero);if(this.reduced)return this.ready;
  const art=effectSignature(hero.effectId,hero.id),sources=[art.fx.src,COMBAT_FX.ward.src,COMBAT_FX[this.impactTheme].src];
  const sky=celestialArt(hero.id,hero.effectId);if(sky)sources.push(sky.src);
  this.ready=Promise.allSettled([...sources.map(preload),this.relic.ready]).then(results=>{
   results.forEach((r,i)=>{if(r.status==='fulfilled'&&sources[i])this.loaded.add(sources[i]);});
   this.stage.dataset.paintedReady=String(this.loaded.has(art.fx.src));this.stage.dataset.combatReady=String(sources.slice(1).every(src=>this.loaded.has(src)));this.stage.dataset.signatureTheme=art.id;
   const preview=this.stage.closest('.costume-preview');if(preview)preview.dataset.paintedReady=this.stage.dataset.paintedReady;
  });return this.ready;
 }
 bounds(){const outer=this.stage.getBoundingClientRect(),field=this.stage.querySelector('.story-actors'),r=field?.getBoundingClientRect();return r?{left:8,right:outer.width-8,top:r.top-outer.top-5,bottom:r.bottom-outer.top+8}:{left:8,right:outer.width-8,top:8,bottom:outer.height-8};}
 emit(name,actor,{life=560,size=190,row=null,owner='hero',kind='strike',dx=0,dy=0,asset=null,travel=0,signature=null,peakAt=null,pivot=[.5,.5],attached=false,combat=null,follow=false,center=null,delay=0}={}){
  if(this.dead||this.reduced)return;
  while(this.items.length>=8)this.items.shift().el.remove();
  const bounds=this.bounds(),limit=Math.min(bounds.right-bounds.left,bounds.bottom-bounds.top);
  const fit=this.stage.matches('#battle-stage,#arena,.rift-stage,.pk-duel-stage');
  if(fit||!attached&&!combat)size=Math.min(size,Math.max(32,limit*(combat?.82:.94)));
  const p=center??(follow?actorGeometry(this.stage,actor,[.5,.65]):attached?actorCastPoint(this.stage,actor):this.point(actor)),el=document.createElement('i'),columns=asset?.columns??4,rows=asset?.rows??4,count=asset?.count??(row===null?16:4);el.className='painted-fx';el.setAttribute('aria-hidden','true');
  Object.assign(el.dataset,{owner,kind,atlas:name,frame:'0'});if(signature){el.dataset.signature=signature;if(actor?.facing===-1)el.dataset.facing='left';}
  if(combat)el.dataset.combat=combat;
  Object.assign(el.style,{width:size+'px',height:size+'px',opacity:'0',transformOrigin:`${pivot[0]*100}% ${pivot[1]*100}%`});
  const layers=Array.from({length:signature||combat?2:1},()=>{const layer=document.createElement('i');layer.className='painted-fx-frame';Object.assign(layer.style,{backgroundImage:`url('${asset?.src??ROOT+name+'.webp'}')`,backgroundSize:`${columns*100}% ${rows*100}%`});el.append(layer);return layer;});
  this.stage.append(el);const f={el,layers,actor,attached,pivot,combat,follow,start:performance.now()+delay,life,count,row,columns,rows,bounds,fit,size,x:p.x+dx,y:p.y+dy,travel,peakAt};this.items.push(f);this.place(f,0,{scale:.28,release:0});
 }
 place(f,t,envelope){
  const {scale,release}=envelope;
  if(f.combat){
   if(f.follow){const p=actorGeometry(this.stage,f.actor,[.5,.65]);f.x=p.x;f.y=p.y;}
   const zoom=f.combat==='ward'?.42+.58*smooth(t/.3):.38+.62*smooth(t/.22)+.2*smooth((t-.3)/.7);
   const half=f.fit?f.size*zoom/2:0;
   f.el.style.left=(f.fit?clamp(f.x,f.bounds.left+half,f.bounds.right-half):f.x)+'px';
   f.el.style.top=(f.fit?clamp(f.y,f.bounds.top+half,f.bounds.bottom-half):f.y)+'px';
   f.el.style.transform=`translate(-50%,-50%) scale(${zoom})`;
  }else if(f.attached){
   // Follow the casting hand during windup, then let the released art travel on.
   if(!f.released){const p=actorCastPoint(this.stage,f.actor);f.x=p.x;f.y=p.y;if(t*f.life>=f.peakAt*.76)f.released=true;}
   const x=f.x+f.travel*release,y=f.y-Math.sin(release*Math.PI)*f.travel*.12;
   const extent=f.size*scale;
   const [px,py]=f.pivot;
   f.el.style.left=(f.fit?clamp(x,f.bounds.left+extent*px,f.bounds.right-extent*(1-px)):x)+'px';
   f.el.style.top=(f.fit?clamp(y,f.bounds.top+extent*py,f.bounds.bottom-extent*(1-py)):y)+'px';
   f.el.dataset.phase=f.released?'release':'gather';
   f.el.style.transform=`translate(${-f.pivot[0]*100}%,${-f.pivot[1]*100}%) scale(${scale})`;
  }else{
   const half=f.size/2;f.el.style.left=clamp(f.x+f.travel*t,f.bounds.left+half,f.bounds.right-half)+'px';f.el.style.top=clamp(f.y,f.bounds.top+half,f.bounds.bottom-half)+'px';f.el.style.transform=`translate(-50%,-50%) scale(${.7+.3*smooth(t/.35)})`;
  }
 }
 setOpponent(enemy){this.opponent=enemy;if(this.relic)this.relic.target=enemy;}
 treasure(kind){this.relic?.proc(kind);}
 strike(hero,style='sword',finisher=false){
  this.relic?.strike(finisher);
  if(!attackEffectEnabled(hero,style))return;
  const art=effectSignature(hero.effectId,hero.id),body=actorCastPoint(this.stage,hero).body;
  this.lastSignature=art;
  const light=celestialArt(hero.id,hero.effectId);
  if(light&&this.loaded.has(light.src)&&!this.reduced){
   this.lights=this.lights.filter(x=>x.el.isConnected);
   while(this.lights.length>=6){const old=this.lights.shift();old.animation.cancel();old.el.remove();}
   castCelestial(this.stage,hero,this.opponent,light,finisher,(animation,el)=>this.lights.push({animation,el}));
   return;
  }
  if(this.loaded.has(art.fx.src)){
   const registration=effectRegistration(art.fx,body,finisher),life=finisher?780:560,elapsed=performance.now()-(hero.started||performance.now()),peakAt=clamp((hero.duration||480)*.5-elapsed,110,life*.5);
   if(hero.facing===-1)registration.pivot[0]=1-registration.pivot[0];
   this.emit('signature-'+art.id,hero,{asset:art.fx,signature:art.id,...registration,attached:true,life,travel:body*(hero.facing??1)*(style==='sword'?.22:.32),peakAt,kind:finisher?'finisher':'strike'});return;
  }
  this.emit(style==='sword'?'sword_arc':'relic-arts',hero,{row:style==='sword'?null:style==='talisman'?1:3,size:body*.9,life:finisher?650:450});
 }
 impactLight(center,theme,finisher,delay){
  if(this.dead||this.reduced)return;
  this.lights=this.lights.filter(x=>x.el.isConnected);
  while(this.lights.length>4){const old=this.lights.shift();old.animation.cancel();old.el.remove();}
  const mask=document.createElement('i'),sparks=document.createElement('i');
  mask.className='combat-light-mask';sparks.className='combat-light-particles';
  const tint=lightColors[theme],reach=clamp(center.body*(finisher?.8:.58),38,132);
  for(const el of [mask,sparks]){
   el.setAttribute('aria-hidden','true');
   el.style.setProperty('--light-x',center.x+'px');el.style.setProperty('--light-y',center.y+'px');
   el.style.setProperty('--light-color',tint);this.stage.append(el);
  }
  const count=finisher?13:8;
  for(let i=0;i<count;i++){
   const angle=(i/count)*Math.PI*2+.13,range=reach*(.52+(i%4)*.16);
   const spark=document.createElement('b');
   spark.style.setProperty('--spark-x',Math.cos(angle)*range+'px');
   spark.style.setProperty('--spark-y',Math.sin(angle)*range*.76+'px');
   spark.style.setProperty('--spark-size',2+i%3+'px');
   spark.style.setProperty('--spark-angle',angle+'rad');
   sparks.append(spark);
  }
  const play=(el,frames,duration)=>{
   const animation=el.animate(frames,{delay,duration,fill:'backwards',easing:'ease-out'});
   animation.onfinish=()=>el.remove();
   if(this.pausedAt)animation.pause();
   this.lights.push({animation,el});
  };
  play(mask,[{opacity:0},{opacity:finisher?.8:.6,offset:.2},{opacity:0}],finisher?490:370);
  play(sparks,[{opacity:0,transform:'scale(.16)'},{opacity:.95,transform:'scale(.47)',offset:.22},{opacity:0,transform:'scale(1.25)'}],finisher?540:420);
 }
 impact(enemy,finisher=false,{delay=0}={}){
  const theme=this.impactTheme??'blade',asset=COMBAT_FX[theme],center=enemy.impactPoint?.()??{...this.point(enemy),body:(enemy.el?.getBoundingClientRect().height??180)*.75};
  this.impactLight(center,theme,finisher,delay);
  if(!this.loaded.has(asset.src)){this.emit('hit_burst',enemy.el??enemy.host??enemy,{owner:'impact',kind:'hit',size:finisher?230:150,life:420,delay});return;}
  const [l,t,r,b]=asset.inkBounds,size=center.body*(finisher?1.85:1.4)*asset.cellSize/Math.max(r-l,b-t);
  this.emit('impact-'+theme,enemy,{asset,combat:theme,center,size,owner:'impact',kind:finisher?'finishing-hit':'hit',life:finisher?630:470,peakAt:90,delay});
 }
 guard(hero){
  this.clear();const asset=COMBAT_FX.ward,body=actorCastPoint(this.stage,hero).body,[l,t,r,b]=asset.inkBounds;
  if(this.loaded.has(asset.src)){this.emit('jade-ward',hero,{asset,combat:'ward',follow:true,size:body*1.62*asset.cellSize/Math.max(r-l,b-t),life:760,peakAt:190,kind:'guard'});return;}
  this.emit('ward',hero,{size:body*1.5,life:650,kind:'guard'});
 }
 hurt(hero){this.clear();this.emit('hit_burst',hero,{owner:'enemy',kind:'hurt',size:145,life:380});}
 victory(hero){this.clear();this.strike(hero,hero.attackStyle,true);}
 preview(hero,motion,style){this.clear();if(motion==='defense')this.guard(hero);else this.strike(hero,motion==='cast'?'spell':motion==='seal'?'talisman':style,true);}
 tick(now){
  if(this.dead)return;this.raf=requestAnimationFrame(this.tick);if(this.pausedAt)return;
  this.items=this.items.filter(f=>{
   if(now<f.start)return true;
   const elapsed=now-f.start,t=elapsed/f.life;if(t>=1){f.el.remove();return false;}
   const blended=f.el.dataset.signature||f.combat?effectBlend(elapsed,f.life,f.peakAt):{frame:effectFrame(elapsed,f.life,f.peakAt,f.count),next:0,mix:0},envelope=effectEnvelope(elapsed,f.life,f.peakAt);
   if(f.combat&&f.combat!=='ward')envelope.opacity=smooth(elapsed/45)*(1-smooth((t-.38)/.62));
   f.el.dataset.frame=String(blended.frame);f.el.dataset.blend=blended.mix.toFixed(3);
   f.layers.forEach((layer,i)=>{const frame=i?blended.next:blended.frame,column=frame%f.columns,row=f.row??Math.floor(frame/f.columns);layer.style.backgroundPosition=`${column/Math.max(1,f.columns-1)*100}% ${row/Math.max(1,f.rows-1)*100}%`;layer.style.opacity=String(i?blended.mix:1-blended.mix);});
   f.el.style.opacity=String(envelope.opacity);f.el.style.filter=`blur(${envelope.blur.toFixed(2)}px) drop-shadow(0 0 ${4+envelope.scale*3}px #d6fff038)`;this.place(f,t,envelope);return true;
  });
 }
 pause(){this.lights.forEach(x=>x.animation.pause());this.relic?.pause();if(!this.pausedAt)this.pausedAt=performance.now();}
 resume(){this.lights.forEach(x=>{if(x.el.isConnected)x.animation.play();});this.relic?.resume();if(!this.pausedAt)return;const d=performance.now()-this.pausedAt;this.items.forEach(f=>f.start+=d);this.pausedAt=0;}
 clear(){this.lights.forEach(x=>{x.animation.cancel();x.el.remove();});this.lights=[];this.relic?.clear();this.items.forEach(f=>f.el.remove());this.items=[];this.stage.querySelectorAll('[data-owner=hero][data-kind=projectile]').forEach(e=>e.remove());}
 destroy(){this.relic?.destroy();this.dead=true;cancelAnimationFrame(this.raf);this.clear();}
}