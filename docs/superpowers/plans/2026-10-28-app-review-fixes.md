# WhatsLearn app review fixes

> Execute these scoped repairs inline, preserving the existing design and server access rules.

**Goal:** Resolve the five findings from the live app review on 28 October 2026.

**Design:** Keep the selected practice screen mounted while visiting other tabs, and derive mentor context from that selection. Remove overlapping sticky actions and the obsolete progress-label background. Reuse the course catalogue for guests without allowing signed-in actions. Open the existing app plan sheet from Me; keep any website visit in a separate tab.

**Constraints:** No payments, paid AI requests, production learner writes, credentials, new dependencies, or unrelated checkout changes. Work from `origin/main` in `codex/app-review-fixes`. User explicitly confirmed app screens only and instructed not to touch anything on the website. No shared website files may change.

## Tasks

- [x] Reproduce navigation and guest-discovery failures with offline component tests; verify existing focused regressions.
- [x] Preserve selected tasks and lesson steps; clear private selection on account changes and sign-out.
- [x] Fix action overlap and label contrast; visually check at narrow and desktop widths.
- [x] Expose read-only guest course outlines and preserve the selected course from Home.
- [x] Keep membership browsing in the app sheet and restore all shared website files.
- [x] Apply the user's compact visual direction to app screens: smaller headings/icons, less repeated text, restrained cards and motion, and touch targets of at least 44px.
- [x] Run targeted tests, the synthetic suite, type checking, a production build, and local browser checks. Review the complete diff.

## Verification focus

Cross-course navigation, in-progress drafts across tabs, account changes, guest access boundaries, completion/Back behavior, narrow screens, and unchanged website learning links outside app context.

## Progress

- Baseline: existing mentor lifecycle and membership dialog checks passed (4 tests).
- Root causes: app tab handler clears `open`; mentor context always uses profile track; the old `.wla-steps span.on` background survives the later label styling; sticky actions move over content; guests are replaced by a sign-in card; account links lack app return context.
- Independent review found account remount/draft isolation and hidden-task Back handling issues; three reproducing tests failed before fixes and passed afterward.
- User direction: app-only compact typography and icons; shared website edits were fully restored. Membership now uses the existing in-app sheet.
- Ruling: legacy device drafts have no verifiable account owner, so they remain on the device but are not automatically restored. Saved server-side creations are unaffected.
- Ruling: retain the unchanged website JSX fingerprint failure rather than update an unrelated protection test. Reproduced on an untouched archive of HEAD; the workspace blob matches HEAD exactly.
- Local synthetic browser evidence: selected Full-Stack task remained the Mentor context; returning to Practice retained Check and Make steps and typed draft; guest course outlines are accessible; app plan sheet opens/closes without visiting or changing the website.
- Synthetic suite: 775 passed, 1 pre-existing workspace-fingerprint failure out of 776 tests. New app regressions: 11 passed.
- Main website scope check: no diff in `components/whatslearn`, `app/membership`, `app/settings`, `app/support`, `app/globals.css`, or `app/page.tsx`.
- Final verification: type check passed; production build generated standalone output. Verification logs are retained in ignored `outputs/`.
- Local dependency repair: a generated baseline-copy move followed a dependency junction. Dependencies were restored from the existing offline pnpm cache with a frozen lockfile; the subsequent production build and synthetic suite verified the repair. No package or lockfile changes were made.
- No deployment, remote push, purchase, paid API use, or production learner change was performed.
