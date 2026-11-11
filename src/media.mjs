import {signatureFor,signaturePose,attackEffectEnabled} from '../game-data/signature-arts.mjs';
import {actorPoint} from './actor-point.mjs';
import {PaintedFx} from './xianxia-fx.mjs';
import {costumeStyle} from './costumes.mjs';
import {ENEMY_MOTION,combatPlan,spritePose,blendSpritePose} from './combat.mjs';
// Images are loaded by manifest and by current scene only. Missing art never silently becomes another character.
let manifest={portraits:{},motion:{},backgrounds:{},enemies:{}};
export async function initMedia(){try{const r=await fetch('game-data/media.json?v=drill1');if(r.ok)manifest=await r.json();}catch{}return manifest;}
export const media=()=>manifest;
export const outfitThumbnail=id=>manifest.motion[id]?.thumbnail??'assets/v3/thumbnails/'+id+'.webp';
export function portraitStyle(id,expression='calm'){
 const item=manifest.portraits[id];if(!item)return null;
 if(item.single)return `--portrait-aspect:${item.aspect??1};aspect-ratio:${item.aspect??1};background-image:url('${item.src}');background-size:contain;background-repeat:no-repeat;background-position:center;`;
 const index=(item.expressions??['calm','focused','happy','confused']).indexOf(expression);const frame=Math.max(0,index);
 return `--portrait-aspect:${item.aspect??1};aspect-ratio:${item.aspect??1};background-image:url('${item.src}');background-size:200% 200%;background-position:${frame%2*100}% ${Math.floor(frame/2)*100}%;`;
}
export function portraitHTML(id,expression='calm',classes=''){
 const style=portraitStyle(id,expression);
 return style?`<div class="portrait-art ${classes}" data-art-src="${manifest.portraits[id].src}" style="${style}" role="img" aria-label="人物立繪"></div>`:`<div class="art-unavailable ${classes}">人物圖片載入中</div>`;
}

const imageCache=new Map();
function loadImage(src){
 if(imageCache.has(src))return imageCache.get(src);
 const promise=new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error('image'));image.src=src;});imageCache.set(src,promise);promise.catch(()=>imageCache.delete(src));return promise;
}
export function watchArt(root){
 for(const el of root.querySelectorAll('[data-art-src]')){
  const src=el.dataset.artSrc;const timer=setTimeout(()=>{if(el.isConnected&&!el.dataset.loaded)el.dataset.slow='true';},5000);
  loadImage(src).then(()=>{clearTimeout(timer);if(!el.isConnected)return;el.dataset.loaded='true';delete el.dataset.slow;}).catch(()=>{clearTimeout(timer);if(!el.isConnected)return;el.style.backgroundImage='none';el.classList.add('art-failed');el.textContent='圖片暫時未能載入';const retry=document.createElement('button');retry.className='quiet';retry.textContent='重新載入';retry.onclick=()=>{el.replaceChildren();el.classList.remove('art-failed');el.style.backgroundImage=`url('${src}')`;watchArt(el.parentElement);};el.append(retry);});
 }
}

const effects={correct:'sfx_answer_correct.mp3',wrong:'sfx_answer_wrong.mp3',guard:'sfx_shield_block.mp3',victory:'sfx_level_up.mp3',attack:'sfx_player_attack.mp3',click:'sfx_button_click.mp3',swing:'sfx_player_attack.mp3',hit:'sfx_attack_crit.mp3',hurt:'sfx_monster_attack.mp3',equip:'sfx_buy_item.mp3',unlock:'sfx_level_up.mp3',magic:'sfx_skill_cast.mp3'};
export class Sound{
 constructor(){this.muted=false;this.music=null;this.track=null;this.active=[];this.unlocked=false;}
 unlock(){this.unlocked=true;if(this.music?.paused&&!this.muted)this.music.play().catch(()=>{});}
 setMuted(m){this.muted=m;if(this.music)this.music.muted=m;this.active.forEach(a=>a.muted=m);}
 play(name,volume=.35){if(this.muted||!this.unlocked)return;const src=effects[name];if(!src)return;const a=new Audio('audio/'+src);a.volume=volume;this.active.push(a);a.onended=()=>this.active=this.active.filter(x=>x!==a);a.play().catch(()=>{});if(this.active.length>6)this.active.shift().pause();}
 bgm(track='main'){if(this.track===track)return;this.music?.pause();this.track=track;this.music=new Audio('audio/'+({main:'bgm_main_game.mp3',title:'bgm_title_screen.mp3',battle:'bgm_battle.mp3',cultivation:'bgm_main_game.mp3'}[track]??'bgm_main_game.mp3'));this.music.loop=true;this.music.volume=.16;this.music.muted=this.muted;if(this.unlocked)this.music.play().catch(()=>{});}
 pause(){this.music?.pause();this.active.forEach(a=>a.pause());}
 resume(){if(this.unlocked&&!this.muted)this.music?.play().catch(()=>{});}
}
const ACTIONS={idle:{row:0,count:6,interval:150},run:{row:1,count:6,interval:70},jump:{row:2,count:6,interval:75},attack:{row:3,count:8,interval:48},defense:{row:4,count:6,interval:70},hurt:{row:5,count:4,interval:75},victory:{row:6,count:6,interval:140}};
const ENEMY_ACTIONS={idle:{row:0,count:6,interval:150},anticipation:{row:1,count:4,interval:100},attack:{row:2,count:6,interval:70},hurt:{row:3,count:4,interval:70},exit:{row:4,count:4,interval:120}};
export function resolveAnimationAction(item,action,style='sword',finisher=false){
 if(action==='charge')return 'cast';
 if(item?.signature&&((action==='attack'&&(style==='sword'||item.realm))||item.realm&&['cast','seal'].includes(action)))return 'signature';
 if(item?.q3&&action==='attack'){if(style==='spell')return finisher?'seal':'cast';if(style==='talisman')return 'seal';return item.realm&&finisher?'cast':'attack';}
 if(item?.realm&&action==='attack'){return finisher?(style==='spell'?'seal':'cast'):style==='spell'?'cast':style==='talisman'?'seal':'attack';}
 return (action==='cast'||action==='seal')&&!item?.actions?.[action]?'attack':action;
}
export function animationFrame(def,elapsed,{duration=500,loop=false,normalized=false,reduced=false}={}){
 if(reduced)return 0;
 if(def.durations){const total=def.durations.reduce((a,b)=>a+b,0);let t=loop?elapsed%total:Math.min(total-1,elapsed);for(let i=0;i<def.durations.length;i++){if(t<def.durations[i])return i;t-=def.durations[i];}}
 const index=Math.floor(normalized?elapsed/Math.max(1,duration)*def.count:elapsed/def.interval);
 return loop?index%def.count:Math.min(def.count-1,index);
}
export class Sprite{
 constructor(element,id,{enemy=false,reduced=false,effectId='auto',attackStyle='sword',relicId='none',facing=1,plantedGuard=false}={}){
  Object.assign(this,{el:element,id,enemy,reduced,effectId,attackStyle,relicId,facing,plantedGuard,action:'idle',frameAction:'idle',started:performance.now(),duration:0,until:0,pausedAt:0,timeOffset:0,frame:-1,dead:false,variant:0});
  this.item=enemy?manifest.enemies[id]:manifest.motion[id];this.signatureReady=!this.item?.signature;this.ready=Promise.all([this.item?.src?loadImage(this.item.src).catch(()=>null):null,this.item?.signature&&!reduced?loadImage(this.item.signature.src).then(()=>{this.signatureReady=true;this.el.dataset.signatureReady='true';}).catch(()=>{this.el.dataset.signatureReady='failed';}):null]);this.tick=this.tick.bind(this);this.configure();this.raf=requestAnimationFrame(this.tick);
 }
 configure(){
  this.el.classList.add('sprite-art');this.el.dataset.action='idle';this.el.dataset.character=this.id;this.el.dataset.realm=String(!!this.item?.realm);const anchor=this.item?.vfxAnchor??[.5,.55];this.el.dataset.artAnchorX=String(anchor[0]);this.el.dataset.artAnchorY=String(anchor[1]);if(!this.enemy)costumeStyle(this.el,this.id,this.effectId);
  if(this.item?.src){this.el.style.backgroundImage=`url('${this.item.src}')`;this.el.style.backgroundSize=`${this.item.columns*100}% ${this.item.rows*100}%`;}
  else if(this.enemy&&this.id==='nether_lord_boss'){this.el.style.backgroundImage="url('assets/monsters/nether_lord_boss.gif')";this.el.style.backgroundSize='contain';this.el.style.backgroundRepeat='no-repeat';}
  else{this.el.classList.add('sprite-fallback');this.el.textContent=this.enemy?'敵人圖片載入中':'角色圖片載入中';}
 }
 act(action,duration=500){this.entryPose=this.currentPose;this.action=action;this.frameAction=resolveAnimationAction(this.item,action,this.attackStyle,this.finisher);if(this.frameAction==='signature'&&(this.reduced||!this.signatureReady))this.frameAction=action==='attack'?'attack':'cast';this.el.dataset.frameAction=this.frameAction;this.started=performance.now();this.duration=duration;this.until=this.started+duration;this.frame=-1;this.variant++;this.el.dataset.action=action;const def=this.item?.actions?.[this.frameAction]??(this.enemy?ENEMY_ACTIONS:ACTIONS)[this.frameAction];if(this.item?.src&&def)this.drawFrame(def,0);}
 drawFrame(def,frame){const sheet=def.asset??this.item,cols=sheet.columns,rows=sheet.rows,key=sheet.src+'|'+cols+'|'+rows;if(this.sheetKey!==key){this.sheetKey=key;this.el.style.backgroundImage=`url('${sheet.src}')`;this.el.style.backgroundSize=`${cols*100}% ${rows*100}%`;}const cell=(def.start??(def.row??0)*cols)+frame;this.el.style.backgroundPosition=`${cols>1?cell%cols/(cols-1)*100:0}% ${rows>1?Math.floor(cell/cols)/(rows-1)*100:0}%`;}
 pause(){if(!this.pausedAt)this.pausedAt=performance.now();}
 resume(){if(this.pausedAt){const delta=performance.now()-this.pausedAt;this.started+=delta;this.until+=delta;this.timeOffset+=delta;if(this.freezeUntil){this.freezeUntil+=delta;this.frozenAt+=delta;}this.pausedAt=0;}}
 freezeFor(ms){this.frozenAt=performance.now();this.freezeUntil=this.frozenAt+ms;}
 tick(now){
  if(this.dead)return;this.raf=requestAnimationFrame(this.tick);if(this.pausedAt)return;
  if(this.freezeUntil){if(now<this.freezeUntil)return;const delta=this.freezeUntil-this.frozenAt;this.started+=delta;this.until+=delta;this.timeOffset+=delta;this.freezeUntil=0;}
  if(this.action!=='idle'&&now>this.until){this.entryPose=this.currentPose;this.action='idle';this.frameAction='idle';this.el.dataset.frameAction='idle';this.started=now;this.el.dataset.action='idle';}
  const action=this.item?.actions?.[this.frameAction]??(this.enemy?ENEMY_ACTIONS:ACTIONS)[this.frameAction]??(this.enemy?ENEMY_ACTIONS:ACTIONS).idle;
  const elapsed=now-this.started;
  if(!this.enemy){const sockets=signatureFor(this.id).castSockets,progress=this.frameAction==='signature'?Math.min(5,Math.max(0,elapsed/Math.max(1,this.duration)*6)):0,index=Math.floor(progress),mix=progress-index,a=sockets[index],b=sockets[Math.min(5,index+1)];this.el.dataset.castAnchorX=String((a[0]+(b[0]-a[0])*mix)/640);this.el.dataset.castAnchorY=String((a[1]+(b[1]-a[1])*mix)/640);}
  if(this.item?.src){
   const interval=this.action==='anticipation'?Math.max(100,this.duration/4):action.interval;
   const loop=['idle','run','victory'].includes(this.action);const frame=this.item.realm&&!this.item.q3&&this.action==='run'?0:animationFrame({...action,interval},elapsed,{duration:this.duration,loop,normalized:!!(this.item.realm||this.item.hd)&&!loop,reduced:this.reduced});
   if(frame!==this.frame||this.prevAction!==this.action){this.frame=frame;this.prevAction=this.action;this.drawFrame(action,frame);}
  }
  const basePose=spritePose({action:this.action,elapsed,duration:this.duration,clock:now-this.timeOffset,enemy:this.enemy,id:this.id,reduced:this.reduced,variant:this.variant});if(this.plantedGuard&&this.action==='defense'){basePose.x=0;basePose.y=0;}const targetPose=!this.enemy&&this.frameAction==='signature'?signaturePose(basePose,signatureFor(this.id).motion,this.action,elapsed,this.duration,this.reduced):basePose;
  const pose=this.reduced?targetPose:blendSpritePose(this.entryPose,targetPose,elapsed,this.action==='idle'?180:110);this.currentPose=pose;
  this.el.style.transform=`translate3d(${(pose.x*this.facing).toFixed(2)}px,${pose.y.toFixed(2)}px,0) rotate(${(pose.r*this.facing).toFixed(2)}deg) scale(${(pose.sx*this.facing*(this.item?.visualScale??1)).toFixed(3)},${(pose.sy*(this.item?.visualScale??1)).toFixed(3)})`;this.el.style.opacity=pose.opacity;
 }
 destroy(){this.dead=true;cancelAnimationFrame(this.raf);}
}
export class BattleEffects{
 constructor(stage,hero,enemy,{reduced=false,onCue=()=>{}}={}){
  Object.assign(this,{stage,hero,enemy,reduced,onCue,queue:[],active:null,dead:false,pausedAt:0,fx:[],nextIntent:performance.now()+2700,targetKind:'key',finishing:false,victory:false});
  this.painted=new PaintedFx(stage,{reduced});this.painted.prepare(hero);this.painted.setOpponent(enemy);costumeStyle(stage,hero.id,hero.effectId);stage.dataset.attackStyle=hero.attackStyle;stage.dataset.enemyTone=(ENEMY_MOTION[enemy.id]??ENEMY_MOTION.E_NEW_06).tone;
  this.tick=this.tick.bind(this);this.raf=requestAnimationFrame(this.tick);
 }
 setTarget(kind){this.targetKind=kind;if(!this.active&&!this.finishing&&kind==='guard')this.setIntent('guard');}
 setIntent(kind){
  this.stage.dataset.intent=kind;
  const el=this.stage.querySelector('.enemy-intent');if(el)el.textContent=kind==='windup'?'蓄勢':kind==='attack'?'試招':kind==='guard'?'等你防禦':'';
 }
 begin(plan,now=performance.now()){
  this.hero.finisher=!!plan.finisher;this.active={plan,started:now,beat:0};this.stage.classList.remove('correct','wrong','guarded');
  this.stage.classList.add(plan.type==='wrong'?'wrong':plan.type==='guard'?'guarded':'correct');this.stage.dataset.comboMove=plan.finisher?'finisher':'normal';this.setIntent('');
  this.advance(now);
 }
 event(type,context={}){
  if(this.dead||this.finishing)return;const plan=combatPlan(type,context);this.nextIntent=performance.now()+3200;this.idleIntentStarted=0;
  if(type==='wrong'){
   this.queue=[];this.clearFx();this.begin(plan);return;
  }
  this.stage.classList.remove('wrong');
  if(this.active?.plan.type==='wrong'){this.clearFx();this.begin(plan);return;}
  if(this.active){if(this.queue.length<2)this.queue.push(plan);else this.queue[this.queue.length-1]=plan;}
  else this.begin(plan);
 }
 point(actor){return actorPoint(this.stage,actor);}
 addFx(el,life=500){this.stage.append(el);this.fx.push({el,until:performance.now()+life});return el;}
 wave(from,to,hostile=false){
  if(this.reduced||!hostile&&!attackEffectEnabled(this.hero))return;const a=this.point(from),b=this.point(to);const el=document.createElement('i');el.className='combat-fx battle-wave'+(hostile?' hostile':this.hero.attackStyle==='spell'?' spell-projectile':this.hero.attackStyle==='talisman'?' talisman-projectile':'');if(!hostile&&this.hero.attackStyle==='talisman')el.innerHTML='<b>敕</b><b>令</b><b>行</b>';else if(!hostile&&this.hero.attackStyle==='spell')el.innerHTML='<b></b>';
  el.style.left=a.x+'px';el.style.top=a.y+'px';el.style.setProperty('--travel-x',b.x-a.x+'px');el.style.setProperty('--travel-y',b.y-a.y+'px');el.style.setProperty('--wave-angle',Math.atan2(b.y-a.y,b.x-a.x)+'rad');this.addFx(el,260);
 }
 impact(actor,kind,finisher=false){
  const p=this.point(actor),el=document.createElement('span');el.className='combat-fx impact-ring '+kind+(finisher?' finishing-hit':'');el.style.left=p.x+'px';el.style.top=p.y+'px';
  if(!this.reduced&&kind!=='clean-hit')for(let i=0;i<8;i++){const spark=document.createElement('i');spark.style.setProperty('--spark-x',Math.cos(i*Math.PI/4)*(finisher?80:47)+'px');spark.style.setProperty('--spark-y',Math.sin(i*Math.PI/4)*(finisher?68:40)+'px');el.append(spark);}
  this.addFx(el,520);
 }
 cue(name,plan){
  if(name==='hero-wave'){this.painted.strike(this.hero,this.hero.attackStyle,plan.finisher);this.wave(this.hero,this.enemy);this.onCue(this.hero.attackStyle==='sword'?'swing':'magic');}
  if(name==='enemy-wave')this.wave(this.enemy,this.hero,true);
  if(name==='hit-impact'){this.painted.impact(this.enemy,plan.finisher);this.impact(this.enemy,'clean-hit',plan.finisher);this.enemy.freezeFor(this.reduced?0:65);this.hero.freezeFor(this.reduced?0:65);this.onCue('hit');}
  if(name==='guard-impact'){this.painted.guard(this.hero);this.impact(this.hero,'shield-hit');this.onCue('guard');}
  if(name==='hurt-impact'){this.painted.hurt(this.hero);this.impact(this.hero,'hurt-hit');this.onCue('hurt');}
 }
 advance(now){
  const a=this.active;if(!a)return;
  while(a.beat<a.plan.beats.length&&now-a.started>=a.plan.beats[a.beat].at){const b=a.plan.beats[a.beat++];if(b.actor)this[b.actor].act(b.action,b.duration);if(b.cue)this.cue(b.cue,a.plan);}
 }
 tick(now){
  if(this.dead)return;this.raf=requestAnimationFrame(this.tick);if(this.pausedAt)return;
  this.fx=this.fx.filter(f=>{if(now>=f.until){f.el.remove();return false;}return true;});
  if(this.victory){if(now>=this.victoryUntil){this.victory=false;this.finishResolve?.(true);this.finishResolve=null;}return;}
  if(this.active){this.advance(now);if(now-this.active.started>=this.active.plan.duration){this.active=null;if(this.queue.length)this.begin(this.queue.shift(),now);else{this.stage.classList.remove('correct','wrong','guarded');if(this.finishing)this.beginVictory(now);}}return;}
  if(this.finishing)return;
  if(this.targetKind==='guard'){this.setIntent('guard');if(this.enemy.action==='idle')this.enemy.act('anticipation',1200);return;}
  if(now>=this.nextIntent){
   this.idleIntentStarted=now;this.nextIntent=now+6200;this.enemy.act('anticipation',1050);this.setIntent('windup');
  }
  if(this.idleIntentStarted){const age=now-this.idleIntentStarted;
   if(age>=1050&&age<1500&&this.stage.dataset.intent!=='attack'){this.enemy.act('attack',440);this.setIntent('attack');if(!this.reduced){const el=document.createElement('span');el.className='combat-fx practice-ripple';const p=this.point(this.enemy);el.style.left=p.x+'px';el.style.top=p.y+'px';this.addFx(el,500);}}
   if(age>=1550){this.idleIntentStarted=0;this.setIntent('');}
  }
 }
 pause(){if(this.pausedAt)return;this.pausedAt=performance.now();this.painted.pause();this.hero.pause();this.enemy.pause();this.stage.dataset.paused='true';}
 resume(){if(!this.pausedAt)return;const delta=performance.now()-this.pausedAt;if(this.active)this.active.started+=delta;this.nextIntent+=delta;if(this.idleIntentStarted)this.idleIntentStarted+=delta;this.fx.forEach(f=>f.until+=delta);if(this.victory)this.victoryUntil+=delta;this.pausedAt=0;this.painted.resume();this.hero.resume();this.enemy.resume();delete this.stage.dataset.paused;}
 finish(){this.finishing=true;this.idleIntentStarted=0;this.setIntent('');return new Promise(resolve=>{this.finishResolve=resolve;if(!this.active)this.beginVictory(performance.now());});}
 beginVictory(now){this.queue=[];this.clearFx();this.painted.victory(this.hero);this.victory=true;this.victoryUntil=now+920;this.stage.classList.remove('correct','wrong','guarded');this.stage.dataset.victory='true';this.hero.act('victory',1100);this.enemy.act('exit',900);}
 clearFx(){this.painted.clear();this.fx.forEach(f=>f.el.remove());this.fx=[];}
 destroy(){this.dead=true;cancelAnimationFrame(this.raf);this.clearFx();this.finishResolve?.(false);this.painted.destroy();this.hero.destroy();this.enemy.destroy();}
}