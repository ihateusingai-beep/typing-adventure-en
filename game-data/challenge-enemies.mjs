// Each row is an authored script for the matching existing enemy illustration.
// id, name, body motion, attack, breath seconds, hover px, lunge px, windup ms, recovery ms, color, move name
const rows=[
 ['snakelet_bamboo','竹葉蛇崽','serpent','bite',2.2,1,38,440,460,'#94c76b','竹影探牙'],
 ['wolf_cub','狼崽','beast','pounce',2.5,1.5,54,380,500,'#b5c6d1','踏葉飛撲'],
 ['boar_angry','暴怒野豬','beast','rush',1.8,.5,62,620,660,'#d7ae83','低首衝鋒'],
 ['forest_spirit','森林精魄','spirit','orb',3.1,10,15,780,550,'#9fdbad','林光凝珠'],
 ['shadow_imp','影魅','spirit','claw',2.1,7,42,400,430,'#c2a0df','影爪突襲'],
 ['flying_eye','飛眼','wing','orb',1.6,9,20,550,450,'#e0b389','凝視光球'],
 ['wolf_cub_elite','狼崽菁英','beast','pounce',2,2,67,460,420,'#d0e0ea','踏風連撲'],
 ['boar_angry_elite','暴怒野豬王','beast','rush',1.5,.8,74,760,720,'#e7b57b','裂地奔襲'],
 ['mountain_bandit','山賊','fighter','slash',2.9,1,38,510,440,'#ddc399','山道橫斬'],
 ['mountain_bandit_elite','山賊頭目','fighter','slash',2.4,1.2,48,660,510,'#efb26f','斷路重刀'],
 ['flying_eye_elite','邪瞳菁英','wing','shards',1.35,12,24,680,480,'#d4a4d9','三重瞳光'],
 ['ice_spirit','寒靈','spirit','frost',3.5,11,12,820,620,'#a4e4f4','凝霜寒息'],
 ['ice_spirit_elite','寒靈菁英','spirit','shards',2.8,13,18,920,570,'#c9f2ff','冰晶迴旋'],
 ['yeti','雪怪','heavy','stomp',3.4,.5,29,850,900,'#cde2e4','雪原重踏'],
 ['stone_golem','岩傀','heavy','stomp',4.1,.3,24,980,950,'#c4bb94','碎岩震地'],
 ['stone_golem_elite','岩傀菁英','heavy','rush',3.7,.2,37,1100,1050,'#d9c897','磐石推進'],
 ['crazed_scholar','狂書生','mage','scroll',2.7,1,21,710,530,'#dfd0a4','飛頁咒文'],
 ['crazed_scholar_elite','狂書生菁英','mage','scroll',2.15,2,28,850,470,'#efd493','千頁連咒'],
 ['lich_apprentice','巫妖學徒','mage','soul',3.3,6,17,900,680,'#b0c7e8','幽燈引魂'],
 ['lich_apprentice_elite','巫妖學徒菁英','mage','soul',2.65,8,25,1050,610,'#c7b3ef','魂火迴環'],
 ['shadow_imp_elite','影魅菁英','spirit','claw',1.75,10,55,520,370,'#d1a2ea','雙影裂爪'],
 ['corrupted_treant','腐化樹靈','tree','roots',4.5,.4,15,1000,870,'#b793cf','墨根纏繞'],
 ['corrupted_treant_elite','腐化古樹','tree','roots',5,.6,22,1220,1020,'#cbb0e5','古枝橫掃'],
 ['undead_warrior','不死武者','fighter','slash',3.8,.3,42,690,620,'#c1cfbd','沉劍斜斬'],
 ['forest_spirit_elite','林地守靈','tree','orb',3.9,4,19,920,680,'#c2e4a2','森息光環'],
 ['cave_troll_boss','洞窟巨魔','heavy','stomp',3.65,.7,44,1150,1150,'#c7b68c','洞窟崩震'],
 ['nether_lord_boss','一指禪魔王','lord','soul',3.6,5,42,1100,780,'#c5a0e6','玄墨劍獄'],
 ['forest_guardian_boss','森界守護王','tree','roots',4.8,1,29,1300,1050,'#b2d498','森界萬枝'],
 ['ruins_guardian_boss','遺跡守衛王','heavy','stomp',4.6,.2,34,1400,1200,'#e5cb8c','碑石震環'],
 ['frost_wyrm_boss','霜龍王','dragon','frost',3.2,8,46,1280,950,'#b5eaff','霜龍吐息'],
 ['lava_elemental_boss','熔炎元素王','flame','inferno',2.3,4,31,1380,1100,'#ffb780','熔火潮汐'],
 ['placeholder_monster','試煉幻影','spirit','orb',3,6,15,600,600,'#c3d2b0','幻光試招']
];
export const CHALLENGE_ENEMIES=Object.fromEntries(rows.map((r,index)=>{
 const [id,name,body,attack,breath,hover,lunge,windup,recovery,color,move]=r;
 return [id,{id,name,body,attack,breath,hover,lunge,windup,recovery,color,move,seed:index*.73,src:id==='placeholder_monster'?`assets/v3/challenge-enemies/${id}.webp`:`assets/v3/challenge-ai-thumbnails/${id}.webp`,referenceSrc:`assets/v3/challenge-enemies/${id}.webp`,animation:id==='placeholder_monster'?null:{src:`assets/v3/challenge-motion/${id}.webp`,columns:6,rows:5,cellSize:256,counts:id==='mountain_bandit'?[6,6,5,6,6]:[6,6,6,6,6],generator:'builtin_imagegen'},source:`assets/monsters/${id}.gif`,scale:id.endsWith('_boss')?1.12:body==='heavy'?1.08:body==='wing'?.89:1}];
}));
export const CHALLENGE_STAGES=[
 {name:'紮馬步',scene:'forest',chapter:'林間符印',story:'山門外的符印被林間精怪打散了。先穩住基準列，讓這條山路重新安定。',goal:'按中看得見的符文，集滿三次就會自動出劍。',keys:'A S D F J K L ;',tip:'符文走進畫面後，再按相同的鍵。',enemies:['snakelet_bamboo','wolf_cub','boar_angry','forest_spirit','shadow_imp','flying_eye','wolf_cub_elite','boar_angry_elite']},
 {name:'梯雲縱',scene:'frozen_peak',chapter:'踏雲越嶺',story:'山道被寒霧封住了。小禾在山的另一邊等你，用上排輕功越過風雪，再回到雙手的家。',goal:'按上排鍵集雲氣，再按畫面提示的 F 或 J 回防。',keys:'Q W E R T Y U I O P · F J',tip:'看到回防提示時，先回到 F 或 J。',enemies:['mountain_bandit','mountain_bandit_elite','flying_eye','flying_eye_elite','ice_spirit','ice_spirit_elite','yeti']},
 {name:'掃堂腿',scene:'cave',chapter:'石窟護行',story:'石窟裡的守衛攔住了旅人。看清下排暗器的符印，讓護盾替大家擋出一條路。',goal:'按中下排暗器，集滿三次格擋便會自動反震。',keys:'Z X C V B N M',tip:'先看清暗器上的字，再用對應的手指格擋。',enemies:['stone_golem','stone_golem_elite','crazed_scholar','crazed_scholar_elite','lich_apprentice','lich_apprentice_elite','shadow_imp_elite']},
 {name:'劍氣縱橫',scene:'ruins',chapter:'重拾劍訣',story:'遺跡的劍訣被墨咒拆散了。把字串依序接起來，讓守衛記起原本守護旅人的約定。',goal:'依序打完整個字串，才能施展完整的一招。',keys:'依畫面字串輸入',tip:'亮起的位置是下一個字；穩穩接完，再看下一串。',enemies:['corrupted_treant','corrupted_treant_elite','undead_warrior','forest_spirit_elite','shadow_imp_elite','cave_troll_boss']},
 {name:'決戰魔教',scene:'volcano',chapter:'五王試煉',story:'五位守關者在火山之巔布下最後的試煉。看清攻與守的時機，讓一路練來的功夫連成一體。',goal:'輸入字串進攻；防禦時按 F／J；真氣滿後按空白鍵。',keys:'字串 · F J · 空白',tip:'先看防禦提示，穩住後再繼續輸入字串。',enemies:['nether_lord_boss','forest_guardian_boss','ruins_guardian_boss','frost_wyrm_boss','lava_elemental_boss']}
];
export const CHALLENGE_ENEMY_IDS=[...new Set(CHALLENGE_STAGES.flatMap(s=>s.enemies))];
export const enemyProfile=id=>{const p=CHALLENGE_ENEMIES[id];if(!p)throw Error('Unknown challenge enemy: '+id);return p;};