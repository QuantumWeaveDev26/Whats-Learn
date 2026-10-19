# Website audit — 19 October 2026

## Scope and evidence

Reviewed the deployed release `b4fc06d`, current source, 18 live HTTP page/path responses and five public/unauthenticated API responses. Audited four courses/40 missions, authentication and account storage, learner navigation, Settings, tours, mentor routing and reminder jobs. Four linked partner websites returned HTTP 200. No payment or checkout testing was performed.

Browser access is disabled in Work settings. Therefore this is **not** a completed authenticated desktop/mobile visual audit, a real Google login, or proof of WhatsApp delivery. Source findings are identified separately from isolated reproductions and live HTTP checks.

## Highest-priority defects

### A1. Starter copies are not isolated by account — P1, isolated reproduction

`lib/agency-story.ts:29–30` stores signed-in starter copies under one browser key. `app/learn/workspace.tsx:79` merges these copies into the current account's starter list; the portfolio and export include them at lines 110/118.

Reproduction using synthetic local data: save A's starter, then merge B's empty server starter list. Result: `visibleToB` contains A's starter text. This is a shared-browser disclosure, **not evidence of a database/API data leak**.

Fix: scope signed-in starter storage to account identity. Keep old unscoped pieces as explicitly identified guest/legacy copies requiring deliberate import; never silently merge them into an account portfolio.

### A2. An open learning tab retains old account data after sign-out — P1, isolated reproduction

`lib/saved-progress-sync.ts:13` permanently stops on a verified 401 without notifying the workspace. Later focus events cannot restart it because `stopped` remains true. The workspace therefore retains the previous account's displayed work and draft scope. A transient 503 uses a separate backoff path and is not this defect.

Reproduction: authenticated response → 401 → another account signs in elsewhere → focus old tab. Poll calls remain at 2 and state-refresh callbacks remain at 0. Later submission using another account's current cookies is a source-traced risk, not a live browser reproduction.

Fix: clear private in-memory state on confirmed sign-out, recheck identity on focus, and remount account-specific work/draft state when identity changes.

### A3. “PAUSE” deletes chat drafts — P1, source-confirmed

`lib/bridge/whatsapp-chat.ts:341,378` treats `pause` as a stop word and calls `unlink`. The function at line 86 deletes both `whatsapp_drafts` and `whatsapp_saved_drafts`. This conflicts with the promised pause/resume behavior.

Fix: separate pausing reminders/messages from unlinking a number or deleting work. Preserve drafts on pause and normal opt-out; make any destructive action explicit.

### A4. Punctuation can defeat WhatsApp opt-out — P1, source-confirmed

`n8n/code/wa-resolve-intent.js:20–25` forwards `STOP!`/`STOP.` as protected commands, but `lib/bridge/whatsapp-chat.ts:369,378` checks the unstripped `word`. There is no fallback `stop` switch case.

Fix: use one normalized stop-command value through the n8n and server boundary, before invoking the tutor. Add coverage for punctuation, whitespace and case.

## Other confirmed defects

| ID | Priority | Finding and evidence | Recommended correction |
|---|---|---|---|
| A5 | P2 | `workspace.tsx:109,122`: editing remains possible during evaluation; the successful old request unconditionally clears newer draft keys. An isolated V1-submit/V2-edit reproduction left the draft empty and moved to completion. | Bind save results to submitted version, identity and mission. Clear only the matching draft; keep newer edits and stay in editing. |
| A6 | P2 | `app/settings/page.tsx:17` replaces the browser name only when the server name is truthy. A nameless account can retain a previous browser user's name and post it on Save. | Apply empty server names too; scope account identity fields and show device-only preferences separately. |
| A7 | P2 | Settings turns non-OK profile GETs into `null`; a 503 leaves stale/default editable choices without an error, then Save can overwrite account choices. | Handle HTTP errors, show Retry and block account saves until the account profile is resolved. |
| A8 | P2 | `celebrations` and `supportLanguage` have no consumers outside Settings/preferences storage. `PointsBurst` does not check the celebrations preference. | Connect the controls to actual behavior or remove the unsupported choices. |
| A9 | P2 | `lib/bridge/whatsapp-chat.ts:288,298–310` and `lib/learner-performance.ts:17` construct fixed-English controls/recaps. These bypass the tutor-language formatter; reminder jobs use one global template language. | Localize deterministic replies and map selected languages to approved templates, with an explicit fallback when unavailable. |
| A10 | P2 | `lib/bridge/whatsapp-jobs.ts:36–40,78–81`: claims are made before rendering/sending; only explicitly failed claims are retried. An interrupted run can leave a reminder/notice claimed forever. | Add claim leases and provider-acceptance reconciliation. Do not blindly resend ambiguous accepted attempts. |
| A11 | P2 | `website-tour.tsx:58–60` does not remeasure a resized target or reacquire one detached by async loading. WhatsApp and sign-in controls can change after it measures. | Observe target size/layout changes, reacquire disconnected targets and keep the tour card within the viewport. |

The A1/A2/A5 reproductions used synthetic in-memory fixtures/mocked requests. The WhatsApp findings were traced from deployed source and the sanitized connected workflow; no learner messages were sent. Existing focused auth/context/draft/roadmap checks passed 43/43 but do not cover these paths.

## Content and product improvements

1. **Make progress labels consistent.** Explain Draft, Submitted, Needs changes, Accepted and Completed using one compact status system across website and WhatsApp. Show the learner what to do next after each state.
2. **Separate personal setup, journey preferences and display preferences visually.** Keep the submitted seven-question setup locked as requested, but clearly identify what can change and what syncs.
3. **Keep a single primary action on each learning screen.** Preserve the useful short instruction and put detailed rules in optional help. Avoid repeating reward/rule explanations in the mission introduction, review and completion state.
4. **Show reminder truth.** Sent/accepted is not delivered. Surface next eligible attempt, last actual event, pause/resume and template unavailability. This is covered by the approved quality/support design.
5. **Add learner reporting, an owner dashboard and human support requests.** These are approved design work, not yet deployed implementations.
6. **Use distinct page metadata and share previews.** Journey, Settings and Companion currently inherit the generic homepage title; Open Graph titles were absent from sampled HTML.
7. **Add discovery metadata.** Live `/robots.txt` and `/sitemap.xml` return 404. This is an SEO improvement, not a broken learner action or proof that indexing cannot happen.
8. **Complete public policy review.** The live policy pages explicitly say “Draft for legal review.” Their review status should be resolved with the responsible reviewer; the audit does not supply legal approval.
9. **Use a branded destination for FullAI.** The partner link works but uses a generated Hostinger subdomain. A stable brand domain would be easier for learners to recognize.
10. **Clarify the Star Learner decision.** Current recognition is based on completing ten creations, reflecting later developer-feedback changes. The earlier request specified ten consecutive days with 100 points each. Confirm the intended current product rule before changing rewards; do not silently reintroduce a stricter rule.

## What checked successfully

- Normal public pages returned HTTP 200; the deliberately unknown page returned 404. `/strategy` redirects home; unauthenticated `/welcome` redirects to sign-in.
- Google provider availability is enabled. This does not prove its complete login flow.
- Guest requests to profile, saved-progress sync and personal setup APIs return 401; session reports signed out.
- All four courses contain ten missions, a question and a practical outcome for each mission. This establishes content structure, not the quality of every model evaluation.
- No missing image alt attributes or duplicate HTML IDs were detected in the sampled server-rendered HTML. Dynamic browser accessibility still needs checking.
- Sampled partner links returned HTTP 200. Payment and checkout paths were excluded.

## Remaining live checks

Real first-time signup/Google login and return, account-switching in two tabs, website↔WhatsApp accepted task-save sync, the opted-in daily reminder at its chosen time, outside-24-hour delivery, and phone/desktop visual interaction. These require browser access and an identified owner-controlled test account/recipient; they are not established by HTTP or mocked tests.

## Recommended order

1. Repair A1–A4 first: account display isolation and non-destructive, reliable opt-out.
2. Repair A5–A11, with regressions for each confirmed path.
3. Release the approved reporting, owner quality dashboard, reminder visibility and support workflow.
4. Finish real authenticated desktop/phone and WhatsApp checks.
5. Connect full-app/npm execution only after an isolated service, credentials and resource budget are chosen. Until then retain truthful limits for the current runner.
