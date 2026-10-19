import {readGoogle,clearGoogle,googleFailure} from '@/lib/auth/google';
import {exchangeGoogleCode} from '@/lib/auth/gotrue';
import {setSessionCookies} from '@/lib/auth/session';
import {secureRequest} from '@/lib/auth/http';
import {afterSignIn} from '@/lib/learner-context-store';
import {ensureAccount} from '@/lib/points';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 const secure=secureRequest(request),url=new URL(request.url),flow=await readGoogle(secure);
 if(!flow||url.searchParams.get('flow')!==flow.flow)return googleFailure('expired');
 await clearGoogle(secure);
 if(url.searchParams.has('error'))return googleFailure('cancelled',flow.next);
 const code=url.searchParams.get('code')||'';if(!/^[A-Za-z0-9_-]{8,1000}$/.test(code))return googleFailure('expired',flow.next);
 const r=await exchangeGoogleCode(code,flow.verifier);if(!r.ok)return googleFailure(r.status>=500?'unavailable':'failed',flow.next);
 await setSessionCookies(r.data,secure);
 try{await ensureAccount(r.data.user.id)}catch{}
 let destination='/welcome?next='+encodeURIComponent(flow.next);try{destination=await afterSignIn(r.data.user.id,flow.next)}catch{}
 return new Response(null,{status:303,headers:{Location:destination,'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer'}});
}
