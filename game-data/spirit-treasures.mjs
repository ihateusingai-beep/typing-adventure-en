import {RIFT_TREASURES,riftArt,forgeLevel} from './rift.mjs';
// One independent treasure slot for solo adventures.
// Display names: 品格寶物（EDB 首要價值觀 · SEN 短名）
export const TREASURES=Object.freeze([
 {id:'none',name:'專心練習',role:'唔帶加成',description:'只靠衫同特效，專心打字。',node:null,color:'#c5ccb9',kind:'none'},
 {id:'flame',name:'堅毅羽',role:'唔放棄',description:'每兩次有效攻擊，再追擊 3 點。',node:'S01-04',chapter:1,color:'#ff9f66',kind:'chase'},
 {id:'frost',name:'守法鏡',role:'守規則',description:'每十連擊凝聚 8 點護盾，上限 8 點。',node:'S02-04',chapter:2,color:'#92e5ff',kind:'ward'},
 {id:'thunder',name:'承擔鼓',role:'敢擔當',description:'每十二連擊蓄力，下一次攻擊追加 6 點。',node:'S03-05',chapter:3,color:'#d1a0ff',kind:'burst'},
 {id:'lotus',name:'仁愛蓮',role:'關愛',description:'每十二連擊回復 4 點氣血，不超過上限。',node:'S04-04',chapter:4,color:'#a9efb7',kind:'heal'}
]);
export const ALL_TREASURES=[...TREASURES,...RIFT_TREASURES.map(t=>({...t,role:'秘境寶物',forge:true}))];
export const treasureFor=id=>ALL_TREASURES.find(t=>t.id===id)??TREASURES[0];
export const treasureId=id=>treasureFor(id).id;
export const treasureArt=id=>id==='none'?'assets/v3/ui/icons/shield.webp':treasureFor(id).forge?riftArt('relic',id):'assets/v3/treasures/'+treasureId(id)+'.png';
export const availableTreasures=save=>ALL_TREASURES.filter(t=>t.forge?save.collection?.forge?.crafted.includes('relic-'+t.id):!t.node||save.completedNodeIds?.includes(t.node));
export function treasureProc(id,{combo=0,strikes=0,strike=false}={}){
 const empty={damage:0,heal:0,shield:0,kind:null};
 if(id==='flame'&&strike&&strikes>0&&strikes%2===0)return {...empty,damage:3,kind:'chase'};
 if(id==='thunder'&&strike&&combo>0&&combo%12===0)return {...empty,damage:6,kind:'burst'};
 if(id==='frost'&&combo>0&&combo%10===0)return {...empty,shield:8,kind:'ward'};
 if(id==='lotus'&&combo>0&&combo%12===0)return {...empty,heal:4,kind:'heal'};
 return empty;
}
export const comboTier=combo=>combo>=24?3:combo>=12?2:combo>=6?1:0;
export const comboDamage=combo=>[9,11,14,18][comboTier(combo)];
export const comboName=combo=>['立志','勤練','承擔','成材'][comboTier(combo)];

export function riftRelicProc(id,forge,context){
 const {combo,strikes,strike}=context;
 let p=treasureProc(id,context);
 if(strike&&id==='thunder'&&combo>0&&combo%12===0)p={...p,kind:'burst',damage:6};
 if(strike&&id==='censer'&&strikes%3===0)p={...p,kind:'chase',damage:8};
 if(strike&&id==='hourglass'&&strikes%4===0)p={...p,kind:'burst',damage:14};
 if(strike&&id==='drum')p={...p,kind:'chase',damage:2};
 if(id==='dew'&&combo>0&&combo%9===0)p={...p,kind:'heal',heal:6};
 if(id==='compass'&&combo>0&&combo%8===0)p={...p,kind:'ward',shield:9};
 const level=forgeLevel(forge,'relic',id);
 return {...p,damage:p.damage?p.damage+2*level:0,heal:p.heal?p.heal+2*level:0,shield:p.shield?p.shield+3*level:0};
}
