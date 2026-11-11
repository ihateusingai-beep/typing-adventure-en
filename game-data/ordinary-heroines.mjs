// Common practice clothes with the same combat stats as the other outfits.
export const ORDINARY_HEROINES = [
 ['藍布女俠', '靛藍交領棉衫，配一把木練習劍。', 'dust'],
 ['青竹女弟子', '苔綠短衫與米色腰帶，袖口繡著竹紋。', 'bamboo'],
 ['雲路女行者', '淺藍布衣與帆布信袋，走山路時輕便。', 'wind'],
 ['霜路女護衛', '灰藍短斗篷與素白長袖，適合清晨趕路。', 'frost'],
 ['金棕女劍師', '赭棕棉衣與深色寬腰帶，頭繫素布巾。', 'gold'],
 ['赤羽女信使', '磚紅短披肩用銅扣繫住，裡面是米白布衣。', 'ember'],
 ['月白女劍客', '象牙白交領上衣，配藏藍腰帶與淡紫袖緣。', 'moon'],
 ['暮紫女遊俠', '暮紫麻布騎裝，腰間繫著一條酒紅布帶。', 'star'],
].map(([name, description, effect], index) => {
 const id = `O${30 + index}`;
 return {id, name, description, effect, item: `outfit-${id}`, category: 'ordinary-heroines',
  title: '江湖布衣', effectName: '布衣劍式', effectDescription: '平實的劍式，服裝不影響分數。', motion: 'thrust'};
});