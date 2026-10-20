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

- Browser access is disabled in Work settings: fresh signed-in desktop/phone layout and Google login checks remain pending.
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

## Deployment

Prepared for GitHub main → Hostinger plus the matching n8n workflow. Final remote commit, live HTTP observation and published workflow version are recorded after deployment.
