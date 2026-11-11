import {actorCastPoint,actorGeometry} from './actor-point.mjs';
import {riftArt} from '../game-data/rift.mjs';
const glow=['#ff8a61','#ddf6ff','#85f1a0','#d6a0ff','#ffba54','#8ffff0','#ffd28a','#8cdeff','#fff281','#ffb1dc','#ffae6b','#d9adff','#81f6a8','#9edaff'];
const angle=[-21,-12,25,-25,-38,16,-5,-18,-32,12,-30,-18,22,-8];
export function celestialArt(outfitId,effectId='auto'){
 const id=effectId==='auto'?outfitId:effectId;
 const index=Number(id?.slice(1))-16;
 return Number.isInteger(index)&&index>=0&&index<glow.length?{src:riftArt('fx',id),color:glow[index],angle:angle[index]}:null;
}
export function castCelestial(stage,actor,target,art,finisher,emit){
 const from=actorCastPoint(stage,actor),to=target?(target.impactPoint?.()??actorGeometry(stage,target,[.5,.55])):null;
 const dir=actor.facing??1,range=finisher?1.48:1.16;
 const size=Math.min(stage.clientWidth*.55,Math.max(75,from.body*range));
 const attach=(className,x,y,diameter,frames,options)=>{
  const el=document.createElement('i'),img=document.createElement('img');img.src=art.src;img.alt='';el.className=className;el.dataset.signature=actor.id;el.setAttribute('aria-hidden','true');
  Object.assign(el.style,{left:x+'px',top:y+'px',width:diameter+'px',height:diameter+'px'});el.style.setProperty('--light-color',art.color);
  el.append(img);stage.append(el);const animation=el.animate(frames,options);animation.onfinish=animation.oncancel=()=>el.remove();emit(animation,el);
 };
 const rotate=art.angle*dir,scaleX=dir<0?-1:1;
 attach('celestial-light',from.x,from.y,size,[
  {transform:`translate(-50%,-50%) scale(${scaleX*.33},.33) rotate(${rotate-13}deg)`,opacity:0},
  {transform:`translate(calc(-50% + ${size*dir*.20}px),-53%) scale(${scaleX},1) rotate(${rotate}deg)`,opacity:.95,offset:.38},
  {transform:`translate(calc(-50% + ${size*dir*.52}px),-57%) scale(${scaleX*1.17},1.17) rotate(${rotate+15}deg)`,opacity:0}
 ],{duration:finisher?820:630,easing:'cubic-bezier(.22,.6,.28,1)',fill:'both'});
 if(to)attach('celestial-impact',to.x,to.y,Math.min(size*1.15,Math.max(86,to.body*1.5)),[
  {transform:'translate(-50%,-50%) scale(.25)',opacity:0},
  {transform:'translate(-50%,-50%) scale(.84)',opacity:.9,offset:.28},
  {transform:'translate(-50%,-50%) scale(1.24)',opacity:0}
 ],{duration:finisher?560:440,delay:130,fill:'both'});
}