import {actorPoint,actorCastPoint} from './actor-point.mjs';
import {EFFECTS} from './collection.mjs';
import {OUTFITS} from './core.mjs';
const COLORS={dust:'#eed69a',bamboo:'#a3e7a3',wind:'#9de5e9',frost:'#a8d9ff',gold:'#ffdf87',ember:'#ffab73',moon:'#c7e9ff',star:'#d7b4ff'};
export function costumeStyle(element,id,effectId='auto'){const outfit=OUTFITS.find(o=>o.id===id)??OUTFITS[0];const effect=effectId==='auto'?outfit.effect:effectId;const color=EFFECTS.find(e=>e.id===effect)?.color??COLORS[effect]??'#eeb7e4';element.dataset.effect=effect;element.style.setProperty('--costume-color',color);return outfit;}
export const timeLabel=seconds=>{const n=Math.max(0,Math.ceil(seconds));return Math.floor(n/60).toString().padStart(2,'0')+':'+(n%60).toString().padStart(2,'0');};
export function launchProjectile(stage,from,target,style='sword',reduced=false){
 if(style==='sword'||reduced)return;const a=stage.getBoundingClientRect(),h=actorCastPoint(stage,from),e=target?actorPoint(stage,target):null;const x=h.x,y=h.y,tx=e?e.x:Math.min(a.width-25,x+140),ty=e?e.y:y-30;
 const effect=document.createElement('i');effect.className='combat-fx battle-wave '+(style==='spell'?'spell-projectile':'talisman-projectile');effect.setAttribute('aria-hidden','true');Object.assign(effect.dataset,{owner:'hero',kind:'projectile'});effect.innerHTML=style==='spell'?'<b></b>':'<b>敕</b><b>令</b><b>行</b>';effect.style.left=x+'px';effect.style.top=y+'px';effect.style.setProperty('--travel-x',tx-x+'px');effect.style.setProperty('--travel-y',ty-y+'px');effect.style.setProperty('--wave-angle','0rad');stage.append(effect);setTimeout(()=>effect.remove(),350);
}