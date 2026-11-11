import {riftArt} from '../game-data/rift.mjs';

// Each creature has a windup, a contact pose, and a follow-through.
// The impact cue and sound use the same timestamp as the contact pose.
const moves={
 lunge:{windup:155,follow:310,style:'slash',poses:['translateX(8%) rotate(6deg)','translateX(-37%) rotate(-12deg) scale(1.07,.96)','translateX(-23%) rotate(-3deg)'],recoil:'translate(9%,-4%) rotate(10deg)'},
 stomp:{windup:270,follow:370,style:'quake',poses:['translateY(-16%) scale(.95,1.08)','translateY(3%) scale(1.14,.83)','translateY(-3%) scale(1.04,.97)'],recoil:'translateX(3%) scale(1.06,.86)'},
 blink:{windup:205,follow:325,style:'pulse',vanish:true,poses:['translateX(13%) rotate(5deg)','translate(-31%,-5%) rotate(-8deg)','translate(-17%,-3%) rotate(3deg)'],recoil:'translate(10%,-11%) rotate(12deg)'},
 heavy:{windup:305,follow:420,style:'quake',poses:['translateX(4%) rotate(10deg)','translate(-22%,4%) rotate(-9deg) scale(1.12,.87)','translate(-11%,1%) rotate(3deg)'],recoil:'translateX(4%) rotate(5deg) scale(1.08,.89)'},
 dive:{windup:245,follow:355,style:'slash',poses:['translate(10%,-24%) rotate(13deg)','translate(-40%,4%) rotate(-18deg)','translate(-23%,-2%) rotate(-5deg)'],recoil:'translate(8%,-8%) rotate(16deg)'},
 flutter:{windup:255,follow:380,style:'pulse',poses:['translate(8%,-22%) rotate(14deg)','translate(-29%,-16%) rotate(-21deg) scale(1.1)','translate(-16%,-5%) rotate(9deg)'],recoil:'translate(10%,-9%) rotate(-15deg)'},
 vault:{windup:195,follow:350,style:'quake',poses:['translateX(4%) scale(1.13,.83)','translate(-35%,-10%) rotate(-12deg)','translate(-24%,4%) scale(1.13,.88)'],recoil:'translate(8%,-12%) rotate(9deg)'},
 draw:{windup:235,follow:295,style:'slash',poses:['translateX(10%) rotate(6deg)','translateX(-43%) rotate(-8deg)','translateX(-29%) rotate(-3deg)'],recoil:'translate(9%,-3%) rotate(7deg)'},
 maul:{windup:245,follow:415,style:'slash',poses:['translate(3%,-5%) scale(1.04,.89)','translate(-35%,-7%) rotate(-13deg) scale(1.12)','translate(-25%,4%) rotate(4deg) scale(1.06,.93)'],recoil:'translate(6%,-4%) rotate(8deg) scale(1.06,.89)'},
 coil:{windup:335,follow:405,style:'pulse',poses:['translate(4%,-10%) rotate(14deg) scale(.91,1.11)','translate(-27%,-8%) rotate(-18deg) scale(1.11)','translate(-15%,3%) rotate(6deg)'],recoil:'translate(8%,-6%) rotate(13deg) scale(.96,1.04)'}
};
const hitDelay=105;
export class RiftEnemyMotion{
 constructor(actor,id,reduced){
  this.actor=actor;
  this.art=actor.querySelector('.rift-enemy-art');
  this.arc=actor.querySelector('.rift-enemy-fx');
  this.move=moves[actor.dataset.body];
  this.reduced=reduced;
  this.arc.dataset.style=this.move.style;
  this.pose='idle';
  const sheet=new Image(),src=new URL(riftArt('motion',id),document.baseURI).href;
  sheet.src=src;
  sheet.decode().then(()=>{
   if(this.destroyed)return;
   this.art.style.setProperty('--rift-sheet',`url("${src}")`);
   this.art.dataset.drawn='true';
   this.drawPose();
  }).catch(()=>{});
  if(!reduced){
   const effect=new Image(),effectSrc=new URL(riftArt('foe-fx',this.move.style),document.baseURI).href;
   effect.src=effectSrc;
   effect.decode().then(()=>{
    if(this.destroyed)return;
    this.arc.style.setProperty('--rift-foe-fx',`url("${effectSrc}")`);
    this.arc.dataset.painted='true';
   }).catch(()=>{});
  }
 }
 drawPose(){
  const hit=this.art.dataset.hit;
  this.art.dataset.pose=hit==='defeat'?'defeat':this.pose==='attack'?'attack':hit==='hurt'?'hurt':this.pose;
 }
 hit(defeated){
  clearTimeout(this.hitTimer);
  if(defeated)this.stopAttack();
  this.hitTimer=setTimeout(()=>{
   this.hitAnimation?.cancel();
   if(defeated)this.actor.dataset.motion='defeat';
   this.art.dataset.hit=defeated?'defeat':'hurt';
   this.drawPose();
   const reaction=[{filter:'none',transform:'none'},{filter:this.reduced?'none':'brightness(1.32) saturate(.85)',transform:this.reduced?'none':this.art.dataset.drawn?'translateX(4%)':this.move.recoil,offset:.25}];
   reaction.push(defeated?{transform:this.reduced||this.art.dataset.drawn?'none':'translateY(10%) rotate(15deg) scale(.9)',opacity:.23,filter:'brightness(.68)'}:{transform:'none',filter:'none'});
   const animation=this.art.animate(reaction,{duration:defeated?355:220,easing:'ease-out',fill:defeated?'forwards':'none'});
   this.hitAnimation=animation;
   animation.onfinish=()=>{
    if(defeated)return;
    delete this.art.dataset.hit;
    this.drawPose();
   };
  },this.reduced?0:hitDelay);
 }
 attack(onImpact){
  if(this.contactTimer||this.recoverTimer||this.attackAnimation?.playState==='running')return;
  const {windup,follow,poses,vanish}=this.move;
  // Leave a beat for the player's hit before the enemy winds up.
  const lead=this.reduced?0:155;
  this.actor.dataset.motion='windup';
  this.windupTimer=setTimeout(()=>{this.pose='windup';this.drawPose();},lead);
  if(!this.reduced){
   const duration=lead+windup+follow,contact=(lead+windup)/duration;
   this.attackAnimation=this.actor.animate([
    {transform:'none'},{transform:'none',offset:lead/duration,easing:'ease-out'},
    {transform:poses[0],opacity:vanish ? .33 : 1,offset:(lead+windup*.72)/duration,easing:'ease-in'},
    {transform:poses[1],opacity:1,offset:contact,easing:'ease-out'},
    {transform:poses[2],offset:contact+.13,easing:'ease-in-out'},
    {transform:'none'}
   ],{duration});
  }
  this.contactTimer=setTimeout(()=>{
   this.contactTimer=null;
   this.actor.dataset.motion='attack';
   this.pose='attack';
   this.drawPose();
   this.recoverTimer=setTimeout(()=>{
    this.recoverTimer=null;
    this.actor.dataset.motion='idle';
    this.pose='idle';
    this.drawPose();
   },this.reduced?220:follow);
   if(!this.reduced){
    this.arcAnimation?.cancel();
    this.arcFrames?.cancel();
    if(this.arc.dataset.painted==='true')this.arcFrames=this.arc.animate([
     {backgroundPosition:'0% 50%',easing:'steps(1,end)'},
     {backgroundPosition:'50% 50%',offset:.17,easing:'steps(1,end)'},
     {backgroundPosition:'100% 50%',offset:.65},
     {backgroundPosition:'100% 50%'}
    ],{duration:follow});
    this.arcAnimation=this.arc.animate([
     {opacity:0,transform:'translateX(12%) scale(.54)'},{opacity:.94,offset:.22},
     {opacity:0,transform:'translateX(-25%) scale(1.32)'}
    ],{duration:follow,easing:'ease-out'});
   }
   onImpact();
  },lead+(this.reduced?0:windup));
 }
 stopAttack(){
  clearTimeout(this.windupTimer);
  clearTimeout(this.contactTimer);
  clearTimeout(this.recoverTimer);
  this.contactTimer=null;
  this.recoverTimer=null;
  this.attackAnimation?.cancel();
  this.arcAnimation?.cancel();
  this.arcFrames?.cancel();
  this.actor.dataset.motion='idle';
  this.pose='idle';
  this.drawPose();
 }
 reset(){
  clearTimeout(this.hitTimer);
  this.hitAnimation?.cancel();
  delete this.art.dataset.hit;
  this.stopAttack();
 }
 destroy(){
  this.destroyed=true;
  clearTimeout(this.hitTimer);
  this.hitAnimation?.cancel();
  this.stopAttack();
 }
}