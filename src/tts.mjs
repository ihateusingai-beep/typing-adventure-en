/** 文字朗讀 — Web Speech API，粵語優先，可開關 */
let speaking=false;
let preferred=null;

function pickVoice(){
  const list=window.speechSynthesis?.getVoices?.()||[];
  if(!list.length)return null;
  const score=v=>{
    const n=`${v.lang} ${v.name}`.toLowerCase();
    let s=0;
    if(/zh-hk|yue|cantonese|香港|粵/.test(n))s+=50;
    if(/zh-tw|zh_cn|zh-cn|chinese|中文/.test(n))s+=20;
    if(/en-hk|en_gb|en-us|english/.test(n))s+=5;
    return s;
  };
  return [...list].sort((a,b)=>score(b)-score(a))[0]||list[0];
}

export function voiceOn(save){
  if(typeof save?.settings?.voiceRead==='boolean')return !!save.settings.voiceRead;
  return true; // SEN 預設開
}

export function stopSpeak(){
  try{window.speechSynthesis?.cancel();}catch{}
  speaking=false;
}

export function speakText(text,{save,force=false,lang}={}){
  if(!text||typeof text!=='string')return false;
  if(!force&&save&&!voiceOn(save))return false;
  if(!window.speechSynthesis)return false;
  const clean=text.replace(/\s+/g,' ').replace(/[★☆●◆■□]/g,'').trim();
  if(!clean)return false;
  stopSpeak();
  const u=new SpeechSynthesisUtterance(clean);
  preferred=preferred||pickVoice();
  if(preferred)u.voice=preferred;
  u.lang=lang||preferred?.lang||'zh-HK';
  u.rate=0.92;
  u.pitch=1;
  speaking=true;
  u.onend=()=>{speaking=false;};
  u.onerror=()=>{speaking=false;};
  // Chrome needs voices loaded
  const run=()=>window.speechSynthesis.speak(u);
  if(!(window.speechSynthesis.getVoices()||[]).length){
    window.speechSynthesis.addEventListener('voiceschanged',()=>{preferred=pickVoice();if(preferred)u.voice=preferred;run();},{once:true});
    // fallback timeout
    setTimeout(run,120);
  }else run();
  return true;
}

export function speakButton(label='讀'){
  return `<button type="button" class="speak-btn" data-action="speak-near" aria-label="朗讀文字" title="朗讀">${label==='icon'?'🔊':label}</button>`;
}

// warm voices
if(typeof window!=='undefined'&&window.speechSynthesis){
  window.speechSynthesis.getVoices();
  window.speechSynthesis.addEventListener?.('voiceschanged',()=>{preferred=pickVoice();});
}
