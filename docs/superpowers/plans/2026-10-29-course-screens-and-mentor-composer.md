# Course task screens and Mentor composer

**Goal:** Give each selected course its own in-app task screen, compact the Practice header and anchor Mentor input above the bottom app navigation with optional dictation.

**Scope:** Only `/app` components, route viewport metadata, styles, documentation and synthetic tests. Preserve shared website pages/APIs, task locks, billing, grading and saved work.

## Requested design

- Course catalogue remains four cards. Selecting one opens only that course's ten tasks and checkpoints, with Back to courses. Phone Back returns to the catalogue before Home. Home course shortcuts open the same screen.
- Practice combines its back action/task number in one row and shows the current stage plus a thin five-segment indicator. Keep stage names accessible and all learning/work controls intact.
- Mentor conversation scrolls independently; text input, mic, Send and Continue on WhatsApp stay at the bottom above navigation.
- The mic uses optional browser SpeechRecognition/webkitSpeechRecognition, captures only after a tap, fills at most 500 characters, never auto-sends, stops on unmount and fails clearly to typed input. Browser recognition may send audio to its own speech service; disclose this in the UI. No paid voice integration.

## Verification

- [x] Reproduce catalogue/detail/back and missing mic/composer behavior in tests.
- [x] Implement the app-only course screen and preserve access rules.
- [x] Implement compact practice and anchored Mentor layout.
- [x] Add and test dictation with a fake recognizer: permission denied, unsupported browser, final transcript, no auto-send and cleanup.
- [x] Run focused app suites, TypeScript, production build and independent review. 67 focused tests and 252 broader synthetic tests passed; type check and standalone production packaging passed. Independent review reported no important bugs and reran 24 focused tests successfully.
- [ ] Publish only the scoped changes; verify live app release/assets and unchanged website content.

Physical microphone/browser keyboard acceptance is separate from synthetic testing. Do not capture real audio, submit real mentor questions, open checkout or send WhatsApp messages during checks.

Browser use remains disabled. This pass makes no new claim of visual, virtual-keyboard or physical-microphone acceptance. Dictation is optional browser speech recognition, not a native voice agent or an offline transcription service.
