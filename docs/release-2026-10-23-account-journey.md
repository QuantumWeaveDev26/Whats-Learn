# Account and journey release — 23 October 2026

Release marker: `2026-10-23-account-journey-v5`.

## Changes

- Personal setup now offers nine optional questions, including a name and mentor nickname. Age remains first. Under-18 submissions retain only the guest restriction. Existing completed or skipped setups stay locked and are not reopened to collect new fields.
- Submitted nickname, then submitted name, then account display name/verified contact name determines the mentor address. The same server function feeds website and WhatsApp. Settings explains the distinction.
- Homepage uses actual saved learning activity, rather than signed-in status or welcome points, to choose **Try my first challenge** or **Continue my journey**. Learning options uses **Open my journey**.
- Setup checks the authenticated account and existing completion on mount/focus. Completed setup goes directly to its original destination. Identical submission retries are idempotent; different answers remain locked. Unknown legacy fields no longer invalidate otherwise valid saved answers. Storage failures are not treated as evidence of a fresh account.
- The automatic tour invitation is an inline Journey card. It does not shade the page or trap focus. Not now is remembered immediately even when browser storage is unavailable. An explicitly opened tour keeps its modal controls. Mission dialogs use their own tour to avoid competing focus traps.
- Restored tours are bound to the account and guest state; stale private tours cannot restore into another account. Auth links refresh their return destination when navigating.

## Verification

- 587 non-payment regressions passed, with no failures. TypeScript, all 27 migrations and the production standalone build passed.

- Authenticated local browser preview used a loopback-only synthetic auth provider and a separate disposable SQLite directory. No production account was created, completed, altered or deleted.
- New sign-in → nine-question setup → review → Journey succeeded. Name and nickname appeared in review; Not now dismissed; a subsequent sign-out/sign-in returned directly to the original destination with no setup repeat.
- All nine authenticated tour steps completed at desktop size and 390×844. Phone launcher measurements were both 52px tall at y=780. Page changes, Settings, roadmap and learning-options destinations completed without a missing-step fallback.
- Synthetic tests cover refresh sharing, transient provider failures, stale accounts, names, setup lock/retries, language priority, wrong/off-topic evaluation rejection, shared drafts, data deletion, support and reminder behavior. These checks establish code behavior, not live model correctness or delivery.
- No billing/checkout execution or customer message test was performed.

## Launch acceptance still required

| Area | Evidence and remaining acceptance |
| --- | --- |
| Sign-in and setup | Isolated browser and regression checks passed. The browser available for the owner's production account remains signed out; that account's specific historical failure is not yet reproduced. |
| Language and AI feedback | Selected-language and correctness gates pass synthetic checks; real provider accuracy, latency and native-language review remain unverified. Earlier hosted translation credential exhaustion does not establish the current website credential status. |
| WhatsApp | Published workflow metadata was read back active at version `c3366f9f-f25d-4e20-9d79-66a802da0d36`, 69 nodes. No learner delivery or after-24-hour template acceptance was executed. |
| Privacy/security | Isolation, guest restriction and deletion regressions pass. This is not a penetration test or legal review; linked draft policies still require owner review. |
| Reporting/support/reminders | Existing implementation retained and regression checked. Staff receipt and actual reminder delivery remain external acceptance checks. |
| Full project sandbox | Adapter exists; isolated service credentials, operational connection and an approved run cap remain required. No paid usage was initiated. |
| Membership | Existing free/paid disclosures retained. Checkout, renewal and cancellation were not transaction-tested. |
| Performance/accessibility | Desktop/phone walkthrough and existing layout/focus regressions completed; no full Lighthouse/WCAG or load certification. |

Public launch remains conditional on these external/account acceptance checks. No claim of a flawless or fully certified launch is made.

Deployment is recorded after verifying the live marker; pushing GitHub alone is insufficient.
