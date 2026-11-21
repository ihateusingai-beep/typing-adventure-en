import {forgeAction} from './forge.mjs';
import {routeKey,routeLabel} from './keyboard.mjs';
import {claimRun,claimRift,claimChallengeRun,drawItem,drawLimitedItem,secureRoll,endlessGrade} from './collection.mjs';
import {blankSave,normalizeSave,mergeSaves,importLegacy,unlockDifferences,grantOutfits,unlockStory,availableOutfits,OUTFITS,cleanName} from './core.mjs';
import {LocalRepository} from './system/repository.mjs';
import {wrapExport,parseImport,LEGACY_GUEST_KEY} from './system/schema.mjs';

/** Local-first multi-profile store. No Google / Firebase. */
export const GUEST_KEY=LEGACY_GUEST_KEY;

export class SaveStore extends EventTarget{
 constructor(route='en'){
  super();
  this.route=routeKey(route);
  this.gameId='typing_adventure_en_v1';
  this.guestKey=GUEST_KEY;
  this.repo=new LocalRepository();
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
  this.profileId=null;
  this.profiles=[];
 }
 emit(){this.dispatchEvent(new Event('change'));}
 async init(_config){
  this.config=_config||{firebase:null,legacyLeaderboardUrl:'',legacySubmitEnabled:false};
  try{
   this.repo.boot();
   this.profiles=this.repo.listProfiles();
   if(!this.profiles.length){
    const p=this.repo.createProfile('同學');
    this.repo.writeSave(blankSave('同學'),{profileId:p.id,name:'同學'});
    this.profiles=this.repo.listProfiles();
   }
   this.profileId=this.repo.activeId()||this.profiles[0].id;
   const raw=this.repo.readSave(this.profileId);
   if(raw){
    this.save=normalizeSave(raw);
    this.guestAvailable=this.save;
   }else{
    this.save=blankSave(this.repo.getProfile(this.profileId)?.name||'同學');
    this.writeLocal();
   }
  }catch{
   this.status='storage-error';
   try{
    const value=localStorage.getItem(this.guestKey);
    if(value){this.guestAvailable=normalizeSave(JSON.parse(value));this.save=this.guestAvailable;}
   }catch{this.status='storage-error';}
  }
  this.initializing=false;
  if(this.status!=='storage-error')this.status='local';
  this.emit();
  return this;
 }
 listProfiles(){return this.repo.listProfiles();}
 activeProfile(){return this.repo.getProfile(this.profileId);}
 async selectProfile(id){
  this.repo.selectProfile(id);
  this.profileId=id;
  this.profiles=this.repo.listProfiles();
  const raw=this.repo.readSave(id);
  try{this.save=raw?normalizeSave(raw):blankSave(this.repo.getProfile(id)?.name||'同學');}
  catch{this.save=blankSave('同學');this.status='storage-error';}
  this.guestAvailable=this.save;
  this.status='local';
  this.emit();
  return this.save;
 }
 async createProfile(name='同學'){
  const n=cleanName(name)||'同學';
  const p=this.repo.createProfile(n);
  this.repo.writeSave(blankSave(n),{profileId:p.id,name:n});
  return this.selectProfile(p.id);
 }
 async deleteProfile(id){
  this.repo.deleteProfile(id);
  return this.selectProfile(this.repo.activeId());
 }
 pkHistory(){return [];}
 async unpublishRanking(){return true;}
 key(){return this.guestKey;}
 writeLocal(){
  try{
   const id=this.profileId||this.repo.activeId();
   this.repo.writeSave(this.save,{profileId:id,name:this.save.displayName});
   this.profileId=this.repo.activeId();
   this.profiles=this.repo.listProfiles();
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
 async login(){throw new Error('唔使登入。進度自動儲存。');}
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
  // new blank on same profile slot
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
 export(){return JSON.stringify(wrapExport(this.save,this.activeProfile()||{}),null,2);}
 importFile(value){
  const payload=parseImport(value);
  this.update(mergeSaves(this.save,normalizeSave(payload.save),{nameDirty:!this.save.displayName}));
 }
}
