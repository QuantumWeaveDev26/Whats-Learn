import type {Mission} from './missions';
import {learningStyle} from './learning-styles';

// Each row asks for the same approved decision in a different situation or form.
// Answer positions and criteria are preserved, so style never grants extra credit.
type Variants=[string,string,string]; // game, story, facts
const guided:Record<string,Variants>={
m1:['Your lunch launch needs its first audience. Who gets the invite?','A lunch seller can serve one group reliably. Who would you help them reach first?','Which customer group gives a weekday lunch offer a specific audience?'],
m2:['Build the ad prompt. Which input pack unlocks a usable result?','A founder wants AI to write an ad today. What would you hand over first?','What real facts and instructions does AI need before writing this ad?'],
m3:['A menu enquiry lands. Pick the reply that moves the conversation forward.','Someone is waiting for the menu. What would you send them?','Which first reply combines useful information with one next step?'],
m4:['Unlock a real customer insight. Which interview question earns it?','Your friend needs to understand a customer’s lunch problem. What should they ask?','Which question asks for evidence of past customer behaviour?'],
m5:['Run a fair message test. Which change keeps the comparison clean?','Two teammates disagree about a headline. How should they compare the messages?','How can you find out whether one message change helped?'],
m6:['Choose one launch channel. Which choice fits the intended customer?','A small business can try one channel this week. How would you choose it?','How should the shop choose where to reach customers first?'],
m7:['Budget checkpoint: pick the calculation that tracks qualified demand.','A founder asks what each useful enquiry costs. Which calculation answers them?','How do you calculate the cost of one suitable customer enquiry?'],
m8:['Build a calendar the creator can actually finish. Which plan principle wins?','A student wants to create content without losing study time. What should guide the calendar?','Which property makes a content calendar usable?'],
m9:['An unsupported guarantee appears. Pick the safe publishing move.','Your teammate is about to post a result nobody can prove. What would you advise?','How should an unsupported advertising promise be handled?'],
m10:['Assemble a campaign pack that can be used. Which contents clear the checkpoint?','A team hands over its first campaign. What should make it usable?','What does the shop need to use the campaign and count its results?'],
d1:['The Book button was tapped, but saving is still running. What unlocks the success message?','A parent taps Book and waits. What must happen before you tell them it is saved?','Which event is required before showing Booking saved?'],
d2:['Security checkpoint: a browser sends a user ID. Can that value prove identity?','A parent edits the user ID in a request. What should the server trust instead?','How can the server check who is really sending the request?'],
d3:['Link customers to bookings without duplicating every detail. Which design clears the task?','A tutor wants one customer record linked to their bookings. Why use separate tables?','Which benefit follows from linked customer and booking tables?'],
d4:['Your API needs a usable contract. Which information pack clears the checkpoint?','A browser developer needs to connect a form to an endpoint. What must the contract explain?','What must the page and server agree about sending data and replies?'],
d5:['A direct order request bypasses the form. Where must the stock check run?','A shopper changes the browser request. Where should availability still be checked?','Which layer must enforce stock availability?'],
d6:['Bug hunt: choose the first move that gives you evidence.','A tutor reports missing bookings. What would you do before changing code?','What should you try first to find what caused the booking problem?'],
d7:['A signed-in user tries another person’s record. What check blocks the breach?','A parent opens a booking they do not own. What must the server establish?','What check stops someone opening a booking that is not theirs?'],
d8:['Write a test that can catch a failure. What should it compare?','Your teammate says the code looks fine. What should an actual booking test verify?','What should a test check about the actual booking result?'],
d9:['Start a change without risking the main branch. Why use a separate branch?','Your teammate wants to review a change before it lands. What does a separate branch allow?','Which purpose does an isolated Git branch serve?'],
d10:['Release checkpoint: what must be checked before sharing the prototype?','You are handing the booking prototype to a tutor. What behaviour should you verify first?','Which checks cover a booking flow beyond appearance?'],
f1:['Give your character a playable story. Which ingredients unlock it?','A rider needs a reason for us to follow their journey. What should the story contain?','What does the character need for a story with a meaningful choice?'],
f2:['Build a silent sequence. What must the next shot contribute?','A viewer has no dialogue to guide them. What should each shot help them understand?','What should each shot add to help viewers follow the story?'],
f3:['Choose the live-action path. When does it serve this hybrid film best?','Your performer’s small reaction matters. When would you keep the footage live?','Which need favours live footage in a hybrid production?'],
f4:['Unlock the hidden intention. Which description gives dialogue subtext?','Two cousins say one thing and mean another. What makes that exchange carry subtext?','Which relationship between words and intention creates subtext?'],
f5:['Direct take two. Which instruction gives the actor an action to play?','An actor asks what to do in the scene. Which direction can they act on?','Which instruction gives the actor a clear action to do?'],
f6:['Scout the scene before locking the light. Which evidence do you need?','Your crew likes a location photograph. What should they check in person?','Which lighting information should a scene plan use?'],
f7:['Repair the sound between cuts. What job does room tone do?','Two dialogue clips sound like different spaces. Why would the editor use room tone?','Which function does recorded room tone serve?'],
f8:['Build tension with the edit. Which choice controls the reveal?','A viewer needs to feel suspense. What can the editor control to create it?','Which editing principle can produce tension?'],
f9:['Schedule the shoot around real limits. Which planning approach clears the task?','Your crew has one day and several setups. What makes the schedule workable?','Which constraints should structure a one-day shoot?'],
f10:['Pitch checkpoint: which information makes the proposal usable?','A collaborator asks what you are making and how. What should the pitch clarify?','What should you explain so someone understands the film and how to make it?'],
v1:['Connect three frames into one story. Which quality clears the checkpoint?','A viewer sees three pictures. What would let them follow one story?','What connects the three pictures into one clear story?'],
v2:['Build a visual brief the maker can use. Which details belong?','Your teammate is making the first image. What should the brief tell them?','Which inputs make a visual brief specific?'],
v3:['Connect the audience to one action. Which line structure works?','Someone sees your poster for the first time. What should your audience-action line connect?','Who is the message for, how should they feel, and what should they do?'],
v4:['Give the poster a focal point. What should the viewer find first?','Someone walks past your poster in seconds. What should catch their eye?','What should people notice first on this poster?'],
v5:['Readability checkpoint: which type-and-colour choice passes?','A reader opens the design on a small phone. Which choice helps them read it?','Which text size and colour choice makes this easy to read?'],
v6:['Build a chart that earns trust. Which design choice passes?','Your reader needs to compare the real values. What makes the chart honest?','What makes the chart show the actual numbers fairly?'],
v7:['Make every carousel slide earn its place. What should it contribute?','A reader swipes toward your invitation. What job should each slide do?','What should each slide add to the story?'],
v8:['Image review checkpoint: what must you inspect before use?','A teammate wants to publish an AI image. What should you check first?','Which checks belong in a pre-use AI image review?'],
v9:['Connect three pitch slides. Which sequence makes the case?','Your audience asks why this idea matters and what happens next. What should the pitch connect?','Which structure links evidence to a clear pitch request?'],
v10:['Unite five campaign frames. Which approach makes them coherent?','A viewer needs to recognise one campaign across five frames. What should connect them?','Which consistency makes a campaign sequence coherent?']
};

// Applied questions retain their exact evidence: numbers, code, constraints and
// consent conditions. Only the final decision prompt changes between styles.
const applied:Record<string,Variants>={
m1:['Pick the message that earns the budget.','Which message would you advise the lunch seller to keep?','Which message is supported by the enquiry evidence?'],
m2:['Repair the prompt before the next run. Which move clears the claim check?','What would you tell the founder to change before trying again?','Which prompt correction addresses the unsupported rating?'],
m3:['Choose the follow-up that earns a respectful reply.','What would you send this prospect next?','Which follow-up is useful and respects consent?'],
m4:['Unlock reliable customer evidence. What should Ravi ask next time?','What would help Ravi learn what colleagues actually do?','Which interview approach reduces hypothetical purchase bias?'],
m5:['Evidence checkpoint: what conclusion can this test support?','A teammate says B won. What would you tell them?','Which conclusion is justified by this comparison?'],
m6:['Spend the first channel budget wisely. Which route wins?','Where would you advise the bakery to start?','Which channel fits these audience, consent and resource constraints?'],
m7:['Allocate the extra budget. Which ad earns it?','The studio asks which ad to back. What would you recommend?','Which ad has the lower cost per qualified enquiry?'],
m8:['Build a plan Kavya can finish. Which schedule clears the constraint?','Which plan would let Kavya create and still study?','Which plan fits the available weekly time?'],
m9:['Claims checkpoint: which line is safe to use?','Which draft would you feel comfortable recommending to a learner?','Which advertised claim is supportable without a job guarantee?'],
m10:['Connect customer, channel and metric. Which campaign clears the test?','Which student plan would you help the tiffin service try?','Which plan is internally consistent?'],
d1:['Patch the false-success flow. Which acceptance check clears the checkpoint?','A parent sees success but no booking exists. What rule should Anita specify?','Which acceptance condition makes confirmation match persisted state?'],
d2:['Block the tampered request. Which review comment fixes both trust failures?','A parent changes the price and user ID. What would you ask the developer to fix?','Which correction moves identity and price decisions to trusted sources?'],
d3:['Two parents race for one seat. Which protection wins?','What would stop both families receiving the same seat?','Which invariant must the database enforce atomically?'],
d4:['Handle the duplicate registration. Which response clears the contract?','What reply lets the browser explain that this email is already registered?','Which response distinguishes a duplicate registration?'],
d5:['Block the direct oversized order. Which check wins?','What should protect the shop when the form’s limit is bypassed?','Which validation enforces actual inventory limits?'],
d6:['Give the AI a useful bug report without leaking data. Which message wins?','What would you send an assistant to help debug this safely?','Which report combines reproducible evidence with redacted sensitive data?'],
d7:['Close the record-ID exploit. Which fix passes the security check?','How would you stop Meera seeing another family’s details?','Which control enforces access to the specific booking?'],
d8:['Catch the boundary bug. Which test fails the broken function?','Your teammate thinks the capacity check is fine. Which test would you show them?','Which boundary case disproves the current predicate?'],
d9:['Recover the broken deployment. Which first move restores service safely?','Bookings just broke after the merge. What would you do first?','Which recovery action has the safest immediate scope?'],
d10:['Triage the launch gaps. Which problem goes first?','The tutor can only fix one issue first. Which would you prioritise?','Which defect creates the clearest immediate privacy risk?'],
f1:['Rescue the flat story. Which change creates a meaningful choice?','What would make the rider’s decision matter to a viewer?','Which revision adds a cost to the central decision?'],
f2:['Repair the confusing cut. Which continuity move clears it?','How would you help viewers follow the rider’s movement?','Which correction preserves screen direction?'],
f3:['Clear the shot within budget. Which production choice wins?','What would you recommend for the watchman’s smile?','Which option preserves performance within the stated cost and time?'],
f4:['Write the line with hidden feeling. Which choice wins?','Kavya wants Rohan to stay. Which line lets us sense it without saying it directly?','Which line conveys the unstated objective through subtext?'],
f5:['Unlock a playable take. Which direction should Anil get?','What would you say to Anil instead of asking him to look panicked?','Which direction supplies a specific observable action?'],
f6:['Lock the rooftop only after the right check. Which move wins?','What would you ask the crew to verify before committing to this location?','Which scout action tests the actual shooting conditions?'],
f7:['Smooth the hum across cuts. Which repair clears the sound check?','How would you make the library dialogue feel like one space?','Which edit supplies consistent background ambience?'],
f8:['Build toward the reveal. Which edit breaks the flat rhythm?','What would you change to make this sequence feel more tense?','Which change introduces pacing and scale progression?'],
f9:['Save travel time and catch dusk. Which schedule wins?','How would you arrange the crew’s day around the stall scene?','Which order groups locations while preserving light-dependent work?'],
f10:['Disclose the hybrid work accurately. Which line clears the honesty check?','How would you describe the live and AI material to a collaborator?','Which disclosure matches the actual production and consent?'],
v1:['Repair the disconnected frames. Which change makes one story?','What would help a library viewer connect these pictures?','Which revision supplies sequence and visual continuity?'],
v2:['Fix the inconsistent AI outputs. Which brief change wins?','How would you brief the maker to keep the person consistent and avoid broken text?','Which instruction addresses both continuity and generated text risk?'],
v3:['Get first-years to Saturday’s walk. Which rewrite clears the goal?','What would you say to a first-year who has never joined a walk?','Which line makes the walk clear and welcoming for beginners?'],
v4:['Make the poster readable at a glance. Which fix wins?','What would help a passer-by find the event’s main message?','Which change establishes a clear visual hierarchy?'],
v5:['Make the printed headline survive. Which fix clears greyscale?','How would you help someone read the black-and-white flyer?','Which change keeps the headline readable in black and white?'],
v6:['Repair the misleading chart. What needs changing?','A reader thinks visits multiplied dramatically. What would you explain?','Why do these bars make the rise look bigger than it really is?'],
v7:['Declutter slide three. Which edit clears the one-second read?','What would you cut or move so a reader can follow this slide?','What should you keep on this slide so it has one clear idea?'],
v8:['Review before print. Which move resolves the lookalike risk?','What would you advise the tea-stall owner before printing?','What should change before the image is checked again?'],
v9:['Make the council understand the ask. Which opening wins?','How would you help the team explain why the money is needed?','How should you explain why the project needs this help?'],
v10:['Unite the campaign. Which visual repair clears the recognition test?','What would help viewers recognise all five frames as one campaign?','What should stay the same so viewers recognise one campaign?']
};

function context(question:string){const parts=question.match(/^([\s\S]*[.!])\s+[^.!?]+[?]$/u);return parts?.[1]||'';}
export function questionForStyle(m:Mission,style:unknown):string{
 const kind=learningStyle(style);if(kind==='casual')return m.question;
 const index=kind==='game'?0:kind==='story'?1:2;
 if(m.practiceLevel==='experienced'){
  const scene=context(m.question);
  const ask=['A new problem appears. Which action handles it?','You own this decision. What would you choose next?','What should happen in this less usual situation?'][index];
  return scene?scene+' '+ask:m.question+' '+ask;
 }
 const row=m.practiceLevel==='beginner'?guided[m.id]:applied[m.id];
 if(!row)return m.question;
 const scene=m.practiceLevel==='beginner'?'':context(m.question);
 return (scene?scene+' ':'')+row[index];
}
