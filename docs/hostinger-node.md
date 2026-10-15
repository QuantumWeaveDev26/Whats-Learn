# Hostinger Node deployment

Build with `pnpm run build`. Use `dist` as the output directory and the generated
`dist/standalone/server.js` as the entry file. Node 22.13 or newer is required.

The production Node build replaces Cloudflare environment bindings with Node
environment variables and a SQLite adapter. Existing points, missions, checkpoint,
billing and reminder SQL continues to use the same query interface.

SQLite defaults to `$HOME/.whatslearn/learning.sqlite`, outside Hostinger's versioned
deployment folders. Set `WHATSLEARN_DATA_DIR` to an absolute persistent directory
if your hosting layout requires another location. Back up that directory. Use one
Node application instance with this file; a multi-server deployment needs a shared
database instead. The bundled SQL migrations run once each, in transactions.

This creates a new database. Existing OpenAI Sites accounts and learning records
are not imported automatically.

For email accounts configure `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and
`SITE_URL=https://whatslearn.in` in Hostinger and redeploy. Configure the matching
Supabase redirect URLs. Without these credentials, guests can browse but cannot
create an account. Node hosting never trusts OpenAI identity headers from visitors.

Razorpay, AI and n8n still require their settings from `.env.example`. The public
WhatsApp contact link and custom GPT link need no API token. Private file uploads
remain disabled on Node until private object storage is configured; an R2 binding
is not available on Hostinger.

For an existing Cloudflare deployment set `WHATSLEARN_RUNTIME=cloudflare` during
the build to keep the Cloudflare Vite plugin and bindings.
