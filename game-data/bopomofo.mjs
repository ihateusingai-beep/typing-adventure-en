import {CURRICULUM} from './curriculum.mjs';
// Each route has the same bounded progress IDs and its own save document.
const chapters=[
 ['聲母初醒','師門庭院','師傅發現一套新的音印。先從 ㄅ、ㄆ 開始，一次認識一個注音鍵。'],
 ['急信尋音','山門內廳','急信被墨霧藏住了。找回聲母的音印，讓村民聽見求助的消息。'],
 ['山路聲印','踏雲山路','沿著山風帶來的音印前進。把剩下的聲母找齊，送信紙鳶就能飛過山頭。'],
 ['三音過橋','竹影渡口','橋上的三座音鈴沉默了。學會 ㄧ、ㄨ、ㄩ，讓竹橋重新接起來。'],
 ['韻母星燈','星燈山城','燈匠把韻母藏進星燈。每找回一組，山城就多一段明亮的路。'],
 ['聲調連招','藏書遺跡','音印要有聲調，才能留下完整的劍訣。先認聲調鍵，再依序連成音節。'],
 ['音訣歸一','鍵心碑前','墨影門主守著最後的音訣。看清音節，也看清防禦提示，讓鍵心碑再次發光。']
];
// title, newly introduced symbols, allowed symbols, repetition count.
const lessons=[
 ['第一枚音印','ㄅ','ㄅ',8],['山風的回聲','ㄆ','ㄆ',8],['兩印相和','','ㄅㄆ',12],['庭院四音','ㄇㄈ','ㄅㄆㄇㄈ',16],
 ['信上的足跡','ㄉㄊ','ㄉㄊ',16],['兩端的線索','ㄋㄌ','ㄋㄌㄉㄊ',16],['霧中的三音','ㄍㄎㄏ','ㄍㄎㄏ',18],['急信重現','','ㄅㄆㄇㄈㄉㄊㄋㄌㄍㄎㄏ',20],
 ['迎風三步','ㄐㄑㄒ','ㄐㄑㄒ',16],['雙崖回響','ㄓㄔ','ㄓㄔ',16],['山口的聲音','ㄕㄖ','ㄓㄔㄕㄖ',16],['紙鳶領路','ㄗㄘㄙ','ㄗㄘㄙ',18],['聲母齊聚','','ㄅㄆㄇㄈㄉㄊㄋㄌㄍㄎㄏㄐㄑㄒㄓㄔㄕㄖㄗㄘㄙ',20],
 ['第一座音鈴','ㄧ','ㄧ',8],['第二座音鈴','ㄨ','ㄨ',8],['第三座音鈴','ㄩ','ㄩ',8],['三鈴過橋','','ㄧㄨㄩ',16],
 ['街角四盞燈','ㄚㄛㄜㄝ','ㄚㄛㄜㄝ',16],['長街的光','ㄞㄟㄠㄡ','ㄞㄟㄠㄡ',16],['城心的音印','ㄢㄣㄤㄥ','ㄢㄣㄤㄥ',16],['最後一盞燈','ㄦ','ㄦ',8],['韻母重明','','ㄚㄛㄜㄝㄞㄟㄠㄡㄢㄣㄤㄥㄦ',20],
 ['聲調的起伏','ˊˇ','ˊˇ',12],['輕重之間','ˋ˙','ˋ˙',12],['平穩的一聲',' ',' ',8],['把音連成招','','',6],
 ['門主的音盾','','',6],['音訣攻守','','',4],['點亮音心碑','','',6]
];
const words=['ㄅㄚ ','ㄇㄚ ','ㄋㄧˇ','ㄏㄠˇ','ㄒㄧㄠˇ','ㄩˇ','ㄊㄧㄢ ','ㄍㄨㄤ ','ㄓㄨˊ','ㄌㄨˋ'];
let learned=[];
export const BOPOMOFO_CURRICULUM={
 chapters:CURRICULUM.chapters.map((c,i)=>({...c,title:chapters[i][0]})),
 nodes:CURRICULUM.nodes.map((n,i)=>{
  const [title,fresh,pool,target]=lessons[i];learned=[...new Set([...learned,...fresh])];
  return {...n,route:'zh-bpmf',title,newKeys:Array.from(fresh),allowedKeys:Array.from(pool||learned.join('')),learnedKeysAfter:[...learned],returnHomeEveryCorrect:0,mechanic:i===25?'word_sequence':i===26?'guard_intro':i===27?'word_guard':i===28?'story_finale':'static_key',completion:i>=26?{wordGroups:i===26?0:i===27?4:6,correctGuards:i===26?6:4}:{unit:i===25?'completedWordGroups':'correctKeypresses',target},sampleWords:words,guardKeys:['ㄑ','ㄨ']};
 })
};
export const BOPOMOFO_CHAPTER_COPY=Object.fromEntries(chapters.map(([title,place,intro],i)=>['C0'+(i+1),{place,intro,close:'音印回到了原位，你的手指也更認得這段路了。'}]));
export function bopomofoMissionFor(node){
 const symbols=node.newKeys.join('、')||node.allowedKeys.slice(0,6).join('、');
 const brief=node.id==='S06-04'?'散落的音印要依序接起來，才能留下完整音節。讓劍侍看見你穩穩連招的功夫。':node.chapterId==='C07'?'門主把音訣分成攻與守。看見注音時依序出招，看見防禦時先穩住腳步。':node.id==='S06-03'?'一聲沒有另外的符號，這回用長長的空白鍵完成它。讓平穩的音也回到碑文裡。':`這段路上的音印還暗著。找到${symbols}的位置，一次按對一個，讓${BOPOMOFO_CHAPTER_COPY[node.chapterId].place}重新聽見聲音。`;
 return {title:node.title,brief,outcome:node.id==='S07-03'?'音訣連成一道光，鍵心碑再次亮起！這是你一步一步認識注音鍵的功夫。':`「${node.title}」的音印亮了！${BOPOMOFO_CHAPTER_COPY[node.chapterId].place}傳來回聲，你和小禾又往前走了一步。`};
}
export function bopomofoOpening(node){
 const q=bopomofoMissionFor(node),symbols=node.newKeys.join('、')||node.allowedKeys.slice(0,6).join('、');
 const tip=node.id==='S06-04'?'照亮起的位置依序按，聲調也算一個鍵；一聲用空白鍵。':node.chapterId==='C07'?'看到「防禦 ㄑ」或「防禦 ㄨ」，就按鍵盤上對應的注音。':node.id==='S06-03'?'看到「空白」，用拇指按長長的空白鍵。':'看準鍵盤上的 '+symbols+'，輕輕按一次。';
 return [{speaker:'MASTER',expression:'calm',text:q.brief},{speaker:'MASTER',expression:'encouraging',text:tip},{speaker:'PEER',expression:'happy',text:'不用選字，也不用切換輸入法。目標會等你，看準再出招。'}];
}
export function bopomofoClosing(node,result){return [{speaker:'PEER',expression:'happy',text:bopomofoMissionFor(node).outcome},{speaker:'MASTER',expression:'encouraging',text:node.rewardOutfitId?'這套新衣，記著你找回音印的功夫。去試穿吧。':result.correct===result.attempted?'每一個音印都看得很準。準備好，再往前走。':'完成這一回，就是往前一步。下個音印也慢慢來。'}];}