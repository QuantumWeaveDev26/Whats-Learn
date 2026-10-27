# Membership reference refinement

Release: `2026-10-27-membership-columns-v10.7`.

The learner requested another membership redesign after reviewing v10.6 and chose a short side-by-side comparison. The design library could not provide references because its connection requires a paid plan. No purchase was made. Official live pages were inspected instead:

- https://linear.app/pricing — plan columns separated by rules, prominent prices, short feature lists and aligned per-plan actions.
- https://slack.com/pricing — side-by-side plans with a direct action within each column.
- https://www.notion.com/pricing — inspected but not adopted; its grouped, longer feature presentation exceeds this request.
- https://www.coursera.org/courseraplus — inspected but its single-offer hero does not fit the requested side-by-side comparison.

The new page follows the plan-column direction, inside WhatsLearn's green theme. The radio selectors, shared spreadsheet-like table and separate selected-plan footer are replaced with four short columns. Each contains the actual price, three concise facts and a working course/review action. Subscription management moves to an expandable section below the plan choices so it remains available without preceding them. No subscription is cancelled or changed by the redesign.

Preserved: Explore; Plus ₹199/month or ₹1,999/year; Pro ₹499/month or ₹4,999/year; Teams ₹399 per learner/month with five learners minimum; review allowances; course access; sprint option; existing payment review, policy gates, account controls and destinations. Nothing outside the membership route is redesigned. Existing subscriptions retain their original price-specific provider plan. No payment or WhatsApp message is sent during checks.

The previous live screenshot is retained as the baseline. Build/type checks, desktop and phone rendering, CTA review and deployment are verified separately. This release does not open paid checkout or claim a measured conversion improvement.

The My Journey Membership tab now uses the same default comparison presentation and scoped styles as /membership, so the approved design appears at both entry points. The journey sidebar now shows three short knowledge topics for the chosen course; the full mission roadmap remains in My skill paths. Optional sidebar panel spacing is even. The JSX guard fingerprints the exact approved sidebar and then restores its original source solely for the unchanged-workspace check.

Within the embedded Membership tab, a second page heading and course-preference controls are suppressed on that pricing view only. My Journey and the other tabs retain their controls and layout.
