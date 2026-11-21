import {ALL_TREASURES,availableTreasures,treasureArt} from '../game-data/spirit-treasures.mjs';
import {iconHTML} from './icons.mjs';
import {availableOutfits} from './core.mjs';
import {outfitThumbnail} from './media.mjs';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const gemIcon=iconHTML('gem');
export function collectionTabs(tab,save){
 // SEN 課室：只留衣裝 + 品格寶物（祈願／鑄靈／特效／流派收埋）
 const tabs=[['outfits','換衫'],['treasures','品格寶物']];
 const safe=tabs.some(([id])=>id===tab)?tab:'outfits';
 return `<div class="collection-heading"><label class="catalog-select">衣櫃<select data-wardrobe-tab>${tabs.map(([id,label])=>`<option value="${id}" ${safe===id?'selected':''}>${label}</option>`).join('')}</select></label><span class="stone-wallet" aria-label="${save.collection.stones} 粒練習星">${gemIcon}<b>${save.collection.stones}</b><small class="stone-label">練習星</small></span></div>`;
}
export function collectionBody(save,tab){
 if(tab==='treasures'){
  const owned=new Set(availableTreasures(save).map(t=>t.id));
  return `<div class="chapter">品格寶物 · 過關會解鎖</div><h1 class="section-title">帶一件品格寶物</h1><p class="small">完成旅程章節就會有。一次帶一件就得。</p><div class="treasure-grid">${ALL_TREASURES.filter(t=>!t.forge).map(t=>`<button class="treasure-card ${owned.has(t.id)?'':'locked'}" data-action="equip-treasure" data-id="${t.id}" aria-pressed="${save.equippedTreasureId===t.id}" ${owned.has(t.id)?'':'disabled'} style="--treasure-color:${t.color}"><img src="${treasureArt(t.id)}" alt="" loading="lazy"><span><b>${t.id==='none'?'唔帶':t.name}</b><em>${t.role}</em><small>${t.description}</small><i class="loadout-state">${iconHTML(owned.has(t.id)?save.equippedTreasureId===t.id?'check':'gem':'lock')}${owned.has(t.id)?save.equippedTreasureId===t.id?'而家帶緊':'可以帶':t.id==='none'?'':'完成第 '+t.chapter+' 章'}</i></span></button>`).join('')}</div>`;
 }
 // default / unknown tabs → empty (outfits rendered by main wardrobe)
 return `<p class="small">揀上面「換衫」睇衫。</p>`;
}
