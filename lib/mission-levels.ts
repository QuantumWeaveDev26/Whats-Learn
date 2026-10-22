import type {Mission} from './missions';

export const startingLevels={beginner:'Guided start',practising:'Hands-on practice',experienced:'Stretch challenge'} as const;
export type StartingLevel=keyof typeof startingLevels;
export const startingLevel=(value:unknown):StartingLevel=>value==='beginner'||value==='experienced'?value:'practising';
/** A response to an earlier level must not pre-answer a different question. */
export function reviewedChoiceForLevel(quiz:number|undefined,evaluation:string|null|undefined,level:string){
 try{return JSON.parse(evaluation||'{}').learningLevel===level&&Number.isInteger(quiz)?quiz!:-1}catch{return -1}
}
// Simple decision, its answer and a misconception; then a transfer problem,
// its answer, two plausible mistakes, and an extra test the learner must perform.
type Case=[string,string,string,string,string,string,string,string];
const cases:Record<string,Case>={
 "m1": [
  "A lunch service delivers on weekdays near offices. Who should its first offer speak to?",
  "Office workers who need lunch on working days.",
  "People planning an occasional weekend restaurant visit.",
  "Your lunch ad gets replies, but most come from places you cannot deliver to. What should you change first?",
  "Clearly state the delivery area and who can order.",
  "Celebrate the reply count and advertise more widely.",
  "Hide the delivery area to attract more people.",
  "Add a delivery-area line. Ask a reader who can order and record their real answer."
 ],
 "m2": [
  "You want AI to write an ad for your shop. What should you give it first?",
  "The customer, goal, real facts and rules to follow.",
  "Only the words make it viral.",
  "AI keeps adding a delivery guarantee your shop never made. How should you change the next instructions?",
  "Supply approved facts and ask AI to flag anything it cannot support.",
  "Ask for a more confident tone.",
  "Keep the guarantee in smaller print.",
  "Run the prompt again with a missing fact; show how your revised prompt handles the gap."
 ],
 "m3": [
  "A customer asks for your lunch menu. What is a useful first reply?",
  "Share the menu and ask one easy next-step question.",
  "Send several unrelated offers at once.",
  "A customer sends STOP while your next message is waiting to be sent. What should happen?",
  "Cancel the waiting message and stop the relevant messages.",
  "Send it once because it was scheduled earlier.",
  "Send a final discount before stopping.",
  "Try a STOP reply between two messages and show that the next message is cancelled."
 ],
 "m4": [
  "You want to learn why office workers struggle with lunch. Which question helps?",
  "Tell me about the last time ordering lunch was difficult.",
  "Would you buy our amazing lunch service?",
  "People praise your lunch idea but give no examples of needing it. What should you ask next?",
  "Ask about the last time they faced this problem and what they did.",
  "Ask them to promise they will subscribe.",
  "Explain more benefits until they agree.",
  "Ask one neutral follow-up in your real interview and record whether it reveals an actual past behaviour."
 ],
 "m5": [
  "You want to compare two shop messages fairly. What should you change?",
  "One thing, such as the headline, while keeping the rest similar.",
  "The message, customers, price and platform all at once.",
  "Message A ran on Monday. B ran on a holiday for different people and got more clicks. What can you conclude?",
  "Several things changed, so repeat the test with similar conditions.",
  "B is proven better because it got more clicks.",
  "A should never be used again.",
  "Repeat your reader comparison with the same instructions and exposure time; record the limitations."
 ],
 "m6": [
  "A local shop can advertise in only one place first. How should it choose?",
  "Choose a place its intended customers actually use.",
  "Use every platform at once.",
  "Your shop post gets attention, but its link opens a broken order form. What needs fixing first?",
  "Repair and test the whole path from post to enquiry.",
  "Post more often to make up for the broken form.",
  "Choose a brighter picture.",
  "Try the link or next step on a phone and another device. Fix a step that fails and record what changed."
 ],
 "m7": [
  "A shop spends money on an ad. How does it find the cost of one suitable customer enquiry?",
  "Divide the ad spend by suitable customer enquiries.",
  "Divide likes by views.",
  "One ad costs ₹20 per enquiry, with 2% suitable customers. Another costs ₹60, with 50% suitable customers. Which is cheaper per suitable enquiry?",
  "The second: ₹120 per suitable enquiry, compared with ₹1,000.",
  "The first, because ₹20 is less than ₹60.",
  "Both cost the same per suitable enquiry.",
  "Add the percentage of suitable enquiries to your spreadsheet. Test the cost calculation with two different percentages."
 ],
 "m8": [
  "You have little time to make shop posts. What makes a useful posting plan?",
  "A realistic schedule with a reason and next step for each post.",
  "As many posts as possible every day.",
  "A plan needs a new video every day, but the creator has two hours a week. What should change?",
  "Make fewer posts and focus on the ones that serve the goal.",
  "Keep the plan and blame the creator for missed days.",
  "Post exactly the same message every day.",
  "Time the creation of one planned post and revise the calendar using the time you actually needed."
 ],
 "m9": [
  "An ad promises results the business cannot prove. What should you do?",
  "Remove or limit the unsupported promise before using it.",
  "Make the promise larger so more people notice.",
  "A form has already ticked marketing messages and hides how to stop them. What makes the choice fair?",
  "Make messages optional and show a clear way to stop them.",
  "Keep the box ticked but use smaller writing.",
  "Treat a page visit as permission.",
  "Rehearse opting in, declining and stopping with a partner; report any confusing step you fixed."
 ],
 "m10": [
  "You are handing a lunch campaign to a shop owner. What should the pack include?",
  "The customer, offer, finished posts and a way to track the next step.",
  "A folder of unrelated attractive pictures.",
  "Your campaign posts look finished, but enquiries have no record of which post they came from. What should you fix?",
  "Add source labels and test them with a labelled enquiry.",
  "Make more post designs.",
  "Report views as confirmed sales.",
  "Run two labelled test enquiries from different assets and verify that your tracker distinguishes their sources."
 ],
 "d1": [
  "A parent’s booking request is still saving. When may the page say Booking saved?",
  "After the server confirms the booking was stored.",
  "As soon as the Book button is pressed.",
  "A booking may have saved, but the reply is lost. What should your plan say about retrying?",
  "Show that the result is uncertain and retry without creating a second booking.",
  "Retry immediately with a new booking reference.",
  "Assume the booking was definitely not saved.",
  "Make your local booking demo lose a reply. Retry and show that it does not save a second booking."
 ],
 "d2": [
  "A browser sends a user ID to a booking server. Should the server trust that ID alone?",
  "No. It must identify the user from verified sign-in details.",
  "Yes. Checking the browser form makes the ID trustworthy.",
  "Your server checks who is signed in but accepts a discount sent by the browser. What still needs fixing?",
  "Calculate the allowed price and discount on the server.",
  "Trust the discount if its button is hidden.",
  "Rename the discount field.",
  "Change a discount in a test request. Run your server code and show that the correct price is still used."
 ],
 "d3": [
  "A customer may book several classes. Why keep customers and bookings in linked tables?",
  "To connect each booking to a customer without copying all customer details.",
  "To add a new customer-name column for every booking.",
  "Two parents reserve the same seat at the same time. What database protection is needed?",
  "A database rule that blocks a second save for the same seat and class.",
  "A warning shown only in the browser.",
  "A comment asking people not to double-book.",
  "Try saving the same class slot twice in your local database. Share the actual reply that blocks the second save."
 ],
 "d4": [
  "A page sends a booking request to a server. What should the page and server agree about sending data?",
  "Where and how to send data, and the success and error replies.",
  "Only the colour of the button.",
  "A page retries a booking request after losing the reply. What helps the server avoid a second booking?",
  "Reuse one request key and define what happens when that key is sent again.",
  "Return a random message on every retry.",
  "Ask the user never to double-click.",
  "Send a repeated request to your local API and verify that only one booking is created."
 ],
 "d5": [
  "An online shop receives an order. Where must the remaining stock be checked?",
  "On the server while handling the order.",
  "Only in the browser before sending it.",
  "A shop page shows stock, but the last item sells before the user orders. What should happen?",
  "The server checks stock again and gives a clear unavailable reply if it has run out.",
  "Accept the browser’s old stock count.",
  "Show success and hide the missing item.",
  "Change stock between page load and submit in your local test; record the server response."
 ],
 "d6": [
  "A booking does not save. What is a useful first step to find the bug?",
  "Repeat the problem and inspect the actual error and saved result.",
  "Change several unrelated files immediately.",
  "A fix works for a normal booking, but the original failing request still fails. What should guide the next change?",
  "Repeat that request and inspect its actual result to find the cause.",
  "Rewrite the whole page first.",
  "Declare it fixed because another request passed.",
  "Keep a test of the original failing request. Run it before and after your fix to show the difference."
 ],
 "d7": [
  "A learner opens someone else’s booking. What must the server check?",
  "Whether this user may access that particular booking.",
  "Only whether the user has signed in.",
  "A learner changes a booking number to open someone else’s record. Which test checks the actual risk?",
  "Request that record as the learner and check that the server refuses.",
  "Check only that the edit button is hidden.",
  "Test only an administrator account.",
  "Run owner, non-owner and administrator cases against the same local record and show the results."
 ],
 "d8": [
  "You write a test for a booking function. What should it compare?",
  "What actually happened with the exact result you expected.",
  "Whether the code looks neatly formatted.",
  "A test still passes when you put the old booking bug back. What does this suggest?",
  "The test may not check the behaviour it is supposed to protect.",
  "The old bug is harmless.",
  "One passing test proves every booking works.",
  "Deliberately restore the bug locally and show your regression test fail, then pass after the fix."
 ],
 "d9": [
  "You want to change a booking app. Why work on a separate branch in Git?",
  "To keep the change separate until it is checked and joined to the main version.",
  "To avoid testing the change.",
  "A broken release changed both code and stored data. What must a safe return to the old version consider?",
  "Whether the old code can read the data and how the data can be recovered.",
  "Only undoing the latest code change.",
  "Deleting the database immediately.",
  "Return your throwaway local project to its earlier code. Check whether it can still read the data."
 ],
 "d10": [
  "You want to share a booking demo. What should you check first?",
  "A saved booking, invalid details, access permissions and failed saves.",
  "Only whether the homepage looks finished.",
  "Normal bookings work, but retries create two bookings. Is this ready to share?",
  "Fix and test the duplicate-booking path before calling it ready.",
  "Share it because the normal booking passed.",
  "Hide the retry button without changing the server.",
  "Run a lost-response retry through the whole local booking flow and record the stored row count."
 ],
 "f1": [
  "A short film follows someone trying to return a lost wallet. What gives them a story?",
  "Something they want, a problem, and a choice that matters.",
  "Only a detailed description of their clothes.",
  "Your story summary names a rider and a lost card but gives the rider no choice. What should you add?",
  "A decision with a result the viewer can see.",
  "A longer camera-equipment list.",
  "An explanation of every event in the rider’s past.",
  "Record two versions of the character’s decision and compare which consequence a viewer can identify."
 ],
 "f2": [
  "You film a story without dialogue. What should each shot add?",
  "Something new the viewer can understand about the story.",
  "Another pretty angle with no story change.",
  "A viewer thinks the final shot happened earlier in the story. What should you change first?",
  "The visual links that show the order and result of each action.",
  "More unrelated shots of the location.",
  "Make every shot the same length.",
  "Show your silent cut to a willing viewer, record their inferred order and repair a misunderstood transition."
 ],
 "f3": [
  "You mix real footage with added images. When is filming a scene especially useful?",
  "When you need a particular human performance or matching physical action.",
  "Whenever mentioning AI would be inconvenient.",
  "An added AI shot changes the actor’s face and movement between real shots. What should the replacement protect?",
  "The same person, performance and movement; reshoot or redesign the added shot.",
  "Keep it because it looks like an expensive film.",
  "Add unrelated shots to distract the viewer.",
  "Compare a filmed shot and an image you made in your sequence. Record a mismatch you corrected."
 ],
 "f4": [
  "A character talks about packing a bag but wants someone to stay. What shows the unspoken feeling?",
  "Their words and actions hint at what they really want.",
  "They explain every feeling directly.",
  "Two characters explain all their feelings directly. How can their conversation suggest more than it says?",
  "Give them different goals and let actions or avoided answers show the tension.",
  "Add a longer explanation before the scene.",
  "Replace every line with a proverb.",
  "Record the conversation twice with different unspoken goals. Note which action changes the meaning."
 ],
 "f5": [
  "You direct an actor playing someone who wants a friend to stay. Which instruction gives them an action?",
  "Persuade your friend to stay.",
  "Be more emotional.",
  "An actor repeats the same sad face after each instruction. What should you try next?",
  "Give a specific action toward another character and watch its effect.",
  "Ask for twice as much sadness.",
  "Describe the final colour treatment.",
  "Record two takes with different clear actions and compare what actually changes."
 ],
 "f6": [
  "You choose a place to film a scene. What should you check about its light?",
  "What the light actually looks like at the planned filming time.",
  "Only whether the place looks nice in a photo.",
  "Window light changes halfway through filming. What helps the shots still match?",
  "Change the order or control the light, then check matching test shots.",
  "Ignore it because the room is the same.",
  "Promise that AI will fix every lighting change.",
  "Take real test frames at two times and revise your lighting or shot order based on the observed change."
 ],
 "f7": [
  "You edit two dialogue clips in the same room. Why record the room’s background sound?",
  "To keep background sound consistent between the clips.",
  "To replace every character’s voice.",
  "Dialogue edits sound like different rooms, although the scene stays in one place. What should you check?",
  "The background room sound and the joins between dialogue clips.",
  "Only the title music volume.",
  "Whether the camera moved fast enough.",
  "Edit two real dialogue clips with and without room tone; report the audible difference and your fix."
 ],
 "f8": [
  "You edit a scene with a surprise ending. What can build tension?",
  "Choose what viewers learn and when they learn it.",
  "Use every shot in the order it was filmed.",
  "Your fast edit feels confusing instead of tense. What must the next version keep clear?",
  "Where people are and how one action leads to the next.",
  "Make every shot even shorter.",
  "Add a transition between every shot.",
  "Export two cuts with different timing and record what a willing viewer understands before revising."
 ],
 "f9": [
  "You plan a one-day shoot at several places. What makes the schedule practical?",
  "Allow for real light, people, travel and setup time.",
  "Assume every shot takes the same time.",
  "A sunset shot and an indoor shot compete for the last hour. Which should guide the schedule?",
  "Protect the short sunset light and move flexible indoor work around it.",
  "Always film in script order.",
  "Remove all setup and travel time.",
  "Time one actual setup and revise your schedule with a buffer and a light-dependent priority."
 ],
 "f10": [
  "You explain your film idea to someone who might help. What should be clear?",
  "The story, who it is for, and a realistic way to make it.",
  "Only how impressive it will look.",
  "Your film pitch needs a location you cannot access. What makes the plan believable?",
  "Show an available alternative and what you learned from a small test shoot.",
  "Keep the location and hide the access problem.",
  "Claim a larger budget without proof.",
  "Record a short pitch, test the constrained scene locally and revise the pitch using the actual result."
 ],
 "v1": [
  "You draw three pictures for a story. What helps a viewer follow them?",
  "One clear change they can understand across the pictures.",
  "Three unrelated attractive pictures.",
  "A viewer understands each picture but cannot connect the three. What should you change first?",
  "Their order and the details showing one connected change.",
  "Only make the images higher resolution.",
  "Add more unrelated pictures.",
  "Show the sequence without a spoken explanation and record where a viewer loses the intended change."
 ],
 "v2": [
  "You ask someone or an image tool to make a library poster. What helps them?",
  "Clear details about the subject, place, viewers and intended message.",
  "Only the words make it beautiful.",
  "AI makes the image style you asked for, but viewers get the wrong message. What should the next instructions focus on?",
  "The intended message and clear checks for whether the image communicates it.",
  "A longer list of style words.",
  "More detail in every part of the image.",
  "Make two images from your instructions. Compare their message and improve one check for whether they communicate it."
 ],
 "v3": [
  "You write a poster invitation. What should the main line connect?",
  "Who it is for, what they should feel, and what to do next.",
  "A clever slogan without a clear reader or next step.",
  "A recycling poster gets attention, but people do not know which bin to use. What should change?",
  "Show the specific sorting action the viewer should take.",
  "Make the headline more abstract.",
  "Remove every instruction to reduce clutter.",
  "Show your real design to a reader and record whether they can identify the exact next action."
 ],
 "v4": [
  "You make an event poster. What should stand out first?",
  "The most important message or next action.",
  "Every detail equally.",
  "People notice a poster’s decoration but miss the event date and next step. What change should you test?",
  "Use size, position or light-dark contrast to lead them to the key details.",
  "Add another decorative image.",
  "Make every line look equally important.",
  "Show the design for five seconds before and after changing the layout. Record what the reader remembers."
 ],
 "v5": [
  "You make a flyer that people must read quickly. What text choice helps?",
  "Readable text size and a clear light-dark difference from the background.",
  "Small pale text because it looks subtle.",
  "A design works in colour but loses its meaning in black and white. What should you add?",
  "Words, shapes or positions so meaning does not depend only on colour.",
  "More similar colour shades.",
  "A note telling viewers to buy a better screen.",
  "View your saved design in black and white and on a phone. Fix a detail that loses its meaning."
 ],
 "v6": [
  "You make a chart for a shop owner. What makes it fair?",
  "Clear labels and a scale that shows the actual values honestly.",
  "A cut-off scale chosen only to make the difference look huge.",
  "A chart says a rise is huge, but its scale starts just below the smaller number. What should you revise?",
  "Use a fair scale and a headline that matches the actual change.",
  "Remove the number labels.",
  "Make the bars wider to exaggerate the claim.",
  "Create both scale choices using the actual figures and record how the comparison changes before revising."
 ],
 "v7": [
  "You make five slides for a bakery. What should each slide do?",
  "Add one clear step toward the final action.",
  "Repeat the same point with a different background.",
  "Readers stop before the last slide because three middle slides repeat one point. What should you test?",
  "Combine repeated points and see whether the shorter story stays clear.",
  "Add more slides before the last step.",
  "Make the final instruction smaller.",
  "Show a real exported carousel and a shorter edit to a reader; record where the story or action becomes clearer."
 ],
 "v8": [
  "You want to use an AI-made shop picture. What should you check?",
  "Visible mistakes, whether it fits the purpose, and permission for relevant material.",
  "Only whether it catches the eye.",
  "A polished image has unreadable product words and a logo you have no permission to use. What should happen?",
  "Fix or replace the image and resolve permission before using it.",
  "Crop only the small unreadable words.",
  "Assume AI images have no permission issues.",
  "Inspect the actual image at export size, correct a visible defect and document the usage decision."
 ],
 "v9": [
  "You explain a project in three slides. What should they connect?",
  "A problem, an idea supported by facts, and a clear next step.",
  "Three unrelated themes to impress everyone.",
  "A pitch promises a result its facts do not support. What makes the next version stronger?",
  "Limit the promise to what the facts support and give a realistic next step.",
  "Make the promise larger.",
  "Hide the facts slide during questions.",
  "Record your pitch. Find a promise you cannot support and show the corrected version."
 ],
 "v10": [
  "You make five campaign pictures. What helps them feel like one message?",
  "The same audience, connected ideas and one final action.",
  "A different audience and goal in each picture.",
  "The first pictures speak to one audience, but the last instruction is for another. What should you change?",
  "Make the whole sequence serve one audience and one intended action.",
  "Keep both audiences without changing anything.",
  "Add an unrelated ending.",
  "Test the exported five-frame sequence without explanation and revise the frame where the intended action becomes unclear."
 ]
};

export function missionForLevel(m:Mission,value:unknown):Mission{
 const level=startingLevel(value);if(m.practiceLevel===level)return m;
 const base=m.levelBase||{question:m.question,options:m.options,explanation:m.explanation,task:m.task};
 const row=cases[m.id];if(!row)return {...m,practiceLevel:level};
 const experienced=level==='experienced';
 const q=experienced?row[3]:row[0],right=experienced?row[4]:row[1];
 const distractors=experienced?[row[5],row[6],row[2]]:[row[2],row[5],row[6]];
 const options=[...distractors];options.splice(m.answer,0,right);
 const levelTask=level==='beginner'?'Follow the steps one at a time. Write what really happened and one thing you improved.':level==='practising'?'Try it again after changing one input or design choice. Compare what actually happened.':row[7];
 return {...m,levelBase:base,practiceLevel:level,levelTask,question:level==='practising'?base.question:q,options:level==='practising'?base.options:options,explanation:level==='practising'?base.explanation:right+'. Try this decision in your own work.',task:base.task+'\n'+levelTask};
}
