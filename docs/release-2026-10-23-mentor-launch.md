# Mentor repair and launch gates — 23 October 2026

Release marker: `2026-10-23-mentor-launch-v9.3`.

## Application changes

- The homepage shares one account snapshot across the hero, course cards, learning steps and final action. Returning learners see their course, actual accepted task count and Continue Learning; newly selected courses offer the first task, and completed courses open My Creations. The current course opens first. Other courses are secondary exploration, and optional starter practice opens only when requested. Anonymous visitors retain the original starter/discovery flow.
- Corrected the mentor's shortening request: `candidateAnswer` is explicitly an AI-generated reply, never learner work. The original question, fresh account snapshot and recent conversation stay available during repair.
- Ordinary tutor replies are checked for unsupported assessments of drafts/code, generic praise, word limits and mixed scripts after repair as well as before it. A failed optional shortening call preserves complete useful sentences within the cap; it does not cut code or expose an unsupported assessment.
- Ordinary mentor questions still do not save work, grant completion/points or consume practical-review credits. The website and directly connected WhatsApp mentor share this code. No WhatsApp messages were sent for this release.
- Added an explicit reviewed-policy/contact gate before any new real checkout. Existing live/public billing switches alone cannot bypass it, including through the owner account or direct checkout service.
- Existing customers retain payment verification, status refresh, cancellation, webhooks and paid access when new sales are closed. These paths still check origin, authentication, signatures and ownership.
- Privacy now discloses the name and optional nickname fields and renders the actual designated grievance contact from server settings. A pending contact/review stays visibly pending; no approval or person's name was invented.
- Added HSTS, nosniff, referrer and permissions headers. HTML pages restrict embedding to the site itself and the named ChatGPT hosts. Upload/API-specific CSP and private cache rules are preserved. No dependency changes were required.

The visible homepage video and the owner's removal of the extra hero example card are preserved.

## Verification

- All 690 isolated CommonJS checks passed, including the exact invented-draft opening, clarification context, shortening outage, language checks, account/draft safety, returning-homepage rendering and tour contracts.
- Billing setup and billing service suites passed with synthetic provider responses, including live checkout blocked before policy approval, status/cancellation while sales are closed, and cross-account denial.
- TypeScript, production build and isolated Node deployment passed. The complete dependency audit reported zero vulnerabilities at every severity. The packaged server check verifies actual HTTP headers, authenticated cookies, guarded routes and closed checkout; it is not just a source assertion. Live marker, headers, checkout state and rendered pages are checked after deployment. Hosted mentor acceptance requires an authenticated browser; synthetic fixtures are not represented as real-provider proof.

## Owner action still required

1. Supply the actual designated Grievance Officer's name and approved email and complete review of Privacy, Terms and Refunds. Configure `GRIEVANCE_OFFICER_NAME`, `GRIEVANCE_OFFICER_EMAIL`, and only then `POLICY_APPROVED_REVISION=2026-10-23` in the hosting dashboard. Redeploy after changing environment settings. Until then, free learning remains available and real checkout stays closed.
2. Sign in to the existing account for the final hosted mentor recheck. A fresh test account and genuine course work are needed to complete registration/return login, Google sign-in, correctly and incorrectly graded saves, and cross-account acceptance without fabricating real learner achievements.
3. The owner must perform financial acceptance: actual checkout activation, signed webhook receipt, cancellation/renewal and refund handling. No financial transaction is performed by this release process.
4. WhatsApp acceptance still requires an explicitly authorized linked test number and the learner's own inbound messages. Verify delivery, saved-work sync, pause/resume and the approved outside-24-hour template. The prior instruction not to send messages remains in force.
5. Connect and validate the separate full-project sandbox before advertising complete npm-app execution; do not treat the limited local runner as a full isolated project service.

These are remaining acceptance/owner decisions, not claims that every unverified flow is broken. Broad paid launch is not certified by deploying this release alone.

## Header references

The framing restriction uses [CSP frame-ancestors](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/frame-ancestors). HSTS is configured without subdomain/preload directives as described in the [HSTS reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Strict-Transport-Security).
