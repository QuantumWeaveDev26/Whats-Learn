import type {Mission} from './missions';
type Entry=Omit<Mission,'level'>;
/** Missions 4 to 10 (marketing), 3 to 10 (development), 4 to 10 (filmmaking) and 3 to 10 (storytelling). With the earlier missions, each course has 10.
 *  Every mission has exactly two questions: the knowledge check (question, options) and the practical task (task). */
export const courseMissions:Entry[]=[
 {
  "id": "m4",
  "track": "marketing",
  "title": "Ask customers fair questions, not leading ones",
  "skill": "Customer research",
  "minutes": 12,
  "brief": "The Bengaluru home-meal service wants to understand why office-goers skip lunch subscriptions. You have a chance to speak to five people near a tech park in Whitefield. Your first draft question was “Don’t you think home food is healthier?”",
  "lesson": "A leading question hints at the answer you hope to hear, so people agree to be polite. A yes/no question gives you one word and no reasons. An open question, such as “Tell me about your last weekday lunch”, invites a story with real detail. Ask about past behaviour, not future promises, and then stay quiet and listen. Before your next interview, rewrite every question so it cannot be answered with one word.",
  "example": "Leading: “Wouldn’t you like a cheaper lunch?” Fair and open: “How did you decide what to eat for lunch yesterday?”",
  "task": "Write five interview questions for these office-goers. Make each one open and neutral. Then pick one question and explain in your own words why it is fairer than a yes/no version. Write 60–120 words.",
  "checks": [
   "Five questions are written",
   "Every question is open-ended",
   "No question hints at an answer",
   "Questions ask about past behaviour",
   "I explained why one is fairer"
  ],
  "question": "Why is an open question usually better than a yes/no question in customer research?",
  "options": [
   "It is quicker to ask and easier to count",
   "It makes the customer feel the product is good",
   "It brings out reasons and unexpected stories"
  ],
  "answer": 2,
  "explanation": "Open questions bring out reasons, habits and problems in the customer’s own words. A yes/no answer only confirms what you already assumed."
 },
 {
  "id": "m5",
  "track": "marketing",
  "title": "Test one change at a time in an A/B test",
  "skill": "Message testing",
  "minutes": 14,
  "brief": "A college tech club is promoting a free Saturday workshop on Canva design. It has two possible headlines for its Instagram post and can show each to about 300 followers over three days. The club wants to learn which one gets more students to register.",
  "lesson": "An A/B test compares two versions that differ in exactly one thing, such as the headline or the call to action. If you change several things, you cannot tell which change caused the result. Choose one metric before you start, such as registrations per 100 views. Also decide in advance what result would make you switch, for example “B must beat A by at least 5 registrations”. Small audiences give noisy results, so treat the outcome as guidance, not proof.",
  "example": "Version A: “Free design workshop this Saturday”. Version B: “Learn Canva in one afternoon, free”. Same image, same time of posting, same button.",
  "task": "Plan an A/B test for the club’s post. State the one thing you will change and write both versions. Name the single metric and the result that would make you pick version B. Explain why you keep everything else the same. Write 70–130 words.",
  "checks": [
   "Only one element is changed",
   "Both versions are written out",
   "One clear metric is named",
   "A switch rule is set in advance",
   "I explained why the rest stays equal"
  ],
  "question": "What makes an A/B test result easy to trust and act on?",
  "options": [
   "Only one thing changes and the switch rule is set first",
   "Several things change so the best version wins faster",
   "The metric is chosen after seeing which version looks better"
  ],
  "answer": 0,
  "explanation": "Changing one thing links the result to that change, and deciding the rule early stops you from bending the numbers afterwards."
 },
 {
  "id": "m6",
  "track": "marketing",
  "title": "Choose one channel and justify the choice",
  "skill": "Channel choice",
  "minutes": 14,
  "brief": "A small Mysuru bakery wants more orders for birthday cakes from families nearby. It has a budget of ₹3,000 for the month and one person to manage marketing. The owner is unsure whether to use WhatsApp, Instagram, search ads, a notice board or email.",
  "lesson": "Pick a channel by asking three questions. Where does this audience already spend time and pay attention? What does it cost in money and effort for you? Can you measure what it brings? A channel that fits the audience but cannot be measured makes learning hard. Choose one channel to begin with, run it well, and add another only after you have a clear result.",
  "example": "For students who live in one hostel, a college notice board costs almost nothing, reaches them daily and can be measured with a simple code word.",
  "task": "Choose one channel for the bakery and name it. Justify it using audience behaviour, cost and how you would measure results. Mention one channel you rejected and why. Write 70–130 words.",
  "checks": [
   "One channel is clearly chosen",
   "I described how the audience behaves",
   "Cost and effort are considered",
   "A way to measure is stated",
   "One rejected option has a reason"
  ],
  "question": "Which reason best supports choosing a marketing channel?",
  "options": [
   "It is the newest platform everyone is talking about",
   "It reaches the audience and can be measured",
   "Large brands use it, so it must work for us"
  ],
  "answer": 1,
  "explanation": "A good channel reaches your audience, fits your budget and gives numbers you can learn from. Popularity alone does not guarantee any of these."
 },
 {
  "id": "m7",
  "title": "Find the number that deserves your effort first",
  "track": "marketing",
  "skill": "Measuring results",
  "minutes": 15,
  "brief": "A Chennai coaching centre ran a ₹6,000 Instagram campaign for its spoken-English course. It got 4,000 clicks, 200 WhatsApp conversations and 24 qualified enquiries, meaning people in the right age group who asked about fees and batch timings. The owner says, “4,000 clicks is great!”",
  "lesson": "Not every number tells you the same thing. Clicks show interest, conversations show contact, and qualified enquiries show people who might really buy. To find cost per qualified enquiry, divide total spend by qualified enquiries. Then look at each step to see where most people drop off, and improve that step first. Do not celebrate a big number that sits far from the outcome you want.",
  "example": "If ₹2,000 brings 10 qualified enquiries, the cost per qualified enquiry is ₹2,000 ÷ 10 = ₹200.",
  "task": "Calculate the cost per qualified enquiry for the centre. Show your working. Then say which number or step you would improve first and give one reason. Write 60–120 words.",
  "checks": [
   "I divided spend by qualified enquiries",
   "The final amount is shown in ₹",
   "I compared steps from click to enquiry",
   "I named one number to improve first",
   "My reason uses the figures given"
  ],
  "question": "What does “cost per qualified enquiry” tell a marketer?",
  "options": [
   "How many people saw the advertisement today",
   "How much the last click cost on average",
   "What it costs to win one likely customer"
  ],
  "answer": 2,
  "explanation": "It divides spend by the number of people who are a real fit and asked. It shows the price of a useful result, not just attention."
 },
 {
  "id": "m8",
  "track": "marketing",
  "title": "Plan two weeks of content you can really keep up",
  "skill": "Content planning",
  "minutes": 15,
  "brief": "A final-year student runs a small Instagram page selling handmade diyas and festive gift hampers before Diwali. She has college classes and exams, so she can spend about four hours a week on content. She wants a plan that stays steady for two weeks.",
  "lesson": "A content plan starts with one theme, such as “gifts made by hand”, so every post supports the same message. Mix formats, for example a photo, a short reel, a story and a message to existing customers. Make one core idea once, then reuse it in several places instead of inventing something new each day. Schedule fewer posts than you think you can manage, and include rest days. A plan you keep is better than a perfect one you abandon.",
  "example": "One idea, a behind-the-scenes diya painting clip, becomes a reel, three photos for stories and a short WhatsApp status.",
  "task": "Create a two-week plan for the page. State the single theme, list the formats you will use, and name the one idea you will reuse in at least three places. Give a weekly schedule with rest days and explain why it is realistic. Write 80–150 words.",
  "checks": [
   "One theme is stated",
   "At least three formats are listed",
   "One idea is reused in three places",
   "The schedule includes rest days",
   "I explained why it is realistic"
  ],
  "question": "Which plan is most likely to be kept for two weeks?",
  "options": [
   "Three posts a week, one idea reused, rest days",
   "A new post every day in a different style, always",
   "Waiting to post until the content feels perfect"
  ],
  "answer": 0,
  "explanation": "A modest schedule with reused ideas and rest days fits real time and energy. Daily new content burns people out quickly."
 },
 {
  "id": "m9",
  "track": "marketing",
  "title": "Spot a risky ad claim and rewrite it honestly",
  "skill": "Responsible marketing",
  "minutes": 15,
  "brief": "A Hyderabad start-up sells a ₹1,499 online resume course. Its draft ad says, “Guaranteed job in 30 days! Only 3 seats left! See what Priya got: ₹12 lakh offer!” The team also plans to add everyone who downloaded a free PDF to a WhatsApp promotions list.",
  "lesson": "Responsible marketing means you can support every claim and treat people fairly. Watch for guarantees you cannot control, fake urgency like “only 3 seats left” when seats are not limited, and testimonials that are invented or used without permission. Ask for consent before adding someone to a list, say what you will send, and make it easy to opt out. Collect only the data you need and keep it private. Review AI-written copy yourself, because it can sound confident while being false.",
  "example": "Risky: “Lose 5 kg in a week, guaranteed.” Honest: “Join our 4-week walking group and build a daily habit.”",
  "task": "Name three problems in the draft ad and the list plan. Then rewrite the ad line honestly in one or two sentences. Add one plain sentence on how you would ask for consent and allow opt-out. Write 70–130 words.",
  "checks": [
   "I found three separate problems",
   "I named the unsupported claim",
   "I rewrote the line honestly",
   "I mentioned consent in plain words",
   "I included an easy opt-out"
  ],
  "question": "Which choice is the most responsible way to build a WhatsApp promotions list?",
  "options": [
   "Add everyone who ever visited the website",
   "Ask people to opt in and let them leave",
   "Add them first and offer removal much later"
  ],
  "answer": 1,
  "explanation": "People should agree before receiving messages, know what to expect and be able to stop at any time. Adding them first ignores their choice."
 },
 {
  "id": "m10",
  "track": "marketing",
  "title": "Capstone: build a one-page campaign plan",
  "skill": "Campaign planning",
  "minutes": 18,
  "brief": "A student team is helping a small Pune tiffin service attract more working women in nearby PG accommodations. The owner has ₹5,000 and four weeks. You must turn what you have learned into one clear page the owner can follow.",
  "lesson": "A strong campaign plan fits on one page and links its parts together. It names the customer and their problem, a simple offer, one channel, one test, one success metric and one risk. Each part should support the others, for example the channel must reach the customer and the metric must be countable there. Keep the plan small enough to start this week. Check your claims and consent practices before you publish anything.",
  "example": "Customer: night-shift nurses near a hospital. Offer: warm dinner boxes delivered by 9 pm. Channel: a notice board in the staff room.",
  "task": "Write the one-page plan with these labelled parts: customer, offer, channel, one test, one success metric and one risk with how you would reduce it. Make sure each part connects to the next. Write 90–160 words.",
  "checks": [
   "All six parts are labelled",
   "The channel reaches the customer",
   "The test changes only one thing",
   "The metric is single and countable",
   "The risk has a clear fix"
  ],
  "question": "What makes a one-page campaign plan hang together?",
  "options": [
   "Each part supports the next, to the metric",
   "It lists as many channels as the budget allows",
   "It uses polished wording in every single section"
  ],
  "answer": 0,
  "explanation": "A plan works when the customer, offer, channel, test and metric all point the same way. Extra channels and fancy words do not create that link."
 },
 {
  "id": "d3",
  "track": "development",
  "title": "Choose the records and fields for a booking system",
  "skill": "Data modelling",
  "minutes": 14,
  "brief": "A Bengaluru maths tutor is moving trial-class bookings from WhatsApp messages into a small web app. She teaches several batches a week and each batch has limited seats. You are asked to plan what the app stores before anyone generates code.",
  "lesson": "A data model lists the things your app remembers (records) and the facts about each one (fields). Give every record a unique identifier, and decide which field must never repeat, such as one seat in one batch for one student. Mark personal data, like a parent’s phone number, as private so it is never shown to other users. Ask AI to suggest a model only after you have written these rules in plain words.",
  "example": "For a hostel mess feedback form, one record is a Feedback entry with a meal, a rating and a date. The same student should not submit two ratings for the same meal on the same day.",
  "task": "Name the records for the tutor’s booking app and list the main fields of each. State which field or combination must be unique and why. Name two fields that are private and say who may see them. Write 60–130 words.",
  "checks": [
   "Name at least two separate records",
   "List fields for each record",
   "State what must be unique",
   "Explain why it must be unique",
   "Mark two private fields"
  ],
  "question": "Which rule best prevents two parents from booking the same last seat in a batch?",
  "options": [
   "Show a note saying seats are limited",
   "Store each seat in a batch only once",
   "Ask parents to phone before booking online"
  ],
  "answer": 1,
  "explanation": "A uniqueness rule in the stored data is enforced every time, even if two people click at once. Messages and phone calls rely on people behaving perfectly."
 },
 {
  "id": "d4",
  "track": "development",
  "title": "Define one endpoint before asking AI to build it",
  "skill": "API contract",
  "minutes": 14,
  "brief": "A college events team in Pune is building a sign-up page for a weekend coding workshop. The page will send a request to a server when a student presses Register. Before any code is generated, the team wants the request and replies agreed in writing.",
  "lesson": "An API contract describes one endpoint in words: its action, the inputs it needs, what it returns on success and what it returns on failure. Each error reply should say what went wrong and use a clear status meaning, such as invalid input or already registered. When the contract is written first, the browser team and the server team can work separately and AI has far less room to guess. Write the contract, then give it to the assistant as the instruction.",
  "example": "For a hostel mess feedback form, the action is Submit feedback. It needs meal, rating and comment, and replies with a saved confirmation. One error is a rating outside one to five.",
  "task": "Define the Register endpoint in words. Give its action, the inputs it needs, the success reply, and two different error replies with when each happens. Add one sentence on why you wrote this before generating code. Write 70–140 words.",
  "checks": [
   "State the action clearly",
   "List every required input",
   "Describe the success reply",
   "Give two distinct error replies",
   "Explain why contract comes first"
  ],
  "question": "What belongs in an API contract for one endpoint?",
  "options": [
   "Colours and fonts used across the page",
   "The database brand and server size chosen",
   "Inputs, success reply and error replies"
  ],
  "answer": 2,
  "explanation": "A contract defines what goes in and what comes out, including failures. Design and hosting choices are separate decisions."
 },
 {
  "id": "d5",
  "track": "development",
  "title": "Decide which checks run in the browser and server",
  "skill": "Input validation",
  "minutes": 14,
  "brief": "A small shop in Jaipur lets customers place a pickup order from a simple web form. Customers enter name, phone number, item and quantity. The owner wants wrong entries stopped early, but also wants the shop protected from bad or fake requests.",
  "lesson": "Browser checks give fast, friendly feedback, such as a missing field or a phone number that is too short. They can be bypassed, so they are only a convenience. Every rule that protects money, stock or other people’s data must run again on the server. A good error message names the problem and the fix in plain words, without blaming the user or exposing internal details.",
  "example": "On a mess feedback form, the browser can warn if no meal is chosen. The server must still refuse a rating of 50 or feedback sent for a meal that does not exist.",
  "task": "List two checks you would run in the browser and two that must run on the server for the order form, with a reason for the server ones. Then write two user-friendly error messages for two different mistakes. Write 70–140 words.",
  "checks": [
   "Two browser checks are listed",
   "Two server checks are listed",
   "Reasons for server checks are given",
   "Both error messages are polite",
   "Messages say how to fix it"
  ],
  "question": "Why must important checks run on the server as well?",
  "options": [
   "Requests can bypass the page, so servers must check",
   "Servers are able to show prettier messages than pages",
   "Browsers are unable to check any text fields at all"
  ],
  "answer": 0,
  "explanation": "Anyone can send a request without using your page, so browser checks can be skipped. The server is the final guard for important rules."
 },
 {
  "id": "d6",
  "track": "development",
  "title": "Debug with AI: find the cause, not just a patch",
  "skill": "Debugging with AI",
  "minutes": 15,
  "brief": "A tutor’s booking page shows the message “Booking confirmed” to parents, but when she opens her list of bookings the new entry is missing. Two parents have complained today. You are asked to plan how to find the cause with an AI assistant’s help.",
  "lesson": "Debugging means narrowing down where the problem happens. First reproduce it, then check each stage in order: what the browser sent, whether the server received it, and whether the data was stored. Give the assistant evidence: the exact steps, what you expected, what happened, and any error text with private details removed. Never share passwords, API keys, tokens or customers’ personal data, because they may be stored or leaked. Treat the assistant’s answer as a theory and test it before you trust it.",
  "example": "If a feedback form says Thank you but the warden sees nothing, check whether the server received the request before looking at the database or the page text.",
  "task": "List four steps, in order, to isolate why the confirmation shows but the booking is not saved. Say what evidence you would give the AI assistant and what you would remove first. Explain why you would not paste secrets. Write 80–150 words.",
  "checks": [
   "Steps are in a sensible order",
   "Reproduce the problem first",
   "Evidence is specific and useful",
   "Private details are removed",
   "Reason for not pasting secrets"
  ],
  "question": "What is the best first step when a bug is reported?",
  "options": [
   "Rewrite the whole booking page with AI",
   "Reproduce it and note exact steps",
   "Ask the assistant to guess without any details"
  ],
  "answer": 1,
  "explanation": "Reproducing the bug shows when it happens and gives evidence to test a fix. Rewriting or guessing may hide the real cause."
 },
 {
  "id": "d7",
  "track": "development",
  "title": "Who you are versus what you may do",
  "skill": "Access control",
  "minutes": 15,
  "brief": "A tutor’s booking app lets parents log in, view their child’s bookings, and cancel or change them. During review, someone notices that changing a booking number in the page address shows another family’s booking. You must explain the gap and propose fixes.",
  "lesson": "Authentication answers who you are, usually by logging in. Authorisation answers what you are allowed to do once the system knows who you are. A logged-in user is not allowed everything. For every action on stored data, the server must check that the record belongs to that user, or that the user has a special role such as tutor. The check must happen on the server, not only by hiding buttons.",
  "example": "In a hostel app, a student who logs in can edit only their own feedback. A warden role can read all feedback but cannot edit a student’s words.",
  "task": "Explain in your own words the difference between authentication and authorisation for this app. Then write two rules that stop one parent from changing or viewing another parent’s booking. Say where each rule is enforced. Write 80–150 words.",
  "checks": [
   "Authentication is explained correctly",
   "Authorisation is explained correctly",
   "Two separate rules are written",
   "Each rule says where it runs",
   "Rules fit the booking example"
  ],
  "question": "A parent is logged in and changes a booking number to a stranger’s. What should happen?",
  "options": [
   "Allow it, since the parent has logged in successfully",
   "Hide the cancel button on the page only",
   "Refuse it: the booking is not theirs"
  ],
  "answer": 2,
  "explanation": "Logging in proves identity but not ownership. The server must check ownership on every request, because buttons can be bypassed."
 },
 {
  "id": "d8",
  "track": "development",
  "title": "Write three test cases for one booking rule",
  "skill": "Writing tests",
  "minutes": 14,
  "brief": "A tutor’s batch has ten seats, and the booking rule says: a new booking is accepted only if seats are still free. The team wants tests written before the next change goes out. You are asked to design test cases in plain words, not code.",
  "lesson": "A test case states a situation, the action taken, and the exact result you expect. Cover three kinds: a normal case that should work, a boundary case at the exact limit, and a failure case that should be refused. Boundaries matter because mistakes often hide at the edge, such as the last seat. Automate first the test that protects the most important or most often changed rule, because it repeats safely every time.",
  "example": "For a mess feedback rule that ratings run from one to five: a rating of three is normal, five is the boundary, and six must be refused with a clear message.",
  "task": "Write three test cases for the seat rule: one normal, one boundary and one failure. Give the situation and expected result for each. Say which one you would automate first and why. Write 80–150 words.",
  "checks": [
   "One normal case is written",
   "One boundary case is written",
   "One failure case is written",
   "Expected results are exact",
   "Automation choice has a reason"
  ],
  "question": "Which test case checks a boundary of the seat rule?",
  "options": [
   "Booking when nine of ten seats are gone",
   "Booking with an empty name field in the form",
   "Booking when five of ten seats are taken"
  ],
  "answer": 0,
  "explanation": "With nine of ten taken, exactly one seat is left, so the test sits at the edge of the rule. The other cases are not at the limit."
 },
 {
  "id": "d9",
  "track": "development",
  "title": "Plan a safe change with branches and rollback",
  "skill": "Version control",
  "minutes": 14,
  "brief": "A tutor’s booking app is live with real parents. She now wants a new field on the booking form, a preferred language for the class. You are the developer and must plan the change so a mistake cannot break bookings for everyone.",
  "lesson": "Version control records every change so you can compare, review and undo it. Work on a separate branch, so the live version stays untouched until the change is ready. Make small commits, each with a clear message, so a problem can be traced to one step. Get someone to review before merging, and know your rollback step in advance. Small changes are safer because there is less to test, review and undo.",
  "example": "To add a rating comment to a feedback form, make a branch, commit the new field, commit the saving step, and ask a friend to review before merging.",
  "task": "Plan the preferred-language change in order: name your branch idea, list three small commits, say who reviews and what they check, and write your rollback step. Explain why small changes are safer. Write 80–150 words.",
  "checks": [
   "Work happens on a separate branch",
   "Three commits are small and clear",
   "Review step names what is checked",
   "Rollback step is clear",
   "Reason for small changes is given"
  ],
  "question": "Why is a small change safer than a large one?",
  "options": [
   "It needs no testing at all, ever",
   "It saves storage space on the server",
   "Easier to review, test and undo"
  ],
  "answer": 2,
  "explanation": "Less changed means fewer places for a bug to hide and a simpler undo. No change is exempt from testing."
 },
 {
  "id": "d10",
  "track": "development",
  "title": "Capstone: a pre-launch checklist for the booking app",
  "skill": "Launch readiness",
  "minutes": 18,
  "brief": "The tutor’s booking app is ready for its first fifty families next week. It has login, a booking form, a stored list of bookings and a confirmation message. As the developer, you must decide whether it is safe to launch and what to fix before the date.",
  "lesson": "A pre-launch checklist turns worry into specific questions across five areas: security, tests, privacy, error handling and monitoring. For each, write one check you can answer yes or no, such as whether another family’s booking can be opened. Then rank the gaps by harm and likelihood, and fix the riskiest first. Monitoring matters because you need to learn about failures before parents report them. Use AI to suggest items, then verify each one yourself.",
  "example": "For a mess feedback form, one monitoring check is: will the warden be alerted if feedback stops saving for a whole day?",
  "task": "Write a launch checklist with one check each for security, tests, privacy, error handling and monitoring. Then name the one risk you would fix first and explain why. Write 100–160 words.",
  "checks": [
   "Five areas each have one check",
   "Checks are yes or no questions",
   "One risk is chosen first",
   "The reason links to harm",
   "Monitoring check names who is told"
  ],
  "question": "How should you choose which launch risk to fix first?",
  "options": [
   "Fix the easiest ones so the list looks short",
   "Rank by harm and likelihood, fix top",
   "Fix whichever the assistant mentioned first"
  ],
  "answer": 1,
  "explanation": "Harm and likelihood show which problem would hurt users most. Ease or order of mention does not reflect real risk."
 },
 {
  "id": "f4",
  "track": "filmmaking",
  "title": "Write dialogue where nobody says what they mean",
  "skill": "Dialogue & subtext",
  "minutes": 12,
  "brief": "Your film club is shooting a hostel-night scene. Two roommates share a room the night before one of them leaves for an internship in another city. Neither wants to say how much they will miss the other.",
  "lesson": "Subtext is the meaning under the words. People rarely say their deepest feeling out loud, so give each character a surface topic (a charger, a bag, a snack) and a hidden want. Keep lines short and let a pause or an object carry the feeling. If an AI tool drafts lines for you, cut any line where a character explains their own emotion.",
  "example": "A: “Take the good umbrella.” B: “It’s June. It won’t rain there.” A: “Take it anyway.” The umbrella is really about care.",
  "task": "Write an exchange of 4–6 lines between two characters in the hostel room, where at least one character does not say what they mean. Then explain in your own words what the subtext is and which object or action carries it. Write 60–120 words in total.",
  "checks": [
   "The exchange has four to six lines",
   "One character avoids saying the real feeling",
   "The surface topic is ordinary and specific",
   "An object or action carries the feeling",
   "The subtext explanation is in my words"
  ],
  "question": "Which line best uses subtext for a character who is hurt that a friend forgot her birthday?",
  "options": [
   "“Nice of you to make time today.”",
   "“I am hurt that you forgot my birthday.”",
   "“Birthdays are celebrated by many people.”"
  ],
  "answer": 0,
  "explanation": "The first line sounds polite but carries the hurt underneath. The second states the feeling directly, and the third has no emotional charge at all."
 },
 {
  "id": "f5",
  "track": "filmmaking",
  "title": "Direct an actor with actions, not emotions",
  "skill": "Directing performance",
  "minutes": 12,
  "brief": "A first-time actor from your college drama society plays a bus-stop passenger who has just failed a government exam and is waiting for a bus home. You have five minutes before the take.",
  "lesson": "Telling an actor to “look sad” asks them to fake a result. Give them an action instead: a verb or an intention they can really try, such as to hide, to avoid, to postpone, or to convince. Emotion then appears honestly as they work against an obstacle. Keep each direction short, positive and playable in one take. Ask the actor what they tried, and adjust.",
  "example": "For a nervous cousin at a wedding photo, you might say: “Try to look like you are not counting the minutes.” That gives something to do, not a mood to show.",
  "task": "Give the actor three directions for this scene, each using a verb or intention (not an emotion word like sad or angry). Then explain why this works better than saying “act sad”, using one reason from the actor’s point of view. Write 60–110 words.",
  "checks": [
   "Each direction contains a playable verb",
   "No direction names an emotion to show",
   "Directions are short and specific",
   "Directions fit the bus-stop setting",
   "I explained why from the actor’s view"
  ],
  "question": "Which direction is most useful for an actor playing someone who has just failed an exam?",
  "options": [
   "Show everyone exactly how heartbroken you feel",
   "Look as disappointed as you possibly can today",
   "Try to hide the result from whoever calls"
  ],
  "answer": 2,
  "explanation": "A hidden-result action gives the actor something concrete to attempt. The other two ask for a finished emotion, which usually produces stiff, pretend acting."
 },
 {
  "id": "f6",
  "track": "filmmaking",
  "title": "Plan a location and its light on no budget",
  "skill": "Location & light",
  "minutes": 14,
  "brief": "Your film club needs a street-food stall scene shot at dusk. You have no lighting budget, a crew of five students, and one phone camera with a small clip-on light. The stall is on a busy lane in your city.",
  "lesson": "A location plan names the time of day, the light you will use, the permission you need and the safety risks. Visit at the planned hour first and note where the sun, shop lights and shadows fall. Ask the stall owner and, where needed, local authorities in writing before filming. Always plan one backup location or time. If you use AI to preview lighting or find ideas, still verify everything on site.",
  "example": "For a library reading-room scene: shoot at 4 pm beside the east windows, ask the librarian for written permission, keep cables off walkways, and keep the college canteen as backup.",
  "task": "Plan one location for one scene. Name the time of day, the available light and how you will use it, who gives permission, one safety risk with a fix, and one backup. Explain why your time of day helps the scene. Write 70–130 words.",
  "checks": [
   "Time of day is named",
   "Available light is described",
   "Permission source is identified",
   "One safety risk has a fix",
   "A backup is included"
  ],
  "question": "What should you do first when choosing a location for a no-budget shoot?",
  "options": [
   "Book the actors first, then look at the place",
   "Visit at the hour; check light and permission",
   "Choose it by looks from a single daytime photo"
  ],
  "answer": 1,
  "explanation": "Seeing the place at the planned hour shows the real light and the real constraints. Photos taken at another time can mislead, and booking actors first locks you in too early."
 },
 {
  "id": "f7",
  "track": "filmmaking",
  "title": "Design the sound of one scene",
  "skill": "Sound design",
  "minutes": 12,
  "brief": "You are the sound designer for a short scene set in a library at closing time. A student realises she is the last person left inside, and the lights begin to go off one row at a time.",
  "lesson": "Sound tells the audience things the picture cannot: what is outside the frame, how big a space is, and what a character feels. Plan three layers: ambience (the steady background), one key effect (the sound that matters most), and music or deliberate silence. Silence is a choice, not an absence. Record clean ambience on location, because AI-made sound still needs your judgement and checking for rights.",
  "example": "For a night-bus scene, a faint engine hum and a single rattling window can say the journey is long, even if we never see the road.",
  "task": "Plan the sound of the library scene: name the ambience, the key effect, and whether you use music or silence. Then say what the sound tells the viewer that the picture does not show. Write 60–120 words.",
  "checks": [
   "Ambience is named",
   "One key effect is chosen",
   "Music or silence is decided",
   "I said what sound adds beyond picture",
   "The plan fits a library"
  ],
  "question": "Why might a sound designer choose silence at a key moment?",
  "options": [
   "It makes viewers lean in and feel tension",
   "It saves money on the whole film soundtrack",
   "It shows that the microphone has simply failed"
  ],
  "answer": 0,
  "explanation": "Silence after steady sound makes viewers notice the change and pay attention. Saving money is a side effect, not the creative reason."
 },
 {
  "id": "f8",
  "track": "filmmaking",
  "title": "Cut a 30-second sequence to build tension",
  "skill": "Editing rhythm",
  "minutes": 14,
  "brief": "A short film shows a delivery rider racing to hand over a parcel before a gate closes. The edit has eight shots totalling 52 seconds: wide road, rider’s hands, clock, gate guard, speedometer, rider’s face, a long shot of a tea shop, and the gate closing.",
  "lesson": "Pace is how fast the viewer receives new information. Tension builds when shots get shorter, closer and more specific as the goal gets nearer. Cut anything that does not push the story or the pressure. When cutting on action, change shot in the middle of a movement, such as a hand reaching or a foot landing, so the motion feels continuous. Keep your timeline notes so you can justify each cut.",
  "example": "In a kitchen scene, you might cut from the wide shot to a close-up while the cook is mid-way lifting a pan. The lift continues across the cut.",
  "task": "Choose which of the eight shots you keep, shorten or cut to reach about 30 seconds. Describe how the pace changes from start to end, and name one action where you would cut mid-movement and why. Write 70–130 words.",
  "checks": [
   "I named shots to keep and cut",
   "The total length is near 30 seconds",
   "Pace changes across the sequence",
   "One cut on action is described",
   "I gave a reason for each decision"
  ],
  "question": "What usually helps a sequence feel more tense as it approaches its end?",
  "options": [
   "Longer holds on every single shot in turn",
   "Extra wide shots of the scenery all around",
   "Shorter, closer shots that lift the pace"
  ],
  "answer": 2,
  "explanation": "Faster cuts and tighter framing raise urgency. Long holds and extra scenery slow the story and release pressure."
 },
 {
  "id": "f9",
  "track": "filmmaking",
  "title": "Build a one-day shoot schedule and budget",
  "skill": "Production planning",
  "minutes": 16,
  "brief": "Your film club will shoot three short scenes in one day: a bus stop scene, a street-food stall scene and a hostel room scene. You have a crew of six students, two actors and a total of ₹6,000.",
  "lesson": "A schedule orders scenes by location and light, not by story order, so the crew travels less. Set a call time, add meal and rest breaks, and keep spare time between moves. A budget lists each cost in rupees (₹) and adds a contingency, usually around 10 per cent, for surprises. Every plan trades something for something else, such as speed against quality. Share the plan with the cast and crew before the day.",
  "example": "A café scene needing morning light goes first at 8 am, a nearby park scene follows at 11, and an indoor scene fills the harsh afternoon, with lunch at 1 pm.",
  "task": "Write a one-day schedule with call time, scene order, two breaks and a rupee budget with a contingency that totals ₹6,000 or less. Then explain one trade-off you made and why. Write 80–140 words.",
  "checks": [
   "Call time is stated",
   "Scenes are in a sensible order",
   "Two breaks are included",
   "Budget lines add up in rupees",
   "Contingency and one trade-off are explained"
  ],
  "question": "Why are scenes usually scheduled by location rather than story order?",
  "options": [
   "Audiences prefer to watch films out of order",
   "It reduces travel and setup time on the day",
   "It lets actors skip learning their lines"
  ],
  "answer": 1,
  "explanation": "Grouping by location saves travel and setup, which are costly in time. Story order is restored later in the edit."
 },
 {
  "id": "f10",
  "track": "filmmaking",
  "title": "Pitch your short film on one page",
  "skill": "Film pitching",
  "minutes": 18,
  "brief": "Your college film club is applying for a small student film grant. The committee will read a one-page pitch for your short film and decide whether it is clear, filmable and responsible. You may use the rider story or another film your club could really shoot.",
  "lesson": "A good pitch lets a stranger see the film quickly. State a logline (one sentence with a character, a want and an obstacle), the audience, how live action and AI-assisted work will be combined, and one honest risk with a fix. Add a plain disclosure line about AI use and consent, such as which parts are AI-assisted and that everyone filmed has agreed. Keep promises you can really deliver, and never claim AI will guarantee the result.",
  "example": "Disclosure: “All performances are live action; AI tools were used to test colour looks, and all cast and location owners gave written consent.”",
  "task": "Write your one-page pitch with these parts: logline, audience, how live action and AI will be combined, an AI-use and consent disclosure line, and one risk with a fix. Write 100–160 words.",
  "checks": [
   "Logline has character, want and obstacle",
   "The audience is specific",
   "Live action and AI roles are clear",
   "Disclosure mentions AI use and consent",
   "The risk has a realistic fix"
  ],
  "question": "What should an AI-use disclosure line in a pitch do?",
  "options": [
   "Hide AI use so viewers stay fully focused",
   "List every AI tool brand along with its price",
   "Say what AI did and that consent was given"
  ],
  "answer": 2,
  "explanation": "Clear disclosure builds trust with viewers, cast and funders. Hiding use or listing prices does not tell people what they need to know."
 },
 {
  "id": "v3",
  "track": "storytelling",
  "title": "Link audience, feeling and action in one line",
  "skill": "Core message",
  "minutes": 10,
  "brief": "A college photography club in Pune wants first-year students to join its Saturday photo walks. The club has a small budget and will post one poster on Instagram. You need the single message that poster will carry.",
  "lesson": "A strong visual story starts with three choices: one audience, one feeling and one action. Pick the feeling you want them to have, such as curiosity or belonging, and the one thing you want them to do next. Then join all three in a single line a stranger could repeat. If you cannot say it in one line, the visuals will feel confused too.",
  "example": "For night-shift nurses: feel looked after, and book a free health check this Sunday.",
  "task": "Name one audience, one feeling and one action for the photography club. Then write a one-line message that connects all three. Explain in one or two sentences why you chose that feeling instead of another. Write 40–80 words.",
  "checks": [
   "One audience is named",
   "One feeling is chosen",
   "One action is clear",
   "The message is a single line",
   "I explained my choice of feeling"
  ],
  "question": "Which message best connects an audience, a feeling and an action?",
  "options": [
   "Photography is a wonderful art form for everyone here",
   "We have cameras, walks, friends and many fun events",
   "New? Come walk with us and see your city differently"
  ],
  "answer": 2,
  "explanation": "The third option speaks to a specific audience, suggests curiosity and gives a clear invitation. The others describe the club without asking anyone to do anything."
 },
 {
  "id": "v4",
  "track": "storytelling",
  "title": "Plan a poster the eye can read in seconds",
  "skill": "Visual composition",
  "minutes": 12,
  "brief": "The Bengaluru neighbourhood library is hosting a Friday evening open-mic night for young adults. It needs a poster that people can understand while walking past a notice board. You will describe the layout in words.",
  "lesson": "Good composition gives the eye one place to start. Choose a single focal point, make it stand out through size, contrast or empty space around it, and decide where the eye travels next, usually from the main image to the headline to the details. Leave out anything that does not support the message, because every extra element competes for attention. Describe your layout as an order of reading, not a list of objects.",
  "example": "A large lantern sits in the upper third on a dark background. The eye moves down to a bold date, then to a small line with the venue.",
  "task": "Describe the poster layout: the focal point, one contrast you use, and the path the eye follows in three steps. Then name one thing you left out and explain why. Write 60–110 words.",
  "checks": [
   "One focal point is named",
   "A contrast is described",
   "The eye path has three steps",
   "One omission is named",
   "The reason for leaving it out is clear"
  ],
  "question": "What is the main job of a focal point on a poster?",
  "options": [
   "To show every detail of the event on the page",
   "To give the eye one clear place to start",
   "To fill the empty space on the page evenly"
  ],
  "answer": 1,
  "explanation": "A focal point guides attention first, so the rest of the poster can be read in order. Showing everything or filling space makes the poster harder to read."
 },
 {
  "id": "v5",
  "track": "storytelling",
  "title": "Choose colour and type people can actually read",
  "skill": "Accessible design",
  "minutes": 14,
  "brief": "A local NGO in Chennai is posting a flyer asking residents to donate books for a school library. The flyer will be read on older phones and printed in black and white at a nearby shop. Many readers are older adults or have weak eyesight.",
  "lesson": "Choose a colour mood that fits the audience, such as warm and hopeful, then check that text stands out clearly from its background. Dark text on a light background, or the reverse, is usually safer than two mid-tones. Use a plain, large typeface, and never rely on colour alone to carry meaning, because some people cannot tell certain colours apart. Test by squinting or viewing it in greyscale: if the key words vanish, change them.",
  "example": "A cooking class flyer uses deep brown text on cream paper, large sans-serif headings and an underline plus an icon for the sign-up line.",
  "task": "Choose a colour mood and name the text and background colours. Name the type style and size you would use for the headline. Explain how you would check contrast and legibility for a reader with low vision or a poor screen. Write 60–110 words.",
  "checks": [
   "A colour mood is chosen",
   "Text and background colours are named",
   "Type style and size are described",
   "A contrast check is explained",
   "Low vision or poor screens are considered"
  ],
  "question": "Which choice is best for readers with low vision?",
  "options": [
   "Dark text on a light background in large type",
   "Light grey text on a white background, in small type",
   "Thin decorative script over a bright busy pattern"
  ],
  "answer": 0,
  "explanation": "Strong contrast and large plain type are easiest to read for most people. Pale text and decorative backgrounds reduce legibility."
 },
 {
  "id": "v6",
  "track": "storytelling",
  "title": "Turn three numbers into one honest chart story",
  "skill": "Data storytelling",
  "minutes": 14,
  "brief": "The neighbourhood library has three numbers from its monthly report: 420 young adult visits in March, 510 in April and 640 in May, after it started weekend reading circles. You want to show this on one social post without overselling the result.",
  "lesson": "Start with the finding, not the chart: write the headline as one plain sentence about what changed. Pick the chart type that shows that change simply, such as a line or bars for change over time. Keep the axis starting at zero for bars so the difference is not stretched, and write a caption that states what the numbers show without claiming more than they prove. A rise after an event is a fact; saying the event caused it needs more evidence.",
  "example": "Headline: Evening class sign-ups rose each month. Chart: three bars from zero. Caption: Sign-ups were 80, 95 and 110 from June to August.",
  "task": "Write the headline finding, name the chart type and say why it fits, and write one caption of up to 25 words. Explain one way you avoided exaggeration. Write 40–80 words.",
  "checks": [
   "The headline is one plain sentence",
   "The chart type is named",
   "The reason for the chart is clear",
   "The caption is short and accurate",
   "I avoided overclaiming"
  ],
  "question": "Which caption is the most honest for the library’s numbers?",
  "options": [
   "Reading circles tripled our visitors for good, thanks to us",
   "Our circles are the only reason that people came here",
   "Young adult visits rose from 420 in March to 640 in May"
  ],
  "answer": 2,
  "explanation": "The third caption states exactly what the numbers show. The others claim a cause or a size of change that the data does not prove."
 },
 {
  "id": "v7",
  "track": "storytelling",
  "title": "Plan a five-slide carousel with one idea each",
  "skill": "Carousel structure",
  "minutes": 15,
  "brief": "A small Hyderabad bakery wants an Instagram carousel to promote its new millet cookies, made with less sugar. It wants people to order a trial box of six for ₹240. The carousel has five slides and you will plan it in words.",
  "lesson": "A carousel works like a short story: a hook that stops the scroll, a build that adds interest, proof that the claim is believable, and an invitation that tells people what to do. Give every slide exactly one idea and a short line of text, so the reader can finish it in seconds. Make the first slide a question or a surprising fact rather than your logo. Check that each slide gives a reason to swipe to the next.",
  "example": "Slide 1 asks a question about afternoon cravings. Slide 2 shows the problem in one picture. Later slides answer it, prove it and invite.",
  "task": "Write one line of text and a short visual note for each of the five slides, labelled hook, build, proof and invitation. Use two slides for the build. Name the one idea of each slide and one claim you would check before posting. Write 80–140 words.",
  "checks": [
   "Slide 1 is a clear hook",
   "Each slide has one idea",
   "Proof supports the main claim",
   "The last slide invites one action",
   "One claim is marked for checking"
  ],
  "question": "What should the first slide of a carousel do?",
  "options": [
   "List every product and price on slide one, in a table",
   "Stop the scroll and make people want to swipe",
   "Show only the bakery name and its address, in large type"
  ],
  "answer": 1,
  "explanation": "The first slide has to earn the swipe. Lists and addresses can wait for later slides."
 },
 {
  "id": "v8",
  "track": "storytelling",
  "title": "Review an AI image before you use it",
  "skill": "Image critique",
  "minutes": 14,
  "brief": "A student startup in Kochi selling reusable lunch boxes asked an AI tool for a hero image. The picture shows three smiling office workers sharing lunch, one holding a box with garbled letters on it. The hands look slightly odd, and all three people are young and light-skinned.",
  "lesson": "Review every AI image before using it, with a short checklist. Look for odd hands, faces or objects, text that is misspelt or meaningless, a style that does not match your brand, stereotypes or missing groups, and questions about consent or rights. AI can imitate real people or real artists by accident, so never assume an image is safe to publish. Write down each problem you found and the exact change you would request.",
  "example": "Problem: a bus sign reads in made-up letters. Revision: remove the sign and add the correct words as plain text in the layout.",
  "task": "Go through the checklist for the imagined image: hands or text, style match, stereotypes, and consent or rights. Write one finding for each. Then write the revision request you would give the AI tool or a designer. Write 80–140 words.",
  "checks": [
   "Each checklist item has a finding",
   "Hands or text errors are noted",
   "A stereotype or gap is named",
   "Consent or rights is addressed",
   "The revision request is specific"
  ],
  "question": "What should you do first when an AI image has garbled text on a product?",
  "options": [
   "Replace the text and add the real words yourself",
   "Publish it because most people will not notice it",
   "Ask the AI to make the whole image larger now"
  ],
  "answer": 0,
  "explanation": "AI often invents text, so real wording should be added separately. Publishing it unchanged hurts trust, and enlarging the image does not fix the error."
 },
 {
  "id": "v9",
  "track": "storytelling",
  "title": "Pitch an idea in three persuasive slides",
  "skill": "Pitch storytelling",
  "minutes": 15,
  "brief": "Three students in Coimbatore want their college to fund a weekly low-cost repair stall for bicycles, which many hostel students use. They have five minutes to present three slides to the student council. Plan the pitch in words.",
  "lesson": "A short pitch works best in this order: problem, insight, ask. The problem makes the audience feel the need, the insight shows what you noticed that others missed, and the ask says exactly what you want them to approve. Put the ask last so that the earlier slides prepare for it, and make it specific, such as an amount, a space and a date. Give each slide one headline and one supporting visual instead of paragraphs of text.",
  "example": "Problem: a student walks a flat-tyred scooter home. Insight: most repairs are small. Ask: approve a monthly stall in the parking area.",
  "task": "Write the headline and visual for each of the three slides: problem, insight and ask. Make the ask specific. Then explain in two sentences how this order persuades the council. Write 60–110 words.",
  "checks": [
   "Each slide has a headline",
   "The problem is easy to feel",
   "The insight is a new observation",
   "The ask is specific",
   "I explained why the order works"
  ],
  "question": "Why should the ask come after the problem and insight?",
  "options": [
   "So the council has less time to say no to us",
   "So the need and idea are clear before the ask",
   "So the pitch can avoid talking about the costs of it"
  ],
  "answer": 1,
  "explanation": "The audience is ready to say yes when they already understand the need and the idea. Hiding costs or rushing the decision weakens trust."
 },
 {
  "id": "v10",
  "track": "storytelling",
  "title": "Storyboard a five-frame campaign in words",
  "skill": "Campaign storyboard",
  "minutes": 18,
  "brief": "A small NGO in Jaipur runs a weekend tutoring programme for school children and needs volunteers from nearby colleges. It will post a five-frame campaign on social media. You will plan the full storyboard in words and some images may be made with AI.",
  "lesson": "A campaign storyboard connects everything you have practised: one audience, one feeling, one action, a clear order of frames and a visual detail that repeats. Describe each frame in one or two lines, including what we see and the caption. Repeat one visual detail, such as a yellow notebook, so the frames look like a set. Be open about AI use with a short disclosure line, and name one risk, such as showing real children, with a fix.",
  "example": "A red umbrella appears in every frame of a charity campaign: held by a child, placed on a bench, then left at a door.",
  "task": "Write the five frames with what we see and a short caption each. Name the audience, the repeating visual detail and the final invitation. Add one AI-use disclosure line and one risk with its fix. Write 100–160 words.",
  "checks": [
   "Five frames are in a clear order",
   "One audience is named",
   "A visual detail repeats",
   "A disclosure line is included",
   "One risk has a practical fix"
  ],
  "question": "Which risk-and-fix pair is the most responsible for this campaign?",
  "options": [
   "Real children may appear, so blur their names in captions",
   "Faces may look odd, so post the images quickly to avoid delay",
   "Faces may match real children, so use drawn illustrations"
  ],
  "answer": 2,
  "explanation": "Children’s identity and rights need careful protection, so unidentifiable illustrations are a real fix. Blurring names or posting faster does not remove the risk."
 }
];
export const courseMini:Record<string,{q:string;options:[string,string];why:string;answer:number}>={
 "m4": {
  "q": "Which question is fairer to ask a student about hostel food?",
  "options": [
   "What do you usually do when the mess food does not suit you?",
   "Don’t you agree the mess food is really bad?"
  ],
  "answer": 0,
  "why": "The first question is open and neutral, so the student can describe real behaviour. The second pushes them towards agreeing."
 },
 "m5": {
  "q": "You change the headline, the image and the button in version B. What can you conclude if B wins?",
  "options": [
   "The new headline caused the win",
   "You cannot tell which change helped"
  ],
  "answer": 1,
  "why": "Three things changed together, so any of them could be the reason. Test one change at a time to learn something clear."
 },
 "m6": {
  "q": "A tea stall near a college wants quick feedback on a new offer. What helps most?",
  "options": [
   "Picking the most expensive channel available",
   "Choosing a channel where replies can be counted easily"
  ],
  "answer": 1,
  "why": "If you can count replies or visits, you can see whether the offer works. Cost does not tell you that."
 },
 "m7": {
  "q": "Of 200 conversations only 24 were qualified. Where is the biggest drop?",
  "options": [
   "Between conversation and qualified enquiry",
   "Between ad and click"
  ],
  "answer": 0,
  "why": "Only 12 in 100 conversations were a good fit. That points to the targeting or message, which is worth fixing before buying more clicks."
 },
 "m8": {
  "q": "You have one good photo of a hamper. What is the smart move?",
  "options": [
   "Post it once and forget it",
   "Reuse it as a post, a story and a status"
  ],
  "answer": 1,
  "why": "Reusing one idea in several formats saves time and helps different people see it. It also keeps the message consistent."
 },
 "m9": {
  "q": "“Only 3 seats left!” is shown to everyone, but the course has unlimited seats. This is...",
  "options": [
   "Fake urgency, which misleads buyers",
   "Fine, because it motivates people to act"
  ],
  "answer": 0,
  "why": "The scarcity is not real, so the line pushes people to decide on false information. Honest urgency uses true dates or limits."
 },
 "m10": {
  "q": "Your plan targets PG residents but the channel is a newspaper for retirees. What is wrong?",
  "options": [
   "The channel does not reach the customer",
   "The budget is too small"
  ],
  "answer": 0,
  "why": "A channel must reach the audience you named. If the two do not match, even a good offer will not be seen."
 },
 "d3": {
  "q": "Which field is a better choice to identify a booking record?",
  "options": [
   "The parent’s name, because it is easy to read",
   "A system-generated booking ID that never repeats"
  ],
  "answer": 1,
  "why": "Names can be shared or misspelt, so they cannot identify a record reliably. A generated ID is unique and stays stable."
 },
 "d4": {
  "q": "An error reply should be:",
  "options": [
   "Specific about what went wrong and what the user can do",
   "Always the same generic message for every problem"
  ],
  "answer": 0,
  "why": "Specific errors help users fix the problem and help developers find the cause. A generic message hides both."
 },
 "d5": {
  "q": "Which error message is more helpful?",
  "options": [
   "Enter a 10-digit phone number, no spaces",
   "Invalid input, error 422"
  ],
  "answer": 0,
  "why": "It says what is wrong and how to fix it. A bare error code gives the user nothing to act on."
 },
 "d6": {
  "q": "You want help from an AI assistant on an error. What is safe to share?",
  "options": [
   "The key that connects to the database, so it can test",
   "The steps and error text with keys and names removed"
  ],
  "answer": 1,
  "why": "Secrets can be exposed or misused once shared. Removing them still gives the assistant enough to help."
 },
 "d7": {
  "q": "Which statement is correct?",
  "options": [
   "Authorisation checks who the person is",
   "Authentication checks who the person is"
  ],
  "answer": 1,
  "why": "Authentication confirms identity, such as a login. Authorisation decides what that identity may do."
 },
 "d8": {
  "q": "What makes a test case useful?",
  "options": [
   "It states the situation and the exact expected result",
   "It says the app should simply work well"
  ],
  "answer": 0,
  "why": "A clear situation and exact expected result let anyone check pass or fail. Vague wording cannot be checked."
 },
 "d9": {
  "q": "You have a bug after merging. What is the safest first move?",
  "options": [
   "Edit live files directly to fix it quickly",
   "Roll back to the last working version, then fix on a branch"
  ],
  "answer": 1,
  "why": "Rolling back restores working bookings quickly. The fix can then be tested calmly on a branch."
 },
 "d10": {
  "q": "Why add monitoring before launch?",
  "options": [
   "To find failures before users have to report them",
   "To make the app load faster for parents"
  ],
  "answer": 0,
  "why": "Monitoring alerts you when saving or login breaks. It does not itself speed up the app."
 },
 "f4": {
  "q": "A character says “I’m fine, go ahead” while gripping the door. What does the viewer learn?",
  "options": [
   "She is fine and relaxed",
   "She is hiding how she really feels"
  ],
  "answer": 1,
  "why": "The tense action contradicts the words, and that gap is where subtext lives. Viewers trust behaviour more than polite speech."
 },
 "f5": {
  "q": "Which note is easier for an actor to perform right now?",
  "options": [
   "“Be more nervous.”",
   "“Keep checking the road without being noticed.”"
  ],
  "answer": 1,
  "why": "The second note is an action the actor can try physically. Nervousness then grows naturally from the effort."
 },
 "f6": {
  "q": "Why plan a backup location?",
  "options": [
   "Rain, crowds or refusal can cancel the first choice",
   "It lets you shoot twice as long"
  ],
  "answer": 0,
  "why": "On low budgets one change can cancel a whole day. A backup keeps the crew’s time useful."
 },
 "f7": {
  "q": "A distant door closing is heard but not seen. What does it add?",
  "options": [
   "A sense of someone else nearby, offscreen",
   "Nothing, since it is not in the picture"
  ],
  "answer": 0,
  "why": "Sound can show the world beyond the frame. The unseen door suggests a presence the picture does not reveal."
 },
 "f8": {
  "q": "Why cut in the middle of an action?",
  "options": [
   "It hides the actor’s mistakes only",
   "The movement carries the viewer smoothly across the cut"
  ],
  "answer": 1,
  "why": "Motion pulls attention forward, so the new angle feels like one flow. This keeps energy up without drawing attention to the edit."
 },
 "f9": {
  "q": "What is a contingency in a budget?",
  "options": [
   "Money set aside for unexpected costs",
   "Money paid to the lead actor"
  ],
  "answer": 0,
  "why": "A contingency is a small reserve, often about 10 per cent, for surprises like extra transport or a replaced battery."
 },
 "f10": {
  "q": "Which is a better way to state a risk in a pitch?",
  "options": [
   "“Nothing can go wrong.”",
   "“Rain may cancel the stall shoot; we will keep the canteen as backup.”"
  ],
  "answer": 1,
  "why": "Naming a real risk with a fix shows planning. Claiming no risk makes the plan look unrealistic."
 },
 "v3": {
  "q": "Which is a clearer action for a poster?",
  "options": [
   "Join Saturday’s walk",
   "Be part of something"
  ],
  "answer": 0,
  "why": "A clear action tells people exactly what to do and when. A general phrase leaves them guessing."
 },
 "v4": {
  "q": "A poster feels crowded. What is the best first fix?",
  "options": [
   "Add a border",
   "Remove one element"
  ],
  "answer": 1,
  "why": "Removing something gives the remaining elements room and makes the focal point clearer. A border adds one more thing to look at."
 },
 "v5": {
  "q": "Red text means “urgent” and green means “done”. What is missing?",
  "options": [
   "A second cue such as a word or icon",
   "A third colour"
  ],
  "answer": 0,
  "why": "Some people cannot tell red and green apart. Adding a word or icon makes the meaning clear to everyone."
 },
 "v6": {
  "q": "A bar chart starts its axis at 400 instead of 0. What happens?",
  "options": [
   "Differences look smaller",
   "Differences look bigger than they are"
  ],
  "answer": 1,
  "why": "Cutting off the axis makes short bars look tiny and tall bars look huge. Bars should start at zero to stay fair."
 },
 "v7": {
  "q": "Which slide is the better proof?",
  "options": [
   "A big word like AMAZING",
   "A customer’s real comment, with permission"
  ],
  "answer": 1,
  "why": "Proof must be something a reader can believe, such as a real comment shared with permission. A loud word is only an opinion."
 },
 "v8": {
  "q": "An AI image looks like a famous actor. What is the safest step?",
  "options": [
   "Do not use it and ask for a different image",
   "Use it because the face is AI-made"
  ],
  "answer": 0,
  "why": "A likeness of a real person can raise consent and rights problems even if AI made it. Choosing another image avoids the risk."
 },
 "v9": {
  "q": "Which is a stronger ask?",
  "options": [
   "Approve ₹6,000 and one parking-area slot on Saturdays",
   "Please support us"
  ],
  "answer": 0,
  "why": "A specific ask is easy to approve or discuss. A vague one gives the audience nothing to decide."
 },
 "v10": {
  "q": "Where should an AI-use disclosure appear?",
  "options": [
   "Hidden in an internal file",
   "In a short line shown with the campaign"
  ],
  "answer": 1,
  "why": "A visible line lets viewers know how the images were made. Hiding it defeats the purpose of being open."
 }
};
