import {forgeAction} from './forge.mjs';
import {routeKey,routeLabel} from './keyboard.mjs';
import {claimRun,claimRift,claimChallengeRun,drawItem,drawLimitedItem,secureRoll,endlessGrade} from './collection.mjs';
import {blankSave,normalizeSave,mergeSaves,importLegacy,unlockDifferences,grantOutfits,unlockStory,availableOutfits,OUTFITS} from './core.mjs';

/** Local-only fork: no Google / Firebase. */
export const GUEST_KEY='typing_adventure_en_guest_v1';

export class SaveStore extends EventTarget{
 constructor(route='en'){
  super();
  this.route=routeKey(route);
  this.gameId='typing_adventure_en_v1';
  this.guestKey=GUEST_KEY;
  this.user=null;
  this.save=blankSave();
  this.status='local';
  this.dirty={};
  this.serial=0;
  this.pending=false;
  this.cloud=null;
  this.ready=null;
  this.guestAvailable=null;
  this.importCandidate=null;
  this.uploading=false;
  this.timer=null;
  this.initializing=true;
  this.rewardQueue=[];
 }
 emit(){this.dispatchEvent(new Event('change'));}
 async init(_config){
  this.config=_config||{firebase:null,legacyLeaderboardUrl:'',legacySubmitEnabled:false};
  try{
   const value=localStorage.getItem(this.guestKey);
   if(value)this.guestAvailable=normalizeSave(JSON.parse(value));
  }catch{this.status='storage-error';}
  if(this.guestAvailable)this.save=this.guestAvailable;
  this.initializing=false;
  this.status='local';
  this.emit();
  return this;
 }
 pkHistory(){return [];}
 async unpublishRanking(){return true;}
 key(){return this.guestKey;}
 writeLocal(){
  try{
   const json=JSON.stringify(this.save);
   if(new TextEncoder().encode(json).length>65536)throw Error('size');
   localStorage.setItem(this.guestKey,json);
   this.guestAvailable=this.save;
  }catch{this.status='storage-error';}
 }
 update(save,changes={}){
  const previous=this.save,previousGrants=this.dirty.grantedOutfitIds??[];
  this.save=normalizeSave(save);
  const nodes=Object.keys(this.save.nodeRecords).filter(id=>this.save.nodeRecords[id]?.bestResult.resultId!==previous.nodeRecords[id]?.bestResult.resultId);
  const challenges=Object.keys(this.save.challengeBest).filter(id=>this.save.challengeBest[id]?.resultId!==previous.challengeBest[id]?.resultId);
  this.dirty={...this.dirty,...changes,nodeIds:[...new Set([...(this.dirty.nodeIds??[]),...nodes])],challengeIds:[...new Set([...(this.dirty.challengeIds??[]),...challenges])]};
  if(changes.grantedOutfitIds)this.dirty.grantedOutfitIds=[...new Set([...previousGrants,...changes.grantedOutfitIds])];
  this.serial++;
  this.pending=false;
  this.status='local';
  this.writeLocal();
  this.emit();
 }
 async login(){throw new Error('此版本不需登入，進度已自動保存在本機。');}
 async collectionTransaction(operation){
  if(this.collectionBusy)throw Error('靈石正在整理，請稍候。');
  this.collectionBusy=true;
  try{
   const result=operation(this.save.collection,this.save);
   this.update({...this.save,collection:result.collection});
   return result;
  }finally{this.collectionBusy=false;}
 }
 async claimReward(run){
  const kind=run?.kind;
  let result;
  if(kind==='challenge')result=claimChallengeRun(this.save.collection,run);
  else if(kind==='rift')result=claimRift(this.save.collection,run);
  else result=claimRun(this.save.collection,run);
  this.update({...this.save,collection:result.collection});
  this.rewardQueue=this.rewardQueue.filter(r=>r!==run);
  return result;
 }
 async claimChallengeReward(run){return this.claimReward({...run,kind:'challenge'});}
 async draw(pool='standard'){
  const op=c=>{
   if(pool==='limited')return drawLimitedItem(c);
   return drawItem(c,secureRoll());
  };
  return this.collectionTransaction(op);
 }
 async forge(action,id){
  return this.collectionTransaction((collection,save)=>{
   const next=forgeAction({...save,collection},action,id);
   return {collection:next.collection,price:next.price};
  });
 }
 async flush(){this.writeLocal();return true;}
 async retrySave(){this.writeLocal();return true;}
 async logout(){
  this.save=blankSave();
  this.pending=false;
  this.importCandidate=null;
  this.writeLocal();
  this.emit();
 }
 unlockAll(){
  if(this.save.storyStarShortcut&&availableOutfits(this.save).length===OUTFITS.length)return;
  const outfitIds=OUTFITS.map(outfit=>outfit.id);
  this.update(grantOutfits(unlockStory(this.save),outfitIds),{grantedOutfitIds:outfitIds});
 }
 importGuest(){
  const candidate=this.importCandidate;
  this.importCandidate=null;
  if(!candidate)return;
  const {outfitIds}=unlockDifferences(candidate,this.save);
  const merged=mergeSaves(this.save,{...candidate,collection:this.save.collection},{nameDirty:!this.save.displayName});
  this.update(grantOutfits(merged,outfitIds),{grantedOutfitIds:outfitIds});
 }
 export(){return JSON.stringify({game:'typing-adventure-en',route:'en',save:normalizeSave(this.save)},null,2);}
 importFile(value){
  if(!value||(value.game!=='typing-adventure-en'&&value.game!=='wuxia-typing-journey'))throw Error('請選擇這個遊戲匯出的紀錄檔。');
  if(value.route&&routeKey(value.route)!=='en')throw Error('只支援英文路線紀錄。');
  this.update(mergeSaves(this.save,normalizeSave(value.save),{nameDirty:!this.save.displayName}));
 }
}
