# App mobile reliability implementation plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix reproducible mobile reliability issues in `/app` while leaving all other website code unchanged.

**Architecture:** Retain the existing React app and authenticated same-origin APIs. Distinguish an expired session from a temporary load failure; retain the last successful snapshot, expose a retry action, and bound snapshot requests. Replace the app worker's personalized HTML cache with a static offline response and limit all worker activity to the app.

**Tech stack:** Existing TypeScript/React, CSS, service worker and Node test runner. No new packages or paid services.

**Scope:** The user has authorized improvements to `/app` and handed over routine implementation decisions. Android and iPhone are the eventual launch targets; native project creation, signing, payments and store submission are separate work and are not represented as complete by these changes.

## Tasks

- [x] Reproduce transient profile/work/context failures and app cache deletion using synthetic tests.
- [x] Fix bounded snapshot loading, preserve successful account state on transient failures and show a usable retry screen/banner.
- [x] Remove personalized app HTML caching; clean up only legacy app shell caches and handle only app navigations.
- [x] Reproduce short-screen sheet clipping, then constrain the app dialog without shrinking input text below 16px.
- [x] Review the app-only diff and run app regressions, type check and production build. Repeat type/build checks after review fixes.
- [x] Add synthetic connection recovery, account-switch, response-body timeout, setup retry and keyboard focus coverage. Keep real-device and native build acceptance explicitly pending.

## Review and evidence

- 45 app regressions pass after the independent review corrections.
- The broader mentor suite passes 251/252; the unchanged website JSX fingerprint test fails on the previously deployed baseline too.
- A 320px-wide mentor composer fit within its content column in the browser. The original plans sheet heading was visibly clipped in a 320 x 360 iframe viewport.
- Browser access was then disabled. The user explicitly selected automated checks only. Post-fix visual verification, physical phone keyboards, platform safe areas and Android/iOS native behaviour remain unverified.
- Review corrections: publish the API account marker only after the active successful refresh; discard old private UI on a confirmed account change; reject mixed-account snapshots; treat body-read timeouts as failures; provide retry after setup save without reposting setup; invalidate refreshes on sign-out.
- Ruling: retain the existing app architecture and branding. No native scaffolding, store signup, billing changes, paid provider tests or shared website fixes are part of this pass.

## Native launch follow-up

The repository currently has a PWA manifest and worker but no Android/iOS project. Reusing the React screens with a locally bundled Capacitor client is one option; rebuilding the screens in React Native is another. This choice needs a separate concrete design covering authentication, native navigation, entitlements, account deletion and release ownership. A remote URL wrapper alone is not a claim of App Store readiness. No native project is scaffolded by this reliability pass.
