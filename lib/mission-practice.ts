import {missions,type Mission} from './missions';
import {deliverables} from './course-roadmap';
/** Realistic practice, not a claim that these are live client commissions. */
const trials:Record<string,string[]>={
 marketing:[
  'Read your offer as a busy customer. Can you identify who it is for, the benefit and the next action in five seconds? Rewrite one unclear phrase and show the before/after.',
  'Try your reusable prompt with an AI tool you already use, or manually walk through it. Compare the draft with your quality checklist; record one weak claim and your correction.',
  'Role-play an interested reply and a STOP reply. Show the response to each and explain what you changed to respect consent.',
  'Ask one willing person your interview questions, or role-play the interview. Record one answer, one leading question you caught and your fairer rewrite. State which method you used.',
  'Make both A/B versions. Hold the audience and offer constant, identify the single changed variable, and record a comparison. Label any simulated data.',
  'Draft one post or message for your chosen channel. Follow its next-action path yourself and fix one unclear handoff. Do not publish or message anyone without permission.',
  'Recalculate the supplied campaign figures yourself. Show your arithmetic, check the units and explain the action your result supports.',
  'Produce one actual post from your calendar, then adapt it for a second day. Show both versions and explain how the reuse saves work without repeating the message.',
  'Mark the risky claims in the supplied ad, rewrite them and run your own evidence-and-consent checklist. Show one claim removed or qualified.',
  'Assemble your earlier campaign pieces into one launch brief. Walk through customer → offer → message → action → measurement, and repair one missing connection.'
 ],
 development:[
  'Walk a parent through one successful booking and one failed request. Write the expected message for each; confirm that success appears only after storage succeeds.',
  'Trace your corrected handler with a spoofed user ID, a changed price and a repeated request. Record expected versus observed behaviour. Label a manual trace if you did not run the code.',
  'Try two bookings for the same slot in your schema or a table mock-up. Show which constraint rejects a duplicate and which fields another parent must not see.',
  'Write one valid and two invalid sample API requests. Pair each with the response/status your contract requires and correct an inconsistent error.',
  'Run or manually trace your validation function with a valid order, a bad phone number and too many items. Record results and fix one missed boundary.',
  'Reproduce the supplied bug, inspect the evidence, then run or trace your corrected handler. Show what changed and what result would prove the fix.',
  'Test or trace owner, another learner and admin requests against your access-check function. Record allow/deny for all three and fix any unauthorised path.',
  'Run or trace your three booking tests, including the boundary. Record input, expected result and observed result; explain a test that would catch the old bug.',
  'Use a disposable local repository, or show a clearly labelled command walkthrough: branch, three small commits, merge and rollback. Record the resulting history; never use production data.',
  'Combine your feature, API, validation, access and test work into a launch pack. Walk through a failed booking and a rollback; fix the highest-risk missing check before declaring it ready.'
 ],
 filmmaking:[
  'Stage your three story beats using a phone, paper frames or a rough animatic. Without explaining them, check whether the action communicates the intended feeling; revise one beat.',
  'Capture or sketch the six shots and place them in order. Check screen direction, eyeline and the final reveal; show one continuity correction.',
  'Make a rough storyboard for the live/AI split. Compare light, perspective and purpose across the insert; revise one mismatch. You do not need paid generation credits.',
  'Read the scene aloud, or record it privately with a consenting partner. Identify where the subtext becomes too explicit and rewrite one exchange.',
  'Try two takes using different playable actions, or storyboard the performance. Describe the visible difference and which direction worked better.',
  'Scout a safe available location or use a floor-plan mock-up. Sketch light and camera positions, then test your backup for a changed light condition.',
  'Build a short sound cue sheet and try its timing against your frames. Use self-made or cleared sounds; record which cue changed the mood and why.',
  'Make a rough cut or timed paper edit of your shot plan. Compare two cut orders, record the pacing difference and justify your chosen version.',
  'Run the schedule on paper, adding setup, travel and breaks. Recalculate the budget; show one conflict or overrun and your revised plan.',
  'Assemble your story, shot, sound, schedule and budget work into a pitch pack. Give a one-minute pitch privately or to a willing listener, then improve one unclear promise.'
 ],
 storytelling:[
  'Make three actual rough frames, using paper or a free design tool. Check whether the change reads without your narration; reorder or redraw one frame.',
  'Try your image brief with an available tool, or sketch the intended result. Compare subject, composition and consistency with the brief; show one prompt revision.',
  'Create one headline and rough frame for your intended audience. Check whether feeling and next action support the same message; remove a conflicting detail.',
  'Make a rough poster. View it at phone size for five seconds, identify the first thing your eye notices and revise the hierarchy if it is not the intended focal point.',
  'Apply your type and colour choices to one sample slide. Check it at phone size and in greyscale; change anything that depends on colour alone or is hard to read.',
  'Draw the chart from the supplied numbers, verify its labels and baseline, and write a caption. Show one misleading choice you avoided.',
  'Create five rough carousel slides. Read them in order, remove a repeated idea and make the last slide lead to one clear action.',
  'Inspect the supplied image description or an image you may use. Record evidence for hands/text, representation and rights; show the revision or explain why you would reject it.',
  'Make three rough pitch slides. Practise a one-minute walkthrough; identify the unsupported claim or unclear transition you would fix first.',
  'Assemble five campaign frames using your earlier audience, style and review work. Check the sequence at phone size and improve one frame that breaks the message.'
 ]
};
export function missionPractice(m:Mission){const index=missions.filter(x=>x.track===m.track).findIndex(x=>x.id===m.id);return {outcome:deliverables[m.track]?.[index]||m.title,trial:trials[m.track]?.[index]||m.task,day:index+1}}
