import {FIRST_CHALLENGE_CHAPTER,CHALLENGE_MIN_ACCURACY,CHALLENGE_REWARD_STONES,passesChallenge,shouldGuideChallenge} from './challenge-intro.mjs';
import {RiftArena,riftHub,riftPreviewHTML,mountRiftPreview} from './rift-ui.mjs';
import {RIFT_UNLOCK_NODE,RIFT_ROUTES} from '../game-data/rift.mjs';
import {treasureFor,availableTreasures} from '../game-data/spirit-treasures.mjs';
import {PvpClient} from './pvp/client.mjs';
import {trialArtFor,TRIAL_SCENES,trialMarkHTML} from '../game-data/challenge-art.mjs';
import {signatureFor} from '../game-data/signature-arts.mjs';
import {PaintedFx} from './xianxia-fx.mjs';
import {iconHTML as gameIcon} from './icons.mjs';
import {actionLabelHTML,decorateActions,modalActionIcon,modalTitleIcon,savePresentation} from './ui-polish.mjs';
import {approachFor} from './approaches.mjs';
import {launchProjectile} from './costumes.mjs';
import {collectionTabs,collectionBody,gemIcon} from './collection-ui.mjs';
import {DRAW_POOL,EFFECTS,ATTACK_STYLES,endlessReward,endlessGrade} from './collection.mjs';
import {unseenOutfits,markOutfitSeen,nextMissionId,AdvanceClock} from './rewards.mjs';
import {BPMF_KEYS,BPMF_BY_KEY,physicalKey,routeKey,routeLabel} from './keyboard.mjs';
import {NODES as EN_NODES,CHAPTERS as EN_CHAPTERS,NODE_BY_ID as EN_NODE_BY_ID,OUTFITS,ENEMIES,VERSION,blankSave,cleanName,accuracy,nextNode as englishNextNode,canStartNode,bossUnlocked,availableOutfits,availableEffects,availableAttacks,makeSession,targetOf,physicalCode,applyInput,sessionResult,completeNode,fingerFor,keyLabel,normalizeSave,mergeSaves,unlockDifferences,uid,resultStars,nodeStars,chapterStars,totalStars} from './core.mjs';
import {CHAPTER_COPY as EN_CHAPTER_COPY,openingFor as englishOpeningFor,closingFor as englishClosingFor,SPEAKERS,SCENES,missionFor as englishMissionFor} from './content.mjs';
import {EnemyDirector} from './enemy-director.mjs';
import {CHALLENGE_STAGES,CHALLENGE_ENEMIES,CHALLENGE_ENEMY_IDS} from '../game-data/challenge-enemies.mjs';
import {SaveStore} from './storage.mjs';
import {initMedia,media,portraitHTML,Sprite,BattleEffects,Sound,watchArt,outfitThumbnail} from './media.mjs';
const $=s=>document.querySelector(s),screen=$('#screen'),modal=$('#modal'),worldMenu=$('#world-menu');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const GAME_NAME='電腦打字大冒險';
function initialRoute(){return 'en';}
const stores={en:new SaveStore('en')},sound=new Sound();let store=stores.en;
let NODES,CHAPTERS,NODE_BY_ID,CHAPTER_COPY;
function setCatalog(){NODES=EN_NODES;CHAPTERS=EN_CHAPTERS;NODE_BY_ID=EN_NODE_BY_ID;CHAPTER_COPY=EN_CHAPTER_COPY;}
setCatalog();
const nextNode=save=>{const n=englishNextNode(save);return n?NODE_BY_ID[n.id]:null;};
const missionFor=n=>englishMissionFor(n);
const openingFor=(n,name)=>englishOpeningFor(n,name);
const closingFor=(n,r)=>[{speaker:'PEER',expression:'happy',text:session?.approach==='solo'?approachFor(n).soloAfter:approachFor(n).observeAfter},...englishClosingFor(n,r)];
let view='entry',chapterId='C01',typingMode='en',selectedOutfit='O00',session=null,node=null,fx=null,paused=false,dialogue=null,lastResult=null,legacyFrame=null,legacyKind='challenge',legacyIndex=0,generation=0,toastTimer,leaderboardAbort=null;
let pvp=null;
let sceneSprites=[],selectedMission=null,guideEnemy=null,guideStage=0,guideDirector=null;
let bootstrapping=true;
let selectedChallenge=0,entryNameDraft='',syncingRoutes=false;let wardrobeTab='outfits',outfitFilter='all',lastEndlessRun=null,lastChallengeRun=null;
const held=new Set();let sceneTimer=null;let pendingModalClose=null;
const shortcutCodes=[...'asdfghjklmn'].map(letter=>'Key'+letter.toUpperCase());
let shortcutIndex=0,shortcutAt=0;
const outfit=()=>OUTFITS.find(o=>o.id===store.save.equippedOutfitId)??OUTFITS[0];
const reduced=()=>store.save.settings.reducedMotion||matchMedia('(prefers-reduced-motion: reduce)').matches;
const primary=(action,label,attrs='')=>`<button class="primary" data-action="${action}" ${attrs}>${actionLabelHTML(action,label,attrs)}</button>`;
const secondary=(action,label,attrs='')=>`<button class="secondary" data-action="${action}" ${attrs}>${actionLabelHTML(action,label,attrs)}</button>`;
function toast(message){clearTimeout(toastTimer);const el=$('#toast'),warning=/無法|失敗|受限|不夠|太大|錯誤|尚未|請重試/.test(message);const success=/已安裝|已保存|已帶入|已公開|已取消|已匯出|穿好了|成功/.test(message);el.dataset.kind=warning?'warning':success?'success':'info';el.innerHTML=gameIcon(success&&!warning?'check':'help')+`<span>${esc(message)}</span>`;el.style.display='flex';toastTimer=setTimeout(()=>el.style.display='none',3000);}
function updateHeader(){
 document.body.classList.toggle('reduced',reduced());document.body.classList.toggle('high-contrast',store.save.settings.highContrast);sound.setMuted(store.save.settings.muted);
 const status=savePresentation(store.status),statusEl=$('#save-status');statusEl.innerHTML=gameIcon(status.icon)+`<span>${status.text}</span>`;statusEl.dataset.state=store.status;statusEl.title=status.hint;statusEl.setAttribute('aria-label',status.text+'，'+status.hint);
 document.querySelectorAll('#route-switch [data-action=typing-mode]').forEach(b=>{const on=b.dataset.id===typingMode;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));});
 document.body.dataset.route=typingMode;
 const full=$('[data-action=fullscreen]');full.disabled=!document.fullscreenEnabled;full.setAttribute('aria-pressed',String(!!document.fullscreenElement));full.innerHTML=`${gameIcon('fullscreen')}${document.fullscreenElement?'離開全螢幕':'全螢幕'} <kbd>F10</kbd>`;full.title='全螢幕（F10）';
 const badge=$('#player-badge'),name=store.save.displayName||'少俠';badge.innerHTML=`<span class="player-name">${esc(name)}</span><span class="player-stars" role="img" aria-label="累積 ${totalStars(store.save)} 顆星">${gameIcon('star')}<b>${totalStars(store.save)}</b></span>`;badge.title=name;badge.removeAttribute('aria-label');
 const unread=unseenOutfits(store.save).length;const wardrobeButton=$('#game-dock [data-action=wardrobe]');if(wardrobeButton){wardrobeButton.dataset.unread=String(unread>0);wardrobeButton.setAttribute('aria-label',unread?`服裝，${unread} 套新服裝待查看`:'服裝');}
 const active=({journey:'journey',battle:'journey',dialogue:'journey',result:'journey',briefing:'challenges',challenges:'challenges','enemy-guide':'challenges',rift:'trials','rift-battle':'trials',pvp:'challenges',legacy:legacyKind==='boss'?'trials':'challenges',boss:'trials',leaderboard:'challenges','endless-ranking':'trials'})[view]??view;
 document.querySelectorAll('.game-dock button').forEach(b=>{const on=b.dataset.action===active;b.classList.toggle('active',on);on?b.setAttribute('aria-current','page'):b.removeAttribute('aria-current');});
 const account=document.querySelector('.world-header [data-action=account]');account.innerHTML=gameIcon('user')+`<span>存檔與匯出</span>`;account.title='本機存檔、匯出與匯入';
}
let riftArena=null;
function setView(id,html,{scene='BG_YARD'}={}){
 if(view!==id)worldMenu.open=false;
 if(pvp){pvp.destroy();pvp=null;}
 if(riftArena){riftArena.destroy();riftArena=null;}
 stopAutoAdvance();generation++;sceneSprites.forEach(s=>s.destroy());sceneSprites=[];clearTimeout(sceneTimer);leaderboardAbort?.abort();leaderboardAbort=null;
 if(fx){fx.destroy();fx=null;}
 if(legacyFrame&&id!=='legacy'){legacyFrame.remove();legacyFrame=null;sound.resume();}
 const changed=view!==id;if(changed){shortcutIndex=0;clearTimeout(toastTimer);$('#toast').style.display='none';}view=id;document.body.dataset.view=id;screen.innerHTML=html;decorateActions(screen);if(changed){screen.scrollTop=0;window.scrollTo(0,0);}
 const route=({trials:'/trials',briefing:'/challenge',rift:'/rift','rift-battle':'/rift',pvp:'/pk',home:'/home',journey:'/missions',challenges:'/challenge',wardrobe:'/wardrobe',boss:'/boss','enemy-guide':'/enemies',account:'/account',settings:'/settings',leaderboard:'/leaderboard','endless-ranking':'/endless-ranking',entry:''})[id];
 if(!bootstrapping&&route!==undefined)history.replaceState(null,'',location.pathname+location.search+(route?'#'+route:''));
 const bg=media().backgrounds?.[scene]?.src??TRIAL_SCENES[scene]??SCENES[scene]??SCENES.forest;
 const sceneURL=`url('${new URL(bg,document.baseURI).href}')`;document.body.style.setProperty('--world-scene',sceneURL);
 const frame=screen.querySelector('.frame');if(frame)frame.style.setProperty('--scene-image',sceneURL);
 watchArt(screen);screen.focus({preventScroll:true});updateHeader();
}
function frame(content,classes='',attrs=''){return `<section class="frame"><div class="view active ${classes}" ${attrs}>${content}</div></section>`;}
function metrics(result,ids=false){const acc=accuracy(result);return `<div class="metrics" aria-label="本回表現"><div class="metric"><span class="metric-label">${gameIcon('target')}正確率</span><b ${ids?'id="stat-acc"':''}>${acc===null?'—':acc+'%'}</b></div><div class="metric"><span class="metric-label">${gameIcon('combo')}連擊</span><b ${ids?'id="stat-combo"':''}>${result.combo??result.maxCombo??0}</b></div><div class="metric"><span class="metric-label">${gameIcon('score')}分數</span><b ${ids?'id="stat-score"':''}>${result.score??0}</b></div></div>`;}
function updateEntryLogin(){/* local-only fork: no cloud login */}
function renderEntry(){
 sound.bgm('title');setView('entry',frame(`<div class="entry-copy"><div class="chapter">${GAME_NAME} / 英文鍵盤</div><h1>少俠，<br>從第一個字母開始吧。</h1><p>從 F、J 開始練習英文打字，慢慢認識整副鍵盤。<br>直接按鍵練習，不需要切換輸入法。進度自動保存在本機，無需登入。</p><form id="name-form"><label for="player-name">姓名或暱稱（選填）</label><input id="player-name" name="name" maxlength="40" autocomplete="off" placeholder="少俠" value="${esc(entryNameDraft)}">${secondary('submit-name','開始冒險 →','type="submit"')}</form>${store.guestAvailable?.completedNodeIds.length?'<button class="text-link" data-action="resume-guest">接續這台裝置的旅程</button>':''}</div><div class="entry-portrait">${portraitHTML('MASTER','encouraging')}</div>`,'entry'));
 $('#name-form').addEventListener('submit',event=>{event.preventDefault();if(event.currentTarget.querySelector('button').disabled)return;const name=cleanName($('#player-name').value)||'少俠';const enter=fresh=>{store.update({...fresh?blankSave(name):store.save,displayName:name},{nameDirty:true});entryNameDraft='';renderHome();};if(store.guestAvailable?.completedNodeIds.length){showModal('接續自己的旅程嗎？','<p>這台瀏覽器有進度紀錄。確認是自己的旅程，再接續；也可以重新開始。</p>',[{label:'重新開始',fn:()=>enter(true)},{label:'接續我的旅程',primary:true,fn:()=>enter(false)}]);}else enter(false);});
}
function renderHome(){
 sound.bgm('main');const next=nextNode(store.save),o=outfit();const cp=next?CHAPTER_COPY[next.chapterId]:CHAPTER_COPY.C07;
 setView('home',frame(`<div class="home-copy"><p class="home-place">${routeLabel(typingMode)}旅程 / ${esc(cp.place)}</p><h1 class="headline">${next?'江湖，等你出招。':'少俠，已名動江湖。'}</h1><p class="home-greeting">${esc(store.save.displayName||'少俠')}，${next?'今天從這一招繼續。':'新的挑戰正在等你。'}</p><div class="next-quest"><span>當前任務</span><h2>${next?esc(missionFor(next).title):'無盡挑戰'}</h2><p>${next?esc(CHAPTERS.find(c=>c.id===next.chapterId).title):'劇情已完成，無盡挑戰開放'}</p>${primary(next?'continue':'boss',next?'繼續冒險':'挑戰無盡')}</div></div><figure class="hero-figure">${portraitHTML(o.id,'calm')}<figcaption>${esc(o.name)}<small>${esc(o.title)}</small></figcaption></figure>`,'home'));

 if(store.importCandidate&&!modal.open)offerImport();
}
function starsHTML(count,classes=''){
 return `<span class="mission-stars ${classes}" role="img" aria-label="${count} 顆星，滿分 3 顆">${[1,2,3].map(i=>`<span class="${i<=count?'earned':''}" style="--star-order:${i}">${gameIcon('star')}</span>`).join('')}</span>`;
}
function renderJourney(id,selected){
 const next=nextNode(store.save);chapterId=id??next?.chapterId??'C07';const chapter=CHAPTERS.find(c=>c.id===chapterId)??CHAPTERS[0];chapterId=chapter.id;
 const nodes=chapter.nodeIds.map(id=>NODE_BY_ID[id]);selectedMission=selected&&chapter.nodeIds.includes(selected)?selected:(nodes.find(n=>canStartNode(store.save,n.id)&&!store.save.completedNodeIds.includes(n.id))??nodes[0]).id;
 const current=NODE_BY_ID[selectedMission],quest=missionFor(current),allowed=canStartNode(store.save,current.id),done=store.save.completedNodeIds.includes(current.id);
 const positions=nodes.length===5?[[10,60],[30,29],[50,60],[70,29],[90,60]]:nodes.length===3?[[18,60],[50,29],[82,60]]:[[14,60],[38,29],[62,60],[86,29]];
 const route=positions.map(([x,y],i)=>`${i?'L':'M'} ${x} ${y}`).join(' ');
 setView('journey',frame(`<div class="mission-board-head"><div><p class="map-location">${routeLabel(typingMode)}旅程 / ${esc(CHAPTER_COPY[chapterId].place)}</p><h1 class="section-title">${esc(chapter.title)}</h1></div><div class="star-total">${gameIcon('star')} ${chapterStars(store.save,chapter)} <small>/ ${nodes.length*3}</small></div></div><nav class="chapter-choices" aria-label="選擇章節">${CHAPTERS.map((c,i)=>{const open=canStartNode(store.save,c.nodeIds[0]);return `<button data-action="chapter" data-id="${c.id}" aria-pressed="${c.id===chapterId}" ${open?'':'disabled'}><span>第 ${i+1} 章 ${open?'':gameIcon('lock')}</span><b>${esc(c.title)}</b><small>${open?chapterStars(store.save,c)+' / '+c.nodeIds.length*3+' 星':'完成前章開放'}</small></button>`;}).join('')}</nav><div class="mission-board"><div class="map-region"><p class="mission-chapter-story">${esc(CHAPTER_COPY[chapterId].intro)}</p><div class="mission-list mission-map" aria-label="選擇任務"><svg class="map-route" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="${route}"></path></svg>${nodes.map((n,i)=>{const earned=nodeStars(store.save,n.id),open=canStartNode(store.save,n.id),q=missionFor(n);return `<button class="mission-card ${n.id===current.id?'selected':''} ${open?'':'locked'} ${earned?'completed':''}" style="--node-x:${positions[i][0]}%;--node-y:${positions[i][1]}%" data-action="select-mission" data-id="${n.id}" tabindex="${n.id===current.id?0:-1}" aria-pressed="${n.id===current.id}" aria-label="任務 ${i+1}：${esc(q.title)}，${open?earned+' 顆星':'尚未開放'}"><span class="mission-number">${open?(earned?gameIcon('check'):i+1):gameIcon('lock')}</span><span class="mission-card-copy"><b>${esc(q.title)}</b></span>${starsHTML(earned)}</button>`;}).join('')}</div><div class="map-legend"><span><span class="desktop-key-hint"><kbd>←</kbd><kbd>→</kbd> 選關　<kbd>Enter</kbd> 接受任務</span><span class="pointer-hint">選擇節點，接受任務</span></span><span>★ 一星就能前進</span></div></div><article class="mission-detail" tabindex="-1"><div class="mission-enemy" id="mission-enemy" aria-label="${esc(ENEMIES[current.enemyId].name)}"></div><div class="chapter mission-status">${gameIcon(done?'check':allowed?'journey':'lock')}${done?nodeStars(store.save,current.id)===3?'三星完成 · 歡迎再練習':'已完成 · 再集一顆星':allowed?'當前委託':'待解鎖委託'}</div><h2>${esc(quest.title)}</h2><p>${esc(quest.brief)}</p><div class="mission-detail-stars">${starsHTML(nodeStars(store.save,current.id))}</div><div class="mission-goal"><span>${gameIcon('keyboard')}練習</span><b>${esc(current.title)}</b></div>${allowed?primary('lesson',done?'再次挑戰':'接受任務',`data-id="${current.id}"`):`<p class="mission-lock-note">${gameIcon('lock')}完成前一個任務後開放</p>`}<button class="text-link" data-action="star-guide">星星怎麼拿？</button></article></div>`,'journey mission-menu'),{scene:current.backgroundId});
 sceneSprites.push(new Sprite($('#mission-enemy'),current.enemyId,{enemy:true,reduced:reduced()}));
}
function renderDialogue(lines,onDone,{skippable=false,choices=false}={}){
 dialogue={lines,index:0,onDone,skippable,choices};showDialogueLine();
}
function showDialogueLine(){
 const d=dialogue,line=d.lines[d.index];const name=line.speaker==='HERO'?(store.save.displayName||'少俠'):SPEAKERS[line.speaker];
 setView('dialogue',frame(`<div class="topline"><button class="quiet" data-action="leave-lesson">← 山門</button><span class="dialogue-stage-name">${esc(node?missionFor(node).title:'鍵心之旅')}</span></div><div class="dialogue-art">${portraitHTML(line.speaker==='HERO'?outfit().id:line.speaker,line.expression)}</div><div class="dialogue-copy"><p class="speaker">${esc(name)}</p><p class="speech">${esc(line.text)}</p><div class="dialogue-actions">${primary('next-line',d.index===d.lines.length-1?(d.onDone===renderStoryResult?'看看成果 · Enter →':d.choices?approachFor(node).observe+' · Enter →':'準備好了 · Enter →'):'繼續 →')}${d.choices&&d.index===d.lines.length-1?`<button class="secondary" data-action="dialogue-choice" data-id="solo">${esc(approachFor(node).solo)}</button><button class="text-link" data-action="dialogue-choice" data-id="ask">${esc(approachFor(node).ask)}</button>`:''}<span class="dialogue-step">${d.index+1} / ${d.lines.length}</span>${d.skippable?'<button class="text-link" data-action="skip-lines">略過已讀對話</button>':''}</div></div>`,'dialogue'),{scene:node?.backgroundId??'forest'});
}
function nextLine(skip=false){if(!dialogue)return;const d=dialogue;if(skip||++d.index>=d.lines.length){dialogue=null;d.onDone(d.choices?{demo:true}:undefined);}else showDialogueLine();}
function startLesson(id){
 if(!canStartNode(store.save,id)){toast('先完成前面的練習，再到這裡。');return;}
 node=NODE_BY_ID[id];session=makeSession(node);lastResult=null;paused=false;
 renderDialogue(openingFor(node,store.save.displayName||'少俠'),(choice={demo:true})=>{session.approach=choice.demo?'observe':'solo';renderBattle();if(choice.demo)showDemo({intro:true});},{skippable:store.save.completedNodeIds.includes(id),choices:true});
}
function restartLesson(id=node?.id){
 if(!canStartNode(store.save,id))return;
 stopAutoAdvance();held.clear();dialogue=null;lastResult=null;paused=false;
 node=NODE_BY_ID[id];session=makeSession(node);session.approach='solo';
 renderBattle();sound.resume();
}
function keyboardHTML(){
 const t=targetOf(session);if(!t)return '';const char=BPMF_KEYS[t.char]??t.char.toLowerCase();let row='asdfghjkl;';if('1234567890-'.includes(char))row='1234567890-';else if('qwertyuiop'.includes(char))row='qwertyuiop';else if('zxcvbnm,./'.includes(char))row='zxcvbnm,./';else if(char===' ')row=' ';
 return `${t.shift?'<kbd class="lit">Shift</kbd>':''}${Array.from(row).map(k=>`<kbd class="${k===char?'lit':k==='f'||k==='j'?'anchor':''}">${esc(k===' '?'空白':typingMode==='zh-bpmf'?(BPMF_BY_KEY[k]??'·'):k.toUpperCase())}</kbd>`).join('')}`;
}
function targetHTML(){
 const t=targetOf(session);if(!t)return '';
 if(t.kind==='guard')return `<span class="story-guard-label">${gameIcon('shield')}格擋</span><kbd class="story-guard-key">${esc(keyLabel(t.char))}</kbd>`;
 return `${t.shift?'<span class="shift-hint">Shift ＋</span>':''}${Array.from(t.value).map((char,i)=>`<span class="${i<session.progress?'done':i===session.progress?'current':''} ${char===' '?'space-char':''}">${esc(char===' '?'空白':t.kind==='word'||t.kind==='case'?char:char.toUpperCase())}</span>`).join('')}`;
}
function renderBattle(){
 const enemy=ENEMIES[node.enemyId],o=outfit();setView('battle',frame(`<div class="story-hud">${metrics(session,true)}<button class="quiet" data-action="pause">${gameIcon('pause')}暫停 Esc</button></div><div class="story-playfield"><div class="target-area"><div class="target-label" id="target-label">${routeLabel(typingMode)} / ${esc(missionFor(node).title)}</div><div class="target-word" id="target-word" aria-label="目前輸入目標">${targetHTML()}</div><div class="finger" id="finger">${esc(fingerFor(targetOf(session).char))} · 目標會等你</div></div><div class="story-actors"><div class="actor-wrap hero-actor"><div id="hero-motion" aria-label="${esc(o.name)}"></div></div><div class="actor-wrap enemy-actor"><div id="enemy-motion" aria-label="${esc(enemy.name)}"></div><span class="enemy-intent" aria-hidden="true"></span><span class="actor-caption">${esc(enemy.name)}</span></div></div><div class="story-message" id="story-message" role="status" aria-live="polite">先看準，再出招。</div><div class="keyboard-hint" id="keyboard-hint" ${node.chapterId==='C01'?'':'hidden'}>${keyboardHTML()}</div><div class="battle-help-row"><button class="text-link" data-action="help-key">看看鍵位</button><button class="text-link" data-action="demo">重看示範</button></div><div class="no-keyboard">練習打字請使用實體鍵盤。</div></div>`,'battle',`id="battle-stage" data-node-id="${node.id}"`),{scene:node.backgroundId});
 const hero=new Sprite($('#hero-motion'),o.id,{reduced:reduced(),effectId:store.save.equippedEffectId,attackStyle:store.save.attackStyle,relicId:store.save.equippedTreasureId});const foe=new Sprite($('#enemy-motion'),node.enemyId,{enemy:true,reduced:reduced()});
 fx=new BattleEffects($('#battle-stage'),hero,foe,{reduced:reduced(),onCue:cue=>sound.play(cue, cue==='hurt'?.52:.48)});fx.setTarget(targetOf(session).kind);sound.bgm(node.chapterId==='C07'?'battle':'main');
}
function showDemo({intro=false}={}){
 if(!session||session.done||view!=='battle')return;if(!intro)session.assisted=true;paused=true;fx?.pause();const t=targetOf(session);const code=t.kind==='word'?`照順序輸入「${t.value}」，亮起的是下一個字。`:t.kind==='guard'?`看到防禦提示，按 ${keyLabel(t.char)}。沒有倒數，先看清楚。`:t.shift?`按住 Shift，再按 ${t.char}。`:`用${fingerFor(t.char)}找到 ${keyLabel(t.char)}，輕輕按一次。`;
 const key=t.shift?'Shift ＋ '+keyLabel(t.char):keyLabel(t.char);
 showModal('師傅示範',`<p>${esc(code)}</p>${t.kind==='word'?`<div class="demo-word">${esc(t.value.replaceAll(' ','〔空白〕'))}</div>`:''}<button type="button" class="demo-key demo-confirm-key" data-demo-code="${physicalCode(t.char)}" data-demo-shift="${!!t.shift}" aria-label="用 ${esc(key)} 確認示範">${esc(key)}</button><p class="small">按 <kbd>Enter</kbd> 或 <kbd>${esc(key)}</kbd> 開始練習。這次確認不計分。</p>`,[{label:'我來試試',primary:true,fn:resumeBattle}]);
 modal.querySelector('[data-demo-code]').addEventListener('click',()=>modal.querySelector('[data-modal-index="0"]').click());
}
function resumeBattle(){paused=false;fx?.resume();screen.focus({preventScroll:true});sound.resume();}
function processKey(event){
 const result=applyInput(session,event);if(result.event==='ignored')return;
 session=result.state;const correct=result.event!=='wrong';if(correct)clearTimeout(sceneTimer);const move=result.event==='complete'?(result.target.kind==='guard'?'guard':result.target.kind==='word'?'word':'correct'):result.event;fx?.event(move,{combo:session.combo});
 $('#stat-acc').textContent=accuracy(session)+'%';$('#stat-combo').textContent=session.combo;$('#stat-score').textContent=session.score;
 const answer=correct?'correct':'wrong',msg=$('#story-message');msg.dataset.answer=answer;$('#target-word').dataset.answer=answer;
 if(result.event==='complete'){finishLesson();return;}
 $('#target-word').innerHTML=targetHTML();const current=targetOf(session);fx?.setTarget(current.kind);$('#finger').textContent=(current.shift?'按住 Shift，再按字母':fingerFor(current.char))+' · 目標會等你';$('#keyboard-hint').innerHTML=keyboardHTML();
 if(!correct){msg.textContent='✕ 按錯了 · '+(session.errorStreak>=3?`先找${fingerFor(current.char)}下的 ${keyLabel(current.char)}。目標會等你。`:`再按 ${keyLabel(current.char)} 試一次。`);if(session.errorStreak>=3)$('#keyboard-hint').hidden=false;if(session.errorStreak===5){sceneTimer=setTimeout(()=>{if(view==='battle'&&!paused)showDemo();},550);}}
 else{msg.textContent='✓ 按對了 · '+(result.event==='guard'?'守住了！看準再出下一招。':result.event==='word'?'這一串完成了，穩穩的一招。':session.combo%5===0?`${session.combo} 連擊，越來越穩了。`:'看下一個亮起的鍵。');}
}
function finishLesson(){
 clearTimeout(sceneTimer);const result=sessionResult(session),before=store.save.nodeRecords[node.id]?.bestResult,oldStars=nodeStars(store.save,node.id);const completed=completeNode(store.save,node.id,result);lastResult={newTreasures:availableTreasures(completed.save).filter(t=>!availableTreasures(store.save).some(old=>old.id===t.id)),result,before,rewards:completed.newOutfits,node,newStars:Math.max(0,nodeStars(completed.save,node.id)-oldStars)};store.update(completed.save);
 if($('#story-message'))$('#story-message').textContent='最後一招，按對了 ✓';const gen=generation;
 fx.finish().then(finished=>{if(finished&&view==='battle'&&generation===gen){sound.play('victory',.4);renderDialogue(closingFor(node,result),renderStoryResult);}});
}
let advanceTimer=null,advanceClock=null;
function stopAutoAdvance(){clearInterval(advanceTimer);advanceTimer=null;advanceClock=null;const label=$('#auto-next-label');if(label)label.textContent='已留在這裡，準備好再出發。';const cancel=$('[data-action=stop-auto]');if(cancel)cancel.hidden=true;}
function startAutoAdvance(next){
 if(!next||!store.save.settings.autoAdvance)return;
 advanceClock=new AdvanceClock(6);const tick=()=>{if(view!=='result'||!advanceClock)return;const seconds=advanceClock.step(performance.now(),{paused:document.hidden||modal.open});const label=$('#auto-next-label');if(label)label.textContent=seconds+' 秒後前往下一個任務';if(seconds===0){stopAutoAdvance();startLesson(next);}};
 tick();advanceTimer=setInterval(tick,150);
}
document.addEventListener('visibilitychange',()=>advanceClock?.step(performance.now(),{paused:true}));
function renderStoryResult(){
 const {result,before,rewards,node:n,newStars}=lastResult;const earned=resultStars(result),best=nodeStars(store.save,n.id),next=nextMissionId(store.save,n.id);
 const guide=n.id===FIRST_CHALLENGE_CHAPTER&&shouldGuideChallenge(store.save);
 const feedback=earned===3?'看得準，也能自己找到鍵。三星任務完成！':earned===2?'這一回打得很穩。準備好時，再來挑戰第三顆星。':'你完成了這份委託！可以繼續冒險，也能回來慢慢練。';
 setView('result',frame(`<div class="chapter">委託完成 / ${esc(CHAPTERS.find(c=>c.id===n.chapterId).title)}</div><h1>${esc(missionFor(n).title)}</h1>${starsHTML(earned,'result-stars')}<p>${esc(feedback)}</p><div class="star-result-note">${newStars?`新收集 ${newStars} 顆星`:'這次的旅程也留下了紀錄'} · 本關最佳 ${best} 星</div>${metrics(result)}${rewards.length?`<div class="reward-note reward-unlocked">${gameIcon('gift')}<span>新服裝解鎖：${esc(rewards[0].name)}<small>${esc(rewards[0].effectName)} · 去服裝欄看看紅點</small></span></div>`:''}${lastResult.newTreasures?.length?`<div class="reward-note reward-unlocked">${gameIcon('gem')}<span>新靈寶：${esc(lastResult.newTreasures[0].name)}<small>到服裝的「靈寶」頁籤攜帶，可疊加現有特效。</small></span></div>`:''}${guide?`<aside class="first-challenge-guide"><h2>第二章完成！先去挑戰一回</h2><p>從第一關「紮馬步」開始。看清符文再按鍵，三分鐘結束時，正確率達 ${CHALLENGE_MIN_ACCURACY}% 就能完成挑戰。每回達標可領 ${CHALLENGE_REWARD_STONES} 靈石，兩回就能存到一次祈願的費用${store.save.collection.draws===0?'，首抽保證獲得服裝':''}。</p></aside>`:''}<div class="result-actions">${guide?primary('first-challenge','前往第一關挑戰')+(next?secondary('next-lesson','先繼續第三章',`data-id="${next}"`):''):next?primary('next-lesson',gameIcon('next')+' 下一個任務 · Enter',`data-id="${next}"`):primary('boss',gameIcon('boss')+' 無盡挑戰 · Enter')}${!guide&&rewards.length?secondary('wear-and-next',next?'穿上新衣並出發':'穿上新衣',`data-id="${rewards[0].id}" data-next="${next??''}"`):''}${secondary('restart-lesson','重新挑戰',`data-id="${n.id}"`)}${secondary('mission-results','回任務選單',`data-id="${n.id}"`)}</div>${!guide&&next&&store.save.settings.autoAdvance?`<div class="auto-next"><span id="auto-next-label" aria-live="off">6 秒後前往下一個任務</span><button class="text-link" data-action="stop-auto">留在這裡</button></div>`:''}<details class="result-details"><summary>查看本回紀錄與三星條件</summary><p>最高連擊 ${result.maxCombo} · 有效按鍵 ${result.attempted}<br>首次看見目標時答對 ${result.firstCorrect} / ${result.firstAttempted}<br>${result.assisted?'本回曾使用鍵位提示。':'本回未使用額外提示。'}</p><button class="text-link" data-action="star-guide">查看三星條件</button></details>`,'result mission-result'),{scene:n.backgroundId});
 if(!guide)startAutoAdvance(next);const resultPanel=$('.mission-result');resultPanel.addEventListener('pointerdown',stopAutoAdvance,{once:true});resultPanel.addEventListener('focusin',stopAutoAdvance,{once:true});$('.result-details').addEventListener('toggle',stopAutoAdvance,{once:true});
}
const outfitGroup=o=>/^O2[6-9]$/.test(o.id)?'heroines':o.category??'jianghu';
const filteredOutfits=()=>OUTFITS.filter(o=>outfitFilter==='all'||outfitGroup(o)===outfitFilter);
function attachPreview(current){sound.bgm(current.realm?'cultivation':'main');const sprite=new Sprite($('#outfit-motion'),current.id,{plantedGuard:true,reduced:reduced(),effectId:store.save.equippedEffectId,attackStyle:store.save.attackStyle,relicId:store.save.equippedTreasureId});sprite.previewFx=new PaintedFx($('.outfit-cast-stage'),{reduced:reduced()});sprite.previewFx.prepare(sprite);sceneSprites.push(sprite,sprite.previewFx);}
function outfitActions(current){
 return `<div class="outfit-preview-actions">${secondary('preview-outfit',gameIcon('challenges')+' 出招','data-motion="attack"')}${secondary('preview-outfit',gameIcon('shield')+' 格擋','data-motion="defense"')}<details class="outfit-motion-more"><summary>更多動作</summary><div>${secondary('preview-outfit','奔行','data-motion="run"')}${secondary('preview-outfit','輕功','data-motion="jump"')}${current.realm?secondary('preview-outfit','施法','data-motion="cast"')+secondary('preview-outfit','結印','data-motion="seal"'):''}</div></details></div>`;
}
function renderWardrobe(id){
 if(id)wardrobeTab='outfits';if(wardrobeTab!=='outfits'){renderCollection();return;}
 selectedOutfit=id??store.save.equippedOutfitId;const current=OUTFITS.find(o=>o.id===selectedOutfit)??OUTFITS[0];if(outfitFilter!=='all'&&!filteredOutfits().some(o=>o.id===current.id))outfitFilter=outfitGroup(current);const owned=new Set(availableOutfits(store.save).map(o=>o.id));const unlocked=owned.has(current.id);const wearing=store.save.equippedOutfitId===current.id;
 if(unlocked&&unseenOutfits(store.save).some(o=>o.id===current.id))store.update(markOutfitSeen(store.save,current.id));
 const pending=new Set(unseenOutfits(store.save).map(o=>o.id));const requirement=current.category==='rift'?'可用靈石在鑄靈取得':current.category==='limited'?'集滿原有 16 套後，從限定祈願取得':current.item?'靈石祈願取得':!current.node?'起始服裝':current.id==='O04'?'完成劇情最終節後取得':`完成第 ${Number(current.node.slice(1,3))} 章後取得`;
 setView('wardrobe',frame(`<div class="outfit-preview costume-preview"><div class="outfit-cast-stage"><div id="outfit-motion" aria-label="${esc(current.name)}動態預覽"></div></div>${outfitActions(current)}</div><div class="outfit-body">${collectionTabs(wardrobeTab,store.save)}<div class="chapter">我的旅程 / ${esc(current.title)}</div><h1 class="section-title">${esc(current.name)}</h1><p class="small">${esc(current.description)}</p><div class="outfit-power">${gameIcon('combo')}<span>${esc(signatureFor(current.id).name)}${signatureFor(current.id).description!==current.description?`<small>${esc(signatureFor(current.id).description)}</small>`:''}</span></div><div class="outfit-options"><label class="catalog-select outfit-filter-select">衣裝系列<select data-outfit-series>${[['all','全部衣裝'],['ordinary-heroines','普通女俠 · 8 套'],['heroines','秘境女俠 · 4 套'],['jianghu','江湖'],['immortal','仙途'],['limited','限定'],['rift','秘境']].map(([id,label])=>`<option value="${id}" ${outfitFilter===id?'selected':''}>${label}</option>`).join('')}</select></label>${filteredOutfits().map(o=>{const locked=!owned.has(o.id);return `<button class="outfit-card ${locked?'locked':''}" data-action="outfit" ${o.realm?'data-realm="'+esc(o.realm)+'"':''} data-id="${o.id}" aria-pressed="${o.id===current.id}" aria-label="${esc(o.name)}${locked?'，尚未取得，可預覽':o.id===store.save.equippedOutfitId?'，目前穿著':pending.has(o.id)?'，新服裝':'，已取得'}"><img class="outfit-icon" src="${outfitThumbnail(o.id)}" alt="" loading="lazy"><span>${esc(o.name)}${pending.has(o.id)?'<i class="new-dot" aria-hidden="true"></i>':''}</span><small class="loadout-state">${gameIcon(locked?'lock':pending.has(o.id)?'gift':o.id===store.save.equippedOutfitId?'check':'wardrobe')}${locked?'尚未取得':pending.has(o.id)?'新取得':o.id===store.save.equippedOutfitId?'目前穿著':'已取得'}</small></button>`;}).join('')}</div><p class="outfit-caption">${unlocked?(wearing?'目前穿著':'已取得，可以換上'):requirement}</p>${!unlocked&&current.category==='rift'?secondary('rift-forge','前往鑄靈'):!unlocked&&current.category==='limited'?secondary('collection-tab','前往限定祈願','data-id="limited-draw"'):primary('equip',wearing?'已穿上':unlocked?'穿上這套衣服':'尚未取得',`data-id="${current.id}" ${!unlocked||wearing?'disabled':''}`)}<p class="small outfit-fairness">專屬劍光與護環隨服裝改變，分數與傷害維持相同。</p></div>`,'wardrobe'),{scene:current.realm?'BG_IMMORTAL':'BG_YARD'});
 attachPreview(current);
}
function renderCollection(){
 const current=outfit();selectedOutfit=current.id;
 setView('wardrobe',frame(`<div class="outfit-preview costume-preview"><div class="outfit-cast-stage"><div id="outfit-motion" aria-label="${esc(current.name)}裝備預覽"></div></div>${outfitActions(current)}<p class="equipped-summary">${esc(current.name)} · ${esc(ATTACK_STYLES.find(a=>a.id===store.save.attackStyle)?.name??'劍氣')}</p></div><div class="outfit-body collection-body">${collectionTabs(wardrobeTab,store.save)}${collectionBody(store.save,wardrobeTab)}</div>`,'wardrobe collection-view'),{scene:current.realm?'BG_IMMORTAL':'BG_YARD'});
 attachPreview(current);
}
function equipLoadout(kind,id){
 if(kind==='effect'&&!availableEffects(store.save).some(e=>e.id===id)||kind==='attack'&&!availableAttacks(store.save).some(a=>a.id===id))return;
 store.update({...store.save,[kind==='effect'?'equippedEffectId':'attackStyle']:id},{loadoutDirty:true});sound.play('equip',.45);renderWardrobe();toast('已安裝，可以預覽出招。');
}
async function drawCollection(){
 const current=store,button=$('[data-action=draw-item]');if(!button||button.disabled)return;button.disabled=true;button.setAttribute('aria-busy','true');button.innerHTML=gameIcon('clock')+'<span>祈願中…</span>';
 try{const result=await current.draw(button.dataset.pool);if(store!==current||view!=='wardrobe')return;renderWardrobe();sound.play('unlock',.5);const item=result.item;
  const image=item.kind==='outfit'?`<img class="draw-outfit" src="${outfitThumbnail(item.target)}" alt="${esc(item.name)}">`:`<span class="attack-emblem ${item.kind==='attack'?'style-'+item.target:'style-spell'}">${gameIcon(item.kind==='attack'?item.target:'gift')}</span>`;
  showModal(result.firstOutfit?'第一套祈願服裝':item.rarity==='限定'?'獲得限定服裝':'獲得新珍藏',`<div class="draw-reveal">${image}<span class="chapter">${item.rarity}</span><h3>${esc(item.name)}</h3><p>已加入收藏，可以獨立搭配服裝、特效與流派。</p><small>目前靈石 ${current.save.collection.stones}</small></div>`,[{label:'繼續看看'},{label:item.kind==='outfit'?'穿上這套衣服':'立刻安裝',primary:true,fn:()=>{if(item.kind==='outfit'){wardrobeTab='outfits';store.update({...markOutfitSeen(store.save,item.target),equippedOutfitId:item.target},{outfitDirty:true});renderWardrobe(item.target);}else{wardrobeTab=item.kind==='effect'?'effects':'attacks';equipLoadout(item.kind==='effect'?'effect':'attack',item.target);}}}]);
 }catch(error){if(store===current){toast(error.message||'祈願暫時未完成，請重試。');if(view==='wardrobe')renderWardrobe();}}
}
async function renderEndlessRanking(){
 setView('endless-ranking',frame(`<div class="chapter">玩家自行選擇公開 / 練習排行榜</div><h1 class="section-title">${routeLabel(typingMode)}無盡江湖榜</h1><p class="small">每位玩家顯示一筆最佳成績。只公開遊戲暱稱與練習結果。</p><div class="rank-personal"><b>我的最佳 ${store.save.bossBest.score} 分</b><span>${endlessGrade(store.save.bossBest)} 級 · ${store.save.bossBest.rounds} 輪</span></div><div id="endless-rank-content" class="empty-state" role="status">正在讀取江湖榜…</div><div class="settings-links">${primary('publish-rank',store.user?'公開我的最佳成績':'登入後可公開成績')}${secondary('boss','返回無盡挑戰')}</div><button class="text-link" data-action="endless-ranking">重新讀取排行榜</button>${store.user?'<button class="text-link" data-action="unpublish-rank">取消公開我的成績</button>':''}<p class="small rank-privacy">不會自動上榜。公布前可確認暱稱，也能隨時取消。</p>`,'leaderboard endless-ranking'));
 const gen=generation,current=store;try{const rows=await current.readEndlessRanking();if(gen!==generation||store!==current)return;$('#endless-rank-content').classList.remove('empty-state');$('#endless-rank-content').innerHTML=rows.length?`<table><thead><tr><th>名次</th><th>少俠</th><th>分數</th><th>評級</th></tr></thead><tbody>${rows.map((row,i)=>`<tr class="${row.id===current.user?.uid?'my-rank':''}"><td>${i+1}</td><td>${esc(cleanName(row.displayName)||'少俠')}</td><td>${Math.max(0,Math.round(Number(row.score)||0))}</td><td>${esc(row.grade)}</td></tr>`).join('')}</tbody></table>`:'<div class="empty-state">這條路線還沒有公開紀錄。<br>可以先挑戰自己的最佳。</div>';}catch{$('#endless-rank-content')&&( $('#endless-rank-content').textContent='排行榜暫時無法連線，稍後再試。');}
}
function publishEndless(){
 if(!store.user){renderAccount();return;}if(!store.save.bossBest.score){toast('先完成一回無盡挑戰吧。');return;}
 const current=store;showModal('確認公開這筆成績',`<p>遊戲暱稱：${esc(current.save.displayName||'少俠')}<br>最佳分數：${current.save.bossBest.score}<br>評級：${endlessGrade(current.save.bossBest)}</p><p class="small">這些資料會出現在 ${routeLabel(current.route)}無盡排行榜，可隨時取消公開。</p>`,[{label:'暫不公開'},{label:'公開成績',primary:true,fn:async()=>{try{await current.publishRanking();if(store===current){renderEndlessRanking();toast('已公開自己的最佳成績。');}}catch(error){toast(error.message||'上榜暫時失敗，請重試。');}}}]);
}
const CHALLENGES=[['紮馬步','看符文、集氣出劍','forest'],['梯雲縱','上排踏雲與回防','frozen_peak'],['掃堂腿','下排格擋與反震','cave'],['劍氣縱橫','完整字串，連成一招','ruins'],['決戰魔教','輸入與防禦，攻守切換','volcano']];
function routeText(text){return typingMode==='zh-bpmf'?text.replace(/\b[A-Z]\b/g,key=>BPMF_BY_KEY[key.toLowerCase()]??key):text;}
function modePicker(){return '';}
function switchRoute(_value){toast('此版本只提供英文鍵盤練習。');}
function renderPvp(initial={}){
 setView('pvp','<div id="pk-root"></div>',{scene:'TRIAL_0'});
 pvp=new PvpClient($('#pk-root'),{initial,profile:()=>({route:typingMode,name:store.save.displayName||'少俠',outfit:store.save.equippedOutfitId,effect:store.save.equippedEffectId,style:store.save.attackStyle,relic:store.save.equippedTreasureId,user:store.user,reduced:reduced()}),sound,toast,onExit:renderChallenges,history:()=>store.pkHistory(),confirm:(title,body)=>new Promise(resolve=>{showModal(title,`<p>${esc(body)}</p>`,[{label:'繼續留在擂台',primary:true,fn:()=>resolve(false)},{label:'確認',fn:()=>resolve(true)}]);pendingModalClose=()=>resolve(false);})});
}
function renderTrials(){
 const modes=[
  {id:'rift',name:'異獸秘境',format:'五戰遠征',note:'擊敗五隻異獸，每勝一戰可回氣或蓄力。',reward:'擊倒異獸賺靈石，到鑄靈強化裝備',unlock:store.save.completedNodeIds.includes(RIFT_UNLOCK_NODE)?'可探索':'完成劇情第二章開放',icon:'talisman',art:trialArtFor(3).card},
  {id:'boss',name:'無盡挑戰',format:'生存拚分',note:'連戰無固定關數，守住氣血，挑戰個人最佳。',reward:'依分數與正確率評級，另有專屬排行榜',unlock:bossUnlocked(store.save)?'可挑戰':'完成劇情最終節開放',icon:'boss',art:trialArtFor(4).card}
 ];
 setView('trials',frame(`<section class="trial-gate"><p class="chapter">${routeLabel(typingMode)} / 江湖試煉</p><h1 class="section-title">試煉</h1><div class="trial-gate-grid">${modes.map(m=>`<button data-action="${m.id}" class="trial-gate-card" style="--gate-scene:url('${new URL(m.art,document.baseURI).href}')"><span class="gate-format">${gameIcon(m.icon)}${m.format}</span><b>${m.name}</b><span class="gate-note">${m.note}</span><span class="gate-reward">${m.reward}</span><span class="gate-unlock">${m.unlock} <span aria-hidden="true">→</span></span></button>`).join('')}</div></section>`,'trial-gate-view'),{scene:'BG_YARD'});
}
function renderChallenges(){renderChallengeBrief(selectedChallenge);}
function renderChallengeBrief(index=0){
 const i=Math.min(4,Math.max(0,Number(index)||0));selectedChallenge=i;const stage=CHALLENGE_STAGES[i],first=CHALLENGE_ENEMIES[stage.enemies[0]],best=store.save.challengeBest[`${typingMode}:${i+1}`];
 setView('briefing',frame(`<div class="challenge-brief-copy"><nav class="challenge-choices" aria-label="選擇挑戰關卡">${CHALLENGE_STAGES.map((s,k)=>`<button data-action="challenge-brief" data-index="${k}" aria-pressed="${k===i}"><span>第 ${k+1} 關</span><b>${esc(s.name)}</b></button>`).join('')}</nav><div class="chapter trial-chapter">${trialMarkHTML(i)}第 ${i+1} 關 / ${esc(stage.chapter)}</div><h1>${esc(stage.name)}</h1><p class="challenge-story">${esc(stage.story)}</p><div class="challenge-objective"><span>這一回的任務</span><p>${esc(routeText(stage.goal))}</p><div class="challenge-key-row">${esc(typingMode==='zh-bpmf'?'依畫面注音符號按鍵，不用選字或送出國字。':stage.keys)}</div></div><p class="small">${esc(routeText(stage.tip))}<br>每關限時三分鐘，正確率低於 ${CHALLENGE_MIN_ACCURACY}% 會挑戰失敗。</p>${`<p class="small challenge-first-reward">${gameIcon('gem')}達標可拿星星，並獲得 ${CHALLENGE_REWARD_STONES} 靈石。</p>`}${store.rewardQueue?.some(run=>run.kind==='challenge')?secondary('retry-challenge-rewards','補領挑戰獎勵'):''}<div class="brief-actions">${primary('begin-challenge','準備好了，開始 →',`data-index="${i}"`)}${secondary('enemy-guide','敵人圖鑑',`data-index="${i}"`)}</div><details class="trial-records"><summary>切磋與紀錄</summary><div class="pk-actions">${secondary('pvp','教室 PK')}${secondary('leaderboard','五關排行榜')}</div></details></div><div class="brief-opponent"><div class="enemy-preview" id="brief-enemy"></div><p>${esc(first.move)}</p><div class="brief-record">${best?`個人最佳 ${best.score} 分 ${starsHTML(best.stars)}`:'每個對手，都有自己的出招節奏。'}</div></div>`,'challenge-brief'),{scene:trialArtFor(i).scene});
 sceneSprites.push(new EnemyDirector($('#brief-enemy'),first.id,{reduced:reduced(),preview:true}));
}
function renderEnemyGuide(index=guideStage,id){
 guideStage=Math.min(4,Math.max(0,Number(index)||0));const stage=CHALLENGE_STAGES[guideStage];guideEnemy=stage.enemies.includes(id)?id:stage.enemies[0];const enemy=CHALLENGE_ENEMIES[guideEnemy];
 const personality={serpent:'盤身觀察，蓄力後快速探身。',beast:'壓低重心，再向前撲擊。',spirit:'隨呼吸浮動，凝聚力量後施法。',wing:'振翅懸停，凝視之後發出光波。',fighter:'穩住腳步，抬手蓄勢後揮斬。',mage:'衣袖隨呼吸擺動，先結印再放出咒文。',heavy:'步伐較沉，重踏之前會明顯蓄力。',tree:'枝幹緩緩搖動，再以根與枝葉出招。',dragon:'身軀隨吐息起伏，蓄勢後噴出寒霜。',flame:'焰身持續流動，凝聚後向外釋放熱浪。',lord:'沉穩浮動，凝聚劍氣後才進招。'};
 setView('enemy-guide',frame(`<div class="guide-head"><div><div class="chapter">守關敵人圖鑑 / 共 ${CHALLENGE_ENEMY_IDS.length} 種</div><h1 class="section-title">先看清對手，再出招。</h1></div><button class="quiet" data-action="challenge-brief" data-index="${guideStage}">返回委託</button></div><label class="catalog-select stage-select">關卡<select id="guide-stage">${CHALLENGE_STAGES.map((s,i)=>`<option value="${i}" ${i===guideStage?'selected':''}>${esc(s.name)}</option>`).join('')}</select></label><div class="enemy-guide-layout"><div class="enemy-roster" aria-label="選擇敵人">${stage.enemies.map(key=>{const p=CHALLENGE_ENEMIES[key];return `<button class="${key===guideEnemy?'selected':''}" data-action="select-enemy" data-id="${key}" aria-pressed="${key===guideEnemy}"><img src="${p.src}" alt="" loading="lazy"><span>${esc(p.name)}</span></button>`;}).join('')}</div><article class="enemy-dossier" tabindex="-1"><div class="enemy-preview" id="guide-enemy"></div><h2>${esc(enemy.name)}</h2><div class="enemy-move-title">${esc(enemy.move)}</div><p>${esc(personality[enemy.body])}</p><div class="enemy-demo-actions">${secondary('enemy-demo','待機',`data-motion="idle"`)}${primary('enemy-demo','看看出招',`data-motion="attack"`)}${secondary('enemy-demo','受擊',`data-motion="hurt"`)}${secondary('enemy-demo','退場',`data-motion="defeat"`)}</div><p class="small">看看對手的動作，準備好再出發。</p></article></div>`,'enemy-guide'),{scene:'forest'});
 guideDirector=new EnemyDirector($('#guide-enemy'),enemy.id,{reduced:reduced(),preview:true});sceneSprites.push(guideDirector);
}
function showChallengeHelp(){
 const stage=CHALLENGE_STAGES[legacyIndex]??CHALLENGE_STAGES[4];showModal('這一回怎麼出招？',`<p>${esc(routeText(stage.goal))}</p><p class="small">${esc(routeText(stage.tip))}</p>`,[{label:'繼續挑戰',primary:true,fn:()=>legacyFrame?.contentWindow?.postMessage({type:'wuxia:resume'},location.origin)}]);
}
let riftArea='ruins';
function renderRift(area=riftArea,difficulty='normal'){
 riftArea=Object.hasOwn(RIFT_ROUTES,area)?area:'ruins';
 setView('rift',frame(riftHub(store.save,riftArea,difficulty),'rift-view'),{scene:RIFT_ROUTES[riftArea].scene});
}
function previewRiftEnemy(button){
 const enemy=RIFT_ROUTES[riftArea].enemies.find(e=>e.id===button.dataset.id);
 if(!enemy)return;
 showModal(enemy.name,riftPreviewHTML(enemy),[{label:'回到秘境'}]);
 const panel=modal.querySelector('.rift-preview');
 const preview=mountRiftPreview(panel,enemy,reduced(),sound);
 function releasePreview(){
  if(modal.open&&panel.isConnected)return;
  modal.removeEventListener('close',releasePreview);
  preview.destroy();
 }
 modal.addEventListener('close',releasePreview);
}
function startRiftBattle(){
 const hard=$('#rift-difficulty')?.value==='hard';
 if(!store.save.completedNodeIds.includes(RIFT_UNLOCK_NODE)||(hard||riftArea==='moon')&&store.save.collection.forge.best!==5)return;
 setView('rift-battle','<div id="rift-root" tabindex="-1"></div>',{scene:RIFT_ROUTES[riftArea].scene});
 riftArena=new RiftArena($('#rift-root'),{store,route:typingMode,hard,area:riftArea,sound,reduced:reduced(),exit:renderRift});
 $('#rift-root').focus({preventScroll:true});sound.bgm('battle');
}
let forgeBusy=false;
async function forgeItem(button){
 if(forgeBusy||button.disabled)return;
 const current=store;forgeBusy=true;button.disabled=true;
 try{const r=await current.forge(button.dataset.kind,button.dataset.id);
  if(current===store&&view==='wardrobe'&&wardrobeTab==='forge'){renderWardrobe();sound.play('equip',.4);toast(r.price?'已完成，使用 '+r.price+' 靈石。':'已更新護符。');}
 }catch(error){if(current===store){button.disabled=false;toast(error.message);}}
 finally{forgeBusy=false;}
}
function renderBoss(){const open=bossUnlocked(store.save),best=store.save.bossBest;setView('boss',frame(`<div><div class="chapter">試煉 / 生存拚分</div><h1>無盡挑戰</h1><p>${open?'連戰無固定關數。看準出招、守住氣血，挑戰自己的最佳。':'完成劇情最終節後，無盡挑戰就會開放。先跟著師傅，一步一步認識鍵盤。'}</p>${open?`<div class="endless-reward-preview"><span>個人最佳 <b>${best.score} 分</b></span><span>${endlessGrade(best)} 級 · ${best.rounds} 輪</span><span class="stone-wallet">${gemIcon}<b>${store.save.collection.stones}</b> 靈石</span></div><p class="small">每回 10 次有效按鍵起可領靈石；分數與正確率越高，評級與獎勵越高。</p>${primary('start-boss','進入無盡挑戰 · Enter →')}`:primary('journey','開啟任務選單 →')}${store.rewardQueue?.some(run=>run.kind!=='challenge')?secondary('retry-rewards','補領已完成試煉獎勵'):''}<div class="boss-links">${secondary('trials','返回試煉')}${secondary('endless-ranking','無盡排行榜')}${secondary('collection-tab','靈石祈願','data-id="draw"')}</div><details class="reward-rules"><summary>評級與靈石怎麼算？</summary><p>S：6000 分、95% 正確率；A：3000 分、90%；B：1200 分、80%；C：300 分、60%。其他為 D。<br>靈石＝20＋每 100 分 1 顆＋評級加成（S 100／A 65／B 35／C 15），每回最多 300 顆；少於 10 次有效按鍵不發放。</p></details></div>${open?'<img class="boss-art" src="assets/monsters/nether_lord_boss.gif" alt="無盡挑戰對手">':'<div class="locked-emblem" aria-hidden="true">封</div>'}`,'boss-panel'),{scene:'volcano'});}
function startLegacy(kind,index=0){
  // legacy.html not shipped in this fork — avoid infinite wait iframe
  toast(kind==='boss'?'無盡試煉尚未移植到此版本。':'五關挑戰尚未移植到此版本。先玩劇情即可。');
  if(kind==='boss')renderBoss(); else renderChallenges();
}
let syncButtonTimer=null;
function updateSyncButton(){
 clearTimeout(syncButtonTimer);
 const button=$('[data-action=sync]');if(!button)return;
 const seconds=Math.max(0,Math.ceil(((store.retryAfter??0)-Date.now())/1000));
 const busy=store.uploading||store.status==='loading';
 button.disabled=busy||seconds>0;
 button.setAttribute('aria-busy',String(store.uploading));
 button.textContent=store.uploading?'正在保存…':store.status==='loading'?'正在讀取…':seconds?`重新保存（${seconds} 秒）`:'重新保存';
 if(busy||seconds)syncButtonTimer=setTimeout(updateSyncButton,250);
}
function renderAccount(){
 setView('account',frame(`<div class="chapter">本機存檔</div><h1 class="section-title">進度已自動保存</h1><p>章節、服裝與最佳成績都保存在這台瀏覽器。<br>可匯出 JSON 備份，換電腦時再匯入。</p><div class="storage-status" id="account-status">${gameIcon('local')}<span>訪客紀錄只留在這台瀏覽器</span></div><div class="account-actions">${secondary('export-save','匯出紀錄')}${secondary('import-save','匯入紀錄')}${secondary('home','繼續旅程')}</div><p class="notice">此版本無需 Google 登入。<br>教學改寫：${GAME_NAME}（英文鍵盤）</p><input type="file" id="import-file" accept="application/json,.json" hidden>`,'account'));
 $('#import-file').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;if(file.size>65536){toast('紀錄檔太大，請選擇遊戲匯出的檔案。');return;}try{const value=JSON.parse(await file.text());if(value.route&&routeKey(value.route)!=='en')throw Error('只支援英文路線紀錄。');const imported=normalizeSave(value.save);showModal('帶入自己的旅程',`<p>這份紀錄完成了 ${imported.completedNodeIds.length} 個小節。確定是你的紀錄，再帶入目前旅程。</p>`,[{label:'取消'},{label:'帶入紀錄',primary:true,fn:()=>{store.importFile(value);renderAccount();toast('紀錄已帶入。');}}]);}catch(error){toast(error.message||'這份紀錄無法讀取。');}});
}
function offerImport(){
 const current=store,candidate=current.importCandidate;
 if(!candidate)return;
 const extra=unlockDifferences(candidate,current.save);
 const additions=[extra.nodeIds.length&&extra.nodeIds.length+' 個劇情小節',extra.outfitIds.length&&extra.outfitIds.length+' 套服裝'].filter(Boolean).join('和');
 if(!additions){current.importCandidate=null;return;}
 const dismiss=()=>{current.importCandidate=null;};
 showModal('帶入本機旅程嗎？',`<p>這台瀏覽器的訪客紀錄多解鎖了 ${additions}。<br>如果是你自己的旅程，可以合併到帳號。</p>`,[
  {label:'使用線上紀錄',primary:true,fn:dismiss},
  {label:'合併本機紀錄',fn:()=>{current.importGuest();if(store===current)renderHome();}}
 ]);
 pendingModalClose=dismiss;
}
function renderSettings(){
 setView('settings',frame(`<div class="chapter">照自己的節奏練習</div><h1>設定與紀錄</h1>${[['autoAdvance','過關自動前進','結算後倒數六秒，接續下一個任務'],['muted','靜音','關閉音效與背景音樂'],['reducedMotion','減少動態','保留姿勢與文字，減少位移與閃光'],['highContrast','提高對比','讓文字與目標更清楚']].map(([id,title,desc])=>`<div class="setting-row"><div><span class="setting-title" id="setting-${id}">${gameIcon(id==='muted'?'sound':id==='autoAdvance'?'next':id==='reducedMotion'?'shield':'settings')}${title}</span><small>${desc}</small></div><button class="toggle" data-action="toggle-setting" data-id="${id}" aria-pressed="${store.save.settings[id]}" aria-labelledby="setting-${id}"><i class="toggle-thumb" aria-hidden="true"></i><span>${store.save.settings[id]?'開啟':'關閉'}</span></button></div>`).join('')}<div class="settings-links">${secondary('endless-ranking','無盡排行榜')}${secondary('account','帳號與保存')}${secondary('leaderboard','排行榜')}${secondary('home','返回山門')}</div><button class="text-link" data-action="privacy" style="align-self:flex-start;margin-top:20px">保存與隱私</button><p class="small" style="font-size:10px;margin-top:25px">鍵心之旅 ${VERSION}</p>`,'settings-panel'));
}
let rankStage=1;
function normalizeRows(payload){
 const source=payload?.top3ByStage??payload?.leaderboard??payload?.stages??payload;
 if(Array.isArray(source)){return source.filter(r=>Number(r.stageId??r.stage??rankStage)===rankStage);}
 const group=source?.[String(rankStage)]??source?.[`stage${rankStage}`];if(Array.isArray(group))return group;
 if(Array.isArray(group?.entries))return group.entries;if(Array.isArray(group?.top3))return group.top3;
 if(Array.isArray(payload?.rows))return payload.rows.filter(r=>Number(r.stageId??r.stage)===rankStage);
 return [];
}
async function renderLeaderboard(stage=rankStage){
 rankStage=stage;setView('leaderboard',frame(`<div class="chapter">沿用原五關排行榜</div><h1 class="section-title">${routeLabel(typingMode)}江湖榜</h1><button class="text-link" data-action="endless-ranking">查看無盡排行榜 →</button><div class="mode-picker">${CHALLENGES.map(([name],i)=>`<button class="${rankStage===i+1?'active':''}" data-action="rank-stage" data-index="${i+1}">${name}</button>`).join('')}</div><div id="rank-content" class="empty-state" role="status">正在讀取排行榜…</div><div class="settings-links">${secondary('refresh-rank','重新讀取')}${secondary('challenges','返回挑戰')}</div>`,'leaderboard'));
 const gen=generation;leaderboardAbort=new AbortController();const timer=setTimeout(()=>leaderboardAbort?.abort(),10000);
 try{
  const url=new URL(store.config.legacyLeaderboardUrl);url.searchParams.set('action','leaderboard');url.searchParams.set('typingMode',typingMode);
  const r=await fetch(url,{signal:leaderboardAbort.signal});if(!r.ok)throw Error('http');const payload=await r.json();if(gen!==generation)return;
  const rows=normalizeRows(payload).filter(row=>{const mode=String(row.typingMode??row.typing_mode??row.mode??row.inputMode??'en');return mode===typingMode;}).slice(0,20);
  $('#rank-content').classList.remove('empty-state');$('#rank-content').innerHTML=rows.length?`<table><thead><tr><th>名次</th><th>少俠</th><th>分數</th></tr></thead><tbody>${rows.map((row,i)=>`<tr><td>${i+1}</td><td>${esc(cleanName(row.playerName??row.name??row.nickname)||'少俠')}</td><td>${Math.max(0,Math.round(Number(row.score??row.finalScore)||0))}</td></tr>`).join('')}</tbody></table>`:'<div class="empty-state">這一關暫時沒有可顯示的紀錄。<br>旅程可以照常繼續。</div>';
 }catch(error){if(gen===generation)$('#rank-content').textContent='排行榜暫時無法讀取。可以稍後重試，遊戲與保存不受影響。';}
 finally{clearTimeout(timer);}
}
function showModal(title,html,actions){
 if(modal.open){pendingModalClose=null;modal.close();}
 modal.innerHTML=`<div class="modal-heading">${gameIcon(modalTitleIcon(title))}<h2 id="modal-title">${esc(title)}</h2><button class="modal-close quiet" type="button" data-modal-close aria-label="關閉視窗" title="關閉（Esc）">${gameIcon('close')}</button></div>${html}<div class="modal-actions">${actions.map((a,i)=>`<button class="${a.primary?'primary':'secondary'}" data-modal-index="${i}">${gameIcon(modalActionIcon(a.label,a.primary))}${esc(a.label)}</button>`).join('')}</div>`;
 modal.querySelector('[data-modal-close]').addEventListener('click',()=>{if(modal.dispatchEvent(new Event('cancel',{cancelable:true})))modal.close();});
 decorateActions(modal);
 modal.querySelectorAll('[data-modal-index]').forEach(b=>b.addEventListener('click',()=>{const action=actions[Number(b.dataset.modalIndex)];pendingModalClose=null;modal.close();action.fn?.();}));
 modal.showModal();
}
function pauseBattle(){
 if(view!=='battle'||paused||session?.done)return;paused=true;fx?.pause();sound.pause();pendingModalClose=resumeBattle;
 showModal('先歇一歇',`<p>目標會等你，準備好再出招。</p>`,[{label:'返回山門',fn:()=>{store.writeLocal();store.flush();paused=false;renderHome();}},{label:'重新挑戰',fn:()=>restartLesson()},{label:'重看示範',fn:showDemo},{label:'繼續練習',primary:true,fn:resumeBattle}]);pendingModalClose=resumeBattle;
}
modal.addEventListener('cancel',()=>{if(view==='legacy')legacyFrame?.contentWindow?.postMessage({type:'wuxia:resume'},location.origin);if(paused){setTimeout(resumeBattle,0);} });
modal.addEventListener('close',()=>{if(pendingModalClose){const fn=pendingModalClose;pendingModalClose=null;fn();}});
function leaveLesson(){showModal('先回山門嗎？','<p>這個小節尚未完成，回來時會從本節開頭練習。<br>已完成的旅程都會保留。</p>',[{label:'繼續練習',primary:true,fn:()=>{if(view==='battle')resumeBattle();}},{label:'返回山門',fn:()=>{paused=false;renderHome();}}]);}
function safeRouteHome(){if(view==='battle'){pauseBattle();return;}if(view==='dialogue'){leaveLesson();return;}if(view==='legacy'){leaveLegacy();return;}renderHome();}
function leaveLegacy(){legacyFrame?.contentWindow?.postMessage({type:'wuxia:pause'},location.origin);showModal('先回山門嗎？','<p>本次挑戰還沒結算，已完成的個人紀錄仍會保留。</p>',[{label:'繼續挑戰',primary:true,fn:()=>legacyFrame?.contentWindow?.postMessage({type:'wuxia:resume'},location.origin)},{label:'返回山門',fn:renderHome}]);}
const actions={
 trials:renderTrials,rift:()=>renderRift(),'rift-preview':previewRiftEnemy,'start-rift':startRiftBattle,'rift-forge':()=>{wardrobeTab='forge';renderWardrobe();},'forge-item':forgeItem,pvp:()=>renderPvp(),fullscreen:toggleFullscreen,home:safeRouteHome,continue:()=>{const next=nextNode(store.save);next?startLesson(next.id):renderBoss();},journey:()=>renderJourney(),chapter:b=>{renderJourney(b.dataset.id);$(`[data-action=chapter][data-id="${chapterId}"]`)?.focus({preventScroll:true});},'select-mission':b=>{renderJourney(chapterId,b.dataset.id);if(matchMedia('(max-width:700px)').matches){$('.mission-detail').focus({preventScroll:true});$('.mission-detail').scrollIntoView({behavior:reduced()?'instant':'smooth',block:'start'});}},'mission-results':b=>renderJourney(NODE_BY_ID[b.dataset.id].chapterId,b.dataset.id),'star-guide':()=>showModal('每個任務，都能收集三顆星','<p>★ 完成任務。<br>★★ 完成任務，正確率達 80%。<br>★★★ 正確率達 95%，且未使用額外鍵位提示。</p><p class="small">師傅開場示範不影響星星。沒有速度要求，一星就能開放下一關；重玩只保留最佳星級，不重複累加。</p>',[{label:'知道了',primary:true}]),lesson:b=>startLesson(b.dataset.id),'restart-lesson':b=>restartLesson(b.dataset.id),'next-lesson':b=>startLesson(b.dataset.id),'stop-auto':stopAutoAdvance,'outfit-filter':b=>{outfitFilter=b.dataset.id;renderWardrobe(filteredOutfits().some(o=>o.id===selectedOutfit)?selectedOutfit:filteredOutfits()[0].id);},'preview-outfit':b=>{const sprite=sceneSprites[0];if(!sprite)return;sprite.finisher=false;sprite.act(b.dataset.motion,800);if(['run','jump'].includes(b.dataset.motion))sprite.previewFx.clear();else sprite.previewFx.preview(sprite,b.dataset.motion,store.save.attackStyle);if(['attack','cast','seal'].includes(b.dataset.motion))launchProjectile($('.outfit-cast-stage'),$('#outfit-motion'),null,b.dataset.motion==='cast'?'spell':b.dataset.motion==='seal'?'talisman':store.save.attackStyle,reduced());sound.play(['run','jump'].includes(b.dataset.motion)?'click':b.dataset.motion==='defense'?'guard':b.dataset.motion==='attack'&&store.save.attackStyle==='sword'?'attack':'magic',.45);},'wear-and-next':b=>{if(!availableOutfits(store.save).some(o=>o.id===b.dataset.id))return;store.update({...markOutfitSeen(store.save,b.dataset.id),equippedOutfitId:b.dataset.id},{outfitDirty:true});sound.play('equip',.5);b.dataset.next?startLesson(b.dataset.next):renderWardrobe(b.dataset.id);},
 guest:()=>{if(store.guestAvailable?.completedNodeIds.length)showModal('接續訪客旅程嗎？','<p>這台裝置已有訪客進度。共用電腦時，確認是自己的紀錄再接續。</p>',[{label:'重新開始',fn:()=>{store.update(blankSave('少俠'));renderHome();}},{label:'接續旅程',primary:true,fn:()=>{store.save=store.guestAvailable;renderHome();}}]);else{store.update(blankSave('少俠'));renderHome();}},
 'resume-guest':()=>{store.save=store.guestAvailable??blankSave('少俠');renderHome();},
 'retry-challenge-rewards':async b=>{const current=store;b.disabled=true;try{for(const run of current.rewardQueue.filter(run=>run.kind==='challenge'))await current.claimReward(run);if(current===store&&view==='briefing'){renderChallengeBrief(selectedChallenge);toast('挑戰獎勵已保存。');}}catch(error){b.disabled=false;toast(error.message);}},
 'retry-rewards':async()=>{const current=store;try{for(const run of current.rewardQueue.filter(run=>run.kind!=='challenge'))await current.claimReward(run);if(current===store){renderBoss();toast('靈石獎勵已保存。');}}catch(error){toast(error.message);}},'collection-tab':b=>{wardrobeTab=b.dataset.id;renderWardrobe();},'equip-treasure':b=>{if(!availableTreasures(store.save).some(t=>t.id===b.dataset.id))return;store.update({...store.save,equippedTreasureId:b.dataset.id},{loadoutDirty:true});sound.play('equip',.45);renderWardrobe();toast(b.dataset.id==='none'?'靈寶已收起。':'已攜帶'+treasureFor(b.dataset.id).name+'，可與服裝特效疊加。');},'equip-effect':b=>equipLoadout('effect',b.dataset.id),'equip-attack':b=>equipLoadout('attack',b.dataset.id),'draw-item':drawCollection,'endless-ranking':renderEndlessRanking,'publish-rank':publishEndless,'unpublish-rank':async()=>{try{await store.unpublishRanking();toast('已取消公開');renderEndlessRanking();}catch{toast('取消公開暫時失敗，請重試。');}},'dialogue-choice':b=>{if(!dialogue)return;if(b.dataset.id==='ask'){dialogue.lines[dialogue.index]={speaker:'MASTER',expression:'encouraging',text:approachFor(node).hint+' 這次的任務是「'+missionFor(node).title+'」。'+(typingMode==='zh-bpmf'?'照亮起的注音鍵依序按，不用選字。':'看準亮起的鍵位再按；F、J 的小凸點能幫你找到雙手的位置。')+'不必搶快，目標會等你。'};showDialogueLine();}else{const done=dialogue.onDone;dialogue=null;done({demo:false});}},'next-line':()=>nextLine(),'skip-lines':()=>nextLine(true),'leave-lesson':leaveLesson,pause:pauseBattle,demo:showDemo,
 'help-key':()=>{session.assisted=true;$('#keyboard-hint').hidden=false;$('#story-message').textContent='看看亮起的鍵，按對了就能出招。';},
 wardrobe:()=>renderWardrobe(),outfit:b=>{if(wardrobeTab==='limited-draw')outfitFilter='limited';renderWardrobe(b.dataset.id);},equip:b=>{if(!availableOutfits(store.save).some(o=>o.id===b.dataset.id))return;store.update({...markOutfitSeen(store.save,b.dataset.id),equippedOutfitId:b.dataset.id},{outfitDirty:true});renderWardrobe(b.dataset.id);sound.play('equip',.5);},
 'wear-reward':b=>{if(!availableOutfits(store.save).some(o=>o.id===b.dataset.id))return;store.update({...markOutfitSeen(store.save,b.dataset.id),equippedOutfitId:b.dataset.id},{outfitDirty:true});renderWardrobe(b.dataset.id);toast('新衣穿好了，下一段旅程在等你。');},
 'first-challenge':()=>renderChallengeBrief(0),challenges:renderChallenges,'typing-mode':b=>switchRoute(b.dataset.id),'start-challenge':b=>renderChallengeBrief(Number(b.dataset.index)),'challenge-brief':b=>{renderChallengeBrief(Number(b.dataset.index));$(`[data-action=challenge-brief][data-index="${selectedChallenge}"]`)?.focus({preventScroll:true});},'begin-challenge':b=>startLegacy('challenge',Number(b.dataset.index)),'enemy-guide':b=>renderEnemyGuide(Number(b.dataset.index)),'select-enemy':b=>{renderEnemyGuide(guideStage,b.dataset.id);if(matchMedia('(max-width:700px)').matches)$('.enemy-dossier').scrollIntoView({behavior:reduced()?'instant':'smooth',block:'start'});},'enemy-demo':b=>{if(b.dataset.motion==='attack')guideDirector.attack('preview');else if(b.dataset.motion==='hurt')guideDirector.hurt();else if(b.dataset.motion==='defeat')guideDirector.markDefeated(guideEnemy);else guideDirector.rest();},boss:renderBoss,'start-boss':()=>startLegacy('boss'),
 'leave-legacy':leaveLegacy,'retry-legacy':()=>startLegacy(legacyKind,legacyIndex),
 account:renderAccount,login:async b=>{
  const current=store,original=b.innerHTML,guest=screen.querySelectorAll('[data-action=submit-name],[data-action=resume-guest]');
  b.disabled=true;b.setAttribute('aria-busy','true');guest.forEach(button=>button.disabled=true);b.textContent='正在處理登入…';
  try{await current.login();if(current===store&&b.isConnected)renderHome();}
  catch(error){if(current===store&&b.isConnected)toast(error.code==='auth/popup-closed-by-user'?'登入視窗已關閉，可以先以訪客開始。':'登入暫時未成功，請再試一次。');}
  finally{if(b.isConnected){b.removeAttribute('aria-busy');b.innerHTML=original;b.disabled=!current.cloud;guest.forEach(button=>button.disabled=false);}}
 },
 sync:async()=>{const current=store;const attempted=await current.retrySave();if(!attempted||current!==store)return;toast(current.status==='saved'?'目前進度已保存。':'保存尚未完成，冷卻後可重試，或匯出紀錄備份。');},logout:()=>{const run=async()=>{await store.logout();shortcutIndex=0;renderEntry();};if(store.pending||store.rewardQueue?.length)showModal('還有進度或靈石尚未保存','<p>可以返回重試保存，或確認放棄尚未同步的部分後登出。</p>',[{label:'返回保存',primary:true,fn:()=>{if(store.rewardQueue?.some(run=>run.kind==='challenge'))renderChallenges();else if(store.rewardQueue?.length)renderBoss();else store.flush();}},{label:'仍要登出',fn:run}]);else run();},
 'export-save':()=>{const url=URL.createObjectURL(new Blob([store.export()],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=GAME_NAME+'-英文紀錄.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);},
 'import-save':()=>$('#import-file').click(),'import-legacy':()=>{showModal('帶入舊版個人最佳','<p>舊紀錄沒有帳號身分。確認這是自己的紀錄，再帶入五關與魔王最佳。<br>新劇情仍從第一節開始。</p>',[{label:'取消'},{label:'帶入我的舊紀錄',primary:true,fn:()=>{store.update(mergeSaves(store.save,store.legacyCandidate));store.legacyCandidate=null;renderAccount();}}]);},
 settings:renderSettings,'toggle-setting':b=>{store.update({...store.save,settings:{...store.save.settings,[b.dataset.id]:!store.save.settings[b.dataset.id]}},{settingsDirty:true});renderSettings();},
 leaderboard:()=>renderLeaderboard(),'rank-stage':b=>renderLeaderboard(Number(b.dataset.index)),'refresh-rank':()=>renderLeaderboard(),
 privacy:()=>showModal('你的旅程，自己的紀錄',`<p>進度保存在這台瀏覽器的本機空間。遊戲只記錄練習結果、章節、服裝和設定，不記錄其他網頁的鍵盤輸入。</p><p>此版本<strong>不使用 Google 登入</strong>，也不連線雲端帳號。</p><p class="small">${GAME_NAME} 為教學改寫版（英文鍵盤）。</p>`,[{label:'知道了',primary:true}])
};
function syncRouteArchives(){/* en-only */}
$('#route-switch').innerHTML='';document.querySelector('.world-header [data-action=settings]').innerHTML=gameIcon('settings')+'<span>遊戲設定</span>';document.querySelector('.world-header [data-action=settings]').title='設定與紀錄';
async function toggleFullscreen(){
 try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.fullscreenEnabled)await document.documentElement.requestFullscreen();else toast('此瀏覽器未開放全螢幕。');}catch{toast('全螢幕暫時無法開啟，可以使用瀏覽器的全螢幕功能。');}
 updateHeader();if(view==='legacy'){legacyFrame?.contentWindow.postMessage({type:'wuxia:focus'},location.origin);}else if(view==='battle')screen.focus({preventScroll:true});
}
document.addEventListener('fullscreenchange',updateHeader);
function menuKey(event){
 if(['battle','legacy','dialogue','entry','pvp'].includes(view))return false;
 const target=event.target,scope=target===screen||target===document.body;
 if(event.code==='Escape'&&!document.fullscreenElement){if(view==='boss'||view==='rift')renderTrials();else if(view==='endless-ranking')renderBoss();else if(view==='leaderboard')renderChallenges();else if(view==='enemy-guide')renderChallengeBrief(guideStage);else if(view!=='home')renderHome();else return false;return true;}
 const direction=['ArrowLeft','ArrowUp'].includes(event.code)?-1:['ArrowRight','ArrowDown'].includes(event.code)?1:0;
 if(view==='journey'&&(scope||target.closest?.('.mission-map'))){
  if(direction){const ids=CHAPTERS.find(c=>c.id===chapterId).nodeIds,i=ids.indexOf(selectedMission),id=ids[(i+direction+ids.length)%ids.length];renderJourney(chapterId,id);$(`.mission-card[data-id="${id}"]`).focus({preventScroll:true});return true;}
  if(event.code==='Enter'){if(canStartNode(store.save,selectedMission))startLesson(selectedMission);else toast('先完成前一個任務，就能來這裡。');return true;}
 }
 if(direction&&view==='wardrobe'&&wardrobeTab==='treasures'&&(scope||target.closest?.('.treasure-grid'))){const choices=[...screen.querySelectorAll('[data-action=equip-treasure]:not(:disabled)')];let at=choices.indexOf(target.closest?.('[data-action=equip-treasure]'));if(at<0)at=choices.findIndex(b=>b.getAttribute('aria-pressed')==='true');choices[(at+direction+choices.length)%choices.length]?.focus({preventScroll:true});return true;}
 if(direction&&view==='wardrobe'&&wardrobeTab==='outfits'&&(scope||target.closest?.('.outfit-options'))){const choices=filteredOutfits(),at=choices.findIndex(o=>o.id===selectedOutfit),id=choices[(at+direction+choices.length)%choices.length].id;renderWardrobe(id);$(`[data-action=outfit][data-id="${id}"]`).focus({preventScroll:true});return true;}
 if(direction&&view==='enemy-guide'&&(scope||target.closest?.('.enemy-roster'))){const ids=CHALLENGE_STAGES[guideStage].enemies,at=ids.indexOf(guideEnemy),id=ids[(at+direction+ids.length)%ids.length];renderEnemyGuide(guideStage,id);$(`[data-action=select-enemy][data-id="${id}"]`).focus({preventScroll:true});return true;}
 if(scope&&event.code==='Enter'){
  const action=({home:nextNode(store.save)?'continue':'boss',briefing:'begin-challenge',boss:'start-boss',result:lastResult?.node.id===FIRST_CHALLENGE_CHAPTER&&shouldGuideChallenge(store.save)?'first-challenge':lastResult&&nextMissionId(store.save,lastResult.node.id)?'next-lesson':'boss'})[view],button=action&&screen.querySelector(`[data-action="${action}"]`);
  if(button&&!button.disabled){button.click();return true;}
 }
 return false;
}
// Scope B EN fork: challenge/trial need missing legacy.html — hide until ported (see docs/ART_UPGRADE_LATER.md)
 $('#game-dock').innerHTML=[['home','山門'],['journey','劇情'],['wardrobe','服裝']].map(([id,label])=>`<button data-action="${id}">${gameIcon(id)}<span>${label}</span>${id==='wardrobe'?'<i class="new-dot" aria-hidden="true"></i>':''}</button>`).join('');
document.addEventListener('click',event=>{if(bootstrapping)return;if(worldMenu.open&&!worldMenu.contains(event.target))worldMenu.open=false;const button=event.target.closest('[data-action]');if(!button||button.disabled)return;const action=actions[button.dataset.action];if(!action)return;if(worldMenu.contains(button))worldMenu.open=false;sound.unlock();if(button.dataset.action==='submit-name')return;if(view==='rift-battle'&&riftArena?.state.phase!=='result'&&button.dataset.action!=='fullscreen'){showModal('要離開秘境嗎？','先結束本回即可領取已擊敗異獸的靈石。',[{label:'繼續對戰',primary:true},{label:'結束本回',fn:()=>riftArena?.click('quit')}]);return;}if(view==='pvp'&&pvp?.room&&button.dataset.action!=='fullscreen'){pvp.requestLeave(()=>action(button));return;}action(button);});
screen.addEventListener('change',event=>{
 const control=event.target;
 if(!(control instanceof HTMLSelectElement))return;
 let selector;
 if(control.matches('[data-wardrobe-tab]')){
  wardrobeTab=control.value;
  renderWardrobe();
  selector='[data-wardrobe-tab]';
 }else if(control.matches('[data-outfit-series]')){
  outfitFilter=control.value;
  const matches=filteredOutfits();
  renderWardrobe(matches.some(o=>o.id===selectedOutfit)?selectedOutfit:matches[0]?.id);
  selector='[data-outfit-series]';
 }else if(control.id==='guide-stage'){
  renderEnemyGuide(control.value);
  selector='#guide-stage';
 }else if(control.id==='rift-area'){
  renderRift(control.value,$('#rift-difficulty').value);
  selector='#rift-area';
 }
 if(selector)$(selector)?.focus({preventScroll:true});
});
screen.addEventListener('click',e=>{const b=e.target.closest('[data-rift]');if(b&&!b.disabled){sound.unlock();riftArena?.click(b.dataset.rift);}});
function menuUnlockShortcut(event){
 if(!['home','journey','wardrobe','trials','briefing','challenges','boss','rift'].includes(view)||store.status==='loading'||event.shiftKey){
  shortcutIndex=0;
  return false;
 }
 const now=performance.now();
 if(now-shortcutAt>1500)shortcutIndex=0;
 shortcutAt=now;
 shortcutIndex=event.code===shortcutCodes[shortcutIndex]?shortcutIndex+1:Number(event.code===shortcutCodes[0]);
 if(shortcutIndex!==shortcutCodes.length)return false;
 shortcutIndex=0;
 store.unlockAll();
 if(view==='journey')renderJourney(chapterId,selectedMission);
 else if(view==='wardrobe')renderWardrobe();
 else if(view==='challenges'||view==='briefing')renderChallenges();
 else if(view==='boss')renderBoss();
 else if(view==='rift')renderRift();
 toast('劇情與服裝已解鎖，劇情小節全三星。');
 return true;
}
window.addEventListener('keydown',event=>{
 if(bootstrapping)return;
 if(event.code==='Escape'&&worldMenu.open){event.preventDefault();worldMenu.open=false;worldMenu.querySelector('summary').focus();return;}
 if(event.ctrlKey||event.metaKey||event.altKey){shortcutIndex=0;return;}const editing=event.target instanceof HTMLElement&&(event.target.matches('input,textarea,select')||event.target.isContentEditable);if(editing){shortcutIndex=0;return;}
 if(modal.open){
  shortcutIndex=0;
  const demo=modal.querySelector('[data-demo-code]');
  if(demo&&(event.code==='Enter'||event.code==='NumpadEnter'||event.code===demo.dataset.demoCode&&event.shiftKey===(demo.dataset.demoShift==='true'))){
   event.preventDefault();
   if(!event.repeat&&!held.has(event.code)){held.add(event.code);demo.click();}
  }
  return;
 }
 if(view==='battle'&&!paused&&physicalKey(event.code)!==null)event.preventDefault();
 if(event.repeat||held.has(event.code))return;held.add(event.code);
 if(menuUnlockShortcut(event)){event.preventDefault();return;}
 if(event.code==='F10'&&!event.isComposing){event.preventDefault();toggleFullscreen();return;}
 if(view==='rift-battle'){
  if(event.code==='Escape'){event.preventDefault();riftArena?.click('quit');return;}
  if(event.code==='Space'&&event.target instanceof HTMLButtonElement)return;
  if(riftArena?.key(event.code)){event.preventDefault();sound.unlock();}
  return;
 }
 if(menuKey(event)){event.preventDefault();sound.unlock();return;}
 if(view==='dialogue'&&event.target instanceof HTMLButtonElement&&event.target.dataset.action==='dialogue-choice'&&['Enter','Space'].includes(event.code))return;
 if(view==='dialogue'&&(event.code==='Enter'||event.code==='Space')){event.preventDefault();nextLine();return;}
 if(view!=='battle'||paused)return;if(event.code==='Escape'){event.preventDefault();pauseBattle();return;}
 if(event.target instanceof HTMLButtonElement&&(event.code==='Space'||event.code==='Enter'))return;
 if(physicalKey(event.code)!==null){event.preventDefault();sound.unlock();processKey(event);}
});
window.addEventListener('keyup',e=>{if(e.code)held.delete(e.code);else held.clear();});
window.addEventListener('blur',()=>{held.clear();shortcutIndex=0;if(view==='battle'&&!paused)pauseBattle();});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&view==='battle'&&!paused)pauseBattle();});
window.addEventListener('online',()=>Object.values(stores).forEach(s=>s.flush()));window.addEventListener('pagehide',()=>Object.values(stores).forEach(s=>{s.writeLocal();s.flush();}));
async function claimChallengeReward(run, source) {
 const current=store;
 const send=(data)=>{
  if(current===store&&legacyFrame?.contentWindow===source)source.postMessage(data,location.origin);
 };
 try{
  const reward=await current.claimChallengeReward(run);
  send({type:'wuxia:challenge-reward',stones:reward.stones,balance:current.save.collection.stones});
 }catch(error){
  send({type:'wuxia:challenge-reward-error',message:error.message});
 }
}
window.addEventListener('message',event=>{
 if(event.origin!==location.origin||event.source!==legacyFrame?.contentWindow||!event.data||typeof event.data!=='object')return;const data=event.data;
 if(data.type==='wuxia:legacy-ready'){
  clearTimeout(sceneTimer);
  if(legacyKind==='boss'&&!bossUnlocked(store.save)){renderBoss();return;}
  legacyFrame.contentWindow.postMessage({type:'wuxia:start',kind:legacyKind,index:legacyIndex,typingMode,effectId:store.save.equippedEffectId,attackStyle:store.save.attackStyle,relicId:store.save.equippedTreasureId,name:store.save.displayName||'訪客劍客',outfitId:store.save.equippedOutfitId,settings:store.save.settings,legacyUrl:store.config.legacyLeaderboardUrl,submitEnabled:store.config.legacySubmitEnabled===true},location.origin);
 }else if(data.type==='wuxia:battle-ready'){$('#legacy-wait')?.remove();legacyFrame.contentWindow.postMessage({type:'wuxia:focus'},location.origin);}
 else if(data.type==='wuxia:fullscreen')toggleFullscreen();
 else if(data.type==='wuxia:exit'){legacyKind==='boss'?renderBoss():renderChallenges();}
 else if(data.type==='wuxia:retry'){startLegacy(legacyKind,legacyIndex);}
 else if(data.type==='wuxia:next'){const index=Math.min(4,legacyIndex+1);data.auto?startLegacy('challenge',index):renderChallengeBrief(index);}
 else if(data.type==='wuxia:help')showChallengeHelp();
 else if(data.type==='wuxia:collection'){wardrobeTab='draw';renderWardrobe();}
 else if(data.type==='wuxia:endless-ranking')renderEndlessRanking();
 else if(data.type==='wuxia:retry-challenge-reward'&&lastChallengeRun){claimChallengeReward(lastChallengeRun,event.source);}
 else if(data.type==='wuxia:retry-reward'&&lastEndlessRun){store.claimReward(lastEndlessRun).then(reward=>event.source.postMessage({type:'wuxia:reward',...reward,collection:undefined,balance:store.save.collection.stones},location.origin)).catch(error=>toast(error.message));}
 else if(data.type==='wuxia:result'){
  const r=data.result;if(!r||typeof r!=='object'||!(Number(r.attempted)>0)||legacyKind==='challenge'&&!passesChallenge(r))return;const save=structuredClone(store.save);
  if(legacyKind==='boss'){if(Number(r.score)>save.bossBest.score)save.bossBest={score:r.score,rounds:r.rounds||0,accuracy:r.accuracy||0,attempted:r.attempted||0,rulesVersion:'legacy-v2'};}
  else{const key=`${typingMode}:${legacyIndex+1}`,old=save.challengeBest[key];if(!old||r.score>old.score)save.challengeBest[key]={...r,resultId:r.resultId||uid(),rulesVersion:'legacy-v2'};}
  const resultStore=store;store.update(save);if(legacyKind==='boss'){lastEndlessRun=r;resultStore.claimReward(r).then(reward=>{if(legacyFrame?.contentWindow===event.source)event.source.postMessage({type:'wuxia:reward',...reward,collection:undefined,balance:resultStore.save.collection.stones},location.origin);}).catch(error=>{if(legacyFrame?.contentWindow===event.source)event.source.postMessage({type:'wuxia:reward-error',message:error.message},location.origin);});}
  else{lastChallengeRun=r;claimChallengeReward(r,event.source);}
 }
});
Object.values(stores).forEach(current=>current.addEventListener('change',()=>{syncRouteArchives();if(current!==store)return;updateHeader();updateSyncButton();if(view==='entry')updateEntryLogin();if(view==='home'&&!store.initializing)renderHome();if(view==='account'&&$('#account-status'))$('#account-status').innerHTML=gameIcon(store.user?savePresentation(store.status).icon:'local')+'<span>'+esc(store.status==='saved'?'目前進度已保存':store.status==='pending'?'進度正在保存':store.status==='loading'?'正在讀取你的旅程':store.user?'暫時未保存，請稍後重試':'訪客紀錄留在這台瀏覽器')+'</span>';}));
// Deliberately expose only safe read-only integration checks, never auth tokens or Firestore instances.
window.WuxiaJourney={version:VERSION,isBossUnlocked:()=>bossUnlocked(store.save),getView:()=>view};
function routeFromHash(source=location.hash){
 let hash='';try{hash=decodeURIComponent(source.slice(1));}catch{return renderHome();}if(hash.startsWith('/story/')){const id=hash.split('/')[2];if(canStartNode(store.save,id))startLesson(id);else renderJourney();}else if(hash==='/pk'||hash.startsWith('/pk?')){const q=new URLSearchParams(hash.split('?')[1]??'');renderPvp({room:q.get('room'),invite:q.get('invite')});}else if(hash==='/missions'||hash==='/journey')renderJourney();else if(hash==='/trials')renderTrials();else if(hash==='/boss')renderBoss();else if(hash==='/rift')renderRift();else if(hash==='/challenge')renderChallenges();else if(hash==='/enemies')renderEnemyGuide();else if(hash==='/wardrobe')renderWardrobe();else if(hash==='/account')renderAccount();else if(hash==='/settings')renderSettings();else if(hash==='/leaderboard')renderLeaderboard();else if(hash==='/endless-ranking')renderEndlessRanking();else if(hash==='/home')renderHome();
}
window.addEventListener('hashchange',()=>{if(!bootstrapping)routeFromHash();});
async function bootstrap(){
 let config={firebase:null,legacyLeaderboardUrl:'',legacySubmitEnabled:false};
 await initMedia();
 await store.init(config);
 renderEntry();
 routeFromHash();
 bootstrapping=false;
}
bootstrap().catch(error=>{screen.innerHTML=`<section class="loading-state"><h1>還沒準備好。</h1><p>重新整理後，再一起出發。</p><button class="primary" onclick="location.reload()">重新整理</button></section>`;console.error('Game initialization failed',error);});