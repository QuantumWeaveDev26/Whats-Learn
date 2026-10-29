# App learning and offline play

The user approved adding the previously suggested learning improvements and specifically requested an offline Dino game. Existing authorization delegates routine design choices and limits changes to `/app`. Keep the green identity, compact mobile layouts, and all existing course access and scoring rules.

## Approach

Use the existing React app for course recommendations, feedback and a deterministic client mission. Use a self-contained, public HTML Dino game for both an optional in-app break and offline navigation fallback. This avoids a new dependency and allows offline reload without storing authenticated HTML. A React-only runner would disappear on reload; caching the signed-in app shell would risk retaining account data. The builder chooses the static public fallback.

## Behavior

- Feature a game from the learner's selected course; offer course filters and all games. Weekly tournaments retain their existing shared game.
- Keep one main Home Continue action, with task purpose and time.
- Add an optional café client mission: brief, audience decision and consequences, short advert, client revision, explicit completion checklist. Local account-scoped draft, no AI calls or claims of real customer outcomes. Practice only; no course credit.
- Ordering games explain why the sequence works and allow an unscored retry without inflating the first-attempt score. Label Story Dice scores as completion checks, not creativity assessment.
- Add optional Dino play on connection loss and initial account-load failure. Opening it must not unmount the practice draft. No score API, messages, AI or payments. No auto-start, auto-submit or forced navigation on reconnect. Tap/Space/ArrowUp jump, visible pause/restart, hidden-tab pause, restrained original SVG art.
- Cache only the versioned, public self-contained offline HTML. Never cache account HTML, APIs or arbitrary assets. Worker continues ignoring non-app navigations and deletes only its own obsolete caches.
- Show accurate local draft persistence feedback, including failure. Physical Android/iPhone, keyboard and microphone acceptance remains separate and cannot be claimed from automated tests.

## Validation

Exercise real game decisions, draft isolation and reload, course filters, ordering retries, runner physics and pause/restart, and service-worker fetch routing using deterministic local fixtures. Run app regressions, broader synthetic suite, TypeScript and production build. Review the complete diff, then use the already authorized deployment and verify `/app` and unchanged public-page copies. No live learner mutations or paid calls.
