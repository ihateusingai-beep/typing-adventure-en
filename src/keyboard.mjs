// Standard Taiwan (Da-Qian) key positions. Judgement never uses IME output text.
export const BPMF_KEYS=Object.freeze({
 'ㄅ':'1','ㄆ':'q','ㄇ':'a','ㄈ':'z','ㄉ':'2','ㄊ':'w','ㄋ':'s','ㄌ':'x','ㄍ':'e','ㄎ':'d','ㄏ':'c','ㄐ':'r','ㄑ':'f','ㄒ':'v','ㄓ':'5','ㄔ':'t','ㄕ':'g','ㄖ':'b','ㄗ':'y','ㄘ':'h','ㄙ':'n','ㄧ':'u','ㄨ':'j','ㄩ':'m','ㄚ':'8','ㄛ':'i','ㄜ':'k','ㄝ':',','ㄞ':'9','ㄟ':'o','ㄠ':'l','ㄡ':'.','ㄢ':'0','ㄣ':'p','ㄤ':';','ㄥ':'/','ㄦ':'-','ˇ':'3','ˋ':'4','ˊ':'6','˙':'7'
});
export const BPMF_BY_KEY=Object.freeze(Object.fromEntries(Object.entries(BPMF_KEYS).map(([a,b])=>[b,a])));
const PUNCT={Semicolon:';',Comma:',',Period:'.',Slash:'/',Minus:'-',Space:' ',Quote:"'",BracketLeft:'[',BracketRight:']',Backslash:'\\',Backquote:'`',Equal:'='};
export function physicalKey(code){if(/^Key[A-Z]$/.test(code??''))return code.slice(3).toLowerCase();if(/^Digit[0-9]$/.test(code??''))return code.slice(5);return PUNCT[code]??null;}
export const routeLabel=route=>route==='zh-bpmf'?'注音':'英文';
export const routeKey=route=>route==='zh-bpmf'?'zh-bpmf':'en';