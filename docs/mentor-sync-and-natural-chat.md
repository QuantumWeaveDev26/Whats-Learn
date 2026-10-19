# Mentor account sync and natural chat

The linked WhatsApp mentor reads a signed PROFILE response before handling a message. It interprets the meaning of varied requests, then sends bounded commands to the website. Starting/resuming, final submission, course changes and progress use existing server functions. n8n never grades work or awards completion itself. Explicit STOP, account-link proofs and task submissions remain intact.

The website PROFILE response now includes an account-scoped context object: saved name, separate personal setup and journey choices, completed and pending missions across all four courses, reviewed learning skills, points, current draft metadata and reminder settings. It is loaded afresh for each request. Observed practice is not used to infer personality, mood or intelligence. Exact age bands, authentication details and phone numbers are excluded from AI context. One-time personal setup remains locked; journey settings remain editable.

Natural conversation is separated from assessed answers. The classifier can recognize paraphrases and multilingual requests; uncertain messages reach the tutor instead of becoming practical answers. Final saving still requires correct, relevant practical work and the existing server review. Accepted parts persist during a break. A website course change parks the former chat draft without deleting it. Unfinished web and chat drafts remain separate, as previously requested; saved progress is shared.

The teaching contract calls for short, warm replies using the saved name, one useful explanation and a small real-world example when helpful. It adapts to saved interests and learning style, stays calm under frustration, corrects mistaken prior replies and admits uncertainty. Provider failure can fall through to the n8n tutor with current account facts. A failed shortening call no longer discards a usable answer.

## Deployment status

The connected n8n workflow `pktkYZFWUH8gPBVN` was published on 19 October 2026 with the semantic routing and signed profile read. `n8n/workflows/whatslearn-mentor-connected.json` is its sanitized, inactive import template; credentials and private settings must be configured after import. The older all-in-one template remains available for its existing HTTP credential setup.

Deploy this website source to enable the expanded PROFILE context and backend changes. No new environment variable or migration is required. Reuse existing website and n8n credentials; do not import a duplicate active workflow over the already-published one. The existing Node build command is `npm run build`, with `dist/standalone/server.js` as its entry.

## Verification limits

Regression checks use synthetic learners and simulated provider responses. They cover account isolation, fresh choices and all-course progress, paraphrased actions, preserved drafts, correctness gates, language handling and fallbacks. The production build passed. A pinned n8n simulation succeeded with external HTTP, model and WhatsApp-send outputs simulated; no real WhatsApp message was sent. These checks do not establish actual model response quality, real Meta delivery or error-free answers to every possible question.
