# WhatsLearn go-live setup (added 10 October 2026)

Everything below is **off until you add the settings**. With nothing set, the site behaves exactly as before: plans save a preference, help uses prepared lesson content, and the WhatsApp switch stores a preference.

Put every value in the site's protected environment settings (Sites hosting → environment), or in `.env.local` for local dev. Never commit them.

## 1. Database

Apply the new migration `drizzle/0006_paid_access_ai_whatsapp.sql` (tables: `entitlements`, `ai_feedback_usage`, `whatsapp_contacts`, `whatsapp_events`; new columns `billing_sessions.mode` and `billing_sessions.payment_id`). Locally: see "Local D1 migrations" in the README.
The one-new-mission-a-day limit uses the India (Asia/Kolkata) calendar day for everyone and needs no setting. Apply `drizzle/0007_mission_points.sql` as well (tables `mission_scores` and `mission_clues`). Without it, signed-in saves fail with a retry message.
v37 adds the points balance. Apply `drizzle/0008_points_ledger.sql` too (table `point_ledger`; it also carries earlier mission scores over once). Every signed-in account receives a one-time starting balance of `STARTING_POINTS` points (empty means 50) the first time it loads, saves or reveals a clue. Changing the setting later never tops up an account that already has its balance. Without the migration, signed-in loads, saves and clues fail with a retry message.

## 2. Payments (Razorpay)

| Variable | What it is |
|---|---|
| `RAZORPAY_KEY_ID` | `rzp_test_…` for testing, `rzp_live_…` for real money |
| `RAZORPAY_KEY_SECRET` | Key secret from the Razorpay dashboard |
| `RAZORPAY_WEBHOOK_SECRET` | Secret you choose when adding the webhook |
| `BILLING_ADMIN_EMAIL` | Your ChatGPT sign-in email; only this account can create plans |
| `BILLING_PUBLIC_CHECKOUT` | `true` lets every signed-in learner pay, in live mode only. Test mode is always owner-only, whatever this says |
| `BILLING_LIVE_ENABLED` | Must be `true` for a `rzp_live_` key to work. A live key alone never charges anyone |
| `RAZORPAY_SPRINT_CREDIT_OFFER_ID` | Optional. A Razorpay subscription offer worth ₹149 off the first Plus/Pro month; applied automatically within 7 days of a paid sprint |

Steps:
1. Razorpay dashboard → Settings → API keys (test mode) → copy key ID and secret.
2. Settings → Webhooks → add `https://whatslearn.in/api/billing/webhook` with events `order.paid`, `payment.captured`, `payment.failed`, all `subscription.*`, and `refund.processed`. Copy the secret.
3. Sign in on the site with `BILLING_ADMIN_EMAIL`, open `/billing/setup`, press **Create test plans**.
4. Pay with Razorpay test details (card `4111 1111 1111 1111`, any future date, any CVV; or UPI `success@razorpay`). The membership page then shows "Your plan … (test)".
5. To go live: repeat steps 1–3 with live keys, set `BILLING_LIVE_ENABLED=true` and `BILLING_PUBLIC_CHECKOUT=true`, and create the live plans again (test and live plans are stored separately).

What happens after payment: the server checks Razorpay's signature and amount, then writes an `entitlements` row. Sprint = 7 days of access. Subscriptions = until Razorpay's current period end, renewed by webhooks. Cancel = renewal stops, access lasts to period end (test mode cancels immediately). Full sprint refund or a halted subscription ends access. Use `hasPaidAccess(userId)` in `lib/billing/service.ts` to gate future paid features; today paid access raises the AI review allowance.

Still to decide before live: Teams seat assignment (the buyer gets access; adding learners is not built), GST invoices, and the "Proposed" points in `/refunds`.

## 3. Live AI review (OpenAI or Claude API)

Set the key for **one** provider. If you set both, `AI_PROVIDER` chooses; if it is empty, Claude is used. If `AI_PROVIDER` names a provider whose key is missing, the other key is used.

| Variable | What it is |
|---|---|
| `AI_PROVIDER` | Optional: `openai` or `claude` (`anthropic` is accepted as the same) |
| `OPENAI_API_KEY` | From platform.openai.com → API keys |
| `OPENAI_MODEL` | Optional, default `gpt-4.1-mini`; any current OpenAI chat model works |
| `ANTHROPIC_API_KEY` | From console.anthropic.com → API keys |
| `ANTHROPIC_MODEL` | Optional, default `claude-sonnet-5-5` |
| `AI_FEEDBACK_DAILY_LIMIT` | Optional, reviews/questions per day for free learners (default 3) |
| `AI_FEEDBACK_DAILY_LIMIT_PAID` | Optional, per day with paid access (default 10) |

Local setup with OpenAI: put `AI_PROVIDER=openai` and `OPENAI_API_KEY=sk-your-openai-key-here` in `.env.local` (git-ignored), restart `pnpm dev`, sign in at `/signin-with-chatgpt?return_to=/learn`, open a mission, write a few sentences, press **Review my work**, then **Get AI review of my writing**. On the hosting side, add the same names as protected environment secrets.

Both providers get the same instructions and return the same feedback format, and the daily limits apply to either. Learners must sign in. Each mission gets "Get AI review of my writing" (feedback against the mission checklist, in the learner's language) and an "Ask your own question" box. Without the key, nothing changes on the page.

## 4. WhatsApp lessons and reminders (Meta WhatsApp Cloud API)

| Variable | What it is |
|---|---|
| `WHATSAPP_TOKEN` | Permanent system-user access token (Meta Business settings) |
| `WHATSAPP_PHONE_NUMBER_ID` | Phone number ID from WhatsApp → API setup |
| `WHATSAPP_APP_SECRET` | Meta app → Settings → Basic → App secret (verifies webhooks) |
| `WHATSAPP_VERIFY_TOKEN` | Any random string you also type into Meta's webhook form |
| `WHATSAPP_BUSINESS_NUMBER` | Your WhatsApp number, digits only (e.g. `919972965677`), for "Get today's lesson" buttons |
| `WHATSAPP_REMINDER_TEMPLATE` | Name of your approved reminder template |
| `WHATSAPP_TEMPLATE_LANGUAGE` | Optional, template language code (default `en`) |
| `REMINDER_CRON_SECRET` | Random string your scheduler sends |
| `SITE_URL` | Optional, default `https://whatslearn.in` |

Steps:
1. Meta for Developers → create a Business app → add WhatsApp → add and verify your business number.
2. Webhook URL `https://whatslearn.in/api/whatsapp/webhook`, verify token = `WHATSAPP_VERIFY_TOKEN`, subscribe to `messages`.
3. Create a template named e.g. `learning_reminder` with **one** body variable, for example: "Your next WhatsLearn challenge is ready: {{1}}. Reply LESSON to start, or STOP to pause reminders." Meta decides its category (utility or marketing), which affects price.
4. Schedule one call a day (Cloudflare Cron Trigger worker, cron-job.org, GitHub Actions…):
   `curl -X POST https://whatslearn.in/api/whatsapp/reminders -H "Authorization: Bearer $REMINDER_CRON_SECRET"`
   It sends at most one reminder per learner per 20 hours, skips anyone who chatted recently, and only opted-in learners.

Learner flow: Settings → switch on reminders → enter number → tick consent → **Turn on WhatsApp lessons**. On WhatsApp: `LESSON`/`HI` = next challenge with a link; any longer message = their answer (AI feedback if the Claude key is set); `STOP` = opt out; `START` = opt back in.

## 5. ChatGPT companion

The public GPT link is set in `lib/companion.ts` (`companionInstallUrl`, v34). Empty it to fall back to the "Request the installation card" button.

## 6. Policies

`/privacy`, `/terms` and the new `/refunds` are drafts marked for legal review. Fill in the Grievance Officer's name in `/privacy` and confirm every point marked "Proposed" in `/refunds`.

## 7. Languages

The 20 languages beyond English, Kannada and Hindi have machine-drafted lesson packs in `lib/translations/<code>.ts` with `reviewed:false`. The site labels them "draft translation". After a native speaker checks a file, set `reviewed:true` and move the code from `draftLessonLanguages` to `reviewedLessonLanguages` in `lib/languages.ts`.

## 8. Wording to update when you switch features on

These sentences were kept exactly as they were, because they are true until you add the keys. Change them on the day each feature goes live:
- Home page FAQ: "WhatsApp delivery is coming soon…" and "Paid checkout is coming soon."
- Strategy/studio preview dialog: "WhatsApp delivery and paid subscriptions are not connected yet."
- Membership: "Launch prices below. Explore works now; paid plans open when delivery and checkout are connected." (The plan dialog, billing note and payment box already switch by themselves when checkout is on.)

Pages that switch by themselves: the Membership plan dialog, the My Journey "Learn on WhatsApp" dialog, the Settings reminder switch, and the Ask WhatsLearn / feedback boxes.


## v40: accounts, rewards and uploads
Apply `drizzle/0010_checkpoint_clears.sql` (after 0009) before signed-in learners use mini challenges (table `checkpoint_clears`, the badges). `pnpm db:verify` checks the order locally. Without it, signed-in learners cannot clear mini challenges and missions 3, 5, 7 and 9 stay locked.

Apply `drizzle/0009_accounts_rewards_uploads.sql` as well (tables `auth_attempts`, `reward_claims`, `uploads`). Without it email sign-in cannot rate-limit and fails closed with a retry message. Full hosting, provider, DNS, backup and rollback steps are in `docs/deployment-guide.md`. Nothing was applied to any database from this project.
