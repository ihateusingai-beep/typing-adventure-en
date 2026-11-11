import {LanDuel} from './lan-duel.mjs';
import {LAN_TRANSPORT} from '../../game-data/pk-lan.mjs';
import {comboName,comboTier,comboDamage} from '../../game-data/spirit-treasures.mjs';
import {DuelFeedback} from './duel-feedback.mjs';
import {PK_DRILLS,pkLabel,validPkCode} from '../../game-data/pvp-rules.mjs';
import {Sprite} from '../media.mjs';
import {PaintedFx} from '../xianxia-fx.mjs';
import {actorGeometry} from '../actor-point.mjs';
import {iconHTML} from '../icons.mjs';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const btn=(id,label,primary=false,attrs='')=>`<button type="button" class="${primary?'primary':'secondary'}" data-pk="${id}" ${attrs}>${label}</button>`;
const glyph=(id,label)=>iconHTML(id)+label;
const reasons={'time':'六十秒切磋完成','hp':'勝負已分','forfeit':'一方提前離場','disconnected':'連線未能恢復，本回不計勝負','not-ready':'準備逾時，本回不計勝負'};
function read(key,fallback){try{return JSON.parse(sessionStorage.getItem(key))??fallback;}catch{return fallback;}}
function remember(key,value){try{sessionStorage.setItem(key,JSON.stringify(value));}catch{}}
export class PvpClient{
 constructor(root,{profile,sound,toast,confirm,onExit,history,initial={}}){Object.assign(this,{root,profile,sound,toast,confirm,onExit,readHistory:history,initial});this.dead=false;this.sprites=[];this.fx=[];this.pending=[];this.held=new Set();this.phase='landing';this.drill=PK_DRILLS[this.profile().route][0].id;this.clockOffset=0;this.eventCursor=0;this.listeners=new AbortController();root.addEventListener('click',e=>{const b=e.target.closest('[data-pk]');if(b&&!b.disabled){e.preventDefault();this.sound.unlock();this.action(b).catch(e=>this.error(e));}},{signal:this.listeners.signal});root.addEventListener('submit',e=>{e.preventDefault();const b=e.target.querySelector('[data-pk]');if(b)this.action(b).catch(e=>this.error(e));},{signal:this.listeners.signal});window.addEventListener('keydown',e=>this.keydown(e),{capture:true,signal:this.listeners.signal});window.addEventListener('keyup',e=>this.held.delete(e.code),{signal:this.listeners.signal});window.addEventListener('blur',()=>this.held.clear(),{signal:this.listeners.signal});window.addEventListener('beforeunload',e=>{if(this.inBattle()){e.preventDefault();e.returnValue='';}},{signal:this.listeners.signal});this.heartbeat=setInterval(()=>this.pulse(),10000);this.timer=setInterval(()=>this.drawClock(),100);this.landing();this.resume();}
 inBattle(){return this.phase==='battle'&&!!this.state&&this.state.status!=='finished';}
 async resume(){const previous=read('wuxia-pk-room',null);if(this.initial.room){this.root.querySelector('[name=room]').value=this.initial.room;this.admission=this.initial.invite??'';this.admissionRoom=this.initial.room;this.toast('教室房號已填入，確認稱呼後加入即可。');}else if(previous?.transport===LAN_TRANSPORT){try{await this.join(previous.network?{network:true}:{room:previous.room});}catch(e){remember('wuxia-pk-room',null);this.error(e);}}}
 async session(force=false){if(!force&&this.auth&&Date.now()<this.expires-90000)return;const p=this.profile();const idToken=await p.user?.getIdToken();const r=await fetch('/api/pk/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:this.name??p.name,outfit:p.outfit,effect:p.effect,style:p.style,idToken})});const d=await r.json();if(!r.ok||!d.ok)throw Error(d.error??'PK 連線尚未就緒。');this.auth=d.token;this.me=d.player.id;this.expires=d.expiresAt;}
 async api(path,data,again=true){await this.session();const r=await fetch('/api/pk/'+path,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+this.auth},body:JSON.stringify(data),signal:AbortSignal.timeout(15000)});const d=await r.json();if(r.status===401&&again){await this.session(true);return this.api(path,data,false);}if(!r.ok||!d.ok){const e=Error(d.error??'對戰服務暫時未能連線。');e.code=d.code;throw e;}return d;}
 replace(html){const focus=this.root.contains(document.activeElement)?document.activeElement:null,id=focus?.dataset.pk,target=focus?.dataset.target,control=focus?.dataset.control;this.root.innerHTML=html;if(id)this.root.querySelector(`[data-pk="${id}"]${target?`[data-target="${target}"]`:''}${control?`[data-control="${control}"]`:''}`)?.focus({preventScroll:true});}
 landing(){
  this.phase='landing';document.body.dataset.pkPhase='landing';const p=this.profile(),route=p.route==='en'?'英文':'注音';
  this.replace(`<section class="pk-menu pk-room-menu"><div class="pk-heading"><div><p class="chapter">${route} · 區網對戰</p><h1>教室 PK</h1><p>與同學用兩台電腦切磋，兩人同意就能開打。</p></div><div class="pk-actions">${btn('network',glyph('challenges','同網路少俠'))}${btn('history',glyph('rank','我的戰績'))}</div></div>
  <label class="pk-name-field">顯示名稱<input name="pk-name" maxlength="20" value="${esc(this.name??p.name)}" autocomplete="off"></label>
  <div class="pk-room-grid">
   <article><h2>${glyph('challenges','開房間')}</h2><p>把六碼房號給同學。</p><label>練習鍵組<select name="drill">${PK_DRILLS[p.route].map(d=>`<option value="${d.id}" ${d.id===this.drill?'selected':''}>${d.label}</option>`).join('')}</select></label>${btn('create','開房間',true)}</article>
   <article><h2>${glyph('journey','加入房間')}</h2><p>輸入同學給你的房號。</p><form><label for="pk-room-code">六碼房號</label><input id="pk-room-code" name="room" maxlength="6" placeholder="例如 ABC234" autocomplete="off" autocapitalize="characters" spellcheck="false">${btn('join','加入房間',true)}</form></article>
  </div>
  <div class="pk-actions pk-room-footer">${btn('exit','返回五關挑戰')}</div></section>`);
 }
 async action(b){
  const id=b.dataset.pk;
  if(['network','join','create'].includes(id)){
   if(this.busy)return;
   const code=this.root.querySelector('[name=room]').value.trim().toUpperCase();
   if(id==='join'&&!/^[A-Z2-9]{6}$/.test(code)){this.root.querySelector('[name=room]').focus();throw Error('請輸入六碼房號。');}
   this.name=this.root.querySelector('[name=pk-name]').value.trim()||'少俠';
   this.drill=this.root.querySelector('[name=drill]').value;
   this.busy=true;b.disabled=true;
   try{
    await this.session(true);
    if(id==='create'){
     const d=await this.api('classrooms',{route:this.profile().route,drill:this.drill});
     await this.join({room:d.room.id});
    }else await this.join(id==='network'?{network:true}:{room:code,invite:code===this.admissionRoom?this.admission:undefined});
   }finally{this.busy=false;b.disabled=false;}
   return;
  }
  if(id==='invite')this.send(this.lobbyWS,{type:'invite',target:b.dataset.target});
  if(id==='accept'&&this.lobby.invite)this.send(this.lobbyWS,{type:'accept',invite:this.lobby.invite.id});
  if(id==='decline')this.send(this.lobbyWS,{type:'decline'});
  if(id==='ready'&&this.send(this.matchWS,{type:'ready'}))b.disabled=true;
  if(id==='copy'){
   try{await navigator.clipboard.writeText(this.room.id);this.toast('房號已複製。');}
   catch{const code=this.root.querySelector('.pk-room-code');const range=document.createRange();range.selectNodeContents(code);getSelection().removeAllRanges();getSelection().addRange(range);this.toast('已選取房號，請複製。');}
  }
  if(id==='forfeit'){if(await this.confirm('要認輸回大廳嗎？','本回會記為提前離場。'))this.send(this.matchWS,{type:'forfeit'});return;}
  if(id==='back'){this.endDuel();return;}
  if(id==='rematch'){const peer=this.state.players.find(p=>p.id!==this.me);this.endDuel();this.send(this.lobbyWS,{type:'invite',target:peer.id});return;}
  if(id==='history')await this.showHistory();
  if(id==='close-history'){if(this.room){this.phase='lobby';document.body.dataset.pkPhase='lobby';this.drawLobby();}else this.landing();}
  if(id==='leave'||id==='exit')await this.requestLeave(()=>id==='exit'?this.onExit():this.landing());
 }
 async join(data){
  const joined=await this.api('join',{...data,route:this.profile().route,transport:LAN_TRANSPORT});
  if(this.dead){this.api('leave',{room:joined.room.id}).catch(()=>{});return;}
  this.room=joined.room;this.joinData=data;this.lobby=null;
  remember('wuxia-pk-room',{...data,transport:LAN_TRANSPORT,room:this.room.id});
  this.phase='lobby';document.body.dataset.pkPhase='lobby';
  this.replace('<section class="pk-menu"><h1>正在加入…</h1><p role="status">載入在場名單。</p></section>');
  this.connect(joined.ticket);
 }
 connect(ticket){
  if(this.dead||!this.room)return;
  this.closeSocket('lobbyWS');
  const ws=new WebSocket((location.protocol==='https:'?'wss://':'ws://')+location.host+'/api/pk/lobby/ws',['wuxia-pk','ticket.'+ticket]);
  this.lobbyWS=ws;ws.lastMessage=Date.now();
  ws.addEventListener('message',e=>{
   if(this.dead||this.lobbyWS!==ws)return;
   ws.lastMessage=Date.now();let d;try{d=JSON.parse(e.data);}catch{return;}
   if(d.type==='transferred'){this.transfer();return;}
   if(d.type==='error')this.error(Error(d.error));
   if(d.type==='lobby'){
    this.lobby=d;this.me=d.me;this.room=d.room;
    if(d.pair&&!this.matchId&&d.pair.id!==this.lastPair)this.openMatch(d.pair);
    if(this.phase==='lobby')this.drawLobby();
   }
   if(d.type==='peer-signal'&&this.matchId===d.match)this.matchWS?.remote(d.description).catch(()=>{if(this.matchId===d.match)this.peerFailed('未能建立區網直連，請再試一次。');});
  });
  ws.addEventListener('open',()=>{this.lobbyWSAttempts=0;});
  ws.addEventListener('close',e=>{
   if(this.dead||this.lobbyWS!==ws||ws.intentional||this.transferred)return;
   if(e.code===4001){this.transfer();return;}
   if(this.phase==='lobby')this.drawLobby();
   this.scheduleReconnect();
  });
 }
 transfer(){
  this.transferred=true;this.closeSocket('lobbyWS');this.closeSocket('matchWS');this.clearActors();clearTimeout(this.resultTimer);
  this.phase='transferred';document.body.dataset.pkPhase='landing';this.room=null;remember('wuxia-pk-room',null);
  this.replace(`<section class="pk-menu"><h1>PK 已移至另一個分頁</h1><p>請到剛開啟的分頁繼續切磋。</p>${btn('exit','返回五關挑戰',true)}</section>`);
 }
 scheduleReconnect(){
  if(this.dead||this.transferred||!this.room)return;
  clearTimeout(this.lobbyWSRetry);
  const attempt=this.lobbyWSAttempts=(this.lobbyWSAttempts??0)+1;
  this.lobbyWSRetry=setTimeout(async()=>{
   const room=this.room;if(!room)return;
   try{
    const d=await this.api('join',{...this.joinData,route:this.profile().route,transport:LAN_TRANSPORT});
    if(!this.dead&&this.room?.id===room.id){
     this.connect(d.ticket);
     if(this.endedPair)this.lobbyWS.addEventListener('open',()=>this.reportPeerEnd(this.endedPair),{once:true});
    }
   }catch(e){
    if(this.dead||this.room?.id!==room.id)return;
    if(['closed','room','transport'].includes(e.code)){
     this.toast('房間已結束。');this.closeSocket('lobbyWS');this.room=null;remember('wuxia-pk-room',null);
     if(this.phase!=='battle')this.landing();
    }else this.scheduleReconnect();
   }
  },Math.min(5000,500*2**Math.min(attempt,4)));
 }
 closeSocket(key){clearTimeout(this[key+'Retry']);const ws=this[key];if(ws){ws.intentional=true;this[key]=null;ws.close();}}
 send(ws,d){if(ws?.readyState===1){try{ws.send(JSON.stringify(d));return true;}catch{}}return false;}
 pulse(){const ws=this.lobbyWS;if(ws?.readyState===1){if(Date.now()-ws.lastMessage>30000)ws.close();else this.send(ws,{type:'ping',echo:Date.now()});}}
 drawLobby(){
  if(!this.lobby||this.dead)return;
  const d=this.lobby,room=d.room,me=d.members.find(p=>p.id===this.me),inv=d.invite,network=room.kind==='network',connected=this.lobbyWS?.readyState===1;
  const rosterTop=this.root.querySelector('.pk-roster')?.scrollTop??0;
  this.replace(`<section class="pk-menu pk-room-menu"><div class="pk-heading"><div><p class="chapter">${me?.route==='zh-bpmf'?'注音':'英文'} · ${esc(me?.drillLabel??room.drill?.label??'')} · 區網對戰</p><h1>${network?'同網路少俠':'對戰房間'}</h1>${network?'':`<div class="pk-code-row"><span>房號</span><strong class="pk-room-code">${esc(room.id)}</strong>${btn('copy','複製房號')}</div>`}</div>${btn('leave',network?'返回 PK':'離開房間')}</div>
  ${!connected?'<p class="pk-banner" role="status">名單重新連線中…</p>':''}
  ${inv?`<div class="pk-invitation" role="status"><p>${inv.from===this.me?'已邀請 ':''}<b>${esc(inv.names[inv.a===this.me?inv.b:inv.a])}</b>${inv.from===this.me?'，等候回覆。':' 想和你切磋。'}</p><div class="pk-actions">${inv.accepted.includes(this.me)?'':btn('accept','接受',true,connected?'':'disabled')}${btn('decline',inv.from===this.me?'取消':'略過',false,connected?'':'disabled')}</div></div>`:''}
  <article class="pk-roster"><div class="pk-roster-head"><h2>在場學生 <small>${d.members.length} 位</small></h2></div>
  ${[...d.members].sort((a,b)=>Number(b.id===this.me)-Number(a.id===this.me)).map(p=>{
   const you=p.id===this.me,compatible=p.route===me?.route&&p.drill===me?.drill,available=connected&&p.status==='idle'&&compatible&&!inv&&!room.closed;
   const status=you?'你':p.status==='fighting'?'對戰中':p.status==='invited'?'邀請中':compatible?'可切磋':'不同路線';
   return `<div class="pk-player"><div><b>${esc(p.name)}</b><span>${status}</span></div>${you?'':btn('invite','邀請',false,`data-target="${p.id}" ${available?'':'disabled'} aria-label="邀請 ${esc(p.name)}"`)}</div>`;
  }).join('')}
  ${d.members.length<2?`<p class="pk-roster-empty">${network?'還沒有其他少俠。請同學也進入「同網路少俠」。':'等候同學輸入房號加入。'}</p>`:''}</article></section>`);
  this.root.querySelector('.pk-roster').scrollTop=rosterTop;
 }
 openMatch(spec){
  if(this.dead||!spec.players.some(p=>p.id===this.me))return;
  this.clearActors();this.matchId=spec.id;this.lastPair=spec.id;
  this.pending=[];this.eventCursor=0;this.state=null;this.clockOffset=0;this.resultVisible=false;
  this.phase='battle';document.body.dataset.pkPhase='battle';
  this.replace(`<section class="pk-menu"><h1>正在連接同學…</h1><p role="status">建立區網直連。</p>${btn('back','取消')}</section>`);
  try{
   this.matchWS=new LanDuel(spec,this.me,{
    signal:description=>{if(!this.send(this.lobbyWS,{type:'peer-signal',match:spec.id,description}))this.peerFailed('配對連線中斷，請再邀請一次。');},
    state:s=>{if(s.status==='finished')this.reportPeerEnd(s.id);this.matchState(s);},
    rejected:(s,reason)=>{this.pending=[];this.matchState(s);if(reason==='rate')this.toast('先看準，再穩穩出招。');},
    failed:message=>this.peerFailed(message)
   });
   this.matchWS.start().catch(()=>{if(this.matchId===spec.id)this.peerFailed('未能建立區網直連，請再試一次。');});
  }catch{this.peerFailed('這個瀏覽器無法建立區網連線，請改用教室的 Chrome 或 Edge。');}
 }
 reportPeerEnd(id){
  if(!id||!this.room)return;
  this.endedPair=this.send(this.lobbyWS,{type:'peer-end',match:id})?null:id;
 }
 peerFailed(message){if(this.dead)return;this.endDuel();this.toast(message);}
 endDuel(){
  this.reportPeerEnd(this.matchId);this.closeSocket('matchWS');this.clearActors();clearTimeout(this.resultTimer);this.resultTimer=null;
  this.state=null;this.matchId=null;this.pending=[];
  if(!this.room){this.landing();return;}
  this.phase='lobby';document.body.dataset.pkPhase='lobby';this.drawLobby();
 }
 matchState(s){if(this.dead||this.transferred||s.id!==this.matchId)return;this.clockOffset=s.serverTime-Date.now();const first=!this.state;this.state=s;this.seq=Math.max(s.seq,...this.pending.map(p=>p.seq),0);this.pending=this.pending.filter(p=>p.seq>s.seq||s.pending.includes(p.seq));if(first)this.buildArena(s);if(s.status!=='running')this.pending=[];this.renderStats();for(const e of s.events){if(e.id<=this.eventCursor)continue;this.eventCursor=e.id;if(!first)this.animate(e);}if(s.status==='finished'){if(first||this.resultVisible)this.result(s);else if(!this.resultTimer)this.resultTimer=setTimeout(()=>{this.resultTimer=null;this.resultVisible=true;if(!this.dead)this.result(this.state);},650);}this.drawClock();}
 buildArena(s){const order=[s.players.find(p=>p.id===s.me),s.players.find(p=>p.id!==s.me)];this.replace(`<section class="pk-arena" tabindex="-1" aria-label="雙人打字擂台"><div class="pk-fight-hud">${order.map((p,i)=>`<article class="pk-hp-block ${i?'pk-peer':''}" data-player="${p.id}"><div><b>${esc(p.name)}</b><small>${i?'對手':'你'} · #${p.tag}</small></div><div class="pk-hp-track" role="progressbar" aria-label="${i?'對手':'你的'}氣血" aria-valuemin="0" aria-valuemax="100"><i></i></div><p><strong data-hp>100 / 100</strong><span data-shield></span></p></article>`).join('')}<div class="pk-fight-time"><span>${iconHTML('clock')}切磋</span><b data-pk-clock>60</b><small data-pk-connection>區網直連</small></div></div><div class="pk-target-panel"><p>${s.route==='en'?'英文':'注音'} · ${esc(s.drill.label)} · 三鍵出招 <span class="pk-power" data-pk-power>起勢 · 9</span></p><div class="pk-key-sequence" aria-label="目前目標鍵"></div><div class="pk-charge" aria-label="出招蓄力"><i></i><i></i><i></i></div><div class="pk-feedback" aria-live="polite">看準亮起的鍵，再出招。</div></div><div class="pk-duel-stage">${order.map((p,i)=>`<div class="pk-fighter ${i?'pk-right':'pk-left'}"><div id="pk-sprite-${i}" aria-label="${esc(p.name)}"></div><div class="pk-ground"></div></div>`).join('')}<div class="pk-versus" aria-hidden="true">切<br>磋</div><div class="pk-round-overlay" aria-live="polite"></div></div><div class="pk-fight-footer"><div class="pk-live-stats"><span>${glyph('target','正確率')} <b data-pk-accuracy>—</b></span><span>${glyph('combo','連擊')} <b data-pk-combo>0</b></span><span>按對 <b data-pk-correct>0</b> 鍵</span></div>${btn('forfeit','認輸回大廳')}</div><div class="pk-result-layer" hidden></div></section>`);const stage=this.root.querySelector('.pk-duel-stage');this.assetsReady=false;this.assetError=false;this.sprites=order.map((p,i)=>{const sprite=new Sprite(this.root.querySelector('#pk-sprite-'+i),p.outfit,{reduced:this.profile().reduced,effectId:p.effect,attackStyle:p.style,relicId:p.relic??'none',facing:i?-1:1});sprite.playerId=p.id;sprite.impactPoint=()=>actorGeometry(stage,sprite,[.5,.65]);return sprite;});this.feedback=new DuelFeedback(stage,{reduced:this.profile().reduced});this.fx=this.sprites.map((sprite,i)=>{const fx=new PaintedFx(stage,{reduced:this.profile().reduced});fx.prepare(sprite);fx.setOpponent(this.sprites[1-i]);return fx;});Promise.all([...this.sprites.map(s=>s.ready),...this.fx.map(f=>f.ready)]).then(results=>{if(!this.dead&&this.matchId===s.id){this.assetError=results.slice(0,2).some(r=>!r?.[0]);this.assetsReady=!this.assetError;this.renderStats();}});this.root.querySelector('.pk-arena').focus({preventScroll:true});}
 renderStats(){const s=this.state;if(!s)return;const me=s.players.find(p=>p.id===s.me);this.root.querySelector('.pk-arena').dataset.comboTier=String(comboTier(me.combo));this.root.querySelector('[data-pk-power]').textContent=(s.rules==='pk-v2'?comboName(me.combo):'起勢')+' · '+(s.rules==='pk-v2'?comboDamage(me.combo):5)+' 傷害';this.root.querySelector('[data-pk=forfeit]').disabled=s.status==='finished';for(const p of s.players){const el=this.root.querySelector(`[data-player="${p.id}"]`);if(!el)continue;el.querySelector('[data-hp]').textContent=`${p.hp} / 100`;el.querySelector('[data-shield]').textContent=p.shield?'護盾 +'+p.shield:'';const bar=el.querySelector('.pk-hp-track');bar.setAttribute('aria-valuenow',p.hp);bar.querySelector('i').style.width=p.hp+'%';bar.classList.toggle('pk-low-hp',p.hp<=25);}
 this.root.querySelector('[data-pk-accuracy]').textContent=me.attempted?me.accuracy+'%':'—';this.root.querySelector('[data-pk-combo]').textContent=me.combo;this.root.querySelector('[data-pk-correct]').textContent=me.correct;this.root.querySelectorAll('.pk-charge i').forEach((e,i)=>e.classList.toggle('charged',i<me.charge));this.renderTarget();const overlay=this.root.querySelector('.pk-round-overlay');if(s.status==='preparing'){overlay.innerHTML=`<div><p>對手已就位</p><h2>準備切磋</h2><p>三鍵出招 · 按錯自己受傷</p>${btn('ready',this.assetError?'角色載入失敗，請稍後再試':!this.assetsReady?'角色準備中…':me.ready?'等候對手準備':'我準備好了 · Enter',true,!this.assetsReady||me.ready?'disabled':'')}<small>雙方都準備好，才會倒數。</small></div>`;}else if(s.status==='paused'){overlay.innerHTML=`<div><h2>等候連線恢復</h2><p>區網連線暫時中斷。</p></div>`;}else if(s.status==='running')overlay.innerHTML='';if(s.status==='paused')this.feedback?.pause();else this.feedback?.resume();this.sprites.forEach((p,i)=>{if(s.status==='paused'){p.pause();this.fx[i].pause();}else{p.resume();this.fx[i].resume();}});}
 renderTarget(){const s=this.state;if(!s)return;let index=s.index;for(const p of this.pending)if(p.correct&&p.index===index)index++;this.optimisticIndex=index;const targets=s.targets.filter(t=>t.index>=index).slice(0,5),el=this.root.querySelector('.pk-key-sequence');if(el)el.innerHTML=targets.map((t,i)=>`<span class="${i===0?'pk-current':''}">${esc(pkLabel(t.code,s.route))}</span>`).join('');}
 keydown(e){if(this.dead||this.phase!=='battle'||e.ctrlKey||e.metaKey||e.altKey||document.querySelector('#modal')?.open)return;if(e.target.closest?.('input,textarea,select'))return;if(e.code==='Enter'&&this.state?.status==='preparing'){if(e.repeat)return;this.root.querySelector('[data-pk=ready]:not(:disabled)')?.click();e.preventDefault();e.stopImmediatePropagation();return;}if(e.code==='Escape'){e.preventDefault();e.stopImmediatePropagation();this.root.querySelector('[data-pk=forfeit]')?.click();return;}if(!validPkCode(e.code))return;e.preventDefault();e.stopImmediatePropagation();if(e.repeat||this.held.has(e.code))return;this.held.add(e.code);if(this.state?.status!=='running'||this.matchWS?.readyState!==1||this.pending.length>=12||Date.now()+this.clockOffset>=this.state.endAt)return;const t=this.state.targets.find(t=>t.index===this.optimisticIndex);if(!t)return;const packet={type:'input',seq:++this.seq,index:t.index,nonce:t.nonce,code:e.code};if(this.send(this.matchWS,packet)){this.pending.push({...packet,correct:t.code===e.code});this.renderTarget();}}
 animate(e){
  const i=this.sprites.findIndex(p=>p.playerId===e.player);if(i<0)return;const sprite=this.sprites[i],fx=this.fx[i],feedback=this.root.querySelector('.pk-feedback');
  if(e.type==='strike'){sprite.finisher=e.finisher;sprite.act('attack',e.finisher?680:540);fx.strike(sprite,sprite.attackStyle,e.finisher);this.sound.play(e.finisher?'hit':sprite.attackStyle==='sword'?'attack':'magic',e.finisher?.4:.3);}
  if(e.type==='hurt'){sprite.act('hurt',420);const from=this.sprites.findIndex(p=>p.playerId===e.from);this.fx[from>=0?from:i].impact(sprite,(e.tier??0)>=2);this.feedback?.impact(sprite,e.damage,e.tier??0);this.sound.play('hurt',.3);}
  if(e.type==='wrong'){sprite.act('hurt',380);fx.hurt(sprite);this.feedback?.number(sprite,2,{kind:'mistake'});this.sound.play('hurt',.23);if(e.player===this.me){feedback.dataset.answer='wrong';feedback.textContent='✕ 按錯了 · 再按亮起的鍵。';}}
  if(e.type==='guard'||e.type==='shield'){sprite.act('defense',540);fx.guard(sprite);this.sound.play('guard',.24);if(e.type==='guard')this.feedback?.number(sprite,0,{kind:'guard',label:'格擋'});}
  if(e.type==='correct'&&e.player===this.me){feedback.dataset.answer='correct';feedback.textContent='✓ 按對了 · '+(e.combo%12===0?comboName(e.combo)+'！連擊爆發！':e.index%10===0?'十連擊！護盾已凝聚。':e.index%3===0?'命中！連招越穩，傷害越高。':'正在蓄力。');}
 }
 drawClock(){if(this.dead)return;const now=Date.now()+this.clockOffset;const s=this.state;if(!s)return;const clock=this.root.querySelector('[data-pk-clock]');if(clock)clock.textContent=s.status==='preparing'?'60':Math.min(60,Math.max(0,Math.ceil((s.endAt-(s.status==='paused'?s.pausedAt:now))/1000))).toString().padStart(2,'0');if(s.status==='countdown'){const o=this.root.querySelector('.pk-round-overlay'),n=Math.max(0,Math.ceil((s.startAt-now)/1000));if(o&&(o.dataset.count!==String(n)||!o.querySelector('.pk-countdown'))){o.dataset.count=String(n);o.innerHTML=`<div class="pk-countdown"><b>${n||'出招'}</b><span>看準第一個鍵</span></div>`;}}}
 result(s){const layer=this.root.querySelector('.pk-result-layer');if(!layer)return;const me=s.players.find(p=>p.id===this.me),peer=s.players.find(p=>p.id!==this.me),r=s.result,win=r.winner===this.me;layer.hidden=false;document.body.dataset.pkPhase='result';const title=r.void?'本回休息':r.draw?'旗鼓相當':win?'切磋勝出':'再接再厲';layer.innerHTML=`<div class="pk-result-card" role="status"><p class="chapter">${esc(reasons[r.reason]??'切磋結束')}</p><h1>${title}</h1><p>${r.void?'下回再一起出發。':win?'專注與穩定，讓你守住了這一戰。':'每一回切磋，都會讓你的雙手更熟悉鍵盤。'}</p><div class="pk-result-stats"><span>剩餘氣血<b>${me.hp} <small>/ ${peer.hp}</small></b></span><span>正確率<b>${me.accuracy}%</b></span><span>最高連擊<b>${me.maxCombo}</b></span></div><p class="small">本回紀錄保留在此分頁。</p><div class="pk-actions">${btn('back','回大廳',true)}${btn('rematch','邀請再戰')}</div></div>`;if(this.recorded!==s.id){this.recorded=s.id;const key=this.historyKey(),records=read(key,[]);records.unshift({matchId:s.id,route:s.route,finishedAt:s.serverTime,opponentName:peer.name,result:r.void?'void':r.draw?'draw':win?'win':'loss',accuracy:me.accuracy,hp:me.hp,maxCombo:me.maxCombo});remember(key,records.slice(0,30));this.sprites.forEach((p,i)=>{p.resume();this.fx[i].resume();p.act(r.void?'idle':p.playerId===r.winner?'victory':'hurt',1200);});}}
 historyKey(){return 'wuxia-pk-history-'+(this.profile().user?.uid??'guest');}
 async showHistory(){if(this.inBattle())return;this.phase='history';document.body.dataset.pkPhase='history';this.replace('<section class="pk-menu"><h1>我的切磋紀錄</h1><p role="status">正在讀取私人戰績…</p></section>');let records=read(this.historyKey(),[]),error='';if(this.profile().user){try{const cloud=await this.readHistory();const all=new Map([...records,...cloud].map(r=>[r.matchId,r]));records=[...all.values()].sort((a,b)=>b.finishedAt-a.finishedAt).slice(0,30);}catch{error='暫時讀不到帳號紀錄，以下顯示本分頁紀錄。';}}if(this.dead||this.phase!=='history')return;this.replace(`<section class="pk-menu"><div class="pk-heading"><div><p class="chapter">只有自己可查看</p><h1>我的切磋紀錄</h1></div>${btn('close-history','返回擂台')}</div><p>${esc(error|| (this.profile().user?'區網切磋保留在此分頁；舊帳號紀錄也顯示在這裡。':'訪客戰績保留在這個分頁，關閉分頁後可能清除。'))}</p>${records.length?`<div class="pk-history-table"><table><thead><tr><th>時間</th><th>對手</th><th>路線</th><th>結果</th><th>正確率</th><th>最高連擊</th></tr></thead><tbody>${records.map(r=>`<tr><td>${new Date(r.finishedAt).toLocaleString('zh-TW',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'})}</td><td>${esc(r.opponentName)}</td><td>${r.route==='en'?'英文':'注音'}</td><td>${({win:'勝',loss:'負',draw:'平手',void:'不計勝負'})[r.result]??'—'}</td><td>${Number(r.accuracy)||0}%</td><td>${Number(r.maxCombo)||0}</td></tr>`).join('')}</tbody></table></div>`:'<div class="pk-empty">還沒有切磋紀錄。找同學一起練習吧。</div>'}</section>`);}
 clearActors(){this.feedback?.destroy();this.feedback=null;this.sprites.forEach(s=>s.destroy());this.fx.forEach(f=>f.destroy());this.sprites=[];this.fx=[];}
 error(e){if(!this.dead){const message=e.name==='TimeoutError'?'連線較慢，請稍後重試。':/[\u3400-\u9fff]/.test(e.message??'')?e.message:'PK 暫時未能連線，請稍後重試。';this.toast(message);}}
 async requestLeave(next){
  if(this.inBattle()&&!await this.confirm('離開擂台？','本回會記為提前離場。'))return;
  if(this.inBattle()){
   this.send(this.matchWS,{type:'forfeit'});
   await new Promise(resolve=>setTimeout(resolve,100));
  }
  if(this.dead)return;
  const id=this.room?.id;this.reportPeerEnd(this.matchId);this.room=null;
  this.closeSocket('lobbyWS');this.closeSocket('matchWS');this.clearActors();clearTimeout(this.resultTimer);
  this.matchId=null;this.state=null;this.lobby=null;this.pending=[];this.endedPair=null;
  remember('wuxia-pk-room',null);
  if(id){try{await this.api('leave',{room:id});}catch(e){if(!['room','closed'].includes(e.code))this.error(e);}}
  if(!this.dead)next();
 }
 destroy(){clearTimeout(this.resultTimer);this.dead=true;this.listeners.abort();clearInterval(this.heartbeat);clearInterval(this.timer);this.closeSocket('lobbyWS');this.closeSocket('matchWS');this.clearActors();delete document.body.dataset.pkPhase;}
}