# WhatsLearn production runbook

Updated 22 October 2026. Older audit and deployment documents are historical snapshots.

## Deployment

- Repository: QuantumWeaveDev26/Whats-Learn. Hostinger deploys GitHub `main` automatically.
- The Node deployment uses the standalone server and persistent SQLite storage. Do not replace it with an ephemeral database or reset the data directory during release.
- Build with `npm run build`. Check TypeScript, the migration journal and non-payment regressions before pushing. Apply migrations through the existing startup migration mechanism; do not manually delete or recreate tables.
- Confirm the new `data-release` marker in live HTML and fetch the new assets. A successful Git push alone is not proof of deployment.
- Public crawler files live under `public/`. Account pages use noindex metadata; neither robots nor noindex replaces authorization.

## Website and WhatsApp

- Production n8n workflow: `pktkYZFWUH8gPBVN`. Public source templates in `n8n/workflows/` contain placeholders, never production credentials.
- Deploy compatible website changes before publishing workflow changes. Verify the active version and node parameters after publication.
- The Meta webhook acknowledges receipt before processing. Website calls have a 180-second timeout; a long synchronous review can still take time. Durable evaluation job/status delivery is a follow-up project, not implemented by this timeout change.
- Reminder eligibility is calculated on the website. The workflow polls every two minutes; claims, leases, dispatch authorization, opt-out checks and receipts remain authoritative. Never blindly resend an ambiguous accepted send.
- A reminder attempt is not proof of delivery. Outside the 24-hour service window, the selected-language template must be configured and approved by Meta. Do not substitute a different language.
- Customer messaging tests need an authorized recipient. Inspect status/readiness without running production schedulers manually.

## Accounts, age and context

- Personal setup is optional, one-time and account bound. Every POST requires the marker of the account that opened the form. A stale tab cannot submit another learner's answers.
- Declaring under 18 keeps only an age-range restriction for new setups. Account APIs treat the learner as a guest; onboarding redirects to `/age-policy`. WhatsApp linking and outbound dispatch are blocked. Previously stored work is retained; it is not silently deleted.
- This uses a self-declared age band, not independent age verification or guardian consent. Incorrect locked answers and deletion requests go through the published support email. Legal policy review is still pending.
- Website and linked WhatsApp share saved profile, course, language, accepted work and practical drafts. Conversation sharing is separately opt-in under Settings → Mentor continuity. It is bounded to two turns and seven days; channel context otherwise lasts 24 hours. Expired context is discarded when accessed. Clear/off controls do not delete completed work.
- Account facts override conversation context; context is never assessment evidence. n8n's old independent learner-memory connection is removed so it cannot override these controls.

## Languages and assessment

- Canonical question packs are built from 40 missions and all three starting levels. Validated coverage and explicit English fallbacks are recorded in `lib/question-translations/coverage.json`; incomplete or mixed-script drafts are withheld. Translations preserve option order, answer indices, field IDs, constraints and submitted choice values. Display wording never changes grading.
- Selected question/message packs load on demand in browsers. The server has all supported packs. Runtime AI translation is not needed to show a question or task.
- Newly generated translations are machine drafts requiring native-speaker review. The UI discloses this. Automated structure, numeral and script checks cannot prove translation quality.
- Only accepted, topic-relevant work can complete a mission. A draft or a successful sandbox process alone never proves correctness or grants completion.

## External service readiness

Use the owner-only `/admin/quality` readiness panel. Configured, deployed and verified are separate states.

- Staff alerts need `SUPPORT_ALERT_WEBHOOK_URL` and a token in hosting settings. Five queued opaque references can be dispatched per poll. The receiver must deduplicate event IDs. Endpoint acceptance does not prove a staff member read a request.
- Full apps/npm need the isolated service URL/token and an explicitly owner-approved daily run cap. The service uses Vercel Sandbox; Hostinger can continue hosting the website. Do not run learner code beside the production website or n8n.
- No new recipient or paid execution cap is selected by guessing. Do not expose environment values in logs or chat. Current tool access does not expose a Hostinger/Vercel management connection.
- Check scheduler pulses, queue counts and provider receipts. Never mark a connection tested solely because a URL or token exists.

## Acceptance checklist

- Return login and Google callback preserve destination; account switch clears old private UI.
- New adult setup locks once; under-18 setup becomes guest; protected APIs and queued WhatsApp dispatch enforce the restriction.
- One real-world task per course: valid work accepted, wrong/off-topic/imagined evidence rejected, duplicate save does not repeat points.
- Selected language remains authoritative on website and WhatsApp. Test all translated option order and field IDs before native review.
- Signed-in draft change on each channel appears on the other; conflicts require a choice.
- Desktop/mobile tour covers all steps, orientation changes and Settings targets on an authorized test account.
- A real reminder and a staff alert reach authorized test destinations; a sandbox run has approved spending limits.
- Payment and billing verification remain excluded from this release's test scope.

## Translation generation limit

The temporary, manual translation helper was archived after generation. Its hosted AI credential returned “no credits remaining”; no credits were purchased and no new key was created. Some Gujarati, Dogri, Bodo, Santali and Manipuri mission translations therefore remain explicit English fallbacks. Native review and the remaining translation work are still required. This does not establish the billing state of every separately configured website AI credential.
