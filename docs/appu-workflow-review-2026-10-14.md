# Review of the existing n8n workflow "APPU Mentor - LATENCY STAGING - 2026-08-29" (read-only)

Read through the n8n connector on 2026-10-14. Nothing was changed, run, published or moved. 105 nodes, 12 triggers, active. This file contains no secrets, tokens or phone numbers; the workflow itself does (see problems).

## How it integrates WhatsApp
- **Inbound:** one Webhook node (path `whatsapp-inbound`, method POST, named "Verification (GET)"). Meta's POST goes two ways at once: `Respond to Meta Challenge` (answers with `hub.challenge`) and `Is Valid Incoming User Message` -> `Extract Incoming Phone & Message` (takes only the first message) -> a block-list filter -> `Normalize WhatsApp Input`.
- **Backend:** `Normalize WhatsApp Input` calls the APPU backend with an HMAC-SHA256 signed request (`timestamp.body`, header `v1=...`, secret from an n8n environment variable) to fetch learner context and onboarding state; any failure falls back to guest mode.
- **AI:** one OpenAI agent ("APPU Mentor") with memory, tool nodes (NCERT knowledge, weekly digest, study schedule, onboarding, feedback, child report) and an optional ElevenLabs voice step. The answer goes back through a block-list filter to a Graph API HTTP node.
- **Outbound:** about ten HTTP Request nodes to `graph.facebook.com/v20.0/<phone number id>/messages` (reply, template, weekly digest, daily tip, birthday, study reminder, child session alert, email digest, form alert). Reminders run on schedule triggers (15-minute study reminders, daily, weekly).
- **Website side:** the website webhook and the template-send webhook verify an HMAC signature with a 5-minute freshness window (good).
- **State:** n8n Data Tables and Google Sheets (leads, email digest checkpoint). Error handling: only the agent and the website signature check have an error output; failure callbacks are signed.

## Problems and risks
1. **A Meta access token is written in clear text in 10 nodes** (as `?access_token=` in the URL, so it can also appear in execution data and logs). Also a 64-character secret is written inside the "Form Alerts" Code node. Treat both as exposed: rotate them in Meta/your form script, move the token into an n8n Credential (Header Auth), and remove it from every node. (Not copied anywhere here.)
2. **Meta verification cannot work:** the node named "Verification (GET)" only accepts POST, so Meta's GET never arrives; `Respond to Meta Challenge` also runs on every POST and answers with an empty body. Same class of bug we had.
3. **No Meta signature check** (`X-Hub-Signature-256`) on the WhatsApp webhook: anyone who knows the URL can post fake messages. The website and template webhooks do verify signatures; WhatsApp does not.
4. **No duplicate protection** by WhatsApp message id: Meta retries can create double replies.
5. **Only the first message** of a webhook batch is processed; the rest are dropped.
6. **Personal phone numbers are hard-coded** in several nodes (owner filter, block lists, form alert target). Move them to settings; they are personal data.
7. **Privacy:** execution data is saved for every run (`saveDataSuccessExecution: all`), so message contents and phone numbers stay in n8n's history.
8. **No STOP/opt-in handling** found for WhatsApp reminders and promotional messages (daily tip, birthday, digests); no quiet hours.
9. **Webhook ids in URLs** (`/webhook/<id>/...`) change if the node is recreated; the name "Verification (GET)" is misleading.
10. Staging name and a single 105-node workflow make it hard to test; email-report, form-alerts and lead capture are unrelated to WhatsApp mentoring.

## What it does well
- Signed requests with timestamp window to the website/backend (same idea as ours).
- Graph API HTTP nodes: simple, no extra n8n credential type (but the token must move to a credential).
- Guest-mode fallback when the backend is unreachable.
- Caption and button text extraction for several message types.
- Reply truncation to 3800 characters.

## Comparison with WhatsLearn v54

| Topic | APPU workflow | WhatsLearn v54 |
|---|---|---|
| Meta GET verification | broken (POST only) | separate GET node, token check, 200 / 403 |
| Meta POST signature | none | checked in n8n and again in the website |
| Duplicate messages | none | by message id in the website database |
| Messages per webhook | first only | all |
| Account matching | by phone | only a verified `LINK` code |
| Opt-in / STOP / quiet hours | none found | STOP persists, opt-in reminders, India time, quiet hours |
| Scoring and rules | in the AI tools | only in the website backend; n8n never scores |
| Meta token | in 10 nodes, in URLs | in one n8n credential (Header Auth) |
| Sending | Graph API HTTP | Graph API HTTP (adopted in v54) |
| Backend signing | HMAC `timestamp.body` | HMAC with nonce, 5-minute window, replay protection |
| Stored data | all executions saved | none saved |
