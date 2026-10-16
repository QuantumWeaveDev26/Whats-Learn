import {missions,type Mission} from './missions';
import {deliverables} from './course-roadmap';
/** Realistic practice, not a claim that these are live client commissions. */
const trials:Record<string,string[]>={
 "marketing": [
  "Create the finished customer offer. Time a five-second reading of it, record which benefit and next action you actually noticed, then submit the original and improved copy.",
  "Run your reusable prompt in an AI tool you already have. Submit its actual draft, identify one unsupported claim and submit your corrected version. Invented model output does not count.",
  "Create the actual reply sequence. Rehearse it with a willing partner playing an interested customer and then a STOP request. Record the replies used, one observed problem and your corrected response; do not contact real prospects.",
  "Interview one willing person using your five questions. Submit anonymised answers, the leading question you caught and your revised question. A fictional interview does not count; do not collect private details.",
  "Create both A/B messages and show them to at least one willing reader under the same conditions. Record their actual choice and reason, then improve one version. This is a small usability check, not proof of campaign performance.",
  "Create the finished post and its destination draft. Open the next-action path yourself, record the actual handoff problem and repair it. Keep the work private unless you have permission to publish.",
  "Build a working spreadsheet from the supplied campaign figures. Enter formulas, change one input and record the recalculated result. Submit formulas, original and changed results, and the decision they support.",
  "Create your calendar and two finished posts from it. Preview both at phone size, record a real readability or repetition problem and submit the improved versions.",
  "Create the revised ad and a working consent/STOP message sequence. Rehearse both with a willing partner, record the problem found and show the corrected copy. Remove any unsupported claim.",
  "Assemble a usable campaign pack with the finished offer, posts, destination and tracking spreadsheet. Follow its next-action path and enter a labelled test enquiry in your own draft tracker. Record the result and repair a broken handoff."
 ],
 "development": [
  "Build a small runnable trial-booking prototype alongside your brief. Use a local mock server or in-memory store. Run one successful save and one forced failure; submit the relevant code, actual output and the fix. Success must appear only after the save response.",
  "Run your corrected handler locally with a spoofed user ID, changed price and repeated request. Submit the handler and actual output for all three cases, then fix a failing case. A paper trace or expected output alone does not count.",
  "Create the schema in a disposable local SQLite or PostgreSQL database. Insert a valid booking, attempt a duplicate slot and run a privacy-safe query. Submit the SQL and actual results, including the constraint error, then correct a schema issue.",
  "Implement a tiny local API matching your contract. Send one valid and two invalid requests using curl or a local client. Submit the handler and actual status/body for each; fix an inconsistent response.",
  "Run your validation function locally with a valid order, a bad phone number and too many items. Submit the code and actual outputs, then fix and rerun one missed boundary.",
  "Reproduce the supplied bug locally, run the corrected handler and rerun the failing case. Submit the code, before/after output and evidence showing what changed.",
  "Run owner, another learner and admin requests against your local access-check function. Submit code and actual allow/deny output for all three, then correct and rerun an unauthorised path.",
  "Write and run three booking tests including the boundary. Submit the test code and actual runner output. Demonstrate a test failing against the old bug and passing after your fix.",
  "Use a disposable local Git repository: create a branch, make three commits, merge and perform a safe rollback. Submit the commands and actual git log/status output before and after. A proposed command list does not count.",
  "Integrate your booking prototype, validation, access checks and tests locally. Run a successful booking, a failed booking and a disposable rollback. Submit source, actual outputs and the repaired highest-risk issue; no production deployment is required."
 ],
 "filmmaking": [
  "Record your three story beats as a short phone clip using available objects or consenting performers. Watch it without narration, record what was unclear and reshoot one beat. Submit timecodes and the before/after change.",
  "Record the six shots and assemble them in order in a free editor. Watch screen direction, eyeline and reveal; submit shot timecodes, the continuity problem found and a corrected shot.",
  "Create and export a short live-action sequence with a self-made animated or composited insert. Check light, perspective and purpose; submit timecodes and the corrected mismatch. Paid generation tools are not required.",
  "Record the scene aloud yourself or with a consenting partner. Listen back, rewrite an exchange that states the subtext too directly and record it again. Submit both dialogue versions and the observed difference.",
  "Record two takes using different playable actions yourself or with a consenting performer. Compare the actual performances, choose one and record a revised take. Submit timecodes and visible differences.",
  "Set up a camera and available light in a safe accessible location. Record a short lighting test, change the light condition and record your backup setup. Submit positions, timecodes and the adjustment that worked.",
  "Create a short sound edit using your own or cleared sounds and footage. Export and listen to two cue timings; submit timecodes, the actual mood difference and the revised cue sheet.",
  "Create and export two rough cuts from your footage. Watch both, record the actual pacing difference and export the improved cut. Submit duration, cut timecodes and your reason for choosing it.",
  "Carry out one small shoot setup and time the actual setup, recording and pack-down. Use those measured timings in your schedule and spreadsheet budget; submit measurements, formulas and the revised overrun.",
  "Assemble and export a short hybrid-film sample using your footage, insert, edit and sound. Record a one-minute pitch, watch it back and improve one unclear promise. Submit sample and pitch timecodes plus the revision."
 ],
 "storytelling": [
  "Create three finished rough frames on paper or in a free design tool. Hide the captions and check whether the visual change is readable; redraw or reorder one frame. Submit the actual frame content and the change observed.",
  "Create two consistent images from your brief using an available image tool or your own drawing. Compare the actual outputs, revise the brief and create a corrected image. Submit the work and the observed consistency fix.",
  "Create the headline and finished rough visual for your intended audience. Show it to one willing viewer, record their actual interpretation and next action, then revise a conflicting detail.",
  "Create and export a poster. Open it at phone size for five seconds, record what you noticed first and revise the hierarchy. Submit the finished copy, layout and before/after change.",
  "Create a real sample slide with your chosen type and colours. Export it, view it on a phone and in greyscale, and fix unreadable text or colour-only meaning. Submit the actual settings and observed correction.",
  "Create the chart from the supplied numbers in a spreadsheet or chart tool. Change one value and confirm that the chart updates. Submit the data, chart labels, caption and observed correction to a misleading choice.",
  "Create and export five carousel slides. Read the export on a phone, remove a repeated idea and revise the final action. Submit the actual slide copy, sequence and the problem you corrected.",
  "Inspect an actual image you made or may use, not just its description. Create a corrected image or replace it with your own work. Submit the observed defects, rights check and actual before/after change.",
  "Create and export three pitch slides, then record a one-minute presentation. Watch it back, correct an unsupported claim or unclear transition and update the slides. Submit actual slide copy and recording timecodes.",
  "Create and export five campaign frames using your earlier work. View the full sequence on a phone, record where its message breaks and revise that frame. Submit the actual frame content and before/after correction."
 ]
};
export function missionPractice(m:Mission){const index=missions.filter(x=>x.track===m.track).findIndex(x=>x.id===m.id);return {outcome:deliverables[m.track]?.[index]||m.title,trial:trials[m.track]?.[index]||m.task,day:index+1}}
