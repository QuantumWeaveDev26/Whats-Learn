# Google sign-in

Google uses the existing Supabase Auth accounts and the same private session cookies as email sign-in. A new learner goes through the existing seven-question setup; an existing learner resumes their requested page. No Google password or Google client secret is collected by the website.

## Provider setup

1. In Supabase, open Authentication → Sign In / Providers → Google. Enable Google and enter the OAuth client ID and secret from your Google Cloud web application there. Keep the secret out of chats and source code.
2. In Google Cloud, use the callback URL shown by Supabase as the authorised redirect URI. This is the Supabase `/auth/v1/callback` URL, not the WhatsLearn callback.
3. In Supabase Authentication → URL Configuration, keep the Site URL as `https://whatslearn.in` and allow `https://whatslearn.in/auth/google/callback**`. The suffix permits the per-attempt state query. The development equivalent must remain loopback-only.
4. Save the provider settings. Open `/api/auth/providers` on WhatsLearn: `google: true` means the provider reports Google enabled. It does not prove the Google Cloud client or consent screen is correctly configured.
5. Use your own Google account to complete a real sign-in, then check Settings, My Journey, sign-out and return. Confirm a second account cannot see the first learner's work. An OAuth app restricted to test users must be published in Google Cloud before offering sign-in to the public.

The Google button appears on both sign-in and sign-up only when the provider reports Google enabled. Email sign-in remains available. The server uses a random PKCE verifier in an HttpOnly, SameSite cookie, a SHA-256 challenge, a ten-minute expiry, callback state validation and safe return paths. Tokens are stored in the existing HttpOnly session cookies, never localStorage. Provider errors are replaced by short, fixed messages. Sign-out clears pending Google attempts.

Google-only accounts are offered the support-assisted account deletion process, rather than being asked for a website password they have not set. Adding Google does not change course access, grading or payment rules.

References: [Supabase Google sign-in](https://supabase.com/docs/guides/auth/social-login/auth-google), [PKCE sessions](https://supabase.com/docs/guides/auth/sessions/pkce-flow), [provider code exchange](https://github.com/supabase/auth-js/blob/master/src/GoTrueClient.ts).
