import type {Mission} from '@/lib/missions';
import {courseSteps} from '@/lib/course-guidance';

/** Different scenarios teach the skill without supplying a completed answer to the learner's task. */
const examples:Record<string,[string,string]>={
 m1:['A fictional cycle-repair shop replaces “Best repairs in town” with “Commuting with a flat tyre? Ask us for today’s puncture-repair slots.”','Check the actual service and availability before making a promise. Ask a reader to identify the customer and next action.'],
 m2:['A plant shop brief gives the audience, verified stock, tone and a two-line output format. It tells the tool to ask when a price is missing.','Try leaving out a price and inspect whether the tool asks or invents it. Record your own actual reply.'],
 m3:['A bookshop reply answers a stock question and asks “Would you like the paperback or hardback?” Its later message includes a clear way to stop.','Role-play a STOP reply with a willing friend; check that the next message would be stopped. Do not message real customers.'],
 m4:['A charger designer asks “Tell me about the last time your phone ran out of power” instead of “Would you buy our great charger?”','Ask a willing person a neutral follow-up and record their actual words without names or private information.'],
 m5:['A fictional workshop compares two headlines while keeping the picture, audience and reading time the same.','Change only the headline; report the reader’s real choice and the limits of such a small test.'],
 m6:['A craft post leads to a private enquiry form with the same offer and a clear next action.','Follow the whole path on your own device and fix one broken or confusing step.'],
 m7:['A sample sheet calculates cost per suitable enquiry as spend divided by suitable enquiries, rather than likes.','Change the enquiry count and inspect the recalculated result. Zero enquiries need an explicit “no result” case.'],
 m8:['A maker with two hours a week chooses four useful posts instead of promising a new video every day.','Time one real post, then adjust your own calendar to that observed effort.'],
 m9:['A fictional tutoring ad replaces “Guaranteed top marks” with a specific description of the practice offered.','Check each remaining claim and rehearse agreeing, declining and stopping with a willing partner.'],
 m10:['A workshop campaign connects a post, booking destination and source-labelled enquiry tracker.','Send two labelled test enquiries to your own tracker and inspect whether their sources remain distinct.'],
 d1:['For a library hold, the page awaits saveHold(bookId) before showing “Hold saved”. A rejected save displays a retry message, never success.','In your own local demo, run one successful save and force one failure. Supply the relevant code and actual output, then explain your fix.'],
 d2:['A library service derives the member from a verified session and looks up the fee on the server. Browser-supplied member IDs and fees cannot override it.','Change both values in a local test request and inspect the stored result; also repeat the request.'],
 d3:['A library keeps members and holds in linked tables, with a uniqueness rule for the same copy and collection slot.','Try inserting that hold twice in a throwaway database; record the real constraint error.'],
 d4:['A library hold contract defines POST /holds, required fields, a success status and a clear conflict response for an unavailable copy.','Send a valid request and malformed requests to your local implementation and record their actual statuses.'],
 d5:['A local basket checker validates quantity and current stock on the server, even if the page checked them first.','Change stock after loading the page, then submit and inspect the server response.'],
 d6:['A hold is missing after a timeout. Reproduce that exact request and inspect storage before deciding what failed.','Keep the original failing request as a regression test, then run it again after your change.'],
 d7:['A member may read their own hold; another member cannot read it merely by changing its ID. An administrator has a separately checked permission.','Test all three identities against the same local record and show which requests were allowed.'],
 d8:['A last-copy test expects exactly one successful reservation when two requests compete for the same copy.','Put the original bug back into a throwaway copy; the test must fail before the fix makes it pass.'],
 d9:['A throwaway recipe app uses one branch for a small change and several understandable commits, with a known working revision to return to.','Perform the commands locally and retain actual log/status output; a proposed command list is not execution.'],
 d10:['A library demo joins its form, storage checks, permissions and regression tests in one local project.','Exercise success, failure and rollback yourself. Supply the code and observed results; public deployment is unnecessary.'],
 f1:['Three shots show someone hearing a key fall, searching under a table, then finding it. Each shot changes what the viewer knows.','Watch your own scene without narration and reshoot the moment where the cause or result is unclear.'],
 f2:['A six-shot doorway scene keeps a character moving in the same screen direction until a deliberate change.','Watch consecutive shots for an accidental reversal or mismatched look.'],
 f3:['A drawn sign is combined with footage of an empty desk, matching its angle and light.','Export and watch your own combination; correct an edge, scale or lighting mismatch. No paid AI tool is necessary.'],
 f4:['Instead of saying “I am worried you will leave”, a character asks whether the last train has gone.','Record both versions with a willing participant and listen for how directly the feeling is stated.'],
 f5:['The same line is performed once to persuade someone to stay and once to end the conversation.','Record your own two takes and describe visible changes rather than only naming emotions.'],
 f6:['A safe desk scene uses a window as its main light and a white card to soften the shadow.','Record a test and a backup setup with available light; compare what the camera actually captures.'],
 f7:['A quiet room gains tension when a clock cue is heard before the door opens instead of after it.','Export your own two cue timings and listen to both before choosing.'],
 f8:['One edit holds a reaction shot; another cuts directly to the result. They create different pacing.','Export both versions of your footage and record the precise cut you changed.'],
 f9:['A small shoot plan includes setup and packing time alongside recording, using a spreadsheet for its budget.','Time a real safe setup and replace optimistic estimates with what you observed.'],
 f10:['A short film sample and a one-minute pitch make the same promise about the story and its production method.','Watch both, identify an unsupported promise, and revise the pitch or sample.'],
 v1:['Three rough frames show an empty bottle, a refill point being noticed, and a refilled bottle.','Hide your own captions and check whether the change is still understandable.'],
 v2:['Two instructions describe the same character’s coat, bag and location consistently while changing the action.','Create your own images using available tools, compare recurring details, then correct a mismatch.'],
 v3:['A community notice puts the intended audience and next action ahead of decorative details.','Show your own version to a willing viewer and ask what it means without explaining it first.'],
 v4:['A fictional workshop poster gives the event name first, followed by date and place, then one registration action.','View your own exported poster at phone size for five seconds; revise what is hard to find.'],
 v5:['A slide uses a readable text scale and labels alongside colours so its meaning survives in black and white.','Export your own slide and check phone-size and monochrome versions.'],
 v6:['A chart labels its units, uses an honest scale and updates when its source numbers change.','Change one number in your own sheet and inspect whether the chart and caption still agree.'],
 v7:['Five slides introduce a problem, show its consequence, explain an idea, offer evidence and end with one action.','Read your own sequence on a phone and remove a repeated or unnecessary slide.'],
 v8:['An image review checks awkward details, excluded people and whether faces or names may be used.','Inspect an image you made or may use; correct the actual issue rather than claiming a generic safety check.'],
 v9:['A three-slide pitch connects a problem, a proposed response and a specific request for help.','Record your own one-minute presentation and revise an unsupported claim or confusing transition.'],
 v10:['Five campaign pictures use consistent visual cues while each adds one new piece of the message.','View your own full sequence on a phone and improve the picture where the message becomes unclear.']
};
export function learningGuide(m:Mission){
 const translated=!!m.practiceSteps?.length&&m.contentLanguage!=='en';
 const steps=m.practiceSteps?.length?m.practiceSteps:courseSteps[m.id]||[m.task];
 return {steps,outcome:steps[0],example:examples[m.id]||['Use a small private example to explore this skill.','Create, test and improve your own version; record what actually happened.'],englishExample:translated};
}
