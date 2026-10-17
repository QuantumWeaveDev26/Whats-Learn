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
- Native Kannada/Kanglish quality review remains required; prompt/unit tests do not establish language quality.
- No market-launch conclusion is made.
