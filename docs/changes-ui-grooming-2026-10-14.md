# UI grooming handover — 2026-10-14

This ZIP is a separate copy of the supplied v56 project. The original ZIP was not changed.

## UI changes

- Added the native animated mascot, responsive card hierarchy, card hover and press effects, scroll reveals, compact progress cues and mobile spacing refinements.
- Shortened only selected crowded UI labels while preserving course names, learning content, scoring and mission logic.
- Added a WhatsApp contact configuration test.

## Account and WhatsApp changes

- Updated the direct WhatsApp Business chat number to `+91 91879 51536`.
- Kept the existing real email/password sign-up, sign-in, confirmation, reset-password and sign-out flows.
- Clarified the WhatsApp dialog: it opens a direct message draft to the WhatsLearn team.
- Added `docs/sign-in-whatsapp-launch-handover.md` with the required secure deployment settings.

## Verification

- `tests/whatsapp-contact.cjs` passes.
- UI static tests pass where dependencies are not needed.
- Type checking, full test suite and build could not run in this copy because `typescript` and other packages were unavailable after the package registry connection was refused. No claim is made that those checks passed.
