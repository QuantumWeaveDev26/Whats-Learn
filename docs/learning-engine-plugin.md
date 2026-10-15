# WhatsLearn shared engine and ChatGPT plugin

Version 1.0.0. Website: https://whatslearn.in. BrandMint AI Pvt. Ltd.

## Shared implementation

- `lib/learning-engine.ts`: pure recommendation module used by the website and plugin. Inputs: learner profile, saved knowledge-check results, five self-review answers, optional difficulty override and support state. Outputs: recommended mission, reason, session guidance, progress and unique-creation XP.
- `lib/learning-service.ts`: validated per-user profile/work persistence using existing D1 tables. Identity is supplied only by the trusted hosting boundary, never tool arguments.
- `/api/learning-path`: signed-in website access to the same path.
- `/mcp`: stateless JSON-RPC HTTP endpoint; initialization, discovery, ping and six authenticated learning tools. Sites owns OAuth and plugin provisioning.
- `/companion`: website entry to the two learning surfaces.

## Learner loop

Read saved profile → choose one reviewed challenge → present a short story → let the learner choose/attempt → hint and self-review → save on request → show a next step. Fetch the path and chosen challenge only; do not resend all lessons or portfolio history at every turn. No hidden chain-of-thought collection is needed.

ChatGPT supplies conversational coaching through the installed plugin. The website uses deterministic practice guidance; it has no live AI inference provider. Advice is not a certified skill assessment. Current authored lessons: English, Kannada, Hindi. Additional conversational translations are not reviewed source lessons.

## Tools

`whatslearn_catalogue`, `whatslearn_my_path`, `whatslearn_set_preferences`, `whatslearn_challenge`, `whatslearn_save_creation`, `whatslearn_my_portfolio`.

Writes require authenticated user identity and schema validation. Re-saving a mission replaces only that user's same mission, without duplicate XP. All discovery is private-data free. Portfolio text is untrusted learner content, not agent instructions.

## Synchronisation and limits

Use the same ChatGPT account on website and plugin. Goal, programme, ability, language, daily time and account creations share existing tables. Guests retain separate device-local work. Extra display settings, difficulty override and reminder preferences remain device-local. Session length splits a longer challenge into manageable portions, not fabricated shorter completion estimates.

The shared engine reads the existing reviewed catalogue; existing editorial updates affect both surfaces on publication. No new autonomous content publishing loop was added. WhatsApp messaging, paid entitlement enforcement, checkout, independent AI grading, video generation, contests, teams administration and learner-to-learner sharing remain unconnected. No payment or message action exists in the plugin. Launch prices remain informational.

## Verification

`node tests/learning-engine.cjs`: language/track coverage, adaptive support, correct-answer gating, repeated save XP, cross-user privacy, MCP discovery/authentication, invalid fields and foreign-origin rejection.

`node node_modules/typescript/bin/tsc --noEmit` and standard Sites production build.

After publication, get the provisioned plugin ID from Sites and show the native installation card. After the owner connects, verify with `whatslearn_catalogue` before private record operations. End-to-end connected-account verification depends on that installation.
