# Usability repairs — 19 October 2026

## Changes

- Concurrent account requests share a short refresh handoff. Temporary provider outages and rate limits preserve login cookies and report an unavailable service instead of a signed-out session. Confirmed invalid refresh tokens still sign out. Sign-out invalidates the refresh handoff.
- Already signed-in visitors to sign-in/sign-up resume their destination through the existing personal-setup gate. Navigation and the Mentor widget refresh account/link status on route changes and return from another tab.
- Saved language wins over device history and old lesson links. The homepage language picker changes only the account language and updates the linked WhatsApp contact without overwriting course settings.
- English selection no longer switches to Kannada because of the submitted text. Mentor/coaching replies check for unrelated scripts; the connected WhatsApp formatter rejects mixed-script output. The model is instructed not to infer a city or language from names, phone numbers, timezones or mission scenarios.
- WhatsApp is explicitly optional. Settings explain entering a number, sending the link code and requesting TODAY. Pending-link status refreshes automatically. Secondary reminder/draft details are expandable; the website remains available throughout linking.
- The learning dashboard gives three actions: open the mission, make and test it, submit for review. Repeated fit/reason explanations are expandable. The companion screen prioritises website and WhatsApp, with ChatGPT clearly separate. Fixed the hard-coded Kannada example and contradictory translation copy.
- Google sign-in is implemented through the existing provider and session system. See `google-sign-in.md` for the provider configuration and required real Google walkthrough. Provider availability is checked before showing a functional button.

## Evidence and remaining checks

Focused regression checks cover expired-cookie concurrency across protected sections, read-only page handoff, temporary provider failures, rate limits, revoked refresh tokens, sign-out, language precedence, language-only updates, mixed-script blocking and Google PKCE/state/callback/error paths. Tests use synthetic accounts and local provider doubles; they do not establish production Google approval or delivery of WhatsApp messages.

Unpublished n8n manual execution 25487 returned all six tested responses in English with stale Kannada/Telugu conversation data. It also declined to claim the learner's exact location. This small sample does not guarantee every future reply is correct. The audit has no customer-message or website-write nodes.

Payment testing remains excluded. Actual Google sign-in, hosted authenticated navigation, WhatsApp task-save sync and selected-time/outside-window reminder delivery remain required before public-launch clearance. Local visual and synthetic-account checks are recorded separately from those production checks.

The final non-payment suite passes 468 checks; TypeScript and the production standalone build pass. Independent review found two homepage language/loading races; both were reproduced and fixed with focused regression checks.

The workspace also stops reapplying a language query after the profile panel has resolved the account language. Its URL is updated to the resolved language. This redundant override was reproduced separately from language-picker and backend-language tests.

Local production-build browser QA covered 14 non-payment pages at 1440px, 390px and 360px: no horizontal overflow or JavaScript page errors. A fresh synthetic browser account completed signup, email confirmation and the seven-question setup, stayed signed in across Settings/Companion/Journey, skipped the sign-in form when already authenticated, synced the homepage language to the account, corrected an old Kannada lesson URL to saved English, and refreshed a simulated pending WhatsApp link after return. The provider and WhatsApp connection responses in these local checks were synthetic; no real email, Google sign-in or WhatsApp message was sent.
