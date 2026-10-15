# WhatsLearn deployment guide: a regular website with email accounts (v40, updated v41)

Nothing here has been done for you. No deploy, publish, DNS change, live-database migration or real payment was made from this project, and none should be made without the owner's own go-ahead. Every secret goes into the host's secret settings, never into the code, the ZIP, the browser or chat.

## 1. Recommended host and why
**Cloudflare Workers (with D1 and, optionally, R2), plus Supabase Auth for sign-in.**
- The app already builds for Cloudflare Workers and uses D1 (SQLite) through Drizzle; no code change of runtime was needed. `wrangler deploy --dry-run` on the built app was run and succeeded (about 3.1 MB, 864 KB gzipped, bindings `DB` and `BUCKET` shown).
- A Worker can call a provider over HTTPS, set HttpOnly cookies and read the request's network address, which email sign-in needs. OpenAI Sites cannot (ChatGPT sign-in only).
- D1 holds progress, points, rewards and rate-limit counters next to the code; R2 holds optional uploads privately.
- **Supabase Auth** is an established managed provider: hashed passwords, email confirmation, reset, sessions and its own rate limits. Reasons it fits: plain HTTPS API (works in a Worker without a Node SDK), custom SMTP, and `redirect_to` allow-lists. Alternatives (Clerk, Auth0, Firebase) would need a different `lib/auth/gotrue.ts`; the rest of the app only needs `getChatGPTUser()` to return the verified user.
- Cost and plans change; check Cloudflare's and Supabase's current pricing and limits yourself (Supabase's built-in email sender is for testing only and is heavily limited; use your own SMTP service for launch).

## 2. Accounts to create (owner)
1. Cloudflare account with Workers, D1 and (optional) R2 enabled.
2. Supabase project (choose a region near your learners, for example Mumbai if offered).
3. An email-sending service with SMTP (for confirmation and reset mail) and a sending domain you control, with SPF, DKIM and DMARC records set as that service instructs.
4. Razorpay account (only when you are ready for payments; test mode first).
5. Optional: OpenAI or Anthropic key for AI feedback; Meta WhatsApp Business for automation.

## 3. Build and deploy settings
Non-secret build-time names (they replace the local placeholders in `vite.config.ts`; without them the build is unchanged):
`CF_D1_DATABASE_ID`, `CF_D1_DATABASE_NAME`, `CF_R2_BUCKET_NAME` (only if you want uploads).
```
wrangler d1 create whatslearn-db            # copy the database id it prints
wrangler r2 bucket create whatslearn-files  # optional, private by default
CF_D1_DATABASE_ID=<id> CF_D1_DATABASE_NAME=whatslearn-db CF_R2_BUCKET_NAME=whatslearn-files node scripts/run-framework.mjs build
# Check first, deploys nothing:
npx wrangler deploy --dry-run --config dist/server/wrangler.json --name whatslearn
```
Deploy only when you decide to: `npx wrangler deploy --config dist/server/wrangler.json --name whatslearn`. The generated worker name defaults to `site-creator-vinext-starter`; pass `--name` as above.

## 3A. Welcome points and real sign-up (v41)
- The one-time welcome balance (`STARTING_POINTS`, empty means 50) is credited when a **verified account** first signs in or confirms its email, and never again. The welcome message ("Welcome! 50 points added", with a short, quiet animation that is removed for reduced-motion settings and makes no sound) is shown once per account; the server remembers that it was shown.
- **A real sign-up needs a host that can run email accounts.** On the OpenAI Sites host the only sign-in is ChatGPT; verified email/password accounts cannot be created there, so the email form is not shown and nothing is faked. A real sign-up requires the setup in this guide: Cloudflare Workers + D1, a Supabase project with email confirmation on, SMTP, the email templates, `SITE_URL`, and the migrations applied.
- The local test account (`seedy@sites.test`) and the stand-in provider used in tests are **not proof of real sign-up**. They show how the app behaves; they do not show that Supabase sends the email, that the link works from a real inbox, or that the confirmation creates a real account. Do the launch checklist (section 12) with a real inbox before relying on it.
- Guests receive no welcome balance. The app says so, and that guest progress stays in the browser and is not saved or synced.

See also `owner-signup-checklist.md` for a step-by-step test of signup and email delivery with your own Supabase project.

## 4. Environment variables (names only; values go in the host)
Set secrets with `wrangler secret put NAME --name whatslearn`; plain settings can be `vars` in the dashboard.
| Name | Secret? | Needed | Purpose |
|---|---|---|---|
| `SUPABASE_URL` | no | for email accounts | Project address, `https://<ref>.supabase.co` |
| `SUPABASE_PUBLISHABLE_KEY` | no (but keep in settings) | for email accounts | The provider's publishable (anon) key |
| `SUPABASE_SERVICE_ROLE_KEY` | **yes** | optional | Lets "Delete my account" also remove the login. Without it the data is erased and the login is removed by the team (see section 9) |
| `SITE_URL` | no | yes | `https://whatslearn.in`. Emailed links are built from this, never from the request |
| `STARTING_POINTS` | no | optional | One-time welcome balance. Empty means 50 |
| `REWARD_PLAN`, `REWARD_DAYS` | no | optional | Reward stays off until both are set (section 8) |
| `UPLOADS_ENABLED` | no | optional | `true` plus an R2 bucket bound as `BUCKET` turns uploads on |
| `BILLING_ADMIN_EMAIL` | no | for owner pages | Owner address for `/billing/setup` and the reward review route |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | secrets | for payments | Test keys first |
| `BILLING_LIVE_ENABLED`, `BILLING_PUBLIC_CHECKOUT` | no | leave empty | Real money and public checkout stay off |
| `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`, `AI_PROVIDER`, model and daily-limit settings | secrets | optional | AI feedback |
| `WHATSAPP_*`, `REMINDER_CRON_SECRET` | secrets | optional | WhatsApp automation |
`.env.example` lists every name with placeholders only. For local work use an ignored `.env.local`.

## 5. Supabase setup (owner)
Check each item in the dashboard; menus are renamed from time to time.
1. **Authentication, providers:** Email on. **Confirm email: on** (the app also refuses unconfirmed sign-ins itself). **Minimum password length: 10 or more**.
2. **URL configuration:** Site URL `https://whatslearn.in`. **Redirect URLs allow-list:** `https://whatslearn.in/**` (add a preview address only if you test there). Emailed links only work for allow-listed addresses.
3. **Email templates:** the app sends the learner to its own confirm page, so the templates must contain **exactly this link shape** (this is the one real-provider contract that must be checked by hand):
   - Confirm sign up: `<a href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=signup">Confirm my email</a>`
   - Reset password: `<a href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=recovery">Reset my password</a>`
   `{{ .RedirectTo }}` already contains `?next=…`, which is why the extra parameters begin with `&`.
4. **SMTP:** Authentication, Emails, SMTP settings: use your email service, a sender address on your domain. Send yourself a sign-up and a reset email and open both links.
5. **Rate limits and CAPTCHA:** keep the provider's rate limits on; consider enabling its CAPTCHA protection (the app does not yet include a CAPTCHA widget).
6. Copy the project URL and publishable key into the host settings; the service-role key (if you use it) only as a secret.

## 6. Database: create, migrate, back up
> **Must do before signed-in learners use mini challenges (checkpoints):** apply `drizzle/0010_checkpoint_clears.sql`, and only after `0009_accounts_rewards_uploads.sql`. Without it, signed-in learners cannot clear a checkpoint and missions 3, 5, 7 and 9 stay locked. It only adds the `checkpoint_clears` table. Nothing was applied to any hosted database by us.
> Check the order locally first: `pnpm db:verify` (applies all files to a throw-away in-memory database; never touches a real one).

- Migrations `drizzle/0000` to `drizzle/0011` (0011 adds the WhatsApp bridge tables, see docs/whatsapp-n8n-setup-v55.md; 0009 adds `auth_attempts`, `reward_claims`, `uploads`; 0010 adds `checkpoint_clears` for mini-challenge badges). Apply them to the **hosted** database only when you decide to, in order: `npx wrangler d1 migrations apply whatslearn-db --remote` (needs a `migrations_dir` or run each file with `wrangler d1 execute whatslearn-db --remote --file drizzle/NNNN_name.sql`; the `--> statement-breakpoint` markers are comments and are harmless).
- **Before** any change to live data: `npx wrangler d1 export whatslearn-db --remote --output backup-$(date +%F).sql` and keep the file somewhere private. Cloudflare's own point-in-time recovery ("Time Travel") is also available for D1; confirm its current window in their docs.
- Nothing was applied to any hosted database from this project.

## 7. HTTPS, domain and DNS (owner)
Add the custom domain to the Worker in the Cloudflare dashboard (Workers, Settings, Domains and Routes). If the domain is on Cloudflare, the records are created for you; if not, the dashboard shows exactly what to add at your registrar. HTTPS is automatic. Cookies in email mode are `__Host-` prefixed and need https, so test on the https address. **No DNS change was made.** Moving `whatslearn.in` off OpenAI Sites is a decision for the owner and ends ChatGPT sign-in there; plan it (section 11).

## 8. Optional features, off until configured
- **Free-membership reward.** The highest title is: all 10 missions of one course, no clue in that course, one new mission on each of 10 consecutive India days. Set `REWARD_PLAN` (a plan key: `sprint`, `plus_monthly`, `plus_annual`, `pro_monthly`, `pro_annual`, `teams_monthly`) and `REWARD_DAYS` (1 to 366) to open it. A learner who has earned the title can request it **once per account**. It is a request, not an automatic grant: the owner (signed in as `BILLING_ADMIN_EMAIL`) lists claims at `GET /api/admin/rewards` and decides with `POST /api/admin/rewards` `{"userId":"…","action":"approve"|"decline"|"revoke"}` (the same origin and session are needed; non-owners get a 404). Approving writes one account-bound entitlement for the configured plan and days (mode `reward`, never a payment, never a public code); approving twice is refused. There is no owner screen yet; use the browser console or a REST tool signed in as the owner, or ask for a screen in a later version.
- **Uploads.** Set `UPLOADS_ENABLED=true` and bind a private R2 bucket as `BUCKET`. Types are decided from file bytes: PNG, JPEG, WebP, GIF up to 5 MB; PDF up to 10 MB; MP4/WebM up to 25 MB; 3 per mission, 30 per account. Never public, never run, downloaded only by the owner of the file as an attachment, deleted on request and with the account. Not reviewed by AI, and the interface says so. No virus scanning is built in; add one before opening uploads widely.
- **Leaderboard.** None exists. If ever added it must be opt-in with a chosen display name and no email, work or account details.

## 9. Account deletion process
"Delete my account" (Settings, email accounts) re-checks the password, deletes the learner's rows and files, replaces the points ledger with one empty marker (so a welcome balance cannot be granted twice), keeps billing records the privacy policy says tax law requires, and then removes the login at the provider if `SUPABASE_SERVICE_ROLE_KEY` is set. **If it is not set,** the learner is told the login will be removed by the team within 30 days: in Supabase, Authentication, Users, delete the user. Also honour deletion requests that arrive by email (`connect@brandmintai.io`).

## 10. Services inventory
| Service | Enabled by | What happens without it |
|---|---|---|
| Email accounts (Supabase) | `SUPABASE_URL` + key | Host mode: ChatGPT sign-in on Sites, guest mode elsewhere. No email form is shown |
| ChatGPT sign-in | Only on OpenAI Sites | Not available on other hosts |
| AI feedback (OpenAI or Anthropic) | an API key; independent of sign-in | Rule-based self-review checks only, labelled as such. Never presented as AI review |
| Razorpay | test keys, then live keys + `BILLING_LIVE_ENABLED` + `BILLING_PUBLIC_CHECKOUT` | Membership shows "not open yet"; test checkout is owner-only |
| WhatsApp automation | Meta credentials | Direct `wa.me` links and the opt-in preview still work without any Meta account |
| ChatGPT companion | none | The "Open WhatsLearn in ChatGPT" button opens the Custom GPT in a new tab |
| Reward, uploads | section 8 | Hidden / off |

## 11. Razorpay: test first, live separately
1. Locally or on a test deployment only: set `RAZORPAY_*` **test** keys (`rzp_test_`), `BILLING_ADMIN_EMAIL`, and the webhook secret. Test mode checkout is owner-only. Open `/billing/setup` as the owner, create the test plans, make a test payment with Razorpay's test cards, and confirm the entitlement appears. See `docs/razorpay-setup.md`.
2. Live is a separate decision: live keys, `BILLING_LIVE_ENABLED=true`, then `BILLING_PUBLIC_CHECKOUT=true` only when you are ready for customers. Nothing in this project turns these on.

## 12. Launch checklist
- [ ] Supabase: confirm email on, min password 10+, redirect allow-list, both email templates, SMTP set; a real sign-up, confirmation, sign-out, sign-in, forgot and reset were tried with a real inbox.
- [ ] `SITE_URL` is the https address. Secrets set with `wrangler secret put`. No secret appears in the repository or ZIP.
- [ ] D1 created, backup taken, migrations 0000 to 0011 applied in order (0011 only needed for the WhatsApp learning flow).
- [ ] Domain added; https loads; cookies are `__Host-wl-…` HttpOnly.
- [ ] Owner email set; reward and uploads deliberately on or off.
- [ ] Privacy and terms reviewed by a lawyer; Grievance Officer name and contact filled in (still a placeholder).
- [ ] Razorpay test payment verified; live flags still empty.
- [ ] Try each: a guest, a new account, a second account (cannot see the first), account deletion.
- [ ] Native review of Hindi and Kannada word lists and the machine-drafted translations.

## 13. Rollback plan
- Keep the previous Worker version: `npx wrangler deployments list --name whatslearn`, then `npx wrangler rollback --name whatslearn` (or choose a version in the dashboard).
- Database changes in 0009 and 0010 only add tables; the previous app version ignores them. Restore from the export in section 6 only if data was damaged.
- DNS: keep the old records' values written down before changing anything; moving back is changing them back.
- If email sign-in misbehaves after launch, clear `SUPABASE_URL` (the site returns to host mode: no email form is shown) while you fix it; learners' data is untouched.

## 14. Honest limits
Real Supabase behaviour, real email delivery, the redirect allow-list, `wrangler deploy` itself and R2 were **not** testable from this project (no accounts or keys were given, rightly). They were tested against a stand-in that models the documented API (`scripts/fake-auth-core.cjs`), in the real Workers runtime locally, and by the dry-run. Do the checklist above before trusting them.
