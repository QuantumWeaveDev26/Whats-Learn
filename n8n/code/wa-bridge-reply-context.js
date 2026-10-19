// Read-only account facts come from a signed website response, never model memory.
const requests=$("Sign Request To WhatsLearn").all();
return $input.all().map((it,i)=>{
 const response=it.json||{},request=requests[i]?.json||{},snapshot=String(request.profileSnapshot||"");
 if(response.action==="none"||!/(?:^|\n)Course:/.test(snapshot))return {json:response,pairedItem:{item:i}};
 const kind=request.mentorIntent;
 if(kind==="keep-draft")return {json:{action:"reply",text:"Accepted chat answers are kept automatically. Take your time—we can pick up when you’re ready."},pairedItem:{item:i}};
 const deadEnd=response.action==="reply"&&/^I (?:couldn.t|could not) (?:finish|keep|reach).*(?:reply|mentor|clear)/i.test(String(response.text||""));
 if(!["question","clarify","profile","progress"].includes(kind)&&!deadEnd)return {json:response,pairedItem:{item:i}};
 const nameMatch=snapshot.match(/^Hey\s+([^!\n]+)!/),name=(request.profileContext?.name||nameMatch?.[1]||"").replace(/[\r\n*_~`<>]/g," ").trim().slice(0,60);
 const language=snapshot.match(/(?:^|\n)Language:\s*([^·\n]+)/)?.[1]?.trim()||"en";
 return {json:{action:"tutor",question:String(request.learnerQuestion||"").replace(/^ASK\s+/i,"").slice(0,500),language,maxWords:60,fallback:"I’m having trouble connecting. Your saved work is kept; try your question again in a moment.",material:{...(request.profileContext||{}),...(response.material||{}),addressAs:name,name,verifiedProfile:snapshot,currentServerReply:deadEnd?"":String(response.text||"").slice(0,6000),snapshotAt:new Date().toISOString(),source:"Current signed replies from the learner’s own WhatsLearn account. Completed work and drafts are different. Do not infer missing preferences or claim any action beyond this server response."}},pairedItem:{item:i}};
});
