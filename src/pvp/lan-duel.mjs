import {advanceMatch,createMatch,enqueueInput,finishMatch,publicMatch,readyPlayer} from '../../game-data/pk-engine.mjs';
import {lanSdp,localIceAddress} from '../../game-data/pk-lan.mjs';

const FAILURE='兩台電腦無法直接連線。請確認接在同一個區網，且校網允許電腦互連。';
const statsFields=['hp','shield','charge','combo','maxCombo','correct','attempted','accuracy','index'];
const DISCONNECT='區網對戰已中斷，本回不計勝負。';

function gather(pc) {
 if(pc.iceGatheringState==='complete')return Promise.resolve();
 return new Promise(resolve=>{
  const done=()=>{clearTimeout(timer);pc.removeEventListener('icegatheringstatechange',check);resolve();};
  const check=()=>{if(pc.iceGatheringState==='complete')done();};
  const timer=setTimeout(done,4000);
  pc.addEventListener('icegatheringstatechange',check);
 });
}

export class LanDuel {
 constructor(spec,me,{signal,state,failed,rejected}){
  Object.assign(this,{spec,me,signal,state,failed,rejected});
  this.other=spec.players.find(p=>p.id!==me).id;
  this.leads=spec.players[0].id===me;
  this.readyState=0;
  this.pc=new RTCPeerConnection({iceServers:[]});
  this.pc.addEventListener('connectionstatechange',()=>{
   clearTimeout(this.dropTimer);
   if(this.pc.connectionState==='failed')this.fail(this.readyState===1?DISCONNECT:FAILURE);
   if(this.pc.connectionState==='disconnected')this.dropTimer=setTimeout(()=>this.fail(DISCONNECT),8000);
  });
  this.timeout=setTimeout(()=>this.fail(FAILURE),15000);
  this.pc.addEventListener('datachannel',e=>{if(!this.leads&&!this.channel&&e.channel.label==='wuxia-lan-duel')this.bind(e.channel);else e.channel.close();});
 }
 async start(){
  if(!this.leads)return;
  this.bind(this.pc.createDataChannel('wuxia-lan-duel'));
  await this.describe(await this.pc.createOffer());
 }
 async describe(description){
  await this.pc.setLocalDescription(description);
  await gather(this.pc);
  if(this.closed)return;
  const sdp=lanSdp(this.pc.localDescription.sdp);
  if(!sdp)throw Error(FAILURE);
  this.signal({type:description.type,sdp});
 }
 async remote(description){
  if(this.closed||this.pc.remoteDescription||this.receiving||description.type!==(this.leads?'answer':'offer'))return;
  this.receiving=true;
  const sdp=lanSdp(description.sdp);
  if(!sdp)throw Error(FAILURE);
  await this.pc.setRemoteDescription({type:description.type,sdp});
  if(!this.leads&&!this.closed)await this.describe(await this.pc.createAnswer());
 }
 bind(channel){
  this.channel=channel;
  channel.addEventListener('message',e=>this.receive(e.data));
  channel.addEventListener('close',()=>this.fail(this.readyState===1?DISCONNECT:FAILURE));
  channel.addEventListener('open',()=>this.open().catch(()=>this.fail(FAILURE)),{once:true});
 }
 async open(){
  const stats=await this.pc.getStats();
  if(this.closed)return;
  const transport=[...stats.values()].find(s=>s.type==='transport'&&s.selectedCandidatePairId);
  const pair=stats.get(transport?.selectedCandidatePairId)??[...stats.values()].find(s=>s.type==='candidate-pair'&&s.nominated&&s.state==='succeeded');
  if(pair&&[stats.get(pair.localCandidateId),stats.get(pair.remoteCandidateId)].some(c=>
   c&&(!['host','prflx'].includes(c.candidateType)||(c.address&&!localIceAddress(c.address)))))throw Error(FAILURE);
  this.readyState=1;
  clearTimeout(this.timeout);
  if(this.leads){
   this.match=createMatch(this.spec);
   this.match.players.forEach(p=>p.connected=true);
   this.publish();
   this.loop=setInterval(()=>{if(advanceMatch(this.match))this.publish();},25);
  }else{
   if(this.firstState){this.deliver(this.firstState);this.firstState=null;}
   else this.timeout=setTimeout(()=>this.fail(DISCONNECT),10000);
  }
 }
 receive(raw){
  if(this.closed||typeof raw!=='string'||raw.length>40000)return;
  let data;try{data=JSON.parse(raw);}catch{return;}
  if(!data||typeof data!=='object')return;
  if(this.leads){if(this.readyState===1)this.handle(this.other,data);return;}
  if((data.type==='state'||data.type==='rejected')&&data.state?.id===this.spec.id&&data.state.me===this.me){
   if(this.readyState!==1){this.firstState=data;return;}
   this.deliver(data);
  }
 }
 deliver({type,state:s,reason}){
  if(!Array.isArray(s.players)||!Array.isArray(s.events)||!Array.isArray(s.targets)||!Array.isArray(s.pending)||
   s.players.length!==2||!['preparing','countdown','running','finished'].includes(s.status)||
   (s.status==='finished'&&!s.result))return;
  clearTimeout(this.timeout);
  // Only the agreed roster is rendered; the peer supplies gameplay values.
  s.players=this.spec.players.map(p=>{
   const incoming=s.players.find(q=>q?.id===p.id)??{};
   const fields=Object.fromEntries(statsFields.map(k=>[k,Number.isFinite(incoming[k])?Math.max(0,incoming[k]):0]));
   return {...p,...fields,ready:incoming.ready===true,connected:incoming.connected===true,tag:p.id.slice(-4).toUpperCase()};
  });
  s.events=s.events.filter(e=>e&&typeof e.type==='string'&&Number.isSafeInteger(e.id));
  s.targets=s.targets.filter(t=>t&&typeof t.code==='string'&&Number.isSafeInteger(t.index));
  s.pending=s.pending.filter(Number.isSafeInteger);
  if(s.result)s.result={reason:typeof s.result.reason==='string'?s.result.reason:'',winner:this.spec.players.find(p=>p.id===s.result.winner)?.id??null,draw:s.result.draw===true,void:s.result.void===true};
  s.route=this.spec.route;s.drill=this.spec.drill;s.saveStatus='local';
  this.finished=s.status==='finished';
  if(type==='rejected')this.rejected(s,reason);else this.state(s);
 }
 handle(id,data){
  const m=this.match;if(!m||this.finished)return;
  const now=Date.now();
  if(data.type==='ready'){if(readyPlayer(m,id,now))this.publish();}
  else if(data.type==='input'){
   const r=enqueueInput(m,id,data,now);
   if(!r.ok)this.snapshot(id,'rejected',r.reason);
  }else if(data.type==='forfeit'){
   finishMatch(m,'forfeit',now,m.players.find(p=>p.id!==id).id);this.publish();
  }
 }
 send(raw){
  if(this.readyState!==1)return;
  if(this.leads)queueMicrotask(()=>{if(!this.closed)this.handle(this.me,JSON.parse(raw));});
  else this.channel.send(raw);
 }
 snapshot(id,type='state',reason){
  const s=publicMatch(this.match,id);
  if(id===this.me){if(type==='rejected')this.rejected(s,reason);else this.state(s);}
  else this.channel.send(JSON.stringify({type,state:s,reason}));
 }
 publish(){
  if(this.closed||this.channel.readyState!=='open')return;
  this.finished=this.match.status==='finished';
  if(this.finished)clearInterval(this.loop);
  this.snapshot(this.other);
  this.snapshot(this.me);
 }
 fail(message){if(this.closed||this.finished)return;this.close();this.failed(message);}
 close(){this.closed=true;this.readyState=3;clearTimeout(this.timeout);clearTimeout(this.dropTimer);clearInterval(this.loop);this.pc.close();}
}