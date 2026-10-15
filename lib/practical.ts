/**
 * Practical answers. A mission's "try it" task can ask for structured parts (choices, short text, longer text, code) and an optional link,
 * plus the learner's own reasoning in the existing answer box. Everything is saved as one readable text body so no database change is needed:
 *
 *   ### Field label
 *   value
 *
 * Code is only ever stored and shown as text. It is never run, compiled, opened or fetched, and links are stored as plain text and never fetched.
 */
export type FieldType='choice'|'short'|'long'|'code';
export type PracticalField={id:string;label:string;type:FieldType;options?:string[];hint?:string;starter?:string;anyOf?:string[]};
export type Practical={fields:PracticalField[];link?:{label:string;hint:string}};
export type Answer={fields:Record<string,string>;reasoning:string;link:string};
export const LIMITS={short:160,long:900,code:2500,reasoning:1500,link:300,total:9000,minReasoning:40} as const;
export const REASONING_LABEL='Your reasoning';
export const LINK_LABEL='Link';
export const emptyAnswer=():Answer=>({fields:{},reasoning:'',link:''});
const clean=(v:string)=>v.replace(/^(\s*)###/gm,'$1# ##').replace(/\r/g,'');
export function composeAnswer(p:Practical|undefined,a:Answer):string{
 if(!p)return a.reasoning;
 const parts=p.fields.map(f=>`### ${f.label}\n${clean(a.fields[f.id]||'')}`);
 parts.push(`### ${REASONING_LABEL}\n${clean(a.reasoning)}`);
 if(p.link&&a.link.trim())parts.push(`### ${LINK_LABEL}\n${a.link.trim()}`);
 return parts.join('\n\n');
}
export function parseAnswer(p:Practical|undefined,body:string):Answer{
 if(!p)return {fields:{},reasoning:body,link:''};
 const labels=[...p.fields.map(f=>f.label),REASONING_LABEL,LINK_LABEL];const found:Record<string,string[]>={};const order:string[]=[];
 let current='';for(const line of body.replace(/\r/g,'').split('\n')){
  const m=line.match(/^### (.*)$/);if(m&&labels.includes(m[1])&&!(m[1] in found)){current=m[1];found[current]=[];order.push(current);continue}
  if(current)found[current].push(line);
 }
 // Work saved before v36 is plain text with no section headings: it is read as the whole answer, in the reasoning box.
 if(!order.length)return {fields:{},reasoning:body,link:''};
 const value=(label:string)=>{const v=(found[label]||[]).join('\n');return order[order.length-1]!==label&&v.endsWith('\n')?v.slice(0,-1):v};
 const out=emptyAnswer();for(const f of p.fields)out.fields[f.id]=value(f.label);
 out.reasoning=value(REASONING_LABEL);out.link=value(LINK_LABEL).trim();return out;
}
export function validLink(value:string){
 const v=value.trim();if(!v)return true;if(v.length>LIMITS.link||/\s/.test(v))return false;
 try{const u=new URL(v);if(u.protocol!=='https:'||u.username||u.password)return false;const h=u.hostname.toLowerCase();if(!h.includes('.')||h==='localhost'||/^\d+\.\d+\.\d+\.\d+$/.test(h)||h.endsWith('.local')||h.endsWith('.internal'))return false;return true}catch{return false}
}
const codeLike=(v:string)=>(v.match(/[{}();=<>\[\]]|=>|\bfunction\b|\bdef\b|\breturn\b|\bSELECT\b|\bCREATE\b|\bif\b|\bgit\b/gi)||[]).length>=4;
const norm=(v:string)=>v.replace(/\s+/g,' ').trim().toLowerCase();
/** Checks the shape of an answer: every part filled, choices valid, sizes within limits, code looks like code and is not just the starter. */
export function checkAnswerShape(p:Practical|undefined,a:Answer):{ok:boolean;errors:string[]}{
 const errors:string[]=[];
 if(!p){if(a.reasoning.trim().length<LIMITS.minReasoning)errors.push('Write at least a few sentences.');return {ok:!errors.length,errors}}
 for(const f of p.fields){
  const v=(a.fields[f.id]||'').trim();
  if(!v){errors.push(`Fill in “${f.label}”.`);continue}
  if(f.type==='choice'&&!(f.options||[]).includes(v))errors.push(`Choose one of the options for “${f.label}”.`);
  if(f.type==='short'&&v.length>LIMITS.short)errors.push(`Keep “${f.label}” under ${LIMITS.short} characters.`);
  if(f.type==='long'&&v.length>LIMITS.long)errors.push(`Keep “${f.label}” under ${LIMITS.long} characters.`);
  if(f.type==='long'&&v.length<20)errors.push(`Add a little more to “${f.label}”.`);
  if(f.type==='code'){
   if(v.length>LIMITS.code)errors.push(`Keep “${f.label}” under ${LIMITS.code} characters.`);
   else if(v.length<30||!codeLike(v))errors.push(`“${f.label}” should be real code or commands, a few lines long.`);
   else if(f.starter&&norm(v)===norm(f.starter))errors.push(`Change the starter code in “${f.label}”: that is the version with the problem.`);
   else if(f.anyOf?.length&&!f.anyOf.some(t=>v.toLowerCase().includes(t.toLowerCase())))errors.push(`“${f.label}” does not seem to be about this task. It should use ideas such as: ${f.anyOf.slice(0,4).join(', ')}.`);
  }
 }
 if(a.reasoning.trim().length<LIMITS.minReasoning)errors.push(`Explain your choices in your own words (at least ${LIMITS.minReasoning} characters).`);
 if(a.reasoning.length>LIMITS.reasoning)errors.push(`Keep your reasoning under ${LIMITS.reasoning} characters.`);
 if(p.link&&!validLink(a.link))errors.push('The link must start with https:// and be a normal web address.');
 return {ok:!errors.length,errors};
}
/** The learner's own typed words, used for the relevance and writing checks. Choices and code are left out so they cannot be mistaken for terminal text. */
export function scoringText(p:Practical|undefined,body:string){
 if(!p)return {text:body,code:''};
 const a=parseAnswer(p,body);const text=[...p.fields.filter(f=>f.type==='short'||f.type==='long').map(f=>a.fields[f.id]||''),a.reasoning].filter(Boolean).join('\n');
 const code=p.fields.filter(f=>f.type==='code').map(f=>a.fields[f.id]||'').join('\n');return {text,code};
}
export function totalLength(body:string){return body.length}
/** Starting text for a new answer: only code fields with a starter (a flawed version to fix) begin filled in. */
export function startingBody(p:Practical|undefined){
 if(!p||!p.fields.some(f=>f.starter))return '';
 const a=emptyAnswer();for(const f of p.fields)if(f.starter)a.fields[f.id]=f.starter;return composeAnswer(p,a);
}
/** Saved structured answers shown or exported as plain readable text (section markers become “Label:” lines). */
export const readableBody=(body:string)=>body.replace(/^### (.*)$/gm,'$1:');
