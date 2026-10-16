// Transaction/progression unit tests assume a successful reviewer boundary.
// Real provider, correctness and unavailable-review tests do not install this helper.
// Tests that explicitly configure an AI provider still exercise the real review path.
const Module=require('node:module'),path=require('node:path');
const original=Module._load;
Module._load=function(name,parent,main){
 const transactional=parent?.filename.endsWith(path.join('lib','mission-points.ts'));
 if(transactional&&name==='./ai-feedback'){
  const actual=original.call(this,name,parent,main);return {...actual,aiReady:()=>true};
 }
 if(transactional&&name==='./submission-review'){
  const actual=original.call(this,name,parent,main);
  return {...actual,reviewedSubmission:async(...args)=>{
   const ai=original.call(this,'./ai-feedback',parent,main);
   if(ai.aiReady())return actual.reviewedSubmission(...args);
   const {missions}=original.call(this,'./missions',parent,main),mission=missions.find(m=>m.id===args[1]);
   return {answerAssessment:{onTopic:true,correct:true,reason:'Successful reviewer boundary fixture.'},summary:'Reviewer approved this fixture.',strengths:[],checks:mission.checks.map(item=>({item,met:true,note:'Present in approved fixture.'})),practicalTest:{created:true,performed:true,reported:true,note:'Artifact and trial approved in this fixture.'},nextStep:'Keep improving.'};
  }};
 }
 return original.call(this,name,parent,main);
};
