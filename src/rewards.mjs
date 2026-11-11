import {NODES,availableOutfits,canStartNode,normalizeSave} from './core.mjs';
export const unseenOutfits=save=>availableOutfits(save).filter(o=>o.id!=='O00'&&!save.seenOutfitIds?.includes(o.id));
export function markOutfitSeen(save,id){const next=normalizeSave(save);if(availableOutfits(next).some(o=>o.id===id))next.seenOutfitIds=[...new Set([...next.seenOutfitIds,id])];return next;}
export function nextMissionId(save,current){const index=NODES.findIndex(n=>n.id===current);if(index<0)return null;const next=NODES[index+1];return next&&canStartNode(save,next.id)?next.id:null;}
// Accumulate foreground time only; callers also reset the clock on visibility changes.
export class AdvanceClock{
 constructor(seconds=6,now=performance.now()){this.remaining=seconds*1000;this.last=now;}
 step(now,{paused=false}={}){if(!paused)this.remaining=Math.max(0,this.remaining-Math.max(0,now-this.last));this.last=now;return Math.ceil(this.remaining/1000);}
}