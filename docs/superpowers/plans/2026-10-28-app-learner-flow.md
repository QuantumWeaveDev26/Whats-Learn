# App learner flow improvements

User authorization: fix all eight learner-POV findings, keep the compact app style, change app screens only, then deploy to https://whatslearn.in/app. No payments, paid AI tests, website page edits, shared API changes, or database migrations.

## Implementation

- [x] Account-scoped resume of the selected task, lesson step, and draft; validate course locks and plan access before restoring. Cached reviews require matching submitted content and language/level.
- [x] Show the course's actual create/test/report requirements, rather than only its generic level instruction. Keep assessment criteria unchanged.
- [x] Provide distinct, free, offline teaching examples and plain-language steps. Preserve the website's shared points rules; the app does not call paid clue endpoints for these new teaching materials.
- [x] Add Back to lesson / Back to check / Edit work actions and scroll to the new step heading.
- [x] Show field-level requirements, progress, a direct route to the next incomplete part, and separate artifact/test/result/improvement evidence inputs composed into the existing reasoning field.
- [x] Rename course accordion actions to View course / View progress, with an explicit open-task action inside.
- [x] Explain points, daily task scoring and separate AI review allowances in a compact disclosure.
- [x] Show saved feedback, prior server reviews and bounded account-scoped reviewed versions on the device. Never invent missing history or claim local drafts are cloud-synced.
- [ ] Test with synthetic accounts and mocked providers; verify the full suite, types, build and browser flow. Review the patch, publish the app-only commits to the existing main deployment, and verify live /app assets.

## Verification boundaries

The pre-existing website JSX fingerprint test fails on unchanged main. Do not update that unrelated test or website code. Hostinger deployment reuses existing hosting and storage without environment changes or purchases. User has explicitly authorized deployment after this work.

## Verification and rulings

- New/previous app regression checks: 23 passed. Full synthetic suite: 787 passed, one unchanged website fingerprint failure (788 total). Type check, in-memory migration verification and production standalone build passed.
- Browser: horizontal drag works both ways without accidental navigation; taps still open courses. Refresh retained selected Full-Stack task, Make step, evidence section and typed artifact. Next-incomplete action focused the correct required field. Worked examples opened without a provider/points call; no browser console errors were observed.
- Review findings fixed: saved-work evidence now round-trips back into its separate inputs; controls prevent edits during save and stale save responses cannot clear newer work. Reproducing tests failed before the fixes and passed afterward.
- Ruling: preserve actual runnable-artifact/testing requirements and show them clearly. Do not rename a build task into a theory-only task or weaken shared grading.
- Ruling: app teaching examples use distinct scenarios and are free. Website clue endpoints and scoring rules are unchanged.
- Ruling: evidence and reasoning share the existing 1500-character server limit; the app checks the combined limit and asks for concise real extracts.
- Ruling: older version bodies are available only for reviewed versions kept on the current device. Server feedback history is displayed from the existing authenticated API and missing history is stated honestly.
- Local preview preference saves now simulate success in memory; they never write to the live website. Paid AI, payments and real-account mutations remain disabled in that fixture.
- Deployment uses the existing GitHub main auto-deployment. Shared website pages, API routes, library code, dependencies, environment settings and database schema have no changes.
