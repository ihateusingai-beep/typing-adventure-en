// The final wardrobe set is available in the dedicated collector pool.
export const LIMITED_COSTUMES=[
 {id:'O16',name:'玉狐遊俠',title:'限定 · 玉狐',description:'朱紋白瓷狐面藏起眉眼，留一道俐落的尖下巴。墨玉袖與赤色腰帶隨彎刃疾行。',effect:'lotus',effectName:'玉狐旋刃',effectDescription:'壓低身形，讓彎刃掠過對手。',theme:'O09',motion:'dash'},
 {id:'O17',name:'白鶴雲仙',title:'限定 · 白鶴',description:'柔和的長臉、銀髮與白色仙袍，袖口繡有冰藍鶴羽，出劍如畫下一筆長雲。',effect:'moon',effectName:'鶴引流雲',effectDescription:'銀劍沿高處劃出一道白鶴般的長弧。',theme:'O06',motion:'spin'},
 {id:'O18',name:'赤松翁',title:'限定 · 赤松',description:'方臉濃眉，留一撮灰白長鬍與彎鬚。松綠袍下藏木劍，腰間還有一只銅葫蘆。',effect:'bamboo',effectName:'老松定勢',effectDescription:'站穩下盤，以沉著的一擊回敬。',theme:'O01',motion:'heavy'},
 {id:'O19',name:'墨夜影客',title:'限定 · 墨夜',description:'深黑兜帽與鴉羽斗篷，只露出一雙狹長眼睛。雙短刃一出，衣角才追上步伐。',effect:'thunder',effectName:'鴉影雙刃',effectDescription:'伏低身形，以雙刃快速切入。',theme:'O13',motion:'thrust'},
 {id:'O20',name:'曜陽天將',title:'限定 · 曜陽',description:'稜角分明的銅色臉龐，額間一枚金色菱印。朱金甲與短纓長槍在日光下格外鮮明。',effect:'solar',effectName:'曜陽挑槍',effectDescription:'提槍向前斜挑，帶出一線日芒。',theme:'O12',motion:'leap'}
].map(o=>({...o,item:'outfit-'+o.id,category:'limited'}));