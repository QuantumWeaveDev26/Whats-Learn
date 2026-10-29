# Play card and challenge layout

**Goal:** Compact the daily game and practice progress, restore Home mentor help, and make social challenge actions work without crowding the Play hub.

**Scope:** `/app` components/styles/tests only. Keep course accordions and all website pages unchanged. Do not use paid AI, payments or real messages for testing.

## Confirmed decisions

- Daily game becomes a short horizontal card with a small illustration and explicit Play affordance.
- The user selected: keep courses as they are; move only squad/challenge controls to separate screens.
- Play shows compact entry buttons for the weekly tournament, squads and friend challenges. Each opens its own in-app screen with a Back action.
- Friend challenges open a game chooser, then the existing game result supplies its score-sharing link. No invented scores or automatic messages.
- Restore a direct Home mentor-help card.
- Slim the five-stage practice strip; keep every stage readable.
- Opening splash shows only the round symbol from the existing app icon. Preserve “From chat to change.” exactly.

## Verification

- [x] Reproduce the inert friend card and missing mentor shortcut with component tests.
- [x] Implement screen navigation and verify back/return paths and invitation entry.
- [x] Exercise squad create/join/limits/errors against the in-memory API harness and mocked UI.
- [x] Check the compact layout at 320px in the local synthetic preview. The card measured approximately 141px high with no page overflow. Home mentor navigation, friend game selection, squad creation and leaving were verified visually.
- [x] Run app regressions, TypeScript and the production build; verify only allowed app files changed. Results: 59 focused app tests and 252 broader synthetic regressions passed; type check/build/standalone packaging passed. Independent final review found no important bugs.
- [ ] Publish through existing deployment and check the release marker/assets and unchanged website copy.

**Limits:** Browser access was disabled again after the 320px checks. Do not claim the 390px check or completed splash/progress visual verification. No real squads, scores, messages, payments or paid AI requests were created during verification. The existing in-app checkout and backend remain unchanged.
