# WhatsLearn Mentor (v56): short setup

Built on v55. The workflow `WhatsLearn Mentor (WhatsApp learning, sync and reminders)` already exists as an inactive draft in the n8n workspace "Quantumweave academy". The JSON file is the same workflow.

What was already done for you in n8n: all nodes wired, settings node created (`My Settings (edit here)`), Asia/Kolkata timezone, no execution data saved, the OpenAI node linked to the existing credential "OpenAI account". Nothing is published.

Only you can do (details in `whatsapp-n8n-setup-v55.md`, "Where to find the Meta values"):
1. Fill `appSecret`, `phoneNumberId`, `baseUrl`, `bridgeSecret`, `verifyToken` in `My Settings (edit here)`.
2. Create the credential `Meta WhatsApp token (Header Auth)` (header `Authorization`, value `Bearer <token>`) and pick it in the 7 Meta nodes.
3. Website: deploy, set `N8N_BRIDGE_SECRET` and `WHATSAPP_APP_SECRET`, apply migrations 0010 then 0011.
4. Reply "publish" in the project. Unpublish your old copy first (two workflows cannot share the path `whatslearn-whatsapp`).
5. In Meta, Callback URL = `<your n8n address>/webhook/whatslearn-whatsapp`, the same verify token, Verify and save, subscribe to `messages`.

Webhook URL: the connector shows ids in the URL (`/webhook/<id>/whatslearn-whatsapp`) and the two webhook nodes get different ids. n8n's own node help says an id is added to the path only for paths with `:`, so the plain path should work, but this could not be checked without publishing. If Meta's check fails, import the JSON file instead (it has no ids) and test with the Test URL first.
