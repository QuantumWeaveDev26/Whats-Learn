# WhatsLearn review — 27 October 2026

## Verified in this pass

- Homepage, Journey, Membership, Settings, Support, sign-in and policy pages returned HTTP 200 without a server error page. Nine distinct linked page routes were checked.
- HTTPS Strict-Transport-Security is present on the checked responses.
- Public billing status reports `checkoutOpen:false` and `enabled:false`; new paid sales remain closed by the owner decision.
- Production dependency audit: zero known critical, high, moderate or low findings. This is a package advisory check, not a penetration test.
- Sidebar typography release v10.11 is served live. Current browser access is disabled, so this pass does not confirm desktop/mobile rendering or computed font sizes.

## Payment repair

A paused subscription was omitted from the query that prevents duplicate checkout. A regression test reproduced a second provider subscription request. Paused subscriptions now block another checkout for the same account, plan and quantity before contacting Razorpay. Membership management labels the state Paused.

Pausing preserves existing access only until its already-recorded expiry. It does not create a new entitlement or extend that expiry. Verified active resumption uses the provider period end. Automated tests cover these cases; no provider subscription or real payment was created by this audit.

## Recommended improvements, in priority order

1. **Finish payment acceptance before selling.** Use the billing owner account to inspect `/billing/setup`, confirm current-price plans, perform a Razorpay test payment, observe a signed webhook, and test cancellation/refund. Production credentials, account activation and webhook delivery cannot be established from anonymous page checks. Keep checkout closed until explicitly approved.
2. **Complete the real learner acceptance run.** Fresh signup/Google login, one-time setup, first submission, returning login and account separation need a current authenticated browser run. HTTP success does not establish session or mobile usability.
3. **Keep one obvious action on each screen.** Continue the current task for returning learners; try the first task for newcomers. Measure whether people finish the free task before adding more homepage sections.
4. **Give each main page a distinct browser/search title.** Membership currently inherits the homepage title. A clear title such as Membership | WhatsLearn improves navigation among open tabs and search results.
5. **Review the learning language with native speakers.** Test English, Kannada and Telugu independently through instructions, review and linked WhatsApp. Keep translation fallbacks visible and avoid language changes based only on location.
6. **Run phone and accessibility acceptance checks.** Inspect 360px and 390px widths, keyboard focus, enlarged text, accordion labels, tour navigation and action-button overlap after deployment. Browser access was disabled in this pass; no new visual acceptance claim is made.
7. **Replace launch uncertainty with evidence.** Track free-task completion, review failures, helpfulness reports and delivery failures in the existing owner quality dashboard. Use recurring user problems to choose the next changes.

## Launch decision and owner actions

Paid launch is not cleared by this review. Terms and Refunds still display Draft for legal review on the live site. Have the current policies reviewed and confirm the grievance contact before setting the existing exact-revision approval. Never mark approval merely to bypass the checkout gate.

No WhatsApp messages were sent, consistent with the owner instruction. Actual delivery, reminder receipt and new authenticated desktop/mobile journeys remain unverified in this pass.

Reference for subscription state handling: https://razorpay.com/docs/payments/subscriptions/states/
