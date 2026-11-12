import {FORGE_ITEMS,CRAFT_COST,UPGRADE_COSTS,forgeLevel,riftArt} from '../game-data/rift.mjs';
import {ALL_TREASURES,availableTreasures,treasureArt} from '../game-data/spirit-treasures.mjs';
import {effectSignature} from '../game-data/signature-arts.mjs';
import {iconHTML} from './icons.mjs';
import {availableEffects,availableAttacks,availableOutfits} from './core.mjs';
import {outfitThumbnail} from './media.mjs';
import {DRAW_POOL,ordinaryDrawPool,DRAW_COST,EFFECTS,ATTACK_STYLES,LIMITED_POOL,limitedProgress} from './collection.mjs';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const gemIcon=iconHTML('gem');
export function collectionTabs(tab,save){
 // SEN 課室：只留衣裝 + 品格寶物（祈願／鑄靈／特效／流派收埋）
 const tabs=[['outfits','換衫'],['treasures','品格寶物']];
 const safe=tabs.some(([id])=>id===tab)?tab:'outfits';
 return `<div class="collection-heading"><label class="catalog-select">衣櫃<select data-wardrobe-tab>${tabs.map(([id,label])=>`<option value="${id}" ${safe===id?'selected':''}>${label}</option>`).join('')}</select></label><span class="stone-wallet" aria-label="${save.collection.stones} 粒練習星">${gemIcon}<b>${save.collection.stones}</b><small class="stone-label">練習星</small></span></div>`;
}
const forgeButton=(kind,id,text,disabled=false)=>`<button class="secondary" data-action="forge-item" data-kind="${kind}" data-id="${id}" ${disabled?'disabled':''}>${text}</button>`;
function forgeBody(save){
 const c=save.collection,f=c.forge,armor=availableOutfits(save).find(o=>o.id===save.equippedOutfitId);
 const relic=availableTreasures(save).find(t=>t.id===save.equippedTreasureId);
 const levelCard=(kind,item)=>{
  if(!item||item.id==='none')return '<article><b>先在品格寶物選單帶一件。</b></article>';
  const level=forgeLevel(f,kind,item.id),cost=UPGRADE_COSTS[level];
  return `<article><b>${esc(item.name)} · ${level}/3 級</b><small>${kind==='armor'?'每級增加 12 氣血，目前 +'+(12*level):'每級提高追加傷害、回復或護盾，依原本能力而定。'}</small>${forgeButton(kind,item.id,cost?'強化 · '+cost+' 靈石':'已滿級',!cost||c.stones<cost)}</article>`;
 };
 const groups=[['outfit','秘境衣裝'],['relic','秘境寶物'],['charm','護符']];
 return `<div class="chapter">異獸秘境 · 靈石工坊</div><h1 class="section-title">鑄靈與強化</h1><p class="small">強化只在異獸秘境生效。衣裝、品格寶物和護符可以自由搭配。</p><div class="forge-levels">${levelCard('armor',armor)}${levelCard('relic',relic)}</div>${groups.map(([kind,label])=>`<details class="forge-group" ${kind==='outfit'?'open':''}><summary>${label} · ${FORGE_ITEMS.filter(i=>i.kind===kind&&f.crafted.includes(i.key)).length}/${FORGE_ITEMS.filter(i=>i.kind===kind).length}</summary><div class="forge-stock">${FORGE_ITEMS.filter(i=>i.kind===kind).map(i=>{
  const owned=f.crafted.includes(i.key),src=kind==='outfit'?outfitThumbnail(i.id):riftArt(kind,i.id);
  return `<article><img src="${src}" alt="" loading="lazy"><div><b>${esc(i.name)}</b><small>${esc(i.description)}</small></div>${!owned?forgeButton('craft',i.key,CRAFT_COST+' 靈石',c.stones<CRAFT_COST):kind==='charm'?forgeButton('charm',f.charm===i.id?'none':i.id,f.charm===i.id?'卸下':'裝上'):kind==='outfit'?`<button class="secondary" data-action="outfit" data-id="${i.id}">預覽換裝</button>`:`<button class="secondary" data-action="equip-treasure" data-id="${i.id}" ${save.equippedTreasureId===i.id?'disabled':''}>${save.equippedTreasureId===i.id?'已攜帶':'攜帶'}</button>`}</article>`;
 }).join('')}</div></details>`).join('')}<button class="text-link" data-action="rift">前往異獸秘境 →</button>`;
}
export function collectionBody(save,tab){
 const c=save.collection;
 if(tab==='forge')return forgeBody(save);
 const wishTabs=limited=>`<div class="outfit-filters wish-pool-tabs" role="group" aria-label="祈願獎池"><button data-action="collection-tab" data-id="draw" aria-pressed="${!limited}">一般祈願</button><button data-action="collection-tab" data-id="limited-draw" aria-pressed="${limited}">${iconHTML('gift')}限定祈願</button></div>`;
 if(tab==='limited-draw'){
  const p=limitedProgress(save),done=p.owned===p.total,canDraw=p.unlocked&&!done&&c.stones>=DRAW_COST;
  const status=done?'五套限定已集齊。':!p.unlocked?'集滿原有服裝後，開放限定祈願。':c.stones<DRAW_COST?'靈石不足，完成無盡挑戰可獲得。':'每抽必得一套尚未擁有的限定服裝。';
  return `${wishTabs(true)}<div class="chapter">收藏家限定 · ${p.owned} / ${p.total} 套</div><h1 class="section-title">天衣秘藏</h1><div class="limited-progress"><b>原有服裝 ${p.baseOwned} / ${p.baseTotal}</b><progress value="${p.baseOwned}" max="${p.baseTotal}" aria-label="原有服裝收集進度"></progress></div><p class="wish-note" role="status">${status}</p><div class="limited-lineup">${LIMITED_POOL.map(item=>`<button data-action="outfit" data-id="${item.target}" class="limited-wardrobe-card"><img src="${outfitThumbnail(item.target)}" alt="" loading="lazy"><b>${esc(item.name)}</b><small>${c.items.includes(item.id)?'已收藏':'預覽'}</small></button>`).join('')}</div><button class="primary wish-button" data-action="draw-item" data-pool="limited" ${canDraw?'':'disabled'}>${gemIcon}${done?'限定已集齊':!p.unlocked?'限定祈願未開放':`使用 ${DRAW_COST} 靈石 · 抽取限定`}</button><p class="small">原有服裝含 8 套劇情衣裝及 8 套一般祈願衣裝。限定池不重複，只用遊戲靈石。</p>`;
 }
 if(tab==='treasures'){const owned=new Set(availableTreasures(save).map(t=>t.id));return `<div class="chapter">品格寶物 · 過關會解鎖</div><h1 class="section-title">帶一件品格寶物</h1><p class="small">完成旅程章節就會有。一次帶一件就得。</p><div class="treasure-grid">${ALL_TREASURES.filter(t=>!t.forge).map(t=>`<button class="treasure-card ${owned.has(t.id)?'':'locked'}" data-action="equip-treasure" data-id="${t.id}" aria-pressed="${save.equippedTreasureId===t.id}" ${owned.has(t.id)?'':'disabled'} style="--treasure-color:${t.color}"><img src="${treasureArt(t.id)}" alt="" loading="lazy"><span><b>${t.id==='none'?'唔帶':t.name}</b><em>${t.role}</em><small>${t.description}</small><i class="loadout-state">${iconHTML(owned.has(t.id)?save.equippedTreasureId===t.id?'check':'gem':'lock')}${owned.has(t.id)?save.equippedTreasureId===t.id?'而家帶緊':'可以帶':t.id==='none'?'':'完成第 '+t.chapter+' 章'}</i></span></button>`).join('')}</div>`;}
 if(tab==='effects'){const owned=new Set(availableEffects(save).map(e=>e.id));return `<div class="chapter">服裝與特效，分開搭配</div><h1 class="section-title">裝上你的光芒</h1><p class="small">保留喜歡的衣服，再選一種劍光與護環。</p><div class="effect-grid">${EFFECTS.map(e=>`<button class="effect-option ${owned.has(e.id)?'':'locked'}" data-action="equip-effect" data-id="${e.id}" aria-pressed="${save.equippedEffectId===e.id}" ${owned.has(e.id)?'':'disabled'}><img class="effect-swatch painted-effect-icon" src="${e.id==='auto'&&save.equippedOutfitId==='O00'?'assets/v3/ui/icons/challenges.webp':e.icon??effectSignature(e.id,save.equippedOutfitId).icon}" alt="" loading="lazy"><b>${esc(e.id==='auto'&&save.equippedOutfitId==='O00'?'不附加攻擊特效':e.name)}</b><small class="loadout-state">${iconHTML(owned.has(e.id)?save.equippedEffectId===e.id?'check':'spell':'lock')}${owned.has(e.id)?save.equippedEffectId===e.id?'已安裝':'可以安裝':e.item?'靈石祈願取得':'取得對應服裝後開放'}</small></button>`).join('')}</div>`;}
 if(tab==='attacks'){const owned=new Set(availableAttacks(save).map(a=>a.id));return `<div class="chapter">你的出招方式</div><h1 class="section-title">選一門流派</h1><p class="small">揮劍、施法或御符；按對才出招，成績計算相同。</p><div class="attack-options">${ATTACK_STYLES.map(a=>`<button class="attack-option ${owned.has(a.id)?'':'locked'}" data-action="equip-attack" data-id="${a.id}" aria-pressed="${save.attackStyle===a.id}" ${owned.has(a.id)?'':'disabled'}><span class="attack-emblem style-${a.id}" aria-hidden="true">${iconHTML(a.id==='sword'?'challenges':a.id)}</span><span><b>${a.name}</b><small>${a.description}</small><em class="loadout-state">${iconHTML(owned.has(a.id)?save.attackStyle===a.id?'check':'challenges':'lock')}${owned.has(a.id)?save.attackStyle===a.id?'已安裝':'可以安裝':'靈石祈願取得'}</em></span></button>`).join('')}</div>`;}
 const {pool,firstOutfit}=ordinaryDrawPool(c);
 const totalWeight=pool.reduce((total,item)=>total+item.weight,0);
 const collected=DRAW_POOL.filter(item=>c.items.includes(item.id)).length;
 const done=collected===DRAW_POOL.length;
 const status=done?'普通祈願已全部集齊。':c.stones<DRAW_COST?'每回達標的挑戰可獲得 50 靈石。':firstOutfit?'這次抽取保證獲得一套新服裝。':'每次都會抽到尚未收藏的獎品。';
 return `${wishTabs(false)}<div class="chapter">${collected} / ${DRAW_POOL.length} 件珍藏</div><h1 class="section-title">靈石祈願</h1><p class="small">普通祈願可抽到八套女俠布衣，以及其他衣裝、特效與流派。</p><div class="wish-altar" aria-hidden="true">${gemIcon}<i></i><i></i></div><button class="primary wish-button" data-action="draw-item" ${done||c.stones<DRAW_COST?'disabled':''}>${gemIcon}${done?'已全部集齊':`使用 ${DRAW_COST} 靈石 · 抽取一次`}</button><p class="wish-note" role="status">${status}</p>${done?'':`<button class="text-link" data-action="first-challenge">前往挑戰賺取靈石 →</button>`}<details class="wish-rules"><summary>查看獎池與本次機率</summary><p>已收藏的獎品會從獎池移除。抽滿後即可保留剩餘的靈石。</p><ul>${DRAW_POOL.map(item=>`<li><span>${esc(item.name)} · ${item.rarity}</span><b>${c.items.includes(item.id)?'已收藏':pool.includes(item)?(item.weight/totalWeight*100).toFixed(2)+'%':'首抽後開放'}</b></li>`).join('')}</ul></details>`;
}