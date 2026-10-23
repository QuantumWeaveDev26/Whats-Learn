const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
const source=fs.readFileSync('components/whatslearn/practice-coach.tsx','utf8');
function fixture(aiRequest){const seen={answers:[],errors:[],usage:[],busy:[]},context={latestQuestionView:{current:'m1|en|account-a'},question:'Explain this concept',mission:{id:'m1'},body:'',language:'en',ai:{},aiRequest,setBusy:v=>seen.busy.push(v),setError:v=>seen.errors.push(v),setAnswer:v=>seen.answers.push(v),setReplyId:()=>{},setAi:v=>seen.usage.push(v)};const a=source.indexOf('async function ask()',source.indexOf('export default function PracticeCoach')),b=source.indexOf('return <div',a);const ask=new Function(...Object.keys(context),ts.transpileModule(source.slice(a,b),{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText+'return ask;')(...Object.values(context));return {context,seen,ask}}
test('a delayed reply from a former mission or account is not rendered in the current view',async()=>{
 for(const next of ['d1|en|account-a','m1|en|account-b']){let resolve;const f=fixture(()=>new Promise(r=>resolve=r));const pending=f.ask();f.context.latestQuestionView.current=next;resolve({answer:'Old answer',limit:3,used:1});await pending;assert.deepEqual(f.seen.answers,['']);assert.deepEqual(f.seen.usage,[]);assert.deepEqual(f.seen.busy,[true])}
});
test('a current-view reply renders normally but an old-view error stays hidden',async()=>{
 const current=fixture(async()=>({answer:'Current explanation',limit:3,used:0}));await current.ask();assert.deepEqual(current.seen.answers,['','Current explanation']);assert.equal(current.seen.busy.at(-1),false);
 let reject;const old=fixture(()=>new Promise((_,r)=>reject=r));const pending=old.ask();old.context.latestQuestionView.current='other';reject(Error('Old failure'));await pending;assert.deepEqual(old.seen.errors,['']);
});
test('opening a different mission, language or account clears old question and reply state',()=>{
 assert.match(source,/view=mission.id\+'\|'\+language\+'\|'\+accountKey/);assert.match(source,/useEffect\(\(\)=>\{setAction\(null\);setQuestion\(''\);setAnswer\(''\);setReplyId\(undefined\);setError\(''\);setBusy\(false\)\},\[view\]\)/);
});
