/** 練習模式（Drill）— 無劇情、全開鍵組、重用戰鬥殼 */
export const DRILL_GOAL=12;
export const DRILL_ENEMY='E_NEW_01';
export const DRILL_BG='BG_YARD';

/** @typedef {{id:string,cat:'finger'|'alpha',title:string,sub:string,keys:string[]}} DrillGroup */

/** @type {DrillGroup[]} */
export const DRILL_GROUPS=[
  // 指法（主推）
  {id:'asdf',cat:'finger',title:'ASDF',sub:'左手家鍵',keys:['a','s','d','f']},
  {id:'jkl',cat:'finger',title:'JKL;',sub:'右手家鍵',keys:['j','k','l',';']},
  {id:'home',cat:'finger',title:'家鍵',sub:'ASDF JKL;',keys:['a','s','d','f','j','k','l',';']},
  {id:'qwer',cat:'finger',title:'QWER',sub:'左手上排',keys:['q','w','e','r']},
  {id:'uiop',cat:'finger',title:'UIOP',sub:'右手上排',keys:['u','i','o','p']},
  {id:'zxcv',cat:'finger',title:'ZXCV',sub:'左手下排',keys:['z','x','c','v']},
  {id:'fghj',cat:'finger',title:'FGHJ',sub:'左右食指',keys:['f','g','h','j']},
  // 字母段（認鍵）
  {id:'abc',cat:'alpha',title:'ABC',sub:'字母',keys:['a','b','c']},
  {id:'def',cat:'alpha',title:'DEF',sub:'字母',keys:['d','e','f']},
  {id:'ghi',cat:'alpha',title:'GHI',sub:'字母',keys:['g','h','i']},
  {id:'jkl-a',cat:'alpha',title:'JKL',sub:'字母',keys:['j','k','l']},
  {id:'mno',cat:'alpha',title:'MNO',sub:'字母',keys:['m','n','o']},
  {id:'pqr',cat:'alpha',title:'PQR',sub:'字母',keys:['p','q','r']},
  {id:'stu',cat:'alpha',title:'STU',sub:'字母',keys:['s','t','u']},
  {id:'vwx',cat:'alpha',title:'VWX',sub:'字母',keys:['v','w','x']},
  {id:'yz',cat:'alpha',title:'YZ',sub:'字母',keys:['y','z']},
];

export const DRILL_BY_ID=Object.fromEntries(DRILL_GROUPS.map(g=>[g.id,g]));

export function drillGroup(id){
  return DRILL_BY_ID[id]??DRILL_GROUPS[0];
}

/** Fake curriculum node — makeSession-compatible, no story lock */
export function makeDrillNode(groupId,goal=DRILL_GOAL){
  const g=drillGroup(groupId);
  const keys=[...g.keys];
  return {
    id:'DRILL-'+g.id,
    drill:true,
    groupId:g.id,
    title:g.title,
    sub:g.sub,
    cat:g.cat,
    chapterId:'DRILL',
    enemyId:DRILL_ENEMY,
    backgroundId:DRILL_BG,
    route:'en',
    allowedKeys:keys,
    newKeys:keys,
    mechanic:'key_drill',
    completion:{target:goal},
    returnHomeEveryCorrect:false,
    requires:[],
  };
}

/** Codes for virt board (本組大掣) */
export function drillCodes(node){
  const out=[];
  for(const k of node?.allowedKeys||[]){
    const c=String(k);
    if(/^[a-z]$/i.test(c))out.push('Key'+c.toUpperCase());
    else if(c===';')out.push('Semicolon');
    else if(c===',')out.push('Comma');
    else if(c==='.')out.push('Period');
    else if(c==='/')out.push('Slash');
    else if(c==='-')out.push('Minus');
    else if(c===' ')out.push('Space');
    else if(/^\d$/.test(c))out.push('Digit'+c);
  }
  return out;
}
