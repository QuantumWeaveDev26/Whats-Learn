# WhatsLearn project review — 22 October 2026

## Scope and limits

Reviewed the current checkout (`db10bc4`), auth/session handling, personal setup, learning and evaluation, mentor routing and memory, WhatsApp reminders/notices, quality/support, sandbox integration and release documentation.

Read-only live checks confirmed release `2026-10-22-responsive-tour-v3`. Home, Journey, Settings, Support, Sign in and Privacy returned HTTP 200. AI availability reports enabled and Google availability reports enabled. Those responses do not prove a successful signed-in session, provider answer or Google login. The full-project endpoint correctly required authentication (401), which does not establish whether its provider is connected.

Inspected the active n8n workflow `pktkYZFWUH8gPBVN`, active version `4e7fbe44-0249-4871-a4c0-b9a3e814d2dd`, with 70 nodes. No workflow was changed or executed. No customer messages, paid provider runs, payment tests or production account writes were made. This turn did not repeat the previous interactive public tour checks or perform authenticated browser testing.

## Issues and implementation gaps

### 1. P1 — Personal setup lacks account-switch protection

**Source-traced risk, not reproduced with real accounts.**

`components/whatslearn/personal-setup.tsx:7–12` keeps seven answers in component state and submits them without an account marker. `app/welcome/page.tsx:6` passes only the next destination. `app/api/learner-context/route.ts:8` authenticates the current cookies, but does not compare the submitting account with the account that opened the form. `lib/learner-context-store.ts:5` then locks that first saved setup.

If A leaves this form open and B signs in through another tab, A's pending answers can be submitted under B's session when B has no saved setup. This is an unintended shared-browser write, not evidence of access to another account's database records.

**Recommendation:** bind the form to the server-rendered account marker, check it on POST, and clear or block the old form after an identity change. Preserve the requested one-time, locked setup design.

### 2. P1 — WhatsApp timeout budgets do not cover evaluation work

**Confirmed configuration mismatch; actual timeout frequency was not measured.**

The active n8n `WhatsLearn Handles Message` node uses a 30,000ms timeout and retries up to three times. Individual AI requests in `lib/ai-feedback.ts:33,40` allow 45,000ms. A review can call the provider for its initial review and then a separate correctness verification (`:99,110–112`). Chat checks can also call a shortening/translation pass (`:187–192`).

A valid evaluation can therefore outlast its caller, producing a retry/failure notice while server work is still running. The existing idempotency protections should be preserved; longer timeouts alone do not create a good learner experience.

**Recommendation:** acknowledge long reviews quickly, persist a job/status, and deliver one final result. Align remaining synchronous deadlines and measure time to first response, completion time, retries and provider errors. Avoid extra model calls solely to enforce a tiny word limit.

### 3. P2 — Selected-language coverage is incomplete

`lib/personalization.ts:31–36` deliberately restores English questions, options, explanations, tasks and practical fields for rewritten missions, even when the lesson body is translated. This protects answer-key consistency, but does not provide a fully local-language course. `lib/mission-practice.ts:55` obtains the new practice instructions from the English `courseSteps` bank.

WhatsApp completion and badge notices are also fixed English in `lib/bridge/whatsapp-jobs.ts:75–78`; several navigation/status replies in `lib/bridge/whatsapp-chat.ts` bypass the AI language formatter.

**Recommendation:** translate one canonical, versioned set of question/options/task/field prompts/checks per mission. Keep answer indices aligned and test deterministic messages as well as AI prose. State any remaining fallback clearly.

### 4. P2 — Conversational continuity is much smaller than account synchronization

`lib/mentor-conversation.ts:5–20` stores at most two turns, returns only the latest, expires them after 24 hours and separates web from WhatsApp. Fresh profile/progress data still loads independently through `lib/mentor.ts`; it should not be confused with full conversation memory.

**Recommendation:** retain a small learner-approved summary of explanation context and pacing preferences across channels, with a clear expiry/reset control. Keep live account facts authoritative and old feedback out of new assessments. Do not retain unlimited raw history.

### 5. P2 — Reminder batching will omit learners beyond the first 1,000

`lib/bridge/whatsapp-jobs.ts:30` selects opted-in contacts with `LIMIT 1000` and no cursor/pagination. The rest of the loop cannot reach contacts omitted by that query. This is a confirmed scaling limit, not evidence that current learners have already missed reminders.

**Recommendation:** query due contacts with indexed schedule criteria and process them in paginated, bounded batches. Preserve dispatch authorization, leases, opt-out checks and reconciliation of ambiguous provider acceptance.

### 6. P2 — Progress synchronization is costly at scale

`lib/saved-progress-sync.ts:1–24` polls each visible online learning tab every second. `app/api/sync/route.ts` performs several database subqueries and a plan check on each poll; authentication also uses the provider/cache path.

**Recommendation:** measure load, lengthen idle polling, add jitter and coordinate tabs. Consider server events or a lightweight revision counter. Keep fast refresh after a save, tab focus and reconnect. This is a capacity improvement, not a demonstrated outage.

### 7. Readiness — Full-project execution and staff notification need operational acceptance

The reporting, owner dashboard, reminder status and support-request implementations exist. Do not add duplicates. The sandbox service and staff alert queue also exist, but source code and a configured URL are not proof of a completed provider run or a received staff notification.

`lib/full-project.ts:9` requires an isolated URL, token and an owner-approved daily run cap. The current integration supports bounded build/test commands; it does not provide an interactive full-app preview. `lib/quality/alerts.ts:11–16` dispatches only when its webhook and token are configured; the normal notice scheduler dispatches one queued alert per poll, so backlog latency should be measured.

**Recommendation:** verify owner service readiness, connect any missing destinations, then perform an authorized sandbox acceptance run and staff alert receipt check. Budget approval is needed before paid execution. Do not execute learner code on the production Hostinger/n8n VPS.

### 8. P2 — Public policy text still describes an older product

Live Privacy still displays “Draft for legal review.” `app/privacy/page.tsx` describes ChatGPT sign-in prominently but does not name the deployed Google sign-in or document the seven personal-setup fields specifically. It also says under-18 learners should remain guests until a consent process exists, while the account setup accepts an `under-18` age band (`lib/learner-context.ts:3,11`) and persists it through the normal setup endpoint.

**Recommendation:** have the owner and appropriate reviewer reconcile policy text with the actual data flows and intended age policy. Implement the chosen product restrictions consistently. This finding identifies documentation/behavior inconsistency; it is not legal approval or a conclusion about statutory compliance.

### 9. P3 — Search and page identity remain unfinished

Live `/robots.txt` and `/sitemap.xml` both returned 404. `/learn` and `/settings` inherit the generic homepage title. Support and Sign in already have distinct titles.

**Recommendation:** add a public sitemap, intentional crawler rules and distinct metadata. Index public course information; keep private account content appropriately excluded. Add accurate social previews.

### 10. P3 — Release documentation has contradictory status

`docs/deployment-guide.md` still recommends a Cloudflare-first deployment and says nothing has been deployed. Older audit/readiness documents list tour and quality/support work as pending, even though newer source and live checks show those implementations.

**Recommendation:** keep one current deployment/runbook and one acceptance checklist, clearly marking older audits as historical. Separate built, configured, deployed and verified states for every external integration.

## Product improvements worth prioritizing

1. **One obvious next action:** a short Today card with current task, saved state and Start/Continue. Keep detailed rules inside optional help.
2. **A worked mini-example:** show a small separate example before the learner's own real-world task. Do not expose a complete answer to the graded mission.
3. **Device-aware practice:** the setup records phone/laptop, but development practice still asks for local servers, databases and commands. Give phone learners a practical supported path and explain when a computer is needed.
4. **Clear feedback states:** distinguish Draft, Checking, Needs one change, Accepted and Saved across web and WhatsApp. Show the exact missing evidence instead of repeating the entire task.
5. **Teach at the requested pace:** default to one idea and a familiar example; offer “simpler,” “another example” and “more detail.” Preserve free-form questions and avoid forced slang or repeated names.
6. **Measure real learning quality:** maintain independently judged valid/invalid submissions across courses, levels and supported languages. The scheduled CI is synthetic; it does not prove current model quality or real WhatsApp delivery.
7. **A small first-time learner pilot:** observe signup, return login, personal setup, one task, review, website↔WhatsApp sync and a reminder. Record completion rate, confusion points, response latency and reported wrong answers.

## Recommended order

1. Fix setup account-switch protection and the WhatsApp/AI timeout mismatch.
2. Complete deterministic language coverage and reconcile policies/data flows.
3. Verify authenticated onboarding, Google return login, task synchronization, real reminder receipt and support delivery using authorized test accounts.
4. Improve beginner/device-aware task guidance and measure real AI evaluation quality.
5. Address reminder pagination, synchronization load, discovery metadata and documentation maintenance.

No code or live configuration was changed as part of this review.
