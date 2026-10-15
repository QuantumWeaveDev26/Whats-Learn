# Sign-in, sign-out and which host supports what (v37, updated in v40)

## Short answer
- **Name, email and password accounts** (sign-up, email confirmation, sign-in, sign-out, forgot and reset password, account deletion) work when the site runs on a host you control **and** a managed sign-in provider is configured. v40 builds this with **Supabase Auth**. WhatsLearn never stores a password, never hashes one itself, and never logs one: the password goes straight from the form's server route to the provider.
- **OpenAI Sites hosting supports only "Sign in with ChatGPT".** Name, email and password accounts cannot be added on the Sites host: it owns the sign-in paths and tells the app who is signed in, and gives the app no way to run another login method. Nothing was faked there.
- The app decides which one to use from its settings, and **never shows a form that cannot work**. With no provider settings it is in *host mode* (ChatGPT sign-in on Sites; a plain explanation and guest mode elsewhere). With the provider settings it is in *email mode*.

## Which sign-in works where
| Where the app runs | Settings | Sign-in methods | Sign-out | Notes |
|---|---|---|---|---|
| OpenAI Sites hosting | none (leave `SUPABASE_*` empty) | ChatGPT sign-in only | Yes | The host owns `/signin-with-chatgpt`, `/signout-with-chatgpt`, `/callback`. WhatsLearn's `/signin` and `/signout` pages hand over to them. |
| Cloudflare Workers on your own account (recommended, see `docs/deployment-guide.md`) | `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SITE_URL` | Email and password. ChatGPT sign-in does not exist on this host and is not offered | Yes | Sessions are provider-verified HttpOnly cookies. The Sites headers are **ignored** in this mode, because anyone can send them off Sites. |
| Any other host with the same settings | same | Email and password | Yes | Needs a database (D1 or an equivalent port) and HTTPS. |
| Any host with no settings | none | None | n/a | Honest explanation page; guest mode continues. |
| Local preview (`node scripts/local-preview.mjs`) | none | Loopback-only test sign-in (`seedy@sites.test`) | Yes | For your own computer only. With the `SUPABASE_*` settings pointed at `scripts/fake-auth-provider.mjs` it exercises the whole email journey locally. That script is a test double, never a real provider. |
| Guest (any host) | n/a | None | n/a | Work and points stay on the device and are not securely saved or synced. |

## Email mode: what each page does
- `/signup`: name, email, password (10 to 72 characters; no phone number). The answer is the same whether or not the address already exists, so addresses cannot be discovered.
- `/verify-email`: asks the provider to send the confirmation link again.
- `/auth/confirm`: the page the emailed link opens. It shows one button; pressing it confirms the email (or opens the reset form) and signs the learner in. A button, not an automatic action, so mail-scanning software that "clicks" links cannot use up the one-time link.
- `/signin`: refuses an unconfirmed email with a clear message and a "send me a new link" button. Wrong email or password gives one generic message.
- `/forgot-password` and `/reset-password`: the link opens `/auth/confirm`, then the reset form. Expired or already-used links show a clear message with a way to ask for a new one.
- `/signout`: clears the session cookies even if the provider cannot be reached.
- Settings, "Delete my account": see the privacy page and `docs/deployment-guide.md`.
- Every page returns the learner to where they came from (`?return_to=`), accepted only for paths inside the site.

## Protections
Provider-recommended: one-way password hashing, session handling and its own rate limits are the provider's. In WhatsLearn on top: Origin check on every state-changing request (CSRF), JSON size limit, strict input validation, per-address and per-email attempt limits stored as hashes (table `auth_attempts`), generic answers for sign-up, forgot and resend, `__Host-` HttpOnly SameSite=Lax cookies on https, tokens never sent to page JavaScript, redirects never followed, an 8-second timeout on every provider call, and no password or token in any log.

## What was not changed
No live Site, domain, database or secret was touched. Sign-in on the Sites host still works exactly as before.
