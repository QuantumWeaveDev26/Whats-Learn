# Draft continuity and reliability — 22 October 2026

The user approved fixing the four remaining audit issues and deployment. Existing website drafts and WhatsApp drafts will share account-owned, versioned practical draft text. Drafts never award points or import an unverified understanding answer. A stale write must return a conflict without replacing the newer copy; both website and WhatsApp preserve the learner's place. Existing guest drafts remain device-only, with explicit storage failure status. Existing mission completion/review gates remain unchanged.

Implementation:
1. Reproduce homepage progress failure, local-storage failure and stale WhatsApp connection states. Expose retry and honest save status.
2. Add a bounded shared practical draft record per account/mission/level with optimistic revisions, tombstones for closure, private authenticated API, strict input/size/account/origin checks and account deletion cleanup. No new external provider.
3. Adapt the existing WhatsApp draft read/write functions to the same record; retain its structured fields and conversational state. Website draft text resets any imported decision to unassessed. Keep older legacy chat drafts available.
4. Add website autosave/restore with explicit conflict choices, account-change guards, network retry, visibility refresh and honest status. Accepted submission closes only a matching shared version.
5. Run nonpayment regressions, type/build and independent review. Push main, confirm automatic Hostinger deployment and live assets; browser acceptance if available.

External staff alerts and full npm execution still need configured recipients/provider/isolation. Do not purchase services or send messages to others.
