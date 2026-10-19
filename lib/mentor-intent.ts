type Intent={kind:'progress'|'course'|'clarify'|'greeting'|'frustrated';track?:string};
/** Only short conversational requests; never classify an artifact/code block as navigation. */
export function mentorIntent(raw:string):Intent|null{
 const t=raw.trim().toLowerCase().replace(/[’‘]/g,"'").replace(/[?!.,]+$/g,'').replace(/\s+/g,' ');
 if(t.length>130||/[{};\n]/.test(t))return null;
 if(/^(hi|hello|hey|hey mentor|hello mentor|namaste|namaskara)$/.test(t))return {kind:'greeting'};
 if(/^(?:(?:please |can you |could you )?)(?:(?:tell|show|check|give)(?: me)? (?:my |the )?(?:progress|performance|stats|points|score)|(?:what(?:'s| is) (?:my |the )?(?:progress|performance|score))|how am i doing|my progress)$/.test(t))return {kind:'progress'};
 const course=t.match(/^(?:please )?(?:change|switch|choose|pick)(?: my| the)? (?:course|subject)(?: to (.+))?$/)||t.match(/^(?:please )?(?:switch|change) to (.+)$/);
 if(course){const v=course[1]||'';const track=/market/.test(v)?'marketing':/full.?stack|development|coding|build/.test(v)?'development':/film/.test(v)?'filmmaking':/visual|story/.test(v)?'storytelling':undefined;return {kind:'course',track}}
 if(/^(?:(?:i )?(?:don't|do not|didn't|did not|cant|can't|cannot) (?:get it|understand)(?: this| it| the task| the question)?|nange go(?:t|th)+illa|nanage go(?:t|th)+illa|samajh nahi aaya|mujhe samajh nahi aaya|help me understand|explain (?:this|it|again)|i'm confused|im confused)$/.test(t))return {kind:'clarify'};
 if(/^(?:this is |it's |its |you're |you are )?(?:irritating|boring|annoying|useless|not helping|a waste)(?: me)?$/.test(t))return {kind:'frustrated'};
 return null;
}
