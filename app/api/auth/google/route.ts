import {emailAuthConfigured,providerUrl,siteOrigin} from '@/lib/auth/config';
import {googleEnabled} from '@/lib/auth/gotrue';
import {beginGoogle,googleFailure} from '@/lib/auth/google';
import {secureRequest,limited} from '@/lib/auth/http';
import {sameOrigin} from '@/lib/storage';
import {safeReturnTo} from '@/lib/return-to';
export const dynamic='force-dynamic';
export async function POST(request:Request){
 if(!sameOrigin(request))return Response.json({error:'Invalid request origin.'},{status:403});
 if(!emailAuthConfigured())return googleFailure('not_enabled');
 if(Number(request.headers.get('content-length')||0)>4000)return Response.json({error:'Request too large.'},{status:413});
 let next='/learn';try{const form=await request.formData();next=safeReturnTo(String(form.get('return_to')||''));}catch{return googleFailure('failed');}
 const origin=siteOrigin(request);if(!origin)return googleFailure('unavailable',next);
 // The verifier cookie and callback must use the same host.
 if(new URL(request.url).origin!==origin)return new Response(null,{status:303,headers:{Location:origin+'/signin?return_to='+encodeURIComponent(next),'Cache-Control':'private, no-store'}});
 const stop=await limited(request,'google',null,20,0,900);if(stop)return googleFailure('unavailable',next);
 const enabled=await googleEnabled();if(!enabled.ok)return googleFailure('unavailable',next);if(!enabled.data)return googleFailure('not_enabled',next);
 const flow=await beginGoogle(secureRequest(request),next),callback=new URL('/auth/google/callback',origin);callback.searchParams.set('flow',flow.flow);
 const target=new URL('/auth/v1/authorize',providerUrl()!);target.searchParams.set('provider','google');target.searchParams.set('redirect_to',callback.href);target.searchParams.set('code_challenge',flow.challenge);target.searchParams.set('code_challenge_method','s256');target.searchParams.set('prompt','select_account');
 return new Response(null,{status:303,headers:{Location:target.href,'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer'}});
}
