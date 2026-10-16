'use client';
import {useEffect,useState} from 'react';
import {courseProgress,courseTitles,STREAK_DAYS,type ScoreLite} from '@/lib/course-titles';
type Status={enabled:boolean;reason:string|null;plan:string|null;days:number|null;earnedTitle:string|null;state:'none'|'pending'|'granted'|'declined'|'revoked'};
const stateText:Record<Status['state'],string>={none:'',pending:'Your request is with the WhatsLearn team for review.',granted:'Granted: the membership is on your account.',declined:'The team reviewed this request and did not approve it.',revoked:'This reward was withdrawn by the team.'};
/** Progress toward each title, and the one-time membership reward request. The reward is decided on the server; this only shows state and sends the request. */
export default function RewardClaim({guest,done,scores}:{guest:boolean;done:string[];scores:ScoreLite[]}){
 const [s,setS]=useState<Status|null>(null),[msg,setMsg]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{if(guest)return;let live=true;fetch('/api/rewards').then(r=>r.ok?r.json():null).then(d=>{if(live&&d)setS(d as Status)}).catch(()=>{});return()=>{live=false}},[guest]);
 const have=new Set(done);const rows=courseTitles.map(t=>courseProgress(t.track,have,scores));
 async function claim(){setBusy(true);setMsg('');try{const r=await fetch('/api/rewards',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});const d=await r.json() as {state?:Status['state'];message?:string;error?:string};if(r.ok&&d.state)setS(old=>old&&{...old,state:d.state!});setMsg(d.message||d.error||'')}catch{setMsg('Could not reach the server. Please try again.')}finally{setBusy(false)}}
 return <div className="reward-progress"><p><strong>Your progress toward each title</strong></p><ul>{rows.map(p=><li key={p.track}>{courseTitles.find(t=>t.track===p.track)?.course}: {p.done} of {p.total} missions · {p.cluesUsed} clue{p.cluesUsed===1?'':'s'} used · longest run {p.bestStreak} of {STREAK_DAYS} days{p.name?` · earned: ${p.name}`:''}</li>)}</ul>
  <p>Points pay for clues. XP and streaks track practice. Membership is separate.</p>
  {!guest&&s?.enabled&&<p>Free membership reward ({s.plan}, {s.days} days): {s.state!=='none'?stateText[s.state]:s.earnedTitle?`you earned ${s.earnedTitle}. You can request it once.`:'unlocks with the 10-day no-clue title in one course. Each account can claim it once.'}{s.state==='none'&&s.earnedTitle&&<> <button className="outline" disabled={busy} onClick={claim}>{busy?'Sending…':'Request my reward'}</button></>}</p>}
  {msg&&<p role="status">{msg}</p>}</div>;
}
