# Developer feedback follow-through — 19 October 2026

Source: the two-page “WhatsLearn — developer feedback” supplied by the owner. Its observations distinguish confirmed public-screen behaviour from checks still needing demonstration. It is not proof of production evaluation or delivery.

## Feedback and implementation

1. **Onboarding → suitable task.** `learning-engine.ts` supplies the chosen goal, course, level and time, first-challenge fit, and first action. The onboarding result and lesson both use this path. The mentor now receives the same actual next-task reason, focus and reviewed feedback.
2. **Useful AI feedback.** Starter and mission review show What worked, Improve and Next action. Provider failure keeps a draft and allows retry; it does not claim assessment. Existing answer-specific review and correctness gates remain.
3. **Real adaptation.** Evaluated criteria drive targeted skill practice, repeated-mistake support and harder constraints. The PDF completion regression covers weak audience work → targeted practice → revised creation → one save → harder next task → WhatsApp with the same saved context. Provider outputs in this regression are simulated.
4. **Simple learning screen.** Today’s task and Start/Continue lead the dashboard. Preferences, detailed roadmap and optional rewards are expandable. Existing narrow-screen layout rules were inspected. A fresh rendered desktop/mobile browser check could not run because the computer-use runtime fails to initialize.
5. **Simple progress and rewards.** Saved course creations are primary; reward details are optional. Revision rewards require improved reviewed criteria and are granted once. Help and breaks do not remove the current Star Learner eligibility. Retry/refresh must not grant duplicate completion or rewards.
6. **Saved-work clarity.** Starter practice appears separately in My Creations; it does not silently count as a full course mission. Saved account choices and work are shared by the website and verified WhatsApp link. Unfinished chat and website drafts remain separate, as requested by the owner.
7. **Complete-flow evidence.** Run `tests/pdf-feedback-completion.cjs`, `tests/mentor-identity.cjs`, `tests/mentor-n8n-identity.cjs`, the bridge and Kannada/Kanglish regressions. These exercise real application/database logic with synthetic learners and simulated providers. They do not prove a real provider’s response or WhatsApp delivery.

## Name and conversation fixes in this change

- One name resolver: saved website name first, verified account-link name second. No email-derived or fabricated name; strip control characters and message formatting.
- Greetings, progress and mentor context now agree. Mission continuation and the first reply after a break include the name even if the model leaves it out. Avoid repeating the name on every answer.
- Remove the conflicting “No greeting” instruction from ordinary mentor chat; keep assessment feedback focused on the answer.
- Ordinary replies default to 45 words; explanation requests can be longer. Questions remain separate from assessment allowances and preserve unfinished work.
- The n8n agent fallback also preserves returning names. Remove the old rewrite that replaced account-link instructions with a course-selection menu.
- Approved outbound reminder templates keep their approved variable contract. These changes do not establish Meta approval or delivered/read status.
