/** Full QWERTY virtual keyboard helpers + on/off preference */
export const VIRT_KB_KEY='typing_adventure_en_virt_kb';

export function readVirtKeyboardOn(settings={}){
  if(typeof settings.virtualKeyboard==='boolean')return settings.virtualKeyboard;
  try{
    const ls=localStorage.getItem(VIRT_KB_KEY);
    if(ls==='1'||ls==='true')return true;
    if(ls==='0'||ls==='false')return false;
  }catch{}
  // default: on for touch / iPad, off for desktop mouse
  try{
    return matchMedia('(pointer:coarse)').matches||matchMedia('(hover:none)').matches||navigator.maxTouchPoints>0;
  }catch{return false;}
}

export function writeVirtKeyboardOn(on){
  try{localStorage.setItem(VIRT_KB_KEY, on?'1':'0');}catch{}
}

/** legacy bridge for old auto/phys/virt saves */
export function migrateLegacyInputMode(settings={}){
  if(typeof settings.virtualKeyboard==='boolean')return settings.virtualKeyboard;
  const m=settings.inputMode;
  if(m==='virt')return true;
  if(m==='phys')return false;
  if(m==='auto')return readVirtKeyboardOn({});
  return readVirtKeyboardOn(settings);
}

export function labelForCode(code){
  if(code==='Space')return '空白';
  if(code==='Semicolon')return ';';
  if(code==='Comma')return ',';
  if(code==='Period')return '.';
  if(code==='Slash')return '/';
  if(code==='Minus')return '-';
  if(code==='ShiftLeft'||code==='ShiftRight')return 'Shift';
  if(code?.startsWith('Key'))return code.slice(3);
  if(code?.startsWith('Digit'))return code.slice(5);
  return code||'?';
}

export function syntheticKeyEvent(code,{shiftKey=false}={}){
  const lab=labelForCode(code);
  return {
    code,
    key:lab.length===1?lab.toLowerCase():code,
    shiftKey:!!shiftKey,
    ctrlKey:false,metaKey:false,altKey:false,
    repeat:false,
    isComposing:false,
    preventDefault(){},
    stopPropagation(){},
  };
}

/** Full QWERTY rows as event.code lists */
export const QWERTY_ROWS=[
  ['Digit1','Digit2','Digit3','Digit4','Digit5','Digit6','Digit7','Digit8','Digit9','Digit0','Minus'],
  ['KeyQ','KeyW','KeyE','KeyR','KeyT','KeyY','KeyU','KeyI','KeyO','KeyP'],
  ['KeyA','KeyS','KeyD','KeyF','KeyG','KeyH','KeyJ','KeyK','KeyL','Semicolon'],
  ['ShiftLeft','KeyZ','KeyX','KeyC','KeyV','KeyB','KeyN','KeyM','Comma','Period','Slash'],
  ['Space'],
];

/** Home-row anchors for SEN finger teaching */
export const HOME_ANCHORS=new Set(['KeyF','KeyJ']);

export function isCodeInLesson(code,node,target){
  const chars=new Set();
  for(const k of (node?.allowedKeys||[]))chars.add(String(k).toLowerCase());
  if(target?.char!=null)chars.add(String(target.char).toLowerCase());
  if(target?.value)for(const c of String(target.value))chars.add(c.toLowerCase());
  const lab=labelForCode(code).toLowerCase();
  if(code==='Space')return chars.has(' ');
  if(code==='ShiftLeft'||code==='ShiftRight')return true;
  return chars.has(lab);
}
