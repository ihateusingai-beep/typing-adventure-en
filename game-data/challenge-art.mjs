// Shared painted locations for selection, briefing and the live trial arena.
const rows=[['forest','林間符印','#9bd9af'],['frozen','踏雲越嶺','#aadcf4'],['cave','石窟護行','#9bcfdd'],['ruins','重拾劍訣','#d5c1ef'],['volcano','五王試煉','#efb08b']];
export const TRIAL_ART=rows.map(([id,title,accent],index)=>({id,title,accent,index,scene:'TRIAL_'+index,src:'assets/v3/challenges/'+id+'.webp',card:'assets/v3/challenges/'+id+'-card.webp',mark:'assets/v3/challenges/marks/'+id+'.webp'}));
export const trialArtFor=index=>TRIAL_ART[Math.min(4,Math.max(0,Math.trunc(Number(index)||0)))];
export const TRIAL_SCENES=Object.fromEntries(TRIAL_ART.map(a=>[a.scene,a.src]));
export const trialMarkHTML=index=>`<img class="trial-mark" src="${trialArtFor(index).mark}" alt="" aria-hidden="true" width="40" height="40">`;