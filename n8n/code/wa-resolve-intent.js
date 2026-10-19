// Interpret the model's bounded intent; only the website may execute account actions.
const messages=$("One Item Per Message").all(),profiles=$("Read Mentor Profile").all();
return $input.all().map((it,i)=>{
 const m=messages[i]?.json||{},profile=profiles[i]?.json||{};
 let choice={};try{choice=JSON.parse(String(it.json.output||"").replace(/^```(?:json)?\s*|\s*```$/g,""))}catch{}
 const kinds=["question","clarify","learn","continue","save","keep-draft","draft","progress","points","journey","course","roadmap","profile","answer"];
 let kind=kinds.includes(choice.kind)?choice.kind:"question";
 const raw=String(m.text||"");
 const natural=raw.trim().toLowerCase().replace(/[’‘]/g,"'").replace(/[?!.]+$/g,'');
 // Safety backstops for account questions and completion permission; the model still handles paraphrases.
 if(/^(?:what(?:'s| is)|show(?: me)?|tell me|how many) (?:my |the )?(?:point|points|score|balance)(?: do i have)?$/.test(natural))kind="points";
 if(/^(?:where(?:'s| is)|show(?: me)?) (?:my |the )?journey(?: in whatslearn)?$/.test(natural))kind="journey";
 if(/^(?:i (?:want|wanna) (?:to )?learn|teach me(?: first)?|first explain(?: (?:me|the task))?)$/.test(natural))kind="learn";
 if(/^(?:ok(?:ay)? now )?(?:i (?:want to|wanna)|can i) finish (?:my |the )?(?:task|mission)(?: now)?$/.test(natural))kind="continue";
 // Existing explicit commands stay exact, including STOP and the account-link proof.
 const exact=/^(?:stop|start|unsubscribe|end|pause|optout|opt out|today|lesson|next|menu|drafts|performance|stats|roadmap(?: all)?|profile|info|plan|style|learn|course|hint(?: example)?|yes|save|submit|help|cancel|edit|check|points|score|balance|remind|reminders|रुको|बंद|ನಿಲ್ಲಿಸಿ)[.!]?$/i;
 const arguments=/^(?:link\s+[a-z0-9-]{6,12}|(?:ask|answer|practice)\s+.+|edit\s+\d+|style\s+(?:[1-4]|casual|game|story|facts)|course\s+(?:[1-4]|marketing|development|filmmaking|storytelling)|resume\s+[mdfv]\d+|check\s+[a-f1-6]\s+[a-f1-6]|remind\s+(?:on|off|quiet|\d).*)$/i;
 if(exact.test(raw.trim())||arguments.test(raw.trim()))kind="answer";
 const track=["marketing","development","filmmaking","storytelling"].includes(choice.track)?choice.track:"";
 const commands={question:"PROFILE",clarify:"LEARN",learn:"LEARN",continue:"TODAY",save:"SAVE","keep-draft":"PROFILE",draft:"DRAFT",progress:"PERFORMANCE",points:"POINTS",journey:"ROADMAP",course:"COURSE"+(track?" "+track:""),roadmap:"ROADMAP",profile:"PROFILE"};
 return {json:{...m,bridgeText:commands[kind]||raw,mentorIntent:kind,profileSnapshot:profile.action==="reply"?String(profile.text||"").slice(0,5000):"",profileContext:profile.action==="reply"&&profile.context&&typeof profile.context==="object"?profile.context:{}},pairedItem:{item:i}};
});
