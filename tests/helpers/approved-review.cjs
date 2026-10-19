// Transaction/progression unit tests assume a successful reviewer boundary.
// Real provider, correctness and unavailable-review tests do not install this helper.
// Tests that explicitly configure an AI provider still exercise the real review path.
const Module=require('node:module'),path=require('node:path');
const original=Module._load;
Module._load=function(name,parent,main){
 const transactional=parent?.filename.endsWith(path.join('lib','mission-points.ts'));
 const chat=parent?.filename.endsWith(path.join('lib','bridge','whatsapp-chat.ts'));
 if(chat&&name==='../ai-feedback'){
  const actual=original.call(this,name,parent,main);
  return {...actual,aiReady:()=>true,interpretMentorMessage:async(...args)=>actual.aiReady()?actual.interpretMentorMessage(...args):{kind:/\?|^(what|why|how|when|where|who|which|can|could|should|is|are|do|does|explain|help|tell)\b/i.test(args[0])?'question':'answer'},reviewChatPart:async(...args)=>actual.aiReady()?actual.reviewChatPart(...args):{accepted:true,feedback:'Draft noted — '+String(args[2]).slice(0,45),followUp:''}};
 }
 if(chat&&name==='../auth/limits'){
  const actual=original.call(this,name,parent,main),ai=original.call(this,'../ai-feedback',parent,main);
  return {...actual,allow:async(...args)=>ai.aiReady()?actual.allow(...args):true};
 }

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
