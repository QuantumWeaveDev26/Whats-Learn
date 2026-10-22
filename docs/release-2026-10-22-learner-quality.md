# Learner quality and eligibility release

## Implemented

- Account-bound personal setup submissions; stale forms cannot lock another learner's answers. Settings checks identity on focus and handles rejected account switches.
- User-approved under-18 guest restriction at setup, return sign-in, account APIs, WhatsApp linking, reminder selection and outbound dispatch. Only the age restriction is kept for a newly restricted setup; existing work is not deleted. The age band is self-declared, not verified.
- Optional two-turn shared mentor context, seven-day usability, off/clear controls, account isolation and canonical assessment separation.
- Natural mentor questions reach the website with the original question. Successful answers no longer receive a second n8n rewrite. The independent n8n learner-memory connection is removed.
- The website call timeout is 180 seconds. This aligns synchronous deadlines; durable evaluation jobs and measured live latency remain follow-up work.
- Selected-language question/task/field wording with unchanged answer keys and field IDs. Validated coverage is 784 of 880 mission-language combinations, each with three starting levels. Withheld drafts use a disclosed canonical-English fallback. Structural, numeral, script and answer-index tests do not replace native-language review.
- New language packs remain deferred in the browser, including Hindi/Kannada question packs. English remains immediately available.
- Due-only indexed reminder selection, two-minute scheduler configuration, safer exhausted-claim handling, account-age dispatch checks and selected-language completion/recap copy. Settings shows the next eligible attempt rather than proof of delivery.
- Visible progress polling changes from one to five seconds; focus/reconnect refresh and error backoff remain.
- Staff alert batches dispatch five opaque references with existing leases and idempotency. Provider connection is still separate from delivery acceptance.
- Phone-specific development guidance, public crawler files, page titles/social metadata, updated data/age policy descriptions and a current production runbook.

## Verified before release

- 576 non-payment regression tests passed; no failed tests.
- TypeScript passed and production standalone build passed.
- All 27 SQLite migrations apply in order to an in-memory database; migration journal matches.
- Account isolation, minority restriction, stale setup, shared-context controls, wrong-course rejection, answer-key consistency, reminder leases and capacity beyond 1,000 processed contacts have regression coverage.
- Public templates retain credential placeholders. Temporary translation helper archived.

## Remaining acceptance and limitations

- The existing hosted translation credential returned no remaining credits. No new key or credit purchase was made. Withheld translations and native-language review remain pending.
- Real AI correctness/latency and WhatsApp delivery were not certified by mocked regressions. Paid sandbox execution and staff receipt require a configured destination and authorized acceptance run.
- This release did not repeat interactive signed-in Google return-login or desktop/mobile tour acceptance; browser automation was unavailable in this task. Earlier public tour evidence belongs to the previous release.
- Full app execution has an adapter, but an isolated service connection and owner-approved spending cap cannot be invented. The current tool connection does not expose Hostinger/Vercel management.
- Privacy still requires owner/legal review; this release is not legal approval or a claim of a flawless public launch.
- Payment/billing test execution remains excluded.

Deployment evidence is confirmed separately using the live release marker and published n8n active version; a GitHub push alone is insufficient.

## Deployment confirmation

Website commit `ba8c101fdbf8891c652281abff292e522496e62f` is deployed on Hostinger. Live HTML returned release marker `2026-10-22-learner-quality-v4`; home, `/age-policy`, `/robots.txt` and `/sitemap.xml` returned 200. The new mentor-context API returned 401 to an anonymous request; session status returned signed out. These are public HTTP checks, not a signed-in age/onboarding walkthrough. GitHub Actions run 39784139361 completed successfully.

The matching production n8n workflow is active at version `c3366f9f-f25d-4e20-9d79-66a802da0d36`, with 69 nodes and no validation warnings after removing the retired memory node. Readback confirmed two-minute reminder polling and the 180-second website deadline. No production message or scheduler was manually executed.
