'use client';
import {useState} from 'react';
import {ArrowRight,Check,CheckCircle2} from 'lucide-react';
import {planAllowance} from '@/lib/billing/allowances';
import type {MembershipTier} from './membership';

const detail:Record<string,string>={explore:'Start with the essentials',plus:'More practice, every day',pro:'Extra room to improve',teams:'A plan for your people'};
const price=(p:MembershipTier,cycle:string)=>p.id==='explore'?'Free':'₹'+(cycle==='annual'&&p.annual?p.annual:p.monthly).toLocaleString('en-IN');
const period=(p:MembershipTier,cycle:string)=>p.id==='explore'?'No payment needed':p.id==='teams'?'per learner / month':cycle==='annual'?'per year':'per month';

/** Page-only comparison. Selection opens a review; it never creates a payment or changes access. */
export default function MembershipPlanPicker({plans,cycle,onReview,signedIn}:{plans:MembershipTier[];cycle:string;onReview:(id:string)=>void;signedIn:boolean}){
 const [selected,setSelected]=useState('explore');
 const plan=plans.find(p=>p.id===selected)||plans[0];
 return <section className="plan-picker" aria-labelledby="plan-picker-title">
  <h2 id="plan-picker-title" className="sr-only">Compare learning plans</h2>
  <div className="plan-choice-grid" role="radiogroup" aria-label="Choose a learning plan">
   {plans.map(p=>{
    const active=p.id===plan.id,free=p.id==='explore',team=p.id==='teams';
    const reviews=planAllowance(free?null:team?'teams_monthly':p.id+'_'+cycle).dailyAi;
    return <label key={p.id} className={'plan-choice plan-choice-'+p.id+(active?' is-selected':'')}>
     <input className="plan-choice-input" type="radio" name="learning-plan" value={p.id} checked={active} onChange={()=>setSelected(p.id)} aria-label={`${p.name}, ${price(p,cycle)}${free?'':', '+period(p,cycle)}`}/>
     <span className="plan-choice-ribbon">{p.id==='plus'?'Balanced choice':active?'Your selection':'\u00a0'}</span>
     <span className="plan-choice-surface">
      <span className="plan-choice-title"><span><strong>{p.name}</strong><span>{detail[p.id]}</span></span><span className="plan-choice-check" aria-hidden="true">{active?<CheckCircle2 size={22}/>:<span/>}</span></span>
      <span className="plan-choice-facts">
       <span className="plan-choice-price"><span>{cycle==='annual'&&p.annual?'Annual price':free?'Get started':'Monthly price'}</span><strong>{price(p,cycle)}</strong><small>{period(p,cycle)}{team&&cycle==='annual'?' · billed monthly':''}</small></span>
       <span className="plan-choice-fact"><span>Course access</span><strong>{free?'First 3 tasks':'All 10 tasks'}</strong><small>in each of 4 courses</small></span>
       <span className="plan-choice-fact"><span>AI reviews / day</span><strong>{reviews}{team?' per learner':''}</strong>{free&&<small>after sign-in</small>}</span>
       <span className="plan-choice-fact"><span>Learners</span><strong>{team?'5 or more':'Just you'}</strong>{team&&<small>From ₹1,995 / month</small>}</span>
      </span>
     </span>
    </label>;
   })}
  </div>
  <div className="plan-shared-benefits" aria-label="Included with every plan"><span><Check size={16}/>Personalised learning path</span><span><Check size={16}/>Saved creations</span><span><Check size={16}/>Unlimited mentor questions</span></div>
  <div className="plan-next-step">
   <div className="plan-selection-summary" aria-live="polite" aria-atomic="true"><span>Your choice</span><strong>{plan.name} <span>·</span> {price(plan,cycle)}{plan.id!=='explore'&&<small> {period(plan,cycle)}</small>}</strong></div>
   {plan.id==='explore'?<a className="primary plan-next-action" href={signedIn?'/learn':'/#start'}>{signedIn?'Continue learning':'Start free'} <ArrowRight size={19}/></a>:<button type="button" className="primary plan-next-action" onClick={()=>onReview(plan.id)}>{plan.id==='teams'?'Review Teams details':'Review '+plan.name+' plan'} <ArrowRight size={19}/></button>}
   <p>{plan.id==='explore'?'No card required. Sign in to save your work.':plan.id==='teams'?'Our team arranges individual learner seats. No charge when you select a plan.':'Review the price and renewal terms before any payment.'}</p>
  </div>
 </section>;
}
