# Public launch readiness — 19 October 2026

## Decision

Broad public launch is **not yet cleared**. The checks below support the repaired implementation; they do not replace a real first-time learner walkthrough, verified WhatsApp delivery or production reminder delivery. Payments were excluded at the owner's request.

## Verified

- 468 non-payment automated checks pass, covering authentication rules, account isolation, saved progress, mission access, correctness gates, drafts, style interactions, roadmaps, mentor routing and UI contracts.
- TypeScript checking and the production standalone build pass.
- An unpublished, manual-only n8n audit used a real AI provider and synthetic learners. Blind execution 24996 correctly classified all 15 messages, including tone/emoji/pace feedback, task editing, asking for the actual question, points, journey, resumption, general questions, ambiguity and a genuine user-story submission. Expected labels were excluded from the model input.
- A six-turn real-model conversation was inspected. Raw output still needed restraint; the production formatter now caps emojis and keeps preference acknowledgements to the first complete thought. This is an implementation safeguard, not a claim that the model always follows its prompt.
- Six pages rendered at 1440px, 390px and 360px widths on the local production build with no horizontal overflow or JavaScript errors. Local authentication used nonfunctional loopback settings to render the real forms; no account was created or email sent. Show/hide password worked at all three widths.
- Visual inspection found a floating Mentor link covering onboarding's Continue action. The widget is now hidden during journey and personal setup.
- Genuine TRUE/FALSE responses in Facts mode use the local checkpoint directly. Website completion preserves the former chat draft and acknowledges the updated journey.

## Behavior repairs

Tone, emoji count and pacing are conversation preferences, never graded answers. Generic mentor questions no longer receive the stored draft body as material for an unsolicited review. The classifier receives the actual pending prompt. Editing and asking for a question use server operations and recheck mission access, including older drafts outside the free allowance. Points and progress are server facts. Task completion still requires the existing correctness and practical-evidence checks. Ordinary questions do not consume practical-review credits.

## Usability follow-up

See [usability repairs](usability-repairs-2026-10-19.md) for session renewal, selected-language enforcement, homepage language sync, clearer WhatsApp linking and Google sign-in. Google provider configuration and a real Google login must be verified before calling that sign-in method ready. The earlier model audit above is supplemented by the six English-language cases in execution 25487.

## Live checks required before launch clearance

1. A genuinely new account signs up, confirms its email, completes the one-time seven-question personal setup, chooses a journey, signs out and returns with the correct saved state.
2. The same learner links WhatsApp, checks their profile/points/journey, adjusts tone, edits an actual draft and submits valid practical work. Verify the website reflects the reviewed saved result and a second learner sees none of that learner's data.
3. Confirm the approved Meta template name/language and observe an opted-in performance reminder arriving at the selected time, including delivery outside the customer-service window. Test pause/off behavior.
4. Verify the hosted authenticated mobile screens. The automated hosted browser encountered Hostinger's browser-check screen; local visual checks do not establish that the hosted signed-in journey works.
5. Payment acceptance remains unverified because it was explicitly excluded. Do not describe paid checkout as launch-tested.

The local runner still does not provide a general full-app/npm sandbox. GitHub source review is not the same as executing an arbitrary repository; product claims must preserve that distinction.

No customer messages were sent by the manual model audit. Its workflow remains unpublished and contains no WhatsApp send or website-write nodes. Audit artifacts and private settings are not part of the public source release.
