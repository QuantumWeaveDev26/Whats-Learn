# Sign-in when WhatsLearn is deployed (reviewed 10 October 2026, v27; **v40 adds email accounts on your own host, see `docs/deployment-guide.md` and `docs/sign-in-hosting.md`**)

> v40: below describes the OpenAI Sites (host-mode) behaviour, which is unchanged. When `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` are set the app switches to email mode and **ignores** the `oai-authenticated-user-*` headers entirely, so a plain Cloudflare Worker is no longer exposed to forged headers.

## Where sign-in comes from

WhatsLearn does not have its own accounts or passwords. It uses **Sign in with ChatGPT provided by OpenAI Sites hosting**:

- `.openai/hosting.json` names the Sites project and the D1 database binding `DB`. Publishing through Sites is the supported deployment.
- On Sites, the hosting layer (Dispatch) owns `/signin-with-chatgpt`, `/signout-with-chatgpt` and `/callback`, runs the ChatGPT sign-in, and adds `oai-authenticated-user-id`, `-email` and (optionally) `-full-name` headers to each request from a signed-in visitor.
- The app reads only those headers, in `app/chatgpt-auth.ts` → `getChatGPTUser()`. Every account record is keyed by `oai-authenticated-user-id`, never by email or by anything in the request body.

**Important:** the app trusts those headers as given. That is safe on Sites, where the hosting layer sets them. On any other host (for example `wrangler deploy` to a plain Cloudflare Worker, Vercel, or a VPS), nobody sets or removes them: ChatGPT sign-in would not work (`/signin-with-chatgpt` returns 404), and anyone could send the headers themselves and act as any user. This was confirmed on the built Worker run directly with Wrangler (forged headers → 200). **Do not deploy outside OpenAI Sites without adding a different sign-in provider first.** The project has no deploy script for other hosts.

## How a visitor signs in on the live site

1. They press **Sign up / Sign in** (top of every page) or a "Sign in" link on a feature that needs it.
2. The browser goes to `/signin-with-chatgpt?return_to=…` as a full page load; Sites runs Sign in with ChatGPT.
3. They return to the page they came from, signed in. **Sign out** uses `/signout-with-chatgpt`.

Whether visitors must sign in for every page depends on the Site's access setting in Sites (public or private). For WhatsLearn, keep the Site **public** so guests can try the starter and missions.

## What needs sign-in

| Works as a guest (saved in this browser only) | Needs sign-in |
|---|---|
| Home starter piece, Learn missions, stars and coins, plan preference, language | Saving work to the account (`/api/work`, `/api/progress`), learning profile (`/api/profile`), synced rewards (`/api/play`), personal learning path, AI review and questions (`/api/feedback`), WhatsApp lessons opt-in (`/api/whatsapp`), membership checkout and billing status (`/api/billing`), ChatGPT companion tools (`/mcp`), source check (`/api/signals`) |

Not tied to a user (protected another way): Razorpay webhook (signature with `RAZORPAY_WEBHOOK_SECRET`), WhatsApp webhook (Meta signature with `WHATSAPP_APP_SECRET`), reminders (`Authorization: Bearer REMINDER_CRON_SECRET`), updates feed (public).

## The local test user

`seedy@sites.test` exists only on your computer: in `pnpm dev` (the Vite plugin in `build/sites-vite-plugin.ts`, development server only) and in `pnpm start` (`scripts/local-preview.mjs`, which answers loopback hosts and callers only). Neither is in the published build: the built files contain no local sign-in code. `.test` addresses cannot belong to a real ChatGPT account.

For the live site, set `BILLING_ADMIN_EMAIL` to **your own ChatGPT sign-in email**, not `seedy@sites.test`.

## Billing pages

- `/billing/setup` is for the billing owner only (`BILLING_ADMIN_EMAIL`). Everyone else, signed in or not, gets "page not found", and `/api/billing` sends them only checkout state (open or not, their own plan). Setup checklists and configuration go to the owner only, and never include values.
- The Membership page shows plans and checkout state only. Until checkout is open it says "Paid checkout is not open yet" and collects nothing.
- Test mode (`rzp_test_` key) is always owner-only. Customers can pay only when an `rzp_live_` key, `BILLING_LIVE_ENABLED=true` and `BILLING_PUBLIC_CHECKOUT=true` are all set. A live key is never treated as a test key.

## Hosting setup still to do (in Sites, not in this ZIP)

1. Publish through OpenAI Sites (project in `.openai/hosting.json`) and connect the `whatslearn.in` domain there, if it is not already.
2. Keep the Site public (see above).
3. Apply the migrations `drizzle/0000` … `0006` to the production D1 database (Sites applies `dist/.openai/drizzle` on publish; confirm in its dashboard).
4. Add secrets in Sites' protected environment settings, by name: `BILLING_ADMIN_EMAIL` (your email), and only when you are ready, the Razorpay, AI and WhatsApp names from `.env.example`.
5. Keep `BILLING_LIVE_ENABLED` and `BILLING_PUBLIC_CHECKOUT` empty until you have finished test-mode checks.
6. After publishing, check: signed out, `/api/work` returns 401; signing in returns you to the page; `/settings` shows your account; sign out works.

## Update in v37
Sign-in and sign-out links now go through WhatsLearn's own `/signin` and `/signout` pages, which hand over to the host and explain clearly when the host has no ChatGPT sign-in. See `docs/sign-in-hosting.md` for which method works on which host and what a real email/password login would need.
