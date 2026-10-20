const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
const h=require('./helpers/harness.cjs'),drafts=h.load('lib/mission-drafts.ts');
test('an accepted old submission leaves a newer draft and editor intact',async()=>{
 const source=fs.readFileSync('app/learn/workspace.tsx','utf8'),a=source.indexOf('async function save(){'),b=source.indexOf('\nfunction exportWork',a);assert.ok(a>0&&b>a);
 const data=new Map();global.localStorage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};global.window={dispatchEvent(){}};global.CustomEvent=class{};
 let finish;const context={active:{id:'m1',answer:0},quiz:0,body:'Original practical artifact and test evidence, ready for review.',checks:[],guest:false,reflection:'',profile:{language:'en',level:'beginner'},draftScope:'account:a',latestSubmission:{current:''},currentAccountKey:{current:'a'},submissionVersion:v=>JSON.stringify(v),checkWriting:()=>({blocked:false}),answerText:(_m,b)=>b,setNotice:()=>{},setSaving:()=>{},cluePending:{current:Promise.resolve()},fetch:()=>new Promise(r=>finish=r),clearMissionDraft:drafts.clearMissionDraft,readMissionDraft:drafts.readMissionDraft,setAward:()=>{},setBurst:()=>{},load:async()=>{},mascotMoment:()=>{},setStep:()=>{},missionPractice:()=>({outcome:'Brief'})};
 const submitted={scope:context.draftScope,missionId:'m1',body:context.body,quiz:0,level:'beginner'};context.latestSubmission.current=JSON.stringify(submitted);
 let step=2;context.setStep=v=>step=v;
 const save=new Function(...Object.keys(context),ts.transpileModule(source.slice(a,b),{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText+'return save;')(...Object.values(context));
 const pending=save();await new Promise(r=>setImmediate(r));
 const newer='Newer practical artifact, changed while the old review was running.';drafts.saveMissionDraft('m1@beginner',newer,'account:a');context.latestSubmission.current=JSON.stringify({...submitted,body:newer});finish(Response.json({}));await pending;
 assert.equal(drafts.readMissionDraft('m1@beginner','account:a'),newer);assert.equal(step,2);
});
