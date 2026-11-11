import {ORDINARY_HEROINES} from '../game-data/ordinary-heroines.mjs';
import {RIFT_OUTFITS,forgeSpent} from '../game-data/rift.mjs';
import {LIMITED_COSTUMES} from '../game-data/limited-costumes.mjs';
import {availableTreasures,treasureId} from '../game-data/spirit-treasures.mjs';
import {blankCollection,normalizeCollection,limitedProgress,EFFECTS,ATTACK_STYLES} from './collection.mjs';
import {BPMF_KEYS,physicalKey} from './keyboard.mjs';
import { CURRICULUM } from '../game-data/curriculum.mjs?v=sen1';
export const NODES = CURRICULUM.nodes;
export const CHAPTERS = CURRICULUM.chapters;
export const NODE_BY_ID = Object.fromEntries(NODES.map(n => [n.id, n]));
export const VERSION = '3.24.4';
export const OUTFITS = [
  { effect:'dust', effectName:'普通', effectDescription:'平常練習。', id:'O00', name:'藍衫', title:'開始', node:null, description:'藍衫。由第一粒鍵開始。' },
  { effect:'bamboo', effectName:'竹', effectDescription:'綠色光。', id:'O01', name:'青衫', title:'識 F J', node:'S01-04', description:'青衫。你識搵 F 同 J。' },
  { effect:'wind', effectName:'風', effectDescription:'藍色風。', id:'O02', name:'雲衫', title:'上面鍵', node:'S03-05', description:'輕便衫。上面鍵都識。' },
  { effect:'frost', effectName:'冰', effectDescription:'冰藍色。', id:'O03', name:'霜衫', title:'數字', node:'S05-05', description:'短披風。數字鍵都識。' },
  { effect:'gold', effectName:'金', effectDescription:'金色光。', id:'O04', name:'金衫', title:'完成', node:'S07-03', description:'長袍。全部關卡完成！' },
  {id:'O05',name:'紅衫',title:'中間行',node:'S02-04',description:'紅披風。中間一行識撳。',effect:'ember',effectName:'火',effectDescription:'橙色光。'},
  {id:'O06',name:'月衫',title:'下面鍵',node:'S04-04',description:'月白衫。下面鍵都識。',effect:'moon',effectName:'月',effectDescription:'銀色光。'},
  {id:'O07',name:'星衫',title:'字詞',node:'S06-04',description:'紫星衫。識連住撳。',effect:'star',effectName:'星',effectDescription:'紫色星光。'},
 {id:'O08',name:'符衫',title:'珍藏',item:'outfit-O08',description:'特別衫。',effect:'gold',effectName:'金符',effectDescription:'金色。'},
 {id:'O09',name:'蓮衫',title:'珍藏',item:'outfit-O09',description:'蓮花衫。',effect:'lotus',effectName:'蓮',effectDescription:'粉紫光。'},
 {id:'O10',name:'練氣衫',title:'仙途',item:'outfit-O10',realm:'練氣',category:'immortal',description:'青白衫。',effect:'wind',effectName:'練氣',effectDescription:'靈氣。'},
 {id:'O11',name:'築基衫',title:'仙途',item:'outfit-O11',realm:'築基',category:'immortal',description:'青袍。',effect:'bamboo',effectName:'築基',effectDescription:'靈氣。'},
 {id:'O12',name:'金丹衫',title:'仙途',item:'outfit-O12',realm:'金丹',category:'immortal',description:'白金衫。',effect:'gold',effectName:'金丹',effectDescription:'靈氣。'},
 {id:'O13',name:'元嬰衫',title:'仙途',item:'outfit-O13',realm:'元嬰',category:'immortal',description:'紫衫。',effect:'star',effectName:'元嬰',effectDescription:'靈氣。'},
 {id:'O14',name:'化神衫',title:'仙途',item:'outfit-O14',realm:'化神',category:'immortal',description:'流霞衫。',effect:'aurora',effectName:'化神',effectDescription:'靈氣。'},
 {id:'O15',name:'渡劫衫',title:'仙途',item:'outfit-O15',realm:'渡劫',category:'immortal',description:'金冠衫。',effect:'moon',effectName:'渡劫',effectDescription:'靈氣。'},
 ...LIMITED_COSTUMES, ...RIFT_OUTFITS, ...ORDINARY_HEROINES
].sort((a,b)=>(a.category==='rift'?'ZZ':a.item?'Z':a.node??'').localeCompare(b.category==='rift'?'ZZ':b.item?'Z':b.node??''));
export const ENEMIES = {
 E_NEW_01:{name:'木人',kind:'wood'}, E_NEW_02:{name:'墨點',kind:'spirit'},
 E_NEW_03:{name:'紙鳶',kind:'kite'}, E_NEW_04:{name:'竹偶',kind:'guard'},
 E_NEW_05:{name:'石衛',kind:'stone'}, E_NEW_06:{name:'劍侍',kind:'swordsman'},
 nether_lord_boss:{name:'大門主',kind:'boss'}
};
export const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
export const cleanName=value=>Array.from(String(value??'').trim()).slice(0,20).join('');
const int=(v,max=100000000)=>Number.isFinite(Number(v))?clamp(Math.round(Number(v)),0,max):0;
export const accuracy=s=>s.attempted?Math.round(s.correct/s.attempted*100):null;
export const uid=()=>globalThis.crypto?.randomUUID?.() ?? `r-${Date.now()}-${Math.random().toString(36).slice(2)}`;
export function blankSave(name='') {
 return {schemaVersion:3,contentVersion:'story-v1',revision:0,displayName:cleanName(name),completedNodeIds:[],nodeRecords:{},equippedOutfitId:'O00',seenOutfitIds:['O00'],collection:blankCollection(),equippedEffectId:'auto',attackStyle:'sword',equippedTreasureId:'none',challengeBest:{},bossBest:{score:0,rounds:0,accuracy:0,attempted:0,rulesVersion:'legacy-v2'},settings:{muted:false,reducedMotion:false,highContrast:false,autoAdvance:true,inputMode:'auto'},updatedAt:null};
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
 for(const k of Object.keys(save.settings)){
  if(raw.settings?.[k]===undefined)continue;
  if(k==='inputMode'){
    const m=String(raw.settings.inputMode||'auto');
    save.settings.inputMode=['auto','phys','virt'].includes(m)?m:'auto';
  }else save.settings[k]=raw.settings[k]===true;
}
if(typeof raw.settings?.virtualKeyboard==='boolean')save.settings.virtualKeyboard=raw.settings.virtualKeyboard;
else if(raw.settings?.inputMode==='virt')save.settings.virtualKeyboard=true;
else if(raw.settings?.inputMode==='phys')save.settings.virtualKeyboard=false;
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
 const firstClear=!save.completedNodeIds.includes(id);
 const before=availableOutfits(save).map(o=>o.id);const next=normalizeSave(save);const r=normalizeResult(result);
 if(!next.completedNodeIds.includes(id))next.completedNodeIds.push(id);
 const old=next.nodeRecords[id]?.bestResult;
 next.nodeRecords[id]={completed:true,bestResult:bestStoryResult(old,r)};
 return {save:next,newOutfits:availableOutfits(next).filter(o=>!before.includes(o.id)),firstClear};
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