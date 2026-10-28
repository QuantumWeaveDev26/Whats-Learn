# WhatsLearn app mobile grooming

## Agreed direction

The user selected refinement of the current green design, with Android and iPhone releases following product grooming. Continue improving the existing `/app` experience. Preserve the main website and its shared APIs, database, accounts and billing.

## Approach

Refine the existing React screens and app-scoped styles rather than replace the visual identity or scaffold a native app during this phase. Keep modest icons, calm surfaces, one clear primary action, readable form text and generous touch targets. Existing green branding, course colours, content, progress and permissions remain authoritative.

## Screen design

- Home: one Continue action, compact progress summary and a swipeable course row.
- Courses: compact collapsed course summaries, explicit expansion labels and clear locked/completed task states.
- Practice: consistent heading and task context, short form sections, saved draft status, concrete missing-field guidance and accessible feedback.
- Mentor: readable wrapping messages, a full-width composer, explicit task context and sufficiently large suggestion/send controls.
- Me: consistent account rows, concise learning information and accessible settings/plan actions.
- Setup/sign-in: consistent forms, 16px input text and a retry route when post-save loading fails.
- Shared app states: account-safe retry, isolated offline response, scrollable short-screen sheets, keyboard focus containment and a clear close action.

## Verification boundary

Use synthetic accounts and responses; never spend money or AI reviews. The user requested automated-only completion after browser access was disabled. Unit/integration tests and production compilation do not establish physical Android/iPhone acceptance. Native packaging, signing, device keyboard testing, store policy/billing review and store submission follow this design phase.
