/** SEN 中度 · 廣東話口語文案（短句、一句一事） */
export const CHAPTER_COPY={
 C01:{place:'練習室',intro:'今日練兩隻手。先搵 F 同 J。',close:'F 同 J 識搵喇。好叻！'},
 C02:{place:'課室',intro:'練中間嗰行鍵。慢慢嚟。',close:'中間一行識撳喇。繼續！'},
 C03:{place:'上面鍵',intro:'手指往上一格。撳完返 F J。',close:'上面鍵都識喇。好！'},
 C04:{place:'下面鍵',intro:'手指往下一格。一次一粒。',close:'下面鍵都得。讚！'},
 C05:{place:'數字鍵',intro:'練數字 1 到 0。一粒一粒。',close:'數字鍵都識。利害！'},
 C06:{place:'打字詞',intro:'幾個鍵連住撳。唔使急。',close:'識打字詞喇。好叻！'},
 C07:{place:'大關',intro:'有時要撳，有時要守。睇清楚。',close:'全部關卡完成！你好棒！'}
};
// 每關 3 句：做咩 → 邊隻手／鍵 → 點做
const LESSON_LINES={
 'S01-01':['手放鍵盤。','左手食指摸 F 凸點。','見到 F，就撳一下。'],
 'S01-02':['換右手。','右手食指摸 J 凸點。','見到 J，就撳。'],
 'S01-03':['兩隻手一齊。','有時 F，有時 J。','睇清楚先至撳。'],
 'S01-04':['再加兩粒鍵。','左手 D，右手 K。','慢慢撳，唔使急。'],
 'S02-01':['再遠少少。','左手 S，右手 L。','手指留中間行。'],
 'S02-02':['兩邊最尾。','左手 A，右手分號 ;','撳錯唔緊要，再試。'],
 'S02-03':['食指入少少。','左邊 G，右邊 H。','撳完摸返 F J。'],
 'S02-04':['中間一行一齊練。','睇畫面上邊粒。','對應嗰隻手指撳。'],
 'S03-01':['手指往上。','左手 E，右手 I。','撳完返中間行。'],
 'S03-02':['再上一格。','左手 R，右手 U。','家仍係 F 同 J。'],
 'S03-03':['無名指上面。','左手 W，右手 O。','睇準先至撳。'],
 'S03-04':['小指伸出去。','左邊 Q，右邊 P。','輕輕撳就得。'],
 'S03-05':['中間上面。','左手 T，右手 Y。','穩穩撳完呢關。'],
 'S04-01':['手指往下。','左手 V，右手 M。','一次一粒鍵。'],
 'S04-02':['再兩粒。','左手 C，右手 N。','手唔使離鍵盤。'],
 'S04-03':['下面再練。','左手 X，同埋 B。','搵到就撳。'],
 'S04-04':['最尾一粒 Z。','左手小指試下。','複習幾個下面鍵。'],
 'S05-01':['練數字。','左邊 1，右邊 0。','一粒一粒嚟。'],
 'S05-02':['下一對。','左邊 2，右邊 9。','慢慢撳。'],
 'S05-03':['再一對。','左手 3，右手 8。','撳啱就得。'],
 'S05-04':['食指數字。','左手 4，右手 7。','撳完返位。'],
 'S05-05':['中間數字。','左手 5，右手 6。','數字關完成！'],
 'S06-01':['字同字之間。','用拇指撳空白鍵。','見到「空白」就撳。'],
 'S06-02':['幾個字母連住。','跟畫面次序撳。','亮嗰粒就係下一個。'],
 'S06-03':['仲有標點。','逗號、句號喺右邊。','認位置，慢慢撳。'],
 'S06-04':['大階字母。','按住 Shift，再撳字母。','鬆手就返小階。'],
 'S07-01':['有時要守。','見到「防禦 F」或「防禦 J」。','睇清楚再撳。'],
 'S07-02':['有時打，有時守。','見到字就撳，見到防禦就守。','一次做一樣。'],
 'S07-03':['最後一關。','學過嘅一齊用。','睇準先至撳。加油！']
};
export function openingFor(node,name='同學'){
 const lines=LESSON_LINES[node.id];const speaker=node.chapterId==='C07'?'VILLAIN':'MASTER';
 const who=name&&name.trim()?name.trim():'同學';
 return [{speaker:node.chapterId==='C01'?'MASTER':node.chapterId==='C07'?'VILLAIN':'PEER',expression:'calm',text:missionFor(node).brief},...lines.slice(1).map((text,i)=>({speaker,expression:i===1?'encouraging':'calm',text:text.replaceAll('同學',who).replaceAll('少俠',who)}))];
}
export function closingFor(node,result){
 if(node.id==='S07-03')return [
  {speaker:'VILLAIN',expression:'respectful',text:'你好叻，全部得。'},
  {speaker:'MASTER',expression:'proud',text:'今日好穩陣。讚！'},
  {speaker:'PEER',expression:'happy',text:'過晒關喇！返主頁啦。'}
 ];
 const line=result.assisted?'你肯停低再搵，已經好叻。':result.attempted===result.correct?'今次全部啱！利害！':'呢關完成喇。慢慢嚟。';
 return [
  {speaker:'PEER',expression:'happy',text:missionFor(node).outcome},
  {speaker:'MASTER',expression:'encouraging',text:node.rewardOutfitId?'有新衫！去「換衫」試下。':line}
 ];
}
export const SPEAKERS={MASTER:'老師',PEER:'阿禾',VILLAIN:'對手',HERO:'同學'};
export const SCENES={
 forest:'assets/backgrounds/battle_forest_pixel.jpg',frozen:'assets/backgrounds/battle_frozen_peak_pixel.jpg',cave:'assets/backgrounds/battle_cave_pixel.jpg',ruins:'assets/backgrounds/battle_ruins_pixel.jpg',volcano:'assets/backgrounds/battle_volcano_pixel.jpg'
};

// [標題, 開場一句, 過關一句]
const MISSION_ROWS={
 C01:[
  ['搵左手 F','練左手。搵 F 鍵。','F 搵到喇！好叻！'],
  ['搵右手 J','練右手。搵 J 鍵。','J 都得！讚！'],
  ['F 同 J','有時 F，有時 J。','兩隻手都穩陣！'],
  ['D 同 K','再加 D 同 K。','第一章完成！有新衫！']
 ],
 C02:[
  ['S 同 L','練 S 同 L。','S L 識撳喇！'],
  ['A 同分號','練 A 同 ;','兩邊都得！'],
  ['G 同 H','練 G 同 H。','中間都識！'],
  ['中間一行','成行一齊練。','第二章完成！有新衫！']
 ],
 C03:[
  ['E 同 I','手指往上：E I。','E I 得！'],
  ['R 同 U','再上：R U。','R U 得！'],
  ['W 同 O','再練 W O。','W O 得！'],
  ['Q 同 P','兩邊 Q P。','Q P 得！'],
  ['T 同 Y','中間 T Y。','第三章完成！有新衫！']
 ],
 C04:[
  ['V 同 M','手指往下：V M。','V M 得！'],
  ['C 同 N','再練 C N。','C N 得！'],
  ['X 同 B','再練 X B。','X B 得！'],
  ['Z 同下面','練 Z，複習下面。','第四章完成！有新衫！']
 ],
 C05:[
  ['1 同 0','數字 1 同 0。','1 0 得！'],
  ['2 同 9','數字 2 同 9。','2 9 得！'],
  ['3 同 8','數字 3 同 8。','3 8 得！'],
  ['4 同 7','數字 4 同 7。','4 7 得！'],
  ['5 同 6','數字 5 同 6。','第五章完成！有新衫！']
 ],
 C06:[
  ['空白鍵','字中間要留空。','空白鍵得！'],
  ['連住撳','幾個字母連住撳。','連字得！'],
  ['標點','逗號、句號。','標點得！'],
  ['大階字','Shift + 字母。','第六章完成！有新衫！']
 ],
 C07:[
  ['學防守','見到防禦就守。','識防守喇！'],
  ['打同守','有時打，有時守。','攻守都得！'],
  ['最後一關','全部一齊用。','全部完成！你好棒！']
 ]
};
export function missionFor(node){
 const index=Number(node.id.split('-')[1])-1;
 const [title,brief,outcome]=MISSION_ROWS[node.chapterId][index];
 return {title,brief,outcome};
}
