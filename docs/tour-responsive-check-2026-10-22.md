# Tour responsive checks — 22 October 2026

## Issues reproduced in the live browser

- At 320 × 568, the bottom tour card covered the course and starter highlights.
- Resizing an active tour to 844 × 390 could leave its target outside the viewport.
- Desktop floating launchers measured 68px and 67.6px rather than one exact height.

## Changes

- Both launchers share exact height and bottom-offset tokens: 68px desktop, 52px mobile. Their green, typography, icon-circle styling and rounded shape remain shared.
- Tour placement reserves space above the card, or beside it when landscape provides room.
- Highlight geometry clips to the available visible area. Tall sections remain scrollable.
- Rotation, viewport resize and card-content reflow reposition the target. Ordinary steps use smooth scrolling, with reduced-motion support.
- Client navigation, target readiness, retry, keyboard focus and existing tour content are preserved.

## Verification

- Public five-step live tour completed before the fix at desktop and 390 × 844; Next/Back and page/tab transitions worked.
- Reproduced narrow-screen and rotation faults and verified their fixes locally at 320 × 568 and 844 × 390.
- Local desktop launcher measurements at 1440 × 900: both 68px, bottom edge 876px, identical computed title font and background.
- Added regression coverage for narrow portrait, landscape, oversized highlights and shared launcher dimensions.
- Production build and TypeScript check passed. The nonpayment suite passed 563 checks before the final shared-dimension assertion was added; the complete tour-specific suite then passed all 8 checks.
- Account-only production steps require an authenticated browser session. The browser was signed out during this check; no account or WhatsApp data was changed.

Live follow-up results and screenshots are kept in the ignored local verification folder `.superpowers/sdd/2026-10-22-tour-reliability/`.
