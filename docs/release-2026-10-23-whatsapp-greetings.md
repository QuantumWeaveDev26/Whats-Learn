# WhatsApp greeting repair — 23 October 2026

The learner reported that sending `Hi` produced an unsolicited paragraph about reviewing AI-generated booking code and checking user/price data on the server.

## Cause and repair

The n8n intent classifier could interpret a greeting as a general question or a request to resume a task. General questions are prefixed with `ASK`, so `Hi` became `ASK Hi` and bypassed the server's existing short greeting response.

- Added a deterministic greeting override before command mapping. Hi, Hello, Hey, Helo and common repeated-i variants use the server greeting, regardless of a classifier guess of question, learn, continue or answer.
- Requests such as `Hi, explain AI` still use normal question handling.
- Added an English greeting guard to the model fallback composer and explicit prompt guidance against introducing a mission after a hello.
- Existing consent, account-link requirements, language checks and task validation remain in place. A greeting neither changes the draft nor awards completion.

## Verification and publication

- 36 targeted synthetic checks passed, including the exact reported long reply and a greeting with an open backend task.
- Published n8n workflow `pktkYZFWUH8gPBVN`, active version `f7ec4785-292d-4190-a912-340a086bbeb6`.
- Read the published graph back and ran its actual resolver/composer with synthetic input: classifier guess `continue` plus `Hi` produced greeting / Hi; the fallback composer produced one short greeting with no course or code introduction.
- Live webhook still rejects invalid verification requests with HTTP 403.
- No outbound WhatsApp message was sent by the agent. The learner confirmed reply delivery after the earlier routing fix; reception of the new greeting remains for the learner to confirm.
