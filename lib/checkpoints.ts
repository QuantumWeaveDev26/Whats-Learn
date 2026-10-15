import {missions,type Mission} from './missions';
/**
 * Mini challenges (checkpoints). After missions 2, 4, 6 and 8 of each course there is one short, practical checkpoint, and after mission 10 a course finale.
 * A checkpoint is not a mission: it adds no mission score, uses none of the one-new-mission-a-day allowance and earns no points. Clearing it earns a badge, once.
 * The next pair of missions opens only after the checkpoint is cleared. Learners can retry as often as they like; nothing is lost or paid twice.
 * Answers are checked on the server for signed-in learners and on this device for guests.
 */
export type CheckpointPart={q:string;options:string[];answer:number;why:string};
export type Checkpoint={track:string;after:number;title:string;scenario:string;parts:[CheckpointPart,CheckpointPart]};
export const checkpointPositions=[2,4,6,8,10] as const;
export const checkpointKey=(track:string,after:number)=>`${track}:${after}`;
const P=(q:string,options:string[],answer:number,why:string):CheckpointPart=>({q,options,answer,why});
const C=(track:string,after:number,title:string,scenario:string,a:CheckpointPart,b:CheckpointPart):Checkpoint=>({track,after,title,scenario,parts:[a,b]});
export const checkpoints:Checkpoint[]=[
 C('marketing',2,'Brief the AI, then check its claims','A Bengaluru home-meal service asks an AI for three ad lines.',
  P('Which brief will get the most useful ad lines?',['“Make our ads good and creative.”','“Audience: office workers within 5 km. Problem: no time to cook. Tone: warm. Output: 3 lines, under 15 words.”','“Make ads with lots of emojis.”'],1,'A useful brief names the audience, the problem, the tone and the output.'),
  P('The AI writes “Rated #1 by 10,000 customers.” You have no such data. What do you do?',['Keep it. It sounds strong.','Reduce the number so it looks safer.','Remove the claim and ask for lines that use only facts you gave.'],2,'Never publish a result you cannot prove.')),
 C('marketing',4,'Ask fairly, test one thing','You are improving the same ad after talking to customers.',
  P('Which survey question is fair?',['“Don’t you think our food is great?”','“What is the hardest part of ordering lunch on a weekday?”','“Would you pay more for amazing taste?”'],1,'A fair question does not hint at the answer you want.'),
  P('You change the headline and the photo together. Version B wins. What can you say?',['The headline won.','The photo won.','You cannot tell which change helped. Test one change at a time.'],2,'Changing two things at once hides the cause.')),
 C('marketing',6,'Pick a channel, find the weak step','You have ₹5,000 and customers who live on WhatsApp.',
  P('Which is the best first channel?',['WhatsApp messages to people who opted in, with a chat link','A city billboard','A radio spot'],0,'Reach people where they already talk, with their permission.'),
  P('1,000 people saw the ad, 300 clicked and 6 ordered. Which step needs work first?',['Getting more views','The step from click to order','Getting more clicks'],1,'Clicks are healthy. Orders are where people drop off.')),
 C('marketing',8,'Keep the plan and the claims honest','You plan two weeks of content and review one risky ad.',
  P('You can write 3 posts a week. What is the best plan?',['14 daily posts','6 posts, each with one idea, on days you will really write','One very long post'],1,'A plan you can keep beats a plan you will drop.'),
  P('An ad says “Cures stress in 7 days.” What is the honest rewrite?',['“Cures stress. Guaranteed.”','“A warm lunch can make a busy weekday easier. See today’s menu.”','“Cures stress for 10,000 people.”'],1,'Remove health promises and numbers you cannot prove.')),
 C('marketing',10,'Course finale: ready to launch?','Your one-page campaign plan is drafted and an AI wrote the copy.',
  P('Which parts must the one-page plan include?',['Logo ideas and fonts','Audience, offer, channel, one test, one number to track','A budget only'],1,'A plan names who, what, where, how you will learn and what you will measure.'),
  P('What is the last step before launch?',['Publish at once','Ask the AI if the copy is good','Check every claim against real evidence and read the copy yourself'],2,'You are responsible for what you publish.')),
 C('development',2,'Make it testable, review the code','A booking app idea is vague and an AI has written some code.',
  P('Which version of “make booking easier” can be tested?',['“Improve the booking page.”','“A user can book a 30-minute slot in 3 taps and sees a confirmation.”','“Add animations.”'],1,'A testable feature says what a user does and what they see.'),
  P('AI code joins user input straight into an SQL string. What do you do?',['Ship it. The demo works.','Ask for a parameterised query and review it again.','Hide the error message.'],1,'Never trust input. Parameterised queries stop injection.')),
 C('development',4,'Model the data, define the endpoint','You are planning the booking records and the first endpoint.',
  P('Which fields belong on a Booking record?',['user_id, slot_id, status, created_at','Favourite colour, theme, nickname','Server password'],0,'Keep what the booking needs, and nothing secret.'),
  P('Which is the best first line to give an AI before it builds an endpoint?',['“Build the backend.”','“POST /bookings with {slot_id}. 201 with the booking, 409 if taken, 401 if signed out.”','“Make it fast.”'],1,'Define inputs, outputs and errors first.')),
 C('development',6,'Check on the server, debug the cause','Bookings are failing for some users.',
  P('Where must “is this slot free?” be checked?',['Only in the browser','On the server. Browser checks can be bypassed.','Nowhere. The database will handle it.'],1,'The server is the only check a user cannot skip.'),
  P('Booking returns an error only when the name has an apostrophe. What is the best step?',['Retry until it works','Remove the name field','Reproduce it with “O’Neil”, read the log and find the unescaped text'],2,'Find the cause. A patch can hide it.')),
 C('development',8,'Who may do what, and prove it','Users can see bookings, and you add tests.',
  P('A user changes ?booking=7 to 8 and sees someone else’s booking. What is missing?',['A friendlier error','A server check that the booking belongs to this user','A longer password rule'],1,'Signing in says who you are. A check says what you may open.'),
  P('Rule: “no booking in the past.” Which three tests are best?',['Three bookings for tomorrow','A past slot (refused), a slot starting now (edge), a future slot (accepted)','Three random clicks'],1,'Test a failing case, an edge and a passing case.')),
 C('development',10,'Course finale: ship it safely','The booking app is nearly ready.',
  P('What is the safest way to ship a change?',['Edit the main branch directly','Make it on a branch, test it, merge small and keep a way to roll back','Ship on a Friday night'],1,'Small, tested, reversible changes are safe changes.'),
  P('Which item must be on a pre-launch checklist?',['Keys and passwords are out of the code and set as private settings','Change the fonts','Add more animations'],0,'A leaked key can cost real money and trust.')),
 C('filmmaking',2,'Feel it, show it','You are writing a short film about a grandmother’s kitchen.',
  P('Which one sentence makes us feel something?',['“A film about loss.”','“A girl keeps setting two cups of tea after her grandmother is gone.”','“A sad story.”'],1,'A specific action carries feeling better than a label.'),
  P('Which six-shot plan tells a silent story?',['Six shots of the same face','Six sunsets','Six shots that each add new information and end on a change'],2,'Each shot should move the story forward.')),
 C('filmmaking',4,'Shoot or generate, and subtext','You plan a festival scene with an actor and a crowd.',
  P('What should you shoot and what can you generate?',['Shoot the actor’s reaction, generate the crowd background','Generate the actor, shoot the crowd','Generate everything'],0,'Keep the human performance real. Use AI for what is costly to film.'),
  P('Two people argue about money but it is really about respect. Which line has subtext?',['“I feel you do not respect me.”','“Let’s talk about money.”','“You counted the change again. In front of everyone.”'],2,'Subtext says one thing and means another.')),
 C('filmmaking',6,'Direct with actions, light with no budget','You have one actor, one room and no lights.',
  P('Which direction works best for the actor?',['“Be more sad.”','“Fold the letter, stop, then slowly put it in the drawer.”','“Show more emotion.”'],1,'Give an action to play, not a feeling to fake.'),
  P('How do you light the room on no budget?',['Shoot at night with a phone torch','Shoot near a window in daylight and bounce light with a white sheet','Wait for a studio'],1,'Soft window light and a reflector cost almost nothing.')),
 C('filmmaking',8,'Design the sound, cut the tension','You are finishing a 30-second night-walk scene.',
  P('Which sound design builds tension?',['Loud music all the way through','Quiet room tone, footsteps and one distant sound that suddenly stops','No sound at all'],1,'Contrast and silence make the next sound matter.'),
  P('How should the cuts change as the moment nears?',['Shots get shorter','All shots stay the same length','Add a fancy transition to every cut'],0,'Faster cuts raise the pace and the tension.')),
 C('filmmaking',10,'Course finale: pitch and plan','You pitch your short film and plan one shoot day.',
  P('What must a one-page film pitch include?',['Only a cast wish list','Logline, main character, what they want, what stops them, why you can make it','Trailer music ideas'],1,'A pitch shows the story and your plan to make it.'),
  P('How do you build the one-day schedule?',['Fit every scene into three hours','Shoot outdoor-light scenes first, add a buffer and list the costs','Leave the costs for later'],1,'Plan around light, leave time for problems and know the cost.')),
 C('storytelling',2,'Three frames and a point of view','You are making a short visual story for a school-bus service.',
  P('Which three frames tell one clear story?',['Three unrelated pictures','Setup, a change, then the result','Three logos'],1,'A story needs a beginning, a change and an outcome.'),
  P('Which visual brief gives AI a point of view?',['“Make a nice poster.”','“Warm and hopeful, at a child’s eye level, no faces. One idea: the first day of school.”','“Make it pop.”'],1,'Say how it should feel, from where it is seen and what the one idea is.')),
 C('storytelling',4,'One message, one poster','You write the message and plan the poster.',
  P('Which line links audience, feeling and action?',['“Learn more about us.”','“Busy parents: stop worrying about the school run. Book a free week.”','“We are the best.”'],1,'Name who it is for, how they should feel and what to do.'),
  P('How should a poster be arranged to read in seconds?',['Many text sizes with equal weight','One main headline, one image, one action','As much text as will fit'],1,'The eye needs one clear place to start.')),
 C('storytelling',6,'Readable colour, honest chart','You prepare a poster and a small sales chart.',
  P('Which text style is the most readable?',['Light grey text on white','Dark text on a light background, at a size people can read','Red text on green'],1,'Strong contrast helps everyone read.'),
  P('Sales are 20, 35 and 80. Which chart is honest?',['A chart that starts at 15 to exaggerate the growth','Bars that start at zero with a title that states the finding','A chart with no labels'],1,'Start at zero and say plainly what the numbers show.')),
 C('storytelling',8,'Carousel and image check','You plan a five-slide carousel and review an AI image.',
  P('How should the five slides work?',['Everything on slide 1','Ten ideas on every slide','One idea per slide, in a clear order'],2,'One idea per slide keeps people swiping.'),
  P('An AI street image has extra fingers and garbled shop text. What do you do?',['Use it. People will not notice.','Check hands, text and logos, then fix or regenerate it','Add a filter'],1,'Check AI images for errors before you publish.')),
 C('storytelling',10,'Course finale: storyboard and pitch','You storyboard a five-frame campaign and pitch it.',
  P('What goes in each frame of a storyboard in words?',['Only a mood','What we see, what changes and any text on screen','Only the logo'],1,'Each frame should be clear enough for someone else to draw.'),
  P('How do three persuasive slides work?',['The problem, your idea, the ask','Twenty facts','Only your logo'],0,'Say why it matters, what you propose and what you need.')),
];
export const checkpointFor=(track:string,after:number)=>checkpoints.find(c=>c.track===track&&c.after===after);
export const trackCheckpoints=(track:string)=>checkpoints.filter(c=>c.track===track);
export const isFinale=(c:Checkpoint)=>c.after===10;
/** The position (1-based) of a mission inside its course. */
export function positionInCourse(m:Mission){return missions.filter(x=>x.track===m.track).findIndex(x=>x.id===m.id)+1}
/** The checkpoint that must be cleared before this mission opens: the one after the previous even-numbered mission. Missions 1, 2, 4, 6, 8 and 10 never need one. */
export function requiredCheckpoint(m:Mission):Checkpoint|undefined{const p=positionInCourse(m);return p>=3&&p%2===1?checkpointFor(m.track,p-1):undefined}
export type Judged={passed:boolean;results:{correct:boolean;message:string}[]};
/** Checks the learner's two answers. A wrong answer says so plainly, gives the reason and invites another try. No answer costs points. */
export function judgeCheckpoint(cp:Checkpoint,answers:readonly number[]):Judged{
 const results=cp.parts.map((p,i)=>{const correct=answers[i]===p.answer;return {correct,message:correct?`Correct. ${p.why}`:`That answer is not correct. ${p.why} Try again.`}});
 return {passed:results.every(r=>r.correct),results};
}
