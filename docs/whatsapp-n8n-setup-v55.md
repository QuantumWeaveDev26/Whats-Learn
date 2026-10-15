# WhatsApp learning flow with n8n (v55, one merged workflow): setup guide

Built on v54 (v54 on v53, v53 on v52, v52 on v51, v51 on v50, v50 on v49). In v51 the three n8n workflows are merged into ONE: `n8n/workflows/whatslearn-all-in-one.json`. The backend is unchanged from v50. Nothing in this package is installed, running or connected to real WhatsApp or OpenAI.

## I cannot edit server settings: the short path

You can do everything for the Meta check from the n8n screens.
1. Import `whatslearn-all-in-one.json` in n8n (Workflows, menu, Import from file). From v55 you never need to change any n8n server setting.
2. Open the node **My Settings (edit here)**. In `verifyToken` type a long random token you invent (16+ characters). Click away to save it. Leave the other four `PASTE...` lines for later.
3. Open the node **Meta Webhook GET (verify)**, click **Test URL**, copy it, click **Listen for test event**.
4. In Meta, Webhooks, put that Test URL as Callback URL and the same token as Verify token, click **Verify and save** within about 2 minutes.
5. Success: n8n shows the request and Meta accepts.
6. Now make messages work, all inside n8n and Meta screens, in this order:
   a. In node **My Settings (edit here)** fill the other four lines (`appSecret`, `baseUrl`, `bridgeSecret`, `phoneNumberId`). Where to find each is in "Where to find the Meta values" below. Click away to save.
   b. Create the credential `Meta WhatsApp token (Header Auth)` (section 2, item 4) and pick it in the six send nodes.
   c. Switch the workflow to **Active** (toggle at top right of the workflow).
   d. In Meta, Configuration, Webhook, **Edit**: change the Callback URL to the Production URL `<your n8n address>/webhook/whatslearn-whatsapp` (your n8n address is the start of the address bar, for example `https://n8n.example.com`), same token, **Verify and save**.
   e. Under Webhook fields, **Subscribe** to `messages`.

## Where to find the Meta values

Meta screen names move now and then; the words below are the current ones.
- **appSecret**: go to `developers.facebook.com`, **My Apps**, open your app. Left menu: **App settings**, then **Basic**. Row **App secret**, click **Show** (Meta asks for your Facebook password), copy it. Paste it only into `appSecret` in n8n and `WHATSAPP_APP_SECRET` on the website. Never in chat.
- **phoneNumberId**: same app, left menu **WhatsApp**, then **API Setup**. In the box **Send and receive messages**, choose your number in the **From** list. Under it Meta shows **Phone number ID** (a long number of about 15 digits). Copy that one, not the phone number itself and not the "WhatsApp Business Account ID".
- **Webhook page**: same app, left menu **WhatsApp**, then **Configuration**. Block **Webhook**, button **Edit**. Callback URL and Verify token go there. Below it, **Webhook fields**, **Manage**, tick/subscribe **messages**.
- **Access token** for the Header Auth credential: Meta Business Settings (`business.facebook.com/settings`), **Users**, **System users**, create one, **Generate token**, pick your app, tick `whatsapp_business_messaging` and `whatsapp_business_management`. (The temporary token on API Setup works for a day only.)

If Meta says it could not validate: the Callback URL is the production one but the workflow is not active (use the Test URL for the first check), the token differs by even one character, or the token is under 16 characters or still says `PASTE`.

## Using one Meta app or number for two workflows

Meta lets an app have **one** webhook Callback URL per product. If another workflow (for example the APPU mentor) already receives messages from the same WhatsApp number or app, the callback URL cannot point at both. Best: give WhatsLearn its own WhatsApp number (its own phone number ID) and, if Meta requires it, its own app. If you must share one number, one workflow has to receive everything and route by sender; that is not built here.

## What exists

| Item | State |
|---|---|
| Backend code (bridge API, linking, drafts, reminders, notices) | In this ZIP. Not deployed. |
| Migration `drizzle/0011_whatsapp_bridge.sql` | In this ZIP. **Not applied anywhere.** Apply after 0010. |
| 1 merged n8n workflow JSON, `n8n/workflows/whatslearn-all-in-one.json` | File, ready to import. Three entry points on one canvas: Meta webhook (chat), every 2 minutes (website sync), hourly at :07 (reminders). |
| n8n draft of the merged workflow in the owner's workspace | Inactive draft only. Never activated or published. The three older v50 drafts are still there, untouched; delete them when you like. |
| Real Meta, OpenAI, n8n runs | None happened. |

## How it works

- The website database is the single source of truth. n8n never computes points, unlocks or streaks.
- WhatsApp text arrives at n8n the chat section. n8n checks Meta's signature, signs the request with a shared secret, and calls `POST /api/bridge/whatsapp/message` on WhatsLearn. WhatsLearn checks Meta's signature again, checks the signed request (5 minute window, one-time nonce), and runs the same functions the website uses (`lockFor`, `precheck`, `saveMissionWork`, `recordClue`, `attemptCheckpoint`).
- Replies come back as `reply`, `tutor` or `none`. For `tutor`, n8n asks OpenAI using only the approved course material that WhatsLearn sends (no answer keys), 90 words at most.
- A learner is matched only when their number is **linked and verified**: the website shows a one-time code, the learner sends `LINK <code>` from that number.
- Workflow 2 (every 2 minutes) claims website events (mission saved, badge earned) for linked, opted-in learners and sends one short notice, then reports back. Duplicates are blocked by a unique key.
- Workflow 3 (hourly) claims due reminders. WhatsLearn decides who is due: opted in, chosen hour and frequency in India time, outside quiet hours, not already done today, once per day. Inside the 24 hour window it sends text; outside it only an approved template.
- WhatsApp commands: START, COURSE, TODAY, HINT, SUBMIT, HELP, STOP (plus LINK, CANCEL, EDIT n, CHECK, POINTS, REMIND, ASK). Missions are answered step by step and saved only after SUBMIT passes the relevance and eligibility checks. A refused attempt saves nothing and can be retried.
- STOP is permanent until the learner sends START. It turns reminders off.

## Owner steps

### 1. Hosting (WhatsLearn)
1. Apply `drizzle/0010_checkpoint_clears.sql` (if not yet) and then `drizzle/0011_whatsapp_bridge.sql` to the hosted database. Take a backup first.
2. Set in the protected environment (names only, never in the ZIP):
   - `N8N_BRIDGE_SECRET` (32+ random characters; same value as `WHATSLEARN_BRIDGE_SECRET` in n8n)
   - `WHATSAPP_APP_SECRET` (Meta app secret, same as in n8n)
   - `WHATSAPP_REMINDER_TEMPLATE` and `WHATSAPP_TEMPLATE_LANGUAGE` (after Meta approves the template)
   - `SITE_URL`, as for earlier versions
3. The tutor key (`OpenAI`) is **not** needed on the website; n8n holds it.
4. Deploy only when you decide to.

### 2. n8n
1. Settings the workflow needs (five values). From v53 you can type them inside n8n in the node **My Settings (edit here)** (no server access needed), or set them as server environment variables. If both exist, the server variable wins.

| What | Node field (n8n screen) | Server variable (optional) | Rule |
|---|---|---|---|
| Meta verify token | `verifyToken` | `WHATSAPP_VERIFY_TOKEN` | you invent it, 16+ characters, same in Meta |
| Meta app secret | `appSecret` | `WHATSAPP_APP_SECRET` | from Meta, App settings, Basic |
| Website address | `baseUrl` | `WHATSLEARN_BASE_URL` | `https://...`, no slash at the end |
| Bridge secret | `bridgeSecret` | `WHATSLEARN_BRIDGE_SECRET` | 32+ random characters, same as `N8N_BRIDGE_SECRET` on the website |
| WhatsApp phone number ID | `phoneNumberId` | `WHATSAPP_PHONE_NUMBER_ID` | from Meta, API Setup (an ID, not the phone number) |

   Anything still saying `PASTE...` counts as not set, and the verification refuses it.

2. No server-only settings are needed from v55. Signing and the Meta signature check now run inside the Code nodes themselves (built-in HMAC-SHA256), so `NODE_FUNCTION_ALLOW_BUILTIN=crypto` is no longer required, and `N8N_BLOCK_ENV_ACCESS_IN_NODE` was not needed since v53. If your host already set them, nothing breaks.
3. Secrets typed into the node are saved inside the workflow in n8n. Do not export, share or screenshot the workflow after filling them in.
4. Credentials (create in n8n, never in chat):
   - `Meta WhatsApp token (Header Auth)`: in n8n, Credentials, Create, choose **Header Auth**. Name: `Meta WhatsApp token (Header Auth)`. Header name: `Authorization`. Value: `Bearer ` followed by your Meta access token (a permanent system-user token is best). From v54 all six send nodes call Meta's Graph API directly with this one credential. The token is never in the workflow file or in the URL. The old "WhatsApp API" credential is no longer used.
   - `OpenAI (WhatsLearn tutor)` (type OpenAI API)
5. Import `n8n/workflows/whatslearn-all-in-one.json` (one file, one workflow; sticky-note section labels are in the file, the n8n draft has none). Attach the two credentials to the WhatsApp and OpenAI nodes. Check each workflow's settings: execution data saving is "none" so message text is not stored.
6. The six send nodes (`Send Reply`, `Send Tutor Reply`, `Send Try Again Notice`, `Send Notice`, `Send Approved Template`, `Send Free Text (inside 24h window)`) ask for the credential `Meta WhatsApp token (Header Auth)`. Open each once and pick it if n8n shows a red mark.
7. Keep the workflow inactive until section 4 is done. Note: activating it turns on all three parts at once (chat, sync every 2 minutes, hourly reminders); the schedules only act on learners who linked and opted in.

### 3. Meta
1. Meta app with the WhatsApp product and a test number first.
2. Webhook callback URL: `<your n8n address>/webhook/whatslearn-whatsapp` (the Production URL on either Meta webhook node; both end in the same path). Do not save it in Meta until you have done the section "Meta webhook verification" below. Verify token: exactly the value of the n8n variable `WHATSAPP_VERIFY_TOKEN`. Subscribe to `messages` only after the verification succeeded.
3. Create a reminder template (category Utility), name matching `WHATSAPP_REMINDER_TEMPLATE`, with exactly one body variable `{{1}}` = mission title, for example: "Your WhatsLearn mission is ready: {{1}}. Reply TODAY to start, STOP to stop reminders." Wait for approval. Without it, reminders outside the 24 hour window are skipped (not sent).
4. Learners must opt in on the website (Settings, WhatsApp) before any message is sent.

### 3b. Meta webhook verification (read before saving the URL in Meta)

The workflow has two webhook nodes on the same path `whatslearn-whatsapp`: `Meta Webhook GET (verify)` answers Meta's check, and `Meta Webhook POST (messages)` receives messages. v52 uses two nodes because the single multi-method node did not import reliably (one n8n showed only POST, so Meta's GET check could never succeed).

How Meta's check works: Meta sends a GET with `hub.mode=subscribe`, `hub.verify_token` and `hub.challenge`. The workflow replies HTTP 200 with the challenge as plain text only when the token equals the n8n variable `WHATSAPP_VERIFY_TOKEN`; otherwise HTTP 403. The token is never stored in the JSON.

Before you start:
1. Pick a long random verify token (at least 16 characters, for example 32 random letters and digits). A short or easy token, and any token that was shown in a chat or screenshot, must not be used: choose a new one. The workflow refuses tokens under 16 characters even if Meta sends the same one.
2. Set the same value in two places: the field `verifyToken` in the n8n node **My Settings (edit here)** (or the server variable `WHATSAPP_VERIFY_TOKEN`), and the "Verify token" box in Meta. Do not paste it anywhere else.
3. Nothing else is needed on the server for the verification step.

Verify before activating (Test URL):
1. Open the workflow in n8n, open node `Meta Webhook GET (verify)`, click **Test URL** and copy it (it contains `/webhook-test/`). Click **Listen for test event**.
2. In Meta, paste that Test URL as Callback URL, type the verify token, click **Verify and save** within about two minutes. n8n shows the incoming GET and the node `Answer Challenge` runs. The Test URL listens for one request only; click Listen again to retry.

Then use the Production URL (needs an active workflow):
1. The Production URL (`/webhook/whatslearn-whatsapp`) exists only while the workflow is **active**. An inactive workflow answers 404, so Meta says "callback URL or verify token couldn't be validated".
2. Activating also starts the sync (every 2 minutes) and the reminders (hourly at :07). Before you activate, set every env variable and credential in section 2, or those parts will fail. Only learners who linked and opted in are ever messaged.
3. After activating, change the Callback URL in Meta to the Production URL (no `/webhook-test/`), keep the same token, click **Verify and save**.
4. Then, in Meta's webhook fields, subscribe to **messages** (and nothing else is needed).

If the URL still does not validate: open the node's Production URL in a browser with `?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=1` added. You should see `Forbidden` (403). 404 means the workflow is inactive or the path differs. Do not test with your real token in a browser.

Draft vs import: the n8n draft created by the assistant gets an automatic id inside its webhook URLs (`/webhook/<id>/whatslearn-whatsapp`) and the two nodes get different ids, so Meta cannot use it. Use the imported JSON file: importing it gives the plain path.

### 4. Safe testing order
1. Run `node tests/whatsapp-bridge.cjs` (mocks only).
2. Verify the webhook as in section 3b. Meta test number, your own phone only, workflows manually executed, then activate. To try the parts separately, disable the schedule nodes `Every 2 Minutes` and `Hourly At 7 Past` first.
3. Link your own number from the website, send `TODAY`, `HINT`, finish a mission, check the website shows the same points and clues.
4. Send `STOP` and confirm no notice or reminder arrives.

## Linking
Website Settings, WhatsApp: enter the number, get a code shown once (valid 30 minutes, limited wrong tries). Send `LINK <code>` from that number. A number verified on another account cannot be claimed. Old unverified links from earlier versions are ignored until re-linked.

## Privacy
Message text is not stored by WhatsLearn except the unfinished mission draft (deleted on submit, CANCEL or after 24 hours). No message text is logged by the bridge code. Tutor use is limited to 30 questions per learner per day.
