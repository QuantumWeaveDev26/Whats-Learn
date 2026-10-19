import {cookies} from 'next/headers';
import {safeReturnTo} from '../return-to';
export const googleCookie=(secure:boolean)=>secure?'__Host-wl-google':'wl-google';
const options=(secure:boolean,maxAge=600)=>({httpOnly:true,secure,sameSite:'lax' as const,path:'/',maxAge});
const random=()=>{const bytes=crypto.getRandomValues(new Uint8Array(48));return btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')};
export async function beginGoogle(secure:boolean,next:string){
 const flow={verifier:random(),flow:random(),next:safeReturnTo(next),expires:Date.now()+600_000};
 (await cookies()).set(googleCookie(secure),JSON.stringify(flow),options(secure));
 const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(flow.verifier));
 const challenge=btoa(String.fromCharCode(...new Uint8Array(hash))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');return {...flow,challenge};
}
export async function readGoogle(secure:boolean){try{const s=JSON.parse((await cookies()).get(googleCookie(secure))?.value||'null');if(s&&typeof s.verifier==='string'&&/^[A-Za-z0-9_-]{64}$/.test(s.verifier)&&typeof s.flow==='string'&&/^[A-Za-z0-9_-]{64}$/.test(s.flow)&&typeof s.expires==='number'&&s.expires>Date.now())return {...s,next:safeReturnTo(s.next)};}catch{}return null;}
export async function clearGoogle(secure:boolean){(await cookies()).set(googleCookie(secure),'',options(secure,0));}
export const googleFailure=(code:string,next='/learn')=>new Response(null,{status:303,headers:{Location:'/signin?oauth_error='+encodeURIComponent(code)+'&return_to='+encodeURIComponent(safeReturnTo(next)),'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer'}});
