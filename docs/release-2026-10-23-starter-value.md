# Value before sign-up — 23 October 2026

Release marker: `2026-10-23-starter-value-v6`. Includes the account/setup/tour fixes from v5 and matching name/nickname field styling from v5.1.

## Six recommendations

| Recommendation | Implementation |
| --- | --- |
| Show value before sign-up | Guests answer the starter decision, write their own short draft and finish an attempt to see sample feedback. No AI account request is mounted for this sample. |
| Actionable feedback | What worked, one improvement, next action and a short illustrative revision. New AI reviews can include a bounded example; old stored reviews remain readable. |
| Personalized path | Existing Find my path and Settings retain goal, starting level and language. The distinct once-only personal setup includes name/nickname and seven context questions. |
| Continue Learning dashboard | Existing My Journey retains the current mission, next task, roadmap and completed creations. The homepage distinguishes first-time practice from actual saved activity. |
| Optional WhatsApp | Core starter/course learning continues on the website. WhatsApp stays an optional linked channel, with connection instructions and a return to the website. |
| Show practical outcomes | Each of the four expandable course cards now includes an authored example: a lunch campaign, booking app, short film plan or visual story. |

## Accuracy and privacy boundaries

- Sample feedback describes an authored illustration, not the visitor’s answer. The guest attempt is an unreviewed local draft, with no course completion, score or mastery claim. Storage failure is shown clearly.
- Guest samples do not make AI calls or consume an AI review allowance. A later sign-in offers an explicit button to copy the guest starter; copying is never automatic and never merges rewards.
- Shared illustrative examples are labelled as English where appropriate. New starter AI feedback rejects unrelated scripts against the chosen output language. Exact learner quotes remain grounded in the submitted text.
- A short AI illustration is teaching guidance only; correctness and practical-evidence gates still determine completion. A polished example cannot make an incorrect or untested submission acceptable.
- No checkout transaction, paid sandbox run or customer WhatsApp message is executed in this release. Real AI accuracy/delivery, external service activation, owner-account reproduction and legal/security acceptance retain the limitations documented in the v5 release notes.

## Browser verification

The isolated production preview completed a guest marketing attempt without sign-in, displayed Step 3/3 and sample feedback, and retained a draft without assessment or points. At a 390×844 viewport, document and content width both measured 375px after the scrollbar. All four course examples opened. A synthetic account then completed the nine-question setup and returned to the same starter; its draft appeared only after explicitly choosing the import button. The name input measured the same 730px width as its container and 57.6px high. No console errors were captured. This used a local fake auth provider and separate test storage; no customer message or real AI evaluation was submitted.

595 non-payment regressions passed with no failures. TypeScript, the production standalone build and all 27 migrations passed. Deployment readback is recorded in the task evidence. The v5 release notes retain the outstanding live-provider acceptance limits.
