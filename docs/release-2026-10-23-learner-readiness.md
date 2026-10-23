# Learner readiness repairs — 23 October 2026

Release marker: `2026-10-23-learner-readiness-v9.4`.

## Changes

- Membership now exposes the signed-in learner's own subscription status, refresh and confirmed stop-renewal action, including when new checkout is closed. Active subscriptions are prioritised over failed attempts. Cancellation and refund are explained separately.
- Management requests carry an opaque account marker. Old-account responses are discarded, duplicate clicks are blocked, foreign-account/origin requests are rejected, and storage/provider failures do not produce false success messages. No new subscription or charge is created by management controls.
- Mobile Membership uses a compact horizontal secondary navigation, a shorter heading and introduction, and expandable billing detail. Prices, access and allowances are unchanged.
- The first development task is called “Build a trial-class booking page.” Its outcome is a working page and three checks. Stable answer field IDs and labels remain compatible with existing saved work.
- A returning learner's separate starter explains that it does not change their course and provides “Back to my course.” The existing inline welcome video remains.
- Mentor guidance checks the accuracy of definitions and comparisons, preserves overlaps between categories, and allows enough room for a requested example. A live answer incorrectly excluded existing customers from an audience; the revised guidance explicitly corrects that distinction. This is a safeguard, not a guarantee that an AI model cannot make mistakes.
- English concept-check inputs no longer suggest Kannada/Kanglish. Concept-session reads and writes carry account markers; the interface resets for a different account scope and ignores old responses. Sync status describes practice progress, not a completed creation.
- HTML pages enforce object-src none and base-uri self in addition to the existing frame policy. Script restrictions are report-only while inline-script compatibility is assessed; reports stay in the browser console, with no new telemetry endpoint. Private-upload sandbox policies remain separate.

## Validation and limits

- Regression tests cover account isolation, management while sales are closed, confirmation, duplicate clicks, provider failure, old responses and synthetic end-of-period cancellation. These tests use fake provider responses and do not prove real payment-provider acceptance.
- A real signed-in existing account opened its saved journey without repeating personal setup. English mentor replies were exercised through the existing hosted AI connection.
- A live concept check rejected an overly broad audience and accepted a specific, reasoned office-worker answer. This checked understanding only; no completed practical creation was saved and no mission points were awarded. It does not establish practical grading across all four tracks.
- Settings showed WhatsApp was not linked on the inspected account. The published n8n workflow was active; its execution query returned no recent records. Neither fact proves end-to-end delivery. No WhatsApp messages were sent.
- Fresh-account email/Google callbacks, session expiry, real Android/iPhone behavior, live cross-account isolation and deletion/export acceptance remain separate checks.

## Owner actions before broad or paid launch

1. Confirm the actual grievance officer name and public email and obtain review/approval of Privacy, Terms and Refunds, including the proposed refund thresholds. Configure the documented settings only after genuine approval. This release does not invent approval or remove the draft notice.
2. Keep public checkout closed while payment activation, webhook failure/recovery, cancellation and refunds are verified with the actual provider. Updating UI or passing synthetic tests does not clear this step.
3. Link WhatsApp from Settings and explicitly consent from the intended number. The owner must then send the test enquiries and inspect replies, since they instructed the agent not to send messages. Verify STOP/pause and an approved reminder outside the service window at the appropriate time.
4. Complete a real first-time sign-up/Google login and a practical review/save in each course using real work. Confirm the same accepted work appears on the website and linked chat.

Public launch clearance is conditional on those acceptance results; a successful deployment alone is not clearance.
