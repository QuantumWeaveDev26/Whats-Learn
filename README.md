# vinext-starter

A clean full-stack starter running on [vinext](https://github.com/cloudflare/vinext), with optional Cloudflare D1 and Drizzle support.

## WhatsLearn: install, run and go live

> **v40:** to run WhatsLearn as a regular website with name, email and password accounts, read `docs/deployment-guide.md` first (host, Supabase Auth setup, environment names, database, DNS, checklist, rollback). On OpenAI Sites only ChatGPT sign-in exists; see `docs/sign-in-hosting.md`.

### 1. Install and run on your computer

You need Node.js 22.13 or newer. On Windows, macOS or Linux:

```sh
corepack enable                 # turns on the pinned pnpm (11.25.0)
pnpm install --frozen-lockfile  # install dependencies
cp .env.example .env.local      # optional: only needed when you add keys (step 3)
pnpm dev                        # open http://localhost:5173
```

**Turning on AI feedback locally with your OpenAI key:** create a file named `.env.local` in the project folder (next to `package.json`) with these lines, using your real key in place of the placeholder:

```sh
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your-openai-key-here
# OPENAI_MODEL=gpt-4o-mini   # optional
```

Then stop and restart `pnpm dev`. `.env.local` is ignored by git (the `.gitignore` excludes every `.env*` file except `.env.example`), so the key is never committed; do not copy it into any other file, and leave it out when you zip the project. For the live site, add the same names in the hosting platform's protected environment (secret) settings instead of a file.

### 1a. Test account features locally on Windows (built preview with test sign-in)

`pnpm dev` and `pnpm start` both include a **test sign-in that only works on your own computer**. It signs you in as the made-up user `seedy@sites.test` (no password, email or phone number is asked for). It answers only requests to `127.0.0.1` or `localhost` from the same computer, and it is not part of the built site that gets published: on the live site, ChatGPT sign-in is handled by the hosting platform exactly as before.

In **PowerShell**, in the project folder (the one with `package.json`):

```powershell
corepack enable                      # once; if Windows refuses, run: npm install -g pnpm@11.25.0
pnpm install --frozen-lockfile
Copy-Item .env.example .env.local    # skip if you already have .env.local
notepad .env.local                   # add your TEST settings (see below), save, close
pnpm build                           # build the site (repeat after code changes)
pnpm db:local                        # create the local database tables (safe to run again)
pnpm start                           # open http://127.0.0.1:8787
```

Then press **Sign up / Sign in** on the site (or open `http://127.0.0.1:8787/signin-with-chatgpt?return_to=/learn`). You are signed in as `seedy@sites.test`, and `/api/work`, `/api/play` and `/api/profile` answer normally. **Sign out** works the same way. Stop the preview with `Ctrl+C`. `pnpm start:no-signin` starts the preview without the test sign-in; `pnpm start --port 8790` uses another port.

`pnpm start` reads `.env` and `.env.local` from the project folder and prints only which file it read, never values. Command Prompt (`cmd`) users: use `copy .env.example .env.local` instead of `Copy-Item`.

**Guest mode vs signed in.** Without signing in you can still play the home-page starter and the Learn missions: that progress (pieces, stars, coins) is saved in this browser on this device only. Signing in is needed to keep work in your account and to use AI review, WhatsApp lessons and membership checkout. The Learn page says which mode you are in.

**Razorpay TEST checkout locally** (no real money; live payments stay off unless `BILLING_LIVE_ENABLED=true` and an `rzp_live_` key are both set, which you should not do locally):

1. In Razorpay Dashboard, switch to **Test mode** → Account & Settings → **API keys** → generate a test key.
2. In `.env.local` (never in chat or source files) set `RAZORPAY_KEY_ID=rzp_test_...`, `RAZORPAY_KEY_SECRET=...`, `RAZORPAY_WEBHOOK_SECRET=` any long random text, and `BILLING_ADMIN_EMAIL=seedy@sites.test`. Leave `BILLING_LIVE_ENABLED` empty. Razorpay webhooks cannot reach your computer; local test payments are confirmed by Razorpay's signature instead.
3. Run `pnpm build`, `pnpm db:local`, `pnpm start`, and sign in.
4. Open `http://127.0.0.1:8787/billing/setup` (owner only: anyone else gets "page not found"). It lists anything still missing (keys, webhook secret, owner email, database tables, sign-in). Press **Create test plans** (reuses plans already created).
5. Open `/membership`, choose a plan and press **Open Razorpay test checkout**. Use Razorpay's test card, UPI or net-banking details from their docs. The ₹149 sprint is a one-time payment; memberships are subscriptions, where Razorpay offers cards, UPI Autopay and e-mandate if your test account supports them. Customers never see setup steps: until checkout is open they only read "Paid checkout is not open yet". If the test checkout button does not appear for you, check `/billing/setup`.

**Updates feed.** The "latest releases" box on the home page needs the local database (`pnpm db:local`) and internet access. In a local preview without them it shows "not available in this local preview" instead of an error; nothing else depends on it.

Mission points (v31/v32): `node --test tests/mission-points.cjs`. Course order, practical tasks, titles (v36): `node --test tests/progression.cjs`. See `docs/changes-v36-2026-10-12.md` (latest) and `docs/changes-v35-2026-10-12.md` for the daily limit, scoring and clues.

Other commands: `pnpm build` (production build), `pnpm start` (run the built site locally with test sign-in), `pnpm db:local` (local database tables), `npx tsc --noEmit -p .` (type check), `node --test tests/billing.cjs tests/whatsapp-ai.cjs tests/ai-provider.cjs tests/writing-check.cjs tests/contact-link.cjs tests/billing-setup.cjs tests/answer-relevance.cjs tests/local-signin.test.mjs tests/account-isolation.cjs tests/review-gate.cjs` (payment, WhatsApp and AI checks, all with fake responses; Node 22 prints an "SQLite is experimental" warning, which is harmless).

**Deploying:** (see also [docs/sign-in-hosting.md](docs/sign-in-hosting.md)) sign-in only works when the site is published through OpenAI Sites hosting. Read [docs/deployment-auth.md](docs/deployment-auth.md) before publishing anywhere.

### 2. Pages

Home `/`, My Journey `/learn` (My Creations: `/learn?view=portfolio`), Find my path `/find-my-path`, Membership `/membership`, Settings `/settings`, ChatGPT companion `/companion`, Sign up `/signup`, Payment setup (owner only) `/billing/setup`, Privacy `/privacy`, Terms `/terms`, Refunds and cancellation `/refunds`.

### 3. Keys and accounts (placeholders only; no real keys are included)

Put real values in `.env.local` for local testing, or in the hosting platform's protected environment settings for the live site. Never commit them. Everything stays switched off until its keys are present, and the site then behaves exactly as before.

```sh
# Razorpay: start with TEST keys from dashboard.razorpay.com (Test mode) → Settings → API keys
RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXXXX
RAZORPAY_KEY_SECRET=your-test-key-secret
RAZORPAY_WEBHOOK_SECRET=a-secret-you-choose-for-the-webhook
BILLING_ADMIN_EMAIL=you@example.com          # your ChatGPT sign-in email (can create plans)
BILLING_PUBLIC_CHECKOUT=                     # true = signed-in learners can pay, LIVE mode only (test mode is always owner-only)
BILLING_LIVE_ENABLED=                        # must be true before an rzp_live_ key works
RAZORPAY_SPRINT_CREDIT_OFFER_ID=             # optional ₹149 first-month offer (offer_XXXX)

# Live AI review: OpenAI OR Claude (set one key; with both, AI_PROVIDER picks)
AI_PROVIDER=openai                           # openai or claude ("anthropic" also works); leave empty to auto-detect
OPENAI_API_KEY=sk-your-openai-key-here       # platform.openai.com → API keys
OPENAI_MODEL=                                # optional, default gpt-4o-mini
ANTHROPIC_API_KEY=                           # console.anthropic.com → API keys (optional)
ANTHROPIC_MODEL=                             # optional, default claude-sonnet-5-5
AI_FEEDBACK_DAILY_LIMIT=                     # optional, default 3 per day (free)
AI_FEEDBACK_DAILY_LIMIT_PAID=                # optional, default 10 per day (paid)

# Meta WhatsApp Business (Cloud API): developers.facebook.com → your app → WhatsApp → API setup
WHATSAPP_TOKEN=EAAXXXXXXXX                   # permanent system-user token
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_APP_SECRET=your-meta-app-secret     # app → Settings → Basic
WHATSAPP_VERIFY_TOKEN=a-string-you-choose    # typed into Meta's webhook form too
WHATSAPP_BUSINESS_NUMBER=91XXXXXXXXXX        # digits only
WHATSAPP_REMINDER_TEMPLATE=learning_reminder # your approved template name
WHATSAPP_TEMPLATE_LANGUAGE=en
REMINDER_CRON_SECRET=a-long-random-string
SITE_URL=https://whatslearn.in
```

**Two kinds of WhatsApp.** The "Talk to us on WhatsApp" style links (home page, footer, Learn, Membership, Companion, project help, Refunds, Terms and the draft-translation notice) are plain click-to-chat links to `https://wa.me/919972965677` with a friendly prefilled message. They open in a new tab, need no keys or Meta tokens, and send nothing by themselves; the visitor presses Send. The number and default message live in `lib/contact.ts`. The automated lessons and reminders are separate and only work once the `WHATSAPP_*` Meta Business settings above are added.

Step-by-step setup for each service (webhook URLs, test card and UPI details, the reminder template text, the daily scheduler call) is in **[docs/go-live-setup.md](docs/go-live-setup.md)**.

ChatGPT companion: the public GPT link is set in `lib/companion.ts` (`companionInstallUrl`) and used by the "Open WhatsLearn in ChatGPT" button on the Companion page. Empty it to show "Request the installation card" instead.

### 4. Known limitations

- **Payments:** Teams buys access for the purchaser only; adding team members to seats is not built. GST invoices are not generated by the site. The refund points marked "Proposed" on `/refunds` need your decision. Only Razorpay test mode has been exercised (with fake responses in tests); do a full test-mode run with your own test keys before going live.
- **Stars and the quick writing check:** without an AI key, the site rates writing with a basic on-device check (length, topic, effort, copying). It cannot judge quality the way a person or AI can; the AI review gives detailed feedback when a key is set.
- **AI review:** works with OpenAI or Claude, whichever key you set; needs sign-in; daily limits apply. The OpenAI default model (`gpt-4o-mini`) may be retired by OpenAI over time; set `OPENAI_MODEL` to any current chat model if requests start failing. Feedback quality depends on the model and can be wrong; learners are told so.
- **WhatsApp:** needs Meta business verification and an approved template. The site has no built-in scheduler, so reminders need an outside daily call (see the setup guide). Learners link their number while signed in on the site; WhatsApp-only sign-up is not built. Replies are sent while the webhook request is open, so very slow AI answers may be retried by Meta (duplicates are ignored).
- **Languages:** English, Kannada and Hindi are human-written. The other 20 languages are machine-drafted, labelled "draft translation" in the app, and need native-speaker review (`lib/translations/<code>.ts`, `reviewed:false`). Confidence varies: Gujarati, Punjabi, Urdu, Tamil, Marathi, Bengali, Nepali and Sindhi read as reasonable drafts; Odia, Assamese, Konkani, Maithili, Kashmiri and Bodo need careful review; Dogri and Sanskrit use some invented technical terms; **Manipuri (Meitei Mayek) and Santali (Ol Chiki) were re-drafted in v30 (spelling, vocabulary and meaning fixes) but are still machine drafts and need a native speaker first**. To fall back to English guidance for any language, remove its code from `draftLessonLanguages` in `lib/languages.ts`. The starter agency story on the home page is still English for languages that did not have it before.
- **Policies:** Privacy, Terms and Refunds are drafts for legal review. Fill in the Grievance Officer's name in `/privacy`.
- **Wording:** a few sentences that say "coming soon" were kept as they are; the list to update when you switch features on is in `docs/go-live-setup.md` section 8.
- **Existing tests:** `tests/play.test.ts` and `tests/agency-story.test.ts` pass when run with the TypeScript loader: `node --import ./node_modules/.pnpm/tsx@4.22.1/node_modules/tsx/dist/esm/index.mjs --test tests/play.test.ts tests/agency-story.test.ts` (agency-story was updated for the 20 new lesson languages). `tests/learning-engine.cjs` already failed in the uploaded v19 ZIP (`db.batch is not a function` in its fake database) and still does; it was not changed.

## Prerequisites

- Node.js `>=22.13.0`
- Portable: Windows, macOS, or Linux; no Bash required
- Managed Linux: managed Linux runtime with Bash, `flock`, `curl`, `sha256sum`, and GNU `timeout`
- Git is required only for publishing

## Sites Lifecycle

The Sites initializer copies the shared starter and selects managed-linux only when `SITES_MANAGED_LINUX_CONTAINER=1`; otherwise it selects portable. It saves the selection only in ignored `.sites-runtime/execution-profile.json`. Both profiles copy/configure first, then use the plugin's separate `install-dependencies.mjs` step to measure installation independently. Edit source under `app/` and follow the Sites skill for installation, preview, builds, and publishing.

Whenever reopening or moving a checkout, run `node <plugin-root>/scripts/configure-execution-profile.mjs` before project commands. Profile changes do not alter tracked source or require reinstalling otherwise-valid dependencies; restart an existing preview to use the new selection. Do not commit or upload `.sites-runtime/`.

This starter does not use `wrangler.jsonc`.

`install:ci` runs `npm ci` once against the shared lockfile, disables parent-workspace discovery, and includes required dev/optional dependencies despite production/omit settings. Sharp defaults to prebuilt binaries unless explicitly configured otherwise. Do not overlap installers.

- **Portable:** Preserve host HOME, npm cache, registry, proxy, temporary paths, retry/concurrency settings, and lifecycle-script policy. Use `--prefer-offline --no-audit --no-fund`.
- **Managed Linux:** Use the existing project-local HOME/cache/tmp setup and Linux install lock, tarball preflight, and timeout. Restore the image-seeded npm cache only when its lockfile hash matches; retain network fallback. Builds keep their existing timeout. These helpers are not invoked by the portable profile.

`scripts/sites-env.mjs` preserves the caller's HOME, npm cache, proxy, XDG, and temporary-directory configuration while defaulting Wrangler and Miniflare state to the checkout. If npm reports an unwritable cache, select a writable path with `npm_config_cache` for that install. The `dev` and `start` scripts also keep Wrangler logs inside the checkout. Generated `.sites-runtime/` and `.wrangler/` directories are disposable and ignored by Git.

On portable, `npm run dev` uses `vinext dev` with HMR, starting at port 5173. Vinext records the running server in ignored `.vinext/` state, rejects an ordinary duplicate launch, and recovers stale state after a stopped process; exactly simultaneous starts can race. Pass `--port <port>` or `--hostname <host>` after `npm run dev --` when needed; keep portable previews on loopback.

For browser QA on managed Linux, use `sites-preview start`. The project's dev script runs Vite and accepts the supervisor's `--host 0.0.0.0 --port 4173 --strictPort` arguments. The internal browser uses `http://terminal.local:4173/`; it is not a user-facing URL. The supervisor owns the preview lifecycle. The ignored local profile survives the supervisor's cleared process environment.

The built preview (`pnpm start`) offers the same loopback-only test sign-in through `scripts/local-preview.mjs`; see section 1a. The portable profile simulates ChatGPT sign-in only for loopback development requests. Visit `/signin-with-chatgpt?return_to=/` to sign in as `local_seedy` (`seedy@sites.test`, display name `Seedy`) and `/signout-with-chatgpt?return_to=/` to sign out. The development cookie preserves that identity across server restarts. Mock auth is disabled in the managed-linux profile and is not included in production builds; hosted authentication remains dispatch-owned.

The Worker uses `vinext/server/fetch-handler`, including Vinext's config-aware image handling. After building, `npm start` runs that Worker locally through Wrangler on `127.0.0.1`, sharing `.wrangler/state` with dev preview and local D1 migrations; it does not deploy the site or simulate sign-in. Use the URL printed by the server. Pass `npm start -- --port <port>` to select a different built-preview port.

Local previews use Miniflare's placeholder `Request.cf` metadata without a network lookup. Set `CLOUDFLARE_CF_FETCH_ENABLED=true` to opt into fetching preview metadata; this setting does not change hosted request metadata.

Local tool usage metrics are disabled by default. Set `WRANGLER_SEND_METRICS=true` to opt in.

## Included Shape

- edit site code under `app/`
- `app/chatgpt-auth.ts` provides optional dispatch-owned ChatGPT sign-in helpers
- `.openai/hosting.json` declares optional Sites D1 and R2 bindings
- `vite.config.ts` simulates declared bindings for local development
- `db/index.ts` reads the D1 binding from the Cloudflare Worker environment
- `db/schema.ts` starts intentionally empty
- `@cloudflare/workers-types` provides Worker types; `cloudflare-env.d.ts` declares optional `DB`/`BUCKET` bindings—update these declarations if binding names change
- `examples/d1/` contains an optional D1 example surface
- `drizzle.config.ts` supports local migration generation when needed

## Workspace Auth Headers

Signed-in visitors receive both `oai-authenticated-user-id` and `oai-authenticated-user-email`. Private Sites require every visitor to sign in; public Sites may also have anonymous visitors, for whom neither header is present.

The user ID is stable for the same user on the same Site and different across Sites. Use it as the durable user key; use email and name for display or contact purposes.

SIWC-authenticated workspace sites may also receive `oai-authenticated-user-full-name` when the user's SIWC profile has a non-empty `name` claim. The full-name value is percent-encoded UTF-8 and is accompanied by `oai-authenticated-user-full-name-encoding: percent-encoded-utf-8`.

Treat the full name as optional and fall back to email when it is absent:

```tsx
import { headers } from "next/headers";

export default async function Home() {
  const requestHeaders = await headers();
  const userId = requestHeaders.get("oai-authenticated-user-id");
  const email = requestHeaders.get("oai-authenticated-user-email");
  const encodedFullName = requestHeaders.get("oai-authenticated-user-full-name");
  const fullName =
    encodedFullName &&
    requestHeaders.get("oai-authenticated-user-full-name-encoding") ===
      "percent-encoded-utf-8"
      ? decodeURIComponent(encodedFullName)
      : null;

  const displayName = fullName ?? email;
  // ...
}
```

## Optional Dispatch-Owned ChatGPT Sign-In

Import the ready-to-use helpers from `app/chatgpt-auth.ts` when the site needs optional or required ChatGPT sign-in:

- Use `getChatGPTUser()` for optional signed-in UI.
- Use the returned `userId` as the stable user key for user-owned records; do not use email as a durable identifier.
- Use `requireChatGPTUser(returnTo)` for server-rendered pages that should send anonymous visitors through Sign in with ChatGPT.
- In a Server Component, start sign-in with `<a href={chatGPTSignInPath(returnTo)} target="_top">`. The auth helper module is server-only; do not import it into a Client Component.
- Do not use `fetch`, XHR, a client-side router, or a framework link that can prefetch the sign-in route. SIWC must start as a top-level navigation.
- Never request the AuthAPI authorization endpoint directly. The dispatch-owned `/signin-with-chatgpt` route must start the SIWC flow.
- Use `chatGPTSignOutPath(returnTo)` for browser sign-out links or actions.
- Pass a same-origin relative `returnTo` path for the destination after sign-in or sign-out. The helper validates and safely encodes it.
- Mark protected pages with `export const dynamic = "force-dynamic"` because they depend on per-request identity headers.

Dispatch owns `/signin-with-chatgpt`, `/signout-with-chatgpt`, `/callback`, the OAuth cookies, and identity header injection. Do not implement app routes for those reserved paths. Routes that do not import and call the helper remain anonymous-compatible.

SIWC establishes identity only; it does not prove workspace membership. Use the Sites hosting platform's access policy controls for workspace-wide restrictions, or enforce explicit server-side membership or allowlist checks.

Use SIWC for account pages, user-specific dashboards, saved records, and write actions tied to the current ChatGPT user. Leave public content anonymous.

## Local D1 migrations

For a D1-backed local preview, generate SQL with `npm run db:generate`. Build once through the Sites skill's build entrypoint (or `npm run build` for standalone use) to generate `dist/server/wrangler.json`, rebuilding if bindings change. From the project root, run `pnpm db:local` (applies every pending migration once, in order), or apply each pending migration by hand:

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_example.sql
```

Replace the filename with the pending migration and `DB` with your D1 binding name if different. Use `.wrangler/state`, not `.wrangler/state/v3`; Wrangler adds the versioned directories. Do not replay migrations already applied locally. This updates only the preview database; publishing applies production migrations separately.

## Diagnostic Commands

- `npm run install:ci`: perform the one locked dependency install
- `npm run dev`: start the Vite/Vinext development server
- `npm run build`: build the deployable Sites artifact
- `npm run start`: preview the built Worker locally with D1/R2 support
- `npm run db:generate`: generate Drizzle migrations after schema changes

When using the Sites plugin, follow its skill instructions for installation, builds, and publishing. These npm commands remain available for standalone use.

The portable build runs Vinext directly without a host `timeout` command. The managed-linux build uses `scripts/build-verified.sh` and its existing `SITES_BUILD_TIMEOUT` setting.

## Learn More

- [vinext Documentation](https://github.com/cloudflare/vinext)
- [Drizzle D1 Guide](https://orm.drizzle.team/docs/get-started/d1-new)
