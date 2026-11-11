import {ORDINARY_HEROINES} from '../game-data/ordinary-heroines.mjs';
import {passesChallenge,shouldGuideChallenge,CHALLENGE_REWARD_STONES} from './challenge-intro.mjs';
import {blankForge,normalizeForge,forgeSpent,riftReward,CELESTIAL_EFFECT_OUTFITS,riftArt} from '../game-data/rift.mjs';
import {LIMITED_COSTUMES} from '../game-data/limited-costumes.mjs';
// Free in-game collection. These are personal practice rewards, never purchases.
export const DRAW_COST=100,DUPLICATE_REFUND=30;
export const EFFECTS=[
 {id:'auto',name:'服裝原生特效',color:null,item:null},
 ...[['bamboo','竹葉流光','#a3e7a3','O01'],['ember','火羽劍芒','#ffab73','O05'],['wind','踏雲劍風','#9de5e9','O02'],['moon','月華漣漪','#c7e9ff','O06'],['frost','玄霜結界','#a8d9ff','O03'],['star','星河劍陣','#d7b4ff','O07'],['gold','天衡金印','#ffdf87','O04']].map(([id,name,color,outfit])=>({id,name,color,outfit})),
 {id:'lotus',name:'幽蓮花雨',color:'#f7afe3',item:'fx-lotus'},
 {id:'thunder',name:'紫霄雷紋',color:'#bbacff',item:'fx-thunder'},
 {id:'aurora',name:'流彩極光',color:'#91f7dc',item:'fx-aurora'},
 {id:'solar',name:'日輪金焰',color:'#ffd188',item:'fx-solar'},
 ...CELESTIAL_EFFECT_OUTFITS.map((outfit,index)=>({
  id:outfit.id,name:outfit.effectName,outfit:outfit.id,
  color:['#ffb376','#dcbdff','#9af9b7','#9edaff'][index],icon:riftArt('fx',outfit.id)
 }))
];
export const ATTACK_STYLES=[{id:'sword',name:'衣裝招式',description:'使用這套衣裝的專屬劍式或御筆招式。',item:null},{id:'spell',name:'星火法術',description:'法陣蓄光，飛出星火法球命中對手。',item:'attack-spell'},{id:'talisman',name:'御符術',description:'祭出三枚靈符，結成符印命中對手。',item:'attack-talisman'}];
const ORIGINAL_DRAW_POOL=[
 {id:'outfit-O08',kind:'outfit',name:'天符星師',target:'O08',weight:8,rarity:'珍稀'},
 {id:'outfit-O09',kind:'outfit',name:'幽蓮劍仙',target:'O09',weight:7,rarity:'珍稀'},
 ...[['O10','靈墨練氣'],['O11','青霄築基'],['O12','金闕丹心'],['O13','紫宸元嬰'],['O14','太虛化神'],['O15','九霄渡劫']].map(([target,name])=>({id:'outfit-'+target,kind:'outfit',name,target,weight:3,rarity:'仙途'})),
 ...[['lotus','幽蓮花雨',8],['thunder','紫霄雷紋',8],['aurora','流彩極光',8],['solar','日輪金焰',11]].map(([id,name,weight])=>({id:'fx-'+id,kind:'effect',name,target:id,weight,rarity:'特效'})),
 ...ATTACK_STYLES.filter(s=>s.item).map(s=>({id:s.item,kind:'attack',name:s.name,target:s.id,weight:16,rarity:'流派'}))
];
export const LIMITED_POOL=LIMITED_COSTUMES.map(({id,item,name})=>({id:item,kind:'outfit',name,target:id,rarity:'限定'}));
const CHAPTER_REWARD_NODES=['S01-04','S02-04','S03-05','S04-04','S05-05','S06-04','S07-03'];
export const DRAW_POOL=[
 ...ORIGINAL_DRAW_POOL,
 ...ORDINARY_HEROINES.map(outfit=>({id:outfit.item,kind:'outfit',name:outfit.name,target:outfit.id,weight:6,rarity:'普通'})),
];
const BASE_DRAW_OUTFITS=ORIGINAL_DRAW_POOL.filter(item=>item.kind==='outfit');
const ALL_DRAW_ITEMS=[...DRAW_POOL,...LIMITED_POOL];
export function limitedProgress(save){
 const items=save.collection?.items??[],nodes=save.completedNodeIds??[];
 const baseOwned=1+CHAPTER_REWARD_NODES.filter(id=>nodes.includes(id)).length+BASE_DRAW_OUTFITS.filter(item=>items.includes(item.id)).length;
 const baseTotal=1+CHAPTER_REWARD_NODES.length+BASE_DRAW_OUTFITS.length;
 const owned=LIMITED_POOL.filter(item=>items.includes(item.id)).length;
 return {baseOwned,baseTotal,owned,total:LIMITED_POOL.length,unlocked:baseOwned===baseTotal};
}
const int=(v,max=100000000)=>Math.min(max,Math.max(0,Math.round(Number(v)||0)));
export const blankCollection=()=>({revision:0,stones:0,earned:0,spent:0,refunds:0,draws:0,pity:0,items:[],claimedIds:[],lastDraw:null,forge:blankForge()});
export function normalizeCollection(raw={}){
 if(!raw||typeof raw!=='object')raw={};
 const c=blankCollection();c.revision=int(raw.revision);c.draws=int(raw.draws,100000);c.earned=int(raw.earned);c.forge=normalizeForge(raw.forge);c.spent=c.draws*DRAW_COST+forgeSpent(c.forge);c.refunds=Math.min(c.draws*DUPLICATE_REFUND,int(raw.refunds));c.stones=Math.max(0,c.earned-c.spent+c.refunds);c.pity=int(raw.pity,9);
 c.items=ALL_DRAW_ITEMS.filter(item=>Array.isArray(raw.items)&&raw.items.includes(item.id)).map(item=>item.id);
 c.claimedIds=[...new Set(Array.isArray(raw.claimedIds)?raw.claimedIds.filter(id=>typeof id==='string'&&id.length<=80):[])].slice(-64);
 const item=ALL_DRAW_ITEMS.find(item=>item.id===raw.lastDraw?.id&&c.items.includes(item.id));if(item)c.lastDraw={id:item.id,duplicate:raw.lastDraw.duplicate===true,guaranteed:raw.lastDraw.guaranteed===true};
 if(raw.firstChallengeReward===true)c.firstChallengeReward=true;
 return c;
}
export function endlessGrade(run){const score=int(run.score),accuracy=int(run.accuracy,100);return score>=6000&&accuracy>=95?'S':score>=3000&&accuracy>=90?'A':score>=1200&&accuracy>=80?'B':score>=300&&accuracy>=60?'C':'D';}
export function endlessReward(run){const grade=endlessGrade(run);const stones=int(run.attempted)>=10?Math.min(300,20+Math.floor(int(run.score)/100)+({S:100,A:65,B:35,C:15,D:0})[grade]):0;return {grade,stones};}
export function claimRun(collection,run){
 const c=normalizeCollection(collection),id=String(run.resultId??'');if(!id||id.length>80)throw Error('這次試煉紀錄無法辨識。');
 const reward=endlessReward(run);if(c.claimedIds.includes(id))return {collection:c,...reward,stones:0,alreadyClaimed:true};
 c.earned+=reward.stones;c.stones+=reward.stones;c.claimedIds=[...c.claimedIds,id].slice(-64);c.revision++;return {collection:c,...reward,alreadyClaimed:false};
}
export function claimChallengeRun(save,run){
 const collection=normalizeCollection(save.collection);
 const id='challenge:'+String(run.resultId??'');
 if(id==='challenge:'||id.length>80||!passesChallenge(run))throw Error('這回挑戰未達標，無法領取靈石。');
 if(collection.claimedIds.includes(id))return {collection,stones:0,alreadyClaimed:true};
 if(shouldGuideChallenge(save))collection.firstChallengeReward=true;
 collection.earned+=CHALLENGE_REWARD_STONES;
 collection.stones+=CHALLENGE_REWARD_STONES;
 collection.revision++;
 collection.claimedIds=[...collection.claimedIds,id].slice(-64);
 return {collection,stones:CHALLENGE_REWARD_STONES,alreadyClaimed:false};
}
export function claimRift(collection,run){
 const c=normalizeCollection(collection),id='rift:'+String(run.resultId??'').slice(0,70),waves=int(run.waves,5);
 if(id==='rift:'||!waves||c.claimedIds.includes(id))return {collection:c,stones:0};
 const stones=riftReward({waves,hard:run.hard===true,accuracy:int(run.accuracy,100)}),key=run.hard===true?'hardBest':'best';
 c.forge[key]=Math.max(c.forge[key],waves);c.earned+=stones;c.stones+=stones;c.revision++;
 c.claimedIds=[...c.claimedIds,id].slice(-64);return {collection:c,stones};
}
export function ordinaryDrawPool(collection){
 const missing=DRAW_POOL.filter(item=>!collection.items.includes(item.id));
 const firstOutfits=collection.firstChallengeReward&&collection.draws===0
  ? missing.filter(item=>item.kind==='outfit') : [];
 return {pool:firstOutfits.length?firstOutfits:missing,firstOutfit:firstOutfits.length>0};
}

export function drawItem(collection,roll){
 const c=normalizeCollection(collection);
 const {pool,firstOutfit}=ordinaryDrawPool(c);
 if(!pool.length)throw Error('普通祈願已全部集齊。');
 if(c.stones<DRAW_COST)throw Error('靈石不足，再完成挑戰即可獲得。');
 if(!Number.isFinite(roll)||roll<0||roll>=1)throw Error('抽取尚未準備好，請重試。');
 const total=pool.reduce((sum,item)=>sum+item.weight,0);
 let value=roll*total,item=pool.at(-1);
 for(const candidate of pool){value-=candidate.weight;if(value<0){item=candidate;break;}}
 c.stones-=DRAW_COST;c.spent+=DRAW_COST;c.draws++;c.revision++;
 c.items.push(item.id);c.pity=0;
 c.lastDraw={id:item.id,duplicate:false,guaranteed:false};
 return {collection:c,item,firstOutfit};
}
export function drawLimitedItem(save,roll){
 const c=normalizeCollection(save.collection);
 const progress=limitedProgress({...save,collection:c});
 if(!progress.unlocked)throw Error('集滿原有 '+progress.baseTotal+' 套服裝後，才會開放限定祈願。');
 const missing=LIMITED_POOL.filter(item=>!c.items.includes(item.id));
 if(!missing.length)throw Error('五套限定服裝已全部收藏。');
 if(c.stones<DRAW_COST)throw Error('靈石不足，先到無盡挑戰練習吧。');
 if(!Number.isFinite(roll)||roll<0||roll>=1)throw Error('抽取尚未準備好，請重試。');
 const item=missing[Math.floor(roll*missing.length)];
 c.items.push(item.id);c.draws++;c.spent+=DRAW_COST;c.stones-=DRAW_COST;c.revision++;
 c.lastDraw={id:item.id,duplicate:false,guaranteed:false};
 return {collection:c,item,duplicate:false,guaranteed:false,refund:0};
}
export const secureRoll=()=>{const value=new Uint32Array(1);crypto.getRandomValues(value);return value[0]/4294967296;};