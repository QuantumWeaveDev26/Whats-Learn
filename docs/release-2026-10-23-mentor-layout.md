# Mentor access and learning layout — 23 October 2026

Release marker: `2026-10-23-mentor-layout-v8.1`.

## Learner-facing changes

- Project mentoring now reads **Master your skills with experienced entrepreneurs.** The enquiry form still discusses scope and fees and opens a draft for the learner to review and send.
- Website and WhatsApp learning cards each use three useful steps and shared content rows. Headings, actions and notes align without dummy copy. A flex layout remains available where CSS subgrid is unsupported; phone layouts stack the cards.
- My Journey prioritises **Your next small win**, real course progress and the mission action. The tour invitation and preferences use compact controls. Saving/sync information and mission-fit explanations remain accessible in details sections. The guest sign-in explanation follows the mission card.
- The mission card uses tighter spacing and puts its primary action before optional explanation. No progress, prices, scores or reward rules changed.
- **Ask the mentor** is available during Discover, before answering the decision. Ordinary questions remain separate from work evaluation and do not imply completion or consume the review allowance. Existing decision, relevance/correctness, practical evidence and server-review gates still control saving completed work.

## Security updates

The dependency review prompted by the reported Hostinger scan is documented in [the advisory report](security-dependencies-2026-10-23.md). The three critical findings were reproduced in the original lockfile and the affected package versions updated. Fresh scans show no production advisories and one remaining high development-tool advisory with no upstream release. A local depth/AST guard mitigates the reported recursion issue; its registry finding remains disclosed, not suppressed. The separate sandbox service audit also reports no advisories; the service still requires its operational setup before use.

## Verification

- 631 non-payment regressions passed against the freshly installed patched dependency tree. TypeScript and all 27 in-memory migration checks passed.
- Pre-release browser measurements showed equal learning-card heights and matching action positions at desktop size. Final desktop/phone screenshots, production build result and deployed marker are retained with task evidence.
- The owner signed in through the real live website. Settings and the mission page retained that authenticated session, displayed the saved English preference, and did not repeat personal setup. No password, code, profile choice, mission answer or completed creation was fabricated for this check.
- This signed-in account displayed the WhatsApp linking form. The available n8n connector returned no executions after 22 October, with its latest available scheduled execution dated 16 October. These records do not establish current delivery or prove the service is broken. The user explicitly declined sending a test WhatsApp message; no such send is authorised in this release.
- Four real hosted mentor questions succeeded on the live website in English: a customer persona, full-stack booking flow, a reaction shot and a three-picture neighbourhood clean-up story. Replies addressed the questions without repeated greetings or a course switch; the fourth ordinary question was not blocked by review limits. Progress remained 0/10 and no mission answer or completion was submitted. These are sampled answers, not certification of every reply or graded evaluation.

## Launch boundary

Code deployment is distinct from full public-launch acceptance. Actual WhatsApp delivery and outside-window template delivery remain unverified without a linked test account and permitted test. The unpatched development advisory, physical-device checks, payment transactions and security/legal acceptance remain visible review items. Do not advertise this as flawless or fully launch-certified, or imply the visual changes guarantee purchases.
