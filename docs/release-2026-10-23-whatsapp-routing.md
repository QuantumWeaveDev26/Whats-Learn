# WhatsApp message routing repair — 23 October 2026

## Failure and fix

The published workflow's `Which Part Is Running?` switch referenced `Hourly At 7 Past`, but that trigger had been renamed to `Due Reminders Every 2 Minutes`. Evaluating the missing reference broke entry routing, including the verification webhook. A wrong-token GET returned an empty HTTP 200 before the repair.

Corrected the switch reference and published workflow `pktkYZFWUH8gPBVN`, active version `29caaf1d-4f68-4762-8520-66a80b68a488`. No send operation was manually invoked. Existing credentials, account controls, signature validation, consent and execution-data privacy settings were preserved.

Updated both checked-in importable workflows and their generators to prevent reintroducing the stale reference. Added regression coverage to CI for trigger existence, branch routing and signature-rejection responses. The generator's reminder cadence matches the current two-minute polling.

## Live verification

- Published version is active and contains no references to missing nodes.
- Wrong-token verification GET now returns HTTP 403 with `Forbidden`.
- Invalid-signature POST now returns HTTP 401 with `Invalid signature`.
- These probes contain no learner messages and cannot send a WhatsApp reply.

## Still needs a real incoming message

The owner must personally send a fresh `Hi` from WhatsApp and confirm reception of the mentor reply. The workflow stores neither successful nor failed execution payloads, so an empty execution search is not evidence that Meta sent no events. If the fresh message still gets no reply, inspect Meta webhook subscription/delivery and credential health through the signed-in dashboards. Actual end-to-end delivery has not been established by webhook rejection checks.
