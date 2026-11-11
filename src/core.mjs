import {ORDINARY_HEROINES} from '../game-data/ordinary-heroines.mjs';
import {RIFT_OUTFITS,forgeSpent} from '../game-data/rift.mjs';
import {LIMITED_COSTUMES} from '../game-data/limited-costumes.mjs';
import {availableTreasures,treasureId} from '../game-data/spirit-treasures.mjs';
import {blankCollection,normalizeCollection,limitedProgress,EFFECTS,ATTACK_STYLES} from './collection.mjs';
import {BPMF_KEYS,physicalKey} from './keyboard.mjs';
import { CURRICULUM } from '../game-data/curriculum.mjs';
export const NODES = CURRICULUM.nodes;
export const CHAPTERS = CURRICULUM.chapters;
export const NODE_BY_ID = Object.fromEntries(NODES.map(n => [n.id, n]));
export const VERSION = '3.24.4';
export const OUTFITS = [
  { effect:'dust', effectName:'普通劍式', effectDescription:'使用練習劍出招，不附加攻擊特效。', id:'O00', name:'布衣少俠', title:'初入江湖', node:null, description:'深藍布衣、練習劍。江湖的第一步，從一個鍵開始。' },
  { effect:'bamboo', effectName:'竹葉流光', effectDescription:'翠綠劍痕與竹葉護光。', id:'O01', name:'青竹弟子', title:'雙手有了家', node:'S01-04', description:'交領外衫、竹紋護腕。你已經穩穩找到雙手的位置。' },
  { effect:'wind', effectName:'踏雲劍風', effectDescription:'青藍劍風隨出招展開。', id:'O02', name:'雲行俠客', title:'踏雲送信', node:'S03-05', description:'輕肩護具、送信腰袋。上排山路，也能一步一步走穩。' },
  { effect:'frost', effectName:'玄霜結界', effectDescription:'冰藍劍痕與霜晶護環。', id:'O03', name:'玄霜護行', title:'星燈引路', node:'S05-05', description:'短披風、護肩與手套。你親手點亮了十盞星燈。' },
  { effect:'gold', effectName:'天衡金印', effectDescription:'金色劍芒與宗師護印。', id:'O04', name:'天衡宗師', title:'鍵心歸一', node:'S07-03', description:'長劍袍與師門腰飾。每一招，都記著一路走來的練習。' },
  {id:'O05',name:'火羽行者',title:'急信送達',node:'S02-04',description:'赤紅短披風、銅甲護肩與火羽扣。雙手歸位，便能踏上送信的路。',effect:'ember',effectName:'火羽劍芒',effectDescription:'出招灑下橙紅餘燼，格擋展開火羽護環。'},
  {id:'O06',name:'月華劍使',title:'竹橋之約',node:'S04-04',description:'月白劍袍、銀色輕甲與藍緞。守住竹橋，讓月光照亮前路。',effect:'moon',effectName:'月華漣漪',effectDescription:'銀藍弦月劍痕，格擋亮起月華護環。'},
  {id:'O07',name:'星河劍隱',title:'連招成訣',node:'S06-04',description:'深紫繡星長袍、星紋肩甲與流光劍穗。讓每個字都接成自己的劍訣。',effect:'star',effectName:'星河劍陣',effectDescription:'紫金星點沿劍痕流動，格擋浮現星河護印。'},
 {id:'O08',name:'天符星師',title:'天符珍藏',item:'outfit-O08',description:'月白金紋法袍與天符冠，將星火凝成自己的法訣。',effect:'gold',effectName:'天符金印',effectDescription:'金色靈符與護印相隨。'},
 {id:'O09',name:'幽蓮劍仙',title:'幽蓮珍藏',item:'outfit-O09',description:'玄黑蓮紋劍袍與流霞劍穗，幽蓮花光沿劍而生。',effect:'lotus',effectName:'幽蓮劍華',effectDescription:'粉紫蓮華沿出招流動。'},
 {id:'O10',name:'靈墨練氣',title:'仙途 · 練氣',item:'outfit-O10',realm:'練氣',category:'immortal',description:'青白輕衫與靈筆，吐納之間，筆鋒已有靈息。',effect:'wind',effectName:'練氣靈陣',effectDescription:'靈氣蓄勢、御筆揮招與符陣護身。'},
 {id:'O11',name:'青霄築基',title:'仙途 · 築基',item:'outfit-O11',realm:'築基',category:'immortal',description:'青霄長袍與玉紋護具，御筆成陣，衣袂隨靈氣舒展。',effect:'bamboo',effectName:'築基靈陣',effectDescription:'靈氣蓄勢、御筆揮招與符陣護身。'},
 {id:'O12',name:'金闕丹心',title:'仙途 · 金丹',item:'outfit-O12',realm:'金丹',category:'immortal',description:'白金錦袍與丹紋腰飾，丹光凝聚，揮招自有金霞。',effect:'gold',effectName:'金丹靈陣',effectDescription:'靈氣蓄勢、御筆揮招與符陣護身。'},
 {id:'O13',name:'紫宸元嬰',title:'仙途 · 元嬰',item:'outfit-O13',realm:'元嬰',category:'immortal',description:'紫宸法衣、星紋護肩與靈筆，踏虛而立，星芒環繞。',effect:'star',effectName:'元嬰靈陣',effectDescription:'靈氣蓄勢、御筆揮招與符陣護身。'},
 {id:'O14',name:'太虛化神',title:'仙途 · 化神',item:'outfit-O14',realm:'化神',category:'immortal',description:'流霞長衣與幽藍靈焰，御氣凝形，靈光隨招化生。',effect:'aurora',effectName:'化神靈陣',effectDescription:'靈氣蓄勢、御筆揮招與符陣護身。'},
 {id:'O15',name:'九霄渡劫',title:'仙途 · 渡劫',item:'outfit-O15',realm:'渡劫',category:'immortal',description:'九霄仙衣與鎏金髮冠，龍紋隨衣，金符伴著靈筆出陣。',effect:'moon',effectName:'渡劫靈陣',effectDescription:'靈氣蓄勢、御筆揮招與符陣護身。'},
 ...LIMITED_COSTUMES, ...RIFT_OUTFITS, ...ORDINARY_HEROINES
].sort((a,b)=>(a.category==='rift'?'ZZ':a.item?'Z':a.node??'').localeCompare(b.category==='rift'?'ZZ':b.item?'Z':b.node??''));
export const ENEMIES = {
 E_NEW_01:{name:'竹葉木樁',kind:'wood'}, E_NEW_02:{name:'墨點小靈',kind:'spirit'},
 E_NEW_03:{name:'送信紙鳶',kind:'kite'}, E_NEW_04:{name:'竹橋機關偶',kind:'guard'},
 E_NEW_05:{name:'星燈石衛',kind:'stone'}, E_NEW_06:{name:'墨影劍侍',kind:'swordsman'},
 nether_lord_boss:{name:'墨影門主',kind:'boss'}
};
export const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
export const cleanName=value=>Array.from(String(value??'').trim()).slice(0,20).join('');
const int=(v,max=100000000)=>Number.isFinite(Number(v))?clamp(Math.round(Number(v)),0,max):0;
export const accuracy=s=>s.attempted?Math.round(s.correct/s.attempted*100):null;
export const uid=()=>globalThis.crypto?.randomUUID?.() ?? `r-${Date.now()}-${Math.random().toString(36).slice(2)}`;
export function blankSave(name='') {
 return {schemaVersion:3,contentVersion:'story-v1',revision:0,displayName:cleanName(name),completedNodeIds:[],nodeRecords:{},equippedOutfitId:'O00',seenOutfitIds:['O00'],collection:blankCollection(),equippedEffectId:'auto',attackStyle:'sword',equippedTreasureId:'none',challengeBest:{},bossBest:{score:0,rounds:0,accuracy:0,attempted:0,rulesVersion:'legacy-v2'},settings:{muted:false,reducedMotion:false,highContrast:false,autoAdvance:true},updatedAt:null};
}
export function availableOutfits(save){const limited=limitedProgress(save).unlocked;return OUTFITS.filter(o=>o.category==='rift'?save.collection?.forge?.crafted.includes('outfit-'+o.id):(o.category!=='limited'||limited)&&(o.item?save.collection?.items?.includes(o.item):!o.node||save.completedNodeIds.includes(o.node)));}
export const availableEffects=save=>EFFECTS.filter(e=>!e.item&&!e.outfit||e.item&&save.collection?.items?.includes(e.item)||e.outfit&&availableOutfits(save).some(o=>o.id===e.outfit));
export const availableAttacks=save=>ATTACK_STYLES.filter(a=>!a.item||save.collection?.items?.includes(a.item));
export const bossUnlocked=save=>save.completedNodeIds.includes('S07-03');
export const nextNode=save=>NODES.find(n=>!save.completedNodeIds.includes(n.id))??null;
export const canStartNode=(save,id)=>!!NODE_BY_ID[id]&&NODE_BY_ID[id].requires.every(r=>save.completedNodeIds.includes(r));
// Stars reward a completed attempt and accuracy, never typing speed or equipment.
export function resultStars(result){
 if(!result?.attempted)return 0;
 const ratio=accuracy(result)/100;
 return ratio>=.95&&!result.assisted?3:ratio>=.8?2:1;
}
export function nodeStars(save,id){
 if(!save.completedNodeIds.includes(id))return 0;
 return save.storyStarShortcut?3:Math.max(1,resultStars(save.nodeRecords[id]?.bestResult));
}
export function unlockDifferences(local,cloud){
 const cloudNodes=new Set(cloud.completedNodeIds);
 const cloudOutfits=new Set(availableOutfits(cloud).map(o=>o.id));
 return {
  nodeIds:local.completedNodeIds.filter(id=>!cloudNodes.has(id)),
  outfitIds:availableOutfits(local).filter(o=>!cloudOutfits.has(o.id)).map(o=>o.id)
 };
}
export function grantOutfits(save,outfitIds){
 const wanted=new Set(outfitIds);
 const collection=normalizeCollection(save.collection);
 const previousForgeCost=forgeSpent(collection.forge);
 let changed=false;
 for(const outfit of OUTFITS){
  if(!wanted.has(outfit.id))continue;
  if(outfit.category==='rift'){
   const key='outfit-'+outfit.id;
   if(collection.forge.crafted.includes(key))continue;
   collection.forge.crafted.push(key);
  }else{
   if(!outfit.item||collection.items.includes(outfit.item))continue;
   collection.items.push(outfit.item);
  }
  changed=true;
 }
 if(!changed)return save;
 const credit=forgeSpent(collection.forge)-previousForgeCost;
 collection.earned+=credit;
 collection.spent+=credit;
 collection.revision++;
 return {...save,collection};
}
export function unlockStory(save){
 return {...save,completedNodeIds:NODES.map(node=>node.id),storyStarShortcut:true};
}
export const chapterStars=(save,chapter)=>chapter.nodeIds.reduce((sum,id)=>sum+nodeStars(save,id),0);
export const totalStars=save=>CHAPTERS.reduce((sum,c)=>sum+chapterStars(save,c),0);
export function bestStoryResult(a,b){
 if(!a)return b;if(!b)return a;
 const stars=resultStars(b)-resultStars(a);
 return stars>0||stars===0&&b.score>a.score?b:a;
}

export function normalizeResult(r={}){
 const attempted=int(r.attempted,100000);const correct=Math.min(attempted,int(r.correct,100000));
 return {resultId:String(r.resultId??uid()).slice(0,80),attempted,correct,maxCombo:Math.min(correct,int(r.maxCombo,100000)),score:int(r.score),assisted:r.assisted===true,firstAttempted:Math.min(attempted,int(r.firstAttempted,100000)),firstCorrect:Math.min(correct,int(r.firstAttempted,100000),int(r.firstCorrect,100000))};
}
export function normalizeSave(raw){
 if(!raw||raw.schemaVersion!==3||raw.contentVersion!=='story-v1')throw new Error('這份紀錄的版本不適用。');
 const save=blankSave(raw.displayName);save.collection=normalizeCollection(raw.collection);save.revision=int(raw.revision);const ids=new Set(Array.isArray(raw.completedNodeIds)?raw.completedNodeIds:[]);
 // Keep a valid sequential curriculum prefix, never infer a cleared final chapter from a lone id.
 for(const n of NODES){if(ids.has(n.id)&&n.requires.every(r=>save.completedNodeIds.includes(r)))save.completedNodeIds.push(n.id);}
 if(raw.storyStarShortcut===true&&save.completedNodeIds.length===NODES.length)save.storyStarShortcut=true;
 if(!limitedProgress(save).unlocked){
  const limitedItems=new Set(LIMITED_COSTUMES.map(o=>o.item));
  save.collection.items=save.collection.items.filter(id=>!limitedItems.has(id));
  if(limitedItems.has(save.collection.lastDraw?.id))save.collection.lastDraw=null;
 }
 for(const id of save.completedNodeIds){const r=raw.nodeRecords?.[id];if(r?.bestResult)save.nodeRecords[id]={completed:true,bestResult:normalizeResult(r.bestResult)};}
 for(const [key,r] of Object.entries(raw.challengeBest??{})){
  if(!/^(en|zh-hanzi|zh-bpmf):[1-5]$/.test(key)||!r||typeof r!=='object')continue;
  save.challengeBest[key]={...normalizeResult(r),accuracy:int(r.accuracy,100),stars:int(r.stars,3),grade:['S','A','B','C','D'].includes(r.grade)?r.grade:'D',rulesVersion:'legacy-v2'};
 }
 save.bossBest={score:int(raw.bossBest?.score),rounds:int(raw.bossBest?.rounds,100000),accuracy:int(raw.bossBest?.accuracy,100),attempted:int(raw.bossBest?.attempted,100000),rulesVersion:'legacy-v2'};
 for(const k of Object.keys(save.settings))if(raw.settings?.[k]!==undefined)save.settings[k]=raw.settings[k]===true;
 save.seenOutfitIds=availableOutfits(save).filter(o=>o.id==='O00'||Array.isArray(raw.seenOutfitIds)&&raw.seenOutfitIds.includes(o.id)).map(o=>o.id);
 if(availableTreasures(save).some(t=>t.id===raw.equippedTreasureId))save.equippedTreasureId=treasureId(raw.equippedTreasureId);
 if(availableEffects(save).some(o=>o.id===raw.equippedEffectId))save.equippedEffectId=raw.equippedEffectId;
 if(availableAttacks(save).some(o=>o.id===raw.attackStyle))save.attackStyle=raw.attackStyle;
 if(availableOutfits(save).some(o=>o.id===raw.equippedOutfitId))save.equippedOutfitId=raw.equippedOutfitId;
 return save;
}
export function mergeSaves(a,b,{outfitDirty=false,settingsDirty=false,nameDirty=false,loadoutDirty=false}={}){
 a=normalizeSave(a);b=normalizeSave(b);const merged=blankSave(nameDirty?b.displayName:a.displayName||b.displayName);
 if(a.storyStarShortcut||b.storyStarShortcut)merged.storyStarShortcut=true;
 merged.collection=b.collection.revision>a.collection.revision?b.collection:a.collection;
 const completed=new Set([...a.completedNodeIds,...b.completedNodeIds]);
 for(const n of NODES)if(completed.has(n.id)&&n.requires.every(r=>merged.completedNodeIds.includes(r)))merged.completedNodeIds.push(n.id);
 for(const id of merged.completedNodeIds){const ar=a.nodeRecords[id]?.bestResult,br=b.nodeRecords[id]?.bestResult;const best=bestStoryResult(ar,br);if(best)merged.nodeRecords[id]={completed:true,bestResult:best};}
 for(const key of new Set([...Object.keys(a.challengeBest),...Object.keys(b.challengeBest)])){
  const ar=a.challengeBest[key],br=b.challengeBest[key];merged.challengeBest[key]=!ar?br:!br?ar:br.score>ar.score?br:ar;
 }
 merged.bossBest=b.bossBest.score>a.bossBest.score?b.bossBest:a.bossBest;
 merged.settings=settingsDirty?b.settings:a.settings;
 merged.seenOutfitIds=availableOutfits(merged).filter(o=>o.id==='O00'||a.seenOutfitIds.includes(o.id)||b.seenOutfitIds.includes(o.id)).map(o=>o.id);
 const outfit=outfitDirty?b.equippedOutfitId:a.equippedOutfitId;
 merged.equippedOutfitId=availableOutfits(merged).some(o=>o.id===outfit)?outfit:'O00';
 const loadout=loadoutDirty?b:a;merged.equippedEffectId=availableEffects(merged).some(o=>o.id===loadout.equippedEffectId)?loadout.equippedEffectId:'auto';merged.attackStyle=availableAttacks(merged).some(o=>o.id===loadout.attackStyle)?loadout.attackStyle:'sword';
 merged.equippedTreasureId=availableTreasures(merged).some(t=>t.id===loadout.equippedTreasureId)?loadout.equippedTreasureId:'none';
 merged.revision=Math.max(a.revision,b.revision);return merged;
}
export function completeNode(save,id,result){
 if(!canStartNode(save,id))throw new Error('先完成前面的練習，再到這裡。');
 const before=availableOutfits(save).map(o=>o.id);const next=normalizeSave(save);const r=normalizeResult(result);
 if(!next.completedNodeIds.includes(id))next.completedNodeIds.push(id);
 const old=next.nodeRecords[id]?.bestResult;
 next.nodeRecords[id]={completed:true,bestResult:bestStoryResult(old,r)};
 return {save:next,newOutfits:availableOutfits(next).filter(o=>!before.includes(o.id))};
}
function seeded(seed){let v=2166136261;for(const c of seed)v=Math.imul(v^c.charCodeAt(0),16777619);return()=>{v^=v<<13;v^=v>>>17;v^=v<<5;return(v>>>0)/4294967296;};}
const SHORT_WORDS=['as','dad','sad','fall','ask','all','jam','sun','ink','run'];
export function makeSession(node,seed=uid()){
 const random=seeded(seed);const pick=arr=>arr[Math.floor(random()*arr.length)];const targets=[];
 if(node.mechanic==='word_sequence'){
  for(let i=0;i<node.completion.target;i++)targets.push({value:(node.route==='zh-bpmf'?node.sampleWords:SHORT_WORDS)[i%(node.route==='zh-bpmf'?node.sampleWords:SHORT_WORDS).length],kind:'word'});
 }else if(node.mechanic==='shift_case'){
  for(let i=0;i<node.completion.target;i++){const v=pick(node.allowedKeys);targets.push({value:i%2?v.toUpperCase():v,kind:'case',shift:i%2===1});}
 }else if(['guard_intro','word_guard','story_finale'].includes(node.mechanic)){
  const words=node.completion.wordGroups,guards=node.completion.correctGuards;
  for(let i=0;i<Math.max(words,guards);i++){
   if(i<words)targets.push({value:(node.route==='zh-bpmf'?node.sampleWords:SHORT_WORDS)[(i+3)%(node.route==='zh-bpmf'?node.sampleWords:SHORT_WORDS).length],kind:'word'});
   if(i<guards)targets.push({value:(node.guardKeys??['f','j'])[i%2],kind:'guard'});
  }
 }else{
  const pool=node.allowedKeys;if(!pool.length)throw Error('Empty target pool: '+node.id);const fresh=node.newKeys.filter(k=>pool.includes(k));
  for(let i=0;i<node.completion.target;i++){
   let value=pick(fresh.length&&i%4!==3?fresh:pool);
   if(node.returnHomeEveryCorrect&&(i+1)%4===0)value=i%2?'j':'f';
   targets.push({value,kind:'key'});
  }
 }
 return {id:seed,nodeId:node.id,targets,index:0,progress:0,attempted:0,correct:0,combo:0,maxCombo:0,score:0,errorStreak:0,assisted:false,firstAttempted:0,firstCorrect:0,seenSlots:[],done:false};
}
export function targetOf(session){const target=session.targets[session.index];if(!target)return null;return {...target,char:target.value[session.progress]??target.value[0]};}
export function physicalCode(char){
 if(BPMF_KEYS[char])return physicalCode(BPMF_KEYS[char]);
 if(/^[a-z]$/i.test(char))return 'Key'+char.toUpperCase();
 if(/^\d$/.test(char))return 'Digit'+char;
 return {';':'Semicolon',',':'Comma','.':'Period','/':'Slash','-':'Minus',' ':'Space'}[char]??'';
}
export function applyInput(session,event){
 if(session.done||event.repeat||event.ctrlKey||event.metaKey||event.altKey)return {state:session,event:'ignored'};
 if(physicalKey(event.code)===null)return {state:session,event:'ignored'};
 const target=targetOf(session);if(!target)return {state:session,event:'ignored'};
 const state={...session,seenSlots:[...session.seenSlots]};const expectedCode=physicalCode(target.char);
 const correct=event.code===expectedCode&&(target.kind!=='case'||(target.shift?event.shiftKey===true:!event.shiftKey));
 const slot=`${state.index}:${state.progress}`;const first=!state.seenSlots.includes(slot);
 state.attempted++;
 if(first){state.seenSlots.push(slot);state.firstAttempted++;if(correct)state.firstCorrect++;}
 if(correct){
  state.correct++;state.combo++;state.maxCombo=Math.max(state.maxCombo,state.combo);state.errorStreak=0;state.score+=10+(state.combo%5===0?10:0);state.progress++;
  const finished=state.progress>=target.value.length;
  if(finished){if(target.kind==='word')state.score+=20;state.index++;state.progress=0;}
  state.done=state.index>=state.targets.length;
  return {state,event:state.done?'complete':target.kind==='guard'?'guard':finished&&target.kind==='word'?'word':'correct',target};
 }
 state.combo=0;state.score=Math.max(0,state.score-5);state.errorStreak++;
 if(state.errorStreak>=3)state.assisted=true;
 return {state,event:'wrong',target};
}
export function sessionResult(s){return normalizeResult({...s,resultId:s.id});}
export function importLegacy(raw,name=''){
 const save=blankSave(name||raw?.playerName);if(!raw||typeof raw!=='object')return save;
 for(const [stage,r] of Object.entries(raw.stageRecords??{}))if(/^[1-5]$/.test(stage)&&r&&typeof r==='object'){
  const attempted=int(r.bestTyped,100000),correct=Math.round(attempted*int(r.bestAcc,100)/100);
  save.challengeBest[`en:${stage}`]={...normalizeResult({attempted,correct,score:r.bestScore,maxCombo:r.bestCombo,resultId:uid()}),accuracy:int(r.bestAcc,100),stars:int(r.bestStars,3),grade:['S','A','B','C','D'].includes(r.bestGrade)?r.bestGrade:'D',rulesVersion:'legacy-v2'};
 }
 const boss=raw.specialRecords?.endlessBoss;save.bossBest={score:int(boss?.bestScore),rounds:int(boss?.bestRounds),rulesVersion:'legacy-v2'};
 save.settings={muted:false,reducedMotion:raw.reducedMotion===true,highContrast:raw.highContrast===true,autoAdvance:true};
 return save;
}
export function fingerFor(char){
 const key=BPMF_KEYS[char]??char.toLowerCase();if(key===' ')return '拇指';
 for(const [keys,finger] of [['1qaz','左手小指'],['2wsx','左手無名指'],['3edc','左手中指'],['45rtfgvb','左手食指'],['67yuhjnm','右手食指'],['8ik,','右手中指'],['9ol.','右手無名指'],['0p;/-','右手小指']])if(keys.includes(key))return finger;
 return '先找到 F／J 的小凸點';
}
export const keyLabel=char=>char===' '?'空白':char===';'?'；':char.toUpperCase();