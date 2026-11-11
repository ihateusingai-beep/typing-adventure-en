// Original AI-drawn game art. Decorative images always accompany a text label.
export const ICON_IDS=['home','journey','challenges','wardrobe','boss','target','combo','score','clock','next','sound','gem','rank','spell','talisman','shield','settings','pause','gift','star'];
export const DETAIL_ICON_IDS=['back','retry','help','keyboard','cloud','local','user','lock','check','fullscreen','upload','download','run','jump','exit','close'];
const base=new Set(ICON_IDS),details=new Set(DETAIL_ICON_IDS);
export function iconHTML(id){return base.has(id)||details.has(id)?`<img class="game-icon ai-icon" data-icon="${id}" src="assets/v3/ui/${details.has(id)?'details':'icons'}/${id}.webp" width="32" height="32" alt="" aria-hidden="true" draggable="false" decoding="async">`:'';}