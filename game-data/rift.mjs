export const RIFT_OUTFITS=[
 ['潮蓮扇姬','水蓮迴潮','水紗青衣，摺扇掀起一圈蓮潮。','aurora','orbit'],
 ['銅山行僧','梵鐘鎮嶽','赭衣、青石佛珠與沉重銅棍。','gold','heavy'],
 ['霜鏡旅人','寒鏡裂影','銀髮與單眼晶面，冰鏡化成向前迸裂的光。','frost','thrust'],
 ['雷鳶守將','雷鳶穿雲','長辮、鳶尾披肩與雙雷錘。','thunder','dash'],
 ['桃木丹師','桃符飛墨','圓鏡、雀斑與桃木筆，落筆帶出流光。','lotus','spin'],
 ['赤翎槍姬','鳳燎赤翎','紅纓高馬尾與赤金戰袍。提槍直進，鳳翎沿槍尖燃起。','ember','thrust'],
 ['墨蘭劍客','墨蘭聽雨','墨髮蘭簪、牙白長衫，一劍從水墨蘭枝間掠過。','lotus','dash'],
 ['青麂巡林','鹿影雙月','白鹿半面、青玉鱗甲與雙彎刃。左右合斬，鹿角形刀光交會。','bamboo','spin'],
 ['弦月琴仙','月弦迴音','月梳長辮、靛藍銀紗。琵琶一撥，金弦與弦月同時展開。','moon','orbit']
].map(([name,effectName,description,effect,motion],i)=>({id:'O'+(21+i),name,title:'秘境衣裝',description,effect,effectName,effectDescription:description,motion,category:'rift'}));
export const RIFT_TREASURES=[
 {id:'censer',name:'蟠龍香爐',kind:'chase',color:'#f2ab7c',description:'每三次出招，追加 8 點火息傷害。'},
 {id:'compass',name:'地脈羅盤',kind:'ward',color:'#c6ed9e',description:'每八連擊獲得 9 點護盾。'},
 {id:'dew',name:'月露銀瓶',kind:'heal',color:'#bbf2ff',description:'每九連擊回復 6 點氣血。'},
 {id:'hourglass',name:'星砂漏',kind:'burst',color:'#dbadff',description:'每四次出招，追加 14 點星砂傷害。'},
 {id:'drum',name:'丹霞戰鼓',kind:'chase',color:'#ffb067',description:'每次出招追加 2 點震擊傷害。'}
];
export const CHARMS=[
 {id:'stone',name:'鎮山護符',color:'#ebc888',description:'進場時每一戰獲得 8 點護盾。'},
 {id:'fire',name:'赤焰護符',color:'#ff9d7d',description:'每一戰首次出招追加 6 點傷害。'},
 {id:'bamboo',name:'回青護符',color:'#a5e0a6',description:'擊敗敵人時回復 5 點氣血。'},
 {id:'moon',name:'月隱護符',color:'#b7d7ff',description:'每一戰第一次按錯時免受傷。'},
 {id:'star',name:'連星護符',color:'#dfb2ff',description:'每達六連擊，該次攻擊追加 4 點傷害。'}
];
export const RIFT_ENEMIES=[
 {id:'mantis',name:'碧刃螳傀',attack:'雙刃突進',body:'lunge',hp:35,damage:6,color:'#cde99b',keys:'home'},
 {id:'tortoise',name:'霜甲玄龜',attack:'霜甲震地',body:'stomp',hp:43,damage:7,color:'#aaddff',keys:'home',armor:3},
 {id:'fox',name:'幽火雙尾',attack:'幽火追魂',body:'blink',hp:48,damage:8,color:'#e4b2ff',keys:'top'},
 {id:'bell',name:'銅鐘石傀',attack:'裂地鐘鳴',body:'heavy',hp:56,damage:10,color:'#ffc87b',keys:'bottom',armor:4},
 {id:'crane',name:'丹羽紙鶴',attack:'飛羽穿陣',body:'dive',hp:64,damage:12,color:'#ff9b96',keys:'mixed'}
];
export const MOON_ENEMIES=[
 {id:'moth',name:'銀翅月蛾',attack:'振翅月刃',body:'flutter',hp:47,damage:8,color:'#c3e6ff',keys:'top'},
 {id:'rabbit',name:'青玉長耳',attack:'蹬地震玉',body:'vault',hp:52,damage:9,color:'#a5ecc2',keys:'bottom',armor:2},
 {id:'duelist',name:'墨衣劍偶',attack:'墨影拔斬',body:'draw',hp:58,damage:10,color:'#cbafff',keys:'home'},
 {id:'lion',name:'鎏金香獅',attack:'香火狂撲',body:'maul',hp:66,damage:11,color:'#ffc687',keys:'mixed',armor:4},
 {id:'dragon',name:'玄月蛟君',attack:'盤月龍吟',body:'coil',hp:76,damage:13,color:'#f0dc9e',keys:'mixed',armor:2}
];
export const RIFT_ROUTES={
 ruins:{name:'古寺石陣',scene:'ruins',enemies:RIFT_ENEMIES},
 moon:{name:'月隱山徑',scene:'frozen_peak',enemies:MOON_ENEMIES}
};
export const CELESTIAL_EFFECT_OUTFITS=RIFT_OUTFITS.slice(5);
export const RIFT_ART='assets/v3/rift/';
export const riftArt=(type,id)=>RIFT_ART+type+'-'+id+'.webp';
export const CRAFT_COST=180,UPGRADE_COSTS=[80,140,220];
export const RIFT_UNLOCK_NODE='S02-04';
export const FORGE_ITEMS=[
 ...RIFT_OUTFITS.map(x=>({...x,kind:'outfit',key:'outfit-'+x.id})),
 ...RIFT_TREASURES.map(x=>({...x,kind:'relic',key:'relic-'+x.id})),
 ...CHARMS.map(x=>({...x,kind:'charm',key:'charm-'+x.id}))
];
const tiers=['armor1','armor2','armor3','relic1','relic2','relic3'];
export const BASE_RELIC_IDS=['flame','frost','thunder','lotus'];
const craftedIds=FORGE_ITEMS.map(x=>x.key);
const outfitIds=Array.from({length:30},(_,i)=>'O'+String(i).padStart(2,'0'));
const relicIds=[...BASE_RELIC_IDS,...RIFT_TREASURES.map(t=>t.id)];
export const blankForge=()=>({crafted:[],armor1:[],armor2:[],armor3:[],relic1:[],relic2:[],relic3:[],charm:'none',best:0,hardBest:0});
export function normalizeForge(raw={}){
 raw=raw??{};
 const f=blankForge(),copy=(key,ids)=>f[key]=ids.filter(id=>Array.isArray(raw[key])&&raw[key].includes(id));
 copy('crafted',craftedIds);
 for(const key of tiers){const level=+key.at(-1),armor=key.startsWith('armor');copy(key,(armor?outfitIds:relicIds).filter(id=>(level===1||f[key.slice(0,-1)+(level-1)].includes(id))&&(armor?(Number(id.slice(1))<21||f.crafted.includes('outfit-'+id)):(BASE_RELIC_IDS.includes(id)||f.crafted.includes('relic-'+id)))));}
 f.charm=f.crafted.includes('charm-'+raw.charm)?raw.charm:'none';
 for(const key of ['best','hardBest'])f[key]=Math.min(5,Math.max(0,Math.floor(Number(raw[key])||0)));
 return f;
}
export function forgeSpent(f){return CRAFT_COST*f.crafted.length+tiers.reduce((n,key)=>n+f[key].length*UPGRADE_COSTS[+key.at(-1)-1],0);}
export const forgeLevel=(f,type,id)=>[1,2,3].filter(n=>f?.[type+n]?.includes(id)).length;
export function riftReward({waves,hard,accuracy}){return waves>0?waves*(hard?32:24)+(waves===5?(accuracy>=95?65:35):0):0;}