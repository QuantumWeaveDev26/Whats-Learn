# Checkout and website clarity — 14 November 2026

The live public billing API reports checkoutOpen=true, signInRequired=true for guests. The previous plan dialog confused this signed-out state with closed sales. A signed-in browser account was confirmed to show Secure checkout available. No payment, mandate or live checkout creation was submitted by this verification.

Changes:
- Distinguish sign-in, loading, closed and failed availability; reuse the membership status in its payment action.
- Add a retryable status check, SDK loading timeout, bounded billing requests and immediate duplicate-click protection.
- Preserve the current-price plan provisioning already on main, releasing only checkout preparation failures before a subscription request starts. Ambiguous provider requests remain locked for reconciliation.
- Keep the main navigation order consistent, show one course progress count, shorten public task wording, clarify monthly-only Teams pricing and annual refund wording without changing refund eligibility or prices.
- Keep Google sign-in visible while availability loads; keep desktop assistance names visible, with reserved space on pricing so purchase actions remain clear.
- Route FullAI to the existing development-course roadmap instead of a temporary hosting address. Preserve the theme, course cards and welcome video.

Validation:
- Checkout, provider retry, lazy-plan and dialog regressions passed using synthetic responses only.
- TypeScript and production build passed.
- Full suite: 879/880 passed; the unrelated isolated-runner timing check passed on separate rerun (6/6). No assertion was weakened for that failure.
- Local homepage checked at 390px with no horizontal overflow. Annual comparison and existing signed-in live account availability inspected in-browser.

Not verified: actual payment authorisation/capture, mandate acceptance, recurring collection or live webhook delivery. Those require the learner's own transaction; no money was used by this work.
