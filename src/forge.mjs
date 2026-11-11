import {availableOutfits} from './core.mjs';
import {availableTreasures} from '../game-data/spirit-treasures.mjs';
import {FORGE_ITEMS,UPGRADE_COSTS,CRAFT_COST,forgeLevel} from '../game-data/rift.mjs';
import {normalizeCollection} from './collection.mjs';

export function forgeAction(save,action,id){
 const c=normalizeCollection(save.collection),f=c.forge;
 let price=0;
 if(action==='craft'){
  if(!FORGE_ITEMS.some(i=>i.key===id)||f.crafted.includes(id))throw Error('這件物品無法再次鑄造。');
  price=CRAFT_COST;f.crafted.push(id);
 }else if(action==='armor'||action==='relic'){
  const allowed=action==='armor'?availableOutfits(save):availableTreasures(save);
  if(id==='none'||!allowed.some(x=>x.id===id))throw Error('請先取得這件裝備。');
  const level=forgeLevel(f,action,id);
  if(level===UPGRADE_COSTS.length)throw Error('已達強化上限。');
  price=UPGRADE_COSTS[level];f[action+(level+1)].push(id);
 }else if(action==='charm'){
  if(id!=='none'&&!f.crafted.includes('charm-'+id))throw Error('請先鑄造此護符。');
  f.charm=id;
 }else throw Error('未知的鑄造項目。');
 if(c.stones<price)throw Error('靈石不足，可前往無盡試煉或異獸秘境。');
 c.stones-=price;c.spent+=price;c.revision++;return {collection:c,price};
}