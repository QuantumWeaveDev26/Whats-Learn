# Learning quality release — 26 October 2026

Release marker: `2026-10-26-learning-quality-v10`.

## Implemented without a UI redesign

- Correctness, topic relevance, a created artifact, a performed trial and reported evidence are required before a review can establish demonstrated practical skills. An explicit correctness blocker also prevents acceptance. Existing mission IDs, answer keys, prices, scoring and completion records are preserved.
- Revision comparisons require supported new evidence; legacy rows without review keys use their timestamps to distinguish reviews. An incorrect revision cannot appear as a verified improvement.
- The existing private export includes the learner's work, stored AI criteria, what worked, a correction and next action. Missing or malformed historical evaluations remain explicitly unassessed. Static GitHub review and limited execution are not described as testing the whole app. Export does not publish work.
- The shared mentor handles simple English greetings without a provider request, avoids repeated names/salutations in teaching replies and retains selected-language controls. Questions do not consume practical-review credits. No WhatsApp test messages are sent.
- All four tracks have dated official source references and two rotating, authored real-world practice prompts in the mentor context. These are optional hypothetical exercises, separate from graded missions and points. Human editorial approval is explicitly pending; this does not claim a new live-news or autonomous curriculum-review service.
- `/api/curriculum?track=marketing` (also development, filmmaking, storytelling) exposes that public course metadata. No personal data is included. Existing legacy curriculum exports are preserved.
- Release feeds preserve cached information during upstream failure without stamping it freshly verified. Per-source check dates and stale flags are returned. Upstream bodies are bounded to 256 KiB.
- The owner-only quality API includes 30-day report-reason and failure-category/channel aggregates from existing retained records. No new behavioural tracking, conversion denominator or invented response-time metric is introduced.

## Dependency remediation

The 26 October audit found eight root advisories and a Zod-related advisory chain in the separate sandbox service. Updated Zod to 4.6.6, Undici to 7.30.1 and fast-uri to 3.1.9 in the applicable lockfiles. Both dependency audits report zero known advisories after updating. This is dependency-audit evidence, not a penetration test or a guarantee against all vulnerabilities.

The seven-day release-age policy remains. Only the exact reviewed security fix `fast-uri@3.1.9` has an age exception. No advisories are ignored. CI also audits the sandbox service lockfile.

Primary remediation references:

- [Zod advisory](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5)
- [Undici advisory](https://github.com/advisories/GHSA-xjj6-f33q-929c)
- [fast-uri advisory](https://github.com/advisories/GHSA-wjr9-j795-jxcr)
- [Zod migration guide](https://zod.dev/v4/changelog)

## Verification before release

- TypeScript passes following the Zod 4 update.
- 250 synthetic mentor/learner regression checks pass.
- 99 focused compatibility checks pass, including authentication routes, email/Google sign-in code, membership management, privacy gates, uploads, quality ownership, assessment and isolated-service safeguards. These use synthetic accounts/providers.
- Production build and standalone packaging pass.
- Workspace and layout JSX compare identically to commit `4f3b350786fda1f40f16a8add08ba4e8f8f507a5`, after line-ending normalization. No CSS, card structure, visible copy, video, colours, typography or page layout is changed.
- Live deployment must be verified using the release marker and the new curriculum endpoint after pushing main. A successful Git push alone is insufficient.

## Owner actions and limits

- Supply and approve the actual grievance contact and final privacy/terms information before opening paid sales. The existing paid-checkout gate remains closed.
- Supply real mentor names, expertise, availability, response expectations and fees before publishing additional expert-service claims. No invented credentials or endorsements.
- Assign an editorial owner to review the dated references and approve future content revisions. Metadata is not an automatic review schedule.
- Any separate sandbox service deployment/credentials must be verified independently of Hostinger's website deployment. Committing its patched lockfile does not prove a running external sandbox was updated or activated.
- No outbound WhatsApp delivery test was performed, respecting the user's no-message instruction. That remains a separate end-to-end acceptance check.
- Navigation redesign, new cards, mentor profile panels, sharing/consent UI and new conversion tracking are outside this release because the user explicitly required no UI changes.

Public-launch approval is still conditional on owner policy/commercial details and the outstanding real-service acceptance checks; this release does not claim a flawless mentor or verified paid checkout.
