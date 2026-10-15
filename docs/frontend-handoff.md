# WhatsLearn frontend handoff

This increment extends the existing brand and learner flow. No new backend services, account registration or payment collection are implemented.

## Entry points
- `/signup`: first name and personal path preview; existing ChatGPT sign-in remains available. The local flow does not create an account. Add verified email/mobile registration here.
- `/settings`: goal, programme, level, language, time, guidance preference, starting format, celebration and reminder preferences. Device-local state under `whatslearn-preferences` and existing `whatslearn-profile`.
- `/membership`: Explore / Plus / Pro / Teams, monthly/annual selection, plan summary and local preference save. Prices deliberately unconfigured. No charge, entitlement or subscription is created.
- `/learn`: existing activities retained, reason for next mission and manual challenge overrides added. Challenge format begins with practice; story/example formats open the existing scenario and worked example. These are rules, not AI inference.

## Backend contracts to implement
Account: verified identity, consent, account export/deletion, preference sync and guest-work import with explicit choice. Never use browser preferences as identity.
Personalisation: versioned profile + preferences; assessment evidence and rubric version; next mission with reason, difficulty, language and outcome. Honour user overrides. Existing three-language lessons are authored; additional languages and audio are preference requests only.
Billing: central server-owned product/price catalogue; create hosted checkout session from authenticated plan/cycle; return redirect URL. Verify signed gateway webhooks, idempotency and subscription lifecycle. Entitlements must be server-authoritative. Add tax totals, renewal and cancellation terms before enabling checkout. No card data belongs in this app. Replace the preview save action only once the gateway and confirmed prices exist. Keep gateway provider replaceable.
Reminders: explicit channel opt-in, timezone, schedule, quiet hours, unsubscribe; current switch sends nothing.

## Context and adaptation loop
Use stable programme aims, outcomes and rubric as shared cached context. Send only the active learner profile, relevant evidence summary, current mission and latest attempt. Retrieve the smallest relevant content slice; cap history and summarise older attempts. Produce structured feedback and next-step reason. Validate against the rubric, update evidence, then select review or advancement. Track latency, tokens, content versions and learner override; avoid regenerating entire courses or homepages on each request. Schedule source updates separately from learner sessions and preserve validated outcomes.

## Language and fun learning
Current authored lessons: English, Kannada, Hindi. Responses support Unicode. Extra language/voice delivery is not yet live. Implement translation with glossary and quality checks, bilingual toggles, captions and optional voice. Preserve challenge XP deduplication. Competitions, mentoring and advanced paid-tier features are planned, not active entitlements.

## Visual-first launch update — 25 September 2026
- Home opens with VisualStart: bilingual-capable English/Kannada/Hindi prepared challenge, A/B choice, hint, written creation and local save. This is prepared feedback, not AI assessment.
- Warm-up storage: whatslearn-visual-warmup {body, choice, language, updatedAt}. Separate from assessed mission progress; no mission XP is awarded. Integrate into authenticated portfolio after validation in the backend.
- Prices in INR, tax-inclusive: Explore 0; sprint 149 one-time; Plus 499 monthly / 4999 annual; Pro 999 monthly / 9999 annual; Teams 399 per seat monthly, minimum five. Teams annual is not offered.
- Plus/Teams four sprints/month with two feedback rounds/sprint; Pro eight with five rounds. Sprint seven-day access with two rounds. Annual allowances reset monthly. Preserve finished creations; expire unused monthly allowances. Enforce entitlements server-side.
- First sprint purchase credited toward first monthly Plus/Pro purchase within seven days. Server must verify eligibility and apply credit once; never trust client pricing or local preferences.
- Checkout is preference-only, no payment collection. Implement gateway order creation, verified webhooks, tax invoices, renewals/cancellation and idempotent fulfilment before enabling purchases.
- Live WhatsApp delivery, AI assessment, wider languages and teams dashboards remain backend work. Do not interpret frontend selections as completed purchases or WhatsApp opt-ins.
