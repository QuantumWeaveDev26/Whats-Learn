// Greeting is for a greeting message, not a prefix for every answer.
const priors=$("Build Tutor Request").all();
return $input.all().map((it,i)=>{
 const prior=priors[i]?.json||{},result=it.json||{};
 let text=String(result.output||result.text||"").trim();
 if(result.error||!text)text=String(prior.fallback||"I couldn’t connect just now. Please try again.");
 // Never deliver a mixed-script answer when the model ignores the saved language.
 const chosen=String(prior.material?.profile?.language||prior.language||'en');
 const scripts={en:'Latin',English:'Latin',kn:'Kannada',Kannada:'Kannada',te:'Telugu',Telugu:'Telugu',ta:'Tamil',Tamil:'Tamil',ml:'Malayalam',Malayalam:'Malayalam',hi:'Devanagari',Hindi:'Devanagari',mr:'Devanagari',ne:'Devanagari',sa:'Devanagari',kok:'Devanagari',doi:'Devanagari',mai:'Devanagari',brx:'Devanagari',bn:'Bengali',as:'Bengali',gu:'Gujarati',pa:'Gurmukhi',or:'Oriya',ur:'Arabic',ks:'Arabic',sd:'Arabic',mni:'Meetei_Mayek',sat:'Ol_Chiki'};
 const script=scripts[chosen]||(chosen.startsWith('Kanglish')?'Latin':null);
 const prose=text.replace(/```[\s\S]*?```|`[^`\n]*`/g,'');
 const romanKannada=(prose.match(/\b(nanu|nanna|neevu|maadi|maadide|beku|illa|andre|aadmele|tumba|hege|enu|torisi|torisbeku|haudu)\b/gi)||[]);
 if(script&&(new RegExp(`[^\\p{Script=${script}}\\p{Script=Latin}\\p{Script=Common}\\p{Script=Inherited}\\s]`,'u').test(prose)||(['en','English'].includes(chosen)&&new Set(romanKannada.map(x=>x.toLowerCase())).size>=2)))text=String(prior.fallback||'I couldn’t finish that reply in your selected language. Please try again.');
 text=text.replace(/[ \t]+\n/g,"\n").replace(/(?:\s|^)\d+[.)]\s*$/u,'').trim();
 // Ordinal markers are not sentence endings. Give each complete step its own line.
 text=text.replace(/(?:^|\s)(\d+)\.\s+(?=\S)/gu,'\n$1) ').trim();
 // A few emojis means restraint, even when a model ignores the style instructions.
 let emojiCount=0;
 text=text.replace(/\p{Extended_Pictographic}(?:\uFE0F|\p{Emoji_Modifier})?(?:\u200D\p{Extended_Pictographic}(?:\uFE0F|\p{Emoji_Modifier})?)*/gu,emoji=>++emojiCount<=1?emoji:'');
 if(prior.material?.mentorIntent==='preference'){
  const sentences=text.match(/[^.!?\n]+[.!?]+(?:\s|$)|[^\n]+(?:\n|$)/gu)||[text];
  let acknowledgement=sentences[0]?.trim()||text;
  if(acknowledgement.split(/\s+/u).length<3&&sentences[1])acknowledgement+=' '+sentences[1].trim();
  text=acknowledgement;
 }
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
