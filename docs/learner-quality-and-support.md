# Learner quality, reminders and support

## What learners can use

- **Report reply** appears beside a website AI answer or review when a server-owned reply reference was recorded. Reasons: wrong answer, wrong language, too long, not helpful, other. Sending a report never saves a mission or spends AI review allowance.
- In linked WhatsApp, explicitly ask to report the last reply. The receipt is created after WhatsApp accepts the actual outgoing message. The report shows the attached excerpt. Tone feedback alone does not create a report.
- **Need a person?** opens `/support`. Signed-in learners can describe the issue, attach their own report and follow its status and team update. Guests can use the existing team email. A saved request does not mean a person has been notified or is currently available.
- **Settings → WhatsApp → Reminders** shows On/Paused, saved time/frequency, next eligible attempt and latest actual result. Pause preserves the schedule, active draft and saved chat revisions. STOP switches off messages and reminders; START does not turn reminders back on.

## Owner operations

Open `/admin/quality` with the existing configured owner account (`BILLING_ADMIN_EMAIL`). Non-owners receive 404. A conditional link also appears on the support page for the owner.

Tabs: reply reports, support requests, service failures. Acknowledge, resolve or reopen reports/requests. Resolution text is visible to the learner. Actor, status and text are audited; do not enter private internal notes in that field. Failures contain allowlisted categories and opaque request references, never raw provider errors or credentials.

Reply receipts: seven days, most recent 100 per account. Reported excerpts are retained with their report. Operational events: 30 days. Resolved reports, requests and audit: 90 days. Account deletion removes related records.

## Deploy order

1. Deploy website code and migrations `0021_learner_quality.sql` and `0022_reminder_receipts.sql` through the existing GitHub main → Hostinger path. The standalone runtime applies additive migrations.
2. Publish the reviewed connected n8n graph. Preserve existing settings, account credentials and unrelated nodes. Never import sanitized PASTE placeholders into the live settings node.
3. Both direct and tutor reply branches record final accepted outgoing messages. Scheduled sends authorize dispatch before sending and report the provider message ID afterward. The existing Meta webhook forwards its original signed status body; no second webhook is registered.
4. Verify public pages, auth boundaries and published workflow contents. Use an identified opted-in owner recipient for any actual delivery check. Do not send audit traffic to learners.

### Reminder labels and recovery

“Sent to WhatsApp” is provider acceptance, not delivery. Delivered/Read requires a valid matching Meta status and recipient. Unknown IDs cannot change another learner's records. Duplicate/out-of-order receipts cannot regress Read/Delivered.

Clients explicitly request `protocol: staged-v1` before receiving recoverable pre-send leases. Those claims expire after ten minutes and can recover. Legacy senders without the begin stage remain conservative: an expired claim becomes Unknown and cannot be blindly resent. Dispatches with lost acknowledgements become Unknown and are not blindly resent. Definite pre-acceptance failure has at most three attempts per slot. Old boolean reports remain compatible but establish no delivery receipt.

The hourly scheduler runs at seven minutes past the hour. A selected-hour slot stays eligible for two hours, subject to quiet hours and daily/weekdays/Monday-weekly frequency. The displayed next time is an eligible attempt, not a promise of delivery.

### Selected-language templates

Existing `WHATSAPP_PROGRESS_TEMPLATE` (two body variables) or `WHATSAPP_PERFORMANCE_TEMPLATE` (four variables) is used only when `WHATSAPP_TEMPLATE_LANGUAGE` matches the learner's selected language. Existing names do not prove Meta approval.

Optional server-only `WHATSAPP_PERFORMANCE_TEMPLATES` is a JSON map of language code to `{ "name": "approved_template_name", "language": "en", "kind": "performance" }`. `kind` is `progress` or `performance`. Add only templates actually approved in that language. No selected-language template outside the 24-hour window produces an explicit unavailable state.

## Full apps/npm: separate connection required

Hostinger remains the website host. Full-app execution must happen in a separate isolated service, with no website tokens, database access or production environment passed into learner code. The six-file local JavaScript runner remains accurately labelled until the full service is connected and verified.

The approved design leaves provider/account/budget selection as a separate decision. A managed microVM service can be called from Hostinger; moving the website is unnecessary. For example, Vercel documents [isolated microVM execution](https://vercel.com/docs/sandbox) and [access-token authentication for non-Vercel hosts](https://vercel.com/docs/sandbox/concepts/authentication). This release does not provision an account, purchase usage or expose a non-working Run full app button.

Before enabling full projects: choose the provider and budget, enter credentials privately in hosting configuration, cap run time/memory/output/concurrency, restrict egress, bind each job and receipt to its learner/artifact hash, support stop/expiry, and verify a real npm install/build/test in isolation. A development preview or learner-supplied test result must not automatically award mission completion.
