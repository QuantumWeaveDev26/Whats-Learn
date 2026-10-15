# WhatsLearn × Razorpay: guided test setup

Prepared 29 September 2026. Website: https://whatslearn.in
Owner test page: https://whatslearn.in/billing/setup
Webhook: https://whatslearn.in/api/billing/webhook

## 1. Get your existing Test API keys

Sign in at https://dashboard.razorpay.com/ and select **Test Mode**. Open **Account & Settings → API Keys**, under Website and app settings.

Use your saved existing test key pair, or generate it if none exists. Do not regenerate a key used by another application without coordinating its replacement. Never put the Key Secret in chat, screenshots, uploaded files or frontend code.

Confirm that the Subscriptions product is available in your Razorpay account. If not, request access through Razorpay support. This has not been checked in your account.

## 2. Store four values securely

Open https://chatgpt.com/sites, find WhatsLearn, then **More actions → Settings**. Add these hosted environment values:

| Key | Value | Mark secret |
| --- | --- | --- |
| RAZORPAY_KEY_ID | Your key beginning `rzp_test_` | No |
| RAZORPAY_KEY_SECRET | Matching Test Key Secret | Yes |
| RAZORPAY_WEBHOOK_SECRET | A new strong random secret you choose for the webhook | Yes |
| BILLING_ADMIN_EMAIL | Email of the ChatGPT account you will use to sign in to WhatsLearn for testing | Yes |

Only this exact signed-in email can create plans or perform billing tests. Public visitors cannot use the test checkout. Values are server-side. No card data is stored by WhatsLearn.

Tell the assistant **“Test settings saved—redeploy WhatsLearn.”** Do not include the values. Runtime changes need redeployment. Ask for help with a screenshot showing field labels only if you cannot find the settings.

## 3. Add the webhook in Razorpay Test Mode

Open Razorpay's webhook settings and add:

- URL: `https://whatslearn.in/api/billing/webhook`
- Secret: exactly the same value stored as `RAZORPAY_WEBHOOK_SECRET` above.
- Events: `order.paid`, `payment.captured`, `payment.failed`, `subscription.authenticated`, `subscription.activated`, `subscription.charged`, `subscription.pending`, `subscription.halted`, `subscription.cancelled`, `subscription.completed`, `subscription.paused`, `subscription.resumed`.

If an event is unavailable in your account, record which one; do not invent or substitute event names. Enable delivery. Validation uses the unchanged request body and `X-Razorpay-Signature`. Duplicate deliveries are identified by `x-razorpay-event-id`. Status refresh reads current Razorpay state instead of trusting webhook arrival order.

## 4. Let WhatsLearn create your test plans

Visit https://whatslearn.in/billing/setup. Sign in using the configured billing owner email. Once all setup checks are ready, click **Create test plans**.

| Offer | Price | Razorpay type |
| --- | ---: | --- |
| Skill Sprint | ₹149 once | Order, no recurring mandate |
| Plus monthly | ₹499/month | Monthly plan |
| Plus annual | ₹4,999/year | Yearly plan |
| Pro monthly | ₹999/month | Monthly plan |
| Pro annual | ₹9,999/year | Yearly plan |
| Teams | ₹399/learner/month, 5 minimum | Monthly plan with quantity |

Amounts are calculated in paise on the server. Teams starts at ₹1,995/month. The plan creator reuses its stored plans; it does not create duplicates on repeat clicks. If a creation fails after reaching Razorpay, the row stays locked pending reconciliation; do not delete or retry blindly.

Test subscriptions use 12 monthly cycles or 5 yearly cycles and allow cancellation. This is a bounded testing configuration, not a promise of indefinite renewal.

## 5. Complete acceptance testing

Use only the official Razorpay test payment details from its documentation; never enter a real card for these tests.

1. Pay for a test ₹149 sprint. Confirm the order becomes `paid`.
2. Authorise a test Plus monthly subscription. Authentication and activation may be separate events: authorisation alone is not proof that an invoice has been paid.
3. Test one annual plan and Teams with 5 learners; verify the total.
4. Close checkout and simulate a failed test payment; neither should show false success.
5. Refresh status from the setup page and inspect delivery logs in Razorpay.
6. Resend a webhook: it must not create duplicate credit or another checkout.
7. Cancel an active test subscription. It is cancelled at the cycle boundary; unstarted subscriptions are cancelled immediately.
8. Confirm another signed-in account cannot view the test owner's billing records or create checkouts.

Razorpay's simulated result must be checked in both the dashboard and WhatsLearn. This account-connected end-to-end test has not yet happened because credentials have not been configured.

## 6. Live launch gate — separate step

This release intentionally rejects `rzp_live_` keys. Replacing keys alone will not enable real charges. It does not activate paid entitlements from test results.

Before a live release:

- Confirm account activation, Subscriptions approval and verification of whatslearn.in.
- Make the promised paid learning delivery available; implement and test monthly allowances, account entitlements and Teams seats.
- Implement the first ₹149 sprint upgrade credit for the first Plus/Pro monthly purchase within seven days; it is not applied in this test release.
- Finalise cancellation, refunds, privacy, terms, support and tax/invoice details with the business owner. Do not invent registration numbers or a refund policy.
- Add refund and dispute reconciliation plus paid-through access rules. Test cancellation must not be mistaken for automatic refund handling.
- Create separate live plans, keys and webhook configuration; isolate live records from test records before live activation.
- Confirm subscription term/mandate duration and renewal disclosures for the live offer.
- Run the production acceptance checks and then deliberately enable real checkout. Do not switch it on just because test keys work.

## What is automated now

Owner-restricted test plan provisioning; server-priced Orders/Subscriptions; Razorpay hosted checkout; signature verification; per-user records; duplicate open-checkout protection; verified webhook reception; status reconciliation; test cancellation. No autonomous refunds, customer messages, entitlement grants or charges are performed by setup.

## References

- Razorpay subscriptions: https://razorpay.com/docs/payments/subscriptions/integration-guide/
- Razorpay keys: https://razorpay.com/docs/payments/dashboard/account-settings/api-keys/
- Razorpay webhook validation: https://razorpay.com/docs/webhooks/validate-test/
- Razorpay test subscriptions: https://razorpay.com/docs/payments/subscriptions/test/
- Sites hosted environment settings: https://learn.chatgpt.com/docs/sites


Test cancellation update: The owner-only setup tool now cancels test subscriptions immediately using cancel_at_cycle_end=false, then fetches the subscription again. It reports success only for a confirmed cancelled status. Earlier incomplete attempts have no cancellation controls. Live billing remains disabled.


Update 10 October 2026: live billing, paid access (entitlements), refund handling, the first-sprint credit offer and public checkout are now built behind explicit switches. See docs/go-live-setup.md. The live gate above still applies: confirm each item before setting BILLING_LIVE_ENABLED=true.
