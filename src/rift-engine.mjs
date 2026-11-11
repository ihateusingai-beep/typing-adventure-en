import {RIFT_ROUTES,forgeLevel} from '../game-data/rift.mjs';
import {riftRelicProc} from '../game-data/spirit-treasures.mjs';
import {PK_DRILLS,targetCode,validPkCode} from '../game-data/pvp-rules.mjs';
const codes=(route,kind)=>{
 const drills=PK_DRILLS[route];
 if(kind==='mixed')return [...new Set(drills.flatMap(d=>d.codes))];
 return route==='en'?(drills.find(d=>d.id===kind)??drills[0]).codes:drills[{home:0,top:1,bottom:2}[kind]].codes;
};
const wave=s=>s.enemies[s.waves];
const pool=s=>codes(s.route,s.hard&&s.waves>1?'mixed':wave(s).keys);
export const riftAccuracy=s=>s.attempted?Math.round(100*s.correct/s.attempted):0;
export const riftTargets=(s,length=4)=>wave(s)?Array.from({length},(_,i)=>targetCode(s.seed+s.waves,s.index+i,pool(s))):[];
export function startRift(save,route,hard,seed,resultId,area='ruins'){
 const enemies=RIFT_ROUTES[area]?.enemies??RIFT_ROUTES.ruins.enemies;
 const forge=save.collection.forge,armor=forgeLevel(forge,'armor',save.equippedOutfitId);
 const maxHp=66+armor*12;
 return {route,hard,seed,resultId,enemies,maxHp,hp:maxHp,forge,relic:save.equippedTreasureId,charm:forge.charm,waves:0,index:0,combo:0,correct:0,attempted:0,phase:'fight',
  enemyHp:enemies[0].hp+(hard?10:0),shield:forge.charm==='stone'?8:0,strikes:0,bonus:0,wardUsed:false};
}
export function chooseRift(s,choice){
 if(s.phase!=='choice'||!['heal','strike'].includes(choice))return false;
 if(choice==='heal')s.hp=Math.min(s.maxHp,s.hp+12);else s.bonus=9;
 s.phase='fight';s.index=0;s.strikes=0;s.wardUsed=false;
 s.enemyHp=wave(s).hp+(s.hard?10:0);s.shield=s.charm==='stone'?Math.max(s.shield,8):s.shield;
 return true;
}
function hurt(s,amount){
 const blocked=Math.min(s.shield,amount);s.shield-=blocked;s.hp=Math.max(0,s.hp-(amount-blocked));
 if(!s.hp)s.phase='result';
 return amount-blocked;
}
export function riftInput(s,code){
 if(s.phase!=='fight'||!validPkCode(code))return null;
 const enemy=wave(s);s.attempted++;
 if(code!==riftTargets(s,1)[0]){
  s.combo=0;
  if(s.charm==='moon'&&!s.wardUsed){s.wardUsed=true;return {type:'ward',damage:0};}
  return {type:'wrong',damage:hurt(s,s.hard?7:4)};
 }
 s.index++;s.correct++;s.combo++;
 const strike=s.combo%3===0;
 if(strike)s.strikes++;
 const p=riftRelicProc(s.relic,s.forge,{combo:s.combo,strikes:s.strikes,strike});
 if(p.shield)s.shield=Math.max(s.shield,p.shield);
 if(p.heal)s.hp=Math.min(s.maxHp,s.hp+p.heal);
 let damage=0,received=0,counter=false;
 if(strike){
  const charm=s.charm==='fire'&&s.strikes===1?6:s.charm==='star'&&s.combo%6===0?4:0;
  damage=Math.max(1,13+(s.combo>=6?4:0)+(s.combo>=12?4:0)+charm+s.bonus-(enemy.armor??0));s.bonus=0;
 }
 damage+=p.damage;s.enemyHp=Math.max(0,s.enemyHp-damage);
 if(!s.enemyHp){
  s.waves++;
  if(s.charm==='bamboo')s.hp=Math.min(s.maxHp,s.hp+5);
  s.phase=s.waves===s.enemies.length?'result':'choice';
 }else if(strike&&s.strikes%2===0){counter=true;received=hurt(s,enemy.damage+(s.hard?5:0));}
 return {type:strike?'strike':'correct',damage,received,counter,proc:p.kind,finisher:s.combo>=6,defeated:s.enemyHp===0};
}