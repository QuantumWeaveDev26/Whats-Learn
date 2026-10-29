# Game replay and results implementation plan

> **For agentic workers:** Use superpowers:executing-plans for inline implementation and one final fresh review.

**Goal:** Give the eight mini-games fresh replay question sets and readable numbered ordering results.
**Architecture:** Expand authored banks, then use a pure unseen-deck selector with an account-scoped persistence hook. Feed a stable selected run into the existing game components.
**Tech stack:** Existing React/TypeScript/CSS and Node test harness, no new dependency or paid API.
**Spec:** `docs/superpowers/specs/2026-10-29-game-replay-and-results.md`

## Global constraints
- Preserve game IDs, score scales and the first-attempt ordering score.
- No shared website/API changes. Shared deletion candidate remains unapproved.
- No paid generation, production learner writes or real outbound messages during testing.

## Review focus
- Account changes and storage failures must not mix learner histories or crash gameplay.
- Rerenders, React effects and retries must not consume an extra deck or change a live question.
- New-cycle boundaries must avoid duplicate questions inside a run and immediate repeats when alternatives exist.
- Each authored answer key must identify a real option/line and have a defensible explanation; camera variation must retain the shot framing.
- Unscored retries must remain understandable and not inflate final scores.

### Task 1: Banks and deck selection
- [ ] Add failing pure deck tests: unseen-first, cycle boundary, malformed history, impossible counts, same-run uniqueness and new-bank entries.
- [ ] Expand local banks in an app-only content module. Add bank validity and coverage checks.
- [ ] Implement pure selection, stable game run data and account-scoped persistence with blocked-storage fallback. Run targeted tests.

### Task 2: Replay integration
- [ ] Test stable questions on rerender, fresh question sets after remount, account separation and all eight game run types.
- [ ] Feed selected runs into all game implementations; preserve counts and scoring. Vary shot contexts/compositions and Story Dice prompts.
- [ ] Run existing game, navigation and new replay tests.

### Task 3: Ordering answer and release
- [ ] Test a numbered reference answer, clear first-attempt score after retry, and preserved final score.
- [ ] Replace the long arrow paragraph with numbered steps and a short optional explanation; groom app-only CSS.
- [ ] Run all app tests, broader synthetic checks, TypeScript and production build/package.
- [ ] Fresh whole-change review and regression fixes, then publish using existing authorized autodeploy and verify app assets and unchanged website routes.
