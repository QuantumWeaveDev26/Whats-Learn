import {isKanglish} from './ai-feedback';
import type {Mission} from './missions';
import type {PracticalField} from './practical';
import {LIMITS} from './practical';
import {looksLikeGibberish} from './text-signals';
import {keywords,tokens,meaningful,stem} from './writing-check';

/** Fast draft checks, not an AI assessment. Never spend a learner's AI allowance per chat part. */
export function chatPartIssue(m:Mission,text:string,field?:PracticalField):string|null{
 const value=text.trim();const isReason=!field;
 const max=isReason?LIMITS.reasoning:field.type==='short'?LIMITS.short:field.type==='code'?LIMITS.code:LIMITS.long;
 if(value.length>max)return `A little tighter: under ${max} characters.`;
 if(field?.type==='code'){
  if(value.length<30||(value.match(/[{}();=<>\[\]]|=>|\breturn\b|\bdef\b|\bgit\b/gi)||[]).length<4)return 'Send the actual code or commands—not a one-word reply.';
  if(field.starter&&value.replace(/\s/g,'')===field.starter.replace(/\s/g,''))return 'That’s the starter. Make your fix, then send your version.';
  if(field.anyOf?.length&&!field.anyOf.some(t=>value.toLowerCase().includes(t.toLowerCase())))return 'This code needs to solve the current task. Try that part again.';
  return null;
 }
 const words=tokens(value),nonLatin=(value.match(/\p{L}/gu)||[]).some(c=>!/\p{Script=Latin}/u.test(c));
 const minimum=isReason?5:field?.id==='story'?5:field?.type==='long'?4:2;
 if(value.length<(isReason?LIMITS.minReasoning:field?.type==='long'?20:8)||words.length<(nonLatin?Math.min(2,minimum):minimum)||looksLikeGibberish(value)||(words.length>=5&&new Set(words.map(w=>w.toLowerCase())).size/words.length<0.4)||/(.)\1{5,}/u.test(value))return 'That looks like a typo or a placeholder 👀 Send one real line for this part.';
 const keys=keywords(m).all;const fieldKeys=new Set(tokens((field?.label||'')+' '+(field?.hint||'')).filter(meaningful).map(stem));
 const hits=words.filter(meaningful).map(stem).some(w=>keys.has(w)||fieldKeys.has(w));
 const kanglish=isKanglish(value);
 if(!isReason&&!nonLatin&&!kanglish&&!hits)return 'This doesn’t connect to the task yet. Keep it about this situation.';
 return null;
}

export function shortFieldHint(m:Mission,f:PracticalField){
 if(f.prompt)return f.prompt+(f.hint?'\n'+f.hint:'');
 if(m.id==='d1')return ({story:'Who needs what—and why? One sentence.',inputs:'Which details do you need? Add a quick why for each.',accept:'Give 3 checks: success, bad input, and a taken slot.',failure:'The save failed. What should the parent see + do next?',private:'Which detail needs the most protection?'} as Record<string,string>)[f.id]||f.hint||'';
 const hint=f.hint||'Send your take in one clear message.';
 return hint.split(/(?<=[.!?])\s/)[0].slice(0,160);
}

export function shortFieldLabel(m:Mission,f:PracticalField){return f.prompt|| (m.id==='d1'?({story:'The parent’s goal',inputs:'Just the essentials',accept:'Prove it works',failure:'When things break',private:'Keep it private'} as Record<string,string>)[f.id]||f.label:f.label)}
