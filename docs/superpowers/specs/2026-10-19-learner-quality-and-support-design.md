# Learner quality, reminder visibility and support

## Intended outcome

Learners can flag an unhelpful mentor answer, see what happened to reminders and reach a person without losing their task. The owner can investigate actual failures in one private dashboard. Complete applications with npm need execution evidence from an external isolated service. Existing language choices, practical assessment gates, free mission limits, immutable personal setup and the white/green interface continue to apply.

Requested scope also includes real Google login, website/WhatsApp task-sync checks and a hosted phone walkthrough. Payments remain excluded.

## Current evidence

- Google availability currently returns `google: true`; this does not prove a complete Google login.
- `lib/bridge/whatsapp-jobs.ts` already claims reminders, records send reports and provides aggregate diagnostics. Its `sent` state means the sender reported success; it is not a delivery receipt.
- `app/api/whatsapp/route.ts` exposes the signed-in learner's schedule and latest attempt. The existing UI keeps it inside expandable details.
- The existing owner-only rewards API verifies a server-controlled account-owner email. The quality dashboard can reuse that identity boundary without touching payment operations.
- `lib/project-bundle.ts` permits 1–6 JavaScript files and local imports only. `lib/isolated-runner.ts` runs bounded QuickJS jobs. Neither executes a general npm application.
- Live browser use is disabled in Work settings. Real authenticated browser and phone visual checks therefore remain pending.

## Approach choices

1. **Extend the website's database, APIs and existing owner access (recommended).** Reports, support requests and reminder events remain attached to the learner's account, with one dashboard and no new ticketing service.
2. **Add an external helpdesk and monitoring service.** This introduces another account, recurring configuration and another destination for learner information; it is unnecessary for the first release.
3. **Use email-only reporting.** This is small but cannot reliably associate a report with the actual mentor reply or track resolution in the website.

The proposed first release uses option 1. Full-app execution is a separate service integration after provider access and resource limits are selected.

## 1. Report a mentor reply

- Add a compact **Report reply** action beside website mentor answers and starter feedback. Reasons: Wrong answer, Wrong language, Too long, Not helpful, Other.
- A short optional note is limited to 500 characters. Show exactly which reply is attached before submission. Do not attach a learner's entire portfolio, personal setup or chat history.
- Persist server-generated response IDs for website replies. Reports validate the reply's owner and channel on the server. A learner cannot report or read another account's reply by changing an ID.
- For linked WhatsApp, support an explicit request to report the last mentor reply, in natural wording. Prefer the latest server-recorded reply. If it was not recorded, ask the learner to provide the reply instead of attaching an unrelated draft. Reporting never becomes an assessment answer or changes points.
- Return a genuine report reference only after persistence. Retrying the same report is idempotent. Network failure leaves the note available for retry.
- Store relevant reply/question excerpts only when necessary for the report; do not create a permanent unbounded transcript.

## 2. Owner quality dashboard

- Add `/admin/quality`, accessible only to the existing configured account owner. APIs repeat that authorization; hiding a link is insufficient. Other accounts receive 404.
- Tabs: Reply reports, Support requests, Operational failures. Default view is unresolved items, newest first, with bounded pagination.
- Show report reason, channel, course/mission reference, submitted time and the explicitly attached excerpt. Do not expose tokens, phone numbers, personal setup answers or complete drafts.
- Owner actions: acknowledge, resolve with an optional learner-visible explanation, reopen. Mutations require same-origin requests and record who changed the state and when.
- Operational failures contain an allowlisted error category, time, channel and correlation ID, not raw provider exception bodies or credentials. Include evaluation failures and reminder failures without treating a rejected learner submission as a service failure.
- Logging failures do not turn a completed learner save into an error or replace an accurate API response.
- Use an additive migration for reports, support requests, operational events and resolution audit records. Limit displayed history to the recent 30 days; retain reports/support for 90 days after resolution, operational events for 30 days and unreported reply receipts for 7 days. Follow account deletion rules for account-owned records.

## 3. Reminder status and pause

- Show a concise card in Settings: On/Paused, chosen time and timezone, next scheduled attempt, and the latest recorded result.
- A genuine **Pause reminders** action changes only reminder consent. It does not unlink the number or disable learner-initiated chat. Resume uses the saved schedule and explicit learner action.
- Compute the next eligible attempt using saved frequency, India time and quiet hours. If quiet hours exclude the chosen slot, explain that no reminder is scheduled for that slot instead of promising a delivery time.
- Use labels: Queued, Sending, Sent to WhatsApp, Delivered, Read, Failed, Skipped outside window, Template unavailable, Status unknown. Display Delivered/Read only after matching a verified Meta status receipt to a recorded message ID.
- Extend n8n send reports with the provider message ID and an optional safe error category. Older boolean-only reports remain accepted and appear as Sent to WhatsApp or Failed, never Delivered.
- Verify receipt signatures, correlate status updates to the actual recorded message and apply updates idempotently without regressing Delivered/Read to Sent. Unknown message IDs do not alter learner data.
- If the active n8n webhook receives status events, forward authenticated status material through the existing signed bridge. Do not create a second competing webhook or claim delivery from a workflow success alone.

## 4. Human support handoff

- Add **Need a person?** in mentor help, Settings and error recovery, linking to a small support form on the website.
- The form creates a stored request with a reference, category and learner's description. Attaching the current reported reply is optional and visible before sending.
- The learner sees the actual request state and owner-written resolution. Do not promise a response time, a staff notification or a live agent transfer that is not configured.
- Offer the existing team WhatsApp and support email as alternatives. The learner sends those messages themselves; the site does not automatically message staff or third parties.
- Guests can use the existing team contact links. Account-linked support requests require sign-in so ownership and status remain private.

## 5. Full application/npm execution

**Recommended architecture:** a managed isolated microVM execution service behind a server-only adapter. A separately operated execution host is an alternative with substantially more operational responsibility. Installing packages in the website's Node process is not an execution boundary.

- Connection requires a real provider account, server-side credentials and an explicit operating budget. None is configured in this change; no new service is purchased or provisioned by the design.
- Accept a bounded file manifest and lockfile, validate paths and reject traversal/symlinks. Start with Node projects and fixed install/build/test commands, not arbitrary host commands.
- Each run gets a fresh environment, maximum duration, output limit and per-account concurrency/rate limits. Website credentials and production database access never enter the environment.
- Limit network access to the package and source hosts required for that run. Stop/destroy the environment on success, failure or timeout.
- Return an artifact hash, actual command exit codes, bounded logs and timestamps. Tie evaluation evidence to that exact artifact version. Execution success alone does not complete a mission.
- Until a provider is connected and an actual project run passes, retain the current truthful six-file runner description. Do not expose a nonfunctional Run full app button.

Primary reference for the managed execution model and isolation: https://vercel.com/docs/sandbox . Provider selection and pricing require a separate decision; this reference is not a purchase recommendation.

## Validation and release

1. Check report ownership, duplicate submissions, input limits, retry behavior and admin authorization using synthetic accounts.
2. Verify reminder next-slot calculations, pause/resume, old/new n8n reports, signature rejection, duplicate/out-of-order receipts and truthful UI labels. Do not send messages to real learners as a test.
3. Verify support ownership, references and resolution history; no automatic staff message is sent.
4. Check desktop and phone layouts, keyboard operation and readable compact copy when browser access is available. TypeScript and the production build must pass before release.
5. Use an owner-controlled account for real Google sign-in and the complete WhatsApp task-save walkthrough. Confirm a second account sees none of its records. A real reminder check requires an explicitly identified opted-in test recipient and an approved template for outside-window delivery.
6. Publish the first four features independently of the full-app service. Release full-app execution only after a provider, limits and actual execution receipts are verified. Keep all remaining live checks explicitly pending until observed.

## Approval and implementation order

Review this written design first. After approval, write the implementation plan for report persistence and owner authorization, then reminder receipts/status, support handoff, and the separately connected full-app runner. Review that plan before changing the product flows.
