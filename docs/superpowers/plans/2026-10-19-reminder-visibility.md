# Reminder Visibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans for native implementation, or superpowers:subagent-driven-development if selected by the owner. Steps use checkbox syntax for tracking.

**Goal:** Show truthful reminder status, preserve work on pause, respect opt-out and recover interrupted jobs without blindly resending accepted messages.

**Architecture:** Extend the existing reminder/outbox records and signed n8n send-report contract with claim tokens and provider message IDs; correlate verified status receipts to those records. Reuse the learner's saved schedule and account identity.

**Tech stack:** Existing TypeScript/SQLite-compatible store, React Settings, Meta status receipts and signed n8n bridge. No new messaging destination or payment operation.

## Global constraints

- Follow the approved learner-quality/support spec. Preserve personal setup and practical assessment gates.
- A provider-accepted send is labelled Sent to WhatsApp; Delivered/Read requires a verified matching receipt. No claim of exactly-once delivery where provider acceptance is ambiguous.
- No real learner receives audit traffic. Outside-window sending needs the actual approved template and an identified opted-in test recipient.
- Exclude payments. Browser and real delivery checks stay pending until access is available.

## Review focus

1. STOP with punctuation must disable messages before any tutor call: Task 1.
2. Pause must preserve active and saved drafts: Task 1.
3. Crash before send versus lost acknowledgement after send must produce different recovery decisions: Task 2.
4. Duplicate or out-of-order delivery events must not regress Delivered/Read: Task 3.
5. Quiet hours/frequency changes and unavailable language templates must not produce a false next-delivery promise: Task 4.

## Task 1 — Safe opt-out and pause

**Modify:** `lib/bridge/whatsapp-chat.ts`, `n8n/code/wa-resolve-intent.js`, `app/api/whatsapp/route.ts`, `components/whatslearn/whatsapp-optin.tsx`.
**Tests:** `tests/whatsapp-pause-optout.cjs`.

**Interfaces:** `normalizeControlCommand(text:string):string`; `pauseReminders(userId:string):Promise<void>` changes only `remind_state`; stopping messages sets contact opt-out without deleting task drafts. Explicit unlink remains a separate deliberate website action.

- [ ] Write failing cases for STOP!, STOP., mixed case/whitespace, PAUSE, reminder-only pause and resume; assert consent state, zero tutor calls and unchanged active/saved drafts.
- [ ] Normalize the same command at n8n and server boundaries before dispatch. Separate reminder pause, message opt-out and explicit unlink.
- [ ] Add a real authenticated same-origin reminder pause/resume endpoint/action. Preserve the saved schedule and never automatically re-enable opted-out messaging.
- [ ] Run `node --test tests/whatsapp-pause-optout.cjs tests/whatsapp-bridge.cjs`, confirm zero failures and commit.

## Task 2 — Claim leases and accepted sends

**Create:** `drizzle/0022_reminder_receipts.sql`, `lib/bridge/reminder-delivery.ts`.
**Modify:** `drizzle/meta/_journal.json`, `lib/bridge/whatsapp-jobs.ts`, bridge reminder/outbox report routes and sanitized connected n8n workflow report code.
**Tests:** `tests/reminder-claims.cjs`.

**Interfaces:** each claim returns `{ref,claimToken,leaseExpiresAt}`; report accepts `{ref,claimToken?,ok,messageId?,errorCategory?}`. Existing boolean-only reports remain accepted for backward compatibility but cannot establish delivery. Lease duration is 10 minutes. Claim states distinguish `claimed`, `sending`, `sent`, `failed`, `unknown` and skipped categories.

- [ ] Write failing cases for a pre-send expired lease, expired sending lease with no acknowledgement, stale claim-token report, duplicate provider ID and legacy boolean-only reports.
- [ ] Add additive message IDs, claim tokens, stage timestamps and safe error categories. Transition to sending before dispatch. Reclaim expired pre-send work; mark ambiguous sending attempts unknown for reconciliation rather than automatically sending again. Bound retries for definite pre-acceptance failure to three attempts per slot.
- [ ] Update n8n to report provider acceptance/message ID and distinguish a send failure from a report-request failure. Preserve credentials and unrelated nodes. Retain backward compatibility while server and workflow roll out sequentially.
- [ ] Run `node --test tests/reminder-claims.cjs tests/whatsapp-bridge.cjs`, confirm zero failures and commit.

## Task 3 — Verified provider status receipts

**Modify:** `lib/whatsapp.ts`, `app/api/whatsapp/webhook/route.ts`, `lib/bridge/reminder-delivery.ts`; extend the existing authenticated bridge status route if the active n8n webhook owns incoming events.
**Tests:** `tests/reminder-status-receipts.cjs`.

**Interfaces:** `applyDeliveryStatus({messageId,status:'sent'|'delivered'|'read'|'failed',timestamp,errorCategory?}):Promise<{updated:boolean}>`; only signature-verified Meta input or signed bridge input reaches it.

- [ ] Write failing cases for bad signature, unknown message ID, unrelated account, duplicate receipt, Read→Sent and Delivered→older Failed.
- [ ] Correlate IDs to existing accepted sends, apply timestamps and monotonic status ordering, keep unknown events from creating account-owned messages. Do not accept an unverified client delivery assertion.
- [ ] Forward status events through the currently active n8n ownership path where necessary; do not register a second competing Meta webhook.
- [ ] Run `node --test tests/reminder-status-receipts.cjs`, confirm zero failures and commit.

## Task 4 — Learner status and language

**Create:** `lib/reminder-schedule.ts`, `lib/reminder-copy.ts`.
**Modify:** `app/api/whatsapp/route.ts`, `components/whatslearn/whatsapp-optin.tsx`, `lib/bridge/whatsapp-jobs.ts` and deterministic reminder/progress replies in `lib/bridge/whatsapp-chat.ts`/`lib/learner-performance.ts`.
**Tests:** `tests/reminder-schedule.cjs`, `tests/reminder-copy.cjs`.

**Interfaces:** `nextReminderSlot(schedule,at:Date):{at:string|null,reason:string,timeZone:'Asia/Kolkata'}`; `reminderView(userId):Promise<{enabled,next,latest}>`; map each configured/approved language template explicitly, with a truthful unavailable state when a selected-language template is absent.

- [ ] Write failing daily/weekdays/Monday-weekly cases, today-after-slot, overnight quiet hours, chosen hour inside quiet hours, paused contact and selected-language-template-unavailable cases.
- [ ] Compute the next eligible attempt from the existing two-hour eligibility window and quiet-hour rules. Display no timestamp when no eligible configured slot exists; distinguish a scheduled attempt from a delivery guarantee.
- [ ] Add a compact Settings card for On/Paused, time/timezone, next attempt and actual last result, plus real pause/resume controls. Localize deterministic controls/recaps for currently supported reviewed languages; explicitly label unavailable translations rather than mixing scripts silently.
- [ ] Run `node --test tests/reminder-schedule.cjs tests/reminder-copy.cjs` and confirm zero failures; commit.

## Task 5 — Review and release

- [ ] Run focused/new and existing non-payment checks, TypeScript and the production build; obtain an independent review.
- [ ] Deploy the server migration/backward-compatible report contract, update only the relevant n8n nodes and verify the published version matches reviewed parameters.
- [ ] When enabled, inspect Settings on desktop/phone and use only an explicitly identified opted-in owner test number for actual delivery. Record outside-window Meta template approval and the observed receipt; otherwise retain the check as pending.
- [ ] Record any ambiguous/unknown send states rather than declaring them delivered. Full-app/npm execution remains a separate provider-dependent phase.

## Execution method for owner review

Native implementation is recommended so server and n8n contract changes are coordinated in one session, with a separate reviewer before release. The owner may instead select subagent-driven implementation. Start only after plan/method review.
