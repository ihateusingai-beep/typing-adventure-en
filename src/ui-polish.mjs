import {iconHTML} from './icons.mjs';
const ACTION_ICONS={home:'home',continue:'next',journey:'journey',challenges:'back',wardrobe:'wardrobe',boss:'boss',account:'user',settings:'settings',fullscreen:'fullscreen','submit-name':'next',guest:'user','resume-guest':'local',lesson:'challenges','next-lesson':'next','mission-results':'journey','star-guide':'help','leave-lesson':'back','next-line':'next','skip-dialogue':'next','skip-lines':'next',pause:'pause','help-key':'keyboard',demo:'help','wear-and-next':'wardrobe',equip:'check','equip-effect':'check','equip-attack':'check','stop-auto':'pause','endless-ranking':'rank',leaderboard:'rank','refresh-rank':'retry','publish-rank':'upload','unpublish-rank':'close','first-challenge':'challenges','start-challenge':'journey','begin-challenge':'challenges','challenge-brief':'back','enemy-guide':'help','start-boss':'boss','retry-rewards':'gift','leave-legacy':'back','retry-legacy':'retry',sync:'cloud','cloud-retry':'cloud',logout:'exit','export-save':'download','import-save':'upload','import-legacy':'local',privacy:'shield','refresh-endless-rank':'retry'};
export function actionIconFor(action,{motion,id,label=''}={}){
 if(action==='preview-outfit')return ({attack:'challenges',defense:'shield',run:'run',jump:'jump',cast:'spell',seal:'talisman'})[motion]??'';
 if(action==='enemy-demo')return ({idle:'clock',attack:'challenges',hurt:'target',defeat:'exit'})[motion]??'';
 if(action==='collection-tab')return ({outfits:'wardrobe',effects:'spell',attacks:'challenges',draw:'gem'})[id]??'';
 if(action==='dialogue-choice')return id==='ask'?'help':'challenges';
 if(/重新讀取/.test(label))return 'retry';
 if(action==='lesson'&&/再/.test(label))return 'retry';
 return ACTION_ICONS[action]??'';
}
export function actionLabelHTML(action,label,attrs=''){
 const shown=label.replace(/^[←→]\s*/,'').replace(/\s*[←→]\s*$/,'').replace(/\s*· Enter/g,' <kbd class="action-key">Enter</kbd>');
 if(/\bgame-icon\b/.test(label)||action==='login')return shown;
 const motion=/data-motion="([^"]+)"/.exec(attrs)?.[1],id=/data-id="([^"]+)"/.exec(attrs)?.[1];
 return iconHTML(actionIconFor(action,{motion,id,label:label.replace(/<[^>]*>/g,'')}))+shown;
}
function removeArrowText(button){
 const first=button.firstChild,last=button.lastChild;if(first?.nodeType===3)first.textContent=first.textContent.replace(/^[←→]\s*/,'');if(last?.nodeType===3)last.textContent=last.textContent.replace(/\s*[←→]\s*$/,'');
}
export function decorateActions(root){
 for(const button of root.querySelectorAll('button[data-action]')){
  if(button.matches('.google-signin,.brand-button,.outfit-card,.effect-option,.attack-option,.mission-card,.chapter-tabs button,.chapter-choices button,.challenge-choices button,.toggle')||button.querySelector('.game-icon'))continue;
  const id=actionIconFor(button.dataset.action,{...button.dataset,label:button.textContent});
  if(id){removeArrowText(button);button.insertAdjacentHTML('afterbegin',iconHTML(id));}
 }
}
export function modalActionIcon(label,primary=false){
 if(/取消|暫不|留在/.test(label))return 'close';
 if(/返回|回到|回任務|回挑戰/.test(label))return 'back';
 if(/重試|再挑戰|重新/.test(label))return 'retry';
 if(/帶入|匯入/.test(label))return 'upload';
 if(/穿上|安裝/.test(label))return 'wardrobe';
 if(/知道|確定|了解/.test(label))return 'check';
 if(/繼續|出發|試試|準備|下一/.test(label))return 'next';
 if(/示範|看看|說明/.test(label))return 'help';
 return primary?'check':'help';
}
export function modalTitleIcon(title){
 if(/歇|暫停/.test(title))return 'pause';
 if(/星/.test(title))return 'star';
 if(/珍藏|服裝/.test(title))return 'gift';
 if(/旅程|紀錄|保存|帳號/.test(title))return 'cloud';
 return 'help';
}
export function savePresentation(status){
 return ({local:{icon:'local',text:'本機保存',hint:'訪客旅程保存在這台瀏覽器'},saved:{icon:'cloud',text:'已保存',hint:'目前旅程已保存'},pending:{icon:'clock',text:'正在保存',hint:'正在保存這次的旅程'},loading:{icon:'clock',text:'正在讀取',hint:'正在讀取你的旅程'},offline:{icon:'local',text:'等待連線',hint:'恢復連線後會再保存'},'cloud-error':{icon:'help',text:'等待保存',hint:'目前尚未保存到雲端，可到我的紀錄重試'},'storage-error':{icon:'help',text:'本機保存受限',hint:'這台瀏覽器暫時無法寫入紀錄'}})[status]??{icon:'local',text:'本機紀錄',hint:'目前使用這台瀏覽器的旅程'};
}
export function decorateLegacyControls(doc){
 const ids={'btn-pause-to-title':'home','btn-restart':'retry','btn-fail-restart':'retry','btn-select-back':'back','btn-upload-score':'upload','btn-cloud-refresh-result':'retry','script-battle-help':'help','script-next-stage':'next'};
 for(const button of doc.querySelectorAll('button')){
  if(button.querySelector('.game-icon'))continue;
  const label=button.textContent;
  const id=ids[button.id]??(/全螢幕/.test(label)?'fullscreen':/回挑戰|回無盡|返回山門/.test(label)?'back':/靈石祈願/.test(label)?'gem':/排行榜/.test(label)?'rank':'');
  if(id){removeArrowText(button);button.insertAdjacentHTML('afterbegin',iconHTML(id));}
 }
}