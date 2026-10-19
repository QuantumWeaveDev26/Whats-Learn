export type MentorIntent={kind:'progress'|'course'|'clarify'|'continue'|'greeting'|'frustrated'|'save'|'draft'|'keep-draft'|'roadmap'|'profile'|'question'|'answer';track?:string};
/** Only short conversational requests; never classify an artifact/code block as navigation. */
export function mentorIntent(raw:string):MentorIntent|null{
 const t=raw.trim().toLowerCase().replace(/[’‘]/g,"'").replace(/[?!.,]+$/g,'').replace(/\s+/g,' ');
 if(t.length>130||/[{};\n]/.test(t))return null;
 if(/^(hi|hello|hey|hey mentor|hello mentor|namaste|namaskara)$/.test(t))return {kind:'greeting'};
 if(/^(?:(?:please |can you |could you )?(?:save (?:my |the |this )?(?:draft|progress)|pause (?:my |the |this )?(?:task|mission|lesson)|take a break))(?: please)?$/.test(t))return {kind:'keep-draft'};
 if(/^(?:please |can you |could you )?(?:(?:save|submit) (?:my |the |this )?(?:work|task|mission|answer)|mark (?:my |the |this )?(?:task|mission) (?:as )?(?:done|complete|completed)|(?:complete|finish) (?:this|the) (?:task|mission))(?: please)?$/.test(t))return {kind:'save'};
 if(/^(?:please |can you |could you )?(?:show|read)(?: me)? (?:my |the |this )?draft(?: please)?$/.test(t))return {kind:'draft'};
 if(/^(?:please )?(?:show(?: me)? (?:my |the )?)?roadmap$/.test(t))return {kind:'roadmap'};
 if(/^(?:continue|resume)$/.test(t))return {kind:'continue'};
 if(/^(?:i want to |i need to |need to |want to )?(?:complete|finish|continue|resume) (?:my )?(?:task|mission|lesson)(?: please)?$/.test(t))return {kind:'continue'};
 if(/^(?:(?:please |can you |could you )?)(?:(?:tell|show|check|give)(?: me)? (?:my |the )?(?:progress|performance|stats|points|score)|(?:what(?:'s| is) (?:my |the )?(?:progress|performance|score))|how am i doing|my progress)$/.test(t))return {kind:'progress'};
 const course=t.match(/^(?:please )?(?:change|switch|choose|pick)(?: my| the)? (?:course|subject)(?: to (.+))?$/)||t.match(/^(?:please )?(?:switch|change) to (.+)$/);
 if(course){const v=course[1]||'';const track=/market/.test(v)?'marketing':/full.?stack|development|coding|build/.test(v)?'development':/film/.test(v)?'filmmaking':/visual|story/.test(v)?'storytelling':undefined;return {kind:'course',track}}
 if(/^(?:(?:i )?(?:don't|do not|didn't|did not) (?:get (?:it|that)|understand)(?: this| it| that| the task| the question)?|what do you mean|nange go(?:t|th)+illa|nanage go(?:t|th)+illa|samajh nahi aaya|mujhe samajh nahi aaya|help me understand|explain (?:this|it|again)|i'm confused|im confused|(?:give|show)(?: me)? (?:an? |another )?(?:real.world |simple )?example(?: please)?)$/.test(t))return {kind:'clarify'};
 if(/^(?:this is |it's |its |you're |you are )?(?:irritating|boring|annoying|useless|not helping|a waste)(?: me)?$/.test(t))return {kind:'frustrated'};
 return null;
}
