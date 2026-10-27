'use client';
import {Check} from 'lucide-react';
import {planAllowance} from '@/lib/billing/allowances';
import type {MembershipTier} from './membership';
const price=(p:MembershipTier,cycle:string)=>p.id==='explore'?'Free':'₹'+(cycle==='annual'&&p.annual?p.annual:p.monthly).toLocaleString('en-IN');
const period=(p:MembershipTier,cycle:string)=>p.id==='explore'?'No payment needed':p.id==='teams'?'per learner / month':cycle==='annual'?'per year':'per month';
/** Reference-led plan columns. Actions open the existing review, never a payment directly. */
export default function MembershipPlanPicker({plans,cycle,onReview,signedIn}:{plans:MembershipTier[];cycle:string;onReview:(id:string)=>void;signedIn:boolean}){
 return <section className="plan-picker plan-picker-columns" aria-label="Compare learning plans">
  <div className="plan-column-grid">{plans.map(p=>{
   const free=p.id==='explore',team=p.id==='teams',reviews=planAllowance(free?null:team?'teams_monthly':p.id+'_'+cycle).dailyAi;
   const facts=[free?'First 3 tasks in each course':'All 10 tasks in each course',reviews+' AI reviews/day'+(free?' after sign-in':team?' per learner':''),team?'5+ learners · min ₹'+(p.monthly*5).toLocaleString('en-IN')+'/month':'For one learner'];
   return <article className={'plan-column plan-column-'+p.id} key={p.id} aria-labelledby={'plan-title-'+p.id}>
    <h2 id={'plan-title-'+p.id}>{p.name}</h2>
    <div className="plan-column-price"><strong>{price(p,cycle)}</strong><span>{period(p,cycle)}</span></div>
    <ul className="plan-column-features">{facts.map(f=><li key={f}><Check size={15} aria-hidden="true"/><span>{f}</span></li>)}</ul>
    {free?<a className="outline plan-column-action" href={signedIn?'/learn':'/#start'}>{signedIn?'Continue learning':'Start free'}</a>:<button className="primary plan-column-action" type="button" onClick={()=>onReview(p.id)}>{team?'Explore Teams':'Choose '+p.name}</button>}
   </article>;
  })}</div>
  <p className="plan-included">Every plan includes 4 courses, saved creations and unlimited mentor questions.</p>
 </section>;
}
