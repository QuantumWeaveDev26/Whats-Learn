export type ReminderSchedule={enabled:boolean;hour:number;frequency:string;quietStart:number;quietEnd:number;blockedSlots?:string[]};
const quiet=(h:number,a:number,b:number)=>a===b?false:a<b?h>=a&&h<b:h>=a||h<b;
/** The n8n scheduler attempts every two minutes, within a two-hour slot. */
export function nextReminderSlot(s:ReminderSchedule,at=new Date()):{at:string|null;reason:string;timeZone:'Asia/Kolkata'}{
 const none=(reason:string)=>({at:null,reason,timeZone:'Asia/Kolkata' as const});if(!s.enabled)return none('Reminders are paused.');if(!Number.isInteger(s.hour)||s.hour<0||s.hour>23||!['daily','weekdays','weekly'].includes(s.frequency))return none('Choose a valid reminder schedule.');
 const shifted=new Date(at.getTime()+330*60000),day=Date.UTC(shifted.getUTCFullYear(),shifted.getUTCMonth(),shifted.getUTCDate());
 for(let i=0;i<15;i++){const d=new Date(day+i*864e5),weekday=d.getUTCDay(),slot=d.toISOString().slice(0,10);if(s.blockedSlots?.includes(slot)||s.frequency==='weekdays'&&(weekday===0||weekday===6)||s.frequency==='weekly'&&weekday!==1)continue;
  for(let h=s.hour;h<Math.min(24,s.hour+2);h++){if(quiet(h,s.quietStart,s.quietEnd))continue;for(let minute=0;minute<60;minute+=2){const candidate=new Date(d.getTime()+h*36e5+minute*60000-330*60000);if(candidate<at)continue;return {at:candidate.toISOString(),reason:'Next eligible attempt; delivery depends on WhatsApp.',timeZone:'Asia/Kolkata'}}}
 }return none('Your reminder window falls inside quiet hours. Choose another time.');
}
