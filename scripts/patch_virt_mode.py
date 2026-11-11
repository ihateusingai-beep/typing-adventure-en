#!/usr/bin/env python3
from pathlib import Path
import subprocess
import re

p = Path('/Users/kencheng/works/wuxia-typing-en-clone/src/main.mjs')
t = p.read_text()

old_imp = "import {initMedia,media,portraitHTML,Sprite,BattleEffects,Sound,watchArt,outfitThumbnail} from './media.mjs?v=cut1';"
if 'input-mode.mjs' not in t:
    if old_imp not in t:
        raise SystemExit('import anchor missing')
    t = t.replace(
        old_imp,
        old_imp + "\nimport {readInputMode,writeInputMode,shouldShowVirtual,labelForCode,syntheticKeyEvent,virtKeyCodesForNode} from './input-mode.mjs';",
    )

if 'let virtShiftHeld' not in t:
    t = t.replace(
        'const held=new Set();let sceneTimer=null;let pendingModalClose=null;',
        'const held=new Set();let sceneTimer=null;let pendingModalClose=null;\nlet virtShiftHeld=false;let virtForceOn=null;',
    )

helpers = r'''
function currentInputMode(){
  const m=store?.save?.settings?.inputMode;
  return readInputMode(m?{inputMode:m}:{});
}
function virtEnabled(){
  if(virtForceOn===true)return true;
  if(virtForceOn===false)return false;
  return shouldShowVirtual(currentInputMode());
}
function syncVirtBodyClass(){
  const on=view==='battle'&&virtEnabled();
  document.body.classList.toggle('virt-on',on);
  return on;
}
function setInputMode(mode){
  if(!['auto','phys','virt'].includes(mode))return;
  writeInputMode(mode);
  store.update({...store.save,settings:{...store.save.settings,inputMode:mode}},{settingsDirty:true});
  virtForceOn=null;
  if(view==='battle'){refreshVirtBoard();screen.focus({preventScroll:true});}
  else if(view==='settings')renderSettings();
  toast(mode==='virt'?'畫面大掣 mode':mode==='phys'?'淨用鍵盤 mode':'自動：iPad 會出畫面掣');
}
function virtBoardHTML(){
  if(!session||!node)return '';
  const t=targetOf(session);
  const codes=virtKeyCodesForNode(node,t);
  const needShift=!!(t&&(t.shift||t.kind==='case'));
  const expect=t?physicalCode(t.char):'';
  const keys=[];
  if(needShift||virtShiftHeld){
    keys.push(`<button type="button" class="virt-key is-shift ${virtShiftHeld?'is-on':''}" data-action="virt-key" data-code="ShiftLeft" aria-pressed="${virtShiftHeld}">Shift</button>`);
  }
  for(const code of codes){
    const lab=labelForCode(code);
    const isT=code===expect;
    const extra=code==='Space'?' is-space':'';
    keys.push(`<button type="button" class="virt-key${extra}${isT?' is-target':''}" data-action="virt-key" data-code="${code}" aria-label="撳 ${lab}">${esc(lab)}</button>`);
  }
  return `<div class="virt-board" id="virt-board" aria-label="畫面鍵"><p class="virt-hint">用手指撳大掣 · 或者用鍵盤</p>${keys.join('')}</div>`;
}
function virtToggleHTML(){
  return `<div class="virt-toggle-row"><button type="button" class="text-link" data-action="toggle-virt">${virtEnabled()?'收起畫面掣':'開畫面大掣'}</button><button type="button" class="text-link" data-action="cycle-input-mode">輸入：${({auto:'自動',phys:'鍵盤',virt:'畫面'})[currentInputMode()]}</button></div>`;
}
function refreshVirtBoard(){
  const on=syncVirtBodyClass();
  const board=$('#virt-board');
  if(!board)return;
  if(!on){board.hidden=true;return;}
  board.hidden=false;
  const wrap=document.createElement('div');
  wrap.innerHTML=virtBoardHTML();
  const next=wrap.firstElementChild;
  if(next)board.replaceWith(next);
  const row=$('.virt-toggle-row');
  if(row){const w=document.createElement('div');w.innerHTML=virtToggleHTML();row.replaceWith(w.firstElementChild);}
}
function applyVirtKey(code){
  if(view!=='battle'||paused||!session||session.done)return;
  sound.unlock();
  if(code==='ShiftLeft'||code==='ShiftRight'){
    virtShiftHeld=!virtShiftHeld;
    refreshVirtBoard();
    const msg=$('#story-message');
    if(msg)msg.textContent=virtShiftHeld?'Shift 開咗 · 再撳字母':'Shift 關咗';
    return;
  }
  const shift=virtShiftHeld;
  processKey(syntheticKeyEvent(code,{shiftKey:shift}));
  if(shift&&code.startsWith('Key'))virtShiftHeld=false;
  refreshVirtBoard();
  screen.focus({preventScroll:true});
}
'''

if 'function virtBoardHTML' not in t:
    if 'function keyboardHTML(){' not in t:
        raise SystemExit('keyboardHTML missing')
    t = t.replace('function keyboardHTML(){', helpers + '\nfunction keyboardHTML(){')

needle = '<div class="no-keyboard">練習打字請使用實體鍵盤。</div></div>`'
repl = '<div class="no-keyboard">可以用鍵盤，或者下面大掣。</div>${virtBoardHTML()}${virtToggleHTML()}</div>`'
if needle not in t:
    raise SystemExit('battle no-keyboard needle missing: ' + repr(t[t.find('no-keyboard')-30:t.find('no-keyboard')+80] if 'no-keyboard' in t else 'none'))
t = t.replace(needle, repl)

t = t.replace("${gameIcon('pause')}停 Esc</button>", "${gameIcon('pause')}停</button>")

old_rb_end = "fx.setTarget(targetOf(session).kind);sound.bgm(node.chapterId==='C07'?'battle':'main');\n}"
new_rb_end = "fx.setTarget(targetOf(session).kind);sound.bgm(node.chapterId==='C07'?'battle':'main');\n virtShiftHeld=false;syncVirtBodyClass();screen.focus({preventScroll:true});\n}"
if old_rb_end not in t:
    raise SystemExit('renderBattle end missing')
t = t.replace(old_rb_end, new_rb_end, 1)

pk_start = t.find('function processKey(event){')
fl_start = t.find('function finishLesson(){')
if pk_start < 0 or fl_start < 0:
    raise SystemExit('processKey/finishLesson missing')
pk = t[pk_start:fl_start].rstrip()
if not pk.endswith('}'):
    raise SystemExit('processKey end not brace')
if 'refreshVirtBoard();' not in pk:
    pk = pk[:-1] + ' refreshVirtBoard();\n}\n'
    t = t[:pk_start] + pk + t[fl_start:]

t = t.replace(
    'function resumeBattle(){paused=false;fx?.resume();screen.focus({preventScroll:true});sound.resume();}',
    'function resumeBattle(){paused=false;fx?.resume();syncVirtBodyClass();screen.focus({preventScroll:true});sound.resume();}',
)

if "if(id!=='battle'){document.body.classList.remove('virt-on')" not in t:
    t = t.replace(
        "function setView(id,html,{scene='BG_YARD'}={}){",
        "function setView(id,html,{scene='BG_YARD'}={}){\n if(id!=='battle'){document.body.classList.remove('virt-on');virtShiftHeld=false;}",
    )

s0 = t.find('function renderSettings(){')
s1 = t.find('\nfunction ', s0 + 10)
if s0 < 0 or s1 < 0:
    raise SystemExit('renderSettings missing')
new_settings = '''function renderSettings(){
 const mode=currentInputMode();
 const modeRow=`<div class="setting-row"><div><span class="setting-title" id="setting-inputMode">${gameIcon('keyboard')}點樣撳鍵</span><small>自動：iPad/手指會出畫面大掣；鍵盤：淨用實體鍵；畫面：成日顯示大掣</small></div><div class="mode-picker" role="group" aria-labelledby="setting-inputMode">${[['auto','自動'],['phys','鍵盤'],['virt','畫面']].map(([id,lab])=>`<button type="button" class="${mode===id?'active':''}" data-action="set-input-mode" data-id="${id}" aria-pressed="${mode===id}">${lab}</button>`).join('')}</div></div>`;
 setView('settings',frame(`<div class="chapter">照自己的節奏練習</div><h1>設定</h1>${modeRow}${[['autoAdvance','過關自動前進','結算後倒數六秒，接續下一關'],['muted','靜音','關閉音效'],['reducedMotion','減少動態','少啲閃同郁'],['highContrast','提高對比','字同目標更清楚']].map(([id,title,desc])=>`<div class="setting-row"><div><span class="setting-title" id="setting-${id}">${gameIcon(id==='muted'?'sound':id==='autoAdvance'?'next':id==='reducedMotion'?'shield':'settings')}${title}</span><small>${desc}</small></div><button class="toggle" data-action="toggle-setting" data-id="${id}" aria-pressed="${store.save.settings[id]}" aria-labelledby="setting-${id}"><i class="toggle-thumb" aria-hidden="true"></i><span>${store.save.settings[id]?'開':'關'}</span></button></div>`).join('')}<div class="settings-links">${secondary('account','儲存')}${secondary('home','返主頁')}</div><button class="text-link" data-action="privacy" style="align-self:flex-start;margin-top:20px">保存同隱私</button><p class="small" style="font-size:10px;margin-top:25px">打字練習 ${VERSION}</p>`,'settings-panel'));
}
'''
t = t[:s0] + new_settings + t[s1:]

old_actions = "settings:renderSettings,'toggle-setting':b=>{store.update({...store.save,settings:{...store.save.settings,[b.dataset.id]:!store.save.settings[b.dataset.id]}},{settingsDirty:true});renderSettings();},"
new_actions = (
    "settings:renderSettings,"
    "'toggle-setting':b=>{if(b.dataset.id==='inputMode')return;store.update({...store.save,settings:{...store.save.settings,[b.dataset.id]:!store.save.settings[b.dataset.id]}},{settingsDirty:true});renderSettings();},"
    "'set-input-mode':b=>setInputMode(b.dataset.id),"
    "'cycle-input-mode':()=>{const order=['auto','phys','virt'];const i=order.indexOf(currentInputMode());setInputMode(order[(i+1)%order.length]);if(view==='battle')refreshVirtBoard();},"
    "'toggle-virt':()=>{virtForceOn=!virtEnabled();refreshVirtBoard();toast(virtEnabled()?'已開畫面大掣':'已收起畫面掣');},"
    "'virt-key':b=>{applyVirtKey(b.dataset.code);},"
)
if "'virt-key'" not in t:
    if old_actions not in t:
        raise SystemExit('settings actions anchor missing')
    t = t.replace(old_actions, new_actions)

t = t.replace(
    '按 <kbd>Enter</kbd> 或 <kbd>${esc(key)}</kbd> 開始練習。這次確認不計分。',
    '撳下面大掣，或者撳鍵盤 <kbd>${esc(key)}</kbd>。今次唔計分。',
)

# Physical keys still work; keep focus after phys key
phys_line = "if(physicalKey(event.code)!==null){event.preventDefault();sound.unlock();processKey(event);}"
if phys_line in t and 'screen.focus' not in t[t.find(phys_line):t.find(phys_line)+120]:
    t = t.replace(
        phys_line,
        "if(physicalKey(event.code)!==null){event.preventDefault();sound.unlock();processKey(event);if(view==='battle')screen.focus({preventScroll:true});}",
    )

p.write_text(t)
r = subprocess.run(['node', '--check', str(p)], capture_output=True, text=True)
print('check', r.returncode)
print(r.stderr or 'OK')
if r.returncode != 0:
    raise SystemExit(1)
print('bytes', p.stat().st_size)
