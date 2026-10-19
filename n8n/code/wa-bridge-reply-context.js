// Read-only account facts come from a signed website response, never model memory.
const requests=$("Sign Request To WhatsLearn").all();
return $input.all().map((it,i)=>{
 const response=it.json||{},request=requests[i]?.json||{},snapshot=String(request.profileSnapshot||"");
 if(response.action==="none"||!/(?:^|\n)Course:/.test(snapshot))return {json:response,pairedItem:{item:i}};
 const kind=request.mentorIntent;
 if(kind==="journey"&&response.action==="reply")return {json:{...response,text:String(response.text||"")+"\n\nOpen your journey: https://whatslearn.in/learn"},pairedItem:{item:i}};
 if(kind==="keep-draft")return {json:{action:"reply",text:"Accepted chat answers are kept automatically. Take your time—we can pick up when you’re ready."},pairedItem:{item:i}};
 const deadEnd=response.action==="reply"&&/^I (?:couldn.t|could not) (?:finish|keep|reach).*(?:reply|mentor|clear)/i.test(String(response.text||""));
 if(!["question","preference","clarify","profile","learn"].includes(kind)&&!deadEnd)return {json:response,pairedItem:{item:i}};
 const nameMatch=snapshot.match(/^Hey\s+([^!\n]+)!/),name=(request.profileContext?.name||nameMatch?.[1]||"").replace(/[\r\n*_~`<>]/g," ").trim().slice(0,60);
 const language=snapshot.match(/(?:^|\n)Language:\s*([^·\n]+)/)?.[1]?.trim()||"en";
 const material={...(request.profileContext||{}),...(response.material||{})};
 // Old assessments must never masquerade as a current review or a fact about today's draft.
 if(material.learning)material.learning={...material.learning,feedback:null};
 delete material.draft;
 if(kind==="question"||kind==="preference"){delete material.currentTask;delete material.currentPrompt;delete material.learning;}
 if(kind!=="clarify")delete material.recentConversation;
 const question=String(request.learnerQuestion||"").replace(/^ASK\s+/i,"").slice(0,500);
 const detail=/how (?:to|do|can)|step.by.step|in detail|explain.*(?:build|create|make)/i.test(question);
 return {json:{action:"tutor",question,language,maxWords:kind==="preference"?25:detail?80:35,fallback:"I’m having trouble connecting. Your saved work is kept; try your question again in a moment.",material:{...material,name,mentorIntent:kind,verifiedProfile:kind==="preference"?"":snapshot,currentServerReply:deadEnd||["question","preference","clarify"].includes(kind)?"":String(response.text||"").slice(0,6000),snapshotAt:new Date().toISOString(),source:"Current signed replies from the learner’s own WhatsLearn account. Completed work and drafts are different. Do not infer missing preferences or claim any action beyond this server response."}},pairedItem:{item:i}};
});
