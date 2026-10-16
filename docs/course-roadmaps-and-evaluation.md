# Course roadmaps and practical review

Each of the four foundation courses has ten actual missions. The roadmap derives its state from the same saved work and checkpoint clears used by the website and linked WhatsApp mentor. One new scored mission per India calendar day means a minimum of ten practice days; learners may take longer. Completed missions remain available for improvement. Finishing the foundation leads to improving and exporting the capstone, not an invented next course.

## Evaluation

When the existing AI provider is connected, account submissions use server-side review before completion on both website and WhatsApp. The learner must report an actual created artifact, a test/run they performed, its result and an improvement, and at least three of five mission criteria must be met. The AI assesses the submitted report; it does not independently witness the test. Practical points are 15 per met criterion (up to 75), plus the existing understanding score (25), less existing clue deductions. Every plan uses the same scoring. Revisions never award the mission points twice. Guests and installations without an AI provider retain explicitly labelled basic checks; those checks cannot verify execution.

A new review uses the existing plan's AI allowance. Identical work in the same language reuses its review for five minutes, including a preview followed by Save. Concurrent identical requests in one server process share the request. Failed provider/repository reviews release the allowance and preserve the draft. There is no fabricated successful review when the provider fails. Feedback is stored with accepted work and can be viewed in My Creations. Older creations keep their existing completion without being labelled AI reviewed.

Public GitHub root URLs are reviewed through fixed api.github.com endpoints, without authentication, redirects or code execution. The reviewer receives a commit-pinned sample of at most six small source files, up to 32,000 characters total. Secret-like paths, generated folders, symlinks and binaries are excluded. The response displays the actual commit and selected files. This is a static sample, not proof that the application or tests execute successfully. Private, unsupported, oversized or rate-limited repositories fail with an explanation. Other demo/media URLs are references only. Learners are informed before submitting source to the AI provider.

## Storage and deployment

Migration `0015_submission_reviews.sql` adds the review reuse cache and the work evaluation column. The Node runtime applies migrations on opening its persistent database. Apply this migration before serving signed-in submissions in a D1 deployment. Account deletion clears both saved evaluation and the review cache.

No new AI credentials are required; the owner's existing provider configuration is reused. No payment behaviour changes are part of this release.

## Mentor and layout

The mentor supports ROADMAP, showing the same saved completion state, and gives short submission, progress and reminder messages. Existing opt-in, STOP, deduplication, quiet hours and the approved-template requirement outside the 24-hour messaging window still apply.

Account pages use a flex column with a growing main area and a wrapping footer. Responsive roadmap rows show the day's deliverable, status and accessible action. Phone and desktop layouts are checked through the browser.

## Explore trial access (16 October 2026)

Explore and guests may use missions 1–3 in each course. Missions 4–10 require an active server-verified entitlement, including an approved account reward. A client preference, local storage flag or a created but unpaid checkout grants no access. Expiry blocks further paid mission saves, AI help, clues, bonus rewards, uploads and later checkpoints, while previously saved creations remain readable.

The website, linked n8n WhatsApp mentor, legacy WhatsApp handler and learning-path API use the same access rule. Reminder jobs skip unavailable missions. Saved-progress sync detects access expiry and refreshes the website. No checkout processing or price calculation changed.

Each of the forty missions has a specific deliverable and a concrete trial in `lib/mission-practice.ts`. Practical completion requires actual artifact content/source, a performed test/run, an observed result and an improvement. Plans, fictional interviews, imagined tool output, manual code traces and proposed commands alone do not pass. Local mock services and synthetic input data are permitted when actually executed. Free tools and private work are enough; public publishing, paid ads and production deployment are not required. The reviewer returns separate created/performed flags; completion requires both plus reported=true. It reviews reported evidence, not independently witnessed execution. Updated review cache keys prevent older reviews without this evidence field from completing a new submission.
