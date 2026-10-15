# Owner checklist: test signup and email delivery

Use your own Supabase project and your own inbox. Never paste keys, passwords or email links into chat. The automated tests only used a stand-in provider, so none of this has been verified against real Supabase or real email.

1. Set `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` as secrets on the Worker (`wrangler secret put`), not in files you share.
2. Apply migrations 0000 to 0010 in order to your D1 database (see `deployment-guide.md`, section 6). Keep `STARTING_POINTS` unset (default 50).
3. In Supabase, set the "Confirm signup" email template link as described in `deployment-guide.md`, section 5, and set your SMTP sender.
4. Open the site in a private window. Sign up with an address you control.
5. Check the email arrives (also spam). Note how long it took.
6. Open the link, then press "Confirm my email".
7. Open My Journey. Expect 50 points straight away and the welcome message once.
8. Refresh, sign out, sign in again, and open the link a second time on another device. Expect still 50, no second welcome, and the old link refused.
9. In your D1 console, run: `SELECT kind, ref, delta FROM point_ledger WHERE user_id = '<your user id>';` Expect exactly one `starting` / `start` / `50` row (plus one zero-point `welcome_seen` row).
10. Try signing in with a wrong password and with an unconfirmed address. Expect a clear refusal and no points.
11. Clear the test account from Supabase afterwards.

If any step fails, send only the step number and the message on screen.
