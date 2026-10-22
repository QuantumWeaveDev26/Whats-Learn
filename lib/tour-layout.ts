type Box={left:number;top:number;right:number;bottom:number;width:number;height:number};
/** Leave a visible area for the target rather than centring it behind the tour card. */
export function tourLayout(target:Box,viewport:{width:number;height:number},measuredHeight:number){
 const {width,height}=viewport,margin=16,gap=20,cardWidth=Math.min(360,width-32),cardHeight=Math.min(measuredHeight,height-32);
 const leftSpace=target.left-margin,rightSpace=width-margin-target.right;
 const side=width>=700&&(leftSpace>=cardWidth+gap||rightSpace>=cardWidth+gap);
 const card={left:side?(leftSpace>=cardWidth+gap?margin:width-margin-cardWidth):margin,top:side?Math.max(margin,(height-cardHeight)/2):height-margin-cardHeight};
 const area={left:margin,right:width-margin,top:margin,bottom:side?height-margin:Math.max(margin,card.top-gap)};
 if(side){if(card.left===margin)area.left=card.left+cardWidth+gap;else area.right=card.left-gap;}
 const desiredTop=area.top+Math.max(0,(area.bottom-area.top-target.height)/2);
 const top=Math.max(area.top,target.top-6),bottom=Math.min(area.bottom,target.bottom+6),left=Math.max(area.left,target.left-6),right=Math.min(area.right,target.right+6);
 return {card,scrollDelta:target.top-desiredTop,spotlight:bottom>top&&right>left?{left,top,width:right-left,height:bottom-top}:null};
}
