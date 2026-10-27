'use client';
import {useState} from 'react';
import {ArrowRight,CheckCircle2} from 'lucide-react';
import {planAllowance} from '@/lib/billing/allowances';
import type {MembershipTier} from './membership';
const price=(p:MembershipTier,cycle:string)=>p.id==='explore'?'Free':'₹'+(cycle==='annual'&&p.annual?p.annual:p.monthly).toLocaleString('en-IN');
const period=(p:MembershipTier,cycle:string)=>p.id==='explore'?'No card needed':p.id==='teams'?'per learner / month':cycle==='annual'?'per year':'per month';
const features=(p:MembershipTier,cycle:string)=>{
 const team=p.id==='teams',free=p.id==='explore';
 const reviews=planAllowance(free?null:team?'teams_monthly':p.id+'_'+cycle).dailyAi;
 return [{label:'Course tasks',value:free?'3 per course':'All 10 per course'},{label:'AI reviews / day',value:reviews+(team?' / learner':free?' after sign-in':'')},{label:'Learners',value:team?'5 or more':'1',note:team?'Min ₹1,995 / month':undefined}];
};
/** Selecting a plan only updates the comparison; payment still needs explicit review. */
export default function MembershipPlanPicker({plans,cycle,onReview,signedIn}:{plans:MembershipTier[];cycle:string;onReview:(id:string)=>void;signedIn:boolean}){
 const [selected,setSelected]=useState('explore');
 const plan=plans.find(p=>p.id===selected)||plans[0],selectedFeatures=features(plan,cycle);
 return <section className="plan-picker" aria-labelledby="plan-picker-title">
  <h2 id="plan-picker-title" className="sr-only">Compare learning plans</h2>
  <div className="plan-choice-grid" role="radiogroup" aria-label="Choose a learning plan">
   <span className="plan-comparison-label" aria-hidden="true">Compare plans</span>
   {plans.map(p=>{const active=p.id===plan.id,free=p.id==='explore';return <label key={p.id} className={'plan-choice plan-choice-'+p.id+(active?' is-selected':'')}>
    <input className="plan-choice-input" type="radio" name="learning-plan" value={p.id} checked={active} onChange={()=>setSelected(p.id)} aria-label={`${p.name}, ${price(p,cycle)}${free?'':', '+period(p,cycle)}`}/>
    <span className="plan-choice-surface"><span className="plan-choice-heading"><strong>{p.name}</strong><span className="plan-choice-check" aria-hidden="true">{active?<CheckCircle2 size={18}/>:<span/>}</span></span><span className="plan-choice-price">{price(p,cycle)}</span><span className="plan-choice-period">{period(p,cycle)}</span></span>
   </label>})}
  </div>
  <table className="plan-comparison-table" aria-label="Learning plan features"><colgroup><col className="plan-feature-column"/>{plans.map(p=><col key={p.id}/>)}</colgroup><thead><tr><th scope="col">Feature</th>{plans.map(p=><th key={p.id} scope="col">{p.name}</th>)}</tr></thead><tbody>{selectedFeatures.map((f,i)=><tr key={f.label}><th scope="row">{f.label}</th>{plans.map(p=>{const item=features(p,cycle)[i];return <td key={p.id} className={p.id===plan.id?'is-selected':''}>{item.value}{item.note&&<small>{item.note}</small>}</td>})}</tr>)}</tbody></table>
  <dl className="plan-mobile-features" aria-label={plan.name+' features'}>{selectedFeatures.map(f=><div key={f.label}><dt>{f.label}</dt><dd>{f.value}{f.note&&<small>{f.note}</small>}</dd></div>)}</dl>
  <p className="plan-shared-benefits">4 courses <span>·</span> Saved creations <span>·</span> Unlimited mentor questions</p>
  <div className="plan-next-step"><div className="plan-selection-summary" aria-live="polite" aria-atomic="true"><span>Selected plan</span><strong>{plan.name} · {price(plan,cycle)}{plan.id!=='explore'&&<small> {period(plan,cycle)}</small>}</strong></div>
   {plan.id==='explore'?<a className="primary plan-next-action" href={signedIn?'/learn':'/#start'}>{signedIn?'Continue learning':'Start free'} <ArrowRight size={17}/></a>:<button type="button" className="primary plan-next-action" onClick={()=>onReview(plan.id)}>{plan.id==='teams'?'Review Teams':'Review '+plan.name+' plan'} <ArrowRight size={17}/></button>}
  </div>
 </section>;
}
