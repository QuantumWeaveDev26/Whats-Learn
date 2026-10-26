/** Editorial context, not proof of a learner's skill or of human approval. */
export const CURRICULUM_REVISION='2026-10-26';
export type CurriculumTrack='marketing'|'development'|'filmmaking'|'storytelling';
const tracks={
 marketing:{focus:'Check AI-written claims against real evidence and measure useful enquiries.',sources:[{title:'Google Analytics campaign links',url:'https://support.google.com/analytics/answer/10917952?hl=en'}],practice:[
  'A neighbourhood bakery wants weekday orders. Write one honest offer, identify a claim to verify, and choose one measure of actual orders rather than views.',
  'A repair shop gets enquiries but few bookings. Compare two permission-based follow-ups and explain which result would make you change the message.'
 ]},
 development:{focus:'Review AI-generated changes, enforce server-side permissions, and test failure cases before deployment.',sources:[{title:'MDN website security',url:'https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Server-side/First_steps/Website_security'},{title:'OWASP object-level authorization',url:'https://api-security.owasp.org/editions/2023/en/0xa1-broken-object-level-authorization/'}],practice:[
  'A community library lets members reserve books. Explain how the server prevents one member from editing another member’s reservation; test a rejected request using made-up accounts.',
  'An AI changes a shop’s checkout. Review where the price comes from, then test a duplicate request and a failed save before deciding whether the change is ready.'
 ]},
 filmmaking:{focus:'Keep shots consistent, make dialogue understandable, and check permission for footage, music and generated assets.',sources:[{title:'Blackmagic Design filmmaking and editing training',url:'https://www.blackmagicdesign.com/products/davinciresolve/training'}],practice:[
  'Plan a 20-second film about a lost umbrella. Use three shots, keep the action consistent, and explain how you would record clear sound and obtain permission for any borrowed music.',
  'A local shop needs a short demonstration video. Choose a simple shot sequence, check that dialogue is audible on a phone, and note one edit after a viewer’s trial.'
 ]},
 storytelling:{focus:'Create a clear visual sequence, check generated details, and make essential meaning accessible.',sources:[{title:'W3C accessible images tutorial',url:'https://www.w3.org/WAI/tutorials/images/'}],practice:[
  'Create a three-panel story explaining how to refill a water bottle at a public station. Check the order with a reader and describe the essential image information in plain text.',
  'A neighbourhood event needs a poster. Make the time, place and action clear; check any AI-generated text and write an image description that conveys the useful information.'
 ]}
} as const;
export function curriculumFor(track:string,at=new Date()){
 if(!Object.hasOwn(tracks,track))return null;
 const id=track as CurriculumTrack,t=tracks[id];
 // Fixed authored rotation: never presented as live news or a new graded mission.
 const week=Math.max(0,Math.floor((at.getTime()-Date.parse(CURRICULUM_REVISION+'T00:00:00Z'))/604800000));
 return {track:id,revision:CURRICULUM_REVISION,sourceCheckedAt:CURRICULUM_REVISION,humanApproval:'pending' as const,focus:t.focus,sources:t.sources,optionalPractice:{id:`${id}-${CURRICULUM_REVISION}-${week%t.practice.length}`,prompt:t.practice[week%t.practice.length],kind:'authored hypothetical practice',assessment:'Optional practice does not complete a mission, award points or consume a whole-mission review automatically.'}};
}
