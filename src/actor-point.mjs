// Locate the painted body, rather than assuming it fills its transparent carrier.
export function actorPoint(stage,actor){
 const source=actor?.el??actor??stage;
 const node=source.matches?.('.sprite-art')?source:source.querySelector?.('.sprite-art')??source;
 const outer=stage.getBoundingClientRect(),r=node.getBoundingClientRect();
 const x=Number(node.dataset?.artAnchorX??.5),y=Number(node.dataset?.artAnchorY??.55);
 return {x:r.left-outer.left+r.width*x,y:r.top-outer.top+r.height*y};
}

// Resolve a socket inside the transparent sprite carrier, including its current
// rotation and uniform art scale. A rotated bounding box is not a body measure.
export function actorGeometry(stage,actor,anchor){
 const source=actor?.el??actor??stage;
 const node=source.matches?.('.sprite-art')?source:source.querySelector?.('.sprite-art')??source;
 const outer=stage.getBoundingClientRect(),r=node.getBoundingClientRect(),view=node.ownerDocument?.defaultView;
 const x=anchor?.[0]??Number(node.dataset?.castAnchorX??.68),y=anchor?.[1]??Number(node.dataset?.castAnchorY??.7);
 if(!view?.DOMMatrix||!node.offsetWidth)return {x:r.left-outer.left+r.width*x,y:r.top-outer.top+r.height*y,body:r.height*.625};
 const css=view.getComputedStyle(node),m=new view.DOMMatrix(css.transform==='none'?undefined:css.transform),[ox,oy]=css.transformOrigin.split(' ').map(parseFloat),w=node.offsetWidth,h=node.offsetHeight;
 const point=(px,py)=>({x:m.a*(px-ox)+m.c*(py-oy)+m.e+ox,y:m.b*(px-ox)+m.d*(py-oy)+m.f+oy});
 const corners=[[0,0],[w,0],[0,h],[w,h]].map(p=>point(...p)),p=point(w*x,h*y);
 return {x:r.left-outer.left+p.x-Math.min(...corners.map(p=>p.x)),y:r.top-outer.top+p.y-Math.min(...corners.map(p=>p.y)),body:h*Math.hypot(m.c,m.d)*(actor?.item?.standingHeight??400)/640};
}
export const actorCastPoint=(stage,actor)=>actorGeometry(stage,actor);