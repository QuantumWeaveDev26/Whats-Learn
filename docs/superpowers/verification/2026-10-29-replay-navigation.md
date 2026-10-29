# Replay navigation investigation

The reported immediate repetition was not reproduced in the current v8 source. A local React 19.2.8 test renderer mounted the actual GamesHub, GameScreen and all eight game components in StrictMode, completed each game through its controls and tapped Play again twice. All three adjacent runs used disjoint question sets in each game. These are automated lifecycle checks, not browser or physical-device acceptance.

The same test with a score POST that never settles reproduced a separate defect: Play again stayed on the result because navigation awaited score saving. A regression test failed with zero replay callbacks instead of one. Replay now starts immediately, retains the existing score submission, and gives the score save and tournament refresh bounded timeouts. Navigation tests also cover rejected saves.

No evidence establishes why the user's open tab displayed repeated questions. An already-open tab can retain its loaded application version; deploy verification and a fresh app navigation are still needed. The finite authored banks and unseen-first rotation remain unchanged; this patch does not introduce unlimited question generation.

Scope: app components, app tests and this verification note. Shared website pages, APIs and account deletion remain untouched.

Verification: 103 app tests pass; TypeScript, production build and standalone packaging pass. The actual React lifecycle probe passes three runs for each of the eight games with normal saves in StrictMode and again with indefinitely pending saves (48 completed runs total). No paid services or production learner writes were used.

Local evidence (ignored outputs): replay-lifecycle-before.txt (eight normal paths pass, pending save fails), replay-lifecycle-after.txt (all eight normal and pending-save paths pass), replay-navigation-red.txt, replay-navigation-green.txt, replay-followup-tests.txt, replay-followup-types.txt, replay-followup-build.txt and replay-followup-package.txt.
