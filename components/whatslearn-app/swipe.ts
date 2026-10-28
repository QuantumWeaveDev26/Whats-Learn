'use client';
import {useRef,useState,type PointerEvent,type MouseEvent,type KeyboardEvent} from 'react';

/** Touch/trackpad use native momentum scrolling. Mouse users can drag the same row. */
export function useCourseSwipe(){
 const drag=useRef<{id:number;x:number;y:number;left:number;active:boolean}|null>(null),suppressClick=useRef(false);
 const [dragging,setDragging]=useState(false);
 function finish(e:PointerEvent<HTMLDivElement>){if(drag.current?.id!==e.pointerId)return;drag.current=null;setDragging(false);if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId)}
 return {dragging,handlers:{
  onPointerDown(e:PointerEvent<HTMLDivElement>){suppressClick.current=false;if(e.pointerType!=='mouse'||e.button!==0)return;drag.current={id:e.pointerId,x:e.clientX,y:e.clientY,left:e.currentTarget.scrollLeft,active:false}},
  onPointerMove(e:PointerEvent<HTMLDivElement>){const d=drag.current;if(!d||d.id!==e.pointerId)return;const dx=e.clientX-d.x,dy=e.clientY-d.y;if(!d.active){if(Math.abs(dy)>Math.abs(dx)&&Math.abs(dy)>6){drag.current=null;return}if(Math.abs(dx)<6)return;d.active=true;suppressClick.current=true;setDragging(true);e.currentTarget.setPointerCapture(e.pointerId)}e.preventDefault();e.currentTarget.scrollLeft=d.left-dx},
  onPointerUp:finish,onPointerCancel:finish,
  onPointerLeave(e:PointerEvent<HTMLDivElement>){if(!drag.current?.active)drag.current=null},
  onLostPointerCapture(){drag.current=null;setDragging(false)},
  onClickCapture(e:MouseEvent<HTMLDivElement>){if(suppressClick.current&&e.detail!==0){e.preventDefault();e.stopPropagation();suppressClick.current=false}},
  onKeyDown(e:KeyboardEvent<HTMLDivElement>){if(e.target!==e.currentTarget||!['ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();e.currentTarget.scrollBy({left:(e.key==='ArrowRight'?1:-1)*e.currentTarget.clientWidth*.8,behavior:'smooth'})}
 }};
}
