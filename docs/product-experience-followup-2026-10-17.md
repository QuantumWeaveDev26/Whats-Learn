# Product experience follow-up — 2026-10-17

## Implemented
- Formative reviews receive prior-attempt context; current evidence takes precedence.
- Potentially accepted work receives an independent correctness/practical-evidence check before completion. A veto is kept as a specific practice focus, without erasing partial strengths.
- The reviewer distinguishes historical failing traces from the improved implementation and its results. Default OpenAI model is gpt-4.1-mini; OPENAI_MODEL still overrides it.
- Kannada script and explicit Kanglish select the feedback language even if the profile default is English.
- WhatsApp bridge uses the website's actual adapted question and current profile language. Submission replies include worked/improve/next and the next challenge after saving.
- Evaluate-and-save returns the structured review to the browser, including rejected attempts. AI allowance displays refresh after requests.
- Linked learners can request a learning recap to their verified number. Same-origin, ownership, opt-in, recent inbound message and rate limits are enforced. Provider acceptance is not labelled delivery.

## Evidence
- Synthetic runnable artifact: `node artifacts/live-learner-booking-demo.cjs`. Observed the weak early-success bug; fixed success, forced failure, invalid input and duplicate-slot assertions passed.
- Automated account, review, save, adaptation, idempotency, WhatsApp context and recap transport tests use mocked providers and isolated databases.
- Prior mobile browser check showed no horizontal overflow at 390px; onboarding preview matched the actual experienced question.
- Live signed-in coach and review calls were made using synthetic work with the owner's permission. A Kannada reply contained an unrelated word; the weak client was initially approved. Both findings drove additional fixes.
- A later live review misread before/after evidence and rejected the fixed artifact. No test work was saved or scored. The final before/after clarification and default-model change require a fresh live trial.

## Outstanding live demonstration
- The trial account reached its 3-request daily AI allowance. Do not reset usage, bypass the gate or claim successful completion. Retry after midnight India time or use an independently authorized test account.
- Demonstrate accepted revision, saved work across refresh, changed next task, and actual WhatsApp continuation/receipt.
- Kannada/Kanglish sample replies were tested live (see final evidence below). This is not an exhaustive or native-speaker language audit.
- No market-launch conclusion is made.

## WhatsApp transport check
The live recap attempt found bridge-only hosting: account linking works through n8n, but the direct Meta sender is not configured in Hostinger. Recaps now use the existing n8n outbox on that setup, with queued/processing/send-accepted/failed status scoped to the signed-in learner. A send-accepted report still does not establish handset receipt.

## WhatsApp interaction feedback
The user supplied screenshots of junk text advancing the chat. Written parts now have immediate draft-format and relevance checks; wrong quiz choices stay on the question. Previously collected junk drafts are routed back to the first invalid part without deleting the other work. Prompt copy is shorter and conversational; task steps show 1/5-style progress, tutor answers are capped at 45 words, and the chat explicitly distinguishes draft checks from final AI review. These checks do not establish correctness for arbitrary written answers.

## Conversation instead of end-only evaluation
Each meaningful WhatsApp answer now receives a small AI check against the current part and earlier draft. Rejected answers stay on that part and get one specific follow-up; accepted answers get a reaction to their actual content and a contextual next question. Random text is stopped before an API call. The numeric self-review stage is removed; SAVE/SUBMIT still runs the whole-creation correctness gate before account progress or points change. Stored completion checks come from the server AI review. Normal chat questions use the actual draft as context.

Conversational checks/questions have a separate bounded daily budget (20 Explore, 40 paid; India-time reset), so a five-part conversation does not consume five whole-creation reviews. Provider failures never silently advance the draft. These are product limits for the new per-turn coaching feature, not a reset or bypass of a learner’s whole-creation review usage.

## Live WhatsApp evidence
With the owner’s permission, the developer sent test replies in the linked learner’s real mentor conversation. The string `wers7se` was rejected and stayed on 1/5. A trial-class user story received answer-specific feedback and advanced to 2/5. A meaningful suggestion to collect private chat history and bank statements was rejected immediately with a privacy correction and a request for minimal booking details; it did not advance. That correction was too long, so chat-part feedback now receives one shortening pass when needed, with a hard 35-word display bound and the original accept/reject verdict preserved. Tone guidance was tuned after observing an overly classroom-like live response. No whole-creation completion or reward is claimed by these chat-part checks.

## Follow-up checks and fixes
- Live: corrected minimal booking fields were accepted with specific short feedback and advanced to 3/5. A later `a` stayed at 3/5. A question about an occupied slot received task-specific coaching without advancing the draft.
- Live: reopening the website retained the full synthetic booking draft and stored feedback. The account still had 0/3 reviews available; no successful full-creation save or score is claimed.
- Live: a Kannada question was blocked by the English keyword filter. Kannada/Kanglish questions now reach the grounded AI coach when configured, even with an English profile; regression tests cover both languages. Actual language quality needs live recheck after deployment.
- Removed the automatic 24-hour chat-draft deletion so return visits do not silently lose unfinished work. Save/cancel/course switch/unlink/account deletion still clear the draft. Website drafts remain browser-local and account-scoped; settings explicitly distinguishes these from shared completed progress.
- Repeated independent correctness vetoes now count as repeated practice evidence, even when the initial reviewer marked the individual checklist items as met.
- WhatsApp progress recaps lead with completed creations and the same next task/focus; reward numbers are available through POINTS. No reward math changed.
- Recap status refreshes while queued/claimed. The real website request was queued, but no actual receipt was observed: the external n8n website-sync sender needs inspection. Do not call queued or provider-accepted a delivered message.
- 313 isolated regression tests pass; TypeScript and production build checked separately. Mock-provider tests do not establish real model accuracy or handset delivery.

## Final live evidence and remaining boundary
- The real n8n workflow was inspected with permission. The published notice path was claiming recaps but using a failing legacy Header Auth sender. `Send Notice` now reuses the existing WhatsLearn WhatsApp API credential used by chat replies. An isolated test claimed only the owner's known recap ID, delivered it, and reported `sent`. The temporary ID filter was removed and the normal queue restored before publishing.
- A subsequent website recap was delivered by the normal two-minute schedule, and was visibly received in the owner's WhatsLearn chat. This establishes actual receipt, not merely provider acceptance. Its task, profile fit and practice focus matched the website. Repeated feedback text was removed from the recap.
- Existing free-text reminder, approved-template and retry-notice senders were updated to reuse that same credential and published. They were not manually sent to other learners. Opt-in, quiet hours, schedules and template approval requirements remain enforced; no outside-window template send was demonstrated.
- A valid three-case acceptance check and failure state received immediate specific feedback. The actual weak client code and observed 503 trace, explicitly stating no fix had been made, was rejected at the reasoning step. The implemented client fix and actual rerun results were then accepted as a draft ready for final review. This is conversational approval, not whole-creation completion.
- SAVE hit the existing 0/3 daily review limit. No completion or points were granted. The draft remains available. The owner was offered separate-account testing but did not supply a separate signed-in session; no credentials were invented and no quota was reset. A final accepted save, refreshed saved creation, and resulting next task still require an available whole-creation review.
- A live Kannada reply first contained a Telugu fragment and then an inaccurate slang translation. Coaching now drafts the technical answer before separately rendering Kannada/Kanglish, with a mixed-script repair/fail-closed check. The final live Kannada sample correctly said not to show success when the server did not save, and to wait for the response. A Kanglish sample also described the occupied-slot error and server-confirmed success. These samples do not certify every generated reply.
- At 390px, live dashboard, Companion, Settings, Membership and onboarding entry had no horizontal overflow or server error. The practical mission dialog measured about 371px inside the 390px viewport and retained the full browser draft. The temporary viewport override was reset.
- Partial skill memory now keeps a demonstrated message skill when a separate audience criterion needs work; independent correctness vetoes still block mastery. Tests cover repeated vetoes and weak-to-improved progression.
- Regression coverage: 316 isolated tests, including concurrent duplicate-reward protection, account isolation, stored review memory, progression and transport limits. Production build and isolated Node deployment checks pass. The full provider-backed save flow remains the explicit outstanding live test; no launch-readiness claim is made.


## Further brevity and natural Kanglish
- Normal question answers and per-part feedback plus follow-up are limited to 22 words. Overlong provider output is rewritten; rejected answers cannot become accepted during shortening.
- Removed the repeated “Send your take” instruction from written-part prompts and shortened the final-review invitation. Task options and necessary starter code remain visible.
- Natural short Kanglish such as “Slot illa andre enu torisbeku?” is recognized without requiring the word Kanglish. The same detector is used before English-only relevance filtering and when selecting AI feedback language. Meaningful Kanglish answers still require semantic AI approval.
- Recaps omit the repeated onboarding explanation and limit the focus to a visibly marked 16-word excerpt, with a link to full feedback. Optional performance detail uses the same excerpt limit.
- 317 isolated tests pass, including natural Kanglish answer advancement, short Kanglish questions and rejection-preserving compression. This does not establish every real model answer is correct. Full live final-review/save/next-task verification remains blocked by the owner’s daily allowance.


## Integration completion follow-up
- Reopened the owner payment setup: live keys, secret, live plans and public checkout are configured. An existing live subscription was refreshed successfully without creating a checkout, charging money or cancelling renewal. The older paid test sprint is isolated from live access.
- Fixed server-side billing-mode isolation for refresh, checkout verification and cancellation. A test row cannot call Razorpay with live credentials merely by bypassing the disabled UI button.
- Signed payment webhooks retain the order payment reference even when the browser checkout callback never runs. Refund handling can recover that order from the provider payment and checks currency/amount; multiple partial refunds totalling a full payment end sprint access. No actual refund was requested.
- Added an owner-only signed-webhook history indicator. Its history can contain test or live events, so it explicitly does not certify live-mode delivery. Customer and guest responses do not expose this history or configuration.
- Automated provider fixtures cover webhook-only activation, duplicate delivery without extending access, full cumulative refund revocation and mode mismatch rejection before a provider call.
- Current live mission still shows 0/3 reviews left and the complete synthetic browser draft restored after reopening. Accepted final review/save/next-task remains unverified; no quota reset, fabricated completion or points grant was made.
- The Meta WhatsApp Manager and Razorpay dashboards both require sign-in. Authenticated owner access is needed to submit/inspect templates and provider webhook delivery logs. No template approval or delivery outside the service window is claimed. A real-money payment requires the owner to complete checkout themselves.


## Remaining implementation work completed
- Website completion now parks any older WhatsApp draft of that mission and uses the updated next task. Changing programme on the website also parks the old programme's chat draft. DRAFTS lists private parked revisions; RESUME <mission-id> reopens one without overwriting another active draft or changing completed progress. Explicitly reopened revisions are not immediately parked again.
- Added additive migration 0016_whatsapp_saved_drafts.sql and the matching migration journal entry. The Node runtime applies it automatically. Account deletion/unlink removes parked data; account deletion also clears active chat drafts, link codes, reminder history and queued notices.
- Saving an unchanged inline artifact can reuse its existing accepted AI assessment after a break without a second review charge. Explicit fresh evaluation retains its short cache; changed work must be evaluated again. External repository evidence retains the five-minute refresh boundary.
- Added WHATSAPP_PROGRESS_TEMPLATE for the concise two-variable template (completed creations, actual adapted next task). Existing four-variable approved templates keep their original contract. No Meta template is claimed submitted/approved; owner approval/configuration remains external setup.
- Final save and daily-limit replies lead with creation progress. Balance/streak details remain available through POINTS, without changing reward calculations.
- Integration regressions cover weak submission, specific feedback, accepted revision, safe save, next-day WhatsApp continuation, parked-draft restore, no duplicate rewards, account isolation/deletion and new/legacy template parameters. AI providers and message transport are mocked in these automated checks; the separate live provider-backed final-save demonstration still needs unused review allowance.

## PDF remaining code fixes — 17 October
- Added authenticated, account-owned skill drills from the learner's actual weak criterion or correctness blocker. Failed attempts persist; a passed drill returns the learner to revising the full creation. It does not award course completion or points. Website and WhatsApp PRACTICE use the same service, selected language and chat allowance.
- Added explicit guest draft recovery after sign-in. Account drafts are never overwritten; conflicts remain available to copy, and failed storage preserves the guest original. Continue reflects the restored draft.
- Put mini challenges behind an expandable section and kept focused practice and feedback ahead of the mission.
- Highest recognition now requires ten useful completed creations; clues, imperfect scores and breaks do not disqualify learners. Existing financial reward approval remains required.
- Revision rewards now require accepted AI evidence of a net increase in met criteria, changed work and a reflection. Cosmetic edits do not qualify; retries cannot duplicate the reward.
- Validation: production build, TypeScript, isolated production deployment and Node migration/runtime checks passed. Automated AI fixtures verify rejected practice, Kanglish acceptance, retry/provider failure, account isolation, weak-to-improved progression and nonduplicate saves. These fixtures do not establish real model quality or actual WhatsApp delivery.
- The full real-provider accepted-review/save/next-task demonstration remains outstanding because the authorized production account had exhausted its daily full-review allowance. No quota reset or fabricated completion was made. Meta approval and a real Razorpay checkout remain owner actions.

## Live checks of deployment, learning and WhatsApp
- Verified the deployed dashboard shows focused skill practice, collapsed mini challenges and restored Continue state. A wrong synthetic 503-success answer was rejected by the real AI with a specific correction; an actually executed HTTP mock correction was accepted, persisted after refresh, and did not increment the 0/10 course count.
- Executed artifacts/live-learner-booking-demo.cjs again: success201 stored one row; forced503, duplicate409 and invalid400 showed only their errors and added no rows.
- Found and corrected a legacy checklist-label mismatch: generic focused drills now quote the actual review correction rather than asking for a different checklist artifact. Also fixed questions followed by a short language request being mistaken for submissions.
- Real WhatsApp recap arrived with the matching development task and 0/10 saved context. Real Kanglish coaching returned a brief server-confirmation explanation. A new Kannada request returned the safe unavailable reply; the retry returned a brief Kannada explanation to show the error and retain the form. One transient failure was observed; this does not certify every generated answer.
- A live code-mixed practice answer received English-only feedback. Added a guarded localization retry for missing Kannada/Kanglish output, preserving the accepted/rejected verdict. Automated regressions verify rejection cannot become acceptance during rewriting.
- Narrow rendered dashboard had documentWidth304 within innerWidth319, without horizontal overflow. Companion loaded with distinct journey, WhatsApp and GPT links. This is limited layout evidence, not a full mobile-device certification.
- Full mission-review allowance still displayed 0/3. No real accepted full-review/save/next-mission claim is made. Meta template page still requested login after the user's sign-in report; a template-status screenshot or accessible session is needed to verify approval outside the service window. Payments intentionally excluded at the user's request.
