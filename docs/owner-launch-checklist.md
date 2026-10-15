# Owner launch checklist (v30, 10 October 2026)

These items need the owner or an outside person. The code cannot finish them. Step-by-step setup is in `docs/go-live-setup.md`.

## Needs your details
- [ ] **Grievance Officer** (Privacy page, section on grievances): give their full name and an email or phone number. The page shows a placeholder until then. `app/privacy/page.tsx`.
- [x] **ChatGPT companion link**: set in v34 to the WhatsLearn GPT link you provided (`companionInstallUrl` in `lib/companion.ts`). The Companion page's "Open WhatsLearn in ChatGPT" button uses it. Open it once from the hosted site to confirm the GPT is public and works.

## Needs a lawyer
- [ ] Have a qualified legal adviser review Privacy, Terms and Refunds (`app/privacy`, `app/terms`, `app/refunds`) before paid plans open.
- [ ] After approval, remove the "Draft for legal review" notice in `components/whatslearn/legal-page.tsx` and update each page's "Last updated" date.

## Needs your Razorpay account
- [ ] Turn on **Subscriptions** in the Razorpay dashboard. Plus, Pro and Teams are subscriptions and cannot be bought without it. Skill Sprint is a one-time order and does not need it.
- [ ] Check which payment methods are switched on: UPI, cards and net banking for orders; cards, UPI Autopay and e-mandate for subscriptions. Checkout shows only what is switched on.
- [ ] In hosting settings: set `BILLING_ADMIN_EMAIL` to your own ChatGPT email, add the Razorpay **test** key, secret and webhook secret, then create the test plans on `/billing/setup` and try a test payment.
- [ ] Leave `BILLING_LIVE_ENABLED` and `BILLING_PUBLIC_CHECKOUT` empty until you decide to take real money. Customers can pay only when a live key and both settings are set.

## Needs native speakers
- [ ] **Manipuri (Meitei Mayek) and Santali (Ol Chiki)** first: both were re-drafted in v30 but are still machine drafts. `lib/translations/mni.ts`, `lib/translations/sat.ts`.
- [ ] Then Odia, Assamese, Konkani, Maithili, Kashmiri and Bodo, then Dogri and Sanskrit (some invented technical terms).
- [ ] When a reviewer approves a language, set `reviewed:true` in its pack. To show English lessons instead of a draft, remove the code from `draftLessonLanguages` in `lib/languages.ts`.

## Not tested from here
- A real Razorpay payment, real OpenAI or Claude calls, and live WhatsApp messages. Test each one in the hosted site with test settings before launch.

## Added in v32
- [ ] Have a native speaker check the Hindi and Kannada on-topic word lists in `lib/course-terms.ts` (used only for the automatic relevance check), and translate the 30 new missions if you want those languages shown in full.
- [ ] Apply `drizzle/0007_mission_points.sql` to the hosted database before the first signed-in save.
- [ ] (v37) Apply `drizzle/0008_points_ledger.sql` (points balance) after 0007, and decide the starting points (`STARTING_POINTS`, proposed 50).
- [ ] (v37) Decide whether you want name, email and password accounts. The Sites host cannot provide them; see `docs/sign-in-hosting.md` for the provider and setup needed. Nothing is faked in the meantime.
- [ ] (v37) Have a native speaker check the answer-feedback lines in `lib/quiz-feedback.ts` (drafts for 18 languages; Bodo, Manipuri, Kashmiri and Santali show English).
- [ ] (v36) Translate the understanding question, answer options, explanation and practical task of all 40 missions into Kannada and Hindi, with a native-speaker review. Until then those parts are shown in English with a notice (the 10 older missions lost their old translated question and task because the English ones were rewritten; see `docs/changes-v36-2026-10-12.md`).
- [ ] Translate (or have reviewed) the 30 missions listed as awaiting translation in `docs/changes-v33-2026-10-12.md`. Until then Kannada and Hindi learners see them in English with an honest notice.

## v40: regular website with email accounts (needs your accounts; see `docs/deployment-guide.md`)
- [ ] Choose to host on Cloudflare Workers (recommended) and create the Cloudflare and Supabase accounts, an SMTP email service and your sending-domain records.
- [ ] Supabase: confirm email on, minimum password 10+, redirect allow-list `https://whatslearn.in/**`, paste the two email templates (the link shape is in the guide), set SMTP. Try sign-up, confirmation, reset with a real inbox.
- [ ] Create the D1 database, take a backup, apply migrations 0000 to 0010 in order (`0010_checkpoint_clears` after 0009, before signed-in learners use mini challenges; `pnpm db:verify` checks the order locally), set secrets with `wrangler secret put`.
- [ ] Decide the reward: set `REWARD_PLAN` and `REWARD_DAYS` (off until both are set); decide who reviews claims (the `BILLING_ADMIN_EMAIL` owner) and how you will honour them.
- [ ] Decide on uploads: create a private R2 bucket and set `UPLOADS_ENABLED=true`, or leave them off. Consider a virus scan first.
- [ ] Decide when to move `whatslearn.in` off OpenAI Sites (ChatGPT sign-in is only available there).
- [ ] Grievance Officer name and contact; lawyer review of the legal pages (privacy now describes accounts, uploads and deletion).
