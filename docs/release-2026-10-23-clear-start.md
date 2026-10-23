# Clear starting journey and dependency removal — 23 October 2026

Release marker: `2026-10-23-clear-start-v9`.

## Changes

- Removed the vulnerable braces/micromatch dependency path; see [security review](security-dependencies-2026-10-23.md). Complete dependency audit: zero advisories, without ignore lists or relabelling the vulnerable package.
- The homepage shows a concrete, explicitly illustrative example. Its recommended starting journey is a free starter, then course selection, then practical course tasks. Bottom-page start links return to the same starter. The main start action appears before the optional introduction video. Existing saved-account resume remains.
- Starter practice is explicitly separate from ten course tasks. The optional visual planning tool is labelled as help with the current answer. Guest continuation carries the selected track and language into course selection.
- Onboarding says “Choose how you prefer to learn”. Journey choices remain editable; locked personal setup and assessment gates are unchanged.
- Every collapsed course shows a concrete completion outcome, duration, task count and free allowance. Expanded examples remain available.
- Human account/plan support is clearly separate from the WhatsApp learning mentor. Help is available in public navigation and the account header. No automatic WhatsApp messages are sent.
- Membership explains the free first three tasks, paid tasks 4–10, retained creations and review-before-payment. Prices, entitlements and payment processing are unchanged.
- My Creations stays directly available as a learner dashboard tab.

## Verification scope

The release is checked with full non-payment regressions, TypeScript, production standalone packaging and targeted browser walkthroughs. Browser size checks are responsive emulation, not physical Android/iPhone certification. Guest starter completion and continuation can be exercised without fabricating completed course work on the owner account. No payments or WhatsApp test messages are authorised in this task. Real-account/AI checks from v8.1 are documented in the earlier release; they are not proof of every graded answer or WhatsApp delivery.
