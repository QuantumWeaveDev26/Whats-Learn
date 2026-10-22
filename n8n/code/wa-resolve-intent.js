// Interpret the model's bounded intent; only the website may execute account actions.

return $input.all().map((it,i)=>{
 const m=$("One Item Per Message").itemMatching(i).json,profile=$("Read Mentor Profile").itemMatching(i).json;
 let choice={};try{choice=JSON.parse(String(it.json.output||"").replace(/^```(?:json)?\s*|\s*```$/g,""))}catch{}
 const kinds=["question","preference","clarify","learn","continue","edit","task-question","save","keep-draft","draft","progress","points","journey","course","roadmap","profile","answer"];
 let kind=kinds.includes(choice.kind)?choice.kind:"question";
 const raw=String(m.text||"");
 const control=raw.trim().toLowerCase().replace(/\s+/g," ").replace(/[\s.!?,;:…]+$/u,"");
 if(["stop","unsubscribe","end","optout","opt out","pause","रुको","बंद","ನಿಲ್ಲಿಸಿ","support"].includes(control))return {json:{...m,bridgeText:raw,mentorIntent:"answer"},pairedItem:{item:i}};
 const natural=raw.trim().toLowerCase().replace(/[’‘]/g,"'").replace(/[?!.]+$/g,'');
 if(natural.length<160&&!/[{};\n]/.test(natural)&&(/^(?:(?:please )?(?:add|use|include|remove|fewer|less|more|no|keep).*(?:emojis?|casual|formal).*|i.*(?:learn|teach|talk|style).*gen.?z.*|(?:but )?(?:u|you(?:'re| are)?)? ?rushing|slow down|go slower|less formal|more casual|not too many(?: just (?:a )?few)?(?: is enough)?|just (?:a )?few(?: is enough)?)$/.test(natural)||/^(?:not too many just few|keep it short|shorter please|don't rush|do not rush)$/.test(natural)))kind="preference";
 if(/^(?:(?:i )?(?:need|want) to |(?:can you |please )?)edit(?: (?:my|the|this|that)(?: (?:task|draft|answer|part))?)?$/.test(natural))kind="edit";
 if(/^(?:tell|show|give)(?: me)? (?:the |my )?(?:qns?|questions?|current question|next question)$/.test(natural))kind="task-question";
 if(/^(?:can|could) i (?:do|complete) (?:the |my )?task here$/.test(natural))kind="task-question";
 // Safety backstops for account questions and completion permission; the model still handles paraphrases.
 if(/^(?:what(?:'s| is)|show(?: me)?|tell me|how many) (?:my |the )?(?:point|points|score|balance)(?: do i have)?$/.test(natural))kind="points";
 if(/^(?:where(?:'s| is)|show(?: me)?) (?:my |the )?journey(?: in whatslearn)?$/.test(natural))kind="journey";
 if(/^(?:i (?:want|wanna) (?:to )?learn|teach me(?: first)?|first explain(?: (?:me|the task))?)$/.test(natural))kind="learn";
 if(/^(?:ok(?:ay)? now )?(?:i (?:want to|wanna)|can i) finish (?:my |the )?(?:task|mission)(?: now)?$/.test(natural))kind="continue";
 // Existing explicit commands stay exact, including STOP and the account-link proof.
 if(/^(?:please |can you |could you )?(?:report|flag)\b/i.test(raw.trim())&&/\b(?:reply|answer|response)\b/i.test(raw)){return {json:{...m,bridgeText:'REPORT '+raw.slice(0,500),mentorIntent:'report',profileSnapshot:profile.action==='reply'?String(profile.text||'').slice(0,5000):'',profileContext:profile.context||{}},pairedItem:{item:i}};}
 const exact=/^(?:stop|start|unsubscribe|end|pause|optout|opt out|today|lesson|next|menu|drafts|performance|stats|roadmap(?: all)?|profile|info|plan|style|learn|course|hint(?: example)?|yes|save|submit|help|cancel|edit|check|points|score|balance|remind|reminders|रुको|बंद|ನಿಲ್ಲಿಸಿ)[.!]?$/i;
 const arguments=/^(?:link\s+[a-z0-9-]{6,12}|(?:ask|answer|practice)\s+.+|edit\s+\d+|style\s+(?:[1-4]|casual|game|story|facts)|course\s+(?:[1-4]|marketing|development|filmmaking|storytelling)|resume\s+[mdfv]\d+|check\s+[a-f1-6]\s+[a-f1-6]|remind\s+(?:on|off|quiet|\d).*)$/i;
 if(exact.test(raw.trim())||arguments.test(raw.trim()))kind="answer";
 const track=["marketing","development","filmmaking","storytelling"].includes(choice.track)?choice.track:"";
 const commands={question:"ASK "+raw,preference:"ASK "+raw,clarify:"ASK "+raw,learn:"ASK "+raw,continue:"TODAY",edit:"EDIT","task-question":"QUESTION",save:"SAVE","keep-draft":"PROFILE",draft:"DRAFT",progress:"PERFORMANCE",points:"POINTS",journey:"ROADMAP",course:"COURSE"+(track?" "+track:""),roadmap:"ROADMAP",profile:"ASK "+raw};
 return {json:{...m,bridgeText:commands[kind]||raw,mentorIntent:kind,profileSnapshot:profile.action==="reply"?String(profile.text||"").slice(0,5000):"",profileContext:profile.action==="reply"&&profile.context&&typeof profile.context==="object"?profile.context:{}},pairedItem:{item:i}};
});
