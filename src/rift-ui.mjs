import {RIFT_ROUTES,RIFT_UNLOCK_NODE,riftArt} from '../game-data/rift.mjs';
import {pkLabel} from '../game-data/pvp-rules.mjs';
import {riftAccuracy,riftTargets,riftInput,chooseRift,startRift} from './rift-engine.mjs';
import {Sprite} from './media.mjs';
import {PaintedFx} from './xianxia-fx.mjs';
import {actorGeometry} from './actor-point.mjs';
import {iconHTML} from './icons.mjs';
import {RiftEnemyMotion} from './rift-enemy-motion.mjs';

function enemyActorHTML(enemy){
 return `<div class="rift-actor rift-enemy" data-body="${enemy.body}" data-motion="idle"><div class="rift-enemy-fx" aria-hidden="true"></div><div class="rift-enemy-art"><img src="${riftArt('enemy',enemy.id)}" alt="${enemy.name}"><div class="rift-enemy-pose" aria-hidden="true"></div></div></div>`;
}

export function riftPreviewHTML(enemy){
 return `<section class="rift-preview"><div class="rift-stage rift-preview-stage" style="--foe:${enemy.color}">${enemyActorHTML(enemy)}</div>
  <p class="rift-preview-label" role="status">招式 · ${enemy.attack}</p>
  <div class="rift-preview-actions"><button class="primary" data-rift-preview="attack">${iconHTML('challenges')}看出招</button><button class="secondary" data-rift-preview="hurt">${iconHTML('target')}看受擊</button></div></section>`;
}

export function mountRiftPreview(root,enemy,reduced,sound){
 const motion=new RiftEnemyMotion(root.querySelector('.rift-enemy'),enemy.id,reduced);
 const label=root.querySelector('.rift-preview-label');
 for(const button of root.querySelectorAll('[data-rift-preview]'))button.addEventListener('click',()=>{
  motion.reset();
  if(button.dataset.riftPreview==='attack'){
   label.textContent=enemy.attack+' · 蓄勢';
   motion.attack(()=>{label.textContent=enemy.attack+' · 出招';sound.play('swing',.22);});
  }else{
   label.textContent=enemy.name+' · 受擊';
   motion.hit(false);
   sound.play('hit',.2);
  }
 });
 return motion;
}

export function riftHub(save,area='ruins',difficulty='normal'){
 const f=save.collection.forge,region=RIFT_ROUTES[area]??RIFT_ROUTES.ruins;
 const open=save.completedNodeIds.includes(RIFT_UNLOCK_NODE),unlocked=open&&(area==='ruins'||f.best===5);
 const instruction=!open?'完成劇情第二章後開放。':!unlocked?'通過古寺石陣後，便可踏入月隱山徑。':'每勝一戰，可選擇回氣或為下一戰蓄力。';
 return `<section class="rift-menu"><div class="chapter">試煉 / 五戰遠征</div><h1 class="section-title">異獸秘境</h1>
  <div class="rift-selectors"><label>秘境路線<select id="rift-area">${Object.entries(RIFT_ROUTES).map(([id,r])=>`<option value="${id}" ${id===area?'selected':''}>${r.name}</option>`).join('')}</select></label>
   <label>難度<select id="rift-difficulty"><option value="normal">一般</option><option value="hard" ${f.best===5?'':'disabled'} ${difficulty==='hard'&&f.best===5?'selected':''}>逆風${f.best===5?'':' · 通過古寺開放'}</option></select></label></div>
  <p class="rift-roster-hint">選一隻異獸，看看牠的招式。</p>
  <div class="rift-roster">${region.enemies.map(e=>`<article><button data-action="rift-preview" data-id="${e.id}" aria-haspopup="dialog"><img src="${riftArt('enemy',e.id)}" alt=""><b>${e.name}</b><small>${e.attack}</small></button></article>`).join('')}</div>
  <p>${instruction} 擊倒異獸可賺靈石，在鑄靈打造或強化裝備。</p><div class="pk-actions"><button class="primary" data-action="start-rift" ${unlocked?'':'disabled'}>${iconHTML('challenges')}進入秘境</button><button class="text-link" data-action="rift-forge">鑄靈</button><button class="text-link" data-action="trials">返回試煉</button></div></section>`;
}

export class RiftArena{
 constructor(root,{store,route,hard,area='ruins',sound,reduced,exit}){
  Object.assign(this,{root,store,route,hard,area,sound,reduced,exit});
  this.state=startRift(store.save,route,hard,crypto.getRandomValues(new Uint32Array(1))[0],crypto.randomUUID(),area);
  this.enemy=this.state.enemies[0];
  this.render();
 }
 render(){
  const e=this.enemy;
  this.root.innerHTML=`<section class="rift-battle"><header><div><span class="chapter">${this.hard?'逆風':'一般'} · 第 ${this.state.waves+1} / 5 戰</span><h1>${e.name}</h1></div><button class="secondary" data-rift="quit">結束本回</button></header>
  <div class="rift-health"><div><span>你的氣血 <b data-rift-hp></b> <small data-rift-shield></small></span><progress data-rift-player></progress></div><div><span>對手氣血 <b data-rift-enemy-hp></b></span><progress data-rift-enemy></progress></div></div>
  <div class="rift-stage" style="--foe:${e.color}"><div class="rift-actor rift-hero"></div>${enemyActorHTML(e)}</div>
  <div class="rift-bottom"><div class="rift-keys" aria-label="目標鍵"></div><p class="rift-feedback" aria-live="polite">依序按鍵，連續三鍵出招。</p><div class="rift-stats">正確率 <b data-rift-accuracy>—</b>　連擊 <b data-rift-combo>0</b></div></div><div class="rift-overlay" hidden></div></section>`;
  const scene=this.root.querySelector('.rift-stage'),save=this.store.save;
  this.hero=new Sprite(scene.querySelector('.rift-hero'),save.equippedOutfitId,{reduced:this.reduced,effectId:save.equippedEffectId,attackStyle:save.attackStyle,relicId:save.equippedTreasureId});
  this.foe=scene.querySelector('.rift-enemy');
  this.motion=new RiftEnemyMotion(this.foe,e.id,this.reduced);
  this.fx=new PaintedFx(scene,{reduced:this.reduced});this.fx.prepare(this.hero);
  this.target={el:this.foe,impactPoint:()=>actorGeometry(scene,this.foe,[.5,.45])};
  this.fx.setOpponent(this.target);
  this.draw();
 }
 draw(){
  const s=this.state,q=sel=>this.root.querySelector(sel),enemyMax=this.enemy.hp+(s.hard?10:0);
  q('[data-rift-hp]').textContent=s.hp+' / '+s.maxHp;
  q('[data-rift-shield]').textContent=s.shield?'護盾 '+s.shield:'';
  q('[data-rift-enemy-hp]').textContent=s.enemyHp+' / '+enemyMax;
  Object.assign(q('[data-rift-player]'),{value:s.hp,max:s.maxHp});
  Object.assign(q('[data-rift-enemy]'),{value:s.enemyHp,max:enemyMax});
  q('[data-rift-accuracy]').textContent=s.attempted?riftAccuracy(s)+'%':'—';
  q('[data-rift-combo]').textContent=s.combo;
  q('.rift-keys').innerHTML=s.phase==='fight'?riftTargets(s).map(c=>`<kbd>${pkLabel(c,s.route)}</kbd>`).join(''):'';
 }
 animate(e){
  const feedback=this.root.querySelector('.rift-feedback');
  feedback.dataset.answer=e.type==='wrong'||e.type==='ward'?'wrong':'correct';
  if(e.type==='wrong'||e.type==='ward'){
   this.hero.act(e.type==='ward'?'defense':'hurt',380);
   e.type==='ward'?this.fx.guard(this.hero):this.fx.hurt(this.hero);
   this.sound.play(e.type==='ward'?'guard':'hurt',.25);
   feedback.textContent=e.type==='ward'?'✕ 按錯了 · 月隱護符擋下這次傷害。':'✕ 按錯了 · 再按亮起的鍵。';return;
  }
  if(e.type==='strike'){
   this.hero.finisher=e.finisher;this.hero.act('attack',560);this.fx.strike(this.hero,this.hero.attackStyle,e.finisher);
   this.sound.play('attack',.35);
  }
  if(e.proc)this.fx.treasure(e.proc);
  if(e.damage){
   this.fx.impact(this.target,e.finisher,{delay:105});
   this.motion.hit(e.defeated);
  }
  if(e.defeated){feedback.textContent='✓ 按對了 · 擊敗 '+this.enemy.name+'！';return;}
  if(e.counter){
   this.motion.attack(()=>{
    this.hero.act(e.received?'hurt':'defense',440);
    if(e.received)this.fx.hurt(this.hero);else this.fx.guard(this.hero);
    this.sound.play(e.received?'hurt':'guard',.3);
    if(feedback.dataset.answer==='correct')feedback.textContent='✓ 按對了 · '+this.enemy.attack+' · '+(e.received?'受傷 '+e.received:'護盾擋下攻擊');
   });
   feedback.textContent='✓ 按對了 · '+this.enemy.name+'準備反擊。';
  }else feedback.textContent='✓ 按對了 · '+(e.damage?'命中 '+e.damage+' 點傷害！':e.proc?'品格寶物已生效。':'正在蓄力。');
 }
 key(code){
  const e=riftInput(this.state,code);if(!e)return false;
  this.draw();this.animate(e);
  if(this.state.phase==='choice')this.transition=setTimeout(()=>this.choice(),530);
  if(this.state.phase==='result')this.transition=setTimeout(()=>this.finish(),e.counter?700:530);
  return true;
 }
 choice(){
  const layer=this.root.querySelector('.rift-overlay');layer.hidden=false;
  layer.innerHTML=`<div><p class="chapter">已擊敗 ${this.state.waves} / 5</p><h2>下一戰，怎麼準備？</h2><div class="pk-actions"><button class="primary" data-rift="heal">回復 12 氣血</button><button class="secondary" data-rift="strike">下一擊 +9</button></div></div>`;
  layer.querySelector('button').focus({preventScroll:true});
 }
 click(action){
  if(action==='exit')return this.exit();
  if(action==='quit'){clearTimeout(this.transition);this.motion.destroy();this.state.phase='result';this.finish();return;}
  if(action==='retry'){this.saveReward();return;}
  if(!chooseRift(this.state,action))return;
  this.destroyActors();this.enemy=this.state.enemies[this.state.waves];this.render();this.root.focus({preventScroll:true});
 }
 finish(){
  const s=this.state,layer=this.root.querySelector('.rift-overlay');
  if(!layer||layer.dataset.finished)return;
  layer.hidden=false;layer.dataset.finished='true';
  layer.innerHTML=`<div><p class="chapter">${s.hard?'逆風':'一般'} · 異獸秘境</p><h2>${s.waves===5?'秘境通關':'本回完成'}</h2><p>擊敗 ${s.waves} / 5　·　正確率 ${riftAccuracy(s)}%</p><p data-rift-reward role="status">${s.waves?'正在保存靈石…':'擊敗一隻異獸就能獲得靈石。'}</p><div class="pk-actions"><button class="primary" data-rift="exit">返回秘境</button><button class="secondary" data-rift="retry" hidden>重試保存</button></div></div>`;
  layer.querySelector('button').focus({preventScroll:true});
  if(s.waves)this.saveReward();
 }
 async saveReward(){
  if(this.saving||this.saved)return;
  const layer=this.root.querySelector('.rift-overlay'),text=layer?.querySelector('[data-rift-reward]'),retry=layer?.querySelector('[data-rift=retry]');
  if(!text)return;
  this.saving=true;retry.hidden=true;text.textContent='正在保存靈石…';
  try{const r=await this.store.claimExpedition({...this.state,accuracy:riftAccuracy(this.state)});this.saved=true;text.textContent=r.stones?'獲得 '+r.stones+' 靈石。':'靈石已保存。';}
  catch{text.textContent='暫時無法保存靈石，可以再試一次。';retry.hidden=false;}
  finally{this.saving=false;}
 }
 destroyActors(){this.motion?.destroy();this.hero?.destroy();this.fx?.destroy();}
 destroy(){clearTimeout(this.transition);this.destroyActors();}
}