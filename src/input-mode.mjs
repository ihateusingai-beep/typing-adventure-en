/** Input mode: phys (外接/電腦鍵) | virt (畫面大掣) | auto */
export const INPUT_MODE_KEY='typing_adventure_en_input_mode';

export function readInputMode(settings={}){
  const fromSave=settings?.inputMode;
  if(['auto','phys','virt'].includes(fromSave))return fromSave;
  try{
    const fromLs=localStorage.getItem(INPUT_MODE_KEY);
    if(['auto','phys','virt'].includes(fromLs))return fromLs;
  }catch{}
  return 'auto';
}

export function writeInputMode(mode){
  if(!['auto','phys','virt'].includes(mode))return;
  try{localStorage.setItem(INPUT_MODE_KEY,mode);}catch{}
}

/** auto: show virt on touch / no hover (iPad) */
export function shouldShowVirtual(mode='auto'){
  if(mode==='virt')return true;
  if(mode==='phys')return false;
  try{
    return matchMedia('(pointer:coarse)').matches||matchMedia('(hover:none)').matches||navigator.maxTouchPoints>0;
  }catch{return false;}
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
  return {
    code,
    key:labelForCode(code).length===1?labelForCode(code).toLowerCase():code,
    shiftKey:!!shiftKey,
    ctrlKey:false,metaKey:false,altKey:false,
    repeat:false,
    isComposing:false,
    preventDefault(){},
    stopPropagation(){},
  };
}

/** Build ordered unique virt keys from lesson allowedKeys + current target needs */
export function virtKeyCodesForNode(node,target){
  const chars=new Set();
  for(const k of (node?.allowedKeys||[]))chars.add(String(k).toLowerCase());
  if(target?.char!=null)chars.add(String(target.char).toLowerCase());
  if(target?.value)for(const c of target.value)chars.add(String(c).toLowerCase());
  // stable home-row-ish order
  const order='1234567890-qwertyuiopasdfghjkl;zxcvbnm,./ ';
  const list=[...chars].filter(c=>c).sort((a,b)=>{
    const ia=order.indexOf(a), ib=order.indexOf(b);
    return (ia<0?999:ia)-(ib<0?999:ib);
  });
  const codes=[];
  for(const c of list){
    if(/^[a-z]$/.test(c))codes.push('Key'+c.toUpperCase());
    else if(/^\d$/.test(c))codes.push('Digit'+c);
    else if(c===';')codes.push('Semicolon');
    else if(c===',')codes.push('Comma');
    else if(c==='.')codes.push('Period');
    else if(c==='/')codes.push('Slash');
    else if(c==='-')codes.push('Minus');
    else if(c===' ')codes.push('Space');
  }
  return codes;
}
