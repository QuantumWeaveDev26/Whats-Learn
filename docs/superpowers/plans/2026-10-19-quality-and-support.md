# Learner Quality and Support Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans for native implementation, or superpowers:subagent-driven-development if the owner selects that method. Steps use checkbox syntax for tracking.

**Goal:** Implement the approved reply-reporting, owner dashboard and human support design, with account/draft safety repairs identified by the owner-requested audit.

**Architecture:** Account-owned database records and authenticated APIs using the existing storage layer; owner-only operations reuse the configured owner identity. Server-generated reply references associate reports with actual replies. An additive migration keeps existing work intact.

**Tech stack:** TypeScript, React, existing Vinext routes, SQLite/D1-compatible storage and signed n8n bridge. No new external helpdesk or payment operations.

## Global constraints

- Approved spec: `docs/superpowers/specs/2026-10-19-learner-quality-and-support-design.md`; audit: `docs/website-audit-2026-10-19.md`.
- Preserve first three free missions per course, correctness/evidence gates, immutable personal setup, selected language and existing white/green design.
- Ordinary questions and reports never spend practical-review credits or grant completion/points.
- New reply receipts expire after 7 days, operational events after 30 days and resolved reports/support after 90 days. Account deletion removes account-owned records.
- Use synthetic data for automated checks. No payments or messages to real learners as test traffic. Hosted browser checks remain pending while browser access is disabled.

## Review focus

1. Switching accounts on one browser must not expose another account's starter or in-memory work: Task 1.
2. An old save response must not erase a new draft or advance a different account/mission: Task 1.
3. A learner must not attach another account's reply ID to a report: Tasks 2–3.
4. Duplicate requests and telemetry failures must not duplicate reports or invalidate successful learner saves: Tasks 2–4.
5. A support reference is not evidence of a notified or available human: Task 5.

## Task 1 — Repair account and draft boundaries

**Modify:** `lib/agency-story.ts`, `lib/starter-bridge.ts`, `lib/saved-progress-sync.ts`, `app/api/session/route.ts`, `app/api/sync/route.ts`, `app/learn/page.tsx`, `app/learn/workspace.tsx`, `app/settings/page.tsx`, `components/whatslearn/visual-start.tsx`.
**Tests:** `tests/account-browser-isolation.cjs`, `tests/save-response-version.cjs`, `tests/settings-account-loading.cjs`.

**Interfaces:** `readAgencyDrafts(scope:string)`, `saveAgencyDraft(track,draft,scope:string)`; `startSavedProgressSync(onChange,onIdentityLost,onIdentityChanged)`; session/sync GET payloads include an opaque server-derived `accountKey` for the current account; LearningPage passes `initialAccountKey` to its workspace; save-result application captures `{scope,missionId,body,quiz}`. Account scopes use the current server identity; legacy browser starters are explicit import candidates, not account records.

- [ ] Write and run failing regressions: A saves a starter, B's empty portfolio contains none; verified 401 clears private view and permits focus identity recheck; stale 503 preserves identity but blocks settings save; empty server name clears a prior browser name.
- [ ] Add the deferred-save regression: submit V1, edit/autosave V2, resolve V1; assert V2 remains stored and the editor does not advance to completion.
- [ ] Implement scoped starter reads/writes and explicit legacy import; handle verified sign-out/account changes separately from transient failures. Clear private state immediately, then reload the server-rendered workspace on verified sign-out or changed accountKey; unchanged identity and 503 must not erase drafts. Apply save responses only to their captured account/mission/version.
- [ ] Implement Settings load states `loading|ready|guest|error`; block account POST before a successful profile read, allow Retry and preserve edits. Apply returned names even when empty.
- [ ] Run `node --test tests/account-browser-isolation.cjs tests/save-response-version.cjs tests/settings-account-loading.cjs tests/mission-drafts.cjs` and confirm zero failures; commit only these task files.

## Task 2 — Persistence, ownership and retention

**Create:** `drizzle/0021_learner_quality.sql`, `lib/quality/access.ts`, `lib/quality/store.ts`.
**Modify:** `drizzle/meta/_journal.json`, `lib/account-delete.ts`.
**Tests:** `tests/quality-store.cjs`.

**Interfaces:** `recordReply(userId,{channel,missionId,question,answer}):Promise<{id:string}>`; `createReport(userId,{replyId,reason,note,idempotencyKey}):Promise<{id:string,status:'received'}>`; `createSupportRequest(userId,{category,description,reportId?,idempotencyKey}):Promise<{id:string,status:'received'}>`; `pruneQualityRecords(at:Date):Promise<void>`; `qualityOwner():Promise<{userId:string;email:string}|null>` verifies the existing server-configured owner.

- [ ] Write failing tests asserting report B→reply A is rejected, invalid reasons/notes over 500 characters are rejected, duplicate idempotency keys return one record, 7/30/90-day expiry boundaries are correct and account deletion removes owned records.
- [ ] Add bounded SQL tables for reply receipts, reports, support requests, operational events and owner resolution audit rows; create indexes for owner/status/time and unique account/idempotency keys.
- [ ] Implement functions with server-generated opaque IDs, explicit ownership predicates and parameterized SQL. Store bounded excerpts, never raw tokens/provider bodies. Every record-creation operation and authorized dashboard list read calls `pruneQualityRecords(new Date())`; list/read queries also filter expired records regardless of cleanup timing.
- [ ] Run `node --test tests/quality-store.cjs`, confirm zero failures and commit the additive storage/access change.

## Task 3 — Actual reply references and learner reporting

**Create:** `app/api/quality/reports/route.ts`, `components/whatslearn/report-reply.tsx`.
**Modify:** `lib/mentor.ts`, `app/api/feedback/route.ts`, `app/api/starter-feedback/route.ts`, `components/whatslearn/practice-coach.tsx`, `components/whatslearn/starter-feedback.tsx`, `lib/bridge/whatsapp-chat.ts`, `n8n/code/wa-resolve-intent.js` and the sanitized connected workflow sources as needed for an explicit report request.
**Tests:** `tests/quality-report-api.cjs`, `tests/quality-whatsapp-report.cjs`.

**Interfaces:** successful website reply payloads gain optional `replyId`; POST `/api/quality/reports` consumes `{replyId,reason,note,idempotencyKey}` with same-origin/auth checks. WhatsApp report creation uses the verified contact's user ID and its latest recorded reply, not a client-supplied user ID or task draft.

- [ ] Write failing API tests for guest 401, cross-origin 403, foreign reply 404, field limits, duplicate retries and unchanged AI allowance/points/work.
- [ ] Record bounded replies after successful generation; receipt-storage failure must not discard an otherwise valid mentor answer. Omit the report action when a reliable reply reference could not be recorded.
- [ ] Add the compact report UI with five approved reasons, optional note, attached-reply preview, sending/error/received states and a real persisted reference. Keep input on failure.
- [ ] Add explicit natural report handling in WhatsApp before answer collection. If no reply receipt exists, request the actual reply and preserve the task. Never attach an unrelated draft or claim a report was filed before storage succeeds.
- [ ] Run `node --test tests/quality-report-api.cjs tests/quality-whatsapp-report.cjs`, verify no counters or task state changed, and commit.

## Task 4 — Owner dashboard and operational failures

**Create:** `app/admin/quality/page.tsx`, `app/api/admin/quality/route.ts`, `components/whatslearn/quality-dashboard.tsx`, `lib/quality/events.ts`.
**Modify:** `lib/quality/store.ts`, failure boundaries in `app/api/feedback/route.ts`, `app/api/work/route.ts`, `lib/bridge/whatsapp-jobs.ts`.
**Tests:** `tests/quality-admin.cjs`, `tests/quality-events.cjs`.

**Interfaces:** `listQualityItems(owner,{kind,status,cursor,limit}):Promise<{items,nextCursor}>`, limit 1–50; `updateQualityItem(owner,{kind,id,status,resolution?})`, status `acknowledged|resolved|received`; `recordQualityEvent({userId?,channel,category,correlationId}):Promise<void>` with an allowlisted category and no free-form exception body.

- [ ] Write failing tests for non-owner 404 on both page/data/mutations, same-origin enforcement, page bounds, resolution audit attribution and rejected submissions not being counted as outages.
- [ ] Build the compact reports/support/failures tabs and explicit owner actions. Include loading, empty, error and retry states; display only necessary account references/excerpts.
- [ ] Add best-effort structured failure logging. Simulate storage failure and assert the original successful save or original accurate error response remains unchanged.
- [ ] Run `node --test tests/quality-admin.cjs tests/quality-events.cjs`, confirm zero failures and commit.

## Task 5 — Support handoff and learner status

**Create:** `app/support/page.tsx`, `app/api/support/route.ts`, `components/whatslearn/support-request.tsx`.
**Modify:** `app/settings/page.tsx`, `components/whatslearn/practice-coach.tsx`, `lib/bridge/whatsapp-chat.ts`, `lib/quality/store.ts`.
**Tests:** `tests/support-handoff.cjs`.

**Interfaces:** POST `/api/support` accepts category, description up to 2,000 characters, optional owned reportId and idempotency key. GET returns only the signed-in learner's requests and learner-visible resolutions. Guests receive existing team email/WhatsApp links.

- [ ] Write failing tests for own/foreign request visibility, duplicate submissions, note bounds, ownership of attachments and preservation of mission drafts/points.
- [ ] Build Need a person? entry points and the short support form with previewed optional attachment, persisted reference and actual status. Use existing team contact links; no automatic staff messages or invented response-time promise.
- [ ] Connect dashboard resolution to the learner's status view without exposing private admin notes.
- [ ] Run `node --test tests/support-handoff.cjs`, confirm zero failures and commit.

## Task 6 — Release review

- [ ] Run the new focused checks, existing non-payment regression suite, TypeScript and production build. Fix failures without weakening assertions.
- [ ] Request one independent whole-change review; repair important findings before release.
- [ ] Inspect signed-in desktop/phone layouts, keyboard flows and a two-account/two-tab scenario when browser access is enabled. If unavailable, explicitly retain these checks as pending.
- [ ] Publish only reviewed files through GitHub main's existing deployment path, confirm the new release assets and safe unauthenticated API behavior, and record exactly what remains unverified.

## Separate follow-on work

Reminder delivery/status has its own plan: `2026-10-19-reminder-visibility.md`. Full-app/npm service selection remains blocked on a provider account, credential entry and operating-budget choice; no purchase or fictitious Run full app button is part of this release.

## Execution method for owner review

Native implementation in this session is recommended because the storage, report IDs and ownership boundaries are closely coupled. A separate reviewer checks the final change. Subagent-driven implementation is available if the owner prefers a fresh implementer/reviewer for each task. Implementation begins after this written plan and the method are approved.
