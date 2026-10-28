'use client';
import type {Feedback} from './learning-state';
export function FeedbackCard({review,label='AI feedback'}:{review:Feedback;label?:string}){
 return <section className="wla-card wla-review" aria-label={label}><p className="wla-kicker">{label}</p><p className="wla-read">{review.summary}</p>
  {review.strengths.length>0&&<><strong>What worked</strong><ul>{review.strengths.map((s,i)=><li key={i}>{s}</li>)}</ul></>}
  {review.checks.length>0&&<ul className="wla-checks">{review.checks.map((c,i)=><li key={i} className={c.met?'met':''}><strong>{c.met?'✓ ':'• '}{c.item}</strong><span>{c.note}</span></li>)}</ul>}
  {review.nextStep&&<p className="wla-read"><strong>Next step:</strong> {review.nextStep}</p>}
 </section>;
}
