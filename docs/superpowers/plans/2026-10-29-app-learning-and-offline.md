# App learning and offline play implementation plan

> **For agentic workers:** Use superpowers:executing-plans to implement task-by-task, with one fresh final review.

**Goal:** Add useful learning improvements and optional offline Dino play to `/app`.
**Architecture:** Existing React components plus an explicit public offline HTML fallback; account-specific practice data stays outside service-worker caches.
**Tech Stack:** React, TypeScript, vanilla JavaScript, existing Node test harness.
**Spec:** `docs/superpowers/specs/2026-10-29-app-learning-and-offline-design.md`

## Global constraints

- App-only changes; preserve root website and shared APIs.
- No new dependencies, paid calls, production learner writes or messages.
- No personalized HTML or API caching. Optional play never replaces or submits a draft.

## Review focus

- Reconnection and opening/closing the runner preserve mounted practice and do not force navigation.
- Public offline cache never falls back to unrelated/private cache entries; first installation failure remains recoverable.
- Hidden tabs, repeated inputs, short viewports and keyboard focus do not cause runaway animation or trapped controls.
- Client mission account switches, malformed drafts and blocked storage remain safe and accurately disclosed.
- Retrying ordering rounds does not inflate first-attempt scores or duplicate submissions.

### Task 1: Public offline Dino and safe worker

Files: `public/app-offline.html`, `public/app-sw.js`, `tests/app-offline-dino.test.cjs`, `tests/app-mobile-reliability.test.cjs`.
- [x] Write failing runner interaction/physics and worker isolation tests; run `node --test tests/app-offline-dino.test.cjs tests/app-mobile-reliability.test.cjs`. Expected: missing game/fallback assertions fail.
- [x] Implement an original green runner, explicit start/pause/restart, hidden-tab pause, and an exact public-asset cache.
- [x] Run the same tests. Expected: all pass. Commit.

### Task 2: Recommendations and game feedback

Files: `components/whatslearn-app/games.tsx`, `games-data.ts`, app wiring, app CSS, `tests/app-learning-improvements.test.cjs`.
- [x] Write failing tests for course-specific feature/filter, ordering retry score protection, and transparent creative scoring.
- [x] Implement recommendations, filters, explanation data, retry and scoring disclosure. Expected: new and existing game/navigation tests pass. Commit.

### Task 3: Client mission

Files: `components/whatslearn-app/client-mission.tsx`, games navigation, app CSS, learning tests.
- [x] Test audience consequences, required work/revision, account-isolated draft reload and storage failure before implementation.
- [x] Implement café mission, local draft/checklist, no API calls or course credit. Expected: learning tests pass. Commit.

### Task 4: Offline integration and release

Files: app, practice draft status, Home task purpose, tests and scoped CSS.
- [x] Test optional runner navigation, practice retention and no forced reconnect transition before implementation.
- [x] Integrate runner in a focused app overlay with close/return controls and accessible title; retain existing practice mount.
- [x] Run all app tests, broader synthetic regression, TypeScript, production build/package, diff scope checks. Expected: all pass.
- [x] Fresh whole-change review; fix important findings with regression tests.
- [ ] Commit, publish through existing authorized autodeploy; probe live release, public runner and unchanged main website routes.
