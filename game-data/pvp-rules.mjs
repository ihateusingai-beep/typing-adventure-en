import {BPMF_BY_KEY,physicalKey} from '../src/keyboard.mjs';
export const PK_RULES=Object.freeze({version:'pk-v2',hp:100,duration:60000,countdown:3000,batch:100,charge:3,damage:9,mistake:2,shieldEvery:10,shieldHp:5,reconnect:10000,presence:30000,invite:15000,roomLife:3600000});
const keys=s=>s.split(' ').map(k=>k===';'?'Semicolon':/^\d$/.test(k)?'Digit'+k:'Key'+k.toUpperCase());
export const PK_DRILLS={
 en:[{id:'home',label:'基準列',codes:keys('a s d f j k l ;')},{id:'fj',label:'F、J 起步',codes:keys('f j')},{id:'top',label:'上排鍵',codes:keys('q w e r t y u i o p')},{id:'bottom',label:'下排鍵',codes:keys('z x c v b n m')}],
 'zh-bpmf':[{id:'initials',label:'入門聲母',codes:keys('1 q a z 2 w s x')},{id:'home',label:'注音中排',codes:keys('a s d f g h j k l ;')},{id:'all',label:'完整注音',codes:Object.keys(BPMF_BY_KEY).map(k=>/^\d$/.test(k)?'Digit'+k:k===';'?'Semicolon':k===','?'Comma':k==='.'?'Period':k==='/'?'Slash':k==='-'?'Minus':'Key'+k.toUpperCase()).filter(c=>physicalKey(c)!==null)}]
};
export const pkRoute=r=>r==='zh-bpmf'?'zh-bpmf':'en';
export function pkDrill(route,id,custom){const list=PK_DRILLS[pkRoute(route)];if(id==='custom'){const codes=[...new Set(Array.isArray(custom)?custom:[])];if(codes.length<2||codes.length>16||codes.some(c=>!validPkCode(c)))throw Error('指定鍵組需有 2 至 16 個有效鍵位。');return {id:'custom',label:'指定鍵組',codes};}return list.find(d=>d.id===id)??list[0];}
export function validPkCode(code){return typeof code==='string'&&physicalKey(code)!==null;}
export function pkLabel(code,route){const k=physicalKey(code);return pkRoute(route)==='zh-bpmf'?(BPMF_BY_KEY[k]??k?.toUpperCase()??''):k===' '?'空白':k?.toUpperCase()??'';}
export function targetCode(seed,index,codes){const block=Math.floor(index/codes.length),out=[...codes];let x=(seed^Math.imul(block+1,0x9e3779b9))>>>0;for(let i=out.length-1;i>0;i--){x^=x<<13;x^=x>>>17;x^=x<<5;const j=(x>>>0)%(i+1);[out[i],out[j]]=[out[j],out[i]];}return out[index%out.length];}
export const pkAccuracy=p=>p.attempted?Math.round(p.correct/p.attempted*10000)/100:0;