import {treasureId,treasureProc,comboDamage,comboTier} from './spirit-treasures.mjs';
import {PK_RULES as R,pkAccuracy,targetCode,validPkCode} from './pvp-rules.mjs';
const token=()=>crypto.randomUUID();
function fillTargets(m,p,nonce=token){while(p.targets.length<16){const index=p.index+p.targets.length;p.targets.push({index,code:targetCode(m.seed,index,m.drill.codes),nonce:nonce()});}}
export function createMatch({id,lobby,players,route,drill,seed,now=Date.now(),nonce=token}){
 const m={id,lobby,route,drill,seed,rules:R.version,status:'preparing',roomPaused:false,createdAt:now,prepareUntil:now+30000,startAt:null,endAt:null,pausedAt:null,pauseReason:null,queue:[],batchAt:null,events:[],eventSerial:0,revision:0,result:null,saved:{},players:players.map(p=>({...p,relic:treasureId(p.relic),relicStrikes:0,hp:R.hp,shield:0,charge:0,combo:0,maxCombo:0,attempted:0,correct:0,index:0,seq:0,ready:false,connected:false,reconnects:0,disconnectAt:null,targets:[],rate:[]}))};m.players.forEach(p=>fillTargets(m,p,nonce));return m;
}
export function readyPlayer(m,id,now){const p=m.players.find(p=>p.id===id);if(!p||!['preparing','countdown'].includes(m.status))return false;p.ready=true;if(m.players.every(p=>p.ready&&p.connected)&&m.status==='preparing'&&!m.roomPaused){m.status='countdown';m.startAt=now+R.countdown;m.endAt=m.startAt+R.duration;}m.revision++;return true;}
function event(m,type,data){m.events.push({id:++m.eventSerial,type,...data});m.events=m.events.slice(-96);}
export function finishMatch(m,reason,now=Date.now(),winner=null){if(m.status==='finished')return false;let decided=winner;if(reason==='hp'||reason==='time'){const [a,b]=m.players;if(a.hp===0&&b.hp===0)decided=null;else if(a.hp!==b.hp)decided=a.hp>b.hp?a.id:b.id;else if(pkAccuracy(a)!==pkAccuracy(b))decided=pkAccuracy(a)>pkAccuracy(b)?a.id:b.id;else decided=null;}m.status='finished';m.finishedAt=now;m.result={reason,winner:decided,draw:decided===null&&['hp','time'].includes(reason),void:!['hp','time','forfeit'].includes(reason)};m.queue=[];m.batchAt=null;event(m,'result',{result:m.result});m.revision++;return true;}
export function enqueueInput(m,id,input,now){
 if(m.status!=='running'||now<m.startAt||now>=m.endAt)return {ok:false,reason:'not-playing'};const p=m.players.find(p=>p.id===id);if(!p||!p.connected)return {ok:false,reason:'not-member'};
 if(!Number.isSafeInteger(input.seq)||input.seq!==p.seq+1)return {ok:false,reason:input.seq<=p.seq?'duplicate':'sequence'};
 if(!validPkCode(input.code)||!Number.isSafeInteger(input.index)||!p.targets.some(t=>t.index===input.index&&t.nonce===input.nonce))return {ok:false,reason:'target'};
 p.rate=p.rate.filter(t=>now-t<1000);if(p.rate.length>=24)return {ok:false,reason:'rate'};if(m.queue.filter(x=>x.player===id).length>=16)return {ok:false,reason:'backpressure'};
 p.rate.push(now);p.seq=input.seq;m.queue.push({player:id,seq:input.seq,index:input.index,code:input.code,nonce:input.nonce,at:now});m.batchAt??=Math.min(m.endAt,m.startAt+(Math.floor((now-m.startAt)/R.batch)+1)*R.batch);m.revision++;return {ok:true};
}
export function flushInputs(m,now,nonce=token){
 if(!m.queue.length)return false;
 const attacks=new Map(m.players.map(p=>[p.id,0])),modern=m.rules===R.version;
 for(const input of m.queue){
  const p=m.players.find(p=>p.id===input.player);if(!p||input.at>=m.endAt)continue;
  const t=p.targets[0];if(!t||t.index!==input.index||t.nonce!==input.nonce){event(m,'resync',{player:p.id});continue;}
  p.attempted++;
  if(input.code!==t.code){p.charge=0;p.combo=0;p.hp=Math.max(0,p.hp-R.mistake);event(m,'wrong',{player:p.id});continue;}
  p.correct++;p.index++;p.combo++;p.maxCombo=Math.max(p.maxCombo,p.combo);p.charge++;p.targets.shift();fillTargets(m,p,nonce);
  event(m,'correct',{player:p.id,index:p.index,combo:p.combo});
  if(p.combo%R.shieldEvery===0){p.shield=R.shieldHp;event(m,'shield',{player:p.id});}
  const strike=p.charge>=R.charge;
  if(strike){p.charge=0;p.relicStrikes=(p.relicStrikes??0)+1;const damage=modern?comboDamage(p.combo):5;
   attacks.set(p.id,attacks.get(p.id)+damage);event(m,'strike',{player:p.id,damage,combo:p.combo,tier:modern?comboTier(p.combo):0,finisher:modern?p.combo%12===0:p.combo%5===0});}
  if(modern){const proc=treasureProc(p.relic,{combo:p.combo,strikes:p.relicStrikes,strike});
   if(proc.kind){const healed=Math.min(proc.heal,R.hp-p.hp);p.hp+=healed;if(proc.shield)p.shield=Math.max(p.shield,proc.shield);attacks.set(p.id,attacks.get(p.id)+proc.damage);event(m,'treasure',{player:p.id,relic:p.relic,kind:proc.kind,damage:proc.damage,heal:healed,shield:proc.shield});}}
 }
 // Apply all attacks after both players' inputs; a single arbitration batch can draw.
 for(let i=0;i<2;i++){const p=m.players[i],from=m.players[1-i],damage=attacks.get(from.id);if(damage){const blocked=Math.min(damage,p.shield);p.shield-=blocked;p.hp=Math.max(0,p.hp-damage+blocked);event(m,blocked===damage?'guard':'hurt',{player:p.id,from:from.id,damage:damage-blocked,blocked,combo:from.combo,tier:modern?comboTier(from.combo):0});}}
 m.queue=[];m.batchAt=null;m.revision++;if(m.players.some(p=>p.hp<=0))finishMatch(m,'hp',now);return true;
}
export function advanceMatch(m,now=Date.now(),nonce=token){let changed=false;if(m.status==='preparing'&&!m.roomPaused&&now>=m.prepareUntil)return finishMatch(m,'not-ready',now);if(m.status==='countdown'&&now>=m.startAt){m.status='running';m.revision++;changed=true;}
 if(m.status==='paused'&&m.players.some(p=>!p.connected&&now-p.disconnectAt>=R.reconnect))return finishMatch(m,'disconnected',now);
 if(m.status==='running'){if(m.batchAt!==null&&now>=m.batchAt)changed=flushInputs(m,now,nonce)||changed;if(m.status==='running'&&now>=m.endAt){flushInputs(m,now,nonce);if(m.status!=='finished')finishMatch(m,'time',now);changed=true;}}return changed;}
export function connectionChanged(m,id,connected,now){
 const p=m.players.find(p=>p.id===id);if(!p||m.status==='finished'||p.connected===connected)return false;
 p.connected=connected;
 if(!connected){p.disconnectAt=now;if(['running','countdown','paused'].includes(m.status)){
  if(p.reconnects>=1){finishMatch(m,'disconnected',now);return true;}p.reconnects++;
  if(m.status!=='paused'){flushInputs(m,now);if(m.status!=='finished'){m.previousStatus=m.status;m.status='paused';m.pauseReason='disconnect';m.pausedAt=now;}}
 }}else{p.disconnectAt=null;if(m.status==='paused'&&m.pauseReason==='disconnect'&&m.players.every(p=>p.connected)&&!m.roomPaused){resume(m,now);}}
 m.revision++;return true;
}
function resume(m,now){const delta=now-m.pausedAt;m.startAt+=delta;m.endAt+=delta;m.status=m.previousStatus;m.previousStatus=null;m.pausedAt=null;m.pauseReason=null;}
export function hostPause(m,pause,now){
 m.roomPaused=pause;
 if(m.status==='preparing'){if(pause){m.prepareRemaining=m.prepareUntil-now;m.prepareUntil=now+30000;}else{m.prepareUntil=now+(m.prepareRemaining??30000);if(m.players.every(p=>p.ready&&p.connected))readyPlayer(m,m.players[0].id,now);}m.revision++;return true;}
 if(pause&&['countdown','running'].includes(m.status)){flushInputs(m,now);if(m.status==='finished')return false;m.previousStatus=m.status;m.status='paused';m.pauseReason='host';m.pausedAt=now;m.revision++;return true;}
 if(pause&&m.status==='paused'){m.pauseReason='host';m.revision++;return true;}
 if(!pause&&m.status==='paused'){if(m.players.some(p=>!p.connected)){finishMatch(m,'disconnected',now);return true;}resume(m,now);m.revision++;return true;}return false;
}
export function nextMatchAlarm(m,now){if(m.status==='preparing')return m.roomPaused?now+30000:m.prepareUntil;if(m.status==='countdown')return m.startAt;if(m.status==='running')return Math.max(now+1,Math.min(m.endAt,m.batchAt??m.endAt));if(m.status==='paused'){const missing=m.players.filter(p=>!p.connected);return missing.length?Math.min(...missing.map(p=>p.disconnectAt+R.reconnect)):now+30000;}return m.finishedAt+3600000;}
export function publicMatch(m,id,now=Date.now()){const me=m.players.find(p=>p.id===id);if(!me)throw Error('not-member');return {id:m.id,lobby:m.lobby,route:m.route,drill:{id:m.drill.id,label:m.drill.label},rules:m.rules,status:m.status,roomPaused:m.roomPaused,startAt:m.startAt,endAt:m.endAt,serverTime:now,pausedAt:m.pausedAt,pauseReason:m.pauseReason,revision:m.revision,result:m.result,eventSerial:m.eventSerial,events:m.events,me:id,targets:me.targets.slice(0,12),seq:me.seq,index:me.index,pending:m.queue.filter(q=>q.player===id).map(q=>q.seq),players:m.players.map(p=>({id:p.id,name:p.name,tag:p.id.slice(-4).toUpperCase(),outfit:p.outfit,effect:p.effect,style:p.style,relic:p.relic??'none',nextDamage:m.rules===R.version?comboDamage(p.combo+(R.charge-p.charge)):5,hp:p.hp,shield:p.shield,charge:p.charge,combo:p.combo,maxCombo:p.maxCombo,correct:p.correct,attempted:p.attempted,accuracy:pkAccuracy(p),index:p.index,ready:p.ready,connected:p.connected})),saveStatus:me.uid?(m.saved[me.id]??'pending'):'local'};}
export function matchSummary(m,id){const p=m.players.find(p=>p.id===id),other=m.players.find(p=>p.id!==id);return {matchId:m.id,rules:m.rules,route:m.route,drill:m.drill.id,relic:p.relic??'none',result:m.result.void?'void':m.result.draw?'draw':m.result.winner===id?'win':'loss',reason:m.result.reason,hp:p.hp,opponentHp:other.hp,opponentName:other.name,correct:p.correct,attempted:p.attempted,accuracy:pkAccuracy(p),maxCombo:p.maxCombo,startedAt:m.startAt,finishedAt:m.finishedAt};}