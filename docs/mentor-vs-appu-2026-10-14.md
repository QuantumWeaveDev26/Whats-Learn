# WhatsLearn Mentor compared with the APPU Mentor workflow (read-only review, v56)

The APPU workflow was only read. Nothing in it was changed, run, copied or published. This file has no tokens, secrets or phone numbers.

| APPU part | What it does | WhatsLearn Mentor equivalent | State |
|---|---|---|---|
| Inbound webhook | one POST node, no signature check | GET verify node + POST node, Meta signature checked in n8n and again in the website, one item per message | better |
| Dedupe | none | by WhatsApp message id in the website database | better |
| Account match | by phone number | verified `LINK <code>` only | better |
| AI mentor reply | one OpenAI agent with tools | OpenAI used only as a tutor on approved course text from the website (no answer key, 90 words, no outside links) | different on purpose |
| Latency trick | none seen | read receipt + typing indicator sent before the website is asked (v56, node `Show Typing`) | added in v56 |
| Fallback | guest mode when backend is down | "Sorry, I could not reach WhatsLearn just now" notice; tutor errors send WhatsLearn's own fallback text | same idea |
| Memory / state | n8n memory, data tables, sheets | the website database holds progress, drafts (deleted on submit), points; n8n stores nothing and saves no execution data | on purpose |
| Tools (NCERT, digest, schedule, feedback) | AI tools | website commands (TODAY, HINT, SUBMIT, POINTS, REMIND, ASK ...) that run the same functions as the site | on purpose |
| Reminders | schedules, no STOP or quiet hours | hourly claim from the website: opt-in, India time, quiet hours, STOP, once per day, approved template outside 24 h | better |
| Voice reply | optional | not built | skipped |
| Meta token | in 10 nodes, in URLs | one n8n credential (Header Auth), never in a URL | better |

## Rules the mentor keeps
- The AI only coaches and explains. Points, unlocks, clues and the one-new-mission-per-India-day limit are decided only by the website. A clue costs points there; the AI never gives answers or clues for free.
- n8n never scores. Every action is a signed request (300 s window, one-time nonce).
- No secrets in nodes, files, logs or the ZIP. No execution data is saved.

## Honest limits
The mentor has no long chat memory by design (privacy, and no extra database). Follow-up questions work because each question is sent with the learner's current course and mission material.
