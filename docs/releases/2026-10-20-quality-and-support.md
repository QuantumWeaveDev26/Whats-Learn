# Quality and support release — 20 October 2026

## Implemented

- Account-owned mentor reply reports on the website and linked WhatsApp, with real persisted references and retry deduplication.
- Owner-only quality dashboard with reports, support, safe service failures and audited resolution actions.
- Tracked human support requests and learner-visible updates at /support.
- Reminder status in Settings: next eligible attempt, actual last result, pause/resume and safe opt-out. Drafts survive pauses. Provider acceptance is separate from verified delivery/read.
- Account-scoped starter data, old-tab write checks, protected asynchronous saves and identity changes; working celebration preference and tour resize/reacquisition.

## Verification

- 516/516 non-payment checks passed; TypeScript passed; production standalone build passed.
- 26 new/changed n8n node configurations validated by the connected n8n service.
- Local production HTTP smoke: /support and /settings 200; learner report/support APIs 401 for guests; owner page/API 404 for non-owners.
- Independent whole-branch review identified four important issues. Each was reproduced RED, fixed, and verified GREEN: filtered WhatsApp batch lineage, starter clearing for a new account without a profile, conservative legacy-claim recovery, and post-save refresh editor race. Related queued-language identity regression was also reproduced and repaired.
- No payment or checkout checks. No messages sent to real learners for verification.

## Pending external verification

- Signed-in desktop (1440px) and phone (390px) navigation, support, reporting, reminder controls and tour placement were checked live on 22 October. A fresh Google OAuth sign-in and cross-account live acceptance check remain pending; the existing owner session stayed signed in across pages.
- Actual Meta delivery, approved template acceptance and an end-to-end WhatsApp task save need an identified opted-in owner test recipient. A configured template name is not evidence of approval or delivery.
- Full apps/npm remains pending a separate sandbox provider/account/budget connection. Hostinger continues hosting the website; no hosting move is required. The current six-file JavaScript runner is accurately labelled. No dummy full-app button or unsafe npm execution was added.

## Rulings made during execution

1. Native worktree registration could not resolve the parent chat directory, so an isolated Git worktree was created manually. Cost if wrong: manual worktree cleanup, not a reset of existing work.
2. Reused installed node_modules through a junction without changing dependencies. Cost if wrong: a shared dependency change could affect this checkout; the production build used the existing dependency set.
3. WSL helper scripts cannot resolve Windows absolute linked-worktree paths. Kept their ledger/brief format with PowerShell/Python and captured command output. Cost if wrong: helper automation itself was not exercised.
4. Added expected-account headers to new web writes while preserving old API clients. Cost if wrong: old cached clients lack the extra stale-tab guard and should reload; server identity and ownership checks still apply.
5. Normalized CRLF in a deployment documentation assertion and updated source contracts for scoped reads, paired receipts and extracted helpers. Kept behavioral assertions. Cost if wrong: a faulty contract update could conceal a regression; added executable identity/race tests cover the repaired behavior.
6. Bounded unreported reply history to 100 receipts per account within seven days. Cost if wrong: older unreported replies need a pasted support description; reported excerpts persist independently.
7. WhatsApp without a reliable reply receipt routes to the support form rather than silently collecting the next pasted text as task work. Cost if wrong: one additional website step to attach the reply.
8. The old no-repeat fixture now checks within the ten-minute lease; explicit expiry tests cover recovery and unknown-send handling. Cost if wrong: lease behavior depends on the staged-send capability handshake, which is separately tested.
9. Preserved the later approved low-pressure progress recap and practical next action, with detailed reward metrics optional. Explicitly configured the Hindi template fixture instead of allowing an English template for a Hindi learner. Cost if wrong: owners seeking different default recap metrics must make that product choice.
10. Real browser, Google, Meta delivery/approval and full npm execution are not treated as proven by synthetic tests. Cost if wrong: release readiness still depends on those live acceptance checks; no flawless-public-launch claim is made.

## Deferred minor

The owner dashboard initially shows all statuses instead of unresolved only. The owner can filter to received/acknowledged. Cost: an extra filter selection; learner reporting and resolutions work.

## Deployment — verified live on 22 October 2026

- Hostinger deployment `01a161ec-d883-7254-a6fc-47acf8433069` completed and is Current for GitHub main commit `4a2d8d2ee206e3743f4d39ca79391b58dcf7cb44`. The dashboard outage that blocked the previous attempt no longer prevented this deployment.
- Live `/support` returns 200 with the new support heading. `/settings` returns 200. Signed-out `/api/support` and `/api/quality/reports` return 401; `/api/admin/quality` returns 404. Unsigned POSTs to the new WhatsApp quality/status bridge routes return 401, confirming the new routes exist and reject unauthenticated writes.
- n8n workflow `pktkYZFWUH8gPBVN` is active with version `4e7fbe44-0249-4871-a4c0-b9a3e814d2dd` and 70 nodes. The matching reviewed draft was published only after the new website endpoints were verified live.
- Fresh local release checks: 516/516 non-payment tests pass, TypeScript passes. Hostinger's actual production build completed and published successfully.

### Live owner acceptance checks

- Existing owner session stayed signed in across Support, Settings, My Journey and the owner quality dashboard.
- Settings retained English, linked WhatsApp and the saved daily 7pm schedule. The new card showed the actual 7:07pm India scheduler attempt and the truthful provider-accepted/delivery-unconfirmed result.
- Paused reminders through the live control, observed Paused, resumed, and confirmed On with the original schedule. No recap or WhatsApp test message was sent.
- Created explicitly labelled support verification request `c10c127f-c8d2-4890-b051-669cc22c8747`, resolved it through the owner dashboard, and observed the learner-visible resolution after navigation.
- Asked the real website mentor what an API does with the unchanged older Kanglish booking draft open and English selected. It answered the API question in two English sentences using a weather-app example, without greeting repetition or assessing the saved draft.
- Reported that actual reply under Other with a note explicitly identifying it as a verification test, not a complaint. Report `fb3b45e0-62b8-4a8f-8eaa-167f2d08f245` appeared in the owner dashboard, was resolved, and the learner's report history displayed the resolution.
- Course progress remained 1/10; original booking work was not edited, re-reviewed, or saved again. No mission completion or points were awarded during these checks.
- Phone support and tour pages had no document horizontal overflow. Tour advanced from step1 to2, stayed within the mobile viewport, repositioned on desktop resize, and closed. Temporary viewport overrides were reset.
- Evidence screenshots and HTTP/test logs are in the ignored execution ledger folder `.superpowers/sdd/2026-10-19-quality-and-support/`.

### Full project sandbox — still separate

The user selected Vercel Sandbox preparation, then asked whether their existing Hostinger VPS could be used. Read-only dashboard inspection confirmed one KVM2 VPS with 2 CPU cores, 8GB RAM and100GB disk, currently running n8n on Ubuntu24.04. A dedicated self-hosted execution backend is technically possible but has separate isolation, concurrency and maintenance requirements; no learner code was run on the n8n host. No Vercel project, subscription, credentials, paid run, VPS changes or full-app UI was created. Provider account, operating budget and provider-specific implementation plan remain required before full npm execution is released.
