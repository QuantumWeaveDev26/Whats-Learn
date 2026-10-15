# Sign-in and WhatsApp launch handover

## Included in this ZIP

- **Sign up / Sign in:** the website already contains real name, email and password forms, confirmation emails, password reset and sign out.
- **WhatsApp chat:** every **Talk to us on WhatsApp** button opens the WhatsLearn Business number configured in `lib/contact.ts`: `+91 91879 51536`.

## Make email sign-up work after deployment

The email form appears only when all three values below are added as protected Worker settings. Do not put them in the ZIP or browser code.

1. Create a Supabase project and in **Authentication → Providers → Email**, enable Email.
2. In the deployed Worker, set `SUPABASE_URL` to the project URL, `SUPABASE_PUBLISHABLE_KEY` to the publishable/anon key, and `SITE_URL` to your final `https://` website address.
3. In Supabase **Authentication → URL Configuration**, add `https://YOUR-DOMAIN/auth/confirm` as a redirect URL.
4. Deploy, then open `/signup`. Enter a name, email and password (10+ characters), open the confirmation email, then sign in and sign out.

`SUPABASE_SERVICE_ROLE_KEY` is optional and is only required for account deletion. Keep it as a Worker secret if used.

Without `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`, the site correctly uses its hosting sign-in mode and cannot accept a website email/password account.

## WhatsApp automation

The website button opens a direct Business WhatsApp chat. Automated replies, reminders and learning messages require the separate Meta/n8n workflow to have a valid permanent WhatsApp token and a successful live reply test.
