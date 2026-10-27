# Membership comparison and shorter homepage copy

Release: `2026-10-27-learner-pages-v10.1`.

## Scope

The user requested Netflix as the membership-page reference, then requested shorter course and WhatsApp copy. The membership page now uses selectable plan columns with aligned price, course access, daily AI-review allowance and learner-count rows, followed by one continuation action. WhatsLearn keeps its green branding. The free plan is the initial selection. “Balanced choice” is an editorial suggestion, not a claim about sales or popularity.

Reference: [Netflix plan selection](https://www.netflix.com/signup/planform), inspected on 27 October 2026. No Netflix account was created or purchased. Netflix branding, imagery and prices were not copied.

- Existing prices, annual totals, review allowances, access rules, cancellation controls, billing gates and the payment provider are retained.
- Teams remains monthly, with at least five learners, even when annual individual billing is selected.
- Selecting a card only changes the visible selection. The action opens the existing review dialog; it does not initiate payment or activate access.
- The new comparison presentation is enabled only on `/membership`. The embedded dashboard membership view keeps its existing presentation. New CSS is scoped to `.membership-page`.
- The homepage course terms appear once above the course list. Each course has one short practical outcome. Returning-learner progress, next-action routes, course IDs and the existing accordion layout remain.
- The WhatsApp panel reads “Learn on WhatsApp” and “Same course. Synced progress. Always optional.” Its learning and account-support links remain distinct.

## Checks and limits

The local preview was inspected at desktop and 390px phone viewport sizes. Plan selection, annual Plus pricing and the unavailable-checkout review dialog were inspected without creating a payment. The phone layout had no document-wide horizontal overflow. Full-page screenshots avoid an in-app screenshot clipping issue observed with the ordinary viewport capture.

Build, type checking, GitHub CI and live deployment evidence are recorded separately during release. Existing copy assertions are updated to match the requested concise wording. No new automated test suite is introduced.

Paid checkout remains subject to the existing policy and provider readiness gates. This design change does not claim that paid sales or the separate sandbox service have been activated.


## Settings and Support follow-up

The user then requested a simpler Settings page and balanced Support page in the same release.

- Settings puts one “Name or nickname” field first, then Course and Language. Goal, experience, daily time, teaching style and display preferences remain under “Personalise my lessons”. Chat memory and the read-only sign-up answers are grouped under privacy. Account deletion stays separately collapsed and retains its deliberate confirmation.
- A name explicitly saved in Settings takes priority for mentor greetings without editing the locked sign-up answers. It uses an account-owned preference in the existing learning-session store, is sanitized like other learner names, and is erased with account deletion. Emptying the field also clears the preferred address. The profile response and mentor context use the same resolved name.
- Settings discards stale profile responses after an identity change. Account writes remain disabled until a successful account read. Guest names are not saved or treated as account data.
- WhatsApp consent, verification, opt-out, pause/resume, recap and sync actions are retained. The Settings view uses shorter introductions, avoids duplicate headings, and keeps additional connection details under “More WhatsApp options”.
- Support places the request form beside request history and email contact on desktop, stacking them on phones. Request details are expandable; ownership, request attachment, idempotency and team-reply handling remain. No support request, WhatsApp message, payment, account deletion or real learner name change is submitted during visual checks.
