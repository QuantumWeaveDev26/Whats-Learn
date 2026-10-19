// Greeting is for a greeting message, not a prefix for every answer.
const priors=$("Build Tutor Request").all();
return $input.all().map((it,i)=>{
 const prior=priors[i]?.json||{},result=it.json||{};
 let text=String(result.output||result.text||"").trim();
 if(result.error||!text)text=String(prior.fallback||"I couldn’t connect just now. Please try again.");
 text=text.replace(/[ \t]+\n/g,"\n").replace(/(?:\s|^)\d+[.)]\s*$/u,'').trim();
 // Ordinal markers are not sentence endings. Give each complete step its own line.
 text=text.replace(/(?:^|\s)(\d+)\.\s+(?=\S)/gu,'\n$1) ').trim();
 const greeting=/^(?:hi|hey|hello|namaste|namaskara)(?:\s+mentor)?[!.\s]*$/i.test(String(prior.input||"").trim());
 const name=String(prior.material?.name||prior.material?.addressAs||"").replace(/[\r\n*_~`<>]/g," ").trim().slice(0,60);
 if(!greeting){
  const escaped=name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  if(escaped)text=text.replace(new RegExp('^(?:(?:hi|hey|hello|sure|okay|ok)[,!.\\s]+)?'+escaped+'[,!:.\\s]+(?:[👋✨⚡]+\\s*)?','iu'),'');
  text=text.replace(/^(?:hi|hey|hello)[!,.\s]+(?:👋\s*)?/iu,'');
 }
 // Keep complete sentences, never send a chopped "Want me to…" ending.
 const limit=Math.min(120,Math.max(20,Number(prior.maxWords)||35));
 if(text.split(/\s+/u).length>limit){
  const sentences=text.match(/[^.!?\n]+[.!?]+(?:\s|$)|[^\n]+(?:\n|$)/gu)||[text];
  let short='';
  for(const sentence of sentences){const next=(short+(short?'\n':'')+sentence.trim()).trim();if(short&&next.split(/\s+/u).length>limit)break;short=next;}
  text=short||text;
 }
 return {json:{reply:text.trim().slice(0,1500)},pairedItem:{item:i}};
});
