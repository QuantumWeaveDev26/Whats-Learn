# Learner readiness release — 22 October 2026

## Implemented

- Optional developer tools load when expanded and remain mounted when collapsed, preserving in-session work. Code draft reads/writes/execution reject stale account identity markers.
- Twenty optional lesson languages use separate client imports. The selected lesson waits for its pack; open mission localization refreshes after loading. Server translations remain available synchronously.
- Homepage answer choices lock after selection; a wrong attempt can be explicitly restarted.
- Support status refreshes on focus and manually. The owner queue refreshes without discarding typed resolutions.
- Reports and support requests enqueue durable opaque alerts. One alert per authenticated notice poll, a 3-second transport deadline, leases, idempotency keys, five attempts and bounded retention protect normal WhatsApp processing. Endpoint acceptance is not evidence of a person reading it.
- Owner-only service readiness displays configuration, alert queue state and actual signed scheduler poll timestamps. Credentials are never returned. Template presence is not Meta approval or delivery proof.
- A daily/manual/push GitHub Actions suite checks synthetic mentor routing, language, evaluation, draft synchronization and safety. It does not call paid AI or message learners.

## Isolated npm execution: implemented, external connection required

The website stays on Hostinger. Deploy `services/project-sandbox` as a separate Vercel project (root directory: that folder), using its Node handler and pinned SDK. Do not run learner code on the production website or the VPS running n8n.

Set a fresh shared `FULL_PROJECT_SERVICE_TOKEN` of at least 32 random characters in both service and website hosting settings. On the website set `FULL_PROJECT_SERVICE_URL` to the deployed `/api/run` HTTPS endpoint. Set `FULL_PROJECT_DAILY_LIMIT` only after the owner approves a run budget (1–50 global runs per India calendar day). Empty or zero leaves execution off. Use Vercel's project OIDC authentication on Vercel, or server-only VERCEL_TOKEN/VERCEL_TEAM_ID/VERCEL_PROJECT_ID if needed by that environment. Never paste secrets into chat or source control.

Limits: 20 files / 100 KB, one active job per learner, two globally, three runs per learner/day, 90 seconds per VM, no public preview ports, only registry.npmjs.org outbound, no dependency install scripts. Build/test scripts are untrusted and execute only in the isolated VM. Parent jobs have a 120-second acknowledgement/expiry window. Source hashes bind output to the submitted artifact. Unknown starts retain the same idempotency key and consume their reservation rather than silently retrying paid execution. Status requests never resume stopped VMs. Run output does not award points, accept a mission or prove app correctness. Stored receipts/output are pruned after seven days when accessed.

Before activation, verify an actual approved provider run, blocked outbound network, timeout, failed tests, stop, duplicate request and cost limits. The mock-provider checks do not establish production provider behavior.

## Staff alerts: connection required

Set SUPPORT_ALERT_WEBHOOK_URL and SUPPORT_ALERT_WEBHOOK_TOKEN (32+ characters) in Hostinger. The HTTPS receiver must validate the Bearer token and deduplicate the Idempotency-Key/eventId. It receives only eventId, kind, opaque reference and the owner dashboard URL; choose the staff channel at that receiver. No existing email delivery channel was available to connect. The saved owner queue remains usable without alerts. No promise of a response time is displayed.

## Acceptance that remains external

- Interactive desktop/mobile tour, focus, scrolling, back/forward navigation and layout checks: the browser tool currently reports local browser use disabled.
- Actual Meta WhatsApp message delivery, outside-24-hour approved-language templates and reminder receipt: require a linked account and an authorized real recipient. HTTP/configuration checks and scheduler timestamps do not prove delivery.
- Legal pages still require the owner's final policy/Grievance Officer review.

No outbound WhatsApp tests, paid sandbox runs, payment tests or production learner progress changes are part of this release verification.

## Release verification

555 non-payment regression checks, TypeScript and the production build passed. All 26 migrations apply in order in a throw-away database. Static import closure inspection confirms none of the 20 optional language chunks or developer tools are initial workspace imports. The shared language/personalization chunk is 187,664 bytes, compared with approximately 895 KB before this change. An independent code review identified language-ready refresh and exhausted-alert lease recovery issues; both were fixed with regression coverage. Interactive browser and real-channel/provider acceptance remain as listed above.
