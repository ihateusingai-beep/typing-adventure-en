import {ORDINARY_HEROINES} from './ordinary-heroines.mjs';
import {RIFT_OUTFITS} from './rift.mjs';
import {LIMITED_COSTUMES} from './limited-costumes.mjs';
// Presentation-only outfit identities. Save IDs, score and damage never depend on this table.
export const SIGNATURES={
  "O00": {
    "id": "O00",
    "name": "一線破風",
    "family": "draw",
    "motion": "thrust",
    "description": "收劍、拔斬，以練習劍穩穩向前出招。",
    "fx": {
      "src": "assets/v3/signatures/O00-fx.webp",
      "columns": 4,
      "rows": 1,
      "count": 4,
      "inkBounds": [
        40,
        128,
        344,
        294
      ],
      "cellSize": 384
    },
    "icon": "assets/v3/signatures/O00-icon.webp",
    "castSockets": [
      [
        400,
        480
      ],
      [
        400,
        465
      ],
      [
        445,
        475
      ],
      [
        515,
        455
      ],
      [
        450,
        490
      ],
      [
        400,
        480
      ]
    ]
  },
  "O01": {
    "id": "O01",
    "name": "竹影穿林",
    "family": "cross",
    "motion": "dash",
    "description": "交步快斬，竹葉沿著雙重劍弧飛出。",
    "fx": {
      "src": "assets/v3/signatures/O01-fx.webp",
      "columns": 4,
      "rows": 1,
      "count": 4,
      "inkBounds": [
        40,
        73,
        344,
        282
      ],
      "cellSize": 384
    },
    "icon": "assets/v3/signatures/O01-icon.webp",
    "castSockets": [
      [
        400,
        480
      ],
      [
        270,
        365
      ],
      [
        485,
        520
      ],
      [
        455,
        460
      ],
      [
        510,
        440
      ],
      [
        400,
        480
      ]
    ]
  },
  "O02": {
    "id": "O02",
    "name": "踏雲迴刃",
    "family": "leap",
    "motion": "leap",
    "description": "騰身迴刃，兩道雲翼隨劍展開。",
    "fx": {
      "src": "assets/v3/signatures/O02-fx.webp",
      "columns": 4,
      "rows": 1,
      "count": 4,
      "inkBounds": [
        40,
        49,
        344,
        280
      ],
      "cellSize": 384
    },
    "icon": "assets/v3/signatures/O02-icon.webp",
    "castSockets": [
      [
        400,
        480
      ],
      [
        275,
        390
      ],
      [
        300,
        280
      ],
      [
        515,
        445
      ],
      [
        500,
        480
      ],
      [
        400,
        480
      ]
    ]
  },
  "O03": {
    "id": "O03",
    "name": "玄霜斷岳",
    "family": "heavy",
    "motion": "heavy",
    "description": "雙手重劈，冰晶沿刃向前綻開。",
    "fx": {
      "src": "assets/v3/signatures/O03-fx.webp",
      "columns": 4,
      "rows": 1,
      "count": 4,
      "inkBounds": [
        40,
        41,
        344,
        269
      ],
      "cellSize": 384
    },
    "icon": "assets/v3/signatures/O03-icon.webp",
    "castSockets": [
      [
        400,
        480
      ],
      [
        375,
        370
      ],
      [
        355,
        305
      ],
      [
        290,
        250
      ],
      [
        490,
        545
      ],
      [
        400,
        480
      ]
    ]
  },
  "O04": {
    "id": "O04",
    "name": "天衡鎮印",
    "family": "seal",
    "motion": "heavy",
    "description": "站穩壓印，層層金印向前鎮下。",
    "fx": {
      "src": "assets/v3/signatures/O04-fx.webp",
      "columns": 4,
      "rows": 1,
      "count": 4,
      "inkBounds": [
        51,
        80,
        332,
        317
      ],
      "cellSize": 384
    },
    "icon": "assets/v3/signatures/O04-icon.webp",
    "castSockets": [
      [
        400,
        480
      ],
      [
        420,
        410
      ],
      [
        420,
        350
      ],
      [
        365,
        435
      ],
      [
        435,
        515
      ],
      [
        400,
        480
      ]
    ]
  },
  "O05": {
    "id": "O05",
    "name": "火羽燎原",
    "family": "spin",
    "motion": "spin",
    "description": "轉身掃斬，火羽化成鳳翼。",
    "fx": {
      "src": "assets/v3/signatures/O05-fx.webp",
      "columns": 4,
      "rows": 1,
      "count": 4,
      "inkBounds": [
        41,
        71,
        331,
        305
      ],
      "cellSize": 384
    },
    "icon": "assets/v3/signatures/O05-icon.webp",
    "castSockets": [
      [
        400,
        480
      ],
      [
        235,
        400
      ],
      [
        500,
        555
      ],
      [
        465,
        415
      ],
      [
        450,
        340
      ],
      [
        400,
        480
      ]
    ]
  },
  "O06": {
    "id": "O06",
    "name": "月輪迴雪",
    "family": "spin",
    "motion": "spin",
    "description": "單腳迴旋，銀色月輪環劍而出。",
    "fx": {
      "src": "assets/v3/signatures/O06-fx.webp",
      "columns": 4,
      "rows": 1,
      "count": 4,
      "inkBounds": [
        43,
        63,
        324,
        293
      ],
      "cellSize": 384
    },
    "icon": "assets/v3/signatures/O06-icon.webp",
    "castSockets": [
      [
        400,
        480
      ],
      [
        260,
        410
      ],
      [
        290,
        295
      ],
      [
        340,
        280
      ],
      [
        485,
        480
      ],
      [
        400,
        480
      ]
    ]
  },
  "O07": {
    "id": "O07",
    "name": "星河雙斷",
    "family": "cross",
    "motion": "dash",
    "description": "反手連斬，星刃交成十字。",
    "fx": {
      "src": "assets/v3/signatures/O07-fx.webp",
      "columns": 4,
      "rows": 1,
      "count": 4,
      "inkBounds": [
        41,
        60,
        342,
        284
      ],
      "cellSize": 384
    },
    "icon": "assets/v3/signatures/O07-icon.webp",
    "castSockets": [
      [
        400,
        480
      ],
      [
        330,
        435
      ],
      [
        475,
        315
      ],
      [
        440,
        465
      ],
      [
        495,
        540
      ],
      [
        400,
        480
      ]
    ]
  },
  "O08": {
    "id": "O08",
    "name": "天符敕令",
    "family": "seal",
    "motion": "cast",
    "description": "雙指結訣，三枚天符聚成陣。",
    "fx": {
      "src": "assets/v3/signatures/O08-fx.webp",
      "columns": 4,
      "rows": 1,
      "count": 4,
      "inkBounds": [
        62,
        81,
        330,
        322
      ],
      "cellSize": 384
    },
    "icon": "assets/v3/signatures/O08-icon.webp",
    "castSockets": [
      [
        400,
        480
      ],
      [
        330,
        390
      ],
      [
        390,
        345
      ],
      [
        455,
        365
      ],
      [
        445,
        405
      ],
      [
        400,
        480
      ]
    ]
  },
  "O09": {
    "id": "O09",
    "name": "幽蓮劍舞",
    "family": "dance",
    "motion": "spin",
    "description": "交步劍舞，蓮瓣順著劍勢綻放。",
    "fx": {
      "src": "assets/v3/signatures/O09-fx.webp",
      "columns": 4,
      "rows": 1,
      "count": 4,
      "inkBounds": [
        40,
        59,
        343,
        323
      ],
      "cellSize": 384
    },
    "icon": "assets/v3/signatures/O09-icon.webp",
    "castSockets": [
      [
        400,
        480
      ],
      [
        420,
        420
      ],
      [
        475,
        305
      ],
      [
        450,
        345
      ],
      [
        485,
        475
      ],
      [
        400,
        480
      ]
    ]
  },
  "O10": {
    "id": "O10",
    "name": "靈墨飛白",
    "family": "brush",
    "motion": "cast",
    "description": "橫筆飛白，水墨化作游龍。",
    "fx": {
      "src": "assets/v3/signatures/O10-fx.webp",
      "columns": 4,
      "rows": 1,
      "count": 4,
      "inkBounds": [
        40,
        57,
        343,
        292
      ],
      "cellSize": 384
    },
    "icon": "assets/v3/signatures/O10-icon.webp",
    "castSockets": [
      [
        400,
        480
      ],
      [
        430,
        460
      ],
      [
        445,
        320
      ],
      [
        450,
        365
      ],
      [
        500,
        415
      ],
      [
        400,
        480
      ]
    ]
  },
  "O11": {
    "id": "O11",
    "name": "青霄環陣",
    "family": "orbit",
    "motion": "orbit",
    "description": "御筆畫環，青玉陣刃環繞而出。",
    "fx": {
      "src": "assets/v3/signatures/O11-fx.webp",
      "columns": 4,
      "rows": 1,
      "count": 4,
      "inkBounds": [
        40,
        40,
        343,
        323
      ],
      "cellSize": 384
    },
    "icon": "assets/v3/signatures/O11-icon.webp",
    "castSockets": [
      [
        400,
        480
      ],
      [
        250,
        300
      ],
      [
        250,
        305
      ],
      [
        480,
        385
      ],
      [
        450,
        385
      ],
      [
        400,
        480
      ]
    ]
  },
  "O12": {
    "id": "O12",
    "name": "金闕曜日",
    "family": "seal",
    "motion": "cast",
    "description": "合掌結印，金色日輪向前展開。",
    "fx": {
      "src": "assets/v3/signatures/O12-fx.webp",
      "columns": 4,
      "rows": 1,
      "count": 4,
      "inkBounds": [
        47,
        81,
        337,
        326
      ],
      "cellSize": 384
    },
    "icon": "assets/v3/signatures/O12-icon.webp",
    "castSockets": [
      [
        400,
        480
      ],
      [
        425,
        390
      ],
      [
        375,
        385
      ],
      [
        335,
        430
      ],
      [
        465,
        405
      ],
      [
        400,
        480
      ]
    ]
  },
  "O13": {
    "id": "O13",
    "name": "紫宸驚雷",
    "family": "orbit",
    "motion": "orbit",
    "description": "引筆落雷，紫電雷珠接連閃現。",
    "fx": {
      "src": "assets/v3/signatures/O13-fx.webp",
      "columns": 4,
      "rows": 1,
      "count": 4,
      "inkBounds": [
        50,
        72,
        337,
        302
      ],
      "cellSize": 384
    },
    "icon": "assets/v3/signatures/O13-icon.webp",
    "castSockets": [
      [
        400,
        480
      ],
      [
        325,
        465
      ],
      [
        450,
        305
      ],
      [
        435,
        425
      ],
      [
        450,
        425
      ],
      [
        400,
        480
      ]
    ]
  },
  "O14": {
    "id": "O14",
    "name": "太虛流焰",
    "family": "leap",
    "motion": "leap",
    "description": "躍身挑筆，流焰與極光交織。",
    "fx": {
      "src": "assets/v3/signatures/O14-fx.webp",
      "columns": 4,
      "rows": 1,
      "count": 4,
      "inkBounds": [
        43,
        48,
        337,
        320
      ],
      "cellSize": 384
    },
    "icon": "assets/v3/signatures/O14-icon.webp",
    "castSockets": [
      [
        400,
        480
      ],
      [
        280,
        500
      ],
      [
        450,
        335
      ],
      [
        480,
        440
      ],
      [
        415,
        465
      ],
      [
        400,
        480
      ]
    ]
  },
  "O15": {
    "id": "O15",
    "name": "九霄御龍",
    "family": "dragon",
    "motion": "dragon",
    "description": "揮筆成圓，金龍隨掌勢出陣。",
    "fx": {
      "src": "assets/v3/signatures/O15-fx.webp",
      "columns": 4,
      "rows": 1,
      "count": 4,
      "inkBounds": [
        41,
        53,
        338,
        306
      ],
      "cellSize": 384
    },
    "icon": "assets/v3/signatures/O15-icon.webp",
    "castSockets": [
      [
        400,
        480
      ],
      [
        405,
        490
      ],
      [
        445,
        480
      ],
      [
        470,
        380
      ],
      [
        430,
        425
      ],
      [
        400,
        480
      ]
    ]
  }
};
const EFFECT_THEMES={bamboo:'O01',wind:'O02',frost:'O03',gold:'O04',ember:'O05',moon:'O06',star:'O07',lotus:'O09',thunder:'O13',aurora:'O14',solar:'O12',dust:'O00'};
const limitedSignatures=Object.fromEntries([...LIMITED_COSTUMES,...RIFT_OUTFITS,...ORDINARY_HEROINES].map(o=>[o.id,{...SIGNATURES[o.theme??EFFECT_THEMES[o.effect]],id:o.id,name:o.effectName,description:o.effectDescription,motion:o.motion}]));
export const signatureFor=id=>SIGNATURES[id]??limitedSignatures[id]??SIGNATURES.O00;
export const effectSignature=(effectId,outfitId='O00')=>signatureFor(effectId==='auto'||!effectId?outfitId:EFFECT_THEMES[effectId]??(limitedSignatures[effectId]?effectId:outfitId));
// The starter sword uses character motion only; earned loadouts retain their effects.
export const attackEffectEnabled=(hero,style=hero?.attackStyle??'sword')=>!!hero&&(hero.id!=='O00'||!['auto','dust',null,undefined].includes(hero.effectId)||style!=='sword');
export function signaturePose(base,motion,action,elapsed,duration,reduced=false){
 if(reduced||!['attack','cast','seal'].includes(action))return base;
 const t=Math.min(1,Math.max(0,elapsed/Math.max(1,duration))),wave=Math.sin(t*Math.PI);
 const [x,y,r]=({thrust:[8,0,0],dash:[18,-2,-1],heavy:[-8,3,1],leap:[12,-16,-2],spin:[-3,-3,4],cast:[-12,-3,0],orbit:[-10,-7,-1],dragon:[-4,-5,1]})[motion]??[0,0,0];
 return {...base,x:base.x+x*wave,y:base.y+y*wave,r:base.r+r*wave};
}